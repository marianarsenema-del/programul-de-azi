// Factura de comision (Oblio): platforma → gazdă, doar când comisionul salvat pe rezervare este > 0 (rezervările din promoție nu au factură).
// Se emite după ce banii au fost viruți gazdei (la 24 de ore după check-in) sau, la anulare cu penalitate, din comisionul penalității (același mecanism: comisionul rămas pe plățile rezervării).
// Oprit implicit: necesită OBLIO_LIVE=true și OBLIO_EMAIL, OBLIO_SECRET (tokenul din contul Oblio), OBLIO_CIF (CUI-ul firmei emitente) și OBLIO_SERIES.
//   OBLIO_VAT_PERCENT (implicit 0 = neplătitor de TVA), OBLIO_VAT_NAME (implicit „Normala” / „SDD” la 0), OBLIO_VAT_INCLUDED (implicit true: comisionul de 8% se consideră cu TVA inclus).
// Idempotență: câte o singură factură pe rezervare (UNIQUE), rând revendicat atomic înainte de apel; la eroare explicită Oblio se reîncearcă (max. 5),
// la rezultat incert (timeout/rețea) rândul trece în „check”: NU se retrimite automat, ca să nu apară facturi duble — se verifică manual.
"use strict";
const { dbPool } = require("./static");
const L = require("./logic");

const E = L.escapeHtml;
const env = process.env;
const ENABLED = env.OBLIO_LIVE === "true" && !!env.OBLIO_EMAIL && !!env.OBLIO_SECRET && !!env.OBLIO_CIF && !!env.OBLIO_SERIES;
const BASE = env.OBLIO_BASE || "https://www.oblio.eu";
const MAX_ATTEMPTS = 5;
const fmtRon = (b) => (b / 100).toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " RON";
const todayRo = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(new Date());

let tokenCache = null;
async function getToken(fetchFn) {
  if (tokenCache && tokenCache.exp > Date.now() + 60000) return tokenCache.token;
  const resp = await fetchFn(BASE + "/api/authorize/token", { method: "POST", signal: AbortSignal.timeout(10000), headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: env.OBLIO_EMAIL, client_secret: env.OBLIO_SECRET }) });
  const j = await resp.json();
  if (!resp.ok || !j.access_token) { const e = new Error("autentificare Oblio eșuată"); e.definite = true; throw e; }
  tokenCache = { token: j.access_token, exp: Date.now() + (Number(j.expires_in) || 3000) * 1000 };
  return tokenCache.token;
}

// clientul facturii: firmă (cu CUI) sau persoană fizică (nume + adresă, fără CNP)
function clientOf(o) {
  const cui = String(o.company_cui || "").replace(/^RO/i, "").trim();
  const email = o.billing_email || o.email || "";
  if (cui) return { ok: !!(o.company_name && o.company_address), data: { cif: (o.company_vat_payer ? "RO" : "") + cui, name: o.company_name || "", rc: o.company_reg_com || "", address: o.company_address || "", country: "Romania", email, vatPayer: !!o.company_vat_payer, save: false } };
  const name = String(o.name || "").trim();
  return { ok: !!(name && o.company_address), data: { cif: "", name, address: o.company_address || "", country: "Romania", email, vatPayer: false, save: false } };
}
function invoiceBody(client, reservation, amountBani) {
  const vat = Number(env.OBLIO_VAT_PERCENT) || 0;
  const included = env.OBLIO_VAT_INCLUDED !== "false";
  return {
    cif: env.OBLIO_CIF, client, issueDate: todayRo(), seriesName: env.OBLIO_SERIES, language: "RO", precision: 2, currency: "RON", useStock: 0,
    mentions: `Comision pentru rezervarea #${reservation.id} (${reservation.ci} – ${reservation.co}), ${reservation.listing_name}`,
    internalNote: "OHT-COM-" + reservation.id,
    products: [{ name: `Comision intermediere rezervare #${reservation.id} · ${reservation.listing_name}`, price: amountBani / 100, measuringUnit: "buc", currency: "RON", vatName: vat > 0 ? (env.OBLIO_VAT_NAME || "Normala") : (env.OBLIO_VAT_NAME || "SDD"), vatPercentage: vat, vatIncluded: included, quantity: 1, productType: "Serviciu" }],
  };
}

// Emite facturile de comision care s-au copt. Întoarce numărătoarea. sendMail(to, subject, html) vine din bookings-pay.
async function runInvoices(sendMail, fetchFn) {
  const out = { issued: 0, failed: 0, missing: 0, check: 0 };
  if (!ENABLED || !dbPool) return out;
  fetchFn = fetchFn || fetch;
  const started = Date.now();
  // o revendicare rămasă „creating” (procesul s-a oprit în timpul apelului) nu se reia automat: rezultat incert → verificare manuală
  await dbPool.query(`UPDATE booking_invoices SET status = 'check', last_error = 'întrerupt în timpul emiterii', updated_at = now() WHERE status = 'creating' AND updated_at < now() - interval '30 minutes'`);
  // rezervări cu toate plățile încheiate (virate sau anulate), cel puțin una virată, comision total > 0, fără factură emisă
  const due = (await dbPool.query(
    `SELECT r.id, r.listing_id, l.owner_id, l.name AS listing_name, to_char(r.check_in,'YYYY-MM-DD') AS ci, to_char(r.check_out,'YYYY-MM-DD') AS co, SUM(p.commission_bani)::int AS commission_bani
       FROM booking_reservations r JOIN accommodation_listings l ON l.id = r.listing_id JOIN booking_payouts p ON p.reservation_id = r.id
      WHERE NOT EXISTS (SELECT 1 FROM booking_invoices i WHERE i.reservation_id = r.id AND i.kind = 'commission' AND (i.status IN ('issued','check','creating') OR i.attempts >= ${MAX_ATTEMPTS}))
        AND NOT EXISTS (SELECT 1 FROM booking_payouts q WHERE q.reservation_id = r.id AND q.status = 'pending')
        AND EXISTS (SELECT 1 FROM booking_payouts q WHERE q.reservation_id = r.id AND q.status = 'paid')
      GROUP BY r.id, r.listing_id, l.owner_id, l.name, r.check_in, r.check_out HAVING SUM(p.commission_bani) > 0 ORDER BY r.id LIMIT 20`)).rows;
  for (const row of due) {
    if (Date.now() - started > 40000) break;
    const o = (await dbPool.query(`SELECT * FROM accommodation_owners WHERE id = $1`, [row.owner_id])).rows[0];
    if (!o) continue;
    const cl = clientOf(o);
    // revendicare atomică (o singură factură pe rezervare); reluarea după „failed”/„missing_data” permisă
    const claim = await dbPool.query(
      `INSERT INTO booking_invoices (reservation_id, owner_id, kind, amount_bani, status, attempts) VALUES ($1,$2,'commission',$3,$4,0)
       ON CONFLICT (reservation_id, kind) DO UPDATE SET status = EXCLUDED.status, amount_bani = EXCLUDED.amount_bani, updated_at = now() WHERE booking_invoices.status IN ('failed','missing_data') AND booking_invoices.attempts < ${MAX_ATTEMPTS} RETURNING id, status, notified`,
      [row.id, row.owner_id, row.commission_bani, cl.ok ? "creating" : "missing_data"]);
    if (!claim.rowCount) continue;
    const inv = claim.rows[0];
    if (!cl.ok) { // fără nume/adresă de facturare: nu emitem; anunțăm gazda o singură dată
      out.missing++;
      if (!inv.notified && o.email) {
        await sendMail(o.billing_email || o.email, "Completează datele de facturare · Opening Hours Today", `<p>Pentru rezervarea #${row.id} (${E(row.listing_name)}) trebuie să emitem factura de comision (${E(fmtRon(row.commission_bani))}), dar lipsesc datele de facturare.</p><p>Intră în contul tău → Date fiscale și completează numele (sau firma, cu CUI) și adresa. Factura se emite automat după aceea.</p>`);
        await dbPool.query(`UPDATE booking_invoices SET notified = true WHERE id = $1`, [inv.id]);
      }
      continue;
    }
    let unsure = false, err = null, data = null;
    try {
      const token = await getToken(fetchFn);
      let resp;
      try {
        resp = await fetchFn(BASE + "/api/docs/invoice", { method: "POST", signal: AbortSignal.timeout(20000), headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(invoiceBody(cl.data, row, row.commission_bani)) });
      } catch (e) { unsure = true; throw e; } // cererea poate fi ajuns la Oblio fără să știm răspunsul
      let j = null; try { j = await resp.json(); } catch (e) { unsure = true; }
      if (resp.ok && j && j.data && (j.data.number || j.data.link)) data = j.data;
      else if (!unsure) { err = new Error((j && (j.statusMessage || j.message)) || ("HTTP " + resp.status)); if (resp.status >= 500) unsure = true; }
      else err = new Error("răspuns Oblio ilizibil");
    } catch (e) { err = e; if (e.definite) unsure = false; else if (!unsure) unsure = true; }
    if (data) {
      await dbPool.query(`UPDATE booking_invoices SET status = 'issued', series = $2, number = $3, link = $4, issued_at = now(), attempts = attempts + 1, last_error = NULL, updated_at = now() WHERE id = $1`, [inv.id, data.seriesName || env.OBLIO_SERIES, String(data.number || ""), data.link || null]);
      out.issued++;
      await sendMail(o.billing_email || o.email, "Factura de comision · rezervarea #" + row.id, `<p>Am emis factura pentru comisionul platformei (${E(fmtRon(row.commission_bani))}) aferent rezervării #${row.id} la <b>${E(row.listing_name)}</b>, ${row.ci} – ${row.co}.</p>${data.link ? `<p><a href="${E(data.link)}">Deschide factura ${E((data.seriesName || env.OBLIO_SERIES) + " " + (data.number || ""))}</a></p>` : ""}`);
    } else {
      const msg = String((err && err.message) || "eroare").slice(0, 200);
      await dbPool.query(`UPDATE booking_invoices SET status = $2, attempts = attempts + 1, last_error = $3, updated_at = now() WHERE id = $1`, [inv.id, unsure ? "check" : "failed", msg]);
      if (unsure) { out.check++; console.error("oblio: rezultat incert, verifică manual rezervarea", row.id, msg); } else out.failed++;
    }
  }
  return out;
}

module.exports = { ENABLED, runInvoices, clientOf, invoiceBody };

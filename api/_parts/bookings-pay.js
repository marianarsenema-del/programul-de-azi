// Rezervări cazare — ETAPA 2: plăți online prin Stripe (avans 30% + rest automat, sau 100%), plata către gazdă prin Stripe Connect.
// OPRIT implicit: funcționează doar dacă BOOKINGS_PAYMENTS_LIVE=true și există STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_BOOKINGS_WEBHOOK_SECRET.
// Fără apeluri către SDK-ul Stripe: doar HTTPS direct (fetch), ca să nu adăugăm dependențe.
// Model: „separate charges and transfers” — banii intră la platformă, iar gazda primește (suma − comision) la 24 de ore după check-in.
"use strict";
const crypto = require("crypto");
const core = require("./bookings-core");
const { dbPool, STRIPE_SECRET_KEY, RESEND_API_KEY, INTL_DOMAIN } = require("./static");
const L = require("./logic");
const forms = require("./bookings-forms");

const PUBLISHABLE = process.env.STRIPE_PUBLISHABLE_KEY || "";
const WEBHOOK_SECRET = process.env.STRIPE_BOOKINGS_WEBHOOK_SECRET || "";
const LIVE = process.env.BOOKINGS_PAYMENTS_LIVE === "true" && !!STRIPE_SECRET_KEY && !!PUBLISHABLE && !!WEBHOOK_SECRET;
const STRIPE_VERSION = "2024-06-20";
const E = L.escapeHtml;
const sha = core.sha256;
const siteBase = () => "https://" + (INTL_DOMAIN || "opening-hours-today.eu");
const fmtRon = (b) => (b / 100).toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " RON";
const dRo = (s) => { const [y, m, d] = String(s).slice(0, 10).split("-"); return `${d}.${m}.${y}`; };
const tokenOf = (rid) => core.deriveToken(rid, process.env.ACCOMMODATION_SESSION_SECRET || "");

// ---------- Stripe HTTP ----------
function flatten(obj, prefix, out) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") flatten(v, key, out);
    else out.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(v)));
  }
  return out;
}
async function stripeReq(method, path, params, idem) {
  const headers = { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, "Stripe-Version": STRIPE_VERSION };
  let url = "https://api.stripe.com/v1" + path, body;
  const qs = params ? flatten(params, "", []).join("&") : "";
  if (method === "GET") { if (qs) url += "?" + qs; }
  else { headers["Content-Type"] = "application/x-www-form-urlencoded"; body = qs; if (idem) headers["Idempotency-Key"] = idem; }
  try {
    const res = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(15000) });
    const j = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, data: j } : { ok: false, error: j.error || { message: "stripe_error" }, status: res.status };
  } catch (e) { return { ok: false, error: { message: "retea" }, status: 0 }; }
}
// semnătura webhook-ului: HMAC-SHA256 peste „timestamp.corp”, toleranță 5 minute
function verifySig(raw, header, secret, nowSec) {
  if (!Buffer.isBuffer(raw) || typeof header !== "string" || !secret) return false;
  const parts = header.split(",").map((x) => x.trim().split("="));
  const t = (parts.find((p) => p[0] === "t") || [])[1];
  const sigs = parts.filter((p) => p[0] === "v1").map((p) => p[1]);
  if (!t || !/^\d+$/.test(t) || !sigs.length) return false;
  if (Math.abs((nowSec || Math.floor(Date.now() / 1000)) - Number(t)) > 300) return false;
  const exp = crypto.createHmac("sha256", secret).update(t + "." + raw.toString("utf8")).digest("hex");
  return sigs.some((s) => s.length === exp.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(exp)));
}

async function sendMail(to, subject, html) {
  if (!RESEND_API_KEY || !to) return false;
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Opening Hours Today <cazare@programul-de-azi.ro>", to: [to], subject, html }),
    });
    return resp.ok;
  } catch (e) { return false; }
}

const RES_SELECT = `SELECT r.*, to_char(r.check_in,'YYYY-MM-DD') AS ci, to_char(r.check_out,'YYYY-MM-DD') AS co, to_char(r.rest_due_on,'YYYY-MM-DD') AS rest_due, l.name AS listing_name, l.owner_id AS owner_id, o.email AS owner_email
  FROM booking_reservations r JOIN accommodation_listings l ON l.id = r.listing_id JOIN accommodation_owners o ON o.id = l.owner_id`;
const roomsOf = (snap) => { const n = snap && !Array.isArray(snap) && snap.units ? snap.units.map((u) => u.name).filter(Boolean) : []; return n.length ? "<br>Camere: " + n.map(E).join(", ") : ""; };
const pairsOf = (snap) => snap.units.flatMap((u) => u.nights.map((n) => [u.unit_no, n.day]));

// ---------- confirmare după plată ----------
async function mailConfirmed(row) {
  const link = `${siteBase()}/cazare/rezervare/${tokenOf(row.id)}`;
  const period = `${dRo(row.ci)} – ${dRo(row.co)}`;
  const payTxt = row.pay_scheme === "advance"
    ? `Ai plătit avansul de <b>${fmtRon(row.advance_bani)}</b>. Restul de <b>${fmtRon(row.rest_bani)}</b> se debitează automat de pe același card pe <b>${dRo(row.rest_due)}</b>; cu 3 zile înainte primești un memento.`
    : `Ai plătit integral <b>${fmtRon(row.total_bani)}</b>.`;
  await sendMail(row.guest_email, "Rezervare confirmată · " + row.listing_name,
    `<p>Bună, ${E(row.guest_name)},</p><p>Rezervarea ta la <b>${E(row.listing_name)}</b> este confirmată.</p><p>Perioada: ${period} · ${row.guests} persoane${roomsOf(row.nights_snapshot)}<br>Total: <b>${fmtRon(row.total_bani)}</b></p><p>${payTxt}</p>${row.guarantee_bani > 0 ? `<p>Garanție: <b>${fmtRon(row.guarantee_bani)}</b>. Suma se blochează pe card (nu se debitează) cu o zi înainte de sosire și se eliberează automat după plecare, dacă nu există daune.</p>` : ""}${forms.ENABLED ? `<p>Înainte de sosire, completează <a href="${siteBase()}/cazare/fisa/${tokenOf(row.id)}">fișa de cazare</a> pentru fiecare oaspete (cerință legală).</p>` : ""}<p><a href="${link}">Vezi rezervarea</a></p>`);
  await sendMail(row.owner_email, "Rezervare nouă (plătită online) · " + row.listing_name,
    `<p>Ai o rezervare nouă confirmată la <b>${E(row.listing_name)}</b>.</p><p>${E(row.guest_name)} · ${E(row.guest_phone)} · ${E(row.guest_email)}<br>Perioada: ${period} · ${row.guests} persoane${roomsOf(row.nights_snapshot)} · ${fmtRon(row.total_bani)}</p><p>Plata se face prin Opening Hours Today; banii îți ajung în cont la 24 de ore după check-in.</p>`);
}

async function insertPayout(client, row, pi, gross, commission) {
  await client.query(
    `INSERT INTO booking_payouts (reservation_id, listing_id, owner_id, pi_id, charge_id, gross_bani, commission_bani, amount_bani, due_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, (($9::date + 1)::timestamp + interval '12 hours') AT TIME ZONE 'Europe/Bucharest') ON CONFLICT (pi_id) DO NOTHING`,
    [row.id, row.listing_id, row.owner_id, pi.id, typeof pi.latest_charge === "string" ? pi.latest_charge : null, gross, commission, gross - commission, row.ci]);
}

// Se apelează în tranzacție. Întoarce acțiunile de făcut după COMMIT (e-mailuri, rambursare).
async function onPaymentSucceeded(client, pi) {
  const md = pi.metadata || {};
  const rid = Number(md.reservation_id), kind = md.kind;
  if (!Number.isInteger(rid) || !["advance", "full", "rest"].includes(kind)) return {};
  const lid = (await client.query(`SELECT listing_id FROM booking_reservations WHERE id = $1`, [rid])).rows[0];
  if (!lid) return {};
  await client.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [lid.listing_id]);
  const row = (await client.query(RES_SELECT + ` WHERE r.id = $1 FOR UPDATE OF r`, [rid])).rows[0];
  if (!row) return {};
  const amount = Number(pi.amount_received || pi.amount || 0);
  const split = core.splitCommission(row.commission_bani, row.advance_bani, row.total_bani);
  if (kind === "rest") {
    await client.query(`UPDATE booking_reservations SET paid_bani = paid_bani + $2, pay_status = 'paid', rest_deadline = NULL WHERE id = $1`, [rid, amount]);
    await insertPayout(client, row, pi, amount, split.rest);
    return { mail: "rest_paid", row };
  }
  // avans sau plată integrală
  if (row.status === "cancelled" || row.status === "confirmed" && row.paid_bani > 0) {
    if (row.status === "cancelled") return { refund: { pi: pi.id, amount }, row, reason: "anulata" };
    return {};
  }
  const pairs = pairsOf(row.nights_snapshot);
  let secured = (await client.query(`UPDATE booking_calendar_days SET status = 4, blocked_until = NULL, updated_at = now() WHERE reservation_id = $1 AND status IN (3,4)`, [rid])).rowCount === pairs.length;
  if (!secured) { // blocarea de 10-12 minute a expirat înainte de plată: încercăm să luăm zilele din nou
    await client.query(`DELETE FROM booking_calendar_days WHERE listing_id = $1 AND status = 3 AND blocked_until < now()`, [row.listing_id]);
    await client.query(`INSERT INTO booking_calendar_days (listing_id, unit_id, day, status, reservation_id) SELECT $1, t.u::smallint, t.d, 4, $2 FROM unnest($3::int[], $4::date[]) AS t(u, d) ON CONFLICT (listing_id, unit_id, day) DO NOTHING`,
      [row.listing_id, rid, pairs.map((x) => x[0]), pairs.map((x) => x[1])]);
    secured = (await client.query(`SELECT COUNT(*)::int AS c FROM booking_calendar_days WHERE reservation_id = $1 AND status = 4`, [rid])).rows[0].c === pairs.length;
    if (!secured) await client.query(`DELETE FROM booking_calendar_days WHERE reservation_id = $1`, [rid]);
  }
  if (!secured) { // altcineva a luat între timp zilele: rambursăm tot și anunțăm turistul
    await client.query(`UPDATE booking_reservations SET status = 'cancelled', cancelled_at = now(), cancelled_by = 'system', pay_status = 'refund_failed' WHERE id = $1`, [rid]);
    return { refund: { pi: pi.id, amount }, row, reason: "indisponibil" };
  }
  await client.query(
    `UPDATE booking_reservations SET status = 'confirmed', confirmed_at = now(), hold_until = NULL, code_hash = NULL, paid_bani = paid_bani + $2, pay_status = $3, stripe_pm_id = COALESCE($4, stripe_pm_id) WHERE id = $1`,
    [rid, amount, kind === "full" ? "paid" : "partial", typeof pi.payment_method === "string" ? pi.payment_method : null]);
  await insertPayout(client, row, pi, amount, kind === "full" ? row.commission_bani : split.advance);
  return { mail: "confirmed", row: { ...row, pay_scheme: row.pay_scheme } };
}

async function afterCommit(act) {
  if (!act || !act.row) return;
  if (act.mail === "confirmed") await mailConfirmed(act.row);
  else if (act.mail === "rest_paid") {
    await sendMail(act.row.guest_email, "Plata a fost încasată · " + act.row.listing_name, `<p>Bună, ${E(act.row.guest_name)},</p><p>Restul de <b>${fmtRon(act.row.rest_bani)}</b> pentru rezervarea la <b>${E(act.row.listing_name)}</b> a fost încasat. Rezervarea ta este achitată integral.</p>`);
  } else if (act.refund) {
    const rf = await stripeReq("POST", "/refunds", { payment_intent: act.refund.pi, amount: act.refund.amount, metadata: { reservation_id: act.row.id, reason: act.reason } }, `bk-refund-${act.refund.pi}`);
    if (rf.ok) await dbPool.query(`UPDATE booking_reservations SET pay_status = 'refunded', refunded_bani = refunded_bani + $2 WHERE id = $1`, [act.row.id, act.refund.amount]);
    else console.error("rezervari: rambursare eșuată pentru rezervarea", act.row.id, rf.error && rf.error.message);
    await sendMail(act.row.guest_email, "Rezervarea nu a putut fi confirmată · " + act.row.listing_name,
      `<p>Bună, ${E(act.row.guest_name)},</p><p>Din păcate perioada aleasă la <b>${E(act.row.listing_name)}</b> nu a mai fost disponibilă în momentul plății. Suma de ${fmtRon(act.refund.amount)} îți este returnată integral și apare pe card în câteva zile. Ne cerem scuze și te invităm să alegi o altă perioadă.</p>`);
  }
}

async function markRestFailed(rid, piId) {
  const up = await dbPool.query(
    `UPDATE booking_reservations SET pay_status = 'rest_failed', rest_deadline = COALESCE(rest_deadline, now() + interval '48 hours'), rest_attempts = rest_attempts + 1, pi_rest = COALESCE($2, pi_rest)
      WHERE id = $1 AND pay_status = 'partial' RETURNING id`, [rid, piId || null]);
  if (!up.rowCount) return;
  const row = (await dbPool.query(RES_SELECT + ` WHERE r.id = $1`, [rid])).rows[0];
  if (!row) return;
  await sendMail(row.guest_email, "Plata restului nu a reușit · " + row.listing_name,
    `<p>Bună, ${E(row.guest_name)},</p><p>Banca a respins plata restului de <b>${fmtRon(row.rest_bani)}</b> pentru rezervarea la <b>${E(row.listing_name)}</b>.</p><p>Ai <b>48 de ore</b> să plătești cu alt card, printr-un link securizat:</p><p><a href="${siteBase()}/cazare/plata/${tokenOf(rid)}">Plătește restul</a></p><p>Dacă nu plătești în 48 de ore, rezervarea se anulează și avansul se pierde.</p>`);
}

async function handleEvent(ev) {
  const obj = ev.data && ev.data.object;
  if (!obj) return;
  if (ev.type === "payment_intent.succeeded") {
    if (!obj.metadata || !obj.metadata.reservation_id) return;
    const client = await dbPool.connect();
    let act;
    try {
      await client.query("BEGIN");
      const ins = await client.query(`INSERT INTO booking_stripe_events (event_id, type) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [ev.id, ev.type]);
      if (!ins.rowCount) { await client.query("ROLLBACK"); return; } // deja procesat
      act = await onPaymentSucceeded(client, obj);
      await client.query("COMMIT");
    } catch (e) { await client.query("ROLLBACK").catch(() => {}); throw e; } finally { client.release(); }
    await afterCommit(act);
  } else if (ev.type === "payment_intent.payment_failed") {
    if (obj.metadata && obj.metadata.kind === "rest" && obj.metadata.reservation_id) await markRestFailed(Number(obj.metadata.reservation_id), obj.id);
  }
}
// înregistrat în server.js ÎNAINTEA parserului JSON (are nevoie de corpul brut)
async function webhook(req, res, next) {
  if (!LIVE || !dbPool) return next();
  if (!verifySig(req.body, req.headers["stripe-signature"], WEBHOOK_SECRET)) return res.status(400).send("bad signature");
  let ev;
  try { ev = JSON.parse(req.body.toString("utf8")); } catch (e) { return res.status(400).send("bad body"); }
  try { await handleEvent(ev); res.status(200).json({ received: true }); }
  catch (e) { console.error("rezervari webhook:", e.message); res.status(500).send("retry"); }
}

// ---------- garanție (blocare pe card, fără debitare) ----------
async function releaseGuarantee(row) {
  try {
    if (row && row.guarantee_status === "held" && row.guarantee_pi) {
      await stripeReq("POST", `/payment_intents/${row.guarantee_pi}/cancel`, {}, `bk-gcancel-${row.guarantee_pi}`);
      await dbPool.query(`UPDATE booking_reservations SET guarantee_status = 'released' WHERE id = $1 AND guarantee_status = 'held'`, [row.id]);
    }
  } catch (e) { console.error("rezervari: eliberare garanție:", e.message); }
}
// Gazda reține (parțial sau total) din garanție, până a doua zi după check-out. Banii merg la gazdă prin același mecanism de plată, fără comision.
async function claimGuarantee(row, amountBani, note) {
  if (row.guarantee_status !== "held" || !row.guarantee_pi) return { ok: false, error: "garantie_indisponibila" };
  if (!Number.isInteger(amountBani) || amountBani < 1 || amountBani > row.guarantee_bani) return { ok: false, error: "suma_invalida" };
  if (core.todayRo() > core.addDays(row.co, 1)) return { ok: false, error: "termen_expirat" };
  const cap = await stripeReq("POST", `/payment_intents/${row.guarantee_pi}/capture`, { amount_to_capture: amountBani }, `bk-gcap-${row.id}-${amountBani}`);
  if (!cap.ok) { console.error("rezervari: captură garanție eșuată", row.id, cap.error && cap.error.message); return { ok: false, error: "captura_esuata" }; }
  await dbPool.query(`UPDATE booking_reservations SET guarantee_status = 'claimed', guarantee_claimed_bani = $2, guarantee_note = $3 WHERE id = $1 AND guarantee_status = 'held'`, [row.id, amountBani, note]);
  await dbPool.query(
    `INSERT INTO booking_payouts (reservation_id, listing_id, owner_id, pi_id, charge_id, gross_bani, commission_bani, amount_bani, due_at) VALUES ($1,$2,$3,$4,$5,$6,0,$6, now()) ON CONFLICT (pi_id) DO NOTHING`,
    [row.id, row.listing_id, row.owner_id, row.guarantee_pi, typeof cap.data.latest_charge === "string" ? cap.data.latest_charge : null, amountBani]);
  await sendMail(row.guest_email, "Din garanția ta s-a reținut o sumă · " + row.listing_name,
    `<p>Bună, ${E(row.guest_name)},</p><p>Gazda de la <b>${E(row.listing_name)}</b> a reținut <b>${fmtRon(amountBani)}</b> din garanția de ${fmtRon(row.guarantee_bani)}. Motiv declarat: ${E(note)}</p><p>Restul garanției a fost eliberat. Dacă nu ești de acord, contactează gazda sau răspunde la acest e-mail.</p>`);
  return { ok: true };
}

// ---------- anulări ----------
async function cancelPendingIntents(row) {
  for (const pi of [row.pi_advance, row.pi_rest]) if (pi) await stripeReq("POST", `/payment_intents/${pi}/cancel`, {}, `bk-cancel-${pi}`); // doar cele neplătite se pot anula; restul întorc eroare, ignorată
}
// Turistul anulează: nu se rambursează nimic (avansul sau totul se pierde); banii merg la gazdă (minus comision) la data plății.
async function cancelByGuest(row) {
  const up = await dbPool.query(`UPDATE booking_reservations SET status = 'cancelled', cancelled_at = now(), cancelled_by = 'guest', pay_status = CASE WHEN pay_scheme <> 'direct' AND paid_bani > 0 THEN 'forfeited' ELSE pay_status END WHERE id = $1 AND status IN ('confirmed','hold') RETURNING id`, [row.id]);
  if (!up.rowCount) return false;
  await dbPool.query(`DELETE FROM booking_calendar_days WHERE reservation_id = $1 AND status IN (3,4)`, [row.id]);
  if (row.pay_scheme !== "direct" && row.pay_status === "partial") await cancelPendingIntents({ pi_rest: row.pi_rest });
  await releaseGuarantee(row);
  return true;
}
// Gazda anulează: rambursare integrală a ce s-a plătit. Dacă o rambursare eșuează, nu anulăm (se poate reîncerca fără dublare).
async function cancelByOwner(row) {
  if (row.pay_scheme !== "direct" && row.paid_bani > 0) {
    const pays = (await dbPool.query(`SELECT * FROM booking_payouts WHERE reservation_id = $1`, [row.id])).rows;
    if (pays.some((p) => p.status === "paid")) return { ok: false, error: "plata_efectuata" };
    for (const p of pays.filter((x) => x.status === "pending")) {
      const rf = await stripeReq("POST", "/refunds", { payment_intent: p.pi_id, amount: p.gross_bani, metadata: { reservation_id: row.id, reason: "gazda" } }, `bk-refund-${p.pi_id}`);
      if (!rf.ok) { console.error("rezervari: rambursare gazdă eșuată", row.id, rf.error && rf.error.message); return { ok: false, error: "rambursare_esuata" }; }
      await dbPool.query(`UPDATE booking_payouts SET status = 'cancelled' WHERE id = $1`, [p.id]);
    }
    await dbPool.query(`UPDATE booking_reservations SET pay_status = 'refunded', refunded_bani = paid_bani WHERE id = $1`, [row.id]);
    await cancelPendingIntents({ pi_rest: row.pi_rest });
  }
  const up = await dbPool.query(`UPDATE booking_reservations SET status = 'cancelled', cancelled_at = now(), cancelled_by = 'owner' WHERE id = $1 AND status IN ('confirmed','hold') RETURNING id`, [row.id]);
  if (up.rowCount) await dbPool.query(`DELETE FROM booking_calendar_days WHERE reservation_id = $1 AND status IN (3,4)`, [row.id]);
  await releaseGuarantee(row);
  return { ok: true };
}

// ---------- cron orar ----------
async function runPaymentCron() {
  const st = { rest_charged: 0, rest_failed: 0, reminders: 0, expired: 0, payouts: 0, payout_errors: 0, guarantee_held: 0, guarantee_failed: 0, guarantee_released: 0 };
  const started = Date.now(), budget = () => Date.now() - started < 45000;
  // 1) restul de plată, debitat automat cu 30 de zile înainte de check-in
  const due = (await dbPool.query(RES_SELECT + ` WHERE r.status = 'confirmed' AND r.pay_scheme = 'advance' AND r.pay_status = 'partial' AND r.pi_rest IS NULL AND r.rest_due_on <= (now() AT TIME ZONE 'Europe/Bucharest')::date ORDER BY r.rest_due_on LIMIT 20`)).rows;
  for (const row of due) {
    if (!budget()) break;
    const r = await stripeReq("POST", "/payment_intents", {
      amount: row.rest_bani, currency: String(row.currency || "RON").toLowerCase(), customer: row.stripe_customer_id, payment_method: row.stripe_pm_id,
      off_session: "true", confirm: "true", description: `Rest rezervare #${row.id} · ${row.listing_name}`, transfer_group: `res_${row.id}`, metadata: { reservation_id: row.id, kind: "rest" },
    }, `bk-res-${row.id}-rest`);
    if (r.ok && r.data.status === "succeeded") { await dbPool.query(`UPDATE booking_reservations SET pi_rest = $2 WHERE id = $1`, [row.id, r.data.id]); st.rest_charged++; }
    else { const piId = r.ok ? r.data.id : (r.error && r.error.payment_intent && r.error.payment_intent.id); await markRestFailed(row.id, piId); st.rest_failed++; }
  }
  // 2) memento cu 3 zile înainte
  const rem = (await dbPool.query(RES_SELECT + ` WHERE r.status = 'confirmed' AND r.pay_status = 'partial' AND r.reminder_sent_at IS NULL AND r.rest_due_on > (now() AT TIME ZONE 'Europe/Bucharest')::date AND r.rest_due_on - 3 <= (now() AT TIME ZONE 'Europe/Bucharest')::date LIMIT 50`)).rows;
  for (const row of rem) {
    const up = await dbPool.query(`UPDATE booking_reservations SET reminder_sent_at = now() WHERE id = $1 AND reminder_sent_at IS NULL RETURNING id`, [row.id]);
    if (!up.rowCount) continue;
    await sendMail(row.guest_email, "Memento: restul rezervării se debitează curând · " + row.listing_name,
      `<p>Bună, ${E(row.guest_name)},</p><p>Pe <b>${dRo(row.rest_due)}</b> vom debita automat <b>${fmtRon(row.rest_bani)}</b> de pe cardul cu care ai plătit avansul, pentru rezervarea la <b>${E(row.listing_name)}</b> (${dRo(row.ci)} – ${dRo(row.co)}).</p><p>Verifică să ai suma disponibilă pe card.</p>`);
    st.reminders++;
  }
  // 3) termen de 48 de ore depășit → rezervarea se anulează, avansul se pierde
  const exp = (await dbPool.query(RES_SELECT + ` WHERE r.status = 'confirmed' AND r.pay_status = 'rest_failed' AND r.rest_deadline < now() LIMIT 20`)).rows;
  for (const row of exp) {
    const up = await dbPool.query(`UPDATE booking_reservations SET status = 'cancelled', cancelled_at = now(), cancelled_by = 'system', pay_status = 'forfeited' WHERE id = $1 AND status = 'confirmed' AND pay_status = 'rest_failed' RETURNING id`, [row.id]);
    if (!up.rowCount) continue;
    await dbPool.query(`DELETE FROM booking_calendar_days WHERE reservation_id = $1 AND status IN (3,4)`, [row.id]);
    await cancelPendingIntents({ pi_rest: row.pi_rest });
    await releaseGuarantee(row);
    await sendMail(row.guest_email, "Rezervare anulată · " + row.listing_name, `<p>Bună, ${E(row.guest_name)},</p><p>Nu am primit plata restului în termen de 48 de ore, așa că rezervarea la <b>${E(row.listing_name)}</b> (${dRo(row.ci)} – ${dRo(row.co)}) a fost anulată. Conform politicii de anulare, avansul nu se returnează.</p>`);
    await sendMail(row.owner_email, "Rezervare anulată (rest neachitat) · " + row.listing_name, `<p>Rezervarea ${E(row.guest_name)} (${dRo(row.ci)} – ${dRo(row.co)}) a fost anulată pentru că restul nu a fost plătit. Zilele sunt din nou libere, iar avansul încasat (minus comisionul) îți va fi plătit la 24 de ore după data check-in.</p>`);
    st.expired++;
  }
  // 3b) garanția: blocare pe card cu o zi înainte de sosire (doar dacă totul e plătit) și eliberare după plecare
  const gnew = (await dbPool.query(RES_SELECT + ` WHERE r.status = 'confirmed' AND r.guarantee_status = 'pending' AND r.guarantee_bani > 0 AND r.pay_status = 'paid' AND r.stripe_pm_id IS NOT NULL AND r.check_in - 1 <= (now() AT TIME ZONE 'Europe/Bucharest')::date AND r.check_out > (now() AT TIME ZONE 'Europe/Bucharest')::date LIMIT 20`)).rows;
  for (const row of gnew) {
    if (!budget()) break;
    const g = await stripeReq("POST", "/payment_intents", {
      amount: row.guarantee_bani, currency: String(row.currency || "RON").toLowerCase(), customer: row.stripe_customer_id, payment_method: row.stripe_pm_id,
      off_session: "true", confirm: "true", capture_method: "manual", description: `Garanție rezervare #${row.id} · ${row.listing_name}`, metadata: { reservation_id: row.id, kind: "guarantee" },
    }, `bk-guar-${row.id}`);
    if (g.ok && g.data.status === "requires_capture") {
      await dbPool.query(`UPDATE booking_reservations SET guarantee_status = 'held', guarantee_pi = $2 WHERE id = $1 AND guarantee_status = 'pending'`, [row.id, g.data.id]);
      await sendMail(row.guest_email, "Garanția a fost blocată pe card · " + row.listing_name, `<p>Bună, ${E(row.guest_name)},</p><p>Am blocat pe cardul tău garanția de <b>${fmtRon(row.guarantee_bani)}</b> pentru <b>${E(row.listing_name)}</b>. Suma NU este debitată și se eliberează automat după plecare, dacă nu există daune.</p>`);
      st.guarantee_held++;
    } else {
      await dbPool.query(`UPDATE booking_reservations SET guarantee_status = 'failed' WHERE id = $1 AND guarantee_status = 'pending'`, [row.id]);
      await sendMail(row.guest_email, "Nu am putut bloca garanția · " + row.listing_name, `<p>Bună, ${E(row.guest_name)},</p><p>Banca nu a permis blocarea garanției de ${fmtRon(row.guarantee_bani)}. Rezervarea rămâne valabilă; te rugăm să te înțelegi cu gazda pentru garanție la sosire.</p>`);
      await sendMail(row.owner_email, "Garanția nu a putut fi blocată · " + row.listing_name, `<p>Pentru rezervarea ${E(row.guest_name)} (${dRo(row.ci)} – ${dRo(row.co)}) nu am putut bloca garanția de ${fmtRon(row.guarantee_bani)} pe card. Poți cere garanția direct, la sosire.</p>`);
      st.guarantee_failed++;
    }
  }
  const grel = (await dbPool.query(RES_SELECT + ` WHERE r.guarantee_status = 'held' AND r.check_out + 2 <= (now() AT TIME ZONE 'Europe/Bucharest')::date LIMIT 30`)).rows;
  for (const row of grel) {
    const c = await stripeReq("POST", `/payment_intents/${row.guarantee_pi}/cancel`, {}, `bk-gcancel-${row.guarantee_pi}`);
    let gone = c.ok;
    if (!gone) { const g = await stripeReq("GET", `/payment_intents/${row.guarantee_pi}`); gone = g.ok && g.data.status === "canceled"; } // blocarea poate fi expirat deja la bancă
    if (!gone) continue;
    await dbPool.query(`UPDATE booking_reservations SET guarantee_status = 'released' WHERE id = $1 AND guarantee_status = 'held'`, [row.id]);
    await sendMail(row.guest_email, "Garanția a fost eliberată · " + row.listing_name, `<p>Bună, ${E(row.guest_name)},</p><p>Garanția de ${fmtRon(row.guarantee_bani)} blocată pe cardul tău pentru <b>${E(row.listing_name)}</b> a fost eliberată. Îți mulțumim pentru sejur!</p>`);
    st.guarantee_released++;
  }
  // 4) plata către gazde
  const pays = (await dbPool.query(
    `SELECT p.*, a.stripe_account_id, r.currency FROM booking_payouts p JOIN booking_owner_payments a ON a.owner_id = p.owner_id AND a.payouts_enabled JOIN booking_reservations r ON r.id = p.reservation_id
      WHERE p.status = 'pending' AND p.due_at <= now() AND p.attempts < 10 ORDER BY p.due_at LIMIT 30`)).rows;
  for (const p of pays) {
    if (!budget()) break;
    const t = await stripeReq("POST", "/transfers", {
      amount: p.amount_bani, currency: String(p.currency || "RON").toLowerCase(), destination: p.stripe_account_id, source_transaction: p.charge_id || undefined,
      transfer_group: `res_${p.reservation_id}`, description: `Rezervare #${p.reservation_id}`, metadata: { reservation_id: p.reservation_id, payout_id: p.id },
    }, `bk-payout-${p.id}`);
    if (t.ok) { await dbPool.query(`UPDATE booking_payouts SET status = 'paid', transfer_id = $2 WHERE id = $1`, [p.id, t.data.id]); st.payouts++; }
    else { await dbPool.query(`UPDATE booking_payouts SET attempts = attempts + 1, last_error = $2 WHERE id = $1`, [p.id, String((t.error && t.error.message) || "eroare").slice(0, 200)]); st.payout_errors++; }
  }
  return st;
}

// ---------- cod client comun (Stripe Payment Element) ----------
const STRIPE_CLIENT_JS = `
function loadStripe(){return new Promise((res,rej)=>{if(window.Stripe)return res();const s=document.createElement('script');s.src='https://js.stripe.com/v3/';s.onload=res;s.onerror=()=>rej(new Error('Nu s-a putut încărca formularul de plată.'));document.head.append(s);});}
async function mountPay(secret,pk,btn,msg,returnUrl,onDone){await loadStripe();const stripe=Stripe(pk);const elements=stripe.elements({clientSecret:secret,locale:'ro'});elements.create('payment').mount('#pe');btn.disabled=false;
btn.onclick=async()=>{btn.disabled=true;say(msg,'Se procesează plata…',true);const r=await stripe.confirmPayment({elements,confirmParams:{return_url:returnUrl},redirect:'if_required'});if(r.error){say(msg,r.error.message||'Plata a eșuat.',false);btn.disabled=false;}else onDone();};}
`;

function mount(r, ctx) {
  const { jsonOnly, ownerApi, ownListing, shell, COMMON_JS, noStore, toId } = ctx;
  const ipKey = (req) => L.hashIp(L.getClientIp(req));
  const live = (req, res, next) => (LIVE ? next() : res.status(404).json({ error: "negasit" }));

  // --- gazda: cont de încasări (Stripe Connect Express) ---
  async function refreshAccount(ownerId) {
    const acc = (await dbPool.query(`SELECT stripe_account_id FROM booking_owner_payments WHERE owner_id = $1`, [ownerId])).rows[0];
    if (!acc) return { connected: false, payouts_enabled: false, details_submitted: false };
    const g = await stripeReq("GET", `/accounts/${acc.stripe_account_id}`);
    if (g.ok) await dbPool.query(`UPDATE booking_owner_payments SET details_submitted = $2, payouts_enabled = $3, updated_at = now() WHERE owner_id = $1`, [ownerId, !!g.data.details_submitted, !!(g.data.payouts_enabled && g.data.capabilities && g.data.capabilities.transfers === "active")]);
    const cur = (await dbPool.query(`SELECT details_submitted, payouts_enabled FROM booking_owner_payments WHERE owner_id = $1`, [ownerId])).rows[0];
    return { connected: true, payouts_enabled: !!cur.payouts_enabled, details_submitted: !!cur.details_submitted };
  }
  r.get("/api/rezervari/plati/stare", L.requireAccommodationOwnerApi, async (req, res) => {
    try {
      noStore(res);
      if (!LIVE) return res.json({ live: false });
      if (!(await L.checkRateLimit("own:" + req.accommodationOwner.ownerId, "rez-pay-state", 30, 10))) return res.status(429).json({ error: "prea_multe_cereri" });
      res.json({ live: true, ...(await refreshAccount(req.accommodationOwner.ownerId)) });
    } catch (e) { console.error("rezervari plati stare:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.post("/api/rezervari/plati/cont", ...ownerApi, live, async (req, res) => {
    try {
      const ownerId = req.accommodationOwner.ownerId;
      if (!(await L.checkRateLimit("own:" + ownerId, "rez-pay-onboard", 10, 10))) return res.status(429).json({ error: "prea_multe_cereri" });
      let acc = (await dbPool.query(`SELECT stripe_account_id FROM booking_owner_payments WHERE owner_id = $1`, [ownerId])).rows[0];
      if (!acc) {
        const email = (await dbPool.query(`SELECT email FROM accommodation_owners WHERE id = $1::integer`, [ownerId])).rows[0];
        const c = await stripeReq("POST", "/accounts", { type: "express", country: "RO", email: email && email.email, capabilities: { transfers: { requested: "true" } }, metadata: { owner_id: ownerId } }, `bk-acct-${ownerId}`);
        if (!c.ok) { console.error("rezervari: creare cont Connect eșuată:", c.error && c.error.message); return res.status(502).json({ error: "Nu am putut crea contul de încasări. Încearcă din nou mai târziu." }); }
        await dbPool.query(`INSERT INTO booking_owner_payments (owner_id, stripe_account_id) VALUES ($1,$2) ON CONFLICT (owner_id) DO NOTHING`, [ownerId, c.data.id]);
        acc = { stripe_account_id: c.data.id };
      }
      const base = L.baseUrlFor(req);
      const link = await stripeReq("POST", "/account_links", { account: acc.stripe_account_id, type: "account_onboarding", refresh_url: base + "/cont/rezervari", return_url: base + "/cont/rezervari" });
      if (!link.ok) return res.status(502).json({ error: "Nu am putut deschide formularul Stripe. Încearcă din nou." });
      res.json({ ok: true, url: link.data.url });
    } catch (e) { console.error("rezervari plati cont:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // --- turist: pornește plata (după ce a confirmat codul și a bifat acordurile) ---
  async function resByToken(rid, token) {
    if (!rid || !/^[a-f0-9]{64}$/.test(String(token))) return null;
    return (await dbPool.query(RES_SELECT + ` WHERE r.id = $1 AND r.access_hash = $2`, [rid, sha(token)])).rows[0] || null;
  }
  async function ensureCustomer(row) {
    if (row.stripe_customer_id) return row.stripe_customer_id;
    const c = await stripeReq("POST", "/customers", { email: row.guest_email, name: row.guest_name, phone: row.guest_phone, metadata: { reservation_id: row.id } }, `bk-cust-${row.id}`);
    if (!c.ok) return null;
    await dbPool.query(`UPDATE booking_reservations SET stripe_customer_id = $2 WHERE id = $1`, [row.id, c.data.id]);
    return c.data.id;
  }
  r.post("/api/rezervari/public/rezervare/:rid/plata-init", jsonOnly, live, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "rez-pay-init", 30, 60))) return res.status(429).json({ error: "prea_multe_cereri" });
      const b = req.body || {};
      const row = await resByToken(toId(req.params.rid), b.token);
      if (!row || row.pay_scheme === "direct") return res.status(404).json({ error: "negasit" });
      if (b.accept !== true) return res.status(400).json({ error: "acord_necesar" });
      if (row.status !== "hold" || !row.verified_at || new Date(row.hold_until) < new Date()) return res.status(410).json({ error: "expirat" });
      const cust = await ensureCustomer(row);
      if (!cust) return res.status(502).json({ error: "plata_indisponibila" });
      let pi;
      if (row.pi_advance) {
        const g = await stripeReq("GET", `/payment_intents/${row.pi_advance}`);
        if (!g.ok || g.data.status === "canceled") return res.status(410).json({ error: "expirat" });
        pi = g.data;
      } else {
        const params = {
          amount: row.advance_bani, currency: String(row.currency || "RON").toLowerCase(), customer: cust, automatic_payment_methods: { enabled: "true" },
          description: `Rezervare #${row.id} · ${row.listing_name}`, receipt_email: row.guest_email, transfer_group: `res_${row.id}`,
          metadata: { reservation_id: row.id, kind: row.pay_scheme === "advance" ? "advance" : "full" },
        };
        if (row.pay_scheme === "advance" || row.guarantee_bani > 0) params.setup_future_usage = "off_session"; // cardul se salvează pentru debitarea restului sau pentru garanție
        const c = await stripeReq("POST", "/payment_intents", params, `bk-res-${row.id}-adv`);
        if (!c.ok) { console.error("rezervari: creare PaymentIntent eșuată:", c.error && c.error.message); return res.status(502).json({ error: "plata_indisponibila" }); }
        pi = c.data;
        await dbPool.query(`UPDATE booking_reservations SET pi_advance = $2, terms_accepted_at = now() WHERE id = $1`, [row.id, pi.id]);
      }
      if (pi.status === "succeeded") return res.json({ ok: true, done: true });
      noStore(res); res.json({ ok: true, clientSecret: pi.client_secret, publishableKey: PUBLISHABLE, amountBani: row.advance_bani });
    } catch (e) { console.error("rezervari plata-init:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.get("/api/rezervari/public/rezervare/:rid/stare", live, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "rez-pay-state", 120, 10))) return res.status(429).json({ error: "prea_multe_cereri" });
      const row = await resByToken(toId(req.params.rid), req.query.token);
      if (!row) return res.status(404).json({ error: "negasit" });
      noStore(res); res.json({ status: row.status, pay_status: row.pay_status });
    } catch (e) { res.status(500).json({ error: "eroare" }); }
  });

  // --- turist: plata restului cu alt card (în 48 de ore după eșec) ---
  r.post("/api/rezervari/public/rezervare/:token/plata-rest", jsonOnly, live, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "rez-pay-rest", 20, 60))) return res.status(429).json({ error: "prea_multe_cereri" });
      const token = req.params.token;
      if (!/^[a-f0-9]{64}$/.test(token)) return res.status(404).json({ error: "negasit" });
      const row = (await dbPool.query(RES_SELECT + ` WHERE r.access_hash = $1`, [sha(token)])).rows[0];
      if (!row || row.status !== "confirmed" || row.pay_status !== "rest_failed") return res.status(404).json({ error: "negasit" });
      if (new Date(row.rest_deadline) < new Date()) return res.status(410).json({ error: "expirat" });
      let pi = null;
      if (row.pi_rest) {
        const g = await stripeReq("GET", `/payment_intents/${row.pi_rest}`);
        if (g.ok && ["requires_payment_method", "requires_action", "requires_confirmation"].includes(g.data.status)) pi = g.data;
      }
      if (!pi) {
        const cust = await ensureCustomer(row);
        const c = await stripeReq("POST", "/payment_intents", {
          amount: row.rest_bani, currency: String(row.currency || "RON").toLowerCase(), customer: cust, automatic_payment_methods: { enabled: "true" },
          description: `Rest rezervare #${row.id} · ${row.listing_name}`, receipt_email: row.guest_email, transfer_group: `res_${row.id}`, metadata: { reservation_id: row.id, kind: "rest" },
        }, `bk-res-${row.id}-rest-manual-${row.rest_attempts}`);
        if (!c.ok) return res.status(502).json({ error: "plata_indisponibila" });
        pi = c.data;
        await dbPool.query(`UPDATE booking_reservations SET pi_rest = $2 WHERE id = $1`, [row.id, pi.id]);
      }
      noStore(res); res.json({ ok: true, clientSecret: pi.client_secret, publishableKey: PUBLISHABLE, amountBani: row.rest_bani, deadline: row.rest_deadline });
    } catch (e) { console.error("rezervari plata-rest:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.get("/cazare/plata/:token", async (req, res) => {
    try {
      const token = req.params.token;
      if (!LIVE || !/^[a-f0-9]{64}$/.test(token)) return res.status(404).send("Not found");
      const row = (await dbPool.query(RES_SELECT + ` WHERE r.access_hash = $1`, [sha(token)])).rows[0];
      if (!row || row.status !== "confirmed" || row.pay_status !== "rest_failed") return res.status(404).send("Not found");
      const body = `<h1>${E(row.listing_name)}</h1><p class="sub">Plata restului rezervării · ${dRo(row.ci)} – ${dRo(row.co)}</p>
<div class="card"><b>De plătit: ${fmtRon(row.rest_bani)}</b><div class="sub" style="margin-top:6px">Plătește cu alt card până la ${new Date(row.rest_deadline).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}. Dacă nu plătești la timp, rezervarea se anulează și avansul se pierde.</div>
<div id="pe" style="margin-top:12px"></div><div class="row" style="margin-top:10px"><button id="pay" type="button" disabled>Plătește ${fmtRon(row.rest_bani)}</button></div><div class="msg" id="m"></div></div>`;
      const js = COMMON_JS + STRIPE_CLIENT_JS + `(async()=>{try{const j=await api('POST','/api/rezervari/public/rezervare/${token}/plata-rest',{});await mountPay(j.clientSecret,j.publishableKey,$('#pay'),$('#m'),location.origin+'/cazare/rezervare/${token}',()=>{say($('#m'),'Plată reușită. Îți trimitem confirmarea.',true);setTimeout(()=>location.href='/cazare/rezervare/${token}',2500);});}catch(e){say($('#m'),e.message,false);}})();`;
      shell(res, "Plata restului", body, js, { stripe: true });
    } catch (e) { console.error("rezervari pagina plata:", e.message); res.status(500).send("Eroare"); }
  });

  // --- gazda: reține din garanție ---
  r.post("/api/rezervari/:id/rezervari/:rid/garantie", ...ownerApi, ownListing, live, async (req, res) => {
    try {
      const rid = toId(req.params.rid), b = req.body || {};
      const amount = Math.round(Number(b.amount_ron) * 100), note = ctx.cleanText(b.note, 300);
      if (!rid || !Number.isFinite(amount) || note.length < 10) return res.status(400).json({ error: "date_invalide" });
      if (!(await L.checkRateLimit("own:" + req.accommodationOwner.ownerId, "rez-guar-claim", 20, 10))) return res.status(429).json({ error: "prea_multe_cereri" });
      const row = (await dbPool.query(RES_SELECT + ` WHERE r.id = $1 AND r.listing_id = $2`, [rid, req.listing.id])).rows[0];
      if (!row) return res.status(404).json({ error: "negasit" });
      const out = await claimGuarantee(row, amount, note);
      if (!out.ok) return res.status(409).json({ error: out.error });
      res.json({ ok: true });
    } catch (e) { console.error("rezervari garantie:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // --- cron orar ---
  r.get("/api/cron/plati-rezervari", async (req, res) => {
    const secret = process.env.CRON_SECRET || "";
    const auth = String(req.headers.authorization || "");
    const ok = secret ? (auth.length === ("Bearer " + secret).length && crypto.timingSafeEqual(Buffer.from(auth), Buffer.from("Bearer " + secret))) : /vercel-cron/i.test(String(req.headers["user-agent"] || ""));
    if (!ok) return res.status(401).json({ error: "unauthorized" });
    if (!LIVE) return res.json({ ok: true, skipped: "plati_oprite" });
    try { res.json({ ok: true, ...(await runPaymentCron()) }); }
    catch (e) { console.error("rezervari cron plati:", e.message); res.status(500).json({ ok: false }); }
  });
}

module.exports = { claimGuarantee, releaseGuarantee, LIVE, PUBLISHABLE, webhook, mount, cancelByGuest, cancelByOwner, runPaymentCron, sendMail, stripeReq, verifySig, handleEvent, STRIPE_CLIENT_JS, RES_SELECT };

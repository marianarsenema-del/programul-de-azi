// Raport Excel pentru gazdă: rezervări cu brut, comision și net, pe perioadă (după data check-in) și, opțional, pe un singur anunț.
"use strict";
const XL = require("./xlsx-mini");
const { dbPool } = require("./static");

const PAYST = { none: "—", awaiting: "în așteptare", partial: "avans plătit", paid: "plătită", rest_failed: "rest neplătit", refunded: "returnată integral", forfeited: "anulată, penalitate reținută", refund_failed: "rambursare de verificat" };
const POLICY = { flexible: "Flexibilă", moderate: "Moderată", strict: "Strictă" };
const ron = (b) => Math.round(Number(b) || 0) / 100;
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

async function load(ownerId, o) {
  const args = [ownerId]; let where = "";
  if (o.listingId) { args.push(o.listingId); where += ` AND l.id = $${args.length}::integer`; }
  if (isDate(o.from)) { args.push(o.from); where += ` AND r.check_in >= $${args.length}::date`; }
  if (isDate(o.to)) { args.push(o.to); where += ` AND r.check_in <= $${args.length}::date`; }
  return (await dbPool.query(
    `SELECT r.id, l.id AS listing_id, l.name AS listing_name, to_char(r.check_in,'YYYY-MM-DD') AS ci, to_char(r.check_out,'YYYY-MM-DD') AS co, (r.check_out - r.check_in)::int AS nights, r.guests, r.status, r.guest_name, r.guest_phone,
            COALESCE(r.pay_scheme,'direct') AS pay_scheme, COALESCE(r.pay_status,'none') AS pay_status, r.total_bani, COALESCE(r.paid_bani,0) AS paid_bani, COALESCE(r.refunded_bani,0) AS refunded_bani, COALESCE(r.penalty_bani,0) AS penalty_bani,
            r.cancel_policy, r.commission_bani, r.promo_free, COALESCE(p.gross,0)::int AS gross, COALESCE(p.comm,0)::int AS comm, COALESCE(p.net,0)::int AS net, COALESCE(p.paid_n,0)::int AS paid_n, COALESCE(p.pend_n,0)::int AS pend_n,
            i.series AS inv_series, i.number AS inv_number, i.status AS inv_status
       FROM booking_reservations r JOIN accommodation_listings l ON l.id = r.listing_id
       LEFT JOIN (SELECT reservation_id, SUM(gross_bani) AS gross, SUM(commission_bani) AS comm, SUM(amount_bani) AS net, COUNT(*) FILTER (WHERE status = 'paid') AS paid_n, COUNT(*) FILTER (WHERE status = 'pending') AS pend_n
                    FROM booking_payouts WHERE status <> 'cancelled' GROUP BY reservation_id) p ON p.reservation_id = r.id
       LEFT JOIN booking_invoices i ON i.reservation_id = r.id AND i.kind = 'commission'
      WHERE l.owner_id = $1::integer AND (r.status = 'confirmed' OR COALESCE(r.paid_bani,0) > 0)${where}
      ORDER BY r.check_in, r.id LIMIT 5000`, args)).rows;
}

function build(rows, meta) {
  const head = ["Rezervare", "Anunț", "Oaspete", "Telefon", "Check-in", "Check-out", "Nopți", "Persoane", "Status", "Plată", "Politică anulare", "Total rezervare (RON)", "Plătit online (RON)", "Rambursat (RON)", "Penalitate reținută (RON)", "Brut gazdă (RON)", "Comision platformă (RON)", "Net gazdă (RON)", "Virat gazdei", "Factură comision"];
  const out = [[{ t: `Raport rezervări · ${meta.label}`, s: "bold" }], [], head.map((h) => ({ t: h, s: "head" }))];
  const first = out.length + 1;
  let tg = 0, tc = 0, tn = 0;
  const per = new Map();
  rows.forEach((r) => {
    const online = r.pay_scheme !== "direct";
    const brut = online ? r.gross : (r.status === "confirmed" ? r.total_bani : 0);
    const com = online ? r.comm : 0;
    const net = online ? r.net : brut;
    tg += brut; tc += com; tn += net;
    const a = per.get(r.listing_name) || { n: 0, g: 0, c: 0, v: 0 }; a.n++; a.g += brut; a.c += com; a.v += net; per.set(r.listing_name, a);
    const virat = !online ? "Încasat direct" : r.pend_n > 0 ? "În așteptare (la 24 h după check-in)" : r.paid_n > 0 ? "Da" : "—";
    const factura = !online || !(com > 0) ? (online && r.promo_free ? "Promoție: fără comision" : "—") : r.inv_status === "issued" ? `${r.inv_series} ${r.inv_number}` : r.inv_status ? "în curs" : "după virare";
    out.push([r.id, r.listing_name, r.guest_name, r.guest_phone, { d: r.ci, s: "date" }, { d: r.co, s: "date" }, { n: r.nights, s: "int" }, { n: r.guests, s: "int" },
      r.status === "confirmed" ? "Confirmată" : "Anulată", online ? "Online" : "Direct la proprietate", online ? (POLICY[r.cancel_policy] || "—") : "—",
      { n: ron(r.total_bani), s: "money" }, { n: online ? ron(r.paid_bani) : 0, s: "money" }, { n: ron(r.refunded_bani), s: "money" }, { n: ron(r.penalty_bani), s: "money" },
      { n: ron(brut), s: "money" }, { n: ron(com), s: "money" }, { n: ron(net), s: "money" }, virat, factura]);
  });
  const last = out.length;
  const sum = (col) => rows.length ? `SUM(${col}${first}:${col}${last})` : "0";
  const totals = Array(20).fill(null);
  totals[0] = { t: "TOTAL", s: "bold" };
  [[11, "L", rows.reduce((x, r) => x + r.total_bani, 0)], [12, "M", rows.reduce((x, r) => x + (r.pay_scheme !== "direct" ? r.paid_bani : 0), 0)], [13, "N", rows.reduce((x, r) => x + r.refunded_bani, 0)], [14, "O", rows.reduce((x, r) => x + r.penalty_bani, 0)], [15, "P", tg], [16, "Q", tc], [17, "R", tn]]
    .forEach(([i, col, v]) => { totals[i] = { f: sum(col), v: ron(v), s: "boldmoney" }; });
  out.push([], totals);
  const sumRows = [[{ t: "Sumar pe anunț", s: "bold" }], [], ["Anunț", "Rezervări", "Brut (RON)", "Comision (RON)", "Net (RON)"].map((h) => ({ t: h, s: "head" }))];
  const s0 = sumRows.length + 1;
  [...per.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([name, a]) => {
    const rn = sumRows.length + 1;
    sumRows.push([name, { f: `COUNTIF(Rezervări!B${first}:B${last},A${rn})`, v: a.n, s: "int" }, { f: `SUMIF(Rezervări!B${first}:B${last},A${rn},Rezervări!P${first}:P${last})`, v: ron(a.g), s: "money" }, { f: `SUMIF(Rezervări!B${first}:B${last},A${rn},Rezervări!Q${first}:Q${last})`, v: ron(a.c), s: "money" }, { f: `SUMIF(Rezervări!B${first}:B${last},A${rn},Rezervări!R${first}:R${last})`, v: ron(a.v), s: "money" }]);
  });
  const s1 = sumRows.length;
  if (per.size) sumRows.push([{ t: "TOTAL", s: "bold" }, { f: `SUM(B${s0}:B${s1})`, v: rows.length, s: "int" }, { f: `SUM(C${s0}:C${s1})`, v: ron(tg), s: "boldmoney" }, { f: `SUM(D${s0}:D${s1})`, v: ron(tc), s: "boldmoney" }, { f: `SUM(E${s0}:E${s1})`, v: ron(tn), s: "boldmoney" }]);
  sumRows.push([], [{ t: "Brut = suma încasată pentru gazdă (online după rambursări; direct = totalul rezervării). Comision = comisionul platformei reținut din plățile online. Net = brut − comision.", s: null }]);
  return XL.build([
    { name: "Rezervări", widths: [10, 26, 22, 14, 12, 12, 7, 9, 12, 22, 16, 16, 16, 14, 16, 16, 18, 16, 28, 24], freeze: 3, rows: out },
    { name: "Sumar", widths: [32, 12, 16, 16, 16], rows: sumRows },
  ]);
}

async function report(ownerId, o) {
  const rows = await load(ownerId, o);
  const label = (isDate(o.from) || isDate(o.to) ? `${isDate(o.from) ? o.from : "început"} – ${isDate(o.to) ? o.to : "prezent"}` : "toate rezervările") + (o.listingName ? ` · ${o.listingName}` : "");
  return { buffer: build(rows, { label }), count: rows.length };
}
module.exports = { report, build, load, isDate };

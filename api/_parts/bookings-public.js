// Rezervări cazare — ETAPA 1: rezervare instant fără plată online.
// Montat din bookings.js (deci respectă aceleași comutatoare: oprit implicit). Per anunț trebuie, în plus,
// ca proprietarul să fi activat „Rezervare instant” (booking_settings.instant_enabled).
"use strict";
const crypto = require("crypto");

module.exports = function mountPublic(r, c) {
  const { dbPool, core, L, jsonOnly, noStore, toId, cleanText, shell, COMMON_JS, ownerApi, ownListing, safeEq, RESEND_API_KEY, pay, forms } = c;
  const HOLD_MIN = 10;
  const LIVE = !!(pay && pay.LIVE && process.env.ACCOMMODATION_SESSION_SECRET); // plata online: oprită până la BOOKINGS_PAYMENTS_LIVE=true
  const SECRET = process.env.ACCOMMODATION_SESSION_SECRET || "";
  const FORMS = !!(forms && forms.ENABLED && SECRET); // fișa de cazare: link în e-mailuri; tokenul devine derivat ca să poată fi refăcut în memento
  const jsDate = (v) => (v instanceof Date ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}` : String(v || "").slice(0, 10));
  const isOnline = (row) => !!row && !!row.pay_scheme && row.pay_scheme !== "direct";
  const sha = core.sha256;
  const ipKey = (req) => L.hashIp(L.getClientIp(req));

  async function sendMail(to, subject, html) {
    if (!RESEND_API_KEY || !to) return false;
    // expeditor principal pe domeniul site-ului; dacă Resend îl refuză (domeniu neverificat încă), reîncercăm cu expeditorul vechi, ca să nu se piardă coduri sau confirmări
    const senders = [process.env.BOOKINGS_MAIL_FROM || "Opening Hours Today <cazare@opening-hours-today.eu>", "Opening Hours Today <cazare@programul-de-azi.ro>"];
    for (let i = 0; i < senders.length; i++) {
      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST", signal: AbortSignal.timeout(8000),
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: senders[i], to: [to], subject, html }),
        });
        if (resp.ok) return true;
        if (![401, 403, 422].includes(resp.status)) return false; // alte erori (limite, rețea) nu se rezolvă prin schimbarea expeditorului
      } catch (e) { return false; }
    }
    return false;
  }
  const E = L.escapeHtml;
  const PARTY = require("./bookings-party");
  const POL = require("./bookings-policy");
  const PROMO = require("./bookings-promo");
  const fmtRon = (b) => (b / 100).toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " RON";
  const dRo = (s) => { const [y, m, d] = s.split("-"); return `${d}.${m}.${y}`; };
  const codeHash = (id, access, code) => sha(`${id}:${access}:${code}`);
  const newCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");

  // ---------- anunț public rezervabil ----------
  async function pubListing(req, res, next) {
    try {
      const id = toId(req.params.id);
      if (!id) return res.status(404).json({ error: "negasit" });
      try { await require("./contract").ensureTables(); } catch (e) { /* contract.js lipsește sau tabelul nu poate fi creat: regula contractului nu se aplică */ }
      const { rows } = await dbPool.query(
        `SELECT l.id, l.name, l.owner_id, l.type_details, o.email AS owner_email, s.base_price_bani, s.currency, s.min_nights, s.max_guests, s.lead_days, s.commission_bps, s.whole_discount_bps, s.payment_mode, l.checkin_time${LIVE ? ", s.guarantee_bani, s.cancel_policy" : ""}${LIVE ? ", COALESCE(op.payouts_enabled, false) AS payouts_enabled" : ""}
           FROM accommodation_listings l JOIN booking_settings s ON s.listing_id = l.id JOIN accommodation_owners o ON o.id = l.owner_id${LIVE ? " LEFT JOIN booking_owner_payments op ON op.owner_id = l.owner_id" : ""}
          WHERE l.id = $1::integer AND l.status = 'approved' AND ${pay ? pay.BOOKABLE_SQL : "FALSE"} AND l.type NOT IN ('camping', 'hotel_mare')`, [id]);
      if (!rows[0]) return res.status(404).json({ error: "negasit" });
      rows[0].online = LIVE && rows[0].payouts_enabled === true; // toate rezervările sunt cu plată online; contul Stripe al gazdei trebuie să poată primi bani
      rows[0].policy = POL.normalize(rows[0].cancel_policy); // politica de anulare (contează doar la plata online)
      rows[0].units = (await dbPool.query(`SELECT unit_no, name, capacity, base_price_bani FROM booking_units WHERE listing_id = $1 AND active ORDER BY sort_order, unit_no`, [id])).rows;
      try { // politica pentru copii din formular + legătura camerelor cu tipurile de cameră de hotel (sync_key există doar după etapa 6)
        let td = rows[0].type_details; if (typeof td === "string") { try { td = JSON.parse(td); } catch (e) { td = null; } }
        rows[0].td = td && typeof td === "object" ? td : {};
        rows[0].kids = PARTY.sanitizeKids(rows[0].td.kids);
        if (rows[0].kids || (rows[0].td.roomTypes || []).length) {
          const ks = (await dbPool.query(`SELECT unit_no, sync_key FROM booking_units WHERE listing_id = $1 AND active`, [id])).rows;
          rows[0].units.forEach((u) => { const k = ks.find((x) => Number(x.unit_no) === u.unit_no); if (k) u.sync_key = k.sync_key; });
        }
      } catch (e) { rows[0].kids = rows[0].kids || null; }
      req.pub = rows[0];
      next();
    } catch (e) { console.error("rezervari pubListing:", e.message); res.status(500).json({ error: "eroare" }); }
  }
  // date pentru ofertă, încărcate o singură dată pentru toate camerele
  async function loadQuoteData(lst, checkin, checkout) {
    const rules = (await dbPool.query(`SELECT id, unit_no, kind, to_char(date_from,'YYYY-MM-DD') AS date_from, to_char(date_to,'YYYY-MM-DD') AS date_to, name, price_bani, min_nights, checkin_days, checkout_days, priority, active, (to_jsonb(r)->>'pct_bps')::integer AS pct_bps FROM booking_rate_rules r WHERE listing_id = $1 AND active`, [lst.id])).rows;
    const busyByUnit = new Map();
    if (core.isDateStr(checkin) && core.isDateStr(checkout) && core.dayNum(checkout) - core.dayNum(checkin) <= 60) {
      (await dbPool.query(`SELECT unit_id, to_char(day,'YYYY-MM-DD') AS day FROM booking_calendar_days WHERE listing_id = $1 AND day >= $2::date AND day < $3::date AND (status <> 3 OR blocked_until > now())`, [lst.id, checkin, checkout])).rows
        .forEach((x) => { if (!busyByUnit.has(x.unit_id)) busyByUnit.set(x.unit_id, new Set()); busyByUnit.get(x.unit_id).add(x.day); });
    }
    return { rules, busyByUnit };
  }
  // unit = rând din booking_units sau null (proprietate întreagă, unit 0). Capacitatea camerelor se verifică separat, pe suma camerelor alese.
  function quoteUnit(lst, data, unit, checkin, checkout, guests) {
    const un = unit ? unit.unit_no : 0;
    const rules = data.rules.filter((x) => x.unit_no == null || x.unit_no === un);
    const q = core.computeQuote({ checkIn: checkin, checkOut: checkout, guests: unit ? null : guests,
      settings: { base_price_bani: unit && unit.base_price_bani != null ? unit.base_price_bani : lst.base_price_bani, min_nights: lst.min_nights || 1, max_guests: unit ? null : lst.max_guests },
      rules, busyDays: data.busyByUnit.get(un) || new Set() });
    if (core.isDateStr(checkin) && checkin < core.addDays(core.todayRo(), lst.lead_days || 0) && !q.errors.includes("data_trecuta")) { q.errors.push("prea_aproape"); q.ok = false; }
    return q;
  }
  const peopleTxt = (snap, g) => (snap && snap.party && Array.isArray(snap.party.ages) ? PARTY.partyText(snap.party.adults, snap.party.ages) : g + " persoane");
  const guestsOf = (v) => { const n = Number(v); return Number.isInteger(n) && n >= 1 && n <= 100 ? n : null; };
  // familia: adulți + vârstele copiilor (ca la Booking); vechiul „guests” = doar adulți, fără suplimente
  function partyOf(src) {
    const s = src || {};
    if (s.adults !== undefined && s.adults !== null && s.adults !== "") {
      const a = Number(s.adults); const ages = PARTY.parseAges(s.ages);
      if (!Number.isInteger(a) || a < 1 || a > 50 || ages === null) return null;
      return { adults: a, ages, g: a + ages.length };
    }
    const g = guestsOf(s.guests);
    return g ? { adults: g, ages: [], g, legacy: true } : null;
  }
  // câte persoane includ camerele alese, capacitatea lor și prețul pe persoană inclusă (pentru „adult în plus” fără preț setat)
  const bedCount = (kids, party) => party.adults + party.ages.filter((a) => { const b = kids ? PARTY.classify(kids, a) : null; return !(b && b.nobed); }).length;
  function partyCtx(lst, chosen, perNightBani) {
    const units = chosen.filter(Boolean);
    const included = units.length ? units.reduce((a, u) => a + (PARTY.includedOf(lst.td, lst.kids, u, null) || u.capacity), 0) : (PARTY.includedOf(lst.td, lst.kids, null, lst.max_guests) || null);
    const max = units.length ? units.reduce((a, u) => a + u.capacity, 0) : (lst.max_guests || null);
    return { included, max, perPerson: included ? Math.round(perNightBani / included) : 0 };
  }

  r.get("/api/rezervari/public/:id/disponibilitate", pubListing, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "rez-disp", 120, 10))) return res.status(429).json({ error: "prea_multe_cereri" });
      const { from, to } = req.query;
      if (!core.isDateStr(from) || !core.isDateStr(to) || core.dayNum(to) <= core.dayNum(from) || core.dayNum(to) - core.dayNum(from) > 130) return res.status(400).json({ error: "interval_invalid" });
      const rows = (await dbPool.query(`SELECT unit_id, to_char(day,'YYYY-MM-DD') AS day FROM booking_calendar_days WHERE listing_id = $1 AND day >= $2::date AND day < $3::date AND (status <> 3 OR blocked_until > now()) ORDER BY day`, [req.pub.id, from, to])).rows;
      const l = req.pub, units = l.units || [];
      const busyByUnit = {};
      (units.length ? units.map((u) => u.unit_no) : [0]).forEach((n) => { busyByUnit[n] = []; });
      rows.forEach((x) => { if (busyByUnit[x.unit_id]) busyByUnit[x.unit_id].push(x.day); });
      noStore(res);
      res.json({ name: l.name, kids: l.kids || null, units: units.map((u) => ({ no: u.unit_no, name: u.name, capacity: u.capacity })), busyByUnit, today: core.todayRo(), lead_days: l.lead_days, min_nights: l.min_nights || 1, max_guests: l.max_guests });
    } catch (e) { console.error("rezervari disponibilitate:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.get("/api/rezervari/public/:id/oferta", pubListing, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "rez-oferta", 120, 10))) return res.status(429).json({ error: "prea_multe_cereri" });
      const party = partyOf(req.query);
      if (!party) return res.status(400).json({ error: "date_invalide" });
      const lst = req.pub, units = lst.units || [];
      const g = bedCount(lst.kids, party);
      const data = await loadQuoteData(lst, req.query.checkin, req.query.checkout);
      noStore(res);
      const pinfo = { kids: lst.kids || null, party: { adults: party.adults, ages: party.ages }, policy: lst.online ? { key: lst.policy, discountBps: POL.discountBps(lst.policy), text: POL.shortText(lst.policy) } : null };
      if (!units.length) {
        const q = quoteUnit(lst, data, null, req.query.checkin, req.query.checkout, g);
        const nn = (q.nights || []).length, ctx = partyCtx(lst, [null], nn ? Math.round((q.totalBani || 0) / nn) : 0);
        return res.json({ ok: q.ok, errors: q.errors, totalBani: q.totalBani || 0, nights: nn, minNights: q.minNights, units: [], ...pinfo, included: ctx.included, max: ctx.max, perPerson: ctx.perPerson });
      }
      const out = units.map((u) => { const q = quoteUnit(lst, data, u, req.query.checkin, req.query.checkout, g); return { no: u.unit_no, name: u.name, capacity: u.capacity, included: PARTY.includedOf(lst.td, lst.kids, u, null) || u.capacity, ok: q.ok, errors: q.errors, totalBani: q.totalBani || 0 }; });
      res.json({ ...pinfo, wholeDiscountBps: units.length > 1 ? (lst.whole_discount_bps || 0) : 0, ok: out.some((x) => x.ok), nights: core.isDateStr(req.query.checkin) && core.isDateStr(req.query.checkout) ? core.dayNum(req.query.checkout) - core.dayNum(req.query.checkin) : 0, units: out, errors: [] });
    } catch (e) { console.error("rezervari oferta:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // ---------- pas 1: blocare temporară (10 min) + cod pe e-mail ----------
  r.post("/api/rezervari/public/:id/blocheaza", jsonOnly, pubListing, async (req, res) => {
    const b = req.body || {};
    const name = cleanText(b.name, 80), email = cleanText(b.email, 160).toLowerCase(), phone = cleanText(b.phone, 25).replace(/[^\d+]/g, "");
    const party = partyOf(b), g = party ? party.g : null;
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !/^(\+?\d{9,15})$/.test(phone) || !g || b.consent !== true) return res.status(400).json({ error: "date_invalide" });
    if (!(await L.checkRateLimit(ipKey(req), "rez-hold", 8, 60)) || !(await L.checkRateLimit(sha("em:" + email), "rez-hold-em", 5, 60))) return res.status(429).json({ error: "prea_multe_cereri" });
    const lst = req.pub, allUnits = lst.units || [];
    let chosen; // camerele rezervate; [null] = proprietate întreagă
    if (allUnits.length) {
      const nums = Array.isArray(b.units) ? [...new Set(b.units.map(Number))] : [];
      if (!nums.length || nums.length > allUnits.length || !nums.every((n) => allUnits.some((u) => u.unit_no === n))) return res.status(400).json({ error: "date_invalide" });
      chosen = allUnits.filter((u) => nums.includes(u.unit_no));
      if (bedCount(req.pub.kids, party) > chosen.reduce((a, u) => a + u.capacity, 0)) return res.status(409).json({ error: "oferta_invalida", errors: ["prea_multi_oaspeti"] });
    } else chosen = [null];
    let client;
    try {
      const data = await loadQuoteData(lst, b.checkin, b.checkout);
      const parts = chosen.map((u) => ({ u, q: quoteUnit(lst, data, u, b.checkin, b.checkout, bedCount(lst.kids, party)) }));
      const bad = parts.find((x) => !x.q.ok);
      if (bad) return res.status(409).json({ error: "oferta_invalida", errors: bad.q.errors });
      const subtotal = parts.reduce((a, x) => a + x.q.totalBani, 0);
      const whole = allUnits.length > 1 && chosen.length === allUnits.length; // toate camerele → reducere „toată pensiunea”
      const discount = whole ? Math.round(subtotal * (lst.whole_discount_bps || 0) / 10000) : 0;
      // suplimentul pentru persoane în plus / copii, pe noapte × nopți (nu intră în reducerea „toată pensiunea”)
      const nightsN = core.dayNum(b.checkout) - core.dayNum(b.checkin);
      const sup = lst.kids ? PARTY.supp(lst.kids, partyCtx(lst, chosen, nightsN > 0 ? Math.round(subtotal / nightsN) : 0), party.adults, party.ages) : { ok: true, perNightBani: 0, lines: [] };
      if (!sup.ok) return res.status(409).json({ error: "oferta_invalida", errors: sup.errors });
      const suppTotal = sup.perNightBani * Math.max(0, nightsN);
      const preTotal = subtotal - discount + suppTotal;
      const policyDisc = lst.online ? Math.round(preTotal * POL.discountBps(lst.policy) / 10000) : 0; // politica strictă: 10% reducere, afișată separat
      const total = preTotal - policyDisc;
      const snapshot = { discount_bani: discount, policy_discount_bani: policyDisc, whole, party: { adults: party.adults, ages: party.ages, supp_night_bani: sup.perNightBani, supp_bani: suppTotal, lines: sup.lines }, units: parts.map((x) => ({ unit_no: x.u ? x.u.unit_no : 0, name: x.u ? x.u.name : null, total_bani: x.q.totalBani, nights: x.q.nights })) };
      const active = (await dbPool.query(`SELECT COUNT(*)::int AS c FROM booking_reservations WHERE status = 'hold' AND hold_until > now() AND (lower(guest_email) = $1 OR guest_phone = $2)`, [email, phone])).rows[0].c;
      if (active >= 2) return res.status(429).json({ error: "prea_multe_blocari" });
      let token = crypto.randomBytes(32).toString("hex"), access = sha(token);
      const code = newCode();
      const online = !!lst.online;
      const firstNight = online ? POL.firstNightOf(snapshot, total) : 0;
      const plan = online ? POL.planPayment(core, total, b.checkin, core.todayRo(), lst.policy, firstNight) : null; // avansul acoperă mereu penalitatea politicii
      // comision doar la plata online reală (gazda a ales online, plățile sunt pornite, contul Stripe al gazdei e activ); altfel rezervare directă, fără comision
      let commission = online ? Math.round(total * (lst.commission_bps || 0) / 10000) : 0, promoFree = false; // promoția (primele 5 online / cont gazdă) se decide în tranzacție
      const pairs = []; // (cameră, zi)
      parts.forEach((x) => x.q.nights.forEach((n) => pairs.push([x.u ? x.u.unit_no : 0, n.day])));
      client = await dbPool.connect();
      await client.query("BEGIN");
      await client.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [lst.id]);
      if (online && commission > 0) { await PROMO.lockOwner(client, lst.owner_id); if (await PROMO.nextIsFree(client, lst.owner_id)) { commission = 0; promoFree = true; } }
      await client.query(`UPDATE booking_reservations SET status = 'expired' WHERE listing_id = $1 AND status = 'hold' AND hold_until < now()`, [lst.id]);
      await client.query(`DELETE FROM booking_calendar_days WHERE listing_id = $1 AND status = 3 AND blocked_until < now()`, [lst.id]);
      const ins = await client.query(
        `INSERT INTO booking_reservations (listing_id, check_in, check_out, guests, total_bani, commission_bani, currency, nights_snapshot, status, guest_name, guest_phone, guest_email, access_hash, code_expires_at, code_sent_at, hold_until, ip_hash, unit_ids)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'hold',$9,$10,$11,$12, now() + interval '${HOLD_MIN} minutes', now(), now() + interval '${HOLD_MIN} minutes', $13, $14::smallint[]) RETURNING id, hold_until`,
        [lst.id, b.checkin, b.checkout, g, total, commission, lst.currency || "RON", JSON.stringify(snapshot), name, phone, email, access, ipKey(req), parts.map((x) => (x.u ? x.u.unit_no : 0))]);
      const rid = ins.rows[0].id;
      if (online) { // token derivat (HMAC), ca e-mailurile trimise din webhook/cron să poată conține linkul rezervării
        token = core.deriveToken(rid, SECRET); access = sha(token);
        const gar = Math.max(0, Number(lst.guarantee_bani) || 0);
        await client.query(`UPDATE booking_reservations SET code_hash = $2, access_hash = $3, pay_scheme = $4, pay_status = 'awaiting', advance_bani = $5, rest_bani = $6, rest_due_on = $7::date, guarantee_bani = $8, guarantee_status = $9,
            cancel_policy = $10, policy_discount_bani = $11, first_night_bani = $12, checkin_at = $13::timestamptz, promo_free = $14 WHERE id = $1`,
          [rid, codeHash(rid, access, code), access, plan.scheme, plan.advance, plan.rest, plan.restDueOn || null, gar, gar > 0 ? "pending" : "none", lst.policy, policyDisc, firstNight, POL.checkinInstant(b.checkin, lst.checkin_time).toISOString(), promoFree]);
      } else if (FORMS) {
        token = core.deriveToken(rid, SECRET); access = sha(token);
        await client.query(`UPDATE booking_reservations SET code_hash = $2, access_hash = $3 WHERE id = $1`, [rid, codeHash(rid, access, code), access]);
      } else await client.query(`UPDATE booking_reservations SET code_hash = $2 WHERE id = $1`, [rid, codeHash(rid, access, code)]);
      const got = await client.query(
        `INSERT INTO booking_calendar_days (listing_id, unit_id, day, status, blocked_until, reservation_id) SELECT $1, t.u::smallint, t.d, 3, now() + interval '${HOLD_MIN} minutes', $2 FROM unnest($3::int[], $4::date[]) AS t(u, d)
         ON CONFLICT (listing_id, unit_id, day) DO NOTHING RETURNING day`, [lst.id, rid, pairs.map((x) => x[0]), pairs.map((x) => x[1])]);
      if (got.rowCount !== pairs.length) { await client.query("ROLLBACK"); return res.status(409).json({ error: "oferta_invalida", errors: ["indisponibil"] }); } // totul sau nimic
      await client.query("COMMIT");
      const roomsTxt = chosen[0] ? " · " + chosen.map((u) => E(u.name)).join(", ") : "";
      const sent = await sendMail(email, "Codul tău de confirmare: " + code,
        `<p>Bună, ${E(name)},</p><p>Codul de confirmare pentru rezervarea la <b>${E(lst.name)}</b> (${dRo(b.checkin)} – ${dRo(b.checkout)}${roomsTxt}) este:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p>Camera îți este ținută ${HOLD_MIN} minute. Dacă nu ai cerut tu acest cod, ignoră mesajul.</p>`);
      if (!sent) { // fără cod nu are sens să ținem camera
        await dbPool.query(`DELETE FROM booking_calendar_days WHERE reservation_id = $1 AND status = 3`, [rid]);
        await dbPool.query(`UPDATE booking_reservations SET status = 'cancelled', cancelled_at = now(), cancelled_by = 'system' WHERE id = $1`, [rid]);
        return res.status(502).json({ error: "email_esuat" });
      }
      noStore(res); res.json({ ok: true, id: rid, token, holdUntil: ins.rows[0].hold_until, totalBani: total, online });
    } catch (e) {
      if (client) await client.query("ROLLBACK").catch(() => {});
      console.error("rezervari blocheaza:", e.message); res.status(500).json({ error: "eroare" });
    } finally { if (client) client.release(); }
  });

  r.post("/api/rezervari/public/rezervare/:rid/retrimite-cod", jsonOnly, async (req, res) => {
    try {
      const token = String((req.body || {}).token || ""), rid = toId(req.params.rid);
      if (!rid || !/^[a-f0-9]{64}$/.test(token)) return res.status(404).json({ error: "negasit" });
      if (!(await L.checkRateLimit(ipKey(req), "rez-recode", 10, 60))) return res.status(429).json({ error: "prea_multe_cereri" });
      const code = newCode(), access = sha(token);
      const up = await dbPool.query(
        `UPDATE booking_reservations SET code_hash = $3, code_sends = code_sends + 1, code_sent_at = now(), code_attempts = 0
          WHERE id = $1 AND access_hash = $2 AND status = 'hold' AND hold_until > now() AND code_sends < 3 AND code_sent_at < now() - interval '45 seconds'
          RETURNING guest_name, guest_email`, [rid, access, codeHash(rid, access, code)]);
      if (!up.rows[0]) return res.status(429).json({ error: "asteapta" });
      await sendMail(up.rows[0].guest_email, "Codul tău de confirmare: " + code, `<p>Codul tău de confirmare este:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>`);
      res.json({ ok: true });
    } catch (e) { console.error("rezervari retrimite:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // ---------- pas 2: confirmare cu cod → zilele devin „rezervate” (status 4) ----------
  r.post("/api/rezervari/public/rezervare/:rid/confirma", jsonOnly, async (req, res) => {
    const token = String((req.body || {}).token || ""), code = String((req.body || {}).code || "").trim(), rid = toId(req.params.rid);
    if (!rid || !/^[a-f0-9]{64}$/.test(token) || !/^\d{6}$/.test(code)) return res.status(400).json({ error: "date_invalide" });
    if (!(await L.checkRateLimit(ipKey(req), "rez-confirm", 30, 60))) return res.status(429).json({ error: "prea_multe_cereri" });
    let client, done = null;
    try {
      client = await dbPool.connect();
      await client.query("BEGIN");
      const row = (await client.query(`SELECT r.*, to_char(r.check_in,'YYYY-MM-DD') AS ci, to_char(r.check_out,'YYYY-MM-DD') AS co, l.name AS listing_name, o.email AS owner_email FROM booking_reservations r JOIN accommodation_listings l ON l.id = r.listing_id JOIN accommodation_owners o ON o.id = l.owner_id WHERE r.id = $1 AND r.access_hash = $2 FOR UPDATE OF r`, [rid, sha(token)])).rows[0];
      if (!row) { await client.query("ROLLBACK"); return res.status(404).json({ error: "negasit" }); }
      if (row.status === "confirmed") { await client.query("ROLLBACK"); return res.json({ ok: true, already: true }); }
      if (row.status !== "hold" || new Date(row.hold_until) < new Date()) {
        await client.query(`UPDATE booking_reservations SET status = 'expired' WHERE id = $1 AND status = 'hold'`, [rid]);
        await client.query(`DELETE FROM booking_calendar_days WHERE reservation_id = $1 AND status = 3`, [rid]);
        await client.query("COMMIT"); return res.status(410).json({ error: "expirat" });
      }
      const payInfo = (hu) => ({ ok: true, pay: { scheme: row.pay_scheme, advanceBani: row.advance_bani, restBani: row.rest_bani, restDueOn: row.rest_due_on ? jsDate(row.rest_due_on) : null, totalBani: row.total_bani, guaranteeBani: row.guarantee_bani || 0, holdUntil: hu, policy: policyInfoOf(row) } });
      if (isOnline(row) && row.verified_at) { await client.query("ROLLBACK"); noStore(res); return res.json(payInfo(row.hold_until)); } // cod deja verificat: doar reafișăm pasul de plată
      if (row.code_attempts >= 5) { await client.query("ROLLBACK"); return res.status(429).json({ error: "prea_multe_incercari" }); }
      const ok = row.code_hash && safeEq(row.code_hash, codeHash(rid, sha(token), code));
      if (!ok) {
        await client.query(`UPDATE booking_reservations SET code_attempts = code_attempts + 1 WHERE id = $1`, [rid]);
        await client.query("COMMIT"); return res.status(400).json({ error: "cod_gresit", remaining: Math.max(0, 4 - row.code_attempts) });
      }
      const snap = row.nights_snapshot;
      const nights = Array.isArray(snap) ? snap.length : snap.units.reduce((a, u) => a + u.nights.length, 0);
      if (isOnline(row)) { // plată online: nu confirmăm încă; prelungim blocarea și așteptăm plata (rezervarea se finalizează din webhook)
        const ext = await client.query(`UPDATE booking_calendar_days SET blocked_until = now() + interval '12 minutes' WHERE reservation_id = $1 AND status = 3 AND blocked_until > now() RETURNING day`, [rid]);
        if (ext.rowCount !== nights) { await client.query("ROLLBACK"); return res.status(410).json({ error: "expirat" }); }
        const hu = (await client.query(`UPDATE booking_reservations SET hold_until = now() + interval '12 minutes', verified_at = now(), code_hash = NULL WHERE id = $1 RETURNING hold_until`, [rid])).rows[0].hold_until;
        await client.query("COMMIT");
        noStore(res); return res.json(payInfo(hu));
      }
      const upd = await client.query(`UPDATE booking_calendar_days SET status = 4, blocked_until = NULL, updated_at = now() WHERE reservation_id = $1 AND status = 3 AND blocked_until > now() RETURNING day`, [rid]);
      if (upd.rowCount !== nights) { await client.query("ROLLBACK"); return res.status(410).json({ error: "expirat" }); }
      await client.query(`UPDATE booking_reservations SET status = 'confirmed', confirmed_at = now(), hold_until = NULL, code_hash = NULL WHERE id = $1`, [rid]);
      await client.query("COMMIT");
      done = row;
    } catch (e) {
      if (client) await client.query("ROLLBACK").catch(() => {});
      console.error("rezervari confirma:", e.message); return res.status(500).json({ error: "eroare" });
    } finally { if (client) client.release(); }
    const base = L.baseUrlFor(req), link = `${base}/cazare/rezervare/${token}`;
    const period = `${dRo(done.ci)} – ${dRo(done.co)}`;
    await sendMail(done.guest_email, "Rezervare confirmată · " + done.listing_name,
      `<p>Bună, ${E(done.guest_name)},</p><p>Rezervarea ta la <b>${E(done.listing_name)}</b> este confirmată.</p><p>Perioada: ${period} · ${peopleTxt(done.nights_snapshot, done.guests)}${roomsOf(done.nights_snapshot)}<br>Total: <b>${fmtRon(done.total_bani)}</b> (se achită direct la proprietate, conform înțelegerii cu gazda)</p>${FORMS ? `<p>Înainte de sosire, completează <a href="${base}/cazare/fisa/${token}">fișa de cazare</a> pentru fiecare oaspete (cerință legală).</p>` : ""}<p><a href="${link}">Vezi sau anulează rezervarea</a></p>`);
    await require("./bookings-gazda-notify").pushByListing(done.listing_id, { title: "Rezervare nouă", body: done.guest_name + " · " + dRo(done.ci) + " – " + dRo(done.co) + " · " + done.guests + " pers.", tag: "gz-r" + done.id });
    await sendMail(done.owner_email, "Rezervare nouă · " + done.listing_name,
      `<p>Ai o rezervare nouă confirmată la <b>${E(done.listing_name)}</b>.</p><p>${E(done.guest_name)} · ${E(done.guest_phone)} · ${E(done.guest_email)}<br>Perioada: ${period} · ${peopleTxt(done.nights_snapshot, done.guests)}${roomsOf(done.nights_snapshot)} · ${fmtRon(done.total_bani)}</p><p>Zilele s-au blocat automat în calendar. O vezi în contul tău, la Rezervări.</p>`);
    noStore(res); res.json({ ok: true, link });
  });

  // ---------- pagina turistului (după token) ----------
  function roomsOf(snap) {
    if (snap && !Array.isArray(snap) && snap.camp_items) return (snap.hotel ? "<br>Camere: " : "<br>Locuri: ") + snap.camp_items.map((x) => (x.qty > 1 ? x.qty + " × " : "") + E(x.name)).join(", ");
    const names = snap && !Array.isArray(snap) && snap.units ? snap.units.map((u) => u.name).filter(Boolean) : [];
    return names.length ? "<br>Camere: " + names.map(E).join(", ") : "";
  }
  // politica rezervării (salvată pe rezervare la momentul plății) + textele afișate turistului
  function policyInfoOf(row) {
    const key = POL.normalize(row.cancel_policy);
    const at = row.checkin_at ? new Date(row.checkin_at) : POL.checkinInstant(row.ci, null);
    const label = new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit" }).format(at) + ", " + dRo(row.ci);
    return { key, label: POL.LABELS[key], discountBani: row.policy_discount_bani || 0, text: POL.shortText(key), accept: POL.acceptText(key, { total: row.total_bani, firstNight: row.first_night_bani || 0, checkinLabel: label }) };
  }
  async function byToken(token) {
    if (!/^[a-f0-9]{64}$/.test(String(token))) return null;
    return (await dbPool.query(`SELECT r.*, to_char(r.check_in,'YYYY-MM-DD') AS ci, to_char(r.check_out,'YYYY-MM-DD') AS co, l.name AS listing_name, o.email AS owner_email, l.contact_phone AS host_phone, l.contact_email AS host_email, to_jsonb(l)->>'address' AS host_address, l.city AS host_city
        FROM booking_reservations r JOIN accommodation_listings l ON l.id = r.listing_id JOIN accommodation_owners o ON o.id = l.owner_id WHERE r.access_hash = $1`, [sha(token)])).rows[0] || null;
  }
  r.get("/cazare/rezervare/:token", async (req, res) => {
    try {
      const row = await byToken(req.params.token);
      if (!row || row.status === "expired") return res.status(404).send("Not found");
      const online = isOnline(row);
      if (row.status === "hold") { // doar pentru plata online în curs (întoarcere de la bancă/3D Secure): așteptăm confirmarea din webhook
        if (!(LIVE && online && row.verified_at)) return res.status(404).send("Not found");
        const body = `<h1>${E(row.listing_name)}</h1><p class="sub">Rezervarea ta</p><div class="card"><b>Se procesează plata…</b><div class="sub" style="margin-top:6px">Confirmăm rezervarea imediat ce primim plata. Pagina se actualizează singură.</div><div class="msg" id="m"></div></div>`;
        const js = COMMON_JS + `let n=0;const t=setInterval(async()=>{n++;try{const r=await fetch('/api/rezervari/public/rezervare/${row.id}/stare?token=${req.params.token}');const j=await r.json();if(j.status!=='hold'){clearInterval(t);location.reload();}}catch(e){}if(n>60){clearInterval(t);say($('#m'),'Încă procesăm plata. Vei primi un e-mail de confirmare.',true);}},2000);`;
        return shell(res, "Rezervarea ta", body, js);
      }
      const outcome = online ? pay.guestOutcome(row) : null;
      const can = row.status === "confirmed" && (online ? outcome.allowed : row.ci > core.todayRo());
      let payTxt = "se achită direct la proprietate";
      if (online) {
        const paid = fmtRon(row.paid_bani || 0);
        if (row.pay_status === "partial") payTxt = `ai plătit ${paid}; restul de ${fmtRon(row.rest_bani)} se debitează automat pe ${dRo(jsDate(row.rest_due_on))}`;
        else if (row.pay_status === "rest_failed") payTxt = `ai plătit ${paid}; <a href="/cazare/plata/${req.params.token}">plătește restul de ${fmtRon(row.rest_bani)} cu alt card</a> înainte de expirarea termenului, altfel rezervarea se anulează`;
        else if (row.pay_status === "refunded") payTxt = "suma plătită a fost returnată";
        else if (row.pay_status === "forfeited") payTxt = row.cancel_refund_bani > 0 ? `ți s-au returnat ${fmtRon(row.cancel_refund_bani)}; ${fmtRon(row.penalty_bani || 0)} se rețin conform politicii de anulare` : `suma plătită (${paid}) nu se returnează`;
        else payTxt = `plătit ${paid}`;
      }
      const body = `<h1>${E(row.listing_name)}</h1><p class="sub">Rezervarea ta</p><div class="card"><b>${row.status === "confirmed" ? "Confirmată" : "Anulată"}</b><div class="sub" style="margin-top:6px">${dRo(row.ci)} – ${dRo(row.co)} · ${peopleTxt(row.nights_snapshot, row.guests)}${roomsOf(row.nights_snapshot)}<br>Total: ${fmtRon(row.total_bani)} (${payTxt})</div>
${row.status === "confirmed" && FORMS && row.ci >= core.todayRo() ? `<div style="margin-top:10px"><a href="/cazare/fisa/${req.params.token}">Completează fișa de cazare</a> <span class="sub">(obligatorie, pentru fiecare oaspete)</span></div>` : ""}${online && row.guarantee_bani > 0 && row.status === "confirmed" ? `<div class="sub" style="margin-top:6px">Garanție ${fmtRon(row.guarantee_bani)}: ${{ pending: "se blochează pe card cu o zi înainte de sosire", held: "blocată pe card (nu se debitează)", failed: "nu a putut fi blocată; te înțelegi cu gazda", released: "eliberată", claimed: "reținută parțial/total de gazdă" }[row.guarantee_status] || ""}</div>` : ""}
${online && row.cancel_policy ? `<div class="sub" style="margin-top:6px">Politica de anulare: <b>${E(POL.LABELS[POL.normalize(row.cancel_policy)])}</b>. ${E(POL.shortText(row.cancel_policy))}${row.policy_discount_bani > 0 ? ` Reducere nerambursabil inclusă: ${fmtRon(row.policy_discount_bani)}.` : ""}</div>` : ""}${row.status === "confirmed" && online && can ? `<div class="sub" style="margin-top:6px">${E(POL.cancelPreviewText(outcome))}</div>` : ""}
${row.status === "confirmed" && online && (row.paid_bani || 0) > 0 && pay.hostContactHtml ? `<div class="sub" style="margin-top:10px">${pay.hostContactHtml(row)}</div>` : ""}
${can ? `<div class="row" style="margin-top:10px"><button id="cancel" class="d" type="button">Anulează rezervarea</button></div><div class="msg" id="m"></div>` : ""}</div>`;
      const warn = online ? "Sigur anulezi rezervarea? " + (row.cancel_policy ? POL.cancelPreviewText(outcome) : "Conform condițiilor acceptate la plată, suma plătită NU se returnează. Camera se eliberează imediat.") : "Sigur anulezi rezervarea? Camera se eliberează imediat.";
      const js = can ? COMMON_JS + `$('#cancel').onclick=async()=>{if(!confirm(${JSON.stringify(warn)}))return;try{await api('POST','/api/rezervari/public/rezervare/${req.params.token}/anuleaza',{});location.reload();}catch(e){say($('#m'),e.message,false);}};` : "";
      shell(res, "Rezervarea ta", body, js);
    } catch (e) { console.error("rezervari pagina token:", e.message); res.status(500).send("Eroare"); }
  });
  async function freeAndCancel(rid, by) {
    const up = await dbPool.query(`UPDATE booking_reservations SET status = 'cancelled', cancelled_at = now(), cancelled_by = $2 WHERE id = $1 AND status IN ('confirmed','hold') RETURNING listing_id`, [rid, by]);
    if (up.rowCount) await dbPool.query(`DELETE FROM booking_calendar_days WHERE reservation_id = $1 AND status IN (3,4)`, [rid]);
    return up.rowCount > 0;
  }
  r.post("/api/rezervari/public/rezervare/:token/anuleaza", jsonOnly, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "rez-cancel", 20, 60))) return res.status(429).json({ error: "prea_multe_cereri" });
      const row = await byToken(req.params.token);
      if (!row || row.status !== "confirmed" || (!isOnline(row) && row.ci <= core.todayRo())) return res.status(400).json({ error: "nu_se_poate_anula" });
      let done, out = null;
      if (isOnline(row)) {
        const st = await pay.settleGuestCancel(row, "guest");
        if (!st.ok) return res.status(st.error === "rambursare_esuata" ? 502 : 400).json({ error: st.error });
        done = true; out = st.outcome;
      } else done = await freeAndCancel(row.id, "guest");
      if (done) {
        if (out && row.cancel_policy) await sendMail(row.guest_email, "Rezervare anulată · " + row.listing_name, `<p>Bună, ${E(row.guest_name)},</p><p>Rezervarea ta la <b>${E(row.listing_name)}</b> (${dRo(row.ci)} – ${dRo(row.co)}) a fost anulată.</p><p>${E(POL.cancelPreviewText(out).replace(/ Camera se eliberează imediat\./, ""))}${out.refund > 0 ? " Rambursarea ajunge pe card în câteva zile lucrătoare." : ""}</p>`);
        await require("./bookings-gazda-notify").pushByListing(row.listing_id, { title: "Rezervare anulată de oaspete", body: row.guest_name + " · " + dRo(row.ci) + " – " + dRo(row.co), tag: "gz-r" + row.id });
        await sendMail(row.owner_email, "Rezervare anulată · " + row.listing_name, `<p>${E(row.guest_name)} a anulat rezervarea ${dRo(row.ci)} – ${dRo(row.co)}. Zilele au fost eliberate în calendar.${isOnline(row) ? (out && row.cancel_policy ? (out.refund > 0 ? ` Turistului i s-au returnat ${fmtRon(out.refund)}.` : "") + (out.penalty > 0 ? ` Conform politicii de anulare rămân la tine ${fmtRon(out.penalty)} (minus comisionul, dacă e cazul), plătiți la 24 de ore după data check-in.` : " Anulare gratuită: nu se reține nimic.") : " Conform condițiilor, suma plătită nu se returnează turistului; ți se virează, minus comision, la 24 de ore după data check-in.") : ""}</p>`);
      }
      res.json({ ok: true });
    } catch (e) { console.error("rezervari anulare turist:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // ---------- proprietar: lista rezervărilor + anulare ----------
  r.get("/api/rezervari/:id/rezervari", ...ownerApi, ownListing, async (req, res) => {
    try {
      const rows = (await dbPool.query(
        `SELECT r.*, to_char(r.check_in,'YYYY-MM-DD') AS ci, to_char(r.check_out,'YYYY-MM-DD') AS co, to_char(r.confirmed_at,'YYYY-MM-DD HH24:MI') AS conf
           FROM booking_reservations r WHERE r.listing_id = $1 AND r.status IN ('confirmed','cancelled') AND r.check_out >= (now() AT TIME ZONE 'Europe/Bucharest')::date - 30 ORDER BY r.check_in DESC LIMIT 200`, [req.listing.id])).rows
        .map((x) => ({ id: x.id, unit_ids: x.unit_ids, status: x.status, check_in: x.ci, check_out: x.co, guests: x.guests, party_text: x.nights_snapshot && x.nights_snapshot.party && Array.isArray(x.nights_snapshot.party.ages) ? PARTY.partyText(x.nights_snapshot.party.adults, x.nights_snapshot.party.ages) : "", total_bani: x.total_bani, commission_bani: x.commission_bani, guest_name: x.guest_name, guest_phone: x.guest_phone, guest_email: x.guest_email, confirmed_at: x.conf,
          pay_scheme: x.pay_scheme || "direct", pay_status: x.pay_status || "none", paid_bani: x.paid_bani || 0,
          guarantee_bani: x.guarantee_bani || 0, guarantee_status: x.guarantee_status || "none", guarantee_claimed_bani: x.guarantee_claimed_bani || 0, refused: !!x.refusal_code }));
      noStore(res); res.json({ reservations: rows });
    } catch (e) { console.error("rezervari lista:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.post("/api/rezervari/:id/rezervari/:rid/anuleaza", ...ownerApi, ownListing, async (req, res) => {
    try {
      const rid = toId(req.params.rid);
      const row = (await dbPool.query(`SELECT r.*, to_char(r.check_in,'YYYY-MM-DD') AS ci, to_char(r.check_out,'YYYY-MM-DD') AS co FROM booking_reservations r WHERE r.id = $1 AND r.listing_id = $2`, [rid, req.listing.id])).rows[0];
      if (!row || row.status !== "confirmed") return res.status(404).json({ error: "negasit" });
      let refundTxt = "";
      if (isOnline(row)) {
        const out = await pay.cancelByOwner(row);
        if (!out.ok) return res.status(409).json({ error: out.error });
        refundTxt = row.paid_bani > 0 ? ` Suma plătită (${fmtRon(row.paid_bani)}) se returnează integral pe cardul tău în câteva zile.` : "";
      } else await freeAndCancel(rid, "owner");
      await sendMail(row.guest_email, "Rezervare anulată · " + req.listing.name, `<p>Bună, ${E(row.guest_name)},</p><p>Din păcate gazda a anulat rezervarea ta la <b>${E(req.listing.name)}</b> (${dRo(row.ci)} – ${dRo(row.co)}).${refundTxt} Te rugăm să o contactezi pentru detalii.</p>`);
      res.json({ ok: true });
    } catch (e) { console.error("rezervari anulare gazda:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // ---------- proprietar: refuz motivat (fișă incompletă, date false, comportament) ----------
  const REFUSAL = { form_incomplete: "Fișă de cazare incompletă (turistul refuză transmiterea datelor legale)", false_data: "Date de identificare false / suspecte", fraud: "Comportament neadecvat / tentativă de fraudă", other: "Altul" };
  r.post("/api/rezervari/:id/rezervari/:rid/refuza", ...ownerApi, ownListing, async (req, res) => {
    try {
      const rid = toId(req.params.rid), b = req.body || {};
      const code = String(b.code || ""), note = cleanText(b.note, 300);
      if (!rid || !Object.prototype.hasOwnProperty.call(REFUSAL, code) || note.length < (code === "other" ? 15 : 5)) return res.status(400).json({ error: "date_invalide" });
      if (!(await L.checkRateLimit("own:" + req.accommodationOwner.ownerId, "rez-refuse", 20, 10))) return res.status(429).json({ error: "prea_multe_cereri" });
      const row = (await dbPool.query(`SELECT r.*, to_char(r.check_in,'YYYY-MM-DD') AS ci, to_char(r.check_out,'YYYY-MM-DD') AS co FROM booking_reservations r WHERE r.id = $1 AND r.listing_id = $2`, [rid, req.listing.id])).rows[0];
      if (!row || row.status !== "confirmed" || row.co < core.todayRo()) return res.status(404).json({ error: "negasit" });
      let refunded = 0;
      if (isOnline(row)) { // rambursare integrală (inclusiv comisionul); platforma nu păstrează nimic
        const out = await pay.cancelByOwner(row);
        if (!out.ok) return res.status(409).json({ error: out.error });
        refunded = row.paid_bani || 0;
      } else await freeAndCancel(rid, "owner");
      await dbPool.query(`UPDATE booking_reservations SET cancelled_by = 'refused', refusal_code = $2, refusal_note = $3, refused_at = now() WHERE id = $1`, [rid, code, note]);
      await dbPool.query(`INSERT INTO owner_refusals_log (reservation_id, listing_id, owner_id, code, note, refunded_bani) VALUES ($1,$2,$3,$4,$5,$6)`, [rid, req.listing.id, req.accommodationOwner.ownerId, code, note, refunded]);
      await sendMail(row.guest_email, "Rezervarea ta a fost anulată de gazdă · " + req.listing.name,
        `<p>Bună, ${E(row.guest_name)},</p><p>Te informăm că rezervarea ta la <b>${E(req.listing.name)}</b> pentru perioada ${dRo(row.ci)} – ${dRo(row.co)} a fost anulată de către gazdă din motive de neconformitate cu politicile de check-in (evidența legală a oaspeților).</p>${refunded > 0 ? `<p><b>Rambursare integrală:</b> suma de ${fmtRon(refunded)} a fost returnată automat pe cardul tău. Fondurile vor fi disponibile în funcție de politica băncii tale (de obicei 1-3 zile lucrătoare).</p>` : ""}<p>Te așteptăm înapoi pe site, să alegi o altă locație.</p>`);
      await sendMail(req.accommodationOwner.email, "Confirmare refuz rezervare #" + rid, `<p>Rezervarea #${rid} (${E(row.guest_name)}, ${dRo(row.ci)} – ${dRo(row.co)}) a fost anulată în baza solicitării tale (motiv: ${E(REFUSAL[code])}).</p><p>${refunded > 0 ? `Suma de ${fmtRon(refunded)} a fost returnată integral turistului. ` : ""}Zilele au fost redeschise automat ca libere în calendarul tău și în fluxurile iCal pentru Booking/Airbnb.</p>`);
      noStore(res); res.json({ ok: true });
    } catch (e) { console.error("rezervari refuz:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // ---------- camping: rute și pagină proprii (locuri pe tip, cu stoc) ----------
  const camp = require("./bookings-camp-public")(r, { dbPool, core, L, jsonOnly, noStore, toId, cleanText, sendMail, E, dRo, newCode, codeHash, sha, ipKey, HOLD_MIN, LIVE, SECRET, FORMS, page: () => ({ partyHtml: PARTY_HTML, html: PUB_HTML, base: PUB_BASE, boot: PUB_BOOT }), pay });

  // ---------- pagina publică de rezervare ----------
  const PUB_BASE = COMMON_JS + PARTY.CLIENT_JS + `
const LID=Number(location.pathname.split('/').pop());const P='/api/rezervari/public/'+LID;
const MSG={indisponibil:'Perioada nu mai este liberă.',data_trecuta:'Data aleasă a trecut.',prea_aproape:'Rezervarea instant nu este disponibilă pentru data aleasă. Contactează pensiunea.',check_in_nepermis:'În ziua aleasă nu se poate face check-in.',check_out_nepermis:'În ziua aleasă nu se poate face check-out.',prea_multi_oaspeti:'Prea multe persoane pentru această proprietate.',fara_pret:'Prețul nu este setat încă.',date_invalide:'Date invalide.',prea_multe_cereri:'Prea multe încercări. Încearcă peste câteva minute.',prea_multe_blocari:'Ai deja două rezervări în curs.',email_esuat:'Nu am putut trimite codul pe e-mail. Verifică adresa.',expirat:'Timpul a expirat. Alege din nou perioada.',cod_gresit:'Cod greșit.',prea_multe_incercari:'Prea multe încercări greșite.',asteapta:'Așteaptă puțin înainte de a cere alt cod.',oferta_invalida:'Oferta nu mai este valabilă.'};
const tr=(c)=>{if(/^sedere_minima:/.test(c))return 'Ședere minimă: '+c.split(':')[1]+' nopți.';return MSG[c]||c;};
Object.assign(MSG,{acord_necesar:'Bifează acordul pentru a continua.',plata_indisponibila:'Plata nu este disponibilă momentan. Încearcă din nou.'});
async function call(method,url,body){const r=await fetch(url,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});let j={};try{j=await r.json();}catch(e){}if(!r.ok){const e=new Error(tr(j.error));e.data=j;throw e;}return j;}
const ds=(d)=>d.toISOString().slice(0,10);let info=null,busyMap={},rooms=null,ci=null,co=null,month,tok=null,rid=null,timer=null;
const RO=['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'];
async function loadMonth(){const f=ds(month),t=ds(new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,1)));const j=await call('GET',P+'/disponibilitate?from='+f+'&to='+t);info=j;busyMap=j.busyByUnit||{};if(!$('#nm').dataset.s){$('#nm').textContent=j.name;$('#nm').dataset.s=1;}render();}
const isFull=(s)=>{const k=Object.keys(busyMap);return k.length>0&&k.every(n=>busyMap[n].includes(s));};
function minDay(){const d=new Date(info.today+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+(info.lead_days||0));return ds(d);}
function render(){const g=$('#cal');g.replaceChildren();['L','M','M','J','V','S','D'].forEach(x=>g.append(el('div',{class:'h'},[x])));
const first=month.getUTCDay()===0?6:month.getUTCDay()-1;for(let i=0;i<first;i++)g.append(el('div',{style:'border:0;background:none'}));
const n=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate();
for(let d=1;d<=n;d++){const s=ds(new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth(),d)));const off=isFull(s)||s<minDay();
const inr=ci&&co&&s>=ci&&s<co;const c=el('div',{class:(isFull(s)?'s2':'')+(s<info.today?' past':'')+((s===ci||s===co||inr)?' sel':'')+(off&&s!==co?'':' cl')},[String(d)]);
c.addEventListener('click',()=>pick(s));g.append(c);}
$('#mname').textContent=RO[month.getUTCMonth()]+' '+month.getUTCFullYear();}
function pick(s){if(s<info.today)return;if(!ci||(ci&&co)){if(isFull(s)||s<minDay())return;ci=s;co=null;}else if(s>ci){co=s;}else{if(isFull(s)||s<minDay())return;ci=s;}render();quote();}
function party(){const a=Number($('#adults').value)||1;const ag=[...document.querySelectorAll('#ages select')].map(x=>x.value);return {a,ag,ok:ag.every(v=>v!=='')};}
function bedN(kids,pt){return pt.a+pt.ag.filter(v=>{const b=kids?classify(kids,Number(v)):null;return !(b&&b.nobed);}).length;}
function spLines(sp){return sp.lines.map(l=>(l.count>1?l.count+' × ':'')+l.label+' '+(l.perNightBani/100)+' RON/noapte').join(', ');}
function kidsInfo(){const k=info&&info.kids,b=$('#kidsinfo');if(!b)return;if(!k||(!(k.bands||[]).length&&k.adultExtra==null)){b.textContent='';return;}
const parts=(k.bands||[]).map(x=>{const age=x.from===x.to?x.from+' ani':x.from+'–'+x.to+' ani';return age+': '+(x.mode==='free'?'gratuit':x.mode==='pct'?x.value+'% din prețul adultului':(x.value+' RON/noapte'))+(x.nobed?' (pătuț)':'');});
if(k.adultExtra!=null)parts.push('adult în plus: '+k.adultExtra+' RON/noapte');b.textContent='Copii și persoane în plus: '+parts.join(' · ');}
function ageUi(){const n=Number($('#kidsn').value)||0,box=$('#ages');const old=[...box.querySelectorAll('select')].map(x=>x.value);box.replaceChildren();for(let i=0;i<n;i++){const x=el('select',{class:'age'});x.append(el('option',{value:''},['Vârsta copilului '+(i+1)]));for(let a=0;a<=17;a++)x.append(el('option',{value:String(a)},[a===0?'sub 1 an':(a===1?'1 an':a+' ani')]));if(old[i]!==undefined)x.value=old[i];x.onchange=partyChanged;box.append(x);}partyChanged();}
function partyChanged(){const pt=party();$('#guests').value=String(pt.a+pt.ag.length);if(ci&&co)quote();}
async function quote(){const m=$('#qmsg');$('#go').disabled=true;$('#rooms').replaceChildren();rooms=null;if(!ci||!co){say(m,ci?'Alege data de plecare.':'Alege data de sosire.',true);return;}
const pt=party();if(!pt.ok){say(m,'Alege vârsta fiecărui copil.',true);return;}
try{const q=await call('GET',P+'/oferta?checkin='+ci+'&checkout='+co+'&adults='+pt.a+'&ages='+pt.ag.join(','));
if(q.units&&q.units.length){rooms=q;renderRooms();return;}
if(q.ok){const sp=q.kids?supp(q.kids,{included:q.included,max:q.max,perPerson:q.perPerson},pt.a,pt.ag.map(Number)):{ok:true,perNightBani:0,lines:[]};
if(!sp.ok){say(m,sp.errors.map(tr).join(' '),false);return;}const extra=sp.perNightBani*q.nights;const pd=q.policy&&q.policy.discountBps?Math.round((q.totalBani+extra)*q.policy.discountBps/10000):0;
say(m,q.nights+' nopți · total '+((q.totalBani+extra-pd)/100)+' RON'+(extra?' (inclusiv familie: '+spLines(sp)+')':'')+(pd?' · reducere nerambursabil: -'+(pd/100)+' RON':'')+(q.policy?' · Anulare: '+q.policy.text:''),true);$('#go').disabled=false;}else say(m,q.errors.map(tr).join(' '),false);}catch(e){say(m,e.message,false);}}
function renderRooms(){const box=$('#rooms');box.replaceChildren();const avail=rooms.units.filter(u=>u.ok);
box.append(el('div',{class:'sub'},['Alege camera sau camerele:']));
rooms.units.forEach(u=>{const cb=el('input',{type:'checkbox',id:'rm'+u.no,style:'width:20px;height:20px;margin:0'});cb.disabled=!u.ok;cb.onchange=sum;
box.append(el('label',{style:'display:flex;gap:10px;align-items:center;font-weight:600;color:#17222B;'+(u.ok?'':'opacity:.5')},[cb,el('span',{},[u.name+' · până la '+u.capacity+' pers. · '+(u.ok?(u.totalBani/100)+' RON':(u.errors.map(tr)[0]||'indisponibilă'))])]));});
if(rooms.units.length>1){const all=el('button',{class:'s',type:'button'},['Toată pensiunea']);all.disabled=avail.length!==rooms.units.length;all.onclick=()=>{rooms.units.forEach(u=>{$('#rm'+u.no).checked=true;});sum();};if(rooms.wholeDiscountBps)all.textContent='Toată pensiunea (-'+(rooms.wholeDiscountBps/100)+'%)';box.append(el('div',{class:'row',style:'margin-top:8px'},[all]));}
sum();}
function picked(){return rooms?rooms.units.filter(u=>$('#rm'+u.no)&&$('#rm'+u.no).checked):[];}
function sum(){const m=$('#qmsg'),p=picked(),pt=party(),g=bedN(rooms.kids,pt);$('#go').disabled=true;
if(!p.length){const any=rooms.units.some(u=>u.ok);say(m,any?'Bifează camerele dorite.':((rooms.units[0].errors||[]).map(tr).join(' ')||'Nicio cameră liberă în perioada aleasă.'),any);return;}
const cap=p.reduce((a,u)=>a+u.capacity,0);let tot=p.reduce((a,u)=>a+u.totalBani,0);const tot0=tot;const whole=rooms.units.length>1&&p.length===rooms.units.length&&rooms.wholeDiscountBps;const disc=whole?Math.round(tot*rooms.wholeDiscountBps/10000):0;tot-=disc;
if(g>cap){say(m,'Camerele alese au loc pentru '+cap+' persoane. Alege încă o cameră sau mai puține persoane.',false);return;}
const nn=rooms.nights,inc=p.reduce((a,u)=>a+(u.included||u.capacity),0);const sp=rooms.kids?supp(rooms.kids,{included:inc,max:cap,perPerson:nn&&inc?Math.round(tot0/nn/inc):0},pt.a,pt.ag.map(Number)):{ok:true,perNightBani:0,lines:[]};
if(!sp.ok){say(m,sp.errors.map(tr).join(' '),false);return;}const extra=sp.perNightBani*nn;tot+=extra;const pd=rooms.policy&&rooms.policy.discountBps?Math.round(tot*rooms.policy.discountBps/10000):0;tot-=pd;
say(m,nn+' nopți · total '+(tot/100)+' RON'+(disc?' (reducere toată pensiunea: -'+(disc/100)+' RON)':'')+(pd?' · reducere nerambursabil: -'+(pd/100)+' RON':'')+(extra?' · familie: '+spLines(sp):'')+(rooms.policy?' · Anulare: '+rooms.policy.text:''),true);$('#go').disabled=false;}
$('#prev').onclick=()=>{month=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()-1,1));loadMonth();};
$('#next').onclick=()=>{month=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,1));loadMonth();};
if($('#adults')){$('#adults').onchange=partyChanged;$('#kidsn').onchange=ageUi;}
$('#go').onclick=()=>{$('#s1').hidden=true;$('#s2').hidden=false;};
$('#back').onclick=()=>{$('#s2').hidden=true;$('#s1').hidden=false;};
$('#hold').onclick=async()=>{const m=$('#dmsg');$('#hold').disabled=true;try{const j=await call('POST',P+'/blocheaza',{checkin:ci,checkout:co,adults:party().a,ages:party().ag.map(Number),units:picked().map(u=>u.no),name:$('#gname').value,phone:$('#gphone').value,email:$('#gemail').value,consent:$('#gok').checked});
tok=j.token;rid=j.id;$('#s2').hidden=true;$('#s3').hidden=false;$('#cemail').textContent=$('#gemail').value;countdown(new Date(j.holdUntil));}catch(e){say(m,e.message,false);}$('#hold').disabled=false;};
function countdown(end){clearInterval(timer);const t=()=>{const s=Math.max(0,Math.floor((end-Date.now())/1000));$('#timer').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');if(!s){clearInterval(timer);say($('#cmsg'),tr('expirat'),false);$('#conf').disabled=true;}};t();timer=setInterval(t,1000);}
$('#conf').onclick=async()=>{const m=$('#cmsg');try{const j=await call('POST','/api/rezervari/public/rezervare/'+rid+'/confirma',{token:tok,code:$('#code').value});clearInterval(timer);$('#s3').hidden=true;if(j.pay){startPay(j);}else{$('#s4').hidden=false;$('#mylink').href=j.link||'#';}}catch(e){say(m,e.message+(e.data&&e.data.remaining!=null?' Mai ai '+e.data.remaining+' încercări.':''),false);}};
$('#resend').onclick=async()=>{try{await call('POST','/api/rezervari/public/rezervare/'+rid+'/retrimite-cod',{token:tok});say($('#cmsg'),'Cod retrimis.',true);}catch(e){say($('#cmsg'),e.message,false);}};
function money(b){return (b/100).toLocaleString('ro-RO',{minimumFractionDigits:0,maximumFractionDigits:2})+' RON';}
function startPay(j){const p=j.pay;$('#s5').hidden=false;$('#psub').textContent='Rezervare instant cu plată online securizată (Stripe).';const dr=p.restDueOn?p.restDueOn.split('-').reverse().join('.'):'';
const pol=p.policy||{text:'',accept:'Am înțeles că, dacă anulez eu rezervarea, nu se returnează nicio sumă. Dacă anulează gazda, primesc banii înapoi integral.',discountBani:0};const dsc=pol.discountBani>0?' Reducere nerambursabil: -'+money(pol.discountBani)+' (inclusă în total).':'';
if(p.scheme==='advance'){$('#psum').textContent='Total '+money(p.totalBani)+'. Plătești acum avansul de '+money(p.advanceBani)+' ('+Math.round(p.advanceBani*100/p.totalBani)+'%). Restul de '+money(p.restBani)+' se debitează automat de pe același card pe '+dr+'; cu 3 zile înainte primești un memento pe e-mail.'+dsc+' Politica de anulare: '+pol.text;
$('#pacc-t').textContent='Sunt de acord ca restul de '+money(p.restBani)+' să fie debitat automat de pe acest card pe '+dr+'. Dacă banca refuză debitarea, am 48 de ore să plătesc cu alt card; altfel rezervarea se anulează conform politicii de anulare. '+pol.accept;}
else{$('#psum').textContent='Total '+money(p.totalBani)+'. Plătești acum întreaga sumă.'+dsc+' Politica de anulare: '+pol.text;$('#pacc-t').textContent=pol.accept;}
if(p.guaranteeBani>0){$('#psum').textContent+=' Garanție: '+money(p.guaranteeBani)+' se blochează pe card (nu se debitează) cu o zi înainte de sosire și se eliberează după plecare, dacă nu există daune.';$('#pacc-t').textContent+=' Accept blocarea garanției de '+money(p.guaranteeBani)+' pe acest card; gazda o poate reține doar pentru daune, cu motiv comunicat pe e-mail.';}
$('#pay').textContent='Plătește '+money(p.advanceBani);const end=new Date(p.holdUntil);clearInterval(timer);const t=()=>{const s=Math.max(0,Math.floor((end-Date.now())/1000));$('#timer5').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');if(!s){clearInterval(timer);say($('#pmsg'),tr('expirat'),false);$('#pinit').disabled=true;$('#pay').disabled=true;}};t();timer=setInterval(t,1000);}
$('#pinit').onclick=async()=>{const m=$('#pmsg');if(!$('#pacc').checked){say(m,tr('acord_necesar'),false);return;}$('#pinit').disabled=true;
try{const j=await call('POST','/api/rezervari/public/rezervare/'+rid+'/plata-init',{token:tok,accept:true});if(j.done){waitDone();return;}$('#pinit').hidden=true;$('#paybox').hidden=false;
await mountPay(j.clientSecret,j.publishableKey,$('#pay'),m,location.origin+'/cazare/rezervare/'+tok,waitDone);}catch(e){say(m,e.message,false);$('#pinit').disabled=false;}};
async function waitDone(){const m=$('#pmsg');clearInterval(timer);say(m,'Plata a fost trimisă. Confirmăm rezervarea…',true);$('#pay').disabled=true;
for(let i=0;i<40;i++){try{const s=await call('GET','/api/rezervari/public/rezervare/'+rid+'/stare?token='+tok);if(s.status==='confirmed'){$('#s5').hidden=true;$('#s4').hidden=false;$('#s4t').textContent='Plata a fost efectuată. Ți-am trimis confirmarea pe e-mail.';$('#mylink').href='/cazare/rezervare/'+tok;return;}
if(s.status==='cancelled'||s.status==='expired'){say(m,'Rezervarea nu a putut fi confirmată. Dacă ai fost taxat, suma se returnează automat.',false);return;}}catch(e){}await new Promise(ok=>setTimeout(ok,1500));}
say(m,'Încă procesăm plata. Vei primi un e-mail de confirmare; poți verifica și pe pagina rezervării.',true);$('#mylink').href='/cazare/rezervare/'+tok;$('#s4').hidden=false;$('#s4t').textContent='Plata se procesează. Vei primi confirmarea pe e-mail.';}
`;
  const PUB_BOOT = "(function(){const n=new Date();month=new Date(Date.UTC(n.getFullYear(),n.getMonth(),1));"
    + "async function prefill(){try{if(!$('#adults'))return;const u=new URLSearchParams(location.search);const a=Number(u.get('adulti'));if(a>=1&&a<=10)$('#adults').value=String(a);"
    + "const ag=(u.get('varste')||'').split(',').filter(x=>x!=='');"
    + "if(ag.length&&ag.length<=6&&ag.every(x=>/^[0-9]{1,2}$/.test(x)&&Number(x)<=17)){$('#kidsn').value=String(ag.length);ageUi();[...document.querySelectorAll('#ages select')].forEach((s,i)=>{s.value=ag[i];});}"
    + "const c1=u.get('checkin'),c2=u.get('checkout');"
    + "if(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(c1||'')&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(c2||'')&&c2>c1&&c1>=info.today){ci=c1;co=c2;month=new Date(Date.UTC(Number(c1.slice(0,4)),Number(c1.slice(5,7))-1,1));await loadMonth();render();}"
    + "partyChanged();}catch(e){}}"
    + "loadMonth().then(function(){kidsInfo();return prefill();}).catch(e=>say($('#qmsg'),'Rezervarea nu este disponibilă.',false));})();";
  const PUB_JS = PUB_BASE + PUB_BOOT;
  const PARTY_HTML = '<div class="row" style="gap:10px"><label style="flex:1">Adulți<select id="adults"><option value="1">1</option><option value="2" selected>2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option></select></label><label style="flex:1">Copii (0–17 ani)<select id="kidsn"><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option></select></label></div><div id="ages"></div><div id="kidsinfo" class="sub"></div><input id="guests" type="hidden" value="2">';
  const PUB_HTML = `<h1 id="nm">Rezervare</h1><p class="sub" id="psub">Rezervare instant, cu plată online securizată (Stripe).</p>
<div id="s1"><div class="card"><div class="row" style="align-items:center"><button class="s" id="prev" type="button">‹</button><b id="mname" style="text-align:center"></b><button class="s" id="next" type="button">›</button></div><div class="cal" id="cal" style="margin-top:10px"></div><div class="leg"><span>Albastru = ocupat</span><span>Portocaliu = alegerea ta</span></div>
${PARTY_HTML}<div id="rooms" style="margin-top:8px"></div><div class="msg" id="qmsg"></div><div class="row" style="margin-top:8px"><button id="go" type="button" disabled>Continuă</button></div></div></div>
<div id="s2" hidden><div class="card"><h2>Datele tale</h2><label>Nume complet<input id="gname" maxlength="80" autocomplete="name"></label><label>Telefon<input id="gphone" maxlength="25" inputmode="tel" autocomplete="tel" placeholder="07xx xxx xxx"></label><label>E-mail (primești codul de confirmare)<input id="gemail" type="email" maxlength="160" autocomplete="email"></label>
<label style="display:flex;gap:8px;align-items:flex-start;font-weight:500"><input id="gok" type="checkbox" style="width:20px;height:20px;margin-top:2px;flex:none"><span>Sunt de acord ca datele mele să fie transmise gazdei pentru această rezervare și accept termenii și politica de confidențialitate.</span></label>
<div class="row" style="margin-top:10px"><button class="s" id="back" type="button">Înapoi</button><button id="hold" type="button">Trimite codul</button></div><div class="msg" id="dmsg"></div></div></div>
<div id="s3" hidden><div class="card"><h2>Confirmă rezervarea</h2><p class="sub">Camera îți este ținută încă <b id="timer">10:00</b>. Am trimis un cod de 6 cifre la <b id="cemail"></b>.</p><label>Cod<input id="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code"></label>
<div class="row" style="margin-top:10px"><button class="s" id="resend" type="button">Retrimite codul</button><button id="conf" type="button">Confirmă rezervarea</button></div><div class="msg" id="cmsg"></div></div></div>
<div id="s4" hidden><div class="card"><h2>Rezervare confirmată</h2><p class="sub" id="s4t">Ți-am trimis confirmarea pe e-mail, împreună cu datele gazdei.</p><a id="mylink" href="#">Vezi rezervarea</a></div></div>
<div id="s5" hidden><div class="card"><h2>Plata</h2><p class="sub">Camera îți este ținută încă <b id="timer5">12:00</b>.</p><p id="psum"></p>
<label style="display:flex;gap:8px;align-items:flex-start;font-weight:500"><input id="pacc" type="checkbox" style="width:20px;height:20px;margin-top:2px;flex:none"><span id="pacc-t"></span></label>
<div class="row" style="margin-top:10px"><button id="pinit" type="button">Continuă la plată</button></div><div id="paybox" hidden><div id="pe" style="margin-top:12px"></div><div class="row" style="margin-top:10px"><button id="pay" type="button" disabled>Plătește</button></div></div><div class="msg" id="pmsg"></div></div></div>`;
  r.get("/cazare/rezerva/:id(\\d+)", async (req, res) => {
    try {
      const id = toId(req.params.id);
      const okQ = id ? await dbPool.query(`SELECT 1 FROM accommodation_listings l JOIN booking_settings s ON s.listing_id = l.id WHERE l.id = $1::integer AND l.status = 'approved' AND ${pay ? pay.BOOKABLE_SQL : "FALSE"}`, [id]) : null;
      if (!okQ || !okQ.rowCount) return res.status(404).send("Not found");
      const tyRow = ((await dbPool.query(`SELECT type FROM accommodation_listings WHERE id = $1::integer`, [id])) || {}).rows;
      if (tyRow && tyRow[0] && (tyRow[0].type === "camping" || tyRow[0].type === "hotel_mare")) { // camping / hotel mare: pe tip, cu stoc
        const big = tyRow[0].type === "hotel_mare";
        const html = camp.pageHtml(big);
        if (!html) return res.status(500).send("Eroare");
        return LIVE ? shell(res, "Rezervare", html, camp.pageJs() + pay.STRIPE_CLIENT_JS, { stripe: true }) : shell(res, "Rezervare", html, camp.pageJs());
      }
      if (LIVE) shell(res, "Rezervare", PUB_HTML, PUB_JS + pay.STRIPE_CLIENT_JS, { stripe: true }); else shell(res, "Rezervare", PUB_HTML, PUB_JS);
    } catch (e) { console.error("rezervari pagina publica:", e.message); res.status(500).send("Eroare"); }
  });

  // curățenie: apelată din cron
  return async function cleanupHolds() {
    await dbPool.query(`UPDATE booking_reservations SET status = 'expired' WHERE status = 'hold' AND hold_until < now()`);
    await dbPool.query(`DELETE FROM booking_calendar_days WHERE status = 3 AND blocked_until < now()`);
  };
};

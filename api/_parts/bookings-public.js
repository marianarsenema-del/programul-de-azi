// Rezervări cazare — ETAPA 1: rezervare instant fără plată online.
// Montat din bookings.js (deci respectă aceleași comutatoare: oprit implicit). Per anunț trebuie, în plus,
// ca proprietarul să fi activat „Rezervare instant” (booking_settings.instant_enabled).
"use strict";
const crypto = require("crypto");

module.exports = function mountPublic(r, c) {
  const { dbPool, core, L, jsonOnly, noStore, toId, cleanText, shell, COMMON_JS, ownerApi, ownListing, safeEq, RESEND_API_KEY } = c;
  const HOLD_MIN = 10;
  const PAYMENTS_LIVE = false; // se schimbă când se lansează plata online (Etapa 2)
  const sha = core.sha256;
  const ipKey = (req) => L.hashIp(L.getClientIp(req));

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
  const E = L.escapeHtml;
  const fmtRon = (b) => (b / 100).toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " RON";
  const dRo = (s) => { const [y, m, d] = s.split("-"); return `${d}.${m}.${y}`; };
  const codeHash = (id, access, code) => sha(`${id}:${access}:${code}`);
  const newCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");

  // ---------- anunț public rezervabil ----------
  async function pubListing(req, res, next) {
    try {
      const id = toId(req.params.id);
      if (!id) return res.status(404).json({ error: "negasit" });
      const { rows } = await dbPool.query(
        `SELECT l.id, l.name, l.owner_id, o.email AS owner_email, s.base_price_bani, s.currency, s.min_nights, s.max_guests, s.lead_days, s.commission_bps, s.whole_discount_bps, s.payment_mode
           FROM accommodation_listings l JOIN booking_settings s ON s.listing_id = l.id JOIN accommodation_owners o ON o.id = l.owner_id
          WHERE l.id = $1::integer AND l.status = 'approved' AND s.bookings_enabled AND s.instant_enabled`, [id]);
      if (!rows[0]) return res.status(404).json({ error: "negasit" });
      rows[0].units = (await dbPool.query(`SELECT unit_no, name, capacity, base_price_bani FROM booking_units WHERE listing_id = $1 AND active ORDER BY sort_order, unit_no`, [id])).rows;
      req.pub = rows[0];
      next();
    } catch (e) { console.error("rezervari pubListing:", e.message); res.status(500).json({ error: "eroare" }); }
  }
  // date pentru ofertă, încărcate o singură dată pentru toate camerele
  async function loadQuoteData(lst, checkin, checkout) {
    const rules = (await dbPool.query(`SELECT id, unit_no, kind, to_char(date_from,'YYYY-MM-DD') AS date_from, to_char(date_to,'YYYY-MM-DD') AS date_to, name, price_bani, min_nights, checkin_days, checkout_days, priority, active FROM booking_rate_rules WHERE listing_id = $1 AND active`, [lst.id])).rows;
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
  const guestsOf = (v) => { const n = Number(v); return Number.isInteger(n) && n >= 1 && n <= 100 ? n : null; };

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
      res.json({ name: l.name, units: units.map((u) => ({ no: u.unit_no, name: u.name, capacity: u.capacity })), busyByUnit, today: core.todayRo(), lead_days: l.lead_days, min_nights: l.min_nights || 1, max_guests: l.max_guests });
    } catch (e) { console.error("rezervari disponibilitate:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.get("/api/rezervari/public/:id/oferta", pubListing, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "rez-oferta", 120, 10))) return res.status(429).json({ error: "prea_multe_cereri" });
      const g = guestsOf(req.query.guests);
      if (!g) return res.status(400).json({ error: "date_invalide" });
      const lst = req.pub, units = lst.units || [];
      const data = await loadQuoteData(lst, req.query.checkin, req.query.checkout);
      noStore(res);
      if (!units.length) {
        const q = quoteUnit(lst, data, null, req.query.checkin, req.query.checkout, g);
        return res.json({ ok: q.ok, errors: q.errors, totalBani: q.totalBani || 0, nights: (q.nights || []).length, minNights: q.minNights, units: [] });
      }
      const out = units.map((u) => { const q = quoteUnit(lst, data, u, req.query.checkin, req.query.checkout, g); return { no: u.unit_no, name: u.name, capacity: u.capacity, ok: q.ok, errors: q.errors, totalBani: q.totalBani || 0 }; });
      res.json({ wholeDiscountBps: units.length > 1 ? (lst.whole_discount_bps || 0) : 0, ok: out.some((x) => x.ok), nights: core.isDateStr(req.query.checkin) && core.isDateStr(req.query.checkout) ? core.dayNum(req.query.checkout) - core.dayNum(req.query.checkin) : 0, units: out, errors: [] });
    } catch (e) { console.error("rezervari oferta:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // ---------- pas 1: blocare temporară (10 min) + cod pe e-mail ----------
  r.post("/api/rezervari/public/:id/blocheaza", jsonOnly, pubListing, async (req, res) => {
    const b = req.body || {};
    const name = cleanText(b.name, 80), email = cleanText(b.email, 160).toLowerCase(), phone = cleanText(b.phone, 25).replace(/[^\d+]/g, "");
    const g = guestsOf(b.guests);
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !/^(\+?\d{9,15})$/.test(phone) || !g || b.consent !== true) return res.status(400).json({ error: "date_invalide" });
    if (!(await L.checkRateLimit(ipKey(req), "rez-hold", 8, 60)) || !(await L.checkRateLimit(sha("em:" + email), "rez-hold-em", 5, 60))) return res.status(429).json({ error: "prea_multe_cereri" });
    const lst = req.pub, allUnits = lst.units || [];
    let chosen; // camerele rezervate; [null] = proprietate întreagă
    if (allUnits.length) {
      const nums = Array.isArray(b.units) ? [...new Set(b.units.map(Number))] : [];
      if (!nums.length || nums.length > allUnits.length || !nums.every((n) => allUnits.some((u) => u.unit_no === n))) return res.status(400).json({ error: "date_invalide" });
      chosen = allUnits.filter((u) => nums.includes(u.unit_no));
      if (g > chosen.reduce((a, u) => a + u.capacity, 0)) return res.status(409).json({ error: "oferta_invalida", errors: ["prea_multi_oaspeti"] });
    } else chosen = [null];
    let client;
    try {
      const data = await loadQuoteData(lst, b.checkin, b.checkout);
      const parts = chosen.map((u) => ({ u, q: quoteUnit(lst, data, u, b.checkin, b.checkout, g) }));
      const bad = parts.find((x) => !x.q.ok);
      if (bad) return res.status(409).json({ error: "oferta_invalida", errors: bad.q.errors });
      const subtotal = parts.reduce((a, x) => a + x.q.totalBani, 0);
      const whole = allUnits.length > 1 && chosen.length === allUnits.length; // toate camerele → reducere „toată pensiunea”
      const discount = whole ? Math.round(subtotal * (lst.whole_discount_bps || 0) / 10000) : 0;
      const total = subtotal - discount;
      const snapshot = { discount_bani: discount, whole, units: parts.map((x) => ({ unit_no: x.u ? x.u.unit_no : 0, name: x.u ? x.u.name : null, total_bani: x.q.totalBani, nights: x.q.nights })) };
      const active = (await dbPool.query(`SELECT COUNT(*)::int AS c FROM booking_reservations WHERE status = 'hold' AND hold_until > now() AND (lower(guest_email) = $1 OR guest_phone = $2)`, [email, phone])).rows[0].c;
      if (active >= 2) return res.status(429).json({ error: "prea_multe_blocari" });
      const token = crypto.randomBytes(32).toString("hex"), access = sha(token), code = newCode();
      // comision doar pentru plata online (lansată odată cu Stripe); acum rezervările sunt cu plată directă, fără comision
      const commission = lst.payment_mode === "online" && PAYMENTS_LIVE ? Math.round(total * (lst.commission_bps || 0) / 10000) : 0;
      const pairs = []; // (cameră, zi)
      parts.forEach((x) => x.q.nights.forEach((n) => pairs.push([x.u ? x.u.unit_no : 0, n.day])));
      client = await dbPool.connect();
      await client.query("BEGIN");
      await client.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [lst.id]);
      await client.query(`UPDATE booking_reservations SET status = 'expired' WHERE listing_id = $1 AND status = 'hold' AND hold_until < now()`, [lst.id]);
      await client.query(`DELETE FROM booking_calendar_days WHERE listing_id = $1 AND status = 3 AND blocked_until < now()`, [lst.id]);
      const ins = await client.query(
        `INSERT INTO booking_reservations (listing_id, check_in, check_out, guests, total_bani, commission_bani, currency, nights_snapshot, status, guest_name, guest_phone, guest_email, access_hash, code_expires_at, code_sent_at, hold_until, ip_hash, unit_ids)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'hold',$9,$10,$11,$12, now() + interval '${HOLD_MIN} minutes', now(), now() + interval '${HOLD_MIN} minutes', $13, $14::smallint[]) RETURNING id, hold_until`,
        [lst.id, b.checkin, b.checkout, g, total, commission, lst.currency || "RON", JSON.stringify(snapshot), name, phone, email, access, ipKey(req), parts.map((x) => (x.u ? x.u.unit_no : 0))]);
      const rid = ins.rows[0].id;
      await client.query(`UPDATE booking_reservations SET code_hash = $2 WHERE id = $1`, [rid, codeHash(rid, access, code)]);
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
      noStore(res); res.json({ ok: true, id: rid, token, holdUntil: ins.rows[0].hold_until, totalBani: total });
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
      if (row.code_attempts >= 5) { await client.query("ROLLBACK"); return res.status(429).json({ error: "prea_multe_incercari" }); }
      const ok = row.code_hash && safeEq(row.code_hash, codeHash(rid, sha(token), code));
      if (!ok) {
        await client.query(`UPDATE booking_reservations SET code_attempts = code_attempts + 1 WHERE id = $1`, [rid]);
        await client.query("COMMIT"); return res.status(400).json({ error: "cod_gresit", remaining: Math.max(0, 4 - row.code_attempts) });
      }
      const snap = row.nights_snapshot;
      const nights = Array.isArray(snap) ? snap.length : snap.units.reduce((a, u) => a + u.nights.length, 0);
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
      `<p>Bună, ${E(done.guest_name)},</p><p>Rezervarea ta la <b>${E(done.listing_name)}</b> este confirmată.</p><p>Perioada: ${period} · ${done.guests} persoane${roomsOf(done.nights_snapshot)}<br>Total: <b>${fmtRon(done.total_bani)}</b> (se achită direct la proprietate, conform înțelegerii cu gazda)</p><p><a href="${link}">Vezi sau anulează rezervarea</a></p>`);
    await sendMail(done.owner_email, "Rezervare nouă · " + done.listing_name,
      `<p>Ai o rezervare nouă confirmată la <b>${E(done.listing_name)}</b>.</p><p>${E(done.guest_name)} · ${E(done.guest_phone)} · ${E(done.guest_email)}<br>Perioada: ${period} · ${done.guests} persoane${roomsOf(done.nights_snapshot)} · ${fmtRon(done.total_bani)}</p><p>Zilele s-au blocat automat în calendar. O vezi în contul tău, la Rezervări.</p>`);
    noStore(res); res.json({ ok: true, link });
  });

  // ---------- pagina turistului (după token) ----------
  function roomsOf(snap) {
    const names = snap && !Array.isArray(snap) && snap.units ? snap.units.map((u) => u.name).filter(Boolean) : [];
    return names.length ? "<br>Camere: " + names.map(E).join(", ") : "";
  }
  async function byToken(token) {
    if (!/^[a-f0-9]{64}$/.test(String(token))) return null;
    return (await dbPool.query(`SELECT r.id, r.listing_id, r.status, r.guests, r.total_bani, r.currency, to_char(r.check_in,'YYYY-MM-DD') AS check_in, to_char(r.check_out,'YYYY-MM-DD') AS check_out, r.guest_name, r.nights_snapshot, l.name AS listing_name, o.email AS owner_email
        FROM booking_reservations r JOIN accommodation_listings l ON l.id = r.listing_id JOIN accommodation_owners o ON o.id = l.owner_id WHERE r.access_hash = $1`, [sha(token)])).rows[0] || null;
  }
  r.get("/cazare/rezervare/:token", async (req, res) => {
    try {
      const row = await byToken(req.params.token);
      if (!row || row.status === "hold" || row.status === "expired") return res.status(404).send("Not found");
      const can = row.status === "confirmed" && row.check_in > core.todayRo();
      const body = `<h1>${E(row.listing_name)}</h1><p class="sub">Rezervarea ta</p><div class="card"><b>${row.status === "confirmed" ? "Confirmată" : "Anulată"}</b><div class="sub" style="margin-top:6px">${dRo(row.check_in)} – ${dRo(row.check_out)} · ${row.guests} persoane${roomsOf(row.nights_snapshot)}<br>Total: ${fmtRon(row.total_bani)} (se achită direct la proprietate)</div>
${can ? `<div class="row" style="margin-top:10px"><button id="cancel" class="d" type="button">Anulează rezervarea</button></div><div class="msg" id="m"></div>` : ""}</div>`;
      const js = can ? COMMON_JS + `$('#cancel').onclick=async()=>{if(!confirm('Sigur anulezi rezervarea? Camera se eliberează imediat.'))return;try{await api('POST','/api/rezervari/public/rezervare/${req.params.token}/anuleaza',{});location.reload();}catch(e){say($('#m'),e.message,false);}};` : "";
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
      if (!row || row.status !== "confirmed" || row.check_in <= core.todayRo()) return res.status(400).json({ error: "nu_se_poate_anula" });
      if (await freeAndCancel(row.id, "guest")) {
        await sendMail(row.owner_email, "Rezervare anulată · " + row.listing_name, `<p>${E(row.guest_name)} a anulat rezervarea ${dRo(row.check_in)} – ${dRo(row.check_out)}. Zilele au fost eliberate în calendar.</p>`);
      }
      res.json({ ok: true });
    } catch (e) { console.error("rezervari anulare turist:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // ---------- proprietar: lista rezervărilor + anulare ----------
  r.get("/api/rezervari/:id/rezervari", ...ownerApi, ownListing, async (req, res) => {
    try {
      const rows = (await dbPool.query(
        `SELECT id, unit_ids, status, to_char(check_in,'YYYY-MM-DD') AS check_in, to_char(check_out,'YYYY-MM-DD') AS check_out, guests, total_bani, commission_bani, guest_name, guest_phone, guest_email, to_char(confirmed_at,'YYYY-MM-DD HH24:MI') AS confirmed_at
           FROM booking_reservations WHERE listing_id = $1 AND status IN ('confirmed','cancelled') AND check_out >= (now() AT TIME ZONE 'Europe/Bucharest')::date - 30 ORDER BY check_in DESC LIMIT 200`, [req.listing.id])).rows;
      noStore(res); res.json({ reservations: rows });
    } catch (e) { console.error("rezervari lista:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.post("/api/rezervari/:id/rezervari/:rid/anuleaza", ...ownerApi, ownListing, async (req, res) => {
    try {
      const rid = toId(req.params.rid);
      const row = (await dbPool.query(`SELECT id, guest_name, guest_email, status, to_char(check_in,'YYYY-MM-DD') AS ci, to_char(check_out,'YYYY-MM-DD') AS co FROM booking_reservations WHERE id = $1 AND listing_id = $2`, [rid, req.listing.id])).rows[0];
      if (!row || row.status !== "confirmed") return res.status(404).json({ error: "negasit" });
      await freeAndCancel(rid, "owner");
      await sendMail(row.guest_email, "Rezervare anulată · " + req.listing.name, `<p>Bună, ${E(row.guest_name)},</p><p>Din păcate gazda a anulat rezervarea ta la <b>${E(req.listing.name)}</b> (${dRo(row.ci)} – ${dRo(row.co)}). Te rugăm să o contactezi pentru detalii.</p>`);
      res.json({ ok: true });
    } catch (e) { console.error("rezervari anulare gazda:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // ---------- pagina publică de rezervare ----------
  const PUB_JS = COMMON_JS + `
const LID=Number(location.pathname.split('/').pop());const P='/api/rezervari/public/'+LID;
const MSG={indisponibil:'Perioada nu mai este liberă.',data_trecuta:'Data aleasă a trecut.',prea_aproape:'Rezervarea instant nu este disponibilă pentru data aleasă. Contactează pensiunea.',check_in_nepermis:'În ziua aleasă nu se poate face check-in.',check_out_nepermis:'În ziua aleasă nu se poate face check-out.',prea_multi_oaspeti:'Prea multe persoane pentru această proprietate.',fara_pret:'Prețul nu este setat încă.',date_invalide:'Date invalide.',prea_multe_cereri:'Prea multe încercări. Încearcă peste câteva minute.',prea_multe_blocari:'Ai deja două rezervări în curs.',email_esuat:'Nu am putut trimite codul pe e-mail. Verifică adresa.',expirat:'Timpul a expirat. Alege din nou perioada.',cod_gresit:'Cod greșit.',prea_multe_incercari:'Prea multe încercări greșite.',asteapta:'Așteaptă puțin înainte de a cere alt cod.',oferta_invalida:'Oferta nu mai este valabilă.'};
const tr=(c)=>{if(/^sedere_minima:/.test(c))return 'Ședere minimă: '+c.split(':')[1]+' nopți.';return MSG[c]||c;};
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
async function quote(){const m=$('#qmsg');$('#go').disabled=true;$('#rooms').replaceChildren();rooms=null;if(!ci||!co){say(m,ci?'Alege data de plecare.':'Alege data de sosire.',true);return;}
try{const q=await call('GET',P+'/oferta?checkin='+ci+'&checkout='+co+'&guests='+$('#guests').value);
if(q.units&&q.units.length){rooms=q;renderRooms();return;}
if(q.ok){say(m,q.nights+' nopți · total '+(q.totalBani/100)+' RON',true);$('#go').disabled=false;}else say(m,q.errors.map(tr).join(' '),false);}catch(e){say(m,e.message,false);}}
function renderRooms(){const box=$('#rooms');box.replaceChildren();const avail=rooms.units.filter(u=>u.ok);
box.append(el('div',{class:'sub'},['Alege camera sau camerele:']));
rooms.units.forEach(u=>{const cb=el('input',{type:'checkbox',id:'rm'+u.no,style:'width:20px;height:20px;margin:0'});cb.disabled=!u.ok;cb.onchange=sum;
box.append(el('label',{style:'display:flex;gap:10px;align-items:center;font-weight:600;color:#17222B;'+(u.ok?'':'opacity:.5')},[cb,el('span',{},[u.name+' · până la '+u.capacity+' pers. · '+(u.ok?(u.totalBani/100)+' RON':(u.errors.map(tr)[0]||'indisponibilă'))])]));});
if(rooms.units.length>1){const all=el('button',{class:'s',type:'button'},['Toată pensiunea']);all.disabled=avail.length!==rooms.units.length;all.onclick=()=>{rooms.units.forEach(u=>{$('#rm'+u.no).checked=true;});sum();};if(rooms.wholeDiscountBps)all.textContent='Toată pensiunea (-'+(rooms.wholeDiscountBps/100)+'%)';box.append(el('div',{class:'row',style:'margin-top:8px'},[all]));}
sum();}
function picked(){return rooms?rooms.units.filter(u=>$('#rm'+u.no)&&$('#rm'+u.no).checked):[];}
function sum(){const m=$('#qmsg'),p=picked(),g=Number($('#guests').value)||1;$('#go').disabled=true;
if(!p.length){const any=rooms.units.some(u=>u.ok);say(m,any?'Bifează camerele dorite.':((rooms.units[0].errors||[]).map(tr).join(' ')||'Nicio cameră liberă în perioada aleasă.'),any);return;}
const cap=p.reduce((a,u)=>a+u.capacity,0);let tot=p.reduce((a,u)=>a+u.totalBani,0);const whole=rooms.units.length>1&&p.length===rooms.units.length&&rooms.wholeDiscountBps;const disc=whole?Math.round(tot*rooms.wholeDiscountBps/10000):0;tot-=disc;
if(g>cap){say(m,'Camerele alese au loc pentru '+cap+' persoane. Alege încă o cameră sau mai puține persoane.',false);return;}
say(m,rooms.nights+' nopți · total '+(tot/100)+' RON'+(disc?' (reducere toată pensiunea: -'+(disc/100)+' RON)':''),true);$('#go').disabled=false;}
$('#prev').onclick=()=>{month=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()-1,1));loadMonth();};
$('#next').onclick=()=>{month=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,1));loadMonth();};
$('#guests').onchange=quote;
$('#go').onclick=()=>{$('#s1').hidden=true;$('#s2').hidden=false;};
$('#back').onclick=()=>{$('#s2').hidden=true;$('#s1').hidden=false;};
$('#hold').onclick=async()=>{const m=$('#dmsg');$('#hold').disabled=true;try{const j=await call('POST',P+'/blocheaza',{checkin:ci,checkout:co,guests:Number($('#guests').value),units:picked().map(u=>u.no),name:$('#gname').value,phone:$('#gphone').value,email:$('#gemail').value,consent:$('#gok').checked});
tok=j.token;rid=j.id;$('#s2').hidden=true;$('#s3').hidden=false;$('#cemail').textContent=$('#gemail').value;countdown(new Date(j.holdUntil));}catch(e){say(m,e.message,false);}$('#hold').disabled=false;};
function countdown(end){clearInterval(timer);const t=()=>{const s=Math.max(0,Math.floor((end-Date.now())/1000));$('#timer').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');if(!s){clearInterval(timer);say($('#cmsg'),tr('expirat'),false);$('#conf').disabled=true;}};t();timer=setInterval(t,1000);}
$('#conf').onclick=async()=>{const m=$('#cmsg');try{const j=await call('POST','/api/rezervari/public/rezervare/'+rid+'/confirma',{token:tok,code:$('#code').value});clearInterval(timer);$('#s3').hidden=true;$('#s4').hidden=false;$('#mylink').href=j.link||'#';}catch(e){say(m,e.message+(e.data&&e.data.remaining!=null?' Mai ai '+e.data.remaining+' încercări.':''),false);}};
$('#resend').onclick=async()=>{try{await call('POST','/api/rezervari/public/rezervare/'+rid+'/retrimite-cod',{token:tok});say($('#cmsg'),'Cod retrimis.',true);}catch(e){say($('#cmsg'),e.message,false);}};
(function(){const n=new Date();month=new Date(Date.UTC(n.getFullYear(),n.getMonth(),1));loadMonth().catch(e=>say($('#qmsg'),'Rezervarea nu este disponibilă.',false));})();`;
  const PUB_HTML = `<h1 id="nm">Rezervare</h1><p class="sub">Rezervare instant. Plata se face direct la proprietate.</p>
<div id="s1"><div class="card"><div class="row" style="align-items:center"><button class="s" id="prev" type="button">‹</button><b id="mname" style="text-align:center"></b><button class="s" id="next" type="button">›</button></div><div class="cal" id="cal" style="margin-top:10px"></div><div class="leg"><span>Albastru = ocupat</span><span>Portocaliu = alegerea ta</span></div>
<label>Persoane<input id="guests" type="number" min="1" max="100" value="2"></label><div id="rooms" style="margin-top:8px"></div><div class="msg" id="qmsg"></div><div class="row" style="margin-top:8px"><button id="go" type="button" disabled>Continuă</button></div></div></div>
<div id="s2" hidden><div class="card"><h2>Datele tale</h2><label>Nume complet<input id="gname" maxlength="80" autocomplete="name"></label><label>Telefon<input id="gphone" maxlength="25" inputmode="tel" autocomplete="tel" placeholder="07xx xxx xxx"></label><label>E-mail (primești codul de confirmare)<input id="gemail" type="email" maxlength="160" autocomplete="email"></label>
<label style="display:flex;gap:8px;align-items:flex-start;font-weight:500"><input id="gok" type="checkbox" style="width:20px;height:20px;margin-top:2px;flex:none"><span>Sunt de acord ca datele mele să fie transmise gazdei pentru această rezervare și accept termenii și politica de confidențialitate.</span></label>
<div class="row" style="margin-top:10px"><button class="s" id="back" type="button">Înapoi</button><button id="hold" type="button">Trimite codul</button></div><div class="msg" id="dmsg"></div></div></div>
<div id="s3" hidden><div class="card"><h2>Confirmă rezervarea</h2><p class="sub">Camera îți este ținută încă <b id="timer">10:00</b>. Am trimis un cod de 6 cifre la <b id="cemail"></b>.</p><label>Cod<input id="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code"></label>
<div class="row" style="margin-top:10px"><button class="s" id="resend" type="button">Retrimite codul</button><button id="conf" type="button">Confirmă rezervarea</button></div><div class="msg" id="cmsg"></div></div></div>
<div id="s4" hidden><div class="card"><h2>Rezervare confirmată</h2><p class="sub">Ți-am trimis confirmarea pe e-mail. Plata se face direct la proprietate.</p><a id="mylink" href="#">Vezi rezervarea</a></div></div>`;
  r.get("/cazare/rezerva/:id(\\d+)", async (req, res) => {
    try {
      const id = toId(req.params.id);
      const ok = id && (await dbPool.query(`SELECT 1 FROM accommodation_listings l JOIN booking_settings s ON s.listing_id = l.id WHERE l.id = $1::integer AND l.status = 'approved' AND s.bookings_enabled AND s.instant_enabled`, [id])).rowCount;
      if (!ok) return res.status(404).send("Not found");
      shell(res, "Rezervare", PUB_HTML, PUB_JS);
    } catch (e) { console.error("rezervari pagina publica:", e.message); res.status(500).send("Eroare"); }
  });

  // curățenie: apelată din cron
  return async function cleanupHolds() {
    await dbPool.query(`UPDATE booking_reservations SET status = 'expired' WHERE status = 'hold' AND hold_until < now()`);
    await dbPool.query(`DELETE FROM booking_calendar_days WHERE status = 3 AND blocked_until < now()`);
  };
};

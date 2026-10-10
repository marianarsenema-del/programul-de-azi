// Prețuri: un singur set de date, sincronizat în ambele sensuri.
//   formularul cazării (accommodation_listings.price_* + price_plan)  <->  sistemul de rezervări (setări de bază, tarife, camere, reducere „toată pensiunea”).
// - pull: formular -> rezervări (la activarea rezervărilor, la salvarea formularului sau a planului din aplicație și, o singură dată, la prima deschidere a tarifelor)
// - push: rezervări/aplicația Gazdă -> formularul și pagina pensiunii (după orice schimbare de preț)
// Se sincronizează pensiunile/cabanele/A-frame, apartamentele și hotelurile mici, în RON. Camping etc. rămân cum erau.
// Perioadele speciale (sezoane, sărbători) și ofertele trăiesc în price_plan; din ele se fac reguli de tarif pentru rezervări.
// Totul este „best-effort”: o eroare aici nu oprește niciodată o rezervare sau o salvare; se loghează și atât.
// Semnătura ultimei stări sincronizate (booking_settings.price_sync_sig) împiedică buclele și suprascrierile inutile.
// Coloanele din etapa 6 (price_plan, pct_bps, sync_key) sunt folosite doar dacă scriptul SQL a fost rulat.
"use strict";
const crypto = require("crypto");
const PP = require("./price-plan");

const PENSION = ["pensiune", "cabana", "aframe"];
const HOTEL = "hotel_mic";
const SYNC_TYPES = PENSION.concat(["apartament", HOTEL]);

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : null; };
const r2 = (n) => Math.round(n * 100) / 100;
function parseTd(v) { if (!v) return {}; if (typeof v === "object") return v; try { return JSON.parse(v) || {}; } catch (e) { return {}; } }
function todayRo() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function sigOf(mode, n, pr, pw, pp, ppw, pf, extra) {
  const base = [mode, n, pr, pw, pp, ppw, pf];
  return crypto.createHash("sha1").update(JSON.stringify(extra === undefined ? base : base.concat([extra]))).digest("hex").slice(0, 16);
}

// camerele hotelului, una câte una (din tipurile de cameră); null dacă sunt prea puține sau prea multe pentru rezervări
function hotelRooms(td) {
  const rts = Array.isArray(td.roomTypes) ? td.roomTypes : [];
  const out = [];
  rts.forEach((rt, i) => {
    if (!rt || !rt.name) return;
    const c = Math.max(1, parseInt(rt.count, 10) || 1);
    const cap = Math.min(50, Math.max(1, (parseInt(rt.adults, 10) || 0) + (parseInt(rt.children, 10) || 0)));
    for (let j = 1; j <= c && out.length <= 60; j++) out.push({ key: `rt${i}-${j}`, type: i, name: String(c > 1 ? `${rt.name} ${j}` : rt.name).slice(0, 60), cap, price: num(rt.price) });
  });
  return out.length >= 2 && out.length <= 50 ? out : null;
}

// starea formularului, normalizată
function readListing(row) {
  const td = parseTd(row.type_details);
  const hotel = row.type === HOTEL;
  const pension = PENSION.includes(row.type);
  const plan = PP.sanitizePlan(row.price_plan, { hotel });
  const rooms = hotel ? hotelRooms(td) : null;
  let pr = num(row.price_per_room), pw = num(row.price_weekend), pp = num(row.price_per_property), ppw = num(row.price_property_weekend), pf = num(row.price_from);
  let mode = pension ? (["integral", "camere", "hibrid"].includes(td.rentalMode) ? td.rentalMode : "integral") : "integral";
  let n = pension && Array.isArray(td.bedrooms) ? td.bedrooms.length : 0;
  if (hotel) { // prețul de bază = cea mai ieftină cameră; weekendul hotelului e în procent (plan.weekendPct)
    const prices = (Array.isArray(td.roomTypes) ? td.roomTypes : []).map((rt) => num(rt && rt.price)).filter(Boolean);
    pr = prices.length ? Math.min(...prices) : pr; pw = null; ppw = null; pf = pr || pf;
    mode = pp ? "hibrid" : "camere"; n = rooms ? rooms.length : 0;
  }
  const extra = hotel || plan.seasons.length || plan.weekendPct != null || plan.minNights != null
    ? [PP.planSignature(plan), rooms ? rooms.map((x) => [x.key, x.name, x.cap, x.price]) : null, todayRo().slice(0, 4)] : undefined;
  return { td, hotel, pension, mode, n, pr, pw, pp, ppw, pf, plan, rooms, sig: sigOf(mode, n, pr, pw, pp, ppw, pf, extra), extra };
}

module.exports = function (dbPool) {
  const BASE_COLS = `l.id, l.type, l.price_currency, l.price_per_room, l.price_weekend, l.price_per_property, l.price_property_weekend, l.price_from, l.type_details, l.max_capacity`;
  const SET_COLS = `s.bookings_enabled, s.base_price_bani, s.whole_discount_bps, s.price_sync_sig, s.min_nights AS set_min_nights`;

  // ce coloane din etapa 6 există (cache scurt); la orice eroare considerăm că nu există
  let capsCache = null, capsAt = 0;
  async function caps() {
    if (capsCache && Date.now() - capsAt < 60000) return capsCache;
    let c = { plan: false, rules: false, units: false };
    try {
      const q = await dbPool.query(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = ANY(current_schemas(false)) AND ((table_name = 'booking_rate_rules' AND column_name IN ('pct_bps','sync_key')) OR (table_name = 'booking_units' AND column_name = 'sync_key') OR (table_name = 'accommodation_listings' AND column_name = 'price_plan'))`);
      const has = (t, col) => q.rows.some((r) => r.table_name === t && r.column_name === col);
      c = { plan: has("accommodation_listings", "price_plan"), rules: has("booking_rate_rules", "pct_bps") && has("booking_rate_rules", "sync_key"), units: has("booking_units", "sync_key") };
    } catch (e) { /* fără etapa 6 */ }
    capsCache = c; capsAt = Date.now();
    return c;
  }

  async function load(id, c) {
    const sql = `SELECT ${BASE_COLS}${c.plan ? ", l.price_plan" : ""},
        ${SET_COLS}
      FROM accommodation_listings l JOIN booking_settings s ON s.listing_id = l.id WHERE l.id = $1::integer`;
    const row = (await dbPool.query(sql, [id])).rows[0];
    if (!row || !SYNC_TYPES.includes(row.type) || (row.price_currency || "RON") !== "RON") return null;
    return row;
  }

  // formular -> rezervări
  async function pull(id, opts) {
    try {
      const c = await caps();
      const row = await load(id, c);
      if (!row) return { skipped: true };
      const L = readListing(row);
      if (!(opts && opts.force) && row.price_sync_sig === L.sig) return { unchanged: true };
      const first = !row.price_sync_sig;
      const base = L.hotel ? (L.pr || L.pf) : (L.mode === "integral" ? (L.pp || L.pf) : (L.pr || L.pf));
      const weekend = L.mode === "integral" ? L.ppw : L.pw;
      const client = await dbPool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [id]);
        if (base) await client.query(`UPDATE booking_settings SET base_price_bani = $2, updated_at = now() WHERE listing_id = $1`, [id, Math.round(base * 100)]);
        // tarif weekend global (fără cameră anume)
        const wk = (await client.query(`SELECT id FROM booking_rate_rules WHERE listing_id = $1 AND active AND kind = 'weekend' AND unit_no IS NULL ORDER BY id LIMIT 1`, [id])).rows[0];
        if (L.hotel) {
          // hotel: weekendul = prețul camerei + X% (necesită coloana pct_bps)
          if (c.rules) {
            if (L.plan.weekendPct != null) {
              const bps = Math.round(L.plan.weekendPct * 100);
              if (wk) await client.query(`UPDATE booking_rate_rules SET price_bani = 0, pct_bps = $2 WHERE id = $1`, [wk.id, bps]);
              else await client.query(`INSERT INTO booking_rate_rules (listing_id, name, kind, price_bani, pct_bps, priority) VALUES ($1,'Weekend','weekend',0,$2,0)`, [id, bps]);
            } else if (wk && !first) {
              await client.query(`UPDATE booking_rate_rules SET active = FALSE WHERE id = $1`, [wk.id]);
            }
          }
        } else if (weekend) {
          if (wk) await client.query(`UPDATE booking_rate_rules SET price_bani = $2 WHERE id = $1`, [wk.id, Math.round(weekend * 100)]);
          else await client.query(`INSERT INTO booking_rate_rules (listing_id, name, kind, price_bani, priority) VALUES ($1,'Weekend','weekend',$2,0)`, [id, Math.round(weekend * 100)]);
        } else if (wk && !first) {
          await client.query(`UPDATE booking_rate_rules SET active = FALSE WHERE id = $1`, [wk.id]); // proprietarul a scos prețul de weekend din formular
        }
        // camere: doar dacă pensiunea se închiriază pe camere și nu există încă nicio cameră în rezervări
        const act = (await client.query(`SELECT COUNT(*)::int AS c, COALESCE(MAX(unit_no),0)::int AS m FROM booking_units WHERE listing_id = $1 AND active`, [id])).rows[0];
        if (!L.hotel && L.mode !== "integral" && L.n >= 2 && act.c === 0) {
          const mx = (await client.query(`SELECT COALESCE(MAX(unit_no),0)::int AS m FROM booking_units WHERE listing_id = $1`, [id])).rows[0].m;
          const cap = Math.max(1, Math.ceil((parseInt(row.max_capacity, 10) || L.n * 2) / L.n));
          for (let i = 1; i <= Math.min(L.n, 50 - mx); i++) {
            await client.query(`INSERT INTO booking_units (listing_id, unit_no, name, capacity, sort_order) VALUES ($1,$2,$3,$4,$2)`, [id, mx + i, "Camera " + i, Math.min(cap, 50)]);
          }
          await client.query(`UPDATE booking_calendar_days SET unit_id = $2 WHERE listing_id = $1 AND unit_id = 0`, [id, mx + 1]);
          await client.query(`UPDATE booking_ical_feeds SET unit_id = $2 WHERE listing_id = $1 AND unit_id = 0`, [id, mx + 1]);
          await client.query(`UPDATE booking_reservations SET unit_ids = ARRAY[$2::smallint] WHERE listing_id = $1 AND unit_ids = ARRAY[0::smallint] AND status IN ('hold','confirmed')`, [id, mx + 1]);
        }
        // hotel: fiecare cameră din tipurile de cameră devine o cameră în rezervări (cu prețul tipului ei)
        if (L.hotel && L.rooms && c.units) {
          const own = (await client.query(`SELECT unit_no, sync_key FROM booking_units WHERE listing_id = $1 AND sync_key IS NOT NULL`, [id])).rows;
          if (own.length || act.c === 0) {
            const mx = (await client.query(`SELECT COALESCE(MAX(unit_no),0)::int AS m FROM booking_units WHERE listing_id = $1`, [id])).rows[0].m;
            const byKey = new Map(own.map((u) => [u.sync_key, u.unit_no]));
            let next = mx, firstNew = null;
            for (const rm of L.rooms) {
              const bani = rm.price ? Math.round(rm.price * 100) : null;
              if (byKey.has(rm.key)) {
                await client.query(`UPDATE booking_units SET name = $3, capacity = $4, base_price_bani = $5, active = TRUE WHERE listing_id = $1 AND unit_no = $2`, [id, byKey.get(rm.key), rm.name, rm.cap, bani]);
              } else if (next < 50) {
                next += 1; if (firstNew === null) firstNew = next;
                await client.query(`INSERT INTO booking_units (listing_id, unit_no, name, capacity, base_price_bani, sort_order, sync_key) VALUES ($1,$2,$3,$4,$5,$2,$6)`, [id, next, rm.name, rm.cap, bani, rm.key]);
              }
            }
            if (act.c === 0 && firstNew !== null) { // rezervările / zilele blocate de dinainte (proprietate întreagă) trec pe prima cameră
              await client.query(`UPDATE booking_calendar_days SET unit_id = $2 WHERE listing_id = $1 AND unit_id = 0`, [id, firstNew]);
              await client.query(`UPDATE booking_ical_feeds SET unit_id = $2 WHERE listing_id = $1 AND unit_id = 0`, [id, firstNew]);
              await client.query(`UPDATE booking_reservations SET unit_ids = ARRAY[$2::smallint] WHERE listing_id = $1 AND unit_ids = ARRAY[0::smallint] AND status IN ('hold','confirmed')`, [id, firstNew]);
            }
          }
        }
        // reducerea „toată pensiunea” din prețul întreg al formularului (modul hibrid)
        if (L.mode === "hibrid" && L.pr && L.pp && L.n >= 2) {
          const sum = L.hotel && L.rooms ? L.rooms.reduce((a, x) => a + (x.price || L.pr), 0) : L.pr * L.n;
          const bps = Math.max(0, Math.min(5000, Math.round((1 - L.pp / sum) * 10000)));
          await client.query(`UPDATE booking_settings SET whole_discount_bps = $2 WHERE listing_id = $1`, [id, bps]);
        }
        // nopți minime din formular -> setările rezervărilor (gol în formular = nu atingem setarea)
        if (L.plan.minNights != null && L.plan.minNights >= 1 && (row.set_min_nights || 1) !== L.plan.minNights) {
          await client.query(`UPDATE booking_settings SET min_nights = $2, updated_at = now() WHERE listing_id = $1`, [id, L.plan.minNights]);
        }
        // perioade speciale din plan -> reguli de tarif (o regulă pentru fiecare apariție viitoare)
        if (c.rules && c.plan) await materializeSeasons(client, id, L);
        await client.query(`UPDATE booking_settings SET price_sync_sig = $2 WHERE listing_id = $1`, [id, L.sig]);
        await client.query("COMMIT");
      } catch (e) { await client.query("ROLLBACK").catch(() => {}); throw e; } finally { client.release(); }
      return { ok: true };
    } catch (e) { console.error("bookings-sync pull:", e.message); return { error: true }; }
  }

  async function materializeSeasons(client, id, L) {
    const today = todayRo();
    const desired = new Map();
    L.plan.seasons.forEach((s) => PP.occurrences(s, today, 730).forEach((o) => desired.set(`s:${s.id}:${o.year}`, { s, o })));
    const ex = (await client.query(`SELECT id, sync_key FROM booking_rate_rules WHERE listing_id = $1 AND sync_key LIKE 's:%'`, [id])).rows;
    const byKey = new Map(ex.map((r) => [r.sync_key, r.id]));
    for (const [key, d] of desired) {
      const bani = L.hotel ? 0 : Math.round(d.s.price * 100);
      const bps = L.hotel ? Math.round(d.s.pct * 100) : null;
      if (byKey.has(key)) {
        await client.query(`UPDATE booking_rate_rules SET name = $2, date_from = $3, date_to = $4, price_bani = $5, pct_bps = $6, min_nights = $7, active = TRUE, priority = 10 WHERE id = $1`, [byKey.get(key), d.s.name, d.o.from, d.o.to, bani, bps, d.s.minNights]);
      } else {
        await client.query(`INSERT INTO booking_rate_rules (listing_id, name, kind, date_from, date_to, price_bani, pct_bps, min_nights, priority, sync_key) VALUES ($1,$2,'interval',$3,$4,$5,$6,$7,10,$8)`, [id, d.s.name, d.o.from, d.o.to, bani, bps, d.s.minNights, key]);
      }
    }
    for (const r of ex) if (!desired.has(r.sync_key)) await client.query(`UPDATE booking_rate_rules SET active = FALSE WHERE id = $1 AND active`, [r.id]);
  }

  // nopți minime schimbate în aplicație -> intră în plan (1 și „gol" sunt același lucru)
  async function adoptMinNights(id, plan0, row, c) {
    if (!c.plan) return plan0;
    const set = row.set_min_nights && row.set_min_nights > 1 ? row.set_min_nights : null;
    if (set === (plan0.minNights && plan0.minNights > 1 ? plan0.minNights : null)) return plan0;
    const plan = Object.assign({}, plan0, { minNights: set });
    await dbPool.query(`UPDATE accommodation_listings SET price_plan = $2 WHERE id = $1::integer`, [id, JSON.stringify(plan)]);
    return plan;
  }

  // rezervări/aplicație -> formular + pagina pensiunii
  async function push(id) {
    try {
      const c = await caps();
      const row = await load(id, c);
      if (!row || !row.base_price_bani) return { skipped: true };
      const L = readListing(row);
      const base = row.base_price_bani / 100;
      const units = (await dbPool.query(`SELECT base_price_bani FROM booking_units WHERE listing_id = $1 AND active ORDER BY sort_order, unit_no`, [id])).rows;
      if (L.hotel) return await pushHotel(id, row, L, c);
      const wk = (await dbPool.query(`SELECT price_bani FROM booking_rate_rules WHERE listing_id = $1 AND active AND kind = 'weekend' AND unit_no IS NULL ORDER BY id LIMIT 1`, [id])).rows[0];
      const weekend = wk ? wk.price_bani / 100 : null;
      const k = units.length;
      const bps = row.whole_discount_bps || 0;
      let mode = L.mode, pr = null, pw = null, pp = null, ppw = null, pf = null;
      if (!L.pension) { // apartament: un singur preț pe noapte
        pp = L.pp ? base : null; ppw = weekend; pf = base;
      } else {
        if (k >= 2 && mode === "integral") mode = "hibrid"; // gazda a definit camere în rezervări
        if (mode === "integral") { pp = base; ppw = weekend; }
        else {
          pr = base; pw = weekend;
          if (mode === "hibrid") {
            const sum = k >= 2 ? units.reduce((a, u) => a + (u.base_price_bani != null ? u.base_price_bani / 100 : base), 0) : base * Math.max(L.n, 1);
            const cnt = k >= 2 ? k : Math.max(L.n, 1);
            pp = Math.round(sum * (1 - bps / 10000));
            ppw = weekend ? Math.round(weekend * cnt * (1 - bps / 10000)) : null;
          }
        }
        const pos = [pr, pp].filter((x) => x > 0);
        pf = pos.length ? Math.min(...pos) : base;
      }
      const td = L.td && typeof L.td === "object" ? L.td : {};
      const setTd = L.pension && mode !== L.mode;
      if (setTd) td.rentalMode = mode;
      // perioade create direct în rezervări (Cont › tarife) intră în plan, ca să apară în formular și pe pagină
      let plan = c.rules && c.plan ? await adoptRules(id, L.plan) : L.plan;
      plan = await adoptMinNights(id, plan, row, c);
      const extraNew = L.hotel || plan.seasons.length || plan.weekendPct != null || plan.minNights != null
        ? [PP.planSignature(plan), null, todayRo().slice(0, 4)] : undefined;
      const sig = sigOf(mode, L.n, pr ? r2(pr) : null, pw ? r2(pw) : null, pp ? r2(pp) : null, ppw ? r2(ppw) : null, pf ? r2(pf) : null, extraNew);
      const vals = [id, pr, pw, pp, ppw, pf];
      // NU atingem status-ul anunțului (modificarea din aplicație nu cere reaprobare) și nici alte câmpuri
      await dbPool.query(
        `UPDATE accommodation_listings SET price_per_room = $2, price_weekend = $3, price_per_property = $4, price_property_weekend = $5, price_from = $6${setTd ? ", type_details = $7" : ""} WHERE id = $1::integer`,
        setTd ? vals.concat([JSON.stringify(td)]) : vals);
      await dbPool.query(`UPDATE booking_settings SET price_sync_sig = $2 WHERE listing_id = $1`, [id, sig]);
      return { ok: true };
    } catch (e) { console.error("bookings-sync push:", e.message); return { error: true }; }
  }

  // hotel: prețul fiecărui tip de cameră se citește înapoi din camerele create de sincronizare
  async function pushHotel(id, row, L, c) {
    if (!c.units || !L.rooms) return { skipped: true };
    const us = (await dbPool.query(`SELECT sync_key, base_price_bani FROM booking_units WHERE listing_id = $1 AND active AND sync_key IS NOT NULL`, [id])).rows;
    if (!us.length) return { skipped: true };
    const td = L.td && typeof L.td === "object" ? L.td : {};
    const byType = new Map();
    us.forEach((u) => { const m = /^rt(\d+)-/.exec(u.sync_key || ""); if (m && u.base_price_bani != null) { const k = +m[1]; byType.set(k, Math.min(byType.has(k) ? byType.get(k) : Infinity, u.base_price_bani / 100)); } });
    let changed = false;
    (Array.isArray(td.roomTypes) ? td.roomTypes : []).forEach((rt, i) => { if (rt && byType.has(i) && Number(rt.price) !== byType.get(i)) { rt.price = byType.get(i); changed = true; } });
    const prices = (Array.isArray(td.roomTypes) ? td.roomTypes : []).map((rt) => num(rt && rt.price)).filter(Boolean);
    const pf = prices.length ? Math.min(...prices) : L.pf;
    if (changed) await dbPool.query(`UPDATE accommodation_listings SET type_details = $2, price_from = $3 WHERE id = $1::integer`, [id, JSON.stringify(td), pf]);
    const plan = await adoptMinNights(id, L.plan, row, c);
    const L2 = readListing(Object.assign({}, row, { type_details: JSON.stringify(td), price_from: pf }, c.plan ? { price_plan: JSON.stringify(plan) } : {}));
    await dbPool.query(`UPDATE booking_settings SET price_sync_sig = $2 WHERE listing_id = $1`, [id, L2.sig]);
    return { ok: true };
  }

  // reguli create direct în rezervări (fără legătură cu planul) -> perioade în plan; schimbările de preț / nopți minime se preiau
  async function adoptRules(id, plan0) {
    const plan = JSON.parse(JSON.stringify(plan0));
    const rules = (await dbPool.query(`SELECT id, name, to_char(date_from,'YYYY-MM-DD') AS date_from, to_char(date_to,'YYYY-MM-DD') AS date_to, price_bani, min_nights, sync_key FROM booking_rate_rules WHERE listing_id = $1 AND active AND kind = 'interval' AND unit_no IS NULL`, [id])).rows;
    let changed = false;
    for (const r of rules) {
      if (!r.sync_key) {
        if (!(r.price_bani > 0) || plan.seasons.length >= PP.MAX_SEASONS) continue;
        const sid = "r" + r.id;
        plan.seasons.push({ id: sid, name: String(r.name || "Perioadă").slice(0, 80), from: r.date_from, to: r.date_to, price: r.price_bani / 100, pct: null, minNights: r.min_nights || null, yearly: false });
        await dbPool.query(`UPDATE booking_rate_rules SET sync_key = $2 WHERE id = $1`, [r.id, `s:${sid}:${r.date_from.slice(0, 4)}`]);
        changed = true;
      } else {
        const m = /^s:([^:]+):/.exec(r.sync_key);
        const s = m ? plan.seasons.find((x) => x.id === m[1]) : null;
        if (!s) continue;
        const price = r.price_bani / 100;
        if (s.price !== price || (s.minNights || null) !== (r.min_nights || null) || s.name !== r.name || (!s.yearly && (s.from !== r.date_from || s.to !== r.date_to))) {
          s.price = price; s.minNights = r.min_nights || null; s.name = String(r.name || s.name).slice(0, 80);
          if (!s.yearly) { s.from = r.date_from; s.to = r.date_to; }
          changed = true;
        }
      }
    }
    if (!changed) return plan0;
    const clean = PP.sanitizePlan(plan, { hotel: false });
    await dbPool.query(`UPDATE accommodation_listings SET price_plan = $2 WHERE id = $1::integer`, [id, JSON.stringify(clean)]);
    return clean;
  }

  // proprietarul șterge o perioadă din Cont › tarife: dispare și din plan (formular + pagină)
  async function dropSeasonOfRule(id, ruleId) {
    try {
      const c = await caps();
      if (!c.rules || !c.plan) return;
      const r = (await dbPool.query(`SELECT sync_key FROM booking_rate_rules WHERE id = $1 AND listing_id = $2`, [ruleId, id])).rows[0];
      const m = r && /^s:([^:]+):/.exec(r.sync_key || "");
      if (!m) return;
      const row = (await dbPool.query(`SELECT type, price_plan FROM accommodation_listings WHERE id = $1::integer`, [id])).rows[0];
      if (!row) return;
      const plan = PP.sanitizePlan(row.price_plan, { hotel: row.type === HOTEL });
      plan.seasons = plan.seasons.filter((s) => s.id !== m[1]);
      await dbPool.query(`UPDATE accommodation_listings SET price_plan = $2 WHERE id = $1::integer`, [id, JSON.stringify(plan)]);
      await dbPool.query(`UPDATE booking_rate_rules SET active = FALSE WHERE listing_id = $1 AND sync_key LIKE $2`, [id, `s:${m[1]}:%`]);
    } catch (e) { console.error("bookings-sync dropSeasonOfRule:", e.message); }
  }

  // planul de prețuri al unei cazări (pentru aplicația Gazdă); ofertele vechi (text pe linii) devin oferte fără dată
  async function getPlan(id) {
    const c = await caps();
    const row = (await dbPool.query(`SELECT type, type_details, special_offers${c.plan ? ", price_plan" : ""} FROM accommodation_listings WHERE id = $1::integer`, [id])).rows[0];
    if (!row) return null;
    const hotel = row.type === HOTEL;
    const plan = PP.planOf(row, hotel);
    const td = parseTd(row.type_details);
    const pension = PENSION.includes(row.type);
    const mode = pension ? (["integral", "camere", "hibrid"].includes(td.rentalMode) ? td.rentalMode : "integral") : "";
    const n = pension && Array.isArray(td.bedrooms) ? td.bedrooms.length : 0;
    return { plan, hotel, type: row.type, stored: c.plan, mode, n };
  }
  // pensiune închiriată doar întreagă, cu mai multe camere: gazda poate seta și prețul pe cameră din aplicație (devine „hibrid")
  async function setRoomPrice(id, price) {
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0 || p > 100000) return { error: "pret_invalid" };
    const c = await caps();
    const row = await load(id, c);
    if (!row) return { error: "negasit" };
    const L = readListing(row);
    if (!L.pension || L.mode !== "integral" || L.n < 2) return { error: "nu_se_aplica" };
    const td = L.td && typeof L.td === "object" ? L.td : {};
    td.rentalMode = "hibrid";
    // weekendul întreg se păstrează, proporțional, ca preț de weekend pe cameră (altfel s-ar pierde la trecerea în hibrid)
    const pw = L.pp && L.ppw ? Math.round(p * L.ppw / L.pp) : null;
    const pr = Math.round(p * 100) / 100;
    const pf = L.pp ? Math.min(pr, L.pp) : pr;
    await dbPool.query(`UPDATE accommodation_listings SET price_per_room = $2, price_weekend = $3, price_from = $4, type_details = $5 WHERE id = $1::integer`, [id, pr, pw, pf, JSON.stringify(td)]);
    await pull(id, { force: true });
    return { ok: true };
  }
  // salvează o parte din plan (perioade, oferte, weekend hotel); fără re-aprobare; apoi rezervările se aliniază
  async function savePlan(id, input) {
    const c = await caps();
    if (!c.plan) return { error: "sql_lipsa" };
    const cur = await getPlan(id);
    if (!cur) return { error: "negasit" };
    const merged = Object.assign({}, cur.plan);
    ["seasons", "offers", "weekendPct"].forEach((k) => { if (input && input[k] !== undefined) merged[k] = input[k]; });
    const clean = PP.sanitizePlan(merged, { hotel: cur.hotel });
    const offersTxt = PP.offersText(clean, todayRo());
    await dbPool.query(`UPDATE accommodation_listings SET price_plan = $2, special_offers = $3 WHERE id = $1::integer`, [id, JSON.stringify(clean), offersTxt || null]);
    await pull(id, { force: true });
    return { ok: true, plan: clean };
  }

  // după salvarea formularului: doar dacă rezervările sunt pornite pentru anunț
  async function onListingSaved(id) {
    try {
      const r = (await dbPool.query(`SELECT bookings_enabled FROM booking_settings WHERE listing_id = $1::integer`, [id])).rows[0];
      if (r && r.bookings_enabled) await pull(id);
    } catch (e) { console.error("bookings-sync onListingSaved:", e.message); }
  }
  return { pull, push, onListingSaved, ensure: (id) => pull(id), getPlan, savePlan, dropSeasonOfRule, setRoomPrice };
};
module.exports.readListing = readListing;
module.exports.hotelRooms = hotelRooms;
module.exports.SYNC_TYPES = SYNC_TYPES;

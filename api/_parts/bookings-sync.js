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
const CAMP = require("./bookings-camp");
const PARTY = require("./bookings-party");

const PENSION = ["pensiune", "cabana", "aframe"];
const HOTEL = "hotel_mic";
const MARE = "hotel_mare"; // hotel / resort mare: rezervări pe tip de cameră, cu stoc (ca la camping), fără limita de 50 de camere
const SYNC_TYPES = PENSION.concat(["apartament", HOTEL, MARE]);

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
    const oht = Math.min(c, Math.max(1, parseInt(rt.oht, 10) || c)); // câte camere se vând prin OHT
    const lbl = Array.isArray(rt.labels) ? rt.labels : [];
    for (let j = 1; j <= c && out.length <= 60; j++) {
      const lb = typeof lbl[j - 1] === "string" ? lbl[j - 1].trim() : "";
      const nm = lb ? `${rt.name} ${lb}` : (c > 1 ? `${rt.name} ${j}` : rt.name);
      out.push({ key: `rt${i}-${j}`, type: i, name: String(nm).slice(0, 60), cap, price: num(rt.price), off: j > oht });
    }
  });
  return out.length >= 2 && out.length <= 50 ? out : null;
}

// camerele pensiunii cu nume / capacitate / preț propriu devin unități în rezervări (cheie br0, br1…); null = modelul vechi (camere identice)
const BED_PERSONS = { king: 2, dublu: 2, single: 1, supraetajat: 2 };
function pensionRooms(td) {
  const bs = Array.isArray(td.bedrooms) ? td.bedrooms : [];
  if (bs.length < 2 || bs.length > 50 || !bs.some((b) => b && (b.name || num(b.price) || parseInt(b.cap, 10) > 0))) return null;
  return bs.map((b, i) => {
    b = b && typeof b === "object" ? b : {};
    const derived = (Array.isArray(b.beds) ? b.beds : []).reduce((a, k) => a + (BED_PERSONS[k] || 0), 0) || 2;
    const cp = parseInt(b.cap, 10);
    return { key: "br" + i, name: String(b.name || "").trim().slice(0, 60), cap: Math.min(50, Math.max(1, cp > 0 ? cp : derived)), capSet: cp > 0, price: num(b.price) };
  });
}

// starea formularului, normalizată
function readListing(row) {
  const td = parseTd(row.type_details);
  const big = row.type === MARE;
  const hotel = row.type === HOTEL || big;
  const pension = PENSION.includes(row.type);
  const plan = PP.sanitizePlan(row.price_plan, { hotel });
  const rooms = row.type === HOTEL ? hotelRooms(td) : null;
  const stock = big ? CAMP.campModel(td) : null;
  let pr = num(row.price_per_room), pw = num(row.price_weekend), pp = num(row.price_per_property), ppw = num(row.price_property_weekend), pf = num(row.price_from);
  let mode = pension ? (["integral", "camere", "hibrid"].includes(td.rentalMode) ? td.rentalMode : "integral") : "integral";
  let n = pension && Array.isArray(td.bedrooms) ? td.bedrooms.length : 0;
  if (hotel) { // prețul de bază = cea mai ieftină cameră; weekendul hotelului e în procent (plan.weekendPct)
    const prices = (Array.isArray(td.roomTypes) ? td.roomTypes : []).map((rt) => num(rt && rt.price)).filter(Boolean);
    pr = prices.length ? Math.min(...prices) : pr; pw = null; ppw = null; pf = pr || pf;
    mode = pp ? "hibrid" : "camere"; n = rooms ? rooms.length : 0;
  }
  const prooms = pension && mode !== "integral" ? pensionRooms(td) : null;
  const ref = pr || (prooms ? Math.min(...prooms.map((x) => x.price || Infinity)) : null);
  const pcustom = !!(prooms && Number.isFinite(ref) && ref > 0 && prooms.some((x) => x.price && x.price !== ref));
  const extra = hotel || prooms || plan.seasons.length || plan.weekendPct != null || plan.minNights != null
    ? [PP.planSignature(plan), rooms ? rooms.map((x) => [x.key, x.name, x.cap, x.price].concat(x.off ? [1] : [])) : (stock ? ["stock", stock.types.map((t) => [t.no, t.name, t.stock, t.price, t.cap])] : null), todayRo().slice(0, 4)].concat(prooms ? [prooms.map((x) => [x.key, x.name, x.cap, x.price])] : []) : undefined;
  return { td, hotel, big, stock, pension, mode, n, pr, pw, pp, ppw, pf, plan, rooms, prooms, ref: Number.isFinite(ref) ? ref : null, pcustom, sig: sigOf(mode, n, pr, pw, pp, ppw, pf, extra), extra };
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

  // ---------- camping: tipurile de loc din formular devin „tipuri” în rezervări (cu stoc) ----------
  async function isCamping(id) {
    try { const r = (await dbPool.query(`SELECT type, price_currency FROM accommodation_listings WHERE id = $1::integer`, [id])).rows[0]; return !!r && r.type === "camping" && (r.price_currency || "RON") === "RON"; }
    catch (e) { return false; }
  }
  async function campPull(id, opts) {
    const c = await caps();
    if (!c.units) return { skipped: true };
    const row = (await dbPool.query(`SELECT l.type_details, s.price_sync_sig FROM accommodation_listings l JOIN booking_settings s ON s.listing_id = l.id WHERE l.id = $1::integer`, [id])).rows[0];
    if (!row) return { skipped: true };
    const model = CAMP.campModel(row.type_details);
    const sig = crypto.createHash("sha1").update(JSON.stringify(["camp", model.types.map((t) => [t.no, t.name, t.stock, t.price, t.cap]), model.fees])).digest("hex").slice(0, 16);
    if (!(opts && opts.force) && row.price_sync_sig === sig) return { unchanged: true };
    const client = await dbPool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [id]);
      const have = (await client.query(`SELECT unit_no FROM booking_units WHERE listing_id = $1`, [id])).rows.map((x) => Number(x.unit_no));
      for (const ty of model.types) {
        const b = ty.price ? Math.round(ty.price * 100) : null;
        const cap = ty.cap || 4;
        if (have.includes(ty.no)) await client.query(`UPDATE booking_units SET name = $3, capacity = $4, base_price_bani = $5, active = TRUE, sort_order = $2, sync_key = $6 WHERE listing_id = $1 AND unit_no = $2`, [id, ty.no, ty.name, cap, b, "ck:" + ty.key]);
        else await client.query(`INSERT INTO booking_units (listing_id, unit_no, name, capacity, base_price_bani, sort_order, sync_key) VALUES ($1,$2,$3,$4,$5,$2,$6)`, [id, ty.no, ty.name, cap, b, "ck:" + ty.key]);
      }
      const keep = model.types.map((t) => t.no);
      await client.query(`UPDATE booking_units SET active = FALSE WHERE listing_id = $1 AND sync_key LIKE 'ck:%' AND NOT (unit_no = ANY($2::int[]))`, [id, keep]);
      const prices = model.bookable.map((t) => t.price);
      const base = prices.length ? Math.min(...prices) : (model.fees.adult || null);
      await client.query(`UPDATE booking_settings SET base_price_bani = $2, updated_at = now(), price_sync_sig = $3 WHERE listing_id = $1`, [id, base ? Math.round(base * 100) : null, sig]);
      await client.query("COMMIT");
    } catch (e) { await client.query("ROLLBACK").catch(() => {}); console.error("bookings-sync campPull:", e.message); return { error: true }; } finally { client.release(); }
    return { ok: true };
  }
  // pentru aplicație și cont: tipurile, prețurile și tarifele pe persoană, exact ca în formular
  async function getCamping(id) {
    const r = (await dbPool.query(`SELECT l.type, l.type_details, s.min_nights FROM accommodation_listings l LEFT JOIN booking_settings s ON s.listing_id = l.id WHERE l.id = $1::integer`, [id])).rows[0];
    if (!r || (r.type !== "camping" && r.type !== MARE)) return null;
    const m = CAMP.campModel(r.type_details);
    return { hotel: !!m.hotel, types: m.types.map((t) => ({ no: t.no, key: t.key, name: t.name, kind: t.kind, stock: t.stock, price: t.price, priceFull: t.priceFull, cap: t.cap })), fees: m.fees, min_nights: r.min_nights || 1 };
  }
  async function setCamping(id, o) {
    o = o || {};
    const r = (await dbPool.query(`SELECT type, type_details, price_currency FROM accommodation_listings WHERE id = $1::integer`, [id])).rows[0];
    if (!r || (r.type !== "camping" && r.type !== MARE)) return { error: "negasit" };
    if ((r.price_currency || "RON") !== "RON") return { error: "nu_se_aplica" };
    const td = CAMP.parseTd(r.type_details);
    // numere: gol/null = fără preț; altfel pozitiv
    const nv = (v) => { if (v == null || v === "") return null; const x = Number(v); return Number.isFinite(x) && x > 0 && x <= 1000000 ? Math.round(x * 100) / 100 : NaN; };
    const bad = [];
    const take = (v) => { const x = nv(v); if (Number.isNaN(x)) bad.push(1); return x; };
    if (r.type === MARE) { // hotel mare: prețul pe tip de cameră (cheia „rt<tid>”) se scrie în tipul de cameră din formular
      const rts = Array.isArray(td.roomTypes) ? td.roomTypes : [];
      Object.keys(o.units || {}).forEach((k) => { const mm = /^rt(\d+)$/.exec(k); const rt = mm ? rts.find((x) => x && x.tid === +mm[1]) : null; if (rt && o.units[k] && o.units[k].price !== undefined) rt.price = take(o.units[k].price); });
    } else {
      if (o.tents && td.tents && td.tents.on !== false && o.tents.price !== undefined) td.tents.price = take(o.tents.price);
      if (o.caravans && td.caravans && td.caravans.on !== false) {
        if (o.caravans.price !== undefined) td.caravans.price = take(o.caravans.price);
        if (o.caravans.priceFull !== undefined) td.caravans.priceFull = take(o.caravans.priceFull);
      }
      if (o.units && td.units && typeof td.units === "object") Object.keys(o.units).forEach((k) => { if (td.units[k] && td.units[k].has === true && o.units[k] && o.units[k].price !== undefined) td.units[k].price = take(o.units[k].price); });
      if (o.fees) { td.fees = td.fees && typeof td.fees === "object" ? td.fees : {}; ["adult", "child", "car", "electric", "pet"].forEach((k) => { if (o.fees[k] !== undefined) td.fees[k] = take(o.fees[k]); }); }
    }
    if (bad.length) return { error: "pret_invalid" };
    let minN = null;
    if (o.min_nights !== undefined) { minN = Number(o.min_nights); if (!Number.isInteger(minN) || minN < 1 || minN > 60) return { error: "date_invalide" }; }
    // „de la” pentru lista de anunțuri: același calcul ca în formular
    const m = CAMP.campModel(td);
    const prices = m.types.map((t) => t.price).filter((x) => x > 0);
    const pf = prices.length ? Math.min(...prices) : (m.fees.adult > 0 ? m.fees.adult : null);
    await dbPool.query(`UPDATE accommodation_listings SET type_details = $2, price_from = $3 WHERE id = $1::integer`, [id, JSON.stringify(td), pf]);
    if (minN !== null) await dbPool.query(`UPDATE booking_settings SET min_nights = $2, updated_at = now() WHERE listing_id = $1`, [id, minN]);
    if (r.type === MARE) await pull(id, { force: true }); else await campPull(id, { force: true });
    return { ok: true };
  }

  // ---------- copii și persoane în plus: politica din formular (type_details.kids) ----------
  async function getKids(id) {
    const r = (await dbPool.query(`SELECT type, type_details FROM accommodation_listings WHERE id = $1::integer`, [id])).rows[0];
    if (!r || !SYNC_TYPES.includes(r.type)) return null;
    const td = parseTd(r.type_details);
    return { type: r.type, hotel: r.type === HOTEL || r.type === MARE, kids: PARTY.sanitizeKids(td.kids) };
  }
  async function setKids(id, raw) {
    const r = (await dbPool.query(`SELECT type, type_details FROM accommodation_listings WHERE id = $1::integer`, [id])).rows[0];
    if (!r || !SYNC_TYPES.includes(r.type)) return { error: "negasit" };
    const want = raw && typeof raw === "object" ? raw : null;
    const clean = want ? PARTY.sanitizeKids(want) : null;
    const given = want && Array.isArray(want.bands) ? want.bands.length : 0;
    if (want && given > PARTY.MAX_BANDS) return { error: "date_invalide" };
    if (clean && clean.bands.length < given) return { error: "date_invalide" }; // intervale suprapuse sau greșite: nu le tăcem
    const td = parseTd(r.type_details);
    if ((r.type === HOTEL || r.type === MARE) && clean) clean.included = null; // la hotel „incluse” = adulții din tipul de cameră
    if (clean) td.kids = clean; else delete td.kids;
    await dbPool.query(`UPDATE accommodation_listings SET type_details = $2 WHERE id = $1::integer`, [id, JSON.stringify(td)]);
    return { ok: true, kids: clean };
  }

  // tipurile cu stoc (hotel mare) -> booking_units; cele șterse din formular se dezactivează (rezervările lor rămân în calendar)
  async function stockUnits(client, id, model) {
    const have = (await client.query(`SELECT unit_no FROM booking_units WHERE listing_id = $1`, [id])).rows.map((x) => Number(x.unit_no));
    for (const ty of model.types) {
      const b = ty.price ? Math.round(ty.price * 100) : null;
      const cap = ty.cap || 4;
      if (have.includes(ty.no)) await client.query(`UPDATE booking_units SET name = $3, capacity = $4, base_price_bani = $5, active = TRUE, sort_order = $2, sync_key = $6 WHERE listing_id = $1 AND unit_no = $2`, [id, ty.no, ty.name, cap, b, "ck:" + ty.key]);
      else await client.query(`INSERT INTO booking_units (listing_id, unit_no, name, capacity, base_price_bani, sort_order, sync_key) VALUES ($1,$2,$3,$4,$5,$2,$6)`, [id, ty.no, ty.name, cap, b, "ck:" + ty.key]);
    }
    await client.query(`UPDATE booking_units SET active = FALSE WHERE listing_id = $1 AND sync_key LIKE 'ck:%' AND NOT (unit_no = ANY($2::int[]))`, [id, model.types.map((t) => t.no)]);
  }

  // formular -> rezervări
  async function pull(id, opts) {
    try {
      const c = await caps();
      const row = await load(id, c);
      if (!row && await isCamping(id)) return await campPull(id, opts);
      if (!row) return { skipped: true };
      const L = readListing(row);
      if (!(opts && opts.force) && row.price_sync_sig === L.sig) return { unchanged: true };
      const first = !row.price_sync_sig;
      const base = L.hotel ? (L.pr || L.pf) : (L.mode === "integral" ? (L.pp || L.pf) : (L.pr || (L.prooms ? L.ref : null) || L.pf));
      L.pctRules = !!(L.pcustom && c.rules); // camere cu prețuri diferite: weekendul și perioadele speciale se aplică în procente din prețul camerei
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
        } else if (weekend && L.pctRules) {
          const wbps = Math.round((weekend / L.ref - 1) * 10000);
          if (wk) await client.query(`UPDATE booking_rate_rules SET price_bani = 0, pct_bps = $2 WHERE id = $1`, [wk.id, wbps]);
          else await client.query(`INSERT INTO booking_rate_rules (listing_id, name, kind, price_bani, pct_bps, priority) VALUES ($1,'Weekend','weekend',0,$2,0)`, [id, wbps]);
        } else if (weekend) {
          if (wk) {
            await client.query(`UPDATE booking_rate_rules SET price_bani = $2 WHERE id = $1`, [wk.id, Math.round(weekend * 100)]);
            if (L.prooms && c.rules) await client.query(`UPDATE booking_rate_rules SET pct_bps = NULL WHERE id = $1 AND pct_bps IS NOT NULL`, [wk.id]); // înainte avea prețuri diferite pe camere
          }
          else await client.query(`INSERT INTO booking_rate_rules (listing_id, name, kind, price_bani, priority) VALUES ($1,'Weekend','weekend',$2,0)`, [id, Math.round(weekend * 100)]);
        } else if (wk && !first) {
          await client.query(`UPDATE booking_rate_rules SET active = FALSE WHERE id = $1`, [wk.id]); // proprietarul a scos prețul de weekend din formular
        }
        // camere: doar dacă pensiunea se închiriază pe camere și nu există încă nicio cameră în rezervări
        const act = (await client.query(`SELECT COUNT(*)::int AS c, COALESCE(MAX(unit_no),0)::int AS m FROM booking_units WHERE listing_id = $1 AND active`, [id])).rows[0];
        if (!L.hotel && !(L.prooms && c.units) && L.mode !== "integral" && L.n >= 2 && act.c === 0) {
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
                await client.query(`UPDATE booking_units SET name = $3, capacity = $4, base_price_bani = $5, active = $6 WHERE listing_id = $1 AND unit_no = $2`, [id, byKey.get(rm.key), rm.name, rm.cap, bani, !rm.off]);
              } else if (next < 50) {
                next += 1; if (firstNew === null) firstNew = next;
                await client.query(`INSERT INTO booking_units (listing_id, unit_no, name, capacity, base_price_bani, sort_order, sync_key, active) VALUES ($1,$2,$3,$4,$5,$2,$6,$7)`, [id, next, rm.name, rm.cap, bani, rm.key, !rm.off]);
              }
            }
            if (act.c === 0 && firstNew !== null) { // rezervările / zilele blocate de dinainte (proprietate întreagă) trec pe prima cameră
              await client.query(`UPDATE booking_calendar_days SET unit_id = $2 WHERE listing_id = $1 AND unit_id = 0`, [id, firstNew]);
              await client.query(`UPDATE booking_ical_feeds SET unit_id = $2 WHERE listing_id = $1 AND unit_id = 0`, [id, firstNew]);
              await client.query(`UPDATE booking_reservations SET unit_ids = ARRAY[$2::smallint] WHERE listing_id = $1 AND unit_ids = ARRAY[0::smallint] AND status IN ('hold','confirmed')`, [id, firstNew]);
            }
          }
        }
        // hotel mare: fiecare tip de cameră devine un „tip” cu stoc în rezervări (cheie ck:rt<tid>)
        if (L.big && c.units) await stockUnits(client, id, L.stock);
        // pensiune cu camere cu nume / preț propriu: fiecare cameră din formular devine o cameră în rezervări
        if (L.prooms && c.units && !L.hotel) {
          const all = (await client.query(`SELECT unit_no, sync_key, active FROM booking_units WHERE listing_id = $1 ORDER BY sort_order, unit_no`, [id])).rows;
          const byKey = new Map(all.filter((u) => /^br\d+$/.test(u.sync_key || "")).map((u) => [u.sync_key, u.unit_no]));
          if (!byKey.size) { // camerele create înainte de acest model (fără cheie) se preiau în ordine
            const old = all.filter((u) => !u.sync_key && u.active);
            for (let i = 0; i < Math.min(old.length, L.prooms.length); i++) {
              await client.query(`UPDATE booking_units SET sync_key = $3 WHERE listing_id = $1 AND unit_no = $2`, [id, old[i].unit_no, L.prooms[i].key]);
              byKey.set(L.prooms[i].key, old[i].unit_no);
            }
          }
          let next = all.reduce((a, u) => Math.max(a, u.unit_no), 0), firstNew = null;
          const hadActive = all.some((u) => u.active);
          for (let i = 0; i < L.prooms.length; i++) {
            const rm = L.prooms[i], bani = rm.price ? Math.round(rm.price * 100) : null;
            if (byKey.has(rm.key)) {
              await client.query(`UPDATE booking_units SET name = COALESCE(NULLIF($3, ''), name), capacity = CASE WHEN $6::boolean THEN $4 ELSE capacity END, base_price_bani = $5, active = TRUE WHERE listing_id = $1 AND unit_no = $2`, [id, byKey.get(rm.key), rm.name, rm.cap, bani, rm.capSet]);
            } else if (next < 50) {
              next += 1; if (firstNew === null) firstNew = next;
              await client.query(`INSERT INTO booking_units (listing_id, unit_no, name, capacity, base_price_bani, sort_order, sync_key) VALUES ($1,$2,$3,$4,$5,$2,$6)`, [id, next, rm.name || "Camera " + (i + 1), rm.cap, bani, rm.key]);
            }
          }
          if (!hadActive && firstNew !== null) { // rezervările / zilele blocate de dinainte (proprietate întreagă) trec pe prima cameră
            await client.query(`UPDATE booking_calendar_days SET unit_id = $2 WHERE listing_id = $1 AND unit_id = 0`, [id, firstNew]);
            await client.query(`UPDATE booking_ical_feeds SET unit_id = $2 WHERE listing_id = $1 AND unit_id = 0`, [id, firstNew]);
            await client.query(`UPDATE booking_reservations SET unit_ids = ARRAY[$2::smallint] WHERE listing_id = $1 AND unit_ids = ARRAY[0::smallint] AND status IN ('hold','confirmed')`, [id, firstNew]);
          }
        }
        // reducerea „toată pensiunea” din prețul întreg al formularului (modul hibrid)
        if (L.mode === "hibrid" && L.pr && L.pp && L.n >= 2) {
          const sum = L.hotel && L.rooms ? L.rooms.reduce((a, x) => a + (x.price || L.pr), 0) : (L.prooms ? L.prooms.reduce((a, x) => a + (x.price || L.pr), 0) : L.pr * L.n);
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
      const bani = (L.hotel || L.pctRules) ? 0 : Math.round(d.s.price * 100);
      const bps = L.hotel ? Math.round(d.s.pct * 100) : (L.pctRules ? Math.round((d.s.price / L.ref - 1) * 10000) : null);
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
      let L = readListing(row);
      const base = row.base_price_bani / 100;
      const units = (await dbPool.query(`SELECT base_price_bani FROM booking_units WHERE listing_id = $1 AND active ORDER BY sort_order, unit_no`, [id])).rows;
      if (L.hotel) return await pushHotel(id, row, L, c);
      // pensiune cu camere cu preț propriu: prețul fiecărei camere se citește înapoi din camerele din rezervări (modificat în aplicație)
      let rowL = row;
      if (L.prooms && c.units) {
        const us = (await dbPool.query(`SELECT sync_key, base_price_bani FROM booking_units WHERE listing_id = $1 AND active AND sync_key LIKE 'br%'`, [id])).rows;
        const td0 = L.td && typeof L.td === "object" ? L.td : {};
        let changed = false;
        us.forEach((u) => {
          const m = /^br(\d+)$/.exec(u.sync_key || ""); const br = m && Array.isArray(td0.bedrooms) ? td0.bedrooms[+m[1]] : null;
          if (!br || u.base_price_bani == null) return;
          const np = u.base_price_bani / 100, cur = num(br.price), std = L.pr;
          if (cur == null && std != null && np === std) return;
          if (cur !== np) { br.price = np; changed = true; }
        });
        if (changed) {
          await dbPool.query(`UPDATE accommodation_listings SET type_details = $2 WHERE id = $1::integer`, [id, JSON.stringify(td0)]);
          rowL = Object.assign({}, row, { type_details: JSON.stringify(td0) });
          L = readListing(rowL);
        }
      }
      const wk = (await dbPool.query(L.prooms && c.rules
        ? `SELECT price_bani, pct_bps FROM booking_rate_rules WHERE listing_id = $1 AND active AND kind = 'weekend' AND unit_no IS NULL ORDER BY id LIMIT 1`
        : `SELECT price_bani FROM booking_rate_rules WHERE listing_id = $1 AND active AND kind = 'weekend' AND unit_no IS NULL ORDER BY id LIMIT 1`, [id])).rows[0];
      const weekend = wk ? (wk.pct_bps != null && L.ref ? r2(L.ref * (10000 + wk.pct_bps) / 10000) : wk.price_bani / 100) : null;
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
            if (k < 2) { pp = L.pp; ppw = L.ppw; } // fără camere în rezervări: prețul pentru toată pensiunea rămâne cel din formular
            else {
            const sum = k >= 2 ? units.reduce((a, u) => a + (u.base_price_bani != null ? u.base_price_bani / 100 : base), 0) : base * Math.max(L.n, 1);
            const cnt = k >= 2 ? k : Math.max(L.n, 1);
            pp = Math.round(sum * (1 - bps / 10000));
            ppw = weekend ? Math.round(weekend * cnt * (1 - bps / 10000)) : null;
            // prețul întreg din formular mai mare decât suma camerelor (fără reducere): nu îl rescriem cu suma
            if (bps === 0 && L.pp && L.pp > pp) { pp = L.pp; ppw = L.ppw; }
            }
          }
        }
        const pos = [pr, pp].concat(L.prooms ? L.prooms.map((x) => x.price) : []).filter((x) => x > 0);
        pf = pos.length ? Math.min(...pos) : base;
      }
      const td = L.td && typeof L.td === "object" ? L.td : {};
      const setTd = L.pension && mode !== L.mode;
      if (setTd) td.rentalMode = mode;
      // perioade create direct în rezervări (Cont › tarife) intră în plan, ca să apară în formular și pe pagină
      let plan = c.rules && c.plan ? await adoptRules(id, L.plan) : L.plan;
      plan = await adoptMinNights(id, plan, row, c);
      const extraNew = L.hotel || L.prooms || plan.seasons.length || plan.weekendPct != null || plan.minNights != null
        ? [PP.planSignature(plan), null, todayRo().slice(0, 4)].concat(L.prooms ? [L.prooms.map((x) => [x.key, x.name, x.cap, x.price])] : []) : undefined;
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
    if (!c.units || (!L.rooms && !L.big)) return { skipped: true };
    const us = (await dbPool.query(`SELECT sync_key, base_price_bani FROM booking_units WHERE listing_id = $1 AND active AND sync_key IS NOT NULL`, [id])).rows;
    if (!us.length) return { skipped: true };
    const td = L.td && typeof L.td === "object" ? L.td : {};
    const byType = new Map();
    us.forEach((u) => { const m = (L.big ? /^ck:rt(\d+)$/ : /^rt(\d+)-/).exec(u.sync_key || ""); if (m && u.base_price_bani != null) { const k = +m[1]; byType.set(k, Math.min(byType.has(k) ? byType.get(k) : Infinity, u.base_price_bani / 100)); } });
    let changed = false;
    (Array.isArray(td.roomTypes) ? td.roomTypes : []).forEach((rt, i) => { const k = L.big ? (rt && rt.tid) : i; if (rt && byType.has(k) && Number(rt.price) !== byType.get(k)) { rt.price = byType.get(k); changed = true; } });
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
    const rules = (await dbPool.query(`SELECT id, name, to_char(date_from,'YYYY-MM-DD') AS date_from, to_char(date_to,'YYYY-MM-DD') AS date_to, price_bani, min_nights, sync_key, pct_bps FROM booking_rate_rules WHERE listing_id = $1 AND active AND kind = 'interval' AND unit_no IS NULL`, [id])).rows;
    let changed = false;
    for (const r of rules) {
      if (r.pct_bps != null) continue; // regulile în procente vin din plan (camere cu prețuri diferite), nu se citesc înapoi
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
      const plan = PP.sanitizePlan(row.price_plan, { hotel: row.type === HOTEL || row.type === MARE });
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
    const hotel = row.type === HOTEL || row.type === MARE;
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
  // pensiune: prețurile și modul de închiriere, exact ca în formularul cazării (pentru aplicația Gazdă)
  async function getPension(id) {
    const c = await caps();
    const row = await load(id, c);
    if (!row) return null;
    const L = readListing(row);
    if (!L.pension) return null;
    return { mode: L.mode, n: L.n, pr: L.pr || null, pw: L.pw || null, pp: L.pp || null, ppw: L.ppw || null };
  }
  async function setPension(id, o) {
    const c = await caps();
    const row = await load(id, c);
    if (!row) return { error: "negasit" };
    const L = readListing(row);
    if (!L.pension) return { error: "nu_se_aplica" };
    o = o || {};
    const mode = o.mode;
    if (!["integral", "camere", "hibrid"].includes(mode)) return { error: "mod_invalid" };
    const nv = (v) => { if (v == null || v === "") return null; const x = Number(v); return Number.isFinite(x) && x > 0 && x <= 100000 ? Math.round(x * 100) / 100 : NaN; };
    const pr = nv(o.pr), pw = nv(o.pw), pp = nv(o.pp), ppw = nv(o.ppw);
    if ([pr, pw, pp, ppw].some((x) => Number.isNaN(x))) return { error: "pret_invalid" };
    if ((mode !== "integral" && pr == null) || (mode !== "camere" && pp == null)) return { error: "pret_lipsa" };
    const td = L.td && typeof L.td === "object" ? L.td : {};
    td.rentalMode = mode;
    const fr = mode === "integral" ? L.pr : pr, fw = mode === "integral" ? L.pw : pw, fp = mode === "camere" ? L.pp : pp, fpw = mode === "camere" ? L.ppw : ppw;
    const pos = (mode === "integral" ? [fp] : mode === "camere" ? [fr] : [fr, fp]).filter((x) => x > 0);
    const pf = pos.length ? Math.min(...pos) : L.pf;
    await dbPool.query(`UPDATE accommodation_listings SET price_per_room = $2, price_weekend = $3, price_per_property = $4, price_property_weekend = $5, price_from = $6, type_details = $7 WHERE id = $1::integer`, [id, fr || null, fw || null, fp || null, fpw || null, pf || null, JSON.stringify(td)]);
    await pull(id, { force: true });
    return { ok: true };
  }
  return { pull, push, getKids, setKids, getCamping, setCamping, isCamping, getPension, setPension, onListingSaved, ensure: (id) => pull(id), getPlan, savePlan, dropSeasonOfRule, setRoomPrice };
};
module.exports.readListing = readListing;
module.exports.hotelRooms = hotelRooms;
module.exports.SYNC_TYPES = SYNC_TYPES;

// Camping în rezervări: locuri pe TIP (cort, rulotă, căsuțe, bungalouri, glamping), cu stoc, nu camere individuale.
// Sursa adevărului este formularul campingului (type_details): tipurile, numărul de locuri, prețurile și tarifele pe persoană.
// În calendar, fiecare loc fizic este un „slot": unit_id = tip * 1000 + nr. slot (ex.: 3002 = al doilea bungalou). Astfel
// reținerea, confirmarea, plata, anularea și e-mailurile rămân exact cele de până acum (merg după rezervare), iar stocul
// se vede din numărul de sloturi libere dintr-o noapte.
"use strict";

const SLOT = 1000;
// tipurile fixe (numărul tipului = unit_no în booking_units, stabil în timp)
const TYPES = [
  { no: 1, key: "tents", name: "Loc de cort", kind: "tent" },
  { no: 2, key: "caravans", name: "Loc pentru rulotă / autorulotă", kind: "caravan" },
  { no: 3, key: "casute", name: "Căsuță din lemn", kind: "unit" },
  { no: 4, key: "bungalouri", name: "Bungalou / cabană", kind: "unit" },
  { no: 5, key: "glamping", name: "Cort glamping", kind: "unit" },
];
const MAX_STOCK = 999;

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : null; };
const r2 = (n) => Math.round(n * 100) / 100;
const bani = (x) => Math.round(x * 100);
function parseTd(v) { if (!v) return {}; if (typeof v === "object") return v; try { return JSON.parse(v) || {}; } catch (e) { return {}; } }
const slotId = (typeNo, slot) => typeNo * SLOT + slot;
const typeOfUnit = (unitId) => (unitId >= SLOT ? Math.floor(unitId / SLOT) : unitId);
const typeDef = (no) => TYPES.find((t) => t.no === no) || null;

// hotel mare: fiecare tip de cameră din formular (cu număr stabil `tid`, 1–32) este un tip cu stoc; prețul e pe cameră / noapte, fără taxe pe persoană
function hotelModel(td) {
  const rts = (Array.isArray(td.roomTypes) ? td.roomTypes : []).filter((rt) => rt && rt.name && Number.isInteger(rt.tid) && rt.tid >= 1 && rt.tid <= 32);
  const prices = rts.map((rt) => num(rt.price)).filter(Boolean);
  const cheapest = prices.length ? Math.min(...prices) : null;
  const types = rts.map((rt) => ({
    no: rt.tid, key: "rt" + rt.tid, name: String(rt.name).slice(0, 60), kind: "unit", stock: Math.min(MAX_STOCK, Math.max(1, parseInt(rt.count, 10) || 1)),
    price: num(rt.price) || cheapest, priceFull: null, cap: Math.min(50, Math.max(1, (parseInt(rt.adults, 10) || 0) + (parseInt(rt.children, 10) || 0))), electricPaid: false,
  }));
  return { types, fees: { adult: 0, child: 0, car: 0, electric: 0, pet: 0 }, bookable: types.filter((x) => x.stock >= 1 && x.price), hotel: true, unitWord: "camere" };
}
// tipurile rezervabile din formular + tarifele pe persoană (în RON, ca în formular)
function campModel(tdIn) {
  const td = parseTd(tdIn);
  if (Array.isArray(td.roomTypes) && !td.tents && !td.caravans && !td.units) return hotelModel(td);
  const t = td.tents && typeof td.tents === "object" ? td.tents : {};
  const c = td.caravans && typeof td.caravans === "object" ? td.caravans : {};
  const f = td.fees && typeof td.fees === "object" ? td.fees : {};
  const types = [];
  const tentsOn = t.on !== undefined ? t.on === true : ((parseInt(t.count, 10) || 0) > 0 || num(t.priceSmall) || num(t.priceLarge));
  if (tentsOn) {
    types.push({ no: 1, key: "tents", name: TYPES[0].name, kind: "tent", stock: Math.min(MAX_STOCK, parseInt(t.count, 10) || 0), price: num(t.price) || num(t.priceSmall) || num(t.priceLarge), priceFull: null, cap: null,
      electricPaid: t.power === "nu" });
  }
  const carOn = c.on !== undefined ? c.on === true : ((parseInt(c.count, 10) || 0) > 0 || num(c.price));
  if (carOn) {
    types.push({ no: 2, key: "caravans", name: TYPES[1].name, kind: "caravan", stock: Math.min(MAX_STOCK, parseInt(c.count, 10) || 0), price: num(c.price), priceFull: num(c.priceFull), cap: null,
      electricPaid: c.electric !== true });
  }
  const us = td.units && typeof td.units === "object" ? td.units : {};
  TYPES.filter((x) => x.kind === "unit").forEach((d) => {
    const u = us[d.key];
    if (!u || typeof u !== "object" || u.has !== true) return;
    types.push({ no: d.no, key: d.key, name: d.name, kind: "unit", stock: Math.min(MAX_STOCK, parseInt(u.count, 10) || 1), price: num(u.price), priceFull: null, cap: Math.min(50, Math.max(1, parseInt(u.capacity, 10) || 2)), electricPaid: false });
  });
  const fees = { adult: num(f.adult) || 0, child: num(f.child) || 0, car: num(f.car) || 0, electric: num(f.electric) || 0, pet: num(f.pet) || 0 };
  return { types, fees, bookable: types.filter((x) => x.stock >= 1 && x.price), hotel: false, unitWord: "locuri" };
}

// ---------- ofertă ----------
const ERR = ["date_invalide", "prea_multe_nopti"];
// params: { checkin, checkout, items:[{no,qty,full}], adults, children, cars, pets, electric }
function intIn(v, lo, hi) { const n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; }
function parseParams(src) {
  const items = [];
  const raw = Array.isArray(src.items) ? src.items : [];
  const seen = new Set();
  for (const it of raw.slice(0, 10)) {
    const no = intIn(it && it.no, 1, 32), qty = intIn(it && it.qty, 1, MAX_STOCK);
    if (no === null || qty === null || seen.has(no)) return null;
    seen.add(no); items.push({ no, qty, full: it.full === true });
  }
  const adults = intIn(src.adults, 1, 200), children = intIn(src.children == null || src.children === "" ? 0 : src.children, 0, 200);
  const cars = intIn(src.cars == null || src.cars === "" ? 0 : src.cars, 0, 200), pets = intIn(src.pets == null || src.pets === "" ? 0 : src.pets, 0, 200), electric = intIn(src.electric == null || src.electric === "" ? 0 : src.electric, 0, 999);
  if (!items.length || adults === null || children === null || cars === null || pets === null || electric === null) return null;
  return { checkin: src.checkin, checkout: src.checkout, items, adults, children, cars, pets, electric };
}
// core = bookings-core; rules = regulile de tarif active ale anunțului (opțional); lst = {min_nights, lead_days}
function quote(core, model, rules, lst, p) {
  const errors = [];
  if (!core.isDateStr(p.checkin) || !core.isDateStr(p.checkout)) return { ok: false, errors: ["date_invalide"] };
  const n = core.dayNum(p.checkout) - core.dayNum(p.checkin);
  if (n < 1) return { ok: false, errors: ["date_invalide"] };
  if (n > 60) return { ok: false, errors: ["prea_multe_nopti"] };
  const lines = [], units = [];
  let pitchTotal = 0, days = null, eligibleElectric = 0;
  for (const it of p.items) {
    const ty = model.bookable.find((x) => x.no === it.no);
    if (!ty) { errors.push("tip_indisponibil"); continue; }
    if (it.qty > ty.stock) { errors.push("indisponibil"); continue; }
    const useFull = it.full === true && ty.priceFull;
    const price = useFull ? ty.priceFull : ty.price;
    const q = core.computeQuote({ checkIn: p.checkin, checkOut: p.checkout, guests: null,
      settings: { base_price_bani: bani(price), min_nights: lst.min_nights || 1, max_guests: null },
      rules: (rules || []).filter((x) => x.unit_no == null || x.unit_no === ty.no), busyDays: new Set() });
    q.errors.forEach((e) => { if (!errors.includes(e)) errors.push(e); });
    if (!q.nights) continue;
    days = q.nights.map((x) => x.day);
    const per = q.nights.map((x) => x.price_bani || 0);
    const total = per.reduce((a, b) => a + b, 0) * it.qty;
    pitchTotal += total;
    if (ty.electricPaid && !useFull && ty.kind !== "unit") eligibleElectric += it.qty;
    lines.push({ no: ty.no, name: ty.name, kind: ty.kind, qty: it.qty, full: !!useFull, per_night_bani: per, total_bani: total, cap: ty.cap });
    units.push({ ty, it, nights: q.nights });
  }
  const persons = p.adults + p.children;
  if (units.length && units.every((u) => u.ty.kind === "unit")) {
    const cap = units.reduce((a, u) => a + u.ty.cap * u.it.qty, 0);
    if (persons > cap) errors.push("prea_multi_oaspeti");
  }
  if (core.isDateStr(p.checkin) && p.checkin < core.addDays(core.todayRo(), lst.lead_days || 0) && !errors.includes("data_trecuta")) errors.push("prea_aproape");
  if (p.electric > eligibleElectric && model.fees.electric > 0) errors.push("curent_prea_multe");
  const f = model.fees;
  const feeLines = [];
  const add = (label, count, fee) => { if (count > 0 && fee > 0) feeLines.push({ label, count, fee_bani: bani(fee), total_bani: bani(fee) * count * n }); };
  add("Adulți", p.adults, f.adult); add("Copii (3–12 ani)", p.children, f.child); add("Autoturisme", p.cars, f.car); add("Animale de companie", p.pets, f.pet);
  if (model.fees.electric > 0) add("Curent electric", Math.min(p.electric, eligibleElectric), f.electric);
  const feesTotal = feeLines.reduce((a, x) => a + x.total_bani, 0);
  const ok = errors.length === 0 && lines.length === p.items.length;
  return { ok, errors, nights: n, days: days || [], lines, feeLines, feesTotal, pitchTotal, totalBani: pitchTotal + feesTotal, persons, units };
}

// ---------- disponibilitate (stoc) ----------
// busyRows: [{unit_id, day}] pentru sloturile campingului; întoarce {tip: {zi: liberă}}
function freeByDay(model, busyRows, days) {
  const cnt = new Map();
  busyRows.forEach((x) => { const t = typeOfUnit(Number(x.unit_id)); const k = t + "|" + x.day; cnt.set(k, (cnt.get(k) || 0) + 1); });
  const out = {};
  model.types.forEach((ty) => { out[ty.no] = {}; days.forEach((d) => { out[ty.no][d] = Math.max(0, ty.stock - (cnt.get(ty.no + "|" + d) || 0)); }); });
  return out;
}
// alege sloturile pentru fiecare noapte; preferă aceleași sloturi de la o noapte la alta; null dacă stocul nu ajunge
function allocate(model, items, days, busyRows) {
  const busy = new Set(busyRows.map((x) => Number(x.unit_id) + "|" + x.day));
  const taken = new Set();
  const pairs = [];
  for (const it of items) {
    const ty = model.types.find((x) => x.no === it.no);
    if (!ty) return null;
    let prev = new Set();
    for (const d of days) {
      const free = [];
      for (let s = 1; s <= ty.stock; s++) { const id = slotId(ty.no, s); if (!busy.has(id + "|" + d) && !taken.has(id + "|" + d)) free.push(id); }
      if (free.length < it.qty) return null;
      free.sort((a, b) => (prev.has(b) ? 1 : 0) - (prev.has(a) ? 1 : 0) || a - b);
      const chosen = free.slice(0, it.qty);
      chosen.forEach((id) => { pairs.push([id, d]); taken.add(id + "|" + d); });
      prev = new Set(chosen);
    }
  }
  return pairs;
}
// instantaneu pentru snapshot-ul rezervării: o intrare pe slot, cu nopțile lui
function snapshotOf(model, qt, pairs, guests) {
  const bySlot = new Map();
  const priceOf = new Map(); // `${no}|${day}` -> preț pe noapte, pe loc
  qt.units.forEach((u) => u.nights.forEach((nn) => priceOf.set(u.ty.no + "|" + nn.day, nn.price_bani || 0)));
  pairs.forEach(([id, day]) => {
    if (!bySlot.has(id)) bySlot.set(id, []);
    bySlot.get(id).push({ day, price_bani: priceOf.get(typeOfUnit(id) + "|" + day) || 0 });
  });
  const unitsArr = [...bySlot.entries()].map(([id, nights]) => ({ unit_no: id, name: ((model.types.find((x) => x.no === typeOfUnit(id))) || typeDef(typeOfUnit(id)) || {}).name || "Loc", total_bani: nights.reduce((a, x) => a + x.price_bani, 0), nights }));
  return {
    camp: true, hotel: !!model.hotel, discount_bani: 0, whole: false, units: unitsArr,
    camp_items: qt.lines.map((l) => ({ no: l.no, name: l.name, qty: l.qty, full: l.full, total_bani: l.total_bani })),
    fees: { total_bani: qt.feesTotal, lines: qt.feeLines }, guests,
  };
}

// ---------- calendar pentru proprietar (pe tip) ----------
const RANGE_Q = `SELECT unit_id, to_char(day,'YYYY-MM-DD') AS day, status FROM booking_calendar_days
  WHERE listing_id = $1 AND unit_id >= $4::int AND unit_id < $5::int AND day >= $2::date AND day < $3::date AND (status <> 3 OR blocked_until > now())`;
async function typeRows(db, listingId, typeNo, from, to) {
  return (await db.query(RANGE_Q, [listingId, from, to, typeNo * SLOT, (typeNo + 1) * SLOT])).rows.map((x) => ({ unit_id: Number(x.unit_id), day: x.day, status: Number(x.status) }));
}
// zilele unui tip: status 0 liber (nu apare), 1..4 plin (după cel mai important motiv), 5 parțial
async function calendarOf(db, listingId, ty, from, to) {
  const rows = await typeRows(db, listingId, ty.no, from, to);
  const per = new Map();
  rows.forEach((x) => { if (!per.has(x.day)) per.set(x.day, { 1: 0, 2: 0, 3: 0, 4: 0 }); per.get(x.day)[x.status] += 1; });
  const days = [...per.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([day, c]) => {
    const used = c[1] + c[2] + c[3] + c[4], free = Math.max(0, ty.stock - used);
    let status = 5;
    if (free === 0) status = c[4] > 0 ? 4 : c[3] > 0 ? 3 : c[2] > 0 ? 2 : 1;
    return { day, status, free, booked: c[4], closed: c[1], stock: ty.stock };
  });
  return days;
}
// închide / deschide locuri (qty = câte; gol = toate). Nu atinge rezervările, blocările în curs sau platformele.
async function setClosed(db, listingId, ty, days, action, qty) {
  let changed = 0;
  for (const day of days) {
    const rows = (await db.query(`SELECT unit_id, status FROM booking_calendar_days WHERE listing_id = $1 AND unit_id >= $2::int AND unit_id < $3::int AND day = $4::date AND (status <> 3 OR blocked_until > now())`, [listingId, ty.no * SLOT, (ty.no + 1) * SLOT, day])).rows;
    const busy = new Set(rows.map((x) => Number(x.unit_id)));
    if (action === "close") {
      const free = []; for (let s = 1; s <= ty.stock; s++) { const id = slotId(ty.no, s); if (!busy.has(id)) free.push(id); }
      const pick = qty ? free.slice(0, qty) : free;
      if (!pick.length) continue;
      await db.query(`DELETE FROM booking_calendar_days WHERE listing_id = $1 AND day = $2::date AND status = 3 AND blocked_until < now() AND unit_id = ANY($3::int[])`, [listingId, day, pick]);
      const q = await db.query(`INSERT INTO booking_calendar_days (listing_id, unit_id, day, status) SELECT $1, u, $2::date, 1 FROM unnest($3::int[]) u ON CONFLICT (listing_id, unit_id, day) DO NOTHING`, [listingId, day, pick]);
      changed += q.rowCount;
    } else {
      const closed = rows.filter((x) => Number(x.status) === 1).map((x) => Number(x.unit_id)).sort((a, b) => b - a);
      const pick = qty ? closed.slice(0, qty) : closed;
      if (!pick.length) continue;
      const q = await db.query(`DELETE FROM booking_calendar_days WHERE listing_id = $1 AND day = $2::date AND status = 1 AND unit_id = ANY($3::int[])`, [listingId, day, pick]);
      changed += q.rowCount;
    }
  }
  return changed;
}
// locuri libere în seara asta și mâine, pe tip (pentru ecranul „Azi")
async function tonight(db, listingId, model, todaySql) {
  const rows = (await db.query(`SELECT unit_id, (day = ${todaySql}) AS is_today FROM booking_calendar_days WHERE listing_id = $1 AND unit_id >= $2::int AND unit_id < $3::int AND day >= ${todaySql} AND day <= ${todaySql} + 1 AND (status <> 3 OR blocked_until > now())`, [listingId, SLOT, 33 * SLOT])).rows;
  return model.types.map((ty) => {
    const mine = rows.filter((x) => typeOfUnit(Number(x.unit_id)) === ty.no);
    const t0 = mine.filter((x) => x.is_today).length, t1 = mine.filter((x) => !x.is_today).length;
    return { unit_no: ty.no, name: ty.name, camp: true, word: model.unitWord, stock: ty.stock, free_tonight: Math.max(0, ty.stock - t0), free_tomorrow: Math.max(0, ty.stock - t1) };
  });
}
// nume lizibil pentru o listă de unit_ids dintr-o rezervare de camping: „2 × Loc de cort”
function labelUnits(unitIds, nameOf) {
  const cnt = new Map();
  (unitIds || []).forEach((id) => { const t = typeOfUnit(Number(id)); cnt.set(t, (cnt.get(t) || 0) + 1); });
  return [...cnt.entries()].map(([t, n]) => (n > 1 ? n + " × " : "") + (nameOf(t) || "Loc")).join(", ");
}

module.exports = { SLOT, TYPES, MAX_STOCK, campModel, parseParams, quote, freeByDay, allocate, snapshotOf, typeRows, calendarOf, setClosed, tonight, labelUnits, slotId, typeOfUnit, typeDef, parseTd, num, r2, bani };

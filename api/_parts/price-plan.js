// Planul de prețuri al unei cazări: perioade speciale (sărbători, sezoane, zile alese de proprietar) și oferte.
// Funcții pure, fără bază de date și fără Express: folosite de formular (server), pagina pensiunii, sincronizarea
// cu rezervările și aplicația Gazdă. Se stochează în accommodation_listings.price_plan (TEXT cu JSON).
//
//   { v:1,
//     seasons:[{ id, name, from:"YYYY-MM-DD", to:"YYYY-MM-DD", price:450|null, pct:30|null, minNights:2|null, yearly:true|false }],
//     offers:[{ id, text, until:"YYYY-MM-DD"|null, closed:false }],
//     weekendPct: null|15,           // doar hoteluri: weekendul (vineri, sâmbătă) = prețul camerei + X%
//     minNights: null|2 }            // nopți minime pe rezervare (în rezervări: booking_settings.min_nights)
//
// Pensiuni / cabane / apartamente: perioada are `price` (RON / noapte / cameră).
// Hoteluri: perioada are `pct` (procent peste prețul fiecărui tip de cameră), fiindcă tipurile de cameră au prețuri diferite.
"use strict";

const MAX_SEASONS = 30;
const MAX_OFFERS = 20;
const OFFER_TEXT_MAX = 200;
const SPECIAL_OFFERS_COLUMN_MAX = 500; // limita veche a coloanei special_offers

function isDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}
const dayNum = (s) => Math.round(Date.parse(s + "T00:00:00Z") / 86400000);
const numToDay = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
const addDays = (s, n) => numToDay(dayNum(s) + n);

// aceeași zi și lună, cu k ani mai târziu (29 feb → 28 feb în anii nebisecți)
function addYears(s, k) {
  const y = parseInt(s.slice(0, 4), 10) + k, m = s.slice(5, 7), d = s.slice(8, 10);
  const cand = `${String(y).padStart(4, "0")}-${m}-${d}`;
  if (isDate(cand)) return cand;
  return `${String(y).padStart(4, "0")}-${m}-28`;
}

function cleanText(v, max) {
  return typeof v === "string" ? v.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max) : "";
}
function cleanId(v, fallback) {
  const s = typeof v === "string" ? v.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20) : "";
  return s || fallback;
}
function numIn(v, lo, hi, dec) {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n < lo || n > hi) return null;
  const f = Math.pow(10, dec || 0);
  return Math.round(n * f) / f;
}

function emptyPlan() { return { v: 1, seasons: [], offers: [], weekendPct: null, minNights: null }; }

function parsePlan(v) {
  if (!v) return emptyPlan();
  if (typeof v === "string") { try { v = JSON.parse(v); } catch (e) { return emptyPlan(); } }
  return v && typeof v === "object" ? v : emptyPlan();
}

// Curăță orice vine din formular / aplicație / baza de date. `hotel` = true ⇒ perioadele sunt în procente.
function sanitizePlan(raw, opts) {
  const hotel = !!(opts && opts.hotel);
  const src = parsePlan(raw);
  const usedIds = new Set();
  const uid = (v, prefix, i) => {
    let id = cleanId(v, prefix + (i + 1));
    while (usedIds.has(id)) id += "x";
    usedIds.add(id);
    return id.slice(0, 20);
  };
  const seasons = [];
  (Array.isArray(src.seasons) ? src.seasons : []).forEach((s, i) => {
    if (!s || typeof s !== "object" || seasons.length >= MAX_SEASONS) return;
    const name = cleanText(s.name, 80);
    if (!name || !isDate(s.from) || !isDate(s.to) || s.to < s.from || dayNum(s.to) - dayNum(s.from) > 400) return;
    const price = hotel ? null : numIn(s.price, 0.01, 1000000, 2);
    const pct = hotel ? numIn(s.pct, -90, 500, 1) : null;
    if (hotel ? pct === null : price === null) return;
    seasons.push({
      id: uid(s.id, "s", i), name, from: s.from, to: s.to, price, pct,
      minNights: numIn(s.minNights, 1, 60, 0), yearly: s.yearly === true,
    });
  });
  const offers = [];
  (Array.isArray(src.offers) ? src.offers : []).forEach((o, i) => {
    if (!o || typeof o !== "object" || offers.length >= MAX_OFFERS) return;
    const text = cleanText(o.text, OFFER_TEXT_MAX);
    if (!text) return;
    offers.push({ id: uid(o.id, "o", i), text, until: isDate(o.until) ? o.until : null, closed: o.closed === true });
  });
  return { v: 1, seasons, offers, weekendPct: hotel ? numIn(src.weekendPct, 0, 300, 1) : null, minNights: numIn(src.minNights, 1, 60, 0) };
}

// planul unei cazări din rândul din baza de date; fără plan salvat, ofertele vin din vechiul text special_offers
function planOf(row, hotel) {
  const has = !!(row && row.price_plan);
  const plan = sanitizePlan(has ? row.price_plan : null, { hotel: !!hotel });
  if (!has && row && row.special_offers) plan.offers = offersFromText(row.special_offers);
  return plan;
}

// ofertele vizibile turistului: nu sunt închise și nu au expirat
function activeOffers(plan, today) {
  return (plan && Array.isArray(plan.offers) ? plan.offers : []).filter((o) => !o.closed && (!o.until || o.until >= today));
}
// o ofertă expirată se arată în formular / aplicație ca „Expirată”
function offerState(o, today) {
  if (o.closed) return "closed";
  if (o.until && o.until < today) return "expired";
  return "active";
}
// textul vechi al coloanei special_offers (o ofertă pe linie), ca restul site-ului să rămână neschimbat
function offersText(plan, today) {
  const out = [];
  let len = 0;
  for (const o of activeOffers(plan, today)) {
    const add = o.text.length + (out.length ? 1 : 0);
    if (len + add > SPECIAL_OFFERS_COLUMN_MAX) break;
    out.push(o.text); len += add;
  }
  return out.join("\n");
}
// ofertele vechi (text pe linii) devin oferte fără dată
function offersFromText(text) {
  return String(text || "").split("\n").map((l) => cleanText(l, OFFER_TEXT_MAX)).filter(Boolean).slice(0, MAX_OFFERS)
    .map((t, i) => ({ id: "o" + (i + 1), text: t, until: null, closed: false }));
}

// aparițiile unei perioade în orizontul dat (o perioadă anuală se repetă)
function occurrences(season, today, horizonDays) {
  const horizon = addDays(today, horizonDays || 730);
  const out = [];
  const ks = season.yearly ? [-1, 0, 1, 2, 3] : [0];
  ks.forEach((k) => {
    const from = k ? addYears(season.from, k) : season.from;
    let to = k ? addYears(season.to, k) : season.to;
    if (to < from) to = from;
    if (to >= today && from <= horizon) out.push({ from, to, year: parseInt(from.slice(0, 4), 10) });
  });
  return out.sort((a, b) => (a.from < b.from ? -1 : 1));
}
function nextOccurrence(season, today) {
  const o = occurrences(season, today, 800);
  return o.length ? o[0] : null;
}
// perioadele care mai au zile de acum încolo, cu datele aparițiilor viitoare
function upcomingSeasons(plan, today) {
  const out = [];
  (plan && Array.isArray(plan.seasons) ? plan.seasons : []).forEach((s) => {
    const occ = nextOccurrence(s, today);
    if (occ) out.push(Object.assign({}, s, { from: occ.from, to: occ.to, base: { from: s.from, to: s.to } }));
  });
  return out.sort((a, b) => (a.from < b.from ? -1 : 1));
}

const dow = (day) => new Date(day + "T00:00:00Z").getUTCDay();
const isWeekendNight = (day) => { const d = dow(day); return d === 5 || d === 6; };

// Prețul unei nopți pentru calendarul de pe pagina pensiunii.
//   ctx: { weekday, weekend (absolute, pot fi null), weekendPct, seasons (aparițiile viitoare, cu from/to), hotel }
//   perioada specială bate weekendul, weekendul bate prețul de bază (la fel ca în motorul de rezervări)
function nightPrice(day, ctx) {
  const base = ctx.weekday;
  if (base == null) return { price: null, kind: "none" };
  let best = null;
  (ctx.seasons || []).forEach((s) => { if (day >= s.from && day <= s.to) best = s; });
  if (best) {
    if (ctx.hotel) return { price: Math.round(base * (100 + (best.pct || 0))) / 100, kind: "season" };
    return { price: best.price, kind: "season" };
  }
  if (isWeekendNight(day)) {
    if (ctx.hotel && ctx.weekendPct != null) return { price: Math.round(base * (100 + ctx.weekendPct)) / 100, kind: "weekend" };
    if (!ctx.hotel && ctx.weekend != null) return { price: ctx.weekend, kind: "weekend" };
  }
  return { price: base, kind: "base" };
}

// perioade pregătite de calendar (aparițiile viitoare, fără câmpuri inutile)
function calendarSeasons(plan, today, horizonDays) {
  const out = [];
  (plan && Array.isArray(plan.seasons) ? plan.seasons : []).forEach((s) => {
    occurrences(s, today, horizonDays || 400).forEach((o) => out.push({ from: o.from, to: o.to, price: s.price, pct: s.pct, name: s.name }));
  });
  return out;
}

// semnătură stabilă a planului (pentru sincronizare)
function planSignature(plan) {
  const p = plan || emptyPlan();
  return JSON.stringify([
    (p.seasons || []).map((s) => [s.id, s.name, s.from, s.to, s.price, s.pct, s.minNights, s.yearly ? 1 : 0]),
    p.weekendPct, p.minNights,
  ]);
}

// ---------- re-aprobare: se cere doar dacă s-a schimbat altceva decât prețurile / ofertele ----------
const PRICE_COLUMNS = ["price_from", "price_per_room", "price_per_property", "price_weekend", "price_property_weekend", "special_offers", "actualizat_la"];
const PRICE_KEY_RE = /price|fees?$|rentalMode/i;
function norm(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return null;
    if (/^[\[{]/.test(t)) { try { return norm(JSON.parse(t)); } catch (e) { return t; } }
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
    return t;
  }
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return v.map(norm);
  if (typeof v === "object") {
    const o = {};
    Object.keys(v).sort().forEach((k) => { if (!PRICE_KEY_RE.test(k)) o[k] = norm(v[k]); });
    return o;
  }
  return v;
}
// true dacă `fields` (coloanele noi) diferă de `oldRow` în altceva decât prețuri; la orice îndoială întoarce true (rămâne re-aprobarea)
function changedBeyondPrices(oldRow, fields) {
  if (!oldRow || !fields) return true;
  for (const k of Object.keys(fields)) {
    if (PRICE_COLUMNS.indexOf(k) !== -1) continue;
    if (JSON.stringify(norm(oldRow[k])) !== JSON.stringify(norm(fields[k]))) return true;
  }
  return false;
}

module.exports = {
  MAX_SEASONS, MAX_OFFERS, OFFER_TEXT_MAX,
  isDate, addDays, addYears, dayNum,
  emptyPlan, parsePlan, sanitizePlan, planOf,
  activeOffers, offerState, offersText, offersFromText,
  occurrences, nextOccurrence, upcomingSeasons, nightPrice, calendarSeasons, planSignature, changedBeyondPrices,
};

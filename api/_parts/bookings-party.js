// Familia (adulți + copii cu vârste): politica pentru copii a cazării și suplimentele de preț, ca la Booking.
//
// Politica trăiește în formularul cazării: type_details.kids = {
//   v: 1,
//   included:   câte persoane include prețul camerei (pensiune/apartament; la hotel se ia din „adulți” al tipului de cameră),
//   adultExtra: preț / noapte pentru un adult în plus (RON),
//   bands: până la 3 intervale de vârstă [{ from, to, mode: "free"|"pct"|"fixed", value, nobed }]
//          free = gratuit; pct = % din prețul adultului în plus; fixed = sumă fixă / noapte (RON);
//          nobed = pătuț / fără pat propriu: nu ocupă loc din capacitate
// }
// Vârstele neacoperite de niciun interval (de ex. 13+) se socotesc adulți. Fără politică: nimic nu se schimbă
// (prețul camerei este același, copiii contează doar la capacitate).
//
// Regula de calcul: prețul camerei(lor) acoperă „included” persoane (se ocupă întâi locurile celor mai scumpi: adulții,
// apoi copiii după preț); restul plătesc suplimentul lor pe noapte. Suma suplimentelor × nopți se adaugă la total.
//
// Funcțiile classify/supp sunt PURE și fără dependențe: aceeași sursă rulează în server și în pagina turistului.
"use strict";

const MAX_BANDS = 3;
const MAX_AGE = 17;

function sanitizeKids(raw) {
  if (!raw || typeof raw !== "object") return null;
  const int = (v, lo, hi) => { const n = Number(v); return v !== "" && v != null && Number.isInteger(n) && n >= lo && n <= hi ? n : null; };
  const money = (v, hi) => { if (v === "" || v == null) return null; const n = Number(v); return Number.isFinite(n) && n >= 0 && n <= hi ? Math.round(n * 100) / 100 : null; };
  const included = int(raw.included, 1, 50);
  const adultExtra = money(raw.adultExtra, 100000);
  let bands = [];
  (Array.isArray(raw.bands) ? raw.bands : []).slice(0, MAX_BANDS).forEach((b) => {
    if (!b || typeof b !== "object") return;
    const from = int(b.from, 0, MAX_AGE), to = int(b.to, 0, MAX_AGE);
    if (from === null || to === null || to < from) return;
    let mode = ["free", "pct", "fixed"].includes(b.mode) ? b.mode : "free", value = 0;
    if (mode === "pct") { value = int(b.value, 1, 100); if (value === null) mode = "free"; else if (value === 100) value = 100; }
    if (mode === "fixed") { value = money(b.value, 100000); if (!value) { mode = "free"; value = 0; } }
    if (mode === "free") value = 0;
    bands.push({ from, to, mode, value, nobed: b.nobed === true && (mode === "free" || mode === "fixed") });
  });
  bands.sort((a, b) => a.from - b.from);
  const clean = [];
  bands.forEach((b) => { if (!clean.length || b.from > clean[clean.length - 1].to) clean.push(b); }); // fără suprapuneri
  if (included === null && adultExtra === null && !clean.length) return null;
  return { v: 1, included, adultExtra, bands: clean };
}

// ---------- partea comună serverului și paginii (fără închideri peste variabile din modul) ----------
function parseAges(v) { // "4,11" sau [4,11] -> [4, 11]; null dacă ceva e invalid
  const a = Array.isArray(v) ? v : (v == null || v === "" ? [] : String(v).split(","));
  if (a.length > 20) return null;
  const out = [];
  for (let i = 0; i < a.length; i++) { const s = String(a[i]).trim(); if (!/^\d{1,2}$/.test(s)) return null; const n = Number(s); if (n > 17) return null; out.push(n); }
  return out;
}

function classify(kids, age) {
  const bs = (kids && kids.bands) || [];
  for (let i = 0; i < bs.length; i++) if (age >= bs[i].from && age <= bs[i].to) return bs[i];
  return null;
}

// ctx: { included: câte persoane include prețul alegerii, max: capacitatea totală, perPerson: bani / noapte pe persoană inclusă (pentru adult în plus fără preț setat) }
// întoarce { ok, errors, perNightBani, bedPersons, lines:[{ label, count, perNightBani }] }
function supp(kids, ctx, adults, ages) {
  const errors = [];
  if (!(adults >= 1)) errors.push("date_invalide");
  const persons = [];
  for (let i = 0; i < adults; i++) persons.push({ kind: "adult", nobed: false });
  const noPolicy = !kids;
  const adultPrice = noPolicy ? 0 : (kids.adultExtra != null ? Math.round(kids.adultExtra * 100) : Math.max(0, Math.round(ctx.perPerson || 0)));
  const costOf = (b) => (b.mode === "free" ? 0 : b.mode === "pct" ? Math.round(adultPrice * b.value / 100) : Math.round(b.value * 100));
  const labelOf = (b, age) => (b.mode === "free" ? "Copil " + age + " ani (gratuit)" : b.mode === "pct" ? "Copil " + age + " ani (" + b.value + "% din adult)" : "Copil " + age + " ani");
  ages.forEach((age) => {
    const b = noPolicy ? null : classify(kids, age);
    if (!b) persons.push({ kind: noPolicy ? "child0" : "adult2", age, nobed: false });
    else persons.push({ kind: "child", age, nobed: b.nobed === true, cost: costOf(b), label: labelOf(b, age) });
  });
  const bedPersons = persons.filter((p) => !p.nobed).length;
  if (ctx.max != null && bedPersons > ctx.max) errors.push("prea_multi_oaspeti");
  if (errors.length || noPolicy) return { ok: errors.length === 0, errors, perNightBani: 0, bedPersons, lines: [] };
  persons.forEach((p) => { if (p.kind === "adult" || p.kind === "adult2") { p.cost = adultPrice; p.label = p.kind === "adult" ? "Adult în plus" : "Copil " + p.age + " ani (preț de adult)"; } });
  const inc = ctx.included != null ? ctx.included : bedPersons;
  const grp = (p) => (p.kind === "child" ? 1 : 0); // locurile incluse: întâi adulții (și copiii la preț de adult), apoi copiii cei mai scumpi
  const order = persons.filter((p) => !p.nobed).sort((a, b) => grp(a) - grp(b) || b.cost - a.cost);
  const paying = order.slice(Math.max(0, inc)).concat(persons.filter((p) => p.nobed));
  const map = new Map();
  let total = 0;
  paying.forEach((p) => {
    if (p.cost <= 0 && p.kind !== "child") return;
    total += p.cost;
    const k = p.label + "|" + p.cost;
    if (!map.has(k)) map.set(k, { label: p.label, count: 0, perNightBani: p.cost });
    map.get(k).count += 1;
  });
  const lines = [...map.values()].filter((x) => x.perNightBani > 0);
  return { ok: true, errors: [], perNightBani: total, bedPersons, lines };
}

// ---------- din modelul cazării: câte persoane include fiecare cameră ----------
// unit: rând din booking_units ({ unit_no, capacity, sync_key }) sau null (proprietatea întreagă)
function includedOf(td, kids, unit, fallbackMax) {
  const hotelRt = unit && /^rt(\d+)-\d+$/.exec(String(unit.sync_key || ""));
  if (hotelRt) {
    const rts = td && Array.isArray(td.roomTypes) ? td.roomTypes : [];
    const rt = rts[Number(hotelRt[1])];
    const a = rt ? parseInt(rt.adults, 10) : NaN;
    if (Number.isInteger(a) && a >= 1) return Math.min(a, unit.capacity || a);
  }
  if (kids && kids.included) return unit ? Math.min(kids.included, unit.capacity || kids.included) : kids.included;
  return unit ? (unit.capacity || null) : (fallbackMax || null);
}

// textul familiei pentru e-mailuri și carduri: „2 adulți, 2 copii (4 și 11 ani)”
function partyText(adults, ages) {
  const a = adults + (adults === 1 ? " adult" : " adulți");
  if (!ages || !ages.length) return a;
  const c = ages.length + (ages.length === 1 ? " copil" : " copii");
  const ys = ages.length === 1 ? ages[0] + (ages[0] === 1 ? " an" : " ani") : ages.slice(0, -1).join(", ") + " și " + ages[ages.length - 1] + " ani";
  return a + ", " + c + " (" + ys + ")";
}

// codul trimis în pagina turistului (aceeași logică; fără require)
const CLIENT_JS = [classify, supp].map((f) => f.toString()).join("\n");

module.exports = { MAX_BANDS, MAX_AGE, sanitizeKids, parseAges, classify, supp, includedOf, partyText, CLIENT_JS };

// Politici de anulare (doar pentru rezervările plătite online): flexibilă, moderată, strictă.
// Funcții PURE (fără bază de date, fără Express): aceleași reguli rulează la rezervare (avans, reducere), la anulare (rambursare / penalitate)
// și în textele afișate turistului. Politica se copiază pe rezervare în momentul plății, deci schimbările ulterioare ale gazdei nu o ating.
//
//   flexibila: anulare gratuită cu mai mult de 48 de ore înainte de check-in; după aceea se reține prima noapte (maxim cât s-a plătit)
//   moderata:  anulare gratuită cu mai mult de 7 zile înainte de check-in; după aceea se reține 50% din total (maxim cât s-a plătit)
//   stricta:   nerambursabilă (plată integrală la rezervare, cu 10% reducere)
//
// Avansul se calculează astfel încât să acopere mereu penalitatea: flexibila = max(30%, prima noapte), moderata = 50%, stricta = 100%.
"use strict";

const KEYS = ["flexible", "moderate", "strict"];
const DEFAULT_POLICY = "flexible";
const STRICT_DISCOUNT_BPS = 1000; // 10% reducere la politica strictă
const DEFAULT_CHECKIN = "14:00";
const FLEX_HOURS = 48;
const MODERATE_HOURS = 7 * 24;
const MODERATE_PENALTY_BPS = 5000; // 50%

const LABELS = { flexible: "Flexibilă", moderate: "Moderată", strict: "Strictă (nerambursabilă)" };

const normalize = (k) => (KEYS.includes(k) ? k : DEFAULT_POLICY);
const isStrict = (k) => normalize(k) === "strict";
const discountBps = (k) => (isStrict(k) ? STRICT_DISCOUNT_BPS : 0);

// ---------- ora de check-in (ora României) ----------
// „14:00” sau „14:30”; orice altceva → 14:00
function checkinTime(v) {
  const m = /(\d{1,2})[:.](\d{2})/.exec(String(v == null ? "" : v));
  if (!m) return DEFAULT_CHECKIN;
  const h = Number(m[1]), mi = Number(m[2]);
  if (h > 23 || mi > 59) return DEFAULT_CHECKIN;
  return String(h).padStart(2, "0") + ":" + String(mi).padStart(2, "0");
}
// momentul exact (Date UTC) al check-in-ului: data + ora locală din București
function checkinInstant(dateStr, timeStr) {
  const [y, mo, d] = String(dateStr).slice(0, 10).split("-").map(Number);
  const [h, mi] = checkinTime(timeStr).split(":").map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, 0);
  // decalajul Bucureștiului în acel moment (2 sau 3 ore), aflat prin Intl; verificat în două încercări pentru zilele cu schimbarea orei
  const offsetAt = (ms) => {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(ms));
    const g = (t) => Number(parts.find((p) => p.type === t).value);
    return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute")) - ms;
  };
  let guess = asUtc - offsetAt(asUtc);
  guess = asUtc - offsetAt(guess);
  return new Date(guess);
}

// ---------- prima noapte ----------
// snapshot: nights_snapshot-ul rezervării (camere / locuri cu nopțile lor, suplimentul familiei, taxele campingului);
// total: totalul real de plată (cu reduceri), ca prima noapte să țină cont de ele proporțional
function firstNightOf(snapshot, total) {
  const s = snapshot && typeof snapshot === "object" ? snapshot : {};
  const units = Array.isArray(s.units) ? s.units : [];
  let firstDay = null;
  units.forEach((u) => (u.nights || []).forEach((n) => { if (n && n.day && (firstDay === null || n.day < firstDay)) firstDay = n.day; }));
  let raw = 0, rawAll = 0;
  units.forEach((u) => (u.nights || []).forEach((n) => { const p = Number(n.price_bani) || 0; rawAll += p; if (n.day === firstDay) raw += p; }));
  const nightsN = firstDay === null ? 0 : new Set(units.flatMap((u) => (u.nights || []).map((n) => n.day))).size;
  const party = s.party && typeof s.party === "object" ? s.party : null;
  if (party) { const sn = Number(party.supp_night_bani) || 0; raw += sn; rawAll += sn * nightsN; }
  const fees = s.fees && Array.isArray(s.fees.lines) ? s.fees.lines : [];
  fees.forEach((f) => { const perNight = (Number(f.fee_bani) || 0) * (Number(f.count) || 0); raw += perNight; rawAll += perNight * nightsN; });
  if (!(rawAll > 0) || !(raw > 0)) return Math.max(0, Math.min(total, Math.round(total / Math.max(1, nightsN || 1))));
  return Math.max(0, Math.min(total, Math.round(raw * total / rawAll)));
}

// ---------- avansul și schema de plată ----------
// Aceeași schemă ca înainte (avans doar dacă check-in-ul e peste 30 de zile; restul se debitează cu 30 de zile înainte),
// dar avansul acoperă penalitatea politicii; la politica strictă se plătește totul la rezervare.
function advanceBani(policy, total, firstNight) {
  const p = normalize(policy);
  if (p === "strict") return total;
  if (p === "moderate") return Math.min(total, Math.round(total * MODERATE_PENALTY_BPS / 10000));
  return Math.min(total, Math.max(Math.round(total * 0.3), firstNight || 0));
}
function planPayment(core, total, checkIn, today, policy, firstNight) {
  const p = normalize(policy);
  const daysTo = core.dayNum(checkIn) - core.dayNum(today);
  if (p === "strict" || daysTo <= 30) return { scheme: "full", advance: total, rest: 0, restDueOn: null };
  const advance = advanceBani(p, total, firstNight);
  if (advance >= total) return { scheme: "full", advance: total, rest: 0, restDueOn: null };
  return { scheme: "advance", advance, rest: total - advance, restDueOn: core.addDays(checkIn, -30) };
}

// ---------- anularea de către turist ----------
// r: { policy, paid, total, firstNight, checkinAt (Date), now (Date) }
// întoarce { allowed, free, penalty, refund, hoursLeft }
function cancelOutcome(r) {
  const paid = Math.max(0, Number(r.paid) || 0), total = Math.max(0, Number(r.total) || 0);
  const ms = r.checkinAt.getTime() - r.now.getTime();
  const hoursLeft = ms / 3600000;
  if (!(ms > 0)) return { allowed: false, free: false, penalty: paid, refund: 0, hoursLeft };
  const p = normalize(r.policy);
  let penalty;
  if (p === "strict") penalty = paid;
  else if (p === "moderate") penalty = hoursLeft > MODERATE_HOURS ? 0 : Math.min(paid, Math.round(total * MODERATE_PENALTY_BPS / 10000));
  else penalty = hoursLeft > FLEX_HOURS ? 0 : Math.min(paid, Math.max(0, Number(r.firstNight) || 0));
  return { allowed: true, free: penalty === 0, penalty, refund: paid - penalty, hoursLeft };
}

// comisionul platformei din ce rămâne la gazdă ca penalitate: aceeași rată ca pe rezervare (0 dacă rezervarea e fără comision)
function penaltyCommission(commissionBani, totalBani, penalty) {
  if (!(commissionBani > 0) || !(totalBani > 0) || !(penalty > 0)) return 0;
  return Math.min(penalty, Math.round(penalty * commissionBani / totalBani));
}

// ---------- texte pentru turist ----------
const fmt = (b) => (b / 100).toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " RON";
function shortText(policy) {
  const p = normalize(policy);
  if (p === "strict") return "Rezervarea este nerambursabilă. Plătești 100% la rezervare și ai o reducere de 10%.";
  if (p === "moderate") return "Anulare gratuită cu mai mult de 7 zile înainte de check-in. După aceea se reține 50% din total.";
  return "Anulare gratuită cu mai mult de 48 de ore înainte de check-in. După aceea se reține prima noapte.";
}
// textul acceptat la plată, cu sumele reale ale rezervării
function acceptText(policy, ctx) {
  const p = normalize(policy), c = ctx || {};
  if (p === "strict") return "Am înțeles că rezervarea este nerambursabilă: dacă o anulez, nu mi se returnează nicio sumă. Dacă anulează gazda, primesc banii înapoi integral.";
  if (p === "moderate") return "Am înțeles politica de anulare Moderată: pot anula gratuit cu mai mult de 7 zile înainte de check-in (" + (c.checkinLabel || "ora de sosire") + "). După aceea se reține 50% din total (" + fmt(Math.round((c.total || 0) * MODERATE_PENALTY_BPS / 10000)) + "). Dacă anulează gazda, primesc banii înapoi integral.";
  return "Am înțeles politica de anulare Flexibilă: pot anula gratuit cu mai mult de 48 de ore înainte de check-in (" + (c.checkinLabel || "ora de sosire") + "). După aceea se reține prima noapte (" + fmt(c.firstNight || 0) + "). Dacă anulează gazda, primesc banii înapoi integral.";
}
// ce vede turistul înainte să confirme anularea
function cancelPreviewText(out) {
  if (!out.allowed) return "Perioada în care se mai poate anula a trecut.";
  if (out.refund > 0 && out.penalty === 0) return "Vei primi înapoi " + fmt(out.refund) + " (anulare gratuită). Camera se eliberează imediat.";
  if (out.refund > 0) return "Vei primi înapoi " + fmt(out.refund) + ". Se reține " + fmt(out.penalty) + " conform politicii de anulare. Camera se eliberează imediat.";
  if (out.penalty > 0) return "Conform politicii de anulare, suma plătită (" + fmt(out.penalty) + ") nu se returnează. Camera se eliberează imediat.";
  return "Camera se eliberează imediat.";
}

module.exports = { KEYS, DEFAULT_POLICY, STRICT_DISCOUNT_BPS, LABELS, normalize, isStrict, discountBps, checkinTime, checkinInstant, firstNightOf, advanceBani, planPayment, cancelOutcome, penaltyCommission, shortText, acceptText, cancelPreviewText, fmt };

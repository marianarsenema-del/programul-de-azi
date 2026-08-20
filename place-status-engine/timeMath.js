/**
 * timeMath.js
 * -----------------------------------------------------------------------
 * Funcții PURE (fără bază de date, fără rețea) pentru a determina dacă o
 * locație e deschisă ACUM, folosind `periods` (din Google Places) și
 * `utc_offset_minutes` (fusul orar local al locației, nu al serverului
 * și nu al vizitatorului).
 *
 * De ce separat de restul codului: e partea cu cel mai mare risc de erori
 * subtile (ore care trec peste miezul nopții, sfârșit de săptămână care se
 * "rostogolește" spre duminică) — izolată aici, poate fi testată complet,
 * fără să depindă de Google sau de baza de date.
 * -----------------------------------------------------------------------
 */

const MINUTES_PER_DAY = 1440;
const MINUTES_PER_WEEK = MINUTES_PER_DAY * 7;

// "HHMM" (string, cum vine de la Google) -> minute de la miezul nopții
function hhmmToMinutes(hhmm) {
  const h = parseInt(hhmm.slice(0, 2), 10);
  const m = parseInt(hhmm.slice(2, 4), 10);
  return h * 60 + m;
}

// zi (0=Duminică...6=Sâmbătă, convenția Google) + "HHMM" -> minute de la
// începutul săptămânii (Duminică 00:00 = 0)
function toWeekMinutes(day, hhmm) {
  return day * MINUTES_PER_DAY + hhmmToMinutes(hhmm);
}

/**
 * Calculează ora LOCALĂ a locației, chiar acum, folosind doar
 * utc_offset_minutes — fără bibliotecă de fuse orare, fără nevoie de nume
 * de fus orar (ex. "Europe/Bucharest"). Tehnică: adaugă offset-ul la ora
 * UTC curentă, apoi citește componentele ca și cum ar fi UTC.
 *
 * @param {number} utcOffsetMinutes - de la Google (poate fi negativ)
 * @param {Date} [now] - opțional, pentru teste — implicit ora reală curentă
 * @returns {{ weekMinutes: number, day: number, hhmm: string }}
 */
function getLocalNow(utcOffsetMinutes, now = new Date()) {
  const shifted = new Date(now.getTime() + utcOffsetMinutes * 60000);
  const day = shifted.getUTCDay();
  const hours = shifted.getUTCHours();
  const minutes = shifted.getUTCMinutes();
  const hhmm = String(hours).padStart(2, "0") + String(minutes).padStart(2, "0");
  return { weekMinutes: toWeekMinutes(day, hhmm), day, hhmm };
}

/**
 * Verifică dacă `nowWeekMinutes` cade în interiorul vreunei perioade din
 * `periods` (formatul Google: [{ open: {day, time}, close: {day, time} }]).
 * Gestionează corect: perioade care trec peste miezul nopții (close.day
 * diferit de open.day), și "rostogolirea" sfârșit-de-săptămână -> început
 * (ex: acum e Duminică 00:30, dar magazinul a deschis Sâmbătă 22:00).
 */
function isOpenAtWeekMinutes(periods, nowWeekMinutes) {
  if (!Array.isArray(periods) || periods.length === 0) return false;

  for (const period of periods) {
    if (!period || !period.open) continue;

    // deschis 24/7, fără "close" deloc — convenția Google pentru non-stop
    if (!period.close) return true;

    const openTotal = toWeekMinutes(period.open.day, period.open.time);
    let closeTotal = toWeekMinutes(period.close.day, period.close.time);

    // dacă "close" pare să fie înainte de "open" în cadrul săptămânii,
    // înseamnă că perioada trece peste granița săptămânii (sau a zilei) —
    // o "întindem" cu o săptămână întreagă, ca intervalul să rămână liniar
    if (closeTotal <= openTotal) closeTotal += MINUTES_PER_WEEK;

    // verificăm "acum" atât ca atare, cât și "acum + o săptămână" — al
    // doilea caz prinde exact situația "e Duminică devreme, dar magazinul
    // a deschis Sâmbătă seara și perioada se întinde peste granița săptămânii"
    if (nowWeekMinutes >= openTotal && nowWeekMinutes < closeTotal) return true;
    if (nowWeekMinutes + MINUTES_PER_WEEK >= openTotal && nowWeekMinutes + MINUTES_PER_WEEK < closeTotal) {
      return true;
    }
  }
  return false;
}

/**
 * Funcția principală: primește `periods` + `utc_offset_minutes` (exact cum
 * vin de la Google) și spune dacă locația e deschisă ACUM, în fusul ei orar
 * local — nu al serverului, nu al vizitatorului.
 */
function isOpenNow(periods, utcOffsetMinutes, now = new Date()) {
  const local = getLocalNow(utcOffsetMinutes, now);
  return isOpenAtWeekMinutes(periods, local.weekMinutes);
}

module.exports = { hhmmToMinutes, toWeekMinutes, getLocalNow, isOpenAtWeekMinutes, isOpenNow };

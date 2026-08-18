/* ============================================================
   lib/schedule.js
   Utilitare comune: calcul „deschis / închis acum” pentru orice
   entitate cu forma { weekly: [...], holidays: [...] } — folosit
   atât pentru magazine (lib/stores.js) cât și pentru zonele de
   mall (lib/malls.js), ca să nu existe logică duplicată.
   ============================================================ */

export const DAY_NAMES = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];

export function pad(n) {
  return String(n).padStart(2, "0");
}

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function mmdd(date) {
  return pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

export function ymd(date) {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

export function getHolidayFor(entity, date) {
  const md = mmdd(date);
  const full = ymd(date);
  return entity.holidays.find((h) => h.date === md || h.date === full) || null;
}

export function getDayHours(entity, date) {
  const holiday = getHolidayFor(entity, date);
  if (holiday) return { hours: holiday.hours, isHoliday: true, label: holiday.label };
  const w = entity.weekly[date.getDay()];
  return { hours: w ? [w.open, w.close] : null, isHoliday: false, label: null };
}

/**
 * Calculează statusul curent (deschis/închis) pentru o entitate
 * cu program săptămânal + sărbători.
 * @param {{weekly: Array, holidays: Array}} entity
 * @param {Date} now
 */
export function computeStatus(entity, now) {
  const today = getDayHours(entity, now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (!today.hours) {
    return {
      open: false,
      sub: today.isHoliday ? `Închis astăzi — ${today.label}` : "Închis toată ziua",
    };
  }

  const openMin = toMinutes(today.hours[0]);
  const closeMin = toMinutes(today.hours[1]);

  if (nowMin < openMin) return { open: false, sub: `Se deschide azi la ${today.hours[0]}` };
  if (nowMin >= closeMin) return { open: false, sub: `S-a închis la ${today.hours[1]} — revino mâine` };
  return { open: true, sub: `Se închide azi la ${today.hours[1]}` };
}

/**
 * getLocationStatus.js
 * -----------------------------------------------------------------------
 * Funcția care rulează când un utilizator accesează pagina unei locații.
 *
 * Flux:
 *  1. Caută în cache (place_id + limbă) — dacă e mai nou de 12 ore, îl
 *     folosește direct, FĂRĂ să mai întrebe Google (economisește bani).
 *  2. Dacă nu există cache valid, cere datele brute de la Google Place
 *     Details și le salvează în cache pentru runda următoare.
 *  3. Din datele brute (cache-uite sau proaspete), CALCULEAZĂ statusul
 *     "acum" în timp real, la fiecare cerere — asta NU vine niciodată
 *     din cache, pentru că se schimbă minut de minut.
 * -----------------------------------------------------------------------
 */

const { fetchPlaceDetails } = require("./googlePlacesDetails");
const { getCachedDetails, saveCachedDetails } = require("./cache");
const { isOpenNow, getLocalNow } = require("./timeMath");

// codurile de limbă interne ale site-ului ("uk" = engleză, moștenit din
// codul de țară) NU coincid mereu cu codurile IETF pe care le așteaptă
// Google ("en" pentru engleză). Ajustează harta asta dacă adaugi limbi noi.
const INTERNAL_TO_GOOGLE_LANG = {
  ro: "ro", uk: "en", de: "de", es: "es", fr: "fr",
  it: "it", pl: "pl", nl: "nl", da: "da",
};

function toGoogleLang(internalLangCode) {
  return INTERNAL_TO_GOOGLE_LANG[internalLangCode] || internalLangCode || "en";
}

function localDateString(utcOffsetMinutes, now = new Date()) {
  const shifted = new Date(now.getTime() + utcOffsetMinutes * 60000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// vezi timeMath.js pentru detalii — comparăm programul normal cu cel "curent
// (cu excepții)" pentru ziua de azi; dacă diferă, sau dacă Google a marcat
// explicit ziua ca specială, considerăm azi "zi specială" (posibil sărbătoare)
function detectSpecialDay(regularOpeningHours, currentOpeningHours, localDay, localDateStr) {
  const specialDays = currentOpeningHours && currentOpeningHours.special_days;
  if (Array.isArray(specialDays)) {
    const todayEntry = specialDays.find((d) => d && d.date === localDateStr);
    if (todayEntry) return { isSpecial: true, reason: "special_days" };
  }

  const regularPeriods = (regularOpeningHours && regularOpeningHours.periods) || null;
  const currentPeriods = (currentOpeningHours && currentOpeningHours.periods) || null;
  if (regularPeriods && currentPeriods) {
    const regularToday = regularPeriods.filter((p) => p.open && p.open.day === localDay);
    const currentToday = currentPeriods.filter((p) => p.open && p.open.day === localDay);
    if (JSON.stringify(regularToday) !== JSON.stringify(currentToday)) {
      return { isSpecial: true, reason: "periods_differ" };
    }
  }

  return { isSpecial: false, reason: null };
}

/**
 * @param {object} params
 * @param {import('pg').Pool} params.pool - pool-ul de conexiuni Postgres
 * @param {string} params.placeId
 * @param {string} params.apiKey - cheia Google Places API
 * @param {string} params.language - codul de limbă INTERN al site-ului
 *   (ex: "ro", "de", "uk" pentru engleză) — se traduce automat spre codul
 *   IETF pe care îl așteaptă Google.
 * @param {boolean} [params.cacheOnly] - dacă e true, NU cere niciodată date
 *   proaspete de la Google (cost real) — dacă nu există deja cache valid,
 *   întoarce direct `{ skipped: true }`, fără nicio cerere. Folosit de
 *   /api/city-live-map (harta unui oraș întreg poate avea zeci de magazine
 *   deodată — fără acest mod, fiecare deschidere a hărții ar costa bani
 *   pentru orice locație necache-uită încă).
 * @param {number} [params.ttlHours] - durata de valabilitate a cache-ului,
 *   în ore, pentru ACEST apel specific — cerere explicită de reducere a
 *   costului: 168 (7 zile) pentru magazine, 720 (30 zile) pentru obiective
 *   turistice. Fără el, cade pe CACHE_TTL_HOURS din cache.js (12h implicit).
 * @param {() => Promise<boolean>} [params.checkFetchAllowed] - verificare
 *   opțională, apelată DOAR chiar înainte de o cerere plătită reală (nu la
 *   citirea din cache) — protecție împotriva unui atac deliberat, care ar
 *   viza intenționat locații necache-uite ca să genereze cost. Dacă
 *   întoarce `false`, cererea NU se face, se întoarce `{ skipped: true,
 *   rateLimited: true }`.
 * @returns {Promise<{
 *   name: string,
 *   businessStatus: string,
 *   isOpenNow: boolean,
 *   weeklyScheduleText: string[],
 *   isSpecialDay: boolean,
 *   specialDayReason: string|null,
 *   utcOffsetMinutes: number|null,
 *   lat: number|null,
 *   lng: number|null,
 *   fromCache: boolean,
 *   skipped: boolean|undefined,
 * }>}
 */
async function getLocationStatus({ pool, placeId, apiKey, language, cacheOnly, ttlHours, checkFetchAllowed }) {
  const googleLang = toGoogleLang(language);

  let raw = await getCachedDetails(pool, placeId, googleLang, ttlHours);
  let fromCache = true;

  if (!raw) {
    if (cacheOnly) {
      // NU cerem nimic de la Google — mai bine lipsă din hartă decât un
      // cost real la fiecare deschidere a paginii unui oraș întreg.
      return { skipped: true, fromCache: false };
    }
    // checkFetchAllowed — protecție împotriva unui atac deliberat (cost
    // real, indus intenționat), NU doar crawlere oneste (alea sunt deja
    // prinse de cacheOnly, mai sus, din server.js). Verificată chiar aici,
    // EXACT înainte de cererea plătită — dacă IP-ul a depășit limita de
    // cereri "noi" (cache-miss) recente, refuzăm ferm, fără cost.
    if (checkFetchAllowed) {
      const allowed = await checkFetchAllowed();
      if (!allowed) {
        return { skipped: true, rateLimited: true, fromCache: false };
      }
    }
    fromCache = false;
    raw = await fetchPlaceDetails(placeId, apiKey, googleLang);
    await saveCachedDetails(pool, placeId, googleLang, raw);
  }

  // Coordonate GPS — bug real, găsit prin testare directă (link-urile de
  // parcare YourParkingSpace rămâneau mereu "urmează în curând", chiar și
  // pentru obiective din UK cu place_id valid): lipseau complet din acest
  // fișier, deși `geometry` era deja cerut de la Google (după fix-ul din
  // googlePlacesDetails.js) — extrase aici acum, din ambele ramuri de
  // return, ca orice apelant (schema.org geo, link-uri de parcare) să le
  // găsească indiferent dacă locația are sau nu program orar completat.
  const geo = raw.geometry && raw.geometry.location;
  const lat = geo && typeof geo.lat === "number" ? geo.lat : null;
  const lng = geo && typeof geo.lng === "number" ? geo.lng : null;

  // fallback defensiv: dacă locația nu are deloc program pe Google (se
  // întâmplă la locații slab completate), nu crăpăm — raportăm onest că
  // nu știm, nu inventăm un status
  if (!raw.opening_hours || !raw.opening_hours.periods) {
    return {
      name: raw.name || null,
      businessStatus: raw.business_status || "UNKNOWN",
      isOpenNow: null,
      weeklyScheduleText: [],
      isSpecialDay: false,
      specialDayReason: null,
      utcOffsetMinutes: raw.utc_offset ?? null,
      formattedAddress: raw.formatted_address || null,
      formattedPhoneNumber: raw.formatted_phone_number || null,
      lat,
      lng,
      fromCache,
      note: "Google nu are program orar completat pentru această locație.",
    };
  }

  const utcOffsetMinutes = raw.utc_offset ?? 0;
  const now = new Date();
  const local = getLocalNow(utcOffsetMinutes, now);
  const localDateStr = localDateString(utcOffsetMinutes, now);

  const openNow = isOpenNow(raw.opening_hours.periods, utcOffsetMinutes, now);
  const special = detectSpecialDay(raw.opening_hours, raw.current_opening_hours, local.day, localDateStr);

  return {
    name: raw.name || null,
    businessStatus: raw.business_status || "OPERATIONAL",
    isOpenNow: openNow,
    weeklyScheduleText: raw.opening_hours.weekday_text || [],
    isSpecialDay: special.isSpecial,
    specialDayReason: special.reason,
    utcOffsetMinutes,
    formattedAddress: raw.formatted_address || null,
    formattedPhoneNumber: raw.formatted_phone_number || null,
    lat,
    lng,
    fromCache,
  };
}

module.exports = { getLocationStatus, toGoogleLang, detectSpecialDay };

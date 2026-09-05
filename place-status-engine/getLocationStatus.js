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

// Nume de zile, per limbă — folosite pentru a construi NOI ÎNȘINE textul
// orarului săptămânal (nu mai preluăm weekday_text de la Google). Motiv, bug
// real, semnalat direct: weekday_text vine de la Google într-o ORDINE care
// diferă pe limbă (unele încep cu Luni, altele cu Duminică — confirmat în
// documentația oficială Google), inconsecvent cu restul site-ului, care
// arată mereu Duminică prima. Rezultatul: Duminica apărea ultima în listă,
// ușor de citit greșit ca "lipsă". `periods` (spre deosebire de
// weekday_text) are index GARANTAT, fix, Duminică=0 — pe acela îl folosim
// ca sursă de adevăr, la fel cum face deja isOpenNow.
const DAY_NAMES = {
  ro: ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"],
  uk: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  es: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
  fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  it: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"],
  pl: ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"],
  nl: ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"],
  da: ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"],
};
const CLOSED_WORD = {
  ro: "Închis", uk: "Closed", de: "Geschlossen", es: "Cerrado", fr: "Fermé",
  it: "Chiuso", pl: "Zamknięte", nl: "Gesloten", da: "Lukket",
};

// Construiește liniile de orar săptămânal NOI, din `periods` (index Sunday=0,
// garantat de Google), Duminică -> Sâmbătă, în limba internă cerută — nu
// mai depinde deloc de ordinea/formatul textului pre-făcut de Google.
function buildWeeklyScheduleText(periods, internalLangCode) {
  const names = DAY_NAMES[internalLangCode] || DAY_NAMES.uk;
  const closedWord = CLOSED_WORD[internalLangCode] || CLOSED_WORD.uk;
  if (!Array.isArray(periods)) return [];

  // TOATĂ construcția e împachetată defensiv — date neașteptate/incomplete
  // de la Google (ex. lipsă "time" pe un period) nu trebuie NICIODATĂ să
  // oprească un request, cu atât mai puțin tot procesul Node (bug real,
  // semnalat direct — site-ul întreg a picat din exact acest motiv, un
  // .slice() apelat pe undefined, într-un context async necapturat).
  try {
    // pentru fiecare zi (0=Duminică..6=Sâmbătă), găsim TOATE perioadele care
    // încep în ziua aia — de obicei una singură, dar unele locații au 2
    // intervale în aceeași zi (ex. pauză de prânz) — le unim cu virgulă.
    const byDay = [[], [], [], [], [], [], []];
    periods.forEach((p) => {
      if (!p || !p.open || typeof p.open.day !== "number") return;
      const day = p.open.day;
      if (day < 0 || day > 6) return;
      if (!p.close) {
        // deschis non-stop — aceeași convenție ca googlePeriodsToWeekly din server.js
        for (let d = 0; d < 7; d++) byDay[d] = ["00:00–23:59"];
        return;
      }
      // "time" lipsă/malformat pe orice period — sărim DOAR perioada asta,
      // nu crăpăm toată funcția pentru o singură intrare proastă
      if (typeof p.open.time !== "string" || p.open.time.length < 4) return;
      if (typeof p.close.time !== "string" || p.close.time.length < 4) return;
      const openTime = `${p.open.time.slice(0, 2)}:${p.open.time.slice(2, 4)}`;
      const closeTime = p.close.day === p.open.day
        ? `${p.close.time.slice(0, 2)}:${p.close.time.slice(2, 4)}`
        : "23:59"; // aproximare — perioadă ce trece peste miezul nopții
      byDay[day].push(`${openTime}–${closeTime}`);
    });

    return byDay.map((intervals, day) => {
      const label = names[day];
      return intervals.length ? `${label}: ${intervals.join(", ")}` : `${label}: ${closedWord}`;
    });
  } catch (e) {
    // orice altceva neprevăzut — nu lăsăm NICIODATĂ să scape mai departe;
    // afișăm listă goală (clientul deja tratează asta elegant), nu crăpăm.
    return [];
  }
}

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
    weeklyScheduleText: buildWeeklyScheduleText(raw.opening_hours.periods, language),
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

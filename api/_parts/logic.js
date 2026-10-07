// Generat automat din server.js — funcții de pagină și logică (cod mutat fără modificări de logică).
const crypto = require("crypto");
const {
  COMING_SOON_TEXTS,
  ITINERARY_LABELS,
  BEACH_MONETIZATION_LABELS,
  EXTRA_LABELS,
  NO_LIVE_DATA_TEXT,
  LIVE_GOOGLE_LABEL,
  BOOKING_PLANNING_LABELS_RO,
  BOOKING_PLANNING_LABELS_EN,
  CITY_FAQ_TEXTS,
  REPORT_ISSUE_LABELS_RO,
  REPORT_ISSUE_LABELS_EN,
  CLOSED_PERMANENTLY_LABELS_RO,
  CLOSED_PERMANENTLY_LABELS_EN,
  REPORTED_WRONG_LABELS_RO,
  REPORTED_WRONG_LABELS_EN,
  HOW_TO_GET_THERE_LABELS_RO,
  HOW_TO_GET_THERE_LABELS_EN,
  NO_RESULTS_ITINERARY_LABELS,
  CONTEXTUAL_WIDGET_LABELS_RO,
  MALL_CINEMA_LABELS,
  CONTEXTUAL_WIDGET_LABELS_EN,
  ACCORDION_TEXTS,
  ATTRACTION_PREFIX_TRANSLATIONS,
  RECOMMENDED_LABELS,
  RECOMMENDED_FIRST_LABELS,
  BEACHES_MEGA_CATEGORY_LABELS,
  DISCOVER_BEACH_LABELS,
  BEACH_REVIEW_LABELS,
  ITINERARY_PROMO_LABELS,
  GREECE_BEACH_PROMO_LABELS,
  VOTE_LABELS,
  BEACH_TAG_LABELS,
  BOAT_TOUR_LABELS,
  CAR_ACCESS_HINT_LABELS,
  FREE_ACCESS_LABELS,
  SEASONAL_WARNING_LABELS,
  OPEN_ONLY_STORE_LABELS,
  OPEN_ONLY_ATTRACTION_LABELS,
  OPEN_ONLY_SHORT_LABELS,
  LIVE_COMING_SOON_LABELS,
  ESTIMATED_SCHEDULE_LABELS,
  CATEGORY_LABELS,
  LOADING_TEXTS,
  TRANSLATIONS,
  COUNTRY_LABELS,
  LANGUAGE_LABELS,
  STORE_CATEGORY_LABELS,
  SMART_INSTALL_TEXTS_RO,
  SMART_INSTALL_TEXTS_EN,
  FAV_EMPTY_TEXTS,
  FAV_INTRO_TEXTS,
  HOMEPAGE_FOOTER_TEXTS,
  HOMEPAGE_SEO_TITLES,
  HOMEPAGE_SEO_DESCRIPTIONS,
  MAP_UNIFIED_TOGGLE_LABELS,
  MAP_LOADING_STORES_LABELS,
  MAP_LOADING_ATTRACTIONS_LABELS,
  BOTTOM_NAV_LABELS,
  TRAVEL_GUIDES_RO,
  TRAVEL_GUIDES_EN,
  TRAVEL_GUIDES_DE,
  TRAVEL_GUIDES_FR,
  TRAVEL_GUIDES_ES,
  TRAVEL_GUIDES_IT,
  TRAVEL_GUIDES_PL,
  TRAVEL_GUIDES_NL,
  GUIDES_PAGE_LABELS,
  NAV_LABELS,
  FLIGHT_SEARCH_LABELS,
  CAR_RENTAL_LABELS,
  TRIP_TYPE_LABELS,
  VIBE_LABELS,
  BUDGET_LABELS,
  ITINERARY_COPY_UNIVERSAL,
} = require("../locales.js");
const {
  BEACH_TAG_GROUPS,
  BEACH_STANDALONE_TAGS,
  BEACH_ALL_TAGS,
  DISCOVERCARS_CITY_LINKS,
  GLOVO_COUNTRIES,
  FREE_ACCESS_PREFIXES_BY_CATEGORY,
  SEASONAL_WARNING_PREFIXES,
  CATEGORY_GENERIC_SCHEDULE,
  FREE_ACCESS_CATEGORIES,
  DE_STORE_CONFIG,
  GR_STORE_CONFIG,
  UK_STORE_CONFIG,
  ES_STORE_CONFIG,
  BE_STORE_CONFIG,
  COUNTRIES,
  ATTRACTION_CITY_OVERRIDES,
  STORE_CONFIG,
  FR_ALL_CITIES_EXCEPT_MONT_SAINT_MICHEL,
  SELECTIVE_BRAND_CITIES,
  PER_CITY_WEEKLY,
  PER_LOCATION_WEEKLY,
  PER_LOCATION_ADDRESS,
  SITEMAP_CITIES,
  CITY_COORDS,
  OBIECTIVE_ITINERAR,
  JUDET_NEIGHBORS,
  CITY_ALIASES_RO,
} = require("../config-data.js");
const ATTRACTIONS = require("../attractions-data.js");
const BEACH_CONTENT_DATA = require("../beach-content-data.js");
const BEACH_CONTENT_UK = require("../beach-content-uk.js");
const { ACCOMMODATION_AMENITIES, ACCOMMODATION_LIVE, ACCOMMODATION_PREVIEW_KEY, ACCOMMODATION_SESSION_SECRET, ACC_CURRENCY_LABELS, ACC_CURRENCY_LABELS_EN, ACC_FALLBACK_RATES, ACC_SUPPORTED_CURRENCIES, ADMIN_SESSION_SECRET, ADSENSE_ENABLED, ALL_JUDETE_NORMALIZED, APT_BATHS_MAX, APT_BEDROOMS_MAX, APT_GROUPS, APT_INDEX, APT_OPTS, ARRIVAL_PLANNER_LABELS, ATTRACTION_AMENITIES, ATTRACTION_FOOTER_TEMPLATES, ATTRACTION_TICKET_URLS, ATTRACTION_VENUE_TYPES, AWIN_YPS_AFFILIATE_ID, AWIN_YPS_MERCHANT_ID, BACK_BUTTON_LABELS, BATH_AMENITIES, BEACH_CONTENT_LABELS_RO, BEACH_CONTENT_LABELS_UK, BEACH_PARTNER_OFFERS, BEDROOM_AMENITIES, BED_TYPES, BOOKING_AFFILIATE_ID, BOOKING_HINT_TEMPLATES, BOOKING_HINT_TEMPLATES_BEACH, BOT_USER_AGENT_PATTERN, CAMP_FACILITIES, CAMP_GROUPS, CAMP_PHOTO_MAX, CAMP_SHADE, CAMP_UNITS, CAMP_UNIT_AMENITIES, CAMP_UNIT_BEDS, CAMP_VEHICLES, COUNTRY_NAMES_EN, COUNTRY_NAMES_RO, DAISY_TYPES, DAY_NAMES, DESC_AI_CLICHEE, DISCOVERCARS_AFFILIATE_ID, EXTERIOR_ACCESS, EXTERIOR_AMENITIES, FIREPLACE_TYPES, FREE_ACCESS_DAM_RE, FREE_ACCESS_EXCLUDE_RE, FREE_ACCESS_KEYWORDS_RE, FREE_ACCESS_SKIP_CATEGORIES, GENERIC_PARTNER_OFFERS, GEO_BTN_LABELS, GOOGLE_PLACES_API_KEY_LIVE, GYG_PARTNER_ID, HOTEL_BEDS, HOTEL_FACILITIES, HOTEL_MEAL_PLANS, HOTEL_MENUS, HOTEL_PETS, HOTEL_PHOTO_MAX, HOTEL_QUIET, HOTEL_RECEPTION, HOTEL_ROOM_AMENITIES, HOTEL_ROOM_PHOTO_MAX, HOTEL_SUBTYPES, I18N_MAPS_EN, INTERNAL_TO_GOOGLE_LANG, INTL_DOMAIN, KITCHEN_APPLIANCES, KITCHEN_TYPES, LANGUAGE_FLAGS, LANG_META, LIVING_AMENITIES, LIVING_GROUPS, LOCALITATE_TO_JUDET, LOCAL_SEARCH_HITS, MAX_OBIECTIVE_PROMPT, MIN_OBIECTIVE_UTILE, MIN_OBIECTIVE_UTILE_INTL, MOUNTAIN_ROAD_LABELS, MOUNTAIN_ROAD_RE, NO_MATCHES_LABELS, OPENWEATHER_API_KEY, OWNER_EXISTS_CACHE, PA_ICON_MAP, PA_ICON_PATHS, PENSION_BATH_TYPES, PENSION_BED_KEYS, PENSION_EXTRA_BEDS, PENSION_MAIN_BEDS, PENSION_TYPES, PROSPECT_DEFAULT_TEMPLATES, PROSPECT_STATUSES, RENTAL_MODES, REPORT_IP_SALT, RESEND_API_KEY, RESTAURANT_AMENITIES, RESTAURANT_DIETARY_OPTIONS, RESTAURANT_LIVE, RESTAURANT_PLATFORM_BY_COUNTRY, RESTAURANT_PREVIEW_KEY, RESTAURANT_VENUE_TYPES, REVIEWS_CLIENT_JS, REVIEW_CRITERIA, ROAD_WORD_RE, ROMANIAN_LEGAL_HOLIDAYS_2026, RO_DOMAIN, RO_TO_EU_GUIDES_MAP, RO_TO_EU_MIGRATION_EXCLUDED_PREFIXES, SCHEMA_DAY_NAMES, SEO_TYPE_WORDS, SITEMAP_BRANDS, SITEMAP_MALLS, SOCIAL_ICONS, STAR_PATH, STORE_AFFILIATE_LINKS, STRUCT_FACILITY_KEYS, SUBMIT_PLACE_LABELS, SUBMIT_PLACE_SCHEDULE_DAYS, TRANSFER_WIDGET_SRC_EU, TRANSFER_WIDGET_SRC_RO, TRAVEL_GUIDES_BY_LANG, TRAVEL_GUIDES_MONETIZATION_READY, TURNSTILE_SECRET_KEY, UNIT_TYPES, VIEW_TYPES, WAITLIST_BUSINESS_TYPES, WEATHER_DAILY_SAFETY_LIMIT, adsensePublisherId, codAdSense, codAnalytics, dbPool, googleMapsApiKey, linkBileteTurism, linkBringoAffiliate, linkGlovoAffiliate, linkOmioAffiliate, linkOpenTableAffiliate, linkTheForkAffiliate } = require("./static");



// Adresele vechi românești fără prefix de țară (/bucuresti, /bucuresti/lidl,
// /obiectiv/..., /ghiduri/...). Paginile vechi care le serveau au fost șterse
// (cu migrarea activă nu mai ajungea nimeni la ele). Rezultatul final e
// identic cu cel de dinainte: vizitatorul ajunge pe .eu/ro/..., doar că acum
// direct, dintr-un singur pas. Pe programul-de-azi.ro ajung aici doar adresele
// din lista de excepții, pentru care nu există pagină — 404, ca să nu apară
// o buclă de redirecționări.
function redirectLegacyRoPage(req, res) {
  if (!isIntlHost(req)) {
    res.status(404).send("Pagină negăsită.");
    return;
  }
  if (RO_TO_EU_MIGRATION_EXCLUDED_PREFIXES.some((p) => req.path === p || req.path.startsWith(p))) {
    res.status(404).send("Pagină negăsită.");
    return;
  }
  if (RO_TO_EU_GUIDES_MAP[req.path]) {
    res.redirect(301, `https://${INTL_DOMAIN}${RO_TO_EU_GUIDES_MAP[req.path]}`);
    return;
  }
  res.redirect(301, `https://${INTL_DOMAIN}/ro${req.path}`);
}

// Săgețile „←” din bara de jos a formularelor sunt linkuri normale; dacă
// pagina anterioară e chiar cea spre care duc, ne întoarcem în istoric în
// loc să adăugăm o intrare nouă — ca „înapoi” să nu mai ducă „înainte”.
function buildSubBackLinkScript(nonce) {
  return `<script nonce="${nonce}">(function(){document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a.acc-sub-back");if(!a)return;try{var ref=document.referrer?new URL(document.referrer):null;var to=new URL(a.href,location.href);if(ref&&ref.origin===location.origin&&ref.pathname===to.pathname&&window.history.length>1){e.preventDefault();window.history.back();}}catch(err){}});})();</script>`;
}

function transferWidgetSrcFor(isIntl) {
  return isIntl ? TRANSFER_WIDGET_SRC_EU : TRANSFER_WIDGET_SRC_RO;
}

async function getAccommodationMonthlyPriceCents() {
  if (!dbPool) return 0;
  try {
    const { rows } = await dbPool.query(`SELECT value FROM accommodation_settings WHERE key = 'monthly_price_cents'`);
    return rows.length ? parseInt(rows[0].value, 10) || 0 : 0;
  } catch (e) {
    return 0;
  }
}

async function getExchangeRates() {
  const fallback = { base: "EUR", rates: ACC_FALLBACK_RATES, updated: null };
  if (!dbPool) return fallback;
  try {
    const cached = await dbPool.query(`SELECT value FROM accommodation_settings WHERE key = 'exchange_rates'`);
    if (cached.rows.length) {
      const data = JSON.parse(cached.rows[0].value);
      const looksComplete = data.rates && ACC_SUPPORTED_CURRENCIES.every((c) => typeof data.rates[c] === "number");
      if (looksComplete && data.updated && Date.now() - new Date(data.updated).getTime() < 12 * 60 * 60 * 1000) {
        return data;
      }
    }
  } catch (e) { /* mergem mai departe, încercăm să aducem date noi */ }
  try {
    const symbols = ACC_SUPPORTED_CURRENCIES.filter((c) => c !== "EUR").join(",");
    const resp = await fetch(`https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${symbols}`, { signal: AbortSignal.timeout(5000) });
    const data = await resp.json();
    if (!data.rates) return fallback;
    const result = { base: "EUR", rates: { EUR: 1, ...data.rates }, updated: new Date().toISOString() };
    if (dbPool) {
      dbPool.query(
        `INSERT INTO accommodation_settings (key, value) VALUES ('exchange_rates', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [JSON.stringify(result)]
      ).catch(() => {});
    }
    return result;
  } catch (e) {
    return fallback;
  }
}

function toGoogleLang(internalLangCode) {
  return INTERNAL_TO_GOOGLE_LANG[internalLangCode] || internalLangCode || "en";
}


async function getAttractionVoteCount(slug) {
  if (!dbPool) return 0;
  try {
    const { rows } = await dbPool.query(`SELECT COUNT(*)::int AS cnt FROM attraction_votes WHERE slug = $1`, [slug]);
    return rows[0] ? rows[0].cnt : 0;
  } catch (err) {
    return 0; // tabela poate lipsi încă (nu s-a rulat SQL-ul de creare) — cădem elegant pe 0, nu crăpăm pagina
  }
}


// Toate numerele de voturi, per etichetă — cerut explicit: cardul
// centralizat de pe pagina plajei arată numărul de voturi la FIECARE
// opțiune (nu doar câștigătoarea, ca insigna de pe listă).
async function getBeachTagCounts(slug) {
  const empty = {};
  BEACH_ALL_TAGS.forEach((t) => { empty[t] = 0; });
  if (!dbPool) return empty;
  try {
    const { rows } = await dbPool.query(
      `SELECT tag, COUNT(*)::int AS cnt FROM attraction_info_tags WHERE slug = $1 GROUP BY tag`,
      [slug]
    );
    const counts = { ...empty };
    rows.forEach((r) => { if (counts[r.tag] !== undefined) counts[r.tag] = r.cnt; });
    return counts;
  } catch (err) {
    return empty; // tabela poate lipsi încă — cădem elegant, nu crăpăm pagina
  }
}


// Doar raportările NEREZOLVATE contează — odată ce tu (proprietarul)
// verifici și marchezi rezolvat=true în bază, acelea nu mai intră la
// numărătoare data viitoare. Ăsta e mecanismul de "resetare", fără să mai
// construim ceva separat pentru asta.
async function getReportCounts(slug) {
  const empty = { inchisDefinitiv: 0, programGresit: 0 };
  if (!dbPool) return empty;
  try {
    const { rows } = await dbPool.query(
      `SELECT motiv, COUNT(*)::int AS cnt FROM location_reports WHERE slug = $1 AND rezolvat = false GROUP BY motiv`,
      [slug]
    );
    const counts = { ...empty };
    rows.forEach((r) => {
      if (r.motiv === "inchis_definitiv") counts.inchisDefinitiv = r.cnt;
      if (r.motiv === "program_gresit") counts.programGresit = r.cnt;
    });
    return counts;
  } catch (err) {
    console.error("getReportCounts a eșuat:", err.message);
    return empty;
  }
}

function isBotRequest(userAgent) {
  return Boolean(userAgent) && BOT_USER_AGENT_PATTERN.test(userAgent);
}

function comingSoonTextFor(lang) {
  return COMING_SOON_TEXTS[lang] || COMING_SOON_TEXTS.uk;
}

function itineraryLabelsFor(lang) {
  return ITINERARY_LABELS[lang] || ITINERARY_LABELS.uk;
}

function buildBeachPartnerCarouselHtml(nonce) {
  if (!BEACH_PARTNER_OFFERS.length) return { html: "", scriptHtml: "" };
  const buttonId = "beachPartnerCarousel";
  const first = BEACH_PARTNER_OFFERS[0];
  const html = first.banner
    ? `<a href="${escapeHtml(first.url)}" target="_blank" rel="noopener sponsored" class="affiliate-banner-link" id="${buttonId}"><img src="${escapeHtml(first.banner)}" alt="${escapeHtml(first.alt || first.name || "")}" loading="lazy"></a>`
    : `<a href="${escapeHtml(first.url)}" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-generic affiliate-btn-cta" id="${buttonId}"><span class="affiliate-cta-text">🛍️ Ofertă recomandată: <span>${escapeHtml(first.name)}</span></span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>`;
  const scriptHtml = BEACH_PARTNER_OFFERS.length > 1
    ? buildGenericPartnerCarouselScript(buttonId, BEACH_PARTNER_OFFERS, nonce)
    : "";
  return { html, scriptHtml };
}


function isRealRomanianHolidayToday(utcOffsetMinutes) {
  const now = new Date();
  const shifted = new Date(now.getTime() + (utcOffsetMinutes || 120) * 60000); // 120 = ora României, dacă lipsește offset-ul
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return ROMANIAN_LEGAL_HOLIDAYS_2026.includes(`${y}-${m}-${d}`);
}


function glovoLinkFor() {
  return linkGlovoAffiliate || "https://glovoapp.com/";
}

function bringoLinkFor() {
  return linkBringoAffiliate || "https://www.bringo.ro/";
}

function bookingSearchLinkFor(place) {
  const base = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(place)}`;
  return BOOKING_AFFILIATE_ID ? `${base}&aid=${encodeURIComponent(BOOKING_AFFILIATE_ID)}` : base;
}

function getExtraLabels(lang) {
  return EXTRA_LABELS[lang] || EXTRA_LABELS.uk;
}

function geoBtnLabelsFor(lang) {
  return GEO_BTN_LABELS[lang] || GEO_BTN_LABELS.uk;
}

function attractionFooterTextFor(lang, name) {
  const fn = ATTRACTION_FOOTER_TEMPLATES[lang] || ATTRACTION_FOOTER_TEMPLATES.uk;
  return fn(name);
}

function noLiveDataTextFor(lang, url) {
  const fn = NO_LIVE_DATA_TEXT[lang] || NO_LIVE_DATA_TEXT.uk;
  return fn(url);
}

function liveGoogleLabelFor(lang) {
  return LIVE_GOOGLE_LABEL[lang] || LIVE_GOOGLE_LABEL.uk;
}


function bookingPlanningLabelsFor(lang, isBeach) {
  const e = getExtraLabels(lang);
  const isRo = lang === "ro";
  const hintTemplates = isBeach ? BOOKING_HINT_TEMPLATES_BEACH : BOOKING_HINT_TEMPLATES;
  return {
    title: e.bpTitle,
    hint: (name) => (hintTemplates[lang] || hintTemplates.uk)(name),
    ticket: e.bpTicket,
    stays: e.bpStays,
    restaurant: e.bpRestaurant,
    parkingNearby: e.bpParkingNearby,
  };
}

function reportIssueLabelsFor(lang) {
  const e = getExtraLabels(lang);
  const isRo = lang === "ro";
  const isEn = lang === "uk";
  return {
    btn: e.riBtn,
    q1: (name) => (isRo ? `Este ${name} deschis chiar acum?` : isEn ? `Is ${name} open right now?` : `${name}?`),
    yes: e.riYes,
    no: e.riNo,
    q2: e.riQ2,
    thanksOpen: e.riThanksOpen,
    thanksReport: e.riThanksReport,
    error: e.riError,
    alreadyReported: e.riAlreadyReported,
  };
}

function closedPermanentlyLabelsFor(lang) {
  const e = getExtraLabels(lang);
  return { title: e.cpTitle, text: e.cpText };
}

function reportedWrongTextFor(lang) {
  return getExtraLabels(lang).reportedWrong;
}

function howToGetThereLabelsFor(lang) {
  const e = getExtraLabels(lang);
  return { btn: e.hgtBtn, waze: e.hgtWaze, optionA: e.hgtOptionA, optionB: e.hgtOptionB };
}

function contextualWidgetLabelsFor(lang) {
  const e = getExtraLabels(lang);
  return { ticketOpen: e.cwTicketOpen, closedAlert: e.cwClosedAlert, booking: e.cwBooking, restaurants: e.cwRestaurants, glovo: e.cwGlovo, bringo: e.cwBringo };
}

function travelGuidesBoxLabelsFor(lang) {
  return getExtraLabels(lang);
}


// 3 butoane de planificare — cazări + parcare, mereu vizibile pe pagina
// unui obiectiv turistic (nu doar când e închis, spre deosebire de widget-ul
// contextual de mai sus). NOTĂ ONESTĂ: butonul de "hoteluri cu parcare" NU
// filtrează cu adevărat după parcare — Booking.com nu are un parametru
// public, documentat, de URL pentru asta; face aceeași căutare ca primul
// buton. Dacă găsești tu parametrul real de filtrare, spune-mi și îl adaug.
// Pliabil, ca "Cum ajung acolo?" — buton + panou, 4 opțiuni colorate
// distinct (biletul mutat aici, de sub widget-ul contextual — vezi cererea
// utilizatorului), niciodată legate de status (le vrei indiferent dacă
// locul e deschis chiar acum sau nu — planifici dinainte). Mesajul
// descriptiv de sub buton rămâne mereu în HTML (bun pentru Google — text
// real, nu doar o etichetă de buton), doar vizual dispare/apare, sincron
// cu deschiderea panoului.
function buildBookingPlanningButtonsHtml({ name, city, labels, countryCode, lang, lat, lng, hideTicket, accessDifficulty, isBeach }) {
  const t = labels || BOOKING_PLANNING_LABELS_RO;
  const parkingQuery = city || name;
  // hideTicket — obiective cu acces liber (poduri, lacuri, munți, șosele)
  // nu au bilet de cumpărat, nimeni nu "rezervă" o vizită la un pod. La
  // plaje (isBeach), biletul dispare complet — cerut explicit — tururile
  // cu barcă (boat-only) au mutat în "Cum ajung acolo" (buildHowToGetThereHtml).
  const ticketHtml = linkBileteTurism && !hideTicket && !isBeach
    ? `<a href="${escapeHtml(ticketUrlFor(name))}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">${escapeHtml(t.ticket)}</a>`
    : "";
  // Restaurant + parcare — bug real, găsit prin testare directă (semnalat de
  // utilizator): butonul de "parcare" folosea din greșeală bookingSearchLinkFor
  // (căutare de HOTELURI pe Booking.com, aceeași funcție ca la cazare), nu
  // parkviaLinkFor (funcția corectă, deja existentă, dar nefolosită aici).
  // Reparat mai jos — DAR, la cererea explicită, ambele butoane rămân
  // OPRITE (înlocuite cu mesaj "urmează în curând") cât timp
  // TRAVEL_GUIDES_MONETIZATION_READY e false, exact ca la restul
  // ghidurilor de călătorie de pe site (vezi comentariul de la
  // TRAVEL_GUIDES_MONETIZATION_READY, mai sus în fișier) — nu are sens să
  // arătăm butoane care nu duc la nimic util/monetizat pentru vizitator.
  // Restaurant și parcare — DECUPLATE una de alta: restaurantul rămâne
  // "urmează în curând" peste tot (TheFork/OpenTable neconfigurate încă),
  // dar parcarea devine link REAL, activ, DOAR pe paginile din UK — decizie
  // explicită ("il punem doar la UK ca in rest nu functioneaza"), nu
  // presupunere. Vezi parkingLinkFor mai sus pentru logica exactă.
  // La plaje (isBeach) — cerut explicit, rămâne DOAR cazarea (booking) în
  // acest panou; restaurant/parcare dispar complet (mutate conceptual spre
  // "Cum ajung acolo" -> Discover Cars, mai relevant la o plajă).
  const realParkingLink = parkingLinkFor(lat, lng, countryCode);
  const restaurantHtml = isBeach ? "" : TRAVEL_GUIDES_MONETIZATION_READY
    ? `<a href="${escapeHtml(restaurantLinkFor(countryCode || "ro", parkingQuery))}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking">${escapeHtml(t.restaurant)}</a>`
    : `<p class="plan-visit-hint">${escapeHtml(comingSoonTextFor(lang || "ro"))}</p>`;
  const parkingHtml = isBeach ? "" : realParkingLink
    ? `<a href="${escapeHtml(realParkingLink)}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">${escapeHtml(t.parkingNearby)}</a>`
    : `<p class="plan-visit-hint">${escapeHtml(comingSoonTextFor(lang || "ro"))}</p>`;
  return `
  <div class="plan-visit-block">
    <button type="button" class="plan-visit-btn" id="planVisitBtn">${escapeHtml(t.title)}</button>
    <p class="plan-visit-hint" id="planVisitHint">${escapeHtml(t.hint(name))}</p>
    <div class="plan-visit-panel" id="planVisitPanel" hidden>
      ${ticketHtml}
      <a href="${escapeHtml(bookingSearchLinkFor(name))}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-booking">${escapeHtml(t.stays)}</a>
      ${restaurantHtml}
      ${parkingHtml}
    </div>
  </div>`;
}


function buildPlanVisitScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var btn = document.getElementById("planVisitBtn");
  var panel = document.getElementById("planVisitPanel");
  var hint = document.getElementById("planVisitHint");
  if (!btn || !panel) return;
  btn.addEventListener("click", function(){
    panel.hidden = !panel.hidden;
    if (hint) hint.hidden = !panel.hidden;
  });
})();
</script>`;
}


// fără API de restaurante propriu, cea mai onestă soluție e o căutare reală
// Google Maps — arată restaurante CHIAR deschise acum, nu o listă fixă,
// posibil învechită, pe care ar trebui s-o întreținem noi manual
function restaurantsOpenNowLinkFor(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("restaurante deschise acum " + place)}`;
}


// link Waze real, funcțional — deschide navigația direct spre căutarea
// textului dat (nu avem coordonate GPS exacte per magazin/obiectiv, doar
// nume + oraș, dar Waze rezolvă bine căutări text)
function wazeLinkFor(place) {
  return `https://waze.com/ul?q=${encodeURIComponent(place)}&navigate=yes`;
}


// buton "Mergi acum" — verde-pulsant când locația e deschisă, roșu când e
// închisă; sincronizat cu #statusCard prin buildContextualWidgetScript
// (extins mai jos, ca să nu mai avem un al doilea MutationObserver separat)
// Adresă + telefon — afișate DOAR când Google chiar le are completate (nu
// inventăm, nu punem "N/A"). Categorii deja plătite (Basic pentru adresă,
// Contact pentru telefon) — cost zero în plus, doar cerem câmpurile.
// Construiește HTML-ul principal al paginii de magazin (cardul de status +
// tot ce urmează) — extrasă separat, ca funcție reutilizabilă, EXACT ca să
// nu duplicăm aceeași logică în două locuri: o dată la randarea inițială a
// paginii (fallback, mereu instant) și o dată la cererea separată, de pe
// client, care aduce statusul live (dacă există) — cerut explicit, ca să
// eliminăm întârzierea reală, de câteva secunde, cauzată de așteptarea
// blocantă a răspunsului Google la încărcarea inițială a paginii.
function buildStoreMainHtml({ live, magazinDisplay, locatieSuffix, orasDisplay, orasSlug, canonicalSlug, branchAddressHtml, nonstopHintHtml, temuButtonHtml, affiliateButtonHtml, store }) {
  if (live && live.isOpenNow !== null) {
    const specialBanner = live.isSpecialDay && isRealRomanianHolidayToday(live.utcOffsetMinutes)
      ? `<div class="geo-country-highlight">📅 Azi e sărbătoare legală — verifică programul de mai jos, actualizat live.</div>`
      : "";
    const liveWeeklyHtml = live.weeklyScheduleText.length
      ? `<div class="holiday-card">${live.weeklyScheduleText.map((line) => `<div class="holiday-row"><span class="holiday-label">${escapeHtml(line)}</span></div>`).join("")}</div>`
      : `<div class="holiday-card"><div class="holiday-row"><span class="holiday-label">Program indisponibil momentan de la Google.</span></div></div>`;

    return `
      <div class="status-card ${live.isOpenNow ? "is-open" : "is-closed"}" id="statusCard">
        <div class="store-name">${escapeHtml(magazinDisplay)}${escapeHtml(locatieSuffix)} ${escapeHtml(orasDisplay)}</div>
        <div class="status-text">${live.isOpenNow ? "DESCHIS ACUM" : "ÎNCHIS ACUM"}</div>
        <div class="status-sub">Date live, direct de la Google · actualizate la fiecare 12 ore</div>
        <div class="status-badge"><span class="dotw"></span><span id="statusBadge">Azi</span></div>
      </div>
      ${contactInfoHtml(live)}
      ${branchAddressHtml}
      ${nonstopHintHtml}
      ${buildHowToGetThereHtml(HOW_TO_GET_THERE_LABELS_RO, `${magazinDisplay}${locatieSuffix} ${orasDisplay}`, undefined, false)}
      ${buildReportIssueHtml({ slug: `${orasSlug}/${canonicalSlug}`, name: `${magazinDisplay}${locatieSuffix}`, oras: orasDisplay })}
      ${specialBanner}
      ${buildContextualWidgetHtml({ type: "store", name: magazinDisplay, orasDisplay })}

      ${temuButtonHtml}
      ${affiliateButtonHtml}

      <h2 class="section-title"><span class="bar"></span>Program săptămânal (live, de la Google)</h2>
      ${liveWeeklyHtml}
      `;
  }
  return `
      <div class="status-card" id="statusCard">
        <div class="store-name">${escapeHtml(magazinDisplay)}${escapeHtml(locatieSuffix)} ${escapeHtml(orasDisplay)}</div>
        <div class="status-text">—</div>
        <div class="status-sub">Se calculează programul...</div>
        <div class="status-badge"><span class="dotw"></span><span id="statusBadge">Azi</span></div>
        <div class="closing-soon-bar" id="closingSoonBar" style="display:none"><div class="closing-soon-fill" id="closingSoonFill"></div></div>
      </div>
      ${branchAddressHtml}
      ${nonstopHintHtml}
      ${buildHowToGetThereHtml(HOW_TO_GET_THERE_LABELS_RO, `${magazinDisplay}${locatieSuffix} ${orasDisplay}`, undefined, false)}
      ${buildReportIssueHtml({ slug: `${orasSlug}/${canonicalSlug}`, name: `${magazinDisplay}${locatieSuffix}`, oras: orasDisplay })}
      ${buildContextualWidgetHtml({ type: "store", name: magazinDisplay, orasDisplay })}

      ${temuButtonHtml}
      ${affiliateButtonHtml}

      <h2 class="section-title"><span class="bar"></span>Program săptămânal</h2>
      <div class="schedule-card"><table><thead><tr><th>Zi</th><th style="text-align:right">Interval orar</th></tr></thead>
      <tbody>${renderWeekTableRows(store.weekly)}</tbody></table></div>

      <h2 class="section-title"><span class="bar"></span>Program de sărbători</h2>
      <div class="holiday-card">${renderHolidayRows(store.holidays)}</div>
    `;
}


function contactInfoHtml(live) {
  if (!live.formattedAddress && !live.formattedPhoneNumber) return "";
  const addressHtml = live.formattedAddress
    ? `<div class="contact-info-row">📍 ${escapeHtml(live.formattedAddress)}</div>`
    : "";
  const phoneHtml = live.formattedPhoneNumber
    ? `<div class="contact-info-row">📞 <a href="tel:${escapeHtml(live.formattedPhoneNumber.replace(/\s+/g, ""))}">${escapeHtml(live.formattedPhoneNumber)}</a></div>`
    : "";
  return `<div class="contact-info-block">${addressHtml}${phoneHtml}</div>`;
}

function buildLocalBusinessSchema({ name, weekly, live }) {
  if (!weekly && !live) return "";
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
  };
  const addr = live && live.formattedAddress;
  if (addr) {
    schema.address = { "@type": "PostalAddress", streetAddress: addr };
  }
  if (live && Number.isFinite(live.lat) && Number.isFinite(live.lng)) {
    schema.geo = { "@type": "GeoCoordinates", latitude: live.lat, longitude: live.lng };
  }
  if (live && live.formattedPhoneNumber) {
    schema.telephone = live.formattedPhoneNumber;
  }
  // programul STANDARD, verificat (nu cel live-parsat din text, ca să nu
  // riscăm o structurare greșită) — deja etichetat "orientativ" în pagină
  if (weekly && weekly.some((w) => w)) {
    const grouped = {};
    weekly.forEach((w, i) => {
      if (!w) return;
      const key = `${w.open}-${w.close}`;
      if (!grouped[key]) grouped[key] = { open: w.open, close: w.close, days: [] };
      grouped[key].days.push(SCHEMA_DAY_NAMES[i]);
    });
    schema.openingHoursSpecification = Object.values(grouped).map((g) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: g.days,
      opens: g.open,
      closes: g.close,
    }));
  }
  return `<script type="application/ld+json">${safeJson(schema)}</script>`;
}

function buildCityFaqHtml({ orasDisplay, lang }) {
  const texts = CITY_FAQ_TEXTS[lang] || CITY_FAQ_TEXTS.uk;
  const faqs = [
    { q: texts.q1(orasDisplay), a: texts.a1 },
    { q: texts.q2, a: texts.a2 },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const visibleHtml = `
  <h2 class="section-title"><span class="bar"></span>${escapeHtml(texts.title)}</h2>
  <div class="holiday-card">${faqs.map((f) => `<details class="faq-item"><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`).join("")}</div>
  <script type="application/ld+json">${safeJson(schema)}</script>`;

  return visibleHtml;
}


// TouristAttraction Schema — pentru obiective (castele, muzee, saline etc.),
// tip mai potrivit decât LocalBusiness (care presupune "afacere", nu un loc
// de vizitat). Adresă/coordonate DOAR când avem date live reale — la fel ca
// la magazine, nu inventăm niciodată.
function buildTouristAttractionSchema({ name, officialUrl, live }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name,
  };
  if (officialUrl) schema.url = officialUrl;
  if (live && live.formattedAddress) {
    schema.address = { "@type": "PostalAddress", streetAddress: live.formattedAddress };
  }
  if (live && Number.isFinite(live.lat) && Number.isFinite(live.lng)) {
    schema.geo = { "@type": "GeoCoordinates", latitude: live.lat, longitude: live.lng };
  }
  return `<script type="application/ld+json">${safeJson(schema)}</script>`;
}


// Buton comunitar — flux în 2 pași (Este deschis? Da/Nu -> dacă Nu, Închis
// definitiv? Da/Nu), fără cont, fără moderare automată la trimitere — doar
// captăm datele corect. Agregarea (3 confirmări = schimbare de status
// afișat) se întâmplă separat, la citire, în getReportCounts().
function buildReportIssueHtml({ slug, name, oras, labels }) {
  const t = labels || REPORT_ISSUE_LABELS_RO;
  return `
  <div class="report-issue-block">
    <button type="button" class="report-issue-btn" id="reportIssueBtn" data-slug="${escapeHtml(slug)}" data-name="${escapeHtml(name)}" data-oras="${escapeHtml(oras || "")}">${escapeHtml(t.btn)}</button>
    <div class="report-issue-panel" id="reportIssuePanel" hidden>
      <div class="report-step" id="reportStep1">
        <p class="report-issue-title">${escapeHtml(t.q1(name))}</p>
        <div class="report-yn-row">
          <button type="button" class="report-yn-btn" id="reportQ1Yes">${escapeHtml(t.yes)}</button>
          <button type="button" class="report-yn-btn" id="reportQ1No">${escapeHtml(t.no)}</button>
        </div>
      </div>
      <div class="report-step" id="reportStep2" hidden>
        <p class="report-issue-title">${escapeHtml(t.q2)}</p>
        <div class="report-yn-row">
          <button type="button" class="report-yn-btn" id="reportQ2Yes">${escapeHtml(t.yes)}</button>
          <button type="button" class="report-yn-btn" id="reportQ2No">${escapeHtml(t.no)}</button>
        </div>
      </div>
      <p class="report-issue-msg" id="reportIssueMsg" hidden></p>
    </div>
  </div>`;
}


function buildReportIssueScript(nonce, labels) {
  const t = labels || REPORT_ISSUE_LABELS_RO;
  return `
<script nonce="${nonce}">
(function(){
  var btn = document.getElementById("reportIssueBtn");
  var panel = document.getElementById("reportIssuePanel");
  if (!btn || !panel) return;
  var step1 = document.getElementById("reportStep1");
  var step2 = document.getElementById("reportStep2");
  var msg = document.getElementById("reportIssueMsg");
  var slug = btn.getAttribute("data-slug");
  var storageKey = "reported_" + slug;

  // deja raportat din ACEST browser, cândva — nu mai deschidem fluxul de
  // întrebări, arătăm direct mulțumirea (ocolit ușor din incognito, dar nu
  // are rost să enervăm un utilizator normal care a raportat deja o dată)
  try {
    if (localStorage.getItem(storageKey)) {
      btn.textContent = ${safeJson(t.alreadyReported)};
      btn.disabled = true;
      return;
    }
  } catch(e){}

  btn.addEventListener("click", function(){ panel.hidden = !panel.hidden; });

  function send(motiv, thanksText){
    fetch("/api/report-issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: slug,
        numeLocatie: btn.getAttribute("data-name"),
        oras: btn.getAttribute("data-oras"),
        motiv: motiv,
      }),
    })
      .then(function(r){ if (!r.ok) throw new Error("bad status"); return r.json(); })
      .then(function(data){
        step1.hidden = true;
        step2.hidden = true;
        msg.textContent = (data && data.alreadyReported) ? ${safeJson(t.alreadyReported)} : thanksText;
        msg.hidden = false;
        msg.className = "report-issue-msg is-success";
        try { localStorage.setItem(storageKey, "1"); } catch(e){}
      })
      .catch(function(){
        msg.textContent = ${safeJson(t.error)};
        msg.hidden = false;
        msg.className = "report-issue-msg is-error";
      });
  }

  document.getElementById("reportQ1Yes").addEventListener("click", function(){
    send("confirmat_deschis", ${safeJson(t.thanksOpen)});
  });
  document.getElementById("reportQ1No").addEventListener("click", function(){
    step1.hidden = true;
    step2.hidden = false;
  });
  document.getElementById("reportQ2Yes").addEventListener("click", function(){
    send("inchis_definitiv", ${safeJson(t.thanksReport)});
  });
  document.getElementById("reportQ2No").addEventListener("click", function(){
    send("program_gresit", ${safeJson(t.thanksReport)});
  });
})();
</script>`;
}


// Suprascrie complet cardul de status obișnuit — apare DOAR când pragul de
// 3 confirmări independente e atins (vezi REPORT_THRESHOLD). Onest despre
// sursă chiar în text: "pe baza confirmărilor utilizatorilor", nu pretinde
// că vine de la Google.
function renderClosedPermanentlyHtml(name, labels) {
  const t = labels || CLOSED_PERMANENTLY_LABELS_RO;
  return `
  <div class="closed-permanently-card" id="statusCard">
    <h2>${escapeHtml(t.title)}</h2>
    <p><strong>${escapeHtml(name)}</strong></p>
    <p>${escapeHtml(t.text)}</p>
  </div>`;
}





function reportedWrongBannerHtml(text) {
  return `<div class="reported-wrong-banner">${escapeHtml(text || REPORTED_WRONG_LABELS_RO)}</div>`;
}


function omioLinkFor() {
  return linkOmioAffiliate || "https://www.omio.com/";
}


function restaurantLinkFor(countryCode, place) {
  const platform = RESTAURANT_PLATFORM_BY_COUNTRY[countryCode] || "culinary";
  if (platform === "thefork") {
    return linkTheForkAffiliate || `https://www.thefork.com/search?q=${encodeURIComponent(place)}`;
  }
  if (platform === "opentable") {
    return linkOpenTableAffiliate || `https://www.opentable.com/s?term=${encodeURIComponent(place)}`;
  }
  // restul Europei (inclusiv România) — TheFork/OpenTable nu acoperă sigur
  // zona, oferim tururi culinare prin GetYourGuide, deja plătit ca afiliat
  return `https://www.getyourguide.com/s/?q=${encodeURIComponent("food tour " + place)}&partner_id=${GYG_PARTNER_ID}`;
}

function parkingLinkFor(lat, lng, countryCode) {
  // UK, EXCLUSIV — decizie explicită a utilizatorului, nu presupunere.
  if (countryCode !== "uk") return null;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  // Interval implicit — "de azi până mâine" — calculat la fiecare cerere
  // (nu un timestamp fix, învechit), din lipsă de altă informație despre
  // datele reale de vizită ale utilizatorului. Utilizatorul poate oricum
  // schimba datele direct pe site-ul YourParkingSpace, după ce ajunge acolo.
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const isoNoMs = (d) => d.toISOString().replace(/\.\d{3}Z$/, "+00:00");
  const destination = `https://www.yourparkingspace.co.uk/search?rental=long&lat=${lat}&lng=${lng}&start=${encodeURIComponent(isoNoMs(now))}&end=${encodeURIComponent(isoNoMs(tomorrow))}&season_plan=mon-sun`;
  return `https://www.awin1.com/cread.php?awinmid=${encodeURIComponent(AWIN_YPS_MERCHANT_ID)}&awinaffid=${encodeURIComponent(AWIN_YPS_AFFILIATE_ID)}&campaign=${encodeURIComponent("Your Parking Space")}&ued=${encodeURIComponent(destination)}`;
}

function carRentalLinkFor(destinationCity) {
  if (destinationCity && DISCOVERCARS_CITY_LINKS[destinationCity]) {
    return DISCOVERCARS_CITY_LINKS[destinationCity];
  }
  if (!DISCOVERCARS_AFFILIATE_ID) return null;
  return `https://www.discovercars.com/?a_aid=${encodeURIComponent(DISCOVERCARS_AFFILIATE_ID)}`;
}


// Buton + panou cu 2 opțiuni — sub programul zilei, pe pagina de magazin
// SAU obiectiv. Nu redirectăm direct (ar alege unul pentru utilizator) —
// arătăm ambele opțiuni, îl lăsăm pe el să aleagă.
function buildHowToGetThereHtml(labels, place, beachOptions, isIntl) {
  const t = labels || HOW_TO_GET_THERE_LABELS_RO;
  // Waze e primul, dar ascuns implicit — apare doar când statusul (deschis/
  // închis) e cunoscut cu adevărat (vezi sync() din buildContextualWidgetScript,
  // care îl caută pe id, indiferent unde se află pe pagină)
  const wazeHtml = place
    ? `<a id="goNowBtn" class="go-now-btn how-to-get-there-option" href="${escapeHtml(wazeLinkFor(place))}" target="_blank" rel="noopener" hidden>${escapeHtml(t.waze)}</a>`
    : "";
  // Plaje — cerut explicit: "Cum ajung acolo" arată Discover Cars + Waze
  // (nu opțiunile generice de taxi/tren), sau tur cu barcă în loc de
  // Discover Cars, dacă plaja e accesibilă DOAR pe mare (boat-only).
  if (beachOptions && beachOptions.isBeach) {
    const lang = beachOptions.lang || "ro";
    const beachT = beachTagLabelsFor(lang);
    const accessOptionHtml = beachOptions.accessDifficulty === "boat-only"
      ? `<a href="${escapeHtml(ticketUrlFor(beachOptions.name))}" target="_blank" rel="noopener sponsored" class="how-to-get-there-option">${escapeHtml(boatTourLabelFor(lang))} →</a>`
      : (beachOptions.city ? `<a href="${escapeHtml(carRentalLinkFor(beachOptions.city))}" target="_blank" rel="noopener sponsored" class="how-to-get-there-option">${escapeHtml(beachT.access_car || "🚗")} Discover Cars →</a>` : "");
    // Bug real, găsit prin testare: wazeHtml (de mai sus) rămâne mereu
    // "hidden" — logica lui de afișare depinde de statusul deschis/închis
    // (isOpen/isClosed), pe care plajele NU-l mai au (eliminat intenționat,
    // vezi decizia de a nu mai arăta program generic la plaje). Aici,
    // separat, un link Waze propriu, ÎNTOTDEAUNA vizibil — nu depinde de
    // status, ID diferit (nu se ciocnește cu goNowBtn).
    const beachWazeHtml = place
      ? `<a class="how-to-get-there-option" href="${escapeHtml(wazeLinkFor(place))}" target="_blank" rel="noopener">🧭 Waze →</a>`
      : "";
    return `
  <div class="how-to-get-there-block">
    <button type="button" class="how-to-get-there-btn" id="howToGetThereBtn">${escapeHtml(t.btn)}</button>
    <div class="how-to-get-there-panel" id="howToGetTherePanel" hidden>
      ${accessOptionHtml}
      ${beachWazeHtml}
    </div>
  </div>`;
  }
  // Taxi/Transfer (GetTransfer) — link real, activ, verificat direct pe
  // propriul lui link (nu pe comutatorul general TRAVEL_GUIDES_MONETIZATION_READY,
  // care ar porni și Omio — încă necompletat — trimițând vizitatori spre
  // omio.com public, nemonetizat, exact ce comentariul de mai sus spune să
  // evităm). Decuplat, la fel cum s-a făcut deja pentru parcare (vezi mai
  // sus în fișier) — fiecare buton pornește individual, imediat ce are link
  // real, fără să aștepte restul.
  // Taxi/Transfer — widget TravelPayouts (modal-reveal), nu mai e link simplu
  // GetTransfer (confirmat mort/greșit de utilizator) — reutilizează exact
  // mecanismul universal de widget-reveal, deja folosit la zboruri peste tot
  // pe site (vezi buildWidgetRevealScript mai sus).
  const getTransferHtml = `<button type="button" class="how-to-get-there-option widget-reveal-btn" data-widget-target="transferWidgetCard" data-widget-src="${escapeHtml(transferWidgetSrcFor(isIntl))}">${escapeHtml(t.optionA)}</button>`;
  const omioHtml = linkOmioAffiliate
    ? `<a href="${escapeHtml(omioLinkFor())}" target="_blank" rel="noopener sponsored" class="how-to-get-there-option how-to-get-there-option-alt">${escapeHtml(t.optionB)}</a>`
    : "";
  const affiliateOptionsHtml = `${getTransferHtml}${omioHtml}`;
  return `
  <div class="how-to-get-there-block">
    <button type="button" class="how-to-get-there-btn" id="howToGetThereBtn">${escapeHtml(t.btn)}</button>
    <div class="how-to-get-there-panel" id="howToGetTherePanel" hidden>
      ${wazeHtml}
      ${affiliateOptionsHtml}
    </div>
    <div id="transferWidgetCard" class="flight-widget-card" style="display:none"></div>
  </div>`;
}


function buildHowToGetThereScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var btn = document.getElementById("howToGetThereBtn");
  var panel = document.getElementById("howToGetTherePanel");
  if (!btn || !panel) return;
  btn.addEventListener("click", function(){ panel.hidden = !panel.hidden; });
})();
</script>`;
}



// Insigne live, pe pagini de listă (oraș) — verde-pulsant dacă magazinul e
// deschis ACUM, roșu simplu dacă e închis. Nu folosim date live de la
// Google aici (ar însemna zeci de cereri pe o singură încărcare de pagină,
// scump și lent) — calculăm din orele standard, la fel ca varianta de
// rezervă folosită deja pe paginile individuale de magazin. Suficient de
// precis pentru o listă, mai ales pentru non-stop, unde răspunsul e mereu
// "deschis", indiferent de oră.
// extrage orarul relevant dintr-o configurație de brand, pentru insigna
// live — magazine și cinematografe au orar direct; mall-urile au 2 zone
// separate (shopping + hypermarket), folosim zona shopping (orarul general
// al mall-ului, cel mai relevant pentru "e deschis mall-ul?"); orice alt
// tip necunoscut => null, sărim insigna live pentru el, onest, fără să
// presupunem un orar
function extractStatusEntity(cfg) {
  if (cfg.type === "mall") return cfg.zones && cfg.zones.shopping ? { weekly: cfg.zones.shopping.weekly, holidays: cfg.zones.shopping.holidays || [] } : null;
  if (cfg.weekly) return { weekly: cfg.weekly, holidays: cfg.holidays || [] };
  return null;
}

function noResultsItineraryLabelsFor(lang) { return NO_RESULTS_ITINERARY_LABELS[lang] || NO_RESULTS_ITINERARY_LABELS.uk; }

function buildNoResultsItineraryPromoHtml(id, countryCode, lang) {
  const t = noResultsItineraryLabelsFor(lang);
  const href = itineraryHrefFor(countryCode, lang);
  return `<a href="${escapeHtml(href)}" id="${escapeHtml(id)}" class="itinerary-promo-card itinerary-promo-empty" style="display:none">
    <div class="itinerary-promo-title">${escapeHtml(t.text)}</div>
    <div class="itinerary-promo-cta">${escapeHtml(t.cta)}</div>
  </a>`;
}

function buildListStatusBadgeScript(nonce, statusDataset, noResultsElId, lang) {
  const AP = ARRIVAL_PLANNER_LABELS[lang] || ARRIVAL_PLANNER_LABELS.uk;
  return `
<script nonce="${nonce}">
(function(){
  var DATASET = ${safeJson(statusDataset)};
  var NO_RESULTS_EL_ID = ${safeJson(noResultsElId || "")};
  var AP = ${safeJson(AP)};
  // „Ce e deschis când ajung?” — când e setată, calculăm statusurile pentru
  // acel moment (cu sărbătorile incluse), nu pentru acum.
  var arrivalAt = null;
  var FAV_NAMES = (function(){ try { return JSON.parse(localStorage.getItem("oht_favorites_v1") || "[]").map(function(f){ return f && f.name; }); } catch (e) { return []; } })();
  var badges = document.querySelectorAll(".brand-badge[data-status-key]");
  if (!badges.length) return;

  function pad(n){ return String(n).padStart(2,"0"); }
  function toMinutes(hhmm){ var p = hhmm.split(":"); return (+p[0])*60 + (+p[1]); }
  function mmdd(d){ return pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
  function ymd(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }

  function isOpenNow(entity, now){
    // Status real, per locație, verificat întâi — dacă există (adăugat de
    // server, din cache), îl folosim direct, fără să mai calculăm nimic.
    // Bug real, semnalat direct: fără asta, insigna cădea mereu pe
    // programul GENERIC al brandului, identic pentru toate orașele,
    // ignorând programul real al locației (putea arăta roșu la un magazin
    // de fapt deschis).
    if (!arrivalAt && typeof entity.liveIsOpenNow === "boolean") return entity.liveIsOpenNow;
    var md = mmdd(now), full = ymd(now);
    var holiday = null;
    for (var i=0;i<entity.holidays.length;i++){
      var h = entity.holidays[i];
      if (h.date === md || h.date === full) { holiday = h; break; }
    }
    var hours = holiday ? holiday.hours : (function(){ var w = entity.weekly[now.getDay()]; return w ? [w.open, w.close] : null; })();
    if (!hours) return false;
    var nowMin = now.getHours()*60 + now.getMinutes();
    return nowMin >= toMinutes(hours[0]) && nowMin < toMinutes(hours[1]);
  }

  function syncAll(){
    var now = arrivalAt || new Date();
    var onlyOpen = arrivalAt ? true : (window.__storeListOpenOnlyToggle && window.__storeListOpenOnlyToggle.checked);
    var visibleCount = 0;
    badges.forEach(function(badge){
      var key = badge.getAttribute("data-status-key");
      var entity = DATASET[key];
      if (!entity) return;
      var open = isOpenNow(entity, now);
      badge.classList.toggle("status-open", open);
      badge.classList.toggle("status-closed", !open);
      // "Se închide în X minute" — cerut explicit, parte dintr-un tablou
      // live "ce e deschis lângă mine, chiar acum". Calculăm doar când
      // chiar e deschis ACUM (altfel n-are sens) și mai sunt sub 2 ore
      // până la închidere — dincolo de-atât, informația nu mai ajută pe
      // nimeni practic, doar aglomerează lista degeaba.
      var countdownEl = badge.parentNode && badge.parentNode.querySelector(".status-countdown");
      if (open) {
        var todayHours = (function(){
          var md = (now.getMonth()+1) + "-" + now.getDate();
          var full = now.getFullYear() + "-" + md;
          var holiday = null;
          for (var i=0;i<entity.holidays.length;i++){
            var h = entity.holidays[i];
            if (h.date === md || h.date === full) { holiday = h; break; }
          }
          return holiday ? holiday.hours : (function(){ var w = entity.weekly[now.getDay()]; return w ? [w.open, w.close] : null; })();
        })();
        var minutesLeft = todayHours ? (toMinutes(todayHours[1]) - (now.getHours()*60 + now.getMinutes())) : null;
        if (countdownEl) {
          if (!arrivalAt && minutesLeft !== null && minutesLeft > 0 && minutesLeft <= 120) {
            countdownEl.textContent = AP.left + minutesLeft + AP.min;
            countdownEl.style.display = "";
          } else {
            countdownEl.style.display = "none";
          }
        }
      } else if (countdownEl) {
        countdownEl.style.display = "none";
      }
      // filtrare pe listă — cerut explicit ("de ce doar pe hartă, nu și pe
      // prima pagină?") — ascunde rândul întreg din listă, nu doar insigna,
      // când comutatorul "doar deschise acum" e bifat.
      var li = badge.closest("li");
      var visible = !onlyOpen || open;
      if (li) li.style.display = visible ? "" : "none";
      if (visible) visibleCount++;
    });
    // Mesaj "nimic deschis acum" — cerut explicit: quando filtrul ajunge la
    // 0 rezultate (ex. seara târziu), arătăm o alternativă, spre itinerarul
    // AI, în loc să lăsăm lista pur și simplu goală.
    if (NO_RESULTS_EL_ID) {
      var noResultsEl = document.getElementById(NO_RESULTS_EL_ID);
      if (noResultsEl) noResultsEl.style.display = (onlyOpen && visibleCount === 0) ? "block" : "none";
    }
  }

  // „Se închid curând” — magazinele deschise acum care se închid în max. 60
  // de minute, favoritele primele. Doar pentru „acum” (nu la „când ajung”).
  function syncClosingSoon(){
    var strip = document.getElementById("closingSoonStrip");
    if (!strip) {
      var tg = document.getElementById("storeListOpenOnlyToggle");
      var anchorEl = document.querySelector(".arrival-planner") || (tg ? (tg.closest("label") || tg.parentNode) : null);
      if (!anchorEl || !anchorEl.parentNode) return;
      strip = document.createElement("div"); strip.id = "closingSoonStrip"; strip.className = "closing-soon"; strip.hidden = true;
      anchorEl.parentNode.insertBefore(strip, anchorEl.nextSibling);
    }
    if (arrivalAt) { strip.hidden = true; return; }
    var now = new Date(), items = [];
    badges.forEach(function(badge){
      var entity = DATASET[badge.getAttribute("data-status-key")];
      if (!entity || !badge.classList.contains("status-open")) return;
      var w = entity.weekly[now.getDay()];
      var md = mmdd(now), full = ymd(now), hours = w ? [w.open, w.close] : null;
      for (var i = 0; i < entity.holidays.length; i++) { var h = entity.holidays[i]; if (h.date === md || h.date === full) { hours = h.hours; break; } }
      if (!hours) return;
      var left = toMinutes(hours[1]) - (now.getHours() * 60 + now.getMinutes());
      if (left <= 0 || left > 60) return;
      var li = badge.closest("li"), a = li && li.querySelector("a");
      var name = a ? a.textContent.trim() : "";
      if (!name || items.some(function(x){ return x.name === name; })) return;
      items.push({ name: name, left: left, fav: FAV_NAMES.indexOf(name) !== -1 });
    });
    if (!items.length) { strip.hidden = true; return; }
    items.sort(function(a, b){ return (b.fav - a.fav) || (a.left - b.left); });
    strip.innerHTML = "";
    var title = document.createElement("strong"); title.textContent = AP.closingSoon + " ";
    strip.appendChild(title);
    strip.appendChild(document.createTextNode(items.slice(0, 5).map(function(x){ return (x.fav ? "⭐ " : "") + x.name + " (" + x.left + AP.min + ")"; }).join(" · ")));
    strip.hidden = false;
  }
  var _syncAll = syncAll;
  syncAll = function(){ _syncAll(); try { syncClosingSoon(); } catch (e) {} };

  syncAll();
  setInterval(syncAll, 60000); // suficient pentru o listă — nu are nevoie de precizie per-secundă

  // ---- UI „Ce e deschis când ajung?” (creat aici, lângă comutatorul existent) ----
  (function(){
    var anchor = document.getElementById("storeListOpenOnlyToggle");
    var host = anchor ? (anchor.closest("label") || anchor.parentNode) : null;
    if (!host || !host.parentNode) return;
    var box = document.createElement("div");
    box.className = "arrival-planner";
    box.innerHTML = '<button type="button" class="arrival-planner-btn"></button>' +
      '<div class="arrival-planner-panel" hidden><input type="date" class="ap-date"> <input type="time" class="ap-time" value="18:00"> ' +
      '<button type="button" class="ap-show"></button> <button type="button" class="ap-now"></button></div>' +
      '<div class="arrival-planner-info" hidden></div>';
    host.parentNode.insertBefore(box, host.nextSibling);
    var btn = box.querySelector(".arrival-planner-btn"), panel = box.querySelector(".arrival-planner-panel");
    var dIn = box.querySelector(".ap-date"), tIn = box.querySelector(".ap-time"), info = box.querySelector(".arrival-planner-info");
    btn.textContent = AP.btn; box.querySelector(".ap-show").textContent = AP.show; box.querySelector(".ap-now").textContent = AP.now;
    var today = new Date(); dIn.value = ymd(today); dIn.min = ymd(today);
    btn.addEventListener("click", function(){ panel.hidden = !panel.hidden; });
    function isHolidayDate(d){
      var md = mmdd(d), full = ymd(d);
      for (var k in DATASET) { var hs = DATASET[k].holidays || []; for (var i = 0; i < hs.length; i++) { if (hs[i].date === md || hs[i].date === full) return true; } }
      return false;
    }
    box.querySelector(".ap-show").addEventListener("click", function(){
      if (!dIn.value || !tIn.value) return;
      var p = dIn.value.split("-"), t = tIn.value.split(":");
      arrivalAt = new Date(+p[0], +p[1] - 1, +p[2], +t[0], +t[1]);
      var label = arrivalAt.toLocaleDateString(document.documentElement.lang || undefined, { weekday: "long", day: "numeric", month: "long" }) + ", " + tIn.value;
      info.textContent = AP.viewing + ": " + label + ". " + AP.onlyOpen + (isHolidayDate(arrivalAt) ? " " + AP.holiday : "");
      info.hidden = false;
      syncAll();
    });
    box.querySelector(".ap-now").addEventListener("click", function(){ arrivalAt = null; info.hidden = true; panel.hidden = true; syncAll(); });
  })();

  var STORAGE_KEY = "poa_open_only_mode_v1";
  var toggle = document.getElementById("storeListOpenOnlyToggle");
  if (toggle) {
    window.__storeListOpenOnlyToggle = toggle;
    // preia preferința salvată — cerut explicit: dacă a fost bifat pe
    // tab-ul de obiective, rămâne bifat și aici, fără să mai fie nevoie
    // să repete acțiunea
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") toggle.checked = true;
    } catch (e) {}
    toggle.addEventListener("change", function(){
      try { localStorage.setItem(STORAGE_KEY, toggle.checked ? "1" : "0"); } catch (e) {}
      syncAll();
    });
    syncAll();
  }
})();
</script>`;
}

function mallCinemaLabelsFor(lang) {
  return getExtraLabels(lang);
}

function buildContextualWidgetHtml({ type, name, orasDisplay, labels, countryCode }) {
  const t = labels || CONTEXTUAL_WIDGET_LABELS_RO;
  const place = orasDisplay || name;
  // Fără countryCode explicit (apelurile vechi, mereu de pe .ro) = România.
  const cc = countryCode || "ro";

  // biletul s-a mutat sub "Planifică vizita" (buildBookingPlanningButtonsHtml)
  // — nu mai are rost aici, condiționat de status; îl vrei indiferent
  const openContentHtml = "";

  // Bringo — bug real, semnalat direct: apărea la TOATE țările, nu doar
  // România (unde chiar operează). Glovo — la fel, apărea universal, deși
  // nu operează în toate țările de pe site (ex. Germania, UK, Franța nu au
  // Glovo deloc). Dacă țara nu are niciunul din cele două, widget-ul rămâne
  // fără butoane suplimentare aici (restul mesajului de "închis" tot apare).
  const glovoHtml = GLOVO_COUNTRIES.includes(cc)
    ? `<a href="${escapeHtml(glovoLinkFor())}" target="_blank" rel="noopener sponsored" class="contextual-widget-btn">${escapeHtml(t.glovo)}</a>`
    : "";
  const bringoHtml = cc === "ro"
    ? `<a href="${escapeHtml(bringoLinkFor())}" target="_blank" rel="noopener sponsored" class="contextual-widget-btn contextual-widget-btn-secondary">${escapeHtml(t.bringo)}</a>`
    : "";
  const closedContentHtml =
    type === "attraction"
      ? `<a href="${escapeHtml(bookingSearchLinkFor(place))}" target="_blank" rel="noopener sponsored" class="contextual-widget-btn">${escapeHtml(t.booking)}</a>
         <a href="${escapeHtml(restaurantsOpenNowLinkFor(place))}" target="_blank" rel="noopener" class="contextual-widget-btn contextual-widget-btn-secondary">${escapeHtml(t.restaurants)}</a>`
      : `${glovoHtml}${bringoHtml}`;

  return `
  <div id="contextualWidget" class="contextual-widget" hidden>
    <div class="contextual-widget-open"${openContentHtml ? "" : " hidden"}>
      ${openContentHtml}
    </div>
    <div class="contextual-widget-closed" hidden>
      <p class="contextual-widget-alert-text">${escapeHtml(t.closedAlert)}</p>
      ${closedContentHtml}
    </div>
  </div>`;
}


// urmărește #statusCard (deja actualizat corect, live sau la fiecare tick,
// în altă parte a paginii) și arată/ascunde panoul potrivit al widget-ului —
// funcționează identic indiferent dacă statusul vine din date live (Google,
// calculat o dată, la încărcare) sau din calculul local, care ticăie la
// fiecare secundă (paginile fără date live)
function buildContextualWidgetScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var card = document.getElementById("statusCard");
  if (!card) return;
  var widget = document.getElementById("contextualWidget");
  var openPanel = widget ? widget.querySelector(".contextual-widget-open") : null;
  var closedPanel = widget ? widget.querySelector(".contextual-widget-closed") : null;
  var goNowBtn = document.getElementById("goNowBtn");

  function sync(){
    var isOpen = card.classList.contains("is-open");
    var isClosed = card.classList.contains("is-closed");

    if (goNowBtn) {
      goNowBtn.hidden = !isOpen && !isClosed;
      goNowBtn.classList.toggle("is-open", isOpen);
      goNowBtn.classList.toggle("is-closed", isClosed);
    }

    if (!widget) return;
    if (!isOpen && !isClosed) { widget.hidden = true; return; }
    var hasOpenContent = openPanel && openPanel.textContent.trim();
    if (isOpen && !hasOpenContent) { widget.hidden = true; return; } // deschis, dar nimic de arătat (ex: magazin) — nu lăsăm caseta goală, vizibilă
    widget.hidden = false;
    widget.classList.toggle("is-open", isOpen);
    widget.classList.toggle("is-closed", isClosed);
    if (openPanel) openPanel.hidden = !isOpen || !hasOpenContent;
    if (closedPanel) closedPanel.hidden = !isClosed;
  }

  sync();
  var observer = new MutationObserver(sync);
  observer.observe(card, { attributes: true, attributeFilter: ["class"] });
})();
</script>`;
}

function b64url(buf) { return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }


// construiește link-ul de bilete pentru un obiectiv anume: dacă avem URL
// real în ATTRACTION_TICKET_URLS, îi atașăm parametrii de tracking; altfel
// cădem pe linkul general linkBileteTurism, exact comportamentul de dinainte
function ticketUrlFor(attractionName) {
  const realUrl = ATTRACTION_TICKET_URLS[attractionName];
  if (!realUrl) return linkBileteTurism;
  const separator = realUrl.includes("?") ? "&" : "?";
  return `${realUrl}${separator}partner_id=${GYG_PARTNER_ID}&utm_medium=affiliate&utm_source=partner_program`;
}


// Traduce numele obiectivelor turistice — cerut explicit, semnalat cu
// captură reală: multe obiective (peste 750, din România și cele 21 de
// țări cu liste mici) au fost introduse cu un cuvânt generic ROMÂNESC în
// față (ex. "Castelul Neuschwanstein", "Catedrala din Köln"), indiferent de
// limba paginii. Cele deja introduse cu denumiri locale corecte (Belgia,
// Spania, Italia, Franța, UK — ex. "Palazzo Ducale", "Château de
// Chambord") NU se ating — cuvântul de-acolo nu se potrivește niciunui
// prefix din listă, deci rămâne neschimbat.
//
// COMPROMIS ONEST, spus dinainte: nu reordonează cuvintele (engleza ar
// suna mai natural cu sufix, "Bran Castle", nu "Castle Bran") — dar
// reordonarea corectă ar necesita gestionarea conectorilor ("din", "de",
// "a", "ale"), mult mai complex. Rezultatul e clar mai bun decât română
// peste tot, chiar dacă nu perfect gramatical în toate limbile.
// Multe nume din date se construiesc ca "<Nume descriptiv> <Oraș>" (convenție
// folosită ca să putem deduce automat orașul unui obiectiv din numele lui —
// vezi mai jos). Când partea descriptivă e chiar numele orașului (ex: o
// plajă numită identic cu satul ei), rezultă un nume vizual dublat:
// "Plaja Afandou Afandou", "Castelul Mauterndorf Mauterndorf" etc. — găsit
// la 886 de obiective din date, în toate țările, nu doar Grecia. Reparăm
// STRICT la afișare (ultimul cuvânt == penultimul -> păstrăm o singură
// apariție); slug-ul și restul logicii (căutare Google, potriviri de nume)
// rămân pe numele original, neatins.
function dedupeTrailingCityName(name) {
  if (!name) return name;
  const words = name.split(" ");
  if (words.length < 2) return name;
  const last = words[words.length - 1];
  const secondLast = words[words.length - 2];
  if (last === secondLast) return words.slice(0, -1).join(" ");
  return name;
}

function recommendedLabelFor(lang) { return RECOMMENDED_LABELS[lang] || RECOMMENDED_LABELS.uk; }

function recommendedFirstLabelFor(lang) { return RECOMMENDED_FIRST_LABELS[lang] || RECOMMENDED_FIRST_LABELS.uk; }

function beachesMegaCategoryLabelFor(lang) { return BEACHES_MEGA_CATEGORY_LABELS[lang] || BEACHES_MEGA_CATEGORY_LABELS.uk; }

function discoverBeachLabelFor(lang) { return DISCOVER_BEACH_LABELS[lang] || DISCOVER_BEACH_LABELS.uk; }

function beachReviewLabelsFor(lang) { return BEACH_REVIEW_LABELS[lang] || BEACH_REVIEW_LABELS.uk; }

function beachContentLabelsFor(lang) {
  // Aceeași reparație ca la getBeachContentForLang: orice limbă în afară de
  // română cade pe etichetele în engleză, nu doar "uk" exact — altfel
  // titlurile secțiunilor rămâneau în română chiar și când conținutul
  // propriu-zis era corect tradus (bug real, semnalat direct, cu captură).
  return lang === "ro" ? BEACH_CONTENT_LABELS_RO : BEACH_CONTENT_LABELS_UK;
}

function buildBeachContentIntroHtml(content, lang) {
  if (!content) return "";
  const L = beachContentLabelsFor(lang);
  return `<div class="beach-content-block">
    <h3 class="beach-content-heading">${escapeHtml(L.scurt)}</h3>
    <p class="beach-content-text">${escapeHtml(content.scurt)}</p>
  </div>`;
}

function buildBeachContentEquipmentHtml(content, lang) {
  if (!content || !content.echipament || !content.echipament.length) return null; // null = cade pe placeholder-ul generic
  const L = beachContentLabelsFor(lang);
  const itemsHtml = content.echipament
    .map((it) => `<li><strong>${escapeHtml(it.titlu)}:</strong> ${escapeHtml(it.text)}</li>`)
    .join("");
  return `<div class="beach-content-block beach-content-equipment">
    <h3 class="beach-content-heading">${escapeHtml(L.echipament)}</h3>
    <ul class="beach-content-list">${itemsHtml}</ul>
  </div>`;
}

function buildBeachContentRestHtml(content, lang) {
  if (!content) return "";
  const L = beachContentLabelsFor(lang);
  const preturiHtml = content.preturi
    ? `<div class="beach-content-block">
        <h3 class="beach-content-heading">${escapeHtml(L.preturi)}</h3>
        <p class="beach-content-text">${escapeHtml(content.preturi)}</p>
      </div>`
    : "";
  const turistiHtml = content.turisti && content.turisti.length
    ? `<div class="beach-content-block">
        <h3 class="beach-content-heading">${escapeHtml(L.turisti)}</h3>
        <ul class="beach-content-list">${content.turisti.map((it) => `<li><strong>${escapeHtml(it.titlu)}:</strong> ${escapeHtml(it.text)}</li>`).join("")}</ul>
      </div>`
    : "";
  const tipsHtml = content.tips && content.tips.length
    ? `<div class="beach-content-block">
        <h3 class="beach-content-heading">${escapeHtml(L.tips)}</h3>
        <ul class="beach-content-list">${content.tips.map((it) => `<li><strong>${escapeHtml(it.titlu)}:</strong> ${escapeHtml(it.text)}</li>`).join("")}</ul>
      </div>`
    : "";
  const cumAjungiHtml = content.cumAjungi
    ? `<div class="beach-content-block">
        <h3 class="beach-content-heading">${escapeHtml(L.cumAjungi)}</h3>
        <p class="beach-content-text">${escapeHtml(content.cumAjungi)}</p>
      </div>`
    : "";
  return `${cumAjungiHtml}${preturiHtml}${turistiHtml}${tipsHtml}`;
}


function buildBeachVoteCentralizationHtml(slug, counts, lang) {
  const t = beachReviewLabelsFor(lang);
  const tagT = beachTagLabelsFor(lang);
  const cardsHtml = BEACH_ALL_TAGS
    .map((tag) => `<div class="beach-vote-card"><span class="bvc-label">${escapeHtml(tagT[tag] || tag)}</span><span class="bvc-count" data-count-tag="${escapeHtml(tag)}">${counts[tag] || 0}</span></div>`)
    .join("");
  const questionsHtml = BEACH_ALL_TAGS
    .map((tag) => `<div class="beach-review-q">
      <span class="beach-review-q-text">${escapeHtml(tagT[tag] || tag)}</span>
      <label><input type="radio" name="q_${escapeHtml(tag)}" value="yes"> ${escapeHtml(t.yes)}</label>
      <label><input type="radio" name="q_${escapeHtml(tag)}" value="no"> ${escapeHtml(t.no)}</label>
    </div>`)
    .join("");
  return `<div class="beach-vote-central" data-beach-tags-slug="${escapeHtml(slug)}">
    <h3 class="beach-vote-title">${escapeHtml(t.title)}</h3>
    <div class="beach-vote-grid">${cardsHtml}</div>
    <button type="button" class="beach-review-cta" id="beachReviewCta">${escapeHtml(t.cta)}</button>
    <form class="beach-review-form" id="beachReviewForm" hidden>
      ${questionsHtml}
      <button type="submit" class="beach-review-submit">${escapeHtml(t.submit)}</button>
      <p class="beach-review-thanks" id="beachReviewThanks" hidden>${escapeHtml(t.thanks)}</p>
    </form>
  </div>`;
}


function buildBeachVoteCentralizationScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var wrap = document.querySelector(".beach-vote-central");
  if (!wrap) return;
  var slug = wrap.getAttribute("data-beach-tags-slug");
  var ctaBtn = document.getElementById("beachReviewCta");
  var form = document.getElementById("beachReviewForm");
  var thanks = document.getElementById("beachReviewThanks");
  if (!ctaBtn || !form) return;

  ctaBtn.addEventListener("click", function(){
    form.hidden = false;
    ctaBtn.hidden = true;
    // cerut explicit — ascunde și grila de voturi (nu doar butonul),
    // "e foarte supărător vizual" să rămână amândouă vizibile deodată
    var grid = wrap.querySelector(".beach-vote-grid");
    var title = wrap.querySelector(".beach-vote-title");
    if (grid) grid.hidden = true;
    if (title) title.hidden = true;
  });

  form.addEventListener("submit", function(e){
    e.preventDefault();
    var yesTags = [];
    Array.prototype.slice.call(form.querySelectorAll('input[type="radio"]:checked')).forEach(function(input){
      if (input.value === "yes") yesTags.push(input.name.replace(/^q_/, ""));
    });
    var submitBtn = form.querySelector(".beach-review-submit");
    submitBtn.disabled = true;
    Promise.all(yesTags.map(function(tag){
      return fetch("/api/tag-attraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug, tag: tag }),
      }).then(function(r){ return r.json(); }).catch(function(){ return null; });
    })).then(function(){
      // actualizam numerele afisate, local, cu +1 la fiecare "Da" trimis —
      // reflectare instant, fara sa mai asteptam un reload de pagina
      yesTags.forEach(function(tag){
        var el = wrap.querySelector('.bvc-count[data-count-tag="' + tag + '"]');
        if (el) el.textContent = String((parseInt(el.textContent, 10) || 0) + 1);
      });
      form.querySelectorAll("input, button").forEach(function(el){ el.disabled = true; });
      thanks.hidden = false;
      // readucem grila (cu numerele proaspăt actualizate) — utilizatorul
      // vede rezultatul votului lui, nu rămâne doar cu formularul gol
      var grid = wrap.querySelector(".beach-vote-grid");
      var title = wrap.querySelector(".beach-vote-title");
      if (grid) grid.hidden = false;
      if (title) title.hidden = false;
    });
  });
})();
</script>`;
}

function itineraryPromoLabelsFor(lang) { return ITINERARY_PROMO_LABELS[lang] || ITINERARY_PROMO_LABELS.uk; }

function buildItineraryPromoCardHtml(countryCode, lang) {
  const t = itineraryPromoLabelsFor(lang);
  const href = itineraryHrefFor(countryCode, lang);
  return `<a href="${escapeHtml(href)}" class="itinerary-promo-card">
    <div class="itinerary-promo-title">${escapeHtml(t.title)}</div>
    <div class="itinerary-promo-text">${escapeHtml(t.text)}</div>
    <div class="itinerary-promo-cta">${escapeHtml(t.cta)}</div>
  </a>`;
}

function greeceBeachPromoLabelsFor(lang) { return GREECE_BEACH_PROMO_LABELS[lang] || GREECE_BEACH_PROMO_LABELS.uk; }

function buildGreeceBeachPromoCardHtml(lang) {
  const t = greeceBeachPromoLabelsFor(lang);
  const href = itineraryHrefFor("gr", lang);
  return `<a href="${escapeHtml(href)}" class="itinerary-promo-card">
    <div class="itinerary-promo-title">${escapeHtml(t.title)}</div>
    <div class="itinerary-promo-text">${escapeHtml(t.text)}</div>
    <div class="itinerary-promo-cta">${escapeHtml(t.cta)}</div>
  </a>`;
}


// Card COMBINAT — cerut explicit, ca să înlocuiască cele 2 bannere mari,
// separate (itinerar general + Beach Hopper Grecia) cu UNUL singur,
// compact, cu 2 butoane, doar pentru Grecia. Pentru restul țărilor,
// rămâne un singur buton (nu există al doilea CTA de plajă în afara
// Greciei) — comportament identic cu buildItineraryPromoCardHtml de mai
// sus, doar redenumit pentru claritate la locul de apel.
function buildCombinedTripPromoCardHtml(countryCode, lang) {
  const tGeneral = itineraryPromoLabelsFor(lang);
  const href = itineraryHrefFor(countryCode, lang);
  if (countryCode !== "gr") {
    return buildItineraryPromoCardHtml(countryCode, lang);
  }
  const tBeach = greeceBeachPromoLabelsFor(lang);
  const beachHref = itineraryHrefFor("gr", lang);
  return `<div class="itinerary-promo-card itinerary-promo-card-combined">
    <div class="itinerary-promo-title">🗺️ ${escapeHtml(tGeneral.title.replace(/^📍\s*/, ""))}</div>
    <div class="itinerary-promo-buttons">
      <a href="${escapeHtml(href)}" class="itinerary-promo-btn">${escapeHtml(tGeneral.cta)}</a>
      <a href="${escapeHtml(beachHref)}" class="itinerary-promo-btn">${escapeHtml(tBeach.cta)}</a>
    </div>
  </div>`;
}

function voteLabelsFor(lang) { return VOTE_LABELS[lang] || VOTE_LABELS.uk; }

function beachTagLabelsFor(lang) { return BEACH_TAG_LABELS[lang] || BEACH_TAG_LABELS.uk; }

function boatTourLabelFor(lang) { return BOAT_TOUR_LABELS[lang] || BOAT_TOUR_LABELS.uk; }


function buildVoteWidgetHtml(slug, count, isPopular, lang) {
  const t = voteLabelsFor(lang);
  const popularBadge = isPopular ? `<span class="vote-popular-badge">${escapeHtml(t.popular)}</span>` : "";
  return `<div class="vote-widget" data-vote-slug="${escapeHtml(slug)}">
    <button type="button" class="vote-btn" data-vote-label="${escapeHtml(t.vote)}" data-voted-label="${escapeHtml(t.voted)}">${escapeHtml(t.vote)}</button>
    ${popularBadge}
  </div>`;
}




function buildVoteWidgetScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var STORAGE_KEY = "poa_voted_slugs_v1";
  var widget = document.querySelector(".vote-widget");
  if (!widget) return;
  var btn = widget.querySelector(".vote-btn");
  var slug = widget.getAttribute("data-vote-slug");
  if (!btn || !slug) return;

  function getVoted(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch (e) { return []; }
  }
  function markVoted(){
    try {
      var voted = getVoted();
      if (voted.indexOf(slug) === -1) { voted.push(slug); localStorage.setItem(STORAGE_KEY, JSON.stringify(voted)); }
    } catch (e) {}
  }

  if (getVoted().indexOf(slug) !== -1) {
    btn.textContent = btn.getAttribute("data-voted-label");
    btn.disabled = true;
    btn.classList.add("voted");
  }

  btn.addEventListener("click", function(){
    if (btn.disabled) return;
    btn.disabled = true;
    fetch("/api/vote-attraction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: slug }),
    })
      .then(function(r){ return r.json(); })
      .then(function(data){
        if (data && data.ok) {
          btn.textContent = btn.getAttribute("data-voted-label");
          btn.classList.add("voted");
          markVoted();
        } else {
          btn.disabled = false;
        }
      })
      .catch(function(){ btn.disabled = false; });
  });
})();
</script>`;
}

function normAttractionName(name) {
  return String(name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function isFreeAccessAttraction(name, category) {
  if (!name || !category) return false;
  const allowedPrefixes = FREE_ACCESS_PREFIXES_BY_CATEGORY[category];
  if (allowedPrefixes && allowedPrefixes.some((prefix) => name === prefix || name.startsWith(prefix + " "))) return true;
  const n = normAttractionName(name);
  if (FREE_ACCESS_SKIP_CATEGORIES.includes(category) && !FREE_ACCESS_DAM_RE.test(n)) return false;
  return FREE_ACCESS_KEYWORDS_RE.test(n) && !FREE_ACCESS_EXCLUDE_RE.test(n);
}

function needsSeasonalWarning(name) {
  if (!name) return false;
  if (SEASONAL_WARNING_PREFIXES.some((prefix) => name === prefix || name.startsWith(prefix + " "))) return true;
  const n = normAttractionName(name);
  return MOUNTAIN_ROAD_RE.test(n) && ROAD_WORD_RE.test(n) && !/\b(lacul|lake|portul|port|puerto de barcelona|puerto de valencia|parcul)\b/.test(n);
}

function freeAccessLabelFor(lang) { return FREE_ACCESS_LABELS[lang] || FREE_ACCESS_LABELS.uk; }

function openOnlyStoreLabelFor(lang) { return OPEN_ONLY_STORE_LABELS[lang] || OPEN_ONLY_STORE_LABELS.uk; }

function openOnlyAttractionLabelFor(lang) { return OPEN_ONLY_ATTRACTION_LABELS[lang] || OPEN_ONLY_ATTRACTION_LABELS.uk; }

function openOnlyAttractionShortLabelFor(lang) { return OPEN_ONLY_SHORT_LABELS[lang] || OPEN_ONLY_SHORT_LABELS.uk; }

function isMountainRoad(name) {
  const n = normAttractionName(name);
  return MOUNTAIN_ROAD_RE.test(n) && ROAD_WORD_RE.test(n) && !/\b(lacul|lake|portul|port|parcul)\b/.test(n);
}

function seasonalWarningLabelFor(lang, name) {
  if (name && isMountainRoad(name)) return MOUNTAIN_ROAD_LABELS[lang] || MOUNTAIN_ROAD_LABELS.uk;
  return SEASONAL_WARNING_LABELS[lang] || SEASONAL_WARNING_LABELS.uk;
}


function genericScheduleForCategory(category) {
  return CATEGORY_GENERIC_SCHEDULE[category] || null;
}


// calculează dacă "acum" (ora serverului — aproximare acceptată, la fel ca
// la insignele de magazine, care folosesc ora browserului) e în intervalul
// zilei curente din programul generic
function computeGenericIsOpenNow(schedule) {
  const now = new Date();
  const today = schedule[now.getDay()];
  if (!today) return false;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = today.open.split(":").map(Number);
  const [ch, cm] = today.close.split(":").map(Number);
  return nowMin >= oh * 60 + om && nowMin < ch * 60 + cm;
}


// Generalizarea lui computeGenericIsOpenNow — verifică programul la o ORĂ
// DATĂ (nu neapărat "acum"), oricare ar fi ea, azi sau peste 3 zile.
// Construită pentru "Ghidul de Sosire" (vezi buildArrivalGuideText mai jos)
// — un turist care întreabă de o pensiune spune de obicei CÂND ajunge, nu
// "acum", deci "e deschis ACUM" nu ajută la nimic.
function isScheduleOpenAt(weekly, date) {
  const today = weekly[date.getDay()];
  if (!today) return false;
  const minOfDay = date.getHours() * 60 + date.getMinutes();
  const [oh, om] = today.open.split(":").map(Number);
  const [ch, cm] = today.close.split(":").map(Number);
  return minOfDay >= oh * 60 + om && minOfDay < ch * 60 + cm;
}


function determineAttractionOpenStatus({ name, category, liveIsOpenNow }) {
  if (liveIsOpenNow !== null && liveIsOpenNow !== undefined) {
    return { isOpenNow: liveIsOpenNow, source: "live" };
  }
  if (isFreeAccessAttraction(name, category) || FREE_ACCESS_CATEGORIES.includes(category)) {
    return { isOpenNow: true, source: "free_access" };
  }
  const schedule = genericScheduleForCategory(category);
  if (schedule) {
    return { isOpenNow: computeGenericIsOpenNow(schedule), source: "generic_schedule" };
  }
  return { isOpenNow: null, source: "unknown" };
}

function liveComingSoonLabelFor(lang) { return LIVE_COMING_SOON_LABELS[lang] || LIVE_COMING_SOON_LABELS.uk; }

function estimatedScheduleLabelFor(lang) { return ESTIMATED_SCHEDULE_LABELS[lang] || ESTIMATED_SCHEDULE_LABELS.uk; }

function categoryLabelFor(categoryKey, lang) {
  const set = CATEGORY_LABELS[lang] || CATEGORY_LABELS.uk;
  return set[categoryKey] || categoryKey;
}

function loadingTextFor(lang) {
  return LOADING_TEXTS[lang] || LOADING_TEXTS.uk;
}


// Butonul de afiliere per magazin (Lidl/Kaufland/Catena/...) — vezi comentariul
// de deasupra STORE_AFFILIATE_LINKS pentru cele 2 moduri posibile (link fix,
// STRING, vs. "carusel de linkuri", ARRAY). Randează un SINGUR <a>, mereu — nu
// mai multe butoane/bannere — deci nu aglomerează pagina, indiferent de câte
// linkuri sunt disponibile pentru brandul respectiv.
// Returnează { html, scriptHtml } — scriptHtml e "" în afara modului carusel
// (adică pentru toate brandurile vechi, cu link simplu, comportament identic
// cu înainte) și conține rotația JS DOAR când chiar avem 2+ linkuri de rotit.
function buildStoreAffiliateButtonHtml(magazinKey, magazinDisplay, nonce) {
  const raw = magazinKey ? STORE_AFFILIATE_LINKS[magazinKey] : null;
  const hasOwnLink = !!raw && (typeof raw === "string" ? raw.length > 0 : raw.length > 0);
  if (!hasOwnLink) {
    // fallback — brandul ăsta n-are încă link propriu de afiliere: arătăm
    // caruselul generic cu cele 13 magazine partenere, ca pagina să nu
    // rămână fără nimic de monetizare.
    return buildGenericAffiliateCarouselHtml(nonce);
  }

  if (typeof raw === "string") {
    // comportamentul vechi, neschimbat — link fix, un singur brand text
    const html = `<a href="${escapeHtml(raw)}" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-generic">🔥 Vezi catalogul cu reduceri ${escapeHtml(magazinDisplay)} de azi</a>`;
    return { html, scriptHtml: "" };
  }

  // mod carusel — fiecare element poate fi:
  //  - un STRING (link simplu) -> buton text, ca înainte.
  //  - un OBJECT { url, banner, alt } -> bannerul REAL primit de la rețeaua
  //    de afiliere (imagine), afișat în loc de text. La 2+ elemente, atât
  //    href-ul cât și imaginea rotesc împreună, la fiecare 7 secunde.
  const links = raw.filter((l) => l && (typeof l === "string" || l.url));
  if (!links.length) return { html: "", scriptHtml: "" };
  const buttonId = `storeAffCarousel_${magazinKey}`;
  const first = links[0];
  const firstIsBanner = first && typeof first === "object" && first.banner;

  const html = firstIsBanner
    ? `<a href="${escapeHtml(first.url)}" target="_blank" rel="noopener sponsored" class="affiliate-banner-link" id="${escapeHtml(buttonId)}"><img src="${escapeHtml(first.banner)}" alt="${escapeHtml(first.alt || magazinDisplay)}" width="336" height="280" loading="lazy"></a>`
    : `<a href="${escapeHtml(first)}" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-generic" id="${escapeHtml(buttonId)}">🛒 Cumpără online de la ${escapeHtml(magazinDisplay)}</a>`;
  const scriptHtml = links.length > 1
    ? buildStoreAffiliateCarouselScript(buttonId, links, nonce, !!firstIsBanner)
    : "";
  return { html, scriptHtml };
}


// Rotația efectivă — un singur element randat în HTML (buton text SAU
// banner-imagine), doar href-ul (și, în mod banner, și img.src) se schimbă
// din 7 în 7 secunde, prin toate elementele primite.
function buildStoreAffiliateCarouselScript(buttonId, links, nonce, isBanner) {
  return `
<script${nonce ? ` nonce="${nonce}"` : ""}>
(function(){
  var btn = document.getElementById(${safeJson(buttonId)});
  if (!btn) return;
  var links = ${safeJson(links)};
  if (!links || links.length < 2) return;
  var isBanner = ${isBanner ? "true" : "false"};
  var img = isBanner ? btn.querySelector("img") : null;
  var idx = 0;
  setInterval(function(){
    idx = (idx + 1) % links.length;
    var item = links[idx];
    if (isBanner) {
      btn.href = item.url;
      if (img) { img.src = item.banner; if (item.alt) img.alt = item.alt; }
    } else {
      btn.href = item;
    }
  }, 7000);
})();
</script>`;
}

// Rotația efectivă a caruselului generic — SUPORTĂ o listă MIXTĂ de oferte
// (unele cu banner-imagine, altele doar text), fiindcă bannerele reale vin
// treptat, câte unul, de la fiecare partener. La fiecare pas, funcția
// render() reconstruiește complet conținutul butonului (clasă + interior)
// după tipul ofertei curente — dacă are `banner`, arată imaginea, curată,
// fără fundal colorat; altfel, cade pe stilul CTA text + săgeată, ca acum.
function buildGenericPartnerCarouselScript(buttonId, offers, nonce) {
  return `
<script${nonce ? ` nonce="${nonce}"` : ""}>
(function(){
  var btn = document.getElementById(${safeJson(buttonId)});
  if (!btn) return;
  var offers = ${safeJson(offers)};
  if (!offers || offers.length < 2) return;
  var idx = 0;
  function render(item){
    btn.href = item.url;
    btn.innerHTML = "";
    if (item.banner) {
      btn.className = "affiliate-banner-link";
      var img = document.createElement("img");
      img.src = item.banner;
      img.alt = item.alt || item.name || "";
      img.loading = "lazy";
      btn.appendChild(img);
    } else {
      btn.className = "affiliate-btn affiliate-btn-generic affiliate-btn-cta";
      var textSpan = document.createElement("span");
      textSpan.className = "affiliate-cta-text";
      textSpan.textContent = "🛍️ Ofertă recomandată: " + (item.name || "");
      var arrow = document.createElement("span");
      arrow.className = "affiliate-cta-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "➜";
      btn.appendChild(textSpan);
      btn.appendChild(arrow);
    }
  }
  setInterval(function(){
    idx = (idx + 1) % offers.length;
    render(offers[idx]);
  }, 5000);
})();
</script>`;
}

function buildGenericAffiliateCarouselHtml(nonce) {
  if (!GENERIC_PARTNER_OFFERS.length) return { html: "", scriptHtml: "" };
  const buttonId = "genericPartnerCarousel";
  const first = GENERIC_PARTNER_OFFERS[0];
  const html = first.banner
    ? `<a href="${escapeHtml(first.url)}" target="_blank" rel="noopener sponsored" class="affiliate-banner-link" id="${buttonId}"><img src="${escapeHtml(first.banner)}" alt="${escapeHtml(first.alt || first.name || "")}" loading="lazy"></a>`
    : `<a href="${escapeHtml(first.url)}" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-generic affiliate-btn-cta" id="${buttonId}"><span class="affiliate-cta-text">🛍️ Ofertă recomandată: <span>${escapeHtml(first.name)}</span></span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>`;
  const scriptHtml = GENERIC_PARTNER_OFFERS.length > 1
    ? buildGenericPartnerCarouselScript(buttonId, GENERIC_PARTNER_OFFERS, nonce)
    : "";
  return { html, scriptHtml };
}

function buildLanguageSwitcher(currentLang, pathWithoutQuery) {
  const options = Object.keys(LANGUAGE_LABELS)
    .map((code) => `<option value="${escapeHtml(code)}" ${code === currentLang ? "selected" : ""}>${LANGUAGE_FLAGS[code] || ""} ${escapeHtml(code.toUpperCase())}</option>`)
    .join("");
  return `
  <div class="lang-switcher">
    <select id="langSwitcherSelect" data-path="${escapeHtml(pathWithoutQuery)}" aria-label="Choose language">${options}</select>
  </div>`;
}


// alegerea de limbă persistă pe TOT site-ul (nu doar pagina curentă) — la
// schimbare, salvăm în localStorage; pe orice altă pagină .eu încărcată
// ulterior, dacă URL-ul nu are deja limba salvată, redirectăm automat spre
// aceeași pagină cu ?lang=X — o singură dată, nu creează buclă (verifică
// întâi dacă limba curentă din URL se potrivește deja).
function buildLanguageSwitcherScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var STORAGE_KEY = "oht_lang_pref";
  var select = document.getElementById("langSwitcherSelect");
  if (select) {
    // mutăm selectorul de limbă lângă iconița soare/lună, în antet — cerut
    // explicit — aceeași tehnică deja folosită pentru butonul de temă
    // (vezi buildThemeToggleScript): relocare o singură dată, aici, nu
    // trebuie atinsă fiecare pagină individual. Grid-ul din .header-row are
    // 3 coloane fixe (brand / ceas / [gol]) — în loc să adăugăm încă un
    // copil direct în grid (risc de layout stricat), grupăm limba + tema
    // într-un mic wrapper flex, care ocupă el singur a treia coloană.
    var headerRow = document.querySelector(".header-row");
    var wrap = select.closest(".lang-switcher");
    if (headerRow && wrap) {
      var themeBtn = document.getElementById("themeToggle");
      var group = document.createElement("div");
      group.className = "header-actions-group";
      headerRow.appendChild(group);
      group.appendChild(wrap);
      wrap.classList.add("in-header");
      if (themeBtn) group.appendChild(themeBtn);
    }
    select.addEventListener("change", function(){
      var lang = select.value;
      try { localStorage.setItem(STORAGE_KEY, lang); } catch(e){}
      var path = select.getAttribute("data-path");
      window.location.href = path + "?lang=" + lang;
    });
  }
  // aplicare automată pe orice altă pagină, dacă utilizatorul a ales deja o limbă
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      var params = new URLSearchParams(window.location.search);
      if (params.get("lang") !== saved) {
        params.set("lang", saved);
        window.location.href = window.location.pathname + "?" + params.toString();
      }
    }
  } catch(e){}
})();
</script>`;
}


// deduce orașul unui obiectiv turistic — preferă câmpul REAL `a.city`, dacă
// obiectivul îl are (Belgia/Spania au deja acest câmp; adăugat pornind din
// lista originală, cu locația fiecărui obiectiv, nu ghicit). Pentru restul
// țărilor, care încă nu au acest câmp, cade pe o deducere din nume — mai
// slabă (funcționează doar dacă orașul apare literal în numele obiectivului,
// ex. "Palatul Regal din Madrid"), dar mai bine decât nimic până se
// completează și acolo câmpul real, la fel ca la Spania.
function inferCityForAttraction(attraction, cities) {
  if (attraction.city) return attraction.city;
  const norm = normalizeJudetInput(attraction.name);
  const found = (cities || []).find((c) => norm.includes(normalizeJudetInput(c)));
  return found || "";
}

function storeCategoryLabelFor(categoryKey, lang) {
  const set = STORE_CATEGORY_LABELS[lang] || STORE_CATEGORY_LABELS.uk;
  return set[categoryKey] || categoryKey;
}


function getHost(req) {
  return String(req.headers.host || "").replace(/^www\./, "").split(":")[0].toLowerCase();
}

function isIntlHost(req) {
  return getHost(req) === INTL_DOMAIN;
}

function baseUrlFor(req) {
  return isIntlHost(req) ? `https://${INTL_DOMAIN}` : `https://${RO_DOMAIN}`;
}


// distanța reală (km) dintre două puncte GPS — formula Haversine, standard
// Prognoză meteo, DOAR pentru ziua 1 a itinerarului (mâine) — cerut
// explicit, "plan de ploaie" pentru itinerar. Verifică ÎNTÂI limita de
// siguranță (950/zi, deși planul gratuit OpenWeatherMap permite 1.000) —
// dacă am atins-o, sărim complet peste verificare, fără nicio eroare
// vizibilă (itinerarul funcționează normal, doar fără avertismentul de
// ploaie pentru acea cerere). Reutilizează exact același mecanism de
// rate-limit deja folosit în restul site-ului (api_rate_limits), doar cu
// un identificator FIX, global — nu per-utilizator, fiindcă limita e a
// NOASTRĂ, față de OpenWeatherMap, nu a fiecărui vizitator în parte.
async function checkWeatherApiQuota() {
  return checkRateLimit("global-shared", "weather-api-calls", WEATHER_DAILY_SAFETY_LIMIT, 1440);
}


async function fetchTomorrowRainForecast(coords) {
  if (!OPENWEATHER_API_KEY || !coords) return null;
  const quotaOk = await checkWeatherApiQuota();
  if (!quotaOk) return null; // limita de siguranță atinsă — sărim peste, fără eroare
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords[0]}&lon=${coords[1]}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!Array.isArray(data.list)) return null;
    // "mâine" — prima zi a itinerarului, la fel ca la exportul .ics și la
    // avertismentul de program (trebuie să corespundă exact, altfel ziua
    // verificată pentru ploaie n-ar mai fi aceeași cu ziua 1 din itinerar)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    // media de-a lungul zilei — considerăm "zi ploioasă" dacă probabilitatea
    // medie de precipitații (pop) din intervalele orare ale zilei respective
    // depășește 50% — prag rezonabil, nu orice nor trecător
    const dayEntries = data.list.filter((entry) => entry.dt_txt && entry.dt_txt.startsWith(tomorrowStr));
    if (!dayEntries.length) return null;
    const avgPop = dayEntries.reduce((sum, e) => sum + (e.pop || 0), 0) / dayEntries.length;
    return { rainLikely: avgPop >= 0.5, pop: avgPop };
  } catch (err) {
    console.error("fetchTomorrowRainForecast a eșuat:", err.message);
    return null;
  }
}


function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


// Pentru butonul "Atracții" de la o cazare al cărei oraș NU e printre cele
// ~30 acoperite (ex. Deva) — geocodăm aproximativ orașul (Google Places,
// cache în DB ca să nu plătim același apel de mai multe ori) și găsim cel
// mai apropiat oraș acoperit, real, nu doar unul ales la întâmplare.
async function geocodeCityApprox(cityName) {
  if (!GOOGLE_PLACES_API_KEY_LIVE) return null;
  const key = cityName.trim().toLowerCase();
  if (dbPool) {
    try {
      const cached = await dbPool.query(`SELECT lat, lon FROM geocode_cache WHERE city_key = $1`, [key]);
      if (cached.rows.length) return { lat: Number(cached.rows[0].lat), lon: Number(cached.rows[0].lon) };
    } catch (e) { /* tabela poate lipsi încă — mergem mai departe fără cache */ }
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(cityName + ", Romania")}&inputtype=textquery&fields=geometry&key=${GOOGLE_PLACES_API_KEY_LIVE}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await resp.json();
    const loc = data.candidates && data.candidates[0] && data.candidates[0].geometry && data.candidates[0].geometry.location;
    if (!loc) return null;
    if (dbPool) {
      dbPool.query(
        `INSERT INTO geocode_cache (city_key, lat, lon) VALUES ($1, $2, $3) ON CONFLICT (city_key) DO NOTHING`,
        [key, loc.lat, loc.lng]
      ).catch(() => {});
    }
    return { lat: loc.lat, lon: loc.lng };
  } catch (e) {
    return null;
  }
}

// Returnează link-ul "Atracții" cel mai potrivit pentru orașul unei cazări —
// direct, dacă orașul e acoperit; altfel, cel mai apropiat oraș acoperit
// (real, calculat geografic); null dacă nu găsim nimic (buton ascuns).
function roCityAttractionsHref(cityName) {
  return `https://${INTL_DOMAIN}/ro/${slugifyCityName(cityName)}?lang=ro#attractions`;
}

// pentru paginile în engleză: același link, dar cu ?lang=en
function localizeAttractionsHref(href, lang) {
  return lang === "en" ? String(href).replace("lang=ro", "lang=en") : href;
}

function starsHtml(avg, size) {
  const sz = size || 16;
  const pct = Math.max(0, Math.min(100, (Number(avg) / 5) * 100));
  const row = (cls) => `<span class="${cls}">${[1, 2, 3, 4, 5].map(() => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${STAR_PATH}</svg>`).join("")}</span>`;
  return `<span class="rv-stars" style="width:${sz * 5}px" role="img" aria-label="${Number(avg).toFixed(1)} / 5">${row("rv-stars-bg")}<span class="rv-stars-fg" style="width:${pct}%">${row("rv-stars-row")}</span></span>`;
}

function reviewThanksHtml(lang) {
  const en = lang === "en";
  return `<div class="rv-thanks"><h3>${en ? "Thank you for your review!" : "Mulțumim pentru recenzie!"}</h3>
<p>${en ? "Your opinion has been recorded." : "Opinia ta a fost înregistrată."}</p>
<p><strong>${en ? "What happens now?" : "Ce se întâmplă acum?"}</strong></p>
<ul><li>${paIcon("clock", 18)}<span>${en ? "To keep the platform fair and safe, our team checks the text within 24 hours at most." : "Pentru a păstra platforma corectă și sigură, echipa noastră verifică textul în maximum 24 de ore."}</span></li>
<li>${paIcon("check", 18)}<span>${en ? "As soon as it is approved, your review and ratings will appear publicly on this page." : "Imediat ce este aprobată, recenzia și notele tale vor apărea public pe această pagină."}</span></li></ul>
<p>${en ? "Thank you for helping the OpeningHoursToday community discover the best places!" : "Îți mulțumim că ajuți comunitatea OpeningHoursToday să descopere cele mai bune locuri!"}</p></div>`;
}

// Încarcă recenziile aprobate + răspunsurile + statisticile pentru un loc
async function loadPlaceReviews(placeKind, placeId) {
  const empty = { reviews: [], stats: null, replies: {} };
  if (!dbPool || !placeId) return empty;
  try {
    const { rows } = await dbPool.query(
      `SELECT id, author_name, rating, rating_1, rating_2, rating_3, rating_4, comment, creat_la, criteria_set FROM place_reviews WHERE place_kind = $1 AND place_id = $2 AND status = 'approved' ORDER BY creat_la DESC`,
      [placeKind, placeId]
    );
    if (!rows.length) return empty;
    const replies = {};
    try {
      const rp = await dbPool.query(`SELECT review_id, reply_text, actualizat_la FROM review_replies WHERE review_kind = 'local' AND hidden = false AND review_id = ANY($1::int[])`, [rows.map((x) => x.id)]);
      rp.rows.forEach((x) => { replies[x.review_id] = x; });
    } catch (e) { /* fără răspunsuri */ }
    const avg = (f) => Math.round((rows.reduce((s, r) => s + Number(f(r)), 0) / rows.length) * 10) / 10;
    return { reviews: rows, replies, stats: { count: rows.length, avg: avg((r) => r.rating), c: [avg((r) => r.rating_1), avg((r) => r.rating_2), avg((r) => r.rating_3), avg((r) => r.rating_4)] } };
  } catch (e) { return empty; }
}

function reviewDateText(v, lang) {
  try { return new Date(v).toLocaleDateString(lang === "en" ? "en-GB" : "ro-RO", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return ""; }
}

function reviewReplyBlockHtml(reply, lang) {
  if (!reply) return "";
  return `<div class="rv-reply"><div class="rv-reply-head">${paIcon("chat", 14)}<span>${lang === "en" ? "Owner's reply" : "Răspunsul proprietarului"} · ${escapeHtml(reviewDateText(reply.actualizat_la, lang))}</span></div><p>${escapeHtml(reply.reply_text)}</p></div>`;
}

function reviewReplyButtonHtml(kind, id, reply, owner, lang) {
  if (reply) return owner ? `<button type="button" class="rv-reply-btn" data-kind="${kind}" data-id="${id}" data-reply="${escapeHtml(reply.reply_text)}">${lang === "en" ? "Edit reply" : "Editează răspunsul"}</button>` : "";
  return `<button type="button" class="rv-reply-btn" data-kind="${kind}" data-id="${id}">${paIcon("chat", 14)} ${lang === "en" ? "Reply as owner" : "Răspunde ca proprietar"}</button>`;
}

// Secțiunea completă de recenzii pentru un loc (rezumat + formular + listă cu „Vezi toate”)
function buildPlaceReviewsSection(o) {
  const { lang, criteriaSet, data, owner } = o;
  const en = lang === "en";
  const L = (ro, enT) => (en ? enT : ro);
  const crit = REVIEW_CRITERIA[criteriaSet];
  const { reviews, stats, replies } = data;
  const lab = (c) => (en ? c.en : c.ro);
  const summary = stats ? `<div class="rv-summary">
      <div class="rv-score"><div class="rv-score-num">${stats.avg.toFixed(1)}</div><div>${starsHtml(stats.avg, 18)}<div class="rv-score-meta">${stats.count} ${L(stats.count === 1 ? "recenzie" : "recenzii", stats.count === 1 ? "review" : "reviews")}</div></div></div>
      <div class="rv-bars">${crit.map((c, i) => `<div class="rv-bar-row"><span class="rv-bar-label">${paIcon(c.icon, 14)}${escapeHtml(lab(c))}</span><span class="rv-bar"><i style="width:${(stats.c[i] / 5) * 100}%"></i></span><strong>${stats.c[i].toFixed(1)}</strong></div>`).join("")}</div>
      <button type="button" class="rv-write" id="rvWriteBtn">${paIcon("pencil", 16)} ${L("Lasă o recenzie", "Leave a review")}</button>
    </div>` : `<div class="rv-summary"><div class="rv-empty" style="flex:1 1 220px">${L("Nicio recenzie încă — fii primul care lasă una.", "No reviews yet — be the first to leave one.")}</div><button type="button" class="rv-write" id="rvWriteBtn">${paIcon("pencil", 16)} ${L("Lasă o recenzie", "Leave a review")}</button></div>`;
  const form = `<form class="rv-form" id="rvForm" hidden novalidate>
      <h3>${L("Lasă o recenzie", "Leave a review")}</h3>
      <div class="rv-field"><label for="rvName">${L("Numele tău (opțional)", "Your name (optional)")}</label><input type="text" id="rvName" maxlength="60" autocomplete="off" placeholder="${L("Nume sau prenume — dacă lași gol, apari ca „Anonim”", "Name or first name — leave empty to appear as “Anonymous”")}"></div>
      <div class="rv-field"><span class="rv-crit-name" style="margin-bottom:2px">${L("Notele tale (1–5 stele, toate obligatorii)", "Your ratings (1–5 stars, all required)")}</span>
      ${crit.map((c) => `<div class="rv-crit"><div class="rv-crit-text"><div class="rv-crit-name">${paIcon(c.icon, 18)}${escapeHtml(lab(c))}</div><p class="rv-crit-hint">${escapeHtml(en ? c.hintEn : c.hintRo)}</p></div>
        <div class="rv-star-group" data-k="${c.k}" role="radiogroup" aria-label="${escapeHtml(lab(c))}">${[1, 2, 3, 4, 5].map((v) => `<button type="button" class="rv-star-btn" data-v="${v}" aria-label="${v} / 5"><svg viewBox="0 0 24 24" fill="currentColor">${STAR_PATH}</svg></button>`).join("")}</div></div>`).join("")}</div>
      <div class="rv-field"><label for="rvComment">${L("Experiența ta", "Your experience")}</label><textarea id="rvComment" maxlength="1500" placeholder="${L("Povestește cum a fost (minim 30 de caractere)…", "Tell us how it was (at least 30 characters)…")}"></textarea><div class="rv-count" id="rvCount"></div></div>
      <input type="text" id="rvWebsite" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;opacity:0;height:0;width:0" aria-hidden="true">
      <label class="rv-consent"><input type="checkbox" id="rvConsent"><span>${en
        ? `I agree to the site's <a href="/termeni-si-conditii" target="_blank" rel="noopener">Terms</a> and the Moderation Policy. I confirm that this review describes a real, personal experience at ${criteriaSet === "food" ? "the venue" : "this attraction"}. I agree that the text may be checked manually by the team and I understand that it may be edited to protect personal data (GDPR) or permanently deleted if it breaches the platform rules (insults, spam or serious accusations without proof).`
        : `Sunt de acord cu <a href="/termeni-si-conditii" target="_blank" rel="noopener">Termenii site-ului</a> și Politica de Moderare. Confirm că această recenzie descrie o experiență reală și personală ${criteriaSet === "food" ? "în local" : "la acest obiectiv"}. Sunt de acord ca textul să fie verificat manual de echipă și înțeleg că acesta poate fi editat pentru protecția datelor personale (GDPR) sau șters definitiv dacă încalcă regulamentul platformei (insulte, spam sau acuzații grave fără dovezi).`}</span></label>
      <button type="submit" class="rv-submit" id="rvSubmit">${L("Trimite recenzia spre moderare", "Send the review for moderation")}</button>
      <p class="rv-err" id="rvErr" hidden></p>
    </form>`;
  const item = (rv) => `<article class="rv-item" id="rv-${rv.id}">
      <div class="rv-head"><strong>${escapeHtml(rv.author_name || L("Anonim", "Anonymous"))}</strong><span class="rv-date">${escapeHtml(reviewDateText(rv.creat_la, lang))}</span></div>
      <div class="rv-rating">${starsHtml(rv.rating, 16)}<span>${Number(rv.rating).toFixed(1)}</span></div>
      <p class="rv-mini">${crit.map((c) => `${escapeHtml(lab(c))} ${rv["rating_" + c.k]}`).join(" · ")}</p>
      <p class="rv-text">${escapeHtml(rv.comment)}</p>
      ${reviewReplyBlockHtml(replies[rv.id], lang)}${reviewReplyButtonHtml("local", rv.id, replies[rv.id], owner, lang)}
    </article>`;
  const first = reviews.slice(0, 5), rest = reviews.slice(5);
  const list = reviews.length ? `<div class="rv-list">${first.map(item).join("")}</div>${rest.length ? `<div class="rv-more" id="rvMore"><div>${rest.map(item).join("")}</div></div><button type="button" class="rv-more-btn" data-rv-more-btn="rvMore" data-total="${reviews.length}" aria-expanded="false">${L(`Vezi toate recenziile (${reviews.length})`, `See all reviews (${reviews.length})`)}</button>` : ""}` : "";
  return `<section class="rv-wrap" id="rvWrap">${summary}${form}${list}</section>`;
}

function reviewsScriptHtml(nonce, cfg) {
  return `<script nonce="${nonce}">(function(CFG){\n${REVIEWS_CLIENT_JS}\n})(${safeJson(cfg)});</script>`;
}

async function ownerCanManageReview(kind, reviewId, ownerId) {
  if (!dbPool || !Number.isInteger(reviewId) || !Number.isInteger(ownerId)) return false;
  try {
    if (kind === "cazare") {
      const { rows } = await dbPool.query(`SELECT l.owner_id FROM accommodation_reviews r JOIN accommodation_listings l ON l.id = r.listing_id WHERE r.id = $1::integer AND r.status = 'approved'`, [reviewId]);
      return !!rows.length && rows[0].owner_id === ownerId;
    }
    const { rows } = await dbPool.query(`SELECT place_kind, place_id FROM place_reviews WHERE id = $1::integer AND status = 'approved'`, [reviewId]);
    if (!rows.length) return false;
    const { place_kind: pk, place_id: pid } = rows[0];
    if (pk === "restaurant") { const r = await dbPool.query(`SELECT owner_id FROM restaurant_listings WHERE id = $1::integer`, [pid]); return !!r.rows.length && r.rows[0].owner_id === ownerId; }
    if (pk === "obiectiv") { const r = await dbPool.query(`SELECT owner_id FROM attraction_listings WHERE id = $1::integer`, [pid]); return !!r.rows.length && r.rows[0].owner_id === ownerId; }
    try { const r = await dbPool.query(`SELECT claimed_by_owner_id FROM pending_submissions WHERE id = $1::integer`, [pid]); return !!r.rows.length && r.rows[0].claimed_by_owner_id === ownerId; }
    catch (e) { return false; }
  } catch (e) { return false; }
}

function proposalTypeLabel(r, isRo) {
  if (r.type === "cafe") return isRo ? "Cafenea" : "Café";
  if (r.type === "restaurant") return "Restaurant";
  if (r.type === "beach") return isRo ? "Plajă" : "Beach";
  if (r.type === "other" && r.other_type) return r.other_type;
  return isRo ? "Obiectiv turistic" : "Tourist attraction";
}


function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


// Vulnerabilitate REALĂ, găsită la verificare de securitate: link-urile de
// social/website/meniu (Facebook, Instagram, TikTok, website, meniu PDF)
// se salvau fără nicio verificare a schemei — cineva ar fi putut trimite
// "javascript:..." în loc de un link real, care s-ar fi executat direct în
// browserul oricui apasă pe iconiță, inclusiv în panoul de admin.
// escapeHtml() (folosit peste tot) NU protejează împotriva asta — scapă
// caractere HTML, nu scheme de URL periculoase într-un atribut href.
// Acceptăm DOAR http/https; orice altceva (javascript:, data:, vbscript:
// etc.) devine null, ca și cum câmpul n-ar fi fost completat.
function sanitizePublicUrl(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}


// Insignă minimalistă de brand — inițială + culoare derivată din nume (hash
// simplu, determinist), NU logo-ul real al companiei. Logo-urile sunt mărci
// înregistrate; folosirea lor fără licență e un risc juridic real, nu doar o
// alegere de design — de-aia nu punem sigla reală Lidl/Carrefour etc.
// Selector de orașe reutilizabil — cipuri orizontale, glisante, pentru cele
// mai căutate orașe (acces rapid, un singur tap) + o căutare live care
// filtrează lista completă de dedesubt, fără reîncărcare de pagină. Merge
// identic pe orice listă de orașe (RO cu 41, sau fiecare țară de pe .eu).
function buildCitySelectorHtml({ popularCities, hrefPrefix }) {
  const chipsHtml = popularCities.map((c) => `<a href="${hrefPrefix}${slugifyCityName(c)}" class="city-chip">${escapeHtml(c)}</a>`).join("");
  return `
  <div class="city-chips-row">${chipsHtml}</div>`;
}


// JSON sigur de injectat într-un <script> (evită breakout la "</script>")
function safeJson(obj) {
  const out = JSON.stringify(obj);
  return out === undefined ? "undefined" : out.replace(/</g, "\\u003c");
}


// Securitate: un URL de poză/fișier e acceptat DOAR dacă e chiar din spațiul
// nostru de stocare (Vercel Blob). Verificarea veche cu .includes(...) putea fi
// păcălită (ex. https://site-strain.com/?x=.public.blob.vercel-storage.com/).
function isOwnBlobUrl(u) {
  if (typeof u !== "string" || u.length > 600) return false;
  try {
    const url = new URL(u);
    return url.protocol === "https:" && !url.username && !url.password && url.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch (e) {
    return false;
  }
}


// Securitate: fișierul încărcat trebuie să fie CU ADEVĂRAT tipul declarat —
// verificăm primii octeți („semnătura” formatului), nu doar ce spune browserul.
function fileMatchesDeclaredType(buf, contentType) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return false;
  if (contentType === "image/jpeg") return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (contentType === "image/png") return buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (contentType === "image/webp") return buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP";
  if (contentType === "application/pdf") return buf.slice(0, 5).toString("ascii") === "%PDF-";
  return false;
}


/* ============================================================
   2.5) SECURITATE — nonce CSP generat unic la fiecare cerere
   Fiecare pagină HTML primește un token aleator nou; doar
   <script>/<style> cu exact acel token pot rula. Fără el (sau cu
   unul vechi, reutilizat), browserul refuză să execute codul —
   de asta NU poate fi generat static în vercel.json, ci aici,
   per cerere, chiar înainte de a trimite răspunsul.
   ============================================================ */
function generateNonce() {
  return crypto.randomBytes(16).toString("base64");
}


// injectează nonce-ul curent pe orice <script> fără atribute dintr-un bloc de
// cod colat (ex: codAnalytics) — necesar pentru ca inline-ul să treacă de CSP
// fără să slăbim politica cu 'unsafe-inline'. Script-urile care au deja src=
// (externe) nu au nevoie de nonce, sunt permise prin domeniul lor din CSP.
function withNonce(rawHtml, nonce) {
  return rawHtml.replace(/<script>/g, `<script nonce="${nonce}">`);
}


function buildCsp(nonce) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagservices.com https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://widget.getyourguide.com https://unpkg.com https://esm.sh https://maps.googleapis.com https://tp-em.com https://tpembd.com https://*.avs.io https://scripts.stay22.com https://*.stay22.com https://challenges.cloudflare.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://tp-em.com https://tpembd.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://www.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com https://widget.getyourguide.com https://*.tile.openstreetmap.org https://maps.gstatic.com https://maps.googleapis.com https://*.googleapis.com https://*.ggpht.com https://img.2performant.com https://*.avs.io https://tpembd.com https://tp-em.com https://*.wway.io https://*.public.blob.vercel-storage.com",
    "connect-src 'self' https://api.bigdatacloud.net https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://securepubads.g.doubleclick.net https://static.doubleclick.net https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://widget.getyourguide.com https://*.getyourguide.com https://unpkg.com https://esm.sh https://maps.googleapis.com https://tp-em.com https://tpembd.com https://www.travelpayouts.com https://*.avs.io https://avsplow.com https://*.avsplow.com https://*.stay22.com https://*.apistp.com https://*.public.blob.vercel-storage.com https://vercel.com https://blob.vercel-storage.com https://challenges.cloudflare.com",
    "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://maps.google.com https://www.google.ro https://www.google.de https://tpembd.com https://*.avs.io https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://tpembd.com https://tp-em.com https://aviasales.com https://www.aviasales.com https://search.aviasales.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}


/* ============================================================
   4) SCRIPT CLIENT — rulează în telefonul vizitatorului: ceas
      live + calcul DESCHIS/ÎNCHIS pe baza orei lui locale.
   ============================================================ */
function buildClientScript(dataForClient, nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var DATA = ${safeJson(dataForClient)};
  var DEFAULT_DAY_NAMES = ${safeJson(DAY_NAMES)};
  var DEFAULT_LABELS = {
    openNow: "DESCHIS ACUM",
    closedNow: "ÎNCHIS ACUM",
    openShort: "Deschis",
    closedShort: "Închis",
    closedHoliday: "Închis astăzi — {label}",
    closedAllDay: "Închis toată ziua",
    opensToday: "Se deschide azi la {time}",
    closedComeBack: "S-a închis la {time} — revino mâine",
    closesToday: "Se închide azi la {time}"
  };
  var DAY_NAMES = DATA.dayNames || DEFAULT_DAY_NAMES;
  var LABELS = DATA.labels || DEFAULT_LABELS;
  function fmt(tpl, key, val){ return tpl.replace("{" + key + "}", val); }

  function pad(n){ return String(n).padStart(2,"0"); }
  function toMinutes(hhmm){ var p = hhmm.split(":"); return (+p[0])*60 + (+p[1]); }
  function mmdd(d){ return pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
  function ymd(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }

  function getHoliday(entity, date){
    var md = mmdd(date), full = ymd(date);
    for (var i=0;i<entity.holidays.length;i++){
      var h = entity.holidays[i];
      if (h.date === md || h.date === full) return h;
    }
    return null;
  }
  function getDayHours(entity, date){
    var h = getHoliday(entity, date);
    if (h) return { hours: h.hours, isHoliday:true, label: h.label };
    var w = entity.weekly[date.getDay()];
    return { hours: w ? [w.open, w.close] : null, isHoliday:false, label:null };
  }
  function computeStatus(entity, now){
    var today = getDayHours(entity, now);
    var nowMin = now.getHours()*60 + now.getMinutes();
    if (!today.hours){
      return { open:false, sub: today.isHoliday ? fmt(LABELS.closedHoliday, "label", today.label) : LABELS.closedAllDay };
    }
    var openMin = toMinutes(today.hours[0]), closeMin = toMinutes(today.hours[1]);
    if (nowMin < openMin) return { open:false, sub: fmt(LABELS.opensToday, "time", today.hours[0]) };
    if (nowMin >= closeMin) return { open:false, sub: fmt(LABELS.closedComeBack, "time", today.hours[1]) };
    var minutesLeft = closeMin - nowMin;
    // procentul barei se calculeaza fata de fereastra de 60 de minute in care
    // bara chiar apare (nu fata de tot intervalul zilnic de deschidere) —
    // altfel, la un magazin deschis 12 ore, bara ar parea aproape goala chiar
    // si cu 22 de minute ramase, in loc sa "curga" vizibil spre zero.
    return { open:true, sub: fmt(LABELS.closesToday, "time", today.hours[1]), minutesLeft: minutesLeft, percentLeft: Math.max(0, Math.min(100, (minutesLeft / 60) * 100)) };
  }

  function applyStatus(el, status){
    if (!el) return;
    el.classList.remove("is-open","is-closed");
    el.classList.add(status.open ? "is-open" : "is-closed");
    var t = el.querySelector(".status-text"); if (t) t.textContent = status.open ? LABELS.openNow : LABELS.closedNow;
    var s = el.querySelector(".status-sub"); if (s) s.textContent = status.sub;
    var bar = el.querySelector("#closingSoonBar") || el.querySelector(".closing-soon-bar");
    var fill = el.querySelector("#closingSoonFill") || el.querySelector(".closing-soon-fill");
    if (bar && fill) {
      if (status.open && typeof status.minutesLeft === "number" && status.minutesLeft <= 60) {
        bar.style.display = "block";
        fill.style.width = status.percentLeft.toFixed(1) + "%";
        fill.classList.toggle("is-urgent", status.minutesLeft <= 15);
      } else {
        bar.style.display = "none";
      }
    }
  }
  function applySecondary(el, status){
    if (!el) return;
    el.classList.remove("sb-open","sb-closed");
    el.classList.add(status.open ? "sb-open" : "sb-closed");
    var st = el.querySelector(".sb-state"); if (st) st.textContent = status.open ? (LABELS.openShort || LABELS.openNow) : (LABELS.closedShort || LABELS.closedNow);
    var sb = el.querySelector(".sb-sub"); if (sb) sb.textContent = status.sub;
  }

  function tick(){
    var now = new Date();
    var clockEl = document.getElementById("liveClock");
    if (clockEl) clockEl.textContent = pad(now.getHours())+":"+pad(now.getMinutes())+":"+pad(now.getSeconds());

    if (DATA.type === "store") {
      applyStatus(document.getElementById("statusCard"), computeStatus(DATA, now));
    } else if (DATA.type === "mall") {
      applyStatus(document.getElementById("statusCard"), computeStatus(DATA.zones.shopping, now));
      applySecondary(document.getElementById("secondaryBadge"), computeStatus(DATA.zones.hypermarket, now));
    }

    var badge = document.getElementById("statusBadge");
    if (badge) badge.textContent = DAY_NAMES[now.getDay()] + ", " + pad(now.getHours()) + ":" + pad(now.getMinutes());

    var rows = document.querySelectorAll("tr[data-day]");
    for (var i=0;i<rows.length;i++){
      var isToday = Number(rows[i].getAttribute("data-day")) === now.getDay();
      rows[i].classList.toggle("today", isToday);
    }
  }

  tick();
  setInterval(tick, 1000);
})();
</script>`;
}



// Script pentru butonul de instalare PWA de pe homepage: ascultă
// beforeinstallprompt (Chrome/Android/Edge), afișează butonul doar când
// browserul confirmă că aplicația poate fi instalată, și declanșează
// promptul nativ la click. Pe iOS (fără beforeinstallprompt), arată în
// schimb instrucțiunea text pentru Share -> Adaugă pe ecranul de pornire.
// Abonare/dezabonare de notificări push — verifică la încărcare dacă
// browserul are deja o subscripție activă (buton arată starea corectă din
// prima), fără să presupunem nimic. Cheia publică VAPID e injectată direct
// în pagină (e publică prin design, spre deosebire de cea privată).
function buildPushSubscribeScript(nonce, vapidPublicKey, labelSubscribe, labelUnsubscribe, countryCode, lang) {
  return `
<script nonce="${nonce}">
(function(){
  var btn = document.getElementById("pushSubBtn");
  if (!btn) return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) { btn.style.display = "none"; return; }

  function urlBase64ToUint8Array(base64String){
    var padding = "=".repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    var rawData = atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  function setButtonState(subscribed){
    btn.textContent = subscribed ? ${safeJson(labelUnsubscribe)} : ${safeJson(labelSubscribe)};
    btn.dataset.subscribed = subscribed ? "1" : "0";
  }

  navigator.serviceWorker.ready.then(function(reg){
    reg.pushManager.getSubscription().then(function(sub){ setButtonState(!!sub); });
  });

  btn.addEventListener("click", function(){
    navigator.serviceWorker.ready.then(function(reg){
      if (btn.dataset.subscribed === "1") {
        reg.pushManager.getSubscription().then(function(sub){
          if (!sub) { setButtonState(false); return; }
          var endpoint = sub.endpoint;
          sub.unsubscribe().then(function(){
            fetch("/api/push-unsubscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ endpoint: endpoint }),
            }).catch(function(){});
            setButtonState(false);
          });
        });
        return;
      }
      reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(${safeJson(vapidPublicKey)}),
      }).then(function(sub){
        // trimitem și țara + limba, ca radarul de sărbători să știe ce să-ți anunțe
        var payload = JSON.parse(JSON.stringify(sub));
        var activeChip = document.querySelector("[data-country-select].active, [data-country-select].is-active");
        payload.country = (activeChip && activeChip.getAttribute("data-country-select")) || ${safeJson(countryCode || "")};
        payload.lang = ${safeJson(lang || "")};
        return fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then(function(){ setButtonState(true); });
      }).catch(function(err){
        console.error("Abonarea la notificări a eșuat:", err);
      });
    });
  });
})();
</script>`;
}


function buildSmartInstallHtml(brandName, lang) {
  const texts = getExtraLabels(lang);
  return `
<div id="installBanner" class="install-banner" style="display:none">
  <span class="install-banner-icon">📱</span>
  <span class="install-banner-text"><strong>${escapeHtml(brandName)}</strong> ${escapeHtml(texts.instBanner)} <u>${escapeHtml(texts.instGuide)}</u></span>
  <button type="button" id="installBannerClose" class="install-banner-close" aria-label="Close">✕</button>
</div>
<div id="installOverlay" class="install-overlay">
  <div class="install-modal">
    <div class="install-modal-header">
      <h3>${escapeHtml(texts.instTitle)} ${escapeHtml(brandName)}</h3>
      <button type="button" id="installModalClose" class="install-modal-close" aria-label="Close">✕</button>
    </div>
    <div id="installModalBody"></div>
  </div>
</div>`;
}


function buildSmartInstallScript(nonce, lang) {
  const texts = getExtraLabels(lang);
  return `
<script nonce="${nonce}">
(function(){
  function isStandalone(){ return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true; }
  if (isStandalone()) return;

  var ua = window.navigator.userAgent;
  function isIOS(){ return /iphone|ipad|ipod/i.test(ua); }
  // Toate browserele iOS "non-Safari" recunoscute prin identificatorul lor
  // real din user agent — CriOS (Chrome), FxiOS (Firefox), EdgiOS (Edge),
  // OPiOS (Opera), GSA (aplicația Google — are propriul motor de căutare +
  // browser intern, complet diferit de Safari, deși mulți cred că-i "Chrome"),
  // plus browserele integrate din aplicații (Facebook, Instagram, Messenger,
  // Google) care se deschid ca un "mini-browser" în interiorul aplicației.
  function isIOSSafari(){ return isIOS() && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line\\/|MicroMessenger/i.test(ua); }

  var banner = document.getElementById("installBanner");
  var overlay = document.getElementById("installOverlay");
  var modalBody = document.getElementById("installModalBody");
  var closeBtn = document.getElementById("installBannerClose");
  var modalCloseBtn = document.getElementById("installModalClose");
  var deferredPrompt = null;

  var DISMISS_KEY = "oht_install_dismissed";
  // sessionStorage, NU localStorage — cerut explicit: bannerul trebuie să
  // rămână ascuns doar cât timp aplicația e instalată (deja acoperit
  // corect de isStandalone(), mai sus), nu permanent, în Safari normal.
  // Nu există niciun eveniment "aplicația a fost dezinstalată" pe care
  // JavaScript să-l poată detecta pe iOS — cel mai apropiat comportament
  // realizabil e ca "X"-ul să țină doar pentru sesiunea curentă (tab-ul
  // deschis acum), reapărând natural la următoarea vizită din Safari/Google,
  // fără să deranjeze în timpul aceleiași vizite.
  function dismissed(){
    try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch(e){ return false; }
  }

  window.addEventListener("beforeinstallprompt", function(e){
    e.preventDefault();
    deferredPrompt = e;
    if (banner && !dismissed()) banner.style.display = "flex";
  });
  window.addEventListener("appinstalled", function(){
    if (banner) banner.style.display = "none";
    deferredPrompt = null;
  });

  if (isIOS() && !dismissed() && banner) {
    banner.style.display = "flex";
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", function(e){
      e.stopPropagation();
      banner.style.display = "none";
      try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch(err){}
    });
  }

  function openModal(){
    if (!overlay || !modalBody) return;
    var html = "";
    if (deferredPrompt) {
      html = \'<button type="button" class="install-confirm-btn" id="installNativeBtn">\' + ${JSON.stringify(texts.instNow)} + \'</button>\';
    } else if (isIOS() && !isIOSSafari()) {
      html = \'<p>\' + ${JSON.stringify(texts.instNeedSafari)} + \'</p>\' +
             \'<a href="x-safari-\' + window.location.href.split("#")[0] + \'#_install" class="install-safari-btn">\' + ${JSON.stringify(texts.instOpenSafari)} + \'</a>\' +
             \'<p class="install-fallback-text">\' + ${JSON.stringify(texts.instFallback)} + \' <strong>\' + window.location.hostname + \'</strong>.</p>\';
    } else if (isIOSSafari()) {
      html = \'<div class="install-step-card"><strong>\' + ${JSON.stringify(texts.instForIphone)} + \'</strong><p>\' + ${JSON.stringify(texts.instSteps)} + \'</p></div>\' +
             \'<button type="button" class="install-confirm-btn" id="installGotItBtn">\' + ${JSON.stringify(texts.instGotIt)} + \'</button>\';
    } else {
      html = \'<p>\' + ${JSON.stringify(texts.instGeneric)} + \'</p>\';
    }
    modalBody.innerHTML = html;
    overlay.classList.add("active");

    var nativeBtn = document.getElementById("installNativeBtn");
    if (nativeBtn) {
      nativeBtn.addEventListener("click", function(){
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function(){ deferredPrompt = null; overlay.classList.remove("active"); if (banner) banner.style.display = "none"; });
      });
    }
    var gotItBtn = document.getElementById("installGotItBtn");
    if (gotItBtn) {
      gotItBtn.addEventListener("click", function(){ overlay.classList.remove("active"); });
    }
  }

  // vine cineva de la redirectul "Deschide în Safari" (marcaj #_install în URL)
  // — deschide direct instrucțiunile, fără să mai ceară un al doilea click pe
  // banner (bug real, prins prin testare directă cu utilizatorul, semnalat
  // clar: la modelul de referință, instrucțiunile apar automat, nu la cerere).
  if (window.location.hash === "#_install" && isIOSSafari()) {
    openModal();
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  if (banner) {
    banner.addEventListener("click", function(e){
      if (e.target === closeBtn) return;
      openModal();
    });
  }
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", function(){ overlay.classList.remove("active"); });
  }
  if (overlay) {
    overlay.addEventListener("click", function(e){ if (e.target === overlay) overlay.classList.remove("active"); });
  }
})();
</script>`;
}


// Script pentru bara de tab-uri (Magazine / Obiective Turistice) — comută
// clasele "active" pe tab-ul apăsat și pe panoul corespunzător. Generic,
// reutilizabil pe orice pagină care randează markup-ul .sub-nav-tabs.
function buildTabsScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  // Bug real, semnalat direct: pe paginile de oraș, tab-urile „Magazine” /
  // „Obiective turistice” rămâneau invizibile la nesfârșit — nu doar urât,
  // chiar nefuncționale, indiferent pe care apăsai. Cauza: clasa
  // "filter-restore-pending" (pusă foarte devreme, în <head>, dacă
  // vizitatorul mai alesese vreodată o țară pe prima pagină) ascunde
  // ".sub-nav-panel" prin CSS, iar până acum era scoasă DOAR de scriptul
  // barei de țări de pe prima pagină — care nu există pe paginile de oraș.
  // O scoatem și aici, ca să nu mai depindă de o pagină complet diferită.
  document.documentElement.classList.remove("filter-restore-pending");
  var tabs = document.querySelectorAll(".sub-nav-tab");
  if (!tabs.length) return;
  function activate(target){
    tabs.forEach(function(t){ t.classList.toggle("active", t.getAttribute("data-tab") === target); });
    document.querySelectorAll(".sub-nav-panel").forEach(function(panel){
      panel.classList.toggle("active", panel.getAttribute("data-panel") === target);
    });
  }
  tabs.forEach(function(tab){
    tab.addEventListener("click", function(){ activate(tab.getAttribute("data-tab")); });
  });

  // vine cineva din bara de jos (#favoritesList, #citySearchInput) —
  // activăm tab-ul potrivit și facem scroll manual. Hash-ul original a
  // fost deja scos din URL, cât mai devreme posibil (vezi scriptul din
  // <head>), tocmai ca să prevenim saltul nativ al browserului spre o
  // ancoră încă ascunsă — ținta reală vine acum din window.__poaPendingHash.
  var hash = window.__poaPendingHash || "";
  if (hash === "favorites" || hash === "favoritesList") {
    activate("favorites");
    var favEl = document.getElementById("favoritesList");
    if (favEl) favEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (hash === "search" || hash === "citySearchInput" || hash === "siteSearchInput") {
    var input = document.getElementById("siteSearchInput") || document.getElementById("citySearchInput");
    if (input) { input.focus(); input.scrollIntoView({ behavior: "smooth", block: "center" }); }
  }
  if (hash === "cityMap") {
    var mapEl = document.getElementById("cityMap");
    if (mapEl) mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  // vine de la butonul "Lângă mine", apăsat în timp ce tab-ul Obiective
  // Turistice era activ — bug real, semnalat direct: pagina orașului se
  // deschidea mereu cu tab-ul Magazine implicit, ignorând ce alesese
  // utilizatorul înainte de a apăsa geolocalizarea.
  if (hash === "attractions") {
    activate("attractions");
  }
})();
</script>`;
}


// Script pentru căutarea instant (magazine + atracții, toate țările) și pentru
// favorite (salvate local, în browser — vezi nota din răspuns despre limitări).
// Un singur handler delegat pentru toate steluțele ☆/★, oriunde apar pe pagină.
// Acordeon de obiective turistice, cu lazy-loading — widget-ul GetYourGuide
// se încarcă DOAR când utilizatorul deschide un anumit obiectiv, nu la
// încărcarea paginii (321 de widget-uri deodată ar distruge Core Web
// Vitals). Script-ul GYG se încarcă o singură dată, la prima deschidere,
// indiferent câte obiective deschide utilizatorul după aceea.
// Plasă de siguranță: dacă widget-ul nu apare în ~2.5s (script indisponibil,
// obiectiv fără activități reale pe GetYourGuide etc.), arătăm un link text
// simplu, funcțional, spre căutarea generală — nu rămâne niciodată un
// buton "mort".
function buildAttractionAccordionScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  // Widget-ul GetYourGuide nu poate fi parametrizat dinamic, per obiectiv,
  // din JavaScript — confirmat direct din contul de partener: codul rămas
  // identic indiferent de textul de căutare introdus în configurator.
  // Configurarea trăiește pe serverele lor, nu în HTML-ul pe care-l
  // controlăm. Renunțăm la widget — arătăm direct link-ul de bilete
  // (real, per obiectiv, unde-l avem — altfel cel general), simplu și
  // sigur funcțional, imediat ce utilizatorul deschide un obiectiv.
  //
  // FIX real, găsit prin testare directă: obiectivele oricărei țări NU
  // primite direct la încărcarea paginii (adică toate în afară de cea
  // detectată automat) se încarcă mai târziu, prin fetch (vezi
  // buildAttractionLazyScript) — abia când utilizatorul deschide acea
  // țară. Legarea de mai jos, dacă rula o singură dată la încărcarea
  // paginii (document.querySelectorAll + addEventListener pe fiecare),
  // NU prindea niciodată elementele adăugate ulterior în DOM — click-ul
  // nu făcea absolut nimic, fără nicio eroare vizibilă. Rezolvat cu
  // DELEGARE de evenimente pe "document" — UN SINGUR listener, care
  // funcționează automat pentru orice element .attraction-accordion-header
  // existent ACUM sau adăugat oricând mai târziu, fără nicio legare
  // suplimentară necesară după fiecare fetch.
  document.addEventListener("click", function(e){
    var header = e.target.closest(".attraction-accordion-header");
    if (!header) return;
    var item = header.closest(".attraction-accordion-item");
    var panel = item.querySelector(".attraction-accordion-panel");
    var isOpen = item.classList.toggle("is-open");
    header.setAttribute("aria-expanded", String(isOpen));
    panel.hidden = !isOpen;
    if (isOpen) {
      var fallback = item.querySelector(".gyg-widget-fallback");
      if (fallback) fallback.style.display = "block";
    }
  });
})();
</script>`;
}

function mapUnifiedToggleLabelFor(lang) { return MAP_UNIFIED_TOGGLE_LABELS[lang] || MAP_UNIFIED_TOGGLE_LABELS.uk; }

function mapLoadingStoresLabelFor(lang) { return MAP_LOADING_STORES_LABELS[lang] || MAP_LOADING_STORES_LABELS.uk; }

function mapLoadingAttractionsLabelFor(lang) { return MAP_LOADING_ATTRACTIONS_LABELS[lang] || MAP_LOADING_ATTRACTIONS_LABELS.uk; }


function buildCityMapHtml(coords, cityName, nonce, lang) {
  if (!coords) return "";

  const toggleHtml = `<p id="mapLiveStatus" class="map-live-status">${escapeHtml(mapLoadingStoresLabelFor(lang))}</p>
<p id="mapAttractionsLiveStatus" class="map-live-status">${escapeHtml(mapLoadingAttractionsLabelFor(lang))}</p>`;

  // dacă avem cheie Google Maps, o folosim pe aceea — altfel, fallback automat
  // pe OpenStreetMap + Leaflet (gratuit, fără cont/cheie necesară)
  if (googleMapsApiKey) {
    return `
${toggleHtml}
<div id="cityMap" class="city-map"></div>
<script nonce="${nonce}">
  window.__initCityMap_${cityName.replace(/[^a-zA-Z0-9]/g, "")} = function(){
    var el = document.getElementById("cityMap");
    if (!el || typeof google === "undefined") return;
    var center = { lat: ${coords[0]}, lng: ${coords[1]} };
    window.__cityMapInstance = new google.maps.Map(el, { center: center, zoom: 12, disableDefaultUI: false });
    window.__cityMapBackend = "google";
  };
</script>
<script src="https://maps.googleapis.com/maps/api/js?key=${escapeHtml(googleMapsApiKey)}&callback=__initCityMap_${cityName.replace(/[^a-zA-Z0-9]/g, "")}" async defer></script>`;
  }

  return `
${toggleHtml}
<div id="cityMap" class="city-map"></div>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="anonymous">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin="anonymous" defer></script>
<script nonce="${nonce}">
(function(){
  // defer (adaugat pentru viteza -- nu mai blocheaza randarea paginii cat
  // timp se descarca harta de la unpkg.com) -- scripturile "defer" ruleaza,
  // garantat, in ordine, INAINTE de "DOMContentLoaded", deci asteptam exact
  // acel eveniment, ca sa fim siguri ca "L" (Leaflet) chiar exista la acel
  // moment, nu doar presupunem asta imediat, sincron, ca inainte.
  function initCityMap(){
    if (typeof L === "undefined") return;
    var el = document.getElementById("cityMap");
    if (!el) return;
    window.__cityMapInstance = L.map(el, { zoomControl: true, scrollWheelZoom: false }).setView([${coords[0]}, ${coords[1]}], 12);
    window.__cityMapBackend = "leaflet";
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(window.__cityMapInstance);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCityMap);
  } else {
    initCityMap();
  }
})();
</script>`;
}


// Pinuri live, per magazin — cere /api/city-live-map (vezi ruta din
// server.js), așteaptă ca harta de bază să fie gata (Google Maps se
// inițializează asincron, Leaflet sincron — verificăm periodic, simplu,
// nu presupunem care dintre ele), apoi adaugă un pin verde/roșu per
// magazin, cu comutator "doar deschise acum" care le filtrează pe loc,
// fără o nouă cerere către server.
function buildLiveMapPinsScript(orasDisplay, lang, nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var statusEl = document.getElementById("mapLiveStatus");
  var toggle = document.getElementById("storeListOpenOnlyToggle");
  if (!statusEl) return;

  function whenMapReady(cb, attemptsLeft){
    if (window.__cityMapInstance) { cb(); return; }
    if (attemptsLeft <= 0) return;
    setTimeout(function(){ whenMapReady(cb, attemptsLeft - 1); }, 200);
  }

  whenMapReady(function(){
    fetch("/api/city-live-map?oras=" + encodeURIComponent(${safeJson(orasDisplay)}) + "&lang=" + encodeURIComponent(${safeJson(lang)}))
      .then(function(r){ return r.json(); })
      .then(function(data){
        var stores = (data && data.stores) || [];
        if (!stores.length) { statusEl.textContent = ""; statusEl.hidden = true; return; } // fără coordonate (Google Places dezactivat) — nu mai afișăm un mesaj care derutează
        statusEl.textContent = stores.length + " magazine găsite — " + stores.filter(function(s){ return s.isOpenNow; }).length + " deschise acum.";

        // Pin clasic (bilă sus, vârf ascuțit jos, care indică exact locația)
        // — cerut explicit, în loc de "bulina" plină de dinainte (un simplu
        // cerc). Aceeași formă SVG pentru ambele motoare de hartă (Leaflet
        // și Google Maps, motorul de rezervă), ca aspectul să fie identic
        // indiferent care dintre ele se activează.
        var PIN_SVG_PATH = "M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z";
        function buildPinSvgHtml(color){
          return '<svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))"><path d="' + PIN_SVG_PATH + '" fill="' + color + '" stroke="#1a1a1a" stroke-width="0.5"/></svg>';
        }

        var markers = [];
        var backend = window.__cityMapBackend;

        stores.forEach(function(store){
          var color = store.isOpenNow ? "#22C55E" : "#DC2626";
          var marker;
          if (backend === "google" && typeof google !== "undefined") {
            marker = new google.maps.Marker({
              position: { lat: store.lat, lng: store.lng },
              map: window.__cityMapInstance,
              title: store.name,
              icon: {
                path: PIN_SVG_PATH,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: "#1a1a1a",
                strokeWeight: 1,
                scale: 1.4,
                anchor: new google.maps.Point(12, 24),
              },
            });
          } else if (backend === "leaflet" && typeof L !== "undefined") {
            var pinIcon = L.divIcon({
              html: buildPinSvgHtml(color),
              className: "",
              iconSize: [28, 28],
              iconAnchor: [14, 28], // vârful pinului indică exact coordonata, nu centrul
              popupAnchor: [0, -28],
            });
            marker = L.marker([store.lat, store.lng], { icon: pinIcon })
              .addTo(window.__cityMapInstance)
              .bindPopup(store.name + (store.isOpenNow ? " — deschis acum" : " — închis acum"));
          }
          if (marker) markers.push({ marker: marker, isOpenNow: store.isOpenNow, backend: backend });
        });

        function applyFilter(){
          var onlyOpen = toggle && toggle.checked;
          markers.forEach(function(m){
            var visible = !onlyOpen || m.isOpenNow;
            if (m.backend === "google") {
              m.marker.setVisible(visible);
            } else {
              var el = m.marker.getElement && m.marker.getElement();
              if (el) el.style.display = visible ? "" : "none";
            }
          });
        }

        if (toggle) toggle.addEventListener("change", applyFilter);
      })
      .catch(function(){ statusEl.textContent = "Nu am putut încărca statusul live al magazinelor."; });
  }, 25); // ~5 secunde, la 200ms interval — suficient pentru orice mod de inițializare
})();
</script>`;
}


// Pinuri de OBIECTIVE TURISTICE, pe aceeași hartă — la cerere explicită.
// Culoare distinctă (albastru/gri), NU verde/roșu ca la magazine, ca cele
// două categorii să fie ușor de distins vizual din prima privire, fără
// legendă separată.
function buildLiveAttractionsMapPinsScript(orasDisplay, countryCode, lang, nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var statusEl = document.getElementById("mapAttractionsLiveStatus");
  var toggle = document.getElementById("storeListOpenOnlyToggle");
  if (!statusEl) return;

  function whenMapReady(cb, attemptsLeft){
    if (window.__cityMapInstance) { cb(); return; }
    if (attemptsLeft <= 0) return;
    setTimeout(function(){ whenMapReady(cb, attemptsLeft - 1); }, 200);
  }

  whenMapReady(function(){
    fetch("/api/city-attractions-map?oras=" + encodeURIComponent(${safeJson(orasDisplay)}) + "&tara=" + encodeURIComponent(${safeJson(countryCode)}) + "&lang=" + encodeURIComponent(${safeJson(lang)}))
      .then(function(r){ return r.json(); })
      .then(function(data){
        var attractions = (data && data.attractions) || [];
        if (!attractions.length) { statusEl.textContent = ""; statusEl.hidden = true; return; } // fără coordonate (Google Places dezactivat) — nu mai afișăm un mesaj care derutează
        statusEl.textContent = attractions.length + " obiective găsite — " + attractions.filter(function(a){ return a.isOpenNow; }).length + " deschise acum.";

        var PIN_SVG_PATH = "M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z";
        function buildPinSvgHtml(color){
          return '<svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))"><path d="' + PIN_SVG_PATH + '" fill="' + color + '" stroke="#1a1a1a" stroke-width="0.5"/></svg>';
        }

        var markers = [];
        var backend = window.__cityMapBackend;

        attractions.forEach(function(attraction){
          // albastru = deschis/acces liber, gri = închis SAU necunoscut —
          // deliberat, nu roșu (roșu ar sugera o certitudine "închis" pe
          // care n-o avem mereu; gri comunică mai corect incertitudinea)
          var color = attraction.isOpenNow ? "#3B82F6" : "#6B7280";
          var marker;
          if (backend === "google" && typeof google !== "undefined") {
            marker = new google.maps.Marker({
              position: { lat: attraction.lat, lng: attraction.lng },
              map: window.__cityMapInstance,
              title: attraction.name,
              icon: {
                path: PIN_SVG_PATH,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: "#1a1a1a",
                strokeWeight: 1,
                scale: 1.4,
                anchor: new google.maps.Point(12, 24),
              },
            });
          } else if (backend === "leaflet" && typeof L !== "undefined") {
            var pinIcon = L.divIcon({
              html: buildPinSvgHtml(color),
              className: "",
              iconSize: [28, 28],
              iconAnchor: [14, 28],
              popupAnchor: [0, -28],
            });
            marker = L.marker([attraction.lat, attraction.lng], { icon: pinIcon })
              .addTo(window.__cityMapInstance)
              .bindPopup(attraction.name + (attraction.isOpenNow ? " — deschis acum" : " — închis acum / necunoscut"));
          }
          if (marker) markers.push({ marker: marker, isOpenNow: attraction.isOpenNow, backend: backend });
        });

        function applyFilter(){
          var onlyOpen = toggle && toggle.checked;
          markers.forEach(function(m){
            var visible = !onlyOpen || m.isOpenNow;
            if (m.backend === "google") {
              m.marker.setVisible(visible);
            } else {
              var el = m.marker.getElement && m.marker.getElement();
              if (el) el.style.display = visible ? "" : "none";
            }
          });
        }

        if (toggle) toggle.addEventListener("change", applyFilter);
      })
      .catch(function(){ statusEl.textContent = "Nu am putut încărca obiectivele turistice."; });
  }, 25);
})();
</script>`;
}



// Filtrare "doar deschise acum" pe LISTA de obiective de pe prima pagină
// (nu doar pe hartă) — cerut explicit ("de ce doar la hartă, nu și pe
// prima pagină?"). Calculăm status-ul complet CLIENT-SIDE, folosind aceeași
// logică exactă de pe server (categorie + acces liber) — NICIO cerere nouă
// către server sau Google, cost $0, la fel ca la insignele de magazine.
// NU verifică date live individuale (ar necesita o cerere per obiectiv,
// exact ce evităm) — doar acces liber + program generic pe categorie,
// aceeași aproximare, nu perfectă, dar suficientă pentru un filtru rapid.
function buildAttractionListFilterScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var STORAGE_KEY = "poa_open_only_mode_v1";
  var SCHEDULES = ${safeJson(CATEGORY_GENERIC_SCHEDULE)};
  var FREE_PREFIXES_BY_CATEGORY = ${safeJson(FREE_ACCESS_PREFIXES_BY_CATEGORY)};
  var FREE_CATEGORIES = ${safeJson(FREE_ACCESS_CATEGORIES)};
  var FREE_KW = new RegExp(${safeJson(FREE_ACCESS_KEYWORDS_RE.source)});
  var FREE_EX = new RegExp(${safeJson(FREE_ACCESS_EXCLUDE_RE.source)});
  var FREE_DAM = new RegExp(${safeJson(FREE_ACCESS_DAM_RE.source)});
  var FREE_SKIP = ${safeJson(FREE_ACCESS_SKIP_CATEGORIES)};

  function isFreeAccess(name, category){
    var prefixes = FREE_PREFIXES_BY_CATEGORY[category];
    if (prefixes) {
      for (var i=0;i<prefixes.length;i++){
        var p = prefixes[i];
        if (name === p || name.indexOf(p + " ") === 0) return true;
      }
    }
    var n = String(name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (FREE_SKIP.indexOf(category) !== -1 && !FREE_DAM.test(n)) return false;
    return FREE_KW.test(n) && !FREE_EX.test(n);
  }

  function computeGenericOpen(schedule){
    var now = new Date();
    var today = schedule[now.getDay()];
    if (!today) return false;
    var nowMin = now.getHours()*60 + now.getMinutes();
    var op = today.open.split(":"), cl = today.close.split(":");
    var openMin = (+op[0])*60 + (+op[1]), closeMin = (+cl[0])*60 + (+cl[1]);
    return nowMin >= openMin && nowMin < closeMin;
  }

  // reflectă exact ordinea din determineAttractionOpenStatus (server) —
  // fără treapta "live" (n-o trimitem la listă, ar costa per obiectiv)
  function isOpenForFilter(name, category){
    if (isFreeAccess(name, category) || FREE_CATEGORIES.indexOf(category) !== -1) return true;
    var schedule = SCHEDULES[category];
    if (schedule) return computeGenericOpen(schedule);
    return null; // necunoscut — nu presupunem, dar nici nu ascundem (vezi mai jos)
  }

  function itemIsOpen(li){
    var star = li.querySelector(".fav-star[data-name]");
    var name = star ? star.getAttribute("data-name") : "";
    var category = li.getAttribute("data-category") || "";
    return isOpenForFilter(name, category);
  }

  // Filtrul GLOBAL (comutatorul principal, de deasupra listei) — cerut
  // explicit: sincronizat prin localStorage, ca preferința să rămână
  // activă și după ce utilizatorul comută pe tab-ul de magazine, sau chiar
  // dacă reîncarcă pagina.
  function applyGlobalFilter(){
    var toggle = document.getElementById("attractionListOpenOnlyToggle");
    var onlyOpen = toggle && toggle.checked;
    var items = document.querySelectorAll(".attraction-accordion-item");
    var visibleCount = 0;
    items.forEach(function(li){
      if (!onlyOpen) { li.style.display = ""; visibleCount++; return; }
      var closed = itemIsOpen(li) === false;
      li.style.display = closed ? "none" : "";
      if (!closed) visibleCount++;
    });
    // Mesaj "nimic deschis acum" — cerut explicit: quando filtrul ajunge la
    // 0 rezultate (ex. seara târziu), arătăm o alternativă, spre itinerarul
    // AI, în loc să lăsăm lista pur și simplu goală.
    var noResultsEl = document.getElementById("noResultsAttractionItinPromo");
    if (noResultsEl) noResultsEl.style.display = (onlyOpen && visibleCount === 0) ? "block" : "none";
  }

  // Filtrul CONTEXTUAL (checkbox-ul discret, sub titlul FIECĂREI categorii
  // extinse) — cerut explicit: independent de cel global, se aplică DOAR
  // în interiorul categoriei respective, nu salvat în localStorage (e o
  // ajustare rapidă, temporară, cât timp explorezi ACEA categorie, nu o
  // preferință de navigare pe tot site-ul).
  function applyCategoryFilter(checkbox){
    var group = checkbox.closest(".attraction-category-group");
    if (!group) return;
    var onlyOpen = checkbox.checked;
    var items = group.querySelectorAll(".attraction-accordion-item");
    items.forEach(function(li){
      if (!onlyOpen) { li.style.display = ""; return; }
      li.style.display = (itemIsOpen(li) === false) ? "none" : "";
    });
  }

  function wireCategoryCheckboxes(){
    document.querySelectorAll(".category-open-only-checkbox").forEach(function(cb){
      if (cb.__wired) return;
      cb.__wired = true;
      cb.addEventListener("change", function(){ applyCategoryFilter(cb); });
    });
  }

  // Index alfabetic (Quick-Jump) — cerut explicit, pentru categoriile mari
  // (Italia/Germania, 100+ obiective). Sare la primul obiectiv cu litera
  // aleasă, DOAR în interiorul categoriei respective (fiecare categorie
  // are propriul index, independent).
  function wireAlphaButtons(){
    document.querySelectorAll(".alpha-index-btn").forEach(function(btn){
      if (btn.__wired) return;
      btn.__wired = true;
      btn.addEventListener("click", function(){
        var group = btn.closest(".attraction-category-group");
        if (!group) return;
        var letter = btn.getAttribute("data-jump-letter");
        var target = group.querySelector('.attraction-accordion-item[data-letter="' + letter + '"]');
        if (target && target.scrollIntoView) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          target.classList.add("alpha-jump-highlight");
          setTimeout(function(){ target.classList.remove("alpha-jump-highlight"); }, 1500);
        }
      });
    });
  }

  // Sortare "Recomandate primele" — cerut explicit: reordonare pur
  // client-side (fără nicio cerere nouă către server), mută elementele cu
  // data-recommended="true" la începutul listei, păstrând restul ordinii
  // (deja alfabetică) neschimbate. Independent per categorie, ca la
  // filtrul contextual.
  function wireRecommendedFirstCheckboxes(){
    document.querySelectorAll(".category-recommended-first-checkbox").forEach(function(cb){
      if (cb.__wired) return;
      cb.__wired = true;
      cb.addEventListener("change", function(){
        var group = cb.closest(".attraction-category-group");
        if (!group) return;
        var list = group.querySelector(".attraction-accordion-list");
        if (!list) return;
        var items = Array.prototype.slice.call(list.children);
        if (cb.checked) {
          var recommended = items.filter(function(li){ return li.getAttribute("data-recommended") === "true"; });
          var rest = items.filter(function(li){ return li.getAttribute("data-recommended") !== "true"; });
          recommended.concat(rest).forEach(function(li){ list.appendChild(li); });
        } else {
          // revenim la ordinea alfabetică originală, salvată prima dată
          if (!list.__originalOrder) list.__originalOrder = items.slice();
          list.__originalOrder.forEach(function(li){ list.appendChild(li); });
        }
      });
    });
  }


  var globalToggle = document.getElementById("attractionListOpenOnlyToggle");
  if (globalToggle) {
    // la încărcare — preia preferința salvată (dacă exista, de la
    // comutatorul de magazine sau de la o vizită anterioară)
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") globalToggle.checked = true;
    } catch (e) {}
    globalToggle.addEventListener("change", function(){
      try { localStorage.setItem(STORAGE_KEY, globalToggle.checked ? "1" : "0"); } catch (e) {}
      applyGlobalFilter();
    });
    applyGlobalFilter();
  }

  wireCategoryCheckboxes();
  wireAlphaButtons();
  wireRecommendedFirstCheckboxes();

  // MutationObserver — prinde și blocurile de țară încărcate leneș ulterior
  // (fiecare țară se încarcă la cerere, când utilizatorul o selectează)
  var observer = new MutationObserver(function(){
    wireCategoryCheckboxes();
    wireAlphaButtons();
    wireRecommendedFirstCheckboxes();
    if (globalToggle && globalToggle.checked) applyGlobalFilter();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
</script>`;
}


// Aduce obiectivele unei țări DOAR când chiar sunt cerute — fie prin
// deschiderea unui <details> în tab-ul "toate țările", fie prin selectarea
// steagului acelei țări (vezi selectCountry, în buildCountryFilterScript,
// care apelează window.__ohtLoadAttractions). La scară (multe țări, mii de
// obiective posibile per țară), asta e diferența dintre un homepage de
// câțiva KB și unul de câțiva MB. Cache simplu, în memorie, pe durata
// paginii — al doilea acces la aceeași țară nu mai face niciun fetch.
// IMPORTANT: acest script trebuie randat ÎNAINTEA lui buildCountryFilterScript
// — altfel window.__ohtLoadAttractions n-ar exista încă la selecția inițială.
function buildAttractionLazyScript(nonce, lang) {
  return `
<script nonce="${nonce}">
(function(){
  var LANG = ${safeJson(lang)};
  var cache = {};
  window.__ohtLoadAttractions = function(code, container){
    if (!container) return;
    if (cache[code]) {
      container.innerHTML = cache[code];
      if (typeof window.refreshFavoriteStars === "function") window.refreshFavoriteStars();
      return;
    }
    var loadingText = container.getAttribute("data-loading-text") || "…";
    container.textContent = loadingText;
    fetch("/api/attractions/" + code + ".json?lang=" + encodeURIComponent(LANG))
      .then(function(r){ return r.json(); })
      .then(function(data){
        cache[code] = data.html;
        container.innerHTML = data.html;
        if (typeof window.refreshFavoriteStars === "function") window.refreshFavoriteStars();
      })
      .catch(function(){ container.textContent = "…"; });
  };
  document.querySelectorAll(".attraction-country-lazy").forEach(function(details){
    details.addEventListener("toggle", function(){
      if (!details.open) return;
      var code = details.getAttribute("data-lazy-country");
      window.__ohtLoadAttractions(code, details.querySelector(".lazy-attraction-target"));
    });
  });
})();
</script>`;
}


/* ============================================================
   5) RANDARE HTML — pagină completă per cerere
   ============================================================ */
function renderWeekTableRows(weekly) {
  return weekly
    .map((w, i) => {
      const hours = w ? `${w.open} – ${w.close}` : "Închis";
      return `<tr data-day="${i}"><td class="day-cell">${DAY_NAMES[i]}</td><td class="hours-cell">${hours}</td></tr>`;
    })
    .join("");
}


function renderHolidayRows(holidays) {
  if (!holidays || !holidays.length) {
    return `<div class="holiday-row"><span class="holiday-label">Fără program special momentan</span></div>`;
  }
  return holidays
    .map((h) => {
      const hoursText = h.hours ? `${h.hours[0]} – ${h.hours[1]}` : "Închis";
      const cls = h.hours ? "" : "closed";
      return `<div class="holiday-row"><span class="holiday-label">${escapeHtml(h.label)}</span><span class="holiday-hours ${cls}">${hoursText}</span></div>`;
    })
    .join("");
}


// container pentru reclamă — gol dacă codAdSense nu e completat încă (CSS îl ascunde automat)
function adSlotHtml() {
  if (!ADSENSE_ENABLED) return "";
  return `<div class="ad-slot">${codAdSense}</div>`;
}


// Bară de navigare jos, fixă, pe mobil — vizibilă pe toate paginile (vezi
// pageShell). "Hartă" e inteligent: dacă pagina curentă are deja o hartă
// (paginile de oraș), derulează la ea; altfel te duce acasă, la alegerea
// orașului — nu promite o hartă globală pe care n-o avem construită.
// Comutator manual de temă — buton mic, plutitor, adăugat o singură dată,
// în pageShell (nu în fiecare header individual — mai sigur, mai puține
// locuri de greșit). "Auto" rămâne implicit (urmează telefonul) până la
// primul click; după aceea, alegerea se ține minte (localStorage).
function buildThemeToggleHtml() {
  return `<button type="button" id="themeToggle" class="theme-toggle-btn" aria-label="Comută tema deschis/întunecat"><span id="themeToggleIcon">🌙</span></button>`;
}

function backButtonLabelFor(lang) { return BACK_BUTTON_LABELS[lang] || BACK_BUTTON_LABELS.uk; }

function submitPlaceDayName(lang, idx) {
  const names = (TRANSLATIONS[lang] && TRANSLATIONS[lang].dayNames) || DAY_NAMES;
  return names[idx];
}

function submitPlaceLabelsFor(lang) { return SUBMIT_PLACE_LABELS[lang] || SUBMIT_PLACE_LABELS.uk; }

function noMatchesLabelFor(lang) { return NO_MATCHES_LABELS[lang] || NO_MATCHES_LABELS.uk; }


// Pagina "Propune un loc nou" — cerut explicit: utilizatorii pot propune
// un magazin, obiectiv sau plajă, nu doar Google poate. Funcționează
// identic pe .ro (română fixă) și pe .eu (orice limbă suportată).
async function renderSubmitPlacePage(nonce, baseUrl, lang, isIntl) {
  const t = submitPlaceLabelsFor(lang);
  const canonical = `${baseUrl}${isIntl ? "/submit-place" : "/propune"}`;
  const countryOptionsHtml = Object.keys(COUNTRY_LABELS)
    .sort((a, b) => COUNTRY_LABELS[a].localeCompare(COUNTRY_LABELS[b]))
    .map((cc) => `<option value="${escapeHtml(cc)}"${cc === "ro" ? " selected" : ""}>${escapeHtml(COUNTRY_LABELS[cc])}</option>`)
    .join("");
  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">${isIntl ? "Opening<span>HoursToday</span>" : "Programul<span>DeAzi</span>"}</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">${isIntl ? escapeHtml(TRANSLATIONS[lang] ? TRANSLATIONS[lang].home : "Home") : "Acasă"}</a> / ${escapeHtml(t.title)}</p>
  <h1 class="page-h1">${escapeHtml(t.title)}</h1>
  <p class="intro-text">${escapeHtml(t.intro)}</p>

  <form id="submitPlaceForm" class="submit-place-form">
    <label class="submit-place-label">${escapeHtml(t.typeLabel)}
      <select id="spType" required>
        <option value="attraction">${escapeHtml(t.typeAttraction)}</option>
        <option value="store">${escapeHtml(t.typeStore)}</option>
        <option value="beach">${escapeHtml(t.typeBeach)}</option>
        ${t.typeRestaurant ? `<option value="restaurant">${escapeHtml(t.typeRestaurant)}</option>` : ""}
        ${t.typeCafe ? `<option value="cafe">${escapeHtml(t.typeCafe)}</option>` : ""}
        ${t.typeOther ? `<option value="other">${escapeHtml(t.typeOther)}</option>` : ""}
      </select>
    </label>
    ${t.otherTypeLabel ? `
    <label class="submit-place-label" id="spOtherTypeWrap" hidden>${escapeHtml(t.otherTypeLabel)}
      <input type="text" id="spOtherType" placeholder="${escapeHtml(t.otherTypePlaceholder)}" maxlength="100">
    </label>` : ""}
    <label class="submit-place-label">${escapeHtml(t.nameLabel)}
      <input type="text" id="spName" placeholder="${escapeHtml(t.namePlaceholder)}" maxlength="255" required>
    </label>
    <label class="submit-place-label">${escapeHtml(t.cityLabel)}
      <input type="text" id="spCity" placeholder="${escapeHtml(t.cityPlaceholder)}" maxlength="255" required>
    </label>
    ${t.scheduleLabel ? `
    <div class="submit-place-label">${escapeHtml(t.scheduleLabel)}
      <style>.submit-place-schedule[hidden]{display:none !important;}</style>
      <select id="spScheduleMode">
        <option value="none">${escapeHtml(lang === "ro" ? "Nu are program fix / nu știu (ex. un lac, o plajă, un traseu)" : "No fixed hours / I don't know (e.g. a lake, a beach, a trail)")}</option>
        <option value="247">${escapeHtml(t.schedule247)}</option>
        <option value="days">${escapeHtml(lang === "ro" ? "Are program pe zile" : "Has opening hours per day")}</option>
      </select>
      <div class="submit-place-schedule" id="spSchedule" hidden>
        ${SUBMIT_PLACE_SCHEDULE_DAYS.map((d) => `
        <div class="submit-place-schedule-row" data-day="${d.idx}">
          <span class="sp-day-name">${escapeHtml(submitPlaceDayName(lang, d.idx))}</span>
          <input type="time" class="sp-open" value="09:00">
          <input type="time" class="sp-close" value="18:00">
          <label class="sp-closed-toggle"><input type="checkbox" class="sp-day-closed">${escapeHtml(t.scheduleClosedLabel)}</label>
        </div>`).join("")}
      </div>
    </div>` : ""}
    <label class="submit-place-label">${escapeHtml(t.countryLabel)}
      <select id="spCountry" required>${countryOptionsHtml}</select>
    </label>
    <label class="submit-place-label">${escapeHtml(t.categoryLabel)}
      <input type="text" id="spCategory" placeholder="${escapeHtml(t.categoryPlaceholder)}" maxlength="50">
    </label>
    <label class="submit-place-label">${escapeHtml(t.mapsLabel)}
      <input type="url" id="spMapsUrl" placeholder="${escapeHtml(t.mapsPlaceholder)}" maxlength="500">
    </label>
    <label class="submit-place-label">${escapeHtml(t.noteLabel)}
      <textarea id="spNote" placeholder="${escapeHtml(t.notePlaceholder)}" maxlength="500" rows="3"></textarea>
    </label>
    <button type="submit" id="spSubmitBtn" class="submit-place-btn">${escapeHtml(t.submit)}</button>
    <p id="spThanks" class="submit-place-thanks" hidden>${escapeHtml(t.thanks)}</p>
    <p id="spError" class="submit-place-error" hidden></p>
  </form>
</main>
<script nonce="${nonce}">
(function(){
  var ERROR_GENERIC = ${safeJson(t.errorGeneric)};
  var ERROR_RATE = ${safeJson(t.errorRate)};
  var CITY_ERRORS = ${safeJson(lang === "ro"
    ? { city_not_in_country: "Orașul nu pare să fie în țara aleasă. Verifică țara și scrie doar numele localității (ex. Târgu Mureș), fără numele localului.", city_contains_name: "În câmpul „Oraș” scrie doar numele localității, fără numele localului.", city_not_a_locality: "Scrie în câmpul „Oraș” doar numele localității (ex. Târgu Mureș)." }
    : { city_not_in_country: "This city does not seem to be in the chosen country. Please check the country and enter only the town name (e.g. Targu Mures), not the venue name.", city_contains_name: "Please enter only the town name in the City field, not the venue name.", city_not_a_locality: "Please enter only the town name in the City field." })};
  var form = document.getElementById("submitPlaceForm");
  var btn = document.getElementById("spSubmitBtn");
  var thanks = document.getElementById("spThanks");
  var errorBox = document.getElementById("spError");
  var spMode = document.getElementById("spScheduleMode");
  var spSchedule = document.getElementById("spSchedule");
  var spType = document.getElementById("spType");
  var spOtherTypeWrap = document.getElementById("spOtherTypeWrap");
  var spOtherType = document.getElementById("spOtherType");
  if (spType && spOtherTypeWrap && spOtherType) {
    spType.addEventListener("change", function(){
      var isOther = spType.value === "other";
      spOtherTypeWrap.hidden = !isOther;
      if (isOther) { spOtherType.setAttribute("required", "required"); }
      else { spOtherType.removeAttribute("required"); spOtherType.value = ""; }
    });
  }
  if (spMode && spSchedule) {
    spMode.addEventListener("change", function(){ spSchedule.hidden = spMode.value !== "days"; });
    spSchedule.querySelectorAll(".submit-place-schedule-row").forEach(function(row){
      var closedBox = row.querySelector(".sp-day-closed");
      closedBox.addEventListener("change", function(){
        row.classList.toggle("is-day-closed", closedBox.checked);
      });
    });
  }
  function collectSchedule(){
    if (!spSchedule || !spMode || spMode.value === "none") return null;
    if (spMode.value === "247") return { is247: true, days: null };
    var days = {};
    spSchedule.querySelectorAll(".submit-place-schedule-row").forEach(function(row){
      var idx = row.getAttribute("data-day");
      var closed = row.querySelector(".sp-day-closed").checked;
      days[idx] = closed ? { closed: true } : {
        open: row.querySelector(".sp-open").value,
        close: row.querySelector(".sp-close").value,
      };
    });
    return { is247: false, days: days };
  }
  form.addEventListener("submit", function(e){
    e.preventDefault();
    errorBox.hidden = true;
    btn.disabled = true;
    fetch("/api/propune-loc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: document.getElementById("spType").value,
        otherType: spOtherType ? spOtherType.value : "",
        name: document.getElementById("spName").value,
        city: document.getElementById("spCity").value,
        countryCode: document.getElementById("spCountry").value,
        category: document.getElementById("spCategory").value,
        mapsUrl: document.getElementById("spMapsUrl").value,
        note: document.getElementById("spNote").value,
        schedule: collectSchedule(),
      }),
    })
      .then(function(r){ return r.json().then(function(data){ return { ok: r.ok, status: r.status, data: data }; }); })
      .then(function(res){
        if (res.ok) {
          form.querySelectorAll("input, select, textarea, button").forEach(function(el){ el.disabled = true; });
          thanks.hidden = false;
        } else {
          errorBox.textContent = res.status === 429 ? ERROR_RATE : (res.data && CITY_ERRORS[res.data.error]) || ERROR_GENERIC;
          errorBox.hidden = false;
          btn.disabled = false;
        }
      })
      .catch(function(){
        errorBox.textContent = ERROR_GENERIC;
        errorBox.hidden = false;
        btn.disabled = false;
      });
  });
})();
</script>`;
  return pageShell({ title: t.title, description: t.intro, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: lang });
}

function buildGlobalBackButtonHtml(langCode) {
  return `<button type="button" id="globalBackBtn" class="global-back-btn" aria-label="${escapeHtml(backButtonLabelFor(langCode))}" hidden>←</button>`;
}

function buildGlobalBackButtonScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var btn = document.getElementById("globalBackBtn");
  if (!btn) return;
  // ascuns pe pagina principală (nimic "inapoi" relevant acolo) — și doar
  // dacă chiar există istoric de navigare în tab-ul curent (altfel
  // history.back() n-ar face nimic vizibil)
  var path = window.location.pathname;
  var isHome = path === "/" || /^\\/[a-z]{2}\\/?$/.test(path);
  var headerRow = document.querySelector(".header-row");
  if (headerRow) headerRow.insertBefore(btn, headerRow.firstChild);
  var backHref = btn.getAttribute("data-back-href");
  if (isHome || (!backHref && window.history.length <= 1)) return;
  btn.hidden = false;

  // --- Buton plutitor trasabil: stă implicit stânga-sus, dar poate fi
  // mutat cu degetul/mouse-ul oriunde pe verticală, iar la eliberare se
  // lipește de marginea (stânga sau dreapta) cea mai apropiată, ca să nu
  // rămână niciodată în mijlocul textului. Poziția aleasă e reținută
  // (per dispozitiv) și se păstrează la navigarea pe alte pagini.
  var STORAGE_KEY = "backBtnPos";
  var EDGE_MARGIN = 10;
  var dragging = false, moved = false, suppressClick = false;
  var startX, startY, startLeft, startTop;

  function headerBottom(){
    var header = document.querySelector("header");
    return header ? header.getBoundingClientRect().bottom : 60;
  }
  function bottomLimit(){
    var nav = document.querySelector(".bottom-nav");
    var navH = (nav && getComputedStyle(nav).display !== "none") ? nav.getBoundingClientRect().height : 0;
    return window.innerHeight - navH - EDGE_MARGIN - btn.offsetHeight;
  }
  // lățimea vizibilă, FĂRĂ bara de derulare de pe desktop (fixed se poziționează
  // față de ea; cu innerWidth butonul de pe dreapta ieșea parțial din ecran)
  function viewW(){ return document.documentElement.clientWidth || window.innerWidth; }
  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

  function applyPosition(left, top){
    var maxLeft = viewW() - btn.offsetWidth - EDGE_MARGIN;
    var minTop = headerBottom() + EDGE_MARGIN;
    var maxTop = Math.max(minTop, bottomLimit());
    left = clamp(left, EDGE_MARGIN, Math.max(EDGE_MARGIN, maxLeft));
    top = clamp(top, minTop, maxTop);
    btn.style.left = left + "px";
    btn.style.top = top + "px";
    btn.style.right = "auto";
    return { left: left, top: top };
  }

  function savePosition(left, top){
    try {
      var side = (left + btn.offsetWidth / 2) < (viewW() / 2) ? "left" : "right";
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ side: side, top: top }));
    } catch (e) {}
  }

  function restorePosition(){
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (e) {}
    if (!saved) return;
    var left = saved.side === "right"
      ? viewW() - btn.offsetWidth - EDGE_MARGIN
      : EDGE_MARGIN;
    applyPosition(left, saved.top);
  }

  function snapToNearestEdge(left, top){
    var center = left + btn.offsetWidth / 2;
    var snappedLeft = center < viewW() / 2
      ? EDGE_MARGIN
      : viewW() - btn.offsetWidth - EDGE_MARGIN;
    btn.style.transition = "left .25s cubic-bezier(.22,1,.36,1), top .25s cubic-bezier(.22,1,.36,1)";
    var pos = applyPosition(snappedLeft, top);
    savePosition(pos.left, pos.top);
    window.setTimeout(function(){ btn.style.transition = ""; }, 260);
  }

  function onPointerDown(e){
    if (e.button !== undefined && e.button !== 0) return; // doar click stânga la mouse
    if (e.pointerType === "mouse") e.preventDefault(); // fără selecție de text / drag nativ la mouse
    dragging = true;
    moved = false;
    var rect = btn.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    startX = e.clientX;
    startY = e.clientY;
    btn.classList.add("is-dragging");
    if (btn.setPointerCapture && e.pointerId != null) {
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
    }
  }
  function onPointerMove(e){
    if (!dragging) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (!moved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) moved = true;
    if (!moved) return;
    e.preventDefault();
    applyPosition(startLeft + dx, startTop + dy);
  }
  function onPointerUp(){
    if (!dragging) return;
    dragging = false;
    btn.classList.remove("is-dragging");
    if (moved) {
      suppressClick = true;
      var rect = btn.getBoundingClientRect();
      snapToNearestEdge(rect.left, rect.top);
    }
  }

  btn.addEventListener("pointerdown", onPointerDown);
  // Pe paginile cu poze (ex. /cazare), browserul pornea uneori un „drag”
  // nativ pe imaginea de dedesubt și anula tragerea butonului — îl blocăm
  // doar cât timp butonul e ținut apăsat.
  document.addEventListener("dragstart", function(ev){ if (dragging) ev.preventDefault(); }, true);
  btn.setAttribute("draggable", "false");
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("resize", function(){
    var rect = btn.getBoundingClientRect();
    applyPosition(rect.left, rect.top);
  });

  btn.addEventListener("click", function(ev){
    if (suppressClick) { suppressClick = false; ev.preventDefault(); ev.stopPropagation(); return; }
    if (backHref) {
      // pagină cu „părinte” fix: dacă venim chiar de acolo, ne întoarcem în
      // istoric (istoric curat); altfel mergem direct la pagina-părinte
      try {
        var ref = document.referrer ? new URL(document.referrer) : null;
        if (ref && ref.origin === window.location.origin && ref.pathname === backHref && window.history.length > 1) { window.history.back(); return; }
      } catch (e) {}
      window.location.href = backHref;
      return;
    }
    window.history.back();
  });

  restorePosition();
})();
</script>`;
}


function buildThemeToggleScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var btn = document.getElementById("themeToggle");
  var icon = document.getElementById("themeToggleIcon");
  if (!btn || !icon) return;

  // mutăm butonul efectiv în interiorul header-ului (nu trebuie atinsă
  // fiecare pagină individual — se întâmplă o singură dată, aici)
  var headerRow = document.querySelector(".header-row");
  if (headerRow) {
    headerRow.appendChild(btn);
    btn.classList.add("in-header");
  }

  function effectiveTheme(){
    var explicit = document.documentElement.getAttribute("data-theme");
    if (explicit) return explicit;
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark";
  }
  function syncIcon(){
    icon.textContent = effectiveTheme() === "dark" ? "☀️" : "🌙";
  }

  syncIcon();
  btn.addEventListener("click", function(){
    var next = effectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch(e){}
    syncIcon();
  });
})();
</script>`;
}

function buildBottomNavHtml(langCode, countryCode) {
  const labels = BOTTOM_NAV_LABELS[langCode] || BOTTOM_NAV_LABELS.uk;
  // "Creează itinerar" — GENERALIZAT pentru orice țară, nu doar România.
  // Bug real, prins prin testare directă: link-ul era hardcodat mereu la
  // "/itinerar" (varianta doar-România) — click pe el dintr-o pagină a
  // Belgiei tot ajungea pe generatorul de itinerarii al României, care
  // evident nu găsea "Bruxelles" (mesaj de eroare vorbind despre România,
  // deși interfața era deja în engleză). Acum href-ul include codul țării
  // curente, la fel ca restul rutelor internaționale.
  const cc = countryCode || "ro";
  // FIX vizual, semnalat direct: textul lung ("Creează itinerar"/"Create
  // itinerary"), gândit pentru breadcrumb, se rupea pe două rânduri în
  // spațiul îngust al barei de jos — împingea iconița în sus, descentrată
  // față de celelalte 4 (Acasă/Căutare/Favorite/Hartă, toate un singur
  // cuvânt). Folosim eticheta SCURTĂ (navLabelsFor), aceeași folosită deja
  // în antet, gândită special pentru spații înguste.
  const itineraryLabel = navLabelsFor(langCode).itinerary;
  const itineraryHref = itineraryHrefFor(cc, langCode);
  const itineraryBtn = `<a href="${escapeHtml(itineraryHref)}" class="bottom-nav-item"><span class="bottom-nav-icon">🧭</span><span>${escapeHtml(itineraryLabel)}</span></a>`;
  return `
<nav class="bottom-nav">
  <a href="/" class="bottom-nav-item"><span class="bottom-nav-icon">🏠</span><span>${escapeHtml(labels.home)}</span></a>
  <a href="/#favoritesList" class="bottom-nav-item" id="bottomNavFavorites"><span class="bottom-nav-icon">⭐</span><span>${escapeHtml(labels.favorites)}</span></a>
  ${itineraryBtn}
  <a href="/#cityMap" class="bottom-nav-item" id="bottomNavMap"><span class="bottom-nav-icon">🗺️</span><span>${escapeHtml(labels.map)}</span></a>
</nav>`;
}


function buildBottomNavScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  // favorite/hartă: dacă elementul țintă există CHIAR PE PAGINA CURENTĂ,
  // activăm mai întâi tab-ul asociat (dacă e ascuns într-un tab, ex. pe
  // homepage — bug real, prins prin testare, semnalat direct de la
  // utilizator: scroll spre un element ascuns nu face nimic vizibil), apoi
  // derulăm până la el — altfel, navigăm spre homepage, sau ascundem
  // butonul dacă nici homepage-ul nu-l are.

  [["bottomNavFavorites","favoritesList","favorites"]].forEach(function(triple){
    var link = document.getElementById(triple[0]);
    var target = document.getElementById(triple[1]);
    var tabName = triple[2];
    if (!link) return;
    if (target) {
      link.addEventListener("click", function(e){
        e.preventDefault();
        // Activăm panoul DIRECT (aceleași clase pe care le-ar seta un click
        // pe tab), nu simulăm click pe un buton de tab — bug real, semnalat
        // direct: panoul "favorites" nu mai are buton de tab propriu (mutat
        // în footer, apoi scos complet), deci document.querySelector
        // găsea null, condiția eșua silențios, iar scroll-ul spre un
        // element încă ascuns (display:none) producea saltul ciudat descris.
        document.querySelectorAll(".sub-nav-tab").forEach(function(t){
          t.classList.toggle("active", t.getAttribute("data-tab") === tabName);
        });
        document.querySelectorAll(".sub-nav-panel").forEach(function(panel){
          panel.classList.toggle("active", panel.getAttribute("data-panel") === tabName);
        });
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } else if (window.location.pathname === "/") {
      link.style.display = "none";
    }
    // altfel (nu suntem pe homepage, elementul nu-i aici) — lăsăm link-ul
    // să navigheze normal spre "/#id", unde de regulă există
  });

  // hartă: dacă suntem deja pe o pagină cu hartă (de oraș), doar derulăm la
  // ea — altfel, cerem geolocația browserului și navigăm spre harta live a
  // celui mai apropiat oraș ACOPERIT (din orice țară), nu doar spre homepage
  // (unde n-ar exista nicio hartă oricum) — "lângă mine", de pe orice pagină.
  var mapLink = document.getElementById("bottomNavMap");
  var mapTarget = document.getElementById("cityMap");
  if (mapLink) {
    if (mapTarget) {
      mapLink.addEventListener("click", function(e){
        e.preventDefault();
        mapTarget.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } else {
      mapLink.addEventListener("click", function(e){
        e.preventDefault();
        if (!("geolocation" in navigator)) {
          window.location.href = "/";
          return;
        }
        mapLink.querySelector("span:last-child").textContent = "…";
        // Respectă tab-ul activ (Magazine/Obiective) — același bug, de
        // aceeași cauză, ca la butonul "Lângă mine": redirecționa mereu
        // spre oraș cu tab-ul de Magazine implicit, ignorând ce alesese
        // utilizatorul înainte de apăsare.
        var activeTab = document.querySelector(".sub-nav-tab.active");
        var tabHash = (activeTab && activeTab.getAttribute("data-tab") === "attractions") ? "#attractions" : "";
        navigator.geolocation.getCurrentPosition(function(pos){
          fetch("/api/nearest-city?lat=" + pos.coords.latitude + "&lon=" + pos.coords.longitude)
            .then(function(r){ return r.ok ? r.json() : null; })
            .then(function(data){
              if (data && data.href) { window.location.href = data.href.replace(/#.*$/, "") + tabHash; }
              else { window.location.href = "/"; }
            })
            .catch(function(){ window.location.href = "/"; });
        }, function(){
          // utilizatorul a refuzat geolocația, sau a eșuat — mergem la
          // homepage, unde poate alege orașul manual, nu rămânem blocați
          window.location.href = "/";
        }, { timeout: 8000 });
      });
    }
  }

})();
</script>`;
}


// Faza 1 de monetizare bazată pe date — cerut explicit: momentan urmăream
// zero click-uri pe butoanele de afiliere (doar page-view-uri generice în
// Google Analytics). UN SINGUR script, cu delegare de evenimente pe
// document (nu un listener separat per buton, la fiecare buton nou
// construit) — detectează orice link relevant după clasa lui CSS deja
// existentă, oriunde apare pe orice pagină, și trimite un eveniment GA4
// standard "affiliate_click", cu brandul/tipul (din clasă) și eticheta
// vizibilă a butonului (din text). Zero cod nou de adăugat la fiecare
// buton individual — se prinde automat, retroactiv, peste tot.
// EXCLUS intenționat: .go-now-btn (Waze) — e navigație, nu monetizare.
// Buton care arată frumos (ca restul butoanelor de pe site), dar la click
// încarcă widget-ul, în loc să navigheze în altă parte — cerut explicit.
// Generic, reutilizabil oriunde apare perechea buton+container cu atributele
// data-widget-target/data-widget-src (nu doar la zboruri/transfer). UN
// SINGUR script, cu nonce corect, inclus universal — corpul ghidurilor
// (locales.js) e text static, fără acces la nonce, de-aia n-am putea pune
// un <script nonce> direct acolo.
// Aduce statusul LIVE (Google), pe client, DUPĂ ce pagina s-a încărcat deja
// — cerut explicit, ca să eliminăm întârzierea reală, de câteva secunde, la
// prima vizită a unei pagini (sau după expirarea cache-ului), cauzată de
// așteptarea blocantă a răspunsului Google la randarea pe server. Complet
// pasiv dacă window.__liveStatusParams nu există (pagina n-are nevoie de
// asta — a găsit deja live server-side, sau e un robot de căutare).
function buildLiveStatusFetchScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var params = window.__liveStatusParams;
  if (!params) return;
  var mount = document.getElementById("storeMainHtmlMount") || document.getElementById("intlStoreMainHtmlMount") || document.getElementById("attractionMainHtmlMount");
  if (!mount) return;
  fetch("/api/live-status-html", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(data){
      if (data && data.ok && data.html) {
        mount.innerHTML = data.html;
        // reataşăm ascultătorii care depind de elemente NOI, aduse acum —
        // cele deja atașate la încărcarea inițială (pe elementele vechi,
        // înlocuite) rămân "orfane", inofensiv, garbage-collectate normal.
        if (window.__reattachAfterLiveStatus) window.__reattachAfterLiveStatus();
      }
    })
    .catch(function(){ /* rămânem pe varianta cu orar fix, deja afișată — fără eroare vizibilă */ });
})();
</script>`;
}


function buildWidgetRevealScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  // Delegare de evenimente pe document (nu ascultători individuali, la
  // fiecare buton) — necesar ca să funcționeze și pentru butoane adăugate
  // DINAMIC ulterior (ex. pagina de itinerar, unde butonul apare abia după
  // ce utilizatorul generează un itinerar, mult după ce acest script a
  // rulat deja o dată, la încărcarea inițială a paginii).
  document.addEventListener("click", function(e){
    var closeBtn = e.target.closest(".widget-close-btn");
    if (closeBtn) {
      var box = closeBtn.closest(".flight-widget-card");
      if (!box) return;
      box.style.display = "none";
      var trigger = document.querySelector('.widget-reveal-btn[data-widget-target="' + box.id + '"]');
      if (trigger) trigger.style.display = "";
      return;
    }
    var btn = e.target.closest(".widget-reveal-btn");
    if (!btn) return;
    e.preventDefault();
    var targetId = btn.getAttribute("data-widget-target");
    var src = btn.getAttribute("data-widget-src");
    var box = document.getElementById(targetId);
    if (!box) return;
    box.style.display = "block";
    btn.style.display = "none";
    // Buton de închidere — cerut explicit, o singură dată per widget, ca
    // să nu se dubleze dacă utilizatorul deschide/închide de mai multe ori.
    if (!box.querySelector(".widget-close-btn")) {
      var closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "widget-close-btn";
      closeButton.setAttribute("aria-label", "Închide");
      closeButton.textContent = "✕";
      closeButton.style.cssText = "position:absolute;top:8px;right:8px;z-index:2;width:28px;height:28px;border-radius:50%;background:#3A4556;color:#E8EBF0;border:1px solid #4A5568;cursor:pointer;font-size:16px;line-height:1";
      box.style.position = "relative";
      box.appendChild(closeButton);
    }
    // dacă widget-ul a mai fost deschis o dată (are deja scriptul/iframe-ul
    // încărcat), nu-l mai injectăm din nou — doar îl arătăm la loc, ca să
    // nu se dubleze
    if (!src || box.querySelector("script[data-widget-loaded], iframe[data-widget-loaded]")) return;
    // Widget-ul de transfer (TravelPayouts, temă "biletik") foloseşte intern
    // document.write — silenţios ignorat de browser când scriptul e injectat
    // dinamic, DUPĂ ce parser-ul paginii s-a închis deja (bug real, semnalat
    // direct: caseta se deschidea goală, complet, de fiecare dată). Soluţie:
    // iframe, care are propriul document, imun la problema asta — marcat
    // explicit prin data-widget-mode="iframe" pe buton.
    if (btn.getAttribute("data-widget-mode") === "iframe") {
      var f = document.createElement("iframe");
      f.src = src;
      f.setAttribute("data-widget-loaded", "1");
      f.style.cssText = "width:100%;min-height:480px;border:none;display:block";
      box.appendChild(f);
      return;
    }
    var s = document.createElement("script");
    s.async = true;
    s.charset = "utf-8";
    s.src = src;
    s.setAttribute("data-widget-loaded", "1");
    box.appendChild(s);
  }, true);
})();
</script>`;
}


function buildAffiliateClickTrackingScript(nonce, pageCountryCode) {
  return `
<script nonce="${nonce}">
(function(){
  var SELECTOR = ".affiliate-btn, .amazon-btn, .affiliate-banner-link, .accordion-ticket-btn, .plan-visit-option, .how-to-get-there-option";
  document.addEventListener("click", function(e){
    var el = e.target.closest(SELECTOR);
    if (!el) return;
    if (typeof gtag !== "function") return;
    var linkType = el.className.split(" ").filter(function(c){ return c.indexOf("affiliate-btn-") === 0 || c.indexOf("plan-visit-") === 0; })[0] || el.className.split(" ")[0];
    var label = (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 60);
    try {
      gtag("event", "affiliate_click", {
        link_type: linkType,
        link_label: label,
        link_href: el.href || "",
        page_path: location.pathname,
        page_country: ${safeJson(pageCountryCode || "ro")},
      });
    } catch (err) {}
  }, true);
})();
</script>`;
}


function pageShell({ title, description, canonical, bodyHtml, dataForClient, nonce, langCode, alternateLinks }) {
  const meta = LANG_META[langCode] || LANG_META.ro;
  // banner + modal de instalare — nume de brand corect, per domeniu; textul
  // respectă limba paginii curente (langCode), nu doar domeniul — un vizitator
  // care alege română pe .eu vede și acest mesaj tot în română, coerent.
  const isIntlDomain = canonical.includes(INTL_DOMAIN);
  const smartInstallBrand = isIntlDomain ? "Opening Hours Today" : "Programul de Azi";
  const smartInstallHtml = buildSmartInstallHtml(smartInstallBrand, langCode);
  const smartInstallScript = buildSmartInstallScript(nonce, langCode);
  // Codul de țară curent, dedus din canonical (mereu URL complet) — folosit
  // pentru link-ul "Creează itinerar" din bottom nav, ca să meargă spre
  // țara paginii curente, nu mereu spre România (vezi buildBottomNavHtml).
  // Nu se schimbă restul apelurilor către pageShell — canonical era deja
  // transmis peste tot, doar îl citim și aici, în plus.
  const canonicalPath = canonical.replace(/^https?:\/\/[^/]+/, "");
  const canonicalCountryMatch = canonicalPath.match(/^\/([a-z]{2})(\/|\?|$)/);
  const pageCountryCode = canonicalCountryMatch && COUNTRY_LABELS[canonicalCountryMatch[1]] ? canonicalCountryMatch[1] : "ro";
  // Travelpayouts Drive — ELIMINAT complet. Cauza confirmată a bug-ului de
  // liste goale pe mobil (magazine + obiective): scriptul încerca să
  // convertească automat TOATE linkurile de pe pagină (inclusiv linkurile
  // interne, gen /bucuresti/lidl), eșua cu eroare CORS pe tp-em.com/
  // link-switch, și eșecul lăsa elemente în stare ruptă. Redundant oricum
  // cu Stay22 LinkSwap, care face exact același lucru, dar corect, doar
  // pentru linkuri către comercianți reali.
  const travelpayoutsScript = "";
  const alternatesHtml = (alternateLinks || [])
    .map((l) => `<link rel="alternate" hreflang="${escapeHtml(l.hreflang)}" href="${escapeHtml(l.href)}">`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="${meta.lang}">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="/style.css">
${codAnalytics ? withNonce(codAnalytics, nonce) : ""}
<!-- GetYourGuide Analytics -->
<script async defer src="https://widget.getyourguide.com/dist/pa.umd.production.min.js" data-gyg-partner-id="LM6J21N"></script>
<!-- Stay22 LinkSwap — transformă automat linkurile simple către Booking/Agoda/
     Expedia/Hotels.com/KAYAK/Vrbo/GetYourGuide în linkuri de afiliere urmărite,
     fără să fi avut nevoie de aprobare separată de la fiecare companie. -->
<script nonce="${nonce}">
  (function (s, t, a, y, twenty, two) {
    s.Stay22 = s.Stay22 || {};
    s.Stay22.params = { lmaID: '6a9c733810fb99ee3ebd2a0b' };
    twenty = t.createElement(a);
    two = t.getElementsByTagName(a)[0];
    twenty.async = 1;
    twenty.src = y;
    two.parentNode.insertBefore(twenty, two);
  })(window, document, 'script', 'https://scripts.stay22.com/letmeallez.js');
</script>
<!-- Travelpayouts — GetTransfer + Omio, din contul tău Travelpayouts, cod diferit per domeniu (Project separat) -->
${travelpayoutsScript}
<script nonce="${nonce}">
(function(){
  try {
    var t = localStorage.getItem("theme");
    if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t);
  } catch(e){}
  // Ascunde imediat zona de filtrare țară/oraș DACĂ există o alegere salvată
  // de la o vizită anterioară — altfel utilizatorul vede o clipă starea
  // implicită ("toate țările"), apoi sare brusc la alegerea lui, senzație
  // de "ecran care se rupe"/clipește, semnalată direct. Elimină exact la
  // fel ca la temă, mai sus — scriptul de mai jos, care aplică efectiv
  // filtrul (buildCountryFilterScript), scoate clasa asta la final, o
  // singură dată, cu starea deja corectă gata pusă.
  try {
    if (localStorage.getItem("poa_selected_country_v1") || localStorage.getItem("poa_selected_city_v1")) {
      document.documentElement.classList.add("filter-restore-pending");
    }
  } catch(e){}

  // Previne saltul brusc al browserului spre #favorites/#favoritesList/
  // #search/#cityMap etc. — bug real, semnalat direct: chiar dacă mai jos
  // (buildTabsScript) reactivăm tab-ul corect și facem scroll manual,
  // browserul ÎNCEARCĂ să sară nativ spre ancoră ÎNAINTE ca acel script
  // să apuce să ruleze (elementul e încă ascuns, display:none, în acel
  // moment) — asta produce saltul vizibil, urmat de-o a doua corecție.
  // Soluție: scoatem hash-ul din URL CÂT MAI DEVREME posibil (aici, chiar
  // la începutul <head>-ului, înainte ca browserul să apuce să proceseze
  // ancora), păstrăm ținta într-o variabilă globală, pe care
  // buildTabsScript o citește mai jos, ca să știe totuși ce tab activează.
  try {
    var initialHash = (window.location.hash || "").replace("#", "");
    var poaKnownHashes = ["favorites", "favoritesList", "search", "citySearchInput", "siteSearchInput", "cityMap", "attractions"];
    if (poaKnownHashes.indexOf(initialHash) !== -1 && window.history && window.history.replaceState) {
      window.__poaPendingHash = initialHash;
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  } catch(e){}
})();
</script>
<style>html.filter-restore-pending .country-filter-bar,html.filter-restore-pending .sub-nav-panel{visibility:hidden;}</style>
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<!-- Verificare proprietate site — Impact.com (platforma care găzduiește
     programul de afiliere Skyscanner) — pusă în antetul comun, pe toate
     paginile, ca să fie găsită indiferent ce URL exact ai introdus tu la
     aplicație. Nu afectează nimic altceva, doar confirmă că tu deții site-ul. -->
<meta name="impact-site-verification" content="c85f30ab-6b83-44e4-ab02-28aedf095f5a2">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
${alternatesHtml}
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:locale" content="${meta.locale}">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0F1115">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#FAF8F4">
<meta name="theme-color" content="#0F1115">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icon-512.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="ProgramulDeAzi">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://unpkg.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap">
<link id="googleFontsLink" href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" media="print">
<script nonce="${nonce}">document.getElementById("googleFontsLink").media="all";</script>
<noscript><link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet"></noscript>
${ADSENSE_ENABLED && adsensePublisherId ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}" crossorigin="anonymous"></script>` : ""}
</head>
<body>
${smartInstallHtml}
${buildGlobalBackButtonHtml(langCode)}
${bodyHtml}
${buildThemeToggleHtml()}
${buildBottomNavHtml(langCode, pageCountryCode)}
${dataForClient ? buildClientScript(dataForClient, nonce) : ""}
${buildBottomNavScript(nonce)}
${buildGlobalBackButtonScript(nonce)}
${buildThemeToggleScript(nonce)}
${smartInstallScript}
${canonical.includes(INTL_DOMAIN) ? buildLanguageSwitcherScript(nonce) : ""}
${buildAffiliateClickTrackingScript(nonce, pageCountryCode)}
${buildWidgetRevealScript(nonce)}
<script nonce="${nonce}">
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function(){
    navigator.serviceWorker.register("/sw.js").catch(function(){});
  });
}
</script>
</body>
</html>`;
}

function navLabelsFor(lang) {
  return NAV_LABELS[lang] || NAV_LABELS.uk;
}

function flightSearchLabelFor(lang) {
  return FLIGHT_SEARCH_LABELS[lang] || FLIGHT_SEARCH_LABELS.uk;
}

function carRentalLabelFor(lang) {
  return CAR_RENTAL_LABELS[lang] || CAR_RENTAL_LABELS.uk;
}

function tripTypeLabelsFor(lang) {
  return TRIP_TYPE_LABELS[lang] || TRIP_TYPE_LABELS.uk;
}

function vibeLabelsFor(lang) {
  return VIBE_LABELS[lang] || VIBE_LABELS.uk;
}

function budgetLabelsFor(lang) {
  return BUDGET_LABELS[lang] || BUDGET_LABELS.uk;
}

// Construiește href-ul corect către itinerar, pentru ORICE context — bug
// real, găsit prin testare directă: România NU are o rută "/ro/itinerar"
// (are doar ruta simplă "/itinerar", fără prefix de țară) — un link generat
// mecanic ca `/${countryCode}/itinerar` pentru România cădea pe ruta
// generică de oraș, care trata literal cuvântul "itinerar" ca nume de oraș
// necunoscut (de-aia apăreau "Lidl Itinerar" etc. — magazinele universale
// aplicate unui "oraș" inventat). Centralizat aici, o singură dată, ca să nu
// mai apară din nou aceeași greșeală scrisă de mână, în alt loc.
function itineraryHrefFor(countryCode, lang) {
  if (!countryCode || countryCode === "ro") {
    return lang && lang !== "ro" ? `/itinerar?lang=${lang}` : "/itinerar";
  }
  return `/${countryCode}/itinerar?lang=${lang}`;
}

// Restul limbilor (14 din cele 21) NU au încă ghiduri traduse — cad pe
// engleză (TRAVEL_GUIDES_EN), mai bine decât o pagină goală sau eronată.
// Extinde aici pe măsură ce se mai traduc.
function travelGuidesForLang(lang) {
  return TRAVEL_GUIDES_BY_LANG[lang] || TRAVEL_GUIDES_EN;
}

function guidesPageLabelsFor(lang) {
  return GUIDES_PAGE_LABELS[lang] || GUIDES_PAGE_LABELS.uk;
}


function buildTravelGuidesBoxHtmlIntl(lang) {
  if (!TRAVEL_GUIDES_MONETIZATION_READY) {
    return `<p class="intro-text">${escapeHtml(comingSoonTextFor(lang))}</p>`;
  }
  const t = travelGuidesBoxLabelsFor(lang);
  // Link-uri cu limba curentă atașată (dacă tradusă — vezi TRAVEL_GUIDES_BY_LANG),
  // ca cineva care navighează în germană să ajungă la ghidul german, nu la
  // cel englez implicit.
  const langSuffix = lang && lang !== "uk" && TRAVEL_GUIDES_BY_LANG[lang] ? `?lang=${lang}` : "";
  // BUG REAL, găsit și reparat: slug-urile "transport"/"parking"/"restaurants"
  // erau hardcodate în engleză, chiar și când limba curentă avea propria ei
  // listă de ghiduri, cu slug-uri PROPRII (ex. română: "parcari", nu
  // "parking") — link-ul ducea la un slug care nu exista în ACEA listă,
  // "Guide not found". Folosim acum slug-ul REAL, din lista limbii curente,
  // după POZIȚIE (transport = mereu primul, parcare = al doilea, restaurant
  // = al treilea, în toate limbile, RO și EN incluse).
  const guidesForThisLang = travelGuidesForLang(lang);
  const transportSlug = guidesForThisLang[0] ? guidesForThisLang[0].slug : "transport";
  const parkingSlug = guidesForThisLang[1] ? guidesForThisLang[1].slug : "parking";
  const restaurantSlug = guidesForThisLang[2] ? guidesForThisLang[2].slug : "restaurants";
  return `
  <div class="plan-visit-block" style="display:block">
    <p class="intro-text"><strong>${escapeHtml(t.tgTitle)}</strong></p>
    <a href="/guides/${transportSlug}${langSuffix}" class="plan-visit-option plan-visit-ticket">${escapeHtml(t.tgTransport)}</a>
    <a href="/guides/${parkingSlug}${langSuffix}" class="plan-visit-option plan-visit-parking">${escapeHtml(t.tgParking)}</a>
    <a href="/guides/${restaurantSlug}${langSuffix}" class="plan-visit-option plan-visit-parking-alt">${escapeHtml(t.tgRestaurant)}</a>
  </div>`;
}


async function renderTravelGuidePageIntl({ guide, baseUrl, nonce, lang }) {
  const activeLang = lang && TRANSLATIONS[lang] ? lang : "uk";
  const t = guidesPageLabelsFor(activeLang);
  const guides = travelGuidesForLang(activeLang);
  const langSuffix = activeLang === "uk" ? "" : `?lang=${activeLang}`;
  const title = `${guide.title} — Travel Guides`;
  const description = `${guide.intro}. Practical tips for travellers, plus direct booking links.`;
  const canonical = `${baseUrl}/guides/${guide.slug}${langSuffix}`;

  const otherGuides = guides.filter((g) => g.slug !== guide.slug)
    .map((g) => `<li><a href="/guides/${g.slug}${langSuffix}">${escapeHtml(g.title)}</a></li>`)
    .join("");

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Opening<span>HoursToday</span></a><a class="guides-link" href="/guides${langSuffix}">${navLabelsFor(activeLang).guides} →</a><span class="header-property-links"><a class="guides-link" href="/cazare">🏡 Stays →</a><a class="guides-link" href="/restaurant/login">🍽️ Restaurants →</a></span></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">${escapeHtml(t.home)}</a> / <a href="/guides${langSuffix}">${escapeHtml(t.guidesTitle)}</a> / ${escapeHtml(guide.title)}</p>

  <h1 class="page-h1">${escapeHtml(guide.title)}</h1>
  <p class="intro-text">${escapeHtml(guide.intro)}</p>

  <div class="guide-body-content">${guide.body}</div>

  <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.otherGuides)}</h2>
  <ul class="mall-list">${otherGuides}</ul>

  <footer>
    <p><strong>Opening <span style="color:var(--accent)">Hours Today</span></strong> — ${escapeHtml(t.footer)}</p>
  </footer>
</main>`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: activeLang });
}


function renderTravelGuidesIndexPageIntl({ baseUrl, nonce, lang }) {
  const activeLang = lang && TRANSLATIONS[lang] ? lang : "uk";
  const t = guidesPageLabelsFor(activeLang);
  const guides = travelGuidesForLang(activeLang);
  const langSuffix = activeLang === "uk" ? "" : `?lang=${activeLang}`;
  const title = `${t.guidesTitle} — Opening Hours Today`;
  const description = t.guidesDesc;
  const canonical = `${baseUrl}/guides${langSuffix}`;

  const items = guides.map((g) => `<li><a href="/guides/${g.slug}${langSuffix}">${escapeHtml(g.title)}</a></li>`).join("");

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Opening<span>HoursToday</span></a><a class="guides-link" href="/guides${langSuffix}">${navLabelsFor(activeLang).guides} →</a><span class="header-property-links"><a class="guides-link" href="/cazare">🏡 Stays →</a><a class="guides-link" href="/restaurant/login">🍽️ Restaurants →</a></span></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">${escapeHtml(t.home)}</a> / ${escapeHtml(t.guidesTitle)}</p>
  <h1 class="page-h1">${escapeHtml(t.guidesTitle)}</h1>
  <p class="intro-text">${escapeHtml(t.guidesDesc)}</p>
  <ul class="mall-list">${items}</ul>
  <footer>
    <p><strong>Opening <span style="color:var(--accent)">Hours Today</span></strong> — ${escapeHtml(t.footer)}</p>
  </footer>
</main>`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: activeLang });
}



// Localitate NECURATORIATĂ (nu-i în SITEMAP_CITIES) dar cu restaurant sau
// cazare aprobată acolo — verificăm ambele tabele deodată, o singură
// interogare per tip. Numele orașului trebuie să se potrivească EXACT cu
// ce a ales proprietarul din SIRUTA la înscriere (aceleași date, aceeași
// sursă) — de-asta SIRUTA chiar contează aici, nu doar cosmetic.
// ------------------------------------------------------------------
// Înscrieri locale (restaurante / cazări / obiective propuse) pe paginile
// .eu ale României. Funcții NOI, folosite doar de paginile .eu — cele
// vechi, de pe programul-de-azi.ro, rămân neatinse (și oricum nu se mai
// servesc, vezi comentariul „PAGINI VECHI” de la renderCityPage).
// ------------------------------------------------------------------
function parseListingPhotos(p) {
  try { return Array.isArray(p) ? p : (typeof p === "string" ? JSON.parse(p) : []); } catch (e) { return []; }
}

function buildLocalListingGroupHtml(label, count, cardsHtml, extraHtml) {
  return `<details class="attraction-category-group">
        <summary class="attraction-category-summary">${label}${count ? ` <span class="attraction-category-count">(${count})</span>` : ""}</summary>
        ${extraHtml || ""}
        ${cardsHtml ? `<div class="nearby-stays-grid" style="padding:12px 14px 14px;">${cardsHtml}</div>` : ""}
      </details>`;
}

// Localitățile necuratoriate vin în URL fără diacritice (/ro/orastie), iar
// în baza de date orașul e salvat cu diacritice („Orăștie”) — căutăm după
// slug, printre orașele care chiar au ceva aprobat (liste mici).
async function findApprovedListingCityBySlug(orasSlug, countryCode) {
  const cc = countryCode || "ro";
  if (!dbPool) return null;
  try {
    if (cc !== "ro") throw new Error("doar propuneri");
    const { rows } = await dbPool.query(
      `SELECT city FROM restaurant_listings WHERE status = 'approved'
       UNION SELECT city FROM accommodation_listings WHERE status = 'approved'
       UNION SELECT city FROM attraction_listings WHERE status = 'approved'`
    );
    const hit = rows.find((r) => r.city && slugifyCityName(r.city) === orasSlug);
    if (hit) return hit.city;
  } catch (e) { /* trecem la propuneri */ }
  // localități cu doar o propunere de turist aprobată (ex. un obiectiv dintr-un sat)
  try {
    const { rows } = await dbPool.query(`SELECT DISTINCT city FROM pending_submissions WHERE status = 'approved' AND country_code = $1 AND type IN ('restaurant', 'cafe', 'attraction', 'beach', 'other')`, [cc]);
    const hit = rows.find((r) => r.city && slugifyCityName(r.city) === orasSlug);
    return hit ? hit.city : null;
  } catch (e) {
    return null;
  }
}


function slugifyCityName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimină diacriticele
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}


// setul de slug-uri cunoscute, derivat din cele 30 de orașe de mai sus — folosit
// pentru a valida orașul detectat din headerele de geolocație Vercel
const KNOWN_CITY_SLUGS = new Set(SITEMAP_CITIES.map(slugifyCityName));



// headerele x-vercel-ip-* vin URL-encodate (pot conține spații/diacritice)
function decodeGeoHeader(raw) {
  try {
    return decodeURIComponent(raw);
  } catch (e) {
    return raw;
  }
}



async function generateSitemapXml(baseUrl, includeIntl) {
  const base = baseUrl;
  const urls = [`${base}/`];
  // Cazări, restaurante și obiective turistice APROBATE — doar pe domeniul
  // .ro (unde se și servesc aceste pagini, vezi RO_TO_EU_MIGRATION_EXCLUDED_PREFIXES),
  // ca sitemap-ul .eu să nu trimită Google spre pagini care redirecționează.
  if (!includeIntl && dbPool) {
    try {
      const [accRes, restRes, attrRes] = await Promise.all([
        dbPool.query(`SELECT slug FROM accommodation_listings WHERE status = \'approved\'`),
        dbPool.query(`SELECT slug FROM restaurant_listings WHERE status = \'approved\'`),
        dbPool.query(`SELECT slug FROM attraction_listings WHERE status = \'approved\'`),
      ]);
      accRes.rows.forEach((r) => urls.push(`${base}/cazare/${r.slug}`));
      restRes.rows.forEach((r) => urls.push(`${base}/restaurant/${r.slug}`));
      attrRes.rows.forEach((r) => urls.push(`${base}/atractie/${r.slug}`));
    } catch (e) { /* sitemap-ul tot funcționează, doar fără aceste adrese */ }
  }

  if (!includeIntl) {
    // domeniul RO — doar orașele/magazinele din România
    SITEMAP_CITIES.forEach((city) => {
      const citySlug = slugifyCityName(city);
      urls.push(`${base}/${citySlug}`); // pagina generală a orașului
      SITEMAP_BRANDS.forEach((brand) => {
        urls.push(`${base}/${citySlug}/${brand}`); // ex: /cluj-napoca/kaufland
      });
    });

    SITEMAP_MALLS.forEach((mall) => {
      const citySlug = slugifyCityName(mall.city);
      urls.push(`${base}/${citySlug}/${mall.slug}`); // ex: /bucuresti/afi-cotroceni
    });
  } else {
    // domeniul internațional — doar paginile DE/UK/ES, aceeași logică oraș × brand
    Object.keys(COUNTRIES).forEach((countryCode) => {
      const country = COUNTRIES[countryCode];
      country.cities.forEach((city) => {
        const citySlug = slugifyCityName(city);
        urls.push(`${base}/${countryCode}/${citySlug}`);
        Object.keys(country.config).forEach((brandKey) => {
          const brandSlug = country.config[brandKey].slug || brandKey;
          urls.push(`${base}/${countryCode}/${citySlug}/${brandSlug}`);
        });
      });
    });
  }

  const body = urls.map((u) => `  <url><loc>${escapeHtml(u)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

function hashIp(ip) {
  return crypto.createHash("sha256").update(REPORT_IP_SALT + "|" + ip).digest("hex");
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

// Hash de parolă — scrypt, direct din `crypto` (Node), fără nicio
// dependență nouă. Sare aleatoare per parolă, comparație în timp constant
// la verificare, exact pattern-ul recomandat oficial de documentația Node.
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (typeof stored !== "string" || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  try {
    const hashBuf = Buffer.from(hash, "hex");
    const suppliedBuf = crypto.scryptSync(password, salt, 64);
    return hashBuf.length === suppliedBuf.length && crypto.timingSafeEqual(hashBuf, suppliedBuf);
  } catch (e) {
    return false;
  }
}


// Limitare de cereri — DB-based, nu în memorie (Vercel pornește instanțe noi
// des, un limitator doar în memorie s-ar reseta constant, fără efect real).
// "Fail-open": dacă baza de date are o problemă chiar în acest moment, NU
// blocăm utilizatorii reali — lăsăm cererea să treacă, mai bine decât să
// stricăm site-ul din cauza propriei protecții.
async function checkRateLimit(ipHash, endpoint, maxRequests, windowMinutes) {
  if (!dbPool) return true;
  try {
    const { rows } = await dbPool.query(
      `SELECT COUNT(*)::int AS cnt FROM api_rate_limits WHERE ip_hash = $1 AND endpoint = $2 AND creat_la > now() - ($3 * interval '1 minute')`,
      [ipHash, endpoint, windowMinutes]
    );
    if (rows[0].cnt >= maxRequests) return false;
    await dbPool.query(`INSERT INTO api_rate_limits (ip_hash, endpoint) VALUES ($1, $2)`, [ipHash, endpoint]);
    // curățenie oportunistă — nu la fiecare cerere (inutil de costisitor),
    // doar cam 1 din 50, suficient cât tabelul să nu crească nelimitat,
    // fără să avem nevoie de un job separat, programat
    if (Math.random() < 0.02) {
      dbPool.query(`DELETE FROM api_rate_limits WHERE creat_la < now() - interval '24 hours'`).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error("checkRateLimit a eșuat:", err.message);
    return true;
  }
}


// Cloudflare Turnstile — verificare server-side a token-ului trimis de
// widget-ul din formular. Vezi TURNSTILE_SITE_KEY/SECRET_KEY mai sus.
async function verifyTurnstile(token, ip) {
  if (!TURNSTILE_SECRET_KEY) return true; // nu e configurată încă — nu blocăm
  if (typeof token !== "string" || !token) return false;
  try {
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token, remoteip: ip || "" }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await resp.json();
    return !!data.success;
  } catch (err) {
    console.error("verifyTurnstile a eșuat:", err.message);
    return false; // eroare de rețea → fail-closed, e un formular cu parolă
  }
}


// ============================================================
// Cookie-uri semnate — utilitare minimale, fără dependență nouă (folosim
// doar `crypto`, deja disponibil). Folosite atât pentru gate-ul de preview
// al secțiunii "Cazare" (în construcție), cât și pentru sesiunea de
// proprietar (login prin magic link) — vezi mai jos.
// ============================================================
function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function signCookiePayload(payload, secret) {
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return payload + "." + sig;
}

function verifyCookiePayload(signed, secret) {
  if (typeof signed !== "string" || !signed.includes(".")) return null;
  const idx = signed.lastIndexOf(".");
  const payload = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  // comparație în timp constant — evită scurgeri de timing pe verificarea semnăturii
  const sigBuf = Buffer.from(sig, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  return payload;
}

function appendSetCookie(res, cookieStr) {
  const prev = res.getHeader("Set-Cookie");
  const list = prev ? (Array.isArray(prev) ? prev : [prev]) : [];
  list.push(cookieStr);
  res.setHeader("Set-Cookie", list);
}


// Gate pentru secțiunea "Cazare" (director pensiuni, în construcție) — vezi
// ACCOMMODATION_LIVE mai sus. Cât timp nu e "true", ORICE rută protejată
// întoarce 404 direct pentru oricine nu are cheia de preview corectă — nu o
// pagină "revenim curând" (asta ar dezvălui că există ceva), un 404 simplu,
// identic cu o rută care chiar nu există.
function accommodationGate(req, res, next) {
  if (ACCOMMODATION_LIVE) { trackAccommodationDailyVisit(req, res); next(); return; }
  // "no-store" explicit pe orice 404 dat de gate — altfel un CDN poate
  // reține acest răspuns pentru un URL anume (ex: un endpoint /api/) mult
  // după ce ACCOMMODATION_LIVE a fost corectat pe server, arătând în
  // continuare "negăsit" doar pe acel URL, deși restul site-ului merge.
  res.set("Cache-Control", "no-store");
  if (!ACCOMMODATION_PREVIEW_KEY) { res.status(404).send("Not found"); return; }
  const cookies = parseCookies(req);
  const cookieOk = cookies.accPreview === ACCOMMODATION_PREVIEW_KEY;
  const queryOk = req.query.preview === ACCOMMODATION_PREVIEW_KEY;
  if (!cookieOk && !queryOk) { res.status(404).send("Not found"); return; }
  if (queryOk && !cookieOk) {
    appendSetCookie(res, `accPreview=${encodeURIComponent(ACCOMMODATION_PREVIEW_KEY)}; Path=/; Max-Age=${90 * 24 * 60 * 60}; HttpOnly; SameSite=Lax; Secure`);
  }
  trackAccommodationDailyVisit(req, res);
  next();
}

// Contor de vizitatori/zi în secțiunea de cazare — argument de încredere
// pentru proprietari ("secțiunea are în medie X vizitatori/zi"), separat
// de views_count (care e per-locație). Un cookie marchează "am fost deja
// numărat azi" — fără el, un vizitator care navighează prin 5 pagini ar
// fi numărat de 5 ori, umflând artificial cifra. Doar GET (pagini reale,
// nu acțiuni de tip POST) — și doar dacă dbPool există.
function trackAccommodationDailyVisit(req, res) {
  if (!dbPool || req.method !== "GET") return;
  const cookies = parseCookies(req);
  const today = localDateStringForCounter();
  if (cookies.accVisitedDay === today) return;
  appendSetCookie(res, `accVisitedDay=${today}; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Lax; Secure`);
  dbPool.query(
    `INSERT INTO accommodation_daily_visits (visit_date, visit_count) VALUES ($1, 1)
     ON CONFLICT (visit_date) DO UPDATE SET visit_count = accommodation_daily_visits.visit_count + 1`,
    [today]
  ).catch(() => {});
}

function localDateStringForCounter() {
  // ora României (UTC+2/+3) — suficient de precis pentru un contor "azi",
  // fără nevoia unei librării de fus orar dedicate
  const d = new Date(Date.now() + 3 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}


// ============================================================
// Cazare — login prin magic link (fără parolă). Vezi ACCOMMODATION_LIVE
// mai sus pentru gate-ul general al secțiunii.
// ============================================================
async function sendAccommodationLoginEmail(email, link, lang) {
  if (!RESEND_API_KEY) {
    console.error("sendAccommodationLoginEmail: RESEND_API_KEY lipsă, nu pot trimite email");
    return false;
  }
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from: "Opening Hours Today <cazare@programul-de-azi.ro>",
        to: [email],
        subject: lang === "en" ? "Your sign-in link — Opening Hours Today" : "Linkul tău de conectare — Opening Hours Today",
        html: lang === "en" ? `<p>Click the link below to sign in to your Opening Hours Today account. The link is valid for 60 minutes and can only be used once.</p><p><a href="${link}">${link}</a></p><p>If you did not request this link, you can ignore this email — nobody can access your account without it.</p>` : `<p>Apasă pe linkul de mai jos ca să te conectezi la contul tău de cazare. Linkul e valabil 60 de minute și poate fi folosit o singură dată.</p><p><a href="${link}">${link}</a></p><p>Dacă nu ai cerut tu acest link, poți ignora acest email — nimeni nu poate intra în cont fără să dea click pe el.</p>`,
      }),
    });
    return resp.ok;
  } catch (err) {
    console.error("sendAccommodationLoginEmail a eșuat:", err.message);
    return false;
  }
}


// Trimis automat când admin aprobă o cazare din /admin/cazari — anunță
// proprietarul că e live, cu link direct și instrucțiuni de reconectare
// (fără parolă, la fel ca la login).
async function sendPhotoRequestEmail(email, listingName, loginUrl) {
  if (!RESEND_API_KEY) {
    console.error("sendPhotoRequestEmail: RESEND_API_KEY lipsă, nu pot trimite email");
    return false;
  }
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from: "Opening Hours Today <cazare@programul-de-azi.ro>",
        to: [email],
        subject: `Te rugăm să încarci alte poze pentru ${listingName} / Please upload new photos for ${listingName}`,
        html: `
<p>Bună,</p>
<p>Am analizat pozele trimise pentru <strong>${listingName}</strong> și avem nevoie de altele, de o calitate mai bună (mai luminoase, mai clare, care să reflecte fidel locul), înainte să putem aproba anunțul.</p>
<p>Te poți conecta oricând ca să le înlocuiești, cu emailul și parola alese la înregistrare:</p>
<p><a href="${loginUrl}">${loginUrl}</a></p>
<p>Îți mulțumim pentru înțelegere!<br>Echipa Opening <span style="color:#F0813A">Hours Today</span></p>
<hr style="margin:32px 0 20px;border:none;border-top:1px solid #ddd;">
<p style="color:#666;font-size:13px;margin:0 0 10px;">🇬🇧 English</p>
<p>We reviewed the photos submitted for <strong>${listingName}</strong> and we need different ones, of better quality (brighter, clearer, accurately showing the place), before we can approve the listing.</p>
<p>You can sign in at any time to replace them, using the email and password you registered with:</p>
<p><a href="${loginUrl}">${loginUrl}</a></p>
<p>Thank you for understanding!<br>The Opening <span style="color:#F0813A">Hours Today</span> team</p>`,
      }),
    });
    return resp.ok;
  } catch (err) {
    console.error("sendPhotoRequestEmail a eșuat:", err.message);
    return false;
  }
}


// Notificări către proprietari (revendicare, ștergere cont) — bilingv RO + EN, ca restul emailurilor.
// Nu aruncă niciodată excepții: întoarce true/false, ca acțiunea de admin să nu pice din cauza emailului.
async function sendOwnerNoticeEmail(to, { subjectRo, subjectEn, bodyRo, bodyEn }) {
  if (!RESEND_API_KEY) { console.error("sendOwnerNoticeEmail: RESEND_API_KEY lipsă, nu pot trimite email"); return false; }
  if (!to || !/^[^\s@]+@[^\s@]+$/.test(String(to))) return false;
  const sign = `<span style="color:#F0813A">Hours Today</span>`;
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from: "Opening Hours Today <cazare@programul-de-azi.ro>",
        to: [to],
        subject: `${subjectRo} / ${subjectEn}`,
        html: `<p>Bună,</p>${bodyRo}<p style="margin-top:24px">Echipa Opening ${sign}</p>
<hr style="margin:28px 0 18px;border:none;border-top:1px solid #ddd;"><p style="color:#666;font-size:13px;margin:0 0 10px;">🇬🇧 English</p>
<p>Hello,</p>${bodyEn}<p style="margin-top:24px">The Opening ${sign} team</p>`,
      }),
    });
    return resp.ok;
  } catch (err) {
    console.error("sendOwnerNoticeEmail a eșuat:", err.message);
    return false;
  }
}


async function sendAccommodationApprovalEmail(email, listingName, listingUrl, loginUrl) {
  if (!RESEND_API_KEY) {
    console.error("sendAccommodationApprovalEmail: RESEND_API_KEY lipsă, nu pot trimite email");
    return false;
  }
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from: "Opening Hours Today <cazare@programul-de-azi.ro>",
        to: [email],
        subject: `Mulțumim! ${listingName} este acum live pe Opening Hours Today 🎉 / ${listingName} is now live`,
        html: `
<p>Bună,</p>
<p>Vești bune — <strong>${listingName}</strong> a fost verificată și publicată pe Opening Hours Today. De acum, oricine caută o cazare te poate găsi și te poate contacta direct, fără niciun intermediar:</p>
<p><a href="${listingUrl}">${listingUrl}</a></p>
<h3 style="margin-top:24px">Ce urmează</h3>
<p>Poți reveni oricând în contul tău ca să actualizezi poze, prețul sau facilitățile. Te conectezi cu emailul și parola alese la înregistrare:</p>
<p><a href="${loginUrl}">${loginUrl}</a></p>
<div style="margin-top:28px;padding:18px 20px;background:#f7f5f0;border-radius:10px;">
<p style="margin:0 0 10px;font-weight:700;">☕ Un cuvânt despre ce construim aici</p>
<p style="margin:0 0 10px;">Opening Hours Today este un proiect independent, creat special pentru ca unitățile de cazare, restaurantele, cafenelele și obiectivele turistice să aibă vizibilitate maximă, fără taxe ascunse sau comisioane la rezervări. Este spațiul în care tu ții legătura direct cu clienții și oaspeții tăi.</p>
<p style="margin:0 0 14px;">Dacă platforma îți aduce valoare, ne poți ajuta să o menținem activă și gratuită oferindu-ne o cafea. Orice sprijin contează pentru viitorul acestei comunități!</p>
<p style="margin:0"><a href="https://ko-fi.com/openinghourstoday" style="font-weight:700;">☕ Cumpără-ne o cafea →</a></p>
</div>
<p style="margin-top:24px">Îți mulțumim că faci parte din Opening <span style="color:#F0813A">Hours Today</span>.<br>Echipa Opening <span style="color:#F0813A">Hours Today</span></p>
<hr style="margin:32px 0 20px;border:none;border-top:1px solid #ddd;">
<p style="color:#666;font-size:13px;margin:0 0 10px;">🇬🇧 English</p>
<p>Good news — <strong>${listingName}</strong> has been reviewed and is now live on Opening Hours Today. Visitors can now find you and contact you directly, with no middlemen:</p>
<p><a href="${listingUrl}">${listingUrl}</a></p>
<p>You can sign in to your account at any time to update photos, prices or details, using the email and password you registered with:</p>
<p><a href="${loginUrl}">${loginUrl}</a></p>
<p>Thank you for being part of Opening <span style="color:#F0813A">Hours Today</span>.<br>The Opening <span style="color:#F0813A">Hours Today</span> team</p>`,
      }),
    });
    return resp.ok;
  } catch (err) {
    console.error("sendAccommodationApprovalEmail a eșuat:", err.message);
    return false;
  }
}


function getAccommodationOwnerSession(req) {
  if (!ACCOMMODATION_SESSION_SECRET) return null;
  const cookies = parseCookies(req);
  const raw = cookies.accSession;
  if (!raw) return null;
  const payload = verifyCookiePayload(raw, ACCOMMODATION_SESSION_SECRET);
  if (!payload) return null;
  try {
    const data = JSON.parse(payload);
    if (!data.ownerId || !data.exp || Date.now() > data.exp) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function setAccommodationOwnerSession(res, ownerId, email) {
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 zile
  const payload = JSON.stringify({ ownerId, email, exp });
  const signed = signCookiePayload(payload, ACCOMMODATION_SESSION_SECRET);
  // „ultima conectare” — folosită în Prospectare, ca admin să vadă dacă
  // proprietarul chiar a intrat în contul creat pentru el. Best-effort,
  // nu blocăm logarea dacă scrierea asta eșuează.
  if (dbPool) { dbPool.query(`UPDATE accommodation_owners SET last_login_at = now() WHERE id = $1`, [ownerId]).catch(() => {}); }
  appendSetCookie(res, `accSession=${encodeURIComponent(signed)}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; SameSite=Lax; Secure`);
}

async function ownerStillExists(ownerId) {
  if (!dbPool) return true;
  const c = OWNER_EXISTS_CACHE.get(ownerId);
  if (c && Date.now() - c.at < 30000) return c.ok;
  try {
    const { rows } = await dbPool.query(`SELECT 1 FROM accommodation_owners WHERE id = $1::integer`, [ownerId]);
    const ok = rows.length > 0;
    OWNER_EXISTS_CACHE.set(ownerId, { ok, at: Date.now() });
    if (OWNER_EXISTS_CACHE.size > 5000) OWNER_EXISTS_CACHE.clear();
    return ok;
  } catch (e) { return true; }
}

async function requireAccommodationOwner(req, res, next) {
  const session = getAccommodationOwnerSession(req);
  if (!session) { res.redirect("/cazare/login"); return; }
  if (!(await ownerStillExists(session.ownerId))) {
    appendSetCookie(res, "accSession=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure");
    res.redirect("/cazare/login"); return;
  }
  req.accommodationOwner = session;
  next();
}

// variantă pentru rute API (JSON), nu pagini — nu redirecționează, întoarce 401
async function requireAccommodationOwnerApi(req, res, next) {
  const session = getAccommodationOwnerSession(req);
  if (!session || !(await ownerStillExists(session.ownerId))) { res.status(401).json({ error: getAccLang(req) === "en" ? "Your session has expired — please sign in again." : "Sesiunea a expirat — autentifică-te din nou." }); return; }
  req.accommodationOwner = session;
  next();
}


// ============================================================
// Cont de admin real — email + parolă, sesiune proprie (adminSession),
// complet separată de accSession (proprietar cazare). Aceleași utilitare
// de mai sus (hashPassword/verifyPassword, signCookiePayload etc.) —
// nicio dependență nouă.
//
// Bootstrap: /admin/creeaza-cont funcționează DOAR cât timp nu există încă
// niciun rând în admin_users — după primul cont creat, ruta se comportă
// ca 404 pentru oricine, indiferent de cheie (nu poate fi refolosită ca
// să se creeze un al doilea cont pe furiș). Dacă e nevoie de un admin în
// plus, se adaugă direct din baza de date, nu prin această rută.
// ============================================================
function getAdminSession(req) {
  if (!ADMIN_SESSION_SECRET) return null;
  const cookies = parseCookies(req);
  const raw = cookies.adminSession;
  if (!raw) return null;
  const payload = verifyCookiePayload(raw, ADMIN_SESSION_SECRET);
  if (!payload) return null;
  try {
    const data = JSON.parse(payload);
    if (!data.adminId || !data.exp || Date.now() > data.exp) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function setAdminSession(res, adminId, email) {
  const exp = Date.now() + 12 * 60 * 60 * 1000; // 12 ore — sesiune de admin, expirare mai scurtă decât la proprietari
  const payload = JSON.stringify({ adminId, email, exp });
  const signed = signCookiePayload(payload, ADMIN_SESSION_SECRET);
  appendSetCookie(res, `adminSession=${encodeURIComponent(signed)}; Path=/; Max-Age=${12 * 60 * 60}; HttpOnly; SameSite=Lax; Secure`);
}

// Pentru rute de pagină (HTML) — redirecționează la login dacă nu ești conectat
function requireAdminPage(req, res) {
  const session = getAdminSession(req);
  if (!session) { res.redirect("/admin/autentificare"); return null; }
  return session;
}

// Pentru rute API (JSON) — 401, fără redirect
function requireAdminApi(req, res) {
  const session = getAdminSession(req);
  if (!session) { res.status(401).json({ error: getAccLang(req) === "en" ? "Your session has expired — please sign in again." : "Sesiunea a expirat — autentifică-te din nou." }); return null; }
  return session;
}


// Stilul comun pentru paginile "albe", minimaliste, ale fluxului de
// înregistrare/autentificare cazare — intenționat diferit de restul
// site-ului (temă închisă). Extras într-o funcție, ca să nu-l triplăm pe
// măsură ce adăugăm mai multe pagini din același flux.
function accWhitePageStyles() {
  return `
*{box-sizing:border-box;}
body{background:#fff;color:#111;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;margin:0;}
.acc-white-wrap{max-width:420px;margin:0 auto;padding:60px 24px 40px;text-align:center;}
.acc-white-h1{font-size:25px;font-weight:800;color:#111;margin:0 0 10px;}
.acc-white-sub{font-size:15px;color:#444;margin:0 0 30px;line-height:1.5;}
.acc-white-label{display:block;text-align:left;font-weight:700;font-size:14px;color:#111;margin-bottom:6px;}
.acc-white-input{width:100%;padding:14px;border:2px solid #F0813A;border-radius:10px;font-size:16px;margin-bottom:16px;outline:none;}
.acc-white-input.is-inactive{border:1.5px solid #ddd;}
.acc-white-field{margin-bottom:16px;text-align:left;}
.acc-white-helper{font-size:12.5px;color:#888;margin:-10px 0 16px;text-align:left;}
.acc-phone-row{display:flex;gap:8px;margin-bottom:6px;}
.acc-phone-country{flex:0 0 76px;display:flex;align-items:center;justify-content:center;gap:4px;border:1.5px solid #ddd;border-radius:10px;font-size:18px;background:#fafafa;}
.acc-phone-input-wrap{flex:1;display:flex;align-items:stretch;border:1.5px solid #ddd;border-radius:10px;overflow:hidden;}
.acc-phone-prefix{background:#f0f0f0;color:#555;display:flex;align-items:center;padding:0 10px;font-size:15px;font-weight:600;border-right:1px solid #ddd;}
.acc-phone-input-wrap input{border:none;padding:14px 10px;font-size:16px;flex:1;outline:none;min-width:0;}
.acc-white-cta{width:100%;background:#F0813A;color:#fff;font-weight:800;font-size:16px;border:none;border-radius:10px;padding:15px;cursor:pointer;}
.acc-white-cta:disabled{opacity:.6;}
.acc-siruta-suggestions{position:relative;margin:-12px 0 16px;border:1.5px solid #eee;border-radius:10px;max-height:220px;overflow-y:auto;display:none;background:#fff;box-shadow:0 8px 20px -10px rgba(0,0,0,.2);z-index:20;}
.acc-siruta-item{padding:12px 14px;font-size:14.5px;cursor:pointer;border-bottom:1px solid #f2f2f2;}
.acc-siruta-item:last-child{border-bottom:none;}
.acc-siruta-item:hover{background:#fff3ea;}
.acc-white-msg{font-size:14px;color:#1a7a34;font-weight:700;margin-top:16px;}
.acc-white-err{font-size:14px;color:#c62828;font-weight:600;margin-top:16px;}
.acc-white-divider{border:none;border-top:1px solid #eee;margin:28px 0;}
.acc-white-help{font-size:13.5px;color:#333;}
.acc-white-help a{color:#1a73e8;text-decoration:none;font-weight:600;}
.acc-white-outline{display:block;width:100%;background:#fff;border:1.5px solid #F0813A;color:#111;font-weight:700;font-size:15px;border-radius:10px;padding:13px;text-align:center;cursor:pointer;text-decoration:none;margin-top:14px;}
.acc-white-textlink{display:block;text-align:center;color:#F0813A;font-weight:700;font-size:14px;text-decoration:none;margin-top:16px;cursor:pointer;}
.acc-white-legal{margin-top:40px;font-size:12px;color:#888;text-align:center;line-height:1.7;}
.acc-white-legal a{color:#888;text-decoration:underline;}
.acc-sub-back{flex:0 0 52px;width:52px;height:52px;background:#1A1F35;border:2px solid #F0813A;color:#F0813A;font-weight:900;font-size:20px;border-radius:50%;cursor:pointer;text-decoration:none;display:flex;align-items:center;justify-content:center;}
.acc-sub-continue{flex:1;min-width:0;min-height:48px;background:#F0813A;color:#fff;font-weight:800;font-size:15px;border:none;border-radius:10px;padding:0 15px;cursor:pointer;}
.acc-sub-continue:disabled{opacity:.5;cursor:not-allowed;}
.acc-sub-other-box{display:none;margin:-4px 0 20px;}
.acc-sub-other-box.is-visible{display:block;}
/* --- Stiluri comune formularelor de proprietar (cazare/restaurant/obiectiv/date fiscale).
   Formularele de restaurant și obiectiv foloseau clasele de mai jos fără să le definească —
   pe telefon, pozele încărcate apăreau la mărimea lor reală (ieșeau din ecran), bifele
   curgeau una după alta pe același rând, iar bara de jos (← / Salvează) nu era aliniată. */
img{max-width:100%;}
.acc-fiscal-h1{font-size:24px;font-weight:800;color:#111;margin:0 0 8px;line-height:1.25;}
.acc-fiscal-sub{font-size:14.5px;color:#555;margin:0 0 26px;line-height:1.5;}
.acc-white-hint{font-size:12.5px;color:#666;margin:6px 0 12px;min-height:0;}
.acc-white-hint:empty{margin:0;}
.acc-check-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px;}@media (min-width:520px){.acc-check-grid{grid-template-columns:repeat(3,1fr);}}
.acc-check-item{display:flex;align-items:center;gap:8px;background:#fff;border:1.5px solid #dde1e6;border-radius:10px;padding:10px 12px;font-size:13.5px;font-weight:600;color:#1a1f2e;cursor:pointer;}.acc-check-item .pa-icon{flex:0 0 auto;color:#2b6cb0;}.acc-check-item input[type=checkbox]{flex:0 0 auto;width:16px;height:16px;accent-color:#F0813A;margin:0;}
.acc-check-grid .acc-check-item{margin-bottom:0;}
.acc-check-item input[type=checkbox]{flex:0 0 auto;width:18px;height:18px;margin:0;accent-color:#F0813A;}
.acc-photo-input{margin-bottom:8px;max-width:100%;}
/* Butoane de încărcare în română, în locul textului browserului („Alegeți
   fișierul / niciun fișier selectat”): „📷 Încarcă poză” pentru imagini,
   „📄 Încarcă fișier PDF” pentru documente. Input-ul real rămâne în pagină
   (ascuns vizual), deci scripturile existente funcționează la fel. */
.upl-btn{position:relative;display:inline-flex;align-items:center;gap:8px;background:#171E3A;color:#fff;font-weight:700;font-size:14.5px;border:2px solid #F0813A;border-radius:10px;padding:11px 18px;cursor:pointer;margin:2px 0 8px;-webkit-tap-highlight-color:transparent;}
.upl-btn:active{transform:scale(.98);}
.upl-btn:focus-within{outline:3px solid rgba(240,129,58,.45);outline-offset:2px;}
.upl-native{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;opacity:0;}
.acc-photo-grid{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;}
.acc-photo-grid:empty{margin:0;}
.acc-photo-thumb{position:relative;width:76px;height:76px;flex:0 0 76px;cursor:grab;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}
.acc-photo-thumb img{-webkit-user-drag:none;pointer-events:none;}
.acc-photo-hint{font-size:12.5px;color:#666;margin:2px 0 8px;}
.acc-photo-thumb img{width:100%;height:100%;max-width:none;object-fit:cover;border-radius:8px;}
.acc-photo-thumb button{position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:#e53935;color:#fff;border:none;cursor:pointer;font-size:12px;line-height:1;}
.acc-details-bottombar{display:flex;flex-wrap:nowrap;align-items:stretch;gap:12px;max-width:560px;margin:16px auto 40px;padding:0 24px;}
input[type=file]{max-width:100%;font-size:14px;}
/* Input-urile puse câte două pe rând (ore deschidere/închidere, preț + monedă, CUI + buton)
   trebuie să se poată micșora sub lățimea lor „naturală”, altfel ies din ecran pe telefoane înguste. */
.acc-white-input{min-width:0;}
.acc-price-row>*,.acc-cui-row>input,.acc-time-row>*{min-width:0;}
.acc-time-row{display:flex;gap:10px;}
.acc-time-row>input{flex:1 1 0;}
/* iOS Safari ignoră width:100% la input-urile de tip oră, dacă nu le scoatem aspectul nativ */
input[type=time].acc-white-input{-webkit-appearance:none;appearance:none;background:#fff;color:#111;min-height:52px;}
input[type=time]::-webkit-date-and-time-value{text-align:left;}
.acc-desc-box{min-height:220px;line-height:1.5;resize:vertical;}
.acc-desc-field-wrap{position:relative;}
.acc-desc-counter{text-align:right;font-size:12.5px;color:#777;margin:-6px 0 12px;}
.desc-char-badge{position:absolute;top:8px;right:10px;background:rgba(255,255,255,.92);color:#888;font-size:11px;font-weight:700;padding:2px 7px;border-radius:999px;pointer-events:none;border:1px solid #eee;}
.desc-char-badge.is-low{color:#c0392b;}
.desc-toolbar{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;align-items:center;}
.desc-tb-btn{width:38px;height:34px;border-radius:8px;border:1.5px solid #F0813A;background:#fff;color:#1A1F35;font-size:15px;cursor:pointer;line-height:1;}
.desc-tb-btn:active{background:#F0813A;color:#fff;}
.desc-ai-btn{height:34px;border-radius:8px;border:1.5px solid #7C4DFF;background:#fff;color:#5b2fd6;font-size:13.5px;font-weight:800;cursor:pointer;padding:0 12px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;}
.desc-ai-btn:active{background:#7C4DFF;color:#fff;}
.desc-ai-btn:disabled{opacity:.5;cursor:not-allowed;}
.desc-ai-hint{font-size:12.5px;color:#888;margin:-4px 0 12px;line-height:1.5;}
.desc-ai-hint a{color:#7C4DFF;font-weight:700;}.acc-impersonate-banner{background:#3a1a1a;color:#ffb3b3;text-align:center;padding:10px 14px;font-size:13.5px;font-weight:600;}.acc-impersonate-banner a{color:#ffd700;font-weight:800;}.acc-age-policy-group{display:flex;flex-direction:column;gap:10px;margin-bottom:16px;}.acc-age-policy-option{display:flex;align-items:center;gap:10px;border:1.5px solid #ddd;border-radius:10px;padding:12px 14px;cursor:pointer;font-size:14.5px;font-weight:600;color:#333;}.acc-age-policy-option:has(input:checked){border-color:#F0813A;background:#FFF8F3;}.acc-age-policy-option input{width:18px;height:18px;accent-color:#F0813A;}
.acc-roomtypes-details{border:2px solid #F0813A;border-radius:10px;margin:0 0 16px;overflow:hidden;}
.acc-roomtypes-details summary{cursor:pointer;list-style:none;padding:14px;font-weight:700;font-size:15px;color:#1A1F35;background:#FFF8F3;}
.acc-roomtypes-details summary::-webkit-details-marker{display:none;}
.acc-roomtypes-details summary::before{content:"▸ ";color:#F0813A;font-weight:800;}
.acc-roomtypes-details[open] summary::before{content:"▾ ";}
.acc-roomtypes-body{padding:16px;}
.acc-roomtype-card{border:1px solid #eee;border-radius:10px;padding:14px;margin-bottom:14px;position:relative;background:#fff;}
.acc-roomtype-remove{position:absolute;top:10px;right:10px;width:26px;height:26px;border-radius:50%;background:#f5f5f5;border:none;color:#999;font-size:14px;cursor:pointer;}
.acc-roomtype-remove:hover{background:#ffe0e0;color:#c0392b;}
.acc-roomtype-row{display:flex;gap:10px;}
.acc-roomtype-row > div{flex:1;}
.acc-roomtype-beds{margin-top:10px;}
.acc-bed-row{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f2f2f2;font-size:14px;}
.acc-bed-row:last-child{border-bottom:none;}
.acc-bed-counter{display:flex;align-items:center;gap:10px;}
.acc-bed-counter button{width:26px;height:26px;border-radius:6px;border:1.5px solid #F0813A;background:#fff;color:#F0813A;font-weight:800;cursor:pointer;font-size:15px;line-height:1;}
.acc-bed-counter span{min-width:16px;text-align:center;font-weight:700;}
.acc-add-roomtype-btn{background:#fff;border:1.5px solid #F0813A;color:#F0813A;font-weight:700;border-radius:8px;padding:10px 14px;cursor:pointer;font-size:14px;}.acc-rooms-list{display:flex;flex-direction:column;gap:10px;margin:8px 0;}.acc-room-card{border:1px solid #eee;border-radius:10px;padding:12px;position:relative;background:#fafafa;}.acc-bathroom-card{border:1px solid #eee;border-radius:10px;padding:12px;margin-bottom:10px;background:#fafafa;}.acc-bathroom-title{font-weight:700;font-size:13.5px;color:#444;margin-bottom:8px;}
.acc-dd{border:1.5px solid #dde1e6;border-radius:10px;margin:8px 0;background:#fff;}.acc-dd>summary{cursor:pointer;padding:11px 14px;font-weight:700;font-size:14px;color:#1a1f2e;list-style:none;}.acc-dd>summary::after{content:"▾";float:right;color:#888;}.acc-dd[open]>summary::after{content:"▴";}.acc-dd .acc-check-grid{padding:4px 12px 12px;}
.acc-bedpick{margin:8px 0;}.acc-bedpick-title{font-size:13px;font-weight:700;color:#444;margin-bottom:4px;}.acc-bedpick-line{display:flex;align-items:center;gap:8px;}.acc-bedpick-line select{flex:1;}.acc-bedpick-line select:last-child{flex:0 0 76px;}.acc-bedpick-x{color:#888;font-weight:700;}
.acc-bedroom-card{border:1px solid #e3e6ea;border-radius:12px;padding:12px;margin:10px 0;background:#fbfbfc;}.acc-bath-block{margin-top:10px;padding:10px;border-radius:10px;background:#f3f6fa;}.acc-bath-title{font-weight:700;font-size:13.5px;color:#2b6cb0;margin-bottom:6px;}
.acc-struct-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px;}.acc-struct-title{font-weight:800;font-size:15px;color:#F0813A;}.acc-struct-remove{background:none;border:1px solid #e0b4b4;color:#b33;border-radius:8px;padding:5px 10px;font-size:12.5px;cursor:pointer;}
.acc-price-row{display:flex;gap:8px;align-items:center;}.acc-cur-tag{font-weight:800;color:#555;padding:0 10px;}.acc-living-box{margin-top:4px;}
#detForm .acc-white-input,#detForm select,#detForm textarea{border:1.5px solid #d6deea;border-radius:12px;}
#detForm .acc-white-input:focus,#detForm select:focus,#detForm textarea:focus{border-color:#9db8e8;box-shadow:0 0 0 3px rgba(111,152,224,.2);outline:none;}
#detForm .acc-lined-textarea{background-image:repeating-linear-gradient(to bottom,transparent,transparent 27px,#dde6f3 27px,#dde6f3 28px);}
#detForm .desc-tb-btn{border:1.5px solid #d6deea;border-radius:12px;height:40px;width:44px;display:inline-flex;align-items:center;justify-content:center;}
#detForm .desc-tb-btn:active{background:#eef3fb;color:#1a1f35;}
#detForm .desc-ai-btn{border-radius:12px;height:40px;gap:8px;}
#detForm .upl-btn{border:1.5px solid #c9d3e6;}
#detForm .acc-check-item input[type=checkbox],#detForm input[type=radio]{accent-color:#1a1f35;}
#detForm .acc-roomtypes-details{border:1.5px solid #d6deea;border-radius:14px;}
#detForm .acc-roomtypes-details summary::before{color:#6b7280;}
#detForm .acc-age-policy-option{display:flex;align-items:center;gap:12px;border:1.5px solid #d6deea;border-radius:14px;padding:16px 18px;margin-bottom:10px;background:#fff;font-weight:700;cursor:pointer;}
#detForm .acc-age-policy-option .pa-icon{color:#2f6fb0;}
#detForm .acc-white-label .pa-icon{vertical-align:-3px;margin-right:6px;color:#2f6fb0;}
#aForm .acc-white-input,#aForm select,#aForm textarea{border:1.5px solid #d6deea;border-radius:12px;}
#aForm .acc-white-input:focus,#aForm select:focus,#aForm textarea:focus{border-color:#9db8e8;box-shadow:0 0 0 3px rgba(111,152,224,.2);outline:none;}
#aForm .acc-lined-textarea{background-image:repeating-linear-gradient(to bottom,transparent,transparent 27px,#dde6f3 27px,#dde6f3 28px);}
#aForm .desc-tb-btn{border:1.5px solid #d6deea;border-radius:12px;height:40px;width:44px;display:inline-flex;align-items:center;justify-content:center;}
#aForm .desc-tb-btn:active{background:#eef3fb;color:#1a1f35;}
#aForm .desc-ai-btn{border-radius:12px;height:40px;gap:8px;}
#aForm .upl-btn{border:1.5px solid #c9d3e6;}
#aForm .acc-check-item input[type=checkbox],#aForm input[type=radio]{accent-color:#1a1f35;}
#aForm .acc-roomtypes-details{border:1.5px solid #d6deea;border-radius:14px;}
#aForm .acc-roomtypes-details summary::before{color:#6b7280;}
#aForm .acc-age-policy-option{display:flex;align-items:center;gap:12px;border:1.5px solid #d6deea;border-radius:14px;padding:16px 18px;margin-bottom:10px;background:#fff;font-weight:700;cursor:pointer;}
#aForm .acc-age-policy-option .pa-icon{color:#2f6fb0;}
#aForm .acc-white-label .pa-icon{vertical-align:-3px;margin-right:6px;color:#2f6fb0;}
#rForm .acc-white-input,#rForm select,#rForm textarea{border:1.5px solid #d6deea;border-radius:12px;}
#rForm .acc-white-input:focus,#rForm select:focus,#rForm textarea:focus{border-color:#9db8e8;box-shadow:0 0 0 3px rgba(111,152,224,.2);outline:none;}
#rForm .acc-lined-textarea{background-image:repeating-linear-gradient(to bottom,transparent,transparent 27px,#dde6f3 27px,#dde6f3 28px);}
#rForm .desc-tb-btn{border:1.5px solid #d6deea;border-radius:12px;height:40px;width:44px;display:inline-flex;align-items:center;justify-content:center;}
#rForm .desc-tb-btn:active{background:#eef3fb;color:#1a1f35;}
#rForm .desc-ai-btn{border-radius:12px;height:40px;gap:8px;}
#rForm .upl-btn{border:1.5px solid #c9d3e6;}
#rForm .acc-check-item input[type=checkbox],#rForm input[type=radio]{accent-color:#1a1f35;}
#rForm .acc-roomtypes-details{border:1.5px solid #d6deea;border-radius:14px;}
#rForm .acc-roomtypes-details summary::before{color:#6b7280;}
#rForm .acc-age-policy-option{display:flex;align-items:center;gap:12px;border:1.5px solid #d6deea;border-radius:14px;padding:16px 18px;margin-bottom:10px;background:#fff;font-weight:700;cursor:pointer;}
#rForm .acc-age-policy-option .pa-icon{color:#2f6fb0;}
#rForm .acc-white-label .pa-icon{vertical-align:-3px;margin-right:6px;color:#2f6fb0;}
.pn-sec-title{font-weight:900;font-size:19px;padding-bottom:8px;border-bottom:1.5px solid #d6deea;margin:26px 0 16px;}
.pn-q{font-weight:800;font-size:15px;}.pn-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px;}.pn-row .acc-white-input{width:96px;margin-bottom:0;font-weight:700;}
.pn-card{border:1.5px solid #d6deea;border-radius:16px;padding:12px;background:#fafcff;margin:0 0 14px;display:flex;flex-direction:column;gap:8px;}
.pn-dd{border:1.5px solid #d6deea;border-radius:12px;background:#fff;}
.pn-dd>summary{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;font-weight:800;font-size:15px;cursor:pointer;list-style:none;}
.pn-dd>summary::-webkit-details-marker{display:none}.pn-dd>summary::after{content:"";width:9px;height:9px;border-right:2px solid #6b7280;border-bottom:2px solid #6b7280;transform:rotate(45deg);margin:-4px 4px 0 0;transition:transform .2s;flex:0 0 auto;}
.pn-dd[open]>summary::after{transform:rotate(-135deg);margin-top:4px;}
.pn-dd-t{display:flex;align-items:center;gap:9px;}.pn-dd-ico,.pn-opt-ico{display:inline-flex;color:#2f6fb0;flex:0 0 auto;}
.pn-dd-body{padding:2px 12px 12px;display:flex;flex-direction:column;gap:8px;}
.pn-opt{display:flex;align-items:center;gap:12px;padding:11px 12px;border:1.5px solid #e3e9f3;border-radius:10px;font-size:14.5px;font-weight:600;cursor:pointer;background:#fff;margin:0;}
.pn-opt input{width:19px;height:19px;margin:0;flex:0 0 auto;}
.pn-two{display:flex;gap:8px;flex-wrap:wrap;}.pn-two .pn-opt{flex:1 1 170px;font-weight:700;}
.pn-mini{font-size:12.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#6b7280;margin-top:4px;}
.pn-grp-title{display:flex;align-items:center;gap:9px;font-weight:900;font-size:15px;margin:16px 0 8px;color:#1a1f35;}
.pn-tile{margin:0 0 8px;padding:13px 14px;border-radius:14px;}
.pn-sub{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:4px 4px 8px 14px;}.pn-sub .pn-two{flex:1 1 100%;}.pn-seat{width:96px;margin-bottom:0;}
.pn-gap{height:14px;}
.pn-fluid{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .35s ease,opacity .3s ease;}.pn-fluid.is-open{grid-template-rows:1fr;opacity:1;}.pn-fluid>div{overflow:hidden;min-height:0;}
.pn-daisies{display:flex;gap:6px;margin:-4px 0 16px;}
.pn-facs{display:flex;flex-direction:column;gap:10px;margin-bottom:12px;}.pn-fac{padding:2px 14px 16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;}
.pn-fac .acc-check-item{margin:0;padding:14px;border-radius:14px;border-color:#d6deea;}
.pn-other-toggle{display:inline-flex;margin:0 0 12px;padding:14px 16px;border-color:#d6deea;border-radius:14px;font-weight:800;}
.pn-other-ta{min-height:96px;}
.pn-bigopt{display:flex;align-items:flex-start;gap:14px;padding:16px 18px;border:1.5px solid #d6deea;border-radius:16px;background:#fff;cursor:pointer;margin:0;}
.pn-bigopt input{width:22px;height:22px;margin:2px 0 0;flex:0 0 auto;accent-color:#1a1f35;}
.pn-bo-t{display:block;font-weight:900;font-size:16px;}.pn-bo-d{display:block;font-size:13.5px;color:#6b7280;margin-top:2px;line-height:1.45;}
.pn-opts{display:flex;flex-direction:column;gap:12px;}
.pn-subcard{margin-top:2px;padding:16px;border:1.5px solid #d6deea;border-radius:16px;background:#fafcff;display:flex;flex-direction:column;gap:14px;}
.pn-subcard-in{background:#fff;margin:8px 0 4px;}
.pn-subcard-t{font-weight:900;font-size:15.5px;display:flex;align-items:center;gap:9px;}
.pn-field{display:flex;flex-direction:column;gap:6px;}.pn-lbl{font-weight:700;font-size:14px;margin:0;}
.pn-col{display:flex;flex-direction:column;gap:8px;}.pn-cur{font-weight:800;}
.pn-cert{margin:0 0 16px;}.pn-cert .pn-lbl{margin-bottom:6px;font-weight:800;font-size:15px;}
.pn-opt-inline{flex-wrap:wrap;}.pn-opt-inline .pn-count{width:84px;height:42px;margin:0;}
.pn-bldg{margin-top:18px;display:flex;flex-direction:column;gap:14px;}.pn-span{grid-column:1/-1;}.pn-num{max-width:220px;}
.pn-roomlist{display:flex;flex-direction:column;gap:14px;}.pn-roomhead{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.pn-two2{display:flex;gap:12px;flex-wrap:wrap;}.pn-two2>.pn-field{flex:1 1 150px;min-width:0;}
.pn-rm{width:44px;height:44px;border:1.5px solid #d6deea;border-radius:12px;background:#fff;color:#6b7280;font-size:16px;cursor:pointer;}
.pn-add{margin-top:14px;width:100%;height:52px;border:1.5px dashed #b9c7dd;border-radius:14px;background:#fff;color:#1a1f35;font-weight:800;font-size:15.5px;cursor:pointer;}
.pn-other-toggle .pa-icon{display:none;}
#detForm select{background-color:#ffffff;}
#detForm .pn-count{background-color:#ffffff;}
.acc-td-box{margin:6px 0 18px;}.acc-td-heading{font-weight:800;font-size:16px;color:#1a1f2e;margin:22px 0 8px;padding-bottom:6px;border-bottom:2px solid #F0813A;}.acc-td-box .acc-roomtype-card{border:1px solid #dde1e6;border-radius:12px;padding:14px;margin:10px 0;position:relative;background:#fff;}.acc-editable-field-wrap{position:relative;}.acc-editable-field-wrap input{padding-right:38px !important;}.acc-editable-pencil{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#aaa;pointer-events:none;display:flex;}.acc-radio-col{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;}.acc-radio-item{display:flex;align-items:center;gap:8px;font-size:13.5px;color:#333;cursor:pointer;}.acc-radio-item input{width:16px;height:16px;accent-color:#F0813A;}.acc-unit-photo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 16px;}.acc-unit-photo-thumb{position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;}.acc-unit-photo-thumb img{width:100%;height:100%;object-fit:cover;}.acc-unit-photo-remove{position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:none;font-size:12px;cursor:pointer;}.acc-unit-photo-add{aspect-ratio:1;border:2px dashed #ccc;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#888;cursor:pointer;}

@media (max-width:400px){
  .acc-white-wrap,.acc-details-wrap,.acc-fiscal-wrap,.acc-sub-wrap{padding-left:16px !important;padding-right:16px !important;}
  .acc-details-bottombar,.acc-sub-bottombar{padding:0 16px;}
  .acc-fiscal-h1,.acc-white-h1{font-size:22px;}
  .acc-time-row{gap:8px;}
}
`;
}

// ------------------------------------------------------------------
// Limba paginilor de cazări / cont proprietar: română sau engleză.
// Ordinea: ?lang=ro|en (și se reține în cookie) → cookie „accLang” →
// limba browserului (dacă româna apare în listă → română) → domeniul
// (.ro → română) → engleză.
// ------------------------------------------------------------------
function getAccLang(req, res) {
  const q = req.query && typeof req.query.lang === "string" ? req.query.lang : "";
  if (q === "ro" || q === "en") {
    if (res) appendSetCookie(res, `accLang=${q}; Path=/; Max-Age=${365 * 24 * 60 * 60}; SameSite=Lax; Secure`);
    return q;
  }
  const c = parseCookies(req).accLang;
  if (c === "ro" || c === "en") return c;
  const al = String(req.headers["accept-language"] || "").toLowerCase();
  if (/(^|,)\s*ro\b/.test(al) || /(^|,)\s*mo\b/.test(al)) return "ro";
  if (!al) return isIntlHost(req) ? "en" : "ro";
  return isIntlHost(req) ? "en" : (al ? "en" : "ro");
}

function accLangHref(req, l) {
  const params = new URLSearchParams();
  Object.keys(req.query || {}).forEach((k) => {
    if (k === "lang") return;
    const v = req.query[k];
    (Array.isArray(v) ? v : [v]).forEach((x) => { if (typeof x === "string") params.append(k, x); });
  });
  params.set("lang", l);
  return `${req.path}?${params.toString()}`;
}

// Butonul RO | EN — păstrează adresa și parametrii paginii, schimbă doar limba.
function accLangSwitchHtml(req, lang, dark) {
  const params = new URLSearchParams();
  Object.keys(req.query || {}).forEach((k) => {
    if (k === "lang") return;
    const v = req.query[k];
    (Array.isArray(v) ? v : [v]).forEach((x) => { if (typeof x === "string") params.append(k, x); });
  });
  const href = (l) => { const p = new URLSearchParams(params); p.set("lang", l); return `${req.path}?${p.toString()}`; };
  const base = dark ? "color:#c9d1d9;border-color:#3a4150;" : "color:#444;border-color:#ddd;";
  const item = (l, label) => l === lang
    ? `<span style="padding:5px 10px;border-radius:999px;background:#F0813A;color:#fff;font-weight:800;">${label}</span>`
    : `<a href="${escapeHtml(href(l))}" style="padding:5px 10px;border-radius:999px;text-decoration:none;font-weight:700;${dark ? "color:#c9d1d9;" : "color:#444;"}" hreflang="${l}">${label}</a>`;
  return `<nav class="acc-lang-switch" aria-label="Language" style="display:inline-flex;gap:2px;border:1.5px solid;${base}border-radius:999px;padding:2px;font-size:13px;line-height:1;background:${dark ? "transparent" : "#fff"};">${item("ro", "RO")}${item("en", "EN")}</nav>`;
}


// ------------------------------------------------------------------
// Ora României (serverul Vercel rulează în UTC — fără asta, „deschis
// acum” la restaurante/obiective era decalat cu 2–3 ore).
// ------------------------------------------------------------------
function roNowParts(d) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false });
  const p = {};
  f.formatToParts(d || new Date()).forEach((x) => { p[x.type] = x.value; });
  const hour = p.hour === "24" ? 0 : Number(p.hour);
  return { date: `${p.year}-${p.month}-${p.day}`, dayIdx: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday], minutes: hour * 60 + Number(p.minute) };
}

function hhmmToMin(t) {
  if (typeof t !== "string" || !/^\d{1,2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(":").map(Number);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

// deschis între open și close; acceptă și program peste miezul nopții (ex. 18:00–02:00)
function isOpenBetween(open, close, minutes) {
  const o = hhmmToMin(open), c = hhmmToMin(close);
  if (o === null || c === null) return false;
  if (c <= o) return minutes >= o || minutes < c;
  return minutes >= o && minutes < c;
}

function sqlDateStr(v) {
  if (!v) return "";
  if (v instanceof Date) {
    // node-postgres construiește un DATE la miezul nopții LOCAL al serverului → citim componentele locale
    const pad = (n) => String(n).padStart(2, "0");
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  }
  return String(v).slice(0, 10);
}

// „Liber în seara asta” (cazări): valabil doar în ziua marcată — expiră singur la miezul nopții
function isAvailableTonight(r) {
  return !!(r && r.available_date && sqlDateStr(r.available_date) === roNowParts().date);
}

// Status live setat de proprietar pentru azi (restaurante / obiective)
function todayLiveStatus(r) {
  if (!r || !r.live_status || sqlDateStr(r.live_status_date) !== roNowParts().date) return null;
  return { status: r.live_status, until: r.live_status_until || null, note: r.live_status_note || null };
}

function socialLinksHtml(r, cls, backPath) {
  const items = [
    ["facebook", r.facebook_url, "Facebook"],
    ["instagram", r.instagram_url, "Instagram"],
    ["tiktok", r.tiktok_url, "TikTok"],
  ].filter((x) => x[1]);
  if (!items.length) return "";
  // Link printr-o pagină de-a noastră, nu direct spre rețeaua socială —
  // pe unele telefoane/PWA-uri, un link normal spre alt site chiar
  // ÎNLOCUIEȘTE fila curentă (nu deschide una nouă), deci vizitatorul
  // rămânea „blocat” pe Facebook, fără drum înapoi spre pensiune.
  const socialHref = (url, network) => `/pleci?spre=${encodeURIComponent(network)}&url=${encodeURIComponent(url)}${backPath ? `&inapoi=${encodeURIComponent(backPath)}` : ""}`;
  return `<div class="${cls}">${items.map((x) => `<a href="${socialHref(x[1], x[0])}" title="${x[2]}" aria-label="${x[2]}">${SOCIAL_ICONS[x[0]]}</a>`).join("")}</div>`;
}

function ratingSymbolFor(type) { return DAISY_TYPES.includes(type) ? "🌼" : "⭐"; }


function classificationOptionLabels(type, lang) {
  const daisy = DAISY_TYPES.includes(type);
  const sym = daisy ? "🌼" : "⭐";
  const en = lang === "en";
  return [1, 2, 3, 4, 5].map((n) => {
    const word = daisy
      ? (en ? (n === 1 ? "daisy" : "daisies") : (n === 1 ? "margaretă" : "margarete"))
      : (en ? (n === 1 ? "star" : "stars") : (n === 1 ? "stea" : "stele"));
    return sym.repeat(n) + " " + n + " " + word;
  });
}

function classificationLabelText(type, lang) {
  const daisy = DAISY_TYPES.includes(type);
  if (lang === "en") return daisy ? "Official classification — daisies (optional)" : "Official classification — stars (optional)";
  return daisy ? "Clasificare oficială — margarete (opțional)" : "Clasificare oficială — stele (opțional)";
}

function classificationOptionsHtml(type, selected, lang) {
  const none = `<option value="0"${!Number(selected) ? " selected" : ""}>${lang === "en" ? "No classification / Not specified" : "Fără clasificare / Nespecificat"}</option>`;
  return none + classificationOptionLabels(type, lang).map((label, i) => `<option value="${i + 1}"${Number(selected) === i + 1 ? " selected" : ""}>${label}</option>`).join("");
}


function accWhiteLegalHtml(lang) {
  if (lang === "en") {
    return `<div class="acc-white-legal">
    By signing in or creating an account, you agree to our <a href="/termeni-si-conditii">Terms and Conditions</a> and our <a href="/politica-de-confidentialitate">Privacy Policy</a>.<br>
    All rights reserved.<br>
    Copyright Opening <span style="color:var(--accent)">Hours Today</span>™
  </div>`;
  }
  return `<div class="acc-white-legal">
    Prin autentificare sau prin crearea unui cont, sunteți de acord cu <a href="/termeni-si-conditii">Termenii și Condițiile noastre</a> și cu <a href="/politica-de-confidentialitate">Politica de confidențialitate</a>.<br>
    Toate drepturile rezervate.<br>
    Copyright Opening <span style="color:var(--accent)">Hours Today</span>™
  </div>`;
}

// Footer temă închisă — pentru paginile dark (director cazări, pagina unei
// proprietăți) — conținut identic cu footer-ul de pe paginile albe, doar
// stilizat pentru fundal întunecat, ca să fie unitar peste tot.
function accDarkFooterHtml(lang) {
  const en = lang === "en";
  return `
<footer class="acc-dark-footer">
  <div class="acc-dark-footer-inner">
    ${en ? "By signing in or creating an account, you agree to our" : "Prin autentificare sau prin crearea unui cont, sunteți de acord cu"} <a href="/termeni-si-conditii">${en ? "Terms and Conditions" : "Termenii și Condițiile noastre"}</a> ${en ? "and our" : "și cu"} <a href="/politica-de-confidentialitate">${en ? "Privacy Policy" : "Politica de confidențialitate"}</a>.<br>
    ${en ? "All rights reserved." : "Toate drepturile rezervate."}<br>
    Copyright Opening <span style="color:var(--accent)">Hours Today</span>™
  </div>
</footer>`;
}

function accCurrencyModalHtml(lang) {
  const en = lang === "en";
  return `
<div class="acc-currency-modal-backdrop" id="accCurrencyModalBackdrop">
  <div class="acc-currency-modal">
    <div class="acc-currency-modal-header">
      <h2>${en ? "Select currency" : "Selectați moneda"}</h2>
      <button type="button" class="acc-currency-modal-close" id="accCurrencyModalClose">✕</button>
    </div>
    <p class="acc-currency-modal-sub">${en ? "Prices will be converted and shown in the currency you choose, based on the current exchange rate." : "Prețurile vor fi transformate și afișate în moneda pe care o alegeți, pe baza cursului valutar curent."}</p>
    <div class="acc-currency-grid">
      ${ACC_SUPPORTED_CURRENCIES.map((c) => `<button type="button" class="acc-currency-option" data-currency="${c}"><span class="name">${(en ? ACC_CURRENCY_LABELS_EN : ACC_CURRENCY_LABELS)[c]}</span><span class="code">${c}</span></button>`).join("")}
    </div>
  </div>
</div>`;
}

function accCurrencyScript() {
  return `
(function(){
  var STORAGE_KEY = "accCurrency";
  var rates = null;
  function getCurrency(){ return localStorage.getItem(STORAGE_KEY) || "RON"; }
  function setCurrency(c){ localStorage.setItem(STORAGE_KEY, c); }

  function applyConversion(){
    var target = getCurrency();
    var btn = document.getElementById("accCurrencyBtn");
    if (btn) btn.textContent = target;
    document.querySelectorAll(".acc-currency-option").forEach(function(o){
      o.classList.toggle("is-selected", o.getAttribute("data-currency") === target);
    });
    if (!rates) return;
    document.querySelectorAll("[data-price][data-currency]").forEach(function(el){
      var amount = parseFloat(el.getAttribute("data-price"));
      var from = el.getAttribute("data-currency");
      if (!amount || !rates.rates[from] || !rates.rates[target]) return;
      var inEur = amount / rates.rates[from];
      var converted = inEur * rates.rates[target];
      var rounded = Math.round(converted);
      el.textContent = rounded.toLocaleString("ro-RO") + " " + target;
    });
  }

  fetch("/api/cazare/exchange-rates").then(function(r){ return r.json(); }).then(function(data){
    rates = data;
    applyConversion();
  }).catch(function(){});

  applyConversion();

  var openBtn = document.getElementById("accCurrencyBtn");
  var backdrop = document.getElementById("accCurrencyModalBackdrop");
  var closeBtn = document.getElementById("accCurrencyModalClose");
  if (openBtn && backdrop) openBtn.addEventListener("click", function(){ backdrop.classList.add("is-open"); });
  if (closeBtn && backdrop) closeBtn.addEventListener("click", function(){ backdrop.classList.remove("is-open"); });
  if (backdrop) backdrop.addEventListener("click", function(e){ if (e.target === backdrop) backdrop.classList.remove("is-open"); });
  document.querySelectorAll(".acc-currency-option").forEach(function(o){
    o.addEventListener("click", function(){
      setCurrency(o.getAttribute("data-currency"));
      applyConversion();
      backdrop.classList.remove("is-open");
    });
  });

  var langBtn = document.getElementById("accLangBtn");
  var langDropdown = document.getElementById("accLangDropdown");
  if (langBtn && langDropdown) {
    langBtn.addEventListener("click", function(e){
      e.stopPropagation();
      langDropdown.classList.toggle("is-open");
    });
    document.addEventListener("click", function(e){
      if (!langDropdown.contains(e.target) && e.target !== langBtn) langDropdown.classList.remove("is-open");
    });
  }

  var userBtn = document.getElementById("accNavUserBtn");
  var userDropdown = document.getElementById("accNavUserDropdown");
  if (userBtn && userDropdown) {
    userBtn.addEventListener("click", function(e){
      e.stopPropagation();
      userDropdown.classList.toggle("is-open");
    });
    document.addEventListener("click", function(e){
      if (!userDropdown.contains(e.target) && e.target !== userBtn) userDropdown.classList.remove("is-open");
    });
    var logoutBtn = document.getElementById("accNavLogoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function(){
        fetch("/api/cazare/logout", { method: "POST" }).then(function(){ window.location.replace("/"); });
      });
    }
  }
})();`;
}


// ============================================================
// Shell comun pentru zona de cont (/cont, /cont/date-fiscale,
// /cont/facturi-abonamente) — header cu meniu hamburger, temă închisă
// (spre deosebire de fluxul de înregistrare, care e intenționat alb).
// ============================================================
function accShellStyles() {
  return `
.acc-shell-header{background:#161b22;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:20;}
.acc-shell-header .brand{color:#fff;font-weight:900;font-size:19px;text-decoration:none;}
.acc-shell-header .brand span{color:var(--accent);}
.acc-hamburger-btn{background:none;border:none;color:#fff;font-size:26px;cursor:pointer;padding:4px 8px;}
.acc-shell-user{display:flex;align-items:center;gap:8px;color:#fff;font-size:13px;}
.acc-shell-avatar{width:32px;height:32px;border-radius:50%;background:#232a35;border:2px solid var(--accent);color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;}
.acc-drawer-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:29;}
.acc-drawer-backdrop.is-open{display:block;}
.acc-drawer{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:82vw;background:#161b22;z-index:30;transform:translateX(-100%);transition:transform .2s ease;padding:20px;box-sizing:border-box;display:flex;flex-direction:column;height:100vh;height:100dvh;}
.acc-drawer-nav{flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;margin:0 -8px;padding:0 8px;}
.acc-drawer-foot{flex:0 0 auto;border-top:1px solid #2a3140;margin-top:8px;padding-top:8px;}
@media (max-height:820px){.acc-drawer{padding:14px 18px;}.acc-drawer-close{margin-bottom:8px;}.acc-drawer-user-email{margin-bottom:10px;}.acc-drawer-item{padding:9px 10px;}}
@media (max-height:600px){.acc-drawer-item{padding:7px 10px;font-size:14px;}}
.acc-drawer.is-open{transform:translateX(0);}
.acc-drawer-close{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;margin-bottom:18px;}
.acc-drawer-user{color:#fff;font-weight:700;margin-bottom:4px;}
.acc-drawer-user-email{color:var(--muted);font-size:12.5px;margin-bottom:20px;}
.acc-drawer-item{display:flex;align-items:center;gap:12px;padding:13px 10px;color:#e8ebf0;text-decoration:none;border-radius:10px;font-size:14.5px;font-weight:600;background:none;border:none;width:100%;text-align:left;cursor:pointer;}
.acc-drawer-item:hover, .acc-drawer-item.is-active{background:#232a35;color:#fff;}
.acc-drawer-item .icon{font-size:18px;flex:0 0 auto;display:flex;color:#F0813A;}
.acc-drawer-divider{border:none;border-top:1px solid #2a3140;margin:12px 0;}
.acc-drawer-item.acc-logout{color:#ff8a8a;}
.acc-shell-main{max-width:900px;margin:0 auto;padding:30px 20px 60px;}
.acc-shell-h1{font-size:26px;font-weight:900;color:var(--text);margin:0 0 6px;}
.acc-prop-card{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:16px;overflow:hidden;margin-bottom:16px;display:flex;gap:0;}
@media (max-width:560px){.acc-prop-card{flex-direction:column;}}
.acc-prop-card-img{width:180px;flex:0 0 180px;object-fit:cover;}
@media (max-width:560px){.acc-prop-card-img{width:100%;height:160px;flex:0 0 160px;}}
@media (max-width:480px){.acc-shell-main{padding:20px 14px 48px;}.acc-shell-h1{font-size:22px;}.acc-shell-header{padding:12px 14px;}.acc-shell-header .brand{font-size:17px;}.acc-section-box{padding:14px !important;}.acc-section-titlebar{padding:10px 12px !important;}.acc-section-titlebar a{white-space:normal !important;}}
.acc-prop-card-body{padding:16px;flex:1;display:flex;flex-direction:column;}
.acc-prop-card-name{font-size:17px;font-weight:800;color:var(--text);}
.acc-prop-card-meta{color:var(--muted);font-size:13.5px;margin:4px 0 10px;}
.acc-prop-card-actions{margin-top:auto;display:flex;gap:8px;flex-wrap:wrap;}
.acc-prop-card-actions a{text-decoration:none;font-size:13px;font-weight:700;padding:8px 14px;border-radius:8px;}
.acc-edit-btn{background:var(--accent);color:#fff;}
.acc-view-btn{background:none;border:1px solid var(--glass-border);color:var(--text);}
.acc-empty-state{text-align:center;padding:50px 20px;color:var(--muted);}
.acc-warning-banner{background:#3a2a12;border:1px solid #a56a1a;color:#ffcf7a;border-radius:12px;padding:14px 16px;margin-bottom:20px;display:flex;gap:10px;align-items:flex-start;}
`;
}

function accDrawerHtml(activeItem, ownerEmail, lang) {
  const L = (ro, en) => (lang === "en" ? en : ro);
  const items = [
    { key: "contul-meu", href: "/cont/contul-meu", icon: paIcon("user"), label: L("Contul meu", "My account") },
    { key: "proprietati", href: "/cont", icon: paIcon("home"), label: L("Proprietățile mele", "My properties") },
    { key: "recenzii", href: "/cont/recenzii", icon: paIcon("star"), label: L("Recenzii", "Reviews") },
    { key: "fiscale", href: "/cont/date-fiscale", icon: paIcon("document"), label: L("Date fiscale", "Tax details") },
    { key: "adauga", href: "/cont/alege-tip", icon: paIcon("plus"), label: L("Adaugă o cazare", "Add a property") },
    { key: "adauga-local", href: "/cont-restaurant/nou", icon: paIcon("plus"), label: L("Adaugă un local", "Add a venue") },
    { key: "adauga-obiectiv", href: "/cont-obiectiv/nou", icon: paIcon("plus"), label: L("Adaugă un obiectiv turistic", "Add a tourist attraction") },
    { key: "informatii", href: "/cont/informatii", icon: paIcon("info"), label: L("Informații", "How it works") },
    { key: "contact", href: "/cont/contact", icon: paIcon("chat"), label: L("Contact OpeningHoursToday", "Contact OpeningHoursToday") },
  ];
  return `
<div class="acc-drawer-backdrop" id="accDrawerBackdrop"></div>
<div class="acc-drawer" id="accDrawer">
  <button type="button" class="acc-drawer-close" id="accDrawerClose">✕</button>
  <div class="acc-drawer-user">${L("Contul tău", "Your account")}</div>
  <div class="acc-drawer-user-email">${escapeHtml(ownerEmail)}</div>
  <div class="acc-drawer-nav">
  ${items.map((it) => `<a href="${it.href}" class="acc-drawer-item${activeItem === it.key ? " is-active" : ""}"><span class="icon">${it.icon}</span>${it.label}</a>`).join("")}
  <a href="https://ko-fi.com/openinghourstoday" target="_blank" rel="noopener" class="acc-drawer-item"><span class="icon">${paIcon("coffee")}</span>${L("Cumpără-ne o cafea", "Buy us a coffee")}</a>
  </div>
  <div class="acc-drawer-foot">
    <button type="button" class="acc-drawer-item acc-logout" id="accLogoutBtn"><span class="icon">${paIcon("logout")}</span>${L("Deconectare", "Sign out")}</button>
    <button type="button" class="acc-drawer-item acc-delete-account" id="accDeleteAccountBtn"><span class="icon">${paIcon("trash")}</span>${L("Șterge cont", "Delete account")}</button>
  </div>
</div>`;
}

function accDrawerScript() {
  return `
// Dacă acest cont a fost creat de echipa noastră (din Prospectare) și
// proprietarul nu și-a schimbat încă emailul/parola, îi reamintim clar,
// la fiecare vizită, pe orice pagină din cont — fără să-i blocăm munca.
if (window.location.pathname !== "/cont/contul-meu") {
  fetch("/api/cont/stare-cont").then(function(r){ return r.json(); }).then(function(d){
    if (!d.needsSetup) return;
    var overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;";
    var box = document.createElement("div");
    box.style.cssText = "background:#fff;color:#111;border-radius:14px;padding:26px 22px;max-width:360px;text-align:center;";
    box.innerHTML = "<div style=\\"font-size:32px;margin-bottom:10px;\\">🔒</div><p style=\\"font-weight:700;font-size:15.5px;line-height:1.5;margin:0 0 18px;\\">Pentru securitatea contului vă rugăm să vă setați adresa de e-mail și o nouă parolă.</p>";
    var goBtn = document.createElement("a");
    goBtn.href = "/cont/contul-meu";
    goBtn.textContent = "Setează acum";
    goBtn.style.cssText = "display:block;background:#F0813A;color:#fff;font-weight:800;border-radius:10px;padding:13px;text-decoration:none;margin-bottom:10px;";
    var laterBtn = document.createElement("button");
    laterBtn.type = "button"; laterBtn.textContent = "Mai târziu";
    laterBtn.style.cssText = "background:none;border:none;color:#888;font-weight:600;cursor:pointer;padding:6px;";
    laterBtn.addEventListener("click", function(){ overlay.remove(); });
    box.appendChild(goBtn); box.appendChild(laterBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }).catch(function(){});
}
var hamBtn = document.getElementById("accHamburgerBtn");
var drawer = document.getElementById("accDrawer");
var backdrop = document.getElementById("accDrawerBackdrop");
var closeBtn = document.getElementById("accDrawerClose");
function openDrawer(){ drawer.classList.add("is-open"); backdrop.classList.add("is-open"); }
function closeDrawer(){ drawer.classList.remove("is-open"); backdrop.classList.remove("is-open"); }
if (hamBtn) hamBtn.addEventListener("click", openDrawer);
if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
if (backdrop) backdrop.addEventListener("click", closeDrawer);
var logoutBtn = document.getElementById("accLogoutBtn");
if (logoutBtn) logoutBtn.addEventListener("click", function(){
  fetch("/api/cazare/logout", { method: "POST" }).then(function(){ window.location.replace("/"); });
});
var deleteAccBtn = document.getElementById("accDeleteAccountBtn");
if (deleteAccBtn) deleteAccBtn.addEventListener("click", function(){
  var sure = confirm("Sigur vrei să ștergi definitiv contul tău?\\n\\nSe vor șterge permanent: toate anunțurile tale (cazări, restaurante, obiective), toate pozele, recenziile și datele contului. Acțiunea NU poate fi anulată.\\n\\nApasă OK pentru a continua, sau Anulează pentru a renunța.");
  if (!sure) return;
  var sureAgain = confirm("Ultima confirmare: ștergem acum, definitiv, contul și tot ce conține. Continui?");
  if (!sureAgain) return;
  deleteAccBtn.disabled = true; deleteAccBtn.textContent = "Se șterge...";
  fetch("/api/cont/sterge-cont", { method: "POST" })
    .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, data: d }; }); })
    .then(function(res){
      if (res.ok) { window.location.replace("/?cont-sters=1"); }
      else { deleteAccBtn.disabled = false; deleteAccBtn.innerHTML = "<span class=\\"icon\\">🗑️</span>Șterge cont"; alert("Ștergerea a eșuat. Încearcă din nou sau scrie-ne pe WhatsApp."); }
    })
    .catch(function(){ deleteAccBtn.disabled = false; deleteAccBtn.innerHTML = "<span class=\\"icon\\">🗑️</span>Șterge cont"; alert("Ștergerea a eșuat — conexiune sau server indisponibil."); });
});
`;
}

function accShellHeader(ownerEmail, langSwitchHtml, req) {
  // Banda de „mod admin” a fost eliminată intenționat — contul trebuie să
  // funcționeze identic, fie că proprietarul l-a creat singur, fie că a fost
  // creat de admin din Prospectare. Singurul semnal rămas e popup-ul de
  // securitate de la prima logare (vezi accDrawerScript).
  return `
<div class="acc-shell-header">
  <button type="button" class="acc-hamburger-btn" id="accHamburgerBtn">☰</button>
  <a class="brand" href="/">Opening<span>HoursToday</span></a>
  <div class="acc-shell-user" style="display:flex;align-items:center;gap:10px;">${langSwitchHtml || ""}
    <div class="acc-shell-avatar">${escapeHtml((ownerEmail || "?")[0].toUpperCase())}</div>
  </div>
</div>`;
}


// ============================================================
// Shell de ADMIN — sidebar comun, pe toate paginile /admin/* legate de
// cazare (Cazări, Recenzii, Setări, Dashboard). /admin/propuneri (secțiunea
// generală, mai veche, nu doar de cazare) rămâne cu stilul ei propriu, dar
// primește un link din sidebar, pentru navigare dintr-un singur loc.
// ============================================================
function adminShellStyles() {
  return `
*{box-sizing:border-box;}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0d1117;color:#e6edf3;margin:0;}
.admin-shell{display:flex;min-height:100vh;}
.admin-sidebar{width:230px;flex:0 0 230px;background:#161b22;padding:20px 14px;position:sticky;top:0;height:100vh;overflow-y:auto;}
@media (max-width:760px){.admin-sidebar{position:fixed;left:0;top:0;bottom:0;z-index:40;transform:translateX(-100%);transition:transform .2s ease;box-shadow:4px 0 24px rgba(0,0,0,.4);}
  .admin-sidebar.is-open{transform:translateX(0);}
  .admin-shell{display:block;}
}
.admin-sidebar-brand{color:#fff;font-weight:900;font-size:17px;padding:8px 10px 20px;}
.admin-sidebar-brand span{color:#ff8a3d;}
.admin-nav-item{display:flex;align-items:center;gap:10px;padding:11px 10px;color:#c9d1d9;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:2px;}
.admin-nav-item:hover, .admin-nav-item.is-active{background:#21262d;color:#fff;}
.admin-nav-item .badge{margin-left:auto;background:#ff8a3d;color:#111;font-size:11px;font-weight:800;border-radius:999px;padding:1px 7px;}
.admin-nav-divider{border:none;border-top:1px solid #21262d;margin:14px 0;}
.admin-main{flex:1;padding:26px 30px;max-width:1100px;}
@media (max-width:640px){.admin-main{padding:18px 14px;}}
.admin-mobile-bar{display:none;background:#161b22;padding:12px 16px;align-items:center;gap:12px;}
@media (max-width:760px){.admin-mobile-bar{display:flex;}}
.admin-mobile-bar button{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;}
.admin-h1{font-size:24px;font-weight:900;margin:0 0 20px;}
.admin-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:28px;}
.admin-stat-card{background:#161b22;border:1px solid #21262d;border-radius:12px;padding:18px;}
.admin-stat-card .num{font-size:28px;font-weight:900;color:#ff8a3d;}
.admin-stat-card .label{color:#8b949e;font-size:12.5px;margin-top:4px;}
.admin-stat-card.is-warning .num{color:#ffcf7a;}
.admin-section-title{font-size:16px;font-weight:800;margin:26px 0 12px;color:#e6edf3;}
.admin-tabs{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;}
.admin-tab{color:#999;text-decoration:none;padding:8px 14px;border-radius:999px;border:1px solid #333;font-size:13.5px;}
.admin-tab.is-active{background:#ff8a3d;color:#111;border-color:#ff8a3d;font-weight:700;}
.admin-submission-card{background:#1c1c1c;border-radius:10px;padding:16px;margin-bottom:12px;}
.admin-photo-grid{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0;}
.admin-photo-item{position:relative;width:70px;height:70px;}
.admin-photo-item img{width:100%;height:100%;object-fit:cover;border-radius:6px;display:block;}
.admin-photo-del{position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:#e53935;color:#fff;border:none;font-size:12px;line-height:1;cursor:pointer;}

.admin-submission-header{display:flex;justify-content:space-between;margin-bottom:6px;align-items:center;}
.admin-submission-type{font-weight:700;}
.admin-status-tag{font-size:11.5px;font-weight:700;padding:3px 10px;border-radius:999px;}
.admin-status-pending{background:#4a3a1a;color:#ffcf7a;}
.admin-status-approved{background:#1a3a1f;color:#7affA0;}
.admin-status-rejected{background:#3a1a1a;color:#ff9d9d;}
.admin-submission-name{font-size:17px;font-weight:700;}
.admin-submission-name a{color:#ff8a3d;font-size:13px;font-weight:600;}
.admin-submission-meta{color:#999;margin:4px 0;font-size:13.5px;}
.admin-submission-actions{margin-top:10px;display:flex;gap:8px;}
.admin-approve-btn{background:#2e7d32;color:#fff;border:none;border-radius:6px;padding:8px 14px;cursor:pointer;}
.admin-reject-btn{background:#c62828;color:#fff;border:none;border-radius:6px;padding:8px 14px;cursor:pointer;}
.admin-repending-btn{background:#555;color:#fff;border:none;border-radius:6px;padding:8px 14px;cursor:pointer;}
a{color:#ff8a3d;}
label{display:block;font-weight:700;margin-bottom:6px;}
input[type="number"], input[type="text"]{width:100%;box-sizing:border-box;padding:12px;border-radius:8px;border:1px solid #444;background:#1c1c1c;color:#eee;font-size:16px;margin-bottom:16px;}
button.admin-btn{background:#ff8a3d;color:#111;font-weight:700;border:none;border-radius:8px;padding:12px 20px;cursor:pointer;}
`;
}

function adminMobileBarHtml() {
  return `<div class="admin-mobile-bar"><button type="button" id="adminSidebarToggle">☰</button><strong>Admin</strong></div>`;
}

function adminSidebarScript() {
  return `
var toggleBtn = document.getElementById("adminSidebarToggle");
var sidebar = document.getElementById("adminSidebar");
if (toggleBtn) toggleBtn.addEventListener("click", function(){ sidebar.classList.toggle("is-open"); });
`;
}


function restaurantGate(req, res, next) {
  if (RESTAURANT_LIVE) { next(); return; }
  res.set("Cache-Control", "no-store");
  if (!RESTAURANT_PREVIEW_KEY) { res.status(404).send("Not found"); return; }
  const cookies = parseCookies(req);
  const cookieOk = cookies.restPreview === RESTAURANT_PREVIEW_KEY;
  const queryOk = req.query.preview === RESTAURANT_PREVIEW_KEY;
  if (!cookieOk && !queryOk) { res.status(404).send("Not found"); return; }
  if (queryOk && !cookieOk) {
    appendSetCookie(res, `restPreview=${encodeURIComponent(RESTAURANT_PREVIEW_KEY)}; Path=/; Max-Age=${90 * 24 * 60 * 60}; HttpOnly; SameSite=Lax; Secure`);
  }
  next();
}

function mapFor(map, lang) { return (lang === "en" && I18N_MAPS_EN.get(map)) || map; }

// Variantă {cheie: {ro, en}} a facilităților de cazare, fără emoji — pentru
// bifele per-unitate din „Structură unități” (reutilizăm textele deja
// existente, nu le mai scriem o dată).


async function renderAttractionListingForm(req, res, existingListing) {
  const lang = getAccLang(req, res);
  const L = (ro, en) => (lang === "en" ? en : ro);
  const t = existingListing || {};
  const amenitiesSelected = new Set(Array.isArray(t.amenities) ? t.amenities : []);
  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  res.set("Content-Type", "text/html; charset=utf-8");
  const venueTypeOptionsHtml = Object.keys(ATTRACTION_VENUE_TYPES)
    .map((k) => `<option value="${k}"${t.venue_type === k ? " selected" : ""}>${escapeHtml(mapFor(ATTRACTION_VENUE_TYPES, lang)[k])}</option>`).join("");
  const amenitiesHtml = Object.keys(ATTRACTION_AMENITIES)
    .map((k) => `<label class="acc-check-item">${paIcon(k)}<input type="checkbox" class="a-amenity" value="${k}"${amenitiesSelected.has(k) ? " checked" : ""}><span>${escapeHtml(stripLeadingEmoji(mapFor(ATTRACTION_AMENITIES, lang)[k]))}</span></label>`).join("");
  res.send(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>${t.id ? L("Editează", "Edit") : L("Propune", "Suggest")} ${L("un obiectiv turistic", "a tourist attraction")} — Opening Hours Today</title>
<style>${accWhitePageStyles()}
.acc-details-wrap{max-width:560px;margin:0 auto;padding:40px 24px 120px;text-align:left;}
.r-section-title{font-size:17px;font-weight:800;color:#111;margin:32px 0 4px;padding-top:20px;border-top:1px solid #eee;}
.r-section-title:first-child{margin-top:0;padding-top:0;border-top:none;}
</style></head>
<body>
<div class="acc-details-wrap">
  <div style="display:flex;justify-content:flex-end;margin:-20px 0 12px;">${accLangSwitchHtml(req, lang)}</div>
  <h1 class="acc-fiscal-h1">${t.id ? L("Editează obiectivul", "Edit attraction") : L("Adaugă un obiectiv turistic", "Add a tourist attraction")}</h1>
  <p class="acc-fiscal-sub">${L("Vă mulțumim că doriți să adăugați o nouă destinație pe site — completați detaliile de mai jos, ca turiștii să aibă tot ce le trebuie pentru vizită.", "Thank you for adding a new destination to the site — fill in the details below so visitors have everything they need for their visit.")}</p>

${t._fromProposal ? `<div style="margin:0 0 18px;padding:14px 16px;border:1.5px solid #d6deea;border-radius:14px;background:#f6f9ff;font-size:14.5px;line-height:1.5;"><strong>${L("Completezi pagina revendicată.", "You are completing the claimed page.")}</strong> ${L("Am preluat datele din propunere (nume, localitate, program). Verifică-le, apoi adaugă poze, meniu și date de contact. După aprobare, recenziile existente se mută pe noua pagină.", "We imported the details from the suggestion (name, town, hours). Check them, then add photos, a menu and contact details. After approval, the existing reviews move to the new page.")}${t._cityAmbiguous ? `<div style="margin-top:10px;padding:10px 12px;border:1.5px solid #f0b36a;border-radius:10px;background:#fff7ea;"><strong>${L("Alege județul.", "Choose the county.")}</strong> ${L("Există " + t._cityAmbiguous + " localități care se potrivesc cu „" + escapeHtml(t.city) + "”. Alege-o pe cea corectă din lista de sugestii de la „Localitate” (scrie și județul, ex. „" + escapeHtml(t.city) + " Hunedoara”).", t._cityAmbiguous + " places match “" + escapeHtml(t.city) + "”. Pick the right one from the suggestions in “Town” (you can type the county too, e.g. “" + escapeHtml(t.city) + " Hunedoara”).")}</div>` : ""}</div>` : ""}
  <form id="aForm">
    <div style="position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;" aria-hidden="true">
      <label for="aWebsiteHoneypot">${L("Lăsați acest câmp gol", "Leave this field empty")}</label>
      <input type="text" id="aWebsiteHoneypot" name="website" tabindex="-1" autocomplete="off">
    </div>

    <div class="r-section-title">${L("1. Clasificare obiectiv turistic", "1. Type of attraction")}</div>
    <label class="acc-white-label" for="aVenueType">${L("Tipul obiectivului / atracției", "Type of attraction")}</label>
    <select id="aVenueType" class="acc-white-input" required>${venueTypeOptionsHtml}</select>
    <div id="aVenueOtherWrap" style="display:${t.venue_type === "altul" ? "block" : "none"}">
      <label class="acc-white-label" for="aVenueOther">${L("Specificați", "Please specify")}</label>
      <input type="text" id="aVenueOther" class="acc-white-input" value="${escapeHtml(t.venue_type_other || "")}">
    </div>

    <div class="r-section-title">${L("2. Informații generale", "2. General information")}</div>
    <label class="acc-white-label" for="aName">${L("Numele oficial (cum va apărea pe site)", "Official name (as it will appear on the site)")}</label>
    <input type="text" id="aName" class="acc-white-input" maxlength="150" value="${escapeHtml(t.name || "")}" required>
    <label class="acc-white-label" for="aDescription">${L("Scurtă descriere / povestea locului", "Short description / the story of the place")}</label>
    <p class="desc-ai-hint" style="margin:-4px 0 10px;">${L("Poți scrie tu descrierea, sau apeși „Generează descriere” ca s-o scrie AI-ul. Pentru o descriere completă, generată de AI, completează întâi restul formularului mai jos (tip, administrator, acces) — AI-ul folosește doar ce ai completat deja.", "You can write the description yourself, or press “Generate description” to have AI write it. For a complete, AI-generated description, fill in the rest of the form below first (type, managing organisation, access) — the AI only uses what you already filled in.")}</p>
    <div class="desc-toolbar" role="toolbar" aria-label="${L("Formatare text", "Text formatting")}">
      <button type="button" class="desc-tb-btn" data-cmd="bold" data-target="aDescription" title="Bold"><b>B</b></button>
      <button type="button" class="desc-tb-btn" data-cmd="italic" data-target="aDescription" title="Italic"><i>I</i></button>
      <button type="button" class="desc-tb-btn" data-cmd="underline" data-target="aDescription" title="Underline"><u>U</u></button>
      <button type="button" class="desc-tb-btn" data-cmd="center" data-target="aDescription" title="${L("Centrează", "Center")}">☰</button>
      <button type="button" class="desc-ai-btn" id="aDescription_AiBtn">🪄 ${L("Generează descriere", "Generate description")}</button>
    </div>
    <div class="desc-ai-hint" id="aDescription_AiHint" hidden></div>
    <div class="acc-desc-field-wrap">
    <textarea id="aDescription" class="acc-white-input acc-desc-box" rows="12" maxlength="5000">${escapeHtml(t.description || "")}</textarea>
    <span class="desc-char-badge" id="aDescription_CharBadge">5000</span>
    </div>
<script nonce="${nonce}">(function(){
  function wireDescTools(id, factsGetter){
    var ta = document.getElementById(id), badge = document.getElementById(id + "_CharBadge"), countUp = document.getElementById(id + "Count");
    var aiBtn = document.getElementById(id + "_AiBtn"), aiHint = document.getElementById(id + "_AiHint");
    if (!ta) return;
    var max = parseInt(ta.getAttribute("maxlength"), 10) || 5000;
    function autoGrow(){ ta.style.height = "auto"; ta.style.height = (ta.scrollHeight + 2) + "px"; }
    function updateCounters(){
      var len = ta.value.length, remaining = max - len;
      if (badge) { badge.textContent = remaining; badge.classList.toggle("is-low", remaining < 200); }
      if (countUp) countUp.textContent = String(len);
    }
    ta.addEventListener("input", function(){ autoGrow(); updateCounters(); });
    setTimeout(function(){ autoGrow(); updateCounters(); }, 0);
    document.querySelectorAll('.desc-tb-btn[data-target="' + id + '"]').forEach(function(btn){
      btn.addEventListener("click", function(e){
        e.preventDefault();
        var cmd = btn.getAttribute("data-cmd"), start = ta.selectionStart, end = ta.selectionEnd, val = ta.value;
        if (cmd === "center") {
          var lineStart = val.lastIndexOf("\\n", start - 1) + 1;
          var lineEnd = val.indexOf("\\n", end); if (lineEnd === -1) lineEnd = val.length;
          var trimmed = val.slice(lineStart, lineEnd).trim();
          var already = /^\\[center\\][\\s\\S]*\\[\\/center\\]$/.test(trimmed);
          var newLine = already ? trimmed.replace(/^\\[center\\]/, "").replace(/\\[\\/center\\]$/, "") : "[center]" + trimmed + "[/center]";
          ta.value = val.slice(0, lineStart) + newLine + val.slice(lineEnd);
          ta.selectionStart = ta.selectionEnd = lineStart + newLine.length;
        } else {
          var marker = cmd === "bold" ? "**" : cmd === "italic" ? "*" : "__";
          var selected = val.slice(start, end);
          var already2 = selected.length >= marker.length * 2 && selected.slice(0, marker.length) === marker && selected.slice(-marker.length) === marker;
          var replacement = already2 ? selected.slice(marker.length, selected.length - marker.length) : marker + selected + marker;
          ta.value = val.slice(0, start) + replacement + val.slice(end);
          ta.selectionStart = start; ta.selectionEnd = start + replacement.length;
        }
        ta.dispatchEvent(new Event("input"));
        ta.focus();
      });
    });
    if (aiBtn) {
      aiBtn.addEventListener("click", function(){
        var facts = factsGetter();
        if (!facts.name) { alert("${L("Completează măcar numele înainte de a genera descrierea.", "Fill in at least the name before generating the description.")}"); return; }
        aiBtn.disabled = true; var oldTxt = aiBtn.textContent; aiBtn.textContent = "${L("Se generează...", "Generating...")}";
        facts.remaining = max - ta.value.length;
        facts.lang = "${lang}";
        fetch("/api/cont/genereaza-descriere", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(facts) })
          .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, data: d }; }); })
          .then(function(res){
            aiBtn.disabled = false; aiBtn.textContent = oldTxt;
            if (!res.ok) {
              if (res.data.error === "limit_reached") {
                if (aiHint) { aiHint.hidden = false; aiHint.innerHTML = res.data.message || ""; }
                aiBtn.disabled = true;
              } else {
                alert(res.data.message || "${L("Generarea a eșuat. Încearcă din nou.", "Generation failed. Please try again.")}");
              }
              return;
            }
            ta.value = res.data.text || "";
            ta.dispatchEvent(new Event("input"));
            aiBtn.disabled = true;
            if (aiHint) { aiHint.hidden = false; aiHint.textContent = "${L("Ai folosit generarea gratuită cu AI pentru acest cont. Poți edita liber textul de mai jos.", "You have used your free AI generation for this account. You can freely edit the text below.")}"; }
          })
          .catch(function(){ aiBtn.disabled = false; aiBtn.textContent = oldTxt; alert("${L("Eroare de conexiune.", "Connection error.")}"); });
      });
    }
  }
  wireDescTools("aDescription", function(){
      var venueSel = document.getElementById("aVenueType");
      var accessSel = document.getElementById("aAccessType");
      var price = document.getElementById("aPriceStandard").value;
      return {
        kind: "obiectiv",
        name: document.getElementById("aName").value.trim(),
        typeLabel: venueSel && venueSel.selectedOptions[0] ? venueSel.selectedOptions[0].textContent.trim() : "",
        address: document.getElementById("aAddress").value.trim(),
        managedBy: document.getElementById("aManagedBy").value.trim(),
        accessInfo: (accessSel && accessSel.selectedOptions[0] ? accessSel.selectedOptions[0].textContent.trim() : "") + (price ? (" — " + price + " RON") : ""),
      };
    });
})();</script>
    <label class="acc-white-label" for="aManagedBy">${L("Entitatea care îl administrează", "Managing organisation")}</label>
    <input type="text" id="aManagedBy" class="acc-white-input" maxlength="150" value="${escapeHtml(t.managed_by || "")}" placeholder="${L("Primărie, Fundație, SRL, PFA, Privat", "Town hall, Foundation, Company, Private")}">

    <div class="r-section-title">${L("3. Locație și acces", "3. Location and access")}</div>
    <label class="acc-white-label" for="aCity">${L("Localitate (oraș/comună — caută după SIRUTA)", "Town / village in Romania (start typing to search)")}</label>
    <input type="text" id="aCity" class="acc-white-input" maxlength="100" value="${escapeHtml(t.city || "")}" autocomplete="off" placeholder="ex: Hunedoara..." required>
    <div id="aCitySuggestions" class="acc-siruta-suggestions"></div>
    <input type="hidden" id="aCitySiruta" value="${escapeHtml(t.city_siruta || "")}">
    <label class="acc-white-label" for="aCounty">${L("Județ (se completează automat)", "County (filled in automatically)")}</label>
    <input type="text" id="aCounty" class="acc-white-input" maxlength="100" value="${escapeHtml(t.county || "")}" readonly required>
    <label class="acc-white-label" for="aAddress">${L("Adresă completă / coordonate GPS (dacă e izolat)", "Full address / GPS coordinates (if remote)")}</label>
    <input type="text" id="aAddress" class="acc-white-input" maxlength="255" value="${escapeHtml(t.address || t.gps_coords || "")}">
    <label class="acc-white-label">${L("Cum se ajunge aici?", "How to get there?")}</label>
    <label class="acc-check-item"><input type="checkbox" id="aAccessCar"${t.access_car ? " checked" : ""}>${L("🚗 Acces facil cu mașina (drum asfaltat)", "🚗 Easy access by car (paved road)")}</label>
    <label class="acc-check-item"><input type="checkbox" id="aAccessTransport"${t.access_transport ? " checked" : ""}>${L("🚌 Acces cu transportul în comun", "🚌 Reachable by public transport")}</label>
    <label class="acc-check-item"><input type="checkbox" id="aAccessFoot"${t.access_foot ? " checked" : ""}>${L("🥾 Acces doar pietonal / traseu de drumeție", "🥾 On foot only / hiking trail")}</label>
    <label class="acc-white-label" for="aParking" style="margin-top:14px">${L("Parcare dedicată", "Dedicated parking")}</label>
    <select id="aParking" class="acc-white-input">
      <option value="none"${t.parking === "none" || !t.parking ? " selected" : ""}>${L("Nu există", "None")}</option>
      <option value="free"${t.parking === "free" ? " selected" : ""}>${L("Da, gratuită", "Yes, free")}</option>
      <option value="paid"${t.parking === "paid" ? " selected" : ""}>${L("Da, cu plată", "Yes, paid")}</option>
    </select>

    <div class="r-section-title">${L("4. Tarife și bilete de acces", "4. Prices and tickets")}</div>
    <label class="acc-white-label" for="aAccessType">${L("Tipul de acces", "Type of access")}</label>
    <select id="aAccessType" class="acc-white-input" required>
      <option value="free"${t.access_type !== "paid" && t.access_type !== "reservation" ? " selected" : ""}>${L("🔓 Intrare liberă", "🔓 Free entry")}</option>
      <option value="paid"${t.access_type === "paid" ? " selected" : ""}>${L("🎟️ Pe bază de bilet / taxă de acces", "🎟️ Ticket / entrance fee")}</option>
      <option value="reservation"${t.access_type === "reservation" ? " selected" : ""}>${L("📅 Doar cu rezervare în avans", "📅 Advance booking only")}</option>
    </select>
    <div id="aPaidFieldsWrap" style="display:${t.access_type === "paid" ? "block" : "none"}">
      <label class="acc-white-label" for="aPriceStandard">${L("Preț bilet standard (adult, RON)", "Standard ticket price (adult, RON)")}</label>
      <input type="number" id="aPriceStandard" class="acc-white-input" min="0" step="0.01" value="${t.price_standard || ""}">
      <label class="acc-white-label" for="aPriceReduced">${L("Preț bilet redus (copii/studenți/pensionari, RON)", "Reduced ticket price (children/students/seniors, RON)")}</label>
      <input type="number" id="aPriceReduced" class="acc-white-input" min="0" step="0.01" value="${t.price_reduced || ""}">
      <label class="acc-white-label" for="aTicketUrl">${L("Link achiziție bilete online (opțional)", "Online ticket purchase link (optional)")}</label>
      <input type="url" id="aTicketUrl" class="acc-white-input" value="${escapeHtml(t.ticket_url || "")}">
    </div>
    <label class="acc-white-label" for="aExtraFees">${L("Taxe suplimentare (foto, ghid, parcare etc.)", "Extra fees (photography, guide, parking, etc.)")}</label>
    <input type="text" id="aExtraFees" class="acc-white-input" value="${escapeHtml(t.extra_fees || "")}">
    <label class="acc-white-label" for="aDuration">${L("Durata estimată a vizitei / activității (opțional)", "Estimated duration of the visit / activity (optional)")}</label>
    <input type="text" id="aDuration" class="acc-white-input" placeholder="${L("ex: 1 oră, jumătate de zi, 3 ore", "e.g. 1 hour, half a day, 3 hours")}" value="${escapeHtml(t.duration_estimate || "")}">
    <label class="acc-white-label" for="aGroupCapacity">${L("Capacitate maximă de grup (opțional — pentru ateliere sau ghidaje)", "Maximum group size (optional — for workshops or guided tours)")}</label>
    <input type="number" id="aGroupCapacity" class="acc-white-input" min="1" value="${t.group_capacity || ""}">

    <div class="r-section-title">${L("5. Program de vizitare", "5. Opening hours")}</div>
    <label class="acc-white-label">${L("Luni – Vineri", "Monday – Friday")}</label>
    <div class="acc-time-row"><input type="time" id="aWeekdayOpen" class="acc-white-input" value="${escapeHtml(t.weekday_open || "")}" required><input type="time" id="aWeekdayClose" class="acc-white-input" value="${escapeHtml(t.weekday_close || "")}" required></div>
    <label class="acc-white-label">${L("Sâmbătă", "Saturday")}</label>
    <div class="acc-time-row"><input type="time" id="aSaturdayOpen" class="acc-white-input" value="${escapeHtml(t.saturday_open || "")}"><input type="time" id="aSaturdayClose" class="acc-white-input" value="${escapeHtml(t.saturday_close || "")}"></div>
    <label class="acc-white-label">${L("Duminică", "Sunday")}</label>
    <div class="acc-time-row"><input type="time" id="aSundayOpen" class="acc-white-input" value="${escapeHtml(t.sunday_open || "")}"><input type="time" id="aSundayClose" class="acc-white-input" value="${escapeHtml(t.sunday_close || "")}"></div>
    <label class="acc-white-label" for="aClosedDays">${L("Închis în anumite zile/sărbători (opțional)", "Closed on certain days/holidays (optional)")}</label>
    <input type="text" id="aClosedDays" class="acc-white-input" value="${escapeHtml(t.closed_days_note || "")}">
    <label class="acc-white-label" for="aSeasonal">${L("Program sezonier — se schimbă iarna/vara? (opțional)", "Seasonal hours — do they change in winter/summer? (optional)")}</label>
    <input type="text" id="aSeasonal" class="acc-white-input" value="${escapeHtml(t.seasonal_note || "")}">

    <div class="r-section-title">${L("6. Facilități pentru vizitatori", "6. Visitor facilities")}</div>
    <div class="acc-check-grid">${amenitiesHtml}</div>

    <div class="r-section-title">${L("7. Date de contact pentru turiști", "7. Contact details for visitors")}</div>
    <label class="acc-white-label" for="aPhone">${L("Telefon (informații/rezervări grupuri)", "Phone (information/group bookings)")}</label>
    <input type="tel" id="aPhone" class="acc-white-input" value="${escapeHtml(t.contact_phone || "")}">
    <label class="acc-white-label" for="aEmail">Email</label>
    <input type="email" id="aEmail" class="acc-white-input" value="${escapeHtml(t.contact_email || "")}">
    <label class="acc-white-label" for="aWebsite">${L("Website oficial / pagină Facebook", "Official website / Facebook page")}</label>
    <input type="url" id="aWebsite" class="acc-white-input" value="${escapeHtml(t.website_url || "")}">

    <div class="r-section-title">${L("8. Materiale vizuale", "8. Photos and materials")}</div>
    <label class="acc-white-label">${L("Fotografie reprezentativă (copertă)", "Main photo (cover)")}</label>
    <label class="upl-btn"><input class="upl-native" type="file" id="aCoverInput" accept="image/*"><span>${paIcon("camera", 16)} ${L("Încarcă poză", "Upload photo")}</span></label>
    <p id="aCoverStatus" class="acc-white-hint">${t.cover_photo_url ? L("✓ Copertă încărcată deja.", "✓ Cover photo already uploaded.") : ""}</p>
    <label class="acc-white-label" style="margin-top:14px">${L("3-24 fotografii de detaliu (maxim 25 cu poza de copertă)", "3–24 detail photos (max. 25 including the cover photo)")}</label>
    <label class="upl-btn"><input class="upl-native" type="file" id="aPhotosInput" accept="image/*" multiple><span>${paIcon("camera", 16)} ${L("Încarcă poze", "Upload photos")}</span></label>
    <div id="aPhotoList" class="acc-photo-grid"></div>
    <p class="acc-photo-hint">${L("Ține apăsat pe o poză și trage-o ca să schimbi ordinea (prima poză apare prima în galerie).", "Press and hold a photo, then drag it to change the order (the first photo is shown first in the gallery).")}</p>
    <p id="aPhotoStatus" class="acc-white-hint"></p>
    <label class="acc-white-label" style="margin-top:14px">${L("Broșură / hartă (opțional, PDF)", "Brochure / map (optional, PDF)")}</label>
    <label class="upl-btn"><input class="upl-native" type="file" id="aBrochureInput" accept="application/pdf"><span>${L("📄 Încarcă fișier PDF", "📄 Upload PDF file")}</span></label>
    <p id="aBrochureStatus" class="acc-white-hint">${t.brochure_url ? L("✓ Broșură încărcată deja.", "✓ Brochure already uploaded.") : ""}</p>

    <div class="r-section-title">${L("9. Acord de publicare", "9. Publishing consent")}</div>
    <label class="acc-check-item" style="align-items:flex-start;">
      <input type="checkbox" id="aGdprConsent" required style="margin-top:3px;">
      <span>${L("Declar că dețin drepturile asupra textelor și fotografiilor trimise, sau am acordul de a le publica, și sunt de acord ca aceste date publice să fie afișate pe platformă pentru informarea turiștilor.", "I declare that I own the rights to the texts and photos submitted, or have permission to publish them, and I agree that this public information may be displayed on the platform to inform visitors.")}</span>
    </label>
    <label class="acc-white-label" for="aDeclarant" style="margin-top:14px">${L("Numele persoanei care completează", "Name of the person filling in the form")}</label>
    <input type="text" id="aDeclarant" class="acc-white-input" maxlength="150" value="${escapeHtml(t.declarant_name || "")}" required>

    <p id="aErr" class="acc-white-err" hidden></p>
  </form>
</div>
<div class="acc-details-bottombar">
  <a href="/cont" class="acc-sub-back" aria-label="${L("Înapoi la Proprietățile mele", "Back to My properties")}">←</a>
  <button type="submit" form="aForm" id="aSubmitBtn" class="acc-sub-continue">${t.id ? L("Salvează modificările", "Save changes") : L("Trimite spre verificare", "Submit for review")}</button>
</div>
<script nonce="${nonce}">
(function(){
  document.getElementById("aVenueType").addEventListener("change", function(){
    document.getElementById("aVenueOtherWrap").style.display = this.value === "altul" ? "block" : "none";
  });
  document.getElementById("aAccessType").addEventListener("change", function(){
    document.getElementById("aPaidFieldsWrap").style.display = this.value === "paid" ? "block" : "none";
  });
  (function(){
    var input = document.getElementById("aCity");
    var box = document.getElementById("aCitySuggestions");
    var countyInput = document.getElementById("aCounty");
    var sirutaHidden = document.getElementById("aCitySiruta");
    var debounceTimer;
    input.addEventListener("input", function(){
      sirutaHidden.value = ""; countyInput.value = "";
      clearTimeout(debounceTimer);
      var q = input.value.trim();
      if (q.length < 2) { box.innerHTML = ""; box.style.display = "none"; return; }
      debounceTimer = setTimeout(function(){
        fetch("/api/siruta-cauta?q=" + encodeURIComponent(q))
          .then(function(r){ return r.json(); })
          .then(function(data){
            box.innerHTML = "";
            if (!data.results || !data.results.length) { box.style.display = "none"; return; }
            data.results.forEach(function(r){
              var item = document.createElement("div");
              item.className = "acc-siruta-item";
              item.textContent = r.nume + " (jud. " + r.judetNume + ")";
              item.addEventListener("click", function(){
                input.value = r.nume;
                countyInput.value = r.judetNume;
                sirutaHidden.value = r.siruta;
                box.innerHTML = ""; box.style.display = "none";
              });
              box.appendChild(item);
            });
            box.style.display = "block";
          });
      }, 200);
    });
    document.addEventListener("click", function(e){ if (e.target !== input) box.style.display = "none"; });
  })();
  // Reordonare poze prin tragere: cu mouse-ul tragi direct, pe telefon ții apăsat
  // ~0,3 s pe o poză și apoi o tragi. Poza trasă își schimbă locul în listă; prima
  // poză din listă e prima afișată în galerie.
  function makeSortable(listEl, onReorder){
    var st = null;
    function thumbs(){ return [].slice.call(listEl.children); }
    function startDrag(thumb, x, y){
      var r = thumb.getBoundingClientRect();
      st.active = true; st.ox = x - r.left; st.oy = y - r.top;
      st.ghost = thumb.cloneNode(true);
      st.ghost.style.cssText = "position:fixed;z-index:99999;pointer-events:none;width:" + r.width + "px;height:" + r.height + "px;left:" + r.left + "px;top:" + r.top + "px;opacity:.92;box-shadow:0 10px 24px rgba(0,0,0,.4);transform:scale(1.1);";
      document.body.appendChild(st.ghost);
      thumb.style.opacity = ".25";
    }
    function moveDrag(x, y){
      st.ghost.style.left = (x - st.ox) + "px"; st.ghost.style.top = (y - st.oy) + "px";
      var el = document.elementFromPoint(x, y);
      var over = el && el.closest ? el.closest(".acc-photo-thumb") : null;
      if (over && over !== st.thumb && over.parentNode === listEl) {
        var kids = thumbs(), from = kids.indexOf(st.thumb), to = kids.indexOf(over);
        if (from < to) listEl.insertBefore(st.thumb, over.nextSibling); else listEl.insertBefore(st.thumb, over);
      }
      if (y < 70) window.scrollBy(0, -14); else if (y > window.innerHeight - 70) window.scrollBy(0, 14);
    }
    function endDrag(){
      if (!st) return;
      clearTimeout(st.timer);
      if (st.active) {
        if (st.ghost && st.ghost.parentNode) st.ghost.parentNode.removeChild(st.ghost);
        st.thumb.style.opacity = "";
        var order = thumbs().map(function(t){ return Number(t.getAttribute("data-idx")); });
        st = null;
        onReorder(order);
        return;
      }
      st = null;
    }
    listEl.addEventListener("mousedown", function(e){
      var thumb = e.target.closest ? e.target.closest(".acc-photo-thumb") : null;
      if (!thumb || e.target.closest("button") || e.button !== 0) return;
      e.preventDefault();
      st = { thumb: thumb, x: e.clientX, y: e.clientY, active: false };
    });
    document.addEventListener("mousemove", function(e){
      if (!st) return;
      if (!st.active) { if (Math.abs(e.clientX - st.x) + Math.abs(e.clientY - st.y) > 5) startDrag(st.thumb, e.clientX, e.clientY); else return; }
      moveDrag(e.clientX, e.clientY);
    });
    document.addEventListener("mouseup", endDrag);
    listEl.addEventListener("touchstart", function(e){
      var thumb = e.target.closest ? e.target.closest(".acc-photo-thumb") : null;
      if (!thumb || e.target.closest("button")) return;
      var t = e.touches[0];
      st = { thumb: thumb, x: t.clientX, y: t.clientY, active: false };
      st.timer = setTimeout(function(){ if (st) { startDrag(thumb, st.x, st.y); try { if (navigator.vibrate) navigator.vibrate(15); } catch (err) {} } }, 300);
    }, { passive: true });
    document.addEventListener("touchmove", function(e){
      if (!st) return;
      var t = e.touches[0];
      if (!st.active) { if (Math.abs(t.clientX - st.x) + Math.abs(t.clientY - st.y) > 10) { clearTimeout(st.timer); st = null; } return; }
      e.preventDefault(); st.x = t.clientX; st.y = t.clientY; moveDrag(t.clientX, t.clientY);
    }, { passive: false });
    document.addEventListener("touchend", endDrag);
    document.addEventListener("touchcancel", endDrag);
  }
  // Citirea pozei — robustă pentru iPhone: încercăm 3 metode pe rând
  // (createImageBitmap, <img> din blob URL, <img> din data URL — ultima
  // ocolește un bug Safari cu fișierele alese din Poze). Dacă tot nu merge
  // și poza e deja un JPEG suficient de mic, o trimitem așa cum e (serverul
  // verifică oricum că e o imagine reală).
  function decodeImageFile(file){
    function viaBitmap(){ return window.createImageBitmap ? createImageBitmap(file) : Promise.reject(new Error("fara_bitmap")); }
    function viaImg(src, isBlobUrl){
      return new Promise(function(res, rej){
        var img = new Image();
        img.onload = function(){ if (isBlobUrl) URL.revokeObjectURL(src); res(img); };
        img.onerror = function(){ if (isBlobUrl) URL.revokeObjectURL(src); rej(new Error("decode")); };
        img.src = src;
      });
    }
    function viaDataUrl(){
      return new Promise(function(res, rej){
        var fr = new FileReader();
        fr.onload = function(){ viaImg(fr.result, false).then(res, rej); };
        fr.onerror = function(){ rej(new Error("citire")); };
        fr.readAsDataURL(file);
      });
    }
    return viaBitmap()
      .catch(function(){ return viaImg(URL.createObjectURL(file), true); })
      .catch(viaDataUrl);
  }
  function resizeImageForUpload(file, maxDim, quality){
    return new Promise(function(resolve, reject){
      if (!file || !file.size) { reject(new Error("${L("Poza nu a putut fi citită de pe telefon (e posibil să fie doar în iCloud). Deschide-o o dată în aplicația Poze, apoi încearcă din nou.", "The photo could not be read from your phone (it may be stored only in iCloud). Open it once in the Photos app, then try again.")}")); return; }
      var type = (file.type || "").toLowerCase();
      var name = (file.name || "").toLowerCase();
      var ext = name.lastIndexOf(".") >= 0 ? name.slice(name.lastIndexOf(".") + 1) : "";
      var isHeic = type.indexOf("heic") !== -1 || type.indexOf("heif") !== -1 || ext === "heic" || ext === "heif";
      if (type.indexOf("image/") !== 0 && ["jpg", "jpeg", "png", "webp", "heic", "heif"].indexOf(ext) === -1) { reject(new Error("${L("Fișierul nu e o imagine.", "The file is not an image.")}")); return; }
      decodeImageFile(file).then(function(img){
        var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        if (!w || !h) throw new Error("decode");
        var scale = Math.min(1, maxDim / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement("canvas");
        canvas.width = cw; canvas.height = ch;
        canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
        if (img.close) img.close();
        canvas.toBlob(function(blob){
          if (!blob) { reject(new Error("${L("Nu am putut procesa poza.", "Could not process the photo.")}")); return; }
          resolve(blob);
        }, "image/jpeg", quality);
      }).catch(function(){
        if ((type === "image/jpeg" || ext === "jpg" || ext === "jpeg") && !isHeic && file.size <= 3.5 * 1024 * 1024) { resolve(file); return; }
        if (isHeic) { reject(new Error("${L("Poza e în format HEIC, pe care browserul nu îl poate citi. Pe iPhone: Setări → Cameră → Formate → „Cel mai compatibil”, sau alege poza din nou.", "The photo is in HEIC format, which this browser cannot read. On iPhone: Settings → Camera → Formats → Most Compatible, or choose the photo again.")}")); return; }
        reject(new Error("${L("Poza nu a putut fi citită (", "The photo could not be read (")}" + (type || "${L("tip necunoscut", "unknown type")}") + ", " + Math.round(file.size / 1024) + "${L(" KB). Încearcă altă poză sau fă o captură de ecran a ei.", " KB). Try another photo or take a screenshot of it.")}"));
      });
    });
  }
  var coverUrl = ${safeJson(t.cover_photo_url || null)};
  document.getElementById("aCoverInput").addEventListener("change", async function(e){
    var file = e.target.files && e.target.files[0]; if (!file) return;
    document.getElementById("aCoverStatus").textContent = "${L("Se încarcă...", "Uploading...")}";
    try {
      var resized = await resizeImageForUpload(file, 1920, 0.82);
      var resp = await fetch("/api/obiectiv/upload-fisier", { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: resized });
      var data = await resp.json();
      if (!resp.ok || !data.url) throw new Error(data.error || "eroare");
      coverUrl = data.url;
      document.getElementById("aCoverStatus").textContent = "${L("✓ Copertă încărcată.", "✓ Cover photo uploaded.")}";
    } catch (err) { document.getElementById("aCoverStatus").textContent = "${L("Eroare: ", "Error: ")}" + err.message; }
  });
  var photos = ${safeJson(Array.isArray(t.photos) ? t.photos : [])};
  var photoList = document.getElementById("aPhotoList");
  function renderPhotos(){
    photoList.innerHTML = "";
    photos.forEach(function(url, i){
      var wrap = document.createElement("div"); wrap.className = "acc-photo-thumb"; wrap.setAttribute("data-idx", i);
      var img = document.createElement("img"); img.src = url;
      var rm = document.createElement("button"); rm.type = "button"; rm.textContent = "✕";
      rm.addEventListener("click", function(){ photos.splice(i, 1); renderPhotos(); });
      wrap.appendChild(img); wrap.appendChild(rm); photoList.appendChild(wrap);
    });
  }
  renderPhotos();
  makeSortable(photoList, function(order){ photos = order.map(function(i){ return photos[i]; }); renderPhotos(); });
  document.getElementById("aPhotosInput").addEventListener("change", async function(e){
    var files = Array.from(e.target.files || []).slice(0, 24 - photos.length);
    var status = document.getElementById("aPhotoStatus");
    for (var i = 0; i < files.length; i++) {
      status.textContent = "${L("Se încarcă poza ", "Uploading photo ")}" + (i + 1) + "/" + files.length + "...";
      try {
        var resized = await resizeImageForUpload(files[i], 1920, 0.82);
        var resp = await fetch("/api/obiectiv/upload-fisier", { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: resized });
        var data = await resp.json();
        if (!resp.ok || !data.url) throw new Error(data.error || "eroare");
        photos.push(data.url);
        renderPhotos();
      } catch (err) { status.textContent = "${L("Eroare la o poză: ", "Error with a photo: ")}" + err.message; }
    }
    status.textContent = photos.length >= 3 ? "✓ " + photos.length + " poze." : "Ai nevoie de minim 3 poze.";
    e.target.value = "";
  });
  var brochureUrl = ${safeJson(t.brochure_url || null)};
  document.getElementById("aBrochureInput").addEventListener("change", async function(e){
    var file = e.target.files && e.target.files[0]; if (!file) return;
    document.getElementById("aBrochureStatus").textContent = "${L("Se încarcă...", "Uploading...")}";
    try {
      var buf = await file.arrayBuffer();
      var resp = await fetch("/api/obiectiv/upload-fisier", { method: "POST", headers: { "Content-Type": "application/pdf" }, body: buf });
      var data = await resp.json();
      if (!resp.ok || !data.url) throw new Error(data.error || "eroare");
      brochureUrl = data.url;
      document.getElementById("aBrochureStatus").textContent = "${L("✓ Broșură PDF încărcată.", "✓ PDF brochure uploaded.")}";
    } catch (err) { document.getElementById("aBrochureStatus").textContent = "${L("Eroare: ", "Error: ")}" + err.message; }
  });

  var aFormEl = document.getElementById("aForm");
  aFormEl.querySelectorAll("[required]").forEach(function(el){el.addEventListener("invalid",function(){el.setCustomValidity(el.validity.valueMissing?"${L("Completează acest câmp.", "Please fill in this field.")}":"${L("Verifică ce ai completat aici.", "Please check this field.")}");});el.addEventListener("input",function(){el.setCustomValidity("");});});
  aFormEl.addEventListener("submit", function(e){
    e.preventDefault();
    var err = document.getElementById("aErr"); err.hidden = true;
    if (photos.length < 3) { err.textContent = "${L("Ai nevoie de minim 3 fotografii de detaliu.", "You need at least 3 detail photos.")}"; err.hidden = false; return; }
    if (!document.getElementById("aCitySiruta").value) { err.textContent = "${L("Alege localitatea din lista de sugestii, nu doar scrisă.", "Choose the town from the list of suggestions (not just typed).")}"; err.hidden = false; return; }
    var amenities = Array.from(document.querySelectorAll(".a-amenity:checked")).map(function(el){ return el.value; });
    var btn = document.getElementById("aSubmitBtn"); btn.disabled = true;
    var payload = {
      id: ${t.id ? safeJson(t.id) : "null"},
      fromProposalId: ${t._fromProposal ? safeJson(t._fromProposal) : "null"},
      website: document.getElementById("aWebsiteHoneypot").value,
      venueType: document.getElementById("aVenueType").value,
      venueTypeOther: document.getElementById("aVenueOther").value,
      name: document.getElementById("aName").value,
      description: document.getElementById("aDescription").value,
      managedBy: document.getElementById("aManagedBy").value,
      city: document.getElementById("aCity").value,
      citySiruta: document.getElementById("aCitySiruta").value,
      county: document.getElementById("aCounty").value,
      address: document.getElementById("aAddress").value,
      accessCar: document.getElementById("aAccessCar").checked,
      accessTransport: document.getElementById("aAccessTransport").checked,
      accessFoot: document.getElementById("aAccessFoot").checked,
      parking: document.getElementById("aParking").value,
      accessType: document.getElementById("aAccessType").value,
      priceStandard: document.getElementById("aPriceStandard").value,
      priceReduced: document.getElementById("aPriceReduced").value,
      extraFees: document.getElementById("aExtraFees").value,
      duration: document.getElementById("aDuration").value,
      groupCapacity: document.getElementById("aGroupCapacity").value,
      ticketUrl: document.getElementById("aTicketUrl").value,
      weekdayOpen: document.getElementById("aWeekdayOpen").value,
      weekdayClose: document.getElementById("aWeekdayClose").value,
      saturdayOpen: document.getElementById("aSaturdayOpen").value,
      saturdayClose: document.getElementById("aSaturdayClose").value,
      sundayOpen: document.getElementById("aSundayOpen").value,
      sundayClose: document.getElementById("aSundayClose").value,
      closedDaysNote: document.getElementById("aClosedDays").value,
      seasonalNote: document.getElementById("aSeasonal").value,
      amenities: amenities,
      contactPhone: document.getElementById("aPhone").value,
      contactEmail: document.getElementById("aEmail").value,
      websiteUrl: document.getElementById("aWebsite").value,
      coverPhotoUrl: coverUrl,
      photos: photos,
      brochureUrl: brochureUrl,
      gdprConsent: document.getElementById("aGdprConsent").checked,
      declarantName: document.getElementById("aDeclarant").value,
    };
    fetch("/api/obiectiv/listare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, data: d }; }); })
      .then(function(res){
        btn.disabled = false;
        if (res.ok) { window.location.href = "/cont"; }
        else { err.textContent = "${L("A apărut o eroare: ", "An error occurred: ")}" + (res.data.error || "${L("necunoscută", "unknown")}"); err.hidden = false; }
      });
  });
})();
</script>
</body></html>`);
}


function requireRestaurantOwner(req, res, next) {
  const session = getAccommodationOwnerSession(req);
  if (!session) { res.redirect("/cazare/login"); return; }
  req.restaurantOwner = session;
  next();
}

function requireRestaurantOwnerApi(req, res, next) {
  const session = getAccommodationOwnerSession(req);
  if (!session) { res.status(401).json({ error: getAccLang(req) === "en" ? "Your session has expired — please sign in again." : "Sesiunea a expirat — autentifică-te din nou." }); return; }
  req.restaurantOwner = session;
  next();
}


async function renderRestaurantListingForm(req, res, existingListing) {
  const lang = getAccLang(req, res);
  const L = (ro, en) => (lang === "en" ? en : ro);
  const t = existingListing || {};
  const dietarySelected = new Set(Array.isArray(t.dietary_options) ? t.dietary_options : []);
  const amenitiesSelected = new Set(Array.isArray(t.amenities) ? t.amenities : []);
  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  res.set("Content-Type", "text/html; charset=utf-8");
  const venueTypeOptionsHtml = Object.keys(RESTAURANT_VENUE_TYPES)
    .map((k) => `<option value="${k}"${t.venue_type === k ? " selected" : ""}>${escapeHtml(mapFor(RESTAURANT_VENUE_TYPES, lang)[k])}</option>`).join("");
  const dietaryHtml = Object.keys(RESTAURANT_DIETARY_OPTIONS)
    .map((k) => `<label class="acc-check-item">${paIcon(k)}<input type="checkbox" class="r-dietary" value="${k}"${dietarySelected.has(k) ? " checked" : ""}><span>${escapeHtml(stripLeadingEmoji(mapFor(RESTAURANT_DIETARY_OPTIONS, lang)[k]))}</span></label>`).join("");
  const amenitiesHtml = Object.keys(RESTAURANT_AMENITIES)
    .map((k) => `<label class="acc-check-item">${paIcon(k)}<input type="checkbox" class="r-amenity" value="${k}"${amenitiesSelected.has(k) ? " checked" : ""}><span>${escapeHtml(stripLeadingEmoji(mapFor(RESTAURANT_AMENITIES, lang)[k]))}</span></label>`).join("");
  res.send(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>${t.id ? L("Editează", "Edit") : L("Adaugă", "Add")} ${L("local", "venue")} — Opening Hours Today</title>
<style>${accWhitePageStyles()}
.acc-details-wrap{max-width:560px;margin:0 auto;padding:40px 24px 120px;text-align:left;}
.r-section-title{font-size:17px;font-weight:800;color:#111;margin:32px 0 4px;padding-top:20px;border-top:1px solid #eee;}
.r-section-title:first-child{margin-top:0;padding-top:0;border-top:none;}
</style></head>
<body>
<div class="acc-details-wrap">
  <div style="display:flex;justify-content:flex-end;margin:-20px 0 12px;">${accLangSwitchHtml(req, lang)}</div>
  <h1 class="acc-fiscal-h1">${t.id ? L("Editează localul", "Edit venue") : L("Adaugă un local nou", "Add a new venue")}</h1>
  <p class="acc-fiscal-sub">${L("Restaurant, cafenea, pub sau bistro — completează tot, gratuit, fără abonament.", "Restaurant, café, pub or bistro — fill in everything; it's free, with no subscription.")}</p>

${t._fromProposal ? `<div style="margin:0 0 18px;padding:14px 16px;border:1.5px solid #d6deea;border-radius:14px;background:#f6f9ff;font-size:14.5px;line-height:1.5;"><strong>${L("Completezi pagina revendicată.", "You are completing the claimed page.")}</strong> ${L("Am preluat datele din propunere (nume, localitate, program). Verifică-le, apoi adaugă poze, meniu și date de contact. După aprobare, recenziile existente se mută pe noua pagină.", "We imported the details from the suggestion (name, town, hours). Check them, then add photos, a menu and contact details. After approval, the existing reviews move to the new page.")}${t._cityAmbiguous ? `<div style="margin-top:10px;padding:10px 12px;border:1.5px solid #f0b36a;border-radius:10px;background:#fff7ea;"><strong>${L("Alege județul.", "Choose the county.")}</strong> ${L("Există " + t._cityAmbiguous + " localități care se potrivesc cu „" + escapeHtml(t.city) + "”. Alege-o pe cea corectă din lista de sugestii de la „Localitate” (scrie și județul, ex. „" + escapeHtml(t.city) + " Hunedoara”).", t._cityAmbiguous + " places match “" + escapeHtml(t.city) + "”. Pick the right one from the suggestions in “Town” (you can type the county too, e.g. “" + escapeHtml(t.city) + " Hunedoara”).")}</div>` : ""}</div>` : ""}
  <form id="rForm">
    <!-- Honeypot — câmp invizibil pentru oameni (ascuns cu CSS, nu
    display:none, ca roboții simpli care verifică asta să nu-l sară), dar
    completat automat de roboții care umplu orice câmp găsit în formular.
    Dacă ajunge completat la server, respingem discret cererea. -->
    <div style="position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;" aria-hidden="true">
      <label for="rWebsiteHoneypot">${L("Lăsați acest câmp gol", "Leave this field empty")}</label>
      <input type="text" id="rWebsiteHoneypot" name="website" tabindex="-1" autocomplete="off">
    </div>
    <div class="r-section-title">${L("1. Clasificare local", "1. Venue type")}</div>
    <label class="acc-white-label" for="rVenueType">${L("Tipul localului", "Type of venue")}</label>
    <select id="rVenueType" class="acc-white-input" required>${venueTypeOptionsHtml}</select>
    <div id="rVenueOtherWrap" style="display:${t.venue_type === "altul" ? "block" : "none"}">
      <label class="acc-white-label" for="rVenueOther">${L("Specificați", "Please specify")}</label>
      <input type="text" id="rVenueOther" class="acc-white-input" value="${escapeHtml(t.venue_type_other || "")}">
    </div>

    <div class="r-section-title">${L("2. Informații generale", "2. General information")}</div>
    <label class="acc-white-label" for="rName">${L("Numele comercial (cum va apărea pe site)", "Business name (as it will appear on the site)")}</label>
    <input type="text" id="rName" class="acc-white-input" maxlength="150" value="${escapeHtml(t.name || "")}" required>
    <label class="acc-white-label" for="rCompanyName">${L("Numele societății (SRL/SA/PFA)", "Company name (Romanian SRL/SA/PFA)")}</label>
    <input type="text" id="rCompanyName" class="acc-white-input" maxlength="200" value="${escapeHtml(t.company_name || "")}" required>
    <label class="acc-white-label" for="rCui">CUI</label>
    <input type="text" id="rCui" class="acc-white-input" maxlength="20" value="${escapeHtml(t.company_cui || "")}" required>
    <label class="acc-white-label" for="rRegCom">${L("Nr. înregistrare Registrul Comerțului (J)", "Trade Register number (J)")}</label>
    <input type="text" id="rRegCom" class="acc-white-input" maxlength="40" value="${escapeHtml(t.company_reg_com || "")}" required>

    <div class="r-section-title">${L("3. Contact și locație", "3. Contact and location")}</div>
    <label class="acc-white-label" for="rCity">${L("Localitate (oraș/comună — caută după SIRUTA)", "Town / village in Romania (start typing to search)")}</label>
    <input type="text" id="rCity" class="acc-white-input" maxlength="100" value="${escapeHtml(t.city || "")}" autocomplete="off" placeholder="ex: Hunedoara..." required>
    <div id="rCitySuggestions" class="acc-siruta-suggestions"></div>
    <input type="hidden" id="rCitySiruta" value="${escapeHtml(t.city_siruta || "")}">
    <label class="acc-white-label" for="rCounty">${L("Județ (se completează automat)", "County (filled in automatically)")}</label>
    <input type="text" id="rCounty" class="acc-white-input" maxlength="100" value="${escapeHtml(t.county || "")}" readonly required>
    <label class="acc-white-label" for="rAddress">${L("Adresă completă", "Full address")}</label>
    <input type="text" id="rAddress" class="acc-white-input" maxlength="255" value="${escapeHtml(t.address || "")}" required>
    <label class="acc-white-label" for="rPhone">${L("Telefon pentru clienți", "Phone for customers")}</label>
    <input type="tel" id="rPhone" class="acc-white-input" maxlength="30" value="${escapeHtml(t.contact_phone || "")}" required>
    <label class="acc-white-label" for="rEmailContact">${L("Email pentru clienți", "Email for customers")}</label>
    <input type="email" id="rEmailContact" class="acc-white-input" maxlength="255" value="${escapeHtml(t.contact_email || "")}" required>
    <label class="acc-white-label" for="rWebsite">${L("Website (opțional)", "Website (optional)")}</label>
    <input type="url" id="rWebsite" class="acc-white-input" value="${escapeHtml(t.website_url || "")}">
    <label class="acc-white-label" for="rFacebook">${paIcon("facebook", 18)} ${L("Facebook (opțional)", "Facebook (optional)")}</label>
    <input type="url" id="rFacebook" class="acc-white-input" value="${escapeHtml(t.facebook_url || "")}">
    <label class="acc-white-label" for="rInstagram">${paIcon("instagram", 18)} ${L("Instagram (opțional)", "Instagram (optional)")}</label>
    <input type="url" id="rInstagram" class="acc-white-input" value="${escapeHtml(t.instagram_url || "")}">
    <label class="acc-white-label" for="rTiktok">${paIcon("tiktok", 18)} ${L("TikTok (opțional)", "TikTok (optional)")}</label>
    <input type="url" id="rTiktok" class="acc-white-input" value="${escapeHtml(t.tiktok_url || "")}">

    <div class="r-section-title">${L("4. Persoană de contact (administrare/facturare — nu apare public)", "4. Contact person (admin/billing — not shown publicly)")}</div>
    <label class="acc-white-label" for="rAdminName">${L("Nume și prenume", "Full name")}</label>
    <input type="text" id="rAdminName" class="acc-white-input" maxlength="150" value="${escapeHtml(t.admin_contact_name || "")}" required>
    <label class="acc-white-label" for="rAdminRole">${L("Funcția (Proprietar, Manager, Marketing etc.)", "Role (Owner, Manager, Marketing, etc.)")}</label>
    <input type="text" id="rAdminRole" class="acc-white-input" maxlength="100" value="${escapeHtml(t.admin_contact_role || "")}" required>
    <label class="acc-white-label" for="rAdminPhone">${L("Telefon direct", "Direct phone")}</label>
    <input type="tel" id="rAdminPhone" class="acc-white-input" maxlength="30" value="${escapeHtml(t.admin_contact_phone || "")}" required>
    <label class="acc-white-label" for="rAdminEmail">${L("Email direct", "Direct email")}</label>
    <input type="email" id="rAdminEmail" class="acc-white-input" maxlength="255" value="${escapeHtml(t.admin_contact_email || "")}" required>

    <div class="r-section-title">${L("5. Detalii specifice", "5. Details")}</div>
    <label class="acc-white-label" for="rCuisine">${L("Specificul bucătăriei (ex: Italian, Tradițional Românesc, Asiatic)", "Cuisine (e.g. Italian, Traditional Romanian, Asian)")}</label>
    <input type="text" id="rCuisine" class="acc-white-input" maxlength="100" value="${escapeHtml(t.cuisine || "")}" required>
    <label class="acc-white-label" for="rCapacity">${L("Capacitate (număr de locuri, aproximativ)", "Capacity (approx. number of seats)")}</label>
    <input type="number" id="rCapacity" class="acc-white-input" min="1" value="${t.capacity || ""}">
    <label class="acc-white-label">${L("Opțiuni dietetice", "Dietary options")}</label>
    <div class="acc-check-grid">${dietaryHtml}</div>
    <label class="acc-white-label" style="margin-top:14px">${L("Facilități", "Facilities")}</label>
    <div class="acc-check-grid">${amenitiesHtml}</div>

    <div class="r-section-title">${L("6. Program de funcționare", "6. Opening hours")}</div>
    <label class="acc-white-label">${L("Luni – Vineri", "Monday – Friday")}</label>
    <div class="acc-time-row"><input type="time" id="rWeekdayOpen" class="acc-white-input" value="${escapeHtml(t.weekday_open || "")}" required><input type="time" id="rWeekdayClose" class="acc-white-input" value="${escapeHtml(t.weekday_close || "")}" required></div>
    <label class="acc-white-label">${L("Sâmbătă", "Saturday")}</label>
    <div class="acc-time-row"><input type="time" id="rSaturdayOpen" class="acc-white-input" value="${escapeHtml(t.saturday_open || "")}"><input type="time" id="rSaturdayClose" class="acc-white-input" value="${escapeHtml(t.saturday_close || "")}"></div>
    <label class="acc-white-label">${L("Duminică", "Sunday")}</label>
    <div class="acc-time-row"><input type="time" id="rSundayOpen" class="acc-white-input" value="${escapeHtml(t.sunday_open || "")}"><input type="time" id="rSundayClose" class="acc-white-input" value="${escapeHtml(t.sunday_close || "")}"></div>
    <label class="acc-white-label" for="rClosedDays">${L("Zile închise (opțional)", "Closed days (optional)")}</label>
    <input type="text" id="rClosedDays" class="acc-white-input" placeholder="${L("ex: Luni închis", "e.g. Closed on Mondays")}" value="${escapeHtml(t.closed_days_note || "")}">

    <div class="r-section-title">${L("7. Materiale vizuale", "7. Photos and materials")}</div>
    <label class="acc-white-label">${L("Logo (opțional, PNG/JPG)", "Logo (optional, PNG/JPG)")}</label>
    <label class="upl-btn"><input class="upl-native" type="file" id="rLogoInput" accept="image/*"><span>${paIcon("camera", 16)} ${L("Încarcă poză", "Upload photo")}</span></label>
    <p id="rLogoStatus" class="acc-white-hint"></p>
    <label class="acc-white-label" style="margin-top:14px">${L("Fotografie de copertă", "Cover photo")}</label>
    <label class="upl-btn"><input class="upl-native" type="file" id="rCoverInput" accept="image/*"><span>${paIcon("camera", 16)} ${L("Încarcă poză", "Upload photo")}</span></label>
    <p id="rCoverStatus" class="acc-white-hint"></p>
    <label class="acc-white-label" style="margin-top:14px">${L("3-11 fotografii — interior/exterior/preparate (maxim 12 cu poza de copertă)", "3–11 photos — interior/exterior/dishes (max. 12 including the cover photo)")}</label>
    <label class="upl-btn"><input class="upl-native" type="file" id="rPhotosInput" accept="image/*" multiple><span>${paIcon("camera", 16)} ${L("Încarcă poze", "Upload photos")}</span></label>
    <div id="rPhotoList" class="acc-photo-grid"></div>
    <p class="acc-photo-hint">${L("Ține apăsat pe o poză și trage-o ca să schimbi ordinea (prima poză apare prima în galerie).", "Press and hold a photo, then drag it to change the order (the first photo is shown first in the gallery).")}</p>
    <p id="rPhotoStatus" class="acc-white-hint"></p>
    <label class="acc-white-label" style="margin-top:14px">${L("Meniu (PDF, sau link către meniul online)", "Menu (PDF, or a link to your online menu)")}</label>
    <label class="upl-btn"><input class="upl-native" type="file" id="rMenuInput" accept="application/pdf"><span>${L("📄 Încarcă fișier PDF", "📄 Upload PDF file")}</span></label>
    <p id="rMenuStatus" class="acc-white-hint">${t.menu_url ? L("✓ Meniu încărcat deja.", "✓ Menu already uploaded.") : ""}</p>
    <input type="url" id="rMenuUrlManual" class="acc-white-input" placeholder="${L("sau lipește aici link-ul meniului online", "or paste your online menu link here")}" value="${t.menu_url && t.menu_url.endsWith(".pdf") ? "" : escapeHtml(t.menu_url || "")}">

    <div class="r-section-title">${L("8. Acord și termeni legali", "8. Consent and legal terms")}</div>
    <label class="acc-check-item" style="align-items:flex-start;">
      <input type="checkbox" id="rGdprConsent" required style="margin-top:3px;">
      <span>${L("Declar pe proprie răspundere că toate informațiile furnizate sunt corecte, actuale și reflectă realitatea. Sunt de acord ca datele completate să fie procesate pentru crearea profilului de prezentare pe site și pentru comunicările ulterioare legate de colaborare.", "I declare on my own responsibility that all the information provided is correct, up to date and accurate. I agree that the data entered may be processed to create the listing on the site and for further communication about our collaboration.")}</span>
    </label>
    <label class="acc-white-label" for="rDeclarant" style="margin-top:14px">${L("Numele declarantului", "Declarant's name")}</label>
    <input type="text" id="rDeclarant" class="acc-white-input" maxlength="150" value="${escapeHtml(t.declarant_name || "")}" required>

    <p id="rErr" class="acc-white-err" hidden></p>
  </form>
</div>
<div class="acc-details-bottombar">
  <a href="/cont" class="acc-sub-back" aria-label="${L("Înapoi la Proprietățile mele", "Back to My properties")}">←</a>
  <button type="submit" form="rForm" id="rSubmitBtn" class="acc-sub-continue">${t.id ? L("Salvează modificările", "Save changes") : L("Trimite spre verificare", "Submit for review")}</button>
</div>
<script nonce="${nonce}">
(function(){
  document.getElementById("rVenueType").addEventListener("change", function(){
    document.getElementById("rVenueOtherWrap").style.display = this.value === "altul" ? "block" : "none";
  });
  // Autocomplete SIRUTA — vezi formularul de cazare pentru explicație
  // completă. Aceeași logică, câmpuri "r" în loc de "d".
  (function(){
    var input = document.getElementById("rCity");
    var box = document.getElementById("rCitySuggestions");
    var countyInput = document.getElementById("rCounty");
    var sirutaHidden = document.getElementById("rCitySiruta");
    var debounceTimer;
    input.addEventListener("input", function(){
      sirutaHidden.value = ""; countyInput.value = "";
      clearTimeout(debounceTimer);
      var q = input.value.trim();
      if (q.length < 2) { box.innerHTML = ""; box.style.display = "none"; return; }
      debounceTimer = setTimeout(function(){
        fetch("/api/siruta-cauta?q=" + encodeURIComponent(q))
          .then(function(r){ return r.json(); })
          .then(function(data){
            box.innerHTML = "";
            if (!data.results || !data.results.length) { box.style.display = "none"; return; }
            data.results.forEach(function(r){
              var item = document.createElement("div");
              item.className = "acc-siruta-item";
              item.textContent = r.nume + " (jud. " + r.judetNume + ")";
              item.addEventListener("click", function(){
                input.value = r.nume;
                countyInput.value = r.judetNume;
                sirutaHidden.value = r.siruta;
                box.innerHTML = ""; box.style.display = "none";
              });
              box.appendChild(item);
            });
            box.style.display = "block";
          });
      }, 200);
    });
    document.addEventListener("click", function(e){ if (e.target !== input) box.style.display = "none"; });
  })();
  // Reordonare poze prin tragere: cu mouse-ul tragi direct, pe telefon ții apăsat
  // ~0,3 s pe o poză și apoi o tragi. Poza trasă își schimbă locul în listă; prima
  // poză din listă e prima afișată în galerie.
  function makeSortable(listEl, onReorder){
    var st = null;
    function thumbs(){ return [].slice.call(listEl.children); }
    function startDrag(thumb, x, y){
      var r = thumb.getBoundingClientRect();
      st.active = true; st.ox = x - r.left; st.oy = y - r.top;
      st.ghost = thumb.cloneNode(true);
      st.ghost.style.cssText = "position:fixed;z-index:99999;pointer-events:none;width:" + r.width + "px;height:" + r.height + "px;left:" + r.left + "px;top:" + r.top + "px;opacity:.92;box-shadow:0 10px 24px rgba(0,0,0,.4);transform:scale(1.1);";
      document.body.appendChild(st.ghost);
      thumb.style.opacity = ".25";
    }
    function moveDrag(x, y){
      st.ghost.style.left = (x - st.ox) + "px"; st.ghost.style.top = (y - st.oy) + "px";
      var el = document.elementFromPoint(x, y);
      var over = el && el.closest ? el.closest(".acc-photo-thumb") : null;
      if (over && over !== st.thumb && over.parentNode === listEl) {
        var kids = thumbs(), from = kids.indexOf(st.thumb), to = kids.indexOf(over);
        if (from < to) listEl.insertBefore(st.thumb, over.nextSibling); else listEl.insertBefore(st.thumb, over);
      }
      if (y < 70) window.scrollBy(0, -14); else if (y > window.innerHeight - 70) window.scrollBy(0, 14);
    }
    function endDrag(){
      if (!st) return;
      clearTimeout(st.timer);
      if (st.active) {
        if (st.ghost && st.ghost.parentNode) st.ghost.parentNode.removeChild(st.ghost);
        st.thumb.style.opacity = "";
        var order = thumbs().map(function(t){ return Number(t.getAttribute("data-idx")); });
        st = null;
        onReorder(order);
        return;
      }
      st = null;
    }
    listEl.addEventListener("mousedown", function(e){
      var thumb = e.target.closest ? e.target.closest(".acc-photo-thumb") : null;
      if (!thumb || e.target.closest("button") || e.button !== 0) return;
      e.preventDefault();
      st = { thumb: thumb, x: e.clientX, y: e.clientY, active: false };
    });
    document.addEventListener("mousemove", function(e){
      if (!st) return;
      if (!st.active) { if (Math.abs(e.clientX - st.x) + Math.abs(e.clientY - st.y) > 5) startDrag(st.thumb, e.clientX, e.clientY); else return; }
      moveDrag(e.clientX, e.clientY);
    });
    document.addEventListener("mouseup", endDrag);
    listEl.addEventListener("touchstart", function(e){
      var thumb = e.target.closest ? e.target.closest(".acc-photo-thumb") : null;
      if (!thumb || e.target.closest("button")) return;
      var t = e.touches[0];
      st = { thumb: thumb, x: t.clientX, y: t.clientY, active: false };
      st.timer = setTimeout(function(){ if (st) { startDrag(thumb, st.x, st.y); try { if (navigator.vibrate) navigator.vibrate(15); } catch (err) {} } }, 300);
    }, { passive: true });
    document.addEventListener("touchmove", function(e){
      if (!st) return;
      var t = e.touches[0];
      if (!st.active) { if (Math.abs(t.clientX - st.x) + Math.abs(t.clientY - st.y) > 10) { clearTimeout(st.timer); st = null; } return; }
      e.preventDefault(); st.x = t.clientX; st.y = t.clientY; moveDrag(t.clientX, t.clientY);
    }, { passive: false });
    document.addEventListener("touchend", endDrag);
    document.addEventListener("touchcancel", endDrag);
  }
  // Citirea pozei — robustă pentru iPhone: încercăm 3 metode pe rând
  // (createImageBitmap, <img> din blob URL, <img> din data URL — ultima
  // ocolește un bug Safari cu fișierele alese din Poze). Dacă tot nu merge
  // și poza e deja un JPEG suficient de mic, o trimitem așa cum e (serverul
  // verifică oricum că e o imagine reală).
  function decodeImageFile(file){
    function viaBitmap(){ return window.createImageBitmap ? createImageBitmap(file) : Promise.reject(new Error("fara_bitmap")); }
    function viaImg(src, isBlobUrl){
      return new Promise(function(res, rej){
        var img = new Image();
        img.onload = function(){ if (isBlobUrl) URL.revokeObjectURL(src); res(img); };
        img.onerror = function(){ if (isBlobUrl) URL.revokeObjectURL(src); rej(new Error("decode")); };
        img.src = src;
      });
    }
    function viaDataUrl(){
      return new Promise(function(res, rej){
        var fr = new FileReader();
        fr.onload = function(){ viaImg(fr.result, false).then(res, rej); };
        fr.onerror = function(){ rej(new Error("citire")); };
        fr.readAsDataURL(file);
      });
    }
    return viaBitmap()
      .catch(function(){ return viaImg(URL.createObjectURL(file), true); })
      .catch(viaDataUrl);
  }
  function resizeImageForUpload(file, maxDim, quality){
    return new Promise(function(resolve, reject){
      if (!file || !file.size) { reject(new Error("${L("Poza nu a putut fi citită de pe telefon (e posibil să fie doar în iCloud). Deschide-o o dată în aplicația Poze, apoi încearcă din nou.", "The photo could not be read from your phone (it may be stored only in iCloud). Open it once in the Photos app, then try again.")}")); return; }
      var type = (file.type || "").toLowerCase();
      var name = (file.name || "").toLowerCase();
      var ext = name.lastIndexOf(".") >= 0 ? name.slice(name.lastIndexOf(".") + 1) : "";
      var isHeic = type.indexOf("heic") !== -1 || type.indexOf("heif") !== -1 || ext === "heic" || ext === "heif";
      if (type.indexOf("image/") !== 0 && ["jpg", "jpeg", "png", "webp", "heic", "heif"].indexOf(ext) === -1) { reject(new Error("${L("Fișierul nu e o imagine.", "The file is not an image.")}")); return; }
      decodeImageFile(file).then(function(img){
        var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        if (!w || !h) throw new Error("decode");
        var scale = Math.min(1, maxDim / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement("canvas");
        canvas.width = cw; canvas.height = ch;
        canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
        if (img.close) img.close();
        canvas.toBlob(function(blob){
          if (!blob) { reject(new Error("${L("Nu am putut procesa poza.", "Could not process the photo.")}")); return; }
          resolve(blob);
        }, "image/jpeg", quality);
      }).catch(function(){
        if ((type === "image/jpeg" || ext === "jpg" || ext === "jpeg") && !isHeic && file.size <= 3.5 * 1024 * 1024) { resolve(file); return; }
        if (isHeic) { reject(new Error("${L("Poza e în format HEIC, pe care browserul nu îl poate citi. Pe iPhone: Setări → Cameră → Formate → „Cel mai compatibil”, sau alege poza din nou.", "The photo is in HEIC format, which this browser cannot read. On iPhone: Settings → Camera → Formats → Most Compatible, or choose the photo again.")}")); return; }
        reject(new Error("${L("Poza nu a putut fi citită (", "The photo could not be read (")}" + (type || "${L("tip necunoscut", "unknown type")}") + ", " + Math.round(file.size / 1024) + "${L(" KB). Încearcă altă poză sau fă o captură de ecran a ei.", " KB). Try another photo or take a screenshot of it.")}"));
      });
    });
  }
  var logoUrl = ${safeJson(t.logo_url || null)};
  document.getElementById("rLogoInput").addEventListener("change", async function(e){
    var file = e.target.files && e.target.files[0]; if (!file) return;
    document.getElementById("rLogoStatus").textContent = "${L("Se încarcă...", "Uploading...")}";
    try {
      var resized = await resizeImageForUpload(file, 800, 0.85);
      var resp = await fetch("/api/restaurant/upload-fisier", { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: resized });
      var data = await resp.json();
      if (!resp.ok || !data.url) throw new Error(data.error || "eroare");
      logoUrl = data.url;
      document.getElementById("rLogoStatus").textContent = "${L("✓ Logo încărcat.", "✓ Logo uploaded.")}";
    } catch (err) { document.getElementById("rLogoStatus").textContent = "Eroare: " + err.message; }
  });
  var coverUrl = ${safeJson(t.cover_photo_url || null)};
  document.getElementById("rCoverInput").addEventListener("change", async function(e){
    var file = e.target.files && e.target.files[0]; if (!file) return;
    document.getElementById("rCoverStatus").textContent = "${L("Se încarcă...", "Uploading...")}";
    try {
      var resized = await resizeImageForUpload(file, 1920, 0.82);
      var resp = await fetch("/api/restaurant/upload-fisier", { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: resized });
      var data = await resp.json();
      if (!resp.ok || !data.url) throw new Error(data.error || "eroare");
      coverUrl = data.url;
      document.getElementById("rCoverStatus").textContent = "${L("✓ Copertă încărcată.", "✓ Cover photo uploaded.")}";
    } catch (err) { document.getElementById("rCoverStatus").textContent = "Eroare: " + err.message; }
  });
  var photos = ${safeJson(Array.isArray(t.photos) ? t.photos : [])};
  var photoList = document.getElementById("rPhotoList");
  function renderPhotos(){
    photoList.innerHTML = "";
    photos.forEach(function(url, i){
      var wrap = document.createElement("div"); wrap.className = "acc-photo-thumb"; wrap.setAttribute("data-idx", i);
      var img = document.createElement("img"); img.src = url;
      var rm = document.createElement("button"); rm.type = "button"; rm.textContent = "✕";
      rm.addEventListener("click", function(){ photos.splice(i, 1); renderPhotos(); });
      wrap.appendChild(img); wrap.appendChild(rm); photoList.appendChild(wrap);
    });
  }
  renderPhotos();
  makeSortable(photoList, function(order){ photos = order.map(function(i){ return photos[i]; }); renderPhotos(); });
  document.getElementById("rPhotosInput").addEventListener("change", async function(e){
    var files = Array.from(e.target.files || []).slice(0, 11 - photos.length);
    var status = document.getElementById("rPhotoStatus");
    for (var i = 0; i < files.length; i++) {
      status.textContent = "${L("Se încarcă poza ", "Uploading photo ")}" + (i + 1) + "/" + files.length + "...";
      try {
        var resized = await resizeImageForUpload(files[i], 1920, 0.82);
        var resp = await fetch("/api/restaurant/upload-fisier", { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: resized });
        var data = await resp.json();
        if (!resp.ok || !data.url) throw new Error(data.error || "eroare");
        photos.push(data.url);
        renderPhotos();
      } catch (err) { status.textContent = "${L("Eroare la o poză: ", "Error with a photo: ")}" + err.message; }
    }
    status.textContent = photos.length >= 3 ? "✓ " + photos.length + " poze." : "${L("Ai nevoie de minim 3 poze.", "You need at least 3 photos.")}";
    e.target.value = "";
  });
  var menuUrl = ${safeJson(t.menu_url || null)};
  document.getElementById("rMenuInput").addEventListener("change", async function(e){
    var file = e.target.files && e.target.files[0]; if (!file) return;
    document.getElementById("rMenuStatus").textContent = "${L("Se încarcă meniul...", "Uploading menu...")}";
    try {
      var buf = await file.arrayBuffer();
      var resp = await fetch("/api/restaurant/upload-fisier", { method: "POST", headers: { "Content-Type": "application/pdf" }, body: buf });
      var data = await resp.json();
      if (!resp.ok || !data.url) throw new Error(data.error || "eroare");
      menuUrl = data.url;
      document.getElementById("rMenuStatus").textContent = "${L("✓ Meniu PDF încărcat.", "✓ PDF menu uploaded.")}";
    } catch (err) { document.getElementById("rMenuStatus").textContent = "Eroare: " + err.message; }
  });

  var rFormEl = document.getElementById("rForm");
  rFormEl.querySelectorAll("[required]").forEach(function(el){el.addEventListener("invalid",function(){el.setCustomValidity(el.validity.valueMissing?"${L("Completează acest câmp.", "Please fill in this field.")}":"${L("Verifică ce ai completat aici.", "Please check this field.")}");});el.addEventListener("input",function(){el.setCustomValidity("");});});
  rFormEl.addEventListener("submit", function(e){
    e.preventDefault();
    var err = document.getElementById("rErr"); err.hidden = true;
    if (photos.length < 3) { err.textContent = "${L("Ai nevoie de minim 3 fotografii.", "You need at least 3 photos.")}"; err.hidden = false; return; }
    if (!document.getElementById("rCitySiruta").value) { err.textContent = "${L("Alege localitatea din lista de sugestii, nu doar scrisă — ca să apară corect pe site.", "Choose the town from the list of suggestions (not just typed), so it shows up correctly on the site.")}"; err.hidden = false; return; }
    var manualMenuUrl = document.getElementById("rMenuUrlManual").value.trim();
    var dietary = Array.from(document.querySelectorAll(".r-dietary:checked")).map(function(el){ return el.value; });
    var amenities = Array.from(document.querySelectorAll(".r-amenity:checked")).map(function(el){ return el.value; });
    var btn = document.getElementById("rSubmitBtn"); btn.disabled = true;
    var payload = {
      id: ${t.id ? safeJson(t.id) : "null"},
      fromProposalId: ${t._fromProposal ? safeJson(t._fromProposal) : "null"},
      venueType: document.getElementById("rVenueType").value,
      website: document.getElementById("rWebsiteHoneypot").value,
      venueTypeOther: document.getElementById("rVenueOther").value,
      name: document.getElementById("rName").value,
      companyName: document.getElementById("rCompanyName").value,
      companyCui: document.getElementById("rCui").value,
      companyRegCom: document.getElementById("rRegCom").value,
      city: document.getElementById("rCity").value,
      citySiruta: document.getElementById("rCitySiruta").value,
      county: document.getElementById("rCounty").value,
      address: document.getElementById("rAddress").value,
      contactPhone: document.getElementById("rPhone").value,
      contactEmail: document.getElementById("rEmailContact").value,
      websiteUrl: document.getElementById("rWebsite").value,
      facebookUrl: document.getElementById("rFacebook").value,
      instagramUrl: document.getElementById("rInstagram").value,
      tiktokUrl: document.getElementById("rTiktok").value,
      adminContactName: document.getElementById("rAdminName").value,
      adminContactRole: document.getElementById("rAdminRole").value,
      adminContactPhone: document.getElementById("rAdminPhone").value,
      adminContactEmail: document.getElementById("rAdminEmail").value,
      cuisine: document.getElementById("rCuisine").value,
      capacity: document.getElementById("rCapacity").value,
      dietaryOptions: dietary,
      amenities: amenities,
      weekdayOpen: document.getElementById("rWeekdayOpen").value,
      weekdayClose: document.getElementById("rWeekdayClose").value,
      saturdayOpen: document.getElementById("rSaturdayOpen").value,
      saturdayClose: document.getElementById("rSaturdayClose").value,
      sundayOpen: document.getElementById("rSundayOpen").value,
      sundayClose: document.getElementById("rSundayClose").value,
      closedDaysNote: document.getElementById("rClosedDays").value,
      logoUrl: logoUrl,
      coverPhotoUrl: coverUrl,
      photos: photos,
      menuUrl: menuUrl || manualMenuUrl || null,
      gdprConsent: document.getElementById("rGdprConsent").checked,
      declarantName: document.getElementById("rDeclarant").value,
    };
    fetch("/api/restaurant/listare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, data: d }; }); })
      .then(function(res){
        btn.disabled = false;
        if (res.ok) { window.location.href = "/cont-restaurant"; }
        else { err.textContent = "${L("A apărut o eroare: ", "An error occurred: ")}" + (res.data.error || "${L("necunoscută", "unknown")}"); err.hidden = false; }
      });
  });
})();
</script>
</body></html>`);
}

// Admin: trimite un email cerând poze mai bune (nu schimbă statusul anunțului).
async function handleAdminRequestPhotos(table, loginPathFor, req, res) {
  if (!requireAdminApi(req, res)) return;
  if (!dbPool) { res.status(503).json({ error: "not_configured" }); return; }
  const { id } = req.params;
  if (!/^\d+$/.test(id)) { res.status(400).json({ error: "invalid_input" }); return; }
  try {
    const { rows } = await dbPool.query(
      `SELECT l.name, o.email AS owner_email FROM ${table} l JOIN accommodation_owners o ON o.id = l.owner_id WHERE l.id = $1::integer`,
      [id]
    );
    if (!rows.length) { res.status(404).json({ error: "not_found" }); return; }
    const ok = await sendPhotoRequestEmail(rows[0].owner_email, rows[0].name, `${baseUrlFor(req)}${loginPathFor}`);
    if (!ok) { res.status(502).json({ error: "email_failed" }); return; }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(`admin cere-poze (${table}):`, err.message);
    res.status(500).json({ error: "server_error" });
  }
}



function buildOwnerLiveStatusControls(kind, r, lang) {
  const L = (ro, en) => (lang === "en" ? en : ro);
  const st = todayLiveStatus(r);
  const current = !st ? "" : st.status === "closed"
    ? `<div class="acc-live-current">🔴 ${L("Azi: închis", "Today: closed")}</div>`
    : `<div class="acc-live-current">🟠 ${L("Azi: deschis până la", "Today: open until")} ${escapeHtml(st.until || "")}</div>`;
  return `<div class="acc-live-box">
    ${current}
    <div class="acc-live-row">
      <button type="button" class="acc-live-btn${st && st.status === "closed" ? " is-on" : ""}" data-live-kind="${kind}" data-live-id="${r.id}" data-live-action="inchis">🔴 ${L("Închis azi", "Closed today")}</button>
      <span class="acc-live-until"><input type="time" class="acc-live-time" value="${escapeHtml(st && st.until ? st.until : "")}" aria-label="${L("Ora de închidere azi", "Closing time today")}"><button type="button" class="acc-live-btn${st && st.status === "open_until" ? " is-on" : ""}" data-live-kind="${kind}" data-live-id="${r.id}" data-live-action="pana_la">🟠 ${L("Deschis azi până la", "Open today until")}</button></span>
      ${st ? `<button type="button" class="acc-live-btn" data-live-kind="${kind}" data-live-id="${r.id}" data-live-action="normal">↺ ${L("Program normal", "Normal hours")}</button>` : ""}
    </div>
  </div>`;
}

// care dintre URL-uri sunt încă folosite de vreun anunț (din oricare tabel)?
async function blobUrlsStillReferenced(urls) {
  const used = new Set();
  if (!dbPool || !urls.length) return used;
  const queries = [
    `SELECT u AS url FROM unnest($1::text[]) AS u WHERE EXISTS (SELECT 1 FROM accommodation_listings WHERE photos::text LIKE '%' || u || '%')`,
    `SELECT u AS url FROM unnest($1::text[]) AS u WHERE EXISTS (SELECT 1 FROM restaurant_listings WHERE photos::text LIKE '%' || u || '%' OR logo_url = u OR cover_photo_url = u OR menu_url = u)`,
    `SELECT u AS url FROM unnest($1::text[]) AS u WHERE EXISTS (SELECT 1 FROM attraction_listings WHERE photos::text LIKE '%' || u || '%' OR cover_photo_url = u OR brochure_url = u)`,
  ];
  for (const q of queries) {
    const { rows } = await dbPool.query(q, [urls]);
    rows.forEach((r) => used.add(r.url));
  }
  return used;
}

async function fetchListingRow(table, id, ownerId) {
  try {
    const q = ownerId != null
      ? await dbPool.query(`SELECT * FROM ${table} WHERE id = $1::integer AND owner_id = $2::integer`, [id, ownerId])
      : await dbPool.query(`SELECT * FROM ${table} WHERE id = $1::integer`, [id]);
    return q.rows[0] || null;
  } catch (e) { return null; }
}

// Program opțional al unei propuneri: null (fără program), 24/7 sau pe zile (0=Duminică…6=Sâmbătă)
function sanitizeProposalSchedule(schedule) {
  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!schedule || typeof schedule !== "object") return null;
  if (schedule.is247 === true) return { is247: true };
  if (schedule.days && typeof schedule.days === "object") {
    const days = {};
    for (const key of Object.keys(schedule.days)) {
      if (!/^[0-6]$/.test(key)) continue;
      const d = schedule.days[key];
      if (d && d.closed === true) days[key] = { closed: true };
      else if (d && TIME_RE.test(d.open) && TIME_RE.test(d.close)) days[key] = { open: d.open, close: d.close };
    }
    if (Object.keys(days).length) return { is247: false, days };
  }
  return null;
}


// ---- Admin: de unde vine o înscriere și ce mai lipsește din ea ----
async function loadOwnerFlagsById(ownerIds) {
  const ids = [...new Set((ownerIds || []).filter((x) => Number.isInteger(x)))];
  const map = {};
  if (!ids.length || !dbPool) return map;
  try {
    const o = await dbPool.query(`SELECT id, email, admin_created, self_verified, last_login_at FROM accommodation_owners WHERE id = ANY($1::int[])`, [ids]);
    o.rows.forEach((x) => { map[x.id] = x; });
  } catch (e) {
    try {
      const o = await dbPool.query(`SELECT id, email FROM accommodation_owners WHERE id = ANY($1::int[])`, [ids]);
      o.rows.forEach((x) => { map[x.id] = x; });
    } catch (e2) { /* fără detalii cont */ }
  }
  return map;
}

function adminOwnerBadgeHtml(o) {
  if (!o) return "";
  const state = o.admin_created
    ? (o.self_verified ? "cont creat de tine, confirmat de proprietar" : "cont creat de tine, încă neconfirmat de proprietar")
    : "cont creat chiar de proprietar";
  const login = o.last_login_at ? ` · ultima conectare ${escapeHtml(new Date(o.last_login_at).toLocaleDateString("ro-RO"))}` : (o.admin_created ? " · nu s-a conectat încă" : "");
  return `<div style="margin:8px 0;padding:8px 10px;border-radius:8px;background:#1e2a3a;border:1px solid #2d4766;font-size:14px;line-height:1.4;">🏠 Înscris de un <strong>proprietar cu cont</strong>: ${escapeHtml(o.email || "")} <span style="color:#aaa">(${escapeHtml(state)}${login})</span></div>`;
}

function adminMissingHtml(required, optional) {
  const parts = [];
  if (required.length) parts.push(`<div style="margin-top:8px;padding:8px 10px;border-radius:8px;background:#3a1e1e;color:#e9b0b0;font-size:13px;line-height:1.45;">⚠️ Lipsește (important): ${required.map(escapeHtml).join(", ")}</div>`);
  if (optional.length) parts.push(`<div style="margin-top:6px;padding:8px 10px;border-radius:8px;background:#2a2216;color:#d8c08a;font-size:13px;line-height:1.45;">ℹ️ Încă necompletat (opțional): ${optional.map(escapeHtml).join(", ")}</div>`);
  if (!parts.length) parts.push(`<div style="margin-top:8px;padding:8px 10px;border-radius:8px;background:#1e3a1e;color:#8fd98f;font-size:13px;">✓ Înscriere completă</div>`);
  return parts.join("");
}

function parseJsonArr(v) { if (Array.isArray(v)) return v; if (typeof v === "string") { try { const x = JSON.parse(v); return Array.isArray(x) ? x : []; } catch (e) { return []; } } return []; }

function missingForRestaurant(r) {
  const req = [], opt = [];
  const n = parseJsonArr(r.photos).length;
  if (n < 3) req.push(`poze (are ${n}, recomandat minim 3)`);
  if (!r.description) req.push("descriere");
  if (!r.weekday_open) req.push("program");
  if (!r.contact_phone) req.push("telefon de contact");
  if (!r.menu_url) opt.push("meniu");
  if (!r.logo_url) opt.push("logo");
  if (!r.website_url && !r.facebook_url && !r.instagram_url && !r.tiktok_url) opt.push("website / rețele sociale");
  return [req, opt];
}

function missingForAttraction(r) {
  const req = [], opt = [];
  const n = parseJsonArr(r.photos).length;
  if (n < 3) req.push(`poze (are ${n}, recomandat minim 3)`);
  if (!r.cover_photo_url) req.push("poză de copertă");
  if (!r.description) req.push("descriere");
  if (!r.weekday_open) req.push("program");
  if (r.access_type === "paid" && !r.price_standard) req.push("tarif");
  if (!r.contact_phone && !r.contact_email) req.push("contact");
  if (!r.website_url) opt.push("website");
  if (!r.brochure_url) opt.push("broșură");
  return [req, opt];
}


// ============================================================
// Restaurante/puburi/cafenele — panou de admin, email de aprobare,
// pagină publică. Oglindă exactă a tiparului de la cazare, fără
// abonament (cerut explicit — listare gratuită, punct).
// ============================================================
async function sendRestaurantApprovalEmail(email, listingName, listingUrl, loginUrl) {
  if (!RESEND_API_KEY) { console.error("sendRestaurantApprovalEmail: RESEND_API_KEY lipsă"); return false; }
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from: "Opening Hours Today <cazare@programul-de-azi.ro>",
        to: [email],
        subject: `Mulțumim! ${listingName} este acum live pe Opening Hours Today 🎉 / ${listingName} is now live`,
        html: `
<p>Bună,</p>
<p>Vești bune — <strong>${listingName}</strong> a fost verificat și publicat pe Opening Hours Today, gratuit, fără abonament. De acum, oricine caută un loc de mâncat te poate găsi și te poate contacta direct:</p>
<p><a href="${listingUrl}">${listingUrl}</a></p>
<h3 style="margin-top:24px">Ce urmează</h3>
<p>Poți reveni oricând în contul tău ca să actualizezi poze, meniul sau programul:</p>
<p><a href="${loginUrl}">${loginUrl}</a></p>
<div style="margin-top:28px;padding:18px 20px;background:#f7f5f0;border-radius:10px;">
<p style="margin:0 0 10px;font-weight:700;">☕ Un cuvânt despre ce construim aici</p>
<p style="margin:0 0 10px;">Opening Hours Today este un proiect independent, creat special pentru ca unitățile de cazare, restaurantele, cafenelele și obiectivele turistice să aibă vizibilitate maximă, fără taxe ascunse sau comisioane la rezervări. Este spațiul în care tu ții legătura direct cu clienții și oaspeții tăi.</p>
<p style="margin:0 0 14px;">Dacă platforma îți aduce valoare, ne poți ajuta să o menținem activă și gratuită oferindu-ne o cafea. Orice sprijin contează pentru viitorul acestei comunități!</p>
<p style="margin:0"><a href="https://ko-fi.com/openinghourstoday" style="font-weight:700;">☕ Cumpără-ne o cafea →</a></p>
</div>
<p style="margin-top:24px">Îți mulțumim că faci parte din Opening <span style="color:#F0813A">Hours Today</span>.<br>Echipa Opening <span style="color:#F0813A">Hours Today</span></p>
<hr style="margin:32px 0 20px;border:none;border-top:1px solid #ddd;">
<p style="color:#666;font-size:13px;margin:0 0 10px;">🇬🇧 English</p>
<p>Good news — <strong>${listingName}</strong> has been reviewed and is now live on Opening Hours Today. Visitors can now find you and contact you directly, with no middlemen:</p>
<p><a href="${listingUrl}">${listingUrl}</a></p>
<p>You can sign in to your account at any time to update photos, prices or details, using the email and password you registered with:</p>
<p><a href="${loginUrl}">${loginUrl}</a></p>
<p>Thank you for being part of Opening <span style="color:#F0813A">Hours Today</span>.<br>The Opening <span style="color:#F0813A">Hours Today</span> team</p>`,
      }),
    });
    return resp.ok;
  } catch (err) {
    console.error("sendRestaurantApprovalEmail a eșuat:", err.message);
    return false;
  }
}


// ============================================================
// Obiective turistice PROPUSE de public — admin, email, pagină publică.
// Oglindă exactă a tiparului de la restaurant, cu câmpurile specifice
// obiectivelor (tarife, acces, facilități diferite).
// ============================================================
async function sendAttractionApprovalEmail(email, listingName, listingUrl, loginUrl) {
  if (!RESEND_API_KEY) { console.error("sendAttractionApprovalEmail: RESEND_API_KEY lipsă"); return false; }
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from: "Opening Hours Today <cazare@programul-de-azi.ro>",
        to: [email],
        subject: `Mulțumim! ${listingName} este acum live pe Opening Hours Today 🎉 / ${listingName} is now live`,
        html: `
<p>Bună,</p>
<p>Vești bune — <strong>${listingName}</strong> a fost verificat și publicat pe Opening Hours Today, gratuit. De acum, turiștii care caută ce să viziteze te pot găsi și pot vedea direct programul, tarifele și cum se ajunge:</p>
<p><a href="${listingUrl}">${listingUrl}</a></p>
<h3 style="margin-top:24px">Ce urmează</h3>
<p>Poți reveni oricând în contul tău ca să actualizezi poze, tarife sau programul:</p>
<p><a href="${loginUrl}">${loginUrl}</a></p>
<div style="margin-top:28px;padding:18px 20px;background:#f7f5f0;border-radius:10px;">
<p style="margin:0 0 10px;font-weight:700;">☕ Un cuvânt despre ce construim aici</p>
<p style="margin:0 0 10px;">Opening Hours Today este un proiect independent, creat special pentru ca unitățile de cazare, restaurantele, cafenelele și obiectivele turistice să aibă vizibilitate maximă, fără taxe ascunse sau comisioane la rezervări. Este spațiul în care tu ții legătura direct cu vizitatorii tăi.</p>
<p style="margin:0 0 14px;">Dacă platforma îți aduce valoare, ne poți ajuta să o menținem activă și gratuită oferindu-ne o cafea. Orice sprijin contează pentru viitorul acestei comunități!</p>
<p style="margin:0"><a href="https://ko-fi.com/openinghourstoday" style="font-weight:700;">☕ Cumpără-ne o cafea →</a></p>
</div>
<p style="margin-top:24px">Îți mulțumim că faci parte din Opening <span style="color:#F0813A">Hours Today</span>.<br>Echipa Opening <span style="color:#F0813A">Hours Today</span></p>
<hr style="margin:32px 0 20px;border:none;border-top:1px solid #ddd;">
<p style="color:#666;font-size:13px;margin:0 0 10px;">🇬🇧 English</p>
<p>Good news — <strong>${listingName}</strong> has been reviewed and is now live on Opening Hours Today. Visitors can now find you and contact you directly, with no middlemen:</p>
<p><a href="${listingUrl}">${listingUrl}</a></p>
<p>You can sign in to your account at any time to update photos, prices or details, using the email and password you registered with:</p>
<p><a href="${loginUrl}">${loginUrl}</a></p>
<p>Thank you for being part of Opening <span style="color:#F0813A">Hours Today</span>.<br>The Opening <span style="color:#F0813A">Hours Today</span> team</p>`,
      }),
    });
    return resp.ok;
  } catch (err) {
    console.error("sendAttractionApprovalEmail a eșuat:", err.message);
    return false;
  }
}

function seoTypeWord(type, lang) {
  const w = SEO_TYPE_WORDS[type];
  return w ? (lang === "en" ? w.en : w.ro) : (lang === "en" ? "place" : "loc");
}

function seoTruncate(text, max) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

// pentru <meta description>, JSON-LD și previzualizările din admin — text
// simplu, fără markeri și fără HTML.
function stripDescriptionMarkers(text) {
  if (!text) return "";
  return String(text)
    .replace(/\[center\]|\[\/center\]/g, "")
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
    .replace(/__([\s\S]+?)__/g, "$1")
    .replace(/\*([\s\S]+?)\*/g, "$1");
}

function buildDescriptionAiPrompt(kind, facts, lang, remaining) {
  const isRo = lang !== "en";
  const budget = Math.max(300, Math.min(remaining || 1800, 1800));
  const cliseeList = DESC_AI_CLICHEE.join(", ");
  const factsLines = [];
  if (facts.name) factsLines.push(`- ${isRo ? "Nume" : "Name"}: ${facts.name}`);
  if (facts.typeLabel) factsLines.push(`- ${isRo ? "Tip" : "Type"}: ${facts.typeLabel}`);
  if (facts.city) factsLines.push(`- ${isRo ? "Localitate" : "Town"}: ${facts.city}${facts.county ? `, ${facts.county}` : ""}`);
  if (facts.address) factsLines.push(`- ${isRo ? "Adresă" : "Address"}: ${facts.address}`);
  if (facts.capacity) factsLines.push(`- ${isRo ? "Capacitate" : "Capacity"}: ${facts.capacity} ${isRo ? "persoane" : "guests"}`);
  if (facts.rooms) factsLines.push(`- ${isRo ? "Camere/unități" : "Rooms/units"}: ${facts.rooms}`);
  if (facts.managedBy) factsLines.push(`- ${isRo ? "Administrat de" : "Managed by"}: ${facts.managedBy}`);
  if (facts.accessInfo) factsLines.push(`- ${isRo ? "Acces" : "Access"}: ${facts.accessInfo}`);
  if (facts.roomTypes) factsLines.push(`- ${isRo ? "Tipuri de unități" : "Unit types"}: ${facts.roomTypes}`);
  if (Array.isArray(facts.amenities) && facts.amenities.length) {
    factsLines.push(`- ${isRo ? "Facilități bifate" : "Checked facilities"}: ${facts.amenities.join(", ")}`);
  }
  const factsBlock = factsLines.join("\n");
  const kindWord = kind === "obiectiv" ? (isRo ? "obiectiv turistic" : "tourist attraction") : (isRo ? "cazare turistică" : "tourist accommodation");
  if (isRo) {
    return `Acționează ca un copywriter profesionist în turism. Scrie o descriere clară, primitoare și convingătoare pentru acest(ă) ${kindWord}, care va fi publicată pe un site de turism.

REGULI STRICTE, obligatorii:
1. NU inventa NICIUN detaliu care nu apare mai jos — fără fabulații, fără presupuneri despre lucruri nespecificate (nu menționa priveliști, decorațiuni, mâncare, personal etc. dacă nu sunt în listă).
2. EVITĂ complet aceste clișee și formulări obosite: ${cliseeList}. Fii natural, concret și onest, nu generic.
3. Structura textului: o scurtă introducere (1-2 fraze), apoi secțiuni clare pe baza a ce e disponibil (de exemplu camere/facilități/activități — doar cele cu date reale), și un apel la acțiune scurt la final.
4. Poți folosi cel mult câteva cuvinte/titluri scurte îngroșate, marcate cu **așa** (de exemplu **Camere** ca mini-titlu de secțiune) — nu îngroșa fraze întregi.
5. Scrie STRICT în limba română, text simplu (fără markdown complex, fără liste cu marcatori, doar paragrafe separate prin rând nou).
6. Încadrează-te în aproximativ ${budget} de caractere — poate fi puțin mai scurt, dar NU mai lung.

Datele disponibile despre această ${kindWord} (folosește DOAR ce e aici):
${factsBlock}

Scrie acum descrierea, fără alt text în afara ei (fără introducere de genul „Iată descrierea:”).`;
  }
  return `Act as a professional tourism copywriter. Write a clear, welcoming and convincing description for this ${kindWord}, to be published on a tourism website.

STRICT RULES, mandatory:
1. Do NOT invent any detail that isn't listed below — no fabrication, no assumptions about unspecified things (don't mention views, decor, food, staff, etc. unless they're in the list).
2. Completely AVOID these clichés and tired phrases: ${cliseeList}. Be natural, concrete and honest, not generic.
3. Structure: a short intro (1-2 sentences), then clear sections based on what's actually available (e.g. rooms/facilities/activities — only ones with real data), and a short call to action at the end.
4. You may use a few short bolded words/headers, marked as **like this** (e.g. **Rooms** as a mini section header) — do not bold entire sentences.
5. Write STRICTLY in English, plain text (no complex markdown, no bullet lists, just paragraphs separated by a new line).
6. Stay within approximately ${budget} characters — it can be a bit shorter, but NOT longer.

Available data about this ${kindWord} (use ONLY what's here):
${factsBlock}

Write the description now, with no other text outside it (no intro like "Here is the description:").`;
}

function bedTypeLabel(key, lang) {
  const b = BED_TYPES[key];
  if (!b) return key;
  return lang === "en" ? b.en : b.ro;
}

// text simplu, pentru AI și pentru admin (ex. "1 pat dublu extra-large, 1 canapea extensibilă")
function formatBedsPlain(beds, lang) {
  if (!beds || typeof beds !== "object") return "";
  return Object.keys(beds)
    .filter((k) => BED_TYPES[k] && beds[k] > 0)
    .map((k) => `${beds[k]} ${bedTypeLabel(k, lang).toLowerCase()}`)
    .join(", ");
}

function sanitizeBedsObj(raw) {
  const beds = {};
  if (raw && typeof raw === "object") {
    Object.keys(BED_TYPES).forEach((k) => {
      const n = parseInt(raw[k], 10);
      if (Number.isInteger(n) && n > 0 && n <= 20) beds[k] = n;
    });
  }
  return beds;
}

function sanitizeRoomTypes(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((rt) => {
      if (!rt || typeof rt !== "object") return null;
      const name = typeof rt.name === "string" ? rt.name.trim().slice(0, 80) : "";
      const rooms = Array.isArray(rt.rooms)
        ? rt.rooms.map((room) => {
            if (!room || typeof room !== "object") return null;
            const roomName = typeof room.name === "string" ? room.name.trim().slice(0, 60) : "";
            if (!roomName) return null;
            return { name: roomName, beds: sanitizeBedsObj(room.beds) };
          }).filter(Boolean).slice(0, 15)
        : [];
      const bathrooms = Array.isArray(rt.bathrooms)
        ? rt.bathrooms.map((bath) => {
            if (!bath || typeof bath !== "object") return null;
            const type = bath.type === "shared" ? "shared" : "private";
            const amenities = Array.isArray(bath.amenities) ? bath.amenities.filter((a) => BATH_AMENITIES[a]).slice(0, 10) : [];
            return { type, amenities };
          }).filter(Boolean).slice(0, 20)
        : [];
      // intrarea „simplă” (o singură structură în total) nu are nume, tip,
      // capacitate etc. — doar camere/băi; păstrăm totuși rândul, dacă are
      // măcar camere sau băi completate
      if (!name && !rooms.length && !bathrooms.length) return null;
      const unitType = typeof rt.unitType === "string" && UNIT_TYPES[rt.unitType] ? rt.unitType : "";
      const adults = typeof rt.adults === "string" ? rt.adults.slice(0, 5) : "";
      const children = typeof rt.children === "string" ? rt.children.slice(0, 5) : "";
      const kitchenType = typeof rt.kitchenType === "string" && KITCHEN_TYPES[rt.kitchenType] ? rt.kitchenType : "fara";
      const amenities = Array.isArray(rt.amenities) ? rt.amenities.filter((a) => ACCOMMODATION_AMENITIES[a]).slice(0, 30) : [];
      const description = typeof rt.description === "string" ? rt.description.trim().slice(0, 2000) : "";
      const photos = Array.isArray(rt.photos) ? rt.photos.filter((u) => typeof u === "string" && sanitizePublicUrl(u)).slice(0, 20) : [];
      return { name, unitType, adults, children, rooms, bathroomCount: bathrooms.length, bathrooms, kitchenType, amenities, description, photos };
    })
    .filter(Boolean)
    .slice(0, 20);
}

function sanitizeExteriorInfo(raw) {
  if (!raw || typeof raw !== "object") return { access: [], amenities: [] };
  const access = Array.isArray(raw.access) ? raw.access.filter((a) => EXTERIOR_ACCESS[a]).slice(0, 10) : [];
  const amenities = Array.isArray(raw.amenities) ? raw.amenities.filter((a) => EXTERIOR_AMENITIES[a]).slice(0, 10) : [];
  return { access, amenities };
}

function exteriorInfoToText(info, lang) {
  if (!info || (!info.access.length && !info.amenities.length)) return "";
  const labels = [...info.access, ...info.amenities].map((k) => {
    const entry = EXTERIOR_ACCESS[k] || EXTERIOR_AMENITIES[k];
    return entry ? (lang === "en" ? entry.en : entry.ro) : null;
  }).filter(Boolean);
  return labels.join(", ");
}

// scoate emoji-ul din fața etichetelor (le avem oricum ca iconiță SVG acum)
function stripLeadingEmoji(txt) { return String(txt || "").replace(/^\S+\s/, ""); }


function paIcon(key, size) {
  // acceptă fie o cheie de facilitate (din PA_ICON_MAP), fie direct numele
  // unei forme (ex. "bed", "bath"), dacă e folosită independent
  const shape = PA_ICON_PATHS[key] ? key : (PA_ICON_MAP[key] || "check");
  const path = PA_ICON_PATHS[shape] || PA_ICON_PATHS.check;
  return `<svg class="pa-icon" width="${size || 18}" height="${size || 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

const ACCOMMODATION_AMENITIES_I18N = Object.fromEntries(
  Object.keys(ACCOMMODATION_AMENITIES).map((k) => [k, {
    ro: ACCOMMODATION_AMENITIES[k].replace(/^\S+\s/, ""),
    en: (I18N_MAPS_EN.get(ACCOMMODATION_AMENITIES)[k] || ACCOMMODATION_AMENITIES[k]).replace(/^\S+\s/, ""),
    icon: paIcon(k),
  }])
);

function buildListingSeoHeadHtml({ kind, r, lang, baseUrl, path, avgRating, reviewCount, priceFrom, priceCurrency, noindex }) {
  const isRo = lang === "ro";
  const typeWord = seoTypeWord(kind === "cazare" ? r.type : kind === "restaurant" ? r.venue_type : "obiectiv", lang);
  const cityPart = r.city ? `, ${r.city}` : "";
  const title = `${r.name} — ${typeWord.charAt(0).toUpperCase() + typeWord.slice(1)}${cityPart} — Opening Hours Today`;
  const descBase = r.description
    ? stripDescriptionMarkers(r.description)
    : isRo
      ? `${r.name}, ${typeWord} în ${r.city || "România"}. Program, adresă, poze și contact direct, fără intermediari, pe Opening Hours Today.`
      : `${r.name}, ${typeWord} in ${r.city || "Romania"}. Hours, address, photos and direct contact, no middlemen, on Opening Hours Today.`;
  const description = seoTruncate(descBase, 160);
  const canonical = `${baseUrl}${path}`;
  const photosArr = Array.isArray(r.photos) ? r.photos : (typeof r.photos === "string" ? (() => { try { return JSON.parse(r.photos); } catch (e) { return []; } })() : []);
  const ogImage = r.cover_photo_url || photosArr[0] || `${baseUrl}/icon-512.png`;
  const schemaType = kind === "cazare" ? "LodgingBusiness" : kind === "restaurant" ? "Restaurant" : "TouristAttraction";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: r.name,
    image: photosArr.length ? photosArr : [ogImage],
    url: canonical,
  };
  if (r.address || r.city) {
    jsonLd.address = { "@type": "PostalAddress", streetAddress: r.address || undefined, addressLocality: r.city || undefined, addressRegion: r.county || undefined, addressCountry: (r.country_code || "RO").toUpperCase() };
  }
  if (r.contact_phone) jsonLd.telephone = r.contact_phone;
  if (priceFrom) jsonLd.priceRange = `${priceFrom}+ ${priceCurrency || "RON"}`;
  if (r.description) jsonLd.description = seoTruncate(stripDescriptionMarkers(r.description), 500);
  if (avgRating && reviewCount) {
    jsonLd.aggregateRating = { "@type": "AggregateRating", ratingValue: Number(avgRating).toFixed(1), reviewCount, bestRating: "10" };
  }
  if (kind === "restaurant" && r.cuisine) jsonLd.servesCuisine = r.cuisine;
  const jsonLdStr = safeJson(jsonLd);
  return `<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
${noindex ? `<meta name="robots" content="noindex, nofollow">` : ""}
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(ogImage)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${jsonLdStr}</script>
<link rel="stylesheet" href="/style.css">`;
}


// Etichete + iconițe (SVG, generate pe server) pentru formularul de hotel / camping
function typeDetailsClientDef(lang) {
  const en = lang === "en";
  const lab = (o) => (en ? o.en : o.ro);
  const mk = (map) => Object.keys(map).map((k) => ({ k, l: lab(map[k]), icon: map[k].icon ? paIcon(map[k].icon, 16) : "", group: map[k].group || "", minPhotos: map[k].minPhotos || 0 }));
  const aptGroups = Object.fromEntries(Object.keys(APT_GROUPS).map((sec) => [sec, APT_GROUPS[sec].map((g) => ({ id: g.id, title: lab(g), items: g.items.map((x) => ({ k: x.k, l: lab(x), icon: paIcon(x.icon, 18) })) }))]));
  const aptOpts = Object.fromEntries(Object.keys(APT_OPTS).map((n) => [n, APT_OPTS[n].map((o) => ({ k: o[0], l: en ? o[2] : o[1] }))]));
  return {
    hotel: {
      subtypes: mk(HOTEL_SUBTYPES), reception: mk(HOTEL_RECEPTION), beds: mk(HOTEL_BEDS), roomAmenities: mk(HOTEL_ROOM_AMENITIES),
      menus: mk(HOTEL_MENUS), mealPlans: mk(HOTEL_MEAL_PLANS), facilities: mk(HOTEL_FACILITIES), pets: mk(HOTEL_PETS), quiet: mk(HOTEL_QUIET),
      roomPhotoMax: HOTEL_ROOM_PHOTO_MAX, restPhotoMax: HOTEL_PHOTO_MAX, icons: { fork: paIcon("kitchen", 18) },
    },
    pensionTypes: PENSION_TYPES,
    pension: {
      rentalModes: mk(RENTAL_MODES),
      beds: Object.keys(PENSION_BED_KEYS).map((k) => ({ k, l: lab(PENSION_BED_KEYS[k]) })),
      bedroomAmenities: Object.keys(BEDROOM_AMENITIES).map((k) => ({ k, l: lab(BEDROOM_AMENITIES[k]) })),
      bathTypes: Object.keys(PENSION_BATH_TYPES).map((k) => ({ k, l: lab(PENSION_BATH_TYPES[k]) })),
      bathAmenities: Object.keys(BATH_AMENITIES).map((k) => ({ k, l: lab(BATH_AMENITIES[k]) })),
      fireplaceTypes: Object.keys(FIREPLACE_TYPES).map((k) => ({ k, l: lab(FIREPLACE_TYPES[k]) })),
      livingGroups: LIVING_GROUPS.map((g) => ({ id: g.id, title: lab(g), icon: paIcon(g.icon, 20), items: g.items.map((it) => ({ k: it.k, l: lab(it), icon: paIcon(it.icon, 20) })) })),
      facGroups: [
        { id: "curte", title: en ? "Yard & relaxation facilities" : "Facilități curte și relaxare", keys: ["pescuit", "piscina", "jacuzzi", "loc_de_joaca", "gratar", "sauna", "parcare"] },
        { id: "servicii", title: en ? "Services & meals" : "Servicii și masă", keys: ["mic_dejun", "restaurant_propriu", "plata_card", "receptie", "curatenie_zilnica", "sala_conferinte", "animale"] },
        { id: "dotari", title: en ? "Amenities & comfort" : "Dotări și confort", keys: ["wifi", "aer_conditionat", "smart_tv", "bucatarie_utilata", "masina_spalat", "masina_spalat_vase", "espressor"] },
      ],
      icons: { bed: paIcon("bed", 20), bath: paIcon("bath", 20), tv: paIcon("tv", 20), home: paIcon("home", 20) },
    },
    camp: {
      units: mk(CAMP_UNITS), facilities: mk(CAMP_FACILITIES), groups: Object.fromEntries(Object.keys(CAMP_GROUPS).map((g) => [g, lab(CAMP_GROUPS[g])])),
      pets: mk(HOTEL_PETS), quiet: mk(HOTEL_QUIET), vehicles: mk(CAMP_VEHICLES),
      shade: mk(CAMP_SHADE),
      unitBeds: Object.keys(CAMP_UNIT_BEDS).map((k) => ({ k, l: lab(CAMP_UNIT_BEDS[k]), icon: paIcon(CAMP_UNIT_BEDS[k].icon, 20) })),
      unitAmenities: Object.keys(CAMP_UNIT_AMENITIES).map((k) => ({ k, l: lab(CAMP_UNIT_AMENITIES[k]), icon: paIcon(CAMP_UNIT_AMENITIES[k].icon, 20) })),
      photoMax: CAMP_PHOTO_MAX,
      icons: { tent: paIcon("tent", 26), car: paIcon("car", 26), home: paIcon("home", 26), bolt: paIcon("bolt", 20), drop: paIcon("drop", 20), sewer: paIcon("sewer", 20), tentS: paIcon("tent", 20), carS: paIcon("car", 20), homeS: paIcon("home", 20), family: paIcon("family", 20), tree: paIcon("tree", 20) },
    },
    apt: {
      groups: aptGroups, opts: aptOpts, bedroomsMax: APT_BEDROOMS_MAX, bathsMax: APT_BATHS_MAX,
      icons: { bed: paIcon("bed", 20), bath: paIcon("bath", 20), sofa: paIcon("sofa", 20), lift: paIcon("lift", 20), door: paIcon("door", 20), home: paIcon("home", 20), key: paIcon("check", 20) },
    },
  };
}


function sanitizeHotelDetails(raw) {
  if (!raw || typeof raw !== "object") return null;
  const pick = (map, v) => (typeof v === "string" && map[v] ? v : "");
  const filt = (map, arr, max) => (Array.isArray(arr) ? arr.filter((k) => map[k]).slice(0, max || 30) : []);
  const num = (v, lo, hi) => { const n = parseFloat(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
  const urls = (arr, max) => (Array.isArray(arr) ? arr.filter((u) => typeof u === "string" && isOwnBlobUrl(u)).slice(0, max || 20) : []);
  const roomTypes = (Array.isArray(raw.roomTypes) ? raw.roomTypes : []).map((rt) => {
    if (!rt || typeof rt !== "object") return null;
    const name = typeof rt.name === "string" ? rt.name.trim().slice(0, 80) : "";
    if (!name) return null;
    const count = Number.isInteger(rt.count) && rt.count >= 1 && rt.count <= 500 ? rt.count : 1;
    // apartament / suită cu mai multe încăperi (2–3): fiecare încăpere e dormitor sau living, cu paturile ei
    let spaces = (Array.isArray(rt.spaces) ? rt.spaces : []).slice(0, 3).map((sp) => ({ kind: sp && sp.kind === "living" ? "living" : "dormitor", beds: filt(HOTEL_BEDS, sp && sp.beds, 5) }));
    if (spaces.length < 2) spaces = [];
    else {
      let seenLiving = false;
      spaces = spaces.map((sp) => { if (sp.kind === "living") { if (seenLiving) return { kind: "dormitor", beds: sp.beds }; seenLiving = true; } return sp; });
      if (!spaces.some((sp) => sp.kind === "dormitor")) spaces[0] = { kind: "dormitor", beds: spaces[0].beds };
    }
    const allBeds = spaces.length ? [...new Set(spaces.reduce((a, sp) => a.concat(sp.beds), []))] : filt(HOTEL_BEDS, rt.beds, 5);
    return {
      name, count,
      adults: typeof rt.adults === "string" ? rt.adults.slice(0, 3) : "2",
      children: typeof rt.children === "string" ? rt.children.slice(0, 3) : "0",
      spaces,
      beds: allBeds,
      amenities: filt(HOTEL_ROOM_AMENITIES, rt.amenities, 10),
      price: num(rt.price, 0, 1000000),
      photos: urls(rt.photos, HOTEL_ROOM_PHOTO_MAX),
    };
  }).filter(Boolean).slice(0, 40);
  const r = raw.restaurant && typeof raw.restaurant === "object" ? raw.restaurant : {};
  const restaurant = {
    has: r.has === true,
    name: typeof r.name === "string" ? r.name.trim().slice(0, 120) : "",
    menus: filt(HOTEL_MENUS, r.menus, 10),
    mealPlan: pick(HOTEL_MEAL_PLANS, r.mealPlan),
    breakfastPolicy: r.breakfastPolicy === "included" || r.breakfastPolicy === "paid" ? r.breakfastPolicy : "",
    breakfastPrice: num(r.breakfastPrice, 0, 10000),
    photos: urls(r.photos, HOTEL_PHOTO_MAX),
  };
  if (!restaurant.has) { restaurant.name = ""; restaurant.menus = []; restaurant.mealPlan = ""; restaurant.breakfastPolicy = ""; restaurant.breakfastPrice = null; restaurant.photos = []; }
  return {
    subtype: pick(HOTEL_SUBTYPES, raw.subtype),
    seasonality: raw.seasonality === "sezonier" ? "sezonier" : "permanent",
    reception: pick(HOTEL_RECEPTION, raw.reception),
    pets: pick(HOTEL_PETS, raw.pets),
    quiet: pick(HOTEL_QUIET, raw.quiet),
    certificate: typeof raw.certificate === "string" ? raw.certificate.trim().slice(0, 60) : "",
    facilities: filt(HOTEL_FACILITIES, raw.facilities, 10),
    roomTypes,
    restaurant,
  };
}


function sanitizePensionDetails(raw) {
  if (!raw || typeof raw !== "object" || raw.v !== 2) return null;
  const num = (v, lo, hi) => { const n = parseFloat(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
  const int = (v, lo, hi) => { const n = parseInt(v, 10); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };
  const txt = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const filt = (map, arr, max) => (Array.isArray(arr) ? arr.filter((k) => typeof k === "string" && (Array.isArray(map) ? map.includes(k) : map[k])).slice(0, max || 20) : []);
  const bed = (b, allowed) => {
    const t = b && typeof b === "object" && allowed.includes(b.type) ? b.type : "";
    return t ? { type: t, qty: int(b.qty, 1, 12) || 1 } : null;
  };
  const bath = (b) => (b && typeof b === "object"
    ? { type: b.type === "shared" ? "shared" : "private", amenities: filt(BATH_AMENITIES, b.amenities, 10) }
    : { type: "shared", amenities: [] });
  const structures = (Array.isArray(raw.structures) ? raw.structures : []).map((st) => {
    if (!st || typeof st !== "object") return null;
    const bedrooms = (Array.isArray(st.bedrooms) ? st.bedrooms : []).map((br, i) => {
      if (!br || typeof br !== "object") return null;
      return {
        name: txt(br.name, 60) || `Dormitorul ${i + 1}`,
        bedMain: bed(br.bedMain, PENSION_MAIN_BEDS), bedExtra: bed(br.bedExtra, PENSION_EXTRA_BEDS),
        amenities: filt(BEDROOM_AMENITIES, br.amenities, 10), bath: bath(br.bath),
      };
    }).filter(Boolean).slice(0, 12);
    const lv = st.living && typeof st.living === "object" ? st.living : {};
    const living = { has: lv.has === true, bedMain: bed(lv.bedMain, PENSION_MAIN_BEDS), bedExtra: bed(lv.bedExtra, PENSION_EXTRA_BEDS), amenities: filt(LIVING_AMENITIES, lv.amenities, 10) };
    if (!living.has) { living.bedMain = null; living.bedExtra = null; living.amenities = []; }
    const kt = st.kitchen && typeof st.kitchen === "object" ? st.kitchen : {};
    const kitchenType = KITCHEN_TYPES[kt.type] ? kt.type : "fara";
    const kitchen = { type: kitchenType, appliances: (kitchenType === "chicineta" || kitchenType === "completa") ? filt(KITCHEN_APPLIANCES, kt.appliances, 10) : [] };
    const photosMode = st.photosMode === "dedicate" ? "dedicate" : "comune";
    const out = {
      name: txt(st.name, 80), unitType: UNIT_TYPES[st.unitType] ? st.unitType : "",
      adults: txt(st.adults, 3) || "2", children: txt(st.children, 3) || "0",
      area: int(st.area, 1, 5000), view: VIEW_TYPES[st.view] ? st.view : "",
      priceWeekday: num(st.priceWeekday, 0, 1000000), priceWeekend: num(st.priceWeekend, 0, 1000000),
      bedrooms, structureBath: bedrooms.length === 0 ? bath(st.structureBath) : null,
      living, kitchen, facilities: filt(STRUCT_FACILITY_KEYS, st.facilities, 10),
      description: txt(st.description, 800), photosMode,
      photos: photosMode === "dedicate" && Array.isArray(st.photos) ? st.photos.filter((u) => typeof u === "string" && isOwnBlobUrl(u)).slice(0, 20) : [],
    };
    const hasContent = out.name || bedrooms.length || living.has || out.priceWeekday || out.description || kitchenType !== "fara";
    return hasContent ? out : null;
  }).filter(Boolean).slice(0, 12);
  return {
    v: 2,
    rentalMode: RENTAL_MODES[raw.rentalMode] ? raw.rentalMode : "integral",
    priceWeekday: num(raw.priceWeekday, 0, 1000000), priceWeekend: num(raw.priceWeekend, 0, 1000000),
    structures,
  };
}

function sanitizeApartmentDetails(raw) {
  if (!raw || typeof raw !== "object" || raw.v !== 1 || !["studio", "apartament", "penthouse"].includes(raw.kind)) return null;
  const optKeys = (n) => APT_OPTS[n].map((o) => o[0]);
  const pickOpt = (n, v) => (typeof v === "string" && optKeys(n).includes(v) ? v : "");
  const filtOpt = (n, arr, max) => { const ok = optKeys(n), out = []; (Array.isArray(arr) ? arr : []).forEach((k) => { if (ok.includes(k) && !out.includes(k) && out.length < (max || 10)) out.push(k); }); return out; };
  const filt = (sec, arr, max) => { const out = []; (Array.isArray(arr) ? arr : []).forEach((k) => { if (typeof k === "string" && APT_INDEX[sec][k] && !out.includes(k) && out.length < (max || 30)) out.push(k); }); return out; };
  const int = (v, lo, hi) => { const n = parseInt(v, 10); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };
  const num = (v, lo, hi) => { const n = parseFloat(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
  const time = (v) => (typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : "");
  const kind = raw.kind;
  const bedCount = kind === "studio" ? 0 : Math.min(APT_BEDROOMS_MAX, Math.max(1, parseInt(raw.bedroomCount, 10) || 1));
  const srcBeds = Array.isArray(raw.bedrooms) ? raw.bedrooms : [];
  const bedrooms = Array.from({ length: bedCount }, (_, i) => { const b = srcBeds[i] && typeof srcBeds[i] === "object" ? srcBeds[i] : {}; return { beds: filtOpt("beds", b.beds, 4), amenities: filt("bedroom", b.amenities, 20) }; });
  const mn = raw.main && typeof raw.main === "object" ? raw.main : {};
  const main = kind === "studio" ? { beds: filtOpt("beds", mn.beds, 4), amenities: filt("bedroom", mn.amenities, 20) } : null;
  const lv = raw.living && typeof raw.living === "object" ? raw.living : {};
  const lvItems = filt("living", lv.items, 20);
  const cap = parseInt(lv.sofaCapacity, 10);
  const living = { items: lvItems, sofaCapacity: lvItems.includes("sofa_ext") && (cap === 1 || cap === 2) ? cap : null, fireplace: lvItems.includes("semineu") ? filtOpt("fireplace", lv.fireplace, 3) : [] };
  const srcBaths = Array.isArray(raw.baths) ? raw.baths : [];
  const bathCount = Math.min(APT_BATHS_MAX, Math.max(1, srcBaths.length || 1));
  const baths = Array.from({ length: bathCount }, (_, i) => { const b = srcBaths[i] && typeof srcBaths[i] === "object" ? srcBaths[i] : {}; return { amenities: filt("bath", b.amenities, 20) }; });
  const bd = raw.building && typeof raw.building === "object" ? raw.building : {};
  const building = { floor: typeof bd.floor === "string" ? bd.floor.trim().slice(0, 10) : "", elevator: bd.elevator === true, privateEntrance: bd.privateEntrance === true };
  const fc = raw.facilities && typeof raw.facilities === "object" ? raw.facilities : {};
  const fItems = filt("facilities", fc.items, 30);
  const parking = fItems.includes("parcare") && (fc.parking === "gratuit" || fc.parking === "contra_cost") ? fc.parking : "";
  const facilities = { items: fItems, wifiMbps: fItems.includes("wifi") ? int(fc.wifiMbps, 1, 10000) : null, parking, parkingPrice: parking === "contra_cost" ? num(fc.parkingPrice, 0, 10000) : null };
  const rl = raw.rules && typeof raw.rules === "object" ? raw.rules : {};
  const rules = { smoking: pickOpt("smoking", rl.smoking), parties: pickOpt("parties", rl.parties), pets: pickOpt("pets", rl.pets), quietFrom: time(rl.quietFrom), quietTo: time(rl.quietTo) };
  return { v: 1, kind, bedroomCount: bedCount, building, bedrooms, main, living, baths, facilities, checkin: pickOpt("checkin", raw.checkin), rules };
}

function sanitizeCampingDetails(raw) {
  if (!raw || typeof raw !== "object") return null;
  const pick = (map, v) => (typeof v === "string" && map[v] ? v : "");
  const num = (v, lo, hi) => { const n = parseFloat(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
  const int = (v, lo, hi) => { const n = parseInt(v, 10); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };
  const filt = (map, arr, max) => { const out = []; (Array.isArray(arr) ? arr : []).forEach((k) => { if (typeof k === "string" && map[k] && !out.includes(k) && out.length < (max || 30)) out.push(k); }); return out; };
  const urls = (arr) => (Array.isArray(arr) ? arr.filter((u) => typeof u === "string" && isOwnBlobUrl(u)).slice(0, CAMP_PHOTO_MAX) : []);
  const t = raw.tents && typeof raw.tents === "object" ? raw.tents : {};
  const c = raw.caravans && typeof raw.caravans === "object" ? raw.caravans : {};
  const f = raw.fees && typeof raw.fees === "object" ? raw.fees : {};
  const v2 = raw.v === 2;
  // modelul vechi (v1: preț cort mic / mare, o singură rulotă) se convertește la cel nou
  const tentCount = int(t.count, 0, 5000);
  const tentPrice = v2 ? num(t.price, 0, 100000) : (num(t.priceSmall, 0, 100000) != null ? num(t.priceSmall, 0, 100000) : num(t.priceLarge, 0, 100000));
  const tentsOn = v2 ? t.on === true : ((tentCount || 0) > 0 || tentPrice > 0);
  const carCount = int(c.count, 0, 5000), carPrice = num(c.price, 0, 100000);
  const carOn = v2 ? c.on === true : ((carCount || 0) > 0 || carPrice > 0);
  const units = {};
  Object.keys(CAMP_UNITS).forEach((k) => {
    const u = raw.units && raw.units[k];
    if (!u || typeof u !== "object" || u.has !== true) return;
    units[k] = { has: true, count: int(u.count, 1, 500) || 1, capacity: int(u.capacity, 1, 50) || 2, beds: filt(CAMP_UNIT_BEDS, u.beds, 3), amenities: filt(CAMP_UNIT_AMENITIES, u.amenities, 3), price: num(u.price, 0, 1000000), photos: urls(u.photos) };
  });
  const photoGroups = raw.photoGroups && typeof raw.photoGroups === "object" ? raw.photoGroups : {};
  return {
    v: 2,
    seasonality: raw.seasonality === "sezonier" ? "sezonier" : "permanent",
    certificate: typeof raw.certificate === "string" ? raw.certificate.trim().slice(0, 60) : "",
    tents: tentsOn ? { on: true, count: tentCount, shade: pick(CAMP_SHADE, t.shade), price: tentPrice, power: t.power === "da" || t.power === "nu" ? t.power : "" } : { on: false, count: null, shade: "", price: null, power: "" },
    caravans: carOn ? { on: true, count: carCount, price: carPrice, priceFull: num(c.priceFull, 0, 100000), electric: c.electric === true, water: c.water === true, sewer: c.sewer === true } : { on: false, count: null, price: null, priceFull: null, electric: false, water: false, sewer: false },
    units,
    fees: { adult: num(f.adult, 0, 100000), child: num(f.child, 0, 100000), car: num(f.car, 0, 100000), electric: num(f.electric, 0, 100000), pet: num(f.pet, 0, 100000) },
    facilities: Array.isArray(raw.facilities) ? raw.facilities.filter((k) => CAMP_FACILITIES[k]).slice(0, 20) : [],
    pets: pick(HOTEL_PETS, raw.pets),
    quiet: pick(HOTEL_QUIET, raw.quiet),
    vehicles: pick(CAMP_VEHICLES, raw.vehicles),
    photoGroups: { free: urls(photoGroups.free), sanitary: urls(photoGroups.sanitary), common: urls(photoGroups.common) },
  };
}

// INSERT anunț, cu legătura către propunere (dacă coloana există deja în baza de date)
async function insertListingWithOptionalSource(table, fields) {
  const run = async (f) => {
    const cols = Object.keys(f);
    await dbPool.query(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")})`, cols.map((c) => f[c]));
  };
  try { await run(fields); }
  catch (e) {
    if (e && e.code === "42703" && "source_proposal_id" in fields) { const f2 = { ...fields }; delete f2.source_proposal_id; await run(f2); }
    else throw e;
  }
}


function getClaimCookieId(req) {
  const v = parseCookies(req).claimPlace;
  return v && /^\d{1,9}$/.test(v) ? Number(v) : null;
}



// Click pe WhatsApp la cazare — keepalive, exact înainte să se deschidă
// conversația; un eșec aici nu trebuie NICIODATĂ să blocheze utilizatorul
// din a trimite mesajul.
// Butonul „Afișează telefonul” la restaurant / obiectiv: numărul nu e în
// pagină, doar la apăsare; contorizăm vizualizarea (dacă există coloana).
async function revealVenuePhone(table, req, res) {
  if (!dbPool || !/^\d+$/.test(req.params.id)) { res.status(404).json({ error: "not_found" }); return; }
  try {
    let rows;
    try {
      ({ rows } = await dbPool.query(`UPDATE ${table} SET phone_views = phone_views + 1 WHERE id = $1 AND status = 'approved' RETURNING contact_phone`, [req.params.id]));
    } catch (colErr) {
      if (colErr && colErr.code === "42703") {
        ({ rows } = await dbPool.query(`SELECT contact_phone FROM ${table} WHERE id = $1 AND status = 'approved'`, [req.params.id]));
      } else { throw colErr; }
    }
    if (!rows.length || !rows[0].contact_phone) { res.status(404).json({ error: "not_found" }); return; }
    res.status(200).json({ phone: rows[0].contact_phone });
  } catch (err) { res.status(500).json({ error: "server_error" }); }
}

function localSearchAllowed(ip) {
  const now = Date.now();
  const arr = (LOCAL_SEARCH_HITS.get(ip) || []).filter((t) => now - t < 60000);
  if (arr.length >= 90) { LOCAL_SEARCH_HITS.set(ip, arr); return false; }
  arr.push(now); LOCAL_SEARCH_HITS.set(ip, arr);
  if (LOCAL_SEARCH_HITS.size > 5000) LOCAL_SEARCH_HITS.clear();
  return true;
}

function generateProspectRefCode() {
  return crypto.randomBytes(6).toString("hex");
}

// Marchează prospectul ca „înscris” când cineva venit prin linkul lui
// personal își face cont sau trimite o înscriere. Nu blochează niciodată
// răspunsul — orice eroare e doar logată.
function markProspectConverted(req) {
  try {
    if (!dbPool) return;
    const ref = parseCookies(req).prospectRef;
    if (!ref || !/^[a-f0-9]{12}$/.test(ref)) return;
    dbPool.query(
      `UPDATE prospects SET status = 'inscris', converted_at = COALESCE(converted_at, now()), actualizat_la = now() WHERE ref_code = $1 AND status <> 'inscris'`,
      [ref]
    ).catch((e) => console.error("markProspectConverted:", e.message));
  } catch (e) { /* niciodată nu stricăm înscrierea din cauza asta */ }
}

async function getProspectTemplates() {
  const out = JSON.parse(JSON.stringify(PROSPECT_DEFAULT_TEMPLATES));
  if (!dbPool) return out;
  try {
    const { rows } = await dbPool.query(`SELECT key, value FROM accommodation_settings WHERE key LIKE 'prospect_tpl_%'`);
    rows.forEach((r) => {
      const m = /^prospect_tpl_(cazare|restaurant|obiectiv)_(subject|body)$/.exec(r.key);
      if (m && typeof r.value === "string") out[m[1]][m[2]] = r.value;
    });
  } catch (e) { /* rămân textele implicite */ }
  return out;
}


function prospectRowForClient(r) {
  return {
    id: r.id, name: r.name, type: r.type || "", otherType: r.other_type || "", city: r.city || "", county: r.county || "", email: r.email || "", phone: r.phone || "",
    status: PROSPECT_STATUSES[r.status] ? r.status : "necontactat", notes: r.notes || "", ref: r.ref_code,
    lastContact: r.last_contact_at ? new Date(r.last_contact_at).toLocaleDateString("ro-RO") : "",
    contactCount: r.contact_count || 0, hasAccount: false,
  };
}

function buildPropertyCountryModalHtml(lang) {
  const en = lang === "en";
  const options = Object.keys(COUNTRY_NAMES_RO).filter((c) => c !== "ro")
    .sort((a, b) => (en ? COUNTRY_NAMES_EN : COUNTRY_NAMES_RO)[a].localeCompare((en ? COUNTRY_NAMES_EN : COUNTRY_NAMES_RO)[b]))
    .map((c) => `<option value="${c}">${escapeHtml(en ? COUNTRY_NAMES_EN[c] : COUNTRY_NAMES_RO[c])}</option>`).join("");
  return `
<style>
.pcm-backdrop{position:fixed;inset:0;background:rgba(8,10,20,.72);z-index:1500;display:none;align-items:center;justify-content:center;padding:16px;}
.pcm-backdrop.is-open{display:flex;}
.pcm-box{background:#fff;color:#111;border-radius:16px;max-width:440px;width:100%;padding:22px 20px;box-shadow:0 20px 50px rgba(0,0,0,.35);max-height:90vh;overflow-y:auto;}
.pcm-box h2{font-size:19px;margin:0 0 4px;line-height:1.3;}
.pcm-en{display:none;}.pcm-box h2{margin-bottom:14px !important;}
.pcm-box label{display:block;font-weight:700;font-size:14px;margin:12px 0 6px;}
.pcm-box select,.pcm-box input[type=email]{width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:2px solid #F0813A;font-size:16px;background:#fff;color:#111;}
.pcm-primary{display:block;width:100%;margin-top:16px;background:#F0813A;color:#fff;font-weight:800;font-size:15.5px;border:none;border-radius:10px;padding:14px;cursor:pointer;}
.pcm-secondary{display:block;width:100%;margin-top:8px;background:none;border:none;color:#667;font-size:14px;cursor:pointer;padding:8px;}
.pcm-note{background:#FFF4EC;border:1px solid #F0813A;border-radius:10px;padding:12px;font-size:14px;line-height:1.45;margin:6px 0 4px;}
.pcm-consent{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:#444;margin-top:12px;font-weight:400 !important;}
.pcm-consent input{margin-top:3px;flex:0 0 auto;width:18px;height:18px;accent-color:#F0813A;}
.pcm-err{color:#c62828;font-size:13.5px;margin-top:8px;min-height:1em;}
.pcm-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;}
</style>
<div class="pcm-backdrop" id="pcmBackdrop" role="dialog" aria-modal="true" aria-labelledby="pcmTitle">
  <div class="pcm-box">
    <div id="pcmStep1">
      <h2 id="pcmTitle">${en ? "Where is your property located?" : "Unde se află proprietatea?"}</h2>
      <p class="pcm-en">${en ? "Unde se află proprietatea?" : "Where is your property located?"}</p>
      <label><input type="radio" name="pcmWhere" value="ro" checked> 🇷🇴 ${en ? "Romania" : "România"}</label>
      <label><input type="radio" name="pcmWhere" value="other"> 🌍 ${en ? "Another country" : "Altă țară"}</label>
      <button type="button" class="pcm-primary" id="pcmContinue">${en ? "Continue" : "Continuă"}</button>
      <button type="button" class="pcm-secondary" id="pcmCancel">${en ? "Cancel" : "Renunță"}</button>
    </div>
    <div id="pcmStep2" hidden>
      <h2>${en ? "Currently available in Romania only" : "Momentan doar în România"}</h2>
      <p class="pcm-en">${en ? "Momentan doar în România" : "Currently available in Romania only"}</p>
      <div class="pcm-note">${en ? "Listings are currently open only for properties in Romania. We're launching in more countries soon — leave your email and you'll be the first to know." : "Deocamdată înscrierile sunt deschise doar pentru proprietăți din România. Lansăm în curând și în alte țări — lasă-ne emailul și te anunțăm primul."}</div>
      <label for="pcmCountry">${en ? "Country" : "Țara"}</label>
      <select id="pcmCountry">${options}<option value="altul">${en ? "Other country" : "Altă țară"}</option></select>
      <label for="pcmType">${en ? "Business type" : "Tipul afacerii"}</label>
      <select id="pcmType">${Object.keys(WAITLIST_BUSINESS_TYPES).map((k) => `<option value="${k}">${escapeHtml(WAITLIST_BUSINESS_TYPES[k].split(" / ")[en ? WAITLIST_BUSINESS_TYPES[k].split(" / ").length - 1 : 0])}</option>`).join("")}</select>
      <label for="pcmEmail">Email</label>
      <input type="email" id="pcmEmail" maxlength="200" autocomplete="email" placeholder="${en ? "name@example.com" : "nume@exemplu.com"}">
      <div class="pcm-hp" aria-hidden="true"><input type="text" id="pcmWebsite" tabindex="-1" autocomplete="off"></div>
      <label class="pcm-consent"><input type="checkbox" id="pcmConsent"> <span>${en ? "I agree to be contacted by email when listings open in my country." : "Sunt de acord să fiu contactat(ă) prin email când înscrierile se deschid în țara mea."}</span></label>
      <div class="pcm-err" id="pcmErr"></div>
      <button type="button" class="pcm-primary" id="pcmSubmit">${en ? "Notify me" : "Anunțați-mă"}</button>
      <button type="button" class="pcm-secondary" id="pcmBack">← ${en ? "Back" : "Înapoi"}</button>
    </div>
    <div id="pcmStep3" hidden>
      <h2>${en ? "✓ Thank you!" : "✓ Mulțumim!"}</h2>
      <p class="pcm-en">${en ? "Mulțumim!" : "Thank you!"}</p>
      <div class="pcm-note">${en ? "We'll email you as soon as listings open in your country." : "Te anunțăm pe email imediat ce înscrierile se deschid în țara ta."}</div>
      <button type="button" class="pcm-primary" id="pcmClose">${en ? "Close" : "Închide"}</button>
    </div>
  </div>
</div>`;
}

function buildPropertyCountryModalScript(lang) {
  const en = lang === "en";
  return `
(function(){
  var cta = document.getElementById("accSignupCta");
  var bd = document.getElementById("pcmBackdrop");
  if (!cta || !bd) return;
  var KEY = "propertyCountry";
  function stored(){ try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function remember(v){ try { localStorage.setItem(KEY, v); } catch (e) {} }
  function step(n){ ["pcmStep1", "pcmStep2", "pcmStep3"].forEach(function(id, i){ document.getElementById(id).hidden = (i + 1) !== n; }); }
  function open(){ step(1); bd.classList.add("is-open"); }
  function close(){ bd.classList.remove("is-open"); }
  var pendingHref = null;
  cta.addEventListener("click", function(e){
    if (stored() === "ro") return; // a răspuns deja „România” pe acest dispozitiv
    e.preventDefault();
    pendingHref = cta.getAttribute("href");
    var active = document.querySelector(".acc-type-pill.is-active");
    var dest = active ? active.getAttribute("data-dest") : "cazare";
    var line = active ? (active.textContent || "").toLowerCase() : "";
    var typeSel = document.getElementById("pcmType");
    typeSel.value = dest === "restaurant" ? (line.indexOf("cafe") !== -1 ? "cafenea" : (line.indexOf("pub") !== -1 ? "pub" : "restaurant")) : "cazare";
    open();
  });
  document.getElementById("pcmCancel").addEventListener("click", close);
  document.getElementById("pcmClose").addEventListener("click", close);
  document.getElementById("pcmBack").addEventListener("click", function(){ step(1); });
  bd.addEventListener("click", function(e){ if (e.target === bd) close(); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") close(); });
  document.getElementById("pcmContinue").addEventListener("click", function(){
    var where = document.querySelector("input[name=pcmWhere]:checked");
    if (where && where.value === "ro") { remember("ro"); window.location.href = pendingHref || cta.getAttribute("href"); return; }
    document.getElementById("pcmErr").textContent = "";
    step(2);
  });
  document.getElementById("pcmSubmit").addEventListener("click", function(){
    var err = document.getElementById("pcmErr");
    var email = (document.getElementById("pcmEmail").value || "").trim();
    if (!email || email.indexOf("@") < 1 || email.lastIndexOf(".") < email.indexOf("@")) { err.textContent = "${en ? "Please enter a valid email." : "Introdu un email valid."}"; return; }
    if (!document.getElementById("pcmConsent").checked) { err.textContent = "${en ? "Please tick the consent box." : "Bifează acordul de mai sus."}"; return; }
    var btn = this; btn.disabled = true;
    fetch("/api/lista-asteptare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      email: email, country: document.getElementById("pcmCountry").value, businessType: document.getElementById("pcmType").value,
      consent: true, website: document.getElementById("pcmWebsite").value, lang: (navigator.language || "").slice(0, 2)
    }) }).then(function(r){ return r.json().then(function(d){ return { ok: r.ok, d: d }; }); }).then(function(res){
      btn.disabled = false;
      if (res.ok) { step(3); return; }
      err.textContent = res.d && res.d.error === "rate_limited" ? "${en ? "Too many attempts, please try again later." : "Prea multe încercări, mai încearcă peste puțin timp."}" : "${en ? "Could not save, please try again." : "Nu am putut salva. Încearcă din nou."}";
    }).catch(function(){ btn.disabled = false; err.textContent = "${en ? "Connection error." : "Eroare de conexiune."}"; });
  });
})();`;
}


// normalizează un nume de județ/oraș pentru comparare (fără diacritice, minuscule)
function normalizeJudetInput(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}


// găsește județul unui input scris de utilizator — încearcă întâi potrivire
// directă cu un județ, apoi cu o localitate cunoscută din lista de obiective
function detecteazaJudet(orasInput) {
  const norm = normalizeJudetInput(orasInput);
  if (!norm) return null;
  if (ALL_JUDETE_NORMALIZED[norm]) return ALL_JUDETE_NORMALIZED[norm];
  if (LOCALITATE_TO_JUDET[norm]) return LOCALITATE_TO_JUDET[norm];
  // potrivire parțială — "cluj" găsește "Cluj-Napoca" dacă apare ca localitate
  const partialLocalitate = Object.keys(LOCALITATE_TO_JUDET).find((k) => k.includes(norm) || norm.includes(k));
  if (partialLocalitate) return LOCALITATE_TO_JUDET[partialLocalitate];
  const partialJudet = Object.keys(ALL_JUDETE_NORMALIZED).find((k) => k.includes(norm) || norm.includes(k));
  if (partialJudet) return ALL_JUDETE_NORMALIZED[partialJudet];
  return null;
}

function filtreazaObiectivePentruOras(orasInput) {
  const judetPrincipal = detecteazaJudet(orasInput);
  if (!judetPrincipal) return { judet: null, obiective: [] };

  const dejaAdaugate = new Set();
  const rezultat = [];
  function adauga(judet) {
    OBIECTIVE_ITINERAR.forEach((o) => {
      if (o.judet === judet && !dejaAdaugate.has(o.nume)) {
        dejaAdaugate.add(o.nume);
        rezultat.push(o);
      }
    });
  }

  adauga(judetPrincipal);
  if (rezultat.length < MIN_OBIECTIVE_UTILE) {
    const vecini = JUDET_NEIGHBORS[judetPrincipal] || [];
    for (const v of vecini) {
      if (rezultat.length >= MAX_OBIECTIVE_PROMPT) break;
      adauga(v);
    }
  }

  return { judet: judetPrincipal, obiective: rezultat.slice(0, MAX_OBIECTIVE_PROMPT) };
}

function filtreazaObiectivePentruOrasIntl(countryCode, orasInput) {
  const lista = ATTRACTIONS[countryCode];
  if (!lista || !lista.length) return { obiective: [], gasitExactInOras: false };

  const normOras = normalizeJudetInput(orasInput);
  const potrivite = lista.filter((a) => normalizeJudetInput(a.name).includes(normOras));

  if (potrivite.length >= MIN_OBIECTIVE_UTILE_INTL) {
    return { obiective: potrivite.slice(0, MAX_OBIECTIVE_PROMPT), gasitExactInOras: true };
  }
  // prea puține potriviri directe — trimitem restul obiectivelor țării,
  // punând mai întâi cele deja potrivite (dacă există), completate cu
  // restul, plafonat la MAX_OBIECTIVE_PROMPT
  const restul = lista.filter((a) => !potrivite.includes(a));
  const combinat = potrivite.concat(restul).slice(0, MAX_OBIECTIVE_PROMPT);
  return { obiective: combinat, gasitExactInOras: potrivite.length > 0 };
}


// REZOLVARE UNIVERSALĂ oraș -> țară — schimbare cerută explicit: itinerarul
// nu mai trebuie legat de "pe ce pagină de țară ești" — un român din
// România care mâine pleacă la Paris trebuie să poată tasta "Lyon" din
// ORICE loc de pe site (pagina principală, orice țară) și să primească
// direct itinerarul pentru Lyon, fără să navigheze întâi la pagina Franței.
//
// Strategie, în ordinea încrederii (cea mai sigură întâi):
//  1. România întâi — verificăm SITEMAP_CITIES + județe (logica deja
//     existentă, cu vecini de județ etc.) — cea mai bogată sursă de date.
//  2. Restul țărilor — potrivire EXACTĂ pe COUNTRIES[cc].cities (lista
//     "oficială" de orașe urmărite a fiecărei țări) — cea mai de încredere
//     sursă pentru restul țărilor, verificată manual la fiecare extindere.
//  3. Potrivire PARȚIALĂ pe COUNTRIES[cc].cities (substring, în ambele
//     sensuri) — acoperă variații de scriere (ex. "Muenchen" vs "München").
//  4. Ultimă variantă — orașul apare ca substring în vreun NUME de obiectiv,
//     în orice țară (gasitExactInOras din filtreazaObiectivePentruOrasIntl)
//     — mai slab, dar mai bine decât un eșec complet.
// Dacă nicio țară nu se potrivește la niciun pas, întoarce null — apelantul
// arată un mesaj de eroare general, NU mai specific unei singure țări.
// Capitalizează corect fiecare cuvânt dintr-un nume de oraș (ex. "paris" ->
// "Paris", "sfantu gheorghe" -> "Sfantu Gheorghe") — folosit ca ultimă
// soluție, DOAR quando nu găsim orașul exact în propriile liste (RO, sau
// potrivire doar după numele unui obiectiv) — quando ÎL găsim într-o listă
// de orașe cunoscută (COUNTRIES[cc].cities), folosim direct forma aceea,
// deja corect scrisă acolo (cu diacritice corecte), nu o presupunem.
function toTitleCase(s) {
  return s.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}


// Prioritizează obiectivele de tip "parc de agrement" — DOAR pentru modul
// "familie" (cerut explicit) — funcționează pe baza câmpului `category`
// deja existent pe toate obiectivele din cele 6 țări procesate riguros, nu
// hardcodează "Disneyland" sau alt nume anume — orice parc din baza noastră
// (Gardaland, PortAventura, Walibi etc.) beneficiază automat, la fel.
// Sortare stabilă (Array#sort e stabilă în JS modern) — nu amestecă restul
// ordinii, doar mută parcurile la început.
//
// Întoarce și `parcGasit` — numele PRIMULUI parc găsit (dacă există), ca să
// putem oferi automat un link de bilete (GetYourGuide) pentru el, fără să
// mai căutăm o a doua oară aceeași informație.
function boostParcuriAgrement(items, getCategory, getName, activ) {
  if (!activ) return { sorted: items, parcGasit: null };
  const sorted = items.slice().sort((a, b) => {
    const aPark = getCategory(a) === "parcuri_agrement" ? 0 : 1;
    const bPark = getCategory(b) === "parcuri_agrement" ? 0 : 1;
    return aPark - bPark;
  });
  const gasit = sorted.find((item) => getCategory(item) === "parcuri_agrement");
  return { sorted, parcGasit: gasit ? getName(gasit) : null };
}


function buildCityByNameMap(items, nameFn, cityFn) {
  const map = {};
  for (const item of items) {
    const name = nameFn(item);
    const city = cityFn(item);
    if (name && city) map[name] = city;
  }
  return map;
}


// promptul trimis către OpenAI — cerem explicit format JSON, structură fixă,
// ca frontend-ul să poată randa direct, fără parsare fragilă de text liber.
// GENERALIZAT pentru orice țară: countryCode + numeTara (română, pt. AI) +
// obiective ca listă de STRINGURI simple (nume complet, eventual cu oraș
// inclus în text) — la RO includem explicit "(localitate)", la restul
// țărilor numele obiectivului conține deja orașul în multe cazuri (vezi
// filtreazaObiectivePentruOrasIntl), deci NU mai forțăm un format anume.
function buildItineraryPrompt(oras, zile, obiective, lang, numeTara, tipCalatorie, vibe, buget, rainForecast) {
  // Pentru plaje (avem deja descrieri reale, verificate, pentru 189 dintre
  // ele) — atașăm un scurt extras din descrierea existentă, ca AI-ul să
  // poată menționa natural tipul de nisip, intrarea în apă, aglomerația
  // etc., fără să inventeze nimic — folosește DOAR ce chiar scrie deja la
  // noi. Cerut explicit, ca prim pas din personalizarea pentru plaje.
  const beachSource = lang === "ro" ? BEACH_CONTENT_DATA : BEACH_CONTENT_UK;
  const listaText = obiective.map((o) => {
    const beachInfo = beachSource && beachSource[o];
    if (beachInfo && beachInfo.scurt) {
      const extras = beachInfo.scurt.slice(0, 220).replace(/\s+\S*$/, "").trim();
      return `- ${o} (detalii reale despre plajă: ${extras}…)`;
    }
    return `- ${o}`;
  }).join("\n");
  const langName = itineraryLabelsFor(lang).aiLangName;
  const tara = numeTara || "România";
  // Instrucțiune suplimentară, DOAR pentru modul "familie" — cerut explicit:
  // dacă în lista de mai jos există parcuri de agrement (deja prioritizate,
  // puse la începutul listei, de resolveCityToCountry), AI-ul trebuie să le
  // includă explicit, nu doar să le "vadă" pasiv în listă.
  const familyInstruction = tipCalatorie === "family"
    ? `\nATENȚIE: acest itinerar e pentru o FAMILIE CU COPII. Dacă în lista de mai jos există parcuri de distracții/agrement, zoo-uri sau acvarii, include-le OBLIGATORIU în itinerar, cât mai devreme posibil (nu le ignora) — sunt cele mai potrivite obiective pentru copii. Preferă și restul obiectivelor mai puțin solicitante fizic/vizual pentru copii, unde ai de ales.\n`
    : "";
  // Instrucțiuni pentru restul componenței grupului — cerut explicit,
  // extindere a hiper-personalizării. "couple" nu are nevoie de instrucțiune
  // separată (AI-ul deja înțelege contextul din cerere) — doar solo/friends
  // au un ton clar diferit, care merită subliniat.
  const soloInstruction = tipCalatorie === "solo"
    ? `\nAcest itinerar e pentru O SINGURĂ PERSOANĂ, care călătorește singură — poți menționa pe scurt, unde are sens, alternative flexibile de ritm, fără nevoia de a coordona cu altcineva.\n`
    : "";
  const friendsInstruction = tipCalatorie === "friends"
    ? `\nAcest itinerar e pentru UN GRUP DE PRIETENI — preferă, unde ai de ales între obiective similare, cele cu atmosferă mai socială, potrivite pentru un grup, nu neapărat romantice sau foarte liniștite.\n`
    : "";
  // "Vibe" / starea de spirit — cerut explicit, hiper-personalizare.
  // Influențează ritmul (câte opriri pe zi) și tonul descrierilor, NU
  // filtrează care obiective apar (baza noastră de date nu are etichete de
  // "vibe" per obiectiv) — onest, nu promitem mai mult decât putem oferi.
  const VIBE_INSTRUCTIONS = {
    relaxed: `\nRitmul cerut e RELAXAT, ÎN PAS LEJER — nu înghesui prea multe obiective într-o zi (maxim 2-3 opriri principale pe zi), lasă timp de respirat între ele, preferă obiective care nu cer efort fizic mare.\n`,
    adventurous: `\nRitmul cerut e AVENTUROS, ACTIV — poți propune mai multe opriri pe zi, un ritm mai alert, și preferă, unde ai de ales între obiective similare, pe cele cu caracter mai dinamic sau în aer liber.\n`,
    photogenic: `\nAccentul cerut e pe locuri SPECTACULOASE VIZUAL, bune de fotografiat — unde ai de ales între obiective similare, preferă-le pe cele cu priveliști sau arhitectură deosebite, și menționează pe scurt, în descriere, ce anume le face spectaculoase vizual.\n`,
  };
  const vibeInstruction = VIBE_INSTRUCTIONS[vibe] || "";
  // Buget — cerut explicit. La fel ca la "vibe", influențează TONUL
  // descrierilor, nu selecția (nu avem prețuri per obiectiv în baza de
  // date).
  const BUDGET_INSTRUCTIONS = {
    backpacker: `\nBugetul e restrâns (tip backpacker deștept) — în descrieri, ține un ton simplu, autentic, fără accent pe lux.\n`,
    mid: `\nBugetul e mediu — descrieri echilibrate, fără accent pe lux sau pe austeritate.\n`,
    luxury: `\nBugetul e generos (lux discret) — în descrieri, poți folosi un ton mai rafinat, cu accent pe calitate și confort, fără să fie ostentativ.\n`,
  };
  const budgetInstruction = BUDGET_INSTRUCTIONS[buget] || "";
  // "Plan de ploaie" — cerut explicit, DOAR pentru ziua 1 (mâine), singura
  // pentru care avem prognoză reală. Dacă ploaia e probabilă, cerem
  // explicit AI-ului să prefere, pentru ZIUA 1 exclusiv, obiective de
  // interior (muzee, castele cu interior, clădiri) — nu blocăm nimic,
  // doar o preferință clară, exact cum ar face un ghid local prevăzător.
  const rainInstruction = (rainForecast && rainForecast.rainLikely)
    ? `\nATENȚIE: pentru ZIUA 1 (mâine) e prognozată ploaie probabilă. Pentru ACEASTĂ zi doar, preferă obiective de interior (muzee, castele cu interior, clădiri, biserici) și evită obiective predominant în aer liber (plaje, parcuri, cetăți în ruină, trasee montane), dacă ai de ales din listă. Restul zilelor nu sunt afectate.\n`
    : "";
  // Modul "Beach Day" — CORECTAT explicit: NU mai propunem 3 plaje diferite
  // într-o zi (varianta veche, "Beach Hopper", încuraja exact asta — greșit,
  // nimeni nu merge la plajă ca să facă cross, ci ca să se relaxeze). Acum:
  // maxim 1 plajă principală pe zi (dimineață până seara), cu o singură
  // excepție posibilă — a doua plajă DOAR seara, DOAR dacă are o priveliște
  // clar mai bună pentru apus, niciodată o a treia.
  const beachHopperInstruction = tara === "Grecia"
    ? `\nDacă în lista de mai jos există obiective de tip plajă (numele lor conțin "Plaja" sau termeni echivalenți de plajă), o zi de plajă înseamnă RELAXARE, nu alergătură: alege O SINGURĂ plajă principală pentru toată ziua (dimineața, prânzul), pusă în "dimineata" sau "pranz" — nu împărți aceeași zi pe mai multe plaje diferite dimineața/prânzul. Poți propune o a DOUA plajă, diferită, DOAR pentru "seara", și DOAR dacă are explicit o priveliște mai bună pentru apus decât cea principală — altfel las-o tot pe cea principală și seara. NU propune niciodată 3 plaje diferite în aceeași zi. Menționează pe scurt, în descriere, de ce ai ales acel moment (ex. "loc bun pentru apus"). Dacă lista NU conține deloc plaje, ignoră complet această instrucțiune. Pentru plajele care au "(detalii reale despre plajă: ...)" atașat în lista de mai jos, FOLOSEȘTE acele detalii reale (tip de nisip, intrare în apă, aglomerație) în descrierea ta — nu inventa alte detalii, doar reformulează pe scurt ce scrie deja acolo.\n`
    : "";
  // Numele obiectivelor rămân exact cum apar (nume proprii de locuri, nu se
  // traduc) — DOAR descrierile și titlurile zilelor trebuie scrise în limba
  // cerută. Instrucțiunea de limbă e pusă explicit, de trei ori (la început,
  // la mijloc, la final) — modelele mici uneori "uită" instrucțiunea de
  // limbă dacă apare o singură dată la începutul unui prompt lung.
  return `Ești un ghid turistic expert în ${tara}. Scrie ÎN ${langName.toUpperCase()} un itinerar turistic pe ${zile} ${zile === 1 ? "zi" : "zile"}, pentru un vizitator care merge în zona ${oras} (${tara}). TOT textul (titluri, descrieri) trebuie să fie în ${langName}, DOAR numele obiectivelor rămân exact așa cum apar mai jos (sunt nume proprii, nu se traduc).
${familyInstruction}${soloInstruction}${friendsInstruction}${vibeInstruction}${budgetInstruction}${rainInstruction}${beachHopperInstruction}
Ai voie să folosești DOAR obiectivele din lista de mai jos — nu inventa altele, nu presupune obiective care nu apar aici. Dacă unele dintre ele nu sunt chiar în orașul ${oras}, ci în apropiere, foloseste-le pe cele mai apropiate geografic de ${oras} și organizează logic:
${listaText}

Organizează obiectivele pe zile: GRUPEAZĂ-LE geografic, pe localitate/zonă — obiectivele din aceeași localitate sau zonă apropiată trebuie puse ÎMPREUNĂ, în aceeași zi sau în zile consecutive, NICIODATĂ împrăștiate în zile diferite, neconsecutive (ex: greșit — cetatea din Localitatea A în ziua 1, altceva în Localitatea B în ziua 2, apoi mănăstirea tot din Localitatea A în ziua 3; corect — toate obiectivele din Localitatea A grupate în ziua 1, apoi treci definitiv la Localitatea B din ziua 2 înainte). REGULĂ STRICTĂ de distanță: NU propune NICIODATĂ un obiectiv la mai mult de 150 km de ${oras} — nimeni nu petrece o zi întreagă pe drum ca să vadă un singur obiectiv. Dacă nu ai destule obiective potrivite, apropiate, în lista de mai jos, e mult mai bine să incluzi mai puține (chiar și doar 1-2 pe zi) decât să umpli ziua cu ceva îndepărtat doar ca să pară completă. În interiorul unei zile, organizează și intervalele "dimineata", "pranz", "seara" logic din punct de vedere geografic (nu sări dintr-o parte a orașului în cealaltă și înapoi fără motiv). Nu toate intervalele trebuie neapărat completate — dacă nu ai un obiectiv potrivit pentru un interval, poți lăsa lista goală pentru acel interval.${beachHopperInstruction ? " Pentru intervalul \"seara\", dacă ziua respectivă e despre plajă, alege de preferință ceva din afara listei stricte de plaje, dacă are sens contextual — o zonă de promenadă, o zonă cu restaurante/taverne, sau un loc bun pentru apus, ca alternativă la a repeta tot plaja principală." : ""} Pentru fiecare obiectiv, scrie o descriere scurtă, atractivă, de maxim 2 propoziții, ÎN ${langName.toUpperCase()}.

FOARTE IMPORTANT: array-ul "zile" din JSON trebuie să conțină EXACT ${zile} ${zile === 1 ? "obiect" : "obiecte"} (câte unul pentru fiecare zi cerută — ziua 1${zile > 1 ? `, ziua 2${zile > 2 ? ", și așa mai departe până la ziua " + zile : ""}` : ""}). Exemplul de mai jos arată doar STRUCTURA unei singure zile, ca șablon — NU înseamnă că răspunsul tău trebuie să aibă o singură zi. Dacă am cerut ${zile} ${zile === 1 ? "zi" : "zile"}, array-ul "zile" trebuie să aibă ${zile === 1 ? "1 element" : `${zile} elemente, cu "ziua" numerotată de la 1 la ${zile}`}.

Răspunde STRICT în acest format JSON, fără text în afara JSON-ului. Cheile JSON (oras, zile, ziua, titlu, dimineata, pranz, seara, nume, descriere, distanta) rămân EXACT așa cum sunt aici, neschimbate — doar VALORILE pentru "titlu" și "descriere" trebuie scrise în ${langName}. Pentru "distanta", scrie distanța aproximativă (estimarea ta cea mai bună, în km, cu tot cu simbolul "~" care arată clar că e aproximativă) de la centrul localității ${oras} până la obiectivul respectiv — ex. "~5 km", "~20 km". Exemplul de mai jos arată o SINGURĂ zi, ca șablon de structură — repetă acest obiect în array de ${zile} ${zile === 1 ? "dată" : "ori"}, cu "ziua" numerotată corect:
{
  "oras": "${oras}",
  "zile": [
    {
      "ziua": 1,
      "titlu": "un titlu scurt și atractiv pentru ziua respectivă, în ${langName}",
      "dimineata": [{ "nume": "...", "descriere": "descriere în ${langName}", "distanta": "~5 km" }],
      "pranz": [{ "nume": "...", "descriere": "descriere în ${langName}", "distanta": "~5 km" }],
      "seara": [{ "nume": "...", "descriere": "descriere în ${langName}", "distanta": "~5 km" }]
    }
  ]
}

Nu uita: TOT textul generat de tine (titlu, descriere) trebuie să fie în ${langName}, nu în română, cu excepția cazului în care ${langName} chiar este română. Nu uita nici de cerința de mai sus: array-ul "zile" trebuie să aibă EXACT ${zile} ${zile === 1 ? "element" : "elemente"}, nu doar unul singur.`;
}

module.exports = { redirectLegacyRoPage, buildSubBackLinkScript, transferWidgetSrcFor, getAccommodationMonthlyPriceCents, getExchangeRates, toGoogleLang, getAttractionVoteCount, getBeachTagCounts, getReportCounts, isBotRequest, comingSoonTextFor, itineraryLabelsFor, buildBeachPartnerCarouselHtml, isRealRomanianHolidayToday, glovoLinkFor, bringoLinkFor, bookingSearchLinkFor, getExtraLabels, geoBtnLabelsFor, attractionFooterTextFor, noLiveDataTextFor, liveGoogleLabelFor, bookingPlanningLabelsFor, reportIssueLabelsFor, closedPermanentlyLabelsFor, reportedWrongTextFor, howToGetThereLabelsFor, contextualWidgetLabelsFor, travelGuidesBoxLabelsFor, buildBookingPlanningButtonsHtml, buildPlanVisitScript, restaurantsOpenNowLinkFor, wazeLinkFor, buildStoreMainHtml, contactInfoHtml, buildLocalBusinessSchema, buildCityFaqHtml, buildTouristAttractionSchema, buildReportIssueHtml, buildReportIssueScript, renderClosedPermanentlyHtml, reportedWrongBannerHtml, omioLinkFor, restaurantLinkFor, parkingLinkFor, carRentalLinkFor, buildHowToGetThereHtml, buildHowToGetThereScript, extractStatusEntity, noResultsItineraryLabelsFor, buildNoResultsItineraryPromoHtml, buildListStatusBadgeScript, mallCinemaLabelsFor, buildContextualWidgetHtml, buildContextualWidgetScript, b64url, ticketUrlFor, dedupeTrailingCityName, recommendedLabelFor, recommendedFirstLabelFor, beachesMegaCategoryLabelFor, discoverBeachLabelFor, beachReviewLabelsFor, beachContentLabelsFor, buildBeachContentIntroHtml, buildBeachContentEquipmentHtml, buildBeachContentRestHtml, buildBeachVoteCentralizationHtml, buildBeachVoteCentralizationScript, itineraryPromoLabelsFor, buildItineraryPromoCardHtml, greeceBeachPromoLabelsFor, buildGreeceBeachPromoCardHtml, buildCombinedTripPromoCardHtml, voteLabelsFor, beachTagLabelsFor, boatTourLabelFor, buildVoteWidgetHtml, buildVoteWidgetScript, normAttractionName, isFreeAccessAttraction, needsSeasonalWarning, freeAccessLabelFor, openOnlyStoreLabelFor, openOnlyAttractionLabelFor, openOnlyAttractionShortLabelFor, isMountainRoad, seasonalWarningLabelFor, genericScheduleForCategory, computeGenericIsOpenNow, isScheduleOpenAt, determineAttractionOpenStatus, liveComingSoonLabelFor, estimatedScheduleLabelFor, categoryLabelFor, loadingTextFor, buildStoreAffiliateButtonHtml, buildStoreAffiliateCarouselScript, buildGenericPartnerCarouselScript, buildGenericAffiliateCarouselHtml, buildLanguageSwitcher, buildLanguageSwitcherScript, inferCityForAttraction, storeCategoryLabelFor, getHost, isIntlHost, baseUrlFor, checkWeatherApiQuota, fetchTomorrowRainForecast, haversineKm, geocodeCityApprox, roCityAttractionsHref, localizeAttractionsHref, starsHtml, reviewThanksHtml, loadPlaceReviews, reviewDateText, reviewReplyBlockHtml, reviewReplyButtonHtml, buildPlaceReviewsSection, reviewsScriptHtml, ownerCanManageReview, proposalTypeLabel, escapeHtml, sanitizePublicUrl, buildCitySelectorHtml, safeJson, isOwnBlobUrl, fileMatchesDeclaredType, generateNonce, withNonce, buildCsp, buildClientScript, buildPushSubscribeScript, buildSmartInstallHtml, buildSmartInstallScript, buildTabsScript, buildAttractionAccordionScript, mapUnifiedToggleLabelFor, mapLoadingStoresLabelFor, mapLoadingAttractionsLabelFor, buildCityMapHtml, buildLiveMapPinsScript, buildLiveAttractionsMapPinsScript, buildAttractionListFilterScript, buildAttractionLazyScript, renderWeekTableRows, renderHolidayRows, adSlotHtml, buildThemeToggleHtml, backButtonLabelFor, submitPlaceDayName, submitPlaceLabelsFor, noMatchesLabelFor, renderSubmitPlacePage, buildGlobalBackButtonHtml, buildGlobalBackButtonScript, buildThemeToggleScript, buildBottomNavHtml, buildBottomNavScript, buildLiveStatusFetchScript, buildWidgetRevealScript, buildAffiliateClickTrackingScript, pageShell, navLabelsFor, flightSearchLabelFor, carRentalLabelFor, tripTypeLabelsFor, vibeLabelsFor, budgetLabelsFor, itineraryHrefFor, travelGuidesForLang, guidesPageLabelsFor, buildTravelGuidesBoxHtmlIntl, renderTravelGuidePageIntl, renderTravelGuidesIndexPageIntl, parseListingPhotos, buildLocalListingGroupHtml, findApprovedListingCityBySlug, slugifyCityName, KNOWN_CITY_SLUGS, decodeGeoHeader, generateSitemapXml, hashIp, getClientIp, hashPassword, verifyPassword, checkRateLimit, verifyTurnstile, parseCookies, signCookiePayload, verifyCookiePayload, appendSetCookie, accommodationGate, trackAccommodationDailyVisit, localDateStringForCounter, sendAccommodationLoginEmail, sendPhotoRequestEmail, sendOwnerNoticeEmail, sendAccommodationApprovalEmail, getAccommodationOwnerSession, setAccommodationOwnerSession, ownerStillExists, requireAccommodationOwner, requireAccommodationOwnerApi, getAdminSession, setAdminSession, requireAdminPage, requireAdminApi, accWhitePageStyles, getAccLang, accLangHref, accLangSwitchHtml, roNowParts, hhmmToMin, isOpenBetween, sqlDateStr, isAvailableTonight, todayLiveStatus, socialLinksHtml, ratingSymbolFor, classificationOptionLabels, classificationLabelText, classificationOptionsHtml, accWhiteLegalHtml, accDarkFooterHtml, accCurrencyModalHtml, accCurrencyScript, accShellStyles, accDrawerHtml, accDrawerScript, accShellHeader, adminShellStyles, adminMobileBarHtml, adminSidebarScript, restaurantGate, mapFor, renderAttractionListingForm, requireRestaurantOwner, requireRestaurantOwnerApi, renderRestaurantListingForm, handleAdminRequestPhotos, buildOwnerLiveStatusControls, blobUrlsStillReferenced, fetchListingRow, sanitizeProposalSchedule, loadOwnerFlagsById, adminOwnerBadgeHtml, adminMissingHtml, parseJsonArr, missingForRestaurant, missingForAttraction, sendRestaurantApprovalEmail, sendAttractionApprovalEmail, seoTypeWord, seoTruncate, stripDescriptionMarkers, buildDescriptionAiPrompt, bedTypeLabel, formatBedsPlain, sanitizeBedsObj, sanitizeRoomTypes, sanitizeExteriorInfo, exteriorInfoToText, stripLeadingEmoji, paIcon, ACCOMMODATION_AMENITIES_I18N, buildListingSeoHeadHtml, typeDetailsClientDef, sanitizeHotelDetails, sanitizePensionDetails, sanitizeCampingDetails, insertListingWithOptionalSource, getClaimCookieId, revealVenuePhone, localSearchAllowed, generateProspectRefCode, markProspectConverted, getProspectTemplates, prospectRowForClient, buildPropertyCountryModalHtml, buildPropertyCountryModalScript, normalizeJudetInput, detecteazaJudet, filtreazaObiectivePentruOras, filtreazaObiectivePentruOrasIntl, toTitleCase, boostParcuriAgrement, buildCityByNameMap, buildItineraryPrompt, sanitizeApartmentDetails };

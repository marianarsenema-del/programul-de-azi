/* ============================================================
   api/server.js — „Programul de Azi”
   Server Express, compatibil Vercel Serverless Functions.
   Rute:
     GET /:oras/:magazin   -> pagină cu status live pentru un magazin dintr-un oraș
     GET /:oras            -> pagină generală: listă de magazine pentru orașul respectiv
   ============================================================ */

const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const app = express();
app.use(express.json({ limit: "16kb" })); // necesar pentru rutele de abonare push (POST cu JSON în body)

// ============================================================
// CONSOLIDARE .ro -> .eu (Redirecționare 301 permanentă) — comutator
// central, DEZACTIVAT implicit. Când e pus pe true, TOATE paginile de pe
// programul-de-azi.ro redirecționează permanent (301) către echivalentul
// lor de pe opening-hours-today.eu/ro/... . AdSense scos complet din site
// (decizie separată, nemaifiind un blocaj), Travelpayouts confirmat pe
// ambele domenii — nu mai există motiv să amânăm.
//
// Excepții, care NU se redirecționează (rămân active pe .ro, chiar și cu
// comutatorul pornit): /api/*, fișierele tehnice (manifest, service worker,
// iconițe) și robots.txt/ads.txt/sitemap.xml — astea trebuie să rămână
// accesibile, ca Google/crawlerele să vadă corect tranziția, nu erori.
//
// Ghidurile sunt un caz SPECIAL — conținut complet diferit, în rute
// SEPARATE pe .eu (/guides/*, engleză, nu /ro/ghiduri/*, care nu există)
// — bug real, prins prin testare, înainte de activare, nu doar teoretic.
const RO_TO_EU_MIGRATION_ACTIVE = true;
const RO_TO_EU_MIGRATION_EXCLUDED_PREFIXES = ["/api/", "/manifest.json", "/sw.js", "/robots.txt", "/ads.txt", "/sitemap.xml", "/icon.svg", "/icon-512.png", "/itinerar", "/propune", "/admin"];
const RO_TO_EU_GUIDES_MAP = { "/ghiduri": "/guides", "/ghiduri/transport": "/guides/transport", "/ghiduri/parcari": "/guides/parking", "/ghiduri/restaurante": "/guides/restaurants" };
app.use((req, res, next) => {
  if (!RO_TO_EU_MIGRATION_ACTIVE || isIntlHost(req)) return next();
  if (RO_TO_EU_MIGRATION_EXCLUDED_PREFIXES.some((p) => req.path === p || req.path.startsWith(p))) return next();
  if (RO_TO_EU_GUIDES_MAP[req.path]) {
    return res.redirect(301, `https://${INTL_DOMAIN}${RO_TO_EU_GUIDES_MAP[req.path]}`);
  }
  const target = req.path === "/" ? `https://${INTL_DOMAIN}/` : `https://${INTL_DOMAIN}/ro${req.path}`;
  return res.redirect(301, target);
});

// Antete de securitate HTTP, aplicate O SINGURĂ DATĂ, pe toate răspunsurile —
// mai sigur decât să le repeți în fiecare rută (unde ar fi ușor să uiți una).
// CSP rămâne separat, per-rută, pentru că are nevoie de nonce unic per pagină.
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff"); // browserul nu "ghicește" tipul unui fișier, doar pe baza extensiei
  // Testul cu iframe s-a încheiat — Travelpayouts a confirmat cauza reală
  // (connect-src, nu iframe/frame-ancestors) — restaurăm protecția.
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin"); // nu trimitem URL-ul complet altor site-uri, la click pe linkuri externe
  res.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains"); // forțează HTTPS, chiar dacă cineva încearcă explicit http://
  res.set("Permissions-Policy", "geolocation=(self), camera=(), microphone=()"); // geolocația rămâne, restul dezactivat explicit
  next();
});

/* ============================================================
   0.05) STATUS LIVE (Google Places) — conexiune OPȚIONALĂ la baza de
   date. Dacă lipsește variabila de mediu (POSTGRES_URL/DATABASE_URL) sau
   baza pică, site-ul TOT funcționează — doar cade elegant pe orele fixe,
   deja verificate, care au funcționat până acum. Nicio pagină nu depinde
   STRICT de conexiunea asta ca să se afișeze.
   ============================================================ */
const DB_CONNECTION_STRING =
  process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || "";
// Cheie secretă pentru pagina de administrare (/admin/propuneri) — setează-o
// ca variabilă de mediu în Vercel (ADMIN_SECRET_KEY), NU o pune direct în
// cod. Fără ea setată, pagina rămâne complet inaccesibilă (fail-safe, nu
// fail-open) — mai sigur decât o parolă implicită ghicibilă.
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "";
const GOOGLE_PLACES_API_KEY_LIVE = process.env.GOOGLE_PLACES_API_KEY || "";
const dbPool = DB_CONNECTION_STRING
  ? new Pool({ connectionString: DB_CONNECTION_STRING, ssl: { rejectUnauthorized: false }, max: 3 })
  : null;
const { getLocationStatus } = dbPool ? require("../place-status-engine/getLocationStatus") : {};

// mapare limbă internă -> codul IETF pe care-l așteaptă Google — definită
// LOCAL, independent de conexiunea la bază, ca să nu crape apelurile care
// o folosesc chiar și atunci când baza de date nu e configurată deloc.
const INTERNAL_TO_GOOGLE_LANG = { ro: "ro", uk: "en", de: "de", es: "es", fr: "fr", it: "it", pl: "pl", nl: "nl", da: "da" };
function toGoogleLang(internalLangCode) {
  return INTERNAL_TO_GOOGLE_LANG[internalLangCode] || internalLangCode || "en";
}

// exact același algoritm de slug folosit la generarea insert_locatii.sql —
// TREBUIE să rămână identic, altfel căutarea în baza de date nu găsește
// nimic (slug-uri diferite pentru aceeași locație)
// exact același algoritm de slug folosit la generarea insert_locatii.sql —
// TREBUIE să rămână identic, altfel căutarea în baza de date nu găsește
// nimic (slug-uri diferite pentru aceeași locație)
function toDbSlug(str) {
  return normalizeSlug(str).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Caută un obiectiv turistic după slug, într-o anumită țară (sau în toate,
// dacă countryCode lipsește) — folosește ATTRACTIONS, definit mai jos în
// fișier; sigur de referit aici, pentru că funcția rulează abia la o
// cerere reală, mult după ce tot modulul s-a încărcat complet.
function findAttractionBySlug(slug, countryCode) {
  const codes = countryCode ? [countryCode] : Object.keys(ATTRACTIONS);
  for (const code of codes) {
    const list = ATTRACTIONS[code] || [];
    const found = list.find((a) => toDbSlug(a.name) === slug);
    if (found) return { attraction: found, countryCode: code };
  }
  return null;
}

// Convertește "periods" (formatul Google Places) în formatul nostru intern
// "weekly" (array de 7, index 0=Duminică...6=Sâmbătă) — ca să reutilizăm
// EXACT același sistem de afișare/JS live care funcționează deja pentru
// orele fixe, fără să-l rescriem. Simplificare onestă, semnalată: pentru
// perioade care trec peste miezul nopții, punem ora reală de deschidere,
// dar închiderea aproximată la 23:59 — cazul e rar la magazine/obiective
// turistice (frecvent doar la baruri/cluburi, care nu sunt tipul de
// locație pe care-l avem în sistem).
function googlePeriodsToWeekly(periods) {
  const weekly = [null, null, null, null, null, null, null];
  if (!Array.isArray(periods)) return weekly;
  periods.forEach((p) => {
    if (!p || !p.open || typeof p.open.day !== "number") return;
    const day = p.open.day;
    if (day < 0 || day > 6) return;
    if (!p.close) {
      // deschis non-stop, fără "close" — convenția Google pentru 24/7
      for (let d = 0; d < 7; d++) weekly[d] = { open: "00:00", close: "23:59" };
      return;
    }
    const openTime = `${p.open.time.slice(0, 2)}:${p.open.time.slice(2, 4)}`;
    const closeTime = `${p.close.time.slice(0, 2)}:${p.close.time.slice(2, 4)}`;
    if (p.close.day === p.open.day) {
      weekly[day] = { open: openTime, close: closeTime };
    } else {
      weekly[day] = { open: openTime, close: "23:59" }; // aproximare, vezi comentariul de mai sus
    }
  });
  return weekly;
}


// Caută statusul live pentru o locație (magazin SAU obiectiv turistic),
// după exact același slug generat la popularea bazei. Returnează `null`
// dacă nu există în bază, dacă place_id e unul din valorile "sentinel"
// (ZERO_RESULTS / ERROR_...), sau dacă orice altceva eșuează — apelantul
// TREBUIE să trateze `null` ca "nu am date live, folosește fallback-ul".
// Praguri pentru raportările comunitare — câte confirmări independente
// sunt nevoie înainte ca site-ul să AFIȘEZE efectiv concluzia, nu doar
// s-o rețină. 3 e un compromis rezonabil — suficient cât să nu schimbi
// statusul după o singură persoană greșită/rău-voitoare, dar nu atât de
// mare încât o problemă reală să rămână neafișată mult timp.
const REPORT_THRESHOLD = 3;

// Slug de DUPLICAT pentru propuneri de locuri noi — cerut explicit: dacă mai
// mulți utilizatori propun ACELAȘI loc (nume + oraș asemănătoare), nu se
// creează rânduri multiple în tabel, se incrementează un contor pe rândul
// deja existent. Mai permisiv decât toDbSlug (nu elimină TOATE spațiile,
// doar normalizează) — suficient pentru detectarea potrivirilor evidente,
// fără să fie atât de strict încât variații mici de scriere să scape
// nedetectate ca duplicate.
function submissionDuplicateSlug(name, city) {
  return normalizeSlug(`${name} ${city}`).replace(/\s+/g, " ").trim();
}

// Etichete comunitare pentru PLAJE — cerut explicit, ca turiștii să
// contribuie cu detalii pe care le caută (parcare, șezlonguri, acces) —
// prag mai mic decât la "Popular" (3, la fel ca la raportări) — informația
// asta e utilă chiar și cu puține confirmări, nu are rost s-o ținem tăcută
// mult timp ca la un vot general de popularitate.
const BEACH_TAG_THRESHOLD = 3;

// Grupuri EXCLUSIVE (o plajă are DOAR una din opțiuni — cea cu mai multe
// voturi câștigă, dacă a trecut pragul) — plus etichete DE SINE STĂTĂTOARE
// (afișate simplu dacă trec pragul, fără alternativă opusă).
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
  ITINERARY_COPY_UNIVERSAL,
} = require("./locales.js");
const {
  BEACH_TAG_GROUPS,
  BEACH_STANDALONE_TAGS,
  BEACH_ALL_TAGS,
  DISCOVERCARS_CITY_LINKS,
  GLOVO_COUNTRIES,
  FREE_ACCESS_PREFIXES,
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
  SITEMAP_CITIES,
  CITY_COORDS,
  OBIECTIVE_ITINERAR,
  JUDET_NEIGHBORS,
  CITY_ALIASES_RO,
} = require("./config-data.js");
;
;
;

// Prag pentru insigna "🔥 Popular" — cerut explicit: votul rămâne TĂCUT
// (fără nicio insignă vizibilă) sub acest prag, ca să nu arate site-ul
// "gol"/nefuncțional la trafic mic — apare organic doar când chiar s-au
// adunat destule voturi reale.
const VOTE_POPULAR_THRESHOLD = 10;

async function getAttractionVoteCount(slug) {
  if (!dbPool) return 0;
  try {
    const { rows } = await dbPool.query(`SELECT COUNT(*)::int AS cnt FROM attraction_votes WHERE slug = $1`, [slug]);
    return rows[0] ? rows[0].cnt : 0;
  } catch (err) {
    return 0; // tabela poate lipsi încă (nu s-a rulat SQL-ul de creare) — cădem elegant pe 0, nu crăpăm pagina
  }
}

// Citește etichetele CÂȘTIGĂTOARE pentru o plajă — pentru grupurile
// exclusive, doar cea cu mai multe voturi, dacă a trecut pragul; pentru
// cele de sine stătătoare, la fel, individual. Întoarce un array simplu de
// tag-uri de afișat (ex. ["access_car", "sunbeds_with_drink"]).
async function getBeachWinningTags(slug) {
  if (!dbPool) return [];
  try {
    const { rows } = await dbPool.query(
      `SELECT tag, COUNT(*)::int AS cnt FROM attraction_info_tags WHERE slug = $1 GROUP BY tag`,
      [slug]
    );
    const counts = {};
    rows.forEach((r) => { counts[r.tag] = r.cnt; });
    const winning = [];
    Object.values(BEACH_TAG_GROUPS).forEach((group) => {
      let best = null, bestCount = 0;
      group.forEach((tag) => {
        const c = counts[tag] || 0;
        if (c > bestCount) { best = tag; bestCount = c; }
      });
      if (best && bestCount >= BEACH_TAG_THRESHOLD) winning.push(best);
    });
    BEACH_STANDALONE_TAGS.forEach((tag) => {
      if ((counts[tag] || 0) >= BEACH_TAG_THRESHOLD) winning.push(tag);
    });
    return winning;
  } catch (err) {
    return []; // tabela poate lipsi încă — cădem elegant, nu crăpăm pagina
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

// Detectare bot/crawler — cerut explicit: fără asta, Googlebot (sau orice
// alt crawler) care indexează sistematic miile de pagini noi ar declanșa
// costuri REALE la Google Places, identic cu un vizitator uman. Crawlerele
// nu au nevoie de "e deschis chiar ACUM" — indexează conținut, nu ajută pe
// nimeni real să afle programul live în acel moment exact; le arătăm ce
// avem deja în cache (sau mesajul generic), fără nicio cerere nouă,
// niciodată. Listă rezonabilă de crawlere cunoscute, nu exhaustivă 100%,
// dar acoperă marea majoritate a traficului automatizat real.
const BOT_USER_AGENT_PATTERN = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|discordbot|linkedinbot|twitterbot|slackbot|pinterest|ahrefs|semrush|mj12bot|dotbot|petalbot|bytespider/i;
function isBotRequest(userAgent) {
  return Boolean(userAgent) && BOT_USER_AGENT_PATTERN.test(userAgent);
}

async function tryGetLiveStatus(slug, lang, tip, isBot, ip) {
  if (!dbPool || !GOOGLE_PLACES_API_KEY_LIVE) return null;
  try {
    const { rows } = await dbPool.query("SELECT place_id FROM locatii WHERE slug = $1 LIMIT 1", [slug]);
    if (!rows.length) return null;
    const placeId = rows[0].place_id;
    if (!placeId || placeId === "ZERO_RESULTS" || placeId.startsWith("ERROR_")) return null;
    // ttlHours — cerere explicită de reducere a costului: cache de 7 zile
    // (168h) pentru magazine, 30 de zile (720h) pentru obiective turistice
    // — programul unui magazin/obiectiv se schimbă rar, o valabilitate mai
    // lungă nu afectează practic acuratețea, dar reduce costul semnificativ.
    const ttlHours = tip === "attraction" ? 720 : 168;
    // checkFetchAllowed — protecție împotriva unui atac deliberat (cost
    // real, indus intenționat, cu user-agent normal, ocolind detectarea de
    // bot de mai sus) — 20 de cereri NOI (cache-miss) pe IP, la 10 minute.
    // Generos pentru un vizitator real, chiar și foarte activ (20 de
    // pagini noi diferite în 10 minute e mult peste ce navighează cineva
    // normal) — dar oprește ferm un script care ar lovi sute de pagini
    // necache-uite rapid, intenționat, ca să genereze cost.
    const checkFetchAllowed = ip
      ? () => checkRateLimit(hashIp(ip), "live-status-fresh-fetch", 20, 10)
      : undefined;
    return await getLocationStatus({ pool: dbPool, placeId, apiKey: GOOGLE_PLACES_API_KEY_LIVE, language: lang, ttlHours, cacheOnly: isBot, checkFetchAllowed });
  } catch (err) {
    console.error("tryGetLiveStatus a eșuat, cad pe fallback:", err.message);
    return null;
  }
}

/* ============================================================
   0) MONETIZARE — cod Google AdSense
   Lipește aici, între ghilimele, tot codul de anunț primit de la
   Google AdSense (de obicei un <script> + un <ins class="adsbygoogle">).
   Cât timp rămâne "" (gol), sloturile de reclamă din pagină sunt
   complet ascunse — nu se vede niciun chenar gol pentru vizitatori.
   ============================================================ */
const codAdSense = "";

// ID-ul de publisher AdSense (ex: "pub-1234567890123456") — folosit pentru
// generarea automată a /ads.txt. Completează-l după aprobare.
const adsensePublisherId = "ca-pub-7945793092031366";

// Comutator dedicat — decizie: fără AdSense pe site, "îngreunează fără
// beneficii mari" la stadiul actual de trafic. Dezactivat aici, dar
// adsensePublisherId RĂMÂNE completat (nu-l șterg), ca reactivarea să fie
// simplă, o singură linie, dacă te răzgândești vreodată. ads.txt rămâne
// funcțional (nu afectează performanța site-ului) — doar scriptul care
// chiar încarcă biblioteca Google (impactul real) e blocat mai jos.
const ADSENSE_ENABLED = false;

// Ghidurile de călătorie (transport, parcare, restaurante) folosesc linkuri
// de afiliere GetTransfer/Omio/ParkVia/TheFork/OpenTable — TOATE goale
// momentan (vezi constantele lor mai jos), deci cad pe site-uri publice,
// nemonetizate. Nu are sens să arătăm butoane peste tot pe site care nu
// aduc niciun venit — comutator central: cât timp rămâne false, oriunde
// ar fi apărut cele 3 butoane, arătăm un mesaj scurt "urmează în curând"
// în loc. Pune-l pe true (o singură linie) când ai completat măcar unul
// din linkurile de afiliere de mai jos.
const TRAVEL_GUIDES_MONETIZATION_READY = false;
;
function comingSoonTextFor(lang) {
  return COMING_SOON_TEXTS[lang] || COMING_SOON_TEXTS.uk;
}

// Traducerile paginii de itinerar (formular, butoane, mesaje) — brand-ul
// și link-ul de ghiduri NU depind de limbă, depind de DOMENIU (vezi
// isIntlDomain mai jos, în renderItineraryPage) — pe .eu rămâne mereu
// "OpeningHoursToday", indiferent ce limbă alege cineva, exact ca la
// restul paginilor de pe site.
;
function itineraryLabelsFor(lang) {
  return ITINERARY_LABELS[lang] || ITINERARY_LABELS.uk;
}

// Google Analytics (GA4) — codul exact primit, păstrat ca atare. La randare,
// nonce-ul curent se injectează automat pe <script>-ul inline de mai jos (vezi
// withNonce mai jos) — altfel CSP-ul strict (fără unsafe-inline) l-ar bloca.
const codAnalytics = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-04RLHKC4K8"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-04RLHKC4K8');
</script>`;

/* ============================================================
   0.6) LINK-URI DE AFILIERE — un singur link general per brand,
   valabil în toată țara (nu per oraș). Când o variabilă e goală (""),
   butonul corespunzător nu apare deloc — fără spații goale pe pagină.
   Completează-le direct aici, în cod, când primești aprobările.
   ============================================================ */
const linkEmagMall = ""; // profitshare.ro a respins colaborarea — gol, deliberat, până punem altceva; butonul dispare automat când e gol
const linkCatalogLidl = ""; // O lăsăm goală momentan, o vei adăuga tu din mers când ai aprobarea
const linkCatalogKaufland = ""; // O lăsăm goală momentan, o vei adăuga tu din mers când ai aprobarea
// link Amazon Affiliate — folosit DOAR pe paginile internaționale (DE/UK/ES),
// afișat sub cardul de status pe pagina de magazin. Pe RO, malls rămân cu butonul eMAG.
const linkAmazonAffiliate = "https://amzn.to/4wDIiop";
// link general de bilete turistice (ex: GetYourGuide) — un singur link pentru
// toate atracțiile, până când ai link-uri individuale per obiectiv. Rămâne
// gol până îl completezi tu direct pe GitHub — fără el, butonul nu apare deloc.
const linkBileteTurism = "https://getyourguide.com?partner_id=LM6J21N&utm_medium=online_publisher";

// PLACEHOLDER de monetizare pentru pagina de plajă — cerut explicit, locul
// unde apărea căutarea de magazine (n-are sens la o plajă). Link neutru
// deocamdată — actualizează BEACH_MONETIZATION_URL când ai un afiliat ales.
// Etichetele traduse (BEACH_MONETIZATION_LABELS) pot rămâne, doar link-ul
// trebuie schimbat.
const BEACH_MONETIZATION_URL = "https://www.discovercars.com/?a_aid=23ea55cb";
;
function beachMonetizationLabelFor(lang) { return BEACH_MONETIZATION_LABELS[lang] || BEACH_MONETIZATION_LABELS.uk; }
// Fără link deocamdată — cerut explicit: ideea (bannerul) rămâne, dar
// Discover Cars nu are sens aici (nu vinde echipament de plajă). Rămâne
// un <div>, nu <a>, până vine textul/link-ul real de la tine.
function buildBeachMonetizationHtml(lang) {
  return `<div class="beach-monetization-banner">${escapeHtml(beachMonetizationLabelFor(lang))}</div>`;
}

// URL-uri REALE, individuale, de pe GetYourGuide, per obiectiv turistic —
// cheia e EXACT numele din ATTRACTIONS (a.name). Goale la început, se
// completează treptat, pe măsură ce se confirmă URL-uri reale (nu
// inventate — un link greșit e mai rău decât fallback-ul general).
// Pentru cele care NU au o intrare aici, butonul de bilete cade automat
// pe `linkBileteTurism` (link general), exact ca până acum.
const ATTRACTION_TICKET_URLS = {
  "Castelul Bran": "https://www.getyourguide.com/bran-castle-l1572/",
  "Castelul Peleș": "https://www.getyourguide.com/peles-castle-l1571/",
  "Palatul Parlamentului": "https://www.getyourguide.com/palace-of-the-parliament-l4247/",
  "Salina Turda": "https://www.getyourguide.com/salina-turda-l122320/",
  "Turnul cu Ceas și Cetatea Sighișoara": "https://www.getyourguide.com/clock-tower-sighisoara-l166655/",
  "Salina Praid": "https://www.getyourguide.com/brasov-l2003/salina-praid-salt-mine-t270447/",
  "Castelul Corvinilor": "https://www.getyourguide.com/corvin-castle-l127588/",
  "Mănăstirea Voroneț": "https://www.getyourguide.com/voronet-monastery-l129098/",
  "Cetatea Poenari": "https://www.getyourguide.com/poenari-castle-l138468/",
  "Cetatea Alba Carolina": "https://www.getyourguide.com/alba-carolina-citadel-l127593/",
};
const GYG_PARTNER_ID = "LM6J21N";

// Widget contextual de urgență (vezi buildContextualWidgetHtml mai jos) —
// linkuri de afiliere OPȚIONALE, goale la început. Fără linkuri de
// afiliere reale confirmate pentru Glovo/Bringo, folosim link-urile lor
// publice, funcționale — nu inventăm un format de link de afiliere pe care
// nu l-am verificat (la fel ca la GetYourGuide, mai devreme în proiect).
const linkGlovoAffiliate = ""; // dacă rămâne gol, cade pe glovoapp.com (link public, funcțional, fără tracking)
const linkBringoAffiliate = ""; // dacă rămâne gol, cade pe bringo.ro (link public, funcțional, fără tracking)
// Booking.com CHIAR are un format public, documentat, de link de afiliere —
// doar ID-ul de partener (aid=), atașat la un link de căutare normal.
// Programul Booking Partner e la partner.booking.com — cauți acolo "aid"-ul
// tău din Partner Hub. Gol = link de căutare normal, funcțional, fără comision.
const BOOKING_AFFILIATE_ID = "";

// zile libere legale REALE, confirmate — România, 2026 (Legea 53/2003, Legea
// 147/2018) — verificat prin căutare, peste 15 surse independente, inclusiv
// o corectare (Paștele Ortodox 2026 e pe 12 aprilie, nu altă dată, cum
// spunea o singură sursă minoritară găsită). Banner-ul de "zi specială"
// arată DOAR când azi chiar coincide cu una din aceste date reale — nu doar
// pentru că Google arată o diferență de orar (asta se poate întâmpla și
// din alte motive, nu neapărat o sărbătoare).
// IMPORTANT: lista e valabilă DOAR pentru 2026 — sărbătorile cu dată
// variabilă (Paște, Rusalii) se mută în fiecare an. Trebuie actualizată
// manual, o dată pe an, la începutul lui ianuarie.
const ROMANIAN_LEGAL_HOLIDAYS_2026 = [
  "2026-01-01", "2026-01-02", // Anul Nou
  "2026-01-06", "2026-01-07", // Boboteaza, Sf. Ioan Botezătorul
  "2026-01-24", // Ziua Unirii Principatelor Române
  "2026-04-10", "2026-04-12", "2026-04-13", // Vinerea Mare, Paște, a doua zi de Paște
  "2026-05-01", // Ziua Muncii
  "2026-05-31", "2026-06-01", // Rusalii, a doua zi de Rusalii + Ziua Copilului
  "2026-08-15", // Adormirea Maicii Domnului
  "2026-11-30", // Sfântul Andrei
  "2026-12-01", // Ziua Națională a României
  "2026-12-25", "2026-12-26", // Crăciunul
];

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

// Etichete unificate, pentru toate cele 21 de limbi — construite riguros,
// ca răspuns direct la semnalarea: "avem o combinație de limbi". Acoperă
// TOATE butoanele/textele care înainte existau doar în RO+EN (Planifică
// vizita, Raportare, Cum ajung acolo, widget contextual, mall/cinema,
// ghiduri, notificări push) — pe orice pagină, în orice limbă selectată.
;
function getExtraLabels(lang) {
  return EXTRA_LABELS[lang] || EXTRA_LABELS.uk;
}
const ATTRACTION_FOOTER_TEMPLATES = {
  ro: (n) => `îți arată dacă ${n} este deschis chiar acum, plus acces rapid la bilete.`,
  uk: (n) => `shows if ${n} is open right now, plus quick access to tickets.`,
  de: (n) => `zeigt dir, ob ${n} gerade geöffnet ist, sowie schnellen Zugang zu Tickets.`,
  es: (n) => `te muestra si ${n} está abierto ahora mismo, además de acceso rápido a entradas.`,
  fr: (n) => `vous indique si ${n} est ouvert en ce moment, avec un accès rapide aux billets.`,
  it: (n) => `ti mostra se ${n} è aperto proprio ora, con accesso rapido ai biglietti.`,
  pl: (n) => `pokazuje, czy ${n} jest teraz otwarte, oraz szybki dostęp do biletów.`,
  nl: (n) => `laat je zien of ${n} nu open is, plus snelle toegang tot tickets.`,
  da: (n) => `viser dig, om ${n} har åbent lige nu, plus hurtig adgang til billetter.`,
  se: (n) => `visar dig om ${n} är öppet just nu, plus snabb åtkomst till biljetter.`,
  pt: (n) => `mostra-te se ${n} está aberto agora mesmo, além de acesso rápido a bilhetes.`,
  cz: (n) => `ti ukáže, zda je ${n} právě teď otevřeno, plus rychlý přístup ke vstupenkám.`,
  fi: (n) => `näyttää, onko ${n} auki juuri nyt, sekä nopean pääsyn lippuihin.`,
  gr: (n) => `σου δείχνει αν το ${n} είναι ανοιχτό αυτή τη στιγμή, καθώς και γρήγορη πρόσβαση σε εισιτήρια.`,
  hu: (n) => `megmutatja, hogy a(z) ${n} most éppen nyitva van-e, valamint gyors hozzáférést biztosít a jegyekhez.`,
  hr: (n) => `pokazuje ti je li ${n} sada otvoreno, uz brz pristup ulaznicama.`,
  sk: (n) => `ti ukáže, či je ${n} práve teraz otvorené, plus rýchly prístup k lístkom.`,
  si: (n) => `ti pokaže, ali je ${n} zdaj odprto, ter hiter dostop do vstopnic.`,
  lt: (n) => `parodo, ar ${n} dabar atidaryta, taip pat greitą prieigą prie bilietų.`,
  lv: (n) => `parāda, vai ${n} tagad ir atvērts, kā arī ātru piekļuvi biļetēm.`,
  ee: (n) => `näitab, kas ${n} on praegu avatud, samuti kiiret ligipääsu piletitele.`,
};
function attractionFooterTextFor(lang, name) {
  const fn = ATTRACTION_FOOTER_TEMPLATES[lang] || ATTRACTION_FOOTER_TEMPLATES.uk;
  return fn(name);
}

;
function noLiveDataTextFor(lang, url) {
  const fn = NO_LIVE_DATA_TEXT[lang] || NO_LIVE_DATA_TEXT.uk;
  return fn(url);
}

;
function liveGoogleLabelFor(lang) {
  return LIVE_GOOGLE_LABEL[lang] || LIVE_GOOGLE_LABEL.uk;
}

// Funcții "adapter" — transformă EXTRA_LABELS[lang] (chei scurte, unificate)
// în formatul exact așteptat de fiecare funcție de randare deja existentă,
// fără să modific acele funcții (risc mai mic de eroare pe cod deja
// funcțional). NOTĂ ONESTĂ: pentru "q1" (întrebarea de raportare), doar RO
// și EN au propoziție completă tradusă — restul limbilor folosesc
// "${name}?", simplu, dat fiind opțiunile Da/Nu de lângă sunt deja traduse
// corect și contextul (buton de raportare, deja tradus) rămâne clar.
const BOOKING_HINT_TEMPLATES = {
  ro: (n) => `Vezi cazări, parcare și bilete online pentru ${n} — toate într-un singur loc.`,
  uk: (n) => `Find nearby stays, parking, and online tickets for ${n} — all in one place.`,
  de: (n) => `Finde Unterkünfte, Parkplätze und Online-Tickets für ${n} — alles an einem Ort.`,
  es: (n) => `Encuentra alojamientos, aparcamiento y entradas online para ${n} — todo en un solo lugar.`,
  fr: (n) => `Trouvez des hébergements, un parking et des billets en ligne pour ${n} — le tout au même endroit.`,
  it: (n) => `Trova alloggi, parcheggi e biglietti online per ${n} — tutto in un unico posto.`,
  pl: (n) => `Znajdź noclegi, parking i bilety online dla ${n} — wszystko w jednym miejscu.`,
  nl: (n) => `Vind verblijven, parkeren en online tickets voor ${n} — allemaal op één plek.`,
  da: (n) => `Find overnatning, parkering og billetter online til ${n} — alt på ét sted.`,
  se: (n) => `Hitta boenden, parkering och biljetter online för ${n} — allt på ett ställe.`,
  pt: (n) => `Encontra alojamentos, estacionamento e bilhetes online para ${n} — tudo num só lugar.`,
  cz: (n) => `Najdi ubytování, parkování a vstupenky online pro ${n} — vše na jednom místě.`,
  fi: (n) => `Löydä majoitus, pysäköinti ja liput verkosta kohteelle ${n} — kaikki yhdessä paikassa.`,
  gr: (n) => `Βρες διαμονή, πάρκινγκ και εισιτήρια online για ${n} — όλα σε ένα μέρος.`,
  hu: (n) => `Találj szállást, parkolást és online jegyeket ehhez: ${n} — minden egy helyen.`,
  hr: (n) => `Pronađi smještaj, parking i ulaznice online za ${n} — sve na jednom mjestu.`,
  sk: (n) => `Nájdi ubytovanie, parkovanie a lístky online pre ${n} — všetko na jednom mieste.`,
  si: (n) => `Poišči nastanitev, parkiranje in vstopnice online za ${n} — vse na enem mestu.`,
  lt: (n) => `Rask apgyvendinimą, parkavimą ir bilietus internetu vietai ${n} — viskas vienoje vietoje.`,
  lv: (n) => `Atrodi apmešanos, stāvvietu un biļetes tiešsaistē vietai ${n} — viss vienuviet.`,
  ee: (n) => `Leia majutus, parkimine ja piletid veebist kohale ${n} — kõik ühes kohas.`,
};
// Cerut explicit: la plaje nu vindem bilete — text separat, fără mențiunea
// asta, ca să nu promitem ceva ce nu oferim.
const BOOKING_HINT_TEMPLATES_BEACH = {
  ro: (n) => `Vezi cazări și parcare pentru ${n} — totul într-un singur loc.`,
  uk: (n) => `Find nearby stays and parking for ${n} — all in one place.`,
  de: (n) => `Finde Unterkünfte und Parkplätze für ${n} — alles an einem Ort.`,
  es: (n) => `Encuentra alojamientos y aparcamiento para ${n} — todo en un solo lugar.`,
  fr: (n) => `Trouvez des hébergements et un parking pour ${n} — le tout au même endroit.`,
  it: (n) => `Trova alloggi e parcheggi per ${n} — tutto in un unico posto.`,
  pl: (n) => `Znajdź noclegi i parking dla ${n} — wszystko w jednym miejscu.`,
  nl: (n) => `Vind verblijven en parkeren voor ${n} — allemaal op één plek.`,
  da: (n) => `Find overnatning og parkering til ${n} — alt på ét sted.`,
  se: (n) => `Hitta boenden och parkering för ${n} — allt på ett ställe.`,
  pt: (n) => `Encontra alojamentos e estacionamento para ${n} — tudo num só lugar.`,
  cz: (n) => `Najdi ubytování a parkování pro ${n} — vše na jednom místě.`,
  fi: (n) => `Löydä majoitus ja pysäköinti kohteelle ${n} — kaikki yhdessä paikassa.`,
  gr: (n) => `Βρες διαμονή και πάρκινγκ για ${n} — όλα σε ένα μέρος.`,
  hu: (n) => `Találj szállást és parkolást ehhez: ${n} — minden egy helyen.`,
  hr: (n) => `Pronađi smještaj i parking za ${n} — sve na jednom mjestu.`,
  sk: (n) => `Nájdi ubytovanie a parkovanie pre ${n} — všetko na jednom mieste.`,
  si: (n) => `Poišči nastanitev in parkiranje za ${n} — vse na enem mestu.`,
  lt: (n) => `Rask apgyvendinimą ir parkavimą vietai ${n} — viskas vienoje vietoje.`,
  lv: (n) => `Atrodi apmešanos un stāvvietu vietai ${n} — viss vienuviet.`,
  ee: (n) => `Leia majutus ja parkimine kohale ${n} — kõik ühes kohas.`,
};

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

;
;

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

// Schema.org LocalBusiness — date structurate (JSON-LD), cerute explicit
// pentru SEO: îi spun direct lui Google programul exact, fără să se bazeze
// doar pe textul din pagină. Zilele săptămânii sunt ÎNTOTDEAUNA în engleză
// (cerință schema.org, indiferent de limba paginii). Adresa/telefon/coordo-
// natele apar DOAR când avem date reale, verificate (din Google Places) —
// nu inventăm niciodată o adresă, ca să nu transmitem informații false.
const SCHEMA_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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

// FAQ Schema — întrebări generice, per oraș, cu răspuns vizibil pe pagină
// (obligatoriu: Google penalizează markup ascuns, fără conținut real
// corespunzător). Din 2023, Google arată "Rich Snippets" FAQ doar pentru
// site-uri guvernamentale/medicale — pentru noi, markup-ul rămâne valid și
// citit de Google, dar fără căsuțe extinse vizibile în rezultate.
;
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

;
;

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

;
;

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

// Linkuri opționale pentru "Cum ajung acolo?" — GetTransfer (taxi/transfer
// local) și Omio (tren/autobuz Europa), prin contul Travelpayouts. Fără
// linkuri de afiliere specifice confirmate încă, cad pe site-urile publice,
// funcționale — dacă ai coduri de link reale din Travelpayouts, pune-le
// aici, direct.
const linkGetTransferAffiliate = "https://gettransfer.tpk.lu/XPrEGhpT";
const linkOmioAffiliate = "";

function getTransferLinkFor() {
  return linkGetTransferAffiliate || "https://getransfer.com/";
}
function omioLinkFor() {
  return linkOmioAffiliate || "https://www.omio.com/";
}

// Model hibrid pentru rezervări la restaurant — platforma potrivită depinde
// de țara obiectivului, nu una singură peste tot (TheFork nu acoperă
// România, de exemplu — confirmat, nu presupus). Linkuri de afiliere goale
// acum, cad pe căutări publice, funcționale — pune-le pe cele reale (Awin
// pentru TheFork, programul propriu OpenTable) când le ai.
const linkTheForkAffiliate = "";
const linkOpenTableAffiliate = "";

const RESTAURANT_PLATFORM_BY_COUNTRY = {
  fr: "thefork", it: "thefork", es: "thefork",
  uk: "opentable", de: "opentable", ie: "opentable",
};

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

// Parcări rezervabile în avans — YourParkingSpace, prin Awin (rețea de
// afiliere), confirmat DOAR pentru UK ("il punem doar la UK ca in rest nu
// functioneaza" — decizie explicită, nu presupunere). Restul țărilor rămân
// pe mesajul "urmează în curând" (vezi parkingLinkFor mai jos).
//
// Format REAL, confirmat direct din link-ul generat în Awin ("Create deep
// link" → Generate link) — NU presupus: parametrul de destinație e "ued="
// (nu "p="), și trebuie inclus și "campaign=". Căutarea lor (yourparkingspace.
// co.uk/search) cere coordonate GPS reale (lat/lng), nu doar adresă text —
// confirmat separat, prin documentația lor API (docs.api.yourparkingspace.
// co.uk): "Perform a search... by latitude and longitude" — un nume de oraș
// simplu nu ar fi suficient pentru rezultate corecte.
//
// SURSA coordonatelor: NU calculăm nimic nou — reutilizăm exact lat/lng pe
// care site-ul le cere DEJA de la Google Places pentru statusul live
// (`live.lat`/`live.lng`, vezi tryGetLiveStatus mai jos) — același apel,
// fără niciun cost suplimentar. Dacă obiectivul nu are status live (fără
// place_id valid încă), NU inventăm coordonate — link-ul de parcare cade
// pur și simplu pe "urmează în curând", la fel ca înainte.
const AWIN_YPS_MERCHANT_ID = "18633";
const AWIN_YPS_AFFILIATE_ID = "3051943";
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

// ParkVia — fallback generic, NECONFIRMAT încă pentru nicio țară (spre
// deosebire de YourParkingSpace, de mai sus, confirmat pentru UK) — păstrat
// doar ca infrastructură pentru o eventuală extindere ulterioară, dincolo
// de UK; nu e folosit momentan de buildBookingPlanningButtonsHtml.
const linkParkviaAffiliate = "";
function parkviaLinkFor(place) {
  return linkParkviaAffiliate || `https://www.parkvia.com/search?q=${encodeURIComponent(place)}`;
}

// Bilete de avion — Kiwi.com, prin Travelpayouts (nu Skyscanner — schimbare
// de plan, confirmată explicit: aprobare venită la Kiwi.com/Travelpayouts,
// nu la Skyscanner). Locul rămâne pagina de ITINERAR, nu Ghiduri, din
// același motiv de dinainte: acolo utilizatorul a spus deja exact ce oraș
// și câte zile vrea — cel mai concret semnal de intenție de pe site.
//
// Format confirmat din documentația oficială Travelpayouts (nu doar
// presupus): https://www.kiwi.com/deep?to=...&marker=ID
//   - "marker" = ID-ul tău de afiliat (767825, confirmat direct de tine)
//   - "to" — documentația spune explicit cod IATA/aeroport, NU nume de oraș
//     în text liber. NEVERIFICAT încă dacă acceptă și "Lyon" direct (probabil
//     parțial, prin propria rezolvare fuzzy a Kiwi la afișare) — dacă
//     observi că duce la o pagină goală sau greșită pentru vreun oraș
//     anume, spune-mi și găsim un cod IATA corect pentru orașele cele mai
//     căutate, în loc să presupunem că merge peste tot.
//   - "from" — deliberat, NU presupunem orașul de plecare al utilizatorului
//     (ar fi o presupunere, nu o certitudine) — lăsăm necompletat, Kiwi
//     arată implicit toate plecările posibile, utilizatorul își alege
//     singur orașul de plecare pe pagina lor.
const KIWI_TRAVELPAYOUTS_MARKER = "767825";
function flightSearchLinkFor(destinationCity) {
  if (!KIWI_TRAVELPAYOUTS_MARKER) return null;
  return `https://www.kiwi.com/deep?to=${encodeURIComponent(destinationCity)}&marker=${encodeURIComponent(KIWI_TRAVELPAYOUTS_MARKER)}`;
}

// Închiriere mașină — Discover Cars, program de afiliere DIRECT (nu prin
// Travelpayouts) — link real: https://www.discovercars.com/?a_aid=23ea55cb
// (codul real de tracking, confirmat direct din cont — "Parent affiliate";
// "marianarsene" era doar prefixul emailului de login, folosit din greșeală
// aici înainte — reparat, vezi DISCOVERCARS_AFFILIATE_ID mai jos).
//
// Fără destinație pre-completată, deliberat — cercetat direct: căutarea lor
// reală cere un ID INTERN de locație (pick_up_city_id etc.), obținut printr-un
// API de autocomplete al lor, NU un nume de oraș simplu în text. Singurul
// mod găsit de a construi asta ar fi prin unelte de "scraping" neoficiale,
// nedocumentate public — prea fragil, s-ar putea rupe la orice schimbare pe
// partea lor, fără nicio avertizare. Preferăm un link simplu, sigur
// funcțional, chiar dacă utilizatorul trebuie să-și scrie singur orașul
// acolo — la fel ca la originea zborului, pe Kiwi.com.
//
// EXCEPȚIE — 30 de orașe mari/turistice, cu link-uri DEEP LINK reale,
// generate direct din panoul Discover Cars (nu presupuse) — pentru acestea,
// destinația CHIAR e pre-completată. Restul orașelor cad pe link-ul general
// de mai sus. Format real observat: .../{limbă}/{țară}/{oraș}?a_aid=...
//
// Chei = numele noastre interne CANONICE (orasCanonic din
// resolveCityToCountry) — două nepotriviri găsite și confirmate direct:
// "Anvers" -> Antwerpen (numele francez, dat de tine, dar orașul e același),
// "Fiorentina" -> Firenze (așa a apărut în sistemul DiscoverCars, confirmat
// că e tot Florența, nu alt loc).
;
// "marianarsene" NU era un cod de afiliat valid — era doar prefixul emailului
// de login (marianarsene.ma@gmail.com), folosit din greșeală ca a_aid într-o
// sesiune anterioară. Codul real de tracking, confirmat direct din contul
// Discover Cars ("Parent affiliate"), e "23ea55cb" — același folosit deja
// corect la cele 30 de deep link-uri de mai sus. Unificat aici, ca toate
// linkurile Discover Cars din tot site-ul să ducă comisionul spre același
// cont real.
const DISCOVERCARS_AFFILIATE_ID = "23ea55cb";
function carRentalLinkFor(destinationCity) {
  if (destinationCity && DISCOVERCARS_CITY_LINKS[destinationCity]) {
    return DISCOVERCARS_CITY_LINKS[destinationCity];
  }
  if (!DISCOVERCARS_AFFILIATE_ID) return null;
  return `https://www.discovercars.com/?a_aid=${encodeURIComponent(DISCOVERCARS_AFFILIATE_ID)}`;
}

;
;

// Buton + panou cu 2 opțiuni — sub programul zilei, pe pagina de magazin
// SAU obiectiv. Nu redirectăm direct (ar alege unul pentru utilizator) —
// arătăm ambele opțiuni, îl lăsăm pe el să aleagă.
function buildHowToGetThereHtml(labels, place, beachOptions) {
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
  const getTransferHtml = linkGetTransferAffiliate
    ? `<a href="${escapeHtml(getTransferLinkFor())}" target="_blank" rel="noopener sponsored" class="how-to-get-there-option">${escapeHtml(t.optionA)}</a>`
    : "";
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

function buildGoNowButtonHtml(place, label) {
  return `<a id="goNowBtn" class="go-now-btn" href="${escapeHtml(wazeLinkFor(place))}" target="_blank" rel="noopener" hidden>${escapeHtml(label || "🚗 Mergi acum (Waze)")}</a>`;
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

// Etichetă pentru mesajul "nimic deschis acum" — cerut explicit: quando
// filtrul "deschis acum" ajunge la 0 rezultate (ex. seara târziu), în loc
// să lăsăm lista goală, arătăm un mesaj care trimite spre itinerarul AI —
// transformă un moment frustrant într-o oportunitate.
;
function noResultsItineraryLabelsFor(lang) { return NO_RESULTS_ITINERARY_LABELS[lang] || NO_RESULTS_ITINERARY_LABELS.uk; }
function buildNoResultsItineraryPromoHtml(id, countryCode, lang) {
  const t = noResultsItineraryLabelsFor(lang);
  const href = itineraryHrefFor(countryCode, lang);
  return `<a href="${escapeHtml(href)}" id="${escapeHtml(id)}" class="itinerary-promo-card itinerary-promo-empty" style="display:none">
    <div class="itinerary-promo-title">${escapeHtml(t.text)}</div>
    <div class="itinerary-promo-cta">${escapeHtml(t.cta)}</div>
  </a>`;
}

function buildListStatusBadgeScript(nonce, statusDataset, noResultsElId) {
  return `
<script nonce="${nonce}">
(function(){
  var DATASET = ${safeJson(statusDataset)};
  var NO_RESULTS_EL_ID = ${safeJson(noResultsElId || "")};
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
    if (typeof entity.liveIsOpenNow === "boolean") return entity.liveIsOpenNow;
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
    var now = new Date();
    var onlyOpen = window.__storeListOpenOnlyToggle && window.__storeListOpenOnlyToggle.checked;
    var visibleCount = 0;
    badges.forEach(function(badge){
      var key = badge.getAttribute("data-status-key");
      var entity = DATASET[key];
      if (!entity) return;
      var open = isOpenNow(entity, now);
      badge.classList.toggle("status-open", open);
      badge.classList.toggle("status-closed", !open);
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

  syncAll();
  setInterval(syncAll, 60000); // suficient pentru o listă — nu are nevoie de precizie per-secundă

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

// Widget contextual — arată alternative diferite în funcție de statusul
// LIVE (deschis/închis) al paginii curente. Construit ca 2 blocuri, ambele
// prezente în HTML de la server, comutate vizual de JS (vezi
// buildContextualWidgetScript) — niciodată nu inventăm STATUSUL, doar
// reacționăm la ce e deja calculat, corect, în altă parte a paginii.
;
// Etichete pentru mall/cinema pe rutele INTL — doar EN+RO (limbile relevante
// pentru RO pe .eu), cu fallback sigur la EN pentru orice altă limbă aleasă,
// ca să nu rupem nimic dacă cineva schimbă limba pe o pagină de mall/cinema.
;
function mallCinemaLabelsFor(lang) {
  return getExtraLabels(lang);
}

;

// Glovo — DOAR în țările unde chiar operează, verificat direct, nu presupus
// universal. Din cele deja acoperite de site: România, Spania, Italia,
// Portugalia, Polonia, Croația. (Ucraina, Bulgaria, Serbia, Muntenegru —
// unde Glovo operează și el, dar site-ul nu are încă aceste țări.)
;
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

// Notificări push — chei VAPID, din variabile de mediu (NU hardcodate în
// cod — cheia privată e un secret, la fel ca parola bazei de date). Dacă
// lipsesc, funcționalitatea de abonare rămâne dezactivată automat, sigur,
// fără să crape site-ul. Le generezi tu, o singură dată, local, cu
// `npx web-push generate-vapid-keys` — vezi instrucțiunile din README.
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:contact@programul-de-azi.ro";
const pushEnabled = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && dbPool);

// construiește link-ul de bilete pentru un obiectiv anume: dacă avem URL
// real în ATTRACTION_TICKET_URLS, îi atașăm parametrii de tracking; altfel
// cădem pe linkul general linkBileteTurism, exact comportamentul de dinainte
function ticketUrlFor(attractionName) {
  const realUrl = ATTRACTION_TICKET_URLS[attractionName];
  if (!realUrl) return linkBileteTurism;
  const separator = realUrl.includes("?") ? "&" : "?";
  return `${realUrl}${separator}partner_id=${GYG_PARTNER_ID}&utm_medium=affiliate&utm_source=partner_program`;
}

// Construiește un element de acordeon pentru un obiectiv turistic — fără
// niciun widget încărcat inițial (lazy-loading, vezi
// buildAttractionAccordionScript); doar structura HTML, gata să fie
// "umplută" de JS la primul click. Nu punem fav-star ÎN INTERIORUL
// butonului de acordeon — două elemente <button> imbricate nu sunt HTML
// valid — sunt frați, într-un rând comun.
;

// etichete de categorie pentru gruparea obiectivelor turistice (ex. România,
// 500 de obiective) — necesar la scară: o listă plată de 500+ <li> pe o
// singură pagină e grea de randat/scrollat; grupate pe categorii, în
// <details> nativ (închis implicit), browserul nu face layout pentru
// conținutul ascuns, iar utilizatorul navighează mult mai ușor. Doar
// ro + uk complete acum (singura țară cu date pe categorii, momentan);
// restul limbilor cad automat pe uk — de completat pe măsură ce se extinde
// sistemul de categorii și la alte țări.
;

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
function translateAttractionName(name, lang) {
  name = dedupeTrailingCityName(name);
  if (!name || lang === "ro") return name;
  const words = Object.keys(ATTRACTION_PREFIX_TRANSLATIONS).sort((a, b) => b.length - a.length);
  for (const word of words) {
    if (name === word || name.startsWith(word + " ")) {
      const translated = ATTRACTION_PREFIX_TRANSLATIONS[word][lang];
      if (!translated) return name;
      let rest = name.slice(word.length);
      // Eliminăm conectorul românesc rămas ("din"/"de"/"al"/"ai"/"ale"/"a"),
      // ex. "Catedrala din Köln" -> "Kathedrale Köln", nu "Kathedrale din
      // Köln" — găsit la 261 din 2.324 de nume, merită reparat separat.
      rest = rest.replace(/^ (din|de|al|ai|ale|a) /, " ");
      return translated + rest;
    }
  }
  return name;
}

// Extrage numele PROPRIU (fără cuvântul generic din față) — pentru sortare
// și indexul alfabetic (Quick-Jump), cerut explicit: "Castelul Bran" ar
// trebui indexat la "B" (Bran), nu la "C" (Castelul) — nimeni nu caută
// "The Beatles" la litera "T". Reutilizează exact aceleași prefixe
// românești deja catalogate pentru traducere.
function stripAttractionPrefix(name) {
  if (!name) return name;
  const words = Object.keys(ATTRACTION_PREFIX_TRANSLATIONS).sort((a, b) => b.length - a.length);
  for (const word of words) {
    if (name.startsWith(word + " ")) {
      let rest = name.slice(word.length + 1);
      rest = rest.replace(/^(din|de|al|ai|ale|a) /, "");
      return rest;
    }
  }
  return name;
}

// Prima literă, fără diacritice, majusculă — pentru gruparea în index
function firstIndexLetter(name) {
  const proper = stripAttractionPrefix(name);
  const normalized = proper.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const ch = normalized.charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : "#";
}

// Eticheta "Recomandat" — DOAR obiective mari, cunoscute, marcate manual cu
// încredere reală (nu ghicite, nu generate automat pe baza de trafic/votun
// insuficient — vezi discuția explicită despre limitele cunoștințelor mele).
;
function recommendedLabelFor(lang) { return RECOMMENDED_LABELS[lang] || RECOMMENDED_LABELS.uk; }

// Eticheta comutatorului de sortare "Recomandate primele" — apare doar la
// categoriile care chiar au obiective marcate (vezi hasRecommended, mai jos)
;
function recommendedFirstLabelFor(lang) { return RECOMMENDED_FIRST_LABELS[lang] || RECOMMENDED_FIRST_LABELS.uk; }

// Eticheta categoriei combinate "Plaje" — cerut explicit: restructurare
// completă — insulă/regiune ÎNTÂI, apoi tip (sălbatică/organizată) ca
// subcategorii, nu invers cum era.
;
function beachesMegaCategoryLabelFor(lang) { return BEACHES_MEGA_CATEGORY_LABELS[lang] || BEACHES_MEGA_CATEGORY_LABELS.uk; }

// "Descoperă această plajă" — cerut explicit, înlocuiește "Vezi program"
// DOAR la plaje (nu au program fix, cerut explicit să nu mai afișăm deloc
// program generic la ele).
;
function discoverBeachLabelFor(lang) { return DISCOVER_BEACH_LABELS[lang] || DISCOVER_BEACH_LABELS.uk; }

// Card centralizat de voturi + recenzie — cerut explicit: pe pagina plajei,
// în loc de program (nu mai afișăm program generic la plaje — doar dacă
// vine chiar de la comunitate), un card cu voturile centralizate (număr
// vizibil la fiecare opțiune) + CTA spre un formular Da/Nu, per etichetă.
;
function beachReviewLabelsFor(lang) { return BEACH_REVIEW_LABELS[lang] || BEACH_REVIEW_LABELS.uk; }

// Conținut editorial bogat, per plajă — DOAR română momentan (conținutul
// original, scris de proprietar, există doar în RO). Îmbină "Cum ajungi"
// (text descriptiv) cu butoanele existente (Discover Cars/Waze) și
// înlocuiește placeholder-ul generic de monetizare cu echipamentul REAL,
// specific fiecărei plaje, când există.
const BEACH_CONTENT_LABELS_RO = {
  scurt: "🧭 Pe scurt despre plajă",
  cumAjungi: "🚗 Cum ajungi la plajă",
  echipament: "🎒 Echipament de plajă & activități — recomandările noastre",
  preturi: "💰 Prețuri orientative la fața locului",
  turisti: "💬 Ce spun turiștii despre această plajă",
  tips: "💡 Informații practice & tips locale",
};
const BEACH_CONTENT_LABELS_UK = {
  scurt: "🧭 About this beach",
  cumAjungi: "🚗 How to get there",
  echipament: "🎒 Beach gear & activities — our picks",
  preturi: "💰 What to expect, price-wise",
  turisti: "💬 What travelers say about this beach",
  tips: "💡 Practical info & local tips",
};
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

// Card promoțional pentru itinerar — cerut explicit: mulți vizitatori vin
// doar să verifice programul și pleacă, fără să știe de itinerarul AI.
// O singură dată pe pagină (nu repetat la fiecare țară — ar fi obositor
// vizual), deasupra listelor de obiective.
;
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

// Banner special, DOAR pentru Grecia — cerut explicit, la extinderea cu
// plaje. Regiune fixă "Grecia" (nu insula specifică — sistemul nostru
// grupează obiectivele pe categorie, nu pe insulă, deci detectarea
// dinamică per-insulă ar cere o extindere mult mai mare a arhitecturii,
// lăsată pentru o etapă viitoare).
;
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

// Etichete pentru votul anonim — "vot" (buton, inainte de a vota) și
// "popular" (insigna, DOAR peste prag — vezi VOTE_POPULAR_THRESHOLD).
;
function voteLabelsFor(lang) { return VOTE_LABELS[lang] || VOTE_LABELS.uk; }

;
function beachTagLabelsFor(lang) { return BEACH_TAG_LABELS[lang] || BEACH_TAG_LABELS.uk; }

// Etichete pentru butonul "Vezi tururi cu barca" (plaje boat-only) și
// mesajul discret de închiriere auto (plaje medium/high access_difficulty)
// — cerute explicit, la extinderea pentru plajele din Grecia.
;
;
function boatTourLabelFor(lang) { return BOAT_TOUR_LABELS[lang] || BOAT_TOUR_LABELS.uk; }
function carAccessHintLabelFor(lang, city) {
  const fn = CAR_ACCESS_HINT_LABELS[lang] || CAR_ACCESS_HINT_LABELS.uk;
  return fn(city);
}

function buildVoteWidgetHtml(slug, count, isPopular, lang) {
  const t = voteLabelsFor(lang);
  const popularBadge = isPopular ? `<span class="vote-popular-badge">${escapeHtml(t.popular)}</span>` : "";
  return `<div class="vote-widget" data-vote-slug="${escapeHtml(slug)}">
    <button type="button" class="vote-btn" data-vote-label="${escapeHtml(t.vote)}" data-voted-label="${escapeHtml(t.voted)}">${escapeHtml(t.vote)}</button>
    ${popularBadge}
  </div>`;
}

// Script client pentru butonul de vot — un singur click, fără text. Ține
// minte local (localStorage) ce a votat DEJA acest browser, ca butonul să
// rămână "bifat" chiar și după reîncărcarea paginii — protecția REALĂ
// (un IP nu poate vota de două ori) e pe server, prin UNIQUE(slug, ip_hash);
// asta e doar feedback vizual, nu securitate.
// Widget de etichete comunitare pentru PLAJE — cerut explicit, DOAR pentru
// categoriile de plaje (nu apare la castele/muzee etc.). Câte un buton per
// opțiune, grupate vizual; etichetele deja CÂȘTIGĂTOARE (peste prag) apar
// separat, ca insigne, deasupra butoanelor de vot.
function buildBeachTagsWidgetHtml(slug, winningTags, lang) {
  const t = beachTagLabelsFor(lang);
  const winningBadgesHtml = winningTags.length
    ? `<div class="beach-tags-winning">${winningTags.map((tag) => `<span class="beach-tag-badge">${escapeHtml(t[tag] || tag)}</span>`).join("")}</div>`
    : "";
  const buttonsHtml = BEACH_ALL_TAGS
    .map((tag) => `<button type="button" class="beach-tag-vote-btn" data-tag="${escapeHtml(tag)}">${escapeHtml(t[tag] || tag)}</button>`)
    .join("");
  return `<div class="beach-tags-widget" data-beach-tags-slug="${escapeHtml(slug)}">
    ${winningBadgesHtml}
    <div class="beach-tags-vote-row">${buttonsHtml}</div>
  </div>`;
}

// Script client — buton de vot per etichetă (un click = un vot pentru acel
// tag), cu aceeași protecție ca la votul general (localStorage doar pentru
// feedback vizual, protecția reală e server-side, per IP).
function buildBeachTagsWidgetScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var STORAGE_KEY = "poa_beach_tags_voted_v1";
  var widget = document.querySelector(".beach-tags-widget");
  if (!widget) return;
  var slug = widget.getAttribute("data-beach-tags-slug");
  if (!slug) return;

  function getVoted(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (e) { return {}; }
  }
  function markVoted(tag){
    try {
      var voted = getVoted();
      voted[slug] = voted[slug] || [];
      if (voted[slug].indexOf(tag) === -1) voted[slug].push(tag);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(voted));
    } catch (e) {}
  }
  function alreadyVoted(tag){
    var voted = getVoted();
    return voted[slug] && voted[slug].indexOf(tag) !== -1;
  }

  widget.querySelectorAll(".beach-tag-vote-btn").forEach(function(btn){
    var tag = btn.getAttribute("data-tag");
    if (alreadyVoted(tag)) { btn.classList.add("voted"); btn.disabled = true; }
    btn.addEventListener("click", function(){
      if (btn.disabled) return;
      btn.disabled = true;
      fetch("/api/tag-attraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug, tag: tag }),
      })
        .then(function(r){ return r.json(); })
        .then(function(data){
          if (data && data.ok) { btn.classList.add("voted"); markVoted(tag); }
          else { btn.disabled = false; }
        })
        .catch(function(){ btn.disabled = false; });
    });
  });
})();
</script>`;
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

// Obiective cu ACCES LIBER, fără program — semnalat direct, cu captură:
// poduri, lacuri, munți, șosele nu au "orar de vizitare", spre deosebire de
// peșteri/funiculare/telecabine (care AU program real, bilet, tur ghidat —
// rămân neschimbate). Clasificare pe baza cuvântului-cheie din nume, NU pe
// categorie întreagă (categoria "natura" conține și peșteri, care au
// program; categoria "infrastructura" conține și funiculare/telecabine).
//
// Compromis onest: unele obiective nu au un prefix recognoscibil clar (ex.
// "Suomenlinna Helsinki" — o cetate, dar numele nu începe cu "Cetatea") —
// acelea rămân pe comportamentul normal (cu program), nu 100% acoperire,
// dar corectă pentru marea majoritate.
;
// Subset — DOAR acestea primesc și avertismentul sezonier (meteo/drum),
// restul (poduri, lacuri, insule) n-au relevanță meteo.
;

function isFreeAccessAttraction(name) {
  if (!name) return false;
  return FREE_ACCESS_PREFIXES.some((prefix) => name === prefix || name.startsWith(prefix + " "));
}
function needsSeasonalWarning(name) {
  if (!name) return false;
  return SEASONAL_WARNING_PREFIXES.some((prefix) => name === prefix || name.startsWith(prefix + " "));
}

// Etichete traduse — DOAR pentru cele 2 texte noi, pe toate cele 21 de
// limbi. Avertismentul sezonier e text STATIC (nu date live — n-avem acces
// la meteo/trafic în timp real), afișat mereu la fel, indiferent de
// anotimp — utilizatorul decide dacă e relevant acum.
;
;
function freeAccessLabelFor(lang) { return FREE_ACCESS_LABELS[lang] || FREE_ACCESS_LABELS.uk; }

// etichete pentru cele 2 comutatoare noi de filtrare pe listă (magazine +
// obiective, pe prima pagină, nu doar pe hartă — cerut explicit)
;
;
function openOnlyStoreLabelFor(lang) { return OPEN_ONLY_STORE_LABELS[lang] || OPEN_ONLY_STORE_LABELS.uk; }
function openOnlyAttractionLabelFor(lang) { return OPEN_ONLY_ATTRACTION_LABELS[lang] || OPEN_ONLY_ATTRACTION_LABELS.uk; }

// eticheta scurtă, contextuală — cerut explicit ("checkbox discret imediat
// sub titlul categoriei") — mai scurtă decât cea principală, se afișează
// sub fiecare categorie extinsă (castele, muzee etc.), nu doar o dată pe
// pagină.
;
function openOnlyAttractionShortLabelFor(lang) { return OPEN_ONLY_SHORT_LABELS[lang] || OPEN_ONLY_SHORT_LABELS.uk; }
function seasonalWarningLabelFor(lang) { return SEASONAL_WARNING_LABELS[lang] || SEASONAL_WARNING_LABELS.uk; }

// Program GENERIC, pe categorie — cerut explicit: pentru obiectivele fără
// date live încă (majoritatea celor 3.507 adăugate recent, nepopulate încă
// din motive de buget), afișăm un program TIPIC, nu cercetat individual
// (imposibil de făcut real pentru 3.507 obiective într-o sesiune) — marcat
// clar ca estimare, cu mențiune că programul live urmează.
//
// DOAR aceste categorii — restul (clădiri monumentale, infrastructură,
// natură non-liberă ca peșterile) rămân fără program generic, doar link
// către sursă, la cerere explicită ("restul... fara program - link catre
// Google").
;

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

// FUNCȚIA UNIFICATĂ — un singur loc care decide "e deschis acum?", pentru
// orice obiectiv turistic, indiferent unde e folosită (hartă, pagina
// individuală, orice filtru viitor). Înainte, aceeași logică era scrisă de
// mână, de mai multe ori, în locuri diferite — risc real ca cineva să
// modifice o copie și să uite cealaltă. Acum există o singură sursă de
// adevăr.
//
// Ordinea de încredere, de la cea mai sigură la cea mai slabă:
//   1) date LIVE reale (Google, deja în cache) — cea mai de încredere
//   2) acces liber (poduri, lacuri, munți) — la fel de sigur ca live data,
//      doar din alt motiv (structural, nu are program deloc)
//   3) program GENERIC pe categorie — doar o aproximare tipică, nu
//      verificată individual
//   4) necunoscut — nicio sursă nu se aplică, nu presupunem nimic
//
// @param {string} name - numele obiectivului (pentru verificarea "acces liber")
// @param {string} [category] - categoria (pentru programul generic)
// @param {boolean|null} [liveIsOpenNow] - rezultatul din date live, dacă există (null/undefined = nu există)
// @returns {{ isOpenNow: boolean|null, source: "live"|"free_access"|"generic_schedule"|"unknown" }}
// Categorii ÎNTOTDEAUNA acces liber — spre deosebire de FREE_ACCESS_PREFIXES
// (bazat pe primul cuvânt din nume, ex. "Podul"), aici e categoria întreagă
// care e liberă, indiferent de nume — cerut explicit, la extinderea pentru
// plajele sălbatice din Grecia (numele lor variază mult, nu au un prefix
// comun de detectat).
;

function determineAttractionOpenStatus({ name, category, liveIsOpenNow }) {
  if (liveIsOpenNow !== null && liveIsOpenNow !== undefined) {
    return { isOpenNow: liveIsOpenNow, source: "live" };
  }
  if (isFreeAccessAttraction(name) || FREE_ACCESS_CATEGORIES.includes(category)) {
    return { isOpenNow: true, source: "free_access" };
  }
  const schedule = genericScheduleForCategory(category);
  if (schedule) {
    return { isOpenNow: computeGenericIsOpenNow(schedule), source: "generic_schedule" };
  }
  return { isOpenNow: null, source: "unknown" };
}

// text scurt, cerut explicit: "urmează în curând programul live" — apare
// pe TOATE obiectivele fără date live încă, indiferent dacă au sau nu
// program generic afișat.
;
function liveComingSoonLabelFor(lang) { return LIVE_COMING_SOON_LABELS[lang] || LIVE_COMING_SOON_LABELS.uk; }

// eticheta "estimare" (nu date confirmate) — apare DOAR când chiar arătăm
// programul generic, ca utilizatorul să știe clar diferența față de datele
// live reale (marcate separat, "Live · Google").
;
function estimatedScheduleLabelFor(lang) { return ESTIMATED_SCHEDULE_LABELS[lang] || ESTIMATED_SCHEDULE_LABELS.uk; }


;
function categoryLabelFor(categoryKey, lang) {
  const set = CATEGORY_LABELS[lang] || CATEGORY_LABELS.uk;
  return set[categoryKey] || categoryKey;
}

// Textul "Se încarcă..." pentru <details> lazy-load (obiective pe țară,
// pe homepage-ul .eu) — separat de restul TRANSLATIONS, ca un adaos mic,
// să nu ating restul obiectelor mari deja existente
;
function loadingTextFor(lang) {
  return LOADING_TEXTS[lang] || LOADING_TEXTS.uk;
}

// Grupează lista de obiective ale unei țări pe categorii (dacă au câmpul
// "category" — momentan doar România) — <details> nativ, închis implicit,
// ca la 500 de obiective pagina să rămână ușoară de randat și de navigat.
// Țările fără date de categorie cad automat pe lista plată de dinainte
// (comportament identic, neschimbat).
function buildAttractionListForCountry(list, countryCode, isIntlContext, lang) {
  const hasCategories = list.length && list.every((a) => a.category);
  if (!hasCategories) {
    return `<ul class="attraction-accordion-list">${list
      .map((a) => buildAttractionAccordionItem(a, countryCode, null, isIntlContext, lang))
      .join("")}</ul>`;
  }
  const order = [];
  const byCategory = {};
  list.forEach((a) => {
    if (!byCategory[a.category]) { byCategory[a.category] = []; order.push(a.category); }
    byCategory[a.category].push(a);
  });
  // Categoria combinată "Plaje" — cerut explicit: restructurare completă,
  // insulă/regiune ÎNTÂI (click -> se deschid 2 subcategorii: Sălbatice /
  // Organizate), nu tip-întâi-apoi-insulă ca înainte. Randată o singură
  // dată, indiferent care din cele 2 categorii vine prima în listă.
  let beachesMegaHtml = "";
  let beachesRendered = false;
  const BEACH_CATS = ["plaje_salbatice", "plaje_organizate"];
  return order
    .map((cat) => {
      if (BEACH_CATS.includes(cat)) {
        if (beachesRendered) return ""; // deja randat, la prima categorie de plajă intalnita
        beachesRendered = true;
        const allBeaches = BEACH_CATS.flatMap((c) => byCategory[c] || []);
        const byIsland = {};
        const islandOrder = [];
        allBeaches.forEach((a) => {
          const island = a.city || "—";
          if (!byIsland[island]) { byIsland[island] = []; islandOrder.push(island); }
          byIsland[island].push(a);
        });
        islandOrder.sort((a, b) => a.localeCompare(b, "ro"));
        const totalCount = allBeaches.length;
        const islandsHtml = islandOrder
          .map((island) => {
            const islandBeaches = byIsland[island];
            const subCatsHtml = BEACH_CATS
              .map((subCat) => {
                const subList = islandBeaches.filter((a) => a.category === subCat);
                if (!subList.length) return "";
                const sorted = [...subList].sort((a, b) =>
                  stripAttractionPrefix(a.name).localeCompare(stripAttractionPrefix(b.name), "ro")
                );
                const items = sorted
                  .map((a) => buildAttractionAccordionItem(a, countryCode, null, isIntlContext, lang))
                  .join("");
                const hasRecommended = sorted.some((a) => a.recommended);
                const sortToggleHtml = hasRecommended
                  ? `<label class="category-context-filter category-sort-toggle"><input type="checkbox" class="category-recommended-first-checkbox"> ${escapeHtml(recommendedFirstLabelFor(lang))}</label>`
                  : "";
                return `<details class="attraction-category-group beach-subtype-group">
                  <summary class="attraction-category-summary">${escapeHtml(categoryLabelFor(subCat, lang))} <span class="attraction-category-count">(${sorted.length})</span></summary>
                  ${sortToggleHtml}
                  <ul class="attraction-accordion-list">${items}</ul>
                </details>`;
              })
              .join("");
            return `<details class="attraction-category-group beach-region-group">
              <summary class="attraction-category-summary">🏝️ ${escapeHtml(island)} <span class="attraction-category-count">(${islandBeaches.length})</span></summary>
              ${subCatsHtml}
            </details>`;
          })
          .join("");
        return `<details class="attraction-category-group">
          <summary class="attraction-category-summary">${escapeHtml(beachesMegaCategoryLabelFor(lang))} <span class="attraction-category-count">(${totalCount})</span></summary>
          ${islandsHtml}
        </details>`;
      }
      // sortare alfabetică, după numele PROPRIU (fără prefixul generic) —
      // ca indexul de mai jos să aibă sens ("Bran" la B, nu "Castelul" la C)
      const sorted = [...byCategory[cat]].sort((a, b) =>
        stripAttractionPrefix(a.name).localeCompare(stripAttractionPrefix(b.name), "ro")
      );
      const items = sorted
        .map((a) => buildAttractionAccordionItem(a, countryCode, null, isIntlContext, lang))
        .join("");
      const listOrGroupedHtml = `<ul class="attraction-accordion-list">${items}</ul>`;
      // Index alfabetic (Quick-Jump) — cerut explicit, pentru categoriile
      // mari (Italia/Germania, 100+ obiective) — DOAR literele care chiar
      // apar în această categorie, nu tot alfabetul (ar fi multe butoane
      // moarte, fără rost).
      const lettersPresent = [...new Set(sorted.map((a) => firstIndexLetter(a.name)))];
      const alphabetHtml = lettersPresent.length > 8
        ? `<div class="attraction-alpha-index">${lettersPresent
            .map((letter) => `<button type="button" class="alpha-index-btn" data-jump-letter="${escapeHtml(letter)}">${escapeHtml(letter)}</button>`)
            .join("")}</div>`
        : "";
      // Sortare "Recomandate primele" — DOAR dacă această categorie chiar
      // are măcar un obiectiv marcat (a.recommended) — altfel comutatorul
      // n-ar avea niciun efect vizibil, confuz pentru utilizator.
      const hasRecommended = sorted.some((a) => a.recommended);
      const sortToggleHtml = hasRecommended
        ? `<label class="category-context-filter category-sort-toggle"><input type="checkbox" class="category-recommended-first-checkbox"> ${escapeHtml(recommendedFirstLabelFor(lang))}</label>`
        : "";
      return `<details class="attraction-category-group">
        <summary class="attraction-category-summary">${escapeHtml(categoryLabelFor(cat, lang))} <span class="attraction-category-count">(${byCategory[cat].length})</span></summary>
        <label class="category-context-filter"><input type="checkbox" class="category-open-only-checkbox"> ${escapeHtml(openOnlyAttractionShortLabelFor(lang))}</label>
        ${sortToggleHtml}
        ${alphabetHtml}
        ${listOrGroupedHtml}
      </details>`;
    })
    .join("");
}

function buildAttractionAccordionItem(a, countryCode, cityLabel, isIntlContext, lang) {
  const at = ACCORDION_TEXTS[lang] || ACCORDION_TEXTS.uk;
  const cityAttr = cityLabel ? ` data-city="${escapeHtml(normalizeSlug(cityLabel))}"` : "";
  const slug = toDbSlug(a.name);
  const detailHref = isIntlContext ? `/${countryCode}/obiectiv/${slug}` : `/obiectiv/${slug}`;
  // displayName — DOAR pentru textul vizibil; data-name (mai jos) rămâne
  // numele ORIGINAL, canonic — folosit ca identificator pentru favorite,
  // dacă l-am fi tradus, un obiectiv salvat la favorite într-o limbă n-ar
  // mai fi recunoscut ca "același" în altă limbă.
  const displayName = translateAttractionName(a.name, lang);
  // Insigna "Recomandat" — cerut explicit: DOAR obiective mari, cunoscute,
  // marcate cu încredere reală (vezi a.recommended, câmp din date, aplicat
  // manual, nu ghicit) — NU "Doar Exterior" (ar necesita cunoștințe despre
  // starea fizică exactă a fiecărui loc, pe care nu le am fiabil).
  const recommendedBadge = a.recommended
    ? `<span class="attraction-recommended-badge" title="${escapeHtml(recommendedLabelFor(lang))}">👑</span>`
    : "";
  // Acces liber (poduri, lacuri, munți, șosele) — exact captura semnalată:
  // acordeonul arăta "Vezi dacă e deschis acum, live" + "Rezervă bilet
  // online" la Podul cu Lanțuri, Insula Margareta, Lacul Balaton — link
  // simplu spre detalii, fără pretenția unui status live, fără buton de
  // bilet (nimeni nu "rezervă" o vizită la un pod).
  const freeAccess = isFreeAccessAttraction(a.name);
  const isBeach = a.category === "plaje_organizate" || a.category === "plaje_salbatice";
  let panelHtml;
  if (isBeach) {
    // Cerut explicit: la plaje, NU "Vezi program" (nu au program fix) — link
    // spre "Descoperă această plajă" + buton Discover Cars dedesubt, fără
    // buton de bilet (plajele nu se "cumpără").
    panelHtml = `<a href="${escapeHtml(detailHref)}" class="accordion-status-link">${escapeHtml(discoverBeachLabelFor(lang))}</a>
      <div class="gyg-widget-fallback"><a href="${escapeHtml(carRentalLinkFor(a.city))}" target="_blank" rel="noopener sponsored" class="accordion-ticket-btn">${escapeHtml(beachTagLabelsFor(lang).access_car || "🚗")}</a></div>`;
  } else if (freeAccess) {
    panelHtml = `<a href="${escapeHtml(detailHref)}" class="accordion-status-link">${escapeHtml(freeAccessLabelFor(lang))}</a>`;
  } else {
    panelHtml = `<a href="${escapeHtml(detailHref)}" class="accordion-status-link">${escapeHtml(at.status)}</a>
      <div class="gyg-widget-fallback"><a href="${escapeHtml(ticketUrlFor(a.name))}" target="_blank" rel="noopener sponsored" class="accordion-ticket-btn">${escapeHtml(at.ticket)}</a></div>`;
  }
  return `<li class="attraction-accordion-item"${cityAttr} data-category="${escapeHtml(a.category || "")}" data-letter="${escapeHtml(firstIndexLetter(a.name))}" data-recommended="${a.recommended ? "true" : "false"}">
    <div class="attraction-accordion-header-row">
      <button type="button" class="fav-star" data-name="${escapeHtml(a.name)}" data-type="attraction" data-country="${escapeHtml(countryCode)}" data-href="${escapeHtml(detailHref)}">☆</button>
      <button type="button" class="attraction-accordion-header" aria-expanded="false">
        <span class="attraction-name">${recommendedBadge}${escapeHtml(displayName)}${cityLabel ? ` <span class="attraction-city-tag">· ${escapeHtml(cityLabel)}</span>` : ""}</span>
        <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
    </div>
    <div class="attraction-accordion-panel" hidden>
      ${panelHtml}
    </div>
  </li>`;
}

// cheie Google Maps JavaScript API — opțională. Dacă rămâne goală (""), harta
// folosește automat OpenStreetMap + Leaflet (gratuit, fără cont necesar).
// Dacă pui o cheie reală aici, site-ul comută automat pe Google Maps, fără
// nicio altă modificare de cod. Cheia se obține din Google Cloud Console →
// activezi "Maps JavaScript API" → creezi credențiale → restricționezi cheia
// la domeniile tale (programul-de-azi.ro, opening-hours-today.eu) și necesită
// un cont cu facturare activă (card bancar), chiar dacă rămâi în cota gratuită.
const googleMapsApiKey = "";
const linkAfiliatDedeman = "";
const linkAfiliatAltex = "";
const linkAfiliatJysk = "";

// hartă brand -> link de catalog/afiliere. Cheile trebuie să coincidă exact cu
// cheile din STORE_CONFIG de mai jos (forma colapsată, fără cratime).
// Restul brandurilor noi rămân "" — completează-le aici pe măsură ce primești
// aprobările, la fel cum ai făcut cu Lidl/Kaufland.
//
// Valoarea poate fi:
//  - un STRING gol "" -> fără buton de afiliere pe pagina acelui brand.
//  - un STRING cu un link -> buton fix, single-link (comportamentul vechi,
//    neschimbat — "🔥 Vezi catalogul cu reduceri X de azi").
//  - un ARRAY de linkuri -> "carusel de linkuri": un singur buton, cu textul
//    FIX "🛒 Cumpără online de la [Nume Magazin]" (nu se schimbă niciodată),
//    dar href-ul din spatele lui rotește automat prin toate linkurile din
//    array, la fiecare 7 secunde (vezi buildStoreAffiliateCarouselScript mai
//    jos) — util când ai mai multe linkuri de afiliere valide pentru ACELAȘI
//    brand (ex: mai multe programe/rețele de afiliere pentru Catena) și vrei
//    să le distribui expunerea, fără să aglomerezi pagina cu mai multe
//    butoane sau bannere. Un array cu un singur link e valid și el — href-ul
//    rămâne fix, dar poți adăuga altele oricând, fără nicio altă modificare
//    de cod.
const STORE_AFFILIATE_LINKS = {
  lidl: linkCatalogLidl,
  kaufland: linkCatalogKaufland,
  penny: "",
  megaimage: "",
  carrefour: "",
  auchan: "",
  profi: "",
  metro: "",
  selgros: "",
  dedeman: linkAfiliatDedeman,
  leroymerlin: "",
  bricodepot: "",
  hornbach: "",
  jysk: linkAfiliatJysk,
  ikea: "",
  momax: "",
  kik: "",
  mathaus: "",
  arabesque: "",
  xxxlutz: [
    "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=556733a1b&redirect_to=https%3A%2F%2Fxxxlutz.ro",
  ],
  altex: linkAfiliatAltex,
  flanco: "",
  dm: "",
  drmax: "",
  farmaciatei: "",
  remedia: "",
  springpharma: [
    "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=1ec3596e6&redirect_to=https%3A%2F%2Fwww.springfarma.com",
  ],
  catena: [
    {
      url: "https://event.2performant.com/events/click?ad_type=banner&unique=be9a074a6&aff_code=c647d7f92&campaign_unique=938c02434",
      banner: "https://img.2performant.com/system/paperclip/banner_pictures/pics/269655/original/269655.jpg",
      alt: "catenapascupas.ro",
    },
  ],
  sensiblu: "",
  helpnet: "",
  dona: "",
  ropharma: "",
  mrbricolage: "",
  cinemacity: "",
  cineplexx: "",
  happycinema: "",
  movieplex: "",
  bcr: "",
  brd: "",
  ing: "",
  raiffeisen: "",
  bancatransilvania: "",
  cec: "",
  posta: "",
  mcdonalds: "",
  kfc: "",
  burgerking: "",
  fancourier: "",
  cargus: "",
  sameday: "",
  dpd: "",
  gls: "",
};

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

// "Magazine partenere" generice (2Performant) — folosite ca FALLBACK, DOAR pe
// paginile de magazin care N-AU niciun link propriu în STORE_AFFILIATE_LINKS
// (marea majoritate: Penny, Mega Image, Carrefour, Sensiblu, DM ș.a.m.d.).
// Spre deosebire de caruselul per-brand de mai sus (unde textul e fix, un
// singur brand, mai multe linkuri), aici e un singur widget care rotește
// ATÂT numele cât și link-ul, din 7 în 7 secunde, prin toți partenerii —
// pentru că fiecare e un magazin diferit, nu variante ale aceluiași brand.
// Momentan doar text + link; quando primim bannerele reale de la fiecare
// partener, se pot înlocui ușor cu <img>, rotind img.src în loc de text
// (același script, aceeași structură de date).
const GENERIC_PARTNER_OFFERS = [
  { name: "Bazarul Online", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=d5075b651&redirect_to=https%3A%2F%2Fbazarulonline.ro%2F" },
  { name: "Librărie.net", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=da1148931&redirect_to=https%3A%2F%2Fwww.librarie.net%2F" },
  { name: "Zandra.ro", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=436288837&redirect_to=https%3A%2F%2Fzandra.ro" },
  { name: "Electric Sun", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=bd37fbb23&redirect_to=https%3A%2F%2FElectricSun.de" },
  {
    name: "BijuBox",
    url: "https://event.2performant.com/events/click?ad_type=banner&unique=e8588e01b&aff_code=c647d7f92&campaign_unique=2173f05f3",
    banner: "https://img.2performant.com/system/paperclip/banner_pictures/pics/214311/original/214311.png",
    alt: "bijubox.ro",
  },
  { name: "Biomag", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=e7e590bd1&redirect_to=https%3A%2F%2Fwww.Biomag.ro" },
  { name: "Brico.ro", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=8727b63f4&redirect_to=https%3A%2F%2Fwww.brico.ro%2F" },
  { name: "Comenzi.ro", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=b09908f08&redirect_to=https%3A%2F%2Fwww.comenzi.ro%2F" },
  { name: "Fără Dăunători", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=46f8cd5eb&redirect_to=https%3A%2F%2Fwww.fara-daunatori.ro" },
  { name: "Herbagetica", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=853fff54b&redirect_to=https%3A%2F%2Fherbagetica.ro%2F" },
  { name: "Încălțăminte la Modă", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=b0d815997&redirect_to=https%3A%2F%2Fwww.incaltamintelamoda.ro" },
  { name: "JoJo Fashion", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=9148cd6c4&redirect_to=https%3A%2F%2Fwww.jojofashion.ro" },
  { name: "Picadili", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=d404a783d&redirect_to=https%3A%2F%2Fpicadili.ro" },
  { name: "Prosoape Hotel", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=9dd5272cf&redirect_to=https%3A%2F%2Fwww.prosoapehotel.ro" },
];
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
  }, 7000);
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

/* ============================================================
   0.7) MULTILINGV — extindere internațională (DE/UK/ES)
   Paginile din România (RO) folosesc în continuare textele RO,
   scrise direct în funcțiile de randare — NU au fost atinse, ca să
   nu riscăm nimic din ce funcționează deja. Traducerile de mai jos
   alimentează DOAR paginile noi /:tara(de|uk|es|fr|it|pl|nl|at|be|dk|ro|se|pt|cz|fi|gr|hu|hr|ie|sk|si|lt|lv|ee|cy|mt|lu|tr)/... .
   "{time}" și "{label}" din stringurile de status sunt înlocuite
   dinamic, în JS-ul din telefonul vizitatorului (vezi buildClientScript).
   ============================================================ */
;

/* ============================================================
   0.8) MAGAZINE INTERNAȚIONALE — configurație separată per țară.
   Cheile pot coincide cu cele din STORE_CONFIG (RO) — ex. "lidl" —
   pentru că sunt obiecte complet separate, fără nicio legătură.
   Orele Lidl din Germania NU au nicio influență asupra orelor
   Lidl din România, și invers.
   ============================================================ */

// Germania: aproape toate magazinele sunt ÎNCHISE duminica prin lege
// ("Ladenschlussgesetz") — asta nu e o simplificare de-a noastră, e regula reală.
// Program unic pentru tot grupul (aldi, rewe, edeka, lidl, kaufland, media-markt):
// Luni-Sâmbătă 08:00-20:00, Duminică închis complet.
const DE_HOLIDAYS = [
  { date: "12-25", label: "Weihnachten (25. Dezember)", hours: null },
  { date: "01-01", label: "Neujahr (1. Januar)", hours: null },
];
function deSupermarketWeekly() {
  return [
    null, // Sonntag — închis prin lege
    { open: "08:00", close: "20:00" }, // Montag
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" }, // Samstag
  ];
}
;

// Suedia — 12 sărbători legale 2026, verificate (publicholidays.info). Program
// de supermarket real, cf. cercetării: L-S 07:00-22:00, Duminică program redus
// 09:00-21:00 (majoritatea supermarketurilor nordice rămân deschise duminica,
// spre deosebire de Germania, dar cu ore mai scurte).
const SE_HOLIDAYS = [
  { date: "01-01", label: "Nyårsdagen (1 januari)", hours: null },
  { date: "01-06", label: "Trettondedag jul (6 januari)", hours: { open: "10:00", close: "18:00" } },
  { date: "04-03", label: "Långfredagen (3 april 2026)", hours: { open: "10:00", close: "18:00" } },
  { date: "04-05", label: "Påskdagen (5 april 2026)", hours: null },
  { date: "04-06", label: "Annandag påsk (6 april 2026)", hours: { open: "10:00", close: "18:00" } },
  { date: "05-01", label: "Första maj (1 maj)", hours: { open: "10:00", close: "18:00" } },
  { date: "05-14", label: "Kristi himmelsfärdsdag (14 maj 2026)", hours: { open: "10:00", close: "18:00" } },
  { date: "06-06", label: "Sveriges nationaldag (6 juni)", hours: { open: "10:00", close: "18:00" } },
  { date: "06-19", label: "Midsommardagen (19 juni 2026)", hours: null },
  { date: "10-31", label: "Alla helgons dag (31 oktober 2026)", hours: { open: "10:00", close: "18:00" } },
  { date: "12-25", label: "Juldagen (25 december)", hours: null },
  { date: "12-26", label: "Annandag jul (26 december)", hours: { open: "10:00", close: "18:00" } },
];
function seSupermarketWeekly() {
  return [
    { open: "09:00", close: "21:00" }, // Söndag
    { open: "07:00", close: "22:00" },
    { open: "07:00", close: "22:00" },
    { open: "07:00", close: "22:00" },
    { open: "07:00", close: "22:00" },
    { open: "07:00", close: "22:00" },
    { open: "07:00", close: "22:00" }, // Lördag
  ];
}
// ICA, Coop, Willys — cele mai răspândite lanțuri, prezente aproape peste
// tot; Lidl — confirmat, cu adrese reale, în toate cele 10 orașe alese
const SE_STORE_CONFIG = {
  ica: { name: "ICA", weekly: seSupermarketWeekly(), holidays: SE_HOLIDAYS },
  coop: { name: "Coop", weekly: seSupermarketWeekly(), holidays: SE_HOLIDAYS },
  willys: { name: "Willys", weekly: seSupermarketWeekly(), holidays: SE_HOLIDAYS },
  lidl: { name: "Lidl", weekly: seSupermarketWeekly(), holidays: SE_HOLIDAYS },
};

// Portugalia — 13 sărbători naționale 2026, verificate. Spre deosebire de
// Germania, magazinele RĂMÂN DESCHISE aproape de fiecare sărbătoare (confirmat
// explicit pentru 15 august — Continente, Pingo Doce, Lidl deschise normal);
// doar 1 ianuarie și 25 decembrie au program redus/închis, universal.
const PT_HOLIDAYS = [
  { date: "01-01", label: "Ano Novo (1 de janeiro)", hours: null },
  { date: "04-03", label: "Sexta-feira Santa (3 de abril 2026)", hours: { open: "09:00", close: "20:00" } },
  { date: "04-05", label: "Páscoa (5 de abril 2026)", hours: { open: "09:00", close: "20:00" } },
  { date: "04-25", label: "Dia da Liberdade (25 de abril)", hours: { open: "08:00", close: "21:00" } },
  { date: "05-01", label: "Dia do Trabalhador (1 de maio)", hours: { open: "09:00", close: "20:00" } },
  { date: "06-04", label: "Corpo de Deus (4 de junho 2026)", hours: { open: "08:00", close: "21:00" } },
  { date: "06-10", label: "Dia de Portugal (10 de junho)", hours: { open: "08:00", close: "21:00" } },
  { date: "08-15", label: "Assunção de Nossa Senhora (15 de agosto)", hours: { open: "08:00", close: "21:00" } },
  { date: "10-05", label: "Implantação da República (5 de outubro)", hours: { open: "08:00", close: "21:00" } },
  { date: "11-01", label: "Dia de Todos os Santos (1 de novembro)", hours: { open: "08:00", close: "21:00" } },
  { date: "12-01", label: "Restauração da Independência (1 de dezembro)", hours: { open: "08:00", close: "21:00" } },
  { date: "12-08", label: "Imaculada Conceição (8 de dezembro)", hours: { open: "08:00", close: "21:00" } },
  { date: "12-25", label: "Natal (25 de dezembro)", hours: null },
];
function ptSupermarketWeekly() {
  return [
    { open: "08:30", close: "21:00" }, // Domingo — deschis, spre deosebire de Germania
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" }, // Sábado
  ];
}
// Continente, Pingo Doce, Lidl — cele 3 branduri universale, confirmate,
// prezente aproape peste tot (Continente ajunge la 87,5% din gospodării)
const PT_STORE_CONFIG = {
  continente: { name: "Continente", weekly: ptSupermarketWeekly(), holidays: PT_HOLIDAYS },
  pingodoce: { name: "Pingo Doce", slug: "pingo-doce", weekly: ptSupermarketWeekly(), holidays: PT_HOLIDAYS },
  lidl: { name: "Lidl", weekly: ptSupermarketWeekly(), holidays: PT_HOLIDAYS },
};

// Cehia — lege reală, verificată (Act No. 245/2000): magazinele peste 200m²
// TREBUIE închise complet în 7 zile specifice; restul sărbătorilor (1 mai,
// 5-6 iulie, 17 noiembrie) rămân deschise normal — confirmat explicit, nu
// presupus. 24 decembrie: program redus, închidere obligatorie la 12:00.
const CZ_HOLIDAYS = [
  { date: "01-01", label: "Den obnovy samostatného českého státu (1. ledna)", hours: null },
  { date: "04-06", label: "Velikonoční pondělí (6. dubna 2026)", hours: null },
  { date: "05-01", label: "Svátek práce (1. května)", hours: { open: "08:00", close: "20:00" } },
  { date: "05-08", label: "Den vítězství (8. května)", hours: null },
  { date: "07-05", label: "Den slovanských věrozvěstů (5. července)", hours: { open: "08:00", close: "20:00" } },
  { date: "07-06", label: "Den upálení mistra Jana Husa (6. července)", hours: { open: "08:00", close: "20:00" } },
  { date: "09-28", label: "Den české státnosti (28. září)", hours: null },
  { date: "10-28", label: "Den vzniku samostatného československého státu (28. října)", hours: null },
  { date: "11-17", label: "Den boje za svobodu a demokracii (17. listopadu)", hours: { open: "08:00", close: "20:00" } },
  { date: "12-24", label: "Štědrý den (24. prosince) — zavírací doba 12:00", hours: { open: "07:00", close: "12:00" } },
  { date: "12-25", label: "1. svátek vánoční (25. prosince)", hours: null },
  { date: "12-26", label: "2. svátek vánoční (26. prosince)", hours: null },
];
function czSupermarketWeekly() {
  return [
    { open: "08:00", close: "20:00" }, // Neděle
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" }, // Sobota
  ];
}
// Lidl, Kaufland, Albert, Billa, Tesco — toate cu prezență mare, confirmată,
// cotă de piață semnificativă fiecare (peste 140 de magazine, minimum)
const CZ_STORE_CONFIG = {
  lidl: { name: "Lidl", weekly: czSupermarketWeekly(), holidays: CZ_HOLIDAYS },
  kaufland: { name: "Kaufland", weekly: czSupermarketWeekly(), holidays: CZ_HOLIDAYS },
  albert: { name: "Albert", weekly: czSupermarketWeekly(), holidays: CZ_HOLIDAYS },
  billa: { name: "Billa", weekly: czSupermarketWeekly(), holidays: CZ_HOLIDAYS },
  tesco: { name: "Tesco", weekly: czSupermarketWeekly(), holidays: CZ_HOLIDAYS },
};

// Finlanda — 13 sărbători 2026, verificate (publicholidays + officeholidays,
// încrucișate). Spre deosebire de Cehia (lege strictă), magazinele finlandeze
// rămân MAJORITATEA deschise, chiar și de sărbători, doar cu ore reduse
// ("modul de duminică") — confirmat explicit pentru Ajun, Boxing Day.
// 25 decembrie rămâne totuși închis complet, universal.
const FI_HOLIDAYS = [
  { date: "01-01", label: "Uudenvuodenpäivä (1. tammikuuta)", hours: { open: "10:00", close: "18:00" } },
  { date: "01-06", label: "Loppiainen (6. tammikuuta)", hours: { open: "10:00", close: "18:00" } },
  { date: "04-03", label: "Pitkäperjantai (3. huhtikuuta 2026)", hours: { open: "10:00", close: "18:00" } },
  { date: "04-05", label: "Pääsiäispäivä (5. huhtikuuta 2026)", hours: { open: "10:00", close: "18:00" } },
  { date: "04-06", label: "2. pääsiäispäivä (6. huhtikuuta 2026)", hours: { open: "10:00", close: "18:00" } },
  { date: "05-01", label: "Vappu (1. toukokuuta)", hours: { open: "08:00", close: "21:00" } },
  { date: "05-14", label: "Helatorstai (14. toukokuuta 2026)", hours: { open: "10:00", close: "18:00" } },
  { date: "05-24", label: "Helluntaipäivä (24. toukokuuta 2026)", hours: { open: "10:00", close: "18:00" } },
  { date: "06-20", label: "Juhannuspäivä (20. kesäkuuta 2026)", hours: { open: "10:00", close: "18:00" } },
  { date: "10-31", label: "Pyhäinpäivä (31. lokakuuta 2026)", hours: { open: "12:00", close: "18:00" } },
  { date: "12-06", label: "Itsenäisyyspäivä (6. joulukuuta)", hours: { open: "08:00", close: "21:00" } },
  { date: "12-24", label: "Jouluaatto (24. joulukuuta) — lyhennetty", hours: { open: "08:00", close: "12:00" } },
  { date: "12-25", label: "Joulupäivä (25. joulukuuta)", hours: null },
  { date: "12-26", label: "Tapaninpäivä (26. joulukuuta) — sunnuntai-aukiolo", hours: { open: "10:00", close: "20:00" } },
];
function fiSupermarketWeekly() {
  return [
    { open: "10:00", close: "20:00" }, // Sunnuntai
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" }, // Lauantai
  ];
}
// Prisma (S Group), K-Citymarket (K Group), Lidl — cele 3 branduri
// universale, confirmate, împreună peste 80%+ din piața de retail alimentar
const FI_STORE_CONFIG = {
  prisma: { name: "Prisma", weekly: fiSupermarketWeekly(), holidays: FI_HOLIDAYS },
  kcitymarket: { name: "K-Citymarket", slug: "k-citymarket", weekly: fiSupermarketWeekly(), holidays: FI_HOLIDAYS },
  lidl: { name: "Lidl", weekly: fiSupermarketWeekly(), holidays: FI_HOLIDAYS },
};

// Grecia — 13 sărbători 2026, calendar ortodox (Paște 12 aprilie 2026,
// verificat încrucișat cu data folosită deja pentru România). Confirmat
// direct, cu surse din presă: Lidl rămâne cel mai adesea deschis, cu ore
// reduse, chiar și de Luni Curată/Duminica Floriilor, când lanțurile grecești
// mari (Sklavenitis, AB) închid complet.
const GR_HOLIDAYS = [
  { date: "01-01", label: "Πρωτοχρονιά (1 Ιανουαρίου)", hours: null },
  { date: "01-06", label: "Θεοφάνεια (6 Ιανουαρίου)", hours: { open: "11:00", close: "18:00" } },
  { date: "02-23", label: "Καθαρά Δευτέρα (23 Φεβρουαρίου 2026)", hours: { open: "07:45", close: "16:00" } },
  { date: "03-25", label: "Εθνική Εορτή (25 Μαρτίου)", hours: null },
  { date: "04-10", label: "Μεγάλη Παρασκευή (10 Απριλίου 2026)", hours: { open: "11:00", close: "18:00" } },
  { date: "04-12", label: "Πάσχα (12 Απριλίου 2026)", hours: null },
  { date: "04-13", label: "Δευτέρα του Πάσχα (13 Απριλίου 2026)", hours: { open: "11:00", close: "18:00" } },
  { date: "05-01", label: "Εργατική Πρωτομαγιά (1 Μαΐου)", hours: null },
  { date: "06-01", label: "Αγίου Πνεύματος (1 Ιουνίου 2026)", hours: { open: "11:00", close: "18:00" } },
  { date: "08-15", label: "Κοίμηση της Θεοτόκου (15 Αυγούστου)", hours: null },
  { date: "10-28", label: "Ημέρα του Όχι (28 Οκτωβρίου)", hours: null },
  { date: "12-25", label: "Χριστούγεννα (25 Δεκεμβρίου)", hours: null },
  { date: "12-26", label: "Σύναξις Θεοτόκου (26 Δεκεμβρίου)", hours: null },
];
function grSupermarketWeekly() {
  return [
    null, // Κυριακή — majoritatea închise, în afara zonelor turistice/Duminicilor de vânzări speciale
    { open: "07:45", close: "21:00" },
    { open: "07:45", close: "21:00" },
    { open: "07:45", close: "21:00" },
    { open: "07:45", close: "21:00" },
    { open: "07:45", close: "21:00" },
    { open: "07:45", close: "20:00" }, // Σάββατο
  ];
}
// Sklavenitis, Lidl, AB Vassilopoulos (Alfa-Beta), Masoutis — cele 4
// branduri cu cea mai mare prezență națională, confirmate
;

// Ungaria — 13 sărbători 2026, verificate cu surse multiple concordante.
// Spre deosebire de Grecia, legea ungară e strictă: lanțurile mari sunt
// ÎNCHISE COMPLET, prin lege, în aproape toate sărbătorile — confirmat
// explicit pentru Ziua Sfântului Ștefan (20 august): "legea interzice
// complet deschiderea marilor lanțuri de retail".
const HU_HOLIDAYS = [
  { date: "01-01", label: "Újév (január 1.)", hours: null },
  { date: "01-02", label: "Pihenőnap (január 2.)", hours: null },
  { date: "03-15", label: "Nemzeti ünnep (március 15.)", hours: null },
  { date: "04-03", label: "Nagypéntek (2026. április 3.)", hours: null },
  { date: "04-05", label: "Húsvétvasárnap (2026. április 5.)", hours: null },
  { date: "04-06", label: "Húsvéthétfő (2026. április 6.)", hours: null },
  { date: "05-01", label: "A munka ünnepe (május 1.)", hours: null },
  { date: "05-24", label: "Pünkösdvasárnap (2026. május 24.)", hours: null },
  { date: "05-25", label: "Pünkösdhétfő (2026. május 25.)", hours: null },
  { date: "08-20", label: "Államalapítás ünnepe (augusztus 20.)", hours: null },
  { date: "10-23", label: "Nemzeti ünnep (október 23.)", hours: null },
  { date: "12-24", label: "Pihenőnap (december 24.) — rövidített nyitvatartás", hours: { open: "07:00", close: "12:00" } },
  { date: "12-25", label: "Karácsony (december 25.)", hours: null },
  { date: "12-26", label: "Karácsony másnapja (december 26.)", hours: null },
];
function huSupermarketWeekly() {
  return [
    { open: "07:00", close: "18:00" }, // Vasárnap
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" }, // Szombat
  ];
}
// Lidl, Spar, Tesco, Penny, Aldi — cele 5 branduri cu cea mai mare
// prezență națională, confirmate, verificate individual
const HU_STORE_CONFIG = {
  lidl: { name: "Lidl", weekly: huSupermarketWeekly(), holidays: HU_HOLIDAYS },
  spar: { name: "Spar", weekly: huSupermarketWeekly(), holidays: HU_HOLIDAYS },
  tesco: { name: "Tesco", weekly: huSupermarketWeekly(), holidays: HU_HOLIDAYS },
  penny: { name: "Penny", weekly: huSupermarketWeekly(), holidays: HU_HOLIDAYS },
  aldi: { name: "Aldi", weekly: huSupermarketWeekly(), holidays: HU_HOLIDAYS },
};

// Croația — 14 sărbători legale 2026 (Zakon o blagdanima), verificate pe
// Wikipedia + surse de presă. Lege strictă: majoritatea magazinelor mari
// TREBUIE închise complet — confirmat explicit pentru Velika Gospa (15
// august): doar magazinele din gări, aeroporturi, benzinării rămân deschise.
const HR_HOLIDAYS = [
  { date: "01-01", label: "Nova godina (1. siječnja)", hours: null },
  { date: "01-06", label: "Sveta tri kralja (6. siječnja)", hours: null },
  { date: "04-05", label: "Uskrs (5. travnja 2026.)", hours: null },
  { date: "04-06", label: "Uskrsni ponedjeljak (6. travnja 2026.)", hours: null },
  { date: "05-01", label: "Praznik rada (1. svibnja)", hours: null },
  { date: "05-30", label: "Dan državnosti (30. svibnja)", hours: null },
  { date: "06-04", label: "Tijelovo (4. lipnja 2026.)", hours: null },
  { date: "06-22", label: "Dan antifašističke borbe (22. lipnja)", hours: null },
  { date: "08-05", label: "Dan pobjede i domovinske zahvalnosti (5. kolovoza)", hours: null },
  { date: "08-15", label: "Velika Gospa (15. kolovoza)", hours: null },
  { date: "11-01", label: "Dan svih svetih (1. studenoga)", hours: null },
  { date: "11-18", label: "Dan sjećanja - Vukovar i Škabrnja (18. studenoga)", hours: null },
  { date: "12-25", label: "Božić (25. prosinca)", hours: null },
  { date: "12-26", label: "Sveti Stjepan (26. prosinca)", hours: null },
];
function hrSupermarketWeekly() {
  return [
    { open: "08:00", close: "13:00" }, // Nedjelja — foarte redus, lege "16 Duminici pe an" limitează operarea normală
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" }, // Subota
  ];
}
// Konzum, Lidl, Plodine, Spar, Kaufland — cele 5 branduri cu cea mai mare
// prezență națională, confirmate individual, cu adrese reale
const HR_STORE_CONFIG = {
  konzum: { name: "Konzum", weekly: hrSupermarketWeekly(), holidays: HR_HOLIDAYS },
  lidl: { name: "Lidl", weekly: hrSupermarketWeekly(), holidays: HR_HOLIDAYS },
  plodine: { name: "Plodine", weekly: hrSupermarketWeekly(), holidays: HR_HOLIDAYS },
  spar: { name: "Spar", weekly: hrSupermarketWeekly(), holidays: HR_HOLIDAYS },
  kaufland: { name: "Kaufland", weekly: hrSupermarketWeekly(), holidays: HR_HOLIDAYS },
};

// Irlanda — 10 sărbători oficiale 2026, verificate. Particularitate reală,
// confirmată (nu presupusă): Vinerea Mare NU e sărbătoare legală în
// Irlanda, spre deosebire de restul Europei — magazinele funcționează
// normal în acea zi. Doar 1 ianuarie și 25 decembrie sunt închise complet
// — restul sărbătorilor ("bank holidays" de luni), magazinele mari rămân
// deschise, cu ore apropiate de cele normale (confirmat pentru Tesco/Dunnes).
const IE_HOLIDAYS = [
  { date: "01-01", label: "New Year's Day (1 January)", hours: null },
  { date: "02-02", label: "St Brigid's Day (2 February 2026)", hours: { open: "10:00", close: "18:00" } },
  { date: "03-17", label: "St Patrick's Day (17 March)", hours: { open: "10:00", close: "18:00" } },
  { date: "04-06", label: "Easter Monday (6 April 2026)", hours: { open: "09:00", close: "18:00" } },
  { date: "05-04", label: "May Bank Holiday (4 May 2026)", hours: { open: "08:00", close: "21:00" } },
  { date: "06-01", label: "June Bank Holiday (1 June 2026)", hours: { open: "08:00", close: "21:00" } },
  { date: "08-03", label: "August Bank Holiday (3 August 2026)", hours: { open: "08:00", close: "21:00" } },
  { date: "10-26", label: "October Bank Holiday (26 October 2026)", hours: { open: "08:00", close: "21:00" } },
  { date: "12-25", label: "Christmas Day (25 December)", hours: null },
  { date: "12-26", label: "St Stephen's Day (26 December)", hours: { open: "10:00", close: "18:00" } },
];
function ieSupermarketWeekly() {
  return [
    { open: "10:00", close: "19:00" }, // Sunday
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" }, // Saturday
  ];
}
// Tesco, Dunnes Stores, SuperValu, Aldi, Lidl — cele 5 branduri cu cea mai
// mare prezență națională, confirmate individual
const IE_STORE_CONFIG = {
  tesco: { name: "Tesco", weekly: ieSupermarketWeekly(), holidays: IE_HOLIDAYS },
  dunnesstores: { name: "Dunnes Stores", slug: "dunnes-stores", weekly: ieSupermarketWeekly(), holidays: IE_HOLIDAYS },
  supervalu: { name: "SuperValu", weekly: ieSupermarketWeekly(), holidays: IE_HOLIDAYS },
  aldi: { name: "Aldi", weekly: ieSupermarketWeekly(), holidays: IE_HOLIDAYS },
  lidl: { name: "Lidl", weekly: ieSupermarketWeekly(), holidays: IE_HOLIDAYS },
};

// Slovacia — 15 sărbători legale 2026 (cele mai multe din UE), lege strictă
// confirmată explicit: "Slovak law permits 24-hour and Sunday shopping but
// requires stores to be closed on public holidays" — și confirmat separat
// pentru Paște (Tesco închis complet Vinerea Mare, Duminică, Luni).
const SK_HOLIDAYS = [
  { date: "01-01", label: "Deň vzniku Slovenskej republiky (1. januára)", hours: null },
  { date: "01-06", label: "Zjavenie Pána (6. januára)", hours: null },
  { date: "04-03", label: "Veľký piatok (3. apríla 2026)", hours: null },
  { date: "04-06", label: "Veľkonočný pondelok (6. apríla 2026)", hours: null },
  { date: "05-01", label: "Sviatok práce (1. mája)", hours: null },
  { date: "05-08", label: "Deň víťazstva nad fašizmom (8. mája)", hours: null },
  { date: "07-05", label: "Sviatok svätého Cyrila a svätého Metoda (5. júla)", hours: null },
  { date: "08-29", label: "Výročie SNP (29. augusta)", hours: null },
  { date: "09-01", label: "Deň Ústavy SR (1. septembra)", hours: null },
  { date: "09-15", label: "Sedembolestná Panna Mária (15. septembra)", hours: null },
  { date: "11-01", label: "Sviatok všetkých svätých (1. novembra)", hours: null },
  { date: "11-17", label: "Deň boja za slobodu a demokraciu (17. novembra)", hours: null },
  { date: "12-24", label: "Štedrý deň (24. decembra)", hours: null },
  { date: "12-25", label: "Prvý sviatok vianočný (25. decembra)", hours: null },
  { date: "12-26", label: "Druhý sviatok vianočný (26. decembra)", hours: null },
];
function skSupermarketWeekly() {
  return [
    { open: "08:00", close: "20:00" }, // Nedeľa
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" }, // Sobota
  ];
}
// Tesco, Lidl, Kaufland, Billa, COOP Jednota — cele 5 branduri cu cea mai
// mare prezență națională, confirmate individual
const SK_STORE_CONFIG = {
  tesco: { name: "Tesco", weekly: skSupermarketWeekly(), holidays: SK_HOLIDAYS },
  lidl: { name: "Lidl", weekly: skSupermarketWeekly(), holidays: SK_HOLIDAYS },
  kaufland: { name: "Kaufland", weekly: skSupermarketWeekly(), holidays: SK_HOLIDAYS },
  billa: { name: "Billa", weekly: skSupermarketWeekly(), holidays: SK_HOLIDAYS },
  coopjednota: { name: "COOP Jednota", slug: "coop-jednota", weekly: skSupermarketWeekly(), holidays: SK_HOLIDAYS },
};

// Slovenia — 15 sărbători 2026, verificate. Particularitate legală
// distinctivă, confirmată explicit (Legea Comerțului, ZT-1, în vigoare din
// 2025): DUMINICA magazinele sunt închise prin lege, aproape peste tot —
// nu doar obicei, ca în alte țări. La fel, toate sărbătorile legale.
const SI_HOLIDAYS = [
  { date: "01-01", label: "Novo leto (1. januar)", hours: null },
  { date: "01-02", label: "Novo leto (2. januar)", hours: null },
  { date: "02-08", label: "Prešernov dan (8. februar)", hours: null },
  { date: "04-05", label: "Velika noč (5. april 2026)", hours: null },
  { date: "04-06", label: "Velikonočni ponedeljek (6. april 2026)", hours: null },
  { date: "04-27", label: "Dan upora proti okupatorju (27. april)", hours: null },
  { date: "05-01", label: "Praznik dela (1. maj)", hours: null },
  { date: "05-02", label: "Praznik dela (2. maj)", hours: null },
  { date: "05-25", label: "Binkošti (25. maj 2026)", hours: null },
  { date: "06-25", label: "Dan državnosti (25. junij)", hours: null },
  { date: "08-15", label: "Marijino vnebovzetje (15. avgust)", hours: null },
  { date: "10-31", label: "Dan reformacije (31. oktober)", hours: null },
  { date: "11-01", label: "Dan spomina na mrtve (1. november)", hours: null },
  { date: "12-25", label: "Božič (25. december)", hours: null },
  { date: "12-26", label: "Dan samostojnosti in enotnosti (26. december)", hours: null },
];
function siSupermarketWeekly() {
  return [
    null, // Nedelja — prin lege, aproape toate magazinele sunt închise
    { open: "07:30", close: "20:00" },
    { open: "07:30", close: "20:00" },
    { open: "07:30", close: "20:00" },
    { open: "07:30", close: "20:00" },
    { open: "07:30", close: "20:00" },
    { open: "07:30", close: "17:00" }, // Sobota
  ];
}
// Mercator, Spar, Hofer (Aldi), Lidl, Tuš — cele 5 branduri cu cea mai mare
// prezență națională, confirmate individual
const SI_STORE_CONFIG = {
  mercator: { name: "Mercator", weekly: siSupermarketWeekly(), holidays: SI_HOLIDAYS },
  spar: { name: "Spar", weekly: siSupermarketWeekly(), holidays: SI_HOLIDAYS },
  hofer: { name: "Hofer", weekly: siSupermarketWeekly(), holidays: SI_HOLIDAYS },
  lidl: { name: "Lidl", weekly: siSupermarketWeekly(), holidays: SI_HOLIDAYS },
  tus: { name: "Tuš", weekly: siSupermarketWeekly(), holidays: SI_HOLIDAYS },
};

// Lituania — 13 sărbători 2026, verificate. Spre deosebire de Slovacia/
// Slovenia, magazinele mari RĂMÂN DESCHISE de sărbători, cu ore reduse —
// confirmat explicit: doar 25 decembrie complet închis; 1 ianuarie, Ajunul
// și 26 decembrie au program redus, nu închidere.
const LT_HOLIDAYS = [
  { date: "01-01", label: "Naujieji metai (sausio 1 d.)", hours: { open: "10:00", close: "20:00" } },
  { date: "02-16", label: "Lietuvos valstybės atkūrimo diena (vasario 16 d.)", hours: { open: "09:00", close: "21:00" } },
  { date: "03-11", label: "Nepriklausomybės atkūrimo diena (kovo 11 d.)", hours: { open: "09:00", close: "21:00" } },
  { date: "04-05", label: "Velykos (2026 m. balandžio 5 d.)", hours: { open: "10:00", close: "18:00" } },
  { date: "04-06", label: "Velykų antroji diena (2026 m. balandžio 6 d.)", hours: { open: "09:00", close: "21:00" } },
  { date: "05-01", label: "Tarptautinė darbo diena (gegužės 1 d.)", hours: { open: "09:00", close: "21:00" } },
  { date: "07-06", label: "Valstybės diena (liepos 6 d.)", hours: { open: "09:00", close: "21:00" } },
  { date: "08-15", label: "Žolinė (rugpjūčio 15 d.)", hours: { open: "09:00", close: "21:00" } },
  { date: "11-01", label: "Visų šventųjų diena (lapkričio 1 d.)", hours: { open: "09:00", close: "21:00" } },
  { date: "11-02", label: "Vėlinės (lapkričio 2 d.)", hours: { open: "09:00", close: "21:00" } },
  { date: "12-24", label: "Šv. Kūčios (gruodžio 24 d.) — trumpiau", hours: { open: "08:00", close: "18:00" } },
  { date: "12-25", label: "Šv. Kalėdos (gruodžio 25 d.)", hours: null },
  { date: "12-26", label: "Antroji Kalėdų diena (gruodžio 26 d.)", hours: { open: "09:00", close: "21:00" } },
];
function ltSupermarketWeekly() {
  return [
    { open: "09:00", close: "21:00" }, // Sekmadienis
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" }, // Šeštadienis
  ];
}
// Maxima, Lidl, IKI, Norfa, Rimi — cele 5 branduri cu cea mai mare
// prezență națională, confirmate individual
const LT_STORE_CONFIG = {
  maxima: { name: "Maxima", weekly: ltSupermarketWeekly(), holidays: LT_HOLIDAYS },
  lidl: { name: "Lidl", weekly: ltSupermarketWeekly(), holidays: LT_HOLIDAYS },
  iki: { name: "IKI", weekly: ltSupermarketWeekly(), holidays: LT_HOLIDAYS },
  norfa: { name: "Norfa", weekly: ltSupermarketWeekly(), holidays: LT_HOLIDAYS },
  rimi: { name: "Rimi", weekly: ltSupermarketWeekly(), holidays: LT_HOLIDAYS },
};

// Letonia — 14 sărbători 2026, verificate. Similar cu Lituania — magazinele
// mari (Rimi, Maxima) rămân majoritar DESCHISE de sărbători, cu ore reduse,
// confirmat explicit; doar 25 decembrie tratat ca închis complet.
const LV_HOLIDAYS = [
  { date: "01-01", label: "Jaunais gads (1. janvāris)", hours: { open: "10:00", close: "20:00" } },
  { date: "04-03", label: "Lielā Piektdiena (2026. gada 3. aprīlis)", hours: { open: "09:00", close: "20:00" } },
  { date: "04-05", label: "Lieldienas (2026. gada 5. aprīlis)", hours: { open: "10:00", close: "18:00" } },
  { date: "04-06", label: "Otrās Lieldienas (2026. gada 6. aprīlis)", hours: { open: "09:00", close: "21:00" } },
  { date: "05-01", label: "Darba svētki (1. maijs)", hours: { open: "09:00", close: "21:00" } },
  { date: "05-04", label: "Neatkarības atjaunošanas diena (4. maijs)", hours: { open: "09:00", close: "21:00" } },
  { date: "05-24", label: "Vasarsvētki (2026. gada 24. maijs)", hours: { open: "09:00", close: "21:00" } },
  { date: "06-23", label: "Līgo diena (23. jūnijs)", hours: { open: "08:00", close: "18:00" } },
  { date: "06-24", label: "Jāņi (24. jūnijs)", hours: { open: "10:00", close: "18:00" } },
  { date: "11-18", label: "Latvijas Republikas proklamēšanas diena (18. novembris)", hours: { open: "09:00", close: "21:00" } },
  { date: "12-24", label: "Ziemassvētku vakars (24. decembris) — īsāk", hours: { open: "08:00", close: "18:00" } },
  { date: "12-25", label: "Ziemassvētki (25. decembris)", hours: null },
  { date: "12-26", label: "Otrie Ziemassvētki (26. decembris)", hours: { open: "09:00", close: "21:00" } },
  { date: "12-31", label: "Vecgada vakars (31. decembris) — īsāk", hours: { open: "08:00", close: "20:00" } },
];
function lvSupermarketWeekly() {
  return [
    { open: "09:00", close: "21:00" }, // Svētdiena
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" }, // Sestdiena
  ];
}
// Rimi, Maxima, Lidl, Spar — cele 4 branduri cu cea mai mare prezență
// națională, confirmate individual
const LV_STORE_CONFIG = {
  rimi: { name: "Rimi", weekly: lvSupermarketWeekly(), holidays: LV_HOLIDAYS },
  maxima: { name: "Maxima", weekly: lvSupermarketWeekly(), holidays: LV_HOLIDAYS },
  lidl: { name: "Lidl", weekly: lvSupermarketWeekly(), holidays: LV_HOLIDAYS },
  spar: { name: "Spar", weekly: lvSupermarketWeekly(), holidays: LV_HOLIDAYS },
};

// Estonia — 12 sărbători 2026, verificate. La fel ca restul Balticelor,
// magazinele mari rămân majoritar DESCHISE de sărbători, chiar și de
// Ziua Victoriei și Solstițiul de Vară (Jaanipäev) — confirmat explicit:
// "Rimi, Coop, Maxima, Selver and Prisma... will largely be open".
const EE_HOLIDAYS = [
  { date: "01-01", label: "Uusaasta (1. jaanuar)", hours: { open: "10:00", close: "20:00" } },
  { date: "02-24", label: "Iseseisvuspäev (24. veebruar)", hours: { open: "09:00", close: "21:00" } },
  { date: "04-03", label: "Suur Reede (2026. aasta 3. aprill)", hours: { open: "09:00", close: "20:00" } },
  { date: "04-05", label: "Ülestõusmispühad (2026. aasta 5. aprill)", hours: { open: "10:00", close: "18:00" } },
  { date: "05-01", label: "Kevadpüha (1. mai)", hours: { open: "09:00", close: "21:00" } },
  { date: "05-24", label: "Nelipühad (2026. aasta 24. mai)", hours: { open: "09:00", close: "21:00" } },
  { date: "06-23", label: "Võidupüha (23. juuni)", hours: { open: "09:00", close: "21:00" } },
  { date: "06-24", label: "Jaanipäev (24. juuni)", hours: { open: "10:00", close: "18:00" } },
  { date: "08-20", label: "Taasiseseisvumispäev (20. august)", hours: { open: "09:00", close: "21:00" } },
  { date: "12-24", label: "Jõululaupäev (24. detsember) — lühem", hours: { open: "08:00", close: "18:00" } },
  { date: "12-25", label: "Esimene jõulupüha (25. detsember)", hours: null },
  { date: "12-26", label: "Teine jõulupüha (26. detsember)", hours: { open: "09:00", close: "21:00" } },
];
function eeSupermarketWeekly() {
  return [
    { open: "09:00", close: "21:00" }, // Pühapäev
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" }, // Laupäev
  ];
}
// Selver, Coop, Maxima, Rimi, Lidl — cele 5 branduri cu cea mai mare
// prezență națională, confirmate individual
const EE_STORE_CONFIG = {
  selver: { name: "Selver", weekly: eeSupermarketWeekly(), holidays: EE_HOLIDAYS },
  coop: { name: "Coop", weekly: eeSupermarketWeekly(), holidays: EE_HOLIDAYS },
  maxima: { name: "Maxima", weekly: eeSupermarketWeekly(), holidays: EE_HOLIDAYS },
  rimi: { name: "Rimi", weekly: eeSupermarketWeekly(), holidays: EE_HOLIDAYS },
  lidl: { name: "Lidl", weekly: eeSupermarketWeekly(), holidays: EE_HOLIDAYS },
};

// Cipru — 15 sărbători 2026, verificate. Magazinele mari rămân majoritar
// DESCHISE de sărbători, confirmat explicit: "In tourist areas, supermarkets
// and shops often remain open on holidays (except usually Easter Sunday and
// Christmas Day)" — doar Paștele Ortodox (Duminică) și Crăciunul sunt
// tratate ca zile de închidere completă.
const CY_HOLIDAYS = [
  { date: "01-01", label: "Πρωτοχρονιά (1 Ιανουαρίου)", hours: { open: "09:00", close: "18:00" } },
  { date: "01-06", label: "Θεοφάνεια (6 Ιανουαρίου)", hours: { open: "09:00", close: "18:00" } },
  { date: "02-23", label: "Καθαρά Δευτέρα (23 Φεβρουαρίου 2026)", hours: { open: "09:00", close: "18:00" } },
  { date: "03-25", label: "Ελληνική Ημέρα Ανεξαρτησίας (25 Μαρτίου)", hours: { open: "09:00", close: "18:00" } },
  { date: "04-01", label: "Εθνική Ημέρα Κύπρου (1 Απριλίου)", hours: { open: "09:00", close: "18:00" } },
  { date: "04-10", label: "Μεγάλη Παρασκευή (10 Απριλίου 2026)", hours: { open: "09:00", close: "15:00" } },
  { date: "04-12", label: "Κυριακή του Πάσχα (12 Απριλίου 2026)", hours: null },
  { date: "04-13", label: "Δευτέρα του Πάσχα (13 Απριλίου 2026)", hours: { open: "09:00", close: "18:00" } },
  { date: "05-01", label: "Πρωτομαγιά (1 Μαΐου)", hours: { open: "09:00", close: "18:00" } },
  { date: "06-01", label: "Αγίου Πνεύματος (1 Ιουνίου 2026)", hours: { open: "09:00", close: "18:00" } },
  { date: "08-15", label: "Κοίμηση της Θεοτόκου (15 Αυγούστου)", hours: { open: "09:00", close: "18:00" } },
  { date: "10-01", label: "Ημέρα Ανεξαρτησίας της Κύπρου (1 Οκτωβρίου)", hours: { open: "09:00", close: "18:00" } },
  { date: "10-28", label: "Ημέρα του Όχι (28 Οκτωβρίου)", hours: { open: "09:00", close: "18:00" } },
  { date: "12-25", label: "Χριστούγεννα (25 Δεκεμβρίου)", hours: null },
  { date: "12-26", label: "Δεύτερη μέρα Χριστουγέννων (26 Δεκεμβρίου)", hours: { open: "09:00", close: "18:00" } },
];
function cySupermarketWeekly() {
  return [
    { open: "08:00", close: "21:00" }, // Κυριακή
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" },
    { open: "07:00", close: "21:00" }, // Σάββατο
  ];
}
// Lidl, AlphaMega, Papantoniou, Sklavenitis, Metro — cele 5 branduri cu cea
// mai mare prezență națională, confirmate individual
const CY_STORE_CONFIG = {
  lidl: { name: "Lidl", weekly: cySupermarketWeekly(), holidays: CY_HOLIDAYS },
  alphamega: { name: "AlphaMega", weekly: cySupermarketWeekly(), holidays: CY_HOLIDAYS },
  papantoniou: { name: "Papantoniou", weekly: cySupermarketWeekly(), holidays: CY_HOLIDAYS },
  sklavenitis: { name: "Sklavenitis", weekly: cySupermarketWeekly(), holidays: CY_HOLIDAYS },
  metro: { name: "Metro", weekly: cySupermarketWeekly(), holidays: CY_HOLIDAYS },
};

// Malta — 14 sărbători 2026, verificate (număr mare, cunoscut pentru
// Malta). Magazinele mari (Lidl, PAVI/PAMA) rămân majoritar deschise, cu
// ore reduse — doar Crăciunul tratat ca zi de închidere completă.
const MT_HOLIDAYS = [
  { date: "01-01", label: "New Year's Day (1 January)", hours: { open: "09:00", close: "18:00" } },
  { date: "02-10", label: "Feast of St Paul's Shipwreck (10 February)", hours: { open: "09:00", close: "18:00" } },
  { date: "03-19", label: "St Joseph's Day (19 March)", hours: { open: "09:00", close: "18:00" } },
  { date: "03-31", label: "Freedom Day (31 March)", hours: { open: "09:00", close: "18:00" } },
  { date: "04-03", label: "Good Friday (3 April 2026)", hours: { open: "09:00", close: "15:00" } },
  { date: "05-01", label: "Worker's Day (1 May)", hours: { open: "09:00", close: "18:00" } },
  { date: "06-07", label: "Sette Giugno (7 June)", hours: { open: "09:00", close: "18:00" } },
  { date: "06-29", label: "St Peter and St Paul — Imnarja (29 June)", hours: { open: "09:00", close: "18:00" } },
  { date: "08-15", label: "Assumption Day (15 August)", hours: { open: "09:00", close: "18:00" } },
  { date: "09-08", label: "Victory Day (8 September)", hours: { open: "09:00", close: "18:00" } },
  { date: "09-21", label: "Independence Day (21 September)", hours: { open: "09:00", close: "18:00" } },
  { date: "12-08", label: "Immaculate Conception (8 December)", hours: { open: "09:00", close: "18:00" } },
  { date: "12-13", label: "Republic Day (13 December)", hours: { open: "09:00", close: "18:00" } },
  { date: "12-25", label: "Christmas Day (25 December)", hours: null },
];
function mtSupermarketWeekly() {
  return [
    { open: "08:00", close: "18:00" }, // Sunday
    { open: "07:30", close: "21:00" },
    { open: "07:30", close: "21:00" },
    { open: "07:30", close: "21:00" },
    { open: "07:30", close: "21:00" },
    { open: "07:30", close: "21:00" },
    { open: "07:30", close: "21:00" }, // Saturday
  ];
}
// Lidl, PAVI, PAMA, Welbee's, Greens — cele 5 branduri cu cea mai mare
// prezență națională, confirmate individual
const MT_STORE_CONFIG = {
  lidl: { name: "Lidl", weekly: mtSupermarketWeekly(), holidays: MT_HOLIDAYS },
  pavi: { name: "PAVI", weekly: mtSupermarketWeekly(), holidays: MT_HOLIDAYS },
  pama: { name: "PAMA", weekly: mtSupermarketWeekly(), holidays: MT_HOLIDAYS },
  welbees: { name: "Welbee's", weekly: mtSupermarketWeekly(), holidays: MT_HOLIDAYS },
  greens: { name: "Greens", weekly: mtSupermarketWeekly(), holidays: MT_HOLIDAYS },
};

// Luxemburg — 11 sărbători 2026, verificate. Magazinele rareori deschise
// duminica (nu-i interdicție legală strictă ca-n Slovenia, doar obicei —
// confirmat: "sometimes even on Sundays" pentru unele Delhaize) — program
// de duminică redus, nu complet închis.
const LU_HOLIDAYS = [
  { date: "01-01", label: "Jour de l'An (1er janvier)", hours: { open: "09:00", close: "13:00" } },
  { date: "04-06", label: "Lundi de Pâques (6 avril 2026)", hours: { open: "09:00", close: "18:00" } },
  { date: "05-01", label: "Fête du Travail (1er mai)", hours: null },
  { date: "05-09", label: "Journée de l'Europe (9 mai)", hours: { open: "09:00", close: "18:00" } },
  { date: "05-14", label: "Ascension (14 mai 2026)", hours: null },
  { date: "05-25", label: "Lundi de Pentecôte (25 mai 2026)", hours: { open: "09:00", close: "18:00" } },
  { date: "06-23", label: "Fête Nationale (23 juin)", hours: null },
  { date: "08-15", label: "Assomption (15 août)", hours: { open: "09:00", close: "18:00" } },
  { date: "11-01", label: "Toussaint (1er novembre)", hours: { open: "09:00", close: "18:00" } },
  { date: "12-25", label: "Noël (25 décembre)", hours: null },
  { date: "12-26", label: "Saint-Étienne (26 décembre)", hours: { open: "09:00", close: "18:00" } },
];
function luSupermarketWeekly() {
  return [
    { open: "09:00", close: "13:00" }, // Dimanche
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "18:00" }, // Samedi
  ];
}
// Cactus, Auchan, Delhaize, Aldi, Colruyt — cele 5 branduri cu cea mai mare
// prezență națională, confirmate individual
const LU_STORE_CONFIG = {
  cactus: { name: "Cactus", weekly: luSupermarketWeekly(), holidays: LU_HOLIDAYS },
  auchan: { name: "Auchan", weekly: luSupermarketWeekly(), holidays: LU_HOLIDAYS },
  delhaize: { name: "Delhaize", weekly: luSupermarketWeekly(), holidays: LU_HOLIDAYS },
  aldi: { name: "Aldi", weekly: luSupermarketWeekly(), holidays: LU_HOLIDAYS },
  colruyt: { name: "Colruyt", weekly: luSupermarketWeekly(), holidays: LU_HOLIDAYS },
};

// ("Sunday Trading Act 1994") — de-aia programul de duminică e mult mai scurt,
// nu închis complet. Program unic pentru tot grupul (tesco, sainsburys, asda,
// morrisons, boots): Luni-Sâmbătă 07:00-22:00, Duminică 10:00-16:00.
const UK_HOLIDAYS = [
  { date: "12-25", label: "Christmas Day (25 December)", hours: null },
  { date: "01-01", label: "New Year's Day (1 January)", hours: null },
];
function ukSupermarketWeekly() {
  return [
    { open: "10:00", close: "16:00" }, // Sunday — limitat prin lege, nu închis
    { open: "07:00", close: "22:00" }, // Monday
    { open: "07:00", close: "22:00" },
    { open: "07:00", close: "22:00" },
    { open: "07:00", close: "22:00" },
    { open: "07:00", close: "22:00" },
    { open: "07:00", close: "22:00" }, // Saturday
  ];
}
;

// Spania: program unic pentru tot grupul (mercadona, carrefour, alcampo,
// el-corte-ingles, dia): Luni-Sâmbătă 09:00-21:30, Duminică închis.
// Notă onestă: în realitate, multe magazine El Corte Inglés din centrele
// marilor orașe (Madrid, Barcelona) chiar deschid duminica, iar legea de
// închidere duminicală variază pe comunități autonome — am aplicat aici
// simplificarea explicit cerută (program unic pentru tot grupul), nu
// comportamentul real, variabil, al fiecărui brand.
const ES_HOLIDAYS = [
  { date: "12-25", label: "Navidad (25 de diciembre)", hours: null },
  { date: "01-01", label: "Año Nuevo (1 de enero)", hours: null },
];
function esSupermarketWeekly() {
  return [
    null, // Domingo — închis
    { open: "09:00", close: "21:30" }, // Lunes
    { open: "09:00", close: "21:30" },
    { open: "09:00", close: "21:30" },
    { open: "09:00", close: "21:30" },
    { open: "09:00", close: "21:30" },
    { open: "09:00", close: "21:30" }, // Sábado
  ];
}
// Bricolaj / electronice / sport (Ikea, Leroy Merlin, MediaMarkt, Decathlon)
// — program tipic mai lung dimineața, închis duminica (aceeași simplificare
// declarată mai sus, pentru tot grupul).
function esDiyWeekly() {
  return [
    null, // Domingo — închis
    { open: "10:00", close: "21:00" }, // Lunes
    { open: "10:00", close: "21:00" },
    { open: "10:00", close: "21:00" },
    { open: "10:00", close: "21:00" },
    { open: "10:00", close: "21:00" },
    { open: "10:00", close: "21:00" }, // Sábado
  ];
}
;

// Franța: particularitate reală, nu presupunere — marea majoritate a
// hipermarketurilor (Leclerc, Carrefour, Auchan, Intermarché) sunt deschise
// duminica DOAR dimineața, până la 13:00, apoi închise restul zilei. Magazinele
// de proximitate din centrele orașelor (ex: Monoprix) au adesea program mai
// lung. Program unic pentru tot grupul: Luni-Sâmbătă 08:30-20:00,
// Duminică 08:30-13:00.
const FR_HOLIDAYS = [
  { date: "12-25", label: "Noël (25 décembre)", hours: null },
  { date: "01-01", label: "Jour de l'An (1er janvier)", hours: null },
];
function frSupermarketWeekly() {
  return [
    { open: "08:30", close: "13:00" }, // Dimanche — doar dimineața
    { open: "08:30", close: "20:00" }, // Lundi
    { open: "08:30", close: "20:00" },
    { open: "08:30", close: "20:00" },
    { open: "08:30", close: "20:00" },
    { open: "08:30", close: "20:00" },
    { open: "08:30", close: "20:00" }, // Samedi
  ];
}
const FR_STORE_CONFIG = {
  leclerc: { name: "E.Leclerc", weekly: frSupermarketWeekly(), holidays: FR_HOLIDAYS },
  carrefour: { name: "Carrefour", weekly: frSupermarketWeekly(), holidays: FR_HOLIDAYS },
  intermarche: { name: "Intermarché", weekly: frSupermarketWeekly(), holidays: FR_HOLIDAYS },
  auchan: { name: "Auchan", weekly: frSupermarketWeekly(), holidays: FR_HOLIDAYS },
  monoprix: { name: "Monoprix", weekly: frSupermarketWeekly(), holidays: FR_HOLIDAYS },
  // Mall real, verificat — Forum des Halles e într-o "zonă turistică" din
  // Paris, deci deschis și duminica, spre deosebire de restul Franței.
  forumdeshalles: {
    name: "Westfield Forum des Halles",
    slug: "forum-des-halles",
    weekly: [
      { open: "10:00", close: "20:00" }, // Dimanche
      { open: "10:00", close: "20:30" },
      { open: "10:00", close: "20:30" },
      { open: "10:00", close: "20:30" },
      { open: "10:00", close: "20:30" },
      { open: "10:00", close: "20:30" },
      { open: "10:00", close: "20:30" },
    ],
    holidays: FR_HOLIDAYS,
  },
};

// Italia: spre deosebire de Germania/Polonia, NU există o lege națională de
// închidere duminicală — marile lanțuri sunt normal deschise și duminica, cu
// program obișnuit. Ce variază enorm sunt DOAR sărbătorile legale (Paște,
// 1 mai, Ferragosto), unde fiecare lanț/magazin decide separat, oraș cu oraș —
// prea instabil ca să fie reprezentat corect într-un program fix, așa că
// păstrăm doar programul standard, fără sărbători speciale suprascrise.
const IT_HOLIDAYS = [
  { date: "12-25", label: "Natale (25 dicembre)", hours: null },
  { date: "01-01", label: "Capodanno (1 gennaio)", hours: null },
];
function itSupermarketWeekly() {
  return [
    { open: "08:00", close: "20:30" }, // Domenica — program normal, fără închidere legală
    { open: "08:00", close: "20:30" }, // Lunedì
    { open: "08:00", close: "20:30" },
    { open: "08:00", close: "20:30" },
    { open: "08:00", close: "20:30" },
    { open: "08:00", close: "20:30" },
    { open: "08:00", close: "20:30" }, // Sabato
  ];
}
// Bricolaj / electronice / sport — program tipic, tot fără închidere
// duminicală legală (ca la supermarketuri, aceeași realitate italiană).
function itDiyWeekly() {
  return [
    { open: "09:30", close: "20:00" }, // Domenica
    { open: "09:30", close: "20:00" }, // Lunedì
    { open: "09:30", close: "20:00" },
    { open: "09:30", close: "20:00" },
    { open: "09:30", close: "20:00" },
    { open: "09:30", close: "20:00" },
    { open: "09:30", close: "20:00" }, // Sabato
  ];
}
const IT_STORE_CONFIG = {
  esselunga: { name: "Esselunga", weekly: itSupermarketWeekly(), holidays: IT_HOLIDAYS },
  conad: { name: "Conad", weekly: itSupermarketWeekly(), holidays: IT_HOLIDAYS },
  coop: { name: "Coop", weekly: itSupermarketWeekly(), holidays: IT_HOLIDAYS },
  carrefour: { name: "Carrefour", weekly: itSupermarketWeekly(), holidays: IT_HOLIDAYS },
  lidl: { name: "Lidl", weekly: itSupermarketWeekly(), holidays: IT_HOLIDAYS },
  // Eurospin — discount, ~1200 de magazine, cea mai densă rețea de aici,
  // acoperire cu adevărat națională (Nord/Centru/Sud deopotrivă, spre
  // deosebire de Esselunga) — universal, nerestricționat.
  eurospin: { name: "Eurospin", weekly: itSupermarketWeekly(), holidays: IT_HOLIDAYS },
  // Ikea — vezi SELECTIVE_BRAND_CITIES.it mai jos pentru orașele exacte.
  ikea: { name: "Ikea", weekly: itDiyWeekly(), holidays: IT_HOLIDAYS },
  // MediaWorld, Decathlon — lanțuri mari, naționale (~120, respectiv ~60 de
  // magazine), NEVERIFICATE oraș cu oraș individual (spre deosebire de
  // Esselunga/Ikea de mai sus) — tratate universal, risc mic totuși, pentru
  // că toate cele 30 de orașe sunt deja orașe mari/turistice importante.
  mediaworld: { name: "MediaWorld", slug: "media-world", weekly: itDiyWeekly(), holidays: IT_HOLIDAYS },
  decathlon: { name: "Decathlon", weekly: itDiyWeekly(), holidays: IT_HOLIDAYS },
};

// Polonia: lege strictă de interzicere a comerțului duminica ("zakaz handlu
// w niedziele") — marile lanțuri sunt închise aproape toate duminicile, cu
// excepția a ~8 "duminici comerciale" pe an, stabilite de guvern și
// schimbate de la an la an — prea instabile ca să le reprezentăm corect
// într-un program fix, deci modelăm doar regula generală (închis duminica).
const PL_HOLIDAYS = [
  { date: "12-25", label: "Boże Narodzenie (25 grudnia)", hours: null },
  { date: "01-01", label: "Nowy Rok (1 stycznia)", hours: null },
];
function plSupermarketWeekly() {
  return [
    null, // Niedziela — închis prin lege (cu excepția ~8 duminici comerciale/an, nemodelate)
    { open: "06:00", close: "22:00" }, // Poniedziałek
    { open: "06:00", close: "22:00" },
    { open: "06:00", close: "22:00" },
    { open: "06:00", close: "22:00" },
    { open: "06:00", close: "22:00" },
    { open: "06:00", close: "22:00" }, // Sobota
  ];
}
const PL_STORE_CONFIG = {
  biedronka: { name: "Biedronka", weekly: plSupermarketWeekly(), holidays: PL_HOLIDAYS },
  lidl: { name: "Lidl", weekly: plSupermarketWeekly(), holidays: PL_HOLIDAYS },
  kaufland: { name: "Kaufland", weekly: plSupermarketWeekly(), holidays: PL_HOLIDAYS },
  carrefour: { name: "Carrefour", weekly: plSupermarketWeekly(), holidays: PL_HOLIDAYS },
  auchan: { name: "Auchan", weekly: plSupermarketWeekly(), holidays: PL_HOLIDAYS },
};

// Olanda: fără lege națională de închidere duminicală, dar program de
// duminică mult mai scurt și inconsistent între lanțuri (Jumbo ~12-18,
// Albert Heijn variază mult pe locație) — folosim un interval reprezentativ.
const NL_HOLIDAYS = [
  { date: "12-25", label: "Kerstmis (25 december)", hours: null },
  { date: "01-01", label: "Nieuwjaarsdag (1 januari)", hours: null },
];
function nlSupermarketWeekly() {
  return [
    { open: "12:00", close: "18:00" }, // Zondag — program scurt, variază mult pe lanț
    { open: "08:00", close: "21:00" }, // Maandag
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" }, // Zaterdag
  ];
}
const NL_STORE_CONFIG = {
  albertheijn: { name: "Albert Heijn", slug: "albert-heijn", weekly: nlSupermarketWeekly(), holidays: NL_HOLIDAYS },
  jumbo: { name: "Jumbo", weekly: nlSupermarketWeekly(), holidays: NL_HOLIDAYS },
  lidl: { name: "Lidl", weekly: nlSupermarketWeekly(), holidays: NL_HOLIDAYS },
  aldi: { name: "Aldi", weekly: nlSupermarketWeekly(), holidays: NL_HOLIDAYS },
  plus: { name: "Plus", weekly: nlSupermarketWeekly(), holidays: NL_HOLIDAYS },
};

// Austria: la fel ca Germania, marile lanțuri își închid sucursalele obișnuite
// complet duminica — normă respectată aproape universal, cu excepții punctuale
// (gări, aeroporturi, câteva zone turistice din Tirol/Salzburg/Carintia).
const AT_HOLIDAYS = [
  { date: "12-25", label: "Weihnachten (25. Dezember)", hours: null },
  { date: "01-01", label: "Neujahr (1. Januar)", hours: null },
];
function atSupermarketWeekly() {
  return [
    null, // Sonntag — închis, cu excepții punctuale (gări/aeroporturi/zone turistice)
    { open: "07:30", close: "19:30" }, // Montag
    { open: "07:30", close: "19:30" },
    { open: "07:30", close: "19:30" },
    { open: "07:30", close: "19:30" },
    { open: "07:30", close: "19:30" },
    { open: "07:30", close: "19:30" }, // Samstag
  ];
}
const AT_STORE_CONFIG = {
  billa: { name: "Billa", weekly: atSupermarketWeekly(), holidays: AT_HOLIDAYS },
  spar: { name: "Spar", weekly: atSupermarketWeekly(), holidays: AT_HOLIDAYS },
  hofer: { name: "Hofer", weekly: atSupermarketWeekly(), holidays: AT_HOLIDAYS },
  lidl: { name: "Lidl", weekly: atSupermarketWeekly(), holidays: AT_HOLIDAYS },
  penny: { name: "Penny", weekly: atSupermarketWeekly(), holidays: AT_HOLIDAYS },
};

// Turcia — spre deosebire de majoritatea Europei, marile lanțuri de
// discount (BİM, A101, ŞOK) și Migros rămân DESCHISE și duminica, program
// lung, 7 zile din 7 — practică obișnuită, nu excepție. NU includem
// sărbătorile islamice (Ramazan Bayramı, Kurban Bayramı) — sunt după
// calendarul lunar, se mută în fiecare an, ar necesita actualizare manuală
// anuală ca să rămână corecte; incluse doar 1 ianuarie (singura sărbătoare
// cu dată fixă, general respectată de marile lanțuri).
const TR_HOLIDAYS = [
  { date: "01-01", label: "Yılbaşı (1 Ocak)", hours: null },
];
function trSupermarketWeekly() {
  return [
    { open: "08:00", close: "22:00" }, // Pazar (Duminică)
    { open: "08:00", close: "22:00" }, // Pazartesi (Luni)
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" }, // Cumartesi (Sâmbătă)
  ];
}
const TR_STORE_CONFIG = {
  migros: { name: "Migros", weekly: trSupermarketWeekly(), holidays: TR_HOLIDAYS },
  bim: { name: "BİM", weekly: trSupermarketWeekly(), holidays: TR_HOLIDAYS },
  a101: { name: "A101", weekly: trSupermarketWeekly(), holidays: TR_HOLIDAYS },
  sok: { name: "ŞOK", weekly: trSupermarketWeekly(), holidays: TR_HOLIDAYS },
  carrefoursa: { name: "CarrefourSA", weekly: trSupermarketWeekly(), holidays: TR_HOLIDAYS },
  teknosa: { name: "Teknosa", weekly: [
    { open: "10:00", close: "22:00" }, { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" }, { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" }, { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" },
  ], holidays: TR_HOLIDAYS },
  mediamarkt: { name: "MediaMarkt", weekly: [
    { open: "10:00", close: "22:00" }, { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" }, { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" }, { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" },
  ], holidays: TR_HOLIDAYS },
};

// Belgia: situație reală, în schimbare — Colruyt, Aldi și Lidl rămân închise
// duminica (politică fermă), în timp ce Carrefour a început recent (ian. 2026)
// să deschidă duminică dimineața la hipermarketuri, iar Delhaize variază pe
// magazin (multe sunt francizate independent). Păstrăm regula majoritară,
// valabilă pentru cei mai mulți retaileri mari.
const BE_HOLIDAYS = [
  { date: "12-25", label: "Noël (25 décembre)", hours: null },
  { date: "01-01", label: "Nouvel An (1er janvier)", hours: null },
];
function beSupermarketWeekly() {
  return [
    null, // Dimanche — majoritatea lanțurilor mari închise, cu excepții în schimbare (ex: Carrefour)
    { open: "08:30", close: "19:00" }, // Lundi
    { open: "08:30", close: "19:00" },
    { open: "08:30", close: "19:00" },
    { open: "08:30", close: "19:00" },
    { open: "08:30", close: "19:00" },
    { open: "08:30", close: "19:00" }, // Samedi
  ];
}
// Magazine de proximitate (Okay, Proxy Delhaize, Alvo) — format mic, deschise
// și duminica dimineața în multe locații (excepție reală de la regula
// marilor lanțuri), program prelungit seara. Reprezentativ, nu universal —
// variază pe francizat, la fel ca la Delhaize normal.
function beProximityWeekly() {
  return [
    { open: "09:00", close: "13:00" }, // Dimanche — multe puncte de proximitate deschise doar dimineața
    { open: "08:00", close: "20:00" }, // Lundi
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" }, // Samedi
  ];
}

// Bricolaj (Brico, Gamma, Hubo) — sub aceeași lege belgiană de închidere
// duminicală ca marile magazine nealimentare; Luni-Sâmbătă cu program mai
// lung vinerea în multe locații, simplificat aici la un interval uniform.
const BE_DIY_HOLIDAYS = BE_HOLIDAYS;
function beDiyWeekly() {
  return [
    null, // Dimanche — închis, lege belgiană de închidere duminicală pentru nealimentar
    { open: "09:00", close: "18:30" }, // Lundi
    { open: "09:00", close: "18:30" },
    { open: "09:00", close: "18:30" },
    { open: "09:00", close: "18:30" },
    { open: "09:00", close: "20:00" }, // Vendredi — nocturnă, frecventă la lanțurile de bricolaj
    { open: "09:00", close: "18:30" }, // Samedi
  ];
}

// Electronice (MediaMarkt, Krëfel, Vanden Borre) — aceeași lege de închidere
// duminicală; unele locații din mall-uri fac excepție (vezi STORE_ALIASES
// pentru echivalentul românesc al acestei logici).
function beElectroWeekly() {
  return [
    null, // Dimanche — închis
    { open: "10:00", close: "19:00" }, // Lundi
    { open: "10:00", close: "19:00" },
    { open: "10:00", close: "19:00" },
    { open: "10:00", close: "19:00" },
    { open: "10:00", close: "19:00" },
    { open: "10:00", close: "19:00" }, // Samedi
  ];
}

// Cora — hipermarketuri, program puțin mai lung decât supermarketul standard;
// unele deschid și duminică dimineața, la fel ca Carrefour recent (vezi mai sus).
function beHyperWeekly() {
  return [
    { open: "09:00", close: "12:30" }, // Dimanche — deschidere parțială, ca la Carrefour
    { open: "08:30", close: "20:00" }, // Lundi
    { open: "08:30", close: "20:00" },
    { open: "08:30", close: "20:00" },
    { open: "08:30", close: "20:00" },
    { open: "08:30", close: "20:00" },
    { open: "08:30", close: "20:00" }, // Samedi
  ];
}

;

// Danemarca: fără interdicție de duminică — magazinele sunt deschise 7 zile
// din 7, cu program de duminică ceva mai scurt, dar nu drastic redus.
const DK_HOLIDAYS = [
  { date: "12-25", label: "Juledag (25. december)", hours: null },
  { date: "01-01", label: "Nytårsdag (1. januar)", hours: null },
];
function dkSupermarketWeekly() {
  return [
    { open: "10:00", close: "18:00" }, // Søndag
    { open: "08:00", close: "20:00" }, // Mandag
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" }, // Lørdag
  ];
}
const DK_STORE_CONFIG = {
  netto: { name: "Netto", weekly: dkSupermarketWeekly(), holidays: DK_HOLIDAYS },
  fotex: { name: "Føtex", weekly: dkSupermarketWeekly(), holidays: DK_HOLIDAYS },
  bilka: { name: "Bilka", weekly: dkSupermarketWeekly(), holidays: DK_HOLIDAYS },
  rema1000: { name: "Rema 1000", slug: "rema-1000", weekly: dkSupermarketWeekly(), holidays: DK_HOLIDAYS },
  irma: { name: "Irma", weekly: dkSupermarketWeekly(), holidays: DK_HOLIDAYS },
};

// registru central: fiecare țară = configurația ei de magazine + traducerea +
// câteva orașe mari de pornire (extensibile oricând, la fel ca la cele 30 din RO)
;

// Obiective turistice — DOAR nume + link către site-ul oficial real, fără ore.
// Nu inventăm program: multe obiective au sezoane, bilete cu oră fixă, sau
// (ca Pergamonmuseum, verificat) sunt parțial închise pentru renovare —
// link-ul direct arată mereu starea reală, actualizată de instituție.
// Obiective turistice — nume + link, fără ore inventate. Pentru obiectivele
// foarte cunoscute (verificate direct), link către site-ul oficial real. Pentru
// restul — multe regionale/specifice, unde n-am de unde garanta sigur domeniul
// "oficial" exact — link Google Maps către locația exactă: mereu corect,
// arată locația reală, recenzii, și adesea orele curente preluate de Google
// direct de la locul respectiv.
const ATTRACTIONS = require("./attractions-data.js");
// Conținut editorial per plajă (Grecia) — furnizat direct de proprietar,
// DOAR în română momentan (vezi nota din beach-content-data.js).
const BEACH_CONTENT_DATA = require("./beach-content-data.js");
// Traduceri per-limbă ale conținutului de plajă — încărcate LENEȘ (doar la
// prima cerere reală în acea limbă, nu la pornirea serverului), ca să nu
// crească memoria/timpul de Cold Start pentru limbi rar cerute. Fișierele
// se pun în aceeași structură: beach-content-<lang>.js.
const BEACH_CONTENT_LANG_CACHE = {};
function getBeachContentForLang(attractionName, lang) {
  if (lang === "ro") return BEACH_CONTENT_DATA[attractionName] || null;
  // Orice altă limbă fără traducere proprie cade pe engleză (uk) — mai bine
  // decât să nu arătăm nimic. Bug real, semnalat direct: până acum funcția
  // întorcea direct `null` pentru orice limbă în afară de "uk", iar pagina
  // rămânea fără descriere (doar widget-ul de vot), nu cu engleza cum ar
  // fi trebuit.
  const effectiveLang = BEACH_CONTENT_LANG_FILES[lang] ? lang : "uk";
  if (!BEACH_CONTENT_LANG_CACHE[effectiveLang]) {
    try {
      BEACH_CONTENT_LANG_CACHE[effectiveLang] = require(`./beach-content-${effectiveLang}.js`);
    } catch (err) {
      BEACH_CONTENT_LANG_CACHE[effectiveLang] = {}; // fișierul lipsește încă — cădem elegant, nu crăpăm pagina
    }
  }
  return BEACH_CONTENT_LANG_CACHE[effectiveLang][attractionName] || null;
}
// Limbile care AU (sau vor avea) un fișier beach-content-<lang>.js — se
// extinde pe măsură ce se traduce mai mult conținut.
const BEACH_CONTENT_LANG_FILES = { uk: true };

// Excepții manuale, verificate — pentru monumente foarte cunoscute al căror
// nume NU conține orașul (Turnul Eiffel nu spune "Paris" nicăieri în nume),
// deci detecția automată de mai jos le-ar fi ratat. Fapte foarte sigure, nu
// presupuneri — extensibil ușor pentru alte țări/orașe, la cerere.
;

// Deducem orașul unei atracții din numele ei deja existent (multe conțin deja
// orașul, ex: "BMW Welt & Museum München", "Kölner Dom") — NU inventăm
// asocieri, doar recunoaștem ce e deja scris acolo. Dacă numele nu conține
// niciunul din orașele acoperite pentru țara respectivă, atracția rămâne
// "fără oraș detectat" — vizibilă mereu, la orice filtrare pe oraș, nu ascunsă.
function detectAttractionCity(attractionName, countryCode) {
  const override = ATTRACTION_CITY_OVERRIDES[countryCode] && ATTRACTION_CITY_OVERRIDES[countryCode][attractionName];
  if (override) return override;
  const country = COUNTRIES[countryCode];
  if (!country) return null;
  const normalizedName = normalizeSlug(attractionName);
  for (const city of country.cities) {
    if (normalizedName.includes(normalizeSlug(city))) return city;
  }
  return null;
}

;

// Nume de țară ÎN ROMÂNĂ — folosite doar la construirea promptului pentru AI
// (instrucțiunea în sine e scrisă în română, indiferent de limba cerută
// pentru rezultat — vezi buildItineraryPrompt) și în mesajele de eroare ale
// generatorului de itinerarii. Diferite de COUNTRY_LABELS (engleză, folosit
// pentru UI-ul de selecție a țării).
const COUNTRY_NAMES_RO = { ro: "România", de: "Germania", uk: "Regatul Unit", es: "Spania", fr: "Franța", it: "Italia", pl: "Polonia", nl: "Olanda", at: "Austria", be: "Belgia", dk: "Danemarca", se: "Suedia", pt: "Portugalia", cz: "Cehia", fi: "Finlanda", gr: "Grecia", hu: "Ungaria", hr: "Croația", ie: "Irlanda", sk: "Slovacia", si: "Slovenia", lt: "Lituania", lv: "Letonia", ee: "Estonia", cy: "Cipru", mt: "Malta", lu: "Luxemburg", tr: "Turcia" };

// Vercel dă codul de țară ca ISO 3166-1 alpha-2 (ex: "DE", "GB") — hartă spre
// codurile noastre interne (Marea Britanie: "GB" în ISO, dar "uk" la noi).
const GEO_COUNTRY_MAP = { DE: "de", GB: "uk", ES: "es", FR: "fr", IT: "it", PL: "pl", NL: "nl", AT: "at", BE: "be", DK: "dk", RO: "ro", SE: "se", PT: "pt", CZ: "cz", FI: "fi", GR: "gr", HU: "hu", HR: "hr", IE: "ie", SK: "sk", SI: "si", LT: "lt", LV: "lv", EE: "ee", CY: "cy", MT: "mt", LU: "lu" };

// Locul unde ești (țara) și limba în care citești nu sunt același lucru —
// un englez aflat în Germania nu trebuie forțat să vadă germană. Fiecare
// pagină internațională poate fi văzută în orice limbă avem tradusă, prin
// ?lang=xx — fără să schimbe ce magazin/oraș vezi, doar cum e scris textul.
// "uk" e cheia noastră internă pentru engleză (moștenită din codul de țară),
// dar aici o etichetăm corect, ca opțiune de limbă, nu de țară.
;
const LANGUAGE_FLAGS = { uk: "🇬🇧", de: "🇩🇪", es: "🇪🇸", fr: "🇫🇷", it: "🇮🇹", pl: "🇵🇱", nl: "🇳🇱", da: "🇩🇰", ro: "🇷🇴", se: "🇸🇪", pt: "🇵🇹", cz: "🇨🇿", fi: "🇫🇮", gr: "🇬🇷", hu: "🇭🇺", hr: "🇭🇷", sk: "🇸🇰", si: "🇸🇮", lt: "🇱🇹", lv: "🇱🇻", ee: "🇪🇪" };
function buildLanguageSwitcher(currentLang, pathWithoutQuery) {
  const options = Object.keys(LANGUAGE_LABELS)
    .map((code) => `<option value="${escapeHtml(code)}" ${code === currentLang ? "selected" : ""}>${LANGUAGE_FLAGS[code] || ""} ${escapeHtml(LANGUAGE_LABELS[code])}</option>`)
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

// index combinat de căutare (magazine + atracții, toate țările internaționale)
// — generat o singură dată, trimis către browser pentru căutarea instant de pe homepage.
//
// FIX real, găsit prin testare directă: un utilizator care caută "Madrid"
// găsea toate magazinele din Madrid (numele lor include orașul, dintotdeauna),
// dar RATA majoritatea obiectivelor turistice din Madrid — numele unui
// obiectiv (ex. "Museo del Prado") nu conține mereu orașul, deci căutarea nu
// avea cum să facă legătura. Acum fiecare obiectiv primește un câmp `city`
// separat (real, la Spania — vezi inferCityForAttraction), folosit DOAR la
// căutare — nu schimbă ce se afișează, doar ce se poate găsi.
function buildSearchIndex() {
  const index = [];
  Object.keys(COUNTRIES).forEach((code) => {
    const country = COUNTRIES[code];
    Object.keys(country.config).forEach((key) => {
      const cfg = country.config[key];
      country.cities.forEach((city) => {
        if (!isSelectiveBrandAllowedInCity(code, key, city)) return;
        const citySlug = slugifyCityName(city);
        index.push({ name: `${cfg.name} ${city}`, type: "store", country: code, href: `/${code}/${citySlug}/${cfg.slug || key}` });
      });
    });
  });
  Object.keys(ATTRACTIONS).forEach((code) => {
    const cities = (COUNTRIES[code] && COUNTRIES[code].cities) || [];
    ATTRACTIONS[code].forEach((a) => {
      index.push({ name: a.name, city: inferCityForAttraction(a, cities), type: "attraction", country: code, href: `/${code}/obiectiv/${toDbSlug(a.name)}` });
    });
  });
  return index;
}

// index de căutare DOAR pentru România (magazine + obiective turistice
// românești) — folosit pe programul-de-azi.ro, ca să nu amestece magazine
// din toată Europa, în engleză, pe un site în română
//
// FIX real, găsit prin testare: fiecare intrare de magazin includea DOAR
// numele brandului (ex. "Lidl"), niciodată și orașul — deci nu puteai
// căuta după oraș (ex. "Brad") și link-ul mergea mereu spre primul oraș
// din listă (București), indiferent ce brand căutai. Acum fiecare
// combinație brand+oraș e o intrare proprie, exact ca paginile reale.
//
// Același fix ca la buildSearchIndex de mai sus, aplicat și aici: obiectivele
// primesc un câmp `city` dedus din nume (peste cele 103 municipii din
// SITEMAP_CITIES), ca să caute și pe orașe, nu doar exact numele obiectivului.
function buildSearchIndexRO() {
  const index = [];
  Object.keys(RO_INTL_STORE_CONFIG).forEach((key) => {
    const cfg = RO_INTL_STORE_CONFIG[key];
    SITEMAP_CITIES.forEach((city) => {
      if (!isSelectiveBrandAllowedInCity("ro", key, city)) return;
      const citySlug = slugifyCityName(city);
      index.push({ name: `${cfg.name} ${city}`, type: "store", country: "ro", href: `/${citySlug}/${cfg.slug || key}` });
    });
  });
  ATTRACTIONS.ro.forEach((a) => {
    index.push({ name: a.name, city: inferCityForAttraction(a, SITEMAP_CITIES), type: "attraction", country: "ro", href: `/obiectiv/${toDbSlug(a.name)}` });
  });
  return index;
}

/* ============================================================
   0.5) PWA — manifest, service worker, iconiță
   Cerute prin rutele /manifest.json, /sw.js și /icon.svg mai jos,
   ca legăturile din <head> să funcționeze efectiv, nu doar să existe.
   ============================================================ */

// iconiță simplă, generată ca SVG (nu necesită fișiere PNG separate;
// pentru suport iOS mai vechi, poți adăuga ulterior și icon-192.png / icon-512.png reale)
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="clockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FF9A3D"/>
      <stop offset="100%" stop-color="#E8590C"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#clockGrad)"/>
  <circle cx="256" cy="246" r="150" fill="#000000" opacity="0.24"/>
  <line x1="256" y1="246" x2="326" y2="196" stroke="#FFFFFF" stroke-width="15" stroke-linecap="round"/>
  <line x1="256" y1="246" x2="202" y2="216" stroke="#FFFFFF" stroke-width="15" stroke-linecap="round"/>
  <circle cx="256" cy="246" r="12" fill="#FFFFFF"/>
  <circle cx="388" cy="388" r="66" fill="#0F1115" stroke="#FFFFFF" stroke-width="8"/>
  <polyline points="360,390 382,412 418,364" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const MANIFEST_JSON = {
  name: "Programul de Azi",
  short_name: "ProgramulDeAzi",
  description: "Vezi instant dacă magazinele și mall-urile din România sunt deschise acum.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#0F1115",
  theme_color: "#0F1115",
  lang: "ro",
  icons: [
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
  ],
};

// Manifest separat pentru domeniul internațional — nume/limbă potrivite,
// restul (iconițe, culori) identic.
const MANIFEST_JSON_INTL = {
  ...MANIFEST_JSON,
  name: "Opening Hours Today",
  short_name: "Opening Hours",
  description: "Check instantly whether major stores and attractions across Europe are open right now.",
  lang: "en",
};

// Service worker: network-first, cu fallback pe cache la offline.
// Statusul DESCHIS/ÎNCHIS se recalculează oricum în telefon din ora locală,
// deci o pagină servită din cache tot arată statusul corect — nu doar una „proaspătă".
const SW_SCRIPT = `
const CACHE_NAME = "programul-de-azi-v1";
const PRECACHE_URLS = ["/", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// notificări push — vine un mesaj de la server (vezi send-push-notification.js),
// îl afișăm ca notificare reală, chiar dacă site-ul nu e deschis în niciun tab
self.addEventListener("push", (event) => {
  let data = { title: "Programul de Azi", body: "Ai o notificare nouă.", url: "/" };
  try {
    if (event.data) data = Object.assign(data, event.data.json());
  } catch (e) {
    // dacă payload-ul nu e JSON valid, rămânem pe valorile implicite de mai sus
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

// click pe notificare — deschide site-ul (sau aduce în față tab-ul deja deschis)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(targetUrl) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
`;

/* ============================================================
   1) PROGRAM IMPLICIT — valori naționale standard, ușor de
      modificat manual mai jos, per brand sau per zonă de mall.
      weekly are 7 poziții, index 0 = Duminică ... 6 = Sâmbătă
      (la fel ca JS Date.getDay()). null = închis toată ziua.
      holidays: date "MM-DD" (fix, recurent) sau "YYYY-MM-DD"
      (mobil, ex. Paște — de actualizat anual), hours:null = închis.
   ============================================================ */

// Lidl / Kaufland / Penny (și, ca implicit, restul supermarketurilor):
// Luni-Sâmbătă 07:00-22:00, Duminică 08:00-20:00
const SUPERMARKET_HOLIDAYS = [
  { date: "12-25", label: "Crăciun (25 decembrie)", hours: null },
  { date: "01-01", label: "Anul Nou (1 ianuarie)", hours: null },
];

function supermarketWeekly() {
  return [
    { open: "08:00", close: "20:00" }, // Duminică
    { open: "07:00", close: "22:00" }, // Luni
    { open: "07:00", close: "22:00" }, // Marți
    { open: "07:00", close: "22:00" }, // Miercuri
    { open: "07:00", close: "22:00" }, // Joi
    { open: "07:00", close: "22:00" }, // Vineri
    { open: "07:00", close: "22:00" }, // Sâmbătă
  ];
}

// Mall: zonă shopping 10:00-22:00 zilnic, hipermarket din mall 08:00-22:00 zilnic
function mallShoppingWeekly() {
  return [
    { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" },
    { open: "10:00", close: "22:00" },
  ];
}
function mallHyperWeekly() {
  return [
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
    { open: "08:00", close: "22:00" },
  ];
}

// Bricolaj (Dedeman, Leroy Merlin, Brico Depot, Hornbach, Jysk, Ikea):
// Luni-Sâmbătă 08:00-21:00, Duminică 09:00-18:00
function bricolajWeekly() {
  return [
    { open: "09:00", close: "18:00" }, // Duminică
    { open: "08:00", close: "21:00" }, // Luni
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" }, // Sâmbătă
  ];
}

// Electrocasnice (Altex, Flanco) și Dm: Luni-Sâmbătă 09:00-21:00, Duminică 10:00-18:00.
// Notă: multe locații Altex/Flanco/Dm sunt de fapt în interiorul unui mall — pentru
// o locație anume care e cu adevărat în mall, leag-o manual de tipul "mall" în
// STORE_ALIASES mai jos (exact ca "afi-cotroceni"), ca să preia automat orele
// reale ale mall-ului (10:00-22:00) în loc de programul standard al brandului.
function electroWeekly() {
  return [
    { open: "10:00", close: "18:00" }, // Duminică
    { open: "09:00", close: "21:00" }, // Luni
    { open: "09:00", close: "21:00" },
    { open: "09:00", close: "21:00" },
    { open: "09:00", close: "21:00" },
    { open: "09:00", close: "21:00" },
    { open: "09:00", close: "21:00" }, // Sâmbătă
  ];
}

// Metro / Selgros: Luni-Sâmbătă 06:00-21:00, Duminică 08:00-18:00
function metroWeekly() {
  return [
    { open: "08:00", close: "18:00" }, // Duminică
    { open: "06:00", close: "21:00" }, // Luni
    { open: "06:00", close: "21:00" },
    { open: "06:00", close: "21:00" },
    { open: "06:00", close: "21:00" },
    { open: "06:00", close: "21:00" },
    { open: "06:00", close: "21:00" }, // Sâmbătă
  ];
}

// Farmacii (Dr. Max, Farmacia Tei): Luni-Sâmbătă 08:00-21:00, Duminică 09:00-16:00
function farmacieWeekly() {
  return [
    { open: "09:00", close: "16:00" }, // Duminică
    { open: "08:00", close: "21:00" }, // Luni
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" },
    { open: "08:00", close: "21:00" }, // Sâmbătă
  ];
}

// Cinematografe (Cinema City, Cineplexx, Happy Cinema, Movie Plex): aproximăm
// programul zilnic 10:00–24:00, în fiecare zi a săptămânii, la fel. IMPORTANT:
// orarul de proiecție real variază zilnic în funcție de filmele programate —
// asta e doar intervalul orientativ în care sala e deschisă, nu ora exactă a
// ultimului spectacol. holidays: multe cinematografe rămân deschise chiar și
// de Crăciun/Anul Nou (perioadă populară pentru filme) — implicit am pus
// aceleași sărbători ca la restul magazinelor, dar merită verificat și ajustat.
function cinemaWeekly() {
  return [
    { open: "10:00", close: "24:00" },
    { open: "10:00", close: "24:00" },
    { open: "10:00", close: "24:00" },
    { open: "10:00", close: "24:00" },
    { open: "10:00", close: "24:00" },
    { open: "10:00", close: "24:00" },
    { open: "10:00", close: "24:00" },
  ];
}

// Bănci (BCR, BRD, ING, Raiffeisen, Banca Transilvania, CEC Bank):
// Luni-Vineri 09:00-16:00, închis sâmbătă și duminică la majoritatea sucursalelor.
// Notă: unele sucursale mari/din mall au program prelungit sau lucrează și sâmbăta —
// asta e programul standard, de sucursală obișnuită.
function bankWeekly() {
  return [
    null, // Duminică — închis
    { open: "09:00", close: "16:00" }, // Luni
    { open: "09:00", close: "16:00" },
    { open: "09:00", close: "16:00" },
    { open: "09:00", close: "16:00" },
    { open: "09:00", close: "16:00" }, // Vineri
    null, // Sâmbătă — închis
  ];
}

// Poșta Română: Luni-Vineri 08:00-19:00, Sâmbătă 08:00-12:00, Duminică închis.
// Multe oficii poștale mici au program mai scurt sau pauză de masă — asta e
// programul standard, orientativ, pentru oficiile mai mari.
function postaWeekly() {
  return [
    null, // Duminică — închis
    { open: "08:00", close: "19:00" }, // Luni
    { open: "08:00", close: "19:00" },
    { open: "08:00", close: "19:00" },
    { open: "08:00", close: "19:00" },
    { open: "08:00", close: "19:00" }, // Vineri
    { open: "08:00", close: "12:00" }, // Sâmbătă
  ];
}

// Fast-food (McDonald's, KFC, Burger King): deschis zilnic, program lung.
// Notă: multe locații cu drive-thru sunt de fapt 24/7 — asta e programul
// standard pentru restaurantele obișnuite, fără drive-thru non-stop.
function fastfoodWeekly() {
  return [
    { open: "08:00", close: "24:00" },
    { open: "08:00", close: "24:00" },
    { open: "08:00", close: "24:00" },
    { open: "08:00", close: "24:00" },
    { open: "08:00", close: "24:00" },
    { open: "08:00", close: "24:00" },
    { open: "08:00", close: "24:00" },
  ];
}

// Curieri (FAN Courier, Cargus, Sameday, DPD, GLS): program de tip agenție/punct
// de lucru — Luni-Vineri 09:00-18:00, Sâmbătă program redus, Duminică închis.
function curierWeekly() {
  return [
    null, // Duminică — închis
    { open: "09:00", close: "18:00" }, // Luni
    { open: "09:00", close: "18:00" },
    { open: "09:00", close: "18:00" },
    { open: "09:00", close: "18:00" },
    { open: "09:00", close: "18:00" }, // Vineri
    { open: "09:00", close: "13:00" }, // Sâmbătă
  ];
}

// STORE_CONFIG: câte o intrare per brand, cu cheia = slug-ul folosit în URL (site.ro/oras/{cheie}).
// Cheia e mereu forma "colapsată", fără cratime (ex: "leroymerlin"), pentru că
// findStore() elimină cratimele înainte de căutare — dar "slug" (opțional) fixează
// cum arată URL-ul frumos, cu cratimă, folosit în sitemap și în navigația de branduri.
;

// Categorii pentru "Magazine și Servicii" — grupare pe categorii, exact ca la
// obiectivele turistice (aceeași logică de <details>, la scară, cu 48 de
// branduri într-un oraș, o listă plată devine greu de parcurs). Aplicată
// PROGRAMATIC peste STORE_CONFIG (nu editat manual, 48 de linii, risc mare
// de greșeală) — fiecare cheie capătă un câmp "categorie".
const STORE_CATEGORY_BY_KEY = {
  lidl: "magazine", kaufland: "magazine", penny: "magazine", megaimage: "magazine", kik: "magazine",
  carrefour: "magazine", auchan: "magazine", profi: "magazine", metro: "magazine", selgros: "magazine",
  dedeman: "bricolaj_electro", leroymerlin: "bricolaj_electro", bricodepot: "bricolaj_electro",
  hornbach: "bricolaj_electro", jysk: "bricolaj_electro", ikea: "bricolaj_electro", xxxlutz: "bricolaj_electro", momax: "bricolaj_electro", mathaus: "bricolaj_electro", arabesque: "bricolaj_electro",
  altex: "bricolaj_electro", flanco: "bricolaj_electro", mrbricolage: "bricolaj_electro", dm: "farmacii",
  drmax: "farmacii", farmaciatei: "farmacii", remedia: "farmacii", springpharma: "farmacii",
  catena: "farmacii", sensiblu: "farmacii", helpnet: "farmacii", dona: "farmacii", ropharma: "farmacii",
  cinemacity: "cinema", cineplexx: "cinema", happycinema: "cinema", movieplex: "cinema",
  bcr: "banci", brd: "banci", ing: "banci", raiffeisen: "banci", bancatransilvania: "banci", cec: "banci",
  posta: "posta_curieri", fancourier: "posta_curieri", cargus: "posta_curieri",
  sameday: "posta_curieri", dpd: "posta_curieri", gls: "posta_curieri",
  mcdonalds: "fastfood", kfc: "fastfood", burgerking: "fastfood",
  mall: "mall",
};
Object.keys(STORE_CONFIG).forEach((key) => {
  if (STORE_CATEGORY_BY_KEY[key]) STORE_CONFIG[key].categorie = STORE_CATEGORY_BY_KEY[key];
});

;
function storeCategoryLabelFor(categoryKey, lang) {
  const set = STORE_CATEGORY_LABELS[lang] || STORE_CATEGORY_LABELS.uk;
  return set[categoryKey] || categoryKey;
}

// Grupează lista de magazine ale unui oraș pe categorii — la fel ca
// buildAttractionListForCountry, dar pentru magazine/servicii. Orașele fără
// date de categorie (țările internaționale, cu doar 5 branduri) cad automat
// pe lista plată de dinainte — nu are rost să grupezi 5 elemente.
function buildStoreListHtmlGrouped(items, lang) {
  const hasCategories = items.length && items.every((it) => it.categorie);
  if (!hasCategories) {
    return `<ul class="mall-list">${items.map((it) => it.html).join("")}</ul>`;
  }
  const order = [];
  const byCategory = {};
  items.forEach((it) => {
    if (!byCategory[it.categorie]) { byCategory[it.categorie] = []; order.push(it.categorie); }
    byCategory[it.categorie].push(it);
  });
  return order
    .map((cat) => {
      const inner = byCategory[cat].map((it) => it.html).join("");
      return `<details class="attraction-category-group">
        <summary class="attraction-category-summary">${escapeHtml(storeCategoryLabelFor(cat, lang))} <span class="attraction-category-count">(${byCategory[cat].length})</span></summary>
        <ul class="mall-list">${inner}</ul>
      </details>`;
    })
    .join("");
}

// Slug-uri alternative care trebuie recunoscute și mapate la cheia canonică de mai sus.
// "displayName" e opțional — folosit când slug-ul se referă la o locație anume
// (ex: un mall concret), ca numele afișat să rămână cel real, nu genericul "Mall".
const STORE_ALIASES = {
  "mega-image": { key: "megaimage" },
  "mega_image": { key: "megaimage" },
  "megaimage": { key: "megaimage" },
  "mall-uri": { key: "mall" },
  "malluri": { key: "mall" },
  "afi-cotroceni": { key: "mall", displayName: "AFI Cotroceni" },
};

const DAY_NAMES = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
const SITE_NAME = "Programul de Azi";

/* ============================================================
   0.9) MULTI-DOMENIU — programul-de-azi.ro (RO) rămâne pe rutele
   românești; opening-hours-today.eu (nou) servește exclusiv
   paginile internaționale (DE/UK/ES). Aceeași bază de cod, dar
   fiecare domeniu răspunde DOAR pentru piața lui — esențial pentru
   SEO, ca să nu existe conținut duplicat între cele două domenii.
   Dacă cineva ajunge pe domeniul greșit pentru tipul de pagină cerut,
   redirect 301 către domeniul corect, nu eroare.
   ============================================================ */
const RO_DOMAIN = "programul-de-azi.ro";
const INTL_DOMAIN = "opening-hours-today.eu";

function getHost(req) {
  return String(req.headers.host || "").replace(/^www\./, "").split(":")[0].toLowerCase();
}
function isIntlHost(req) {
  return getHost(req) === INTL_DOMAIN;
}
function baseUrlFor(req) {
  return isIntlHost(req) ? `https://${INTL_DOMAIN}` : `https://${RO_DOMAIN}`;
}

/* ============================================================
   2) HELPERE — normalizare slug-uri din URL, capitalizare,
      identificarea magazinului cerut, escapare HTML
   ============================================================ */

// "cluj-napoca" -> "Cluj-Napoca" ; "kaufland" -> "Kaufland" ; "mega image" -> "Mega Image"
// Bug vechi, confirmat (nu doar la Suedia — și München era afectat):
// toDisplayName() doar capitalizează slug-ul, nu recuperează diacriticele
// pierdute la slugificare (ö, ä, å, ü etc.) — "goteborg" -> "Goteborg", nu
// "Göteborg". Repar prin căutare: dacă slug-ul din URL se potrivește cu un
// oraș CUNOSCUT din lista țării (care are diacriticele corecte), folosim
// numele acela exact — altfel, cădem pe capitalizarea simplă (pentru
// sub-căi hiper-locale, cartiere etc., care n-au un nume "corect" oricum).
function resolveIntlCityDisplay(countryCode, orasSlug) {
  const country = COUNTRIES[countryCode];
  if (country) {
    const match = country.cities.find((c) => slugifyCityName(c) === orasSlug);
    if (match) return match;
  }
  return toDisplayName(orasSlug);
}

function toDisplayName(rawParam) {
  let decoded;
  try {
    decoded = decodeURIComponent(rawParam);
  } catch (e) {
    decoded = rawParam;
  }
  return decoded
    .trim()
    .split(/([\s-]+)/) // păstrează separatorii (spații, cratime) în rezultat
    .map((part) => {
      if (/^[\s-]+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}

// Verifică dacă un nume de oraș e unul din cele 30 REALE, verificate — NU
// orice localitate din România. Fără asta, orice comună mică ar primi o
// pagină completă cu toate cele 48 de branduri, ca și cum ar exista real
// acolo (Metro/Auchan într-o comună de câteva sute de locuitori) — o
// fabricare de date pe care am vrut mereu s-o evităm în acest proiect.
// Branduri SELECTIVE — nu sunt în toate cele 41 de orașe, spre deosebire de
// Lidl/Kaufland/Penny. Fără lista asta, sistemul ar arăta Metro/Selgros/IKEA
// ca și cum ar exista peste tot — exact genul de fabricare de date pe care
// am vrut mereu s-o evităm. Fiecare oraș din listele de mai jos a fost
// verificat real, prin căutare, cu adresă exactă găsită. Liste incomplete,
// deliberat conservatoare — mai bine lipsă un oraș real decât unul inventat.
//
// STRUCTURĂ: cheie de nivel 1 = codul țării (ro, be, ...), cheie de nivel 2 =
// cheia brandului. OBLIGATORIU imbricat așa, NU un singur nivel plat — chei
// de brand precum "carrefour" există în MAI MULTE țări simultan (RO, BE,
// FR...), cu liste de orașe complet diferite; un singur nivel ar amesteca
// orașele unei țări cu magazinele altei țări.
// Ajutător pentru Franța — vezi comentariul de la SELECTIVE_BRAND_CITIES.fr
// (leclerc/carrefour/intermarche/auchan) mai jos: o listă albă nu poate
// exprima direct "toate orașele MAI PUȚIN câteva", deci construim explicit
// restul, CALCULAT din COUNTRIES.fr.cities (nu o listă scrisă a doua oară
// de mână — bug real, prins prin verificare: varianta veche ERA scrisă de
// mână, deci nu s-a actualizat automat când am extins lista de orașe la 52,
// mai devreme în aceeași sesiune). Excludem trei sate minuscule, doar cu un
// castel/sit — fără nicio infrastructură de oraș real, deci sigur fără
// hipermarket, indiferent de brand: Mont Saint-Michel (~30 loc.), Rocamadour
// (~600 loc.), Cheverny și Ussé (sate de sub 1.000 loc., doar cu un castel).
const FR_TINY_MONUMENT_VILLAGES = ["Mont Saint-Michel", "Rocamadour", "Cheverny", "Ussé"];


;

// NOTĂ IMPORTANTĂ, valabilă pentru toate cele 3 liste de mai sus
// (megaimage/auchan/carrefour): verificate prin căutare web, la nivel de
// oraș — NU verificate exhaustiv magazin-cu-magazin, la fel de riguros ca
// metro/selgros mai sus. E posibil să lipsească un oraș real (ex. dacă un
// lanț a mai deschis o sucursală de atunci) — mai bine lipsă un oraș real
// decât unul inventat, ca peste tot în fișierul ăsta. Dacă vezi un oraș
// unde lipsește un brand pe care-l știi sigur că există, spune și-l
// adăugăm.
//
// ALTE BRANDURI CU ACEEAȘI PROBLEMĂ TEORETICĂ, ÎNCĂ NEVERIFICATE — rămân
// "universale" (apar în toate cele 103 municipii) până la o verificare
// separată: Dedeman, Leroy Merlin, Brico Depot, Hornbach, Jysk, Altex,
// Flanco, Dm, Dr. Max, Farmacia Tei, Remedia, Spring Pharma, Catena,
// Sensiblu, Help Net, Dona, Ropharma, Mr. Bricolage, toate băncile (BCR,
// BRD, ING, Raiffeisen, Banca Transilvania, CEC), McDonald's, KFC, Burger
// King, FAN Courier, Cargus, Sameday, DPD, GLS, Poșta Română. Unele
// dintre astea (CEC, Poșta Română, Profi, Lidl, Penny, Kaufland) chiar
// SUNT aproape universale în România — dar altele (Altex, Flanco, bănci
// mari, fast-food) sigur nu sunt, în orașe mici ca Brad. Necesită o
// verificare separată, brand cu brand, la fel ca mai sus.



// GENERALIZAT — acceptă countryCode explicit, ca să nu amestece listele de
// orașe ale unei țări cu magazinele altei țări (vezi structura imbricată de
// la SELECTIVE_BRAND_CITIES mai sus). Un brand fără intrare pentru țara
// respectivă, SAU o țară fără nicio intrare deloc în SELECTIVE_BRAND_CITIES,
// rămâne "universal" (fallback sigur, ca înainte de generalizare).
function isSelectiveBrandAllowedInCity(countryCode, magazinKey, orasDisplay) {
  const countryRestrictions = SELECTIVE_BRAND_CITIES[countryCode];
  if (!countryRestrictions) return true; // țară fără liste definite — universal
  const allowedCities = countryRestrictions[magazinKey];
  if (!allowedCities) return true; // brand nerestricționat — universal, ca înainte
  const strip = (s) => normalizeSlug(s).replace(/[\s-]+/g, "");
  return allowedCities.some((c) => strip(c) === strip(orasDisplay));
}

// Suprascrie store.weekly cu programul REAL — verifică ÎNTÂI o suprascriere
// pe LOCAȚIE EXACTĂ (PER_LOCATION_WEEKLY — ex. "Mega Image Piata Amzei",
// non-stop, dar restul filialelor din București NU sunt non-stop), apoi pe
// ORAȘ (PER_CITY_WEEKLY — ex. tot Brico Depot din Cluj-Napoca). locatieDisplay
// e opțional — paginile fără segment de locație (fără "/oras/magazin/locatie"
// în URL) pur și simplu sar peste primul pas. Returnează store NESCHIMBAT
// dacă nu există nicio suprascriere pentru combinația respectivă.
function applyPerCityWeeklyOverride(store, countryCode, magazinKey, orasDisplay, locatieDisplay) {
  if (!store || !magazinKey) return store;
  const strip = (s) => normalizeSlug(s).replace(/[\s-]+/g, "");

  if (locatieDisplay) {
    const brandLocations = PER_LOCATION_WEEKLY[countryCode] && PER_LOCATION_WEEKLY[countryCode][magazinKey];
    const cityLocations = brandLocations && Object.keys(brandLocations).find((c) => strip(c) === strip(orasDisplay));
    if (cityLocations) {
      const locKey = Object.keys(brandLocations[cityLocations]).find((l) => strip(l) === strip(locatieDisplay));
      if (locKey) return { ...store, weekly: brandLocations[cityLocations][locKey] };
    }
  }

  const brandOverrides = PER_CITY_WEEKLY[countryCode] && PER_CITY_WEEKLY[countryCode][magazinKey];
  if (!brandOverrides) return store;
  const matchKey = Object.keys(brandOverrides).find((c) => strip(c) === strip(orasDisplay));
  if (!matchKey) return store;
  return { ...store, weekly: brandOverrides[matchKey] };
}

function isKnownRoCity(orasDisplay) {
  // spațiu și cratimă trebuie tratate identic — numele reale au uneori
  // spațiu ("Baia Mare"), URL-ul are mereu cratimă ("baia-mare"); fără
  // asta, orașe reale, din lista de 30, ar da fals 404 (bug real, prins
  // prin testare, nu doar teoretic — afecta Baia Mare, Târgu Mureș etc.)
  const strip = (s) => normalizeSlug(s).replace(/[\s-]+/g, "");
  return SITEMAP_CITIES.some((c) => strip(c) === strip(orasDisplay));
}

// Același bug ca la INTL (vezi resolveIntlCityDisplay) — confirmat și aici,
// prin testare: "Brăila" -> slug -> "Braila" (fără diacritic), "Sfântu
// Gheorghe" -> "Sfantu-Gheorghe" (cratimă în loc de spațiu). Recuperăm
// numele corect din SITEMAP_CITIES, care are diacriticele și spațiile reale.
function resolveRoCityDisplay(orasDisplay) {
  const strip = (s) => normalizeSlug(s).replace(/[\s-]+/g, "");
  const match = SITEMAP_CITIES.find((c) => strip(c) === strip(orasDisplay));
  return match || orasDisplay;
}

// distanța reală (km) dintre două puncte GPS — formula Haversine, standard
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// cel mai apropiat, dintre cele 30 de orașe REALE, de o poziție GPS dată —
// folosit când detectarea automată găsește o localitate mică, necunoscută
// nouă, ca să sugerăm ceva onest ("cel mai apropiat oraș pe care-l avem"),
// nu să pretindem că avem date pentru localitatea exactă
function findNearestRoCity(lat, lon) {
  let best = null;
  let bestDist = Infinity;
  for (const city of SITEMAP_CITIES) {
    const coords = CITY_COORDS[city];
    if (!coords) continue;
    const dist = haversineKm(lat, lon, coords[0], coords[1]);
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
    }
  }
  return best ? { city: best, distanceKm: Math.round(bestDist) } : null;
}

// La fel, dar peste TOATE orașele acoperite, din toate țările (RO + cele 17
// de pe .eu) — pentru butonul "Hartă" din bara de jos ("lângă mine", oriunde
// ai fi pe site) — găsește cel mai apropiat oraș acoperit, indiferent de
// domeniul pe care ești, apoi trimite spre harta live a acelui oraș
// (reutilizează harta cu pin-uri deja construită, nu una nouă, separată).
function findNearestCityGlobal(lat, lon) {
  let best = null;
  let bestDist = Infinity;
  let bestCountry = null;
  for (const city of SITEMAP_CITIES) {
    const coords = CITY_COORDS[city];
    if (!coords) continue;
    const dist = haversineKm(lat, lon, coords[0], coords[1]);
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
      bestCountry = "ro";
    }
  }
  for (const code of Object.keys(COUNTRIES)) {
    if (code === "ro") continue; // deja acoperit mai sus, cu lista completă (41 orașe, nu doar primele din COUNTRIES.ro)
    for (const city of COUNTRIES[code].cities) {
      const coords = CITY_COORDS[city];
      if (!coords) continue;
      const dist = haversineKm(lat, lon, coords[0], coords[1]);
      if (dist < bestDist) {
        bestDist = dist;
        best = city;
        bestCountry = code;
      }
    }
  }
  if (!best) return null;
  const href = bestCountry === "ro" ? `/${slugifyCityName(best)}` : `/${bestCountry}/${slugifyCityName(best)}`;
  return { city: best, countryCode: bestCountry, distanceKm: Math.round(bestDist), href };
}

// normalizează un slug pentru comparare: minuscule, fără diacritice, fără spații/cratime
function normalizeSlug(raw) {
  let decoded;
  try {
    decoded = decodeURIComponent(raw);
  } catch (e) {
    decoded = raw;
  }
  return decoded
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimină diacritice (ă, â, î, ș, ț)
    .trim();
}

// găsește magazinul cerut în STORE_CONFIG, indiferent de forma exactă a slug-ului din URL.
// Returnează { key, config, displayName } sau null dacă slug-ul nu e recunoscut deloc.
// "key" e cheia canonică din STORE_CONFIG (ex: "lidl") — folosită și pentru a
// decide care link de afiliere din STORE_AFFILIATE_LINKS se aplică paginii.
function findStore(rawMagazinParam) {
  const normalized = normalizeSlug(rawMagazinParam);
  const collapsed = normalized.replace(/[\s_-]+/g, "");
  const dashed = normalized.replace(/[\s_]+/g, "-");

  if (STORE_CONFIG[collapsed]) {
    const config = STORE_CONFIG[collapsed];
    return { key: collapsed, config, displayName: config.name };
  }

  const aliasEntry = STORE_ALIASES[dashed] || STORE_ALIASES[collapsed];
  if (aliasEntry) {
    const config = STORE_CONFIG[aliasEntry.key];
    return { key: aliasEntry.key, config, displayName: aliasEntry.displayName || config.name };
  }

  return null;
}

// variantă generică de findStore, pentru configurațiile internaționale
// (DE_STORE_CONFIG / UK_STORE_CONFIG / ES_STORE_CONFIG) — fără STORE_ALIASES,
// nu au fost cerute pentru piețele noi.
function findStoreInConfig(rawMagazinParam, config) {
  const normalized = normalizeSlug(rawMagazinParam);
  const collapsed = normalized.replace(/[\s_-]+/g, "");
  if (config[collapsed]) {
    const cfg = config[collapsed];
    return { key: collapsed, config: cfg, displayName: cfg.name };
  }
  return null;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

// Scriptul care leagă orice căsuță ".city-filter-input" de lista ei
// (buildCitySelectorFilterScript a fost eliminat — nu mai avem input
// de căutare separat, doar "Scrie orașul tău" existent, deja funcțional)

function brandBadgeHtml(name, statusKey) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  const hue = hash < 0 ? hash + 360 : hash;
  const initial = escapeHtml(name.trim().charAt(0).toUpperCase());
  const statusAttr = statusKey ? ` data-status-key="${escapeHtml(statusKey)}"` : "";
  return `<span class="brand-badge" style="background:linear-gradient(135deg,hsl(${hue},68%,50%),hsl(${hue},62%,36%))" aria-hidden="true"${statusAttr}>${initial}</span>`;
}

// JSON sigur de injectat într-un <script> (evită breakout la "</script>")
function safeJson(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
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
    `script-src 'self' 'nonce-${nonce}' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagservices.com https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://widget.getyourguide.com https://unpkg.com https://maps.googleapis.com https://tp-em.com https://tpembd.com https://*.avs.io`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://tp-em.com https://tpembd.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://www.gstatic.com https://www.google-analytics.com https://widget.getyourguide.com https://*.tile.openstreetmap.org https://maps.gstatic.com https://maps.googleapis.com https://*.googleapis.com https://*.ggpht.com https://img.2performant.com https://*.avs.io https://tpembd.com https://tp-em.com",
    "connect-src 'self' https://api.bigdatacloud.net https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://securepubads.g.doubleclick.net https://static.doubleclick.net https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://widget.getyourguide.com https://*.getyourguide.com https://unpkg.com https://maps.googleapis.com https://tp-em.com https://tpembd.com https://www.travelpayouts.com https://*.avs.io https://avsplow.com https://*.avsplow.com",
    "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://tpembd.com https://*.avs.io",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/* ============================================================
   3) STILURI — identitate vizuală comună tuturor paginilor
   ============================================================ */
const CSS_STYLES = `
:root{
  --bg:#0F1115; --surface:#171A21; --surface-2:#1E2330; --border:#2A303D;
  --text:#F3F5F8; --muted:#8E96AA; --accent:#FF7A1A; --accent-dim:#4A2A16;
  --open-bg:#16A34A; --open-glow:rgba(22,163,74,.35);
  --closed-bg:#DC2626; --closed-glow:rgba(220,38,38,.35);
  --header-bg:rgba(15,17,21,.88);
  --glass-bg:rgba(23,26,33,.6); --glass-border:rgba(255,255,255,.08);
  --radius-lg:26px; --radius-md:16px;
  --font-display:'Sora',sans-serif; --font-body:'Inter',sans-serif; --font-mono:'JetBrains Mono',monospace;
}
/* Mod zi/noapte: respectă setarea telefonului (majoritatea telefoanelor deja
   comută automat "Dark Mode" seara, legat de apus/răsărit) — nu reinventăm
   asta cu un JS separat bazat pe ceas, care ar intra în conflict cu ce
   utilizatorul a ales deja la nivel de sistem. */
@media (prefers-color-scheme: light){
  :root{
    --bg:#FAF8F4; --surface:#FFFFFF; --surface-2:#F3F0EA; --border:#E8E3DA;
    --text:#1C1E24; --muted:#6B7280; --accent-dim:#FFE4CC;
    --header-bg:rgba(250,248,244,.88);
    --glass-bg:rgba(255,255,255,.6); --glass-border:rgba(0,0,0,.06);
  }
}
/* Comutator manual — suprascrie alegerea automată de mai sus, DOAR când
   utilizatorul a apăsat explicit comutatorul (altfel rămâne "auto", legat
   de telefon, ca înainte) */
html[data-theme="dark"]{
  --bg:#0F1115; --surface:#171A21; --surface-2:#1E2330; --border:#2A303D;
  --text:#F3F5F8; --muted:#8E96AA; --accent-dim:#4A2A16;
  --header-bg:rgba(15,17,21,.88);
  --glass-bg:rgba(23,26,33,.6); --glass-border:rgba(255,255,255,.08);
}
html[data-theme="light"]{
  --bg:#FAF8F4; --surface:#FFFFFF; --surface-2:#F3F0EA; --border:#E8E3DA;
  --text:#1C1E24; --muted:#6B7280; --accent-dim:#FFE4CC;
  --header-bg:rgba(250,248,244,.88);
  --glass-bg:rgba(255,255,255,.6); --glass-border:rgba(0,0,0,.06);
}
*{box-sizing:border-box;margin:0;padding:0;}
html{-webkit-text-size-adjust:100%;}
body{background:var(--bg) radial-gradient(600px circle at 88% -8%,rgba(255,122,26,.14),transparent 60%);color:var(--text);font-family:var(--font-body);line-height:1.5;-webkit-font-smoothing:antialiased;padding-bottom:calc(48px + 64px + env(safe-area-inset-bottom));}

/* Bottom Navigation Bar — fixă, vizibilă pe mobil pe toate paginile (vezi pageShell) */
.bottom-nav{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;background:var(--surface);border-top:1px solid var(--border);padding:8px 0 calc(8px + env(safe-area-inset-bottom));backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);}

/* Comutator manual de temă — buton plutitor, sus-dreapta */
.theme-toggle-btn{position:fixed;top:calc(64px + env(safe-area-inset-top));right:14px;z-index:11;width:38px;height:38px;border-radius:50%;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;}
.global-back-btn{position:fixed;top:calc(64px + env(safe-area-inset-top));left:14px;z-index:11;width:42px;height:42px;border-radius:50%;background:var(--surface);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:700;color:var(--text);cursor:grab;box-shadow:0 10px 24px -6px rgba(0,0,0,.45),0 2px 6px -1px rgba(0,0,0,.3);transition:box-shadow .15s ease,transform .15s ease;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}
.global-back-btn[hidden]{display:none;}
.global-back-btn:active{transform:translateY(1px) scale(.94);box-shadow:0 4px 12px -4px rgba(0,0,0,.4);}
.global-back-btn.is-dragging{cursor:grabbing;transform:scale(1.08);box-shadow:0 18px 38px -8px rgba(0,0,0,.55),0 5px 12px -2px rgba(0,0,0,.4);}
@media (min-width:900px){.global-back-btn:hover{box-shadow:0 14px 30px -6px rgba(0,0,0,.5),0 3px 8px -1px rgba(0,0,0,.35);}}
.bottom-nav-item{flex:1 1 0;display:flex;flex-direction:column;align-items:center;gap:2px;text-decoration:none;color:var(--muted);font-family:var(--font-display);font-size:11px;font-weight:600;}
.bottom-nav-icon{font-size:20px;line-height:1;}
@media (min-width: 900px){.bottom-nav{display:none;}body{padding-bottom:48px;}}
/* Link-ul de itinerar din antet — vizibil DOAR pe desktop (unde bara de jos
   nu există deloc, la fel ca regula de mai sus). Pe mobil, bara de jos are
   deja propriul buton "🧭 Itinerar" — dacă am fi arătat și link-ul din
   antet acolo, ar fi apărut duplicat, înghesuit sub "Ghiduri" (semnalat
   direct: "scoate Itinerar de sub Ghid... nu duplica"). */
@media (max-width: 899px){.itin-nav-link{display:none;}}
@media (prefers-reduced-motion: reduce){*{animation-duration:.001ms !important;transition-duration:.001ms !important;}}
a{color:inherit;text-decoration:none;}
.wrap{max-width:520px;margin:0 auto;padding:0 18px;}
header{position:sticky;top:0;z-index:10;background:var(--header-bg);backdrop-filter:blur(10px);border-bottom:1px solid var(--border);padding:calc(14px + env(safe-area-inset-top)) 0 14px;}
.header-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;}
.header-row .brand-stack{justify-self:start;display:flex;flex-direction:column;align-items:flex-start;gap:2px;}
.guides-link{font-family:var(--font-display);font-size:11px;font-weight:600;color:var(--accent);text-decoration:none;white-space:nowrap;}
.guides-link:hover{opacity:0.85;}
.header-row .live-clock{justify-self:center;}
.theme-toggle-btn.in-header{position:static;justify-self:end;width:34px;height:34px;font-size:15px;}
.brand{font-family:var(--font-display);font-weight:800;font-size:17px;letter-spacing:-.01em;}
.brand span{color:var(--accent);}
.live-clock{font-family:var(--font-mono);font-weight:600;font-size:14px;color:var(--muted);display:flex;align-items:center;gap:7px;}
.dot{width:7px;height:7px;border-radius:50%;background:var(--accent);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.25;}}
.breadcrumb{margin:16px 18px 0;font-size:13px;color:var(--muted);}
.breadcrumb a{color:var(--accent);}
.page-h1{margin:10px 18px 16px;font-family:var(--font-display);font-weight:800;font-size:22px;letter-spacing:-.01em;}
.store-scroll{display:flex;gap:8px;overflow-x:auto;padding:16px 18px 4px;scrollbar-width:none;}
.store-scroll::-webkit-scrollbar{display:none;}
.chip{flex:0 0 auto;font-family:var(--font-body);font-weight:600;font-size:14px;color:var(--muted);background:var(--surface);border:1px solid var(--border);padding:9px 16px;border-radius:100px;white-space:nowrap;transition:all .15s ease;}
/* micro-interacțiuni: feedback tactil discret la apăsare, pe toate butoanele importante */
.chip,.city-search-btn,.geo-btn,.sub-nav-tab,.fav-star,.country-flag-btn,.clear-country-btn,a.affiliate-btn,a.amazon-btn,a.ticket-btn,.affiliate-btn-emag,.affiliate-btn-generic{transition:transform .12s ease,opacity .12s ease,background .15s ease,color .15s ease;}
.chip:active,.city-search-btn:active,.geo-btn:active,.sub-nav-tab:active,.fav-star:active,.country-flag-btn:active,.clear-country-btn:active,a.affiliate-btn:active,a.amazon-btn:active,a.ticket-btn:active,.affiliate-btn-emag:active,.affiliate-btn-generic:active{transform:scale(.96);}
.status-card:active{transform:scale(.995);}
.brand-badge{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;color:#fff;font-family:var(--font-display);font-weight:800;font-size:13px;margin-right:12px;flex:0 0 auto;vertical-align:middle;box-shadow:0 3px 8px -2px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.25);text-shadow:0 1px 1px rgba(0,0,0,.2);}
.mall-list li{display:flex;align-items:center;padding-left:16px;}
.mall-list li[hidden]{display:none;}
.city-map{height:280px;border-radius:var(--radius-md);overflow:hidden;margin:14px 18px 0;border:1px solid var(--border);background:var(--surface);}
.map-live-toggle{display:flex;align-items:center;gap:8px;margin:14px 18px 4px;font-size:14px;color:var(--text);}
.map-live-status{margin:0 18px 4px;font-size:12.5px;color:var(--muted);}
.chip.active{background:var(--accent);color:#1A1200;border-color:var(--accent);}
main{padding-top:8px;}
.ad-slot{margin:14px 18px 0;border-radius:var(--radius-md);overflow:hidden;text-align:center;}
.ad-slot:empty{display:none;margin:0;}
.status-card{margin:14px 18px 0;padding:30px 24px 26px;border-radius:var(--radius-lg);text-align:center;position:relative;overflow:hidden;transition:background .3s ease;animation:swing-in .5s cubic-bezier(.2,.9,.3,1.2);background:var(--surface-2);}
@keyframes swing-in{0%{transform:rotate(-2deg) translateY(-6px);opacity:0;}100%{transform:rotate(0) translateY(0);opacity:1;}}
.status-card.is-open{background:var(--open-bg);box-shadow:0 18px 40px -12px var(--open-glow);}
.status-card.is-closed{background:var(--closed-bg);box-shadow:0 18px 40px -12px var(--closed-glow);}
.store-name{font-family:var(--font-display);font-weight:700;font-size:15px;color:rgba(255,255,255,.85);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;}
.status-text{font-family:var(--font-display);font-weight:800;font-size:clamp(28px,8vw,36px);color:#fff;letter-spacing:-.01em;margin-bottom:8px;}
.status-sub{font-family:var(--font-body);font-weight:500;font-size:14.5px;color:rgba(255,255,255,.88);}

/* Adresă + telefon (contactInfoHtml) — sub cardul de status */
.contact-info-block{margin:10px 18px 0;padding:14px 16px;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:var(--radius-md);}

/* Raportare comunitară (buildReportIssueHtml) */
.report-issue-block{margin:14px 18px 0;}

/* "Cum ajung acolo?" (buildHowToGetThereHtml) */
.how-to-get-there-block{margin:14px 18px 0;}

/* Planifică vizita (buildBookingPlanningButtonsHtml) — pliabil, culori distincte per opțiune */
.plan-visit-block{margin:14px 18px 0;}
/* Widget extern (Kiwi/Travelpayouts) — fundal deschis, propriu, ca insulă
   pe pagina închisă la culoare; widget-ul are componente proprii (câmpuri,
   text) gândite pentru fundal deschis, indiferent de parametrii de culoare
   trimiși în URL — încadrarea într-un card alb face tranziția vizuală
   naturală, nu o pată bruscă pe fundalul dark al site-ului. */
.flight-widget-card{width:100vw;max-width:700px;position:relative;left:50%;transform:translateX(-50%);box-sizing:border-box;margin-top:20px;padding:16px;background:#fff;border-radius:var(--radius-md);box-shadow:0 12px 26px -10px rgba(0,0,0,.4);overflow:visible;min-height:60px;}
.plan-visit-btn{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:100px;padding:13px 18px;font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text);cursor:pointer;}
.plan-visit-hint{margin:8px 4px 0;text-align:center;font-size:13px;color:var(--muted);}
.plan-visit-panel{margin-top:8px;display:flex;flex-direction:column;gap:8px;}
.plan-visit-panel[hidden]{display:none;}
.plan-visit-option{display:block;text-align:center;padding:13px 18px;border-radius:100px;font-family:var(--font-display);font-weight:700;font-size:13.5px;text-decoration:none;}
.plan-visit-ticket{background:linear-gradient(135deg,#FF5533,#FF8A5B);color:#fff;}
.plan-visit-booking{background:linear-gradient(135deg,#003580,#0057B8);color:#fff;}
.plan-visit-parking{background:#FEF3C7;color:#78350F;}
.plan-visit-parking-alt{background:linear-gradient(135deg,#10B981,#047857);color:#fff;}
.how-to-get-there-btn{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:100px;padding:13px 18px;font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text);cursor:pointer;}
.how-to-get-there-panel{margin-top:8px;display:flex;flex-direction:column;gap:8px;}
.how-to-get-there-panel[hidden]{display:none;}
.how-to-get-there-option{display:block;text-align:center;padding:13px 18px;border-radius:100px;font-family:var(--font-display);font-weight:700;font-size:13.5px;text-decoration:none;background:linear-gradient(135deg,#0EA5E9,#0369A1);color:#fff;}
.how-to-get-there-option-alt{background:linear-gradient(135deg,#8B5CF6,#5B21B6);}
.report-issue-btn{width:100%;background:none;border:1px solid var(--border);border-radius:100px;padding:11px 18px;font-family:var(--font-display);font-weight:600;font-size:13px;color:var(--muted);cursor:pointer;}
.report-issue-btn:disabled{opacity:.6;cursor:default;}
.report-issue-panel{margin-top:10px;padding:14px 16px;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:var(--radius-md);}
.report-issue-title{font-size:13.5px;font-weight:700;color:var(--text);margin-bottom:8px;}
.report-reason-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;}
.report-reason-chip{background:var(--surface);border:1px solid var(--border);border-radius:100px;padding:7px 13px;font-family:var(--font-body);font-size:12.5px;color:var(--text);cursor:pointer;}
.report-reason-chip.is-selected{background:var(--accent);border-color:var(--accent);color:#fff;}
.report-yn-row{display:flex;gap:8px;}
.report-yn-btn{flex:1 1 0;background:var(--surface);border:1px solid var(--border);border-radius:100px;padding:11px 18px;font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text);cursor:pointer;}
.report-issue-note{display:block;width:100%;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:10px 12px;color:var(--text);font-family:var(--font-body);font-size:13.5px;resize:vertical;min-height:60px;margin-bottom:10px;}
.report-issue-submit{width:100%;background:var(--accent);border:none;border-radius:100px;padding:11px 18px;font-family:var(--font-display);font-weight:700;font-size:13.5px;color:#fff;cursor:pointer;}
.report-issue-submit:disabled{opacity:.4;cursor:not-allowed;}
.report-issue-msg{margin-top:8px;font-size:13px;text-align:center;}
.report-issue-msg.is-success{color:#22C55E;}
.report-issue-msg.is-error{color:#DC2626;}
.closed-permanently-card{margin:14px 18px 0;padding:24px;background:linear-gradient(135deg,#DC2626,#7F1D1D);border-radius:var(--radius-lg);text-align:center;color:#fff;}
.closed-permanently-card h2{font-family:var(--font-display);font-size:19px;margin-bottom:6px;}
.closed-permanently-card p{font-size:13.5px;opacity:.9;}
.reported-wrong-banner{margin:14px 18px 0;padding:14px 16px;background:rgba(220,38,38,.12);border:1px solid rgba(220,38,38,.35);border-radius:var(--radius-md);font-size:13.5px;color:var(--text);}
.contact-info-row{font-size:14px;color:var(--text);}
.contact-info-row + .contact-info-row{margin-top:6px;}
.contact-info-row a{color:var(--accent);text-decoration:none;font-weight:600;}
.status-badge{display:inline-flex;align-items:center;gap:6px;margin-top:14px;background:rgba(255,255,255,.16);border-radius:100px;padding:5px 12px;font-family:var(--font-mono);font-size:12.5px;color:#fff;font-weight:600;}
.status-badge .dotw{width:6px;height:6px;border-radius:50%;background:#fff;}
@keyframes pulse-glow{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.5);}70%{box-shadow:0 0 0 7px rgba(255,255,255,0);}}
.status-card.is-open .status-badge .dotw{animation:pulse-glow 1.8s ease-in-out infinite;}
.status-card.is-closed .status-badge .dotw{opacity:.6;}
.closing-soon-bar{margin-top:14px;height:5px;border-radius:100px;background:rgba(255,255,255,.22);overflow:hidden;}
.closing-soon-fill{height:100%;background:#fff;border-radius:100px;transition:width 1s linear,background .3s ease;}
.closing-soon-fill.is-urgent{background:var(--accent);}
.secondary-badge{margin:10px 18px 0;display:flex;align-items:center;gap:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px 16px;}
.sb-dot{width:10px;height:10px;border-radius:50%;flex:0 0 auto;background:var(--muted);}
.secondary-badge.sb-open .sb-dot{background:var(--open-bg);}
.secondary-badge.sb-closed .sb-dot{background:var(--closed-bg);}
.sb-text{flex:1 1 auto;display:flex;flex-direction:column;gap:2px;}
.sb-label{font-weight:600;font-size:13.5px;}
.sb-sub{font-size:12px;color:var(--muted);}
.sb-state{font-family:var(--font-mono);font-weight:700;font-size:12.5px;flex:0 0 auto;}
.secondary-badge.sb-open .sb-state{color:var(--open-bg);}
.secondary-badge.sb-closed .sb-state{color:#F87171;}
.affiliate-btn{display:block;text-align:center;width:calc(100% - 36px);margin:14px 18px 0;padding:15px 20px;border-radius:100px;font-family:var(--font-display);font-weight:700;font-size:15px;text-decoration:none;transition:transform .15s ease,opacity .15s ease;}
.affiliate-banner-link{display:block;text-align:center;margin:14px 18px 0;}
.affiliate-banner-link img{max-width:100%;height:auto;border-radius:var(--radius-md);display:inline-block;box-shadow:0 12px 26px -10px rgba(0,0,0,.4);transition:transform .15s ease;}
.affiliate-banner-link:hover img{transform:translateY(-2px);}
.affiliate-btn:hover{opacity:.92;transform:translateY(-1px);}
.affiliate-btn-emag{background:linear-gradient(135deg,#0058CC 0%,#6A2FD9 55%,#C81ED6 100%);color:#fff;box-shadow:0 12px 26px -10px rgba(106,47,217,.5);display:flex;align-items:center;justify-content:center;gap:10px;transition:transform .18s ease,box-shadow .25s ease;}
.affiliate-btn-emag:hover{transform:translateY(-2px);box-shadow:0 18px 34px -8px rgba(200,30,214,.55),0 8px 18px -6px rgba(0,88,204,.4);}
.affiliate-btn-emag svg{width:20px;height:20px;flex:0 0 auto;}
.affiliate-btn-generic{background:linear-gradient(135deg,#FF5F1F,#FF7A1A);color:#1A1200;box-shadow:0 12px 26px -10px rgba(255,120,30,.5);}
.affiliate-btn-cta{display:flex;align-items:center;justify-content:center;gap:10px;}
.affiliate-cta-arrow{font-size:22px;font-weight:900;line-height:1;flex:0 0 auto;animation:affiliateCtaNudge 1.4s ease-in-out infinite;}
@keyframes affiliateCtaNudge{0%,100%{transform:translateX(0);}50%{transform:translateX(5px);}}
@media (prefers-reduced-motion: reduce){.affiliate-cta-arrow{animation:none;}}
.cinema-card{margin:14px 18px 0;padding:28px 24px;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:var(--radius-lg);text-align:center;}
.cinema-note{font-size:13px;color:var(--muted);line-height:1.6;margin:10px 0 18px;}
.cinema-btn{display:inline-block;background:linear-gradient(135deg,#E63946,#FF6B6B);color:#fff;text-decoration:none;font-family:var(--font-display);font-weight:700;font-size:15px;padding:14px 26px;border-radius:100px;box-shadow:0 12px 26px -10px rgba(230,57,70,.5);}
.amazon-btn{display:block;text-align:center;width:calc(100% - 36px);margin:14px 18px 0;padding:15px 20px;border-radius:100px;font-family:var(--font-display);font-weight:700;font-size:15px;text-decoration:none;background:linear-gradient(135deg,#131A22,#232F3E);color:#FF9900;border:1px solid #FF9900;box-shadow:0 12px 26px -10px rgba(0,0,0,.5);}
.amazon-btn-cta{display:flex;align-items:center;justify-content:center;gap:10px;}
.ticket-btn{display:block;text-align:center;width:calc(100% - 36px);margin:8px 18px 16px;padding:14px 20px;border-radius:100px;font-family:var(--font-display);font-weight:700;font-size:14.5px;text-decoration:none;background:linear-gradient(135deg,#FF5533,#FF8A5B);color:#fff;box-shadow:0 12px 26px -10px rgba(255,85,51,.5);}
.sub-nav-tabs{display:flex;gap:6px;margin:14px 18px 0;background:#1e1e1e;border-radius:var(--radius-md);padding:6px;}
.sub-nav-tab{flex:1 1 0;min-width:0;background:transparent;border:none;border-radius:calc(var(--radius-md) - 4px);padding:13px 10px;font-family:var(--font-display);font-weight:700;font-size:13.5px;color:var(--muted);cursor:pointer;transition:background .18s ease,color .18s ease;text-align:center;min-height:44px;word-break:break-word;overflow-wrap:break-word;}
.sub-nav-tab.active{background:var(--accent);color:#1A1200;}
.sub-nav-panel{display:none;}
.sub-nav-panel.active{display:block;}
.attractions-country{margin:20px 18px 8px;font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text);}
.geo-country-highlight{margin:14px 18px 0;padding:12px 16px;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--accent);border-radius:var(--radius-md);font-size:13.5px;color:var(--muted);text-align:center;}
.install-banner{display:flex;align-items:center;gap:10px;padding:12px 16px;background:linear-gradient(135deg,var(--accent),#FF9A4D);color:#fff;font-size:13px;cursor:pointer;}
.install-banner-icon{font-size:18px;flex-shrink:0;}
.install-banner-text{flex:1;line-height:1.4;}
.install-banner-close{background:none;border:none;color:#fff;font-size:16px;cursor:pointer;padding:4px 8px;flex-shrink:0;opacity:0.85;}
.install-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:none;align-items:flex-end;justify-content:center;}
.install-overlay.active{display:flex;}
.install-modal{background:var(--surface);width:100%;max-width:560px;border-radius:20px 20px 0 0;padding:24px;border:1px solid var(--border);}
.install-modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
.install-modal-header h3{font-family:var(--font-display);font-size:19px;margin:0;}
.install-modal-close{background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:4px;}
.install-step-card{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius-md);padding:16px;margin-bottom:14px;}
.install-step-card p{margin:8px 0 0;font-size:14px;line-height:1.5;color:var(--muted);}
.install-safari-btn{display:block;width:100%;background:var(--accent);color:#fff;text-align:center;padding:14px;border-radius:var(--radius-md);text-decoration:none;font-weight:700;border:none;font-size:15px;cursor:pointer;box-sizing:border-box;}
.install-fallback-text{margin-top:10px;font-size:12.5px;color:var(--muted);text-align:center;}
.install-confirm-btn{display:block;width:100%;background:var(--accent);color:#fff;text-align:center;padding:14px;border-radius:var(--radius-md);border:none;font-weight:700;font-size:15px;cursor:pointer;}
.geo-country-highlight strong{color:var(--accent);}
.search-box-wrap{position:relative;margin:14px 18px 0;}
.search-box-wrap .city-search-input{width:100%;}
.search-results{display:none;position:absolute;left:0;right:0;top:calc(100% + 6px);background:var(--glass-bg);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid var(--glass-border);border-radius:var(--radius-md);box-shadow:0 16px 32px -12px rgba(0,0,0,.6);z-index:20;max-height:320px;overflow-y:auto;}
.search-result-row{display:flex;align-items:center;gap:8px;padding:2px 10px;}
.search-result-row + .search-result-row{border-top:1px solid var(--border);}
.search-result-item{flex:1 1 auto;display:block;padding:11px 4px;font-size:14px;font-weight:600;color:var(--text);text-decoration:none;}
.search-result-empty{padding:14px 16px;font-size:13px;color:var(--muted);}
.search-result-submit-place{display:inline-block;margin-top:8px;color:var(--accent);font-weight:700;text-decoration:none;font-size:13.5px;}
.search-result-submit-place:hover{text-decoration:underline;}
.search-result-itin-cta{display:block;padding:12px 16px;font-size:13.5px;font-weight:700;color:var(--accent);text-decoration:none;border-top:1px solid var(--border);background:rgba(255,255,255,.02);}
.intro-inline-link{color:var(--accent);font-weight:700;text-decoration:none;}
.intro-inline-link:hover{text-decoration:underline;}
.search-result-itin-cta:hover{background:rgba(255,255,255,.05);}
.fav-star{flex:0 0 auto;background:none;border:none;color:var(--muted);font-size:19px;line-height:1;cursor:pointer;padding:8px;min-width:36px;min-height:36px;}
/* Acordeon de obiective turistice, cu lazy-loading (vezi buildAttractionAccordionScript) */
.attraction-accordion-list{list-style:none;margin:14px 18px 0;display:flex;flex-direction:column;gap:8px;}
.category-context-filter{display:flex;align-items:center;gap:6px;margin:6px 18px 0;font-size:12.5px;color:var(--muted);cursor:pointer;}
.category-context-filter input{cursor:pointer;}
.attraction-alpha-index{display:flex;flex-wrap:wrap;gap:4px;margin:8px 18px 0;}
.alpha-index-btn{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:6px;color:var(--text);font-size:12px;font-weight:700;padding:4px 8px;min-width:26px;cursor:pointer;}
.alpha-index-btn:hover,.alpha-index-btn:active{background:var(--accent);border-color:var(--accent);color:#fff;}
.attraction-accordion-item.alpha-jump-highlight{outline:2px solid var(--accent);outline-offset:2px;transition:outline-color .3s;}

/* Grupuri de categorii/subcategorii (<details> native — categorii pe țară,
   insulă -> Plaje Sălbatice/Organizate etc.). Nu aveau NICIUN stil propriu
   până acum (rămâneau pe stilul brut de browser), de-asta grupurile
   apăreau lipite unul sub altul, fără indentare pentru subgrupuri și
   foarte înghesuite pe mobil. */
.attraction-category-group{
  margin:10px 18px 0;
  background:var(--glass-bg);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border:1px solid var(--glass-border);
  border-radius:var(--radius-md);
  overflow:hidden;
}
.attraction-category-summary{
  display:flex;align-items:center;gap:8px;
  list-style:none;
  padding:14px 16px;
  cursor:pointer;
  font-family:var(--font-body);
  font-size:14.5px;font-weight:700;color:var(--text);
  -webkit-tap-highlight-color:transparent;
}
.attraction-category-summary::-webkit-details-marker{display:none;}
.attraction-category-summary::before{
  content:"";
  flex:0 0 auto;width:8px;height:8px;
  border-right:2px solid var(--muted);border-bottom:2px solid var(--muted);
  transform:rotate(-45deg);
  transition:transform .2s ease;
  margin-right:2px;
}
.attraction-category-group[open] > .attraction-category-summary::before{transform:rotate(45deg);}
.attraction-category-count{margin-left:auto;font-weight:600;color:var(--muted);font-size:13px;flex:0 0 auto;}
.attraction-category-group > .attraction-accordion-list{margin-top:10px;}
.attraction-category-group > .category-context-filter{margin-top:0;padding-bottom:10px;}

/* Subgrupurile (ex: o insulă, care conține la rândul ei Sălbatice/
   Organizate) — indentate vizibil la dreapta față de grupul-părinte,
   ca ierarhia să se vadă dintr-o privire, plus spațiu clar între ele
   ca să nu mai pară lipite. */
.attraction-category-group .attraction-category-group{
  margin:10px 12px 12px 22px;
}
.attraction-category-group .attraction-category-group .attraction-category-summary{
  font-size:14px;font-weight:600;padding:12px 14px;
}
/* al treilea nivel (Sălbatice/Organizate în interiorul unei insule) — un
   pas suplimentar spre dreapta, mai vizibil separat */
.attraction-category-group .attraction-category-group .attraction-category-group{
  margin:8px 8px 10px 18px;
}
.beach-region-group + .beach-region-group{margin-top:10px;}
.beach-subtype-group + .beach-subtype-group{margin-top:8px;}

@media (max-width:420px){
  .attraction-category-group{margin-left:12px;margin-right:12px;}
  .attraction-category-summary{padding:13px 12px;font-size:14px;}
  .attraction-category-group .attraction-category-group{margin-left:16px;margin-right:8px;}
  .attraction-category-group .attraction-category-group .attraction-category-summary{font-size:13.5px;padding:11px 12px;}
  .attraction-category-group .attraction-category-group .attraction-category-group{margin-left:14px;margin-right:6px;}
}
.attraction-recommended-badge{margin-right:4px;}
.beach-island-heading{margin:14px 18px 4px;font-size:14px;font-weight:800;color:var(--accent);}
.beach-car-hint a{color:var(--accent);text-decoration:none;font-weight:600;}
.vote-widget{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0;}
.vote-btn{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:999px;color:var(--text);font-size:13.5px;font-weight:600;padding:10px 18px;cursor:pointer;font-family:var(--font-body);}
.vote-btn:hover{border-color:var(--accent);}
.vote-btn.voted{color:var(--accent);border-color:var(--accent);cursor:default;}
.vote-btn:disabled{opacity:.85;}
.vote-popular-badge{font-size:12.5px;font-weight:700;color:var(--accent);background:rgba(255,255,255,.06);border-radius:999px;padding:6px 12px;}
.beach-tags-widget{margin:14px 0;}
.beach-tags-winning{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
.beach-tag-badge{font-size:12.5px;font-weight:700;color:#fff;background:linear-gradient(135deg,#1e90ff,#00c9a7);border-radius:999px;padding:6px 12px;}
.beach-tags-vote-row{display:flex;flex-wrap:wrap;gap:6px;}
.beach-tag-vote-btn{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:999px;color:var(--text);font-size:12px;font-weight:600;padding:8px 12px;cursor:pointer;font-family:var(--font-body);}
.beach-tag-vote-btn:hover{border-color:var(--accent);}
.beach-tag-vote-btn.voted{color:var(--accent);border-color:var(--accent);cursor:default;}
.itinerary-promo-card{display:block;text-decoration:none;background:linear-gradient(135deg,var(--accent),#ff8a3d);border-radius:var(--radius-md);padding:18px 20px;margin:14px 0;box-shadow:0 4px 16px rgba(255,107,53,.25);}
.itinerary-promo-title{font-size:16px;font-weight:800;color:#fff;margin-bottom:6px;}
.itinerary-promo-text{font-size:13.5px;color:rgba(255,255,255,.92);line-height:1.4;margin-bottom:10px;}
.itinerary-promo-cta{font-size:13.5px;font-weight:700;color:#fff;}
.itinerary-promo-empty{margin:10px 0;padding:14px 16px;}
.itinerary-promo-empty .itinerary-promo-title{font-size:14px;margin-bottom:4px;}
.itinerary-promo-empty .itinerary-promo-cta{font-size:12.5px;}
/* Card centralizat de voturi la plaje — cerut explicit: spațiere între
   etichetă și număr, buton "Lasă recenzia" mare, portocaliu, centrat, care
   ascunde restul (grila de voturi) la click, ca să nu rămână înghesuit. */
.beach-vote-central{margin:16px 0;}
.beach-vote-title{font-size:15px;font-weight:800;color:var(--text);margin-bottom:10px;}
.beach-vote-grid{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;}
.beach-vote-grid[hidden],.beach-vote-title[hidden]{display:none;}
.beach-vote-card{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:10px;padding:10px 14px;}
.bvc-label{font-size:13.5px;color:var(--text);}
.bvc-count{font-size:14px;font-weight:800;color:var(--accent);min-width:24px;text-align:right;}
.beach-review-cta{display:block;width:100%;text-align:center;background:linear-gradient(135deg,var(--accent),#ff8a3d);color:#fff;border:none;border-radius:var(--radius-md);padding:16px 20px;font-family:var(--font-display);font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 4px 16px rgba(255,107,53,.25);}
.beach-review-cta[hidden]{display:none;}
.beach-review-form{display:flex;flex-direction:column;gap:10px;margin-top:14px;}
.beach-review-form[hidden]{display:none;}
.beach-review-q{display:flex;flex-direction:column;gap:6px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:10px;padding:12px 14px;}
.beach-review-q-text{font-size:13.5px;font-weight:600;color:var(--text);}
.beach-review-q label{font-size:13px;color:var(--muted);margin-right:14px;cursor:pointer;}
.beach-review-submit{background:linear-gradient(135deg,var(--accent),#ff8a3d);color:#fff;border:none;border-radius:var(--radius-md);padding:14px 20px;font-family:var(--font-display);font-weight:800;font-size:14.5px;cursor:pointer;}
.beach-review-thanks{text-align:center;color:var(--accent);font-weight:700;font-size:13.5px;}
.beach-monetization-banner{display:block;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius-md);padding:12px 16px;margin:14px 18px 0;font-size:13px;color:var(--muted);text-align:center;}
.beach-content-block{margin:16px 0;}
.beach-content-heading{font-size:14.5px;font-weight:800;color:var(--text);margin-bottom:8px;}
.beach-content-text{font-size:13.5px;color:var(--muted);line-height:1.5;text-align:justify;text-justify:inter-word;hyphens:auto;}
.beach-content-list{list-style:none;display:flex;flex-direction:column;gap:8px;}
.beach-content-list li{font-size:13.5px;color:var(--muted);line-height:1.5;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:10px;padding:10px 14px;text-align:justify;text-justify:inter-word;hyphens:auto;}
.beach-content-list li strong{color:var(--text);}
.beach-content-equipment{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius-md);padding:14px 16px;margin:14px 18px 0;}
.beach-content-equipment .beach-content-list li{background:none;border:none;padding:4px 0;}

/* Formular "Propune un loc" — cerut explicit, era complet nestilizat (font
   implicit de browser, minuscul, îngrămădit). Aranjat ca formular modern,
   spațiat, cu text mare, lizibil. */
.submit-place-form{display:flex;flex-direction:column;gap:18px;margin:20px 0;}
.submit-place-label{display:flex;flex-direction:column;gap:8px;font-size:14.5px;font-weight:700;color:var(--text);}
.submit-place-label input,
.submit-place-label select,
.submit-place-label textarea{
  font-family:var(--font-body);font-size:16px;color:var(--text);background:var(--glass-bg);
  border:1px solid var(--glass-border);border-radius:12px;padding:14px 16px;width:100%;box-sizing:border-box;
}
.submit-place-label textarea{resize:vertical;min-height:80px;}
.submit-place-label input::placeholder,
.submit-place-label textarea::placeholder{color:var(--muted);}
.submit-place-btn{
  display:block;width:100%;text-align:center;background:linear-gradient(135deg,var(--accent),#ff8a3d);
  color:#fff;border:none;border-radius:var(--radius-md);padding:17px 20px;font-family:var(--font-display);
  font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 4px 16px rgba(255,107,53,.25);margin-top:6px;
}
.submit-place-thanks{text-align:center;color:var(--accent);font-weight:700;font-size:15px;margin-top:14px;}
.submit-place-error{text-align:center;color:#e53935;font-weight:600;font-size:14px;margin-top:14px;}
.attraction-accordion-item{background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:var(--radius-md);overflow:hidden;}
.attraction-accordion-header{width:100%;display:flex;align-items:center;gap:10px;background:none;border:none;padding:14px 16px;cursor:pointer;text-align:left;font-family:var(--font-body);font-size:14.5px;font-weight:600;color:var(--text);}
.attraction-accordion-header .attraction-name{flex:1 1 auto;}
.attraction-accordion-header .accordion-chevron{flex:0 0 auto;width:18px;height:18px;transition:transform .2s ease;color:var(--muted);}
.attraction-accordion-item.is-open .accordion-chevron{transform:rotate(180deg);}
.attraction-accordion-panel{padding:0 16px 16px;}
.gyg-widget-fallback{display:none;margin-top:4px;}
.accordion-status-link{display:flex;align-items:center;gap:6px;font-size:13.5px;font-weight:600;color:var(--accent);text-decoration:none;margin-bottom:10px;}

/* Widget contextual — alternative după status (vezi buildContextualWidgetHtml) */
.contextual-widget{margin:14px 18px 0;padding:16px;border-radius:var(--radius-md);transition:background .25s ease;}

/* Buton "Mergi acum" (Waze) — verde-pulsant când e deschis, roșu static când e închis */
.go-now-btn{display:block;text-align:center;width:100%;padding:13px 20px;border-radius:100px;font-family:var(--font-display);font-weight:700;font-size:14px;text-decoration:none;color:#fff;}
.go-now-btn[hidden]{display:none;}
.brand-badge.status-open,.brand-badge.status-closed{position:relative;}
.brand-badge.status-open{background:#22C55E!important;animation:goNowPulse 1.8s infinite;}
.brand-badge.status-closed{background:#DC2626!important;}
.go-now-btn.is-open{background:#22C55E;box-shadow:0 0 0 0 rgba(34,197,94,.6);animation:goNowPulse 1.8s infinite;}
.go-now-btn.is-closed{background:#DC2626;}
@keyframes goNowPulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.55);}70%{box-shadow:0 0 0 14px rgba(34,197,94,0);}100%{box-shadow:0 0 0 0 rgba(34,197,94,0);}}
@media (prefers-reduced-motion: reduce){.go-now-btn.is-open{animation:none;}}
.contextual-widget.is-open{background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);}
.contextual-widget.is-closed{background:linear-gradient(135deg,#DC2626,#F97316);box-shadow:0 12px 26px -10px rgba(220,38,38,.5);}
.contextual-widget-alert-text{font-weight:700;font-size:14px;color:#fff;margin-bottom:10px;}
.contextual-widget-btn{display:block;text-align:center;width:100%;margin-bottom:8px;padding:12px 18px;border-radius:100px;font-family:var(--font-display);font-weight:700;font-size:13.5px;text-decoration:none;background:var(--accent);color:#fff;}
.contextual-widget.is-closed .contextual-widget-btn{background:#fff;color:#DC2626;}
.contextual-widget.is-closed .contextual-widget-btn-secondary{background:rgba(255,255,255,.18);color:#fff;border:1px solid rgba(255,255,255,.4);}
.accordion-ticket-btn{display:block;text-align:center;width:100%;margin:0 0 10px;padding:13px 20px;border-radius:100px;font-family:var(--font-display);font-weight:700;font-size:14px;text-decoration:none;background:linear-gradient(135deg,#FF5533,#FF8A5B);color:#fff;box-shadow:0 10px 22px -10px rgba(255,85,51,.5);}

.attraction-accordion-header-row{display:flex;align-items:stretch;}

.fav-star.is-fav{color:var(--accent);}
.fav-empty{margin:14px 18px 0;font-size:13.5px;color:var(--muted);}
.lang-switcher{margin:10px 18px 0;}
.lang-switcher select{width:100%;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:var(--radius-md);padding:12px 16px;color:var(--text);font-family:var(--font-body);font-size:14.5px;cursor:pointer;}
.clear-country-btn{background:var(--surface);border:1px solid var(--border);color:var(--accent);font-family:var(--font-body);font-weight:600;font-size:13px;padding:8px 14px;border-radius:100px;cursor:pointer;}
.country-filter-bar{margin-top:0;}
.attraction-city-tag{color:var(--muted);font-size:12px;font-weight:500;}
.city-filter-bar{margin:8px 18px 0;padding:0;}
.section-title{font-family:var(--font-display);font-weight:700;font-size:16px;margin:30px 18px 12px;display:flex;align-items:center;gap:8px;}
.section-title .bar{width:4px;height:16px;background:var(--accent);border-radius:2px;}
.schedule-card{margin:0 18px;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:var(--radius-md);overflow:hidden;}
table{width:100%;border-collapse:collapse;font-size:14.5px;}
thead th{text-align:left;font-family:var(--font-body);font-weight:600;font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);padding:12px 16px;border-bottom:1px solid var(--border);}
tbody td{padding:12px 16px;font-weight:500;}
tbody tr{border-bottom:1px solid var(--border);}
tbody tr:last-child{border-bottom:none;}
.day-cell{font-family:var(--font-body);font-weight:600;color:var(--text);}
.hours-cell{font-family:var(--font-mono);font-weight:500;color:var(--muted);text-align:right;}
tbody tr.today{background:var(--accent-dim);}
tbody tr.today .day-cell,tbody tr.today .hours-cell{color:var(--accent);}
tbody tr.today .day-cell::after{content:" • azi";font-family:var(--font-body);font-weight:600;font-size:11px;opacity:.85;}
.holiday-card{margin:12px 18px 0;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:var(--radius-md);padding:14px 16px;}
.faq-item{padding:10px 0;border-bottom:1px solid var(--glass-border);}
.faq-item:last-child{border-bottom:none;}
.faq-item summary{font-weight:600;cursor:pointer;font-size:14.5px;}
.faq-item p{margin:8px 0 0;font-size:14px;color:var(--muted);line-height:1.5;}
.holiday-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:14px;}
.holiday-row + .holiday-row{border-top:1px solid var(--border);}
.holiday-label{font-weight:600;}
.holiday-hours{font-family:var(--font-mono);color:var(--muted);font-size:13.5px;}
.holiday-hours.closed{color:#F87171;}
.mall-list{list-style:none;margin:0 18px;display:flex;flex-direction:column;gap:8px;}
.mall-list[hidden]{display:none;}
.mall-list li{background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:var(--radius-md);}
.mall-list a{display:block;padding:14px 16px 14px 0;font-weight:600;font-size:14.5px;flex:1 1 auto;}
.mall-list a:hover{color:var(--accent);}
.intro-text{margin:16px 18px 0;font-size:14.5px;color:var(--muted);line-height:1.7;text-align:center;}
.geo-btn{display:block;width:calc(100% - 36px);margin:16px 18px 0;background:var(--accent);color:#1A1200;border:none;border-radius:100px;padding:14px 20px;font-family:var(--font-display);font-weight:700;font-size:15px;cursor:pointer;transition:opacity .15s ease;}
.geo-btn:disabled{opacity:.6;cursor:default;}
.geo-status{margin:10px 18px 0;font-size:13px;color:var(--muted);}
.city-search-form{display:flex;gap:8px;margin:16px 18px 0;}
.city-search-input{flex:1 1 auto;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:100px;padding:12px 16px;color:var(--text);font-family:var(--font-body);font-size:14.5px;}
/* Lupă vizuală, doar pe caseta de căutare instant (#siteSearchInput, nu
   toate ".city-search-input" — clasa aceea e împărțită și cu dropdown-ul
   de zile de la itinerar, unde o lupă n-ar avea sens) — cerut explicit,
   ca utilizatorul să distingă vizual imediat că e o casetă de căutare. */
#siteSearchInput{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:16px center;background-size:16px 16px;padding-left:42px;}

/* Selector de orașe — cipuri orizontale + căutare live (buildCitySelectorHtml) */
.city-chips-row{display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;margin:14px 18px 0;padding-bottom:4px;scrollbar-width:none;}
.city-chips-row::-webkit-scrollbar{display:none;}
.city-chip{flex:0 0 auto;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:100px;padding:9px 16px;font-family:var(--font-display);font-weight:700;font-size:13.5px;color:var(--text);text-decoration:none;white-space:nowrap;}
.city-search-input::placeholder{color:var(--muted);}
.city-search-input:focus{outline:none;border-color:var(--accent);}
.city-search-btn{flex:0 0 auto;background:var(--accent);color:#1A1200;border:none;border-radius:100px;padding:12px 20px;font-family:var(--font-display);font-weight:700;font-size:14.5px;cursor:pointer;}
.install-btn{display:none;width:calc(100% - 36px);margin:14px 18px 0;background:#2ecc71;color:#ffffff;border:none;border-radius:100px;padding:14px 20px;font-family:var(--font-display);font-weight:700;font-size:15px;cursor:pointer;}
.push-sub-btn{width:calc(100% - 36px);margin:10px 18px 0;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:100px;padding:13px 20px;font-family:var(--font-display);font-weight:700;font-size:14px;cursor:pointer;}
.ios-install-hint{display:none;margin:8px 18px 0;font-size:12.5px;color:var(--muted);text-align:center;line-height:1.5;}
.geo-suggestion{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 18px 0;background:var(--surface);border:1px solid var(--accent);border-radius:var(--radius-md);padding:12px 16px;font-size:14px;}
.geo-suggestion strong{color:var(--accent);}
.geo-suggestion-btn{flex:0 0 auto;background:var(--accent);color:#1A1200;border-radius:100px;padding:8px 14px;font-weight:700;font-size:13px;white-space:nowrap;}
.geo-suggestion-note{margin:6px 18px 0;font-size:12px;color:var(--muted);text-align:center;}
.disclaimer{margin:14px 18px 0;font-size:12px;color:var(--muted);line-height:1.6;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:var(--radius-md);padding:12px 14px;text-align:center;}
footer{margin:36px 18px 0;padding-top:18px;border-top:1px solid var(--border);font-size:12.5px;color:var(--muted);text-align:center;}
footer p + p{margin-top:14px;}
footer strong{color:var(--text);}
footer a{color:var(--accent);font-weight:600;}
.footer-intl-link{text-align:center;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:var(--radius-md);padding:14px 16px;}
`;

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

// Script dedicat pentru pagina de start: cere locația (opțional, la click),
// o transformă în nume de oraș prin geocoding invers, apoi redirect la /oras.
// Dacă orice pas eșuează sau utilizatorul refuză, pagina rămâne neschimbată.
function buildGeoScript(nonce) {
  // doar cele 30 de orașe reale, cu coordonatele lor — trimise direct în
  // pagină, ca să calculăm cel mai apropiat FĂRĂ să mai depindem de un API
  // extern de geocodare inversă (bigdatacloud), care ne dădea orice
  // localitate reală, inclusiv cele pe care nu le acoperim
  const roCityCoords = {};
  SITEMAP_CITIES.forEach((c) => {
    if (CITY_COORDS[c]) roCityCoords[c] = CITY_COORDS[c];
  });

  return `
<script nonce="${nonce}">
(function(){
  var btn = document.getElementById("geoBtn");
  var status = document.getElementById("geoStatus");
  if (!btn) return;

  if (!("geolocation" in navigator)) {
    btn.style.display = "none";
    return;
  }

  var KNOWN_CITY_COORDS = ${safeJson(roCityCoords)};
  var MAX_USEFUL_DISTANCE_KM = 60; // dincolo de asta, o sugestie automată nu mai e utilă

  function showStatus(msg){
    if (status) { status.style.display = "block"; status.textContent = msg; }
  }
  function resetButton(msg){
    btn.disabled = false;
    btn.textContent = "📍 Detectează orașul meu automat";
    if (msg) showStatus(msg);
  }
  function slugify(name){
    return name.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim().replace(/\\s+/g, "-");
  }
  function haversineKm(lat1, lon1, lat2, lon2){
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function findNearestKnownCity(lat, lon){
    var best = null, bestDist = Infinity;
    for (var city in KNOWN_CITY_COORDS) {
      var c = KNOWN_CITY_COORDS[city];
      var d = haversineKm(lat, lon, c[0], c[1]);
      if (d < bestDist) { bestDist = d; best = city; }
    }
    return best ? { city: best, distanceKm: Math.round(bestDist) } : null;
  }

  btn.addEventListener("click", function(){
    btn.disabled = true;
    btn.textContent = "Se detectează...";
    showStatus("Îți cerem acordul pentru locație...");

    navigator.geolocation.getCurrentPosition(
      function(pos){
        var nearest = findNearestKnownCity(pos.coords.latitude, pos.coords.longitude);
        if (!nearest) { resetButton("Nu am găsit un oraș acoperit aproape de tine. Alege manual mai jos."); return; }
        if (nearest.distanceKm > MAX_USEFUL_DISTANCE_KM) {
          resetButton("Cel mai apropiat oraș acoperit e " + nearest.city + " (~" + nearest.distanceKm + " km) — prea departe pentru o sugestie automată. Alege manual mai jos.");
          return;
        }
        window.location.href = "/" + slugify(nearest.city);
      },
      function(){
        resetButton("Nu am acces la locația ta. Alege manual mai jos.");
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  });
})();
</script>`;
}

// Script pentru bara de căutare de pe homepage: la submit, transformă orașul
// tastat în slug și navighează la /oras — funcționează pentru orice oraș,
// nu doar cele 30 din listă, pentru că ruta /:oras e complet dinamică.
function buildCitySearchScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var form = document.getElementById("citySearchForm");
  var input = document.getElementById("citySearchInput");
  if (!form || !input) return;

  function slugify(name){
    return name.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim().replace(/\\s+/g, "-");
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    var val = input.value.trim();
    if (!val) return;
    window.location.href = "/" + slugify(val);
  });
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
function buildPushSubscribeScript(nonce, vapidPublicKey, labelSubscribe, labelUnsubscribe) {
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
        return fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        }).then(function(){ setButtonState(true); });
      }).catch(function(err){
        console.error("Abonarea la notificări a eșuat:", err);
      });
    });
  });
})();
</script>`;
}

function buildInstallScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var installBtn = document.getElementById("installBtn");
  var iosHint = document.getElementById("iosInstallHint");
  var deferredPrompt = null;

  function isStandalone(){
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  }
  function isIOS(){
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }

  window.addEventListener("beforeinstallprompt", function(e){
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = "block";
  });

  if (installBtn) {
    installBtn.addEventListener("click", function(){
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function(){
        deferredPrompt = null;
        installBtn.style.display = "none";
      });
    });
  }

  window.addEventListener("appinstalled", function(){
    if (installBtn) installBtn.style.display = "none";
    deferredPrompt = null;
  });

  if (isIOS() && !isStandalone() && iosHint) {
    iosHint.style.display = "block";
  }
})();
</script>`;
}

// Sistem nou, complet — banner sus + modal cu detectare Safari/alt browser,
// exact ca modelul confirmat de utilizator (sosreparatii.ro): dacă e pe iOS
// dar NU în Safari, arată buton "Deschide în Safari" (schema x-safari-https://,
// funcție nativă iOS, nu un hack) — dacă e deja în Safari, arată instrucțiuni
// exacte. Pe Android/Chrome, folosește promptul nativ direct.
;
;

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
  // activăm tab-ul potrivit și facem scroll manual, DUPĂ activare — browserul
  // încearcă să sară la ancoră imediat, înainte ca tab-ul să fie activat,
  // deci elementul e încă ascuns în acel moment (bug real, prins prin
  // testare, nu doar teoretic — semnalat direct de la utilizator).
  var hash = (window.location.hash || "").replace("#", "");
  if (hash === "favorites" || hash === "favoritesList") {
    activate("favorites");
    var favEl = document.getElementById("favoritesList");
    if (favEl) favEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (hash === "search" || hash === "citySearchInput") {
    var input = document.getElementById("siteSearchInput") || document.getElementById("citySearchInput");
    if (input) { input.focus(); input.scrollIntoView({ behavior: "smooth", block: "center" }); }
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

;
;
;

function buildSearchAndFavoritesScript(nonce, customSearchIndex, favKey, lang, primaryCountry) {
  const favEmptyText = FAV_EMPTY_TEXTS[lang] || FAV_EMPTY_TEXTS.uk;
  // "Propune un loc" — cerut explicit, apare în starea "niciun rezultat" a
  // căutării, exact momentul potrivit (utilizatorul tocmai a constatat că
  // nu găsim ce caută). Distincție RO/internațional prin favKey, semnal
  // deja existent — evită modificarea semnăturii funcției.
  const isIntlSearch = favKey && favKey.indexOf("oht_") === 0;
  const submitPlaceHref = isIntlSearch ? `/submit-place?lang=${lang}` : "/propune";
  const submitPlaceLabel = SUBMIT_PLACE_NO_RESULTS_LABELS[lang] || SUBMIT_PLACE_NO_RESULTS_LABELS.uk;
  const noMatchesText = noMatchesLabelFor(lang);
  // Text pentru butonul contextual de itinerar din rezultatele căutării —
  // reutilizează traducerea deja existentă (navLabelsFor, cele 21 de limbi),
  // nu o propoziție nouă de tradus separat.
  const itinCtaLabel = navLabelsFor(lang).itinerary;
  // decisă O SINGURĂ DATĂ, pe server, care listă chiar se trimite — niciodată
  // ambele deodată (ar fi dublat exact bug-ul de greutate a paginii, reparat
  // mai devreme). FIX real, găsit prin testare: "[] || X" e mereu adevărat în
  // JS (un array gol tot e "truthy"), deci vechiul fallback pe buildSearchIndex()
  // nu se activa NICIODATĂ — căutarea globală de pe .eu întorcea mereu 0 rezultate.
  const effectiveIndex = customSearchIndex && customSearchIndex.length ? customSearchIndex : buildSearchIndex();
  return `
<script nonce="${nonce}">
(function(){
  var SEARCH_INDEX = ${safeJson(effectiveIndex)};
  var PRIMARY_COUNTRY = ${safeJson(primaryCountry || null)};
  var FAV_KEY = ${safeJson(favKey || "oht_favorites_v1")};
  var ITIN_CTA_LABEL = ${safeJson(itinCtaLabel)};

  function getFavorites(){
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch(e){ return []; }
  }
  function saveFavorites(list){
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch(e){}
  }
  function isFav(favs, href){
    return favs.some(function(f){ return f.href === href; });
  }
  function toggleFavorite(item){
    var favs = getFavorites();
    var idx = favs.findIndex(function(f){ return f.href === item.href; });
    if (idx >= 0) favs.splice(idx, 1); else favs.unshift(item);
    saveFavorites(favs);
    return favs;
  }

  function applyStarState(btn, favs){
    var on = isFav(favs, btn.getAttribute("data-href"));
    btn.textContent = on ? "★" : "☆";
    btn.classList.toggle("is-fav", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  }
  function refreshAllStars(){
    var favs = getFavorites();
    document.querySelectorAll(".fav-star").forEach(function(btn){ applyStarState(btn, favs); });
  }
  window.refreshFavoriteStars = refreshAllStars; // expus global, ca scriptul de filtrare de țară să-l poată apela

  function renderFavoritesPanel(){
    var panel = document.getElementById("favoritesList");
    if (!panel) return;
    var favs = getFavorites();
    if (!favs.length) {
      panel.innerHTML = '<p class="fav-empty">' + ${JSON.stringify(favEmptyText)} + '</p>';
      return;
    }
    panel.innerHTML = "";
    var list = document.createElement("ul");
    list.className = "mall-list";
    favs.forEach(function(item){
      var li = document.createElement("li");
      li.style.display = "flex";
      li.style.alignItems = "center";
      var star = document.createElement("button");
      star.type = "button";
      star.className = "fav-star is-fav";
      star.textContent = "★";
      star.setAttribute("data-href", item.href);
      star.setAttribute("data-name", item.name);
      star.setAttribute("data-type", item.type);
      star.setAttribute("data-country", item.country || "");
      var a = document.createElement("a");
      a.href = item.href;
      a.style.flex = "1 1 auto";
      a.textContent = (item.type === "store" ? "🛒 " : "🎫 ") + item.name;
      li.appendChild(star);
      li.appendChild(a);
      list.appendChild(li);
    });
    panel.appendChild(list);
  }

  // delegare: un singur listener pentru orice ☆/★, prezent acum sau adăugat mai târziu
  document.addEventListener("click", function(e){
    var btn = e.target.closest(".fav-star");
    if (!btn) return;
    e.preventDefault();
    var item = {
      name: btn.getAttribute("data-name"),
      type: btn.getAttribute("data-type"),
      country: btn.getAttribute("data-country"),
      href: btn.getAttribute("data-href"),
    };
    toggleFavorite(item);
    refreshAllStars();
    renderFavoritesPanel();
  });

  // căutare instant — GENERALIZATĂ: caută acum și pe oraș (item.city, dedus
  // server-side pentru obiective), nu doar pe numele exact al magazinului/
  // obiectivului. Bug real, semnalat direct: cine căuta "Madrid" găsea toate
  // magazinele din Madrid (aveau orașul în nume dintotdeauna), dar rata
  // majoritatea obiectivelor turistice din Madrid — repar aici, nu doar la
  // sursa datelor (vezi buildSearchIndex/buildSearchIndexRO pe server).
  var input = document.getElementById("siteSearchInput");
  var results = document.getElementById("siteSearchResults");
  function norm(s){ return s.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase(); }
  if (input && results) {
    input.addEventListener("input", function(){
      var q = norm(input.value.trim());
      results.innerHTML = "";
      if (!q) { results.style.display = "none"; return; }
      var matches = SEARCH_INDEX.filter(function(item){
        return norm(item.name).indexOf(q) !== -1 || (item.city && norm(item.city).indexOf(q) !== -1);
      });
      // Relevanță simplă, înainte de sortarea pe țară: o potrivire EXACTĂ pe
      // oraș (cineva a scris exact "Madrid") trece înaintea unei potriviri
      // parțiale oarecare din mijlocul unui nume lung — altfel, cu limita
      // mărită de mai jos, un oraș popular ar putea fi "îngropat" sub
      // magazine/obiective dintr-un oraș cu nume asemănător, dar irelevant.
      matches.sort(function(a, b){
        var aExact = a.city && norm(a.city) === q ? 0 : 1;
        var bExact = b.city && norm(b.city) === q ? 0 : 1;
        return aExact - bExact;
      });
      if (PRIMARY_COUNTRY) {
        // țara curentă/detectată apare mereu prima — restul, după, în ordinea
        // găsită; nu ascundem celelalte țări, doar le trecem la coadă.
        // Stabil (Array#sort e stabil în toate motoarele moderne) — nu strică
        // sortarea de relevanță de mai sus, doar regrupează pe țară deasupra ei.
        matches.sort(function(a, b){
          var aPrimary = a.country === PRIMARY_COUNTRY ? 0 : 1;
          var bPrimary = b.country === PRIMARY_COUNTRY ? 0 : 1;
          return aPrimary - bPrimary;
        });
      }
      // Limita a crescut de la 8 la 40 — după ce am adăugat orașul real pe
      // obiective (Spania are acum acest câmp), o căutare pe un oraș mare ca
      // Madrid găsește 50+ rezultate; panoul are deja scroll propriu
      // (max-height + overflow-y, vezi .search-results), deci 40 nu strică
      // UI-ul, doar arată mai mult din ce s-a găsit efectiv.
      matches = matches.slice(0, 40);
      if (!matches.length) {
        results.innerHTML = '<div class="search-result-empty">${escapeHtml(noMatchesText)}<br><a href="${escapeHtml(submitPlaceHref)}" class="search-result-submit-place">${escapeHtml(submitPlaceLabel)}</a></div>';
        results.style.display = "block";
        return;
      }
      matches.forEach(function(item){
        var row = document.createElement("div");
        row.className = "search-result-row";
        var star = document.createElement("button");
        star.type = "button";
        star.className = "fav-star";
        star.setAttribute("data-name", item.name);
        star.setAttribute("data-type", item.type);
        star.setAttribute("data-country", item.country);
        star.setAttribute("data-href", item.href);
        var a = document.createElement("a");
        a.href = item.href;
        a.className = "search-result-item";
        a.textContent = (item.type === "store" ? "🛒 " : "🎫 ") + item.name;
        row.appendChild(star);
        row.appendChild(a);
        results.appendChild(row);
      });
      // Buton contextual de itinerar — cerut explicit, DOAR pe tab-ul
      // "Obiective Turistice" (nu la magazine): dacă printre rezultate sunt
      // obiective turistice cu un oraș cunoscut (item.city, real, nu dedus),
      // arătăm un link direct spre itinerar, cu orașul deja completat —
      // exact fluxul descris ("caut Madrid, vad obiectivele, dau clic sa-mi
      // fac itinerar"). Aceeași iconiță ca în bara de jos (🧭), pentru
      // coerență vizuală pe site, nu una nouă.
      var attractionsTab = document.querySelector('[data-tab="attractions"]');
      var onAttractionsTab = attractionsTab && attractionsTab.classList.contains("active");
      if (onAttractionsTab) {
        var cityMatch = matches.find(function(m){ return m.type === "attraction" && m.city; });
        if (cityMatch) {
          var itinRow = document.createElement("a");
          itinRow.className = "search-result-itin-cta";
          itinRow.href = "/itinerar?oras=" + encodeURIComponent(cityMatch.city);
          itinRow.textContent = "🧭 " + ITIN_CTA_LABEL + " – " + cityMatch.city;
          results.appendChild(itinRow);
        }
      }
      results.style.display = "block";
      refreshAllStars();
    });
    document.addEventListener("click", function(e){
      if (!results.contains(e.target) && e.target !== input) results.style.display = "none";
    });
  }

  refreshAllStars();
  renderFavoritesPanel();
})();
</script>`;
}

// Script pentru filtrul persistent de țară (bara de steaguri + link-urile din
// lista "Choose a country") — comută DOAR vizibilitatea unor blocuri deja
// randate pe server (bune pentru SEO/fără JS), nu regenerează nimic. Aceeași
// selecție se aplică simultan la Stores și Attractions, indiferent pe ce tab
// ești. Click pe un steag sau pe o țară din listă => rămâi pe pagină, doar se
// filtrează. Fără JS, link-urile tot funcționează normal (navighează), ca
// fallback — progressive enhancement, nu o cerință ascunsă de JS.
// Hartă interactivă (Leaflet + OpenStreetMap, gratuit, fără cheie API) —
// un singur marker, pe centrul REAL al orașului. NU inventăm pin-uri per
// magazin (nu avem adrese exacte de sucursale) — asta ar fi o precizie
// falsă. Harta oferă context vizual + zoom/pan; pentru locația exactă a
// unui brand anume, link-urile din pagină duc spre căutarea reală Google Maps.
// Etichete pentru harta unificată — cerut explicit, gol găsit la verificare:
// funcția nici nu primea parametru de limbă, textele erau hardcodate
// românește, indiferent de pagina pe care apărea harta (inclusiv pe .eu,
// în alte limbi).
;
;
;
function mapUnifiedToggleLabelFor(lang) { return MAP_UNIFIED_TOGGLE_LABELS[lang] || MAP_UNIFIED_TOGGLE_LABELS.uk; }
function mapLoadingStoresLabelFor(lang) { return MAP_LOADING_STORES_LABELS[lang] || MAP_LOADING_STORES_LABELS.uk; }
function mapLoadingAttractionsLabelFor(lang) { return MAP_LOADING_ATTRACTIONS_LABELS[lang] || MAP_LOADING_ATTRACTIONS_LABELS.uk; }

function buildCityMapHtml(coords, cityName, nonce, lang) {
  if (!coords) return "";

  const toggleHtml = `<label class="map-live-toggle map-live-toggle-unified"><input type="checkbox" id="mapUnifiedOpenOnlyToggle"> ${escapeHtml(mapUnifiedToggleLabelFor(lang))}</label>
<p id="mapLiveStatus" class="map-live-status">${escapeHtml(mapLoadingStoresLabelFor(lang))}</p>
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
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin="anonymous"></script>
<script nonce="${nonce}">
(function(){
  if (typeof L === "undefined") return;
  var el = document.getElementById("cityMap");
  if (!el) return;
  window.__cityMapInstance = L.map(el, { zoomControl: true, scrollWheelZoom: false }).setView([${coords[0]}, ${coords[1]}], 12);
  window.__cityMapBackend = "leaflet";
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(window.__cityMapInstance);
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
  var toggle = document.getElementById("mapUnifiedOpenOnlyToggle");
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
        if (!stores.length) { statusEl.textContent = "Nu am găsit magazine cu poziție confirmată pentru harta live."; return; }
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
  var toggle = document.getElementById("mapUnifiedOpenOnlyToggle");
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
        if (!attractions.length) { statusEl.textContent = "Nu am găsit obiective turistice cu poziție confirmată pentru harta live."; return; }
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
  var FREE_PREFIXES = ${safeJson(FREE_ACCESS_PREFIXES)};
  var FREE_CATEGORIES = ${safeJson(FREE_ACCESS_CATEGORIES)};

  function isFreeAccess(name){
    for (var i=0;i<FREE_PREFIXES.length;i++){
      var p = FREE_PREFIXES[i];
      if (name === p || name.indexOf(p + " ") === 0) return true;
    }
    return false;
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
    if (isFreeAccess(name) || FREE_CATEGORIES.indexOf(category) !== -1) return true;
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

function buildCountryFilterScript(nonce, initialCountry, initialCity, primaryAttractionCountry) {
  return `
<script nonce="${nonce}">
(function(){
  var INITIAL_COUNTRY = ${safeJson(initialCountry || null)};
  var INITIAL_CITY = ${safeJson(initialCity ? normalizeSlug(initialCity) : null)};
  var PRIMARY_ATTRACTION_COUNTRY = ${safeJson(primaryAttractionCountry || null)};

  function selectCountry(code){
    var target = code || "all";
    // obiectivele turistice ale țării principale NU mai au un bloc separat
    // (elimină duplicarea semnalată — apăreau randate de două ori) — steagul
    // ei arată, de fapt, tab-ul "all", unde obiectivele ei sunt deja randate
    // complet; magazinele (alt sistem, blocuri separate per țară) nu sunt
    // afectate de asta, rămân neschimbate mai jos.
    var attractionsTarget = (target === PRIMARY_ATTRACTION_COUNTRY) ? "all" : target;
    document.querySelectorAll(".country-filter-block").forEach(function(el){
      var inAttractionsPanel = !!el.closest('[data-panel="attractions"]');
      var effectiveTarget = inAttractionsPanel ? attractionsTarget : target;
      var match = el.getAttribute("data-country-block") === effectiveTarget;
      el.style.display = match ? "block" : "none";
      el.classList.toggle("active", match);
      if (match && el.hasAttribute("data-lazy-country") && typeof window.__ohtLoadAttractions === "function") {
        window.__ohtLoadAttractions(effectiveTarget, el.querySelector(".lazy-attraction-target"));
      }
      // Bug real, semnalat direct, cu captură: selectarea țării PRINCIPALE
      // arăta întregul bloc "all" — inclusiv celelalte țări, colapsate, dar
      // tot vizibile dedesubt (ex. România selectată arăta și Austria,
      // Belgia, Danemarca mai jos). Ascundem acum explicit elementele
      // celorlalte țări (.attraction-country-lazy) DOAR quando ținta reală
      // e țara principală (nu "all"/glob) — la "all" rămân vizibile normal.
      if (match && el.getAttribute("data-country-block") === "all" && inAttractionsPanel) {
        var showOtherCountries = target === "all";
        el.querySelectorAll(".attraction-country-lazy").forEach(function(other){
          other.style.display = showOtherCountries ? "" : "none";
        });
      }
    });
    document.querySelectorAll(".country-flag-btn").forEach(function(btn){
      btn.classList.toggle("active", btn.getAttribute("data-country-select") === target);
    });
    // Cerut explicit: la selectarea unei țări, chip-ul ei sare primul în
    // bară (imediat după "🌍 All") — altfel utilizatorul ar trebui să
    // deruleze mereu bara ca s-o regăsească, chiar dacă tocmai a ales-o.
    // Persistă doar în DOM (nu localStorage) — la reîncărcare, ordinea
    // revine la cea alfabetică implicită.
    if (target !== "all") {
      var selectedBtn = document.querySelector('.country-flag-btn[data-country-select="' + target + '"]');
      if (selectedBtn) {
        var bar = selectedBtn.closest(".country-filter-bar");
        if (bar) {
          var allChip = bar.querySelector(".chip:not(.country-flag-btn)"); // "🌍 All", primul, fix
          if (allChip && allChip.nextSibling !== selectedBtn) {
            bar.insertBefore(selectedBtn, allChip.nextSibling);
          }
          if (selectedBtn.scrollIntoView) selectedBtn.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
        }
      }
    }
    if (target === PRIMARY_ATTRACTION_COUNTRY) {
      var anchor = document.getElementById("attractions-country-" + target);
      if (anchor && anchor.scrollIntoView) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (typeof window.refreshFavoriteStars === "function") window.refreshFavoriteStars();
  }

  // filtrare secundară, pe oraș, DOAR în interiorul blocului de țară activ momentan
  function selectCity(block, cityKey){
    var target = cityKey || "all";
    block.querySelectorAll(".city-flag-btn").forEach(function(btn){
      btn.classList.toggle("active", btn.getAttribute("data-city-select") === target);
    });
    block.querySelectorAll("li[data-city]").forEach(function(li){
      var show = target === "all" || li.getAttribute("data-city") === target;
      li.style.display = show ? "" : "none";
    });
  }

  document.addEventListener("click", function(e){
    var flagBtn = e.target.closest(".country-flag-btn");
    if (flagBtn) {
      var code = flagBtn.getAttribute("data-country-select");
      selectCountry(code === "all" ? null : code);
      return;
    }
    var pick = e.target.closest(".country-pick");
    if (pick) {
      e.preventDefault();
      selectCountry(pick.getAttribute("data-country"));
      return;
    }
    var clearBtn = e.target.closest(".clear-country-btn");
    if (clearBtn) {
      selectCountry(null);
      return;
    }
    var cityBtn = e.target.closest(".city-flag-btn");
    if (cityBtn) {
      var parentBlock = cityBtn.closest(".country-filter-block");
      if (parentBlock) selectCity(parentBlock, cityBtn.getAttribute("data-city-select") === "all" ? null : cityBtn.getAttribute("data-city-select"));
      return;
    }
  });

  if (INITIAL_COUNTRY) {
    selectCountry(INITIAL_COUNTRY);
    if (INITIAL_CITY) {
      var activeBlock = document.querySelector('.country-filter-block[data-country-block="' + INITIAL_COUNTRY + '"]');
      var cityBtnMatch = activeBlock && activeBlock.querySelector('.city-flag-btn[data-city-select="' + INITIAL_CITY + '"]');
      if (activeBlock && cityBtnMatch) selectCity(activeBlock, INITIAL_CITY);
    }
  }
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

function renderBrandNav(orasSlug) {
  const items = Object.keys(STORE_CONFIG)
    .map((key) => {
      const cfg = STORE_CONFIG[key];
      const urlSlug = cfg.slug || key;
      return `<a class="chip" href="/${orasSlug}/${urlSlug}">${escapeHtml(cfg.name)}</a>`;
    })
    .join("");
  return `<nav class="store-scroll" aria-label="Alege magazinul">${items}</nav>`;
}

// meta-date de limbă (html lang + og:locale), per codul intern de limbă —
// corectează bug-ul prin care toate paginile (inclusiv cele în germană,
// franceză etc.) aveau <html lang="ro"> hardcodat, indiferent de conținut.
const LANG_META = {
  ro: { lang: "ro", locale: "ro_RO" },
  uk: { lang: "en", locale: "en_US" },
  de: { lang: "de", locale: "de_DE" },
  es: { lang: "es", locale: "es_ES" },
  fr: { lang: "fr", locale: "fr_FR" },
  it: { lang: "it", locale: "it_IT" },
  pl: { lang: "pl", locale: "pl_PL" },
  nl: { lang: "nl", locale: "nl_NL" },
  da: { lang: "da", locale: "da_DK" },
  se: { lang: "sv", locale: "sv_SE" },
  pt: { lang: "pt", locale: "pt_PT" },
  cz: { lang: "cs", locale: "cs_CZ" },
  fi: { lang: "fi", locale: "fi_FI" },
  gr: { lang: "el", locale: "el_GR" },
  hu: { lang: "hu", locale: "hu_HU" },
  hr: { lang: "hr", locale: "hr_HR" },
  sk: { lang: "sk", locale: "sk_SK" },
  si: { lang: "sl", locale: "sl_SI" },
  lt: { lang: "lt", locale: "lt_LT" },
  lv: { lang: "lv", locale: "lv_LV" },
  ee: { lang: "et", locale: "et_EE" },
  cy: { lang: "el", locale: "el_CY" },
  mt: { lang: "en", locale: "en_MT" },
  lu: { lang: "fr", locale: "fr_LU" },
};

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

// Buton "Înapoi" — cerut explicit: site-ul avea doar "Acasă", obligând
// utilizatorul să iasă mereu la pagina principală, în loc să se întoarcă un
// pas. Folosește history.back() (funcționează din orice pagină, indiferent
// de unde a venit utilizatorul) — nu doar text, doar simbolul universal
// "←", cu etichetă tradusă pentru accesibilitate (screen readers).
const BACK_BUTTON_LABELS = {
  ro: "Înapoi", uk: "Back", de: "Zurück", fr: "Retour", es: "Atrás", it: "Indietro",
  pl: "Wstecz", nl: "Terug", da: "Tilbage", cz: "Zpět", fi: "Takaisin", gr: "Πίσω",
  hu: "Vissza", hr: "Natrag", sk: "Späť", si: "Nazaj", lt: "Atgal", lv: "Atpakaļ",
  pt: "Voltar", se: "Tillbaka", ee: "Tagasi",
};
function backButtonLabelFor(lang) { return BACK_BUTTON_LABELS[lang] || BACK_BUTTON_LABELS.uk; }

// Formular "Propune un loc" — cerut explicit: utilizatorii pot propune un
// magazin, obiectiv sau plajă nou, nu doar Google are acest tip de
// contribuție. Etichete traduse complet, 21 de limbi.
const SUBMIT_PLACE_LABELS = {
  ro: { title: "📍 Propune un loc nou", intro: "Ai găsit un magazin, obiectiv turistic sau plajă pe care nu-l avem încă? Spune-ne, verificăm și-l adăugăm.",
    typeLabel: "Ce propui?", typeStore: "🛒 Magazin", typeAttraction: "🏛️ Obiectiv turistic", typeBeach: "🏖️ Plajă",
    nameLabel: "Nume", namePlaceholder: "ex. Castelul Corvinilor",
    cityLabel: "Oraș / Insulă", cityPlaceholder: "ex. Hunedoara",
    countryLabel: "Țară",
    categoryLabel: "Categorie (opțional)", categoryPlaceholder: "ex. castel, muzeu, supermarket",
    mapsLabel: "Link Google Maps (opțional, dar ajută mult)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Notă (opțional)", notePlaceholder: "Orice detaliu util — program, acces, etc.",
    submit: "Trimite propunerea", thanks: "✓ Mulțumim! Propunerea ta a fost trimisă spre verificare.",
    errorGeneric: "Ceva n-a mers. Încearcă din nou.", errorRate: "Ai trimis prea multe propuneri recent. Mai încearcă puțin mai târziu." },
  uk: { title: "📍 Suggest a new place", intro: "Found a store, attraction, or beach we don't have yet? Let us know, we'll check and add it.",
    typeLabel: "What are you suggesting?", typeStore: "🛒 Store", typeAttraction: "🏛️ Attraction", typeBeach: "🏖️ Beach",
    nameLabel: "Name", namePlaceholder: "e.g. Corvin Castle",
    cityLabel: "City / Island", cityPlaceholder: "e.g. Hunedoara",
    countryLabel: "Country",
    categoryLabel: "Category (optional)", categoryPlaceholder: "e.g. castle, museum, supermarket",
    mapsLabel: "Google Maps link (optional, but really helps)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Note (optional)", notePlaceholder: "Any useful detail — hours, access, etc.",
    submit: "Send suggestion", thanks: "✓ Thanks! Your suggestion was sent for review.",
    errorGeneric: "Something went wrong. Try again.", errorRate: "You've sent too many suggestions recently. Try again a bit later." },
  de: { title: "📍 Neuen Ort vorschlagen", intro: "Ein Geschäft, eine Sehenswürdigkeit oder einen Strand gefunden, den wir noch nicht haben? Sag uns Bescheid, wir prüfen und fügen ihn hinzu.",
    typeLabel: "Was schlägst du vor?", typeStore: "🛒 Geschäft", typeAttraction: "🏛️ Sehenswürdigkeit", typeBeach: "🏖️ Strand",
    nameLabel: "Name", namePlaceholder: "z.B. Burg Corvin",
    cityLabel: "Stadt / Insel", cityPlaceholder: "z.B. Hunedoara",
    countryLabel: "Land",
    categoryLabel: "Kategorie (optional)", categoryPlaceholder: "z.B. Burg, Museum, Supermarkt",
    mapsLabel: "Google Maps-Link (optional, hilft aber sehr)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Notiz (optional)", notePlaceholder: "Nützliche Details — Öffnungszeiten, Zugang, usw.",
    submit: "Vorschlag senden", thanks: "✓ Danke! Dein Vorschlag wurde zur Prüfung gesendet.",
    errorGeneric: "Etwas ist schiefgelaufen. Versuch es erneut.", errorRate: "Du hast kürzlich zu viele Vorschläge gesendet. Versuch es später erneut." },
  fr: { title: "📍 Proposer un nouvel endroit", intro: "Vous avez trouvé un magasin, un site touristique ou une plage que nous n'avons pas encore ? Dites-le-nous, on vérifie et on l'ajoute.",
    typeLabel: "Que proposez-vous ?", typeStore: "🛒 Magasin", typeAttraction: "🏛️ Site touristique", typeBeach: "🏖️ Plage",
    nameLabel: "Nom", namePlaceholder: "ex. Château de Corvin",
    cityLabel: "Ville / Île", cityPlaceholder: "ex. Hunedoara",
    countryLabel: "Pays",
    categoryLabel: "Catégorie (optionnel)", categoryPlaceholder: "ex. château, musée, supermarché",
    mapsLabel: "Lien Google Maps (optionnel, mais très utile)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Note (optionnel)", notePlaceholder: "Tout détail utile — horaires, accès, etc.",
    submit: "Envoyer la proposition", thanks: "✓ Merci ! Votre proposition a été envoyée pour vérification.",
    errorGeneric: "Une erreur s'est produite. Réessayez.", errorRate: "Vous avez envoyé trop de propositions récemment. Réessayez plus tard." },
  es: { title: "📍 Proponer un lugar nuevo", intro: "¿Encontraste una tienda, atracción o playa que aún no tenemos? Cuéntanos, lo verificamos y lo añadimos.",
    typeLabel: "¿Qué propones?", typeStore: "🛒 Tienda", typeAttraction: "🏛️ Atracción turística", typeBeach: "🏖️ Playa",
    nameLabel: "Nombre", namePlaceholder: "ej. Castillo de Corvin",
    cityLabel: "Ciudad / Isla", cityPlaceholder: "ej. Hunedoara",
    countryLabel: "País",
    categoryLabel: "Categoría (opcional)", categoryPlaceholder: "ej. castillo, museo, supermercado",
    mapsLabel: "Enlace de Google Maps (opcional, pero ayuda mucho)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Nota (opcional)", notePlaceholder: "Cualquier detalle útil — horario, acceso, etc.",
    submit: "Enviar propuesta", thanks: "✓ ¡Gracias! Tu propuesta fue enviada para revisión.",
    errorGeneric: "Algo salió mal. Inténtalo de nuevo.", errorRate: "Has enviado demasiadas propuestas recientemente. Inténtalo más tarde." },
  it: { title: "📍 Proponi un nuovo luogo", intro: "Hai trovato un negozio, un'attrazione o una spiaggia che non abbiamo ancora? Dicci, verifichiamo e lo aggiungiamo.",
    typeLabel: "Cosa proponi?", typeStore: "🛒 Negozio", typeAttraction: "🏛️ Attrazione turistica", typeBeach: "🏖️ Spiaggia",
    nameLabel: "Nome", namePlaceholder: "es. Castello di Corvin",
    cityLabel: "Città / Isola", cityPlaceholder: "es. Hunedoara",
    countryLabel: "Paese",
    categoryLabel: "Categoria (opzionale)", categoryPlaceholder: "es. castello, museo, supermercato",
    mapsLabel: "Link Google Maps (opzionale, ma aiuta molto)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Nota (opzionale)", notePlaceholder: "Qualsiasi dettaglio utile — orari, accesso, ecc.",
    submit: "Invia proposta", thanks: "✓ Grazie! La tua proposta è stata inviata per la verifica.",
    errorGeneric: "Qualcosa è andato storto. Riprova.", errorRate: "Hai inviato troppe proposte di recente. Riprova più tardi." },
  pl: { title: "📍 Zaproponuj nowe miejsce", intro: "Znalazłeś sklep, atrakcję lub plażę, których jeszcze nie mamy? Daj nam znać, sprawdzimy i dodamy.",
    typeLabel: "Co proponujesz?", typeStore: "🛒 Sklep", typeAttraction: "🏛️ Atrakcja turystyczna", typeBeach: "🏖️ Plaża",
    nameLabel: "Nazwa", namePlaceholder: "np. Zamek Corvinilor",
    cityLabel: "Miasto / Wyspa", cityPlaceholder: "np. Hunedoara",
    countryLabel: "Kraj",
    categoryLabel: "Kategoria (opcjonalnie)", categoryPlaceholder: "np. zamek, muzeum, supermarket",
    mapsLabel: "Link Google Maps (opcjonalnie, ale bardzo pomaga)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Notatka (opcjonalnie)", notePlaceholder: "Wszelkie przydatne szczegóły — godziny, dostęp, itp.",
    submit: "Wyślij propozycję", thanks: "✓ Dziękujemy! Twoja propozycja została wysłana do weryfikacji.",
    errorGeneric: "Coś poszło nie tak. Spróbuj ponownie.", errorRate: "Wysłałeś zbyt wiele propozycji ostatnio. Spróbuj później." },
  nl: { title: "📍 Nieuwe plek voorstellen", intro: "Een winkel, bezienswaardigheid of strand gevonden dat we nog niet hebben? Laat het ons weten, we controleren het en voegen het toe.",
    typeLabel: "Wat stel je voor?", typeStore: "🛒 Winkel", typeAttraction: "🏛️ Bezienswaardigheid", typeBeach: "🏖️ Strand",
    nameLabel: "Naam", namePlaceholder: "bijv. Kasteel Corvin",
    cityLabel: "Stad / Eiland", cityPlaceholder: "bijv. Hunedoara",
    countryLabel: "Land",
    categoryLabel: "Categorie (optioneel)", categoryPlaceholder: "bijv. kasteel, museum, supermarkt",
    mapsLabel: "Google Maps-link (optioneel, maar erg nuttig)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Notitie (optioneel)", notePlaceholder: "Elk nuttig detail — openingstijden, toegang, enz.",
    submit: "Voorstel versturen", thanks: "✓ Bedankt! Je voorstel is verzonden ter beoordeling.",
    errorGeneric: "Er ging iets mis. Probeer opnieuw.", errorRate: "Je hebt recent te veel voorstellen verzonden. Probeer het later opnieuw." },
  da: { title: "📍 Foreslå et nyt sted", intro: "Fundet en butik, seværdighed eller strand, vi ikke har endnu? Fortæl os det, vi tjekker og tilføjer det.",
    typeLabel: "Hvad foreslår du?", typeStore: "🛒 Butik", typeAttraction: "🏛️ Seværdighed", typeBeach: "🏖️ Strand",
    nameLabel: "Navn", namePlaceholder: "f.eks. Corvin Slot",
    cityLabel: "By / Ø", cityPlaceholder: "f.eks. Hunedoara",
    countryLabel: "Land",
    categoryLabel: "Kategori (valgfri)", categoryPlaceholder: "f.eks. slot, museum, supermarked",
    mapsLabel: "Google Maps-link (valgfri, men hjælper meget)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Note (valgfri)", notePlaceholder: "Enhver nyttig detalje — åbningstider, adgang, osv.",
    submit: "Send forslag", thanks: "✓ Tak! Dit forslag er sendt til gennemgang.",
    errorGeneric: "Noget gik galt. Prøv igen.", errorRate: "Du har sendt for mange forslag for nylig. Prøv igen senere." },
  cz: { title: "📍 Navrhnout nové místo", intro: "Našli jste obchod, atrakci nebo pláž, kterou ještě nemáme? Dejte nám vědět, ověříme to a přidáme.",
    typeLabel: "Co navrhujete?", typeStore: "🛒 Obchod", typeAttraction: "🏛️ Turistická atrakce", typeBeach: "🏖️ Pláž",
    nameLabel: "Název", namePlaceholder: "např. Hunedoarský hrad",
    cityLabel: "Město / Ostrov", cityPlaceholder: "např. Hunedoara",
    countryLabel: "Země",
    categoryLabel: "Kategorie (volitelné)", categoryPlaceholder: "např. hrad, muzeum, supermarket",
    mapsLabel: "Odkaz Google Maps (volitelné, ale hodně pomáhá)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Poznámka (volitelné)", notePlaceholder: "Jakýkoli užitečný detail — otevírací doba, přístup atd.",
    submit: "Odeslat návrh", thanks: "✓ Díky! Váš návrh byl odeslán k posouzení.",
    errorGeneric: "Něco se pokazilo. Zkuste to znovu.", errorRate: "Nedávno jste odeslali příliš mnoho návrhů. Zkuste to později." },
  fi: { title: "📍 Ehdota uutta paikkaa", intro: "Löysitkö kaupan, nähtävyyden tai rannan, jota meillä ei vielä ole? Kerro meille, tarkistamme ja lisäämme sen.",
    typeLabel: "Mitä ehdotat?", typeStore: "🛒 Kauppa", typeAttraction: "🏛️ Nähtävyys", typeBeach: "🏖️ Ranta",
    nameLabel: "Nimi", namePlaceholder: "esim. Corvinin linna",
    cityLabel: "Kaupunki / Saari", cityPlaceholder: "esim. Hunedoara",
    countryLabel: "Maa",
    categoryLabel: "Kategoria (valinnainen)", categoryPlaceholder: "esim. linna, museo, supermarket",
    mapsLabel: "Google Maps -linkki (valinnainen, mutta auttaa paljon)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Huomautus (valinnainen)", notePlaceholder: "Mikä tahansa hyödyllinen tieto — aukioloajat, pääsy, jne.",
    submit: "Lähetä ehdotus", thanks: "✓ Kiitos! Ehdotuksesi lähetettiin tarkistettavaksi.",
    errorGeneric: "Jokin meni pieleen. Yritä uudelleen.", errorRate: "Olet lähettänyt liikaa ehdotuksia viime aikoina. Yritä myöhemmin." },
  gr: { title: "📍 Πρότεινε μια νέα τοποθεσία", intro: "Βρήκες ένα κατάστημα, αξιοθέατο ή παραλία που δεν έχουμε ακόμα; Πες μας, θα το ελέγξουμε και θα το προσθέσουμε.",
    typeLabel: "Τι προτείνεις;", typeStore: "🛒 Κατάστημα", typeAttraction: "🏛️ Αξιοθέατο", typeBeach: "🏖️ Παραλία",
    nameLabel: "Όνομα", namePlaceholder: "π.χ. Κάστρο Κόρβιν",
    cityLabel: "Πόλη / Νησί", cityPlaceholder: "π.χ. Hunedoara",
    countryLabel: "Χώρα",
    categoryLabel: "Κατηγορία (προαιρετικό)", categoryPlaceholder: "π.χ. κάστρο, μουσείο, σούπερ μάρκετ",
    mapsLabel: "Σύνδεσμος Google Maps (προαιρετικό, αλλά βοηθάει πολύ)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Σημείωση (προαιρετικό)", notePlaceholder: "Οποιαδήποτε χρήσιμη λεπτομέρεια — ωράριο, πρόσβαση, κλπ.",
    submit: "Αποστολή πρότασης", thanks: "✓ Ευχαριστούμε! Η πρότασή σου στάλθηκε για έλεγχο.",
    errorGeneric: "Κάτι πήγε στραβά. Δοκίμασε ξανά.", errorRate: "Έστειλες πολλές προτάσεις πρόσφατα. Δοκίμασε αργότερα." },
  hu: { title: "📍 Új hely javaslása", intro: "Találtál egy üzletet, látnivalót vagy strandot, ami még nincs nálunk? Szólj, ellenőrizzük és hozzáadjuk.",
    typeLabel: "Mit javasolsz?", typeStore: "🛒 Üzlet", typeAttraction: "🏛️ Látnivaló", typeBeach: "🏖️ Strand",
    nameLabel: "Név", namePlaceholder: "pl. Corvin-vár",
    cityLabel: "Város / Sziget", cityPlaceholder: "pl. Hunedoara",
    countryLabel: "Ország",
    categoryLabel: "Kategória (opcionális)", categoryPlaceholder: "pl. vár, múzeum, szupermarket",
    mapsLabel: "Google Maps link (opcionális, de sokat segít)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Megjegyzés (opcionális)", notePlaceholder: "Bármilyen hasznos részlet — nyitvatartás, megközelítés, stb.",
    submit: "Javaslat küldése", thanks: "✓ Köszönjük! A javaslatod ellenőrzésre elküldve.",
    errorGeneric: "Valami hiba történt. Próbáld újra.", errorRate: "Nemrég túl sok javaslatot küldtél. Próbáld később." },
  hr: { title: "📍 Predloži novo mjesto", intro: "Pronašli ste trgovinu, znamenitost ili plažu koju još nemamo? Javite nam, provjerit ćemo i dodati.",
    typeLabel: "Što predlažete?", typeStore: "🛒 Trgovina", typeAttraction: "🏛️ Znamenitost", typeBeach: "🏖️ Plaža",
    nameLabel: "Naziv", namePlaceholder: "npr. Dvorac Corvin",
    cityLabel: "Grad / Otok", cityPlaceholder: "npr. Hunedoara",
    countryLabel: "Zemlja",
    categoryLabel: "Kategorija (neobavezno)", categoryPlaceholder: "npr. dvorac, muzej, supermarket",
    mapsLabel: "Google Maps poveznica (neobavezno, ali jako pomaže)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Bilješka (neobavezno)", notePlaceholder: "Bilo koji koristan detalj — radno vrijeme, pristup, itd.",
    submit: "Pošalji prijedlog", thanks: "✓ Hvala! Vaš prijedlog je poslan na provjeru.",
    errorGeneric: "Nešto je pošlo po zlu. Pokušajte ponovno.", errorRate: "Nedavno ste poslali previše prijedloga. Pokušajte kasnije." },
  sk: { title: "📍 Navrhnúť nové miesto", intro: "Našli ste obchod, atrakciu alebo pláž, ktorú ešte nemáme? Dajte nám vedieť, overíme to a pridáme.",
    typeLabel: "Čo navrhujete?", typeStore: "🛒 Obchod", typeAttraction: "🏛️ Turistická atrakcia", typeBeach: "🏖️ Pláž",
    nameLabel: "Názov", namePlaceholder: "napr. Hunedoarský hrad",
    cityLabel: "Mesto / Ostrov", cityPlaceholder: "napr. Hunedoara",
    countryLabel: "Krajina",
    categoryLabel: "Kategória (voliteľné)", categoryPlaceholder: "napr. hrad, múzeum, supermarket",
    mapsLabel: "Odkaz Google Maps (voliteľné, ale veľmi pomáha)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Poznámka (voliteľné)", notePlaceholder: "Akýkoľvek užitočný detail — otváracie hodiny, prístup, atď.",
    submit: "Odoslať návrh", thanks: "✓ Ďakujeme! Váš návrh bol odoslaný na kontrolu.",
    errorGeneric: "Niečo sa pokazilo. Skúste znova.", errorRate: "Nedávno ste odoslali príliš veľa návrhov. Skúste neskôr." },
  si: { title: "📍 Predlagaj novo mesto", intro: "Ste našli trgovino, znamenitost ali plažo, ki je še nimamo? Povejte nam, preverimo in dodamo.",
    typeLabel: "Kaj predlagate?", typeStore: "🛒 Trgovina", typeAttraction: "🏛️ Znamenitost", typeBeach: "🏖️ Plaža",
    nameLabel: "Ime", namePlaceholder: "npr. Grad Corvin",
    cityLabel: "Mesto / Otok", cityPlaceholder: "npr. Hunedoara",
    countryLabel: "Država",
    categoryLabel: "Kategorija (neobvezno)", categoryPlaceholder: "npr. grad, muzej, supermarket",
    mapsLabel: "Povezava Google Maps (neobvezno, a zelo pomaga)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Opomba (neobvezno)", notePlaceholder: "Katerikoli koristen podatek — urnik, dostop, itd.",
    submit: "Pošlji predlog", thanks: "✓ Hvala! Vaš predlog je poslan v pregled.",
    errorGeneric: "Nekaj je šlo narobe. Poskusite znova.", errorRate: "Nedavno ste poslali preveč predlogov. Poskusite kasneje." },
  lt: { title: "📍 Pasiūlyk naują vietą", intro: "Radote parduotuvę, lankytiną vietą ar paplūdimį, kurio dar neturime? Praneškite mums, patikrinsime ir pridėsime.",
    typeLabel: "Ką siūlai?", typeStore: "🛒 Parduotuvė", typeAttraction: "🏛️ Lankytina vieta", typeBeach: "🏖️ Paplūdimys",
    nameLabel: "Pavadinimas", namePlaceholder: "pvz. Korvinų pilis",
    cityLabel: "Miestas / Sala", cityPlaceholder: "pvz. Hunedoara",
    countryLabel: "Šalis",
    categoryLabel: "Kategorija (neprivaloma)", categoryPlaceholder: "pvz. pilis, muziejus, prekybos centras",
    mapsLabel: "Google Maps nuoroda (neprivaloma, bet labai padeda)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Pastaba (neprivaloma)", notePlaceholder: "Bet kokia naudinga informacija — darbo laikas, priėjimas ir t.t.",
    submit: "Siųsti pasiūlymą", thanks: "✓ Ačiū! Jūsų pasiūlymas išsiųstas peržiūrai.",
    errorGeneric: "Kažkas nutiko ne taip. Bandykite dar kartą.", errorRate: "Neseniai išsiuntėte per daug pasiūlymų. Bandykite vėliau." },
  lv: { title: "📍 Ieteikt jaunu vietu", intro: "Atradāt veikalu, apskates vietu vai pludmali, kuras mums vēl nav? Paziņojiet mums, mēs pārbaudīsim un pievienosim.",
    typeLabel: "Ko ieteicat?", typeStore: "🛒 Veikals", typeAttraction: "🏛️ Apskates vieta", typeBeach: "🏖️ Pludmale",
    nameLabel: "Nosaukums", namePlaceholder: "piem. Korvinu pils",
    cityLabel: "Pilsēta / Sala", cityPlaceholder: "piem. Hunedoara",
    countryLabel: "Valsts",
    categoryLabel: "Kategorija (neobligāti)", categoryPlaceholder: "piem. pils, muzejs, lielveikals",
    mapsLabel: "Google Maps saite (neobligāti, bet ļoti palīdz)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Piezīme (neobligāti)", notePlaceholder: "Jebkura noderīga informācija — darba laiks, piekļuve, utt.",
    submit: "Sūtīt ieteikumu", thanks: "✓ Paldies! Jūsu ieteikums nosūtīts pārbaudei.",
    errorGeneric: "Kaut kas nogāja greizi. Mēģiniet vēlreiz.", errorRate: "Nesen esat nosūtījis pārāk daudz ieteikumu. Mēģiniet vēlāk." },
  pt: { title: "📍 Propor um novo local", intro: "Encontraste uma loja, atração ou praia que ainda não temos? Diz-nos, verificamos e adicionamos.",
    typeLabel: "O que propões?", typeStore: "🛒 Loja", typeAttraction: "🏛️ Atração turística", typeBeach: "🏖️ Praia",
    nameLabel: "Nome", namePlaceholder: "ex. Castelo de Corvin",
    cityLabel: "Cidade / Ilha", cityPlaceholder: "ex. Hunedoara",
    countryLabel: "País",
    categoryLabel: "Categoria (opcional)", categoryPlaceholder: "ex. castelo, museu, supermercado",
    mapsLabel: "Link do Google Maps (opcional, mas ajuda muito)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Nota (opcional)", notePlaceholder: "Qualquer detalhe útil — horário, acesso, etc.",
    submit: "Enviar proposta", thanks: "✓ Obrigado! A tua proposta foi enviada para revisão.",
    errorGeneric: "Algo correu mal. Tenta novamente.", errorRate: "Enviaste demasiadas propostas recentemente. Tenta mais tarde." },
  se: { title: "📍 Föreslå en ny plats", intro: "Hittade du en butik, sevärdhet eller strand som vi inte har än? Berätta för oss, vi kontrollerar och lägger till den.",
    typeLabel: "Vad föreslår du?", typeStore: "🛒 Butik", typeAttraction: "🏛️ Sevärdhet", typeBeach: "🏖️ Strand",
    nameLabel: "Namn", namePlaceholder: "t.ex. Corvin-slottet",
    cityLabel: "Stad / Ö", cityPlaceholder: "t.ex. Hunedoara",
    countryLabel: "Land",
    categoryLabel: "Kategori (valfritt)", categoryPlaceholder: "t.ex. slott, museum, stormarknad",
    mapsLabel: "Google Maps-länk (valfritt, men hjälper mycket)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Anteckning (valfritt)", notePlaceholder: "Alla användbara detaljer — öppettider, tillgång, osv.",
    submit: "Skicka förslag", thanks: "✓ Tack! Ditt förslag har skickats för granskning.",
    errorGeneric: "Något gick fel. Försök igen.", errorRate: "Du har skickat för många förslag nyligen. Försök igen senare." },
  ee: { title: "📍 Soovita uut kohta", intro: "Leidsid poe, vaatamisväärsuse või ranna, mida meil veel pole? Anna teada, kontrollime ja lisame selle.",
    typeLabel: "Mida soovitad?", typeStore: "🛒 Pood", typeAttraction: "🏛️ Vaatamisväärsus", typeBeach: "🏖️ Rand",
    nameLabel: "Nimi", namePlaceholder: "nt Corvini loss",
    cityLabel: "Linn / Saar", cityPlaceholder: "nt Hunedoara",
    countryLabel: "Riik",
    categoryLabel: "Kategooria (valikuline)", categoryPlaceholder: "nt loss, muuseum, supermarket",
    mapsLabel: "Google Mapsi link (valikuline, kuid aitab palju)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Märkus (valikuline)", notePlaceholder: "Iga kasulik detail — lahtiolekuajad, juurdepääs jne.",
    submit: "Saada ettepanek", thanks: "✓ Täname! Sinu ettepanek saadeti ülevaatamiseks.",
    errorGeneric: "Midagi läks valesti. Proovi uuesti.", errorRate: "Oled hiljuti saatnud liiga palju ettepanekuid. Proovi hiljem uuesti." },
};
function submitPlaceLabelsFor(lang) { return SUBMIT_PLACE_LABELS[lang] || SUBMIT_PLACE_LABELS.uk; }

// "No matches" (căutare, fără rezultate) — cerut explicit, era fix în
// engleză indiferent de limbă.
const NO_MATCHES_LABELS = {
  ro: "Niciun rezultat", uk: "No matches", de: "Keine Treffer", fr: "Aucun résultat", es: "Sin resultados",
  it: "Nessun risultato", pl: "Brak wyników", nl: "Geen resultaten", da: "Ingen resultater", cz: "Žádné výsledky",
  fi: "Ei tuloksia", gr: "Κανένα αποτέλεσμα", hu: "Nincs találat", hr: "Nema rezultata", sk: "Žiadne výsledky",
  si: "Ni rezultatov", lt: "Rezultatų nėra", lv: "Nav rezultātu", pt: "Sem resultados", se: "Inga resultat",
  ee: "Tulemusi ei leitud",
};
function noMatchesLabelFor(lang) { return NO_MATCHES_LABELS[lang] || NO_MATCHES_LABELS.uk; }

// Text scurt, pentru linkul din starea "niciun rezultat" a căutării —
// separat de SUBMIT_PLACE_LABELS (acela e pentru formular, textul lung).
const SUBMIT_PLACE_NO_RESULTS_LABELS = {
  ro: "Nu-l găsești? Propune-l →", uk: "Can't find it? Suggest it →", de: "Nicht gefunden? Vorschlagen →",
  fr: "Introuvable ? Proposez-le →", es: "¿No lo encuentras? Propónlo →", it: "Non lo trovi? Proponilo →",
  pl: "Nie znajdujesz? Zaproponuj →", nl: "Niet gevonden? Stel voor →", da: "Kan du ikke finde det? Foreslå →",
  cz: "Nenašli jste? Navrhněte →", fi: "Etkö löydä? Ehdota →", gr: "Δεν το βρίσκεις; Πρότεινέ το →",
  hu: "Nem találod? Javasold →", hr: "Ne pronalaziš? Predloži →", sk: "Nenašli ste? Navrhnite →",
  si: "Ne najdete? Predlagajte →", lt: "Nerandate? Pasiūlykite →", lv: "Neatrodat? Ieteiciet →",
  pt: "Não encontras? Propõe →", se: "Hittar du inte? Föreslå →", ee: "Ei leia? Soovita →",
};

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
      </select>
    </label>
    <label class="submit-place-label">${escapeHtml(t.nameLabel)}
      <input type="text" id="spName" placeholder="${escapeHtml(t.namePlaceholder)}" maxlength="255" required>
    </label>
    <label class="submit-place-label">${escapeHtml(t.cityLabel)}
      <input type="text" id="spCity" placeholder="${escapeHtml(t.cityPlaceholder)}" maxlength="255" required>
    </label>
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
  var form = document.getElementById("submitPlaceForm");
  var btn = document.getElementById("spSubmitBtn");
  var thanks = document.getElementById("spThanks");
  var errorBox = document.getElementById("spError");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    errorBox.hidden = true;
    btn.disabled = true;
    fetch("/api/propune-loc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: document.getElementById("spType").value,
        name: document.getElementById("spName").value,
        city: document.getElementById("spCity").value,
        countryCode: document.getElementById("spCountry").value,
        category: document.getElementById("spCategory").value,
        mapsUrl: document.getElementById("spMapsUrl").value,
        note: document.getElementById("spNote").value,
      }),
    })
      .then(function(r){ return r.json().then(function(data){ return { ok: r.ok, status: r.status, data: data }; }); })
      .then(function(res){
        if (res.ok) {
          form.querySelectorAll("input, select, textarea, button").forEach(function(el){ el.disabled = true; });
          thanks.hidden = false;
        } else {
          errorBox.textContent = res.status === 429 ? ERROR_RATE : ERROR_GENERIC;
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
  if (isHome || window.history.length <= 1) return;
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
  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

  function applyPosition(left, top){
    var maxLeft = window.innerWidth - btn.offsetWidth - EDGE_MARGIN;
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
      var side = (left + btn.offsetWidth / 2) < (window.innerWidth / 2) ? "left" : "right";
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ side: side, top: top }));
    } catch (e) {}
  }

  function restorePosition(){
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (e) {}
    if (!saved) return;
    var left = saved.side === "right"
      ? window.innerWidth - btn.offsetWidth - EDGE_MARGIN
      : EDGE_MARGIN;
    applyPosition(left, saved.top);
  }

  function snapToNearestEdge(left, top){
    var center = left + btn.offsetWidth / 2;
    var snappedLeft = center < window.innerWidth / 2
      ? EDGE_MARGIN
      : window.innerWidth - btn.offsetWidth - EDGE_MARGIN;
    btn.style.transition = "left .25s cubic-bezier(.22,1,.36,1), top .25s cubic-bezier(.22,1,.36,1)";
    var pos = applyPosition(snappedLeft, top);
    savePosition(pos.left, pos.top);
    window.setTimeout(function(){ btn.style.transition = ""; }, 260);
  }

  function onPointerDown(e){
    if (e.button !== undefined && e.button !== 0) return; // doar click stânga la mouse
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
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("resize", function(){
    var rect = btn.getBoundingClientRect();
    applyPosition(rect.left, rect.top);
  });

  btn.addEventListener("click", function(ev){
    if (suppressClick) { suppressClick = false; ev.preventDefault(); ev.stopPropagation(); return; }
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

// Etichete scurte, pentru bara de jos, în toate limbile — separate de restul
// traducerilor (acelea sunt fraze lungi, nepotrivite pentru un buton mic).
;
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
  <a href="/#citySearchInput" class="bottom-nav-item" id="bottomNavSearch"><span class="bottom-nav-icon">🔍</span><span>${escapeHtml(labels.search)}</span></a>
  <a href="/#favoritesList" class="bottom-nav-item" id="bottomNavFavorites"><span class="bottom-nav-icon">⭐</span><span>${escapeHtml(labels.favorites)}</span></a>
  ${itineraryBtn}
  <a href="/#cityMap" class="bottom-nav-item" id="bottomNavMap"><span class="bottom-nav-icon">🗺️</span><span>${escapeHtml(labels.map)}</span></a>
</nav>`;
}

function buildBottomNavScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  // căutare/favorite: dacă elementul țintă există CHIAR PE PAGINA CURENTĂ,
  // activăm mai întâi tab-ul asociat (dacă e ascuns într-un tab, ex. pe
  // homepage — bug real, prins prin testare, semnalat direct de la
  // utilizator: scroll spre un element ascuns nu face nimic vizibil), apoi
  // derulăm până la el — altfel, navigăm spre homepage, sau ascundem
  // butonul dacă nici homepage-ul nu-l are.
  // căutare: PRIORITAR verificăm "siteSearchInput" — caseta de căutare
  // instant (magazin/obiectiv), prezentă pe majoritatea paginilor (oraș,
  // magazin, obiectiv), nu doar pe homepage. Bug real, semnalat direct:
  // pe o pagină de oraș (care ARE această casetă), butonul de căutare din
  // bara de jos verifica doar "citySearchInput" (alt element, specific
  // DOAR homepage-ului RO — formularul "scrie orașul tău") — negăsindu-l
  // pe pagina curentă, naviga către homepage în loc să deschidă căutarea
  // chiar acolo unde era utilizatorul.
  (function(){
    var link = document.getElementById("bottomNavSearch");
    if (!link) return;
    // Pe prima pagină (homepage), caseta de căutare e deja vizibilă chiar
    // sus, la încărcare — o iconiță identică în bara de jos ar fi
    // redundantă, cerut explicit să dispară doar acolo (nu pe restul
    // paginilor, unde chiar ajută să găsești caseta ascunsă mai jos).
    if (window.location.pathname === "/") {
      link.style.display = "none";
      return;
    }
    var siteSearch = document.getElementById("siteSearchInput");
    var citySearch = document.getElementById("citySearchInput");
    if (siteSearch) {
      link.addEventListener("click", function(e){
        e.preventDefault();
        siteSearch.scrollIntoView({ behavior: "smooth", block: "center" });
        siteSearch.focus();
      });
    } else if (citySearch) {
      link.addEventListener("click", function(e){
        e.preventDefault();
        var tabBtn = document.querySelector('[data-tab="stores"]');
        if (tabBtn && !tabBtn.classList.contains("active")) { tabBtn.click(); }
        citySearch.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } else if (window.location.pathname === "/") {
      link.style.display = "none";
    }
    // altfel — lăsăm link-ul să navigheze normal spre "/#id"
  })();

  [["bottomNavFavorites","favoritesList","favorites"]].forEach(function(triple){
    var link = document.getElementById(triple[0]);
    var target = document.getElementById(triple[1]);
    var tabName = triple[2];
    if (!link) return;
    if (target) {
      link.addEventListener("click", function(e){
        e.preventDefault();
        var tabBtn = document.querySelector('[data-tab="' + tabName + '"]');
        if (tabBtn && !tabBtn.classList.contains("active")) { tabBtn.click(); }
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
        navigator.geolocation.getCurrentPosition(function(pos){
          fetch("/api/nearest-city?lat=" + pos.coords.latitude + "&lon=" + pos.coords.longitude)
            .then(function(r){ return r.ok ? r.json() : null; })
            .then(function(data){
              if (data && data.href) { window.location.href = data.href; }
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
  // Travelpayouts Drive — Project SEPARAT per domeniu (coduri de urmărire
  // diferite, confirmat de utilizator), determinat din domeniul din canonical
  // (mereu URL complet, nu doar cale relativă) — fără să atingem restul
  // apelurilor către pageShell, care sunt foarte multe.
  const travelpayoutsScript = canonical.includes(INTL_DOMAIN)
    ? `<script nowprocket data-noptimize="1" data-cfasync="false" data-wpfc-render="false" seraph-accel-crit="1" data-no-defer="1" data-cmp-ab="2" nonce="${nonce}">
  (function () {
      var script = document.createElement("script");
      script.async = 1;
      script.setAttribute("data-cmp-ab","2");
      script.src = 'https://tp-em.com/NTY1MjQx.js?t=565241';
      document.head.appendChild(script);
  })();
</script>`
    : `<script nowprocket data-noptimize="1" data-cfasync="false" data-wpfc-render="false" seraph-accel-crit="1" data-no-defer="1" data-cmp-ab="2" nonce="${nonce}">
  (function () {
      var script = document.createElement("script");
      script.async = 1;
      script.setAttribute("data-cmp-ab","2");
      script.src = 'https://tp-em.com/NTY0OTM4.js?t=564938';
      document.head.appendChild(script);
  })();
</script>`;
  const alternatesHtml = (alternateLinks || [])
    .map((l) => `<link rel="alternate" hreflang="${escapeHtml(l.hreflang)}" href="${escapeHtml(l.href)}">`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="${meta.lang}">
<head>
${codAnalytics ? withNonce(codAnalytics, nonce) : ""}
<!-- GetYourGuide Analytics -->
<script async defer src="https://widget.getyourguide.com/dist/pa.umd.production.min.js" data-gyg-partner-id="LM6J21N"></script>
<!-- Travelpayouts — GetTransfer + Omio, din contul tău Travelpayouts, cod diferit per domeniu (Project separat) -->
${travelpayoutsScript}
<meta charset="UTF-8">
<script nonce="${nonce}">
(function(){
  try {
    var t = localStorage.getItem("theme");
    if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t);
  } catch(e){}
})();
</script>
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
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
${ADSENSE_ENABLED && adsensePublisherId ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}" crossorigin="anonymous"></script>` : ""}
<style nonce="${nonce}">${CSS_STYLES}</style>
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

// Pagină pentru un magazin specific dintr-un oraș: site.ro/:oras/:magazin
async function renderStorePage({ orasSlug, orasDisplay, magazinSlug, magazinDisplay, locatieDisplay, store, magazinKey, baseUrl, nonce, userAgent, ip }) {
  // sufixul de locație hiper-locală (cartier/stradă) — opțional, gol pentru paginile normale de magazin
  const locatieSuffix = locatieDisplay ? ` ${locatieDisplay}` : "";
  const locatieForDescription = locatieDisplay ? ` din ${locatieDisplay},` : "";
  const canonicalSlug = magazinSlug || encodeURIComponent(magazinDisplay.toLowerCase());
  const locatieSlug = locatieDisplay ? slugifyCityName(locatieDisplay) : "";

  const title = `Program ${magazinDisplay}${locatieSuffix} ${orasDisplay} Azi – Deschis sau Închis Acum`;
  const description = `Vezi acum dacă ${magazinDisplay}${locatieForDescription} ${orasDisplay} este deschis. Program pe zile ale săptămânii și program de sărbători, actualizat live.`;
  const canonical = locatieDisplay
    ? `${baseUrl}/${orasSlug}/${canonicalSlug}/${locatieSlug}`
    : `${baseUrl}/${orasSlug}/${canonicalSlug}`;

  let mainHtml = "";
  let dataForClient;
  let schemaHtml = "";
  let affiliateCarouselScriptHtml = "";

  if (store.type === "mall") {
    // link unic, general pe toată țara — nu variază per oraș/mall
    const affiliateButtonHtml = linkEmagMall
      ? `<a href="${escapeHtml(linkEmagMall)}" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-emag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>Vezi magazinele cu reduceri de azi pe eMAG</a>`
      : "";

    mainHtml = `
      <div class="status-card" id="statusCard">
        <div class="store-name">${escapeHtml(magazinDisplay)}${escapeHtml(locatieSuffix)} ${escapeHtml(orasDisplay)} — Zonă shopping</div>
        <div class="status-text">—</div>
        <div class="status-sub">Se calculează programul...</div>
        <div class="status-badge"><span class="dotw"></span><span id="statusBadge">Azi</span></div>
        <div class="closing-soon-bar" id="closingSoonBar" style="display:none"><div class="closing-soon-fill" id="closingSoonFill"></div></div>
      </div>
      <div class="secondary-badge" id="secondaryBadge">
        <span class="sb-dot"></span>
        <div class="sb-text"><span class="sb-label">Hipermarket din mall</span><span class="sb-sub">Se calculează...</span></div>
        <span class="sb-state">…</span>
      </div>

      ${affiliateButtonHtml}

      <h2 class="section-title"><span class="bar"></span>Orar magazine mall</h2>
      <div class="schedule-card"><table><thead><tr><th>Zi</th><th style="text-align:right">Interval orar</th></tr></thead>
      <tbody>${renderWeekTableRows(store.zones.shopping.weekly)}</tbody></table></div>

      <h2 class="section-title"><span class="bar"></span>Program hipermarket din mall</h2>
      <div class="schedule-card"><table><thead><tr><th>Zi</th><th style="text-align:right">Interval orar</th></tr></thead>
      <tbody>${renderWeekTableRows(store.zones.hypermarket.weekly)}</tbody></table></div>

      <h2 class="section-title"><span class="bar"></span>Program de sărbători</h2>
      <div class="holiday-card">${renderHolidayRows(store.zones.shopping.holidays)}</div>
    `;
    dataForClient = { type: "mall", zones: store.zones };
  } else if (store.type === "cinema") {
    // cinematografele nu au un status fix "deschis/închis" — orarul de
    // proiecție variază zilnic în funcție de filme, deci nu afișăm un badge
    // live, ca să nu dăm o informație aproximativă. Trimitem direct către
    // site-ul oficial, unde programul de azi e exact.
    mainHtml = `
      <div class="cinema-card">
        <div class="store-name">${escapeHtml(magazinDisplay)}${escapeHtml(locatieSuffix)} ${escapeHtml(orasDisplay)}</div>
        <p class="cinema-note">Programul de filme se schimbă zilnic, în funcție de premierele săptămânii — nu afișăm aici un status fix „deschis” sau „închis”, ca să nu-ți dăm o informație aproximativă.</p>
        <a href="${escapeHtml(store.ticketUrl)}" target="_blank" rel="noopener" class="cinema-btn">🎬 Vezi orarul filmelor de azi</a>
      </div>
    `;
    dataForClient = { type: "general", weekly: [], holidays: [] }; // păstrează ceasul din header activ
  } else {
    // link specific brandului (Lidl/Kaufland/Catena/...), gol până e completat
    // manual în cod — vezi STORE_AFFILIATE_LINKS și buildStoreAffiliateButtonHtml
    // pentru cele 2 moduri posibile (link fix vs. carusel de linkuri).
    const affBtn = buildStoreAffiliateButtonHtml(magazinKey, magazinDisplay, nonce);
    const affiliateButtonHtml = affBtn.html;
    affiliateCarouselScriptHtml = affBtn.scriptHtml;

    // status live (Google), DOAR pentru magazine normale, fără hiper-local
    // (paginile de cartier nu au propriul place_id, sunt variații ale
    // aceleiași locații de bază) — dacă nu găsim nimic, cade pe orele fixe,
    // exact ca înainte, fără nicio schimbare vizibilă.
    const liveSlug = !locatieDisplay ? toDbSlug(`${magazinDisplay}-${orasDisplay}`) : null;
    const live = liveSlug ? await tryGetLiveStatus(liveSlug, "ro", "store", isBotRequest(userAgent), ip) : null;
    schemaHtml = buildLocalBusinessSchema({ name: `${magazinDisplay}${locatieSuffix} ${orasDisplay}`, weekly: store.weekly, live });

    if (live && live.isOpenNow !== null) {
      const specialBanner = live.isSpecialDay && isRealRomanianHolidayToday(live.utcOffsetMinutes)
        ? `<div class="geo-country-highlight">📅 Azi e sărbătoare legală — verifică programul de mai jos, actualizat live.</div>`
        : "";
      const liveWeeklyHtml = live.weeklyScheduleText.length
        ? `<div class="holiday-card">${live.weeklyScheduleText.map((line) => `<div class="holiday-row"><span class="holiday-label">${escapeHtml(line)}</span></div>`).join("")}</div>`
        : `<div class="holiday-card"><div class="holiday-row"><span class="holiday-label">Program indisponibil momentan de la Google.</span></div></div>`;

      mainHtml = `
      <div class="status-card ${live.isOpenNow ? "is-open" : "is-closed"}" id="statusCard">
        <div class="store-name">${escapeHtml(magazinDisplay)}${escapeHtml(locatieSuffix)} ${escapeHtml(orasDisplay)}</div>
        <div class="status-text">${live.isOpenNow ? "DESCHIS ACUM" : "ÎNCHIS ACUM"}</div>
        <div class="status-sub">Date live, direct de la Google · actualizate la fiecare 12 ore</div>
        <div class="status-badge"><span class="dotw"></span><span id="statusBadge">Azi</span></div>
      </div>
      ${contactInfoHtml(live)}
      ${buildHowToGetThereHtml(HOW_TO_GET_THERE_LABELS_RO, `${magazinDisplay}${locatieSuffix} ${orasDisplay}`)}
      ${buildReportIssueHtml({ slug: `${orasSlug}/${canonicalSlug}`, name: `${magazinDisplay}${locatieSuffix}`, oras: orasDisplay })}
      ${specialBanner}
      ${buildContextualWidgetHtml({ type: "store", name: magazinDisplay, orasDisplay })}

      ${affiliateButtonHtml}

      <h2 class="section-title"><span class="bar"></span>Program săptămânal (live, de la Google)</h2>
      ${liveWeeklyHtml}
      `;
      dataForClient = { type: "general", weekly: [], holidays: [] }; // ceasul din header rămâne activ; statusul de mai sus e deja calculat corect, la încărcare
    } else {
      mainHtml = `
      <div class="status-card" id="statusCard">
        <div class="store-name">${escapeHtml(magazinDisplay)}${escapeHtml(locatieSuffix)} ${escapeHtml(orasDisplay)}</div>
        <div class="status-text">—</div>
        <div class="status-sub">Se calculează programul...</div>
        <div class="status-badge"><span class="dotw"></span><span id="statusBadge">Azi</span></div>
        <div class="closing-soon-bar" id="closingSoonBar" style="display:none"><div class="closing-soon-fill" id="closingSoonFill"></div></div>
      </div>
      ${buildHowToGetThereHtml(HOW_TO_GET_THERE_LABELS_RO, `${magazinDisplay}${locatieSuffix} ${orasDisplay}`)}
      ${buildReportIssueHtml({ slug: `${orasSlug}/${canonicalSlug}`, name: `${magazinDisplay}${locatieSuffix}`, oras: orasDisplay })}
      ${buildContextualWidgetHtml({ type: "store", name: magazinDisplay, orasDisplay })}

      ${affiliateButtonHtml}

      <h2 class="section-title"><span class="bar"></span>Program săptămânal</h2>
      <div class="schedule-card"><table><thead><tr><th>Zi</th><th style="text-align:right">Interval orar</th></tr></thead>
      <tbody>${renderWeekTableRows(store.weekly)}</tbody></table></div>

      <h2 class="section-title"><span class="bar"></span>Program de sărbători</h2>
      <div class="holiday-card">${renderHolidayRows(store.holidays)}</div>
    `;
      dataForClient = { type: "store", weekly: store.weekly, holidays: store.holidays };
    }
  }

  // Agregare comunitară — DUPĂ ce toate ramurile de mai sus au construit
  // mainHtml normal, verificăm dacă pragul de confirmări e atins și, dacă
  // da, SUPRASCRIEM complet cardul de status (nu doar îl completăm) —
  // 3 oameni independenți care confirmă "închis definitiv" cântăresc mai
  // mult decât un program static, posibil vechi.
  const reportSlug = `${orasSlug}/${canonicalSlug}`;
  const reportCounts = await getReportCounts(reportSlug);
  let reportedWrongHtml = "";
  if (reportCounts.inchisDefinitiv >= REPORT_THRESHOLD) {
    mainHtml = renderClosedPermanentlyHtml(`${magazinDisplay}${locatieSuffix} ${orasDisplay}`);
    dataForClient = { type: "general", weekly: [], holidays: [] };
  } else if (reportCounts.programGresit >= REPORT_THRESHOLD) {
    reportedWrongHtml = reportedWrongBannerHtml();
  }

  const breadcrumb = locatieDisplay
    ? `<a href="/">Acasă</a> / <a href="/${orasSlug}">${escapeHtml(orasDisplay)}</a> / <a href="/${orasSlug}/${canonicalSlug}">${escapeHtml(magazinDisplay)}</a> / ${escapeHtml(locatieDisplay)}`
    : `<a href="/">Acasă</a> / <a href="/${orasSlug}">${escapeHtml(orasDisplay)}</a> / ${escapeHtml(magazinDisplay)}`;

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Programul<span>DeAzi</span></a><a class="guides-link" href="/ghiduri">Ghiduri →</a><a class="guides-link itin-nav-link" href="/itinerar">Itinerar →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb">${breadcrumb}</p>

  ${renderBrandNav(orasSlug)}

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}

  ${reportedWrongHtml}
  ${mainHtml}

  <p class="disclaimer">Programul afișat pentru ${escapeHtml(magazinDisplay)}${escapeHtml(locatieSuffix)} ${escapeHtml(orasDisplay)} este orientativ, pe baza orarului standard anunțat de rețea. Unele locații pot avea ore diferite — verifică programul afișat la intrarea magazinului.</p>

  <footer>
    <p><strong>Programul de Azi</strong> îți arată în timp real dacă ${escapeHtml(magazinDisplay)}${escapeHtml(locatieSuffix)} din ${escapeHtml(orasDisplay)} este deschis chiar acum, plus programul complet pe zile și programul special de sărbători legale.</p>
  </footer>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}
</main>
${schemaHtml}
${buildContextualWidgetScript(nonce)}
${buildReportIssueScript(nonce)}
${buildHowToGetThereScript(nonce)}
${affiliateCarouselScriptHtml}`;

  // hreflang reciproc spre echivalentul de pe .eu — DOAR dacă acest magazin
  // chiar există acolo (magazin simplu, nu mall/cinema — vezi RO_INTL_STORE_CONFIG
  // — și orașul e printre primele 10, cele acoperite pe .eu; fără locatieDisplay,
  // paginile hiper-locale de cartier nu au echivalent pe .eu)
  let alternateLinks;
  if (!locatieDisplay && magazinKey && RO_INTL_STORE_CONFIG[magazinKey] && COUNTRIES.ro.cities.some((c) => normalizeSlug(c) === normalizeSlug(orasDisplay))) {
    const euUrl = `https://${INTL_DOMAIN}/ro/${orasSlug}/${magazinSlug || magazinKey}`;
    alternateLinks = [
      { hreflang: "ro", href: canonical },
      { hreflang: "en", href: euUrl },
    ];
  }

  return pageShell({ title, description, canonical, bodyHtml, dataForClient, nonce, langCode: "ro", alternateLinks });
}

// Pagină generală de oraș: site.ro/:oras (fără magazin specificat)
async function renderCityPage({ orasSlug, orasDisplay, baseUrl, nonce }) {
  const title = `Program Magazine ${orasDisplay} Azi – Lidl, Kaufland, Penny și Alte Magazine`;
  const description = `Alege un magazin din ${orasDisplay} și vezi instant dacă este deschis acum: Lidl, Kaufland, Penny, Mega Image, Carrefour, Auchan sau mall-ul din ${orasDisplay}.`;
  const canonical = `${baseUrl}/${orasSlug}`;

  const allowedKeys = Object.keys(STORE_CONFIG).filter((key) => isSelectiveBrandAllowedInCity("ro", key, orasDisplay));

  // Statusul live REAL, per locație (nu generic, pe brand) — bug real,
  // semnalat direct, cu captură: insigna arăta roșu la magazine care erau
  // de fapt deschise, pentru că folosea programul GENERIC al brandului,
  // identic pentru toate orașele, nu programul real al ACESTEI locații.
  //
  // Calculăm direct slug-ul așteptat pentru fiecare brand (la fel cum se
  // calculează la populare) și interogăm exact acele slug-uri — mai simplu
  // și mai sigur decât să încercăm să "ghicim" brandul înapoi dintr-un slug
  // (fragil, exact greșeala găsită mai devreme la o propunere similară).
  //
  // cacheOnly: true — NU facem nicio cerere nouă către Google aici, doar
  // citim ce e deja în cache (din vizite anterioare pe pagina fiecărui
  // magazin) — cost real: $0. Dacă o locație n-are încă cache, cade pe
  // programul generic vechi (mai bine decât nimic, dar nu perfect).
  const liveStatusByKey = {};
  if (dbPool && GOOGLE_PLACES_API_KEY_LIVE) {
    try {
      const expectedSlugs = allowedKeys.map((key) => toDbSlug(`${STORE_CONFIG[key].name}-${orasDisplay}`));
      const { rows } = await dbPool.query(
        "SELECT slug, place_id FROM locatii WHERE tara = 'Romania' AND tip = 'store' AND slug = ANY($1::text[])",
        [expectedSlugs]
      );
      const placeIdBySlug = {};
      rows.forEach((r) => { placeIdBySlug[r.slug] = r.place_id; });
      await Promise.all(
        allowedKeys.map(async (key) => {
          const slug = toDbSlug(`${STORE_CONFIG[key].name}-${orasDisplay}`);
          const placeId = placeIdBySlug[slug];
          if (!placeId || placeId === "ZERO_RESULTS" || placeId.startsWith("ERROR_")) return;
          try {
            const status = await getLocationStatus({ pool: dbPool, placeId, apiKey: GOOGLE_PLACES_API_KEY_LIVE, language: "ro", cacheOnly: true, ttlHours: 168 });
            if (!status.skipped && status.isOpenNow !== null) liveStatusByKey[key] = status.isOpenNow;
          } catch (e) { /* o locație eșuată nu blochează restul */ }
        })
      );
    } catch (e) { /* interogarea eșuată -> cade pe programul generic, ca înainte */ }
  }

  const listItems = allowedKeys
    .map((key) => {
      const cfg = STORE_CONFIG[key];
      const urlSlug = cfg.slug || key;
      const statusKey = extractStatusEntity(cfg) ? key : null;
      const href = `/${orasSlug}/${urlSlug}`;
      const html = `<li><button type="button" class="fav-star" data-name="${escapeHtml(cfg.name)} ${escapeHtml(orasDisplay)}" data-type="store" data-country="ro" data-href="${escapeHtml(href)}">☆</button>${brandBadgeHtml(cfg.name, statusKey)}<a href="${href}">${escapeHtml(cfg.name)} ${escapeHtml(orasDisplay)}</a></li>`;
      return { html, categorie: cfg.categorie };
    });
  const listItemsGroupedHtml = buildStoreListHtmlGrouped(listItems, "ro");

  // date pentru insignele live — cheie->orar generic, PLUS liveIsOpenNow
  // (status real, per locație, dacă există în cache) — scriptul din
  // buildListStatusBadgeScript verifică întâi liveIsOpenNow, cade pe
  // calculul generic (weekly) doar dacă lipsește.
  const statusDataset = {};
  Object.keys(STORE_CONFIG).forEach((key) => {
    const entity = extractStatusEntity(STORE_CONFIG[key]);
    if (entity) {
      if (key in liveStatusByKey) entity.liveIsOpenNow = liveStatusByKey[key];
      statusDataset[key] = entity;
    }
  });

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Programul<span>DeAzi</span></a><a class="guides-link" href="/ghiduri">Ghiduri →</a><a class="guides-link itin-nav-link" href="/itinerar">Itinerar →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">Acasă</a> / ${escapeHtml(orasDisplay)}</p>
  <h1 class="page-h1">Program magazine în ${escapeHtml(orasDisplay)}</h1>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}

  <p class="intro-text">Alege mai jos magazinul din ${escapeHtml(orasDisplay)} pentru care vrei să vezi programul de azi și statusul live „deschis” sau „închis”.</p>

  <label class="map-live-toggle"><input type="checkbox" id="storeListOpenOnlyToggle"> Doar magazinele deschise acum</label>

  ${buildNoResultsItineraryPromoHtml("noResultsStoreItinPromo", "ro", "ro")}

  ${listItemsGroupedHtml}

  ${buildCityMapHtml(CITY_COORDS[orasDisplay], orasDisplay, nonce, "ro")}

  ${buildCityFaqHtml({ orasDisplay, lang: "ro" })}

  <footer>
    <p><strong>Programul de Azi</strong> îți arată în timp real programul magazinelor din ${escapeHtml(orasDisplay)}: Lidl, Kaufland, Penny, Mega Image, Carrefour, Auchan și mall-uri.</p>
  </footer>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}
</main>
${buildListStatusBadgeScript(nonce, statusDataset, "noResultsStoreItinPromo")}
${buildLiveMapPinsScript(orasDisplay, "ro", nonce)}
${buildLiveAttractionsMapPinsScript(orasDisplay, "ro", "ro", nonce)}
${buildSearchAndFavoritesScript(nonce, [], "poa_favorites_v1", "ro")}`;

  // ceas simplu, fără status (nicio entitate specifică selectată încă)
  const cityAlternateLinks = COUNTRIES.ro.cities.some((c) => normalizeSlug(c) === normalizeSlug(orasDisplay))
    ? [
        { hreflang: "ro", href: canonical },
        { hreflang: "en", href: `https://${INTL_DOMAIN}/ro/${orasSlug}` },
      ]
    : undefined;
  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: "ro", alternateLinks: cityAlternateLinks });
}

/* ============================================================
   PAGINI INTERNAȚIONALE (DE/UK/ES) — funcții separate de cele RO,
   ca să nu riscăm nimic din ce funcționează deja pentru România.
   ============================================================ */

// Pagină de magazin internațională: /:tara/:oras/:magazin
async function renderIntlStorePage({ countryCode, orasSlug, orasDisplay, magazinSlug, magazinDisplay, locatieDisplay, store, magazinKey, baseUrl, lang, nonce, userAgent, ip }) {
  const t = (lang && TRANSLATIONS[lang]) || COUNTRIES[countryCode].t;
  const activeLang = (lang && TRANSLATIONS[lang]) ? lang : Object.keys(TRANSLATIONS).find((k) => TRANSLATIONS[k] === COUNTRIES[countryCode].t) || "uk";
  // pagină hiper-locală (cartier) — același program ca pagina de oraș, doar
  // titlul/descrierea/canonical-ul includ cartierul, la fel ca pe .ro nativ
  // (renderStorePage) — nu date noi, doar o variantă SEO a acelorași date
  const locatieSlug = locatieDisplay ? slugifyCityName(locatieDisplay) : "";
  const effectiveMagazinLabel = locatieDisplay ? `${magazinDisplay} ${locatieDisplay}` : magazinDisplay;
  const title = t.titleTemplate(effectiveMagazinLabel, orasDisplay);
  const description = t.descriptionTemplate(effectiveMagazinLabel, orasDisplay);
  const canonical = locatieDisplay
    ? `${baseUrl}/${countryCode}/${orasSlug}/${magazinSlug}/${locatieSlug}`
    : `${baseUrl}/${countryCode}/${orasSlug}/${magazinSlug}`; // canonical rămâne mereu fără ?lang, indiferent ce limbă se afișează

  // Mall și cinema au structuri de date + logică de afișare complet diferite
  // de un magazin normal (mall: zone multiple cu programe separate; cinema:
  // fără status live fix, doar link spre orarul de filme) — ramură separată,
  // by-pass complet peste restul funcției, ca la .ro nativ (renderStorePage).
  if (store.type === "mall" || store.type === "cinema") {
    const mc = mallCinemaLabelsFor(activeLang);
    let mainHtml;
    let dataForClient;
    if (store.type === "mall") {
      mainHtml = `
  <div class="status-card" id="statusCard">
    <div class="store-name">${escapeHtml(magazinDisplay)} ${escapeHtml(orasDisplay)} — ${escapeHtml(mc.shoppingZone)}</div>
    <div class="status-text">—</div>
    <div class="status-sub">${escapeHtml(t.calculating)}</div>
    <div class="status-badge"><span class="dotw"></span><span id="statusBadge">${escapeHtml(t.todayLabel)}</span></div>
    <div class="closing-soon-bar" id="closingSoonBar" style="display:none"><div class="closing-soon-fill" id="closingSoonFill"></div></div>
  </div>
  <div class="secondary-badge" id="secondaryBadge">
    <span class="sb-dot"></span>
    <div class="sb-text"><span class="sb-label">${escapeHtml(mc.hypermarketZone)}</span><span class="sb-sub">${escapeHtml(t.calculating)}</span></div>
    <span class="sb-state">…</span>
  </div>

  <h2 class="section-title"><span class="bar"></span>${escapeHtml(mc.mallScheduleTitle)}</h2>
  <div class="schedule-card"><table><thead><tr><th>&nbsp;</th><th style="text-align:right">&nbsp;</th></tr></thead>
  <tbody>${store.zones.shopping.weekly.map((w, i) => `<tr data-day="${i}"><td class="day-cell">${t.dayNames[i]}</td><td class="hours-cell">${w ? `${w.open} – ${w.close}` : t.closedWord}</td></tr>`).join("")}</tbody></table></div>

  <h2 class="section-title"><span class="bar"></span>${escapeHtml(mc.mallHypermarketTitle)}</h2>
  <div class="schedule-card"><table><thead><tr><th>&nbsp;</th><th style="text-align:right">&nbsp;</th></tr></thead>
  <tbody>${store.zones.hypermarket.weekly.map((w, i) => `<tr data-day="${i}"><td class="day-cell">${t.dayNames[i]}</td><td class="hours-cell">${w ? `${w.open} – ${w.close}` : t.closedWord}</td></tr>`).join("")}</tbody></table></div>

  <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.holidaysTitle)}</h2>
  <div class="holiday-card">${store.zones.shopping.holidays.map((h) => `<div class="holiday-row"><span class="holiday-label">${escapeHtml(h.label)}</span><span class="holiday-hours ${h.hours ? "" : "closed"}">${h.hours ? `${h.hours[0]} – ${h.hours[1]}` : t.closedWord}</span></div>`).join("")}</div>`;
      dataForClient = { type: "mall", zones: store.zones };
    } else {
      mainHtml = `
  <div class="cinema-card">
    <div class="store-name">${escapeHtml(magazinDisplay)} ${escapeHtml(orasDisplay)}</div>
    <p class="cinema-note">${escapeHtml(mc.cinemaNote)}</p>
    <a href="${escapeHtml(store.ticketUrl)}" target="_blank" rel="noopener" class="cinema-btn">${escapeHtml(mc.cinemaBtn)}</a>
  </div>`;
      dataForClient = { type: "general", weekly: [], holidays: [] };
    }
    const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Opening<span>HoursToday</span></a><a class="guides-link" href="/guides">${navLabelsFor(activeLang).guides} →</a><a class="guides-link itin-nav-link" href="${itineraryHrefFor(countryCode, activeLang)}">${navLabelsFor(activeLang).itinerary} →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">${escapeHtml(t.home)}</a> / <a href="/${countryCode}/${orasSlug}">${escapeHtml(orasDisplay)}</a> / ${escapeHtml(magazinDisplay)}</p>
  <div class="search-box-wrap">
    <input type="text" id="siteSearchInput" class="city-search-input" placeholder="${escapeHtml(t.searchPlaceholder || "Search a store or attraction...")}" autocomplete="off">
    <div id="siteSearchResults" class="search-results"></div>
  </div>
  ${mainHtml}
  <footer>
    <p><strong>Opening Hours Today</strong> ${escapeHtml(t.footer(`${magazinDisplay} ${orasDisplay}`))}</p>
  </footer>
</main>
${buildSearchAndFavoritesScript(nonce, [], "oht_favorites_v1", activeLang, countryCode)}`;
    let mcAlternateLinks;
    if (countryCode === "ro") {
      mcAlternateLinks = [
        { hreflang: "en", href: canonical },
        { hreflang: "ro", href: `https://${RO_DOMAIN}/${orasSlug}/${magazinSlug}` },
      ];
    }
    return pageShell({ title, description, canonical, bodyHtml, dataForClient, nonce, langCode: activeLang, alternateLinks: mcAlternateLinks });
  }

  const amazonButtonHtml = linkAmazonAffiliate
    ? `<a href="${escapeHtml(linkAmazonAffiliate)}" target="_blank" rel="noopener sponsored" class="amazon-btn amazon-btn-cta"><span class="affiliate-cta-text">${escapeHtml(t.amazonBtn)}</span><span class="affiliate-cta-arrow" aria-hidden="true">➜</span></a>`
    : "";

  // Butonul/caruselul de afiliere per-brand (Catena, Spring Pharma, cele 13
  // magazine partenere ș.a.m.d.) — DOAR pentru România. Aceste linkuri sunt
  // în lei/RON, cu text în română, pentru comercianți români — n-are sens să
  // apară pe o pagină de magazin din Germania sau UK. Necesar aici (nu doar
  // în renderStorePage) fiindcă, odată cu migrarea .ro -> .eu, orice vizitator
  // ajuns pe .ro e redirecționat spre .eu, unde ruta /:tara/:oras/:magazin
  // (cu tara="ro") ajunge la ACEASTĂ funcție, nu la renderStorePage.
  let roAffiliateHtml = "";
  let roAffiliateScriptHtml = "";
  if (countryCode === "ro") {
    const roAffBtn = buildStoreAffiliateButtonHtml(magazinKey, magazinDisplay, nonce);
    roAffiliateHtml = roAffBtn.html;
    roAffiliateScriptHtml = roAffBtn.scriptHtml;
  }

  // status live (Google) — același slug generat la popularea bazei
  // (nume + oraș + cod țară), în limba activă a paginii (nu implicită)
  const liveSlug = !locatieDisplay ? toDbSlug(`${magazinDisplay}-${orasDisplay}-${countryCode}`) : null;
  const googleLang = toGoogleLang(activeLang);
  const live = await tryGetLiveStatus(liveSlug, googleLang, "store", isBotRequest(userAgent), ip);
  const schemaHtml = buildLocalBusinessSchema({ name: `${magazinDisplay} ${orasDisplay}`, weekly: store.weekly, live });

  let statusCardHtml;
  let weeklySectionHtml;

  if (live && live.isOpenNow !== null) {
    const specialBanner = live.isSpecialDay && countryCode === "ro" && isRealRomanianHolidayToday(live.utcOffsetMinutes)
      ? `<div class="geo-country-highlight">📅 ${escapeHtml(t.closedHoliday ? t.closedHoliday.split(" — ")[0] : "Special hours today")}</div>`
      : "";
    statusCardHtml = `
  <div class="status-card ${live.isOpenNow ? "is-open" : "is-closed"}" id="statusCard">
    <div class="store-name">${escapeHtml(magazinDisplay)}${locatieDisplay ? " " + escapeHtml(locatieDisplay) : ""} ${escapeHtml(orasDisplay)}</div>
    <div class="status-text">${live.isOpenNow ? escapeHtml(t.labels.openNow) : escapeHtml(t.labels.closedNow)}</div>
    <div class="status-sub">${escapeHtml(liveGoogleLabelFor(activeLang))}</div>
    <div class="status-badge"><span class="dotw"></span><span id="statusBadge">${escapeHtml(t.todayLabel)}</span></div>
  </div>
  ${contactInfoHtml(live)}
  ${buildHowToGetThereHtml(howToGetThereLabelsFor(activeLang), `${magazinDisplay} ${orasDisplay}`)}
  ${buildReportIssueHtml({ slug: `${countryCode}/${orasSlug}/${magazinSlug}`, name: `${magazinDisplay} ${orasDisplay}`, oras: orasDisplay, labels: reportIssueLabelsFor(activeLang) })}
  ${specialBanner}
  ${buildContextualWidgetHtml({ type: "store", name: magazinDisplay, orasDisplay, labels: contextualWidgetLabelsFor(activeLang), countryCode })}`;
    weeklySectionHtml = `
  <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.weeklyTitle)} (live, Google)</h2>
  <div class="holiday-card">${live.weeklyScheduleText.length ? live.weeklyScheduleText.map((line) => `<div class="holiday-row"><span class="holiday-label">${escapeHtml(line)}</span></div>`).join("") : `<div class="holiday-row"><span class="holiday-label">—</span></div>`}</div>`;
  } else {
    const weeklyRows = store.weekly
      .map((w, i) => {
        const hours = w ? `${w.open} – ${w.close}` : t.closedWord;
        return `<tr data-day="${i}"><td class="day-cell">${t.dayNames[i]}</td><td class="hours-cell">${hours}</td></tr>`;
      })
      .join("");
    statusCardHtml = `
  <div class="status-card" id="statusCard">
    <div class="store-name">${escapeHtml(magazinDisplay)}${locatieDisplay ? " " + escapeHtml(locatieDisplay) : ""} ${escapeHtml(orasDisplay)}</div>
    <div class="status-text">—</div>
    <div class="status-sub">${escapeHtml(t.calculating)}</div>
    <div class="status-badge"><span class="dotw"></span><span id="statusBadge">${escapeHtml(t.todayLabel)}</span></div>
    <div class="closing-soon-bar" id="closingSoonBar" style="display:none"><div class="closing-soon-fill" id="closingSoonFill"></div></div>
  </div>
  ${buildHowToGetThereHtml(howToGetThereLabelsFor(activeLang), `${magazinDisplay} ${orasDisplay}`)}
  ${buildReportIssueHtml({ slug: `${countryCode}/${orasSlug}/${magazinSlug}`, name: `${magazinDisplay} ${orasDisplay}`, oras: orasDisplay, labels: reportIssueLabelsFor(activeLang) })}
  ${buildContextualWidgetHtml({ type: "store", name: magazinDisplay, orasDisplay, labels: contextualWidgetLabelsFor(activeLang), countryCode })}`;
    weeklySectionHtml = `
  <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.weeklyTitle)}</h2>
  <div class="schedule-card"><table><thead><tr><th>&nbsp;</th><th style="text-align:right">&nbsp;</th></tr></thead>
  <tbody>${weeklyRows}</tbody></table></div>`;
  }

  // Agregare comunitară — vezi comentariul din renderStorePage (RO), aceeași logică
  const reportSlug = `${countryCode}/${orasSlug}/${magazinSlug}`;
  const reportCounts = await getReportCounts(reportSlug);
  let reportedWrongHtml = "";
  if (reportCounts.inchisDefinitiv >= REPORT_THRESHOLD) {
    statusCardHtml = renderClosedPermanentlyHtml(`${magazinDisplay} ${orasDisplay}`, closedPermanentlyLabelsFor(activeLang));
    weeklySectionHtml = "";
  } else if (reportCounts.programGresit >= REPORT_THRESHOLD) {
    reportedWrongHtml = reportedWrongBannerHtml(reportedWrongTextFor(activeLang));
  }

  const holidayHtml =
    store.holidays && store.holidays.length
      ? store.holidays
          .map((h) => {
            const hoursText = h.hours ? `${h.hours[0]} – ${h.hours[1]}` : t.closedWord;
            const cls = h.hours ? "" : "closed";
            return `<div class="holiday-row"><span class="holiday-label">${escapeHtml(h.label)}</span><span class="holiday-hours ${cls}">${hoursText}</span></div>`;
          })
          .join("")
      : `<div class="holiday-row"><span class="holiday-label">${escapeHtml(t.noHolidays)}</span></div>`;

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Opening<span>HoursToday</span></a><a class="guides-link" href="/guides">${navLabelsFor(activeLang).guides} →</a><a class="guides-link itin-nav-link" href="${itineraryHrefFor(countryCode, activeLang)}">${navLabelsFor(activeLang).itinerary} →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb">${locatieDisplay
    ? `<a href="/">${escapeHtml(t.home)}</a> / <a href="/${countryCode}/${orasSlug}">${escapeHtml(orasDisplay)}</a> / <a href="/${countryCode}/${orasSlug}/${magazinSlug}">${escapeHtml(magazinDisplay)}</a> / ${escapeHtml(locatieDisplay)}`
    : `<a href="/">${escapeHtml(t.home)}</a> / <a href="/${countryCode}/${orasSlug}">${escapeHtml(orasDisplay)}</a> / ${escapeHtml(magazinDisplay)}`}</p>
  <div class="search-box-wrap">
    <input type="text" id="siteSearchInput" class="city-search-input" placeholder="${escapeHtml(t.searchPlaceholder || "Search a store or attraction...")}" autocomplete="off">
    <div id="siteSearchResults" class="search-results"></div>
  </div>

  ${reportedWrongHtml}
  ${statusCardHtml}

  ${amazonButtonHtml}
  ${roAffiliateHtml}

  ${weeklySectionHtml}

  <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.holidaysTitle)}</h2>
  <div class="holiday-card">${holidayHtml}</div>

  <p class="disclaimer">${escapeHtml(t.disclaimer(`${magazinDisplay} ${orasDisplay}`))}</p>

  <footer>
    <p><strong>Opening Hours Today</strong> ${escapeHtml(t.footer(`${magazinDisplay} ${orasDisplay}`))}</p>
  </footer>
</main>
${schemaHtml}
${buildContextualWidgetScript(nonce)}
${buildReportIssueScript(nonce, reportIssueLabelsFor(activeLang))}
${buildHowToGetThereScript(nonce)}
${buildSearchAndFavoritesScript(nonce, [], "oht_favorites_v1", activeLang, countryCode)}
${roAffiliateScriptHtml}`;

  const dataForClient =
    live && live.isOpenNow !== null
      ? { type: "general", weekly: [], holidays: [] }
      : { type: "store", weekly: store.weekly, holidays: store.holidays, dayNames: t.dayNames, labels: t.labels };

  // hreflang reciproc spre programul-de-azi.ro — DOAR pentru magazinele
  // românești de pe .eu (countryCode "ro"), care au un echivalent nativ real
  let intlAlternateLinks;
  if (countryCode === "ro") {
    intlAlternateLinks = [
      { hreflang: "en", href: canonical },
      { hreflang: "ro", href: `https://${RO_DOMAIN}/${orasSlug}/${magazinSlug}` },
    ];
  }

  return pageShell({ title, description, canonical, bodyHtml, dataForClient, nonce, langCode: activeLang, alternateLinks: intlAlternateLinks });
}

// Pagină generală de oraș internațională: /:tara/:oras
async function renderIntlCityPage({ countryCode, orasSlug, orasDisplay, baseUrl, lang, nonce }) {
  const country = COUNTRIES[countryCode];
  const t = (lang && TRANSLATIONS[lang]) || country.t;
  const activeLang = (lang && TRANSLATIONS[lang]) ? lang : Object.keys(TRANSLATIONS).find((k) => TRANSLATIONS[k] === country.t) || "uk";
  const title = `${orasDisplay} — Opening Hours Today`;
  const description = t.descriptionTemplate("", orasDisplay);
  const canonical = `${baseUrl}/${countryCode}/${orasSlug}`;

  const allowedKeys = Object.keys(country.config).filter((key) => isSelectiveBrandAllowedInCity(countryCode, key, orasDisplay));

  // Statusul live REAL, per locație — aceeași reparație ca la renderCityPage
  // (RO), aplicată acum și pe .eu, la cerere explicită ("site-ul
  // internațional să nu mai rămână în urmă"). Slug-ul INTL include și
  // codul de țară (spre deosebire de RO), vezi tiparul deja folosit la
  // populare (toDbSlug(`${name}-${oras}-${cc}`)).
  const liveStatusByKey = {};
  if (dbPool && GOOGLE_PLACES_API_KEY_LIVE) {
    try {
      const expectedSlugs = allowedKeys.map((key) => toDbSlug(`${country.config[key].name}-${orasDisplay}-${countryCode}`));
      const { rows } = await dbPool.query(
        "SELECT slug, place_id FROM locatii WHERE tip = 'store' AND slug = ANY($1::text[])",
        [expectedSlugs]
      );
      const placeIdBySlug = {};
      rows.forEach((r) => { placeIdBySlug[r.slug] = r.place_id; });
      await Promise.all(
        allowedKeys.map(async (key) => {
          const slug = toDbSlug(`${country.config[key].name}-${orasDisplay}-${countryCode}`);
          const placeId = placeIdBySlug[slug];
          if (!placeId || placeId === "ZERO_RESULTS" || placeId.startsWith("ERROR_")) return;
          try {
            const status = await getLocationStatus({ pool: dbPool, placeId, apiKey: GOOGLE_PLACES_API_KEY_LIVE, language: activeLang, cacheOnly: true, ttlHours: 168 });
            if (!status.skipped && status.isOpenNow !== null) liveStatusByKey[key] = status.isOpenNow;
          } catch (e) { /* o locație eșuată nu blochează restul */ }
        })
      );
    } catch (e) { /* interogarea eșuată -> cade pe programul generic, ca înainte */ }
  }

  const listItems = allowedKeys
    .map((key) => {
      const cfg = country.config[key];
      const urlSlug = cfg.slug || key;
      const statusKey = extractStatusEntity(cfg) ? key : null;
      const href = `/${countryCode}/${orasSlug}/${urlSlug}`;
      const html = `<li><button type="button" class="fav-star" data-name="${escapeHtml(cfg.name)} ${escapeHtml(orasDisplay)}" data-type="store" data-country="${escapeHtml(countryCode)}" data-href="${escapeHtml(href)}">☆</button>${brandBadgeHtml(cfg.name, statusKey)}<a href="${href}">${escapeHtml(cfg.name)} ${escapeHtml(orasDisplay)}</a></li>`;
      return { html, categorie: cfg.categorie };
    });
  const listItemsGroupedHtml = buildStoreListHtmlGrouped(listItems, activeLang);

  // date pentru insignele live — la fel ca pe RO, funcție comună (vezi
  // extractStatusEntity), ca site-ul internațional să nu mai rămână în urmă
  const statusDataset = {};
  Object.keys(country.config).forEach((key) => {
    const entity = extractStatusEntity(country.config[key]);
    if (entity) {
      if (key in liveStatusByKey) entity.liveIsOpenNow = liveStatusByKey[key];
      statusDataset[key] = entity;
    }
  });

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Opening<span>HoursToday</span></a><a class="guides-link" href="/guides">${navLabelsFor(activeLang).guides} →</a><a class="guides-link itin-nav-link" href="${itineraryHrefFor(countryCode, activeLang)}">${navLabelsFor(activeLang).itinerary} →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">${escapeHtml(t.home)}</a> / ${escapeHtml(orasDisplay)}</p>
  <div class="search-box-wrap">
    <input type="text" id="siteSearchInput" class="city-search-input" placeholder="${escapeHtml(t.searchPlaceholder || "Search a store or attraction...")}" autocomplete="off">
    <div id="siteSearchResults" class="search-results"></div>
  </div>
  <h1 class="page-h1">${escapeHtml(orasDisplay)}</h1>
  <label class="map-live-toggle"><input type="checkbox" id="storeListOpenOnlyToggle"> ${escapeHtml(openOnlyStoreLabelFor(activeLang))}</label>
  ${buildNoResultsItineraryPromoHtml("noResultsStoreItinPromo", countryCode, activeLang)}
  ${listItemsGroupedHtml}
  ${buildCityMapHtml(CITY_COORDS[orasDisplay], orasDisplay, nonce, activeLang)}
  ${buildCityFaqHtml({ orasDisplay, lang: activeLang })}
</main>
${buildListStatusBadgeScript(nonce, statusDataset, "noResultsStoreItinPromo")}
${buildLiveMapPinsScript(orasDisplay, lang, nonce)}
${buildLiveAttractionsMapPinsScript(orasDisplay, countryCode, lang, nonce)}
${buildSearchAndFavoritesScript(nonce, [], "oht_favorites_v1", activeLang, countryCode)}`;

  return pageShell({
    title,
    description,
    canonical,
    bodyHtml,
    dataForClient: { type: "general", weekly: [], holidays: [], dayNames: t.dayNames, labels: t.labels },
    nonce,
    langCode: activeLang,
    alternateLinks:
      countryCode === "ro"
        ? [
            { hreflang: "en", href: canonical },
            { hreflang: "ro", href: `https://${RO_DOMAIN}/${orasSlug}` },
          ]
        : undefined,
  });
}

// Pagină de start: site.ro/ — fără oraș/magazin specificat încă
// Pagină de start pentru domeniul internațional (opening-hours-today.eu) —
// simplu selector de țară, în engleză (punct de intrare neutru, înainte să
// știm limba vizitatorului). Minimală, deliberat — o pagină completă de tip
// homepage RO (geolocație, PWA, căutare) pentru fiecare piață e un pas separat.
function renderIntlHomePage(nonce, baseUrl, detectedCountry, detectedCity, lang) {
  const t = (lang && TRANSLATIONS[lang]) || TRANSLATIONS.uk;
  const activeLang = (lang && TRANSLATIONS[lang]) ? lang : "uk";
  const title = "Opening Hours Today — Is the store open now?";
  const description = "Check instantly whether major stores and attractions across Europe are open right now, plus full weekly and holiday opening hours.";
  const canonical = `${baseUrl}/`;

  // Sortat alfabetic după numele afișat (Austria, Belgium, Croatia...) —
  // înainte era în ordinea în care au fost adăugate țările în cod (RO
  // primul, apoi mai mult sau mai puțin după mărime), greu de scanat cu
  // ochiul într-o bară de derulare cu 27 de opțiuni. Calculat automat din
  // COUNTRY_LABELS, nu scris de mână a doua oară — dacă se adaugă
  // vreodată o țară nouă, ordinea rămâne corectă fără nicio intervenție.
  const allCodes = Object.keys(COUNTRY_LABELS).sort((a, b) => {
    const nameA = COUNTRY_LABELS[a].split(" ").slice(1).join(" ");
    const nameB = COUNTRY_LABELS[b].split(" ").slice(1).join(" ");
    return nameA.localeCompare(nameB);
  });
  const countryLinks = allCodes.map((code) => ({
    code,
    flag: COUNTRY_LABELS[code].split(" ")[0],
    name: COUNTRY_LABELS[code].split(" ").slice(1).join(" "),
    href: `/${code}/${slugifyCityName(COUNTRIES[code].cities[0])}`,
  }));

  const validDetected = detectedCountry && COUNTRIES[detectedCountry] ? detectedCountry : null;
  const geoHighlightHtml = validDetected
    ? `<div class="geo-country-highlight">${escapeHtml(t.geoLooksLike || "📍 Looks like you're in")} <strong>${escapeHtml(detectedCity ? `${detectedCity}, ${COUNTRY_LABELS[validDetected].split(" ").slice(1).join(" ")}` : COUNTRY_LABELS[validDetected])}</strong> ${escapeHtml(t.geoShowingFirst || "— showing that first. Tap 🌍 to browse everything, or pick another flag below anytime.")}</div>`
    : "";

  // bară persistentă de filtrare — vizibilă indiferent pe ce tab ești (Stores
  // sau Attractions), aceeași selecție se aplică simultan la amândouă.
  const filterBarHtml = `
  <nav class="store-scroll country-filter-bar">
    <span class="chip">🌍 All</span>
    ${countryLinks.map((c) => `<button type="button" class="chip country-flag-btn" data-country-select="${c.code}">${c.flag} ${escapeHtml(c.name)}</button>`).join("")}
  </nav>`;

  // textul de rezervare bilete se traduce per țara atracției (COUNTRIES[code].t
  // dacă țara are pagini de magazine — ex. "at"/"be" reutilizează de/nl —
  // altfel engleză implicit) — un singur link general (linkBileteTurism) pentru toate.

  // --- STORES: blocul "toate țările" (implicit, vizibil, SEO-friendly — link-uri
  // reale, urmăribile chiar și fără JS) + câte un bloc ascuns per țară, cu orașele ei ---
  const storesAllBlockHtml = `
  <div class="country-filter-block active" data-country-block="all">
    ${geoHighlightHtml}
    <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.chooseCountry || "Choose a country")}</h2>
    <ul class="mall-list" hidden>${countryLinks.map((c) => `<li><a href="${c.href}" class="country-pick" data-country="${c.code}">${c.flag} ${escapeHtml(c.name)}</a></li>`).join("")}</ul>
  </div>`;

  const storesByCountryHtml = allCodes
    .map((code) => {
      const cityItems = COUNTRIES[code].cities
        .map((city) => `<li><a href="/${code}/${slugifyCityName(city)}">${escapeHtml(city)}</a></li>`)
        .join("");
      const listId = `allCitiesList-${code}`;
      const citySelectorHtml = buildCitySelectorHtml({
        popularCities: COUNTRIES[code].cities,
        hrefPrefix: `/${code}/`,
      });
      return `
  <div class="country-filter-block" data-country-block="${code}" style="display:none">
    
    <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.storesIn || "Stores in")} ${escapeHtml(COUNTRY_LABELS[code])}</h2>
    ${citySelectorHtml}
    <ul class="mall-list" id="${listId}" hidden>${cityItems}</ul>
  </div>`;
    })
    .join("");

  // --- ATTRACTIONS: la fel — blocul "toate țările" (implicit) + câte un bloc ascuns per țară ---
  // La scară (10.000+ obiective posibile, la nivel de Europa) NU mai randăm
  // toate țările complet, în HTML-ul inițial — doar țara detectată prin IP
  // (sau România, implicit, ca piață principală) e randată integral, server-side
  // (bun pentru SEO și pentru utilizatorii fără JS). Restul țărilor apar ca
  // <details> închis, cu doar numele și numărul de obiective — conținutul
  // real se aduce printr-un fetch la /api/attractions/:tara.json, DOAR dacă
  // utilizatorul chiar deschide acea țară (vezi buildAttractionLazyScript).
  const primaryAttractionCountry = validDetected || "ro";
  // țara principală apare mereu PRIMA în listă — nu doar accesibilă prin
  // scroll (fragil, poate eșua din motive diverse) — pur și simplu prima
  // din ordinea de randare, garantat vizibilă imediat, fără JS.
  const orderedAttractionCodes = [
    primaryAttractionCountry,
    ...Object.keys(ATTRACTIONS).filter((c) => c !== primaryAttractionCountry),
  ];
  // Link-uri clicabile, colorate — cerut explicit: "favorite" (⭐) și
  // "itinerar" (🧭) din textul introductiv trebuie să funcționeze, nu doar
  // să arate colorat. attractionsIntro a devenit FUNCȚIE (favHref, itinHref)
  // => html, pentru toate cele 21 de limbi — nu mai poate trece prin
  // escapeHtml (ar strica link-urile, arătând tag-urile ca text simplu).
  const favHrefForIntro = "/#favoritesList";
  const itinHrefForIntro = itineraryHrefFor(validDetected, activeLang);
  const attractionsIntroHtml = typeof t.attractionsIntro === "function"
    ? t.attractionsIntro(favHrefForIntro, itinHrefForIntro)
    : escapeHtml(t.attractionsIntro || "Official ticket and information pages — always check the live hours shown there before you visit. Tap ☆ to save one to your favorites.");
  const attractionsAllBlockHtml = `
  <div class="country-filter-block active" data-country-block="all">
    <p class="intro-text">${attractionsIntroHtml}</p>
    ${orderedAttractionCodes
      .map((code) => {
        if (code === primaryAttractionCountry) {
          const items = buildAttractionListForCountry(ATTRACTIONS[code], code, true, activeLang);
          const grBanner = code === "gr" ? buildGreeceBeachPromoCardHtml(activeLang) : "";
          return `${grBanner}<h3 class="attractions-country" id="attractions-country-${code}">${COUNTRY_LABELS[code]}</h3>${items}`;
        }
        return `<details class="attraction-country-lazy" data-lazy-country="${code}">
          <summary class="attractions-country">${COUNTRY_LABELS[code]} <span class="attraction-category-count">(${ATTRACTIONS[code].length})</span></summary>
          <div class="lazy-attraction-target" data-loading-text="${escapeHtml(loadingTextFor(activeLang))}"></div>
        </details>`;
      })
      .join("")}
  </div>`;

  // Țara primară NU mai primește un al doilea bloc, separat, cu toate
  // obiectivele repetate (bug de duplicare, semnalat direct) — selectarea
  // steagului ei arată, pur și simplu, secțiunea deja randată mai sus, în
  // tab-ul "toate țările" (vezi selectCountry în buildCountryFilterScript,
  // care redirecționează spre "all" + scroll la ancora țării, pentru codul
  // țării primare). Restul țărilor rămân lazy, ca înainte.
  const attractionsByCountryHtml = Object.keys(ATTRACTIONS)
    .filter((code) => code !== primaryAttractionCountry)
    .map((code) => {
      return `
  <div class="country-filter-block" data-country-block="${code}" data-lazy-country="${code}" style="display:none">
    ${code === "gr" ? buildGreeceBeachPromoCardHtml(activeLang) : ""}
    <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.attractionsIn || "Attractions in")} ${escapeHtml(COUNTRY_LABELS[code])}</h2>
    <div class="lazy-attraction-target" data-loading-text="${escapeHtml(loadingTextFor(activeLang))}"></div>
  </div>`;
    })
    .join("");

  // Itinerar — pe homepage nu există o singură țară "curentă"; folosim
  // țara detectată geografic (validDetected), dacă există, altfel cade pe
  // varianta simplă /itinerar (România) — comportament mai bun decât să
  // lipsească linkul complet.
  const itineraryHomeHref = itineraryHrefFor(validDetected, activeLang);
  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Opening<span>HoursToday</span></a><a class="guides-link" href="/guides">${navLabelsFor(activeLang).guides} →</a><a class="guides-link itin-nav-link" href="${itineraryHomeHref}">${navLabelsFor(activeLang).itinerary} →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">

  ${pushEnabled ? `<button type="button" id="pushSubBtn" class="push-sub-btn">${escapeHtml(t.pushSubBtn || "🔔 Subscribe to alerts (holidays, special hours)")}</button>` : ""}

  <h1 class="page-h1">${escapeHtml(t.homeH1 || "Is the store open right now?")}</h1>
  <p class="intro-text">${escapeHtml(t.homeIntro || "Pick a country below to filter everything — Stores and Attractions both — or search directly.")}</p>
  ${buildLanguageSwitcher(activeLang, "/")}
  ${filterBarHtml}

  <nav class="sub-nav-tabs">
    <button type="button" class="sub-nav-tab active" data-tab="stores">${escapeHtml(t.tabStores)}</button>
    <button type="button" class="sub-nav-tab" data-tab="attractions">${escapeHtml(t.tabAttractions)}</button>
    <button type="button" class="sub-nav-tab" data-tab="favorites">${escapeHtml(t.favoritesLabel || "⭐ Favorites")}</button>
  </nav>

  <div class="search-box-wrap">
    <input type="text" id="siteSearchInput" class="city-search-input" placeholder="${escapeHtml(t.searchPlaceholder || "Search a store or attraction...")}" autocomplete="off">
    <div id="siteSearchResults" class="search-results"></div>
  </div>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}

  <div class="sub-nav-panel active" data-panel="stores">
    <label class="map-live-toggle"><input type="checkbox" id="storeListOpenOnlyToggle"> ${escapeHtml(openOnlyStoreLabelFor(activeLang))}</label>
    ${storesAllBlockHtml}
    ${storesByCountryHtml}
  </div>

  <div class="sub-nav-panel" data-panel="attractions">
    ${buildItineraryPromoCardHtml(validDetected, activeLang)}
    ${validDetected !== "gr" ? `<label class="map-live-toggle attraction-list-open-toggle"><input type="checkbox" id="attractionListOpenOnlyToggle"> ${escapeHtml(openOnlyAttractionLabelFor(activeLang))}</label>` : ""}
    ${buildNoResultsItineraryPromoHtml("noResultsAttractionItinPromo", validDetected, activeLang)}
    ${attractionsAllBlockHtml}
    ${attractionsByCountryHtml}
  </div>

  <div class="sub-nav-panel" data-panel="favorites">
    <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.favoritesLabel || "⭐ Favorites")}</h2>
    <p class="intro-text">${escapeHtml(FAV_INTRO_TEXTS[activeLang] || FAV_INTRO_TEXTS.uk)}</p>
    <div id="favoritesList"></div>
  </div>

  <footer>
    <p><strong>Opening Hours Today</strong> ${escapeHtml(HOMEPAGE_FOOTER_TEXTS[activeLang] || HOMEPAGE_FOOTER_TEXTS.uk)}</p>
  </footer>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}
</main>
${buildTabsScript(nonce)}
${buildSearchAndFavoritesScript(nonce, [], null, activeLang, primaryAttractionCountry)}
${buildAttractionLazyScript(nonce, activeLang)}
${buildCountryFilterScript(nonce, validDetected, detectedCity, primaryAttractionCountry)}
${buildAttractionListFilterScript(nonce)}
${buildAttractionAccordionScript(nonce)}
${pushEnabled ? buildPushSubscribeScript(nonce, VAPID_PUBLIC_KEY, getExtraLabels(activeLang).pushSub, getExtraLabels(activeLang).pushUnsub) : ""}`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: activeLang });
}

// Pagină de obiectiv turistic — RO — status live (dacă avem place_id
// valid) + buton de bilete. Dacă nu avem date live, NU inventăm program —
// arătăm clar că nu avem, cu link spre sursa oficială.
// Ghiduri Utile — secțiune editorială, cerută explicit pentru validarea
// Travelpayouts (verifică dacă site-ul are conținut editorial, nu doar
// pagini automate de program). Butoanele din interior reutilizează EXACT
// funcțiile deja construite (omioLinkFor, getTransferLinkFor, parkviaLinkFor,
// linkTheForkAffiliate/linkOpenTableAffiliate) — quando pui codurile reale
// de afiliat, aceste pagini le folosesc automat, fără nicio altă modificare.
;

function buildTravelGuidesBoxHtml() {
  if (!TRAVEL_GUIDES_MONETIZATION_READY) {
    return `<p class="intro-text">${escapeHtml(comingSoonTextFor("ro"))}</p>`;
  }
  return `
  <div class="plan-visit-block" style="display:block">
    <p class="intro-text"><strong>📖 Informații utile pentru vizită</strong></p>
    <a href="/ghiduri/transport" class="plan-visit-option plan-visit-ticket">🚆 Cum ajungi aici? Ghid de tren și autocar</a>
    <a href="/ghiduri/parcari" class="plan-visit-option plan-visit-parking">🅿️ Unde parchezi mașina? Ghid parcări securizate</a>
    <a href="/ghiduri/restaurante" class="plan-visit-option plan-visit-parking-alt">🍽️ Unde mănânci în apropiere? Rezervări restaurante</a>
  </div>`;
}

async function renderTravelGuidePage({ guide, baseUrl, nonce }) {
  const title = `${guide.title} — Ghiduri Utile`;
  const description = `${guide.intro}. Sfaturi practice pentru turiști, plus linkuri directe către rezervări.`;
  const canonical = `${baseUrl}/ghiduri/${guide.slug}`;

  const otherGuides = TRAVEL_GUIDES_RO.filter((g) => g.slug !== guide.slug)
    .map((g) => `<li><a href="/ghiduri/${g.slug}">${escapeHtml(g.title)}</a></li>`)
    .join("");

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Programul<span>DeAzi</span></a><a class="guides-link" href="/ghiduri">Ghiduri →</a><a class="guides-link itin-nav-link" href="/itinerar">Itinerar →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">Acasă</a> / <a href="/ghiduri">Ghiduri Utile</a> / ${escapeHtml(guide.title)}</p>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}

  <h1 class="page-h1">${escapeHtml(guide.title)}</h1>
  <p class="intro-text">${escapeHtml(guide.intro)}</p>

  ${guide.body}

  <h2 class="section-title"><span class="bar"></span>Alte ghiduri utile</h2>
  <ul class="mall-list">${otherGuides}</ul>

  <footer>
    <p><strong>Programul de Azi</strong> — ghiduri practice pentru vizitatori, alături de programul actualizat al fiecărui obiectiv.</p>
  </footer>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}
</main>`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: "ro" });
}

function renderTravelGuidesIndexPage({ baseUrl, nonce }) {
  const title = "Ghiduri Utile pentru Călătorii — Programul de Azi";
  const description = "Sfaturi practice pentru turiști: transport, parcare și rezervări la restaurant, lângă marile obiective turistice.";
  const canonical = `${baseUrl}/ghiduri`;

  const items = TRAVEL_GUIDES_RO.map((g) => `<li><a href="/ghiduri/${g.slug}">${escapeHtml(g.title)}</a></li>`).join("");

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Programul<span>DeAzi</span></a><a class="guides-link" href="/ghiduri">Ghiduri →</a><a class="guides-link itin-nav-link" href="/itinerar">Itinerar →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">Acasă</a> / Ghiduri Utile</p>
  <h1 class="page-h1">Ghiduri Utile</h1>
  <p class="intro-text">Sfaturi practice pentru vizitatori — transport, parcare și rezervări, lângă marile obiective turistice.</p>
  <ul class="mall-list">${items}</ul>
  <footer>
    <p><strong>Programul de Azi</strong> — ghiduri practice pentru vizitatori, alături de programul actualizat al fiecărui obiectiv.</p>
  </footer>
</main>`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: "ro" });
}

// Echivalentul englezesc, pentru .eu — engleză, nu 17 limbi (același
// compromis pragmatic ca la mall/cinema: EN acoperă toți vizitatorii,
// traducerea în 17 limbi ar fi volum enorm pentru câștig marginal aici).
;

;

;

;

;

;

;

;

// Etichete SCURTE, pentru antetul paginii ("Guides →" / "Itinerary →") — pe
// TOATE cele 21 de limbi ale site-ului, nu doar cele 6-7 cu ghiduri complete
// traduse. Bug real, semnalat direct: aceste două cuvinte erau legate de
// DOMENIU (.ro vs .eu), nu de LIMBA selectată — pe .eu, un vizitator care
// alegea română (sau orice altă limbă din cele 21) tot vedea "Guides"/
// "Itinerary" în engleză, indiferent ce alesese. Separat complet de
// GUIDES_PAGE_LABELS (acela e conținut lung, pentru pagina de ghiduri
// propriu-zisă — nu toate cele 21 de limbi îl au încă).
;
function navLabelsFor(lang) {
  return NAV_LABELS[lang] || NAV_LABELS.uk;
}
// Etichetă pentru butonul de căutare zboruri (Skyscanner) de pe pagina de
// itinerar — "Caută zboruri către {oraș}", pe toate cele 21 de limbi. Text
// complet propriu (nu scurtă ca NAV_LABELS), deci mapă separată.
;
function flightSearchLabelFor(lang) {
  return FLIGHT_SEARCH_LABELS[lang] || FLIGHT_SEARCH_LABELS.uk;
}
// Eticheta pentru butonul de închiriere mașină (Discover Cars) de pe pagina
// de itinerar — aceleași 21 de limbi, același tipar ca FLIGHT_SEARCH_LABELS.
;
function carRentalLabelFor(lang) {
  return CAR_RENTAL_LABELS[lang] || CAR_RENTAL_LABELS.uk;
}
// Selector "tip călătorie" pe formularul de itinerar — cerut explicit:
// familia cu copii primește obiective de tip parc de agrement prioritizate
// (folosim eticheta "category: parcuri_agrement" deja existentă pe TOATE
// obiectivele din cele 6 țări procesate riguros, nu hardcodăm "Disneyland"
// undeva — funcționează automat pentru orice parc din baza noastră).
;
function tripTypeLabelsFor(lang) {
  return TRIP_TYPE_LABELS[lang] || TRIP_TYPE_LABELS.uk;
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

const TRAVEL_GUIDES_BY_LANG = {
  uk: TRAVEL_GUIDES_EN,
  // Reutilizăm conținutul deja tradus (RO), în loc să-l scriem a doua oară
  // — vezi comentariul de la GUIDES_PAGE_LABELS.ro pentru motivul bug-ului.
  ro: TRAVEL_GUIDES_RO,
  de: TRAVEL_GUIDES_DE,
  fr: TRAVEL_GUIDES_FR,
  es: TRAVEL_GUIDES_ES,
  it: TRAVEL_GUIDES_IT,
  pl: TRAVEL_GUIDES_PL,
  nl: TRAVEL_GUIDES_NL,
};
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
  return `
  <div class="plan-visit-block" style="display:block">
    <p class="intro-text"><strong>${escapeHtml(t.tgTitle)}</strong></p>
    <a href="/guides/transport${langSuffix}" class="plan-visit-option plan-visit-ticket">${escapeHtml(t.tgTransport)}</a>
    <a href="/guides/parking${langSuffix}" class="plan-visit-option plan-visit-parking">${escapeHtml(t.tgParking)}</a>
    <a href="/guides/restaurants${langSuffix}" class="plan-visit-option plan-visit-parking-alt">${escapeHtml(t.tgRestaurant)}</a>
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
    <div class="brand-stack"><a class="brand" href="/">Opening<span>HoursToday</span></a><a class="guides-link" href="/guides${langSuffix}">${navLabelsFor(activeLang).guides} →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">${escapeHtml(t.home)}</a> / <a href="/guides${langSuffix}">${escapeHtml(t.guidesTitle)}</a> / ${escapeHtml(guide.title)}</p>

  <h1 class="page-h1">${escapeHtml(guide.title)}</h1>
  <p class="intro-text">${escapeHtml(guide.intro)}</p>

  ${guide.body}

  <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.otherGuides)}</h2>
  <ul class="mall-list">${otherGuides}</ul>

  <footer>
    <p><strong>Opening Hours Today</strong> — ${escapeHtml(t.footer)}</p>
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
    <div class="brand-stack"><a class="brand" href="/">Opening<span>HoursToday</span></a><a class="guides-link" href="/guides${langSuffix}">${navLabelsFor(activeLang).guides} →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">${escapeHtml(t.home)}</a> / ${escapeHtml(t.guidesTitle)}</p>
  <h1 class="page-h1">${escapeHtml(t.guidesTitle)}</h1>
  <p class="intro-text">${escapeHtml(t.guidesDesc)}</p>
  <ul class="mall-list">${items}</ul>
  <footer>
    <p><strong>Opening Hours Today</strong> — ${escapeHtml(t.footer)}</p>
  </footer>
</main>`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: activeLang });
}


async function renderAttractionPageRO({ attraction, baseUrl, nonce, userAgent, ip }) {
  const slug = toDbSlug(attraction.name);
  // displayName — DOAR pentru text vizibil (titlu, breadcrumb, footer);
  // attraction.name original rămâne folosit la slug, căutare Google,
  // detectare oraș etc. — vezi dedupeTrailingCityName mai sus.
  const displayName = dedupeTrailingCityName(attraction.name);
  const title = `${displayName} — Program și Bilete`;
  const description = `Vezi programul actualizat și rezervă bilete online pentru ${displayName}.`;
  const canonical = `${baseUrl}/obiectiv/${slug}`;

  const live = await tryGetLiveStatus(slug, "ro", "attraction", isBotRequest(userAgent), ip);
  const voteCount = await getAttractionVoteCount(slug);
  const isPopular = voteCount >= VOTE_POPULAR_THRESHOLD;
  const isBeach = attraction.category === "plaje_organizate" || attraction.category === "plaje_salbatice";
  const beachWinningTags = isBeach ? await getBeachWinningTags(slug) : [];

  let statusHtml;
  let widgetHtml = "";
  let widgetScriptHtml = "";
  if (isFreeAccessAttraction(attraction.name)) {
    const seasonalHtml = needsSeasonalWarning(attraction.name)
      ? `<p class="plan-visit-hint" style="margin-top:8px">${escapeHtml(seasonalWarningLabelFor("ro"))}</p>`
      : "";
    statusHtml = `<div class="geo-country-highlight">${escapeHtml(freeAccessLabelFor("ro"))}</div>${seasonalHtml}
    ${live ? contactInfoHtml(live) : ""}`;
  } else if (live && live.isOpenNow !== null) {
    const specialBanner = live.isSpecialDay && isRealRomanianHolidayToday(live.utcOffsetMinutes)
      ? `<div class="geo-country-highlight">📅 Azi e sărbătoare legală — verifică programul de mai jos, actualizat live.</div>`
      : "";
    const weeklyHtml = live.weeklyScheduleText.length
      ? `<div class="holiday-card">${live.weeklyScheduleText.map((line) => `<div class="holiday-row"><span class="holiday-label">${escapeHtml(line)}</span></div>`).join("")}</div>`
      : "";
    statusHtml = `
    <div class="status-card ${live.isOpenNow ? "is-open" : "is-closed"}" id="statusCard">
      <div class="store-name">${escapeHtml(displayName)}</div>
      <div class="status-text">${live.isOpenNow ? "DESCHIS ACUM" : "ÎNCHIS ACUM"}</div>
      <div class="status-sub">Date live, direct de la Google · actualizate la fiecare 12 ore</div>
      <div class="status-badge"><span class="dotw"></span><span id="statusBadge">Azi</span></div>
    </div>
    ${contactInfoHtml(live)}
    ${specialBanner}
    <h2 class="section-title"><span class="bar"></span>Program săptămânal (live, de la Google)</h2>
    ${weeklyHtml}`;
    // widget contextual DOAR când chiar știm dacă e deschis/închis (date live)
    // — fără date live, nu putem oferi alternative "inteligente", onest
    widgetHtml = buildContextualWidgetHtml({ type: "attraction", name: attraction.name, orasDisplay: null });
    widgetScriptHtml = buildContextualWidgetScript(nonce);
  } else {
    // Program GENERIC, pe categorie — DOAR dacă avem unul definit pentru
    // categoria acestui obiectiv (vezi CATEGORY_GENERIC_SCHEDULE) — restul
    // categoriilor rămân pe mesajul simplu, cu link.
    const genericSchedule = genericScheduleForCategory(attraction.category);
    if (genericSchedule) {
      const isOpenGeneric = computeGenericIsOpenNow(genericSchedule);
      statusHtml = `
    <div class="status-card ${isOpenGeneric ? "is-open" : "is-closed"}" id="statusCard">
      <div class="store-name">${escapeHtml(displayName)}</div>
      <div class="status-text">${isOpenGeneric ? "DESCHIS ACUM" : "ÎNCHIS ACUM"}</div>
      <div class="status-sub">${escapeHtml(estimatedScheduleLabelFor("ro"))}</div>
    </div>
    <p class="plan-visit-hint">${escapeHtml(liveComingSoonLabelFor("ro"))}</p>
    ${live ? contactInfoHtml(live) : ""}`;
    } else {
      // Nu avem orarul (Google nu-l are postat pentru acest loc — frecvent la
      // obiective mici, din sate) — dar dacă tot am reușit să găsim locul pe
      // Google, adresa și telefonul sunt utile oricum. NU le mai aruncăm doar
      // pentru că lipsește orarul, exact ca la magazine.
      statusHtml = `<div class="geo-country-highlight">ℹ️ Nu avem încă program live pentru acest obiectiv. Verifică programul actualizat pe <a href="${escapeHtml(attraction.url)}" target="_blank" rel="noopener">site-ul oficial</a>.</div>
    <p class="plan-visit-hint">${escapeHtml(liveComingSoonLabelFor("ro"))}</p>
    ${live ? contactInfoHtml(live) : ""}`;
    }
  }

  // biletul e acum mereu în "Planifică vizita" (buildBookingPlanningButtonsHtml)
  // — nu mai are nevoie de un fallback separat aici
  const schemaHtml = buildTouristAttractionSchema({ name: attraction.name, officialUrl: attraction.url, live });

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Programul<span>DeAzi</span></a><a class="guides-link" href="/ghiduri">Ghiduri →</a><a class="guides-link itin-nav-link" href="/itinerar">Itinerar →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">Acasă</a> / ${escapeHtml(displayName)}</p>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}

  ${statusHtml}
  ${buildVoteWidgetHtml(slug, voteCount, isPopular, "ro")}
  ${isBeach ? buildBeachTagsWidgetHtml(slug, beachWinningTags, "ro") : ""}
  ${widgetHtml}

  ${buildBookingPlanningButtonsHtml({ name: attraction.name, city: detectAttractionCity(attraction.name, "ro"), countryCode: "ro", lang: "ro", hideTicket: isFreeAccessAttraction(attraction.name), accessDifficulty: attraction.accessDifficulty })}
  ${buildHowToGetThereHtml(HOW_TO_GET_THERE_LABELS_RO, attraction.name)}
  ${buildTravelGuidesBoxHtml()}

  <p class="disclaimer">Informațiile despre ${escapeHtml(displayName)} sunt orientative. Pentru detalii complete, verifică <a href="${escapeHtml(attraction.url)}" target="_blank" rel="noopener">site-ul oficial</a>.</p>

  <footer>
    <p><strong>Programul de Azi</strong> îți arată dacă ${escapeHtml(displayName)} este deschis chiar acum, plus acces rapid la bilete online.</p>
  </footer>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}
</main>
${schemaHtml}
${widgetScriptHtml}
${buildVoteWidgetScript(nonce)}
${buildBeachTagsWidgetScript(nonce)}
${buildHowToGetThereScript(nonce)}
${buildPlanVisitScript(nonce)}`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: "ro" });
}

// Pagină de obiectiv turistic — INTERNAȚIONAL — aceeași logică, adaptată
// la limbă (traduceri deja existente, TRANSLATIONS)
async function renderAttractionPageIntl({ attraction, countryCode, lang, baseUrl, nonce, userAgent, ip }) {
  const t = (lang && TRANSLATIONS[lang]) || COUNTRIES[countryCode].t;
  const activeLang = (lang && TRANSLATIONS[lang]) ? lang : Object.keys(TRANSLATIONS).find((k) => TRANSLATIONS[k] === COUNTRIES[countryCode].t) || "uk";
  const slug = toDbSlug(attraction.name);
  // displayName — DOAR pentru text vizibil (titlu, H1, breadcrumb, footer).
  // attraction.name (original) rămâne folosit la slug (URL-ul trebuie să fie
  // identic indiferent de limbă) și la linkuri de căutare externă
  // (Booking.com, hartă) — traducerea mecanică a prefixului ar putea strica
  // potrivirea căutării pe alte site-uri, care așteaptă numele real.
  const displayName = translateAttractionName(attraction.name, activeLang);
  const title = `${displayName} — Opening Hours Today`;
  const description = `${displayName} — check today's opening hours and book tickets online.`;
  const canonical = `${baseUrl}/${countryCode}/obiectiv/${slug}`;

  const googleLang = toGoogleLang(activeLang);
  const live = await tryGetLiveStatus(slug, googleLang, "attraction", isBotRequest(userAgent), ip);
  const voteCount = await getAttractionVoteCount(slug);
  const isPopular = voteCount >= VOTE_POPULAR_THRESHOLD;
  const isBeach = attraction.category === "plaje_organizate" || attraction.category === "plaje_salbatice";
  const beachWinningTags = isBeach ? await getBeachWinningTags(slug) : [];
  const beachTagCounts = isBeach ? await getBeachTagCounts(slug) : {};
  // Conținut editorial bogat — DOAR română momentan (conținutul original,
  // scris de proprietar, există doar în RO).
  const beachContent = isBeach ? getBeachContentForLang(attraction.name, activeLang) : null;

  let statusHtml;
  let widgetHtml = "";
  let widgetScriptHtml = "";
  if (live && live.isOpenNow !== null) {
    // Date LIVE reale (Google) — le păstrăm, indiferent dacă e plajă sau nu;
    // doar programul GENERIC (estimat) e cel eliminat la plaje, mai jos.
    const weeklyHtml = live.weeklyScheduleText.length
      ? `<div class="holiday-card">${live.weeklyScheduleText.map((line) => `<div class="holiday-row"><span class="holiday-label">${escapeHtml(line)}</span></div>`).join("")}</div>`
      : "";
    statusHtml = `
    <div class="status-card ${live.isOpenNow ? "is-open" : "is-closed"}" id="statusCard">
      <div class="store-name">${escapeHtml(displayName)}</div>
      <div class="status-text">${live.isOpenNow ? escapeHtml(t.labels.openNow) : escapeHtml(t.labels.closedNow)}</div>
      <div class="status-sub">${escapeHtml(liveGoogleLabelFor(activeLang))}</div>
      <div class="status-badge"><span class="dotw"></span><span id="statusBadge">${escapeHtml(t.todayLabel)}</span></div>
    </div>
    ${contactInfoHtml(live)}
    <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.weeklyTitle)} (live, Google)</h2>
    ${weeklyHtml}`;
    widgetHtml = buildContextualWidgetHtml({ type: "attraction", name: attraction.name, orasDisplay: null, labels: contextualWidgetLabelsFor(activeLang) });
    widgetScriptHtml = buildContextualWidgetScript(nonce);
  } else if (isBeach) {
    // Cerut explicit: NU program generic la plaje — nu au program fix real,
    // iar "estimarea" ar induce în eroare. Cardul de voturi (mai jos)
    // înlocuiește complet zona de status/program.
    statusHtml = "";
  } else if (isFreeAccessAttraction(attraction.name)) {
    const seasonalHtml = needsSeasonalWarning(attraction.name)
      ? `<p class="plan-visit-hint" style="margin-top:8px">${escapeHtml(seasonalWarningLabelFor(activeLang))}</p>`
      : "";
    statusHtml = `<div class="geo-country-highlight">${escapeHtml(freeAccessLabelFor(activeLang))}</div>${seasonalHtml}
    ${live ? contactInfoHtml(live) : ""}`;
  } else {
    // Program GENERIC, pe categorie — vezi comentariul echivalent din
    // renderAttractionPageRO, aceeași logică, adaptată pe limbă.
    const genericSchedule = genericScheduleForCategory(attraction.category);
    if (genericSchedule) {
      const isOpenGeneric = computeGenericIsOpenNow(genericSchedule);
      statusHtml = `
    <div class="status-card ${isOpenGeneric ? "is-open" : "is-closed"}" id="statusCard">
      <div class="store-name">${escapeHtml(displayName)}</div>
      <div class="status-text">${isOpenGeneric ? escapeHtml(t.labels.openNow) : escapeHtml(t.labels.closedNow)}</div>
      <div class="status-sub">${escapeHtml(estimatedScheduleLabelFor(activeLang))}</div>
    </div>
    <p class="plan-visit-hint">${escapeHtml(liveComingSoonLabelFor(activeLang))}</p>
    ${live ? contactInfoHtml(live) : ""}`;
    } else {
      statusHtml = `<div class="geo-country-highlight">${noLiveDataTextFor(activeLang, escapeHtml(attraction.url))}</div>
    <p class="plan-visit-hint">${escapeHtml(liveComingSoonLabelFor(activeLang))}</p>
    ${live ? contactInfoHtml(live) : ""}`;
    }
  }

  // biletul e acum mereu în "Plan your visit" (buildBookingPlanningButtonsHtml)
  const schemaHtml = buildTouristAttractionSchema({ name: attraction.name, officialUrl: attraction.url, live });

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Opening<span>HoursToday</span></a><a class="guides-link" href="/guides">${navLabelsFor(activeLang).guides} →</a><a class="guides-link itin-nav-link" href="${itineraryHrefFor(countryCode, activeLang)}">${navLabelsFor(activeLang).itinerary} →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">${escapeHtml(t.home)}</a> / ${escapeHtml(displayName)}</p>
  ${beachContent ? buildBeachContentIntroHtml(beachContent, activeLang) : ""}
  ${isBeach
    ? (buildBeachContentEquipmentHtml(beachContent, activeLang) || buildBeachMonetizationHtml(activeLang))
    : `<div class="search-box-wrap">
    <input type="text" id="siteSearchInput" class="city-search-input" placeholder="${escapeHtml(t.searchPlaceholder || "Search a store or attraction...")}" autocomplete="off">
    <div id="siteSearchResults" class="search-results"></div>
  </div>`}

  ${statusHtml}
  ${isBeach ? buildBeachVoteCentralizationHtml(slug, beachTagCounts, activeLang) : buildVoteWidgetHtml(slug, voteCount, isPopular, activeLang)}
  ${beachContent ? buildBeachContentRestHtml(beachContent, activeLang) : ""}
  ${widgetHtml}

  ${buildBookingPlanningButtonsHtml({ name: attraction.name, city: detectAttractionCity(attraction.name, countryCode), labels: bookingPlanningLabelsFor(activeLang, isBeach), countryCode, lang: activeLang, lat: live && live.lat, lng: live && live.lng, hideTicket: isFreeAccessAttraction(attraction.name) || isBeach, accessDifficulty: attraction.accessDifficulty, isBeach })}
  ${buildHowToGetThereHtml(howToGetThereLabelsFor(activeLang), attraction.name, { isBeach, accessDifficulty: attraction.accessDifficulty, city: isBeach ? attraction.city : detectAttractionCity(attraction.name, countryCode), name: attraction.name, lang: activeLang })}
  ${buildTravelGuidesBoxHtmlIntl(activeLang)}

  <footer>
    <p><strong>Opening Hours Today</strong> ${attractionFooterTextFor(activeLang, escapeHtml(displayName))}</p>
  </footer>
</main>
${schemaHtml}
${widgetScriptHtml}
${buildVoteWidgetScript(nonce)}
${buildBeachVoteCentralizationScript(nonce)}
${buildHowToGetThereScript(nonce)}
${buildPlanVisitScript(nonce)}
${buildSearchAndFavoritesScript(nonce, [], "oht_favorites_v1", activeLang, countryCode)}`;

  return pageShell({
    title,
    description,
    canonical,
    bodyHtml,
    dataForClient: { type: "general", weekly: [], holidays: [] },
    nonce,
    langCode: activeLang,
  });
}

// Pagină onestă pentru orașe pe care NU le acoperim real — nu un 404 rece,
// dar nici o pagină falsă cu branduri inventate. Status HTTP 404 real
// (corect pentru motoarele de căutare), conținut prietenos (util pentru om).
// Pagină onestă pentru un brand SELECTIV (Metro, Selgros, IKEA) cerut
// într-un oraș unde nu are confirmat un magazin — diferită de "oraș
// necunoscut", pentru că orașul chiar există, doar brandul nu e acolo
function renderBrandNotInCityPage({ magazinDisplay, orasDisplay, magazinKey, baseUrl, nonce }) {
  const allowedCities = SELECTIVE_BRAND_CITIES[magazinKey] || [];
  const requestedCoords = CITY_COORDS[orasDisplay];
  let nearest = null;
  if (requestedCoords) {
    let bestDist = Infinity;
    allowedCities.forEach((c) => {
      const coords = CITY_COORDS[c];
      if (!coords) return;
      const dist = haversineKm(requestedCoords[0], requestedCoords[1], coords[0], coords[1]);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = { city: c, distanceKm: Math.round(dist) };
      }
    });
  }

  const title = `${magazinDisplay} ${orasDisplay} — nu există aici`;
  const description = nearest
    ? `${magazinDisplay} nu are magazin în ${orasDisplay}. Cel mai apropiat e în ${nearest.city}.`
    : `${magazinDisplay} nu are un magazin confirmat în ${orasDisplay}.`;
  const canonical = `${baseUrl}/${slugifyCityName(orasDisplay)}/${magazinKey}`;
  const allowedListHtml = allowedCities.map((c) => `<li><a href="/${slugifyCityName(c)}/${magazinKey}">${escapeHtml(magazinDisplay)} ${escapeHtml(c)}</a></li>`).join("");

  const nearestBlockHtml = nearest
    ? `<div class="geo-country-highlight">ℹ️ Acest magazin nu există în <strong>${escapeHtml(orasDisplay)}</strong>, dar există în <strong>${escapeHtml(nearest.city)}</strong> (~${nearest.distanceKm} km).</div>
       <a href="${escapeHtml(wazeLinkFor(`${magazinDisplay} ${nearest.city}`))}" target="_blank" rel="noopener" class="go-now-btn is-open">🚗 Mergi acolo (Waze)</a>
       <a href="/${slugifyCityName(nearest.city)}/${magazinKey}" class="accordion-status-link">🕐 Vezi programul ${escapeHtml(magazinDisplay)} ${escapeHtml(nearest.city)} →</a>`
    : `<div class="geo-country-highlight">ℹ️ Nu avem confirmat niciun magazin ${escapeHtml(magazinDisplay)} în <strong>${escapeHtml(orasDisplay)}</strong>.</div>`;

  // pagina asta n-a arătat NICIODATĂ vreun buton/carusel de afiliere — nefiind
  // programul unui magazin real, cade direct pe fallback-ul generic (cele 13
  // magazine partenere), la fel ca orice brand fără link propriu, ca traficul
  // să nu rămână nemonetizat doar pentru că orașul cerut n-are acest brand.
  const { html: brandNotInCityAffiliateHtml, scriptHtml: brandNotInCityAffiliateScriptHtml } = buildGenericAffiliateCarouselHtml(nonce);

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Programul<span>DeAzi</span></a><a class="guides-link" href="/ghiduri">Ghiduri →</a><a class="guides-link itin-nav-link" href="/itinerar">Itinerar →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">Acasă</a> / <a href="/${slugifyCityName(orasDisplay)}">${escapeHtml(orasDisplay)}</a> / ${escapeHtml(magazinDisplay)}</p>
  ${nearestBlockHtml}

  ${brandNotInCityAffiliateHtml}

  <h2 class="section-title"><span class="bar"></span>${escapeHtml(magazinDisplay)} — toate orașele confirmate</h2>
  <ul class="mall-list">${allowedListHtml}</ul>

  <footer>
    <p><strong>Programul de Azi</strong> arată doar branduri cu prezență reală, verificată, în fiecare oraș.</p>
  </footer>
</main>
${brandNotInCityAffiliateScriptHtml}`;

  return pageShell({
    title,
    description,
    canonical,
    bodyHtml,
    dataForClient: { type: "general", weekly: [], holidays: [] },
    nonce,
    langCode: "ro",
  });
}

function renderCityNotCoveredPage({ orasDisplay, nearest, baseUrl, nonce }) {
  const title = `${orasDisplay} — Încă nu avem date verificate`;
  const description = `Nu avem încă informații verificate despre magazine în ${orasDisplay}. Vezi lista completă de orașe acoperite.`;
  const canonical = `${baseUrl}/${slugifyCityName(orasDisplay)}`;
  const allCitiesListHtml = SITEMAP_CITIES.map((c) => `<li><a href="/${slugifyCityName(c)}">${escapeHtml(c)}</a></li>`).join("");
  const nearestHtml = nearest
    ? `<div class="geo-country-highlight">📍 Cel mai apropiat oraș pe care-l acoperim e <strong>${escapeHtml(nearest.city)}</strong> (~${nearest.distanceKm} km) — <a href="/${slugifyCityName(nearest.city)}">vezi programul acolo →</a></div>`
    : "";

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Programul<span>DeAzi</span></a><a class="guides-link" href="/ghiduri">Ghiduri →</a><a class="guides-link itin-nav-link" href="/itinerar">Itinerar →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">Acasă</a> / ${escapeHtml(orasDisplay)}</p>
  <div class="geo-country-highlight">ℹ️ Încă nu avem date verificate despre magazine în <strong>${escapeHtml(orasDisplay)}</strong>. Deocamdată acoperim orașele mari din România — nu afișăm informații despre localități pe care nu le-am verificat real, ca să nu-ți arătăm branduri care poate nici nu există acolo.</div>
  ${nearestHtml}

  <h2 class="section-title"><span class="bar"></span>Orașe acoperite</h2>
  <ul class="mall-list">${allCitiesListHtml}</ul>

  <footer>
    <p><strong>Programul de Azi</strong> extinde treptat lista de orașe acoperite — verificăm real prezența fiecărui brand înainte să-l adăugăm, nu presupunem.</p>
  </footer>
</main>`;

  return pageShell({
    title,
    description,
    canonical,
    bodyHtml,
    dataForClient: { type: "general", weekly: [], holidays: [] },
    nonce,
    langCode: "ro",
  });
}

function renderHomePage(nonce, suggestedCity, baseUrl) {
  const title = `${SITE_NAME} — Este magazinul deschis acum?`;
  const description = "Vezi instant dacă Lidl, Kaufland, Penny, Mega Image, Carrefour, Auchan sau mall-ul din orașul tău sunt deschise chiar acum, plus programul complet pe zile și de sărbători.";
  const canonical = `${baseUrl}/`;

  // toate cele 41 de orașe, ca listă completă, cu id pentru filtrare live
  const allCitiesListHtml = SITEMAP_CITIES.map((c) => `<li><a href="/${slugifyCityName(c)}">${escapeHtml(c)}</a></li>`).join("");
  const POPULAR_RO_CITIES = ["București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Brașov", "Craiova", "Sibiu"];
  const citySelectorHtml = buildCitySelectorHtml({ popularCities: POPULAR_RO_CITIES, hrefPrefix: "/" });

  // obiective turistice românești — nume + link, cu steluță de favorite,
  // exact ca pe opening-hours-today.eu, dar în română, fără să te trimită
  // pe alt domeniu ca să le vezi
  const attractionItemsHtml = buildAttractionListForCountry(ATTRACTIONS.ro, "ro", false, "ro");

  // Sugestie pe baza IP-ului — NU redirect forțat. Pe rețele mobile din România,
  // IP-ul apare adesea "din București" indiferent de orașul real al vizitatorului,
  // așa că îi lăsăm mereu alegerea, vizibilă chiar sub sugestie.
  const geoSuggestionHtml = suggestedCity
    ? `<div class="geo-country-highlight">📍 Se pare că ești în <strong>${escapeHtml(suggestedCity.display)}</strong> — <a href="/${suggestedCity.slug}">vezi programul →</a>. Nu e orașul tău? Alege mai jos.</div>`
    : "";

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Programul<span>DeAzi</span></a><a class="guides-link" href="/ghiduri">Ghiduri →</a><a class="guides-link itin-nav-link" href="/itinerar">Itinerar →</a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">

  ${pushEnabled ? `<button type="button" id="pushSubBtn" class="push-sub-btn">🔔 Abonează-te la notificări (sărbători, program special)</button>` : ""}

  <h1 class="page-h1">Este magazinul deschis acum?</h1>
  <p class="intro-text">Alege mai jos ce cauți — magazine, obiective turistice sau favoritele tale — sau caută direct.</p>
  ${geoSuggestionHtml}

  <nav class="sub-nav-tabs">
    <button type="button" class="sub-nav-tab active" data-tab="stores">🛒 Magazine și Servicii</button>
    <button type="button" class="sub-nav-tab" data-tab="attractions">🏰 Obiective turistice</button>
    <button type="button" class="sub-nav-tab" data-tab="favorites">⭐ Favorite</button>
  </nav>

  <div class="search-box-wrap">
    <input type="text" id="siteSearchInput" class="city-search-input" placeholder="Caută (ex: Castelul Bran, Lidl)..." autocomplete="off">
    <div id="siteSearchResults" class="search-results"></div>
  </div>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}

  <div class="sub-nav-panel active" data-panel="stores">
    <form id="citySearchForm" class="city-search-form" autocomplete="off">
      <input type="text" id="citySearchInput" list="cityListOptions" class="city-search-input" placeholder="Scrie orașul tău (ex: Cluj-Napoca)">
      <datalist id="cityListOptions">${SITEMAP_CITIES.map((c) => `<option value="${escapeHtml(c)}"></option>`).join("")}</datalist>
      <button type="submit" class="city-search-btn">Caută</button>
    </form>
    <button type="button" id="geoBtn" class="geo-btn">📍 sau detectează orașul meu automat</button>
    <p id="geoStatus" class="geo-status" style="display:none"></p>

    <h2 class="section-title"><span class="bar"></span>Alege orașul</h2>
    ${citySelectorHtml}
    <ul class="mall-list" id="allCitiesList" hidden>${allCitiesListHtml}</ul>
  </div>

  <div class="sub-nav-panel" data-panel="attractions">
    ${buildItineraryPromoCardHtml("ro", "ro")}
    <label class="map-live-toggle attraction-list-open-toggle"><input type="checkbox" id="attractionListOpenOnlyToggle"> Doar obiectivele deschise acum</label>
    ${buildNoResultsItineraryPromoHtml("noResultsAttractionItinPromo", "ro", "ro")}
    <p class="intro-text">Castele, cetăți, muzee și parcuri — link direct spre informații reale, actualizate. Apasă ☆ ca să salvezi unul la favorite.</p>
    <div class="attraction-accordion-wrap">${attractionItemsHtml}</div>
  </div>

  <div class="sub-nav-panel" data-panel="favorites">
    <h2 class="section-title"><span class="bar"></span>⭐ Favoritele mele</h2>
    <p class="intro-text">Planifici o excursie? Apasă ☆ pe orice magazin sau obiectiv — de exemplu 3 castele pe care vrei să le vizitezi — și le găsești pe toate aici, gata, fără să mai cauți din nou.</p>
    <div id="favoritesList"></div>
  </div>

  <footer>
    <p><strong>Programul de Azi</strong> îți arată în timp real dacă Lidl, Kaufland, Penny, Mega Image, Carrefour, Auchan sau mall-urile sunt deschise chiar acum, în orice oraș din România.</p>
    <p class="footer-intl-link">✈️ Pleci în străinătate? Vezi programul magazinelor și obiectivelor turistice din toată Europa cu un singur click pe <a href="https://${INTL_DOMAIN}/">opening-hours-today.eu</a> — poți să-ți salvezi acolo o listă de „favorite" pentru călătorie.</p>
  </footer>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}
</main>
${buildTabsScript(nonce)}
${buildCitySearchScript(nonce)}
${buildGeoScript(nonce)}
${buildSearchAndFavoritesScript(nonce, buildSearchIndexRO(), "poa_favorites_v1", "ro")}
${buildAttractionListFilterScript(nonce)}
${buildAttractionAccordionScript(nonce)}
${pushEnabled ? buildPushSubscribeScript(nonce, VAPID_PUBLIC_KEY, "🔔 Abonează-te la notificări (sărbători, program special)", "🔕 Dezabonează-te de la notificări") : ""}`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: "ro" });
}

/* ============================================================
   6) SITEMAP — generat automat din orașe × branduri + mall-uri
   ============================================================ */

// cele mai mari 30 de orașe din România (nume complete, cu diacritice —
// slug-ul din URL se derivă automat mai jos, cu slugifyCityName)
;

// România adăugată în registrul internațional (site-ul .eu) — reutilizează
// EXACT aceleași date reale, deja verificate (STORE_CONFIG, toate cele 41
// orașe). Include acum și mall-uri/cinematografe — renderIntlStorePage a
// fost extinsă să le suporte, cu structura lor completă de date.
const RO_INTL_STORE_CONFIG = {};
Object.keys(STORE_CONFIG).forEach((key) => {
  const cfg = STORE_CONFIG[key];
  if (cfg.type === "mall") {
    RO_INTL_STORE_CONFIG[key] = { name: cfg.name, slug: cfg.slug, type: "mall", zones: cfg.zones, categorie: cfg.categorie };
  } else if (cfg.type === "cinema") {
    RO_INTL_STORE_CONFIG[key] = { name: cfg.name, slug: cfg.slug, type: "cinema", ticketUrl: cfg.ticketUrl, weekly: cfg.weekly, holidays: cfg.holidays, categorie: cfg.categorie };
  } else {
    RO_INTL_STORE_CONFIG[key] = { name: cfg.name, slug: cfg.slug, weekly: cfg.weekly, holidays: cfg.holidays, categorie: cfg.categorie };
  }
});
COUNTRIES.ro = {
  config: RO_INTL_STORE_CONFIG,
  t: TRANSLATIONS.uk, // implicit engleză pe site-ul internațional — vezi mai jos comutatorul de limbă
  cities: SITEMAP_CITIES,
};

// brandurile combinate cu fiecare oraș de mai sus (slug-uri identice cu STORE_CONFIG/STORE_ALIASES)
const SITEMAP_BRANDS = [
  "lidl", "kaufland", "penny", "mega-image", "carrefour", "auchan",
  "profi", "metro", "selgros", "dedeman", "leroy-merlin", "brico-depot",
  "hornbach", "jysk", "ikea", "altex", "flanco", "dm", "dr-max", "farmacia-tei",
  "remedia", "spring-pharma", "catena", "sensiblu", "help-net", "dona", "ropharma",
  "mr-bricolage", "cinema-city", "cineplexx", "happy-cinema", "movie-plex",
  "bcr", "brd", "ing", "raiffeisen", "banca-transilvania", "cec", "posta",
  "mcdonalds", "kfc", "burger-king", "fan-courier", "cargus", "sameday", "dpd", "gls",
];

// cele mai căutate 10 mall-uri — NU se combină cu toate cele 30 de orașe
// (fiecare mall există într-un singur oraș anume, spre deosebire de branduri)
const SITEMAP_MALLS = [
  { slug: "afi-cotroceni", city: "București" },
  { slug: "baneasa-shopping-city", city: "București" },
  { slug: "mega-mall", city: "București" },
  { slug: "promenada", city: "București" },
  { slug: "sun-plaza", city: "București" },
  { slug: "parklake", city: "București" },
  { slug: "iulius-mall-cluj", city: "Cluj-Napoca" },
  { slug: "vivo-cluj", city: "Cluj-Napoca" },
  { slug: "iulius-mall-timisoara", city: "Timișoara" },
  { slug: "palas-iasi", city: "Iași" },
];

// transformă un nume de oraș ("Târgu Mureș") în slug-ul folosit deja în rute ("targu-mures")
// Coordonate reale (centrul orașului) — folosite doar pentru harta
// interactivă a paginii de oraș. NU sunt locații exacte de magazine (nu
// avem adrese per sucursală) — un singur marker pentru oraș, nu pin-uri
// false "per magazin". Pentru locația exactă a unui brand anume, link-urile
// din pagină duc spre căutarea reală Google Maps.
;

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

// Vercel oferă uneori exonime în engleză pentru orașe mari (ex: "Bucharest" în loc
// de "București") — le mapăm explicit la slug-ul nostru canonic
const GEO_CITY_ALIASES = {
  bucharest: "bucuresti",
};

// headerele x-vercel-ip-* vin URL-encodate (pot conține spații/diacritice)
function decodeGeoHeader(raw) {
  try {
    return decodeURIComponent(raw);
  } catch (e) {
    return raw;
  }
}

// validează orașul detectat din IP împotriva listei cunoscute; returnează slug-ul
// sau null dacă nu-l putem recunoaște cu încredere (mai bine arătăm homepage-ul
// decât să trimitem vizitatorul către un oraș greșit)
function resolveGeoCitySlug(cityName) {
  if (!cityName) return null;
  const slug = slugifyCityName(cityName);
  if (KNOWN_CITY_SLUGS.has(slug)) return slug;
  if (GEO_CITY_ALIASES[slug]) return GEO_CITY_ALIASES[slug];
  return null;
}

function generateSitemapXml(baseUrl, includeIntl) {
  const base = baseUrl;
  const urls = [`${base}/`];

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

/* ============================================================
   7) RUTE
   ============================================================ */

// evită ca cereri de tip /favicon.ico, /robots.txt etc. să fie tratate ca nume de oraș
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Abonare la notificări push — primește obiectul PushSubscription generat
// de browser (endpoint + chei de criptare) și îl salvează în bază.
// "Silent" la orice eroare de business (deja abonat etc.) — răspunde 200
// oricum, ca frontend-ul să nu tot repete cererea la nesfârșit.
// Statusul live + coordonatele reale ale TUTUROR magazinelor dintr-un
// oraș, pentru harta cu pinuri (nu doar centrul orașului). Cereri în
// paralel, ca să nu aștepți 48 de răspunsuri unul după altul — dar tot
// costă real, către Google, la fiecare vizitare după expirarea cache-ului
// de 12h (decizie asumată explicit, nu ascunsă).
// Raportare comunitară — "program greșit", văzută pe pagina unui magazin.
// Validare simplă (motiv dintr-o listă fixă, notă limitată la 500 caractere)
// — nu construim un sistem de moderare/rate-limit complet acum, doar
// captăm datele corect, ca să le poți vedea și rezolva manual, în bază.
const ALLOWED_REPORT_REASONS = ["confirmat_deschis", "program_gresit", "inchis_definitiv"];

// Salt fix pentru hash-ul de IP — NU e un secret critic (scopul e doar
// să nu poți face un tabel invers direct din hash-uri cunoscute de IP-uri
// comune, nu să reziste unui atac dedicat); poate veni și din variabilă de
// mediu, dacă vrei unul propriu, altfel merge cu cel implicit
const REPORT_IP_SALT = process.env.REPORT_IP_SALT || "programul-de-azi-report-salt-implicit";
function hashIp(ip) {
  return crypto.createHash("sha256").update(REPORT_IP_SALT + "|" + ip).digest("hex");
}
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
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

app.post("/api/report-issue", async (req, res) => {
  if (!dbPool) {
    res.status(503).json({ error: "not_configured" });
    return;
  }
  const { slug, numeLocatie, oras, motiv, nota } = req.body || {};
  if (!slug || typeof slug !== "string" || !ALLOWED_REPORT_REASONS.includes(motiv)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  const safeNota = typeof nota === "string" ? nota.slice(0, 500) : null;
  const ipHash = hashIp(getClientIp(req));

  // protecție SEPARATĂ, generală — dincolo de limita per-locație (24h) de
  // mai jos, care nu oprește pe cineva ce raportează 100 de locații
  // DIFERITE, rapid; asta limitează volumul total, indiferent de locație
  const rateOk = await checkRateLimit(ipHash, "report-issue", 20, 60);
  if (!rateOk) {
    res.status(429).json({ error: "too_many_requests" });
    return;
  }
  const safeSlug = slug.slice(0, 255);
  try {
    // aceeași sursă (IP anonimizat), aceeași locație, în ultimele 24h —
    // nu mai înregistrăm din nou, dar tot răspundem prietenos, nu cu eroare
    const { rows: recent } = await dbPool.query(
      `SELECT 1 FROM location_reports WHERE slug = $1 AND ip_hash = $2 AND creat_la > now() - interval '24 hours' LIMIT 1`,
      [safeSlug, ipHash]
    );
    if (recent.length > 0) {
      res.status(200).json({ ok: true, alreadyReported: true });
      return;
    }

    await dbPool.query(
      `INSERT INTO location_reports (slug, nume_locatie, oras, motiv, nota, ip_hash) VALUES ($1, $2, $3, $4, $5, $6)`,
      [safeSlug, (numeLocatie || "").slice(0, 255), (oras || "").slice(0, 255), motiv, safeNota, ipHash]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("report-issue a eșuat:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

// Vot anonim, tăcut — cerut explicit: un singur click, fără text, fără
// moderare. Protecție anti-abuz în 2 straturi: (1) UNIQUE(slug, ip_hash) în
// bază — un IP nu poate vota de două ori pe ACELAȘI obiectiv, aplicat la
// nivel de bază de date, nu doar în cod (mai sigur); (2) limitare de rată
// generală, ca la raportare — un IP nu poate vota masiv, pe sute de
// obiective diferite, rapid.
app.post("/api/vote-attraction", async (req, res) => {
  if (!dbPool) {
    res.status(503).json({ error: "not_configured" });
    return;
  }
  const { slug } = req.body || {};
  if (typeof slug !== "string" || !slug || slug.length > 255) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  const ipHash = hashIp(getClientIp(req));
  const rateOk = await checkRateLimit(ipHash, "vote-attraction", 30, 60);
  if (!rateOk) {
    res.status(429).json({ error: "too_many_requests" });
    return;
  }
  try {
    await dbPool.query(
      `INSERT INTO attraction_votes (slug, ip_hash) VALUES ($1, $2) ON CONFLICT (slug, ip_hash) DO NOTHING`,
      [slug, ipHash]
    );
    const count = await getAttractionVoteCount(slug);
    res.status(200).json({ ok: true, count, isPopular: count >= VOTE_POPULAR_THRESHOLD });
  } catch (err) {
    console.error("vote-attraction a eșuat:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

// Vot pe etichete comunitare pentru PLAJE — aceeași protecție ca la votul
// general: UNIQUE(slug, tag, ip_hash) în bază + limitare de rată. Prag mai
// mic decât la "Popular" (BEACH_TAG_THRESHOLD = 3), ca informația să
// devină utilă rapid, nu doar după mulți vizitatori.
app.post("/api/tag-attraction", async (req, res) => {
  if (!dbPool) {
    res.status(503).json({ error: "not_configured" });
    return;
  }
  const { slug, tag } = req.body || {};
  if (typeof slug !== "string" || !slug || slug.length > 255) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  if (typeof tag !== "string" || !BEACH_ALL_TAGS.includes(tag)) {
    res.status(400).json({ error: "invalid_tag" });
    return;
  }
  const ipHash = hashIp(getClientIp(req));
  const rateOk = await checkRateLimit(ipHash, "tag-attraction", 30, 60);
  if (!rateOk) {
    res.status(429).json({ error: "too_many_requests" });
    return;
  }
  try {
    await dbPool.query(
      `INSERT INTO attraction_info_tags (slug, tag, ip_hash) VALUES ($1, $2, $3) ON CONFLICT (slug, tag, ip_hash) DO NOTHING`,
      [slug, tag, ipHash]
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("tag-attraction a eșuat:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

// Propuneri de locuri noi (magazin/obiectiv/plajă) — cerut explicit: dacă
// mai mulți utilizatori propun ACELAȘI loc, nu se creează rânduri
// multiple — se incrementează submission_count pe rândul deja existent
// (UPSERT, folosind indexul unic parțial pe slug, doar la status='pending'
// — o propunere respinsă anterior poate fi repropusă, nu rămâne blocată
// definitiv).
const SUBMISSION_TYPES = ["store", "attraction", "beach"];
app.post("/api/propune-loc", async (req, res) => {
  if (!dbPool) {
    res.status(503).json({ error: "not_configured" });
    return;
  }
  const { type, name, city, countryCode, category, mapsUrl, note } = req.body || {};
  if (typeof name !== "string" || !name.trim() || name.length > 255) {
    res.status(400).json({ error: "invalid_name" });
    return;
  }
  if (typeof city !== "string" || !city.trim() || city.length > 255) {
    res.status(400).json({ error: "invalid_city" });
    return;
  }
  if (typeof type !== "string" || !SUBMISSION_TYPES.includes(type)) {
    res.status(400).json({ error: "invalid_type" });
    return;
  }
  if (typeof countryCode !== "string" || !COUNTRIES[countryCode]) {
    res.status(400).json({ error: "invalid_country" });
    return;
  }
  // link Maps opțional, dar dacă e completat, verificăm minim că arată a URL
  const safeMapsUrl = typeof mapsUrl === "string" && /^https?:\/\//.test(mapsUrl) ? mapsUrl.slice(0, 500) : null;
  const safeCategory = typeof category === "string" ? category.slice(0, 50) : null;
  const safeNote = typeof note === "string" ? note.slice(0, 500) : null;

  const ipHash = hashIp(getClientIp(req));
  const rateOk = await checkRateLimit(ipHash, "propune-loc", 10, 60);
  if (!rateOk) {
    res.status(429).json({ error: "too_many_requests" });
    return;
  }

  const slug = submissionDuplicateSlug(name, city);
  try {
    await dbPool.query(
      `INSERT INTO pending_submissions (slug, type, name, city, country_code, category, maps_url, note, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) WHERE status = 'pending'
       DO UPDATE SET submission_count = pending_submissions.submission_count + 1, actualizat_la = now()`,
      [slug, type, name.trim(), city.trim(), countryCode, safeCategory, safeMapsUrl, safeNote, ipHash]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("propune-loc a eșuat:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

app.get("/api/city-live-map", async (req, res) => {
  if (!dbPool || !GOOGLE_PLACES_API_KEY_LIVE) {
    res.status(503).json({ error: "not_configured" });
    return;
  }

  // Limita a fost redusă drastic (de la 5/10min la 1/30min) într-o variantă
  // anterioară, gândită pentru costul VECHI al rutei — dar acum, cu modul
  // "doar din cache" de mai jos, costul real e ZERO (nicio cerere nouă către
  // Google, niciodată, de la această rută). O limită atât de strictă ar fi
  // inutil de restrictivă pentru utilizatori normali (ex. cineva care
  // verifică harta a două orașe diferite, pe rând) — păstrăm totuși o
  // limită, ca protecție simplă a bazei de date, nu a bugetului.
  const rateOk = await checkRateLimit(hashIp(getClientIp(req)), "city-live-map", 15, 10);
  if (!rateOk) {
    res.status(429).json({ error: "too_many_requests" });
    return;
  }

  const orasDisplay = toDisplayName(req.query.oras || "");
  const lang = typeof req.query.lang === "string" ? req.query.lang : "ro";
  if (!orasDisplay) {
    res.status(400).json({ error: "missing_oras" });
    return;
  }
  try {
    const { rows } = await dbPool.query(
      "SELECT nume_locatie, slug, place_id FROM locatii WHERE oras = $1 AND tip = 'store'",
      [orasDisplay]
    );
    const validRows = rows.filter((r) => r.place_id && r.place_id !== "ZERO_RESULTS" && !r.place_id.startsWith("ERROR_"));

    // FIX real, găsit prin verificare directă a unei propuneri anterioare:
    // acea variantă încerca să deducă brandul din slug ștergând cratimele
    // (ex. "dona-deva" -> "donadeva"), ceea ce nu se potrivește NICIODATĂ cu
    // cheile reale din STORE_CONFIG (ex. "dona") — rezultatul ar fi fost
    // "toate magazinele arată mereu deschis", indiferent de oră. Căutăm
    // corect, după `nume_locatie` (numele afișat, exact cel salvat în bază),
    // nu după slug.
    //
    // cacheOnly: true — NU facem NICIODATĂ o cerere nouă către Google aici;
    // dacă o locație n-are cache proaspăt (ultimele 12h), o OMITEM de pe
    // hartă, în loc s-o arătăm cu date inventate (poziție ghicită, status
    // presupus). Mai bine incompletă decât greșită.
    const results = await Promise.all(
      validRows.map(async (row) => {
        try {
          const status = await getLocationStatus({ pool: dbPool, placeId: row.place_id, apiKey: GOOGLE_PLACES_API_KEY_LIVE, language: lang, cacheOnly: true, ttlHours: 168 });
          if (status.skipped || status.lat == null || status.lng == null) return null;
          return { name: row.nume_locatie, slug: row.slug, lat: status.lat, lng: status.lng, isOpenNow: status.isOpenNow };
        } catch (e) {
          return null; // o locație eșuată nu blochează restul hărții
        }
      })
    );

    res.status(200).json({ stores: results.filter(Boolean) });
  } catch (err) {
    console.error("city-live-map a eșuat:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

// Hartă pentru OBIECTIVE TURISTICE — la cerere explicită, aceeași structură
// ca /api/city-live-map, dar pentru tip='attraction'. Statusul pentru
// fiecare obiectiv se calculează în ordine de încredere: 1) date live reale
// din cache (dacă există) 2) program generic pe categorie (dacă are
// categoria una definită — vezi CATEGORY_GENERIC_SCHEDULE) 3) acces liber
// (poduri, lacuri — mereu "deschis") 4) necunoscut — arătăm pinul, dar fără
// culoare de status (nu presupunem). cacheOnly: true la fel ca la magazine
// — NICIO cerere nouă către Google, niciodată, de la această rută.
app.get("/api/city-attractions-map", async (req, res) => {
  if (!dbPool) {
    res.status(503).json({ error: "not_configured" });
    return;
  }
  const rateOk = await checkRateLimit(hashIp(getClientIp(req)), "city-attractions-map", 15, 10);
  if (!rateOk) {
    res.status(429).json({ error: "too_many_requests" });
    return;
  }

  const orasDisplay = toDisplayName(req.query.oras || "");
  const countryCode = typeof req.query.tara === "string" ? req.query.tara : "ro";
  const lang = typeof req.query.lang === "string" ? req.query.lang : "ro";
  if (!orasDisplay) {
    res.status(400).json({ error: "missing_oras" });
    return;
  }
  try {
    const { rows } = await dbPool.query(
      "SELECT nume_locatie, slug, place_id FROM locatii WHERE oras = $1 AND tip = 'attraction'",
      [orasDisplay]
    );
    const validRows = rows.filter((r) => r.place_id && r.place_id !== "ZERO_RESULTS" && !r.place_id.startsWith("ERROR_"));
    const categoryByName = new Map((ATTRACTIONS[countryCode] || []).map((a) => [a.name, a.category]));

    const results = await Promise.all(
      validRows.map(async (row) => {
        try {
          const category = categoryByName.get(row.nume_locatie);
          let liveIsOpenNow = null;
          let liveLat = null, liveLng = null;
          if (GOOGLE_PLACES_API_KEY_LIVE) {
            const status = await getLocationStatus({ pool: dbPool, placeId: row.place_id, apiKey: GOOGLE_PLACES_API_KEY_LIVE, language: lang, cacheOnly: true, ttlHours: 720 });
            if (!status.skipped) {
              liveLat = status.lat; liveLng = status.lng;
              liveIsOpenNow = status.isOpenNow;
            }
          }
          const { isOpenNow } = determineAttractionOpenStatus({ name: row.nume_locatie, category, liveIsOpenNow });
          if (liveLat == null || liveLng == null) return null; // fără coordonate reale, nu inventăm poziția
          return { name: row.nume_locatie, slug: row.slug, lat: liveLat, lng: liveLng, isOpenNow };
        } catch (e) {
          return null;
        }
      })
    );

    res.status(200).json({ attractions: results.filter(Boolean) });
  } catch (err) {
    console.error("city-attractions-map a eșuat:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

// "Hartă lângă mine" — butonul din bara de jos, accesibil de pe orice pagină.
// Primește geolocația browserului, găsește cel mai apropiat oraș ACOPERIT
// (din toate țările), întoarce URL-ul paginii aceluia — care are deja harta
// live cu pin-uri (verde/roșu, deschis/închis), construită mai demult.
app.get("/api/nearest-city", async (req, res) => {
  const rateOk = await checkRateLimit(hashIp(getClientIp(req)), "nearest-city", 20, 10);
  if (!rateOk) {
    res.status(429).json({ error: "too_many_requests" });
    return;
  }
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    res.status(400).json({ error: "invalid_coordinates" });
    return;
  }
  const nearest = findNearestCityGlobal(lat, lon);
  if (!nearest) {
    res.status(404).json({ error: "no_coverage" });
    return;
  }
  res.json({ href: `${nearest.href}#cityMap`, city: nearest.city, distanceKm: nearest.distanceKm });
});

app.post("/api/push-subscribe", async (req, res) => {
  if (!pushEnabled) {
    res.status(503).json({ error: "push_not_configured" });
    return;
  }

  const rateOk = await checkRateLimit(hashIp(getClientIp(req)), "push-subscribe", 10, 60);
  if (!rateOk) {
    res.status(429).json({ error: "too_many_requests" });
    return;
  }

  const sub = req.body;
  if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
    res.status(400).json({ error: "invalid_subscription" });
    return;
  }
  try {
    await dbPool.query(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth)
       VALUES ($1, $2, $3)
       ON CONFLICT (endpoint) DO NOTHING`,
      [sub.endpoint, sub.keys.p256dh, sub.keys.auth]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("push-subscribe a eșuat:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

// Dezabonare — trimisă de frontend când utilizatorul apasă din nou pe
// buton, sau când browserul detectează singur o subscripție expirată
app.post("/api/push-unsubscribe", async (req, res) => {
  if (!pushEnabled) {
    res.status(503).json({ error: "push_not_configured" });
    return;
  }
  const { endpoint } = req.body || {};
  if (!endpoint) {
    res.status(400).json({ error: "missing_endpoint" });
    return;
  }
  try {
    await dbPool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint]);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("push-unsubscribe a eșuat:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

app.get("/manifest.json", (req, res) => {
  res.set("Content-Type", "application/manifest+json");
  res.send(JSON.stringify(isIntlHost(req) ? MANIFEST_JSON_INTL : MANIFEST_JSON));
});

// obiectivele turistice ale unei țări, randate ca fragment HTML (grupate pe
// categorii) — folosit pentru încărcare lazy pe homepage, ca să nu trimitem
// TOATE țările (posibil 10.000+ obiective, la scară completă) în HTML-ul
// inițial al fiecărei vizite. Cache lung (24h) — datele nu se schimbă des,
// și oricum fiecare obiectiv își ia statusul live separat, pe pagina lui.
app.get("/api/attractions/:tara(de|uk|es|fr|it|pl|nl|at|be|dk|ro|se|pt|cz|fi|gr|hu|hr|ie|sk|si|lt|lv|ee|cy|mt|lu|tr).json", (req, res) => {
  const code = req.params.tara;
  const list = ATTRACTIONS[code];
  if (!list) { res.status(404).json({ error: "not_found" }); return; }
  const lang = req.query && TRANSLATIONS[req.query.lang] ? req.query.lang : "uk";
  const html = buildAttractionListForCountry(list, code, true, lang);
  res.set("Cache-Control", "public, max-age=86400");
  res.set("Content-Type", "application/json; charset=utf-8");
  res.send(JSON.stringify({ html }));
});

app.get("/sw.js", (req, res) => {
  res.set("Content-Type", "application/javascript; charset=utf-8");
  res.send(SW_SCRIPT);
});

app.get("/icon.svg", (req, res) => {
  res.set("Content-Type", "image/svg+xml");
  res.send(ICON_SVG);
});

// Iconiță PNG reală, cerută de iOS/Safari și de unele integrări care nu
// acceptă SVG ca icon de instalare. Fișierul trebuie să existe la rădăcina
// proiectului (lângă vercel.json, package.json — NU în interiorul /api).
app.get("/icon-512.png", (req, res) => {
  const iconPath = path.join(__dirname, "..", "icon-512.png");
  fs.readFile(iconPath, (err, data) => {
    if (err) {
      res.status(404).end();
      return;
    }
    res.header("Content-Type", "image/png");
    res.send(data);
  });
});

app.get("/icon-192.png", (req, res) => {
  const iconPath = path.join(__dirname, "..", "icon-192.png");
  fs.readFile(iconPath, (err, data) => {
    if (err) {
      res.status(404).end();
      return;
    }
    res.header("Content-Type", "image/png");
    res.send(data);
  });
});

app.get("/sitemap.xml", (req, res) => {
  res.header("Content-Type", "application/xml");
  res.send(generateSitemapXml(baseUrlFor(req), isIntlHost(req)));
});

app.get("/robots.txt", (req, res) => {
  res.header("Content-Type", "text/plain");
  res.send(`User-agent: *\nAllow: /\n\nSitemap: ${baseUrlFor(req)}/sitemap.xml\n`);
});

// ads.txt — cerut de Google AdSense ca să confirme că acest domeniu are
// voie să vândă spațiul de reclamă legat de codAdSense. Completează
// adsensePublisherId (sus, lângă codAdSense) după ce ești aprobat.
app.get("/ads.txt", (req, res) => {
  res.set("Content-Type", "text/plain");
  if (!adsensePublisherId) {
    res.send("# ads.txt va fi completat automat după aprobarea Google AdSense\n");
    return;
  }
  res.send(`google.com, ${adsensePublisherId}, DIRECT, f08c47fec0942fa0\n`);
});

// Fișier de verificare a domeniului pentru rețeaua de afiliere — numele
// fișierului ȘI conținutul lui trebuie să coincidă exact cu ce a cerut platforma.
app.get("/cad147c6a5b6cb338e880ca855c2679f.html", (req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send("cad147c6a5b6cb338e880ca855c2679f");
});

app.get("/", (req, res) => {
  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));

  if (isIntlHost(req)) {
    // opening-hours-today.eu — detectăm țara din IP (dacă e una din cele acoperite),
    // ca magazinele/atracțiile relevante să apară primele — fără să ascundem restul.
    // Detectăm și orașul (același header ca pe domeniul RO) — dacă se potrivește
    // cu unul din orașele deja recunoscute în atracțiile țării, îl pre-selectăm.
    const ipCountry = String(req.headers["x-vercel-ip-country"] || "").toUpperCase();
    const detectedCountry = GEO_COUNTRY_MAP[ipCountry] || null;
    let detectedCity = null;
    const rawCity = req.headers["x-vercel-ip-city"] || "";
    if (detectedCountry && rawCity) {
      const cityDisplay = decodeGeoHeader(rawCity);
      const country = COUNTRIES[detectedCountry];
      const match = country.cities.find((c) => normalizeSlug(c) === normalizeSlug(cityDisplay));
      if (match) detectedCity = match;
    }
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(renderIntlHomePage(nonce, baseUrlFor(req), detectedCountry, detectedCity, req.query.lang));
    return;
  }

  // Vercel injectează automat headere de geolocație pe baza IP-ului vizitatorului.
  // IMPORTANT: pe rețelele mobile din România (Orange, Vodafone, Digi, Telekom),
  // traficul e adesea rutat printr-un punct central, de regulă în București —
  // IP-ul apare "din București" chiar dacă utilizatorul e fizic în alt oraș.
  // De aceea NU mai facem redirect forțat: arătăm orașul detectat ca sugestie,
  // pe homepage, cu un buton — utilizatorul confirmă sau alege alt oraș.
  const country = String(req.headers["x-vercel-ip-country"] || "").toUpperCase();
  const rawCity = req.headers["x-vercel-ip-city"] || "";

  let suggestedCity = null;
  if (country === "RO" && rawCity) {
    const cityDisplay = decodeGeoHeader(rawCity);
    const citySlug = resolveGeoCitySlug(cityDisplay);
    if (citySlug) {
      suggestedCity = { slug: citySlug, display: toDisplayName(citySlug) };
    }
  }

  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(renderHomePage(nonce, suggestedCity, baseUrlFor(req)));
});

// ============================================================
// RUTE INTERNAȚIONALE (DE/UK/ES) — restricționate explicit prin regex
// (":tara(de|uk|es|fr|it|pl|nl|at|be|dk|ro|se|pt|cz|fi|gr|hu|hr|ie|sk|si|lt|lv|ee|cy|mt|lu|tr)"), nu prin sintaxa "?" opțională, care e fragilă și
// se comportă inconsistent între versiunile de Express/path-to-regexp.
// Înregistrate ÎNAINTE de rutele RO, ca "/de/berlin/lidl" să nu fie
// interpretat greșit ca oraș="de" în sistemul românesc.
// Accesibile DOAR pe opening-hours-today.eu — pe programul-de-azi.ro,
// redirect 301 către domeniul internațional (nu duplicăm conținutul).
// ============================================================

// ruta de obiectiv turistic — ÎNAINTEA rutei generice de magazin (aceeași
// formă, 3 segmente: /:tara/:oras/:magazin) — altfel "obiectiv" ar fi
// interpretat greșit ca nume de oraș
// Varianta internațională a paginii de itinerar (vezi mai jos ruta simplă
// "/itinerar", pentru România) — GENERALIZATĂ pentru oricare din cele 27 de
// țări listate în COUNTRY_LABELS. Trebuie să fie ÎNAINTE de
// "/:tara/:oras/..." de mai jos, EXACT din același motiv documentat acolo
// pentru "/itinerar" vs "/:oras" — altfel ruta generică de oraș ar
// intercepta "itinerar" ca nume de oraș necunoscut, înainte să ajungă aici.
app.get("/:tara(de|uk|es|fr|it|pl|nl|at|be|dk|se|pt|cz|fi|gr|hu|hr|ie|sk|si|lt|lv|ee|cy|mt|lu|tr)/itinerar", (req, res) => {
  if (!isIntlHost(req)) {
    return res.redirect(301, `https://${INTL_DOMAIN}${req.url}`);
  }
  const countryCode = req.params.tara;
  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const requestedLang = req.query && TRANSLATIONS[req.query.lang] ? req.query.lang : null;
  const lang = ITINERARY_LABELS[requestedLang] ? requestedLang : "uk";
  const html = renderItineraryPage(nonce, baseUrlFor(req), lang, countryCode);
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/:tara(de|uk|es|fr|it|pl|nl|at|be|dk|ro|se|pt|cz|fi|gr|hu|hr|ie|sk|si|lt|lv|ee|cy|mt|lu|tr)/obiectiv/:slug", async (req, res) => {
  if (!isIntlHost(req)) {
    return res.redirect(301, `https://${INTL_DOMAIN}${req.url}`);
  }
  const countryCode = req.params.tara;
  const slug = req.params.slug.toLowerCase();
  const found = findAttractionBySlug(slug, countryCode);
  if (!found) {
    res.status(404).send("Obiectiv negăsit.");
    return;
  }
  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const requestedLang = req.query && TRANSLATIONS[req.query.lang] ? req.query.lang : null;
  const html = await renderAttractionPageIntl({ attraction: found.attraction, countryCode, lang: requestedLang, baseUrl: baseUrlFor(req), nonce, userAgent: req.headers['user-agent'], ip: getClientIp(req) });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// Pagină hiper-locală internațională: /:tara/:oras/:magazin/:locatie — cartier
// inserat în titlu/descriere/breadcrumb, la fel ca .ro nativ (renderStorePage),
// ACELAȘI program (nu date noi). Relevantă practic doar pentru RO (singura
// piață cu acest tipar de căutare construit), dar generică pentru orice țară.
app.get("/:tara(de|uk|es|fr|it|pl|nl|at|be|dk|ro|se|pt|cz|fi|gr|hu|hr|ie|sk|si|lt|lv|ee|cy|mt|lu|tr)/:oras/:magazin/:locatie", async (req, res, next) => {
  if (req.params.oras.includes(".") || req.params.magazin.includes(".") || req.params.locatie.includes(".")) return next();

  if (!isIntlHost(req)) {
    return res.redirect(301, `https://${INTL_DOMAIN}${req.url}`);
  }

  const countryCode = req.params.tara;
  const country = COUNTRIES[countryCode];
  const orasSlug = req.params.oras.toLowerCase();
  const orasDisplay = resolveIntlCityDisplay(countryCode, orasSlug);
  const magazinSlug = req.params.magazin.toLowerCase();
  const found = findStoreInConfig(req.params.magazin, country.config);
  const locatieDisplay = toDisplayName(req.params.locatie);

  if (!found) {
    res.status(404).send("Pagină negăsită.");
    return;
  }

  if (!isSelectiveBrandAllowedInCity(countryCode, found.key, orasDisplay)) {
    res.status(404).send("Pagină negăsită.");
    return;
  }

  // mall/cinema nu au sens hiper-local (structuri de zone/orar de filme,
  // nu program simplu de magazin) — 404, nu randare greșită
  if (found.config.type === "mall" || found.config.type === "cinema") {
    res.status(404).send("Pagină negăsită.");
    return;
  }

  // Ruta asta nu avea deloc suprascriere de program (nici pe oraș, nici pe
  // locație) — folosea direct found.config, neschimbat. Adăugat acum,
  // consistent cu ruta hiper-locală RO de mai jos.
  const effectiveStore = applyPerCityWeeklyOverride(found.config, countryCode, found.key, orasDisplay, locatieDisplay);

  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const requestedLang = req.query && TRANSLATIONS[req.query.lang] ? req.query.lang : null;
  const html = await renderIntlStorePage({ countryCode, orasSlug, orasDisplay, magazinSlug, magazinDisplay: found.displayName, locatieDisplay, store: effectiveStore, magazinKey: found.key, baseUrl: baseUrlFor(req), lang: requestedLang, nonce, userAgent: req.headers['user-agent'], ip: getClientIp(req) });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/:tara(de|uk|es|fr|it|pl|nl|at|be|dk|ro|se|pt|cz|fi|gr|hu|hr|ie|sk|si|lt|lv|ee|cy|mt|lu|tr)/:oras/:magazin", async (req, res, next) => {
  if (req.params.oras.includes(".") || req.params.magazin.includes(".")) return next();

  if (!isIntlHost(req)) {
    return res.redirect(301, `https://${INTL_DOMAIN}${req.url}`);
  }

  const countryCode = req.params.tara;
  const country = COUNTRIES[countryCode];
  const orasSlug = req.params.oras.toLowerCase();
  const orasDisplay = resolveIntlCityDisplay(countryCode, orasSlug);
  const magazinSlug = req.params.magazin.toLowerCase();
  const found = findStoreInConfig(req.params.magazin, country.config);

  if (!found) {
    // brand necunoscut pentru piața asta — 404 explicit, direct (nu next()),
    // ca să nu "cadă" din greșeală pe ruta hiper-locală RO de mai jos, care
    // acceptă orice text pe 3 segmente. Nu presupunem un program implicit
    // pentru un brand internațional necunoscut — legile de închidere diferă
    // radical între țări, spre deosebire de magazinele RO unde avem un
    // implicit național sigur (07-22/08-20).
    res.status(404).send("Pagină negăsită.");
    return;
  }

  // Aceleași restricții de brand, pentru orice țară care are liste definite
  // în SELECTIVE_BRAND_CITIES (Metro, Selgros, IKEA etc. la RO; Alvo la BE)
  // — fără asta, ar apărea greșit peste tot pe varianta internațională, o
  // regresie față de .ro unde funcționează corect
  if (!isSelectiveBrandAllowedInCity(countryCode, found.key, orasDisplay)) {
    res.status(404).send("Pagină negăsită.");
    return;
  }

  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const requestedLang = req.query && TRANSLATIONS[req.query.lang] ? req.query.lang : null;
  const html = await renderIntlStorePage({ countryCode, orasSlug, orasDisplay, magazinSlug, magazinDisplay: found.displayName, store: found.config, magazinKey: found.key, baseUrl: baseUrlFor(req), lang: requestedLang, nonce, userAgent: req.headers['user-agent'], ip: getClientIp(req) });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/:tara(de|uk|es|fr|it|pl|nl|at|be|dk|ro|se|pt|cz|fi|gr|hu|hr|ie|sk|si|lt|lv|ee|cy|mt|lu|tr)/:oras", async (req, res, next) => {
  if (req.params.oras.includes(".")) return next();

  if (!isIntlHost(req)) {
    return res.redirect(301, `https://${INTL_DOMAIN}${req.url}`);
  }

  const countryCode = req.params.tara;
  const orasSlug = req.params.oras.toLowerCase();
  const orasDisplay = resolveIntlCityDisplay(countryCode, orasSlug);

  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const requestedLang = req.query && TRANSLATIONS[req.query.lang] ? req.query.lang : null;
  const html = await renderIntlCityPage({ countryCode, orasSlug, orasDisplay, baseUrl: baseUrlFor(req), lang: requestedLang, nonce });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// ============================================================
// RUTE ROMÂNEȘTI — accesibile DOAR pe programul-de-azi.ro. Pe domeniul
// internațional, redirect 301 către domeniul RO (nu duplicăm conținutul).
// ============================================================
app.get("/:oras/:magazin/:locatie", async (req, res, next) => {
  // pagini hiper-locale: /cluj-napoca/kaufland/manastur — cartierul/strada e
  // inserat dinamic în titlu și în cardul de status, ca să prindem căutările
  // gen "program kaufland manastur" alături de căutările generale pe oraș
  if (req.params.oras.includes(".") || req.params.magazin.includes(".") || req.params.locatie.includes(".")) return next();

  if (isIntlHost(req)) {
    return res.redirect(301, `https://${RO_DOMAIN}${req.url}`);
  }

  const orasSlug = req.params.oras.toLowerCase();
  const orasDisplay = resolveRoCityDisplay(toDisplayName(req.params.oras));
  const magazinSlug = req.params.magazin.toLowerCase();
  const found = findStore(req.params.magazin);
  const magazinDisplay = found ? found.displayName : toDisplayName(req.params.magazin);
  const locatieDisplay = toDisplayName(req.params.locatie);

  if (!isKnownRoCity(orasDisplay)) {
    const nonce = generateNonce();
    res.set("Content-Security-Policy", buildCsp(nonce));
    const geo = req.query.lat && req.query.lon ? findNearestRoCity(Number(req.query.lat), Number(req.query.lon)) : null;
    const html = renderCityNotCoveredPage({ orasDisplay, nearest: geo, baseUrl: baseUrlFor(req), nonce });
    res.status(404).set("Content-Type", "text/html; charset=utf-8").send(html);
    return;
  }

  if (found && !isSelectiveBrandAllowedInCity("ro", found.key, orasDisplay)) {
    const nonce = generateNonce();
    res.set("Content-Security-Policy", buildCsp(nonce));
    const html = renderBrandNotInCityPage({ magazinDisplay, orasDisplay, magazinKey: found.key, baseUrl: baseUrlFor(req), nonce });
    res.status(200).set("Content-Type", "text/html; charset=utf-8").send(html);
    return;
  }

  const effectiveStore = applyPerCityWeeklyOverride(
    found ? found.config : { type: "store", weekly: supermarketWeekly(), holidays: SUPERMARKET_HOLIDAYS },
    "ro", found ? found.key : null, orasDisplay, locatieDisplay
  );

  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const html = await renderStorePage({ orasSlug, orasDisplay, magazinSlug, magazinDisplay, locatieDisplay, store: effectiveStore, magazinKey: found ? found.key : null, baseUrl: baseUrlFor(req), nonce, userAgent: req.headers['user-agent'], ip: getClientIp(req) });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// ruta de obiectiv turistic RO — ÎNAINTEA rutei generice de magazin
// (aceeași formă, 2 segmente: /:oras/:magazin) — altfel "obiectiv" ar fi
// interpretat greșit ca nume de oraș
app.get("/ghiduri", (req, res) => {
  if (isIntlHost(req)) {
    return res.redirect(301, `https://${RO_DOMAIN}${req.url}`);
  }
  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const html = renderTravelGuidesIndexPage({ baseUrl: baseUrlFor(req), nonce });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/ghiduri/:slug", async (req, res) => {
  if (isIntlHost(req)) {
    return res.redirect(301, `https://${RO_DOMAIN}${req.url}`);
  }
  const guide = TRAVEL_GUIDES_RO.find((g) => g.slug === req.params.slug.toLowerCase());
  if (!guide) {
    res.status(404).send("Ghid negăsit.");
    return;
  }
  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const html = await renderTravelGuidePage({ guide, baseUrl: baseUrlFor(req), nonce });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/guides", (req, res) => {
  if (!isIntlHost(req)) {
    return res.redirect(301, `https://${INTL_DOMAIN}${req.url}`);
  }
  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  // GENERALIZAT — 6 limbi traduse integral (de/fr/es/it/pl/nl), restul cad
  // pe engleză (vezi travelGuidesForLang) — mai bine decât gol/eronat.
  const requestedLang = req.query && TRANSLATIONS[req.query.lang] ? req.query.lang : "uk";
  const html = renderTravelGuidesIndexPageIntl({ baseUrl: baseUrlFor(req), nonce, lang: requestedLang });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/guides/:slug", async (req, res) => {
  if (!isIntlHost(req)) {
    return res.redirect(301, `https://${INTL_DOMAIN}${req.url}`);
  }
  const requestedLang = req.query && TRANSLATIONS[req.query.lang] ? req.query.lang : "uk";
  const guides = travelGuidesForLang(requestedLang);
  const guide = guides.find((g) => g.slug === req.params.slug.toLowerCase());
  if (!guide) {
    res.status(404).send("Guide not found.");
    return;
  }
  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const html = await renderTravelGuidePageIntl({ guide, baseUrl: baseUrlFor(req), nonce, lang: requestedLang });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/obiectiv/:slug", async (req, res) => {
  if (isIntlHost(req)) {
    return res.redirect(301, `https://${RO_DOMAIN}${req.url}`);
  }
  const slug = req.params.slug.toLowerCase();
  const found = findAttractionBySlug(slug, "ro");
  if (!found) {
    res.status(404).send("Obiectiv negăsit.");
    return;
  }
  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const html = await renderAttractionPageRO({ attraction: found.attraction, baseUrl: baseUrlFor(req), nonce, userAgent: req.headers['user-agent'], ip: getClientIp(req) });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/:oras/:magazin", async (req, res, next) => {
  if (req.params.oras.includes(".") || req.params.magazin.includes(".")) return next();

  if (isIntlHost(req)) {
    return res.redirect(301, `https://${RO_DOMAIN}${req.url}`);
  }

  const orasSlug = req.params.oras.toLowerCase();
  const orasDisplay = resolveRoCityDisplay(toDisplayName(req.params.oras));
  const magazinSlug = req.params.magazin.toLowerCase();
  const found = findStore(req.params.magazin);
  const magazinDisplay = found ? found.displayName : toDisplayName(req.params.magazin);

  if (!isKnownRoCity(orasDisplay)) {
    const nonce = generateNonce();
    res.set("Content-Security-Policy", buildCsp(nonce));
    const geo = req.query.lat && req.query.lon ? findNearestRoCity(Number(req.query.lat), Number(req.query.lon)) : null;
    const html = renderCityNotCoveredPage({ orasDisplay, nearest: geo, baseUrl: baseUrlFor(req), nonce });
    res.status(404).set("Content-Type", "text/html; charset=utf-8").send(html);
    return;
  }

  if (found && !isSelectiveBrandAllowedInCity("ro", found.key, orasDisplay)) {
    const nonce = generateNonce();
    res.set("Content-Security-Policy", buildCsp(nonce));
    const html = renderBrandNotInCityPage({ magazinDisplay, orasDisplay, magazinKey: found.key, baseUrl: baseUrlFor(req), nonce });
    res.status(200).set("Content-Type", "text/html; charset=utf-8").send(html);
    return;
  }

  // dacă brand-ul nu e cunoscut, folosim tot programul standard național ca implicit,
  // dar păstrăm numele exact așa cum a fost tastat în URL
  const effectiveStore = applyPerCityWeeklyOverride(
    found ? found.config : { type: "store", weekly: supermarketWeekly(), holidays: SUPERMARKET_HOLIDAYS },
    "ro", found ? found.key : null, orasDisplay
  );

  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const html = await renderStorePage({ orasSlug, orasDisplay, magazinSlug, magazinDisplay, store: effectiveStore, magazinKey: found ? found.key : null, baseUrl: baseUrlFor(req), nonce, userAgent: req.headers['user-agent'], ip: getClientIp(req) });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// ÎNAINTEA rutei generice "/:oras" de mai jos, deliberat — Express verifică
// rutele în ordinea în care sunt scrise în cod, nu după cât de specifice
// sunt. Dacă "/itinerar" ar fi rămas DUPĂ "/:oras", acea rută generică ar
// fi interceptat-o prima, tratând "itinerar" ca pe un nume de oraș necunoscut
// — exact bug-ul real, prins prin testare directă (pagina arăta lista de
// magazine, nu formularul de itinerar).
//
// NU redirecționăm spre RO_DOMAIN — migrarea .ro -> .eu e activă și
// redirecționează AUTOMAT (301) orice cerere de pe .ro către .eu, în afara
// unei liste scurte de excepții (vezi RO_TO_EU_MIGRATION_EXCLUDED_PREFIXES,
// sus în fișier) — "/itinerar" NU e în acea listă. Un redirect explicit spre
// .ro aici ar crea o buclă infinită (.eu -> .ro -> .eu -> ...), exact ca
// bug-ul găsit prin testare directă. Servim pagina direct, pe orice domeniu
// ajunge cererea — la fel ca paginile de obiective turistice, deja
// funcționale pe ambele domenii, fără niciun redirect forțat.
// "Propune un loc nou" — cerut explicit, disponibil pe ambele domenii (RO
// fix pe .ro, orice limbă pe .eu) — la fel ca /itinerar, nu redirecționat.
app.get("/propune", async (req, res) => {
  if (isIntlHost(req)) {
    return res.redirect(301, `https://${INTL_DOMAIN}/submit-place`);
  }
  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const html = await renderSubmitPlacePage(nonce, baseUrlFor(req), "ro", false);
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});
app.get("/submit-place", async (req, res) => {
  if (!isIntlHost(req)) {
    return res.redirect(301, `https://${RO_DOMAIN}/propune`);
  }
  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const requestedLang = req.query && TRANSLATIONS[req.query.lang] ? req.query.lang : "uk";
  const html = await renderSubmitPlacePage(nonce, baseUrlFor(req), requestedLang, true);
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// Pagina de administrare a propunerilor — DOAR pentru tine, română fixă
// (nu are sens tradusă, nu e conținut public). Protejată prin
// ADMIN_SECRET_KEY (variabilă de mediu) — fail-safe: fără cheia setată,
// pagina refuză accesul complet, nu cade pe un mod "deschis".
app.get("/admin/propuneri", async (req, res) => {
  if (!ADMIN_SECRET_KEY || req.query.key !== ADMIN_SECRET_KEY) {
    res.status(403).send("Acces interzis. Adaugă ?key=CHEIA_TA în URL.");
    return;
  }
  if (!dbPool) {
    res.status(503).send("Baza de date nu e configurată.");
    return;
  }
  let rows = [];
  try {
    const result = await dbPool.query(
      `SELECT id, type, name, city, country_code, category, maps_url, note, submission_count, creat_la
       FROM pending_submissions WHERE status = 'pending' ORDER BY submission_count DESC, creat_la ASC`
    );
    rows = result.rows;
  } catch (err) {
    res.status(500).send("Eroare la citirea propunerilor: " + escapeHtml(err.message));
    return;
  }
  const typeLabels = { store: "🛒 Magazin", attraction: "🏛️ Obiectiv", beach: "🏖️ Plajă" };
  const rowsHtml = rows.length
    ? rows.map((r) => `
      <div class="admin-submission-card">
        <div class="admin-submission-header">
          <span class="admin-submission-type">${escapeHtml(typeLabels[r.type] || r.type)}</span>
          ${r.submission_count > 1 ? `<span class="admin-submission-count">👥 ${r.submission_count}× propus</span>` : ""}
        </div>
        <div class="admin-submission-name">${escapeHtml(r.name)}</div>
        <div class="admin-submission-meta">${escapeHtml(r.city)}, ${escapeHtml(COUNTRY_LABELS[r.country_code] || r.country_code)}${r.category ? " · " + escapeHtml(r.category) : ""}</div>
        ${r.maps_url ? `<a href="${escapeHtml(r.maps_url)}" target="_blank" rel="noopener">📍 Vezi pe hartă</a>` : ""}
        ${r.note ? `<p class="admin-submission-note">${escapeHtml(r.note)}</p>` : ""}
        <div class="admin-submission-actions">
          <button type="button" class="admin-approve-btn" data-id="${r.id}">✓ Aprobă</button>
          <button type="button" class="admin-reject-btn" data-id="${r.id}">✕ Respinge</button>
        </div>
      </div>`).join("")
    : `<p>Nicio propunere în așteptare momentan.</p>`;

  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="ro"><head><meta charset="UTF-8"><title>Propuneri utilizatori</title>
<style>
body{font-family:sans-serif;max-width:700px;margin:20px auto;padding:0 16px;background:#111;color:#eee;}
.admin-submission-card{background:#1c1c1c;border-radius:10px;padding:16px;margin-bottom:12px;}
.admin-submission-header{display:flex;justify-content:space-between;margin-bottom:6px;}
.admin-submission-type{font-weight:700;}
.admin-submission-count{color:#ff8a3d;font-weight:700;}
.admin-submission-name{font-size:17px;font-weight:700;}
.admin-submission-meta{color:#999;margin:4px 0;}
.admin-submission-note{color:#ccc;font-style:italic;}
.admin-submission-actions{margin-top:10px;display:flex;gap:8px;}
.admin-approve-btn{background:#2e7d32;color:#fff;border:none;border-radius:6px;padding:8px 14px;cursor:pointer;}
.admin-reject-btn{background:#c62828;color:#fff;border:none;border-radius:6px;padding:8px 14px;cursor:pointer;}
</style></head>
<body>
<h1>📋 Propuneri utilizatori (${rows.length})</h1>
${rowsHtml}
<script>
var KEY = ${safeJson(req.query.key)};
document.querySelectorAll(".admin-approve-btn, .admin-reject-btn").forEach(function(btn){
  btn.addEventListener("click", function(){
    var action = btn.classList.contains("admin-approve-btn") ? "aproba" : "respinge";
    fetch("/api/admin/propuneri/" + btn.getAttribute("data-id") + "/" + action + "?key=" + encodeURIComponent(KEY), { method: "POST" })
      .then(function(){ btn.closest(".admin-submission-card").remove(); });
  });
});
</script>
</body></html>`);
});

app.post("/api/admin/propuneri/:id/:action", async (req, res) => {
  if (!ADMIN_SECRET_KEY || req.query.key !== ADMIN_SECRET_KEY) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  if (!dbPool) {
    res.status(503).json({ error: "not_configured" });
    return;
  }
  const { id, action } = req.params;
  if (!["aproba", "respinge"].includes(action) || !/^\d+$/.test(id)) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  const newStatus = action === "aproba" ? "approved" : "rejected";
  try {
    await dbPool.query(`UPDATE pending_submissions SET status = $1, actualizat_la = now() WHERE id = $2`, [newStatus, id]);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

app.get("/itinerar", (req, res) => {
  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const lang = ITINERARY_LABELS[req.query.lang] ? req.query.lang : "ro";
  const html = renderItineraryPage(nonce, baseUrlFor(req), lang, "ro");
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});
// (Varianta internațională — "/:tara/itinerar" — e definită mai sus, lângă
// "/:tara/obiectiv/:slug", din motive de ordine a rutelor Express; vezi
// comentariul de acolo.)

app.get("/:oras", async (req, res, next) => {
  if (req.params.oras.includes(".")) return next(); // cereri de tip fișier (css/js/ico) ignorate aici

  if (isIntlHost(req)) {
    return res.redirect(301, `https://${RO_DOMAIN}${req.url}`);
  }

  const orasSlug = req.params.oras.toLowerCase();
  const orasDisplay = resolveRoCityDisplay(toDisplayName(req.params.oras));

  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));

  if (!isKnownRoCity(orasDisplay)) {
    const geo = req.query.lat && req.query.lon ? findNearestRoCity(Number(req.query.lat), Number(req.query.lon)) : null;
    const html = renderCityNotCoveredPage({ orasDisplay, nearest: geo, baseUrl: baseUrlFor(req), nonce });
    res.status(404).set("Content-Type", "text/html; charset=utf-8").send(html);
    return;
  }

  const html = await renderCityPage({ orasSlug, orasDisplay, baseUrl: baseUrlFor(req), nonce });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// MUTAT aici, deliberat, ÎNAINTE de catch-all-ul final de mai jos —
// era poziționat mult mai jos în fișier, DUPĂ acel catch-all, deci
// Express nu ajungea NICIODATĂ la el (catch-all-ul răspunde 404 la
// orice n-a fost deja prins de o rută de mai sus) — bug real, prins
// prin testare directă, nu doar teoretic.
app.post("/api/genereaza-itinerar", async (req, res) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
  if (!OPENAI_API_KEY) {
    res.status(503).json({ error: "not_configured", message: "Lipsește OPENAI_API_KEY din variabilele de mediu." });
    return;
  }

  // Redus de la 15 la 3 pe oră — cerere reală (fiecare generare costă bani
  // la OpenAI), aliniat cu grija pentru buget discutată separat.
  const rateOk = await checkRateLimit(hashIp(getClientIp(req)), "genereaza-itinerar", 3, 60);
  if (!rateOk) {
    res.status(429).json({ error: "too_many_requests" });
    return;
  }

  const oras = typeof req.body?.oras === "string" ? req.body.oras.trim().slice(0, 100) : "";
  const lang = typeof req.body?.lang === "string" && ITINERARY_LABELS[req.body.lang] ? req.body.lang : "ro";
  // Tip călătorie — cerut explicit, folosit doar pentru "family" (restul,
  // "couple"/"adventure"/"culture", validate dar fără efect încă asupra
  // selecției de obiective — doar "family" are logică reală acum, restul
  // rămân doar opțiuni în formular, gata de extins ulterior dacă e nevoie).
  const TRIP_TYPES_VALIDE = ["any", "family", "couple", "adventure", "culture"];
  const tipCalatorie = TRIP_TYPES_VALIDE.includes(req.body?.tipCalatorie) ? req.body.tipCalatorie : "any";
  let zile = Number(req.body?.zile);
  if (!oras) { res.status(400).json({ error: "missing_oras" }); return; }
  if (!Number.isFinite(zile) || zile < 1) zile = 1;
  // Crescut de la 7 la 10 zile, la cerere explicită.
  if (zile > 10) zile = 10;

  // UNIVERSAL — nu mai depinde deloc de pe ce pagină de țară a fost trimisă
  // cererea (parametrul "tara" primit de la client NU mai e folosit pentru
  // căutare, doar orașul tastat contează) — vezi resolveCityToCountry mai
  // sus pentru motivul schimbării: un vizitator trebuie să poată tasta
  // "Lyon" din orice loc de pe site, nu doar de pe pagina Franței.
  const resolved = resolveCityToCountry(oras, tipCalatorie);
  if (!resolved) {
    res.status(404).json({ error: "oras_necunoscut", message: `Nu am găsit obiective turistice pentru „${oras}”. Încearcă alt oraș.` });
    return;
  }
  const { tara, obiective: obiectiveText } = resolved;
  const numeTara = COUNTRY_NAMES_RO[tara] || "România";

  const prompt = buildItineraryPrompt(oras, zile, obiectiveText, lang, numeTara, tipCalatorie);

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => "");
      console.error("OpenAI a răspuns cu eroare:", openaiRes.status, errText.slice(0, 300));
      res.status(502).json({ error: "openai_error", message: "Generarea a eșuat. Încearcă din nou." });
      return;
    }

    const data = await openaiRes.json();
    const rawContent = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!rawContent) {
      res.status(502).json({ error: "openai_empty_response" });
      return;
    }

    let itinerar;
    try {
      itinerar = JSON.parse(rawContent);
    } catch (e) {
      console.error("Răspunsul OpenAI nu era JSON valid:", rawContent.slice(0, 300));
      res.status(502).json({ error: "invalid_json_from_ai" });
      return;
    }

    // parcTicketLink — link de bilete (GetYourGuide) pentru parcul găsit,
    // DOAR în modul familie — calculat aici, nu pe client, ca să refolosim
    // ticketUrlFor (și tabela ATTRACTION_TICKET_URLS) deja existentă, fără
    // s-o duplicăm în JS-ul trimis către browser.
    const parcTicketLink = resolved.parcGasit ? ticketUrlFor(resolved.parcGasit) : null;

    // Link către pagina proprie a fiecărui obiectiv/plajă din itinerar —
    // cerut explicit, ca utilizatorul să poată da clic și să vadă descrierea
    // completă de pe site. Calculat AICI, pe server, cu toDbSlug (aceeași
    // funcție folosită peste tot pe site) — NU reconstruit în JS pe client,
    // ca să nu riscăm o mică diferență de logică între cele două și linkuri
    // sparte. "nume" vine EXACT ca în lista trimisă la AI (promptul cere
    // explicit asta), deci slug-ul calculat aici se potrivește garantat cu
    // pagina reală a obiectivului.
    if (itinerar && Array.isArray(itinerar.zile)) {
      const intervalKeys = ["dimineata", "pranz", "seara"];
      for (const zi of itinerar.zile) {
        for (const key of intervalKeys) {
          if (!Array.isArray(zi[key])) continue;
          for (const item of zi[key]) {
            if (!item || typeof item.nume !== "string" || !item.nume) continue;
            const slug = toDbSlug(item.nume);
            if (!slug) continue;
            item.link = tara === "ro" ? `/obiectiv/${slug}` : `/${tara}/obiectiv/${slug}`;
          }
        }
      }
    }

    res.status(200).json({ ...itinerar, orasCanonic: resolved.orasCanonic, parcGasit: resolved.parcGasit, parcTicketLink });
  } catch (err) {
    console.error("genereaza-itinerar a eșuat:", err.message);
    res.status(500).json({ error: "server_error" });
  }
});

app.use((req, res) => {
  res.status(404).send("Pagină negăsită.");
});

/* ============================================================
   8) EXPORT — Vercel importă acest fișier ca serverless function.
      Blocul de mai jos pornește un server local doar când rulezi
      direct `node api/server.js` (ex: pentru dezvoltare locală).
   ============================================================ */
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server local pornit: http://localhost:${PORT}/bucuresti/lidl`);
  });
}


/* ============================================================
   9) GENERATOR DE ITINERARII (AI) — filtrare locală + OpenAI
   Nu trimitem toate cele 500 de obiective la fiecare cerere (cost mare,
   inutil) — filtrăm local, în Node, doar obiectivele din județul detectat
   + județele vecine, ÎNAINTE să construim promptul. Modelul primește doar
   ce chiar are nevoie.
   ============================================================ */
;

// Vecinătatea reală a județelor României (geografie administrativă,
// verificată) — folosită DOAR ca să lărgim puțin selecția când județul cerut
// are prea puține obiective proprii; niciodată ca să inventăm date turistice.
;

// normalizează un nume de județ/oraș pentru comparare (fără diacritice, minuscule)
function normalizeJudetInput(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// index localitate -> județ, construit o singură dată, din datele deja
// existente (OBIECTIVE_ITINERAR) — acoperă orașele care apar în lista de
// obiective; pentru orice alt oraș, cădem pe SITEMAP_CITIES + CITY_COORDS,
// unde nu avem județ direct, deci recunoaștem doar ce apare deja aici
const LOCALITATE_TO_JUDET = {};
OBIECTIVE_ITINERAR.forEach((o) => {
  const key = normalizeJudetInput(o.localitate);
  if (key && !LOCALITATE_TO_JUDET[key]) LOCALITATE_TO_JUDET[key] = o.judet;
});
const ALL_JUDETE_NORMALIZED = {};
Object.keys(JUDET_NEIGHBORS).forEach((j) => { ALL_JUDETE_NORMALIZED[normalizeJudetInput(j)] = j; });

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

// Filtrare locală — NU trimitem toate cele 500 către OpenAI. Găsim județul
// cerut, luăm obiectivele din el; dacă sunt prea puține (sub 12, insuficient
// pentru un itinerar pe mai multe zile), completăm cu județele vecine, în
// ordine, până avem suficiente. Limită tare la 70 de linii trimise către AI —
// suficient pentru orice itinerar rezonabil, ține promptul mic și ieftin.
const MAX_OBIECTIVE_PROMPT = 70;
const MIN_OBIECTIVE_UTILE = 12;
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

// Echivalentul de mai sus, pentru orice țară ÎN AFARĂ de România. Nu avem
// (încă) o structură fină localitate->județ + vecini pentru celelalte 27
// de țări, ca la România — ATTRACTIONS[countryCode] are doar {name, url,
// category}, fără regiune. În loc să inventăm date geografice pe care nu
// le avem, folosim o abordare mai simplă, dar corectă: căutăm în numele
// obiectivului textul orașului cerut (multe nume includ orașul explicit,
// ex. "Palatul Regal din Bruxelles"); dacă găsim prea puține, trimitem
// modelului AI restul obiectivelor țării (plafonate) și îl lăsăm pe el să
// aleagă/organizeze rezonabil, cu instrucțiune explicită în prompt.
const MIN_OBIECTIVE_UTILE_INTL = 6;
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

// Alias-uri — exonime românești (nume diferite de cel local, nu doar fără
// diacritice — acelea sunt deja gestionate de normalizeJudetInput) —
// semnalat direct, cu exemplu real: "Lisabona" (românesc) nu găsea nimic,
// doar "Lisboa" (numele local, folosit în COUNTRIES.pt.cities) funcționa.
// Cheile sunt deja normalizate (fără diacritice, litere mici), verificate
// direct împotriva normalizeJudetInput(orasInput) — valorile sunt numele
// EXACTE, corect scrise, din COUNTRIES[cc].cities.
;

function resolveCityToCountry(orasInput, tipCalatorie) {
  const aliasMatch = CITY_ALIASES_RO[normalizeJudetInput(orasInput)];
  if (aliasMatch) orasInput = aliasMatch;
  const familyMode = tipCalatorie === "family";
  const roResult = filtreazaObiectivePentruOras(orasInput);
  if (roResult.judet && roResult.obiective && roResult.obiective.length) {
    // Verificăm și SITEMAP_CITIES (cele 103 orașe mari), pentru diacritice
    // corecte — la fel ca la restul țărilor mai jos — dacă orașul tastat e
    // unul din cele 103 (ex. "brasov" -> "Brașov"); altfel (orășele mici,
    // ex. "Bran", "Sinaia", nedefinite acolo), cade pe simpla capitalizare.
    const normRo = normalizeJudetInput(orasInput);
    const matchedRo = SITEMAP_CITIES.find((c) => normalizeJudetInput(c) === normRo);
    // OBIECTIVE_ITINERAR (folosit la RO) nu are câmp `category` propriu —
    // îl luăm prin potrivire de nume din ATTRACTIONS.ro, care ÎL are deja.
    const roCategoryByName = new Map((ATTRACTIONS.ro || []).map((a) => [normalizeJudetInput(a.name), a.category]));
    const { sorted: sortedRo, parcGasit } = boostParcuriAgrement(
      roResult.obiective,
      (o) => roCategoryByName.get(normalizeJudetInput(o.nume)),
      (o) => o.nume,
      familyMode
    );
    return { tara: "ro", obiective: sortedRo.map((o) => `${o.nume} (${o.localitate})`), orasCanonic: matchedRo || toTitleCase(orasInput), parcGasit };
  }

  const norm = normalizeJudetInput(orasInput);
  const otherCountries = Object.keys(COUNTRIES).filter((cc) => cc !== "ro");

  for (const cc of otherCountries) {
    const cities = COUNTRIES[cc].cities || [];
    const matched = cities.find((c) => normalizeJudetInput(c) === norm);
    if (matched) {
      const { obiective } = filtreazaObiectivePentruOrasIntl(cc, orasInput);
      if (obiective.length) {
        const { sorted, parcGasit } = boostParcuriAgrement(obiective, (a) => a.category, (a) => a.name, familyMode);
        return { tara: cc, obiective: sorted.map((a) => a.name), orasCanonic: matched, parcGasit };
      }
    }
  }

  // Insule/locații care NU sunt "orașe" (nu apar în COUNTRIES[cc].cities,
  // corect — vezi discuția explicită despre Zakynthos/Lefkada nefiind
  // orașe) — dar au obiective proprii (plaje), cu propriul câmp `city`.
  // Verificare EXACTĂ, înaintea buclei aproximative de mai jos — bug real,
  // găsit prin testare: "Lefkada" se potrivea greșit cu "Lefka" (Cipru),
  // prin verificarea aproximativă (substring), înainte să ajungă la
  // Grecia. O potrivire exactă pe insulă are prioritate, corect.
  for (const cc of otherCountries) {
    const list = ATTRACTIONS[cc] || [];
    const islandMatch = list.find((a) => a.city && normalizeJudetInput(a.city) === norm);
    if (islandMatch) {
      const islandObiective = list.filter((a) => a.city && normalizeJudetInput(a.city) === norm);
      const { sorted, parcGasit } = boostParcuriAgrement(islandObiective, (a) => a.category, (a) => a.name, familyMode);
      return { tara: cc, obiective: sorted.map((a) => a.name), orasCanonic: islandMatch.city, parcGasit };
    }
  }

  for (const cc of otherCountries) {
    const cities = COUNTRIES[cc].cities || [];
    const matched = cities.find((c) => { const nc = normalizeJudetInput(c); return nc.includes(norm) || norm.includes(nc); });
    if (matched) {
      const { obiective } = filtreazaObiectivePentruOrasIntl(cc, orasInput);
      if (obiective.length) {
        const { sorted, parcGasit } = boostParcuriAgrement(obiective, (a) => a.category, (a) => a.name, familyMode);
        return { tara: cc, obiective: sorted.map((a) => a.name), orasCanonic: matched, parcGasit };
      }
    }
  }

  for (const cc of otherCountries) {
    const { obiective, gasitExactInOras } = filtreazaObiectivePentruOrasIntl(cc, orasInput);
    if (gasitExactInOras) {
      const { sorted, parcGasit } = boostParcuriAgrement(obiective, (a) => a.category, (a) => a.name, familyMode);
      return { tara: cc, obiective: sorted.map((a) => a.name), orasCanonic: toTitleCase(orasInput), parcGasit };
    }
  }

  return null;
}

// promptul trimis către OpenAI — cerem explicit format JSON, structură fixă,
// ca frontend-ul să poată randa direct, fără parsare fragilă de text liber.
// GENERALIZAT pentru orice țară: countryCode + numeTara (română, pt. AI) +
// obiective ca listă de STRINGURI simple (nume complet, eventual cu oraș
// inclus în text) — la RO includem explicit "(localitate)", la restul
// țărilor numele obiectivului conține deja orașul în multe cazuri (vezi
// filtreazaObiectivePentruOrasIntl), deci NU mai forțăm un format anume.
function buildItineraryPrompt(oras, zile, obiective, lang, numeTara, tipCalatorie) {
  const listaText = obiective.map((o) => `- ${o}`).join("\n");
  const langName = itineraryLabelsFor(lang).aiLangName;
  const tara = numeTara || "România";
  // Instrucțiune suplimentară, DOAR pentru modul "familie" — cerut explicit:
  // dacă în lista de mai jos există parcuri de agrement (deja prioritizate,
  // puse la începutul listei, de resolveCityToCountry), AI-ul trebuie să le
  // includă explicit, nu doar să le "vadă" pasiv în listă.
  const familyInstruction = tipCalatorie === "family"
    ? `\nATENȚIE: acest itinerar e pentru o FAMILIE CU COPII. Dacă în lista de mai jos există parcuri de distracții/agrement, zoo-uri sau acvarii, include-le OBLIGATORIU în itinerar, cât mai devreme posibil (nu le ignora) — sunt cele mai potrivite obiective pentru copii. Preferă și restul obiectivelor mai puțin solicitante fizic/vizual pentru copii, unde ai de ales.\n`
    : "";
  // Modul "Beach Day" — CORECTAT explicit: NU mai propunem 3 plaje diferite
  // într-o zi (varianta veche, "Beach Hopper", încuraja exact asta — greșit,
  // nimeni nu merge la plajă ca să facă cross, ci ca să se relaxeze). Acum:
  // maxim 1 plajă principală pe zi (dimineață până seara), cu o singură
  // excepție posibilă — a doua plajă DOAR seara, DOAR dacă are o priveliște
  // clar mai bună pentru apus, niciodată o a treia.
  const beachHopperInstruction = tara === "Grecia"
    ? `\nDacă în lista de mai jos există obiective de tip plajă (numele lor conțin "Plaja" sau termeni echivalenți de plajă), o zi de plajă înseamnă RELAXARE, nu alergătură: alege O SINGURĂ plajă principală pentru toată ziua (dimineața, prânzul), pusă în "dimineata" sau "pranz" — nu împărți aceeași zi pe mai multe plaje diferite dimineața/prânzul. Poți propune o a DOUA plajă, diferită, DOAR pentru "seara", și DOAR dacă are explicit o priveliște mai bună pentru apus decât cea principală — altfel las-o tot pe cea principală și seara. NU propune niciodată 3 plaje diferite în aceeași zi. Menționează pe scurt, în descriere, de ce ai ales acel moment (ex. "loc bun pentru apus"). Dacă lista NU conține deloc plaje, ignoră complet această instrucțiune.\n`
    : "";
  // Numele obiectivelor rămân exact cum apar (nume proprii de locuri, nu se
  // traduc) — DOAR descrierile și titlurile zilelor trebuie scrise în limba
  // cerută. Instrucțiunea de limbă e pusă explicit, de trei ori (la început,
  // la mijloc, la final) — modelele mici uneori "uită" instrucțiunea de
  // limbă dacă apare o singură dată la începutul unui prompt lung.
  return `Ești un ghid turistic expert în ${tara}. Scrie ÎN ${langName.toUpperCase()} un itinerar turistic pe ${zile} ${zile === 1 ? "zi" : "zile"}, pentru un vizitator care merge în zona ${oras} (${tara}). TOT textul (titluri, descrieri) trebuie să fie în ${langName}, DOAR numele obiectivelor rămân exact așa cum apar mai jos (sunt nume proprii, nu se traduc).
${familyInstruction}${beachHopperInstruction}
Ai voie să folosești DOAR obiectivele din lista de mai jos — nu inventa altele, nu presupune obiective care nu apar aici. Dacă unele dintre ele nu sunt chiar în orașul ${oras}, ci în apropiere, foloseste-le pe cele mai apropiate geografic de ${oras} și organizează logic:
${listaText}

Organizează obiectivele pe zile: GRUPEAZĂ-LE geografic, pe localitate/zonă — obiectivele din aceeași localitate sau zonă apropiată trebuie puse ÎMPREUNĂ, în aceeași zi sau în zile consecutive, NICIODATĂ împrăștiate în zile diferite, neconsecutive (ex: greșit — cetatea din Localitatea A în ziua 1, altceva în Localitatea B în ziua 2, apoi mănăstirea tot din Localitatea A în ziua 3; corect — toate obiectivele din Localitatea A grupate în ziua 1, apoi treci definitiv la Localitatea B din ziua 2 înainte). În interiorul unei zile, organizează și intervalele "dimineata", "pranz", "seara" logic din punct de vedere geografic (nu sări dintr-o parte a orașului în cealaltă și înapoi fără motiv). Nu toate intervalele trebuie neapărat completate — dacă nu ai un obiectiv potrivit pentru un interval, poți lăsa lista goală pentru acel interval. Pentru fiecare obiectiv, scrie o descriere scurtă, atractivă, de maxim 2 propoziții, ÎN ${langName.toUpperCase()}.

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

// Pagină frontend — formular simplu + randare carduri pe zile. Cod separat,
// autonom (fără dependențe de restul paginii), exact cum a fost cerut.
// Pagină frontend — formular simplu + randare carduri pe zile. Cod separat,
// autonom (fără dependențe de restul paginii). Brand-ul (Programul de Azi /
// Opening Hours Today) depinde de DOMENIU, nu de limbă — la fel ca restul
// paginilor de pe site; limba în sine controlează formularul, mesajele și
// (prin buildItineraryPrompt) chiar textul generat de AI.
// Copy UNIVERSAL — placeholder + text introductiv, pentru toate cele 21 de
// limbi — SUPRASCRIE la randare textul original din ITINERARY_LABELS (nu-l
// modificăm acolo, ca să nu riscăm alte câmpuri deja bune — title, buton,
// mesaje de eroare rămân neatinse). Două motive, ambele semnalate direct:
// 1) "județ" e un concept specific doar României — Germania, de exemplu,
//    n-are județe; căutarea fiind acum universală (orice oraș, orice
//    țară), placeholder-ul trebuie să spună doar "Orașul", nu "Oraș sau
//    județ".
// 2) textul vechi ("construim un traseu logic din obiective verificate")
//    suna a lecție de geografie, nu a ceva care să convingă clientul să
//    își facă un itinerar — rescris cu ton captivant, orientat spre
//    experiența de vacanță, nu spre mecanica din spate.
;
function renderItineraryPage(nonce, baseUrl, lang, countryCode) {
  const cc = countryCode || "ro";
  const t = itineraryLabelsFor(lang);
  const isIntlDomain = baseUrl.includes(INTL_DOMAIN);
  // FIX real, semnalat direct: acest antet verifica doar isIntlDomain (.ro
  // vs .eu), nu și limba selectată — pe .eu, chiar dacă alegeai română,
  // tot vedeai "Guides →" în engleză (același bug găsit și reparat mai
  // devreme peste tot altundeva pe site — aici a scăpat, pentru că
  // renderItineraryPage are propriul antet, separat, nu trece prin
  // funcțiile comune deja reparate). Folosim navLabelsFor(lang), la fel ca
  // restul paginilor, pe toate cele 21 de limbi.
  const navL = navLabelsFor(lang);
  const brandHtml = isIntlDomain
    ? `<a class="brand" href="/">Opening<span>HoursToday</span></a><a class="guides-link" href="/guides">${navL.guides} →</a><a class="guides-link itin-nav-link" href="${itineraryHrefFor(cc, lang)}">${navL.itinerary} →</a>`
    : `<a class="brand" href="/">Programul<span>DeAzi</span></a><a class="guides-link" href="/ghiduri">${navL.guides} →</a><a class="guides-link itin-nav-link" href="/itinerar">${navL.itinerary} →</a>`;
  const homeHref = isIntlDomain ? `/?lang=${lang}` : "/";
  const breadcrumbHomeLabel = (TRANSLATIONS[lang] && TRANSLATIONS[lang].home) || (isIntlDomain ? "Home" : "Acasă");
  const title = `${t.title} — ${isIntlDomain ? "Opening Hours Today" : "Programul de Azi"}`;
  // GENERALIZAT — pe .ro, placeholder-ul rămâne EXACT cum era (orașe
  // românești, ex. "Brașov, Sibiu, Maramureș", scris de mână în fiecare
  // limbă). Pe restul țărilor, nu are sens să sugerăm orașe din România
  // cuiva care planifică un itinerar în Belgia sau Germania — bug real,
  // prins prin verificare directă a paginii ("arăta rău").
  //
  // UNIVERSAL — placeholder + intro suprascrise din ITINERARY_COPY_UNIVERSAL
  // de mai sus (cele 21 de limbi), NU doar exemplele din paranteză — vezi
  // comentariul de acolo pentru motiv ("Orașul", nu "Oraș sau județ";
  // text captivant, nu descriere tehnică).
  const universalCopy = ITINERARY_COPY_UNIVERSAL[lang] || ITINERARY_COPY_UNIVERSAL.uk;
  let placeholder = universalCopy.placeholder;
  let description = t.description;
  const totalAttractions = Object.values(ATTRACTIONS).reduce((sum, list) => sum + list.length, 0);
  if (totalAttractions) {
    description = description.replace(/\b500\b/, String(totalAttractions)).replace(/din România/i, "din toate țările acoperite");
  }
  // Canonical GENERALIZAT: /itinerar pentru RO (neschimbat), /<tara>/itinerar
  // pentru restul — la fel ca la paginile de obiective/magazine internaționale.
  const canonical = cc === "ro" ? `${baseUrl}/itinerar` : `${baseUrl}/${cc}/itinerar?lang=${lang}`;


  const daysOptionsHtml = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}"${n === 2 ? " selected" : ""}>${n}</option>`).join("");

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <div class="brand-stack">${brandHtml}</div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="${escapeHtml(homeHref)}">${escapeHtml(breadcrumbHomeLabel)}</a> / ${escapeHtml(t.breadcrumbCurrent)}</p>
  <h1 class="page-h1">${escapeHtml(t.h1.replace("🗺️", "🧭"))}</h1>
  <p class="intro-text">${escapeHtml(universalCopy.intro)}</p>

  <form id="itineraryForm" class="city-search-form" style="flex-direction:column;gap:12px;align-items:stretch">
    <input type="text" id="itinOras" class="city-search-input" placeholder="${escapeHtml(placeholder)}" required>
    <div style="display:flex;gap:8px;align-items:center">
      <label for="itinZile" style="font-size:14px;color:var(--muted);white-space:nowrap">${escapeHtml(t.daysLabel)}</label>
      <select id="itinZile" class="city-search-input" style="flex:0 0 90px">
        ${daysOptionsHtml}
      </select>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <label for="itinTip" style="font-size:14px;color:var(--muted);white-space:nowrap">${escapeHtml(tripTypeLabelsFor(lang).label)}</label>
      <select id="itinTip" class="city-search-input" style="flex:1 1 auto">
        <option value="any">${escapeHtml(tripTypeLabelsFor(lang).any)}</option>
        <option value="family">${escapeHtml(tripTypeLabelsFor(lang).family)}</option>
        <option value="couple">${escapeHtml(tripTypeLabelsFor(lang).couple)}</option>
        <option value="adventure">${escapeHtml(tripTypeLabelsFor(lang).adventure)}</option>
        <option value="culture">${escapeHtml(tripTypeLabelsFor(lang).culture)}</option>
      </select>
    </div>
    <button type="submit" id="itinSubmitBtn" class="geo-btn" style="margin:0">${escapeHtml(t.submitBtn)}</button>
  </form>

  <div id="itinLoading" style="display:none;text-align:center;margin:24px 18px;color:var(--muted);font-family:var(--font-display);font-weight:600">
    <div style="font-size:28px;margin-bottom:10px">🧭</div>
    <div id="itinLoadingText">${escapeHtml(t.loadingMessages[0])}</div>
  </div>

  <div id="itinError" class="geo-country-highlight" style="display:none;border-color:#DC2626"></div>

  <div id="itinResults"></div>

  <button type="button" id="itinResetBtn" class="clear-country-btn" style="display:none;margin:20px 18px 0">${escapeHtml(t.resetBtn)}</button>

  <footer>
    <p><strong>${isIntlDomain ? "Opening Hours Today" : "Programul de Azi"}</strong> — ${escapeHtml(t.footer)}</p>
  </footer>
</main>
<style nonce="${nonce}">
  .itin-day-card{margin:20px 18px 0;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:var(--radius-lg);padding:20px;}
  .itin-day-title{font-family:var(--font-display);font-weight:800;font-size:18px;margin-bottom:14px;color:var(--accent);}
  .itin-interval-label{font-family:var(--font-display);font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:14px 0 8px;}
  .itin-interval-label:first-of-type{margin-top:0;}
  .itin-item{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px 14px;margin-bottom:8px;}
  .itin-item-name{font-weight:700;font-size:14.5px;margin-bottom:4px;display:flex;align-items:baseline;flex-wrap:wrap;gap:8px;}
  .itin-item-link{color:var(--text);text-decoration:none;border-bottom:1px dashed var(--accent);}
  .itin-item-link:hover{color:var(--accent);}
  .itin-item-distance{font-weight:600;font-size:12.5px;color:var(--muted);white-space:nowrap;}
  .itin-item-desc{font-size:13.5px;color:var(--muted);line-height:1.5;}
</style>
<script nonce="${nonce}">
(function(){
  var LANG = ${safeJson(lang)};
  var TARA = ${safeJson(cc)};
  var DAY_PREFIX = ${safeJson(t.dayPrefix)};
  var MORNING_LABEL = ${safeJson(t.morning)};
  var LUNCH_LABEL = ${safeJson(t.lunch)};
  var EVENING_LABEL = ${safeJson(t.evening)};
  var ERROR_UNEXPECTED = ${safeJson(t.errorUnexpected)};
  var ERROR_NETWORK = ${safeJson(t.errorNetwork)};
  var ERROR_GENERIC = ${safeJson(t.errorGeneric)};
  var LOADING_MESSAGES = ${safeJson(t.loadingMessages)};
  // Bilete de avion — Kiwi.com, prin Travelpayouts (marker 767825, ID-ul
  // tău real de afiliat, confirmat direct de tine — nu Skyscanner, plan
  // schimbat). Rămâne activ mereu acum (marker-ul e deja completat) — nu
  // mai cade pe "urmează în curând", cum era cât timp aștepta Skyscanner.
  var FLIGHT_SEARCH_READY = ${safeJson(Boolean(KIWI_TRAVELPAYOUTS_MARKER))};
  var FLIGHT_COMING_SOON_TEXT = ${safeJson(comingSoonTextFor(lang))};
  var FLIGHT_LABEL = ${safeJson(flightSearchLabelFor(lang))};
  function flightSearchLinkFor(destinationCity) {
    if (!FLIGHT_SEARCH_READY) return null;
    return "https://www.kiwi.com/deep?to=" + encodeURIComponent(destinationCity) + "&marker=" + encodeURIComponent(${safeJson(KIWI_TRAVELPAYOUTS_MARKER)});
  }
  // Cazare — Booking.com — link întotdeauna funcțional (nu are stare
  // "urmează în curând"; dacă BOOKING_AFFILIATE_ID nu e completat încă,
  // cade pe căutare simplă, fără tracking, dar tot funcțională).
  var HOTEL_LABEL = ${safeJson(bookingPlanningLabelsFor(lang).stays)};
  function hotelSearchLinkFor(destinationCity) {
    return ${safeJson(BOOKING_AFFILIATE_ID)}
      ? "https://www.booking.com/searchresults.html?ss=" + encodeURIComponent(destinationCity) + "&aid=" + encodeURIComponent(${safeJson(BOOKING_AFFILIATE_ID)})
      : "https://www.booking.com/searchresults.html?ss=" + encodeURIComponent(destinationCity);
  }
  // Închiriere mașină — Discover Cars. Pentru 30 de orașe mari, link REAL,
  // cu destinația pre-completată (deep link generat direct de tine, din
  // panoul lor) — pentru restul orașelor, cade pe link-ul general, fără
  // destinație (vezi comentariul din server.js, lângă carRentalLinkFor:
  // căutarea lor reală cere un ID intern de locație, nu un nume de oraș
  // simplu — nu-l putem construi noi, pentru orice oraș, în siguranță).
  var CAR_RENTAL_LABEL = ${safeJson(carRentalLabelFor(lang))};
  var CAR_RENTAL_CITY_LINKS = ${safeJson(DISCOVERCARS_CITY_LINKS)};
  var CAR_RENTAL_GENERIC_LINK = ${safeJson(carRentalLinkFor())};
  function carRentalLinkFor(destinationCity) {
    if (destinationCity && CAR_RENTAL_CITY_LINKS[destinationCity]) return CAR_RENTAL_CITY_LINKS[destinationCity];
    return CAR_RENTAL_GENERIC_LINK;
  }
  // Bilet parc de agrement (GetYourGuide) — DOAR în modul familie, DOAR
  // dacă serverul a găsit un parc în lista de obiective (vezi parcGasit,
  // calculat în resolveCityToCountry, trimis prin API în data.parcGasit /
  // data.parcTicketLink). Reutilizează eticheta deja tradusă (21 de limbi),
  // nu una nouă.
  var PARK_TICKET_LABEL = ${safeJson(bookingPlanningLabelsFor(lang).ticket)};

  var form = document.getElementById("itineraryForm");
  var loading = document.getElementById("itinLoading");
  var loadingText = document.getElementById("itinLoadingText");
  var errorBox = document.getElementById("itinError");
  var results = document.getElementById("itinResults");
  var submitBtn = document.getElementById("itinSubmitBtn");
  var resetBtn = document.getElementById("itinResetBtn");
  // Salvare persistentă — cerută explicit ("mi se face un itinerar care
  // ramane salvat pana il sterg"): itinerarul generat rămâne în
  // localStorage, vizibil la orice revenire pe pagină (chiar și după ce
  // închizi browserul), până apeși explicit butonul de ștergere. Cheie
  // diferită pe fiecare domeniu (ca la restul site-ului — favorite,
  // notificări), ca să nu se amestece cele două branduri.
  var STORAGE_KEY = ${safeJson(isIntlDomain ? "oht_itinerar_v1" : "poa_itinerar_v1")};

  function saveItinerary(oras, zile, data){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ oras: oras, zile: zile, data: data, savedAt: Date.now() }));
    } catch (e) { /* localStorage indisponibil (mod privat etc.) — nu blocăm nimic, doar nu se salvează */ }
  }
  function loadSavedItinerary(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearSavedItinerary(){
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  resetBtn.addEventListener("click", function(){
    results.innerHTML = "";
    errorBox.style.display = "none";
    resetBtn.style.display = "none";
    clearSavedItinerary();
    form.reset();
    form.style.display = "";
    document.getElementById("itinOras").focus();
  });

  var loadingInterval = null;

  function escapeHtmlClient(s){
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function renderItems(items){
    if (!items || !items.length) return "";
    return items.map(function(it){
      var nameHtml = it.link
        ? '<a class="itin-item-link" href="' + it.link + '">' + escapeHtmlClient(it.nume) + '</a>'
        : escapeHtmlClient(it.nume);
      var distanceHtml = it.distanta
        ? '<span class="itin-item-distance">📍 ' + escapeHtmlClient(it.distanta) + '</span>'
        : '';
      return '<div class="itin-item"><div class="itin-item-name">' + nameHtml + distanceHtml + '</div><div class="itin-item-desc">' + escapeHtmlClient(it.descriere) + '</div></div>';
    }).join("");
  }

  function renderItinerary(data, searchedCity){
    results.innerHTML = "";
    if (!data || !Array.isArray(data.zile)) {
      errorBox.textContent = ERROR_UNEXPECTED;
      errorBox.style.display = "block";
      return;
    }
    var html = data.zile.map(function(zi){
      var morningHtml = renderItems(zi.dimineata);
      var lunchHtml = renderItems(zi.pranz);
      var eveningHtml = renderItems(zi.seara);
      return '<div class="itin-day-card">' +
        '<div class="itin-day-title">' + DAY_PREFIX + ' ' + escapeHtmlClient(zi.ziua) + (zi.titlu ? ' — ' + escapeHtmlClient(zi.titlu) : '') + '</div>' +
        (morningHtml ? '<div class="itin-interval-label">' + MORNING_LABEL + '</div>' + morningHtml : '') +
        (lunchHtml ? '<div class="itin-interval-label">' + LUNCH_LABEL + '</div>' + lunchHtml : '') +
        (eveningHtml ? '<div class="itin-interval-label">' + EVENING_LABEL + '</div>' + eveningHtml : '') +
        '</div>';
    }).join("");
    // Bloc de zboruri (Kiwi.com) + cazare (Booking.com) + mașină (Discover
    // Cars) — la cerere explicită, pe pagina de itinerar, nu la Ghiduri,
    // imediat sub rezultat. Zboruri: "urmează în curând" DOAR dacă
    // FLIGHT_SEARCH_READY e fals (nu mai e cazul acum). Cazare: mereu
    // funcțional. Mașină: mereu funcțional, dar fără destinație
    // pre-completată (vezi comentariul de mai sus, la CAR_RENTAL_LINK).
    var flightLink = searchedCity ? flightSearchLinkFor(searchedCity) : null;
    var flightHtml = flightLink
      ? '<a href="' + flightLink + '" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-booking">' + FLIGHT_LABEL + ' ' + escapeHtmlClient(searchedCity) + '</a>'
      : '<p class="plan-visit-hint">' + FLIGHT_COMING_SOON_TEXT + '</p>';
    var hotelHtml = searchedCity
      ? '<a href="' + hotelSearchLinkFor(searchedCity) + '" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking">' + HOTEL_LABEL + '</a>'
      : '';
    var carLink = carRentalLinkFor(searchedCity);
    var carHtml = carLink
      ? '<a href="' + carLink + '" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">' + CAR_RENTAL_LABEL + '</a>'
      : '';
    // Bilet parc — apare DOAR dacă serverul a găsit un parc de agrement în
    // modul familie (data.parcGasit + data.parcTicketLink, calculate în
    // resolveCityToCountry). Absent complet în restul cazurilor — nu ocupă
    // loc degeaba.
    var parkTicketHtml = (data && data.parcTicketLink && data.parcGasit)
      ? '<a href="' + data.parcTicketLink + '" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">' + PARK_TICKET_LABEL + ' — ' + escapeHtmlClient(data.parcGasit) + '</a>'
      : '';
    html += '<div class="plan-visit-block" style="display:block; margin-top:16px;">' + parkTicketHtml + flightHtml + hotelHtml + carHtml + '</div>';
    results.innerHTML = html;
    resetBtn.style.display = "block";
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    var oras = document.getElementById("itinOras").value.trim();
    var zile = document.getElementById("itinZile").value;
    var tipCalatorie = document.getElementById("itinTip").value;
    if (!oras) return;

    errorBox.style.display = "none";
    results.innerHTML = "";
    submitBtn.disabled = true;
    loading.style.display = "block";
    var msgIdx = 0;
    loadingText.textContent = LOADING_MESSAGES[0];
    loadingInterval = setInterval(function(){
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      loadingText.textContent = LOADING_MESSAGES[msgIdx];
    }, 1800);

    fetch("/api/genereaza-itinerar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oras: oras, zile: Number(zile), lang: LANG, tara: TARA, tipCalatorie: tipCalatorie }),
    })
      .then(function(r){ return r.json().then(function(data){ return { ok: r.ok, data: data }; }); })
      .then(function(res){
        clearInterval(loadingInterval);
        loading.style.display = "none";
        submitBtn.disabled = false;
        if (!res.ok) {
          errorBox.textContent = (res.data && res.data.message) || ERROR_GENERIC;
          errorBox.style.display = "block";
          return;
        }
        // Folosim orasCanonic (scris corect, din propria noastră listă de
        // orașe), nu textul brut tastat de utilizator — bug real, semnalat
        // direct: cineva care scria "paris" (litere mici) vedea exact
        // "paris" în butonul de zboruri și în link-ul trimis către Kiwi.com,
        // care nu-l recunoștea corect ca destinație.
        var orasAfisat = (res.data && res.data.orasCanonic) || oras;
        renderItinerary(res.data, orasAfisat);
        saveItinerary(orasAfisat, zile, res.data);
      })
      .catch(function(){
        clearInterval(loadingInterval);
        loading.style.display = "none";
        submitBtn.disabled = false;
        errorBox.textContent = ERROR_NETWORK;
        errorBox.style.display = "block";
      });
  });

  // Dacă vii de la un buton contextual (ex. "🧭 Itinerar – Madrid", din
  // rezultatele căutării de obiective) — orașul e deja în URL (?oras=...).
  // Îl completăm direct în casetă, ca să nu-l mai retastezi. În acest caz,
  // SĂRIM peste afișarea unui itinerar salvat anterior (ar fi confuz să
  // vezi un itinerar vechi, pentru alt oraș, exact când tocmai ai cerut
  // unul nou) — utilizatorul mai are nevoie doar să aleagă zilele și să
  // apese "Generează".
  var urlParams = new URLSearchParams(window.location.search);
  var orasDinUrl = urlParams.get("oras");
  if (orasDinUrl) {
    document.getElementById("itinOras").value = orasDinUrl;
  } else {
    // La deschiderea paginii — dacă există un itinerar salvat anterior, îl
    // arătăm direct, fără să mai fie nevoie de o nouă generare (și fără cost
    // suplimentar către OpenAI). Câmpurile formularului rămân completate cu
    // orașul/numărul de zile de atunci, pentru context — utilizatorul poate
    // oricând căuta altceva, sau apăsa "Șterge" ca să pornească de la zero.
    var saved = loadSavedItinerary();
    if (saved && saved.data) {
      // Bug real, semnalat direct, cu captură: un itinerar salvat ÎNAINTE
      // de reparația asta avea orașul brut, netratat ("paris", litere
      // mici), salvat direct în localStorage — reparația de la generare
      // (orasCanonic) nu ajută retroactiv la ce era deja salvat. Aici,
      // recuperăm orasCanonic din datele salvate (tot venea de la server,
      // în raspuns), dacă există, chiar dacă saved.oras a rămas vechi.
      var orasPentruAfisare = (saved.data && saved.data.orasCanonic) || saved.oras || "";
      document.getElementById("itinOras").value = saved.oras || "";
      if (saved.zile) document.getElementById("itinZile").value = String(saved.zile);
      renderItinerary(saved.data, orasPentruAfisare);
    }
  }
})();
</script>`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: lang });
}


module.exports = app;

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

async function tryGetLiveStatus(slug, lang) {
  if (!dbPool || !GOOGLE_PLACES_API_KEY_LIVE) return null;
  try {
    const { rows } = await dbPool.query("SELECT place_id FROM locatii WHERE slug = $1 LIMIT 1", [slug]);
    if (!rows.length) return null;
    const placeId = rows[0].place_id;
    if (!placeId || placeId === "ZERO_RESULTS" || placeId.startsWith("ERROR_")) return null;
    return await getLocationStatus({ pool: dbPool, placeId, apiKey: GOOGLE_PLACES_API_KEY_LIVE, language: lang });
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

// ID-ul de publisher AdSense (ex: "pub-1234567890123456") — folosit doar
// pentru generarea automată a /ads.txt. Completează-l după aprobare.
const adsensePublisherId = "ca-pub-7945793092031366";

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

const BOOKING_PLANNING_LABELS_RO = {
  title: "🅿️ Planifică vizita",
  hint: (name) => `Vezi cazări, parcare și bilete online pentru ${name} — toate într-un singur loc.`,
  ticket: "🎟️ Vrei să eviți coada? Cumpără bilet online",
  stays: "🏨 Vezi cazări în apropiere pe Booking.com",
  restaurant: "🍽️ Găsește și rezervă la restaurante în apropiere",
  parkingNearby: "🚗 Caută parcare în apropiere",
};
const BOOKING_PLANNING_LABELS_EN = {
  title: "🅿️ Plan your visit",
  hint: (name) => `Find nearby stays, parking, and online tickets for ${name} — all in one place.`,
  ticket: "🎟️ Want to skip the line? Buy tickets online",
  stays: "🏨 See nearby stays on Booking.com",
  restaurant: "🍽️ Find and book nearby restaurants",
  parkingNearby: "🚗 Search for parking nearby",
};

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
function buildBookingPlanningButtonsHtml({ name, city, labels, countryCode }) {
  const t = labels || BOOKING_PLANNING_LABELS_RO;
  const parkingQuery = city || name;
  const ticketHtml = linkBileteTurism
    ? `<a href="${escapeHtml(ticketUrlFor(name))}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-ticket">${escapeHtml(t.ticket)}</a>`
    : "";
  return `
  <div class="plan-visit-block">
    <button type="button" class="plan-visit-btn" id="planVisitBtn">${escapeHtml(t.title)}</button>
    <p class="plan-visit-hint" id="planVisitHint">${escapeHtml(t.hint(name))}</p>
    <div class="plan-visit-panel" id="planVisitPanel" hidden>
      ${ticketHtml}
      <a href="${escapeHtml(bookingSearchLinkFor(name))}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-booking">${escapeHtml(t.stays)}</a>
      <a href="${escapeHtml(restaurantLinkFor(countryCode || "ro", parkingQuery))}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking">${escapeHtml(t.restaurant)}</a>
      <a href="${escapeHtml(bookingSearchLinkFor(parkingQuery))}" target="_blank" rel="noopener sponsored" class="plan-visit-option plan-visit-parking-alt">${escapeHtml(t.parkingNearby)}</a>
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

const REPORT_ISSUE_LABELS_RO = {
  btn: "🚩 Programul e corect sau locul nu mai există? Spune-ne, ajuți alți vizitatori!",
  q1: (name) => `Este ${name} deschis chiar acum?`,
  yes: "Da",
  no: "Nu",
  q2: "Magazinul e închis definitiv, nu mai există la această locație?",
  thanksOpen: "✅ Mulțumim pentru confirmare! Ne ajuți să ținem informația corectă, pentru toată lumea.",
  thanksReport: "✅ Mulțumim că ești alături de noi pentru cea mai bună experiență a utilizatorilor!",
  error: "Nu am putut trimite raportarea. Încearcă din nou.",
  alreadyReported: "Mulțumim, am primit deja mesajul tău — nu poți trimite o altă raportare pentru această locație.",
};
const REPORT_ISSUE_LABELS_EN = {
  btn: "🚩 Is the schedule right, or is this place gone? Let us know — help other visitors!",
  q1: (name) => `Is ${name} open right now?`,
  yes: "Yes",
  no: "No",
  q2: "Is this store permanently closed or gone from this location?",
  thanksOpen: "✅ Thanks for confirming! You're helping us keep this accurate for everyone.",
  thanksReport: "✅ Thank you for being with us in building the best experience for our users!",
  error: "Couldn't send the report. Try again.",
  alreadyReported: "Thanks, we already received your report — you can't submit another one for this place.",
};

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

const CLOSED_PERMANENTLY_LABELS_RO = {
  title: "🚫 Magazin închis definitiv sau mutat",
  text: "Evaluare realizată pe baza confirmărilor de la utilizatori.",
};
const CLOSED_PERMANENTLY_LABELS_EN = {
  title: "🚫 Permanently closed or relocated",
  text: "Based on confirmations from other users.",
};

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

const REPORTED_WRONG_LABELS_RO = "⚠️ Mai mulți utilizatori au raportat că programul afișat ar putea fi greșit. Verifică, dacă poți, la fața locului.";
const REPORTED_WRONG_LABELS_EN = "⚠️ Several users have reported the displayed hours might be wrong. Please double-check if you can.";

function reportedWrongBannerHtml(text) {
  return `<div class="reported-wrong-banner">${escapeHtml(text || REPORTED_WRONG_LABELS_RO)}</div>`;
}

// Linkuri opționale pentru "Cum ajung acolo?" — GetTransfer (taxi/transfer
// local) și Omio (tren/autobuz Europa), prin contul Travelpayouts. Fără
// linkuri de afiliere specifice confirmate încă, cad pe site-urile publice,
// funcționale — dacă ai coduri de link reale din Travelpayouts, pune-le
// aici, direct.
const linkGetTransferAffiliate = "";
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

const HOW_TO_GET_THERE_LABELS_RO = {
  btn: "🚗 Cum ajung acolo?",
  waze: "🧭 Mergi acolo (Waze)",
  optionA: "🚕 Rezervă un Taxi/Transfer local",
  optionB: "🚆 Caută Tren/Autobuz în Europa",
};
const HOW_TO_GET_THERE_LABELS_EN = {
  btn: "🚗 How do I get there?",
  waze: "🧭 Go there (Waze)",
  optionA: "🚕 Book a local Taxi/Transfer",
  optionB: "🚆 Search Train/Bus in Europe",
};

// Buton + panou cu 2 opțiuni — sub programul zilei, pe pagina de magazin
// SAU obiectiv. Nu redirectăm direct (ar alege unul pentru utilizator) —
// arătăm ambele opțiuni, îl lăsăm pe el să aleagă.
function buildHowToGetThereHtml(labels, place) {
  const t = labels || HOW_TO_GET_THERE_LABELS_RO;
  // Waze e primul, dar ascuns implicit — apare doar când statusul (deschis/
  // închis) e cunoscut cu adevărat (vezi sync() din buildContextualWidgetScript,
  // care îl caută pe id, indiferent unde se află pe pagină)
  const wazeHtml = place
    ? `<a id="goNowBtn" class="go-now-btn how-to-get-there-option" href="${escapeHtml(wazeLinkFor(place))}" target="_blank" rel="noopener" hidden>${escapeHtml(t.waze)}</a>`
    : "";
  return `
  <div class="how-to-get-there-block">
    <button type="button" class="how-to-get-there-btn" id="howToGetThereBtn">${escapeHtml(t.btn)}</button>
    <div class="how-to-get-there-panel" id="howToGetTherePanel" hidden>
      ${wazeHtml}
      <a href="${escapeHtml(getTransferLinkFor())}" target="_blank" rel="noopener sponsored" class="how-to-get-there-option">${escapeHtml(t.optionA)}</a>
      <a href="${escapeHtml(omioLinkFor())}" target="_blank" rel="noopener sponsored" class="how-to-get-there-option how-to-get-there-option-alt">${escapeHtml(t.optionB)}</a>
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

function buildListStatusBadgeScript(nonce, statusDataset) {
  return `
<script nonce="${nonce}">
(function(){
  var DATASET = ${safeJson(statusDataset)};
  var badges = document.querySelectorAll(".brand-badge[data-status-key]");
  if (!badges.length) return;

  function pad(n){ return String(n).padStart(2,"0"); }
  function toMinutes(hhmm){ var p = hhmm.split(":"); return (+p[0])*60 + (+p[1]); }
  function mmdd(d){ return pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
  function ymd(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }

  function isOpenNow(entity, now){
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
    badges.forEach(function(badge){
      var key = badge.getAttribute("data-status-key");
      var entity = DATASET[key];
      if (!entity) return;
      var open = isOpenNow(entity, now);
      badge.classList.toggle("status-open", open);
      badge.classList.toggle("status-closed", !open);
    });
  }

  syncAll();
  setInterval(syncAll, 60000); // suficient pentru o listă — nu are nevoie de precizie per-secundă
})();
</script>`;
}

// Widget contextual — arată alternative diferite în funcție de statusul
// LIVE (deschis/închis) al paginii curente. Construit ca 2 blocuri, ambele
// prezente în HTML de la server, comutate vizual de JS (vezi
// buildContextualWidgetScript) — niciodată nu inventăm STATUSUL, doar
// reacționăm la ce e deja calculat, corect, în altă parte a paginii.
const CONTEXTUAL_WIDGET_LABELS_RO = {
  ticketOpen: "🎟️ Vrei să eviți coada? Cumpără bilet online",
  closedAlert: "⚠️ Locația este închisă în acest moment. Iată alternativele tale:",
  booking: "🏨 Cazări active pe Booking, în apropiere",
  restaurants: "🍽️ Restaurante deschise acum, în apropiere",
  glovo: "🛵 Comandă cu Glovo",
  bringo: "🛒 Comandă cu Bringo",
};
// Etichete pentru mall/cinema pe rutele INTL — doar EN+RO (limbile relevante
// pentru RO pe .eu), cu fallback sigur la EN pentru orice altă limbă aleasă,
// ca să nu rupem nimic dacă cineva schimbă limba pe o pagină de mall/cinema.
const MALL_CINEMA_LABELS = {
  uk: {
    shoppingZone: "Shopping zone",
    hypermarketZone: "Hypermarket in the mall",
    mallScheduleTitle: "Mall store hours",
    mallHypermarketTitle: "Mall hypermarket hours",
    cinemaNote: "Movie schedules change daily depending on the week's releases — we don't show a fixed \"open\" or \"closed\" status here, to avoid giving you approximate information.",
    cinemaBtn: "🎬 See today's movie schedule",
  },
  ro: {
    shoppingZone: "Zonă shopping",
    hypermarketZone: "Hipermarket din mall",
    mallScheduleTitle: "Orar magazine mall",
    mallHypermarketTitle: "Program hipermarket din mall",
    cinemaNote: "Programul de filme se schimbă zilnic, în funcție de premierele săptămânii — nu afișăm aici un status fix „deschis” sau „închis”, ca să nu-ți dăm o informație aproximativă.",
    cinemaBtn: "🎬 Vezi orarul filmelor de azi",
  },
};
function mallCinemaLabelsFor(lang) {
  return MALL_CINEMA_LABELS[lang] || MALL_CINEMA_LABELS.uk;
}

const CONTEXTUAL_WIDGET_LABELS_EN = {
  ticketOpen: "🎟️ Want to skip the line? Buy tickets online",
  closedAlert: "⚠️ This place is closed right now. Here are your alternatives:",
  booking: "🏨 Available stays on Booking, nearby",
  restaurants: "🍽️ Restaurants open now, nearby",
  glovo: "🛵 Order with Glovo",
  bringo: "🛒 Order with Bringo",
};

function buildContextualWidgetHtml({ type, name, orasDisplay, labels }) {
  const t = labels || CONTEXTUAL_WIDGET_LABELS_RO;
  const place = orasDisplay || name;

  // biletul s-a mutat sub "Planifică vizita" (buildBookingPlanningButtonsHtml)
  // — nu mai are rost aici, condiționat de status; îl vrei indiferent
  const openContentHtml = "";

  const closedContentHtml =
    type === "attraction"
      ? `<a href="${escapeHtml(bookingSearchLinkFor(place))}" target="_blank" rel="noopener sponsored" class="contextual-widget-btn">${escapeHtml(t.booking)}</a>
         <a href="${escapeHtml(restaurantsOpenNowLinkFor(place))}" target="_blank" rel="noopener" class="contextual-widget-btn contextual-widget-btn-secondary">${escapeHtml(t.restaurants)}</a>`
      : `<a href="${escapeHtml(glovoLinkFor())}" target="_blank" rel="noopener sponsored" class="contextual-widget-btn">${escapeHtml(t.glovo)}</a>
         <a href="${escapeHtml(bringoLinkFor())}" target="_blank" rel="noopener sponsored" class="contextual-widget-btn contextual-widget-btn-secondary">${escapeHtml(t.bringo)}</a>`;

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
function buildAttractionAccordionItem(a, countryCode, cityLabel, isIntlContext) {
  const cityAttr = cityLabel ? ` data-city="${escapeHtml(normalizeSlug(cityLabel))}"` : "";
  const slug = toDbSlug(a.name);
  const detailHref = isIntlContext ? `/${countryCode}/obiectiv/${slug}` : `/obiectiv/${slug}`;
  return `<li class="attraction-accordion-item"${cityAttr}>
    <div class="attraction-accordion-header-row">
      <button type="button" class="fav-star" data-name="${escapeHtml(a.name)}" data-type="attraction" data-country="${escapeHtml(countryCode)}" data-href="${escapeHtml(detailHref)}">☆</button>
      <button type="button" class="attraction-accordion-header" aria-expanded="false">
        <span class="attraction-name">${escapeHtml(a.name)}${cityLabel ? ` <span class="attraction-city-tag">· ${escapeHtml(cityLabel)}</span>` : ""}</span>
        <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
    </div>
    <div class="attraction-accordion-panel" hidden>
      <a href="${escapeHtml(detailHref)}" class="accordion-status-link">🕐 Vezi dacă e deschis acum, live</a>
      <div class="gyg-widget-fallback"><a href="${escapeHtml(ticketUrlFor(a.name))}" target="_blank" rel="noopener sponsored" class="accordion-ticket-btn">🎟️ Rezervă bilet online</a></div>
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
  altex: linkAfiliatAltex,
  flanco: "",
  dm: "",
  drmax: "",
  farmaciatei: "",
  remedia: "",
  springpharma: "",
  catena: "",
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

/* ============================================================
   0.7) MULTILINGV — extindere internațională (DE/UK/ES)
   Paginile din România (RO) folosesc în continuare textele RO,
   scrise direct în funcțiile de randare — NU au fost atinse, ca să
   nu riscăm nimic din ce funcționează deja. Traducerile de mai jos
   alimentează DOAR paginile noi /:tara(de|uk|es|fr|it|pl|nl|at|be|dk|ro|se|pt|cz|fi|gr|hu|hr)/... .
   "{time}" și "{label}" din stringurile de status sunt înlocuite
   dinamic, în JS-ul din telefonul vizitatorului (vezi buildClientScript).
   ============================================================ */
const TRANSLATIONS = {
  ro: {
    dayNames: ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"],
    home: "Acasă",
    todayLabel: "Azi",
    calculating: "Se calculează programul...",
    weeklyTitle: "Program săptămânal",
    holidaysTitle: "Program de sărbători",
    noHolidays: "Fără program special momentan",
    closedWord: "Închis",
    installBtn: "📱 Instalează aplicația pentru acces rapid",
    iosHint: "Pe iPhone: apasă pe butonul de Partajare (Share) și selectează „Adaugă pe ecranul de pornire”.",
    geoSuggestionPrefix: "📍 Orașul tău pare să fie",
    geoSuggestionBtn: "Vrei să vezi magazinele de aici? →",
    geoSuggestionNote: "Nu e orașul tău? Alege mai jos.",
    amazonBtn: "🛍️ Vezi ofertele de azi pe Amazon",
    ticketBtn: "🎟️ Rezervă bilet online și evită coada",
    tabStores: "🛒 Magazine",
    tabAttractions: "🏛️ Obiective Turistice",
    attractionsComingSoon: "Ghidul de obiective turistice este în lucru — revino curând.",
    titleTemplate: (brand, city) => `Program ${brand} ${city} Azi – Deschis sau Închis Acum`,
    descriptionTemplate: (brand, city) => `Vezi acum dacă ${brand} din ${city} este deschis. Program pe zile ale săptămânii și program de sărbători, actualizat live.`,
    disclaimer: (name) => `Programul afișat pentru ${name} este orientativ, pe baza orarului standard anunțat de rețea. Unele locații pot avea ore diferite — verifică programul afișat la intrarea magazinului.`,
    footer: (name) => `îți arată în timp real dacă ${name} este deschis chiar acum, plus programul complet pe zile și programul special de sărbători legale.`,
    labels: {
      openNow: "DESCHIS ACUM",
      closedNow: "ÎNCHIS ACUM",
      closedHoliday: "Închis astăzi — {label}",
      closedAllDay: "Închis toată ziua",
      opensToday: "Se deschide azi la {time}",
      closedComeBack: "S-a închis la {time} — revino mâine",
      closesToday: "Se închide azi la {time}",
    },
  },
  de: {
    dayNames: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    home: "Startseite",
    todayLabel: "Heute",
    calculating: "Öffnungszeiten werden berechnet...",
    weeklyTitle: "Wöchentliche Öffnungszeiten",
    holidaysTitle: "Feiertagsöffnungszeiten",
    noHolidays: "Derzeit keine besonderen Öffnungszeiten",
    closedWord: "Geschlossen",
    installBtn: "📱 App für schnellen Zugriff installieren",
    iosHint: "Auf dem iPhone: Tippen Sie auf „Teilen” und wählen Sie „Zum Home-Bildschirm”.",
    geoSuggestionPrefix: "📍 Ihre Stadt scheint zu sein",
    geoSuggestionBtn: "Geschäfte hier anzeigen? →",
    geoSuggestionNote: "Nicht Ihre Stadt? Unten auswählen.",
    amazonBtn: "🛍️ Heutige Angebote bei Amazon ansehen",
    ticketBtn: "🎟️ Tickets online buchen",
    tabStores: "🛒 Geschäfte",
    tabAttractions: "🏛️ Sehenswürdigkeiten",
    attractionsComingSoon: "Der Sehenswürdigkeiten-Guide wird gerade erstellt — schauen Sie bald wieder vorbei.",
    titleTemplate: (brand, city) => `Öffnungszeiten ${brand} ${city} Heute – Geöffnet oder Geschlossen`,
    descriptionTemplate: (brand, city) => `Prüfen Sie jetzt, ob ${brand} in ${city} geöffnet ist. Wöchentliche Öffnungszeiten und Feiertagszeiten, live aktualisiert.`,
    disclaimer: (name) => `Die angezeigten Öffnungszeiten für ${name} sind Richtwerte, basierend auf den Standardzeiten der Kette. Einzelne Filialen können abweichen — bitte prüfen Sie die vor Ort angegebenen Öffnungszeiten.`,
    footer: (name) => `zeigt Ihnen in Echtzeit, ob ${name} gerade geöffnet ist, sowie die vollständigen wöchentlichen Öffnungszeiten und Feiertagszeiten.`,
    labels: {
      openNow: "JETZT GEÖFFNET",
      closedNow: "JETZT GESCHLOSSEN",
      closedHoliday: "Heute geschlossen — {label}",
      closedAllDay: "Ganztägig geschlossen",
      opensToday: "Öffnet heute um {time} Uhr",
      closedComeBack: "Hat um {time} Uhr geschlossen — morgen wieder da",
      closesToday: "Schließt heute um {time} Uhr",
    },
  },
  uk: {
    dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    home: "Home",
    todayLabel: "Today",
    calculating: "Calculating opening hours...",
    weeklyTitle: "Weekly Opening Hours",
    holidaysTitle: "Holiday Opening Hours",
    noHolidays: "No special hours at the moment",
    closedWord: "Closed",
    installBtn: "📱 Install the app for quick access",
    iosHint: "On iPhone: tap the Share button and select \"Add to Home Screen\".",
    geoSuggestionPrefix: "📍 Your city appears to be",
    geoSuggestionBtn: "Want to see shops here? →",
    geoSuggestionNote: "Not your city? Choose below.",
    amazonBtn: "🛍️ Check today's deals on Amazon",
    ticketBtn: "🎟️ Book tickets online & skip the line",
    tabStores: "🛒 Stores",
    tabAttractions: "🏛️ Attractions",
    attractionsComingSoon: "Our attractions guide is on its way — check back soon.",
    titleTemplate: (brand, city) => `${brand} ${city} Opening Hours Today – Open or Closed Now`,
    descriptionTemplate: (brand, city) => `Check now whether ${brand} in ${city} is open. Weekly opening hours and holiday hours, updated live.`,
    disclaimer: (name) => `Opening hours shown for ${name} are indicative, based on the chain's standard hours. Individual branches may vary — please check the hours posted at the store entrance.`,
    footer: (name) => `shows you in real time whether ${name} is currently open, plus full weekly opening hours and holiday hours.`,
    labels: {
      openNow: "OPEN NOW",
      closedNow: "CLOSED NOW",
      closedHoliday: "Closed today — {label}",
      closedAllDay: "Closed all day",
      opensToday: "Opens today at {time}",
      closedComeBack: "Closed at {time} — come back tomorrow",
      closesToday: "Closes today at {time}",
    },
  },
  es: {
    dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    home: "Inicio",
    todayLabel: "Hoy",
    calculating: "Calculando el horario...",
    weeklyTitle: "Horario semanal",
    holidaysTitle: "Horario de festivos",
    noHolidays: "Sin horario especial por el momento",
    closedWord: "Cerrado",
    installBtn: "📱 Instala la app para acceso rápido",
    iosHint: "En iPhone: toca el botón Compartir y selecciona «Añadir a pantalla de inicio».",
    geoSuggestionPrefix: "📍 Tu ciudad parece ser",
    geoSuggestionBtn: "¿Quieres ver las tiendas de aquí? →",
    geoSuggestionNote: "¿No es tu ciudad? Elige abajo.",
    amazonBtn: "🛍️ Ver las ofertas de hoy en Amazon",
    ticketBtn: "🎟️ Reserva entradas online y evita la cola",
    tabStores: "🛒 Tiendas",
    tabAttractions: "🏛️ Atracciones",
    attractionsComingSoon: "Nuestra guía de atracciones está en camino — vuelve pronto.",
    titleTemplate: (brand, city) => `Horario ${brand} ${city} Hoy – Abierto o Cerrado Ahora`,
    descriptionTemplate: (brand, city) => `Comprueba ahora si ${brand} en ${city} está abierto. Horario semanal y horario de festivos, actualizado en vivo.`,
    disclaimer: (name) => `El horario mostrado para ${name} es orientativo, según el horario estándar de la cadena. Cada tienda puede variar — comprueba el horario indicado en la entrada.`,
    footer: (name) => `te muestra en tiempo real si ${name} está abierto ahora mismo, además del horario semanal completo y el horario de festivos.`,
    labels: {
      openNow: "ABIERTO AHORA",
      closedNow: "CERRADO AHORA",
      closedHoliday: "Cerrado hoy — {label}",
      closedAllDay: "Cerrado todo el día",
      opensToday: "Abre hoy a las {time}",
      closedComeBack: "Cerró a las {time} — vuelve mañana",
      closesToday: "Cierra hoy a las {time}",
    },
  },
  fr: {
    dayNames: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
    home: "Accueil",
    todayLabel: "Aujourd'hui",
    calculating: "Calcul des horaires...",
    weeklyTitle: "Horaires hebdomadaires",
    holidaysTitle: "Horaires des jours fériés",
    noHolidays: "Aucun horaire spécial pour le moment",
    closedWord: "Fermé",
    installBtn: "📱 Installer l'application pour un accès rapide",
    iosHint: "Sur iPhone : appuyez sur le bouton Partager et sélectionnez « Sur l'écran d'accueil ».",
    geoSuggestionPrefix: "📍 Votre ville semble être",
    geoSuggestionBtn: "Voir les magasins ici ? →",
    geoSuggestionNote: "Ce n'est pas votre ville ? Choisissez ci-dessous.",
    amazonBtn: "🛍️ Voir les offres du jour sur Amazon",
    ticketBtn: "🎟️ Réservez vos billets en ligne et évitez la file d'attente",
    tabStores: "🛒 Magasins",
    tabAttractions: "🏛️ Attractions",
    attractionsComingSoon: "Notre guide des attractions arrive bientôt — revenez vite.",
    titleTemplate: (brand, city) => `Horaires ${brand} ${city} Aujourd'hui – Ouvert ou Fermé`,
    descriptionTemplate: (brand, city) => `Vérifiez maintenant si ${brand} à ${city} est ouvert. Horaires hebdomadaires et horaires des jours fériés, mis à jour en direct.`,
    disclaimer: (name) => `Les horaires affichés pour ${name} sont indicatifs, basés sur les horaires standards de l'enseigne. Chaque magasin peut varier — vérifiez les horaires affichés à l'entrée.`,
    footer: (name) => `vous montre en temps réel si ${name} est actuellement ouvert, ainsi que les horaires hebdomadaires complets et les horaires des jours fériés.`,
    labels: {
      openNow: "OUVERT MAINTENANT",
      closedNow: "FERMÉ MAINTENANT",
      closedHoliday: "Fermé aujourd'hui — {label}",
      closedAllDay: "Fermé toute la journée",
      opensToday: "Ouvre aujourd'hui à {time}",
      closedComeBack: "Fermé à {time} — revenez demain",
      closesToday: "Ferme aujourd'hui à {time}",
    },
  },
  it: {
    dayNames: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"],
    home: "Home",
    todayLabel: "Oggi",
    calculating: "Calcolo degli orari in corso...",
    weeklyTitle: "Orari settimanali",
    holidaysTitle: "Orari festivi",
    noHolidays: "Nessun orario speciale al momento",
    closedWord: "Chiuso",
    installBtn: "📱 Installa l'app per un accesso rapido",
    iosHint: "Su iPhone: tocca il pulsante Condividi e seleziona «Aggiungi alla schermata Home».",
    geoSuggestionPrefix: "📍 La tua città sembra essere",
    geoSuggestionBtn: "Vuoi vedere i negozi qui? →",
    geoSuggestionNote: "Non è la tua città? Scegli qui sotto.",
    amazonBtn: "🛍️ Vedi le offerte di oggi su Amazon",
    ticketBtn: "🎟️ Prenota i biglietti online e salta la fila",
    tabStores: "🛒 Negozi",
    tabAttractions: "🏛️ Attrazioni",
    attractionsComingSoon: "La nostra guida alle attrazioni sta arrivando — torna presto.",
    titleTemplate: (brand, city) => `Orari ${brand} ${city} Oggi – Aperto o Chiuso Ora`,
    descriptionTemplate: (brand, city) => `Scopri subito se ${brand} a ${city} è aperto. Orari settimanali e festivi, aggiornati in tempo reale.`,
    disclaimer: (name) => `Gli orari mostrati per ${name} sono indicativi, basati sugli orari standard della catena. Ogni punto vendita può variare — verifica gli orari esposti all'ingresso.`,
    footer: (name) => `ti mostra in tempo reale se ${name} è attualmente aperto, oltre agli orari settimanali completi e agli orari festivi.`,
    labels: {
      openNow: "APERTO ORA",
      closedNow: "CHIUSO ORA",
      closedHoliday: "Chiuso oggi — {label}",
      closedAllDay: "Chiuso tutto il giorno",
      opensToday: "Apre oggi alle {time}",
      closedComeBack: "Ha chiuso alle {time} — torna domani",
      closesToday: "Chiude oggi alle {time}",
    },
  },
  pl: {
    dayNames: ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"],
    home: "Strona główna",
    todayLabel: "Dziś",
    calculating: "Obliczanie godzin otwarcia...",
    weeklyTitle: "Godziny otwarcia w tygodniu",
    holidaysTitle: "Godziny otwarcia w święta",
    noHolidays: "Brak specjalnych godzin w tej chwili",
    closedWord: "Zamknięte",
    installBtn: "📱 Zainstaluj aplikację, aby uzyskać szybki dostęp",
    iosHint: "Na iPhonie: dotknij przycisku Udostępnij i wybierz „Dodaj do ekranu początkowego”.",
    geoSuggestionPrefix: "📍 Wygląda na to, że jesteś w",
    geoSuggestionBtn: "Zobaczyć sklepy tutaj? →",
    geoSuggestionNote: "To nie twoje miasto? Wybierz poniżej.",
    amazonBtn: "🛍️ Zobacz dzisiejsze oferty na Amazon",
    ticketBtn: "🎟️ Zarezerwuj bilety online i unikaj kolejki",
    tabStores: "🛒 Sklepy",
    tabAttractions: "🏛️ Atrakcje",
    attractionsComingSoon: "Nasz przewodnik po atrakcjach już wkrótce — zajrzyj ponownie.",
    titleTemplate: (brand, city) => `Godziny otwarcia ${brand} ${city} Dziś – Otwarte czy Zamknięte`,
    descriptionTemplate: (brand, city) => `Sprawdź teraz, czy ${brand} w ${city} jest otwarte. Godziny w tygodniu i święta, aktualizowane na żywo.`,
    disclaimer: (name) => `Podane godziny otwarcia dla ${name} mają charakter orientacyjny, na podstawie standardowych godzin sieci. Poszczególne sklepy mogą się różnić — sprawdź godziny podane przy wejściu.`,
    footer: (name) => `pokazuje w czasie rzeczywistym, czy ${name} jest obecnie otwarte, a także pełne godziny otwarcia w tygodniu i święta.`,
    labels: {
      openNow: "OTWARTE TERAZ",
      closedNow: "ZAMKNIĘTE TERAZ",
      closedHoliday: "Dziś zamknięte — {label}",
      closedAllDay: "Zamknięte cały dzień",
      opensToday: "Otwiera się dziś o {time}",
      closedComeBack: "Zamknięte od {time} — wróć jutro",
      closesToday: "Zamyka się dziś o {time}",
    },
  },
  nl: {
    dayNames: ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"],
    home: "Home",
    todayLabel: "Vandaag",
    calculating: "Openingstijden worden berekend...",
    weeklyTitle: "Openingstijden per week",
    holidaysTitle: "Openingstijden feestdagen",
    noHolidays: "Op dit moment geen speciale openingstijden",
    closedWord: "Gesloten",
    installBtn: "📱 Installeer de app voor snelle toegang",
    iosHint: "Op iPhone: tik op Delen en kies «Zet op beginscherm».",
    geoSuggestionPrefix: "📍 Uw stad lijkt te zijn",
    geoSuggestionBtn: "Winkels hier bekijken? →",
    geoSuggestionNote: "Niet uw stad? Kies hieronder.",
    amazonBtn: "🛍️ Bekijk de aanbiedingen van vandaag op Amazon",
    ticketBtn: "🎟️ Boek tickets online en sla de wachtrij over",
    tabStores: "🛒 Winkels",
    tabAttractions: "🏛️ Attracties",
    attractionsComingSoon: "Onze attractiegids komt eraan — kom snel terug.",
    titleTemplate: (brand, city) => `Openingstijden ${brand} ${city} Vandaag – Open of Gesloten`,
    descriptionTemplate: (brand, city) => `Bekijk nu of ${brand} in ${city} open is. Wekelijkse openingstijden en feestdagen, live bijgewerkt.`,
    disclaimer: (name) => `De getoonde openingstijden voor ${name} zijn indicatief, gebaseerd op de standaardtijden van de keten. Individuele winkels kunnen afwijken — controleer de tijden bij de ingang.`,
    footer: (name) => `laat u in real time zien of ${name} nu open is, plus de volledige wekelijkse openingstijden en feestdagen.`,
    labels: {
      openNow: "NU GEOPEND",
      closedNow: "NU GESLOTEN",
      closedHoliday: "Vandaag gesloten — {label}",
      closedAllDay: "De hele dag gesloten",
      opensToday: "Opent vandaag om {time}",
      closedComeBack: "Gesloten sinds {time} — kom morgen terug",
      closesToday: "Sluit vandaag om {time}",
    },
  },
  da: {
    dayNames: ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"],
    home: "Hjem",
    todayLabel: "I dag",
    calculating: "Beregner åbningstider...",
    weeklyTitle: "Ugentlige åbningstider",
    holidaysTitle: "Åbningstider på helligdage",
    noHolidays: "Ingen særlige åbningstider lige nu",
    closedWord: "Lukket",
    installBtn: "📱 Installer appen for hurtig adgang",
    iosHint: "På iPhone: tryk på Del-knappen og vælg \"Føj til hjemmeskærm\".",
    geoSuggestionPrefix: "📍 Din by ser ud til at være",
    geoSuggestionBtn: "Vil du se butikker her? →",
    geoSuggestionNote: "Ikke din by? Vælg nedenfor.",
    amazonBtn: "🛍️ Se dagens tilbud på Amazon",
    ticketBtn: "🎟️ Bestil billetter online og undgå køen",
    tabStores: "🛒 Butikker",
    tabAttractions: "🏛️ Seværdigheder",
    attractionsComingSoon: "Vores guide til seværdigheder er på vej — kig forbi snart igen.",
    titleTemplate: (brand, city) => `${brand} ${city} Åbningstider I Dag – Åbent eller Lukket Nu`,
    descriptionTemplate: (brand, city) => `Tjek nu om ${brand} i ${city} har åbent. Ugentlige åbningstider og helligdagsåbningstider, opdateret live.`,
    disclaimer: (name) => `De viste åbningstider for ${name} er vejledende, baseret på kædens standardtider. De enkelte butikker kan variere — tjek åbningstiderne ved indgangen.`,
    footer: (name) => `viser dig i realtid, om ${name} har åbent lige nu, samt fulde ugentlige åbningstider og helligdagsåbningstider.`,
    labels: {
      openNow: "ÅBENT NU",
      closedNow: "LUKKET NU",
      closedHoliday: "Lukket i dag — {label}",
      closedAllDay: "Lukket hele dagen",
      opensToday: "Åbner i dag kl. {time}",
      closedComeBack: "Lukkede kl. {time} — kom igen i morgen",
      closesToday: "Lukker i dag kl. {time}",
    },
  },
  se: {
    dayNames: ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"],
    home: "Hem",
    todayLabel: "Idag",
    calculating: "Beräknar öppettider...",
    weeklyTitle: "Veckans öppettider",
    holidaysTitle: "Öppettider på helgdagar",
    noHolidays: "Inga särskilda öppettider just nu",
    closedWord: "Stängt",
    installBtn: "📱 Installera appen för snabb åtkomst",
    iosHint: "På iPhone: tryck på Dela-knappen och välj \"Lägg till på hemskärmen\".",
    geoSuggestionPrefix: "📍 Din stad verkar vara",
    geoSuggestionBtn: "Vill du se butiker här? →",
    geoSuggestionNote: "Inte din stad? Välj nedan.",
    amazonBtn: "🛍️ Se dagens erbjudanden på Amazon",
    ticketBtn: "🎟️ Boka biljetter online och undvik kön",
    tabStores: "🛒 Butiker",
    tabAttractions: "🏛️ Sevärdheter",
    attractionsComingSoon: "Vår guide till sevärdheter är på väg — kom tillbaka snart.",
    titleTemplate: (brand, city) => `${brand} ${city} Öppettider Idag – Öppet eller Stängt Nu`,
    descriptionTemplate: (brand, city) => `Kolla nu om ${brand} i ${city} har öppet. Veckans öppettider och öppettider på helgdagar, uppdaterat i realtid.`,
    disclaimer: (name) => `De visade öppettiderna för ${name} är vägledande, baserade på kedjans standardtider. Enskilda butiker kan variera — kontrollera öppettiderna vid entrén.`,
    footer: (name) => `visar dig i realtid om ${name} har öppet just nu, samt fullständiga veckoöppettider och öppettider på helgdagar.`,
    labels: {
      openNow: "ÖPPET NU",
      closedNow: "STÄNGT NU",
      closedHoliday: "Stängt idag — {label}",
      closedAllDay: "Stängt hela dagen",
      opensToday: "Öppnar idag kl. {time}",
      closedComeBack: "Stängde kl. {time} — kom tillbaka imorgon",
      closesToday: "Stänger idag kl. {time}",
    },
  },
  pt: {
    dayNames: ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
    home: "Início",
    todayLabel: "Hoje",
    calculating: "A calcular horários...",
    weeklyTitle: "Horário semanal",
    holidaysTitle: "Horário em feriados",
    noHolidays: "Sem horários especiais neste momento",
    closedWord: "Fechado",
    installBtn: "📱 Instalar a app para acesso rápido",
    iosHint: "No iPhone: toque no botão Partilhar e escolha \"Adicionar ao ecrã principal\".",
    geoSuggestionPrefix: "📍 A sua cidade parece ser",
    geoSuggestionBtn: "Ver lojas aqui? →",
    geoSuggestionNote: "Não é a sua cidade? Escolha abaixo.",
    amazonBtn: "🛍️ Ver ofertas de hoje na Amazon",
    ticketBtn: "🎟️ Compre bilhetes online e evite a fila",
    tabStores: "🛒 Lojas",
    tabAttractions: "🏛️ Pontos turísticos",
    attractionsComingSoon: "O nosso guia de pontos turísticos está a caminho — volte em breve.",
    titleTemplate: (brand, city) => `${brand} ${city} Horário Hoje – Aberto ou Fechado Agora`,
    descriptionTemplate: (brand, city) => `Veja agora se ${brand} em ${city} está aberto. Horário semanal e horário de feriados, atualizado em tempo real.`,
    disclaimer: (name) => `Os horários apresentados para ${name} são indicativos, com base no horário padrão da cadeia. Lojas individuais podem variar — confirme o horário à entrada.`,
    footer: (name) => `mostra-lhe em tempo real se ${name} está aberto agora, além do horário semanal completo e do horário de feriados.`,
    labels: {
      openNow: "ABERTO AGORA",
      closedNow: "FECHADO AGORA",
      closedHoliday: "Fechado hoje — {label}",
      closedAllDay: "Fechado o dia todo",
      opensToday: "Abre hoje às {time}",
      closedComeBack: "Fechou às {time} — volte amanhã",
      closesToday: "Fecha hoje às {time}",
    },
  },
  cz: {
    dayNames: ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"],
    home: "Domů",
    todayLabel: "Dnes",
    calculating: "Počítání otevírací doby...",
    weeklyTitle: "Otevírací doba v týdnu",
    holidaysTitle: "Otevírací doba o svátcích",
    noHolidays: "Momentálně žádná zvláštní otevírací doba",
    closedWord: "Zavřeno",
    installBtn: "📱 Nainstalovat aplikaci pro rychlý přístup",
    iosHint: "Na iPhonu: klepněte na tlačítko Sdílet a vyberte \"Přidat na plochu\".",
    geoSuggestionPrefix: "📍 Vaše město je pravděpodobně",
    geoSuggestionBtn: "Zobrazit obchody zde? →",
    geoSuggestionNote: "Není to vaše město? Vyberte níže.",
    amazonBtn: "🛍️ Zobrazit dnešní nabídky na Amazonu",
    ticketBtn: "🎟️ Koupit vstupenky online a vyhnout se frontě",
    tabStores: "🛒 Obchody",
    tabAttractions: "🏛️ Zajímavosti",
    attractionsComingSoon: "Náš průvodce zajímavostmi je na cestě — brzy se vraťte.",
    titleTemplate: (brand, city) => `${brand} ${city} Otevírací Doba Dnes – Otevřeno nebo Zavřeno`,
    descriptionTemplate: (brand, city) => `Zjistěte, zda je ${brand} v ${city} nyní otevřeno. Otevírací doba v týdnu a o svátcích, aktualizováno v reálném čase.`,
    disclaimer: (name) => `Zobrazená otevírací doba pro ${name} je orientační, na základě standardní doby řetězce. Jednotlivé prodejny se mohou lišit — ověřte otevírací dobu u vchodu.`,
    footer: (name) => `vám v reálném čase ukazuje, zda je ${name} nyní otevřeno, plus úplnou týdenní otevírací dobu a otevírací dobu o svátcích.`,
    labels: {
      openNow: "OTEVŘENO",
      closedNow: "ZAVŘENO",
      closedHoliday: "Dnes zavřeno — {label}",
      closedAllDay: "Zavřeno celý den",
      opensToday: "Dnes otevírá v {time}",
      closedComeBack: "Zavřeno od {time} — přijďte zítra",
      closesToday: "Dnes zavírá v {time}",
    },
  },
  fi: {
    dayNames: ["Sunnuntai", "Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai", "Lauantai"],
    home: "Koti",
    todayLabel: "Tänään",
    calculating: "Lasketaan aukioloaikoja...",
    weeklyTitle: "Viikoittaiset aukioloajat",
    holidaysTitle: "Aukioloajat pyhäpäivinä",
    noHolidays: "Ei erityisiä aukioloaikoja juuri nyt",
    closedWord: "Suljettu",
    installBtn: "📱 Asenna sovellus nopeaa käyttöä varten",
    iosHint: "iPhonessa: napauta Jaa-painiketta ja valitse \"Lisää Koti-valikkoon\".",
    geoSuggestionPrefix: "📍 Kaupunkisi näyttäisi olevan",
    geoSuggestionBtn: "Näytä kaupat täällä? →",
    geoSuggestionNote: "Eikö tämä ole kaupunkisi? Valitse alta.",
    amazonBtn: "🛍️ Katso päivän tarjoukset Amazonissa",
    ticketBtn: "🎟️ Osta liput verkossa ja vältä jono",
    tabStores: "🛒 Kaupat",
    tabAttractions: "🏛️ Nähtävyydet",
    attractionsComingSoon: "Nähtävyysoppaamme on tulossa — käy pian uudelleen.",
    titleTemplate: (brand, city) => `${brand} ${city} Aukioloajat Tänään – Auki tai Kiinni Nyt`,
    descriptionTemplate: (brand, city) => `Tarkista nyt, onko ${brand} kaupungissa ${city} auki. Viikoittaiset aukioloajat ja pyhäpäivien aukioloajat, päivitetty reaaliajassa.`,
    disclaimer: (name) => `Näytetyt aukioloajat kohteelle ${name} ovat suuntaa-antavia, perustuen ketjun vakioaikoihin. Yksittäiset myymälät voivat vaihdella — tarkista aukioloajat sisäänkäynniltä.`,
    footer: (name) => `näyttää sinulle reaaliajassa, onko ${name} auki juuri nyt, sekä täydet viikoittaiset aukioloajat ja pyhäpäivien aukioloajat.`,
    labels: {
      openNow: "AUKI NYT",
      closedNow: "KIINNI NYT",
      closedHoliday: "Kiinni tänään — {label}",
      closedAllDay: "Kiinni koko päivän",
      opensToday: "Avautuu tänään klo {time}",
      closedComeBack: "Sulkeutui klo {time} — tule takaisin huomenna",
      closesToday: "Sulkeutuu tänään klo {time}",
    },
  },
  gr: {
    dayNames: ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"],
    home: "Αρχική",
    todayLabel: "Σήμερα",
    calculating: "Υπολογισμός ωραρίου...",
    weeklyTitle: "Εβδομαδιαίο ωράριο",
    holidaysTitle: "Ωράριο αργιών",
    noHolidays: "Κανένα ειδικό ωράριο αυτή τη στιγμή",
    closedWord: "Κλειστό",
    installBtn: "📱 Εγκατάσταση εφαρμογής για γρήγορη πρόσβαση",
    iosHint: "Στο iPhone: πατήστε το κουμπί Κοινοποίηση και επιλέξτε \"Προσθήκη στην Αρχική Οθόνη\".",
    geoSuggestionPrefix: "📍 Η πόλη σας φαίνεται να είναι",
    geoSuggestionBtn: "Δείτε καταστήματα εδώ; →",
    geoSuggestionNote: "Δεν είναι η πόλη σας; Επιλέξτε παρακάτω.",
    amazonBtn: "🛍️ Δείτε τις σημερινές προσφορές στο Amazon",
    ticketBtn: "🎟️ Αγοράστε εισιτήρια online και αποφύγετε την ουρά",
    tabStores: "🛒 Καταστήματα",
    tabAttractions: "🏛️ Αξιοθέατα",
    attractionsComingSoon: "Ο οδηγός αξιοθέατων μας έρχεται σύντομα — περάστε ξανά.",
    titleTemplate: (brand, city) => `${brand} ${city} Ωράριο Σήμερα – Ανοιχτό ή Κλειστό Τώρα`,
    descriptionTemplate: (brand, city) => `Δείτε τώρα αν το ${brand} στην ${city} είναι ανοιχτό. Εβδομαδιαίο ωράριο και ωράριο αργιών, ενημερωμένο σε πραγματικό χρόνο.`,
    disclaimer: (name) => `Το εμφανιζόμενο ωράριο για ${name} είναι ενδεικτικό, με βάση το τυπικό ωράριο της αλυσίδας. Μεμονωμένα καταστήματα ενδέχεται να διαφέρουν — επιβεβαιώστε το ωράριο στην είσοδο.`,
    footer: (name) => `σας δείχνει σε πραγματικό χρόνο αν το ${name} είναι ανοιχτό αυτή τη στιγμή, καθώς και το πλήρες εβδομαδιαίο ωράριο και το ωράριο αργιών.`,
    labels: {
      openNow: "ΑΝΟΙΧΤΟ ΤΩΡΑ",
      closedNow: "ΚΛΕΙΣΤΟ ΤΩΡΑ",
      closedHoliday: "Κλειστό σήμερα — {label}",
      closedAllDay: "Κλειστό όλη τη μέρα",
      opensToday: "Ανοίγει σήμερα στις {time}",
      closedComeBack: "Έκλεισε στις {time} — επιστρέψτε αύριο",
      closesToday: "Κλείνει σήμερα στις {time}",
    },
  },
  hu: {
    dayNames: ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"],
    home: "Kezdőlap",
    todayLabel: "Ma",
    calculating: "Nyitvatartás számítása...",
    weeklyTitle: "Heti nyitvatartás",
    holidaysTitle: "Nyitvatartás ünnepnapokon",
    noHolidays: "Jelenleg nincs speciális nyitvatartás",
    closedWord: "Zárva",
    installBtn: "📱 Telepítse az alkalmazást a gyors eléréshez",
    iosHint: "iPhone-on: koppintson a Megosztás gombra, majd válassza a \"Hozzáadás a kezdőképernyőhöz\" lehetőséget.",
    geoSuggestionPrefix: "📍 Úgy tűnik, az Ön városa",
    geoSuggestionBtn: "Boltok megjelenítése itt? →",
    geoSuggestionNote: "Nem ez az Ön városa? Válasszon alább.",
    amazonBtn: "🛍️ Nézze meg a mai Amazon ajánlatokat",
    ticketBtn: "🎟️ Vásároljon jegyet online, és kerülje el a sort",
    tabStores: "🛒 Üzletek",
    tabAttractions: "🏛️ Látnivalók",
    attractionsComingSoon: "A látnivaló-útmutatónk hamarosan érkezik — nézzen vissza később.",
    titleTemplate: (brand, city) => `${brand} ${city} Nyitvatartás Ma – Nyitva vagy Zárva Most`,
    descriptionTemplate: (brand, city) => `Nézze meg most, hogy a ${brand} ${city} városban nyitva van-e. Heti nyitvatartás és ünnepnapi nyitvatartás, valós időben frissítve.`,
    disclaimer: (name) => `A megjelenített nyitvatartás a(z) ${name} esetében tájékoztató jellegű, a lánc standard nyitvatartásán alapul. Az egyes üzletek eltérhetnek — kérjük, ellenőrizze a nyitvatartást a bejáratnál.`,
    footer: (name) => `valós időben mutatja, hogy a(z) ${name} nyitva van-e most, valamint a teljes heti és ünnepnapi nyitvatartást.`,
    labels: {
      openNow: "MOST NYITVA",
      closedNow: "MOST ZÁRVA",
      closedHoliday: "Ma zárva — {label}",
      closedAllDay: "Egész nap zárva",
      opensToday: "Ma {time}-kor nyit",
      closedComeBack: "{time}-kor zárt — jöjjön vissza holnap",
      closesToday: "Ma {time}-kor zár",
    },
  },
  hr: {
    dayNames: ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"],
    home: "Početna",
    todayLabel: "Danas",
    calculating: "Izračun radnog vremena...",
    weeklyTitle: "Tjedno radno vrijeme",
    holidaysTitle: "Radno vrijeme praznicima",
    noHolidays: "Trenutno nema posebnog radnog vremena",
    closedWord: "Zatvoreno",
    installBtn: "📱 Instalirajte aplikaciju za brzi pristup",
    iosHint: "Na iPhoneu: dodirnite gumb Podijeli i odaberite \"Dodaj na početni zaslon\".",
    geoSuggestionPrefix: "📍 Čini se da je vaš grad",
    geoSuggestionBtn: "Prikaži trgovine ovdje? →",
    geoSuggestionNote: "Nije vaš grad? Odaberite ispod.",
    amazonBtn: "🛍️ Pogledajte današnje ponude na Amazonu",
    ticketBtn: "🎟️ Kupite ulaznice online i izbjegnite red",
    tabStores: "🛒 Trgovine",
    tabAttractions: "🏛️ Znamenitosti",
    attractionsComingSoon: "Naš vodič kroz znamenitosti stiže uskoro — svratite ponovno.",
    titleTemplate: (brand, city) => `${brand} ${city} Radno Vrijeme Danas – Otvoreno ili Zatvoreno`,
    descriptionTemplate: (brand, city) => `Provjerite je li ${brand} u gradu ${city} sada otvoren. Tjedno radno vrijeme i radno vrijeme praznicima, ažurirano u stvarnom vremenu.`,
    disclaimer: (name) => `Prikazano radno vrijeme za ${name} je okvirno, temeljeno na standardnom radnom vremenu lanca. Pojedine trgovine mogu se razlikovati — provjerite radno vrijeme na ulazu.`,
    footer: (name) => `prikazuje vam u stvarnom vremenu je li ${name} sada otvoren, kao i potpuno tjedno radno vrijeme i radno vrijeme praznicima.`,
    labels: {
      openNow: "SADA OTVORENO",
      closedNow: "SADA ZATVORENO",
      closedHoliday: "Danas zatvoreno — {label}",
      closedAllDay: "Zatvoreno cijeli dan",
      opensToday: "Danas se otvara u {time}",
      closedComeBack: "Zatvoreno u {time} — dođite sutra",
      closesToday: "Danas se zatvara u {time}",
    },
  },
};

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
const DE_STORE_CONFIG = {
  aldi: { name: "Aldi", weekly: deSupermarketWeekly(), holidays: DE_HOLIDAYS },
  rewe: { name: "Rewe", weekly: deSupermarketWeekly(), holidays: DE_HOLIDAYS },
  edeka: { name: "Edeka", weekly: deSupermarketWeekly(), holidays: DE_HOLIDAYS },
  lidl: { name: "Lidl", weekly: deSupermarketWeekly(), holidays: DE_HOLIDAYS },
  kaufland: { name: "Kaufland", weekly: deSupermarketWeekly(), holidays: DE_HOLIDAYS },
  mediamarkt: { name: "Media Markt", slug: "media-markt", weekly: deSupermarketWeekly(), holidays: DE_HOLIDAYS },
  // Mall-uri reale, verificate — program de mall (L-S 10-20), NU program de supermarket.
  // Toate închise duminica, confirmat: normă respectată aproape universal în Germania.
  mallofberlin: {
    name: "Mall of Berlin",
    slug: "mall-of-berlin",
    weekly: [null, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }],
    holidays: DE_HOLIDAYS,
  },
  centrooberhausen: {
    name: "Westfield CentrO Oberhausen",
    slug: "centro-oberhausen",
    weekly: [null, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }],
    holidays: DE_HOLIDAYS,
  },
  myzeil: {
    name: "MyZeil Frankfurt",
    slug: "myzeil-frankfurt",
    weekly: [null, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }, { open: "10:00", close: "20:00" }],
    holidays: DE_HOLIDAYS,
  },
};

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
const GR_STORE_CONFIG = {
  sklavenitis: { name: "Sklavenitis", weekly: grSupermarketWeekly(), holidays: GR_HOLIDAYS },
  lidl: { name: "Lidl", weekly: grSupermarketWeekly(), holidays: GR_HOLIDAYS },
  abvassilopoulos: { name: "AB Vassilopoulos", slug: "ab-vassilopoulos", weekly: grSupermarketWeekly(), holidays: GR_HOLIDAYS },
  masoutis: { name: "Masoutis", weekly: grSupermarketWeekly(), holidays: GR_HOLIDAYS },
};

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
const UK_STORE_CONFIG = {
  tesco: { name: "Tesco", weekly: ukSupermarketWeekly(), holidays: UK_HOLIDAYS },
  sainsburys: { name: "Sainsbury's", weekly: ukSupermarketWeekly(), holidays: UK_HOLIDAYS },
  asda: { name: "Asda", weekly: ukSupermarketWeekly(), holidays: UK_HOLIDAYS },
  morrisons: { name: "Morrisons", weekly: ukSupermarketWeekly(), holidays: UK_HOLIDAYS },
  boots: { name: "Boots", weekly: ukSupermarketWeekly(), holidays: UK_HOLIDAYS },
  // Mall-uri reale, verificate individual — fiecare cu programul lui real
  // (diferă mai mult decât la supermarketuri, mai ales sâmbăta/duminica).
  westfieldlondon: {
    name: "Westfield London",
    slug: "westfield-london",
    weekly: [
      { open: "12:00", close: "18:00" }, // Sunday
      { open: "10:00", close: "21:00" }, // Monday
      { open: "10:00", close: "21:00" },
      { open: "10:00", close: "21:00" },
      { open: "10:00", close: "21:00" },
      { open: "10:00", close: "21:00" },
      { open: "09:00", close: "21:00" }, // Saturday
    ],
    holidays: UK_HOLIDAYS,
  },
  traffordcentre: {
    name: "Trafford Centre",
    slug: "trafford-centre",
    weekly: [
      { open: "12:00", close: "18:00" },
      { open: "10:00", close: "22:00" },
      { open: "10:00", close: "22:00" },
      { open: "10:00", close: "22:00" },
      { open: "10:00", close: "22:00" },
      { open: "10:00", close: "22:00" },
      { open: "10:00", close: "22:00" },
    ],
    holidays: UK_HOLIDAYS,
  },
  bluewater: {
    name: "Bluewater",
    weekly: [
      { open: "11:00", close: "17:00" },
      { open: "10:00", close: "21:00" },
      { open: "10:00", close: "21:00" },
      { open: "10:00", close: "21:00" },
      { open: "10:00", close: "21:00" },
      { open: "10:00", close: "21:00" },
      { open: "09:00", close: "21:00" },
    ],
    holidays: UK_HOLIDAYS,
  },
};

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
const ES_STORE_CONFIG = {
  mercadona: { name: "Mercadona", weekly: esSupermarketWeekly(), holidays: ES_HOLIDAYS },
  carrefour: { name: "Carrefour", weekly: esSupermarketWeekly(), holidays: ES_HOLIDAYS },
  alcampo: { name: "Alcampo", weekly: esSupermarketWeekly(), holidays: ES_HOLIDAYS },
  elcorteingles: { name: "El Corte Inglés", slug: "el-corte-ingles", weekly: esSupermarketWeekly(), holidays: ES_HOLIDAYS },
  dia: { name: "Dia", weekly: esSupermarketWeekly(), holidays: ES_HOLIDAYS },
  // Mall-uri reale — Xanadú (Madrid) e o excepție notabilă, deschis chiar și
  // duminica tot anul; La Maquinista (Barcelona) urmează regula generală
  // catalană (închis duminica, cu câteva excepții sezoniere, nemodelate aici).
  xanadumadrid: {
    name: "Madrid Xanadú",
    slug: "xanadu-madrid",
    weekly: [
      { open: "10:00", close: "22:00" }, // Domingo
      { open: "10:00", close: "22:00" },
      { open: "10:00", close: "22:00" },
      { open: "10:00", close: "22:00" },
      { open: "10:00", close: "22:00" },
      { open: "10:00", close: "22:00" },
      { open: "10:00", close: "22:00" },
    ],
    holidays: ES_HOLIDAYS,
  },
  lamaquinista: {
    name: "Westfield La Maquinista",
    slug: "la-maquinista",
    weekly: [
      null, // Domingo — închis, cu câteva excepții sezoniere/festive, nemodelate
      { open: "09:00", close: "21:00" },
      { open: "09:00", close: "21:00" },
      { open: "09:00", close: "21:00" },
      { open: "09:00", close: "21:00" },
      { open: "09:00", close: "21:00" },
      { open: "09:00", close: "21:00" },
    ],
    holidays: ES_HOLIDAYS,
  },
};

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
const IT_STORE_CONFIG = {
  esselunga: { name: "Esselunga", weekly: itSupermarketWeekly(), holidays: IT_HOLIDAYS },
  conad: { name: "Conad", weekly: itSupermarketWeekly(), holidays: IT_HOLIDAYS },
  coop: { name: "Coop", weekly: itSupermarketWeekly(), holidays: IT_HOLIDAYS },
  carrefour: { name: "Carrefour", weekly: itSupermarketWeekly(), holidays: IT_HOLIDAYS },
  lidl: { name: "Lidl", weekly: itSupermarketWeekly(), holidays: IT_HOLIDAYS },
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
const BE_STORE_CONFIG = {
  colruyt: { name: "Colruyt", weekly: beSupermarketWeekly(), holidays: BE_HOLIDAYS },
  delhaize: { name: "Delhaize", weekly: beSupermarketWeekly(), holidays: BE_HOLIDAYS },
  carrefour: { name: "Carrefour", weekly: beSupermarketWeekly(), holidays: BE_HOLIDAYS },
  aldi: { name: "Aldi", weekly: beSupermarketWeekly(), holidays: BE_HOLIDAYS },
  lidl: { name: "Lidl", weekly: beSupermarketWeekly(), holidays: BE_HOLIDAYS },
};

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
const COUNTRIES = {
  de: {
    config: DE_STORE_CONFIG,
    t: TRANSLATIONS.de,
    cities: ["Berlin", "München", "Hamburg", "Frankfurt am Main", "Köln", "Stuttgart", "Düsseldorf", "Dortmund", "Leipzig", "Essen"],
  },
  uk: {
    config: UK_STORE_CONFIG,
    t: TRANSLATIONS.uk,
    cities: ["London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Sheffield", "Bristol", "Newcastle", "Nottingham"],
  },
  es: {
    config: ES_STORE_CONFIG,
    t: TRANSLATIONS.es,
    cities: ["Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga", "Murcia", "Palma", "Bilbao"],
  },
  fr: {
    config: FR_STORE_CONFIG,
    t: TRANSLATIONS.fr,
    cities: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille"],
  },
  it: {
    config: IT_STORE_CONFIG,
    t: TRANSLATIONS.it,
    cities: ["Roma", "Milano", "Napoli", "Torino", "Palermo", "Bologna", "Firenze", "Venezia", "Genova", "Verona"],
  },
  pl: {
    config: PL_STORE_CONFIG,
    t: TRANSLATIONS.pl,
    cities: ["Warszawa", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Bydgoszcz", "Lublin", "Katowice"],
  },
  nl: {
    config: NL_STORE_CONFIG,
    t: TRANSLATIONS.nl,
    cities: ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen"],
  },
  // Austria: reutilizează traducerea germană (același standard scris,
  // nicio pierdere de acuratețe pentru textul de interfață) — nu am
  // duplicat un dicționar întreg identic doar de dragul formei.
  at: {
    config: AT_STORE_CONFIG,
    t: TRANSLATIONS.de,
    cities: ["Wien", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels", "Sankt Pölten", "Dornbirn"],
  },
  // Belgia: reutilizează traducerea olandeză (majoritatea populației e
  // vorbitoare de neerlandeză/flamandă) — simplificare declarată, nu o
  // acoperire completă a Valoniei francofone sau a minorității germanofone.
  be: {
    config: BE_STORE_CONFIG,
    t: TRANSLATIONS.nl,
    cities: ["Brussels", "Antwerpen", "Gent", "Charleroi", "Liège", "Brugge", "Namur", "Leuven", "Mons", "Aalst"],
  },
  dk: {
    config: DK_STORE_CONFIG,
    t: TRANSLATIONS.da,
    cities: ["København", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", "Horsens", "Vejle", "Roskilde"],
  },
  se: {
    config: SE_STORE_CONFIG,
    t: TRANSLATIONS.se,
    cities: ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Västerås", "Örebro", "Helsingborg", "Linköping", "Norrköping", "Karlstad"],
  },
  pt: {
    config: PT_STORE_CONFIG,
    t: TRANSLATIONS.pt,
    cities: ["Lisboa", "Porto", "Vila Nova de Gaia", "Amadora", "Braga", "Setúbal", "Coimbra", "Almada", "Faro", "Funchal"],
  },
  cz: {
    config: CZ_STORE_CONFIG,
    t: TRANSLATIONS.cz,
    cities: ["Praha", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "České Budějovice", "Hradec Králové"],
  },
  fi: {
    config: FI_STORE_CONFIG,
    t: TRANSLATIONS.fi,
    cities: ["Helsinki", "Tampere", "Turku", "Oulu", "Jyväskylä", "Kuopio", "Lahti", "Rovaniemi"],
  },
  gr: {
    config: GR_STORE_CONFIG,
    t: TRANSLATIONS.gr,
    cities: ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa", "Volos", "Ioannina", "Chania"],
  },
  hu: {
    config: HU_STORE_CONFIG,
    t: TRANSLATIONS.hu,
    cities: ["Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs", "Győr", "Nyíregyháza", "Kecskemét"],
  },
  hr: {
    config: HR_STORE_CONFIG,
    t: TRANSLATIONS.hr,
    cities: ["Zagreb", "Split", "Rijeka", "Osijek", "Zadar", "Pula", "Dubrovnik", "Šibenik"],
  },
};

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
const ATTRACTIONS = {
  at: [
    { name: "Palatul Schönbrunn Viena", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Schönbrunn+Viena+Austria" },
    { name: "Wurstelprater Viena", url: "https://www.google.com/maps/search/?api=1&query=Wurstelprater+Viena+Austria" },
    { name: "Catedrala Sfântul Ștefan", url: "https://www.google.com/maps/search/?api=1&query=Catedrala+Sfântul+Ștefan+Austria" },
    { name: "Palatul Belvedere Viena", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Belvedere+Viena+Austria" },
    { name: "Muzeul de Istorie a Artei", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+de+Istorie+a+Artei+Austria" },
    { name: "Zoo Schönbrunn", url: "https://www.google.com/maps/search/?api=1&query=Zoo+Schönbrunn+Austria" },
    { name: "Fortăreața Hohensalzburg", url: "https://www.google.com/maps/search/?api=1&query=Fortăreața+Hohensalzburg+Austria" },
    { name: "Muzeul Albertina Viena", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Albertina+Viena+Austria" },
    { name: "Familypark Burgenland", url: "https://www.google.com/maps/search/?api=1&query=Familypark+Burgenland+Austria" },
    { name: "Palatul Hofburg", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Hofburg+Austria" },
    { name: "Alpenzoo Innsbruck", url: "https://www.google.com/maps/search/?api=1&query=Alpenzoo+Innsbruck+Austria" },
    { name: "Lumea Cristalelor Swarovski Wattens", url: "https://www.google.com/maps/search/?api=1&query=Lumea+Cristalelor+Swarovski+Wattens+Austria" },
    { name: "Castelul Ambras Innsbruck", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Ambras+Innsbruck+Austria" },
    { name: "Aqua Terra Zoo Haus des Meeres Viena", url: "https://www.google.com/maps/search/?api=1&query=Aqua+Terra+Zoo+Haus+des+Meeres+Viena+Austria" },
    { name: "MuseumsQuartier Viena", url: "https://www.google.com/maps/search/?api=1&query=MuseumsQuartier+Viena+Austria" },
    { name: "Fortăreața Hohenwerfen", url: "https://www.google.com/maps/search/?api=1&query=Fortăreața+Hohenwerfen+Austria" },
    { name: "Salina Hallstatt", url: "https://www.google.com/maps/search/?api=1&query=Salina+Hallstatt+Austria" },
    { name: "Area 47 Ötztal Outdoor Park", url: "https://www.google.com/maps/search/?api=1&query=Area+47+Ötztal+Outdoor+Park+Austria" },
    { name: "Muzeul Leopold Viena", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Leopold+Viena+Austria" },
    { name: "Casa Natală a lui Mozart Salzburg", url: "https://www.google.com/maps/search/?api=1&query=Casa+Natală+a+lui+Mozart+Salzburg+Austria" },
    { name: "Aquapark Aquapulco", url: "https://www.google.com/maps/search/?api=1&query=Aquapark+Aquapulco+Austria" },
    { name: "Peștera de Gheață Eisriesenwelt", url: "https://www.google.com/maps/search/?api=1&query=Peștera+de+Gheață+Eisriesenwelt+Austria" },
    { name: "Ars Electronica Center", url: "https://www.google.com/maps/search/?api=1&query=Ars+Electronica+Center+Austria" },
  ],
  be: [
    { name: "Atomium Bruxelles", url: "https://www.google.com/maps/search/?api=1&query=Atomium+Bruxelles+Belgium" },
    { name: "Walibi Belgium", url: "https://www.google.com/maps/search/?api=1&query=Walibi+Belgium+Belgium" },
    { name: "Grădina Zoologică Pairi Daiza", url: "https://www.google.com/maps/search/?api=1&query=Grădina+Zoologică+Pairi+Daiza+Belgium" },
    { name: "Mini-Europe Bruxelles", url: "https://www.google.com/maps/search/?api=1&query=Mini-Europe+Bruxelles+Belgium" },
    { name: "Castelul Gravensteen Gent", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Gravensteen+Gent+Belgium" },
    { name: "Plopsaland De Panne", url: "https://www.google.com/maps/search/?api=1&query=Plopsaland+De+Panne+Belgium" },
    { name: "Turnul Belfry din Bruges", url: "https://www.google.com/maps/search/?api=1&query=Turnul+Belfry+din+Bruges+Belgium" },
    { name: "Muzeul Magritte Bruxelles", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Magritte+Bruxelles+Belgium" },
    { name: "Castelul Bouillon", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Bouillon+Belgium" },
    { name: "Aqualibi Belgium", url: "https://www.google.com/maps/search/?api=1&query=Aqualibi+Belgium+Belgium" },
    { name: "Castelul Vêves", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Vêves+Belgium" },
    { name: "Boudewijn Seapark Bruges", url: "https://www.google.com/maps/search/?api=1&query=Boudewijn+Seapark+Bruges+Belgium" },
    { name: "Plopsa Coo Stavelot", url: "https://www.google.com/maps/search/?api=1&query=Plopsa+Coo+Stavelot+Belgium" },
    { name: "Bellewaerde Ieper", url: "https://www.google.com/maps/search/?api=1&query=Bellewaerde+Ieper+Belgium" },
    { name: "Muzeul Regal al Africii Centrale", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Regal+al+Africii+Centrale+Belgium" },
    { name: "Citadela din Namur", url: "https://www.google.com/maps/search/?api=1&query=Citadela+din+Namur+Belgium" },
    { name: "Centrul de Arte Frumoase BOZAR", url: "https://www.google.com/maps/search/?api=1&query=Centrul+de+Arte+Frumoase+BOZAR+Belgium" },
    { name: "Peșterile Han-sur-Lesse", url: "https://www.google.com/maps/search/?api=1&query=Peșterile+Han-sur-Lesse+Belgium" },
    { name: "Plopsaqua Hannut-Landen", url: "https://www.google.com/maps/search/?api=1&query=Plopsaqua+Hannut-Landen+Belgium" },
  ],
  dk: [
    { name: "Grădinile Tivoli Copenhaga", url: "https://www.google.com/maps/search/?api=1&query=Grădinile+Tivoli+Copenhaga+Denmark" },
    { name: "Legoland Billund", url: "https://www.google.com/maps/search/?api=1&query=Legoland+Billund+Denmark" },
    { name: "Fårup Sommerland", url: "https://www.google.com/maps/search/?api=1&query=Fårup+Sommerland+Denmark" },
    { name: "Djurs Sommerland", url: "https://www.google.com/maps/search/?api=1&query=Djurs+Sommerland+Denmark" },
    { name: "Castelul Rosenborg", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Rosenborg+Denmark" },
    { name: "Castelul Kronborg", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Kronborg+Denmark" },
    { name: "Muzeul Național al Danemarcei", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Național+al+Danemarcei+Denmark" },
    { name: "Palatul Amalienborg", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Amalienborg+Denmark" },
    { name: "Tivoli Friheden Aarhus", url: "https://www.google.com/maps/search/?api=1&query=Tivoli+Friheden+Aarhus+Denmark" },
    { name: "Muzeul în aer liber Den Gamle By Aarhus", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+în+aer+liber+Den+Gamle+By+Aarhus+Denmark" },
    { name: "Dyrehavsbakken / Bakken", url: "https://www.google.com/maps/search/?api=1&query=Dyrehavsbakken+/+Bakken+Denmark" },
    { name: "BonBon-Land Holme-Olstrup", url: "https://www.google.com/maps/search/?api=1&query=BonBon-Land+Holme-Olstrup+Denmark" },
    { name: "Ree Park Safari", url: "https://www.google.com/maps/search/?api=1&query=Ree+Park+Safari+Denmark" },
    { name: "Zoo Copenhaga", url: "https://www.google.com/maps/search/?api=1&query=Zoo+Copenhaga+Denmark" },
    { name: "Muzeul de Artă Modernă Louisiana", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+de+Artă+Modernă+Louisiana+Denmark" },
    { name: "Lalandia Aquadome Billund", url: "https://www.google.com/maps/search/?api=1&query=Lalandia+Aquadome+Billund+Denmark" },
    { name: "Muzeul Maritim Esbjerg", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Maritim+Esbjerg+Denmark" },
    { name: "Knuthenborg Safari Park", url: "https://www.google.com/maps/search/?api=1&query=Knuthenborg+Safari+Park+Denmark" },
  ],
  it: [
    { name: "Gardaland Resort", url: "https://www.google.com/maps/search/?api=1&query=Gardaland+Resort+Italy" },
    { name: "Mirabilandia Ravenna", url: "https://www.google.com/maps/search/?api=1&query=Mirabilandia+Ravenna+Italy" },
    { name: "Cinecittà World Roma", url: "https://www.google.com/maps/search/?api=1&query=Cinecittà+World+Roma+Italy" },
    { name: "Colosseumul din Roma", url: "https://www.google.com/maps/search/?api=1&query=Colosseumul+din+Roma+Italy" },
    { name: "Muzeele Vaticane", url: "https://www.google.com/maps/search/?api=1&query=Muzeele+Vaticane+Italy" },
    { name: "Catedrala din Milano", url: "https://www.google.com/maps/search/?api=1&query=Catedrala+din+Milano+Italy" },
    { name: "Turnul înclinat din Pisa", url: "https://www.google.com/maps/search/?api=1&query=Turnul+înclinat+din+Pisa+Italy" },
    { name: "Situl Arheologic Pompei", url: "https://www.google.com/maps/search/?api=1&query=Situl+Arheologic+Pompei+Italy" },
    { name: "Galleria degli Uffizi Florența", url: "https://www.google.com/maps/search/?api=1&query=Galleria+degli+Uffizi+Florența+Italy" },
    { name: "Acvariul din Genova", url: "https://www.google.com/maps/search/?api=1&query=Acvariul+din+Genova+Italy" },
    { name: "Castelul Sant'Angelo Roma", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Sant'Angelo+Roma+Italy" },
    { name: "Palatul Regal din Caserta", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Regal+din+Caserta+Italy" },
    { name: "Palatul Dogilor Veneția", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Dogilor+Veneția+Italy" },
    { name: "Galleria Borghese Roma", url: "https://www.google.com/maps/search/?api=1&query=Galleria+Borghese+Roma+Italy" },
    { name: "Parco Natura Viva Bussolengo", url: "https://www.google.com/maps/search/?api=1&query=Parco+Natura+Viva+Bussolengo+Italy" },
    { name: "MagicLand Valmontone", url: "https://www.google.com/maps/search/?api=1&query=MagicLand+Valmontone+Italy" },
    { name: "Parcul tematic Leolandia Capriate", url: "https://www.google.com/maps/search/?api=1&query=Parcul+tematic+Leolandia+Capriate+Italy" },
    { name: "Zoosafari Fasano", url: "https://www.google.com/maps/search/?api=1&query=Zoosafari+Fasano+Italy" },
    { name: "Villa d'Este Tivoli", url: "https://www.google.com/maps/search/?api=1&query=Villa+d'Este+Tivoli+Italy" },
    { name: "Parco Giardino Sigurtà", url: "https://www.google.com/maps/search/?api=1&query=Parco+Giardino+Sigurtà+Italy" },
    { name: "Muzeul Egiptean din Torino", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Egiptean+din+Torino+Italy" },
    { name: "Castel del Monte Andria", url: "https://www.google.com/maps/search/?api=1&query=Castel+del+Monte+Andria+Italy" },
    { name: "Catacombele San Callisto", url: "https://www.google.com/maps/search/?api=1&query=Catacombele+San+Callisto+Italy" },
    { name: "Etnaland Catania Belpasso", url: "https://www.google.com/maps/search/?api=1&query=Etnaland+Catania+Belpasso+Italy" },
    { name: "Aquafan Riccione", url: "https://www.google.com/maps/search/?api=1&query=Aquafan+Riccione+Italy" },
    { name: "Pantheonul din Roma", url: "https://www.google.com/maps/search/?api=1&query=Pantheonul+din+Roma+Italy" },
    { name: "Situl Arheologic Herculaneum", url: "https://www.google.com/maps/search/?api=1&query=Situl+Arheologic+Herculaneum+Italy" },
    { name: "Basilica San Marco Veneția", url: "https://www.google.com/maps/search/?api=1&query=Basilica+San+Marco+Veneția+Italy" },
    { name: "Muzeul Național al Cinematografiei Torino", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Național+al+Cinematografiei+Torino+Italy" },
    { name: "Ostia Antica", url: "https://www.google.com/maps/search/?api=1&query=Ostia+Antica+Italy" },
    { name: "Zoomarine Torvaianica", url: "https://www.google.com/maps/search/?api=1&query=Zoomarine+Torvaianica+Italy" },
    { name: "Villa Adriana Tivoli", url: "https://www.google.com/maps/search/?api=1&query=Villa+Adriana+Tivoli+Italy" },
    { name: "Gulliverlandia Lignano", url: "https://www.google.com/maps/search/?api=1&query=Gulliverlandia+Lignano+Italy" },
    { name: "Muzeele Capitoline Roma", url: "https://www.google.com/maps/search/?api=1&query=Muzeele+Capitoline+Roma+Italy" },
    { name: "Peșterile Frasassi", url: "https://www.google.com/maps/search/?api=1&query=Peșterile+Frasassi+Italy" },
  ],
  pl: [
    { name: "Energylandia Zator", url: "https://www.google.com/maps/search/?api=1&query=Energylandia+Zator+Poland" },
    { name: "Castelul Regal Wawel Cracovia", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Regal+Wawel+Cracovia+Poland" },
    { name: "Salina Wieliczka", url: "https://www.google.com/maps/search/?api=1&query=Salina+Wieliczka+Poland" },
    { name: "Zoo Wrocław & Afrykarium", url: "https://www.google.com/maps/search/?api=1&query=Zoo+Wrocław+and+Afrykarium+Poland" },
    { name: "Castelul Teuton Malbork", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Teuton+Malbork+Poland" },
    { name: "Muzeul Varșoviei", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Varșoviei+Poland" },
    { name: "Legendia Parcul de Distracții", url: "https://www.google.com/maps/search/?api=1&query=Legendia+Parcul+de+Distracții+Poland" },
    { name: "Suntago Wodny Świat", url: "https://www.google.com/maps/search/?api=1&query=Suntago+Wodny+Świat+Poland" },
    { name: "Castelul Książ Wałbrzych", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Książ+Wałbrzych+Poland" },
    { name: "Salina Bochnia", url: "https://www.google.com/maps/search/?api=1&query=Salina+Bochnia+Poland" },
    { name: "Muzeul de Istorie a Evreilor Polonezi Varșovia", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+de+Istorie+a+Evreilor+Polonezi+Varșovia+Poland" },
    { name: "Palatul Culturii și Științei Varșovia", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Culturii+și+Științei+Varșovia+Poland" },
    { name: "Catedrala Wawel", url: "https://www.google.com/maps/search/?api=1&query=Catedrala+Wawel+Poland" },
    { name: "Castelul Regal Varșovia", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Regal+Varșovia+Poland" },
    { name: "Centrul de Știință Copernic Varșovia", url: "https://www.google.com/maps/search/?api=1&query=Centrul+de+Știință+Copernic+Varșovia+Poland" },
    { name: "Aquapark Reda cu rechini vii", url: "https://www.google.com/maps/search/?api=1&query=Aquapark+Reda+cu+rechini+vii+Poland" },
    { name: "Castelul Chojnik", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Chojnik+Poland" },
  ],
  nl: [
    { name: "Efteling Kaatsheuvel", url: "https://www.google.com/maps/search/?api=1&query=Efteling+Kaatsheuvel+Netherlands" },
    { name: "Rijksmuseum Amsterdam", url: "https://www.google.com/maps/search/?api=1&query=Rijksmuseum+Amsterdam+Netherlands" },
    { name: "Muzeul Van Gogh", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Van+Gogh+Netherlands" },
    { name: "Walibi Holland", url: "https://www.google.com/maps/search/?api=1&query=Walibi+Holland+Netherlands" },
    { name: "Grădinile Keukenhof", url: "https://www.google.com/maps/search/?api=1&query=Grădinile+Keukenhof+Netherlands" },
    { name: "Casa Anne Frank Amsterdam", url: "https://www.google.com/maps/search/?api=1&query=Casa+Anne+Frank+Amsterdam+Netherlands" },
    { name: "Parcul în miniatură Madurodam", url: "https://www.google.com/maps/search/?api=1&query=Parcul+în+miniatură+Madurodam+Netherlands" },
    { name: "Parcul de distracții Duinrell", url: "https://www.google.com/maps/search/?api=1&query=Parcul+de+distracții+Duinrell+Netherlands" },
    { name: "Heineken Experience Amsterdam", url: "https://www.google.com/maps/search/?api=1&query=Heineken+Experience+Amsterdam+Netherlands" },
    { name: "Zoo Artis", url: "https://www.google.com/maps/search/?api=1&query=Zoo+Artis+Netherlands" },
    { name: "Attractiepark Slagharen", url: "https://www.google.com/maps/search/?api=1&query=Attractiepark+Slagharen+Netherlands" },
    { name: "Castelul De Haar Utrecht", url: "https://www.google.com/maps/search/?api=1&query=Castelul+De+Haar+Utrecht+Netherlands" },
    { name: "Parcul de distracții Toverland", url: "https://www.google.com/maps/search/?api=1&query=Parcul+de+distracții+Toverland+Netherlands" },
    { name: "Muzeul de Știință NEMO Amsterdam", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+de+Știință+NEMO+Amsterdam+Netherlands" },
    { name: "Body Worlds Amsterdam", url: "https://www.google.com/maps/search/?api=1&query=Body+Worlds+Amsterdam+Netherlands" },
    { name: "Muzeul Kröller-Müller Otterlo", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Kröller-Müller+Otterlo+Netherlands" },
    { name: "Deltapark Neeltje Jans", url: "https://www.google.com/maps/search/?api=1&query=Deltapark+Neeltje+Jans+Netherlands" },
    { name: "Cel mai mare parc de joacă din Europa", url: "https://www.google.com/maps/search/?api=1&query=Cel+mai+mare+parc+de+joacă+din+Europa+Netherlands" },
  ],
  ro: [
    { name: "Castelul Bran", url: "https://bran-castle.com/" },
    { name: "Castelul Peleș", url: "https://peles.ro/" },
    { name: "Palatul Parlamentului", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Parlamentului+Romania" },
    { name: "Salina Turda", url: "https://www.salinaturda.eu/" },
    { name: "Muzeul Antipa", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Antipa+Romania" },
    { name: "Therme București", url: "https://www.therme.ro/" },
    { name: "Dino Parc Râșnov", url: "https://www.google.com/maps/search/?api=1&query=Dino+Parc+Râșnov+Romania" },
    { name: "Cetatea Alba Carolina", url: "https://www.google.com/maps/search/?api=1&query=Cetatea+Alba+Carolina+Romania" },
    { name: "Castelul Corvinilor", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Corvinilor+Romania" },
    { name: "Muzeul Satului", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Satului+Romania" },
    { name: "Cetatea Deva", url: "https://www.google.com/maps/search/?api=1&query=Cetatea+Deva+Romania" },
    { name: "Cetatea Râșnov", url: "https://www.google.com/maps/search/?api=1&query=Cetatea+Râșnov+Romania" },
    { name: "Cetatea de Scaun a Sucevei", url: "https://www.google.com/maps/search/?api=1&query=Cetatea+de+Scaun+a+Sucevei+Romania" },
    { name: "Salina Praid", url: "https://www.google.com/maps/search/?api=1&query=Salina+Praid+Romania" },
    { name: "Ansamblul Sculptural Constantin Brâncuși", url: "https://www.google.com/maps/search/?api=1&query=Ansamblul+Sculptural+Constantin+Brâncuși+Romania" },
    { name: "Castelul Cantacuzino Bușteni", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Cantacuzino+Bușteni+Romania" },
    { name: "Turnul cu Ceas și Cetatea Sighișoara", url: "https://www.google.com/maps/search/?api=1&query=Turnul+cu+Ceas+și+Cetatea+Sighișoara+Romania" },
    { name: "Cetatea Făgăraș", url: "https://www.google.com/maps/search/?api=1&query=Cetatea+Făgăraș+Romania" },
    { name: "Muzeul Național Brukenthal Sibiu", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Național+Brukenthal+Sibiu+Romania" },
    { name: "Palatul Culturii Iași", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Culturii+Iași+Romania" },
    { name: "Aquapark Nymphaea Oradea", url: "https://www.google.com/maps/search/?api=1&query=Aquapark+Nymphaea+Oradea+Romania" },
    { name: "Muzeul Național al Țăranului Român", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Național+al+Țăranului+Român+Romania" },
    { name: "Cetatea Neamț", url: "https://www.google.com/maps/search/?api=1&query=Cetatea+Neamț+Romania" },
    { name: "Castelul Sturdza Miclăușeni", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Sturdza+Miclăușeni+Romania" },
    { name: "Muzeul Național de Istorie a României", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Național+de+Istorie+a+României+Romania" },
    { name: "Libearty Bear Sanctuary Zărnești", url: "https://www.google.com/maps/search/?api=1&query=Libearty+Bear+Sanctuary+Zărnești+Romania" },
    { name: "Palatul Mogoșoaia", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Mogoșoaia+Romania" },
    { name: "Cetatea Poenari", url: "https://www.google.com/maps/search/?api=1&query=Cetatea+Poenari+Romania" },
    { name: "Catedrala Mântuirii Neamului", url: "https://www.google.com/maps/search/?api=1&query=Catedrala+Mântuirii+Neamului+Romania" },
    { name: "Mănăstirea Voroneț", url: "https://www.google.com/maps/search/?api=1&query=Mănăstirea+Voroneț+Romania" },
    { name: "Palatul Brâncovenesc Sâmbăta de Sus", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Brâncovenesc+Sâmbăta+de+Sus+Romania" },
    { name: "MNAR București", url: "https://www.google.com/maps/search/?api=1&query=MNAR+București+Romania" },
    { name: "Parc Aventura Brașov", url: "https://www.google.com/maps/search/?api=1&query=Parc+Aventura+Brașov+Romania" },
    { name: "Planetariul Baia Mare", url: "https://www.google.com/maps/search/?api=1&query=Planetariul+Baia+Mare+Romania" },
    { name: "Complexul de Agrement Cheile Grădiștei", url: "https://www.google.com/maps/search/?api=1&query=Complexul+de+Agrement+Cheile+Grădiștei+Romania" },
    { name: "Salina Slănic Prahova", url: "https://www.google.com/maps/search/?api=1&query=Salina+Slănic+Prahova+Romania" },
    { name: "Cetatea Enisala Tulcea", url: "https://www.google.com/maps/search/?api=1&query=Cetatea+Enisala+Tulcea+Romania" },
    { name: "Roșia Montană UNESCO", url: "https://www.google.com/maps/search/?api=1&query=Roșia+Montană+UNESCO+Romania" },
    { name: "Palatul Ghika", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Ghika+Romania" },
  ],
  de: [
    { name: "Castelul Neuschwanstein", url: "https://www.neuschwanstein.de/" },
    { name: "Europa-Park Rust", url: "https://www.europapark.de/" },
    { name: "Phantasialand Brühl", url: "https://www.google.com/maps/search/?api=1&query=Phantasialand+Brühl+Germany" },
    { name: "Heide Park Resort", url: "https://www.google.com/maps/search/?api=1&query=Heide+Park+Resort+Germany" },
    { name: "Miniatur Wunderland Hamburg", url: "https://www.google.com/maps/search/?api=1&query=Miniatur+Wunderland+Hamburg+Germany" },
    { name: "Poarta Brandenburg", url: "https://www.google.com/maps/search/?api=1&query=Poarta+Brandenburg+Germany" },
    { name: "Catedrala din Köln", url: "https://www.koelner-dom.de/" },
    { name: "Legoland Günzburg", url: "https://www.google.com/maps/search/?api=1&query=Legoland+Günzburg+Germany" },
    { name: "Tropical Islands Resort", url: "https://www.google.com/maps/search/?api=1&query=Tropical+Islands+Resort+Germany" },
    { name: "Zoo Berlin", url: "https://www.google.com/maps/search/?api=1&query=Zoo+Berlin+Germany" },
    { name: "Muzeul Pergamon Berlin", url: "https://www.smb.museum/en/museums-institutions/pergamonmuseum/" },
    { name: "Castelul Eltz", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Eltz+Germany" },
    { name: "Castelul Heidelberg", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Heidelberg+Germany" },
    { name: "Palatul Rezidențial München", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Rezidențial+München+Germany" },
    { name: "Hansa-Park Sierksdorf", url: "https://www.google.com/maps/search/?api=1&query=Hansa-Park+Sierksdorf+Germany" },
    { name: "Insula Muzeelor Berlin", url: "https://www.google.com/maps/search/?api=1&query=Insula+Muzeelor+Berlin+Germany" },
    { name: "Palatul Sanssouci Potsdam", url: "https://www.spsg.de/" },
    { name: "Castelul Hohenzollern", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Hohenzollern+Germany" },
    { name: "Complexul Zwinger Dresda", url: "https://www.google.com/maps/search/?api=1&query=Complexul+Zwinger+Dresda+Germany" },
    { name: "Filmpark Babelsberg", url: "https://www.google.com/maps/search/?api=1&query=Filmpark+Babelsberg+Germany" },
    { name: "Palatul Charlottenburg Berlin", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Charlottenburg+Berlin+Germany" },
    { name: "Muzeul Mercedes-Benz Stuttgart", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Mercedes-Benz+Stuttgart+Germany" },
    { name: "Deutsches Museum München", url: "https://www.google.com/maps/search/?api=1&query=Deutsches+Museum+München+Germany" },
    { name: "Ravensburger Spieleland", url: "https://www.google.com/maps/search/?api=1&query=Ravensburger+Spieleland+Germany" },
    { name: "Allgäulino Wertach", url: "https://www.google.com/maps/search/?api=1&query=Allgäulino+Wertach+Germany" },
    { name: "Belantis Leipzig", url: "https://www.google.com/maps/search/?api=1&query=Belantis+Leipzig+Germany" },
    { name: "Erlebnispark Tripsdrill", url: "https://www.google.com/maps/search/?api=1&query=Erlebnispark+Tripsdrill+Germany" },
    { name: "Tierpark Hagenbeck Hamburg", url: "https://www.google.com/maps/search/?api=1&query=Tierpark+Hagenbeck+Hamburg+Germany" },
    { name: "BMW Welt & Museum München", url: "https://www.google.com/maps/search/?api=1&query=BMW+Welt+and+Museum+München+Germany" },
    { name: "Muzeul Porsche Stuttgart", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Porsche+Stuttgart+Germany" },
    { name: "Biserica Frauenkirche Dresda", url: "https://www.google.com/maps/search/?api=1&query=Biserica+Frauenkirche+Dresda+Germany" },
    { name: "Altes Museum Berlin", url: "https://www.google.com/maps/search/?api=1&query=Altes+Museum+Berlin+Germany" },
    { name: "Catedrala din Ulm", url: "https://www.google.com/maps/search/?api=1&query=Catedrala+din+Ulm+Germany" },
    { name: "Aquapark Alpamare Bad Tölz", url: "https://www.google.com/maps/search/?api=1&query=Aquapark+Alpamare+Bad+Tölz+Germany" },
    { name: "Sea Life München", url: "https://www.google.com/maps/search/?api=1&query=Sea+Life+München+Germany" },
    { name: "Palatul Linderhof", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Linderhof+Germany" },
    { name: "Castelul Burghausen", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Burghausen+Germany" },
    { name: "Wunderland Kalkar", url: "https://www.google.com/maps/search/?api=1&query=Wunderland+Kalkar+Germany" },
  ],
  uk: [
    { name: "Tower of London", url: "https://www.hrp.org.uk/tower-of-london/" },
    { name: "British Museum", url: "https://www.britishmuseum.org/" },
    { name: "Buckingham Palace", url: "https://www.rct.uk/visit/buckingham-palace" },
    { name: "Edinburgh Castle", url: "https://www.edinburghcastle.scot/" },
    { name: "London Eye", url: "https://www.londoneye.com/" },
  ],
  es: [
    { name: "PortAventura World Tarragona", url: "https://www.portaventuraworld.com/" },
    { name: "Parque Warner Madrid", url: "https://www.google.com/maps/search/?api=1&query=Parque+Warner+Madrid+Spain" },
    { name: "Terra Mítica Benidorm", url: "https://www.google.com/maps/search/?api=1&query=Terra+Mítica+Benidorm+Spain" },
    { name: "Basílica de la Sagrada Família", url: "https://sagradafamilia.org/" },
    { name: "Museo Nacional del Prado", url: "https://www.museodelprado.es/" },
    { name: "Alhambra de Granada", url: "https://www.alhambra-patronato.es/" },
    { name: "Parc Güell Barcelona", url: "https://parkguell.barcelona/" },
    { name: "Siam Park Tenerife", url: "https://www.google.com/maps/search/?api=1&query=Siam+Park+Tenerife+Spain" },
    { name: "Real Alcázar de Sevilla", url: "https://www.google.com/maps/search/?api=1&query=Real+Alcázar+de+Sevilla+Spain" },
    { name: "L'Oceanogràfic", url: "https://www.google.com/maps/search/?api=1&query=L'Oceanogràfic+Spain" },
    { name: "Loro Parque Tenerife", url: "https://www.google.com/maps/search/?api=1&query=Loro+Parque+Tenerife+Spain" },
    { name: "Palatul Regal din Madrid", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Regal+din+Madrid+Spain" },
    { name: "Muzeul Picasso", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Picasso+Spain" },
    { name: "Museo Nacional Centro de Arte Reina Sofía", url: "https://www.google.com/maps/search/?api=1&query=Museo+Nacional+Centro+de+Arte+Reina+Sofía+Spain" },
    { name: "Casa Batlló Barcelona", url: "https://www.google.com/maps/search/?api=1&query=Casa+Batlló+Barcelona+Spain" },
    { name: "Isla Mágica Sevilla", url: "https://www.google.com/maps/search/?api=1&query=Isla+Mágica+Sevilla+Spain" },
    { name: "Moscheea-Catedrală din Córdoba", url: "https://www.google.com/maps/search/?api=1&query=Moscheea-Catedrală+din+Córdoba+Spain" },
    { name: "Muzeul Guggenheim Bilbao", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Guggenheim+Bilbao+Spain" },
    { name: "Castelul Alcázar din Segovia", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Alcázar+din+Segovia+Spain" },
    { name: "Parque de Atracciones", url: "https://www.google.com/maps/search/?api=1&query=Parque+de+Atracciones+Spain" },
    { name: "Poble Espanyol Barcelona", url: "https://www.google.com/maps/search/?api=1&query=Poble+Espanyol+Barcelona+Spain" },
    { name: "Parcul de distracții Tibidabo", url: "https://www.google.com/maps/search/?api=1&query=Parcul+de+distracții+Tibidabo+Spain" },
    { name: "Aqualandia Benidorm", url: "https://www.google.com/maps/search/?api=1&query=Aqualandia+Benidorm+Spain" },
    { name: "Casa Milà / La Pedrera Barcelona", url: "https://www.google.com/maps/search/?api=1&query=Casa+Milà+/+La+Pedrera+Barcelona+Spain" },
    { name: "Catedrala din Sevilla", url: "https://www.google.com/maps/search/?api=1&query=Catedrala+din+Sevilla+Spain" },
    { name: "Bioparc Valencia", url: "https://www.google.com/maps/search/?api=1&query=Bioparc+Valencia+Spain" },
    { name: "Katmandu Park Mallorca", url: "https://www.google.com/maps/search/?api=1&query=Katmandu+Park+Mallorca+Spain" },
    { name: "Teatro Real", url: "https://www.google.com/maps/search/?api=1&query=Teatro+Real+Spain" },
    { name: "Orașul Artelor și Științelor Valencia", url: "https://www.google.com/maps/search/?api=1&query=Orașul+Artelor+și+Științelor+Valencia+Spain" },
    { name: "Muzeul Thyssen-Bornemisza Madrid", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Thyssen-Bornemisza+Madrid+Spain" },
    { name: "Parque Europa Madrid", url: "https://www.google.com/maps/search/?api=1&query=Parque+Europa+Madrid+Spain" },
    { name: "Castelul Loarre", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Loarre+Spain" },
    { name: "Palatul Aljafería Zaragoza", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Aljafería+Zaragoza+Spain" },
    { name: "Zoo Aquarium Madrid", url: "https://www.google.com/maps/search/?api=1&query=Zoo+Aquarium+Madrid+Spain" },
  ],
  fr: [
    { name: "Disneyland Paris", url: "https://www.disneylandparis.com/" },
    { name: "Parc Astérix", url: "https://www.google.com/maps/search/?api=1&query=Parc+Astérix+France" },
    { name: "Puy du Fou", url: "https://www.google.com/maps/search/?api=1&query=Puy+du+Fou+France" },
    { name: "Turnul Eiffel", url: "https://www.toureiffel.paris/" },
    { name: "Muzeul Luvru", url: "https://www.louvre.fr/" },
    { name: "Palatul Versailles", url: "https://www.chateauversailles.fr/" },
    { name: "Arcul de Triumf", url: "https://www.google.com/maps/search/?api=1&query=Arcul+de+Triumf+France" },
    { name: "Futuroscope Poitiers", url: "https://www.google.com/maps/search/?api=1&query=Futuroscope+Poitiers+France" },
    { name: "Abația Mont-Saint-Michel", url: "https://www.ot-montsaintmichel.com/" },
    { name: "Muzeul d'Orsay Paris", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+d'Orsay+Paris+France" },
    { name: "Cité des Sciences et de l'Industrie", url: "https://www.google.com/maps/search/?api=1&query=Cité+des+Sciences+et+de+l'Industrie+France" },
    { name: "Castelul Chambord", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Chambord+France" },
    { name: "Centrul Pompidou Paris", url: "https://www.google.com/maps/search/?api=1&query=Centrul+Pompidou+Paris+France" },
    { name: "Sainte-Chapelle", url: "https://www.google.com/maps/search/?api=1&query=Sainte-Chapelle+France" },
    { name: "Castelul Fontainebleau", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Fontainebleau+France" },
    { name: "Walibi Rhône-Alpes", url: "https://www.google.com/maps/search/?api=1&query=Walibi+Rhône-Alpes+France" },
    { name: "Castelul Chenonceau", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Chenonceau+France" },
    { name: "Parcul de distracții Nigloland", url: "https://www.google.com/maps/search/?api=1&query=Parcul+de+distracții+Nigloland+France" },
    { name: "Palais Idéal du Facteur Cheval", url: "https://www.google.com/maps/search/?api=1&query=Palais+Idéal+du+Facteur+Cheval+France" },
    { name: "Cetatea Medievală Carcassonne", url: "https://www.google.com/maps/search/?api=1&query=Cetatea+Medievală+Carcassonne+France" },
    { name: "Catacombele din Paris", url: "https://www.google.com/maps/search/?api=1&query=Catacombele+din+Paris+France" },
    { name: "Muzeul Armatei / Domul Invalizilor", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Armatei+/+Domul+Invalizilor+France" },
    { name: "Panthéon Paris", url: "https://www.google.com/maps/search/?api=1&query=Panthéon+Paris+France" },
    { name: "Opéra Garnier Paris", url: "https://www.google.com/maps/search/?api=1&query=Opéra+Garnier+Paris+France" },
    { name: "Domeniul Trianon Versailles", url: "https://www.google.com/maps/search/?api=1&query=Domeniul+Trianon+Versailles+France" },
    { name: "Aquaboulevard Paris", url: "https://www.google.com/maps/search/?api=1&query=Aquaboulevard+Paris+France" },
    { name: "Marineland Antibes", url: "https://www.google.com/maps/search/?api=1&query=Marineland+Antibes+France" },
    { name: "Castelul Haut-Kœnigsbourg", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Haut-Kœnigsbourg+France" },
    { name: "Muzeul Picasso Paris", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Picasso+Paris+France" },
    { name: "Fundația Louis Vuitton", url: "https://www.google.com/maps/search/?api=1&query=Fundația+Louis+Vuitton+France" },
    { name: "ZooParc de Beauval", url: "https://www.google.com/maps/search/?api=1&query=ZooParc+de+Beauval+France" },
    { name: "Palais de Tokyo Paris", url: "https://www.google.com/maps/search/?api=1&query=Palais+de+Tokyo+Paris+France" },
    { name: "Castelul d'If Marseille", url: "https://www.google.com/maps/search/?api=1&query=Castelul+d'If+Marseille+France" },
    { name: "Muzeul MUCEM", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+MUCEM+France" },
    { name: "Parcul Festyland Caen", url: "https://www.google.com/maps/search/?api=1&query=Parcul+Festyland+Caen+France" },
    { name: "Peștera Lascaux IV", url: "https://www.google.com/maps/search/?api=1&query=Peștera+Lascaux+IV+France" },
  ],
  se: [
    { name: "Muzeul Vasa Stockholm", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Vasa+Stockholm+Sweden" },
    { name: "Skansen Stockholm", url: "https://www.google.com/maps/search/?api=1&query=Skansen+Stockholm+Sweden" },
    { name: "Palatul Regal Stockholm", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Regal+Stockholm+Sweden" },
    { name: "Gamla Stan Stockholm", url: "https://www.google.com/maps/search/?api=1&query=Gamla+Stan+Stockholm+Sweden" },
    { name: "ABBA The Museum", url: "https://www.google.com/maps/search/?api=1&query=ABBA+The+Museum+Stockholm+Sweden" },
    { name: "Muzeul Nobel Stockholm", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Nobel+Stockholm+Sweden" },
    { name: "Palatul Drottningholm", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Drottningholm+Sweden" },
    { name: "Liseberg Göteborg", url: "https://www.google.com/maps/search/?api=1&query=Liseberg+Göteborg+Sweden" },
    { name: "Universeum Göteborg", url: "https://www.google.com/maps/search/?api=1&query=Universeum+Göteborg+Sweden" },
    { name: "Turning Torso Malmö", url: "https://www.google.com/maps/search/?api=1&query=Turning+Torso+Malmö+Sweden" },
    { name: "Castelul Malmöhus", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Malmöhus+Sweden" },
    { name: "Skyview Stockholm (Globen)", url: "https://www.google.com/maps/search/?api=1&query=Skyview+Stockholm+Globen+Sweden" },
    { name: "Castelul Kalmar", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Kalmar+Sweden" },
    { name: "Sigtuna", url: "https://www.google.com/maps/search/?api=1&query=Sigtuna+Sweden" },
    { name: "Icehotel Jukkasjärvi", url: "https://www.google.com/maps/search/?api=1&query=Icehotel+Jukkasjärvi+Sweden" },
  ],
  pt: [
    { name: "Turnul Belém Lisboa", url: "https://www.google.com/maps/search/?api=1&query=Turnul+Belém+Lisboa+Portugal" },
    { name: "Mănăstirea Jerónimos", url: "https://www.google.com/maps/search/?api=1&query=Mănăstirea+Jerónimos+Lisboa+Portugal" },
    { name: "Castelul São Jorge Lisboa", url: "https://www.google.com/maps/search/?api=1&query=Castelul+São+Jorge+Lisboa+Portugal" },
    { name: "Oceanário de Lisboa", url: "https://www.google.com/maps/search/?api=1&query=Oceanário+de+Lisboa+Portugal" },
    { name: "Palatul Pena Sintra", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Pena+Sintra+Portugal" },
    { name: "Livraria Lello Porto", url: "https://www.google.com/maps/search/?api=1&query=Livraria+Lello+Porto+Portugal" },
    { name: "Podul Dom Luís I Porto", url: "https://www.google.com/maps/search/?api=1&query=Podul+Dom+Luís+I+Porto+Portugal" },
    { name: "Torre dos Clérigos Porto", url: "https://www.google.com/maps/search/?api=1&query=Torre+dos+Clérigos+Porto+Portugal" },
    { name: "Cabo da Roca Sintra", url: "https://www.google.com/maps/search/?api=1&query=Cabo+da+Roca+Sintra+Portugal" },
    { name: "Praia da Marinha Algarve", url: "https://www.google.com/maps/search/?api=1&query=Praia+da+Marinha+Algarve+Portugal" },
    { name: "Universitatea din Coimbra", url: "https://www.google.com/maps/search/?api=1&query=Universitatea+din+Coimbra+Portugal" },
    { name: "Fortăreața Sagres", url: "https://www.google.com/maps/search/?api=1&query=Fortăreața+Sagres+Portugal" },
    { name: "Piscinele Naturale Porto Moniz", url: "https://www.google.com/maps/search/?api=1&query=Piscinele+Naturale+Porto+Moniz+Madeira+Portugal" },
    { name: "Palatul Ducal Vila Viçosa", url: "https://www.google.com/maps/search/?api=1&query=Palatul+Ducal+Vila+Viçosa+Portugal" },
  ],
  cz: [
    { name: "Castelul Praga", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Praga+Czech+Republic" },
    { name: "Podul Carol Praga", url: "https://www.google.com/maps/search/?api=1&query=Podul+Carol+Praga+Czech+Republic" },
    { name: "Ceasul Astronomic Praga", url: "https://www.google.com/maps/search/?api=1&query=Ceasul+Astronomic+Praga+Czech+Republic" },
    { name: "Piața Wenceslas Praga", url: "https://www.google.com/maps/search/?api=1&query=Piața+Wenceslas+Praga+Czech+Republic" },
    { name: "Castelul Karlštejn", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Karlštejn+Czech+Republic" },
    { name: "Kutná Hora — Biserica Oaselor", url: "https://www.google.com/maps/search/?api=1&query=Kutná+Hora+Biserica+Oaselor+Czech+Republic" },
    { name: "Český Krumlov", url: "https://www.google.com/maps/search/?api=1&query=Český+Krumlov+Czech+Republic" },
    { name: "Piața Vegetabilă Brno", url: "https://www.google.com/maps/search/?api=1&query=Piața+Vegetabilă+Brno+Czech+Republic" },
    { name: "Peșterile Moravian Karst", url: "https://www.google.com/maps/search/?api=1&query=Peșterile+Moravian+Karst+Czech+Republic" },
    { name: "Zoo Praga", url: "https://www.google.com/maps/search/?api=1&query=Zoo+Praga+Czech+Republic" },
    { name: "Muzeul Național Praga", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Național+Praga+Czech+Republic" },
    { name: "Turnul cu Pulbere Praga", url: "https://www.google.com/maps/search/?api=1&query=Turnul+cu+Pulbere+Praga+Czech+Republic" },
  ],
  fi: [
    { name: "Suomenlinna Helsinki", url: "https://www.google.com/maps/search/?api=1&query=Suomenlinna+Helsinki+Finland" },
    { name: "Muzeul Design Helsinki", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Design+Helsinki+Finland" },
    { name: "Catedrala Helsinki", url: "https://www.google.com/maps/search/?api=1&query=Catedrala+Helsinki+Finland" },
    { name: "Biserica Temppeliaukio", url: "https://www.google.com/maps/search/?api=1&query=Biserica+Temppeliaukio+Helsinki+Finland" },
    { name: "Parcul Linnanmäki", url: "https://www.google.com/maps/search/?api=1&query=Parcul+Linnanmäki+Helsinki+Finland" },
    { name: "Muzeul Ateneum Helsinki", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Ateneum+Helsinki+Finland" },
    { name: "Turnul Näsinneula Tampere", url: "https://www.google.com/maps/search/?api=1&query=Turnul+Näsinneula+Tampere+Finland" },
    { name: "Muzeul Vapriikki Tampere", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Vapriikki+Tampere+Finland" },
    { name: "Castelul Turku", url: "https://www.google.com/maps/search/?api=1&query=Castelul+Turku+Finland" },
    { name: "Catedrala Turku", url: "https://www.google.com/maps/search/?api=1&query=Catedrala+Turku+Finland" },
    { name: "Moomin World Naantali", url: "https://www.google.com/maps/search/?api=1&query=Moomin+World+Naantali+Finland" },
    { name: "Satul lui Moș Crăciun Rovaniemi", url: "https://www.google.com/maps/search/?api=1&query=Santa+Claus+Village+Rovaniemi+Finland" },
    { name: "Muzeul Arktikum Rovaniemi", url: "https://www.google.com/maps/search/?api=1&query=Muzeul+Arktikum+Rovaniemi+Finland" },
    { name: "Zoo Ähtäri", url: "https://www.google.com/maps/search/?api=1&query=Zoo+Ähtäri+Finland" },
  ],
  gr: [
    { name: "Acropolis Athens", url: "https://www.google.com/maps/search/?api=1&query=Acropolis+Athens+Greece" },
    { name: "Muzeul Acropolei", url: "https://www.google.com/maps/search/?api=1&query=Acropolis+Museum+Athens+Greece" },
    { name: "Templul lui Zeus Olympian", url: "https://www.google.com/maps/search/?api=1&query=Temple+of+Olympian+Zeus+Athens+Greece" },
    { name: "Agora Antică Athens", url: "https://www.google.com/maps/search/?api=1&query=Ancient+Agora+Athens+Greece" },
    { name: "Muzeul Național Arheologic", url: "https://www.google.com/maps/search/?api=1&query=National+Archaeological+Museum+Athens+Greece" },
    { name: "Colina Lycabettus", url: "https://www.google.com/maps/search/?api=1&query=Lycabettus+Hill+Athens+Greece" },
    { name: "Turnul Alb Thessaloniki", url: "https://www.google.com/maps/search/?api=1&query=White+Tower+Thessaloniki+Greece" },
    { name: "Rotonda Galerius", url: "https://www.google.com/maps/search/?api=1&query=Rotunda+of+Galerius+Thessaloniki+Greece" },
    { name: "Muzeul Arheologic Thessaloniki", url: "https://www.google.com/maps/search/?api=1&query=Archaeological+Museum+Thessaloniki+Greece" },
    { name: "Palatul Knossos", url: "https://www.google.com/maps/search/?api=1&query=Palace+of+Knossos+Heraklion+Greece" },
    { name: "Muzeul Arheologic Heraklion", url: "https://www.google.com/maps/search/?api=1&query=Archaeological+Museum+Heraklion+Greece" },
    { name: "Mănăstirile Meteora", url: "https://www.google.com/maps/search/?api=1&query=Meteora+Monasteries+Greece" },
    { name: "Situl Arheologic Delfi", url: "https://www.google.com/maps/search/?api=1&query=Delphi+Archaeological+Site+Greece" },
    { name: "Teatrul Antic Epidaurus", url: "https://www.google.com/maps/search/?api=1&query=Ancient+Theatre+Epidaurus+Greece" },
  ],
  hu: [
    { name: "Parlamentul Ungariei Budapest", url: "https://www.google.com/maps/search/?api=1&query=Hungarian+Parliament+Building+Budapest+Hungary" },
    { name: "Castelul Buda", url: "https://www.google.com/maps/search/?api=1&query=Buda+Castle+Budapest+Hungary" },
    { name: "Bastionul Pescarilor", url: "https://www.google.com/maps/search/?api=1&query=Fisherman's+Bastion+Budapest+Hungary" },
    { name: "Băile Széchenyi", url: "https://www.google.com/maps/search/?api=1&query=Széchenyi+Thermal+Bath+Budapest+Hungary" },
    { name: "Bazilica Sfântul Ștefan", url: "https://www.google.com/maps/search/?api=1&query=St+Stephen's+Basilica+Budapest+Hungary" },
    { name: "Podul cu Lanțuri", url: "https://www.google.com/maps/search/?api=1&query=Chain+Bridge+Budapest+Hungary" },
    { name: "Insula Margareta", url: "https://www.google.com/maps/search/?api=1&query=Margaret+Island+Budapest+Hungary" },
    { name: "Sinagoga Mare Budapest", url: "https://www.google.com/maps/search/?api=1&query=Great+Synagogue+Budapest+Hungary" },
    { name: "Muzeul Național Maghiar", url: "https://www.google.com/maps/search/?api=1&query=Hungarian+National+Museum+Budapest+Hungary" },
    { name: "Cetatea Eger", url: "https://www.google.com/maps/search/?api=1&query=Eger+Castle+Hungary" },
    { name: "Lacul Balaton", url: "https://www.google.com/maps/search/?api=1&query=Lake+Balaton+Hungary" },
    { name: "Peștera Aggtelek", url: "https://www.google.com/maps/search/?api=1&query=Aggtelek+Cave+Hungary" },
    { name: "Marea Biserică Reformată Debrecen", url: "https://www.google.com/maps/search/?api=1&query=Great+Reformed+Church+Debrecen+Hungary" },
  ],
  hr: [
    { name: "Zidurile Dubrovnik", url: "https://www.google.com/maps/search/?api=1&query=Walls+of+Dubrovnik+Croatia" },
    { name: "Palatul lui Diocletian Split", url: "https://www.google.com/maps/search/?api=1&query=Diocletian's+Palace+Split+Croatia" },
    { name: "Parcul Național Plitvice", url: "https://www.google.com/maps/search/?api=1&query=Plitvice+Lakes+National+Park+Croatia" },
    { name: "Catedrala Sfântul Iacov Šibenik", url: "https://www.google.com/maps/search/?api=1&query=Cathedral+of+St+James+Šibenik+Croatia" },
    { name: "Arena Pula", url: "https://www.google.com/maps/search/?api=1&query=Pula+Arena+Croatia" },
    { name: "Insulele Kornati", url: "https://www.google.com/maps/search/?api=1&query=Kornati+Islands+Croatia" },
    { name: "Catedrala din Zagreb", url: "https://www.google.com/maps/search/?api=1&query=Zagreb+Cathedral+Croatia" },
    { name: "Piața Ban Jelačić", url: "https://www.google.com/maps/search/?api=1&query=Ban+Jelačić+Square+Zagreb+Croatia" },
    { name: "Turnul Lotrščak", url: "https://www.google.com/maps/search/?api=1&query=Lotrščak+Tower+Zagreb+Croatia" },
    { name: "Grota Albastră Biševo", url: "https://www.google.com/maps/search/?api=1&query=Blue+Cave+Biševo+Croatia" },
    { name: "Insula Hvar", url: "https://www.google.com/maps/search/?api=1&query=Hvar+Island+Croatia" },
    { name: "Parcul Național Krka", url: "https://www.google.com/maps/search/?api=1&query=Krka+National+Park+Croatia" },
    { name: "Cetatea Klis", url: "https://www.google.com/maps/search/?api=1&query=Klis+Fortress+Croatia" },
  ],
};

// Excepții manuale, verificate — pentru monumente foarte cunoscute al căror
// nume NU conține orașul (Turnul Eiffel nu spune "Paris" nicăieri în nume),
// deci detecția automată de mai jos le-ar fi ratat. Fapte foarte sigure, nu
// presupuneri — extensibil ușor pentru alte țări/orașe, la cerere.
const ATTRACTION_CITY_OVERRIDES = {
  fr: {
    "Turnul Eiffel": "Paris",
    "Muzeul Luvru": "Paris",
    "Arcul de Triumf": "Paris",
    "Sainte-Chapelle": "Paris",
    "Muzeul Armatei / Domul Invalizilor": "Paris",
    "Fundația Louis Vuitton": "Paris",
    "Muzeul MUCEM": "Marseille",
  },
};

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

const COUNTRY_LABELS = { ro: "🇷🇴 Romania", de: "🇩🇪 Germany", uk: "🇬🇧 United Kingdom", es: "🇪🇸 Spain", fr: "🇫🇷 France", it: "🇮🇹 Italy", pl: "🇵🇱 Poland", nl: "🇳🇱 Netherlands", at: "🇦🇹 Austria", be: "🇧🇪 Belgium", dk: "🇩🇰 Denmark", se: "🇸🇪 Sweden", pt: "🇵🇹 Portugal", cz: "🇨🇿 Czech Republic", fi: "🇫🇮 Finland", gr: "🇬🇷 Greece", hu: "🇭🇺 Hungary", hr: "🇭🇷 Croatia" };

// Vercel dă codul de țară ca ISO 3166-1 alpha-2 (ex: "DE", "GB") — hartă spre
// codurile noastre interne (Marea Britanie: "GB" în ISO, dar "uk" la noi).
const GEO_COUNTRY_MAP = { DE: "de", GB: "uk", ES: "es", FR: "fr", IT: "it", PL: "pl", NL: "nl", AT: "at", BE: "be", DK: "dk", RO: "ro", SE: "se", PT: "pt", CZ: "cz", FI: "fi", GR: "gr", HU: "hu", HR: "hr" };

// Locul unde ești (țara) și limba în care citești nu sunt același lucru —
// un englez aflat în Germania nu trebuie forțat să vadă germană. Fiecare
// pagină internațională poate fi văzută în orice limbă avem tradusă, prin
// ?lang=xx — fără să schimbe ce magazin/oraș vezi, doar cum e scris textul.
// "uk" e cheia noastră internă pentru engleză (moștenită din codul de țară),
// dar aici o etichetăm corect, ca opțiune de limbă, nu de țară.
const LANGUAGE_LABELS = { uk: "English", de: "Deutsch", es: "Español", fr: "Français", it: "Italiano", pl: "Polski", nl: "Nederlands", da: "Dansk", ro: "Română", se: "Svenska", pt: "Português", cz: "Čeština", fi: "Suomi", gr: "Ελληνικά", hu: "Magyar", hr: "Hrvatski" };
function buildLanguageSwitcher(currentLang, pathWithoutQuery) {
  const items = Object.keys(LANGUAGE_LABELS)
    .filter((code) => code !== currentLang)
    .map((code) => `<a href="${escapeHtml(pathWithoutQuery)}?lang=${code}">${escapeHtml(LANGUAGE_LABELS[code])}</a>`)
    .join(" · ");
  return `<p class="lang-switcher">🌐 ${escapeHtml(LANGUAGE_LABELS[currentLang] || currentLang)} — ${items}</p>`;
}

// index combinat de căutare (magazine + atracții, toate țările internaționale)
// — generat o singură dată, trimis către browser pentru căutarea instant de pe homepage.
function buildSearchIndex() {
  const index = [];
  Object.keys(COUNTRIES).forEach((code) => {
    const country = COUNTRIES[code];
    const firstCity = slugifyCityName(country.cities[0]);
    Object.keys(country.config).forEach((key) => {
      const cfg = country.config[key];
      index.push({ name: cfg.name, type: "store", country: code, href: `/${code}/${firstCity}/${cfg.slug || key}` });
    });
  });
  Object.keys(ATTRACTIONS).forEach((code) => {
    ATTRACTIONS[code].forEach((a) => {
      index.push({ name: a.name, type: "attraction", country: code, href: `/${code}/obiectiv/${toDbSlug(a.name)}` });
    });
  });
  return index;
}

// index de căutare DOAR pentru România (magazine + obiective turistice
// românești) — folosit pe programul-de-azi.ro, ca să nu amestece magazine
// din toată Europa, în engleză, pe un site în română
function buildSearchIndexRO() {
  const index = [];
  const firstCity = slugifyCityName(SITEMAP_CITIES[0]);
  Object.keys(RO_INTL_STORE_CONFIG).forEach((key) => {
    const cfg = RO_INTL_STORE_CONFIG[key];
    index.push({ name: cfg.name, type: "store", country: "ro", href: `/${firstCity}/${cfg.slug || key}` });
  });
  ATTRACTIONS.ro.forEach((a) => {
    index.push({ name: a.name, type: "attraction", country: "ro", href: `/obiectiv/${toDbSlug(a.name)}` });
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
const STORE_CONFIG = {
  lidl: { name: "Lidl", type: "store", weekly: supermarketWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  kaufland: { name: "Kaufland", type: "store", weekly: supermarketWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  penny: { name: "Penny", type: "store", weekly: supermarketWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  megaimage: { name: "Mega Image", type: "store", weekly: supermarketWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  carrefour: { name: "Carrefour", type: "store", weekly: supermarketWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  auchan: { name: "Auchan", type: "store", weekly: supermarketWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  profi: { name: "Profi", type: "store", weekly: supermarketWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  metro: { name: "Metro", type: "store", weekly: metroWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  selgros: { name: "Selgros", type: "store", weekly: metroWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  dedeman: { name: "Dedeman", type: "store", weekly: bricolajWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  leroymerlin: { name: "Leroy Merlin", slug: "leroy-merlin", type: "store", weekly: bricolajWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  bricodepot: { name: "Brico Depot", slug: "brico-depot", type: "store", weekly: bricolajWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  hornbach: { name: "Hornbach", type: "store", weekly: bricolajWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  jysk: { name: "Jysk", type: "store", weekly: bricolajWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  ikea: { name: "Ikea", type: "store", weekly: bricolajWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  altex: { name: "Altex", type: "store", weekly: electroWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  flanco: { name: "Flanco", type: "store", weekly: electroWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  dm: { name: "Dm", type: "store", weekly: electroWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  drmax: { name: "Dr. Max", slug: "dr-max", type: "store", weekly: farmacieWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  farmaciatei: { name: "Farmacia Tei", slug: "farmacia-tei", type: "store", weekly: farmacieWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  remedia: { name: "Remedia", type: "store", weekly: farmacieWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  springpharma: { name: "Spring Pharma", slug: "spring-pharma", type: "store", weekly: farmacieWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  catena: { name: "Catena", type: "store", weekly: farmacieWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  sensiblu: { name: "Sensiblu", type: "store", weekly: farmacieWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  helpnet: { name: "Help Net", slug: "help-net", type: "store", weekly: farmacieWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  dona: { name: "Dona", type: "store", weekly: farmacieWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  ropharma: { name: "Ropharma", type: "store", weekly: farmacieWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  mrbricolage: { name: "Mr. Bricolage", slug: "mr-bricolage", type: "store", weekly: bricolajWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  cinemacity: { name: "Cinema City", slug: "cinema-city", type: "cinema", ticketUrl: "https://www.cinemacity.ro/", weekly: cinemaWeekly(), holidays: [] },
  cineplexx: { name: "Cineplexx", type: "cinema", ticketUrl: "https://www.cineplexx.ro/", weekly: cinemaWeekly(), holidays: [] },
  happycinema: { name: "Happy Cinema", slug: "happy-cinema", type: "cinema", ticketUrl: "https://www.happycinema.ro/", weekly: cinemaWeekly(), holidays: [] },
  movieplex: { name: "Movie Plex", slug: "movie-plex", type: "cinema", ticketUrl: "https://www.movieplex.ro/", weekly: cinemaWeekly(), holidays: [] },
  bcr: { name: "BCR", type: "store", weekly: bankWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  brd: { name: "BRD", type: "store", weekly: bankWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  ing: { name: "ING Bank", type: "store", weekly: bankWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  raiffeisen: { name: "Raiffeisen Bank", type: "store", weekly: bankWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  bancatransilvania: { name: "Banca Transilvania", slug: "banca-transilvania", type: "store", weekly: bankWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  cec: { name: "CEC Bank", type: "store", weekly: bankWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  posta: { name: "Poșta Română", type: "store", weekly: postaWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  mcdonalds: { name: "McDonald's", type: "store", weekly: fastfoodWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  kfc: { name: "KFC", type: "store", weekly: fastfoodWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  burgerking: { name: "Burger King", slug: "burger-king", type: "store", weekly: fastfoodWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  fancourier: { name: "FAN Courier", slug: "fan-courier", type: "store", weekly: curierWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  cargus: { name: "Cargus", type: "store", weekly: curierWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  sameday: { name: "Sameday", type: "store", weekly: curierWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  dpd: { name: "DPD", type: "store", weekly: curierWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  gls: { name: "GLS", type: "store", weekly: curierWeekly(), holidays: SUPERMARKET_HOLIDAYS },
  mall: {
    name: "Mall",
    type: "mall",
    zones: {
      shopping: {
        weekly: mallShoppingWeekly(),
        holidays: [
          { date: "12-25", label: "Crăciun (25 decembrie)", hours: ["10:00", "18:00"] },
          { date: "01-01", label: "Anul Nou (1 ianuarie)", hours: ["10:00", "18:00"] },
        ],
      },
      hypermarket: {
        weekly: mallHyperWeekly(),
        holidays: [
          { date: "12-25", label: "Crăciun (25 decembrie)", hours: null },
          { date: "01-01", label: "Anul Nou (1 ianuarie)", hours: ["09:00", "15:00"] },
        ],
      },
    },
  },
};

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
const SELECTIVE_BRAND_CITIES = {
  metro: [
    "București", "Brașov", "Constanța", "Timișoara", "Cluj-Napoca", "Bacău",
    "Iași", "Craiova", "Baia Mare", "Pitești", "Galați", "Ploiești", "Oradea",
    "Sibiu", "Suceava", "Târgu Mureș", "Arad", "Deva", "Satu Mare",
    "Piatra Neamț", "Buzău", "Târgoviște",
  ],
  selgros: [
    "Alba Iulia", "Arad", "Bacău", "Baia Mare", "Bistrița", "Brașov",
    "Brăila", "București", "Cluj-Napoca", "Constanța", "Craiova", "Galați",
    "Sibiu", "Târgu Mureș",
  ],
  ikea: ["București", "Timișoara"],
  cinemacity: [
    "București", "Arad", "Bacău", "Baia Mare", "Brăila", "Brașov", "Buzău",
    "Cluj-Napoca", "Constanța", "Deva", "Drobeta-Turnu Severin", "Galați",
    "Iași", "Piatra Neamț", "Ploiești", "Pitești", "Suceava", "Târgu Jiu",
    "Târgu Mureș", "Timișoara", "Râmnicu Vâlcea",
  ],
  cineplexx: ["București", "Craiova", "Sibiu", "Satu Mare", "Târgu Mureș"],
  happycinema: [
    "București", "Alexandria", "Focșani", "Buzău", "Bistrița", "Bacău",
    "Vaslui", "Botoșani", "Slobozia",
  ],
  movieplex: ["București"],
  // "Mall" e o intrare generică — nu o marcă anume — folosim aceeași listă
  // ca Cinema City, pentru că aproape toate sălile lor sunt în interiorul
  // unui mall mare; o corelație rezonabilă, nu o presupunere oarbă
  mall: [
    "București", "Arad", "Bacău", "Baia Mare", "Brăila", "Brașov", "Buzău",
    "Cluj-Napoca", "Constanța", "Deva", "Drobeta-Turnu Severin", "Galați",
    "Iași", "Piatra Neamț", "Ploiești", "Pitești", "Suceava", "Târgu Jiu",
    "Târgu Mureș", "Timișoara", "Râmnicu Vâlcea",
  ],
};

function isSelectiveBrandAllowedInCity(magazinKey, orasDisplay) {
  const allowedCities = SELECTIVE_BRAND_CITIES[magazinKey];
  if (!allowedCities) return true; // brand nerestricționat — universal, ca înainte
  const strip = (s) => normalizeSlug(s).replace(/[\s-]+/g, "");
  return allowedCities.some((c) => strip(c) === strip(orasDisplay));
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
    `script-src 'self' 'nonce-${nonce}' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagservices.com https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://widget.getyourguide.com https://unpkg.com https://maps.googleapis.com https://tp-em.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://www.gstatic.com https://www.google-analytics.com https://widget.getyourguide.com https://*.tile.openstreetmap.org https://maps.gstatic.com https://maps.googleapis.com https://*.googleapis.com https://*.ggpht.com",
    "connect-src 'self' https://api.bigdatacloud.net https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://widget.getyourguide.com https://*.getyourguide.com https://unpkg.com https://maps.googleapis.com https://tp-em.com",
    "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com",
    "worker-src 'self'",
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
.bottom-nav-item{flex:1 1 0;display:flex;flex-direction:column;align-items:center;gap:2px;text-decoration:none;color:var(--muted);font-family:var(--font-display);font-size:11px;font-weight:600;}
.bottom-nav-icon{font-size:20px;line-height:1;}
@media (min-width: 900px){.bottom-nav{display:none;}body{padding-bottom:48px;}}
@media (prefers-reduced-motion: reduce){*{animation-duration:.001ms !important;transition-duration:.001ms !important;}}
a{color:inherit;text-decoration:none;}
.wrap{max-width:520px;margin:0 auto;padding:0 18px;}
header{position:sticky;top:0;z-index:10;background:var(--header-bg);backdrop-filter:blur(10px);border-bottom:1px solid var(--border);padding:calc(14px + env(safe-area-inset-top)) 0 14px;}
.header-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;}
.header-row .brand{justify-self:start;}
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
.affiliate-btn:hover{opacity:.92;transform:translateY(-1px);}
.affiliate-btn-emag{background:linear-gradient(135deg,#0058CC 0%,#6A2FD9 55%,#C81ED6 100%);color:#fff;box-shadow:0 12px 26px -10px rgba(106,47,217,.5);display:flex;align-items:center;justify-content:center;gap:10px;transition:transform .18s ease,box-shadow .25s ease;}
.affiliate-btn-emag:hover{transform:translateY(-2px);box-shadow:0 18px 34px -8px rgba(200,30,214,.55),0 8px 18px -6px rgba(0,88,204,.4);}
.affiliate-btn-emag svg{width:20px;height:20px;flex:0 0 auto;}
.affiliate-btn-generic{background:linear-gradient(135deg,#FF5F1F,#FF7A1A);color:#1A1200;box-shadow:0 12px 26px -10px rgba(255,120,30,.5);}
.cinema-card{margin:14px 18px 0;padding:28px 24px;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:var(--radius-lg);text-align:center;}
.cinema-note{font-size:13px;color:var(--muted);line-height:1.6;margin:10px 0 18px;}
.cinema-btn{display:inline-block;background:linear-gradient(135deg,#E63946,#FF6B6B);color:#fff;text-decoration:none;font-family:var(--font-display);font-weight:700;font-size:15px;padding:14px 26px;border-radius:100px;box-shadow:0 12px 26px -10px rgba(230,57,70,.5);}
.amazon-btn{display:block;text-align:center;width:calc(100% - 36px);margin:14px 18px 0;padding:15px 20px;border-radius:100px;font-family:var(--font-display);font-weight:700;font-size:15px;text-decoration:none;background:linear-gradient(135deg,#131A22,#232F3E);color:#FF9900;border:1px solid #FF9900;box-shadow:0 12px 26px -10px rgba(0,0,0,.5);}
.ticket-btn{display:block;text-align:center;width:calc(100% - 36px);margin:8px 18px 16px;padding:14px 20px;border-radius:100px;font-family:var(--font-display);font-weight:700;font-size:14.5px;text-decoration:none;background:linear-gradient(135deg,#FF5533,#FF8A5B);color:#fff;box-shadow:0 12px 26px -10px rgba(255,85,51,.5);}
.sub-nav-tabs{display:flex;gap:6px;margin:14px 18px 0;background:#1e1e1e;border-radius:var(--radius-md);padding:6px;}
.sub-nav-tab{flex:1 1 0;background:transparent;border:none;border-radius:calc(var(--radius-md) - 4px);padding:13px 10px;font-family:var(--font-display);font-weight:700;font-size:13.5px;color:var(--muted);cursor:pointer;transition:background .18s ease,color .18s ease;text-align:center;min-height:44px;}
.sub-nav-tab.active{background:var(--accent);color:#1A1200;}
.sub-nav-panel{display:none;}
.sub-nav-panel.active{display:block;}
.attractions-country{margin:20px 18px 8px;font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text);}
.geo-country-highlight{margin:14px 18px 0;padding:12px 16px;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--accent);border-radius:var(--radius-md);font-size:13.5px;color:var(--muted);text-align:center;}
.geo-country-highlight strong{color:var(--accent);}
.search-box-wrap{position:relative;margin:14px 18px 0;}
.search-box-wrap .city-search-input{width:100%;}
.search-results{display:none;position:absolute;left:0;right:0;top:calc(100% + 6px);background:var(--glass-bg);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid var(--glass-border);border-radius:var(--radius-md);box-shadow:0 16px 32px -12px rgba(0,0,0,.6);z-index:20;max-height:320px;overflow-y:auto;}
.search-result-row{display:flex;align-items:center;gap:8px;padding:2px 10px;}
.search-result-row + .search-result-row{border-top:1px solid var(--border);}
.search-result-item{flex:1 1 auto;display:block;padding:11px 4px;font-size:14px;font-weight:600;color:var(--text);text-decoration:none;}
.search-result-empty{padding:14px 16px;font-size:13px;color:var(--muted);}
.fav-star{flex:0 0 auto;background:none;border:none;color:var(--muted);font-size:19px;line-height:1;cursor:pointer;padding:8px;min-width:36px;min-height:36px;}
/* Acordeon de obiective turistice, cu lazy-loading (vezi buildAttractionAccordionScript) */
.attraction-accordion-list{list-style:none;margin:14px 18px 0;display:flex;flex-direction:column;gap:8px;}
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
.lang-switcher{margin:10px 18px 0;font-size:12px;color:var(--muted);line-height:1.8;}
.lang-switcher a{color:var(--accent);margin:0 2px;}
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

  // vine cineva din bara de jos (#favorites, #search) — activăm tab-ul potrivit
  // și, pentru căutare, mutăm focusul direct în căsuță
  var hash = (window.location.hash || "").replace("#", "");
  if (hash === "favorites") { activate("favorites"); }
  if (hash === "search") {
    var input = document.getElementById("siteSearchInput");
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
  document.querySelectorAll(".attraction-accordion-header").forEach(function(header){
    header.addEventListener("click", function(){
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
  });
})();
</script>`;
}

function buildSearchAndFavoritesScript(nonce, customSearchIndex, favKey) {
  return `
<script nonce="${nonce}">
(function(){
  var SEARCH_INDEX = ${safeJson(customSearchIndex || buildSearchIndex())};
  var FAV_KEY = ${safeJson(favKey || "oht_favorites_v1")};

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
      panel.innerHTML = '<p class="fav-empty">Nothing saved yet. Going somewhere? Tap ☆ next to any store or attraction — for example, save 3 places you want to see in Berlin — and build your own list for the trip, right here.</p>';
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

  // căutare instant
  var input = document.getElementById("siteSearchInput");
  var results = document.getElementById("siteSearchResults");
  function norm(s){ return s.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase(); }
  if (input && results) {
    input.addEventListener("input", function(){
      var q = norm(input.value.trim());
      results.innerHTML = "";
      if (!q) { results.style.display = "none"; return; }
      var matches = SEARCH_INDEX.filter(function(item){ return norm(item.name).indexOf(q) !== -1; }).slice(0, 8);
      if (!matches.length) {
        results.innerHTML = '<div class="search-result-empty">No matches</div>';
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
function buildCityMapHtml(coords, cityName, nonce) {
  if (!coords) return "";

  const toggleHtml = `<label class="map-live-toggle"><input type="checkbox" id="mapOpenOnlyToggle"> Doar magazinele deschise acum</label>
<p id="mapLiveStatus" class="map-live-status">Se încarcă statusul live al magazinelor...</p>`;

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
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
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
  var toggle = document.getElementById("mapOpenOnlyToggle");
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
              icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: color, fillOpacity: 1, strokeWeight: 0, scale: 8 },
            });
          } else if (backend === "leaflet" && typeof L !== "undefined") {
            marker = L.circleMarker([store.lat, store.lng], { radius: 8, color: color, fillColor: color, fillOpacity: 0.9 })
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


function buildCountryFilterScript(nonce, initialCountry, initialCity) {
  return `
<script nonce="${nonce}">
(function(){
  var INITIAL_COUNTRY = ${safeJson(initialCountry || null)};
  var INITIAL_CITY = ${safeJson(initialCity ? normalizeSlug(initialCity) : null)};

  function selectCountry(code){
    var target = code || "all";
    document.querySelectorAll(".country-filter-block").forEach(function(el){
      var match = el.getAttribute("data-country-block") === target;
      el.style.display = match ? "block" : "none";
      el.classList.toggle("active", match);
    });
    document.querySelectorAll(".country-flag-btn").forEach(function(btn){
      btn.classList.toggle("active", btn.getAttribute("data-country-select") === target);
    });
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

function buildBottomNavHtml(langCode) {
  const isRo = langCode === "ro";
  const labels = isRo
    ? { home: "Acasă", search: "Căutare", favorites: "Favorite", map: "Hartă" }
    : { home: "Home", search: "Search", favorites: "Favorites", map: "Map" };
  return `
<nav class="bottom-nav">
  <a href="/" class="bottom-nav-item"><span class="bottom-nav-icon">🏠</span><span>${escapeHtml(labels.home)}</span></a>
  <a href="/#search" class="bottom-nav-item"><span class="bottom-nav-icon">🔍</span><span>${escapeHtml(labels.search)}</span></a>
  <a href="/#favorites" class="bottom-nav-item"><span class="bottom-nav-icon">⭐</span><span>${escapeHtml(labels.favorites)}</span></a>
  <a href="/#harta" class="bottom-nav-item" id="bottomNavMap"><span class="bottom-nav-icon">🗺️</span><span>${escapeHtml(labels.map)}</span></a>
</nav>`;
}

function buildBottomNavScript(nonce) {
  return `
<script nonce="${nonce}">
(function(){
  var mapLink = document.getElementById("bottomNavMap");
  if (!mapLink) return;
  mapLink.addEventListener("click", function(e){
    var existingMap = document.getElementById("cityMap");
    if (existingMap) {
      e.preventDefault();
      existingMap.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // altfel, lasă link-ul să navigheze normal spre acasă
  });
})();
</script>`;
}

function pageShell({ title, description, canonical, bodyHtml, dataForClient, nonce, langCode, alternateLinks }) {
  const meta = LANG_META[langCode] || LANG_META.ro;
  const alternatesHtml = (alternateLinks || [])
    .map((l) => `<link rel="alternate" hreflang="${escapeHtml(l.hreflang)}" href="${escapeHtml(l.href)}">`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="${meta.lang}">
<head>
${codAnalytics ? withNonce(codAnalytics, nonce) : ""}
<!-- GetYourGuide Analytics -->
<script async defer src="https://widget.getyourguide.com/dist/pa.umd.production.min.js" data-gyg-partner-id="LM6J21N"></script>
<!-- Travelpayouts — GetTransfer + Omio, din contul tău Travelpayouts -->
<script nowprocket data-noptimize="1" data-cfasync="false" data-wpfc-render="false" seraph-accel-crit="1" data-no-defer="1" data-cmp-ab="2" nonce="${nonce}">
  (function () {
      var script = document.createElement("script");
      script.async = 1;
      script.setAttribute("data-cmp-ab","2");
      script.src = 'https://tp-em.com/NTY0OTM4.js?t=564938';
      document.head.appendChild(script);
  })();
</script>
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
${adsensePublisherId ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}" crossorigin="anonymous"></script>` : ""}
<style nonce="${nonce}">${CSS_STYLES}</style>
</head>
<body>
${bodyHtml}
${buildThemeToggleHtml()}
${buildBottomNavHtml(langCode)}
${dataForClient ? buildClientScript(dataForClient, nonce) : ""}
${buildBottomNavScript(nonce)}
${buildThemeToggleScript(nonce)}
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
async function renderStorePage({ orasSlug, orasDisplay, magazinSlug, magazinDisplay, locatieDisplay, store, magazinKey, baseUrl, nonce }) {
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
    // link specific brandului (Lidl/Kaufland/...), gol până e completat manual în cod
    const catalogLink = magazinKey ? STORE_AFFILIATE_LINKS[magazinKey] || "" : "";
    const affiliateButtonHtml = catalogLink
      ? `<a href="${escapeHtml(catalogLink)}" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-generic">🔥 Vezi catalogul cu reduceri ${escapeHtml(magazinDisplay)} de azi</a>`
      : "";

    // status live (Google), DOAR pentru magazine normale, fără hiper-local
    // (paginile de cartier nu au propriul place_id, sunt variații ale
    // aceleiași locații de bază) — dacă nu găsim nimic, cade pe orele fixe,
    // exact ca înainte, fără nicio schimbare vizibilă.
    const liveSlug = !locatieDisplay ? toDbSlug(`${magazinDisplay}-${orasDisplay}`) : null;
    const live = liveSlug ? await tryGetLiveStatus(liveSlug, "ro") : null;

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
    <a class="brand" href="/">Programul<span>DeAzi</span></a>
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
${buildContextualWidgetScript(nonce)}
${buildReportIssueScript(nonce)}
${buildHowToGetThereScript(nonce)}`;

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
function renderCityPage({ orasSlug, orasDisplay, baseUrl, nonce }) {
  const title = `Program Magazine ${orasDisplay} Azi – Lidl, Kaufland, Penny și Alte Magazine`;
  const description = `Alege un magazin din ${orasDisplay} și vezi instant dacă este deschis acum: Lidl, Kaufland, Penny, Mega Image, Carrefour, Auchan sau mall-ul din ${orasDisplay}.`;
  const canonical = `${baseUrl}/${orasSlug}`;

  const listItems = Object.keys(STORE_CONFIG)
    .filter((key) => isSelectiveBrandAllowedInCity(key, orasDisplay))
    .map((key) => {
      const cfg = STORE_CONFIG[key];
      const urlSlug = cfg.slug || key;
      const statusKey = extractStatusEntity(cfg) ? key : null;
      const href = `/${orasSlug}/${urlSlug}`;
      return `<li><button type="button" class="fav-star" data-name="${escapeHtml(cfg.name)} ${escapeHtml(orasDisplay)}" data-type="store" data-country="ro" data-href="${escapeHtml(href)}">☆</button>${brandBadgeHtml(cfg.name, statusKey)}<a href="${href}">${escapeHtml(cfg.name)} ${escapeHtml(orasDisplay)}</a></li>`;
    })
    .join("");

  // date pentru insignele live — DOAR cheie->orar, nimic în plus, cât mai mic posibil
  const statusDataset = {};
  Object.keys(STORE_CONFIG).forEach((key) => {
    const entity = extractStatusEntity(STORE_CONFIG[key]);
    if (entity) statusDataset[key] = entity;
  });

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <a class="brand" href="/">Programul<span>DeAzi</span></a>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">Acasă</a> / ${escapeHtml(orasDisplay)}</p>
  <h1 class="page-h1">Program magazine în ${escapeHtml(orasDisplay)}</h1>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}

  <p class="intro-text">Alege mai jos magazinul din ${escapeHtml(orasDisplay)} pentru care vrei să vezi programul de azi și statusul live „deschis” sau „închis”.</p>

  <ul class="mall-list">${listItems}</ul>

  ${buildCityMapHtml(CITY_COORDS[orasDisplay], orasDisplay, nonce)}

  <footer>
    <p><strong>Programul de Azi</strong> îți arată în timp real programul magazinelor din ${escapeHtml(orasDisplay)}: Lidl, Kaufland, Penny, Mega Image, Carrefour, Auchan și mall-uri.</p>
  </footer>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}
</main>
${buildListStatusBadgeScript(nonce, statusDataset)}
${buildLiveMapPinsScript(orasDisplay, "ro", nonce)}
${buildSearchAndFavoritesScript(nonce, [], "poa_favorites_v1")}`;

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
async function renderIntlStorePage({ countryCode, orasSlug, orasDisplay, magazinSlug, magazinDisplay, store, baseUrl, lang, nonce }) {
  const t = (lang && TRANSLATIONS[lang]) || COUNTRIES[countryCode].t;
  const activeLang = (lang && TRANSLATIONS[lang]) ? lang : Object.keys(TRANSLATIONS).find((k) => TRANSLATIONS[k] === COUNTRIES[countryCode].t) || "uk";
  const title = t.titleTemplate(magazinDisplay, orasDisplay);
  const description = t.descriptionTemplate(magazinDisplay, orasDisplay);
  const canonical = `${baseUrl}/${countryCode}/${orasSlug}/${magazinSlug}`; // canonical rămâne mereu fără ?lang, indiferent ce limbă se afișează

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
    <a class="brand" href="/">Opening<span>HoursToday</span></a>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">${escapeHtml(t.home)}</a> / <a href="/${countryCode}/${orasSlug}">${escapeHtml(orasDisplay)}</a> / ${escapeHtml(magazinDisplay)}</p>
  ${buildLanguageSwitcher(activeLang, `/${countryCode}/${orasSlug}/${magazinSlug}`)}
  ${mainHtml}
  <footer>
    <p><strong>Opening Hours Today</strong> ${escapeHtml(t.footer(`${magazinDisplay} ${orasDisplay}`))}</p>
  </footer>
</main>`;
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
    ? `<a href="${escapeHtml(linkAmazonAffiliate)}" target="_blank" rel="noopener sponsored" class="amazon-btn">${escapeHtml(t.amazonBtn)}</a>`
    : "";

  // status live (Google) — același slug generat la popularea bazei
  // (nume + oraș + cod țară), în limba activă a paginii (nu implicită)
  const liveSlug = toDbSlug(`${magazinDisplay}-${orasDisplay}-${countryCode}`);
  const googleLang = toGoogleLang(activeLang);
  const live = await tryGetLiveStatus(liveSlug, googleLang);

  let statusCardHtml;
  let weeklySectionHtml;

  if (live && live.isOpenNow !== null) {
    const specialBanner = live.isSpecialDay && countryCode === "ro" && isRealRomanianHolidayToday(live.utcOffsetMinutes)
      ? `<div class="geo-country-highlight">📅 ${escapeHtml(t.closedHoliday ? t.closedHoliday.split(" — ")[0] : "Special hours today")}</div>`
      : "";
    statusCardHtml = `
  <div class="status-card ${live.isOpenNow ? "is-open" : "is-closed"}" id="statusCard">
    <div class="store-name">${escapeHtml(magazinDisplay)} ${escapeHtml(orasDisplay)}</div>
    <div class="status-text">${live.isOpenNow ? escapeHtml(t.labels.openNow) : escapeHtml(t.labels.closedNow)}</div>
    <div class="status-sub">Live · Google</div>
    <div class="status-badge"><span class="dotw"></span><span id="statusBadge">${escapeHtml(t.todayLabel)}</span></div>
  </div>
  ${contactInfoHtml(live)}
  ${buildHowToGetThereHtml(HOW_TO_GET_THERE_LABELS_EN, `${magazinDisplay} ${orasDisplay}`)}
  ${buildReportIssueHtml({ slug: `${countryCode}/${orasSlug}/${magazinSlug}`, name: `${magazinDisplay} ${orasDisplay}`, oras: orasDisplay, labels: REPORT_ISSUE_LABELS_EN })}
  ${specialBanner}
  ${buildContextualWidgetHtml({ type: "store", name: magazinDisplay, orasDisplay, labels: CONTEXTUAL_WIDGET_LABELS_EN })}`;
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
    <div class="store-name">${escapeHtml(magazinDisplay)} ${escapeHtml(orasDisplay)}</div>
    <div class="status-text">—</div>
    <div class="status-sub">${escapeHtml(t.calculating)}</div>
    <div class="status-badge"><span class="dotw"></span><span id="statusBadge">${escapeHtml(t.todayLabel)}</span></div>
    <div class="closing-soon-bar" id="closingSoonBar" style="display:none"><div class="closing-soon-fill" id="closingSoonFill"></div></div>
  </div>
  ${buildHowToGetThereHtml(HOW_TO_GET_THERE_LABELS_EN, `${magazinDisplay} ${orasDisplay}`)}
  ${buildReportIssueHtml({ slug: `${countryCode}/${orasSlug}/${magazinSlug}`, name: `${magazinDisplay} ${orasDisplay}`, oras: orasDisplay, labels: REPORT_ISSUE_LABELS_EN })}
  ${buildContextualWidgetHtml({ type: "store", name: magazinDisplay, orasDisplay, labels: CONTEXTUAL_WIDGET_LABELS_EN })}`;
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
    statusCardHtml = renderClosedPermanentlyHtml(`${magazinDisplay} ${orasDisplay}`, CLOSED_PERMANENTLY_LABELS_EN);
    weeklySectionHtml = "";
  } else if (reportCounts.programGresit >= REPORT_THRESHOLD) {
    reportedWrongHtml = reportedWrongBannerHtml(REPORTED_WRONG_LABELS_EN);
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
    <a class="brand" href="/">Opening<span>HoursToday</span></a>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">${escapeHtml(t.home)}</a> / <a href="/${countryCode}/${orasSlug}">${escapeHtml(orasDisplay)}</a> / ${escapeHtml(magazinDisplay)}</p>
  ${buildLanguageSwitcher(activeLang, `/${countryCode}/${orasSlug}/${magazinSlug}`)}

  ${reportedWrongHtml}
  ${statusCardHtml}

  ${amazonButtonHtml}

  ${weeklySectionHtml}

  <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.holidaysTitle)}</h2>
  <div class="holiday-card">${holidayHtml}</div>

  <p class="disclaimer">${escapeHtml(t.disclaimer(`${magazinDisplay} ${orasDisplay}`))}</p>

  <footer>
    <p><strong>Opening Hours Today</strong> ${escapeHtml(t.footer(`${magazinDisplay} ${orasDisplay}`))}</p>
  </footer>
</main>
${buildContextualWidgetScript(nonce)}
${buildReportIssueScript(nonce, REPORT_ISSUE_LABELS_EN)}
${buildHowToGetThereScript(nonce)}`;

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
function renderIntlCityPage({ countryCode, orasSlug, orasDisplay, baseUrl, lang, nonce }) {
  const country = COUNTRIES[countryCode];
  const t = (lang && TRANSLATIONS[lang]) || country.t;
  const activeLang = (lang && TRANSLATIONS[lang]) ? lang : Object.keys(TRANSLATIONS).find((k) => TRANSLATIONS[k] === country.t) || "uk";
  const title = `${orasDisplay} — Opening Hours Today`;
  const description = t.descriptionTemplate("", orasDisplay);
  const canonical = `${baseUrl}/${countryCode}/${orasSlug}`;

  const listItems = Object.keys(country.config)
    .filter((key) => countryCode !== "ro" || isSelectiveBrandAllowedInCity(key, orasDisplay))
    .map((key) => {
      const cfg = country.config[key];
      const urlSlug = cfg.slug || key;
      const statusKey = extractStatusEntity(cfg) ? key : null;
      const href = `/${countryCode}/${orasSlug}/${urlSlug}`;
      return `<li><button type="button" class="fav-star" data-name="${escapeHtml(cfg.name)} ${escapeHtml(orasDisplay)}" data-type="store" data-country="${escapeHtml(countryCode)}" data-href="${escapeHtml(href)}">☆</button>${brandBadgeHtml(cfg.name, statusKey)}<a href="${href}">${escapeHtml(cfg.name)} ${escapeHtml(orasDisplay)}</a></li>`;
    })
    .join("");

  // date pentru insignele live — la fel ca pe RO, funcție comună (vezi
  // extractStatusEntity), ca site-ul internațional să nu mai rămână în urmă
  const statusDataset = {};
  Object.keys(country.config).forEach((key) => {
    const entity = extractStatusEntity(country.config[key]);
    if (entity) statusDataset[key] = entity;
  });

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <a class="brand" href="/">Opening<span>HoursToday</span></a>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">${escapeHtml(t.home)}</a> / ${escapeHtml(orasDisplay)}</p>
  ${buildLanguageSwitcher(activeLang, `/${countryCode}/${orasSlug}`)}
  <h1 class="page-h1">${escapeHtml(orasDisplay)}</h1>
  <ul class="mall-list">${listItems}</ul>
  ${buildCityMapHtml(CITY_COORDS[orasDisplay], orasDisplay, nonce)}
</main>
${buildListStatusBadgeScript(nonce, statusDataset)}
${buildLiveMapPinsScript(orasDisplay, lang, nonce)}
${buildSearchAndFavoritesScript(nonce, [], "oht_favorites_v1")}`;

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
function renderIntlHomePage(nonce, baseUrl, detectedCountry, detectedCity) {
  const title = "Opening Hours Today — Is the store open now?";
  const description = "Check instantly whether major stores and attractions across Europe are open right now, plus full weekly and holiday opening hours.";
  const canonical = `${baseUrl}/`;

  const allCodes = ["ro", "de", "uk", "es", "fr", "it", "pl", "nl", "at", "be", "dk", "se", "pt", "cz", "fi", "gr", "hu", "hr"];
  const countryLinks = allCodes.map((code) => ({
    code,
    flag: COUNTRY_LABELS[code].split(" ")[0],
    name: COUNTRY_LABELS[code].split(" ").slice(1).join(" "),
    href: `/${code}/${slugifyCityName(COUNTRIES[code].cities[0])}`,
  }));

  const validDetected = detectedCountry && COUNTRIES[detectedCountry] ? detectedCountry : null;
  const geoHighlightHtml = validDetected
    ? `<div class="geo-country-highlight">📍 Looks like you're in <strong>${escapeHtml(detectedCity ? `${detectedCity}, ${COUNTRY_LABELS[validDetected].split(" ").slice(1).join(" ")}` : COUNTRY_LABELS[validDetected])}</strong> — showing that first. Tap 🌍 to browse everything, or pick another flag below anytime.</div>`
    : "";

  // bară persistentă de filtrare — vizibilă indiferent pe ce tab ești (Stores
  // sau Attractions), aceeași selecție se aplică simultan la amândouă.
  const filterBarHtml = `
  <nav class="store-scroll country-filter-bar">
    <button type="button" class="chip country-flag-btn" data-country-select="all">🌍 All</button>
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
    <h2 class="section-title"><span class="bar"></span>Choose a country</h2>
    <ul class="mall-list" hidden>${countryLinks.map((c) => `<li><a href="${c.href}" class="country-pick" data-country="${c.code}">${c.flag} ${escapeHtml(c.name)}</a></li>`).join("")}</ul>
  </div>`;

  const storesByCountryHtml = allCodes
    .map((code) => {
      const cityItems = COUNTRIES[code].cities
        .map((city) => `<li><a href="/${code}/${slugifyCityName(city)}">${escapeHtml(city)}</a></li>`)
        .join("");
      const listId = `allCitiesList-${code}`;
      const citySelectorHtml = buildCitySelectorHtml({
        popularCities: COUNTRIES[code].cities.slice(0, 6),
        hrefPrefix: `/${code}/`,
      });
      return `
  <div class="country-filter-block" data-country-block="${code}" style="display:none">
    <p class="intro-text"><button type="button" class="clear-country-btn">🌍 Show all countries</button></p>
    <h2 class="section-title"><span class="bar"></span>Stores in ${escapeHtml(COUNTRY_LABELS[code])}</h2>
    ${citySelectorHtml}
    <ul class="mall-list" id="${listId}">${cityItems}</ul>
  </div>`;
    })
    .join("");

  // --- ATTRACTIONS: la fel — blocul "toate țările" (implicit) + câte un bloc ascuns per țară ---
  const attractionsAllBlockHtml = `
  <div class="country-filter-block active" data-country-block="all">
    <p class="intro-text">Official ticket and information pages — always check the live hours shown there before you visit. Tap ☆ to save one to your favorites.</p>
    ${Object.keys(ATTRACTIONS)
      .map((code) => {
        const items = ATTRACTIONS[code]
          .map(
            (a) =>
              buildAttractionAccordionItem(a, code, null, true)
          )
          .join("");
        return `<h3 class="attractions-country">${COUNTRY_LABELS[code]}</h3><ul class="attraction-accordion-list">${items}</ul>`;
      })
      .join("")}
  </div>`;

  const attractionsByCountryHtml = Object.keys(ATTRACTIONS)
    .map((code) => {
      // orașul fiecărei atracții, dedus din numele ei — vezi detectAttractionCity().
      // Cele fără oraș detectat rămân mereu vizibile (fără data-city), la orice filtrare.
      const items = ATTRACTIONS[code]
        .map((a) => {
          const city = detectAttractionCity(a.name, code);
          return buildAttractionAccordionItem(a, code, city, true);
        })
        .join("");

      // bară de oraș, DOAR cu orașele care chiar au măcar o atracție detectată —
      // altfel ar fi un buton care nu filtrează nimic, confuz degeaba.
      const citiesWithMatches = [...new Set(ATTRACTIONS[code].map((a) => detectAttractionCity(a.name, code)).filter(Boolean))];
      const cityBarHtml = citiesWithMatches.length
        ? `<nav class="store-scroll city-filter-bar">
            <button type="button" class="chip city-flag-btn active" data-city-select="all">All ${escapeHtml(COUNTRY_LABELS[code].split(" ").slice(1).join(" "))}</button>
            ${citiesWithMatches.map((c) => `<button type="button" class="chip city-flag-btn" data-city-select="${escapeHtml(normalizeSlug(c))}">${escapeHtml(c)}</button>`).join("")}
          </nav>`
        : "";

      return `
  <div class="country-filter-block" data-country-block="${code}" style="display:none">
    <p class="intro-text"><button type="button" class="clear-country-btn">🌍 Show all countries</button></p>
    <h2 class="section-title"><span class="bar"></span>Attractions in ${escapeHtml(COUNTRY_LABELS[code])}</h2>
    ${cityBarHtml}
    <ul class="attraction-accordion-list">${items}</ul>
  </div>`;
    })
    .join("");

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <a class="brand" href="/">Opening<span>HoursToday</span></a>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <button type="button" id="installBtn" class="install-btn">${escapeHtml(TRANSLATIONS.uk.installBtn)}</button>
  <p id="iosInstallHint" class="ios-install-hint" style="display:none">On iPhone: tap the Share button and select "Add to Home Screen".</p>
  ${pushEnabled ? `<button type="button" id="pushSubBtn" class="push-sub-btn">🔔 Subscribe to alerts (holidays, special hours)</button>` : ""}

  <h1 class="page-h1">Is the store open right now?</h1>
  <p class="intro-text">Pick a country below to filter everything — Stores and Attractions both — or search directly.</p>
  ${filterBarHtml}

  <nav class="sub-nav-tabs">
    <button type="button" class="sub-nav-tab active" data-tab="stores">${escapeHtml(TRANSLATIONS.uk.tabStores)}</button>
    <button type="button" class="sub-nav-tab" data-tab="attractions">${escapeHtml(TRANSLATIONS.uk.tabAttractions)}</button>
    <button type="button" class="sub-nav-tab" data-tab="favorites">⭐ Favorites</button>
  </nav>

  <div class="search-box-wrap">
    <input type="text" id="siteSearchInput" class="city-search-input" placeholder="Search a store or attraction..." autocomplete="off">
    <div id="siteSearchResults" class="search-results"></div>
  </div>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}

  <div class="sub-nav-panel active" data-panel="stores">
    ${storesAllBlockHtml}
    ${storesByCountryHtml}
  </div>

  <div class="sub-nav-panel" data-panel="attractions">
    ${attractionsAllBlockHtml}
    ${attractionsByCountryHtml}
  </div>

  <div class="sub-nav-panel" data-panel="favorites">
    <h2 class="section-title"><span class="bar"></span>⭐ Your Favorites</h2>
    <p class="intro-text">Planning a trip? Tap ☆ next to any store or attraction — say, 3 places you want to see in Berlin — and they'll all be right here, ready to go, no need to search again. Add as many as you like, and tap ★ again anytime to remove one. Saved on this device only, not in an account.</p>
    <div id="favoritesList"></div>
  </div>

  <footer>
    <p><strong>Opening Hours Today</strong> shows you in real time whether major stores and tourist attractions across Europe are currently open, plus full weekly and holiday opening hours — search, browse by country, or save your favorites for next time.</p>
  </footer>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}
</main>
${buildTabsScript(nonce)}
${buildSearchAndFavoritesScript(nonce)}
${buildCountryFilterScript(nonce, validDetected, detectedCity)}
${buildAttractionAccordionScript(nonce)}
${buildInstallScript(nonce)}
${pushEnabled ? buildPushSubscribeScript(nonce, VAPID_PUBLIC_KEY, "🔔 Subscribe to alerts (holidays, special hours)", "🔕 Unsubscribe from alerts") : ""}`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: "uk" });
}

// Pagină de obiectiv turistic — RO — status live (dacă avem place_id
// valid) + buton de bilete. Dacă nu avem date live, NU inventăm program —
// arătăm clar că nu avem, cu link spre sursa oficială.
async function renderAttractionPageRO({ attraction, baseUrl, nonce }) {
  const slug = toDbSlug(attraction.name);
  const title = `${attraction.name} — Program și Bilete`;
  const description = `Vezi programul actualizat și rezervă bilete online pentru ${attraction.name}.`;
  const canonical = `${baseUrl}/obiectiv/${slug}`;

  const live = await tryGetLiveStatus(slug, "ro");

  let statusHtml;
  let widgetHtml = "";
  let widgetScriptHtml = "";
  if (live && live.isOpenNow !== null) {
    const specialBanner = live.isSpecialDay && isRealRomanianHolidayToday(live.utcOffsetMinutes)
      ? `<div class="geo-country-highlight">📅 Azi e sărbătoare legală — verifică programul de mai jos, actualizat live.</div>`
      : "";
    const weeklyHtml = live.weeklyScheduleText.length
      ? `<div class="holiday-card">${live.weeklyScheduleText.map((line) => `<div class="holiday-row"><span class="holiday-label">${escapeHtml(line)}</span></div>`).join("")}</div>`
      : "";
    statusHtml = `
    <div class="status-card ${live.isOpenNow ? "is-open" : "is-closed"}" id="statusCard">
      <div class="store-name">${escapeHtml(attraction.name)}</div>
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
    statusHtml = `<div class="geo-country-highlight">ℹ️ Nu avem încă program live pentru acest obiectiv. Verifică programul actualizat pe <a href="${escapeHtml(attraction.url)}" target="_blank" rel="noopener">site-ul oficial</a>.</div>`;
  }

  // biletul e acum mereu în "Planifică vizita" (buildBookingPlanningButtonsHtml)
  // — nu mai are nevoie de un fallback separat aici

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <a class="brand" href="/">Programul<span>DeAzi</span></a>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">Acasă</a> / ${escapeHtml(attraction.name)}</p>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}

  ${statusHtml}
  ${widgetHtml}

  ${buildBookingPlanningButtonsHtml({ name: attraction.name, city: detectAttractionCity(attraction.name, "ro"), countryCode: "ro" })}
  ${buildHowToGetThereHtml(HOW_TO_GET_THERE_LABELS_RO, attraction.name)}

  <p class="disclaimer">Informațiile despre ${escapeHtml(attraction.name)} sunt orientative. Pentru detalii complete, verifică <a href="${escapeHtml(attraction.url)}" target="_blank" rel="noopener">site-ul oficial</a>.</p>

  <footer>
    <p><strong>Programul de Azi</strong> îți arată dacă ${escapeHtml(attraction.name)} este deschis chiar acum, plus acces rapid la bilete online.</p>
  </footer>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}
</main>
${widgetScriptHtml}
${buildHowToGetThereScript(nonce)}
${buildPlanVisitScript(nonce)}`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: "ro" });
}

// Pagină de obiectiv turistic — INTERNAȚIONAL — aceeași logică, adaptată
// la limbă (traduceri deja existente, TRANSLATIONS)
async function renderAttractionPageIntl({ attraction, countryCode, lang, baseUrl, nonce }) {
  const t = (lang && TRANSLATIONS[lang]) || COUNTRIES[countryCode].t;
  const activeLang = (lang && TRANSLATIONS[lang]) ? lang : Object.keys(TRANSLATIONS).find((k) => TRANSLATIONS[k] === COUNTRIES[countryCode].t) || "uk";
  const slug = toDbSlug(attraction.name);
  const title = `${attraction.name} — Opening Hours Today`;
  const description = `${attraction.name} — check today's opening hours and book tickets online.`;
  const canonical = `${baseUrl}/${countryCode}/obiectiv/${slug}`;

  const googleLang = toGoogleLang(activeLang);
  const live = await tryGetLiveStatus(slug, googleLang);

  let statusHtml;
  let widgetHtml = "";
  let widgetScriptHtml = "";
  if (live && live.isOpenNow !== null) {
    const weeklyHtml = live.weeklyScheduleText.length
      ? `<div class="holiday-card">${live.weeklyScheduleText.map((line) => `<div class="holiday-row"><span class="holiday-label">${escapeHtml(line)}</span></div>`).join("")}</div>`
      : "";
    statusHtml = `
    <div class="status-card ${live.isOpenNow ? "is-open" : "is-closed"}" id="statusCard">
      <div class="store-name">${escapeHtml(attraction.name)}</div>
      <div class="status-text">${live.isOpenNow ? escapeHtml(t.labels.openNow) : escapeHtml(t.labels.closedNow)}</div>
      <div class="status-sub">Live · Google</div>
      <div class="status-badge"><span class="dotw"></span><span id="statusBadge">${escapeHtml(t.todayLabel)}</span></div>
    </div>
    ${contactInfoHtml(live)}
    <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.weeklyTitle)} (live, Google)</h2>
    ${weeklyHtml}`;
    widgetHtml = buildContextualWidgetHtml({ type: "attraction", name: attraction.name, orasDisplay: null, labels: CONTEXTUAL_WIDGET_LABELS_EN });
    widgetScriptHtml = buildContextualWidgetScript(nonce);
  } else {
    statusHtml = `<div class="geo-country-highlight">ℹ️ Live hours aren't available yet for this place. Check the <a href="${escapeHtml(attraction.url)}" target="_blank" rel="noopener">official site</a> for up-to-date info.</div>`;
  }

  // biletul e acum mereu în "Plan your visit" (buildBookingPlanningButtonsHtml)

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <a class="brand" href="/">Opening<span>HoursToday</span></a>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">${escapeHtml(t.home)}</a> / ${escapeHtml(attraction.name)}</p>
  ${buildLanguageSwitcher(activeLang, `/${countryCode}/obiectiv/${slug}`)}

  ${statusHtml}
  ${widgetHtml}

  ${buildBookingPlanningButtonsHtml({ name: attraction.name, city: detectAttractionCity(attraction.name, countryCode), labels: BOOKING_PLANNING_LABELS_EN, countryCode })}
  ${buildHowToGetThereHtml(HOW_TO_GET_THERE_LABELS_EN, attraction.name)}

  <footer>
    <p><strong>Opening Hours Today</strong> shows if ${escapeHtml(attraction.name)} is open right now, plus quick access to tickets.</p>
  </footer>
</main>
${widgetScriptHtml}
${buildHowToGetThereScript(nonce)}
${buildPlanVisitScript(nonce)}`;

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

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <a class="brand" href="/">Programul<span>DeAzi</span></a>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <p class="breadcrumb"><a href="/">Acasă</a> / <a href="/${slugifyCityName(orasDisplay)}">${escapeHtml(orasDisplay)}</a> / ${escapeHtml(magazinDisplay)}</p>
  ${nearestBlockHtml}

  <h2 class="section-title"><span class="bar"></span>${escapeHtml(magazinDisplay)} — toate orașele confirmate</h2>
  <ul class="mall-list">${allowedListHtml}</ul>

  <footer>
    <p><strong>Programul de Azi</strong> arată doar branduri cu prezență reală, verificată, în fiecare oraș.</p>
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
    <a class="brand" href="/">Programul<span>DeAzi</span></a>
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
  const attractionItemsHtml = ATTRACTIONS.ro
    .map(
      (a) =>
        buildAttractionAccordionItem(a, "ro", null, false)
    )
    .join("");

  // Sugestie pe baza IP-ului — NU redirect forțat. Pe rețele mobile din România,
  // IP-ul apare adesea "din București" indiferent de orașul real al vizitatorului,
  // așa că îi lăsăm mereu alegerea, vizibilă chiar sub sugestie.
  const geoSuggestionHtml = suggestedCity
    ? `<div class="geo-country-highlight">📍 Se pare că ești în <strong>${escapeHtml(suggestedCity.display)}</strong> — <a href="/${suggestedCity.slug}">vezi programul →</a>. Nu e orașul tău? Alege mai jos.</div>`
    : "";

  const bodyHtml = `
<header>
  <div class="wrap header-row">
    <a class="brand" href="/">Programul<span>DeAzi</span></a>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap">
  <button type="button" id="installBtn" class="install-btn">📱 Instalează aplicația pentru acces rapid</button>
  <p id="iosInstallHint" class="ios-install-hint" style="display:none">Pe iPhone: apasă pe butonul de Partajare (Share) și selectează „Adaugă pe ecranul de pornire”.</p>
  ${pushEnabled ? `<button type="button" id="pushSubBtn" class="push-sub-btn">🔔 Abonează-te la notificări (sărbători, program special)</button>` : ""}

  <h1 class="page-h1">Este magazinul deschis acum?</h1>
  <p class="intro-text">Alege mai jos ce cauți — magazine, obiective turistice sau favoritele tale — sau caută direct.</p>
  ${geoSuggestionHtml}

  <nav class="sub-nav-tabs">
    <button type="button" class="sub-nav-tab active" data-tab="stores">🛒 Magazine</button>
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
    <ul class="mall-list" id="allCitiesList">${allCitiesListHtml}</ul>
  </div>

  <div class="sub-nav-panel" data-panel="attractions">
    <p class="intro-text">Castele, cetăți, muzee și parcuri — link direct spre informații reale, actualizate. Apasă ☆ ca să salvezi unul la favorite.</p>
    <ul class="attraction-accordion-list">${attractionItemsHtml}</ul>
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
${buildInstallScript(nonce)}
${buildSearchAndFavoritesScript(nonce, buildSearchIndexRO(), "poa_favorites_v1")}
${buildAttractionAccordionScript(nonce)}
${pushEnabled ? buildPushSubscribeScript(nonce, VAPID_PUBLIC_KEY, "🔔 Abonează-te la notificări (sărbători, program special)", "🔕 Dezabonează-te de la notificări") : ""}`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: "ro" });
}

/* ============================================================
   6) SITEMAP — generat automat din orașe × branduri + mall-uri
   ============================================================ */

// cele mai mari 30 de orașe din România (nume complete, cu diacritice —
// slug-ul din URL se derivă automat mai jos, cu slugifyCityName)
const SITEMAP_CITIES = [
  "București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Craiova",
  "Brașov", "Galați", "Ploiești", "Oradea", "Brăila", "Arad", "Pitești",
  "Sibiu", "Bacău", "Târgu Mureș", "Baia Mare", "Buzău", "Botoșani",
  "Satu Mare", "Râmnicu Vâlcea", "Drobeta-Turnu Severin", "Suceava",
  "Piatra Neamț", "Târgu Jiu", "Târgoviște", "Focșani", "Bistrița",
  "Tulcea", "Reșița",
  // adăugate ulterior — verificate real (Lidl/Kaufland/Penny/Carrefour
  // confirmate prin căutare, cu adrese exacte, nu presupuse)
  "Alba Iulia", "Deva", "Zalău", "Vaslui", "Sfântu Gheorghe",
  "Miercurea Ciuc", "Slatina", "Alexandria", "Giurgiu", "Călărași", "Slobozia",
];

// România adăugată în registrul internațional (site-ul .eu) — reutilizează
// EXACT aceleași date reale, deja verificate (STORE_CONFIG, toate cele 41
// orașe). Include acum și mall-uri/cinematografe — renderIntlStorePage a
// fost extinsă să le suporte, cu structura lor completă de date.
const RO_INTL_STORE_CONFIG = {};
Object.keys(STORE_CONFIG).forEach((key) => {
  const cfg = STORE_CONFIG[key];
  if (cfg.type === "mall") {
    RO_INTL_STORE_CONFIG[key] = { name: cfg.name, slug: cfg.slug, type: "mall", zones: cfg.zones };
  } else if (cfg.type === "cinema") {
    RO_INTL_STORE_CONFIG[key] = { name: cfg.name, slug: cfg.slug, type: "cinema", ticketUrl: cfg.ticketUrl, weekly: cfg.weekly, holidays: cfg.holidays };
  } else {
    RO_INTL_STORE_CONFIG[key] = { name: cfg.name, slug: cfg.slug, weekly: cfg.weekly, holidays: cfg.holidays };
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
const CITY_COORDS = {
  "București": [44.4268, 26.1025],
  "Cluj-Napoca": [46.7712, 23.6236],
  "Timișoara": [45.7489, 21.2087],
  "Iași": [47.1585, 27.6014],
  "Constanța": [44.1598, 28.6348],
  "Craiova": [44.3302, 23.7949],
  "Brașov": [45.6427, 25.5887],
  "Galați": [45.4353, 28.008],
  "Ploiești": [44.9414, 26.0225],
  "Oradea": [47.0722, 21.9217],
  "Brăila": [45.2692, 27.9575],
  "Arad": [46.1866, 21.3123],
  "Pitești": [44.8565, 24.8692],
  "Sibiu": [45.7983, 24.1256],
  "Bacău": [46.567, 26.9146],
  "Târgu Mureș": [46.5527, 24.5575],
  "Baia Mare": [47.6567, 23.5666],
  "Buzău": [45.15, 26.8167],
  "Botoșani": [47.7486, 26.6693],
  "Satu Mare": [47.793, 22.8858],
  "Râmnicu Vâlcea": [45.1047, 24.3762],
  "Drobeta-Turnu Severin": [44.6367, 22.6597],
  "Suceava": [47.6459, 26.2554],
  "Piatra Neamț": [46.9276, 26.3707],
  "Târgu Jiu": [45.0347, 23.2761],
  "Târgoviște": [44.9256, 25.457],
  "Focșani": [45.6969, 27.1842],
  "Bistrița": [47.1362, 24.4998],
  "Tulcea": [45.1667, 28.8],
  "Reșița": [45.2967, 21.89],
  "Alba Iulia": [46.0697, 23.5804],
  "Deva": [45.8785, 22.9099],
  "Zalău": [47.1911, 23.0574],
  "Vaslui": [46.6383, 27.7292],
  "Sfântu Gheorghe": [45.8636, 25.7875],
  "Miercurea Ciuc": [46.3594, 25.8017],
  "Slatina": [44.4323, 24.3654],
  "Alexandria": [43.9642, 25.3336],
  "Giurgiu": [43.9037, 25.9699],
  "Călărași": [44.2058, 27.3306],
  "Slobozia": [44.5638, 27.3667],
  "Berlin": [52.52, 13.405],
  "München": [48.1351, 11.582],
  "Hamburg": [53.5511, 9.9937],
  "Frankfurt am Main": [50.1109, 8.6821],
  "Köln": [50.9375, 6.9603],
  "Stuttgart": [48.7758, 9.1829],
  "Düsseldorf": [51.2277, 6.7735],
  "Dortmund": [51.5136, 7.4653],
  "Leipzig": [51.3397, 12.3731],
  "Essen": [51.4556, 7.0116],
  "London": [51.5074, -0.1278],
  "Birmingham": [52.4862, -1.8904],
  "Manchester": [53.4808, -2.2426],
  "Glasgow": [55.8642, -4.2518],
  "Liverpool": [53.4084, -2.9916],
  "Leeds": [53.8008, -1.5491],
  "Sheffield": [53.3811, -1.4701],
  "Bristol": [51.4545, -2.5879],
  "Newcastle": [54.9783, -1.6178],
  "Nottingham": [52.9548, -1.1581],
  "Madrid": [40.4168, -3.7038],
  "Barcelona": [41.3874, 2.1686],
  "Valencia": [39.4699, -0.3763],
  "Sevilla": [37.3891, -5.9845],
  "Zaragoza": [41.6488, -0.8891],
  "Málaga": [36.7213, -4.4214],
  "Murcia": [37.9922, -1.1307],
  "Palma": [39.5696, 2.6502],
  "Bilbao": [43.263, -2.935],
  "Paris": [48.8566, 2.3522],
  "Marseille": [43.2965, 5.3698],
  "Lyon": [45.764, 4.8357],
  "Toulouse": [43.6047, 1.4442],
  "Nice": [43.7102, 7.262],
  "Nantes": [47.2184, -1.5536],
  "Strasbourg": [48.5734, 7.7521],
  "Montpellier": [43.6108, 3.8767],
  "Bordeaux": [44.8378, -0.5792],
  "Lille": [50.6292, 3.0573],
  "Roma": [41.9028, 12.4964],
  "Milano": [45.4642, 9.19],
  "Napoli": [40.8518, 14.2681],
  "Torino": [45.0703, 7.6869],
  "Palermo": [38.1157, 13.3615],
  "Bologna": [44.4949, 11.3426],
  "Firenze": [43.7696, 11.2558],
  "Venezia": [45.4408, 12.3155],
  "Genova": [44.4056, 8.9463],
  "Verona": [45.4384, 10.9916],
  "Warszawa": [52.2297, 21.0122],
  "Kraków": [50.0647, 19.945],
  "Łódź": [51.7592, 19.456],
  "Wrocław": [51.1079, 17.0385],
  "Poznań": [52.4064, 16.9252],
  "Gdańsk": [54.352, 18.6466],
  "Szczecin": [53.4285, 14.5528],
  "Bydgoszcz": [53.1235, 18.0084],
  "Lublin": [51.2465, 22.5684],
  "Katowice": [50.2649, 19.0238],
  "Amsterdam": [52.3676, 4.9041],
  "Rotterdam": [51.9244, 4.4777],
  "Den Haag": [52.0705, 4.3007],
  "Utrecht": [52.0907, 5.1214],
  "Eindhoven": [51.4416, 5.4697],
  "Groningen": [53.2194, 6.5665],
  "Tilburg": [51.5555, 5.0913],
  "Almere": [52.3508, 5.2647],
  "Breda": [51.5719, 4.7683],
  "Nijmegen": [51.8425, 5.8528],
  "Wien": [48.2082, 16.3738],
  "Graz": [47.0707, 15.4395],
  "Linz": [48.3069, 14.2858],
  "Salzburg": [47.8095, 13.055],
  "Innsbruck": [47.2692, 11.4041],
  "Klagenfurt": [46.6247, 14.3055],
  "Villach": [46.6111, 13.8558],
  "Wels": [48.1575, 14.0289],
  "Sankt Pölten": [48.2047, 15.6256],
  "Dornbirn": [47.4125, 9.7417],
  "Brussels": [50.8503, 4.3517],
  "Antwerpen": [51.2194, 4.4025],
  "Gent": [51.0543, 3.7174],
  "Charleroi": [50.4108, 4.4446],
  "Liège": [50.6326, 5.5797],
  "Brugge": [51.2093, 3.2247],
  "Namur": [50.4669, 4.8675],
  "Leuven": [50.8798, 4.7005],
  "Mons": [50.4542, 3.9564],
  "Aalst": [50.9378, 4.0397],
  "København": [55.6761, 12.5683],
  "Aarhus": [56.1629, 10.2039],
  "Odense": [55.4038, 10.4024],
  "Aalborg": [57.0488, 9.9217],
  "Esbjerg": [55.4765, 8.4594],
  "Randers": [56.4607, 10.0369],
  "Kolding": [55.4904, 9.4721],
  "Horsens": [55.8607, 9.8503],
  "Vejle": [55.7091, 9.5357],
  "Roskilde": [55.6415, 12.0803],
  "Stockholm": [59.3293, 18.0686],
  "Göteborg": [57.7089, 11.9746],
  "Malmö": [55.6050, 13.0038],
  "Uppsala": [59.8586, 17.6389],
  "Västerås": [59.6099, 16.5448],
  "Örebro": [59.2753, 15.2134],
  "Helsingborg": [56.0465, 12.6945],
  "Linköping": [58.4108, 15.6214],
  "Norrköping": [58.5877, 16.1924],
  "Karlstad": [59.3793, 13.5036],
  "Lisboa": [38.7223, -9.1393],
  "Porto": [41.1579, -8.6291],
  "Vila Nova de Gaia": [41.1239, -8.6118],
  "Amadora": [38.7536, -9.2302],
  "Braga": [41.5454, -8.4265],
  "Setúbal": [38.5244, -8.8882],
  "Coimbra": [40.2033, -8.4103],
  "Almada": [38.6800, -9.1580],
  "Faro": [37.0194, -7.9304],
  "Funchal": [32.6669, -16.9241],
  "Praha": [50.0755, 14.4378],
  "Brno": [49.1951, 16.6068],
  "Ostrava": [49.8209, 18.2625],
  "Plzeň": [49.7384, 13.3736],
  "Liberec": [50.7663, 15.0543],
  "Olomouc": [49.5938, 17.2509],
  "České Budějovice": [48.9745, 14.4747],
  "Hradec Králové": [50.2092, 15.8328],
  "Helsinki": [60.1699, 24.9384],
  "Tampere": [61.4978, 23.7610],
  "Turku": [60.4518, 22.2666],
  "Oulu": [65.0121, 25.4651],
  "Jyväskylä": [62.2426, 25.7473],
  "Kuopio": [62.8924, 27.6770],
  "Lahti": [60.9827, 25.6612],
  "Rovaniemi": [66.5039, 25.7294],
  "Athens": [37.9838, 23.7275],
  "Thessaloniki": [40.6401, 22.9444],
  "Patras": [38.2466, 21.7346],
  "Heraklion": [35.3387, 25.1442],
  "Larissa": [39.6390, 22.4191],
  "Volos": [39.3622, 22.9425],
  "Ioannina": [39.6650, 20.8537],
  "Chania": [35.5138, 24.0180],
  "Budapest": [47.4979, 19.0402],
  "Debrecen": [47.5316, 21.6273],
  "Szeged": [46.2530, 20.1414],
  "Miskolc": [48.1035, 20.7784],
  "Pécs": [46.0727, 18.2323],
  "Győr": [47.6875, 17.6504],
  "Nyíregyháza": [47.9495, 21.7244],
  "Kecskemét": [46.9062, 19.6913],
  "Zagreb": [45.8150, 15.9819],
  "Split": [43.5081, 16.4402],
  "Rijeka": [45.3271, 14.4422],
  "Osijek": [45.5550, 18.6955],
  "Zadar": [44.1194, 15.2314],
  "Pula": [44.8666, 13.8496],
  "Dubrovnik": [42.6507, 18.0944],
  "Šibenik": [43.7350, 15.8952],
};

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

app.get("/api/city-live-map", async (req, res) => {
  if (!dbPool || !GOOGLE_PLACES_API_KEY_LIVE) {
    res.status(503).json({ error: "not_configured" });
    return;
  }

  // 5 cereri pe 10 minute, per sursă — ruta asta poate declanșa zeci de
  // cereri către Google API la fiecare apel, cel mai costisitor loc de pe
  // tot site-ul, dacă ar fi bombardat
  const rateOk = await checkRateLimit(hashIp(getClientIp(req)), "city-live-map", 5, 10);
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

    const results = await Promise.all(
      validRows.map(async (row) => {
        try {
          const status = await getLocationStatus({ pool: dbPool, placeId: row.place_id, apiKey: GOOGLE_PLACES_API_KEY_LIVE, language: lang });
          if (status.lat == null || status.lng == null) return null;
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
    res.send(renderIntlHomePage(nonce, baseUrlFor(req), detectedCountry, detectedCity));
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
// (":tara(de|uk|es|fr|it|pl|nl|at|be|dk|ro|se|pt|cz|fi|gr|hu|hr)"), nu prin sintaxa "?" opțională, care e fragilă și
// se comportă inconsistent între versiunile de Express/path-to-regexp.
// Înregistrate ÎNAINTE de rutele RO, ca "/de/berlin/lidl" să nu fie
// interpretat greșit ca oraș="de" în sistemul românesc.
// Accesibile DOAR pe opening-hours-today.eu — pe programul-de-azi.ro,
// redirect 301 către domeniul internațional (nu duplicăm conținutul).
// ============================================================

// ruta de obiectiv turistic — ÎNAINTEA rutei generice de magazin (aceeași
// formă, 3 segmente: /:tara/:oras/:magazin) — altfel "obiectiv" ar fi
// interpretat greșit ca nume de oraș
app.get("/:tara(de|uk|es|fr|it|pl|nl|at|be|dk|ro|se|pt|cz|fi|gr|hu|hr)/obiectiv/:slug", async (req, res) => {
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
  const html = await renderAttractionPageIntl({ attraction: found.attraction, countryCode, lang: requestedLang, baseUrl: baseUrlFor(req), nonce });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/:tara(de|uk|es|fr|it|pl|nl|at|be|dk|ro|se|pt|cz|fi|gr|hu|hr)/:oras/:magazin", async (req, res, next) => {
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

  // Pentru RO, aceleași restricții de brand ca pe .ro (Metro, Selgros, IKEA
  // etc. nu sunt peste tot) — fără asta, ar apărea greșit peste tot pe
  // varianta internațională, o regresie față de .ro unde funcționează corect
  if (countryCode === "ro" && !isSelectiveBrandAllowedInCity(found.key, orasDisplay)) {
    res.status(404).send("Pagină negăsită.");
    return;
  }

  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const requestedLang = req.query && TRANSLATIONS[req.query.lang] ? req.query.lang : null;
  const html = await renderIntlStorePage({ countryCode, orasSlug, orasDisplay, magazinSlug, magazinDisplay: found.displayName, store: found.config, baseUrl: baseUrlFor(req), lang: requestedLang, nonce });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/:tara(de|uk|es|fr|it|pl|nl|at|be|dk|ro|se|pt|cz|fi|gr|hu|hr)/:oras", (req, res, next) => {
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
  const html = renderIntlCityPage({ countryCode, orasSlug, orasDisplay, baseUrl: baseUrlFor(req), lang: requestedLang, nonce });
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

  if (found && !isSelectiveBrandAllowedInCity(found.key, orasDisplay)) {
    const nonce = generateNonce();
    res.set("Content-Security-Policy", buildCsp(nonce));
    const html = renderBrandNotInCityPage({ magazinDisplay, orasDisplay, magazinKey: found.key, baseUrl: baseUrlFor(req), nonce });
    res.status(200).set("Content-Type", "text/html; charset=utf-8").send(html);
    return;
  }

  const effectiveStore = found ? found.config : { type: "store", weekly: supermarketWeekly(), holidays: SUPERMARKET_HOLIDAYS };

  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const html = await renderStorePage({ orasSlug, orasDisplay, magazinSlug, magazinDisplay, locatieDisplay, store: effectiveStore, magazinKey: found ? found.key : null, baseUrl: baseUrlFor(req), nonce });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// ruta de obiectiv turistic RO — ÎNAINTEA rutei generice de magazin
// (aceeași formă, 2 segmente: /:oras/:magazin) — altfel "obiectiv" ar fi
// interpretat greșit ca nume de oraș
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
  const html = await renderAttractionPageRO({ attraction: found.attraction, baseUrl: baseUrlFor(req), nonce });
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

  if (found && !isSelectiveBrandAllowedInCity(found.key, orasDisplay)) {
    const nonce = generateNonce();
    res.set("Content-Security-Policy", buildCsp(nonce));
    const html = renderBrandNotInCityPage({ magazinDisplay, orasDisplay, magazinKey: found.key, baseUrl: baseUrlFor(req), nonce });
    res.status(200).set("Content-Type", "text/html; charset=utf-8").send(html);
    return;
  }

  // dacă brand-ul nu e cunoscut, folosim tot programul standard național ca implicit,
  // dar păstrăm numele exact așa cum a fost tastat în URL
  const effectiveStore = found ? found.config : { type: "store", weekly: supermarketWeekly(), holidays: SUPERMARKET_HOLIDAYS };

  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const html = await renderStorePage({ orasSlug, orasDisplay, magazinSlug, magazinDisplay, store: effectiveStore, magazinKey: found ? found.key : null, baseUrl: baseUrlFor(req), nonce });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/:oras", (req, res, next) => {
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

  const html = renderCityPage({ orasSlug, orasDisplay, baseUrl: baseUrlFor(req), nonce });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
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

module.exports = app;

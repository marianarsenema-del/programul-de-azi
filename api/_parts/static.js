// Generat automat din server.js — date statice: CSS, texte, scripturi client (cod mutat fără modificări de logică).
const { Pool } = require("pg");
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

 // necesar pentru rutele de abonare push (POST cu JSON în body)

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

// ⚠️ IMPORTANT pentru orice modificare viitoare: cu migrarea activă, vizitatorii
// români văd DOAR paginile .eu (/ro/<oraș>, /ro/<oraș>/<magazin>, /ro/obiectiv/...),
// construite de funcțiile renderIntl...(). Paginile vechi românești
// (renderCityPage, renderStorePage, renderHomePage etc.) au fost ȘTERSE din cod;
// adresele lor vechi redirecționează spre .eu (vezi redirectLegacyRoPage).
// Rămân live pe programul-de-azi.ro doar
// secțiunile din lista de excepții de mai sus: /cazare, /cont, /admin,
// /restaurant, /itinerar, /propune, /api etc.
const RO_TO_EU_MIGRATION_EXCLUDED_PREFIXES = ["/api/", "/manifest.json", "/sw.js", "/robots.txt", "/ads.txt", "/sitemap.xml", "/icon.svg", "/icon-512.png", "/icon-192.png", "/icon-maskable-512.png", "/favicon.ico", "/style.css", "/badge.js", "/cad147c6a5b6cb338e880ca855c2679f.html", "/2697e31851e3c90a2ff17b8730d67b88.html", "/itinerar", "/propune", "/admin", "/cazare", "/restaurant", "/atractie", "/loc", "/revendica", "/cont", "/pleci"];

const RO_TO_EU_GUIDES_MAP = { "/ghiduri": "/guides", "/ghiduri/transport": "/guides/transport", "/ghiduri/parcari": "/guides/parking", "/ghiduri/restaurante": "/guides/restaurants" };



// Buton „înapoi” unificat pe TOT site-ul: cerc albastru-închis, contur și
// săgeată portocalii, trasabil cu degetul. Paginile construite cu pageShell()
// îl au deja; aici îl adăugăm automat pe toate celelalte pagini HTML (cazare,
// cont proprietar, login, admin, formulare etc.), fără să atingem fiecare rută.
// Excepții: paginile care au deja butonul, și formularele cu bara de jos
// „← / Continuă” (acolo săgeata e deja în bară, în același stil).
const GLOBAL_BACK_BTN_INLINE_CSS = `<style>.global-back-btn{position:fixed;top:auto;bottom:calc(24px + env(safe-area-inset-bottom,0px));left:14px;z-index:900;width:44px;height:44px;border-radius:50%;background:#1A1F35;border:2px solid #F0813A;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#F0813A;padding:0;line-height:1;font-family:inherit;cursor:grab;box-shadow:0 10px 24px -6px rgba(0,0,0,.45),0 2px 6px -1px rgba(0,0,0,.3);transition:box-shadow .15s ease,transform .15s ease;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}.global-back-btn[hidden]{display:none;}.global-back-btn:active{transform:scale(.94);}.global-back-btn.is-dragging{cursor:grabbing;transform:scale(1.08);}</style>`;

// Pagini din contul proprietarului cu o pagină „părinte” clară: butonul
// înapoi duce acolo, nu la pagina vizitată anterior. Altfel, după ce
// proprietarul a intrat pe pasul următor și s-a întors, „înapoi” l-ar
// fi dus din nou înainte (bug semnalat pe /cont/alege-tip).
const BACK_PARENT_BY_PATH = {
  "/cont/alege-tip": "/cont",
  "/cont/date-fiscale": "/cont",
  "/cont/facturi-abonamente": "/cont",
  "/cont/informatii": "/cont",
  "/cont/contact": "/cont",
};


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

// Secțiunea "Cazare" (director pensiuni/cazări mici) — funcționalitate NOUĂ,
// în construcție. Rămâne complet ascunsă (404 pentru oricine) cât timp
// ACCOMMODATION_LIVE nu e explicit "true" în Vercel — la fel, fail-safe.
// Link de test intern: /cazare?preview=CHEIA_TA (setează cookie, nu mai
// trebuie repetat parametrul). Când totul e gata, flip pe ACCOMMODATION_LIVE=true
// și dispare gate-ul peste tot, dintr-o mișcare, fără alte modificări.
const ACCOMMODATION_PREVIEW_KEY = process.env.ACCOMMODATION_PREVIEW_KEY || "";

const ACCOMMODATION_LIVE = process.env.ACCOMMODATION_LIVE === "true";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Pachetul Featured — preț fix, plată unică (NU abonament recurent, ca să nu
// gestionăm reînnoiri/eșecuri de plată automate). Ușor de schimbat aici,
// într-un singur loc.
const ACCOMMODATION_FEATURED_PRICE_CENTS = 4500;
 // 45,00 EUR
const ACCOMMODATION_FEATURED_DURATION_DAYS = 90;
 // ~3 luni
// Abonament lunar de bază — DIFERIT de Featured (de mai sus). Prețul NU e
// hardcodat aici — se citește din DB (accommodation_settings), editabil din
// /admin/setari, fără redeploy. 0 = neconfigurat încă, tratat ca "gratuit"
// (nu forțăm nimic la plată până admin pune un preț real).
const ACCOMMODATION_TRIAL_MONTHS = 3;

// Cât de des scriem efectiv contorul de vizualizări în bază — 1 din N
// vizualizări, cerut explicit ca să reducem conexiunile către Neon (plan
// gratuit, limitat la ore de compute activ). Vezi comentariul de lângă
// folosire — media rămâne corectă, doar frecvența scrierilor scade.
const VIEWS_SAMPLE_RATE = 4;

// Link-ul de widget Aviasales, folosit de butonul "✈️ Zboruri" din
// sub-navigare — comun pe pagina de director și pe cea a proprietății.
const AVIASALES_SRC = "https://tpembd.com/content?currency=eur&trs=565241&shmarker=767825&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%23F0813A&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=12&no_labels=&plain=true&promo_id=7879&campaign_id=100";

// Widget transferuri (aeroport etc.) — TravelPayouts, program intui.travel.
// promo_id=4674/campaign_id=22 — același widget deja folosit și pe paginile
// de Ghiduri ("🚕 Rezervă un transfer"), unde se randează corect ca
// <script> simplu — spre deosebire de tema "biletik" (promo_id=691/
// campaign_id=1, folosită înainte aici), care rămânea goală la injectare
// dinamică. ATENȚIE: același widget a produs deja, confirmat, bug-ul cu
// come_datetime=NaN la căutare — asta ține de afișare, nu de căutare
// (raportat separat la TravelPayouts).
//
// CAUZA REALĂ a widget-ului complet gol pe programul-de-azi.ro (confirmată
// direct de utilizator, din dashboard-ul TravelPayouts): "trs" nu e doar
// un ID de cont — fiecare domeniu/proiect are propriul cod de embed, cu
// propriul "trs", generat separat pentru acel proiect anume. Codul cu
// trs=565241 a fost generat pentru opening-hours-today.eu; pe
// programul-de-azi.ro, intui.travel nici nu apărea ca program conectat —
// de-aia widget-ul rămânea gol acolo, indiferent de restul codului.
// Alegem varianta corectă la runtime, cu isIntlHost(req) (exact ca la
// restul integrărilor domain-specific de pe site — vezi GetTransfer/Omio).
const TRANSFER_WIDGET_SRC_EU = "https://tpembd.com/content?trs=565241&shmarker=767825&locale=en&powered_by=false&border_radius=13&plain=true&color_background=%23f6f6f6&color_button=%23FF4F1Dc7&promo_id=4674&campaign_id=22";

const TRANSFER_WIDGET_SRC_RO = "https://tpembd.com/content?trs=564938&shmarker=767825&locale=en&powered_by=true&border_radius=14&plain=true&color_background=%23f6f6f6&color_button=%23E4692Cff&promo_id=4674&campaign_id=22";

// Selector de monedă real (buton în header) — cursuri reale, sursă gratuită
// (Frankfurter, date BCE, fără cheie API), cache 12 ore în DB, ca să nu
// batem API-ul extern la fiecare vizualizare de pagină.
// NOTĂ: domeniul/parametrii Frankfurter s-au schimbat — varianta veche
// (api.frankfurter.app/latest?from=..&to=..) nu se mai poate baza pe ea;
// endpoint-ul curent, documentat, e api.frankfurter.dev/v1/latest cu
// base/symbols. Păstrăm și un set de cursuri aproximative, fixe, ca
// rezervă — dacă API-ul extern pică din orice motiv, conversia tot
// funcționează (aproximativ), în loc să rămână blocată pe RON/EUR:1.
const ACC_SUPPORTED_CURRENCIES = ["EUR", "RON", "USD", "GBP", "HUF", "CZK", "PLN", "BGN", "TRY", "CHF", "SEK", "NOK", "DKK"];

const ACC_FALLBACK_RATES = { EUR: 1, RON: 5.08, USD: 1.08, GBP: 0.84, HUF: 398, CZK: 24.9, PLN: 4.25, BGN: 1.96, TRY: 38.5, CHF: 0.93, SEK: 11.2, NOK: 11.7, DKK: 7.46 };

// Numele variabilei de mediu a fost schimbat manual în Vercel (prefix "ACC"),
// din cauza unui conflict cu alt proiect care folosea deja BLOB_READ_WRITE_TOKEN
// — NU e numele standard, de-aia îl transmitem explicit mai jos la handleUpload
// (pachetul @vercel/blob caută implicit doar BLOB_READ_WRITE_TOKEN).
const BLOB_READ_WRITE_TOKEN = process.env.ACC_READ_WRITE_TOKEN || "";

// Sesiune proprietar cazare — cookie semnat, separat de orice altă sesiune
// existentă pe site. Cheia de semnare e obligatorie separat de ADMIN_SECRET_KEY
// (nu refolosim aceeași cheie pentru două scopuri diferite).
const ACCOMMODATION_SESSION_SECRET = process.env.ACCOMMODATION_SESSION_SECRET || "";

// Sesiune admin — cookie semnat, complet separat de sesiunea de proprietar
// de cazare de mai sus. ADMIN_SECRET_KEY (mai jos) rămâne doar pentru
// bootstrap-ul contului (o singură dată) — după aceea, accesul e prin
// sesiune (email+parolă), nu prin cheia din query string.
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "";

// Cloudflare Turnstile — protecție anti-bot pe toate formularele cu parolă
// (cont admin + cont proprietar cazare). SITE_KEY e publică (merge în HTML),
// SECRET_KEY rămâne doar server-side, pentru verificarea la /siteverify.
// Dacă SECRET_KEY nu e setată, verificarea e sărită (nu blocăm site-ul
// înainte să fie configurată) — dar odată setată, o verificare eșuată sau
// lipsă blochează cererea (fail-closed, corect pentru un formular cu parolă).
const TURNSTILE_SITE_KEY = process.env.TURNSTILE_SITE_KEY || "";

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";

const GOOGLE_PLACES_API_KEY_LIVE = process.env.GOOGLE_PLACES_API_KEY || "";

// Pentru planul de rezervă la ploaie (itinerar) — cerut explicit, cu o
// limită de siguranță STRICTĂ, mai mică decât pragul real de 1.000
// cereri/zi al planului gratuit OpenWeatherMap, ca să nu riscăm NICIODATĂ
// să fim taxați, chiar dacă traficul crește neașteptat.
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";

const WEATHER_DAILY_SAFETY_LIMIT = 950;

const dbPool = DB_CONNECTION_STRING
  ? new Pool({ connectionString: DB_CONNECTION_STRING, ssl: { rejectUnauthorized: false }, max: 3 })
  : null;


// mapare limbă internă -> codul IETF pe care-l așteaptă Google — definită
// LOCAL, independent de conexiunea la bază, ca să nu crape apelurile care
// o folosesc chiar și atunci când baza de date nu e configurată deloc.
const INTERNAL_TO_GOOGLE_LANG = { ro: "ro", uk: "en", de: "de", es: "es", fr: "fr", it: "it", pl: "pl", nl: "nl", da: "da" };




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


// Etichete comunitare pentru PLAJE — cerut explicit, ca turiștii să
// contribuie cu detalii pe care le caută (parcare, șezlonguri, acces) —
// prag mai mic decât la "Popular" (3, la fel ca la raportări) — informația
// asta e utilă chiar și cu puține confirmări, nu are rost s-o ținem tăcută
// mult timp ca la un vot general de popularitate.
const BEACH_TAG_THRESHOLD = 3;


// Prag pentru insigna "🔥 Popular" — cerut explicit: votul rămâne TĂCUT
// (fără nicio insignă vizibilă) sub acest prag, ca să nu arate site-ul
// "gol"/nefuncțional la trafic mic — apare organic doar când chiar s-au
// adunat destule voturi reale.
const VOTE_POPULAR_THRESHOLD = 10;


// Detectare bot/crawler — cerut explicit: fără asta, Googlebot (sau orice
// alt crawler) care indexează sistematic miile de pagini noi ar declanșa
// costuri REALE la Google Places, identic cu un vizitator uman. Crawlerele
// nu au nevoie de "e deschis chiar ACUM" — indexează conținut, nu ajută pe
// nimeni real să afle programul live în acel moment exact; le arătăm ce
// avem deja în cache (sau mesajul generic), fără nicio cerere nouă,
// niciodată. Listă rezonabilă de crawlere cunoscute, nu exhaustivă 100%,
// dar acoperă marea majoritate a traficului automatizat real.
// EXTINS, cerut de o descoperire reală: "GoogleOther" și
// "Google-InspectionTool" (folosit chiar de Search Console, la inspecția de
// URL-uri) NU conțin cuvântul "bot" — scăpau complet de detectare, tratate
// ca utilizatori reali, ceea ce înseamnă că Google ar fi văzut placeholder-ul
// "Se calculează programul..." în loc de conținutul real, la unele vizite —
// exact genul de bug care ar explica un declin treptat de indexare/trafic.
const BOT_USER_AGENT_PATTERN = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|discordbot|linkedinbot|twitterbot|slackbot|pinterest|ahrefs|semrush|mj12bot|dotbot|petalbot|bytespider|googleother|google-inspectiontool|google-extended|google-agent|storebot|applebot|bingpreview|adsbot-google|mediapartners-google|duckduckbot|baiduspider|yandexbot|sogou|exabot|ia_archiver/i;


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
const TRAVEL_GUIDES_MONETIZATION_READY = true;


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
const linkMallAffiliate = "https://temu.to/k/enth85ro42s";
 // Temu — eMAG (profitshare.ro) a respins colaborarea, locul ăsta a stat gol până acum; Temu se potrivește tematic (marketplace general — electronice, casă, modă), exact intenția utilizatorului pe o pagină de mall.
const linkCatalogLidl = "";
 // O lăsăm goală momentan, o vei adăuga tu din mers când ai aprobarea
const linkCatalogKaufland = "";
 // O lăsăm goală momentan, o vei adăuga tu din mers când ai aprobarea
// link Amazon Affiliate — folosit DOAR pe paginile internaționale (DE/UK/ES),
// afișat sub cardul de status pe pagina de magazin. Pe RO, malls rămân cu butonul eMAG.
const linkAmazonAffiliate = "https://amzn.to/4wDIiop";

// link general de bilete turistice (ex: GetYourGuide) — un singur link pentru
// toate atracțiile, până când ai link-uri individuale per obiectiv. Rămâne
// gol până îl completezi tu direct pe GitHub — fără el, butonul nu apare deloc.
const linkBileteTurism = "https://getyourguide.com?partner_id=LM6J21N&utm_medium=online_publisher";


// Carusel de parteneri, DOAR pentru pagina de plajă — subset FILTRAT din
// GENERIC_PARTNER_OFFERS (14 parteneri), cerut explicit: doar 3 categorii,
// relevante pentru cineva care citește despre o plajă (nu bricolaj, nu
// deratizare, nu încălțăminte) — cărți, produse de îngrijire, bijuterii.
// Verificat manual ce vinde fiecare (nu presupus din nume):
//  - Librărie.net = cărți
//  - Biomag = cosmetică/produse bio (categorie "cosmetica" confirmată pe site)
//  - Herbagetica = suplimente naturale/wellness (produse de îngrijire)
//  - BijuBox = bijuterii (are deja bannerul lui real, pus mai devreme)
// Reutilizează EXACT același mecanism de rotație (buildGenericPartnerCarouselScript)
// ca și caruselul general — doar cu altă listă de oferte și alt buttonId
// (ca să nu se ciocnească dacă, teoretic, ar apărea vreodată pe aceeași
// pagină cu celălalt carusel).
const BEACH_PARTNER_OFFERS = [
  { name: "Librărie.net", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=da1148931&redirect_to=https%3A%2F%2Fwww.librarie.net%2F" },
  { name: "Biomag", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=e7e590bd1&redirect_to=https%3A%2F%2Fwww.Biomag.ro" },
  { name: "Herbagetica", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=853fff54b&redirect_to=https%3A%2F%2Fherbagetica.ro%2F" },
  {
    name: "BijuBox",
    url: "https://event.2performant.com/events/click?ad_type=banner&unique=e8588e01b&aff_code=c647d7f92&campaign_unique=2173f05f3",
    banner: "https://img.2performant.com/system/paperclip/banner_pictures/pics/214311/original/214311.png",
    alt: "bijubox.ro",
  },
];


// URL-uri REALE, individuale, de pe GetYourGuide, per obiectiv turistic —
// cheia e EXACT numele din ATTRACTIONS (a.name). Goale la început, se
// completează treptat, pe măsură ce se confirmă URL-uri reale (nu
// inventate — un link greșit e mai rău decât fallback-ul general).
// Pentru cele care NU au o intrare aici, butonul de bilete cade automat
// pe `linkBileteTurism` (link general), exact ca până acum.
const ATTRACTION_TICKET_URLS = {
  "Castelul Bran": "https://www.getyourguide.com/bran-l188057/bran-castle-dracula-s-castle-entry-ticket-with-audio-guide-t1380614/",
  "Castelul Peleș": "https://www.getyourguide.com/sinaia-l124688/peles-castle-and-bran-castle-entry-tickets-t1414362/",
  "Castelul Neuschwanstein Schwangau": "https://www.getyourguide.com/munich-l26/from-munich-neuschwanstein-linderhof-castle-full-day-trip-t1753/",
  "Castelul Eltz Wierschem": "https://www.getyourguide.com/frankfurt-l21/frankfurt-day-trip-to-eltz-castle-on-the-moselle-t40707/",
  "Castelul Hohenzollern Bisingen": "https://www.getyourguide.com/sigmaringen-l100350/sigmaringen-hohenzollern-castle-entry-fee-audio-guide-t849245/",
  "Palatul Național Pena Sintra": "https://www.getyourguide.com/lisbon-l42/lisbon-sintra-pena-regaleira-cabo-da-roca-cascais-tour-t881398/",
  "Castelul Chambord": "https://www.getyourguide.com/loire-valley-chateaux-l7956/chambord-skip-the-line-chateau-de-chambord-ticket-t183794/",
  "Castelul Bled Bled": "https://www.getyourguide.com/en-au/bled-castle-l140261/",
  "Castelul Ordinii Teutone din Malbork Malbork": "https://www.getyourguide.com/gdansk-l1960/gdansk-malbork-castle-regular-tour-t218583/",
  "Castelul Alcázar din Segovia": "https://www.getyourguide.com/ro-ro/segovia-spania-l1694/din-madrid-excursie-de-o-zi-la-segovia-cu-bilet-de-intrare-la-alcazar-t1402263/",
  "Palatul Parlamentului": "https://www.getyourguide.com/palace-of-the-parliament-l4247/",
  "Salina Turda": "https://www.getyourguide.com/salina-turda-l122320/",
  "Turnul cu Ceas și Cetatea Sighișoara": "https://www.getyourguide.com/clock-tower-sighisoara-l166655/",
  "Salina Praid": "https://www.getyourguide.com/brasov-l2003/salina-praid-salt-mine-t270447/",
  "Castelul Corvinilor": "https://www.getyourguide.com/corvin-castle-l127588/",
  "Mănăstirea Voroneț": "https://www.getyourguide.com/voronet-monastery-l129098/",
  "Cetatea Poenari": "https://www.getyourguide.com/poenari-castle-l138468/",
  "Cetatea Alba Carolina": "https://www.getyourguide.com/alba-carolina-citadel-l127593/",
  "Disneyland Paris": "https://www.getyourguide.com/paris-l16/disneyland-paris-2-parks-ticket-1-2-3-4-5-day-t395320/",
  "Europa-Park Rust": "https://www.getyourguide.com/rust-l2882/rust-europa-park-entrance-ticket-t393563/",
  "Efteling Kaatsheuvel": "https://www.getyourguide.com/amsterdam-l36/amsterdam-efteling-park-roundtrip-transfer-and-entry-ticket-t501550/",
  "Legoland Billund": "https://www.getyourguide.com/billund-l87275/legoland-billund-entry-ticket-private-transfer-t1427002/",
  "Gardaland Resort": "https://www.getyourguide.com/garda-l145126/gardaland-park-fixed-day-entry-ticket-t225588/",
  "Energylandia Zator": "https://www.getyourguide.com/krakow-l40/krakow-energylandia-full-day-ticket-with-optional-pickup-t114202/",
};

const GYG_PARTNER_ID = "LM6J21N";



// Widget contextual de urgență (vezi buildContextualWidgetHtml mai jos) —
// linkuri de afiliere OPȚIONALE, goale la început. Fără linkuri de
// afiliere reale confirmate pentru Glovo/Bringo, folosim link-urile lor
// publice, funcționale — nu inventăm un format de link de afiliere pe care
// nu l-am verificat (la fel ca la GetYourGuide, mai devreme în proiect).
const linkGlovoAffiliate = "";
 // dacă rămâne gol, cade pe glovoapp.com (link public, funcțional, fără tracking)
const linkBringoAffiliate = "";
 // dacă rămâne gol, cade pe bringo.ro (link public, funcțional, fără tracking)
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

// Etichete pentru butonul de geolocalizare internațional — engleză ca
// implicit universal, plus română (trafic real din România pe .eu). Restul
// limbilor cad pe engleză deocamdată — funcțional peste tot, doar nu
// tradus complet încă în toate cele 21.
const GEO_BTN_LABELS = {
  uk: {
    geoBtnDefault: "📍 Near me",
    geoBtnDetecting: "Detecting...",
    geoBtnAsking: "Asking for your location permission...",
    geoBtnNotFound: "No covered city found near you. Pick one manually below.",
    geoBtnTooFar: "The nearest covered city is too far from you:",
    geoBtnDenied: "Couldn't access your location. Pick one manually below.",
  },
  ro: {
    geoBtnDefault: "📍 Lângă mine",
    geoBtnDetecting: "Se detectează...",
    geoBtnAsking: "Îți cerem acordul pentru locație...",
    geoBtnNotFound: "Nu am găsit un oraș acoperit aproape de tine. Alege manual mai jos.",
    geoBtnTooFar: "Cel mai apropiat oraș acoperit e prea departe de tine:",
    geoBtnDenied: "Nu am acces la locația ta. Alege manual mai jos.",
  },
  de: {
    geoBtnDefault: "📍 In meiner Nähe",
    geoBtnDetecting: "Wird erkannt...",
    geoBtnAsking: "Wir bitten um deine Standortfreigabe...",
    geoBtnNotFound: "Keine abgedeckte Stadt in deiner Nähe gefunden. Wähle unten manuell.",
    geoBtnTooFar: "Die nächste abgedeckte Stadt ist zu weit entfernt:",
    geoBtnDenied: "Kein Zugriff auf deinen Standort. Wähle unten manuell.",
  },
  es: {
    geoBtnDefault: "📍 Cerca de mí",
    geoBtnDetecting: "Detectando...",
    geoBtnAsking: "Pidiendo permiso de ubicación...",
    geoBtnNotFound: "No encontramos ninguna ciudad cubierta cerca de ti. Elige una manualmente abajo.",
    geoBtnTooFar: "La ciudad cubierta más cercana está demasiado lejos:",
    geoBtnDenied: "No pudimos acceder a tu ubicación. Elige una manualmente abajo.",
  },
  fr: {
    geoBtnDefault: "📍 Près de moi",
    geoBtnDetecting: "Détection en cours...",
    geoBtnAsking: "Nous demandons l'autorisation de localisation...",
    geoBtnNotFound: "Aucune ville couverte trouvée près de vous. Choisissez-en une manuellement ci-dessous.",
    geoBtnTooFar: "La ville couverte la plus proche est trop loin :",
    geoBtnDenied: "Impossible d'accéder à votre position. Choisissez-en une manuellement ci-dessous.",
  },
  it: {
    geoBtnDefault: "📍 Vicino a me",
    geoBtnDetecting: "Rilevamento in corso...",
    geoBtnAsking: "Richiesta del permesso di posizione...",
    geoBtnNotFound: "Nessuna città coperta trovata vicino a te. Scegline una manualmente qui sotto.",
    geoBtnTooFar: "La città coperta più vicina è troppo distante:",
    geoBtnDenied: "Impossibile accedere alla tua posizione. Scegli manualmente qui sotto.",
  },
  pl: {
    geoBtnDefault: "📍 Blisko mnie",
    geoBtnDetecting: "Wykrywanie...",
    geoBtnAsking: "Prosimy o zgodę na lokalizację...",
    geoBtnNotFound: "Nie znaleziono obsługiwanego miasta w pobliżu. Wybierz ręcznie poniżej.",
    geoBtnTooFar: "Najbliższe obsługiwane miasto jest zbyt daleko:",
    geoBtnDenied: "Brak dostępu do Twojej lokalizacji. Wybierz ręcznie poniżej.",
  },
  nl: {
    geoBtnDefault: "📍 Bij mij in de buurt",
    geoBtnDetecting: "Detecteren...",
    geoBtnAsking: "We vragen toestemming voor je locatie...",
    geoBtnNotFound: "Geen gedekte stad in de buurt gevonden. Kies er hieronder handmatig een.",
    geoBtnTooFar: "De dichtstbijzijnde gedekte stad is te ver weg:",
    geoBtnDenied: "Geen toegang tot je locatie. Kies hieronder handmatig.",
  },
  da: {
    geoBtnDefault: "📍 I nærheden af mig",
    geoBtnDetecting: "Registrerer...",
    geoBtnAsking: "Vi beder om din placeringstilladelse...",
    geoBtnNotFound: "Fandt ingen dækket by i nærheden af dig. Vælg en manuelt nedenfor.",
    geoBtnTooFar: "Den nærmeste dækkede by er for langt væk:",
    geoBtnDenied: "Kunne ikke tilgå din placering. Vælg en manuelt nedenfor.",
  },
  se: {
    geoBtnDefault: "📍 Nära mig",
    geoBtnDetecting: "Upptäcker...",
    geoBtnAsking: "Vi ber om din platsbehörighet...",
    geoBtnNotFound: "Ingen täckt stad hittades nära dig. Välj en manuellt nedan.",
    geoBtnTooFar: "Den närmaste täckta staden är för långt bort:",
    geoBtnDenied: "Kunde inte komma åt din plats. Välj en manuellt nedan.",
  },
  pt: {
    geoBtnDefault: "📍 Perto de mim",
    geoBtnDetecting: "A detetar...",
    geoBtnAsking: "A pedir a sua permissão de localização...",
    geoBtnNotFound: "Não encontrámos nenhuma cidade coberta perto de si. Escolha uma manualmente abaixo.",
    geoBtnTooFar: "A cidade coberta mais próxima está muito longe:",
    geoBtnDenied: "Não foi possível aceder à sua localização. Escolha uma manualmente abaixo.",
  },
  cz: {
    geoBtnDefault: "📍 Blízko mě",
    geoBtnDetecting: "Zjišťuji...",
    geoBtnAsking: "Žádáme o svolení k poloze...",
    geoBtnNotFound: "Nenašli jsme žádné pokryté město poblíž vás. Vyberte jedno ručně níže.",
    geoBtnTooFar: "Nejbližší pokryté město je příliš daleko:",
    geoBtnDenied: "Nepodařilo se získat přístup k vaší poloze. Vyberte ručně níže.",
  },
  fi: {
    geoBtnDefault: "📍 Lähelläni",
    geoBtnDetecting: "Tunnistetaan...",
    geoBtnAsking: "Pyydämme sijaintilupaa...",
    geoBtnNotFound: "Läheltäsi ei löytynyt katettua kaupunkia. Valitse yksi manuaalisesti alta.",
    geoBtnTooFar: "Lähin katettu kaupunki on liian kaukana:",
    geoBtnDenied: "Sijaintiisi ei saatu pääsyä. Valitse manuaalisesti alta.",
  },
  gr: {
    geoBtnDefault: "📍 Κοντά μου",
    geoBtnDetecting: "Εντοπισμός...",
    geoBtnAsking: "Ζητάμε την άδεια τοποθεσίας σας...",
    geoBtnNotFound: "Δεν βρέθηκε καλυπτόμενη πόλη κοντά σας. Επιλέξτε μία χειροκίνητα παρακάτω.",
    geoBtnTooFar: "Η πλησιέστερη καλυπτόμενη πόλη είναι πολύ μακριά:",
    geoBtnDenied: "Δεν ήταν δυνατή η πρόσβαση στην τοποθεσία σας. Επιλέξτε χειροκίνητα παρακάτω.",
  },
  hu: {
    geoBtnDefault: "📍 A közelemben",
    geoBtnDetecting: "Észlelés...",
    geoBtnAsking: "Helymeghatározási engedélyt kérünk...",
    geoBtnNotFound: "Nem található lefedett város a közeledben. Válassz egyet manuálisan lent.",
    geoBtnTooFar: "A legközelebbi lefedett város túl messze van:",
    geoBtnDenied: "Nem sikerült hozzáférni a helyzetedhez. Válassz manuálisan lent.",
  },
  hr: {
    geoBtnDefault: "📍 U mojoj blizini",
    geoBtnDetecting: "Otkrivanje...",
    geoBtnAsking: "Tražimo dopuštenje za lokaciju...",
    geoBtnNotFound: "Nije pronađen pokriveni grad u vašoj blizini. Odaberite ručno ispod.",
    geoBtnTooFar: "Najbliži pokriveni grad je predaleko:",
    geoBtnDenied: "Nismo mogli pristupiti vašoj lokaciji. Odaberite ručno ispod.",
  },
  sk: {
    geoBtnDefault: "📍 Blízko mňa",
    geoBtnDetecting: "Zisťujem...",
    geoBtnAsking: "Žiadame o povolenie polohy...",
    geoBtnNotFound: "Nenašli sme žiadne pokryté mesto vo vašej blízkosti. Vyberte jedno ručne nižšie.",
    geoBtnTooFar: "Najbližšie pokryté mesto je príliš ďaleko:",
    geoBtnDenied: "Nepodarilo sa získať prístup k vašej polohe. Vyberte ručne nižšie.",
  },
  si: {
    geoBtnDefault: "📍 V moji bližini",
    geoBtnDetecting: "Zaznavanje...",
    geoBtnAsking: "Prosimo za dovoljenje za lokacijo...",
    geoBtnNotFound: "V bližini ni bilo najdenega pokritega mesta. Spodaj izberite ročno.",
    geoBtnTooFar: "Najbližje pokrito mesto je predaleč:",
    geoBtnDenied: "Do vaše lokacije ni bilo mogoče dostopati. Izberite ročno spodaj.",
  },
  lt: {
    geoBtnDefault: "📍 Šalia manęs",
    geoBtnDetecting: "Aptinkama...",
    geoBtnAsking: "Prašome vietos nustatymo leidimo...",
    geoBtnNotFound: "Šalia jūsų nerasta jokio aptarnaujamo miesto. Pasirinkite rankiniu būdu žemiau.",
    geoBtnTooFar: "Artimiausias aptarnaujamas miestas per toli:",
    geoBtnDenied: "Nepavyko pasiekti jūsų vietos. Pasirinkite rankiniu būdu žemiau.",
  },
  lv: {
    geoBtnDefault: "📍 Man tuvumā",
    geoBtnDetecting: "Nosaka...",
    geoBtnAsking: "Mēs lūdzam jūsu atrašanās vietas atļauju...",
    geoBtnNotFound: "Tuvumā netika atrasta neviena pārklāta pilsēta. Izvēlieties manuāli zemāk.",
    geoBtnTooFar: "Tuvākā pārklātā pilsēta ir pārāk tālu:",
    geoBtnDenied: "Neizdevās piekļūt jūsu atrašanās vietai. Izvēlieties manuāli zemāk.",
  },
  ee: {
    geoBtnDefault: "📍 Minu lähedal",
    geoBtnDetecting: "Tuvastamine...",
    geoBtnAsking: "Palume teie asukoha luba...",
    geoBtnNotFound: "Teie lähedalt ei leitud ühtegi kaetud linna. Valige allpool käsitsi.",
    geoBtnTooFar: "Lähim kaetud linn on liiga kaugel:",
    geoBtnDenied: "Ei õnnestunud pääseda ligi teie asukohale. Valige allpool käsitsi.",
  },
};

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


// Schema.org LocalBusiness — date structurate (JSON-LD), cerute explicit
// pentru SEO: îi spun direct lui Google programul exact, fără să se bazeze
// doar pe textul din pagină. Zilele săptămânii sunt ÎNTOTDEAUNA în engleză
// (cerință schema.org, indiferent de limba paginii). Adresa/telefon/coordo-
// natele apar DOAR când avem date reale, verificate (din Google Places) —
// nu inventăm niciodată o adresă, ca să nu transmitem informații false.
const SCHEMA_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];


const linkOmioAffiliate = "";


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

// "marianarsene" NU era un cod de afiliat valid — era doar prefixul emailului
// de login (marianarsene.ma@gmail.com), folosit din greșeală ca a_aid într-o
// sesiune anterioară. Codul real de tracking, confirmat direct din contul
// Discover Cars ("Parent affiliate"), e "23ea55cb" — același folosit deja
// corect la cele 30 de deep link-uri de mai sus. Unificat aici, ca toate
// linkurile Discover Cars din tot site-ul să ducă comisionul spre același
// cont real.
const DISCOVERCARS_AFFILIATE_ID = "23ea55cb";


// ------------------------------------------------------------------
// Radar de sărbători: pe pagina orașului, dacă azi / mâine / poimâine e
// sărbătoare în țara respectivă (din datele de program deja existente),
// avertizăm vizitatorul — ex. „Mâine e Crăciun: majoritatea magazinelor
// sunt închise, cumpără azi”. Fără interogări noi, doar date din config.
// ------------------------------------------------------------------
const HOLIDAY_RADAR_LABELS = {
  ro: { today: "Azi", tomorrow: "Mâine", after: "Poimâine", closed: "majoritatea magazinelor sunt închise", reduced: "multe magazine au program redus", tipTomorrow: "Cumpără ce îți trebuie azi.", tipAfter: "Planifică-ți cumpărăturile din timp." },
  uk: { today: "Today", tomorrow: "Tomorrow", after: "The day after tomorrow", closed: "most stores are closed", reduced: "many stores have reduced hours", tipTomorrow: "Buy what you need today.", tipAfter: "Plan your shopping in advance." },
  de: { today: "Heute", tomorrow: "Morgen", after: "Übermorgen", closed: "die meisten Geschäfte sind geschlossen", reduced: "viele Geschäfte haben verkürzte Öffnungszeiten", tipTomorrow: "Kauf heute ein, was du brauchst.", tipAfter: "Plane deine Einkäufe rechtzeitig." },
  fr: { today: "Aujourd'hui", tomorrow: "Demain", after: "Après-demain", closed: "la plupart des magasins sont fermés", reduced: "de nombreux magasins ont des horaires réduits", tipTomorrow: "Faites vos courses aujourd'hui.", tipAfter: "Prévoyez vos courses à l'avance." },
  es: { today: "Hoy", tomorrow: "Mañana", after: "Pasado mañana", closed: "la mayoría de las tiendas están cerradas", reduced: "muchas tiendas tienen horario reducido", tipTomorrow: "Compra hoy lo que necesites.", tipAfter: "Planifica tus compras con antelación." },
  it: { today: "Oggi", tomorrow: "Domani", after: "Dopodomani", closed: "la maggior parte dei negozi è chiusa", reduced: "molti negozi hanno orari ridotti", tipTomorrow: "Compra oggi ciò che ti serve.", tipAfter: "Pianifica la spesa in anticipo." },
};


// „Ce e deschis când ajung?” — etichete pentru selectorul de dată/oră de
// pe pagina orașului (RO + EN + câteva limbi mari; restul primesc engleza).
const ARRIVAL_PLANNER_LABELS = {
  ro: { closingSoon: "⏱️ Se închid curând:", btn: "🕐 Ce e deschis când ajung?", show: "Arată", now: "Acum", viewing: "Afișat pentru", holiday: "⚠️ Zi de sărbătoare — multe magazine au program redus sau sunt închise.", onlyOpen: "Arăt doar ce va fi deschis atunci.", left: "⏱️ încă ", min: " min" },
  uk: { closingSoon: "⏱️ Closing soon:", btn: "🕐 What's open when I arrive?", show: "Show", now: "Now", viewing: "Showing for", holiday: "⚠️ Public holiday — many stores have reduced hours or are closed.", onlyOpen: "Showing only what will be open then.", left: "⏱️ ", min: " min left" },
  de: { closingSoon: "⏱️ Schließt bald:", btn: "🕐 Was ist geöffnet, wenn ich ankomme?", show: "Anzeigen", now: "Jetzt", viewing: "Angezeigt für", holiday: "⚠️ Feiertag — viele Geschäfte haben verkürzte Öffnungszeiten oder sind geschlossen.", onlyOpen: "Es wird nur angezeigt, was dann geöffnet ist.", left: "⏱️ noch ", min: " Min" },
  fr: { closingSoon: "⏱️ Ferme bientôt :", btn: "🕐 Qu'est-ce qui sera ouvert à mon arrivée ?", show: "Afficher", now: "Maintenant", viewing: "Affiché pour", holiday: "⚠️ Jour férié — de nombreux magasins ont des horaires réduits ou sont fermés.", onlyOpen: "Seuls les lieux ouverts à ce moment-là sont affichés.", left: "⏱️ encore ", min: " min" },
  es: { closingSoon: "⏱️ Cierra pronto:", btn: "🕐 ¿Qué estará abierto cuando llegue?", show: "Mostrar", now: "Ahora", viewing: "Mostrando para", holiday: "⚠️ Día festivo — muchas tiendas tienen horario reducido o están cerradas.", onlyOpen: "Se muestra solo lo que estará abierto entonces.", left: "⏱️ quedan ", min: " min" },
  it: { closingSoon: "⏱️ Chiude a breve:", btn: "🕐 Cosa sarà aperto quando arrivo?", show: "Mostra", now: "Adesso", viewing: "Mostrato per", holiday: "⚠️ Giorno festivo — molti negozi hanno orari ridotti o sono chiusi.", onlyOpen: "Mostriamo solo ciò che sarà aperto in quel momento.", left: "⏱️ ancora ", min: " min" },
};


// Notificări push — chei VAPID, din variabile de mediu (NU hardcodate în
// cod — cheia privată e un secret, la fel ca parola bazei de date). Dacă
// lipsesc, funcționalitatea de abonare rămâne dezactivată automat, sigur,
// fără să crape site-ul. Le generezi tu, o singură dată, local, cu
// `npx web-push generate-vapid-keys` — vezi instrucțiunile din README.
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";

const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:marianarsene.ma@gmail.com";


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


// Pe lângă prefixele de mai sus (doar în română, sensibile la diacritice),
// recunoaștem după cuvinte-cheie, în toate limbile folosite în nume:
// poduri, baraje, șosele / drumuri panoramice, pasuri montane, viaducte,
// faleze și canale.
// Toate sunt cu ACCES LIBER — fără program și fără bilet de intrare.
// Excluderile prind cazurile care conțin cuvintele-cheie, dar se plătesc
// (peșteri, muzee, telecabine, Pont du Gard, A'DAM Lookout, închisori etc.).
const FREE_ACCESS_KEYWORDS_RE = /\b(podul|podurile|pod|bridge|brucke|bruecke|brug|pont|ponte|puente|most|barajul|baraj|dam|staudamm|talsperre|staumauer|barrage|diga|presa|soseaua|sosea|drumul|road|route|strasse|pass|pasul|col|passo|transfagarasan|transalpina|transrarau|transbucegi|transursoaia|transsemenic|serpentinele|viaductul|viaduct|faleza|falezele|falezei|cliff|cliffs|klippe|klippen|falaise|falaises|scogliera|scogliere|acantilado|acantilados|canal|canalul|canalele|canals|kanal|kanale|canale|gracht|grachten)\b/;

const FREE_ACCESS_EXCLUDE_RE = /\b(pestera|pesterii|cave|grotta|muzeu|muzeul|museum|telecabina|funicular|funicularul|gara|calea ferata|mocanita|tren|pont du gard|a'dam|lookout|gaol|inchisoarea|prison|filmmuseum|croaziera|croazierele|cruise|boat tour)\b/;

const FREE_ACCESS_DAM_RE = /\b(barajul|baraj|dam|staudamm|talsperre|staumauer|barrage|diga)\b/;

const FREE_ACCESS_SKIP_CATEGORIES = ["muzee", "castele_palate", "manastiri", "biserici_cimitire", "parcuri_agrement", "plaje_organizate", "cetati_turnuri"];

// Drumuri montane: fără bilet, dar pot fi închise sau cu restricții iarna.
const MOUNTAIN_ROAD_RE = /(transfagarasan|transalpina|transrarau|transbucegi|transursoaia|transsemenic|\bpass\b|\bpasul\b|\bcol du\b|\bpasso\b|serpentin|alpin|montan|muntelui|grossglockner|stelvio)/;

const ROAD_WORD_RE = /(soseaua|sosea|\broad\b|\broute\b|strasse|drumul|\bpass\b|\bpasul\b|\bcol\b|\bpasso\b|trans[a-z]+|traseul|serpentin)/;

// Pentru șoselele / pasurile montane: mesaj mai precis (fără bilet, dar pot
// fi închise complet sau cu restricții pe timpul iernii).
const MOUNTAIN_ROAD_LABELS = {
  ro: "❄️ Drum montan cu acces liber — nu se cumpără bilet de intrare. Iarna poate fi închis complet sau cu restricții de circulație (de obicei din toamnă până la începutul verii, în funcție de zăpadă). Verifică starea drumului înainte de a pleca.",
  uk: "❄️ Mountain road with free access — no entry ticket needed. In winter it may be fully closed or have traffic restrictions (usually from autumn until early summer, depending on snow). Check road conditions before you go.",
  de: "❄️ Bergstraße mit freiem Zugang — kein Eintrittsticket nötig. Im Winter kann sie komplett gesperrt sein oder Verkehrsbeschränkungen haben (meist vom Herbst bis zum Frühsommer, je nach Schnee). Prüfe vor der Fahrt den Straßenzustand.",
  fr: "❄️ Route de montagne en accès libre — aucun billet d'entrée. En hiver, elle peut être entièrement fermée ou soumise à des restrictions (généralement de l'automne au début de l'été, selon la neige). Vérifiez l'état de la route avant de partir.",
  es: "❄️ Carretera de montaña de acceso libre — no se necesita entrada. En invierno puede estar cerrada por completo o con restricciones (normalmente desde el otoño hasta principios del verano, según la nieve). Consulta el estado de la carretera antes de salir.",
  it: "❄️ Strada di montagna ad accesso libero — nessun biglietto d'ingresso. In inverno può essere chiusa del tutto o avere limitazioni al traffico (di solito dall'autunno all'inizio dell'estate, a seconda della neve). Controlla lo stato della strada prima di partire.",
};


// "Ghidul de Sosire" — idee de monetizare cerută explicit (fără Booking-
// style comision, doar abonament): un mini-ghid AUTOMAT, generat pentru
// oaspetele care scrie unei pensiuni prin site, legat de ORA lui exactă de
// sosire, nu de "acum". Construit intenționat DOAR din date STATICE, deja
// existente (STORE_CONFIG — program real, verificat, per lanț) — ZERO
// cerere nouă către Google, cost zero suplimentar, cerut explicit dat
// fiind decizia de a nu (re)activa Places API din motive de cost.
//
// Lanțuri "utile la sosire" — cele două categorii care chiar contează
// pentru cineva care tocmai a ajuns: unde cumpără mâncare, unde găsește o
// farmacie. Restul din STORE_CONFIG (bricolaj, cinema) nu e relevant aici.
const ARRIVAL_GUIDE_STORE_KEYS = {
  supermarket: ["lidl", "kaufland", "penny", "megaimage", "carrefour", "auchan", "profi"],
  farmacie: ["drmax", "farmaciatei", "remedia", "springpharma", "catena", "sensiblu", "helpnet", "dona", "ropharma"],
};


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
      url: "https://event.2performant.com/events/click?ad_type=banner&unique=3c965491f&aff_code=c647d7f92&campaign_unique=938c02434",
      banner: "https://img.2performant.com/system/paperclip/banner_pictures/pics/264595/original/264595.jpg",
      alt: "catenapascupas.ro",
    },
  ],
  sensiblu: "",
  helpnet: "",
  dona: "",
  ropharma: "",
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
  { name: "Otter", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=7e537fc0d&redirect_to=https%3A%2F%2Fwww.otter.ro%2F" },
  { name: "JoJo Fashion", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=9148cd6c4&redirect_to=https%3A%2F%2Fwww.jojofashion.ro" },
  { name: "Picadili", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=d404a783d&redirect_to=https%3A%2F%2Fpicadili.ro" },
  { name: "Prosoape Hotel", url: "https://event.2performant.com/events/click?ad_type=quicklink&aff_code=c647d7f92&unique=9dd5272cf&redirect_to=https%3A%2F%2Fwww.prosoapehotel.ro" },
  { name: "FashionDays", url: "https://l.profitshare.ro/l/16475027" },
];








// Belgia: situație reală, în schimbare — Colruyt, Aldi și Lidl rămân închise
// duminica (politică fermă), în timp ce Carrefour a început recent (ian. 2026)
// să deschidă duminică dimineața la hipermarketuri, iar Delhaize variază pe
// magazin (multe sunt francizate independent). Păstrăm regula majoritară,
// valabilă pentru cei mai mulți retaileri mari.
const BE_HOLIDAYS = [
  { date: "12-25", label: "Noël (25 décembre)", hours: null },
  { date: "01-01", label: "Nouvel An (1er janvier)", hours: null },
];


// Bricolaj (Brico, Gamma, Hubo) — sub aceeași lege belgiană de închidere
// duminicală ca marile magazine nealimentare; Luni-Sâmbătă cu program mai
// lung vinerea în multe locații, simplificat aici la un interval uniform.
const BE_DIY_HOLIDAYS = BE_HOLIDAYS;

// Traduceri per-limbă ale conținutului de plajă — încărcate LENEȘ (doar la
// prima cerere reală în acea limbă, nu la pornirea serverului), ca să nu
// crească memoria/timpul de Cold Start pentru limbi rar cerute. Fișierele
// se pun în aceeași structură: beach-content-<lang>.js.
const BEACH_CONTENT_LANG_CACHE = {};

// Limbile care AU (sau vor avea) un fișier beach-content-<lang>.js — se
// extinde pe măsură ce se traduce mai mult conținut.
const BEACH_CONTENT_LANG_FILES = { uk: true };


// Nume de țară ÎN ROMÂNĂ — folosite doar la construirea promptului pentru AI
// (instrucțiunea în sine e scrisă în română, indiferent de limba cerută
// pentru rezultat — vezi buildItineraryPrompt) și în mesajele de eroare ale
// generatorului de itinerarii. Diferite de COUNTRY_LABELS (engleză, folosit
// pentru UI-ul de selecție a țării).
const COUNTRY_NAMES_RO = { ro: "România", de: "Germania", uk: "Regatul Unit", es: "Spania", fr: "Franța", it: "Italia", pl: "Polonia", nl: "Olanda", at: "Austria", be: "Belgia", dk: "Danemarca", se: "Suedia", pt: "Portugalia", cz: "Cehia", fi: "Finlanda", gr: "Grecia", hu: "Ungaria", hr: "Croația", ie: "Irlanda", sk: "Slovacia", si: "Slovenia", lt: "Lituania", lv: "Letonia", ee: "Estonia", cy: "Cipru", mt: "Malta", lu: "Luxemburg", tr: "Turcia" };

const COUNTRY_NAMES_EN = { ro: "Romania", de: "Germany", uk: "United Kingdom", es: "Spain", fr: "France", it: "Italy", pl: "Poland", nl: "Netherlands", at: "Austria", be: "Belgium", dk: "Denmark", se: "Sweden", pt: "Portugal", cz: "Czechia", fi: "Finland", gr: "Greece", hu: "Hungary", hr: "Croatia", ie: "Ireland", sk: "Slovakia", si: "Slovenia", lt: "Lithuania", lv: "Latvia", ee: "Estonia", cy: "Cyprus", mt: "Malta", lu: "Luxembourg", tr: "Turkey" };


// Vercel dă codul de țară ca ISO 3166-1 alpha-2 (ex: "DE", "GB") — hartă spre
// codurile noastre interne (Marea Britanie: "GB" în ISO, dar "uk" la noi).
const GEO_COUNTRY_MAP = { DE: "de", GB: "uk", ES: "es", FR: "fr", IT: "it", PL: "pl", NL: "nl", AT: "at", BE: "be", DK: "dk", RO: "ro", SE: "se", PT: "pt", CZ: "cz", FI: "fi", GR: "gr", HU: "hu", HR: "hr", IE: "ie", SK: "sk", SI: "si", LT: "lt", LV: "lv", EE: "ee", CY: "cy", MT: "mt", LU: "lu", CH: "ch" };

const LANGUAGE_FLAGS = { uk: "🇬🇧", de: "🇩🇪", es: "🇪🇸", fr: "🇫🇷", it: "🇮🇹", pl: "🇵🇱", nl: "🇳🇱", da: "🇩🇰", ro: "🇷🇴", se: "🇸🇪", pt: "🇵🇹", cz: "🇨🇿", fi: "🇫🇮", gr: "🇬🇷", hu: "🇭🇺", hr: "🇭🇷", sk: "🇸🇰", si: "🇸🇮", lt: "🇱🇹", lv: "🇱🇻", ee: "🇪🇪" };



/* ============================================================
   0.5) PWA — manifest, service worker, iconiță
   Cerute prin rutele /manifest.json, /sw.js și /icon.svg mai jos,
   ca legăturile din <head> să funcționeze efectiv, nu doar să existe.
   ============================================================ */

// iconiță simplă, generată ca SVG (nu necesită fișiere PNG separate;
// pentru suport iOS mai vechi, poți adăuga ulterior și icon-192.png / icon-512.png reale)
// Iconița site-ului (tab-ul browserului): contur portocaliu intens #FF6F00,
// interior albastru-închis #171E3A, ceas portocaliu cu limbi albe, bifă pe
// verde neon. Iconițele PNG de instalare (icon-192/512, icon-maskable-512)
// sunt aceeași schiță, generate ca fișiere în rădăcina proiectului.
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect x="14" y="14" width="484" height="484" rx="96" fill="#171E3A" stroke="#FF6F00" stroke-width="28"/>
  <circle cx="246" cy="240" r="150" fill="#FF6F00"/>
  <line x1="246" y1="240" x2="246" y2="138" stroke="#FFFFFF" stroke-width="20" stroke-linecap="round"/>
  <line x1="246" y1="240" x2="318" y2="282" stroke="#FFFFFF" stroke-width="20" stroke-linecap="round"/>
  <circle cx="246" cy="240" r="16" fill="#FFFFFF"/>
  <circle cx="384" cy="384" r="74" fill="#39FF14" stroke="#171E3A" stroke-width="14"/>
  <polyline points="350,386 375,411 418,358" fill="none" stroke="#171E3A" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
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
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    // Android decupează iconița în cerc/formă proprie — varianta „maskable”
    // are ceasul în zona sigură din centru, ca să nu fie tăiat nimic.
    { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
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
const CACHE_NAME = "programul-de-azi-v2"; // v2: iconiță nouă
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


// Categorii pentru "Magazine și Servicii" — grupare pe categorii, exact ca la
// obiectivele turistice (aceeași logică de <details>, la scară, cu 48 de
// branduri într-un oraș, o listă plată devine greu de parcurs). Aplicată
// PROGRAMATIC peste STORE_CONFIG (nu editat manual, 48 de linii, risc mare
// de greșeală) — fiecare cheie capătă un câmp "categorie".
const STORE_CATEGORY_BY_KEY = {
  farmaciaremedia: "farmacii", farmaciasinapis: "farmacii", farmaciafarmasofia: "farmacii", farmaciasanatatea: "farmacii", farmaciaanca: "farmacii", farmaciafarmacom1: "farmacii", farmaciafarmacom40: "farmacii", farmaciafarmadex: "farmacii", farmaciamaxipharm: "farmacii", farmaciaaispharma: "farmacii", farmaciamultifarm: "farmacii", farmaciaremedium1: "farmacii", farmaciaviafarm: "farmacii", farmaciacynara: "farmacii", farmaciaeuropa: "farmacii", farmaciaminifarmpodbutelii: "farmacii", farmaciabalsam: "farmacii", farmaciaprimavera: "farmacii", farmaciahygeia: "farmacii", farmaciarevita: "farmacii", farmaciaremedia2: "farmacii", farmaciasfparascheva: "farmacii", farmaciarosmarin: "farmacii", farmaciapharmasa: "farmacii", farmaciagalenus: "farmacii", farmaciaaesculap: "farmacii", farmaciaardealul: "farmacii", farmaciasalvator: "farmacii", farmaciasanmarco: "farmacii", farmaciapolisano: "farmacii", farmaciadornafarm: "farmacii", farmaciavlad: "farmacii", farmaciavlavarmed: "farmacii",
  lidl: "magazine", kaufland: "magazine", penny: "magazine", megaimage: "magazine", kik: "magazine",
  carrefour: "magazine", auchan: "magazine", profi: "magazine", metro: "magazine", selgros: "magazine",
  dedeman: "bricolaj_electro", leroymerlin: "bricolaj_electro", bricodepot: "bricolaj_electro",
  hornbach: "bricolaj_electro", jysk: "bricolaj_electro", ikea: "bricolaj_electro", xxxlutz: "bricolaj_electro", momax: "bricolaj_electro", mathaus: "bricolaj_electro", arabesque: "bricolaj_electro",
  altex: "bricolaj_electro", flanco: "bricolaj_electro", dm: "farmacii",
  drmax: "farmacii", farmaciatei: "farmacii", remedia: "farmacii", springpharma: "farmacii",
  catena: "farmacii", sensiblu: "farmacii", helpnet: "farmacii", dona: "farmacii", ropharma: "farmacii",
  cinemacity: "cinema", cineplexx: "cinema", happycinema: "cinema", movieplex: "cinema",
  bcr: "banci", brd: "banci", ing: "banci", raiffeisen: "banci", bancatransilvania: "banci", cec: "banci",
  posta: "posta_curieri", fancourier: "posta_curieri", cargus: "posta_curieri",
  sameday: "posta_curieri", dpd: "posta_curieri", gls: "posta_curieri",
  mcdonalds: "fastfood", kfc: "fastfood", burgerking: "fastfood",
  mall: "mall",
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
  // Mall-uri mari din București — cerut explicit, capitala avea foarte
  // puține date până acum. Toate folosesc programul generic deja
  // verificat pentru mall-uri (cheia "mall"), doar cu numele lor real.
  "baneasa-shopping-city": { key: "mall", displayName: "Băneasa Shopping City" },
  "parklake": { key: "mall", displayName: "ParkLake" },
  "mega-mall": { key: "mall", displayName: "Mega Mall" },
  "sun-plaza": { key: "mall", displayName: "Sun Plaza" },
  "veranda-mall": { key: "mall", displayName: "Veranda Mall" },
  "plaza-romania": { key: "mall", displayName: "Plaza România" },
  "unirea-shopping-center": { key: "mall", displayName: "Unirea Shopping Center" },
  "promenada-mall": { key: "mall", displayName: "Promenada Mall" },
  "cotroceni-park": { key: "mall", displayName: "Cotroceni Park" },
};


const DAY_NAMES = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];


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

const REVIEWS_CLIENT_JS = "(function(CFG){\n  function tr(ro, en){ return CFG.lang === \"en\" ? en : ro; }\n  function el(tag, cls, text){ var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }\n  function modal(title, text, buttons){\n    var bd = el(\"div\", \"rv-modal-bd\"); var box = el(\"div\", \"rv-modal\");\n    box.appendChild(el(\"h3\", null, title)); box.appendChild(el(\"p\", null, text));\n    var row = el(\"div\", \"rv-modal-actions\");\n    buttons.forEach(function(b){\n      var n = b.href ? el(\"a\", \"rv-btn\" + (b.primary ? \" is-primary\" : \"\"), b.label) : el(\"button\", \"rv-btn\" + (b.primary ? \" is-primary\" : \"\"), b.label);\n      if (b.href) n.href = b.href; else n.type = \"button\";\n      if (!b.href) n.addEventListener(\"click\", function(){ bd.remove(); });\n      row.appendChild(n);\n    });\n    box.appendChild(row); bd.appendChild(box);\n    bd.addEventListener(\"click\", function(e){ if (e.target === bd) bd.remove(); });\n    document.body.appendChild(bd);\n  }\n  /* ---- „Vezi toate recenziile” ---- */\n  document.querySelectorAll(\"[data-rv-more-btn]\").forEach(function(btn){\n    var box = document.getElementById(btn.getAttribute(\"data-rv-more-btn\")); if (!box) return;\n    var total = btn.getAttribute(\"data-total\");\n    btn.addEventListener(\"click\", function(){\n      var open = box.classList.toggle(\"is-open\");\n      btn.textContent = open ? tr(\"Ascunde recenziile\", \"Hide reviews\") : tr(\"Vezi toate recenziile (\" + total + \")\", \"See all reviews (\" + total + \")\");\n      btn.setAttribute(\"aria-expanded\", open ? \"true\" : \"false\");\n    });\n  });\n  /* ---- răspunsul proprietarului ---- */\n  function closeEditors(){ document.querySelectorAll(\".rv-editor\").forEach(function(x){ x.remove(); }); }\n  function openEditor(btn){\n    closeEditors();\n    var item = btn.closest(\".rv-item, .acc-review\"); if (!item) return;\n    var kind = btn.getAttribute(\"data-kind\"), id = btn.getAttribute(\"data-id\"), existing = btn.getAttribute(\"data-reply\") || \"\";\n    var ed = el(\"div\", \"rv-editor\");\n    var ta = el(\"textarea\"); ta.maxLength = 1000; ta.rows = 4; ta.value = existing;\n    ta.placeholder = tr(\"Scrie răspunsul oficial al localului (vizibil public, sub recenzie)…\", \"Write the official reply (shown publicly under the review)…\");\n    var err = el(\"div\", \"rv-err\"); var row = el(\"div\", \"rv-editor-actions\");\n    var save = el(\"button\", \"rv-btn is-primary\", tr(\"Publică răspunsul\", \"Publish reply\")); save.type = \"button\";\n    var cancel = el(\"button\", \"rv-btn\", tr(\"Renunță\", \"Cancel\")); cancel.type = \"button\";\n    row.appendChild(save); row.appendChild(cancel);\n    if (existing) { var del = el(\"button\", \"rv-btn is-danger\", tr(\"Șterge răspunsul\", \"Delete reply\")); del.type = \"button\"; row.appendChild(del);\n      del.addEventListener(\"click\", function(){\n        if (!confirm(tr(\"Ștergi răspunsul?\", \"Delete the reply?\"))) return;\n        fetch(\"/api/recenzii/raspuns\", { method: \"DELETE\", headers: { \"Content-Type\": \"application/json\" }, body: JSON.stringify({ kind: kind, reviewId: Number(id) }) })\n          .then(function(r){ if (r.ok) location.reload(); else err.textContent = tr(\"Nu s-a putut șterge.\", \"Could not delete.\"); });\n      });\n    }\n    ed.appendChild(ta); ed.appendChild(err); ed.appendChild(row); item.appendChild(ed); ta.focus();\n    cancel.addEventListener(\"click\", function(){ ed.remove(); });\n    save.addEventListener(\"click\", function(){\n      var t = ta.value.trim();\n      if (t.length < 3) { err.textContent = tr(\"Scrie un răspuns (minim 3 caractere).\", \"Write a reply (at least 3 characters).\"); return; }\n      save.disabled = true; err.textContent = \"\";\n      fetch(\"/api/recenzii/raspuns\", { method: \"POST\", headers: { \"Content-Type\": \"application/json\" }, body: JSON.stringify({ kind: kind, reviewId: Number(id), text: t }) })\n        .then(function(r){ if (r.ok) { location.reload(); } else { save.disabled = false; err.textContent = tr(\"Nu s-a putut salva. Încearcă din nou.\", \"Could not save. Please try again.\"); } })\n        .catch(function(){ save.disabled = false; err.textContent = tr(\"Eroare de conexiune.\", \"Connection error.\"); });\n    });\n  }\n  document.addEventListener(\"click\", function(e){\n    var btn = e.target.closest && e.target.closest(\".rv-reply-btn\"); if (!btn) return;\n    if (!CFG.owner) {\n      modal(tr(\"Doar proprietarul poate răspunde\", \"Only the owner can reply\"),\n        tr(\"Răspunsul oficial la recenzii poate fi dat doar de proprietarul verificat al acestei pagini. Ești proprietarul? Autentifică-te sau creează un cont gratuit și revendică pagina.\", \"Only the verified owner of this page can post an official reply. Are you the owner? Sign in or create a free account and claim the page.\"),\n        [{ label: tr(\"Autentifică-te / creează cont\", \"Sign in / create account\"), href: CFG.loginHref, primary: true }, { label: tr(\"Închide\", \"Close\") }]);\n      return;\n    }\n    openEditor(btn);\n  });\n  /* ---- formularul de recenzie ---- */\n  var form = document.getElementById(\"rvForm\");\n  var writeBtn = document.getElementById(\"rvWriteBtn\");\n  if (writeBtn && form) writeBtn.addEventListener(\"click\", function(){ form.hidden = !form.hidden; if (!form.hidden) form.scrollIntoView({ behavior: \"smooth\", block: \"start\" }); });\n  document.querySelectorAll(\"[data-goto-reviews]\").forEach(function(a){\n    a.addEventListener(\"click\", function(e){ e.preventDefault(); var t = document.querySelector('#accTabs a[data-panel=\"recenzii\"]'); if (t) t.click(); var w = document.getElementById(\"rvWrap\"); if (w) w.scrollIntoView({ behavior: \"smooth\" }); });\n  });\n  if (!form) return;\n  var values = { 1: 0, 2: 0, 3: 0, 4: 0 };\n  form.querySelectorAll(\".rv-star-group\").forEach(function(g){\n    var k = g.getAttribute(\"data-k\"); var btns = g.querySelectorAll(\".rv-star-btn\");\n    function paint(v){ btns.forEach(function(b){ b.classList.toggle(\"is-on\", Number(b.getAttribute(\"data-v\")) <= v); }); }\n    btns.forEach(function(b){\n      b.addEventListener(\"click\", function(){ values[k] = Number(b.getAttribute(\"data-v\")); paint(values[k]); g.classList.remove(\"has-error\"); });\n      b.addEventListener(\"mouseenter\", function(){ paint(Number(b.getAttribute(\"data-v\"))); });\n      b.addEventListener(\"mouseleave\", function(){ paint(values[k]); });\n    });\n  });\n  var ta = document.getElementById(\"rvComment\"), cnt = document.getElementById(\"rvCount\");\n  function updCount(){ var n = ta.value.trim().length; cnt.textContent = n + \" / 30 \" + tr(\"minim\", \"minimum\"); cnt.classList.toggle(\"is-ok\", n >= 30); }\n  ta.addEventListener(\"input\", updCount); updCount();\n  var errBox = document.getElementById(\"rvErr\"), submit = document.getElementById(\"rvSubmit\");\n  var MSG = { invalid_rating: tr(\"Acordă o notă (1–5 stele) fiecărui criteriu.\", \"Give a rating (1–5 stars) for every criterion.\"), comment_short: tr(\"Mesajul trebuie să aibă minim 30 de caractere.\", \"Your message must be at least 30 characters long.\"), consent_required: tr(\"Bifează acordul de la finalul formularului.\", \"Please tick the agreement at the end of the form.\"), already_reviewed: tr(\"Ai trimis deja o recenzie pentru acest loc recent. Mulțumim!\", \"You already sent a review for this place recently. Thank you!\"), too_many_requests: tr(\"Prea multe încercări. Revino puțin mai târziu.\", \"Too many attempts. Please try again later.\") };\n  form.addEventListener(\"submit\", function(e){\n    e.preventDefault(); errBox.hidden = true;\n    var bad = false;\n    form.querySelectorAll(\".rv-star-group\").forEach(function(g){ if (!values[g.getAttribute(\"data-k\")]) { g.classList.add(\"has-error\"); bad = true; } });\n    if (bad) { errBox.textContent = MSG.invalid_rating; errBox.hidden = false; return; }\n    if (ta.value.trim().length < 30) { errBox.textContent = MSG.comment_short; errBox.hidden = false; ta.focus(); return; }\n    if (!document.getElementById(\"rvConsent\").checked) { errBox.textContent = MSG.consent_required; errBox.hidden = false; return; }\n    submit.disabled = true;\n    fetch(\"/api/locuri/recenzie\", { method: \"POST\", headers: { \"Content-Type\": \"application/json\" }, body: JSON.stringify({\n      kind: CFG.kind, placeId: CFG.placeId, authorName: document.getElementById(\"rvName\").value.trim(), r1: values[1], r2: values[2], r3: values[3], r4: values[4],\n      comment: ta.value.trim(), consent: true, website: document.getElementById(\"rvWebsite\").value }) })\n      .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, d: d }; }); })\n      .then(function(x){\n        if (x.ok) { form.innerHTML = CFG.thanksHtml; form.classList.add(\"is-done\"); form.scrollIntoView({ behavior: \"smooth\", block: \"center\" }); return; }\n        submit.disabled = false; errBox.textContent = MSG[x.d.error] || tr(\"Nu s-a putut trimite. Încearcă din nou.\", \"Could not send. Please try again.\"); errBox.hidden = false;\n      })\n      .catch(function(){ submit.disabled = false; errBox.textContent = tr(\"Eroare de conexiune.\", \"Connection error.\"); errBox.hidden = false; });\n  });\n})(CFG);\n";

// =====================================================================
// RECENZII pentru restaurante / cafenele / obiective / locuri propuse
// (+ răspunsul proprietarului, și la pensiuni). Note 1–5 pe 4 criterii.
// =====================================================================
const REVIEW_CRITERIA = {
  food: [
    { k: 1, ro: "Mâncare", en: "Food", icon: "plate", hintRo: "Gust, calitatea ingredientelor, preparare", hintEn: "Taste, ingredient quality, preparation" },
    { k: 2, ro: "Serviciu", en: "Service", icon: "bell", hintRo: "Politețe, rapiditatea personalului / livrării", hintEn: "Politeness, speed of staff / delivery" },
    { k: 3, ro: "Preț", en: "Price", icon: "card", hintRo: "Dacă prețul este corect raportat la ce ai primit", hintEn: "Whether the price is fair for what you got" },
    { k: 4, ro: "Locație", en: "Location", icon: "pin", hintRo: "Curățenie, ambianță, confort, accesibilitate / parcare", hintEn: "Cleanliness, atmosphere, comfort, access / parking" },
  ],
  attraction: [
    { k: 1, ro: "Experiență", en: "Experience", icon: "landmark", hintRo: "Ce ai văzut sau făcut și cât ți-a plăcut", hintEn: "What you saw or did and how much you enjoyed it" },
    { k: 2, ro: "Personal și organizare", en: "Staff & organisation", icon: "people", hintRo: "Politețe, informare, cozi, organizare", hintEn: "Politeness, information, queues, organisation" },
    { k: 3, ro: "Preț", en: "Price", icon: "card", hintRo: "Dacă prețul biletului / serviciilor merită", hintEn: "Whether the ticket / service price is worth it" },
    { k: 4, ro: "Locație și acces", en: "Location & access", icon: "pin", hintRo: "Acces, parcare, curățenie, indicatoare", hintEn: "Access, parking, cleanliness, signage" },
  ],
};

const PLACE_REVIEW_KINDS = ["restaurant", "obiectiv", "loc"];

const STAR_PATH = '<path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.6 6.8 19.4l1-5.9L3.5 9.4l5.9-.8L12 3.2Z"/>';

const REVIEWS_CSS = `
.rv-wrap{margin:8px 0 18px;}
.rv-summary{display:flex;flex-wrap:wrap;gap:18px 28px;align-items:center;background:var(--glass-bg,rgba(128,128,128,.08));border:1px solid var(--glass-border,rgba(128,128,128,.28));border-radius:14px;padding:16px 18px;margin-bottom:14px;}
.rv-score{display:flex;align-items:center;gap:12px;}.rv-score-num{font-size:40px;font-weight:900;line-height:1;color:var(--accent,#F0813A);}
.rv-score-meta{font-size:13px;color:var(--muted,#8a93a3);line-height:1.5;}
.rv-bars{flex:1 1 240px;min-width:220px;display:grid;gap:6px;}.rv-bar-row{display:grid;grid-template-columns:140px 1fr 30px;gap:8px;align-items:center;font-size:12.5px;}
.rv-bar{height:7px;border-radius:99px;background:rgba(128,128,128,.25);overflow:hidden;}.rv-bar>i{display:block;height:100%;background:var(--accent,#F0813A);border-radius:99px;}
.rv-bar-label{display:flex;align-items:center;gap:6px;}.rv-bar-label .pa-icon{color:var(--accent,#F0813A);flex:0 0 auto;}
.rv-stars{display:inline-block;position:relative;line-height:0;vertical-align:middle;}.rv-stars-bg{display:inline-flex;color:rgba(128,128,128,.35);}
.rv-stars-fg{position:absolute;left:0;top:0;overflow:hidden;white-space:nowrap;}.rv-stars-row{display:inline-flex;color:#f5a623;}
.rv-write{display:inline-flex;align-items:center;gap:8px;background:var(--accent,#F0813A);color:#fff;border:none;border-radius:10px;padding:12px 18px;font-weight:800;font-size:14.5px;cursor:pointer;font-family:inherit;}
.rv-form{border:1.5px solid var(--accent,#F0813A);border-radius:14px;padding:18px;margin:0 0 18px;background:var(--glass-bg,rgba(128,128,128,.06));}
.rv-form h3{margin:0 0 12px;font-size:17px;}.rv-field{margin:0 0 14px;}.rv-field>label,.rv-crit-name{display:block;font-weight:800;font-size:14px;margin-bottom:4px;}
.rv-field input[type=text],.rv-field textarea{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:10px;border:1.5px solid var(--glass-border,rgba(128,128,128,.4));background:var(--btn-surface,rgba(255,255,255,.06));color:inherit;font-size:15px;font-family:inherit;}
.rv-field textarea{min-height:110px;resize:vertical;}
.rv-crit{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 14px;padding:10px 0;border-bottom:1px dashed var(--glass-border,rgba(128,128,128,.3));}
.rv-crit-text{flex:1 1 220px;}.rv-crit-name{display:flex;align-items:center;gap:7px;margin:0;}.rv-crit-name .pa-icon{color:var(--accent,#F0813A);}.rv-crit-hint{font-size:12.5px;color:var(--muted,#8a93a3);margin:2px 0 0;}
.rv-star-group{display:inline-flex;gap:2px;padding:3px;border-radius:10px;}.rv-star-group.has-error{outline:2px solid #d64545;}
.rv-star-btn{background:none;border:none;padding:2px;cursor:pointer;color:rgba(128,128,128,.4);line-height:0;}.rv-star-btn.is-on{color:#f5a623;}.rv-star-btn svg{width:30px;height:30px;}
.rv-count{font-size:12.5px;color:var(--muted,#8a93a3);margin-top:3px;}.rv-count.is-ok{color:#2e9e5b;font-weight:700;}
.rv-consent{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.5;margin:6px 0 14px;}.rv-consent input{margin-top:3px;width:18px;height:18px;accent-color:var(--accent,#F0813A);flex:0 0 auto;}
.rv-submit{display:block;width:100%;background:var(--accent,#F0813A);color:#fff;border:none;border-radius:12px;padding:15px 18px;font-size:16px;font-weight:900;cursor:pointer;font-family:inherit;}.rv-submit:disabled{opacity:.6;cursor:wait;}
.rv-err{color:#e25555;font-size:13.5px;margin:8px 0 0;font-weight:700;}
.rv-thanks h3{margin:0 0 6px;font-size:19px;}.rv-thanks p{margin:6px 0;font-size:14.5px;line-height:1.5;}.rv-thanks li{display:flex;gap:9px;align-items:flex-start;margin:8px 0;list-style:none;font-size:14px;line-height:1.5;}.rv-thanks ul{padding:0;margin:10px 0;}.rv-thanks .pa-icon{color:var(--accent,#F0813A);flex:0 0 auto;margin-top:2px;}
.rv-item,.acc-review.rv-item{border-bottom:1px solid var(--glass-border,rgba(128,128,128,.28));padding:16px 0;}
.rv-head{display:flex;justify-content:space-between;gap:10px;align-items:baseline;flex-wrap:wrap;}.rv-date{font-size:12.5px;color:var(--muted,#8a93a3);}
.rv-rating{display:flex;align-items:center;gap:8px;margin:5px 0;font-weight:800;}.rv-mini{font-size:12.5px;color:var(--muted,#8a93a3);margin:0 0 6px;}
.rv-text{margin:6px 0;line-height:1.6;font-size:14.5px;white-space:pre-wrap;}
.rv-reply{margin:10px 0 4px 14px;padding:11px 14px;border-left:3px solid var(--accent,#F0813A);background:var(--glass-bg,rgba(128,128,128,.08));border-radius:0 10px 10px 0;}
.rv-reply-head{display:flex;align-items:center;gap:7px;font-weight:800;font-size:13px;margin-bottom:4px;color:var(--accent,#F0813A);}.rv-reply p{margin:0;font-size:14px;line-height:1.55;white-space:pre-wrap;}
.rv-reply-btn{background:none;border:1.5px solid var(--glass-border,rgba(128,128,128,.4));color:inherit;border-radius:9px;padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px;font-family:inherit;}
.rv-editor{margin-top:10px;}.rv-editor textarea{width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1.5px solid var(--accent,#F0813A);background:var(--btn-surface,rgba(255,255,255,.06));color:inherit;font-family:inherit;font-size:14.5px;}
.rv-editor-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;}
.rv-btn{display:inline-block;text-decoration:none;border:1.5px solid var(--glass-border,rgba(128,128,128,.4));background:none;color:inherit;border-radius:9px;padding:9px 15px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;}
.rv-btn.is-primary{background:var(--accent,#F0813A);border-color:var(--accent,#F0813A);color:#fff;}.rv-btn.is-danger{border-color:#d64545;color:#d64545;}
.rv-more{display:grid;grid-template-rows:0fr;transition:grid-template-rows .4s ease;}.rv-more>div{overflow:hidden;}.rv-more.is-open{grid-template-rows:1fr;}
.rv-more-btn{display:block;margin:14px auto 0;background:none;border:1.5px solid var(--accent,#F0813A);color:var(--accent,#F0813A);border-radius:10px;padding:11px 20px;font-weight:800;font-size:14.5px;cursor:pointer;font-family:inherit;}
.rv-empty{font-size:14px;color:var(--muted,#8a93a3);}
.rv-modal-bd{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;}
.rv-modal{background:#fff;color:#111;border-radius:16px;padding:24px 22px;max-width:380px;width:100%;}.rv-modal h3{margin:0 0 8px;font-size:18px;}.rv-modal p{margin:0 0 16px;font-size:14.5px;line-height:1.55;color:#333;}
.rv-modal-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;}.rv-modal .rv-btn{border-color:#ccc;color:#111;}.rv-modal .rv-btn.is-primary{color:#fff;border-color:var(--accent,#F0813A);}
.rv-pill{display:inline-flex;align-items:center;gap:7px;text-decoration:none;color:inherit;font-weight:800;font-size:14px;margin:0 0 8px;}
@media (max-width:560px){.rv-bar-row{grid-template-columns:110px 1fr 28px;}}
`;


const PUBLISHABLE_PROPOSAL_TYPES = ["restaurant", "cafe", "attraction", "beach", "other"];

const PLACE_NAME_HINTS_FOOD = /(gast ?st[aä]tte|restaurant|pizzeria|bistro|cafenea|caf[eé]|pub\b|crama|cofet[aă]rie|trattoria|grill|burger|kebab|ca[sș]a? ?de ?mas[aă]|han\b|bufet)/i;


// Mall-urile cu nume propriu, pe oraș — afișate individual în categoria
// „Mall-uri” de pe pagina orașului, în loc de un singur rând generic „Mall”.
// Slug-urile trebuie să existe în STORE_ALIASES (de acolo vin numele și orele).
const NAMED_MALLS_BY_CITY = {
  "bucuresti": ["afi-cotroceni", "baneasa-shopping-city", "parklake", "mega-mall", "sun-plaza", "veranda-mall", "plaza-romania", "unirea-shopping-center", "promenada-mall", "cotroceni-park"],
};


/* ============================================================
   3) STILURI — identitate vizuală comună tuturor paginilor
   ============================================================ */
const CSS_STYLES = `
:root{
  --bg:#0F1115; --surface:#171A21; --surface-2:#1E2330; --border:#2A303D; --btn-surface:#1A1F35;
  --text:#F3F5F8; --muted:#8E96AA; --accent:#F0813A; --accent-dim:#4A2A16; --active:#3B82F6;
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
    --bg:#FAF8F4; --surface:#FFFFFF; --surface-2:#F3F0EA; --border:#E8E3DA; --btn-surface:#FFFFFF;
    --text:#1C1E24; --muted:#6B7280; --accent-dim:#FFE4CC;
    --header-bg:rgba(250,248,244,.88);
    --glass-bg:rgba(255,255,255,.6); --glass-border:rgba(0,0,0,.06);
  }
}
/* Comutator manual — suprascrie alegerea automată de mai sus, DOAR când
   utilizatorul a apăsat explicit comutatorul (altfel rămâne "auto", legat
   de telefon, ca înainte) */
html[data-theme="dark"]{
  --bg:#0F1115; --surface:#171A21; --surface-2:#1E2330; --border:#2A303D; --btn-surface:#1A1F35;
  --text:#F3F5F8; --muted:#8E96AA; --accent-dim:#4A2A16;
  --header-bg:rgba(15,17,21,.88);
  --glass-bg:rgba(23,26,33,.6); --glass-border:rgba(255,255,255,.08);
}
html[data-theme="light"]{
  --bg:#FAF8F4; --surface:#FFFFFF; --surface-2:#F3F0EA; --border:#E8E3DA; --btn-surface:#FFFFFF;
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
.global-back-btn{position:fixed;top:calc(64px + env(safe-area-inset-top));left:14px;z-index:11;width:44px;height:44px;border-radius:50%;background:#1A1F35;border:2px solid #F0813A;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#F0813A;padding:0;font-family:inherit;line-height:1;cursor:grab;box-shadow:0 10px 24px -6px rgba(0,0,0,.45),0 2px 6px -1px rgba(0,0,0,.3);transition:box-shadow .15s ease,transform .15s ease;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}
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
/* Site-ul era gândit doar pentru mobil (520px), și pe desktop rămânea
   minuscul, plutind centrat într-un ecran mult mai mare — cerut explicit
   să arate ca un site real pe ecran mare, nu ca un telefon în mijlocul
   paginii. Lățime progresivă, păstrând mobilul exact cum era. */
@media (min-width:768px){.wrap{max-width:680px;}}
@media (min-width:1024px){.wrap{max-width:900px;}}
header{position:sticky;top:0;z-index:10;background:var(--header-bg);backdrop-filter:blur(10px);border-bottom:1px solid var(--border);padding:calc(14px + env(safe-area-inset-top)) 0 14px;}
.header-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;}
.header-row .brand-stack{justify-self:start;display:flex;flex-direction:column;align-items:flex-start;gap:2px;}
/* Linkurile de Cazare/Restaurant din antet — scoase complet, peste tot
   (mobil ȘI desktop). Pe mobil se suprapuneau cu butonul "înapoi"; pe
   desktop, stivuite sub "Ghiduri/Itinerar", arătau înghesuit. Descoperirea
   cazărilor/restaurantelor se face deja din pagina de oraș (tab dedicat),
   nu mai era nevoie de link separat în antet. */
.header-property-links{display:none;}
.guides-link{font-family:var(--font-display);font-size:13px;font-weight:600;color:var(--accent);text-decoration:none;white-space:nowrap;}
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
.chip,.city-search-btn,.geo-btn,.sub-nav-tab,.fav-star,.country-flag-btn,.clear-country-btn,a.affiliate-btn,a.amazon-btn,a.ticket-btn,.affiliate-btn-temu,.affiliate-btn-generic{transition:transform .12s ease,opacity .12s ease,background .15s ease,color .15s ease;}
.chip:active,.city-search-btn:active,.geo-btn:active,.sub-nav-tab:active,.fav-star:active,.country-flag-btn:active,.clear-country-btn:active,a.affiliate-btn:active,a.amazon-btn:active,a.ticket-btn:active,.affiliate-btn-temu:active,.affiliate-btn-generic:active{transform:scale(.96);}
.status-card:active{transform:scale(.995);}
.brand-badge{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;color:#fff;font-family:var(--font-display);font-weight:800;font-size:13px;margin-right:12px;flex:0 0 auto;vertical-align:middle;box-shadow:0 3px 8px -2px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.25);text-shadow:0 1px 1px rgba(0,0,0,.2);}
.mall-list li{display:flex;align-items:center;padding-left:16px;}
.mall-list li[hidden]{display:none;}
.city-map{height:280px;border-radius:var(--radius-md);overflow:hidden;margin:14px 18px 0;border:1px solid var(--border);background:var(--surface);}
.map-live-toggle{display:flex;align-items:center;gap:8px;margin:14px 18px 4px;font-size:14px;color:var(--text);}
.map-live-status{margin:0 18px 4px;font-size:12.5px;color:var(--muted);}
.chip.active{background:var(--btn-surface);color:var(--text);border-color:var(--accent);}
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
.flight-widget-card{width:100vw;max-width:480px;position:relative;left:50%;transform:translateX(-50%);box-sizing:border-box;margin-top:20px;padding:16px;background:#fff;border-radius:var(--radius-md);box-shadow:0 12px 26px -10px rgba(0,0,0,.4);overflow:visible;min-height:60px;}
/* Card "trip toolkit" — designul premium cerut pentru ghidul de excursii:
   fundal glass, bordură discretă cu accent, cele 3 butoane grupate curat,
   una lângă alta pe ecrane late, stivuite pe mobil. */
.trip-toolkit-card{margin:20px 18px 0;padding:22px 20px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius-lg);box-shadow:0 16px 34px -14px rgba(255,122,26,.25);}
.nearby-stays-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:14px;}
.nearby-stay-card{display:block;text-decoration:none;color:inherit;border:1px solid var(--glass-border);border-radius:12px;overflow:hidden;background:var(--surface);}
.nearby-stay-card img,.nearby-stay-card-noimg{width:100%;height:90px;object-fit:cover;display:block;background:var(--glass-bg);}
.nearby-stay-card-noimg{display:flex;align-items:center;justify-content:center;font-size:26px;}
.nearby-stay-card-name{font-size:13.5px;font-weight:700;padding:8px 10px 2px;}
.nearby-stay-card-price{font-size:12px;color:var(--muted);padding:0 10px 10px;}
.nearby-attractions-list{margin:12px 0 0;padding-left:18px;}
.nearby-attractions-list li{margin-bottom:6px;}
.nearby-attractions-list a{color:var(--accent);text-decoration:none;font-weight:600;}
/* Text centrat pe toate ghidurile (cerut explicit — părea neliniat pe
   dreapta) + rând liber între descriere și butonul "Rezervă excursia..."
   care o urmează. */
.guide-body-content{text-align:center;}
.guide-body-content h3{margin-top:32px;}
.guide-body-content p{margin-bottom:20px;}
.guide-body-content .plan-visit-option{margin-bottom:32px;}
.trip-toolkit-title{font-family:var(--font-display);font-weight:800;font-size:19px;margin:0 0 6px;}
.trip-toolkit-subtitle{font-size:14px;color:var(--muted);margin:0 0 16px;line-height:1.5;}
.trip-toolkit-buttons{display:flex;flex-direction:column;gap:10px;}
.trip-toolkit-buttons .affiliate-btn{margin:0;width:100%;border-radius:var(--radius-md);}
.gyg-search-widget-wrap{margin-top:16px;}
/* Cerut explicit: rămâne stivuit vertical (o coloană) și pe desktop/tabletă
   — pe rând, cardurile ieșeau din containerul principal la ecrane mari. */
.plan-visit-btn{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:100px;padding:13px 18px;font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text);cursor:pointer;}
.plan-visit-hint{margin:8px 4px 0;text-align:center;font-size:13px;color:var(--muted);}
.plan-visit-panel{margin-top:8px;display:flex;flex-direction:column;gap:8px;}
.plan-visit-panel[hidden]{display:none;}
.plan-visit-option{display:block;text-align:center;padding:13px 18px;border-radius:10px;font-family:var(--font-display);font-weight:700;font-size:13.5px;text-decoration:none;}
/* .plan-visit-option se aplică și pe <button> acum (butoanele care
   declanșează widget-uri, nu doar linkuri <a>) — <button> are stiluri
   implicite din browser (bordură, fundal, box-sizing) care nu se resetează
   automat doar prin .plan-visit-option — bug real, semnalat direct:
   butonul de zboruri arăta vizibil diferit (mai mic/inegal) față de
   restul, care erau toate <a>. */
button.plan-visit-option{width:100%;cursor:pointer;box-sizing:border-box;font-family:inherit;line-height:normal;}
.plan-visit-ticket{background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);}
.plan-visit-booking{background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);}
.plan-visit-parking{background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);}
.plan-visit-parking-alt{background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);}
.how-to-get-there-btn{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:100px;padding:13px 18px;font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text);cursor:pointer;}
.how-to-get-there-panel{margin-top:8px;display:flex;flex-direction:column;gap:8px;}
.how-to-get-there-panel[hidden]{display:none;}
.how-to-get-there-option{display:block;text-align:center;padding:13px 18px;border-radius:10px;font-family:var(--font-display);font-weight:700;font-size:13.5px;text-decoration:none;background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);}
.how-to-get-there-option-alt{background:var(--btn-surface);}
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
.report-issue-submit{width:100%;background:var(--btn-surface);border:1.5px solid var(--accent);border-radius:10px;padding:10px 18px;font-family:var(--font-display);font-weight:700;font-size:13.5px;color:var(--text);cursor:pointer;}
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
/* La fel ca la .plan-visit-option — reset pentru <button> (butoane care
   declanșează widget-uri), care altfel are stiluri implicite din browser. */
button.affiliate-btn{cursor:pointer;box-sizing:border-box;font-family:inherit;line-height:normal;}
.affiliate-banner-link{display:block;text-align:center;margin:14px 18px 0;}
.affiliate-banner-link img{max-width:100%;height:auto;border-radius:var(--radius-md);display:inline-block;box-shadow:0 12px 26px -10px rgba(0,0,0,.4);transition:transform .15s ease;}
.affiliate-banner-link:hover img{transform:translateY(-2px);}
.affiliate-btn:hover{opacity:.92;transform:translateY(-1px);}
.affiliate-btn-temu{background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);box-shadow:0 12px 26px -10px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;gap:10px;transition:transform .18s ease,box-shadow .25s ease;}
.affiliate-btn-temu:hover{transform:translateY(-2px);box-shadow:0 18px 34px -8px rgba(0,0,0,.45);}
.affiliate-btn-temu svg{width:20px;height:20px;flex:0 0 auto;}
.affiliate-btn-generic{background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);box-shadow:0 12px 26px -10px rgba(0,0,0,.4);}
.affiliate-btn-cta{display:flex;align-items:center;justify-content:center;gap:10px;}
.affiliate-cta-arrow{font-size:22px;font-weight:900;line-height:1;flex:0 0 auto;animation:affiliateCtaNudge 1.4s ease-in-out infinite;}
@keyframes affiliateCtaNudge{0%,100%{transform:translateX(0);}50%{transform:translateX(5px);}}
@media (prefers-reduced-motion: reduce){.affiliate-cta-arrow{animation:none;}}
.cinema-card{margin:14px 18px 0;padding:28px 24px;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:var(--radius-lg);text-align:center;}
.cinema-note{font-size:13px;color:var(--muted);line-height:1.6;margin:10px 0 18px;}
.cinema-btn{display:inline-block;background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);text-decoration:none;font-family:var(--font-display);font-weight:700;font-size:15px;padding:13px 26px;border-radius:10px;}
.amazon-btn{display:block;text-align:center;width:calc(100% - 36px);margin:14px 18px 0;padding:15px 20px;border-radius:100px;font-family:var(--font-display);font-weight:700;font-size:15px;text-decoration:none;background:linear-gradient(135deg,#131A22,#232F3E);color:#FF9900;border:1px solid #FF9900;box-shadow:0 12px 26px -10px rgba(0,0,0,.5);}
.amazon-btn-cta{display:flex;align-items:center;justify-content:center;gap:10px;}
.ticket-btn{display:block;text-align:center;width:calc(100% - 36px);margin:8px 18px 16px;padding:13px 20px;border-radius:10px;font-family:var(--font-display);font-weight:700;font-size:14.5px;text-decoration:none;background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);}
.sub-nav-tabs{display:flex;gap:6px;margin:14px 18px 0;background:#1e1e1e;border-radius:var(--radius-md);padding:6px;}
.sub-nav-tab{flex:1 1 0;min-width:0;background:var(--btn-surface);border:1.5px solid var(--border);border-radius:calc(var(--radius-md) - 4px);padding:13px 10px;font-family:var(--font-display);font-weight:700;font-size:13.5px;color:var(--muted);cursor:pointer;transition:background .18s ease,color .18s ease,border-color .18s ease;text-align:center;min-height:44px;word-break:break-word;overflow-wrap:break-word;}
.sub-nav-tab.active{background:var(--btn-surface);border-color:var(--accent);color:var(--text);}
/* Doar 2 taburi (Magazine/Obiective), fără Favorite — cerut explicit,
   design mai simplu, taburi egale ca importanță vizuală, mai mari. */
.sub-nav-tabs-2col .sub-nav-tab{padding:16px 10px;font-size:15px;min-height:54px;}
.sub-nav-panel{display:none;}
.sub-nav-panel.active{display:block;}
/* Comutatorul "Deschise Acum" — restilizat ca switch mare, ușor de apăsat
   din mers pe telefon, cerut explicit în loc de checkbox-ul mic dinainte. */
.open-now-switch{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:100px;padding:12px 18px;font-weight:600;}
.open-now-switch input[type="checkbox"]{appearance:none;-webkit-appearance:none;width:42px;height:24px;border-radius:100px;background:var(--border);position:relative;cursor:pointer;transition:background .2s ease;flex-shrink:0;}
.open-now-switch input[type="checkbox"]::before{content:"";position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s ease;box-shadow:0 1px 3px rgba(0,0,0,.3);}
.open-now-switch input[type="checkbox"]:checked{background:var(--accent);}
.open-now-switch input[type="checkbox"]:checked::before{transform:translateX(18px);}
/* Butonul de geolocalizare de pe pagina internațională — poziționat sus,
   lângă căutare, nu ascuns într-un panou de tab, ca să fie vizibil imediat. */
#geoBtnIntl.geo-btn{margin:10px 18px 0;}
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
.install-safari-btn{display:block;width:100%;background:var(--btn-surface);color:var(--text);text-align:center;padding:13px;border-radius:10px;text-decoration:none;font-weight:700;border:1.5px solid var(--accent);font-size:15px;cursor:pointer;box-sizing:border-box;}
.install-fallback-text{margin-top:10px;font-size:12.5px;color:var(--muted);text-align:center;}
.install-confirm-btn{display:block;width:100%;background:var(--btn-surface);color:var(--text);text-align:center;padding:13px;border-radius:10px;border:1.5px solid var(--accent);font-weight:700;font-size:15px;cursor:pointer;}
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
.itinerary-promo-card{display:block;text-decoration:none;background:linear-gradient(135deg,#2B6CB0,#4299E1);border-radius:var(--radius-md);padding:18px 20px;margin:14px 0;box-shadow:0 4px 16px rgba(43,108,176,.25);}
/* Card combinat (itinerar + Beach Hopper Grecia, un singur card, 2
   butoane) — cerut explicit, în loc de 2 bannere mari separate. */
.itinerary-promo-buttons{display:flex;flex-direction:column;gap:8px;margin-top:10px;}
.itinerary-promo-btn{display:block;text-align:center;background:rgba(255,255,255,.15);color:#fff;text-decoration:none;font-family:var(--font-display);font-weight:700;font-size:13.5px;padding:12px 14px;border-radius:calc(var(--radius-md) - 6px);border:1px solid rgba(255,255,255,.25);}
@media (min-width:420px){.itinerary-promo-buttons{flex-direction:row;}.itinerary-promo-btn{flex:1;}}
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
.beach-review-cta{display:block;width:100%;text-align:center;background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);border-radius:10px;padding:15px 20px;font-family:var(--font-display);font-weight:800;font-size:15px;cursor:pointer;}
.beach-review-cta[hidden]{display:none;}
.beach-review-form{display:flex;flex-direction:column;gap:10px;margin-top:14px;}
.beach-review-form[hidden]{display:none;}
.beach-review-q{display:flex;flex-direction:column;gap:6px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:10px;padding:12px 14px;}
.beach-review-q-text{font-size:13.5px;font-weight:600;color:var(--text);}
.beach-review-q label{font-size:13px;color:var(--muted);margin-right:14px;cursor:pointer;}
.beach-review-submit{background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);border-radius:10px;padding:13px 20px;font-family:var(--font-display);font-weight:800;font-size:14.5px;cursor:pointer;}
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
  display:block;width:100%;text-align:center;background:var(--btn-surface);
  color:var(--text);border:1.5px solid var(--accent);border-radius:10px;padding:16px 20px;font-family:var(--font-display);
  font-weight:800;font-size:16px;cursor:pointer;margin-top:6px;
}
.submit-place-thanks{text-align:center;color:var(--accent);font-weight:700;font-size:15px;margin-top:14px;}
.submit-place-error{text-align:center;color:#e53935;font-weight:600;font-size:14px;margin-top:14px;}
.submit-place-247{display:flex;align-items:center;gap:8px;font-weight:700;font-size:14.5px;color:var(--text);}
.submit-place-247 input{width:auto;padding:0;accent-color:var(--accent);}
.submit-place-schedule{display:flex;flex-direction:column;gap:8px;transition:opacity .15s ease;}
.submit-place-schedule.is-247-active{opacity:.4;pointer-events:none;}
.submit-place-schedule-row{display:flex;align-items:center;gap:8px;}
.submit-place-schedule-row .sp-day-name{flex:0 0 74px;font-size:13.5px;font-weight:600;color:var(--muted);}
.submit-place-schedule-row input[type="time"]{flex:1;min-width:0;padding:10px 12px;font-size:14px;}
.submit-place-schedule-row .sp-closed-toggle{display:flex;align-items:center;gap:4px;font-weight:600;font-size:12.5px;color:var(--muted);white-space:nowrap;flex:0 0 auto;}
.submit-place-schedule-row .sp-closed-toggle input{width:auto;padding:0;accent-color:var(--accent);}
.submit-place-schedule-row.is-day-closed input[type="time"]{opacity:.35;pointer-events:none;}
.badge-platforms-list{margin:0;padding-left:20px;color:var(--text);font-size:14.5px;line-height:1.6;}
.badge-platforms-list li{margin-bottom:8px;}
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
.contextual-widget-btn{display:block;text-align:center;width:100%;margin-bottom:8px;padding:11px 18px;border-radius:10px;font-family:var(--font-display);font-weight:700;font-size:13.5px;text-decoration:none;background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);}
.contextual-widget.is-closed .contextual-widget-btn{background:#fff;color:#DC2626;}
.contextual-widget.is-closed .contextual-widget-btn-secondary{background:rgba(255,255,255,.18);color:#fff;border:1px solid rgba(255,255,255,.4);}
.accordion-ticket-btn{display:block;text-align:center;width:100%;margin:0 0 10px;padding:13px 20px;border-radius:10px;font-family:var(--font-display);font-weight:700;font-size:14px;text-decoration:none;background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);}

.attraction-accordion-header-row{display:flex;align-items:stretch;}

.fav-star.is-fav{color:var(--accent);}
.fav-empty{margin:14px 18px 0;font-size:13.5px;color:var(--muted);}
.lang-switcher{margin:10px 18px 0;}
.arrival-planner{margin:10px 18px 0;}
.holiday-radar{margin:14px 18px 4px;background:rgba(240,129,58,.12);border:1.5px solid var(--accent);border-radius:12px;padding:12px 14px;font-size:14px;line-height:1.45;color:var(--text);}
.closing-soon{margin:10px 18px 0;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:12px;padding:10px 12px;font-size:13.5px;line-height:1.5;color:var(--text);}
.closing-soon strong{color:var(--accent);}
.arrival-planner-btn{background:var(--btn-surface,#1A1F35);color:var(--text);border:1.5px solid var(--accent);border-radius:10px;padding:10px 14px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;width:100%;text-align:left;}
.arrival-planner-panel{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px;}
.arrival-planner-panel[hidden]{display:none;}
.arrival-planner-panel input{padding:9px;border-radius:9px;border:1.5px solid var(--glass-border);background:var(--glass-bg);color:var(--text);font-size:15px;color-scheme:dark;}
html[data-theme="light"] .arrival-planner-panel input{color-scheme:light;}
.arrival-planner-panel button{background:var(--accent);color:#fff;border:none;border-radius:9px;padding:9px 14px;font-weight:700;cursor:pointer;font-family:inherit;}
.arrival-planner-panel .ap-now{background:transparent;color:var(--accent);border:1.5px solid var(--accent);}
.arrival-planner-info{margin-top:8px;font-size:13.5px;color:var(--text);background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:10px;padding:10px 12px;line-height:1.45;}
/* Lista care se deschide la selectorul de limbă: pe unele browsere (ex. Chrome
   pe Windows/Android) opțiunile moșteneau textul alb pe fundal alb → nu se
   vedea nimic la selectare. Forțăm culori lizibile, pe tema curentă. */
.lang-switcher select{color-scheme:dark;}
.lang-switcher select option{background-color:#171E3A;color:#FFFFFF;}
html[data-theme="light"] .lang-switcher select{color-scheme:light;}
html[data-theme="light"] .lang-switcher select option{background-color:#FFFFFF;color:#111111;}
.header-actions-group{display:flex;align-items:center;gap:8px;justify-self:end;}
.lang-switcher.in-header{margin:0;}
.lang-switcher.in-header select{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:100px;color:var(--text);font-family:var(--font-display);font-weight:600;font-size:12px;padding:6px 10px;cursor:pointer;}
.lang-switcher select{width:100%;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:var(--radius-md);padding:12px 16px;color:var(--text);font-family:var(--font-body);font-size:14.5px;cursor:pointer;}
.clear-country-btn{background:var(--btn-surface);border:1.5px solid var(--accent);color:var(--accent);font-family:var(--font-body);font-weight:600;font-size:13px;padding:8px 14px;border-radius:10px;cursor:pointer;}
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
.geo-btn{display:block;width:calc(100% - 36px);margin:16px 18px 0;background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);border-radius:10px;padding:13px 20px;font-family:var(--font-display);font-weight:700;font-size:15px;cursor:pointer;transition:opacity .15s ease;}
.geo-btn:disabled{opacity:.6;cursor:default;}
.geo-status{margin:10px 18px 0;font-size:13px;color:var(--muted);}
.city-search-form{display:flex;gap:8px;margin:16px 18px 0;}
.city-search-input{flex:1 1 auto;min-width:0;max-width:100%;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:100px;padding:12px 16px;color:var(--text);font-family:var(--font-body);font-size:14.5px;}
/* Lupă vizuală, doar pe caseta de căutare instant (#siteSearchInput, nu
   toate ".city-search-input" — clasa aceea e împărțită și cu dropdown-ul
   de zile de la itinerar, unde o lupă n-ar avea sens) — cerut explicit,
   ca utilizatorul să distingă vizual imediat că e o casetă de căutare. */
#siteSearchInput{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:16px center;background-size:16px 16px;padding-left:42px;}
/* Caseta de căutare: albastru-închis cu contur portocaliu pe tema închisă,
   albă cu contur portocaliu pe tema luminoasă. */
#siteSearchInput,.search-box-wrap .city-search-input{background-color:#171E3A;border:2px solid var(--accent);color:#fff;-webkit-backdrop-filter:none;backdrop-filter:none;}
#siteSearchInput::placeholder,.search-box-wrap .city-search-input::placeholder{color:#AEB6C8;}
html[data-theme="light"] #siteSearchInput,html[data-theme="light"] .search-box-wrap .city-search-input{background-color:#FFFFFF;border:2px solid var(--accent);color:#111;}
html[data-theme="light"] #siteSearchInput::placeholder,html[data-theme="light"] .search-box-wrap .city-search-input::placeholder{color:#8a8f99;}

/* Selector de orașe — cipuri orizontale + căutare live (buildCitySelectorHtml) */
.city-chips-row{display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;margin:14px 18px 0;padding-bottom:4px;scrollbar-width:none;}
.city-chips-row::-webkit-scrollbar{display:none;}
.city-chip{flex:0 0 auto;background:var(--glass-bg);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--glass-border);border-radius:100px;padding:9px 16px;font-family:var(--font-display);font-weight:700;font-size:13.5px;color:var(--text);text-decoration:none;white-space:nowrap;}
.city-search-input::placeholder{color:var(--muted);}
.city-search-input:focus{outline:none;border-color:var(--accent);}
.city-search-btn{flex:0 0 auto;background:var(--btn-surface);color:var(--text);border:1.5px solid var(--accent);border-radius:10px;padding:11px 20px;font-family:var(--font-display);font-weight:700;font-size:14.5px;cursor:pointer;}
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


// Formular "Propune un loc" — cerut explicit: utilizatorii pot propune un
// magazin, obiectiv sau plajă nou, nu doar Google are acest tip de
// contribuție. Etichete traduse complet, 21 de limbi.
// Zilele săptămânii pentru secțiunea "Program" din formularul de propunere,
// în ordine Luni→Duminică (mai naturală într-un formular); idx respectă
// convenția JS getDay() (0=Duminică...6=Sâmbătă) și indexează direct în
// TRANSLATIONS[lang].dayNames, ca să rămână corect tradus per limbă.
const SUBMIT_PLACE_SCHEDULE_DAYS = [1, 2, 3, 4, 5, 6, 0].map((idx) => ({ idx }));


const SUBMIT_PLACE_LABELS = {
  ro: { title: "📍 Propune un loc nou", intro: "Ai un magazin, obiectiv turistic, restaurant, cafenea și nu apare pe site-ul nostru, sau vrei doar să propui un obiectiv? Parcurge formularul de mai jos, noi îl verificăm și îl adăugăm în listă.",
    typeLabel: "Ce propui?", typeStore: "🛒 Magazin", typeAttraction: "🏛️ Obiectiv turistic", typeBeach: "🏖️ Plajă",
    typeRestaurant: "🍽️ Restaurant", typeCafe: "☕ Cafenea", typeOther: "📍 Altceva",
    otherTypeLabel: "Ce anume?", otherTypePlaceholder: "ex. bibliotecă, târg, atelier meșteșugăresc",
    nameLabel: "Nume", namePlaceholder: "ex. Castelul Corvinilor",
    cityLabel: "Oraș / Insulă", cityPlaceholder: "ex. Hunedoara",
    scheduleLabel: "Program", schedule247: "Deschis non-stop (24/7)", scheduleClosedLabel: "Închis",
    countryLabel: "Țară",
    categoryLabel: "Categorie (opțional)", categoryPlaceholder: "ex. castel, muzeu, supermarket",
    mapsLabel: "Link Google Maps (opțional, dar ajută mult)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Notă (opțional)", notePlaceholder: "Orice detaliu util pentru vizitatorii site-ului — telefon, adresă, etc.",
    submit: "Trimite propunerea", thanks: "✓ Mulțumim! Propunerea ta a fost trimisă spre verificare.",
    errorGeneric: "Ceva n-a mers. Încearcă din nou.", errorRate: "Ai trimis prea multe propuneri recent. Mai încearcă puțin mai târziu." },
  uk: { title: "📍 Suggest a new place", intro: "Have a store, tourist attraction, restaurant, or café that's not on our site yet — or just want to suggest an attraction? Go through the form below, we'll check it and add it.",
    typeLabel: "What are you suggesting?", typeStore: "🛒 Store", typeAttraction: "🏛️ Attraction", typeBeach: "🏖️ Beach",
    typeRestaurant: "🍽️ Restaurant", typeCafe: "☕ Café", typeOther: "📍 Something else",
    otherTypeLabel: "What kind?", otherTypePlaceholder: "e.g. library, market, craft workshop",
    nameLabel: "Name", namePlaceholder: "e.g. Corvin Castle",
    cityLabel: "City / Island", cityPlaceholder: "e.g. Hunedoara",
    scheduleLabel: "Opening hours", schedule247: "Open 24/7", scheduleClosedLabel: "Closed",
    countryLabel: "Country",
    categoryLabel: "Category (optional)", categoryPlaceholder: "e.g. castle, museum, supermarket",
    mapsLabel: "Google Maps link (optional, but really helps)", mapsPlaceholder: "https://maps.google.com/...",
    noteLabel: "Note (optional)", notePlaceholder: "Any useful detail for site visitors — phone, address, etc.",
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


// "No matches" (căutare, fără rezultate) — cerut explicit, era fix în
// engleză indiferent de limbă.
const NO_MATCHES_LABELS = {
  ro: "Niciun rezultat", uk: "No matches", de: "Keine Treffer", fr: "Aucun résultat", es: "Sin resultados",
  it: "Nessun risultato", pl: "Brak wyników", nl: "Geen resultaten", da: "Ingen resultater", cz: "Žádné výsledky",
  fi: "Ei tuloksia", gr: "Κανένα αποτέλεσμα", hu: "Nincs találat", hr: "Nema rezultata", sk: "Žiadne výsledky",
  si: "Ni rezultatov", lt: "Rezultatų nėra", lv: "Nav rezultātu", pt: "Sem resultados", se: "Inga resultat",
  ee: "Tulemusi ei leitud",
};


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


// Pagină de start: site.ro/ — fără oraș/magazin specificat încă
// Pagină de start pentru domeniul internațional (opening-hours-today.eu) —
// simplu selector de țară, în engleză (punct de intrare neutru, înainte să
// știm limba vizitatorului). Minimală, deliberat — o pagină completă de tip
// homepage RO (geolocație, PWA, căutare) pentru fiecare piață e un pas separat.
// Butonul „Cazare prin OpeningHoursToday” de pe prima pagină, în limba paginii.
const HOME_STAY_CTA_LABELS = {
  ro: { pre: "Cazare prin", post: "" },
  uk: { pre: "Book a stay with", post: "" },
  de: { pre: "Unterkunft buchen mit", post: "" },
  es: { pre: "Reserva alojamiento con", post: "" },
  fr: { pre: "Réservez un hébergement avec", post: "" },
  it: { pre: "Prenota un alloggio con", post: "" },
  pl: { pre: "Zarezerwuj nocleg z", post: "" },
  nl: { pre: "Boek een verblijf via", post: "" },
  da: { pre: "Book overnatning via", post: "" },
  se: { pre: "Boka boende via", post: "" },
  pt: { pre: "Reserve alojamento com", post: "" },
  cz: { pre: "Rezervujte ubytování přes", post: "" },
  fi: { pre: "Varaa majoitus", post: " -palvelussa" },
  gr: { pre: "Κράτηση διαμονής με", post: "" },
  hu: { pre: "Szállásfoglalás az", post: " oldalon" },
  hr: { pre: "Rezervirajte smještaj preko", post: "" },
  sk: { pre: "Rezervujte ubytovanie cez", post: "" },
  si: { pre: "Rezervirajte nastanitev prek", post: "" },
  lt: { pre: "Užsisakykite nakvynę per", post: "" },
  lv: { pre: "Rezervējiet naktsmītni ar", post: "" },
  ee: { pre: "Broneeri majutus", post: " kaudu" },
};


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


// România adăugată în registrul internațional (site-ul .eu) — reutilizează
// EXACT aceleași date reale, deja verificate (STORE_CONFIG, toate cele 41
// orașe). Include acum și mall-uri/cinematografe — renderIntlStorePage a
// fost extinsă să le suporte, cu structura lor completă de date.
const RO_INTL_STORE_CONFIG = {};


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

const OWNER_NOTICE_CONTACT_RO = `Dacă ai întrebări sau crezi că e o greșeală, ne poți scrie pe WhatsApp la <strong>+40 751 218 782</strong>.`;

const OWNER_NOTICE_CONTACT_EN = `If you have questions or think this is a mistake, you can message us on WhatsApp at <strong>+40 751 218 782</strong>.`;

// Sesiunea e un cookie semnat (valabil 30 de zile). Dacă adminul șterge contul,
// cookie-ul ar rămâne valid — așa că verificăm (cu cache scurt) că proprietarul
// există încă. La eroare de bază de date nu blocăm pe nimeni.
const OWNER_EXISTS_CACHE = new Map();


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// Iconițe (SVG) pentru rețelele sociale — în loc de emoji-uri care nu se înțelegeau
// (📘 pentru Facebook etc.). Culorile brandurilor, ca să fie recunoscute imediat.
const SOCIAL_ICONS = {
  facebook: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><defs><linearGradient id="igG" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FEDA75"/><stop offset=".35" stop-color="#FA7E1E"/><stop offset=".6" stop-color="#D62976"/><stop offset=".85" stop-color="#962FBF"/><stop offset="1" stop-color="#4F5BD5"/></linearGradient></defs><path fill="url(#igG)" d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12c0-3.2.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.4-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#25F4EE" transform="translate(-.9 .9)" d="M19.6 6.7a4.5 4.5 0 01-3.6-4.2V2h-3.4v13.4a2.9 2.9 0 11-2-2.8V9.1a6.3 6.3 0 105.4 6.3V8.8a7.9 7.9 0 004.6 1.5V6.9a4.6 4.6 0 01-1-.2z"/><path fill="#FE2C55" transform="translate(.9 -.9)" d="M19.6 6.7a4.5 4.5 0 01-3.6-4.2V2h-3.4v13.4a2.9 2.9 0 11-2-2.8V9.1a6.3 6.3 0 105.4 6.3V8.8a7.9 7.9 0 004.6 1.5V6.9a4.6 4.6 0 01-1-.2z"/><path fill="currentColor" d="M19.6 6.7a4.5 4.5 0 01-3.6-4.2V2h-3.4v13.4a2.9 2.9 0 11-2-2.8V9.1a6.3 6.3 0 105.4 6.3V8.8a7.9 7.9 0 004.6 1.5V6.9a4.6 4.6 0 01-1-.2z"/></svg>`,
};


// Clasificarea oficială: la pensiuni și cabane se folosesc MARGARETE (🌼),
// la hoteluri și campinguri — STELE (⭐). Aceeași valoare (1–5) în baza de date.
const DAISY_TYPES = ["pensiune", "cabana", "aframe"];


const ACC_CURRENCY_LABELS = {
  EUR: "Euro", RON: "Leu românesc", USD: "Dolar american", GBP: "Liră sterlină",
  HUF: "Forint maghiar", CZK: "Coroană cehă", PLN: "Zlot polonez", BGN: "Leva bulgărească",
  TRY: "Liră turcească", CHF: "Franc elvețian", SEK: "Coroană suedeză", NOK: "Coroană norvegiană", DKK: "Coroană daneză",
};

// Dropdown de limbă — momentan doar RO e funcțional (tot conținutul e scris
// în română); restul apar vizibil, cu steag, dar marcate "în curând" —
// pregătite pentru extindere, nu ascunse.
const ACC_LANGUAGES = [
  { code: "ro", flag: "🇷🇴", name: "Română" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
  { code: "es", flag: "🇪🇸", name: "Español" },
  { code: "it", flag: "🇮🇹", name: "Italiano" },
  { code: "pl", flag: "🇵🇱", name: "Polski" },
  { code: "nl", flag: "🇳🇱", name: "Nederlands" },
];

// Modal de selecție a monedei — buton din header, oriunde apare pe paginile
// de cazare. Conversia reală (curs BCE, prin Frankfurter.app) se face în
// JS, client-side, pe elementele marcate cu data-price/data-currency.
const ACC_CURRENCY_LABELS_EN = {
  EUR: "Euro", RON: "Romanian leu", USD: "US dollar", GBP: "British pound", HUF: "Hungarian forint", CZK: "Czech koruna", PLN: "Polish zloty", BGN: "Bulgarian lev",
  TRY: "Turkish lira", CHF: "Swiss franc", SEK: "Swedish krona", NOK: "Norwegian krone", DKK: "Danish krone",
};



// testat: `put()` e funcția standard server-side a @vercel/blob, fără niciun
// adaptor peste `req`. Limită reală: ~4MB per poză (limita de request a
// funcțiilor Vercel) — validată și pe client, cu mesaj clar, înainte de upload.
const ACCOMMODATION_PHOTO_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };


const ACCOMMODATION_TYPES = ["pensiune", "hotel_mic", "cabana", "aframe", "apartament", "camping", "altceva"];

const ACCOMMODATION_TYPE_LABELS = { pensiune: "🏡 Pensiune", hotel_mic: "🏨 Hotel mic", cabana: "🌲 Cabană", aframe: "🔺 Casă A-Frame", apartament: "🏢 Apartament de închiriat", camping: "⛺ Camping", altceva: "📍 Altceva" };

const ACCOMMODATION_AMENITIES = {
  parcare: "🅿️ Parcare", mic_dejun: "🍳 Mic dejun inclus", wifi: "📶 Wi-Fi",
  animale: "🐾 Acceptă animale", piscina: "🏊 Piscină", aer_conditionat: "❄️ Aer condiționat",
  jacuzzi: "🛁 Jacuzzi/Ciubăr", loc_de_joaca: "🛝 Loc de joacă", gratar: "🍖 Grătar / BBQ",
  bucatarie_utilata: "🥘 Bucătărie complet utilată", masina_spalat: "🧼 Mașină de spălat rufe",
  espressor: "☕ Espressor de cafea / Filtru", smart_tv: "📺 Smart TV / Netflix",
  receptie: "🛎️ Recepție (non-stop sau cu program)", restaurant_propriu: "🍽️ Restaurant propriu / Bar",
  plata_card: "💳 Plată cu cardul la locație", sala_conferinte: "💼 Sală de conferințe / Evenimente",
  curatenie_zilnica: "🧹 Serviciu zilnic de curățenie",
  pescuit: "🎣 Pescuit",
  sauna: "🧖 Saună", masina_spalat_vase: "🍴 Mașină de spălat vase",
};


/* ============================================================
   MODUL NOU — RESTAURANTE / PUBURI / CAFENELE — cerut explicit, ca
   extensie a ecosistemului de cazări. Structură în oglindă: cont propriu
   (email+parolă, exact același mecanism ca la cazare — signCookiePayload/
   verifyCookiePayload, hashPassword/verifyPassword, deja construite mai
   sus, nimic nou), formular de înscriere, panou de admin separat, pagină
   publică. SPRE DEOSEBIRE de cazare: fără abonament deloc (cerut explicit)
   — listare gratuită, punct. accommodationGate NU se aplică aici — secțiunea
   asta are propriul steag, separat (vezi RESTAURANT_LIVE mai jos).
   ============================================================ */
const RESTAURANT_LIVE = process.env.RESTAURANT_LIVE === "true";

const RESTAURANT_PREVIEW_KEY = process.env.RESTAURANT_PREVIEW_KEY || "";


const RESTAURANT_VENUE_TYPES = { restaurant: "🍽️ Restaurant", cafenea: "☕ Cafenea / Ceainărie", pub: "🍺 Pub / Bar", bistro: "🥘 Bistro", fastfood: "🌭 Fast Food / Street Food", altul: "📍 Altul" };

const RESTAURANT_DIETARY_OPTIONS = { vegetarian: "🥗 Preparate vegetariene/vegane", fara_gluten: "🌾 Preparate fără gluten", meniu_copii: "🧒 Meniu pentru copii" };

const RESTAURANT_AMENITIES = {
  terasa: "☀️ Terasă / Grădină de vară", parcare: "🅿️ Parcare proprie / în apropiere",
  loc_de_joaca: "🛝 Spațiu de joacă pentru copii", pet_friendly: "🐾 Acces animale de companie",
  wifi: "📶 Wi-Fi gratuit", evenimente: "🎉 Organizare evenimente private",
  acces_dizabilitati: "♿ Acces pentru persoane cu dizabilități",
};


/* ============================================================
   MODUL NOU — OBIECTIVE TURISTICE PROPUSE (nu se confundă cu
   ATTRACTIONS.ro, cele statice, curatoriate). Cerut explicit, în oglindă
   exactă cu modulul de restaurante — cont comun (accommodation_owners),
   gratuit, fără abonament. Rută publică separată (/atractie/:slug), ca să
   nu intre în conflict cu /obiectiv/:slug (obiectivele statice).
   ============================================================ */
const ATTRACTION_VENUE_TYPES = {
  castel: "🏰 Castel / Cetate / Palat", muzeu: "🖼️ Muzeu / Galerie de artă",
  parc_distractii: "🎢 Parc de distracții / Aventură / Acvaparc",
  rezervatie: "🏞️ Rezervație naturală / Peșteră / Cascadă",
  monument: "⛪ Monument istoric / Lăcaș de cult",
  gradina: "🌳 Grădină botanică / Zoologică", altul: "📍 Altul",
};

const ATTRACTION_AMENITIES = {
  ghid_turistic: "🗣️ Ghid turistic disponibil (audio sau uman)",
  ghid_strain: "🌍 Ghidaj în limbi străine",
  magazin_suveniruri: "🛍️ Magazin de suveniruri / produse locale",
  toalete: "🚻 Toalete publice în incintă",
  cafenea_picnic: "☕ Spațiu de relaxare / Cafenea / Zonă de picnic",
  acces_scaune_rotile: "♿ Accesibilitate pentru scaune cu rotile / cărucioare",
  pet_friendly: "🐾 Permis cu animale de companie",
  foto_permis: "📸 Fotografiatul / Filmatul este permis",
  plata_card: "💳 Plată cu cardul (POS)",
};


// Traduceri EN pentru listele de etichete (tipuri, facilități) — aceleași chei.
const I18N_MAPS_EN = new Map([
  [RESTAURANT_VENUE_TYPES, { restaurant: "🍽️ Restaurant", cafenea: "☕ Café / Tea house", pub: "🍺 Pub / Bar", bistro: "🥘 Bistro", fastfood: "🌭 Fast food / Street food", altul: "📍 Other" }],
  [RESTAURANT_DIETARY_OPTIONS, { vegetarian: "🥗 Vegetarian/vegan dishes", fara_gluten: "🌾 Gluten-free dishes", meniu_copii: "🧒 Kids' menu" }],
  [RESTAURANT_AMENITIES, { terasa: "☀️ Terrace / Summer garden", parcare: "🅿️ Own / nearby parking", loc_de_joaca: "🛝 Kids' play area", pet_friendly: "🐾 Pets allowed", wifi: "📶 Free Wi-Fi", evenimente: "🎉 Private events", acces_dizabilitati: "♿ Wheelchair accessible" }],
  [ATTRACTION_VENUE_TYPES, { castel: "🏰 Castle / Fortress / Palace", muzeu: "🖼️ Museum / Art gallery", parc_distractii: "🎢 Amusement / Adventure / Water park", rezervatie: "🏞️ Nature reserve / Cave / Waterfall", monument: "⛪ Historic monument / Place of worship", gradina: "🌳 Botanical garden / Zoo", altul: "📍 Other" }],
  [ATTRACTION_AMENITIES, { ghid_turistic: "🗣️ Tour guide available (audio or live)", ghid_strain: "🌍 Tours in foreign languages", magazin_suveniruri: "🛍️ Souvenir / local products shop", toalete: "🚻 Public toilets on site", cafenea_picnic: "☕ Rest area / Café / Picnic area", acces_scaune_rotile: "♿ Wheelchair / pushchair accessible", pet_friendly: "🐾 Pets allowed", foto_permis: "📸 Photography / filming allowed", plata_card: "💳 Card payment" }],
  [ACCOMMODATION_TYPE_LABELS, { pensiune: "🏡 Guesthouse", hotel_mic: "🏨 Small hotel", cabana: "🌲 Cabin", aframe: "🔺 A-Frame house", apartament: "🏢 Apartment for rent", camping: "⛺ Campsite", altceva: "📍 Other" }],
  [ACCOMMODATION_AMENITIES, { parcare: "🅿️ Parking", mic_dejun: "🍳 Breakfast included", wifi: "📶 Wi-Fi", animale: "🐾 Pets allowed", piscina: "🏊 Swimming pool", aer_conditionat: "❄️ Air conditioning", jacuzzi: "🛁 Jacuzzi / Hot tub", loc_de_joaca: "🛝 Playground", gratar: "🍖 Barbecue", bucatarie_utilata: "🥘 Fully equipped kitchen", masina_spalat: "🧼 Washing machine", espressor: "☕ Coffee machine", smart_tv: "📺 Smart TV / Netflix", receptie: "🛎️ Reception (24h or set hours)", restaurant_propriu: "🍽️ On-site restaurant / Bar", plata_card: "💳 Card payment on site", sala_conferinte: "💼 Conference / Event room", curatenie_zilnica: "🧹 Daily cleaning", sauna: "🧖 Sauna", masina_spalat_vase: "🍴 Dishwasher" , pescuit: "🎣 Fishing"}],
]);


const ATTRACTION_FILE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };


// Upload poze SAU meniu (PDF) — endpoint unificat, separat de cel de la
// cazare (aceeași sesiune de cont, dar blob-uri organizate separat).
const RESTAURANT_FILE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };


// Propuneri de locuri noi (magazin/obiectiv/plajă) — cerut explicit: dacă
// mai mulți utilizatori propun ACELAȘI loc, nu se creează rânduri
// multiple — se incrementează submission_count pe rândul deja existent
// (UPSERT, folosind indexul unic parțial pe slug, doar la status='pending'
// — o propunere respinsă anterior poate fi repropusă, nu rămâne blocată
// definitiv).
const SUBMISSION_TYPES = ["store", "attraction", "beach", "restaurant", "cafe", "other"];

const HOLIDAY_PUSH_TEXTS = {
  ro: { title: (l) => `🗓️ Mâine: ${l}`, closed: (c) => `Majoritatea magazinelor din ${c} sunt închise mâine. Cumpără azi ce îți trebuie.`, reduced: (c) => `Multe magazine din ${c} au program redus mâine. Verifică înainte să pleci.` },
  uk: { title: (l) => `🗓️ Tomorrow: ${l}`, closed: (c) => `Most stores in ${c} are closed tomorrow. Buy what you need today.`, reduced: (c) => `Many stores in ${c} have reduced hours tomorrow. Check before you go.` },
  de: { title: (l) => `🗓️ Morgen: ${l}`, closed: (c) => `Die meisten Geschäfte in ${c} sind morgen geschlossen. Kauf heute ein.`, reduced: (c) => `Viele Geschäfte in ${c} haben morgen verkürzte Öffnungszeiten.` },
  fr: { title: (l) => `🗓️ Demain : ${l}`, closed: (c) => `La plupart des magasins en ${c} sont fermés demain. Faites vos courses aujourd'hui.`, reduced: (c) => `De nombreux magasins en ${c} ont des horaires réduits demain.` },
  es: { title: (l) => `🗓️ Mañana: ${l}`, closed: (c) => `La mayoría de las tiendas en ${c} cierran mañana. Compra hoy lo que necesites.`, reduced: (c) => `Muchas tiendas en ${c} tienen horario reducido mañana.` },
  it: { title: (l) => `🗓️ Domani: ${l}`, closed: (c) => `La maggior parte dei negozi in ${c} è chiusa domani. Fai la spesa oggi.`, reduced: (c) => `Molti negozi in ${c} hanno orari ridotti domani.` },
};


// Variantă în engleză a paginii de mai sus — pentru domeniul internațional,
// cerut explicit ("pe înțelesul tuturor"), nu doar traducere brută a
// interfeței românești pentru vorbitorii de altă limbă.

// Etichete pentru pagina /business-badge, toate limbile cu traducere
// completă pe site (uk implicit + de/fr/es/it/pl/nl) — cerut explicit.
const BUSINESS_BADGE_LABELS = {
  ro: { homeCardTitle: "🏪 Ai un magazin sau un obiectiv turistic?", homeCardText: "Arată-le vizitatorilor, direct pe propriul tău site, dacă ești deschis chiar acum — verificat automat de noi, gratuit, gata în câteva minute.", homeCardBtn: "Vezi cum funcționează",
    breadcrumb: "Apari pe site + insignă \"Deschis Acum\"", h1: "📛 Vrei ca magazinul sau obiectivul tău să apară la noi?",
    intro: "Ai un magazin, obiectiv turistic sau o afacere și vrei ca vizitatorii tăi să vadă, live, dacă ești deschis chiar acum — atât la noi pe site, cât și pe propriul tău site? Sunt 3 pași simpli, în ordine. Fiecare pas depinde de cel dinainte.",
    step1Title: "Pasul 1 — Propune-ți magazinul sau obiectivul", step1Text: "Dacă nu ești deja listat la noi, primul pas e să ne spui despre afacerea ta. E gratuit și durează 1 minut.",
    step1Btn: "📍 Propune-ți afacerea acum", step1Hint: "Deja ești listat la noi? Sari direct la Pasul 2.",
    step2Title: "Pasul 2 — Așteaptă verificarea, apoi găsește-te pe site", step2Text: "Verificăm manual fiecare propunere — de obicei durează câteva zile. Nu trimitem notificare automată încă, așa că, după câteva zile, caută-ți afacerea direct pe site-ul nostru (bara de căutare, de pe pagina principală). Dacă îți găsești propria pagină, ai trecut de acest pas — continuă la Pasul 3.",
    step3Title: "Pasul 3 — Ia-ți codul insignei, pentru propriul tău site",
    step3Text1: "Odată ce te-ai găsit pe site-ul nostru, uită-te la adresa din browser. Exemplu: dacă pagina ta e <code>opening-hours-today.eu/obiectiv/castelul-bran</code>, slug-ul tău e <strong>castelul-bran</strong> (partea de după ultimul <code>/</code>).",
    step3Text2: "Înlocuiește <code>SLUG-UL-TAU</code> mai jos cu ce ai găsit, și <code>attraction</code> cu <code>store</code> dacă ești magazin, nu obiectiv turistic. Pune codul oriunde vrei să apară insigna, pe pagina ta.",
    copyBtn: "📋 Copiază codul", copiedText: "✓ Copiat!", demoTitle: "Cum arată insigna",
    doneTitle: "✅ Gata — asta e tot", doneText: "De fapt, ești deja vizibil la noi pe site din Pasul 2, din momentul în care am aprobat propunerea ta — nu mai trebuie să faci nimic pentru asta. Pasul 3 de mai sus adaugă în plus insigna live și pe propriul tău site. Odată ce ai pus codul, amândouă se actualizează automat, în timp real, fără să mai fie nevoie să revii sau să repeți ceva.",
    platformsTitle: "Nu ești sigur unde se pune un cod pe un site? Pe scurt, în funcție de ce folosești:",
    platformsHtml: `<ul class="badge-platforms-list">
      <li><strong>WordPress:</strong> adaugă un bloc „HTML personalizat" (Custom HTML) în pagină sau ca widget, și lipește codul acolo.</li>
      <li><strong>Wix:</strong> din meniul „Adaugă” alege „Embed” → „Cod personalizat” (Embed Code / HTML iframe) și lipește codul.</li>
      <li><strong>Squarespace:</strong> adaugă un „Code Block” în secțiunea unde vrei să apară insigna, și lipește codul.</li>
      <li><strong>Site simplu, în HTML:</strong> lipește codul direct în fișierul .html, exact unde vrei să apară insigna.</li>
      <li><strong>Nu te ocupi tu de site?</strong> trimite codul de mai sus persoanei care-ți administrează site-ul (webmaster, agenție etc.) și roag-o să-l pună unde vreți.</li>
    </ul>`,
    kofiTitle: "☕ Te-a ajutat tot procesul?", kofiText: "Programul de Azi e întreținut de o singură persoană, în timpul liber, și rămâne gratuit pentru toată lumea. Dacă ai ajuns până aici și insigna ta funcționează, o cafea ar însemna enorm — nu e obligatoriu, dar chiar contează.",
    kofiBtn: "☕ Cumpără-ne o cafea", footerText: "insigne live, verificate, gratuite pentru orice magazin sau obiectiv listat la noi.",
    metaTitle: "Insignă \"Deschis Acum\" pentru site-ul tău — Programul de Azi", metaDescription: "Pune gratuit, pe propriul site, o insignă live care arată dacă ești deschis chiar acum.",
    guidesLabel: "Ghiduri", itineraryLabel: "Itinerar", homeLabel: "Acasă" },
  uk: { homeCardTitle: "🏪 Do you run a store or attraction?", homeCardText: "Show visitors, right on your own website, whether you're open right now — checked automatically by us, free, ready in a few minutes.", homeCardBtn: "See how it works", breadcrumb: "Get listed + \"Open Now\" badge", h1: "📛 Want your store or attraction listed with us?", intro: "Do you run a store, tourist attraction, or other business and want your visitors to see, live, whether you're open right now — both here on our site and on your own website? Here are 3 simple steps, in order. Each step depends on the one before it.", step1Title: "Step 1 — Suggest your store or attraction", step1Text: "If you're not already listed with us, the first step is to tell us about your business. It's free and takes 1 minute.", step1Btn: "📍 Suggest your business now", step1Hint: "Already listed with us? Skip straight to Step 2.", step2Title: "Step 2 — Wait for review, then find yourself on the site", step2Text: "We check every submission by hand — it usually takes a few days. We don't send an automatic notification yet, so after a few days, search for your business directly on our site (the search bar on the homepage). If you find your own page, you've cleared this step — move on to Step 3.", step3Title: "Step 3 — Get your badge code, for your own website", step3Text1: "Once you've found yourself on our site, look at the address bar. Example: if your page is <code>opening-hours-today.eu/de/obiectiv/castelul-bran</code>, your slug is <strong>castelul-bran</strong> (the part after the last <code>/</code>).", step3Text2: "Replace <code>YOUR-SLUG</code> below with what you found, and <code>attraction</code> with <code>store</code> if you're a shop, not a tourist attraction. Paste the code anywhere you'd like the badge to appear on your page.", copyBtn: "📋 Copy the code", copiedText: "✓ Copied!", demoTitle: "What the badge looks like", doneTitle: "✅ Done — that's it", doneText: "Actually, you're already visible on our site from Step 2, from the moment we approved your submission — nothing more needed there. Step 3 above just adds the live badge on your own website too. Once you've pasted the code, both update automatically, in real time, with nothing further to do.",
    platformsTitle: "Not sure where to paste code on a website? Quick pointers, depending on what you use:",
    platformsHtml: `<ul class="badge-platforms-list">
      <li><strong>WordPress:</strong> add a "Custom HTML" block to the page, or as a widget, and paste the code there.</li>
      <li><strong>Wix:</strong> from the "Add" menu choose "Embed" → "Custom Code" (Embed Code / HTML iframe) and paste the code.</li>
      <li><strong>Squarespace:</strong> add a "Code Block" to the section where you want the badge, and paste the code.</li>
      <li><strong>Plain HTML site:</strong> paste the code directly into the .html file, exactly where you want the badge to appear.</li>
      <li><strong>Don't manage the site yourself?</strong> send the code above to whoever maintains your website (webmaster, agency, etc.) and ask them to place it wherever you'd like.</li>
    </ul>`, kofiTitle: "☕ Did the whole process help you?", kofiText: "Opening Hours Today is maintained by one person, in their spare time, and stays free for everyone. If you made it this far and your badge is working, a coffee would mean a lot — not required, but it genuinely helps.", kofiBtn: "☕ Buy us a coffee", footerText: "live, verified badges, free for any store or attraction listed on our site.", metaTitle: "\"Open Now\" badge for your website — Opening Hours Today", metaDescription: "Add a free, live badge to your own website showing whether you're open right now.", guidesLabel: "Guides", itineraryLabel: "Itinerary", homeLabel: "Home" },
  de: { homeCardTitle: "🏪 Betreibst du ein Geschäft oder eine Attraktion?", homeCardText: "Zeige Besuchern, direkt auf deiner eigenen Website, ob du gerade geöffnet hast — automatisch von uns geprüft, kostenlos, in wenigen Minuten startklar.", homeCardBtn: "So funktioniert's", breadcrumb: "Eintrag + \"Jetzt geöffnet\"-Abzeichen", h1: "📛 Möchtest du mit deinem Geschäft oder deiner Attraktion gelistet werden?", intro: "Betreibst du ein Geschäft, eine Touristenattraktion oder ein anderes Unternehmen und möchtest, dass deine Besucher live sehen, ob du gerade geöffnet hast — sowohl hier bei uns als auch auf deiner eigenen Website? Hier sind 3 einfache Schritte, der Reihe nach. Jeder Schritt hängt vom vorherigen ab.", step1Title: "Schritt 1 — Schlage dein Geschäft oder deine Attraktion vor", step1Text: "Falls du noch nicht bei uns gelistet bist, ist der erste Schritt, uns von deinem Unternehmen zu erzählen. Es ist kostenlos und dauert 1 Minute.", step1Btn: "📍 Jetzt dein Unternehmen vorschlagen", step1Hint: "Schon bei uns gelistet? Springe direkt zu Schritt 2.", step2Title: "Schritt 2 — Warte auf die Prüfung, dann finde dich auf der Seite", step2Text: "Wir prüfen jede Einreichung manuell — das dauert normalerweise ein paar Tage. Wir senden noch keine automatische Benachrichtigung, also suche nach ein paar Tagen direkt auf unserer Seite nach deinem Unternehmen (Suchleiste auf der Startseite). Wenn du deine eigene Seite findest, hast du diesen Schritt geschafft — weiter zu Schritt 3.", step3Title: "Schritt 3 — Hole dir deinen Abzeichen-Code, für deine eigene Website", step3Text1: "Sobald du dich auf unserer Seite gefunden hast, schau in die Adressleiste. Beispiel: Wenn deine Seite <code>opening-hours-today.eu/de/obiectiv/castelul-bran</code> ist, ist dein Slug <strong>castelul-bran</strong> (der Teil nach dem letzten <code>/</code>).", step3Text2: "Ersetze <code>YOUR-SLUG</code> unten mit dem, was du gefunden hast, und <code>attraction</code> mit <code>store</code>, wenn du ein Geschäft bist, keine Touristenattraktion. Füge den Code ein, wo immer das Abzeichen auf deiner Seite erscheinen soll.", copyBtn: "📋 Code kopieren", copiedText: "✓ Kopiert!", demoTitle: "So sieht das Abzeichen aus", kofiTitle: "☕ Hat dir der ganze Prozess geholfen?", kofiText: "Opening Hours Today wird von einer Person, in ihrer Freizeit, betrieben und bleibt für alle kostenlos. Wenn du bis hierher gekommen bist und dein Abzeichen funktioniert, würde ein Kaffee viel bedeuten — nicht erforderlich, aber es hilft wirklich.", kofiBtn: "☕ Kauf uns einen Kaffee", footerText: "live, verifizierte Abzeichen, kostenlos für jedes bei uns gelistete Geschäft oder jede Attraktion.", metaTitle: "\"Jetzt geöffnet\"-Abzeichen für deine Website — Opening Hours Today", metaDescription: "Füge deiner eigenen Website ein kostenloses Live-Abzeichen hinzu, das zeigt, ob du gerade geöffnet hast.", guidesLabel: "Ratgeber", itineraryLabel: "Reiseplan", homeLabel: "Start" },
  fr: { homeCardTitle: "🏪 Gérez-vous un commerce ou un site touristique ?", homeCardText: "Montrez à vos visiteurs, directement sur votre propre site, si vous êtes ouvert maintenant — vérifié automatiquement par nous, gratuit, prêt en quelques minutes.", homeCardBtn: "Voir comment ça marche", breadcrumb: "Être référencé + badge \"Ouvert maintenant\"", h1: "📛 Vous voulez que votre commerce ou site touristique soit référencé chez nous ?", intro: "Vous gérez un commerce, un site touristique ou une autre entreprise et souhaitez que vos visiteurs voient, en direct, si vous êtes ouvert en ce moment — aussi bien chez nous que sur votre propre site ? Voici 3 étapes simples, dans l'ordre. Chaque étape dépend de la précédente.", step1Title: "Étape 1 — Proposez votre commerce ou site touristique", step1Text: "Si vous n'êtes pas encore référencé chez nous, la première étape consiste à nous parler de votre entreprise. C'est gratuit et ça prend 1 minute.", step1Btn: "📍 Proposer mon entreprise maintenant", step1Hint: "Déjà référencé chez nous ? Passez directement à l'étape 2.", step2Title: "Étape 2 — Attendez la vérification, puis retrouvez-vous sur le site", step2Text: "Nous vérifions chaque proposition manuellement — cela prend généralement quelques jours. Nous n'envoyons pas encore de notification automatique, alors après quelques jours, cherchez votre entreprise directement sur notre site (barre de recherche sur la page d'accueil). Si vous trouvez votre propre page, vous avez franchi cette étape — passez à l'étape 3.", step3Title: "Étape 3 — Récupérez le code de votre badge, pour votre propre site", step3Text1: "Une fois que vous vous êtes trouvé sur notre site, regardez la barre d'adresse. Exemple : si votre page est <code>opening-hours-today.eu/de/obiectiv/castelul-bran</code>, votre slug est <strong>castelul-bran</strong> (la partie après le dernier <code>/</code>).", step3Text2: "Remplacez <code>YOUR-SLUG</code> ci-dessous par ce que vous avez trouvé, et <code>attraction</code> par <code>store</code> si vous êtes un commerce, pas un site touristique. Collez le code où vous voulez que le badge apparaisse sur votre page.", copyBtn: "📋 Copier le code", copiedText: "✓ Copié !", demoTitle: "À quoi ressemble le badge", kofiTitle: "☕ Tout ce processus vous a-t-il aidé ?", kofiText: "Opening Hours Today est maintenu par une seule personne, sur son temps libre, et reste gratuit pour tout le monde. Si vous êtes arrivé jusqu'ici et que votre badge fonctionne, un café signifierait beaucoup — ce n'est pas obligatoire, mais ça aide vraiment.", kofiBtn: "☕ Offrez-nous un café", footerText: "badges en direct, vérifiés, gratuits pour tout commerce ou site touristique référencé chez nous.", metaTitle: "Badge \"Ouvert maintenant\" pour votre site — Opening Hours Today", metaDescription: "Ajoutez un badge gratuit et en direct à votre propre site, indiquant si vous êtes ouvert en ce moment.", guidesLabel: "Guides", itineraryLabel: "Itinéraire", homeLabel: "Accueil" },
  es: { homeCardTitle: "🏪 ¿Tienes una tienda o atracción?", homeCardText: "Muestra a tus visitantes, directamente en tu propio sitio web, si estás abierto ahora mismo — verificado automáticamente por nosotros, gratis, listo en pocos minutos.", homeCardBtn: "Ver cómo funciona", breadcrumb: "Aparecer en el sitio + insignia \"Abierto ahora\"", h1: "📛 ¿Quieres que tu tienda o atracción aparezca en nuestro sitio?", intro: "¿Tienes una tienda, atracción turística u otro negocio y quieres que tus visitantes vean, en vivo, si estás abierto ahora mismo — tanto aquí en nuestro sitio como en tu propia web? Aquí tienes 3 pasos simples, en orden. Cada paso depende del anterior.", step1Title: "Paso 1 — Sugiere tu tienda o atracción", step1Text: "Si aún no apareces en nuestro sitio, el primer paso es contarnos sobre tu negocio. Es gratis y tarda 1 minuto.", step1Btn: "📍 Sugerir mi negocio ahora", step1Hint: "¿Ya apareces en nuestro sitio? Ve directamente al Paso 2.", step2Title: "Paso 2 — Espera la revisión, luego búscate en el sitio", step2Text: "Revisamos cada propuesta manualmente — normalmente tarda unos días. Todavía no enviamos notificación automática, así que después de unos días, busca tu negocio directamente en nuestro sitio (barra de búsqueda en la página principal). Si encuentras tu propia página, has superado este paso — continúa al Paso 3.", step3Title: "Paso 3 — Obtén el código de tu insignia, para tu propia web", step3Text1: "Una vez que te hayas encontrado en nuestro sitio, mira la barra de direcciones. Ejemplo: si tu página es <code>opening-hours-today.eu/de/obiectiv/castelul-bran</code>, tu slug es <strong>castelul-bran</strong> (la parte después de la última <code>/</code>).", step3Text2: "Reemplaza <code>YOUR-SLUG</code> abajo con lo que encontraste, y <code>attraction</code> con <code>store</code> si eres una tienda, no una atracción turística. Pega el código donde quieras que aparezca la insignia en tu página.", copyBtn: "📋 Copiar el código", copiedText: "✓ ¡Copiado!", demoTitle: "Así se ve la insignia", kofiTitle: "☕ ¿Te ayudó todo este proceso?", kofiText: "Opening Hours Today lo mantiene una sola persona, en su tiempo libre, y sigue siendo gratis para todos. Si llegaste hasta aquí y tu insignia funciona, un café significaría mucho — no es obligatorio, pero realmente ayuda.", kofiBtn: "☕ Invítanos un café", footerText: "insignias en vivo, verificadas, gratis para cualquier tienda o atracción listada en nuestro sitio.", metaTitle: "Insignia \"Abierto ahora\" para tu web — Opening Hours Today", metaDescription: "Añade una insignia gratuita y en vivo a tu propia web que muestre si estás abierto ahora mismo.", guidesLabel: "Guías", itineraryLabel: "Itinerario", homeLabel: "Inicio" },
  it: { homeCardTitle: "🏪 Gestisci un negozio o un'attrazione?", homeCardText: "Mostra ai visitatori, direttamente sul tuo sito, se sei aperto in questo momento — verificato automaticamente da noi, gratis, pronto in pochi minuti.", homeCardBtn: "Scopri come funziona", breadcrumb: "Essere elencati + badge \"Aperto ora\"", h1: "📛 Vuoi che il tuo negozio o la tua attrazione siano elencati da noi?", intro: "Gestisci un negozio, un'attrazione turistica o un'altra attività e vuoi che i tuoi visitatori vedano, in tempo reale, se sei aperto in questo momento — sia qui sul nostro sito che sul tuo sito? Ecco 3 semplici passaggi, in ordine. Ogni passaggio dipende dal precedente.", step1Title: "Passo 1 — Suggerisci il tuo negozio o la tua attrazione", step1Text: "Se non sei ancora elencato da noi, il primo passo è raccontarci della tua attività. È gratis e richiede 1 minuto.", step1Btn: "📍 Suggerisci la tua attività ora", step1Hint: "Sei già elencato da noi? Passa direttamente al Passo 2.", step2Title: "Passo 2 — Attendi la verifica, poi trovati sul sito", step2Text: "Controlliamo ogni proposta manualmente — di solito richiede qualche giorno. Non inviamo ancora una notifica automatica, quindi dopo qualche giorno, cerca la tua attività direttamente sul nostro sito (barra di ricerca nella pagina principale). Se trovi la tua pagina, hai superato questo passaggio — vai al Passo 3.", step3Title: "Passo 3 — Ottieni il codice del tuo badge, per il tuo sito", step3Text1: "Una volta trovato te stesso sul nostro sito, guarda la barra degli indirizzi. Esempio: se la tua pagina è <code>opening-hours-today.eu/de/obiectiv/castelul-bran</code>, il tuo slug è <strong>castelul-bran</strong> (la parte dopo l'ultimo <code>/</code>).", step3Text2: "Sostituisci <code>YOUR-SLUG</code> qui sotto con quello che hai trovato, e <code>attraction</code> con <code>store</code> se sei un negozio, non un'attrazione turistica. Incolla il codice dove vuoi che appaia il badge sulla tua pagina.", copyBtn: "📋 Copia il codice", copiedText: "✓ Copiato!", demoTitle: "Come appare il badge", kofiTitle: "☕ Tutto questo processo ti ha aiutato?", kofiText: "Opening Hours Today è gestito da una sola persona, nel tempo libero, e rimane gratuito per tutti. Se sei arrivato fin qui e il tuo badge funziona, un caffè significherebbe molto — non è obbligatorio, ma aiuta davvero.", kofiBtn: "☕ Offrici un caffè", footerText: "badge live, verificati, gratuiti per qualsiasi negozio o attrazione elencati da noi.", metaTitle: "Badge \"Aperto ora\" per il tuo sito — Opening Hours Today", metaDescription: "Aggiungi un badge gratuito e live al tuo sito che mostra se sei aperto in questo momento.", guidesLabel: "Guide", itineraryLabel: "Itinerario", homeLabel: "Home" },
  pl: { homeCardTitle: "🏪 Prowadzisz sklep lub atrakcję?", homeCardText: "Pokaż odwiedzającym, bezpośrednio na własnej stronie, czy jesteś teraz otwarty — sprawdzane automatycznie przez nas, bezpłatnie, gotowe w kilka minut.", homeCardBtn: "Zobacz, jak to działa", breadcrumb: "Dodaj się do serwisu + odznaka \"Otwarte teraz\"", h1: "📛 Chcesz, aby Twój sklep lub atrakcja pojawiły się u nas?", intro: "Prowadzisz sklep, atrakcję turystyczną lub inną firmę i chcesz, aby Twoi odwiedzający widzieli na żywo, czy jesteś teraz otwarty — zarówno u nas, jak i na Twojej własnej stronie? Oto 3 proste kroki, po kolei. Każdy krok zależy od poprzedniego.", step1Title: "Krok 1 — Zaproponuj swój sklep lub atrakcję", step1Text: "Jeśli nie jesteś jeszcze u nas wpisany, pierwszym krokiem jest opowiedzenie nam o swojej firmie. Jest to bezpłatne i zajmuje 1 minutę.", step1Btn: "📍 Zaproponuj swoją firmę teraz", step1Hint: "Jesteś już u nas wpisany? Przejdź od razu do Kroku 2.", step2Title: "Krok 2 — Poczekaj na weryfikację, potem znajdź się na stronie", step2Text: "Sprawdzamy każde zgłoszenie ręcznie — zwykle trwa to kilka dni. Nie wysyłamy jeszcze automatycznego powiadomienia, więc po kilku dniach wyszukaj swoją firmę bezpośrednio na naszej stronie (pasek wyszukiwania na stronie głównej). Jeśli znajdziesz swoją stronę, przeszedłeś ten krok — przejdź do Kroku 3.", step3Title: "Krok 3 — Pobierz kod swojej odznaki, na swoją własną stronę", step3Text1: "Gdy już się znajdziesz na naszej stronie, spójrz na pasek adresu. Przykład: jeśli Twoja strona to <code>opening-hours-today.eu/de/obiectiv/castelul-bran</code>, Twój slug to <strong>castelul-bran</strong> (część po ostatnim <code>/</code>).", step3Text2: "Zastąp <code>YOUR-SLUG</code> poniżej tym, co znalazłeś, oraz <code>attraction</code> na <code>store</code>, jeśli jesteś sklepem, a nie atrakcją turystyczną. Wklej kod tam, gdzie chcesz, aby odznaka pojawiła się na Twojej stronie.", copyBtn: "📋 Kopiuj kod", copiedText: "✓ Skopiowano!", demoTitle: "Jak wygląda odznaka", kofiTitle: "☕ Czy cały ten proces Ci pomógł?", kofiText: "Opening Hours Today jest utrzymywane przez jedną osobę, w wolnym czasie, i pozostaje bezpłatne dla wszystkich. Jeśli dotarłeś aż tutaj i Twoja odznaka działa, kawa znaczyłaby bardzo dużo — nie jest to wymagane, ale naprawdę pomaga.", kofiBtn: "☕ Postaw nam kawę", footerText: "odznaki na żywo, zweryfikowane, bezpłatne dla każdego sklepu lub atrakcji wpisanych u nas.", metaTitle: "Odznaka \"Otwarte teraz\" na Twoją stronę — Opening Hours Today", metaDescription: "Dodaj bezpłatną, żywą odznakę do swojej strony pokazującą, czy jesteś teraz otwarty.", guidesLabel: "Poradniki", itineraryLabel: "Plan podróży", homeLabel: "Strona główna" },
  nl: { homeCardTitle: "🏪 Heb je een winkel of attractie?", homeCardText: "Laat bezoekers, rechtstreeks op je eigen website, zien of je nu open bent — automatisch door ons gecontroleerd, gratis, in een paar minuten klaar.", homeCardBtn: "Bekijk hoe het werkt", breadcrumb: "Vermeld worden + \"Nu open\"-badge", h1: "📛 Wil je dat jouw winkel of attractie bij ons vermeld wordt?", intro: "Heb je een winkel, toeristische attractie of ander bedrijf en wil je dat je bezoekers live zien of je nu open bent — zowel hier op onze site als op je eigen website? Hier zijn 3 eenvoudige stappen, in volgorde. Elke stap hangt af van de vorige.", step1Title: "Stap 1 — Stel je winkel of attractie voor", step1Text: "Als je nog niet bij ons vermeld staat, is de eerste stap ons over je bedrijf te vertellen. Het is gratis en duurt 1 minuut.", step1Btn: "📍 Stel je bedrijf nu voor", step1Hint: "Al bij ons vermeld? Ga direct naar Stap 2.", step2Title: "Stap 2 — Wacht op beoordeling, vind jezelf dan op de site", step2Text: "We controleren elke inzending handmatig — dit duurt meestal een paar dagen. We sturen nog geen automatische melding, dus zoek na een paar dagen je bedrijf rechtstreeks op onze site (zoekbalk op de startpagina). Als je je eigen pagina vindt, heb je deze stap voltooid — ga verder naar Stap 3.", step3Title: "Stap 3 — Haal je badge-code op, voor je eigen website", step3Text1: "Zodra je jezelf op onze site hebt gevonden, kijk dan naar de adresbalk. Voorbeeld: als je pagina <code>opening-hours-today.eu/de/obiectiv/castelul-bran</code> is, is je slug <strong>castelul-bran</strong> (het deel na de laatste <code>/</code>).", step3Text2: "Vervang <code>YOUR-SLUG</code> hieronder door wat je hebt gevonden, en <code>attraction</code> door <code>store</code> als je een winkel bent, geen toeristische attractie. Plak de code waar je de badge op je pagina wilt laten verschijnen.", copyBtn: "📋 Kopieer de code", copiedText: "✓ Gekopieerd!", demoTitle: "Zo ziet de badge eruit", kofiTitle: "☕ Heeft dit hele proces je geholpen?", kofiText: "Opening Hours Today wordt door één persoon onderhouden, in hun vrije tijd, en blijft gratis voor iedereen. Als je zo ver bent gekomen en je badge werkt, zou een kopje koffie veel betekenen — niet verplicht, maar het helpt echt.", kofiBtn: "☕ Trakteer ons op koffie", footerText: "live, geverifieerde badges, gratis voor elke winkel of attractie die bij ons vermeld staat.", metaTitle: "\"Nu open\"-badge voor je website — Opening Hours Today", metaDescription: "Voeg een gratis, live badge toe aan je eigen website die laat zien of je nu open bent.", guidesLabel: "Gidsen", itineraryLabel: "Reisplan", homeLabel: "Home" },
};


// ------------------------------------------------------------------
// SEO pentru paginile publice de cazare / restaurant / obiectiv: titlu cu
// cuvinte-cheie relevante (tip + oraș, ceea ce caută efectiv turiștii),
// meta descriere, link canonic, Open Graph și date structurate (JSON-LD) —
// ajută Google să afișeze rezultate bogate (rating, preț, adresă) și separă
// clar paginile una de alta (fiecare avea doar un <title>, fără nimic altceva).
// ------------------------------------------------------------------
const SEO_TYPE_WORDS = {
  cazare: { ro: "cazare", en: "stay" }, pensiune: { ro: "pensiune", en: "guesthouse" }, hotel_mic: { ro: "hotel", en: "hotel" },
  cabana: { ro: "cabană", en: "cabin" }, apartament: { ro: "apartament de închiriat", en: "apartment" }, camping: { ro: "camping", en: "campsite" },
  restaurant: { ro: "restaurant", en: "restaurant" }, cafenea: { ro: "cafenea", en: "café" }, pub: { ro: "pub", en: "pub" }, bistro: { ro: "bistro", en: "bistro" },
  fastfood: { ro: "fast-food", en: "fast food" }, obiectiv: { ro: "obiectiv turistic", en: "attraction" },
};


// ------------------------------------------------------------------
// Generare descriere cu AI — buton „🪄 Generează descriere” din bara de
// formatare. Reguli STRICTE, cerute explicit: nu inventă detalii (folosește
// DOAR ce a completat proprietarul deja în formular), evită clișeele
// obosite, text structurat (intro scurtă + secțiuni + apel la acțiune),
// încadrat în caracterele rămase disponibile. O singură generare gratuită
// per cont de proprietar — cerut explicit, ca să nu se abuzeze de costul
// per generare de la OpenAI (vezi și discuția despre Ko-fi, în afara
// codului: pornim simplu, cu limita fixă, nu cu deblocare prin donație).
// ------------------------------------------------------------------
const DESC_AI_CLICHEE = [
  "oază de liniște", "peisaj de poveste", "condiții de lux", "o experiență de neuitat",
  "vă așteptăm cu brațele deschise", "perla ascunsă", "un colț de rai",
];


// ------------------------------------------------------------------
// Pagină intermediară pentru linkurile de Facebook/Instagram/TikTok, de pe
// paginile de cazare/restaurant. Pe unele telefoane (mai ales aplicații
// instalate pe ecranul principal), un link direct spre alt site nu
// deschide o filă nouă — chiar înlocuiește pagina curentă, iar vizitatorul
// rămânea „blocat” pe Facebook, fără drum înapoi. Aici rămânem pe domeniul
// nostru, cu un link clar înapoi spre pensiune, indiferent ce face telefonul.
// Doar cele 3 rețele cunoscute sunt acceptate — altfel n-am mai avea o
// simplă pagină de tranziție, ci un „open redirect” către orice adresă.
// ------------------------------------------------------------------
const PLECI_ALLOWED_HOSTS = [/(^|\.)facebook\.com$/i, /(^|\.)instagram\.com$/i, /(^|\.)tiktok\.com$/i];

const PLECI_NETWORK_LABELS = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok" };


// Tipuri de paturi, pentru secțiunea opțională „Structură unități”
// (cazări cu mai multe tipuri de unități în aceeași locație — case, vile,
// cabane separate, fiecare cu propriile paturi).
const BED_TYPES = {
  king: { ro: "Pat dublu extra-large (King size)", en: "Extra-large double bed (King size)", icon: "🛏️" },
  dublu: { ro: "Pat dublu standard", en: "Standard double bed", icon: "🛏️" },
  single: { ro: "Pat de o persoană (Single)", en: "Single bed", icon: "🛏️" },
  canapea: { ro: "Canapea extensibilă", en: "Sofa bed", icon: "🛋️" },
  crib: { ro: "Pătuț pentru copii (bebeluși)", en: "Baby crib", icon: "🍼" },
  supraetajat: { ro: "Pat supraetajat", en: "Bunk bed", icon: "🛏️" },
  saltea: { ro: "Saltea gonflabilă", en: "Air mattress", icon: "🛌" },
};

const BATH_AMENITIES = {
  dus: { ro: "Duș", en: "Shower" },
  cada: { ro: "Cadă", en: "Bathtub" },
  jacuzzi: { ro: "Jacuzzi / cadă cu hidromasaj", en: "Jacuzzi / hot tub" },
  bideu: { ro: "Bideu", en: "Bidet" },
  toaletrii: { ro: "Articole de toaletă gratuite", en: "Free toiletries" },
  uscator: { ro: "Uscător de păr", en: "Hair dryer" },
};

const EXTERIOR_ACCESS = {
  gradina_privata: { ro: "Grădină / curte privată (exclusivă pentru acești oaspeți)", en: "Private garden / yard (exclusive to these guests)" },
  gradina_comuna: { ro: "Grădină la comun (împărțită cu proprietarul sau alte unități)", en: "Shared garden (with the owner or other units)" },
  terasa: { ro: "Terasă", en: "Terrace" },
  balcon: { ro: "Balcon", en: "Balcony" },
};

const EXTERIOR_AMENITIES = {
  mobilier: { ro: "Mobilier de grădină / foișor / zonă de masă în aer liber", en: "Garden furniture / gazebo / outdoor dining area" },
  sezlonguri: { ro: "Șezlonguri / hamac", en: "Sun loungers / hammock" },
  loc_joaca: { ro: "Loc de joacă amenajat pentru copii", en: "Children's playground" },
  piscina_privata: { ro: "Piscină exterioară privată", en: "Private outdoor pool" },
  piscina_comuna: { ro: "Piscină exterioară la comun", en: "Shared outdoor pool" },
};


// ------------------------------------------------------------------
// Iconițe outline, simple, desenate direct ca SVG (stil Tabler/Feather,
// linii subțiri, fără emoji colorate) — nu depindem de niciun CDN extern,
// deci nu se pot "rupe" din motive de rețea sau securitate.
// ------------------------------------------------------------------
const PA_ICON_PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  size: '<path d="M4 7v10M20 7v10M4 12h16"/><path d="m8 9-4 3 4 3M16 9l4 3-4 3"/>',
  kitchen: '<path d="M5 4v16M19 4v7a3 3 0 0 1-3 3v6M16 4v6M19 4v6"/>',
  bath: '<path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Z"/><path d="M4 12V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2"/><path d="M7 19v2M15 19v2"/>',
  wifi: '<path d="M5 9a11 11 0 0 1 14 0"/><path d="M8 12.5a7 7 0 0 1 8 0"/><path d="M11 16a3 3 0 0 1 2 0"/><circle cx="12" cy="19.2" r=".3" fill="currentColor" stroke="none"/>',
  parking: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 16V7h3.5a2.75 2.75 0 1 1 0 5.5H9"/>',
  pool: '<path d="M3 17q2-2 4 0t4 0 4 0 4 0"/><path d="M3 21q2-2 4 0t4 0 4 0 4 0"/><path d="M7 13V5a2 2 0 0 1 4 0v8M13 13V7a2 2 0 0 1 4 0v6"/>',
  snow: '<path d="M12 2v20M5 6l14 12M19 6 5 18"/><path d="M12 6 9.5 4M12 6l2.5-2M12 18l-2.5 2M12 18l2.5 2"/>',
  paw: '<circle cx="7" cy="9" r="1.7"/><circle cx="12" cy="7" r="1.7"/><circle cx="17" cy="9" r="1.7"/><path d="M8 15c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5-1.8 3.5-4 3.5-4-1.5-4-3.5Z"/>',
  grill: '<path d="M4 12h16l-1.5 6a2 2 0 0 1-2 1.6H7.5a2 2 0 0 1-2-1.6L4 12Z"/><path d="M7 12c0-4 1-6 1-8M12 12c0-4 .5-6 .5-8M17 12c0-4-1-6-1-8"/>',
  washer: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="5"/><circle cx="12" cy="13" r="2"/><circle cx="7" cy="6" r=".8" fill="currentColor" stroke="none"/>',
  coffee: '<path d="M5 9h12v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3c0 1-1 1-1 2M12 3c0 1-1 1-1 2"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M9 20h6M12 17v3"/>',
  bell: '<path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  fork: '<path d="M7 3v7a2 2 0 0 0 4 0V3M9 10v11M17 3c-1.5 0-2 2-2 4.5S16 11 17 11s2-2 2-3.5S18.5 3 17 3Zm0 8v10"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
  clean: '<path d="M12 2v12M12 14l6 6M12 14l-6 6"/><circle cx="12" cy="14" r="2"/>',
  sauna: '<path d="M4 21V11l8-7 8 7v10"/><path d="M9 21v-6a3 3 0 0 1 6 0v6"/>',
  bed: '<path d="M3 19v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 19v2M21 19v2M3 14h18"/><rect x="5" y="7" width="6" height="4" rx="1"/>',
  sofa: '<path d="M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/><path d="M3 12h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4Z"/><path d="M5 18v2M19 18v2"/>',
  crib: '<path d="M4 20V9l8-5 8 5v11"/><path d="M4 13h16M8 20v-5M16 20v-5"/>',
  bottle: '<path d="M10 2h4v3.5l1.5 2V20a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 8.5 20V7.5L10 5.5V2Z"/><path d="M8.5 11h7"/>',
  wind: '<path d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5"/><path d="M3 16h15a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 12h7"/>',
  tree: '<path d="M12 2 6 11h3l-4 6h5v5h4v-5h5l-4-6h3L12 2Z"/>',
  door: '<rect x="5" y="2" width="14" height="20" rx="1"/><circle cx="15" cy="12" r=".8" fill="currentColor" stroke="none"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.3"/><path d="M15 14c2.8.3 5 2.7 5 6"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
  car: '<path d="M5 17h14v-4l-2-4H7l-2 4v4Z"/><path d="M5 17v2M19 17v2"/><circle cx="8" cy="17" r="1.3"/><circle cx="16" cy="17" r="1.3"/>',
  bus: '<rect x="4" y="5" width="16" height="12" rx="2"/><path d="M4 12h16"/><circle cx="8" cy="19" r="1.3"/><circle cx="16" cy="19" r="1.3"/>',
  hike: '<circle cx="15" cy="5" r="1.7"/><path d="M11 21l2-6-2-3 3-3 2 3 3-1M9 21l2-5"/>',
  ticket: '<path d="M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V9Z"/><path d="M10 7v10" stroke-dasharray="2 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.5-7.97A5 5 0 0 1 16 9a3.5 3.5 0 0 1 1 6.9"/><path d="M8 18h9"/>',
  phone: '<path d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  envelope: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 6 8 7 8-7"/>',
  document: '<path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  landmark: '<path d="M4 21h16M5 21V10M19 21V10M3 10l9-6 9 6M7 10v7M11 10v7M13 10v7M17 10v7"/>',
  store: '<path d="M4 9 5 4h14l1 5"/><path d="M4 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/><path d="M9 20v-5h6v5"/>',
  plane: '<path d="M10.5 21 9 16l-5-1.5v-2L9 11V6a2 2 0 0 1 4 0v5l5 1.5v2L13 16l-1.5 5Z"/>',
  map: '<path d="M9 3 4 5v16l5-2 6 2 5-2V3l-5 2-6-2Z"/><path d="M9 3v16M15 5v16"/>',
  badge: '<circle cx="12" cy="9" r="5"/><path d="M8.5 13.5 6 21l6-3 6 3-2.5-7.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".3" fill="currentColor"/>',
  chat: '<path d="M4 5h16v11H9l-5 4V5Z"/>',
  logout: '<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4"/><path d="M15 16l4-4-4-4"/><path d="M19 12H9"/>',
  trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/>',
  pencil: '<path d="M4 20l1-4L16 5l3 3-11 11-4 1Z"/><path d="M14 7l3 3"/>',
  star: '<path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.6 6.8 19.4l1-5.9L3.5 9.4l5.9-.8L12 3.2Z"/>',
  align: '<path d="M4 7h16M7 12h10M4 17h16"/>',
  fridge: '<path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M5 11h14M9 7v1.5M9 14v3"/>',
  tent: '<path d="M2 20L12 5l10 15H2Z"/><path d="M12 5v15M8.5 20L12 13l3.5 7"/>',
  sewer: '<path d="M12 3v10M8 9l4 4 4-4M5 17h14M7 17v3h10v-3"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6l1-7Z"/>',
  drop: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  wand: '<path d="M5 19L15 9"/><path d="M13 7l4 4"/><path d="M18 3v3M16.5 4.5h3M6 4v2M5 5h2"/>',
  facebook: '<path d="M14 8h2V5h-2.5A3.5 3.5 0 0 0 10 8.5V11H8v3h2v6h3v-6h2.2l.5-3H13V8.8c0-.5.3-.8 1-.8Z"/>',
  instagram: '<path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z"/><circle cx="12" cy="12" r="3.8"/><path d="M17.2 6.8h.01"/>',
  tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.3 2.4 1.9 4 4.5 4.2"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  family: '<circle cx="8.5" cy="6" r="3"/><circle cx="17" cy="8" r="2.3"/><path d="M3 21v-2a5 5 0 0 1 5-5h1a5 5 0 0 1 5 5v2"/><path d="M15.5 21v-1.5a3.5 3.5 0 0 1 3.5-3.5h.2a3.3 3.3 0 0 1 3.3 3.3V21"/>',
  age18: '<circle cx="12" cy="12" r="9"/><text x="12" y="15.2" text-anchor="middle" font-size="8.6" font-weight="800" fill="currentColor" stroke="none">18+</text>',
  armchair: '<path d="M7 11V8a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v3"/><path d="M5 12a2 2 0 0 1 2 2v2h10v-2a2 2 0 1 1 4 0v3H3v-3a2 2 0 0 1 2-2Z"/><path d="M7 19v2M17 19v2"/>',
  table: '<path d="M4 9h16M7 9v10M17 9v10M5 13h14"/>',
  stream: '<path d="M4 5h16v11H4z"/><path d="M10 8.5l5 2.5-5 2.5V8.5Z"/><path d="M8 20h8"/>',
  speaker: '<path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M12 7.5h.01"/><circle cx="12" cy="14" r="3"/>',
  dice: '<path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01"/>',
  desk: '<path d="M3 18h18M5 18v2M19 18v2"/><path d="M6 15V8a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7H6Z"/><path d="M2 15h20"/>',
  radiator: '<path d="M6 5v14M10 5v14M14 5v14M18 5v14M4 5h16M4 19h16"/>',
  weather: '<path d="M6 19h11a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.4-1.2A4.2 4.2 0 0 0 6 19Z"/><path d="M17 4.5l1.2 1.2M20.5 9H22M13 3v1.5"/>',
  fish: '<path d="M3 12c3-5 8-6 13-3l5-3v12l-5-3c-5 3-10 2-13-3Z"/><circle cx="8" cy="11" r=".8" fill="currentColor"/>',
  fire: '<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9Z"/>',
  plate: '<circle cx="8" cy="12" r="5.5"/><path d="M16 3v8M19 3v8M16 3a2 2 0 0 0 0 4"/><path d="M19 11v10M16 21V12"/>',
  wheelchair: '<circle cx="8" cy="5" r="1.7"/><path d="M8 8v6l5 6M8 14h6M4 18a4 4 0 0 0 7.8 1.2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
  bag: '<path d="M6 8h12l1 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  camera: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/>',
  pillow: '<path d="M4 8c0-1.7 1.3-3 3-3h10c1.7 0 3 1.3 3 3v6c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V8Z"/>',
  linen: '<path d="M4 6h16v12H4z M4 10h16"/>',
  curtain: '<path d="M4 4h16 M6 4v14 M10 4v14 M14 4v14 M18 4v14"/>',
  socket: '<path d="M5 5h14v14H5z M9 10v2 M15 10v2 M10 15h4"/>',
  wardrobe: '<path d="M5 3h14v18H5z M12 3v18 M9 12h.01 M15 12h.01"/>',
  nightstand: '<path d="M7 21v-6h10v6 M5 15h14 M9 8l1-4h4l1 4H9Z M12 8v7"/>',
  mirror: '<path d="M8 3h8a3 3 0 013 3v12a3 3 0 01-3 3H8a3 3 0 01-3-3V6a3 3 0 013-3Z M9 8l3 3 M9 13l5 5"/>',
  safe: '<path d="M3 7h18v12H3z M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2 M12 13h.01"/>',
  net: '<path d="M4 4h16v16H4z M4 9h16 M4 14h16 M9 4v16 M14 4v16"/>',
  ironb: '<path d="M3 16h14l4-7H9c-3 0-6 3-6 7Z M3 19h18"/>',
  coffeetable: '<path d="M4 9h16 M6 9v8 M18 9v8 M8 13h8"/>',
  console: '<path d="M4 9a3 3 0 013-3h10a3 3 0 013 3v6a3 3 0 01-3 3H7a3 3 0 01-3-3V9Z M8 10v4 M6 12h4 M16 11h.01 M18 13h.01"/>',
  router: '<path d="M5 13h14v6H5z M8 16h.01 M12 16h.01 M8 13l-2-4 M16 13l2-4"/>',
  lamp: '<path d="M12 3a6 6 0 00-3 11.2V17h6v-2.8A6 6 0 0012 3Z M10 20h4"/>',
  stove: '<path d="M4 9h16v10H4z M4 9V6a1 1 0 011-1h14a1 1 0 011 1v3 M8 13h.01 M12 13h.01 M16 13h.01"/>',
  oven: '<path d="M4 4h16v16H4z M4 9h16 M9 14h6"/>',
  microwave: '<path d="M3 6h18v12H3z M7 9h8v6H7z M18 9h.01 M18 12h.01"/>',
  dishwasher: '<path d="M4 3h16v18H4z M4 8h16 M9 14.5a3 3 0 106 0 3 3 0 10-6 0"/>',
  dryer: '<path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2Z M7.5 6.5h.01 M12 8c-2 0-3.5 1.6-3.5 3.5S10 15 12 15s3.5-1.6 3.5-3.5"/>',
  hairdryer: '<path d="M4 9c0-2.8 2.2-5 5-5h5v7H9c-2.8 0-5-2.2-5-5Z M14 7h5 M9 11v8"/>',
  terrace: '<path d="M3 11l9-7 9 7 M5 11v9 M19 11v9 M5 14h14"/>',
  towel: '<path d="M5 4h14v6H5z M7 10v10 M17 10v10 M7 14h10"/>',
  soap: '<path d="M8 3h8v4H8z M7 7h10v14H7z M9 12h6"/>',
  tp: '<path d="M6 5h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2Z M12 9a3 3 0 100 6 3 3 0 000-6Z"/>',
  robe: '<path d="M8 3l4 3 4-3 3 5-3 2v11H8V10L5 8l3-5Z M12 6v14"/>',
  mat: '<path d="M4 8h16v10H4z M7 11h10 M7 14h10"/>',
  floorheat: '<path d="M4 18h16 M7 18c0-3 3-3 3-6s-3-3-3-6 M12 18c0-3 3-3 3-6s-3-3-3-6 M17 18c0-3 3-3 3-6"/>',
  shower: '<path d="M5 4a3 3 0 016 0 M8 7v1 M4 11h8 M6 14l-1 2 M9 14l-1 2 M12 14l-1 2"/>',
  cabin: '<path d="M5 3h14v18H5z M9 8h.01 M12 8h.01 M15 8h.01 M9 12h.01 M12 12h.01 M15 12h.01"/>',
  bidet: '<path d="M4 12h16 M6 12v3a5 5 0 005 5h2a5 5 0 005-5v-3 M12 4v9"/>',
  lift: '<path d="M5 3h14v18H5z M12 3v18 M8.5 9l-1.5-2-1.5 2 M16.5 15l1.5 2 1.5-2"/>',
  cup: '<path d="M5 9h11v5a5 5 0 01-5 5h-1a5 5 0 01-5-5V9Z M16 10.5h1.8a2.2 2.2 0 010 4.4H16 M8.5 3.5c0 1.3 1.3 1.3 1.3 2.6 M12.5 3.5c0 1.3 1.3 1.3 1.3 2.6"/>',
  frigo: '<path d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2Z M5 11h14 M9 7v1.5 M9 14v3"/>',
  parkp: '<path d="M7 4h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3Z M10 16V8h3a2.5 2.5 0 010 5h-3"/>',
};

const PA_ICON_MAP = {
  parcare: "parking", mic_dejun: "plate", wifi: "wifi", animale: "paw", piscina: "pool",
  aer_conditionat: "snow", jacuzzi: "bath", loc_de_joaca: "tree", gratar: "grill",
  bucatarie_utilata: "kitchen", masina_spalat: "washer", espressor: "coffee", smart_tv: "tv",
  receptie: "bell", restaurant_propriu: "fork", plata_card: "card", sala_conferinte: "briefcase",
  curatenie_zilnica: "clean", sauna: "sauna", masina_spalat_vase: "washer",
  king: "bed", dublu: "bed", single: "bed", canapea: "sofa", crib: "crib", supraetajat: "bed", saltea: "bed",
  dus: "bath", cada: "bath", bideu: "bath", toaletrii: "bottle", uscator: "wind",
  gradina_privata: "tree", gradina_comuna: "tree", terasa: "sun", balcon: "door",
  mobilier: "home", sezlonguri: "sun", loc_joaca: "tree", piscina_privata: "pool", piscina_comuna: "pool",
  people: "people", rooms: "door", size: "size",
  pescuit: "fish", semineu: "fire", pet_friendly: "paw", evenimente: "briefcase", acces_dizabilitati: "wheelchair", acces_scaune_rotile: "wheelchair",
  ghid_turistic: "people", ghid_strain: "globe", magazin_suveniruri: "bag", toalete: "bath",
  cafenea_picnic: "coffee", foto_permis: "camera",
  vegetarian: "tree", fara_gluten: "check", meniu_copii: "people",
};

// Tipuri de structuri de cazare (când un proprietar are mai multe unități
// în aceeași locație) + tipuri de bucătărie per unitate.
const UNIT_TYPES = {
  camera_dubla: { ro: "Cameră dublă", en: "Double room" },
  apartament: { ro: "Apartament", en: "Apartment" },
  casa_integrala: { ro: "Casă integrală", en: "Whole house" },
  vila: { ro: "Vilă", en: "Villa" },
  cabana: { ro: "Cabană", en: "Cabin" },
  aframe: { ro: "A-Frame", en: "A-Frame" },
  glamping: { ro: "Cort Glamping", en: "Glamping tent" },
  bungalow: { ro: "Bungalow", en: "Bungalow" },
};

const KITCHEN_TYPES = {
  fara: { ro: "Fără bucătărie", en: "No kitchen" },
  chicineta: { ro: "Chicinetă (frigider mic, cuptor cu microunde, fierbător)", en: "Kitchenette (mini fridge, microwave, kettle)" },
  completa: { ro: "Bucătărie complet utilată (aragaz/plită, cuptor, veselă, frigider mare)", en: "Fully equipped kitchen (stove, oven, dishes, full fridge)" },
  comuna: { ro: "Acces la bucătărie comună (în afara acestei unități)", en: "Access to a shared kitchen (outside this unit)" },
};

// ---------- Formular dedicat „Hotel mic” ----------
const HOTEL_SUBTYPES = {
  familie: { ro: "Hotel de familie", en: "Family hotel" },
  boutique: { ro: "Boutique Hotel", en: "Boutique hotel" },
  aparthotel: { ro: "Aparthotel", en: "Aparthotel" },
  pensiune_hoteliera: { ro: "Pensiune hotelieră", en: "Hotel-style guesthouse" },
  vila_turistica: { ro: "Vilă turistică", en: "Tourist villa" },
};

const HOTEL_RECEPTION = {
  non_stop: { ro: "Recepție 24/7", en: "24/7 reception" },
  program: { ro: "Recepție cu program orar", en: "Reception with set hours" },
  self_checkin: { ro: "Self check-in (cod de acces / lockbox)", en: "Self check-in (access code / lockbox)" },
};

const HOTEL_BEDS = {
  matrimonial: { ro: "1 pat matrimonial (Double/King)", en: "1 double bed (Double/King)" },
  twin: { ro: "2 paturi single (Twin)", en: "2 single beds (Twin)" },
  single: { ro: "1 pat single (o persoană)", en: "1 single bed (one person)" },
  canapea: { ro: "1 canapea extensibilă", en: "1 sofa bed" },
};

const HOTEL_ROOM_AMENITIES = {
  baie_privata: { ro: "Baie privată în cameră (duș sau cadă)", en: "Private bathroom (shower or bath)", icon: "bath" },
  aer_conditionat: { ro: "Aer condiționat", en: "Air conditioning", icon: "snow" },
  minibar: { ro: "Minibar / frigider mic", en: "Minibar / small fridge", icon: "kitchen" },
  balcon: { ro: "Balcon / terasă proprie", en: "Private balcony / terrace", icon: "door" },
  smart_tv: { ro: "Smart TV", en: "Smart TV", icon: "tv" },
  seif: { ro: "Seif pentru valori", en: "In-room safe", icon: "briefcase" },
};

const HOTEL_MENUS = {
  a_la_carte: { ro: "Meniu à la carte", en: "À la carte menu" },
  fix: { ro: "Meniu fix / Meniul zilei", en: "Set menu / Menu of the day" },
  copii: { ro: "Meniu pentru copii", en: "Children's menu" },
  traditional: { ro: "Meniu tradițional românesc", en: "Traditional Romanian menu" },
  vegetarian: { ro: "Meniu vegetarian / vegan", en: "Vegetarian / vegan menu" },
  fara_gluten: { ro: "Preparate fără gluten", en: "Gluten-free dishes" },
};

const HOTEL_MEAL_PLANS = {
  fara: { ro: "Fără mese", en: "No meals" },
  mic_dejun: { ro: "Doar mic dejun", en: "Breakfast only" },
  demipensiune: { ro: "Demipensiune", en: "Half board" },
  pensiune_completa: { ro: "Pensiune completă", en: "Full board" },
  all_inclusive: { ro: "All inclusive", en: "All inclusive" },
};

// facilitățile generale (clădire & curte) care NU există deja în lista generală
const HOTEL_FACILITIES = {
  lift: { ro: "Lift (ascensor)", en: "Lift (elevator)", icon: "home" },
  ev: { ro: "Stație de încărcare mașini electrice (EV)", en: "EV charging station", icon: "car" },
  spa: { ro: "Zonă SPA (saună, jacuzzi interior, masaj)", en: "Spa area (sauna, indoor jacuzzi, massage)", icon: "sauna" },
  curte: { ro: "Curte interioară / grădină / terasă de vară", en: "Courtyard / garden / summer terrace", icon: "tree" },
};

const HOTEL_PETS = { gratuit: { ro: "Permis gratuit", en: "Allowed, free" }, contra_cost: { ro: "Permis contra cost", en: "Allowed, for a fee" }, interzis: { ro: "Interzis", en: "Not allowed" } };

const HOTEL_QUIET = { ore: { ro: "Ore de liniște obligatorii (ex: 22:00–08:00)", en: "Mandatory quiet hours (e.g. 22:00–08:00)" }, fara_muzica: { ro: "Fără muzică de exterior", en: "No outdoor music" }, flexibil: { ro: "Flexibil", en: "Flexible" } };

// ---------- Formular dedicat „Pensiune / Cabană / A-Frame” ----------
const PENSION_TYPES = ["pensiune", "cabana", "aframe"];

const RENTAL_MODES = {
  integral: { ro: "Doar toată proprietatea integral (la cheie)", en: "Whole property only (private use)" },
  camere: { ro: "Doar camere individual (separat)", en: "Individual rooms only" },
  hibrid: { ro: "Hibrid: și integral, și camere separat", en: "Hybrid: whole property and separate rooms" },
};

const VIEW_TYPES = {
  munte: { ro: "Munte", en: "Mountain" }, padure: { ro: "Pădure", en: "Forest" }, gradina: { ro: "Grădină", en: "Garden" },
  curte: { ro: "Curte interioară", en: "Courtyard" }, lac: { ro: "Lac / râu", en: "Lake / river" }, vale: { ro: "Vale / sat", en: "Valley / village" }, oras: { ro: "Oraș", en: "City" },
};

const BEDROOM_AMENITIES = {
  smart_tv: { ro: "Smart TV", en: "Smart TV", icon: "tv" }, aer_conditionat: { ro: "Aer condiționat", en: "Air conditioning", icon: "snow" },
  balcon: { ro: "Balcon / terasă", en: "Balcony / terrace", icon: "door" }, seif: { ro: "Seif", en: "Safe", icon: "briefcase" },
  minibar: { ro: "Minibar", en: "Minibar", icon: "kitchen" }, birou: { ro: "Birou", en: "Desk", icon: "document" },
};

const LIVING_AMENITIES = {
  smart_tv: { ro: "Smart TV", en: "Smart TV", icon: "tv" }, semineu: { ro: "Șemineu", en: "Fireplace", icon: "fire" },
  aer_conditionat: { ro: "Aer condiționat", en: "Air conditioning", icon: "snow" }, zona_masa: { ro: "Zonă de luat masa", en: "Dining area", icon: "fork" },
};

const KITCHEN_APPLIANCES = {
  frigider: { ro: "Frigider", en: "Fridge", icon: "kitchen" }, plita: { ro: "Plită / aragaz", en: "Hob / stove", icon: "kitchen" },
  cuptor: { ro: "Cuptor", en: "Oven", icon: "kitchen" }, microunde: { ro: "Cuptor cu microunde", en: "Microwave", icon: "kitchen" },
  masina_vase: { ro: "Mașină de spălat vase", en: "Dishwasher", icon: "washer" }, espressor: { ro: "Filtru / espressor cafea", en: "Coffee maker", icon: "coffee" },
  fierbator: { ro: "Fierbător", en: "Kettle", icon: "coffee" },
};

// facilități specifice unei structuri = chei din ACCOMMODATION_AMENITIES (ca filtrele din căutare să meargă)
const STRUCT_FACILITY_KEYS = ["wifi", "aer_conditionat", "smart_tv", "masina_spalat", "jacuzzi", "gratar"];

// facilitățile de la nivel de proprietate, în cele două liste din formular
const PENSION_PROPERTY_GROUPS = {
  curte: ["pescuit", "piscina", "jacuzzi", "loc_de_joaca", "gratar", "sauna", "parcare"],
  servicii: ["mic_dejun", "restaurant_propriu", "plata_card", "receptie", "curatenie_zilnica", "sala_conferinte", "animale"],
};

// ---- Model v3: o singură unitate (pensiune / cabană / A-Frame): dormitoare + living ----
const PENSION_BED_KEYS = { king: { ro: "Pat dublu extra large (king size)", en: "Extra-large double bed (king size)" }, dublu: { ro: "Pat dublu standard", en: "Standard double bed" }, single: { ro: "Pat de o persoană (single)", en: "Single bed" }, supraetajat: { ro: "Pat supraetajat", en: "Bunk bed" } };

const PENSION_BATH_TYPES = { private: { ro: "Privată (în cameră)", en: "Private (en-suite)" }, hall: { ro: "Pe hol (comună)", en: "Hallway (shared)" } };

const LIVING_GROUPS = [
  { id: "confort", icon: "sofa", ro: "Confort & Mobilier", en: "Comfort & Furniture", items: [
    { k: "sofa_colt", icon: "sofa", ro: "Canapea / Colțar / Zonă de relaxare", en: "Sofa / Corner sofa / Lounge area" },
    { k: "sofa_ext", icon: "bed", ro: "Canapea extensibilă", en: "Sofa bed" },
    { k: "fotolii", icon: "armchair", ro: "Fotolii", en: "Armchairs" },
    { k: "masa", icon: "table", ro: "Zonă de luat masa / Masă mare", en: "Dining area / Large table" },
    { k: "semineu", icon: "fire", ro: "Șemineu", en: "Fireplace" },
  ] },
  { id: "divertisment", icon: "tv", ro: "Divertisment & Tehnologie", en: "Entertainment & Technology", items: [
    { k: "tv", icon: "tv", ro: "Televizor cu ecran plat (Smart TV)", en: "Flat-screen TV (Smart TV)" },
    { k: "streaming", icon: "stream", ro: "Canale prin cablu / Netflix / Streaming", en: "Cable channels / Netflix / Streaming" },
    { k: "audio", icon: "speaker", ro: "Sistem audio / Boxă Bluetooth", en: "Sound system / Bluetooth speaker" },
    { k: "jocuri", icon: "dice", ro: "Jocuri de societate (Board games)", en: "Board games" },
    { k: "zona_lucru", icon: "desk", ro: "Zonă de lucru (Birou / Wi-Fi de mare viteză)", en: "Work area (Desk / high-speed Wi-Fi)" },
  ] },
  { id: "climat", icon: "weather", ro: "Climatizare & Utilități", en: "Climate & Utilities", items: [
    { k: "ac", icon: "snow", ro: "Aer condiționat", en: "Air conditioning" },
    { k: "incalzire", icon: "radiator", ro: "Încălzire prin pardoseală / Calorifere", en: "Underfloor heating / Radiators" },
  ] },
];

const LIVING_ITEM_KEYS = LIVING_GROUPS.reduce((a, g) => a.concat(g.items.map((x) => x.k)), []);

const FIREPLACE_TYPES = { lemne: { ro: "Pe lemne", en: "Wood-burning" }, electric: { ro: "Electric", en: "Electric" } };

const PENSION_MAIN_BEDS = ["king", "dublu", "single", "supraetajat"];

const PENSION_EXTRA_BEDS = ["canapea", "single", "crib", "saltea", "supraetajat"];

// ---------- Formular dedicat „Camping” ----------
const CAMP_UNITS = {
  casute: { ro: "Căsuțe din lemn simple (băi comune)", en: "Simple wooden cabins (shared bathrooms)", minPhotos: 2, icon: "home" },
  bungalouri: { ro: "Bungalouri / cabane (cu baie proprie)", en: "Bungalows / cabins (private bathroom)", minPhotos: 3, icon: "home" },
  glamping: { ro: "Corturi glamping gata montate", en: "Ready-pitched glamping tents", minPhotos: 3, icon: "sun" },
};

const CAMP_FACILITIES = {
  dusuri: { ro: "Dușuri comune cu apă caldă permanentă", en: "Shared showers with constant hot water", icon: "bath", group: "sanitary" },
  toalete: { ro: "Toalete moderne cu spălare, separate pe sexe", en: "Modern flush toilets, separate by gender", icon: "bath", group: "sanitary" },
  lavoare: { ro: "Lavoare exterioare pentru spălat vase (apă caldă)", en: "Outdoor dish-washing sinks (hot water)", icon: "kitchen", group: "sanitary" },
  rufe: { ro: "Mașini de spălat / uscat rufe pentru oaspeți", en: "Washing / drying machines for guests", icon: "washer", group: "sanitary" },
  golire: { ro: "Stație de golire a apelor uzate (camper)", en: "Waste-water dump station (campers)", icon: "car", group: "camper" },
  apa: { ro: "Punct central de alimentare cu apă potabilă", en: "Central drinking-water point", icon: "pool", group: "camper" },
  wifi: { ro: "Wi-Fi gratuit în zonele comune / pe tot terenul", en: "Free Wi-Fi in common areas / across the site", icon: "wifi", group: "camper" },
  bucatarie: { ro: "Bucătărie comună complet utilată", en: "Fully equipped shared kitchen", icon: "kitchen", group: "cook" },
  foisoare: { ro: "Foișoare acoperite / zone de luat masa", en: "Covered gazebos / dining areas", icon: "home", group: "cook" },
  gratare: { ro: "Grătare amenajate / barbecue public", en: "Public barbecue / grills", icon: "grill", group: "cook" },
  foc: { ro: "Spațiu amenajat pentru foc de tabără", en: "Campfire area", icon: "sun", group: "cook" },
  joaca: { ro: "Spațiu de joacă amenajat pentru copii", en: "Children's playground", icon: "tree", group: "cook" },
};

const CAMP_GROUPS = {
  sanitary: { ro: "Igienă și grupuri sanitare", en: "Hygiene & sanitary facilities" },
  camper: { ro: "Utilități camper și conectivitate", en: "Camper utilities & connectivity" },
  cook: { ro: "Zone de gătit și relaxare", en: "Cooking & relaxing areas" },
};

const CAMP_SHADE = { fara: { ro: "Fără umbră (zonă deschisă)", en: "No shade (open area)" }, partial: { ro: "Umbră parțială", en: "Partial shade" }, complet: { ro: "Umbră completă (copaci / pădure)", en: "Full shade (trees / woods)" } };
const CAMP_UNIT_BEDS = { matrimonial: { ro: "Pat matrimonial", en: "Double bed", icon: "bed" }, suprapuse: { ro: "Paturi suprapuse", en: "Bunk beds", icon: "bed" }, single: { ro: "Pat de o persoană (single)", en: "Single bed", icon: "bed" } };
const CAMP_UNIT_AMENITIES = { baie: { ro: "Baie privată", en: "Private bathroom", icon: "bath" }, ac: { ro: "Aer condiționat", en: "Air conditioning", icon: "snow" }, frigider: { ro: "Frigider", en: "Fridge", icon: "fridge" } };
// ---------- Formular dedicat „Apartament” (model v1: o singură unitate) ----------
const APT_GROUPS = {
 "bedroom": [
  {
   "id": "somn",
   "ro": "Confort & Somn",
   "en": "Comfort & Sleep",
   "items": [
    {
     "k": "saltea",
     "ro": "Saltea ortopedică / cu memorie",
     "en": "Orthopedic / memory-foam mattress",
     "icon": "bed"
    },
    {
     "k": "perne",
     "ro": "Perne antialergice",
     "en": "Hypoallergenic pillows",
     "icon": "pillow"
    },
    {
     "k": "lenjerie",
     "ro": "Lenjerie de pat inclusă",
     "en": "Bed linen included",
     "icon": "linen"
    },
    {
     "k": "blackout",
     "ro": "Jaluzele opace (blackout curtains)",
     "en": "Blackout curtains",
     "icon": "curtain"
    }
   ]
  },
  {
   "id": "tech",
   "ro": "Tehnologie & Climatizare",
   "en": "Technology & Climate",
   "items": [
    {
     "k": "ac",
     "ro": "Aer condiționat în dormitor",
     "en": "Air conditioning in the bedroom",
     "icon": "snow"
    },
    {
     "k": "tv",
     "ro": "Smart TV (cu acces Netflix / HBO)",
     "en": "Smart TV (Netflix / HBO access)",
     "icon": "tv"
    },
    {
     "k": "prize",
     "ro": "Prize lângă pat (pe ambele părți)",
     "en": "Sockets next to the bed (both sides)",
     "icon": "socket"
    }
   ]
  },
  {
   "id": "depozitare",
   "ro": "Depozitare & Organizare",
   "en": "Storage & Organisation",
   "items": [
    {
     "k": "sifonier",
     "ro": "Șifonier / dulap de haine cu umerașe",
     "en": "Wardrobe with hangers",
     "icon": "wardrobe"
    },
    {
     "k": "noptiere",
     "ro": "Noptiere cu veioze",
     "en": "Bedside tables with lamps",
     "icon": "nightstand"
    },
    {
     "k": "oglinda",
     "ro": "Oglindă pe tot corpul (full-length mirror)",
     "en": "Full-length mirror",
     "icon": "mirror"
    },
    {
     "k": "seif",
     "ro": "Seif pentru valori",
     "en": "Safe for valuables",
     "icon": "safe"
    }
   ]
  },
  {
   "id": "utilitare",
   "ro": "Utilitare suplimentare",
   "en": "Extras",
   "items": [
    {
     "k": "birou",
     "ro": "Spațiu de lucru (birou + scaun pentru laptop)",
     "en": "Work space (desk + chair for a laptop)",
     "icon": "desk"
    },
    {
     "k": "plasa",
     "ro": "Plasă de țânțari la geam",
     "en": "Mosquito screen on the window",
     "icon": "net"
    },
    {
     "k": "fier",
     "ro": "Fier de călcat și masă de călcat (dacă sunt ținute în dormitor)",
     "en": "Iron and ironing board (if kept in the bedroom)",
     "icon": "ironb"
    }
   ]
  }
 ],
 "living": [
  {
   "id": "relaxare",
   "ro": "Relaxare & Socializare",
   "en": "Relaxing & Socialising",
   "items": [
    {
     "k": "sofa_fixa",
     "ro": "Canapea fixă",
     "en": "Fixed sofa",
     "icon": "sofa"
    },
    {
     "k": "sofa_ext",
     "ro": "Canapea extensibilă",
     "en": "Sofa bed",
     "icon": "bed"
    },
    {
     "k": "fotolii",
     "ro": "Fotolii / pouf-uri suplimentare",
     "en": "Extra armchairs / poufs",
     "icon": "armchair"
    },
    {
     "k": "masuta",
     "ro": "Măsuță de cafea",
     "en": "Coffee table",
     "icon": "coffeetable"
    },
    {
     "k": "masa",
     "ro": "Zonă de luat masa (masă cu scaune — dacă livingul e open-space cu bucătăria)",
     "en": "Dining area (table with chairs — if the living room is open-plan with the kitchen)",
     "icon": "table"
    }
   ]
  },
  {
   "id": "divertisment",
   "ro": "Tehnologie & Divertisment",
   "en": "Technology & Entertainment",
   "items": [
    {
     "k": "tv",
     "ro": "Smart TV cu diagonală mare",
     "en": "Large Smart TV",
     "icon": "tv"
    },
    {
     "k": "audio",
     "ro": "Sistem audio / boxă Bluetooth",
     "en": "Sound system / Bluetooth speaker",
     "icon": "speaker"
    },
    {
     "k": "consola",
     "ro": "Consolă de jocuri (PlayStation / Xbox)",
     "en": "Game console (PlayStation / Xbox)",
     "icon": "console"
    },
    {
     "k": "jocuri",
     "ro": "Jocuri de societate (board games / cărți)",
     "en": "Board games / books",
     "icon": "dice"
    },
    {
     "k": "router",
     "ro": "Router Wi-Fi amplasat în living (semnal maxim)",
     "en": "Wi-Fi router in the living room (best signal)",
     "icon": "router"
    }
   ]
  },
  {
   "id": "ambient",
   "ro": "Climatizare & Ambiantă",
   "en": "Climate & Ambience",
   "items": [
    {
     "k": "ac",
     "ro": "Aer condiționat în living",
     "en": "Air conditioning in the living room",
     "icon": "snow"
    },
    {
     "k": "semineu",
     "ro": "Șemineu",
     "en": "Fireplace",
     "icon": "fire"
    },
    {
     "k": "lumina",
     "ro": "Lumină ambientală reglabilă (dimmable lights / benzi LED)",
     "en": "Adjustable mood lighting (dimmable lights / LED strips)",
     "icon": "lamp"
    }
   ]
  },
  {
   "id": "altele",
   "ro": "Altele",
   "en": "Other",
   "items": [
    {
     "k": "balcon",
     "ro": "Balcon / terasă cu acces direct din living",
     "en": "Balcony / terrace with direct access from the living room",
     "icon": "door"
    }
   ]
  }
 ],
 "bath": [
  {
   "id": "instalatie",
   "ro": "Tipul de instalație (duș / cadă)",
   "en": "Fixtures (shower / bath)",
   "items": [
    {
     "k": "cada",
     "ro": "Cadă (clasică, ideală pentru relaxare)",
     "en": "Bathtub (classic, ideal for relaxing)",
     "icon": "bath"
    },
    {
     "k": "walkin",
     "ro": "Duș de tip walk-in (cu sticlă, modern)",
     "en": "Walk-in shower (glass, modern)",
     "icon": "shower"
    },
    {
     "k": "cabina",
     "ro": "Cabină de duș standard",
     "en": "Standard shower cabin",
     "icon": "cabin"
    },
    {
     "k": "jacuzzi",
     "ro": "Cadă cu hidromasaj / jacuzzi interior",
     "en": "Whirlpool bath / indoor jacuzzi",
     "icon": "bath"
    },
    {
     "k": "bideu",
     "ro": "Bideu (sau duș igienic lângă WC)",
     "en": "Bidet (or hygiene shower next to the toilet)",
     "icon": "bidet"
    }
   ]
  },
  {
   "id": "consumabile",
   "ro": "Consumabile & Articole de igienă (incluse gratuit)",
   "en": "Toiletries & supplies (included free)",
   "items": [
    {
     "k": "prosoape",
     "ro": "Prosoape (mici și mari, per persoană)",
     "en": "Towels (small and large, per person)",
     "icon": "towel"
    },
    {
     "k": "sapun",
     "ro": "Săpun și șampon / gel de duș",
     "en": "Soap and shampoo / shower gel",
     "icon": "soap"
    },
    {
     "k": "hartie",
     "ro": "Hârtie igienică (stoc inițial)",
     "en": "Toilet paper (initial supply)",
     "icon": "tp"
    },
    {
     "k": "halat",
     "ro": "Halate de baie și papuci de casă",
     "en": "Bathrobes and slippers",
     "icon": "robe"
    },
    {
     "k": "covoras",
     "ro": "Covoraș de baie antiderapant",
     "en": "Non-slip bath mat",
     "icon": "mat"
    }
   ]
  },
  {
   "id": "aparatura",
   "ro": "Aparatură electrică & Confort",
   "en": "Electrical & Comfort",
   "items": [
    {
     "k": "uscator_par",
     "ro": "Uscător de păr",
     "en": "Hair dryer",
     "icon": "hairdryer"
    },
    {
     "k": "priza",
     "ro": "Priză în baie (lângă oglindă, izolată împotriva apei)",
     "en": "Bathroom socket (next to the mirror, water-protected)",
     "icon": "socket"
    },
    {
     "k": "oglinda_led",
     "ro": "Oglindă cosmetică cu LED / funcție de dezaburire",
     "en": "LED cosmetic mirror / anti-fog",
     "icon": "mirror"
    },
    {
     "k": "incalzire",
     "ro": "Încălzire în pardoseală în baie",
     "en": "Underfloor heating in the bathroom",
     "icon": "floorheat"
    },
    {
     "k": "port_prosop",
     "ro": "Calorifer port-prosop (electric sau pe centrală)",
     "en": "Heated towel rail (electric or central heating)",
     "icon": "radiator"
    }
   ]
  }
 ],
 "facilities": [
  {
   "id": "bucatarie",
   "ro": "Bucătărie (dotări)",
   "en": "Kitchen (equipment)",
   "items": [
    {
     "k": "complet",
     "ro": "Complet utilată (veselă, tacâmuri)",
     "en": "Fully equipped (dishes, cutlery)",
     "icon": "fork"
    },
    {
     "k": "plita",
     "ro": "Aragaz / Plită",
     "en": "Stove / hob",
     "icon": "stove"
    },
    {
     "k": "cuptor",
     "ro": "Cuptor",
     "en": "Oven",
     "icon": "oven"
    },
    {
     "k": "frigider",
     "ro": "Frigider cu congelator",
     "en": "Fridge-freezer",
     "icon": "frigo"
    },
    {
     "k": "microunde",
     "ro": "Cuptor cu microunde",
     "en": "Microwave",
     "icon": "microwave"
    },
    {
     "k": "espresso",
     "ro": "Espresso / Filtru cafea",
     "en": "Espresso / filter coffee maker",
     "icon": "cup"
    },
    {
     "k": "vase",
     "ro": "Mașină de spălat vase",
     "en": "Dishwasher",
     "icon": "dishwasher"
    }
   ]
  },
  {
   "id": "utilitati",
   "ro": "Utilități & Climatizare",
   "en": "Utilities & Climate",
   "items": [
    {
     "k": "ac",
     "ro": "Aer condiționat în fiecare cameră",
     "en": "Air conditioning in every room",
     "icon": "snow"
    },
    {
     "k": "centrala",
     "ro": "Centrală proprie (încălzire)",
     "en": "Own boiler (heating)",
     "icon": "radiator"
    },
    {
     "k": "wifi",
     "ro": "Wi-Fi de mare viteză",
     "en": "High-speed Wi-Fi",
     "icon": "wifi"
    },
    {
     "k": "birou",
     "ro": "Zonă de lucru (birou + scaun confortabil)",
     "en": "Work area (desk + comfortable chair)",
     "icon": "desk"
    }
   ]
  },
  {
   "id": "spalatorie",
   "ro": "Spălătorie & Îngrijire",
   "en": "Laundry & Care",
   "items": [
    {
     "k": "masina_rufe",
     "ro": "Mașină de spălat rufe",
     "en": "Washing machine",
     "icon": "washer"
    },
    {
     "k": "uscator_rufe",
     "ro": "Uscător de rufe",
     "en": "Tumble dryer",
     "icon": "dryer"
    },
    {
     "k": "fier",
     "ro": "Fier & masă de călcat",
     "en": "Iron & ironing board",
     "icon": "ironb"
    },
    {
     "k": "uscator_par",
     "ro": "Uscător de păr",
     "en": "Hair dryer",
     "icon": "hairdryer"
    }
   ]
  },
  {
   "id": "exterior",
   "ro": "Exterior / Acces",
   "en": "Outdoor / Access",
   "items": [
    {
     "k": "balcon",
     "ro": "Balcon",
     "en": "Balcony",
     "icon": "door"
    },
    {
     "k": "terasa",
     "ro": "Terasă mare",
     "en": "Large terrace",
     "icon": "terrace"
    },
    {
     "k": "parcare",
     "ro": "Loc de parcare asigurat",
     "en": "Secured parking space",
     "icon": "parkp"
    }
   ]
  }
 ]
};
const APT_OPTS = {"beds": [["matrimonial", "Pat matrimonial (Double / Queen / King)", "Double bed (Double / Queen / King)"], ["twin", "Paturi Twin", "Twin beds"], ["single", "Pat single", "Single bed"], ["suprapuse", "Paturi suprapuse", "Bunk beds"]], "checkin": [["self", "Self check-in (Smart Lock / casetă cu cheie)", "Self check-in (smart lock / key box)"], ["personal", "Întâlnire personală cu gazda", "Meeting the host in person"]], "smoking": [["nu", "Nu (strict interzis)", "No (strictly forbidden)"], ["balcon", "Doar pe balcon", "Only on the balcony"]], "parties": [["da", "Da", "Yes"], ["nu", "Nu", "No"]], "pets": [["pet", "Pet-friendly", "Pet-friendly"], ["fara", "Fără animale", "No pets"]], "fireplace": [["electric", "Electric", "Electric"], ["lemne", "Pe lemne", "Wood-burning"], ["bioetanol", "Bioetanol", "Bio-ethanol"]], "kind": [["studio", "Studio / Garsonieră", "Studio"], ["apartament", "Apartament", "Apartment"], ["penthouse", "Penthouse", "Penthouse"]]};
const APT_INDEX = {};
Object.keys(APT_GROUPS).forEach((sec) => { APT_INDEX[sec] = {}; APT_GROUPS[sec].forEach((g) => g.items.forEach((x) => { APT_INDEX[sec][x.k] = Object.assign({ group: g.id }, x); })); });
const APT_BEDROOMS_MAX = 5;
const APT_BATHS_MAX = 4;
const CAMP_PHOTO_MAX = 24;
const HOTEL_ROOM_PHOTO_MAX = 6;
const HOTEL_PHOTO_MAX = 24;
const CAMP_VEHICLES = { mari: { ro: "Permite campere mari (>7.5 m)", en: "Large campers allowed (>7.5 m)" }, mici: { ro: "Doar campere mici/medii", en: "Small/medium campers only" }, corturi: { ro: "Doar corturi", en: "Tents only" } };


const TYPE_DETAILS_CLIENT_JS = "(function(){\n  var root = document.getElementById(\"typeDetailsRoot\");\n  if (!root) return;\n  function tr(ro, en){ return LANG === \"en\" ? en : ro; }\n  function el(tag, cls, text){ var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }\n  function lab(text, mt){ var l = el(\"label\", \"acc-white-label\", text); if (mt) l.style.marginTop = mt; return l; }\n  function head(text){ return el(\"div\", \"acc-td-heading\", text); }\n  function hint(text){ return el(\"p\", \"acc-white-hint\", text); }\n  function selectOf(options, value, emptyLabel){\n    var s = el(\"select\", \"acc-white-input\");\n    if (emptyLabel) { var e0 = document.createElement(\"option\"); e0.value = \"\"; e0.textContent = emptyLabel; s.appendChild(e0); }\n    options.forEach(function(o){ var op = document.createElement(\"option\"); op.value = o.k; op.textContent = o.l; if (value === o.k) op.selected = true; s.appendChild(op); });\n    return s;\n  }\n  function plainSelect(values, value){\n    var s = el(\"select\", \"acc-white-input\");\n    values.forEach(function(v){ var op = document.createElement(\"option\"); op.value = v; op.textContent = v; if (String(value) === v) op.selected = true; s.appendChild(op); });\n    return s;\n  }\n  function numInput(value, min, max, step){\n    var i = el(\"input\", \"acc-white-input\"); i.type = \"number\"; i.min = String(min); if (max != null) i.max = String(max); if (step) i.step = step;\n    if (value != null && value !== \"\") i.value = value;\n    return i;\n  }\n  function textInput(value, max, ph){\n    var i = el(\"input\", \"acc-white-input\"); i.type = \"text\"; i.maxLength = max || 120; if (ph) i.placeholder = ph; if (value) i.value = value;\n    return i;\n  }\n  function checkGrid(items, selected){\n    var grid = el(\"div\", \"acc-check-grid\"); var boxes = [];\n    items.forEach(function(it){\n      var l = el(\"label\", \"acc-check-item\");\n      if (it.icon) l.innerHTML = it.icon;\n      var cb = document.createElement(\"input\"); cb.type = \"checkbox\"; cb.value = it.k;\n      if (selected && selected.indexOf(it.k) !== -1) cb.checked = true;\n      l.appendChild(cb); l.appendChild(el(\"span\", null, it.l)); grid.appendChild(l); boxes.push(cb);\n    });\n    return { node: grid, get: function(){ return boxes.filter(function(c){ return c.checked; }).map(function(c){ return c.value; }); } };\n  }\n  function radios(name, items, value){\n    var col = el(\"div\", \"acc-radio-col\"); var inputs = []; var listeners = [];\n    items.forEach(function(it){\n      var l = el(\"label\", \"acc-radio-item\");\n      var r = document.createElement(\"input\"); r.type = \"radio\"; r.name = name; r.value = it.k; if (value === it.k) r.checked = true;\n      r.addEventListener(\"change\", function(){ listeners.forEach(function(f){ f(r.value); }); });\n      l.appendChild(r); l.appendChild(document.createTextNode(\" \" + it.l)); col.appendChild(l); inputs.push(r);\n    });\n    return { node: col, get: function(){ var c = inputs.filter(function(x){ return x.checked; })[0]; return c ? c.value : \"\"; }, onChange: function(f){ listeners.push(f); } };\n  }\n  function resizeImg(file, maxDim, quality){\n    return new Promise(function(resolve, reject){\n      var img = new Image(); var reader = new FileReader();\n      reader.onload = function(e){\n        img.onload = function(){\n          var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;\n          var scale = Math.min(1, maxDim / Math.max(w, h));\n          var canvas = document.createElement(\"canvas\"); canvas.width = Math.max(1, Math.round(w * scale)); canvas.height = Math.max(1, Math.round(h * scale));\n          canvas.getContext(\"2d\").drawImage(img, 0, 0, canvas.width, canvas.height);\n          canvas.toBlob(function(b){ if (!b) { reject(new Error(\"resize\")); return; } resolve(b); }, \"image/jpeg\", quality);\n        };\n        img.onerror = function(){ reject(new Error(\"img\")); };\n        img.src = e.target.result;\n      };\n      reader.onerror = function(){ reject(new Error(\"read\")); };\n      reader.readAsDataURL(file);\n    });\n  }\n  var groupCounter = 0;\n  function gallery(existing, max){\n    max = max || 20; groupCounter++;\n    var photos = (existing || []).slice(0, max);\n    var wrap = el(\"div\"); var grid = el(\"div\", \"acc-unit-photo-grid\"); wrap.appendChild(grid);\n    function render(){\n      grid.innerHTML = \"\";\n      photos.forEach(function(url, idx){\n        var th = el(\"div\", \"acc-unit-photo-thumb\"); var im = document.createElement(\"img\"); im.src = url; th.appendChild(im);\n        var rm = el(\"button\", \"acc-unit-photo-remove\", \"✕\"); rm.type = \"button\";\n        rm.addEventListener(\"click\", function(){ photos.splice(idx, 1); render(); notify(); });\n        th.appendChild(rm); grid.appendChild(th);\n      });\n      if (photos.length >= max) { var cap = el(\"div\", \"acc-unit-photo-thumb\"); cap.style.cssText = \"display:flex;align-items:center;justify-content:center;font-size:12px;color:#6b7280;text-align:center;padding:4px;\"; cap.textContent = tr(\"Maxim atins\", \"Limit reached\"); grid.appendChild(cap); return; }\n      var add = el(\"label\", \"acc-unit-photo-add\", \"+ \" + tr(\"Adaugă\", \"Add\"));\n      var input = document.createElement(\"input\"); input.type = \"file\"; input.accept = \"image/*\"; input.multiple = true; input.style.display = \"none\";\n      input.addEventListener(\"change\", function(e){\n        var files = Array.prototype.slice.call(e.target.files || []);\n        if (!files.length) return;\n        add.firstChild.textContent = tr(\"Se încarcă… \", \"Uploading… \");\n        var chain = Promise.resolve();\n        files.forEach(function(file){\n          chain = chain.then(function(){ return resizeImg(file, 1920, 0.82); })\n            .then(function(blob){ return fetch(\"/api/cazare/upload-poza\", { method: \"POST\", headers: { \"Content-Type\": \"image/jpeg\" }, body: blob }); })\n            .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, d: d }; }); })\n            .then(function(res){ if (res.ok && res.d.url && photos.length < max) photos.push(res.d.url); });\n        });\n        chain.then(function(){ render(); notify(); }).catch(function(){ render(); alert(tr(\"O poză nu a putut fi încărcată.\", \"A photo could not be uploaded.\")); });\n      });\n      add.appendChild(input); grid.appendChild(add);\n    }\n    render();\n    return { node: wrap, get: function(){ return photos.slice(); } };\n  }\n  function toNum(v){ var n = parseFloat(v); return isFinite(n) ? n : null; }\n  function toInt(v){ var n = parseInt(v, 10); return isFinite(n) ? n : 0; }\n  function notify(){ if (typeof derive === \"function\") derive(); }\n\n  /* ======================= HOTEL (rearanjat, ca la pensiune / camping) ======================= */\n  function buildHotel(d0){\n    var d = d0 || {}, H = DEF.hotel, I = DEF.pension.icons, curSpans = [];\n    function curTxt(){ var dc = byId(\"dCurrency\"); return dc && dc.value ? dc.value : \"RON\"; }\n    function field(label){ var w = el(\"div\", \"pn-field\"); w.appendChild(el(\"div\", \"pn-lbl\", label)); return w; }\n    function radioCol(name, items, value){\n      var col = el(\"div\", \"pn-col\"); var ins = {};\n      items.forEach(function(it){ var r = optRow(\"radio\", name, it.k, it.l, value === it.k, null); col.appendChild(r.node); ins[it.k] = r.input; });\n      return { node: col, get: function(){ var v = \"\"; Object.keys(ins).forEach(function(k){ if (ins[k].checked) v = k; }); return v; }, inputs: ins };\n    }\n    var root = el(\"div\", \"acc-td-box\");        // „Politici hoteliere” (stă după facilități)\n    var partA = el(\"div\", \"pn-camp-a\");       // date generale + camere + restaurant (stă sub localizare)\n\n    /* ---- Date generale ---- */\n    partA.appendChild(el(\"div\", \"pn-sec-title\", tr(\"Date generale hotel\", \"Hotel — general details\")));\n    var stW = field(tr(\"Tipul proprietății\", \"Property type\")); var subtype = selectOf(H.subtypes, d.subtype, tr(\"— alege —\", \"— choose —\")); subtype.className = \"acc-white-input\"; stW.appendChild(subtype); partA.appendChild(stW);\n    var seW = field(tr(\"Perioada de funcționare\", \"Operating period\")); var season = radioCol(\"hSeason\", [{ k: \"permanent\", l: tr(\"Permanent (tot anul)\", \"Year-round\") }, { k: \"sezonier\", l: tr(\"Sezonier\", \"Seasonal\") }], d.seasonality || \"permanent\"); seW.appendChild(season.node); partA.appendChild(seW);\n    var rcW = field(tr(\"Politica recepției\", \"Reception policy\")); var reception = selectOf(H.reception, d.reception, tr(\"— alege —\", \"— choose —\")); reception.className = \"acc-white-input\"; rcW.appendChild(reception); partA.appendChild(rcW);\n\n    /* ---- Tipuri de cameră ---- */\n    partA.appendChild(el(\"div\", \"pn-sec-title\", tr(\"Tipuri de cameră\", \"Room types\")));\n    partA.appendChild(el(\"p\", \"acc-white-hint\", tr(\"Adaugă fiecare categorie diferită (ex: Standard, Deluxe, Suită). Fiecare apare într-un tab propriu pe pagina ta, cu prețul și pozele ei. Între 3 și 6 fotografii pe tip de cameră.\", \"Add each different category (e.g. Standard, Deluxe, Suite). Each shows in its own tab on your page with its own price and photos. Between 3 and 6 photos per room type.\")));\n    var curRow = el(\"div\", \"pn-row\"); curRow.appendChild(el(\"span\", \"pn-q\", tr(\"Moneda tarifelor\", \"Rates currency\")));\n    var curSel = el(\"select\", \"acc-white-input pn-count\"); [\"RON\", \"EUR\"].forEach(function(c){ var o = document.createElement(\"option\"); o.value = c; o.textContent = c; curSel.appendChild(o); });\n    curRow.appendChild(curSel); partA.appendChild(curRow);\n    curSel.addEventListener(\"change\", function(){ var dc = byId(\"dCurrency\"); if (dc) dc.value = curSel.value; curSpans.forEach(function(s){ s.textContent = curSel.value; }); });\n    var list = el(\"div\", \"pn-roomlist\"); partA.appendChild(list);\n    var cards = [];\n    function renumber(){ cards.forEach(function(c, i){ c.__title.textContent = tr(\"Tip de cameră \", \"Room type \") + (i + 1); c.__rm.style.display = cards.length > 1 ? \"\" : \"none\"; }); }\n    function roomCard(rt){\n      rt = rt || {};\n      var card = el(\"div\", \"pn-subcard\");\n      var hd = el(\"div\", \"pn-roomhead\"); var tt = el(\"div\", \"pn-subcard-t\"); var ti = el(\"span\", \"pn-dd-ico\"); ti.innerHTML = I.bed; tt.appendChild(ti); var title = el(\"span\", null, \"\"); tt.appendChild(title); hd.appendChild(tt);\n      var rm = el(\"button\", \"pn-rm\", \"✕\"); rm.type = \"button\"; rm.setAttribute(\"aria-label\", tr(\"Șterge tipul de cameră\", \"Remove room type\"));\n      rm.addEventListener(\"click\", function(){ if (cards.length <= 1) return; card.remove(); cards.splice(cards.indexOf(card), 1); renumber(); notify(); });\n      hd.appendChild(rm); card.appendChild(hd);\n      var nmW = field(tr(\"Denumire tip cameră\", \"Room type name\")); var nm = textInput(rt.name, 80, tr(\"ex: Cameră dublă standard, Suită junior cu vedere la munte\", \"e.g. Standard double room, Junior suite with mountain view\")); nmW.appendChild(nm); card.appendChild(nmW);\n      var row = el(\"div\", \"pn-two2\");\n      var cW = field(tr(\"Număr camere de acest tip\", \"Rooms of this type\")); var cnt = numInput(rt.count || 1, 1, 500); cW.appendChild(cnt); row.appendChild(cW);\n      var pW = el(\"div\", \"pn-field\"); var pl = el(\"div\", \"pn-lbl\"); pl.appendChild(document.createTextNode(tr(\"Preț / noapte\", \"Price / night\") + \" (\")); var cs = el(\"span\", \"pn-cur\", curTxt()); pl.appendChild(cs); pl.appendChild(document.createTextNode(\")\")); curSpans.push(cs); pW.appendChild(pl);\n      var price = numInput(rt.price, 0, 1000000, \"0.01\"); pW.appendChild(price); row.appendChild(pW); card.appendChild(row);\n      var row2 = el(\"div\", \"pn-two2\");\n      var aW = field(tr(\"Adulți\", \"Adults\")); var ad = plainSelect([\"1\", \"2\", \"3\", \"4+\"], rt.adults || \"2\"); ad.className = \"acc-white-input\"; aW.appendChild(ad); row2.appendChild(aW);\n      var kW = field(tr(\"Copii\", \"Children\")); var ch = plainSelect([\"0\", \"1\", \"2\", \"3+\"], rt.children || \"0\"); ch.className = \"acc-white-input\"; kW.appendChild(ch); row2.appendChild(kW); card.appendChild(row2);\n      var spW = field(tr(\"Din câte încăperi este formată?\", \"How many rooms does it consist of?\"));\n      var nSp = (rt.spaces && rt.spaces.length > 1) ? rt.spaces.length : 1;\n      var spSel = plainSelect([\"1\", \"2\", \"3\"], String(nSp)); spSel.className = \"acc-white-input pn-count\"; spW.appendChild(spSel);\n      spW.appendChild(el(\"p\", \"acc-white-hint\", tr(\"Pentru un apartament din hotel alege 2 sau 3 și descrie fiecare încăpere: dormitor sau living, cu paturile ei.\", \"For an apartment inside the hotel choose 2 or 3 and describe each room: bedroom or living room, with its own beds.\"))); card.appendChild(spW);\n      // o singură încăpere: configurația de paturi de până acum\n      var bW = field(tr(\"Configurație paturi\", \"Bed setup\")); var bcol = el(\"div\", \"pn-col\"); var beds = [];\n      H.beds.forEach(function(b){ var t = tileCheck(I.bed, b.l, rt.beds && rt.beds.indexOf(b.k) !== -1 && !(rt.spaces && rt.spaces.length > 1), b.k); bcol.appendChild(t.node); beds.push(t.input); }); bW.appendChild(bcol); card.appendChild(bW);\n      // mai multe încăperi\n      var spBox = el(\"div\", \"pn-roomlist\"); card.appendChild(spBox); var spaceCards = [];\n      function spaceCard(i, sp){\n        sp = sp || {}; var sc = subCard(tr(\"Încăperea \", \"Room \") + (i + 1), I.bed);\n        var kW = field(tr(\"Tipul încăperii\", \"Room kind\")); var ks = document.createElement(\"select\"); ks.className = \"acc-white-input\";\n        [[\"dormitor\", tr(\"Dormitor\", \"Bedroom\")], [\"living\", tr(\"Living\", \"Living room\")]].forEach(function(o){ var op = document.createElement(\"option\"); op.value = o[0]; op.textContent = o[1]; ks.appendChild(op); }); ks.value = sp.kind === \"living\" ? \"living\" : \"dormitor\"; kW.appendChild(ks); sc.appendChild(kW);\n        var bw = field(tr(\"Configurație paturi\", \"Bed setup\")); var bc = el(\"div\", \"pn-col\"); var bs = [];\n        H.beds.forEach(function(b){ var t = tileCheck(I.bed, b.l, sp.beds && sp.beds.indexOf(b.k) !== -1, b.k); bc.appendChild(t.node); bs.push(t.input); }); bw.appendChild(bc); sc.appendChild(bw);\n        sc.__get = function(){ return { kind: ks.value, beds: bs.filter(function(x){ return x.checked; }).map(function(x){ return x.value; }) }; };\n        sc.addEventListener(\"change\", notify); return sc;\n      }\n      function syncSpaces(){\n        var n = parseInt(spSel.value, 10) || 1;\n        bW.style.display = n === 1 ? \"\" : \"none\"; spBox.style.display = n === 1 ? \"none\" : \"\";\n        if (n > 1) {\n          while (spaceCards.length < n) { var i = spaceCards.length; var init = (rt.spaces && rt.spaces[i]) || (i === 0 ? { kind: \"dormitor\", beds: beds.filter(function(x){ return x.checked; }).map(function(x){ return x.value; }) } : {}); var c2 = spaceCard(i, init); spaceCards.push(c2); spBox.appendChild(c2); }\n          while (spaceCards.length > n) spaceCards.pop().remove();\n        }\n        notify();\n      }\n      spSel.addEventListener(\"change\", syncSpaces); syncSpaces();\n      function getSpaces(){ return (parseInt(spSel.value, 10) || 1) > 1 ? spaceCards.map(function(c3){ return c3.__get(); }) : []; }\n      function getBeds(){ var sps = getSpaces(); if (sps.length) { var u = []; sps.forEach(function(s2){ s2.beds.forEach(function(k){ if (u.indexOf(k) === -1) u.push(k); }); }); return u; } return beds.filter(function(x){ return x.checked; }).map(function(x){ return x.value; }); }\n      var amW = field(tr(\"Facilități exclusive în această cameră\", \"Facilities exclusive to this room\")); var acol = el(\"div\", \"pn-col\"); var ams = [];\n      H.roomAmenities.forEach(function(a){ var t = tileCheck(a.icon, a.l, rt.amenities && rt.amenities.indexOf(a.k) !== -1, a.k); acol.appendChild(t.node); ams.push(t.input); }); amW.appendChild(acol); card.appendChild(amW);\n      var gW = field(tr(\"Galerie foto cameră (minim 3, maxim 6 poze)\", \"Room photo gallery (min. 3, max. 6 photos)\"));\n      gW.appendChild(el(\"p\", \"acc-white-hint\", tr(\"Încarcă fotografii făcute exclusiv în acest tip de cameră: patul, baia și priveliștea.\", \"Upload photos taken only in this room type: the bed, bathroom and view.\")));\n      var gal = gallery(rt.photos, H.roomPhotoMax); gW.appendChild(gal.node); card.appendChild(gW);\n      [nm, cnt, price, ad, ch].forEach(function(x){ x.addEventListener(\"input\", notify); x.addEventListener(\"change\", notify); });\n      card.addEventListener(\"change\", notify);\n      card.__title = title; card.__rm = rm;\n      card.__get = function(){ return { name: nm.value.trim(), count: toInt(cnt.value) || 1, adults: ad.value, children: ch.value,\n        beds: getBeds(), spaces: getSpaces(), amenities: ams.filter(function(x){ return x.checked; }).map(function(x){ return x.value; }), price: toNum(price.value), photos: gal.get() }; };\n      return card;\n    }\n    function addRoom(rt){ var c = roomCard(rt); cards.push(c); list.appendChild(c); renumber(); notify(); }\n    (d.roomTypes && d.roomTypes.length ? d.roomTypes : [{}]).forEach(addRoom);\n    var addBtn = el(\"button\", \"pn-add\", \"+ \" + tr(\"Adaugă tip de cameră\", \"Add room type\")); addBtn.type = \"button\";\n    addBtn.addEventListener(\"click\", function(){ addRoom({}); }); partA.appendChild(addBtn);\n\n    /* ---- Restaurant, mese și meniuri ---- */\n    partA.appendChild(el(\"div\", \"pn-sec-title\", tr(\"Restaurant, mese și meniuri\", \"Restaurant, meals & menus\")));\n    partA.appendChild(el(\"div\", \"pn-q\", tr(\"Aveți restaurant propriu în incinta hotelului?\", \"Do you have a restaurant on site?\")));\n    var rest = d.restaurant || {};\n    var rtwo = el(\"div\", \"pn-two\"); var ryes = optRow(\"radio\", \"hRest\", \"da\", tr(\"DA\", \"YES\"), !!rest.has, null), rno = optRow(\"radio\", \"hRest\", \"nu\", tr(\"NU\", \"NO\"), !rest.has, null);\n    rtwo.appendChild(ryes.node); rtwo.appendChild(rno.node); partA.appendChild(rtwo);\n    var rFl = fluid(!!rest.has); partA.appendChild(rFl.node);\n    var rIn = el(\"div\", \"pn-subcard pn-subcard-in\"); rFl.inner.appendChild(rIn);\n    var rnW = field(tr(\"Numele restaurantului (opțional)\", \"Restaurant name (optional)\")); var restName = textInput(rest.name, 120); rnW.appendChild(restName); rIn.appendChild(rnW);\n    var mW = field(tr(\"Tipuri de meniuri disponibile\", \"Menu types available\")); var mcol = el(\"div\", \"pn-col\"); var menus = [];\n    H.menus.forEach(function(m){ var t = tileCheck(H.icons.fork, m.l, rest.menus && rest.menus.indexOf(m.k) !== -1, m.k); mcol.appendChild(t.node); menus.push(t.input); }); mW.appendChild(mcol); rIn.appendChild(mW);\n    var mpW = field(tr(\"Regim de masă oferit pentru pachetele de cazare\", \"Meal plan offered with stays\")); var meal = selectOf(H.mealPlans, rest.mealPlan, tr(\"— alege —\", \"— choose —\")); meal.className = \"acc-white-input\"; mpW.appendChild(meal); rIn.appendChild(mpW);\n    var bfW = field(tr(\"Politica micului dejun\", \"Breakfast policy\")); var bf = radioCol(\"hBf\", [{ k: \"included\", l: tr(\"Inclus în prețul camerei\", \"Included in the room price\") }, { k: \"paid\", l: tr(\"Opțional (contra cost)\", \"Optional (extra charge)\") }], rest.breakfastPolicy || \"\"); bfW.appendChild(bf.node); rIn.appendChild(bfW);\n    var bfFl = fluid(rest.breakfastPolicy === \"paid\"); var bfp = el(\"div\", \"pn-field\"); var bpl = el(\"div\", \"pn-lbl\"); bpl.appendChild(document.createTextNode(tr(\"Preț mic dejun / persoană / zi\", \"Breakfast price / person / day\") + \" (\")); var bcs = el(\"span\", \"pn-cur\", curTxt()); bpl.appendChild(bcs); bpl.appendChild(document.createTextNode(\")\")); curSpans.push(bcs); bfp.appendChild(bpl);\n    var bfPrice = numInput(rest.breakfastPrice, 0, 10000, \"0.01\"); bfp.appendChild(bfPrice); bfFl.inner.appendChild(bfp); rIn.appendChild(bfFl.node);\n    var rgW = field(tr(\"Fotografii restaurant și preparate (maxim \", \"Restaurant & dishes photos (max. \") + H.restPhotoMax + tr(\" de poze)\", \" photos)\")); var restGal = gallery(rest.photos, H.restPhotoMax); rgW.appendChild(restGal.node); rIn.appendChild(rgW);\n    function syncRest(){ rFl.set(ryes.input.checked); bfFl.set(bf.get() === \"paid\"); }\n    [ryes.input, rno.input].forEach(function(x){ x.addEventListener(\"change\", syncRest); });\n    Object.keys(bf.inputs).forEach(function(k){ bf.inputs[k].addEventListener(\"change\", syncRest); });\n    partA.addEventListener(\"change\", notify); partA.addEventListener(\"input\", notify);\n\n    /* ---- Politici hoteliere (în root) ---- */\n    root.appendChild(el(\"div\", \"pn-sec-title\", tr(\"Politici hoteliere\", \"Hotel policies\")));\n    root.appendChild(el(\"div\", \"pn-lbl\", tr(\"Animale de companie\", \"Pets\"))); var pets = selectOf(H.pets, d.pets, tr(\"— alege —\", \"— choose —\")); pets.className = \"acc-white-input\"; root.appendChild(pets);\n    root.appendChild(el(\"div\", \"pn-lbl\", tr(\"Reguli privind liniștea\", \"Quiet rules\"))); var quiet = selectOf(H.quiet, d.quiet, tr(\"— alege —\", \"— choose —\")); quiet.className = \"acc-white-input\"; root.appendChild(quiet);\n    root.appendChild(el(\"p\", \"acc-white-hint\", tr(\"Ora de check-in și check-out se completează mai jos, la câmpurile obișnuite.\", \"Check-in and check-out times are filled in below, in the usual fields.\")));\n\n    /* ---- certificat + facilități ---- */\n    var certWrap = el(\"div\", \"pn-cert\"); certWrap.appendChild(el(\"div\", \"pn-lbl\", tr(\"Număr certificat de clasificare (opțional)\", \"Classification certificate number (optional)\")));\n    var cert = textInput(d.certificate, 60); certWrap.appendChild(cert);\n    var hotelFacChecks = {};\n\n    /* ---- adaptarea formularului ---- */\n    var saved = null, laidOut = false, tilesOrig = [], toggleOrig = null, gridOrig = null, facLabel = null, facLabelText = \"\", galLabel = null, galLabelText = \"\", galHint = null;\n    function nodesBetween(a, b){ var out = [], n = a; while (n) { out.push(n); if (n === b) break; n = n.nextElementSibling; } return out; }\n    function layoutHotel(){\n      var form = byId(\"detForm\"); if (!form || laidOut) return;\n      var age = form.querySelector(\".acc-age-policy-group\"), lDesc = form.querySelector('label[for=\"dDescription\"]'), lCity = form.querySelector('label[for=\"dCity\"]');\n      var addr = byId(\"dAddress\"), lOff = form.querySelector('label[for=\"dSpecialOffers\"]'), off = byId(\"dSpecialOffers\"), stars = byId(\"dStarsWrap\");\n      if (!age || !lDesc || !lCity || !addr || !lOff || !off || !stars || !byId(\"dCheckin\") || !byId(\"dEmail\")) return;\n      laidOut = true; saved = Array.prototype.slice.call(form.children);\n      var sAge = [age.previousElementSibling, age], sLoc = nodesBetween(lCity, addr), sDesc = nodesBetween(lDesc, lCity.previousElementSibling), sOff = [lOff, off];\n      var frag = document.createDocumentFragment(); frag.appendChild(certWrap);\n      [sAge, sLoc, [partA], sOff, sDesc].forEach(function(sec){ sec.forEach(function(n){ frag.appendChild(n); }); });\n      stars.parentNode.insertBefore(frag, stars.nextSibling);\n      var dc = byId(\"dCurrency\"); if (dc && (dc.value === \"RON\" || dc.value === \"EUR\")) curSel.value = dc.value;\n      curSpans.forEach(function(s){ s.textContent = curSel.value; });\n      var st = byId(\"dStars\"); if (st) {\n        var dz = el(\"div\", \"pn-daisies\"); dz.id = \"pnDaisies\"; st.parentNode.appendChild(dz);\n        var paint = function(){ var v = toInt(st.value); var h = \"\"; for (var i = 1; i <= 5; i++) h += \"<span>\" + starSvg(i <= v) + \"</span>\"; dz.innerHTML = h; };\n        st.addEventListener(\"change\", paint); paint();\n      }\n      // facilități: cele generale (aceleași căsuțe, mutate) în 3 grupuri + „Specifice hotelului”\n      var orig = byId(\"dAmenityOriginal\"), P = DEF.pension;\n      if (orig) {\n        gridOrig = orig.parentNode; tilesOrig = Array.prototype.slice.call(orig.querySelectorAll(\"label.acc-check-item\"));\n        toggleOrig = Array.prototype.filter.call(gridOrig.children, function(n){ return n.tagName === \"LABEL\"; })[0] || null;\n        var holder = el(\"div\", \"pn-facs\"); holder.id = \"pnFacGroups\"; var used = {};\n        P.facGroups.forEach(function(g){\n          var det = el(\"details\", \"pn-dd\"); var sm = el(\"summary\"); var left = el(\"span\", \"pn-dd-t\", g.title); sm.appendChild(left); det.appendChild(sm);\n          var body = el(\"div\", \"pn-fac\"); det.appendChild(body);\n          g.keys.forEach(function(k){ var t = tilesOrig.filter(function(x){ var i = x.querySelector(\"input.acc-amenity\"); return i && i.value === k; })[0]; if (t) { body.appendChild(t); used[k] = 1; } });\n          var upd = function(){ var n = body.querySelectorAll(\"input:checked\").length; left.textContent = g.title + (n ? \" (\" + n + \")\" : \"\"); };\n          body.addEventListener(\"change\", upd); upd(); holder.appendChild(det);\n        });\n        // grupul specific hotelului (se salvează în detaliile hotelului)\n        var hdet = el(\"details\", \"pn-dd\"); var hsm = el(\"summary\"); var hleft = el(\"span\", \"pn-dd-t\", tr(\"Specifice hotelului\", \"Hotel-specific\")); hsm.appendChild(hleft); hdet.appendChild(hsm);\n        var hbody = el(\"div\", \"pn-fac\"); hdet.appendChild(hbody);\n        H.facilities.forEach(function(x){ var t = tileCheck(x.icon, x.l, (d.facilities || []).indexOf(x.k) !== -1, x.k); hbody.appendChild(t.node); hotelFacChecks[x.k] = t.input; });\n        var hupd = function(){ var n = hbody.querySelectorAll(\"input:checked\").length; hleft.textContent = tr(\"Specifice hotelului\", \"Hotel-specific\") + (n ? \" (\" + n + \")\" : \"\"); };\n        hbody.addEventListener(\"change\", hupd); hupd(); holder.appendChild(hdet);\n        // plăcuțe rămase în afara grupurilor\n        tilesOrig.forEach(function(t){ var i = t.querySelector(\"input.acc-amenity\"); if (i && !used[i.value]) hbody.appendChild(t); });\n        gridOrig.parentNode.insertBefore(holder, gridOrig);\n        if (toggleOrig) { toggleOrig.classList.add(\"pn-other-toggle\"); gridOrig.parentNode.insertBefore(toggleOrig, gridOrig); }\n        gridOrig.style.display = \"none\";\n      }\n      [\"extAccessGrid\", \"extAmenitiesGrid\"].forEach(function(id){ var g = byId(id); if (g) { g.style.display = \"none\"; if (g.previousElementSibling && g.previousElementSibling.tagName === \"LABEL\") g.previousElementSibling.style.display = \"none\"; } });\n      var oi = byId(\"dOtherAmenityText\");\n      if (oi) {\n        oi.style.display = \"none\"; if (oi.previousElementSibling && oi.previousElementSibling.tagName === \"LABEL\") oi.previousElementSibling.textContent = tr(\"Scrie ce alte facilități oferi\", \"Write what other facilities you offer\");\n        var ta = el(\"textarea\", \"acc-white-input pn-other-ta\"); ta.id = \"pnOtherText\"; ta.rows = 4; ta.maxLength = 255; ta.placeholder = tr(\"ex. spălătorie, transfer aeroport, închiriere biciclete…\", \"e.g. laundry, airport transfer, bike rental…\"); ta.value = oi.value || \"\";\n        ta.addEventListener(\"input\", function(){ oi.value = ta.value; oi.dispatchEvent(new Event(\"input\", { bubbles: true })); });\n        oi.parentNode.insertBefore(ta, oi.nextSibling);\n      }\n      // galeria principală devine „Galerie spații comune”\n      var pin = byId(\"dPhotoInput\"); var pl = pin ? pin.closest(\"label\") : null;\n      if (pl && pl.previousElementSibling && pl.previousElementSibling.tagName === \"LABEL\") {\n        galLabel = pl.previousElementSibling; galLabelText = galLabel.textContent;\n        galLabel.textContent = tr(\"Galerie spații comune (maxim 24 de poze)\", \"Common areas gallery (max. 24 photos)\");\n        galHint = el(\"p\", \"acc-white-hint\", tr(\"Minim 2 fotografii, în plus față de poza principală. Pozele camerelor și ale restaurantului se adaugă la secțiunile lor.\", \"At least 2 photos, in addition to the main photo. Room and restaurant photos are added in their own sections.\")); galLabel.parentNode.insertBefore(galHint, galLabel.nextSibling);\n      }\n    }\n    function restoreHotel(){\n      var form = byId(\"detForm\"); if (!form || !laidOut) return;\n      var o = byId(\"dAmenityOriginal\"), h = byId(\"pnFacGroups\");\n      if (o) tilesOrig.forEach(function(t){ o.appendChild(t); });\n      if (gridOrig && toggleOrig) { gridOrig.appendChild(toggleOrig); toggleOrig.classList.remove(\"pn-other-toggle\"); gridOrig.style.display = \"\"; }\n      if (h) h.remove();\n      var dz = byId(\"pnDaisies\"); if (dz) dz.remove();\n      var ta = byId(\"pnOtherText\"); if (ta) ta.remove();\n      var oi = byId(\"dOtherAmenityText\"); if (oi) oi.style.display = \"\";\n      [\"extAccessGrid\", \"extAmenitiesGrid\"].forEach(function(id){ var g = byId(id); if (g) { g.style.display = \"\"; if (g.previousElementSibling && g.previousElementSibling.tagName === \"LABEL\") g.previousElementSibling.style.display = \"\"; } });\n      if (galLabel) galLabel.textContent = galLabelText; if (galHint && galHint.parentNode) galHint.remove();\n      [certWrap, partA].forEach(function(n){ if (n.parentNode) n.remove(); });\n      saved.forEach(function(n){ form.appendChild(n); });\n      laidOut = false;\n    }\n\n    return {\n      node: root,\n      mount: function(){ layoutHotel(); var oi = byId(\"dOtherAmenityText\"), ta = byId(\"pnOtherText\"); if (oi && ta) ta.value = oi.value || \"\"; syncRest(); },\n      unmount: function(){ restoreHotel(); },\n      collect: function(){\n        var has = ryes.input.checked;\n        var fac = []; Object.keys(hotelFacChecks).forEach(function(k){ if (hotelFacChecks[k].checked) fac.push(k); });\n        return {\n          subtype: subtype.value, seasonality: season.get() || \"permanent\", reception: reception.value, pets: pets.value, quiet: quiet.value,\n          certificate: cert.value.trim(), facilities: fac,\n          roomTypes: cards.map(function(c){ return c.__get(); }).filter(function(r){ return r.name; }),\n          restaurant: { has: has, name: has ? restName.value.trim() : \"\", menus: has ? menus.filter(function(x){ return x.checked; }).map(function(x){ return x.value; }) : [], mealPlan: has ? meal.value : \"\", breakfastPolicy: has ? bf.get() : \"\", breakfastPrice: (has && bf.get() === \"paid\") ? toNum(bfPrice.value) : null, photos: has ? restGal.get() : [] },\n        };\n      },\n      validate: function(){\n        var rts = cards.map(function(c){ return c.__get(); });\n        var named = rts.filter(function(r){ return r.name; });\n        if (!named.length) return tr(\"Adaugă cel puțin un tip de cameră, cu denumire.\", \"Add at least one room type, with a name.\");\n        for (var i = 0; i < named.length; i++) {\n          if (named[i].price == null || named[i].price <= 0) return tr(\"Completează prețul pe noapte pentru camera „\", \"Fill in the nightly price for room “\") + named[i].name + tr(\"”.\", \"”.\");\n          if (named[i].photos.length < 3) return tr(\"Camera „\", \"Room “\") + named[i].name + tr(\"” are nevoie de minim 3 fotografii (maxim 6).\", \"” needs at least 3 photos (max. 6).\");\n          var sps = named[i].spaces || [], livN = sps.filter(function(s3){ return s3.kind === \"living\"; }).length;\n          if (livN > 1) return tr(\"„\", \"“\") + named[i].name + tr(\"” poate avea cel mult un living.\", \"” can have at most one living room.\");\n          if (sps.length && livN === sps.length) return tr(\"„\", \"“\") + named[i].name + tr(\"” trebuie să aibă cel puțin un dormitor.\", \"” must have at least one bedroom.\");\n        }\n        return \"\";\n      },\n      derived: function(){\n        var rts = cards.map(function(c){ return c.__get(); }).filter(function(r){ return r.name; });\n        var rooms = 0, cap = 0, min = null;\n        rts.forEach(function(r){ rooms += r.count; cap += r.count * (toInt(r.adults) + toInt(r.children)); if (r.price > 0 && (min === null || r.price < min)) min = r.price; });\n        return { rooms: rooms, capacity: cap || rooms * 2, price: min };\n      },\n    };\n  }\n\n\n  /* ======================= CAMPING (v2: opțiuni care se deschid) ======================= */\n  function starSvg(on){ return \"<svg width='28' height='28' viewBox='0 0 24 24' aria-hidden='true' fill='\" + (on ? \"#f5a623\" : \"#eef1f6\") + \"' stroke='\" + (on ? \"#d98c00\" : \"#c9d3e2\") + \"' stroke-width='1.2' stroke-linejoin='round'><path d='M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.6 6.8 19.4l1-5.9L3.5 9.4l5.9-.8L12 3.2Z'/></svg>\"; }\n  function normalizeCamp(d){\n    d = d || {};\n    if (d.v === 2) return d;\n    var t = d.tents || {}, c = d.caravans || {};\n    var tp = t.priceSmall != null ? t.priceSmall : t.priceLarge;\n    return { v: 2, seasonality: d.seasonality, certificate: d.certificate,\n      tents: { on: (t.count > 0 || tp > 0), count: t.count, shade: \"\", price: tp, power: \"\" },\n      caravans: { on: (c.count > 0 || c.price > 0), count: c.count, price: c.price, priceFull: null, electric: c.electric, water: c.water, sewer: false },\n      units: d.units || {}, fees: d.fees || {}, facilities: d.facilities || [], pets: d.pets, quiet: d.quiet, vehicles: d.vehicles, photoGroups: d.photoGroups || {} };\n  }\n  function bigOpt(iconHtml, title, desc, checked){\n    var l = el(\"label\", \"pn-bigopt\"); var cb = document.createElement(\"input\"); cb.type = \"checkbox\"; cb.checked = !!checked; l.appendChild(cb);\n    var ic = el(\"span\", \"pn-opt-ico\"); ic.innerHTML = iconHtml; l.appendChild(ic);\n    var tx = el(\"span\"); tx.appendChild(el(\"span\", \"pn-bo-t\", title)); tx.appendChild(el(\"span\", \"pn-bo-d\", desc)); l.appendChild(tx);\n    return { node: l, input: cb };\n  }\n  function subCard(titleText, iconHtml){\n    var c = el(\"div\", \"pn-subcard\"); var h = el(\"div\", \"pn-subcard-t\");\n    if (iconHtml) { var i = el(\"span\", \"pn-dd-ico\"); i.innerHTML = iconHtml; h.appendChild(i); }\n    h.appendChild(el(\"span\", null, titleText)); c.appendChild(h); return c;\n  }\n  function tileCheck(iconHtml, label, checked, value){\n    var t = el(\"label\", \"acc-check-item pn-tile\"); var ti = el(\"span\", \"pn-opt-ico\"); ti.innerHTML = iconHtml || \"\"; t.appendChild(ti);\n    var cb = document.createElement(\"input\"); cb.type = \"checkbox\"; cb.checked = !!checked; if (value) cb.value = value; t.appendChild(cb); t.appendChild(el(\"span\", null, label));\n    return { node: t, input: cb };\n  }\n  function buildCamping(d0){\n    var d = normalizeCamp(d0), C = DEF.camp, I = C.icons;\n    var curSpans = [];\n    function curTxt(){ var dc = byId(\"dCurrency\"); return dc && dc.value ? dc.value : \"RON\"; }\n    function field(label){ var w = el(\"div\", \"pn-field\"); w.appendChild(el(\"div\", \"pn-lbl\", label)); return w; }\n    function campNum(label, value, min, max){ var w = field(label); var i = numInput(value, min, max); w.appendChild(i); return { node: w, input: i }; }\n    function campPrice(label, value){\n      var w = el(\"div\", \"pn-field\"); var l = el(\"div\", \"pn-lbl\"); l.appendChild(document.createTextNode(label + \" (\"));\n      var cs = el(\"span\", \"pn-cur\", curTxt()); l.appendChild(cs); l.appendChild(document.createTextNode(\")\")); curSpans.push(cs); w.appendChild(l);\n      var i = numInput(value, 0, 100000, \"0.01\"); w.appendChild(i); return { node: w, input: i };\n    }\n    function radioCol(name, items, value){\n      var col = el(\"div\", \"pn-col\"); var ins = {};\n      items.forEach(function(it){ var r = optRow(\"radio\", name, it.k, it.l, value === it.k, null); col.appendChild(r.node); ins[it.k] = r.input; });\n      return { node: col, get: function(){ var v = \"\"; Object.keys(ins).forEach(function(k){ if (ins[k].checked) v = k; }); return v; } };\n    }\n    var root = el(\"div\", \"acc-td-box\");            // „Politici și reguli interne” (stă după facilități)\n    var partA = el(\"div\", \"pn-camp-a\");           // date generale + locuri și tarife (stă sub localizare)\n    var partC = el(\"div\", \"pn-camp-c\");           // fotografii speciale (stau înaintea check-in)\n\n    /* ---- Partea A: date generale ---- */\n    partA.appendChild(el(\"div\", \"pn-sec-title\", tr(\"Date generale camping\", \"Campsite — general details\")));\n    partA.appendChild(el(\"div\", \"pn-q\", tr(\"Perioada de funcționare\", \"Operating period\")));\n    var season = radioCol(\"cSeason\", [{ k: \"permanent\", l: tr(\"Permanent (tot anul)\", \"Year-round\") }, { k: \"sezonier\", l: tr(\"Sezonier (de regulă mai – octombrie)\", \"Seasonal (usually May – October)\") }], d.seasonality || \"permanent\");\n    partA.appendChild(season.node);\n\n    /* ---- Locuri și tarife ---- */\n    partA.appendChild(el(\"div\", \"pn-sec-title\", tr(\"Locuri și tarife\", \"Pitches & rates\")));\n    var curRow = el(\"div\", \"pn-row\"); curRow.appendChild(el(\"span\", \"pn-q\", tr(\"Moneda tarifelor\", \"Rates currency\")));\n    var curSel = el(\"select\", \"acc-white-input pn-count\"); [\"RON\", \"EUR\"].forEach(function(c){ var o = document.createElement(\"option\"); o.value = c; o.textContent = c; curSel.appendChild(o); });\n    curRow.appendChild(curSel); partA.appendChild(curRow);\n    curSel.addEventListener(\"change\", function(){ var dc = byId(\"dCurrency\"); if (dc) dc.value = curSel.value; curSpans.forEach(function(s){ s.textContent = curSel.value; }); });\n    partA.appendChild(el(\"p\", \"acc-white-hint\", tr(\"Alege ce oferi. Pentru fiecare opțiune bifată se deschid detaliile ei.\", \"Choose what you offer. Each ticked option opens its details.\")));\n    var opts = el(\"div\", \"pn-opts\"); partA.appendChild(opts);\n\n    // 1) corturi proprii\n    var tents = d.tents || {};\n    var tOpt = bigOpt(I.tent, tr(\"Zonă de campare liberă\", \"Free camping area\"), tr(\"Locuri pentru corturi proprii\", \"Pitches for your own tents\"), tents.on);\n    var tFl = fluid(!!tents.on);\n    var tCard = subCard(tr(\"Zona de campare liberă — corturi proprii\", \"Free camping area — own tents\"), I.tentS);\n    var tCount = campNum(tr(\"Număr de locuri\", \"Number of pitches\"), tents.count, 0, 5000); tCard.appendChild(tCount.node);\n    var shW = field(tr(\"Tipul de umbră\", \"Shade type\")); var shade = selectOf(C.shade, tents.shade, tr(\"— alege —\", \"— choose —\")); shade.className = \"acc-white-input\"; shW.appendChild(shade); tCard.appendChild(shW);\n    var tPrice = campPrice(tr(\"Preț / noapte\", \"Price / night\"), tents.price); tCard.appendChild(tPrice.node);\n    var pwW = field(tr(\"Curentul electric este inclus în preț?\", \"Is electricity included in the price?\"));\n    var power = radioCol(\"cPower\", [{ k: \"da\", l: tr(\"Da, este inclus\", \"Yes, included\") }, { k: \"nu\", l: tr(\"Nu, se plătește separat\", \"No, charged separately\") }], tents.power || \"\"); pwW.appendChild(power.node); tCard.appendChild(pwW);\n    tFl.inner.appendChild(tCard); opts.appendChild(tOpt.node); opts.appendChild(tFl.node);\n\n    // 2) autorulote / caravane\n    var cv = d.caravans || {};\n    var cOpt = bigOpt(I.car, tr(\"Autorulote / caravane\", \"Campers / caravans\"), tr(\"Parcele pentru rulote și autorulote\", \"Plots for campers and caravans\"), cv.on);\n    var cFl = fluid(!!cv.on);\n    var cCard = subCard(tr(\"Autorulote / caravane\", \"Campers / caravans\"), I.carS);\n    var cCount = campNum(tr(\"Număr de parcele pentru rulote\", \"Number of camper plots\"), cv.count, 0, 5000); cCard.appendChild(cCount.node);\n    var cPrice = campPrice(tr(\"Tarif rulotă / autorulotă / noapte\", \"Camper / caravan / night\"), cv.price); cCard.appendChild(cPrice.node);\n    var cFull = campPrice(tr(\"Tarif rulotă / autorulotă / noapte — cu facilități incluse (curent, apă, evacuare apă gri)\", \"Camper / caravan / night — utilities included (electricity, water, grey-water drain)\"), cv.priceFull); cCard.appendChild(cFull.node);\n    cCard.appendChild(el(\"div\", \"pn-lbl\", tr(\"Facilități disponibile pe parcelă\", \"Utilities available at each plot\")));\n    var uEl = tileCheck(I.bolt, tr(\"Racord electric propriu (220V)\", \"Own electric hookup (220V)\"), cv.electric), uWa = tileCheck(I.drop, tr(\"Racord de apă potabilă\", \"Drinking-water hookup\"), cv.water), uSe = tileCheck(I.sewer, tr(\"Evacuare apă gri / canalizare\", \"Grey-water drain / sewer\"), cv.sewer);\n    cCard.appendChild(uEl.node); cCard.appendChild(uWa.node); cCard.appendChild(uSe.node);\n    cFl.inner.appendChild(cCard); opts.appendChild(cOpt.node); opts.appendChild(cFl.node);\n\n    // 3) unități fixe\n    var anyUnit = false; Object.keys(d.units || {}).forEach(function(k){ if (d.units[k] && d.units[k].has) anyUnit = true; });\n    var uOpt = bigOpt(I.home, tr(\"Unități fixe de închiriat\", \"Fixed units for rent\"), tr(\"Căsuțe, bungalouri sau corturi glamping\", \"Cabins, bungalows or glamping tents\"), anyUnit);\n    var uFl = fluid(anyUnit);\n    var uCard = subCard(tr(\"Unități fixe de închiriat\", \"Fixed units for rent\"), I.homeS);\n    uCard.appendChild(el(\"p\", \"acc-white-hint\", tr(\"Bifează tipurile pe care le ai. Fiecare tip bifat apare într-un tab propriu pe pagina ta, cu pozele lui.\", \"Tick the types you have. Each ticked type shows in its own tab on your page, with its photos.\")));\n    var unitCtl = {};\n    C.units.forEach(function(u){\n      var cur = (d.units && d.units[u.k]) || {};\n      var tile = tileCheck(u.icon, u.l, cur.has); uCard.appendChild(tile.node);\n      var fl = fluid(!!cur.has); var inner = el(\"div\", \"pn-subcard pn-subcard-in\"); inner.appendChild(el(\"div\", \"pn-subcard-t\", u.l));\n      var uc = campNum(tr(\"Număr total de unități\", \"Total number of units\"), cur.count, 1, 500); inner.appendChild(uc.node);\n      var bW = field(tr(\"Configurație paturi\", \"Bed setup\")); var bcol = el(\"div\", \"pn-col\"); var beds = [];\n      C.unitBeds.forEach(function(b){ var t2 = tileCheck(b.icon, b.l, cur.beds && cur.beds.indexOf(b.k) !== -1, b.k); bcol.appendChild(t2.node); beds.push(t2.input); }); bW.appendChild(bcol); inner.appendChild(bW);\n      var up = campNum(tr(\"Capacitate (persoane) / unitate\", \"Capacity (guests) / unit\"), cur.capacity, 1, 50); inner.appendChild(up.node);\n      var aW = field(tr(\"Facilități interioare\", \"Interior amenities\")); var acol = el(\"div\", \"pn-col\"); var ams = [];\n      C.unitAmenities.forEach(function(a){ var t3 = tileCheck(a.icon, a.l, cur.amenities && cur.amenities.indexOf(a.k) !== -1, a.k); acol.appendChild(t3.node); ams.push(t3.input); }); aW.appendChild(acol); inner.appendChild(aW);\n      var pr = campPrice(tr(\"Preț / noapte / unitate\", \"Price / night / unit\"), cur.price); inner.appendChild(pr.node);\n      var gW = field(tr(\"Galerie foto (minim \", \"Photo gallery (at least \") + u.minPhotos + tr(\", maxim \", \", at most \") + C.photoMax + tr(\" de poze)\", \" photos)\"));\n      var gal = gallery(cur.photos, C.photoMax); gW.appendChild(gal.node); inner.appendChild(gW);\n      fl.inner.appendChild(inner); uCard.appendChild(fl.node);\n      tile.input.addEventListener(\"change\", function(){ fl.set(tile.input.checked); if (tile.input.checked) { uOpt.input.checked = true; uFl.set(true); } syncExtra(); notify(); });\n      [uc.input, up.input, pr.input].forEach(function(x){ x.addEventListener(\"input\", notify); });\n      inner.addEventListener(\"change\", notify);\n      unitCtl[u.k] = { fl: fl, has: tile.input, count: uc.input, cap: up.input, price: pr.input, beds: beds, ams: ams, gal: gal, min: u.minPhotos, label: u.l };\n    });\n    uFl.inner.appendChild(uCard); opts.appendChild(uOpt.node); opts.appendChild(uFl.node);\n\n    // tarife suplimentare (apar după ce ai bifat cel puțin o opțiune)\n    var f = d.fees || {};\n    var xFl = fluid(false); var xCard = subCard(tr(\"Tarife suplimentare\", \"Extra fees\"), I.family);\n    var feeDefs = [[\"adult\", tr(\"Adult / noapte\", \"Adult / night\")], [\"child\", tr(\"Copil (3–12 ani) / noapte\", \"Child (3–12) / night\")], [\"car\", tr(\"Autoturism / noapte\", \"Car / night\")], [\"electric\", tr(\"Curent electric / zi\", \"Electricity / day\")], [\"pet\", tr(\"Animal de companie / noapte\", \"Pet / night\")]];\n    var feeInputs = {};\n    feeDefs.forEach(function(fd){ var p = campPrice(fd[1], f[fd[0]]); xCard.appendChild(p.node); feeInputs[fd[0]] = p.input; p.input.addEventListener(\"input\", notify); });\n    xFl.inner.appendChild(xCard); opts.appendChild(xFl.node);\n    function syncExtra(){\n      xFl.set(tOpt.input.checked || cOpt.input.checked || uOpt.input.checked);\n    }\n    tOpt.input.addEventListener(\"change\", function(){ tFl.set(tOpt.input.checked); syncExtra(); notify(); });\n    cOpt.input.addEventListener(\"change\", function(){ cFl.set(cOpt.input.checked); syncExtra(); notify(); });\n    uOpt.input.addEventListener(\"change\", function(){ uFl.set(uOpt.input.checked); if (!uOpt.input.checked) Object.keys(unitCtl).forEach(function(k){ unitCtl[k].has.checked = false; unitCtl[k].fl.set(false); }); syncExtra(); notify(); });\n    [tCount.input, tPrice.input, cCount.input, cPrice.input, cFull.input].forEach(function(x){ x.addEventListener(\"input\", notify); });\n    shade.addEventListener(\"change\", notify); partA.addEventListener(\"change\", notify);\n    syncExtra();\n\n    /* ---- Politici și reguli interne (în root) ---- */\n    root.appendChild(el(\"div\", \"pn-sec-title\", tr(\"Politici și reguli interne\", \"Policies & house rules\")));\n    root.appendChild(el(\"div\", \"pn-lbl\", tr(\"Animale de companie\", \"Pets\"))); var pets = selectOf(C.pets, d.pets, tr(\"— alege —\", \"— choose —\")); pets.className = \"acc-white-input\"; root.appendChild(pets);\n    root.appendChild(el(\"div\", \"pn-lbl\", tr(\"Regulament privind liniștea\", \"Quiet rules\"))); var quiet = selectOf(C.quiet, d.quiet, tr(\"— alege —\", \"— choose —\")); quiet.className = \"acc-white-input\"; root.appendChild(quiet);\n    root.appendChild(el(\"div\", \"pn-lbl\", tr(\"Dimensiune maximă vehicule\", \"Maximum vehicle size\"))); var veh = selectOf(C.vehicles, d.vehicles, tr(\"— alege —\", \"— choose —\")); veh.className = \"acc-white-input\"; root.appendChild(veh);\n\n    /* ---- Fotografii speciale (partea C) ---- */\n    partC.appendChild(el(\"p\", \"acc-white-hint\", tr(\"Pe lângă poza principală și galeria de mai sus: zona de campare, grupurile sanitare (contează mult pentru încredere) și zonele comune.\", \"In addition to the main photo and the gallery above: the camping area, the sanitary blocks (they matter a lot for trust) and the common areas.\")));\n    var pg = d.photoGroups || {};\n    partC.appendChild(el(\"div\", \"pn-lbl\", tr(\"Zona de campare liberă\", \"Free camping area\") + \" (\" + tr(\"maxim \", \"max \") + C.photoMax + \")\")); var gFree = gallery(pg.free, C.photoMax); partC.appendChild(gFree.node);\n    partC.appendChild(el(\"div\", \"pn-lbl\", tr(\"Grupuri sanitare comune\", \"Shared sanitary blocks\") + \" (\" + tr(\"maxim \", \"max \") + C.photoMax + \")\")); var gSan = gallery(pg.sanitary, C.photoMax); partC.appendChild(gSan.node);\n    partC.appendChild(el(\"div\", \"pn-lbl\", tr(\"Zone comune (bucătărie, foișor, grătar, joacă)\", \"Common areas (kitchen, gazebo, grill, playground)\") + \" (\" + tr(\"maxim \", \"max \") + C.photoMax + \")\")); var gCom = gallery(pg.common, C.photoMax); partC.appendChild(gCom.node);\n\n    /* ---- certificat + facilități comune: se montează în formular ---- */\n    var certWrap = el(\"div\", \"pn-cert\"); certWrap.appendChild(el(\"div\", \"pn-lbl\", tr(\"Număr certificat de clasificare (opțional)\", \"Classification certificate number (optional)\")));\n    var cert = textInput(d.certificate, 60); certWrap.appendChild(cert);\n    var facChecks = {};\n    function minPrice(){\n      var vals = [];\n      if (tOpt.input.checked) vals.push(toNum(tPrice.input.value));\n      if (cOpt.input.checked) vals.push(toNum(cPrice.input.value));\n      Object.keys(unitCtl).forEach(function(k){ if (unitCtl[k].has.checked) vals.push(toNum(unitCtl[k].price.value)); });\n      var v = vals.filter(function(x){ return x != null && x > 0; });\n      if (!v.length) { var ad = toNum(feeInputs.adult.value); return ad != null && ad > 0 ? ad : null; }\n      return Math.min.apply(null, v);\n    }\n\n    /* ---- adaptarea formularului (ordine, facilități, stele, galerie) ---- */\n    var saved = null, laidOut = false, tilesOrig = [], toggleOrig = null, gridOrig = null, facLabel = null, facLabelText = \"\", galLabel = null, galLabelText = \"\", galHint = null;\n    function nodesBetween(a, b){ var out = [], n = a; while (n) { out.push(n); if (n === b) break; n = n.nextElementSibling; } return out; }\n    function layoutCamp(){\n      var form = byId(\"detForm\"); if (!form || laidOut) return;\n      var age = form.querySelector(\".acc-age-policy-group\"), lDesc = form.querySelector('label[for=\"dDescription\"]'), lCity = form.querySelector('label[for=\"dCity\"]');\n      var addr = byId(\"dAddress\"), lOff = form.querySelector('label[for=\"dSpecialOffers\"]'), off = byId(\"dSpecialOffers\"), stars = byId(\"dStarsWrap\"), chk = form.querySelector('label[for=\"dCheckin\"]');\n      if (!age || !lDesc || !lCity || !addr || !lOff || !off || !stars || !chk || !byId(\"dEmail\")) return;   // DOM-ul nu e încă complet\n      laidOut = true; saved = Array.prototype.slice.call(form.children);\n      var sAge = [age.previousElementSibling, age], sLoc = nodesBetween(lCity, addr), sDesc = nodesBetween(lDesc, lCity.previousElementSibling), sOff = [lOff, off];\n      var frag = document.createDocumentFragment(); frag.appendChild(certWrap);\n      [sAge, sLoc, [partA], sOff, sDesc].forEach(function(sec){ sec.forEach(function(n){ frag.appendChild(n); }); });\n      stars.parentNode.insertBefore(frag, stars.nextSibling);\n      chk.parentNode.insertBefore(partC, chk);\n      var dc = byId(\"dCurrency\"); if (dc && (dc.value === \"RON\" || dc.value === \"EUR\")) curSel.value = dc.value;\n      curSpans.forEach(function(s){ s.textContent = curSel.value; });\n      // stele frumoase sub „Clasificare”\n      var st = byId(\"dStars\"); if (st) {\n        var dz = el(\"div\", \"pn-daisies\"); dz.id = \"pnDaisies\"; st.parentNode.appendChild(dz);\n        var paint = function(){ var v = toInt(st.value); var h = \"\"; for (var i = 1; i <= 5; i++) h += \"<span>\" + starSvg(i <= v) + \"</span>\"; dz.innerHTML = h; };\n        st.addEventListener(\"change\", paint); paint();\n      }\n      // facilități comune: trei dropdown-uri cu plăcuțe\n      var orig = byId(\"dAmenityOriginal\");\n      if (orig) {\n        gridOrig = orig.parentNode; tilesOrig = Array.prototype.slice.call(orig.querySelectorAll(\"label.acc-check-item\"));\n        toggleOrig = Array.prototype.filter.call(gridOrig.children, function(n){ return n.tagName === \"LABEL\"; })[0] || null;\n        facLabel = gridOrig.previousElementSibling; if (facLabel && facLabel.tagName === \"LABEL\") { facLabelText = facLabel.textContent; facLabel.textContent = tr(\"Facilități comune\", \"Common facilities\"); } else facLabel = null;\n        var holder = el(\"div\", \"pn-facs\"); holder.id = \"pnFacGroups\";\n        Object.keys(C.groups).forEach(function(g){\n          var det = el(\"details\", \"pn-dd\"); var sm = el(\"summary\"); var left = el(\"span\", \"pn-dd-t\", C.groups[g]); sm.appendChild(left); det.appendChild(sm);\n          var body = el(\"div\", \"pn-fac\"); det.appendChild(body);\n          C.facilities.filter(function(x){ return x.group === g; }).forEach(function(x){\n            var t = tileCheck(x.icon, x.l, (d.facilities || []).indexOf(x.k) !== -1, x.k); body.appendChild(t.node); facChecks[x.k] = t.input;\n          });\n          var upd = function(){ var n = body.querySelectorAll(\"input:checked\").length; left.textContent = C.groups[g] + (n ? \" (\" + n + \")\" : \"\"); };\n          body.addEventListener(\"change\", upd); upd(); holder.appendChild(det);\n        });\n        gridOrig.parentNode.insertBefore(holder, gridOrig);\n        if (toggleOrig) { toggleOrig.classList.add(\"pn-other-toggle\"); gridOrig.parentNode.insertBefore(toggleOrig, gridOrig); }\n        gridOrig.style.display = \"none\";\n      }\n      [\"extAccessGrid\", \"extAmenitiesGrid\"].forEach(function(id){ var g = byId(id); if (g) { g.style.display = \"none\"; if (g.previousElementSibling && g.previousElementSibling.tagName === \"LABEL\") g.previousElementSibling.style.display = \"none\"; } });\n      var oi = byId(\"dOtherAmenityText\");\n      if (oi) {\n        oi.style.display = \"none\"; if (oi.previousElementSibling && oi.previousElementSibling.tagName === \"LABEL\") oi.previousElementSibling.textContent = tr(\"Scrie ce alte facilități oferi\", \"Write what other facilities you offer\");\n        var ta = el(\"textarea\", \"acc-white-input pn-other-ta\"); ta.id = \"pnOtherText\"; ta.rows = 4; ta.maxLength = 255; ta.placeholder = tr(\"ex. închiriere biciclete, zonă pescuit, saună, tiroliană…\", \"e.g. bike rental, fishing area, sauna, zip line…\"); ta.value = oi.value || \"\";\n        ta.addEventListener(\"input\", function(){ oi.value = ta.value; oi.dispatchEvent(new Event(\"input\", { bubbles: true })); });\n        oi.parentNode.insertBefore(ta, oi.nextSibling);\n      }\n      // galeria principală: „maxim 24 de poze”\n      var pin = byId(\"dPhotoInput\"); var pl = pin ? pin.closest(\"label\") : null;\n      if (pl && pl.previousElementSibling && pl.previousElementSibling.tagName === \"LABEL\") {\n        galLabel = pl.previousElementSibling; galLabelText = galLabel.textContent;\n        galLabel.textContent = tr(\"Galerie foto (maxim 24 de poze)\", \"Photo gallery (max. 24 photos)\");\n        galHint = el(\"p\", \"acc-white-hint\", tr(\"Minim 2 fotografii, în plus față de poza principală.\", \"At least 2 photos, in addition to the main photo.\")); galLabel.parentNode.insertBefore(galHint, galLabel.nextSibling);\n      }\n    }\n    function restoreCamp(){\n      var form = byId(\"detForm\"); if (!form || !laidOut) return;\n      var o = byId(\"dAmenityOriginal\"), h = byId(\"pnFacGroups\");\n      if (o) tilesOrig.forEach(function(t){ o.appendChild(t); });\n      if (gridOrig && toggleOrig) { gridOrig.appendChild(toggleOrig); toggleOrig.classList.remove(\"pn-other-toggle\"); gridOrig.style.display = \"\"; }\n      if (h) h.remove();\n      if (facLabel) facLabel.textContent = facLabelText;\n      var dz = byId(\"pnDaisies\"); if (dz) dz.remove();\n      var ta = byId(\"pnOtherText\"); if (ta) ta.remove();\n      var oi = byId(\"dOtherAmenityText\"); if (oi) oi.style.display = \"\";\n      [\"extAccessGrid\", \"extAmenitiesGrid\"].forEach(function(id){ var g = byId(id); if (g) { g.style.display = \"\"; if (g.previousElementSibling && g.previousElementSibling.tagName === \"LABEL\") g.previousElementSibling.style.display = \"\"; } });\n      if (galLabel) galLabel.textContent = galLabelText; if (galHint && galHint.parentNode) galHint.remove();\n      [certWrap, partA, partC].forEach(function(n){ if (n.parentNode) n.remove(); });\n      saved.forEach(function(n){ form.appendChild(n); });\n      laidOut = false;\n    }\n\n    return {\n      node: root,\n      mount: function(){ layoutCamp(); var oi = byId(\"dOtherAmenityText\"), ta = byId(\"pnOtherText\"); if (oi && ta) ta.value = oi.value || \"\"; },\n      unmount: function(){ restoreCamp(); },\n      collect: function(){\n        var units = {};\n        Object.keys(unitCtl).forEach(function(k){ var u = unitCtl[k]; if (u.has.checked) units[k] = { has: true, count: toInt(u.count.value) || 1, capacity: toInt(u.cap.value) || 2,\n          beds: u.beds.filter(function(x){ return x.checked; }).map(function(x){ return x.value; }), amenities: u.ams.filter(function(x){ return x.checked; }).map(function(x){ return x.value; }), price: toNum(u.price.value), photos: u.gal.get() }; });\n        var fac = []; Object.keys(facChecks).forEach(function(k){ if (facChecks[k].checked) fac.push(k); });\n        var fees = {}; Object.keys(feeInputs).forEach(function(k){ fees[k] = toNum(feeInputs[k].value); });\n        return {\n          v: 2, seasonality: season.get() || \"permanent\", certificate: cert.value.trim(),\n          tents: { on: tOpt.input.checked, count: toInt(tCount.input.value), shade: shade.value, price: toNum(tPrice.input.value), power: power.get() },\n          caravans: { on: cOpt.input.checked, count: toInt(cCount.input.value), price: toNum(cPrice.input.value), priceFull: toNum(cFull.input.value), electric: uEl.input.checked, water: uWa.input.checked, sewer: uSe.input.checked },\n          units: units, fees: fees, facilities: fac, pets: pets.value, quiet: quiet.value, vehicles: veh.value,\n          photoGroups: { free: gFree.get(), sanitary: gSan.get(), common: gCom.get() },\n        };\n      },\n      validate: function(){\n        var keys = Object.keys(unitCtl), anyU = keys.some(function(k){ return unitCtl[k].has.checked; });\n        if (!tOpt.input.checked && !cOpt.input.checked && !anyU) return tr(\"Alege cel puțin o opțiune: zonă de campare, autorulote sau unități fixe.\", \"Choose at least one option: camping area, campers or fixed units.\");\n        if (tOpt.input.checked && !(toInt(tCount.input.value) > 0 && toNum(tPrice.input.value) > 0)) return tr(\"Completează numărul de locuri și prețul pentru zona de campare.\", \"Fill in the number of pitches and the price for the camping area.\");\n        if (cOpt.input.checked && !(toInt(cCount.input.value) > 0 && toNum(cPrice.input.value) > 0)) return tr(\"Completează numărul de parcele și tariful pentru autorulote.\", \"Fill in the number of plots and the rate for campers.\");\n        for (var i = 0; i < keys.length; i++) {\n          var u = unitCtl[keys[i]]; if (!u.has.checked) continue;\n          if (toNum(u.price.value) == null || toNum(u.price.value) <= 0) return tr(\"Completează prețul pentru: \", \"Fill in the price for: \") + u.label;\n          if (u.gal.get().length < u.min) return tr(\"Pentru „\", \"For “\") + u.label + tr(\"” sunt necesare minim \", \"” at least \") + u.min + tr(\" fotografii.\", \" photos are required.\");\n        }\n        return \"\";\n      },\n      derived: function(){\n        var rooms = 0, cap = 0;\n        if (tOpt.input.checked) { rooms += toInt(tCount.input.value); cap += toInt(tCount.input.value) * 3; }\n        if (cOpt.input.checked) { rooms += toInt(cCount.input.value); cap += toInt(cCount.input.value) * 4; }\n        Object.keys(unitCtl).forEach(function(k){ var u = unitCtl[k]; if (u.has.checked) { rooms += toInt(u.count.value) || 1; cap += (toInt(u.count.value) || 1) * (toInt(u.cap.value) || 2); } });\n        return { rooms: Math.max(1, rooms), capacity: Math.max(1, cap), price: minPrice() };\n      },\n    };\n  }\n\n\n  /* ======================= PENSIUNE / CABANĂ / A-FRAME (v3: o singură unitate) ======================= */\n  function byId(id){ return document.getElementById(id); }\n  function daisySvg(on){\n    var petal = on ? \"#ffffff\" : \"#f4f7fb\", stroke = on ? \"#1a1f35\" : \"#c9d3e2\", center = on ? \"#f4b400\" : \"#e1e7f0\", p = \"\";\n    for (var a = 0; a < 360; a += 45) { p += \"<ellipse cx='12' cy='5.4' rx='2.2' ry='3.7'\" + (a ? \" transform='rotate(\" + a + \" 12 12)'\" : \"\") + \"/>\"; }\n    return \"<svg width='30' height='30' viewBox='0 0 24 24' aria-hidden='true'><g fill='\" + petal + \"' stroke='\" + stroke + \"' stroke-width='1.2' stroke-linejoin='round'>\" + p + \"</g><circle cx='12' cy='12' r='2.7' fill='\" + center + \"' stroke='\" + stroke + \"' stroke-width='1'/></svg>\";\n  }\n  function optRow(type, name, value, label, checked, iconHtml){\n    var l = el(\"label\", \"pn-opt\");\n    var i = document.createElement(\"input\"); i.type = type; if (name) i.name = name; i.value = value; if (checked) i.checked = true;\n    if (iconHtml) { var w = el(\"span\", \"pn-opt-ico\"); w.innerHTML = iconHtml; l.appendChild(w); }\n    l.appendChild(i); l.appendChild(el(\"span\", null, label));\n    return { node: l, input: i };\n  }\n  // dropdown (details) cu rânduri bifabile; titlul arată câte sunt bifate\n  function ddRows(title, iconHtml, items, selected, opts){\n    opts = opts || {};\n    var det = el(\"details\", \"pn-dd\");\n    var sum = el(\"summary\"); var left = el(\"span\", \"pn-dd-t\");\n    if (iconHtml) { var w = el(\"span\", \"pn-dd-ico\"); w.innerHTML = iconHtml; left.appendChild(w); }\n    var tt = el(\"span\", null, title); left.appendChild(tt); sum.appendChild(left); det.appendChild(sum);\n    var body = el(\"div\", \"pn-dd-body\"); det.appendChild(body);\n    var inputs = [];\n    items.forEach(function(it){ var r = optRow(\"checkbox\", null, it.k, it.l, selected && selected.indexOf(it.k) !== -1, null); body.appendChild(r.node); inputs.push(r.input); });\n    function upd(){ var n = inputs.filter(function(x){ return x.checked; }).length; tt.textContent = title + (n ? \" (\" + n + \")\" : \"\"); }\n    body.addEventListener(\"change\", upd); upd();\n    return { node: det, body: body, get: function(){ return inputs.filter(function(x){ return x.checked; }).map(function(x){ return x.value; }); } };\n  }\n  function fluid(open){ var f = el(\"div\", \"pn-fluid\" + (open ? \" is-open\" : \"\")); var inner = el(\"div\"); f.appendChild(inner); return { node: f, inner: inner, set: function(o){ f.classList.toggle(\"is-open\", !!o); } }; }\n  function seatSelect(value){\n    var s = el(\"select\", \"acc-white-input pn-seat\");\n    for (var i = 1; i <= 20; i++) { var o = document.createElement(\"option\"); o.value = String(i); o.textContent = String(i); if (value === i) o.selected = true; s.appendChild(o); }\n    return s;\n  }\n\n  function buildPension(d, legacy){\n    var P = DEF.pension;\n    d = d || {};\n    var rooms = (d.bedrooms && d.bedrooms.length) ? d.bedrooms : [{}];\n    var lv = d.living || {};\n    var root = el(\"div\", \"acc-td-box\");\n\n    /* ---- Configurare camere ---- */\n    root.appendChild(el(\"div\", \"pn-sec-title\", tr(\"Configurare camere\", \"Rooms setup\")));\n    var row = el(\"div\", \"pn-row\"); row.appendChild(el(\"span\", \"pn-q\", tr(\"Câte dormitoare?\", \"How many bedrooms?\")));\n    var count = el(\"select\", \"acc-white-input pn-count\");\n    for (var n = 1; n <= 8; n++) { var o = document.createElement(\"option\"); o.value = String(n); o.textContent = String(n); count.appendChild(o); }\n    count.value = String(Math.min(8, Math.max(1, rooms.length))); row.appendChild(count); root.appendChild(row);\n    var list = el(\"div\"); root.appendChild(list);\n    var cards = [];\n    function bedroomCard(br, idx){\n      br = br || {};\n      var card = el(\"div\", \"pn-card\");\n      var beds = ddRows(tr(\"Dormitor \", \"Bedroom \") + (idx + 1), P.icons.bed, P.beds, br.beds);\n      var am = ddRows(tr(\"Dotări dormitor\", \"Bedroom amenities\"), P.icons.tv, P.bedroomAmenities, br.amenities);\n      var det = el(\"details\", \"pn-dd\"); var sum = el(\"summary\"); var left = el(\"span\", \"pn-dd-t\");\n      var w = el(\"span\", \"pn-dd-ico\"); w.innerHTML = P.icons.bath; left.appendChild(w); left.appendChild(el(\"span\", null, tr(\"Baie\", \"Bathroom\"))); sum.appendChild(left); det.appendChild(sum);\n      var body = el(\"div\", \"pn-dd-body\"); det.appendChild(body);\n      var bath = br.bath || {};\n      var grp = \"pnbath\" + (++groupCounter);\n      var rr = el(\"div\", \"pn-two\");\n      var rp = optRow(\"radio\", grp, \"private\", P.bathTypes[0].l, (bath.type || \"private\") === \"private\", null);\n      var rh = optRow(\"radio\", grp, \"hall\", P.bathTypes[1].l, bath.type === \"hall\", null);\n      rr.appendChild(rp.node); rr.appendChild(rh.node); body.appendChild(rr);\n      body.appendChild(el(\"div\", \"pn-mini\", tr(\"Dotări baie (la ambele variante)\", \"Bathroom amenities (for both options)\")));\n      var bam = []; P.bathAmenities.forEach(function(it){ var r = optRow(\"checkbox\", null, it.k, it.l, bath.amenities && bath.amenities.indexOf(it.k) !== -1, null); body.appendChild(r.node); bam.push(r.input); });\n      card.appendChild(beds.node); card.appendChild(am.node); card.appendChild(det);\n      card.__beds = beds; card.__am = am; card.__title = beds.node.querySelector(\"summary .pn-dd-t span:last-child\");\n      card.__get = function(){\n        return { beds: beds.get(), amenities: am.get(), bath: { type: rh.input.checked ? \"hall\" : \"private\", amenities: bam.filter(function(x){ return x.checked; }).map(function(x){ return x.value; }) } };\n      };\n      card.addEventListener(\"change\", notify);\n      return card;\n    }\n    function syncCount(){\n      var n = toInt(count.value) || 1;\n      while (cards.length < n) { var c = bedroomCard(rooms[cards.length], cards.length); cards.push(c); list.appendChild(c); }\n      while (cards.length > n) { cards.pop().remove(); }\n      notify();\n    }\n    count.addEventListener(\"change\", syncCount); syncCount();\n\n    /* ---- Living ---- */\n    root.appendChild(el(\"div\", \"pn-sec-title\", tr(\"Zona de living / spațiu de zi\", \"Living area\")));\n    root.appendChild(el(\"div\", \"pn-q\", tr(\"Are această unitate living?\", \"Does this unit have a living area?\")));\n    var lgrp = \"pnliving\" + (++groupCounter);\n    var two = el(\"div\", \"pn-two\");\n    var yes = optRow(\"radio\", lgrp, \"da\", tr(\"DA\", \"YES\"), lv.has === true, null), no = optRow(\"radio\", lgrp, \"nu\", tr(\"NU\", \"NO\"), lv.has !== true, null);\n    two.appendChild(yes.node); two.appendChild(no.node); root.appendChild(two);\n    var livFluid = fluid(lv.has === true); root.appendChild(livFluid.node);\n    var livBox = el(\"details\", \"pn-dd\"); var lsum = el(\"summary\"); lsum.appendChild(el(\"span\", \"pn-dd-t\", tr(\"Dotări living\", \"Living area amenities\"))); livBox.appendChild(lsum);\n    var lbody = el(\"div\", \"pn-dd-body\"); livBox.appendChild(lbody); livFluid.inner.appendChild(el(\"div\", \"pn-gap\"));\n    livFluid.inner.appendChild(livBox);\n    var items = lv.items || [];\n    var checks = {};   // k -> input\n    var seatSel = seatSelect(lv.diningSeats), seatFl = fluid(false);\n    var fireFl = fluid(false), fireChecks = {};\n    P.livingGroups.forEach(function(g){\n      var t = el(\"div\", \"pn-grp-title\"); var gi = el(\"span\", \"pn-dd-ico\"); gi.innerHTML = g.icon; t.appendChild(gi); t.appendChild(el(\"span\", null, g.title)); lbody.appendChild(t);\n      g.items.forEach(function(it){\n        var tile = el(\"label\", \"acc-check-item pn-tile\"); var ti = el(\"span\", \"pn-opt-ico\"); ti.innerHTML = it.icon; tile.appendChild(ti);\n        var cb = document.createElement(\"input\"); cb.type = \"checkbox\"; cb.value = it.k; cb.checked = items.indexOf(it.k) !== -1; checks[it.k] = cb; tile.appendChild(cb); tile.appendChild(el(\"span\", null, it.l));\n        lbody.appendChild(tile);\n        if (it.k === \"masa\") {\n          var sr = el(\"div\", \"pn-sub\"); sr.appendChild(el(\"span\", \"pn-q\", tr(\"Câte locuri la masă?\", \"How many seats at the table?\"))); sr.appendChild(seatSel); seatFl.inner.appendChild(sr); lbody.appendChild(seatFl.node);\n          cb.addEventListener(\"change\", function(){ seatFl.set(cb.checked); });\n        }\n        if (it.k === \"semineu\") {\n          var fr = el(\"div\", \"pn-sub\"); fr.appendChild(el(\"span\", \"pn-q\", tr(\"Ce fel de șemineu?\", \"What kind of fireplace?\")));\n          var fw = el(\"div\", \"pn-two\"); P.fireplaceTypes.forEach(function(ft){ var r = optRow(\"checkbox\", null, ft.k, ft.l, lv.fireplace && lv.fireplace.indexOf(ft.k) !== -1, null); fireChecks[ft.k] = r.input; fw.appendChild(r.node); });\n          fr.appendChild(fw); fireFl.inner.appendChild(fr); lbody.appendChild(fireFl.node);\n          cb.addEventListener(\"change\", function(){ fireFl.set(cb.checked); });\n        }\n        if (it.k === \"sofa_colt\") cb.addEventListener(\"change\", function(){ if (cb.checked && checks.sofa_ext) checks.sofa_ext.checked = false; });\n        if (it.k === \"sofa_ext\") cb.addEventListener(\"change\", function(){ if (cb.checked && checks.sofa_colt) checks.sofa_colt.checked = false; });\n      });\n    });\n    seatFl.set(!!(checks.masa && checks.masa.checked)); fireFl.set(!!(checks.semineu && checks.semineu.checked));\n    function syncLiving(){ livFluid.set(yes.input.checked); }\n    yes.input.addEventListener(\"change\", syncLiving); no.input.addEventListener(\"change\", syncLiving);\n\n    /* ---- Cum se închiriază + tarife (folosește câmpurile de preț existente) ---- */\n    var priceBox = el(\"div\", \"acc-td-box\");\n    priceBox.appendChild(el(\"div\", \"pn-sec-title\", tr(\"Cum se închiriază?\", \"How is it rented?\")));\n    var modeSel = selectOf(P.rentalModes, d.rentalMode || \"\", tr(\"Selectează opțiunea...\", \"Select an option...\"));\n    modeSel.className = \"acc-white-input\"; priceBox.appendChild(modeSel);\n    var hRoom = el(\"div\", \"pn-grp-title\"), hProp = el(\"div\", \"pn-grp-title\");\n    var i1 = el(\"span\", \"pn-dd-ico\"); i1.innerHTML = P.icons.bed; hRoom.appendChild(i1); hRoom.appendChild(el(\"span\", null, tr(\"Camere individual\", \"Individual rooms\")));\n    var i2 = el(\"span\", \"pn-dd-ico\"); i2.innerHTML = P.icons.home; hProp.appendChild(i2); hProp.appendChild(el(\"span\", null, tr(\"Toată proprietatea\", \"Whole property\")));\n    function lbl(forId, text){ var l = document.querySelector('label[for=\"' + forId + '\"]'); if (l) l.textContent = text; }\n    function syncMode(){\n      var m = modeSel.value, rw = byId(\"dPriceRoomWrap\"), pw = byId(\"dPricePropertyWrap\");\n      var showRoom = (m === \"camere\" || m === \"hibrid\"), showProp = (m === \"integral\" || m === \"hibrid\");\n      if (rw) rw.style.display = showRoom ? \"block\" : \"none\";\n      if (pw) pw.style.display = showProp ? \"block\" : \"none\";\n      hRoom.style.display = showRoom ? \"flex\" : \"none\"; hProp.style.display = showProp ? \"flex\" : \"none\";\n      var perRoom = tr(\" / cameră\", \" / room\"), whole = m === \"hibrid\" ? tr(\" / toată proprietatea\", \" / whole property\") : \"\";\n      lbl(\"dPrice\", tr(\"Preț / noapte\", \"Price / night\") + perRoom + \" — \" + tr(\"în timpul săptămânii\", \"on weekdays\"));\n      lbl(\"dPriceWeekend\", tr(\"Preț / noapte\", \"Price / night\") + perRoom + \" — \" + tr(\"în weekend\", \"at weekends\"));\n      lbl(\"dPricePerProperty\", tr(\"Preț / noapte\", \"Price / night\") + whole + \" — \" + tr(\"în timpul săptămânii\", \"on weekdays\"));\n      lbl(\"dPricePropWeekend\", tr(\"Preț / noapte\", \"Price / night\") + whole + \" — \" + tr(\"în weekend\", \"at weekends\"));\n      notify();\n    }\n    modeSel.addEventListener(\"change\", syncMode);\n\n    /* ---- adaptarea formularului (ordine, facilități, margarete) ---- */\n    var saved = null, tilesOrig = [], toggleOrig = null, gridOrig = null, laidOut = false;\n    function nodesBetween(a, b){ var out = [], n = a; while (n) { out.push(n); if (n === b) break; n = n.nextElementSibling; } return out; }\n    function layoutForm(){\n      var form = byId(\"detForm\"); if (!form || laidOut) return;\n      var age = form.querySelector(\".acc-age-policy-group\"), lDesc = form.querySelector('label[for=\"dDescription\"]'), lCity = form.querySelector('label[for=\"dCity\"]');\n      var addr = byId(\"dAddress\"), cap = byId(\"dCapRoomsWrap\"), root1 = byId(\"pensionPriceRoot\"), pr = byId(\"dPriceRoomWrap\"), pp = byId(\"dPricePropertyWrap\"), lOff = form.querySelector('label[for=\"dSpecialOffers\"]'), off = byId(\"dSpecialOffers\"), stars = byId(\"dStarsWrap\");\n      if (!age || !lDesc || !lCity || !addr || !cap || !root1 || !pr || !pp || !lOff || !off || !stars || !byId(\"dCheckin\") || !byId(\"dEmail\")) return;   // DOM-ul nu e încă complet\n      laidOut = true;\n      saved = Array.prototype.slice.call(form.children);\n      var sAge = [age.previousElementSibling, age], sLoc = nodesBetween(lCity, addr), sDesc = nodesBetween(lDesc, lCity.previousElementSibling), sOff = [lOff, off];\n      var frag = document.createDocumentFragment();\n      [sAge, sLoc, [cap], [root1, pr, pp], sOff, sDesc].forEach(function(sec){ sec.forEach(function(n){ frag.appendChild(n); }); });\n      stars.parentNode.insertBefore(frag, stars.nextSibling);\n      // capacitate: rămâne câmpul de persoane; numărul de camere vine din dormitoare\n      var lr = form.querySelector('label[for=\"dRooms\"]'), ir = byId(\"dRooms\"); if (lr) lr.style.display = \"none\"; if (ir) { ir.style.display = \"none\"; ir.required = false; }\n      priceBox.parentNode || root1.appendChild(priceBox);\n      pr.parentNode.insertBefore(hRoom, pr); pp.parentNode.insertBefore(hProp, pp);\n      // margarete frumoase sub „Clasificare”\n      var st = byId(\"dStars\"); if (st) {\n        var dz = el(\"div\", \"pn-daisies\"); dz.id = \"pnDaisies\"; st.parentNode.appendChild(dz);\n        var paint = function(){ var v = toInt(st.value); var h = \"\"; for (var i = 1; i <= 5; i++) h += \"<span>\" + daisySvg(i <= v) + \"</span>\"; dz.innerHTML = h; };\n        st.addEventListener(\"change\", paint); paint();\n      }\n      // facilități: trei dropdown-uri cu plăcuțe (aceleași căsuțe, mutate — starea rămâne)\n      var orig = byId(\"dAmenityOriginal\");\n      if (orig) {\n        gridOrig = orig.parentNode; tilesOrig = Array.prototype.slice.call(orig.querySelectorAll(\"label.acc-check-item\"));\n        toggleOrig = Array.prototype.filter.call(gridOrig.children, function(n){ return n.tagName === \"LABEL\"; })[0] || null;\n        var holder = el(\"div\", \"pn-facs\"); holder.id = \"pnFacGroups\"; var used = {};\n        P.facGroups.forEach(function(g, gi){\n          var det = el(\"details\", \"pn-dd\"); var sm = el(\"summary\"); var left = el(\"span\", \"pn-dd-t\", g.title); sm.appendChild(left); det.appendChild(sm);\n          var body = el(\"div\", \"pn-fac\"); det.appendChild(body);\n          g.keys.forEach(function(k){ var t = tilesOrig.filter(function(x){ var i = x.querySelector(\"input.acc-amenity\"); return i && i.value === k; })[0]; if (t) { body.appendChild(t); used[k] = 1; } });\n          if (gi === P.facGroups.length - 1) tilesOrig.forEach(function(t){ var i = t.querySelector(\"input.acc-amenity\"); if (i && !used[i.value]) body.appendChild(t); });\n          var upd = function(){ var n = body.querySelectorAll(\"input:checked\").length; left.textContent = g.title + (n ? \" (\" + n + \")\" : \"\"); };\n          body.addEventListener(\"change\", upd); upd(); holder.appendChild(det);\n        });\n        gridOrig.parentNode.insertBefore(holder, gridOrig);\n        if (toggleOrig) { toggleOrig.classList.add(\"pn-other-toggle\"); gridOrig.parentNode.insertBefore(toggleOrig, gridOrig); }\n        gridOrig.style.display = \"none\";\n      }\n      // „Alte facilități”: o casetă de scris (în loc de grilele de exterior)\n      [\"extAccessGrid\", \"extAmenitiesGrid\"].forEach(function(id){ var g = byId(id); if (g) { g.style.display = \"none\"; if (g.previousElementSibling && g.previousElementSibling.tagName === \"LABEL\") g.previousElementSibling.style.display = \"none\"; } });\n      var oi = byId(\"dOtherAmenityText\");\n      if (oi) {\n        oi.style.display = \"none\"; if (oi.previousElementSibling && oi.previousElementSibling.tagName === \"LABEL\") oi.previousElementSibling.textContent = tr(\"Scrie ce alte facilități oferi\", \"Write what other facilities you offer\");\n        var ta = el(\"textarea\", \"acc-white-input pn-other-ta\"); ta.id = \"pnOtherText\"; ta.rows = 4; ta.maxLength = 255; ta.placeholder = tr(\"ex. foișor, hamac, bicicletă de închiriat, tiroliană…\", \"e.g. gazebo, hammock, bike rental, zip line…\"); ta.value = oi.value || \"\";\n        ta.addEventListener(\"input\", function(){ oi.value = ta.value; oi.dispatchEvent(new Event(\"input\", { bubbles: true })); });\n        oi.parentNode.insertBefore(ta, oi.nextSibling);\n      }\n    }\n    function restoreForm(){\n      var form = byId(\"detForm\"); if (!form || !laidOut) return;\n      var o = byId(\"dAmenityOriginal\"), h = byId(\"pnFacGroups\");\n      if (o) tilesOrig.forEach(function(t){ o.appendChild(t); });\n      if (gridOrig && toggleOrig) { gridOrig.appendChild(toggleOrig); toggleOrig.classList.remove(\"pn-other-toggle\"); gridOrig.style.display = \"\"; }\n      if (h) h.remove();\n      var dz = byId(\"pnDaisies\"); if (dz) dz.remove();\n      var ta = byId(\"pnOtherText\"); if (ta) ta.remove();\n      var oi = byId(\"dOtherAmenityText\"); if (oi) oi.style.display = \"\";\n      [\"extAccessGrid\", \"extAmenitiesGrid\"].forEach(function(id){ var g = byId(id); if (g) { g.style.display = \"\"; if (g.previousElementSibling && g.previousElementSibling.tagName === \"LABEL\") g.previousElementSibling.style.display = \"\"; } });\n      if (hRoom.parentNode) hRoom.remove(); if (hProp.parentNode) hProp.remove();\n      var lr = form.querySelector('label[for=\"dRooms\"]'), ir = byId(\"dRooms\"); if (lr) lr.style.display = \"\"; if (ir) { ir.style.display = \"\"; ir.required = true; }\n      saved.forEach(function(n){ form.appendChild(n); });\n      laidOut = false;\n    }\n\n    return {\n      node: root,\n      mount: function(){\n        var host = byId(\"pensionPriceRoot\"); if (host && !priceBox.parentNode) host.appendChild(priceBox);\n        layoutForm();\n        var oi = byId(\"dOtherAmenityText\"), ta = byId(\"pnOtherText\"); if (oi && ta) ta.value = oi.value || \"\";\n        syncMode();\n      },\n      unmount: function(){ restoreForm(); if (priceBox.parentNode) priceBox.remove(); },\n      collect: function(){\n        var it = []; Object.keys(checks).forEach(function(k){ if (checks[k].checked) it.push(k); });\n        var fp = []; Object.keys(fireChecks).forEach(function(k){ if (fireChecks[k].checked) fp.push(k); });\n        var has = yes.input.checked;\n        return { v: 3, rentalMode: modeSel.value || \"integral\", bedrooms: cards.map(function(c){ return c.__get(); }), living: { has: has, items: has ? it : [], diningSeats: (has && checks.masa && checks.masa.checked) ? toInt(seatSel.value) : null, fireplace: (has && checks.semineu && checks.semineu.checked) ? fp : [] } };\n      },\n      validate: function(){\n        var m = modeSel.value;\n        if (!m) return tr(\"Alege cum se închiriază (toată proprietatea, camere individual sau hibrid).\", \"Choose how it is rented (whole property, individual rooms or hybrid).\");\n        var wk = toNum((byId(\"dPrice\") || {}).value), pw = toNum((byId(\"dPricePerProperty\") || {}).value);\n        if ((m === \"integral\" || m === \"hibrid\") && !(pw > 0)) return tr(\"Completează prețul / noapte pentru toată proprietatea.\", \"Fill in the nightly price for the whole property.\");\n        if ((m === \"camere\" || m === \"hibrid\") && !(wk > 0)) return tr(\"Completează prețul / noapte pentru o cameră.\", \"Fill in the nightly price for one room.\");\n        return \"\";\n      },\n      derived: function(){ return { rooms: Math.max(1, cards.length), skipPrices: true }; },\n    };\n  }\n  // conversie din modelul vechi (camere + băi separate) în modelul v3\n  function legacyToV3(L){\n    var out = { v: 3, rentalMode: \"\", bedrooms: [], living: { has: false, items: [] } };\n    var pp = byId(\"dPricePerProperty\") ? toNum(byId(\"dPricePerProperty\").value) : null, rp = byId(\"dPrice\") ? toNum(byId(\"dPrice\").value) : null;\n    out.rentalMode = (pp > 0 && rp > 0) ? \"hibrid\" : (pp > 0 ? \"integral\" : (rp > 0 ? \"camere\" : \"\"));\n    var bedKeys = [\"king\", \"dublu\", \"single\", \"supraetajat\"];\n    (L && L.roomTypes ? L.roomTypes : []).forEach(function(rt){\n      var baths = rt.bathrooms || [];\n      (rt.rooms || []).forEach(function(room, i){\n        var beds = bedKeys.filter(function(k){ return room.beds && room.beds[k] > 0; });\n        var b = baths[i];\n        out.bedrooms.push({ beds: beds, amenities: [], bath: b ? { type: b.type === \"private\" ? \"private\" : \"hall\", amenities: b.amenities || [] } : { type: \"hall\", amenities: [] } });\n      });\n    });\n    return out;\n  }\n  // conversie din modelul v2 (structuri): se păstrează prima structură\n  function v2ToV3(x){\n    var st = (x.structures && x.structures[0]) || {};\n    var bedMap = { king: \"king\", dublu: \"dublu\", single: \"single\", supraetajat: \"supraetajat\" };\n    var out = { v: 3, rentalMode: x.rentalMode || \"\", bedrooms: [], living: { has: !!(st.living && st.living.has), items: [] } };\n    (st.bedrooms || []).forEach(function(br){\n      var beds = []; [br.bedMain, br.bedExtra].forEach(function(b){ if (b && bedMap[b.type] && beds.indexOf(b.type) === -1) beds.push(b.type); });\n      out.bedrooms.push({ beds: beds, amenities: br.amenities || [], bath: { type: br.bath && br.bath.type === \"shared\" ? \"hall\" : \"private\", amenities: (br.bath && br.bath.amenities) || [] } });\n    });\n    var lm = { smart_tv: \"tv\", aer_conditionat: \"ac\", semineu: \"semineu\", zona_masa: \"masa\" };\n    if (st.living && st.living.amenities) st.living.amenities.forEach(function(k){ if (lm[k]) out.living.items.push(lm[k]); });\n    return out;\n  }\n\n  /* ======================= APARTAMENT (o singură unitate) ======================= */\n  // conversie din modelul vechi (camere + băi separate) în modelul nou\n  function legacyToApt(L){\n    var out = { v: 1, kind: \"apartament\", bedroomCount: 1, building: {}, bedrooms: [], main: null, living: { items: [] }, baths: [], facilities: { items: [] }, rules: {} };\n    var bedMap = { king: \"matrimonial\", dublu: \"matrimonial\", single: \"single\", supraetajat: \"suprapuse\" };\n    var nBaths = 0;\n    (L && L.roomTypes ? L.roomTypes : []).forEach(function(rt, idx){\n      if (idx > 0) return;                       // formularul nou are o singură unitate: păstrăm prima structură\n      nBaths = (rt.bathrooms || []).length;\n      (rt.rooms || []).forEach(function(room){\n        var beds = []; Object.keys(bedMap).forEach(function(k){ if (room.beds && room.beds[k] > 0 && beds.indexOf(bedMap[k]) === -1) beds.push(bedMap[k]); });\n        if (room.beds && room.beds.canapea > 0 && !beds.length) { out.living.items.push(\"sofa_ext\"); return; }\n        if (beds.length) out.bedrooms.push({ beds: beds, amenities: [] });\n      });\n    });\n    out.bedroomCount = Math.min(DEF.apt.bedroomsMax, Math.max(1, out.bedrooms.length));\n    for (var i = 0; i < Math.min(DEF.apt.bathsMax, Math.max(1, nBaths)); i++) out.baths.push({ amenities: [] });\n    return out;\n  }\n  // „Dotări …”: dropdown cu grupe de plăcuțe (iconiță + bifă + text). hooks[k](tileNode) poate adăuga un panou sub o plăcuță.\n  function groupDropdown(title, groups, selected, hooks, asGrid){\n    hooks = hooks || {};\n    var det = el(\"details\", \"pn-dd\"); var sum = el(\"summary\"); var left = el(\"span\", \"pn-dd-t\", title); sum.appendChild(left); det.appendChild(sum);\n    var body = el(\"div\", \"pn-dd-body\"); det.appendChild(body);\n    var inputs = {};\n    groups.forEach(function(g){\n      if (!asGrid) body.appendChild(el(\"div\", \"pn-grp-title\", g.title));\n      var wrap = asGrid ? el(\"div\", \"pn-fac\") : body;\n      g.items.forEach(function(x){\n        var t = tileCheck(x.icon, x.l, selected && selected.indexOf(x.k) !== -1, x.k); wrap.appendChild(t.node); inputs[x.k] = t.input;\n        if (hooks[x.k]) { var extra = hooks[x.k](t.input); if (extra) wrap.appendChild(extra); }\n      });\n      if (asGrid) body.appendChild(wrap);\n    });\n    function upd(){ var n = det.querySelectorAll(\"input:checked\").length; left.textContent = title + (n ? \" (\" + n + \")\" : \"\"); }\n    det.addEventListener(\"change\", upd); upd();\n    return { node: det, inputs: inputs, get: function(){ return Object.keys(inputs).filter(function(k){ return inputs[k].checked; }); } };\n  }\n  function bedsDropdown(title, selected){\n    var A = DEF.apt; var det = el(\"details\", \"pn-dd\"); var sum = el(\"summary\"); var left = el(\"span\", \"pn-dd-t\", title); sum.appendChild(left); det.appendChild(sum);\n    var body = el(\"div\", \"pn-dd-body\"); det.appendChild(body); var ins = [];\n    A.opts.beds.forEach(function(b){ var t = tileCheck(A.icons.bed, b.l, selected && selected.indexOf(b.k) !== -1, b.k); body.appendChild(t.node); ins.push(t.input); });\n    function upd(){ var n = ins.filter(function(x){ return x.checked; }).length; left.textContent = title + (n ? \" (\" + n + \")\" : \"\"); }\n    det.addEventListener(\"change\", upd); upd();\n    return { node: det, get: function(){ return ins.filter(function(x){ return x.checked; }).map(function(x){ return x.value; }); } };\n  }\n  function buildApartment(d0){\n    var A = DEF.apt, I = A.icons;\n    var d = d0 || { v: 1, kind: \"apartament\", bedroomCount: 1, bedrooms: [], living: { items: [] }, baths: [{}], facilities: { items: [] }, rules: {}, building: {} };\n    var root = el(\"div\", \"acc-td-box\");\n    var partType = el(\"div\", \"pn-camp-a\"), partBldg = el(\"div\", \"pn-bldg\"), partLayout = el(\"div\", \"pn-camp-a\"), partLog = el(\"div\", \"pn-camp-a\");\n    var capTitle = el(\"div\", \"pn-sec-title\", tr(\"Capacitate și tarife\", \"Capacity & rates\"));\n    function field(label){ var w = el(\"div\", \"pn-field\"); w.appendChild(el(\"div\", \"pn-lbl\", label)); return w; }\n    function radioRows(name, items, value){\n      var col = el(\"div\", \"pn-col\"), ins = {};\n      items.forEach(function(it){ var r = optRow(\"radio\", name, it.k, it.l, value === it.k, null); col.appendChild(r.node); ins[it.k] = r.input; });\n      return { node: col, inputs: ins, get: function(){ var v = \"\"; Object.keys(ins).forEach(function(k){ if (ins[k].checked) v = k; }); return v; } };\n    }\n    function rowTwo(name, items, value){ var r = radioRows(name, items, value); r.node.className = \"pn-two\"; return r; }\n\n    /* ---- Tipul proprietății ---- */\n    var kind = d.kind || \"apartament\", bed = Math.min(A.bedroomsMax, Math.max(1, parseInt(d.bedroomCount, 10) || 1));\n    partType.appendChild(el(\"div\", \"pn-sec-title\", tr(\"Tipul proprietății\", \"Property type\")));\n    var kcol = el(\"div\", \"pn-col\"); partType.appendChild(kcol);\n    var rStudio = optRow(\"radio\", \"aptKind\", \"studio\", tr(\"Studio / Garsonieră\", \"Studio\"), kind === \"studio\", null); kcol.appendChild(rStudio.node);\n    function bedSelect(){ var s = el(\"select\", \"acc-white-input pn-count\"); for (var n = 1; n <= A.bedroomsMax; n++) { var o = document.createElement(\"option\"); o.value = String(n); o.textContent = String(n); s.appendChild(o); } s.value = String(bed); s.setAttribute(\"aria-label\", tr(\"Număr de dormitoare\", \"Number of bedrooms\")); return s; }\n    var aptLabel = el(\"label\", \"pn-opt pn-opt-inline\"); var rApt = document.createElement(\"input\"); rApt.type = \"radio\"; rApt.name = \"aptKind\"; rApt.value = \"apartament\"; rApt.checked = kind === \"apartament\"; aptLabel.appendChild(rApt);\n    aptLabel.appendChild(el(\"span\", null, tr(\"Apartament cu\", \"Apartment with\"))); var selApt = bedSelect(); aptLabel.appendChild(selApt); aptLabel.appendChild(el(\"span\", null, tr(\"dormitoare\", \"bedrooms\"))); kcol.appendChild(aptLabel);\n    var rPen = optRow(\"radio\", \"aptKind\", \"penthouse\", \"Penthouse\", kind === \"penthouse\", null); kcol.appendChild(rPen.node);\n    var penFl = fluid(kind === \"penthouse\"); var penRow = el(\"div\", \"pn-sub\"); penRow.appendChild(el(\"span\", \"pn-q\", tr(\"Câte dormitoare are?\", \"How many bedrooms?\"))); var selPen = bedSelect(); penRow.appendChild(selPen); penFl.inner.appendChild(penRow); kcol.appendChild(penFl.node);\n\n    /* ---- Clădire ---- */\n    var bd = d.building || {};\n    var etW = field(tr(\"Etaj\", \"Floor\")); var floor = textInput(bd.floor, 10, tr(\"ex. 3 (0 = parter)\", \"e.g. 3 (0 = ground)\")); etW.appendChild(floor); partBldg.appendChild(etW);\n    var tLift = tileCheck(I.lift, tr(\"Clădire cu lift\", \"Building with a lift\"), bd.elevator), tEnt = tileCheck(I.door, tr(\"Intrare privată de la stradă\", \"Private entrance from the street\"), bd.privateEntrance);\n    var bcol = el(\"div\", \"pn-col\"); bcol.appendChild(tLift.node); bcol.appendChild(tEnt.node); partBldg.appendChild(bcol);\n\n    /* ---- Compartimentare ---- */\n    partLayout.appendChild(el(\"div\", \"pn-sec-title\", tr(\"Compartimentare & Configurație paturi\", \"Layout & bed setup\")));\n    var hintEl = el(\"p\", \"acc-white-hint\", \"\"); partLayout.appendChild(hintEl);\n    var roomsRow = el(\"div\", \"pn-row\"); roomsRow.appendChild(el(\"span\", \"pn-q\", tr(\"Dormitoare\", \"Bedrooms\"))); var selRooms = bedSelect(); roomsRow.appendChild(selRooms); partLayout.appendChild(roomsRow);\n    var cardsBox = el(\"div\", \"pn-roomlist\"); partLayout.appendChild(cardsBox);\n    var living = d.living || { items: [] };\n    // coduri speciale în living: capacitate canapea extensibilă, tip șemineu\n    var capFl = fluid(false), capInner = el(\"div\", \"pn-sub\"); capInner.appendChild(el(\"span\", \"pn-q\", tr(\"Capacitate canapea extensibilă\", \"Sofa bed capacity\"))); var sofaCap = rowTwo(\"aptSofaCap\", [{ k: \"1\", l: tr(\"1 persoană\", \"1 person\") }, { k: \"2\", l: tr(\"2 persoane\", \"2 people\") }], living.sofaCapacity ? String(living.sofaCapacity) : \"\"); capInner.appendChild(sofaCap.node); capFl.inner.appendChild(capInner);\n    var fireFl = fluid(false), fireInner = el(\"div\", \"pn-sub\"); fireInner.appendChild(el(\"span\", \"pn-q\", tr(\"Ce fel de șemineu?\", \"What kind of fireplace?\"))); var fireIns = {}; var fireRow = el(\"div\", \"pn-two\");\n    A.opts.fireplace.forEach(function(f){ var r = optRow(\"checkbox\", null, f.k, f.l, living.fireplace && living.fireplace.indexOf(f.k) !== -1, null); fireRow.appendChild(r.node); fireIns[f.k] = r.input; }); fireInner.appendChild(fireRow); fireFl.inner.appendChild(fireInner);\n    var livingDD = groupDropdown(tr(\"Dotări living\", \"Living room amenities\"), A.groups.living, living.items, {\n      sofa_ext: function(inp){ var f = function(){ capFl.set(inp.checked); }; inp.addEventListener(\"change\", f); f(); return capFl.node; },\n      semineu: function(inp){ var f = function(){ fireFl.set(inp.checked); }; inp.addEventListener(\"change\", f); f(); return fireFl.node; },\n    });\n    var livingCard = subCard(tr(\"Living\", \"Living room\"), I.sofa); livingCard.appendChild(livingDD.node);\n    var studioCard = subCard(tr(\"Spațiu principal (living + dormitor)\", \"Main space (living + bedroom)\"), I.bed);\n    var mn = d.main || {}; var studioBeds = bedsDropdown(tr(\"Configurație paturi\", \"Bed setup\"), mn.beds), studioAm = groupDropdown(tr(\"Dotări dormitor\", \"Bedroom amenities\"), A.groups.bedroom, mn.amenities);\n    studioCard.appendChild(studioBeds.node); studioCard.appendChild(studioAm.node);\n    var studioLivingHost = el(\"div\"); studioCard.appendChild(studioLivingHost);\n    var bedCards = [];\n    function bedroomCard(idx, data){\n      data = data || {}; var card = subCard(tr(\"Dormitor \", \"Bedroom \") + (idx + 1), I.bed);\n      var beds = bedsDropdown(tr(\"Configurație paturi\", \"Bed setup\"), data.beds), am = groupDropdown(tr(\"Dotări dormitor\", \"Bedroom amenities\"), A.groups.bedroom, data.amenities);\n      card.appendChild(beds.node); card.appendChild(am.node); card.__get = function(){ return { beds: beds.get(), amenities: am.get() }; }; return card;\n    }\n    var bathsRow = el(\"div\", \"pn-row\"); bathsRow.appendChild(el(\"span\", \"pn-q\", tr(\"Băi\", \"Bathrooms\")));\n    var selBaths = el(\"select\", \"acc-white-input pn-count\"); for (var bn = 1; bn <= A.bathsMax; bn++) { var bo = document.createElement(\"option\"); bo.value = String(bn); bo.textContent = String(bn); selBaths.appendChild(bo); }\n    var bathsData = (d.baths && d.baths.length) ? d.baths : [{}]; selBaths.value = String(Math.min(A.bathsMax, bathsData.length)); bathsRow.appendChild(selBaths);\n    var bathsBox = el(\"div\", \"pn-roomlist\"); var bathCards = [];\n    function bathCard(idx, data){ data = data || {}; var card = subCard(tr(\"Baia \", \"Bathroom \") + (idx + 1), I.bath); var am = groupDropdown(tr(\"Dotări baie\", \"Bathroom amenities\"), A.groups.bath, data.amenities); card.appendChild(am.node); card.__get = function(){ return { amenities: am.get() }; }; return card; }\n    function syncBaths(){\n      var n = parseInt(selBaths.value, 10) || 1;\n      while (bathCards.length < n) { var c = bathCard(bathCards.length, bathsData[bathCards.length]); bathCards.push(c); bathsBox.appendChild(c); }\n      while (bathCards.length > n) bathCards.pop().remove();\n    }\n    selBaths.addEventListener(\"change\", function(){ syncBaths(); notify(); }); syncBaths();\n    partLayout.appendChild(studioCard); partLayout.appendChild(livingCard); partLayout.appendChild(bathsRow); partLayout.appendChild(bathsBox);\n    function syncKind(){\n      var studio = kind === \"studio\", n = studio ? 0 : bed;\n      roomsRow.style.display = studio ? \"none\" : \"\"; livingCard.style.display = studio ? \"none\" : \"\"; studioCard.style.display = studio ? \"\" : \"none\";\n      penFl.set(kind === \"penthouse\"); selApt.value = selPen.value = selRooms.value = String(bed);\n      var srcBeds = d.bedrooms || [];\n      while (bedCards.length < n) { var c = bedroomCard(bedCards.length, srcBeds[bedCards.length]); bedCards.push(c); cardsBox.appendChild(c); }\n      while (bedCards.length > n) bedCards.pop().remove();\n      cardsBox.style.display = studio ? \"none\" : \"\";\n      // dotările livingului: într-un singur loc (în card, sau în „Spațiu principal” la garsonieră)\n      if (studio) studioLivingHost.appendChild(livingDD.node); else livingCard.appendChild(livingDD.node);\n      hintEl.textContent = studio ? tr(\"Garsonieră: zona de dormit și cea de zi sunt în același spațiu.\", \"Studio: the sleeping and living areas are in the same space.\") : (kind === \"penthouse\" ? \"Penthouse\" : tr(\"Apartament\", \"Apartment\")) + tr(\" cu \", \" with \") + n + (n === 1 ? tr(\" dormitor\", \" bedroom\") : tr(\" dormitoare\", \" bedrooms\")) + tr(\" — living, dormitoare și băi.\", \" — living room, bedrooms and bathrooms.\");\n      notify();\n    }\n    function setBed(n){ bed = Math.min(A.bedroomsMax, Math.max(1, n)); syncKind(); }\n    rStudio.input.addEventListener(\"change\", function(){ if (rStudio.input.checked) { kind = \"studio\"; syncKind(); } });\n    rApt.addEventListener(\"change\", function(){ if (rApt.checked) { kind = \"apartament\"; syncKind(); } });\n    rPen.input.addEventListener(\"change\", function(){ if (rPen.input.checked) { kind = \"penthouse\"; syncKind(); } });\n    [selApt, selPen, selRooms].forEach(function(s){ s.addEventListener(\"change\", function(){ if (s === selApt && kind !== \"apartament\") { kind = \"apartament\"; rApt.checked = true; } setBed(parseInt(s.value, 10)); }); });\n\n    /* ---- Facilități „Home Away from Home” ---- */\n    var fc = d.facilities || { items: [] };\n    var wifiFl = fluid(false), wifiIn = el(\"div\", \"pn-sub\"); wifiIn.appendChild(el(\"span\", \"pn-q\", tr(\"Viteză Wi-Fi (Mbps)\", \"Wi-Fi speed (Mbps)\"))); var wifiSpeed = numInput(fc.wifiMbps, 1, 10000); wifiSpeed.className = \"acc-white-input pn-num\"; wifiIn.appendChild(wifiSpeed); wifiFl.inner.appendChild(wifiIn);\n    var parkFl = fluid(false), parkIn = el(\"div\", \"pn-sub\"); var parkRow = rowTwo(\"aptPark\", [{ k: \"gratuit\", l: tr(\"Gratuit\", \"Free\") }, { k: \"contra_cost\", l: tr(\"Contra cost\", \"Paid\") }], fc.parking || \"\"); parkIn.appendChild(parkRow.node);\n    var parkPriceW = el(\"div\", \"pn-field\"); parkPriceW.appendChild(el(\"div\", \"pn-lbl\", tr(\"Tarif parcare (RON / zi)\", \"Parking fee (RON / day)\"))); var parkPrice = numInput(fc.parkingPrice, 0, 10000, \"0.01\"); parkPriceW.appendChild(parkPrice); var parkPriceFl = fluid(false); parkPriceFl.inner.appendChild(parkPriceW); parkIn.appendChild(parkPriceFl.node); parkFl.inner.appendChild(parkIn);\n    function syncPark(){ parkPriceFl.set(parkRow.get() === \"contra_cost\"); }\n    Object.keys(parkRow.inputs).forEach(function(k){ parkRow.inputs[k].addEventListener(\"change\", syncPark); });\n    var facDD = [], facInputs = {};\n    // grupurile se construiesc la montare (în dropdown-uri separate)\n    function buildFacilities(){\n      var holder = el(\"div\", \"pn-facs\"); holder.id = \"pnFacGroups\";\n      A.groups.facilities.forEach(function(g){\n        var dd = groupDropdown(g.title, [g], fc.items, {\n          wifi: function(inp){ var f = function(){ wifiFl.set(inp.checked); }; inp.addEventListener(\"change\", f); f(); var w = el(\"div\", \"pn-span\"); w.appendChild(wifiFl.node); return w; },\n          parcare: function(inp){ var f = function(){ parkFl.set(inp.checked); }; inp.addEventListener(\"change\", f); f(); syncPark(); var w = el(\"div\", \"pn-span\"); w.appendChild(parkFl.node); return w; },\n        }, true);\n        Object.keys(dd.inputs).forEach(function(k){ facInputs[k] = dd.inputs[k]; }); facDD.push(dd); holder.appendChild(dd.node);\n      });\n      return holder;\n    }\n\n    /* ---- Logistică check-in & reguli ---- */\n    partLog.appendChild(el(\"div\", \"pn-sec-title\", tr(\"Logistică check-in & Reguli de casă\", \"Check-in logistics & house rules\")));\n    partLog.appendChild(el(\"p\", \"acc-white-hint\", tr(\"Proprietarul nu e mereu acolo, deci aici notezi instrucțiunile esențiale.\", \"The host is not always there, so note the essential instructions here.\")));\n    partLog.appendChild(el(\"div\", \"pn-lbl\", tr(\"Metodă check-in\", \"Check-in method\")));\n    var rl = d.rules || {};\n    var method = radioRows(\"aptCheckin\", A.opts.checkin, d.checkin || \"\"); partLog.appendChild(method.node);\n    var rules = subCard(tr(\"Regulile casei\", \"House rules\"), null); partLog.appendChild(rules);\n    function ruleBlock(title, name, items, val, two){ var w = field(title); var r = two ? rowTwo(name, items, val) : radioRows(name, items, val); w.appendChild(r.node); rules.appendChild(w); return r; }\n    var smoking = ruleBlock(tr(\"Se permite fumatul?\", \"Is smoking allowed?\"), \"aptSmoke\", A.opts.smoking, rl.smoking || \"\", false);\n    var parties = ruleBlock(tr(\"Se permit petreceri / evenimente?\", \"Are parties / events allowed?\"), \"aptParty\", A.opts.parties, rl.parties || \"\", true);\n    var pets = ruleBlock(tr(\"Politică animale de companie\", \"Pet policy\"), \"aptPets\", A.opts.pets, rl.pets || \"\", false);\n    var qW = field(tr(\"Ore de liniște (quiet hours)\", \"Quiet hours\")); var qRow = el(\"div\", \"pn-two2\");\n    var qf = field(tr(\"De la\", \"From\")); var quietFrom = document.createElement(\"input\"); quietFrom.type = \"time\"; quietFrom.className = \"acc-white-input\"; quietFrom.value = rl.quietFrom || \"\"; qf.appendChild(quietFrom);\n    var qt = field(tr(\"Până la\", \"To\")); var quietTo = document.createElement(\"input\"); quietTo.type = \"time\"; quietTo.className = \"acc-white-input\"; quietTo.value = rl.quietTo || \"\"; qt.appendChild(quietTo);\n    qRow.appendChild(qf); qRow.appendChild(qt); qW.appendChild(qRow); rules.appendChild(qW);\n    [partType, partBldg, partLayout, partLog].forEach(function(n){ n.addEventListener(\"change\", notify); n.addEventListener(\"input\", notify); });\n\n    /* ---- adaptarea formularului ---- */\n    var saved = null, laidOut = false, tilesOrig = [], toggleOrig = null, gridOrig = null, galLabel = null, galLabelText = \"\", galHint = null, holderNode = null;\n    function nodesBetween(a, b){ var out = [], n = a; while (n) { out.push(n); if (n === b) break; n = n.nextElementSibling; } return out; }\n    function layoutApt(){\n      var form = byId(\"detForm\"); if (!form || laidOut) return;\n      var age = form.querySelector(\".acc-age-policy-group\"), lDesc = form.querySelector('label[for=\"dDescription\"]'), lCity = form.querySelector('label[for=\"dCity\"]');\n      var addr = byId(\"dAddress\"), cap = byId(\"dCapRoomsWrap\"), root1 = byId(\"pensionPriceRoot\"), pr = byId(\"dPriceRoomWrap\"), pp = byId(\"dPricePropertyWrap\"), lOff = form.querySelector('label[for=\"dSpecialOffers\"]'), off = byId(\"dSpecialOffers\"), stars = byId(\"dStarsWrap\"), co = byId(\"dCheckout\");\n      if (!age || !lDesc || !lCity || !addr || !cap || !root1 || !pr || !pp || !lOff || !off || !stars || !co || !byId(\"dEmail\")) return;\n      laidOut = true; saved = Array.prototype.slice.call(form.children);\n      var sAge = [age.previousElementSibling, age], sLoc = nodesBetween(lCity, addr), sDesc = nodesBetween(lDesc, lCity.previousElementSibling), sOff = [lOff, off];\n      var frag = document.createDocumentFragment();\n      [sAge, [partType], sLoc, [partBldg, partLayout, capTitle], [cap], [root1, pr, pp], sOff, sDesc].forEach(function(sec){ sec.forEach(function(n){ frag.appendChild(n); }); });\n      stars.parentNode.insertBefore(frag, stars.nextSibling);\n      co.parentNode.insertBefore(partLog, co.nextSibling);\n      var lr = form.querySelector('label[for=\"dRooms\"]'), ir = byId(\"dRooms\"); if (lr) lr.style.display = \"none\"; if (ir) { ir.style.display = \"none\"; ir.required = false; }\n      // facilități: grupurile noi în locul grilei generale\n      var orig = byId(\"dAmenityOriginal\");\n      if (orig) {\n        gridOrig = orig.parentNode; tilesOrig = Array.prototype.slice.call(orig.querySelectorAll(\"label.acc-check-item\"));\n        toggleOrig = Array.prototype.filter.call(gridOrig.children, function(n){ return n.tagName === \"LABEL\"; })[0] || null;\n        holderNode = buildFacilities(); gridOrig.parentNode.insertBefore(holderNode, gridOrig);\n        if (toggleOrig) { toggleOrig.classList.add(\"pn-other-toggle\"); gridOrig.parentNode.insertBefore(toggleOrig, gridOrig); }\n        gridOrig.style.display = \"none\";\n        var fl = gridOrig.previousElementSibling; if (fl && fl.tagName === \"LABEL\") { fl.__t = fl.textContent; fl.textContent = tr(\"Facilități — „Home Away from Home”\", \"Facilities — “Home Away from Home”\"); holderNode.__label = fl; }\n      }\n      [\"extAccessGrid\", \"extAmenitiesGrid\"].forEach(function(id){ var g = byId(id); if (g) { g.style.display = \"none\"; if (g.previousElementSibling && g.previousElementSibling.tagName === \"LABEL\") g.previousElementSibling.style.display = \"none\"; } });\n      var oi = byId(\"dOtherAmenityText\");\n      if (oi) {\n        oi.style.display = \"none\"; if (oi.previousElementSibling && oi.previousElementSibling.tagName === \"LABEL\") oi.previousElementSibling.textContent = tr(\"Scrie ce alte facilități oferi\", \"Write what other facilities you offer\");\n        var ta = el(\"textarea\", \"acc-white-input pn-other-ta\"); ta.id = \"pnOtherText\"; ta.rows = 4; ta.maxLength = 255; ta.placeholder = tr(\"ex. jocuri de societate, pătuț la cerere, vedere panoramică…\", \"e.g. board games, cot on request, panoramic view…\"); ta.value = oi.value || \"\";\n        ta.addEventListener(\"input\", function(){ oi.value = ta.value; oi.dispatchEvent(new Event(\"input\", { bubbles: true })); });\n        oi.parentNode.insertBefore(ta, oi.nextSibling);\n      }\n      var pin = byId(\"dPhotoInput\"); var pl = pin ? pin.closest(\"label\") : null;\n      if (pl && pl.previousElementSibling && pl.previousElementSibling.tagName === \"LABEL\") {\n        galLabel = pl.previousElementSibling; galLabelText = galLabel.textContent; galLabel.textContent = tr(\"Galerie foto (maxim 24 de poze)\", \"Photo gallery (max. 24 photos)\");\n        galHint = el(\"p\", \"acc-white-hint\", tr(\"Minim 2 fotografii, în plus față de poza principală.\", \"At least 2 photos, in addition to the main photo.\")); galLabel.parentNode.insertBefore(galHint, galLabel.nextSibling);\n      }\n    }\n    function restoreApt(){\n      var form = byId(\"detForm\"); if (!form || !laidOut) return;\n      var o = byId(\"dAmenityOriginal\");\n      if (o) tilesOrig.forEach(function(t){ o.appendChild(t); });\n      if (gridOrig && toggleOrig) { gridOrig.appendChild(toggleOrig); toggleOrig.classList.remove(\"pn-other-toggle\"); gridOrig.style.display = \"\"; }\n      if (holderNode) { if (holderNode.__label) holderNode.__label.textContent = holderNode.__label.__t; holderNode.remove(); holderNode = null; }\n      var ta = byId(\"pnOtherText\"); if (ta) ta.remove();\n      var oi = byId(\"dOtherAmenityText\"); if (oi) oi.style.display = \"\";\n      [\"extAccessGrid\", \"extAmenitiesGrid\"].forEach(function(id){ var g = byId(id); if (g) { g.style.display = \"\"; if (g.previousElementSibling && g.previousElementSibling.tagName === \"LABEL\") g.previousElementSibling.style.display = \"\"; } });\n      if (galLabel) galLabel.textContent = galLabelText; if (galHint && galHint.parentNode) galHint.remove();\n      var lr = form.querySelector('label[for=\"dRooms\"]'), ir = byId(\"dRooms\"); if (lr) lr.style.display = \"\"; if (ir) { ir.style.display = \"\"; ir.required = true; }\n      [partType, partBldg, partLayout, partLog, capTitle].forEach(function(n){ if (n.parentNode) n.remove(); });\n      saved.forEach(function(n){ form.appendChild(n); });\n      laidOut = false;\n    }\n    syncKind();\n\n    return {\n      node: root,\n      mount: function(){ layoutApt(); var oi = byId(\"dOtherAmenityText\"), ta = byId(\"pnOtherText\"); if (oi && ta) ta.value = oi.value || \"\"; },\n      unmount: function(){ restoreApt(); },\n      collect: function(){\n        var studio = kind === \"studio\";\n        var lvItems = livingDD.get(); var fcItems = Object.keys(facInputs).filter(function(k){ return facInputs[k].checked; });\n        var fire = Object.keys(fireIns).filter(function(k){ return fireIns[k].checked; });\n        return {\n          v: 1, kind: kind, bedroomCount: studio ? 0 : bed,\n          building: { floor: floor.value.trim(), elevator: tLift.input.checked, privateEntrance: tEnt.input.checked },\n          bedrooms: studio ? [] : bedCards.map(function(c){ return c.__get(); }),\n          main: studio ? { beds: studioBeds.get(), amenities: studioAm.get() } : null,\n          living: { items: lvItems, sofaCapacity: sofaCap.get() ? parseInt(sofaCap.get(), 10) : null, fireplace: fire },\n          baths: bathCards.map(function(c){ return c.__get(); }),\n          facilities: { items: fcItems, wifiMbps: toInt(wifiSpeed.value) || null, parking: parkRow.get(), parkingPrice: toNum(parkPrice.value) },\n          checkin: method.get(),\n          rules: { smoking: smoking.get(), parties: parties.get(), pets: pets.get(), quietFrom: quietFrom.value, quietTo: quietTo.value },\n        };\n      },\n      validate: function(){\n        if (kind !== \"studio\" && !bedCards.length) return tr(\"Alege numărul de dormitoare.\", \"Choose the number of bedrooms.\");\n        return \"\";\n      },\n      derived: function(){ return { rooms: Math.max(1, kind === \"studio\" ? 1 : bed), skipPrices: true }; },\n    };\n  }\n\n\n  /* ======================= comutare pe tip ======================= */\n  var current = null, mode = null, saved = { hotel_mic: null, camping: null, pension: null };\n  var ALL_HIDE = [\"dCapRoomsWrap\", \"dPriceRoomWrap\", \"dPricePropertyWrap\", \"roomTypesDetails\"];\n  function modeFor(type){\n    if (type === \"hotel_mic\" || type === \"camping\" || type === \"pension\") return type;\n    if (type === \"apartament\") return \"apartment\";\n    if (DEF.pensionTypes && DEF.pensionTypes.indexOf(type) !== -1) return \"pension\";\n    return null;\n  }\n  function setHidden(on, m){\n    var hide = !on ? [] : ((m === \"pension\" || m === \"apartment\") ? [\"roomTypesDetails\"] : ALL_HIDE);\n    ALL_HIDE.forEach(function(id){\n      var e = byId(id); if (!e) return;\n      if (e.__origDisplay === undefined) e.__origDisplay = e.style.display;\n      e.style.display = hide.indexOf(id) !== -1 ? \"none\" : e.__origDisplay;\n    });\n    var cap = byId(\"dCapacity\"), rm = byId(\"dRooms\");\n    if (cap) cap.required = !on || m === \"pension\" || m === \"apartment\";\n    if (rm) rm.required = !on;\n  }\n  function setVal(id, v){ var e = byId(id); if (e) e.value = (v != null && v !== \"\") ? v : \"\"; }\n  function derive(){\n    if (!current) return;\n    var dv = current.derived();\n    if (dv.capacity !== undefined) setVal(\"dCapacity\", dv.capacity);\n    setVal(\"dRooms\", dv.rooms);\n    if (dv.skipPrices) return;\n    setVal(\"dPrice\", dv.price); setVal(\"dPricePerProperty\", \"\");\n  }\n  function setMode(type, data){\n    var m = modeFor(type);\n    if (m && m === mode && !data) return;\n    if (current && mode) { saved[mode] = current.collect(); if (current.unmount) current.unmount(); }\n    root.innerHTML = \"\"; current = null; mode = null;\n    if (m) {\n      mode = m;\n      if (m === \"hotel_mic\") current = buildHotel(data || saved[m]);\n      else if (m === \"camping\") current = buildCamping(data || saved[m]);\n      else if (m === \"apartment\") {\n        var da = data || saved[m];\n        if (da && !(da.v === 1 && da.kind)) da = null;\n        if (!da && EXISTING && EXISTING.v === 1 && EXISTING.kind) da = EXISTING;\n        if (!da && LEGACY) da = legacyToApt(LEGACY);\n        current = buildApartment(da);\n      }\n      else {\n        var d = data || saved[m];\n        if (d && d.v === 2) d = v2ToV3(d);\n        if (d && d.v !== 3) d = null;\n        if (!d && EXISTING && EXISTING.v === 3) d = EXISTING;\n        if (!d && EXISTING && EXISTING.v === 2) d = v2ToV3(EXISTING);\n        if (!d && LEGACY) d = legacyToV3(LEGACY);\n        current = buildPension(d, LEGACY);\n      }\n      root.appendChild(current.node);\n      setHidden(true, m);\n      if (current.mount) current.mount();\n      derive();\n    } else { setHidden(false, null); }\n  }\n  window.__typeDetailsActive = function(){ return !!current; };\n  window.__collectTypeDetails = function(){ return current ? current.collect() : null; };\n  window.__validateTypeDetails = function(){ return current ? current.validate() : \"\"; };\n  window.__populateTypeDetails = function(obj){ if (mode && obj) setMode(mode, obj); };\n  window.__typeDetailsDerive = derive;\n  root.addEventListener(\"input\", derive); root.addEventListener(\"change\", derive);\n  var typeSel = byId(\"dType\");\n  if (typeSel) typeSel.addEventListener(\"change\", function(){ setMode(typeSel.value); });\n  setMode(typeSel ? typeSel.value : INITIAL_TYPE, (EXISTING && modeFor(INITIAL_TYPE) !== \"pension\") ? EXISTING : null);\n  document.addEventListener(\"DOMContentLoaded\", function(){ if (current) { setHidden(true, mode); if (current.mount) current.mount(); derive(); } });\n})();\n";


// ---------------------------------------------------------------------
// Pagina publică a unui RESTAURANT / CAFENEA / OBIECTIV TURISTIC creat de un
// proprietar — același aspect ca pagina unei cazări: navigare, galerie cu
// lightbox, tab-uri, fapte rapide, facilități cu iconițe, contact, legătură
// către orașul trecut în înscriere.
// ---------------------------------------------------------------------
const VENUE_PAGE_CSS = `.acc-nav-header{background:#161b22;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;}
.acc-nav-header .brand{color:#fff;font-weight:900;font-size:19px;text-decoration:none;}
.acc-nav-header .brand span{color:var(--accent);}
.acc-nav-right{display:flex;align-items:center;gap:16px;flex-wrap:wrap;font-size:13.5px;color:#fff;min-width:0;}
@media (max-width:1024px){.acc-nav-right{gap:10px;font-size:12.5px;justify-content:flex-end;}}
.acc-nav-right a{color:#fff;text-decoration:none;}
.acc-currency-btn{background:none;border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:8px;padding:6px 12px;font-size:13.5px;font-weight:700;cursor:pointer;}
.acc-currency-btn:hover{border-color:#fff;}
.acc-lang-wrap{position:relative;}
.acc-lang-dropdown{display:none;position:absolute;top:calc(100% + 8px);left:0;right:auto;background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);padding:8px;min-width:210px;max-width:calc(100vw - 24px);max-height:70vh;overflow-y:auto;z-index:80;}
.acc-lang-dropdown.is-open{display:block;}
.acc-lang-option{display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;border-radius:8px;padding:9px 10px;text-align:left;font-size:14px;color:#111;cursor:not-allowed;}
a.acc-lang-option{cursor:pointer;box-sizing:border-box;}
a.acc-lang-option:hover{background:#FFF4EC;}
.acc-lang-option .soon{white-space:nowrap;}
.acc-lang-option .flag{font-size:17px;}
.acc-lang-option .name{flex:1;}
.acc-lang-option .check{color:#F0813A;font-weight:900;}
.acc-lang-option .soon{font-size:10.5px;color:#aaa;background:#f2f2f2;border-radius:999px;padding:2px 8px;}
.acc-lang-option.is-selected{background:#fff6ef;cursor:default;}
.acc-lang-option.is-selected .name{color:#F0813A;font-weight:700;}
.acc-lang-option.is-disabled .name{color:#999;}
.acc-tabs{display:flex;gap:22px;border-bottom:1px solid var(--glass-border);margin:26px 0 20px;flex-wrap:nowrap;overflow-x:auto;white-space:nowrap;}
.acc-tabs a{color:var(--muted);text-decoration:none;font-weight:700;font-size:14px;padding-bottom:10px;border-bottom:2px solid transparent;}
.acc-tabs a.is-active{color:var(--text);border-color:var(--accent);}
.acc-prop-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap;margin-bottom:6px;}
.acc-prop-stars{color:#f5a623;font-size:15px;margin-bottom:6px;}
.acc-verified-badge{display:inline-flex;align-items:center;gap:4px;background:#1c3a5e;color:#fff;border-radius:999px;padding:3px 10px;font-size:11.5px;font-weight:700;margin-left:8px;}
.acc-prop-actions{display:flex;gap:10px;align-items:center;flex:0 0 auto;}
.acc-icon-btn{width:40px;height:40px;border-radius:50%;background:var(--glass-bg);border:1px solid var(--glass-border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:17px;color:var(--text);}
.acc-icon-btn.is-fav{border-color:var(--accent);color:var(--accent);}
.acc-msg-btn{background:var(--btn-surface);color:var(--text);font-weight:800;border:1.5px solid var(--accent);border-radius:10px;padding:10px 20px;cursor:pointer;font-size:14px;}
.acc-gallery{display:grid;grid-template-columns:2fr 1fr;gap:8px;margin:16px 0;}
.acc-gallery-main{width:100%;height:340px;object-fit:cover;border-radius:14px;}
.acc-gallery-thumbs{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.acc-gallery-thumb-wrap{position:relative;height:164px;}
.acc-gallery-thumb-wrap img{width:100%;height:100%;object-fit:cover;border-radius:10px;}
.acc-page-wrap{max-width:1180px;margin:0 auto;padding:0 24px;box-sizing:border-box;}
.acc-gallery-more{position:absolute;inset:0;background:rgba(0,0,0,.55);color:#fff;display:flex;align-items:center;justify-content:center;border-radius:10px;font-weight:800;pointer-events:none;}
.acc-gallery-photo{cursor:pointer;}
.acc-gallery-photo{cursor:pointer;}
.acc-lightbox-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:90;align-items:center;justify-content:center;}
.acc-lightbox-backdrop.is-open{display:flex;}
.acc-lightbox-img{max-width:90vw;max-height:85vh;object-fit:contain;border-radius:6px;}
.acc-lightbox-close{position:absolute;top:18px;right:18px;background:#1A1F35;border:2px solid var(--accent, #F0813A);color:var(--accent, #F0813A);width:40px;height:40px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;}
.acc-lightbox-nav{position:absolute;top:50%;transform:translateY(-50%);background:#1A1F35;border:2px solid var(--accent, #F0813A);color:var(--accent, #F0813A);width:46px;height:46px;border-radius:50%;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;box-shadow:0 4px 14px rgba(0,0,0,.35);}
.acc-lightbox-nav:active{transform:translateY(-50%) scale(.92);}
.acc-lightbox-prev{left:16px;}
.acc-lightbox-next{right:16px;}
.acc-lightbox-counter{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);color:#fff;font-size:13px;background:rgba(255,255,255,.15);padding:5px 14px;border-radius:999px;}
.acc-map-link-btn{background:none;border:none;color:var(--accent);font-size:inherit;font-family:inherit;cursor:pointer;padding:0;text-decoration:none;}
.acc-social-links{display:flex;gap:10px;margin-top:8px;}
.acc-social-links a{color:var(--text);display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;background:var(--btn-surface);border:1.5px solid var(--border);font-size:16px;text-decoration:none;transition:border-color .15s ease;}
.acc-social-links a:hover{border-color:var(--accent);}
.acc-map-modal-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:90;align-items:center;justify-content:center;padding:20px;}
.acc-map-modal-backdrop.is-open{display:flex;}
.acc-map-modal{position:relative;background:#fff;border-radius:14px;overflow:hidden;width:100%;max-width:800px;height:70vh;}
.acc-map-modal-foot{height:46px;display:flex;align-items:center;justify-content:center;background:#fff;border-top:1px solid #e6e6e6;}
.acc-map-modal-foot a{color:#0b57d0;font-weight:700;font-size:14px;text-decoration:none;}
.acc-quickfacts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0;}
.acc-quickfact-card{display:flex;align-items:center;gap:8px;border:1px solid var(--glass-border);border-radius:12px;padding:12px 16px;font-size:13.5px;color:var(--text);background:var(--glass-bg);}
@media (max-width:640px){.acc-quickfacts{display:grid;grid-template-columns:1fr 1fr;gap:10px;}.acc-quickfact-card{padding:11px 10px;font-size:13px;}.acc-quickfact-card .icon{flex:0 0 auto;}}
.acc-quickfact-card .icon{font-size:17px;}
@media (max-width:640px){.acc-gallery{grid-template-columns:1fr;}.acc-gallery-main{height:220px;}}
.acc-layout{display:grid;grid-template-columns:2fr 1fr;gap:24px;align-items:start;}
@media (max-width:800px){.acc-layout{grid-template-columns:1fr;}}
.acc-sidebar{position:sticky;top:16px;}
.pa-pill{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1.5px solid #dde1e6;border-radius:10px;padding:10px 14px;font-size:13.5px;font-weight:600;color:#1a1f2e;}
.pa-pill .pa-icon{flex:0 0 auto;color:#2b6cb0;}
.pa-pill-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0;}
@media (max-width:640px){.pa-pill-grid{grid-template-columns:repeat(2,1fr);}}
.pa-pill-check{color:#2f9e44;flex:0 0 auto;}
.acc-offers-list{margin:8px 0 0;padding-left:20px;}
.acc-offers-list li{margin-bottom:6px;color:var(--text);}
.acc-desc-more{background:none;border:1px solid #4da3ff;color:#4da3ff;border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px;}
.acc-desc-text{max-height:120px;overflow:hidden;position:relative;text-align:justify;}
.acc-desc-text.is-expanded{max-height:none;}
.acc-fac-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0;}
@media (max-width:640px){.acc-fac-grid{grid-template-columns:repeat(2,1fr);}}
.acc-highlights-card{background:var(--glass-bg);border:1px solid var(--accent);border-radius:14px;padding:18px;}
.acc-highlights-card h3{margin:0 0 4px;}
.acc-highlights-sub{color:var(--muted);font-size:13px;margin-bottom:14px;}
.acc-highlight-row{display:flex;gap:10px;align-items:flex-start;margin-bottom:12px;font-size:13.5px;}
.acc-save-btn{width:100%;background:var(--glass-bg);border:1px solid var(--accent);color:var(--accent);font-weight:700;border-radius:10px;padding:12px;cursor:pointer;margin-top:10px;}
.acc-save-btn.is-fav{background:var(--accent);color:#fff;}
.acc-avail-bar{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:16px;padding:20px;margin-top:30px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;}
.acc-widget-modal-close{position:absolute;top:12px;right:12px;background:#f0f0f0;border:none;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:16px;z-index:2;}
.acc-dark-footer{margin-top:20px;border-top:1px solid var(--glass-border);}
.acc-dark-footer-inner{max-width:1180px;margin:0 auto;padding:24px;text-align:center;font-size:12px;color:var(--muted);line-height:1.7;}
.acc-dark-footer-inner a{color:var(--muted);text-decoration:underline;}
.venue-status{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:4px 12px;font-size:13px;font-weight:800;margin:0 0 8px;}
.venue-status .dot{width:8px;height:8px;border-radius:50%;display:inline-block;}
.venue-status.is-open{background:#E8F9EE;color:#137a3a;border:1px solid #9fe0b6;}
.venue-status.is-open .dot{background:#22a85a;}
.venue-status.is-closed{background:#FDECEC;color:#a32626;border:1px solid #f0b5b5;}
.venue-status.is-closed .dot{background:#d64545;}
.venue-live-note{font-size:13px;color:#8a5a00;background:#FFF4DC;border:1px solid #f0d49a;border-radius:10px;padding:8px 12px;margin:0 0 10px;}
.venue-crumbs{font-size:13px;color:var(--muted);margin:14px 0 6px;}
.venue-crumbs a{color:var(--accent);text-decoration:none;font-weight:700;}
.venue-city-link{color:var(--accent);font-weight:700;text-decoration:none;}
.venue-row{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--glass-border);font-size:14px;}
.venue-row:last-child{border-bottom:none;}
.venue-row.is-today{font-weight:800;color:var(--accent);}
.venue-card{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:14px;padding:6px 18px;margin-bottom:16px;}
.venue-card.pad{padding:16px 18px;}
.venue-side-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;box-sizing:border-box;padding:12px 14px;border-radius:10px;font-weight:800;font-size:14px;border:1.5px solid var(--accent);background:var(--btn-surface,#fff);color:var(--text);text-decoration:none;cursor:pointer;margin-bottom:10px;font-family:inherit;}
.venue-side-btn.primary{background:var(--accent);color:#fff;}
.venue-side-btn:disabled{opacity:.7;cursor:default;}
.venue-more-city{display:inline-flex;align-items:center;gap:6px;margin:18px 0 6px;font-weight:800;color:var(--accent);text-decoration:none;}
.venue-info-line{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:14px;color:var(--text);}
.venue-info-line .pa-icon{color:var(--accent);flex:0 0 auto;}
.venue-info-line a{color:var(--accent);font-weight:700;text-decoration:none;}
.venue-sub{font-size:13px;color:var(--muted);margin:6px 0 0;}
@media (max-width:800px){.venue-side-col{order:-1;position:static !important;top:auto !important;}}
`;

// limită simplă în memorie (endpoint-ul citește doar dintr-un cache, deci e ieftin)
const LOCAL_SEARCH_HITS = new Map();


// ==================================================================
// PROSPECTARE (CRM simplu, doar admin) — listă de pensiuni / localuri
// pe care vrei să le inviți pe site. Site-ul NU trimite nimic automat:
// butoanele deschid mesajul gata completat în aplicația ta (email,
// WhatsApp, telefon), ca să nu riscăm contul Resend (folosit pentru
// linkurile de login) și să rămânem în regulă cu Legea 506/2004.
// Tabel: prospects (vezi prospects-schema.sql).
// ==================================================================
const PROSPECT_SEGMENTS = { cazare: "🏡 Cazări", restaurant: "🍽️ Restaurante / cafenele", obiectiv: "🏛️ Obiective turistice" };

const PROSPECT_STATUSES = {
  necontactat: "⚪ Necontactat",
  contactat: "📤 Contactat",
  a_deschis: "👀 A deschis linkul",
  a_raspuns: "💬 A răspuns",
  inscris: "✅ Înscris",
  refuzat: "✕ Refuzat",
  nu_contacta: "⛔ Nu mai contacta",
};

const PROSPECT_TYPE_OPTIONS = {
  cazare: ACCOMMODATION_TYPE_LABELS,
  restaurant: RESTAURANT_VENUE_TYPES,
  obiectiv: ATTRACTION_VENUE_TYPES,
};

// Cheia „Altceva” diferă între cele două liste — o reținem, ca să știm când
// să arătăm câmpul liber de precizare, atât în formular, cât și în tabel.
const PROSPECT_OTHER_TYPE_KEY = { cazare: "altceva", restaurant: "altul", obiectiv: "altul" };

const PROSPECT_JUDETE_RO = [
  "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", "Brăila", "Brașov", "București",
  "Buzău", "Călărași", "Caraș-Severin", "Cluj", "Constanța", "Covasna", "Dâmbovița", "Dolj", "Galați", "Giurgiu",
  "Gorj", "Harghita", "Hunedoara", "Ialomița", "Iași", "Ilfov", "Maramureș", "Mehedinți", "Mureș", "Neamț",
  "Olt", "Prahova", "Satu Mare", "Sălaj", "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea", "Vaslui",
  "Vâlcea", "Vrancea",
];

const PROSPECT_DEFAULT_TEMPLATES = {
  cazare: {
    subject: "{nume} pe OpeningHoursToday — înscriere gratuită",
    body: "Bună ziua,\n\nVă scriem din partea OpeningHoursToday (opening-hours-today.eu), un ghid online pentru turiștii care vizitează {localitate} și împrejurimile.\n\nAm dori să includem și {nume} în secțiunea noastră de cazări. Înscrierea este gratuită, iar turiștii vă contactează direct — telefonic sau pe WhatsApp, fără intermediari și fără comisioane.\n\nÎnscrierea durează doar câteva minute, aici:\n{link}\n\nDacă nu doriți să mai primiți mesaje de la noi, răspundeți simplu cu „NU” și nu vă vom mai contacta.\n\nCu stimă,\nEchipa OpeningHoursToday",
  },
  restaurant: {
    subject: "{nume} pe OpeningHoursToday — înscriere gratuită",
    body: "Bună ziua,\n\nVă scriem din partea OpeningHoursToday (opening-hours-today.eu), un ghid online pentru turiștii și localnicii din {localitate}.\n\nAm dori să includem și {nume} în secțiunea noastră de restaurante, puburi și cafenele. Înscrierea este gratuită, iar clienții vă găsesc direct, cu program, meniu și contact.\n\nÎnscrierea durează doar câteva minute, aici:\n{link}\n\nDacă nu doriți să mai primiți mesaje de la noi, răspundeți simplu cu „NU” și nu vă vom mai contacta.\n\nCu stimă,\nEchipa OpeningHoursToday",
  },
  obiectiv: {
    subject: "{nume} pe OpeningHoursToday — înscriere gratuită",
    body: "Bună ziua,\n\nVă scriem din partea OpeningHoursToday (opening-hours-today.eu), un ghid online pentru turiștii care vizitează {localitate} și împrejurimile.\n\nAm dori să includem și {nume} în secțiunea noastră de obiective turistice. Înscrierea este gratuită, iar vizitatorii găsesc direct programul, tarifele și cum ajung.\n\nÎnscrierea durează doar câteva minute, aici:\n{link}\n\nDacă nu doriți să mai primiți mesaje de la noi, răspundeți simplu cu „NU” și nu vă vom mai contacta.\n\nCu stimă,\nEchipa OpeningHoursToday",
  },
};

// Mesajul pentru locurile propuse de un turist: locul e DEJA publicat (cu
// programul trimis de vizitator), iar proprietarului i se oferă să-l preia.
const PROSPECT_PROPOSED_TEMPLATE = {
  subject: "{nume} a fost propus de un vizitator pe OpeningHoursToday",
  body: "Bună ziua,\n\nVă scriem din partea OpeningHoursToday (opening-hours-today.eu), un ghid online pentru turiștii și localnicii din {localitate}.\n\nUn vizitator a propus {nume} pe site-ul nostru, iar noi l-am publicat deja, cu programul transmis de el.\n\nDacă sunteți proprietarul sau administratorul, puteți prelua pagina GRATUIT: intrați pe linkul de mai jos, verificați și corectați programul, adăugați fotografii, meniul/tarifele și datele de contact, ca turiștii să vă găsească ușor:\n{link}\n\nDacă nu doriți să mai primiți mesaje de la noi, răspundeți simplu cu „NU” și nu vă vom mai contacta.\n\nCu stimă,\nEchipa OpeningHoursToday",
};


// ------------------------------------------------------------------
// „Unde se află proprietatea?” — întrebat ÎNAINTE de înscriere. Deocamdată
// înscrierile sunt doar pentru România; cine are proprietatea în altă țară
// își poate lăsa emailul pe lista de așteptare (tabela waitlist). Textul e
// bilingv RO/EN, ca să-l înțeleagă și un străin.
// ------------------------------------------------------------------
const WAITLIST_BUSINESS_TYPES = {
  cazare: "Cazare / Accommodation", restaurant: "Restaurant", cafenea: "Cafenea / Café",
  pub: "Pub / Bar", obiectiv: "Obiectiv turistic / Attraction", altul: "Altul / Other",
};


// index localitate -> județ, construit o singură dată, din datele deja
// existente (OBIECTIVE_ITINERAR) — acoperă orașele care apar în lista de
// obiective; pentru orice alt oraș, cădem pe SITEMAP_CITIES + CITY_COORDS,
// unde nu avem județ direct, deci recunoaștem doar ce apare deja aici
const LOCALITATE_TO_JUDET = {};

const ALL_JUDETE_NORMALIZED = {};


// Filtrare locală — NU trimitem toate cele 500 către OpenAI. Găsim județul
// cerut, luăm obiectivele din el; dacă sunt prea puține (sub 12, insuficient
// pentru un itinerar pe mai multe zile), completăm cu județele vecine, în
// ordine, până avem suficiente. Limită tare la 70 de linii trimise către AI —
// suficient pentru orice itinerar rezonabil, ține promptul mic și ieftin.
const MAX_OBIECTIVE_PROMPT = 70;

const MIN_OBIECTIVE_UTILE = 12;


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

module.exports = { RO_TO_EU_MIGRATION_ACTIVE, RO_TO_EU_MIGRATION_EXCLUDED_PREFIXES, RO_TO_EU_GUIDES_MAP, GLOBAL_BACK_BTN_INLINE_CSS, BACK_PARENT_BY_PATH, DB_CONNECTION_STRING, ADMIN_SECRET_KEY, ACCOMMODATION_PREVIEW_KEY, ACCOMMODATION_LIVE, RESEND_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ACCOMMODATION_FEATURED_PRICE_CENTS, ACCOMMODATION_FEATURED_DURATION_DAYS, ACCOMMODATION_TRIAL_MONTHS, VIEWS_SAMPLE_RATE, AVIASALES_SRC, TRANSFER_WIDGET_SRC_EU, TRANSFER_WIDGET_SRC_RO, ACC_SUPPORTED_CURRENCIES, ACC_FALLBACK_RATES, BLOB_READ_WRITE_TOKEN, ACCOMMODATION_SESSION_SECRET, ADMIN_SESSION_SECRET, TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, GOOGLE_PLACES_API_KEY_LIVE, OPENWEATHER_API_KEY, WEATHER_DAILY_SAFETY_LIMIT, dbPool, INTERNAL_TO_GOOGLE_LANG, REPORT_THRESHOLD, BEACH_TAG_THRESHOLD, VOTE_POPULAR_THRESHOLD, BOT_USER_AGENT_PATTERN, codAdSense, adsensePublisherId, ADSENSE_ENABLED, TRAVEL_GUIDES_MONETIZATION_READY, codAnalytics, linkMallAffiliate, linkCatalogLidl, linkCatalogKaufland, linkAmazonAffiliate, linkBileteTurism, BEACH_PARTNER_OFFERS, ATTRACTION_TICKET_URLS, GYG_PARTNER_ID, linkGlovoAffiliate, linkBringoAffiliate, BOOKING_AFFILIATE_ID, ROMANIAN_LEGAL_HOLIDAYS_2026, GEO_BTN_LABELS, ATTRACTION_FOOTER_TEMPLATES, BOOKING_HINT_TEMPLATES, BOOKING_HINT_TEMPLATES_BEACH, SCHEMA_DAY_NAMES, linkOmioAffiliate, linkTheForkAffiliate, linkOpenTableAffiliate, RESTAURANT_PLATFORM_BY_COUNTRY, AWIN_YPS_MERCHANT_ID, AWIN_YPS_AFFILIATE_ID, KIWI_TRAVELPAYOUTS_MARKER, DISCOVERCARS_AFFILIATE_ID, HOLIDAY_RADAR_LABELS, ARRIVAL_PLANNER_LABELS, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, BEACH_CONTENT_LABELS_RO, BEACH_CONTENT_LABELS_UK, FREE_ACCESS_KEYWORDS_RE, FREE_ACCESS_EXCLUDE_RE, FREE_ACCESS_DAM_RE, FREE_ACCESS_SKIP_CATEGORIES, MOUNTAIN_ROAD_RE, ROAD_WORD_RE, MOUNTAIN_ROAD_LABELS, ARRIVAL_GUIDE_STORE_KEYS, googleMapsApiKey, linkAfiliatDedeman, linkAfiliatAltex, linkAfiliatJysk, STORE_AFFILIATE_LINKS, GENERIC_PARTNER_OFFERS, BE_HOLIDAYS, BE_DIY_HOLIDAYS, BEACH_CONTENT_LANG_CACHE, BEACH_CONTENT_LANG_FILES, COUNTRY_NAMES_RO, COUNTRY_NAMES_EN, GEO_COUNTRY_MAP, LANGUAGE_FLAGS, ICON_SVG, MANIFEST_JSON, MANIFEST_JSON_INTL, SW_SCRIPT, STORE_CATEGORY_BY_KEY, STORE_ALIASES, DAY_NAMES, RO_DOMAIN, INTL_DOMAIN, REVIEWS_CLIENT_JS, REVIEW_CRITERIA, PLACE_REVIEW_KINDS, STAR_PATH, REVIEWS_CSS, PUBLISHABLE_PROPOSAL_TYPES, PLACE_NAME_HINTS_FOOD, NAMED_MALLS_BY_CITY, CSS_STYLES, LANG_META, BACK_BUTTON_LABELS, SUBMIT_PLACE_SCHEDULE_DAYS, SUBMIT_PLACE_LABELS, NO_MATCHES_LABELS, SUBMIT_PLACE_NO_RESULTS_LABELS, HOME_STAY_CTA_LABELS, TRAVEL_GUIDES_BY_LANG, RO_INTL_STORE_CONFIG, SITEMAP_BRANDS, SITEMAP_MALLS, ALLOWED_REPORT_REASONS, REPORT_IP_SALT, OWNER_NOTICE_CONTACT_RO, OWNER_NOTICE_CONTACT_EN, OWNER_EXISTS_CACHE, EMAIL_RE, SOCIAL_ICONS, DAISY_TYPES, ACC_CURRENCY_LABELS, ACC_LANGUAGES, ACC_CURRENCY_LABELS_EN, ACCOMMODATION_PHOTO_TYPES, ACCOMMODATION_TYPES, ACCOMMODATION_TYPE_LABELS, ACCOMMODATION_AMENITIES, RESTAURANT_LIVE, RESTAURANT_PREVIEW_KEY, RESTAURANT_VENUE_TYPES, RESTAURANT_DIETARY_OPTIONS, RESTAURANT_AMENITIES, ATTRACTION_VENUE_TYPES, ATTRACTION_AMENITIES, I18N_MAPS_EN, ATTRACTION_FILE_TYPES, RESTAURANT_FILE_TYPES, SUBMISSION_TYPES, HOLIDAY_PUSH_TEXTS, BUSINESS_BADGE_LABELS, SEO_TYPE_WORDS, DESC_AI_CLICHEE, PLECI_ALLOWED_HOSTS, PLECI_NETWORK_LABELS, BED_TYPES, BATH_AMENITIES, EXTERIOR_ACCESS, EXTERIOR_AMENITIES, PA_ICON_PATHS, PA_ICON_MAP, UNIT_TYPES, KITCHEN_TYPES, HOTEL_SUBTYPES, HOTEL_RECEPTION, HOTEL_BEDS, HOTEL_ROOM_AMENITIES, HOTEL_MENUS, HOTEL_MEAL_PLANS, HOTEL_FACILITIES, HOTEL_PETS, HOTEL_QUIET, PENSION_TYPES, RENTAL_MODES, VIEW_TYPES, BEDROOM_AMENITIES, LIVING_AMENITIES, KITCHEN_APPLIANCES, STRUCT_FACILITY_KEYS, PENSION_PROPERTY_GROUPS, PENSION_BED_KEYS, PENSION_BATH_TYPES, LIVING_GROUPS, LIVING_ITEM_KEYS, FIREPLACE_TYPES, PENSION_MAIN_BEDS, PENSION_EXTRA_BEDS, CAMP_UNITS, CAMP_FACILITIES, CAMP_GROUPS, CAMP_VEHICLES, TYPE_DETAILS_CLIENT_JS, VENUE_PAGE_CSS, LOCAL_SEARCH_HITS, PROSPECT_SEGMENTS, PROSPECT_STATUSES, PROSPECT_TYPE_OPTIONS, PROSPECT_OTHER_TYPE_KEY, PROSPECT_JUDETE_RO, PROSPECT_DEFAULT_TEMPLATES, PROSPECT_PROPOSED_TEMPLATE, WAITLIST_BUSINESS_TYPES, LOCALITATE_TO_JUDET, ALL_JUDETE_NORMALIZED, MAX_OBIECTIVE_PROMPT, MIN_OBIECTIVE_UTILE, MIN_OBIECTIVE_UTILE_INTL, CAMP_SHADE, CAMP_UNIT_BEDS, CAMP_UNIT_AMENITIES, CAMP_PHOTO_MAX, HOTEL_ROOM_PHOTO_MAX, HOTEL_PHOTO_MAX, APT_GROUPS, APT_OPTS, APT_INDEX, APT_BEDROOMS_MAX, APT_BATHS_MAX };

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
const app = express();

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
const linkEmagMall = "https://l.profitshare.ro/l/16330318";
const linkCatalogLidl = ""; // O lăsăm goală momentan, o vei adăuga tu din mers când ai aprobarea
const linkCatalogKaufland = ""; // O lăsăm goală momentan, o vei adăuga tu din mers când ai aprobarea
// link Amazon Affiliate — folosit DOAR pe paginile internaționale (DE/UK/ES),
// afișat sub cardul de status pe pagina de magazin. Pe RO, malls rămân cu butonul eMAG.
const linkAmazonAffiliate = "";
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
   alimentează DOAR paginile noi /:tara(de|uk|es|fr|it|pl|nl)/... .
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
};

// Marea Britanie: legea limitează magazinele mari la 6 ore de vânzare duminica
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
};

const COUNTRY_LABELS = { ro: "🇷🇴 Romania", de: "🇩🇪 Germany", uk: "🇬🇧 United Kingdom", es: "🇪🇸 Spain", fr: "🇫🇷 France", it: "🇮🇹 Italy", pl: "🇵🇱 Poland", nl: "🇳🇱 Netherlands" };

/* ============================================================
   0.5) PWA — manifest, service worker, iconiță
   Cerute prin rutele /manifest.json, /sw.js și /icon.svg mai jos,
   ca legăturile din <head> să funcționeze efectiv, nu doar să existe.
   ============================================================ */

// iconiță simplă, generată ca SVG (nu necesită fișiere PNG separate;
// pentru suport iOS mai vechi, poți adăuga ulterior și icon-192.png / icon-512.png reale)
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0F1115"/>
  <rect x="96" y="96" width="320" height="320" rx="48" fill="#16A34A"/>
  <text x="256" y="300" font-family="Arial, sans-serif" font-size="180" font-weight="800" fill="#FFFFFF" text-anchor="middle">P</text>
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
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
  ],
};

// Manifest separat pentru domeniul internațional — nume/limbă potrivite,
// restul (iconițe, culori) identic.
const MANIFEST_JSON_INTL = {
  ...MANIFEST_JSON,
  name: "Opening Hours Today",
  short_name: "OpeningHoursToday",
  description: "Check instantly whether major stores in Germany, the UK, and Spain are open right now.",
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
  cinemacity: { name: "Cinema City", slug: "cinema-city", type: "cinema", ticketUrl: "https://www.cinemacity.ro/" },
  cineplexx: { name: "Cineplexx", type: "cinema", ticketUrl: "https://www.cineplexx.ro/" },
  happycinema: { name: "Happy Cinema", slug: "happy-cinema", type: "cinema", ticketUrl: "https://www.happycinema.ro/" },
  movieplex: { name: "Movie Plex", slug: "movie-plex", type: "cinema", ticketUrl: "https://www.movieplex.ro/" },
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
    `script-src 'self' 'nonce-${nonce}' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagservices.com https://www.google.com https://www.gstatic.com https://www.googletagmanager.com`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://www.gstatic.com https://www.google-analytics.com",
    "connect-src 'self' https://api.bigdatacloud.net https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com",
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
  --text:#F3F5F8; --muted:#8E96AA; --accent:#FFB648; --accent-dim:#4A3A22;
  --open-bg:#16A34A; --open-glow:rgba(22,163,74,.35);
  --closed-bg:#DC2626; --closed-glow:rgba(220,38,38,.35);
  --radius-lg:26px; --radius-md:16px;
  --font-display:'Sora',sans-serif; --font-body:'Inter',sans-serif; --font-mono:'JetBrains Mono',monospace;
}
*{box-sizing:border-box;margin:0;padding:0;}
html{-webkit-text-size-adjust:100%;}
body{background:var(--bg);color:var(--text);font-family:var(--font-body);line-height:1.5;-webkit-font-smoothing:antialiased;padding-bottom:48px;}
@media (prefers-reduced-motion: reduce){*{animation-duration:.001ms !important;transition-duration:.001ms !important;}}
a{color:inherit;text-decoration:none;}
.wrap{max-width:520px;margin:0 auto;padding:0 18px;}
header{position:sticky;top:0;z-index:10;background:rgba(15,17,21,.88);backdrop-filter:blur(10px);border-bottom:1px solid var(--border);padding:14px 0;}
.header-row{display:flex;align-items:center;justify-content:space-between;}
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
.status-badge{display:inline-flex;align-items:center;gap:6px;margin-top:14px;background:rgba(255,255,255,.16);border-radius:100px;padding:5px 12px;font-family:var(--font-mono);font-size:12.5px;color:#fff;font-weight:600;}
.status-badge .dotw{width:6px;height:6px;border-radius:50%;background:#fff;}
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
.affiliate-btn-emag{background:linear-gradient(135deg,#0058CC,#0086FF);color:#fff;box-shadow:0 12px 26px -10px rgba(0,134,255,.55);}
.affiliate-btn-generic{background:linear-gradient(135deg,#FF5F1F,#FFB648);color:#1A1200;box-shadow:0 12px 26px -10px rgba(255,150,50,.5);}
.cinema-card{margin:14px 18px 0;padding:28px 24px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);text-align:center;}
.cinema-note{font-size:13px;color:var(--muted);line-height:1.6;margin:10px 0 18px;}
.cinema-btn{display:inline-block;background:linear-gradient(135deg,#E63946,#FF6B6B);color:#fff;text-decoration:none;font-family:var(--font-display);font-weight:700;font-size:15px;padding:14px 26px;border-radius:100px;box-shadow:0 12px 26px -10px rgba(230,57,70,.5);}
.amazon-btn{display:block;text-align:center;width:calc(100% - 36px);margin:14px 18px 0;padding:15px 20px;border-radius:100px;font-family:var(--font-display);font-weight:700;font-size:15px;text-decoration:none;background:linear-gradient(135deg,#131A22,#232F3E);color:#FF9900;border:1px solid #FF9900;box-shadow:0 12px 26px -10px rgba(0,0,0,.5);}
.sub-nav-tabs{display:flex;gap:6px;margin:14px 18px 0;background:#1e1e1e;border-radius:var(--radius-md);padding:6px;}
.sub-nav-tab{flex:1 1 0;background:transparent;border:none;border-radius:calc(var(--radius-md) - 4px);padding:13px 10px;font-family:var(--font-display);font-weight:700;font-size:13.5px;color:var(--muted);cursor:pointer;transition:background .18s ease,color .18s ease;text-align:center;min-height:44px;}
.sub-nav-tab.active{background:var(--accent);color:#1A1200;}
.sub-nav-panel{display:none;}
.sub-nav-panel.active{display:block;}
.attractions-country{margin:20px 18px 8px;font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text);}
.section-title{font-family:var(--font-display);font-weight:700;font-size:16px;margin:30px 18px 12px;display:flex;align-items:center;gap:8px;}
.section-title .bar{width:4px;height:16px;background:var(--accent);border-radius:2px;}
.schedule-card{margin:0 18px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;}
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
.holiday-card{margin:12px 18px 0;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:14px 16px;}
.holiday-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:14px;}
.holiday-row + .holiday-row{border-top:1px solid var(--border);}
.holiday-label{font-weight:600;}
.holiday-hours{font-family:var(--font-mono);color:var(--muted);font-size:13.5px;}
.holiday-hours.closed{color:#F87171;}
.mall-list{list-style:none;margin:0 18px;display:flex;flex-direction:column;gap:8px;}
.mall-list li{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);}
.mall-list a{display:block;padding:14px 16px;font-weight:600;font-size:14.5px;}
.mall-list a:hover{color:var(--accent);}
.intro-text{margin:16px 18px 0;font-size:14.5px;color:var(--muted);line-height:1.7;}
.geo-btn{display:block;width:calc(100% - 36px);margin:16px 18px 0;background:var(--accent);color:#1A1200;border:none;border-radius:100px;padding:14px 20px;font-family:var(--font-display);font-weight:700;font-size:15px;cursor:pointer;transition:opacity .15s ease;}
.geo-btn:disabled{opacity:.6;cursor:default;}
.geo-status{margin:10px 18px 0;font-size:13px;color:var(--muted);}
.city-search-form{display:flex;gap:8px;margin:16px 18px 0;}
.city-search-input{flex:1 1 auto;background:var(--surface);border:1px solid var(--border);border-radius:100px;padding:12px 16px;color:var(--text);font-family:var(--font-body);font-size:14.5px;}
.city-search-input::placeholder{color:var(--muted);}
.city-search-input:focus{outline:none;border-color:var(--accent);}
.city-search-btn{flex:0 0 auto;background:var(--accent);color:#1A1200;border:none;border-radius:100px;padding:12px 20px;font-family:var(--font-display);font-weight:700;font-size:14.5px;cursor:pointer;}
.install-btn{display:none;width:calc(100% - 36px);margin:14px 18px 0;background:#2ecc71;color:#ffffff;border:none;border-radius:100px;padding:14px 20px;font-family:var(--font-display);font-weight:700;font-size:15px;cursor:pointer;}
.ios-install-hint{display:none;margin:8px 18px 0;font-size:12.5px;color:var(--muted);text-align:center;line-height:1.5;}
.geo-suggestion{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 18px 0;background:var(--surface);border:1px solid var(--accent);border-radius:var(--radius-md);padding:12px 16px;font-size:14px;}
.geo-suggestion strong{color:var(--accent);}
.geo-suggestion-btn{flex:0 0 auto;background:var(--accent);color:#1A1200;border-radius:100px;padding:8px 14px;font-weight:700;font-size:13px;white-space:nowrap;}
.geo-suggestion-note{margin:6px 18px 0;font-size:12px;color:var(--muted);text-align:center;}
.disclaimer{margin:14px 18px 0;font-size:12px;color:var(--muted);line-height:1.6;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px 14px;}
footer{margin:36px 18px 0;padding-top:18px;border-top:1px solid var(--border);font-size:12.5px;color:var(--muted);}
footer p + p{margin-top:8px;}
footer strong{color:var(--text);}
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
    return { open:true, sub: fmt(LABELS.closesToday, "time", today.hours[1]) };
  }

  function applyStatus(el, status){
    if (!el) return;
    el.classList.remove("is-open","is-closed");
    el.classList.add(status.open ? "is-open" : "is-closed");
    var t = el.querySelector(".status-text"); if (t) t.textContent = status.open ? LABELS.openNow : LABELS.closedNow;
    var s = el.querySelector(".status-sub"); if (s) s.textContent = status.sub;
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

  btn.addEventListener("click", function(){
    btn.disabled = true;
    btn.textContent = "Se detectează...";
    showStatus("Îți cerem acordul pentru locație...");

    navigator.geolocation.getCurrentPosition(
      function(pos){
        var lat = pos.coords.latitude, lon = pos.coords.longitude;
        showStatus("Îți identificăm orașul...");

        fetch("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + lat + "&longitude=" + lon + "&localityLanguage=ro")
          .then(function(r){ return r.json(); })
          .then(function(data){
            var city = (data && (data.city || data.locality)) || null;
            if (!city && data && data.localityInfo && data.localityInfo.administrative) {
              var admin = data.localityInfo.administrative;
              for (var i = admin.length - 1; i >= 0; i--) {
                if (admin[i] && admin[i].name) { city = admin[i].name; break; }
              }
            }
            if (!city) { resetButton("Nu am putut identifica orașul. Alege manual mai jos."); return; }
            window.location.href = "/" + slugify(city);
          })
          .catch(function(){ resetButton("A apărut o eroare la identificarea orașului. Alege manual mai jos."); });
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
  tabs.forEach(function(tab){
    tab.addEventListener("click", function(){
      var target = tab.getAttribute("data-tab");
      tabs.forEach(function(t){ t.classList.toggle("active", t === tab); });
      document.querySelectorAll(".sub-nav-panel").forEach(function(panel){
        panel.classList.toggle("active", panel.getAttribute("data-panel") === target);
      });
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

function pageShell({ title, description, canonical, bodyHtml, dataForClient, nonce }) {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
${codAnalytics ? withNonce(codAnalytics, nonce) : ""}
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:locale" content="ro_RO">
<link rel="manifest" href="/manifest.json">
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
${dataForClient ? buildClientScript(dataForClient, nonce) : ""}
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
function renderStorePage({ orasSlug, orasDisplay, magazinSlug, magazinDisplay, locatieDisplay, store, magazinKey, baseUrl, nonce }) {
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
      ? `<a href="${escapeHtml(linkEmagMall)}" target="_blank" rel="noopener sponsored" class="affiliate-btn affiliate-btn-emag">🔥 Vezi magazinele cu reduceri de azi pe eMAG</a>`
      : "";

    mainHtml = `
      <div class="status-card" id="statusCard">
        <div class="store-name">${escapeHtml(magazinDisplay)}${escapeHtml(locatieSuffix)} ${escapeHtml(orasDisplay)} — Zonă shopping</div>
        <div class="status-text">—</div>
        <div class="status-sub">Se calculează programul...</div>
        <div class="status-badge"><span class="dotw"></span><span id="statusBadge">Azi</span></div>
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

    mainHtml = `
      <div class="status-card" id="statusCard">
        <div class="store-name">${escapeHtml(magazinDisplay)}${escapeHtml(locatieSuffix)} ${escapeHtml(orasDisplay)}</div>
        <div class="status-text">—</div>
        <div class="status-sub">Se calculează programul...</div>
        <div class="status-badge"><span class="dotw"></span><span id="statusBadge">Azi</span></div>
      </div>

      ${affiliateButtonHtml}

      <h2 class="section-title"><span class="bar"></span>Program săptămânal</h2>
      <div class="schedule-card"><table><thead><tr><th>Zi</th><th style="text-align:right">Interval orar</th></tr></thead>
      <tbody>${renderWeekTableRows(store.weekly)}</tbody></table></div>

      <h2 class="section-title"><span class="bar"></span>Program de sărbători</h2>
      <div class="holiday-card">${renderHolidayRows(store.holidays)}</div>
    `;
    dataForClient = { type: "store", weekly: store.weekly, holidays: store.holidays };
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

  ${mainHtml}

  <p class="disclaimer">Programul afișat pentru ${escapeHtml(magazinDisplay)}${escapeHtml(locatieSuffix)} ${escapeHtml(orasDisplay)} este orientativ, pe baza orarului standard anunțat de rețea. Unele locații pot avea ore diferite — verifică programul afișat la intrarea magazinului.</p>

  <footer>
    <p><strong>Programul de Azi</strong> îți arată în timp real dacă ${escapeHtml(magazinDisplay)}${escapeHtml(locatieSuffix)} din ${escapeHtml(orasDisplay)} este deschis chiar acum, plus programul complet pe zile și programul special de sărbători legale.</p>
  </footer>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}
</main>`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient, nonce });
}

// Pagină generală de oraș: site.ro/:oras (fără magazin specificat)
function renderCityPage({ orasSlug, orasDisplay, baseUrl, nonce }) {
  const title = `Program Magazine ${orasDisplay} Azi – Lidl, Kaufland, Penny și Alte Magazine`;
  const description = `Alege un magazin din ${orasDisplay} și vezi instant dacă este deschis acum: Lidl, Kaufland, Penny, Mega Image, Carrefour, Auchan sau mall-ul din ${orasDisplay}.`;
  const canonical = `${baseUrl}/${orasSlug}`;

  const listItems = Object.keys(STORE_CONFIG)
    .map((key) => {
      const cfg = STORE_CONFIG[key];
      const urlSlug = cfg.slug || key;
      return `<li><a href="/${orasSlug}/${urlSlug}">${escapeHtml(cfg.name)} ${escapeHtml(orasDisplay)}</a></li>`;
    })
    .join("");

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

  <footer>
    <p><strong>Programul de Azi</strong> îți arată în timp real programul magazinelor din ${escapeHtml(orasDisplay)}: Lidl, Kaufland, Penny, Mega Image, Carrefour, Auchan și mall-uri.</p>
  </footer>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}
</main>`;

  // ceas simplu, fără status (nicio entitate specifică selectată încă)
  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce });
}

/* ============================================================
   PAGINI INTERNAȚIONALE (DE/UK/ES) — funcții separate de cele RO,
   ca să nu riscăm nimic din ce funcționează deja pentru România.
   ============================================================ */

// Pagină de magazin internațională: /:tara/:oras/:magazin
function renderIntlStorePage({ countryCode, orasSlug, orasDisplay, magazinSlug, magazinDisplay, store, baseUrl, nonce }) {
  const t = TRANSLATIONS[countryCode];
  const title = t.titleTemplate(magazinDisplay, orasDisplay);
  const description = t.descriptionTemplate(magazinDisplay, orasDisplay);
  const canonical = `${baseUrl}/${countryCode}/${orasSlug}/${magazinSlug}`;

  const amazonButtonHtml = linkAmazonAffiliate
    ? `<a href="${escapeHtml(linkAmazonAffiliate)}" target="_blank" rel="noopener sponsored" class="amazon-btn">${escapeHtml(t.amazonBtn)}</a>`
    : "";

  const weeklyRows = store.weekly
    .map((w, i) => {
      const hours = w ? `${w.open} – ${w.close}` : t.closedWord;
      return `<tr data-day="${i}"><td class="day-cell">${t.dayNames[i]}</td><td class="hours-cell">${hours}</td></tr>`;
    })
    .join("");

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

  <div class="status-card" id="statusCard">
    <div class="store-name">${escapeHtml(magazinDisplay)} ${escapeHtml(orasDisplay)}</div>
    <div class="status-text">—</div>
    <div class="status-sub">${escapeHtml(t.calculating)}</div>
    <div class="status-badge"><span class="dotw"></span><span id="statusBadge">${escapeHtml(t.todayLabel)}</span></div>
  </div>

  ${amazonButtonHtml}

  <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.weeklyTitle)}</h2>
  <div class="schedule-card"><table><thead><tr><th>&nbsp;</th><th style="text-align:right">&nbsp;</th></tr></thead>
  <tbody>${weeklyRows}</tbody></table></div>

  <h2 class="section-title"><span class="bar"></span>${escapeHtml(t.holidaysTitle)}</h2>
  <div class="holiday-card">${holidayHtml}</div>

  <p class="disclaimer">${escapeHtml(t.disclaimer(`${magazinDisplay} ${orasDisplay}`))}</p>

  <footer>
    <p><strong>Opening Hours Today</strong> ${escapeHtml(t.footer(`${magazinDisplay} ${orasDisplay}`))}</p>
  </footer>
</main>`;

  const dataForClient = { type: "store", weekly: store.weekly, holidays: store.holidays, dayNames: t.dayNames, labels: t.labels };
  return pageShell({ title, description, canonical, bodyHtml, dataForClient, nonce });
}

// Pagină generală de oraș internațională: /:tara/:oras
function renderIntlCityPage({ countryCode, orasSlug, orasDisplay, baseUrl, nonce }) {
  const t = TRANSLATIONS[countryCode];
  const country = COUNTRIES[countryCode];
  const title = `${orasDisplay} — Opening Hours Today`;
  const description = t.descriptionTemplate("", orasDisplay);
  const canonical = `${baseUrl}/${countryCode}/${orasSlug}`;

  const listItems = Object.keys(country.config)
    .map((key) => {
      const cfg = country.config[key];
      const urlSlug = cfg.slug || key;
      return `<li><a href="/${countryCode}/${orasSlug}/${urlSlug}">${escapeHtml(cfg.name)} ${escapeHtml(orasDisplay)}</a></li>`;
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
  <p class="breadcrumb"><a href="/">${escapeHtml(t.home)}</a> / ${escapeHtml(orasDisplay)}</p>
  <h1 class="page-h1">${escapeHtml(orasDisplay)}</h1>
  <ul class="mall-list">${listItems}</ul>
</main>`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [], dayNames: t.dayNames, labels: t.labels }, nonce });
}

// Pagină de start: site.ro/ — fără oraș/magazin specificat încă
// Pagină de start pentru domeniul internațional (opening-hours-today.eu) —
// simplu selector de țară, în engleză (punct de intrare neutru, înainte să
// știm limba vizitatorului). Minimală, deliberat — o pagină completă de tip
// homepage RO (geolocație, PWA, căutare) pentru fiecare piață e un pas separat.
function renderIntlHomePage(nonce, baseUrl) {
  const title = "Opening Hours Today — Is the store open now?";
  const description = "Check instantly whether major stores in Germany, the UK, and Spain are open right now, plus full weekly and holiday opening hours.";
  const canonical = `${baseUrl}/`;

  const countryLinks = [
    { code: "de", flag: "🇩🇪", name: "Germany", href: `/de/${slugifyCityName(COUNTRIES.de.cities[0])}` },
    { code: "uk", flag: "🇬🇧", name: "United Kingdom", href: `/uk/${slugifyCityName(COUNTRIES.uk.cities[0])}` },
    { code: "es", flag: "🇪🇸", name: "Spain", href: `/es/${slugifyCityName(COUNTRIES.es.cities[0])}` },
    { code: "fr", flag: "🇫🇷", name: "France", href: `/fr/${slugifyCityName(COUNTRIES.fr.cities[0])}` },
    { code: "it", flag: "🇮🇹", name: "Italy", href: `/it/${slugifyCityName(COUNTRIES.it.cities[0])}` },
    { code: "pl", flag: "🇵🇱", name: "Poland", href: `/pl/${slugifyCityName(COUNTRIES.pl.cities[0])}` },
    { code: "nl", flag: "🇳🇱", name: "Netherlands", href: `/nl/${slugifyCityName(COUNTRIES.nl.cities[0])}` },
  ];
  const countryListHtml = countryLinks
    .map((c) => `<li><a href="${c.href}">${c.flag} ${escapeHtml(c.name)}</a></li>`)
    .join("");

  // atracții grupate pe țară — link direct spre site-ul oficial, fără ore inventate
  const attractionsHtml = Object.keys(ATTRACTIONS)
    .map((code) => {
      const items = ATTRACTIONS[code]
        .map((a) => `<li><a href="${escapeHtml(a.url)}" target="_blank" rel="noopener">🎫 ${escapeHtml(a.name)}</a></li>`)
        .join("");
      return `<h3 class="attractions-country">${COUNTRY_LABELS[code]}</h3><ul class="mall-list">${items}</ul>`;
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
  <h1 class="page-h1">Is the store open right now?</h1>
  <p class="intro-text">Choose your country to see live opening hours for major stores near you.</p>

  <nav class="sub-nav-tabs">
    <button type="button" class="sub-nav-tab active" data-tab="stores">${escapeHtml(TRANSLATIONS.uk.tabStores)}</button>
    <button type="button" class="sub-nav-tab" data-tab="attractions">${escapeHtml(TRANSLATIONS.uk.tabAttractions)}</button>
  </nav>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}

  <div class="sub-nav-panel active" data-panel="stores">
    <h2 class="section-title"><span class="bar"></span>Choose a country</h2>
    <ul class="mall-list">${countryListHtml}</ul>
  </div>

  <div class="sub-nav-panel" data-panel="attractions">
    <h2 class="section-title"><span class="bar"></span>${escapeHtml(TRANSLATIONS.uk.tabAttractions)}</h2>
    <p class="intro-text">Official ticket and information pages — always check the live hours shown there before you visit.</p>
    ${attractionsHtml}
  </div>

  <footer>
    <p><strong>Opening Hours Today</strong> shows you in real time whether major stores in Germany, the UK, and Spain are currently open, plus full weekly and holiday opening hours.</p>
  </footer>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}
</main>
${buildTabsScript(nonce)}`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce });
}

function renderHomePage(nonce, suggestedCity, baseUrl) {
  const title = `${SITE_NAME} — Este magazinul deschis acum?`;
  const description = "Vezi instant dacă Lidl, Kaufland, Penny, Mega Image, Carrefour, Auchan sau mall-ul din orașul tău sunt deschise chiar acum, plus programul complet pe zile și de sărbători.";
  const canonical = `${baseUrl}/`;

  const exampleLinks = [
    { href: "/bucuresti/lidl", label: "Lidl București" },
    { href: "/cluj-napoca/kaufland", label: "Kaufland Cluj-Napoca" },
    { href: "/timisoara/mall", label: "Mall Timișoara" },
    { href: "/iasi/carrefour", label: "Carrefour Iași" },
    { href: "/brasov/penny", label: "Penny Brașov" },
    { href: "/constanta/auchan", label: "Auchan Constanța" },
    { href: "/bucuresti/mega-image", label: "Mega Image București" },
    { href: "/bucuresti/afi-cotroceni", label: "AFI Cotroceni" },
  ];
  const exampleListHtml = exampleLinks.map((l) => `<li><a href="${l.href}">${escapeHtml(l.label)}</a></li>`).join("");

  // Sugestie pe baza IP-ului — NU redirect forțat. Pe rețele mobile din România,
  // IP-ul apare adesea "din București" indiferent de orașul real al vizitatorului,
  // așa că îi lăsăm mereu alegerea, vizibilă chiar sub sugestie.
  const geoSuggestionHtml = suggestedCity
    ? `<div class="geo-suggestion">
        <span>📍 Se pare că ești în <strong>${escapeHtml(suggestedCity.display)}</strong></span>
        <a href="/${suggestedCity.slug}" class="geo-suggestion-btn">Vezi programul →</a>
      </div>
      <p class="geo-suggestion-note">Nu e orașul tău? Alege mai jos.</p>`
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

  ${geoSuggestionHtml}

  <h1 class="page-h1">Este magazinul deschis acum?</h1>
  <p class="intro-text">Scrie orașul tău mai jos sau lasă-ne să-l detectăm automat.</p>

  <form id="citySearchForm" class="city-search-form" autocomplete="off">
    <input type="text" id="citySearchInput" list="cityListOptions" class="city-search-input" placeholder="Scrie orașul tău (ex: Cluj-Napoca)">
    <datalist id="cityListOptions">${SITEMAP_CITIES.map((c) => `<option value="${escapeHtml(c)}"></option>`).join("")}</datalist>
    <button type="submit" class="city-search-btn">Caută</button>
  </form>

  <button type="button" id="geoBtn" class="geo-btn">📍 sau detectează orașul meu automat</button>
  <p id="geoStatus" class="geo-status" style="display:none"></p>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}

  <h2 class="section-title"><span class="bar"></span>Exemple rapide</h2>
  <ul class="mall-list">${exampleListHtml}</ul>

  <footer>
    <p><strong>Programul de Azi</strong> îți arată în timp real dacă Lidl, Kaufland, Penny, Mega Image, Carrefour, Auchan sau mall-urile sunt deschise chiar acum, în orice oraș din România.</p>
  </footer>

  <!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
  ${adSlotHtml()}
</main>
${buildCitySearchScript(nonce)}
${buildGeoScript(nonce)}
${buildInstallScript(nonce)}`;

  return pageShell({ title, description, canonical, bodyHtml, dataForClient: { type: "general", weekly: [], holidays: [] }, nonce });
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
];

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
    // opening-hours-today.eu — selector simplu de țară, fără geolocație RO
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(renderIntlHomePage(nonce, baseUrlFor(req)));
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
// (":tara(de|uk|es|fr|it|pl|nl)"), nu prin sintaxa "?" opțională, care e fragilă și
// se comportă inconsistent între versiunile de Express/path-to-regexp.
// Înregistrate ÎNAINTE de rutele RO, ca "/de/berlin/lidl" să nu fie
// interpretat greșit ca oraș="de" în sistemul românesc.
// Accesibile DOAR pe opening-hours-today.eu — pe programul-de-azi.ro,
// redirect 301 către domeniul internațional (nu duplicăm conținutul).
// ============================================================
app.get("/:tara(de|uk|es|fr|it|pl|nl)/:oras/:magazin", (req, res, next) => {
  if (req.params.oras.includes(".") || req.params.magazin.includes(".")) return next();

  if (!isIntlHost(req)) {
    return res.redirect(301, `https://${INTL_DOMAIN}${req.url}`);
  }

  const countryCode = req.params.tara;
  const country = COUNTRIES[countryCode];
  const orasSlug = req.params.oras.toLowerCase();
  const orasDisplay = toDisplayName(req.params.oras);
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

  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const html = renderIntlStorePage({ countryCode, orasSlug, orasDisplay, magazinSlug, magazinDisplay: found.displayName, store: found.config, baseUrl: baseUrlFor(req), nonce });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/:tara(de|uk|es|fr|it|pl|nl)/:oras", (req, res, next) => {
  if (req.params.oras.includes(".")) return next();

  if (!isIntlHost(req)) {
    return res.redirect(301, `https://${INTL_DOMAIN}${req.url}`);
  }

  const countryCode = req.params.tara;
  const orasSlug = req.params.oras.toLowerCase();
  const orasDisplay = toDisplayName(req.params.oras);

  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const html = renderIntlCityPage({ countryCode, orasSlug, orasDisplay, baseUrl: baseUrlFor(req), nonce });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// ============================================================
// RUTE ROMÂNEȘTI — accesibile DOAR pe programul-de-azi.ro. Pe domeniul
// internațional, redirect 301 către domeniul RO (nu duplicăm conținutul).
// ============================================================
app.get("/:oras/:magazin/:locatie", (req, res, next) => {
  // pagini hiper-locale: /cluj-napoca/kaufland/manastur — cartierul/strada e
  // inserat dinamic în titlu și în cardul de status, ca să prindem căutările
  // gen "program kaufland manastur" alături de căutările generale pe oraș
  if (req.params.oras.includes(".") || req.params.magazin.includes(".") || req.params.locatie.includes(".")) return next();

  if (isIntlHost(req)) {
    return res.redirect(301, `https://${RO_DOMAIN}${req.url}`);
  }

  const orasSlug = req.params.oras.toLowerCase();
  const orasDisplay = toDisplayName(req.params.oras);
  const magazinSlug = req.params.magazin.toLowerCase();
  const found = findStore(req.params.magazin);
  const magazinDisplay = found ? found.displayName : toDisplayName(req.params.magazin);
  const locatieDisplay = toDisplayName(req.params.locatie);

  const effectiveStore = found ? found.config : { type: "store", weekly: supermarketWeekly(), holidays: SUPERMARKET_HOLIDAYS };

  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const html = renderStorePage({ orasSlug, orasDisplay, magazinSlug, magazinDisplay, locatieDisplay, store: effectiveStore, magazinKey: found ? found.key : null, baseUrl: baseUrlFor(req), nonce });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/:oras/:magazin", (req, res, next) => {
  if (req.params.oras.includes(".") || req.params.magazin.includes(".")) return next();

  if (isIntlHost(req)) {
    return res.redirect(301, `https://${RO_DOMAIN}${req.url}`);
  }

  const orasSlug = req.params.oras.toLowerCase();
  const orasDisplay = toDisplayName(req.params.oras);
  const magazinSlug = req.params.magazin.toLowerCase();
  const found = findStore(req.params.magazin);
  const magazinDisplay = found ? found.displayName : toDisplayName(req.params.magazin);

  // dacă brand-ul nu e cunoscut, folosim tot programul standard național ca implicit,
  // dar păstrăm numele exact așa cum a fost tastat în URL
  const effectiveStore = found ? found.config : { type: "store", weekly: supermarketWeekly(), holidays: SUPERMARKET_HOLIDAYS };

  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
  const html = renderStorePage({ orasSlug, orasDisplay, magazinSlug, magazinDisplay, store: effectiveStore, magazinKey: found ? found.key : null, baseUrl: baseUrlFor(req), nonce });
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.get("/:oras", (req, res, next) => {
  if (req.params.oras.includes(".")) return next(); // cereri de tip fișier (css/js/ico) ignorate aici

  if (isIntlHost(req)) {
    return res.redirect(301, `https://${RO_DOMAIN}${req.url}`);
  }

  const orasSlug = req.params.oras.toLowerCase();
  const orasDisplay = toDisplayName(req.params.oras);

  const nonce = generateNonce();
  res.set("Content-Security-Policy", buildCsp(nonce));
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

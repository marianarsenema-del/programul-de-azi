// Date de configurare (liste de orașe, coordonate, config magazine per țară,
// etc.) — extrase din server.js, din același motiv ca locales.js.

const FR_TINY_MONUMENT_VILLAGES = ["Mont Saint-Michel", "Rocamadour", "Cheverny", "Ussé"];

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

const LU_STORE_CONFIG = {
  cactus: { name: "Cactus", weekly: luSupermarketWeekly(), holidays: LU_HOLIDAYS },
  auchan: { name: "Auchan", weekly: luSupermarketWeekly(), holidays: LU_HOLIDAYS },
  delhaize: { name: "Delhaize", weekly: luSupermarketWeekly(), holidays: LU_HOLIDAYS },
  aldi: { name: "Aldi", weekly: luSupermarketWeekly(), holidays: LU_HOLIDAYS },
  colruyt: { name: "Colruyt", weekly: luSupermarketWeekly(), holidays: LU_HOLIDAYS },
};

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

const MT_STORE_CONFIG = {
  lidl: { name: "Lidl", weekly: mtSupermarketWeekly(), holidays: MT_HOLIDAYS },
  pavi: { name: "PAVI", weekly: mtSupermarketWeekly(), holidays: MT_HOLIDAYS },
  pama: { name: "PAMA", weekly: mtSupermarketWeekly(), holidays: MT_HOLIDAYS },
  welbees: { name: "Welbee's", weekly: mtSupermarketWeekly(), holidays: MT_HOLIDAYS },
  greens: { name: "Greens", weekly: mtSupermarketWeekly(), holidays: MT_HOLIDAYS },
};

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

const CY_STORE_CONFIG = {
  lidl: { name: "Lidl", weekly: cySupermarketWeekly(), holidays: CY_HOLIDAYS },
  alphamega: { name: "AlphaMega", weekly: cySupermarketWeekly(), holidays: CY_HOLIDAYS },
  papantoniou: { name: "Papantoniou", weekly: cySupermarketWeekly(), holidays: CY_HOLIDAYS },
  sklavenitis: { name: "Sklavenitis", weekly: cySupermarketWeekly(), holidays: CY_HOLIDAYS },
  metro: { name: "Metro", weekly: cySupermarketWeekly(), holidays: CY_HOLIDAYS },
};

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

const EE_STORE_CONFIG = {
  selver: { name: "Selver", weekly: eeSupermarketWeekly(), holidays: EE_HOLIDAYS },
  coop: { name: "Coop", weekly: eeSupermarketWeekly(), holidays: EE_HOLIDAYS },
  maxima: { name: "Maxima", weekly: eeSupermarketWeekly(), holidays: EE_HOLIDAYS },
  rimi: { name: "Rimi", weekly: eeSupermarketWeekly(), holidays: EE_HOLIDAYS },
  lidl: { name: "Lidl", weekly: eeSupermarketWeekly(), holidays: EE_HOLIDAYS },
};

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

const LV_STORE_CONFIG = {
  rimi: { name: "Rimi", weekly: lvSupermarketWeekly(), holidays: LV_HOLIDAYS },
  maxima: { name: "Maxima", weekly: lvSupermarketWeekly(), holidays: LV_HOLIDAYS },
  lidl: { name: "Lidl", weekly: lvSupermarketWeekly(), holidays: LV_HOLIDAYS },
  spar: { name: "Spar", weekly: lvSupermarketWeekly(), holidays: LV_HOLIDAYS },
};

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

const LT_STORE_CONFIG = {
  maxima: { name: "Maxima", weekly: ltSupermarketWeekly(), holidays: LT_HOLIDAYS },
  lidl: { name: "Lidl", weekly: ltSupermarketWeekly(), holidays: LT_HOLIDAYS },
  iki: { name: "IKI", weekly: ltSupermarketWeekly(), holidays: LT_HOLIDAYS },
  norfa: { name: "Norfa", weekly: ltSupermarketWeekly(), holidays: LT_HOLIDAYS },
  rimi: { name: "Rimi", weekly: ltSupermarketWeekly(), holidays: LT_HOLIDAYS },
};

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

const SI_STORE_CONFIG = {
  mercator: { name: "Mercator", weekly: siSupermarketWeekly(), holidays: SI_HOLIDAYS },
  spar: { name: "Spar", weekly: siSupermarketWeekly(), holidays: SI_HOLIDAYS },
  hofer: { name: "Hofer", weekly: siSupermarketWeekly(), holidays: SI_HOLIDAYS },
  lidl: { name: "Lidl", weekly: siSupermarketWeekly(), holidays: SI_HOLIDAYS },
  tus: { name: "Tuš", weekly: siSupermarketWeekly(), holidays: SI_HOLIDAYS },
};

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

const SK_STORE_CONFIG = {
  tesco: { name: "Tesco", weekly: skSupermarketWeekly(), holidays: SK_HOLIDAYS },
  lidl: { name: "Lidl", weekly: skSupermarketWeekly(), holidays: SK_HOLIDAYS },
  kaufland: { name: "Kaufland", weekly: skSupermarketWeekly(), holidays: SK_HOLIDAYS },
  billa: { name: "Billa", weekly: skSupermarketWeekly(), holidays: SK_HOLIDAYS },
  coopjednota: { name: "COOP Jednota", slug: "coop-jednota", weekly: skSupermarketWeekly(), holidays: SK_HOLIDAYS },
};

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

const IE_STORE_CONFIG = {
  tesco: { name: "Tesco", weekly: ieSupermarketWeekly(), holidays: IE_HOLIDAYS },
  dunnesstores: { name: "Dunnes Stores", slug: "dunnes-stores", weekly: ieSupermarketWeekly(), holidays: IE_HOLIDAYS },
  supervalu: { name: "SuperValu", weekly: ieSupermarketWeekly(), holidays: IE_HOLIDAYS },
  aldi: { name: "Aldi", weekly: ieSupermarketWeekly(), holidays: IE_HOLIDAYS },
  lidl: { name: "Lidl", weekly: ieSupermarketWeekly(), holidays: IE_HOLIDAYS },
};

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

const HR_STORE_CONFIG = {
  konzum: { name: "Konzum", weekly: hrSupermarketWeekly(), holidays: HR_HOLIDAYS },
  lidl: { name: "Lidl", weekly: hrSupermarketWeekly(), holidays: HR_HOLIDAYS },
  plodine: { name: "Plodine", weekly: hrSupermarketWeekly(), holidays: HR_HOLIDAYS },
  spar: { name: "Spar", weekly: hrSupermarketWeekly(), holidays: HR_HOLIDAYS },
  kaufland: { name: "Kaufland", weekly: hrSupermarketWeekly(), holidays: HR_HOLIDAYS },
};

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

const HU_STORE_CONFIG = {
  lidl: { name: "Lidl", weekly: huSupermarketWeekly(), holidays: HU_HOLIDAYS },
  spar: { name: "Spar", weekly: huSupermarketWeekly(), holidays: HU_HOLIDAYS },
  tesco: { name: "Tesco", weekly: huSupermarketWeekly(), holidays: HU_HOLIDAYS },
  penny: { name: "Penny", weekly: huSupermarketWeekly(), holidays: HU_HOLIDAYS },
  aldi: { name: "Aldi", weekly: huSupermarketWeekly(), holidays: HU_HOLIDAYS },
};

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

const FI_STORE_CONFIG = {
  prisma: { name: "Prisma", weekly: fiSupermarketWeekly(), holidays: FI_HOLIDAYS },
  kcitymarket: { name: "K-Citymarket", slug: "k-citymarket", weekly: fiSupermarketWeekly(), holidays: FI_HOLIDAYS },
  lidl: { name: "Lidl", weekly: fiSupermarketWeekly(), holidays: FI_HOLIDAYS },
};

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

const CZ_STORE_CONFIG = {
  lidl: { name: "Lidl", weekly: czSupermarketWeekly(), holidays: CZ_HOLIDAYS },
  kaufland: { name: "Kaufland", weekly: czSupermarketWeekly(), holidays: CZ_HOLIDAYS },
  albert: { name: "Albert", weekly: czSupermarketWeekly(), holidays: CZ_HOLIDAYS },
  billa: { name: "Billa", weekly: czSupermarketWeekly(), holidays: CZ_HOLIDAYS },
  tesco: { name: "Tesco", weekly: czSupermarketWeekly(), holidays: CZ_HOLIDAYS },
};

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

const PT_STORE_CONFIG = {
  continente: { name: "Continente", weekly: ptSupermarketWeekly(), holidays: PT_HOLIDAYS },
  pingodoce: { name: "Pingo Doce", slug: "pingo-doce", weekly: ptSupermarketWeekly(), holidays: PT_HOLIDAYS },
  lidl: { name: "Lidl", weekly: ptSupermarketWeekly(), holidays: PT_HOLIDAYS },
};

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

const SE_STORE_CONFIG = {
  ica: { name: "ICA", weekly: seSupermarketWeekly(), holidays: SE_HOLIDAYS },
  coop: { name: "Coop", weekly: seSupermarketWeekly(), holidays: SE_HOLIDAYS },
  willys: { name: "Willys", weekly: seSupermarketWeekly(), holidays: SE_HOLIDAYS },
  lidl: { name: "Lidl", weekly: seSupermarketWeekly(), holidays: SE_HOLIDAYS },
};

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

// Cere din locales.js (nu invers) — evită dependența circulară: locales.js
// NU cere nimic din acest fișier.
const { TRANSLATIONS, CATEGORY_LABELS } = require("./locales.js");

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

const BE_HOLIDAYS = [
  { date: "12-25", label: "Noël (25 décembre)", hours: null },
  { date: "01-01", label: "Nouvel An (1er janvier)", hours: null },
];

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

;

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

exports.BEACH_TAG_GROUPS = {
  access: ["access_car", "access_boat"],
  sunbeds: ["sunbeds_free", "sunbeds_paid", "sunbeds_with_drink"],
  terrain: ["terrain_family", "terrain_pebbles"],
}

exports.BEACH_STANDALONE_TAGS = ["free_parking"]

exports.BEACH_ALL_TAGS = [...Object.values(exports.BEACH_TAG_GROUPS).flat(), ...exports.BEACH_STANDALONE_TAGS]

exports.DISCOVERCARS_CITY_LINKS = {
  "București": "https://www.discovercars.com/ro/romania/bucharest?a_aid=23ea55cb",
  "Cluj-Napoca": "https://www.discovercars.com/ro/romania/cluj-napoca?a_aid=23ea55cb",
  "Timișoara": "https://www.discovercars.com/ro/romania/timisoara?a_aid=23ea55cb",
  "Iași": "https://www.discovercars.com/ro/romania/iasi/ias?a_aid=23ea55cb",
  "Brașov": "https://www.discovercars.com/ro/romania/brasov?a_aid=23ea55cb",
  "Constanța": "https://www.discovercars.com/ro/romania/constanta?a_aid=23ea55cb",
  "Brussels": "https://www.discovercars.com/ro/belgium/brussels?a_aid=23ea55cb",
  "Antwerpen": "https://www.discovercars.com/ro/belgium/antwerp?a_aid=23ea55cb",
  "Gent": "https://www.discovercars.com/ro/belgium/gent?a_aid=23ea55cb",
  "Brugge": "https://www.discovercars.com/ro/belgium/brugge?a_aid=23ea55cb",
  "Madrid": "https://www.discovercars.com/ro/spain/madrid?a_aid=23ea55cb",
  "Barcelona": "https://www.discovercars.com/ro/spain/barcelona?a_aid=23ea55cb",
  "Valencia": "https://www.discovercars.com/ro/spain/valencia?a_aid=23ea55cb",
  "Sevilla": "https://www.discovercars.com/ro/spain/seville?a_aid=23ea55cb",
  "Málaga": "https://www.discovercars.com/ro/spain/malaga?a_aid=23ea55cb",
  "Roma": "https://www.discovercars.com/ro/italy-mainland/rome?a_aid=23ea55cb",
  "Milano": "https://www.discovercars.com/ro/italy-mainland/milan?a_aid=23ea55cb",
  "Napoli": "https://www.discovercars.com/ro/italy-mainland/naples?a_aid=23ea55cb",
  "Venezia": "https://www.discovercars.com/ro/italy-mainland/venice?a_aid=23ea55cb",
  "Firenze": "https://www.discovercars.com/ro/italy-mainland/fiorentina?a_aid=23ea55cb",
  "Paris": "https://www.discovercars.com/ro/france/paris?a_aid=23ea55cb",
  "Lyon": "https://www.discovercars.com/ro/france/lyon?a_aid=23ea55cb",
  "Marseille": "https://www.discovercars.com/ro/france/marseille?a_aid=23ea55cb",
  "Nice": "https://www.discovercars.com/ro/france/nice?a_aid=23ea55cb",
  "Bordeaux": "https://www.discovercars.com/ro/france/bordeaux?a_aid=23ea55cb",
  "London": "https://www.discovercars.com/ro/united-kingdom/london?a_aid=23ea55cb",
  "Edinburgh": "https://www.discovercars.com/ro/united-kingdom/edinburgh?a_aid=23ea55cb",
  "Manchester": "https://www.discovercars.com/ro/united-kingdom/manchester?a_aid=23ea55cb",
  "Birmingham": "https://www.discovercars.com/ro/united-kingdom/birmingham?a_aid=23ea55cb",
  "Glasgow": "https://www.discovercars.com/ro/united-kingdom/glasgow?a_aid=23ea55cb",
}

exports.GLOVO_COUNTRIES = ["ro", "es", "it", "pt", "pl", "hr"]

exports.FREE_ACCESS_PREFIXES = [
  "Podul", "Lacul", "Muntele", "Insula", "Insulele", "Cheile",
  "Șoseaua", "Traseul", "Pasul", "Cascada", "Golful",
]

exports.SEASONAL_WARNING_PREFIXES = ["Șoseaua", "Traseul", "Pasul"]

exports.CATEGORY_GENERIC_SCHEDULE = {
  // index 0=Duminică..6=Sâmbătă (Date.getDay()) — null = închis în ziua aia
  castele_palate: [
    { open: "09:00", close: "17:00" }, null,
    { open: "09:00", close: "17:00" }, { open: "09:00", close: "17:00" },
    { open: "09:00", close: "17:00" }, { open: "09:00", close: "17:00" },
    { open: "09:00", close: "17:00" },
  ],
  cetati_turnuri: [
    { open: "09:00", close: "17:00" }, null,
    { open: "09:00", close: "17:00" }, { open: "09:00", close: "17:00" },
    { open: "09:00", close: "17:00" }, { open: "09:00", close: "17:00" },
    { open: "09:00", close: "17:00" },
  ],
  manastiri: [
    { open: "08:00", close: "19:00" }, { open: "08:00", close: "19:00" },
    { open: "08:00", close: "19:00" }, { open: "08:00", close: "19:00" },
    { open: "08:00", close: "19:00" }, { open: "08:00", close: "19:00" },
    { open: "08:00", close: "19:00" },
  ],
  muzee: [
    { open: "10:00", close: "18:00" }, null,
    { open: "10:00", close: "18:00" }, { open: "10:00", close: "18:00" },
    { open: "10:00", close: "18:00" }, { open: "10:00", close: "18:00" },
    { open: "10:00", close: "18:00" },
  ],
  parcuri_agrement: [
    { open: "10:00", close: "19:00" }, null,
    { open: "10:00", close: "19:00" }, { open: "10:00", close: "19:00" },
    { open: "10:00", close: "19:00" }, { open: "10:00", close: "19:00" },
    { open: "10:00", close: "19:00" },
  ],
  // Plaje organizate (cu bar de plajă) — cerut explicit, la solicitarea de
  // extindere pentru Grecia — program tipic, fără zi de închidere (spre
  // deosebire de muzee/castele, o plajă cu bar deschide în fiecare zi cât
  // ține sezonul), dis-de-dimineață până seara târziu.
  plaje_organizate: [
    { open: "08:00", close: "20:00" }, { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" }, { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" }, { open: "08:00", close: "20:00" },
    { open: "08:00", close: "20:00" },
  ],
}

exports.FREE_ACCESS_CATEGORIES = ["plaje_salbatice"]

exports.DE_STORE_CONFIG = {
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
}

exports.GR_STORE_CONFIG = {
  sklavenitis: { name: "Sklavenitis", weekly: grSupermarketWeekly(), holidays: GR_HOLIDAYS },
  lidl: { name: "Lidl", weekly: grSupermarketWeekly(), holidays: GR_HOLIDAYS },
  abvassilopoulos: { name: "AB Vassilopoulos", slug: "ab-vassilopoulos", weekly: grSupermarketWeekly(), holidays: GR_HOLIDAYS },
  masoutis: { name: "Masoutis", weekly: grSupermarketWeekly(), holidays: GR_HOLIDAYS },
}

exports.UK_STORE_CONFIG = {
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
}

exports.ES_STORE_CONFIG = {
  mercadona: { name: "Mercadona", weekly: esSupermarketWeekly(), holidays: ES_HOLIDAYS },
  carrefour: { name: "Carrefour", weekly: esSupermarketWeekly(), holidays: ES_HOLIDAYS },
  alcampo: { name: "Alcampo", weekly: esSupermarketWeekly(), holidays: ES_HOLIDAYS },
  elcorteingles: { name: "El Corte Inglés", slug: "el-corte-ingles", weekly: esSupermarketWeekly(), holidays: ES_HOLIDAYS },
  dia: { name: "Dia", weekly: esSupermarketWeekly(), holidays: ES_HOLIDAYS },
  // Lidl și Eroski — verificate prin căutare (localizator oficial + einforma.es):
  // ambele confirmate cu magazine reale în toate cele 9 orașe din listă
  // (inclusiv Eroski în Baleares — 184 de magazine acolo, cel mai dens punct
  // al rețelei; și în Vizcaya/Bilbao — 41 de magazine).
  lidl: { name: "Lidl", weekly: esSupermarketWeekly(), holidays: ES_HOLIDAYS },
  eroski: { name: "Eroski", weekly: esSupermarketWeekly(), holidays: ES_HOLIDAYS },
  // Consum — bug real, prins ÎNAINTE să ajungă live: lanțul valencian NU are
  // acoperire națională (confirmat explicit: "Consum no tiene presencia en
  // el conjunto de España"), prezent doar în 6 comunități autonome (Valencia,
  // Cataluña, Andalucía, Murcia, Castilla-La Mancha, Aragón). ABSENT din
  // Madrid — prima lor unitate acolo (Parla) e abia programată pentru 2028
  // (confirmat prin articole din aprilie-mai 2026, foarte recente) — și din
  // Baleares/Palma și Țara Bascilor/Bilbao, nemenționate printre cele 6
  // regiuni. Vezi SELECTIVE_BRAND_CITIES.es mai jos pentru orașele exacte
  // unde chiar există.
  consum: { name: "Consum", weekly: esSupermarketWeekly(), holidays: ES_HOLIDAYS },
  // Ikea — verificat prin căutare (ikea.com/es/es/stores + tiendas-espana.es):
  // confirmat cu magazin propriu sau în zona metropolitană a fiecăruia din
  // cele 9 orașe (inclusiv Palma și Barakaldo/Bilbao).
  ikea: { name: "Ikea", weekly: esDiyWeekly(), holidays: ES_HOLIDAYS },
  // Bricolaj / electronice / sport — lanțuri naționale mari (Leroy Merlin
  // ~90 magazine, MediaMarkt ~100, Decathlon ~170), NEVERIFICATE oraș cu
  // oraș individual (spre deosebire de toate cele de mai sus) — dar risc mic
  // aici, pentru că toate cele 9 orașe din listă sunt deja printre cele mai
  // mari orașe din Spania; probabilitatea reală de absență e mult mai mică
  // decât la un oraș mic românesc gen Brad.
  leroymerlin: { name: "Leroy Merlin", slug: "leroy-merlin", weekly: esDiyWeekly(), holidays: ES_HOLIDAYS },
  mediamarkt: { name: "MediaMarkt", slug: "media-markt", weekly: esDiyWeekly(), holidays: ES_HOLIDAYS },
  decathlon: { name: "Decathlon", weekly: esDiyWeekly(), holidays: ES_HOLIDAYS },
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
}

exports.BE_STORE_CONFIG = {
  // Supermarketuri și hipermarketuri
  colruyt: { name: "Colruyt", weekly: beSupermarketWeekly(), holidays: BE_HOLIDAYS },
  delhaize: { name: "Delhaize", weekly: beSupermarketWeekly(), holidays: BE_HOLIDAYS },
  carrefour: { name: "Carrefour", weekly: beSupermarketWeekly(), holidays: BE_HOLIDAYS },
  aldi: { name: "Aldi", weekly: beSupermarketWeekly(), holidays: BE_HOLIDAYS },
  lidl: { name: "Lidl", weekly: beSupermarketWeekly(), holidays: BE_HOLIDAYS },
  spar: { name: "Spar", weekly: beSupermarketWeekly(), holidays: BE_HOLIDAYS },
  intermarche: { name: "Intermarché", slug: "intermarche", weekly: beSupermarketWeekly(), holidays: BE_HOLIDAYS },
  // NOTĂ: "cora" și "match" au fost eliminate deliberat — verificate prin
  // căutare, NU mai există ca branduri active în Belgia. Cora și-a închis
  // definitiv toate cele 7 hipermarketuri belgiene pe 31 ianuarie 2026
  // (falimentul anunțat aprilie 2025, confirmat prin presă belgiană —
  // rtbf.be, journalessentiel.be). Match/Smatch au fost vândute către
  // Colruyt în 2024 și rebranduite "Comarché"/"Comarkt" (sau închise
  // definitiv, 19 magazine fără cumpărător) — brandul "Match" nu mai
  // există ca atare din 2024. Dacă adaugi vreodată "Comarché"/"Comarkt"
  // ca branduri noi, verifică din nou statusul lor, e un lanț tânăr,
  // aflat încă în tranziție spre un nume final.
  // Magazine de proximitate — format mic, ore extinse, adesea deschise și
  // duminica dimineața
  okay: { name: "Okay", weekly: beProximityWeekly(), holidays: BE_HOLIDAYS },
  proxydelhaize: { name: "Proxy Delhaize", slug: "proxy-delhaize", weekly: beProximityWeekly(), holidays: BE_HOLIDAYS },
  alvo: { name: "Alvo", weekly: beProximityWeekly(), holidays: BE_HOLIDAYS },
  // Bricolaj / amenajări
  brico: { name: "Brico", weekly: beDiyWeekly(), holidays: BE_DIY_HOLIDAYS },
  gamma: { name: "Gamma", weekly: beDiyWeekly(), holidays: BE_DIY_HOLIDAYS },
  hubo: { name: "Hubo", weekly: beDiyWeekly(), holidays: BE_DIY_HOLIDAYS },
  ikea: { name: "Ikea", weekly: beDiyWeekly(), holidays: BE_DIY_HOLIDAYS },
  // Electronice / electrocasnice
  mediamarkt: { name: "MediaMarkt", slug: "media-markt", weekly: beElectroWeekly(), holidays: BE_HOLIDAYS },
  krefel: { name: "Krëfel", weekly: beElectroWeekly(), holidays: BE_HOLIDAYS },
  vandenborre: { name: "Vanden Borre", slug: "vanden-borre", weekly: beElectroWeekly(), holidays: BE_HOLIDAYS },
}

exports.COUNTRIES = {
  de: {
    config: exports.DE_STORE_CONFIG,
    t: TRANSLATIONS.de,
    cities: ["Berlin", "München", "Hamburg", "Frankfurt am Main", "Köln", "Stuttgart", "Düsseldorf", "Dortmund", "Leipzig", "Essen", "Aachen", "Ahrensburg", "Alpii Bavarezi", "Altena", "Aschaffenburg", "Attendorn", "Bad Doberan", "Bad Grund", "Bad Homburg", "Bad Homburg vor der Höhe", "Bad Schandau", "Bad Wildbad", "Bad Wimpfen", "Baden-Baden", "Baden-Württemberg", "Balve", "Bamberg", "Bavaria", "Bedburg-Hau", "Berchtesgaden", "Bisingen", "Blaubeuren", "Brandenburg", "Brandenburg an der Havel", "Braunfels", "Breitscheid", "Bremen", "Brühl", "Burghausen", "Chorin", "Coasta Mării Nordului", "Coburg", "Colditz", "De la Würzburg la Füssen", "De-a lungul Rinului", "Detmold", "Donaustauf", "Dresda", "Eltville", "Elveția Saxonă", "Emmerich", "Esslingen am Neckar", "Ettal", "Frankfurt", "Frankfurt pe Main", "Freiburg im Breisgau", "Fulda", "Garmisch-Partenkirchen", "Giengen", "Glücksburg", "Gutach", "Güstrow", "Heidelberg", "Hessen", "Horn-Bad Meinberg", "Höxter", "Insula Chiemsee", "Insula Helgoland", "Isselburg", "Karlsruhe", "Kassel", "Kelheim", "Kloster Lehnin", "Kriebstein", "Kromlau", "Kronach", "Kulmbach", "Königstein im Taunus", "Königswinter", "Lacul Constanța", "Lacul Constanța (Bodensee)", "Leer", "Leisnig", "Limburg an der Lahn", "Lorsch", "Ludwigsburg", "Ludwigslust", "Lübeck", "Mannheim", "Marburg", "Maulbronn", "Meißen", "Messel", "Moritzburg", "Mühltal", "Münster", "Netschkau", "Neuzelle", "Niederfinow", "Nordkirchen", "Nürnberg", "Oberstdorf", "Oberwiesenthal", "Oranienburg", "Oybin", "Potsdam", "Pottenstein", "Prenzlau", "Pădurea Neagră", "Rathen", "Regensburg", "Renania de Nord-Westfalia", "Reutlingen", "Rheinsberg", "Ronneburg", "Rosenheim", "Rothenburg", "Rust", "Rügen", "Saxonia", "Saxonia Inferioară", "Schleswig-Holstein", "Schwangau", "Schwerin", "Schwielowsee", "Sigmaringen", "Singen", "Solingen", "Sonnenbühl", "Steingaden", "Stolpen", "Sud-Estul Saxoniei", "Sylt", "Syrau", "Taunus", "Templin", "Triberg", "Tübingen", "Uckermark", "Ulm", "Waldeck", "Waren", "Wiesbaden", "Wilhelmshaven", "Wuppertal", "Würzburg", "Xanten", "Între Lübben și Lübbenau"],
  },
  uk: {
    config: exports.UK_STORE_CONFIG,
    t: TRANSLATIONS.uk,
    // Extins de la 10 la 33 de orașe/zone — turism foarte mare în UK. Vezi
    // SELECTIVE_BRAND_CITIES.uk mai jos — cele 3 mall-uri (Westfield London,
    // Trafford Centre, Bluewater) NU sunt în toate cele 33, bug pre-existent
    // reparat aici (apăreau universal, deși fiecare e un singur loc real).
    cities: [
      "London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds",
      "Sheffield", "Bristol", "Newcastle", "Nottingham",
      "Edinburgh", "Belfast", "Cardiff", "York", "Bath", "Oxford",
      "Cambridge", "Brighton", "Leicester", "Coventry", "Cornwall",
      "Yorkshire", "Lake District", "Cumbria", "Highlands", "Fort William",
      "Conwy", "Gwynedd", "Wrexham", "Bournville", "Derbyshire",
      "Northumberland", "County Antrim",
    ],
  },
  es: {
    config: exports.ES_STORE_CONFIG,
    t: TRANSLATIONS.es,
    // Extins de la 9 la 34 de orașe — turism foarte mare în Spania, multe
    // orașe importante (Toledo, Salamanca, Granada, Segovia etc.) lipseau
    // complet. Vezi SELECTIVE_BRAND_CITIES.es mai jos — brandurile de format
    // mare (El Corte Inglés, Ikea) NU sunt în toate cele 34, verificat cu
    // liste complete reale (tiendas-espana.es, leroymerlin.es, ikea.com).
    cities: [
      "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga",
      "Murcia", "Palma", "Bilbao",
      "Alicante", "Córdoba", "Granada", "Valladolid", "Vigo", "Gijón",
      "A Coruña", "Vitoria-Gasteiz", "San Sebastián", "Pamplona",
      "Santander", "Toledo", "Salamanca", "Santiago de Compostela",
      "Cádiz", "Segovia", "Ávila", "Burgos", "Logroño", "Cartagena",
      "Ronda", "Mérida", "Cáceres", "Cuenca", "Marbella",
    ],
  },
  fr: {
    config: FR_STORE_CONFIG,
    t: TRANSLATIONS.fr,
    // Extins de la 10 la 28 de orașe — turism foarte mare în Franța. Include
    // și orașe mici, dar extrem de turistice (Mont Saint-Michel, Chamonix,
    // Carcassonne) — vezi SELECTIVE_BRAND_CITIES.fr mai jos pentru restricțiile
    // reale de magazine la aceste locuri mici (un sit-monument ca Mont
    // Saint-Michel, cu ~30 de locuitori permanenți, evident nu are hipermarket).
    cities: [
      "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes",
      "Strasbourg", "Montpellier", "Bordeaux", "Lille",
      "Rennes", "Reims", "Le Havre", "Saint-Étienne", "Toulon", "Grenoble",
      "Dijon", "Angers", "Nîmes", "Clermont-Ferrand",
      "Versailles", "Chartres", "Carcassonne", "Mont Saint-Michel",
      "Saint-Malo", "Chamonix", "Avignon", "Annecy", "Colmar",
      // Al doilea val — completare, la cerere explicită, ca sa acopere
      // Franța la nivelul ei real de turism (a 3-a cea mai vizitată țară
      // din UE): Provence, Coasta de Azur, Normandia, Pirinei, Bretania,
      // Corsica, Valea Loarei, Champagne.
      "Aix-en-Provence", "Arles", "Rouen", "Honfleur", "Deauville",
      "Biarritz", "Bayonne", "Lourdes", "Sarlat", "Carnac", "Quimper",
      "Vannes", "Ajaccio", "Bonifacio", "Cannes", "Saint-Tropez",
      "Perpignan", "Tours", "Épernay", "Rocamadour", "Blois", "Cheverny",
      "Ussé",
    ],
  },
  it: {
    config: IT_STORE_CONFIG,
    t: TRANSLATIONS.it,
    // Extins de la 10 la 30 de orașe — turism foarte mare în Italia. Vezi
    // SELECTIVE_BRAND_CITIES.it mai jos — Esselunga și Ikea NU sunt în
    // toate cele 30, verificate cu surse reale (esselunga.it, ikea.com).
    cities: [
      "Roma", "Milano", "Napoli", "Torino", "Palermo", "Bologna", "Firenze",
      "Venezia", "Genova", "Verona",
      "Bari", "Catania", "Cagliari", "Padova", "Pisa", "Siena", "Perugia",
      "Assisi", "Bergamo", "Como", "Bolzano", "Trento", "Trieste", "Parma",
      "Modena", "Rimini", "Lecce", "Taranto", "Salerno", "Brescia",
    ],
  },
  pl: {
    config: PL_STORE_CONFIG,
    t: TRANSLATIONS.pl,
    cities: ["Warszawa", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Bydgoszcz", "Lublin", "Katowice", "Bochnia", "Bytów", "Cașubia", "Czersk", "Dębno", "Elbląg", "Gniew", "Golful Gdańsk", "Hel", "Jawor", "Jelenia Góra", "Kalwaria Zebrzydowska", "Kamieniec Ząbkowicki", "Karpacz", "Kletno", "Kliczków", "Kudowa-Zdrój", "Kłodzko", "Lubiąż", "Lądek-Zdrój", "Malbork", "Mechowo", "Munții Sowie", "Munții Stołowe", "Munții Tatra", "Nieborów", "Niedzica", "Niepołomice", "Nowy Dwór Mazowiecki", "Nowy Wiśnicz", "Ojców", "Oświęcim", "Paczków", "Parcul Național Ojcowski", "Pelplin", "Piaseczno", "Podzamcze", "Rudno", "Sopot", "Srebrna Góra", "Sromowce Wyżne", "Sucha", "Szczawnica", "Szczecin (Zona de Nord-Vest)", "Szklarska Poręba", "Teresin", "Wadowice", "Wałbrzych", "Wieliczka", "Zagórze Śląskie", "Zakopane", "Złotoryja", "Łeba", "Świdnica", "Żelazowa Wola"],
  },
  nl: {
    config: NL_STORE_CONFIG,
    t: TRANSLATIONS.nl,
    cities: ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Almere", "Breda", "Nijmegen", "Albrandswaard (Zona metropolitană)", "Amstelveen", "Amsterdam Nord", "Bunnik", "Delft", "Delftland", "Haarlem", "Haarzuilens", "Haga", "Heerlen", "Hoek van Holland", "Kerkrade", "Kinderdijk", "Leiden", "Lisse", "Maastricht", "Medemblik (Extensie Nord)", "Montfoort", "Muiden (Zona metropolitană)", "Oegstgeest", "Oud-Zuilen", "Santpoort-Zuid", "Scheveningen", "Vaals", "Valkenburg", "Wijk bij Duurstede", "Zandvoort", "Între Haarlem și Leiden"],
  },
  // Austria: reutilizează traducerea germană (același standard scris,
  // nicio pierdere de acuratețe pentru textul de interfață) — nu am
  // duplicat un dicționar întreg identic doar de dragul formei.
  at: {
    config: AT_STORE_CONFIG,
    t: TRANSLATIONS.de,
    cities: ["Wien", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels", "Sankt Pölten", "Dornbirn", "Achensee", "Admont", "Attersee", "Bad Ischl", "Bad Tatzmannsdorf", "Baden bei Wien", "Bildstein", "Bludenz", "Bregenz", "Burgenland", "Carintia", "Dürnstein", "Eisenstadt", "Feldkirch", "Forchtenstein", "Furth bei Göttweig", "Gaming", "Gmunden", "Gmünd", "Großgmain", "Gurk", "Hall in Tirol", "Hallstatt", "Hard", "Hartkirchen", "Heiligenkreuz", "Hinterbrühl", "Hochgurgl", "Hohe Tauern", "Hohenems", "Keutschach", "Kirchdorf", "Krems", "Krems an der Donau", "Kremsmünster", "Krimml", "Kufstein", "Launsdorf", "Laxenburg", "Lienz", "Marchfeld", "Maria Taferl", "Mariazell", "Mauterndorf", "Melk", "Nauders", "Obertraun", "Partenen", "Peggau", "Petronell-Carnuntum", "Reutte", "Riegersburg", "Riezlern", "Rosenburg", "Rust", "Sankt Florian", "Schönbühel-Aggstein", "Seefeld", "Semmering", "Sperken", "Spittal an der Drau", "St. Johann im Pongau", "St. Wolfgang", "Stams", "Stans", "Steyr", "Stiria", "Stubenberg", "Sölden", "Tirol", "Valea Wachau", "Valea Zillertal", "Wachau", "Wattens", "Werfen", "Zell am See"],
  },
  // Belgia: reutilizează traducerea olandeză (majoritatea populației e
  // vorbitoare de neerlandeză/flamandă) — simplificare declarată, nu o
  // acoperire completă a Valoniei francofone sau a minorității germanofone.
  be: {
    config: exports.BE_STORE_CONFIG,
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
    cities: ["Lisboa", "Porto", "Vila Nova de Gaia", "Amadora", "Braga", "Setúbal", "Coimbra", "Almada", "Faro", "Funchal", "Albufeira", "Alcobaça", "Alcochete", "Aljezur", "Almada (Peste râul Tejo)", "Angra do Heroísmo", "Arouca", "Aveiro", "Aveiro (Tranzit Nord)", "Batalha", "Bragança", "Buçaco", "Calheta", "Caniçal", "Carvoeiro", "Cascais", "Castro Marim", "Caxias", "Centrală", "Chaves", "Condeixa-a-Nova", "Covilhã", "Cámara de Lobos", "Douro", "Estuar (Tranzit)", "Ferragudo", "Fátima", "Guimarães", "Guincho", "Insula Faial (Azore)", "Insula Madeira", "Insula Pico (Azore)", "Insula São Miguel (Azore)", "Insula Terceira (Azore)", "Lagos", "Lamego", "Leiria", "Lisabona", "Loulé", "Loures", "Lousã", "Madeira", "Mafra", "Mealhada", "Minho", "Mira de Aire", "Monchique", "Monte", "Montemor-o-Velho", "Nazaré", "Nazaré (Extensie coastă)", "Nordul insulei Madeira", "Oeiras", "Peneda-Gerês", "Peniche", "Pombal", "Ponta Delgada", "Portimão", "Porto la Pocinho", "Queluz (Zona metropolitană)", "Ria Formosa", "Rute montane", "Sagres", "Santa Maria da Feira", "Santana", "Seia", "Serra da Lousã", "Silves", "Sintra", "Sintra la Praia das Maçãs", "Sudul Portugaliei", "São Miguel (Azore)", "Tavira", "Terceira (Azore)", "Tomar", "Valença do Minho", "Vila Nova da Barquinha", "Vila Nova de Foz Côa", "Vila Real", "Vila Real de Santo António", "Vila do Bispo", "Vila do Conde", "Vilamoura", "Óbidos"],
  },
  cz: {
    config: CZ_STORE_CONFIG,
    t: TRANSLATIONS.cz,
    cities: ["Praha", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "České Budějovice", "Hradec Králové", "Bečov nad Teplou", "Blansko", "Boemia de Vest", "Bouzov", "Bozkov", "Carstul Morav", "Chýnov", "Doksy", "Děčín", "Elveția Cehă", "Frýdlant", "Hejnice", "Hluboká nad Vltavou", "Holašovice", "Holubov", "Horšovský Týn", "Hrádek nad Nisou", "Hřensko", "Jablonec nad Nisou", "Jablonné v Podještědí", "Jindřichův Hradec", "Jičín", "Kamenický Šenov", "Karlovy Vary", "Kladruby", "Kroměříž", "Lednice", "Lipno nad Vltavou", "Litoměřice", "Loket", "Lomec", "Lázně Kynžvart", "Mariánské Lázně", "Mikulov", "Nedvědice", "Orlík nad Vltavou", "Parcul Național Šumava", "Ploskovice", "Písek", "Rovensko pod Troskami", "Rožmberk nad Vltavou", "Rožnov pod Radhoštěm", "Slavkov u Brna", "Sloup v Čechách", "Sobotka", "Staré Město pod Landštejnem", "Sychrov", "Teplá", "Turnov", "Tábor", "Třeboň", "Valtice", "Velehrad", "Vranov nad Viitavou", "Vyškov", "Vyšší Brod", "Zlatá Koruna", "Zvíkovské Podhradie", "de Nord-Est", "de Sud", "Červená Lhota", "Český Krumlov", "Šťáhlavy", "Žďár nad Sázavou"],
  },
  fi: {
    config: FI_STORE_CONFIG,
    t: TRANSLATIONS.fi,
    cities: ["Helsinki", "Tampere", "Turku", "Oulu", "Jyväskylä", "Kuopio", "Lahti", "Rovaniemi", "Askainen", "Eckerö", "Enonkoski", "Espoo", "Geta", "Hammarland", "Heinävesi", "Hirvensalo", "Hollola (Tranzit)", "Hämeenlinna", "Inari", "Insula Kökar", "Insula Ruissalo", "Insulele Åland", "Isokyrö (Tranzit)", "Jomala", "Kaarina", "Kemi", "Kerimäki", "Kirkkonummi (Tranzit)", "Kittilä", "Kouvola", "Kuusamo (Zona de acces sud-laponez)", "Laitila", "Lappeenranta", "Lappeenranta (Tranzit)", "Lemland", "Lieksa", "Lohja (Tranzit)", "Mariehamn", "Mariehamn (Acces cu barca)", "Muonio", "Naantali", "Nousiainen", "Outokumpu", "Pelkosenniemi", "Petäjävesi", "Punkaharju", "Rantasalmi", "Ranua", "Ristiina", "Rovaniemi la Utsjoki", "Ruovesi", "Saariselkä", "Saimaa", "Salla", "Salo", "Saltvik", "Savitaipale", "Savonlinna", "Sirkka", "Sodankylä", "Sund", "Tikkakoski", "Utsjoki", "Vantaa", "Äkäslompolo"],
  },
  gr: {
    config: exports.GR_STORE_CONFIG,
    t: TRANSLATIONS.gr,
    cities: ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa", "Volos", "Ioannina", "Chania", "Agios Mattheos", "Archangelos", "Attica", "Chaidari", "Charaki", "Corfu", "Corfu Town", "Elounda", "Estul insulei", "Faliraki", "Gastouri", "Ialyssos", "Ierapetra", "Kalambaka", "Kallithea", "Kanoni", "Karditsa", "Kissamos", "Kritinia", "Larisa", "Lasithi", "Lindos", "Malia", "Massari", "Matala", "Meteora", "Monolithos", "Muntele Pantokrator", "Munții Albi", "Nordul insulei", "Orașul Vechi", "Palaiokastritsa", "Pantokrator", "Pelekas", "Pelion", "Peroulades", "Pertouli", "Phaistos", "Platoul Lassithi", "Portul Mandraki", "Profitis Ilias", "Rethymno", "Rhodos Town", "Riviera Ateniană", "Sidari", "Sudul insulei", "Sudul insulei Corfu", "Theologos", "Trikala", "Vestul insulei", "Între Olimp și Ossa"],
  },
  hu: {
    config: HU_STORE_CONFIG,
    t: TRANSLATIONS.hu,
    cities: ["Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs", "Győr", "Nyíregyháza", "Kecskemét", "Abaliget", "Badacsony", "Balaton", "Balatonfüred", "Boldogkőváralja", "Debrețin", "Dég", "Dömös", "Eger", "Esztergom", "Fertőd", "Gyula", "Gyula (Zona de Est)", "Herend", "Hortobágy", "Hévíz", "Ják", "Keszthely", "Kőszeg", "Lacul Balaton", "Lillafüred", "Martonvásár (Zona central-nordică)", "Munții Börzsöny", "Munții Mátra", "Munții Zemplén", "Nagyvázsony", "Nordică Balaton", "Nádasdladány", "Pannonhalma (Zona de Nord-Vest", "Parcul Național Aggtelek", "Parcul Național Bükk", "Peninsula Tihany", "Pilis", "Pilisszentkereszt", "Poroszló", "Pécs (Zona de trecere spre sud)", "Siklós", "Siklós-Máriagyűd", "Sopron", "Sud-Estul țării", "Szentendre", "Szigetvár", "Szigliget", "Szilvásvárad", "Szombathely", "Székesfehérvár", "Sárospatak", "Sümeg", "Tapolca", "Tiszadob", "Valea Szalajka", "Villány", "Visegrád", "Zsáka", "de Sud"],
  },
  hr: {
    config: HR_STORE_CONFIG,
    t: TRANSLATIONS.hr,
    cities: ["Zagreb", "Split", "Rijeka", "Osijek", "Zadar", "Pula", "Dubrovnik", "Šibenik", "Baška", "Bol", "Buzet", "Desinić", "Dugi Otok", "Dugopolje", "Fažana", "Fortul Sveti Ivan", "Gornja Stubica", "Gorski Kotar", "Gračac", "Grožnjan", "Hum", "Hvar", "Insula Brač", "Insula Hvar", "Insula Korčula", "Insula Krk", "Insula Lastovo", "Insula Lokrum", "Insula Lopud", "Insula Mljet", "Insula Vis", "Istria", "Kaštel Lukšić", "Klis", "Konavle", "Kornati", "Korčula", "Krapina", "Krk", "Kvarner", "Makarska", "Marija Bistrica", "Maruševec", "Maslenica", "Medvednica", "Motovun", "Muntele Medvednica", "Muntele Srđ", "Nova Vas", "Obrovac", "Omiš", "Opatija", "Orebić", "Pakoštane", "Palatul Rectorului", "Parcul Național Krka", "Pazin", "Peninsula Pelješac", "Plitvice", "Ploče", "Poreč", "Posavina", "Premantura", "Rovinj", "Samobor", "Slano", "Solin", "Stari Grad", "Starigrad", "Ston", "Svetvinčenat", "Trakošćan", "Traseu de coastă", "Trogir", "Trsteno", "Valtura", "Varaždin", "Între Rovinj și Poreč", "Čakovec", "Štinjan", "Ždrelac"],
  },
  ie: {
    config: IE_STORE_CONFIG,
    t: TRANSLATIONS.uk,
    cities: ["Dublin", "Cork", "Limerick", "Galway", "Waterford", "Drogheda", "Dundalk", "Swords", "Antrim", "Armagh", "Ballymoney", "Ballyvaughan", "Bantry", "Bantry Bay", "Beara", "Belfast", "Birr", "Blarney", "Cahersiveen", "Clifden", "Cliffs of Moher", "Cobh", "Cong", "Cong (Granița Galway", "Connemara", "Cultra", "Dalkey", "Derry", "Dingle", "Donegal", "Donegal Town", "Donore", "Doolin", "Fermanagh", "Glandore", "Glasnevin", "Golful Dublin", "Golful Galway", "Gort", "Headford", "Howth", "Insula Inishmore", "Insula Skellig", "Insulele Aran", "Irlanda de Nord", "Județul Clare", "Județul Donegal", "Județul Galway", "Județul Kerry", "Județul Meath", "Județul Wicklow", "Kanturk", "Kenmare", "Kerry", "Killarney", "Kinsale", "Kinvara", "Leenane", "Macroom", "Malahide", "Meath", "Munții MacGillycuddy's Reeks", "O'Connell Street", "Oughterard", "Parcul Național Glenveagh", "Parcul Național Killarney", "Peninsula Beara", "Peninsula Dingle", "Phoenix Park", "Rossaveal", "Rută de coastă", "Sandycove", "Shannon", "Slane", "The Burren", "Trim", "Trinity College", "Tuam", "Tubber", "Waterford (Zona de Sud-Est)"],
  },
  sk: {
    config: SK_STORE_CONFIG,
    t: TRANSLATIONS.sk,
    cities: ["Bratislava", "Košice", "Prešov", "Žilina", "Nitra", "Banská Bystrica", "Trnava", "Trenčín", "Banská Štiavnica", "Bardejov", "Betliar", "Blatnica", "Bodružal", "Bojnice", "Bystrá", "Centrală", "Demänovská Dolina", "Devín", "Devínska Nová Ves", "Dobšiná", "Donovaly", "Gelnica", "Hanušovce nad Topľou", "Harmanec", "Herľany", "Hrabušice", "Hriňová", "Hronsek", "Hronský Beňadik", "Jasov", "Kalameny", "Kežmarok", "Kremnica", "Krupina", "Krásnohorské Podhradie", "Ladomirová", "LevisLevoča", "Levoča", "Leštiny", "Lietava", "Liptovský Hrádok", "Liptovský Mikuláš", "Martin", "Medzilaborce", "Munții Tatra", "Muráň", "Ochtiná", "Oravský Podzámok", "Podlesok", "Poprad", "Pribylina", "Rožňava", "Ružomberok", "Slovenská Ľupča", "Slovenský raj", "Snina", "Spiš", "Spišská Nová Ves", "Stará Ľubovňa", "Starý Smokovec", "Strečno", "Svätý Anton", "Svätý Kríž", "Tatranská Lomnica", "Telgárt", "Važec", "Vernár", "Veľký Šariš", "Vígľaš", "Zvolen", "de Nord", "Častá (Zona metropolitană)", "Červenica", "Červený Kláštor", "Čierny Balog", "Čičmany", "Čunovo", "Špania Dolina", "Štrbské Pleso", "Žehra"],
  },
  si: {
    config: SI_STORE_CONFIG,
    t: TRANSLATIONS.si,
    cities: ["Ljubljana", "Maribor", "Celje", "Kranj", "Koper", "Novo Mesto", "Velenje", "Nova Gorica", "Alpii Iulieni", "Begunje na Gorenjskem", "Bled", "Bohinj", "Bovec", "Brežice", "Carstică", "Castelul Fužine", "Castelul Ptuj", "Cerklje na Gorenjskem", "Cerknica", "Divača", "Grad", "Grosuplje", "Herghelia Lipica", "Hrastovlje", "Idrija", "Idrija (Zona de trecere vest)", "Ig", "Insula Bled", "Ivančna Gorica", "Izola", "Kamnik", "Kobarid", "Kranjska Gora", "Kranjska Gora la Bovec", "Lacul Bled", "Lipica", "Litija", "Ljutomer", "Lokev", "Loška Dolina", "Medvode", "Mestni trg", "Mojstrana", "Munții Pohorje", "Murska Sobota", "Palatul Belgramoni-Tacco", "Pasul Vršič", "Piața Tartini", "Piran", "Planina", "Podčetrtek", "Pohorje", "Portorož", "Portorož la Strunjan", "Postojna", "Postojna (Zona de acces Nord)", "Ptuj", "Radovljica", "Salinele Sečovlje", "Sevnica", "Sečovlje", "Slovenska Bistrica", "Smlednik", "Strunjan", "Tolmin", "Vipava", "Vrhnika", "de Sud", "Šempeter v Savinjski Dolini", "Škofja Loka", "Štanjel", "Žalec"],
  },
  lt: {
    config: LT_STORE_CONFIG,
    t: TRANSLATIONS.lt,
    cities: ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė", "Mažeikiai", "Anykščiai", "Arlaviškės", "Birštonas", "Biržai", "Druskininkai", "Girionys", "Giruliai", "Ignalina", "Juodkrantė", "Kairėnai", "Kernavă", "Kernavė", "Kretinga", "Lentvaris", "Marcinkonys", "Medininkai", "Neringa", "Nida", "Palanga", "Palanga (Zona de coastă Nord)", "Palūšė", "Plungė (Zona de Vest)", "Raudondvaris", "Rumšiškės", "Smiltynė", "Smiltynė la Nida", "Trakai", "de Vest", "În interiorul Castelului Trakai", "Šilutė"],
  },
  lv: {
    config: LV_STORE_CONFIG,
    t: TRANSLATIONS.lv,
    cities: ["Riga", "Daugavpils", "Liepāja", "Jelgava", "Jūrmala", "Ventspils", "Rēzekne", "Ogre", "Aglona", "Alūksne", "Bauska", "Bīriņi", "Cēsis", "De-a lungul golfului Riga", "Dubulti", "Dundaga", "Engure", "Gulbene la Alūksne", "Jelgava (Zona metropolitană sudică)", "Krimulda", "Krāslava", "Kuldīga", "Lapmežciems", "Latgale", "Lielupe", "Līgatne", "Majori", "Milzkalne", "Parcul Național Rāzna", "Parcul Național Slītere", "Parcul Național Ķemeri", "Pilsrundāle (Zona extinsă de circuit)", "Priedaine", "Saka", "Salaspils", "Sigulda", "Sigulda la Krimulda", "Talsi", "Tukums", "Turaida", "Tērvete", "Unguri", "Valmiera", "Vestul Letoniei", "În interiorul Noului Castel", "Ēdole", "Ķemeri"],
  },
  ee: {
    config: EE_STORE_CONFIG,
    t: TRANSLATIONS.ee,
    cities: ["Tallinn", "Tartu", "Narva", "Pärnu", "Kohtla-Järve", "Viljandi", "Rakvere", "Maardu", "Alatskivi", "Golful Pärnu", "Haapsalu", "Haapsalu (Coasta de Vest)", "Hara", "Harju", "Hiiumaa", "Häädemeeste", "Ida-Viru", "Insula Hiiumaa", "Insula Kihnu", "Insula Muhu", "Insula Naissaar", "Jägala", "Jõhvi", "Kadrina", "Keila-Joa", "Kolkja", "Kuremäe", "Kuressaare", "Kärdla", "Käsmu", "Lahemaa", "Legătura cu continentul", "Lääne-Viru", "Lääneranna (Vest)", "Narva-Jõesuu", "Nord-Estul Estoniei", "Nord-Vestul țării", "Ontika", "Otepää", "Padise", "Paldiski", "Parcul Național Lahemaa", "Parcul Național Soomaa", "Peninsula Sõrve", "Piusa", "Râul Ahja", "Saaremaa", "Sangaste", "Sillamäe", "Tahkuna", "Toila", "Toolse", "Tõstamaa", "Valaste", "Vestul insulei Saaremaa", "Viimsi (Zona metropolitană)", "Viki", "de Coastă (Tranzit Est)", "de Est", "de Nord", "de Sud", "În interiorul Castelului Kuressaare", "În interiorul Palatului Kadriorg", "În interiorul ruinelor Catedralei gotice", "Între Muhu și Saaremaa", "Între continent și insule"],
  },
  cy: {
    config: CY_STORE_CONFIG,
    t: TRANSLATIONS.gr,
    cities: ["Nicosia", "Limassol", "Larnaca", "Paphos", "Paralimni", "Aradippou", "Strovolos", "Lakatamia", "Akamas", "Akrotiri", "Amiantos", "Ayia Napa", "Bellapais", "Capul Greco", "Castelul Kyrenia", "Choirokoitia", "Episkopi", "Erimi", "Famagusta", "Geroskipou", "Kakopetria", "Kalopanayiotis", "Karpas", "Kato Paphos", "Kiti", "Kolossi", "Kouklia", "Kourion", "Kyrenia", "Lefka", "Lefkara", "Monagri", "Munții Kyrenia", "Munții Troodos", "Nicosia Nord", "Nikitari", "Omodos", "Orașul Vechi", "Panagia", "Paphos Forest (Tranzit Troodos)", "Peninsula Akamas", "Peninsula Akrotiri", "Peninsula Karpas", "Pentakomo", "Peyia", "Platres", "Platres (Zona de acces Troodos)", "Polis Chrysochous", "Potamos Liopetriou", "Prodromos", "Protaras", "Pyrga", "Softades", "Sotira", "Sudul Ciprului", "Tala", "Troodos", "Vestul Ciprului", "Xylofagou", "de Nord", "În interiorul Castelului Limassol"],
  },
  mt: {
    config: MT_STORE_CONFIG,
    t: TRANSLATIONS.uk,
    cities: ["Valletta", "Birkirkara", "Mosta", "Qormi", "Sliema", "Naxxar", "San Ġwann", "Żabbar"],
  },
  lu: {
    config: LU_STORE_CONFIG,
    t: TRANSLATIONS.fr,
    cities: ["Luxembourg", "Esch-sur-Alzette", "Differdange", "Dudelange", "Ettelbruck", "Diekirch", "Wiltz", "Grevenmacher"],
  },
  // Turcia — LIMITARE ONESTĂ, de spus clar: turca NU e una din cele 21 de
  // limbi ale site-ului (TRANSLATIONS/CATEGORY_LABELS/etc.) — implementarea
  // completă a unei a 22-a limbi ar însemna zeci de dicționare de tradus
  // din nou, mult peste scopul unei singure sesiuni. Cade pe engleză
  // (TRANSLATIONS.uk) ca interfață — vizitatorii turci văd site-ul în
  // engleză, nu în turcă. Obiectivele turistice (numele, categoriile)
  // funcționează normal, traduse în oricare din cele 21 de limbi ale
  // vizitatorului, la fel ca la orice altă țară.
  tr: {
    config: TR_STORE_CONFIG,
    t: TRANSLATIONS.uk,
    cities: ["Adıyaman", "Aksaray", "Alanya", "Amasya", "Anatolia Centrală", "Ankara", "Antalya", "Aydın", "Ağrı", "Batman", "Bergama", "Bodrum", "Bursa", "Capadocia", "Demre", "Denizli", "Diyarbakır", "Doğubeyazıt", "Edirne", "Efes", "Fethiye", "Gaziantep", "Göreme", "Gümüşhane", "Istanbul", "Izmir", "Kaş", "Kekova", "Kemer", "Konya", "Kuşadası", "Lacul Van", "Manavgat", "Mardin", "Maçka", "Mersin", "Midyat", "Ordu", "Rize", "Samsun", "Selçuk", "Serik", "Side", "Sivas", "Trabzon", "Van", "Çanakkale", "Çeşme", "Şanlıurfa"],
  },
}

exports.ATTRACTION_CITY_OVERRIDES = {
  fr: {
    "Turnul Eiffel": "Paris",
    "Muzeul Luvru": "Paris",
    "Arcul de Triumf": "Paris",
    "Sainte-Chapelle": "Paris",
    "Muzeul Armatei / Domul Invalizilor": "Paris",
    "Fundația Louis Vuitton": "Paris",
    "Muzeul MUCEM": "Marseille",
  },
}

exports.STORE_CONFIG = {
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
}

exports.FR_ALL_CITIES_EXCEPT_MONT_SAINT_MICHEL = exports.COUNTRIES.fr.cities.filter(
  (c) => !FR_TINY_MONUMENT_VILLAGES.includes(c)
);

exports.SELECTIVE_BRAND_CITIES = {
  ro: {
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
    // Mega Image — bug real, prins prin raportare directă (apărea în Brad,
    // unde n-are niciun magazin). Rețeaua e extrem de concentrată pe
    // București (~430 din ~600+ magazine, conform ZF), cu prezență
    // secundară doar în câteva orașe mari. Listă verificată prin căutare
    // (mega-image.ro/companie + articole retail-fmcg.ro), nu presupusă —
    // conservatoare deliberat, ca la celelalte branduri de mai sus.
    megaimage: [
      "București", "Cluj-Napoca", "Iași", "Constanța", "Ploiești", "Brașov",
      "Târgoviște", "Timișoara", "Bacău", "Focșani", "Oradea",
    ],
    // Auchan — cel mai concentrat dintre hipermarketuri: doar 26 de
    // hipermarketuri clasice, în ~14-18 orașe mari (nu 41, cum eram
    // presupuși implicit înainte). Listă verificată prin căutare
    // (auchan.ro/magazine-auchan + wall-street.ro), oraș cu adresă exactă
    // confirmată pentru fiecare intrare de mai jos.
    auchan: [
      "București", "Cluj-Napoca", "Iași", "Constanța", "Brașov", "Bacău",
      "Oradea", "Sibiu", "Târgu Mureș", "Deva",
    ],
    // Carrefour — mai răspândit decât Mega Image/Auchan (formatele Market/
    // Express ajung și în orașe medii, sub 100.000 locuitori), dar TOT nu
    // e universal — confirmat direct ABSENT din Brad (verificat: Carrefour
    // are magazine în Deva, Petroșani, Simeria, Hațeg, Călan — județul
    // Hunedoara — dar nu și în Brad). Refolosim lista celor 41 de orașe deja
    // verificate real pentru Lidl/Kaufland/Penny/Carrefour (comentariul de
    // la SITEMAP_CITIES, secțiunea "adăugate ulterior") — cele 30 de orașe
    // mari inițiale + cele 11 adăugate cu verificare explicită.
    carrefour: [
      "București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Craiova",
      "Brașov", "Galați", "Ploiești", "Oradea", "Brăila", "Arad", "Pitești",
      "Sibiu", "Bacău", "Târgu Mureș", "Baia Mare", "Buzău", "Botoșani",
      "Satu Mare", "Râmnicu Vâlcea", "Drobeta-Turnu Severin", "Suceava",
      "Piatra Neamț", "Târgu Jiu", "Târgoviște", "Focșani", "Bistrița",
      "Tulcea", "Reșița",
      "Alba Iulia", "Deva", "Zalău", "Vaslui", "Sfântu Gheorghe",
      "Miercurea Ciuc", "Slatina", "Alexandria", "Giurgiu", "Călărași", "Slobozia",
    ],
    // Dedeman — 65 de magazine, prezent "în aproape toate județele" (site
    // oficial dedeman.ro/compania), dar tot nu literalmente în toate cele
    // 103 municipii — un magazin per reședință de județ, nu per oraș mic.
    // Refolosim aceeași listă de 41 orașe mari, deja verificate pentru
    // Lidl/Kaufland/Penny/Carrefour — cea mai bună aproximare conservatoare
    // disponibilă fără o listă exhaustivă magazin-cu-magazin.
    dedeman: [
      "București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Craiova",
      "Brașov", "Galați", "Ploiești", "Oradea", "Brăila", "Arad", "Pitești",
      "Sibiu", "Bacău", "Târgu Mureș", "Baia Mare", "Buzău", "Botoșani",
      "Satu Mare", "Râmnicu Vâlcea", "Drobeta-Turnu Severin", "Suceava",
      "Piatra Neamț", "Târgu Jiu", "Târgoviște", "Focșani", "Bistrița",
      "Tulcea", "Reșița",
      "Alba Iulia", "Deva", "Zalău", "Vaslui", "Sfântu Gheorghe",
      "Miercurea Ciuc", "Slatina", "Alexandria", "Giurgiu", "Călărași", "Slobozia",
    ],
    // Leroy Merlin — 23 de magazine în exact 16 orașe (confirmat prin
    // retail.ro, 2025), listă completă, nu aproximare.
    leroymerlin: [
      "București", "Cluj-Napoca", "Craiova", "Ploiești", "Pitești", "Brașov",
      "Constanța", "Sibiu", "Suceava", "Târgu Mureș", "Bacău", "Iași",
      "Timișoara", "Oradea", "Târgoviște", "Arad",
    ],
    // Brico Depot — ~30-35 de magazine în ~25 de orașe (conform
    // bricodepot.ro); listă conservatoare cu orașele confirmate individual
    // prin căutare — probabil incompletă față de cele 25 reale, dar mai
    // bine lipsă un oraș real decât unul inventat.
    bricodepot: [
      "București", "Oradea", "Deva", "Drobeta-Turnu Severin", "Cluj-Napoca",
      "Satu Mare", "Baia Mare", "Târgu Mureș", "Brăila", "Iași", "Suceava",
      "Târgoviște", "Constanța", "Piatra Neamț",
    ],
    // Hornbach — cel mai concentrat brand de bricolaj: doar 11 magazine
    // fizice (confirmat direct pe hornbach.ro), în doar 7 orașe.
    hornbach: [
      "București", "Brașov", "Timișoara", "Sibiu", "Oradea", "Cluj-Napoca",
      "Constanța",
    ],
    // Farmacia Tei — bug real, prins prin verificare (hartafarmacii.ro,
    // 27 aug. 2026): doar 13 farmacii în toată țara, concentrate în
    // București (8) + câte una în Brașov, Aiud, Florești (Cluj), Popești-
    // Leordeni (Ilfov) și o comună din Prahova. Rămân doar orașele din
    // SITEMAP_CITIES — Florești/Popești-Leordeni sunt comune, nu municipii.
    farmaciatei: ["București", "Brașov", "Aiud"],
    // Remedia — lanț regional, NU național: doar 23 farmacii proprii,
    // concentrate explicit "în special în județele Hunedoara, Alba și
    // Sibiu" (corporate.remedia.ro/en/) — nu în restul țării. Aici lista
    // e restrânsă la orașele mari din exact aceste 3 județe.
    // Deva scoasă din listă — semnalat direct, verificat pe teren: farmacia
    // Remedia NU mai există în Deva (cercetarea inițială, bazată pe
    // prezența generală în județul Hunedoara, nu a fost suficient de
    // precisă — județul ≠ fiecare oraș din el). Rămân Hunedoara, Petroșani,
    // Alba Iulia, Sibiu, neverificate individual încă la fel de riguros.
    remedia: ["Hunedoara", "Petroșani", "Alba Iulia", "Sibiu"],
  },
  be: {
    // Alvo (grup Colruyt) — verificat prin căutare (alvo.be/winkels +
    // geodruid.com): concentrat aproape exclusiv în Flandra (Anvers,
    // Flandra de Est/Vest) + o singură locație în zona Bruxelles.
    // ZERO magazine găsite în Valonia (Charleroi, Liège, Namur, Mons) sau
    // în Leuven/Aalst, deși apărea înainte ca "universal" pe toate cele
    // 10 orașe din listă — corectat aici, nu presupus.
    alvo: ["Brussels", "Antwerpen", "Gent", "Brugge"],
  },
  es: {
    // Consum — extins conform hărții comunităților autonome unde chiar
    // există (vezi comentariul de la exports.ES_STORE_CONFIG mai sus): Comunidad
    // Valenciana, Cataluña, Andalucía, Murcia, Castilla-La Mancha, Aragón.
    consum: [
      "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga", "Murcia",
      "Alicante", "Córdoba", "Granada", "Toledo", "Cádiz", "Cartagena",
      "Ronda", "Cuenca", "Marbella",
    ],
    // El Corte Inglés — bug real, prins ÎNAINTE să ajungă live, la extinderea
    // listei de orașe (34 în loc de 9): lista OFICIALĂ completă de magazine
    // (tiendas-espana.es, verificată direct, oraș cu oraș) NU include deloc
    // Segovia, Ávila, Logroño, Ronda, Mérida sau Cuenca — orașe mici/turistice,
    // fără format de magazin mare precum acesta.
    elcorteingles: [
      "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga",
      "Murcia", "Palma", "Bilbao",
      "Alicante", "Córdoba", "Granada", "Valladolid", "Vigo", "Gijón",
      "A Coruña", "Vitoria-Gasteiz", "San Sebastián", "Pamplona",
      "Santander", "Toledo", "Salamanca", "Santiago de Compostela",
      "Cádiz", "Burgos", "Cartagena", "Cáceres", "Marbella",
    ],
    // Ikea — cel mai concentrat brand de aici: doar ~20 de magazine în toată
    // Spania (listă oficială ikea.com, verificată pe regiuni). Confirmat
    // DOAR în cele 9 orașe originale + Valladolid și A Coruña — restul celor
    // 23 de orașe noi nu au niciun magazin Ikea propriu.
    ikea: [
      "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga",
      "Murcia", "Palma", "Bilbao", "Valladolid", "A Coruña",
    ],
    // Leroy Merlin — verificat individual (leroymerlin.es/tiendas/<oraș>):
    // confirmat CHIAR ÎN Segovia, Ávila și Cuenca (surprinzător de răspândit
    // pentru un brand de bricolaj — 130 de magazine la nivel național).
    // Absent confirmat doar din Ronda, Mérida, Cáceres, Marbella (fără nicio
    // mențiune de magazin propriu găsită, spre deosebire de restul).
    leroymerlin: [
      "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga",
      "Murcia", "Palma", "Bilbao",
      "Alicante", "Córdoba", "Granada", "Valladolid", "Vigo", "Gijón",
      "A Coruña", "Vitoria-Gasteiz", "San Sebastián", "Pamplona",
      "Santander", "Toledo", "Salamanca", "Santiago de Compostela",
      "Cádiz", "Segovia", "Ávila", "Burgos", "Logroño", "Cartagena",
      "Cuenca",
    ],
    // MediaMarkt — NEVERIFICAT individual oraș-cu-oraș (spre deosebire de
    // Leroy Merlin, unde am găsit confirmare directă) — folosim aceeași
    // listă ca Leroy Merlin, ca aproximare rezonabilă (scară națională
    // similară, ~100 de magazine), NU o certitudine la fel de solidă.
    mediamarkt: [
      "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga",
      "Murcia", "Palma", "Bilbao",
      "Alicante", "Córdoba", "Granada", "Valladolid", "Vigo", "Gijón",
      "A Coruña", "Vitoria-Gasteiz", "San Sebastián", "Pamplona",
      "Santander", "Toledo", "Salamanca", "Santiago de Compostela",
      "Cádiz", "Segovia", "Ávila", "Burgos", "Logroño", "Cartagena",
      "Cuenca",
    ],
    // Decathlon rămâne universal — NU e restricționat aici, deliberat: rețea
    // mult mai densă (~170 de magazine, cea mai mare dintre toate de aici),
    // confirmată explicit chiar și în Logroño (oraș mic). Strategia lor
    // vizează explicit orașe mijlocii/mici, spre deosebire de El Corte
    // Inglés/Ikea (format mare, doar orașe mari).
    //
    // Xanadú și La Maquinista — bug pre-existent, independent de extinderea
    // de mai sus la 34 de orașe: sunt mall-uri SPECIFICE, unice (nu lanțuri
    // repetate în fiecare oraș), dar nu aveau nicio restricție — apăreau
    // greșit ca opțiune și în celelalte 8 orașe originale, nu doar în orașul
    // lor real. Corectat aici, la câte un singur oraș fiecare.
    xanadumadrid: ["Madrid"],
    lamaquinista: ["Barcelona"],
  },
  it: {
    // Esselunga — bug real, prins ÎNAINTE să ajungă live (verificare directă
    // înainte de populare), independent de orice extindere de orașe: rețeaua
    // e prezentă doar în 7 regiuni din nordul/centrul Italiei (confirmat prin
    // Wikipedia + surse oficiale esselunga.it/esselungajob.it): Lombardia,
    // Toscana, Emilia-Romagna, Piemonte, Veneto, Liguria, Lazio. ABSENTĂ din
    // Napoli (Campania) și Palermo (Sicilia) — chiar dacă apărea universal
    // pe toate cele 10 orașe originale, dinainte de verificarea de azi.
    // Extins acum cu orașele noi din aceleași 7 regiuni confirmate.
    esselunga: [
      "Roma", "Milano", "Torino", "Bologna", "Firenze", "Venezia", "Genova",
      "Verona", "Bergamo", "Como", "Brescia", "Pisa", "Siena", "Parma",
      "Modena", "Rimini", "Padova",
    ],
    // Ikea — verificat prin căutare (ikea.com/it/it/stores + habitante.it):
    // 22+ magazine, mai răspândit decât la Spania. Confirmat DIRECT în
    // orașele de mai jos; pentru Napoli, Torino, Genova, Verona (parte din
    // cele 10 originale) NU am găsit nicio dovadă directă — excluse aici
    // conservator, deși fiind orașe mari e posibil să existe totuși un
    // magazin aproape; verifică separat dacă știi sigur de unul.
    ikea: [
      "Roma", "Milano", "Bologna", "Firenze", "Venezia", "Palermo",
      "Bari", "Catania", "Cagliari", "Padova", "Pisa", "Perugia",
      "Bolzano", "Brescia", "Modena",
    ],
  },
  fr: {
    // Monoprix — verificat prin căutare (monoprix.fr/liste-magasins +
    // pagesjaunes.fr): 200-250+ orașe, confirmat cu adresă exactă chiar și
    // în orașe mai mici (Colmar, Annecy, Le Havre, Avignon, Dijon,
    // Clermont-Ferrand, Grenoble). ABSENT din Mont Saint-Michel (sit-monument
    // cu ~30 de locuitori permanenți, evident fără hipermarket) și din
    // Chamonix (nicio adresă concretă găsită, doar pagini generice de
    // director, spre deosebire de restul orașelor de mai sus).
    //
    // Al doilea val de orașe (Aix-en-Provence, Rouen, Tours etc.) — NU
    // verificate individual, la fel de riguros ca lista de mai sus (fără
    // căutare oraș-cu-oraș) — incluse doar orașele cu populație/turism
    // suficient de mare încât prezența Monoprix e foarte probabilă
    // (orașe de peste ~20.000 locuitori, plus Lourdes — excepție, datorită
    // afluxului turistic uriaș). LĂSATE AFARĂ, deliberat conservator: Sarlat,
    // Carnac, Bonifacio, Saint-Tropez (sate/orășele mici, sub acest prag,
    // fără nicio verificare) — Rocamadour/Cheverny/Ussé nici nu apar aici,
    // fiind excluse la toate brandurile (vezi FR_TINY_MONUMENT_VILLAGES).
    monoprix: [
      "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes",
      "Strasbourg", "Montpellier", "Bordeaux", "Lille",
      "Rennes", "Reims", "Le Havre", "Saint-Étienne", "Toulon", "Grenoble",
      "Dijon", "Angers", "Nîmes", "Clermont-Ferrand",
      "Versailles", "Chartres", "Carcassonne", "Saint-Malo", "Avignon",
      "Annecy", "Colmar",
      "Aix-en-Provence", "Arles", "Rouen", "Honfleur", "Deauville",
      "Biarritz", "Bayonne", "Lourdes", "Quimper", "Vannes", "Ajaccio",
      "Cannes", "Perpignan", "Tours", "Épernay", "Blois",
    ],
    // Restul brandurilor (E.Leclerc, Carrefour, Intermarché, Auchan) au
    // rețele mult mai mari (mii de magazine fiecare), universale peste tot
    // — CU EXCEPȚIA celor 4 sate-monument, fără nicio infrastructură de
    // oraș real (vezi FR_TINY_MONUMENT_VILLAGES mai sus).
    // NOTĂ: SELECTIVE_BRAND_CITIES e o listă ALBĂ (doar orașele enumerate
    // sunt permise) — ca să excludem doar câteva orașe dintr-o listă altfel
    // universală, enumerăm explicit toate CELELALTE, nu doar excepțiile.
    leclerc: exports.FR_ALL_CITIES_EXCEPT_MONT_SAINT_MICHEL,
    carrefour: exports.FR_ALL_CITIES_EXCEPT_MONT_SAINT_MICHEL,
    intermarche: exports.FR_ALL_CITIES_EXCEPT_MONT_SAINT_MICHEL,
    auchan: exports.FR_ALL_CITIES_EXCEPT_MONT_SAINT_MICHEL,
    // Forum des Halles — bug real, găsit prin verificarea diagnosticului de
    // magazine lipsă (nu prin testare directă pe site, ca la celelalte): un
    // SINGUR mall, în Paris, fără nicio restricție — apărea "așteptat" în
    // toate cele 52 de orașe/zone ale Franței, inclusiv Ajaccio, Bayonne,
    // Chamonix, Rocamadour — locuri fără nicio legătură.
    forumdeshalles: ["Paris"],
  },
  uk: {
    // Cele 3 mall-uri — bug pre-existent, prins prin verificare directă (nu
    // legat de extinderea de mai sus la 33 de orașe/zone): fiecare e un
    // SINGUR loc real, dar nu avea nicio restricție — apărea universal pe
    // toate cele 10 orașe originale, dinainte de verificarea de azi.
    westfieldlondon: ["London"],
    traffordcentre: ["Manchester"],
    bluewater: ["London"], // Bluewater e lângă Dartford, in zona metropolitana Londra — cel mai apropiat oraș urmărit
  },
}

exports.SITEMAP_CITIES = [
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
  // completare la toate cele 103 municipii din România (lista oficială,
  // verificată prin OpenStreetMap) — cele 41 de mai sus rămân neatinse
  "Adjud", "Aiud", "Băilești", "Bârlad", "Beiuș", "Blaj", "Brad", "Calafat", "Câmpia Turzii", "Câmpina", "Câmpulung", "Câmpulung Moldovenesc", "Caracal", "Caransebeș", "Carei", "Codlea", "Curtea de Argeș", "Dej", "Dorohoi", "Drăgășani", "Făgăraș", "Fălticeni", "Fetești", "Gheorgheni", "Gherla", "Hunedoara", "Huși", "Lugoj", "Lupeni", "Mangalia", "Marghita", "Medgidia", "Mediaș", "Moinești", "Moreni", "Motru", "Odorheiu Secuiesc", "Oltenița", "Onești", "Orăștie", "Orșova", "Pașcani", "Petroșani", "Rădăuți", "Râmnicu Sărat", "Reghin", "Roman", "Roșiorii de Vede", "Săcele", "Salonta", "Sebeș", "Sighetu Marmației", "Sighișoara", "Târgu Secuiesc", "Târnăveni", "Tecuci", "Toplița", "Turda", "Turnu Măgurele", "Urziceni", "Vatra Dornei", "Vulcan",
]

exports.CITY_COORDS = {
  "Adjud": [46.1054, 27.1808],
  "Aiud": [46.3106, 23.7211],
  "Băilești": [44.0186, 23.3499],
  "Bârlad": [46.2197, 27.6675],
  "Beiuș": [46.6714, 22.3489],
  "Blaj": [46.1747, 23.9106],
  "Brad": [46.1367, 22.7864],
  "Calafat": [43.9936, 22.9333],
  "Câmpia Turzii": [46.5433, 23.8856],
  "Câmpina": [45.1281, 25.7328],
  "Câmpulung": [45.2686, 25.045],
  "Câmpulung Moldovenesc": [47.5297, 25.5581],
  "Caracal": [44.1167, 24.35],
  "Caransebeș": [45.4167, 22.2167],
  "Carei": [47.6833, 22.4667],
  "Codlea": [45.6935, 25.4488],
  "Curtea de Argeș": [45.1394, 24.6789],
  "Dej": [47.1417, 23.8722],
  "Dorohoi": [47.9556, 26.3986],
  "Drăgășani": [44.6564, 24.2617],
  "Făgăraș": [45.8417, 24.9736],
  "Fălticeni": [47.4611, 26.3],
  "Fetești": [44.3833, 27.8333],
  "Gheorgheni": [46.7236, 25.5972],
  "Gherla": [47.0333, 23.9],
  "Hunedoara": [45.75, 22.9],
  "Huși": [46.6742, 28.0592],
  "Lugoj": [45.6883, 21.9031],
  "Lupeni": [45.3597, 23.2267],
  "Mangalia": [43.8083, 28.5875],
  "Marghita": [47.35, 22.3333],
  "Medgidia": [44.25, 28.2667],
  "Mediaș": [46.1667, 24.35],
  "Moinești": [46.4667, 26.4833],
  "Moreni": [44.9833, 25.6667],
  "Motru": [44.8, 22.9667],
  "Odorheiu Secuiesc": [46.3, 25.3],
  "Oltenița": [44.0833, 26.6333],
  "Onești": [46.25, 26.7667],
  "Orăștie": [45.8333, 23.2],
  "Orșova": [44.7167, 22.4],
  "Pașcani": [47.25, 26.7167],
  "Petroșani": [45.4167, 23.3667],
  "Rădăuți": [47.85, 25.9167],
  "Râmnicu Sărat": [45.3833, 27.05],
  "Reghin": [46.7667, 24.7167],
  "Roman": [46.9167, 26.9167],
  "Roșiorii de Vede": [44.1167, 24.9833],
  "Săcele": [45.6167, 25.6833],
  "Salonta": [46.8, 21.65],
  "Sebeș": [45.9583, 23.5667],
  "Sighetu Marmației": [47.9333, 23.9],
  "Sighișoara": [46.2167, 24.7917],
  "Târgu Secuiesc": [46.0, 26.1333],
  "Târnăveni": [46.3333, 24.3],
  "Tecuci": [45.8583, 27.4333],
  "Toplița": [46.9167, 25.35],
  "Turda": [46.5667, 23.7833],
  "Turnu Măgurele": [43.75, 24.8667],
  "Urziceni": [44.7167, 26.6333],
  "Vatra Dornei": [47.35, 25.3667],
  "Vulcan": [45.3833, 23.2667],
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
  "Dublin": [53.3498, -6.2603],
  "Cork": [51.8985, -8.4756],
  "Limerick": [52.6638, -8.6267],
  "Galway": [53.2707, -9.0568],
  "Waterford": [52.2593, -7.1101],
  "Drogheda": [53.7189, -6.3478],
  "Dundalk": [54.0011, -6.4083],
  "Swords": [53.4597, -6.2181],
  "Bratislava": [48.1486, 17.1077],
  "Košice": [48.7164, 21.2611],
  "Prešov": [49.0018, 21.2393],
  "Žilina": [49.2231, 18.7394],
  "Nitra": [48.3061, 18.0764],
  "Banská Bystrica": [48.7395, 19.1531],
  "Trnava": [48.3709, 17.5886],
  "Trenčín": [48.8945, 18.0444],
  "Ljubljana": [46.0569, 14.5058],
  "Maribor": [46.5547, 15.6459],
  "Celje": [46.2311, 15.2683],
  "Kranj": [46.2437, 14.3557],
  "Koper": [45.5481, 13.7302],
  "Novo Mesto": [45.8039, 15.1697],
  "Velenje": [46.3592, 15.1103],
  "Nova Gorica": [45.9558, 13.6483],
  "Vilnius": [54.6872, 25.2797],
  "Kaunas": [54.8985, 23.9036],
  "Klaipėda": [55.7033, 21.1443],
  "Šiauliai": [55.9349, 23.3144],
  "Panevėžys": [55.7333, 24.3575],
  "Alytus": [54.3969, 24.0447],
  "Marijampolė": [54.5599, 23.3555],
  "Mažeikiai": [56.3097, 22.3350],
  "Riga": [56.9496, 24.1052],
  "Daugavpils": [55.8748, 26.5361],
  "Liepāja": [56.5089, 21.0104],
  "Jelgava": [56.6511, 23.7214],
  "Jūrmala": [56.9679, 23.7796],
  "Ventspils": [57.3894, 21.5606],
  "Rēzekne": [56.5097, 27.3319],
  "Ogre": [56.8181, 24.6047],
  "Tallinn": [59.4370, 24.7536],
  "Tartu": [58.3780, 26.7290],
  "Narva": [59.3773, 28.1903],
  "Pärnu": [58.3859, 24.4971],
  "Kohtla-Järve": [59.3986, 27.2739],
  "Viljandi": [58.3639, 25.5900],
  "Rakvere": [59.3467, 26.3592],
  "Maardu": [59.4761, 25.0181],
  "Nicosia": [35.1856, 33.3823],
  "Limassol": [34.7071, 33.0226],
  "Larnaca": [34.9167, 33.6333],
  "Paphos": [34.7761, 32.4247],
  "Paralimni": [35.0392, 33.9822],
  "Aradippou": [34.9500, 33.5833],
  "Strovolos": [35.1333, 33.3333],
  "Lakatamia": [35.1167, 33.3167],
  "Valletta": [35.8989, 14.5146],
  "Birkirkara": [35.8972, 14.4611],
  "Mosta": [35.9089, 14.4256],
  "Qormi": [35.8767, 14.4719],
  "Sliema": [35.9122, 14.5017],
  "Naxxar": [35.9106, 14.4494],
  "San Ġwann": [35.9022, 14.4728],
  "Żabbar": [35.8756, 14.5361],
  "Luxembourg": [49.6116, 6.1319],
  "Esch-sur-Alzette": [49.4958, 5.9806],
  "Differdange": [49.5244, 5.8917],
  "Dudelange": [49.4783, 6.0872],
  "Ettelbruck": [49.8478, 6.1042],
  "Diekirch": [49.8686, 6.1594],
  "Wiltz": [49.9667, 5.9333],
  "Grevenmacher": [49.6800, 6.4408],
}

exports.OBIECTIVE_ITINERAR = [
  { nume: "Castelul Bran", localitate: "Bran", judet: "Brasov" },
  { nume: "Castelul Peles", localitate: "Sinaia", judet: "Prahova" },
  { nume: "Palatul Parlamentului", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Salina Turda", localitate: "Turda", judet: "Cluj" },
  { nume: "Muzeul National de Istorie Naturala „Grigore Antipa”", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Therme Bucuresti", localitate: "Balotesti", judet: "Ilfov" },
  { nume: "Dino Parc Rasnov", localitate: "Rasnov", judet: "Brasov" },
  { nume: "Cetatea Alba Carolina", localitate: "Alba Iulia", judet: "Alba" },
  { nume: "Castelul Corvinilor", localitate: "Hunedoara", judet: "Hunedoara" },
  { nume: "Muzeul National al Satului „Dimitrie Gusti”", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Cetatea Deva", localitate: "Deva", judet: "Hunedoara" },
  { nume: "Cetatea Rasnov", localitate: "Rasnov", judet: "Brasov" },
  { nume: "Cetatea de Scaun a Sucevei", localitate: "Suceava", judet: "Suceava" },
  { nume: "Salina Praid", localitate: "Praid", judet: "Harghita" },
  { nume: "Ansamblul Sculptural Constantin Brancusi", localitate: "Targu Jiu", judet: "Gorj" },
  { nume: "Castelul Cantacuzino", localitate: "Busteni", judet: "Prahova" },
  { nume: "Turnul cu Ceas si Cetatea Sighisoara", localitate: "Sighisoara", judet: "Mures" },
  { nume: "Cetatea Fagaras", localitate: "Fagaras", judet: "Brasov" },
  { nume: "Muzeul National Brukenthal", localitate: "Sibiu", judet: "Sibiu" },
  { nume: "Palatul Culturii", localitate: "Iasi", judet: "Iasi" },
  { nume: "Aquapark Nymphaea", localitate: "Oradea", judet: "Bihor" },
  { nume: "Muzeul National al Taranului Roman", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Cetatea Neamt", localitate: "Targu Neamt", judet: "Neamt" },
  { nume: "Castelul Sturdza", localitate: "Miclauseni", judet: "Iasi" },
  { nume: "Muzeul National de Istorie a Romaniei", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Libearty Bear Sanctuary", localitate: "Zarnesti", judet: "Brasov" },
  { nume: "Palatul Mogosoaia", localitate: "Mogosoaia", judet: "Ilfov" },
  { nume: "Cetatea Poenari", localitate: "Arefu", judet: "Arges" },
  { nume: "Catedrala Mantuirii Neamului", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Manastirea Voronet", localitate: "Gura Humorului", judet: "Suceava" },
  { nume: "Palatul Brancovenesc", localitate: "Sambata de Sus", judet: "Brasov" },
  { nume: "MNAR (Muzeul National de Arta al Romaniei)", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Parc Aventura Brasov", localitate: "Brasov", judet: "Brasov" },
  { nume: "Planetariul Baia Mare", localitate: "Baia Mare", judet: "Maramures" },
  { nume: "Complexul de Agrement Cheile Gradistei", localitate: "Moieciu", judet: "Brasov" },
  { nume: "Salina Slanic Prahova", localitate: "Slanic", judet: "Prahova" },
  { nume: "Cetatea Enisala", localitate: "Enisala", judet: "Tulcea" },
  { nume: "Rosia Montana (Sit UNESCO)", localitate: "Rosia Montana", judet: "Alba" },
  { nume: "Palatul Ghika", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Castelul de Lut Valea Zanelor", localitate: "Porumbacu de Sus", judet: "Sibiu" },
  { nume: "Castelul Karolyi", localitate: "Carei", judet: "Satu Mare" },
  { nume: "Castelul Banffy", localitate: "Bontida", judet: "Cluj" },
  { nume: "Castelul Josika", localitate: "Surduc", judet: "Salaj" },
  { nume: "Castelul Teleki", localitate: "Gornesti", judet: "Mures" },
  { nume: "Castelul Bethlen-Haller", localitate: "Cetatea de Balta", judet: "Alba" },
  { nume: "Palatul Roznovanu (Primaria)", localitate: "Iasi", judet: "Iasi" },
  { nume: "Palatul Baroc (Muzeul de Arta)", localitate: "Timisoara", judet: "Timis" },
  { nume: "Palatul Dicasterial", localitate: "Timisoara", judet: "Timis" },
  { nume: "Palatul Vulturul Negru", localitate: "Oradea", judet: "Bihor" },
  { nume: "Palatul Episcopiei Romano-Catolice", localitate: "Oradea", judet: "Bihor" },
  { nume: "Palatul Apollo", localitate: "Targu Mures", judet: "Mures" },
  { nume: "Palatul Culturii", localitate: "Targu Mures", judet: "Mures" },
  { nume: "Palatul Administrativ", localitate: "Craiova", judet: "Dolj" },
  { nume: "Palatul Jean Mihail (Muzeul de Arta)", localitate: "Craiova", judet: "Dolj" },
  { nume: "Palatul Marincu", localitate: "Calafat", judet: "Dolj" },
  { nume: "Palatul Domnesc de la Curtea Noua", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Palatul Cotroceni", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Palatul Regal", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Palatul Stirbey", localitate: "Buftea", judet: "Ilfov" },
  { nume: "Palatul Snagov", localitate: "Snagov", judet: "Ilfov" },
  { nume: "Castelul Iulia Hasdeu", localitate: "Campina", judet: "Prahova" },
  { nume: "Castelul Marta", localitate: "Arad", judet: "Arad" },
  { nume: "Palatul Administrativ", localitate: "Arad", judet: "Arad" },
  { nume: "Castelul Nopcsa", localitate: "Sacel", judet: "Hunedoara" },
  { nume: "Castelul Kendeffy", localitate: "Santamaria-Orlea", judet: "Hunedoara" },
  { nume: "Castelul Magna Curia", localitate: "Deva", judet: "Hunedoara" },
  { nume: "Castelul Rhedey", localitate: "Sangeorgiu de Padure", judet: "Mures" },
  { nume: "Castelul Haller", localitate: "Ogra", judet: "Mures" },
  { nume: "Castelul Apafi", localitate: "Malancrav", judet: "Sibiu" },
  { nume: "Palatul Brukenthal", localitate: "Avrig", judet: "Sibiu" },
  { nume: "Castelul Sukosd-Bethlen", localitate: "Racos", judet: "Brasov" },
  { nume: "Castelul Beldy Ladislau", localitate: "Budila", judet: "Brasov" },
  { nume: "Castelul Mikes", localitate: "Zabala", judet: "Covasna" },
  { nume: "Castelul Kalnoky", localitate: "Miclosoara", judet: "Covasna" },
  { nume: "Castelul Daniel", localitate: "Talisoara", judet: "Covasna" },
  { nume: "Castelul Szentkereszty", localitate: "Arcus", judet: "Covasna" },
  { nume: "Conacul Bellu", localitate: "Urlati", judet: "Prahova" },
  { nume: "Conacul Pana Filipescu", localitate: "Filipestii de Targ", judet: "Prahova" },
  { nume: "Conacul Octavian Goga", localitate: "Ciucea", judet: "Cluj" },
  { nume: "Castelul Bocskai", localitate: "Aghiresu", judet: "Cluj" },
  { nume: "Castelul Kemeny", localitate: "Brancovenesti", judet: "Mures" },
  { nume: "Palatul Domnesc", localitate: "Cotnari", judet: "Iasi" },
  { nume: "Palatul Cuza", localitate: "Ruginoasa", judet: "Iasi" },
  { nume: "Palatul Comisiei Europene a Dunarii", localitate: "Sulina", judet: "Tulcea" },
  { nume: "Palatul Episcopal", localitate: "Galati", judet: "Galati" },
  { nume: "Hanul lui Manuc", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Hanul Gabroveni", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Palatul Cazinoului", localitate: "Vatra Dornei", judet: "Suceava" },
  { nume: "Castelul Wesselényi", localitate: "Jibou", judet: "Salaj" },
  { nume: "Castelul Teleki", localitate: "Pribilesti", judet: "Maramures" },
  { nume: "Cetatea Rupea", localitate: "Rupea", judet: "Brasov" },
  { nume: "Cetatea Sighisoara", localitate: "Sighisoara", judet: "Mures" },
  { nume: "Cetatea Ciceu", localitate: "Ciceu-Corabia", judet: "Bistrita-Nasaud" },
  { nume: "Cetatea Bistritei (Turnul Dogarilor)", localitate: "Bistrita", judet: "Bistrita-Nasaud" },
  { nume: "Cetatea Medievala", localitate: "Targu Mures", judet: "Mures" },
  { nume: "Cetatea Feldioara", localitate: "Feldioara", judet: "Brasov" },
  { nume: "Cetatea Hoghiz", localitate: "Hoghiz", judet: "Brasov" },
  { nume: "Cetatea Fetei", localitate: "Floresti", judet: "Cluj" },
  { nume: "Cetatea Bologa", localitate: "Poieni", judet: "Cluj" },
  { nume: "Cetatea Liteni", localitate: "Liteni", judet: "Cluj" },
  { nume: "Cetatea Coltesti", localitate: "Coltesti", judet: "Alba" },
  { nume: "Cetatea Calnic (UNESCO)", localitate: "Calnic", judet: "Alba" },
  { nume: "Cetatea Soimos", localitate: "Lipova", judet: "Arad" },
  { nume: "Cetatea Siria", localitate: "Siria", judet: "Arad" },
  { nume: "Cetatea Dezna", localitate: "Dezna", judet: "Arad" },
  { nume: "Cetatea Ineu", localitate: "Ineu", judet: "Arad" },
  { nume: "Cetatea Aradului", localitate: "Arad", judet: "Arad" },
  { nume: "Cetatea Timisoara (Bastionul Theresia)", localitate: "Timisoara", judet: "Timis" },
  { nume: "Cetatea Severinului", localitate: "Drobeta-Turnu Severin", judet: "Mehedinti" },
  { nume: "Cetatea Oradea", localitate: "Oradea", judet: "Bihor" },
  { nume: "Cetatea Porolissum", localitate: "Moigrad-Porolissum", judet: "Salaj" },
  { nume: "Cetatea Buciumi", localitate: "Buciumi", judet: "Salaj" },
  { nume: "Cetatea Almasului", localitate: "Almasu", judet: "Salaj" },
  { nume: "Cetatea Chioarului", localitate: "Remetea Chioarului", judet: "Maramures" },
  { nume: "Sarmizegetusa Regia (UNESCO)", localitate: "Gradistea de Munte", judet: "Hunedoara" },
  { nume: "Cetatea Costesti-Blidaru (UNESCO)", localitate: "Costesti", judet: "Hunedoara" },
  { nume: "Cetatea Costesti-Cetatuie (UNESCO)", localitate: "Costesti", judet: "Hunedoara" },
  { nume: "Cetatea Piatra Rosie (UNESCO)", localitate: "Alun", judet: "Hunedoara" },
  { nume: "Cetatea Banita (UNESCO)", localitate: "Banita", judet: "Hunedoara" },
  { nume: "Ulpia Traiana Sarmizegetusa", localitate: "Sarmizegetusa", judet: "Hunedoara" },
  { nume: "Cetatea Malaiesti", localitate: "Malaiesti", judet: "Hunedoara" },
  { nume: "Cetatea Giurgiu", localitate: "Giurgiu", judet: "Giurgiu" },
  { nume: "Cetatea Chilia Noua", localitate: "Chilia Veche", judet: "Tulcea" },
  { nume: "Cetatea Argamum", localitate: "Jurilovca", judet: "Tulcea" },
  { nume: "Cetatea Ibida", localitate: "Slava Rusa", judet: "Tulcea" },
  { nume: "Cetatea Noviodunum", localitate: "Isaccea", judet: "Tulcea" },
  { nume: "Cetatea Dinogetia", localitate: "Garvan", judet: "Tulcea" },
  { nume: "Cetatea Histria", localitate: "Istria", judet: "Constanta" },
  { nume: "Cetatea Capidava", localitate: "Topalu", judet: "Constanta" },
  { nume: "Cetatea Carsium", localitate: "Harsova", judet: "Constanta" },
  { nume: "Cetatea Callatis", localitate: "Mangalia", judet: "Constanta" },
  { nume: "Cetatea Tomis", localitate: "Constanta", judet: "Constanta" },
  { nume: "Tropaeum Traiani", localitate: "Adamclisi", judet: "Constanta" },
  { nume: "Cetatea Sacidava", localitate: "Alimanesti", judet: "Constanta" },
  { nume: "Cetatea Sucidava", localitate: "Celeiu", judet: "Olt" },
  { nume: "Cetatea Turnu", localitate: "Turnu Magurele", judet: "Teleorman" },
  { nume: "Curtea Domneasca din Targoviste (Turnul Chindiei)", localitate: "Targoviste", judet: "Dambovita" },
  { nume: "Curtea Domneasca din Suceava", localitate: "Suceava", judet: "Suceava" },
  { nume: "Curtea Domneasca din Piatra Neamt", localitate: "Piatra Neamt", judet: "Neamt" },
  { nume: "Curtea Veche", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Turnul Sfatului", localitate: "Sibiu", judet: "Sibiu" },
  { nume: "Turnul Dulgherilor", localitate: "Sibiu", judet: "Sibiu" },
  { nume: "Turnul Olarilor", localitate: "Sibiu", judet: "Sibiu" },
  { nume: "Turnul Pompierilor", localitate: "Cluj-Napoca", judet: "Cluj" },
  { nume: "Turnul Croitorilor", localitate: "Cluj-Napoca", judet: "Cluj" },
  { nume: "Turnul Alb", localitate: "Brasov", judet: "Brasov" },
  { nume: "Turnul Negru", localitate: "Brasov", judet: "Brasov" },
  { nume: "Bastionul Tesatorilor", localitate: "Brasov", judet: "Brasov" },
  { nume: "Cetatuia de pe Straja", localitate: "Brasov", judet: "Brasov" },
  { nume: "Cetatuia Clujului", localitate: "Cluj-Napoca", judet: "Cluj" },
  { nume: "Manastirea Sucevita (UNESCO)", localitate: "Sucevita", judet: "Suceava" },
  { nume: "Manastirea Moldovita (UNESCO)", localitate: "Vatra Moldovitei", judet: "Suceava" },
  { nume: "Manastirea Humor (UNESCO)", localitate: "Manastirea Humorului", judet: "Suceava" },
  { nume: "Manastirea Arbore (UNESCO)", localitate: "Arbore", judet: "Suceava" },
  { nume: "Manastirea Patrauti (UNESCO)", localitate: "Patrauti", judet: "Suceava" },
  { nume: "Manastirea Putna", localitate: "Putna", judet: "Suceava" },
  { nume: "Manastirea Dragomirna", localitate: "Mitocu Dragomirnei", judet: "Suceava" },
  { nume: "Manastirea Bogdana", localitate: "Radauti", judet: "Suceava" },
  { nume: "Manastirea Risca", localitate: "Risca", judet: "Suceava" },
  { nume: "Manastirea Slatina", localitate: "Slatina", judet: "Suceava" },
  { nume: "Manastirea Agapia", localitate: "Agapia", judet: "Neamt" },
  { nume: "Manastirea Varatec", localitate: "Varatec", judet: "Neamt" },
  { nume: "Manastirea Secu", localitate: "Vanatori-Neamt", judet: "Neamt" },
  { nume: "Manastirea Sihastria", localitate: "Vanatori-Neamt", judet: "Neamt" },
  { nume: "Manastirea Bistrita", localitate: "Alexandru cel Bun", judet: "Neamt" },
  { nume: "Manastirea Durau", localitate: "Ceahlau", judet: "Neamt" },
  { nume: "Manastirea Pangarati", localitate: "Pangarati", judet: "Neamt" },
  { nume: "Manastirea Tazlau", localitate: "Tazlau", judet: "Neamt" },
  { nume: "Manastirea Horezu (UNESCO)", localitate: "Horezu", judet: "Vâlcea" },
  { nume: "Manastirea Cozia", localitate: "Calimanesti", judet: "Vâlcea" },
  { nume: "Manastirea Dintr-un Lemn", localitate: "Francesti", judet: "Vâlcea" },
  { nume: "Manastirea Govora", localitate: "Mihaesti", judet: "Vâlcea" },
  { nume: "Manastirea Bistrita", localitate: "Costesti", judet: "Vâlcea" },
  { nume: "Manastirea Arnota", localitate: "Costesti", judet: "Vâlcea" },
  { nume: "Manastirea Turnu", localitate: "Calimanesti", judet: "Vâlcea" },
  { nume: "Manastirea Stanisora", localitate: "Calimanesti", judet: "Vâlcea" },
  { nume: "Manastirea Curtea de Arges", localitate: "Curtea de Arges", judet: "Arges" },
  { nume: "Manastirea Aninoasa", localitate: "Aninoasa", judet: "Arges" },
  { nume: "Manastirea Slanic", localitate: "Aninoasa", judet: "Arges" },
  { nume: "Manastirea Robaia", localitate: "Musatesti", judet: "Arges" },
  { nume: "Manastirea Namaesti (Rupestra)", localitate: "Namaesti", judet: "Arges" },
  { nume: "Manastirea Corbii de Piatra (Rupestra)", localitate: "Corbi", judet: "Arges" },
  { nume: "Manastirea Cetatuia Negru Voda", localitate: "Cetateni", judet: "Arges" },
  { nume: "Manastirea Tismana", localitate: "Tismana", judet: "Gorj" },
  { nume: "Manastirea Polovragi", localitate: "Polovragi", judet: "Gorj" },
  { nume: "Manastirea Lainici", localitate: "Schela", judet: "Gorj" },
  { nume: "Manastirea Crasna", localitate: "Crasna", judet: "Gorj" },
  { nume: "Manastirea Barsana (UNESCO)", localitate: "Barsana", judet: "Maramures" },
  { nume: "Manastirea Peri-Sapanta", localitate: "Sapanta", judet: "Maramures" },
  { nume: "Manastirea Rohia", localitate: "Targu Lapus", judet: "Maramures" },
  { nume: "Manastirea Moisei", localitate: "Moisei", judet: "Maramures" },
  { nume: "Biserica Ieud Deal (UNESCO)", localitate: "Ieud", judet: "Maramures" },
  { nume: "Biserica Poienile Izei (UNESCO)", localitate: "Poienile Izei", judet: "Maramures" },
  { nume: "Biserica Surdesti (UNESCO)", localitate: "Sisesti", judet: "Maramures" },
  { nume: "Biserica Plopis (UNESCO)", localitate: "Sisesti", judet: "Maramures" },
  { nume: "Biserica Desesti (UNESCO)", localitate: "Desesti", judet: "Maramures" },
  { nume: "Biserica Budesti Josani (UNESCO)", localitate: "Budesti", judet: "Maramures" },
  { nume: "Manastirea Nicula", localitate: "Nicula", judet: "Cluj" },
  { nume: "Manastirea Ramet", localitate: "Ramet", judet: "Alba" },
  { nume: "Manastirea Prislop", localitate: "Silvasu de Sus", judet: "Hunedoara" },
  { nume: "Manastirea Crisan", localitate: "Crisan", judet: "Hunedoara" },
  { nume: "Manastirea Bodrog (Hodos-Bodrog)", localitate: "Bodrogu Nou", judet: "Arad" },
  { nume: "Manastirea Radna (Maria Radna)", localitate: "Lipova", judet: "Arad" },
  { nume: "Manastirea Sfanta Maria", localitate: "Techirghiol", judet: "Constanta" },
  { nume: "Manastirea Dervent", localitate: "Galita", judet: "Constanta" },
  { nume: "Manastirea Pestera Sfantului Andrei", localitate: "Ion Corvin", judet: "Constanta" },
  { nume: "Manastirea Celic-Dere", localitate: "Frecatei", judet: "Tulcea" },
  { nume: "Manastirea Saon", localitate: "Frecatei", judet: "Tulcea" },
  { nume: "Manastirea Cocos", localitate: "Niculitel", judet: "Tulcea" },
  { nume: "Manastirea Cernica", localitate: "Pantelimon", judet: "Ilfov" },
  { nume: "Manastirea Pasarea", localitate: "Branesti", judet: "Ilfov" },
  { nume: "Manastirea Caldarusani", localitate: "Gruiu", judet: "Ilfov" },
  { nume: "Manastirea Snagov", localitate: "Snagov", judet: "Ilfov" },
  { nume: "Manastirea Caraiman", localitate: "Busteni", judet: "Prahova" },
  { nume: "Manastirea Ghighiu", localitate: "Barcanesti", judet: "Prahova" },
  { nume: "Manastirea Sinaia", localitate: "Sinaia", judet: "Prahova" },
  { nume: "Manastirea Zamfira", localitate: "Lipanesti", judet: "Prahova" },
  { nume: "Manastirea Crasna", localitate: "Crasna", judet: "Prahova" },
  { nume: "Manastirea Ciolanu", localitate: "Tisau", judet: "Buzau" },
  { nume: "Manastirea Frasinei", localitate: "Muereasca", judet: "Vâlcea" },
  { nume: "Biserica Neagra", localitate: "Brasov", judet: "Brasov" },
  { nume: "Biserica Sfantul Nicolae", localitate: "Brasov", judet: "Brasov" },
  { nume: "Catedrala Evanghelica Ciriac", localitate: "Sibiu", judet: "Sibiu" },
  { nume: "Catedrala Mitopolitana Ortodoxa", localitate: "Sibiu", judet: "Sibiu" },
  { nume: "Biserica Sfantul Mihail", localitate: "Cluj-Napoca", judet: "Cluj" },
  { nume: "Catedrala Mitropolitana Ortodoxa", localitate: "Cluj-Napoca", judet: "Cluj" },
  { nume: "Catedrala Romano-Catolica Sfantul Mihail", localitate: "Alba Iulia", judet: "Alba" },
  { nume: "Catedrala Incoronarii", localitate: "Alba Iulia", judet: "Alba" },
  { nume: "Catedrala Mitropolitana", localitate: "Timisoara", judet: "Timis" },
  { nume: "Catedrala Mitropolitana", localitate: "Iasi", judet: "Iasi" },
  { nume: "Biserica Fortificata Viscri (UNESCO)", localitate: "Viscri", judet: "Brasov" },
  { nume: "Biserica Fortificata Prejmer (UNESCO)", localitate: "Prejmer", judet: "Brasov" },
  { nume: "Biserica Fortificata Biertan (UNESCO)", localitate: "Biertan", judet: "Sibiu" },
  { nume: "Biserica Fortificata Saschiz (UNESCO)", localitate: "Saschiz", judet: "Mures" },
  { nume: "Biserica Fortificata Darjiu (UNESCO)", localitate: "Darjiu", judet: "Harghita" },
  { nume: "Biserica Fortificata Calnic (UNESCO)", localitate: "Calnic", judet: "Alba" },
  { nume: "Biserica Fortificata Valea Viilor (UNESCO)", localitate: "Valea Viilor", judet: "Sibiu" },
  { nume: "Biserica Fortificata Harman", localitate: "Harman", judet: "Brasov" },
  { nume: "Biserica Fortificata Cristian", localitate: "Cristian", judet: "Brasov" },
  { nume: "Biserica Fortificata Codlea", localitate: "Codlea", judet: "Brasov" },
  { nume: "Biserica Fortificata Bod", localitate: "Bod", judet: "Brasov" },
  { nume: "Biserica Fortificata Vulcan", localitate: "Vulcan", judet: "Brasov" },
  { nume: "Biserica Fortificata Sanpetru", localitate: "Sanpetru", judet: "Brasov" },
  { nume: "Biserica Fortificata Cisnadioara", localitate: "Cisnadioara", judet: "Sibiu" },
  { nume: "Biserica Fortificata Cisnadie", localitate: "Cisnadie", judet: "Sibiu" },
  { nume: "Biserica Fortificata Cristian", localitate: "Cristian", judet: "Sibiu" },
  { nume: "Biserica Fortificata Axente Sever", localitate: "Axente Sever", judet: "Sibiu" },
  { nume: "Biserica Fortificata Medias (Castelul Margarete)", localitate: "Medias", judet: "Sibiu" },
  { nume: "Biserica Fortificata Agnita", localitate: "Agnita", judet: "Sibiu" },
  { nume: "Biserica Fortificata Moardas", localitate: "Moardas", judet: "Sibiu" },
  { nume: "Biserica Fortificata Richis", localitate: "Richis", judet: "Sibiu" },
  { nume: "Biserica Fortificata Alma Vii", localitate: "Alma Vii", judet: "Sibiu" },
  { nume: "Biserica Fortificata Bazna", localitate: "Bazna", judet: "Sibiu" },
  { nume: "Biserica Fortificata Hosman", localitate: "Hosman", judet: "Sibiu" },
  { nume: "Biserica Fortificata Dealu Frumos", localitate: "Dealu Frumos", judet: "Sibiu" },
  { nume: "Biserica Fortificata Stejarisu", localitate: "Stejarisu", judet: "Sibiu" },
  { nume: "Biserica Fortificata Iacobeni", localitate: "Iacobeni", judet: "Sibiu" },
  { nume: "Biserica Fortificata Carta (Abatia Cisterciana)", localitate: "Carta", judet: "Sibiu" },
  { nume: "Biserica Fortificata Apold", localitate: "Apold", judet: "Mures" },
  { nume: "Biserica Fortificata Archita", localitate: "Archita", judet: "Mures" },
  { nume: "Biserica Fortificata Cloasterf", localitate: "Cloasterf", judet: "Mures" },
  { nume: "Biserica Fortificata Danes", localitate: "Danes", judet: "Mures" },
  { nume: "Biserica Fortificata Nades", localitate: "Nades", judet: "Mures" },
  { nume: "Biserica Fortificata Bagaciu", localitate: "Bagaciu", judet: "Mures" },
  { nume: "Biserica Fortificata Aiud", localitate: "Aiud", judet: "Alba" },
  { nume: "Cimitirul Vesel", localitate: "Sapanta", judet: "Maramures" },
  { nume: "Cimitirul Central (Hajongard)", localitate: "Cluj-Napoca", judet: "Cluj" },
  { nume: "Cimitirul Bellu", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Cimitirul Evreiesc", localitate: "Siret", judet: "Suceava" },
  { nume: "Cimitirul International al Eroilor", localitate: "Valea Uzului", judet: "Harghita" },
  { nume: "Sfinxul si Babele", localitate: "Muntii Bucegi", judet: "Prahova" },
  { nume: "Pestera Scarisoara (Ghetarul)", localitate: "Garda de Sus", judet: "Alba" },
  { nume: "Pestera Ursilor", localitate: "Chiscau", judet: "Bihor" },
  { nume: "Pestera Muierilor", localitate: "Baia de Fier", judet: "Gorj" },
  { nume: "Pestera Polovragi", localitate: "Polovragi", judet: "Gorj" },
  { nume: "Pestera Dambovicioara", localitate: "Dambovicioara", judet: "Arges" },
  { nume: "Pestera Meziad", localitate: "Meziad", judet: "Bihor" },
  { nume: "Pestera Vantului", localitate: "Suncuius", judet: "Bihor" },
  { nume: "Pestera Crystal din Mina Farcu", localitate: "Rosia", judet: "Bihor" },
  { nume: "Pestera Limanu", localitate: "Limanu", judet: "Constanta" },
  { nume: "Pestera Hodos (Gura Dobrogei)", localitate: "Targusor", judet: "Constanta" },
  { nume: "Pestera Sfantului Ioan Casian", localitate: "Targusor", judet: "Constanta" },
  { nume: "Pestera Ialomitei", localitate: "Moroeni", judet: "Dambovita" },
  { nume: "Pestera Bolii", localitate: "Petrosani", judet: "Hunedoara" },
  { nume: "Pestera Comarnic", localitate: "Carasova", judet: "Caras-Severin" },
  { nume: "Pestera Popovât", localitate: "Carasova", judet: "Caras-Severin" },
  { nume: "Pestera Veterani", localitate: "Dubova", judet: "Mehedinti" },
  { nume: "Pestera Ponicova", localitate: "Dubova", judet: "Mehedinti" },
  { nume: "Pestera Topolnita", localitate: "Ciresu", judet: "Mehedinti" },
  { nume: "Pestera Sugau", localitate: "Voslabeni", judet: "Harghita" },
  { nume: "Pestera Valea Cetatii", localitate: "Rasnov", judet: "Brasov" },
  { nume: "Vulcanii Noroiosi (Paclele Mari si Mici)", localitate: "Berca", judet: "Buzau" },
  { nume: "Gradina Zmeilor", localitate: "Galgau Almasului", judet: "Salaj" },
  { nume: "Detunatele (Detunata Goala si Detunata Flocoasa)", localitate: "Bucium", judet: "Alba" },
  { nume: "Rapa Rosie", localitate: "Sebes", judet: "Alba" },
  { nume: "Cheile Turzii", localitate: "Petrestii de Jos", judet: "Cluj" },
  { nume: "Cheile Bicazului", localitate: "Bicaz-Chei, Judetele Neamt / Harghita", judet: "Neamt" },
  { nume: "Cheile Nerei", localitate: "Sasca Montana", judet: "Caras-Severin" },
  { nume: "Cheile Carasului", localitate: "Carasova", judet: "Caras-Severin" },
  { nume: "Cheile Sohodolului", localitate: "Runcu", judet: "Gorj" },
  { nume: "Cheile Oltetului", localitate: "Polovragi", judet: "Gorj" },
  { nume: "Cheile Tisitei", localitate: "Tulnici", judet: "Vrancea" },
  { nume: "Cheile Zanoagei", localitate: "Moroeni", judet: "Dambovita" },
  { nume: "Cheile Rametului", localitate: "Ramet", judet: "Alba" },
  { nume: "Cheile Gradistei", localitate: "Moieciu", judet: "Brasov" },
  { nume: "Cheile Rasnoavei", localitate: "Rasnov", judet: "Brasov" },
  { nume: "Cascada Bigar", localitate: "Bozovici", judet: "Caras-Severin" },
  { nume: "Cascada Cailor", localitate: "Borsa", judet: "Maramures" },
  { nume: "Cascada Beusnita", localitate: "Sasca Montana", judet: "Caras-Severin" },
  { nume: "Cascada Duruitoarea", localitate: "Ceahlau", judet: "Neamt" },
  { nume: "Cascada Balea", localitate: "Cartisoara", judet: "Sibiu" },
  { nume: "Cascada Valul Miresei", localitate: "Rachitele", judet: "Cluj" },
  { nume: "Cascada Urlatoarea", localitate: "Busteni", judet: "Prahova" },
  { nume: "Cascada Putnei", localitate: "Tulnici", judet: "Vrancea" },
  { nume: "Cascada Lotrisor", localitate: "Calimanesti", judet: "Vâlcea" },
  { nume: "Cascada Scorus", localitate: "Malaia", judet: "Vâlcea" },
  { nume: "Cascada Ciucas", localitate: "Mihai Viteazu", judet: "Cluj" },
  { nume: "Lacul Rosu", localitate: "Lacu Rosu", judet: "Harghita" },
  { nume: "Lacul Sfanta Ana", localitate: "Bixad", judet: "Harghita" },
  { nume: "Lacul Bâlea", localitate: "Cartisoara", judet: "Sibiu" },
  { nume: "Lacul Bucura", localitate: "Muntii Retezat", judet: "Hunedoara" },
  { nume: "Lacul Zanoaga", localitate: "Muntii Retezat", judet: "Hunedoara" },
  { nume: "Lacul Ochiul Beiului", localitate: "Sasca Montana", judet: "Caras-Severin" },
  { nume: "Lacul Dracului", localitate: "Carbunari", judet: "Caras-Severin" },
  { nume: "Lacul Vidraru", localitate: "Arefu", judet: "Arges" },
  { nume: "Lacul Izvorul Muntelui (Bicaz)", localitate: "Bicaz", judet: "Neamt" },
  { nume: "Lacul Colibita", localitate: "Colibita", judet: "Bistrita-Nasaud" },
  { nume: "Lacul Iezer", localitate: "Muntii Rodnei", judet: "Maramures" },
  { nume: "Lacul Albastru", localitate: "Baia Sprie", judet: "Maramures" },
  { nume: "Lacul Siriu", localitate: "Siriu", judet: "Buzau" },
  { nume: "Lacul Razim-Sinoe", localitate: "Jurilovca", judet: "Tulcea" },
  { nume: "Focul Viu de la Andreiasu de Jos", localitate: "Andreiasu de Jos", judet: "Vrancea" },
  { nume: "Focurile Vii de la Lopatari", localitate: "Lopatari", judet: "Buzau" },
  { nume: "Cazanele Dunarii (Mari si Mici)", localitate: "Dubova", judet: "Mehedinti" },
  { nume: "Chipul lui Decebal", localitate: "Dubova", judet: "Mehedinti" },
  { nume: "Podul lui Dumnezeu", localitate: "Ponoarele", judet: "Mehedinti" },
  { nume: "Padurea Letea", localitate: "C.A. Rosetti", judet: "Tulcea" },
  { nume: "Padurea Caraorman", localitate: "Crisan", judet: "Tulcea" },
  { nume: "Gradina Botanica „Alexandru Borza”", localitate: "Cluj-Napoca", judet: "Cluj" },
  { nume: "Gradina Botanica „Anastasie Fatu”", localitate: "Iasi", judet: "Iasi" },
  { nume: "Gradina Botanica „Dimitrie Brândza”", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Gradina Botanica Jibou", localitate: "Jibou", judet: "Salaj" },
  { nume: "Gradina Botanica Bucov", localitate: "Bucov", judet: "Prahova" },
  { nume: "Delta Dunarii (Rezervatie Biosfera)", localitate: "Judetul Tulcea", judet: "Tulcea" },
  { nume: "Parcul National Retezat", localitate: "Judetul Hunedoara", judet: "Hunedoara" },
  { nume: "Parcul National Piatra Craiului", localitate: "Zarnesti", judet: "Brasov" },
  { nume: "Parcul National Cheile Nerei-Beusnita", localitate: "Judetul Caras-Severin", judet: "Caras-Severin" },
  { nume: "Parcul National Ceahlau", localitate: "Izvoru Muntelui", judet: "Neamt" },
  { nume: "Parcul National Cozia", localitate: "Brezoi", judet: "Vâlcea" },
  { nume: "Sfinxul din Banat", localitate: "Toplet", judet: "Caras-Severin" },
  { nume: "Transfagarasan (Soseaua DN7C)", localitate: "Judetele Arges / Sibiu", judet: "Arges" },
  { nume: "Transalpina (Soseaua DN67C)", localitate: "Judetele Gorj / Alba", judet: "Gorj" },
  { nume: "Transbucegi (Soseaua DJ713)", localitate: "Judetele Dambovita / Prahova", judet: "Dambovita" },
  { nume: "Transrarau (Soseaua DJ175B)", localitate: "Pojorata / Chiril", judet: "Suceava" },
  { nume: "Transursoaia (Soseaua DN1R)", localitate: "Albac / Huedin, Judetele Alba / Cluj", judet: "Alba" },
  { nume: "Transsemenic (Soseaua DJ582)", localitate: "Slatina-Timis / Resita", judet: "Caras-Severin" },
  { nume: "Pasul Tihuta", localitate: "Piatra Fantanele", judet: "Bistrita-Nasaud" },
  { nume: "Pasul Prislop", localitate: "Borsa", judet: "Maramures" },
  { nume: "Mocanita de pe Valea Vaserului", localitate: "Viseu de Sus", judet: "Maramures" },
  { nume: "Mocanita Hutulca", localitate: "Moldovita", judet: "Suceava" },
  { nume: "Mocanita Apusenilor", localitate: "Abrud", judet: "Alba" },
  { nume: "Calea Ferata Oravita-Anina", localitate: "Oravita", judet: "Caras-Severin" },
  { nume: "Podul Anghel Saligny", localitate: "Cernavoda", judet: "Constanta" },
  { nume: "Canalul Dunare-Marea Neagra", localitate: "Judetul Constanta", judet: "Constanta" },
  { nume: "Barajul Vidraru", localitate: "Arefu", judet: "Arges" },
  { nume: "Barajul Bicaz", localitate: "Bicaz", judet: "Neamt" },
  { nume: "Barajul Portile de Fier I", localitate: "Drobeta-Turnu Severin", judet: "Mehedinti" },
  { nume: "Barajul Gura Apelor", localitate: "Muntii Retezat", judet: "Hunedoara" },
  { nume: "Barajul Paltinu", localitate: "Valea Doftanei", judet: "Prahova" },
  { nume: "Barajul Bolboci", localitate: "Moroeni", judet: "Dambovita" },
  { nume: "Salina Ocnele Mari", localitate: "Ocnele Mari", judet: "Vâlcea" },
  { nume: "Salina Cacica", localitate: "Cacica", judet: "Suceava" },
  { nume: "Telegondola Mamaia", localitate: "Mamaia", judet: "Constanta" },
  { nume: "Telecabina Bâlea Lac", localitate: "Cartisoara", judet: "Sibiu" },
  { nume: "Telecabina Busteni-Babele", localitate: "Busteni", judet: "Prahova" },
  { nume: "Telecabina Sinaia", localitate: "Sinaia", judet: "Prahova" },
  { nume: "Funicularul din Resita", localitate: "Resita", judet: "Caras-Severin" },
  { nume: "Portul Turistic Tomis", localitate: "Constanta", judet: "Constanta" },
  { nume: "Faleza Dunarii", localitate: "Galati", judet: "Galati" },
  { nume: "Faleza Dunarii", localitate: "Braila", judet: "Braila" },
  { nume: "Muzeul Recordurilor Romanesti", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Muzeul National al Hartilor si Cartii Vechi", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Muzeul National de Artă Contemporana (MNAC)", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Muzeul National al Literaturii Romane", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Muzeul National Filatelic", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Muzeul Municipiului Bucuresti (Palatul Sutu)", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Muzeul National Tehnic „Dimitrie Leonida”", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Muzeul National al Aviatiei Romane", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Muzeul Cailor Ferate Romane", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Muzeul Kitsch-ului Romanesc", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Muzeul National „George Enescu”", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Muzeul Theodor Pallady", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Muzeul Zambaccian", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Muzeul de Arta „Vasile Grigore”", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Casa Memoriala „Tudor Arghezi", localitate: "Martisor” – Bucuresti", judet: "Bucuresti" },
  { nume: "Muzeul Satului Maramuresean", localitate: "Sighetu Marmatiei", judet: "Maramures" },
  { nume: "Muzeul Satului Banatean", localitate: "Timisoara", judet: "Timis" },
  { nume: "Muzeul Satului Bucovinean", localitate: "Suceava", judet: "Suceava" },
  { nume: "Muzeul ASTRA (Civilizatiei Populare Traditionale)", localitate: "Sibiu", judet: "Sibiu" },
  { nume: "Muzeul Etnografic al Transilvaniei", localitate: "Cluj-Napoca", judet: "Cluj" },
  { nume: "Muzeul Tarii Crisurilor", localitate: "Oradea", judet: "Bihor" },
  { nume: "Muzeul Regiunii Portilor de Fier", localitate: "Drobeta-Turnu Severin", judet: "Mehedinti" },
  { nume: "Muzeul Olteniei", localitate: "Craiova", judet: "Dolj" },
  { nume: "Muzeul Ceasului „Nicolae Simache”", localitate: "Ploiesti", judet: "Prahova" },
  { nume: "Muzeul National al Petrolului", localitate: "Ploiesti", judet: "Prahova" },
  { nume: "Muzeul Judetean de Istorie si Arheologie", localitate: "Prahova", judet: "Prahova" },
  { nume: "Muzeul Chihlimbarului", localitate: "Colti", judet: "Buzau" },
  { nume: "Muzeul National al Carpatilor Rasariteni", localitate: "Sfântu Gheorghe", judet: "Covasna" },
  { nume: "Muzeul Secuiesc al Ciucului", localitate: "Miercurea Ciuc", judet: "Harghita" },
  { nume: "Muzeul de Arta Comparata", localitate: "Sângeorz-Bai", judet: "Bistrita-Nasaud" },
  { nume: "Muzeul Memorial „Octavian Goga”", localitate: "Ciucea", judet: "Cluj" },
  { nume: "Muzeul Memorial „Ioan Slavici si Emil Montia”", localitate: "Siria", judet: "Arad" },
  { nume: "Muzeul Aurului", localitate: "Brad", judet: "Hunedoara" },
  { nume: "Muzeul Mineritului", localitate: "Petrosani", judet: "Hunedoara" },
  { nume: "Muzeul Judetean de Istorie", localitate: "Brasov", judet: "Brasov" },
  { nume: "Muzeul Casa Muresenilor", localitate: "Brasov", judet: "Brasov" },
  { nume: "Muzeul Primei Scoli Romanesti", localitate: "Brasov", judet: "Brasov" },
  { nume: "Muzeul National al Unirii", localitate: "Alba Iulia", judet: "Alba" },
  { nume: "Muzeul de Istorie a Farmaciei", localitate: "Sibiu", judet: "Sibiu" },
  { nume: "Muzeul de Istorie Naturala", localitate: "Sibiu", judet: "Sibiu" },
  { nume: "Muzeul Cinegetic", localitate: "Posada", judet: "Prahova" },
  { nume: "Muzeul Etnografic Samuil si Eugenia Ionel", localitate: "Radauti", judet: "Suceava" },
  { nume: "Muzeul Oului", localitate: "Vama", judet: "Suceava" },
  { nume: "Muzeul Oului Încondeiat Lucia Condrea", localitate: "Moldovita", judet: "Suceava" },
  { nume: "Muzeul Arta Lemnului", localitate: "Câmpulung Moldovenesc", judet: "Suceava" },
  { nume: "Muzeul Apelor „Mihai Bacescu”", localitate: "Falticeni", judet: "Suceava" },
  { nume: "Muzeul Popa (Arta Naiva)", localitate: "Tarpesti", judet: "Neamt" },
  { nume: "Muzeul de Istorie si Etnografie", localitate: "Targu Neamt", judet: "Neamt" },
  { nume: "Muzeul Vasile Pârvan", localitate: "Bârlad", judet: "Vaslui" },
  { nume: "Muzeul Municipal", localitate: "Husi", judet: "Vaslui" },
  { nume: "Muzeul de Istorie „Paul Paltanea”", localitate: "Galati", judet: "Galati" },
  { nume: "Muzeul de Stiinte ale Naturii", localitate: "Galati", judet: "Galati" },
  { nume: "Muzeul Brailei „Carol I”", localitate: "Braila", judet: "Braila" },
  { nume: "Muzeul de Istorie Nationala si Arheologie", localitate: "Constanta", judet: "Constanta" },
  { nume: "Muzeul de Arta Populara", localitate: "Constanta", judet: "Constanta" },
  { nume: "Muzeul Marinei Romane", localitate: "Constanta", judet: "Constanta" },
  { nume: "Edificiul Roman cu Mozaic", localitate: "Constanta", judet: "Constanta" },
  { nume: "Muzeul Farului", localitate: "Sulina", judet: "Tulcea" },
  { nume: "Centrul Eco-Turism Delta Dunarii", localitate: "Tulcea", judet: "Tulcea" },
  { nume: "Muzeul de Istorie si Arheologie", localitate: "Tulcea", judet: "Tulcea" },
  { nume: "Ateneul Roman", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Arcul de Triumf", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Cazinoul din Constanta", localitate: "Constanta", judet: "Constanta" },
  { nume: "Teatrul National „Vasile Alecsandri”", localitate: "Iasi", judet: "Iasi" },
  { nume: "Teatrul National „Mihai Eminescu”", localitate: "Timisoara", judet: "Timis" },
  { nume: "Teatrul National Cluj-Napoca", localitate: "Cluj-Napoca", judet: "Cluj" },
  { nume: "Teatrul National „Radu Stanca”", localitate: "Sibiu", judet: "Sibiu" },
  { nume: "Teatrul National Targu Mures", localitate: "Targu Mures", judet: "Mures" },
  { nume: "Teatrul National „Marin Sorescu”", localitate: "Craiova", judet: "Dolj" },
  { nume: "Teatrul Clasic „Ioan Slavici”", localitate: "Arad", judet: "Arad" },
  { nume: "Teatrul de Stat", localitate: "Oradea", judet: "Bihor" },
  { nume: "Opera Nationala Bucuresti", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Opera Nationala Romana", localitate: "Cluj-Napoca", judet: "Cluj" },
  { nume: "Opera Nationala Romana", localitate: "Timisoara", judet: "Timis" },
  { nume: "Opera Nationala Romana", localitate: "Iasi", judet: "Iasi" },
  { nume: "Piata Sfatului", localitate: "Brasov", judet: "Brasov" },
  { nume: "Piata Mare", localitate: "Sibiu", judet: "Sibiu" },
  { nume: "Piata Mica (Podul Minciunilor)", localitate: "Sibiu", judet: "Sibiu" },
  { nume: "Piata Huet", localitate: "Sibiu", judet: "Sibiu" },
  { nume: "Piata Unirii", localitate: "Cluj-Napoca", judet: "Cluj" },
  { nume: "Piata Muzeului", localitate: "Cluj-Napoca", judet: "Cluj" },
  { nume: "Piata Unirii", localitate: "Timisoara", judet: "Timis" },
  { nume: "Piata Victoriei (Operei)", localitate: "Timisoara", judet: "Timis" },
  { nume: "Piata Libertatii", localitate: "Timisoara", judet: "Timis" },
  { nume: "Piata Unirii", localitate: "Oradea", judet: "Bihor" },
  { nume: "Piata Avram Iancu", localitate: "Arad", judet: "Arad" },
  { nume: "Piata Revolutiei", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Piata Universitatii", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Piata Unirii", localitate: "Iasi", judet: "Iasi" },
  { nume: "Cazinoul Vatra Dornei", localitate: "Vatra Dornei", judet: "Suceava" },
  { nume: "Palatul Prefecturii", localitate: "Suceava", judet: "Suceava" },
  { nume: "Palatul Comunal", localitate: "Buzau", judet: "Buzau" },
  { nume: "Cladirea Universitatii", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Cladirea Universitatii „Alexandru Ioan Cuza”", localitate: "Iasi", judet: "Iasi" },
  { nume: "Cladirea Universitatii Babes-Bolyai", localitate: "Cluj-Napoca", judet: "Cluj" },
  { nume: "Palatul Culturii", localitate: "Ploiesti", judet: "Prahova" },
  { nume: "Complexul Monumental Memorial Drobeta", localitate: "Drobeta-Turnu Severin", judet: "Mehedinti" },
  { nume: "Monumentul Eroilor Patriei", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Crucea Eroilor de pe Vârful Caraiman", localitate: "Muntii Bucegi", judet: "Prahova" },
  { nume: "Mausoleul de la Marasesti", localitate: "Marasesti", judet: "Vrancea" },
  { nume: "Mausoleul de la Marasti", localitate: "Marasti", judet: "Vrancea" },
  { nume: "Mausoleul de la Soveja", localitate: "Soveja", judet: "Vrancea" },
  { nume: "Mausoleul Mateias", localitate: "Valea Mare-Pravat", judet: "Arges" },
  { nume: "Memorialul Victimelor Comunismului si al Rezistentei", localitate: "Sighetu Marmatiei", judet: "Maramures" },
  { nume: "Inchisoarea Pitesti (Memorial)", localitate: "Pitesti", judet: "Arges" },
  { nume: "Inchisoarea Râmnicu Sărat (Memorial)", localitate: "Râmnicu Sărat", judet: "Buzău" },
  { nume: "Monumentul Revolutiei", localitate: "Timisoara", judet: "Timis" },
  { nume: "Farul Vechi", localitate: "Sulina", judet: "Tulcea" },
  { nume: "Farul Genovez", localitate: "Constanta", judet: "Constanta" },
  { nume: "Moscheea Carol I", localitate: "Constanta", judet: "Constanta" },
  { nume: "Sinagoga Mare", localitate: "Oradea", judet: "Bihor" },
  { nume: "Sinagoga din Sion", localitate: "Oradea", judet: "Bihor" },
  { nume: "Templul Coral", localitate: "Bucuresti", judet: "Bucuresti" },
  { nume: "Sinagoga Mare", localitate: "Iasi", judet: "Iasi" },
  { nume: "Biserica de Piatra Sfantul Mihail", localitate: "Densus", judet: "Hunedoara" },
  { nume: "Ansamblul Rupestru de la Murfatlar", localitate: "Murfatlar", judet: "Constanta" },
  { nume: "Complexul Rupestru Alunis", localitate: "Colti", judet: "Buzau" },
  { nume: "Rezervația de Zimbri „Dragos Voda”", localitate: "Vânători-Neamt", judet: "Neamt" },
  { nume: "Rezervația de Zimbri Vama Buzaului", localitate: "Vama Buzaului", judet: "Brasov" },
  { nume: "Rezervația de Zimbri „Neagra”", localitate: "Bucsani", judet: "Dâmbovița" },
]

exports.JUDET_NEIGHBORS = {
  "Alba": ["Cluj", "Mures", "Harghita", "Sibiu", "Valcea", "Hunedoara", "Bihor", "Arad"],
  "Arad": ["Bihor", "Cluj", "Alba", "Hunedoara", "Timis"],
  "Arges": ["Valcea", "Sibiu", "Brasov", "Dambovita", "Teleorman", "Olt"],
  "Bacau": ["Neamt", "Harghita", "Covasna", "Vrancea", "Vaslui", "Iasi"],
  "Bihor": ["Satu Mare", "Salaj", "Cluj", "Arad"],
  "Bistrita-Nasaud": ["Maramures", "Suceava", "Mures", "Cluj", "Salaj"],
  "Botosani": ["Iasi", "Suceava"],
  "Brasov": ["Covasna", "Harghita", "Mures", "Sibiu", "Arges", "Dambovita", "Prahova", "Buzau"],
  "Braila": ["Galati", "Vrancea", "Buzau", "Ialomita", "Tulcea"],
  "Buzau": ["Vrancea", "Braila", "Ialomita", "Prahova", "Brasov", "Covasna"],
  "Caras-Severin": ["Timis", "Hunedoara", "Gorj", "Mehedinti"],
  "Calarasi": ["Ialomita", "Constanta", "Giurgiu"],
  "Cluj": ["Salaj", "Maramures", "Bistrita-Nasaud", "Mures", "Alba", "Bihor"],
  "Constanta": ["Tulcea", "Ialomita", "Calarasi"],
  "Covasna": ["Harghita", "Brasov", "Buzau", "Vrancea"],
  "Dambovita": ["Arges", "Brasov", "Prahova", "Giurgiu", "Teleorman"],
  "Dolj": ["Gorj", "Valcea", "Olt", "Mehedinti"],
  "Galati": ["Vrancea", "Braila", "Vaslui", "Tulcea"],
  "Giurgiu": ["Teleorman", "Dambovita", "Ilfov", "Calarasi"],
  "Gorj": ["Valcea", "Dolj", "Mehedinti", "Hunedoara", "Caras-Severin"],
  "Harghita": ["Mures", "Neamt", "Bacau", "Covasna", "Brasov"],
  "Hunedoara": ["Alba", "Arad", "Timis", "Caras-Severin", "Gorj", "Valcea"],
  "Ialomita": ["Prahova", "Buzau", "Braila", "Calarasi", "Constanta"],
  "Iasi": ["Botosani", "Suceava", "Neamt", "Vaslui"],
  "Ilfov": ["Bucuresti", "Prahova", "Dambovita", "Giurgiu", "Calarasi", "Ialomita"],
  "Maramures": ["Satu Mare", "Salaj", "Bistrita-Nasaud", "Suceava"],
  "Mehedinti": ["Gorj", "Dolj", "Caras-Severin"],
  "Mures": ["Bistrita-Nasaud", "Cluj", "Alba", "Sibiu", "Brasov", "Harghita"],
  "Neamt": ["Suceava", "Iasi", "Bacau", "Harghita"],
  "Olt": ["Valcea", "Arges", "Teleorman", "Dolj"],
  "Prahova": ["Buzau", "Brasov", "Dambovita", "Ilfov", "Ialomita"],
  "Salaj": ["Satu Mare", "Maramures", "Cluj", "Bihor", "Bistrita-Nasaud"],
  "Satu Mare": ["Maramures", "Salaj", "Bihor"],
  "Sibiu": ["Alba", "Mures", "Brasov", "Valcea", "Arges"],
  "Suceava": ["Maramures", "Bistrita-Nasaud", "Neamt", "Iasi", "Botosani"],
  "Teleorman": ["Olt", "Arges", "Dambovita", "Giurgiu"],
  "Timis": ["Arad", "Hunedoara", "Caras-Severin"],
  "Tulcea": ["Constanta", "Braila", "Galati"],
  "Valcea": ["Gorj", "Hunedoara", "Sibiu", "Arges", "Olt", "Dolj"],
  "Vaslui": ["Iasi", "Bacau", "Vrancea", "Galati"],
  "Vrancea": ["Bacau", "Vaslui", "Galati", "Braila", "Buzau", "Covasna"],
  "Bucuresti": ["Ilfov"],
}

exports.CITY_ALIASES_RO = {
  "lisabona": "Lisboa",
  "viena": "Wien",
  "praga": "Praha",
  "varsovia": "Warszawa",
  "atena": "Athens",
  "budapesta": "Budapest",
  "bruxelles": "Brussels",
  "anvers": "Antwerpen",
  "londra": "London",
  "marsilia": "Marseille",
  "nisa": "Nice",
  "haga": "Den Haag",
  "copenhaga": "København",
  "cracovia": "Kraków",
  "florenta": "Firenze",
  "venetia": "Venezia",
}


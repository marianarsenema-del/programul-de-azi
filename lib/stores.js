/* ============================================================
   lib/stores.js — CONFIGURARE MAGAZINE
   Modifică orele direct aici. weekly are 7 poziții,
   index 0 = Duminică ... 6 = Sâmbătă (ca Date.getDay()).
   Pune null pe o zi pentru „închis toată ziua”.
   holidays: date "MM-DD" (fix, recurent) sau "YYYY-MM-DD" (mobil,
   ex. Paște — actualizează anual), hours:null = închis.
   ============================================================ */

export const STORES = {
  lidl: {
    name: "Lidl",
    weekly: [
      { open: "08:00", close: "20:00" }, // Duminică
      { open: "07:00", close: "22:00" }, // Luni
      { open: "07:00", close: "22:00" },
      { open: "07:00", close: "22:00" },
      { open: "07:00", close: "22:00" },
      { open: "07:00", close: "22:00" },
      { open: "07:00", close: "22:00" }, // Sâmbătă
    ],
    holidays: [
      { date: "12-25", label: "Crăciun (25 decembrie)", hours: null },
      { date: "01-01", label: "Anul Nou (1 ianuarie)", hours: null },
    ],
  },
  kaufland: {
    name: "Kaufland",
    weekly: [
      { open: "08:00", close: "21:00" },
      { open: "07:00", close: "22:00" },
      { open: "07:00", close: "22:00" },
      { open: "07:00", close: "22:00" },
      { open: "07:00", close: "22:00" },
      { open: "07:00", close: "22:00" },
      { open: "07:00", close: "22:00" },
    ],
    holidays: [
      { date: "12-25", label: "Crăciun (25 decembrie)", hours: null },
      { date: "01-01", label: "Anul Nou (1 ianuarie)", hours: ["09:00", "15:00"] },
    ],
  },
  penny: {
    name: "Penny",
    weekly: [
      { open: "08:00", close: "20:00" },
      { open: "07:00", close: "21:00" },
      { open: "07:00", close: "21:00" },
      { open: "07:00", close: "21:00" },
      { open: "07:00", close: "21:00" },
      { open: "07:00", close: "21:00" },
      { open: "07:00", close: "21:00" },
    ],
    holidays: [
      { date: "12-25", label: "Crăciun (25 decembrie)", hours: null },
      { date: "01-01", label: "Anul Nou (1 ianuarie)", hours: null },
    ],
  },
  megaimage: {
    name: "Mega Image",
    weekly: [
      { open: "08:00", close: "21:00" },
      { open: "07:00", close: "22:00" },
      { open: "07:00", close: "22:00" },
      { open: "07:00", close: "22:00" },
      { open: "07:00", close: "22:00" },
      { open: "07:00", close: "22:00" },
      { open: "07:00", close: "22:00" },
    ],
    holidays: [
      { date: "12-25", label: "Crăciun (25 decembrie)", hours: ["08:00", "14:00"] },
      { date: "01-01", label: "Anul Nou (1 ianuarie)", hours: ["08:00", "14:00"] },
    ],
  },
  carrefour: {
    name: "Carrefour",
    weekly: [
      { open: "09:00", close: "21:00" },
      { open: "08:00", close: "22:00" },
      { open: "08:00", close: "22:00" },
      { open: "08:00", close: "22:00" },
      { open: "08:00", close: "22:00" },
      { open: "08:00", close: "22:00" },
      { open: "08:00", close: "22:00" },
    ],
    holidays: [
      { date: "12-25", label: "Crăciun (25 decembrie)", hours: null },
      { date: "01-01", label: "Anul Nou (1 ianuarie)", hours: null },
    ],
  },
  auchan: {
    name: "Auchan",
    weekly: [
      { open: "09:00", close: "21:00" },
      { open: "08:00", close: "22:00" },
      { open: "08:00", close: "22:00" },
      { open: "08:00", close: "22:00" },
      { open: "08:00", close: "22:00" },
      { open: "08:00", close: "22:00" },
      { open: "08:00", close: "22:00" },
    ],
    holidays: [
      { date: "12-25", label: "Crăciun (25 decembrie)", hours: null },
      { date: "01-01", label: "Anul Nou (1 ianuarie)", hours: null },
    ],
  },
};

export const STORE_KEYS = Object.keys(STORES);

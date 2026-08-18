/* ============================================================
   lib/malls.js — CONFIGURARE MALL-URI
   Un mall are DOUĂ orare care rulează în paralel:
     - zones.shopping    -> magazine, food-court, cinema (10:00–22:00 standard)
     - zones.hypermarket -> hipermarketul din interior (08:00–22:00 standard)
   Adaugă un mall nou apelând createMallTemplate() și punându-l în MALLS.
   ============================================================ */

import { DAY_NAMES, computeStatus } from "./schedule";

export function createMallTemplate({ id, name, city, hypermarketName = "Hipermarket" }) {
  return {
    id, // slug unic, folosit în URL: /mall/{id}
    name, // ex: "Iulius Mall"
    city, // ex: "Timișoara"
    hypermarketName, // ex: "Auchan", "Carrefour"

    zones: {
      shopping: {
        label: "Zonă shopping (magazine, food-court, cinema)",
        weekly: [
          { open: "10:00", close: "22:00" }, // Duminică
          { open: "10:00", close: "22:00" }, // Luni
          { open: "10:00", close: "22:00" },
          { open: "10:00", close: "22:00" },
          { open: "10:00", close: "22:00" },
          { open: "10:00", close: "22:00" },
          { open: "10:00", close: "22:00" }, // Sâmbătă
        ],
        holidays: [
          { date: "12-25", label: "Crăciun (25 decembrie)", hours: ["10:00", "18:00"] },
          { date: "01-01", label: "Anul Nou (1 ianuarie)", hours: ["10:00", "18:00"] },
        ],
      },
      hypermarket: {
        label: "Hipermarket din mall",
        weekly: [
          { open: "08:00", close: "22:00" },
          { open: "08:00", close: "22:00" },
          { open: "08:00", close: "22:00" },
          { open: "08:00", close: "22:00" },
          { open: "08:00", close: "22:00" },
          { open: "08:00", close: "22:00" },
          { open: "08:00", close: "22:00" },
        ],
        holidays: [
          { date: "12-25", label: "Crăciun (25 decembrie)", hours: null },
          { date: "01-01", label: "Anul Nou (1 ianuarie)", hours: ["09:00", "15:00"] },
        ],
      },
    },
  };
}

/* Adaugă aici toate mall-urile pe care vrei să ai câte o pagină SEO. */
export const MALLS = [
  createMallTemplate({ id: "iulius-mall-timisoara", name: "Iulius Mall", city: "Timișoara", hypermarketName: "Auchan" }),
  createMallTemplate({ id: "afi-cotroceni-bucuresti", name: "AFI Cotroceni", city: "București", hypermarketName: "Carrefour" }),
  createMallTemplate({ id: "iulius-mall-cluj", name: "Iulius Mall", city: "Cluj-Napoca", hypermarketName: "Auchan" }),
];

/** Status combinat pentru un mall — folosit pentru caseta mare. */
export function getMallStatus(mall, now) {
  return {
    shopping: computeStatus(mall.zones.shopping, now),
    hypermarket: computeStatus(mall.zones.hypermarket, now),
  };
}

/**
 * Generează text SEO dinamic per mall/oraș, țintind:
 * „program mall [Oraș] azi”, „până la cât e deschis la mall duminică”,
 * „orar magazine mall”.
 */
export function generateMallSEO(mall) {
  const { name, city, hypermarketName } = mall;
  const shoppingSunday = mall.zones.shopping.weekly[0];
  const shoppingWeekday = mall.zones.shopping.weekly[1];
  const hyperSunday = mall.zones.hypermarket.weekly[0];
  const hyperWeekday = mall.zones.hypermarket.weekly[1];

  return {
    title: `Program ${name} ${city} Azi – Este Deschis Acum?`,

    metaDescription:
      `Vezi programul ${name} din ${city} chiar acum: până la ce oră e deschis mall-ul azi, ` +
      `orar magazine mall și program ${hypermarketName} din interior. Actualizat live, inclusiv duminica.`,

    h1: `Program ${name} ${city} — Azi`,

    introParagraph:
      `Cauți programul ${name} din ${city} azi? Zona de shopping a mall-ului este deschisă în mod ` +
      `standard între ${shoppingWeekday.open} și ${shoppingWeekday.close} de luni până sâmbătă, iar ` +
      `duminica până la cât e deschis la mall se schimbă ușor: programul de duminică este ` +
      `${shoppingSunday.open}–${shoppingSunday.close}. Pe lângă orarul magazine mall, ${hypermarketName}, ` +
      `hipermarketul din interior, are un program separat, de regulă mai extins: ` +
      `${hyperWeekday.open}–${hyperWeekday.close}.`,

    faq: [
      {
        question: `Până la cât e deschis la mall duminică în ${city}?`,
        answer: `${name} din ${city} este deschis duminica în intervalul ${shoppingSunday.open}–${shoppingSunday.close} pentru zona de shopping. ${hypermarketName}, hipermarketul din mall, are duminica programul ${hyperSunday.open}–${hyperSunday.close}.`,
      },
      {
        question: `Care este orarul magazine mall ${name} ${city}?`,
        answer: `Magazinele din ${name} ${city} au un program standard de ${shoppingWeekday.open} la ${shoppingWeekday.close}, de luni până sâmbătă, cu excepția sărbătorilor legale când programul poate fi redus.`,
      },
      {
        question: `${hypermarketName} din ${name} are alt program decât magazinele din mall?`,
        answer: `Da. ${hypermarketName} funcționează de obicei de la ${hyperWeekday.open}, mai devreme decât restul magazinelor din mall, care se deschid la ${shoppingWeekday.open}.`,
      },
    ],

    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ShoppingCenter",
      name: name,
      address: { "@type": "PostalAddress", addressLocality: city, addressCountry: "RO" },
      openingHoursSpecification: mall.zones.shopping.weekly.map((w, i) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAY_NAMES[i],
        opens: w.open,
        closes: w.close,
      })),
    },
  };
}

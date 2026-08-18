import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { STORES, STORE_KEYS } from "../lib/stores";
import { MALLS } from "../lib/malls";
import { DAY_NAMES, computeStatus, pad } from "../lib/schedule";
import Header from "../components/Header";
import StoreChips from "../components/StoreChips";
import StatusCard from "../components/StatusCard";
import WeekTable from "../components/WeekTable";
import HolidayList from "../components/HolidayList";

const SITE_URL = "https://programuldeazi.ro";

const jsonLdItemList = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Program magazine România",
  itemListElement: STORE_KEYS.map((key, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: STORES[key].name,
  })),
};

const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Este Lidl deschis duminica?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Majoritatea magazinelor Lidl din România sunt deschise și duminica, de regulă cu un program redus față de zilele lucrătoare. Programul exact poate diferi de la un magazin la altul.",
      },
    },
    {
      "@type": "Question",
      name: "Ce program au magazinele de sărbători?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "De sărbători legale (Crăciun, Anul Nou, Paște), magazinele pot avea program redus sau pot fi închise integral. Verifică secțiunea de program special pentru fiecare lanț de magazine.",
      },
    },
  ],
};

export default function Home() {
  const [currentKey, setCurrentKey] = useState(STORE_KEYS[0]);
  const [now, setNow] = useState(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const store = STORES[currentKey];
  const status = now ? computeStatus(store, now) : null;
  const clock = now ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` : null;
  const todayIdx = now ? now.getDay() : new Date().getDay();

  return (
    <>
      <Head>
        <title>Programul de Azi – Lidl, Kaufland, Penny, Mega Image, Carrefour, Auchan | Deschis sau Închis Acum</title>
        <meta
          name="description"
          content="Verifică în timp real dacă Lidl, Kaufland, Penny, Mega Image, Carrefour, Auchan sau mall-ul din oraș sunt deschise chiar acum. Program pe zile și program de sărbători, actualizat."
        />
        <meta
          name="keywords"
          content="program lidl azi, program kaufland azi, este deschis lidl acum, program penny, program mega image, program carrefour, program auchan, program magazine romania"
        />
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:title" content="Programul de Azi – Este magazinul deschis acum?" />
        <meta
          property="og:description"
          content="Vezi instant dacă Lidl, Kaufland, Penny, Mega Image, Carrefour, Auchan sau mall-ul sunt deschise acum, plus programul complet pe zile."
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdItemList) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      </Head>

      <Header clock={clock} />

      <main className="wrap">
        <StoreChips
          items={STORE_KEYS.map((key) => ({ key, name: STORES[key].name }))}
          currentKey={currentKey}
          onSelect={setCurrentKey}
        />

        <StatusCard
          label={store.name}
          status={status}
          badgeText={now ? `${DAY_NAMES[todayIdx]}, ${pad(now.getHours())}:${pad(now.getMinutes())}` : null}
        />

        <h2 className="section-title">
          <span className="bar"></span>Program săptămânal
        </h2>
        <WeekTable weekly={store.weekly} dayNames={DAY_NAMES} todayIdx={todayIdx} />

        <h2 className="section-title">
          <span className="bar"></span>Program de sărbători
        </h2>
        <HolidayList holidays={store.holidays} />

        <h2 className="section-title">
          <span className="bar"></span>Program mall-uri
        </h2>
        <div className="cross-links">
          {MALLS.map((m) => (
            <Link key={m.id} href={`/mall/${m.id}`}>
              Program {m.name} {m.city} →
            </Link>
          ))}
          <Link href="/mall">Vezi toate mall-urile →</Link>
        </div>

        <p className="disclaimer">
          Programul afișat este orientativ și corespunde orarului standard anunțat de fiecare rețea. Unele magazine
          pot avea ore diferite în funcție de locație — verifică întotdeauna programul afișat la intrarea magazinului.
        </p>

        <footer>
          <p>
            <strong>Programul de Azi</strong> îți arată în timp real dacă Lidl, Kaufland, Penny, Mega Image, Carrefour,
            Auchan sau mall-ul sunt deschise chiar acum, plus programul complet pe zile ale săptămânii și programul
            special de sărbători legale.
          </p>
          <p>Ultima actualizare a orarelor: august 2026.</p>
        </footer>
      </main>
    </>
  );
}

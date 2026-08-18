import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MALLS, getMallStatus, generateMallSEO } from "../../lib/malls";
import { DAY_NAMES, pad } from "../../lib/schedule";
import Header from "../../components/Header";
import StatusCard from "../../components/StatusCard";
import SecondaryBadge from "../../components/SecondaryBadge";
import WeekTable from "../../components/WeekTable";
import HolidayList from "../../components/HolidayList";

const SITE_URL = "https://programuldeazi.ro";

export async function getStaticPaths() {
  return {
    paths: MALLS.map((m) => ({ params: { id: m.id } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  return { props: { id: params.id } };
}

export default function MallPage({ id }) {
  const mall = MALLS.find((m) => m.id === id);
  const seo = generateMallSEO(mall);
  const [now, setNow] = useState(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const status = now ? getMallStatus(mall, now) : null;
  const clock = now ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` : null;
  const todayIdx = now ? now.getDay() : new Date().getDay();

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seo.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <>
      <Head>
        <title>{seo.title}</title>
        <meta name="description" content={seo.metaDescription} />
        <link rel="canonical" href={`${SITE_URL}/mall/${mall.id}`} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.metaDescription} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      </Head>

      <Header clock={clock} />

      <main className="wrap">
        <p className="breadcrumb">
          <Link href="/">Acasă</Link> / <Link href="/mall">Mall-uri</Link> / {mall.name} {mall.city}
        </p>

        <h1 className="page-h1">{seo.h1}</h1>

        <StatusCard
          label={`${mall.name} — Zonă shopping`}
          status={status?.shopping}
          badgeText={now ? `${DAY_NAMES[todayIdx]}, ${pad(now.getHours())}:${pad(now.getMinutes())}` : null}
        />
        <SecondaryBadge label={`${mall.hypermarketName} (hipermarket din mall)`} status={status?.hypermarket} />

        <p className="intro-text">{seo.introParagraph}</p>

        <h2 className="section-title">
          <span className="bar"></span>Orar magazine mall — {mall.name}
        </h2>
        <WeekTable weekly={mall.zones.shopping.weekly} dayNames={DAY_NAMES} todayIdx={todayIdx} />

        <h2 className="section-title">
          <span className="bar"></span>Program {mall.hypermarketName} (hipermarket)
        </h2>
        <WeekTable weekly={mall.zones.hypermarket.weekly} dayNames={DAY_NAMES} todayIdx={todayIdx} />

        <h2 className="section-title">
          <span className="bar"></span>Program de sărbători
        </h2>
        <HolidayList holidays={mall.zones.shopping.holidays} />

        <h2 className="section-title">
          <span className="bar"></span>Întrebări frecvente
        </h2>
        <div className="faq-card">
          {seo.faq.map((f, i) => (
            <details className="faq-item" key={i}>
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </div>

        <footer>
          <p>Programul afișat este orientativ. Verifică programul afișat la intrarea mall-ului pentru confirmare.</p>
        </footer>
      </main>
    </>
  );
}

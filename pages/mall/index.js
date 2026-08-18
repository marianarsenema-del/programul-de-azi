import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import { MALLS } from "../../lib/malls";

export default function MallList() {
  return (
    <>
      <Head>
        <title>Program Mall-uri România — Toate mall-urile, azi</title>
        <meta
          name="description"
          content="Alege orașul și vezi instant programul mall-ului: zonă shopping și hipermarket, azi și de sărbători."
        />
        <link rel="canonical" href="https://programuldeazi.ro/mall" />
      </Head>
      <Header />
      <main className="wrap">
        <h1 className="page-h1">Program mall-uri</h1>
        <ul className="mall-list">
          {MALLS.map((m) => (
            <li key={m.id}>
              <Link href={`/mall/${m.id}`}>
                {m.name} {m.city}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

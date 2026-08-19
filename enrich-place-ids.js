/**
 * enrich-place-ids.js
 * -----------------------------------------------------------------------
 * Parcurge un tabel MySQL (nume_locatie, oras, tara) și completează
 * coloana place_id folosind Google Places API — Text Search (legacy,
 * încă suportat oficial de Google, cel mai simplu de configurat).
 *
 * SIGUR LA RE-RULARE: interoghează doar rândurile cu place_id NULL, deci
 * dacă scriptul pică la mijloc (eroare de rețea, limită API etc.), îl
 * repornești și continuă exact de unde a rămas — nu plătești de două ori
 * pentru aceleași locații.
 *
 * ATENȚIE LA COST: Text Search NU e gratuit nelimitat — fiecare cerere
 * are un cost, dincolo de creditul lunar gratuit oferit de Google. Pentru
 * o bază "uriașă", verifică prețul curent (console.cloud.google.com →
 * Billing → Pricing) ÎNAINTE să rulezi pe tot tabelul. Testează întâi pe
 * un eșantion mic (vezi LIMIT_TOTAL mai jos).
 * -----------------------------------------------------------------------
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

// ============================================================
// CONFIGURARE — din .env (vezi .env.example) + câteva praguri de siguranță
// ============================================================
const {
  DB_HOST = "localhost",
  DB_PORT = "3306",
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_TABLE = "locatii",
  GOOGLE_PLACES_API_KEY,
} = process.env;

// pauză între cereri (ms) — protejează atât API-ul Google, cât și baza ta
// de date, de un ritm nerealist. 200ms = ~5 cereri/secundă.
const RATE_LIMIT_MS = Number(process.env.RATE_LIMIT_MS || 200);

// câte rânduri se aduc din baza de date per "lot" — evită să încarci
// milioane de rânduri deodată în memorie, la un tabel foarte mare
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 100);

// plafon de siguranță pentru un test rapid — pune un număr mic (ex. 20)
// la primul run, ca să confirmi că totul merge corect înainte să lansezi
// pe tot tabelul. 0 = fără limită (procesează tot).
const LIMIT_TOTAL = Number(process.env.LIMIT_TOTAL || 0);

if (!DB_USER || !DB_PASSWORD || !DB_NAME || !GOOGLE_PLACES_API_KEY) {
  console.error(
    "Lipsesc variabile obligatorii din .env — verifică DB_USER, DB_PASSWORD, DB_NAME, GOOGLE_PLACES_API_KEY."
  );
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Interoghează Google Places — Text Search, combinând nume + oraș + țară
// pentru acuratețe maximă (exact cum ai cerut) — un query mai specific
// reduce dramatic rezultatele greșite sau ambigue.
async function findPlaceId(numeLocatie, oras, tara) {
  const query = `${numeLocatie}, ${oras}, ${tara}`;
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("key", GOOGLE_PLACES_API_KEY);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} de la Google Places API`);
  }
  const data = await res.json();

  if (data.status === "OK" && data.results && data.results.length > 0) {
    return { placeId: data.results[0].place_id, status: "OK" };
  }
  if (data.status === "ZERO_RESULTS") {
    return { placeId: null, status: "ZERO_RESULTS" };
  }
  if (data.status === "OVER_QUERY_LIMIT") {
    // limită depășită — semnalăm distinct, ca bucla principală să aștepte
    // mai mult și să reîncerce, nu doar să sară peste rândul respectiv
    return { placeId: null, status: "OVER_QUERY_LIMIT" };
  }
  // REQUEST_DENIED, INVALID_REQUEST, UNKNOWN_ERROR etc.
  return { placeId: null, status: data.status, errorMessage: data.error_message };
}

async function run() {
  const pool = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  console.log(`Conectat la baza de date "${DB_NAME}", tabelul "${DB_TABLE}".`);

  let totalProcessed = 0;
  let totalFound = 0;
  let totalNotFound = 0;
  let totalErrors = 0;

  // buclă de loturi: cât timp mai există rânduri fără place_id, mai luăm un
  // lot — dacă LIMIT_TOTAL e setat, ne oprim când îl atingem
  while (true) {
    if (LIMIT_TOTAL > 0 && totalProcessed >= LIMIT_TOTAL) {
      console.log(`Atins plafonul de test LIMIT_TOTAL=${LIMIT_TOTAL}. Oprire.`);
      break;
    }

    const currentBatchSize =
      LIMIT_TOTAL > 0 ? Math.min(BATCH_SIZE, LIMIT_TOTAL - totalProcessed) : BATCH_SIZE;

    const [rows] = await pool.execute(
      `SELECT id, nume_locatie, oras, tara FROM \`${DB_TABLE}\`
       WHERE place_id IS NULL
       ORDER BY id ASC
       LIMIT ?`,
      [currentBatchSize]
    );

    if (rows.length === 0) {
      console.log("Nu mai există rânduri fără place_id. Gata.");
      break;
    }

    for (const row of rows) {
      totalProcessed += 1;
      const label = `[${totalProcessed}] ${row.nume_locatie}, ${row.oras}, ${row.tara}`;

      let attempt = 0;
      let result;
      // reîncercăm cu pauză mai mare DOAR pe OVER_QUERY_LIMIT — pe restul
      // erorilor sărim direct, ca să nu blocăm tot scriptul la nesfârșit
      while (true) {
        try {
          result = await findPlaceId(row.nume_locatie, row.oras, row.tara);
        } catch (err) {
          console.error(`${label} -> eroare de rețea: ${err.message}`);
          totalErrors += 1;
          result = null;
          break;
        }

        if (result.status === "OVER_QUERY_LIMIT" && attempt < 5) {
          attempt += 1;
          const backoff = RATE_LIMIT_MS * 10 * attempt;
          console.warn(`${label} -> OVER_QUERY_LIMIT, aștept ${backoff}ms și reîncerc (${attempt}/5)...`);
          await sleep(backoff);
          continue;
        }
        break;
      }

      if (result && result.status === "OK") {
        await pool.execute(`UPDATE \`${DB_TABLE}\` SET place_id = ? WHERE id = ?`, [
          result.placeId,
          row.id,
        ]);
        totalFound += 1;
        console.log(`${label} -> ${result.placeId}`);
      } else if (result && result.status === "ZERO_RESULTS") {
        totalNotFound += 1;
        console.warn(`${label} -> niciun rezultat găsit (ZERO_RESULTS)`);
        // NU marcăm nimic în DB — rândul rămâne cu place_id NULL, deci
        // va fi reîncercat la o rulare viitoare (poate găsești o formulare
        // mai bună a numelui între timp). Dacă preferi să nu-l mai
        // reîncerci niciodată, poți seta aici o valoare gen "NOT_FOUND".
      } else if (result) {
        totalErrors += 1;
        console.error(
          `${label} -> ${result.status}${result.errorMessage ? " — " + result.errorMessage : ""}`
        );
      }

      await sleep(RATE_LIMIT_MS);
    }
  }

  await pool.end();

  console.log("\n=== Rezumat ===");
  console.log(`Procesate: ${totalProcessed}`);
  console.log(`Găsite:    ${totalFound}`);
  console.log(`Negăsite:  ${totalNotFound}`);
  console.log(`Erori:     ${totalErrors}`);
}

run().catch((err) => {
  console.error("Eroare fatală:", err);
  process.exit(1);
});

/**
 * enrich-place-ids.js (versiune PostgreSQL)
 * -----------------------------------------------------------------------
 * Identic ca logică cu varianta MySQL de dinainte — doar driverul de bază
 * de date s-a schimbat (`pg` în loc de `mysql2`) și sintaxa parametrilor
 * (`$1, $2...` în loc de `?`).
 *
 * SIGUR LA RE-RULARE: interoghează doar rândurile cu place_id NULL.
 * ATENȚIE LA COST: vezi README.md pentru detalii despre prețul Google.
 * -----------------------------------------------------------------------
 */

require("dotenv").config();
const { pool } = require("./db");

const {
  DB_TABLE = "locatii",
  GOOGLE_PLACES_API_KEY,
} = process.env;

const RATE_LIMIT_MS = Number(process.env.RATE_LIMIT_MS || 200);
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 100);
const LIMIT_TOTAL = Number(process.env.LIMIT_TOTAL || 0);

if (!GOOGLE_PLACES_API_KEY) {
  console.error("Lipsește GOOGLE_PLACES_API_KEY din .env.");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    return { placeId: null, status: "OVER_QUERY_LIMIT" };
  }
  return { placeId: null, status: data.status, errorMessage: data.error_message };
}

async function run() {
  console.log(`Conectat, tabelul "${DB_TABLE}".`);

  let totalProcessed = 0;
  let totalFound = 0;
  let totalNotFound = 0;
  let totalErrors = 0;

  while (true) {
    if (LIMIT_TOTAL > 0 && totalProcessed >= LIMIT_TOTAL) {
      console.log(`Atins plafonul de test LIMIT_TOTAL=${LIMIT_TOTAL}. Oprire.`);
      break;
    }

    const currentBatchSize =
      LIMIT_TOTAL > 0 ? Math.min(BATCH_SIZE, LIMIT_TOTAL - totalProcessed) : BATCH_SIZE;

    const { rows } = await pool.query(
      `SELECT id, nume_locatie, oras, tara FROM ${DB_TABLE}
       WHERE place_id IS NULL
       ORDER BY id ASC
       LIMIT $1`,
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
        await pool.query(`UPDATE ${DB_TABLE} SET place_id = $1 WHERE id = $2`, [
          result.placeId,
          row.id,
        ]);
        totalFound += 1;
        console.log(`${label} -> ${result.placeId}`);
      } else if (result && result.status === "ZERO_RESULTS") {
        totalNotFound += 1;
        console.warn(`${label} -> niciun rezultat găsit (ZERO_RESULTS)`);
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

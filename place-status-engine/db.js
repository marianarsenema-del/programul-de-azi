/**
 * db.js
 * -----------------------------------------------------------------------
 * Conexiune Postgres comună, pentru toate scripturile din acest folder.
 *
 * Vercel Postgres (și majoritatea furnizorilor cloud — Neon, Supabase,
 * Railway) dau un SINGUR URL de conexiune, nu host/user/parolă separate,
 * și cer SSL obligatoriu. Acceptăm oricare din numele de variabilă
 * folosite de furnizori diferiți, ca să nu depinzi de unul anume.
 * -----------------------------------------------------------------------
 */

const { Pool } = require("pg");

const connectionString =
  process.env.POSTGRES_URL || // Vercel Postgres
  process.env.DATABASE_URL || // convenție comună (Neon, Supabase, Railway...)
  process.env.POSTGRES_PRISMA_URL; // uneori oferit tot de Vercel Postgres

if (!connectionString) {
  console.error(
    "Lipsește variabila de conexiune. Așteptam POSTGRES_URL, DATABASE_URL sau POSTGRES_PRISMA_URL în .env / variabilele de mediu."
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // necesar pentru majoritatea bazelor cloud (Vercel Postgres, Neon etc.)
});

module.exports = { pool };

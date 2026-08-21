/**
 * send-push-notification.js
 * -----------------------------------------------------------------------
 * Trimite o notificare push către TOȚI abonații din baza de date.
 * Rulează manual, de la tine, când vrei — nu automat, nu programat.
 *
 * Folosire:
 *   node send-push-notification.js "Titlu" "Text mesaj" "/opiional-url"
 *
 * Exemplu:
 *   node send-push-notification.js "Program de Paște" "Vezi orele speciale ale magazinelor de Paște" "/"
 * -----------------------------------------------------------------------
 */

require("dotenv").config();
const webpush = require("web-push");
const { pool } = require("./db");

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:contact@programul-de-azi.ro";

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("Lipsesc VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY din .env. Vezi README.md pentru cum le generezi.");
  process.exit(1);
}

const [title, body, url] = process.argv.slice(2);
if (!title || !body) {
  console.error('Folosire: node send-push-notification.js "Titlu" "Text mesaj" "/optional-url"');
  process.exit(1);
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

async function run() {
  const { rows } = await pool.query(`SELECT id, endpoint, p256dh, auth FROM push_subscriptions`);
  console.log(`Trimit către ${rows.length} abonați...`);

  const payload = JSON.stringify({ title, body, url: url || "/" });

  let sent = 0;
  let expired = 0;
  let errors = 0;

  for (const row of rows) {
    const subscription = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };
    try {
      await webpush.sendNotification(subscription, payload);
      await pool.query(`UPDATE push_subscriptions SET last_sent_at = now() WHERE id = $1`, [row.id]);
      sent += 1;
    } catch (err) {
      // 404/410 = browserul a expirat/revocat subscripția — o ștergem din
      // bază, nu mai are rost s-o reîncercăm niciodată
      if (err.statusCode === 404 || err.statusCode === 410) {
        await pool.query(`DELETE FROM push_subscriptions WHERE id = $1`, [row.id]);
        expired += 1;
      } else {
        console.error(`Eroare la abonatul #${row.id}:`, err.message);
        errors += 1;
      }
    }
  }

  await pool.end();

  console.log("\n=== Rezumat ===");
  console.log(`Trimise cu succes: ${sent}`);
  console.log(`Expirate (șterse):  ${expired}`);
  console.log(`Erori:              ${errors}`);
}

run().catch((err) => {
  console.error("Eroare fatală:", err);
  process.exit(1);
});

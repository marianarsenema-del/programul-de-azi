// Aplicația „Gazdă” — notificări push, rezumat de dimineață și mesajul automat de sosire.
// Montat din bookings-gazda.js; funcționează doar în spatele aceluiași gate ca restul rezervărilor.
"use strict";
const crypto = require("crypto");
const core = require("./bookings-core");
const { dbPool, INTL_DOMAIN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = require("./static");
const L = require("./logic");
const pay = require("./bookings-pay");
const forms = require("./bookings-forms");

const E = L.escapeHtml;
const siteBase = () => "https://" + (INTL_DOMAIN || "opening-hours-today.eu");
const dRo = (s) => { const [y, m, d] = String(s).slice(0, 10).split("-"); return `${d}.${m}.${y}`; };
const clean = (s, max) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/g, " ").trim().slice(0, max);

// ---------- trimitere push ----------
let webpush = null;
try { webpush = require("web-push"); } catch (e) { webpush = null; }
let keys = null;
async function getKeys() {
  if (keys) return keys;
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) return (keys = { publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY });
  try {
    const { rows } = await dbPool.query(`SELECT key, value FROM accommodation_settings WHERE key IN ('vapid_public_key', 'vapid_private_key')`);
    const m = {}; rows.forEach((r) => { m[r.key] = r.value; });
    if (m.vapid_public_key && m.vapid_private_key) keys = { publicKey: m.vapid_public_key, privateKey: m.vapid_private_key };
  } catch (e) { /* fără chei: push oprit */ }
  return keys;
}
// înlocuibil în teste
const state = {
  sender: async (sub, payload) => {
    const k = await getKeys();
    if (!webpush || !k) return "disabled";
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload),
        { vapidDetails: { subject: VAPID_SUBJECT || "mailto:contact@opening-hours-today.eu", publicKey: k.publicKey, privateKey: k.privateKey }, TTL: 6 * 3600, timeout: 5000 });
      return "sent";
    } catch (err) {
      if (err && (err.statusCode === 404 || err.statusCode === 410)) return "expired";
      return "error";
    }
  },
};
async function deliver(subs, payload) {
  let sent = 0;
  for (const s of subs) {
    const out = await state.sender(s, payload);
    if (out === "sent") sent++;
    else if (out === "expired") await dbPool.query(`DELETE FROM gazda_push WHERE endpoint = $1`, [s.endpoint]).catch(() => {});
  }
  return sent;
}
// push către dispozitivele gazdei (și ale personalului care are acces la anunț). Nu aruncă niciodată.
async function pushByListing(listingId, payload) {
  try {
    if (!dbPool || !listingId) return 0;
    const subs = (await dbPool.query(
      `SELECT p.endpoint, p.p256dh, p.auth FROM gazda_push p
         JOIN gazda_devices d ON d.id = p.device_id AND d.revoked_at IS NULL
         JOIN accommodation_listings l ON l.owner_id = d.owner_id
        WHERE l.id = $1::integer AND (d.role = 'owner' OR $1::integer = ANY(d.listing_ids)) LIMIT 40`, [listingId])).rows;
    if (!subs.length) return 0;
    return await Promise.race([deliver(subs, Object.assign({ url: "/gazda/" }, payload)), new Promise((res) => setTimeout(() => res(0), 7000))]);
  } catch (e) { console.error("gazda push:", e.message); return 0; }
}

// ---------- cron ----------
const roNow = () => {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", hour12: false }).format(new Date());
  return { hour: Number(p) };
};
async function cron(now) {
  const out = { digests: 0, arrivals: 0, blocked: 0 };
  if (!dbPool) return out;
  const hour = (now && now.hour != null) ? now.hour : roNow().hour;
  // 1) rezumat de dimineață (08:00–10:00), o dată pe zi pe dispozitiv
  if (hour >= 8 && hour < 10) {
    const subs = (await dbPool.query(
      `SELECT p.id, p.endpoint, p.p256dh, p.auth, p.owner_id, d.role, d.listing_ids
         FROM gazda_push p JOIN gazda_devices d ON d.id = p.device_id AND d.revoked_at IS NULL
        WHERE p.last_digest_on IS DISTINCT FROM (now() AT TIME ZONE 'Europe/Bucharest')::date LIMIT 100`)).rows;
    const cache = new Map();
    for (const s of subs) {
      const ck = s.owner_id + ":" + (s.role === "staff" ? (s.listing_ids || []).join(",") : "*");
      let sum = cache.get(ck);
      if (!sum) {
        const q = (await dbPool.query(
          `SELECT COUNT(*) FILTER (WHERE r.check_in = t.d)::int AS arr, COUNT(*) FILTER (WHERE r.check_out = t.d)::int AS dep,
                  COUNT(*) FILTER (WHERE r.check_in > t.d AND r.check_in <= t.d + 2 AND (SELECT COUNT(*) FROM booking_guests g WHERE g.reservation_id = r.id) < r.guests)::int AS forms
             FROM booking_reservations r JOIN accommodation_listings l ON l.id = r.listing_id,
                  (SELECT (now() AT TIME ZONE 'Europe/Bucharest')::date AS d) t
            WHERE l.owner_id = $1::integer AND r.status = 'confirmed' AND ($2::integer[] IS NULL OR r.listing_id = ANY($2::integer[]))`,
          [s.owner_id, s.role === "staff" ? (s.listing_ids || []) : null])).rows[0] || {};
        sum = { arr: q.arr || 0, dep: q.dep || 0, forms: q.forms || 0 };
        cache.set(ck, sum);
      }
      await dbPool.query(`UPDATE gazda_push SET last_digest_on = (now() AT TIME ZONE 'Europe/Bucharest')::date WHERE id = $1::bigint`, [s.id]);
      if (!sum.arr && !sum.dep && !sum.forms) continue;
      const parts = [];
      if (sum.arr) parts.push(sum.arr === 1 ? "o sosire" : sum.arr + " sosiri");
      if (sum.dep) parts.push(sum.dep === 1 ? "o plecare" : sum.dep + " plecări");
      const body = (parts.length ? "Azi: " + parts.join(", ") + "." : "") + (sum.forms ? (parts.length ? " " : "") + sum.forms + " rezervări apropiate cu fișe incomplete." : "");
      out.digests += await deliver([s], { title: "Bună dimineața, gazdă", body, tag: "gz-digest" });
    }
  }
  // 2) mesaj automat de sosire (09:00–20:59)
  if (hour >= 9 && hour < 21) {
    const rows = (await dbPool.query(
      `SELECT r.id, r.listing_id, r.guests, r.guest_email, r.guest_name, r.access_hash, r.pay_scheme, r.pay_status, r.arrival_blocked_at,
              to_char(r.check_in,'YYYY-MM-DD') AS ci, to_char(r.check_out,'YYYY-MM-DD') AS co, l.name AS listing_name,
              s.arrival_msg, s.access_info, (SELECT COUNT(*) FROM booking_guests g WHERE g.reservation_id = r.id)::int AS nforms
         FROM booking_reservations r JOIN accommodation_listings l ON l.id = r.listing_id
         JOIN booking_settings s ON s.listing_id = r.listing_id AND s.arrival_auto AND s.bookings_enabled
        WHERE r.status = 'confirmed' AND r.arrival_sent_at IS NULL
          AND r.check_in >= (now() AT TIME ZONE 'Europe/Bucharest')::date AND r.check_in - s.arrival_days <= (now() AT TIME ZONE 'Europe/Bucharest')::date
        ORDER BY r.check_in LIMIT 40`)).rows;
    for (const row of rows) {
      const why = blockedReason(row);
      if (!why) {
        if (await sendArrival(row)) out.arrivals++;
      } else if (!row.arrival_blocked_at) {
        const up = await dbPool.query(`UPDATE booking_reservations SET arrival_blocked_at = now() WHERE id = $1 AND arrival_blocked_at IS NULL RETURNING id`, [row.id]);
        if (up.rowCount) {
          out.blocked++;
          await pushByListing(row.listing_id, { title: "Informațiile de acces nu au fost trimise", body: row.guest_name + " (" + dRo(row.ci) + "): " + why + " Poți trimite manual din Rezervări.", tag: "gz-blocked-" + row.id });
        }
      }
    }
  }
  return out;
}
// condițiile ca oaspetele să primească informațiile de acces
function blockedReason(row) {
  // fișa de cazare NU blochează mesajul: oaspetele o poate completa și la sosire (mesajul conține linkul către ea)
  if (row.pay_scheme && row.pay_scheme !== "direct" && row.pay_status !== "paid") return "plata nu este încheiată.";
  return null;
}
async function sendArrival(row) {
  const up = await dbPool.query(`UPDATE booking_reservations SET arrival_sent_at = now() WHERE id = $1 AND arrival_sent_at IS NULL RETURNING id`, [row.id]);
  if (!up.rowCount) return false;
  const tok = forms.tokenOf(row.id);
  const link = core.sha256(tok) === row.access_hash ? `<p><a href="${siteBase()}/cazare/rezervare/${tok}">Vezi rezervarea ta</a></p>` : "";
  const msg = E(row.arrival_msg || "").replace(/\n/g, "<br>");
  const acc = row.access_info ? `<div style="background:#F5F2EC;border-radius:8px;padding:10px 12px;margin:10px 0"><b>Acces / instrucțiuni:</b><br>${E(row.access_info).replace(/\n/g, "<br>")}</div>` : "";
  const ok = await pay.sendMail(row.guest_email, "Informații pentru sosire · " + row.listing_name,
    `<p>Bună, ${E(row.guest_name)},</p><p>Te așteptăm la <b>${E(row.listing_name)}</b> pe ${dRo(row.ci)}.</p>${msg ? `<p>${msg}</p>` : ""}${acc}${link}<p style="color:#5B6770;font-size:12px">Mesaj trimis automat în numele gazdei.</p>`);
  if (!ok) { await dbPool.query(`UPDATE booking_reservations SET arrival_sent_at = NULL WHERE id = $1`, [row.id]).catch(() => {}); return false; }
  await pushByListing(row.listing_id, { title: "Mesaj de sosire trimis", body: row.guest_name + " a primit informațiile de acces.", tag: "gz-arr-" + row.id });
  return true;
}

// ---------- rute ----------
function mount(r, c) {
  const { jsonOnly, noStore, gzAuth, ownerRole, fresh, toId, logEv } = c;

  r.get("/api/gazda/push/cheie", gzAuth, async (req, res) => {
    const k = await getKeys();
    if (!k) return res.status(503).json({ error: "notificari_indisponibile" });
    noStore(res); res.json({ key: k.publicKey });
  });
  r.post("/api/gazda/push/aboneaza", jsonOnly, gzAuth, async (req, res) => {
    try {
      const b = req.body || {};
      const k = b.keys || {};
      let u;
      try { u = new URL(String(b.endpoint)); } catch (e) { return res.status(400).json({ error: "date_invalide" }); }
      if (u.protocol !== "https:" || String(b.endpoint).length > 600 || typeof k.p256dh !== "string" || typeof k.auth !== "string" || k.p256dh.length > 200 || k.auth.length > 100) return res.status(400).json({ error: "date_invalide" });
      await dbPool.query(
        `INSERT INTO gazda_push (device_id, owner_id, endpoint, p256dh, auth) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (endpoint) DO UPDATE SET device_id = EXCLUDED.device_id, owner_id = EXCLUDED.owner_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
        [req.gz.did, req.gz.ownerId, String(b.endpoint), k.p256dh, k.auth]);
      noStore(res); res.json({ ok: true });
    } catch (e) { console.error("gazda push sub:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.post("/api/gazda/push/dezaboneaza", jsonOnly, gzAuth, async (req, res) => {
    try {
      await dbPool.query(`DELETE FROM gazda_push WHERE endpoint = $1 AND owner_id = $2::integer`, [String((req.body || {}).endpoint || ""), req.gz.ownerId]);
      noStore(res); res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: "eroare" }); }
  });

  // setări mesaj de sosire (doar gazda)
  const ownL = async (req) => {
    const lid = toId(req.query.listing || (req.body || {}).listing);
    if (!lid) return null;
    const x = (await dbPool.query(`SELECT 1 FROM accommodation_listings l JOIN booking_settings s ON s.listing_id = l.id WHERE l.id = $1::integer AND l.owner_id = $2::integer AND s.bookings_enabled`, [lid, req.gz.ownerId])).rows[0];
    return x ? lid : null;
  };
  r.get("/api/gazda/sosire/setari", gzAuth, ownerRole, async (req, res) => {
    try {
      const lid = await ownL(req);
      if (!lid) return res.status(404).json({ error: "negasit" });
      const s = (await dbPool.query(`SELECT arrival_auto, arrival_days, arrival_msg, access_info FROM booking_settings WHERE listing_id = $1`, [lid])).rows[0] || {};
      noStore(res); res.json({ auto: !!s.arrival_auto, days: s.arrival_days || 1, message: s.arrival_msg || "", access: s.access_info || "", forms_on: forms.ENABLED });
    } catch (e) { res.status(500).json({ error: "eroare" }); }
  });
  r.post("/api/gazda/sosire/setari", jsonOnly, gzAuth, ownerRole, fresh, async (req, res) => {
    try {
      const lid = await ownL(req);
      if (!lid) return res.status(404).json({ error: "negasit" });
      const b = req.body || {};
      const days = [1, 2].includes(Number(b.days)) ? Number(b.days) : 1;
      await dbPool.query(`UPDATE booking_settings SET arrival_auto = $2, arrival_days = $3, arrival_msg = $4, access_info = $5 WHERE listing_id = $1`,
        [lid, b.auto === true, days, clean(b.message, 1000) || null, clean(b.access, 300) || null]);
      await logEv(req.gz.ownerId, req.gz.did, "arrival_cfg", lid);
      noStore(res); res.json({ ok: true });
    } catch (e) { console.error("gazda sosire setari:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  // trimitere manuală (gazda decide, chiar dacă fișa/plata nu sunt complete)
  r.post("/api/gazda/sosire/:rid/trimite", jsonOnly, gzAuth, ownerRole, fresh, async (req, res) => {
    try {
      const lid = await ownL(req);
      const rid = toId(req.params.rid);
      if (!lid || !rid) return res.status(404).json({ error: "negasit" });
      const row = (await dbPool.query(
        `SELECT r.id, r.listing_id, r.guests, r.guest_email, r.guest_name, r.access_hash, r.pay_scheme, r.pay_status,
                to_char(r.check_in,'YYYY-MM-DD') AS ci, l.name AS listing_name, s.arrival_msg, s.access_info
           FROM booking_reservations r JOIN accommodation_listings l ON l.id = r.listing_id JOIN booking_settings s ON s.listing_id = r.listing_id
          WHERE r.id = $1 AND r.listing_id = $2::integer AND r.status = 'confirmed' AND r.check_out >= (now() AT TIME ZONE 'Europe/Bucharest')::date`, [rid, lid])).rows[0];
      if (!row) return res.status(404).json({ error: "negasit" });
      if (!row.arrival_msg && !row.access_info) return res.status(409).json({ error: "mesaj_gol" });
      if (!(await sendArrival(row))) return res.status(409).json({ error: "deja_trimis" });
      await logEv(req.gz.ownerId, req.gz.did, "arrival_manual", lid);
      noStore(res); res.json({ ok: true });
    } catch (e) { console.error("gazda sosire trimite:", e.message); res.status(500).json({ error: "eroare" }); }
  });
}

module.exports = { mount, cron, pushByListing, state, blockedReason, sendArrival };

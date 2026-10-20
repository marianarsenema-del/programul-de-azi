// Inbox pentru e-mailurile primite la contact@ (și orice altă adresă de pe domeniu, în afară de abuse@, care merge în coada DSA).
// Sursa: Resend Inbound → webhook /api/dsa/email-primit (vezi dsa.js, care ne dă mesajul deja citit). Tabelul se creează singur.
"use strict";
const S = require("./static");
const L = require("./logic");

const dbPool = S.dbPool;
const E = L.escapeHtml;
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/\r\n?/g, "\n").trim().slice(0, max);
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
const CONTACT_ADDR = process.env.INBOX_CONTACT_EMAIL || "contact@opening-hours-today.eu";
const siteBase = () => "https://" + (S.INTL_DOMAIN || "opening-hours-today.eu");

let ensured = false;
async function ensureTable() {
  if (ensured || !dbPool) return;
  await dbPool.query(`CREATE TABLE IF NOT EXISTS inbox_messages (
    id SERIAL PRIMARY KEY, email_id VARCHAR(80) UNIQUE, to_addr VARCHAR(200), from_addr VARCHAR(200), from_name VARCHAR(120),
    subject VARCHAR(300), body TEXT NOT NULL DEFAULT '', status VARCHAR(10) NOT NULL DEFAULT 'nou',
    reply_text TEXT, replied_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await dbPool.query(`CREATE INDEX IF NOT EXISTS idx_inbox_messages_status ON inbox_messages (status, created_at DESC)`);
  ensured = true;
}

async function sendMail(to, subject, html, replyTo) {
  to = [].concat(to || []).filter(Boolean);
  if (!S.RESEND_API_KEY || !to.length) return false;
  const send = async (from) => {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(10000), headers: { Authorization: "Bearer " + S.RESEND_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ from, to, reply_to: replyTo || CONTACT_ADDR, subject, html }) });
    return r.ok;
  };
  try {
    if (await send("Opening Hours Today <" + CONTACT_ADDR + ">")) return true;
    return await send(process.env.BOOKINGS_MAIL_FROM || "Opening Hours Today <cazare@opening-hours-today.eu>");
  } catch (e) { return false; }
}
async function adminEmails() {
  const set = new Set();
  if (process.env.DSA_NOTIFY_EMAIL) process.env.DSA_NOTIFY_EMAIL.split(",").forEach((x) => x.trim() && set.add(x.trim().toLowerCase()));
  try { (await dbPool.query(`SELECT email FROM admin_users`)).rows.forEach((x) => x.email && set.add(String(x.email).toLowerCase())); } catch (e) { /* tabel absent */ }
  return Array.from(set);
}

// apelat din dsa.inbound pentru mesajele care NU sunt pentru abuse@
async function ingest(m) {
  await ensureTable();
  const ins = await dbPool.query(
    `INSERT INTO inbox_messages (email_id, to_addr, from_addr, from_name, subject, body) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email_id) DO NOTHING RETURNING *`,
    [m.emailId, clean(m.to, 200), clean(m.fromAddr, 200), clean(m.fromName, 120) || null, clean(m.subject, 300) || "(fără subiect)", clean(m.body, 20000)]);
  if (!ins.rows.length) return { duplicate: true };
  const n = ins.rows[0];
  const to = await adminEmails();
  if (to.length) {
    sendMail(to, "✉️ Mesaj nou la " + (n.to_addr || CONTACT_ADDR) + ": " + n.subject,
      `<p><strong>Mesaj nou primit</strong> la ${E(n.to_addr || "")}.</p><p><strong>De la:</strong> ${E(n.from_name || "")} ${E(n.from_addr || "")}<br><strong>Subiect:</strong> ${E(n.subject)}</p><p style="white-space:pre-wrap">${E(n.body.slice(0, 1200))}</p><p><a href="${siteBase()}/admin/inbox">Deschide în dashboard-ul admin</a></p>`,
      n.from_addr).catch(() => {});
  }
  return { id: n.id };
}

async function pendingCount() {
  if (!dbPool) return 0;
  try { await ensureTable(); return (await dbPool.query(`SELECT COUNT(*)::int AS n FROM inbox_messages WHERE status = 'nou'`)).rows[0].n; } catch (e) { return 0; }
}

function mountAdmin(app, deps) {
  const fmt = (v) => (v ? E(new Date(v).toLocaleDateString("ro-RO") + " " + new Date(v).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })) : "—");
  app.get("/admin/inbox", async (req, res) => {
    if (!deps.requireAdminPage(req, res)) return;
    if (!dbPool) { res.status(503).send("Baza de date nu e configurată."); return; }
    await ensureTable();
    const tab = req.query.tab === "arhivate" ? "arhivat" : "active";
    const where = tab === "arhivat" ? `status = 'arhivat'` : `status IN ('nou','citit')`;
    const rows = (await dbPool.query(`SELECT * FROM inbox_messages WHERE ${where} ORDER BY created_at DESC LIMIT 300`)).rows;
    const cnt = (await dbPool.query(`SELECT COUNT(*) FILTER (WHERE status IN ('nou','citit'))::int AS a, COUNT(*) FILTER (WHERE status = 'arhivat')::int AS z, COUNT(*) FILTER (WHERE status = 'nou')::int AS n FROM inbox_messages`)).rows[0];
    const counts = await deps.getAdminCounts();
    const cards = rows.map((m) => `<div class="admin-submission-card ibx" data-id="${m.id}">
      <div class="admin-submission-header"><span class="admin-submission-type">${m.status === "nou" ? "🆕 " : ""}✉️ ${E(m.to_addr || "")}</span><span class="admin-submission-meta">${fmt(m.created_at)}</span></div>
      <div class="admin-submission-name">${E(m.subject)}</div>
      <div class="admin-submission-meta">De la: <strong>${E(m.from_name || "")} ${E(m.from_addr || "—")}</strong></div>
      <div class="admin-submission-meta" style="white-space:pre-wrap;margin-top:8px;max-height:300px;overflow:auto">${E(m.body)}</div>
      ${m.replied_at ? `<div class="admin-submission-meta" style="margin-top:8px;border-left:3px solid var(--accent,#F0813A);padding-left:10px">Răspuns trimis ${fmt(m.replied_at)}:<br><span style="white-space:pre-wrap">${E(m.reply_text || "")}</span></div>` : ""}
      <div style="margin-top:10px">
        <textarea class="ibx-reply" rows="3" maxlength="5000" placeholder="Scrie răspunsul (se trimite de pe ${E(CONTACT_ADDR)} către ${E(m.from_addr || "expeditor")})" style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px"></textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <button type="button" class="admin-approve-btn ibx-send">Trimite răspuns</button>
          ${m.status === "arhivat" ? `<button type="button" class="admin-reject-btn ibx-act" data-act="citit">Mută înapoi</button>` : `<button type="button" class="admin-reject-btn ibx-act" data-act="arhivat">Arhivează</button>`}
          ${m.status === "nou" ? `<button type="button" class="admin-reject-btn ibx-act" data-act="citit">Marchează citit</button>` : ""}
        </div></div></div>`).join("") || "<p>Niciun mesaj.</p>";
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Inbox — Admin</title>
<style>${deps.adminShellStyles()}</style></head><body><div class="admin-shell">
${deps.adminSidebarHtml("inbox", counts)}
<div style="flex:1">${deps.adminMobileBarHtml()}<div class="admin-main">
<h1 class="admin-h1">✉️ Inbox (${E(CONTACT_ADDR)})</h1>
<p class="admin-submission-meta" style="margin-bottom:10px">Mesajele trimise la ${E(CONTACT_ADDR)} și la orice altă adresă de pe domeniu, în afară de abuse@ (acelea sunt la „Abuz / DSA”). Răspunsurile pleacă de pe ${E(CONTACT_ADDR)}.</p>
<div style="display:flex;gap:8px;margin:10px 0 16px"><a class="admin-nav-item${tab === "active" ? " is-active" : ""}" href="/admin/inbox" style="width:auto">Active (${cnt.a}${cnt.n ? ", " + cnt.n + " noi" : ""})</a><a class="admin-nav-item${tab === "arhivat" ? " is-active" : ""}" href="/admin/inbox?tab=arhivate" style="width:auto">Arhivate (${cnt.z})</a></div>
${cards}
</div></div></div>
<script>(function(){${deps.adminSidebarScript()}
function call(id,body,btn){btn.disabled=true;fetch("/api/admin/inbox/"+id,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(d){if(d&&d.ok){location.reload();}else{alert((d&&d.error)||"Eroare");btn.disabled=false;}}).catch(function(){alert("Eroare de rețea");btn.disabled=false;});}
document.querySelectorAll(".ibx-send").forEach(function(b){b.addEventListener("click",function(){var c=b.closest(".ibx");var t=c.querySelector(".ibx-reply").value.trim();if(t.length<2){alert("Scrie răspunsul.");return;}call(c.getAttribute("data-id"),{action:"raspunde",text:t},b);});});
document.querySelectorAll(".ibx-act").forEach(function(b){b.addEventListener("click",function(){var c=b.closest(".ibx");call(c.getAttribute("data-id"),{action:b.getAttribute("data-act")},b);});});
})();</script></body></html>`);
  });

  app.post("/api/admin/inbox/:id", async (req, res) => {
    if (!deps.requireAdminApi(req, res)) return;
    try {
      const id = /^\d{1,9}$/.test(req.params.id) ? Number(req.params.id) : 0;
      const b = req.body || {};
      if (!id || !dbPool) return res.status(400).json({ error: "date_invalide" });
      await ensureTable();
      if (b.action === "citit" || b.action === "arhivat") {
        const u = await dbPool.query(`UPDATE inbox_messages SET status = $1 WHERE id = $2 RETURNING id`, [b.action, id]);
        return u.rows.length ? res.json({ ok: true }) : res.status(404).json({ error: "negasit" });
      }
      if (b.action === "raspunde") {
        const text = clean(b.text, 5000);
        const q = await dbPool.query(`SELECT * FROM inbox_messages WHERE id = $1`, [id]);
        if (!q.rows.length) return res.status(404).json({ error: "negasit" });
        const m = q.rows[0];
        if (text.length < 2 || !EMAIL_RE.test(m.from_addr || "")) return res.status(400).json({ error: "date_invalide" });
        const subj = /^re:/i.test(m.subject) ? m.subject : "Re: " + m.subject;
        const quoted = E(m.body.slice(0, 1500)).replace(/\n/g, "<br>");
        const ok = await sendMail(m.from_addr, subj, `<div style="white-space:pre-wrap">${E(text)}</div><hr style="margin:18px 0;border:0;border-top:1px solid #ddd"><div style="color:#666;font-size:13px">${fmtDate(m.created_at)}, ${E(m.from_name || m.from_addr)}:<br>${quoted}</div>`, CONTACT_ADDR);
        if (!ok) return res.status(502).json({ error: "Trimiterea a eșuat — verifică RESEND_API_KEY / domeniul expeditorului." });
        await dbPool.query(`UPDATE inbox_messages SET reply_text = $1, replied_at = now(), status = CASE WHEN status = 'nou' THEN 'citit' ELSE status END WHERE id = $2`, [text, id]);
        return res.json({ ok: true });
      }
      res.status(400).json({ error: "actiune_necunoscuta" });
    } catch (e) { console.error("admin/inbox:", e.message); res.status(500).json({ error: "server_error" }); }
  });
}
const fmtDate = (v) => E(new Date(v).toLocaleDateString("ro-RO") + " " + new Date(v).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }));

module.exports = { ingest, mountAdmin, pendingCount, CONTACT_ADDR };

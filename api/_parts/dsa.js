// Notificări de abuz / conținut ilegal (Regulamentul UE 2022/2065 – DSA, art. 16): pagina publică, formularul (modal în subsol),
// coada din admin și primirea e-mailurilor trimise la abuse@ (Resend Inbound → webhook semnat).
// Tabelul se creează singur (CREATE TABLE IF NOT EXISTS) — nu e nevoie de SQL.
"use strict";
const crypto = require("crypto");
const S = require("./static");
const L = require("./logic");

const dbPool = S.dbPool;
const E = L.escapeHtml;
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/\r\n?/g, "\n").trim().slice(0, max);
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
const ABUSE_ADDR = process.env.DSA_ABUSE_EMAIL || "abuse@opening-hours-today.eu";
// adresa NU apare în clar în HTML: o punem codificată Base64 și o decodează scriptul din browser (/dsa-report.js); fără JS se vede „abuse [at] …”
const b64 = (x) => Buffer.from(String(x), "utf8").toString("base64");
const obf = (addr) => `<a data-oe="${b64(addr)}" href="#" style="color:var(--accent);font-weight:700">${E(String(addr).replace("@", " [at] ").replace(/\./g, " [dot] "))}</a>`;
const siteBase = () => "https://" + (S.INTL_DOMAIN || "opening-hours-today.eu");
const STATUSES = ["nou", "in_analiza", "suspendat", "confirmat", "respins"];
const STATUS_RO = { nou: "Nou", in_analiza: "În analiză", suspendat: "Pagină suspendată", confirmat: "Confirmat (conținut eliminat)", respins: "Respins" };
const STATUS_EN = { confirmat: "Your notice was confirmed and the content was removed.", respins: "After review, no violation was found." };
const CATS = {
  ro: { fals: "Cazare / anunț fals sau inexistent", foto: "Fotografii folosite fără drept de autor", inselator: "Informații înșelătoare", ilegal: "Alt conținut ilegal", altul: "Altceva" },
  en: { fals: "Fake or non-existent listing", foto: "Photos used without copyright permission", inselator: "Misleading information", ilegal: "Other illegal content", altul: "Something else" },
};

let ensured = false;
async function ensureTable() {
  if (ensured || !dbPool) return;
  await dbPool.query(`CREATE TABLE IF NOT EXISTS dsa_notices (
    id SERIAL PRIMARY KEY, source VARCHAR(8) NOT NULL DEFAULT 'form', url TEXT, category VARCHAR(16), description TEXT NOT NULL DEFAULT '',
    reporter_name VARCHAR(120), reporter_email VARCHAR(200), subject VARCHAR(300), email_id VARCHAR(80) UNIQUE,
    status VARCHAR(12) NOT NULL DEFAULT 'nou', decision_note TEXT, lang VARCHAR(2) NOT NULL DEFAULT 'ro', ip_hash VARCHAR(64),
    ack_at TIMESTAMPTZ, decided_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await dbPool.query(`CREATE INDEX IF NOT EXISTS idx_dsa_notices_status ON dsa_notices (status, created_at DESC)`);
  ensured = true;
}
const refOf = (n) => "DSA-" + new Date(n.created_at || Date.now()).getFullYear() + "-" + String(n.id).padStart(5, "0");

async function sendMail(to, subject, html, opts) {
  to = [].concat(to || []).filter(Boolean);
  if (!S.RESEND_API_KEY || !to.length) return false;
  const body = { from: "Opening Hours Today – Abuse <" + ABUSE_ADDR + ">", to, reply_to: ABUSE_ADDR, subject, html };
  if (opts && opts.headers) body.headers = opts.headers;
  try {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(10000), headers: { Authorization: "Bearer " + S.RESEND_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) return true;
    console.error("dsa sendMail:", r.status);
    // domeniul abuse@ poate să nu fie încă verificat în Resend: încercăm expeditorul obișnuit al site-ului
    const body2 = Object.assign({}, body, { from: process.env.BOOKINGS_MAIL_FROM || "Opening Hours Today <cazare@opening-hours-today.eu>" });
    const r2 = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(10000), headers: { Authorization: "Bearer " + S.RESEND_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body2) });
    return r2.ok;
  } catch (e) { return false; }
}
async function adminEmails() {
  const set = new Set();
  if (process.env.DSA_NOTIFY_EMAIL) process.env.DSA_NOTIFY_EMAIL.split(",").forEach((x) => x.trim() && set.add(x.trim().toLowerCase()));
  try { (await dbPool.query(`SELECT email FROM admin_users`)).rows.forEach((x) => x.email && set.add(String(x.email).toLowerCase())); } catch (e) { /* tabel absent */ }
  return Array.from(set);
}
const shortText = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n) + "…" : s; };

async function notifyAdmins(n) {
  const to = await adminEmails();
  if (!to.length) return false;
  const html = `<p><strong>Notificare nouă de abuz / conținut ilegal</strong> (${E(refOf(n))}) — ${n.source === "email" ? "primită pe e-mail" : "trimisă prin formular"}.</p>
<p><strong>URL:</strong> ${E(n.url || "—")}<br><strong>De la:</strong> ${E(n.reporter_name || "")} ${E(n.reporter_email || "—")}<br><strong>Subiect:</strong> ${E(n.subject || n.category || "—")}</p>
<p style="white-space:pre-wrap">${E(shortText(n.description, 1500))}</p>
<p>Termen de analiză: <strong>72 de ore</strong>. <a href="${siteBase()}/admin/abuz">Deschide în dashboard-ul admin</a></p>`;
  return sendMail(to, "⚠️ " + refOf(n) + " — notificare abuz / conținut ilegal", html);
}
async function ackReporter(n) {
  if (!n.reporter_email || !EMAIL_RE.test(n.reporter_email)) return false;
  if (/no-?reply|mailer-daemon|postmaster|do-?not-?reply/i.test(n.reporter_email)) return false;
  const en = n.lang === "en";
  const html = en
    ? `<p>Hello,</p><p>We confirm we received your notice (<strong>${E(refOf(n))}</strong>) about illegal content. Our team will review it within 72 hours and we will write to you with the decision.</p><p>Reported page: ${E(n.url || "—")}</p><p>Opening Hours Today</p>`
    : `<p>Bună ziua,</p><p>Confirmăm că am primit notificarea dumneavoastră (<strong>${E(refOf(n))}</strong>) privind conținut ilegal. Echipa noastră o va analiza în maximum 72 de ore, iar decizia vă va fi comunicată pe acest e-mail.</p><p>Pagina raportată: ${E(n.url || "—")}</p><p>Opening Hours Today</p>`;
  const ok = await sendMail(n.reporter_email, (en ? "We received your notice " : "Am primit notificarea dumneavoastră ") + refOf(n), html, { headers: { "Auto-Submitted": "auto-replied" } });
  if (ok) await dbPool.query(`UPDATE dsa_notices SET ack_at = now() WHERE id = $1`, [n.id]).catch(() => {});
  return ok;
}

// ---------- scriptul client (modal) — servit ca fișier extern, ca să respecte CSP ----------
const CLIENT_JS = `(function(){
var AB=atob("${b64(ABUSE_ADDR)}");
var EN=(document.documentElement.lang||"ro").slice(0,2)==="en";
var T=EN?{title:"Report a problem / illegal content",url:"Page address (URL)",cat:"What is the problem?",desc:"Describe the problem",descPh:"Explain clearly why you consider this content illegal or wrong.",name:"Your name (optional)",email:"Your e-mail (optional, needed for a reply)",good:"I confirm that, in good faith, the information in this notice is accurate and complete.",send:"Send notice",cancel:"Close",ok:"Thank you. Your notice was sent and will be reviewed within 72 hours.",err:"Could not send. Please try again or write to "+AB+".",short:"Please describe the problem in at least 20 characters.",consent:"Please confirm the good-faith statement.",cats:["Fake or non-existent listing","Photos used without copyright permission","Misleading information","Other illegal content","Something else"]}
:{title:"Raportează o problemă / Conținut ilegal",url:"Adresa paginii (URL)",cat:"Care este problema?",desc:"Descrieți problema",descPh:"Explicați clar de ce considerați că acest conținut este ilegal sau greșit.",name:"Numele dvs. (opțional)",email:"E-mailul dvs. (opțional, necesar pentru răspuns)",good:"Confirm că, cu bună-credință, informațiile din această notificare sunt exacte și complete.",send:"Trimite notificarea",cancel:"Închide",ok:"Mulțumim. Notificarea a fost trimisă și va fi analizată în maximum 72 de ore.",err:"Nu s-a putut trimite. Încercați din nou sau scrieți la "+AB+".",short:"Descrieți problema în cel puțin 20 de caractere.",consent:"Bifați declarația de bună-credință.",cats:["Cazare / anunț fals sau inexistent","Fotografii folosite fără drept de autor","Informații înșelătoare","Alt conținut ilegal","Altceva"]};
var KEYS=["fals","foto","inselator","ilegal","altul"];
function el(t,a,h){var e=document.createElement(t);for(var k in (a||{}))e.setAttribute(k,a[k]);if(h!=null)e.innerHTML=h;return e;}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
var box=null;
function close(){if(box){box.remove();box=null;document.documentElement.style.overflow="";}}
function open(url){
 if(box)return;
 var inp="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #cfd3da;border-radius:10px;font:inherit;font-size:15px;background:#fff;color:#1C1E24";
 var lab="display:block;font-weight:700;font-size:13.5px;margin:12px 0 5px";
 box=el("div",{role:"dialog","aria-modal":"true","aria-label":T.title,style:"position:fixed;inset:0;z-index:99999;background:rgba(15,18,28,.62);display:flex;align-items:center;justify-content:center;padding:14px;overflow:auto"});
 var opts=T.cats.map(function(c,i){return '<option value="'+KEYS[i]+'">'+esc(c)+'</option>';}).join("");
 box.innerHTML='<form id="dsaF" style="background:#fff;color:#1C1E24;max-width:520px;width:100%;border-radius:16px;padding:22px 22px 18px;box-shadow:0 20px 60px rgba(0,0,0,.35);font-family:inherit;max-height:96vh;overflow:auto">'
 +'<div style="font-weight:900;font-size:19px">🚩 '+esc(T.title)+'</div>'
 +'<label style="'+lab+'">'+esc(T.url)+'</label><input id="dsaU" type="url" required maxlength="500" style="'+inp+'">'
 +'<label style="'+lab+'">'+esc(T.cat)+'</label><select id="dsaC" style="'+inp+'">'+opts+'</select>'
 +'<label style="'+lab+'">'+esc(T.desc)+'</label><textarea id="dsaD" rows="5" required maxlength="3000" placeholder="'+esc(T.descPh)+'" style="'+inp+'"></textarea>'
 +'<label style="'+lab+'">'+esc(T.name)+'</label><input id="dsaN" type="text" maxlength="120" autocomplete="name" style="'+inp+'">'
 +'<label style="'+lab+'">'+esc(T.email)+'</label><input id="dsaE" type="email" maxlength="200" autocomplete="email" style="'+inp+'">'
 +'<input id="dsaW" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0">'
 +'<label style="display:flex;gap:9px;align-items:flex-start;margin-top:14px;font-size:13.5px;line-height:1.45"><input id="dsaG" type="checkbox" style="margin-top:3px"><span>'+esc(T.good)+'</span></label>'
 +'<div id="dsaM" style="margin-top:10px;font-size:14px;font-weight:700;min-height:18px"></div>'
 +'<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap"><button type="button" id="dsaX" style="padding:11px 18px;border-radius:10px;border:1px solid #cfd3da;background:#fff;font:inherit;font-weight:700;cursor:pointer">'+esc(T.cancel)+'</button><button type="submit" id="dsaS" style="padding:11px 20px;border-radius:10px;border:0;background:#F0813A;color:#fff;font:inherit;font-weight:800;cursor:pointer">'+esc(T.send)+'</button></div></form>';
 document.body.appendChild(box);document.documentElement.style.overflow="hidden";
 var f=box.querySelector("#dsaF"),m=box.querySelector("#dsaM");
 box.querySelector("#dsaU").value=url||location.href;
 box.addEventListener("click",function(e){if(e.target===box)close();});
 box.querySelector("#dsaX").addEventListener("click",close);
 f.addEventListener("submit",function(e){e.preventDefault();
  var d=box.querySelector("#dsaD").value.trim();
  if(d.length<20){m.style.color="#b42318";m.textContent=T.short;return;}
  if(!box.querySelector("#dsaG").checked){m.style.color="#b42318";m.textContent=T.consent;return;}
  var b=box.querySelector("#dsaS");b.disabled=true;
  fetch("/api/dsa/notifica",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:box.querySelector("#dsaU").value,category:box.querySelector("#dsaC").value,description:d,name:box.querySelector("#dsaN").value,email:box.querySelector("#dsaE").value,good_faith:true,website:box.querySelector("#dsaW").value,lang:EN?"en":"ro"})})
  .then(function(r){if(!r.ok)throw new Error("x");return r.json();})
  .then(function(){m.style.color="#067647";m.textContent=T.ok;f.querySelector("#dsaS").style.display="none";})
  .catch(function(){b.disabled=false;m.style.color="#b42318";m.textContent=T.err;});
 });
 setTimeout(function(){var x=box&&box.querySelector("#dsaD");if(x)x.focus();},50);
}
window.ohtDsaOpen=open;
function dec(){var a=document.querySelectorAll("a[data-oe]");for(var i=0;i<a.length;i++){try{var m=atob(a[i].getAttribute("data-oe"));a[i].href="mailto:"+m;a[i].textContent=m;a[i].removeAttribute("data-oe");}catch(e){}}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",dec);else dec();
document.addEventListener("keydown",function(e){if(e.key==="Escape")close();});
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("[data-dsa-open]");if(a){e.preventDefault();open(a.getAttribute("data-dsa-url")||location.href);}});
})();`;

// ---------- pagina publică ----------
function pageBody(lang) {
  const en = lang === "en";
  const T = (ro, e) => (en ? e : ro);
  return `
<header>
  <div class="wrap header-row">
    <div class="brand-stack"><a class="brand" href="/">Opening<span>HoursToday</span></a></div>
    <div class="live-clock"><span class="dot"></span><span id="liveClock">--:--:--</span></div>
  </div>
</header>
<main class="wrap" style="max-width:760px">
  <p class="breadcrumb"><a href="/">${T("Acasă", "Home")}</a> / ${T("Raportare abuz / Conținut ilegal", "Report abuse / Illegal content")}</p>
  <h1 class="page-h1">${T("Raportare conținut ilegal", "Reporting illegal content")}</h1>
  <p class="intro-text" style="color:var(--muted)">${T("Conform Regulamentului (UE) 2022/2065 – Legea serviciilor digitale (DSA)", "Under Regulation (EU) 2022/2065 – the Digital Services Act (DSA)")}</p>
  <p class="intro-text" style="text-align:justify">${T("La Opening Hours Today ne dorim o platformă sigură și corectă. Dacă ați identificat pe site-ul nostru informații, fotografii sau anunțuri (cazări, restaurante, obiective turistice) care considerați că încalcă legea, drepturile de autor sau regulamentele europene, aveți dreptul de a ne notifica imediat.", "At Opening Hours Today we want a safe and fair platform. If you have found on our site information, photos or listings (stays, restaurants, attractions) that you believe break the law, copyright or European regulations, you have the right to notify us immediately.")}</p>

  <h2 class="section-title"><span class="bar"></span>${T("Cum puteți trimite o notificare de abuz?", "How can you send an abuse notice?")}</h2>
  <p class="intro-text" style="text-align:justify">${T("Puteți folosi formularul de mai jos sau ne puteți trimite un e-mail la", "You can use the form below or e-mail us at")} ${obf(ABUSE_ADDR)}, ${T("cu următoarele informații:", "with the following information:")}</p>
  <ol class="intro-text" style="text-align:justify;padding-left:22px;line-height:1.7">
    <li><strong>${T("Link-ul exact (URL-ul):", "The exact link (URL):")}</strong> ${T("pagina de pe site unde se află conținutul raportat.", "the page on the site where the reported content is.")}</li>
    <li><strong>${T("Descrierea problemei:", "Description of the problem:")}</strong> ${T("motivul clar pentru care considerați că acel conținut este ilegal (de exemplu: cazare falsă sau inexistentă, utilizarea unor fotografii fără drept de autor, informații înșelătoare).", "the clear reason why you consider the content illegal (for example: a fake or non-existent stay, photos used without copyright permission, misleading information).")}</li>
    <li><strong>${T("Datele dumneavoastră:", "Your details:")}</strong> ${T("numele și adresa de e-mail (opțional, dar necesare dacă doriți să primiți răspuns).", "your name and e-mail address (optional, but needed if you want a reply).")}</li>
    <li><strong>${T("Declarația de bună-credință:", "Good-faith statement:")}</strong> ${T("confirmarea că informațiile din notificare sunt exacte și complete.", "confirmation that the information in the notice is accurate and complete.")}</li>
  </ol>
  <p style="margin:18px 0"><button type="button" data-dsa-open class="geo-btn" style="max-width:340px">🚩 ${T("Trimite notificarea prin formular", "Send the notice through the form")}</button></p>

  <h2 class="section-title"><span class="bar"></span>${T("Ce facem noi?", "What do we do?")}</h2>
  <p class="intro-text" style="text-align:justify">${T("Echipa noastră va analiza raportarea în maximum 72 de ore. Pe durata analizei, dacă indiciile sunt clare, putem suspenda temporar pagina raportată. Dacă sesizarea se confirmă, conținutul sau contul gazdei respective va fi eliminat de pe platformă, iar persoana care a făcut raportarea va fi notificată pe e-mail (dacă ne-a lăsat o adresă). Decizia poate fi contestată: scrieți-ne la aceeași adresă, iar cazul este reexaminat de o persoană care nu a luat decizia inițială.", "Our team will review the notice within 72 hours at most. During the review, if the indications are clear, we may temporarily suspend the reported page. If the report is confirmed, the content or the host's account is removed from the platform and the person who reported it is notified by e-mail (if they left an address). The decision can be appealed: write to us at the same address and the case is re-examined by someone other than the original decision-maker.")}</p>
  <p class="intro-text" style="text-align:justify">${T("Sesizările abuzive sau făcute cu rea-credință pot duce la ignorarea notificărilor ulterioare ale aceleiași persoane. Datele din notificare sunt folosite doar pentru analiza ei și pentru răspuns (vezi", "Abusive or bad-faith notices may lead us to disregard later notices from the same person. The data in a notice is used only to review it and to reply (see")} <a href="/politica-de-confidentialitate" style="color:var(--accent)">${T("Politica de confidențialitate", "Privacy Policy")}</a>).</p>

  <h2 class="section-title"><span class="bar"></span>${T("Autorități și deținători de drepturi", "Authorities and rights holders")}</h2>
  <p class="intro-text" style="text-align:justify">${T("Punctul nostru unic de contact pentru autoritățile statelor membre, Comisia Europeană, Comitetul european pentru servicii digitale și pentru deținătorii de drepturi de autor este", "Our single point of contact for Member State authorities, the European Commission, the European Board for Digital Services and copyright holders is")} ${obf(ABUSE_ADDR)}. ${T("Puteți scrie în română sau în engleză.", "You may write in Romanian or English.")}</p>
  <p class="intro-text" style="margin-top:32px;color:var(--muted);font-size:13.5px">${T("Ultima actualizare: octombrie 2026", "Last updated: October 2026")}</p>
  <footer>${require("./footer-legal").html(lang)}</footer>
</main>`;
}

function mount(app, deps) {
  // fișierul scriptului pentru modal
  app.get("/dsa-report.js", (req, res) => {
    res.set("Content-Type", "application/javascript; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(CLIENT_JS);
  });

  const page = (req, res) => {
    const lang = req.query.lang === "en" ? "en" : (req.query.lang === "ro" ? "ro" : (L.getAccLang(req, res) === "en" ? "en" : "ro"));
    const nonce = L.generateNonce();
    res.set("Content-Security-Policy", L.buildCsp(nonce));
    const html = L.pageShell({
      title: (lang === "en" ? "Report abuse / illegal content" : "Raportare abuz / Conținut ilegal") + " — Opening Hours Today",
      description: lang === "en" ? "Report illegal content on Opening Hours Today (Digital Services Act notice)." : "Raportează conținut ilegal pe Opening Hours Today (notificare conform Legii serviciilor digitale – DSA).",
      canonical: `${L.baseUrlFor(req)}/raportare-abuz`, bodyHtml: pageBody(lang), dataForClient: { type: "general", weekly: [], holidays: [] }, nonce, langCode: lang === "en" ? "en" : "ro",
    });
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  };
  app.get("/raportare-abuz", page);
  app.get("/report-abuse", page);

  app.post("/api/dsa/notifica", async (req, res) => {
    try {
      if (!dbPool) return res.status(503).json({ error: "not_configured" });
      const b = req.body || {};
      if (b.website) return res.json({ ok: true }); // capcană pentru boți
      const url = clean(b.url, 500), desc = clean(b.description, 3000), name = clean(b.name, 120), email = clean(b.email, 200).toLowerCase();
      const cat = CATS.ro[b.category] ? b.category : "altul";
      const lang = b.lang === "en" ? "en" : "ro";
      if (desc.length < 20 || b.good_faith !== true || !/^https?:\/\/\S+$/i.test(url) || (email && !EMAIL_RE.test(email))) return res.status(400).json({ error: "date_invalide" });
      const ipk = L.hashIp(L.getClientIp(req));
      if (!(await L.checkRateLimit(ipk, "dsa-notice", 5, 60))) return res.status(429).json({ error: "prea_multe_cereri" });
      await ensureTable();
      const ins = await dbPool.query(
        `INSERT INTO dsa_notices (source, url, category, description, reporter_name, reporter_email, lang, ip_hash) VALUES ('form',$1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [url, cat, desc, name || null, email || null, lang, ipk]);
      const n = ins.rows[0];
      res.status(201).json({ ok: true, ref: refOf(n) });
      notifyAdmins(Object.assign({}, n, { subject: CATS.ro[cat] })).catch(() => {});
      ackReporter(n).catch(() => {});
    } catch (e) { console.error("dsa/notifica:", e.message); res.status(500).json({ error: "server_error" }); }
  });
}

// ---------- webhook Resend Inbound (corp brut, înregistrat în server.js cu express.raw) ----------
function verifySvix(req, raw) {
  const secret = process.env.RESEND_WEBHOOK_SECRET || "";
  if (!secret) return false;
  const id = req.headers["svix-id"], ts = req.headers["svix-timestamp"], sigs = String(req.headers["svix-signature"] || "");
  if (!id || !ts || !sigs) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(id + "." + ts + "." + raw).digest("base64");
  return sigs.split(" ").some((p) => {
    const v = p.split(",")[1] || "";
    return v.length === expected.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(expected));
  });
}
const htmlToText = (h) => String(h || "").replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>|<\/(p|div|tr|li)>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
const addrOf = (s) => { const m = /<([^>]+)>/.exec(String(s || "")); return clean(m ? m[1] : s, 200).toLowerCase(); };
const nameOf = (s) => { const m = /^\s*"?([^"<]+?)"?\s*</.exec(String(s || "")); return m ? clean(m[1], 120) : ""; };

async function inbound(req, res) {
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body || "");
    if (!verifySvix(req, raw)) return res.status(401).json({ error: "semnatura_invalida" });
    let ev; try { ev = JSON.parse(raw); } catch (e) { return res.status(400).json({ error: "json" }); }
    if (!ev || ev.type !== "email.received") return res.json({ ok: true, ignored: true });
    const d = ev.data || {};
    const emailId = d.email_id || d.id;
    if (!emailId || !dbPool) return res.status(400).json({ error: "fara_id" });
    await ensureTable();
    const dup = await dbPool.query(`SELECT 1 FROM dsa_notices WHERE email_id = $1`, [String(emailId)]);
    if (dup.rows.length) return res.json({ ok: true, duplicate: true });
    let full = {};
    try {
      const r = await fetch("https://api.resend.com/emails/receiving/" + encodeURIComponent(emailId), { signal: AbortSignal.timeout(10000), headers: { Authorization: "Bearer " + S.RESEND_API_KEY } });
      if (r.ok) full = await r.json();
    } catch (e) { /* păstrăm măcar metadatele din webhook */ }
    const from = full.from || d.from || "";
    const subject = clean(full.subject || d.subject || "(fără subiect)", 300);
    const text = clean(full.text || htmlToText(full.html) || "(corpul mesajului nu a putut fi citit — vezi dashboard-ul Resend)", 8000);
    // ruta după destinatar: abuse@ / report@ → coada DSA; orice altă adresă (contact@ etc.) → inbox-ul general
    const rcpts = [].concat(full.to || d.to || []).map((x) => addrOf(x));
    if (!rcpts.some((x) => /^(abuse|report)@/.test(x))) {
      const r = await require("./inbox").ingest({ emailId: String(emailId), to: rcpts[0] || "", fromAddr: addrOf(from), fromName: nameOf(from), subject, body: text });
      return res.json(Object.assign({ ok: true, routed: "inbox" }, r.duplicate ? { duplicate: true } : {}));
    }
    const um = /https?:\/\/[^\s<>"')]*(opening-hours-today\.eu|programul-de-azi\.ro)[^\s<>"')]*/i.exec(text);
    const ins = await dbPool.query(
      `INSERT INTO dsa_notices (source, url, category, description, reporter_name, reporter_email, subject, email_id, lang) VALUES ('email',$1,'altul',$2,$3,$4,$5,$6,$7) ON CONFLICT (email_id) DO NOTHING RETURNING *`,
      [um ? clean(um[0], 500) : null, text, nameOf(from) || null, addrOf(from) || null, subject, String(emailId), /[ăîșțâ]/i.test(text + subject) ? "ro" : "en"]);
    if (ins.rows.length) { const n = ins.rows[0]; notifyAdmins(n).catch(() => {}); ackReporter(n).catch(() => {}); }
    res.json({ ok: true });
  } catch (e) { console.error("dsa inbound:", e.message); res.status(500).json({ error: "server_error" }); }
}

// ---------- admin ----------
async function pendingCount() {
  if (!dbPool) return 0;
  try { await ensureTable(); return (await dbPool.query(`SELECT COUNT(*)::int AS n FROM dsa_notices WHERE status IN ('nou','in_analiza','suspendat')`)).rows[0].n; } catch (e) { return 0; }
}

function mountAdmin(app, deps) {
  const fmt = (v) => (v ? E(new Date(v).toLocaleDateString("ro-RO") + " " + new Date(v).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })) : "—");
  app.get("/admin/abuz", async (req, res) => {
    if (!deps.requireAdminPage(req, res)) return;
    if (!dbPool) { res.status(503).send("Baza de date nu e configurată."); return; }
    await ensureTable();
    const tab = req.query.tab === "inchise" ? "inchise" : "deschise";
    const where = tab === "inchise" ? `status IN ('confirmat','respins')` : `status IN ('nou','in_analiza','suspendat')`;
    const rows = (await dbPool.query(`SELECT * FROM dsa_notices WHERE ${where} ORDER BY created_at ${tab === "inchise" ? "DESC" : "ASC"} LIMIT 300`)).rows;
    const cnt = (await dbPool.query(`SELECT COUNT(*) FILTER (WHERE status IN ('nou','in_analiza','suspendat'))::int AS o, COUNT(*) FILTER (WHERE status IN ('confirmat','respins'))::int AS c FROM dsa_notices`)).rows[0];
    const counts = await deps.getAdminCounts();
    const now = Date.now();
    const cards = rows.map((n) => {
      const hrs = (now - new Date(n.created_at).getTime()) / 3600000;
      const open = n.status === "nou" || n.status === "in_analiza" || n.status === "suspendat";
      const left = 72 - hrs;
      const due = !open ? "" : (left < 0 ? `<span style="color:#ff8a80;font-weight:800">⏰ termen depășit cu ${Math.ceil(-left)} h</span>` : `<span style="color:${left < 12 ? "#ffcf7a" : "inherit"}">termen: ${Math.floor(left)} h rămase</span>`);
      return `<div class="admin-submission-card dsa" data-id="${n.id}">
        <div class="admin-submission-header"><span class="admin-submission-type">${n.source === "email" ? "✉️ E-mail" : "📝 Formular"} · ${E(refOf(n))}</span><span class="admin-submission-meta">${fmt(n.created_at)} · ${due}</span></div>
        <div class="admin-submission-name">${n.url ? `<a href="${E(n.url)}" target="_blank" rel="noopener" style="color:inherit;word-break:break-all">${E(n.url)}</a>` : "<em>fără URL (vezi mesajul)</em>"}</div>
        <div class="admin-submission-meta" style="line-height:1.6">Status: <strong>${E(STATUS_RO[n.status] || n.status)}</strong>${n.category ? ` · Motiv: ${E(CATS.ro[n.category] || n.category)}` : ""}<br>De la: <strong>${E(n.reporter_name || "")} ${E(n.reporter_email || "—")}</strong>${n.ack_at ? " · confirmare trimisă" : ""}${n.subject ? `<br>Subiect: ${E(n.subject)}` : ""}</div>
        <div class="admin-submission-meta" style="white-space:pre-wrap;margin-top:8px;max-height:260px;overflow:auto">${E(n.description)}</div>
        ${n.decision_note ? `<div class="admin-submission-meta" style="margin-top:6px">Notă / decizie: ${E(n.decision_note)} (${fmt(n.decided_at)})</div>` : ""}
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <select class="dsa-st" style="padding:8px;border-radius:8px">${STATUSES.map((s) => `<option value="${s}"${s === n.status ? " selected" : ""}>${E(STATUS_RO[s])}</option>`).join("")}</select>
          <input class="dsa-note" type="text" maxlength="800" placeholder="Notă / motivarea deciziei (se trimite raportorului la confirmat / respins)" value="" style="flex:1;min-width:220px;padding:8px;border-radius:8px">
          <label style="font-size:13px"><input class="dsa-mail" type="checkbox" checked> trimite e-mail raportorului</label>
          <button type="button" class="admin-approve-btn dsa-save">Salvează</button>
        </div></div>`;
    }).join("") || "<p>Nicio notificare.</p>";
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Abuz / DSA — Admin</title>
<style>${deps.adminShellStyles()}</style></head><body><div class="admin-shell">
${deps.adminSidebarHtml("abuz", counts)}
<div style="flex:1">${deps.adminMobileBarHtml()}<div class="admin-main">
<h1 class="admin-h1">🚩 Abuz / Conținut ilegal (DSA)</h1>
<p class="admin-submission-meta" style="margin-bottom:10px">Notificările primite prin formular și e-mailurile trimise la <strong>${E(ABUSE_ADDR)}</strong>. Termen de analiză: 72 de ore. Pentru a suspenda o pagină folosește secțiunea ei din admin (Cazări / Propuneri locuri etc.).</p>
<div style="display:flex;gap:8px;margin:10px 0 16px"><a class="admin-nav-item${tab === "deschise" ? " is-active" : ""}" href="/admin/abuz" style="width:auto">Deschise (${cnt.o})</a><a class="admin-nav-item${tab === "inchise" ? " is-active" : ""}" href="/admin/abuz?tab=inchise" style="width:auto">Închise (${cnt.c})</a></div>
${cards}
</div></div></div>
<script>(function(){${deps.adminSidebarScript()}
document.querySelectorAll(".dsa-save").forEach(function(b){b.addEventListener("click",function(){
 var c=b.closest(".dsa");b.disabled=true;
 fetch("/api/admin/abuz/"+c.getAttribute("data-id"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:c.querySelector(".dsa-st").value,note:c.querySelector(".dsa-note").value,notify:c.querySelector(".dsa-mail").checked})})
 .then(function(r){return r.json();}).then(function(d){if(d&&d.ok){location.reload();}else{alert((d&&d.error)||"Eroare");b.disabled=false;}}).catch(function(){alert("Eroare de rețea");b.disabled=false;});
});});})();</script></body></html>`);
  });

  app.post("/api/admin/abuz/:id", async (req, res) => {
    if (!deps.requireAdminApi(req, res)) return;
    try {
      const id = /^\d{1,9}$/.test(req.params.id) ? Number(req.params.id) : 0;
      const b = req.body || {};
      if (!id || !STATUSES.includes(b.status) || !dbPool) return res.status(400).json({ error: "date_invalide" });
      const note = clean(b.note, 800) || null;
      const closed = b.status === "confirmat" || b.status === "respins";
      const up = await dbPool.query(
        `UPDATE dsa_notices SET status = $1, decision_note = COALESCE($2, decision_note), decided_at = CASE WHEN $3 THEN now() ELSE decided_at END WHERE id = $4 RETURNING *`,
        [b.status, note, closed, id]);
      if (!up.rows.length) return res.status(404).json({ error: "negasit" });
      const n = up.rows[0];
      if (closed && b.notify !== false && n.reporter_email && EMAIL_RE.test(n.reporter_email)) {
        const en = n.lang === "en";
        const msg = en ? STATUS_EN[b.status] : (b.status === "confirmat" ? "Notificarea dumneavoastră a fost confirmată, iar conținutul a fost eliminat." : "În urma analizei, nu am constatat o încălcare.");
        const html = `<p>${en ? "Hello," : "Bună ziua,"}</p><p>${en ? "Regarding your notice" : "Referitor la notificarea dumneavoastră"} <strong>${E(refOf(n))}</strong> (${E(n.url || "")}): ${E(msg)}</p>${n.decision_note ? `<p>${E(n.decision_note)}</p>` : ""}<p>${en ? "If you disagree, reply to this e-mail and the case will be re-examined." : "Dacă nu sunteți de acord, răspundeți la acest e-mail și cazul va fi reexaminat."}</p><p>Opening Hours Today</p>`;
        await sendMail(n.reporter_email, (en ? "Decision on your notice " : "Decizie privind notificarea ") + refOf(n), html);
      }
      res.json({ ok: true });
    } catch (e) { console.error("admin/abuz:", e.message); res.status(500).json({ error: "server_error" }); }
  });
}

module.exports = { mount, mountAdmin, inbound, pendingCount, verifySvix, refOf, ABUSE_ADDR };

// Mesaje către proprietar (în locul butoanelor WhatsApp turist ↔ gazdă).
// Turistul completează un formular (nume, e-mail, mesaj) cu verificare anti-bot (Turnstile) și limită pe IP; mesajul se SALVEAZĂ în baza de date
// (dovadă), iar proprietarul îl primește pe e-mail (răspunde direct turistului, Reply-To) și, la cazări, ca notificare push în OHT Host.
"use strict";
const crypto = require("crypto");
const { dbPool, RESEND_API_KEY, TURNSTILE_SITE_KEY, INTL_DOMAIN } = require("./static");
const L = require("./logic");

const E = L.escapeHtml;
const KINDS = { cazare: "accommodation_listings", atractie: "attraction_listings", restaurant: "restaurant_listings" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");
const siteBase = () => "https://" + (INTL_DOMAIN || "opening-hours-today.eu");

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  await dbPool.query(`CREATE TABLE IF NOT EXISTS listing_messages (
    id SERIAL PRIMARY KEY, kind VARCHAR(12) NOT NULL, listing_id INTEGER NOT NULL, owner_id INTEGER,
    guest_name VARCHAR(80) NOT NULL, guest_email VARCHAR(160) NOT NULL, guest_phone VARCHAR(25), message TEXT NOT NULL, arrival VARCHAR(40),
    lang VARCHAR(2) NOT NULL DEFAULT 'ro', ip_hash VARCHAR(64), emailed BOOLEAN NOT NULL DEFAULT false, pushed INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await dbPool.query(`ALTER TABLE listing_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ`);
  await dbPool.query(`CREATE INDEX IF NOT EXISTS idx_listing_messages_listing ON listing_messages (kind, listing_id, created_at DESC)`);
  ensured = true;
}

async function sendMail(to, replyTo, subject, html) {
  if (!RESEND_API_KEY || !to.length) return false;
  const senders = [process.env.BOOKINGS_MAIL_FROM || "Opening Hours Today <cazare@opening-hours-today.eu>", "Opening Hours Today <cazare@programul-de-azi.ro>"];
  for (const from of senders) {
    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST", signal: AbortSignal.timeout(8000),
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, reply_to: replyTo, subject, html }),
      });
      if (resp.ok) return true;
      if (![401, 403, 422].includes(resp.status)) return false;
    } catch (e) { return false; }
  }
  return false;
}

function mount(app) {
  mountInbox(app);
  app.post("/api/mesaj/:kind/:id", async (req, res) => {
    try {
      const table = KINDS[req.params.kind];
      const id = /^\d{1,9}$/.test(req.params.id) ? Number(req.params.id) : 0;
      if (!table || !id || !dbPool) return res.status(404).json({ error: "negasit" });
      const b = req.body || {};
      if (b.website) return res.json({ ok: true }); // capcană pentru boți: câmp ascuns completat
      const name = clean(b.name, 80), email = clean(b.email, 160).toLowerCase(), message = clean(b.message, 2000);
      const phone = clean(b.phone, 25).replace(/[^\d+\s]/g, "").trim();
      const arrival = clean(b.arrival, 40);
      const lang = b.lang === "en" ? "en" : "ro";
      if (name.length < 2 || !EMAIL_RE.test(email) || message.length < 5 || b.consent !== true || (phone && phone.replace(/\D/g, "").length < 7)) return res.status(400).json({ error: "date_invalide" });
      const ipk = L.hashIp(L.getClientIp(req));
      if (!(await L.checkRateLimit(ipk, "msg-send", 5, 60)) || !(await L.checkRateLimit(sha("em:" + email), "msg-send-em", 6, 1440))) return res.status(429).json({ error: "prea_multe_cereri" });
      if (!(await L.verifyTurnstile(b.turnstileToken, L.getClientIp(req)))) return res.status(400).json({ error: "captcha_failed" });
      const l = (await dbPool.query(
        `SELECT l.id, l.name, l.owner_id, l.contact_email, o.email AS owner_email FROM ${table} l JOIN accommodation_owners o ON o.id = l.owner_id WHERE l.id = $1 AND l.status = 'approved'`, [id])).rows[0];
      if (!l) return res.status(404).json({ error: "negasit" });
      await ensureTable();
      const ins = await dbPool.query(
        `INSERT INTO listing_messages (kind, listing_id, owner_id, guest_name, guest_email, guest_phone, message, arrival, lang, ip_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [req.params.kind, id, l.owner_id, name, email, phone || null, message, arrival || null, lang, ipk]);
      const mid = ins.rows[0].id;
      dbPool.query(`UPDATE ${table} SET whatsapp_clicks = whatsapp_clicks + 1 WHERE id = $1`, [id]).catch(() => {}); // contorul „mesaje primite” din tabloul de bord
      const to = [l.owner_email];
      if (l.contact_email && EMAIL_RE.test(l.contact_email) && l.contact_email.toLowerCase() !== String(l.owner_email).toLowerCase()) to.push(l.contact_email);
      const emailed = await sendMail(to, email, "Mesaj nou de la un vizitator · " + l.name,
        `<p>Ai primit un mesaj prin Opening Hours Today pentru <b>${E(l.name)}</b>.</p><p><b>${E(name)}</b> · ${E(email)}${phone ? " · " + E(phone) : ""}${arrival ? "<br>Sosire: " + E(arrival) : ""}</p><blockquote style="margin:10px 0;padding:10px 14px;background:#f5f7f6;border-left:3px solid #0E6B63;white-space:pre-wrap">${E(message)}</blockquote><p>Poți răspunde direct la acest e-mail: răspunsul ajunge la vizitator.</p>`);
      let pushed = 0;
      if (req.params.kind === "cazare") pushed = await require("./bookings-gazda-notify").pushByListing(id, { title: "Mesaj nou", body: name + ": " + message.slice(0, 90), tag: "msg-" + mid });
      await dbPool.query(`UPDATE listing_messages SET emailed = $2, pushed = $3 WHERE id = $1`, [mid, emailed, pushed || 0]).catch(() => {});
      res.json({ ok: true });
    } catch (e) { console.error("mesaj:", e.message); res.status(500).json({ error: "eroare" }); }
  });
}


// ---------- inbox: lista de mesaje (citit / necitit) ----------
let lastPurge = 0;
async function purgeOld() { // păstrăm mesajele 12 luni (GDPR); curățare cel mult o dată pe zi pe instanță
  if (Date.now() - lastPurge < 24 * 3600 * 1000) return;
  lastPurge = Date.now();
  await dbPool.query(`DELETE FROM listing_messages WHERE created_at < now() - interval '12 months'`).catch(() => {});
}
// opts: { kind, listingId } (opțional, pentru aplicația OHT Host: doar cazarea curentă)
async function listFor(ownerId, opts) {
  await ensureTable(); await purgeOld();
  const args = [ownerId]; let where = "";
  if (opts && opts.kind) { args.push(opts.kind); where += ` AND m.kind = $${args.length}`; }
  if (opts && opts.listingId) { args.push(opts.listingId); where += ` AND m.listing_id = $${args.length}::integer`; }
  const rows = (await dbPool.query(
    `SELECT m.id, m.kind, m.listing_id, m.guest_name, m.guest_email, m.guest_phone, m.message, m.arrival, (m.read_at IS NOT NULL) AS read,
            to_char(m.created_at AT TIME ZONE 'Europe/Bucharest', 'DD.MM.YYYY HH24:MI') AS at,
            COALESCE((SELECT name FROM accommodation_listings WHERE id = m.listing_id AND m.kind = 'cazare'), (SELECT name FROM attraction_listings WHERE id = m.listing_id AND m.kind = 'atractie'), (SELECT name FROM restaurant_listings WHERE id = m.listing_id AND m.kind = 'restaurant')) AS listing_name
       FROM listing_messages m WHERE m.owner_id = $1::integer${where} ORDER BY m.created_at DESC LIMIT 100`, args)).rows;
  return { unread: rows.filter((x) => !x.read).length, messages: rows };
}
async function markRead(ownerId, body, opts) {
  await ensureTable();
  const args = [ownerId]; let where = "";
  if (opts && opts.kind) { args.push(opts.kind); where += ` AND kind = $${args.length}`; }
  if (opts && opts.listingId) { args.push(opts.listingId); where += ` AND listing_id = $${args.length}::integer`; }
  if (body && body.all === true) await dbPool.query(`UPDATE listing_messages SET read_at = now() WHERE owner_id = $1::integer AND read_at IS NULL${where}`, args);
  else {
    const ids = (Array.isArray(body && body.ids) ? body.ids : []).map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 100);
    if (ids.length) { args.push(ids); await dbPool.query(`UPDATE listing_messages SET read_at = now() WHERE owner_id = $1::integer AND id = ANY($${args.length}::int[]) AND read_at IS NULL${where}`, args); }
  }
}
// numărul de mesaje pentru cutia din „Proprietățile mele”; null dacă tabelul nu există încă sau nu sunt mesaje
async function summary(ownerId) {
  try {
    const r = (await dbPool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE read_at IS NULL)::int AS unread FROM listing_messages WHERE owner_id = $1::integer`, [ownerId])).rows[0];
    return r && r.total > 0 ? r : null;
  } catch (e) { return null; }
}

const INBOX_JS = `
const KIND={cazare:'Cazare',atractie:'Obiectiv',restaurant:'Local'};
function draw(j){const box=$('#list');box.replaceChildren();$('#unread').textContent=j.unread?j.unread+' necitite':'Toate citite';$('#readall').hidden=!j.unread;
 if(!j.messages.length){box.append(el('div',{class:'card'},['Nu ai primit încă mesaje.']));return;}
 j.messages.forEach(m=>{const c=el('div',{class:'card',style:m.read?'':'border-color:#0E6B63;border-width:2px'});
  c.append(el('div',{style:'display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap'},[el('b',{},[(m.read?'':'● ')+m.guest_name]),el('span',{class:'sub'},[m.at])]));
  c.append(el('div',{class:'sub'},[(KIND[m.kind]||'')+' · '+(m.listing_name||'')+(m.arrival?' · sosire: '+m.arrival:'')]));
  c.append(el('div',{style:'white-space:pre-wrap;margin:8px 0'},[m.message]));
  const row=el('div',{class:'row'});
  row.append(el('a',{href:'mailto:'+m.guest_email+'?subject='+encodeURIComponent('Re: mesajul tău către '+(m.listing_name||'proprietate')),style:'text-align:center;padding:12px;border:1px solid #0E6B63;border-radius:10px;color:#0E6B63;font-weight:700;text-decoration:none'},['Răspunde pe e-mail']));
  if(m.guest_phone)row.append(el('a',{href:'tel:'+m.guest_phone,style:'text-align:center;padding:12px;border:1px solid #0E6B63;border-radius:10px;color:#0E6B63;font-weight:700;text-decoration:none'},['Sună']));
  if(!m.read){const b=el('button',{type:'button',class:'s'},['Marchează citit']);b.onclick=async()=>{b.disabled=true;try{await api('POST','/api/cont/mesaje/citit',{ids:[m.id]});load();}catch(e){b.disabled=false;}};row.append(b);}
  c.append(row);box.append(c);});}
async function load(){try{draw(await api('GET','/api/cont/mesaje'));}catch(e){say($('#m'),e.message,false);}}
$('#readall').onclick=async()=>{try{await api('POST','/api/cont/mesaje/citit',{all:true});load();}catch(e){say($('#m'),e.message,false);}};
load();`;

function mountInbox(app) {
  const bk = () => require("./bookings");
  const jsonCt = (req, res, next) => (/application\/json/i.test(String(req.headers["content-type"] || "")) ? next() : res.status(415).json({ error: "tip_invalid" }));
  app.get("/cont/mesaje", L.accommodationGate, L.requireAccommodationOwner, (req, res) => {
    try {
      bk().shell(res, "Mesaje", `<p><a href="/cont">← Proprietățile mele</a></p><h1>Mesaje de la vizitatori</h1><p class="sub" id="unread"></p><div class="row"><button id="readall" class="s" type="button" hidden>Marchează toate citite</button></div><div class="msg" id="m"></div><div id="list"></div><p class="sub" style="margin-top:14px">Răspunzi direct pe e-mail, iar răspunsul ajunge la vizitator. Mesajele se păstrează 12 luni.</p>`, bk().COMMON_JS + INBOX_JS);
    } catch (e) { console.error("inbox pagina:", e.message); res.status(500).send("Eroare"); }
  });
  app.get("/api/cont/mesaje", L.accommodationGate, L.requireAccommodationOwnerApi, async (req, res) => {
    try { res.set("Cache-Control", "no-store"); res.json(await listFor(req.accommodationOwner.ownerId)); }
    catch (e) { console.error("inbox lista:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  app.post("/api/cont/mesaje/citit", L.accommodationGate, L.requireAccommodationOwnerApi, jsonCt, async (req, res) => {
    try { await markRead(req.accommodationOwner.ownerId, req.body || {}); res.json({ ok: true }); }
    catch (e) { console.error("inbox citit:", e.message); res.status(500).json({ error: "eroare" }); }
  });
}

// ---------- piese pentru paginile publice ----------
const CSS = `.oht-mf label{display:block;font-size:13px;font-weight:600;margin:10px 0 4px;color:#111}.oht-mf input[type=text],.oht-mf input[type=email],.oht-mf input[type=tel],.oht-mf textarea{width:100%;box-sizing:border-box;border:1.5px solid #ddd;border-radius:10px;padding:10px;font:inherit;color:#111;background:#fff}.oht-mf textarea{min-height:90px;resize:vertical}.oht-mf .oht-hp{position:absolute;left:-9999px;height:0;overflow:hidden}.oht-mf .oht-ck{display:flex;gap:8px;align-items:flex-start;font-weight:500;font-size:12.5px;margin-top:10px}.oht-mf .oht-ck input{margin-top:3px;flex:none}.oht-mf .oht-st{margin-top:8px;font-size:13px;min-height:18px}.oht-mf .oht-st.err{color:#c0392b}.oht-mf .oht-st.ok{color:#0E6B63}
.oht-mbd{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;align-items:center;justify-content:center;padding:16px}.oht-mbd.is-open{display:flex}.oht-mm{background:#fff;color:#111;border-radius:16px;padding:22px;max-width:440px;width:100%;max-height:92vh;overflow:auto}.oht-mm h3{margin:0 0 6px;color:#111}.oht-mact{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}.oht-mact button{border:0;border-radius:10px;padding:10px 18px;font-weight:700;cursor:pointer}.oht-mact .c{background:#eee;color:#333}.oht-mact .s{background:#0E6B63;color:#fff}.oht-mact .s:disabled{opacity:.6}`;

// câmpurile formularului (aceleași pe cazare, obiective și restaurante)
function fieldsHtml(lang, uid) {
  const t = (ro, en) => (lang === "en" ? en : ro);
  const id = (s) => `${uid || "m"}-${s}`;
  return `<div class="oht-mf">
<label for="${id("name")}">${t("Numele tău", "Your name")}</label><input type="text" id="${id("name")}" maxlength="80" autocomplete="name">
<label for="${id("email")}">${t("E-mail (primești răspunsul aici)", "E-mail (the reply comes here)")}</label><input type="email" id="${id("email")}" maxlength="160" autocomplete="email">
<label for="${id("phone")}">${t("Telefon (opțional)", "Phone (optional)")}</label><input type="tel" id="${id("phone")}" maxlength="25" autocomplete="tel">
<div class="oht-hp" aria-hidden="true"><input type="text" id="${id("web")}" tabindex="-1" autocomplete="off"></div>
<label class="oht-ck"><input type="checkbox" id="${id("ck")}"><span>${t("Sunt de acord ca mesajul și datele de contact să fie trimise proprietarului, pentru a-mi răspunde.", "I agree that my message and contact details are sent to the owner so they can reply.")}</span></label>
${TURNSTILE_SITE_KEY ? `<div class="cf-turnstile" data-sitekey="${E(TURNSTILE_SITE_KEY)}" style="margin-top:10px"></div><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>` : ""}
<div class="oht-st" id="${id("st")}" role="status"></div></div>`;
}
// funcția de trimitere; câmpurile se citesc din elementele create de fieldsHtml(uid)
function sendJs(kind, listingId, lang, uid) {
  return `function ohtSendMessage(extra, done){var u=${JSON.stringify(uid || "m")},g=function(s){return document.getElementById(u+"-"+s)};var st=g("st");var ro=${lang === "en" ? "false" : "true"};
function say(m,ok){st.textContent=m;st.className="oht-st "+(ok?"ok":"err");}
var name=g("name").value.trim(),email=g("email").value.trim();
if(name.length<2){say(ro?"Scrie-ți numele.":"Enter your name.");return done(false);}
if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email)){say(ro?"Scrie un e-mail valid.":"Enter a valid e-mail.");return done(false);}
if(!g("ck").checked){say(ro?"Bifează acordul.":"Please tick the consent box.");return done(false);}
var tok="";try{tok=window.turnstile?(turnstile.getResponse()||""):"";}catch(e){}
fetch("/api/mesaj/${kind}/${listingId}",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name,email:email,phone:g("phone").value,website:g("web").value,consent:true,lang:${JSON.stringify(lang === "en" ? "en" : "ro")},message:extra.message,arrival:extra.arrival||"",turnstileToken:tok})})
.then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d};});})
.then(function(x){if(x.ok){say(ro?"Mesajul a fost trimis. Proprietarul îți răspunde pe e-mail.":"Message sent. The owner will reply by e-mail.",true);done(true);}else{var c=x.d&&x.d.error;say(c==="captcha_failed"?(ro?"Confirmă că nu ești robot.":"Please confirm you are not a robot."):c==="prea_multe_cereri"?(ro?"Prea multe mesaje. Încearcă mai târziu.":"Too many messages. Try again later."):(ro?"Nu am putut trimite mesajul. Verifică datele.":"Could not send the message. Check your details."));try{if(window.turnstile)turnstile.reset();}catch(e){}done(false);}})
.catch(function(){say(ro?"Eroare de rețea. Încearcă din nou.":"Network error. Try again.");done(false);});}`;
}
// fereastra completă pentru obiective / restaurante (cazarea își are fereastra proprie, cu ora sosirii)
function venueModal(kind, listingId, name, lang) {
  const t = (ro, en) => (lang === "en" ? en : ro);
  const html = `<div class="oht-mbd" id="ohtMsgBd"><div class="oht-mm"><h3>${t("Trimite un mesaj către", "Send a message to")} ${E(name)}</h3>
<div class="oht-mf"><label for="ohtMsgText">${t("Mesajul tău", "Your message")}</label><textarea id="ohtMsgText" maxlength="2000" placeholder="${t("Bună, aș dori să aflu...", "Hello, I would like to know...")}"></textarea></div>
${fieldsHtml(lang, "vm")}<div class="oht-mact"><button type="button" class="c" id="ohtMsgCancel">${t("Închide", "Close")}</button><button type="button" class="s" id="ohtMsgSend">${t("Trimite mesajul", "Send message")}</button></div></div></div>`;
  const js = `${sendJs(kind, listingId, lang, "vm")}
(function(){var bd=document.getElementById("ohtMsgBd"),b=document.getElementById("ohtMsgBtn");if(!bd||!b)return;
b.addEventListener("click",function(){bd.classList.add("is-open");});
document.getElementById("ohtMsgCancel").addEventListener("click",function(){bd.classList.remove("is-open");});
var s=document.getElementById("ohtMsgSend");s.addEventListener("click",function(){var m=document.getElementById("ohtMsgText").value.trim();var st=document.getElementById("vm-st");var ro=${lang === "en" ? "false" : "true"};
if(m.length<5){st.textContent=ro?"Scrie un mesaj.":"Write a message.";st.className="oht-st err";return;}
s.disabled=true;ohtSendMessage({message:m},function(ok){s.disabled=false;if(ok){document.getElementById("ohtMsgText").value="";setTimeout(function(){bd.classList.remove("is-open");},2500);}});});})();`;
  return { html, js, css: CSS };
}

module.exports = { mount, listFor, markRead, summary, ensureTable, CSS, fieldsHtml, sendJs, venueModal, KINDS };

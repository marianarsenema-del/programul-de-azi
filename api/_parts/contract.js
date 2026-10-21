// Contractul-cadru în contul gazdei: completat automat (date platformă din admin + „Date fiscale” ale gazdei) și semnat electronic simplu
// (acord + nume + semnătură desenată; se păstrează data/ora, IP-ul, user-agent-ul și amprenta SHA-256 a documentului).
// Tabelele se creează singure (CREATE TABLE IF NOT EXISTS) — nu e nevoie de SQL.
"use strict";
const crypto = require("crypto");
const S = require("./static");
const L = require("./logic");
const P = require("./parteneri");

const dbPool = S.dbPool;
const E = L.escapeHtml;
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
const sha256 = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const CONTRACT_SRC = typeof P.CONTRACT_RO === "string" ? P.CONTRACT_RO : ""; // gol dacă parteneri.js e o versiune veche: modulul nu mai oprește site-ul la pornire
const TEMPLATE_VERSION = CONTRACT_SRC ? sha256(CONTRACT_SRC).slice(0, 12) : "indisponibil"; // se schimbă singur când se modifică textul modelului
const CONTRACT_VERSION_LABEL = "v1.0_octombrie_2026"; // etichetă pentru oameni/instanță; o schimbi manual când publici un text nou
// Textul exact pe care îl acceptă gazda (se salvează odată cu semnătura)
const CONSENT_TEXT = "Prin bifarea acestei căsuțe și introducerea numelui meu, declar că am calitatea de reprezentant legal al societății menționate, am citit în întregime, înțeleg și accept semnarea prezentului Contract Cadru de Prestări Servicii, asumându-mi toate obligațiile și clauzele menționate.";
const CONSENT_TEXT_EN = "By ticking this box and entering my name, I declare that I am the legal representative of the company named above, and that I have read in full, understand and accept the signing of this Framework Agreement for Services, assuming all obligations and clauses set out in it. (The binding text is the Romanian version.)";
// Gazdele fără contract semnat nu pot primi rezervări. Oprire de urgență: CONTRACT_REQUIRED=false în Vercel.
const REQUIRED = process.env.CONTRACT_REQUIRED !== "false";
const SIGNED_SQL = (alias) => (REQUIRED ? ` AND EXISTS (SELECT 1 FROM contracte_semnate cs WHERE cs.user_id = ${alias}.owner_id)` : "");
const CONTACT_ADDR = process.env.INBOX_CONTACT_EMAIL || "contact@opening-hours-today.eu";

// câmpurile părții „Platforma” (setate din /admin/contracte, goale până la înființarea firmei)
const PLATFORM_FIELDS = [
  ["name", "Denumirea completă (ex. X S.R.L.)", 160, true],
  ["address", "Adresa sediului social", 300, true],
  ["regcom", "Nr. Registrul Comerțului (J__/____/____)", 40, true],
  ["cui", "CUI", 20, true],
  ["iban", "IBAN", 40, true],
  ["bank", "Banca", 80, true],
  ["rep_name", "Reprezentant legal (nume)", 120, true],
  ["rep_role", "Funcția reprezentantului", 60, false],
];

let ensured = false, ensuring = null;
function ensureTables() {
  if (ensured || !dbPool) return Promise.resolve();
  if (!ensuring) {
    ensuring = (async () => {
      await dbPool.query(`CREATE TABLE IF NOT EXISTS platform_settings (k VARCHAR(80) PRIMARY KEY, v TEXT NOT NULL DEFAULT '', updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await dbPool.query(`CREATE TABLE IF NOT EXISTS contracte_semnate (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, stripe_user_id VARCHAR(80), signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    signed_ip VARCHAR(64), user_agent VARCHAR(300), signer_name VARCHAR(160) NOT NULL, host_name VARCHAR(255),
    contract_version VARCHAR(40) NOT NULL, template_hash VARCHAR(20) NOT NULL, contract_sha256 CHAR(64) NOT NULL,
    consent_text TEXT NOT NULL, contract_body TEXT NOT NULL, contract_html TEXT NOT NULL)`);
      await dbPool.query(`CREATE INDEX IF NOT EXISTS idx_contracte_semnate_user ON contracte_semnate (user_id, signed_at DESC)`);
      ensured = true;
    })().catch((e) => { ensuring = null; throw e; });
  }
  return ensuring;
}

async function getPlatform() {
  await ensureTables();
  const rows = (await dbPool.query(`SELECT k, v FROM platform_settings WHERE k LIKE 'contract_%'`)).rows;
  const m = {};
  rows.forEach((r) => { m[r.k.replace(/^contract_/, "")] = r.v; });
  const p = {};
  PLATFORM_FIELDS.forEach(([k]) => { p[k] = m[k] || ""; });
  if (!p.rep_role) p.rep_role = "Administrator";
  p.ready = PLATFORM_FIELDS.every(([k, , , req]) => !req || p[k]);
  return p;
}

function hostMissing(o) {
  const miss = [];
  if (!clean(o.company_name, 255)) miss.push("denumirea / numele");
  if (!clean(o.company_cui, 20)) miss.push("CUI / CNP");
  if (!clean(o.company_address, 500)) miss.push("adresa");
  return miss;
}

function fmtDate(d) {
  const x = new Date(d);
  return x.toLocaleDateString("ro-RO", { timeZone: "Europe/Bucharest" }) + " " + x.toLocaleTimeString("ro-RO", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " (ora României)";
}

// construiește documentul din modelul din parteneri.js: înlocuiește cele două paragrafe ale părților și blocul de semnături
function buildContractHtml(platform, owner, signerName) {
  let html = CONTRACT_SRC;
  if (!html) throw new Error("contract_template_missing");
  const pPlat = `<p><strong>1.</strong> ${E(platform.name)}, cu sediul social în ${E(platform.address)}, înmatriculată la Registrul Comerțului sub nr. ${E(platform.regcom)}, Cod Unic de Înregistrare (CUI) ${E(platform.cui)}, cont bancar (IBAN) ${E(platform.iban)} deschis la ${E(platform.bank)}, reprezentată legal prin ${E(platform.rep_name)}, în calitate de ${E(platform.rep_role)}, denumită în continuare „Platforma”.</p>`;
  const vat = owner.company_vat_payer === true ? "plătitoare de TVA" : owner.company_vat_payer === false ? "neplătitoare de TVA" : "";
  const regcom = clean(owner.company_reg_com, 50);
  const sName = signerName ? E(signerName) : "[se completează la semnare]";
  const pHost = `<p><strong>2.</strong> Societatea / Persoana Fizică Autorizată / Persoana fizică ${E(clean(owner.company_name, 255))}, cu sediul / domiciliul în ${E(clean(owner.company_address, 500))}${regcom ? `, înmatriculată la Registrul Comerțului sub nr. ${E(regcom)}` : ""}, Cod Unic de Înregistrare (CUI) / CNP ${E(clean(owner.company_cui, 20))}${vat ? `, ${vat}` : ""}, încasând sumele prin contul de plăți Stripe Connect Express asociat Gazdei, reprezentată legal prin ${sName}, în calitate de reprezentant legal, denumită în continuare „Gazda”.</p>`;
  const before = html;
  html = html.replace(/<p><strong>1\.<\/strong> \[NUME FIRMĂ PLATFORMĂ\][^\n]*<\/p>/, () => pPlat);
  html = html.replace(/<p><strong>2\.<\/strong> Societatea[^\n]*<\/p>/, () => pHost);
  html = html.replace(/<table class="pn-sign">[\s\S]*<\/table>/, "");
  if (html === before || /\[NUME FIRMĂ PLATFORMĂ\]|\[NUME GAZDĂ\]/.test(html)) throw new Error("contract_template_mismatch");
  return html;
}

function signBlockHtml(platform, owner, signerName, audit, hash) {
  return `<table class="ct-sign"><tr>
<td><strong>Pentru PLATFORMĂ</strong><br>${E(platform.name)}<br>Reprezentant: ${E(platform.rep_name)}<br>Funcția: ${E(platform.rep_role)}<br><em>Consimțământ exprimat electronic prin generarea acestui document, la data semnării Gazdei.</em></td>
<td><strong>Pentru GAZDĂ</strong><br>${E(clean(owner.company_name, 255))}<br>Reprezentant legal: <strong>${signerName ? E(signerName) : "—"}</strong><br>${audit ? "Semnat electronic prin bifarea acordului și introducerea numelui." : ""}</td></tr></table>
${audit ? `<p class="ct-audit"><strong>Registru de audit.</strong> Semnat electronic de ${E(signerName)} la ${E(fmtDate(audit.at))} (${E(audit.at.toISOString().replace("T", " ").slice(0, 19))} UTC). Adresă IP: ${E(audit.ip || "—")}. Contract nr. ${E(String(audit.id || "—"))}, versiunea ${E(CONTRACT_VERSION_LABEL)}. Amprentă SHA-256 a textului contractului: <code>${E(hash || "")}</code>. Declarația acceptată: „${E(CONSENT_TEXT)}” Semnătură electronică simplă, în sensul Regulamentului (UE) nr. 910/2014 (eIDAS).</p>` : ""}`;
}

const DOC_CSS = `.ct-doc{background:#fff;color:#111;border:1.5px solid #e8e3da;border-radius:14px;padding:22px 22px 12px;max-height:480px;overflow:auto;font-size:14.5px;line-height:1.55}
.ct-doc h2{font-size:15.5px;margin:18px 0 6px}.ct-doc .pn-doc-title{font-weight:900;font-size:16px;text-align:center;margin:0 0 14px}
.ct-sign{width:100%;border-collapse:collapse;margin-top:20px}.ct-sign td{width:50%;vertical-align:top;padding:10px;border:1px solid #d6deea;font-size:14px}
.ct-audit{font-size:12.5px;color:#444;border-top:1px solid #ddd;padding-top:10px;margin-top:14px;word-break:break-all}`;

const SIGN_JS = [
  "(function(){var btn=document.getElementById('ctSign');if(!btn)return;var err=document.getElementById('ctErr');",
  "function refresh(){var n=document.getElementById('ctName').value.trim().split(/\\s+/);btn.disabled=!(document.getElementById('ctAgree').checked&&n.length>=2&&n.every(function(w){return w.length>=2;}));}",
  "['ctAgree','ctName'].forEach(function(id){var el=document.getElementById(id);el.addEventListener('input',refresh);el.addEventListener('change',refresh);});",
  "btn.addEventListener('click',function(){err.hidden=true;btn.disabled=true;btn.textContent=btn.getAttribute('data-busy');",
  "fetch('/api/cont/contract/semneaza',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:document.getElementById('ctName').value,agree:document.getElementById('ctAgree').checked})})",
  ".then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});})",
  ".then(function(res){if(res.ok){location.href='/cont/contract?semnat=1';}else{err.textContent=(res.d&&res.d.error)||btn.getAttribute('data-fail');err.hidden=false;btn.textContent=btn.getAttribute('data-label');refresh();}})",
  ".catch(function(){err.textContent=btn.getAttribute('data-fail');err.hidden=false;btn.textContent=btn.getAttribute('data-label');refresh();});});",
  "refresh();})();",
].join("\n");

async function sendMail(to, subject, html) {
  to = [].concat(to || []).filter(Boolean);
  if (!S.RESEND_API_KEY || !to.length) return false;
  const send = async (from) => {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(10000), headers: { Authorization: "Bearer " + S.RESEND_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ from, to, subject, html }) });
    return r.ok;
  };
  try {
    if (await send("Opening Hours Today <" + CONTACT_ADDR + ">")) return true;
    return await send(process.env.BOOKINGS_MAIL_FROM || "Opening Hours Today <cazare@opening-hours-today.eu>");
  } catch (e) { return false; }
}

function ownerPage(req, res, lang, nonce, body, extraScript) {
  const Lg = (ro, en) => (lang === "en" ? en : ro);
  res.set("Content-Security-Policy", L.buildCsp(nonce));
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>${Lg("Contract", "Agreement")} — Opening Hours Today</title><link rel="stylesheet" href="/style.css">
<style>${L.accShellStyles()}
.ct-wrap{max-width:760px}${DOC_CSS}
.ct-card{background:#fff;border:1.5px solid #e8e3da;border-radius:16px;padding:18px;margin:16px 0;color:#111}
.ct-in{display:block;width:100%;box-sizing:border-box;min-height:48px;padding:0 14px;border:1.5px solid #d6deea;border-radius:12px;font-size:16px;font-family:inherit;margin:4px 0 14px}
.ct-lbl{font-weight:700;font-size:14px}
#ctPad{width:100%;max-width:420px;height:130px;border:1.5px dashed #9db8e8;border-radius:12px;background:#fff;touch-action:none;display:block}
.ct-btn{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 22px;border-radius:12px;border:1.5px solid #F0813A;background:#F0813A;color:#fff;font-weight:800;font-size:16px;cursor:pointer;text-decoration:none}
.ct-btn:disabled{background:#f4f4f6;border-color:#dcdfe6;color:#6b7280;cursor:not-allowed}
.ct-btn.ghost{background:#fff;color:#F0813A}
.ct-note{background:#fff7ec;border:1px solid #f0c48e;color:#5a3a10;border-radius:12px;padding:14px 16px;margin:14px 0}
.ct-ok{background:#ecf9f0;border:1px solid #9fd8b0;color:#14532d;border-radius:12px;padding:14px 16px;margin:14px 0}
</style></head><body>
${L.accShellHeader(req.accommodationOwner.email, L.accLangSwitchHtml(req, lang, true), req)}
${L.accDrawerHtml("contract", req.accommodationOwner.email, lang)}
<main class="acc-shell-main"><div class="ct-wrap">${body}</div></main>
<script nonce="${nonce}">(function(){${L.accDrawerScript()}})();</script>
${extraScript ? `<script nonce="${nonce}">${extraScript}</script>` : ""}
</body></html>`);
}

async function hostSigned(ownerId) {
  await ensureTables();
  return (await dbPool.query(`SELECT 1 FROM contracte_semnate WHERE user_id = $1 LIMIT 1`, [ownerId])).rowCount > 0;
}

function mount(app) {
  // ---- stare scurtă (folosită de pagina Setări plăți)
  app.get("/api/cont/contract/stare", L.accommodationGate, L.requireAccommodationOwnerApi, async (req, res) => {
    try {
      if (!dbPool) return res.json({ required: false });
      res.json({ required: REQUIRED, signed: await hostSigned(req.accommodationOwner.ownerId) });
    } catch (e) { res.status(500).json({ error: "server_error" }); }
  });

  // ---- pagina din cont
  app.get("/cont/contract", L.accommodationGate, L.requireAccommodationOwner, async (req, res) => {
    const lang = L.getAccLang(req, res);
    const Lg = (ro, en) => (lang === "en" ? en : ro);
    if (!dbPool) { res.status(503).send("Indisponibil momentan."); return; }
    const nonce = L.generateNonce();
    try {
      await ensureTables();
      const owner = (await dbPool.query(`SELECT * FROM accommodation_owners WHERE id = $1`, [req.accommodationOwner.ownerId])).rows[0] || {};
      const last = (await dbPool.query(`SELECT id, template_hash, contract_version, signed_at, contract_sha256 FROM contracte_semnate WHERE user_id = $1 ORDER BY signed_at DESC LIMIT 1`, [owner.id])).rows[0];
      const h1 = `<h1 class="acc-shell-h1">${Lg("Contractul-cadru", "Framework agreement")}</h1>`;
      const enNote = lang === "en" ? `<div class="ct-note">The agreement is written in Romanian and governed by Romanian law; the Romanian text is the binding one. A summary in English is on the <a href="/parteneri/contract-cadru">partner page</a>.</div>` : "";
      if (last && last.template_hash === TEMPLATE_VERSION) {
        const ok = req.query.semnat ? `<div class="ct-ok">✓ ${Lg("Contractul a fost semnat și ți l-am trimis pe e-mail. Acum poți primi rezervări online, după ce îți activezi plățile.", "The agreement is signed and a copy was sent to your e-mail. You can now receive online bookings once your payments are active.")}</div>` : "";
        return ownerPage(req, res, lang, nonce, `${h1}${enNote}${ok}<div class="ct-ok">✓ ${Lg("Ai semnat contractul-cadru la", "You signed the framework agreement on")} <strong>${E(fmtDate(last.signed_at))}</strong> (${E(last.contract_version)}).</div>
<p><a class="ct-btn" href="/cont/contract/document" target="_blank" rel="noopener">${Lg("Deschide contractul semnat", "Open the signed agreement")}</a> <a class="ct-btn ghost" href="/cont/plati">${Lg("Setări plăți", "Payment settings")}</a></p>
<p style="font-size:13px;color:#555;word-break:break-all">${Lg("Amprentă document (SHA-256)", "Document fingerprint (SHA-256)")}: ${E(last.contract_sha256)}</p>`);
      }
      const platform = await getPlatform();
      if (!platform.ready) {
        return ownerPage(req, res, lang, nonce, `${h1}${enNote}<div class="ct-note">${Lg("Contractul-cadru nu este încă disponibil pentru semnare în cont. Te anunțăm imediat ce platforma își finalizează datele. Între timp îl poți citi pe pagina", "The framework agreement is not yet available for signing. We will let you know as soon as the platform completes its details. Meanwhile you can read it on")} <a href="/parteneri/contract-cadru">${Lg("Contractul-cadru", "Framework agreement")}</a>.</div>`);
      }
      const miss = hostMissing(owner);
      if (miss.length) {
        return ownerPage(req, res, lang, nonce, `${h1}${enNote}<div class="ct-note">${Lg("Pentru a genera contractul, completează mai întâi în Date fiscale:", "To generate the agreement, first fill in your Tax details:")} <strong>${E(miss.join(", "))}</strong>.</div><p><a class="ct-btn" href="/cont/date-fiscale">${Lg("Mergi la Date fiscale", "Go to Tax details")}</a></p>`);
      }
      const doc = buildContractHtml(platform, owner, "");
      const again = last ? `<div class="ct-note">${Lg("Modelul contractului s-a actualizat de la ultima ta semnătură. Citește și semnează noua versiune.", "The agreement template has been updated since you last signed. Please read and sign the new version.")}</div>` : "";
      const must = REQUIRED && !last ? `<div class="ct-note"><strong>${Lg("Pasul 1 pentru a primi rezervări:", "Step 1 to receive bookings:")}</strong> ${Lg("semnează acest contract. Fără contract semnat, cazarea ta nu poate fi rezervată online.", "sign this agreement. Without a signed agreement your property cannot be booked online.")}</div>` : "";
      const form = `<div class="ct-card">
<p>${Lg("Datele tale sunt preluate automat din", "Your details are taken automatically from")} <a href="/cont/date-fiscale">${Lg("Date fiscale", "Tax details")}</a>. ${Lg("Dacă nu sunt corecte, modifică-le acolo și revino aici.", "If they are wrong, change them there and come back.")}</p>
<label class="ct-lbl" for="ctName">${Lg("Numele și prenumele reprezentantului legal", "Full name of the legal representative")}</label><input class="ct-in" id="ctName" maxlength="120" autocomplete="name" placeholder="${Lg("ex. Popescu Ion", "e.g. Popescu Ion")}">
<label style="display:flex;gap:10px;align-items:flex-start;margin:10px 0 16px;font-size:14.5px"><input type="checkbox" id="ctAgree" style="margin-top:4px;width:18px;height:18px;accent-color:#F0813A;flex:none"><span>${E(CONSENT_TEXT)}${lang === "en" ? `<br><em style="color:#555">${E(CONSENT_TEXT_EN)}</em>` : ""}</span></label>
<button type="button" class="ct-btn" id="ctSign" disabled data-label="${Lg("Semnez contractul", "Sign the agreement")}" data-busy="${Lg("Se semnează...", "Signing...")}" data-fail="${Lg("Ceva n-a mers. Încearcă din nou.", "Something went wrong. Please try again.")}">${Lg("Semnez contractul", "Sign the agreement")}</button>
<p id="ctErr" class="submit-place-error" hidden></p></div>`;
      ownerPage(req, res, lang, nonce, `${h1}${enNote}${must}${again}<p>${Lg("Citește contractul de mai jos (derulează în casetă). După ce îl semnezi, primești o copie pe e-mail și o poți deschide oricând din cont.", "Read the agreement below (scroll inside the box). After you sign, you get a copy by e-mail and can open it any time from your account.")}</p><div class="ct-doc">${doc}${signBlockHtml(platform, owner, "", null, "")}</div>${form}`, SIGN_JS);
    } catch (e) {
      console.error("cont/contract:", e.message);
      res.status(500).send(Lg("A apărut o eroare. Te rugăm să încerci din nou puțin mai târziu.", "An error occurred. Please try again a little later."));
    }
  });

  // ---- documentul semnat (exact cel stocat, neschimbat)
  app.get("/cont/contract/document", L.accommodationGate, L.requireAccommodationOwner, async (req, res) => {
    if (!dbPool) { res.status(503).send("Indisponibil momentan."); return; }
    try {
      await ensureTables();
      const r = (await dbPool.query(`SELECT contract_html FROM contracte_semnate WHERE user_id = $1 ORDER BY signed_at DESC LIMIT 1`, [req.accommodationOwner.ownerId])).rows[0];
      if (!r) { res.redirect("/cont/contract"); return; }
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "no-store");
      res.set("X-Robots-Tag", "noindex");
      res.send(standalone(r.contract_html));
    } catch (e) { console.error("contract/document:", e.message); res.status(500).send("Eroare."); }
  });

  // ---- semnare
  app.post("/api/cont/contract/semneaza", L.accommodationGate, L.requireAccommodationOwnerApi, async (req, res) => {
    if (!dbPool) return res.status(503).json({ error: "Indisponibil momentan." });
    try {
      const ip = L.getClientIp(req);
      if (!(await L.checkRateLimit(L.hashIp(ip), "contract-sign", 6, 10))) return res.status(429).json({ error: "Prea multe încercări. Încearcă peste câteva minute." });
      const b = req.body || {};
      const name = clean(b.name, 120);
      const words = name.split(" ");
      if (b.agree !== true) return res.status(400).json({ error: "Trebuie să bifezi acceptul." });
      if (words.length < 2 || words.some((w) => w.length < 2) || /[0-9@<>]/.test(name)) return res.status(400).json({ error: "Scrie numele și prenumele complet (ex. Popescu Ion)." });
      await ensureTables();
      const owner = (await dbPool.query(`SELECT * FROM accommodation_owners WHERE id = $1`, [req.accommodationOwner.ownerId])).rows[0];
      if (!owner) return res.status(404).json({ error: "Cont inexistent." });
      const platform = await getPlatform();
      if (!platform.ready) return res.status(409).json({ error: "Contractul nu este încă disponibil pentru semnare." });
      if (hostMissing(owner).length) return res.status(409).json({ error: "Completează mai întâi Datele fiscale." });
      const last = (await dbPool.query(`SELECT template_hash FROM contracte_semnate WHERE user_id = $1 ORDER BY signed_at DESC LIMIT 1`, [owner.id])).rows[0];
      if (last && last.template_hash === TEMPLATE_VERSION) return res.status(409).json({ error: "Ai semnat deja această versiune." });
      let stripeId = null;
      try { stripeId = ((await dbPool.query(`SELECT stripe_account_id FROM booking_owner_payments WHERE owner_id = $1`, [owner.id])).rows[0] || {}).stripe_account_id || null; } catch (e) { /* tabel absent: încă nu are cont Stripe */ }
      const at = new Date();
      const body = buildContractHtml(platform, owner, name);
      const hash = sha256(body); // amprenta textului brut al contractului din ziua semnării
      const ins = await dbPool.query(`INSERT INTO contracte_semnate (user_id, stripe_user_id, signed_at, signed_ip, user_agent, signer_name, host_name, contract_version, template_hash, contract_sha256, consent_text, contract_body, contract_html)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'') RETURNING id`,
        [owner.id, stripeId, at, String(ip || "").slice(0, 64), clean(req.headers["user-agent"], 300), name, clean(owner.company_name, 255), CONTRACT_VERSION_LABEL, TEMPLATE_VERSION, hash, CONSENT_TEXT, body]);
      const id = ins.rows[0].id;
      const finalHtml = body + signBlockHtml(platform, owner, name, { at, ip, id }, hash);
      await dbPool.query(`UPDATE contracte_semnate SET contract_html = $1 WHERE id = $2`, [finalHtml, id]);
      const to = [owner.billing_email, owner.email].filter((v, i, a) => v && a.indexOf(v) === i);
      sendMail(to, "Contractul-cadru semnat · Opening Hours Today", `<p>Ai semnat electronic contractul-cadru cu Opening Hours Today. Mai jos este o copie; o găsești oricând și în cont, la „Contract”.</p><hr>${standalone(finalHtml, true)}`).catch(() => {});
      sendMail(CONTACT_ADDR, `Contract semnat: ${clean(owner.company_name, 120)}`, `<p>${E(clean(owner.company_name, 120))} (${E(owner.email || "")}) a semnat contractul-cadru. Document #${id}, ${E(CONTRACT_VERSION_LABEL)}, SHA-256 ${E(hash)}.</p>`).catch(() => {});
      res.json({ ok: true, id });
    } catch (e) {
      console.error("contract/semneaza:", e.message);
      res.status(500).json({ error: "A apărut o eroare. Încearcă din nou." });
    }
  });
}

function standalone(inner, noHead) {
  const css = `<style>.ct-sign{width:100%;border-collapse:collapse;margin-top:20px}.ct-sign td{width:50%;vertical-align:top;padding:10px;border:1px solid #bbb;font-size:14px}.ct-audit{font-size:12.5px;color:#444;border-top:1px solid #ddd;padding-top:10px;margin-top:14px;word-break:break-all}body{font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.55;max-width:820px;margin:20px auto;padding:0 16px}h2{font-size:16px;margin:18px 0 6px}.pn-doc-title{font-weight:900;font-size:17px;text-align:center}</style>`;
  if (noHead) return `<div style="font-family:Arial,sans-serif;color:#111;line-height:1.5;font-size:14px">${inner}</div>`;
  return `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Contract-cadru</title>${css}</head><body>${inner}<p style="margin-top:24px"><a href="#" onclick="window.print();return false">Tipărește / salvează ca PDF</a></p></body></html>`;
}

// ---- admin: date platformă + lista contractelor semnate
function mountAdmin(app, deps) {
  app.get("/admin/contracte", async (req, res) => {
    if (!deps.requireAdminPage(req, res)) return;
    if (!dbPool) { res.status(503).send("Baza de date nu e configurată."); return; }
    await ensureTables();
    const p = await getPlatform();
    const rows = (await dbPool.query(`SELECT id, user_id, host_name, signer_name, contract_version, template_hash, signed_at, contract_sha256 AS sha256, signed_ip, stripe_user_id FROM contracte_semnate ORDER BY signed_at DESC LIMIT 300`)).rows;
    const counts = await deps.getAdminCounts();
    const inputs = PLATFORM_FIELDS.map(([k, label, max, req2]) => `<label style="display:block;font-weight:700;margin-top:10px">${E(label)}${req2 ? " *" : ""}</label><input data-k="${k}" maxlength="${max}" value="${E(p[k] || "")}" style="width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid #888;font-size:15px">`).join("");
    const list = rows.map((r) => `<div class="admin-submission-card"><div class="admin-submission-header"><span class="admin-submission-type">📝 ${E(r.host_name || "—")}</span><span class="admin-submission-meta">${E(fmtDate(r.signed_at))}</span></div><div class="admin-submission-meta">Semnat de ${E(r.signer_name)} · ${E(r.contract_version)}${r.template_hash === TEMPLATE_VERSION ? "" : " (versiune veche)"} · IP ${E(r.signed_ip || "—")} · cont ${r.user_id}${r.stripe_user_id ? " · " + E(r.stripe_user_id) : ""} · <a href="/admin/contracte/${r.id}" target="_blank" rel="noopener">deschide documentul</a></div><div class="admin-submission-meta" style="word-break:break-all">SHA-256: ${E(r.sha256)}</div></div>`).join("") || "<p>Niciun contract semnat încă.</p>";
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Contracte — Admin</title><style>${deps.adminShellStyles()}</style></head><body><div class="admin-shell">
${deps.adminSidebarHtml("contracte", counts)}
<div style="flex:1">${deps.adminMobileBarHtml()}<div class="admin-main">
<h1 class="admin-h1">📝 Contracte-cadru</h1>
<p class="admin-submission-meta">${p.ready ? "✓ Datele platformei sunt complete — gazdele pot semna." : "⚠ Gazdele NU pot semna până nu completezi câmpurile marcate cu * — și, până atunci, NU pot primi rezervări online."} ${REQUIRED ? "Regula „fără contract semnat nu se primesc rezervări” este ACTIVĂ." : "Regula contractului obligatoriu este oprită (CONTRACT_REQUIRED=false)."} Datele apar în contract ca „Platforma”. Versiunea curentă a modelului: <strong>${E(TEMPLATE_VERSION)}</strong>.</p>
<div class="admin-submission-card"><h2 style="margin:0 0 6px">Datele platformei (firma)</h2>${inputs}
<button type="button" class="admin-approve-btn" id="ctSave" style="margin-top:14px">Salvează</button> <span id="ctMsg" class="admin-submission-meta"></span></div>
<h2 style="margin:22px 0 8px">Contracte semnate (${rows.length})</h2>${list}
</div></div></div>
<script>(function(){${deps.adminSidebarScript()}
document.getElementById("ctSave").addEventListener("click",function(){var o={};document.querySelectorAll("input[data-k]").forEach(function(i){o[i.getAttribute("data-k")]=i.value;});var m=document.getElementById("ctMsg");m.textContent="Se salvează...";
fetch("/api/admin/contracte/setari",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)}).then(function(r){return r.json();}).then(function(d){m.textContent=d&&d.ok?(d.ready?"Salvat. Contractul e activ pentru gazde.":"Salvat. Mai lipsesc câmpuri obligatorii."):((d&&d.error)||"Eroare");}).catch(function(){m.textContent="Eroare";});});
})();</script></body></html>`);
  });

  app.post("/api/admin/contracte/setari", async (req, res) => {
    if (!deps.requireAdminApi(req, res)) return;
    try {
      if (!dbPool) return res.status(503).json({ error: "Baza de date nu e configurată." });
      await ensureTables();
      const b = req.body || {};
      for (const [k, , max] of PLATFORM_FIELDS) {
        const v = clean(b[k], max);
        await dbPool.query(`INSERT INTO platform_settings (k, v, updated_at) VALUES ($1,$2,now()) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v, updated_at = now()`, ["contract_" + k, v]);
      }
      const p = await getPlatform();
      res.json({ ok: true, ready: p.ready });
    } catch (e) { console.error("admin/contracte setari:", e.message); res.status(500).json({ error: "server_error" }); }
  });

  app.get("/admin/contracte/:id", async (req, res) => {
    if (!deps.requireAdminPage(req, res)) return;
    const id = /^\d{1,9}$/.test(req.params.id) ? Number(req.params.id) : 0;
    if (!id || !dbPool) { res.status(400).send("Cerere invalidă."); return; }
    await ensureTables();
    const r = (await dbPool.query(`SELECT contract_html FROM contracte_semnate WHERE id = $1`, [id])).rows[0];
    if (!r) { res.status(404).send("Negăsit."); return; }
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "no-store");
    res.send(standalone(r.contract_html));
  });
}

ensureTables().catch(() => {}); // pornește crearea tabelelor imediat ce modulul e încărcat (și rezervările îl așteaptă prin ensureTables)
module.exports = { mount, mountAdmin, buildContractHtml, signBlockHtml, getPlatform, TEMPLATE_VERSION, CONTRACT_VERSION_LABEL, CONSENT_TEXT, hostMissing, hostSigned, ensureTables, SIGNED_SQL, REQUIRED };

// Revendicarea paginilor propuse de comunitate — cu dovadă de proprietate (la fel pentru toate țările) +
// editorul „Editează pagina mea” (modificările trec prin aprobarea adminului) + contestații.
// Montat din server.js: require("./_parts/claims").mount(app, deps).
// Rulează pe ambele domenii (programul-de-azi.ro și opening-hours-today.eu): linkurile sunt relative.
"use strict";
const crypto = require("crypto");
const express = require("express");
const S = require("./static");
const L = require("./logic");

const dbPool = S.dbPool;
const E = L.escapeHtml;
const SECRET = () => S.ACCOMMODATION_SESSION_SECRET || "dev-secret";
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F<>]/g, " ").replace(/[ \t]+/g, " ").trim().slice(0, max);
const cleanMulti = (v, max) => String(v == null ? "" : v).replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const hmac = (s) => crypto.createHmac("sha256", SECRET()).update(String(s)).digest("hex");
const ROLES = ["owner", "manager", "employee"];

// ---------- cine poate fi revendicat ----------
// restaurante / cafenele: automat; plajele: niciodată; obiective și „altceva”: doar cu bifa adminului (claimable = true)
function isClaimable(row) {
  if (!row || row.type === "beach") return false;
  const c = row.claimable;
  const v = c === true || c === "true" ? true : (c === false || c === "false" ? false : null);
  if (v !== null) return v;
  return row.type === "restaurant" || row.type === "cafe";
}

// ---------- date de identificare: formate și verificări ----------
const NON_EU = new Set(["uk", "ch", "tr"]);
function taxKindFor(cc) { cc = String(cc || "").toLowerCase(); return cc === "ro" ? "ro" : (NON_EU.has(cc) ? "other" : "eu"); }
function vatPrefixFor(cc) { cc = String(cc || "").toLowerCase(); return cc === "gr" ? "EL" : cc.toUpperCase(); }
// întoarce { ok, value, digits?, prefix? }
function normalizeTaxId(kind, cc, raw) {
  let s = String(raw == null ? "" : raw).trim();
  if (kind === "ro") {
    s = s.toUpperCase().replace(/[\s.\-]/g, "").replace(/^RO/, "");
    return /^\d{2,10}$/.test(s) ? { ok: true, value: "RO" + s, digits: s } : { ok: false };
  }
  if (kind === "eu") {
    s = s.toUpperCase().replace(/[\s.\-]/g, "");
    if (!/^[A-Z]{2}/.test(s)) s = vatPrefixFor(cc) + s;
    if (!/^[A-Z]{2}[A-Z0-9]{2,12}$/.test(s)) return { ok: false };
    return { ok: true, value: s, prefix: s.slice(0, 2), digits: s.slice(2) };
  }
  s = s.replace(/\s+/g, " ");
  return /^[A-Za-z0-9 ./\-]{3,40}$/.test(s) ? { ok: true, value: s } : { ok: false };
}
const FREE_MAIL = new Set(["gmail.com", "googlemail.com", "yahoo.com", "yahoo.ro", "yahoo.de", "yahoo.fr", "yahoo.it", "yahoo.es", "yahoo.co.uk", "ymail.com", "outlook.com", "outlook.de", "hotmail.com", "hotmail.de", "hotmail.fr", "hotmail.it", "hotmail.es", "hotmail.co.uk", "live.com", "live.fr", "msn.com", "icloud.com", "me.com", "mac.com", "proton.me", "protonmail.com", "pm.me", "aol.com", "gmx.com", "gmx.de", "gmx.at", "gmx.net", "gmx.ch", "web.de", "mail.com", "mail.ru", "yandex.com", "yandex.ru", "abv.bg", "zoho.com", "t-online.de", "freenet.de", "orange.fr", "wanadoo.fr", "free.fr", "sfr.fr", "laposte.net", "libero.it", "virgilio.it", "tiscali.it", "rdslink.ro", "email.ro", "bluewin.ch", "sapo.pt", "wp.pl", "o2.pl", "interia.pl", "seznam.cz", "centrum.cz", "freemail.hu", "tutanota.com", "fastmail.com"]);
const isFreeMail = (d) => FREE_MAIL.has(String(d || "").toLowerCase()) || /^(gmail|yahoo|hotmail|outlook|icloud|protonmail|gmx)\.[a-z]{2,3}(\.[a-z]{2})?$/.test(String(d || "").toLowerCase());
const domainOf = (email) => { const m = /@([^@\s]+)$/.exec(String(email || "").toLowerCase()); return m ? m[1] : ""; };
function hostOf(url) { try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch (e) { return ""; } }
function baseDomain(h) {
  const p = String(h || "").split(".").filter(Boolean);
  if (p.length <= 2) return p.join(".");
  const sld = p[p.length - 2];
  if (["co", "com", "org", "net", "gov", "ac"].includes(sld) && p[p.length - 1].length === 2) return p.slice(-3).join(".");
  return p.slice(-2).join(".");
}
function emailDomainStatus(email, link) {
  const d = domainOf(email);
  if (!d) return { status: "n/a" };
  if (isFreeMail(d)) return { status: "free", domain: d };
  const h = hostOf(link);
  if (!h) return { status: "nolink", domain: d };
  return baseDomain(h) === baseDomain(d) ? { status: "match", domain: d, site: h } : { status: "mismatch", domain: d, site: h };
}
const normTxt = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
function nameOverlap(claimed, official) {
  const stop = new Set(["SRL", "SA", "PFA", "SCS", "SNC", "II", "GMBH", "LTD", "SARL", "SAS", "SL", "AG", "KG", "OG", "BV", "SPA", "SRLS", "ASOCIATIA"]);
  const tok = (s) => normTxt(s).replace(/[^A-Z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !stop.has(w));
  const a = tok(claimed), b = new Set(tok(official));
  if (!a.length || !b.size) return null;
  return a.filter((w) => b.has(w)).length / a.length >= 0.5;
}

let fetchFn = (...a) => fetch(...a);
function __setFetch(f) { fetchFn = f; }
const isoToday = () => new Date().toISOString().slice(0, 10);

// verificare automată a codului fiscal: ANAF (România) sau VIES (UE); orice eroare => „unavailable”, cererea nu se blochează
async function checkTax(kind, norm, placeCity, claimedName) {
  const out = { kind, status: "skipped" };
  if (!norm || !norm.ok) return out;
  try {
    if (kind === "ro") {
      out.kind = "ro-anaf";
      const r = await fetchFn("https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify([{ cui: Number(norm.digits), data: isoToday() }]), signal: AbortSignal.timeout(7000),
      });
      if (!r.ok) throw new Error("anaf " + r.status);
      const j = await r.json();
      const f = j && Array.isArray(j.found) ? j.found[0] : null;
      if (!f || !f.date_generale) { out.status = "invalid"; return out; }
      const g = f.date_generale;
      out.status = "ok"; out.name = clean(g.denumire, 200); out.address = clean(g.adresa, 300);
      out.active = !(f.stare_inactiv && f.stare_inactiv.statusInactivi === true);
      out.cityMatch = placeCity ? normTxt(out.address).includes(normTxt(placeCity)) : null;
      out.nameMatch = nameOverlap(claimedName, out.name);
      return out;
    }
    if (kind === "eu") {
      out.kind = "eu-vies";
      const r = await fetchFn("https://ec.europa.eu/taxation_customs/vies/rest-api/ms/" + encodeURIComponent(norm.prefix) + "/vat/" + encodeURIComponent(norm.digits), {
        headers: { Accept: "application/json" }, signal: AbortSignal.timeout(7000),
      });
      if (!r.ok) throw new Error("vies " + r.status);
      const j = await r.json();
      if (j && j.userError && !/^VALID$/i.test(String(j.userError)) && j.isValid !== true && j.valid !== true) {
        out.status = /INVALID/i.test(String(j.userError)) ? "invalid" : "unavailable"; return out;
      }
      const valid = j && (j.isValid === true || j.valid === true);
      if (!valid) { out.status = "invalid"; return out; }
      out.status = "ok";
      const nm = clean(j.name, 200), ad = clean(String(j.address || "").replace(/\n+/g, ", "), 300);
      out.name = /^-+$/.test(nm) ? "" : nm; out.address = /^-+$/.test(ad) ? "" : ad;
      out.cityMatch = out.address && placeCity ? normTxt(out.address).includes(normTxt(placeCity)) : null;
      out.nameMatch = out.name ? nameOverlap(claimedName, out.name) : null;
      return out;
    }
  } catch (e) { out.status = "unavailable"; out.detail = clean(e && e.message, 80); }
  return out;
}
const phoneKey = (p) => String(p || "").replace(/[^\d+]/g, "");
async function buildAutoChecks(c, place) {
  const kind = c.noTax ? "none" : taxKindFor(place.country_code);
  const norm = c.noTax ? null : normalizeTaxId(kind, place.country_code, c.taxId);
  const tax = c.noTax ? { kind: "none", status: "skipped" } : await checkTax(kind, norm, place.city, c.companyName);
  const out = { at: new Date().toISOString(), tax, emailDomain: c.proofKind === "email" ? emailDomainStatus(c.proofEmail, c.officialLink) : { status: "n/a" }, duplicates: { tax: [], phone: [] } };
  try {
    if (!c.noTax && c.taxId) {
      const q = await dbPool.query(`SELECT DISTINCT proposal_id FROM place_claims WHERE proposal_id <> $1::integer AND tax_id = $2 LIMIT 10`, [place.id, c.taxId]);
      out.duplicates.tax = q.rows.map((x) => x.proposal_id);
    }
    if (c.phone) {
      const q = await dbPool.query(`SELECT DISTINCT proposal_id FROM place_claims WHERE proposal_id <> $1::integer AND regexp_replace(COALESCE(phone, ''), '[^0-9+]', '', 'g') = $2 LIMIT 10`, [place.id, phoneKey(c.phone)]);
      out.duplicates.phone = q.rows.map((x) => x.proposal_id);
    }
  } catch (e) { /* coloanele apar după rularea SQL-ului */ }
  return out;
}

// ---------- cod de verificare pe e-mail (fără tabel: token semnat HMAC cu secretul serverului) ----------
function makeEmailToken(ownerId, proposalId, email) {
  const code = String(crypto.randomInt(100000, 1000000));
  const salt = crypto.randomBytes(6).toString("hex");
  const payload = { o: ownerId, p: proposalId, e: email, s: salt, h: hmac(["code", ownerId, proposalId, email, salt, code].join(":")), x: Date.now() + 15 * 60 * 1000 };
  return { code, token: L.signCookiePayload(JSON.stringify(payload), SECRET()) };
}
function readEmailToken(token, code, ownerId, proposalId) {
  try {
    const raw = L.verifyCookiePayload(String(token || ""), SECRET());
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || p.o !== ownerId || p.p !== proposalId || !(p.x > Date.now()) || !/^\d{6}$/.test(String(code || ""))) return null;
    const want = hmac(["code", p.o, p.p, p.e, p.s, String(code)].join(":"));
    const a = Buffer.from(want), b = Buffer.from(String(p.h || ""));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return p.e;
  } catch (e) { return null; }
}
// cod personal pentru poza de dovadă (același la fiecare afișare, nu se stochează în avans)
function proofCodeFor(ownerId, proposalId) {
  const h = Buffer.from(hmac("proof:" + ownerId + ":" + proposalId), "hex");
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += A[h[i] % A.length];
  return "OHT-" + s;
}

// ---------- acces la loc ----------
async function loadPlace(id) {
  const q = await dbPool.query(
    `SELECT p.id, p.type, p.name, p.city, p.country_code, p.claimed_by_owner_id, to_jsonb(p)->>'claimable' AS claimable
       FROM pending_submissions p WHERE p.id = $1::integer AND p.status = 'approved'`, [id]);
  return q.rows[0] || null;
}
const photosOf = (r) => {
  const out = [];
  const add = (u) => { if (typeof u === "string" && u && !out.includes(u)) out.push(u); };
  add(r.photo_url);
  let more = r.photo_urls; if (typeof more === "string") { try { more = JSON.parse(more); } catch (e) { more = []; } }
  if (Array.isArray(more)) more.forEach(add);
  return out;
};
const parseJson = (v) => { if (v && typeof v === "object") return v; try { return v ? JSON.parse(v) : null; } catch (e) { return null; } };

// ---------- încărcare fișiere (poze dovadă / poze pagină / meniu PDF) ----------
const IMG_TYPES = S.ACCOMMODATION_PHOTO_TYPES || { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
async function storeUpload(deps, req, res, folder, allowPdf) {
  const en = L.getAccLang(req) === "en";
  const contentType = String(req.headers["content-type"] || "").split(";")[0].trim();
  const ext = IMG_TYPES[contentType] || (allowPdf && contentType === "application/pdf" ? "pdf" : null);
  if (!ext || !Buffer.isBuffer(req.body) || !req.body.length || !L.fileMatchesDeclaredType(req.body, contentType)) {
    res.status(400).json({ error: en ? "Not a valid JPG/PNG/WEBP photo" + (allowPdf ? " or PDF" : "") + " (or too large)." : "Fișierul nu e o poză JPG/PNG/WEBP" + (allowPdf ? " sau PDF" : "") + " validă (sau e prea mare)." });
    return;
  }
  const put = await deps.getBlobPut();
  if (!put) { res.status(503).json({ error: en ? "Uploads are not available right now." : "Încărcarea nu e disponibilă momentan." }); return; }
  try {
    const blob = await put(`${folder}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`, req.body, { access: "public", token: S.BLOB_READ_WRITE_TOKEN, addRandomSuffix: true, contentType });
    res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error("claims upload:", err && err.message);
    res.status(500).json({ error: en ? "Upload failed. Please try again." : "Încărcarea a eșuat. Încearcă din nou." });
  }
}

// ---------- CSS / JS comune ----------
const PAGE_CSS = `
.cl-card{max-width:640px;background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:16px;padding:24px;margin-bottom:24px;}
.cl-card h2{margin:0 0 6px;font-size:21px;}.cl-card h3{margin:22px 0 8px;font-size:16px;}.cl-place{font-weight:800;font-size:17px;margin:14px 0 2px;}.cl-meta{color:var(--muted);font-size:14px;margin:0 0 14px;}
.cl-note{font-size:14px;line-height:1.55;margin:0 0 14px;}.cl-hint{font-size:12.5px;line-height:1.5;color:var(--muted);margin:4px 0 0;}
.cl-field{display:flex;flex-direction:column;gap:5px;margin:12px 0;font-size:14px;font-weight:700;}
.cl-in{width:100%;box-sizing:border-box;padding:12px 13px;border-radius:10px;border:1.5px solid var(--glass-border);background:rgba(255,255,255,.06);color:inherit;font:inherit;font-weight:500;font-size:15px;}
textarea.cl-in{min-height:110px;resize:vertical;}select.cl-in option{color:#111;}
.cl-row{display:flex;gap:10px;flex-wrap:wrap;}.cl-row>*{flex:1 1 200px;}
.cl-check{display:flex;gap:10px;align-items:flex-start;font-size:14px;font-weight:600;line-height:1.5;margin:12px 0;}.cl-check input{margin-top:4px;flex:0 0 auto;}
.cl-btn{display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none;background:var(--accent);color:#fff;border:none;border-radius:12px;padding:14px;font-weight:800;font-size:15px;cursor:pointer;margin-top:10px;}
.cl-btn[disabled]{opacity:.55;cursor:default;}.cl-btn.ghost{background:none;color:inherit;border:1.5px solid var(--glass-border);}.cl-btn.small{display:inline-block;width:auto;padding:10px 16px;margin:0;font-size:14px;}
.cl-ok{color:#2e9e5b;font-weight:800;}.cl-err{color:#d64545;font-size:14px;margin-top:8px;}
.cl-proof{border:1.5px solid var(--glass-border);border-radius:12px;padding:12px 14px;margin:8px 0;}.cl-proof label.cl-pk{display:flex;gap:10px;align-items:flex-start;font-weight:700;font-size:14.5px;cursor:pointer;}.cl-proof .cl-pbody{margin:10px 0 2px 26px;}
.cl-code{display:inline-block;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:22px;font-weight:800;letter-spacing:2px;padding:8px 14px;border-radius:10px;border:2px dashed var(--accent);margin:6px 0;}
.cl-thumbs{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;}.cl-th{position:relative;width:96px;height:72px;border-radius:8px;overflow:hidden;border:1px solid var(--glass-border);}.cl-th img{width:100%;height:100%;object-fit:cover;display:block;}
.cl-th button{position:absolute;top:2px;right:2px;width:24px;height:24px;border-radius:50%;border:none;background:rgba(0,0,0,.65);color:#fff;cursor:pointer;font-size:13px;line-height:1;}
.cl-warn{background:rgba(255,193,7,.12);border:1.5px solid rgba(255,193,7,.55);border-radius:12px;padding:12px 14px;font-size:14px;line-height:1.5;margin:0 0 16px;}
.cl-days{display:grid;gap:8px;margin:8px 0;}.cl-day{display:grid;grid-template-columns:96px 1fr 1fr auto;gap:8px;align-items:center;font-size:14px;}.cl-day .cl-in{padding:8px 9px;font-size:14px;}.cl-day label{display:flex;gap:6px;align-items:center;font-weight:600;white-space:nowrap;}
@media(max-width:560px){.cl-day{grid-template-columns:1fr 1fr;}.cl-day>span{grid-column:1/-1;font-weight:800;}}
`;
// client: redimensionare + încărcare (fără backticks și fără dolar-acolada, e text în șablon)
const CLIENT_UPLOAD_JS = `
function clResize(file, maxSide, q){
  return new Promise(function(resolve, reject){
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function(){
      var w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, maxSide / Math.max(w, h));
      var c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob(function(b){ if (b) resolve(b); else reject(new Error("img")); }, "image/jpeg", q);
    };
    im.onerror = function(){ reject(new Error("img")); };
    im.src = url;
  });
}
function clPost(url, body, type){
  return fetch(url, { method: "POST", headers: { "Content-Type": type }, body: body })
    .then(function(r){ return r.json().then(function(x){ return { ok: r.ok, x: x }; }); });
}
`;

// ---------- montare ----------
function mount(app, deps) {
  const gate = L.accommodationGate;
  const ownerPage = L.requireAccommodationOwner;
  const ownerApi = L.requireAccommodationOwnerApi;
  const slug = deps.slugifyPlaceName;
  const imgRaw = express.raw({ type: Object.keys(IMG_TYPES), limit: "6mb" });
  const fileRaw = express.raw({ type: Object.keys(IMG_TYPES).concat(["application/pdf"]), limit: "8mb" });
  const shell = (req, lang, title, inner, scriptBody) => {
    const nonce = req.__nonce;
    return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>${E(title)} — Opening Hours Today</title><link rel="stylesheet" href="/style.css">
<style>${L.accShellStyles()}${PAGE_CSS}</style></head>
<body>
${L.accShellHeader(req.accommodationOwner.email, L.accLangSwitchHtml(req, lang, true), req)}
${L.accDrawerHtml("proprietati", req.accommodationOwner.email, lang)}
<main class="acc-shell-main">${inner}</main>
<script nonce="${nonce}">${L.accDrawerScript()}
${scriptBody || ""}</script></body></html>`;
  };
  const begin = (req, res) => { req.__nonce = L.generateNonce(); res.set("Content-Security-Policy", L.buildCsp(req.__nonce)); res.set("Content-Type", "text/html; charset=utf-8"); };

  // ===== 1) cerere de revendicare (pagină) =====
  app.get("/cont/revendica", gate, ownerPage, async (req, res) => {
    const lang = L.getAccLang(req, res);
    const T = (ro, en) => (lang === "en" ? en : ro);
    const id = L.getClaimCookieId(req);
    if (!id || !dbPool) { res.redirect("/cont"); return; }
    let place = null, existing = null;
    try {
      place = await loadPlace(id);
      const c = await dbPool.query(`SELECT * FROM place_claims WHERE owner_id = $1::integer AND proposal_id = $2::integer`, [req.accommodationOwner.ownerId, id]);
      existing = c.rows[0] || null;
    } catch (e) { /* tabelele apar după rularea SQL-urilor */ }
    if (!place || !isClaimable(place)) { L.appendSetCookie(res, "claimPlace=; Path=/; Max-Age=0; SameSite=Lax; Secure"); res.redirect("/cont"); return; }
    const ownerId = req.accommodationOwner.ownerId;
    const mine = place.claimed_by_owner_id === ownerId;
    const taken = place.claimed_by_owner_id && !mine;
    const needsInfo = existing && existing.status === "pending" && existing.info_request;
    const state = mine ? "mine" : taken ? "taken" : existing && existing.status === "pending" && !needsInfo ? "pending" : existing && existing.status === "rejected" ? "rejected" : "form";
    begin(req, res);
    const pageHref = "/loc/" + place.id + "-" + slug(place.name);
    const kind = taxKindFor(place.country_code);
    const taxLabel = kind === "ro" ? "CUI" : kind === "eu" ? T("Cod TVA (ex. ATU12345678)", "VAT number (e.g. ATU12345678)") : T("Număr de înregistrare al firmei", "Company registration number");
    const x = existing || {};
    const head = `<h2>${T("Revendică această pagină", "Claim this page")}</h2>
      <div class="cl-place">${E(place.name)}</div>
      <p class="cl-meta">${E(L.proposalTypeLabel(place, lang !== "en"))} · ${E(place.city)} · <a href="${pageHref}" target="_blank" rel="noopener">${T("vezi pagina", "view the page")}</a></p>`;
    let body;
    if (state === "mine") body = `<p class="cl-ok">✓ ${T("Pagina este deja a ta.", "This page is already yours.")}</p><a class="cl-btn" href="/cont/pagina/${place.id}">${T("Editează pagina", "Edit the page")}</a>`;
    else if (state === "taken") body = `<p class="cl-note">${T("Această pagină a fost deja revendicată de un alt proprietar. Dacă crezi că e o greșeală, folosește butonul „Contestă” de pe pagina publică sau scrie-ne la contact.", "This page has already been claimed by another owner. If you think this is a mistake, use the “Dispute” button on the public page or contact us.")}</p>`;
    else if (state === "pending") body = `<p class="cl-note">⏳ ${T("Ai deja o cerere în verificare pentru această pagină. Te anunțăm pe e-mail imediat ce echipa o analizează.", "You already have a request under review for this page. We will email you as soon as the team has looked at it.")}</p>`;
    else if (state === "rejected") body = `<p class="cl-note">${T("Cererea ta pentru această pagină a fost analizată și nu a putut fi aprobată. Dacă ai date noi, scrie-ne la contact.", "Your request for this page was reviewed and could not be approved. If you have new information, please contact us.")}</p>`;
    else {
      const code = proofCodeFor(ownerId, place.id);
      const pk = x.proof_kind || "email";
      body = `${needsInfo ? `<div class="cl-warn"><strong>${T("Echipa are nevoie de mai multe date:", "The team needs more information:")}</strong><br>${E(x.info_request)}</div>` : ""}
      <p class="cl-note">${T("Ca să ne asigurăm că pagina ajunge la proprietarul real, completează datele de mai jos. Echipa le verifică (de obicei în maximum 24 de ore). După aprobare poți <strong>răspunde la recenzii</strong> și poți <strong>completa pagina</strong> (poze, program, meniu, contact).", "To make sure the page goes to the real owner, please fill in the details below. The team checks them (usually within 24 hours). After approval you can <strong>reply to reviews</strong> and <strong>complete the page</strong> (photos, hours, menu, contact).")}</p>
      <form id="clForm" novalidate>
        <h3>${T("1. Cine ești", "1. Who you are")}</h3>
        <label class="cl-field">${T("Nume și prenume", "Full name")}<input class="cl-in" id="clName" maxlength="120" autocomplete="name" value="${E(x.full_name || "")}"></label>
        <div class="cl-row">
          <label class="cl-field">${T("Rolul tău", "Your role")}<select class="cl-in" id="clRole">
            <option value="owner"${x.role === "owner" || !x.role ? " selected" : ""}>${T("Proprietar", "Owner")}</option>
            <option value="manager"${x.role === "manager" ? " selected" : ""}>${T("Administrator / manager", "Manager")}</option>
            <option value="employee"${x.role === "employee" ? " selected" : ""}>${T("Angajat împuternicit", "Authorised employee")}</option></select></label>
          <label class="cl-field">${T("Telefon (cu prefix de țară)", "Phone (with country code)")}<input class="cl-in" id="clPhone" type="tel" maxlength="30" placeholder="+40 7xx xxx xxx" autocomplete="tel" value="${E(x.phone || "")}"></label>
        </div>
        <h3>${T("2. Afacerea", "2. The business")}</h3>
        <label class="cl-check"><input type="checkbox" id="clNoTax"${x.no_tax ? " checked" : ""}><span>${T("Nu am cod fiscal (PFA mic / altă țară). Atunci dovada prin poză sau captură de ecran e obligatorie.", "I don't have a tax ID (small sole trader / other country). In that case a photo or screenshot proof is required.")}</span></label>
        <div id="clTaxBox">
          <label class="cl-field">${T("Denumirea legală a firmei (SRL / PFA etc.)", "Legal company name")}<input class="cl-in" id="clCompany" maxlength="200" value="${E(x.company_name || "")}"></label>
          <label class="cl-field">${E(taxLabel)}<input class="cl-in" id="clTax" maxlength="40" value="${E(x.tax_id || "")}"></label>
        </div>
        <label class="cl-field">${T("Website sau pagină oficială a locului (Facebook, Instagram, Google Maps)", "Official website or page of the place (Facebook, Instagram, Google Maps)")}<input class="cl-in" id="clLink" type="url" maxlength="500" placeholder="https://" value="${E(x.official_link || "")}"></label>
        <h3>${T("3. Dovada că ești proprietarul (alege una)", "3. Proof that you are the owner (choose one)")}</h3>
        <div class="cl-proof" id="clPA"><label class="cl-pk"><input type="radio" name="clPk" value="email"${pk === "email" ? " checked" : ""}><span>${T("A. E-mail pe domeniul afacerii", "A. E-mail on the business's own domain")}</span></label>
          <div class="cl-pbody" data-for="email">
            <p class="cl-hint">${T("O adresă de forma contact@restaurantul-tau.ro, nu gmail / yahoo / outlook. Îți trimitem un cod de 6 cifre.", "An address like contact@your-restaurant.com, not gmail / yahoo / outlook. We send you a 6-digit code.")}</p>
            <div class="cl-row"><input class="cl-in" id="clEmail" type="email" maxlength="200" placeholder="contact@…" value="${E(x.proof_email || "")}"><button type="button" class="cl-btn small" id="clSendCode">${T("Trimite codul", "Send code")}</button></div>
            <div class="cl-row" id="clCodeRow" hidden style="margin-top:8px"><input class="cl-in" id="clCode" inputmode="numeric" maxlength="6" placeholder="${T("Cod din e-mail", "Code from the e-mail")}"></div>
            <p class="cl-hint" id="clCodeMsg"></p></div></div>
        <div class="cl-proof"><label class="cl-pk"><input type="radio" name="clPk" value="photo"${pk === "photo" ? " checked" : ""}><span>${T("B. Poză făcută la locație, cu codul tău", "B. A photo taken at the place, with your code")}</span></label>
          <div class="cl-pbody" data-for="photo" hidden>
            <p class="cl-hint">${T("Scrie acest cod pe o hârtie și fotografiază-o în fața intrării sau lângă meniu / panou, astfel încât să se vadă și locul:", "Write this code on a piece of paper and photograph it at the entrance or next to the menu / sign, so that the place is visible too:")}</p>
            <div class="cl-code">${E(code)}</div></div></div>
        <div class="cl-proof"><label class="cl-pk"><input type="radio" name="clPk" value="screenshot"${pk === "screenshot" ? " checked" : ""}><span>${T("C. Captură de ecran din contul de administrator", "C. A screenshot from your admin account")}</span></label>
          <div class="cl-pbody" data-for="screenshot" hidden>
            <p class="cl-hint">${T("Din Google Business Profile, Facebook Page sau Instagram, unde apari ca administrator și se vede numele locului.", "From Google Business Profile, a Facebook Page or Instagram, where you appear as an administrator and the name of the place is visible.")}</p></div></div>
        <div id="clUpBox" hidden>
          <label class="cl-btn small ghost" style="cursor:pointer;display:inline-block">📷 ${T("Adaugă poze (maximum 3)", "Add photos (max 3)")}<input type="file" accept="image/*" multiple id="clFile" hidden></label>
          <div class="cl-thumbs" id="clThumbs"></div><p class="cl-hint" id="clUpMsg"></p></div>
        <label class="cl-check" style="margin-top:18px"><input type="checkbox" id="clConsent"><span>${T("Declar că sunt proprietarul sau reprezentantul autorizat al acestui loc și că datele sunt corecte. Accept ca echipa să folosească datele și pozele de dovadă doar pentru verificare (le văd doar administratorii; pozele de dovadă se șterg automat după decizie).", "I declare that I am the owner or an authorised representative of this place and that the details are correct. I agree that the team uses the details and proof photos only for verification (only administrators see them; proof photos are deleted automatically after the decision).")}</span></label>
        <button type="button" class="cl-btn" id="clSend">${T("Trimite cererea de revendicare", "Send the claim request")}</button>
        <a class="cl-btn ghost" href="/cont" id="clCancel">${T("Renunță", "Cancel")}</a><p class="cl-err" id="clErr" hidden></p>
      </form>`;
    }
    const msgs = {
      invalid_name: T("Scrie numele și prenumele.", "Enter your full name."), invalid_role: T("Alege rolul.", "Choose your role."),
      invalid_phone: T("Telefon invalid (cu prefix de țară, minim 7 cifre).", "Invalid phone (with country code, at least 7 digits)."),
      invalid_company: T("Completează denumirea firmei.", "Enter the company name."), invalid_tax: T("Codul fiscal nu are formatul corect.", "The tax ID format is not valid."),
      invalid_link: T("Adaugă un link oficial valid (începe cu https://).", "Add a valid official link (starting with https://)."),
      invalid_proof: T("Completează dovada aleasă (cod e-mail corect sau cel puțin o poză).", "Complete the chosen proof (correct e-mail code or at least one photo)."),
      bad_code: T("Codul din e-mail nu e corect sau a expirat. Cere un cod nou.", "The e-mail code is wrong or has expired. Request a new code."),
      free_mail: T("Folosește o adresă pe domeniul afacerii, nu gmail / yahoo / outlook.", "Use an address on the business's own domain, not gmail / yahoo / outlook."),
      email_failed: T("Nu am putut trimite e-mailul. Încearcă din nou.", "We could not send the e-mail. Please try again."),
      consent: T("Bifează declarația.", "Tick the declaration."), too_many_pending: T("Ai deja 3 cereri în verificare. Așteaptă decizia echipei.", "You already have 3 requests under review. Please wait for the team's decision."),
      taken: T("Pagina e deja revendicată.", "This page is already claimed."), pending: T("Ai deja o cerere în verificare.", "You already have a request under review."),
      not_found: T("Pagina nu poate fi revendicată.", "This page cannot be claimed."), run_sql: T("Funcția nu e activată încă.", "This feature is not enabled yet."),
      too_many_requests: T("Prea multe încercări. Reîncearcă mai târziu.", "Too many attempts. Please try again later."), generic: T("Nu s-a putut trimite. Încearcă din nou.", "Could not send. Please try again."),
      no_tax_proof: T("Fără cod fiscal, dovada prin poză sau captură este obligatorie.", "Without a tax ID, a photo or screenshot proof is required."),
    };
    const js = `${CLIENT_UPLOAD_JS}
(function(){
  var PID = ${Number(place.id)}, MSG = ${L.safeJson(msgs)}, proofUrls = ${L.safeJson(Array.isArray(parseJson(x.proof_urls)) ? parseJson(x.proof_urls) : [])}, token = "";
  var $ = function(i){ return document.getElementById(i); };
  if (!$("clForm")) return;
  function kind(){ var r = document.querySelector('input[name="clPk"]:checked'); return r ? r.value : "email"; }
  function sync(){
    var noTax = $("clNoTax").checked; $("clTaxBox").hidden = noTax;
    var a = $("clPA"); a.style.opacity = noTax ? ".45" : ""; a.querySelector("input").disabled = noTax;
    if (noTax && kind() === "email") { document.querySelector('input[name="clPk"][value="photo"]').checked = true; }
    var k = kind();
    document.querySelectorAll(".cl-pbody").forEach(function(b){ b.hidden = b.getAttribute("data-for") !== k; });
    $("clUpBox").hidden = k === "email";
  }
  function thumbs(){
    var box = $("clThumbs"); box.innerHTML = "";
    proofUrls.forEach(function(u, i){
      var d = document.createElement("div"); d.className = "cl-th";
      var im = document.createElement("img"); im.src = u; im.alt = ""; d.appendChild(im);
      var x = document.createElement("button"); x.type = "button"; x.textContent = "✕";
      x.addEventListener("click", function(){ proofUrls.splice(i, 1); thumbs(); });
      d.appendChild(x); box.appendChild(d);
    });
  }
  document.querySelectorAll('input[name="clPk"]').forEach(function(r){ r.addEventListener("change", sync); });
  $("clNoTax").addEventListener("change", sync); sync(); thumbs();
  $("clCancel").addEventListener("click", function(){ document.cookie = "claimPlace=; Path=/; Max-Age=0; SameSite=Lax; Secure"; });
  function err(m){ var e = $("clErr"); e.textContent = m; e.hidden = !m; }
  $("clSendCode").addEventListener("click", function(){
    var b = $("clSendCode"); b.disabled = true; $("clCodeMsg").textContent = "";
    clPost("/api/cont/revendica/cod", JSON.stringify({ proposalId: PID, email: $("clEmail").value }), "application/json").then(function(r){
      b.disabled = false;
      if (r.ok && r.x.token) { token = r.x.token; $("clCodeRow").hidden = false; $("clCodeMsg").textContent = ${L.safeJson(T("Cod trimis. Verifică și în Spam. Este valabil 15 minute.", "Code sent. Check Spam too. It is valid for 15 minutes."))}; }
      else { $("clCodeMsg").textContent = MSG[r.x.error] || MSG.generic; }
    }).catch(function(){ b.disabled = false; $("clCodeMsg").textContent = MSG.generic; });
  });
  $("clFile").addEventListener("change", function(e){
    var files = Array.prototype.slice.call(e.target.files || []); e.target.value = "";
    var room = 3 - proofUrls.length; if (room <= 0) { $("clUpMsg").textContent = ${L.safeJson(T("Maximum 3 poze.", "Maximum 3 photos."))}; return; }
    files = files.slice(0, room);
    files.reduce(function(chain, f){
      return chain.then(function(){
        $("clUpMsg").textContent = ${L.safeJson(T("Se încarcă…", "Uploading…"))};
        return clResize(f, 1600, 0.85).then(function(blob){ return clPost("/api/cont/revendica/upload", blob, "image/jpeg"); })
          .then(function(r){ if (r.ok && r.x.url) { proofUrls.push(r.x.url); thumbs(); $("clUpMsg").textContent = ""; } else { $("clUpMsg").textContent = (r.x && r.x.error) || MSG.generic; } })
          .catch(function(){ $("clUpMsg").textContent = MSG.generic; });
      });
    }, Promise.resolve());
  });
  $("clSend").addEventListener("click", function(){
    err("");
    if (!$("clConsent").checked) { err(MSG.consent); return; }
    var b = $("clSend"); b.disabled = true;
    var body = { proposalId: PID, fullName: $("clName").value, role: $("clRole").value, phone: $("clPhone").value, noTax: $("clNoTax").checked,
      companyName: $("clCompany").value, taxId: $("clTax").value, officialLink: $("clLink").value, proofKind: kind(), proofEmail: $("clEmail").value,
      emailToken: token, emailCode: $("clCode").value, proofUrls: proofUrls, consent: true };
    clPost("/api/cont/revendica", JSON.stringify(body), "application/json").then(function(r){
      if (r.ok) {
        document.cookie = "claimPlace=; Path=/; Max-Age=0; SameSite=Lax; Secure";
        $("clForm").parentNode.innerHTML = '<h2>' + ${L.safeJson(T("Cererea a fost trimisă", "Request sent"))} + '</h2><p class="cl-note">' + ${L.safeJson(T("Mulțumim! Echipa o verifică, de obicei în maximum 24 de ore, și te anunță pe e-mail. Imediat ce e aprobată, poți completa pagina din contul tău.", "Thank you! The team reviews it, usually within 24 hours, and will email you. As soon as it is approved you can complete the page from your account."))} + '</p><a class="cl-btn" href="/cont">' + ${L.safeJson(T("Înapoi în cont", "Back to my account"))} + '</a>';
      } else { b.disabled = false; err(MSG[r.x.error] || MSG.generic); }
    }).catch(function(){ b.disabled = false; err(MSG.generic); });
  });
})();`;
    res.send(shell(req, lang, T("Revendică pagina", "Claim the page"), `<div class="cl-card">${head}${body}</div>`, js));
  });

  // ===== 2) încărcare poze dovadă =====
  app.post("/api/cont/revendica/upload", gate, ownerApi, imgRaw, async (req, res) => {
    if (!(await L.checkRateLimit("own:" + req.accommodationOwner.ownerId, "revendica-upload", 15, 60))) { res.status(429).json({ error: L.getAccLang(req) === "en" ? "Too many uploads. Try again later." : "Prea multe încărcări. Reîncearcă mai târziu." }); return; }
    await storeUpload(deps, req, res, "dovezi/" + req.accommodationOwner.ownerId, false);
  });

  // ===== 3) cod de verificare pe e-mail =====
  app.post("/api/cont/revendica/cod", gate, ownerApi, async (req, res) => {
    const b = req.body || {};
    const id = parseInt(b.proposalId, 10), email = clean(b.email, 200).toLowerCase();
    if (!Number.isInteger(id) || !dbPool) { res.status(400).json({ error: "invalid_proof" }); return; }
    if (!EMAIL_RE.test(email)) { res.status(400).json({ error: "invalid_proof" }); return; }
    if (isFreeMail(domainOf(email))) { res.status(400).json({ error: "free_mail" }); return; }
    const ownerId = req.accommodationOwner.ownerId;
    if (!(await L.checkRateLimit(L.hashIp(L.getClientIp(req)), "revendica-cod", 8, 60)) || !(await L.checkRateLimit("own:" + ownerId, "revendica-cod-own", 5, 60))) { res.status(429).json({ error: "too_many_requests" }); return; }
    try {
      const place = await loadPlace(id);
      if (!place || !isClaimable(place) || (place.claimed_by_owner_id && place.claimed_by_owner_id !== ownerId)) { res.status(404).json({ error: "not_found" }); return; }
      const { code, token } = makeEmailToken(ownerId, id, email);
      const nm = E(place.name);
      const ok = await deps.sendOwnerNoticeEmail(email, {
        subjectRo: "Codul tău de verificare: " + code, subjectEn: "Your verification code: " + code,
        bodyRo: `<p>Codul pentru revendicarea paginii <strong>${nm}</strong> este:</p><p style="font-size:26px;font-weight:800;letter-spacing:3px">${code}</p><p>Este valabil 15 minute. Dacă nu ai cerut tu acest cod, ignoră mesajul.</p>`,
        bodyEn: `<p>The code to claim the page <strong>${nm}</strong> is:</p><p style="font-size:26px;font-weight:800;letter-spacing:3px">${code}</p><p>It is valid for 15 minutes. If you did not request it, please ignore this message.</p>`,
      });
      if (!ok) { res.status(502).json({ error: "email_failed" }); return; }
      res.json({ ok: true, token });
    } catch (e) { console.error("revendica/cod:", e && e.message); res.status(500).json({ error: "generic" }); }
  });

  // ===== 4) trimiterea cererii =====
  app.post("/api/cont/revendica", gate, ownerApi, async (req, res) => {
    const b = req.body || {};
    const id = parseInt(b.proposalId, 10);
    if (!Number.isInteger(id) || !dbPool) { res.status(400).json({ error: "not_found" }); return; }
    const ownerId = req.accommodationOwner.ownerId;
    if (!(await L.checkRateLimit(L.hashIp(L.getClientIp(req)), "revendica", 10, 60))) { res.status(429).json({ error: "too_many_requests" }); return; }
    try {
      const place = await loadPlace(id);
      if (!place || !isClaimable(place)) { res.status(404).json({ error: "not_found" }); return; }
      if (place.claimed_by_owner_id) { res.status(409).json({ error: "taken" }); return; }
      const ex = (await dbPool.query(`SELECT id, status, info_request FROM place_claims WHERE owner_id = $1::integer AND proposal_id = $2::integer`, [ownerId, id])).rows[0] || null;
      const reopening = !!(ex && ex.status === "pending" && ex.info_request);
      if (ex && !reopening) { res.status(409).json({ error: ex.status === "pending" ? "pending" : "not_found" }); return; }
      if (!reopening) {
        const pend = (await dbPool.query(`SELECT COUNT(*)::int AS n FROM place_claims WHERE owner_id = $1::integer AND status = 'pending'`, [ownerId])).rows[0].n;
        if (pend >= 3) { res.status(429).json({ error: "too_many_pending" }); return; }
      }
      // validări
      if (b.consent !== true) { res.status(400).json({ error: "consent" }); return; }
      const fullName = clean(b.fullName, 120);
      if (fullName.length < 3 || !/\s/.test(fullName)) { res.status(400).json({ error: "invalid_name" }); return; }
      if (!ROLES.includes(b.role)) { res.status(400).json({ error: "invalid_role" }); return; }
      const phone = clean(b.phone, 30).replace(/[^\d+\s().\-]/g, "").trim();
      if (phone.replace(/\D/g, "").length < 7) { res.status(400).json({ error: "invalid_phone" }); return; }
      const noTax = b.noTax === true;
      const kind = taxKindFor(place.country_code);
      let companyName = "", taxId = "";
      if (!noTax) {
        companyName = clean(b.companyName, 200);
        if (companyName.length < 2) { res.status(400).json({ error: "invalid_company" }); return; }
        const norm = normalizeTaxId(kind, place.country_code, b.taxId);
        if (!norm.ok) { res.status(400).json({ error: "invalid_tax" }); return; }
        taxId = norm.value;
      }
      const officialLink = L.sanitizePublicUrl ? (L.sanitizePublicUrl(clean(b.officialLink, 500)) || "") : "";
      if (!/^https?:\/\/[^\s]+\.[^\s]{2,}/i.test(officialLink)) { res.status(400).json({ error: "invalid_link" }); return; }
      const proofKind = ["email", "photo", "screenshot"].includes(b.proofKind) ? b.proofKind : "";
      if (!proofKind) { res.status(400).json({ error: "invalid_proof" }); return; }
      if (noTax && proofKind === "email") { res.status(400).json({ error: "no_tax_proof" }); return; }
      let proofEmail = null, proofUrls = [];
      if (proofKind === "email") {
        proofEmail = readEmailToken(b.emailToken, String(b.emailCode || "").trim(), ownerId, id);
        if (!proofEmail) { res.status(400).json({ error: "bad_code" }); return; }
        if (isFreeMail(domainOf(proofEmail))) { res.status(400).json({ error: "free_mail" }); return; }
      } else {
        const own = "/dovezi/" + ownerId + "/";
        proofUrls = [...new Set((Array.isArray(b.proofUrls) ? b.proofUrls : []).filter((u) => typeof u === "string" && L.isOwnBlobUrl(u) && u.includes(own)))].slice(0, 3);
        if (!proofUrls.length) { res.status(400).json({ error: "invalid_proof" }); return; }
      }
      const c = { fullName, role: b.role, phone, noTax, companyName, taxId, officialLink, proofKind, proofEmail, proofUrls };
      const auto = await buildAutoChecks(c, place);
      const proofCode = proofKind === "photo" ? proofCodeFor(ownerId, id) : null;
      const vals = [fullName, c.role, phone, companyName || null, taxId || null, noTax, officialLink, proofKind, proofEmail, !!proofEmail, JSON.stringify(proofUrls), proofCode, JSON.stringify(auto)];
      if (reopening) {
        await dbPool.query(
          `UPDATE place_claims SET full_name = $1, role = $2, phone = $3, company_name = $4, tax_id = $5, no_tax = $6, official_link = $7, proof_kind = $8, proof_email = $9, proof_email_verified = $10, proof_urls = $11::jsonb, proof_code = $12, auto_checks = $13::jsonb,
                  info_request = NULL, info_answered_at = now(), creat_la = now() WHERE id = $14::integer AND status = 'pending'`, vals.concat([ex.id]));
      } else {
        await dbPool.query(
          `INSERT INTO place_claims (owner_id, proposal_id, full_name, role, phone, company_name, tax_id, no_tax, official_link, proof_kind, proof_email, proof_email_verified, proof_urls, proof_code, auto_checks)
           VALUES ($14::integer, $15::integer, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13::jsonb) ON CONFLICT (owner_id, proposal_id) DO NOTHING`, vals.concat([ownerId, id]));
      }
      res.status(201).json({ ok: true });
    } catch (err) {
      if (err && (err.code === "42P01" || err.code === "42703")) { res.status(409).json({ error: "run_sql" }); return; }
      console.error("cont/revendica:", err && err.message);
      res.status(500).json({ error: "generic" });
    }
  });

  // ===== 5) editorul „Editează pagina mea” =====
  async function ownedPlace(req, id) {
    const q = await dbPool.query(
      `SELECT p.id, p.type, p.name, p.city, p.country_code, p.note, p.schedule, to_jsonb(p)->>'photo_url' AS photo_url, to_jsonb(p)->'photo_urls' AS photo_urls,
              to_jsonb(p)->>'contact_phone' AS contact_phone, to_jsonb(p)->>'website_url' AS website_url, to_jsonb(p)->>'menu_url' AS menu_url, to_jsonb(p)->>'facebook_url' AS facebook_url, to_jsonb(p)->>'instagram_url' AS instagram_url,
              to_jsonb(p)->'owner_edit' AS owner_edit, to_jsonb(p)->>'owner_edit_at' AS owner_edit_at
         FROM pending_submissions p WHERE p.id = $1::integer AND p.status = 'approved' AND p.claimed_by_owner_id = $2::integer`, [id, req.accommodationOwner.ownerId]);
    return q.rows[0] || null;
  }
  const effective = (r) => {
    const pend = parseJson(r.owner_edit);
    if (pend) return { pending: true, photos: Array.isArray(pend.photos) ? pend.photos : [], note: pend.note || "", schedule: parseJson(pend.schedule), phone: pend.phone || "", website: pend.website || "", menu: pend.menu || "", facebook: pend.facebook || "", instagram: pend.instagram || "" };
    return { pending: false, photos: photosOf(r), note: r.note || "", schedule: parseJson(r.schedule), phone: r.contact_phone || "", website: r.website_url || "", menu: r.menu_url || "", facebook: r.facebook_url || "", instagram: r.instagram_url || "" };
  };

  app.get("/cont/pagina/:id", gate, ownerPage, async (req, res) => {
    const lang = L.getAccLang(req, res), T = (ro, en) => (lang === "en" ? en : ro);
    const id = /^\d{1,9}$/.test(req.params.id) ? Number(req.params.id) : 0;
    let r = null;
    try { if (id && dbPool) r = await ownedPlace(req, id); } catch (e) { r = null; }
    if (!r) { res.redirect("/cont"); return; }
    begin(req, res);
    const v = effective(r);
    const sch = v.schedule || {};
    const mode = sch.appt === true ? "appt" : (sch.is247 ? "247" : (sch.days ? "days" : "none"));
    const apptDaysTxt = sch.appt === true && Array.isArray(sch.openDays) ? sch.openDays.map((d) => d.date + (d.to ? ".." + d.to : "") + (d.label ? " | " + d.label : "")).join("\n") : "";
    const food = r.type === "restaurant" || r.type === "cafe";
    const dayNames = lang === "en" ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] : ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];
    const order = [1, 2, 3, 4, 5, 6, 0];
    const times = [];
    for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 5) times.push((h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m);
    const opt = (sel) => times.map((t) => `<option value="${t}"${t === sel ? " selected" : ""}>${t}</option>`).join("");
    const dayRows = order.map((i) => {
      const d = sch.days && sch.days[String(i)];
      const closed = !!(d && d.closed);
      return `<div class="cl-day" data-day="${i}"><span>${E(dayNames[i])}</span><select class="cl-in cl-open">${opt(d && d.open ? d.open : "09:00")}</select><select class="cl-in cl-close">${opt(d && d.close ? d.close : "18:00")}</select><label><input type="checkbox" class="cl-closed"${closed ? " checked" : ""}>${T("închis", "closed")}</label></div>`;
    }).join("");
    const msgs = { run_sql: T("Funcția nu e activată încă.", "This feature is not enabled yet."), no_changes: T("Nu ai modificat nimic.", "You have not changed anything."), invalid_phone: T("Telefon invalid.", "Invalid phone."), invalid_website: T("Link website invalid (începe cu https://).", "Invalid website link (must start with https://)."), invalid_menu: T("Link meniu invalid.", "Invalid menu link."), too_many_requests: T("Prea multe salvări. Reîncearcă mai târziu.", "Too many saves. Try again later."), generic: T("Nu s-a putut salva. Încearcă din nou.", "Could not save. Please try again.") };
    const inner = `<div class="cl-card">
      <h2>${T("Editează pagina mea", "Edit my page")}</h2>
      <div class="cl-place">${E(r.name)}</div>
      <p class="cl-meta">${E(L.proposalTypeLabel(r, lang !== "en"))} · ${E(r.city)} · <a href="/loc/${r.id}-${slug(r.name)}" target="_blank" rel="noopener">${T("vezi pagina publică", "view the public page")}</a></p>
      <div class="cl-warn" id="edInfo">${v.pending ? "⏳ " + T("Ai modificări trimise, în așteptarea aprobării echipei. Le poți ajusta mai jos (rămân neschimbate pe pagină până la aprobare).", "You have changes waiting for the team's approval. You can adjust them below (the public page stays unchanged until they are approved).") : "ℹ️ " + T("După ce salvezi, echipa verifică modificările (de obicei în maximum 24 de ore) și abia apoi apar pe pagina publică.", "After you save, the team reviews your changes (usually within 24 hours) and only then they appear on the public page.")}</div>
      <form id="edForm" novalidate>
        <h3>${T("Poze", "Photos")}</h3>
        <p class="cl-hint">${T("Prima poză e cea principală. Maximum 11 poze.", "The first photo is the main one. Up to 11 photos.")}</p>
        <div class="cl-thumbs" id="edThumbs"></div>
        <div style="margin-top:8px"><label class="cl-btn small ghost" style="cursor:pointer;display:inline-block">📷 ${T("Adaugă poze", "Add photos")}<input type="file" accept="image/*" multiple id="edFile" hidden></label></div><p class="cl-hint" id="edPhotoMsg"></p>
        <h3>${T("Descriere", "Description")}</h3>
        <textarea class="cl-in" id="edNote" maxlength="2000" rows="6">${E(v.note)}</textarea>
        <h3>${T("Program", "Opening hours")}</h3>
        <select class="cl-in" id="edMode"><option value="none"${mode === "none" ? " selected" : ""}>${T("Fără program fix / nu se aplică", "No fixed hours / not applicable")}</option><option value="247"${mode === "247" ? " selected" : ""}>${T("Non-stop (24/7)", "Open 24/7")}</option><option value="days"${mode === "days" ? " selected" : ""}>${T("Program pe zile", "Hours per day")}</option><option value="appt"${mode === "appt" ? " selected" : ""}>${T("Doar cu programare / porți deschise", "By appointment / open days")}</option></select>
        <div class="cl-days" id="edDays"${mode === "days" ? "" : " hidden"}>${dayRows}</div>
        <div id="edAppt"${mode === "appt" ? "" : " hidden"}>
          <p class="cl-hint">${T("Pagina arată „Doar cu programare”, fără „deschis acum”. Telefonul și site-ul se completează mai jos, la Contact.", "The page shows “By appointment only”, without “open now”. Phone and website go below, under Contact.")}</p>
          <label class="cl-field">${T("E-mail pentru programări", "E-mail for booking a visit")}<input class="cl-in" id="edApptEmail" type="email" maxlength="160" value="${E(sch.contactEmail || "")}"></label>
          <label class="cl-field">${T("Zile cu porți deschise (opțional): câte una pe linie, de forma AAAA-LL-ZZ | Eveniment (interval: AAAA-LL-ZZ..AAAA-LL-ZZ | Eveniment)", "Open days (optional): one per line, as YYYY-MM-DD | Event (range: YYYY-MM-DD..YYYY-MM-DD | Event)")}<textarea class="cl-in" id="edApptDays" maxlength="3000" rows="4" style="min-height:90px">${E(apptDaysTxt)}</textarea></label>
        </div>
        <label class="cl-field">${T("Mențiune program (opțional — excepții, sărbători)", "Note about the hours (optional — exceptions, holidays)")}<textarea class="cl-in" id="edSNote" maxlength="600" rows="3" style="min-height:70px">${E(sch.note || "")}</textarea></label>
        <h3>${T("Contact", "Contact")}</h3>
        <div class="cl-row">
          <label class="cl-field">${T("Telefon", "Phone")}<input class="cl-in" id="edPhone" type="tel" maxlength="30" value="${E(v.phone)}"></label>
          <label class="cl-field">Website<input class="cl-in" id="edWeb" type="url" maxlength="500" placeholder="https://" value="${E(v.website)}"></label>
          <label class="cl-field">Facebook<input class="cl-in" id="edFb" type="url" maxlength="500" placeholder="https://facebook.com/..." value="${E(v.facebook)}"></label>
          <label class="cl-field">Instagram<input class="cl-in" id="edIg" type="url" maxlength="500" placeholder="https://instagram.com/..." value="${E(v.instagram)}"></label>
        </div>
        ${food ? `<h3>${T("Meniu", "Menu")}</h3>
        <label class="cl-field">${T("Link spre meniu (sau încarcă un PDF)", "Link to the menu (or upload a PDF)")}<input class="cl-in" id="edMenu" type="url" maxlength="500" placeholder="https://" value="${E(v.menu)}"></label>
        <label class="cl-btn small ghost" style="cursor:pointer;display:inline-block">📄 ${T("Încarcă meniu PDF", "Upload PDF menu")}<input type="file" accept="application/pdf" id="edMenuFile" hidden></label><p class="cl-hint" id="edMenuMsg"></p>` : ""}
        <button type="button" class="cl-btn" id="edSave">${T("Trimite modificările spre aprobare", "Send changes for approval")}</button>
        <a class="cl-btn ghost" href="/cont">${T("Înapoi în cont", "Back to my account")}</a><p class="cl-err" id="edErr" hidden></p><p class="cl-ok" id="edOk" hidden></p>
      </form></div>`;
    const js = `${CLIENT_UPLOAD_JS}
(function(){
  var PID = ${Number(r.id)}, MSG = ${L.safeJson(msgs)}, photos = ${L.safeJson(v.photos.slice(0, 11))};
  var $ = function(i){ return document.getElementById(i); };
  function thumbs(){
    var box = $("edThumbs"); box.innerHTML = "";
    photos.forEach(function(u, i){
      var d = document.createElement("div"); d.className = "cl-th";
      var im = document.createElement("img"); im.src = u; im.alt = ""; d.appendChild(im);
      var x = document.createElement("button"); x.type = "button"; x.textContent = "✕";
      x.addEventListener("click", function(){ photos.splice(i, 1); thumbs(); });
      d.appendChild(x);
      if (i > 0) { var m = document.createElement("button"); m.type = "button"; m.textContent = "★"; m.style.right = "auto"; m.style.left = "2px"; m.title = ${L.safeJson(T("Fă-o principală", "Make main"))};
        m.addEventListener("click", function(){ var p = photos.splice(i, 1)[0]; photos.unshift(p); thumbs(); }); d.appendChild(m); }
      box.appendChild(d);
    });
  }
  thumbs();
  $("edMode").addEventListener("change", function(){ $("edDays").hidden = $("edMode").value !== "days"; $("edAppt").hidden = $("edMode").value !== "appt"; });
  $("edFile").addEventListener("change", function(e){
    var files = Array.prototype.slice.call(e.target.files || []); e.target.value = "";
    var room = 11 - photos.length; if (room <= 0) { $("edPhotoMsg").textContent = ${L.safeJson(T("Maximum 11 poze.", "Maximum 11 photos."))}; return; }
    files = files.slice(0, room);
    files.reduce(function(chain, f){
      return chain.then(function(){
        $("edPhotoMsg").textContent = ${L.safeJson(T("Se încarcă…", "Uploading…"))};
        return clResize(f, 1600, 0.85).then(function(blob){ return clPost("/api/cont/pagina/" + PID + "/upload", blob, "image/jpeg"); })
          .then(function(r){ if (r.ok && r.x.url) { photos.push(r.x.url); thumbs(); $("edPhotoMsg").textContent = ""; } else { $("edPhotoMsg").textContent = (r.x && r.x.error) || MSG.generic; } })
          .catch(function(){ $("edPhotoMsg").textContent = MSG.generic; });
      });
    }, Promise.resolve());
  });
  if ($("edMenuFile")) $("edMenuFile").addEventListener("change", function(e){
    var f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return;
    $("edMenuMsg").textContent = ${L.safeJson(T("Se încarcă…", "Uploading…"))};
    f.arrayBuffer().then(function(buf){ return clPost("/api/cont/pagina/" + PID + "/upload", buf, "application/pdf"); })
      .then(function(r){ if (r.ok && r.x.url) { $("edMenu").value = r.x.url; $("edMenuMsg").textContent = ${L.safeJson(T("✓ PDF încărcat. Apasă „Trimite modificările”.", "✓ PDF uploaded. Press “Send changes”."))}; } else { $("edMenuMsg").textContent = (r.x && r.x.error) || MSG.generic; } })
      .catch(function(){ $("edMenuMsg").textContent = MSG.generic; });
  });
  $("edSave").addEventListener("click", function(){
    var e = $("edErr"), ok = $("edOk"); e.hidden = true; ok.hidden = true;
    var schedule = null, mode = $("edMode").value;
    if (mode === "247") schedule = { is247: true };
    else if (mode === "days") {
      var d = {};
      document.querySelectorAll(".cl-day").forEach(function(row){
        d[row.getAttribute("data-day")] = row.querySelector(".cl-closed").checked ? { closed: true } : { open: row.querySelector(".cl-open").value, close: row.querySelector(".cl-close").value };
      });
      schedule = { is247: false, days: d };
    }
    else if (mode === "appt") {
      var od = [];
      $("edApptDays").value.split(String.fromCharCode(10)).forEach(function(line){
        line = line.trim(); if (!line) return;
        var parts = line.split("|"), dd = parts[0].trim().split(".."), item = { date: dd[0].trim() };
        if (dd[1]) item.to = dd[1].trim();
        var lb = parts.slice(1).join("|").trim(); if (lb) item.label = lb;
        od.push(item);
      });
      schedule = { appt: true, contactEmail: $("edApptEmail").value, openDays: od };
    }
    if (schedule) schedule.note = $("edSNote").value;
    var b = $("edSave"); b.disabled = true;
    var body = { photos: photos, note: $("edNote").value, schedule: schedule, phone: $("edPhone").value, website: $("edWeb").value, facebook: $("edFb") ? $("edFb").value : "", instagram: $("edIg") ? $("edIg").value : "", menu: $("edMenu") ? $("edMenu").value : "" };
    clPost("/api/cont/pagina/" + PID, JSON.stringify(body), "application/json").then(function(r){
      b.disabled = false;
      if (r.ok) { ok.textContent = ${L.safeJson(T("✓ Trimis. Echipa verifică modificările și te anunță pe e-mail.", "✓ Sent. The team will review your changes and email you."))}; ok.hidden = false; window.scrollTo(0, document.body.scrollHeight); }
      else { e.textContent = MSG[r.x.error] || MSG.generic; e.hidden = false; }
    }).catch(function(){ b.disabled = false; e.textContent = MSG.generic; e.hidden = false; });
  });
})();`;
    res.send(shell(req, lang, T("Editează pagina mea", "Edit my page"), inner, js));
  });

  app.post("/api/cont/pagina/:id/upload", gate, ownerApi, fileRaw, async (req, res) => {
    const id = /^\d{1,9}$/.test(req.params.id) ? Number(req.params.id) : 0;
    try {
      const r = id && dbPool ? await ownedPlace(req, id) : null;
      if (!r) { res.status(404).json({ error: "not_found" }); return; }
      if (!(await L.checkRateLimit("own:" + req.accommodationOwner.ownerId, "pagina-upload", 60, 60))) { res.status(429).json({ error: "too_many_requests" }); return; }
      const food = r.type === "restaurant" || r.type === "cafe";
      const ct = String(req.headers["content-type"] || "").split(";")[0].trim();
      if (ct === "application/pdf" && !food) { res.status(400).json({ error: "invalid_menu" }); return; }
      await storeUpload(deps, req, res, "proprietar/" + id, food);
    } catch (e) { res.status(500).json({ error: "generic" }); }
  });

  app.post("/api/cont/pagina/:id", gate, ownerApi, async (req, res) => {
    const id = /^\d{1,9}$/.test(req.params.id) ? Number(req.params.id) : 0;
    const b = req.body || {};
    try {
      const r = id && dbPool ? await ownedPlace(req, id) : null;
      if (!r) { res.status(404).json({ error: "not_found" }); return; }
      if (!(await L.checkRateLimit("own:" + req.accommodationOwner.ownerId, "pagina-save", 20, 1440))) { res.status(429).json({ error: "too_many_requests" }); return; }
      const food = r.type === "restaurant" || r.type === "cafe";
      const photos = [...new Set((Array.isArray(b.photos) ? b.photos : []).filter((u) => typeof u === "string" && L.isOwnBlobUrl(u)))].slice(0, 11);
      const note = cleanMulti(b.note, 2000);
      const schedule = L.sanitizeProposalSchedule(b.schedule);
      let phone = clean(b.phone, 30).replace(/[^\d+\s().\-]/g, "").trim();
      if (phone && phone.replace(/\D/g, "").length < 7) { res.status(400).json({ error: "invalid_phone" }); return; }
      const webRaw = clean(b.website, 500);
      const website = webRaw ? (L.sanitizePublicUrl(webRaw) || "") : "";
      if (webRaw && !website) { res.status(400).json({ error: "invalid_website" }); return; }
      const fbRaw = clean(b.facebook, 500), igRaw = clean(b.instagram, 500);
      const facebook = fbRaw ? (L.sanitizePublicUrl(fbRaw) || "") : "";
      const instagram = igRaw ? (L.sanitizePublicUrl(igRaw) || "") : "";
      if ((fbRaw && !facebook) || (igRaw && !instagram)) { res.status(400).json({ error: "invalid_website" }); return; }
      let menu = "";
      if (food) {
        const mRaw = clean(b.menu, 500);
        if (mRaw) { menu = L.isOwnBlobUrl(mRaw) ? mRaw : (L.sanitizePublicUrl(mRaw) || ""); if (!menu) { res.status(400).json({ error: "invalid_menu" }); return; } }
      }
      const cur = { photos: photosOf(r), note: r.note || "", schedule: parseJson(r.schedule) || null, phone: r.contact_phone || "", website: r.website_url || "", menu: r.menu_url || "", facebook: r.facebook_url || "", instagram: r.instagram_url || "" };
      const next = { photos, note, schedule: schedule || null, phone, website, menu, facebook, instagram };
      if (JSON.stringify(cur) === JSON.stringify(next) && !parseJson(r.owner_edit)) { res.status(400).json({ error: "no_changes" }); return; }
      await dbPool.query(`UPDATE pending_submissions SET owner_edit = $1::jsonb, owner_edit_at = now() WHERE id = $2::integer AND claimed_by_owner_id = $3::integer`, [JSON.stringify(next), id, req.accommodationOwner.ownerId]);
      res.status(200).json({ ok: true });
    } catch (err) {
      if (err && (err.code === "42703" || err.code === "42P01")) { res.status(409).json({ error: "run_sql" }); return; }
      console.error("cont/pagina:", err && err.message);
      res.status(500).json({ error: "generic" });
    }
  });

  // ===== 6) contestație (public): „Nu ești tu proprietarul?” =====
  app.post("/api/loc/:id/contesta", async (req, res) => {
    const id = /^\d{1,9}$/.test(req.params.id) ? Number(req.params.id) : 0;
    const b = req.body || {};
    if (b.website) { res.json({ ok: true }); return; }
    const email = clean(b.email, 160).toLowerCase(), message = cleanMulti(b.message, 1500);
    if (!id || !dbPool || !EMAIL_RE.test(email) || message.length < 10) { res.status(400).json({ error: "invalid" }); return; }
    if (!(await L.checkRateLimit(L.hashIp(L.getClientIp(req)), "loc-contesta", 4, 1440))) { res.status(429).json({ error: "too_many_requests" }); return; }
    try {
      const p = (await dbPool.query(`SELECT id, claimed_by_owner_id FROM pending_submissions WHERE id = $1::integer AND status = 'approved'`, [id])).rows[0];
      if (!p || !p.claimed_by_owner_id) { res.status(404).json({ error: "not_found" }); return; }
      await dbPool.query(`INSERT INTO place_disputes (proposal_id, email, message, ip_hash) VALUES ($1::integer, $2, $3, $4)`, [id, email, message, L.hashIp(L.getClientIp(req))]);
      res.status(201).json({ ok: true });
    } catch (err) {
      if (err && (err.code === "42P01" || err.code === "42703")) { res.status(409).json({ error: "run_sql" }); return; }
      console.error("loc/contesta:", err && err.message);
      res.status(500).json({ error: "generic" });
    }
  });
}


// ======================= ADMIN =======================
function mountAdmin(app, deps) {
  const slug = deps.slugifyPlaceName;
  const fmt = (v) => (v ? E(new Date(v).toLocaleDateString("ro-RO") + " " + new Date(v).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })) : "—");
  const ROLE_RO = { owner: "proprietar", manager: "administrator / manager", employee: "angajat împuternicit" };
  const KIND_RO = { email: "A · e-mail pe domeniul afacerii", photo: "B · poză la locație cu cod", screenshot: "C · captură cont administrator" };
  function checksHtml(c) {
    const a = parseJson(c.auto_checks); if (!a) return `<div class="admin-submission-meta">Verificări automate: neefectuate.</div>`;
    const li = [];
    const t = a.tax || {};
    if (c.no_tax) li.push("🟡 Fără cod fiscal (a bifat „Nu am”) — decizi pe baza dovezii.");
    else if (t.status === "ok") {
      li.push(`${t.active === false ? "🔴" : "🟢"} ${t.kind === "ro-anaf" ? "ANAF" : "VIES"}: <strong>${E(t.name || "(denumire nepublică)")}</strong>${t.address ? " · " + E(t.address) : ""}${t.active === false ? " · <strong>firmă inactivă</strong>" : ""}`);
      if (t.nameMatch === false) li.push("🟠 Denumirea declarată nu seamănă cu cea oficială.");
      if (t.cityMatch === false) li.push("🟠 Adresa oficială nu pare din localitatea paginii.");
    } else if (t.status === "invalid") li.push("🔴 Codul fiscal nu există în registrul oficial.");
    else li.push("⚪ Cod fiscal: neverificat automat (serviciul oficial nu a răspuns).");
    const e = a.emailDomain || {};
    if (c.proof_kind === "email") li.push(e.status === "match" ? `🟢 E-mailul (${E(e.domain)}) e pe același domeniu cu site-ul (${E(e.site)}) · cod confirmat.` : e.status === "mismatch" ? `🟠 E-mailul (${E(e.domain)}) NU e pe domeniul site-ului (${E(e.site)}) · cod confirmat.` : `⚪ E-mail confirmat prin cod (${E(c.proof_email)}); domeniul nu a putut fi comparat.`);
    const d = a.duplicates || {};
    if ((d.tax || []).length) li.push("🟠 Același cod fiscal apare și la paginile: " + d.tax.map((i) => "#" + i).join(", "));
    if ((d.phone || []).length) li.push("🟠 Același telefon apare și la paginile: " + d.phone.map((i) => "#" + i).join(", "));
    return `<div class="admin-submission-meta" style="line-height:1.7;margin-top:6px">${li.join("<br>")}</div>`;
  }
  async function pendingCount() { try { return (await dbPool.query(`SELECT COUNT(*)::int AS n FROM place_claims WHERE status='pending'`)).rows[0].n; } catch (e) { return 0; } }

  app.get("/admin/revendicari", async (req, res) => {
    if (!deps.requireAdminPage(req, res)) return;
    if (!dbPool) { res.status(503).send("Baza de date nu e configurată."); return; }
    const tabs = ["pending", "approved", "rejected", "edits", "disputes"];
    const active = tabs.includes(req.query.status) ? req.query.status : "pending";
    const counts = { pending: 0, approved: 0, rejected: 0, edits: 0, disputes: 0 };
    let rows = [], needSql = false;
    try {
      (await dbPool.query(`SELECT status, COUNT(*)::int AS n FROM place_claims GROUP BY status`)).rows.forEach((x) => { if (counts[x.status] !== undefined) counts[x.status] = x.n; });
      try { counts.edits = (await dbPool.query(`SELECT COUNT(*)::int AS n FROM pending_submissions WHERE to_jsonb(pending_submissions)->'owner_edit' IS NOT NULL AND to_jsonb(pending_submissions)->>'owner_edit' <> 'null'`)).rows[0].n; } catch (e) { needSql = true; }
      try { counts.disputes = (await dbPool.query(`SELECT COUNT(*)::int AS n FROM place_disputes WHERE status='open'`)).rows[0].n; } catch (e) { needSql = true; }
      if (active === "edits") {
        rows = (await dbPool.query(
          `SELECT p.id, p.name, p.city, p.type, p.note, p.schedule, p.photo_url, to_jsonb(p)->'photo_urls' AS photo_urls, to_jsonb(p)->>'contact_phone' AS contact_phone, to_jsonb(p)->>'website_url' AS website_url, to_jsonb(p)->>'menu_url' AS menu_url, to_jsonb(p)->>'facebook_url' AS facebook_url, to_jsonb(p)->>'instagram_url' AS instagram_url,
                  to_jsonb(p)->'owner_edit' AS owner_edit, to_jsonb(p)->>'owner_edit_at' AS owner_edit_at, o.email
             FROM pending_submissions p LEFT JOIN accommodation_owners o ON o.id = p.claimed_by_owner_id
            WHERE to_jsonb(p)->'owner_edit' IS NOT NULL AND to_jsonb(p)->>'owner_edit' <> 'null' ORDER BY to_jsonb(p)->>'owner_edit_at' DESC LIMIT 200`)).rows;
      } else if (active === "disputes") {
        rows = (await dbPool.query(
          `SELECT d.id, d.proposal_id, d.email, d.message, d.status, d.creat_la, p.name, p.city, p.claimed_by_owner_id, o.email AS owner_email
             FROM place_disputes d JOIN pending_submissions p ON p.id = d.proposal_id LEFT JOIN accommodation_owners o ON o.id = p.claimed_by_owner_id
            WHERE d.status = 'open' ORDER BY d.creat_la DESC LIMIT 200`)).rows;
      } else {
        rows = (await dbPool.query(
          `SELECT c.*, o.email, o.admin_created, o.self_verified, o.last_login_at, p.name AS place_name, p.city AS place_city, p.type AS place_type, p.claimed_by_owner_id
             FROM place_claims c JOIN accommodation_owners o ON o.id = c.owner_id JOIN pending_submissions p ON p.id = c.proposal_id
            WHERE c.status = $1 ORDER BY c.creat_la DESC LIMIT 300`, [active])).rows;
      }
    } catch (err) { if (err && (err.code === "42P01" || err.code === "42703")) needSql = true; else console.error("admin/revendicari:", err.message); }
    const sidebar = await deps.getAdminCounts();
    let cards = "";
    if (active === "edits") {
      cards = rows.map((r) => {
        const ed = parseJson(r.owner_edit) || {};
        const cur = { photos: photosOf(r), note: r.note || "", schedule: parseJson(r.schedule), phone: r.contact_phone || "", website: r.website_url || "", menu: r.menu_url || "", facebook: r.facebook_url || "", instagram: r.instagram_url || "" };
        const imgs = (a) => a.length ? `<div class="cl-a-th">${a.map((u) => `<img src="${E(u)}" alt="">`).join("")}</div>` : "<em>fără poze</em>";
        const schTxt = (s) => !s ? "—" : s.appt === true ? "Loc special: doar cu programare" + (s.contactEmail ? " · " + s.contactEmail : "") + (Array.isArray(s.openDays) && s.openDays.length ? " · porți deschise: " + s.openDays.map((d) => d.date + (d.to ? ".." + d.to : "") + (d.label ? " (" + d.label + ")" : "")).join("; ") : "") : s.is247 ? "Non-stop" : s.days ? Object.keys(s.days).sort().map((k) => `${["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"][k]}: ${s.days[k].closed ? "închis" : E(s.days[k].open + "–" + s.days[k].close)}`).join(" · ") : "—";
        const row = (lab, a, b) => `<tr><th>${lab}</th><td>${a}</td><td${a !== b ? ' class="cl-changed"' : ""}>${b}</td></tr>`;
        const pj = (v) => JSON.stringify(v);
        return `<div class="admin-submission-card clm" data-id="${r.id}" data-kind="edit">
          <div class="admin-submission-header"><span class="admin-submission-type">✏️ Modificări de la proprietar</span><span class="admin-submission-meta">${fmt(r.owner_edit_at)}</span></div>
          <div class="admin-submission-name"><a href="/loc/${r.id}-${E(slug(r.name))}" target="_blank" rel="noopener" style="color:inherit">${E(r.name)}</a> · ${E(r.city)}</div>
          <div class="admin-submission-meta">Proprietar: ${E(r.email || "—")}</div>
          <table class="cl-diff"><tr><th></th><th>Acum pe pagină</th><th>Propus de proprietar</th></tr>
            ${row("Poze", imgs(cur.photos), imgs(ed.photos || []))}
            ${row("Descriere", E(cur.note) || "—", E(ed.note || "") || "—")}
            ${row("Program", E(schTxt(cur.schedule)), E(schTxt(ed.schedule)))}
            ${row("Mențiune program", E((cur.schedule && cur.schedule.note) || "—"), E((ed.schedule && ed.schedule.note) || "—"))}
            ${row("Telefon", E(cur.phone || "—"), E(ed.phone || "—"))}
            ${row("Website", E(cur.website || "—"), E(ed.website || "—"))}
            ${row("Facebook", E(cur.facebook || "—"), E(ed.facebook || "—"))}
            ${row("Instagram", E(cur.instagram || "—"), E(ed.instagram || "—"))}
            ${row("Meniu", E(cur.menu || "—"), E(ed.menu || "—"))}
          </table>
          <div class="admin-submission-actions"><button type="button" class="admin-approve-btn" data-act="aproba">✓ Aprobă modificările</button><button type="button" class="admin-reject-btn" data-act="respinge">✕ Respinge</button></div></div>`;
      }).join("") || "<p>Nicio modificare în așteptare.</p>";
    } else if (active === "disputes") {
      cards = rows.map((d) => `<div class="admin-submission-card clm" data-id="${d.id}" data-kind="dispute">
        <div class="admin-submission-header"><span class="admin-submission-type">⚠️ Contestație</span><span class="admin-submission-meta">${fmt(d.creat_la)}</span></div>
        <div class="admin-submission-name"><a href="/loc/${d.proposal_id}-${E(slug(d.name))}" target="_blank" rel="noopener" style="color:inherit">${E(d.name)}</a> · ${E(d.city)}</div>
        <div class="admin-submission-meta" style="line-height:1.6">Proprietar actual: <strong>${E(d.owner_email || "—")}</strong><br>Contestatar: <strong>${E(d.email)}</strong></div>
        <div class="admin-submission-meta" style="white-space:pre-wrap;margin-top:6px">${E(d.message)}</div>
        <div class="admin-submission-actions"><button type="button" class="admin-reject-btn" data-act="retrage">Retrage pagina de la proprietar</button><button type="button" class="admin-approve-btn" data-act="inchide">Închide (rămâne la proprietar)</button></div></div>`).join("") || "<p>Nicio contestație deschisă.</p>";
    } else {
      cards = rows.map((c) => {
        const href = `/loc/${c.proposal_id}-${slug(c.place_name)}`;
        const conflict = c.status === "pending" && c.claimed_by_owner_id && c.claimed_by_owner_id !== c.owner_id;
        const noProof = c.status === "pending" && !c.proof_kind;
        const proofs = parseJson(c.proof_urls); const pl = Array.isArray(proofs) ? proofs : [];
        const origin = c.admin_created ? "creat de tine" : "s-a înscris singur";
        return `<div class="admin-submission-card clm" data-id="${c.id}" data-kind="claim">
          <div class="admin-submission-header"><span class="admin-submission-type">🏷️ ${E(L.proposalTypeLabel({ type: c.place_type }, true))}</span><span class="admin-status-tag admin-status-${c.status}">${c.status === "pending" ? (c.info_request ? "❓ Așteaptă date" : "⏳ În verificare") : c.status === "approved" ? "✓ Aprobată" : "✕ Respinsă"}</span></div>
          <div class="admin-submission-name"><a href="${E(href)}" target="_blank" rel="noopener" style="color:inherit">${E(c.place_name)}</a> · ${E(c.place_city)}</div>
          ${noProof ? `<div class="admin-submission-meta" style="color:#ffcf7a">⚠️ Cerere veche, fără dovadă — cere date înainte să aprobi.</div>` : `
          <div class="admin-submission-meta" style="line-height:1.7;margin-top:6px">👤 <strong>${E(c.full_name || "—")}</strong> (${E(ROLE_RO[c.role] || "—")}) · ${E(c.phone || "—")}<br>🏢 ${c.no_tax ? "<em>fără cod fiscal</em>" : `${E(c.company_name || "—")} · <strong>${E(c.tax_id || "—")}</strong>`}<br>🔗 ${c.official_link ? `<a href="${E(c.official_link)}" target="_blank" rel="noopener noreferrer">${E(c.official_link)}</a>` : "—"}<br>🧾 Dovada: <strong>${E(KIND_RO[c.proof_kind] || "—")}</strong>${c.proof_code ? ` · cod așteptat în poză: <strong>${E(c.proof_code)}</strong>` : ""}</div>
          ${pl.length ? `<div class="cl-a-th">${pl.map((u) => `<a href="${E(u)}" target="_blank" rel="noopener"><img src="${E(u)}" alt=""></a>`).join("")}</div>` : ""}
          ${c.status === "pending" ? checksHtml(c) : ""}`}
          <div class="admin-submission-meta">Cont: ${E(c.email)} (${E(origin)}) · conectat ${fmt(c.last_login_at)} · cerere ${fmt(c.creat_la)}${c.proofs_deleted_at ? " · pozele de dovadă au fost șterse" : ""}</div>
          ${c.info_request ? `<div class="admin-submission-meta">Ai cerut: ${E(c.info_request)}</div>` : ""}
          ${conflict ? `<div class="admin-submission-meta" style="color:#ff8a8a">⚠️ Pagina e deja revendicată de alt cont — aprobarea nu e posibilă.</div>` : ""}
          ${c.note ? `<div class="admin-submission-meta">Notă: ${E(c.note)}</div>` : ""}
          ${c.status === "pending" ? `<div class="admin-submission-actions"><button type="button" class="admin-approve-btn" data-act="aproba"${conflict || noProof ? " disabled" : ""}>✓ Aprobă</button><button type="button" class="admin-reject-btn" data-act="respinge">✕ Respinge</button><button type="button" class="admin-edit-btn" data-act="cere-date">❓ Cere mai multe date</button></div>` : ""}</div>`;
      }).join("") || "<p>Nicio cerere în această categorie.</p>";
    }
    const tab = (k, label) => `<a class="admin-tab${active === k ? " is-active" : ""}" href="/admin/revendicari?status=${k}">${label} (${counts[k]})</a>`;
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Revendicări — Admin</title>
<style>${deps.adminShellStyles()}
.cl-a-th{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.cl-a-th img{width:110px;height:80px;object-fit:cover;border-radius:6px;border:1px solid rgba(255,255,255,.2)}
.cl-diff{width:100%;border-collapse:collapse;margin:10px 0;font-size:13.5px}.cl-diff th,.cl-diff td{border:1px solid rgba(255,255,255,.15);padding:6px 8px;text-align:left;vertical-align:top}.cl-diff td.cl-changed{background:rgba(46,158,91,.18)}</style></head><body>
<div class="admin-shell">${deps.adminSidebarHtml("revendicari", sidebar)}<div style="flex:1">${deps.adminMobileBarHtml()}<div class="admin-main">
<h1 class="admin-h1">🏷️ Revendicări de pagini</h1>
<p class="admin-submission-meta" style="margin:-6px 0 12px;">Cereri cu dovadă de proprietate, modificările făcute de proprietari și contestații. <strong>Proprietarul primește automat e-mail</strong> cu fiecare decizie. Pozele de dovadă se șterg automat după aprobare/respingere.</p>
${needSql ? `<p style="color:#ffcf7a">⚠️ Rulează <code>revendicare-dovada.sql</code> în Neon ca să activezi funcția completă.</p>` : ""}
<div class="admin-tabs">${tab("pending", "⏳ În verificare")}${tab("approved", "✓ Aprobate")}${tab("rejected", "✕ Respinse")}${tab("edits", "✏️ Modificări")}${tab("disputes", "⚠️ Contestații")}</div>
${cards}
</div></div></div>
<script>${deps.adminSidebarScript()}
document.querySelectorAll(".clm").forEach(function(card){
  card.querySelectorAll("[data-act]").forEach(function(b){
    b.addEventListener("click", function(){
      var act = b.getAttribute("data-act"), kind = card.getAttribute("data-kind"), note = "";
      if (act === "respinge") { note = prompt("Motiv (se trimite proprietarului pe e-mail, opțional):", "") || ""; }
      else if (act === "cere-date") { note = prompt("Ce date îi mai ceri? (se trimite pe e-mail)", "") || ""; if (!note.trim()) return; }
      else if (act === "retrage") { if (!confirm("Retragi pagina de la proprietar? Pierde accesul la editare și recenzii.")) return; }
      else if (act === "aproba" && !confirm("Confirmi?")) return;
      b.disabled = true;
      var path = kind === "claim" ? "revendicari" : kind === "edit" ? "modificari" : "contestatii";
      fetch("/api/admin/" + path + "/" + card.getAttribute("data-id") + "/" + act, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: note }) })
        .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, d: d }; }); })
        .then(function(x){
          if (x.ok) { if (x.d.emailSent === false) alert("Decizia a fost salvată, dar e-mailul către proprietar NU s-a putut trimite. Anunță-l tu."); location.reload(); }
          else { b.disabled = false; alert(x.d.error === "already_claimed" ? "Pagina e deja revendicată de alt cont." : "Nu s-a putut aplica."); }
        });
    });
  });
});
</script></body></html>`);
  });

  // --- decizii pe cereri ---
  app.post("/api/admin/revendicari/:id/:action", async (req, res) => {
    if (!deps.requireAdminApi(req, res)) return;
    if (!dbPool || !/^\d+$/.test(req.params.id) || !["aproba", "respinge", "cere-date"].includes(req.params.action)) { res.status(400).json({ error: "invalid_input" }); return; }
    const action = req.params.action;
    const note = typeof (req.body || {}).note === "string" ? req.body.note.trim().slice(0, 500) || null : null;
    try {
      const claim = (await dbPool.query(`SELECT id, owner_id, proposal_id, proof_urls FROM place_claims WHERE id = $1::integer AND status = 'pending'`, [req.params.id])).rows[0];
      if (!claim) { res.status(404).json({ error: "not_found" }); return; }
      let ownerEmail = null, placeName = "", placeCity = "", placeHref = "";
      try {
        const info = (await dbPool.query(`SELECT o.email, p.name, p.city FROM place_claims c JOIN accommodation_owners o ON o.id = c.owner_id JOIN pending_submissions p ON p.id = c.proposal_id WHERE c.id = $1::integer`, [claim.id])).rows[0];
        if (info) { ownerEmail = info.email; placeName = info.name; placeCity = info.city; placeHref = `https://${S.INTL_DOMAIN}/loc/${claim.proposal_id}-${slug(placeName)}`; }
      } catch (e) { /* fără e-mail */ }
      const proofs = (() => { const a = parseJson(claim.proof_urls); return Array.isArray(a) ? a : []; })();
      let otherEmails = [];
      if (action === "cere-date") {
        if (!note) { res.status(400).json({ error: "invalid_input" }); return; }
        await dbPool.query(`UPDATE place_claims SET info_request = $2 WHERE id = $1::integer`, [claim.id, note]);
      } else if (action === "aproba") {
        try { otherEmails = (await dbPool.query(`SELECT o.email FROM place_claims c JOIN accommodation_owners o ON o.id = c.owner_id WHERE c.proposal_id = $1::integer AND c.status = 'pending' AND c.id <> $2::integer`, [claim.proposal_id, claim.id])).rows.map((x) => x.email); } catch (e) { /* ignorăm */ }
        const u = await dbPool.query(`UPDATE pending_submissions SET claimed_by_owner_id = $1::integer WHERE id = $2::integer AND (claimed_by_owner_id IS NULL OR claimed_by_owner_id = $1::integer) RETURNING id`, [claim.owner_id, claim.proposal_id]);
        if (!u.rows.length) { res.status(409).json({ error: "already_claimed" }); return; }
        await dbPool.query(`UPDATE place_claims SET status = 'approved', decided_at = now(), note = COALESCE($2, note), info_request = NULL WHERE id = $1::integer`, [claim.id, note]);
        await dbPool.query(`UPDATE place_claims SET status = 'rejected', decided_at = now(), note = 'Pagina a fost atribuită altui proprietar', info_request = NULL WHERE proposal_id = $1::integer AND status = 'pending' AND id <> $2::integer`, [claim.proposal_id, claim.id]);
      } else {
        await dbPool.query(`UPDATE place_claims SET status = 'rejected', decided_at = now(), note = $2, info_request = NULL WHERE id = $1::integer`, [claim.id, note]);
      }
      // pozele de dovadă se șterg după decizie (nu și la „cere date”)
      if (action !== "cere-date") {
        let all = proofs.slice();
        if (action === "aproba") {
          try { (await dbPool.query(`SELECT proof_urls FROM place_claims WHERE proposal_id = $1::integer AND id <> $2::integer AND status = 'rejected' AND proofs_deleted_at IS NULL`, [claim.proposal_id, claim.id])).rows.forEach((x) => { const a = parseJson(x.proof_urls); if (Array.isArray(a)) all = all.concat(a); }); } catch (e) { /* ignorăm */ }
        }
        try {
          if (all.length) await deps.deleteBlobUrls(all);
          await dbPool.query(`UPDATE place_claims SET proof_urls = '[]'::jsonb, proofs_deleted_at = now() WHERE (id = $1::integer OR (proposal_id = $2::integer AND status = 'rejected')) AND proofs_deleted_at IS NULL`, [claim.id, claim.proposal_id]);
        } catch (e) { console.error("revendicari: ștergere dovezi:", e && e.message); }
      }
      const nm = E(placeName), ct = E(placeCity), reasonRo = note ? `<p><strong>Motiv:</strong> ${E(note)}</p>` : "", reasonEn = note ? `<p><strong>Reason:</strong> ${E(note)}</p>` : "";
      let emailSent = null;
      if (ownerEmail) {
        if (action === "aproba") {
          emailSent = await deps.sendOwnerNoticeEmail(ownerEmail, {
            subjectRo: `Revendicarea pentru ${placeName} a fost aprobată`, subjectEn: `Your claim for ${placeName} was approved`,
            bodyRo: `<p>Vești bune — am verificat cererea ta și am aprobat revendicarea paginii <strong>${nm}</strong> (${ct}).</p><p>Acum poți completa pagina (poze, program, meniu, contact) și poți răspunde la recenzii din contul tău:</p><p><a href="https://${S.INTL_DOMAIN}/cont">https://${S.INTL_DOMAIN}/cont</a></p><p>Pagina publică:<br><a href="${placeHref}">${placeHref}</a></p><p>Pozele de dovadă trimise de tine au fost șterse.</p>`,
            bodyEn: `<p>Good news — we reviewed your request and approved your claim of the page <strong>${nm}</strong> (${ct}).</p><p>You can now complete the page (photos, hours, menu, contact) and reply to reviews from your account:</p><p><a href="https://${S.INTL_DOMAIN}/cont">https://${S.INTL_DOMAIN}/cont</a></p><p>Public page:<br><a href="${placeHref}">${placeHref}</a></p><p>The proof photos you sent have been deleted.</p>`,
          });
        } else if (action === "respinge") {
          emailSent = await deps.sendOwnerNoticeEmail(ownerEmail, {
            subjectRo: `Revendicarea pentru ${placeName} nu a putut fi aprobată`, subjectEn: `Your claim for ${placeName} could not be approved`,
            bodyRo: `<p>Am analizat cererea ta pentru pagina <strong>${nm}</strong> (${ct}), dar nu am putut-o aproba.</p>${reasonRo}<p>${deps.OWNER_NOTICE_CONTACT_RO}</p>`,
            bodyEn: `<p>We reviewed your request for the page <strong>${nm}</strong> (${ct}), but we could not approve it.</p>${reasonEn}<p>${deps.OWNER_NOTICE_CONTACT_EN}</p>`,
          });
        } else {
          emailSent = await deps.sendOwnerNoticeEmail(ownerEmail, {
            subjectRo: `Avem nevoie de mai multe date pentru ${placeName}`, subjectEn: `We need more information for ${placeName}`,
            bodyRo: `<p>Pentru cererea ta de revendicare a paginii <strong>${nm}</strong> (${ct}) avem nevoie de mai multe date:</p><p style="border-left:3px solid #999;padding-left:10px">${E(note)}</p><p>Intră în cont și completează cererea: <a href="https://${S.INTL_DOMAIN}/cont">https://${S.INTL_DOMAIN}/cont</a> (deschide pagina locului și apasă „Revendică”).</p>`,
            bodyEn: `<p>For your request to claim the page <strong>${nm}</strong> (${ct}) we need more information:</p><p style="border-left:3px solid #999;padding-left:10px">${E(note)}</p><p>Log in and complete your request: <a href="https://${S.INTL_DOMAIN}/cont">https://${S.INTL_DOMAIN}/cont</a> (open the place page and press “Claim”).</p>`,
          });
        }
      }
      for (const em of otherEmails) {
        await deps.sendOwnerNoticeEmail(em, {
          subjectRo: `Revendicarea pentru ${placeName} nu a putut fi aprobată`, subjectEn: `Your claim for ${placeName} could not be approved`,
          bodyRo: `<p>Pagina <strong>${nm}</strong> (${ct}) a fost atribuită altui proprietar, așa că cererea ta nu a putut fi aprobată.</p><p>${deps.OWNER_NOTICE_CONTACT_RO}</p>`,
          bodyEn: `<p>The page <strong>${nm}</strong> (${ct}) has been assigned to another owner, so your request could not be approved.</p><p>${deps.OWNER_NOTICE_CONTACT_EN}</p>`,
        });
      }
      res.status(200).json({ ok: true, emailSent });
    } catch (err) { console.error("admin/revendicari:", err && err.message); res.status(500).json({ error: "server_error" }); }
  });

  // --- decizii pe modificările proprietarilor ---
  app.post("/api/admin/modificari/:id/:action", async (req, res) => {
    if (!deps.requireAdminApi(req, res)) return;
    if (!dbPool || !/^\d+$/.test(req.params.id) || !["aproba", "respinge"].includes(req.params.action)) { res.status(400).json({ error: "invalid_input" }); return; }
    const note = typeof (req.body || {}).note === "string" ? req.body.note.trim().slice(0, 500) || null : null;
    try {
      const r = (await dbPool.query(
        `SELECT p.id, p.name, p.city, p.note, p.schedule, p.photo_url, to_jsonb(p)->'photo_urls' AS photo_urls, to_jsonb(p)->'owner_edit' AS owner_edit, o.email
           FROM pending_submissions p LEFT JOIN accommodation_owners o ON o.id = p.claimed_by_owner_id WHERE p.id = $1::integer`, [req.params.id])).rows[0];
      const ed = r ? parseJson(r.owner_edit) : null;
      if (!r || !ed) { res.status(404).json({ error: "not_found" }); return; }
      const oldPhotos = photosOf(r);
      const newPhotos = Array.isArray(ed.photos) ? ed.photos.filter((u) => L.isOwnBlobUrl(u)).slice(0, 11) : [];
      let orphans = [];
      if (req.params.action === "aproba") {
        const sch = L.sanitizeProposalSchedule(ed.schedule);
        await dbPool.query(
          `UPDATE pending_submissions SET note = $1, schedule = $2, photo_url = $3, photo_urls = $4::jsonb, contact_phone = $5, website_url = $6, menu_url = $7, owner_edit = NULL, owner_edit_at = NULL, actualizat_la = now() WHERE id = $8::integer`,
          [ed.note ? String(ed.note).slice(0, 2000) : null, sch ? JSON.stringify(sch) : null, newPhotos[0] || null, JSON.stringify(newPhotos.slice(1, 11)), ed.phone || null, ed.website || null, ed.menu || null, r.id]);
        // Facebook / Instagram — separat, ca să nu strice aprobarea dacă coloanele nu există încă (retele-sociale.sql)
        try {
          const fbOk = ed.facebook ? L.sanitizePublicUrl(ed.facebook) : null, igOk = ed.instagram ? L.sanitizePublicUrl(ed.instagram) : null;
          await dbPool.query(`UPDATE pending_submissions SET facebook_url = $1, instagram_url = $2 WHERE id = $3::integer`, [fbOk || null, igOk || null, r.id]);
        } catch (e) { if (!(e && e.code === "42703")) console.error("modificari social:", e && e.message); }
        orphans = oldPhotos.filter((u) => !newPhotos.includes(u));
        if (deps.clearLocalCache) deps.clearLocalCache();
      } else {
        await dbPool.query(`UPDATE pending_submissions SET owner_edit = NULL, owner_edit_at = NULL WHERE id = $1::integer`, [r.id]);
        orphans = newPhotos.filter((u) => !oldPhotos.includes(u));
      }
      if (orphans.length) { try { await deps.deleteBlobUrls(orphans); } catch (e) { /* best effort */ } }
      let emailSent = null;
      if (r.email) {
        const nm = E(r.name), href = `https://${S.INTL_DOMAIN}/loc/${r.id}-${slug(r.name)}`;
        emailSent = req.params.action === "aproba"
          ? await deps.sendOwnerNoticeEmail(r.email, { subjectRo: `Modificările pentru ${r.name} au fost aprobate`, subjectEn: `Your changes for ${r.name} were approved`,
              bodyRo: `<p>Modificările tale la pagina <strong>${nm}</strong> au fost aprobate și sunt acum publice:</p><p><a href="${href}">${href}</a></p>`,
              bodyEn: `<p>Your changes to the page <strong>${nm}</strong> were approved and are now public:</p><p><a href="${href}">${href}</a></p>` })
          : await deps.sendOwnerNoticeEmail(r.email, { subjectRo: `Modificările pentru ${r.name} nu au fost aprobate`, subjectEn: `Your changes for ${r.name} were not approved`,
              bodyRo: `<p>Modificările tale la pagina <strong>${nm}</strong> nu au putut fi aprobate.</p>${note ? `<p><strong>Motiv:</strong> ${E(note)}</p>` : ""}<p>Poți face alte modificări din contul tău.</p>`,
              bodyEn: `<p>Your changes to the page <strong>${nm}</strong> could not be approved.</p>${note ? `<p><strong>Reason:</strong> ${E(note)}</p>` : ""}<p>You can submit new changes from your account.</p>` });
      }
      res.status(200).json({ ok: true, emailSent });
    } catch (err) { console.error("admin/modificari:", err && err.message); res.status(500).json({ error: "server_error" }); }
  });

  // --- contestații ---
  app.post("/api/admin/contestatii/:id/:action", async (req, res) => {
    if (!deps.requireAdminApi(req, res)) return;
    if (!dbPool || !/^\d+$/.test(req.params.id) || !["retrage", "inchide"].includes(req.params.action)) { res.status(400).json({ error: "invalid_input" }); return; }
    try {
      const d = (await dbPool.query(`SELECT id, proposal_id FROM place_disputes WHERE id = $1::integer AND status = 'open'`, [req.params.id])).rows[0];
      if (!d) { res.status(404).json({ error: "not_found" }); return; }
      if (req.params.action === "retrage") {
        await dbPool.query(`UPDATE pending_submissions SET claimed_by_owner_id = NULL WHERE id = $1::integer`, [d.proposal_id]);
        await dbPool.query(`UPDATE place_claims SET status = 'rejected', note = 'Retras după contestație', decided_at = now() WHERE proposal_id = $1::integer AND status = 'approved'`, [d.proposal_id]);
      }
      await dbPool.query(`UPDATE place_disputes SET status = $2, decided_at = now() WHERE id = $1::integer`, [d.id, req.params.action === "retrage" ? "withdrawn" : "closed"]);
      res.status(200).json({ ok: true });
    } catch (err) { console.error("admin/contestatii:", err && err.message); res.status(500).json({ error: "server_error" }); }
  });
}

module.exports = { mount, mountAdmin, isClaimable, taxKindFor, normalizeTaxId, isFreeMail, emailDomainStatus, checkTax, buildAutoChecks, makeEmailToken, readEmailToken, proofCodeFor, photosOf, __setFetch };

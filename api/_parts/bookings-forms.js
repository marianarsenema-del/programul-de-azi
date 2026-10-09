// Rezervări cazare — ETAPA 3: fișa de cazare (date oaspeți, criptate), vizualizare pentru gazdă, memento și ștergere automată.
// OPRIT implicit: funcționează doar dacă există BOOKINGS_DATA_KEY (32 de octeți în base64). Fără cheie, nicio rută de aici nu răspunde.
"use strict";
const crypto = require("crypto");
const core = require("./bookings-core");
const { dbPool, RESEND_API_KEY, RO_DOMAIN } = require("./static");
const L = require("./logic");

const KEY = process.env.BOOKINGS_DATA_KEY || "";
const ENABLED = !!core.dataKey(KEY);
const RETENTION_DAYS = Math.min(3650, Math.max(7, Number(process.env.BOOKINGS_FORM_RETENTION_DAYS) || 90)); // după check-out; de confirmat cu contabilul/juristul
const E = L.escapeHtml;
const sha = core.sha256;
const siteBase = () => "https://" + (RO_DOMAIN || "programul-de-azi.ro");
const tokenOf = (rid) => core.deriveToken(rid, process.env.ACCOMMODATION_SESSION_SECRET || "");
const dRo = (s) => { const [y, m, d] = String(s).slice(0, 10).split("-"); return `${d}.${m}.${y}`; };
const jsDate = (v) => (v instanceof Date ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}` : String(v || "").slice(0, 10));
const DOC_TYPES = { CI: "Carte de identitate", pasaport: "Pașaport", alt: "Alt document" };

async function sendMail(to, subject, html) {
  if (!RESEND_API_KEY || !to) return false;
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Opening Hours Today <cazare@programul-de-azi.ro>", to: [to], subject, html }),
    });
    return resp.ok;
  } catch (e) { return false; }
}

// ---------- cron: memento + ștergere ----------
async function cron() {
  const out = { reminders: 0, purged: 0 };
  if (!ENABLED || !dbPool) return out;
  const rows = (await dbPool.query(
    `SELECT r.id, r.guests, r.guest_email, r.guest_name, r.access_hash, to_char(r.check_in,'YYYY-MM-DD') AS ci, to_char(r.check_out,'YYYY-MM-DD') AS co, l.name AS listing_name
       FROM booking_reservations r JOIN accommodation_listings l ON l.id = r.listing_id
      WHERE r.status = 'confirmed' AND r.form_reminder_at IS NULL
        AND r.check_in > (now() AT TIME ZONE 'Europe/Bucharest')::date AND r.check_in - 3 <= (now() AT TIME ZONE 'Europe/Bucharest')::date
        AND (SELECT COUNT(*) FROM booking_guests g WHERE g.reservation_id = r.id) < r.guests
      LIMIT 50`)).rows;
  for (const row of rows) {
    if (sha(tokenOf(row.id)) !== row.access_hash) continue; // rezervări vechi, cu link care nu se mai poate reface
    const up = await dbPool.query(`UPDATE booking_reservations SET form_reminder_at = now() WHERE id = $1 AND form_reminder_at IS NULL RETURNING id`, [row.id]);
    if (!up.rowCount) continue;
    await sendMail(row.guest_email, "Completează fișa de cazare · " + row.listing_name,
      `<p>Bună, ${E(row.guest_name)},</p><p>Sosești la <b>${E(row.listing_name)}</b> pe ${dRo(row.ci)}. Legea cere ca fiecare oaspete să fie înregistrat. Te rugăm să completezi fișa de cazare înainte de sosire (durează cam un minut pentru fiecare persoană):</p><p><a href="${siteBase()}/cazare/fisa/${tokenOf(row.id)}">Completează fișa de cazare</a></p>`);
    out.reminders++;
  }
  const old = (await dbPool.query(
    `SELECT id FROM booking_reservations WHERE forms_purged_at IS NULL AND (status = 'cancelled' OR check_out < (now() AT TIME ZONE 'Europe/Bucharest')::date - $1::int) LIMIT 200`, [RETENTION_DAYS])).rows.map((x) => x.id);
  if (old.length) {
    await dbPool.query(`DELETE FROM booking_guests WHERE reservation_id = ANY($1::int[])`, [old]);
    await dbPool.query(`UPDATE booking_reservations SET forms_purged_at = now() WHERE id = ANY($1::int[])`, [old]);
    out.purged = old.length;
  }
  return out;
}

// ---------- pagina turistului ----------
const FORM_JS = `
const TOK=location.pathname.split('/').pop();const A='/api/rezervari/public/fisa/'+TOK;
const MSG={date_invalide:'Verifică datele introduse.',doc_necesar:'Pentru persoanele de peste 14 ani este nevoie de tipul și seria documentului.',cnp_invalid:'CNP-ul nu este valid.',acord_necesar:'Bifează acordul pentru prelucrarea datelor.',inchis:'Fișa nu mai poate fi modificată.',prea_multe_cereri:'Prea multe încercări. Încearcă peste câteva minute.',negasit:'Link invalid.'};
async function call(method,url,body){const r=await fetch(url,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});let j={};try{j=await r.json();}catch(e){}if(!r.ok)throw new Error(MSG[j.error]||j.error||'Eroare');return j;}
let data=null;
function fld(label,id,attrs,val){const i=el('input',Object.assign({id},attrs||{}));if(val)i.value=val;return el('label',{},[label,i]);}
function card(n){const f=(data.forms||[]).find(x=>x.no===n)||{};const c=el('div',{class:'card'});
c.append(el('h2',{},['Oaspetele '+n+(f.filled?' ✓':'')]));
c.append(fld('Nume complet','n'+n,{maxlength:'120',autocomplete:'off'},f.full_name||(n===1?data.holder:'')));
c.append(fld('Data nașterii','b'+n,{type:'date'},f.birth_date||''));
c.append(fld('Cetățenia','c'+n,{maxlength:'60'},f.nationality||(n===1?'România':'')));
c.append(fld('Domiciliul (localitate, județ, țară)','r'+n,{maxlength:'160'},f.residence||''));
const sel=el('select',{id:'t'+n});[['CI','Carte de identitate'],['pasaport','Pașaport'],['alt','Alt document']].forEach(x=>sel.append(el('option',{value:x[0]},[x[1]])));if(f.doc_type)sel.value=f.doc_type;
c.append(el('label',{},['Document',sel]));
c.append(fld('Seria și numărul documentului'+(f.has_doc?' (completat; las gol ca să-l păstrezi)':''),'d'+n,{maxlength:'20',autocomplete:'off'},''));
c.append(fld('CNP (opțional, doar pentru cetățeni români)'+(f.has_cnp?' (completat; las gol ca să-l păstrezi)':''),'p'+n,{maxlength:'13',inputmode:'numeric',autocomplete:'off'},''));
const b=el('button',{type:'button'},['Salvează']);const m=el('div',{class:'msg',id:'m'+n});
b.onclick=async()=>{if(!$('#ok').checked){say(m,MSG.acord_necesar,false);return;}b.disabled=true;
try{await call('POST',A+'/'+n,{consent:true,full_name:$('#n'+n).value,birth_date:$('#b'+n).value,nationality:$('#c'+n).value,residence:$('#r'+n).value,doc_type:$('#t'+n).value,doc_number:$('#d'+n).value,cnp:$('#p'+n).value});say(m,'Salvat.',true);await load(true);}catch(e){say(m,e.message,false);}b.disabled=false;};
c.append(el('div',{class:'row',style:'margin-top:10px'},[b]));c.append(m);return c;}
function render(keep){const box=$('#forms');box.replaceChildren();const done=(data.forms||[]).filter(x=>x.filled).length;
$('#prog').textContent='Completate: '+done+' din '+data.guests;
if(!data.editable){box.append(el('div',{class:'card'},['Fișa nu mai poate fi modificată (se completează până la data sosirii).']));return;}
for(let n=1;n<=data.guests;n++)box.append(card(n));}
async function load(keep){const ok=$('#ok')&&$('#ok').checked;data=await call('GET',A);$('#nm').textContent=data.listing;$('#per').textContent=data.ci.split('-').reverse().join('.')+' – '+data.co.split('-').reverse().join('.');render(keep);if($('#ok'))$('#ok').checked=!!ok;}
load().catch(e=>{$('#forms').replaceChildren(el('div',{class:'card'},[e.message]));});
`;
const FORM_HTML = `<h1 id="nm">Fișa de cazare</h1><p class="sub">Perioada: <span id="per"></span> · <span id="prog"></span></p>
<div class="card"><label style="display:flex;gap:8px;align-items:flex-start;font-weight:500"><input id="ok" type="checkbox" style="width:20px;height:20px;margin-top:2px;flex:none"><span>Sunt de acord ca datele introduse să fie transmise gazdei, exclusiv pentru evidența legală a oaspeților (fișa de cazare). Datele sunt criptate și se șterg automat după perioada legală de păstrare.</span></label></div>
<div id="forms"></div>`;

function mount(r, ctx) {
  const { jsonOnly, noStore, toId, cleanText, shell, COMMON_JS, ownerApi, ownListing } = ctx;
  const ipKey = (req) => L.hashIp(L.getClientIp(req));
  const on = (req, res, next) => (ENABLED ? next() : res.status(404).json({ error: "negasit" }));

  async function byToken(token) {
    if (!/^[a-f0-9]{64}$/.test(String(token))) return null;
    return (await dbPool.query(
      `SELECT r.id, r.listing_id, r.status, r.guests, r.guest_name, to_char(r.check_in,'YYYY-MM-DD') AS ci, to_char(r.check_out,'YYYY-MM-DD') AS co, l.name AS listing_name
         FROM booking_reservations r JOIN accommodation_listings l ON l.id = r.listing_id WHERE r.access_hash = $1`, [sha(token)])).rows[0] || null;
  }

  r.get("/cazare/fisa/:token", async (req, res) => {
    try {
      if (!ENABLED) return res.status(404).send("Not found");
      const row = await byToken(req.params.token);
      if (!row || row.status !== "confirmed") return res.status(404).send("Not found");
      shell(res, "Fișa de cazare", FORM_HTML, COMMON_JS + FORM_JS);
    } catch (e) { console.error("rezervari fisa pagina:", e.message); res.status(500).send("Eroare"); }
  });

  r.get("/api/rezervari/public/fisa/:token", on, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "rez-form-get", 120, 10))) return res.status(429).json({ error: "prea_multe_cereri" });
      const row = await byToken(req.params.token);
      if (!row || row.status !== "confirmed") return res.status(404).json({ error: "negasit" });
      const g = (await dbPool.query(`SELECT guest_no, full_name, to_char(birth_date,'YYYY-MM-DD') AS birth_date, nationality, residence, doc_type, (doc_number_enc IS NOT NULL) AS has_doc, (cnp_enc IS NOT NULL) AS has_cnp FROM booking_guests WHERE reservation_id = $1 ORDER BY guest_no`, [row.id])).rows;
      noStore(res);
      res.json({ listing: row.listing_name, ci: row.ci, co: row.co, guests: row.guests, holder: row.guest_name, editable: row.ci >= core.todayRo(),
        forms: g.map((x) => ({ no: x.guest_no, filled: true, full_name: x.full_name, birth_date: x.birth_date, nationality: x.nationality, residence: x.residence, doc_type: x.doc_type, has_doc: x.has_doc, has_cnp: x.has_cnp })) });
    } catch (e) { console.error("rezervari fisa get:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  r.post("/api/rezervari/public/fisa/:token/:no", jsonOnly, on, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "rez-form-save", 60, 60))) return res.status(429).json({ error: "prea_multe_cereri" });
      const row = await byToken(req.params.token);
      if (!row || row.status !== "confirmed") return res.status(404).json({ error: "negasit" });
      if (row.ci < core.todayRo()) return res.status(409).json({ error: "inchis" });
      const no = Number(req.params.no);
      if (!Number.isInteger(no) || no < 1 || no > row.guests) return res.status(400).json({ error: "date_invalide" });
      const b = req.body || {};
      if (b.consent !== true) return res.status(400).json({ error: "acord_necesar" });
      const name = cleanText(b.full_name, 120), nat = cleanText(b.nationality, 60), resid = cleanText(b.residence, 160);
      const birth = String(b.birth_date || "");
      if (name.length < 3 || nat.length < 2 || resid.length < 5 || !core.isDateStr(birth) || birth > core.todayRo() || core.ageOn(birth, core.todayRo()) > 120) return res.status(400).json({ error: "date_invalide" });
      const age = core.ageOn(birth, row.ci);
      const doc = cleanText(b.doc_number, 20).toUpperCase().replace(/\s+/g, " ");
      const dtype = Object.prototype.hasOwnProperty.call(DOC_TYPES, b.doc_type) ? b.doc_type : null;
      const cnp = String(b.cnp || "").replace(/\s+/g, "");
      if (doc && !/^[A-Z0-9 \-\/]{4,20}$/.test(doc)) return res.status(400).json({ error: "date_invalide" });
      if (cnp && !core.validCnp(cnp)) return res.status(400).json({ error: "cnp_invalid" });
      const ex = (await dbPool.query(`SELECT (doc_number_enc IS NOT NULL) AS has_doc FROM booking_guests WHERE reservation_id = $1 AND guest_no = $2`, [row.id, no])).rows[0];
      if (age >= 14 && !(dtype && (doc || (ex && ex.has_doc)))) return res.status(400).json({ error: "doc_necesar" });
      await dbPool.query(
        `INSERT INTO booking_guests (reservation_id, listing_id, guest_no, full_name, birth_date, is_minor, nationality, residence, doc_type, doc_number_enc, cnp_enc)
         VALUES ($1,$2,$3,$4,$5::date,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (reservation_id, guest_no) DO UPDATE SET full_name = EXCLUDED.full_name, birth_date = EXCLUDED.birth_date, is_minor = EXCLUDED.is_minor, nationality = EXCLUDED.nationality, residence = EXCLUDED.residence,
           doc_type = COALESCE(EXCLUDED.doc_type, booking_guests.doc_type), doc_number_enc = COALESCE(EXCLUDED.doc_number_enc, booking_guests.doc_number_enc), cnp_enc = COALESCE(EXCLUDED.cnp_enc, booking_guests.cnp_enc), updated_at = now()`,
        [row.id, row.listing_id, no, name, birth, age < 18, nat, resid, dtype, doc ? core.encryptField(doc, KEY) : null, cnp ? core.encryptField(cnp, KEY) : null]);
      noStore(res); res.json({ ok: true });
    } catch (e) { console.error("rezervari fisa save:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // ---------- gazda ----------
  r.get("/api/rezervari/:id/fise-rezumat", ...ownerApi, ownListing, on, async (req, res) => {
    try {
      const rows = (await dbPool.query(`SELECT reservation_id, COUNT(*)::int AS n FROM booking_guests WHERE listing_id = $1 GROUP BY reservation_id`, [req.listing.id])).rows;
      noStore(res); res.json({ forms: Object.fromEntries(rows.map((x) => [x.reservation_id, x.n])) });
    } catch (e) { console.error("rezervari fise rezumat:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // pagina de tipărit cu fișele complete (se loghează fiecare deschidere)
  r.get("/cont/rezervari/:id(\\d+)/fisa/:rid(\\d+)", L.requireAccommodationOwner, async (req, res) => {
    try {
      if (!ENABLED) return res.status(404).send("Not found");
      const lid = toId(req.params.id), rid = toId(req.params.rid), ownerId = req.accommodationOwner.ownerId;
      const row = lid && rid ? (await dbPool.query(
        `SELECT r.id, r.guests, r.status, r.unit_ids, to_char(r.check_in,'YYYY-MM-DD') AS ci, to_char(r.check_out,'YYYY-MM-DD') AS co, l.name AS listing_name
           FROM booking_reservations r JOIN accommodation_listings l ON l.id = r.listing_id JOIN booking_settings s ON s.listing_id = l.id
          WHERE r.id = $1 AND r.listing_id = $2 AND l.owner_id = $3::integer AND s.bookings_enabled`, [rid, lid, ownerId])).rows[0] : null;
      if (!row) return res.status(404).send("Not found");
      if (!(await L.checkRateLimit("own:" + ownerId, "rez-form-view", 60, 10))) return res.status(429).send("Prea multe cereri");
      const g = (await dbPool.query(`SELECT guest_no, full_name, to_char(birth_date,'YYYY-MM-DD') AS birth_date, is_minor, nationality, residence, doc_type, doc_number_enc, cnp_enc FROM booking_guests WHERE reservation_id = $1 ORDER BY guest_no`, [rid])).rows;
      await dbPool.query(`INSERT INTO booking_form_access_log (reservation_id, listing_id, owner_id, action) VALUES ($1,$2,$3,'view')`, [rid, lid, ownerId]);
      const rowsHtml = g.map((x) => `<tr><td>${x.guest_no}</td><td>${E(x.full_name)}${x.is_minor ? " (minor)" : ""}</td><td>${dRo(x.birth_date)}</td><td>${E(x.nationality)}</td><td>${E(x.residence)}</td><td>${E(DOC_TYPES[x.doc_type] || "")} ${E(core.decryptField(x.doc_number_enc, KEY) || "")}</td><td>${E(core.decryptField(x.cnp_enc, KEY) || "")}</td></tr>`).join("");
      const body = `<h1>Fișa de cazare · ${E(row.listing_name)}</h1><p class="sub">Rezervarea #${row.id} · ${dRo(row.ci)} – ${dRo(row.co)} · ${row.guests} persoane · completate: ${g.length}</p>
<div class="card"><table><thead><tr><th>Nr.</th><th>Nume</th><th>Data nașterii</th><th>Cetățenia</th><th>Domiciliul</th><th>Document</th><th>CNP</th></tr></thead><tbody>${rowsHtml || '<tr><td colspan="7">Nicio fișă completată (sau datele au fost șterse după perioada de păstrare).</td></tr>'}</tbody></table></div>
<p class="sub">Date confidențiale, folosite doar pentru evidența legală a oaspeților. Deschiderea acestei pagini este înregistrată. Nu le trimite prin canale nesecurizate.</p>
<div class="row"><button id="pr" type="button">Tipărește</button></div>`;
      shell(res, "Fișa de cazare", body, COMMON_JS + "$('#pr').onclick=()=>window.print();");
    } catch (e) { console.error("rezervari fisa gazda:", e.message); res.status(500).send("Eroare"); }
  });
}

module.exports = { ENABLED, RETENTION_DAYS, mount, cron, tokenOf };

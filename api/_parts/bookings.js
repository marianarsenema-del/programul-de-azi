// Rezervări cazare — ETAPA 0: calendar, tarife, sincronizare iCal.
// OPRIT implicit: dacă BOOKINGS_ENABLED nu e "true" (și nu ești în previzualizare cu BOOKINGS_PREVIEW_KEY),
// niciuna dintre rutele de mai jos nu răspunde — cererea cade mai departe, exact ca și cum fișierul n-ar exista.
// Se montează cu o singură linie în server.js:  require("./_parts/bookings")(app);
"use strict";
const crypto = require("crypto");
const express = require("express");
const core = require("./bookings-core");
const { dbPool, RESEND_API_KEY } = require("./static");
const sync = require("./bookings-sync")(dbPool); // prețuri: formular <-> rezervări <-> pagina pensiunii
const L = require("./logic");
const pay = require("./bookings-pay");
const forms = require("./bookings-forms");
const { qrSrc } = require("./gazda-install-ui");

const ENABLED = process.env.BOOKINGS_ENABLED === "true";
const PREVIEW_KEY = process.env.BOOKINGS_PREVIEW_KEY || "";
const MAX_FEEDS = 10;

function safeEq(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function allowed(req, res) {
  if (ENABLED) return true;
  if (!PREVIEW_KEY) return false;
  const cookie = L.parseCookies(req).bkPreview;
  if (cookie && safeEq(cookie, PREVIEW_KEY)) return true;
  if (typeof req.query.bkpreview === "string" && safeEq(req.query.bkpreview, PREVIEW_KEY)) {
    L.appendSetCookie(res, `bkPreview=${encodeURIComponent(PREVIEW_KEY)}; Path=/; Max-Age=${30 * 24 * 3600}; HttpOnly; SameSite=Lax; Secure`);
    return true;
  }
  return false;
}
// cererile care schimbă date trebuie să vină de pe propriul site
function sameOrigin(req) {
  const o = req.headers.origin;
  if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch (e) { return false; }
}
function jsonOnly(req, res, next) {
  if (req.method === "GET") return next();
  if (!sameOrigin(req)) return res.status(403).json({ error: "origine_nepermisa" });
  if (!/application\/json/i.test(req.headers["content-type"] || "")) return res.status(415).json({ error: "tip_continut" });
  next();
}
const noStore = (res) => res.set("Cache-Control", "no-store");
const toId = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };
const bani = (ron) => { const n = Number(ron); return Number.isFinite(n) && n >= 0 && n <= 1000000 ? Math.round(n * 100) : null; };
const cleanText = (s, max) => String(s == null ? "" : s).replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, max);
const cleanDays = (arr) => {
  if (arr == null) return null;
  if (!Array.isArray(arr)) return undefined;
  const o = [...new Set(arr.map(Number))];
  if (o.some((n) => !Number.isInteger(n) || n < 0 || n > 6)) return undefined;
  return o.length ? o : null;
};

async function loadListing(listingId, ownerId) {
  const { rows } = await dbPool.query(
    `SELECT l.id, l.name, l.owner_id, s.bookings_enabled, s.base_price_bani, s.currency, s.min_nights, s.max_guests, s.instant_enabled, s.lead_days, s.whole_discount_bps, s.payment_mode${pay.LIVE ? ", s.guarantee_bani" : ""}
       FROM accommodation_listings l LEFT JOIN booking_settings s ON s.listing_id = l.id
      WHERE l.id = $1::integer AND l.owner_id = $2::integer`, [listingId, ownerId]);
  return rows[0] || null;
}
// middleware: proprietarul are acces doar la anunțul lui ȘI doar dacă adminul a activat rezervările pentru el
async function ownListing(req, res, next) {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(404).json({ error: "negasit" });
    const lst = await loadListing(id, req.accommodationOwner.ownerId);
    if (!lst) return res.status(404).json({ error: "negasit" });
    if (!lst.bookings_enabled) return res.status(403).json({ error: "dezactivat" });
    lst.units = (await dbPool.query(`SELECT unit_no, name, capacity, base_price_bani FROM booking_units WHERE listing_id = $1 AND active ORDER BY sort_order, unit_no`, [id])).rows;
    req.listing = lst;
    next();
  } catch (e) { console.error("rezervari ownListing:", e.message); res.status(500).json({ error: "eroare" }); }
}

// camera cerută de client: fără camere definite = proprietate întreagă (unit 0); cu camere, implicit prima
function unitOf(req, v) {
  const us = req.listing.units || [];
  if (!us.length) return 0;
  if (v == null || v === "") return us[0].unit_no;
  const n = Number(v);
  return us.some((u) => u.unit_no === n) ? n : null;
}

// ---------- sincronizare iCal ----------
async function logSync(feedId, listingId, status, message, added, removed) {
  await dbPool.query(`INSERT INTO booking_sync_log (feed_id, listing_id, status, message, added, removed) VALUES ($1,$2,$3,$4,$5,$6)`,
    [feedId, listingId, status, String(message || "").slice(0, 300), added || 0, removed || 0]).catch(() => {});
  await dbPool.query(`DELETE FROM booking_sync_log WHERE listing_id = $1 AND id NOT IN (SELECT id FROM booking_sync_log WHERE listing_id = $1 ORDER BY id DESC LIMIT 100)`, [listingId]).catch(() => {});
}
const ERR_RO = { nu_e_icalendar: "Linkul nu returnează un calendar iCal valid", doar_https: "Sunt acceptate doar linkuri https", url_invalid: "Link invalid", gazda_nepermisa: "Adresă nepermisă", port_nepermis: "Port nepermis", fisier_prea_mare: "Fișier prea mare", timeout: "Platforma nu a răspuns la timp", retea: "Eroare de rețea", prea_multe_evenimente: "Prea multe evenimente în calendar", prea_multe_redirectari: "Prea multe redirectări" };
const errText = (c) => ERR_RO[c] || (/^http_/.test(c) ? "Platforma a răspuns cu eroare (" + c.slice(5) + ")" : "Eroare");

async function syncFeed(feed) {
  const fail = async (code) => {
    await dbPool.query(`UPDATE booking_ical_feeds SET last_sync_at = now(), last_status = 'error', last_error = $2 WHERE id = $1`, [feed.id, errText(code)]);
    await logSync(feed.id, feed.listing_id, "error", errText(code) + " — blocările existente au fost păstrate", 0, 0);
    return { ok: false, error: errText(code) };
  };
  const got = await core.safeFetchIcs(feed.import_url, { etag: feed.etag, lastModified: feed.last_modified });
  if (!got.ok) return fail(got.error);
  if (got.notModified) {
    await dbPool.query(`UPDATE booking_ical_feeds SET last_sync_at = now(), last_ok_at = now(), last_status = 'ok', last_error = NULL WHERE id = $1`, [feed.id]);
    return { ok: true, unchanged: true };
  }
  const hash = core.sha256(got.body);
  if (hash === feed.content_hash) {
    await dbPool.query(`UPDATE booking_ical_feeds SET last_sync_at = now(), last_ok_at = now(), last_status = 'ok', last_error = NULL, etag = $2, last_modified = $3 WHERE id = $1`, [feed.id, got.etag, got.lastModified]);
    return { ok: true, unchanged: true };
  }
  const parsed = core.parseIcs(got.body);
  if (!parsed.ok) return fail(parsed.error);
  const days = [...parsed.days].sort();
  const client = await dbPool.connect();
  let added = 0, removed = 0, conflicts = 0;
  try {
    await client.query("BEGIN");
    const del = await client.query(`DELETE FROM booking_calendar_days WHERE listing_id = $1 AND unit_id = $2 AND source_feed_id = $3 AND status = 2`, [feed.listing_id, feed.unit_id, feed.id]);
    removed = del.rowCount;
    if (days.length) {
      // zilele cu blocare temporară expirată sunt libere
      await client.query(`DELETE FROM booking_calendar_days WHERE listing_id = $1 AND unit_id = $2 AND status = 3 AND blocked_until < now() AND day = ANY($3::date[])`, [feed.listing_id, feed.unit_id, days]);
      const ins = await client.query(
        `INSERT INTO booking_calendar_days (listing_id, unit_id, day, status, source_feed_id) SELECT $1, $2, d, 2, $3 FROM unnest($4::date[]) AS d
         ON CONFLICT (listing_id, unit_id, day) DO NOTHING RETURNING day`, [feed.listing_id, feed.unit_id, feed.id, days]);
      added = ins.rowCount;
      const insertedSet = new Set(ins.rows.map((r) => r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10)));
      const missed = days.filter((d) => !insertedSet.has(d));
      if (missed.length) {
        const ex = await client.query(`SELECT day, status FROM booking_calendar_days WHERE listing_id = $1 AND unit_id = $2 AND day = ANY($3::date[]) AND status IN (3,4)`, [feed.listing_id, feed.unit_id, missed]);
        for (const r of ex.rows) {
          await client.query(`INSERT INTO booking_conflicts (listing_id, day, feed_id, existing_status) VALUES ($1,$2,$3,$4) ON CONFLICT (listing_id, day, feed_id) DO UPDATE SET existing_status = EXCLUDED.existing_status, resolved_at = NULL`, [feed.listing_id, r.day, feed.id, r.status]);
          conflicts++;
        }
      }
    }
    await client.query(`UPDATE booking_conflicts SET resolved_at = now() WHERE feed_id = $1 AND resolved_at IS NULL AND NOT (day = ANY($2::date[]))`, [feed.id, days]);
    await client.query(`UPDATE booking_ical_feeds SET last_sync_at = now(), last_ok_at = now(), last_status = 'ok', last_error = NULL, etag = $2, last_modified = $3, content_hash = $4, event_count = $5 WHERE id = $1`, [feed.id, got.etag, got.lastModified, hash, parsed.events]);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("rezervari syncFeed:", e.message);
    return fail("retea");
  } finally { client.release(); }
  await logSync(feed.id, feed.listing_id, "ok", conflicts ? `${conflicts} conflict(e) cu rezervări existente` : "Sincronizat", added, removed);
  return { ok: true, added, removed, conflicts };
}

// ---------- pagini ----------
const PAGE_CSS = `*{box-sizing:border-box}.global-back-btn{position:fixed;bottom:calc(28px + env(safe-area-inset-bottom,0px));left:16px;z-index:900;width:48px;height:48px;border-radius:50%;background:#1A1F35;border:2px solid #F0813A;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#F0813A;padding:0;line-height:1;box-shadow:0 8px 20px -6px rgba(0,0,0,.45)}.global-back-btn[hidden]{display:none}body{margin:0;background:#F5F2EC;color:#17222B;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.w{max-width:760px;margin:0 auto;padding:16px}h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:0 0 10px}.sub{color:#5B6770;font-size:13px;margin:0 0 14px}
.card{background:#fff;border:1px solid #E4DFD5;border-radius:14px;padding:14px;margin-bottom:14px}label{display:block;font-size:12px;font-weight:600;color:#5B6770;margin-top:8px}
input,select{width:100%;height:42px;border:1px solid #C9C3B6;border-radius:8px;padding:0 10px;font-size:15px;background:#fff;color:#17222B;margin-top:3px}
input[type=checkbox],input[type=radio]{width:20px;height:20px;margin:0 6px 0 0;padding:0;accent-color:#0E6B63;vertical-align:middle;flex:none}
button{height:42px;border:0;border-radius:10px;background:#0E6B63;color:#fff;font-weight:700;font-size:14px;padding:0 14px;cursor:pointer}button.s{background:#fff;color:#0E6B63;border:1px solid #0E6B63}button.d{background:#fff;color:#9B1C1C;border:1px solid #D9A3A3}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end}.row>*{flex:1 1 120px}.msg{font-size:13px;margin-top:8px;min-height:18px}.err{color:#9B1C1C}.ok{color:#14532D}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.cal div{height:44px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;border:1px solid #E4DFD5;background:#fff;user-select:none}
.cal .h{border:0;background:none;height:24px;font-size:11px;color:#5B6770;font-weight:700}.cal .s1{background:#E4DFD5;color:#5B6770}.cal .s2{background:#D5E6FA;color:#123A6B}.cal .s3{background:#FFF1CC}.cal .s4{background:#0E6B63;color:#fff}.cal .past{opacity:.4}.cal .sel{outline:3px solid #F0813A}.cal .cl{cursor:pointer}
.leg{font-size:12px;color:#5B6770;display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}.item{border-top:1px solid #E4DFD5;padding:10px 0;font-size:14px}.item:first-of-type{border-top:0}.mono{font-family:ui-monospace,monospace;font-size:12px;word-break:break-all;background:#F5F2EC;padding:6px;border-radius:6px}
table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:8px 4px;border-top:1px solid #E4DFD5;text-align:left}`;
function shell(res, title, bodyHtml, scriptJs, opts) {
  const st = opts && opts.stripe; // doar paginile cu plată adaugă domeniile Stripe în CSP
  const nonce = crypto.randomBytes(16).toString("base64");
  res.set({
    "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'${st ? " https://js.stripe.com" : ""}; style-src 'nonce-${nonce}'; style-src-attr 'unsafe-inline'; connect-src 'self'${st ? " https://api.stripe.com" : ""}; img-src 'self' data:${st ? " https://*.stripe.com" : ""}${st ? "; frame-src https://js.stripe.com https://hooks.stripe.com" : ""}; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`,
    "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer",
  });
  res.type("html").send(`<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${L.escapeHtml(title)}</title><style nonce="${nonce}">${PAGE_CSS}</style></head><body><div class="w">${bodyHtml}</div><script nonce="${nonce}">${scriptJs || ""}</script></body></html>`);
}
const COMMON_JS = `
const $=(s,r)=>(r||document).querySelector(s);
function el(t,a,c){const e=document.createElement(t);if(a)for(const k in a){if(k==='class')e.className=a[k];else e.setAttribute(k,a[k]);}(c||[]).forEach(x=>e.append(x));return e;}
async function api(method,url,body){const r=await fetch(url,{method,credentials:'same-origin',headers:(body||method!=='GET')?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):(method!=='GET'?'{}':undefined)});let j={};try{j=await r.json();}catch(e){}if(!r.ok)throw new Error(j.error||('Eroare '+r.status));return j;}
function say(box,t,ok){box.textContent=t;box.className='msg '+(ok?'ok':'err');}
`;


const INSTALL_JS = `
${qrSrc}
const gi=$('#gzinst');if(gi)gi.onclick=async()=>{gi.disabled=true;const o=$('#gzinstout');try{const j=await api('POST','/api/gazda/link/creeaza',{});const ua=navigator.userAgent;
 const mob=/Android|iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)||(navigator.maxTouchPoints>1&&/Linux/.test(ua)&&!/CrOS/.test(ua));
 if(mob){location.href=j.url;return;}
 o.replaceChildren();o.append(el('div',{class:'sub',style:'margin-top:10px'},['Scanează codul cu camera telefonului. Se deschide pagina de instalare, deja conectat. Codul este valabil '+j.minutes+' minute și merge o singură dată.']));
 const h=el('div');h.innerHTML=ohtQrSvg(j.url,200);o.append(h);
 o.append(el('a',{style:'display:block;text-align:center;margin-top:8px;padding:12px;border:1px solid #0E6B63;border-radius:10px;color:#0E6B63;font-weight:700;text-decoration:none',href:'https://wa.me/?text='+encodeURIComponent('OHT Host: '+j.url),target:'_blank',rel:'noopener'},['Trimite pe WhatsApp']));
}catch(e){o.className='msg err';o.textContent=e.message;}gi.disabled=false;};
`;

const OWNER_APP_JS = COMMON_JS + `
const LID=Number(location.pathname.split('/').pop());const B='/api/rezervari/'+LID;
let month=new Date();month=new Date(Date.UTC(month.getFullYear(),month.getMonth(),1));let days={},sel=[],settings={},rules=[],feeds=[];let units=[],curUnit='';const uq=(p)=>curUnit?(p+'unit='+curUnit):'';
const ds=(d)=>d.toISOString().slice(0,10);const today=ds(new Date());
const RO=['ian','feb','mar','apr','mai','iun','iul','aug','sep','oct','nov','dec'];
async function loadCal(){const from=ds(month),to=ds(new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,1)));const j=await api('GET',B+'/calendar?from='+from+'&to='+to+uq('&'));days={};j.days.forEach(d=>days[d.day]=d.status);renderCal();}
function renderCal(){const g=$('#cal');g.replaceChildren();['L','M','M','J','V','S','D'].forEach(x=>g.append(el('div',{class:'h'},[x])));
const first=month.getUTCDay()===0?6:month.getUTCDay()-1;for(let i=0;i<first;i++)g.append(el('div',{style:'border:0;background:none'}));
const n=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate();
for(let d=1;d<=n;d++){const s=ds(new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth(),d)));const st=days[s]||0;
const c=el('div',{class:(st?'s'+st:'')+(s<today?' past':' cl')+(sel.includes(s)?' sel':'')},[String(d)]);
if(s>=today)c.addEventListener('click',()=>{if(sel.includes(s))sel=sel.filter(x=>x!==s);else sel.push(s);renderCal();$('#selinfo').textContent=sel.length?sel.length+' zile selectate':'';});g.append(c);}
$('#mname').textContent=RO[month.getUTCMonth()]+' '+month.getUTCFullYear();}
async function act(action){const m=$('#calmsg');if(!sel.length)return say(m,'Alege mai întâi zilele din calendar.',false);
try{const r=await api('POST',B+'/zile',{days:sel,action,unit:curUnit?Number(curUnit):undefined});sel=[];$('#selinfo').textContent='';await loadCal();say(m,r.changed+' zile actualizate'+(r.skipped?(' · '+r.skipped+' nu pot fi schimbate (rezervare sau platformă)'):''),true);}catch(e){say(m,e.message,false);}}
$('#prev').onclick=()=>{month=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()-1,1));loadCal();};
$('#next').onclick=()=>{month=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,1));loadCal();};
$('#close').onclick=()=>act('close');$('#open').onclick=()=>act('open');
async function loadAll(){const j=await api('GET',B+'/tarife');settings=j.settings;rules=j.rules;units=j.units||[];renderUnits();
$('#pmd').checked=settings.payment_mode!=='online';$('#pmo').checked=settings.payment_mode==='online';$('#wdisc').value=settings.whole_discount_bps?settings.whole_discount_bps/100:'';
payNote();loadPay();$('#guarwrap').hidden=!settings.payments_live;$('#guar').value=settings.guarantee_bani?settings.guarantee_bani/100:'';
$('#inst').checked=!!settings.instant_enabled;$('#lead').value=String(settings.lead_days);$('#publink').textContent=settings.instant_enabled?('Link de rezervare: '+location.origin+'/cazare/rezerva/'+LID):'';
$('#base').value=settings.base_price_bani==null?'':(settings.base_price_bani/100);$('#minn').value=settings.min_nights;$('#maxg').value=settings.max_guests||'';
const box=$('#rules');box.replaceChildren();if(!rules.length)box.append(el('div',{class:'sub'},['Nu ai încă tarife speciale.']));
rules.forEach(r=>{const dn=['D','L','Ma','Mi','J','V','S'];const info=(r.kind==='weekend'?'Weekend (vineri și sâmbătă)':r.date_from+' → '+r.date_to)+' · '+(r.pct_bps!=null?((r.pct_bps>=0?'+':'')+(r.pct_bps/100)+'% față de prețul camerei'):(r.price_bani/100)+' RON/noapte')+(r.min_nights?' · min '+r.min_nights+' nopți':'')+(r.checkin_days?' · check-in: '+r.checkin_days.map(x=>dn[x]).join(','):'')+(r.checkout_days?' · check-out: '+r.checkout_days.map(x=>dn[x]).join(','):'');
const del=el('button',{class:'d',type:'button'},['Șterge']);del.onclick=async()=>{if(!confirm('Ștergi tariful „'+r.name+'”?'))return;await api('DELETE',B+'/tarife/'+r.id);loadAll();};
const ed=el('button',{class:'s',type:'button'},['Editează']);ed.onclick=()=>fillRule(r);
box.append(el('div',{class:'item'},[el('b',{},[r.name+unitTag(r.unit_no)]),el('div',{class:'sub'},[info]),el('div',{class:'row'},[ed,del])]));});}
function fillRule(r){$('#runit').value=r.unit_no==null?'':String(r.unit_no);$('#rid').value=r.id||'';$('#rname').value=r.name||'';$('#rkind').value=r.kind||'interval';$('#rfrom').value=r.date_from||'';$('#rto').value=r.date_to||'';$('#rprice').value=r.price_bani?r.price_bani/100:'';$('#rmin').value=r.min_nights||'';$('#rprio').value=r.priority||0;
for(let i=0;i<7;i++){$('#ci'+i).checked=!r.checkin_days||r.checkin_days.includes(i);$('#co'+i).checked=!r.checkout_days||r.checkout_days.includes(i);}window.scrollTo({top:$('#ruleform').offsetTop-10,behavior:'smooth'});}
$('#savebase').onclick=async()=>{const m=$('#basemsg');try{await api('POST',B+'/setari',{base_price_ron:$('#base').value===''?null:Number($('#base').value),min_nights:Number($('#minn').value||1),max_guests:$('#maxg').value?Number($('#maxg').value):null});say(m,'Salvat',true);}catch(e){say(m,e.message,false);}};
function days7(p){const a=[];for(let i=0;i<7;i++)if($('#'+p+i).checked)a.push(i);return a.length===7?null:a;}
$('#saverule').onclick=async()=>{const m=$('#rulemsg');try{const body={unit_no:$('#runit').value===''?null:Number($('#runit').value),id:$('#rid').value?Number($('#rid').value):undefined,name:$('#rname').value,kind:$('#rkind').value,date_from:$('#rfrom').value||null,date_to:$('#rto').value||null,price_ron:Number($('#rprice').value),min_nights:$('#rmin').value?Number($('#rmin').value):null,checkin_days:days7('ci'),checkout_days:days7('co'),priority:Number($('#rprio').value||0)};
await api('POST',B+'/tarife',body);fillRule({});say(m,'Tarif salvat',true);loadAll();}catch(e){say(m,e.message,false);}};
(async()=>{const t=await api('GET','/api/rezervari/sabloane?year='+new Date().getFullYear());const box=$('#tpl');t.templates.forEach(x=>{const b=el('button',{class:'s',type:'button'},[x.name]);b.onclick=()=>fillRule({name:x.name,kind:'interval',date_from:x.date_from,date_to:x.date_to});box.append(b);});})();
$('#saveinst').onclick=async()=>{const m=$('#instmsg');try{await api('POST',B+'/setari',{base_price_ron:settings.base_price_bani==null?null:settings.base_price_bani/100,min_nights:settings.min_nights,max_guests:settings.max_guests,instant_enabled:$('#inst').checked,lead_days:Number($('#lead').value)});say(m,'Salvat',true);loadAll();}catch(e){say(m,e.message,false);}};
$('#savepref').onclick=async()=>{const m=$('#prefmsg');try{await api('POST',B+'/preferinte',{payment_mode:$('#pmo').checked?'online':'direct',whole_discount_pct:$('#wdisc').value===''?0:Number($('#wdisc').value),guarantee_ron:settings.payments_live?($('#guar').value===''?0:Number($('#guar').value)):undefined});say(m,'Salvat',true);loadAll();}catch(e){say(m,e.message,false);}};
function payNote(){const on=$('#pmo').checked;let t='';if(on){if(!settings.payments_live)t='Plata online nu este încă activă. Deocamdată rezervările tale funcționează cu plata direct la proprietate, fără comision. Te trecem pe plata online când o lansăm.';else if(window.__payOk===false)t='Ca să primești plăți online, configurează încasările (Stripe). Până atunci rezervările rămân cu plată directă, fără comision.';}$('#pmnote').textContent=t;}
async function loadPay(){const box=$('#stripebox');box.replaceChildren();if(!settings.payments_live)return;
try{const j=await api('GET','/api/rezervari/plati/stare');const ok=!!j.payouts_enabled;window.__payOk=ok;
box.append(el('div',{class:'sub'},[ok?'Încasări online: active. Banii rezervărilor plătite online îți sunt virați la 24 de ore după check-in, minus comisionul.':(j.connected?'Contul tău de încasări nu este încă complet. Finalizează formularul Stripe.':'Pentru plata online trebuie să îți configurezi contul de încasări (Stripe).')]));
if(!ok){const b=el('button',{type:'button'},[j.connected?'Continuă configurarea':'Configurează încasările (Stripe)']);b.onclick=async()=>{b.disabled=true;try{const r=await api('POST','/api/rezervari/plati/cont',{});location.href=r.url;}catch(e){alert(e.message);b.disabled=false;}};box.append(el('div',{class:'row',style:'margin-top:6px'},[b]));}
payNote();}catch(e){}}
$('#pmo').onchange=$('#pmd').onchange=payNote;
const PAYST={awaiting:'în așteptare',partial:'avans plătit',paid:'plătită',rest_failed:'rest neplătit',refunded:'returnată',forfeited:'anulată, suma se reține',refund_failed:'rambursare de verificat'};
async function loadResv(){const j=await api('GET',B+'/rezervari');let fm=null;try{fm=(await api('GET',B+'/fise-rezumat')).forms||{};}catch(e){}const box=$('#resv');box.replaceChildren();if(!j.reservations.length)box.append(el('div',{class:'sub'},['Nu ai încă rezervări.']));
j.reservations.forEach(x=>{const info=x.check_in+' → '+x.check_out+(x.unit_ids&&x.unit_ids[0]!==0?' · '+x.unit_ids.map(unitName).join(', '):'')+' · '+x.guests+' pers. · '+(x.total_bani/100)+' RON'+(x.commission_bani?' (comision '+(x.commission_bani/100)+' RON)':'')+(x.pay_scheme&&x.pay_scheme!=='direct'?' · online: '+(PAYST[x.pay_status]||x.pay_status)+' ('+(x.paid_bani/100)+' RON)':'');
const kids=[el('b',{},[x.guest_name+(x.status==='cancelled'?(x.refused?' · refuzată de gazdă':' · anulată'):'')]),el('div',{class:'sub'},[info]),el('div',{class:'sub'},[x.guest_phone+' · '+x.guest_email])];
if(x.status==='confirmed'){const b=el('button',{class:'d',type:'button'},['Anulează']);b.onclick=async()=>{if(!confirm('Anulezi rezervarea lui '+x.guest_name+'? Zilele se eliberează și turistul primește e-mail.'+(x.pay_scheme&&x.pay_scheme!=='direct'&&x.paid_bani?' Suma plătită se returnează integral turistului.':'')))return;try{await api('POST',B+'/rezervari/'+x.id+'/anuleaza',{});loadResv();loadCal();}catch(e){alert({plata_efectuata:'Banii au fost deja virați; nu se mai poate anula automat. Contactează-ne.',rambursare_esuata:'Rambursarea a eșuat. Încearcă din nou în câteva minute.'}[e.message]||e.message);}};kids.push(el('div',{class:'row'},[b]));}
if(fm&&x.status==='confirmed'){const n=fm[x.id]||0;const fr=el('div',{class:'sub'},['Fișe de cazare: '+n+' din '+x.guests+' ']);if(n)fr.append(el('a',{href:'/cont/rezervari/'+LID+'/fisa/'+x.id,target:'_blank',rel:'noopener'},['Vezi fișele']));kids.push(fr);}
if(x.guarantee_bani){const GS={pending:'se blochează cu o zi înainte de sosire',held:'blocată pe card',failed:'nu a putut fi blocată',released:'eliberată',claimed:'reținută '+(x.guarantee_claimed_bani/100)+' RON'};kids.push(el('div',{class:'sub'},['Garanție '+(x.guarantee_bani/100)+' RON: '+(GS[x.guarantee_status]||'')]));
if(x.guarantee_status==='held'){const g=el('button',{class:'s',type:'button'},['Reține din garanție']);g.onclick=()=>claimGar(x);kids.push(el('div',{class:'row'},[g]));}}
if(x.status==='confirmed'){const rf=el('button',{class:'d',type:'button'},['Refuză oaspetele']);rf.onclick=()=>refuse(x);kids.push(el('div',{class:'row'},[rf]));}
box.append(el('div',{class:'item'},kids));});}
async function claimGar(x){const a=prompt('Câți RON reții din garanție? (maxim '+(x.guarantee_bani/100)+')');if(a===null)return;const note=prompt('Motivul reținerii (minim 10 caractere; turistul îl primește pe e-mail)');if(note===null)return;
try{await api('POST',B+'/rezervari/'+x.id+'/garantie',{amount_ron:Number(String(a).replace(',','.')),note});loadResv();}catch(e){alert({garantie_indisponibila:'Garanția nu este blocată pe card.',suma_invalida:'Sumă invalidă.',termen_expirat:'Termenul de reținere a expirat.',captura_esuata:'Banca nu a permis reținerea. Încearcă din nou.',date_invalide:'Completează suma și motivul (minim 10 caractere).'}[e.message]||e.message);}}
function refuse(x){const ov=el('div',{style:'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;z-index:9'});
const sel=el('select',{id:'rfc'});[['form_incomplete','Fișă de cazare incompletă (turistul refuză transmiterea datelor legale)'],['false_data','Date de identificare false / suspecte'],['fraud','Comportament neadecvat / tentativă de fraudă'],['other','Altul (necesită explicații detaliate)']].forEach(o=>sel.append(el('option',{value:o[0]},[o[1]])));
const ta=el('textarea',{id:'rfn',maxlength:'300',rows:'3',placeholder:'Comentariu scurt (obligatoriu)'});
const msg=el('div',{class:'msg'});const ok=el('button',{class:'d',type:'button'},['Confirmă refuzul']);const no=el('button',{class:'s',type:'button'},['Renunță']);no.onclick=()=>ov.remove();
ok.onclick=async()=>{ok.disabled=true;try{await api('POST',B+'/rezervari/'+x.id+'/refuza',{code:sel.value,note:ta.value});ov.remove();loadResv();loadCal();}catch(e){say(msg,{date_invalide:'Alege motivul și scrie un comentariu (la „Altul”, minim 15 caractere).',plata_efectuata:'Banii au fost deja virați; nu se mai poate refuza automat.',rambursare_esuata:'Rambursarea a eșuat. Încearcă din nou.'}[e.message]||e.message,false);ok.disabled=false;}};
ov.append(el('div',{class:'card',style:'max-width:460px;width:100%'},[el('h2',{},['Refuză oaspetele']),el('div',{class:'sub'},['Rezervarea se anulează, turistul primește banii înapoi integral (dacă a plătit online) și zilele se eliberează.']),el('label',{},['Motiv',sel]),el('label',{},['Comentariu',ta]),el('div',{class:'row',style:'margin-top:10px'},[no,ok]),msg]));document.body.append(ov);}
$('#qgo').onclick=async()=>{const m=$('#qmsg');try{const q=await api('GET',B+'/pret?checkin='+$('#qin').value+'&checkout='+$('#qout').value+'&guests='+($('#qg').value||1)+uq('&'));
say(m,(q.ok?'Disponibil · ':'Nu se poate: '+q.errors.join(', ')+' · ')+'total '+(q.totalBani/100)+' RON ('+q.nights.length+' nopți)',q.ok);}catch(e){say(m,e.message,false);}};
async function loadFeeds(){const j=await api('GET',B+'/fluxuri');feeds=j.feeds;const box=$('#feeds');box.replaceChildren();
if(!feeds.length)box.append(el('div',{class:'sub'},['Nu ai adăugat încă nicio platformă.']));
feeds.forEach(f=>{const url=location.origin+'/api/rezervari/ical/'+f.export_token+'.ics';
const sy=el('button',{class:'s',type:'button'},['Sincronizează acum']);sy.onclick=async()=>{sy.disabled=true;try{const r=await api('POST',B+'/fluxuri/'+f.id+'/sincronizare');say($('#fmsg'),r.ok?'Sincronizat':r.error,r.ok);}catch(e){say($('#fmsg'),e.message,false);}sy.disabled=false;loadFeeds();loadCal();};
const cp=el('button',{class:'s',type:'button'},['Copiază linkul nostru']);cp.onclick=async()=>{try{await navigator.clipboard.writeText(url);cp.textContent='Copiat ✓';setTimeout(()=>cp.textContent='Copiază linkul nostru',2000);}catch(e){prompt('Copiază linkul:',url);}};
const del=el('button',{class:'d',type:'button'},['Șterge']);del.onclick=async()=>{if(!confirm('Ștergi platforma „'+f.platform+'”? Zilele ei se eliberează.'))return;await api('DELETE',B+'/fluxuri/'+f.id);loadFeeds();loadCal();};
const st=f.import_url?(f.last_status==='ok'?'Ultima sincronizare reușită: '+(f.last_ok_at||'-').replace('T',' ').slice(0,16):(f.last_status==='error'?'Eroare: '+f.last_error:'Încă nesincronizat')):'Doar export (fără import)';
feeds && box.append(el('div',{class:'item'},[el('b',{},[f.platform+(f.label?' · '+f.label:'')+unitTag(f.unit_id)]),el('div',{class:'sub'},[st]),el('div',{class:'mono'},[url]),el('div',{class:'row'},[cp,f.import_url?sy:el('span'),del])]));});}
$('#fprev').onclick=async()=>{const m=$('#fmsg');try{const r=await api('POST',B+'/fluxuri/previzualizare',{import_url:$('#furl').value});say(m,'Link valid: '+r.events+' evenimente, '+r.nights+' nopți ocupate.'+(r.periods.length?' Ex.: '+r.periods.slice(0,3).map(p=>p.from+' → '+p.toExclusive).join('; '):''),true);}catch(e){say(m,e.message,false);}};
$('#fadd').onclick=async()=>{const m=$('#fmsg');try{await api('POST',B+'/fluxuri',{platform:$('#fplat').value,label:$('#flabel').value,import_url:$('#furl').value||null,unit_no:$('#funit').value===''?null:Number($('#funit').value)});$('#furl').value='';$('#flabel').value='';say(m,'Platformă adăugată',true);loadFeeds();loadCal();}catch(e){say(m,e.message,false);}};
function unitName(n){const u=units.find(x=>x.unit_no===n);return u?u.name:('Camera '+n);}
function unitTag(n){return (n==null||n===0||!units.length)?'':' · '+unitName(n);}
function renderUnits(){const sel=$('#unitsel'),rs=$('#runit'),fs=$('#funit');$('#unitwrap').hidden=!units.length;$('#funitwrap').hidden=!units.length;
sel.replaceChildren();units.forEach(u=>sel.append(el('option',{value:String(u.unit_no)},[u.name])));
const prev=curUnit;if(units.length){if(!units.some(u=>String(u.unit_no)===curUnit))curUnit=String(units[0].unit_no);sel.value=curUnit;}else curUnit='';
rs.replaceChildren(el('option',{value:''},[units.length?'Toate camerele':'Toată proprietatea']));units.forEach(u=>rs.append(el('option',{value:String(u.unit_no)},[u.name])));
fs.replaceChildren();units.forEach(u=>fs.append(el('option',{value:String(u.unit_no)},[u.name])));
const box=$('#units');box.replaceChildren();if(!units.length)box.append(el('div',{class:'sub'},['Fără camere definite: toată proprietatea se rezervă ca o singură unitate. Adaugă camere dacă le închiriezi separat.']));
units.forEach(u=>{const ed=el('button',{class:'s',type:'button'},['Editează']);ed.onclick=()=>{$('#uno').value=u.unit_no;$('#uname').value=u.name;$('#ucap').value=u.capacity;$('#uprice').value=u.base_price_bani==null?'':u.base_price_bani/100;};
const del=el('button',{class:'d',type:'button'},['Șterge']);del.onclick=async()=>{if(!confirm('Ștergi „'+u.name+'”? Se șterg și calendarul și legăturile ei cu platformele.'))return;try{await api('DELETE',B+'/camere/'+u.unit_no);await loadAll();loadFeeds();loadCal();}catch(e){say($('#unitmsg'),e.message,false);}};
box.append(el('div',{class:'item'},[el('b',{},[u.name]),el('div',{class:'sub'},[u.capacity+' persoane'+(u.base_price_bani==null?' · preț de bază':' · '+(u.base_price_bani/100)+' RON/noapte')]),el('div',{class:'row'},[ed,del])]));});
if(curUnit!==prev&&prev!==undefined&&days)loadCal();}
$('#unitsel').onchange=()=>{curUnit=$('#unitsel').value;sel=[];$('#selinfo').textContent='';loadCal();};
$('#saveunit').onclick=async()=>{const m=$('#unitmsg');try{await api('POST',B+'/camere',{unit_no:$('#uno').value?Number($('#uno').value):undefined,name:$('#uname').value,capacity:Number($('#ucap').value),price_ron:$('#uprice').value===''?null:Number($('#uprice').value)});['uno','uname','ucap','uprice'].forEach(i=>$('#'+i).value='');say(m,'Salvat',true);await loadAll();loadFeeds();loadCal();}catch(e){say(m,e.message,false);}};
loadCal();loadAll();loadFeeds();loadResv();
`;
const dayChecks = (p) => [0, 1, 2, 3, 4, 5, 6].map((i) => `<label style="display:inline-block;margin:4px 8px 0 0;font-weight:500"><input type="checkbox" id="${p}${i}" checked style="width:auto;height:auto;margin:0 3px 0 0">${["D", "L", "Ma", "Mi", "J", "V", "S"][i]}</label>`).join("");
const OWNER_APP_HTML = (name) => `<h1>${L.escapeHtml(name)}</h1><p class="sub">Calendar, tarife și sincronizare cu alte platforme</p><div class="card" style="border-color:#0E6B63"><b>📲 Instalează aplicația OHT Host</b><div class="sub" style="margin:4px 0 10px">Calendar și rezervări pe telefon, cu Face ID, amprentă sau PIN. Apeși o dată și te duce direct pe pagina de instalare, deja conectat.</div><button id="gzinst" type="button" style="width:100%;height:52px;font-size:17px">Instalează aplicația</button><div id="gzinstout"></div></div><div class="card"><b>Ai deja aplicația OHT Host pe ecranul principal și îți cere un cod?</b><div class="sub" style="margin:4px 0 8px">Apasă butonul de mai jos. Apare un cod de 8 caractere, valabil 10 minute. Scrie-l în aplicația OHT Host și alege un PIN.</div><button id="gzcode" type="button">Generează cod</button><div id="gzout" class="msg"></div></div>
<div class="card"><h2>Camere</h2><div class="sub">Dacă închiriezi camerele separat, adaugă-le aici. Fiecare are calendar, preț și linkuri iCal proprii. Turistul poate rezerva una, mai multe sau toate camerele deodată.</div><div id="units"></div>
<input type="hidden" id="uno"><div class="row"><div><label>Nume cameră<input id="uname" maxlength="60" placeholder="Camera 1"></label></div><div><label>Persoane<input id="ucap" type="number" min="1" max="50"></label></div><div><label>Preț/noapte (RON, opțional)<input id="uprice" type="number" min="0"></label></div></div>
<div class="row" style="margin-top:10px"><button id="saveunit" type="button">Salvează camera</button></div><div class="msg" id="unitmsg"></div></div>
<div class="card"><h2>Calendar</h2><div id="unitwrap" hidden><label>Camera<select id="unitsel"></select></label></div><div class="row" style="align-items:center"><button class="s" id="prev" type="button">‹</button><b id="mname" style="text-align:center"></b><button class="s" id="next" type="button">›</button></div><div class="cal" id="cal" style="margin-top:10px"></div>
<div class="leg"><span>Gri = închis de tine</span><span>Albastru = platformă externă</span><span>Galben = blocare temporară</span><span>Verde = rezervat</span></div>
<div class="row" style="margin-top:10px"><button id="close" type="button">Închide zilele alese</button><button class="s" id="open" type="button">Deschide zilele alese</button></div><div class="sub" id="selinfo"></div><div class="msg" id="calmsg"></div></div>
<div class="card"><h2>Preț de bază și reguli generale</h2><div class="row"><div><label>Preț pe noapte (RON)<input id="base" type="number" min="0" step="1"></label></div><div><label>Ședere minimă (nopți)<input id="minn" type="number" min="1" max="60"></label></div><div><label>Număr maxim de persoane<input id="maxg" type="number" min="1"></label></div></div><div class="row" style="margin-top:10px"><button id="savebase" type="button">Salvează</button></div><div class="msg" id="basemsg"></div></div>
<div class="card"><h2>Tarife speciale</h2><div class="sub">Ordinea de prioritate: perioadă specială → weekend → preț de bază.</div><div id="rules"></div></div>
<div class="card" id="ruleform"><h2>Adaugă / editează tarif</h2><div class="sub">Șabloane rapide:</div><div class="row" id="tpl"></div><input type="hidden" id="rid">
<label>Nume<input id="rname" maxlength="80"></label><label>Se aplică la<select id="runit"></select></label><div class="row"><div><label>Tip<select id="rkind"><option value="interval">Perioadă</option><option value="weekend">Weekend (vineri și sâmbătă)</option></select></label></div><div><label>Preț pe noapte (RON)<input id="rprice" type="number" min="0"></label></div></div>
<div class="row"><div><label>De la<input id="rfrom" type="date"></label></div><div><label>Până la (inclusiv)<input id="rto" type="date"></label></div></div>
<div class="row"><div><label>Ședere minimă (opțional)<input id="rmin" type="number" min="1" max="60"></label></div><div><label>Prioritate (mai mare câștigă)<input id="rprio" type="number" value="0"></label></div></div>
<label>Zile de check-in permise</label><div>${dayChecks("ci")}</div><label>Zile de check-out permise</label><div>${dayChecks("co")}</div>
<div class="row" style="margin-top:10px"><button id="saverule" type="button">Salvează tariful</button></div><div class="msg" id="rulemsg"></div></div>
<div class="card"><h2>Verifică un preț</h2><div class="row"><div><label>Sosire<input id="qin" type="date"></label></div><div><label>Plecare<input id="qout" type="date"></label></div><div><label>Persoane<input id="qg" type="number" min="1" value="2"></label></div></div><div class="row" style="margin-top:10px"><button class="s" id="qgo" type="button">Calculează</button></div><div class="msg" id="qmsg"></div></div>
<div class="card"><h2>Rezervare instant</h2><div class="sub">Turiștii pot rezerva singuri perioadele libere, fără aprobarea ta. Plata se face direct la tine. Primești e-mail la fiecare rezervare.</div>
<label style="display:flex;gap:8px;align-items:center;font-weight:600;color:#17222B"><input type="checkbox" id="inst" style="width:22px;height:22px;margin:0">Activează rezervarea instant</label>
<label>Cel mai devreme se poate rezerva<select id="lead"><option value="0">chiar azi</option><option value="1">de mâine</option><option value="2">peste 2 zile</option><option value="3">peste 3 zile</option><option value="7">peste 7 zile</option></select></label>
<div class="row" style="margin-top:10px"><button id="saveinst" type="button">Salvează</button></div><div class="msg" id="instmsg"></div>
<div class="sub" id="publink" style="margin-top:6px"></div></div>
<div class="card"><h2>Plată și reduceri</h2>
<label>Cum încasezi plata</label>
<label style="display:flex;gap:10px;align-items:flex-start;font-weight:500;color:#17222B;margin-top:6px"><input type="radio" name="pm" id="pmd" value="direct" style="width:20px;height:20px;margin:2px 0 0;flex:none"><span><b>Direct la proprietate</b><br><span class="sub">Fără comision. Te înțelegi cu turistul cum încasezi.</span></span></label>
<label style="display:flex;gap:10px;align-items:flex-start;font-weight:500;color:#17222B;margin-top:8px"><input type="radio" name="pm" id="pmo" value="online" style="width:20px;height:20px;margin:2px 0 0;flex:none"><span><b>Plată prin Opening Hours Today</b> <span style="background:#0E6B63;color:#fff;border-radius:6px;padding:2px 7px;font-size:11px;font-weight:700">Recomandată</span><br><span class="sub">Turistul plătește online, în siguranță, iar tu primești banii după sosire. Se aplică un comision. Disponibilă în curând.</span></span></label>
<div class="sub" id="pmnote" style="margin-top:6px"></div><div id="stripebox" style="margin-top:6px"></div>
<div id="guarwrap" hidden><label>Garanție pentru stricăciuni (RON, 0 = fără)<input id="guar" type="number" min="0" max="10000" step="1" placeholder="0"></label><div class="sub">Se blochează pe cardul turistului cu o zi înainte de sosire (nu se debitează) și se eliberează automat după plecare. Dacă ai daune, o poți reține din cont. Doar la plata online.</div></div>
<label>Reducere dacă se închiriază toată pensiunea (%)<input id="wdisc" type="number" min="0" max="50" step="0.5" placeholder="0"></label><div class="sub">Se aplică automat când turistul rezervă toate camerele deodată.</div>
<div class="row" style="margin-top:10px"><button id="savepref" type="button">Salvează</button></div><div class="msg" id="prefmsg"></div></div>
<div class="card"><h2>Rezervări</h2><div id="resv"></div></div>
<div class="card"><h2>Sincronizare platforme (iCal)</h2><div class="sub">Pentru fiecare platformă primești un link al nostru, pe care îl lipești în calendarul acelei platforme, și poți adăuga linkul ei pe care îl citim noi.</div><div id="feeds"></div></div>
<div class="card"><h2>Adaugă o platformă</h2><div style="background:#FDECEA;border:1px solid #C0392B;border-radius:10px;padding:10px 12px;margin:0 0 12px;color:#9B1C1C;font-weight:700;font-size:14px;line-height:1.45">⚠️ Important: dacă ai cazarea listată și pe alte platforme (Booking.com, Airbnb, Travelminit etc.), este obligatoriu să adaugi aici linkul lor iCal. Altfel calendarele nu se sincronizează și riști <u>overbooking</u> (aceeași perioadă rezervată de două ori, o dată la ele și o dată la noi).</div><div class="row"><div><label>Platforma<select id="fplat"><option>Booking.com</option><option>Airbnb</option><option>Travelminit</option><option>Direct Booking</option><option>Altă platformă</option></select></label></div><div><label>Nume (opțional)<input id="flabel" maxlength="80"></label></div></div>
<div id="funitwrap" hidden><label>Pentru camera<select id="funit"></select></label></div><label>Linkul iCal al platformei (https://…)<input id="furl" placeholder="https://"></label><div class="row" style="margin-top:10px"><button class="s" id="fprev" type="button">Verifică linkul</button><button id="fadd" type="button">Adaugă platforma</button></div><div class="msg" id="fmsg"></div></div>`;

const ADMIN_APP_JS = COMMON_JS + `
async function load(){const j=await api('GET','/api/admin/rezervari/anunturi');$('#st').textContent='Comutator global: '+(j.globalEnabled?'PORNIT':'OPRIT (doar previzualizare)');
const b=$('#tb');b.replaceChildren();j.listings.forEach(l=>{const c=el('input',{type:'checkbox'});c.checked=l.enabled;c.style.cssText='width:22px;height:22px';
c.onchange=async()=>{try{await api('POST','/api/admin/rezervari/setari',{listingId:l.id,enabled:c.checked});}catch(e){alert(e.message);c.checked=!c.checked;}};
const ci=el('input',{type:'number',min:'0',max:'50',step:'0.5'});ci.value=l.commission_bps/100;ci.style.cssText='width:70px;height:34px';
ci.onchange=async()=>{try{await api('POST','/api/admin/rezervari/setari',{listingId:l.id,enabled:c.checked,commissionPct:Number(ci.value)});}catch(e){alert(e.message);}};
b.append(el('tr',{},[el('td',{},[l.name+' · '+(l.city||'')+(l.instant?' · instant ON':''),el('div',{class:'sub',style:'margin:2px 0 0'},['Cont proprietar: '+(l.owner_email||'—')])]),el('td',{},['#'+l.id]),el('td',{},[c]),el('td',{},[ci])]));});}
load();
const RC={form_incomplete:'Fișă incompletă',false_data:'Date false/suspecte',fraud:'Comportament/fraudă',other:'Altul'};
async function loadRef(){try{const j=await api('GET','/api/admin/rezervari/refuzuri');const a=$('#alerts');a.replaceChildren();
j.flagged.forEach(f=>{const d=el('div',{class:'card',style:'border-color:#C0392B;background:#FDECEA;color:#7A1F14;font-weight:700'},['⚠️ Atenție: '+f.name+' (#'+f.id+') are o rată de refuz neobișnuit de mare: '+f.n+' refuzuri în ultimele 90 de zile. Risc de overbooking mascat sau discriminare.']);a.append(d);});
const b=$('#rf');b.replaceChildren();j.recent.forEach(x=>b.append(el('tr',{},[el('td',{},[x.at]),el('td',{},[x.name+' (#'+x.listing_id+')']),el('td',{},[RC[x.code]||x.code]),el('td',{},[x.note]),el('td',{},[(x.refunded_bani/100)+' RON'])])));}catch(e){}}
loadRef();`;

// ---------- montare ----------
module.exports = function mountBookings(app) {
  const r = express.Router();
  let cleanupHolds = async () => {};
  r.use((req, res, next) => (allowed(req, res) && dbPool ? next() : next("router"))); // oprit → cade mai departe (404 normal)
  const ownerApi = [L.requireAccommodationOwnerApi, jsonOnly];
  require("./bookings-gazda").mount(r, { jsonOnly, noStore, shell, PAGE_CSS, previewKey: (req) => (!ENABLED && PREVIEW_KEY && L.parseCookies(req).bkPreview && safeEq(L.parseCookies(req).bkPreview, PREVIEW_KEY) ? PREVIEW_KEY : "") }); // aplicația „Gazdă” (PWA, Face ID)

  // --- pagini proprietar ---
  r.get("/cont/rezervari", L.requireAccommodationOwner, async (req, res) => {
    try {
      const { rows } = await dbPool.query(
        `SELECT l.id, l.name FROM accommodation_listings l JOIN booking_settings s ON s.listing_id = l.id
          WHERE l.owner_id = $1::integer AND s.bookings_enabled ORDER BY l.name`, [req.accommodationOwner.ownerId]);
      const body = `<h1>Rezervări</h1><p class="sub">Alege proprietatea.</p>` + (rows.length ? `<div class="card" style="border-color:#0E6B63"><b>📲 Instalează aplicația OHT Host</b><div class="sub" style="margin:4px 0 10px">Calendar și rezervări pe telefon, cu Face ID, amprentă sau PIN. Apeși o dată și te duce direct pe pagina de instalare, deja conectat.</div><button id="gzinst" type="button" style="width:100%;height:52px;font-size:17px">Instalează aplicația</button><div id="gzinstout"></div></div><div class="card"><b>Ai deja aplicația OHT Host pe ecranul principal?</b><div class="sub" style="margin:4px 0 8px">Generează un cod de unică folosință și scrie-l în aplicația OHT Host, ca să o activezi cu PIN.</div><button id="gzcode" type="button">Generează cod</button><div id="gzout" class="msg"></div></div>` : "") + (rows.length
        ? rows.map((x) => `<a class="card" style="display:block;color:inherit;text-decoration:none;font-weight:700" href="/cont/rezervari/${x.id}">${L.escapeHtml(x.name)}</a>`).join("")
        : `<div class="card">Rezervările nu sunt încă activate pentru proprietățile tale.</div>`);
      shell(res, "Rezervări", body, COMMON_JS + INSTALL_JS + `const gb=$('#gzcode');if(gb)gb.onclick=async()=>{gb.disabled=true;try{const j=await api('POST','/api/gazda/cod/creeaza',{});say($('#gzout'),'Codul tău: '+j.code+' (valabil '+j.minutes+' minute, o singură dată)',true);}catch(e){say($('#gzout'),e.message,false);}gb.disabled=false;};`);
    } catch (e) { console.error("rezervari pagina:", e.message); res.status(500).send("Eroare"); }
  });
  r.get("/cont/rezervari/:id(\\d+)", L.requireAccommodationOwner, async (req, res) => {
    try {
      const lst = await loadListing(toId(req.params.id), req.accommodationOwner.ownerId);
      if (!lst || !lst.bookings_enabled) return res.status(404).send("Not found");
      shell(res, "Rezervări · " + lst.name, OWNER_APP_HTML(lst.name), OWNER_APP_JS + INSTALL_JS + `\nconst gb=$('#gzcode');if(gb)gb.onclick=async()=>{gb.disabled=true;try{const j=await api('POST','/api/gazda/cod/creeaza',{});say($('#gzout'),'Codul tău: '+j.code+' (valabil '+j.minutes+' minute, o singură dată)',true);}catch(e){say($('#gzout'),e.message,false);}gb.disabled=false;};`);
    } catch (e) { console.error("rezervari pagina:", e.message); res.status(500).send("Eroare"); }
  });

  // --- șabloane de sărbători ---
  r.get("/api/rezervari/sabloane", L.requireAccommodationOwnerApi, (req, res) => {
    const y = Number(req.query.year);
    const year = Number.isInteger(y) && y >= 2024 && y <= 2100 ? y : new Date().getFullYear();
    noStore(res); res.json({ templates: core.suggestedTemplates(year) });
  });

  // --- calendar ---
  r.get("/api/rezervari/:id/calendar", ...ownerApi, ownListing, async (req, res) => {
    try {
      const { from, to } = req.query;
      if (!core.isDateStr(from) || !core.isDateStr(to) || core.dayNum(to) <= core.dayNum(from) || core.dayNum(to) - core.dayNum(from) > core.MAX_RANGE_DAYS) return res.status(400).json({ error: "interval_invalid" });
      const unit = unitOf(req, req.query.unit);
      if (unit === null) return res.status(400).json({ error: "camera_invalida" });
      const { rows } = await dbPool.query(
        `SELECT to_char(day,'YYYY-MM-DD') AS day, status FROM booking_calendar_days
          WHERE listing_id = $1 AND unit_id = $4 AND day >= $2::date AND day < $3::date AND (status <> 3 OR blocked_until > now()) ORDER BY day`, [req.listing.id, from, to, unit]);
      noStore(res); res.json({ days: rows });
    } catch (e) { console.error("rezervari calendar:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.post("/api/rezervari/:id/zile", ...ownerApi, ownListing, async (req, res) => {
    try {
      const { days, action } = req.body || {};
      if (!Array.isArray(days) || !days.length || days.length > core.MAX_RANGE_DAYS || !days.every(core.isDateStr) || !["close", "open"].includes(action)) return res.status(400).json({ error: "date_invalide" });
      const unit = unitOf(req, (req.body || {}).unit);
      if (unit === null) return res.status(400).json({ error: "camera_invalida" });
      const today = core.todayRo();
      const list = [...new Set(days)].filter((d) => d >= today);
      if (!list.length) return res.status(400).json({ error: "zile_trecute" });
      let changed;
      if (action === "close") {
        // nu suprascrie niciodată ocupări externe/rezervări; blocările temporare expirate se pot înlocui
        await dbPool.query(`DELETE FROM booking_calendar_days WHERE listing_id = $1 AND unit_id = $3 AND status = 3 AND blocked_until < now() AND day = ANY($2::date[])`, [req.listing.id, list, unit]);
        const q = await dbPool.query(`INSERT INTO booking_calendar_days (listing_id, unit_id, day, status) SELECT $1, $3, d, 1 FROM unnest($2::date[]) d ON CONFLICT (listing_id, unit_id, day) DO NOTHING`, [req.listing.id, list, unit]);
        changed = q.rowCount;
      } else {
        const q = await dbPool.query(`DELETE FROM booking_calendar_days WHERE listing_id = $1 AND unit_id = $3 AND status = 1 AND day = ANY($2::date[])`, [req.listing.id, list, unit]);
        changed = q.rowCount;
      }
      res.json({ ok: true, changed, skipped: list.length - changed });
    } catch (e) { console.error("rezervari zile:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // --- setări & tarife ---
  r.get("/api/rezervari/:id/tarife", ...ownerApi, ownListing, async (req, res) => {
    try {
      await sync.ensure(req.listing.id); // preia din formular dacă s-a schimbat de la ultima sincronizare
      req.listing = Object.assign(req.listing, (await dbPool.query(`SELECT base_price_bani, whole_discount_bps FROM booking_settings WHERE listing_id = $1`, [req.listing.id])).rows[0] || {});
      req.listing.units = (await dbPool.query(`SELECT unit_no, name, capacity, base_price_bani FROM booking_units WHERE listing_id = $1 AND active ORDER BY sort_order, unit_no`, [req.listing.id])).rows;
      const rules = (await dbPool.query(
        `SELECT id, name, kind, unit_no, to_char(date_from,'YYYY-MM-DD') AS date_from, to_char(date_to,'YYYY-MM-DD') AS date_to, price_bani, min_nights, checkin_days, checkout_days, priority, active, (to_jsonb(r)->>'pct_bps')::integer AS pct_bps
           FROM booking_rate_rules r WHERE listing_id = $1 AND active ORDER BY kind, date_from NULLS FIRST, id`, [req.listing.id])).rows;
      const l = req.listing;
      noStore(res); res.json({ units: l.units, settings: { base_price_bani: l.base_price_bani, min_nights: l.min_nights || 1, max_guests: l.max_guests, currency: l.currency || "RON", instant_enabled: !!l.instant_enabled, lead_days: l.lead_days == null ? 1 : l.lead_days, whole_discount_bps: l.whole_discount_bps || 0, payment_mode: l.payment_mode || "direct", payments_live: !!pay.LIVE, guarantee_bani: l.guarantee_bani || 0 }, rules });
    } catch (e) { console.error("rezervari tarife:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.post("/api/rezervari/:id/setari", ...ownerApi, ownListing, async (req, res) => {
    try {
      const b = req.body || {};
      const base = b.base_price_ron == null ? null : bani(b.base_price_ron);
      const minN = Number(b.min_nights), maxG = b.max_guests == null ? null : Number(b.max_guests);
      if ((b.base_price_ron != null && base === null) || !Number.isInteger(minN) || minN < 1 || minN > 60 || (maxG !== null && (!Number.isInteger(maxG) || maxG < 1 || maxG > 100))) return res.status(400).json({ error: "date_invalide" });
      const inst = b.instant_enabled == null ? !!req.listing.instant_enabled : b.instant_enabled === true;
      const lead = b.lead_days == null ? (req.listing.lead_days == null ? 1 : req.listing.lead_days) : Number(b.lead_days);
      if (!Number.isInteger(lead) || lead < 0 || lead > 30) return res.status(400).json({ error: "date_invalide" });
      if (inst && base === null && !(req.listing.units || []).some((u) => u.base_price_bani != null) && !(await dbPool.query(`SELECT 1 FROM booking_rate_rules WHERE listing_id = $1 AND active AND kind = 'interval' LIMIT 1`, [req.listing.id])).rowCount) return res.status(400).json({ error: "Setează mai întâi un preț de bază ca să poți activa rezervarea instant" });
      await dbPool.query(`UPDATE booking_settings SET base_price_bani = $2, min_nights = $3, max_guests = $4, instant_enabled = $5, lead_days = $6, updated_at = now() WHERE listing_id = $1`, [req.listing.id, base, minN, maxG, inst, lead]);
      await sync.push(req.listing.id);
      res.json({ ok: true });
    } catch (e) { console.error("rezervari setari:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.post("/api/rezervari/:id/tarife", ...ownerApi, ownListing, async (req, res) => {
    try {
      const b = req.body || {};
      const name = cleanText(b.name, 80), kind = b.kind, price = bani(b.price_ron);
      const ci = cleanDays(b.checkin_days), co = cleanDays(b.checkout_days);
      const minN = b.min_nights == null ? null : Number(b.min_nights);
      const prio = Number.isInteger(Number(b.priority)) ? Math.max(-100, Math.min(100, Number(b.priority))) : 0;
      if (!name || !["interval", "weekend"].includes(kind) || price === null || ci === undefined || co === undefined || (minN !== null && (!Number.isInteger(minN) || minN < 1 || minN > 60))) return res.status(400).json({ error: "date_invalide" });
      let unitNo = null;
      if (b.unit_no != null) { unitNo = Number(b.unit_no); if (!(req.listing.units || []).some((u) => u.unit_no === unitNo)) return res.status(400).json({ error: "camera_invalida" }); }
      let from = b.date_from || null, to = b.date_to || null;
      if (kind === "interval") { if (!core.isDateStr(from) || !core.isDateStr(to) || to < from || core.dayNum(to) - core.dayNum(from) > 400) return res.status(400).json({ error: "perioada_invalida" }); }
      else { if ((from && !core.isDateStr(from)) || (to && !core.isDateStr(to))) return res.status(400).json({ error: "perioada_invalida" }); }
      if (b.id != null) {
        const id = toId(b.id);
        const q = await dbPool.query(`UPDATE booking_rate_rules SET name=$3, kind=$4, date_from=$5, date_to=$6, price_bani=$7, min_nights=$8, checkin_days=$9, checkout_days=$10, priority=$11, unit_no=$12 WHERE id=$1 AND listing_id=$2 AND active`, [id, req.listing.id, name, kind, from, to, price, minN, ci, co, prio, unitNo]);
        if (!q.rowCount) return res.status(404).json({ error: "negasit" });
      } else {
        const cnt = await dbPool.query(`SELECT COUNT(*)::int AS c FROM booking_rate_rules WHERE listing_id = $1 AND active`, [req.listing.id]);
        if (cnt.rows[0].c >= 100) return res.status(400).json({ error: "prea_multe_tarife" });
        await dbPool.query(`INSERT INTO booking_rate_rules (listing_id, name, kind, date_from, date_to, price_bani, min_nights, checkin_days, checkout_days, priority, unit_no) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [req.listing.id, name, kind, from, to, price, minN, ci, co, prio, unitNo]);
      }
      await sync.push(req.listing.id);
      res.json({ ok: true });
    } catch (e) { console.error("rezervari tarif:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.delete("/api/rezervari/:id/tarife/:rid", ...ownerApi, ownListing, async (req, res) => {
    try {
      await sync.dropSeasonOfRule(req.listing.id, toId(req.params.rid)); // perioada dispare și din plan (formular + pagina pensiunii)
      await dbPool.query(`UPDATE booking_rate_rules SET active = FALSE WHERE id = $1 AND listing_id = $2`, [toId(req.params.rid), req.listing.id]);
      await sync.push(req.listing.id);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: "eroare" }); }
  });
  // Plan de prețuri: perioade speciale (sărbători, sezoane, zile alese) + oferte; același plan ca în formularul cazării
  r.get("/api/rezervari/:id/plan", ...ownerApi, ownListing, async (req, res) => {
    try {
      const p = await sync.getPlan(req.listing.id);
      if (!p) return res.status(404).json({ error: "negasit" });
      noStore(res); res.json({ plan: p.plan, hotel: p.hotel, type: p.type, mode: p.mode, n: p.n, stored: p.stored, today: core.todayRo(), suggestions: core.suggestedTemplates(Number(core.todayRo().slice(0, 4))).concat(core.suggestedTemplates(Number(core.todayRo().slice(0, 4)) + 1)) });
    } catch (e) { console.error("rezervari plan get:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.post("/api/rezervari/:id/plan", ...ownerApi, ownListing, async (req, res) => {
    try {
      const b = req.body || {};
      const out = await sync.savePlan(req.listing.id, {
        seasons: Array.isArray(b.seasons) ? b.seasons : undefined,
        offers: Array.isArray(b.offers) ? b.offers : undefined,
        weekendPct: b.weekendPct === undefined ? undefined : b.weekendPct,
      });
      if (out.error === "sql_lipsa") return res.status(409).json({ error: "Lipsește scriptul SQL „etapa 6”. Rulează-l în Neon și încearcă din nou." });
      if (out.error) return res.status(404).json({ error: "negasit" });
      res.json({ ok: true, plan: out.plan });
    } catch (e) { console.error("rezervari plan post:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  // pensiune doar „toată pensiunea”: setează prețul pe cameră din aplicație (trece în modul hibrid)
  r.post("/api/rezervari/:id/pret-camera", ...ownerApi, ownListing, async (req, res) => {
    try {
      const out = await sync.setRoomPrice(req.listing.id, (req.body || {}).price);
      if (out.error === "pret_invalid") return res.status(400).json({ error: "Scrie un preț valid pe noapte pentru o cameră." });
      if (out.error === "nu_se_aplica") return res.status(400).json({ error: "Prețul pe cameră se poate seta doar pentru o pensiune cu cel puțin 2 camere, închiriată acum doar întreagă." });
      if (out.error) return res.status(404).json({ error: "negasit" });
      res.json({ ok: true });
    } catch (e) { console.error("rezervari pret-camera:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  // ofertă: aceeași logică va fi folosită de turist în Etapa 1
  r.get("/api/rezervari/:id/pret", ...ownerApi, ownListing, async (req, res) => {
    try {
      const { checkin, checkout } = req.query;
      if (!core.isDateStr(checkin) || !core.isDateStr(checkout)) return res.status(400).json({ error: "date_invalide" });
      const unit = unitOf(req, req.query.unit);
      if (unit === null) return res.status(400).json({ error: "camera_invalida" });
      const uObj = (req.listing.units || []).find((u) => u.unit_no === unit) || null;
      const rules = (await dbPool.query(`SELECT id, unit_no, kind, to_char(date_from,'YYYY-MM-DD') AS date_from, to_char(date_to,'YYYY-MM-DD') AS date_to, name, price_bani, min_nights, checkin_days, checkout_days, priority, active, (to_jsonb(r)->>'pct_bps')::integer AS pct_bps FROM booking_rate_rules r WHERE listing_id = $1 AND active`, [req.listing.id])).rows.filter((x) => x.unit_no == null || x.unit_no === unit);
      const busy = (await dbPool.query(`SELECT to_char(day,'YYYY-MM-DD') AS day FROM booking_calendar_days WHERE listing_id = $1 AND unit_id = $4 AND day >= $2::date AND day < $3::date AND (status <> 3 OR blocked_until > now())`, [req.listing.id, checkin, checkout, unit])).rows;
      const l = req.listing;
      const guestN = Number(req.query.guests) || 1;
      const q = core.computeQuote({ checkIn: checkin, checkOut: checkout, guests: guestN, settings: { base_price_bani: uObj && uObj.base_price_bani != null ? uObj.base_price_bani : l.base_price_bani, min_nights: l.min_nights || 1, max_guests: uObj ? uObj.capacity : l.max_guests }, rules, busyDays: new Set(busy.map((x) => x.day)) });
      noStore(res); res.json(q);
    } catch (e) { console.error("rezervari pret:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // --- preferințe: reducere „toată pensiunea” și modul de plată ---
  // payment_mode „online” (Recomandată) este doar o alegere salvată: plata online nu e încă activă, deci rezervările rămân cu plată directă și fără comision.
  r.post("/api/rezervari/:id/preferinte", ...ownerApi, ownListing, async (req, res) => {
    try {
      const b = req.body || {};
      const mode = b.payment_mode == null ? (req.listing.payment_mode || "direct") : b.payment_mode;
      const pct = b.whole_discount_pct == null ? (req.listing.whole_discount_bps || 0) / 100 : Number(b.whole_discount_pct);
      const bps = Math.round(pct * 100);
      if (!["direct", "online"].includes(mode) || !Number.isFinite(pct) || bps < 0 || bps > 5000) return res.status(400).json({ error: "date_invalide" });
      let gar = null;
      if (b.guarantee_ron != null && pay.LIVE) {
        gar = Math.round(Number(b.guarantee_ron) * 100);
        if (!Number.isFinite(gar) || gar < 0 || gar > 1000000) return res.status(400).json({ error: "date_invalide" });
      }
      await dbPool.query(`UPDATE booking_settings SET payment_mode = $2, whole_discount_bps = $3, updated_at = now() WHERE listing_id = $1`, [req.listing.id, mode, bps]);
      if (gar !== null) await dbPool.query(`UPDATE booking_settings SET guarantee_bani = $2 WHERE listing_id = $1`, [req.listing.id, gar]);
      await sync.push(req.listing.id);
      res.json({ ok: true });
    } catch (e) { console.error("rezervari preferinte:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // --- camere (unități) ---
  r.post("/api/rezervari/:id/camere", ...ownerApi, ownListing, async (req, res) => {
    let client;
    try {
      const b = req.body || {};
      const name = cleanText(b.name, 60), cap = Number(b.capacity);
      const price = b.price_ron == null || b.price_ron === "" ? null : bani(b.price_ron);
      if (!name || !Number.isInteger(cap) || cap < 1 || cap > 50 || (b.price_ron != null && b.price_ron !== "" && price === null)) return res.status(400).json({ error: "date_invalide" });
      if (b.unit_no != null) {
        const n = Number(b.unit_no);
        if (!(req.listing.units || []).some((u) => u.unit_no === n)) return res.status(404).json({ error: "negasit" });
        await dbPool.query(`UPDATE booking_units SET name = $3, capacity = $4, base_price_bani = $5 WHERE listing_id = $1 AND unit_no = $2 AND active`, [req.listing.id, n, name, cap, price]);
        await sync.push(req.listing.id);
        return res.json({ ok: true });
      }
      client = await dbPool.connect();
      await client.query("BEGIN");
      await client.query(`SELECT pg_advisory_xact_lock($1::bigint)`, [req.listing.id]);
      const mx = (await client.query(`SELECT COALESCE(MAX(unit_no), 0)::int AS m, COUNT(*) FILTER (WHERE active)::int AS act FROM booking_units WHERE listing_id = $1`, [req.listing.id])).rows[0];
      if (mx.m >= 50) { await client.query("ROLLBACK"); return res.status(400).json({ error: "Ai atins numărul maxim de camere" }); }
      const n = mx.m + 1;
      await client.query(`INSERT INTO booking_units (listing_id, unit_no, name, capacity, base_price_bani, sort_order) VALUES ($1,$2,$3,$4,$5,$2)`, [req.listing.id, n, name, cap, price]);
      if (mx.act === 0) { // prima cameră: ce era pe „proprietatea întreagă” (unit 0) se mută pe ea
        await client.query(`UPDATE booking_calendar_days SET unit_id = $2 WHERE listing_id = $1 AND unit_id = 0`, [req.listing.id, n]);
        await client.query(`UPDATE booking_ical_feeds SET unit_id = $2 WHERE listing_id = $1 AND unit_id = 0`, [req.listing.id, n]);
        await client.query(`UPDATE booking_reservations SET unit_ids = ARRAY[$2::smallint] WHERE listing_id = $1 AND unit_ids = ARRAY[0::smallint] AND status IN ('hold','confirmed')`, [req.listing.id, n]);
      }
      await client.query("COMMIT");
      await sync.push(req.listing.id);
      res.json({ ok: true, unit_no: n });
    } catch (e) {
      if (client) await client.query("ROLLBACK").catch(() => {});
      console.error("rezervari camere:", e.message); res.status(500).json({ error: "eroare" });
    } finally { if (client) client.release(); }
  });
  r.delete("/api/rezervari/:id/camere/:n", ...ownerApi, ownListing, async (req, res) => {
    try {
      const n = Number(req.params.n), us = req.listing.units || [];
      if (!us.some((u) => u.unit_no === n)) return res.status(404).json({ error: "negasit" });
      if (us.length < 2) return res.status(400).json({ error: "Trebuie să rămână cel puțin o cameră" });
      const busy = await dbPool.query(`SELECT 1 FROM booking_reservations WHERE listing_id = $1 AND status IN ('hold','confirmed') AND check_out > (now() AT TIME ZONE 'Europe/Bucharest')::date AND $2::smallint = ANY(unit_ids) LIMIT 1`, [req.listing.id, n]);
      if (busy.rowCount) return res.status(400).json({ error: "Camera are rezervări viitoare. Anulează-le întâi." });
      await dbPool.query(`UPDATE booking_units SET active = FALSE WHERE listing_id = $1 AND unit_no = $2`, [req.listing.id, n]);
      await dbPool.query(`DELETE FROM booking_calendar_days WHERE listing_id = $1 AND unit_id = $2`, [req.listing.id, n]);
      await dbPool.query(`DELETE FROM booking_ical_feeds WHERE listing_id = $1 AND unit_id = $2`, [req.listing.id, n]);
      await dbPool.query(`UPDATE booking_rate_rules SET active = FALSE WHERE listing_id = $1 AND unit_no = $2`, [req.listing.id, n]);
      await sync.push(req.listing.id);
      res.json({ ok: true });
    } catch (e) { console.error("rezervari camera stearsa:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // --- fluxuri iCal ---
  r.get("/api/rezervari/:id/fluxuri", ...ownerApi, ownListing, async (req, res) => {
    try {
      const feeds = (await dbPool.query(`SELECT id, unit_id, platform, label, import_url, export_token, enabled, last_sync_at, last_ok_at, last_status, last_error, event_count FROM booking_ical_feeds WHERE listing_id = $1 ORDER BY id`, [req.listing.id])).rows;
      const conflicts = (await dbPool.query(`SELECT COUNT(*)::int AS c FROM booking_conflicts WHERE listing_id = $1 AND resolved_at IS NULL`, [req.listing.id])).rows[0].c;
      noStore(res); res.json({ feeds, conflicts });
    } catch (e) { console.error("rezervari fluxuri:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  async function validateImport(req, rawUrl) {
    const p = core.parseFeedUrl(rawUrl);
    if (!p.ok) return { ok: false, error: errText(p.error) };
    if (p.url.host.toLowerCase() === String(req.headers.host || "").toLowerCase() || /\/api\/rezervari\/ical\//.test(p.url.pathname)) return { ok: false, error: "Acesta este chiar linkul nostru de export — lipește-l în platformă, nu aici" };
    const got = await core.safeFetchIcs(p.url.toString());
    if (!got.ok) return { ok: false, error: errText(got.error) };
    const parsed = core.parseIcs(got.body);
    if (!parsed.ok) return { ok: false, error: errText(parsed.error) };
    return { ok: true, url: p.url.toString(), parsed, body: got.body, etag: got.etag, lastModified: got.lastModified };
  }
  r.post("/api/rezervari/:id/fluxuri/previzualizare", ...ownerApi, ownListing, async (req, res) => {
    if (!(await L.checkRateLimit("own:" + req.accommodationOwner.ownerId, "rez-prev", 20, 10))) return res.status(429).json({ error: "Prea multe încercări, încearcă peste câteva minute" });
    try {
      const v = await validateImport(req, (req.body || {}).import_url);
      if (!v.ok) return res.status(400).json({ error: v.error });
      res.json({ ok: true, events: v.parsed.events, nights: v.parsed.days.size, periods: core.groupDays([...v.parsed.days].sort()).slice(0, 20) });
    } catch (e) { console.error("rezervari previzualizare:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.post("/api/rezervari/:id/fluxuri", ...ownerApi, ownListing, async (req, res) => {
    try {
      const b = req.body || {};
      const platform = cleanText(b.platform, 40), label = cleanText(b.label, 80) || null;
      if (!platform) return res.status(400).json({ error: "date_invalide" });
      const fUnit = unitOf(req, b.unit_no);
      if (fUnit === null) return res.status(400).json({ error: "camera_invalida" });
      const cnt = (await dbPool.query(`SELECT COUNT(*)::int AS c FROM booking_ical_feeds WHERE listing_id = $1`, [req.listing.id])).rows[0].c;
      if (cnt >= MAX_FEEDS * Math.max(1, (req.listing.units || []).length)) return res.status(400).json({ error: "Ai atins numărul maxim de platforme" });
      let importUrl = null, v = null;
      if (b.import_url) {
        if (!(await L.checkRateLimit("own:" + req.accommodationOwner.ownerId, "rez-prev", 20, 10))) return res.status(429).json({ error: "Prea multe încercări, încearcă peste câteva minute" });
        v = await validateImport(req, b.import_url);
        if (!v.ok) return res.status(400).json({ error: v.error });
        importUrl = v.url;
        const dup = await dbPool.query(`SELECT 1 FROM booking_ical_feeds WHERE listing_id = $1 AND import_url = $2`, [req.listing.id, importUrl]);
        if (dup.rowCount) return res.status(400).json({ error: "Acest link este deja adăugat" });
      }
      const ins = await dbPool.query(`INSERT INTO booking_ical_feeds (listing_id, unit_id, platform, label, import_url, export_token) VALUES ($1,$6,$2,$3,$4,$5) RETURNING *`, [req.listing.id, platform, label, importUrl, core.newExportToken(), fUnit]);
      if (importUrl) await syncFeed(ins.rows[0]);
      res.json({ ok: true, id: ins.rows[0].id });
    } catch (e) { console.error("rezervari flux nou:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.post("/api/rezervari/:id/fluxuri/:fid/sincronizare", ...ownerApi, ownListing, async (req, res) => {
    try {
      if (!(await L.checkRateLimit("own:" + req.accommodationOwner.ownerId, "rez-sync", 10, 10))) return res.status(429).json({ ok: false, error: "Prea multe sincronizări, încearcă peste câteva minute" });
      const f = (await dbPool.query(`SELECT * FROM booking_ical_feeds WHERE id = $1 AND listing_id = $2 AND import_url IS NOT NULL`, [toId(req.params.fid), req.listing.id])).rows[0];
      if (!f) return res.status(404).json({ error: "negasit" });
      res.json(await syncFeed(f));
    } catch (e) { console.error("rezervari sync manual:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.delete("/api/rezervari/:id/fluxuri/:fid", ...ownerApi, ownListing, async (req, res) => {
    try {
      const fid = toId(req.params.fid);
      const f = await dbPool.query(`DELETE FROM booking_ical_feeds WHERE id = $1 AND listing_id = $2 RETURNING id`, [fid, req.listing.id]);
      if (f.rowCount) {
        await dbPool.query(`DELETE FROM booking_calendar_days WHERE listing_id = $1 AND source_feed_id = $2 AND status = 2`, [req.listing.id, fid]);
        await dbPool.query(`DELETE FROM booking_conflicts WHERE feed_id = $1`, [fid]);
      }
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: "eroare" }); }
  });

  // --- export public (linkul secret dat platformei) ---
  r.get("/api/rezervari/ical/:token.ics", async (req, res) => {
    try {
      const token = req.params.token;
      if (!/^[a-f0-9]{48}$/.test(token)) return res.status(404).send("Not found");
      if (!(await L.checkRateLimit(L.hashIp(L.getClientIp(req)), "rez-ical", 300, 10))) return res.status(429).send("Too many requests");
      const f = (await dbPool.query(
        `SELECT f.id, f.listing_id, f.unit_id, l.name FROM booking_ical_feeds f JOIN booking_settings s ON s.listing_id = f.listing_id AND s.bookings_enabled
           JOIN accommodation_listings l ON l.id = f.listing_id WHERE f.export_token = $1 AND f.enabled`, [token])).rows[0];
      if (!f) return res.status(404).send("Not found");
      const rows = (await dbPool.query(
        `SELECT to_char(day,'YYYY-MM-DD') AS day FROM booking_calendar_days
          WHERE listing_id = $1 AND unit_id = $2 AND day >= (now() AT TIME ZONE 'Europe/Bucharest')::date - 1 AND status IN (1,2,3,4)
            AND (status <> 3 OR blocked_until > now()) AND (source_feed_id IS NULL OR source_feed_id <> $3) ORDER BY day`, [f.listing_id, f.unit_id, f.id])).rows;
      res.set({ "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "Content-Disposition": 'inline; filename="calendar.ics"' });
      res.send(core.buildIcs({ calName: f.name, listingId: f.listing_id, days: rows.map((x) => x.day) }));
    } catch (e) { console.error("rezervari ical export:", e.message); res.status(500).send("Error"); }
  });

  // --- cron: sincronizare periodică + curățenie (Bearer CRON_SECRET, ca la celelalte cron-uri) ---
  r.get("/api/cron/sincronizare-ical", async (req, res) => {
    const secret = process.env.CRON_SECRET || "";
    const auth = String(req.headers.authorization || "");
    const ok = secret ? safeEq(auth, `Bearer ${secret}`) : /vercel-cron/i.test(String(req.headers["user-agent"] || ""));
    if (!ok) return res.status(401).json({ error: "unauthorized" });
    const started = Date.now();
    const stats = { synced: 0, failed: 0, unchanged: 0 };
    try {
      const feeds = (await dbPool.query(
        `SELECT f.* FROM booking_ical_feeds f JOIN booking_settings s ON s.listing_id = f.listing_id AND s.bookings_enabled
          WHERE f.import_url IS NOT NULL AND f.enabled AND (f.last_sync_at IS NULL OR f.last_sync_at < now() - interval '10 minutes')
          ORDER BY f.last_sync_at NULLS FIRST LIMIT 40`)).rows;
      for (let i = 0; i < feeds.length && Date.now() - started < 40000; i += 4) {
        const out = await Promise.all(feeds.slice(i, i + 4).map((f) => syncFeed(f).catch(() => ({ ok: false }))));
        out.forEach((o) => { if (!o.ok) stats.failed++; else if (o.unchanged) stats.unchanged++; else stats.synced++; });
      }
      await dbPool.query(`DELETE FROM booking_calendar_days WHERE day < (now() AT TIME ZONE 'Europe/Bucharest')::date - 1 OR (status = 3 AND blocked_until < now() - interval '1 hour')`);
      await dbPool.query(`DELETE FROM booking_sync_log WHERE at < now() - interval '30 days'`);
      await cleanupHolds();
      try { stats.forms = await forms.cron(); } catch (e) { console.error("rezervari cron fise:", e.message); }
      try { stats.gazda = await require("./bookings-gazda-notify").cron(); } catch (e) { console.error("rezervari cron gazda:", e.message); }
      res.json({ ok: true, ...stats });
    } catch (e) { console.error("rezervari cron:", e.message); res.status(500).json({ ok: false }); }
  });

  // --- admin: comutator per anunț ---
  r.get("/admin/rezervari", (req, res) => {
    if (!L.requireAdminPage(req, res)) return;
    shell(res, "Admin · Rezervări", `<h1>Rezervări — comutatoare</h1><p class="sub" id="st"></p><div class="card"><b>Testezi ca gazdă?</b><div class="sub" style="margin:4px 0 8px">Contul tău de proprietar, cu e-mailul de admin, te duce mereu în admin din /cont. De aici ajungi direct la ecranele de gazdă (trebuie să fii și logat ca proprietar, la /cazare/login).</div><div class="row"><a class="mini" href="/cont/rezervari" style="height:42px;padding:0 12px;display:inline-flex;align-items:center;border:1px solid #0E6B63;border-radius:10px;color:#0E6B63;font-weight:700;text-decoration:none">Rezervări (cont gazdă)</a><a class="mini" href="/gazda/" style="height:42px;padding:0 12px;display:inline-flex;align-items:center;border:1px solid #0E6B63;border-radius:10px;color:#0E6B63;font-weight:700;text-decoration:none">📲 Aplicația OHT Host</a></div></div><div id="alerts"></div><div class="card"><table><thead><tr><th>Anunț</th><th>ID</th><th>Activ</th><th>Comision %</th></tr></thead><tbody id="tb"></tbody></table></div><div class="card"><h2>Refuzuri recente</h2><table><thead><tr><th>Data</th><th>Anunț</th><th>Motiv</th><th>Comentariu</th><th>Rambursat</th></tr></thead><tbody id="rf"></tbody></table></div>`, ADMIN_APP_JS);
  });
  r.get("/api/admin/rezervari/anunturi", async (req, res) => {
    if (!L.requireAdminApi(req, res)) return;
    try {
      const rows = (await dbPool.query(`SELECT l.id, l.name, l.city, COALESCE(s.bookings_enabled, FALSE) AS enabled, COALESCE(s.commission_bps, 0) AS commission_bps, COALESCE(s.instant_enabled, FALSE) AS instant, o.email AS owner_email FROM accommodation_listings l LEFT JOIN booking_settings s ON s.listing_id = l.id LEFT JOIN accommodation_owners o ON o.id = l.owner_id WHERE l.status = 'approved' ORDER BY l.name LIMIT 1000`)).rows;
      noStore(res); res.json({ globalEnabled: ENABLED, listings: rows });
    } catch (e) { console.error("admin rezervari:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.get("/api/admin/rezervari/refuzuri", async (req, res) => {
    if (!L.requireAdminApi(req, res)) return;
    try {
      const flagged = (await dbPool.query(`SELECT l.id, l.name, COUNT(*)::int AS n FROM owner_refusals_log g JOIN accommodation_listings l ON l.id = g.listing_id WHERE g.at > now() - interval '90 days' GROUP BY l.id, l.name HAVING COUNT(*) > 3 ORDER BY n DESC LIMIT 100`)).rows;
      const recent = (await dbPool.query(`SELECT g.id, g.listing_id, l.name, g.code, g.note, g.refunded_bani, to_char(g.at AT TIME ZONE 'Europe/Bucharest','YYYY-MM-DD HH24:MI') AS at FROM owner_refusals_log g JOIN accommodation_listings l ON l.id = g.listing_id ORDER BY g.at DESC LIMIT 50`)).rows;
      noStore(res); res.json({ flagged, recent });
    } catch (e) { console.error("admin rezervari refuzuri:", e.message); res.status(500).json({ error: "eroare" }); }
  });
  r.post("/api/admin/rezervari/setari", jsonOnly, async (req, res) => {
    if (!L.requireAdminApi(req, res)) return;
    try {
      const id = toId((req.body || {}).listingId), en = (req.body || {}).enabled === true;
      const cp = (req.body || {}).commissionPct;
      const bps = cp == null ? null : Math.round(Number(cp) * 100);
      if (!id || (bps !== null && (!Number.isInteger(bps) || bps < 0 || bps > 5000))) return res.status(400).json({ error: "date_invalide" });
      const l = (await dbPool.query(`SELECT owner_id FROM accommodation_listings WHERE id = $1::integer`, [id])).rows[0];
      if (!l) return res.status(404).json({ error: "negasit" });
      await dbPool.query(`INSERT INTO booking_settings (listing_id, owner_id, bookings_enabled) VALUES ($1,$2,$3) ON CONFLICT (listing_id) DO UPDATE SET bookings_enabled = EXCLUDED.bookings_enabled, owner_id = EXCLUDED.owner_id, updated_at = now()`, [id, l.owner_id, en]);
      if (bps !== null) await dbPool.query(`UPDATE booking_settings SET commission_bps = $2 WHERE listing_id = $1`, [id, bps]);
      if (en) await sync.pull(id); // preia prețurile din formularul cazării
      res.json({ ok: true });
    } catch (e) { console.error("admin rezervari setari:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  pay.mount(r, { jsonOnly, ownerApi, ownListing, cleanText, shell, COMMON_JS, noStore, toId });
  forms.mount(r, { jsonOnly, noStore, toId, cleanText, shell, COMMON_JS, ownerApi, ownListing });
  cleanupHolds = require("./bookings-public")(r, { dbPool, core, L, jsonOnly, noStore, toId, cleanText, shell, COMMON_JS, ownerApi, ownListing, safeEq, RESEND_API_KEY, pay, forms });

  app.use(r);
};
module.exports.syncFeed = syncFeed;
// vizibilitate pentru butonul din /cont: pornit global sau previzualizare validă (fără să seteze cookie-uri)
module.exports.canSee = (req, res) => {
  if (!dbPool) return false;
  if (ENABLED) return true;
  if (!PREVIEW_KEY) return false;
  const cookie = L.parseCookies(req).bkPreview;
  if (cookie && safeEq(cookie, PREVIEW_KEY)) return true;
  // previzualizare: ?bkpreview=PAROLA pe /cont setează cookie-ul și în acest browser/telefon
  if (res && typeof req.query.bkpreview === "string" && safeEq(req.query.bkpreview, PREVIEW_KEY)) {
    L.appendSetCookie(res, `bkPreview=${encodeURIComponent(PREVIEW_KEY)}; Path=/; Max-Age=${30 * 24 * 3600}; HttpOnly; SameSite=Lax; Secure`);
    return true;
  }
  return false;
};

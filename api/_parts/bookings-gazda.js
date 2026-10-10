// Aplicația „Gazdă” (PWA) — ecran dedicat proprietarilor pentru rezervări și calendar.
// Login cu Face ID / amprentă (passkey WebAuthn), fără linkuri pe e-mail după prima activare.
// Se montează din bookings.js (în spatele aceluiași gate: dacă rezervările sunt oprite, nimic din /gazda nu răspunde).
// Nicio dependență nouă: CBOR/WebAuthn sunt verificate cu modulul crypto din Node.
"use strict";
const crypto = require("crypto");
const { dbPool, INTL_DOMAIN, ACCOMMODATION_SESSION_SECRET } = require("./static");
const L = require("./logic");

const RP_ID = process.env.GAZDA_RPID || INTL_DOMAIN;
const ORIGIN = process.env.GAZDA_ORIGIN || ("https://" + INTL_DOMAIN);
const COOKIE = "gzSession";
const SESSION_DAYS = 60;
const FRESH_MS = 10 * 60 * 1000; // acțiunile sensibile cer Face ID făcut în ultimele 10 minute
const MAX_DEVICES = 8;

const sha256 = (b) => crypto.createHash("sha256").update(b).digest();
const b64u = (b) => Buffer.from(b).toString("base64url");
const fromB64u = (s) => Buffer.from(String(s || ""), "base64url");

// ---------- CBOR minimal (suficient pentru attestationObject + cheie COSE) ----------
function cborDecode(buf) {
  let p = 0, nodes = 0;
  function rd(depth) {
    if (depth > 8 || ++nodes > 400 || p >= buf.length) throw new Error("cbor");
    const ib = buf[p++], mt = ib >> 5, ai = ib & 31;
    let n;
    if (ai < 24) n = ai;
    else if (ai === 24) { n = buf[p]; p += 1; }
    else if (ai === 25) { n = buf.readUInt16BE(p); p += 2; }
    else if (ai === 26) { n = buf.readUInt32BE(p); p += 4; }
    else throw new Error("cbor");
    if (n === undefined || Number.isNaN(n)) throw new Error("cbor");
    switch (mt) {
      case 0: return n;
      case 1: return -1 - n;
      case 2: { if (p + n > buf.length) throw new Error("cbor"); const b = buf.subarray(p, p + n); p += n; return b; }
      case 3: { if (p + n > buf.length) throw new Error("cbor"); const s = buf.toString("utf8", p, p + n); p += n; return s; }
      case 4: { if (n > 100) throw new Error("cbor"); const a = []; for (let i = 0; i < n; i++) a.push(rd(depth + 1)); return a; }
      case 5: { if (n > 100) throw new Error("cbor"); const m = new Map(); for (let i = 0; i < n; i++) { const k = rd(depth + 1); m.set(k, rd(depth + 1)); } return m; }
      default: throw new Error("cbor");
    }
  }
  const value = rd(0);
  return { value, end: p };
}

function parseAuthData(ad) {
  if (!Buffer.isBuffer(ad) || ad.length < 37) throw new Error("authdata");
  const out = { rpIdHash: ad.subarray(0, 32), flags: ad[32], signCount: ad.readUInt32BE(33), cred: null };
  if (out.flags & 0x40) {
    if (ad.length < 55) throw new Error("authdata");
    const len = ad.readUInt16BE(53);
    if (len < 1 || len > 1023 || ad.length < 55 + len) throw new Error("authdata");
    const credId = ad.subarray(55, 55 + len);
    const key = cborDecode(ad.subarray(55 + len)).value;
    out.cred = { id: credId, key };
  }
  return out;
}
function coseToJwk(m) {
  if (!(m instanceof Map)) throw new Error("cose");
  if (m.get(1) !== 2 || m.get(3) !== -7 || m.get(-1) !== 1) throw new Error("alg_nepermis"); // doar ES256 / P-256
  const x = m.get(-2), y = m.get(-3);
  if (!Buffer.isBuffer(x) || !Buffer.isBuffer(y) || x.length !== 32 || y.length !== 32) throw new Error("cose");
  return { kty: "EC", crv: "P-256", x: b64u(x), y: b64u(y) };
}
function checkClientData(raw, type, challengeB64) {
  let cd;
  try { cd = JSON.parse(Buffer.from(raw).toString("utf8")); } catch (e) { throw new Error("clientdata"); }
  if (!cd || cd.type !== type || cd.challenge !== challengeB64 || cd.origin !== ORIGIN || cd.crossOrigin === true) throw new Error("clientdata");
}

// ---------- provocări (stateless, semnate, 3 minute) ----------
function mkChallenge(purpose, extra) {
  const ch = crypto.randomBytes(32);
  const payload = JSON.stringify(Object.assign({ ch: b64u(ch), p: purpose, exp: Date.now() + 3 * 60 * 1000 }, extra || {}));
  return { challenge: b64u(ch), token: b64u(L.signCookiePayload(payload, ACCOMMODATION_SESSION_SECRET)) };
}
function readChallenge(token, purpose) {
  try {
    const signed = fromB64u(token).toString("utf8");
    const payload = L.verifyCookiePayload(signed, ACCOMMODATION_SESSION_SECRET);
    if (!payload) return null;
    const d = JSON.parse(payload);
    if (d.p !== purpose || !d.exp || Date.now() > d.exp) return null;
    return d;
  } catch (e) { return null; }
}

// ---------- sesiune dispozitiv ----------
const devCache = new Map(); // did -> {ok, role, lids, at}
async function deviceInfo(did, ownerId) {
  const c = devCache.get(did);
  if (c && Date.now() - c.at < 30000) return c;
  let v = { ok: false, role: "owner", lids: [] };
  try {
    const { rows } = await dbPool.query(`SELECT role, listing_ids FROM gazda_devices WHERE id = $1::bigint AND owner_id = $2::integer AND revoked_at IS NULL`, [did, ownerId]);
    if (rows.length) v = { ok: true, role: rows[0].role === "staff" ? "staff" : "owner", lids: (rows[0].listing_ids || []).map(Number) };
  } catch (e) { /* ok=false */ }
  v.at = Date.now();
  devCache.set(did, v);
  if (devCache.size > 5000) devCache.clear();
  return v;
}
// ce vede personalul: fără sume, e-mailuri, comisioane, plăți sau tarife
function staffView(kind, o) {
  if (!o || typeof o !== "object") return o;
  if (kind === "rezervari" && Array.isArray(o.reservations)) {
    return { reservations: o.reservations.map((x) => ({ id: x.id, unit_ids: x.unit_ids, status: x.status, check_in: x.check_in, check_out: x.check_out, guests: x.guests, total_bani: 0, guest_name: x.guest_name, guest_phone: x.guest_phone, refused: !!x.refused, pay_scheme: "direct", pay_status: "none", paid_bani: 0, guarantee_bani: 0 })) };
  }
  if (kind === "tarife") return { settings: {}, rules: [], units: (o.units || []).map((u) => ({ unit_no: u.unit_no, name: u.name, capacity: u.capacity })) };
  return o;
}
function setGz(res, data) {
  const payload = JSON.stringify({ ownerId: data.ownerId, email: data.email, did: data.did, auth: data.auth, exp: Date.now() + SESSION_DAYS * 86400000 });
  const signed = L.signCookiePayload(payload, ACCOMMODATION_SESSION_SECRET);
  L.appendSetCookie(res, `${COOKIE}=${encodeURIComponent(signed)}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; SameSite=Strict; Secure`);
}
function clearGz(res) { L.appendSetCookie(res, `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict; Secure`); }
async function readGz(req) {
  if (!ACCOMMODATION_SESSION_SECRET) return null;
  const raw = L.parseCookies(req)[COOKIE];
  if (!raw) return null;
  const payload = L.verifyCookiePayload(raw, ACCOMMODATION_SESSION_SECRET);
  if (!payload) return null;
  let d;
  try { d = JSON.parse(payload); } catch (e) { return null; }
  if (!d.ownerId || !d.did || !d.exp || Date.now() > d.exp) return null;
  const info = await deviceInfo(d.did, d.ownerId);
  if (!info.ok || !(await L.ownerStillExists(d.ownerId))) return null;
  d.role = info.role; d.lids = info.lids;
  return d;
}

const ipKey = (req) => L.hashIp(L.getClientIp(req));
const toId = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };
async function logEv(ownerId, did, action, listingId) {
  await dbPool.query(`INSERT INTO gazda_events (owner_id, device_id, action, listing_id) VALUES ($1,$2,$3,$4)`, [ownerId, did || null, action, listingId || null]).catch(() => {});
}

// ---------- pagina aplicației ----------
const MANIFEST = {
  name: "Gazdă · Programul de Azi", short_name: "Gazdă", description: "Rezervări și calendar pentru gazde",
  start_url: "/gazda/", scope: "/gazda/", id: "/gazda/", display: "standalone", orientation: "portrait",
  background_color: "#F5F2EC", theme_color: "#0E6B63", lang: "ro",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};
const SW = `// Gazdă: fără cache pentru date private; doar permite instalarea și afișează un mesaj offline.
self.addEventListener('install',function(){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
self.addEventListener('push',function(e){var d={};try{d=e.data?e.data.json():{};}catch(x){}
e.waitUntil(self.registration.showNotification(d.title||'Gazdă',{body:d.body||'',icon:'/icon-192.png',badge:'/icon-192.png',tag:d.tag||'gz',data:{url:d.url||'/gazda/'}}));});
self.addEventListener('notificationclick',function(e){e.notification.close();var u=(e.notification.data&&e.notification.data.url)||'/gazda/';
e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(l){for(var i=0;i<l.length;i++){if(l[i].url.indexOf('/gazda/')>-1&&'focus' in l[i])return l[i].focus();}return self.clients.openWindow(u);}));});
self.addEventListener('fetch',function(e){var r=e.request;if(r.method!=='GET'||r.mode!=='navigate')return;
e.respondWith(fetch(r).catch(function(){return new Response('<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><body style="font-family:system-ui;padding:24px;background:#F5F2EC;color:#17222B"><h2>Fără conexiune</h2><p>Aplicația Gazdă are nevoie de internet. Reîncearcă în câteva secunde.</p>',{headers:{'Content-Type':'text/html; charset=utf-8'}});}));});
`;

const APP_CSS = `
body{padding-bottom:78px}.w{padding-top:12px}
.top{display:flex;gap:8px;align-items:center;margin-bottom:12px}.top select{flex:1;font-weight:700}
.nav{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #E4DFD5;display:flex;padding-bottom:env(safe-area-inset-bottom);z-index:5}
.nav button{flex:1;height:58px;background:none;color:#5B6770;border:0;border-radius:0;font-size:12px;font-weight:700}.nav button.on{color:#0E6B63;box-shadow:inset 0 3px 0 #0E6B63}
.badge{display:inline-block;background:#9B1C1C;color:#fff;border-radius:10px;font-size:11px;padding:1px 7px;margin-left:6px}
.big{font-size:34px;font-weight:800;line-height:1}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}.kpis .card{margin:0;text-align:center;padding:12px 6px}
.redwarn{background:#FDECEA;border:1px solid #C0392B;border-radius:10px;padding:10px 12px;margin:0 0 12px;color:#9B1C1C;font-weight:700;font-size:14px;line-height:1.45}.redwarn a{color:#9B1C1C}.alert{border-color:#E8B4B4;background:#FDF3F3}.pill{display:inline-block;font-size:11px;font-weight:700;border-radius:8px;padding:2px 8px;background:#E4DFD5;color:#17222B}
.mini{height:34px;font-size:13px;padding:0 10px}a.mini{display:inline-flex;align-items:center;text-decoration:none;border-radius:10px;border:1px solid #0E6B63;color:#0E6B63;font-weight:700;background:#fff}
.hero{text-align:center;padding:36px 8px 10px}.hero h1{font-size:26px}.face{font-size:54px}
.sheet{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center;z-index:9}.sheet>.card{width:100%;max-width:560px;margin:0;border-radius:18px 18px 0 0}
`;

const APP_JS = `
const $=(s,r)=>(r||document).querySelector(s);
function el(t,a,c){const e=document.createElement(t);if(a)for(const k in a){if(k==='class')e.className=a[k];else e.setAttribute(k,a[k]);}(c||[]).forEach(x=>e.append(x));return e;}
function say(box,t,ok){box.textContent=t;box.className='msg '+(ok?'ok':'err');}
const enc=new TextEncoder();
const b64u=(buf)=>{let s='';new Uint8Array(buf).forEach(b=>s+=String.fromCharCode(b));return btoa(s).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');};
const unb64=(s)=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer;};
async function raw(method,url,body){const r=await fetch(url,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});let j={};try{j=await r.json();}catch(e){}return {ok:r.ok,status:r.status,j};}
let reauthing=null;
async function api(method,url,body){let r=await raw(method,url,body);
 if(r.status===401&&r.j.error==='reautentificare'){await stepUp();r=await raw(method,url,body);}
 if(r.status===401&&r.j.error!=='reautentificare'){showLogin();throw new Error('Sesiune expirată');}
 if(!r.ok)throw new Error(r.j.error||('Eroare '+r.status));return r.j;}
const WA=!!(window.PublicKeyCredential&&navigator.credentials);
async function faceLogin(){
 const o=await raw('POST','/api/gazda/login/optiuni',{});if(!o.ok)throw new Error(o.j.error||'Eroare');
 const cred=await navigator.credentials.get({publicKey:{challenge:unb64(o.j.challenge),rpId:o.j.rpId,userVerification:'required',timeout:60000}});
 const r=cred.response;
 const f=await raw('POST','/api/gazda/login/finalizeaza',{token:o.j.token,id:b64u(cred.rawId),clientDataJSON:b64u(r.clientDataJSON),authenticatorData:b64u(r.authenticatorData),signature:b64u(r.signature)});
 if(!f.ok)throw new Error(f.j.error||'Eroare');return f.j;}
const lsGet=(k)=>{try{return localStorage.getItem(k);}catch(e){return null;}};const lsSet=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
function myPinDev(){try{return JSON.parse(lsGet('gzDev')||'null');}catch(e){return null;}}
function pinPrompt(title,confirm2){return new Promise((resolve)=>{const ov=el('div',{class:'sheet'});const inp=el('input',{type:'password',inputmode:'numeric',autocomplete:'off',maxlength:'6',placeholder:'••••••',style:'text-align:center;font-size:24px;letter-spacing:8px'});
 const inp2=confirm2?el('input',{type:'password',inputmode:'numeric',autocomplete:'off',maxlength:'6',placeholder:'Repetă PIN-ul',style:'text-align:center;font-size:24px;letter-spacing:8px;margin-top:8px'}):null;
 const msg=el('div',{class:'msg'});const ok=el('button',{type:'button'},['Continuă']);const no=el('button',{class:'s',type:'button'},['Renunță']);
 no.onclick=()=>{ov.remove();resolve(null);};
 ok.onclick=()=>{const v=inp.value.replace(/\D/g,'');if(v.length!==6)return say(msg,'PIN-ul are 6 cifre.',false);if(inp2&&inp2.value!==inp.value)return say(msg,'PIN-urile nu sunt la fel.',false);ov.remove();resolve(v);};
 inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!inp2)ok.click();});
 ov.append(el('div',{class:'card'},[el('h2',{},[title]),inp,inp2||el('span'),el('div',{class:'row',style:'margin-top:10px'},[no,ok]),msg]));document.body.append(ov);setTimeout(()=>inp.focus(),50);});}
async function pinLogin(){const d=myPinDev();if(!d)throw new Error('autentificare_invalida');const pin=await pinPrompt('Introdu PIN-ul');if(!pin){const e=new Error('anulat');e.name='NotAllowedError';throw e;}
 const f=await raw('POST','/api/gazda/pin/login',{deviceId:d.id,secret:d.secret,pin});
 if(!f.ok){if(f.j.error==='pin_blocat'){try{localStorage.removeItem('gzDev');}catch(e){}}const e=new Error(f.j.error==='pin_gresit'?('PIN greșit. Mai ai '+f.j.ramase+' încercări.'):(f.j.error||'Eroare'));throw e;}
 lsSet('gzM','pin');return f.j;}
async function pinEnroll(code){const pin=await pinPrompt('Alege un PIN de 6 cifre',true);if(!pin){const e=new Error('anulat');e.name='NotAllowedError';throw e;}
 const f=await raw('POST','/api/gazda/pin/inrolare',{pin,label:guessLabel(),code:code||undefined});if(!f.ok)throw new Error(f.j.error||'Eroare');
 lsSet('gzDev',JSON.stringify({id:f.j.deviceId,secret:f.j.secret}));lsSet('gzM','pin');return f.j;}
async function reLogin(){return (lsGet('gzM')==='pin'&&myPinDev())?pinLogin():faceLogin();}
async function stepUp(){if(!reauthing)reauthing=reLogin().finally(()=>{reauthing=null;});return reauthing;}
async function enroll(label){
 const o=await raw('POST','/api/gazda/inrolare/optiuni',{});if(!o.ok)throw new Error(o.j.error||'Eroare');const p=o.j.options;
 const cred=await navigator.credentials.create({publicKey:{challenge:unb64(p.challenge),rp:p.rp,user:{id:unb64(p.user.id),name:p.user.name,displayName:p.user.displayName},pubKeyCredParams:[{type:'public-key',alg:-7}],
  authenticatorSelection:{residentKey:'required',requireResidentKey:true,userVerification:'required'},attestation:'none',timeout:60000,excludeCredentials:p.exclude.map(i=>({type:'public-key',id:unb64(i)}))}});
 const r=cred.response;
 const f=await raw('POST','/api/gazda/inrolare/finalizeaza',{token:o.j.token,id:b64u(cred.rawId),clientDataJSON:b64u(r.clientDataJSON),attestationObject:b64u(r.attestationObject),label});
 if(!f.ok)throw new Error(f.j.error||'Eroare');lsSet('gzM','face');return f.j;}
const ERR={dispozitiv_limita:'Ai deja prea multe dispozitive. Șterge unul din Setări.',inregistrare_invalida:'Nu am putut activa Face ID. Încearcă din nou.',autentificare_invalida:'Nu am recunoscut dispozitivul. Încearcă din nou sau activează Face ID din cont.',prea_multe_cereri:'Prea multe încercări. Așteaptă puțin.',interzis:'Nu ai acces la această acțiune.',notificari_indisponibile:'Notificările nu sunt configurate pe server.',pin_slab:'PIN prea simplu. Alege 6 cifre fără șiruri (111111, 123456).',pin_gresit:'PIN greșit.',pin_blocat:'PIN greșit de 5 ori: dispozitivul a fost blocat. Activează-l din nou din cont.',cod_invalid:'Cod greșit sau expirat. Generează unul nou din cont.',dezactivat:'Rezervările nu sunt activate pentru această proprietate.'};
const errT=(e)=>{const m=(e&&e.message)||'Eroare';if(e&&e.name==='NotAllowedError')return 'Anulat. Încearcă din nou.';return ERR[m]||m;};

let deferredPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;const h=document.getElementById('instslot');if(h){h.replaceChildren();const c=installCard();if(c)h.append(c);}});
const standalone=()=>(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
function installCard(){if(standalone())return null;const c=el('div',{class:'card',style:'border-color:#0E6B63'},[el('b',{},['📲 Instalează aplicația Gazdă'])]);
 if(deferredPrompt){const b=el('button',{type:'button',style:'width:100%;margin-top:8px'},['Instalează acum']);b.onclick=async()=>{deferredPrompt.prompt();try{await deferredPrompt.userChoice;}catch(e){}deferredPrompt=null;c.remove();};c.append(b);}
 else if(/iPhone|iPad/.test(navigator.userAgent))c.append(el('div',{class:'sub',style:'margin:6px 0 0'},['În Safari: apasă butonul Partajează (pătratul cu săgeată), apoi „Adaugă pe ecranul principal”.']));
 else c.append(el('div',{class:'sub',style:'margin:6px 0 0'},['În Chrome: deschide meniul ⋮ și alege „Instalează aplicația” sau „Adaugă pe ecranul principal”.']));
 return c;}
let me=null,LID=0,tab='azi';const STAFF=()=>!!me&&me.role==='staff';
function showLogin(){me=null;document.title='Gazdă';const root=$('#app');root.replaceChildren();
 const dev=myPinDev();const msg=el('div',{class:'msg'});const first=[];
 const run=(b,fn)=>{b.onclick=async()=>{b.disabled=true;try{await fn();await boot();}catch(e){say(msg,errT(e),false);if(!lsGet('gzDev')&&dev)showLogin();}b.disabled=false;};};
 if(dev){const pb=el('button',{type:'button',style:'width:100%;height:52px;font-size:16px'},['Intră cu PIN']);run(pb,pinLogin);first.push(pb);}
 if(WA){const fb=el('button',{type:'button',class:dev?'s':'',style:'width:100%;height:52px;font-size:16px;'+(dev?'margin-top:8px':'')},['Intră cu Face ID / amprentă']);run(fb,faceLogin);first.push(fb);}
 const box=el('div',{class:'card'},first.concat([msg]));
 const setup=el('div',{class:'card'});
 const slot=el('div',{id:'instslot'});const ic=installCard();if(ic)slot.append(ic);
 root.append(el('div',{class:'hero'},[el('div',{class:'face'},['🏡']),el('h1',{},['Gazdă']),el('p',{class:'sub'},['Rezervările și calendarul tău, la o atingere distanță.'])]),first.length?box:el('div',{class:'card err'},['Acest telefon nu suportă Face ID / amprentă în browser. Poți folosi un PIN.']),setup,slot);
 raw('GET','/api/gazda/inrolare/stare').then(r=>{
  if(r.ok){setup.append(el('b',{},['Activează intrarea rapidă pe acest telefon']),el('p',{class:'sub'},['Ești conectat în cont ('+r.j.email+'). Alege cum vrei să intri de acum încolo, fără e-mail și fără parolă. Poți schimba oricând din Setări.']));
   const m=el('div',{class:'msg'});
   if(WA){const b=el('button',{type:'button',style:'width:100%'},['Face ID / amprentă']);b.onclick=async()=>{b.disabled=true;try{await enroll(guessLabel());await boot();}catch(e){say(m,errT(e),false);b.disabled=false;}};setup.append(b);}
   const pb=el('button',{type:'button',class:WA?'s':'',style:'width:100%;margin-top:8px'},['PIN de 6 cifre']);pb.onclick=async()=>{pb.disabled=true;try{await pinEnroll();await boot();}catch(e){say(m,errT(e),false);pb.disabled=false;}};setup.append(pb,m);}
  else{setup.append(el('b',{},['Prima dată?']),el('p',{class:'sub'},['În cont, la „Aplicația Gazdă”, apeși „Generează cod”. Scrie codul aici și alege un PIN. Dacă folosești Face ID, intră în cont direct din acest telefon.']));
   const code=el('input',{placeholder:'Cod din cont (8 caractere)',maxlength:'8',autocapitalize:'characters',style:'text-transform:uppercase;letter-spacing:3px;text-align:center'});const m=el('div',{class:'msg'});
   const cb=el('button',{type:'button',style:'width:100%;margin-top:8px'},['Activează cu PIN']);cb.onclick=async()=>{cb.disabled=true;try{await pinEnroll(code.value.trim());await boot();}catch(e){say(m,errT(e),false);cb.disabled=false;}};
   setup.append(code,cb,m,el('a',{href:'/cazare/login',class:'mini',style:'height:42px;margin-top:8px'},['Intră în cont (pentru Face ID)']));}});
}
function guessLabel(){const u=navigator.userAgent;return /iPhone/.test(u)?'iPhone':/iPad/.test(u)?'iPad':/Android/.test(u)?'Telefon Android':/Mac/.test(u)?'Mac':'Dispozitiv';}
async function boot(){let r=await raw('GET','/api/gazda/eu');if(!r.ok){return showLogin();}me=r.j;
 if(!me.listings.length){$('#app').replaceChildren(el('div',{class:'card'},['Rezervările nu sunt încă activate pentru proprietățile tale. Contactează-ne ca să le activăm.']));return;}
 let saved=0;try{saved=Number(localStorage.getItem('gzListing'))||0;}catch(e){}
 LID=me.listings.some(l=>l.id===saved)?saved:me.listings[0].id;draw();}
function draw(){const root=$('#app');root.replaceChildren();
 const sw=el('select',{'aria-label':'Proprietate'});me.listings.forEach(l=>sw.append(el('option',{value:String(l.id)},[l.name])));sw.value=String(LID);sw.hidden=me.listings.length<2;
 sw.onchange=()=>{LID=Number(sw.value);try{localStorage.setItem('gzListing',String(LID));}catch(e){}resetState();show(tab);};
 root.append(el('div',{class:'top'},[me.listings.length<2?el('b',{style:'font-size:17px'},[me.listings[0].name]):sw]),el('div',{id:'view'}));
 const nav=el('div',{class:'nav'});[['azi','Azi'],['cal','Calendar'],['rez','Rezervări'],['set','Setări']].forEach(t=>{const b=el('button',{type:'button','data-t':t[0]},[t[1]]);b.onclick=()=>show(t[0]);nav.append(b);});document.body.append(nav);
 show(tab);}
function resetState(){month=firstOfMonth(new Date());days={};sel=[];units=[];curUnit='';}
function show(t){tab=t;document.querySelectorAll('.nav button').forEach(b=>b.className=b.dataset.t===t?'on':'');const v=$('#view');if(!v)return;v.replaceChildren();
 ({azi:viewAzi,cal:viewCal,rez:viewRez,set:viewSet})[t](v);}
const B=()=>'/api/rezervari/'+LID;
const ds=(d)=>d.toISOString().slice(0,10);
const RO=['ian','feb','mar','apr','mai','iun','iul','aug','sep','oct','nov','dec'];
const dRo=(s)=>{const p=s.split('-');return Number(p[2])+' '+RO[Number(p[1])-1];};
const ron=(b)=>(b/100).toLocaleString('ro-RO')+' RON';
function firstOfMonth(d){return new Date(Date.UTC(d.getFullYear(),d.getMonth(),1));}
let month=firstOfMonth(new Date()),days={},sel=[],units=[],curUnit='';
const today=ds(new Date());
const PAYST={awaiting:'în așteptare',partial:'avans plătit',paid:'plătită',rest_failed:'rest neplătit',refunded:'returnată',forfeited:'anulată, suma se reține',refund_failed:'rambursare de verificat'};

function icalWarn(){return el('div',{class:'redwarn'},['⚠️ Important: dacă ai cazarea listată și pe alte platforme (Booking.com, Airbnb, Travelminit etc.), este obligatoriu să adaugi linkul lor iCal în cont, la „Sincronizare platforme”. Altfel calendarele nu se sincronizează și riști overbooking (aceeași perioadă rezervată de două ori, o dată la ele și o dată la noi). ',el('a',{href:'/cont/rezervari/'+LID},['Adaugă acum în cont'])]);}
// ---------- AZI ----------
async function viewAzi(v){v.append(el('div',{class:'sub'},['Se încarcă…']));let j;try{j=await api('GET','/api/gazda/azi?listing='+LID);}catch(e){v.replaceChildren(el('div',{class:'card err'},[errT(e)]));return;}
 v.replaceChildren();
 if(j.ical_missing)v.append(icalWarn());
 v.append(freeCard(j));
 v.append(roomsCard(j.rooms||[]));
 v.append(el('div',{class:'kpis'},[kpi(j.arrivals_today.length,'Sosiri azi'),kpi(j.in_house.length,'În casă'),kpi(j.departures_today.length,'Plecări azi')]));
 if(j.alerts.length){const c=el('div',{class:'card alert'},[el('h2',{},['De rezolvat'])]);j.alerts.forEach(a=>c.append(el('div',{class:'item'},[a])));v.append(c);}
 const list=(title,arr,empty)=>{const c=el('div',{class:'card'},[el('h2',{},[title])]);if(!arr.length)c.append(el('div',{class:'sub'},[empty]));arr.forEach(x=>c.append(resCard(x,false)));v.append(c);};
 list('Sosesc în următoarele 7 zile',j.arrivals_soon,'Nicio sosire în următoarele 7 zile.');
 list('Sunt la tine acum',j.in_house,'Nimeni cazat acum.');
 if(j.arrivals_today.length||j.departures_today.length){list('Azi',j.arrivals_today.concat(j.departures_today),'');}
 v.append(el('div',{class:'card'},[el('div',{class:'sub'},['Următoarele 30 de nopți: '+j.occupied_30+' ocupate din 30'])]));}
function freeCard(j){const f=j.free_tonight||{};if(!f.approved)return el('span');const on=!!f.on;const freeN=(j.rooms||[]).filter(r=>r.tonight===0).length;
 const b=el('button',{type:'button',class:on?'s':'',style:'width:100%;height:50px;font-size:15px'},[on?'🟢 Liber în seara asta · apasă ca să anulezi':'🟢 Am camere libere în seara asta']);
 b.onclick=async()=>{b.disabled=true;try{await api('POST','/api/gazda/liber-diseara',{listing:LID,on:!on,rooms:(!on&&freeN>0&&(j.rooms||[]).length>1)?freeN:undefined});show('azi');}catch(e){alert(errT(e));b.disabled=false;}};
 return el('div',{class:'card'},[b,el('div',{class:'sub',style:'margin:6px 0 0'},[on?'Pe site apare eticheta verde „Liber în seara asta”, până la miezul nopții.':'Pe site apare eticheta verde „Liber în seara asta” până la miezul nopții. Dacă ai mai multe camere, afișăm câte sunt libere.'])]);}
const STN={0:'liber\',1:'închis de tine',2:'ocupat (altă platformă)',3:'în curs de rezervare',4:'rezervat'};
function roomsCard(rooms){const free=rooms.filter(r=>r.tonight===0).length;
 const c=el('div',{class:'card'},[el('h2',{},['Camere în seara asta: '+free+' libere din '+rooms.length])]);
 rooms.forEach(r=>{const it=el('div',{class:'item'},[el('b',{},[r.name]),el('div',{class:'sub',style:'margin:2px 0'},['Azi noapte: '+STN[r.tonight]+' · Mâine noapte: '+STN[r.tomorrow]])]);
  const row=el('div',{class:'row',style:'margin-top:4px'});
  [['tonight','azi',0],['tomorrow','mâine',1]].forEach(k=>{const st=r[k[0]];if(st===0||st===1){const b=el('button',{class:(st===0?'d':'s')+' mini',type:'button'},[(st===0?'Închide ':'Deschide ')+k[1]]);
   b.onclick=async()=>{b.disabled=true;try{const d=new Date();d.setDate(d.getDate()+k[2]);const day=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    await api('POST',B()+'/zile',{days:[day],action:st===0?'close':'open',unit:r.unit_no?r.unit_no:undefined});show('azi');}catch(e){alert(errT(e));b.disabled=false;}};row.append(b);}});
  if(row.children.length)it.append(row);c.append(it);});return c;}
function kpi(n,t){return el('div',{class:'card'},[el('div',{class:'big'},[String(n)]),el('div',{class:'sub',style:'margin:4px 0 0'},[t])]);}
function resCard(x,actions){const kids=[el('b',{},[x.guest_name+(x.status==='cancelled'?(x.refused?' · refuzată':' · anulată'):'')]),
 el('div',{class:'sub',style:'margin:2px 0'},[dRo(x.check_in)+' → '+dRo(x.check_out)+' · '+x.guests+' pers.'+(x.unit_names?' · '+x.unit_names:'')+(STAFF()?'':' · '+ron(x.total_bani))+(!STAFF()&&x.pay_scheme&&x.pay_scheme!=='direct'?' · online: '+(PAYST[x.pay_status]||x.pay_status):'')])];
 const row=el('div',{class:'row',style:'margin-top:6px'});
 if(x.guest_phone){row.append(el('a',{class:'mini',href:'tel:'+x.guest_phone},['Sună']),el('a',{class:'mini',href:'https://wa.me/'+String(x.guest_phone).replace(/[^0-9]/g,''),target:'_blank',rel:'noopener'},['WhatsApp']));}
 kids.push(row);return el('div',{class:'item'},kids);}

// ---------- CALENDAR ----------
async function viewCal(v){
 v.append(el('div',{class:'card'},[el('div',{id:'unitwrap',hidden:'hidden'},[el('label',{},['Camera',el('select',{id:'unitsel'})])]),
  el('div',{class:'row',style:'align-items:center;justify-content:space-between;margin:8px 0'},[el('button',{class:'s',id:'prev',type:'button'},['‹']),el('b',{id:'mname',style:'text-align:center'}),el('button',{class:'s',id:'next',type:'button'},['›'])]),
  el('div',{class:'cal',id:'cal'}),
  el('div',{class:'leg'},[el('span',{},['■ liber'],),el('span',{style:'color:#5B6770'},['■ închis de tine']),el('span',{style:'color:#123A6B'},['■ platformă']),el('span',{style:'color:#B58100'},['■ în rezervare']),el('span',{style:'color:#0E6B63'},['■ rezervat'])]),
  el('div',{class:'sub',id:'selinfo',style:'margin-top:8px'}),
  el('div',{class:'row'},[el('button',{id:'close',type:'button'},['Închide zilele alese']),el('button',{class:'s',id:'open',type:'button'},['Deschide zilele alese'])]),el('div',{class:'msg',id:'calmsg'})]));
 $('#prev').onclick=()=>{month=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()-1,1));loadCal();};
 $('#next').onclick=()=>{month=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,1));loadCal();};
 $('#close').onclick=()=>act('close');$('#open').onclick=()=>act('open');
 try{const t=await api('GET',B()+'/tarife');units=t.units||[];}catch(e){}
 const us=$('#unitsel');$('#unitwrap').hidden=!units.length;units.forEach(u=>us.append(el('option',{value:String(u.unit_no)},[u.name])));
 if(units.length){if(!units.some(u=>String(u.unit_no)===curUnit))curUnit=String(units[0].unit_no);us.value=curUnit;}else curUnit='';
 us.onchange=()=>{curUnit=us.value;sel=[];$('#selinfo').textContent='';loadCal();};
 loadCal();}
const uq=(p)=>curUnit?(p+'unit='+curUnit):'';
async function loadCal(){try{const from=ds(month),to=ds(new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,1)));const j=await api('GET',B()+'/calendar?from='+from+'&to='+to+uq('&'));days={};j.days.forEach(d=>days[d.day]=d.status);renderCal();}catch(e){const m=$('#calmsg');if(m)say(m,errT(e),false);}}
function renderCal(){const g=$('#cal');if(!g)return;g.replaceChildren();['L','M','M','J','V','S','D'].forEach(x=>g.append(el('div',{class:'h'},[x])));
 const first=month.getUTCDay()===0?6:month.getUTCDay()-1;for(let i=0;i<first;i++)g.append(el('div',{style:'border:0;background:none'}));
 const n=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate();
 for(let d=1;d<=n;d++){const s=ds(new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth(),d)));const st=days[s]||0;
  const c=el('div',{class:(st?'s'+st:'')+(s<today?' past':' cl')+(sel.includes(s)?' sel':'')},[String(d)]);
  if(s>=today)c.addEventListener('click',()=>{if(sel.includes(s))sel=sel.filter(x=>x!==s);else sel.push(s);renderCal();$('#selinfo').textContent=sel.length?sel.length+' zile selectate':'';});g.append(c);}
 $('#mname').textContent=RO[month.getUTCMonth()]+' '+month.getUTCFullYear();}
async function act(action){const m=$('#calmsg');if(!sel.length)return say(m,'Alege mai întâi zilele din calendar.',false);
 try{const r=await api('POST',B()+'/zile',{days:sel,action,unit:curUnit?Number(curUnit):undefined});sel=[];$('#selinfo').textContent='';await loadCal();say(m,r.changed+' zile actualizate'+(r.skipped?(' · '+r.skipped+' nu pot fi schimbate (rezervare sau platformă)'):''),true);}catch(e){say(m,errT(e),false);}}

// ---------- REZERVĂRI ----------
async function viewRez(v){v.append(el('div',{class:'sub'},['Se încarcă…']));let j,fm={};try{j=await api('GET',B()+'/rezervari');}catch(e){v.replaceChildren(el('div',{class:'card err'},[errT(e)]));return;}
 try{fm=(await api('GET',B()+'/fise-rezumat')).forms||{};}catch(e){}
 let un=[];try{un=(await api('GET',B()+'/tarife')).units||[];}catch(e){}
 v.replaceChildren();const up=j.reservations.filter(x=>x.status==='confirmed'&&x.check_out>=today).sort((a,b)=>a.check_in<b.check_in?-1:1);
 const past=j.reservations.filter(x=>!(x.status==='confirmed'&&x.check_out>=today));
 const mk=(title,arr,empty,act)=>{const c=el('div',{class:'card'},[el('h2',{},[title])]);if(!arr.length)c.append(el('div',{class:'sub'},[empty]));
  arr.forEach(x=>{x.unit_names=(x.unit_ids&&x.unit_ids[0]!==0)?x.unit_ids.map(n=>{const u=un.find(z=>z.unit_no===n);return u?u.name:('Camera '+n);}).join(', '):'';
   const it=resCard(x,act);const kids=[];
   if(act&&x.status==='confirmed'&&STAFF()){kids.push(el('div',{class:'sub',style:'margin:4px 0'},['Fișe de cazare: '+(fm[x.id]||0)+' din '+x.guests]));}
   else if(act&&x.status==='confirmed'){const n=fm[x.id]||0;kids.push(el('div',{class:'sub',style:'margin:4px 0'},['Fișe de cazare: '+n+' din '+x.guests]));
    if(x.guarantee_bani)kids.push(el('div',{class:'sub',style:'margin:4px 0'},['Garanție '+ron(x.guarantee_bani)+': '+({pending:'se blochează cu o zi înainte de sosire',held:'blocată pe card',failed:'nu a putut fi blocată',released:'eliberată',claimed:'reținută'}[x.guarantee_status]||'')]));
    const row=el('div',{class:'row',style:'margin-top:6px'});const cn=el('button',{class:'d mini',type:'button'},['Anulează']);cn.onclick=()=>cancelRes(x,v);const rf=el('button',{class:'d mini',type:'button'},['Refuză']);rf.onclick=()=>refuse(x,v);row.append(cn,rf);const sa=el('button',{class:'s mini',type:'button'},['Trimite acces']);sa.onclick=async()=>{if(!confirm('Trimiți acum oaspetelui mesajul de sosire cu informațiile de acces?'))return;try{await api('POST','/api/gazda/sosire/'+x.id+'/trimite',{listing:LID});alert('Trimis.');}catch(e){alert(({mesaj_gol:'Scrie mai întâi mesajul în Setări > Mesaj de sosire.',deja_trimis:'Mesajul a fost deja trimis.'})[e.message]||errT(e));}};row.append(sa);
    if(x.guarantee_status==='held'){const g=el('button',{class:'s mini',type:'button'},['Reține din garanție']);g.onclick=()=>claimGar(x,v);row.append(g);}kids.push(row);}
   kids.forEach(k=>it.append(k));c.append(it);});v.append(c);};
 mk('Rezervări viitoare',up,'Nicio rezervare viitoare.',true);mk('Recente / anulate',past,'—',false);}
const CERR={plata_efectuata:'Banii au fost deja virați; nu se mai poate anula automat. Contactează-ne.',rambursare_esuata:'Rambursarea a eșuat. Încearcă din nou în câteva minute.',garantie_indisponibila:'Garanția nu este blocată pe card.',suma_invalida:'Sumă invalidă.',termen_expirat:'Termenul de reținere a expirat.',captura_esuata:'Banca nu a permis reținerea. Încearcă din nou.',date_invalide:'Completează toate câmpurile (comentariu minim 5 caractere, la „Altul” 15).'};
async function cancelRes(x,v){if(!confirm('Anulezi rezervarea lui '+x.guest_name+'? Zilele se eliberează și turistul primește e-mail.'+(x.pay_scheme&&x.pay_scheme!=='direct'&&x.paid_bani?' Suma plătită se returnează integral turistului.':'')))return;
 try{await api('POST',B()+'/rezervari/'+x.id+'/anuleaza',{});show('rez');}catch(e){alert(CERR[e.message]||errT(e));}}
async function claimGar(x,v){const a=prompt('Câți RON reții din garanție? (maxim '+(x.guarantee_bani/100)+')');if(a===null)return;const note=prompt('Motivul reținerii (minim 10 caractere; turistul îl primește pe e-mail)');if(note===null)return;
 try{await api('POST',B()+'/rezervari/'+x.id+'/garantie',{amount_ron:Number(String(a).replace(',','.')),note});show('rez');}catch(e){alert(CERR[e.message]||errT(e));}}
function refuse(x,v){const ov=el('div',{class:'sheet'});
 const sel=el('select',{});[['form_incomplete','Fișă de cazare incompletă'],['false_data','Date de identificare false / suspecte'],['fraud','Comportament neadecvat / fraudă'],['other','Altul (explicații detaliate)']].forEach(o=>sel.append(el('option',{value:o[0]},[o[1]])));
 const ta=el('textarea',{maxlength:'300',rows:'3',placeholder:'Comentariu scurt (obligatoriu)',style:'width:100%;border:1px solid #C9C3B6;border-radius:8px;padding:8px;font-size:15px;margin-top:3px'});
 const msg=el('div',{class:'msg'});const ok=el('button',{class:'d',type:'button'},['Confirmă refuzul']);const no=el('button',{class:'s',type:'button'},['Renunță']);no.onclick=()=>ov.remove();
 ok.onclick=async()=>{ok.disabled=true;try{await api('POST',B()+'/rezervari/'+x.id+'/refuza',{code:sel.value,note:ta.value});ov.remove();show('rez');}catch(e){say(msg,CERR[e.message]||errT(e),false);ok.disabled=false;}};
 ov.append(el('div',{class:'card'},[el('h2',{},['Refuză oaspetele']),el('div',{class:'sub'},['Rezervarea se anulează, turistul primește banii înapoi integral (dacă a plătit online) și zilele se eliberează.']),el('label',{},['Motiv',sel]),el('label',{},['Comentariu',ta]),el('div',{class:'row',style:'margin-top:10px'},[no,ok]),msg]));document.body.append(ov);}

// ---------- NOTIFICĂRI, MESAJ DE SOSIRE, PERSONAL ----------
async function enablePush(){if(!('Notification' in window)||!('PushManager' in window))throw new Error('Telefonul nu permite notificări aici. Pe iPhone, adaugă mai întâi aplicația pe ecranul principal.');
 const perm=await Notification.requestPermission();if(perm!=='granted')throw new Error('Notificările sunt blocate din setările telefonului.');
 const k=await api('GET','/api/gazda/push/cheie');const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
 if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:new Uint8Array(unb64(k.key))});const j=sub.toJSON();
 await api('POST','/api/gazda/push/aboneaza',{endpoint:j.endpoint,keys:j.keys});}
async function pushCard(){const c=el('div',{class:'card'},[el('h2',{},['Notificări']),el('div',{class:'sub'},['Primești o alertă la rezervare nouă, anulare sau problemă, plus un rezumat în fiecare dimineață.'])]);
 let on=false;try{const reg=await navigator.serviceWorker.ready;on=!!(await reg.pushManager.getSubscription())&&Notification.permission==='granted';}catch(e){}
 const m=el('div',{class:'msg'});const b=el('button',{type:'button',class:on?'s':''},[on?'Notificări active ✓ (apasă ca să reactivezi)':'Activează notificările']);
 b.onclick=async()=>{b.disabled=true;try{await enablePush();say(m,'Notificări active pe acest telefon.',true);}catch(e){say(m,errT(e),false);}b.disabled=false;};c.append(b,m);return c;}
async function arrivalCard(){const c=el('div',{class:'card'},[el('h2',{},['Mesaj de sosire (automat)']),el('div',{class:'sub'},['Oaspetele primește pe e-mail mesajul tău și informațiile de acces înainte de sosire, doar dacă fișa de cazare e completată pentru toți și plata e încheiată. Altfel te anunțăm pe tine.'])]);
 let s;try{s=await api('GET','/api/gazda/sosire/setari?listing='+LID);}catch(e){c.append(el('div',{class:'sub'},[errT(e)]));return c;}
 const au=el('input',{type:'checkbox',style:'width:auto;height:auto'});au.checked=s.auto;const dy=el('select',{});[['1','cu 1 zi înainte'],['2','cu 2 zile înainte']].forEach(o=>dy.append(el('option',{value:o[0]},[o[1]])));dy.value=String(s.days);
 const msg=el('textarea',{rows:'3',maxlength:'1000',placeholder:'Ex.: Te așteptăm! Check-in după ora 14.',style:'width:100%;border:1px solid #C9C3B6;border-radius:8px;padding:8px;font-size:15px'});msg.value=s.message;
 const ac=el('textarea',{rows:'2',maxlength:'300',placeholder:'Ex.: Cod intrare: 4821. Cheia e în cutia de lângă poartă.',style:'width:100%;border:1px solid #C9C3B6;border-radius:8px;padding:8px;font-size:15px'});ac.value=s.access;
 const m=el('div',{class:'msg'});const sv=el('button',{type:'button'},['Salvează']);
 sv.onclick=async()=>{try{await api('POST','/api/gazda/sosire/setari',{listing:LID,auto:au.checked,days:Number(dy.value),message:msg.value,access:ac.value});say(m,'Salvat',true);}catch(e){say(m,errT(e),false);}};
 c.append(el('label',{style:'display:flex;gap:8px;align-items:center'},[au,'Trimite automat']),el('label',{},['Când',dy]),el('label',{},['Mesaj pentru oaspete',msg]),el('label',{},['Acces / instrucțiuni',ac]),el('div',{class:'row',style:'margin-top:8px'},[sv]),m);return c;}
function staffCard(){const c=el('div',{class:'card'},[el('h2',{},['Personal (recepție, familie)']),el('div',{class:'sub'},['Dă acces limitat unei persoane de încredere: vede calendarul și rezervările și poate închide zile. Nu vede sume, nu anulează și nu schimbă setări.'])]);
 const m=el('div',{class:'msg'});const b=el('button',{class:'s',type:'button'},['Adaugă o persoană']);
 b.onclick=async()=>{const name=prompt('Cum o numești? (ex.: Maria recepție)');if(!name)return;let ls=me.listings.map(l=>l.id);if(ls.length>1&&confirm('Acces doar la cazarea curentă? OK = doar aceasta, Anulează = la toate.'))ls=[LID];
  try{const j=await api('POST','/api/gazda/personal/cod',{label:name,listings:ls});say(m,'Cod pentru '+name+': '+j.code+' (valabil '+j.minutes+' min, o singură dată). Persoana deschide '+location.origin+'/gazda/, scrie codul și își alege un PIN.',true);}catch(e){say(m,errT(e),false);}};c.append(b,m);return c;}

// ---------- SETĂRI ----------
async function viewSet(v){if(STAFF()){v.append(el('div',{class:'card'},[el('b',{},['Cont de personal']),el('div',{class:'sub'},['Poți vedea calendarul și rezervările și poți închide sau deschide zile.'])]));const o2=el('button',{class:'s',type:'button',style:'width:100%'},['Ieși din aplicație']);o2.onclick=async()=>{await raw('POST','/api/gazda/iesire',{});showLogin();};v.append(o2);return;}
 const ic2=installCard();if(ic2)v.append(ic2);
 let t;try{t=await api('GET',B()+'/tarife');}catch(e){v.append(el('div',{class:'card err'},[errT(e)]));return;}const s=t.settings;
 const inst=el('input',{type:'checkbox',id:'inst',style:'width:auto;height:auto'});inst.checked=!!s.instant_enabled;
 const lead=el('select',{id:'lead'});[['0','Oricând, chiar și în aceeași zi'],['1','Cu cel puțin 1 zi înainte'],['2','Cu cel puțin 2 zile înainte'],['3','Cu cel puțin 3 zile înainte'],['7','Cu cel puțin 7 zile înainte']].forEach(o=>lead.append(el('option',{value:o[0]},[o[1]])));lead.value=String(s.lead_days);
 const m1=el('div',{class:'msg'});const sv=el('button',{type:'button'},['Salvează']);
 sv.onclick=async()=>{try{await api('POST',B()+'/setari',{base_price_ron:s.base_price_bani==null?null:s.base_price_bani/100,min_nights:s.min_nights,max_guests:s.max_guests,instant_enabled:inst.checked,lead_days:Number(lead.value)});say(m1,'Salvat',true);}catch(e){say(m1,errT(e),false);}};
 v.append(el('div',{class:'card'},[el('h2',{},['Rezervare instant']),el('label',{style:'display:flex;gap:8px;align-items:center'},[inst,'Acceptă rezervări instant']),el('label',{},['Cât de repede poate rezerva turistul',lead]),sv,m1,
  s.instant_enabled?el('div',{class:'mono',style:'margin-top:8px'},[location.origin+'/cazare/rezerva/'+LID]):el('span')]));
 v.append(el('div',{class:'card'},[el('h2',{},['Tarife, camere, platforme']),icalWarn(),el('div',{class:'sub'},['Tarifele detaliate, camerele și sincronizarea cu alte platforme se gestionează din contul tău.']),el('a',{class:'mini',href:'/cont/rezervari/'+LID,style:'height:42px'},['Deschide în cont'])]));
 v.append(await pushCard());v.append(await arrivalCard());v.append(staffCard());
 const dv=el('div',{class:'card'},[el('h2',{},['Dispozitivele mele'])]);v.append(dv);
 try{const d=await api('GET','/api/gazda/dispozitive');d.devices.forEach(x=>{const it=el('div',{class:'item'},[el('b',{},[(x.role==='staff'?'Personal · ':(x.kind==='pin'?'PIN · ':'Face ID · '))+x.label+(x.current?' (acesta)':'')]),el('div',{class:'sub',style:'margin:2px 0'},['Adăugat '+x.created+' · ultima folosire '+x.last_used])]);
  const b=el('button',{class:'d mini',type:'button'},['Șterge']);b.onclick=async()=>{if(!confirm('Ștergi acest dispozitiv? Nu va mai putea intra cu Face ID.'))return;try{await api('POST','/api/gazda/dispozitive/'+x.id+'/revoca',{});if(x.current)return showLogin();show('set');}catch(e){alert(errT(e));}};it.append(b);dv.append(it);});
  const add=el('button',{class:'s',type:'button',style:'margin-top:8px'},['Adaugă Face ID pe acest telefon']);add.onclick=async()=>{add.disabled=true;try{await enroll(guessLabel());show('set');}catch(e){alert(errT(e));add.disabled=false;}};dv.append(add);
  const addp=el('button',{class:'s',type:'button',style:'margin:8px 0 0 8px'},['Adaugă PIN pe acest telefon']);addp.onclick=async()=>{addp.disabled=true;try{await pinEnroll();show('set');}catch(e){alert(errT(e));addp.disabled=false;}};dv.append(addp);
  dv.append(el('div',{class:'sub',style:'margin-top:8px'},['Ca să schimbi metoda: adaugă una nouă, apoi șterge-o pe cea veche.']));}catch(e){dv.append(el('div',{class:'sub'},[errT(e)]));}
 const out=el('button',{class:'s',type:'button',style:'width:100%'},['Ieși din aplicație']);out.onclick=async()=>{await raw('POST','/api/gazda/iesire',{});showLogin();};v.append(out);}

// Service worker-ul principal al site-ului memorează toate răspunsurile GET; datele rezervărilor nu trebuie să treacă prin el.
// De aceea așteptăm ca service worker-ul aplicației Gazdă (care nu memorează nimic) să preia controlul înainte de a cere date.
(async()=>{try{if('serviceWorker' in navigator){await navigator.serviceWorker.register('/gazda/sw.js',{scope:'/gazda/'});await navigator.serviceWorker.ready;
 const ours=()=>navigator.serviceWorker.controller&&/\\/gazda\\/sw\\.js$/.test(navigator.serviceWorker.controller.scriptURL);
 if(!ours())await new Promise(res=>{const t=setTimeout(res,3000);navigator.serviceWorker.addEventListener('controllerchange',()=>{if(ours()){clearTimeout(t);res();}});});}}catch(e){}
 boot();})();
`;

function page(res, nonce) {
  res.set({
    "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; style-src-attr 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`,
    "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer",
  });
}

function mount(r, o) {
  const { jsonOnly, noStore, shell, PAGE_CSS, previewKey } = o;
  const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
  const ownerOnly = L.requireAccommodationOwnerApi;

  // Punte: o sesiune de dispozitiv „Gazdă” valabilă poate folosi API-ul de rezervări al proprietarului (nu și restul contului).
  // Acțiunile sensibile cer Face ID recent.
  r.use(async (req, res, next) => {
    try {
      const full = String(req.originalUrl || req.url || "").split("?")[0];
      if (!/^\/api\/rezervari(\/|$)/.test(full) || !L.parseCookies(req)[COOKIE]) return next();
      const g = await readGz(req);
      if (!g) return next();
      const own = L.getAccommodationOwnerSession(req);
      if (own && own.ownerId === g.ownerId) return next();
      if (g.role === "staff") {
        // personalul (recepție/familie) vede calendarul și rezervările, poate închide/deschide zile; fără bani, setări sau anulări
        const m = full.match(/^\/api\/rezervari\/(\d+)\/(calendar|rezervari|tarife|zile|fise-rezumat)$/);
        const okm = m && ((req.method === "GET" && m[2] !== "zile") || (req.method === "POST" && m[2] === "zile"));
        if (!okm || (g.lids.length && !g.lids.includes(Number(m[1])))) return res.status(403).json({ error: "interzis" });
        const jj = res.json.bind(res);
        res.json = (o) => jj(staffView(m[2], o));
      }
      const sens = req.method !== "GET" && /\/(anuleaza|refuza|garantie)$|\/plati\/cont$/.test(full);
      if (sens && (!g.auth || Date.now() - g.auth > FRESH_MS)) return res.status(401).json({ error: "reautentificare" });
      const signed = L.signCookiePayload(JSON.stringify({ ownerId: g.ownerId, email: g.email, exp: Date.now() + 5 * 60 * 1000, via: "gazda" }), ACCOMMODATION_SESSION_SECRET);
      req.headers.cookie = (req.headers.cookie ? req.headers.cookie + "; " : "") + "accSession=" + encodeURIComponent(signed);
      next();
    } catch (e) { next(); }
  });

  // ---------- pagina + manifest + service worker ----------
  const appPage = (req, res) => {
    const hostOnly = String(req.headers.host || "").replace(/:\d+$/, "");
    if (hostOnly !== RP_ID && hostOnly !== "localhost") return res.redirect(302, ORIGIN + "/gazda/"); // un singur domeniu, ca passkey-ul să fie valabil
    const nonce = crypto.randomBytes(16).toString("base64");
    page(res, nonce);
    res.type("html").send(`<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><title>Gazdă</title><link rel="manifest" href="/gazda/manifest.webmanifest"><meta name="theme-color" content="#0E6B63"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Gazdă"><meta name="apple-mobile-web-app-status-bar-style" content="default"><link rel="apple-touch-icon" href="/icon-192.png"><style nonce="${nonce}">${PAGE_CSS}${APP_CSS}</style></head><body><div class="w" id="app"><div class="sub" style="padding:40px 0;text-align:center">Se încarcă…</div></div><script nonce="${nonce}">${APP_JS}</script></body></html>`);
  };
  r.get("/gazda", appPage);
  r.get("/gazda/", appPage);
  r.get("/gazda/manifest.webmanifest", (req, res) => {
    // în previzualizare (rezervările nu sunt pornite global) aplicația instalată trebuie să poarte parola, altfel s-ar deschide pe 404; cu funcția pornită manifestul e curat
    const pk = previewKey ? previewKey(req) : "";
    const mf = pk ? Object.assign({}, MANIFEST, { start_url: "/gazda/?bkpreview=" + encodeURIComponent(pk) }) : MANIFEST;
    res.type("application/manifest+json").set(pk ? { "Cache-Control": "private, no-store" } : { "Cache-Control": "public, max-age=3600" }).send(JSON.stringify(mf));
  });
  r.get("/gazda/sw.js", (req, res) => { res.type("application/javascript").set({ "Cache-Control": "no-cache", "Service-Worker-Allowed": "/gazda/" }).send(SW); });

  // ---------- activare Face ID (doar din cont, o singură dată pe dispozitiv) ----------
  r.get("/api/gazda/inrolare/stare", ownerOnly, (req, res) => { noStore(res); res.json({ ok: true, email: req.accommodationOwner.email || "" }); });

  r.post("/api/gazda/inrolare/optiuni", ownerOnly, jsonOnly, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "gz-reg", 20, 60))) return res.status(429).json({ error: "prea_multe_cereri" });
      const oid = req.accommodationOwner.ownerId;
      const have = (await dbPool.query(`SELECT cred_id FROM gazda_devices WHERE owner_id = $1::integer AND revoked_at IS NULL`, [oid])).rows;
      if (have.length >= MAX_DEVICES) return res.status(409).json({ error: "dispozitiv_limita" });
      const c = mkChallenge("reg", { o: oid });
      const uid = sha256("gazda:" + oid + ":" + ACCOMMODATION_SESSION_SECRET).subarray(0, 16);
      noStore(res);
      res.json({ token: c.token, options: { challenge: c.challenge, rp: { id: RP_ID, name: "Programul de Azi" }, user: { id: b64u(uid), name: req.accommodationOwner.email || ("gazda" + oid), displayName: req.accommodationOwner.email || "Gazdă" }, exclude: have.map((x) => x.cred_id) } });
    } catch (e) { console.error("gazda reg opt:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  r.post("/api/gazda/inrolare/finalizeaza", ownerOnly, jsonOnly, async (req, res) => {
    try {
      const b = req.body || {};
      const ch = readChallenge(b.token, "reg");
      const oid = req.accommodationOwner.ownerId;
      if (!ch || ch.o !== oid) return res.status(400).json({ error: "inregistrare_invalida" });
      let jwk, credId;
      try {
        checkClientData(fromB64u(b.clientDataJSON), "webauthn.create", ch.ch);
        const att = cborDecode(fromB64u(b.attestationObject)).value;
        if (!(att instanceof Map)) throw new Error("att");
        const ad = parseAuthData(att.get("authData"));
        if (!ad.rpIdHash.equals(sha256(RP_ID)) || !(ad.flags & 0x01) || !(ad.flags & 0x04) || !ad.cred) throw new Error("flags");
        jwk = coseToJwk(ad.cred.key);
        credId = b64u(ad.cred.id);
        if (b.id && b.id !== credId) throw new Error("id");
      } catch (e) { return res.status(400).json({ error: "inregistrare_invalida" }); }
      const n = (await dbPool.query(`SELECT count(*)::int AS n FROM gazda_devices WHERE owner_id = $1::integer AND revoked_at IS NULL`, [oid])).rows[0].n;
      if (n >= MAX_DEVICES) return res.status(409).json({ error: "dispozitiv_limita" });
      const label = String(b.label || "Dispozitiv").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 40) || "Dispozitiv";
      const ins = await dbPool.query(`INSERT INTO gazda_devices (owner_id, cred_id, public_key, sign_count, label) VALUES ($1,$2,$3,0,$4) ON CONFLICT (cred_id) DO NOTHING RETURNING id`, [oid, credId, JSON.stringify(jwk), label]);
      if (!ins.rows.length) return res.status(400).json({ error: "inregistrare_invalida" });
      setGz(res, { ownerId: oid, email: req.accommodationOwner.email || "", did: Number(ins.rows[0].id), auth: Date.now() });
      await logEv(oid, ins.rows[0].id, "enroll");
      noStore(res); res.json({ ok: true });
    } catch (e) { console.error("gazda reg fin:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // ---------- login cu Face ID (fără cont în prealabil) ----------
  r.post("/api/gazda/login/optiuni", jsonOnly, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "gz-login", 40, 15))) return res.status(429).json({ error: "prea_multe_cereri" });
      const c = mkChallenge("auth");
      noStore(res); res.json({ token: c.token, challenge: c.challenge, rpId: RP_ID });
    } catch (e) { res.status(500).json({ error: "eroare" }); }
  });

  r.post("/api/gazda/login/finalizeaza", jsonOnly, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "gz-login-fin", 20, 15))) return res.status(429).json({ error: "prea_multe_cereri" });
      const b = req.body || {};
      const ch = readChallenge(b.token, "auth");
      if (!ch || typeof b.id !== "string" || b.id.length > 1400) return res.status(400).json({ error: "autentificare_invalida" });
      const dev = (await dbPool.query(`SELECT d.id, d.owner_id, d.public_key, d.sign_count, o.email FROM gazda_devices d JOIN accommodation_owners o ON o.id = d.owner_id WHERE d.cred_id = $1 AND d.kind = 'passkey' AND d.revoked_at IS NULL`, [b.id])).rows[0];
      if (!dev) return res.status(400).json({ error: "autentificare_invalida" });
      let newCount;
      try {
        checkClientData(fromB64u(b.clientDataJSON), "webauthn.get", ch.ch);
        const adBuf = fromB64u(b.authenticatorData);
        const ad = parseAuthData(adBuf);
        if (!ad.rpIdHash.equals(sha256(RP_ID)) || !(ad.flags & 0x01) || !(ad.flags & 0x04)) throw new Error("flags");
        const key = crypto.createPublicKey({ key: JSON.parse(dev.public_key), format: "jwk" });
        const data = Buffer.concat([adBuf, sha256(fromB64u(b.clientDataJSON))]);
        if (!crypto.verify("sha256", data, { key, dsaEncoding: "der" }, fromB64u(b.signature))) throw new Error("sig");
        const prev = Number(dev.sign_count) || 0;
        if ((prev > 0 || ad.signCount > 0) && ad.signCount <= prev) throw new Error("clona");
        newCount = ad.signCount;
      } catch (e) { return res.status(400).json({ error: "autentificare_invalida" }); }
      if (!(await L.ownerStillExists(dev.owner_id))) return res.status(400).json({ error: "autentificare_invalida" });
      await dbPool.query(`UPDATE gazda_devices SET sign_count = $2, last_used_at = now() WHERE id = $1::bigint`, [dev.id, newCount]);
      setGz(res, { ownerId: dev.owner_id, email: dev.email || "", did: Number(dev.id), auth: Date.now() });
      await logEv(dev.owner_id, dev.id, "login");
      noStore(res); res.json({ ok: true });
    } catch (e) { console.error("gazda login fin:", e.message); res.status(500).json({ error: "eroare" }); }
  });


  // ---------- PIN (alternativă pentru telefoane fără Face ID / amprentă) ----------
  // Dispozitivul primește un secret aleator păstrat în aplicație + gazda alege un PIN de 6 cifre.
  // Intrarea cere ambele (ceva ce ai + ceva ce știi). După 5 PIN-uri greșite dispozitivul se blochează și trebuie reactivat.
  const PIN_MAX_FAILS = 5;
  const weakPin = (p) => !/^\d{6}$/.test(p) || /^(\d)\1{5}$/.test(p) || "0123456789876543210".includes(p);
  const hashPin = (pin, salt) => crypto.scryptSync(pin, salt, 32).toString("hex");
  const CODE_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const newCode = () => Array.from(crypto.randomBytes(8), (b) => CODE_ALPHA[b % 32]).join("");

  // cod de activare de unică folosință, afișat în cont (pentru aplicația instalată pe ecranul principal)
  r.post("/api/gazda/cod/creeaza", ownerOnly, jsonOnly, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "gz-code", 10, 60))) return res.status(429).json({ error: "prea_multe_cereri" });
      const oid = req.accommodationOwner.ownerId;
      const code = newCode();
      await dbPool.query(`DELETE FROM gazda_codes WHERE owner_id = $1::integer AND (used_at IS NOT NULL OR expires_at < now())`, [oid]);
      await dbPool.query(`INSERT INTO gazda_codes (code_hash, owner_id, expires_at) VALUES ($1,$2,now() + interval '10 minutes')`, [sha256(code).toString("hex"), oid]);
      noStore(res); res.json({ code, minutes: 10 });
    } catch (e) { console.error("gazda cod:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  r.post("/api/gazda/pin/inrolare", jsonOnly, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "gz-pin-reg", 15, 15))) return res.status(429).json({ error: "prea_multe_cereri" });
      const b = req.body || {};
      const pin = String(b.pin || "");
      if (weakPin(pin)) return res.status(400).json({ error: "pin_slab" });
      let oid = null, email = "", role = "owner", lids = null, codeLabel = null;
      const own = L.getAccommodationOwnerSession(req);
      if (own && (await L.ownerStillExists(own.ownerId))) { oid = own.ownerId; email = own.email || ""; }
      if (!oid) {
        const g = await readGz(req);
        if (g && g.role === "owner" && g.auth && Date.now() - g.auth <= FRESH_MS) { oid = g.ownerId; email = g.email || ""; }
      }
      if (!oid && typeof b.code === "string" && /^[A-Za-z2-9]{8}$/.test(b.code.trim())) {
        const u = await dbPool.query(`UPDATE gazda_codes SET used_at = now() WHERE code_hash = $1 AND used_at IS NULL AND expires_at > now() RETURNING owner_id, role, listing_ids, label`, [sha256(b.code.trim().toUpperCase()).toString("hex")]);
        if (u.rows.length && (await L.ownerStillExists(u.rows[0].owner_id))) {
          oid = u.rows[0].owner_id;
          if (u.rows[0].role === "staff") { role = "staff"; lids = (u.rows[0].listing_ids || []).map(Number); codeLabel = u.rows[0].label; }
          email = ((await dbPool.query(`SELECT email FROM accommodation_owners WHERE id = $1::integer`, [oid])).rows[0] || {}).email || "";
        }
      }
      if (!oid) return res.status(401).json({ error: "cod_invalid" });
      const n = (await dbPool.query(`SELECT count(*)::int AS n FROM gazda_devices WHERE owner_id = $1::integer AND revoked_at IS NULL`, [oid])).rows[0].n;
      if (n >= MAX_DEVICES) return res.status(409).json({ error: "dispozitiv_limita" });
      const devId = b64u(crypto.randomBytes(18)), secret = b64u(crypto.randomBytes(32)), salt = crypto.randomBytes(16).toString("hex");
      const label = String(codeLabel || b.label || "Telefon").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 40) || "Telefon";
      const ins = await dbPool.query(`INSERT INTO gazda_devices (owner_id, cred_id, public_key, sign_count, label, kind, secret_hash, pin_hash, role, listing_ids) VALUES ($1,$2,'',0,$3,'pin',$4,$5,$6,$7) RETURNING id`,
        [oid, devId, label, sha256(secret).toString("hex"), salt + ":" + hashPin(pin, salt), role, lids]);
      setGz(res, { ownerId: oid, email, did: Number(ins.rows[0].id), auth: Date.now() });
      await logEv(oid, ins.rows[0].id, "enroll_pin");
      noStore(res); res.json({ ok: true, deviceId: devId, secret });
    } catch (e) { console.error("gazda pin reg:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  r.post("/api/gazda/personal/cod", jsonOnly, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "gz-staff-code", 10, 60))) return res.status(429).json({ error: "prea_multe_cereri" });
      let oid = null;
      const own = L.getAccommodationOwnerSession(req);
      if (own && (await L.ownerStillExists(own.ownerId))) oid = own.ownerId;
      if (!oid) {
        const g = await readGz(req);
        if (g && g.role === "owner") {
          if (!g.auth || Date.now() - g.auth > FRESH_MS) return res.status(401).json({ error: "reautentificare" });
          oid = g.ownerId;
        }
      }
      if (!oid) return res.status(401).json({ error: "sesiune" });
      const b = req.body || {};
      const label = String(b.label || "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 40);
      if (label.length < 2) return res.status(400).json({ error: "date_invalide" });
      const want = Array.isArray(b.listings) ? b.listings.map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 30) : [];
      const own2 = (await dbPool.query(`SELECT l.id FROM accommodation_listings l JOIN booking_settings s ON s.listing_id = l.id WHERE l.owner_id = $1::integer AND s.bookings_enabled`, [oid])).rows.map((x) => Number(x.id));
      const lids = want.length ? want.filter((n) => own2.includes(n)) : own2;
      if (!lids.length) return res.status(400).json({ error: "date_invalide" });
      const n = (await dbPool.query(`SELECT count(*)::int AS n FROM gazda_devices WHERE owner_id = $1::integer AND revoked_at IS NULL`, [oid])).rows[0].n;
      if (n >= MAX_DEVICES) return res.status(409).json({ error: "dispozitiv_limita" });
      const code = newCode();
      await dbPool.query(`INSERT INTO gazda_codes (code_hash, owner_id, expires_at, role, listing_ids, label) VALUES ($1,$2,now() + interval '30 minutes',$3,$4,$5)`, [sha256(code).toString("hex"), oid, "staff", lids, label]);
      await logEv(oid, null, "staff_code");
      noStore(res); res.json({ code, minutes: 30 });
    } catch (e) { console.error("gazda staff cod:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  r.post("/api/gazda/pin/login", jsonOnly, async (req, res) => {
    try {
      if (!(await L.checkRateLimit(ipKey(req), "gz-pin-login", 30, 15))) return res.status(429).json({ error: "prea_multe_cereri" });
      const b = req.body || {};
      if (typeof b.deviceId !== "string" || typeof b.secret !== "string" || b.deviceId.length > 64 || b.secret.length > 64) return res.status(400).json({ error: "autentificare_invalida" });
      const d = (await dbPool.query(`SELECT d.id, d.owner_id, d.secret_hash, d.pin_hash, d.pin_fails, o.email FROM gazda_devices d JOIN accommodation_owners o ON o.id = d.owner_id WHERE d.cred_id = $1 AND d.kind = 'pin' AND d.revoked_at IS NULL`, [b.deviceId])).rows[0];
      if (!d || !safeEq(sha256(b.secret).toString("hex"), d.secret_hash)) return res.status(400).json({ error: "autentificare_invalida" });
      const [salt, h] = String(d.pin_hash).split(":");
      if (!safeEq(hashPin(String(b.pin || ""), salt), h)) {
        const f = await dbPool.query(`UPDATE gazda_devices SET pin_fails = pin_fails + 1, revoked_at = CASE WHEN pin_fails + 1 >= $2 THEN now() ELSE revoked_at END WHERE id = $1::bigint RETURNING pin_fails`, [d.id, PIN_MAX_FAILS]);
        const fails = f.rows[0] ? Number(f.rows[0].pin_fails) : 1;
        if (fails >= PIN_MAX_FAILS) { devCache.delete(Number(d.id)); await logEv(d.owner_id, d.id, "pin_blocked"); return res.status(423).json({ error: "pin_blocat" }); }
        return res.status(400).json({ error: "pin_gresit", ramase: PIN_MAX_FAILS - fails });
      }
      await dbPool.query(`UPDATE gazda_devices SET pin_fails = 0, last_used_at = now() WHERE id = $1::bigint`, [d.id]);
      setGz(res, { ownerId: d.owner_id, email: d.email || "", did: Number(d.id), auth: Date.now() });
      await logEv(d.owner_id, d.id, "login_pin");
      noStore(res); res.json({ ok: true });
    } catch (e) { console.error("gazda pin login:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  // ---------- rute cu sesiune de dispozitiv ----------
  const gzAuth = async (req, res, next) => {
    const g = await readGz(req).catch(() => null);
    if (!g) return res.status(401).json({ error: "sesiune" });
    req.gz = g; next();
  };

  const ownerRole = (req, res, next) => (req.gz.role === "staff" ? res.status(403).json({ error: "interzis" }) : next());
  const fresh = (req, res, next) => (!req.gz.auth || Date.now() - req.gz.auth > FRESH_MS ? res.status(401).json({ error: "reautentificare" }) : next());
  r.get("/api/gazda/eu", gzAuth, async (req, res) => {
    try {
      let ls = (await dbPool.query(`SELECT l.id, l.name FROM accommodation_listings l JOIN booking_settings s ON s.listing_id = l.id WHERE l.owner_id = $1::integer AND s.bookings_enabled ORDER BY l.name`, [req.gz.ownerId])).rows;
      if (req.gz.role === "staff" && req.gz.lids.length) ls = ls.filter((x) => req.gz.lids.includes(Number(x.id)));
      noStore(res); res.json({ email: req.gz.role === "staff" ? "" : (req.gz.email || ""), role: req.gz.role, listings: ls.map((x) => ({ id: x.id, name: x.name })) });
    } catch (e) { console.error("gazda eu:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  r.post("/api/gazda/iesire", jsonOnly, (req, res) => { clearGz(res); noStore(res); res.json({ ok: true }); });

  r.get("/api/gazda/dispozitive", gzAuth, ownerRole, async (req, res) => {
    try {
      const rows = (await dbPool.query(`SELECT id, label, kind, role, to_char(created_at,'YYYY-MM-DD') AS c, to_char(last_used_at,'YYYY-MM-DD HH24:MI') AS u FROM gazda_devices WHERE owner_id = $1::integer AND revoked_at IS NULL ORDER BY id`, [req.gz.ownerId])).rows;
      noStore(res); res.json({ devices: rows.map((x) => ({ id: Number(x.id), label: x.label, kind: x.kind || 'passkey', role: x.role || 'owner', created: x.c, last_used: x.u || "-", current: Number(x.id) === Number(req.gz.did) })) });
    } catch (e) { res.status(500).json({ error: "eroare" }); }
  });

  r.post("/api/gazda/dispozitive/:did/revoca", jsonOnly, gzAuth, ownerRole, async (req, res) => {
    try {
      if (!req.gz.auth || Date.now() - req.gz.auth > FRESH_MS) return res.status(401).json({ error: "reautentificare" });
      const did = toId(req.params.did);
      if (!did) return res.status(404).json({ error: "negasit" });
      const u = await dbPool.query(`UPDATE gazda_devices SET revoked_at = now() WHERE id = $1::bigint AND owner_id = $2::integer AND revoked_at IS NULL RETURNING id`, [did, req.gz.ownerId]);
      if (!u.rows.length) return res.status(404).json({ error: "negasit" });
      devCache.delete(did);
      if (did === Number(req.gz.did)) clearGz(res);
      await logEv(req.gz.ownerId, req.gz.did, "revoke");
      noStore(res); res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: "eroare" }); }
  });

  // „Am camere libere în seara asta”: același mecanism ca butonul din „Proprietățile mele” (aceleași coloane; expiră singur la miezul nopții)
  r.post("/api/gazda/liber-diseara", jsonOnly, gzAuth, async (req, res) => {
    try {
      const b = req.body || {};
      const lid = toId(b.listing);
      if (!lid) return res.status(404).json({ error: "negasit" });
      if (req.gz.role === "staff" && req.gz.lids.length && !req.gz.lids.includes(lid)) return res.status(404).json({ error: "negasit" });
      const rooms = Number.isInteger(b.rooms) && b.rooms > 0 && b.rooms < 1000 ? b.rooms : null;
      const u = b.on === true
        ? await dbPool.query(`UPDATE accommodation_listings SET available_date = (now() AT TIME ZONE 'Europe/Bucharest')::date, available_rooms = $3 WHERE id = $1::integer AND owner_id = $2::integer AND status = 'approved' RETURNING id`, [lid, req.gz.ownerId, rooms])
        : await dbPool.query(`UPDATE accommodation_listings SET available_date = NULL, available_rooms = NULL WHERE id = $1::integer AND owner_id = $2::integer AND status = 'approved' RETURNING id`, [lid, req.gz.ownerId]);
      if (!u.rows.length) return res.status(404).json({ error: "negasit" });
      await logEv(req.gz.ownerId, req.gz.did, b.on === true ? "free_tonight_on" : "free_tonight_off", lid);
      noStore(res); res.json({ ok: true });
    } catch (e) { console.error("gazda liber diseara:", e.message); res.status(500).json({ error: "eroare" }); }
  });

  require("./bookings-gazda-notify").mount(r, { jsonOnly, noStore, gzAuth, ownerRole, fresh, toId, logEv });

  // ---------- ecranul „Azi” ----------
  r.get("/api/gazda/azi", gzAuth, async (req, res) => {
    try {
      const lid = toId(req.query.listing);
      if (!lid) return res.status(404).json({ error: "negasit" });
      if (req.gz.role === "staff" && req.gz.lids.length && !req.gz.lids.includes(lid)) return res.status(404).json({ error: "negasit" });
      const ok = (await dbPool.query(`SELECT 1 FROM accommodation_listings l JOIN booking_settings s ON s.listing_id = l.id WHERE l.id = $1::integer AND l.owner_id = $2::integer AND s.bookings_enabled`, [lid, req.gz.ownerId])).rows[0];
      if (!ok) return res.status(404).json({ error: "negasit" });
      const today = "(now() AT TIME ZONE 'Europe/Bucharest')::date";
      const map = (x) => ({ id: x.id, status: x.status, check_in: x.ci, check_out: x.co, guests: x.guests, total_bani: x.total_bani, guest_name: x.guest_name, guest_phone: x.guest_phone, pay_scheme: x.pay_scheme || "direct", pay_status: x.pay_status || "none" });
      const sel = `SELECT r.id, r.status, r.guests, r.total_bani, r.guest_name, r.guest_phone, r.pay_scheme, r.pay_status, to_char(r.check_in,'YYYY-MM-DD') AS ci, to_char(r.check_out,'YYYY-MM-DD') AS co FROM booking_reservations r WHERE r.listing_id = $1 AND r.status = 'confirmed'`;
      const arrToday = (await dbPool.query(`${sel} AND r.check_in = ${today} ORDER BY r.id`, [lid])).rows.map(map);
      const soon = (await dbPool.query(`${sel} AND r.check_in > ${today} AND r.check_in <= ${today} + 7 ORDER BY r.check_in, r.id`, [lid])).rows.map(map);
      const inHouse = (await dbPool.query(`${sel} AND r.check_in <= ${today} AND r.check_out > ${today} ORDER BY r.check_out, r.id`, [lid])).rows.map(map);
      const depToday = (await dbPool.query(`${sel} AND r.check_out = ${today} ORDER BY r.id`, [lid])).rows.map(map);
      const occ = (await dbPool.query(`SELECT count(DISTINCT day)::int AS n FROM booking_calendar_days WHERE listing_id = $1 AND status IN (2,4) AND day >= ${today} AND day < ${today} + 30`, [lid])).rows[0];
      // camere: libere / ocupate în seara asta și mâine (0 liber, 1 închis de gazdă, 2 platformă, 3 în rezervare, 4 rezervat)
      const us = (await dbPool.query(`SELECT unit_no, name FROM booking_units WHERE listing_id = $1 AND active ORDER BY sort_order, unit_no`, [lid])).rows;
      const dd = (await dbPool.query(`SELECT unit_id, status, (day = ${today}) AS is_today FROM booking_calendar_days WHERE listing_id = $1 AND day >= ${today} AND day <= ${today} + 1 AND NOT (status = 3 AND blocked_until < now())`, [lid])).rows;
      const units = us.length ? us.map((u) => ({ unit_no: Number(u.unit_no), name: u.name })) : [{ unit_no: 0, name: "Toată proprietatea" }];
      const stOf = (u, today_) => { const f = dd.find((x) => !!x.is_today === today_ && (Number(x.unit_id) === u.unit_no || (us.length && Number(x.unit_id) === 0))); return f ? Number(f.status) : 0; };
      const rooms = units.map((u) => ({ unit_no: u.unit_no, name: u.name, tonight: stOf(u, true), tomorrow: stOf(u, false) }));
      const ft = (await dbPool.query(`SELECT (available_date::date = ${today}) AS on, available_rooms, (status = 'approved') AS approved FROM accommodation_listings WHERE id = $1::integer`, [lid])).rows[0] || {};
      const free_tonight = { on: !!ft.on, rooms: ft.available_rooms || null, approved: !!ft.approved };
      const icalN = (await dbPool.query(`SELECT count(*)::int AS n FROM booking_ical_feeds WHERE listing_id = $1 AND import_url IS NOT NULL`, [lid])).rows[0];
      const ical_missing = !icalN || icalN.n === 0;
      const alerts = [];
      const rf = (await dbPool.query(`SELECT guest_name FROM booking_reservations WHERE listing_id = $1 AND status = 'confirmed' AND pay_status = 'rest_failed'`, [lid])).rows;
      rf.forEach((x) => alerts.push("Restul de plată al lui " + x.guest_name + " nu a putut fi încasat; turistul are 48 de ore să plătească."));
      const fe = (await dbPool.query(`SELECT platform FROM booking_ical_feeds WHERE listing_id = $1 AND import_url IS NOT NULL AND last_status = 'error'`, [lid])).rows;
      fe.forEach((x) => alerts.push("Sincronizarea cu " + x.platform + " are eroare. Verifică linkul în cont."));
      const cf = (await dbPool.query(`SELECT count(*)::int AS n FROM booking_conflicts WHERE listing_id = $1 AND resolved_at IS NULL`, [lid])).rows[0];
      if (cf && cf.n > 0) alerts.push(cf.n + " zi(le) apar ocupate și pe altă platformă, dar sunt deja rezervate la tine. Verifică și anulează de unde e cazul.");
      noStore(res);
      if (req.gz.role === "staff") { const hide = (a) => a.map((x) => ({ ...x, total_bani: 0, pay_scheme: "direct", pay_status: "none" })); return res.json({ arrivals_today: hide(arrToday), arrivals_soon: hide(soon), in_house: hide(inHouse), departures_today: hide(depToday), occupied_30: occ ? occ.n : 0, rooms, free_tonight, alerts: [] }); }
      res.json({ arrivals_today: arrToday, arrivals_soon: soon, in_house: inHouse, departures_today: depToday, occupied_30: occ ? occ.n : 0, rooms, free_tonight, alerts, ical_missing });
    } catch (e) { console.error("gazda azi:", e.message); res.status(500).json({ error: "eroare" }); }
  });
}

module.exports = { mount, cborDecode, parseAuthData, coseToJwk, RP_ID, ORIGIN };

// Pagina „Setări plăți” din contul proprietarului (/cont/plati): conectarea contului Stripe (Connect Express), stările
// încărcare / conectat / întrerupt, întrebări frecvente. Datele vin din /api/rezervari/plati/stare (bookings-pay.js).
// Scriptul din pagină stă într-un template literal: fără backticks și fără ${ în codul clientului.
"use strict";
const L = require("./logic");

const CSS = `
.pc-wrap{max-width:900px;margin:0 auto;color:#1a1f35}
.pc-wrap [hidden]{display:none !important}
.pc-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 18px}
.pc-head h1{margin:0;font-size:28px;font-weight:800}
.pc-badge{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:5px 13px;font-weight:700;font-size:13.5px;border:1.5px solid}
.pc-badge i{width:8px;height:8px;border-radius:50%;display:inline-block}
.pc-b-off{background:#fff3e8;color:#9a4a12;border-color:#f6c9a4}.pc-b-off i{background:#F0813A}
.pc-b-on{background:#e4f6ec;color:#1f7a45;border-color:#a9dfc0}.pc-b-on i{background:#2e9e5b}
.pc-b-wait{background:#eaf0ff;color:#27458f;border-color:#b7c8f2}.pc-b-wait i{background:#4a6fd6}
.pc-alert{display:flex;gap:12px;align-items:flex-start;background:#fff8e6;border:1.5px solid #f0d28a;color:#6b4a00;border-radius:14px;padding:14px 18px;margin-bottom:16px;font-weight:600}
.pc-alert.pc-err{background:#fdecec;border-color:#f0b4b4;color:#8a1f1f}
.pc-alert .pc-x{margin-left:auto;border:0;background:transparent;color:inherit;cursor:pointer;font-size:22px;line-height:1;padding:0 4px}
.pc-card{background:#fff;border:1.5px solid #dfe5ef;border-radius:20px;padding:30px;box-shadow:0 6px 24px rgba(20,26,46,.05)}
.pc-hero{display:flex;gap:26px;flex-wrap:wrap;align-items:center}
.pc-ico{flex:0 0 84px;width:84px;height:84px;border-radius:22px;background:#eeedff;color:#4a43d6;display:flex;align-items:center;justify-content:center}
.pc-hero-b{flex:1 1 340px;min-width:0}
.pc-hero h2{margin:0 0 10px;font-size:21px;font-weight:800}
.pc-hero p{margin:0 0 20px;font-size:16px;color:#3b4259}
.pc-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;border:0;cursor:pointer;font-family:inherit;text-decoration:none;color:#fff;background:#635BFF;font-weight:700;font-size:16.5px;padding:15px 26px;border-radius:12px;box-shadow:0 6px 18px rgba(99,91,255,.35)}
.pc-btn[disabled]{opacity:.6;cursor:default}
.pc-btn-or{background:#F0813A;box-shadow:0 6px 18px rgba(240,129,58,.35);font-weight:800}
.pc-trust{display:flex;flex-wrap:wrap;gap:8px 22px;margin-top:18px;font-size:13.5px;color:#4b5470;font-weight:600}
.pc-trust span{display:inline-flex;gap:7px;align-items:center}
.pc-h2{margin:30px 0 8px;font-size:21px;font-weight:800}
.pc-p{margin:0 0 14px;font-size:15.5px;color:#3b4259}
.pc-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.pc-step{background:#fff;border:1.5px solid #dfe5ef;border-radius:14px;padding:16px;display:flex;gap:12px}
.pc-step b.n{flex:0 0 30px;height:30px;border-radius:50%;background:#F0813A;color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}
.pc-step div{font-size:14px;color:#4b5470}.pc-step strong{display:block;color:#1a1f35;font-size:15px}
.pc-ok{background:#e4f6ec;border:1.5px solid #a9dfc0;border-radius:14px;padding:14px 18px;margin-top:12px;color:#1d4d33;font-size:15px}
.pc-faq{display:flex;flex-direction:column;gap:8px}
.pc-faq details{background:#fff;border:1.5px solid #dfe5ef;border-radius:12px;padding:0 16px}
.pc-faq summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px 0;font-weight:800;font-size:15px}
.pc-faq summary::-webkit-details-marker{display:none}
.pc-faq summary:after{content:"\\25BE";color:#6b7390;transition:transform .15s}
.pc-faq details[open] summary:after{transform:rotate(180deg)}
.pc-faq p{margin:0 0 14px;color:#3b4259;font-size:14.5px}
.pc-center{text-align:center;padding:44px 28px}
.pc-check{width:96px;height:96px;border-radius:50%;background:#e4f6ec;color:#2e9e5b;display:flex;align-items:center;justify-content:center;margin:0 auto 22px}
.pc-center h2{margin:0 0 8px;font-size:24px;font-weight:800}
.pc-id{font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700;background:#f4f6fa;border-radius:6px;padding:2px 8px}
.pc-small{margin:20px 0 0;font-size:13.5px;color:#6b7390}
.pc-small a,.pc-small button{color:#c2561a;font-weight:700;background:none;border:0;padding:0;font:inherit;font-weight:700;cursor:pointer;text-decoration:underline}
.pc-spin{width:46px;height:46px;border-radius:50%;border:5px solid #e3e6f5;border-top-color:#635BFF;margin:0 auto 18px;animation:pcs 0.9s linear infinite}
@keyframes pcs{to{transform:rotate(360deg)}}
@media (max-width:560px){.pc-card{padding:22px 18px}.pc-head h1{font-size:24px}.pc-btn{width:100%}}
`;

const ICON_BANK = `<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/></svg>`;
const ICON_OK = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2e9e5b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>`;
const ICON_CHECK_BIG = `<svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>`;
const ICON_ARROW = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;

function texts(lang) {
  const T = (ro, en) => (lang === "en" ? en : ro);
  return {
    T,
    faq: [
      [T("Ce este Stripe și de ce îl folosim?", "What is Stripe and why do we use it?"),
        T("Stripe este una dintre cele mai sigure platforme de plăți online din lume, folosită de milioane de afaceri. O folosim ca să poți primi banii rezervărilor direct în contul tău bancar, fără intermediari manuali și fără să-ți dai datele bancare nimănui altcuiva.",
          "Stripe is one of the safest online payment platforms in the world, used by millions of businesses. We use it so you can receive booking money straight into your bank account, with no manual intermediaries and without handing your bank details to anyone else.")],
      [T("Cum ajung banii la mine?", "How does the money reach me?"),
        T("Turistul plătește pe site, cu autentificare 3D Secure. Stripe împarte plata: comisionul platformei rămâne la noi, iar restul se virează în contul tău Stripe la 24 de ore după check-in, apoi automat în contul tău bancar (IBAN-ul salvat de tine). La fiecare virare primești un e-mail.",
          "The guest pays on the site with 3D Secure authentication. Stripe splits the payment: the platform commission stays with us and the rest is transferred to your Stripe account 24 hours after check-in, then automatically to your bank account (the IBAN you saved). You get an e-mail for every transfer.")],
      [T("Costă ceva conectarea?", "Does connecting cost anything?"),
        T("Nu. Conectarea este gratuită, fără taxe de înregistrare sau abonament. Comisionul platformei se reține doar din rezervările plătite online.",
          "No. Connecting is free, with no sign-up fees or subscription. The platform commission is only charged on bookings paid online.")],
      [T("Sunt datele mele în siguranță?", "Is my data safe?"),
        T("Da. Nu stocăm niciodată CNP-ul, actele sau datele tale bancare: totul rămâne pe serverele Stripe, care respectă standardul de securitate PCI-DSS nivel 1. Noi primim doar confirmarea că ai un cont activ.",
          "Yes. We never store your ID number, documents or bank details: everything stays on Stripe's servers, which comply with the PCI-DSS level 1 security standard. We only receive confirmation that you have an active account.")],
      [T("Ce documente îmi cere Stripe?", "What documents does Stripe ask for?"),
        T("Datele firmei sau ale PFA-ului (sau datele tale personale, dacă nu ai firmă), un act de identitate și IBAN-ul în care vrei să primești banii. Stripe le verifică în câteva minute, uneori mai mult.",
          "Your company or sole-trader details (or your personal details if you have no company), an ID document and the IBAN where you want to be paid. Stripe usually verifies them within minutes, sometimes longer.")],
      [T("Am deja cont Stripe. Pot să-l folosesc?", "I already have a Stripe account. Can I use it?"),
        T("Poți folosi aceleași date ca la contul tău existent (firmă, IBAN). Stripe creează pentru platformă un cont de încasări separat, legat de OpeningHoursToday, și îți pre-completează ce poate.",
          "You can use the same details as your existing account (company, IBAN). Stripe creates a separate payout account linked to OpeningHoursToday for the platform and pre-fills what it can.")],
      [T("❓ Ce se întâmplă în cazul unei anulări sau al unui refuz de plată (Chargeback)?", "❓ What happens if a booking is cancelled or a payment is disputed (chargeback)?"),
        T("Platforma noastră gestionează centralizat toate anulările pentru a asigura o experiență corectă. Dacă un client anulează conform politicii tale, banii îi sunt returnați automat înainte de a fi transferați către tine. În cazul excepțional al unei dispute bancare (chargeback), echipa noastră va prelua investigația și va trimite dovezile către bancă (folosind protocoalele sigure 3D Secure active pe site). Conform contractului nostru, dacă disputa este pierdută din motive ce țin de calitatea serviciului oferit la locație, suma va fi reținută din balanța contului tău.",
          "Our platform handles all cancellations centrally to ensure a fair experience. If a guest cancels according to your policy, the money is refunded automatically before it is transferred to you. In the exceptional case of a bank dispute (chargeback), our team will take over the investigation and send the evidence to the bank (using the secure 3D Secure protocols active on the site). Under our agreement, if the dispute is lost for reasons related to the quality of the service provided at the property, the amount will be withheld from your account balance.")],
    ],
  };
}

function pageHtml(lang, nonce, email, req, live) {
  const { T, faq } = texts(lang);
  const E = L.escapeHtml;
  const faqHtml = faq.map((f, i) => `<details${i === 0 ? " open" : ""}><summary>${E(f[0])}</summary><p>${E(f[1])}</p></details>`).join("");
  const body = `<div class="pc-wrap">
<div class="pc-head"><h1>${T("Setări plăți", "Payment settings")}</h1><span id="pcBadge" class="pc-badge pc-b-off" hidden><i></i><span id="pcBadgeT"></span></span></div>
<div id="pcAlert" class="pc-alert" role="alert" hidden><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:0 0 22px;margin-top:1px"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg><div id="pcAlertT"></div><button type="button" class="pc-x" id="pcAlertX" aria-label="${T("Închide alerta", "Dismiss")}">×</button></div>
<div id="pcView"><section class="pc-card pc-center"><div class="pc-spin" aria-hidden="true"></div><div style="font-weight:700">${T("Se încarcă…", "Loading…")}</div></section></div>
<div id="pcInfo" hidden>
<h2 class="pc-h2">${T("Cum te înregistrezi? Simplu și în siguranță.", "How do you sign up? Simple and safe.")}</h2>
<p class="pc-p">${T("Procesul de conectare durează doar câteva momente și este gestionat integral de partenerul nostru financiar, Stripe. Iată ce se întâmplă din momentul în care începi:", "Connecting only takes a few moments and is handled entirely by our financial partner, Stripe. Here is what happens from the moment you start:")}</p>
<div class="pc-steps">
<div class="pc-step"><b class="n">1</b><div><strong>${T("Pagina securizată Stripe", "Stripe's secure page")}</strong>${T("Apeși butonul și ajungi pe pagina Stripe. Noi nu vedem parola sau datele tale.", "You press the button and land on Stripe's page. We never see your password or your details.")}</div></div>
<div class="pc-step"><b class="n">2</b><div><strong>${T("Ai cont? 10 secunde", "Have an account? 10 seconds")}</strong>${T("Introdu e-mailul și parola Stripe, confirmi conectarea și revii pe site.", "Enter your Stripe e-mail and password, confirm the connection and come back to the site.")}</div></div>
<div class="pc-step"><b class="n">3</b><div><strong>${T("Nu ai cont? Îl creezi pe loc", "No account? Create one on the spot")}</strong>${T("Completezi datele firmei / PFA, actul de identitate și IBAN-ul. Durează circa 3 minute.", "You fill in your company / sole-trader details, ID and IBAN. It takes about 3 minutes.")}</div></div>
</div>
<div class="pc-ok"><strong>${T("Gata de pornire!", "Ready to go!")}</strong> ${T("După finalizarea pasului 3, contul tău devine complet activ pe platformă. Vei putea primi rezervări pe loc, iar plățile de la turiști vor fi trimise direct în contul cu IBAN-ul salvat de tine, fără alte bătăi de cap administrative.", "After completing step 3 your account becomes fully active on the platform. You will be able to receive bookings instantly, and guest payments are sent straight to the account with the IBAN you saved, with no further administrative hassle.")}</div>
</div>
<h2 class="pc-h2">${T("Întrebări frecvente", "Frequently asked questions")}</h2>
<div class="pc-faq">${faqHtml}</div>
</div>`;
  const I = {
    live: !!live,
    bOff: T("Neconectat", "Not connected"), bOn: T("Conectat", "Connected"), bWait: T("În verificare", "Under review"),
    hTitle: T("Primește banii direct în contul tău bancar", "Get paid straight into your bank account"),
    hText: T("Pentru a putea primi banii direct în contul tău bancar instant în momentul în care un turist rezervă, folosim infrastructura securizată Stripe. Apasă butonul de mai jos pentru a-ți conecta contul curent sau pentru a crea unul nou în 3 minute.", "To receive money straight into your bank account the moment a guest books, we use Stripe's secure infrastructure. Press the button below to connect your existing account or create a new one in 3 minutes."),
    hBtn: T("Conectează contul prin Stripe", "Connect your account with Stripe"), hBtn2: T("Continuă conectarea", "Continue connecting"),
    t1: T("Gratuit, fără abonament", "Free, no subscription"), t2: T("Durează circa 3 minute", "Takes about 3 minutes"), t3: T("Nu stocăm datele tale bancare", "We never store your bank details"),
    opening: T("Se deschide pagina Stripe…", "Opening Stripe…"),
    okTitle: T("Contul tău Stripe este conectat cu succes", "Your Stripe account is connected"), okId: T("ID cont:", "Account ID:"),
    okBtn: T("Mergi la Panoul de Control", "Go to the Control Panel"), okSmall: T("Plățile turiștilor intră direct la tine, minus comisionul platformei.", "Guest payments go straight to you, minus the platform commission."), okLink: T("Deschide panoul Stripe", "Open the Stripe dashboard"),
    waitTitle: T("Stripe îți verifică datele", "Stripe is reviewing your details"), waitText: T("Ai trimis datele, iar Stripe le verifică. De obicei durează câteva minute; vei primi un e-mail când contul devine activ.", "You have submitted your details and Stripe is reviewing them. This usually takes a few minutes; you will get an e-mail when your account becomes active."), waitBtn: T("Reîncarcă starea", "Refresh status"),
    interrupted: T("Procesul de conectare a fost întrerupt. Te rugăm să încerci din nou pentru a putea primi plăți.", "The connection process was interrupted. Please try again so you can receive payments."),
    notLive: T("Plățile online nu sunt încă active pe platformă. Revino în curând.", "Online payments are not active on the platform yet. Please check back soon."),
    err: T("Nu am putut încărca starea contului. Încearcă din nou.", "We could not load your account status. Please try again."),
    errBtn: T("Reîncearcă", "Try again"),
    ok: ICON_OK, bank: ICON_BANK, check: ICON_CHECK_BIG, arrow: ICON_ARROW,
  };
  const js = `
var I = ${L.safeJson(I)};
var QS = new URLSearchParams(location.search).get('stare');
function $(id){ return document.getElementById(id); }
function api(m, u, b){
  return fetch(u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined, credentials: 'same-origin' })
    .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return { ok: r.ok, j: j }; }); });
}
function badge(kind){
  var b = $('pcBadge'); if (!kind) { b.hidden = true; return; }
  b.hidden = false; b.className = 'pc-badge ' + (kind === 'on' ? 'pc-b-on' : kind === 'wait' ? 'pc-b-wait' : 'pc-b-off');
  $('pcBadgeT').textContent = kind === 'on' ? I.bOn : kind === 'wait' ? I.bWait : I.bOff;
}
function alertMsg(text, err){ var a = $('pcAlert'); if (!text) { a.hidden = true; return; } $('pcAlertT').textContent = text; a.className = 'pc-alert' + (err ? ' pc-err' : ''); a.hidden = false; }
$('pcAlertX').onclick = function(){ alertMsg(''); };
function loading(text){ $('pcView').innerHTML = '<section class="pc-card pc-center"><div class="pc-spin" aria-hidden="true"></div><div style="font-weight:700"></div></section>'; $('pcView').querySelector('div[style]').textContent = text || ''; }
function connectCard(btnText){
  $('pcInfo').hidden = false;
  $('pcView').innerHTML = '<section class="pc-card"><div class="pc-hero"><div class="pc-ico">' + I.bank + '</div><div class="pc-hero-b"><h2></h2><p></p><button type="button" class="pc-btn" id="pcGo"></button></div></div>'
    + '<div class="pc-trust"><span>' + I.ok + '<b id="pcT1"></b></span><span>' + I.ok + '<b id="pcT2"></b></span><span>' + I.ok + '<b id="pcT3"></b></span></div></section>';
  var v = $('pcView');
  v.querySelector('h2').textContent = I.hTitle; v.querySelector('p').textContent = I.hText;
  $('pcGo').innerHTML = ''; $('pcGo').appendChild(document.createTextNode(btnText + ' ')); $('pcGo').insertAdjacentHTML('beforeend', I.arrow);
  $('pcT1').textContent = I.t1; $('pcT2').textContent = I.t2; $('pcT3').textContent = I.t3;
  $('pcGo').onclick = connect;
}
function connect(){
  alertMsg('');
  loading(I.opening);
  api('POST', '/api/rezervari/plati/cont', { from: 'plati' }).then(function(r){
    if (r.ok && r.j && r.j.url) { window.location.href = r.j.url; return; }
    alertMsg((r.j && r.j.error && String(r.j.error).indexOf(' ') > 0) ? r.j.error : I.err, true);
    connectCard(I.hBtn);
  }).catch(function(){ alertMsg(I.err, true); connectCard(I.hBtn); });
}
function connectedCard(accId){
  badge('on'); $('pcInfo').hidden = true;
  $('pcView').innerHTML = '<section class="pc-card pc-center"><div class="pc-check">' + I.check + '</div><h2></h2><p style="margin:0 0 24px;font-size:16px;color:#3b4259">(<span></span> <span class="pc-id"></span>)</p>'
    + '<a class="pc-btn pc-btn-or" href="/cont/rezervari"></a><p class="pc-small"><span></span> <button type="button" id="pcDash"></button></p></section>';
  var v = $('pcView');
  v.querySelector('h2').textContent = I.okTitle;
  var sp = v.querySelectorAll('p span'); sp[0].textContent = I.okId; sp[1].textContent = accId || '';
  v.querySelector('a.pc-btn').textContent = I.okBtn;
  v.querySelector('.pc-small span').textContent = I.okSmall; $('pcDash').textContent = I.okLink;
  $('pcDash').onclick = function(){
    $('pcDash').disabled = true;
    api('POST', '/api/rezervari/plati/panou', {}).then(function(r){ if (r.ok && r.j.url) window.location.href = r.j.url; else { $('pcDash').disabled = false; alertMsg(I.err, true); } }).catch(function(){ $('pcDash').disabled = false; });
  };
}
function waitCard(){
  badge('wait'); $('pcInfo').hidden = true;
  $('pcView').innerHTML = '<section class="pc-card pc-center"><div class="pc-spin" aria-hidden="true"></div><h2></h2><p style="margin:0 0 22px;font-size:16px;color:#3b4259"></p><button type="button" class="pc-btn" id="pcRef"></button></section>';
  var v = $('pcView'); v.querySelector('h2').textContent = I.waitTitle; v.querySelector('p').textContent = I.waitText; $('pcRef').textContent = I.waitBtn; $('pcRef').onclick = load;
}
function load(){
  loading('');
  if (!I.live) { badge('off'); $('pcView').innerHTML = ''; alertMsg(I.notLive, false); $('pcInfo').hidden = true; return; }
  api('GET', '/api/rezervari/plati/stare').then(function(r){
    var s = r.j || {};
    if (!r.ok || s.live === false) { badge(null); alertMsg(r.ok ? I.notLive : I.err, !r.ok); $('pcView').innerHTML = r.ok ? '' : '<p><button type="button" class="pc-btn" id="pcRetry"></button></p>'; if (!r.ok) { $('pcRetry').textContent = I.errBtn; $('pcRetry').onclick = load; } return; }
    if (s.connected && s.payouts_enabled) { alertMsg(''); connectedCard(s.account_id); }
    else if (s.connected && s.details_submitted) { alertMsg(''); waitCard(); }
    else { badge('off'); alertMsg((QS === 'revenit' || QS === 'reinnoit') ? I.interrupted : '', false); connectCard(s.connected ? I.hBtn2 : I.hBtn); }
    if (QS && window.history && history.replaceState) { history.replaceState(null, '', location.pathname); QS = null; }
  }).catch(function(){ badge(null); alertMsg(I.err, true); });
}
window.addEventListener('pageshow', function(e){ if (e.persisted) load(); });
load();
`;
  const nonceAttr = nonce ? ` nonce="${nonce}"` : "";
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>${E(T("Setări plăți", "Payment settings"))} — Opening Hours Today</title><link rel="stylesheet" href="/style.css">
<style>${L.accShellStyles()}${CSS}</style></head>
<body>
${L.accShellHeader(email, L.accLangSwitchHtml(req, lang, true), req)}
${L.accDrawerHtml("plati", email, lang)}
<main class="acc-shell-main">${body}</main>
<script${nonceAttr}>${L.accDrawerScript()}
${js}</script></body></html>`;
}

function mount(r, deps) {
  r.get("/cont/plati", L.accommodationGate, L.requireAccommodationOwner, (req, res) => {
    const nonce = L.generateNonce();
    res.set("Content-Security-Policy", L.buildCsp(nonce));
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "no-store");
    const lang = L.getAccLang(req, res);
    res.send(pageHtml(lang, nonce, req.accommodationOwner.email, req, deps && deps.live));
  });
}

module.exports = { mount, pageHtml, texts };

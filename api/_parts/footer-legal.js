// Bloc comun în subsolul site-ului: GDPR, Termeni, Cookie-uri, ANSPDCP, ANPC (sigla + SAL). Doar HTML cu stiluri inline.
"use strict";
function html(lang, opts) {
  const ro = lang === "ro";
  const A = (href, txt, ext) => `<a href="${href}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""} style="color:inherit;text-decoration:underline;text-underline-offset:3px">${txt}</a>`;
  const sal = ro ? "ANPC – Soluționarea Alternativă a Litigiilor (SAL)" : "ANPC – Alternative Dispute Resolution (SAL)";
  const links = [
    A("/politica-de-confidentialitate", ro ? "Politica de confidențialitate (GDPR)" : "Privacy Policy (GDPR)"),
    A("/termeni-si-conditii", ro ? "Termeni și condiții" : "Terms and Conditions"),
    A("/politica-de-confidentialitate#cookie-uri", ro ? "Politica de cookie-uri" : "Cookie Policy"),
    A("https://www.dataprotection.ro", "ANSPDCP (dataprotection.ro)", true),
    A("https://anpc.ro", "ANPC", true),
    A("/raportare-abuz", ro ? "Raportare abuz (DSA)" : "Report abuse (DSA)"),
  ];
  return `<div class="oht-legal-foot" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(128,128,128,.25);text-align:center;font-size:13px;line-height:1.9;color:var(--muted,#6B7280)">
    <div style="display:flex;flex-wrap:wrap;gap:4px 18px;justify-content:center">${links.map((l) => `<span>${l}</span>`).join("")}</div>
    <div style="margin-top:10px"><a href="/raportare-abuz" data-dsa-open rel="nofollow" style="color:inherit;text-decoration:none;font-size:12.5px;opacity:.85">🚩 ${ro ? "Raportează o problemă / Conținut ilegal" : "Report a problem / Illegal content"}</a><script src="/dsa-report.js" defer></script></div>
    <div style="margin-top:12px"><a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer" title="${sal}" style="display:inline-block;background:#fff;border-radius:10px;padding:8px 14px;border:1px solid rgba(128,128,128,.25)"><img src="/anpc-logo.svg" alt="${sal}" width="150" height="71" loading="lazy" style="display:block;width:150px;height:auto"></a></div>${opts && opts.copyright ? `
    <div style="margin-top:12px">${ro ? "Toate drepturile rezervate." : "All rights reserved."}<br>Copyright Opening <span style="color:var(--accent)">Hours Today</span>™</div>` : ""}
  </div>`;
}
// adresă de e-mail ascunsă de roboți: Base64 în HTML, decodată de /oe.js în browser; fără JS se vede „nume [at] domeniu [dot] eu”
const CONTACT = process.env.INBOX_CONTACT_EMAIL || "contact@opening-hours-today.eu";
const b64 = (x) => Buffer.from(String(x), "utf8").toString("base64");
const human = (a) => String(a).replace("@", " [at] ").replace(/\./g, " [dot] ");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
function mail(addr, o) { // link text = adresa; o.style opțional
  addr = addr || CONTACT; o = o || {};
  return `<a data-oe="${b64(addr)}" href="#" style="${esc(o.style || "color:var(--accent);font-weight:700")}">${esc(human(addr))}</a><script src="/oe.js" defer></script>`;
}
function mailButton(addr, label, cls) { // buton cu etichetă fixă; adresa vizibilă apare separat, cu mailText()
  addr = addr || CONTACT;
  return `<a class="${esc(cls || "")}" data-oe="${b64(addr)}" data-oe-label="1" href="#">${label}</a><script src="/oe.js" defer></script>`;
}
function mailText(addr) { return `<span data-oet="${b64(addr || CONTACT)}">${esc(human(addr || CONTACT))}</span><script src="/oe.js" defer></script>`; }
const OE_JS = `(function(){function d(){var a=document.querySelectorAll("a[data-oe]"),i,m;for(i=0;i<a.length;i++){try{m=atob(a[i].getAttribute("data-oe"));a[i].href="mailto:"+m;if(!a[i].hasAttribute("data-oe-label"))a[i].textContent=m;a[i].removeAttribute("data-oe");}catch(e){}}var s=document.querySelectorAll("span[data-oet]");for(i=0;i<s.length;i++){try{s[i].textContent=atob(s[i].getAttribute("data-oet"));s[i].removeAttribute("data-oet");}catch(e){}}}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",d);else d();})();`;
module.exports = { html, mail, mailButton, mailText, OE_JS, CONTACT };

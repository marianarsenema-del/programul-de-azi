// Pagina publică a cazării: perioade speciale (sărbători, sezoane), oferte și calendarul prețurilor pe zile.
// Funcții pure: primesc rândul din baza de date și întorc HTML. Nu ating baza de date.
"use strict";
const PP = require("./price-plan");

const PENSION = ["pensiune", "cabana", "aframe"];

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function parseTd(v) { if (!v) return {}; if (typeof v === "object") return v; try { return JSON.parse(v) || {}; } catch (e) { return {}; } }
const posNum = (v) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : null; };
const MONTHS_RO = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "nov", "dec"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// prețul de bază pe noapte (pentru calendar și tabele) și ce înseamnă el
function baseInfo(r, td, plan) {
  const hotel = r.type === "hotel_mic";
  const pr = posNum(r.price_per_room), pw = posNum(r.price_weekend), pp = posNum(r.price_per_property), ppw = posNum(r.price_property_weekend);
  if (hotel) {
    const prices = (Array.isArray(td.roomTypes) ? td.roomTypes : []).map((rt) => posNum(rt && rt.price)).filter(Boolean);
    const min = prices.length ? Math.min(...prices) : posNum(r.price_from);
    return { kind: "hotel", weekday: min, weekend: null, weekendPct: plan.weekendPct, hotel: true };
  }
  if (PENSION.includes(r.type)) {
    const mode = ["integral", "camere", "hibrid"].includes(td.rentalMode) ? td.rentalMode : (pr ? "camere" : "integral");
    if (mode === "integral") return { kind: "property", weekday: pp, weekend: ppw, hotel: false, mode };
    return { kind: "room", weekday: pr, weekend: pw, hotel: false, mode };
  }
  if (r.type === "apartament") return { kind: "property", weekday: pp || pr, weekend: ppw || pw, hotel: false, mode: "integral" };
  return null;
}
// pensiune în modul „hibrid”: cât costă toată pensiunea față de camerele luate separat
function wholeFactor(r, td) {
  if (!PENSION.includes(r.type) || td.rentalMode !== "hibrid") return null;
  const n = Array.isArray(td.bedrooms) ? td.bedrooms.length : 0, pr = posNum(r.price_per_room), pp = posNum(r.price_per_property);
  return n >= 2 && pr && pp ? { n, f: pp / (n * pr) } : null;
}

function build(r, opts) {
  const lang = opts.lang === "en" ? "en" : "ro";
  const L = (ro, en) => (lang === "en" ? en : ro);
  const today = opts.today;
  const cur = r.price_currency || "RON";
  const hotel = r.type === "hotel_mic";
  const td = parseTd(r.type_details);
  const plan = PP.planOf(r, hotel);
  const MO = lang === "en" ? MONTHS_EN : MONTHS_RO;
  const fd = (s, y) => { const p = s.split("-"); return `${+p[2]} ${MO[+p[1] - 1]}${y ? " " + p[0] : ""}`; };
  const range = (a, b) => (a === b ? fd(a, true) : (a.slice(0, 4) === b.slice(0, 4) ? `${fd(a)} – ${fd(b, true)}` : `${fd(a, true)} – ${fd(b, true)}`));
  const money = (n) => { const v = Math.round(Number(n) * 100) / 100; return `<strong data-price="${v}" data-currency="${esc(cur)}">${v} ${esc(cur)}</strong>`; };
  const base = baseInfo(r, td, plan);
  const upcoming = PP.upcomingSeasons(plan, today);
  const wf = wholeFactor(r, td);

  // nopți minime
  const rulesHtml = (plan.minNights && plan.minNights > 1
    ? `<p><strong>${L("Ședere minimă:", "Minimum stay:")}</strong> ${plan.minNights} ${L("nopți", "nights")}</p>` : "")
    + (hotel && plan.weekendPct > 0 ? `<p><strong>${L("Weekend (vineri și sâmbătă):", "Weekend (Friday and Saturday):")}</strong> +${plan.weekendPct}% ${L("față de prețul camerei", "on top of the room price")}</p>` : "");

  // tabelul perioadelor speciale
  let seasonsHtml = "";
  if (upcoming.length && base && base.weekday) {
    const whole = !!wf;
    const head = hotel
      ? `<span class="pps-c">${L("Față de prețul camerei", "Vs. room price")}</span><span class="pps-c">${L("Camera cea mai ieftină", "Cheapest room")}</span>`
      : `<span class="pps-c">${base.kind === "room" ? L(`${esc(cur)} / noapte<br>pe cameră`, `${esc(cur)} / night<br>per room`) : L(`${esc(cur)} / noapte`, `${esc(cur)} / night`)}</span>${whole ? `<span class="pps-c pps-w">${L(`${esc(cur)} / noapte<br>toată pensiunea`, `${esc(cur)} / night<br>whole property`)}</span>` : ""}`;
    const rows = upcoming.map((s) => {
      const nm = `<div class="pps-n"><strong>${esc(s.name)}</strong><span>${range(s.from, s.to)}${s.minNights ? ` · ${L("minim", "min.")} ${s.minNights} ${L("nopți", "nights")}` : ""}</span></div>`;
      if (hotel) {
        const pct = Number(s.pct) || 0;
        return `<div class="pps-r">${nm}<span class="pps-c"><b>${pct > 0 ? "+" : ""}${pct}%</b></span><span class="pps-c">${money(base.weekday * (100 + pct) / 100)}</span></div>`;
      }
      return `<div class="pps-r">${nm}<span class="pps-c"><b>${money(s.price)}</b></span>${whole ? `<span class="pps-c pps-w"><b>${money(Math.round(wf.n * s.price * wf.f))}</b></span>` : ""}</div>`;
    }).join("");
    seasonsHtml = `<div class="trip-toolkit-card pps-card" style="margin-top:12px">
      <h3 class="trip-toolkit-title">${L("Sărbători și sezon de vârf", "Holidays and peak season")}</h3>
      <div class="pps-hd"><span class="pps-n">${L("Perioadă", "Period")}</span>${head}</div>
      ${rows}
      <p class="pps-note">${hotel ? L("Procentul se aplică la prețul fiecărui tip de cameră.", "The percentage applies to each room type's price.") : L("Prețuri pe noapte.", "Prices per night.")} ${L("În aceste perioade nu se mai adaugă suplimentul de weekend.", "The weekend supplement is not added in these periods.")}</p>
    </div>`;
  }

  // oferte active
  const offers = PP.activeOffers(plan, today);
  const offersHtml = offers.length ? `
      <div class="trip-toolkit-card pps-offers" style="margin-top:12px;border-color:var(--accent)">
        <h3 class="trip-toolkit-title">${L("🎁 Oferte speciale", "🎁 Special offers")}</h3>
        <ul class="acc-offers-list">
          ${offers.map((o) => `<li>${esc(o.text)}${o.until ? ` <span class="pps-until">(${L("până la", "until")} ${fd(o.until, true)})</span>` : ""}</li>`).join("")}
        </ul>
      </div>` : "";

  // calendarul prețurilor (doar când avem un preț de bază)
  let calendarHtml = "", script = "";
  if (base && base.weekday) {
    const seasons = PP.calendarSeasons(plan, today, 400).map((s) => ({ from: s.from, to: s.to, price: s.price, pct: s.pct }));
    const data = {
      today, cur, hotel: !!base.hotel, weekday: base.weekday, weekend: base.weekend, weekendPct: base.weekendPct, seasons,
      mo: lang === "en" ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] : ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"],
      dw: lang === "en" ? ["M", "T", "W", "T", "F", "S", "S"] : ["L", "M", "M", "J", "V", "S", "D"],
    };
    const what = base.kind === "hotel" ? L("camera cea mai ieftină, pe noapte", "cheapest room, per night") : (base.kind === "room" ? L("pe cameră, pe noapte", "per room, per night") : L("pe noapte", "per night"));
    calendarHtml = `<div class="trip-toolkit-card pps-cal" id="ppsCal" style="margin-top:12px">
      <div class="pps-cal-top"><h3 class="trip-toolkit-title" style="margin:0">${L("Prețul pe zile", "Price by day")}</h3><span class="pps-note" style="margin:0">${esc(what)}</span></div>
      <div class="pps-cal-nav"><button type="button" id="ppsPrev" aria-label="${L("Luna precedentă", "Previous month")}">‹</button><b id="ppsTitle"></b><button type="button" id="ppsNext" aria-label="${L("Luna următoare", "Next month")}">›</button></div>
      <div class="pps-grid" id="ppsGrid"></div>
      <div class="pps-leg"><span><i style="background:#fff;border-color:#d8cfc2"></i>${L("în timpul săptămânii", "weekdays")}</span><span><i style="background:#d7ece9;border-color:#8cc2bb"></i>${L("vineri și sâmbătă", "Friday and Saturday")}</span><span><i style="background:#fbd9b8;border-color:#e09a55"></i>${L("sărbători / sezon", "holidays / season")}</span></div>
    </div>`;
    script = `(function(D){
  var grid=document.getElementById("ppsGrid"),title=document.getElementById("ppsTitle"),prev=document.getElementById("ppsPrev"),next=document.getElementById("ppsNext");
  if(!grid||!title)return;
  var t=D.today.split("-"),y0=+t[0],m0=+t[1]-1,y=y0,m=m0,MAXM=12;
  function pad(n){return (n<10?"0":"")+n;}
  function price(day,dow){
    var s=null;for(var i=0;i<D.seasons.length;i++){if(day>=D.seasons[i].from&&day<=D.seasons[i].to)s=D.seasons[i];}
    if(s)return {p:D.hotel?Math.round(D.weekday*(100+(s.pct||0)))/100:s.price,k:"s"};
    if(dow===5||dow===6){if(D.hotel&&D.weekendPct!=null)return {p:Math.round(D.weekday*(100+D.weekendPct))/100,k:"w"};if(!D.hotel&&D.weekend!=null)return {p:D.weekend,k:"w"};}
    return {p:D.weekday,k:"b"};
  }
  function fmt(n){return (Math.round(n*100)%100===0)?String(Math.round(n)):n.toFixed(2);}
  function draw(){
    title.textContent=D.mo[m]+" "+y;
    var first=new Date(Date.UTC(y,m,1)),lead=(first.getUTCDay()+6)%7,days=new Date(Date.UTC(y,m+1,0)).getUTCDate(),h="";
    D.dw.forEach(function(x){h+='<div class="pps-dw">'+x+'</div>';});
    for(var i=0;i<lead;i++)h+='<div></div>';
    for(var d=1;d<=days;d++){
      var day=y+"-"+pad(m+1)+"-"+pad(d),dow=new Date(Date.UTC(y,m,d)).getUTCDay(),past=day<D.today,p=price(day,dow);
      h+='<div class="pps-d pps-'+(past?"x":p.k)+'"><span>'+d+'</span>'+(past?"":'<b>'+fmt(p.p)+'</b>')+'</div>';
    }
    grid.innerHTML=h;
    prev.disabled=(y===y0&&m===m0);next.disabled=((y-y0)*12+(m-m0)>=MAXM);
  }
  prev.addEventListener("click",function(){m--;if(m<0){m=11;y--;}draw();});
  next.addEventListener("click",function(){m++;if(m>11){m=0;y++;}draw();});
  draw();
})(${JSON.stringify(data).replace(/</g, "\\u003c")});`;
  }

  const css = `.pps-hd,.pps-r{display:flex;gap:8px;align-items:center}
.pps-hd{font-size:12.5px;font-weight:700;color:#5b6770;padding:0 2px 6px}
.pps-r{padding:11px 2px;border-top:1px solid #efe6dc}
.pps-n{flex:1 1 auto;min-width:0}.pps-n strong{display:block;font-size:15.5px}.pps-n span{font-size:13.5px;color:#5b6770}
.pps-c{flex:0 0 96px;text-align:right}.pps-c.pps-w{flex-basis:116px}
.pps-hd .pps-n{font-size:12.5px}
.pps-note{font-size:13px;color:#5b6770;margin:10px 0 0}
.pps-until{font-size:13px;color:#7a3a00;font-weight:600}
.pps-cal-top{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px;margin-bottom:8px}
.pps-cal-nav{display:flex;align-items:center;justify-content:space-between;margin:6px 0 8px}
.pps-cal-nav button{font:inherit;font-size:22px;line-height:1;width:44px;height:44px;border-radius:10px;border:1px solid #d8cfc2;background:#fff;cursor:pointer}
.pps-cal-nav button:disabled{opacity:.35;cursor:default}
.pps-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
.pps-dw{text-align:center;font-size:12px;font-weight:700;color:#5b6770;padding:2px 0}
.pps-d{box-sizing:border-box;min-height:50px;border-radius:8px;border:1px solid #d8cfc2;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}
.pps-d span{font-size:11.5px;color:#4a565f}.pps-d b{font-size:13.5px}
.pps-d.pps-w{background:#d7ece9;border-color:#8cc2bb}.pps-d.pps-s{background:#fbd9b8;border-color:#e09a55}.pps-d.pps-x{background:#f4f2ee;border-color:#ece8e0}.pps-d.pps-x span{color:#a5a9ad}
.pps-leg{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;margin-top:10px}.pps-leg span{display:inline-flex;align-items:center;gap:6px}.pps-leg i{display:inline-block;width:16px;height:16px;border-radius:4px;border:1px solid}
@media (max-width:420px){.pps-c{flex-basis:78px}.pps-c.pps-w{flex-basis:92px}.pps-d{min-height:46px}.pps-d b{font-size:12px}}`;

  return { rulesHtml, seasonsHtml, offersHtml, calendarHtml, script, css, hasAny: !!(seasonsHtml || offersHtml || calendarHtml || rulesHtml) };
}

module.exports = { build, baseInfo, wholeFactor };

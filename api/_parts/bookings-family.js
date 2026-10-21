// Căutarea cazărilor pentru o familie: pentru o listă de cazări, perioada și familia (adulți + vârste copii) întoarce, pentru
// cazările care folosesc rezervările din aplicație, cea mai ieftină combinație de camere care încape familia în perioada aleasă
// și prețul ei total (camere + suplimente pentru copii / persoane în plus), exact ca pagina de rezervare.
// Cazările care nu folosesc rezervările din aplicație nu intră aici (rămân în căutare ca până acum, cu prețul „de la”).
// Fără combinație liberă care să încapă familia în perioada aleasă → cazarea nu are ofertă (și iese din rezultate).
"use strict";
const core = require("./bookings-core");
const PARTY = require("./bookings-party");

const MAX_ROOMS_COMBO = 3;

function parseTd(v) { if (!v) return {}; if (typeof v === "object") return v; try { return JSON.parse(v) || {}; } catch (e) { return {}; } }

// aceeași ofertă pe cameră ca în pagina de rezervare (quoteUnit)
function quoteUnit(lst, rules, busy, unit, checkin, checkout, guests) {
  const un = unit ? unit.unit_no : 0;
  const q = core.computeQuote({ checkIn: checkin, checkOut: checkout, guests: unit ? null : guests,
    settings: { base_price_bani: unit && unit.base_price_bani != null ? unit.base_price_bani : lst.base_price_bani, min_nights: lst.min_nights || 1, max_guests: unit ? null : lst.max_guests },
    rules: rules.filter((x) => x.unit_no == null || x.unit_no === un), busyDays: busy.get(un) || new Set() });
  if (checkin < core.addDays(core.todayRo(), lst.lead_days || 0) && !q.errors.includes("data_trecuta")) { q.errors.push("prea_aproape"); q.ok = false; }
  return q;
}
const bedCount = (kids, party) => party.adults + party.ages.filter((a) => { const b = kids ? PARTY.classify(kids, a) : null; return !(b && b.nobed); }).length;

// cea mai ieftină ofertă pentru o cazare (pură, fără bază de date); null dacă familia nu încape / nu e liber
function bestOffer(lst, units, rules, busy, checkin, checkout, party) {
  const nights = core.dayNum(checkout) - core.dayNum(checkin);
  if (nights < 1) return null;
  const kids = lst.kids || null, bed = bedCount(kids, party);
  if (!units.length) {
    const q = quoteUnit(lst, rules, busy, null, checkin, checkout, bed);
    if (!q.ok) return null;
    const included = PARTY.includedOf(lst.td, kids, null, lst.max_guests) || null, max = lst.max_guests || null;
    const sp = kids ? PARTY.supp(kids, { included, max, perPerson: included ? Math.round(q.totalBani / nights / included) : 0 }, party.adults, party.ages) : { ok: true, perNightBani: 0 };
    if (!sp.ok) return null;
    return { totalBani: q.totalBani + sp.perNightBani * nights, nights, rooms: [] };
  }
  // camerele libere, grupate după (capacitate, persoane incluse, preț): camere identice → o singură variantă
  const groups = new Map();
  units.forEach((u) => {
    const q = quoteUnit(lst, rules, busy, u, checkin, checkout, null);
    if (!q.ok) return;
    const inc = PARTY.includedOf(lst.td, kids, u, null) || u.capacity;
    const key = [u.capacity, inc, q.totalBani].join("|");
    if (!groups.has(key)) groups.set(key, { cap: u.capacity, inc, total: q.totalBani, units: [] });
    groups.get(key).units.push(u);
  });
  const gs = [...groups.values()];
  if (!gs.length) return null;
  let best = null;
  const pick = (start, chosen) => {
    if (chosen.length) {
      const cap = chosen.reduce((a, g) => a + g.cap, 0);
      if (cap >= bed) {
        const inc = chosen.reduce((a, g) => a + g.inc, 0), rooms = chosen.reduce((a, g) => a + g.total, 0);
        const sp = kids ? PARTY.supp(kids, { included: inc, max: cap, perPerson: inc ? Math.round(rooms / nights / inc) : 0 }, party.adults, party.ages) : { ok: true, perNightBani: 0 };
        if (sp.ok) {
          const total = rooms + sp.perNightBani * nights;
          if (!best || total < best.totalBani || (total === best.totalBani && chosen.length < best.n)) best = { totalBani: total, nights, n: chosen.length, chosen: chosen.slice() };
        }
      }
    }
    if (chosen.length >= MAX_ROOMS_COMBO) return;
    for (let i = start; i < gs.length; i++) {
      const used = chosen.filter((g) => g === gs[i]).length;
      if (used >= gs[i].units.length) continue;
      chosen.push(gs[i]); pick(i, chosen); chosen.pop();
    }
  };
  pick(0, []);
  if (!best) return null;
  const used = new Map();
  const names = best.chosen.map((g) => { const k = (used.get(g) || 0); used.set(g, k + 1); return g.units[k].name; });
  return { totalBani: best.totalBani, nights, rooms: names };
}

// parametrii căutării din adresă: ?checkin=&checkout=&adulti=&varste=4,11 (și vechiul ?persoane=)
function paramsFromQuery(q, persons) {
  q = q || {};
  const ages = (PARTY.parseAges(q.varste) || []).slice(0, 6);
  const a = Number(q.adulti);
  const adults = Number.isInteger(a) && a >= 1 && a <= 20 ? a : (Number.isInteger(persons) && persons > 0 ? Math.max(1, Math.min(20, persons - ages.length)) : 2);
  const ci = typeof q.checkin === "string" ? q.checkin : "", co = typeof q.checkout === "string" ? q.checkout : "";
  const n = core.isDateStr(ci) && core.isDateStr(co) ? core.dayNum(co) - core.dayNum(ci) : 0;
  const datesOk = n >= 1 && n <= 60 && ci >= core.todayRo();
  return { checkin: datesOk ? ci : "", checkout: datesOk ? co : "", datesOk, nights: datesOk ? n : 0, adults, ages, hasFamily: Array.isArray(PARTY.parseAges(q.varste)) && String(q.adulti || "") !== "" };
}
// aceeași familie în adresă (pentru linkuri): „?checkin=..&checkout=..&adulti=2&varste=4,11”
function familyQs(fp) {
  if (!fp || !fp.datesOk) return "";
  const p = new URLSearchParams();
  p.set("checkin", fp.checkin); p.set("checkout", fp.checkout); p.set("adulti", String(fp.adults));
  if (fp.ages.length) p.set("varste", fp.ages.join(","));
  return p.toString();
}

// Completează căutarea existentă (oaspeți cu +/−) cu: vârsta fiecărui copil și datele sosirii/plecării.
// F = { adults, ages, checkin, checkout, today, ro } ; rulează pe pagina de rezultate (formular) și pe pagina cazării (buton).
const WIDGET_JS = `(function(F){
  var gv=document.getElementById("guestsValue"),panel=document.getElementById("guestsPanel");
  var cv=document.getElementById("childrenVal");
  if(!gv||!panel||!cv)return;
  var ro=F.ro!==false;
  var ages=(F.ages||[]).map(String);
  var box=document.createElement("div");box.id="agesBox";box.style.cssText="padding:4px 0 8px;display:flex;flex-wrap:wrap;gap:6px";
  var crow=cv.parentNode.parentNode;crow.parentNode.insertBefore(box,crow.nextSibling);
  var form=gv.closest?gv.closest("form"):null;
  var hidA=null,hidV=null;
  if(form){hidA=document.createElement("input");hidA.type="hidden";hidA.name="adulti";hidV=document.createElement("input");hidV.type="hidden";hidV.name="varste";form.appendChild(hidA);form.appendChild(hidV);}
  function hid(){var av=document.getElementById("adultsVal");if(hidA)hidA.value=String(parseInt(av.textContent,10)||1);if(hidV)hidV.value=ages.join(",");}
  function sync(){
    var n=parseInt(cv.textContent,10)||0;
    if(n>6){var m=document.querySelector('[data-step="children"][data-dir="-1"]');if(m)m.click();return;}
    while(ages.length<n)ages.push("");ages.length=n;
    box.innerHTML="";
    ages.forEach(function(v,i){
      var s=document.createElement("select");s.style.cssText="padding:6px;border:1px solid #ccc;border-radius:8px;font-size:14px";
      var o0=document.createElement("option");o0.value="";o0.textContent=ro?"Vârsta copilului "+(i+1):"Child "+(i+1)+" age";s.appendChild(o0);
      for(var a=0;a<=17;a++){var o=document.createElement("option");o.value=String(a);o.textContent=ro?(a===0?"sub 1 an":(a===1?"1 an":a+" ani")):(a===0?"under 1":(a===1?"1 year":a+" years"));s.appendChild(o);}
      s.value=v;s.onchange=function(){ages[i]=s.value;hid();};box.appendChild(s);
    });
    hid();
  }
  document.querySelectorAll('.acc-stepper-ctrl button').forEach(function(b){b.addEventListener("click",function(){setTimeout(sync,0);});});
  // date
  var wrap=gv.parentNode.parentNode;
  function field(label,name,val,min){
    var d=document.createElement("div");d.className="acc-search-field";
    var l=document.createElement("label");l.textContent=label;var i=document.createElement("input");i.type="date";i.name=name;if(val)i.value=val;if(min)i.min=min;
    d.appendChild(l);d.appendChild(i);wrap.insertBefore(d,gv.parentNode);return i;
  }
  var ci=field(ro?"Sosire":"Check-in","checkin",F.checkin,F.today),co=field(ro?"Plecare":"Check-out","checkout",F.checkout,F.today);
  function plusDay(s){var d=new Date(s+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);}
  ci.addEventListener("change",function(){if(ci.value){co.min=plusDay(ci.value);if(co.value&&co.value<=ci.value)co.value=plusDay(ci.value);}co.setCustomValidity("");});
  if(ci.value)co.min=plusDay(ci.value);
  function problem(){
    if(ci.value&&!co.value){co.setCustomValidity(ro?"Alege și data de plecare.":"Pick a check-out date.");co.reportValidity();return true;}
    if(co.value&&!ci.value){ci.setCustomValidity(ro?"Alege și data de sosire.":"Pick a check-in date.");ci.reportValidity();return true;}
    if(ages.some(function(x){return x==="";})){panel.classList.add("is-open");return true;}
    return false;
  }
  co.addEventListener("input",function(){co.setCustomValidity("");ci.setCustomValidity("");});ci.addEventListener("input",function(){ci.setCustomValidity("");});
  var hint=document.createElement("div");hint.style.cssText="font-size:12.5px;color:#6b7280;padding:2px 0 6px";hint.textContent=ro?"Alege datele și vârstele copiilor ca să vezi prețul exact pentru familia ta.":"Pick dates and the children's ages to see the exact price for your family.";
  panel.insertBefore(hint,panel.firstChild);
  if(form){form.addEventListener("submit",function(e){if(problem())e.preventDefault();});}
  else{
    var sb=document.getElementById("searchBtn");
    if(sb){var nb=sb.cloneNode(true);sb.parentNode.replaceChild(nb,sb);
      nb.addEventListener("click",function(){
        if(problem())return;
        var dest=document.getElementById("searchDest").value.trim();var av=parseInt(document.getElementById("adultsVal").textContent,10)||1;
        var u="/cazare?oras="+encodeURIComponent(dest)+"&persoane="+(av+ages.length)+"&adulti="+av;
        if(ages.length)u+="&varste="+ages.join(",");
        if(ci.value&&co.value)u+="&checkin="+ci.value+"&checkout="+co.value;
        window.location.href=u;
      });}
  }
  sync();
})`;

module.exports = function (dbPool) {
  // ids: cazările din rezultate; întoarce { managed: Set(id), offers: Map(id -> { totalBani, nights, rooms }) }
  async function offers(ids, checkin, checkout, party) {
    const managed = new Set(), out = new Map();
    if (!ids.length || !core.isDateStr(checkin) || !core.isDateStr(checkout)) return { managed, offers: out };
    const nights = core.dayNum(checkout) - core.dayNum(checkin);
    if (nights < 1 || nights > 60) return { managed, offers: out };
    await require("./contract").ensureTables();
    const lists = (await dbPool.query(
      `SELECT l.id, l.type_details, s.base_price_bani, s.min_nights, s.max_guests, s.lead_days
         FROM accommodation_listings l JOIN booking_settings s ON s.listing_id = l.id
        WHERE l.id = ANY($1::int[]) AND l.status = 'approved' AND ${require("./bookings-pay").BOOKABLE_SQL} AND l.type NOT IN ('camping', 'hotel_mare')`, [ids])).rows;
    if (!lists.length) return { managed, offers: out };
    const lid = lists.map((x) => x.id);
    const units = (await dbPool.query(`SELECT listing_id, unit_no, name, capacity, base_price_bani FROM booking_units WHERE listing_id = ANY($1::int[]) AND active ORDER BY listing_id, sort_order, unit_no`, [lid])).rows;
    try { // legătura camerelor cu tipurile de cameră de hotel (există doar după etapa 6)
      const ks = (await dbPool.query(`SELECT listing_id, unit_no, sync_key FROM booking_units WHERE listing_id = ANY($1::int[]) AND active`, [lid])).rows;
      units.forEach((u) => { const k = ks.find((x) => x.listing_id === u.listing_id && Number(x.unit_no) === Number(u.unit_no)); if (k) u.sync_key = k.sync_key; });
    } catch (e) { /* fără etapa 6 */ }
    const rules = (await dbPool.query(`SELECT listing_id, id, unit_no, kind, to_char(date_from,'YYYY-MM-DD') AS date_from, to_char(date_to,'YYYY-MM-DD') AS date_to, name, price_bani, min_nights, checkin_days, checkout_days, priority, active, (to_jsonb(r)->>'pct_bps')::integer AS pct_bps FROM booking_rate_rules r WHERE listing_id = ANY($1::int[]) AND active`, [lid])).rows;
    const busyRows = (await dbPool.query(`SELECT listing_id, unit_id, to_char(day,'YYYY-MM-DD') AS day FROM booking_calendar_days WHERE listing_id = ANY($1::int[]) AND day >= $2::date AND day < $3::date AND (status <> 3 OR blocked_until > now())`, [lid, checkin, checkout])).rows;
    for (const l of lists) {
      managed.add(l.id);
      const td = parseTd(l.type_details);
      const lst = { ...l, td, kids: PARTY.sanitizeKids(td.kids) };
      const busy = new Map();
      busyRows.filter((x) => x.listing_id === l.id).forEach((x) => { if (!busy.has(Number(x.unit_id))) busy.set(Number(x.unit_id), new Set()); busy.get(Number(x.unit_id)).add(x.day); });
      const o = bestOffer(lst, units.filter((u) => u.listing_id === l.id), rules.filter((x) => x.listing_id === l.id), busy, checkin, checkout, party);
      if (o) out.set(l.id, o);
    }
    return { managed, offers: out };
  }
  return { offers };
};
module.exports.bestOffer = bestOffer;
module.exports.paramsFromQuery = paramsFromQuery;
module.exports.familyQs = familyQs;
module.exports.WIDGET_JS = WIDGET_JS;

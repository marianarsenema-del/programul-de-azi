// Blocul „Perioade speciale și oferte” din formularul cazării (înscriere și editare).
// Se montează în <div id="pricePlanRoot"></div>, în locul căsuței vechi „Oferte speciale”, și face trei lucruri:
//   1. nopți minime, weekend în procent (doar hoteluri), reducerea „toată pensiunea” în % (pensiuni în modul hibrid);
//   2. sărbători și sezoane: butoane rapide, „+ Altă perioadă”, listă cu Editează / Șterge;
//   3. oferte: adaugi, închizi (rămâne salvată, dar nu se vede) sau ștergi.
// Datele ajung la server prin window.__collectPricePlan() și se refac din ciornă prin window.__populatePricePlan().
// Textul vechi (#dSpecialOffers) rămâne ascuns și se completează singur cu ofertele active, ca restul site-ului să meargă neschimbat.
"use strict";
const PP = require("./price-plan");

const CSS = `
#pricePlanRoot{margin:6px 0 18px}
#pricePlanRoot .pp-card{background:#fff;border:1.5px solid #dde1e6;border-radius:14px;padding:16px;margin:12px 0}
#pricePlanRoot .pp-h{font-size:17px;font-weight:800;color:#111;margin:0 0 4px}
#pricePlanRoot .pp-hint{font-size:13.5px;line-height:1.5;color:#555;margin:0 0 10px}
#pricePlanRoot .pp-lbl{display:block;font-size:14px;font-weight:700;color:#1a1f2e;margin:10px 0 5px}
#pricePlanRoot input.pp-in{box-sizing:border-box;width:100%;height:48px;border:2px solid #F0813A;border-radius:10px;padding:0 12px;font-size:17px;font-family:inherit;background:#fff}
#pricePlanRoot .pp-row{display:flex;flex-wrap:wrap;gap:12px}
#pricePlanRoot .pp-row>div{flex:1 1 150px;min-width:0}
#pricePlanRoot .pp-chips{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 12px}
#pricePlanRoot .pp-chip{font:inherit;font-size:15px;font-weight:700;color:#c2571a;background:#fff;border:1.5px solid #F0813A;border-radius:10px;padding:10px 14px;cursor:pointer}
#pricePlanRoot .pp-chip.pp-add{background:#F0813A;color:#fff}
#pricePlanRoot .pp-panel{background:#FFF7F0;border:2px dashed #F0813A;border-radius:14px;padding:14px;margin:8px 0 12px}
#pricePlanRoot .pp-list{border:1.5px solid #dde1e6;border-radius:12px;overflow:hidden;margin:8px 0}
#pricePlanRoot .pp-item{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:12px 14px;border-top:1px solid #e6e9ee;background:#fff}
#pricePlanRoot .pp-item:first-child{border-top:0}
#pricePlanRoot .pp-item.pp-off{background:#f4f2ee;color:#7a838a}
#pricePlanRoot .pp-main{flex:1 1 220px;min-width:0}
#pricePlanRoot .pp-main b{display:block;font-size:16px;line-height:1.35;overflow-wrap:anywhere}
#pricePlanRoot .pp-sub{font-size:13.5px;color:#555}
#pricePlanRoot .pp-price{font-weight:800;font-size:16px;white-space:nowrap}
#pricePlanRoot .pp-tag{font-size:12px;font-weight:800;border-radius:7px;padding:4px 8px;background:#ddf0df;color:#1d5f2a}
#pricePlanRoot .pp-tag.pp-t-off{background:#e4e0d6;color:#5b6770}
#pricePlanRoot .pp-btn{font:inherit;font-size:14px;font-weight:700;border-radius:9px;padding:9px 13px;cursor:pointer;background:#fff;color:#c2571a;border:1.5px solid #F0813A}
#pricePlanRoot .pp-btn.pp-del{color:#a12a1f;border-color:#d9a39d}
#pricePlanRoot .pp-btn.pp-main-btn{background:#F0813A;color:#fff;font-size:16px;font-weight:800;padding:12px 20px}
#pricePlanRoot .pp-btn.pp-gray{color:#4a565f;border-color:#c9c2b3}
#pricePlanRoot .pp-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
#pricePlanRoot .pp-err{color:#b3261e;font-size:14px;font-weight:700;margin-top:8px}
#pricePlanRoot .pp-calc{background:#F1F8F7;border:1px solid #BFDCD8;border-radius:12px;padding:12px;font-size:15px;line-height:1.55;margin-top:10px}
#pricePlanRoot .pp-yearly{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;margin-top:12px}
#pricePlanRoot .pp-yearly input{width:20px;height:20px;accent-color:#F0813A}
body.pp-whole-pct #dPricePropertyWrap{display:none !important}
`;

// rulează în browser (se trimite ca text prin .toString()); fără dependențe externe
function client(CFG) {
  var LANG = CFG.lang, TODAY = CFG.today;
  var root = document.getElementById("pricePlanRoot");
  if (!root) return;
  function T(ro, en) { return LANG === "en" ? en : ro; }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function btn(label, cls, fn) { var b = el("button", "pp-btn " + (cls || ""), label); b.type = "button"; b.addEventListener("click", fn); return b; }
  function num(v) { var n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(n) ? n : null; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var MO = LANG === "en" ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] : ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "nov", "dec"];
  function fd(s, withYear) { var p = String(s).split("-"); return (+p[2]) + " " + MO[+p[1] - 1] + (withYear ? " " + p[0] : ""); }
  function range(a, b) { return a === b ? fd(a, true) : (a.slice(0, 4) === b.slice(0, 4) ? fd(a) + " – " + fd(b, true) : fd(a, true) + " – " + fd(b, true)); }
  function money(n) { return (Math.round(n * 100) / 100).toLocaleString(LANG === "en" ? "en-US" : "ro-RO") + " RON"; }

  var S = { seasons: clone(CFG.plan.seasons || []), offers: clone(CFG.plan.offers || []), weekendPct: CFG.plan.weekendPct, minNights: CFG.plan.minNights, minInit: CFG.plan.minNights, panel: null, offerPanel: false };
  var PENSION = ["pensiune", "cabana", "aframe"];
  function curType() { var s = $("dType"); return s && s.value ? s.value : CFG.type; }
  function isHotel() { return curType() === "hotel_mic"; }
  function seasonsOn() { return ["pensiune", "cabana", "aframe", "apartament", "hotel_mic"].indexOf(curType()) !== -1; }
  function curMode() { try { var td = window.__collectTypeDetails ? window.__collectTypeDetails() : null; return (td && td.rentalMode) || ""; } catch (e) { return ""; } }
  function perRoom() { return PENSION.indexOf(curType()) !== -1 && curMode() !== "integral" && curMode() !== ""; }
  function priceLabel() { return perRoom() ? T("Preț pe noapte, pe cameră (RON)", "Price per night, per room (RON)") : T("Preț pe noapte (RON)", "Price per night (RON)"); }

  // ---------- oferte -> textul vechi (#dSpecialOffers) ----------
  function offerState(o) { return o.closed ? "closed" : (o.until && o.until < TODAY ? "expired" : "active"); }
  function offersText() {
    var out = [], len = 0;
    S.offers.forEach(function (o) { if (offerState(o) !== "active") return; var add = o.text.length + (out.length ? 1 : 0); if (len + add > 500) return; out.push(o.text); len += add; });
    return out.join("\n");
  }
  function commit() {
    var ta = $("dSpecialOffers");
    if (ta) { ta.value = offersText(); ta.dispatchEvent(new Event("input", { bubbles: true })); }
  }
  function newId(p) { return p + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); }

  // ---------- secțiunea 1: nopți minime + weekend hotel ----------
  var basics = el("div", "pp-card");
  var minIn = el("input", "pp-in"); minIn.type = "number"; minIn.min = "1"; minIn.max = "60"; minIn.step = "1"; minIn.value = S.minNights || ""; minIn.placeholder = "1";
  minIn.addEventListener("input", function () { var n = parseInt(minIn.value, 10); S.minNights = n >= 1 && n <= 60 ? n : null; });
  var wkIn = el("input", "pp-in"); wkIn.type = "number"; wkIn.min = "0"; wkIn.max = "300"; wkIn.step = "0.5"; wkIn.value = S.weekendPct != null ? S.weekendPct : ""; wkIn.placeholder = T("ex: 15", "e.g. 15");
  wkIn.addEventListener("input", function () { var n = num(wkIn.value); S.weekendPct = n != null && n >= 0 && n <= 300 ? n : null; });
  var wkWrap = el("div");
  function buildBasics() {
    basics.innerHTML = "";
    basics.appendChild(el("div", "pp-h", T("Reguli de rezervare", "Booking rules")));
    var l1 = el("label", "pp-lbl", T("Nopți minime pe rezervare (opțional)", "Minimum nights per booking (optional)")); basics.appendChild(l1); basics.appendChild(minIn);
    wkWrap.innerHTML = "";
    if (isHotel()) {
      wkWrap.appendChild(el("label", "pp-lbl", T("Weekend (vineri și sâmbătă): cu cât mai scump decât în timpul săptămânii, în % (opțional)", "Weekend (Friday and Saturday): how much more than weekdays, in % (optional)")));
      wkWrap.appendChild(wkIn);
      wkWrap.appendChild(el("p", "pp-hint", T("Se aplică la prețul fiecărui tip de cameră. Lasă gol dacă weekendul costă la fel.", "Applies to the price of every room type. Leave empty if weekends cost the same.")));
    }
    basics.appendChild(wkWrap);
  }

  // ---------- secțiunea 2: reducere „toată pensiunea” (pensiuni în modul hibrid) ----------
  var disc = el("div", "pp-card"); disc.style.display = "none";
  var discIn = el("input", "pp-in"); discIn.type = "number"; discIn.min = "0"; discIn.max = "50"; discIn.step = "0.1"; discIn.placeholder = T("ex: 10", "e.g. 10");
  var discCalc = el("div", "pp-calc");
  var dExact = null, userSetDisc = false;
  disc.appendChild(el("div", "pp-h", T("Toată pensiunea", "Whole property")));
  disc.appendChild(el("p", "pp-hint", T("Dacă cineva închiriază toate camerele, prețul se calculează singur din prețul unei camere, minus reducerea de mai jos. Nu mai scrii un al doilea preț.", "If a guest rents all the rooms, the price is calculated from the room price minus the discount below. You don't type a second price.")));
  disc.appendChild(el("label", "pp-lbl", T("Reducere dacă se închiriază toată pensiunea (%)", "Discount if the whole property is rented (%)")));
  disc.appendChild(discIn); disc.appendChild(discCalc);
  discIn.addEventListener("input", function () { userSetDisc = true; var n = num(discIn.value); dExact = n != null ? Math.max(0, Math.min(50, n)) : 0; syncDisc(); });
  function pensionNums() {
    if (PENSION.indexOf(curType()) === -1) return null;
    var td = null; try { td = window.__collectTypeDetails ? window.__collectTypeDetails() : null; } catch (e) { td = null; }
    if (!td || td.rentalMode !== "hibrid") return null;
    var n = Array.isArray(td.bedrooms) ? td.bedrooms.length : 0;
    var pr = num(($("dPrice") || {}).value), pw = num(($("dPriceWeekend") || {}).value), pp = num(($("dPricePerProperty") || {}).value);
    if (n < 2 || !(pr > 0)) return null;
    return { n: n, pr: pr, pw: pw, pp: pp };
  }
  function setVal(id, v) { var e = $(id); if (e && e.value !== String(v)) { e.value = v; } }
  function syncDisc() {
    var x = pensionNums();
    document.body.classList.toggle("pp-whole-pct", !!x);
    disc.style.display = x ? "" : "none";
    if (!x) return;
    if (dExact == null) { // prima afișare: procentul se deduce din prețul întreg salvat
      dExact = x.pp > 0 ? Math.max(0, Math.min(50, (1 - x.pp / (x.n * x.pr)) * 100)) : 0;
      discIn.value = dExact ? String(Math.round(dExact * 10) / 10) : "";
    }
    var f = 1 - dExact / 100;
    var whole = Math.round(x.n * x.pr * f), wholeW = x.pw > 0 ? Math.round(x.n * x.pw * f) : null;
    if (userSetDisc || !(x.pp > 0)) { // prețul întreg din formular urmează procentul
      setVal("dPricePerProperty", whole); setVal("dPricePropWeekend", wholeW != null ? wholeW : "");
    } else if (Math.abs(x.pp - whole) > 1) { // s-a schimbat prețul camerei sau numărul de camere: păstrăm procentul
      setVal("dPricePerProperty", whole); setVal("dPricePropWeekend", wholeW != null ? wholeW : "");
    }
    discCalc.innerHTML = "";
    discCalc.appendChild(el("b", null, T("Așa îl vede turistul (calculat)", "What the guest sees (calculated)")));
    discCalc.appendChild(el("div", null, T("Duminică – joi: ", "Sunday – Thursday: ") + money(whole) + " / " + T("noapte, toată pensiunea", "night, whole property")));
    if (wholeW != null) discCalc.appendChild(el("div", null, T("Vineri – sâmbătă: ", "Friday – Saturday: ") + money(wholeW) + " / " + T("noapte, toată pensiunea", "night, whole property")));
    discCalc.appendChild(el("div", "pp-sub", x.n + " " + T("camere", "rooms") + " × " + money(x.pr) + (dExact ? ", " + T("minus ", "minus ") + (Math.round(dExact * 10) / 10) + "%" : "")));
  }

  // ---------- secțiunea 3: sărbători și sezoane ----------
  var sec = el("div", "pp-card");
  function templates() {
    var out = [], seen = {};
    (CFG.templates || []).forEach(function (t) {
      if (seen[t.key] || t.date_to < TODAY) return; seen[t.key] = 1;
      var nm = t.name.replace(/ \d{4}$/, "");
      if (S.seasons.some(function (s) { return s.name === nm; })) return;
      out.push({ key: t.key, name: nm, from: t.date_from, to: t.date_to, yearly: t.key !== "paste" && t.key !== "rusalii" });
    });
    return out;
  }
  function openPanel(init) { S.panel = init; renderSeasons(); var p = sec.querySelector(".pp-panel"); if (p && p.scrollIntoView) p.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  function seasonRow(s) {
    var row = el("div", "pp-item");
    var main = el("div", "pp-main"); main.appendChild(el("b", null, s.name));
    var past = !s.yearly && s.to < TODAY;
    main.appendChild(el("div", "pp-sub", range(s.from, s.to) + (s.minNights ? " · " + T("minim ", "min ") + s.minNights + " " + T("nopți", "nights") : "") + (s.yearly ? " · " + T("se repetă în fiecare an", "repeats every year") : "") + (past ? " · " + T("încheiată", "ended") : "")));
    row.appendChild(main);
    row.appendChild(el("div", "pp-price", isHotel() ? (s.pct != null ? (s.pct > 0 ? "+" : "") + s.pct + "%" : "—") : (s.price != null ? money(s.price) : "—")));
    row.appendChild(btn(T("Editează", "Edit"), "", function () { openPanel({ id: s.id, name: s.name, from: s.from, to: s.to, value: isHotel() ? s.pct : s.price, minNights: s.minNights, yearly: s.yearly, err: "" }); }));
    row.appendChild(btn(T("Șterge", "Delete"), "pp-del", function () {
      if (!window.confirm(T("Ștergi perioada „", "Delete the period “") + s.name + T("”? Dispare și de pe pagina cazării.", "”? It also disappears from the listing page."))) return;
      S.seasons = S.seasons.filter(function (x) { return x.id !== s.id; }); renderSeasons(); commit();
    }));
    if (past) row.classList.add("pp-off");
    return row;
  }
  function panelNode() {
    var d = S.panel, p = el("div", "pp-panel");
    p.appendChild(el("div", "pp-h", d.id ? T("Editezi perioada", "Edit period") : T("Perioadă nouă, alegi tu datele", "New period, you choose the dates")));
    p.appendChild(el("p", "pp-hint", T("Pentru zile care nu sunt în lista de mai sus: 1 Decembrie, Sf. Andrei, Valentine's Day, un festival din zonă, un weekend lung.", "For days that are not in the quick list: a local festival, a long weekend, a special day.")));
    var nm = el("input", "pp-in"); nm.type = "text"; nm.maxLength = 80; nm.value = d.name || ""; nm.placeholder = T("ex: 1 Decembrie", "e.g. Local festival");
    nm.addEventListener("input", function () { d.name = nm.value; });
    var a = el("input", "pp-in"); a.type = "date"; a.value = d.from || ""; a.addEventListener("change", function () { d.from = a.value; if (!d.to || d.to < a.value) { d.to = a.value; b.value = a.value; } });
    var b = el("input", "pp-in"); b.type = "date"; b.value = d.to || ""; b.addEventListener("change", function () { d.to = b.value; });
    var v = el("input", "pp-in"); v.type = "number"; v.step = isHotel() ? "0.5" : "0.01"; v.min = isHotel() ? "-90" : "0"; v.value = d.value != null ? d.value : ""; v.addEventListener("input", function () { d.value = num(v.value); });
    var mn = el("input", "pp-in"); mn.type = "number"; mn.min = "1"; mn.max = "60"; mn.step = "1"; mn.value = d.minNights || ""; mn.addEventListener("input", function () { var n = parseInt(mn.value, 10); d.minNights = n >= 1 ? n : null; });
    var yc = el("input"); yc.type = "checkbox"; yc.checked = !!d.yearly; yc.addEventListener("change", function () { d.yearly = yc.checked; });
    p.appendChild(el("label", "pp-lbl", T("Numele perioadei", "Name of the period"))); p.appendChild(nm);
    var r1 = el("div", "pp-row"), c1 = el("div"), c2 = el("div");
    c1.appendChild(el("label", "pp-lbl", T("De la (prima noapte)", "From (first night)"))); c1.appendChild(a);
    c2.appendChild(el("label", "pp-lbl", T("Până la (ultima noapte)", "Until (last night)"))); c2.appendChild(b);
    r1.appendChild(c1); r1.appendChild(c2); p.appendChild(r1);
    var r2 = el("div", "pp-row"), c3 = el("div"), c4 = el("div");
    c3.appendChild(el("label", "pp-lbl", isHotel() ? T("Cu cât mai scump decât prețul camerei (%)", "How much more than the room price (%)") : priceLabel())); c3.appendChild(v);
    c4.appendChild(el("label", "pp-lbl", T("Nopți minime (opțional)", "Minimum nights (optional)"))); c4.appendChild(mn);
    r2.appendChild(c3); r2.appendChild(c4); p.appendChild(r2);
    var yl = el("label", "pp-yearly"); yl.appendChild(yc); yl.appendChild(el("span", null, T("Se repetă în fiecare an", "Repeats every year"))); p.appendChild(yl);
    var err = el("div", "pp-err"); err.textContent = d.err || ""; p.appendChild(err);
    var act = el("div", "pp-actions");
    act.appendChild(btn(d.id ? T("Salvează perioada", "Save period") : T("Adaugă perioada", "Add period"), "pp-main-btn", function () {
      var nmv = (d.name || "").trim(), valid = /^\d{4}-\d{2}-\d{2}$/;
      if (!nmv) { err.textContent = T("Scrie numele perioadei.", "Enter a name for the period."); return; }
      if (!valid.test(d.from || "") || !valid.test(d.to || "")) { err.textContent = T("Alege datele de început și de sfârșit.", "Choose the start and end dates."); return; }
      if (d.to < d.from) { err.textContent = T("Data de sfârșit nu poate fi înaintea celei de început.", "The end date cannot be before the start date."); return; }
      if (d.value == null || (isHotel() ? (d.value < -90 || d.value > 500) : !(d.value > 0))) { err.textContent = isHotel() ? T("Scrie procentul (între -90 și 500).", "Enter the percentage (between -90 and 500).") : T("Scrie prețul pe noapte.", "Enter the price per night."); return; }
      var rec = { id: d.id || newId("s"), name: nmv.slice(0, 80), from: d.from, to: d.to, price: isHotel() ? null : d.value, pct: isHotel() ? d.value : null, minNights: d.minNights || null, yearly: !!d.yearly };
      var i = S.seasons.findIndex(function (x) { return x.id === rec.id; });
      if (i >= 0) S.seasons[i] = rec; else S.seasons.push(rec);
      S.seasons.sort(function (x, y) { return x.from < y.from ? -1 : 1; });
      S.panel = null; renderSeasons(); commit();
    }));
    act.appendChild(btn(T("Renunță", "Cancel"), "pp-gray", function () { S.panel = null; renderSeasons(); }));
    p.appendChild(act);
    return p;
  }
  function renderSeasons() {
    sec.innerHTML = "";
    if (!seasonsOn()) { sec.style.display = "none"; return; }
    sec.style.display = "";
    sec.appendChild(el("div", "pp-h", T("Sărbători și sezoane", "Holidays and seasons")));
    sec.appendChild(el("p", "pp-hint", T("Pentru perioadele în care prețul este altul (Crăciun, Revelion, vară). Ordinea: perioadă specială, apoi weekend, apoi prețul de bază. Turistul le vede pe pagina cazării.", "For periods when the price is different (Christmas, New Year, summer). Order: special period, then weekend, then the base price. Guests see them on the listing page.")));
    sec.appendChild(el("div", "pp-lbl", T("Adaugă rapid:", "Quick add:")));
    var chips = el("div", "pp-chips");
    templates().forEach(function (t) { chips.appendChild(btn(t.name, "pp-chip", function () { openPanel({ id: null, name: t.name, from: t.from, to: t.to, value: null, minNights: null, yearly: t.yearly, err: "" }); })); });
    var plus = btn("+ " + T("Altă perioadă", "Other period"), "pp-chip pp-add", function () { openPanel({ id: null, name: "", from: "", to: "", value: null, minNights: null, yearly: false, err: "" }); });
    chips.appendChild(plus);
    sec.appendChild(chips);
    if (S.panel) sec.appendChild(panelNode());
    if (S.seasons.length) {
      var list = el("div", "pp-list");
      S.seasons.slice().sort(function (x, y) { return x.from < y.from ? -1 : 1; }).forEach(function (s) { list.appendChild(seasonRow(s)); });
      sec.appendChild(list);
      sec.appendChild(el("p", "pp-hint", isHotel() ? T("Procentul se aplică la prețul fiecărui tip de cameră. În aceste perioade nu se mai adaugă suplimentul de weekend.", "The percentage applies to each room type's price. The weekend supplement is not added in these periods.") : T("Prețuri în RON, pe noapte. În aceste perioade prețul de weekend nu se mai adaugă.", "Prices in RON, per night. The weekend price is not added in these periods.")));
    }
  }

  // ---------- secțiunea 4: oferte ----------
  var off = el("div", "pp-card");
  function offerRow(o) {
    var st = offerState(o), row = el("div", "pp-item" + (st === "active" ? "" : " pp-off"));
    var main = el("div", "pp-main"); main.appendChild(el("b", null, o.text));
    main.appendChild(el("div", "pp-sub", st === "closed" ? T("Închisă · nu se vede pe pagină", "Closed · not shown on the page") : (st === "expired" ? T("Expirată la ", "Expired on ") + fd(o.until, true) : (o.until ? T("Valabilă până la ", "Valid until ") + fd(o.until, true) : T("Fără dată de final", "No end date")))));
    row.appendChild(main);
    row.appendChild(el("span", "pp-tag" + (st === "active" ? "" : " pp-t-off"), st === "active" ? T("Activă", "Active") : (st === "closed" ? T("Închisă", "Closed") : T("Expirată", "Expired"))));
    if (st !== "expired") row.appendChild(btn(o.closed ? T("Redeschide", "Reopen") : T("Închide oferta", "Close offer"), "", function () { o.closed = !o.closed; renderOffers(); commit(); }));
    row.appendChild(btn(T("Șterge", "Delete"), "pp-del", function () {
      if (!window.confirm(T("Ștergi oferta definitiv? Dacă vrei doar s-o ascunzi, folosește „Închide oferta”.", "Delete this offer for good? To just hide it, use “Close offer”."))) return;
      S.offers = S.offers.filter(function (x) { return x.id !== o.id; }); renderOffers(); commit();
    }));
    return row;
  }
  function renderOffers() {
    off.innerHTML = "";
    off.appendChild(el("div", "pp-h", "🎁 " + T("Oferte speciale", "Special offers")));
    off.appendChild(el("p", "pp-hint", T("Ofertele active apar într-un chenar evidențiat pe pagina cazării, lângă prețuri. Poți să le închizi (rămân salvate) sau să le ștergi. Dacă pui o dată, oferta se închide singură după ea.", "Active offers appear in a highlighted box on the listing page, next to the prices. You can close them (they stay saved) or delete them. With an end date, the offer closes by itself afterwards.")));
    if (S.offers.length) { var list = el("div", "pp-list"); S.offers.forEach(function (o) { list.appendChild(offerRow(o)); }); off.appendChild(list); }
    if (!S.offerPanel) {
      off.appendChild(btn("+ " + T("Ofertă nouă", "New offer"), "pp-chip pp-add", function () { S.offerPanel = true; renderOffers(); }));
      return;
    }
    var p = el("div", "pp-panel"), d = { text: "", until: "" };
    var tx = el("input", "pp-in"); tx.type = "text"; tx.maxLength = 200; tx.placeholder = T("ex: 1 Decembrie: 10% reducere la 2 nopți", "e.g. 10% off for 2 nights"); tx.addEventListener("input", function () { d.text = tx.value; });
    var un = el("input", "pp-in"); un.type = "date"; un.addEventListener("change", function () { d.until = un.value; });
    p.appendChild(el("label", "pp-lbl", T("Textul ofertei", "Offer text"))); p.appendChild(tx);
    p.appendChild(el("label", "pp-lbl", T("Valabilă până la (opțional)", "Valid until (optional)"))); p.appendChild(un);
    var err = el("div", "pp-err"); p.appendChild(err);
    var act = el("div", "pp-actions");
    act.appendChild(btn(T("Adaugă oferta", "Add offer"), "pp-main-btn", function () {
      var t = (d.text || "").trim();
      if (!t) { err.textContent = T("Scrie textul ofertei.", "Enter the offer text."); return; }
      if (d.until && d.until < TODAY) { err.textContent = T("Data de final este în trecut.", "The end date is in the past."); return; }
      if (S.offers.length >= 20) { err.textContent = T("Maxim 20 de oferte. Șterge una veche.", "Maximum 20 offers. Delete an old one."); return; }
      S.offers.push({ id: newId("o"), text: t.slice(0, 200), until: d.until || null, closed: false });
      S.offerPanel = false; renderOffers(); commit();
    }));
    act.appendChild(btn(T("Renunță", "Cancel"), "pp-gray", function () { S.offerPanel = false; renderOffers(); }));
    p.appendChild(act); off.appendChild(p);
  }

  // ---------- montare ----------
  function renderAll() { buildBasics(); renderSeasons(); renderOffers(); syncDisc(); }
  root.appendChild(basics); root.appendChild(disc); root.appendChild(sec); root.appendChild(off);
  renderAll();
  var form = $("detForm") || root.closest("form");
  var last = "";
  function tick() { // schimbarea tipului, a modului de închiriere, a prețurilor sau a camerelor
    var key = curType() + "|" + (isHotel() ? 1 : 0);
    if (key !== last) { last = key; buildBasics(); renderSeasons(); }
    hideOld(); syncDisc();
  }
  if (form) { form.addEventListener("input", tick); form.addEventListener("change", tick); }
  document.addEventListener("DOMContentLoaded", function () { setTimeout(tick, 0); });
  setTimeout(tick, 400);
  // căsuța veche cu oferte rămâne doar ca depozit ascuns (poate apărea în pagină după acest script)
  function hideOld() {
    var oldTa = $("dSpecialOffers");
    if (!oldTa || oldTa.getAttribute("data-pp") === "1") return;
    oldTa.setAttribute("data-pp", "1");
    oldTa.style.display = "none";
    var oldLbl = document.querySelector('label[for="dSpecialOffers"]'); if (oldLbl) oldLbl.style.display = "none";
    oldTa.value = offersText();
  }
  hideOld();
  window.__collectPricePlan = function () {
    return { seasons: clone(S.seasons), offers: clone(S.offers), weekendPct: isHotel() ? S.weekendPct : null, minNights: S.minNights != null ? S.minNights : (S.minInit != null ? 1 : null) };
  };
  window.__populatePricePlan = function (p) {
    if (!p || typeof p !== "object") return;
    S.seasons = clone(p.seasons || []); S.offers = clone(p.offers || []); S.weekendPct = p.weekendPct != null ? p.weekendPct : null; S.minNights = p.minNights || null;
    minIn.value = S.minNights || ""; wkIn.value = S.weekendPct != null ? S.weekendPct : "";
    S.panel = null; S.offerPanel = false; renderAll(); commit();
  };
}

// HTML-ul blocului: stil + rădăcină + script. `cfg`: { nonce, lang, type, plan, today, templates, safeJson }
function pricePlanBlockHtml(cfg) {
  const payload = { lang: cfg.lang, type: cfg.type, plan: cfg.plan, today: cfg.today, templates: cfg.templates };
  return `<style nonce="${cfg.nonce}">${CSS}</style>
<div id="pricePlanRoot"></div>
<script nonce="${cfg.nonce}">(${client.toString()})(${cfg.safeJson(payload)});</script>`;
}

module.exports = { pricePlanBlockHtml, client, CSS };

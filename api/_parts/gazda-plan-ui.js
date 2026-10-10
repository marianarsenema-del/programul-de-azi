// Interfața din aplicația Gazdă pentru perioade speciale și oferte (Setări › Prețuri).
// Funcțiile de mai jos rulează în browser (sunt incluse în aplicație prin .toString()); folosesc ajutoarele aplicației:
// el, api, say, errT, B. Datele vin de la GET /api/rezervari/:id/plan și se salvează cu POST pe același drum.
"use strict";

async function planCards(pl, multi) {
  var hotel = !!pl.hotel, today = pl.today, plan = pl.plan;
  var unit = hotel ? 'în procente peste prețul camerei' : (multi ? 'RON / noapte / cameră' : 'RON / noapte, toată pensiunea');
  var wrap = el('div', {});
  var msg = el('div', { class: 'msg' });
  var S = { seasons: plan.seasons.slice(), offers: plan.offers.slice(), weekendPct: plan.weekendPct, edit: null, offerForm: false };

  function dmy(d) { return d ? d.slice(8, 10) + '.' + d.slice(5, 7) + '.' + d.slice(0, 4) : ''; }
  function nid(p) { return p + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); }
  function pill(t, cls) { return el('span', { class: 'pill ' + (cls || '') }, [t]); }
  function field(label, input) { return el('label', {}, [label, input]); }
  function inp(type, val, ph, extra) {
    var a = { type: type, value: val == null ? '' : String(val) };
    if (ph) a.placeholder = ph;
    for (var k in (extra || {})) a[k] = extra[k];
    return el('input', a);
  }
  async function save(patch, okText) {
    try {
      var r = await api('POST', B() + '/plan', patch);
      S.seasons = r.plan.seasons; S.offers = r.plan.offers; S.weekendPct = r.plan.weekendPct;
      S.edit = null; S.offerForm = false; draw();
      say(msg, okText || 'Salvat. Se vede acum pe pagina pensiunii.', true);
      return true;
    } catch (e) { say(msg, errT(e), false); return false; }
  }

  // ---------- perioade speciale ----------
  function seasonForm(s) {
    var isNew = !s.id;
    var name = inp('text', s.name, 'ex.: 1 Decembrie', { maxlength: '80' });
    var from = inp('date', s.from), to = inp('date', s.to);
    var val = hotel ? inp('number', s.pct, 'ex.: 30', { inputmode: 'decimal', min: '-90', max: '500', step: '0.5' })
                    : inp('number', s.price, 'ex.: 450', { inputmode: 'decimal', min: '1', max: '100000', step: '1' });
    var mn = inp('number', s.minNights, 'fără', { min: '1', max: '60', step: '1' });
    var yr = el('input', { type: 'checkbox', style: 'width:auto;height:auto' }); yr.checked = !!s.yearly;
    var m = el('div', { class: 'msg' });
    var ok = el('button', { type: 'button' }, [isNew ? 'Adaugă perioada' : 'Salvează']);
    ok.onclick = async function () {
      if (!name.value.trim()) return say(m, 'Scrie un nume (ex.: 1 Decembrie).', false);
      if (!from.value || !to.value) return say(m, 'Alege prima și ultima zi.', false);
      if (to.value < from.value) return say(m, 'Ultima zi nu poate fi înaintea primei.', false);
      var n = Number(val.value);
      if (val.value === '' || !isFinite(n) || (!hotel && n <= 0)) return say(m, hotel ? 'Scrie cu câte procente crește prețul.' : 'Scrie prețul pe noapte.', false);
      var item = { id: s.id || nid('s'), name: name.value.trim(), from: from.value, to: to.value, price: hotel ? null : n, pct: hotel ? n : null, minNights: mn.value === '' ? null : Number(mn.value), yearly: yr.checked };
      var list = isNew ? S.seasons.concat([item]) : S.seasons.map(function (x) { return x.id === s.id ? item : x; });
      ok.disabled = true; var done = await save({ seasons: list }, isNew ? 'Perioadă adăugată.' : 'Perioadă salvată.'); if (!done) ok.disabled = false;
    };
    var no = el('button', { type: 'button', class: 's' }, ['Renunță']);
    no.onclick = function () { S.edit = null; draw(); };
    return el('div', { class: 'item' }, [
      field('Numele perioadei', name), field('Prima zi', from), field('Ultima zi', to),
      field(hotel ? 'Cu câte procente crește prețul camerei (%)' : 'Preț pe noapte (' + unit + ')', val),
      field('Nopți minime în această perioadă (opțional)', mn),
      el('label', { style: 'display:flex;gap:8px;align-items:center' }, [yr, 'Se repetă în fiecare an (ex.: 1 Decembrie, Crăciun)']),
      el('div', { class: 'row', style: 'margin-top:8px' }, [ok, no]), m]);
  }
  function seasonItem(s) {
    var price = hotel ? (s.pct >= 0 ? '+' : '') + s.pct + '% peste prețul camerei' : s.price + ' ' + unit;
    var bits = [dmy(s.from) + ' – ' + dmy(s.to), price];
    if (s.minNights) bits.push('minim ' + s.minNights + ' nopți');
    if (s.yearly) bits.push('în fiecare an');
    var past = !s.yearly && s.to < today;
    var ed = el('button', { type: 'button', class: 's mini' }, ['Modifică']);
    ed.onclick = function () { S.edit = s.id; draw(); };
    var del = el('button', { type: 'button', class: 'd mini' }, ['Șterge']);
    del.onclick = function () {
      if (!confirm('Ștergi perioada „' + s.name + '”? Prețul revine la cel obișnuit.')) return;
      save({ seasons: S.seasons.filter(function (x) { return x.id !== s.id; }) }, 'Perioadă ștearsă.');
    };
    return el('div', { class: 'item' }, [el('b', {}, [s.name]), past ? pill('Trecută') : el('span'), el('div', { class: 'sub', style: 'margin:2px 0' }, [bits.join(' · ')]), el('div', { class: 'row' }, [ed, del])]);
  }
  function chips() {
    var seen = {}, out = [];
    (pl.suggestions || []).forEach(function (t) { if (t.date_to >= today && !seen[t.key]) { seen[t.key] = 1; out.push(t); } });
    var box = el('div', { class: 'row', style: 'flex-wrap:wrap;gap:6px;margin:8px 0' });
    out.forEach(function (t) {
      var b = el('button', { type: 'button', class: 's mini' }, [t.name.replace(/\s\d{4}$/, '')]);
      b.onclick = function () { S.edit = { name: t.name.replace(/\s\d{4}$/, ''), from: t.date_from, to: t.date_to, yearly: ['paste', 'rusalii'].indexOf(t.key) === -1 }; draw(); };
      box.append(b);
    });
    var plus = el('button', { type: 'button', class: 'mini' }, ['+ Altă perioadă']);
    plus.onclick = function () { S.edit = { name: '', yearly: false }; draw(); };
    box.append(plus);
    return box;
  }
  function seasonsCard() {
    var c = el('div', { class: 'card' }, [el('h2', {}, ['Sărbători și sezoane']),
      el('div', { class: 'sub' }, ['Perioade în care prețul e altul. Prețul se scrie ' + (hotel ? unit : 'în ' + unit) + '. Ordinea: perioadă specială, apoi weekend, apoi prețul obișnuit.'])]);
    S.seasons.slice().sort(function (a, b) { return a.from < b.from ? -1 : 1; }).forEach(function (s) {
      c.append(S.edit === s.id ? seasonForm(s) : seasonItem(s));
    });
    if (!S.seasons.length && !S.edit) c.append(el('div', { class: 'sub' }, ['Nu ai încă nicio perioadă specială.']));
    if (S.edit && typeof S.edit === 'object') c.append(seasonForm(S.edit));
    else if (!S.edit) { c.append(el('div', { class: 'sub', style: 'margin-top:8px' }, ['Adaugă rapid:']), chips()); }
    return c;
  }

  // ---------- weekend (hotel) ----------
  function weekendCard() {
    var w = inp('number', S.weekendPct, 'ex.: 15', { inputmode: 'decimal', min: '0', max: '300', step: '0.5' });
    var m = el('div', { class: 'msg' });
    var b = el('button', { type: 'button' }, ['Salvează weekendul']);
    b.onclick = async function () {
      var n = w.value === '' ? null : Number(w.value);
      if (n !== null && (!isFinite(n) || n < 0 || n > 300)) return say(m, 'Scrie un procent între 0 și 300.', false);
      b.disabled = true; await save({ weekendPct: n }, 'Weekend salvat.'); b.disabled = false;
    };
    return el('div', { class: 'card' }, [el('h2', {}, ['Weekend']), el('div', { class: 'sub' }, ['Vineri și sâmbătă, fiecare cameră costă cu un procent mai mult decât în timpul săptămânii. Lasă gol dacă weekendul costă la fel.']),
      field('Cu cât mai scump (%)', w), b, m]);
  }

  // ---------- oferte ----------
  function offerForm() {
    var t = inp('text', '', 'ex.: 1 Decembrie: 10% reducere', { maxlength: '200' });
    var u = inp('date', '');
    var m = el('div', { class: 'msg' });
    var ok = el('button', { type: 'button' }, ['Adaugă oferta']);
    ok.onclick = async function () {
      if (!t.value.trim()) return say(m, 'Scrie oferta.', false);
      if (S.offers.length >= 20) return say(m, 'Maximum 20 de oferte. Șterge una veche.', false);
      ok.disabled = true; var d = await save({ offers: S.offers.concat([{ id: nid('o'), text: t.value.trim(), until: u.value || null, closed: false }]) }, 'Ofertă adăugată. Turistul o vede pe pagina pensiunii.'); if (!d) ok.disabled = false;
    };
    var no = el('button', { type: 'button', class: 's' }, ['Renunță']);
    no.onclick = function () { S.offerForm = false; draw(); };
    return el('div', { class: 'item' }, [field('Oferta (text scurt)', t), field('Valabilă până la (opțional; după această zi se închide singură)', u), el('div', { class: 'row', style: 'margin-top:8px' }, [ok, no]), m]);
  }
  function offerItem(o) {
    var st = o.closed ? 'closed' : (o.until && o.until < today ? 'expired' : 'active');
    var label = st === 'active' ? 'Activă' : (st === 'closed' ? 'Închisă' : 'Expirată');
    var tg = el('button', { type: 'button', class: 's mini' }, [st === 'active' ? 'Închide oferta' : 'Redeschide']);
    tg.onclick = function () {
      save({ offers: S.offers.map(function (x) { return x.id === o.id ? Object.assign({}, x, { closed: st === 'active', until: st === 'expired' ? null : x.until }) : x; }) }, st === 'active' ? 'Oferta e închisă: turistul nu o mai vede, dar o poți redeschide.' : 'Oferta e din nou activă.');
    };
    var del = el('button', { type: 'button', class: 'd mini' }, ['Șterge']);
    del.onclick = function () { if (!confirm('Ștergi definitiv oferta „' + o.text + '”?')) return; save({ offers: S.offers.filter(function (x) { return x.id !== o.id; }) }, 'Ofertă ștearsă.'); };
    return el('div', { class: 'item' }, [el('b', {}, [o.text]), pill(label, st === 'active' ? '' : 'off'),
      el('div', { class: 'sub', style: 'margin:2px 0' }, [o.until ? 'Până la ' + dmy(o.until) : 'Fără dată de final']), el('div', { class: 'row' }, [tg, del])]);
  }
  function offersCard() {
    var c = el('div', { class: 'card' }, [el('h2', {}, ['Oferte speciale']),
      el('div', { class: 'sub' }, ['Ofertele active apar pe pagina pensiunii. Poți să le închizi (rămân salvate) sau să le ștergi.'])]);
    S.offers.forEach(function (o) { c.append(offerItem(o)); });
    if (!S.offers.length) c.append(el('div', { class: 'sub' }, ['Nu ai nicio ofertă.']));
    if (S.offerForm) c.append(offerForm());
    else { var b = el('button', { type: 'button', class: 'mini', style: 'margin-top:8px' }, ['+ Ofertă nouă']); b.onclick = function () { S.offerForm = true; draw(); }; c.append(b); }
    return c;
  }

  function draw() {
    wrap.replaceChildren();
    if (hotel) wrap.append(weekendCard());
    wrap.append(seasonsCard(), offersCard(), msg);
  }
  draw();
  return wrap;
}

module.exports = { planCardsSrc: planCards.toString() };

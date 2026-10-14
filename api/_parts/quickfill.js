"use strict";
// „Completare rapidă”: proprietarul lipește descrierea pe care o are deja (din orice sursă) și completăm câmpurile
// din formularul de cazare (facilități, ore check-in/out, capacitate, descriere). Totul rulează în browser:
// textul nu pleacă pe server, nu citim alte platforme. Sunt doar sugestii, proprietarul verifică și corectează.

function html(lang, nonce) {
  const en = lang === "en";
  const t = (ro, e) => (en ? e : ro);
  return `<details class="acc-section-box" id="qfBox" style="margin:0 0 18px"><summary style="cursor:pointer;font-weight:700">⚡ ${t("Completare rapidă din descrierea ta", "Quick fill from your description")}</summary>
<p class="acc-white-hint" style="margin:10px 0">${t("Ai deja o descriere (de pe site-ul tău sau de oriunde)? Lipește-o aici și completăm facilitățile, orele de check-in/check-out, capacitatea. Textul nu se trimite nicăieri, iar tu verifici și corectezi totul.", "Already have a description (from your own site or anywhere)? Paste it here and we fill in amenities, check-in/out times, capacity. The text is not sent anywhere, and you review and correct everything.")}</p>
<textarea id="qfText" class="acc-white-input" rows="7" maxlength="8000" placeholder="${t("Lipește descrierea aici…", "Paste your description here…")}"></textarea>
<button type="button" id="qfGo" class="acc-edit-btn" style="margin-top:10px">${t("Completează câmpurile", "Fill in the fields")}</button>
<div id="qfOut" class="acc-white-hint" style="margin-top:10px" aria-live="polite"></div></details>
<script nonce="${nonce}">${JS(en)}</script>`;
}

function JS(en) {
  return `(function(){
var EN=${en ? "true" : "false"};
function norm(s){return String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();}
var AM=[['parcare',/parcar|parking/],['mic_dejun',/mic dejun|breakfast/],['wifi',/wi-?fi|\\bwlan\\b/],
['animale',/animale (de companie )?(acceptate|permise|binevenite)|accept(a|am|ati) animale|pet[- ]friendly|pets (are )?(allowed|welcome)/],
['piscina_incalzita',/piscina incalzita|heated (swimming )?pool/],['piscina',/piscina|swimming pool|\\bpool\\b/],
['aer_conditionat',/aer conditionat|air[- ]condition/],['jacuzzi',/jacuzzi|ciubar|hot tub/],['loc_de_joaca',/loc de joaca|playground/],
['gratar',/gratar|\\bbbq\\b|barbecue/],['bucatarie_utilata',/bucatarie (complet )?(utilata|echipata|dotata)|fully[- ]equipped kitchen/],
['masina_spalat_vase',/masina de spalat vase|dishwasher/],['masina_spalat',/masina de spalat (rufe|haine)|washing machine/],
['espressor',/espressor|expresor|filtru de cafea|coffee machine|nespresso/],['smart_tv',/smart ?tv|netflix/],
['receptie',/receptie|reception|front desk/],['restaurant_propriu',/restaurant (propriu|la parter|in incinta)|bar propriu|on-site restaurant/],
['plata_card',/plata cu cardul|card bancar|acceptam card|card payment|pay by card/],['sala_conferinte',/sala de conferint|sali de conferint|conference room/],
['curatenie_zilnica',/curatenie zilnica|daily cleaning|housekeeping/],['pescuit',/pescuit|fishing/],['sauna',/sauna/]];
function negated(t,i){return /(\\bnu|\\bfara|\\bno|\\bwithout)\\s+(\\w+\\s+){0,2}$/.test(t.slice(Math.max(0,i-22),i));}
function hhmm(h,m){h=+h;m=m==null||m===''?0:+m;if(!(h>=0&&h<=23&&m>=0&&m<=59))return '';return (h<10?'0':'')+h+':'+(m<10?'0':'')+m;}
function ev(e,n){e.dispatchEvent(new Event(n,{bubbles:true}));}
function setIfEmpty(id,v){var e=document.getElementById(id);if(!e||!v||String(e.value||'').trim())return false;e.value=v;ev(e,'input');ev(e,'change');return true;}
document.getElementById('qfGo').addEventListener('click',function(){
 var raw=document.getElementById('qfText').value||'',t=norm(raw),out=[],box=document.getElementById('qfOut');
 if(raw.trim().length<15){box.textContent=EN?'Paste a longer description first.':'Lipește mai întâi o descriere mai lungă.';return;}
 var got=[];
 AM.forEach(function(a){var m=a[1].exec(t);if(!m||negated(t,m.index))return;
  var cb=document.querySelector('input.acc-amenity[value="'+a[0]+'"]');if(cb&&!cb.checked){cb.checked=true;ev(cb,'change');var lab=cb.parentNode&&cb.parentNode.querySelector('span');got.push(lab?lab.textContent:a[0]);}});
 if(got.length)out.push((EN?'Amenities ticked: ':'Facilități bifate: ')+got.join(', '));
 var ci=/(check-?in|sosire|cazare de la|cazarea de la|arrival)[^0-9]{0,25}(\\d{1,2})(?:[:.h](\\d{2}))?/.exec(t),co=/(check-?out|plecare|eliberarea camerei|eliberare|departure)[^0-9]{0,25}(\\d{1,2})(?:[:.h](\\d{2}))?/.exec(t);
 if(ci&&setIfEmpty('dCheckin',hhmm(ci[2],ci[3])))out.push('Check-in '+hhmm(ci[2],ci[3]));
 if(co&&setIfEmpty('dCheckout',hhmm(co[2],co[3])))out.push('Check-out '+hhmm(co[2],co[3]));
 var cap=0,r,re=/(\\d{1,3})\\s*(persoane|locuri|oaspeti|turisti|guests|people|persons)/g;while((r=re.exec(t)))cap=Math.max(cap,+r[1]);
 if(cap>0&&setIfEmpty('dCapacity',String(cap)))out.push((EN?'Capacity ':'Capacitate ')+cap);
 if(setIfEmpty('dDescription',raw.trim().slice(0,5000)))out.push(EN?'Description filled in':'Descrierea a fost completată');
 box.textContent=out.length?(EN?'Done. ':'Gata. ')+out.join(' · ')+(EN?'. Please review everything below and correct what is not right.':'. Verifică tot mai jos și corectează ce nu e corect.'):(EN?'We found nothing new to fill in (the fields may already be filled).':'N-am găsit nimic nou de completat (poate câmpurile sunt deja completate).');
});
})();`;
}
module.exports = { html, JS };

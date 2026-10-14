"use strict";
// „Completare rapidă”: proprietarul lipește descrierea pe care o are deja (din orice sursă) și completăm câmpurile
// din formularul de cazare (facilități, ore check-in/out, capacitate, descriere). Totul rulează în browser:
// textul nu pleacă pe server, nu citim alte platforme. Sunt doar sugestii, proprietarul verifică și corectează.

function html(lang, nonce) {
  const en = lang === "en";
  const t = (ro, e) => (en ? e : ro);
  return `<style nonce="${nonce}">
#qfBox{margin:0 0 18px;border:0;padding:0;background:none}
#qfBox>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;box-sizing:border-box;background:#fff;border:2px solid #F0813A;border-radius:14px;padding:16px 20px;color:#E8751A;font-weight:800;font-size:16px;line-height:1.3;transition:background .15s,box-shadow .15s}
#qfBox .qf-title{display:flex;align-items:center;gap:10px;min-width:0;text-wrap:balance}
#qfBox .qf-ico{flex:none;display:inline-flex;align-items:center;justify-content:center;font-size:20px;line-height:1}
#qfBox>summary::-webkit-details-marker{display:none}
#qfBox>summary::marker{content:""}
#qfBox>summary:hover{background:#FFF6EE;box-shadow:0 2px 10px rgba(240,129,58,.25)}
#qfBox>summary:focus-visible{outline:3px solid rgba(240,129,58,.45);outline-offset:2px}
#qfBox .qf-chev{flex:none;align-self:center;width:11px;height:11px;border-right:3px solid #E8751A;border-bottom:3px solid #E8751A;transform:translateY(-3px) rotate(45deg);transition:transform .2s}
#qfBox[open]>summary .qf-chev{transform:translateY(3px) rotate(-135deg)}
#qfBox .qf-body{padding:14px 2px 0}
#qfGo{display:block;width:100%;box-sizing:border-box;margin-top:12px;background:#F0813A;color:#fff;border:0;border-radius:12px;padding:15px 18px;font-size:16px;font-weight:800;cursor:pointer;transition:background-color .3s ease,color .3s ease}
#qfGo:hover:not(:disabled){background:#E8751A}
#qfGo:disabled{background:#E3E8F0;color:#8A94A6;cursor:not-allowed}
#qfText{width:100%;box-sizing:border-box}
</style>
<details id="qfBox"><summary><span class="qf-title"><span class="qf-ico" aria-hidden="true">⚡</span><span>${t("Completează totul automat dintr-o descriere existentă", "Fill everything in automatically from an existing description")}</span></span><span class="qf-chev" aria-hidden="true"></span></summary>
<div class="qf-body"><p class="acc-white-hint" style="margin:0 0 10px">${t("Ai deja o descriere (de pe site-ul tău sau de oriunde)? Lipește-o aici și completăm facilitățile, orele de check-in/check-out și capacitatea. Textul nu se trimite nicăieri, iar tu verifici și corectezi totul.", "Already have a description (from your own site or anywhere)? Paste it here and we fill in amenities, check-in/out times and capacity. The text is not sent anywhere, and you review and correct everything.")}</p>
<textarea id="qfText" class="acc-white-input" rows="7" maxlength="8000" placeholder="${t("Lipește descrierea aici…", "Paste your description here…")}"></textarea>
<button type="button" id="qfGo" disabled>${t("Completează facilitățile acum", "Fill in the amenities now")}</button>
<div id="qfOut" class="acc-white-hint" style="margin-top:10px" aria-live="polite"></div></div></details>
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
var qfT=document.getElementById('qfText'),qfB=document.getElementById('qfGo');
function qfSync(){qfB.disabled=!(qfT.value||'').trim().length;}
['input','change','paste','keyup'].forEach(function(n){qfT.addEventListener(n,function(){setTimeout(qfSync,0);});});qfSync();
qfB.addEventListener('click',function(){if(qfB.disabled)return;
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

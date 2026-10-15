// Ghid pentru proprietari: „Utilizare platformă pentru rezervări” (tab în Contul meu > Informații).
// Conținut static, RO + EN; pagina îl afișează doar când funcția de rezervări e vizibilă.
// Rezervările se plătesc 100% online (Stripe): fără plată la proprietate; comision 10% (include procesarea plății).
"use strict";

const fig = (name, alt, cap) => `<figure style="margin:12px 0;text-align:center"><img src="/ghid-img/ghid-${name}.webp" alt="${alt}" width="260" loading="lazy" style="max-width:260px;width:100%;height:auto;border-radius:14px;border:1px solid rgba(128,128,128,.35)"><figcaption style="font-size:12.5px;opacity:.75;margin-top:4px">${cap}</figcaption></figure>`;

function buildRo() {
  return [
    { icon: "🚀", title: "1. Pe scurt: de la instalare la folosirea zilnică", open: true, html: `
<p><strong>Configurarea inițială</strong> (aproximativ 20 de minute, o singură dată):</p>
<ol>
<li><strong>Adăugarea locației:</strong> completează formularul „Cazare nouă”.</li>
<li><strong>Activarea rezervărilor:</strong> trimite-ne un mesaj rapid pe WhatsApp. Echipa noastră va activa modulul, iar în contul tău va apărea butonul <strong>📅 Rezervări și calendar</strong>.</li>
<li><strong>Tarife și sincronizare (iCal):</strong> setează tarifele de bază și conectează calendarul cu Booking.com sau Airbnb, ca să eviți suprapunerile.</li>
<li><strong>Activarea plăților (Stripe):</strong> apeși <strong>„Activează plățile”</strong> și completezi formularul Stripe (aproximativ 10 minute). Aici primești banii rezervărilor. Fără acest pas cazarea nu poate fi rezervată online. Tot aici alegi politica de anulare.</li>
<li><strong>Lansarea:</strong> după ce plățile sunt active, pornești opțiunea de rezervare instant și distribui linkul generat către clienții tăi.</li>
<li><strong>Instalarea aplicației:</strong> descarcă aplicația OHT Host pe telefon și activează accesul securizat prin Face ID, amprentă sau cod PIN.</li>
<li><strong>Verificarea finală:</strong> consultă lista <strong>„Gata de primit oaspeți”</strong> din partea de sus a ecranului, ca să fii sigur că nu ai omis niciun pas (inclusiv „Plăți online active”).</li>
</ol>
<ul>
<li><strong>Rutina zilnică</strong> (2 minute): deschizi aplicația, verifici secțiunea <em>Azi</em> (sosiri, plecări, camere libere sau alerte urgente) și răspunzi la <em>Mesaje</em>. Sincronizarea calendarelor și trimiterea instrucțiunilor de acces se fac complet automat.</li>
<li><strong>Activități lunare:</strong> descarci raportul financiar în format Excel direct din cont. Pentru rezervările plătite online cu comision, factura fiscală îți este trimisă automat pe e-mail.</li>
</ul>` },
    { icon: "📊", title: "2. Ce primești și cum funcționează", html: `
<ul>
<li><strong>Ecosistemul OHT:</strong> primești un calendar digital de rezervări dedicat proprietății tale, un link direct de rezervare pentru turiști și aplicația mobilă OHT Host, pentru gestionarea business-ului de oriunde.</li>
<li><strong>Fluxul turistului:</strong> clientul selectează perioada, vede prețul final calculat dinamic, își validează adresa de e-mail printr-un cod unic și <strong>plătește online, cu cardul</strong>. Rezervarea se confirmă instant, iar tu ești notificat pe telefon și pe e-mail.</li>
<li><strong>Protecție overbooking:</strong> zilele confirmate se blochează automat, în timp real, în calendarul tău.</li>
<li><strong>Plata este 100% online, prin platformă:</strong>
<ul>
<li>Turistul plătește cu cardul la rezervare (avans sau integral, după politica de anulare aleasă de tine). Banii sunt păstrați în siguranță până la check-in.</li>
<li>La 24 de ore după check-in, banii îți sunt virați direct în contul bancar prin Stripe, minus comisionul. La fiecare virare primești un e-mail cu suma.</li>
<li>Comisionul este <strong>10%</strong> și include procesarea plății: nu plătești separat taxe de card.</li>
<li><strong>Beneficiu:</strong> primele 5 rezervări online din contul tău au comision 0%.</li>
</ul></li>
<li><strong>Contactul tău rămâne protejat:</strong> telefonul, e-mailul și adresa exactă nu se văd pe pagina cazării. Turistul le primește abia după ce rezervarea este confirmată și plătită, în e-mailul de confirmare și pe pagina rezervării. Până atunci te poate contacta prin formularul de mesaje al platformei.</li>
<li><strong>Dacă plățile nu sunt active:</strong> cazarea rămâne în director, cu datele tale de contact vizibile, dar pe pagină apare „Rezervare online indisponibilă momentan”.</li>
<li><strong>Flexibilitate mobilă:</strong> din aplicația de telefon gestionezi calendarul, mesajele, personalul și notificările. Modificarea detaliilor cazării sau încărcarea fotografiilor noi se face din contul de pe site.</li>
</ul>` },
    { icon: "⚙️", title: "3. Prima configurare (o singură dată, din cont)", html: `
<ul>
<li><strong>Tariful de bază:</strong> se configurează din <em>Proprietățile mele → 📅 Rezervări și calendar</em>. Prețurile stabilite aici rămân sincronizate cu aplicația OHT Host.</li>
<li><strong>Perioade și tarife speciale:</strong> poți aplica șabloane (weekend, Crăciun, Revelion, sezon de vară) sau îți creezi propriile intervale, cu prețuri dedicate și nopți minime. Butonul <em>Verifică un preț</em> îți arată costul exact al unei perioade.</li>
<li><strong>Gestiunea pe camere:</strong> dacă închiriezi camere separat, le configurezi aici, cu preț și capacitate proprie. Dacă nu adaugi camere, toată proprietatea se rezervă ca o singură unitate. Poți oferi și un discount procentual pentru închirierea întregii pensiuni.</li>
<li><strong>Conectarea iCal:</strong> copiază linkul iCal de la Booking sau Airbnb și lipește-l la noi, apoi preia linkul nostru și adaugă-l în conturile celorlalte platforme. Disponibilitatea se actualizează automat în ambele sensuri, în câteva minute. Folosește <em>Previzualizare</em> înainte de salvare.</li>
<li><strong>Activarea plăților (Stripe)</strong> — pasul care deschide rezervările online:
<ul>
<li>Apeși <strong>„Activează plățile”</strong> (în cont, la <em>Rezervare instant</em>, sau în aplicație, la <em>Setări → Rezervare instant</em>). Te duce pe formularul securizat Stripe.</li>
<li>Ai nevoie de: datele tale (sau ale firmei/PFA), un act de identitate, adresa, un număr de telefon și <strong>IBAN-ul</strong> în care vrei să primești banii. Durează aproximativ 10 minute.</li>
<li>Starea plăților apare mereu la <em>Rezervare instant</em> și în lista „Gata de primit oaspeți”: <strong>neconectat</strong> (nu ai început sau nu ai terminat), <strong>în verificare</strong> (Stripe verifică datele, de obicei câteva ore, uneori 1–2 zile) sau <strong>activ</strong> (poți primi rezervări).</li>
<li>Rezervarea instant se poate porni doar când plățile sunt active.</li>
<li>Dacă nu activezi plățile, îți trimitem un e-mail de reamintire după 1 zi și încă unul după 7 zile.</li>
</ul></li>
<li><strong>Politica de anulare:</strong> în secțiunea <em>Politica de anulare și reduceri</em> alegi între Flexibilă, Moderată sau Strictă. Politica aleasă este afișată turistului înainte de plată.</li>
</ul>` },
    { icon: "📲", title: "4. Cum instalezi aplicația OHT Host", html: `
<p>Aplicația OHT Host este o aplicație web progresivă (PWA). Se instalează direct din browser, fără App Store sau Google Play. Este gratuită și nu ocupă aproape deloc spațiu.</p>
<p><strong>Pe iPhone (Safari):</strong></p>
<ol><li>Deschide <strong>Safari</strong> (nu Chrome) și accesează <a href="https://host.opening-hours-today.eu/gazda/">host.opening-hours-today.eu</a>.</li><li>Apasă butonul <strong>Partajare / Share</strong> (pătratul cu săgeată în sus).</li><li>Derulează și alege <strong>Adaugă pe ecranul principal / Add to Home Screen</strong>, apoi <strong>Adaugă</strong>.</li><li>Deschide aplicația nouă direct de pe ecranul telefonului.</li></ol>
<p><strong>Pe Android (Chrome):</strong></p>
<ol><li>Deschide Chrome și accesează <a href="https://host.opening-hours-today.eu/gazda/">host.opening-hours-today.eu</a>.</li><li>Apasă butonul <strong>Instalează aplicația</strong> (sau meniul ⋮ din dreapta sus → <strong>Instalează aplicația</strong>).</li><li>Deschide aplicația de pe ecranul principal.</li></ol>
<p><strong>Pe calculator:</strong> nu e nevoie să instalezi nimic. Folosești pagina de rezervări din cont, direct în browser.</p>${fig("instalare", "Ecranul de instalare OHT Host", "Ecranul de instalare (datele sunt fictive, doar pentru exemplu)")}` },
    { icon: "🔐", title: "5. Cum intri în aplicație: Face ID, amprentă sau PIN", html: `
<p>Nu ai nicio parolă de ținut minte și nu primești linkuri lungi pe e-mail. Accesul este securizat și durează două secunde.</p>${fig("login", "Ecranul de pornire OHT Host", "Ecranul de pornire")}
<p><strong>Ce alegi la prima deschidere:</strong></p>
<ul>
<li><strong>Face ID / amprentă:</strong> cea mai rapidă metodă. Merge dacă telefonul tău se deblochează cu fața sau cu amprenta (verifici în setările telefonului).</li>
<li><strong>Cod PIN de 6 cifre:</strong> alternativă sigură, aleasă de tine. Codurile foarte simple (123456, 111111) sunt respinse.</li>
</ul>
<p><strong>Pas cu pas, la prima conectare:</strong></p>
<ol>
<li>De pe telefon sau calculator, intră în contul tău de pe opening-hours-today.eu, la <strong>Proprietățile mele</strong>.</li>
<li>Apasă <strong>📅 Rezervări și calendar</strong> la cazarea ta.</li>
<li>În caseta aplicației OHT Host apasă <strong>Generează cod</strong>. Primești un cod unic de 8 caractere, valabil 10 minute, o singură dată.</li>
<li>Deschide aplicația instalată pe telefon, scrie codul în câmpul de sus și apasă <strong>Activează cu PIN</strong>.</li>
<li>Alege PIN-ul tău de 6 cifre. Conectarea este gata.</li>
</ol>
<p><strong>Reguli importante de securitate:</strong></p>
<ul>
<li><strong>Face ID mai târziu:</strong> dacă ai început cu PIN, poți adăuga oricând Face ID din <em>Setări → Dispozitivele mele → Adaugă Face ID pe acest telefon</em>.</li>
<li><strong>Acțiuni importante</strong> (anulare, refuz, reținere din garanție, ștergerea unui telefon, schimbarea mesajului de sosire): aplicația cere din nou Face ID sau PIN dacă au trecut mai mult de 10 minute.</li>
<li><strong>Blocare:</strong> 5 PIN-uri greșite la rând blochează telefonul. Îl deblochezi generând un cod nou din contul de pe site.</li>
<li><strong>Telefon pierdut sau furat:</strong> intră din alt aparat, mergi la <em>Setări → Dispozitivele mele</em>, găsește telefonul vechi și apasă <strong>Șterge</strong>. Accesul se oprește imediat.</li>
</ul>` },
    { icon: "📱", title: "6. Cele 6 ecrane ale aplicației", html: `
<p>Dacă ai mai multe proprietăți, folosești selectorul de sus ca să treci de la una la alta. Taburile sunt jos (capturile au date fictive):</p>
<p><strong>1. Azi.</strong> Câte camere sunt libere în seara asta (cu butoane de închidere/deschidere), sosirile din următoarele 7 zile, oaspeții de la tine, plecările și lista <em>De rezolvat</em> (diferențe de plată, erori iCal, suprapuneri). Butonul <em>Am camere libere în seara asta</em> afișează pe site o etichetă promoțională până la miezul nopții.</p>${fig("azi", "Ecranul Azi", "Tabul Azi")}
<p><strong>2. Calendar.</strong> Închizi sau deschizi manual zile (renovare, ocupat în afara platformei). Culori: gri = închis de tine, albastru = ocupat pe altă platformă (iCal), galben = rezervare în curs de confirmare, verde închis = rezervare fermă. La proprietățile cu mai multe camere alegi întâi camera.</p>${fig("cal", "Ecranul Calendar", "Tabul Calendar")}
<p><strong>3. Rezervări.</strong> Sejururile viitoare, cu fișele de cazare completate, starea plății și butoanele <strong>Anulează</strong>, <strong>Refuză</strong> și <strong>Trimite acces</strong>.</p>${fig("rez", "Ecranul Rezervări", "Tabul Rezervări")}
<p><strong>4. Setări.</strong> Rezervarea instant și <strong>starea plăților (Activează plățile)</strong>, notificările, mesajul de sosire, accesul pentru personal și dispozitivele tale. Tarifele detaliate, camerele, politica de anulare și iCal se editează din cont, la <em>Setări → Deschide în cont</em>.</p>${fig("setari", "Ecranul Setări", "Tabul Setări")}
<p><strong>5. Mesaje</strong> (doar pentru proprietar): căsuța pentru mesajele turiștilor. Numărul de mesaje necitite apare lângă numele tabului.</p>${fig("mesaje", "Ecranul Mesaje", "Tabul Mesaje")}
<p><strong>6. Cont:</strong> scurtătură securizată către contul tău de pe opening-hours-today.eu, deja conectat.</p>` },
    { icon: "☀️", title: "7. Rutina zilnică (2 minute)", html: `
<ol>
<li><strong>Dimineața:</strong> deschizi <em>Azi</em>. Verifici „De rezolvat”, sosirile și camerele libere. Dacă vrei oaspeți de ultim moment, apeși <em>Am camere libere în seara asta</em>.</li>
<li><strong>Mesaje:</strong> deschizi tabul <em>Mesaje</em>, răspunzi direct pe e-mailul turistului și marchezi mesajul ca citit.</li>
<li><strong>Disponibilitate:</strong> dacă ai o rezervare luată direct (telefon, la recepție) sau blochezi o cameră, treci imediat modificarea în <em>Calendar</em>, ca să eviți suprapunerile pe celelalte platforme.</li>
<li><strong>Primirea oaspeților:</strong> instrucțiunile de check-in se trimit automat. Dacă trimiterea automată e oprită, apeși manual <em>Trimite acces</em> din ecranul rezervării.</li>
<li><strong>Seara:</strong> nu ai nimic obligatoriu de făcut. Notificările te anunță în timp real, iar sincronizarea iCal merge singură în fundal.</li>
</ol>` },
    { icon: "💬", title: "8. Mesajele de la vizitatori", html: `
<ul>
<li><strong>Trimiterea mesajelor:</strong> turiștii îți scriu direct de pe pagina cazării, prin butonul <em>Trimite mesaj</em>, fără cont. Înainte de rezervare, mesajul este modul prin care te pot contacta.</li>
<li><strong>Unde ajung:</strong> ca notificare pe telefon, în tabul <em>Mesaje</em> din aplicație/site și pe e-mailul tău.</li>
<li><strong>Cum răspunzi:</strong> nu există chat. Apeși <em>Răspunde</em> din e-mail (conține adresa turistului) sau îl suni, dacă a lăsat telefon, apoi marchezi mesajul ca citit.</li>
<li><strong>Păstrare:</strong> mesajele se păstrează 12 luni, apoi se șterg automat.</li>
<li><strong>Confidențialitate:</strong> angajații adăugați de tine nu au acces la mesaje; le vezi doar tu, ca administrator.</li>
</ul>` },
    { icon: "🔔", title: "9. Notificări și mesajul automat de sosire", html: `
<ul>
<li><strong>Activare:</strong> din <em>Setări → Notificări</em>. Pe iPhone merg doar după ce aplicația a fost adăugată pe ecranul principal (minim iOS 16.4).</li>
<li><strong>Ce notificări primești:</strong> rezervare nouă, anulare, plată online eșuată. În fiecare dimineață (între 8:00 și 10:00) primești un rezumat: sosiri, plecări și rezervări apropiate cu fișe de cazare necompletate.</li>
<li><strong>Virările:</strong> după fiecare virare de bani în contul tău primești un e-mail cu suma (de exemplu „Ai primit 840 RON”).</li>
<li><strong>Mesajul de sosire:</strong> din <em>Setări → Mesaj de sosire</em> scrii ghidul oaspetelui (chei, cod de la poartă, reguli, repere) și alegi ca platforma să-l trimită automat cu 1 sau 2 zile înainte de sosire.</li>
<li><strong>Excepții:</strong> mesajul se trimite doar între 9:00 și 21:00. Dacă o plată programată este restantă, trimiterea automată se oprește și ești anunțat, ca să decizi tu dacă apeși <em>Trimite acces</em>. Fișa legală poate fi completată și după primirea mesajului, sau la locație, din linkul inclus.</li>
</ul>` },
    { icon: "👥", title: "10. Acces pentru personal (recepție, familie, curățenie)", html: `
<ul>
<li><strong>Adăugare:</strong> din <em>Setări → Personal</em> apeși <em>Adaugă o persoană</em>, îi pui un nume și alegi proprietățile. Se generează un cod valabil 30 de minute.</li>
<li><strong>Configurarea persoanei:</strong> intră de pe telefonul ei pe host.opening-hours-today.eu, scrie codul și își alege un PIN de 6 cifre.</li>
<li><strong>Ce poate face:</strong> vede calendarul, detaliile operative ale rezervărilor (nume, telefon, perioadă), camerele libere și poate închide sau deschide zile.</li>
<li><strong>Ce NU poate face:</strong> nu vede mesajele turiștilor, tarifele, încasările sau sumele, nu poate anula ori refuza rezervări și nu poate schimba setările sau alte dispozitive.</li>
<li><strong>Revocare:</strong> poți șterge sau bloca oricând un dispozitiv din <em>Setări → Dispozitivele mele</em>.</li>
</ul>` },
    { icon: "🧾", title: "11. Ce se întâmplă când vine o rezervare", html: `
<ol>
<li><strong>Alegerea și blocarea zilelor:</strong> turistul alege perioada, vede prețul final și își introduce datele. Calendarul blochează zilele câteva minute, în care el își validează e-mailul cu un cod.</li>
<li><strong>Plata:</strong> după cod, turistul plătește online, cu cardul (avansul sau suma integrală, după politica de anulare). Politica îi este afișată și o acceptă înainte să plătească.</li>
<li><strong>Confirmarea:</strong> imediat după plată rezervarea devine fermă. Primești notificare în aplicație și e-mail, iar zilele rămân blocate definitiv în calendar. <strong>Abia acum turistul primește telefonul, e-mailul și adresa exactă a cazării</strong>, în e-mailul de confirmare și pe pagina rezervării.</li>
<li><strong>Fișele legale:</strong> turistul primește un link securizat unde fiecare membru al grupului completează fișa de cazare. Datele sunt criptate și le vezi doar tu, din cont.</li>
<li><strong>Instrucțiunile de acces:</strong> cu 1 sau 2 zile înainte de sosire, platforma trimite automat mesajul tău de check-in (dacă ai activat opțiunea).</li>
<li><strong>Ștergerea automată:</strong> după sejur, datele personale din fișe se șterg din sistem, conform termenelor legale.</li>
<li><strong>Banii:</strong> la 24 de ore după check-in, suma (minus comisionul) este virată în contul tău, iar tu primești un e-mail.</li>
</ol>
<p><strong>Rezervările de pe alte canale</strong> (Booking, Airbnb) se importă automat prin iCal. Dacă apare o suprapunere, primești imediat o alertă în <em>Azi</em>.</p>` },
    { icon: "❌", title: "12. Anulare, refuz și penalități", html: `
<p><strong>Politicile de anulare</strong> (le alegi tu; se aplică la toate rezervările, iar turistul o vede și o acceptă înainte să plătească):</p>
<ul>
<li><strong>Flexibilă:</strong> anulare gratuită cu mai mult de 48 de ore înainte de check-in. După aceea se reține prima noapte. Avansul este 30% sau prima noapte, dacă aceasta e mai mare.</li>
<li><strong>Moderată:</strong> anulare gratuită cu mai mult de 7 zile înainte de check-in. După aceea se reține 50% din total. Avansul este 50%.</li>
<li><strong>Strictă (nerambursabilă):</strong> nu se returnează nimic la anulare. Turistul primește automat 10% reducere și plătește 100% la rezervare.</li>
</ul>
<p><strong>Reguli de plată:</strong> anularea este posibilă până la ora de check-in a cazării. La rezervările făcute cu mai mult de 30 de zile înainte de sosire se încasează doar avansul; restul se debitează automat de pe cardul turistului cu 30 de zile înainte de check-in, dacă a bifat acordul. Dacă debitarea restului eșuează, turistul are 48 de ore să plătească altfel; după aceea rezervarea se anulează și se aplică politica aleasă.</p>
<ul>
<li><strong>Dacă anulează turistul:</strong> zilele se eliberează automat. Platforma calculează singură ce se returnează și ce se reține; penalitatea ajunge la tine, minus comisionul.</li>
<li><strong>Dacă anulezi tu:</strong> calendarul se deblochează, iar turistul primește înapoi toată suma plătită, inclusiv comisionul.</li>
<li><strong>Refuzul unui oaspete:</strong> dacă ai date false, fișe incomplete sau comportament nepotrivit, poți refuza rezervarea alegând un motiv obligatoriu și adăugând un comentariu scurt. Turistul este rambursat integral, iar evenimentul se înregistrează (refuzurile repetate nejustificate sunt analizate de platformă).</li>
</ul>
<p><strong>Important:</strong> banii rezervărilor trec prin platformă și sunt păstrați în siguranță până la check-in. Dacă o plată este rambursată, contestată la bancă (chargeback) sau anulată, platforma poate reține sau anula virarea corespunzătoare și poate cere restituirea sumei dacă a fost deja virată.</p>` },
    { icon: "💶", title: "13. Banii: comision, plată și raport", html: `
<ul>
<li><strong>Comisionul:</strong> 10% din sumele încasate efectiv online (inclusiv din penalitățile reținute la o anulare târzie). Include procesarea plății, deci nu ai taxe separate de card. Rezervările făcute înainte de schimbarea la 10% își păstrează comisionul de la data rezervării.</li>
<li><strong>Promoție:</strong> primele 5 rezervări online din contul tău au comision 0%. Rezervările rambursate integral nu consumă din cele 5.</li>
<li><strong>Virarea banilor:</strong> prin Stripe, în contul tău bancar, la 24 de ore după check-in. Pentru asta, contul Stripe trebuie să fie <strong>activ</strong> (vezi starea la <em>Rezervare instant</em>). Banii ajung în bancă, de obicei, în 1–3 zile lucrătoare de la virare. La fiecare virare primești un e-mail cu suma.</li>
<li><strong>Facturare:</strong> factura pentru comision se trimite automat pe e-mailul tău de facturare, pe baza datelor firmei din cont. Factura pentru serviciile de cazare către turist o emiți tu.</li>
<li><strong>Raport Excel:</strong> îl descarci oricând din cont, pe perioada dorită; conține sumele brute, comisioanele și sumele nete. Păstrează fișierul cu grijă (conține date ale turiștilor) și șterge-l după folosire.</li>
</ul>` },
    { icon: "🛡️", title: "14. Datele oaspeților", html: `
<ul>
<li><strong>Criptare:</strong> datele din fișele de cazare sunt stocate securizat. Seria/numărul actului de identitate și CNP-ul (opțional) nu se salvează niciodată în clar.</li>
<li><strong>Jurnal de acces:</strong> datele se văd doar din contul tău de administrator, iar fiecare vizualizare este înregistrată în jurnalul de securitate.</li>
<li><strong>Ștergere automată:</strong> datele oaspeților se șterg la 90 de zile după check-out, sau imediat dacă rezervarea este anulată.</li>
<li><strong>Folosire:</strong> doar pentru evidența legală a turiștilor. Nu le trimite prin canale nesecurizate (e-mail obișnuit, WhatsApp).</li>
<li><strong>Datele tale față de turist:</strong> telefonul și adresa exactă se arată turistului doar după rezervarea plătită.</li>
<li><strong>Mesageria platformei:</strong> mesajele de la vizitatori se păstrează 12 luni, apoi se șterg automat. Folosește datele din ele doar ca să răspunzi.</li>
</ul>` },
    { icon: "❓", title: "15. Probleme frecvente", html: `
<ul>
<li><strong>Nu văd butonul „Rezervări și calendar”:</strong> modulul nu este încă activat pentru proprietatea ta. Scrie-ne pe WhatsApp și îl activăm.</li>
<li><strong>Pe pagina cazării scrie „Rezervare online indisponibilă momentan”:</strong> plățile (Stripe) nu sunt active. Deschide <em>Rezervare instant</em>, vezi starea și apasă <em>Activează plățile</em> sau <em>Continuă configurarea</em>. Dacă e „în verificare”, așteaptă confirmarea Stripe.</li>
<li><strong>Nu pot porni rezervarea instant:</strong> se poate porni doar când plățile sunt active.</li>
<li><strong>Stripe îmi cere date suplimentare:</strong> apasă <em>Continuă configurarea</em> și completează ce lipsește (de obicei documentul de identitate sau IBAN-ul).</li>
<li><strong>Aplicația nu îmi recunoaște contul:</strong> dacă ai reinstalat aplicația sau ai schimbat telefonul, reiei conectarea cu un cod nou de 8 caractere din contul de pe site.</li>
<li><strong>Nu am opțiunea Face ID / amprentă:</strong> ai nevoie de minim iOS 16, Safari actualizat și deblocare biometrică activă în setările telefonului. Altfel folosește PIN-ul.</li>
<li><strong>Nu primesc notificări pe iPhone:</strong> aplicația trebuie adăugată pe ecranul principal, iar notificările permise din <em>Setări → Notificări → OHT Host</em>.</li>
<li><strong>Calendarul arată zile ocupate necunoscute:</strong> sunt marcate cu albastru și vin din iCal (Booking/Airbnb). Se eliberează automat când anulezi rezervarea pe acea platformă.</li>
<li><strong>Un turist nu poate finaliza rezervarea:</strong> verifică nopțile minime, zilele permise pentru sosire/plecare și anticiparea minimă din setări.</li>
<li><strong>Ce primește oaspetele dacă anulează?</strong> Se calculează automat, după politica de anulare a cazării (Flexibilă, Moderată sau Strictă).</li>
<li><strong>În cât timp îmi intră banii?</strong> Se virează automat prin Stripe la 24 de ore după check-in, dacă ai contul Stripe activ. Din cont în banca ta durează, de obicei, 1–3 zile lucrătoare.</li>
<li><strong>Nu găsesc mesajele turiștilor pe e-mail:</strong> verifică Spam/Junk. Mesajele sunt oricum salvate în tabul <em>Mesaje</em>.</li>
<li><strong>„Gata de primit oaspeți” arată o eroare la calendar:</strong> dacă ești listat doar la noi și nu folosești Booking sau Airbnb, o poți ignora.</li>
</ul>
<p>Ai nevoie de ajutor? Scrie-ne pe <a href="/cont/contact">WhatsApp</a> și te ajutăm cu drag.</p>` },
  ];
}

function buildEn() {
  return [
    { icon: "🚀", title: "1. In short: from install to daily use", open: true, html: `
<p><strong>Initial setup</strong> (about 20 minutes, once):</p>
<ol>
<li><strong>Add your property:</strong> fill in the “New accommodation” form.</li>
<li><strong>Enable bookings:</strong> send us a quick message on WhatsApp. We switch the module on and the <strong>📅 Bookings &amp; calendar</strong> button appears in your account.</li>
<li><strong>Rates and sync (iCal):</strong> set your base rates and link your calendar with Booking.com or Airbnb to avoid double bookings.</li>
<li><strong>Activate payments (Stripe):</strong> tap <strong>“Activate payments”</strong> and fill in the Stripe form (about 10 minutes). This is where you receive the booking money. Without it your property cannot be booked online. This is also where you choose the cancellation policy.</li>
<li><strong>Launch:</strong> once payments are active, switch on instant booking and share the generated link with your guests.</li>
<li><strong>Install the app:</strong> get the OHT Host app on your phone and turn on secure access with Face ID, fingerprint or PIN.</li>
<li><strong>Final check:</strong> use the <strong>“Ready for guests”</strong> checklist at the top of the screen to make sure no step was missed (including “Online payments active”).</li>
</ol>
<ul>
<li><strong>Daily routine</strong> (2 minutes): open the app, check <em>Today</em> (arrivals, departures, free rooms or urgent alerts) and answer <em>Messages</em>. Calendar sync and access instructions run fully automatically.</li>
<li><strong>Monthly:</strong> download the financial report in Excel from your account. For online bookings with commission, the tax invoice is e-mailed to you automatically.</li>
</ul>` },
    { icon: "📊", title: "2. What you get and how it works", html: `
<ul>
<li><strong>The OHT ecosystem:</strong> a booking calendar for your property, a direct booking link for guests and the OHT Host mobile app to run your business from anywhere.</li>
<li><strong>The guest flow:</strong> the guest picks dates, sees the final price, confirms their e-mail with a one-time code and <strong>pays online by card</strong>. The booking is confirmed instantly and you are notified on your phone and by e-mail.</li>
<li><strong>Overbooking protection:</strong> confirmed days are blocked automatically, in real time, in your calendar.</li>
<li><strong>Payment is 100% online, through the platform:</strong>
<ul>
<li>The guest pays by card when booking (an advance or in full, depending on the cancellation policy you chose). The money is held safely until check-in.</li>
<li>24 hours after check-in the money is paid out to your bank account through Stripe, minus the commission. You get an e-mail with the amount for every payout.</li>
<li>The commission is <strong>10%</strong> and includes payment processing: you do not pay separate card fees.</li>
<li><strong>Bonus:</strong> the first 5 online bookings of your account have 0% commission.</li>
</ul></li>
<li><strong>Your contact stays protected:</strong> your phone, e-mail and exact address are not shown on the listing page. The guest receives them only once the booking is confirmed and paid, in the confirmation e-mail and on the booking page. Until then they can reach you through the platform's message form.</li>
<li><strong>If payments are not active:</strong> the property stays in the directory with your contact details visible, but the page shows “Online booking currently unavailable”.</li>
<li><strong>Mobile flexibility:</strong> from the phone app you manage the calendar, messages, staff and notifications. Changing property details or uploading new photos is done from your account on the site.</li>
</ul>` },
    { icon: "⚙️", title: "3. First setup (once, from your account)", html: `
<ul>
<li><strong>Base rate:</strong> set it under <em>My properties → 📅 Bookings &amp; calendar</em>. Prices set here stay in sync with the OHT Host app.</li>
<li><strong>Special periods and rates:</strong> apply templates (weekend, Christmas, New Year, summer) or build your own intervals with dedicated prices and minimum nights. <em>Check a price</em> shows the exact cost of a period.</li>
<li><strong>Rooms:</strong> if you rent rooms separately, add them here with their own price and capacity. With no rooms added, the whole property is booked as one unit. You can also offer a percentage discount for renting the whole guesthouse.</li>
<li><strong>iCal sync:</strong> copy the iCal link from Booking or Airbnb and paste it here, then take our iCal link and add it to the other platforms. Availability updates automatically both ways within minutes. Use <em>Preview</em> before saving.</li>
<li><strong>Activate payments (Stripe)</strong> — the step that opens online booking:
<ul>
<li>Tap <strong>“Activate payments”</strong> (in your account under <em>Instant booking</em>, or in the app under <em>Settings → Instant booking</em>). It opens the secure Stripe form.</li>
<li>You need: your details (or your company's), an ID document, your address, a phone number and the <strong>IBAN</strong> where you want to be paid. It takes about 10 minutes.</li>
<li>The status always shows under <em>Instant booking</em> and in the “Ready for guests” list: <strong>not connected</strong> (not started or not finished), <strong>under review</strong> (Stripe is checking your details, usually a few hours, sometimes 1–2 days) or <strong>active</strong> (you can receive bookings).</li>
<li>Instant booking can only be switched on when payments are active.</li>
<li>If you do not activate payments we send a reminder e-mail after 1 day and another after 7 days.</li>
</ul></li>
<li><strong>Cancellation policy:</strong> under <em>Cancellation policy and discounts</em> choose Flexible, Moderate or Strict. The guest sees it before paying.</li>
</ul>` },
    { icon: "📲", title: "4. How to install the OHT Host app", html: `
<p>OHT Host is a progressive web app (PWA). It installs straight from the browser, with no App Store or Google Play. It is free and takes almost no space.</p>
<p><strong>iPhone (Safari):</strong></p>
<ol><li>Open <strong>Safari</strong> (not Chrome) and go to <a href="https://host.opening-hours-today.eu/gazda/">host.opening-hours-today.eu</a>.</li><li>Tap <strong>Share</strong> (the square with an arrow pointing up).</li><li>Scroll and choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li><li>Open the new app from your home screen.</li></ol>
<p><strong>Android (Chrome):</strong></p>
<ol><li>Open Chrome and go to <a href="https://host.opening-hours-today.eu/gazda/">host.opening-hours-today.eu</a>.</li><li>Tap the <strong>Install app</strong> button (or menu ⋮ → <strong>Install app</strong>).</li><li>Open the app from your home screen.</li></ol>
<p><strong>On a computer</strong> you do not need to install anything. Use the bookings page in your account, in the browser.</p>${fig("instalare", "OHT Host install screen", "Install screen (sample data)")}` },
    { icon: "🔐", title: "5. Signing in: Face ID, fingerprint or PIN", html: `
<p>No password to remember and no long e-mail links. Access is secure and takes two seconds.</p>${fig("login", "OHT Host start screen", "Start screen")}
<p><strong>What you choose the first time:</strong></p>
<ul>
<li><strong>Face ID / fingerprint:</strong> the fastest. It works if your phone unlocks with your face or fingerprint (check your phone's settings).</li>
<li><strong>6-digit PIN:</strong> a safe alternative that you choose. Very simple codes (123456, 111111) are rejected.</li>
</ul>
<p><strong>Step by step, the first time:</strong></p>
<ol>
<li>On your phone or computer, sign in to your account at opening-hours-today.eu, under <strong>My properties</strong>.</li>
<li>Tap <strong>📅 Bookings &amp; calendar</strong> on your property.</li>
<li>In the OHT Host box tap <strong>Generate code</strong>. You get a unique 8-character code, valid for 10 minutes, usable once.</li>
<li>Open the installed app, type the code in the top field and tap <strong>Activate with PIN</strong>.</li>
<li>Choose your 6-digit PIN. You are connected.</li>
</ol>
<p><strong>Important security rules:</strong></p>
<ul>
<li><strong>Face ID later:</strong> if you started with a PIN you can add Face ID any time from <em>Settings → My devices → Add Face ID on this phone</em>.</li>
<li><strong>Important actions</strong> (cancel, refuse, guarantee, deleting a phone, changing the arrival message): the app asks for Face ID or PIN again after 10 minutes.</li>
<li><strong>Lock:</strong> 5 wrong PINs in a row lock the phone. Unlock it by generating a new code from your account on the site.</li>
<li><strong>Lost or stolen phone:</strong> sign in from another device, go to <em>Settings → My devices</em>, find the old phone and tap <strong>Delete</strong>. Access stops immediately.</li>
</ul>` },
    { icon: "📱", title: "6. The 6 screens of the app", html: `
<p>If you have several properties, use the switcher at the top. The tabs are at the bottom (screenshots use sample data):</p>
<p><strong>1. Today.</strong> Free rooms tonight (with close/open buttons), arrivals in the next 7 days, guests staying, departures and the <em>Things to fix</em> list (payment differences, iCal errors, overlaps). The <em>Free rooms tonight</em> button shows a promo label on the site until midnight.</p>${fig("azi", "Today screen", "Today")}
<p><strong>2. Calendar.</strong> Close or reopen days manually (renovation, taken outside the platform). Colours: grey = closed by you, blue = taken on another platform (iCal), yellow = booking being confirmed, dark green = confirmed booking. For properties with several rooms pick the room first.</p>${fig("cal", "Calendar screen", "Calendar")}
<p><strong>3. Bookings.</strong> Upcoming stays with completed registration forms, payment status and the <strong>Cancel</strong>, <strong>Refuse</strong> and <strong>Send access</strong> buttons.</p>${fig("rez", "Bookings screen", "Bookings")}
<p><strong>4. Settings.</strong> Instant booking and the <strong>payment status (Activate payments)</strong>, notifications, arrival message, staff access and your devices. Detailed rates, rooms, cancellation policy and iCal are edited from your account, under <em>Settings → Open in account</em>.</p>${fig("setari", "Settings screen", "Settings")}
<p><strong>5. Messages</strong> (owner only): the inbox for guests' messages. The unread count shows next to the tab name.</p>${fig("mesaje", "Messages screen", "Messages")}
<p><strong>6. Account:</strong> a secure shortcut to your account on opening-hours-today.eu, already signed in.</p>` },
    { icon: "☀️", title: "7. Daily routine (2 minutes)", html: `
<ol>
<li><strong>Morning:</strong> open <em>Today</em>. Check “Things to fix”, arrivals and free rooms. Want last-minute guests? Tap <em>Free rooms tonight</em>.</li>
<li><strong>Messages:</strong> open the <em>Messages</em> tab, reply straight to the guest's e-mail and mark the message as read.</li>
<li><strong>Availability:</strong> if you take a booking directly (phone, front desk) or block a room, enter it in <em>Calendar</em> right away to avoid overlaps on the other platforms.</li>
<li><strong>Welcoming guests:</strong> check-in instructions are sent automatically. If automatic sending is off, tap <em>Send access</em> on the booking.</li>
<li><strong>Evening:</strong> nothing is required. Notifications warn you in real time and iCal sync runs by itself in the background.</li>
</ol>` },
    { icon: "💬", title: "8. Messages from visitors", html: `
<ul>
<li><strong>Sending messages:</strong> guests write to you from the property page with the <em>Send message</em> button, without an account. Before booking, this is how they can reach you.</li>
<li><strong>Where they arrive:</strong> as a phone notification, in the <em>Messages</em> tab of the app/site and in your e-mail.</li>
<li><strong>How to reply:</strong> there is no chat. Tap <em>Reply</em> in the e-mail (it contains the guest's address) or call them if they left a phone number, then mark the message as read.</li>
<li><strong>Retention:</strong> messages are kept for 12 months and then deleted automatically.</li>
<li><strong>Privacy:</strong> staff you add cannot see messages; only you, the administrator, can.</li>
</ul>` },
    { icon: "🔔", title: "9. Notifications and the automatic arrival message", html: `
<ul>
<li><strong>Turn on:</strong> in <em>Settings → Notifications</em>. On iPhone they work only after the app is added to the home screen (iOS 16.4 or newer).</li>
<li><strong>What you get:</strong> new booking, cancellation, failed online payment. Every morning (between 8:00 and 10:00) you get a summary: arrivals, departures and upcoming bookings with incomplete registration forms.</li>
<li><strong>Payouts:</strong> after every payout to your account you get an e-mail with the amount (for example “You received 840 RON”).</li>
<li><strong>Arrival message:</strong> in <em>Settings → Arrival message</em> write the guest guide (keys, gate code, rules, landmarks) and choose to have it sent automatically 1 or 2 days before arrival.</li>
<li><strong>Exceptions:</strong> the message is sent only between 9:00 and 21:00. If a scheduled payment is overdue, automatic sending stops and you are notified, so you decide whether to tap <em>Send access</em>. The legal form can still be filled in after the message, or on site, from the link inside.</li>
</ul>` },
    { icon: "👥", title: "10. Staff access (front desk, family, cleaning)", html: `
<ul>
<li><strong>Adding someone:</strong> in <em>Settings → Staff</em> tap <em>Add a person</em>, give a name and choose the properties. A code valid for 30 minutes is generated.</li>
<li><strong>Their setup:</strong> they open host.opening-hours-today.eu on their phone, enter the code and choose a 6-digit PIN.</li>
<li><strong>What they can do:</strong> see the calendar, the operational booking details (name, phone, dates), free rooms, and close or reopen days.</li>
<li><strong>What they CANNOT do:</strong> see guests' messages, rates, payments or amounts, cancel or refuse bookings, or change settings or other devices.</li>
<li><strong>Revoking:</strong> delete or block any device at any time in <em>Settings → My devices</em>.</li>
</ul>` },
    { icon: "🧾", title: "11. What happens when a booking comes in", html: `
<ol>
<li><strong>Choosing and holding the days:</strong> the guest picks the dates, sees the final price and enters their details. The calendar holds the days for a few minutes while they confirm their e-mail with a code.</li>
<li><strong>Payment:</strong> after the code the guest pays online by card (the advance or the full amount, depending on the cancellation policy). The policy is shown and accepted before paying.</li>
<li><strong>Confirmation:</strong> right after payment the booking is firm. You get an app notification and an e-mail, and the days stay blocked in your calendar. <strong>Only now does the guest receive your phone, e-mail and exact address</strong>, in the confirmation e-mail and on the booking page.</li>
<li><strong>Legal forms:</strong> the guest gets a secure link where each group member fills in the registration form. The data is encrypted and only you can see it, from your account.</li>
<li><strong>Access instructions:</strong> 1 or 2 days before arrival the platform automatically sends your check-in message (if enabled).</li>
<li><strong>Automatic deletion:</strong> after the stay, the personal data in the forms is deleted, within the legal time limits.</li>
<li><strong>The money:</strong> 24 hours after check-in the amount (minus commission) is paid out to your account and you get an e-mail.</li>
</ol>
<p><strong>Bookings from other channels</strong> (Booking, Airbnb) are imported automatically through iCal. If an overlap occurs you get an alert in <em>Today</em> right away.</p>` },
    { icon: "❌", title: "12. Cancellation, refusal and penalties", html: `
<p><strong>Cancellation policies</strong> (you choose; they apply to every booking and the guest sees and accepts it before paying):</p>
<ul>
<li><strong>Flexible:</strong> free cancellation more than 48 hours before check-in. After that the first night is kept. The advance is 30% or the first night, whichever is higher.</li>
<li><strong>Moderate:</strong> free cancellation more than 7 days before check-in. After that 50% of the total is kept. The advance is 50%.</li>
<li><strong>Strict (non-refundable):</strong> nothing is refunded on cancellation. The guest automatically gets 10% off and pays 100% at booking.</li>
</ul>
<p><strong>Payment rules:</strong> cancelling is possible until the property's check-in time. For bookings made more than 30 days before arrival only the advance is charged; the rest is charged automatically to the guest's card 30 days before check-in, if they ticked the consent. If charging the rest fails, the guest has 48 hours to pay another way; after that the booking is cancelled and the chosen policy applies.</p>
<ul>
<li><strong>If the guest cancels:</strong> days are released automatically. The platform works out what is refunded and what is kept; the penalty goes to you, minus the commission.</li>
<li><strong>If you cancel:</strong> the calendar is released and the guest gets back everything they paid, including the commission.</li>
<li><strong>Refusing a guest:</strong> in case of false data, incomplete forms or inappropriate behaviour you can refuse the booking by choosing a mandatory reason and adding a short comment. The guest is fully refunded and the event is logged (repeated unjustified refusals are reviewed by the platform).</li>
</ul>
<p><strong>Important:</strong> booking money goes through the platform and is held safely until check-in. If a payment is refunded, disputed with the bank (chargeback) or cancelled, the platform may withhold or cancel the corresponding payout, and may ask for the amount back if it was already paid out.</p>` },
    { icon: "💶", title: "13. Money: commission, payout and report", html: `
<ul>
<li><strong>Commission:</strong> 10% of the amounts actually collected online (including penalties kept on a late cancellation). It includes payment processing, so there are no separate card fees. Bookings made before the change to 10% keep the commission they had when booked.</li>
<li><strong>Promotion:</strong> the first 5 online bookings of your account have 0% commission. Fully refunded bookings do not use up one of the 5.</li>
<li><strong>Payout:</strong> through Stripe, to your bank account, 24 hours after check-in. Your Stripe account must be <strong>active</strong> (see the status under <em>Instant booking</em>). The money usually reaches your bank 1–3 business days after the payout. You get an e-mail with the amount for every payout.</li>
<li><strong>Invoicing:</strong> the invoice for the commission is sent automatically to your billing e-mail, based on the company details in your account. You issue the accommodation invoice to the guest yourself.</li>
<li><strong>Excel report:</strong> download it any time from your account for any period; it shows gross amounts, commissions and net amounts. Keep the file safe (it holds guests' data) and delete it after use.</li>
</ul>` },
    { icon: "🛡️", title: "14. Guest data", html: `
<ul>
<li><strong>Encryption:</strong> data in the registration forms is stored securely. The ID series/number and the personal ID number (optional) are never saved in clear text.</li>
<li><strong>Access log:</strong> the data is visible only from your administrator account, and every view is recorded in the security log.</li>
<li><strong>Automatic deletion:</strong> guest data is deleted 90 days after check-out, or immediately if the booking is cancelled.</li>
<li><strong>Use:</strong> only for the legal register of guests. Do not send it through insecure channels (regular e-mail, WhatsApp).</li>
<li><strong>Your details towards the guest:</strong> your phone and exact address are shown to the guest only after the paid booking.</li>
<li><strong>Platform messages:</strong> visitors' messages are kept for 12 months and then deleted automatically. Use the data in them only to reply.</li>
</ul>` },
    { icon: "❓", title: "15. Common problems", html: `
<ul>
<li><strong>I do not see the “Bookings &amp; calendar” button:</strong> the module is not yet enabled for your property. Write to us on WhatsApp and we enable it.</li>
<li><strong>The page says “Online booking currently unavailable”:</strong> payments (Stripe) are not active. Open <em>Instant booking</em>, check the status and tap <em>Activate payments</em> or <em>Continue setup</em>. If it says “under review”, wait for Stripe's confirmation.</li>
<li><strong>I cannot switch on instant booking:</strong> it can only be switched on when payments are active.</li>
<li><strong>Stripe asks for more details:</strong> tap <em>Continue setup</em> and fill in what is missing (usually the ID document or the IBAN).</li>
<li><strong>The app does not recognise my account:</strong> if you reinstalled the app or changed phone, sign in again with a new 8-character code from your account on the site.</li>
<li><strong>No Face ID / fingerprint option:</strong> you need iOS 16 or newer, an updated Safari and biometric unlock turned on in your phone settings. Otherwise use the PIN.</li>
<li><strong>No notifications on iPhone:</strong> the app must be on the home screen and notifications allowed under <em>Settings → Notifications → OHT Host</em>.</li>
<li><strong>The calendar shows unknown busy days:</strong> they are blue and come from iCal (Booking/Airbnb). They free up automatically when you cancel the booking on that platform.</li>
<li><strong>A guest cannot complete the booking:</strong> check the minimum nights, allowed arrival/departure days and minimum notice in your settings.</li>
<li><strong>What does a guest get back if they cancel?</strong> It is worked out automatically from the property's cancellation policy (Flexible, Moderate or Strict).</li>
<li><strong>How soon do I get my money?</strong> It is paid out automatically through Stripe 24 hours after check-in, if your Stripe account is active. From there to your bank usually takes 1–3 business days.</li>
<li><strong>I cannot find guests' messages in my e-mail:</strong> check Spam/Junk. The messages are saved in the <em>Messages</em> tab anyway.</li>
<li><strong>“Ready for guests” shows a calendar error:</strong> if you are listed only with us and do not use Booking or Airbnb, you can ignore it.</li>
</ul>
<p>Need help? Write to us on <a href="/cont/contact">WhatsApp</a>.</p>` },
  ];
}

module.exports = { guide: (lang) => (lang === "en" ? buildEn() : buildRo()) };

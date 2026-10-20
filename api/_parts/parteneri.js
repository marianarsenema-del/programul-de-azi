// Pagina „Listează-ți proprietatea” (/cazare/login): bara de meniu cu dropdown-uri + paginile pentru parteneri (/parteneri/…).
// Conținutul e static (RO + EN); tot ce e interpolat vine din constante de aici. Scriptul client nu folosește backticks sau ${.
"use strict";
const L = require("./logic");

const E = L.escapeHtml;
const WA = "https://wa.me/40751218782";

// ---------- paginile ----------
const P = [];
const add = (p) => P.push(p);

add({ slug: "cum-functioneaza", group: 1, icon: "info",
  ro: { label: "Cum funcționează", desc: "Îți listezi cazarea, turistul plătește, iar tu primești banii la 24 de ore după check-in.",
    title: "Cum funcționează OpeningHoursToday pentru parteneri",
    lead: "Listarea este gratuită, iar turiștii te pot contacta direct. Dacă vrei și rezervări online, platforma încasează plata de la turist și ți-o virează la 24 de ore după check-in.",
    html: `<h2>În patru pași</h2>
<ol>
<li><strong>Îți creezi contul și adaugi proprietatea.</strong> Alegi cazare, local sau obiectiv turistic, completezi formularul și adaugi poze (merg direct cele din telefon). Verificăm manual fiecare înscriere, iar după aprobare primești un e-mail cu linkul paginii tale.</li>
<li><strong>Îți conectezi contul de plăți Stripe</strong> (doar pentru cazări, dacă vrei rezervări online). Durează circa 3 minute și se face din meniul contului, la <em>Setări plăți</em>. Noi nu vedem și nu stocăm datele tale bancare.</li>
<li><strong>Turistul rezervă și plătește online.</strong> Alege perioada, confirmă e-mailul cu un cod și plătește pe pagina securizată Stripe, cu autentificare 3D Secure. Rezervarea devine fermă după plată.</li>
<li><strong>Primești banii.</strong> Suma încasată, minus comisionul platformei, îți este virată în contul Stripe la 24 de ore după check-in, apoi în contul tău bancar. La fiecare virare primești un e-mail.</li>
</ol>
<h2>Ce plătește turistul și când</h2>
<p>Turistul vede totalul înainte să confirme. La rezervările făcute cu mai mult de 30 de zile înainte de sosire se poate plăti un avans (30% sau prima noapte la politica Flexibilă, 50% la Moderată), iar restul se debitează automat de pe cardul salvat, cu 30 de zile înainte de sosire, doar dacă turistul a bifat acordul. La politica Strictă se plătește totul la rezervare. Dacă debitarea restului eșuează, turistul are 48 de ore să plătească cu alt card; altfel rezervarea se anulează conform politicii.</p>
<h2>Dacă turistul anulează</h2>
<p>Anularea se face din linkul personal primit pe e-mail, iar efectul financiar este cel din politica de anulare pe care ai ales-o și pe care turistul a acceptat-o înainte de plată. Ce se returnează turistului nu se mai virează către tine, iar zilele se eliberează automat în calendar.</p>
<h2>Banii tăi, în siguranță</h2>
<p>Până la virare, banii sunt păstrați de procesatorul de plăți Stripe. Amânarea virării până după check-in protejează turistul și verifică faptul că serviciul a fost prestat; este una dintre regulile din <a href="/parteneri/contract-cadru">contractul-cadru</a>.</p>
<h2>Nu vrei rezervări online?</h2>
<p>Poți rămâne doar cu listarea gratuită: pagina ta apare în director, iar turiștii te contactează direct prin datele afișate. Poți activa rezervările online oricând.</p>` },
  en: { label: "How it works", desc: "You list your property, the guest pays, and you receive the money 24 hours after check-in.",
    title: "How OpeningHoursToday works for partners",
    lead: "Listing is free and guests can contact you directly. If you also want online bookings, the platform collects the payment from the guest and transfers it to you 24 hours after check-in.",
    html: `<h2>In four steps</h2>
<ol>
<li><strong>Create your account and add your property.</strong> Pick a stay, a venue or an attraction, fill in the form and add photos (photos straight from your phone work). We review every listing by hand and, once approved, you get an e-mail with your page link.</li>
<li><strong>Connect your Stripe payment account</strong> (stays only, if you want online bookings). It takes about 3 minutes and is done from your account menu, under <em>Payment settings</em>. We never see or store your bank details.</li>
<li><strong>The guest books and pays online.</strong> They pick the dates, confirm their e-mail with a code and pay on Stripe's secure page with 3D Secure authentication. The booking becomes firm once paid.</li>
<li><strong>You get paid.</strong> The amount collected, minus the platform commission, is transferred to your Stripe account 24 hours after check-in, then to your bank account. You get an e-mail for every transfer.</li>
</ol>
<h2>What the guest pays and when</h2>
<p>The guest sees the total before confirming. For bookings made more than 30 days before arrival a deposit can be paid (30% or the first night under the Flexible policy, 50% under Moderate), and the rest is charged automatically to the saved card 30 days before arrival, only if the guest ticked the consent box. Under the Strict policy everything is paid at booking. If the charge for the rest fails, the guest has 48 hours to pay with another card; otherwise the booking is cancelled under the policy.</p>
<h2>If the guest cancels</h2>
<p>Cancellation is done from the personal link received by e-mail, and the financial effect follows the cancellation policy you chose and the guest accepted before paying. Whatever is refunded to the guest is not transferred to you, and the days are released in your calendar automatically.</p>
<h2>Your money, kept safe</h2>
<p>Until the transfer, the money is held by the payment processor Stripe. Delaying the transfer until after check-in protects the guest and confirms the service was delivered; it is one of the rules of the <a href="/parteneri/contract-cadru">framework agreement</a>.</p>
<h2>Don't want online bookings?</h2>
<p>You can stay with the free listing only: your page appears in the directory and guests contact you directly through the details shown. You can turn on online bookings at any time.</p>` } });

add({ slug: "comisioane", group: 1, icon: "percent",
  ro: { label: "Comisioane și costuri", desc: "Înscrierea este gratuită; comisionul se reține doar din rezervările plătite online.",
    title: "Comisioane și costuri",
    lead: "Înscrierea și listarea sunt gratuite. Plătești un comision doar atunci când primești o rezervare plătită online prin platformă.",
    html: `<h2>Ce este gratuit</h2>
<ul><li>Înscrierea și crearea contului, fără abonament și fără taxe ascunse.</li><li>Listarea în director, cu datele tale de contact afișate pe pagină.</li><li>Contactul direct cu turiștii, <strong>cu 0% comision</strong> pentru orice înțelegere făcută direct.</li></ul>
<h2>Comisionul pentru rezervările online</h2>
<p>Pentru fiecare rezervare plătită online prin platformă, reținem un <strong>comision de 10%</strong> din sumele plătite efectiv de turist (dacă turistul anulează după termenul gratuit, comisionul se calculează doar din penalitatea reținută). Comisionul <strong>include procesarea plății</strong>: nu plătești separat taxe către Stripe pentru aceste rezervări. TVA-ul, dacă este aplicabil, este inclus în procent.</p>
<div class="pn-box"><strong>Exemplu.</strong> O rezervare plătită de 1.000 RON: comisionul este de 100 RON, iar tu primești 900 RON, la 24 de ore după check-in.</div>
<h2>Promoție de lansare</h2>
<p>Primele <strong>5 rezervări plătite online</strong> ale fiecărui cont au comision 0%. O rezervare rambursată integral nu consumă din cele 5.</p>
<h2>Cum se facturează comisionul</h2>
<p>Comisionul se facturează pe baza datelor firmei din contul tău (<em>Date fiscale</em>), după ce banii ți-au fost virați. Rezervările cu comision 0% nu primesc factură de comision. Detalii în <a href="/parteneri/facturare">Politica de facturare</a>.</p>
<h2>Ce rămâne mereu opțional</h2>
<p>Funcțiile suplimentare, plătite, de vizibilitate vor fi mereu opționale și clar marcate. Publicarea anunțului nu depinde de ele.</p>` },
  en: { label: "Fees and costs", desc: "Sign-up is free; commission is only charged on bookings paid online.",
    title: "Fees and costs",
    lead: "Sign-up and listing are free. You only pay a commission when you receive a booking paid online through the platform.",
    html: `<h2>What is free</h2>
<ul><li>Sign-up and account creation, with no subscription and no hidden fees.</li><li>Listing in the directory, with your contact details shown on the page.</li><li>Direct contact with guests, with <strong>0% commission</strong> on anything agreed directly.</li></ul>
<h2>The commission on online bookings</h2>
<p>For every booking paid online through the platform we keep a <strong>10% commission</strong> of the amounts actually paid by the guest (if the guest cancels after the free-cancellation period, the commission is calculated on the penalty kept only). The commission <strong>includes payment processing</strong>: you do not pay Stripe fees separately for these bookings. VAT, where applicable, is included in the percentage.</p>
<div class="pn-box"><strong>Example.</strong> A paid booking of 1,000 RON: the commission is 100 RON and you receive 900 RON, 24 hours after check-in.</div>
<h2>Launch promotion</h2>
<p>The first <strong>5 online-paid bookings</strong> of every account carry 0% commission. A booking refunded in full does not use up one of the 5.</p>
<h2>How the commission is invoiced</h2>
<p>The commission is invoiced using the company details in your account (<em>Tax details</em>), after the money has been transferred to you. Bookings with 0% commission get no commission invoice. More in the <a href="/parteneri/facturare">Invoicing policy</a>.</p>
<h2>What always stays optional</h2>
<p>Extra paid visibility features will always be optional and clearly marked. Publishing your listing does not depend on them.</p>` } });

add({ slug: "configurare-plati", group: 2, icon: "card",
  ro: { label: "Configurarea plăților (Stripe)", desc: "Pașii pentru conectarea contului, siguranța datelor și întrebări frecvente.",
    title: "Configurarea plăților prin Stripe",
    lead: "Pentru a primi rezervări plătite online, îți conectezi un cont Stripe, partenerul nostru de plăți. Durează circa 3 minute și nu implică niciun cost.",
    html: `<h2>Cum te conectezi</h2>
<ol>
<li>Intră în contul tău și alege <strong>Setări plăți</strong> din meniu (<a href="/cont/plati">/cont/plati</a>).</li>
<li>Apasă <strong>Conectează contul prin Stripe</strong>. Ajungi pe pagina securizată Stripe; noi nu vedem parola sau datele tale.</li>
<li>Dacă ai deja cont Stripe, te autentifici în câteva secunde. Dacă nu, îl creezi pe loc: date firmă / PFA (sau personale, dacă nu ai firmă), act de identitate și IBAN.</li>
<li>Revii pe site. Când Stripe termină verificarea, pagina arată <em>Conectat</em> și primești un e-mail de confirmare. După aceea poți porni rezervarea instant din aplicația OHT Host (<em>Setări → Rezervare instant</em>).</li>
</ol>
<div class="pn-box">Dacă închizi pagina Stripe înainte de final, vei vedea mesajul „Procesul de conectare a fost întrerupt”. Apasă din nou butonul și continui de unde ai rămas.</div>
<h2>Cum sunt protejate plățile</h2>
<p>Toate plățile turiștilor se fac cu autentificare 3D Secure (confirmare în aplicația băncii sau prin SMS); excepțiile sunt cardurile prepaid și portofelele digitale, autentificate pe dispozitiv. Banii sunt virați către tine la 24 de ore după check-in.</p>
<h2>Întrebări frecvente</h2>
{{FAQ}}` },
  en: { label: "Payment setup (Stripe)", desc: "The steps to connect your account, data safety and frequently asked questions.",
    title: "Setting up payments with Stripe",
    lead: "To receive online-paid bookings you connect a Stripe account, our payment partner. It takes about 3 minutes and costs nothing.",
    html: `<h2>How to connect</h2>
<ol>
<li>Log in and choose <strong>Payment settings</strong> from the menu (<a href="/cont/plati">/cont/plati</a>).</li>
<li>Press <strong>Connect your account with Stripe</strong>. You land on Stripe's secure page; we never see your password or details.</li>
<li>If you already have a Stripe account you sign in within seconds. If not, you create one on the spot: company / sole-trader details (or personal ones if you have no company), an ID document and an IBAN.</li>
<li>You come back to the site. When Stripe finishes its verification the page shows <em>Connected</em> and you get a confirmation e-mail. After that you can turn on instant booking in the OHT Host app (<em>Settings → Instant booking</em>).</li>
</ol>
<div class="pn-box">If you close Stripe's page before the end you will see “The connection process was interrupted”. Press the button again and you carry on where you left off.</div>
<h2>How payments are protected</h2>
<p>All guest payments use 3D Secure authentication (confirmation in the bank app or by SMS); the exceptions are prepaid cards and digital wallets, authenticated on the device. The money is transferred to you 24 hours after check-in.</p>
<h2>Frequently asked questions</h2>
{{FAQ}}` } });

add({ slug: "descrieri-si-poze", group: 2, icon: "image",
  ro: { label: "Ghid pentru descrieri și poze", desc: "Cum scrii o descriere bună și ce poze atrag turiști.",
    title: "Ghid pentru descrieri și poze",
    lead: "O descriere clară și poze bune aduc mai multe mesaje și rezervări, dar și mai puține dispute: turistul știe exact ce primește.",
    html: `<h2>Cum scrii o descriere bună</h2>
<ul>
<li><strong>Începe cu esențialul:</strong> tipul proprietății, locul (localitate, zonă, apropiere de obiective) și pentru cine este potrivită (familii, cupluri, grupuri).</li>
<li><strong>Descrie ce se oferă, concret:</strong> numărul de camere și paturi, băi, bucătărie, parcare, internet, încălzire sau aer condiționat, curte, grătar, animale de companie acceptate sau nu.</li>
<li><strong>Spune ce este special:</strong> priveliște, liniște, piscină, mic dejun cu produse locale, ghidaj local.</li>
<li><strong>Fii onest și precis.</strong> Dacă drumul final este neasfaltat sau camera e la etaj fără lift, scrie. O descriere care nu corespunde realității este cel mai frecvent motiv de dispută cu bancă.</li>
<li><strong>Reguli clare:</strong> ore de check-in și check-out, fumat, petreceri, copii; ce se plătește separat (taxă de curățenie, încălzire, animale).</li>
<li><strong>Stil:</strong> propoziții scurte, fără majuscule excesive și fără semne de exclamare în șir. Descrierea poate avea până la 5.000 de caractere; nu e nevoie să le folosești pe toate.</li>
<li><strong>Nu pune în text</strong> telefon, e-mail sau prețuri: datele de contact și tarifele se completează în câmpurile dedicate și se actualizează singure peste tot.</li>
</ul>
<h2>Ce poze atrag turiști</h2>
<ul>
<li><strong>Prima poză contează cel mai mult:</strong> alege exteriorul sau cea mai frumoasă cameră, luminoasă și ordonată. Ea apare în căutare și pe pagina ta.</li>
<li><strong>Acoperă tot:</strong> exterior, fiecare tip de cameră, baie, bucătărie, zonele comune, curtea și priveliștea.</li>
<li><strong>Lumină naturală, ziua,</strong> cu perdelele trase și paturile făcute. Fotografiază în orientare orizontală.</li>
<li><strong>Fotografii reale și actuale.</strong> Nu folosi poze de pe alte site-uri, colaje, imagini cu text, logo-uri sau filtre puternice.</li>
<li><strong>Dimensiune:</strong> nu trebuie să le micșorezi; poți încărca direct pozele din telefon, inclusiv de pe iPhone, iar noi le redimensionăm automat. O rezoluție bună (cel puțin 1.200 px pe latura lungă) arată mai bine pe ecrane mari.</li>
<li><strong>Cu drepturi:</strong> încărcând o poză garantezi că ai dreptul să o publici.</li>
<li><strong>Actualizează-le</strong> după renovări sau schimbări de mobilier, din butonul <em>Editează</em> al proprietății.</li>
</ul>
<div class="pn-box"><strong>Verificare rapidă înainte de trimitere.</strong> Asigură-te că ai:<ul><li>cel puțin 5 poze bune, cu prima poză aleasă cu grijă;</li><li>o descriere cu dotările reale și cu regulile casei;</li><li>datele de contact și tarifele corecte, completate în câmpurile dedicate.</li></ul>Cu acestea, pagina ta este completă și gata să primească mesaje și rezervări.</div>` },
  en: { label: "Descriptions and photos guide", desc: "How to write a good description and which photos attract guests.",
    title: "Descriptions and photos guide",
    lead: "A clear description and good photos bring more messages and bookings, and fewer disputes: the guest knows exactly what they get.",
    html: `<h2>How to write a good description</h2>
<ul>
<li><strong>Start with the essentials:</strong> the type of property, where it is (town, area, nearby sights) and who it suits (families, couples, groups).</li>
<li><strong>Describe what is offered, concretely:</strong> number of rooms and beds, bathrooms, kitchen, parking, internet, heating or air conditioning, yard, barbecue, pets allowed or not.</li>
<li><strong>Say what is special:</strong> view, quiet, pool, breakfast with local produce, local guiding.</li>
<li><strong>Be honest and precise.</strong> If the last stretch of road is unpaved or the room is upstairs with no lift, say so. A description that does not match reality is the most common reason for a bank dispute.</li>
<li><strong>Clear rules:</strong> check-in and check-out times, smoking, parties, children; what is paid separately (cleaning fee, heating, pets).</li>
<li><strong>Style:</strong> short sentences, no excessive capitals or strings of exclamation marks. A description can be up to 5,000 characters; you do not need to use them all.</li>
<li><strong>Do not put</strong> phone numbers, e-mails or prices in the text: contact details and rates go in their dedicated fields and update everywhere automatically.</li>
</ul>
<h2>Which photos attract guests</h2>
<ul>
<li><strong>The first photo matters most:</strong> pick the exterior or your best room, bright and tidy. It appears in search and on your page.</li>
<li><strong>Cover everything:</strong> exterior, each room type, bathroom, kitchen, common areas, the yard and the view.</li>
<li><strong>Natural daylight,</strong> curtains open and beds made. Shoot in landscape orientation.</li>
<li><strong>Real, current photos.</strong> Do not use photos from other sites, collages, images with text, logos or heavy filters.</li>
<li><strong>Size:</strong> no need to shrink them; upload straight from your phone, iPhone included, and we resize them automatically. Good resolution (at least 1,200 px on the long side) looks better on big screens.</li>
<li><strong>With rights:</strong> by uploading a photo you guarantee you have the right to publish it.</li>
<li><strong>Keep them up to date</strong> after renovations or new furniture, using the property's <em>Edit</em> button.</li>
</ul>
<div class="pn-box"><strong>Quick check before submitting.</strong> Make sure you have:<ul><li>at least 5 good photos, with the first one chosen with care;</li><li>a description with the real amenities and the house rules;</li><li>correct contact details and rates, filled in the dedicated fields.</li></ul>With these, your page is complete and ready to receive messages and bookings.</div>` } });

add({ slug: "sincronizare-calendar", group: 2, icon: "calendar",
  ro: { label: "Sincronizarea calendarului (iCal)", desc: "Conectezi calendarul cu Booking.com sau Airbnb, ca să eviți rezervările duble.",
    title: "Sincronizarea calendarului (iCal)",
    lead: "Dacă îți vinzi cazarea și pe alte platforme, conectează calendarele prin iCal: o zi ocupată într-un loc se blochează automat și în celelalte, în câteva minute.",
    html: `<h2>Ce este iCal</h2>
<p>iCal este un link standard prin care două calendare își schimbă între ele zilele „ocupat” și „liber”. Îl oferă Booking.com, Airbnb și majoritatea platformelor de cazare, iar noi îți dăm și ție un link, pe care îl adaugi în celelalte conturi.</p>
<h2>Cum conectezi</h2>
<ol>
<li>În contul platformei celeilalte (de exemplu Booking.com sau Airbnb), caută secțiunea de <em>sincronizare calendar</em> și <strong>copiază linkul iCal de export</strong>. Denumirile din meniuri pot diferi puțin, dar le găsești de obicei în pagina de calendar sau de tarife și disponibilitate.</li>
<li>La noi, intră în <em>Proprietățile mele → Rezervări și calendar</em>, secțiunea iCal, și <strong>lipește linkul</strong>. Apasă <em>Previzualizare</em> ca să vezi zilele importate, apoi salvează.</li>
<li>Tot acolo găsești <strong>linkul nostru de export</strong>. Copiază-l și adaugă-l ca „calendar extern” în celelalte conturi.</li>
</ol>
<p>De acum disponibilitatea se actualizează automat, în ambele sensuri, de obicei în câteva minute.</p>
<h2>Pe cameră, pe tip sau pe toată pensiunea</h2>
<ul>
<li><strong>Pe cameră:</strong> fiecare cameră are propriul link (de exemplu camere diferite pe Booking sau o cabană pe Airbnb).</li>
<li><strong>Pe tip de cameră:</strong> ai mai multe camere identice, iar platforma celeilalte transmite „ocupat” doar când s-a vândut ultima dintre ele; atunci se blochează toate camerele tipului la noi.</li>
<li><strong>Toată pensiunea:</strong> închiriezi doar integral; un singur link blochează tot.</li>
</ul>
<h2>Atenție la stoc</h2>
<p>iCal transmite doar „ocupat” sau „liber”, nu și câte camere au rămas. De aceea stabilești tu câte camere vinzi prin OHT, iar restul rămân libere pentru celelalte platforme. <strong>Exemplu:</strong> ai 3 camere „Dublă” (101, 102, 103); vinzi 2 prin OHT și 1 rămâne doar pe Booking. Când Booking spune „ocupat”, camerele 101 și 102 se blochează la noi; noi trimitem „ocupat” către Booking abia când ambele sunt luate.</p>
<h2>Dacă apare o suprapunere</h2>
<p>O rezervare confirmată la noi nu este suprascrisă de un import iCal. Dacă o altă platformă ocupă o cameră deja rezervată aici, primești o alertă (notificare, e-mail și un card roșu în aplicația OHT Host, la <em>Azi</em>) și trebuie să rezolvi situația cu cealaltă platformă, prin anulare sau mutare, și, dacă e cazul, cu turistul.</p>
<div class="pn-box"><strong>Important.</strong> Sincronizarea poate avea întârzieri de câteva minute, deci verifică calendarul când ai rezervări simultane pe mai multe platforme. Alerta și protejarea rezervării sunt instrumente de ajutor, nu o garanție împotriva suprapunerilor.</div>` },
  en: { label: "Calendar sync (iCal)", desc: "Link your calendar with Booking.com or Airbnb to avoid double bookings.",
    title: "Calendar sync (iCal)",
    lead: "If you also sell your stay on other platforms, link the calendars through iCal: a day taken in one place is blocked automatically in the others, within minutes.",
    html: `<h2>What iCal is</h2>
<p>iCal is a standard link through which two calendars exchange their “busy” and “free” days. Booking.com, Airbnb and most accommodation platforms offer it, and we give you a link too, which you add in your other accounts.</p>
<h2>How to connect</h2>
<ol>
<li>In the other platform's account (for example Booking.com or Airbnb) look for the <em>calendar sync</em> section and <strong>copy the iCal export link</strong>. Menu names may differ slightly, but you usually find it in the calendar or rates-and-availability page.</li>
<li>With us, go to <em>My properties → Bookings and calendar</em>, the iCal section, and <strong>paste the link</strong>. Press <em>Preview</em> to see the imported days, then save.</li>
<li>In the same place you find <strong>our export link</strong>. Copy it and add it as an “external calendar” in your other accounts.</li>
</ol>
<p>From now on availability updates automatically, in both directions, usually within minutes.</p>
<h2>Per room, per room type or whole property</h2>
<ul>
<li><strong>Per room:</strong> every room has its own link (for example different rooms on Booking or a cabin on Airbnb).</li>
<li><strong>Per room type:</strong> you have several identical rooms and the other platform sends “busy” only when the last one is sold; then all rooms of that type are blocked with us.</li>
<li><strong>Whole property:</strong> you only rent it entirely; one link blocks everything.</li>
</ul>
<h2>Mind the stock</h2>
<p>iCal only carries “busy” or “free”, not how many rooms are left. So you decide how many rooms you sell through OHT, and the rest stay free for other platforms. <strong>Example:</strong> you have 3 “Double” rooms (101, 102, 103); you sell 2 through OHT and 1 stays on Booking only. When Booking says “busy”, rooms 101 and 102 are blocked with us; we send “busy” to Booking only when both are taken.</p>
<h2>If an overlap appears</h2>
<p>A booking confirmed with us is never overwritten by an iCal import. If another platform takes a room already booked here, you get an alert (notification, e-mail and a red card in the OHT Host app, under <em>Today</em>) and you must sort it out with the other platform, by cancelling or moving, and with the guest if needed.</p>
<div class="pn-box"><strong>Important.</strong> Sync can lag by a few minutes, so check your calendar when you have simultaneous bookings on several platforms. The alert and booking protection are helping tools, not a guarantee against overlaps.</div>` } });

// contractul: textul complet (RO) + rezumat EN; câmpurile libere rămân între paranteze drepte
const CONTRACT_RO = `<p class="pn-doc-title">CONTRACT-CADRU DE PRESTĂRI SERVICII ȘI INTERMEDIERE TEHNOLOGICĂ</p>
<p>Prezentul Contract-Cadru de Prestări Servicii și Intermediere Tehnologică (denumit în continuare „Contractul”) este încheiat astăzi, între următoarele părți semnătare:</p>
<p><strong>1.</strong> [NUME FIRMĂ PLATFORMĂ] S.R.L., cu sediul social în [Adresă Sediu], înmatriculată la Registrul Comerțului sub nr. [J__/____/____], Cod Unic de Înregistrare (CUI) [________], cont bancar (IBAN) [__________________________] deschis la [Nume Bancă], reprezentată legal prin [Nume Reprezentant], în calitate de Administrator, denumită în continuare „Platforma”.</p>
<p><strong>2.</strong> Societatea / Persoana Fizică Autorizată / Persoana fizică [NUME GAZDĂ], cu sediul / domiciliul în [Adresă Sediu / Domiciliu], înmatriculată la Registrul Comerțului sub nr. [________________], Cod Unic de Înregistrare (CUI) / CNP [________________], cont bancar (IBAN) [__________________________] deschis la [Nume Bancă], reprezentată legal prin [Nume Reprezentant], în calitate de [Funcție / Titlu], denumită în continuare „Gazda”.</p>
<p>Platforma și Gazda vor fi denumite în mod individual „Partea” și în mod colectiv „Părțile”.</p>
<h2>Articolul 1. Obiectul contractului</h2>
<p><strong>1.1.</strong> Obiectul prezentului Contract constă în punerea la dispoziție de către Platformă a infrastructurii tehnologice digitale și a serviciilor de intermediere online, permițând Gazdei să își listeze, să își promoveze și să primească rezervări plătite online pentru serviciile de cazare oferite, de la utilizatorii finali (denumiți în continuare „Turiști”).</p>
<p><strong>1.2.</strong> Gazda mandatează în mod expres Platforma să acționeze ca intermediar tehnologic pentru colectarea sumelor achitate de Turiști prin intermediul procesatorului de plăți partener (Stripe Connect Express) și să rețină comisionul agreat conform condițiilor financiare din prezentul Contract.</p>
<h2>Articolul 2. Mecanismul financiar și amânarea transferului (24 de ore)</h2>
<p><strong>2.1.</strong> Toate plățile efectuate de Turiști pe platformă sunt procesate securizat prin Stripe. Platforma încasează suma plătită de Turist, iar după check-in o virează Gazdei, în contul Stripe asociat acesteia, minus comisionul Platformei și sumele reținute sau returnate conform prezentului Contract.</p>
<p><strong>2.2.</strong> Pentru fiecare rezervare plătită online, Platforma percepe un comision de 10% din sumele plătite efectiv de Turist (la anulare cu penalitate, din penalitatea reținută). Comisionul include procesarea plății, iar TVA-ul, dacă este aplicabil, este inclus în acest procent. Primele 5 rezervări plătite online ale contului Gazdei au comision 0%; o rezervare rambursată integral nu consumă din cele 5. Listarea și contactul direct cu Turiștii nu implică comision.</p>
<p><strong>2.3.</strong> Plățile cu cardul sunt supuse autentificării 3D Secure 2 (3DS2). Excepție fac cardurile prepaid și portofelele digitale, autentificate pe dispozitiv. O plată cu card care nu a fost autentificată și nu se încadrează în aceste excepții se rambursează automat, iar rezervarea nu se confirmă.</p>
<p><strong>2.4.</strong> Virarea sumelor către Gazdă este supusă unui mecanism de amânare controlat. Fondurile se eliberează automat la 24 de ore după momentul check-in-ului (în ziua următoare datei de sosire, la ora 12:00, ora României), în contul Stripe al Gazdei, de unde sunt transferate în contul bancar (IBAN) al acesteia conform setărilor Stripe. Această perioadă de amânare este instituită exclusiv pentru protecția Turistului și pentru verificarea prestării serviciului.</p>
<p><strong>2.5.</strong> Anulările și rambursările se procesează centralizat de Platformă, conform politicii de anulare a Gazdei, acceptată de Turist înainte de plată. Sumele returnate Turistului nu se mai virează Gazdei.</p>
<h2>Articolul 3. Răspunderea în caz de chargeback și litigii comerciale</h2>
<p><strong>3.1.</strong> Gazda poartă răspunderea juridică și financiară deplină și exclusivă pentru calitatea serviciilor prestate, realitatea datelor introduse pe site și disponibilitatea cazării.</p>
<p><strong>3.2.</strong> În cazul în care o plată este contestată la banca emitentă de către un Turist (procedură denumită „chargeback” sau dispută) din motive comerciale precum, dar fără a se limita la: servicii neprestate, condiții care nu corespund cu descrierea de pe platformă, refuz de cazare, suprarezervare sau anulări abuzive ale rezervării de către Gazdă, responsabilitatea financiară revine în totalitate Gazdei.</p>
<p><strong>3.3.</strong> Dacă un client câștigă o dispută la bancă din cauza condițiilor de la locație, Gazda este obligată să returneze banii Platformei. Gazda recunoaște și acceptă dreptul Platformei de a bloca, reține sau compensa sumele echivalente valorii litigiului sau chargeback-ului (inclusiv taxele de dispută aplicate de procesator) din viramentele viitoare ale Gazdei sau din soldul contului Stripe al acesteia. Dacă nu există sume de compensat, Gazda restituie suma în 15 zile de la notificare.</p>
<p><strong>3.4.</strong> Platforma preia investigația disputei și transmite dovezile către bancă. Gazda este obligată să pună la dispoziție, în maximum 5 zile lucrătoare de la solicitare, dovezile pe care le deține (confirmarea sosirii, corespondența cu Turistul, fișa de cazare, facturi, fotografii).</p>
<p><strong>3.5.</strong> Implementarea 3DS2 protejează Părțile împotriva fraudelor cu carduri furate, prin transferul răspunderii către bănci. Totuși, aceasta nu înlătură răspunderea Gazdei în cazul litigiilor strict comerciale descrise la art. 3.2.</p>
<p><strong>3.6.</strong> Pe durata unei dispute deschise sau a unei investigații privind o rezervare, Platforma poate amâna sau reține virarea aferentă acelei rezervări. Dacă serviciul a fost prestat conform rezervării, Platforma contestă disputa, iar Gazda nu suportă suma contestată dacă disputa este câștigată.</p>
<p><strong>3.7.</strong> Un Turist poate contesta o plată timp de câteva luni după efectuarea ei (de regulă până la 120 de zile, uneori mai mult, după regulile rețelelor de carduri). Obligațiile din prezentul articol rămân valabile după virarea sumelor și după încetarea Contractului.</p>
<h2>Articolul 4. Obligațiile de facturare și conformitatea e-Factura</h2>
<p><strong>4.1.</strong> Întrucât serviciul final este livrat de Gazdă, aceasta are obligația legală exclusivă de a emite factură fiscală sau bon fiscal direct către Turist, pentru valoarea totală (100%) a cazării achiziționate.</p>
<p><strong>4.2.</strong> Platforma emite către Gazdă o factură fiscală reprezentând exclusiv contravaloarea serviciului de intermediere (comisionul efectiv reținut), pe baza datelor fiscale din contul Gazdei, pe care aceasta se obligă să le țină corecte. Factura se transmite în sistemul național RO e-Factura, conform legislației în vigoare.</p>
<h2>Articolul 5. Durata și încetarea contractului</h2>
<p><strong>5.1.</strong> Prezentul Contract se încheie pe durată nedeterminată și intră în vigoare la data semnării sale de ambele Părți.</p>
<p><strong>5.2.</strong> Oricare dintre Părți poate denunța unilateral Contractul, fără intervenția unei instanțe, printr-o notificare scrisă transmisă cu cel puțin 15 zile calendaristice înainte de data propusă pentru încetare, cu condiția onorării tuturor rezervărilor deja achitate de Turiști până la acel moment.</p>
<h2>Articolul 6. Dispoziții finale</h2>
<p><strong>6.1.</strong> Prezentul Contract este guvernat de legislația română. Orice litigiu decurgând din sau în legătură cu acesta se soluționează pe cale amiabilă, iar în caz contrar de instanțele competente de la sediul Platformei.</p>
<p><strong>6.2.</strong> Părțile declară că au citit, înțeles și acceptat clauzele prezentului document, semnând în deplină cunoștință de cauză.</p>
<table class="pn-sign"><tr><td><strong>Pentru PLATFORMĂ</strong><br>[NUME FIRMĂ PLATFORMĂ] S.R.L.<br>Semnătură: ..............................<br>Nume: ____________________<br>Funcția: Administrator<br>Data: ____ / ____ / 20__</td><td><strong>Pentru GAZDĂ</strong><br>[NUME GAZDĂ]<br>Semnătură: ..............................<br>Nume: ____________________<br>Funcția: ____________________<br>Data: ____ / ____ / 20__</td></tr></table>`;

add({ slug: "contract-cadru", group: 3, icon: "doc",
  ro: { label: "Contractul-cadru", desc: "Modelul contractului, cu regula de 24 de ore și răspunderea pentru dispute.",
    title: "Contractul-cadru de prestări servicii și intermediere tehnologică",
    lead: "Mai jos este modelul contractului dintre platformă și gazdă, cu câmpurile libere necompletate. Îl poți citi oricând, înainte de a te înscrie.",
    html: `<div class="pn-box"><strong>Model orientativ.</strong> Datele părților sunt necompletate (între paranteze drepte). Contractul produce efecte numai după ce este completat cu datele părților și semnat de ambele. <a href="#" id="pnPrint">Tipărește / salvează ca PDF</a></div>${CONTRACT_RO}` },
  en: { label: "Framework agreement", desc: "The agreement template, with the 24-hour rule and dispute liability.",
    title: "Framework agreement for services and technological intermediation",
    lead: "The agreement between the platform and the host is written in Romanian and governed by Romanian law. Below is a summary in English; the full Romanian text is available on the Romanian version of this page.",
    html: `<div class="pn-box"><strong>Template only.</strong> The parties' details are left blank. The agreement takes effect only once completed with the parties' details and signed by both. <a href="/parteneri/contract-cadru?lang=ro">Read the full text (Romanian)</a></div>
<h2>Summary of the main terms</h2>
<ul>
<li><strong>Object (art. 1):</strong> the platform provides the technology and online intermediation so the host can list, promote and receive online-paid bookings for accommodation; the host mandates the platform to collect guest payments through Stripe Connect Express and keep the agreed commission.</li>
<li><strong>Money flow (art. 2):</strong> guest payments are collected by the platform and transferred to the host 24 hours after check-in (the day after arrival, 12:00 Romanian time), minus the commission. Commission: 10% of the amounts actually paid, payment processing included; the first 5 online-paid bookings of an account are at 0%. Card payments require 3D Secure (except prepaid cards and digital wallets). Cancellations and refunds are handled centrally under the host's cancellation policy.</li>
<li><strong>Chargebacks and disputes (art. 3):</strong> the host is fully liable for the service delivered and the accuracy of the listing. If a guest wins a bank dispute because of the conditions at the property, the host must return the money to the platform; the platform may withhold, offset or withdraw the amount (plus dispute fees) from future transfers or the host's Stripe balance, and otherwise the host repays it within 15 days. The host provides evidence within 5 working days. 3D Secure shifts liability for stolen-card fraud to banks, but not for commercial disputes. These obligations survive transfers and termination.</li>
<li><strong>Invoicing (art. 4):</strong> the host invoices the guest for 100% of the stay; the platform invoices the host only for the commission, through RO e-Factura.</li>
<li><strong>Term (art. 5):</strong> indefinite; either party may terminate with 15 calendar days' written notice, provided bookings already paid by guests are honoured.</li>
<li><strong>Governing law (art. 6):</strong> Romanian law; amicable settlement first, then the competent courts at the platform's seat.</li>
</ul>` } });

add({ slug: "facturare", group: 3, icon: "receipt",
  ro: { label: "Politica de facturare (e-Factura)", desc: "Cum îți emitem factura de comision și ce ai de facturat tu turistului.",
    title: "Politica de facturare (e-Factura)",
    lead: "Sunt două facturi diferite: tu îi facturezi turistului cazarea, iar platforma îți facturează ție comisionul.",
    html: `<h2>1. Factura gazdei către turist</h2>
<p>Serviciul de cazare este prestat de tine, deci obligația de a emite factura fiscală sau bonul fiscal către turist, pentru <strong>valoarea totală (100%)</strong> a cazării, îți aparține în exclusivitate. Platforma nu emite facturi în numele tău. Datele turistului (nume, e-mail, telefon, perioada și suma plătită) le găsești în rezervare și în raportul Excel din cont, pe care îl folosești doar pentru evidență, contabilitate și obligațiile legale.</p>
<h2>2. Factura platformei către gazdă (comisionul)</h2>
<ul>
<li>Platforma emite o factură care cuprinde <strong>exclusiv comisionul</strong> reținut efectiv, nu valoarea cazării.</li>
<li>Se emite <strong>după ce banii ți-au fost virați</strong> (la 24 de ore după check-in) sau, la o anulare cu penalitate, din comisionul aferent penalității.</li>
<li>Rezervările din promoția de lansare, cu comision 0%, nu primesc factură de comision.</li>
<li>Factura se emite pe datele din <a href="/cont/date-fiscale">Date fiscale</a> (denumire, CUI, adresă, e-mail de facturare), pe care ți le completezi o singură dată; le preluăm automat de la ANAF când apeși „Verifică CUI”. Ești responsabil ca ele să fie corecte.</li>
<li>Factura se transmite în sistemul național <strong>RO e-Factura</strong>, conform legislației în vigoare, și o primești și pe e-mail.</li>
</ul>
<h2>3. Ce îți revine fiscal</h2>
<ul>
<li>Veniturile din cazare, inclusiv cele încasate prin platformă, se declară și se impozitează potrivit statutului tău (persoană fizică, PFA, societate; plătitor sau neplătitor de TVA).</li>
<li>Ai obligația legală de a ține evidența turiștilor cazați. Turistul poate completa online fișa de cazare, iar datele se șterg automat după 90 de zile de la plecare.</li>
<li>Comisionul platformei este un cost deductibil sau nu în funcție de regimul tău fiscal; întreabă contabilul.</li>
</ul>
<div class="pn-box">Informațiile de pe această pagină sunt orientative și nu înlocuiesc consultanța unui contabil sau a unui consilier fiscal.</div>` },
  en: { label: "Invoicing policy (e-Factura)", desc: "How we issue the commission invoice and what you must invoice the guest.",
    title: "Invoicing policy (e-Factura)",
    lead: "There are two separate invoices: you invoice the guest for the stay, and the platform invoices you for the commission.",
    html: `<h2>1. The host's invoice to the guest</h2>
<p>The accommodation service is provided by you, so the duty to issue the tax invoice or receipt to the guest for the <strong>full amount (100%)</strong> of the stay is yours alone. The platform does not issue invoices on your behalf. The guest's details (name, e-mail, phone, dates and amount paid) are in the booking and in the Excel report in your account, which you use only for records, accounting and legal obligations.</p>
<h2>2. The platform's invoice to the host (the commission)</h2>
<ul>
<li>The platform issues an invoice for <strong>the commission only</strong>, not the value of the stay.</li>
<li>It is issued <strong>after the money has been transferred to you</strong> (24 hours after check-in) or, for a cancellation with a penalty, from the commission on the penalty.</li>
<li>Bookings in the launch promotion, with 0% commission, get no commission invoice.</li>
<li>The invoice uses the details in <a href="/cont/date-fiscale">Tax details</a> (name, tax ID, address, billing e-mail), which you fill in once; we fetch them from ANAF when you press “Check CUI”. You are responsible for keeping them correct.</li>
<li>The invoice is submitted to Romania's national <strong>RO e-Factura</strong> system, as the law requires, and you also receive it by e-mail.</li>
</ul>
<h2>3. Your tax obligations</h2>
<ul>
<li>Accommodation income, including what is collected through the platform, is declared and taxed according to your status (individual, sole trader, company; VAT payer or not).</li>
<li>You must legally keep a register of the guests you host. Guests can fill in the accommodation form online, and the data is deleted automatically 90 days after departure.</li>
<li>Whether the platform commission is deductible depends on your tax regime; ask your accountant.</li>
</ul>
<div class="pn-box">The information on this page is indicative and does not replace advice from an accountant or tax adviser.</div>` } });

add({ slug: "litigii", group: 3, icon: "shield",
  ro: { label: "Reguli privind litigiile", desc: "Ce se întâmplă când un turist contestă condițiile și cum se rezolvă prin platformă.",
    title: "Reguli privind litigiile",
    lead: "Platforma gestionează centralizat anulările și, în caz de dispută bancară, preia investigația. Iată cum decurg lucrurile și cum le eviți.",
    html: `<h2>Neînțelegeri între turist și gazdă</h2>
<p>Pentru probleme legate de serviciul de cazare, turistul se adresează mai întâi gazdei, iar datele de contact ale gazdei îi sunt afișate după confirmarea și plata rezervării. Dacă nu se ajunge la o înțelegere, ne poți scrie oricând pe <a href="${WA}" target="_blank" rel="noopener">WhatsApp, la +40 751 218 782</a> și te ajutăm să o rezolvi. Rămân valabile drepturile legale ale consumatorilor, inclusiv ANPC și soluționarea alternativă a litigiilor (<a href="https://anpc.ro/ce-este-sal" target="_blank" rel="noopener">SAL</a>).</p>
<h2>Anulări</h2>
<p>Anulările se procesează centralizat, conform politicii de anulare pe care ai ales-o și pe care turistul a acceptat-o înainte de plată. Dacă turistul anulează conform politicii, banii îi sunt returnați automat înainte de a fi virați către tine. Dacă anulezi tu o rezervare confirmată, turistul primește banii înapoi integral.</p>
<h2>Chargeback: contestația plății la bancă</h2>
<ol>
<li><strong>Banca turistului</strong> notifică procesatorul Stripe, iar noi te anunțăm prin e-mail.</li>
<li><strong>Platforma preia investigația.</strong> Îți cerem dovezile pe care le ai (confirmarea sosirii, mesajele cu turistul, fișa de cazare, facturi, fotografii); le trimiți în maximum <strong>5 zile lucrătoare</strong>.</li>
<li><strong>Trimitem dovezile către bancă,</strong> împreună cu cele pe care le deținem noi: plata a fost autentificată prin 3D Secure, confirmarea rezervării și corespondența.</li>
<li><strong>Rezultatul:</strong>
<ul>
<li>dacă disputa este <strong>câștigată</strong>, nu se întâmplă nimic și banii rămân ai tăi;</li>
<li>dacă este <strong>pierdută din motive legate de serviciu</strong> (serviciu neprestat sau diferit de descriere, refuz de cazare, suprarezervare, anulare din partea gazdei), suma contestată și taxele de dispută se rețin din viramentele tale viitoare sau din soldul contului tău Stripe; dacă nu există sume de compensat, o restitui în 15 zile de la notificare;</li>
<li>dacă este vorba de <strong>fraudă cu card furat</strong>, iar plata a fost autentificată 3D Secure, riscul revine, de regulă, băncii emitente și nu se reține de la tine.</li>
</ul></li>
</ol>
<p>Un turist poate contesta o plată timp de câteva luni (de regulă până la 120 de zile, uneori mai mult), iar regulile de mai sus rămân valabile după ce banii au fost virați. Pe durata unei dispute deschise, platforma poate amâna virarea aferentă rezervării respective.</p>
<h2>Cum eviți litigiile</h2>
<ul>
<li>Scrie o descriere și folosește poze care corespund realității (<a href="/parteneri/descrieri-si-poze">ghidul pentru descrieri și poze</a>).</li>
<li>Menține calendarul la zi și rezolvă imediat orice suprapunere (<a href="/parteneri/sincronizare-calendar">sincronizarea iCal</a>).</li>
<li>Onorează rezervările confirmate; dacă nu poți, anunță turistul și anulează din timp.</li>
<li>Păstrează dovezile: mesaje, fișa de cazare, confirmarea sosirii, fotografii la sosire și la plecare.</li>
<li>Răspunde repede la mesaje. Un turist informat contestă rar plata.</li>
</ul>
<p>Regulile complete sunt în <a href="/parteneri/contract-cadru">contractul-cadru</a> (art. 3) și în <a href="/termeni-si-conditii">Termenii și condițiile</a>.</p>` },
  en: { label: "Dispute rules", desc: "What happens when a guest disputes the conditions and how it is resolved through the platform.",
    title: "Dispute rules",
    lead: "The platform handles cancellations centrally and, in a bank dispute, takes over the investigation. Here is how it works and how to avoid it.",
    html: `<h2>Disagreements between guest and host</h2>
<p>For problems with the accommodation, the guest first turns to the host, whose contact details are shown after the booking is confirmed and paid. If you cannot agree, write to us any time on <a href="${WA}" target="_blank" rel="noopener">WhatsApp, at +40 751 218 782</a> and we will help you sort it out. Consumers' legal rights remain valid, including ANPC and alternative dispute resolution (<a href="https://anpc.ro/ce-este-sal" target="_blank" rel="noopener">SAL</a>).</p>
<h2>Cancellations</h2>
<p>Cancellations are handled centrally, under the cancellation policy you chose and the guest accepted before paying. If the guest cancels within the policy, the money is refunded automatically before it is transferred to you. If you cancel a confirmed booking, the guest is refunded in full.</p>
<h2>Chargeback: a payment disputed at the bank</h2>
<ol>
<li><strong>The guest's bank</strong> notifies the processor Stripe, and we notify you by e-mail.</li>
<li><strong>The platform takes over the investigation.</strong> We ask you for the evidence you hold (arrival confirmation, messages with the guest, accommodation form, invoices, photos); you send it within <strong>5 working days</strong>.</li>
<li><strong>We send the evidence to the bank,</strong> together with ours: the payment was authenticated with 3D Secure, the booking confirmation and the correspondence.</li>
<li><strong>The outcome:</strong>
<ul>
<li>if the dispute is <strong>won</strong>, nothing happens and the money stays yours;</li>
<li>if it is <strong>lost for reasons related to the service</strong> (service not provided or different from the description, refusal of accommodation, overbooking, cancellation by the host), the disputed amount and dispute fees are withheld from your future transfers or from your Stripe balance; if there is nothing to offset, you repay it within 15 days of notice;</li>
<li>if it is <strong>stolen-card fraud</strong> and the payment was authenticated with 3D Secure, the risk normally falls on the issuing bank and is not withheld from you.</li>
</ul></li>
</ol>
<p>A guest can dispute a payment for several months (usually up to 120 days, sometimes more), and the rules above remain valid after the money has been transferred. While a dispute is open, the platform may delay the transfer for that booking.</p>
<h2>How to avoid disputes</h2>
<ul>
<li>Write a description and use photos that match reality (<a href="/parteneri/descrieri-si-poze">descriptions and photos guide</a>).</li>
<li>Keep your calendar up to date and resolve any overlap immediately (<a href="/parteneri/sincronizare-calendar">iCal sync</a>).</li>
<li>Honour confirmed bookings; if you cannot, tell the guest and cancel in good time.</li>
<li>Keep the evidence: messages, accommodation form, arrival confirmation, photos at arrival and departure.</li>
<li>Reply to messages quickly. A well-informed guest rarely disputes a payment.</li>
</ul>
<p>The full rules are in the <a href="/parteneri/contract-cadru">framework agreement</a> (art. 3) and in the <a href="/termeni-si-conditii">Terms and conditions</a>.</p>` } });

// ---------- meniu ----------
const GROUPS = [
  { ro: "Deveniți partener", en: "Become a partner" },
  { ro: "Ghid de utilizare / Ajutor", en: "User guide / Help" },
  { ro: "Conformitate și Legalitate", en: "Compliance and Legal" },
];
const REGISTER = { href: "/cazare/creeaza-cont", icon: "home",
  ro: { label: "Înregistrează o proprietate", desc: "Creezi contul și îți adaugi cazarea sau localul, în câteva minute." },
  en: { label: "Register a property", desc: "You create your account and add your stay or venue, in a few minutes." } };

const SVG = {
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
  percent: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  home: '<path d="M3 11l9-7 9 7v9H3z"/><path d="M12 10v6M9 13h6"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-9 9"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
};
const icon = (k) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[k] || SVG.info}</svg>`;

const CSS = `
.pn-nav{background:#1c3a5e;border-radius:14px;margin:0 0 22px;position:relative;z-index:30}
.pn-list{list-style:none;margin:0;padding:0 8px;display:flex;flex-wrap:wrap}
.pn-item{position:relative}
.pn-btn{display:flex;align-items:center;gap:8px;height:52px;padding:0 20px;border:0;border-bottom:3px solid transparent;background:transparent;color:#fff;font-weight:700;font-size:15px;font-family:inherit;cursor:pointer;box-sizing:border-box}
.pn-btn svg{transition:transform .15s}
.pn-item.pn-open .pn-btn,.pn-btn:focus-visible{background:rgba(255,255,255,.12);border-bottom-color:#F0813A;outline:none}
.pn-item.pn-open .pn-btn svg{transform:rotate(180deg)}
.pn-dd{display:none;position:absolute;left:0;top:52px;z-index:40;width:410px;max-width:calc(100vw - 32px);background:#fff;color:#1C1E24;border:1px solid #E8E3DA;border-top:0;border-radius:0 0 16px 16px;box-shadow:0 18px 40px rgba(28,30,36,.18);padding:8px;box-sizing:border-box;text-align:left}
.pn-item.pn-open .pn-dd{display:block}
@media (hover:hover) and (min-width:761px){.pn-item:hover .pn-dd{display:block}.pn-item:hover .pn-btn{background:rgba(255,255,255,.12);border-bottom-color:#F0813A}.pn-item:hover .pn-btn svg{transform:rotate(180deg)}}
.pn-link{display:flex;gap:14px;align-items:flex-start;padding:12px 13px;border-radius:12px;text-decoration:none;color:#1C1E24}
.pn-link:hover,.pn-link:focus-visible,.pn-link.pn-cur{background:#FAF8F4}
.pn-link:hover .pn-t,.pn-link.pn-cur .pn-t{color:#C2561A}
.pn-ic{flex:0 0 40px;height:40px;border-radius:11px;background:#FFF1E6;color:#C2561A;display:flex;align-items:center;justify-content:center}
.pn-t{display:block;font-size:15.5px;font-weight:800}
.pn-d{display:block;font-size:13.5px;color:#6B7280;line-height:1.4;margin-top:2px;font-weight:400}
@media (max-width:760px){
.pn-list{flex-direction:column;padding:0}
.pn-item+.pn-item{border-top:1px solid rgba(255,255,255,.16)}
.pn-btn{width:100%;justify-content:space-between;height:54px;padding:0 18px;border-bottom:0;border-left:4px solid transparent}
.pn-item.pn-open .pn-btn{border-left-color:#F0813A}
.pn-dd{position:static;width:auto;max-width:none;border:0;border-radius:0;box-shadow:none}
.pn-nav{border-radius:14px;overflow:hidden}
}
`;

const JS = `(function(){var nav=document.getElementById('pnNav');if(!nav)return;
var items=nav.querySelectorAll('.pn-item');
function closeAll(except){for(var i=0;i<items.length;i++){if(items[i]!==except){items[i].classList.remove('pn-open');items[i].querySelector('button').setAttribute('aria-expanded','false');}}}
for(var i=0;i<items.length;i++){(function(li){var b=li.querySelector('button');b.addEventListener('click',function(e){var o=li.classList.toggle('pn-open');b.setAttribute('aria-expanded',o?'true':'false');closeAll(li);e.stopPropagation();});})(items[i]);}
document.addEventListener('click',function(e){if(!nav.contains(e.target))closeAll(null);});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAll(null);});
})();`;

function navHtml(lang, curSlug) {
  const en = lang === "en";
  const T = (o) => (en ? o.en : o.ro);
  const li = GROUPS.map((g, gi) => {
    const links = P.filter((p) => p.group === gi + 1).map((p) => ({ href: "/parteneri/" + p.slug, icon: p.icon, slug: p.slug, label: (en ? p.en : p.ro).label, desc: (en ? p.en : p.ro).desc }));
    if (gi === 0) links.push({ href: REGISTER.href, icon: REGISTER.icon, slug: "", label: T(REGISTER).label, desc: T(REGISTER).desc });
    const cur = links.some((l) => l.slug && l.slug === curSlug);
    return `<li class="pn-item${cur ? " pn-open-cur" : ""}"><button type="button" class="pn-btn" aria-haspopup="true" aria-expanded="false">${E(T(g))}<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button><div class="pn-dd">${links.map((l) => `<a class="pn-link${l.slug && l.slug === curSlug ? " pn-cur" : ""}" href="${l.href}"><span class="pn-ic">${icon(l.icon)}</span><span><span class="pn-t">${E(l.label)}</span><span class="pn-d">${E(l.desc)}</span></span></a>`).join("")}</div></li>`;
  }).join("");
  return `<nav class="pn-nav" id="pnNav" aria-label="${en ? "Partner menu" : "Meniu parteneri"}"><ul class="pn-list">${li}</ul></nav>`;
}

// piese pentru /cazare/login: CSS, HTML și script (scriptul se pune într-un <script nonce>)
function assets(lang) { return { css: CSS, html: navHtml(lang, ""), js: JS }; }

// ---------- pagini ----------
const PAGE_CSS = `
.pn-wrap{max-width:960px;margin:0 auto;padding:0 16px 40px}
.pn-head{display:flex;justify-content:space-between;align-items:center;padding:20px 0;flex-wrap:wrap;gap:10px}
.pn-head-r{display:flex;align-items:center;gap:12px;font-size:14px;color:var(--text)}
.pn-outline{background:transparent;border:1px solid var(--accent,#F0813A);color:var(--text);border-radius:10px;padding:9px 16px;font-weight:700;font-size:14px;text-decoration:none}
.pn-art{max-width:820px;margin:0 auto;font-size:16.5px;line-height:1.7;color:var(--text)}
.pn-art h1{font-size:34px;line-height:1.2;font-weight:900;margin:8px 0 14px;text-align:left}
.pn-art h2{font-size:21px;margin:28px 0 8px;text-align:left}
.pn-art p,.pn-art li{text-align:justify;hyphens:auto;-webkit-hyphens:auto;overflow-wrap:break-word}
.pn-art li{margin-bottom:8px}
.pn-art ul,.pn-art ol{padding-left:22px;margin:8px 0 14px}
.pn-art a{color:var(--accent,#F0813A);font-weight:700}
.pn-lead{font-size:18.5px;color:var(--muted);margin:0 0 10px}
.pn-box{background:var(--glass-bg,#fff);border:1px solid var(--accent,#F0813A);border-radius:14px;padding:14px 18px;margin:18px 0;text-align:justify}
.pn-doc-title{text-align:center!important;font-weight:900;font-size:18px;margin:18px 0}
.pn-sign{width:100%;border-collapse:collapse;margin-top:24px}.pn-sign td{width:50%;vertical-align:top;padding:12px;border:1px solid var(--glass-border,#E8E3DA);line-height:1.8}
.pn-cta{display:flex;flex-wrap:wrap;gap:10px;margin:34px 0 6px}
.pn-cta a{display:inline-flex;align-items:center;gap:8px;border:1.5px solid var(--accent,#F0813A);border-radius:10px;padding:13px 20px;color:var(--text);text-decoration:none;font-weight:800}
.pn-faq details{background:var(--glass-bg,#fff);border:1px solid var(--glass-border,#E8E3DA);border-radius:12px;margin-bottom:8px;padding:0 16px}
.pn-faq summary{cursor:pointer;padding:13px 0;font-weight:800;font-size:15.5px}
.pn-faq p{margin:0 0 14px;font-size:15.5px}
@media print{.pn-nav,.pn-head,.pn-cta{display:none!important}.pn-art{max-width:none}}
@media (max-width:520px){.pn-art h1{font-size:27px}.pn-art{font-size:16px}}
`;

function faqHtml(lang) {
  try {
    const f = require("./plati-cont").texts(lang).faq;
    return `<div class="pn-faq">${f.map((x, i) => `<details${i === 0 ? " open" : ""}><summary>${E(x[0])}</summary><p>${E(x[1])}</p></details>`).join("")}</div>`;
  } catch (e) { return ""; }
}

function renderPage(req, res, p) {
  const lang = L.getAccLang(req, res);
  const en = lang === "en";
  const c = en ? p.en : p.ro;
  const nonce = L.generateNonce();
  res.set("Content-Security-Policy", L.buildCsp(nonce));
  res.set("Content-Type", "text/html; charset=utf-8");
  res.set("Cache-Control", "public, max-age=300");
  const path = "/parteneri/" + p.slug;
  const base = L.baseUrlFor(req);
  const body = c.html.replace("{{FAQ}}", faqHtml(lang));
  const T = (ro, e) => (en ? e : ro);
  const printJs = p.slug === "contract-cadru" ? `var pr=document.getElementById('pnPrint');if(pr)pr.addEventListener('click',function(e){e.preventDefault();window.print();});` : "";
  res.send(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${E(c.title)} — Opening Hours Today</title><meta name="description" content="${E(c.lead)}"><link rel="canonical" href="${E(base + path)}"><link rel="stylesheet" href="/style.css">
<style>${CSS}${PAGE_CSS}</style></head>
<body><div class="pn-wrap">
<div class="pn-head"><a class="brand" href="/">Opening<span>HoursToday</span></a><div class="pn-head-r">${L.accLangSwitchHtml(req, lang)}<span>${T("Sunteți deja înscris?", "Already registered?")}</span><a href="/cazare/creeaza-cont" class="pn-outline">${T("Autentificați-vă", "Sign in")}</a></div></div>
${navHtml(lang, p.slug)}
<article class="pn-art"><h1>${E(c.title)}</h1><p class="pn-lead">${E(c.lead)}</p>${body}
<div class="pn-cta"><a href="/cazare/creeaza-cont">${T("Înregistrează afacerea acum", "Register your business now")} ➜</a><a href="/cazare/login">← ${T("Înapoi la pagina de înscriere", "Back to the sign-up page")}</a></div></article>
</div>
<script nonce="${nonce}">${JS}${printJs}</script>
</body></html>`);
}

function mount(app) {
  for (const p of P) app.get("/parteneri/" + p.slug, L.accommodationGate, (req, res) => renderPage(req, res, p));
}

module.exports = { mount, assets, navHtml, PAGES: P, GROUPS };

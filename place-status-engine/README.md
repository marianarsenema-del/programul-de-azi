Place Status Engine
Sistem care calculează, la fiecare vizită de pagină, dacă o locație e
deschisă ACUM (în fusul ei orar local), afișează programul tradus automat,
și semnalează zilele cu program special (posibile sărbători) — folosind
`place\_id` deja salvat în baza de date + Google Place Details API, cu
cache de 12 ore ca să nu plătești de fiecare dată aceeași cerere.
Fișiere
`timeMath.js` — calculul „deschis acum" (fus orar local, fără librărie
de timezone-uri). Testat separat, 15 cazuri (peste miezul nopții,
peste granița săptămânii, fus orar diferit de server).
`googlePlacesDetails.js` — apelul propriu-zis către Google.
`cache.js` — citire/scriere cache (12h, cheie = place_id + limbă).
`getLocationStatus.js` — funcția principală, cea pe care o apelezi din
pagina ta.
`schema.sql` — tabelul de cache, de rulat o singură dată.
`enrich-place-ids.js` — scriptul de la pasul anterior, acum în Postgres.
1. Pregătește baza de date
```bash
psql -U <utilizator> -d <baza\_ta> -f schema.sql
```
Asigură-te că tabelul tău de locații are deja coloana `place\_id`
completată (din scriptul `enrich-place-ids.js`).
2. Instalează dependințele
```bash
npm install
```
3. Configurare
Ai nevoie de aceeași cheie Google Places API de la pasul anterior (dar
verifică în Google Cloud Console că ai activat și "Places API", nu doar
partea de Text Search — Place Details e o categorie de cerere separată,
taxată separat).
```js
// undeva la pornirea aplicației tale (ex. server.js)
const { Pool } = require("pg");
const pool = new Pool({ /\* datele tale de conexiune \*/ });

const { getLocationStatus } = require("./getLocationStatus");
```
4. Folosire, în ruta paginii tale
```js
app.get("/:tara/:oras/:magazin", async (req, res) => {
  // ... găsești locația în baza ta de date, ai deja place\_id-ul ei ...
  const placeId = locatie.place\_id;

  if (!placeId) {
    // locația n-a fost încă îmbogățită cu place\_id — fallback pe orice
    // ai folosit până acum (programul hardcodat, de exemplu)
  } else {
    const status = await getLocationStatus({
      pool,
      placeId,
      apiKey: process.env.GOOGLE\_PLACES\_API\_KEY,
      language: req.detectedLang || "ro", // codul TĂU intern de limbă
    });

    // status.isOpenNow          -> true / false / null (null = Google nu are program)
    // status.weeklyScheduleText -> \["Monday: 9:00 AM – 6:00 PM", ...] deja tradus
    // status.isSpecialDay       -> true dacă azi pare a fi zi cu program special
    // status.businessStatus     -> "OPERATIONAL" / "CLOSED\_TEMPORARILY" / "CLOSED\_PERMANENTLY"
  }

  res.send(renderPage({ ...status }));
});
```
De ce funcționează corect — cele 3 decizii tehnice esențiale
1. Cache-uim datele BRUTE, niciodată statusul calculat. Dacă am fi
cache-uit boolean-ul „deschis acum" pentru 12 ore, ai fi avut un site care
zice „DESCHIS" la ora 2 noaptea, pentru că așa era acum 10 ore când s-a
umplut cache-ul. Cache-uim doar `periods`/`weekday\_text`/`utc\_offset\_minutes`
(date care se schimbă rar), și recalculăm „acum" din ele, la fiecare
cerere, în timp real.
2. Cache-ul ține cont de limbă, nu doar de `place\_id`. `weekday\_text`
vine deja tradus de Google, în funcție de parametrul `language`. Fără
asta, un vizitator neamț ar fi putut primi orarul cache-uit în spaniolă
de la un vizitator anterior.
3. Ora „locală" se calculează din `utc\_offset\_minutes`, nu din ora
serverului. Testat explicit: un magazin din România și unul din New York,
la aceeași oră UTC, arată corect ore locale complet diferite — esențial
dacă vreodată extinzi dincolo de Europa, sau dacă serverul tău rulează
într-un alt fus orar decât locațiile pe care le afișezi.
O limitare onestă, nu a codului — a datelor
„100% automat pentru sărbători" depinde de cât de bine își completează
fiecare afacere profilul Google Business. Dacă un magazin nu-și pune
programul special de Crăciun pe Google, sistemul nostru n-are de unde să
știe — verifică `current\_opening\_hours.special\_days`, dar acel câmp există
doar dacă proprietarul locației l-a completat. Codul face tot ce poate cu
datele disponibile; nu poate inventa date pe care Google nu le are.
Cost
Place Details API se taxează pe categorii de câmpuri (Basic/Contact/
Atmosphere), nu per cerere generică — cerem doar `opening\_hours`,
`current\_opening\_hours`, `utc\_offset\_minutes`, `name`, `business\_status`
(categoriile Basic + Contact), nu tot ce oferă API-ul, exact ca să nu
plătești pentru date pe care nu le folosești. Verifică prețul curent la
Billing → Pricing în Google Cloud Console.
Notificări push (Web Push nativ)
Sistemul de abonare/trimitere e construit direct pe baza de date deja
existentă — nu mai adaugă niciun serviciu extern (Pushwoosh, OneSignal
etc.), deci niciun cost lunar suplimentar.
1. Generează cheile VAPID (o singură dată)
```bash
npx web-push generate-vapid-keys
```
Îți dă două șiruri lungi — `Public Key` și `Private Key`.
2. Pune cheile în DOUĂ locuri
Local, în `.env`:
```
VAPID\_PUBLIC\_KEY=cheia\_publica\_generata
VAPID\_PRIVATE\_KEY=cheia\_privata\_generata
```
Pe Vercel — Settings → Environment Variables — adaugă exact aceleași
două variabile, plus `VAPID\_SUBJECT` (un email de contact, ex.
`mailto:contact@programul-de-azi.ro`) — obligatoriu pentru protocolul Web
Push, browserele îl cer.
Cheia privată e un secret — la fel ca parola bazei de date. Nu o urca
niciodată pe GitHub, doar în Environment Variables.
3. Rulează schema.sql din nou
Are deja tabelul nou (`push\_subscriptions`) adăugat — sigur de rulat din
nou pe o bază existentă, `IF NOT EXISTS` peste tot, nu strică nimic deja
acolo.
4. Butonul apare automat pe site
Odată ce ai pus cheile pe Vercel și ai redeployat, butonul „🔔 Abonează-te
la notificări" apare singur pe homepage (RO și .eu) — până atunci, rămâne
ascuns complet, sigur, fără să crape nimic.
5. Trimiterea efectivă — de la tine, manual, când vrei
```bash
node send-push-notification.js "Program de Paște" "Vezi orele speciale ale magazinelor de Paște" "/"
```
Trei argumente: titlul notificării, textul, și un URL opțional (unde
ajunge utilizatorul dacă dă click pe notificare — implicit „/", homepage-ul).
Scriptul trimite către toți abonații din bază, actualizează
`last\_sent\_at` pentru fiecare trimitere reușită, și șterge automat
din bază abonații ale căror subscripții au expirat (browser dezinstalat,
notificări blocate manual etc.) — nu mai încerci degeaba la nesfârșit
către cineva care nu mai poate primi.

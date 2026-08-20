# Place Status Engine

Sistem care calculează, la fiecare vizită de pagină, dacă o locație e
deschisă ACUM (în fusul ei orar local), afișează programul tradus automat,
și semnalează zilele cu program special (posibile sărbători) — folosind
`place_id` deja salvat în baza de date + Google Place Details API, cu
cache de 12 ore ca să nu plătești de fiecare dată aceeași cerere.

## Fișiere

- `timeMath.js` — calculul „deschis acum" (fus orar local, fără librărie
  de timezone-uri). **Testat separat, 15 cazuri** (peste miezul nopții,
  peste granița săptămânii, fus orar diferit de server).
- `googlePlacesDetails.js` — apelul propriu-zis către Google.
- `cache.js` — citire/scriere cache (12h, cheie = place_id + limbă).
- `getLocationStatus.js` — funcția principală, cea pe care o apelezi din
  pagina ta.
- `schema.sql` — tabelul de cache, de rulat o singură dată.
- `enrich-place-ids.js` — scriptul de la pasul anterior, acum în Postgres.

## 1. Pregătește baza de date

```bash
psql -U <utilizator> -d <baza_ta> -f schema.sql
```

Asigură-te că tabelul tău de locații are deja coloana `place_id`
completată (din scriptul `enrich-place-ids.js`).

## 2. Instalează dependințele

```bash
npm install
```

## 3. Configurare

Ai nevoie de aceeași cheie Google Places API de la pasul anterior (dar
verifică în Google Cloud Console că ai activat și **"Places API"**, nu doar
partea de Text Search — Place Details e o categorie de cerere separată,
taxată separat).

```js
// undeva la pornirea aplicației tale (ex. server.js)
const { Pool } = require("pg");
const pool = new Pool({ /* datele tale de conexiune */ });

const { getLocationStatus } = require("./getLocationStatus");
```

## 4. Folosire, în ruta paginii tale

```js
app.get("/:tara/:oras/:magazin", async (req, res) => {
  // ... găsești locația în baza ta de date, ai deja place_id-ul ei ...
  const placeId = locatie.place_id;

  if (!placeId) {
    // locația n-a fost încă îmbogățită cu place_id — fallback pe orice
    // ai folosit până acum (programul hardcodat, de exemplu)
  } else {
    const status = await getLocationStatus({
      pool,
      placeId,
      apiKey: process.env.GOOGLE_PLACES_API_KEY,
      language: req.detectedLang || "ro", // codul TĂU intern de limbă
    });

    // status.isOpenNow          -> true / false / null (null = Google nu are program)
    // status.weeklyScheduleText -> ["Monday: 9:00 AM – 6:00 PM", ...] deja tradus
    // status.isSpecialDay       -> true dacă azi pare a fi zi cu program special
    // status.businessStatus     -> "OPERATIONAL" / "CLOSED_TEMPORARILY" / "CLOSED_PERMANENTLY"
  }

  res.send(renderPage({ ...status }));
});
```

## De ce funcționează corect — cele 3 decizii tehnice esențiale

**1. Cache-uim datele BRUTE, niciodată statusul calculat.** Dacă am fi
cache-uit boolean-ul „deschis acum" pentru 12 ore, ai fi avut un site care
zice „DESCHIS" la ora 2 noaptea, pentru că așa era acum 10 ore când s-a
umplut cache-ul. Cache-uim doar `periods`/`weekday_text`/`utc_offset_minutes`
(date care se schimbă rar), și recalculăm „acum" din ele, la fiecare
cerere, în timp real.

**2. Cache-ul ține cont de limbă, nu doar de `place_id`.** `weekday_text`
vine deja tradus de Google, în funcție de parametrul `language`. Fără
asta, un vizitator neamț ar fi putut primi orarul cache-uit în spaniolă
de la un vizitator anterior.

**3. Ora „locală" se calculează din `utc_offset_minutes`, nu din ora
serverului.** Testat explicit: un magazin din România și unul din New York,
la aceeași oră UTC, arată corect ore locale complet diferite — esențial
dacă vreodată extinzi dincolo de Europa, sau dacă serverul tău rulează
într-un alt fus orar decât locațiile pe care le afișezi.

## O limitare onestă, nu a codului — a datelor

„100% automat pentru sărbători" depinde de cât de bine își completează
**fiecare afacere** profilul Google Business. Dacă un magazin nu-și pune
programul special de Crăciun pe Google, sistemul nostru n-are de unde să
știe — verifică `current_opening_hours.special_days`, dar acel câmp există
doar dacă proprietarul locației l-a completat. Codul face tot ce poate cu
datele disponibile; nu poate inventa date pe care Google nu le are.

## Cost

Place Details API se taxează pe **categorii de câmpuri** (Basic/Contact/
Atmosphere), nu per cerere generică — cerem doar `opening_hours`,
`current_opening_hours`, `utc_offset_minutes`, `name`, `business_status`
(categoriile Basic + Contact), nu tot ce oferă API-ul, exact ca să nu
plătești pentru date pe care nu le folosești. Verifică prețul curent la
Billing → Pricing în Google Cloud Console.

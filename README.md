# Enrich Place IDs — completare automată `place_id` (Google Places)

Parcurge un tabel MySQL cu coloanele `nume_locatie`, `oras`, `tara` și
completează o coloană nouă, `place_id`, folosind Google Places API (Text
Search). Sigur la re-rulare — nu reprocesează rânduri deja completate.

## 1. Pregătește tabelul

Adaugă coloana `place_id`, dacă nu există deja:

```sql
ALTER TABLE locatii ADD COLUMN place_id VARCHAR(255) NULL;
```

(înlocuiește `locatii` cu numele real al tabelului tău, dacă e altul)

## 2. Obține o cheie Google Places API

1. Mergi pe [console.cloud.google.com](https://console.cloud.google.com) și
   creează un proiect (sau folosește unul existent).
2. În bara de căutare → **"Places API"** → **Enable**.
3. **Activează facturarea** (Billing) — obligatoriu chiar dacă rămâi în
   creditul gratuit lunar oferit de Google. Fără card atașat, cererile nu
   funcționează.
4. **Credentials → Create Credentials → API Key.**
5. Recomandat: restricționează cheia (Application restrictions → None sau
   IP addresses, dacă rulezi scriptul de pe un server cu IP fix) — o cheie
   nerestricționată, dacă ajunge în mâini greșite, poate genera costuri pe
   contul tău.

**Atenție la cost:** Text Search NU e gratuit nelimitat dincolo de creditul
lunar. Verifică prețul curent la Billing → Pricing înainte să rulezi pe
tot tabelul, mai ales dacă ai mii de rânduri.

## 3. Instalează dependințele

Ai nevoie de [Node.js](https://nodejs.org) versiunea 18 sau mai nouă
(scriptul folosește `fetch`, integrat nativ din Node 18).

```bash
cd place-id-enricher
npm install
```

## 4. Configurează variabilele de mediu

```bash
cp .env.example .env
```

Deschide `.env` și completează:
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST` — datele tale MySQL reale
- `DB_TABLE` — numele tabelului (implicit `locatii`)
- `GOOGLE_PLACES_API_KEY` — cheia de la pasul 2

**Nu urca niciodată fișierul `.env` completat pe GitHub** — conține parola
bazei de date și cheia API. Fișierul `.env.example` (fără valori reale) e
sigur de urcat, ca ghid pentru alți colaboratori.

## 5. Testează pe un eșantion mic, ÎNTÂI

În `.env`, lasă `LIMIT_TOTAL=20` (deja setat implicit) și rulează:

```bash
npm start
```

Verifică rezultatele direct în baza de date:

```sql
SELECT nume_locatie, oras, tara, place_id FROM locatii WHERE place_id IS NOT NULL LIMIT 20;
```

Dacă `place_id`-urile arată corect (încep cu `ChIJ...`, corespund locurilor
reale), ești gata pentru rularea completă.

## 6. Rulează pe tot tabelul

În `.env`, schimbă:

```
LIMIT_TOTAL=0
```

(`0` = fără limită, procesează tot ce are `place_id IS NULL`)

```bash
npm start
```

Scriptul afișează progres live în consolă (`[142] Nume, Oraș, Țara -> ChIJ...`)
și, la final, un rezumat: câte au fost găsite, negăsite, erori.

## Dacă scriptul se oprește la mijloc

Repornește-l cu `npm start` — reia automat de unde a rămas, pentru că
interoghează doar rândurile cu `place_id IS NULL`. Nu vei plăti de două ori
pentru locațiile deja procesate.

## Ce înseamnă rezultatele

- **Găsite** — `place_id` salvat cu succes în baza de date.
- **Negăsite (ZERO_RESULTS)** — Google nu a găsit nimic pentru combinația
  nume+oraș+țară. Rândul rămâne cu `place_id NULL` și va fi reîncercat la
  următoarea rulare — dacă vrei să nu mai fie reîncercat niciodată, poți
  edita numele locației în baza de date (poate are un nume mai puțin
  cunoscut) sau marca manual acele rânduri.
- **Erori** — probleme de rețea sau răspunsuri neașteptate de la Google
  (cheie invalidă, cerere greșit formată etc.) — verifică mesajul afișat.

## Adaptare pentru PostgreSQL

Scriptul e scris pentru MySQL (`mysql2`). Pentru Postgres, înlocuiește
`mysql2` cu `pg`, și sintaxa `?` din interogări cu `$1, $2...` — spune-mi
dacă vrei să-ți fac direct varianta Postgres.

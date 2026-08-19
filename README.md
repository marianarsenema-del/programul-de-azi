Programul de Azi
Server Express care generează dinamic pagini de tipul `programul-de-azi.ro/cluj/kaufland`
sau `programul-de-azi.ro/bucuresti/mall`, cu status live „deschis/închis” calculat în
telefonul vizitatorului.
Structură
```
api/server.js   -> tot backend-ul: rute, program implicit, HTML/CSS/JS, SEO
vercel.json      -> trimite toate cererile către api/server.js (URL-uri curate)
package.json      -> dependința Express + versiunea de Node cerută
.gitignore
```
1) Rulare locală
Necesită Node.js 18 sau mai nou.
```bash
npm install
npm run dev
```
Apoi deschide, de exemplu:
http://localhost:3000/cluj/kaufland
http://localhost:3000/bucuresti/mall
http://localhost:3000/cluj-napoca   (pagină generală, fără magazin ales)
2) Deploy pe Vercel
Varianta recomandată — din GitHub:
`git init && git add . && git commit -m "init"` apoi urcă pe un repo GitHub nou.
Pe vercel.com → Add New → Project → alege repo-ul.
Vercel detectează automat `api/server.js` ca serverless function — nu trebuie
ales niciun framework preset, nu trebuie setat build command. Apasă Deploy.
La fiecare push, Vercel redeployează automat.
Varianta din linia de comandă:
```bash
npm install -g vercel
vercel login
vercel          # deploy de test (preview), primești un link *.vercel.app
vercel --prod   # deploy pe domeniul de producție
```
3) De ce `vercel.json` e obligatoriu aici
Fără el, Vercel ar expune funcția doar pe adresa `/api/server`, nu pe
`/cluj/kaufland`. Regula de `rewrites` din `vercel.json` trimite orice
cerere către `api/server.js`, păstrând URL-ul original — Express-ul din
interior face routing-ul real pe baza lui (`req.params.oras`,
`req.params.magazin`).
4) Domeniu propriu
După primul deploy: Project → Settings → Domains → adaugă domeniul tău
(ex: `programuldeazi.ro`) și urmează instrucțiunile DNS afișate de Vercel
(de obicei un record `A` sau `CNAME` la registrarul tău de domeniu).
Domeniul `https://programul-de-azi.ro` e deja setat în `api/server.js`
(la `canonical` și `og:url`) — nu mai trebuie schimbat nimic acolo.
5) Cum editezi programul magazinelor
Deschide `api/server.js` → funcțiile `supermarketWeekly()`, `mallShoppingWeekly()`
și `mallHyperWeekly()` de la începutul fișierului. Modifică orele acolo — se
aplică automat pe toate paginile generate.
6) Monetizare (Google AdSense)
În HTML-ul generat există deja două marcaje:
```html
<!-- LOCATIE RECLAMA ADSENSE PREMIUM -->
<div class="ad-slot">Spațiu reclamă</div>
```
Când primești codul de la AdSense, înlocuiește conținutul acelui `<div>` (sau
`<div>`-ul întreg) cu blocul de anunț furnizat de Google, în ambele locuri din
`renderStorePage()` și `renderCityPage()`.
7) Verificare înainte de lansare
[x] Domeniul real (`programul-de-azi.ro`) e deja setat în `api/server.js`
[ ] Ai testat câteva URL-uri: `/bucuresti/lidl`, `/cluj/mall`, `/iasi` (general)
[ ] Ai adăugat domeniul propriu în Vercel și DNS-ul e propagat
[ ] Ai lipit codul AdSense în cele două `<div class="ad-slot">`
[ ] Ai adăugat site-ul în Google Search Console

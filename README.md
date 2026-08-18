# Programul de Azi

Site utilitar Next.js care arată în timp real dacă Lidl, Kaufland, Penny, Mega
Image, Carrefour, Auchan și mall-urile sunt deschise acum, plus programul
standard și programul de sărbători.

## Structură

```
lib/schedule.js     -> logica de calcul „deschis/închis" (comună)
lib/stores.js        -> configurare magazine (orele editabile aici)
lib/malls.js          -> configurare mall-uri (2 zone: shopping + hipermarket) + text SEO
components/           -> piese de UI reutilizate (StatusCard, WeekTable, ...)
pages/index.js         -> pagina principală (magazine)
pages/mall/index.js     -> listă mall-uri
pages/mall/[id].js       -> pagină individuală per mall/oraș (SEO dedicat)
pages/sitemap.xml.js      -> sitemap generat automat din lista de mall-uri
public/robots.txt          -> permite indexarea, indică sitemap-ul
```

## Rulare locală

Necesită Node.js 18 sau mai nou.

```bash
npm install
npm run dev
```

Deschide `http://localhost:3000`.

## Deploy pe Vercel

Nu ai nevoie de `vercel.json` — Vercel detectează automat un proiect Next.js
și configurează build-ul (`next build`) și output-ul fără nimic suplimentar.

**Varianta 1 — din GitHub (recomandat):**
1. Urcă folderul într-un repo Git (`git init`, `git add .`, `git commit -m "init"`, push pe GitHub).
2. Pe [vercel.com](https://vercel.com) → New Project → Import repo-ul.
3. Framework Preset: „Next.js" (auto-detectat). Apasă Deploy.
4. La fiecare push pe branch-ul principal, Vercel redeployează automat.

**Varianta 2 — din linia de comandă:**
```bash
npm install -g vercel
vercel login
vercel        # deploy de test (preview)
vercel --prod # deploy pe domeniul de producție
```

## Cum adaugi un magazin nou

Deschide `lib/stores.js` și adaugă o intrare nouă în obiectul `STORES`, după
modelul celor existente (`weekly` cu 7 poziții, index 0 = Duminică; `holidays`
cu excepții).

## Cum adaugi un mall nou

Deschide `lib/malls.js` și adaugă un rând nou în array-ul `MALLS`:

```js
createMallTemplate({ id: "slug-unic", name: "Numele Mall-ului", city: "Oraș", hypermarketName: "Auchan" })
```

La următorul build, Next.js generează automat pagina `/mall/slug-unic` cu
title, meta description, JSON-LD și FAQ completate dinamic — nu trebuie scris
nimic manual pentru SEO.

## Înainte de a merge live

- Înlocuiește `https://programuldeazi.ro` cu domeniul tău real în:
  `pages/index.js`, `pages/mall/[id].js`, `pages/mall/index.js`,
  `pages/sitemap.xml.js`, `public/robots.txt`.
- Adaugă domeniul din Vercel (Project → Settings → Domains).
- Verifică Search Console și trimite sitemap-ul: `/sitemap.xml`.

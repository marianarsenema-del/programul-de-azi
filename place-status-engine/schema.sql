-- Rulează o singură dată, complet, pe baza ta de date nouă (Vercel Postgres
-- sau orice altă bază cloud). Creează AMBELE tabele necesare de la zero.

-- ============================================================
-- 1) Tabelul principal — magazine ȘI obiective turistice, laolaltă
-- ============================================================
CREATE TABLE IF NOT EXISTS locatii (
  id            SERIAL PRIMARY KEY,
  nume_locatie  VARCHAR(255) NOT NULL,
  oras          VARCHAR(255),              -- poate fi gol — unele obiective turistice
                                            -- nu au un oraș din lista noastră asociat automat
  tara          VARCHAR(100) NOT NULL,
  slug          VARCHAR(255) UNIQUE,       -- pentru rutele reale de pagină (ex: "castelul-bran")
                                            -- — completat separat, vezi insert_locatii.sql
  place_id      VARCHAR(255),              -- completat de enrich-place-ids.js
  tip           VARCHAR(20) DEFAULT 'store' CHECK (tip IN ('store', 'attraction')),
  creat_la      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- accelerează exact interogările pe care le rulează scripturile deja date:
-- "WHERE place_id IS NULL" (enrich-place-ids.js) și căutarea după slug
-- (paginile reale, la pasul următor)
CREATE INDEX IF NOT EXISTS idx_locatii_place_id_null ON locatii (id) WHERE place_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_locatii_slug ON locatii (slug);
CREATE INDEX IF NOT EXISTS idx_locatii_tip ON locatii (tip);

-- ============================================================
-- 2) Cache pentru răspunsul Google Place Details (12h) — vezi getLocationStatus.js
-- ============================================================
CREATE TABLE IF NOT EXISTS place_details_cache (
  place_id      VARCHAR(255) NOT NULL,
  language      VARCHAR(10)  NOT NULL,
  raw_response  JSONB        NOT NULL,
  fetched_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (place_id, language)
);

CREATE INDEX IF NOT EXISTS idx_place_details_cache_fetched_at ON place_details_cache (fetched_at);

-- opțional: curățenie manuală a intrărilor mai vechi de 7 zile (rulează
-- din când în când, ex. un cron săptămânal — nu e obligatoriu)
-- DELETE FROM place_details_cache WHERE fetched_at < now() - interval '7 days';

-- ============================================================
-- 3) Abonați la notificări push (Web Push nativ, vezi send-push-notification.js)
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            SERIAL PRIMARY KEY,
  endpoint      TEXT NOT NULL UNIQUE,   -- adresa unică a browserului, dată de acesta
  p256dh        TEXT NOT NULL,          -- cheie publică de criptare, dată de browser
  auth          TEXT NOT NULL,          -- secret de criptare, dat de browser
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sent_at  TIMESTAMPTZ             -- completat de send-push-notification.js, ca să
                                        -- știi ultima dată când ai trimis ceva cui
);

/**
 * cache.js
 * -----------------------------------------------------------------------
 * IMPORTANT, citește asta înainte să modifici ceva: cache-uim DOAR
 * răspunsul BRUT de la Google (periods, weekday_text, utc_offset_minutes
 * etc.) — NU statusul calculat "deschis/închis ACUM". Statusul "acum" se
 * recalculează la FIECARE cerere de pagină, din datele brute (eventual
 * cache-uite), pentru că se schimbă minut de minut. Dacă am cache-ui
 * boolean-ul "e deschis acum", ai avea un site care spune "DESCHIS" la
 * 5 ore după ce magazinul s-a închis, doar pentru că așa era acum 5 ore
 * când s-a umplut cache-ul.
 *
 * AL DOILEA DETALIU IMPORTANT: cheia de cache e (place_id + limbă), NU
 * doar place_id — `weekday_text` vine deja TRADUS de Google, în funcție
 * de parametrul `language`. Dacă am cache-ui doar după place_id, un
 * vizitator vorbitor de germană ar putea primi din cache orarul tradus
 * pentru un vizitator anterior vorbitor de spaniolă.
 * -----------------------------------------------------------------------
 */

const CACHE_TTL_HOURS = Number(process.env.PLACE_CACHE_TTL_HOURS || 12);

async function getCachedDetails(pool, placeId, language, ttlHours) {
  // ttlHours — durată VARIABILĂ, per apel — cerut explicit: 7 zile (168h)
  // pentru magazine, 30 de zile (720h) pentru obiective turistice. Fără
  // parametru (apeluri vechi), cade pe CACHE_TTL_HOURS (12h implicit),
  // comportament neschimbat pentru orice cod care nu-l transmite încă.
  const effectiveTtl = ttlHours || CACHE_TTL_HOURS;
  const { rows } = await pool.query(
    `SELECT raw_response, fetched_at
     FROM place_details_cache
     WHERE place_id = $1
       AND language = $2
       AND fetched_at > now() - ($3 || ' hours')::interval`,
    [placeId, language, effectiveTtl]
  );
  if (rows.length === 0) return null;
  return rows[0].raw_response;
}

async function saveCachedDetails(pool, placeId, language, rawResponse) {
  await pool.query(
    `INSERT INTO place_details_cache (place_id, language, raw_response, fetched_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (place_id, language)
     DO UPDATE SET raw_response = EXCLUDED.raw_response, fetched_at = now()`,
    [placeId, language, rawResponse]
  );
}

module.exports = { getCachedDetails, saveCachedDetails, CACHE_TTL_HOURS };

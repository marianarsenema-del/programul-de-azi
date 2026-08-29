/**
 * googlePlacesDetails.js
 * -----------------------------------------------------------------------
 * Cere de la Google exact câmpurile necesare — nu mai mult, ca să nu
 * plătim pentru date pe care nu le folosim (Google taxează pe categorii
 * de câmpuri, nu per cerere generică).
 *
 * Câmpuri cerute:
 *  - opening_hours          -> programul normal, săptămânal (periods,
 *                               weekday_text tradus automat de Google)
 *  - current_opening_hours  -> programul pentru următoarele 7 zile, cu
 *                               excepții — AICI apar sărbătorile/orele
 *                               speciale, dacă afacerea le-a completat pe
 *                               Google Business Profile
 *  - utc_offset              -> fusul orar local al locației, ca număr de
 *                               minute (numele corect pentru Places API
 *                               LEGACY, versiunea REST/server — NU
 *                               "utc_offset_minutes", care e valid doar în
 *                               Places Library (JavaScript, din browser),
 *                               o versiune complet diferită a API-ului.
 *                               Confuzie reală, prinsă abia din log-urile
 *                               reale de producție — corectată aici.)
 *  - name, business_status  -> context util (business_status detectează
 *                               și locații închise definitiv/temporar)
 *  - formatted_address       -> adresa completă (categoria Basic — GRATIS,
 *                               deja plătim această categorie pentru name)
 *  - formatted_phone_number  -> telefon (categoria Contact — GRATIS, deja
 *                               plătim această categorie pentru opening_hours)
 *  - geometry                -> coordonatele GPS (geometry.location.lat/lng)
 *                               — categoria Basic, GRATIS (confirmat direct
 *                               din documentația Google: aceeași categorie
 *                               $0 ca name/formatted_address, NU adaugă
 *                               niciun cost suplimentar). Bug real, găsit
 *                               prin testare directă: lipsea complet de
 *                               aici, deci getLocationStatus.js nu avea de
 *                               unde extrage lat/lng, deși cod din server.js
 *                               (schema.org geo + link-uri de parcare
 *                               YourParkingSpace) presupunea că există.
 * -----------------------------------------------------------------------
 */

const FIELDS = [
  "name",
  "business_status",
  "opening_hours",
  "current_opening_hours",
  "utc_offset",
  "formatted_address",
  "formatted_phone_number",
  "geometry",
].join(",");

async function fetchPlaceDetails(placeId, apiKey, language) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("key", apiKey);
  if (language) url.searchParams.set("language", language);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} de la Google Place Details API`);
  }
  const data = await res.json();

  if (data.status !== "OK") {
    throw new Error(`Google Place Details a răspuns cu status "${data.status}"${data.error_message ? ": " + data.error_message : ""}`);
  }
  return data.result;
}

module.exports = { fetchPlaceDetails };

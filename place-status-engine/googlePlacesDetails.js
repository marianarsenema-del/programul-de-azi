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
 *  - utc_offset_minutes     -> fusul orar local al locației (numele
 *                               corect, actual — "utc_offset", fără
 *                               "_minutes", e depreciat din 2021)
 *  - name, business_status  -> context util (business_status detectează
 *                               și locații închise definitiv/temporar)
 * -----------------------------------------------------------------------
 */

const FIELDS = ["name", "business_status", "opening_hours", "current_opening_hours", "utc_offset_minutes"].join(
  ","
);

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

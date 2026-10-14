// Promoție de lansare: primele 5 rezervări plătite online ale fiecărui CONT de gazdă (nu ale unui anunț) au comision 0%.
// Calcul dinamic, fără contor salvat: se numără rezervările online fără comision acordate prin promoție care încă ocupă un loc:
//   confirmate, reținute activ (în curs de plată) sau anulate de turist cu penalitate (comisionul de 0% s-a consumat). O rambursare integrală (anulare gratuită,
//   anulare de gazdă, expirare) eliberează locul. Se apelează în tranzacția rezervării, cu blocare pe contul gazdei, ca două rezervări simultane să nu depășească limita.
"use strict";
const FREE_LIMIT = 5;
const LOCK_NS = 7001;

async function lockOwner(db, ownerId) { await db.query(`SELECT pg_advisory_xact_lock($1::int, $2::int)`, [LOCK_NS, ownerId]); }
async function usedFree(db, ownerId) {
  const r = await db.query(
    `SELECT COUNT(*)::int AS c FROM booking_reservations r JOIN accommodation_listings l ON l.id = r.listing_id
      WHERE l.owner_id = $1 AND r.promo_free AND r.pay_scheme <> 'direct'
        AND (r.status = 'confirmed' OR (r.status = 'hold' AND r.hold_until > now()) OR (r.status = 'cancelled' AND COALESCE(r.penalty_bani, 0) > 0))`, [ownerId]);
  return Number(r.rows && r.rows[0] && r.rows[0].c) || 0;
}
// true dacă următoarea rezervare online a contului este gratuită (cere ca tranzacția să fie deschisă și contul blocat)
async function nextIsFree(db, ownerId) { return (await usedFree(db, ownerId)) < FREE_LIMIT; }
async function remaining(db, ownerId) { return Math.max(0, FREE_LIMIT - (await usedFree(db, ownerId))); }

module.exports = { FREE_LIMIT, lockOwner, usedFree, nextIsFree, remaining };

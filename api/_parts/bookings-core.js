// Rezervări cazare — funcții pure (fără bază de date, fără Express): date, tarife, iCal, validare URL.
// Folosite de bookings.js și testate separat.
"use strict";
const net = require("net");
const dns = require("dns");
const https = require("https");
const crypto = require("crypto");

const MAX_RANGE_DAYS = 400;
const HORIZON_DAYS = 730;
const ICAL_MAX_BYTES = 2 * 1024 * 1024;
const ICAL_MAX_EVENTS = 5000;

// ---------- date (UTC, fără fus orar: lucrăm doar cu zile calendaristice) ----------
function isDateStr(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}
function dayNum(s) { return Math.round(Date.parse(s + "T00:00:00Z") / 86400000); }
function numToDay(n) { return new Date(n * 86400000).toISOString().slice(0, 10); }
function addDays(s, n) { return numToDay(dayNum(s) + n); }
function dow(s) { return new Date(s + "T00:00:00Z").getUTCDay(); } // 0 = duminică
function todayRo() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return p; // YYYY-MM-DD
}
function eachDay(from, toExclusive) {
  const out = [];
  for (let n = dayNum(from), e = dayNum(toExclusive); n < e; n++) out.push(numToDay(n));
  return out;
}

// Paștele ortodox (algoritmul Meeus, calendar iulian → gregorian)
function orthodoxEaster(year) {
  const a = year % 4, b = year % 7, c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  const julian = Date.UTC(year, month - 1, day);
  const gregorian = julian + 13 * 86400000; // diferența iulian→gregorian în 1900–2099
  return new Date(gregorian).toISOString().slice(0, 10);
}
function suggestedTemplates(year) {
  const easter = orthodoxEaster(year);
  const pent = addDays(easter, 49);
  return [
    { key: "paste", name: "Paște " + year, date_from: addDays(easter, -2), date_to: addDays(easter, 2) },
    { key: "1mai", name: "1 Mai " + year, date_from: year + "-04-30", date_to: year + "-05-02" },
    { key: "rusalii", name: "Rusalii " + year, date_from: addDays(pent, -1), date_to: addDays(pent, 1) },
    { key: "sf-maria", name: "15 August " + year, date_from: year + "-08-14", date_to: year + "-08-16" },
    { key: "craciun", name: "Crăciun " + year, date_from: year + "-12-24", date_to: year + "-12-27" },
    { key: "revelion", name: "Revelion " + year, date_from: year + "-12-30", date_to: (year + 1) + "-01-02" },
    { key: "sezon-vara", name: "Sezon de vârf vară " + year, date_from: year + "-07-01", date_to: year + "-08-31" },
  ];
}

// ---------- tarife ----------
// Prioritate pe noapte: interval (prioritate mai mare, apoi cel mai nou) > weekend (vineri/sâmbătă) > preț de bază.
// la egalitate de tip: regula specifică unei camere bate regula generală, apoi prioritatea, apoi cea mai nouă
function better(a, b) {
  if (!b) return true;
  const sa = a.unit_no != null, sb = b.unit_no != null;
  if (sa !== sb) return sa;
  if (a.priority !== b.priority) return a.priority > b.priority;
  return a.id > b.id;
}
function priceForNight(day, rules, basePriceBani) {
  let best = null;
  for (const r of rules) {
    if (!r.active) continue;
    if (r.kind !== "interval") continue;
    if (day >= r.date_from && day <= r.date_to) {
      if (better(r, best)) best = r;
    }
  }
  if (best) return { price: best.price_bani, rule: best };
  let wk = null;
  const d = dow(day);
  if (d === 5 || d === 6) {
    for (const r of rules) {
      if (!r.active || r.kind !== "weekend") continue;
      if (r.date_from && day < r.date_from) continue;
      if (r.date_to && day > r.date_to) continue;
      if (better(r, wk)) wk = r;
    }
  }
  if (wk) return { price: wk.price_bani, rule: wk };
  return { price: basePriceBani, rule: null };
}

// Calculează oferta pentru [checkIn, checkOut). `busyDays` = Set de zile ocupate. Întoarce {ok, errors[], nights[], totalBani}
function computeQuote({ checkIn, checkOut, guests, settings, rules, busyDays }) {
  const errors = [];
  if (!isDateStr(checkIn) || !isDateStr(checkOut)) return { ok: false, errors: ["date_invalide"] };
  const n = dayNum(checkOut) - dayNum(checkIn);
  if (n < 1) return { ok: false, errors: ["date_invalide"] };
  if (n > 60) return { ok: false, errors: ["prea_multe_nopti"] };
  if (checkIn < todayRo()) errors.push("data_trecuta");
  if (settings.base_price_bani == null && !rules.some((r) => r.active && r.kind === "interval")) errors.push("fara_pret");
  const days = eachDay(checkIn, checkOut);
  for (const d of days) if (busyDays.has(d)) { errors.push("indisponibil"); break; }
  if (settings.max_guests && guests && guests > settings.max_guests) errors.push("prea_multi_oaspeti");
  // reguli active care acoperă data de sosire (interval) sau toate (weekend) — cea mai strictă ședere minimă se aplică
  let minNights = settings.min_nights || 1;
  let checkinDays = null, checkoutDays = null;
  const covering = rules.filter((r) => r.active && (r.kind === "interval" ? checkIn >= r.date_from && checkIn <= r.date_to : true));
  const interval = covering.filter((r) => r.kind === "interval").reduce((acc, r) => (better(r, acc) ? r : acc), null);
  const ruleForArrival = interval || null;
  if (ruleForArrival) {
    if (ruleForArrival.min_nights) minNights = Math.max(minNights, ruleForArrival.min_nights);
    if (ruleForArrival.checkin_days && ruleForArrival.checkin_days.length) checkinDays = ruleForArrival.checkin_days;
    if (ruleForArrival.checkout_days && ruleForArrival.checkout_days.length) checkoutDays = ruleForArrival.checkout_days;
  }
  if (n < minNights) errors.push("sedere_minima:" + minNights);
  if (checkinDays && !checkinDays.includes(dow(checkIn))) errors.push("check_in_nepermis");
  if (checkoutDays && !checkoutDays.includes(dow(checkOut))) errors.push("check_out_nepermis");
  let total = 0;
  const nights = days.map((d) => {
    const p = priceForNight(d, rules, settings.base_price_bani);
    total += p.price == null ? 0 : p.price;
    return { day: d, price_bani: p.price, rule: p.rule ? p.rule.name : null };
  });
  return { ok: errors.length === 0, errors, nights, totalBani: total, minNights };
}

// ---------- zile consecutive → intervale ----------
function groupDays(sortedDays) {
  const out = [];
  let start = null, prev = null;
  for (const d of sortedDays) {
    if (start === null) { start = prev = d; continue; }
    if (dayNum(d) === dayNum(prev) + 1) { prev = d; continue; }
    out.push({ from: start, toExclusive: addDays(prev, 1) });
    start = prev = d;
  }
  if (start !== null) out.push({ from: start, toExclusive: addDays(prev, 1) });
  return out;
}

// ---------- iCal ----------
function icsEscape(s) { return String(s).replace(/[\;,]/g, (m) => "\\" + m).replace(/\r?\n/g, "\\n"); }
function buildIcs({ calName, listingId, days, now }) {
  const stamp = (now || new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Programul de Azi//Rezervari//RO", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:" + icsEscape(calName || "Calendar")];
  for (const g of groupDays(days)) {
    lines.push(
      "BEGIN:VEVENT",
      "UID:" + listingId + "-" + g.from + "-" + g.toExclusive + "@programuldeazi",
      "DTSTAMP:" + stamp,
      "DTSTART;VALUE=DATE:" + g.from.replace(/-/g, ""),
      "DTEND;VALUE=DATE:" + g.toExclusive.replace(/-/g, ""),
      "SUMMARY:Indisponibil",
      "TRANSP:OPAQUE",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n"; // fără date personale: doar „Indisponibil”
}

function icsToDate(val) {
  // 20261227 | 20261227T140000Z | 20261227T140000
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(String(val || "").trim());
  if (!m) return null;
  const s = m[1] + "-" + m[2] + "-" + m[3];
  return isDateStr(s) ? s : null;
}
// Întoarce { ok, days:Set<string>, events, error }. Zilele = nopțile ocupate [DTSTART, DTEND).
function parseIcs(text, opts) {
  const today = (opts && opts.today) || todayRo();
  const lastDay = addDays(today, HORIZON_DAYS);
  if (typeof text !== "string" || !/BEGIN:VCALENDAR/i.test(text)) return { ok: false, error: "nu_e_icalendar", days: new Set(), events: 0 };
  const unfolded = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n[ \t]/g, "");
  const lines = unfolded.split("\n");
  const days = new Set();
  let events = 0, cur = null;
  for (const line of lines) {
    const up = line.trim().toUpperCase();
    if (up === "BEGIN:VEVENT") { cur = {}; continue; }
    if (up === "END:VEVENT") {
      if (cur && cur.start && cur.status !== "CANCELLED") {
        events++;
        if (events > ICAL_MAX_EVENTS) return { ok: false, error: "prea_multe_evenimente", days: new Set(), events };
        let end = cur.end && cur.end > cur.start ? cur.end : addDays(cur.start, 1);
        if (dayNum(end) - dayNum(cur.start) > 1000) end = addDays(cur.start, 1000);
        for (let n = dayNum(cur.start), e = dayNum(end); n < e; n++) {
          const d = numToDay(n);
          if (d >= today && d <= lastDay) days.add(d);
        }
      }
      cur = null; continue;
    }
    if (!cur) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const name = line.slice(0, idx).split(";")[0].toUpperCase();
    const val = line.slice(idx + 1);
    if (name === "DTSTART") cur.start = icsToDate(val);
    else if (name === "DTEND") cur.end = icsToDate(val);
    else if (name === "STATUS") cur.status = val.trim().toUpperCase();
  }
  return { ok: true, days, events };
}

// ---------- protecție SSRF ----------
function isPrivateIp(ip) {
  const v = net.isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true;
    return false;
  }
  if (v === 6) {
    const l = ip.toLowerCase();
    if (l === "::" || l === "::1") return true;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(l);
    if (mapped) return isPrivateIp(mapped[1]);
    const mappedHex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(l);
    if (mappedHex) {
      const h1 = parseInt(mappedHex[1], 16), h2 = parseInt(mappedHex[2], 16);
      return isPrivateIp([h1 >> 8, h1 & 255, h2 >> 8, h2 & 255].join("."));
    }
    if (/^f[cd]/.test(l)) return true;          // fc00::/7
    if (/^fe[89ab]/.test(l)) return true;       // fe80::/10
    if (/^ff/.test(l)) return true;             // multicast
    if (l.startsWith("64:ff9b:") || l.startsWith("2001:db8") || l.startsWith("100:")) return true;
    return false;
  }
  return true; // nu e IP valid → tratat ca nesigur
}
function parseFeedUrl(raw) {
  if (typeof raw !== "string" || raw.length > 2000) return { ok: false, error: "url_invalid" };
  let u;
  try { u = new URL(raw.trim()); } catch (e) { return { ok: false, error: "url_invalid" }; }
  if (u.protocol !== "https:") return { ok: false, error: "doar_https" };
  if (u.username || u.password) return { ok: false, error: "url_invalid" };
  if (u.port && u.port !== "443") return { ok: false, error: "port_nepermis" };
  const host = u.hostname.toLowerCase();
  if (!host.includes(".") && net.isIP(host.replace(/^\[|\]$/g, "")) === 0) return { ok: false, error: "gazda_nepermisa" };
  if (/(^|\.)(localhost|local|internal|lan|home|corp)$/.test(host)) return { ok: false, error: "gazda_nepermisa" };
  const bare = host.replace(/^\[|\]$/g, "");
  if (net.isIP(bare) && isPrivateIp(bare)) return { ok: false, error: "gazda_nepermisa" };
  u.hash = "";
  return { ok: true, url: u };
}
// rezolvă și verifică; întoarce adresa pe care ne conectăm (fixată → fără DNS rebinding)
async function resolvePublic(host, lookupFn) {
  const bare = host.replace(/^\[|\]$/g, "");
  if (net.isIP(bare)) return isPrivateIp(bare) ? null : { address: bare, family: net.isIP(bare) };
  const list = await (lookupFn || dns.promises.lookup)(bare, { all: true });
  if (!list || !list.length) return null;
  for (const a of list) if (isPrivateIp(a.address)) return null;
  return { address: list[0].address, family: list[0].family };
}
// GET https cu limită de timp/dimensiune, fără redirecturi automate necontrolate (max 3, fiecare re-validat)
async function safeFetchIcs(rawUrl, cond, deps) {
  const lookupFn = deps && deps.lookup;
  const requestFn = (deps && deps.request) || https.request;
  let current = rawUrl;
  for (let hop = 0; hop < 4; hop++) {
    const p = parseFeedUrl(current);
    if (!p.ok) return { ok: false, error: p.error };
    const target = await resolvePublic(p.url.hostname, lookupFn).catch(() => null);
    if (!target) return { ok: false, error: "gazda_nepermisa" };
    const res = await new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (!done) { done = true; resolve(v); } };
      const headers = { "User-Agent": "ProgramuldeAzi-iCal/1.0", Accept: "text/calendar, text/plain;q=0.8, */*;q=0.1", "Accept-Encoding": "identity" };
      if (cond && cond.etag) headers["If-None-Match"] = cond.etag;
      if (cond && cond.lastModified) headers["If-Modified-Since"] = cond.lastModified;
      const req = requestFn({
        protocol: "https:", hostname: p.url.hostname.replace(/^\[|\]$/g, ""), port: 443, method: "GET",
        path: p.url.pathname + p.url.search, headers, servername: p.url.hostname.replace(/^\[|\]$/g, ""),
        lookup: (h, o, cb) => cb(null, target.address, target.family), // conectare doar la IP-ul verificat
        timeout: 8000,
      }, (r) => {
        const code = r.statusCode;
        if (code >= 300 && code < 400 && r.headers.location) { r.resume(); return finish({ redirect: new URL(r.headers.location, p.url).toString() }); }
        if (code === 304) { r.resume(); return finish({ ok: true, notModified: true }); }
        if (code !== 200) { r.resume(); return finish({ ok: false, error: "http_" + code }); }
        const chunks = []; let size = 0;
        r.on("data", (c) => { size += c.length; if (size > ICAL_MAX_BYTES) { finish({ ok: false, error: "fisier_prea_mare" }); r.destroy(); } else chunks.push(c); });
        r.on("end", () => finish({ ok: true, body: Buffer.concat(chunks).toString("utf8"), etag: r.headers.etag || null, lastModified: r.headers["last-modified"] || null }));
        r.on("error", () => finish({ ok: false, error: "retea" }));
      });
      req.on("timeout", () => { req.destroy(); finish({ ok: false, error: "timeout" }); });
      req.on("error", () => finish({ ok: false, error: "retea" }));
      req.end();
    });
    if (res.redirect) { current = res.redirect; continue; }
    return res;
  }
  return { ok: false, error: "prea_multe_redirectari" };
}

function sha256(s) { return crypto.createHash("sha256").update(s).digest("hex"); }
function newExportToken() { return crypto.randomBytes(24).toString("hex"); }

module.exports = {
  MAX_RANGE_DAYS, HORIZON_DAYS, isDateStr, dayNum, numToDay, addDays, dow, todayRo, eachDay,
  orthodoxEaster, suggestedTemplates, priceForNight, computeQuote, groupDays, buildIcs, parseIcs,
  isPrivateIp, parseFeedUrl, resolvePublic, safeFetchIcs, sha256, newExportToken,
};

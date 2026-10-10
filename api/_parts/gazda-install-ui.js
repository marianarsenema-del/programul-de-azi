// Ghidul de instalare din aplicația OHT Host: recunoaște telefonul și browserul și arată pașii potriviți.
// Funcțiile rulează în browser (sunt incluse în aplicație prin .toString()); folosesc ajutoarele aplicației:
// el, deferredPrompt, standalone. Fără biblioteci externe (inclusiv codul QR e calculat aici).
"use strict";

// ---------- cod QR (mod octeți, corecție L, versiunile 1–6: până la 134 de caractere) ----------
function ohtQr(text) {
  const data = Array.from(new TextEncoder().encode(text));
  const CAP = [[26, 7, 1], [44, 10, 1], [70, 15, 1], [100, 20, 1], [134, 26, 1], [172, 18, 2]]; // total, corecție/bloc, blocuri
  let ver = -1;
  for (let i = 0; i < CAP.length; i++) { if (data.length <= CAP[i][0] - CAP[i][1] * CAP[i][2] - 2) { ver = i; break; } }
  if (ver < 0) return null;
  const tot = CAP[ver][0], ecn = CAP[ver][1], nb = CAP[ver][2], dcw = tot - ecn * nb, V = ver + 1, N = 17 + 4 * V;
  const bits = [];
  const put = (v, len) => { for (let i = len - 1; i >= 0; i--) bits.push((v >> i) & 1); };
  put(4, 4); put(data.length, 8); data.forEach((b) => put(b, 8));
  const cap = dcw * 8;
  put(0, Math.min(4, cap - bits.length));
  while (bits.length % 8) bits.push(0);
  for (let p = 0xEC; bits.length < cap; p ^= 0xEC ^ 0x11) put(p, 8);
  const cw = [];
  for (let i = 0; i < bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; cw.push(b); }
  const exp = new Array(512), log = new Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) { exp[i] = x; log[x] = i; x <<= 1; if (x & 256) x ^= 0x11D; }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
  const mul = (a, b) => (a && b ? exp[log[a] + log[b]] : 0);
  let g = [1];
  for (let i = 0; i < ecn; i++) { const n = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { n[j] ^= g[j]; n[j + 1] ^= mul(g[j], exp[i]); } g = n; }
  const rs = (d) => { const r = new Array(ecn).fill(0); for (const b of d) { const f = b ^ r.shift(); r.push(0); for (let i = 0; i < ecn; i++) r[i] ^= mul(g[i + 1], f); } return r; };
  const per = dcw / nb, blocks = [], ecs = [];
  for (let b = 0; b < nb; b++) { const d = cw.slice(b * per, (b + 1) * per); blocks.push(d); ecs.push(rs(d)); }
  const fin = [];
  for (let i = 0; i < per; i++) for (let b = 0; b < nb; b++) fin.push(blocks[b][i]);
  for (let i = 0; i < ecn; i++) for (let b = 0; b < nb; b++) fin.push(ecs[b][i]);
  const M = [], F = [];
  for (let i = 0; i < N; i++) { M.push(new Array(N).fill(0)); F.push(new Array(N).fill(false)); }
  const set = (X, Y, d) => { if (X >= 0 && Y >= 0 && X < N && Y < N) { M[Y][X] = d ? 1 : 0; F[Y][X] = true; } };
  const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)); set(cx + dx, cy + dy, d !== 2 && d !== 4); } };
  finder(3, 3); finder(N - 4, 3); finder(3, N - 4);
  for (let i = 8; i < N - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  if (V >= 2) { const c = 4 * V + 10; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(c + dx, c + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }
  const formatBits = (mask) => { const d = (1 << 3) | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >> 9) * 0x537); return ((d << 10) | r) ^ 0x5412; };
  const drawFormat = (mat, fl, mask) => {
    const bits15 = formatBits(mask), bit = (i) => (bits15 >> i) & 1;
    const s = (X, Y, d) => { mat[Y][X] = d ? 1 : 0; if (fl) fl[Y][X] = true; };
    for (let i = 0; i <= 5; i++) s(8, i, bit(i));
    s(8, 7, bit(6)); s(8, 8, bit(7)); s(7, 8, bit(8));
    for (let i = 9; i < 15; i++) s(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) s(N - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) s(8, N - 15 + i, bit(i));
    s(8, N - 8, 1);
  };
  drawFormat(M, F, 0);
  let k = 0;
  for (let right = N - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < N; vert++) {
      for (let j = 0; j < 2; j++) {
        const X = right - j, up = ((right + 1) & 2) === 0, Y = up ? N - 1 - vert : vert;
        if (!F[Y][X] && k < fin.length * 8) { M[Y][X] = (fin[k >> 3] >> (7 - (k & 7))) & 1; k++; }
      }
    }
  }
  const MASKS = [(X, Y) => (X + Y) % 2 === 0, (X, Y) => Y % 2 === 0, (X) => X % 3 === 0, (X, Y) => (X + Y) % 3 === 0,
    (X, Y) => (Math.floor(X / 3) + Math.floor(Y / 2)) % 2 === 0, (X, Y) => ((X * Y) % 2) + ((X * Y) % 3) === 0,
    (X, Y) => (((X * Y) % 2) + ((X * Y) % 3)) % 2 === 0, (X, Y) => (((X + Y) % 2) + ((X * Y) % 3)) % 2 === 0];
  const penalty = (m) => {
    let p = 0;
    for (let a = 0; a < N; a++) for (const row of [true, false]) {
      let run = 1;
      for (let b = 1; b < N; b++) {
        const cur = row ? m[a][b] : m[b][a], prev = row ? m[a][b - 1] : m[b - 1][a];
        if (cur === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
      }
    }
    for (let Y = 0; Y < N - 1; Y++) for (let X = 0; X < N - 1; X++) { const c = m[Y][X]; if (c === m[Y][X + 1] && c === m[Y + 1][X] && c === m[Y + 1][X + 1]) p += 3; }
    let dark = 0;
    for (const row of m) for (const c of row) dark += c;
    p += Math.floor(Math.abs(dark * 20 - N * N * 10) / (N * N)) * 10;
    return p;
  };
  let best = null, bestP = Infinity;
  for (let mk = 0; mk < 8; mk++) {
    const m = M.map((r) => r.slice());
    for (let Y = 0; Y < N; Y++) for (let X = 0; X < N; X++) if (!F[Y][X] && MASKS[mk](X, Y)) m[Y][X] ^= 1;
    drawFormat(m, null, mk);
    const p = penalty(m);
    if (p < bestP) { bestP = p; best = m; }
  }
  return best;
}

// SVG-ul codului QR ca text (folosit în pagina contului, unde nu există ajutoarele aplicației)
function ohtQrSvg(text, px) {
  const m = ohtQr(text); if (!m) return '';
  const n = m.length, q = 4; let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) d += 'M' + (x + q) + ' ' + (y + q) + 'h1v1h-1z';
  const t = n + 2 * q;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + t + ' ' + t + '" width="' + (px || 200) + '" height="' + (px || 200) + '" role="img" aria-label="Cod QR" style="display:block;margin:12px auto;background:#fff;border-radius:8px"><rect width="' + t + '" height="' + t + '" fill="#fff"/><path d="' + d + '" fill="#17222B"/></svg>';
}

// ---------- ghidul de instalare ----------
function installCard() {
  const ua = navigator.userAgent || '';
  // când omul pleacă în browser și se întoarce, ecranul se curăță: nu mai arată pașii vechi, ci „Ai terminat?”
  const armReturn = (card) => {
    let left = false;
    const onVis = () => {
      if (!card.isConnected) { document.removeEventListener('visibilitychange', onVis); return; }
      if (document.visibilityState === 'hidden') { left = true; return; }
      if (!left) return;
      left = false; document.removeEventListener('visibilitychange', onVis);
      card.replaceChildren(
        el('div', { style: 'font-size:18px;font-weight:800' }, ['Ai terminat?']),
        el('div', { style: 'font-size:15px;line-height:1.45;margin:8px 0 12px' }, ['Dacă ai adăugat OHT Host pe ecranul principal, deschide-o de acolo. De acum nu mai ai nevoie de acest ecran.']));
      const goBtn = el('button', { type: 'button', style: 'width:100%;height:50px;font-size:16px' }, ['Merg în contul meu']);
      goBtn.onclick = () => { location.href = '/cont'; };
      const again = el('button', { type: 'button', class: 's', style: 'width:100%;margin-top:8px' }, ['Nu am instalat încă']);
      again.onclick = () => { const n = installCard(); if (n) card.replaceWith(n); };
      card.append(goBtn, again);
      card.style.cssText = 'border:2px solid #0E6B63';
    };
    document.addEventListener('visibilitychange', onVis);
    return { mark: () => { left = true; } };
  };
  // aplicația OHT Host instalată se pornește cu ?app=1 (vezi manifestul) și își ține semnul în memoria ei
  try { if (/[?&]app=1(&|$)/.test(location.search)) lsSet('ohtApp', '1'); } catch (e) {}
  let mine = false, sa = false;
  try { sa = !!standalone(); if (sa) mine = lsGet('ohtApp') === '1'; } catch (e) {}
  if (sa && mine) return null; // aplicația OHT Host instalată nu mai arată ghidul
  const iOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // tabletele Android cer des „site pentru calculator”: user-agent fără „Android”, dar cu atingere (ecran tactil) și Linux
  const touch = (navigator.maxTouchPoints || 0) > 1;
  const uaPlat = (navigator.userAgentData && navigator.userAgentData.platform) || '';
  const android = /Android/i.test(ua) || uaPlat === 'Android' || (!iOS && touch && /Linux|X11/.test(ua) && !/CrOS/.test(ua));
  const google = /GSA\/|GoogleApp/i.test(ua);
  // browser din altă aplicație (Google, Facebook, Instagram, WhatsApp…): pe iPhone un WebView nu are „Safari/” în user-agent și nici navigator.standalone
  const inApp = google || /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Messenger|TikTok|musical_ly|Snapchat|LinkedInApp|Line\/|Twitter|; wv\)/i.test(ua)
    || (iOS && !/Safari\//.test(ua)) || (iOS && typeof navigator.standalone === 'undefined' && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\//.test(ua));
  let kind, label;
  if (inApp) { kind = 'inapp'; label = (iOS ? 'iPhone' : 'Android') + ' · ' + (google ? 'aplicația Google' : 'browser din altă aplicație'); }
  else if (iOS) {
    if (/CriOS/.test(ua)) { kind = 'ios-other'; label = 'iPhone · Chrome'; }
    else if (/FxiOS/.test(ua)) { kind = 'ios-other'; label = 'iPhone · Firefox'; }
    else if (/EdgiOS/.test(ua)) { kind = 'ios-other'; label = 'iPhone · Edge'; }
    else if (/OPiOS|OPT\//.test(ua)) { kind = 'ios-other'; label = 'iPhone · Opera'; }
    else { kind = 'ios-safari'; label = 'iPhone · Safari'; }
  } else if (android) {
    if (/SamsungBrowser/.test(ua)) { kind = 'samsung'; label = 'Android · Samsung Internet'; }
    else if (/Firefox/.test(ua)) { kind = 'android-ff'; label = 'Android · Firefox'; }
    else { kind = 'android-chrome'; label = /EdgA/.test(ua) ? 'Android · Edge' : (/OPR\//.test(ua) ? 'Android · Opera' : 'Android · Chrome'); }
  } else if (deferredPrompt) { kind = 'native'; label = 'browser care poate instala aplicația'; }
  else { kind = 'desktop'; label = 'calculator (nu telefon)'; }
  if (sa && !mine) { kind = 'inapp'; label = (iOS ? 'iPhone' : 'Android') + ' · altă aplicație instalată'; }
  // oriunde browserul oferă instalarea nativă (Chrome, Edge), un singur buton face totul
  if (deferredPrompt && (kind === 'android-chrome' || kind === 'desktop' || kind === 'samsung' || kind === 'android-ff')) kind = kind === 'desktop' ? 'native' : 'android-chrome';

  const NS = 'http://www.w3.org/2000/svg';
  const svg = (paths, size, col, fill) => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('width', size); s.setAttribute('height', size); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', fill || 'none'); s.setAttribute('stroke', col || '#0A84FF'); s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true'); paths.forEach((d) => { const p = document.createElementNS(NS, d.t || 'path'); for (const a in d) if (a !== 't') p.setAttribute(a, d[a]); s.append(p); }); return s; };
  const iShare = () => svg([{ d: 'M12 15V3' }, { d: 'M8 7l4-4 4 4' }, { d: 'M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1' }], 22);
  const iKebab = () => svg([{ t: 'circle', cx: 12, cy: 5, r: 1.6 }, { t: 'circle', cx: 12, cy: 12, r: 1.6 }, { t: 'circle', cx: 12, cy: 19, r: 1.6 }], 22, '#3C3C43', '#3C3C43');
  const iDots = () => svg([{ t: 'circle', cx: 5, cy: 12, r: 1.6 }, { t: 'circle', cx: 12, cy: 12, r: 1.6 }, { t: 'circle', cx: 19, cy: 12, r: 1.6 }], 22, '#3C3C43', '#3C3C43');
  const iBars = () => svg([{ d: 'M4 7h16' }, { d: 'M4 12h16' }, { d: 'M4 17h16' }], 22, '#3C3C43');
  const ring = (node) => el('span', { style: 'display:inline-flex;align-items:center;justify-content:center;border:3px solid #FF6B00;border-radius:10px;padding:2px 5px;vertical-align:middle;background:#FFF3E8;margin:0 2px' }, [node]);
  const B = (t) => el('b', {}, [t]);
  const step = (n, parts) => el('div', { style: 'display:flex;gap:10px;align-items:flex-start;margin-top:10px' }, [el('div', { style: 'flex:none;width:22px;height:22px;border-radius:50%;border:2px solid #0E6B63;color:#0E6B63;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center' }, ['abc'[n - 1] || '•']), el('div', { style: 'font-size:15px;line-height:1.4;padding-top:2px' }, parts)]);
  const url = location.origin + '/gazda/';
  const copyBtn = (text) => {
    const b = el('button', { type: 'button', class: 's', style: 'width:100%;margin-top:12px' }, [text]);
    b.onclick = async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(location.href.split('#')[0]); ok = true; } catch (e) {
        try { const t = el('textarea', { style: 'position:fixed;opacity:0' }); t.value = location.href.split('#')[0]; document.body.append(t); t.select(); ok = document.execCommand('copy'); t.remove(); } catch (e2) { ok = false; }
      }
      if (rt) rt.mark();
      b.textContent = ok ? 'Link copiat. Lipește-l în ' + (iOS ? 'Safari' : 'Chrome') + '.' : 'Copiază manual: ' + location.href.split('#')[0];
    };
    return b;
  };

  const c = el('div', { class: 'card', style: 'border:2px solid #0E6B63' });
  const rt = (kind === 'inapp' || kind === 'ios-other') ? armReturn(c) : null;
  const s1 = el('div');
  const s1Title = kind === 'inapp' ? (iOS ? 'Deschide în Safari' : 'Deschide în Chrome') : (kind === 'desktop' ? 'Scanează cu telefonul' : kind === 'native' ? 'Apasă Instalează' : 'Adaugă aplicația pe ecranul telefonului');
  // butonul „Deschide în Safari/Chrome”: copiază linkul, încearcă deschiderea, iar dacă telefonul o blochează spune ce să faci
  const openOut = (mark) => {
    const target = location.origin + '/gazda/';
    const launch = () => {
      if (iOS) location.href = 'x-safari-' + target;
      else location.href = 'intent://' + location.host + '/gazda/#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;component=com.android.chrome/com.google.android.apps.chrome.Main;S.browser_fallback_url=' + encodeURIComponent(target) + ';end';
    };
    const btn = el('button', { type: 'button', style: 'width:100%;margin-top:10px;height:54px;font-size:18px' }, [iOS ? 'Deschide în Safari' : 'Deschide în Chrome']);
    btn.onclick = () => { if (mark) mark(); launch(); };
    // dacă telefonul nu pornește singur browserul: linkul se vede și se copiază cu un buton, fără copiere automată
    const cp = el('button', { type: 'button', class: 's', style: 'flex:none;height:44px;padding:0 16px;font-size:15px' }, ['Copiază']);
    cp.onclick = async () => {
      if (mark) mark();
      let ok = false;
      try { await navigator.clipboard.writeText(target); ok = true; } catch (e) {
        try { const t = el('textarea', { style: 'position:fixed;opacity:0' }); t.value = target; document.body.append(t); t.select(); ok = document.execCommand('copy'); t.remove(); } catch (e2) { ok = false; }
      }
      cp.textContent = ok ? 'Copiat ✓' : 'Ține apăsat pe link';
    };
    const note = el('div', { style: 'margin-top:12px' }, [
      el('div', { style: 'font-size:15px;line-height:1.4' }, ['Dacă nu se deschide, copiază linkul de mai jos, deschide ' + (iOS ? 'Safari' : 'Chrome') + ' din lista de aplicații și lipește-l în bara de adresă.']),
      el('div', { style: 'display:flex;gap:8px;align-items:center;margin-top:8px' }, [
        el('div', { style: 'flex:1;min-width:0;padding:10px 12px;border:1px solid #C8D2D8;border-radius:10px;background:#fff;font-size:14px;word-break:break-all;user-select:all' }, [target]), cp])]);
    return { btn, note, launch };
  };
  if (kind === 'ios-safari') {
    s1.append(step(1, ['Apasă butonul ', B('Partajează'), ' ', ring(iShare()), ' din bara de jos a ecranului.']));
    s1.append(step(2, ['Derulează și alege ', B('Adaugă pe ecranul principal'), '.']));
    s1.append(step(3, ['Apasă ', B('Adaugă'), ', apoi deschide ', B('OHT Host'), ' de pe ecranul principal.']));
  } else if (kind === 'ios-other') {
    s1.append(step(1, ['Apasă butonul ', B('Partajează'), ' ', ring(iShare()), ' de lângă bara de adresă.']));
    s1.append(step(2, ['Alege ', B('Adaugă pe ecranul principal'), ', apoi ', B('Adaugă'), '.']));
    s1.append(step(3, ['Nu vezi opțiunea? Copiază linkul și deschide-l în ', B('Safari'), '.']));
    s1.append(copyBtn('Copiază linkul pentru Safari'));
  } else if (kind === 'android-chrome') {
    if (deferredPrompt) {
      s1.append(step(1, ['Apasă butonul de mai jos. Telefonul îți cere confirmarea.']));
      s1.append(step(2, ['Apasă ', B('Instalează'), '. Pictograma apare pe ecranul principal.']));
      const b = el('button', { type: 'button', style: 'width:100%;margin-top:12px;height:50px;font-size:16px' }, ['Instalează aplicația']);
      b.onclick = async () => { deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch (e) {} deferredPrompt = null; c.remove(); };
      s1.append(b);
    } else {
      s1.append(step(1, ['Apasă meniul ', ring(iKebab()), ' din colțul de sus al browserului.']));
      s1.append(step(2, ['Alege ', B('Instalează aplicația'), ' (sau ', B('Adaugă pe ecranul principal'), ').']));
      s1.append(step(3, ['Apasă ', B('Instalează'), ' și deschide ', B('OHT Host'), ' de pe ecranul principal.']));
    }
    if (!deferredPrompt) s1.append(el('div', { style: 'margin-top:12px;padding:9px 11px;border-radius:10px;background:#EEF4F3;font-size:14px;line-height:1.4' }, ['Chrome spune „Această aplicație este instalată deja”? Atunci OHT Host e pe telefon. Apasă pe acel mesaj ca s-o deschizi, sau caut-o în lista de aplicații și ține apăsat ca s-o muți pe ecranul principal.']));
  } else if (kind === 'native') {
    s1.append(el('div', { style: 'font-size:15px;line-height:1.4;margin-top:6px' }, ['Apasă butonul. Aplicația se instalează și apare pe ecranul principal sau în lista de aplicații.']));
    const nb = el('button', { type: 'button', style: 'width:100%;margin-top:12px;height:54px;font-size:18px' }, ['Instalează aplicația']);
    nb.onclick = async () => { deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch (e) {} deferredPrompt = null; c.remove(); };
    s1.append(nb);
  } else if (kind === 'samsung') {
    s1.append(step(1, ['Apasă meniul ', ring(iBars()), ' din bara de jos.']));
    s1.append(step(2, ['Alege ', B('Adaugă pagina la'), ' → ', B('Ecran principal'), '.']));
    s1.append(step(3, ['Apasă ', B('Adaugă'), ' și deschide ', B('OHT Host'), ' de pe ecranul principal.']));
  } else if (kind === 'android-ff') {
    s1.append(step(1, ['Apasă meniul ', ring(iKebab()), ' din colțul de sus.']));
    s1.append(step(2, ['Alege ', B('Instalează'), ' (sau ', B('Adaugă la ecranul principal'), ').']));
    s1.append(step(3, ['Deschide ', B('OHT Host'), ' de pe ecranul principal.']));
  } else if (kind === 'inapp') {
    const o = openOut(rt ? rt.mark : null);
    s1.append(el('div', { style: 'font-size:15px;line-height:1.4;margin-top:6px' }, ['Instalarea merge doar din ' + (iOS ? 'Safari' : 'Chrome') + ', nu din ' + (sa ? 'această aplicație' : (google ? 'aplicația Google' : 'această aplicație')) + '. Apasă butonul; acolo vei vedea ce ai de făcut.']));
    s1.append(o.btn, o.note);
    if (!sa) { let tried = false; try { tried = sessionStorage.getItem('ohtOpen') === '1'; sessionStorage.setItem('ohtOpen', '1'); } catch (e) {} if (!tried) setTimeout(o.launch, 600); }
  } else { // calculator
    s1.append(el('div', { style: 'font-size:15px;line-height:1.4;margin-top:6px;color:#4A565F' }, ['Scanează codul cu camera telefonului. Se deschide pagina, iar telefonul îți arată pașii potriviți.']));
    const qbox = el('div');
    const paint = (u) => {
      qbox.replaceChildren();
      const holder = el('div'); holder.innerHTML = ohtQrSvg(u, 200); // markup generat local din date proprii, fără conținut extern
      qbox.append(holder);
      qbox.append(el('div', { class: 'sub', style: 'text-align:center' }, ['sau trimite-ți linkul:']));
      const row = el('div', { style: 'display:flex;gap:8px;margin-top:8px' });
      row.append(el('a', { class: 'mini', href: 'https://wa.me/?text=' + encodeURIComponent('OHT Host: ' + u), target: '_blank', rel: 'noopener', style: 'flex:1;justify-content:center;background:#0E6B63;color:#fff;height:44px' }, ['WhatsApp']));
      row.append(el('a', { class: 'mini', href: 'mailto:?subject=' + encodeURIComponent('Aplicația OHT Host') + '&body=' + encodeURIComponent(u), style: 'flex:1;justify-content:center;height:44px' }, ['E-mail']));
      qbox.append(row);
    };
    paint(url);
    // în cont, codul poartă un link personal de o singură folosință: telefonul se deschide direct conectat
    if (typeof raw === 'function') raw('POST', '/api/gazda/link/creeaza', {}).then((r) => { if (r && r.ok && r.j && r.j.url) paint(r.j.url); }).catch(() => {});
    s1.append(qbox);
  }
  const block = (n, title, content) => el('div', { style: 'display:flex;gap:12px;align-items:flex-start;margin-top:16px' }, [
    el('div', { style: 'flex:none;width:34px;height:34px;border-radius:50%;background:#0E6B63;color:#fff;font-weight:800;font-size:18px;display:flex;align-items:center;justify-content:center' }, [String(n)]),
    el('div', { style: 'flex:1;min-width:0' }, [el('div', { style: 'font-size:17px;font-weight:800;padding-top:5px' }, [title]), content])]);
  const s2 = el('div', { style: 'font-size:15px;line-height:1.45;margin-top:6px;display:flex;gap:10px;align-items:center' }, [
    el('img', { src: '/gazda/icon-192.png', alt: '', width: '44', height: '44', style: 'flex:none;border-radius:10px' }),
    el('div', {}, ['Caută pictograma ', B('OHT Host'), ' pe ecranul telefonului și apas-o. Alegi cum intri de acum încolo, ', B('Face ID'), ' sau ', B('PIN'), ', și ai intrat în aplicație.'])]);
  c.append(el('div', { style: 'font-size:20px;font-weight:800' }, ['Instalează OHT Host în 2 pași']));
  c.append(block(1, s1Title, s1));
  // pe iPhone, aplicația de pe ecran nu primește sesiunea din Safari: arătăm aici un cod scurt, valabil 30 de minute, pentru prima deschidere
  const codeBox = el('div', { style: 'margin-top:8px;padding:9px 11px;border-radius:10px;background:#EEF4F3;font-size:14px;line-height:1.4;display:none' });
  c.append(block(2, 'Deschide OHT Host de pe ecran', el('div', {}, [s2, codeBox])));
  if (iOS && typeof raw === 'function' && (kind === 'ios-safari' || kind === 'ios-other')) {
    raw('POST', '/api/gazda/link/creeaza', { short: true }).then((r) => {
      if (r && r.ok && r.j && r.j.code) { codeBox.style.display = 'block'; codeBox.replaceChildren('Dacă aplicația îți cere un cod la prima deschidere, scrie: ', el('b', { style: 'letter-spacing:2px;font-size:16px' }, [r.j.code]), ' (valabil ' + r.j.minutes + ' de minute, o singură dată).'); }
    }).catch(() => {});
  }
  c.append(el('div', { style: 'margin-top:14px;font-size:11px;color:#8A949C' }, ['Detectat: ' + label]));
  return c;
}

module.exports = { installSrc: ohtQr.toString() + "\n" + ohtQrSvg.toString() + "\n" + installCard.toString(), qrSrc: ohtQr.toString() + "\n" + ohtQrSvg.toString() };

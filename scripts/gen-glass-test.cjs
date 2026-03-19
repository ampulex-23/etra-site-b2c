const fs = require('fs');
const path = require('path');

const dmB64 = 'data:image/png;base64,' + fs.readFileSync(
  path.join(__dirname, '..', 'public', 'images', 'pill-convex.png'), 'base64'
);

const bgUrl = 'https://etraproject.ru/images/bg.jpg';

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Glass Lens — Стенд</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  min-height: 200vh;
  font-family: 'Inter', system-ui, sans-serif;
  color: #e8f5ef;
  background: #071a12;
}

/* ── Page background (same as PWA) ── */
.bg {
  position: fixed; inset: 0; z-index: 0;
  background: url('${bgUrl}') center/cover no-repeat;
}
.bg::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(4,14,10,0.70) 0%, rgba(7,26,18,0.55) 50%, rgba(4,14,10,0.75) 100%);
}

.content {
  position: relative; z-index: 1;
  max-width: 420px; margin: 0 auto;
  padding: 30px 16px;
}
h2 {
  color: #3beca0; font-size: 15px; font-weight: 600;
  margin: 28px 0 10px; padding-left: 4px;
}
h2:first-child { margin-top: 0; }
.note {
  color: rgba(232,245,239,0.5); font-size: 12px;
  text-align: center; margin-top: 6px;
}
.text { font-size: 15px; font-weight: 500; line-height: 1.6; }
.label {
  font-size: 10px; color: rgba(232,245,239,0.35);
  margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;
}

/* ═══════════════════════════════════════
   Card base
   ═══════════════════════════════════════ */
.card {
  position: relative;
  border-radius: 16px; overflow: hidden;
  border: 1px solid rgba(80,200,160,0.25);
  padding: 20px; margin-bottom: 8px;
}

/* ── A: Control — just backdrop-filter blur ── */
.card-a {
  background: rgba(45, 94, 83, 0.42);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
}

/* ── B: backdrop-filter: url(#glass-card) blur(1px) brightness(1.05)
   Matches PWA approach — scale=150 ── */
.card-b {
  background: rgba(45, 94, 83, 0.42);
  backdrop-filter: url(#glass-card) blur(1px) brightness(1.05);
  -webkit-backdrop-filter: url(#glass-card) blur(1px) brightness(1.05);
}

/* ── C: backdrop-filter: url(#glass-card) only — no blur/brightness ── */
.card-c {
  background: rgba(45, 94, 83, 0.42);
  backdrop-filter: url(#glass-card);
  -webkit-backdrop-filter: url(#glass-card);
}

/* ── D: backdrop-filter: url(#glass-150) — scale=150, file path ── */
.card-d {
  background: rgba(45, 94, 83, 0.42);
  backdrop-filter: url(#glass-150) blur(1px) brightness(1.05);
  -webkit-backdrop-filter: url(#glass-150) blur(1px) brightness(1.05);
}

/* ── E: ::before fixed bg + filter:url(#displace) — fallback ── */
.card-e {
  background: transparent;
}
.card-e::before {
  content: '';
  position: absolute; inset: -10px;
  z-index: 0;
  background:
    linear-gradient(180deg, rgba(4,14,10,0.70) 0%, rgba(7,26,18,0.55) 50%, rgba(4,14,10,0.75) 100%),
    url('${bgUrl}') center/cover no-repeat fixed;
  filter: url(#glass-displace);
}
.card-e::after {
  content: '';
  position: absolute; inset: 0; z-index: 1;
  border-radius: inherit;
  background: rgba(45, 94, 83, 0.42);
  pointer-events: none;
}
.card-e .text { position: relative; z-index: 2; }

/* ── Pill variants ── */
.pill-wrap { display: flex; gap: 6px; flex-wrap: wrap; }
.pill {
  display: inline-block; position: relative;
  border-radius: 999px; overflow: hidden;
  border: 1px solid rgba(80,200,160,0.25);
  padding: 8px 20px; margin: 0;
  font-size: 13px; font-weight: 500;
}
.pill-bd {
  background: rgba(45, 94, 83, 0.42);
  backdrop-filter: url(#pill-lens) blur(1px) brightness(1.05);
  -webkit-backdrop-filter: url(#pill-lens) blur(1px) brightness(1.05);
}
.pill-ctrl {
  background: rgba(45, 94, 83, 0.42);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
}
</style>
</head>
<body>

<div class="bg"></div>

<!-- ═══ SVG FILTERS ═══ -->

<!-- Filter set 1: display:none SVG (same as layout.tsx in PWA) -->
<svg style="display:none" xmlns="http://www.w3.org/2000/svg">
  <filter id="glass-card">
    <feImage href="/images/pill-convex.png" result="map" preserveAspectRatio="none" />
    <feDisplacementMap in="SourceGraphic" in2="map" scale="150" xChannelSelector="R" yChannelSelector="G" />
  </filter>
  <filter id="pill-lens">
    <feImage href="/images/pill-convex.png" result="map" preserveAspectRatio="none" />
    <feDisplacementMap in="SourceGraphic" in2="map" scale="100" xChannelSelector="R" yChannelSelector="G" />
  </filter>
</svg>

<!-- Filter set 2: with base64 + defs (for comparison) -->
<svg style="display:none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glass-150" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feImage href="${dmB64}" result="map" preserveAspectRatio="none" x="0%" y="0%" width="100%" height="100%" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="150" xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <filter id="glass-displace" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feImage href="${dmB64}" result="map" preserveAspectRatio="none" x="0%" y="0%" width="100%" height="100%" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="150" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
</svg>

<div class="content">

  <h2>A: Контроль — backdrop-filter: blur (без displacement)</h2>
  <div class="card card-a">
    <div class="text">
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>B: backdrop-filter: url(#glass-card) blur(1px) brightness(1.05)</h2>
  <div class="card card-b">
    <div class="text">
      <div class="label">Как в PWA — file path, display:none SVG, scale=150</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>C: backdrop-filter: url(#glass-card) — без blur/brightness</h2>
  <div class="card card-c">
    <div class="text">
      <div class="label">Только displacement, scale=150</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>D: backdrop-filter: url(#glass-150) — base64, defs, scale=150</h2>
  <div class="card card-d">
    <div class="text">
      <div class="label">Base64 displacement map, внутри defs</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>E: ::before fixed bg + filter:url() — фоллбэк</h2>
  <div class="card card-e">
    <div class="text">
      <div class="label">::before дублирует фон + обычный filter (кросс-браузер)</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>Pills — backdrop-filter: url(#pill-lens)</h2>
  <div class="pill-wrap">
    <div class="pill pill-bd">Закваски</div>
    <div class="pill pill-bd">Наборы</div>
    <div class="pill pill-bd">Напитки</div>
    <div class="pill pill-ctrl">Контроль</div>
  </div>

  <h2 style="margin-top:40px">Displacement Map</h2>
  <div style="text-align:center">
    <img src="${dmB64}" style="width:200px; border-radius:8px; border:1px solid rgba(255,255,255,0.15)">
  </div>
  <p class="note">R = X offset, G = Y offset. 128 = нейтраль.</p>
  <p class="note" style="margin-top:12px">
    B = как в PWA (file path, display:none, scale=150)<br>
    C = только url(), без blur/brightness<br>
    D = base64, defs, scale=150<br>
    E = ::before fallback (filter:url на элементе)
  </p>
</div>

</body>
</html>`;

const outPath = path.join(__dirname, '..', 'public', 'glass-test.html');
fs.writeFileSync(outPath, html);
console.log('Written', outPath, '(' + html.length + ' chars)');

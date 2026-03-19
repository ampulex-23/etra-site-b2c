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
<title>Glass Lens — Cross-browser Test</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  min-height: 200vh;
  font-family: 'Inter', system-ui, sans-serif;
  color: #e8f5ef;
  background: #071a12;
}

/* ── Page background ── */
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

/* ── G: ::before with fixed bg + filter:url(#displace) ──
   Cross-browser! ::before duplicates the page background with
   background-attachment:fixed, then filter:url() displaces it.
   Tint overlay via ::after. Content via z-index. */
.card-g {
  background: transparent;
}
.card-g::before {
  content: '';
  position: absolute; inset: -10px; /* extra space for displacement overflow */
  z-index: 0;
  background: url('${bgUrl}') center/cover no-repeat fixed;
  filter: url(#glass-displace);
}
.card-g::after {
  content: '';
  position: absolute; inset: 0; z-index: 1;
  border-radius: inherit;
  background: rgba(45, 94, 83, 0.42);
  pointer-events: none;
}
.card-g .text { position: relative; z-index: 2; }

/* ── H: Same as G but with gradient overlay on ::before ── */
.card-h {
  background: transparent;
}
.card-h::before {
  content: '';
  position: absolute; inset: -10px;
  z-index: 0;
  /* Two backgrounds layered: gradient on top, bg image below */
  background:
    linear-gradient(180deg, rgba(4,14,10,0.70) 0%, rgba(7,26,18,0.55) 50%, rgba(4,14,10,0.75) 100%),
    url('${bgUrl}') center/cover no-repeat fixed;
  filter: url(#glass-displace);
}
.card-h::after {
  content: '';
  position: absolute; inset: 0; z-index: 1;
  border-radius: inherit;
  background: rgba(45, 94, 83, 0.42);
  pointer-events: none;
}
.card-h .text { position: relative; z-index: 2; }

/* ── I: Same as H but with blur too ── */
.card-i {
  background: transparent;
}
.card-i::before {
  content: '';
  position: absolute; inset: -10px;
  z-index: 0;
  background:
    linear-gradient(180deg, rgba(4,14,10,0.70) 0%, rgba(7,26,18,0.55) 50%, rgba(4,14,10,0.75) 100%),
    url('${bgUrl}') center/cover no-repeat fixed;
  filter: url(#glass-displace-blur);
}
.card-i::after {
  content: '';
  position: absolute; inset: 0; z-index: 1;
  border-radius: inherit;
  background: rgba(45, 94, 83, 0.42);
  pointer-events: none;
}
.card-i .text { position: relative; z-index: 2; }

/* ── Pill variant ── */
.pill-wrap { display: flex; gap: 6px; flex-wrap: wrap; }
.pill {
  display: inline-block; position: relative;
  border-radius: 999px; overflow: hidden;
  border: 1px solid rgba(80,200,160,0.25);
  padding: 8px 20px; margin: 0;
  font-size: 13px; font-weight: 500;
}
.pill-g {
  background: transparent;
}
.pill-g::before {
  content: '';
  position: absolute; inset: -8px;
  z-index: 0;
  background:
    linear-gradient(180deg, rgba(4,14,10,0.70) 0%, rgba(7,26,18,0.55) 50%, rgba(4,14,10,0.75) 100%),
    url('${bgUrl}') center/cover no-repeat fixed;
  filter: url(#pill-displace);
}
.pill-g::after {
  content: '';
  position: absolute; inset: 0; z-index: 1;
  border-radius: inherit;
  background: rgba(45, 94, 83, 0.42);
  pointer-events: none;
}
.pill-g span { position: relative; z-index: 2; }
.pill-ctrl {
  background: rgba(45, 94, 83, 0.42);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
}
</style>
</head>
<body>

<div class="bg"></div>

<!-- ════════ SVG FILTERS ════════ -->
<svg style="position:absolute;width:0;height:0;overflow:hidden" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Displacement only — for ::before with duplicated background -->
    <filter id="glass-displace" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feImage href="${dmB64}" result="map"
               preserveAspectRatio="none" x="0%" y="0%" width="100%" height="100%" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="60"
                         xChannelSelector="R" yChannelSelector="G" />
    </filter>

    <!-- Displacement + blur -->
    <filter id="glass-displace-blur" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blurred" />
      <feImage href="${dmB64}" result="map"
               preserveAspectRatio="none" x="0%" y="0%" width="100%" height="100%" />
      <feDisplacementMap in="blurred" in2="map" scale="60"
                         xChannelSelector="R" yChannelSelector="G" />
    </filter>

    <!-- Pill displacement -->
    <filter id="pill-displace" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feImage href="${dmB64}" result="map"
               preserveAspectRatio="none" x="0%" y="0%" width="100%" height="100%" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="40"
                         xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
</svg>

<div class="content">

  <h2>A: Контроль — backdrop-filter: blur (без искажения)</h2>
  <div class="card card-a">
    <div class="text">
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>G: ::before fixed bg + filter:url(#displace) — кросс-браузер</h2>
  <div class="card card-g">
    <div class="text">
      <div class="label">::before дублирует фон страницы (fixed) + displacement</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>H: ::before fixed bg + gradient + displacement</h2>
  <div class="card card-h">
    <div class="text">
      <div class="label">::before с фоном + градиент оверлей + displacement</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>I: ::before fixed bg + gradient + displacement + blur(3px)</h2>
  <div class="card card-i">
    <div class="text">
      <div class="label">::before с фоном + градиент + displacement + лёгкий blur</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>Pills — ::before fixed bg + displacement</h2>
  <div class="pill-wrap">
    <div class="pill pill-g"><span>Закваски</span></div>
    <div class="pill pill-g"><span>Наборы</span></div>
    <div class="pill pill-g"><span>Напитки</span></div>
    <div class="pill pill-ctrl">Контроль</div>
  </div>

  <h2 style="margin-top:40px">Displacement Map</h2>
  <div style="text-align:center">
    <img src="${dmB64}" style="width:200px; border-radius:8px; border:1px solid rgba(255,255,255,0.15)">
  </div>
  <p class="note">R = X offset, G = Y offset. 128 = нейтраль. Scale=60px.</p>
  <p class="note" style="margin-top:20px">Подход G/H/I: ::before дублирует background-attachment:fixed + filter:url(#svg).<br>Работает в любом браузере — обычный CSS filter на элементе.</p>
</div>

</body>
</html>`;

const outPath = path.join(__dirname, '..', 'public', 'glass-test.html');
fs.writeFileSync(outPath, html);
console.log('Written', outPath, '(' + html.length + ' chars)');

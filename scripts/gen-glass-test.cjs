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
<title>Glass Lens Displacement Test</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  min-height: 200vh;
  font-family: 'Inter', system-ui, sans-serif;
  color: #e8f5ef;
  background: #071a12;
}
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

/* A: control — just backdrop-filter */
.card-a {
  background: rgba(16, 60, 42, 0.45);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
}

/* B: backdrop-filter: url(#svg) — Chrome only! (Apple Liquid Glass approach) */
.card-b {
  backdrop-filter: url(#glass-lens);
  -webkit-backdrop-filter: url(#glass-lens);
  background: rgba(16, 60, 42, 0.35);
}

/* C: backdrop-filter: url(#svg) + blur — Chrome only */
.card-c {
  backdrop-filter: url(#glass-lens) blur(4px);
  -webkit-backdrop-filter: url(#glass-lens) blur(4px);
  background: rgba(16, 60, 42, 0.35);
}

/* D: backdrop-filter: url(#svg) + blur(12px) — Chrome only — more glass-like */
.card-d {
  backdrop-filter: blur(12px) saturate(1.4) url(#glass-lens);
  -webkit-backdrop-filter: blur(12px) saturate(1.4) url(#glass-lens);
  background: rgba(16, 60, 42, 0.35);
}

/* E: Canvas JS — guaranteed cross-browser */
.card-e { padding: 0; }
.card-e canvas {
  position: absolute; inset: 0; z-index: 0;
  width: 100%; height: 100%;
  border-radius: inherit;
}
.card-e .tint {
  position: absolute; inset: 0; z-index: 1;
  background: rgba(16, 60, 42, 0.35);
  border-radius: inherit;
}
.card-e .text {
  position: relative; z-index: 2; padding: 20px;
}

/* Pill variants */
.pill {
  display: inline-block; position: relative;
  border-radius: 999px; overflow: hidden;
  border: 1px solid rgba(80,200,160,0.25);
  padding: 8px 20px; margin: 4px;
  font-size: 13px; font-weight: 500;
}
.pill-glass {
  backdrop-filter: url(#glass-pill-lens);
  -webkit-backdrop-filter: url(#glass-pill-lens);
  background: rgba(16, 60, 42, 0.3);
}
.pill-control {
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  background: rgba(16, 60, 42, 0.4);
}
</style>
</head>
<body>

<div class="bg"></div>

<!-- ════════ SVG FILTERS ════════ -->
<svg style="position:absolute;width:0;height:0;overflow:hidden" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Displacement only — no blur. Used as backdrop-filter. scale=60 for visible lens effect -->
    <filter id="glass-lens" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feImage href="${dmB64}" result="map"
               preserveAspectRatio="none" x="0%" y="0%" width="100%" height="100%" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="60"
                         xChannelSelector="R" yChannelSelector="G" />
    </filter>

    <!-- Pill variant — smaller scale -->
    <filter id="glass-pill-lens" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
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

  <h2>B: backdrop-filter: url(#glass-lens) — Chrome (scale=60)</h2>
  <div class="card card-b">
    <div class="text">
      <div class="label">Только displacement, без blur — чистая линза</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>C: backdrop-filter: url(#glass-lens) blur(4px) — Chrome</h2>
  <div class="card card-c">
    <div class="text">
      <div class="label">Displacement + лёгкий blur — стекло с лёгким размытием</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>D: backdrop-filter: blur(12px) url(#glass-lens) — Chrome</h2>
  <div class="card card-d">
    <div class="text">
      <div class="label">Blur + displacement + saturate — frosted glass</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>E: Canvas JS — кросс-браузерный (scale=60, без blur)</h2>
  <div class="card card-e" data-glass="canvas" data-blur="0" data-scale="60">
    <canvas></canvas>
    <div class="tint"></div>
    <div class="text">
      <div class="label">Canvas захват фона + displacement (без blur)</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>F: Canvas JS — с лёгким blur (scale=60, blur=4)</h2>
  <div class="card card-e" data-glass="canvas" data-blur="4" data-scale="60">
    <canvas></canvas>
    <div class="tint"></div>
    <div class="text">
      <div class="label">Canvas захват фона + displacement + blur(4px)</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>Pills — backdrop-filter: url(#glass-pill-lens)</h2>
  <div style="display:flex;flex-wrap:wrap;gap:4px">
    <div class="pill pill-glass">Закваски</div>
    <div class="pill pill-glass">Наборы</div>
    <div class="pill pill-glass">Напитки</div>
    <div class="pill pill-control">Контроль</div>
  </div>

  <h2 style="margin-top:40px">Displacement Map</h2>
  <div style="text-align:center">
    <img src="${dmB64}" style="width:200px; border-radius:8px; border:1px solid rgba(255,255,255,0.15)">
  </div>
  <p class="note">R = X offset, G = Y offset. 128 = нейтраль. Scale=60px.</p>
</div>

<script>
/* Canvas glass — guaranteed cross-browser */
(function() {
  const DM_SRC = '${dmB64}';
  const BG_SRC = '${bgUrl}';

  const bgImg = new Image();
  bgImg.crossOrigin = 'anonymous';
  const dmImg = new Image();
  let ready = 0;

  function onReady() {
    if (++ready < 2) return;
    document.querySelectorAll('[data-glass="canvas"]').forEach(renderCard);
  }

  bgImg.onload = onReady;
  dmImg.onload = onReady;
  bgImg.onerror = function() { console.error('bg load failed — CORS?'); };
  bgImg.src = BG_SRC;
  dmImg.src = DM_SRC;

  function renderCard(card) {
    const SCALE = parseFloat(card.dataset.scale) || 60;
    const BLUR = parseFloat(card.dataset.blur) || 0;

    const canvas = card.querySelector('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rect = card.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Compute how bg.jpg covers viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bgW = bgImg.naturalWidth;
    const bgH = bgImg.naturalHeight;
    const vAspect = vw / vh;
    const bgAspect = bgW / bgH;

    let drawW, drawH, drawX, drawY;
    if (bgAspect > vAspect) {
      drawH = vh; drawW = vh * bgAspect;
      drawX = (vw - drawW) / 2; drawY = 0;
    } else {
      drawW = vw; drawH = vw / bgAspect;
      drawX = 0; drawY = (vh - drawH) / 2;
    }

    // Draw bg portion behind this card
    const sx = rect.left - drawX;
    const sy = rect.top + window.scrollY - drawY;
    ctx.drawImage(bgImg,
      sx * (bgW / drawW), sy * (bgH / drawH),
      w * (bgW / drawW), h * (bgH / drawH),
      0, 0, w, h
    );

    // Gradient overlay (same as .bg::after)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(4,14,10,0.70)');
    grad.addColorStop(0.5, 'rgba(7,26,18,0.55)');
    grad.addColorStop(1, 'rgba(4,14,10,0.75)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Optional blur
    if (BLUR > 0) {
      ctx.filter = 'blur(' + BLUR + 'px)';
      ctx.drawImage(canvas, 0, 0, w, h);
      ctx.filter = 'none';
    }

    // Read source pixels
    const imgData = ctx.getImageData(0, 0, w * dpr, h * dpr);
    const src = imgData.data;

    // Read displacement map
    const dmC = document.createElement('canvas');
    dmC.width = w * dpr; dmC.height = h * dpr;
    const dmCtx = dmC.getContext('2d');
    dmCtx.drawImage(dmImg, 0, 0, w * dpr, h * dpr);
    const dm = dmCtx.getImageData(0, 0, w * dpr, h * dpr).data;

    // Apply displacement
    const out = ctx.createImageData(w * dpr, h * dpr);
    const dst = out.data;
    const sc = SCALE * dpr;
    const iw = w * dpr;
    const ih = h * dpr;

    for (let py = 0; py < ih; py++) {
      for (let px = 0; px < iw; px++) {
        const idx = (py * iw + px) * 4;
        const dx = ((dm[idx] / 255) - 0.5) * sc;
        const dy = ((dm[idx + 1] / 255) - 0.5) * sc;
        const fromX = Math.min(Math.max(Math.round(px + dx), 0), iw - 1);
        const fromY = Math.min(Math.max(Math.round(py + dy), 0), ih - 1);
        const si = (fromY * iw + fromX) * 4;
        dst[idx] = src[si];
        dst[idx + 1] = src[si + 1];
        dst[idx + 2] = src[si + 2];
        dst[idx + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
    console.log('Glass rendered:', w + 'x' + h, 'scale=' + SCALE, 'blur=' + BLUR);
  }

  window.addEventListener('resize', function() {
    if (ready >= 2) document.querySelectorAll('[data-glass="canvas"]').forEach(renderCard);
  });
})();
</script>
</body>
</html>`;

const outPath = path.join(__dirname, '..', 'public', 'glass-test.html');
fs.writeFileSync(outPath, html);
console.log('Written', outPath, '(' + html.length + ' chars)');

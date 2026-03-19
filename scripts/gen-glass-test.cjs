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
<title>Glass Displacement Test</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  min-height: 100vh;
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
   Card base — transparent, see-through
   ═══════════════════════════════════════ */
.card {
  position: relative;
  border-radius: 16px; overflow: hidden;
  border: 1px solid rgba(80,200,160,0.25);
  padding: 20px;
}

/* ═══════════════════════════════════════
   A: backdrop-filter only (control)
   ═══════════════════════════════════════ */
.card-a {
  background: rgba(16, 60, 42, 0.45);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
}

/* ═══════════════════════════════════════
   B: backdrop-filter + CSS filter on
   ::before (test if they combine)
   ═══════════════════════════════════════ */
.card-b::before {
  content: ''; position: absolute; inset: 0; z-index: 0;
  border-radius: inherit; pointer-events: none;
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  background: rgba(16, 60, 42, 0.45);
  filter: url(#displace);
}
.card-b .text { position: relative; z-index: 1; }

/* ═══════════════════════════════════════
   C: Canvas — JS captures actual viewport
   behind card, applies blur + displacement
   ═══════════════════════════════════════ */
.card-c { padding: 0; }
.card-c canvas {
  position: absolute; inset: 0; z-index: 0;
  width: 100%; height: 100%;
  border-radius: inherit;
}
.card-c .tint {
  position: absolute; inset: 0; z-index: 1;
  background: rgba(16, 60, 42, 0.45);
  border-radius: inherit;
}
.card-c .text {
  position: relative; z-index: 2; padding: 20px;
}

/* ═══════════════════════════════════════
   D: Inline SVG with <image> that loads
   the SAME bg.jpg + overlay gradient,
   positioned to match the card's viewport
   position. Blur + displacement in SVG.
   ═══════════════════════════════════════ */
.card-d { padding: 0; }
.card-d .svg-wrap {
  position: absolute; inset: 0; z-index: 0;
  overflow: hidden; border-radius: inherit;
}
.card-d .svg-wrap svg {
  position: absolute;
  /* positioned by JS to match viewport bg */
}
.card-d .tint {
  position: absolute; inset: 0; z-index: 1;
  background: rgba(16, 60, 42, 0.45);
  border-radius: inherit;
}
.card-d .text {
  position: relative; z-index: 2; padding: 20px;
}
</style>
</head>
<body>

<div class="bg"></div>

<!-- ════════ SVG FILTER (base64 displacement map) ════════ -->
<svg style="position:absolute;width:0;height:0;overflow:hidden" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="displace" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feImage href="${dmB64}" result="map"
               preserveAspectRatio="none" x="0%" y="0%" width="100%" height="100%" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="30"
                         xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
</svg>

<div class="content">

  <!-- ══════ A: control ══════ -->
  <h2>A: Контроль — backdrop-filter (без искажения)</h2>
  <div class="card card-a">
    <div class="text">
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <!-- ══════ B: ::before test ══════ -->
  <h2>B: ::before backdrop-filter + filter:url(#displace)</h2>
  <div class="card card-b">
    <div class="text">
      <div class="label">::before имеет backdrop-filter + filter одновременно</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <!-- ══════ C: Canvas ══════ -->
  <h2>C: Canvas JS — захват фона + blur + displacement</h2>
  <div class="card card-c" data-glass="canvas">
    <canvas></canvas>
    <div class="tint"></div>
    <div class="text">
      <div class="label">Canvas захватывает фон окна за карточкой</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <!-- ══════ D: SVG positioned bg ══════ -->
  <h2>D: SVG image bg.jpg (позиционирован) + blur + displace</h2>
  <div class="card card-d" data-glass="svg">
    <div class="svg-wrap">
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="d-filter" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blurred" />
            <feImage href="${dmB64}" result="map"
                     preserveAspectRatio="none" x="0%" y="0%" width="100%" height="100%" />
            <feDisplacementMap in="blurred" in2="map" scale="30"
                               xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <image href="${bgUrl}" filter="url(#d-filter)"
               preserveAspectRatio="xMidYMid slice" />
      </svg>
    </div>
    <div class="tint"></div>
    <div class="text">
      <div class="label">SVG image bg.jpg позиционирован чтобы совпадать с фоном страницы</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <h2>Displacement Map</h2>
  <div style="text-align:center">
    <img src="${dmB64}" style="width:200px; border-radius:8px; border:1px solid rgba(255,255,255,0.15)">
  </div>
  <p class="note">R = X offset, G = Y offset. Серый (128) = нейтраль.</p>
</div>

<script>
/* ═══════════════════════════════════════
   C: Canvas approach
   Draws bg.jpg at correct viewport offset,
   overlays gradient, blurs, then displaces.
   ═══════════════════════════════════════ */
(function() {
  const DM_SRC = '${dmB64}';
  const BG_SRC = '${bgUrl}';
  const SCALE = 20;

  const bgImg = new Image();
  bgImg.crossOrigin = 'anonymous';
  const dmImg = new Image();
  let ready = 0;

  function onReady() {
    ready++;
    if (ready < 2) return;
    document.querySelectorAll('[data-glass="canvas"]').forEach(renderCard);
  }

  bgImg.onload = onReady;
  dmImg.onload = onReady;
  bgImg.onerror = function() { console.error('bg load failed (CORS?)'); };
  bgImg.src = BG_SRC;
  dmImg.src = DM_SRC;

  function renderCard(card) {
    const canvas = card.querySelector('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rect = card.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Compute how bg.jpg is drawn (center/cover on viewport)
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bgW = bgImg.naturalWidth;
    const bgH = bgImg.naturalHeight;
    const vAspect = vw / vh;
    const bgAspect = bgW / bgH;

    let drawW, drawH, drawX, drawY;
    if (bgAspect > vAspect) {
      // bg wider than viewport — height fills, width crops
      drawH = vh;
      drawW = vh * bgAspect;
      drawX = (vw - drawW) / 2;
      drawY = 0;
    } else {
      // bg taller — width fills, height crops
      drawW = vw;
      drawH = vw / bgAspect;
      drawX = 0;
      drawY = (vh - drawH) / 2;
    }

    // Draw bg portion behind this card
    const sx = rect.left - drawX;
    const sy = rect.top - drawY;
    ctx.drawImage(bgImg,
      sx * (bgW / drawW), sy * (bgH / drawH),
      w * (bgW / drawW), h * (bgH / drawH),
      0, 0, w, h
    );

    // Draw gradient overlay (same as .bg::after)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(4,14,10,0.70)');
    grad.addColorStop(0.5, 'rgba(7,26,18,0.55)');
    grad.addColorStop(1, 'rgba(4,14,10,0.75)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Blur
    ctx.filter = 'blur(12px)';
    ctx.drawImage(canvas, 0, 0, w, h);
    ctx.filter = 'none';

    // Read blurred pixels
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
        const fromX = Math.round(px + dx);
        const fromY = Math.round(py + dy);
        if (fromX >= 0 && fromX < iw && fromY >= 0 && fromY < ih) {
          const si = (fromY * iw + fromX) * 4;
          dst[idx] = src[si];
          dst[idx + 1] = src[si + 1];
          dst[idx + 2] = src[si + 2];
          dst[idx + 3] = 255;
        }
      }
    }
    ctx.putImageData(out, 0, 0);
    console.log('Canvas glass rendered', w, 'x', h);
  }

  window.addEventListener('resize', function() {
    if (ready >= 2) document.querySelectorAll('[data-glass="canvas"]').forEach(renderCard);
  });
})();

/* ═══════════════════════════════════════
   D: SVG approach — position the <image>
   to match viewport bg position
   ═══════════════════════════════════════ */
(function() {
  function positionSvgBg() {
    document.querySelectorAll('[data-glass="svg"]').forEach(function(card) {
      const svg = card.querySelector('svg');
      const img = svg.querySelector('image');
      const rect = card.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // svg covers viewport, shifted to show correct portion
      svg.setAttribute('width', vw);
      svg.setAttribute('height', vh);
      svg.style.left = (-rect.left) + 'px';
      svg.style.top = (-rect.top) + 'px';
      img.setAttribute('width', vw);
      img.setAttribute('height', vh);
      img.setAttribute('x', 0);
      img.setAttribute('y', 0);
    });
  }
  positionSvgBg();
  window.addEventListener('resize', positionSvgBg);
  window.addEventListener('scroll', positionSvgBg);
  // re-position after images load
  setTimeout(positionSvgBg, 500);
  setTimeout(positionSvgBg, 2000);
})();
</script>
</body>
</html>`;

const outPath = path.join(__dirname, '..', 'public', 'glass-test.html');
fs.writeFileSync(outPath, html);
console.log('Written', outPath, '(' + html.length + ' chars)');

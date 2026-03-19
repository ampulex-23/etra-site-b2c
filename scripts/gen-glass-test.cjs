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
   APPROACH A — Backdrop div with bg.jpg
   duplicated as CSS background.
   CSS filter: url(#displace) on the div.
   ═══════════════════════════════════════ */
.card-a {
  position: relative;
  border-radius: 16px; overflow: hidden;
  border: 1px solid rgba(80,200,160,0.25);
  padding: 20px;
  min-height: 120px;
}
.card-a .backdrop {
  position: absolute; inset: -30px; z-index: 0;
  background: url('${bgUrl}') center/cover no-repeat;
  filter: url(#displace-a);
}
.card-a .tint {
  position: absolute; inset: 0; z-index: 1;
  background: rgba(16, 60, 42, 0.55);
}
.card-a .text { position: relative; z-index: 2; }

/* ═══════════════════════════════════════
   APPROACH B — Inline <svg> element.
   <image> inside SVG loads bg.jpg and
   has filter applied (blur + displace).
   ═══════════════════════════════════════ */
.card-b {
  position: relative;
  border-radius: 16px; overflow: hidden;
  border: 1px solid rgba(80,200,160,0.25);
  min-height: 120px;
}
.card-b svg.bg-svg {
  display: block; width: 100%; height: 100%;
  position: absolute; inset: 0; z-index: 0;
}
.card-b .tint {
  position: absolute; inset: 0; z-index: 1;
  background: rgba(16, 60, 42, 0.55);
}
.card-b .text {
  position: relative; z-index: 2; padding: 20px;
}

/* ═══════════════════════════════════════
   APPROACH C — backdrop-filter control
   ═══════════════════════════════════════ */
.card-c {
  position: relative;
  border-radius: 16px; overflow: hidden;
  border: 1px solid rgba(80,200,160,0.25);
  padding: 20px;
  background: rgba(16, 60, 42, 0.45);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
}

/* ═══════════════════════════════════════
   APPROACH D — Canvas-based (JS draws bg,
   applies displacement via getImageData)
   ═══════════════════════════════════════ */
.card-d {
  position: relative;
  border-radius: 16px; overflow: hidden;
  border: 1px solid rgba(80,200,160,0.25);
  min-height: 120px;
}
.card-d canvas {
  position: absolute; inset: 0; z-index: 0;
  width: 100%; height: 100%;
  border-radius: inherit;
}
.card-d .tint {
  position: absolute; inset: 0; z-index: 1;
  background: rgba(16, 60, 42, 0.55);
}
.card-d .text {
  position: relative; z-index: 2; padding: 20px;
}
</style>
</head>
<body>

<div class="bg"></div>

<!-- ════════ SVG FILTERS (base64 displacement map) ════════ -->
<svg style="position:absolute;width:0;height:0;overflow:hidden" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- A: displacement only -->
    <filter id="displace-a" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feImage href="${dmB64}" result="map"
               preserveAspectRatio="none" x="0%" y="0%" width="100%" height="100%" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="40"
                         xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
</svg>

<div class="content">

  <!-- ══════ A ══════ -->
  <h2>A: Backdrop div + bg.jpg + filter:url(#displace)</h2>
  <div class="card-a">
    <div class="backdrop"></div>
    <div class="tint"></div>
    <div class="text">
      <div class="label">CSS filter с base64 displacement map на div с фоном</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <!-- ══════ B ══════ -->
  <h2>B: Inline SVG &lt;image&gt; + filter (blur+displace)</h2>
  <div class="card-b">
    <svg class="bg-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <defs>
        <filter id="displace-b" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blurred" />
          <feImage href="${dmB64}" result="map"
                   preserveAspectRatio="none" x="0%" y="0%" width="100%" height="100%" />
          <feDisplacementMap in="blurred" in2="map" scale="40"
                             xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <image href="${bgUrl}" x="-10%" y="-10%" width="120%" height="120%"
             preserveAspectRatio="xMidYMid slice" filter="url(#displace-b)" />
    </svg>
    <div class="tint"></div>
    <div class="text">
      <div class="label">SVG &lt;image&gt; с bg.jpg + blur + displacement внутри SVG</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <!-- ══════ C ══════ -->
  <h2>C: Контроль — backdrop-filter (без displacement)</h2>
  <div class="card-c">
    <div class="text">
      <div class="label">backdrop-filter: blur(24px) saturate(1.5)</div>
      Товары (2) — 1 700 ₽<br>
      Доставка — При оформлении<br>
      <strong>Итого — 1 700 ₽</strong>
    </div>
  </div>

  <!-- ══════ D ══════ -->
  <h2>D: Canvas — JS pixel displacement</h2>
  <div class="card-d" id="card-d">
    <canvas id="canvas-d"></canvas>
    <div class="tint"></div>
    <div class="text">
      <div class="label">Canvas рисует bg + displacement через JS (гарантированно работает)</div>
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
// Approach D: Canvas-based displacement (guaranteed to work)
(function() {
  const card = document.getElementById('card-d');
  const canvas = document.getElementById('canvas-d');
  const ctx = canvas.getContext('2d');

  const bgImg = new Image();
  bgImg.crossOrigin = 'anonymous';
  const dmImg = new Image();

  let loaded = 0;
  function onLoad() {
    loaded++;
    if (loaded < 2) return;
    render();
  }

  bgImg.onload = onLoad;
  dmImg.onload = onLoad;
  bgImg.src = '${bgUrl}';
  dmImg.src = '${dmB64}';

  function render() {
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Draw bg covering canvas
    const bgAspect = bgImg.width / bgImg.height;
    const cardAspect = w / h;
    let sx, sy, sw, sh;
    if (bgAspect > cardAspect) {
      sh = bgImg.height;
      sw = sh * cardAspect;
      sx = (bgImg.width - sw) / 2;
      sy = 0;
    } else {
      sw = bgImg.width;
      sh = sw / cardAspect;
      sx = 0;
      sy = (bgImg.height - sh) / 2;
    }
    ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, w, h);

    // Apply blur
    ctx.filter = 'blur(8px)';
    ctx.drawImage(canvas, 0, 0, w, h);
    ctx.filter = 'none';

    // Read pixels
    const imgData = ctx.getImageData(0, 0, w * dpr, h * dpr);
    const pixels = imgData.data;

    // Draw displacement map to offscreen canvas to read it
    const dmCanvas = document.createElement('canvas');
    dmCanvas.width = w * dpr;
    dmCanvas.height = h * dpr;
    const dmCtx = dmCanvas.getContext('2d');
    dmCtx.drawImage(dmImg, 0, 0, w * dpr, h * dpr);
    const dmData = dmCtx.getImageData(0, 0, w * dpr, h * dpr).data;

    // Apply displacement
    const out = ctx.createImageData(w * dpr, h * dpr);
    const outD = out.data;
    const scale = 25 * dpr;
    const iw = w * dpr;
    const ih = h * dpr;

    for (let y = 0; y < ih; y++) {
      for (let x = 0; x < iw; x++) {
        const i = (y * iw + x) * 4;
        const r = dmData[i];     // X displacement
        const g = dmData[i + 1]; // Y displacement
        const dx = ((r / 255) - 0.5) * scale;
        const dy = ((g / 255) - 0.5) * scale;
        const srcX = Math.round(x + dx);
        const srcY = Math.round(y + dy);
        if (srcX >= 0 && srcX < iw && srcY >= 0 && srcY < ih) {
          const si = (srcY * iw + srcX) * 4;
          outD[i]     = pixels[si];
          outD[i + 1] = pixels[si + 1];
          outD[i + 2] = pixels[si + 2];
          outD[i + 3] = 255;
        }
      }
    }

    ctx.putImageData(out, 0, 0);
  }

  window.addEventListener('resize', function() {
    if (loaded >= 2) render();
  });
})();
</script>
</body>
</html>`;

const outPath = path.join(__dirname, '..', 'public', 'glass-test.html');
fs.writeFileSync(outPath, html);
console.log('Written', outPath, '(' + html.length + ' chars)');

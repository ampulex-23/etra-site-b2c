/**
 * Generate card-convex.png displacement map for glassmorphism.
 * Similar to pill-convex.png but for rounded-rect card shape.
 * 
 * R channel = X displacement, G channel = Y displacement
 * Gray (128,128,128) = no displacement (neutral)
 * Deviations from 128 = displacement amount
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 256;
const H = 340;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Fill neutral gray
ctx.fillStyle = 'rgb(128,128,128)';
ctx.fillRect(0, 0, W, H);

// Helper: rounded rect path
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Clip to rounded rect with padding
const pad = 8;
const radius = 28;
ctx.save();
roundedRect(ctx, pad, pad, W - pad * 2, H - pad * 2, radius);
ctx.clip();

// Main radial gradient (convex lens: center is displaced, edges are neutral)
const cx = W * 0.5;
const cy = H * 0.45;
const rx = (W - pad * 2) * 0.52;
const ry = (H - pad * 2) * 0.48;

// Draw multiple passes to build up the displacement map channels

// Base convex shape - center displaced outward
const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
grad.addColorStop(0, 'rgb(175,195,170)');     // center: R>128 (push right), G>128 (push down)
grad.addColorStop(0.3, 'rgb(160,180,162)');
grad.addColorStop(0.6, 'rgb(142,152,148)');
grad.addColorStop(0.85, 'rgb(128,128,128)');   // neutral
grad.addColorStop(1, 'rgb(115,118,122)');       // slight inward pull at edges
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

// Top highlight — green channel high (upward refraction seen as green)
ctx.globalCompositeOperation = 'lighter';
const topGrad = ctx.createLinearGradient(0, pad, 0, H * 0.35);
topGrad.addColorStop(0, 'rgba(40,90,50,0.6)');
topGrad.addColorStop(1, 'rgba(0,0,0,0)');
ctx.fillStyle = topGrad;
ctx.fillRect(0, 0, W, H);

// Bottom highlight — magenta/red (downward refraction)
const botGrad = ctx.createLinearGradient(0, H * 0.65, 0, H - pad);
botGrad.addColorStop(0, 'rgba(0,0,0,0)');
botGrad.addColorStop(1, 'rgba(60,20,50,0.5)');
ctx.fillStyle = botGrad;
ctx.fillRect(0, 0, W, H);

// Left highlight — teal/green (leftward refraction)
const leftGrad = ctx.createLinearGradient(pad, 0, W * 0.3, 0);
leftGrad.addColorStop(0, 'rgba(20,60,50,0.45)');
leftGrad.addColorStop(1, 'rgba(0,0,0,0)');
ctx.fillStyle = leftGrad;
ctx.fillRect(0, 0, W, H);

// Right highlight — pink/red (rightward refraction)
const rightGrad = ctx.createLinearGradient(W * 0.7, 0, W - pad, 0);
rightGrad.addColorStop(0, 'rgba(0,0,0,0)');
rightGrad.addColorStop(1, 'rgba(60,15,40,0.45)');
ctx.fillStyle = rightGrad;
ctx.fillRect(0, 0, W, H);

ctx.restore();

// Apply Gaussian blur by drawing to a temp canvas and back (simple box blur approximation)
// Since canvas doesn't have native Gaussian blur filter in node-canvas, 
// we'll use the built-in filter if available
try {
  ctx.filter = 'blur(12px)';
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';
} catch (e) {
  // If filter not supported, skip blur
  console.log('Note: blur filter not supported, output may look sharper than expected');
}

const outPath = path.join(__dirname, '..', 'public', 'images', 'card-convex.png');
const buf = canvas.toBuffer('image/png');
fs.writeFileSync(outPath, buf);
console.log(`Saved ${outPath} (${W}x${H}, ${buf.length} bytes)`);

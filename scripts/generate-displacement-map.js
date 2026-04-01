// Generate a proper displacement map for glass lens effect
// This creates a convex lens effect - center pushes outward

const { createCanvas } = require('canvas');
const fs = require('fs');

const SIZE = 128; // 128x128 is enough for displacement

const canvas = createCanvas(SIZE, SIZE);
const ctx = canvas.getContext('2d');

// Fill with neutral gray (128, 128, 128) - no displacement
ctx.fillStyle = 'rgb(128, 128, 128)';
ctx.fillRect(0, 0, SIZE, SIZE);

// Create radial gradient for lens effect
// Center is lighter (pushes outward), edges are neutral
const centerX = SIZE / 2;
const centerY = SIZE / 2;
const radius = SIZE / 2;

// Create image data for pixel manipulation
const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
const data = imageData.data;

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const normalizedDist = Math.min(distance / radius, 1);
    
    // Smooth falloff using cosine for natural lens curve
    // Center = 200 (push outward), Edge = 128 (neutral)
    const intensity = Math.cos(normalizedDist * Math.PI / 2);
    const value = 128 + Math.round(intensity * 40); // Subtle effect
    
    const idx = (y * SIZE + x) * 4;
    
    // R channel controls X displacement
    // G channel controls Y displacement
    // Both same for uniform radial effect
    data[idx] = value;     // R
    data[idx + 1] = value; // G
    data[idx + 2] = 128;   // B (not used)
    data[idx + 3] = 255;   // A
  }
}

ctx.putImageData(imageData, 0, 0);

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('public/images/glass-displacement.png', buffer);

// Also output base64 for inline use
const base64 = buffer.toString('base64');
console.log('Base64 PNG:');
console.log(`data:image/png;base64,${base64}`);

// Save base64 to file for easy copy
fs.writeFileSync('scripts/glass-displacement-base64.txt', `data:image/png;base64,${base64}`);

console.log('\nSaved to:');
console.log('- public/images/glass-displacement.png');
console.log('- scripts/glass-displacement-base64.txt');

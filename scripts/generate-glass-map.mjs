// Generate displacement map using pure Node.js with sharp or jimp
// For glass lens effect - creates convex lens displacement

import { writeFileSync } from 'fs';

// Create a simple grayscale displacement map as raw data
// Then convert to PNG manually or use a simple approach

const SIZE = 64;
const pixels = [];

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const centerX = SIZE / 2;
    const centerY = SIZE / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = SIZE / 2;
    const normalizedDist = Math.min(distance / radius, 1);
    
    // Cosine falloff for smooth lens curve
    const intensity = Math.cos(normalizedDist * Math.PI / 2);
    const value = 128 + Math.round(intensity * 50);
    
    // RGBA
    pixels.push(value, value, 128, 255);
  }
}

// Create minimal PNG manually
// PNG structure: signature + IHDR + IDAT + IEND

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function adler32(data) {
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return (b << 16) | a;
}

// PNG signature
const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

// IHDR chunk
const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(SIZE, 0);  // width
ihdrData.writeUInt32BE(SIZE, 4);  // height
ihdrData.writeUInt8(8, 8);        // bit depth
ihdrData.writeUInt8(6, 9);        // color type (RGBA)
ihdrData.writeUInt8(0, 10);       // compression
ihdrData.writeUInt8(0, 11);       // filter
ihdrData.writeUInt8(0, 12);       // interlace

const ihdrType = Buffer.from('IHDR');
const ihdrCrc = crc32(Buffer.concat([ihdrType, ihdrData]));
const ihdr = Buffer.alloc(12 + ihdrData.length);
ihdr.writeUInt32BE(ihdrData.length, 0);
ihdrType.copy(ihdr, 4);
ihdrData.copy(ihdr, 8);
ihdr.writeUInt32BE(ihdrCrc, 8 + ihdrData.length);

// IDAT chunk - raw pixel data with filter bytes
const rawData = [];
for (let y = 0; y < SIZE; y++) {
  rawData.push(0); // filter type: none
  for (let x = 0; x < SIZE; x++) {
    const idx = (y * SIZE + x) * 4;
    rawData.push(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]);
  }
}

// Compress with zlib (deflate)
import { deflateSync } from 'zlib';
const compressed = deflateSync(Buffer.from(rawData), { level: 9 });

const idatType = Buffer.from('IDAT');
const idatCrc = crc32(Buffer.concat([idatType, compressed]));
const idat = Buffer.alloc(12 + compressed.length);
idat.writeUInt32BE(compressed.length, 0);
idatType.copy(idat, 4);
compressed.copy(idat, 8);
idat.writeUInt32BE(idatCrc, 8 + compressed.length);

// IEND chunk
const iendType = Buffer.from('IEND');
const iendCrc = crc32(iendType);
const iend = Buffer.alloc(12);
iend.writeUInt32BE(0, 0);
iendType.copy(iend, 4);
iend.writeUInt32BE(iendCrc, 8);

// Combine all
const png = Buffer.concat([signature, ihdr, idat, iend]);

// Save PNG file
writeFileSync('public/images/glass-displacement.png', png);

// Output base64
const base64 = png.toString('base64');
console.log('data:image/png;base64,' + base64);

// Save base64 to file
writeFileSync('scripts/glass-displacement-base64.txt', 'data:image/png;base64,' + base64);

console.log('\nGenerated displacement map:');
console.log('- Size: ' + SIZE + 'x' + SIZE);
console.log('- Saved to: public/images/glass-displacement.png');
console.log('- Base64 saved to: scripts/glass-displacement-base64.txt');

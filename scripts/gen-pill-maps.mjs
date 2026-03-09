import path from 'path'

// Pill / capsule shape: 320x160 aspect ratio = 2:1
// Half-cylinder cross section — displacement mainly in Y
const W = 256
const H = 128

function generateMap(convex) {
  const buf = Buffer.alloc(W * H * 4)

  const cy = H / 2
  const ry = H / 2  // vertical half-radius of cylinder

  // Capsule: left cap center, right cap center
  const capRadius = H / 2  // semicircle radius = half height
  const capLeftCx = capRadius
  const capRightCx = W - capRadius

  const strength = 0.95  // strong displacement

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4

      // Normalized vertical position: -1..+1
      const ny = (y - cy) / ry

      // Check if inside pill shape
      let inside = false
      let localNx = 0  // horizontal normal component (only for caps)
      let localNy = ny  // vertical normal component

      if (x >= capLeftCx && x <= capRightCx) {
        // Middle section — flat cylinder, no horizontal curvature
        inside = Math.abs(ny) <= 1.0
        localNx = 0
      } else if (x < capLeftCx) {
        // Left semicircle cap
        const dx = (x - capLeftCx) / capRadius
        const dist = Math.sqrt(dx * dx + ny * ny)
        inside = dist <= 1.0
        localNx = dx
      } else {
        // Right semicircle cap
        const dx = (x - capRightCx) / capRadius
        const dist = Math.sqrt(dx * dx + ny * ny)
        inside = dist <= 1.0
        localNx = dx
      }

      if (!inside) {
        buf[idx + 0] = 128
        buf[idx + 1] = 128
        buf[idx + 2] = 128
        buf[idx + 3] = 255
        continue
      }

      // Lens-based displacement: thickness at this point determines
      // how much the light ray gets offset passing through the glass.
      // For a cylinder lens: thickness = sqrt(1 - ny^2) (max at center, 0 at edge)
      // For sphere caps: thickness = sqrt(1 - nx^2 - ny^2)
      // Displacement direction = surface normal (ny for cylinder, nx+ny for caps)
      // Displacement magnitude = ny * thickness (lens refraction)

      let thickness
      if (x >= capLeftCx && x <= capRightCx) {
        thickness = Math.sqrt(Math.max(0, 1 - ny * ny))
      } else {
        thickness = Math.sqrt(Math.max(0, 1 - localNx * localNx - ny * ny))
      }

      // Lens displacement: ray offset = direction * thickness
      // This gives strong displacement in center (where glass is thick)
      // and zero at edges (where glass is thin)
      let dispX = localNx * thickness * strength
      let dispY = localNy * thickness * strength

      // Flip for concave (back wall)
      if (!convex) {
        dispX = -dispX
        dispY = -dispY
      }

      const r = Math.round(128 + dispX * 127)
      const g = Math.round(128 + dispY * 127)

      buf[idx + 0] = Math.max(0, Math.min(255, r))
      buf[idx + 1] = Math.max(0, Math.min(255, g))
      buf[idx + 2] = 128
      buf[idx + 3] = 255
    }
  }

  return buf
}

// Generate both maps and write as raw RGBA, then convert to PNG with sharp
async function main() {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.error('sharp not available, using manual PNG generation')
    // Fallback: write base64 inline
    writePNGManual()
    return
  }
  
  const convexBuf = generateMap(true)
  const concaveBuf = generateMap(false)
  
  const outDir = path.resolve('public', 'images')
  
  await sharp(convexBuf, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile(path.join(outDir, 'pill-convex.png'))
  
  await sharp(concaveBuf, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile(path.join(outDir, 'pill-concave.png'))
  
  // Also generate base64 for inline SVG
  const convexPng = await sharp(convexBuf, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer()
  
  const concavePng = await sharp(concaveBuf, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer()
  
  console.log('=== CONVEX (front wall) base64 ===')
  console.log(convexPng.toString('base64'))
  console.log('')
  console.log('=== CONCAVE (back wall) base64 ===')
  console.log(concavePng.toString('base64'))
  
  console.log('\nFiles written to public/images/')
}

main().catch(console.error)

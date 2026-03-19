const fs = require('fs');
const path = require('path');

const png = fs.readFileSync(path.join(__dirname, '..', 'public', 'images', 'pill-convex.png'));
const uri = 'data:image/png;base64,' + png.toString('base64');

const ts = `// Auto-generated: pill-convex.png as data URI for SVG feImage displacement map
export const PILL_CONVEX_URI = "${uri}";
`;

const out = path.join(__dirname, '..', 'src', 'app', '(frontend)', 'pwa', 'displacementMap.ts');
fs.writeFileSync(out, ts);
console.log('Written', out, '(' + uri.length + ' chars)');

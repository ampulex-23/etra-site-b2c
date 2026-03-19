const fs = require('fs');
const path = require('path');

const b64 = 'data:image/png;base64,' + fs.readFileSync(
  path.join(__dirname, '..', 'public', 'images', 'pill-convex.png'), 'base64'
);

// Generate a JS file that injects SVG filters into DOM via DOMParser
// DOMParser correctly creates SVG elements with proper namespace,
// unlike innerHTML on an SVG element which may not parse SVG children correctly
const svgMarkup = `<svg style="display:none" xmlns="http://www.w3.org/2000/svg"><defs><filter id="glass-card" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage href="${b64}" result="map" preserveAspectRatio="none" x="0%" y="0%" width="100%" height="100%"/><feDisplacementMap in="SourceGraphic" in2="map" scale="150" xChannelSelector="R" yChannelSelector="G"/></filter><filter id="glass-pill" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage href="${b64}" result="map" preserveAspectRatio="none" x="0%" y="0%" width="100%" height="100%"/><feDisplacementMap in="SourceGraphic" in2="map" scale="100" xChannelSelector="R" yChannelSelector="G"/></filter></defs></svg>`;

const js = `(function(){
if(document.getElementById('glass-card'))return;
var markup='${svgMarkup.replace(/'/g, "\\'")}';
var doc=new DOMParser().parseFromString(markup,'image/svg+xml');
var svg=doc.documentElement;
document.body.insertBefore(document.adoptNode(svg),document.body.firstChild);
})();`;

const outPath = path.join(__dirname, '..', 'public', 'glass-filters.js');
fs.writeFileSync(outPath, js);
console.log('Written', outPath, '(' + js.length + ' chars)');

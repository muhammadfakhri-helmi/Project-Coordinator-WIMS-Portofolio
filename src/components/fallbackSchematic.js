// Static SVG wellhead/X-mas tree used when WebGL is unavailable.
// Positions are in the 300 × 440 viewBox; hotspot points are exported so the
// same buttons can be laid over the drawing.

export const SCHEMATIC_POINTS = {
  gauge: [150, 66],
  swab: [150, 133],
  wing: [205, 177],
  choke: [254, 177],
  master: [150, 265],
  flange: [150, 314],
  annulus: [236, 336],
};

export const SCHEMATIC_SVG = `
<svg viewBox="0 0 300 440" role="img" aria-label="Simplified schematic of a wellhead and X-mas tree" xmlns="http://www.w3.org/2000/svg">
  <g fill="#5b646c" stroke="#9fb0bf" stroke-width="1.2">
    <rect x="95" y="405" width="110" height="12" fill="#1a2735"/>
    <rect x="100" y="360" width="100" height="45"/>
    <rect x="110" y="318" width="80" height="42"/>
    <line x1="190" y1="336" x2="226" y2="336" stroke-width="8" stroke="#5b646c"/>
    <rect x="225" y="325" width="22" height="22"/>
    <rect x="108" y="310" width="84" height="8" fill="#6b747c"/>
    <rect x="120" y="288" width="60" height="22"/>
    <rect x="125" y="245" width="50" height="40"/>
    <line x1="175" y1="265" x2="200" y2="265"/><circle cx="212" cy="265" r="12" fill="none" stroke="#c7d0d8" stroke-width="3"/>
    <rect x="125" y="200" width="50" height="40"/>
    <line x1="125" y1="220" x2="100" y2="220"/><circle cx="88" cy="220" r="12" fill="none" stroke="#c7d0d8" stroke-width="3"/>
    <rect x="60" y="166" width="180" height="22"/>
    <rect x="125" y="158" width="50" height="38"/>
    <rect x="75" y="158" width="40" height="38"/>
    <rect x="185" y="158" width="40" height="38"/>
    <line x1="205" y1="158" x2="205" y2="146"/><circle cx="205" cy="138" r="10" fill="none" stroke="#c7d0d8" stroke-width="3"/>
    <rect x="240" y="163" width="28" height="28" fill="#4a535b"/>
    <rect x="258" y="191" width="10" height="60" fill="#7c848b"/>
    <rect x="125" y="113" width="50" height="40"/>
    <line x1="175" y1="133" x2="200" y2="133"/><circle cx="212" cy="133" r="12" fill="none" stroke="#c7d0d8" stroke-width="3"/>
    <rect x="132" y="88" width="36" height="25"/>
    <line x1="150" y1="88" x2="150" y2="80"/>
    <circle cx="150" cy="66" r="15" fill="#efede6" stroke="#b49f68" stroke-width="3"/>
  </g>
</svg>`;

// Illustrative (fictional) import sequence for the performance-trend chart.
// Each entry is one imported Final Inspection: scored valves and passed valves.
// Generated deterministically so the chart is identical on every load.

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const rand = seeded(20260101);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export const IMPORTS = Array.from({ length: 40 }, (_, i) => {
  const scored = 14 + Math.round(rand() * 10);
  // early reports are all clean, then a few difficult visits, then steady
  const failRate = i < 2 ? 0 : i < 9 ? 0.06 + rand() * 0.14 : 0.04 + rand() * 0.09;
  const passed = scored - Math.round(scored * failRate);
  const day = 3 + Math.floor((i / 40) * 170);
  const month = MONTHS[Math.min(5, Math.floor(day / 30))];
  return { n: i + 1, label: `${month} · import ${i + 1}`, month, scored, passed };
});

let s = 0;
let p = 0;
export const CUMULATIVE = IMPORTS.map((r) => {
  s += r.scored;
  p += r.passed;
  return { ...r, cumScored: s, cumPassed: p, pct: (p / s) * 100 };
});

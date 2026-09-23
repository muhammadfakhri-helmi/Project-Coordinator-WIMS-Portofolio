const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = window.matchMedia('(max-width: 720px)');

export const env = {
  get reducedMotion() {
    return reducedQuery.matches;
  },
  get mobile() {
    return mobileQuery.matches;
  },
  // Decided once at load: geometry detail is not rebuilt on resize.
  lowPower: mobileQuery.matches || (navigator.hardwareConcurrency || 8) <= 4,
  onReducedMotionChange(fn) {
    reducedQuery.addEventListener('change', fn);
  },
  onMobileChange(fn) {
    mobileQuery.addEventListener('change', fn);
  },
};

export function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) if (c != null) node.append(c);
  return node;
}

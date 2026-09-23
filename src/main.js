import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import { hasWebGL } from './utils/env.js';
import { initArchive } from './components/archive.js';
import { initTrend } from './components/trendChart.js';
import { initViewer } from './components/viewer.js';
import { initEquipment } from './components/equipment.js';
import { initStory } from './scenes/story.js';

document.documentElement.classList.add('js');

// 1. HTML narrative and demos work immediately, before any 3D code loads.
const archive = initArchive();
const trend = initTrend();
initViewer();
const equipment = initEquipment();
const story = initStory({ trend, archiveRows: archive.rows });

// 2. The 3D stage is a separate chunk, loaded after first paint.
const loader = document.querySelector('[data-loader]');
const doneLoading = () => {
  loader.classList.add('is-done');
  setTimeout(() => loader.remove(), 500);
};

function useFallback(reason) {
  if (reason) console.info('3D view unavailable:', reason);
  document.querySelector('[data-stage]').classList.add('is-hidden');
  equipment.useFallback();
  doneLoading();
}

async function loadStage() {
  if (!hasWebGL()) return useFallback('WebGL not supported');
  try {
    const { Stage } = await import('./three/stage.js');
    const stage = new Stage(document.querySelector('[data-stage-canvas]'));
    if (import.meta.env.DEV) window.__stage = stage; // debugging aid, stripped from builds
    equipment.attachStage(stage);
    story.attachStage(stage);
    doneLoading();
  } catch (err) {
    useFallback(err?.message || err);
  }
}

const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 60));
idle(loadStage, { timeout: 600 });

// Dev-only: ?at=<scene>:<fraction> jumps to a point in a scene (used for
// automated screenshots during verification). Not included in builds.
if (import.meta.env.DEV) {
  const at = new URLSearchParams(location.search).get('at');
  if (at) {
    const [id, f = '0'] = at.split(':');
    const sec = document.getElementById(id);
    if (sec) {
      document.documentElement.style.scrollBehavior = 'auto';
      const go = () => window.scrollTo(0, sec.offsetTop - window.innerHeight * 0.55 + sec.offsetHeight * Number(f));
      go();
      setTimeout(go, 400);
    }
  }
}

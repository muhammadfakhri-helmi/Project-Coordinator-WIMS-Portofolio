// Scroll choreography. Every animation is scrubbed by scroll position and
// explains a step of the workflow; with reduced motion, everything is shown
// in its resolved state and nothing is scrubbed.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env, clamp } from '../utils/env.js';

gsap.registerPlugin(ScrollTrigger);

const STEP_TEXT = [
  'Detected — the imported values contradict each other, so the valve is flagged instead of being scored.',
  'Reviewed — the coordinator opens the exact workbook, well and valve column and checks with the crew.',
  'Corrected — the confirmed value is entered for this valve position; the source workbook stays referenced.',
  'Validated — the record passes the checks again and now counts in the dashboard and trend.',
];

const STAGE_SCENES = new Set(['hero', 'field', 'inbox', 'qc', 'equipment', 'impact']);

const CLOSURE_TEXT = [
  'Event recorded — the crew reports a wing-valve packing leak that persists after greasing at Node A3; WIMS flags it as critical.',
  'Root cause — worn stem packing; greasing alone cannot restore the seal.',
  'Risk / impact — the barrier is degraded, so the valve is not counted as operable until repaired.',
  'Corrective action — replace the stem packing; material requested from stock before the next trip.',
  'Owner — Crew A team leader for the repair, with coordinator follow-up in WIMS.',
  'Due date — the next platform trip on the Crew A loop.',
  'Closure — re-test passed, record re-validated, and the item closed in the SPR action log.',
];

export function initStory({ trend, archiveRows }) {
  let stage = null;
  const current = { name: 'hero', progress: 0 };
  const sections = [...document.querySelectorAll('[data-scene]')];
  const navLinks = [...document.querySelectorAll('.scene-index a')];
  const numEl = document.querySelector('[data-scene-num]');
  const nameEl = document.querySelector('[data-scene-name]');
  const chapterName = Object.fromEntries(sections.filter((s) => s.id && s.dataset.chapter && s.querySelector('.eyebrow__n')?.textContent.length === 2).map((s) => [s.dataset.chapter, s.dataset.sceneLabel]));

  // ---- which scene is active ----------------------------------------
  function activate(name, progress) {
    current.name = name;
    current.progress = progress;
    const sec = sections.find((s) => s.dataset.scene === name);
    const ch = sec.dataset.chapter;
    numEl.textContent = ch;
    nameEl.textContent = chapterName[ch] || sec.dataset.sceneLabel;
    navLinks.forEach((a, j) => (j === Number(ch) - 1 ? a.setAttribute('aria-current', 'step') : a.removeAttribute('aria-current')));
    document.body.classList.toggle('on-paper', sec.classList.contains('scene--paper'));
    if (STAGE_SCENES.has(name)) stage?.setScene(name, progress);
  }

  sections.forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && activate(sec.dataset.scene, self.progress),
      onUpdate: (self) => {
        if (!self.isActive) return;
        current.progress = self.progress;
        if (STAGE_SCENES.has(current.name)) stage?.setProgress(self.progress);
      },
    });
  });

  // ---- stage runs only while a dark (3D) section is on screen ----------
  // On small screens the route map is an SVG, so chapter 04 needs no stage.
  const onScreen = new Set();
  const needsStage = (s) => !(env.mobile && s.id === 'field');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target);
    stage?.setVisible([...onScreen].some(needsStage));
  });
  document.querySelectorAll('.scene--dark').forEach((s) => io.observe(s));

  // ---- reading progress -----------------------------------------------
  const bar = document.querySelector('.progress__bar');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => (bar.style.transform = `scaleX(${self.progress})`),
  });

  // ---- scene-specific explanatory motion --------------------------------
  const stepper = document.querySelector('[data-stepper]');
  const stepItems = [...stepper.children];
  const stepStatus = document.querySelector('[data-stepper-status]');
  let lastStep = -1;
  function setStep(k) {
    if (k === lastStep) return;
    lastStep = k;
    stepItems.forEach((li, i) => {
      li.classList.toggle('is-done', i < k);
      li.classList.toggle('is-current', i === k);
      li.classList.toggle('is-final', i === 3);
    });
    stepStatus.textContent = STEP_TEXT[k];
  }

  const pipelines = [...document.querySelectorAll('[data-pipeline]')].map((ol) => [...ol.children]);
  const setLit = (items, n) => items.forEach((li, i) => li.classList.toggle('is-lit', i < n));

  // 02: project-start chain
  const chainSteps = [...document.querySelectorAll('.chain__step')];
  const chainFill = document.querySelector('[data-chain-fill]');
  const setChain = (p) => {
    const n = Math.min(chainSteps.length, Math.floor(p * (chainSteps.length + 0.6)));
    chainSteps.forEach((li, i) => li.classList.toggle('is-lit', i < n));
    chainFill.style.transform = `scaleX(${Math.max(0, (n - 1) / (chainSteps.length - 1))})`;
  };

  // 07: one finding followed to closure (scroll proposes a step, a click pins one)
  const closureBtns = [...document.querySelectorAll('[data-closure] button')];
  const closureText = document.querySelector('[data-closure-text]');
  const closureFill = document.querySelector('[data-closure-fill]');
  let closurePinned = false;
  const setClosure = (k) => {
    closureBtns.forEach((b, i) => {
      b.setAttribute('aria-pressed', String(i === k));
      b.parentElement.classList.toggle('is-done', i <= k);
    });
    closureFill.style.transform = `scaleX(${k / (closureBtns.length - 1)})`;
    if (closureText.textContent !== CLOSURE_TEXT[k]) closureText.textContent = CLOSURE_TEXT[k];
  };
  closureBtns.forEach((b, i) => b.addEventListener('click', () => {
    closurePinned = true;
    setClosure(i);
  }));

  // 09: invoice realization 72% → 87%
  const paid = document.querySelector('[data-paid]');
  const realization = document.querySelector('[data-realization]');
  const setPaid = (p) => {
    const v = 72 + 15 * p;
    paid.style.setProperty('--w', (v / 100).toFixed(3));
    realization.textContent = Math.round(v);
  };

  // 10: both SPR panels advance together
  const sprLists = [...document.querySelectorAll('[data-spr-list]')].map((ol) => [...ol.children]);
  const setSpr = (n) => sprLists.forEach((items) => items.forEach((li, i) => li.classList.toggle('is-lit', i < n)));

  const timelineNodes = [...document.querySelectorAll('.timeline__node')];
  const timelineRail = document.querySelector('[data-timeline-line]');
  // the rail runs from the first marker to the decision marker
  const sizeRail = () => {
    const last = timelineNodes[timelineNodes.length - 1];
    timelineRail.style.setProperty('--rail-h', `${last.offsetTop + 20 - 10}px`);
  };

  let ctx = null;
  function build() {
    ctx?.revert();
    ctx = gsap.context(() => {
      if (env.reducedMotion) {
        setStep(3);
        pipelines.forEach((items) => setLit(items, items.length));
        trend.setProgress(1);
        gsap.set(timelineRail, { scaleY: 1 });
        setChain(1);
        if (!closurePinned) setClosure(closureBtns.length - 1);
        setPaid(1);
        setSpr(5);
        return;
      }

      // 02: the plan builds stage by stage while the chapter is pinned
      ScrollTrigger.create({
        trigger: '#plan', start: 'top 70%', end: 'bottom 90%',
        onUpdate: (self) => setChain(self.progress),
      });
      setChain(0);

      // 07 / 08: review layers and HSE controls settle in one after another
      for (const list of ['[data-layers]', '.controls']) {
        gsap.from(`${list} > li`, {
          opacity: 0, y: 20, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: { trigger: list, start: 'top 85%', end: 'top 45%', scrub: true },
        });
      }

      // 07: closure timeline follows scroll until the reader picks a step
      ScrollTrigger.create({
        trigger: '[data-closure]', start: 'top 80%', end: 'bottom 40%',
        onUpdate: (self) => closurePinned || setClosure(Math.min(closureBtns.length - 1, Math.floor(self.progress * closureBtns.length))),
      });
      if (!closurePinned) setClosure(0);

      // 09: bands draw, then the invoice realization moves from 72% to 87%
      gsap.from('.band__bar:not([data-paid]), .tkdn__bar', {
        scaleX: 0, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: '[data-bands]', start: 'top 80%', end: 'center 55%', scrub: true },
      });
      ScrollTrigger.create({
        trigger: '[data-bands]', start: 'top 60%', end: 'center 35%',
        onUpdate: (self) => setPaid(self.progress),
      });
      setPaid(0);

      // 06: result bars
      gsap.from('.result__bar', {
        scaleX: 0, stagger: 0.2, ease: 'power2.out',
        scrollTrigger: { trigger: '[data-result]', start: 'top 85%', end: 'top 55%', scrub: true },
      });

      // 10: evidence and commitments advance as a pair
      ScrollTrigger.create({
        trigger: '[data-spr]', start: 'top 60%', end: 'bottom 70%',
        onUpdate: (self) => setSpr(Math.ceil(self.progress * 5)),
      });
      setSpr(0);

      // 04: cells separate into structured fields
      gsap.from('.parse__fields li', {
        opacity: 0, x: -24, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: '[data-parse]', start: 'top 80%', end: 'top 35%', scrub: true },
      });
      gsap.from('.paths .path', {
        opacity: 0, y: 24, stagger: 0.2,
        scrollTrigger: { trigger: '.paths', start: 'top 85%', end: 'top 55%', scrub: true },
      });

      // 05: validated records aggregate into the dashboard categories
      gsap.from('.ledger__bar', {
        scaleX: 0, stagger: 0.06, ease: 'power2.out',
        scrollTrigger: { trigger: '[data-ledger]', start: 'top 80%', end: 'bottom 60%', scrub: true },
      });

      // 06: one correction moves through its status steps
      ScrollTrigger.create({
        trigger: '[data-ticket]', start: 'top 75%', end: 'bottom 35%',
        onUpdate: (self) => setStep(Math.min(3, Math.floor(self.progress * 4))),
        onLeaveBack: () => setStep(0),
      });
      setStep(0);

      // 08: scattered reports align into one register
      archiveRows.forEach((tr, i) => {
        const r = (n) => Math.sin(i * 12.9898 + n * 78.233) * 0.5;
        gsap.from(tr, {
          x: r(1) * 160, y: r(2) * 50 + 20, rotation: r(3) * 8, opacity: 0.25, ease: 'power2.out',
          scrollTrigger: { trigger: '[data-archive]', start: 'top 85%', end: 'top 30%', scrub: true },
        });
      });

      // 09: history → status → next due → decision
      gsap.fromTo(timelineRail, { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: {
          trigger: '[data-timeline]', start: 'top 70%', end: 'bottom 55%', scrub: true,
          onUpdate: (self) => timelineNodes.forEach((n, i) => (n.style.opacity = self.progress * 4 >= i ? 1 : 0.3)),
        },
      });

      // 10: each import redraws the cumulative line
      ScrollTrigger.create({
        trigger: '[data-trend]', start: 'top 75%', end: 'bottom 45%',
        onUpdate: (self) => trend.setProgress(clamp(self.progress)),
      });
      trend.setProgress(0.02);

      // 05 / 11: each pipeline lights up in order
      document.querySelectorAll('[data-pipeline]').forEach((ol, k) => {
        const items = pipelines[k];
        ScrollTrigger.create({
          trigger: ol, start: 'top 85%', end: 'top 35%',
          onUpdate: (self) => setLit(items, Math.round(self.progress * items.length)),
        });
        setLit(items, 0);
      });
    });
    ScrollTrigger.refresh();
  }

  sizeRail();
  window.addEventListener('resize', sizeRail);
  build();
  env.onReducedMotionChange(() => {
    lastStep = -1;
    timelineNodes.forEach((n) => (n.style.opacity = ''));
    build();
    if (STAGE_SCENES.has(current.name)) stage?.setScene(current.name, current.progress);
  });

  // images load lazily and change layout; re-measure triggers once they do
  document.querySelectorAll('.evidence img').forEach((img) => img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true }));

  return {
    attachStage(s) {
      stage = s;
      // the observer may not have reported yet: measure directly once
      const darkOnScreen = [...document.querySelectorAll('.scene--dark')].some((d) => {
        const r = d.getBoundingClientRect();
        return needsStage(d) && r.bottom > 0 && r.top < window.innerHeight;
      });
      stage.setVisible([...onScreen].some(needsStage) || darkOnScreen);
      if (STAGE_SCENES.has(current.name)) stage.setScene(current.name, current.progress);
    },
  };
}

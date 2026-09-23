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

export function initStory({ trend, archiveRows }) {
  let stage = null;
  const current = { name: 'hero', progress: 0 };
  const sections = [...document.querySelectorAll('[data-scene]')];
  const navLinks = [...document.querySelectorAll('.scene-index a')];
  const numEl = document.querySelector('[data-scene-num]');
  const nameEl = document.querySelector('[data-scene-name]');
  const PAPER = new Set(['dashboard', 'attention', 'crew', 'archive', 'planning', 'trend']);

  // ---- which scene is active ----------------------------------------
  function activate(name, progress) {
    current.name = name;
    current.progress = progress;
    const i = sections.findIndex((s) => s.dataset.scene === name);
    numEl.textContent = String(i + 1).padStart(2, '0');
    nameEl.textContent = sections[i].dataset.sceneLabel;
    navLinks.forEach((a, j) => (j === i ? a.setAttribute('aria-current', 'step') : a.removeAttribute('aria-current')));
    document.body.classList.toggle('on-paper', PAPER.has(name));
    stage?.setScene(name, progress);
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
        stage?.setProgress(self.progress);
      },
    });
  });

  // ---- stage runs only while a dark (3D) section is on screen ----------
  const onScreen = new Set();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target);
    stage?.setVisible(onScreen.size > 0);
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

  const pipeline = [...document.querySelectorAll('[data-pipeline] li')];
  const setLit = (n) => pipeline.forEach((li, i) => li.classList.toggle('is-lit', i < n));

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
        setLit(pipeline.length);
        trend.setProgress(1);
        gsap.set(timelineRail, { scaleY: 1 });
        return;
      }

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

      // 12: the complete workflow lights up in order
      ScrollTrigger.create({
        trigger: '[data-pipeline]', start: 'top 85%', end: 'top 35%',
        onUpdate: (self) => setLit(Math.round(self.progress * pipeline.length)),
      });
      setLit(0);
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
    stage?.setScene(current.name, current.progress);
  });

  // images load lazily and change layout; re-measure triggers once they do
  document.querySelectorAll('.evidence img').forEach((img) => img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true }));

  return {
    attachStage(s) {
      stage = s;
      // the observer may not have reported yet: measure directly once
      const darkOnScreen = [...document.querySelectorAll('.scene--dark')].some((d) => {
        const r = d.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight;
      });
      stage.setVisible(onScreen.size > 0 || darkOnScreen);
      stage.setScene(current.name, current.progress);
    },
  };
}

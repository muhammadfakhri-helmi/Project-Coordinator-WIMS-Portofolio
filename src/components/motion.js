// Entry motion shared by every chapter:
//  - [data-reveal]           short fade/translate once on entry (headings travel a little further)
//  - [data-count]            numbers count once when they enter the viewport
//  - [data-parallax]         documentary photos drift and settle while scrolling past
// Content is fully visible without JavaScript; with reduced motion nothing moves.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env } from '../utils/env.js';

gsap.registerPlugin(ScrollTrigger);

function format(el, v) {
  const decimals = Number(el.dataset.decimals || 0);
  let s = decimals ? v.toFixed(decimals) : String(Math.round(v));
  if (el.hasAttribute('data-group')) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return s + (el.dataset.suffix || '');
}

export function initMotion() {
  const reveals = [...document.querySelectorAll('[data-reveal]')];
  const counters = [...document.querySelectorAll('[data-count]')];
  const counted = new WeakSet();

  function countUp(el) {
    if (counted.has(el)) return;
    counted.add(el);
    const to = Number(el.dataset.count);
    const from = Number(el.dataset.from || 0);
    if (env.reducedMotion || to === from) {
      el.textContent = format(el, to);
      return;
    }
    const o = { v: from };
    gsap.to(o, { v: to, duration: 1.4, ease: 'power2.out', onUpdate: () => (el.textContent = format(el, o.v)) });
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      io.unobserve(el);
      if (el.hasAttribute('data-count')) countUp(el);
      else el.classList.add('is-in');
    }
  }, { rootMargin: '0px 0px -12% 0px' });

  let parallax = null;
  function build() {
    parallax?.revert();
    if (env.reducedMotion) {
      reveals.forEach((el) => el.classList.add('is-in'));
      counters.forEach((el) => {
        counted.add(el);
        el.textContent = format(el, Number(el.dataset.count));
      });
      return;
    }
    document.documentElement.classList.add('motion');
    reveals.forEach((el) => el.classList.contains('is-in') || io.observe(el));
    counters.forEach((el) => {
      if (counted.has(el)) return;
      el.textContent = format(el, Number(el.dataset.from || 0));
      io.observe(el);
    });
    // subtle depth shift on photos; not on small screens
    if (!env.mobile) {
      parallax = gsap.context(() => {
        document.querySelectorAll('[data-parallax] img').forEach((img) => {
          gsap.fromTo(img, { yPercent: -3, scale: 1.08 }, {
            yPercent: 3, scale: 1.03, ease: 'none',
            scrollTrigger: { trigger: img.closest('[data-parallax]'), start: 'top bottom', end: 'bottom top', scrub: true },
          });
        });
      });
    }
  }

  build();
  env.onReducedMotionChange(() => {
    document.documentElement.classList.toggle('motion', !env.reducedMotion);
    build();
  });

  // photos are lazy: remeasure once each one has decoded
  document.querySelectorAll('.doc img').forEach((img) => img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true }));
}

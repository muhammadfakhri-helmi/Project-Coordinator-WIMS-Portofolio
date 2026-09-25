# OSES Project Coordinator Portfolio — Design

Date: 2026-09-25
Status: approved in chat

## Goal

Extend the existing WIMS portfolio into an 11-chapter scrollytelling case study
of the Project Coordinator – Well Integrity role on the OSES wellhead and
X-mas tree preventive-maintenance project. Recruiters and engineering managers
must see the full project cycle: contract setup, P&L, HSE, readiness, field
coordination, WIMS, integrity review, commercial control and SPR.

## Decisions

| Topic | Decision |
| --- | --- |
| Stack | Keep Vite + vanilla ES modules + Three.js + GSAP ScrollTrigger. No React migration. Framer Motion intent is reproduced with GSAP scrub, IntersectionObserver and CSS transitions. |
| Client name | "OSES" and "PHE OSES" may appear. No logos, wells, platforms, contract numbers or IDR contract values. |
| Photos | The owner redacts the six documentary PNGs before upload. Only resized WebP/AVIF derivatives are shipped from `public/assets/documentary/`. A CSS grade/grain/vignette layer is added on top; confidentiality masks are also drawn in the page where projected screens remain visible. |
| CV | One file is allowed: `public/cv/Fakhri-CV.pdf` (checker whitelist). |
| Deploy | Push to `claude/wizardly-carson-bm5qus`, open a PR to `main`; Pages deploys on merge. |

## Chapters

1. **The Project Coordinator** — portrait + fixed 3D stage. The wellhead starts
   as a dark silhouette and reveals component by component with scroll. Six
   capability labels.
2. **Starting With a Controlled Plan** — seven-stage chain
   (Contract Review → … → Mobilization) with a scrubbed connector line; vertical
   on narrow screens.
3. **Crew and Equipment Readiness** — crew-planning photo, keyboard-operable
   readiness matrix (7 rows), four count-once counters.
4. **Coordinating Field Execution** — the WebGL stage switches to an abstract
   route map: two vessel loops, fictional nodes, moving vessel markers. DOM
   buttons mirror every node (click / Enter / tap) and open the five-step work
   sequence. SVG map when WebGL is unavailable or on mobile.
5. **From Field Reports to WIMS** — eight-step pipeline header, then the
   existing WIMS beats (inbox, QC, dashboard, need attention, crew review,
   archive, visit planning, trend) as sub-sections. States that WIMS supports
   coordination and traceability and does not replace certified assessment.
6. **Interactive Wellhead Integrity Model** — existing equipment viewer with
   eight parts (swab, UMV, LMV, wing, annulus, tubing-head adapter, pressure
   gauge, conductor), four status colours, camera easing to the selected part,
   fictional finding + follow-up + report/next-visit link. OrbitControls only
   in this chapter. 53 % → 68 % operable-valve result framed as a team result.
7. **Continuous Project Evaluation** — project-review photo, three review
   layers, seven-step scrubbed closure timeline.
8. **HSE Governance** — HSE-review photo, control-relationship diagram,
   verified metrics; PHE OSES five-million milestone described as a
   contribution.
9. **Commercial and Contract Control** — five separated bands (revenue,
   invoice status, cost, margin, opportunity), percentages only; the IDR 2
   billion figure is labelled as opportunity, not revenue.
10. **SPR and Client Satisfaction** — two synchronized panels (SPR
    presentation, client review). No numeric score.
11. **The Connected Role** — ten-node system map, closing headline, CTAs
    "Explore WIMS Case Study" (anchor to chapter 5) and "Download CV".

## Components and files

- `src/three/wellhead.js` — add conductor, tubing-head adapter naming,
  silhouette/reveal material state.
- `src/three/routeMap.js` — new: route lines, nodes, vessel markers.
- `src/three/stage.js`, `src/three/layouts.js` — new scene keys.
- `src/components/readiness.js`, `counters.js`, `routeUI.js`, `timeline.js` — new.
- `src/content/*.js` — fictional, labelled demonstration data.
- `src/styles/chapters.css` — new chapter styles; tokens reused.
- `tools/build_documentary.py` — PNG → WebP/AVIF at three widths.

## Motion and accessibility rules

- Headings short upward reveal, body short fade, metrics count once, diagrams
  draw progressively, photos subtle scale. Not every element animates.
- `prefers-reduced-motion`: every chapter in its resolved state.
- Every hotspot/node/timeline step is a real `<button>`; no hover-only
  interaction; visible focus ring; WCAG AA contrast.
- Without JavaScript or WebGL the full narrative remains readable.

## Verification

`npm run check`, `npm run build`, `npm run check:dist`; Playwright screenshots
at 1440, 820 and 390 px, reduced motion and WebGL disabled; console-error scan;
keyboard pass.

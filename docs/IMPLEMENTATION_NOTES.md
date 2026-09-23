# Implementation notes

## What was implemented

A single-page, scroll-driven portfolio in twelve scenes (see `DESIGN_SYSTEM.md`):

| # | Scene | HTML / SVG layer | 3D layer |
| --- | --- | --- | --- |
| 01 | The coordinator | Headline, statement, capability index, scroll cue | Procedural wellhead; report sheets ring the tree with thin lines to seven components; scroll turns the view slightly |
| 02 | The original problem | Seven difficulties, each with a fictional report fragment | Sheets scatter around the equipment |
| 03 | Final Inspection Inbox | Four-step sequence + screenshot 01 | Sheets settle into an inbox tray, then pass one by one through a scan gate and become structured record strips |
| 04 | Automation + human QC | Cells → ten structured fields; green and amber paths; screenshot 02 | Records split: most turn green, one in eight waits at an amber hold frame, then is confirmed and joins the validated block |
| 05 | Dashboard | Ledger of eight information types (bars grow on scroll); screenshot 03 | hidden (paper) |
| 06 | Need attention | Correction ticket; Detected → Reviewed → Corrected → Validated scrubbed by scroll; screenshot 04 | hidden |
| 07 | Crew review | Review dimensions and the fair-use statement; screenshot 05 | hidden |
| 08 | Report dictionary | Working filters (year, well, status, source, scope, anomaly status) over eight fictional reports; rows align from a scattered state; screenshot 06 | hidden |
| 09 | Visit planning | Last visit → current status → next due → coordinator decision, rail drawn on scroll; screenshot 07 | hidden |
| 10 | Performance trend | SVG chart redrawn import by import, live readouts, generated summary, data table; screenshot 08 | hidden |
| 11 | 3D equipment context | Records table ↔ markers ↔ detail panel (nine fields), leader line from row to marker, zoom/reset controls, legend | Constrained orbit (drag, arrow keys), zoom (buttons, +/−), click-to-pick components, status tint on the selected part |
| 12 | Connected workflow | Eleven-step pipeline lit in order (each step links back to its scene), closing statement, two CTAs, capability list linking to evidence | Pulled-back view: tree in front of an ordered wall of colour-coded records |

## Architecture

```
index.html            full narrative as semantic HTML (readable without JS/WebGL)
src/main.js           boots HTML components first, then lazy-loads the 3D chunk
src/styles/           tokens → base → layout → components
src/content/          fictional data: hotspots, report register, trend series
src/components/       archive filters, trend chart, screenshot viewer,
                      equipment interaction, SVG fallback schematic
src/scenes/story.js   GSAP ScrollTrigger: active scene, progress bar, scrubbed explanations
src/three/stage.js    renderer, camera composition, render-on-demand loop, picking
src/three/wellhead.js procedural model
src/three/reportSheets.js  one InstancedMesh of report sheets with eased targets
src/three/layouts.js  per-scene sheet layouts as pure functions of (index, progress)
src/utils/env.js      reduced motion, mobile, WebGL detection, small helpers
scripts/check.mjs     privacy / hygiene checker
tools/sanitize_screenshots.py  reproducible screenshot sanitization
```

Key decisions:

- **Vanilla JS, no framework.** The page is one document with a handful of
  interactive parts; React would add weight without improving structure.
- **HTML first, 3D second.** All content renders before the 3D chunk
  (`stage-*.js`, ~143 KB gzip) is requested via `import()` on idle. The 3D is
  presentational and `aria-hidden`; every message also exists in text.
- **One fixed canvas behind the story**, composed per scene with
  `camera.setViewOffset`, so the subject can sit off-centre (right half on
  desktop). In scene 11 (and the mobile hero) the composition is attached to a
  page element and follows it while scrolling.
- **Render on demand.** The loop runs only while the camera, sheets or overlay
  are still easing, or during a drag; it sleeps otherwise and stops entirely
  while paper sections cover the viewport (IntersectionObserver).
- **Scroll-scrubbed, not time-based.** Sheets ease toward targets computed from
  scene progress; no idle animation.
- **No shadow maps, no post-processing.** A canvas-texture contact shadow and a
  procedural RoomEnvironment give enough depth. DPR capped at 1.75 (1.5 on
  low-power / mobile). Bolts are merged into one `InstancedMesh`.
- **Hotspots are real `<button>`s** projected from 3D anchors, with a facing
  test that dims markers behind the tree.
- **Charts in SVG**, never WebGL text.
- **Base path**: `BASE_PATH` (default `./`) keeps all URLs relative, so the same
  build works at a domain root, a GitHub Pages project subpath or a folder.
- `assetsDir: 'static'` keeps Vite's hashed bundles separate from
  `public/assets`.

## WIMS features represented

Monitored Final Inspection Inbox with automatic scan and import (stable-file
check, lock-file skip — confirmed in the WIMS main process), manual well-mapping
QC with master-list candidate, operational dashboard with explicit scoring
exclusions (Lock Open, Pneumatic, Production Choke), Need Attention / manual or
unreadable corrective list with per-valve addresses and check rules, crew valve
maintenance performance with roster matching and Review Work drill-down,
Final Inspection search with six filters, visit history with next-due dates and
the ITM Recommendation module (shown in the sidebar, not claimed as autonomous),
cumulative valve-maintenance performance chart.

## What is simplified

- The 3D model is a generic, illustrative assembly (casing head, tubing spool
  with annulus outlet, adapter flange, two master valves, flow cross, production
  and kill wings, choke, swab valve, tree cap, gauge). Not to scale, not a
  specific product, not a digital twin.
- Hotspot records, the report register, the correction example, the planning
  example and the trend series are fictional demonstration data.
- The status stepper in scene 06 illustrates the review sequence; it is not a
  claim about WIMS's internal state model.
- Dev-only helpers (`?at=<scene>:<fraction>`, `window.__stage`) exist only in
  `npm run dev` and are stripped from builds.

## Needs human approval before public release

See `PRIVACY_CHECK.md` → “Items that need a human decision”. In short:
permission to show the sanitized WIMS interface and to describe the workflow,
whether year labels may stay, and whether to add contact details.

## Phase-two ideas

- Replace the procedural model with a Draco-compressed GLB of a representative
  (non-proprietary) tree, keeping the anchor names.
- Optional exploded and cutaway views (the reference prototype had both).
- A short narrated walkthrough video for recruiters who will not scroll.
- Light-weight analytics (privacy-friendly) to see which scenes are read.
- Localised Indonesian version of the copy.
- Automated visual regression screenshots in CI (the CDP approach used during
  verification could be turned into a script).

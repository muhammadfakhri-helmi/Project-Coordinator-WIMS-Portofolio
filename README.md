# From Field Inspection Reports to Well Integrity Decisions

A scroll-driven 3D portfolio showing how Fakhri, a Well Integrity Project
Coordinator, built **WIMS** to turn hundreds of Excel Final Inspection reports
into structured, traceable and actionable well integrity information.

**Live demo:** _add your GitHub Pages URL here after the first deployment_

![Hero of the portfolio: headline beside a simplified 3D wellhead and X-mas tree](docs/preview.webp)

> **Disclaimer.** This portfolio uses sanitized and simplified representations
> of inspection workflows. It does not publish client records, original
> inspection reports, proprietary engineering data, or certified equipment
> geometry.

## What it shows

Twelve scenes, one continuous scroll:

1. The coordinator — headline and a procedural wellhead/X-mas tree
2. The original problem — scattered workbooks, inconsistent naming, manual recaps
3. Final Inspection Inbox — reports enter a monitored folder and are scanned automatically
4. Automation with human QC — green path validated automatically, amber path confirmed by a person
5. Operational dashboard — one view of visits and valve-maintenance outcomes
6. Need Attention — each issue addressed to workbook, well, valve position and fields
7. Crew performance — validated records for fair work-quality review
8. Report dictionary — a working filter demo over a fictional register
9. Visit planning — last visit → status → next due → coordinator decision
10. Performance trend — cumulative passed percentage redrawn import by import
11. 3D equipment context — inspection records located on the equipment, with details
12. Connected workflow — the whole flow, closing statement and capabilities

## Features

- Scroll-controlled camera and report-sheet animation (Three.js, GSAP ScrollTrigger)
- Constrained orbit and zoom, clickable components, keyboard-operable hotspot buttons
- Records table ↔ 3D markers ↔ detail panel, with a leader line on wide screens
- SVG chart with a written summary and data table
- Full narrative in semantic HTML; works without WebGL (SVG schematic) and without JavaScript (static text)
- `prefers-reduced-motion`: every scene shown in its resolved state, no travel
- Mobile mode: lighter geometry, fewer sheets, vertical layouts, touch-friendly controls
- Render-on-demand loop, capped pixel ratio, no shadow maps, lazy screenshots, 3D code split into its own chunk

## Technology

Vite · Three.js · GSAP + ScrollTrigger · vanilla JavaScript (ES modules) ·
modular CSS · SVG · self-hosted fonts (Archivo, Hanken Grotesk, JetBrains Mono).
No backend, API keys, accounts or external services.

## Run locally

Requires Node.js 20.19+ (22 recommended, see `.nvmrc`).

```bash
npm install
```

```bash
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

## Production build

```bash
npm run build
```

```bash
npm run preview
```

`npm run check` runs the privacy/hygiene scan on the source;
`npm run check:dist` also scans the build.

The base path is read from `BASE_PATH` (default `./`, relative URLs). Relative
URLs work from a domain root, a GitHub Pages project subpath or any folder. Use
`BASE_PATH=/` for a custom domain root or `BASE_PATH=/<repository>/` if you
prefer absolute Pages URLs.

## Deploy to GitHub Pages

1. Create a GitHub repository and push this folder (and only this folder) to its `main` branch.
2. In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main` (or run the workflow manually). `.github/workflows/deploy-pages.yml`
   runs `npm ci`, `npm run check`, `npm run build`, `npm run check:dist`, uploads `dist/`
   and deploys it with the official Pages actions and the built-in token.
4. Paste the resulting URL into “Live demo” above.

It is a single page with no client-side routing, so refreshing never produces a 404.

## Repository structure

```
.github/workflows/deploy-pages.yml   GitHub Pages CI
docs/                                design system, asset manifest, privacy and release checks
public/assets/screenshots/           8 sanitized WebP screenshots (only public images)
public/assets/models/, textures/     empty on purpose (procedural model) — see READMEs inside
src/main.js                          entry: HTML components first, 3D lazily
src/styles/                          tokens, base, layout, components
src/content/                         fictional demonstration data
src/components/                      archive filters, trend chart, viewer, equipment UI, SVG fallback
src/scenes/story.js                  scroll choreography
src/three/                           stage, procedural wellhead, report sheets, layouts
src/utils/                           environment helpers
scripts/check.mjs                    privacy / hygiene checker
tools/sanitize_screenshots.py        reproducible screenshot sanitization
index.html                           the whole narrative, readable without JS
```

## The 3D model

The wellhead and X-mas tree are **procedurally generated from Three.js
primitives in `src/three/wellhead.js`** — original code written for this
portfolio. Components: casing head, tubing spool with an annulus outlet,
adapter flange, lower and upper master valves, flow cross, production and kill
wing valves, choke, swab valve, tree cap and pressure gauge. Proportions are
generic; the model contains no ratings, dimensions or field configuration.

On the page it is labelled: *Simplified interactive wellhead/X-mas tree
visualization for portfolio communication.* It is a communication tool, not a
certified engineering representation or digital twin.

### Replacing the procedural model with a GLB

1. Use an original or properly licensed model; record creator, source, license
   and modifications in `docs/ASSET_MANIFEST.md`.
2. Optimise it (e.g. `npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress webp`), aim for < 10 MB.
3. Put it in `public/assets/models/`.
4. In `src/three/wellhead.js`, load it with `GLTFLoader` (+ `DRACOLoader`) instead of building primitives, and
   return the same shape: `root`, `pickables` (meshes with `userData.part`), `highlight()`, and an `anchors`
   object with `Object3D`s named `master, swab, wing, choke, gauge, flange, annulus`.
   Empties with those names in the GLB make this a one-line lookup.
5. Load it with `import.meta.env.BASE_URL + 'assets/models/<file>.glb'` so it respects the base path.

## Assets and licenses

- Portfolio code: MIT (`LICENSE`).
- Sanitized screenshots of WIMS: viewing only, not licensed for reuse.
- Third-party code and fonts: three.js (MIT), GSAP (standard no-charge license),
  fonts (SIL OFL 1.1) — see `THIRD_PARTY_NOTICES.md`.
- No external models, textures, icons or stock images.

## Privacy

This repository is public-facing. It contains no inspection workbooks, no
PDF or CSV, no original screenshots, no WIMS source code or binaries, no client,
well or personnel identifiers, no internal links and no local paths. All wells,
platforms, people, files, dates and figures are fictional. Original reports
remain controlled within the internal WIMS environment; the site offers no
download of any source document.

Before every publish: run `npm run check:dist` after `npm run build`. For the
strongest check, keep a local `.privacy-terms.local.txt` (git-ignored) listing
real client, well and personnel identifiers — the checker fails if any appear.
Details: `docs/PRIVACY_CHECK.md`, `docs/PUBLIC_REPOSITORY_AUDIT.md`.

## Known limitations

- The model is illustrative; component placement is generic.
- Hotspot markers do not test full occlusion; markers behind the tree are dimmed instead.
- Screenshots are raster images; they are captioned and have alt text but their inner text is not selectable.
- Very old GPUs fall back to the SVG schematic; there is no intermediate WebGL quality tier beyond mobile/desktop.
- On first visit fonts load with `font-display: swap`, so headline metrics can shift slightly.

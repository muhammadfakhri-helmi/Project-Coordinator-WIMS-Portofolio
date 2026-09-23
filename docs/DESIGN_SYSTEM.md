# Design System — WIMS Portfolio

Internal design brief written before implementation. It sets the rules the
interface follows; where the code differs, update this document.

## 1. Target audience

| Audience | What they need to see in under a minute |
| --- | --- |
| Recruiters | A clear role title, a concrete problem, and evidence it was solved |
| Hiring / project managers | Coordination ability: ownership of a workflow, not just a tool |
| Well integrity professionals | Correct vocabulary: Final Inspection, valve maintenance, master/wing/swab/annulus valves, no-test, lock-open exclusions |
| Oil and gas stakeholders | Data governance, human control over uncertain data, traceability to the source report |
| Digital transformation teams | A working information flow, from field workbook to dashboard to 3D context |

## 2. Primary viewer action

**Understand Fakhri's combined capability in project coordination, well
integrity, application development, data governance, and 3D visualization.**

Every scene answers one question in that chain. The closing scene restates
the chain and lets the viewer jump back to the evidence for each capability.

## 3. Visual thesis

**Operational clarity emerging from complex field data.**

The page starts dark, dense and scattered (many workbooks, many wells) and
becomes progressively ordered: sheets queue, fields separate, records
aggregate, the archive aligns, the timeline straightens, and the final
view shows one connected flow. Order is the reward for scrolling.

## 4. Typography

| Role | Face | Why |
| --- | --- | --- |
| Display | **Archivo** (variable, width 62–125) | A grotesque with industrial signage roots. The width axis lets headlines run semi-condensed and heavy, like equipment tags and stencilled plant labels, without resorting to a novelty face. It gives scale contrast against the body text. |
| Body | **Hanken Grotesk** (variable) | The typeface WIMS itself uses. Reusing it links the portfolio to the real product and keeps screenshots and the surrounding copy visually continuous. It is restrained and very legible at 16–18 px. |
| Data | **JetBrains Mono** | Also used by WIMS for dates and codes. Used only for identifiers, field names, counters, and step numbers — never for paragraphs. |

Inter is not used: WIMS does not use it, and it would flatten the page into a
generic product look. All fonts are self-hosted through `@fontsource` (no
third-party font requests, works offline and on GitHub Pages).

Scale (rem, 16 px root): 0.75 · 0.875 · 1 · 1.125 · 1.375 · 1.75 · 2.5 · 3.5 · clamp() hero up to 5.25.
Line length for body copy: 60–68 characters.

## 5. Functional colour system

Colour is reserved for meaning. Neutral surfaces carry no status.

| Token | Value | Role — and only this role |
| --- | --- | --- |
| `--navy-950` | `#07111c` | Main environment, 3D scene background |
| `--navy-900` / `--navy-800` | `#0b1a2a` / `#12263a` | Raised dark surfaces, panels |
| `--paper` | `#f2eee5` | Warm off-white editorial surfaces (evidence chapters) |
| `--paper-ink` | `#132030` | Text on paper |
| `--signal` | `#46c2e0` | Data in motion, processing, navigation, focus |
| `--pass` | `#2fb872` | Validated / passed results only |
| `--attn` | `#f0a52c` | Warnings and human-confirmation gates only |
| `--crit` | `#e5484d` | Critical findings only |
| `--na` | `#8b98a7` | No test, unavailable, excluded, insufficient data |

The equipment model is painted neutral graphite and steel so that red, amber
and green on the model always mean inspection status. No gradients between
hues, no purple.

## 6. Spacing rhythm

Eight-point base: `--s1 8px · --s2 16px · --s3 24px · --s4 32px · --s5 48px · --s6 64px · --s7 96px · --s8 128px`.
Section padding uses `--s7`/`--s8` on desktop and `--s5`/`--s6` on mobile. Components
snap to multiples of 8; hairline rules are 1 px.

## 7. Layout silhouette

A 12-column grid with deliberate asymmetry:

- **Dark chapters (1–4, 11–12)** sit over a fixed 3D stage. Text occupies
  columns 1–6; the equipment and data sheets occupy the right half. The
  camera composition shifts the model off-centre rather than centring it.
- **Paper chapters (5–10)** are editorial evidence spreads: a narrow
  numbered margin column, a statement column, and a wide evidence column for
  the sanitized screenshot plus an explanatory diagram. Screenshot and
  diagram alternate sides to avoid a repeating card rhythm.
- Mobile collapses to one column in reading order: statement → diagram →
  screenshot.

No hero-plus-three-cards, no card grids of equal weight.

## 8. Purpose of each screenshot

All screenshots are sanitized derivatives (see `ASSET_MANIFEST.md`).

| # | Screenshot | Scene | What it proves |
| --- | --- | --- | --- |
| 01 | Auto scan import | 3 · Inbox | Reports dropped into the inbox are detected and imported without manual upload |
| 02 | Manual well mapping QC | 4 · Human QC | Ambiguous well identity pauses one file for coordinator confirmation while the rest continue |
| 03 | Operational dashboard | 5 · Dashboard | Reports aggregate into visit status and valve-maintenance outcome categories with explicit exclusions |
| 04 | Need-attention corrections | 6 · Corrective queue | Each issue points to workbook, well, valve position and fields to check |
| 05 | Crew performance | 7 · Work-quality review | Validated records support review per crew with a Review Work drill-down |
| 06 | Report dictionary | 8 · Archive | One filterable register of every Final Inspection report |
| 07 | Visit history / next due | 9 · Planning | Last visit and next due per well, feeding coordination |
| 08 | Performance trend | 10 · Trend | Cumulative passed percentage recalculated after each import |

## 9. Animation principles

Motion is allowed only when it explains one of: **transformation, hierarchy,
cause and effect, spatial location, or progress through the workflow.**

- Scroll-scrubbed, never time-looped. When the reader stops scrolling, the
  scene stops. The WebGL loop sleeps when nothing changes.
- One idea per motion: sheets *arrive*, fields *separate*, paths *split*,
  records *aggregate*, a ticket *advances*, cards *align*, a line *draws*.
- Easing: `power2.out` for arrivals, linear for scrubbed progress.
- No parallax for its own sake, no glow pulses, no idle rotation beyond a
  very slow turn in the hero that stops once the reader scrolls.
- `prefers-reduced-motion: reduce` shows every scene in its final, resolved
  state and the 3D stage jumps between compositions instead of travelling.

## 10. Desktop and mobile strategy

| | Desktop (≥ 1024 px) | Mobile (≤ 720 px) |
| --- | --- | --- |
| 3D model | Full detail, environment reflections | Fewer segments, no bolt rings, DPR ≤ 1.5 |
| Report sheets | ~160 instances | ~56 instances |
| Hotspots | Floating markers + leader line to the selected record row | Markers without floating labels; details in a panel below the model |
| Orbit | Drag to rotate, buttons and keys to zoom | Horizontal drag rotates, vertical drag scrolls the page (`touch-action: pan-y`) |
| Layouts | Horizontal pipelines and split paths | Vertical sequences |

Tablet (768–1023 px) uses the desktop model with the mobile layout rules for
panels.

## 11. Accessibility approach

- Semantic landmarks: `header`, `nav` (scene index), `main` with one
  `section` per scene, each with an `h2`; single `h1` in the hero.
- The complete narrative is HTML text. The canvas is `aria-hidden`; every 3D
  message is duplicated in text (hotspot records table and detail panel).
- Hotspots are `<button>`s (≥ 44 × 44 px), reachable by Tab, operable with
  Enter/Space, and mirrored by the records table rows.
- Visible focus: 2 px `--signal` outline with 3 px offset on every control.
- Contrast: body text ≥ 7:1 on navy and on paper; status colours are always
  paired with a text label, never colour alone.
- Charts are SVG with `<title>`/`<desc>`, a written summary and a data table.
- Screenshots have descriptive `alt` text stating what the interface shows.
- Reduced motion honoured in CSS and in JavaScript.
- Works without WebGL (static SVG equipment schematic with the same hotspot
  buttons) and remains readable without JavaScript.

## 12. Public-data sanitization approach

- Only fictional demonstration data appears in HTML, JS and diagrams
  (`WELL-A07`, `PLATFORM B`, `INSPECTOR A`, `SAMPLE FINAL INSPECTION …`).
- Screenshots are re-rendered derivatives: sensitive text is painted over
  with solid fills and replaced with fictional values in the WIMS typeface.
  Nothing depends on blur. The third-party crest used as the WIMS logo is
  replaced with a neutral monogram.
- Real statistics are not shown. Screenshot numbers are fictional and
  labelled as an application snapshot.
- No workbook, PDF, CSV, source code or download link is deployable. The page
  states that original reports remain in the controlled WIMS environment.
- `npm run check` searches the repository (and `dist` with `--dist`) for
  absolute paths, raw document types, secrets and a local, git-ignored list
  of real identifiers.

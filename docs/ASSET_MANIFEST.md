# Asset manifest

Every file that is served to visitors, where it came from, and what was done
to it. "Reference package" means the local, private working archive that
contains the original screenshots; it is never committed or deployed.

## Sanitized WIMS screenshots

All eight were produced by `tools/sanitize_screenshots.py` from the original
PNGs (the originals were only read, never modified). Processing is
deterministic: solid fills sampled from the surrounding UI surface paint over
every sensitive text region, and fictional replacement text is redrawn in the
application's own typeface (Hanken Grotesk / JetBrains Mono). No blur-only
masking, no generative image editing. Output: WebP, quality 84, ≤ 1400 px wide.

| Public derivative | Original (reference package) | Modifications | Sensitive content masked | Scene |
| --- | --- | --- | --- | --- |
| `public/assets/screenshots/01-auto-scan-import.webp` (740×465, 14 KB) | `04_WIMS_SCREENSHOTS/01_auto_scan_report_import.png` | Cropped to the dialog; backdrop blurred further *and* the dialog re-composited so no backdrop text survives; report file name and progress counter replaced | Yes — real report file name (platform + well), file counts | 03 Inbox |
| `…/02-manual-well-mapping-qc.webp` (942×900, 46 KB) | `04_WIMS_SCREENSHOTS/02_manual_well_mapping_qc.png` | Cropped to the dialog (sidebar and scrollbar removed); file, parsed well, parsed platform, platform count, selected well, master well and platform replaced | Yes — real file name, well code, platform names, number of client platforms | 04 Human QC |
| `…/03-operational-dashboard.webp` (1400×908, 47 KB) | `04_WIMS_SCREENSHOTS/03_operational_dashboard.png` | Scrollbar cropped; logo replaced with a neutral “W” monogram; every count and percentage replaced with fictional values; progress bars redrawn to match | Yes — real campaign statistics; third-party crest used as logo | 05 Dashboard |
| `…/04-need-attention-corrections.webp` (1400×504, 46 KB) | `04_WIMS_SCREENSHOTS/04_need_attention_corrections.png` | Partial fourth row cropped; total replaced; well codes and workbook names replaced (check-rule texts kept, they are product behaviour) | Yes — real well codes, platform names, report file names | 06 Need attention |
| `…/05-crew-performance.webp` (1400×499, 36 KB) | `04_WIMS_SCREENSHOTS/05_crew_performance.png` | Top sliver cropped; personnel names → “Inspector A/B/C”; contractor name → “company”; all counts, scores and totals replaced | Yes — personnel names, contractor name, individual performance figures | 07 Crew review |
| `…/06-report-dictionary.webp` (1400×873, 69 KB) | `04_WIMS_SCREENSHOTS/06_report_dictionary.png` | Scrollbar and window edge cropped; logo replaced; result count, file names, upload dates, well codes, platforms, inspection dates and anomaly counts replaced | Yes — report file names, well codes, platforms, dates, anomaly counts, crest | 08 Archive |
| `…/07-visit-history-next-due.webp` (1286×710, 34 KB) | `04_WIMS_SCREENSHOTS/07_visit_history_and_next_due.png` | Windows title bar cropped; both logo instances replaced; counters, well codes, platforms and dates replaced | Yes — well codes, platforms, visit dates, crest | 09 Planning |
| `…/08-performance-trend.webp` (1400×860, 56 KB) | `04_WIMS_SCREENSHOTS/08_well_integrity_performance.png` | Totals replaced; the plotted series, grid and date axis were erased and redrawn with an illustrative series and month-only labels | Yes — real totals and the real cumulative performance curve | 10 Trend |

Each screenshot is captioned on the page as sanitized, and the dashboard one
carries “Application snapshot — values change as reports are imported.”

## Other public assets

| Asset | Origin | Notes |
| --- | --- | --- |
| `public/favicon.svg` | Original, drawn for this site | Simple wellhead-bore mark |
| `docs/preview.webp` | Screenshot of this website's hero | README only, not deployed |
| Wellhead / X-mas tree model | **Original procedural geometry** in `src/three/wellhead.js` | Built from Three.js primitives (cylinders, tori, boxes). Generic, illustrative proportions; no pressure ratings, bore sizes, part numbers or field configuration. Written for this portfolio; the reference HTML prototype was studied for component list and assembly order only. Labelled on the page as “Simplified interactive wellhead/X-mas tree visualization for portfolio communication.” |
| Report-sheet texture, contact shadow | Generated on a canvas at runtime | No image files |
| Reflection environment | `RoomEnvironment` from three.js (MIT) | Procedural, no HDR file |
| Fonts | Archivo, Hanken Grotesk, JetBrains Mono via `@fontsource-variable` | SIL OFL 1.1, bundled into `dist/static` by Vite |

No external GLB/GLTF model, texture pack, icon set or stock image is used, so
there are no third-party model attribution requirements. See
`THIRD_PARTY_NOTICES.md` for code and font licenses.

## Demonstration data

All wells (`WELL-A07`, `WELL-B28`, …), platforms (`Platform A`–`Y`), people
(`Inspector A/B/C`), report file names (`SAMPLE FINAL INSPECTION …`), dates,
counts and the trend series in `src/content/` and `index.html` are fictional.
The trend series is generated deterministically from a fixed seed
(`src/content/trend.js`).

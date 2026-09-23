# GitHub release check

Date: 2026-09-23 · Repository root: this folder only (`git init` was run here;
the parent reference folder is not a repository). Nothing has been committed,
pushed or published — files are staged for the owner to review.

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Inspect every file intended for Git | Pass | 51 staged files listed with `git ls-files`: source, docs, 8 sanitized WebP screenshots, README preview, favicon, config, CI workflow, check and sanitize scripts. |
| 2 | No reference folder copied | Pass | No `01_…`–`06_…` or `Final Inspection Inbox` paths; the checker fails if one appears; `.gitignore` also lists them. |
| 3 | No workbook or PDF tracked | Pass | No `.xlsx/.xls/.xlsm/.csv/.pdf/.doc(x)` in `git ls-files`; all are git-ignored and rejected by the checker. |
| 4 | No absolute Windows paths | Pass | `git grep` and `npm run check` (drive-letter paths, program-folder paths, home paths, file-scheme URLs). |
| 5 | No client, contract, well or personnel identifiers | Pass | `git grep -i -w` against the 39-term local list → no matches; screenshots inspected visually. |
| 6 | No secrets or environment values | Pass | No `.env`; `.env.example` contains only `BASE_PATH=./`; secret patterns → none. |
| 7 | Sanitized screenshots inspected | Pass | All eight viewed at full resolution after the final generation; see `ASSET_MANIFEST.md`. |
| 8 | Model ownership / originality | Pass | Procedural geometry written for this project (`src/three/wellhead.js`); no model files. |
| 9 | Asset licenses | Pass | three.js MIT, GSAP standard no-charge license, fonts OFL 1.1 (versions verified from installed packages); `THIRD_PARTY_NOTICES.md`. |
| 10 | Clean production build | Pass | Fresh export of the staged files → `npm ci` → `npm run check` → `npm run build` → `npm run check:dist`, all green. Build ≈ 1.5 MB, 26 files; 3D chunk ≈ 143 KB gzip, main chunk ≈ 54 KB gzip. |
| 11 | Built site from a Pages-style subpath | Pass | Build served from `/wims-portfolio/` on a plain static server: HTML, scripts, fonts and all 8 screenshots returned 200; the 3D stage rendered. Built both with `BASE_PATH=./` (the CI default) and with an absolute `/wims-portfolio/` base. |
| 12 | 3D loads without local filesystem access | Pass | Model is generated in code; no local file URLs; verified on the static server above. |
| 13 | Refreshing the deployed page | Pass | Single page, no client routing; reload on the subpath returned 200 and re-rendered. |
| 14 | Mobile and reduced motion | Pass | 390×844 tour of all scenes (vertical layouts, lighter model, marker taps); reduced-motion run shows every scene in its final state (stepper “Validated”, 11/11 pipeline steps, full trend, unscattered archive). No-WebGL run shows the SVG schematic with working markers. |
| 15 | No file above GitHub's limit | Pass | Largest tracked file 72 KB; checker enforces 25 MB. |

Browser console during every automated run (desktop, tablet, mobile,
reduced-motion, no-WebGL, subpath build): no errors or warnings from the page.
The only messages seen in the interactive pane were ANGLE shader-compiler
precision notes emitted by the GPU driver when Three.js compiles its built-in
shaders — not actionable in this code.

## Owner steps to publish

1. Review the staged files (`git status`, `git diff --cached`).
2. Commit, create an empty GitHub repository, add it as `origin`, push `main`.
3. Settings → Pages → Source: **GitHub Actions**.
4. After the first run, add the live URL to the README.
5. Settle the permission items in `PRIVACY_CHECK.md` before sharing the link.

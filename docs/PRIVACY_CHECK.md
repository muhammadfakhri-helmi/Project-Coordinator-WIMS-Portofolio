# Privacy check

Date: 2026-09-23 · Scope: everything under this repository, plus the production
build in `dist/`.

## How it was checked

1. **Automated scan — `npm run check` and `npm run check:dist`** (`scripts/check.mjs`).
   Scans every publishable file (git-ignored files are skipped; `dist/` is always
   scanned with `--dist`) for:
   - raw document or data types: `.xlsx .xls .xlsm .csv .pdf .doc .docx .zip .7z .rar .db .sqlite* .bak .psd .exe .asar .pak`;
   - original-format screenshots in `public/assets/screenshots/` and file names matching the original WIMS screenshots;
   - copied reference folders;
   - absolute Windows paths, Windows program-folder paths, home-directory paths, file-scheme URLs;
   - OneDrive / SharePoint links;
   - secrets: private keys, AWS / GitHub / Google / `sk-` style keys, `password|secret|token|api_key = "…"` assignments;
   - e-mail addresses;
   - `localhost` in shipped code;
   - files above 25 MB;
   - **39 real identifiers** from a local, git-ignored list (`.privacy-terms.local.txt`):
     platform/field names and well-code prefixes seen in the reference files,
     personnel names from the crew screenshot, contractor and client names,
     and the contract number.
2. **Negative test.** A temporary file containing a real platform name and an
   absolute path was added; the check failed on both lines as expected, then the
   file was removed. A build accidentally produced with a shell-converted base
   path (pointing into the Git for Windows install folder) was also caught, which led to the extra
   program-folder rule.
3. **Visual inspection of all eight sanitized screenshots** at full resolution
   after generation, including zoomed crops of every edited row, to make sure no
   partial glyphs of the original text remained. Two rounds of fixes were needed
   (remnants of well codes and a platform name in the report-dictionary rows);
   the final derivatives were re-inspected and are clean.
4. **Manual read-through** of `index.html`, `src/content/*`, all docs and the
   sanitization tool for real names, codes, dates and figures.

## Result

`npm run check` → pass (39 publishable files).
`npm run check:dist` → pass (source + `dist/`).

Nothing from the reference package is included: no workbook, no PDF, no
original screenshot, no WIMS source or binaries, no Final Inspection Inbox. The
3D model is original procedural code. All data shown is fictional.

## Items that need a human decision before publishing

These are not technical leaks; they are permission questions only the owner can answer.

1. **Permission to show the WIMS interface.** The screenshots are sanitized,
   but they still show the real layout, wording and check rules of an internal
   tool built during project work. Confirm your employer/client allows showing it.
2. **Description of the work.** The narrative describes the inspection
   workflow in general terms (Final Inspection reports, valve maintenance,
   lock-open/pneumatic/production-choke exclusions). Confirm this is not covered
   by a confidentiality clause.
3. **Report structure.** Scene 02 names the generic sections of a Final
   Inspection form (general information, pressure observation, visual
   inspection, valve maintenance, leak test, handover). Confirm the form layout
   itself is not proprietary.
4. **Year labels.** Screenshots keep generic labels such as “Active 2026” and
   “Year 2026”. No specific real dates remain; remove the years too if the
   campaign period is sensitive.
5. **Personal contact details.** None are included. Add a public contact
   (e.g. LinkedIn) deliberately if wanted — the checker blocks e-mail addresses
   by default.
6. **The local term list** (`.privacy-terms.local.txt`) contains real names by
   design. It is git-ignored; keep it that way and never copy it elsewhere.

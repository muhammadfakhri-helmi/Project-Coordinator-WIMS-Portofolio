# Public repository audit

Date: 2026-09-23 · Audited set: the files staged in this repository
(`git ls-files`), i.e. exactly what the first commit would contain, plus the
production build.

**Result: pass — safe to publish from a data-exposure standpoint**, subject to
the owner permissions listed in `PRIVACY_CHECK.md`.

| Requirement (strict privacy rule) | Tracked files contain it? | How verified |
| --- | --- | --- |
| `.xlsx`, `.xls`, `.xlsm`, `.csv`, `.pdf`, `.docx` | No | `git ls-files` extension filter; checker; `.gitignore` |
| Final Inspection Inbox or any raw report data | No | No such folder or file; checker rejects copied reference folders |
| Contract PDF / any PDF | No | As above |
| Original WIMS source code or binaries | No | Only portfolio code; checker rejects `.exe/.asar/.pak` |
| Original WIMS screenshots | No | Only re-rendered `.webp` derivatives; `.png/.jpg` in the screenshots folder are git-ignored and rejected |
| Client names | No | 39-term local list, `git grep -i -w` → no matches |
| Personnel names | No | Same; crew screenshot uses “Inspector A/B/C” |
| Real well names or codes | No | Same; all wells are `WELL-A07`-style fictional codes |
| Contract numbers | No | Same |
| Internal file names | No | All file names are `SAMPLE FINAL INSPECTION …` |
| OneDrive / private cloud links | No | Pattern scan |
| Local file paths | No | Pattern scan (drive letters, program folders, home dirs, file-scheme URLs) |
| Internal application URLs | No | WIMS's local port and routes are not referenced anywhere |
| Source-report download links | No | The site has no download control; the archive shows “Controlled” and states that originals remain in the internal WIMS environment |
| Secrets, tokens, credentials | No | Pattern scan; no `.env` |

What the repository *does* contain: portfolio source code, original procedural
Three.js model code, eight sanitized screenshot derivatives, fictional
demonstration data, self-hosted open-licensed fonts (via npm at build time),
documentation, a CI workflow, the privacy checker and the screenshot
sanitization tool (which holds only redaction coordinates and fictional
replacement text).

Local-only files present but git-ignored (never committed): `node_modules/`,
`.privacy-terms.local.txt` (real identifiers, used by the checker),
`.claude/` (editor tooling).

Re-run before any future release:

```bash
npm run build
```

```bash
npm run check:dist
```

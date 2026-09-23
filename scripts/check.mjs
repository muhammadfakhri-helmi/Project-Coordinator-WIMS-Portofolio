#!/usr/bin/env node
// Public-repository privacy and hygiene check.
//
//   npm run check          scans the files that would be committed
//   npm run check:dist     also scans the production build in dist/
//
// Fails (exit 1) on: raw documents or data files, original screenshots,
// absolute local paths, private-storage links, secrets, oversized files, and
// any term listed in the optional local file `.privacy-terms.local.txt`
// (git-ignored; one real client / well / personnel identifier per line).
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname, sep } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const withDist = process.argv.includes('--dist');
const SELF = join('scripts', 'check.mjs');

const SKIP_DIRS = new Set(['node_modules', '.git', '.vite', 'coverage', 'audit-local']);
if (!withDist) SKIP_DIRS.add('dist');

const FORBIDDEN_EXT = new Set(['.xlsx', '.xls', '.xlsm', '.csv', '.pdf', '.doc', '.docx', '.zip', '.7z', '.rar', '.db', '.sqlite', '.sqlite3', '.bak', '.psd', '.exe', '.asar', '.pak']);
const TEXT_EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.json', '.html', '.css', '.md', '.txt', '.yml', '.yaml', '.svg', '.py', '.example', '.gitignore', '']);
const MAX_BYTES = 25 * 1024 * 1024;

// Patterns are assembled from parts so this file never matches itself.
const drive = '[A-Za-z]:' + '[\\\\/]' + '(?:Users|Download|Documents|Program|OneDrive|Antigravity)';
const PATTERNS = [
  ['absolute Windows path', new RegExp(drive, 'i')],
  ['file URL', new RegExp('file:' + '///', 'i')],
  ['local program path', new RegExp('Program ' + 'Files', 'i')],
  ['home-directory path', new RegExp('/(?:home|Users)/' + '[a-z0-9._-]+/', 'i')],
  ['OneDrive / SharePoint link', new RegExp('(?:1drv\\.ms|sharepoint\\.com|onedrive\\.live)', 'i')],
  ['private key', new RegExp('-----BEGIN [A-Z ]*PRIVATE ' + 'KEY-----')],
  ['AWS access key', new RegExp('AKIA' + '[0-9A-Z]{16}')],
  ['GitHub token', new RegExp('gh[pousr]_' + '[A-Za-z0-9]{30,}')],
  ['API secret key', new RegExp('\\bsk-' + '[A-Za-z0-9_-]{20,}')],
  ['Google API key', new RegExp('AIza' + '[0-9A-Za-z_-]{35}')],
  ['credential assignment', new RegExp('(?:password|passwd|secret|api[_-]?key|token)\\s*[:=]\\s*["\'][^"\'\\s]{8,}["\']', 'i')],
  ['email address', new RegExp('[A-Za-z0-9._%+-]+@' + '[A-Za-z0-9.-]+\\.[A-Za-z]{2,}')],
];
// localhost is fine in docs and tooling, never in shipped code
const LOCALHOST = new RegExp('localhost|127\\.0\\.0\\.1');

function loadTerms() {
  const file = process.env.PRIVACY_TERMS_FILE || join(ROOT, '.privacy-terms.local.txt');
  if (!existsSync(file)) return { file: null, terms: [] };
  const terms = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  return { file, terms };
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.profile')) walk(join(dir, entry.name), out);
    } else out.push(join(dir, entry.name));
  }
  return out;
}

function ignoredByGit(files) {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: ROOT, stdio: 'ignore' });
  } catch {
    return new Set();
  }
  const rel = files.map((f) => relative(ROOT, f).split(sep).join('/'));
  try {
    const out = execSync('git check-ignore --stdin', { cwd: ROOT, input: rel.join('\n'), encoding: 'utf8' });
    return new Set(out.split(/\r?\n/).filter(Boolean));
  } catch {
    return new Set(); // exit 1 = nothing ignored
  }
}

const { file: termsFile, terms } = loadTerms();
const termRes = terms.map((t) => [t, new RegExp(`(^|[^A-Za-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9])`, 'i')]);

const all = walk(ROOT);
const ignored = ignoredByGit(all);
const problems = [];
let scanned = 0;

for (const abs of all) {
  const rel = relative(ROOT, abs).split(sep).join('/');
  const inDist = rel.startsWith('dist/');
  if (!inDist && ignored.has(rel)) continue; // not publishable, so not our concern
  if (termsFile && abs === termsFile) continue; // the local term list itself
  const ext = extname(abs).toLowerCase();
  const size = statSync(abs).size;
  scanned++;

  if (FORBIDDEN_EXT.has(ext)) problems.push([rel, `forbidden file type ${ext}`]);
  if (size > MAX_BYTES) problems.push([rel, `file is ${(size / 1048576).toFixed(1)} MB (limit 25 MB)`]);
  if (/public\/assets\/screenshots\/.*\.(png|jpe?g)$/i.test(rel)) problems.push([rel, 'original-format screenshot; only sanitized .webp derivatives are allowed']);
  if (/(^|\/)\d{2}_[a-z_]+\.png$/i.test(rel)) problems.push([rel, 'file name matches an original WIMS screenshot']);
  if (/^(0[1-6]_[A-Z_]+|Final Inspection Inbox)(\/|$)/.test(rel)) problems.push([rel, 'reference folder copied into the repository']);

  const isText = TEXT_EXT.has(ext) || rel.endsWith('.gitignore') || rel.endsWith('.nvmrc');
  if (!isText || rel === SELF.split(sep).join('/')) continue;
  const text = readFileSync(abs, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const [label, re] of PATTERNS) if (re.test(line)) problems.push([`${rel}:${i + 1}`, label]);
    for (const [term, re] of termRes) if (re.test(line)) problems.push([`${rel}:${i + 1}`, `sensitive term "${term}"`]);
    const shipped = rel.startsWith('src/') || inDist || rel === 'index.html';
    if (shipped && LOCALHOST.test(line)) problems.push([`${rel}:${i + 1}`, 'localhost reference in shipped code']);
  });
}

if (withDist && !existsSync(join(ROOT, 'dist'))) problems.push(['dist/', 'missing — run npm run build first']);

console.log(`Privacy check: scanned ${scanned} publishable file(s)${withDist ? ' including dist/' : ''}.`);
console.log(termsFile ? `Sensitive-term list: ${terms.length} term(s) from the local, git-ignored list.` : 'Sensitive-term list: not found (optional). Generic checks only.');
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const [where, what] of problems) console.error(`  ✗ ${where} — ${what}`);
  process.exit(1);
}
console.log('✓ No raw documents, original screenshots, absolute paths, private links, secrets or listed identifiers found.');

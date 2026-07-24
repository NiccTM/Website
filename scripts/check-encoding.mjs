#!/usr/bin/env node
/**
 * Guards against mojibake -- UTF-8 bytes that were decoded as Windows-1252 and
 * then re-saved as UTF-8, turning "μᵣ" into "Î¼áµ£" and "°C" into "Â°C".
 *
 * Detection: take each run of non-ASCII characters, map it back to the raw
 * cp1252 bytes it would have come from, and try to decode those bytes as
 * strict UTF-8. If that succeeds, the run was almost certainly mojibake --
 * legitimate text (μ, →, ─) either has no cp1252 byte or decodes as invalid
 * UTF-8, so it is left alone.
 *
 * Usage:  node scripts/check-encoding.mjs [--fix]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const FIX = process.argv.includes('--fix');

const EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.md', '.txt', '.xml', '.svg']);
// Dotfiles have no extension as far as path.extname is concerned, so they need
// an explicit allowlist -- .gitignore had mojibake that an ext-only scan missed.
const EXTLESS = new Set([
  '.gitignore', '.gitattributes', '.editorconfig', '.npmrc', '.nvmrc',
  '.env.example', '.prettierrc', '.eslintrc', 'LICENSE', 'Dockerfile',
]);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.vercel', '.next']);
// Never read real secrets, and never rewrite a lockfile.
const SKIP_FILES = new Set(['package-lock.json', '.env', '.env.local']);

const isScannable = (name) =>
  !SKIP_FILES.has(name) && (EXTS.has(extname(name).toLowerCase()) || EXTLESS.has(name));

// cp1252 differs from latin1 only in 0x80-0x9F, which map to these code points.
const CP1252_HIGH = [
  0x20ac, 0x0081, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021,
  0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x008d, 0x017d, 0x008f,
  0x0090, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x009d, 0x017e, 0x0178,
];
const TO_BYTE = new Map(CP1252_HIGH.map((cp, i) => [cp, 0x80 + i]));
for (let b = 0xa0; b <= 0xff; b++) TO_BYTE.set(b, b); // 0xA0-0xFF are identity

const strict = new TextDecoder('utf-8', { fatal: true });

/** Returns { text, hits } where hits describes each repaired run. */
function repair(text) {
  const hits = [];
  const out = text.replace(/[^\x00-\x7F]+/gu, (run) => {
    const bytes = [];
    for (const ch of run) {
      const b = TO_BYTE.get(ch.codePointAt(0));
      if (b === undefined) return run; // not a raw cp1252 byte -> genuine text
      bytes.push(b);
    }
    let decoded;
    try {
      decoded = strict.decode(new Uint8Array(bytes));
    } catch {
      return run; // not valid UTF-8 -> genuine text
    }
    if (decoded === run || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(decoded)) return run;
    hits.push({ from: run, to: decoded });
    return decoded;
  });
  return { text: out, hits };
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (!SKIP_DIRS.has(name)) yield* walk(p);
    } else if (isScannable(name)) {
      yield p;
    }
  }
}

let bad = 0;
for (const file of walk(ROOT)) {
  const buf = readFileSync(file);
  let text;
  try {
    text = strict.decode(buf);
  } catch {
    console.error(`✗ ${relative(ROOT, file)} -- not valid UTF-8`);
    bad++;
    continue;
  }
  const { text: fixed, hits } = repair(text);
  if (!hits.length) continue;

  bad++;
  console.error(`✗ ${relative(ROOT, file)} -- ${hits.length} mojibake sequence(s)`);
  const seen = new Map();
  for (const h of hits) seen.set(h.from, (seen.get(h.from) ?? 0) + 1);
  for (const [from, n] of seen) {
    console.error(`    x${n}  ${JSON.stringify(from)} -> ${JSON.stringify(repair(from).text)}`);
  }
  if (FIX) writeFileSync(file, fixed, 'utf8');
}

if (bad === 0) {
  console.log('✓ encoding clean -- no mojibake found');
  process.exit(0);
}
console.error(
  FIX
    ? `\nRepaired ${bad} file(s). Review the diff before committing.`
    : `\n${bad} file(s) affected. Re-run with --fix to repair.`,
);
process.exit(FIX ? 0 : 1);

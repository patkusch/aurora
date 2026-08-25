/**
 * The corpus exists twice: once in src/data/corpus.ts for the web app, and
 * again inline in analyse.js for the CLI. If they drift, the two produce
 * citations with different line numbers for the same requirement — which
 * silently breaks the one guarantee this project makes.
 *
 * This fails the build if they stop matching.
 */
import fs from 'node:fs';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// Both files declare `const CORPUS_FILES = { 'name': `content`, ... }`.
function extract(source, label) {
  const start = source.indexOf('CORPUS_FILES');
  if (start === -1) throw new Error(`No CORPUS_FILES found in ${label}`);
  const block = source.slice(start, source.indexOf('\n};', start));
  const files = {};
  // No trailing lookahead: the final entry in the block has nothing after its
  // closing backtick, and requiring a delimiter silently drops it.
  const re = /'([^']+)':\s*(?:\{[\s\S]*?content:\s*)?`([\s\S]*?)`/g;
  let m;
  while ((m = re.exec(block))) files[m[1]] = m[2];
  return files;
}

const app = extract(read('src/data/corpus.ts'), 'src/data/corpus.ts');
const cli = extract(read('analyse.js'), 'analyse.js');

const names = [...new Set([...Object.keys(app), ...Object.keys(cli)])].sort();
const problems = [];

if (!names.length) problems.push('Extracted zero corpus files — the check itself is broken.');

for (const name of names) {
  if (!(name in app)) { problems.push(`${name}: present in analyse.js, missing from the app corpus`); continue; }
  if (!(name in cli)) { problems.push(`${name}: present in the app corpus, missing from analyse.js`); continue; }
  if (app[name] === cli[name]) continue;

  const a = app[name].split('\n');
  const c = cli[name].split('\n');
  const firstDiff = Array.from({ length: Math.max(a.length, c.length) })
    .findIndex((_, i) => a[i] !== c[i]);
  problems.push(
    `${name}: differs (app ${a.length} lines, cli ${c.length} lines), first difference at line ${firstDiff + 1}\n` +
    `      app: ${JSON.stringify((a[firstDiff] ?? '').slice(0, 80))}\n` +
    `      cli: ${JSON.stringify((c[firstDiff] ?? '').slice(0, 80))}`
  );
}

if (problems.length) {
  console.error('Corpus drift between src/data/corpus.ts and analyse.js:\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nLine numbers are the provenance mechanism. Both copies must match exactly.');
  process.exit(1);
}

console.log(`Corpus in sync across app and CLI — ${names.length} files, ${names.map(n => app[n].split('\n').length).reduce((x, y) => x + y, 0)} lines.`);

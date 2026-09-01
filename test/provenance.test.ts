import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  CORPUS_FILES,
  SAMPLE_RESULTS,
  getPrefixedCorpus,
  verifyCitationAgainstSource,
  verifyRequirementSource,
} from '../src/data/corpus.ts';
import type { Citation, Requirement } from '../src/types/index.ts';

/**
 * Aurora's one load-bearing claim is that a finding is cited to a real file and a
 * real line, and that the citation is checked in code rather than taken on the
 * model's word. The README says so and a badge repeats it.
 *
 * That makes the verifier the only place in this repo where a bug is actively
 * dishonest: a permissive check still renders a green tick next to a quote nobody
 * wrote. So these tests are mostly attempts to get a fabricated citation past it.
 */

const citation = (p: Partial<Citation>): Citation =>
  ({ file: Object.keys(CORPUS_FILES)[0], line: 1, verbatim_excerpt: '', ...p }) as Citation;

/** Every (file, line, text) triple that actually exists in the corpus. */
function everyCorpusLine(): { file: string; line: number; text: string }[] {
  const out: { file: string; line: number; text: string }[] = [];
  for (const [file, f] of Object.entries(CORPUS_FILES)) {
    f.content.split('\n').forEach((text, i) => out.push({ file, line: i + 1, text }));
  }
  return out;
}

describe('verifyCitationAgainstSource — rejecting fabrication', () => {
  test('a citation to a file that does not exist is rejected', () => {
    const r = verifyCitationAgainstSource(
      citation({ file: 'FDS-INVENTED-99_Does_Not_Exist.md', line: 1, verbatim_excerpt: 'anything' }),
    );
    assert.equal(r.verified, false);
  });

  test('a citation past the end of a real file is rejected', () => {
    const [file, f] = Object.entries(CORPUS_FILES)[0];
    const past = f.content.split('\n').length + 1;
    assert.equal(verifyCitationAgainstSource(citation({ file, line: past, verbatim_excerpt: 'x' })).verified, false);
  });

  test('line 0 and negative lines are rejected', () => {
    const file = Object.keys(CORPUS_FILES)[0];
    for (const line of [0, -1, -999]) {
      assert.equal(verifyCitationAgainstSource(citation({ file, line, verbatim_excerpt: 'x' })).verified, false);
    }
  });

  test('an excerpt that is not on the cited line is rejected', () => {
    const real = everyCorpusLine().find((l) => l.text.trim().length > 40)!;
    const r = verifyCitationAgainstSource(
      citation({
        file: real.file,
        line: real.line,
        verbatim_excerpt: 'the system shall immediately delete all patient records without confirmation',
      }),
    );
    assert.equal(r.verified, false);
  });

  /**
   * The bug this suite was written to catch.
   *
   * The check is containment in *either* direction, and the corpus is markdown —
   * mostly blank lines. `"".includes(x)` is false, but `x.includes("")` is true,
   * so every fabricated quote aimed at a blank line came back verified.
   */
  test('a fabricated quote against a blank corpus line is rejected', () => {
    const blanks = everyCorpusLine().filter((l) => l.text.trim() === '');
    assert.ok(blanks.length > 0, 'precondition: the corpus should contain blank lines');

    for (const b of blanks) {
      const r = verifyCitationAgainstSource(
        citation({
          file: b.file,
          line: b.line,
          verbatim_excerpt: 'All allergy records shall be permanently destroyed at go-live.',
        }),
      );
      assert.equal(r.verified, false, `a fabricated quote verified against blank line ${b.file}:${b.line}`);
    }
  });

  test('an empty excerpt never verifies, on any line of the corpus', () => {
    // The mirror of the same flaw: `anything.includes("")` is true, so an empty
    // excerpt would have verified against every line in the corpus.
    for (const l of everyCorpusLine()) {
      for (const excerpt of ['', '   ', '\t\n']) {
        const r = verifyCitationAgainstSource(citation({ file: l.file, line: l.line, verbatim_excerpt: excerpt }));
        assert.equal(r.verified, false, `empty excerpt verified against ${l.file}:${l.line}`);
      }
    }
  });

  test('no single fabricated quote verifies anywhere in the corpus', () => {
    // The strongest form of the guarantee: sweep the invented sentence across
    // every line of every file and assert it is rejected by all of them.
    const invented = 'Clinicians shall be permitted to prescribe without reviewing allergy status.';
    const passed = everyCorpusLine().filter(
      (l) => verifyCitationAgainstSource(citation({ file: l.file, line: l.line, verbatim_excerpt: invented })).verified,
    );
    assert.deepEqual(passed, [], `fabricated quote verified at ${passed.length} location(s)`);
  });
});

describe('verifyCitationAgainstSource — accepting the truth', () => {
  test('every non-blank line in the corpus verifies against itself', () => {
    const failures = everyCorpusLine()
      .filter((l) => l.text.trim() !== '')
      .filter((l) => !verifyCitationAgainstSource(citation({ file: l.file, line: l.line, verbatim_excerpt: l.text })).verified);
    assert.deepEqual(failures.map((f) => `${f.file}:${f.line}`), [], 'a real corpus line failed to verify against itself');
  });

  test('a genuine partial quote of a line verifies', () => {
    const long = everyCorpusLine().find((l) => l.text.trim().length > 60)!;
    const middle = long.text.trim().slice(10, 45);
    assert.equal(
      verifyCitationAgainstSource(citation({ file: long.file, line: long.line, verbatim_excerpt: middle })).verified,
      true,
    );
  });

  test('case and surrounding whitespace do not affect the verdict', () => {
    const l = everyCorpusLine().find((x) => x.text.trim().length > 30)!;
    const t = l.text.trim();
    for (const variant of [t.toUpperCase(), t.toLowerCase(), `   ${t}   `]) {
      assert.equal(
        verifyCitationAgainstSource(citation({ file: l.file, line: l.line, verbatim_excerpt: variant })).verified,
        true,
        `variant failed: ${JSON.stringify(variant.slice(0, 30))}`,
      );
    }
  });

  test('the actual line text is returned so a rejection can be diagnosed', () => {
    const l = everyCorpusLine().find((x) => x.text.trim().length > 30)!;
    const r = verifyCitationAgainstSource(citation({ file: l.file, line: l.line, verbatim_excerpt: 'not on this line at all' }));
    assert.equal(r.verified, false);
    assert.equal(r.actualLineText, l.text);
  });
});

describe('getPrefixedCorpus — what the model is shown must match what the verifier checks', () => {
  /**
   * The model cites against `file:line| text`. If that numbering ever disagreed
   * with the verifier's, every citation would be silently off by one — and the
   * verifier would reject correct quotes while accepting shifted ones.
   */
  test('every prefixed line round-trips through the verifier', () => {
    const failures: string[] = [];
    for (const row of getPrefixedCorpus().split('\n')) {
      const m = row.match(/^(.+?):(\d+)\| ?(.*)$/);
      if (!m) {
        failures.push(`unparseable prefix row: ${row.slice(0, 60)}`);
        continue;
      }
      const [, file, lineStr, text] = m;
      if (text.trim() === '') continue; // blank lines are deliberately unciteable
      if (!verifyCitationAgainstSource(citation({ file, line: Number(lineStr), verbatim_excerpt: text })).verified) {
        failures.push(`${file}:${lineStr}`);
      }
    }
    assert.deepEqual(failures, [], 'prefixed corpus disagrees with the verifier');
  });

  test('line numbers start at 1 for every file', () => {
    for (const file of Object.keys(CORPUS_FILES)) {
      assert.ok(
        getPrefixedCorpus().includes(`${file}:1|`),
        `${file} has no line 1 — numbering is off by one somewhere`,
      );
    }
  });

  test('every file in the corpus appears in the prefixed output', () => {
    const prefixed = getPrefixedCorpus();
    for (const file of Object.keys(CORPUS_FILES)) {
      assert.ok(prefixed.includes(`${file}:`), `${file} is missing from what the model is shown`);
    }
  });
});

describe('verifyRequirementSource', () => {
  const req = (p: Partial<Requirement>): Requirement =>
    ({ id: 'X-01', text: 't', source_file: Object.keys(CORPUS_FILES)[0], source_line: 1, ...p }) as Requirement;

  test('an invented filename is rejected', () => {
    assert.equal(verifyRequirementSource(req({ source_file: 'FDS-NOPE.md' })), false);
  });

  test('a line past the end of the file is rejected', () => {
    const [file, f] = Object.entries(CORPUS_FILES)[0];
    assert.equal(verifyRequirementSource(req({ source_file: file, source_line: f.content.split('\n').length + 1 })), false);
  });

  test('non-integer and out-of-range line numbers are rejected', () => {
    for (const source_line of [0, -3, 1.5, NaN, Infinity]) {
      assert.equal(verifyRequirementSource(req({ source_line })), false, `accepted line ${source_line}`);
    }
  });

  test('a real file and a real line is accepted', () => {
    assert.equal(verifyRequirementSource(req({ source_line: 1 })), true);
  });
});

describe('SAMPLE_RESULTS — the demo shown on load must itself be true', () => {
  /**
   * The app opens showing a previous run, so it is never a blank screen. That
   * pre-baked result is what a first-time visitor and every screenshot shows —
   * if its citations do not verify, the demo is asserting something false.
   */
  test('every sample citation verifies against the real corpus', () => {
    const bad: string[] = [];
    for (const f of SAMPLE_RESULTS.findings ?? []) {
      for (const c of f.citations ?? []) {
        if (!verifyCitationAgainstSource(c).verified) bad.push(`${f.id ?? '?'} → ${c.file}:${c.line}`);
      }
    }
    assert.deepEqual(bad, [], 'the pre-baked demo ships citations that do not verify');
  });

  test('every sample requirement points at a real file and line', () => {
    const bad = (SAMPLE_RESULTS.requirements ?? [])
      .filter((r) => !verifyRequirementSource(r))
      .map((r) => `${r.id} → ${r.source_file}:${r.source_line}`);
    assert.deepEqual(bad, [], 'the pre-baked demo ships requirements with unresolvable provenance');
  });

  test('the sample verified/rejected counts match what the verifier actually returns', () => {
    // These numbers are displayed in the UI. They must be recomputed truths, not
    // remembered ones.
    const all = (SAMPLE_RESULTS.findings ?? []).flatMap((f) => f.citations ?? []);
    const verified = all.filter((c) => verifyCitationAgainstSource(c).verified).length;
    assert.equal(
      verified,
      SAMPLE_RESULTS.citations_verified,
      `header claims ${SAMPLE_RESULTS.citations_verified} verified citations, verifier finds ${verified}`,
    );
    assert.equal(all.length - verified, SAMPLE_RESULTS.citations_rejected);
  });

  test('every finding cites at least one source', () => {
    const uncited = (SAMPLE_RESULTS.findings ?? []).filter((f) => !f.citations?.length).map((f) => f.id ?? '?');
    assert.deepEqual(uncited, [], 'a finding with no citation is an assertion, not evidence');
  });
});

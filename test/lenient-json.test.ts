import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

import { buildPass1Prompt, contextWindowFor, parseLenientJson } from '../src/services/localExtraction.ts';

/**
 * Local models wrap their JSON in fences, apologies and chatter. This reader has to get the data
 * out when it can, and hand back the caller's fallback (never throw) when it cannot.
 */
describe('parseLenientJson', () => {
  let errors: ReturnType<typeof mock.method>;
  beforeEach(() => {
    errors = mock.method(console, 'error', () => {});
  });
  afterEach(() => errors.mock.restore());

  const FALLBACK = { fallback: true };

  test('plain JSON is read as it is, arrays and objects alike', () => {
    assert.deepEqual(parseLenientJson('[1, 2, 3]', FALLBACK), [1, 2, 3]);
    assert.deepEqual(parseLenientJson('{"a": 1}', FALLBACK), { a: 1 });
    assert.deepEqual(parseLenientJson('  \n[{"id":"R1"}]\n ', FALLBACK), [{ id: 'R1' }]);
  });

  test('a code fence is removed, with or without the word json, in any case', () => {
    assert.deepEqual(parseLenientJson('```json\n[{"id":"R1"}]\n```', FALLBACK), [{ id: 'R1' }]);
    assert.deepEqual(parseLenientJson('```\n{"a":1}\n```', FALLBACK), { a: 1 });
    assert.deepEqual(parseLenientJson('```JSON\n[1]\n```', FALLBACK), [1]);
  });

  test('prose around the data is cut away: the outermost array or object wins', () => {
    assert.deepEqual(parseLenientJson('Sure! Here you go: [{"id":"R1"},{"id":"R2"}] Hope that helps.', FALLBACK), [{ id: 'R1' }, { id: 'R2' }]);
    assert.deepEqual(parseLenientJson('The result is {"a": {"b": 2}} as asked.', FALLBACK), { a: { b: 2 } });
  });

  test('whichever of [ or { comes first decides what is cut out', () => {
    assert.deepEqual(parseLenientJson('Reqs: [{"id":"R1"}] and a note {x}', FALLBACK), [{ id: 'R1' }], 'the array starts first, so the braces after it are ignored');
    assert.deepEqual(parseLenientJson('Note {"k": [1, 2]} done', FALLBACK), { k: [1, 2] });
  });

  test('anything unreadable gives back the fallback instead of throwing', () => {
    assert.equal(parseLenientJson('', FALLBACK), FALLBACK);
    assert.equal(parseLenientJson('I cannot help with that.', FALLBACK), FALLBACK);
    assert.equal(parseLenientJson('[unclosed', FALLBACK), FALLBACK);
    assert.equal(parseLenientJson('} backwards {', FALLBACK), FALLBACK);
    assert.equal(parseLenientJson('[1, 2,, 3]', FALLBACK), FALLBACK);
  });

  test('a reply that was cut off mid-array is not guessed at', () => {
    assert.deepEqual(parseLenientJson('[{"id":"R1","text":"a"},{"id":"R2","te', [] as unknown[]), []);
  });

  test('the failure is logged so it can be diagnosed, once per bad reply', () => {
    parseLenientJson('[1, 2,, 3]', null);
    assert.equal(errors.mock.callCount(), 1);
    assert.match(String(errors.mock.calls[0].arguments[0]), /Failed to parse JSON response leniently/);
    parseLenientJson('[1, 2, 3]', null);
    assert.equal(errors.mock.callCount(), 1, 'good input logs nothing');
  });
});

describe('the Pass 1 prompt and window', () => {
  test('the prompt carries the corpus lines and names every field wanted back', () => {
    const p = buildPass1Prompt('[A:1] one\n[A:2] two');
    assert.ok(p.includes('[A:1] one\n[A:2] two'));
    for (const field of ['id', 'text', 'source_file', 'source_line', 'author', 'date', 'status', 'workstream']) assert.ok(p.includes(field), field);
  });

  test('the window starts at 8192, only ever doubles, and always leaves room for the reply', () => {
    assert.equal(contextWindowFor(''), 8192, 'an empty prompt needs only the 8192 reserved for the reply');
    assert.equal(contextWindowFor('xx'), 16384, 'one token over that, and the window doubles');
    for (const length of [0, 100, 5000, 20000, 100000, 400000]) {
      const w = contextWindowFor('x'.repeat(length));
      assert.ok(w >= Math.ceil(length / 2) + 8192, `${length}`);
      assert.equal(Math.log2(w), Math.round(Math.log2(w)), `${w} is a power of two`);
    }
  });
});

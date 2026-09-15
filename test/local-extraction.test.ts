import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_LOCAL_MODEL,
  buildOllamaRequest,
  localModelName,
  readOllamaResult,
} from '../src/services/localExtraction.ts';
import { getPrefixedCorpus, verifyRequirementSource } from '../src/data/corpus.ts';

/**
 * The local Gemma path for Pass 1. Its first real run (gemma3 4B, Ollama 0.33.3)
 * failed three ways, all silently: the hardcoded model was not installed, the
 * default 4096-token window cut the corpus in half, and string line numbers
 * failed every provenance check. These tests pin each of those.
 */

describe('local model selection', () => {
  test('defaults to the tag the submitted build used', () => {
    assert.equal(localModelName({}), DEFAULT_LOCAL_MODEL);
    assert.equal(localModelName({ AURORA_GEMMA_MODEL: '   ' }), DEFAULT_LOCAL_MODEL);
  });

  test('AURORA_GEMMA_MODEL picks the model', () => {
    assert.equal(localModelName({ AURORA_GEMMA_MODEL: 'gemma3' }), 'gemma3');
    assert.equal(buildOllamaRequest('x', 'gemma3').model, 'gemma3');
  });
});

describe('context window', () => {
  test('the demo corpus fits, with room for the reply', () => {
    const req = buildOllamaRequest(getPrefixedCorpus(), 'gemma3');
    // Ollama's default is 4096; the demo prompt measured 4,691 tokens.
    assert.ok(req.options.num_ctx > 4096, `num_ctx ${req.options.num_ctx} would truncate the corpus`);
    // Generous upper bound on prompt tokens (2 chars each), plus a reply.
    assert.ok(req.options.num_ctx >= Math.ceil(req.prompt.length / 2) + 4096);
    assert.ok(req.prompt.includes(getPrefixedCorpus()), 'the whole corpus is in the prompt');
  });

  test('a bigger corpus gets a bigger window', () => {
    const small = buildOllamaRequest('a\n'.repeat(100), 'm').options.num_ctx;
    const big = buildOllamaRequest('a'.repeat(200_000), 'm').options.num_ctx;
    assert.ok(big > small);
    assert.ok(big >= 100_000 + 8192);
  });
});

describe('reading the Ollama reply', () => {
  test('a model that is not installed falls back with a warning that says how to fix it', () => {
    const r = readOllamaResult(404, { error: "model 'gemma4' not found" }, 'gemma4');
    assert.deepEqual(r.requirements, []);
    assert.match(r.warning ?? '', /gemma4/);
    assert.match(r.warning ?? '', /ollama pull gemma4/);
    assert.match(r.warning ?? '', /AURORA_GEMMA_MODEL/);
  });

  test('a reply cut off by the context limit is not used', () => {
    const r = readOllamaResult(200, { done_reason: 'length', response: '```json\n[{"id":"R1"' }, 'gemma3');
    assert.deepEqual(r.requirements, []);
    assert.match(r.warning ?? '', /cut off/);
  });

  test('an unreadable reply falls back with a warning', () => {
    const r = readOllamaResult(200, { done_reason: 'stop', response: 'Sorry, I cannot help.' }, 'gemma3');
    assert.deepEqual(r.requirements, []);
    assert.match(r.warning ?? '', /no requirements/);
  });

  test('line numbers written as text are read as numbers, so the verifier can accept them', () => {
    const response =
      '```json\n[{"id":"MAP-ROW-06","text":"Severity not migrated","source_file":"DM_Field_Mapping_v7.csv","source_line":"7"}]\n```';
    const r = readOllamaResult(200, { done_reason: 'stop', response }, 'gemma3');
    assert.equal(r.warning, undefined);
    assert.equal(r.requirements.length, 1);
    assert.equal(r.requirements[0].source_line, 7);
    assert.equal(verifyRequirementSource(r.requirements[0]), true);
  });

  test('line numbers that are not whole numbers are left alone for the verifier to reject', () => {
    const response = '[{"id":"X","source_file":"DM_Field_Mapping_v7.csv","source_line":"line 7"}]';
    const r = readOllamaResult(200, { done_reason: 'stop', response }, 'gemma3');
    assert.equal(r.requirements[0].source_line, 'line 7');
    assert.equal(verifyRequirementSource(r.requirements[0]), false);
  });
});

import assert from 'node:assert/strict';
import {normalizeRequestedTerms,buildPrompt} from '../src/onboarding.js';

assert.deepEqual(
  normalizeRequestedTerms('Bedding, duct spacer\nBedding; valve box'),
  ['Bedding','duct spacer','valve box'],
  'batch parsing should split comma/newline/semicolon input and deduplicate case-insensitively'
);
assert.deepEqual(normalizeRequestedTerms('  stub-out  '),['stub-out']);
assert.deepEqual(normalizeRequestedTerms(''),[]);

const prompt=buildPrompt('bedding, duct spacer');
assert.match(prompt,/подключенный GitHub/i,'prompt should explicitly request the connected GitHub integration');
assert.match(prompt,/taiduc1302\/construction-vocabulary-trainer/,'prompt should target the correct repository');
assert.match(prompt,/"bedding"/,'prompt should include the first requested term');
assert.match(prompt,/"duct spacer"/,'prompt should include the second requested term');
assert.match(prompt,/атомар/i,'prompt should require one atomic change');
assert.match(prompt,/My focus list/i,'prompt should preserve learning intent');
assert.match(prompt,/GitHub Actions/i,'prompt should require validation completion');

console.log('Onboarding bridge tests OK: batch parsing, deduplication and repository-aware atomic ChatGPT prompt generation.');

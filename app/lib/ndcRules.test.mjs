import test from 'node:test';
import assert from 'node:assert/strict';
import { buildManualNdc, validateAssignedCodes } from './ndcRules.mjs';

test('buildManualNdc formats assigned product and package codes', () => {
  assert.equal(buildManualNdc('70095', '001', '02'), '70095-001-02');
});

test('validateAssignedCodes rejects duplicate NDCs', () => {
  const existing = ['70095-001-02', '70095-001-03'];
  const result = validateAssignedCodes(existing, '70095', '001', '02');

  assert.equal(result.isValid, false);
  assert.match(result.message, /already exists/i);
});

test('validateAssignedCodes accepts unique NDCs', () => {
  const existing = ['70095-001-02', '70095-001-03'];
  const result = validateAssignedCodes(existing, '70095', '001', '04');

  assert.equal(result.isValid, true);
  assert.equal(result.ndc, '70095-001-04');
});

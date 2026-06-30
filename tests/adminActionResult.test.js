import test from 'node:test';
import assert from 'node:assert/strict';
import { errorToAdminActionResult, normalizeAdminActionResult, summarizeActionCounts } from '../src/lib/adminActionResult.js';

test('normalizes successful action result', () => {
  const result = normalizeAdminActionResult({ action: 'Example', success: true, affected: 3, failed: 0, skipped: 1 });
  assert.equal(result.status, 'success');
  assert.equal(result.affected, 3);
  assert.equal(result.skipped, 1);
});

test('normalizes partial result when failures are present', () => {
  const result = normalizeAdminActionResult({ action: 'Example', success: true, affected: 5, failed: 2 });
  assert.equal(result.status, 'partial');
  assert.equal(result.failed, 2);
});

test('normalizes error result with retry guidance', () => {
  const result = errorToAdminActionResult('Example', new Error('boom'));
  assert.equal(result.status, 'error');
  assert.equal(result.success, false);
  assert.ok(result.retry.includes('Refresh'));
});

test('summarizes action counts', () => {
  const text = summarizeActionCounts({ affected: 4, skipped: 1, failed: 0 });
  assert.equal(text, 'Affected: 4 · Skipped: 1 · Failed: 0');
});

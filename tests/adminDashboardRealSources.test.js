import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cardsPath = new URL('../src/components/admin/AdminDashboardCards.jsx', import.meta.url);
const dashboardPath = new URL('../src/internal-pages/AdminDashboard.jsx', import.meta.url);
const cards = fs.readFileSync(cardsPath, 'utf8');
const dashboard = fs.readFileSync(dashboardPath, 'utf8');

test('install status is wired to ClientInstallationOS with explicit source labeling', () => {
  assert.match(cards, /base44\.entities\.ClientInstallationOS\.list/);
  assert.match(cards, /Source: ClientInstallationOS/);
  assert.match(cards, /Install status unavailable/);
});

test('estimated lifetime value is never presented as collected revenue proof', () => {
  assert.match(cards, /Estimated LTV/);
  assert.match(cards, />\s*Estimate\s*</);
  assert.match(cards, /Reconcile Stripe subscriptions before treating this as collected revenue proof/);
});

test('churn card remains neutral when no instrumented risk signal exists', () => {
  assert.match(cards, /No numeric churn risk score is available/);
  assert.match(cards, /intentionally neutral until a trusted risk signal exists/);
  assert.match(cards, /wire churn_risk_score from usage, billing, or support signals/);
});

test('overview loads paid orders for revenue and churn evidence cards', () => {
  assert.match(dashboard, /Order\.filter\(\{ payment_status: ["']paid["'] \}/);
  assert.match(dashboard, /<LTVCard orders=\{orders\}/);
  assert.match(dashboard, /<ChurnRiskPanel orders=\{orders\}/);
  assert.match(dashboard, /<InstallStatusTable/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAppleSubscription, fetchAppleSubscription, canSyncAppleProfile } from '../base44/functions/revenueCatSyncTier/subscriptionState.js';
const now = Date.parse('2026-09-24T00:00:00Z');
const future = '2026-10-24T00:00:00Z';
const past = '2026-08-24T00:00:00Z';
function customer(expires = future, extra = {}) {
  return { entitlements: { premium: { expires_date: expires, product_identifier: 'premium_monthly' } }, subscriptions: { premium_monthly: { store: 'app_store', is_sandbox: false, ...extra } } };
}
test('only verified, unexpired Apple subscriptions unlock paid access', () => {
  assert.equal(resolveAppleSubscription(customer(), { now }).subscription_tier, 'premium');
  assert.equal(resolveAppleSubscription(customer(past), { now }).subscription_tier, 'free');
  assert.equal(resolveAppleSubscription(customer(null), { now }).subscription_tier, 'free');
  assert.equal(resolveAppleSubscription(customer(future, { refunded_at: past }), { now }).subscription_tier, 'free');
  assert.equal(resolveAppleSubscription(customer(future, { store: 'stripe' }), { now }).subscription_tier, 'free');
});
test('billing grace periods preserve access; cancelling does not mean expired', () => {
  assert.equal(resolveAppleSubscription(customer(past, { grace_period_expires_date: future }), { now }).subscription_tier, 'premium');
  assert.equal(resolveAppleSubscription(customer(future, { unsubscribe_detected_at: past }), { now }).subscription_tier, 'premium');
});
test('sandbox access is off unless explicitly enabled', () => {
  const data = customer(future, { is_sandbox: true });
  assert.equal(resolveAppleSubscription(data, { now }).subscription_tier, 'free');
  assert.equal(resolveAppleSubscription(data, { now, allowSandbox: true }).subscription_tier, 'premium');
});
test('expired premium falls back to active plus', () => {
  const data = customer(past);
  data.entitlements.plus = { expires_date: future, product_identifier: 'plus_annual' };
  data.subscriptions.plus_annual = { store:'app_store', is_sandbox:false };
  assert.equal(resolveAppleSubscription(data, { now }).subscription_tier, 'supporter');
  assert.equal(resolveAppleSubscription(data, { now }).billing_cycle, 'annual');
});
test('verification errors never become a free-tier response', async () => {
  await assert.rejects(fetchAppleSubscription('a@example.com'), /not configured/);
  await assert.rejects(fetchAppleSubscription('a@example.com', { apiKey:'test', fetcher:async()=>({ ok:false }) }), /unavailable/);
  assert.throws(()=>resolveAppleSubscription({}), /Invalid/);
});
test('Apple sync preserves externally managed paid memberships', () => {
  assert.equal(canSyncAppleProfile({ billing_platform:'stripe' }), false);
  assert.equal(canSyncAppleProfile({ billing_platform:'manual' }), false);
  assert.equal(canSyncAppleProfile({ stripe_subscription_id:'sub_123' }), false);
  assert.equal(canSyncAppleProfile({ billing_platform:'apple' }), true);
});

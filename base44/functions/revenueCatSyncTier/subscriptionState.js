/** Resolve current Apple access from the RevenueCat server response, never client claims. */
export function resolveAppleSubscription(subscriber, { now = Date.now(), allowSandbox = false } = {}) {
  if (!subscriber || !subscriber.entitlements || typeof subscriber.entitlements !== 'object') {
    throw new Error('Invalid subscription response');
  }
  for (const [id, tier] of [['premium', 'premium'], ['plus', 'supporter']]) {
    const entitlement = subscriber.entitlements[id];
    if (!entitlement) continue;
    const subscription = subscriber.subscriptions?.[entitlement.product_identifier];
    // Only this Apple subscription flow can modify Apple access.
    if (!subscription || subscription.store !== 'app_store' || subscription.refunded_at) continue;
    if (typeof subscription.is_sandbox !== 'boolean' || (subscription.is_sandbox && !allowSandbox)) continue;
    const expires = Date.parse(entitlement.expires_date);
    const grace = Date.parse(entitlement.grace_period_expires_date || subscription.grace_period_expires_date);
    const accessUntil = Math.max(Number.isFinite(expires) ? expires : 0, Number.isFinite(grace) ? grace : 0);
    if (accessUntil <= now) continue;
    return {
      subscription_tier: tier,
      billing_platform: 'apple',
      billing_cycle: /annual|year/i.test(entitlement.product_identifier) ? 'annual' : 'monthly',
      renewal_date: new Date(accessUntil).toISOString(),
      trial_ends_at: subscription.period_type === 'trial' ? entitlement.expires_date : null,
    };
  }
  return { subscription_tier: 'free', billing_platform: 'none', renewal_date: null, trial_ends_at: null };
}

export async function fetchAppleSubscription(userId, { apiKey, allowSandbox = false, fetcher = fetch } = {}) {
  if (!apiKey) throw new Error('Subscription verification is not configured');
  const response = await fetcher(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  // An outage or missing customer must not silently remove paid access.
  if (!response.ok) throw new Error('Subscription verification is temporarily unavailable');
  const payload = await response.json();
  return resolveAppleSubscription(payload.subscriber, { allowSandbox });
}

export function canSyncAppleProfile(profile) {
  // Apple sync must never erase an independently managed Stripe or manual membership.
  return !['stripe', 'manual', 'google'].includes(profile.billing_platform) && !profile.stripe_subscription_id;
}

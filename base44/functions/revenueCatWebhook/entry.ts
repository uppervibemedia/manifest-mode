/**
 * RevenueCat server-to-server webhook handler.
 *
 * Setup in RevenueCat Dashboard → Project → Integrations → Webhooks:
 *   URL: <your-function-url>/revenueCatWebhook
 *   Authorization header: set to the value of REVENUECAT_WEBHOOK_SECRET
 *
 * Events handled:
 *   INITIAL_PURCHASE, RENEWAL, PRODUCT_CHANGE → activate tier
 *   CANCELLATION, EXPIRATION, BILLING_ISSUE   → downgrade to free (on expiry)
 *   SUBSCRIBER_ALIAS                           → no-op
 *
 * RevenueCat entitlement identifiers expected:
 *   "plus"    → subscription_tier: "supporter"
 *   "premium" → subscription_tier: "premium"
 *
 * The app_user_id sent by RevenueCat should be set to the user's email
 * when calling Purchases.logIn(userEmail) in the native layer.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ACTIVATE_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'TRIAL_STARTED',
  'TRIAL_CONVERTED',
]);

const DEACTIVATE_EVENTS = new Set([
  'EXPIRATION',
  'SUBSCRIBER_ALIAS', // no-op below
]);

const CANCELLATION_EVENTS = new Set([
  'CANCELLATION',
  'BILLING_ISSUE',
]);

function entitlementToTier(entitlementId) {
  if (entitlementId === 'premium') return 'premium';
  if (entitlementId === 'plus') return 'supporter';
  return null;
}

function resolveHighestTier(entitlements = {}) {
  // In RC webhook payloads, entitlements is a map of { id: { expires_date, product_identifier, ... } }
  // A key being present means it's currently active (RC only sends active entitlements)
  if (entitlements['premium']) return 'premium';
  if (entitlements['plus']) return 'supporter';
  return 'free';
}

function inferBillingCycle(productIdentifier = '') {
  const id = productIdentifier.toLowerCase();
  if (id.includes('annual') || id.includes('yearly') || id.includes('year')) return 'annual';
  return 'monthly';
}

Deno.serve(async (req) => {
  // Verify authorization secret
  const authHeader = req.headers.get('Authorization');
  const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (webhookSecret && authHeader !== webhookSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const base44 = createClientFromRequest(req);

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const event = body?.event;
  if (!event) return Response.json({ received: true });

  const eventType = event.type;
  // app_user_id is set to the user's email by the native layer via Purchases.logIn(email)
  const userEmail = event.app_user_id;

  if (!userEmail) {
    console.warn('RevenueCat webhook: missing app_user_id', eventType);
    return Response.json({ received: true });
  }

  try {
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail });
    if (!profiles[0]) {
      console.warn('RevenueCat webhook: profile not found for', userEmail);
      return Response.json({ received: true });
    }

    const profileId = profiles[0].id;
    let updates = null;

    if (ACTIVATE_EVENTS.has(eventType)) {
      // Resolve tier from active entitlements in the event payload
      const activeEntitlements = event.entitlements || {};
      const tier = resolveHighestTier(activeEntitlements);

      // RC sends expiration_at_ms on the event for the product being activated
      const expiresDate = event.expiration_at_ms
        ? new Date(event.expiration_at_ms).toISOString()
        : null;

      const isTrialing = eventType === 'TRIAL_STARTED';
      // trial_ends_at = expiry of the trial period
      const trialEndsAt = isTrialing ? expiresDate : null;

      // Infer billing cycle from the product identifier on the event
      const billingCycle = inferBillingCycle(event.product_id || '');

      updates = {
        subscription_tier: tier,
        billing_platform: 'apple',
        billing_cycle: billingCycle,
        renewal_date: expiresDate,
        trial_ends_at: trialEndsAt,
        // TRIAL_CONVERTED: clear trial_ends_at since trial became a paid subscription
        ...(eventType === 'TRIAL_CONVERTED' ? { trial_ends_at: null } : {}),
      };

    } else if (DEACTIVATE_EVENTS.has(eventType)) {
      if (eventType === 'SUBSCRIBER_ALIAS') {
        // No action needed
        return Response.json({ received: true });
      }
      updates = {
        subscription_tier: 'free',
        billing_platform: 'none',
        renewal_date: null,
        trial_ends_at: null,
      };

    } else if (CANCELLATION_EVENTS.has(eventType)) {
      // CANCELLATION = user cancelled, but subscription still active until period end
      //   → keep tier active, just update renewal_date to period end
      // BILLING_ISSUE = payment failed, RevenueCat handles grace period
      //   → keep tier active during grace period, webhook fires EXPIRATION when truly over
      const expiresDate = event.expiration_at_ms
        ? new Date(event.expiration_at_ms).toISOString()
        : null;
      const activeEntitlements = event.entitlements || {};
      const tier = resolveHighestTier(activeEntitlements);
      const billingCycle = inferBillingCycle(event.product_id || '');

      updates = {
        subscription_tier: tier,
        billing_platform: 'apple',
        billing_cycle: billingCycle,
        renewal_date: expiresDate,
        // Don't clear trial_ends_at here — it may still be in trial when cancelled
      };
    }
    // NON_RENEWING_PURCHASE: consumable/one-time — not applicable for subscriptions, no-op

    if (updates) {
      await base44.asServiceRole.entities.UserProfile.update(profileId, updates);
      console.log(`RevenueCat webhook: ${eventType} → ${updates.subscription_tier} for ${userEmail}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('RevenueCat webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
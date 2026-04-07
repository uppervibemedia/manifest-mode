/**
 * Called from the frontend after a RevenueCat purchase, restore, or app-launch sync.
 * Updates the authenticated user's UserProfile with the resolved subscription state.
 *
 * Accepts:
 *   tier          — "free" | "supporter" | "premium"
 *   billing_cycle — "monthly" | "annual"  (optional, defaults to "monthly")
 *   renewal_date  — ISO string or null    (optional, Apple-managed expiry date)
 *   rc_user_id    — RevenueCat user ID    (optional, stored for debugging)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const VALID_TIERS = ['free', 'supporter', 'premium'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tier, billing_cycle, renewal_date, rc_user_id } = await req.json();

    if (!VALID_TIERS.includes(tier)) {
      return Response.json({ error: `Invalid tier: ${tier}` }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email });
    if (!profiles[0]) return Response.json({ error: 'Profile not found' }, { status: 404 });

    const isFree = tier === 'free';

    const updates = {
      subscription_tier: tier,
      billing_platform: isFree ? 'none' : 'apple',
      billing_cycle: isFree ? 'monthly' : (billing_cycle || 'monthly'),
      renewal_date: isFree ? null : (renewal_date || null),
    };

    // Clear Stripe fields when Apple takes over
    if (!isFree) {
      updates.stripe_subscription_id = null;
    }

    // Downgrade: also clear trial state
    if (isFree) {
      updates.trial_ends_at = null;
      updates.stripe_subscription_id = null;
    }

    await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, updates);

    return Response.json({ ok: true, tier });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
/**
 * Called from the frontend after a RevenueCat purchase or restore.
 * Updates the authenticated user's UserProfile.subscription_tier.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const VALID_TIERS = ['free', 'supporter', 'premium'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tier, rc_user_id } = await req.json();

    if (!VALID_TIERS.includes(tier)) {
      return Response.json({ error: `Invalid tier: ${tier}` }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email });
    if (!profiles[0]) return Response.json({ error: 'Profile not found' }, { status: 404 });

    const updates = {
      subscription_tier: tier,
      billing_platform: tier === 'free' ? 'none' : 'apple',
    };

    // Clear billing_cycle / renewal_date — Apple manages these server-side
    if (tier === 'free') {
      updates.renewal_date = null;
      updates.stripe_subscription_id = null;
    }

    await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, updates);

    return Response.json({ ok: true, tier });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
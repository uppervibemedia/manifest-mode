import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { canSyncAppleProfile, fetchAppleSubscription } from './subscriptionState.js';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const base44 = createClientFromRequest(req);
  let user;
  try { user = await base44.auth.me(); } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }); }
  if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });
    if (!canSyncAppleProfile(profile)) return Response.json({ ok: true, tier: profile.subscription_tier, unchanged: true });
    // Ignore all submitted tiers, dates and RevenueCat user IDs. The existing native
    // bridge contract uses the authenticated email as the RevenueCat app_user_id.
    const updates = await fetchAppleSubscription(user.email, {
      apiKey: Deno.env.get('REVENUECAT_SECRET_API_KEY'),
      allowSandbox: Deno.env.get('REVENUECAT_ALLOW_SANDBOX') === 'true',
    });
    await base44.asServiceRole.entities.UserProfile.update(profile.id, updates);
    return Response.json({ ok: true, tier: updates.subscription_tier });
  } catch {
    return Response.json({ error: 'Unable to verify your subscription. Please try again.' }, { status: 503 });
  }
});

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { canSyncAppleProfile, fetchAppleSubscription } from '../revenueCatSyncTier/subscriptionState.js';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (!secret) return Response.json({ error: 'Webhook is not configured' }, { status: 503 });
  if (req.headers.get('Authorization') !== secret) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const event = body?.event;
  if (!event?.type) return Response.json({ error: 'Missing event' }, { status: 400 });
  if (event.type === 'TEST') return Response.json({ received: true });
  const ids = [event.app_user_id, ...(event.aliases || []), ...(event.transferred_from || []), ...(event.transferred_to || [])];
  const emails = [...new Set(ids.filter(id => typeof id === 'string' && id.includes('@')))];
  const base44 = createClientFromRequest(req);
  try {
    // Reconcile from current server state so cancellations, retries, transfers and
    // out-of-order webhook events cannot apply an obsolete tier from a payload.
    for (const email of emails) {
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: email });
      const profile = profiles[0];
      if (!profile || !canSyncAppleProfile(profile)) continue;
      const updates = await fetchAppleSubscription(email, {
        apiKey: Deno.env.get('REVENUECAT_SECRET_API_KEY'),
        allowSandbox: Deno.env.get('REVENUECAT_ALLOW_SANDBOX') === 'true',
      });
      await base44.asServiceRole.entities.UserProfile.update(profile.id, updates);
    }
    return Response.json({ received: true });
  } catch {
    // RevenueCat can retry; do not downgrade the user on verification failure.
    return Response.json({ error: 'Subscription verification unavailable' }, { status: 503 });
  }
});

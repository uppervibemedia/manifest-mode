import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({ error: 'Invalid emails array' }, { status: 400 });
    }

    const updated = [];

    for (const email of emails) {
      try {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: email });
        
        if (profiles.length > 0) {
          await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
            subscription_tier: 'premium',
            billing_platform: 'manual',
            renewal_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          });
          updated.push(email);
        }
      } catch (e) {
        console.error(`Error updating ${email}:`, e.message);
      }
    }

    return Response.json({
      success: true,
      updated_count: updated.length,
      updated_emails: updated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

// Opens the Stripe Customer Portal so users can manage/cancel their subscription
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { return_url } = await req.json();

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email });
    const customerId = profiles[0]?.stripe_customer_id;

    if (!customerId) {
      return Response.json({ error: 'No billing account found. Please subscribe first.' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url || `${req.headers.get('origin')}/profile`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
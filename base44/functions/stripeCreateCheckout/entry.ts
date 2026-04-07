import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

// Platform-agnostic price map — swap in Apple/Google product IDs later
const PRICE_IDS = {
  supporter_monthly: Deno.env.get("STRIPE_PRICE_PLUS_MONTHLY"),
  supporter_annual:  Deno.env.get("STRIPE_PRICE_PLUS_ANNUAL"),
  premium_monthly:   Deno.env.get("STRIPE_PRICE_PREMIUM_MONTHLY"),
  premium_annual:    Deno.env.get("STRIPE_PRICE_PREMIUM_ANNUAL"),
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan_id, billing_cycle, success_url, cancel_url } = await req.json();

    const priceKey = `${plan_id}_${billing_cycle}`;
    const priceId = PRICE_IDS[priceKey];

    if (!priceId) {
      return Response.json({ error: `No Stripe price configured for ${priceKey}. Set the STRIPE_PRICE_* environment variables.` }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

    // Look up or create a Stripe customer tied to this user
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email });
    const profile = profiles[0];
    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { user_email: user.email },
      });
      customerId = customer.id;
      if (profile) {
        await base44.asServiceRole.entities.UserProfile.update(profile.id, { stripe_customer_id: customerId });
      }
    }

    // 7-day free trial for Plus monthly only
    const isTrialEligible = plan_id === 'supporter' && billing_cycle === 'monthly';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || `${req.headers.get('origin')}/pricing?success=1`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/pricing?canceled=1`,
      subscription_data: {
        trial_period_days: isTrialEligible ? 7 : undefined,
        metadata: {
          user_email: user.email,
          plan_id,
          billing_cycle,
        },
      },
      metadata: {
        user_email: user.email,
        plan_id,
        billing_cycle,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
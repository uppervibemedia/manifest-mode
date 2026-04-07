import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

// Maps Stripe subscription status + metadata → our internal tier
function resolveTier(planId) {
  if (planId === 'premium') return 'premium';
  if (planId === 'supporter') return 'supporter';
  return 'free';
}

function resolveBillingCycle(interval) {
  return interval === 'year' ? 'annual' : 'monthly';
}

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    switch (event.type) {
      // ── New subscription / checkout completed ─────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;

        const userEmail = session.metadata?.user_email;
        const planId = session.metadata?.plan_id;
        const billingCycle = session.metadata?.billing_cycle;
        if (!userEmail) break;

        // Fetch the subscription to get period end
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const renewalDate = new Date(subscription.current_period_end * 1000).toISOString();
        const isTrialing = subscription.status === 'trialing';
        const trialEndsAt = isTrialing && subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;

        await updateUserSubscription(base44, userEmail, {
          subscription_tier: resolveTier(planId),
          billing_cycle: billingCycle || resolveBillingCycle(subscription.items.data[0]?.price?.recurring?.interval),
          renewal_date: renewalDate,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer,
          billing_platform: 'stripe',
          trial_ends_at: trialEndsAt,
        });
        break;
      }

      // ── Renewal / upgrade / downgrade ─────────────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userEmail = subscription.metadata?.user_email;
        if (!userEmail) break;

        // planId from metadata; fall back to price nickname or product lookup
        const planId = subscription.metadata?.plan_id || resolvePlanFromPrice(subscription.items.data[0]?.price);
        const interval = subscription.items.data[0]?.price?.recurring?.interval;
        const renewalDate = new Date(subscription.current_period_end * 1000).toISOString();
        const tier = resolveTier(planId);

        // Handle cancellation scheduled at period end — keep current tier active until period ends
        if (subscription.cancel_at_period_end) {
          const isTrialing = subscription.status === 'trialing';
          const trialEndsAtCancel = isTrialing && subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null;
          await updateUserSubscription(base44, userEmail, {
            subscription_tier: tier,
            billing_cycle: resolveBillingCycle(interval),
            renewal_date: renewalDate,
            stripe_subscription_id: subscription.id,
            billing_platform: 'stripe',
            trial_ends_at: trialEndsAtCancel,
          });
          break;
        }

        const status = subscription.status;
        // Active or trialing → keep/set tier; past_due/unpaid/canceled → downgrade
        const isActive = ['active', 'trialing'].includes(status);
        const isTrialing = status === 'trialing';
        const trialEndsAt = isTrialing && subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;

        await updateUserSubscription(base44, userEmail, {
          subscription_tier: isActive ? tier : 'free',
          billing_cycle: isActive ? resolveBillingCycle(interval) : 'monthly',
          renewal_date: renewalDate,
          stripe_subscription_id: subscription.id,
          billing_platform: isActive ? 'stripe' : 'none',
          // Clear trial_ends_at when subscription becomes active (trial converted)
          trial_ends_at: isTrialing ? trialEndsAt : null,
        });
        break;
      }

      // ── Cancellation / expiration ──────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userEmail = subscription.metadata?.user_email;
        if (!userEmail) break;

        await updateUserSubscription(base44, userEmail, {
          subscription_tier: 'free',
          billing_cycle: 'monthly',
          renewal_date: null,
          stripe_subscription_id: null,
          billing_platform: 'none',
          trial_ends_at: null,
        });
        break;
      }

      // ── Payment failed ─────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const userEmail = subscription.metadata?.user_email;
        if (!userEmail) break;

        // Don't immediately downgrade on first failure — Stripe will retry.
        // Only downgrade if subscription status is past_due or unpaid.
        if (['past_due', 'unpaid'].includes(subscription.status)) {
          await updateUserSubscription(base44, userEmail, {
            subscription_tier: 'free',
            billing_cycle: 'monthly',
          });
        }
        break;
      }

      default:
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ── Shared helper ─────────────────────────────────────────────────────────────
async function updateUserSubscription(base44, userEmail, updates) {
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail });
  if (!profiles[0]) return;
  await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, updates);
}

// Fallback: derive plan_id from price nickname if metadata is missing
function resolvePlanFromPrice(price) {
  if (!price) return null;
  const nickname = (price.nickname || '').toLowerCase();
  if (nickname.includes('premium')) return 'premium';
  if (nickname.includes('plus') || nickname.includes('supporter')) return 'supporter';
  // Also check lookup_key
  const key = (price.lookup_key || '').toLowerCase();
  if (key.includes('premium')) return 'premium';
  if (key.includes('plus') || key.includes('supporter')) return 'supporter';
  return null;
}
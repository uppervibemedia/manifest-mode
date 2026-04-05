/**
 * Platform-agnostic subscription entitlement engine.
 *
 * The source of truth is UserProfile.subscription_tier (set by whichever
 * billing backend processed the payment — Stripe web, Apple IAP, Google Play).
 *
 * To add Apple IAP or Google Play later:
 *  1. Create a backend function that validates the receipt/purchase token.
 *  2. Call updateUserSubscription() with the resolved tier.
 *  3. That's it — all entitlement checks here continue to work unchanged.
 */

export const TIERS = {
  FREE: 'free',
  PLUS: 'supporter',
  PREMIUM: 'premium',
};

// Feature entitlements per tier
const ENTITLEMENTS = {
  free: {
    vision_limit: 5,
    full_assessment: false,
    score_history: false,
    blueprint_full: false,
    ai_coach: false,
    see_me_vision: false,
    priority_ai: false,
  },
  supporter: {
    vision_limit: 20,
    full_assessment: true,
    score_history: true,
    blueprint_full: false,
    ai_coach: false,
    see_me_vision: false,
    priority_ai: false,
  },
  premium: {
    vision_limit: Infinity,
    full_assessment: true,
    score_history: true,
    blueprint_full: true,
    ai_coach: true,
    see_me_vision: true,
    priority_ai: true,
  },
};

export function getEntitlements(tier) {
  return ENTITLEMENTS[tier] || ENTITLEMENTS.free;
}

export function can(tier, feature) {
  return getEntitlements(tier)[feature] === true;
}

export function visionLimit(tier) {
  return getEntitlements(tier).vision_limit;
}

// Human-readable plan names
export const PLAN_LABELS = {
  free: 'Free',
  supporter: 'Plus',
  premium: 'Premium ✦',
};

// Stripe price env var keys — populated in Dashboard → Settings → Environment Variables
// STRIPE_PRICE_PLUS_MONTHLY, STRIPE_PRICE_PLUS_ANNUAL
// STRIPE_PRICE_PREMIUM_MONTHLY, STRIPE_PRICE_PREMIUM_ANNUAL
export const STRIPE_PLANS = [
  { plan_id: 'supporter', billing_cycle: 'monthly', label: 'Plus Monthly',  price: '$7.99/mo' },
  { plan_id: 'supporter', billing_cycle: 'annual',  label: 'Plus Annual',   price: '$59.99/yr' },
  { plan_id: 'premium',   billing_cycle: 'monthly', label: 'Premium Monthly', price: '$14.99/mo' },
  { plan_id: 'premium',   billing_cycle: 'annual',  label: 'Premium Annual',  price: '$119.99/yr' },
];
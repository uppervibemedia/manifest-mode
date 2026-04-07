/**
 * RevenueCat bridge helpers.
 * Calls the native rcBridge injected by the iOS wrapper and syncs
 * the resulting entitlement back to UserProfile via the backend.
 *
 * Expected window.rcBridge interface (injected by the native Swift layer):
 *
 *   window.rcBridge.getOfferings()
 *     → Promise<{ current: { availablePackages: Array<Package> } }>
 *
 *   window.rcBridge.purchasePackage(packageIdentifier: string)
 *     → Promise<CustomerInfo>
 *
 *   window.rcBridge.getCustomerInfo()
 *     → Promise<CustomerInfo>
 *
 *   window.rcBridge.restorePurchases()
 *     → Promise<CustomerInfo>
 *
 * CustomerInfo shape:
 *   {
 *     userID: string,
 *     entitlements: {
 *       active: Record<string, { isActive: boolean, expirationDate?: string, productIdentifier?: string }>
 *     }
 *   }
 *
 * RevenueCat entitlement identifiers expected:
 *   "plus"    → subscription_tier: "supporter"
 *   "premium" → subscription_tier: "premium"
 *
 * The native layer must call Purchases.logIn(userEmail) so that
 * the app_user_id in RevenueCat matches the user's email for webhook routing.
 */
import { base44 } from "@/api/base44Client";
import { hasRevenueCatBridge } from "@/lib/platform";

/**
 * Map RevenueCat active entitlements → our internal subscription_tier.
 * RevenueCat entitlement IDs: "plus", "premium"
 */
export function entitlementsToTier(activeEntitlements = {}) {
  if (activeEntitlements["premium"]?.isActive) return "premium";
  if (activeEntitlements["plus"]?.isActive) return "supporter";
  return "free";
}

/**
 * Infer billing_cycle from a package identifier or product identifier string.
 * RC standard identifiers: $rc_monthly, $rc_annual, $rc_six_month, $rc_weekly, $rc_lifetime
 * Custom identifiers may contain "monthly", "annual", "yearly"
 */
export function inferBillingCycle(identifier = "") {
  const id = identifier.toLowerCase();
  if (id.includes("annual") || id.includes("yearly") || id.includes("year")) return "annual";
  return "monthly";
}

/**
 * Extract the renewal/expiry date from customer info active entitlements.
 * Returns ISO string or null.
 */
function extractRenewalDate(activeEntitlements = {}) {
  // Prefer premium expiry, then plus
  const ent = activeEntitlements["premium"] || activeEntitlements["plus"];
  if (!ent) return null;
  // RC sends expirationDate as ISO string or null for lifetime
  return ent.expirationDate || null;
}

/**
 * Sync CustomerInfo from the native bridge to the backend.
 * Call this on app launch (iOS) and after login to ensure
 * the UserProfile reflects the current RevenueCat entitlement state.
 *
 * Returns the resolved tier string, or null if no bridge.
 */
export async function syncRevenueCatStatus() {
  if (!hasRevenueCatBridge()) return null;
  const info = await window.rcBridge.getCustomerInfo();
  return _syncCustomerInfo(info);
}

/**
 * Purchase a package by identifier (e.g. "$rc_monthly", "$rc_annual").
 * Returns the resolved tier after purchase.
 * Throws with message "userCancelled" if user cancels.
 */
export async function purchasePackage(packageIdentifier) {
  if (!hasRevenueCatBridge()) throw new Error("No RevenueCat bridge available");
  const result = await window.rcBridge.purchasePackage(packageIdentifier);
  return _syncCustomerInfo(result, packageIdentifier);
}

/**
 * Restore prior purchases and sync the resulting tier.
 * Returns the resolved tier string.
 */
export async function restorePurchases() {
  if (!hasRevenueCatBridge()) throw new Error("No RevenueCat bridge available");
  const result = await window.rcBridge.restorePurchases();
  return _syncCustomerInfo(result);
}

/**
 * Fetch available offerings from the native bridge.
 * Returns an array of packages: [{ identifier, product: { priceString, title } }]
 */
export async function getOfferings() {
  if (!hasRevenueCatBridge()) return [];
  const offerings = await window.rcBridge.getOfferings();
  return offerings?.current?.availablePackages || [];
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Shared sync logic: resolve tier from CustomerInfo and call the backend.
 * @param {object} customerInfo  - RC CustomerInfo object
 * @param {string} [packageIdentifier] - optional, used to infer billing_cycle on purchase
 */
async function _syncCustomerInfo(customerInfo, packageIdentifier) {
  const active = customerInfo?.entitlements?.active || {};
  const tier = entitlementsToTier(active);

  // Infer billing cycle: prefer product identifier from the active entitlement,
  // fall back to the purchased package identifier.
  const productIdentifier =
    active["premium"]?.productIdentifier ||
    active["plus"]?.productIdentifier ||
    packageIdentifier ||
    "";
  const billingCycle = inferBillingCycle(productIdentifier);
  const renewalDate = extractRenewalDate(active);

  await base44.functions.invoke("revenueCatSyncTier", {
    tier,
    billing_cycle: billingCycle,
    renewal_date: renewalDate,
    rc_user_id: customerInfo?.userID,
  });

  return tier;
}
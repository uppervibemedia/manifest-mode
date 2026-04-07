/**
 * RevenueCat bridge helpers.
 * Calls the native rcBridge injected by the iOS wrapper and syncs
 * the resulting entitlement back to UserProfile via the backend.
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
 * Fetch current customer info from the native bridge and sync tier to backend.
 * Returns the resolved tier string.
 */
export async function syncRevenueCatStatus() {
  if (!hasRevenueCatBridge()) return null;
  const info = await window.rcBridge.getCustomerInfo();
  const tier = entitlementsToTier(info?.entitlements?.active);
  await base44.functions.invoke("revenueCatSyncTier", { tier, rc_user_id: info?.userID });
  return tier;
}

/**
 * Purchase a package by identifier (e.g. "$rc_monthly", "$rc_annual").
 * Returns the resolved tier after purchase.
 */
export async function purchasePackage(packageIdentifier) {
  if (!hasRevenueCatBridge()) throw new Error("No RevenueCat bridge available");
  const result = await window.rcBridge.purchasePackage(packageIdentifier);
  const tier = entitlementsToTier(result?.entitlements?.active);
  await base44.functions.invoke("revenueCatSyncTier", { tier, rc_user_id: result?.userID });
  return tier;
}

/**
 * Restore prior purchases and sync the resulting tier.
 */
export async function restorePurchases() {
  if (!hasRevenueCatBridge()) throw new Error("No RevenueCat bridge available");
  const result = await window.rcBridge.restorePurchases();
  const tier = entitlementsToTier(result?.entitlements?.active);
  await base44.functions.invoke("revenueCatSyncTier", { tier });
  return tier;
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
/**
 * Platform detection utilities.
 * Used to gate Stripe (web) vs Apple IAP / RevenueCat (iOS native).
 */

/**
 * Returns true when running inside a WKWebView (iOS native wrapper).
 * WKWebView omits "Safari/" from the UA string.
 */
export function isIOSNative() {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  return isIOS && !/Safari\//.test(ua);
}

/**
 * Returns true when a RevenueCat native bridge is injected by the iOS wrapper.
 * The native app should inject `window.rcBridge` with the methods below.
 */
export function hasRevenueCatBridge() {
  return typeof window !== "undefined" && typeof window.rcBridge !== "undefined";
}

/**
 * Expected window.rcBridge interface (injected by the native Swift/React Native layer):
 *
 *   window.rcBridge.getOfferings()
 *     → Promise<{ current: { availablePackages: Array<{ identifier, product: { priceString, title } }> } }>
 *
 *   window.rcBridge.purchasePackage(packageIdentifier: string)
 *     → Promise<{ entitlements: { active: Record<string, { isActive: boolean }> }, userID: string }>
 *
 *   window.rcBridge.getCustomerInfo()
 *     → Promise<{ entitlements: { active: Record<string, { isActive: boolean }> }, userID: string }>
 *
 *   window.rcBridge.restorePurchases()
 *     → Promise<{ entitlements: { active: Record<string, { isActive: boolean }> } }>
 *
 * RevenueCat entitlement identifiers expected:
 *   "plus"    → maps to subscription_tier: "supporter"
 *   "premium" → maps to subscription_tier: "premium"
 */
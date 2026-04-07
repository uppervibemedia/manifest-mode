/**
 * APP STORE COMPLIANCE NOTICE
 * 
 * Apple App Store Review Guideline 3.1.1:
 * "If you want to unlock features or functionality within your app, you must use
 * in-app purchase. Apps may not use their own mechanisms to unlock content or
 * functionality, such as license keys, augmented reality markers, QR codes, etc."
 *
 * This means Stripe web checkout CANNOT be used for digital subscriptions sold
 * through a native iOS app distributed via the App Store.
 *
 * Required before App Store submission:
 * 1. Implement Apple In-App Purchase (StoreKit 2) for all subscription tiers.
 * 2. The stripeCreateCheckout flow can remain for web/Android users.
 * 3. On iOS (detected via navigator.userAgent or a platform flag), route subscription
 *    purchases through Apple IAP, not Stripe.
 * 4. The webhook/tier sync logic in stripeWebhook should be mirrored for
 *    Apple server-to-server notifications (App Store Server Notifications v2).
 *
 * SHORT-TERM WORKAROUND (for TestFlight / internal testing only):
 * Apps that only allow subscription management via an external web link
 * (not in-app purchase) will be REJECTED by App Review for public distribution.
 *
 * This component renders a notice on the Pricing page when running inside
 * an iOS WebView / native wrapper, directing users to manage subscriptions
 * on the web version instead — which is acceptable ONLY if the app is
 * classified as a "reader app" (content purchased elsewhere). Manifest Mode
 * does NOT qualify as a reader app since subscriptions unlock new functionality.
 *
 * ACTION REQUIRED BEFORE APP STORE SUBMISSION:
 * Integrate react-native-purchases (RevenueCat) or StoreKit 2 directly.
 * RevenueCat is the recommended path — it handles Apple IAP, Google Play,
 * and can sync entitlements back to your UserProfile via webhooks.
 */

import { AlertTriangle } from "lucide-react";

// Detect if running inside a WKWebView / native iOS wrapper
function isIOSWebView() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // WKWebView does not include "Safari" in the UA string
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isWebView = isIOS && !/Safari\//.test(ua);
  return isWebView;
}

export default function AppStorePaymentNotice() {
  if (!isIOSWebView()) return null;

  return (
    <div className="glass-card border border-amber-500/30 rounded-xl p-4 mb-5 flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-foreground mb-1">Subscriptions available on web</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          To subscribe, visit <span className="text-primary font-medium">manifestmode.app</span> in your browser. 
          In-app purchasing is coming soon.
        </p>
      </div>
    </div>
  );
}
/**
 * AppStorePaymentNotice — shown on iOS only when RevenueCat bridge is unavailable
 * (i.e. the native wrapper hasn't been built yet / dev preview mode).
 * Once the native app is shipped with rcBridge, this renders nothing.
 */
import { AlertTriangle } from "lucide-react";
import { isIOSNative, hasRevenueCatBridge } from "@/lib/platform";

export default function AppStorePaymentNotice() {
  // Only show if iOS but bridge not yet available (bridge missing = dev/preview)
  if (!isIOSNative() || hasRevenueCatBridge()) return null;

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
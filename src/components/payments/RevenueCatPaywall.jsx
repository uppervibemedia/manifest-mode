/**
 * iOS in-app purchase paywall using RevenueCat native bridge.
 * Rendered on the Pricing page instead of Stripe buttons when on iOS native.
 *
 * Packages are sorted: Plus Monthly → Plus Annual → Premium Monthly → Premium Annual
 * "Current Plan" badge appears on the specific package matching the active subscription.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Sparkles, Loader2, Check, RefreshCw } from "lucide-react";
import { getOfferings, purchasePackage, restorePurchases, inferBillingCycle } from "@/lib/revenueCatBridge";
import { useUserProfile } from "@/lib/UserProfileContext";

const PLAN_META = {
  plus: {
    name: "Plus",
    subtitle: "Build momentum with deeper structure",
    color: "text-blue-400",
    borderClass: "border-blue-400/40",
    icon: <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />,
    sortBase: 0,
  },
  premium: {
    name: "Premium",
    subtitle: "Unlock your full future-self experience",
    color: "text-primary",
    borderClass: "border-primary/50",
    icon: <Crown className="w-4 h-4 text-primary shrink-0" />,
    featured: true,
    sortBase: 2,
  },
};

/**
 * Infer plan key ("plus" | "premium") from package or product identifier.
 * Handles both RevenueCat standard identifiers ($rc_monthly, $rc_annual) and
 * custom identifiers set in the RevenueCat dashboard.
 *
 * For standard RC identifiers that don't contain plan name, we fall back to
 * the product title or product identifier supplied by the native layer.
 */
function inferPlan(pkg) {
  const id = (pkg.identifier || "").toLowerCase();
  const title = (pkg.product?.title || "").toLowerCase();
  const productId = (pkg.product?.productIdentifier || "").toLowerCase();
  const combined = `${id} ${title} ${productId}`;

  if (combined.includes("premium")) return "premium";
  if (combined.includes("plus") || combined.includes("supporter")) return "plus";

  // For bare $rc_monthly / $rc_annual with no plan info, treat as premium (safest default)
  return "premium";
}

/**
 * Sort packages: plus-monthly, plus-annual, premium-monthly, premium-annual
 */
function sortPackages(pkgs) {
  return [...pkgs].sort((a, b) => {
    const planA = inferPlan(a);
    const planB = inferPlan(b);
    const cycleA = inferBillingCycle(a.identifier);
    const cycleB = inferBillingCycle(b.identifier);
    const scoreA = (PLAN_META[planA]?.sortBase ?? 0) + (cycleA === "annual" ? 1 : 0);
    const scoreB = (PLAN_META[planB]?.sortBase ?? 0) + (cycleB === "annual" ? 1 : 0);
    return scoreA - scoreB;
  });
}

export default function RevenueCatPaywall({ onPurchased }) {
  const { profile, refetch } = useUserProfile();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setLoading(true);
    setError(null);
    try {
      const pkgs = await getOfferings();
      setPackages(sortPackages(pkgs));
    } catch (e) {
      setError("Could not load plans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg) => {
    setError(null);
    setSuccess(null);
    setPurchasing(pkg.identifier);
    try {
      const tier = await purchasePackage(pkg.identifier);
      await refetch();
      setSuccess(`${pkg.product?.title || "Plan"} activated! ✦`);
      onPurchased?.(tier);
    } catch (e) {
      if (!e.message?.includes("userCancelled")) {
        setError(e.message || "Purchase failed. Please try again.");
      }
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setError(null);
    setSuccess(null);
    setRestoring(true);
    try {
      const tier = await restorePurchases();
      await refetch();
      setSuccess(tier !== "free" ? "Purchases restored! ✦" : "No active purchases found.");
      onPurchased?.(tier);
    } catch (e) {
      setError(e.message || "Restore failed. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const currentTier = profile?.subscription_tier || "free";
  const currentBillingCycle = profile?.billing_cycle || "monthly";
  const billingPlatform = profile?.billing_platform;

  // Check if a specific package matches the active subscription
  function isCurrentPackage(pkg) {
    const plan = inferPlan(pkg);
    const cycle = inferBillingCycle(pkg.identifier);
    const tierMatch =
      (plan === "plus" && currentTier === "supporter") ||
      (plan === "premium" && currentTier === "premium");
    // Only show "Current Plan" on the correct billing cycle when platform is apple
    if (billingPlatform === "apple") {
      return tierMatch && cycle === currentBillingCycle;
    }
    // If platform unknown, just match tier
    return tierMatch;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="glass-card border border-destructive/30 rounded-xl p-4">
          <p className="text-sm text-destructive/80">{error}</p>
        </div>
      )}
      {success && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-sm font-semibold text-foreground">{success}</p>
        </motion.div>
      )}

      {packages.length === 0 ? (
        <div className="glass-card border border-border rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">No plans available right now.</p>
          <button onClick={loadOfferings} className="text-xs text-primary flex items-center gap-1.5 mx-auto">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : (
        packages.map((pkg, i) => {
          const plan = inferPlan(pkg);
          const cycle = inferBillingCycle(pkg.identifier);
          const meta = PLAN_META[plan] || PLAN_META.premium;
          const isCurrent = isCurrentPackage(pkg);
          const isLoadingPkg = purchasing === pkg.identifier;
          const cycleLabel = cycle === "annual" ? "/ year" : "/ month";
          const isAnnual = cycle === "annual";

          return (
            <motion.div
              key={pkg.identifier}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-2xl border-2 overflow-hidden glass-card ${meta.borderClass} ${meta.featured ? "glow-gold" : ""}`}
            >
              {/* Badge strip */}
              {isCurrent ? (
                <div className="px-5 py-2.5 bg-primary/10 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Your Current Plan</span>
                </div>
              ) : isAnnual ? (
                <div className="px-5 py-2.5 bg-emerald-500/8 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Best Value · Save ~35%</span>
                </div>
              ) : null}

              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {meta.icon}
                    <h3 className={`font-playfair text-xl font-bold ${meta.color}`}>{meta.name}</h3>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isAnnual
                      ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                      : "text-muted-foreground border-border"
                  }`}>
                    {isAnnual ? "Annual" : "Monthly"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{meta.subtitle}</p>
                <p className={`font-playfair text-2xl font-bold mb-4 ${meta.color}`}>
                  {pkg.product?.priceString || "—"}
                  <span className="text-sm font-normal text-muted-foreground ml-1.5">{cycleLabel}</span>
                </p>

                <button
                  onClick={() => !isCurrent && handlePurchase(pkg)}
                  disabled={isCurrent || !!purchasing}
                  className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 ${
                    isCurrent
                      ? "bg-border/40 text-muted-foreground cursor-default"
                      : plan === "premium"
                      ? "gold-gradient text-background"
                      : "bg-blue-400/15 border border-blue-400/30 text-blue-400 hover:bg-blue-400/25"
                  }`}
                >
                  {isLoadingPkg
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    : isCurrent
                    ? "Current Plan"
                    : `Subscribe — ${pkg.product?.priceString || ""}`}
                </button>
              </div>
            </motion.div>
          );
        })
      )}

      {/* Restore purchases — required by App Store Review Guidelines */}
      <button
        onClick={handleRestore}
        disabled={restoring}
        className="w-full py-3 text-xs text-muted-foreground flex items-center justify-center gap-1.5 hover:text-foreground transition-colors"
      >
        {restoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        Restore Purchases
      </button>

      <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
        Subscriptions auto-renew unless cancelled at least 24 hours before renewal.{"\n"}
        Manage or cancel in App Store Settings → Subscriptions.
      </p>
    </div>
  );
}
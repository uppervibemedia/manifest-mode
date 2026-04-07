/**
 * iOS in-app purchase paywall using RevenueCat native bridge.
 * Rendered on the Pricing page instead of Stripe buttons when on iOS native.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Sparkles, Loader2, Check, RefreshCw } from "lucide-react";
import { getOfferings, purchasePackage, restorePurchases } from "@/lib/revenueCatBridge";
import { useUserProfile } from "@/lib/UserProfileContext";

// Map package identifiers to our plan info
// RevenueCat package identifiers follow $rc_monthly / $rc_annual convention
// OR custom identifiers set in the RevenueCat dashboard
const PLAN_META = {
  plus: {
    name: "Plus",
    subtitle: "Build momentum with deeper structure",
    color: "text-blue-400",
    borderClass: "border-blue-400/40",
    icon: <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />,
  },
  premium: {
    name: "Premium",
    subtitle: "Unlock your full future-self experience",
    color: "text-primary",
    borderClass: "border-primary/50",
    icon: <Crown className="w-4 h-4 text-primary shrink-0" />,
    featured: true,
  },
};

// Infer plan from package identifier string
function inferPlan(identifier = "") {
  const id = identifier.toLowerCase();
  if (id.includes("premium")) return "premium";
  if (id.includes("plus") || id.includes("supporter")) return "plus";
  return null;
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
      setPackages(pkgs);
    } catch (e) {
      setError("Could not load plans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg) => {
    setError(null);
    setPurchasing(pkg.identifier);
    try {
      const tier = await purchasePackage(pkg.identifier);
      await refetch();
      setSuccess(`${pkg.product?.title || "Plan"} activated!`);
      onPurchased?.(tier);
    } catch (e) {
      if (e.message?.includes("userCancelled")) {
        // User cancelled — silent
      } else {
        setError(e.message || "Purchase failed. Please try again.");
      }
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setError(null);
    setRestoring(true);
    try {
      const tier = await restorePurchases();
      await refetch();
      setSuccess(tier !== "free" ? "Purchases restored!" : "No active purchases found.");
      onPurchased?.(tier);
    } catch (e) {
      setError(e.message || "Restore failed. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const currentTier = profile?.subscription_tier || "free";

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
          const plan = inferPlan(pkg.identifier);
          const meta = PLAN_META[plan] || PLAN_META.plus;
          const isCurrent = (plan === "plus" && currentTier === "supporter") ||
                            (plan === "premium" && currentTier === "premium");
          const isLoading = purchasing === pkg.identifier;

          return (
            <motion.div
              key={pkg.identifier}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-2xl border-2 overflow-hidden glass-card ${meta.borderClass} ${meta.featured ? "glow-gold" : ""}`}
            >
              {isCurrent && (
                <div className="px-5 py-2.5 bg-primary/10 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Your Current Plan</span>
                </div>
              )}

              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  {meta.icon}
                  <h3 className={`font-playfair text-xl font-bold ${meta.color}`}>{meta.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{meta.subtitle}</p>
                <p className={`font-playfair text-2xl font-bold mb-4 ${meta.color}`}>
                  {pkg.product?.priceString || "—"}
                  <span className="text-sm font-normal text-muted-foreground ml-1.5">
                    {pkg.identifier?.includes("annual") ? "/ year" : "/ month"}
                  </span>
                </p>

                <button
                  onClick={() => !isCurrent && handlePurchase(pkg)}
                  disabled={isCurrent || isLoading}
                  className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    isCurrent
                      ? "bg-border/40 text-muted-foreground cursor-default"
                      : plan === "premium"
                      ? "gold-gradient text-background"
                      : "bg-blue-400/15 border border-blue-400/30 text-blue-400 hover:bg-blue-400/25"
                  }`}
                >
                  {isLoading
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

      {/* Restore purchases */}
      <button
        onClick={handleRestore}
        disabled={restoring}
        className="w-full py-3 text-xs text-muted-foreground flex items-center justify-center gap-1.5 hover:text-foreground transition-colors"
      >
        {restoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        Restore Purchases
      </button>

      <p className="text-center text-[11px] text-muted-foreground">
        Subscriptions auto-renew. Cancel anytime in App Store Settings.
      </p>
    </div>
  );
}
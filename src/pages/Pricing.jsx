import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/lib/UserProfileContext";
import { Check, Lock, Crown, Sparkles, ChevronLeft, Loader2, ExternalLink, Image } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { base44 } from "@/api/base44Client";
import { PLAN_LABELS } from "@/lib/subscriptionEngine";
import AppStorePaymentNotice from "@/components/payments/AppStorePaymentNotice";

const PLANS = [
  {
    id: "free",
    name: "Free",
    subtitle: "Start your shift",
    visionLimit: "3 images",
    monthlyPrice: null,
    annualPrice: null,
    included: [
      "3 Vision Vault images",
      "Basic Reality Match Assessment",
      "Daily Shift access",
      "Morning Alignment Check-In",
      "Evening Alignment Review",
      "Limited Reality Match Score insights",
      "Basic Future Self preview",
    ],
    locked: {
      label: "Unlock with Plus or Premium",
      items: [
        "More Vision Vault image capacity",
        "Full Reality Match Assessment",
        "Full score tracking and history",
        "Weekly Pattern Analysis (AI)",
        "Future Self Journal access",
        "Future Self Coach (AI)",
        "See Me In This Vision (AI)",
      ],
    },
    cta: "Get Started",
    color: "text-muted-foreground",
    borderClass: "border-border",
  },
  {
    id: "supporter",
    name: "Plus",
    subtitle: "Build momentum with deeper structure",
    trial: "7-day free trial",
    visionLimit: "15 images",
    monthlyPrice: 7.99,
    annualPrice: 59.99,
    annualSavings: "Save 37%",
    included: [
      "15 Vision Vault images",
      "Full Reality Match Assessment",
      "Personalized Daily Shift Plan",
      "Morning and Evening Alignment Check-Ins",
      "Full Reality Match Score breakdown",
      "Score tracking and history",
      "Weekly Pattern Analysis (AI)",
      "Expanded Future Self access",
      "More guided insights and support",
    ],
    locked: {
      label: "Premium only",
      items: [
        "Unlimited Vision Vault images",
        "Future Self Journal access",
        "Future Self Coach (AI)",
        "See Me In This Vision (AI)",
        "Priority AI responses",
      ],
    },
    cta: "Choose Plus",
    color: "text-blue-400",
    borderClass: "border-blue-400/40",
  },
  {
    id: "premium",
    name: "Premium",
    subtitle: "Unlock your full future-self experience",
    visionLimit: "Unlimited images",
    monthlyPrice: 14.99,
    annualPrice: 119.99,
    annualSavings: "Save 33%",
    included: [
      "Unlimited Vision Vault images",
      "Full Reality Match Assessment",
      "Personalized Daily Shift Plan",
      "Morning and Evening Alignment Check-Ins",
      "Full Reality Match Score tracking and history",
      "Weekly Pattern Analysis (AI)",
      "Future Self Journal access",
      "Future Self Coach (AI)",
      "See Me In This Vision (AI)",
      "Priority AI responses",
    ],
    locked: null,
    cta: "Choose Premium",
    color: "text-primary",
    borderClass: "border-primary/50",
    featured: true,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, refetch } = useUserProfile();
  const [billing, setBilling] = useState("annual");
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle success/cancel redirect from Stripe
  const params = new URLSearchParams(window.location.search);
  const justSucceeded = params.get("success") === "1";
  const justCanceled = params.get("canceled") === "1";

  // Auto-refetch profile when returning from successful checkout
  useEffect(() => {
    if (justSucceeded) {
      // Poll briefly to pick up webhook-updated subscription tier
      const timer = setTimeout(() => refetch(), 2000);
      const timer2 = setTimeout(() => refetch(), 5000);
      return () => { clearTimeout(timer); clearTimeout(timer2); };
    }
  }, [justSucceeded]);

  const currentTier = profile?.subscription_tier || "free";
  const hasPaidPlan = currentTier !== "free";
  const billingPlatform = profile?.billing_platform || "none";

  const getDisplayPrice = (plan) => {
    if (!plan.monthlyPrice) return { main: "$0", sub: "forever free" };
    if (billing === "annual") return { main: `$${plan.annualPrice}`, sub: "per year", badge: plan.annualSavings };
    return { main: `$${plan.monthlyPrice}`, sub: "per month" };
  };

  const handleSubscribe = async (plan) => {
    if (!plan.monthlyPrice) return; // free plan
    setError(null);
    const key = `${plan.id}_${billing}`;
    setLoadingPlan(key);
    try {
      const res = await base44.functions.invoke("stripeCreateCheckout", {
        plan_id: plan.id,
        billing_cycle: billing,
        success_url: `${window.location.origin}/pricing?success=1`,
        cancel_url: `${window.location.origin}/pricing?canceled=1`,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError(res.data?.error || "Could not start checkout. Please try again.");
      }
    } catch (e) {
      setError(e.message || "Checkout failed.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManage = async () => {
    setError(null);
    setPortalLoading(true);
    try {
      const res = await base44.functions.invoke("stripePortal", {
        return_url: `${window.location.origin}/pricing`,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError(res.data?.error || "Could not open billing portal.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setPortalLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-10">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-1.5 text-muted-foreground text-sm mb-6">
          <ChevronLeft className="w-4 h-4" /> Profile
        </button>

        <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Subscription</p>
        <h1 className="font-playfair text-2xl font-semibold mb-2">Choose Your Plan</h1>
        <p className="text-sm text-muted-foreground mb-7">Invest in the version of yourself you're becoming.</p>

        {/* App Store compliance notice (iOS WebView only) */}
        <AppStorePaymentNotice />

        {/* Post-checkout banners */}
        {justSucceeded && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card border border-emerald-500/30 rounded-xl p-4 mb-5 flex items-center gap-3">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Subscription activated ✦</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your plan is now active. Features will unlock shortly.</p>
            </div>
          </motion.div>
        )}
        {justCanceled && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card border border-border rounded-xl p-4 mb-5">
            <p className="text-sm text-muted-foreground">Checkout was canceled. No charge was made.</p>
          </motion.div>
        )}

        {/* Error banner */}
        {error && (
          <div className="glass-card border border-destructive/30 rounded-xl p-4 mb-5">
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        )}

        {/* Manage subscription (paid users) */}
        {hasPaidPlan && billingPlatform === "stripe" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card border border-primary/20 rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {PLAN_LABELS[currentTier]} · {profile?.billing_cycle === "annual" ? "Annual" : "Monthly"}
              </p>
              {profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date() ? (
                <p className="text-xs text-blue-400 mt-0.5">
                  Free trial ends {new Date(profile.trial_ends_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              ) : profile?.renewal_date ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Renews {new Date(profile.renewal_date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              ) : null}
            </div>
            <button onClick={handleManage} disabled={portalLoading}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition-colors disabled:opacity-50">
              {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
              Manage
            </button>
          </motion.div>
        )}

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-7">
          <div className="flex bg-card border border-border rounded-xl p-1 gap-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                billing === "monthly" ? "bg-secondary text-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                billing === "annual" ? "gold-gradient text-background" : "text-muted-foreground"
              }`}
            >
              Annual
              <span className={`text-[9px] font-bold rounded-full px-1.5 py-0.5 ${
                billing === "annual" ? "bg-background/20 text-background" : "bg-emerald-400/15 text-emerald-400"
              }`}>
                BEST VALUE
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="space-y-4 mb-8">
          {PLANS.map((plan, i) => {
            const isCurrent = currentTier === plan.id;
            const price = getDisplayPrice(plan);
            const isPremium = plan.id === "premium";
            const isPlus = plan.id === "supporter";
            const planKey = `${plan.id}_${billing}`;
            const isLoading = loadingPlan === planKey;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-2xl border-2 overflow-hidden glass-card ${
                  isPremium ? "border-primary/50 glow-gold" : plan.borderClass
                }`}
              >
                {/* Badge strip */}
                {isCurrent && (
                  <div className="px-5 py-2.5 bg-primary/10 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Your Current Plan</span>
                  </div>
                )}
                {!isCurrent && isPremium && (
                  <div className="px-5 py-2.5 bg-primary/8 flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Featured Plan</span>
                  </div>
                )}
                {isPlus && isCurrent && profile?.trial_ends_at && (
                  <div className="px-5 py-2.5 bg-blue-400/10 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                      Trial ends {new Date(profile.trial_ends_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                )}
                {!isCurrent && isPlus && (
                  <div className="px-5 py-2.5 bg-blue-400/8 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">7-Day Free Trial · Popular Choice</span>
                  </div>
                )}

                <div className="p-5">
                  {/* Plan header */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      {isPremium && <Crown className="w-4 h-4 text-primary shrink-0" />}
                      <h3 className={`font-playfair text-xl font-bold ${plan.color}`}>{plan.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Image className={`w-3.5 h-3.5 ${plan.color}`} />
                      <span className={`text-[10px] font-bold ${plan.color}`}>{plan.visionLimit}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-3 mb-2">
                    <div>
                      <span className={`font-playfair text-3xl font-bold ${plan.color}`}>{price.main}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">{price.sub}</span>
                    </div>
                    {price.badge && (
                      <span className="mb-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/12 border border-emerald-400/20 rounded-full px-2 py-0.5">
                        {price.badge}
                      </span>
                    )}
                  </div>
                  {/* Trial notice for Plus monthly */}
                  {isPlus && billing === 'monthly' && !isCurrent && (
                    <p className="text-[11px] text-blue-400 font-medium mb-4">
                      Free for 7 days, then $7.99/month. Cancel anytime.
                    </p>
                  )}
                  {(!isPlus || billing !== 'monthly' || isCurrent) && <div className="mb-3" />}

                  {/* Included features */}
                  <div className="space-y-2 mb-4">
                    {plan.included.map((f, fi) => (
                      <div key={fi} className="flex items-start gap-2.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isPremium ? "bg-primary/15" : isPlus ? "bg-blue-400/15" : "bg-muted"
                        }`}>
                          <Check className={`w-2.5 h-2.5 ${
                            isPremium ? "text-primary" : isPlus ? "text-blue-400" : "text-muted-foreground"
                          }`} />
                        </div>
                        <span className="text-xs text-foreground/80 leading-relaxed">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Locked features */}
                  {plan.locked && (
                    <div className="border-t border-border/50 pt-3.5 mb-5">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-2.5 flex items-center gap-1.5">
                        <Lock className="w-3 h-3" /> {plan.locked.label}
                      </p>
                      <div className="space-y-2">
                        {plan.locked.items.map((f, fi) => (
                          <div key={fi} className="flex items-start gap-2.5">
                            <Lock className="w-3 h-3 text-muted-foreground/30 shrink-0 mt-0.5" />
                            <span className="text-xs text-muted-foreground/40 leading-relaxed">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={() => !isCurrent && handleSubscribe(plan)}
                    disabled={isCurrent || isLoading || !plan.monthlyPrice}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      isCurrent || !plan.monthlyPrice
                        ? "bg-border/40 text-muted-foreground cursor-default"
                        : isPremium
                        ? "gold-gradient text-background"
                        : isPlus
                        ? "bg-blue-400/15 border border-blue-400/30 text-blue-400 hover:bg-blue-400/25"
                        : "bg-card border border-border text-muted-foreground hover:border-primary/20"
                    }`}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : isPlus && billing === 'monthly' ? (
                      "Start 7-Day Free Trial"
                    ) : (
                      plan.cta
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-[11px] text-muted-foreground">Cancel anytime · No hidden fees</p>
          <p className="text-[11px] text-muted-foreground">Annual plans billed once per year · Powered by Stripe</p>
        </div>
      </div>
    </AppLayout>
  );
}
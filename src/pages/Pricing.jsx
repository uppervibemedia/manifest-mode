import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/lib/UserProfileContext";
import { Check, X, Crown, Sparkles, ChevronLeft, Zap } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const PLANS = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    annualMonthly: 0,
    description: "Start your alignment journey",
    color: "text-muted-foreground",
    borderColor: "border-border",
    features: [
      { text: "5 vision board images", included: true },
      { text: "Reality Match Assessment", included: true },
      { text: "Daily Shift plan", included: true },
      { text: "Morning & evening alignment", included: true },
      { text: "Basic score tracking", included: true },
      { text: "20 vision board images", included: false },
      { text: "AI Future Self Coach", included: false },
      { text: "Unlimited vision board", included: false },
      { text: "See Me In This Vision (AI)", included: false },
      { text: "Future Self Scene Generator", included: false },
    ],
  },
  {
    id: "supporter",
    name: "Plus",
    monthlyPrice: 9.99,
    annualPrice: 79.99,
    annualMonthly: 6.67,
    annualSavings: 39.89,
    description: "Build serious momentum",
    color: "text-blue-400",
    borderColor: "border-blue-400/40",
    badge: "Most Popular",
    features: [
      { text: "20 vision board images", included: true },
      { text: "Reality Match Assessment", included: true },
      { text: "Daily Shift plan", included: true },
      { text: "Morning & evening alignment", included: true },
      { text: "Full score tracking & history", included: true },
      { text: "AI Future Self Coach", included: true },
      { text: "Unlimited vision board", included: false },
      { text: "See Me In This Vision (AI)", included: false },
      { text: "Future Self Scene Generator", included: false },
      { text: "Priority AI responses", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 19.99,
    annualPrice: 149.99,
    annualMonthly: 12.50,
    annualSavings: 89.89,
    description: "Full identity transformation",
    color: "text-primary",
    borderColor: "border-primary/50",
    badge: "Best Value",
    features: [
      { text: "Unlimited vision board images", included: true },
      { text: "Reality Match Assessment", included: true },
      { text: "Daily Shift plan", included: true },
      { text: "Morning & evening alignment", included: true },
      { text: "Full score tracking & history", included: true },
      { text: "AI Future Self Coach", included: true },
      { text: "See Me In This Vision (AI)", included: true },
      { text: "Future Self Scene Generator", included: true },
      { text: "Priority AI responses", included: true },
      { text: "Full Blueprint access", included: true },
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useUserProfile();
  const [billing, setBilling] = useState("annual");

  const currentTier = profile?.subscription_tier || "free";

  const getPrice = (plan) => {
    if (plan.id === "free") return "$0";
    if (billing === "annual") return `$${plan.annualPrice}/yr`;
    return `$${plan.monthlyPrice}/mo`;
  };

  const getMonthlyEquiv = (plan) => {
    if (plan.id === "free" || billing === "monthly") return null;
    return `$${plan.annualMonthly}/mo`;
  };

  const getSavings = (plan) => {
    if (plan.id === "free" || billing === "monthly") return null;
    return `Save $${plan.annualSavings.toFixed(0)}/yr`;
  };

  const isCurrent = (planId) => currentTier === planId;

  const getCtaLabel = (plan) => {
    if (isCurrent(plan.id)) return "Current Plan";
    if (plan.id === "free") return "Downgrade";
    const tierOrder = { free: 0, supporter: 1, premium: 2 };
    return tierOrder[plan.id] > tierOrder[currentTier] ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`;
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
      <div className="px-5 pt-6 pb-8">
        {/* Back */}
        <button onClick={() => navigate("/profile")} className="flex items-center gap-1.5 text-muted-foreground text-sm mb-5">
          <ChevronLeft className="w-4 h-4" /> Profile
        </button>

        <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Subscription</p>
        <h1 className="font-playfair text-2xl font-semibold mb-2">Choose Your Plan</h1>
        <p className="text-sm text-muted-foreground mb-6">Invest in the version of yourself you're becoming.</p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex bg-card border border-border rounded-xl p-1 gap-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                billing === "monthly" ? "bg-primary text-background" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                billing === "annual" ? "bg-primary text-background" : "text-muted-foreground"
              }`}
            >
              Annual
              {billing !== "annual" && (
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/15 rounded-full px-1.5 py-0.5">
                  SAVE 33%
                </span>
              )}
            </button>
          </div>
        </div>

        {billing === "annual" && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs text-emerald-400 font-medium mb-5">
            ✦ Annual plans save up to $90/year
          </motion.p>
        )}

        {/* Plan Cards */}
        <div className="space-y-4 mb-6">
          {PLANS.map((plan, i) => {
            const current = isCurrent(plan.id);
            const savings = getSavings(plan);
            const monthlyEquiv = getMonthlyEquiv(plan);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`glass-card rounded-2xl border-2 overflow-hidden transition-all ${
                  current
                    ? `${plan.borderColor} bg-primary/5`
                    : plan.id === "premium"
                    ? "border-primary/30 glow-gold"
                    : `${plan.borderColor}`
                }`}
              >
                {/* Badge row */}
                {(plan.badge || current) && (
                  <div className={`px-5 py-2 flex items-center gap-2 ${
                    current ? "bg-primary/15" : plan.id === "premium" ? "bg-primary/10" : "bg-blue-400/10"
                  }`}>
                    {current ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Your Current Plan</span>
                      </>
                    ) : plan.badge ? (
                      <>
                        <Sparkles className={`w-3.5 h-3.5 ${plan.id === "premium" ? "text-primary" : "text-blue-400"}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${plan.id === "premium" ? "text-primary" : "text-blue-400"}`}>
                          {plan.badge}
                        </span>
                        {savings && (
                          <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-400/15 rounded-full px-2 py-0.5">
                            {savings}
                          </span>
                        )}
                      </>
                    ) : null}
                  </div>
                )}

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        {plan.id === "premium" && <Crown className="w-4 h-4 text-primary" />}
                        <h3 className={`font-playfair text-xl font-bold ${plan.color}`}>{plan.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-playfair text-2xl font-bold ${plan.color}`}>{getPrice(plan)}</p>
                      {monthlyEquiv && (
                        <p className="text-[10px] text-muted-foreground">{monthlyEquiv} billed annually</p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-5">
                    {plan.features.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-2.5">
                        {f.included ? (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                        )}
                        <span className={`text-xs ${f.included ? "text-foreground/80" : "text-muted-foreground/40"}`}>
                          {f.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    disabled={current}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      current
                        ? "bg-border/50 text-muted-foreground cursor-default"
                        : plan.id === "premium"
                        ? "gold-gradient text-background"
                        : plan.id === "supporter"
                        ? "bg-blue-400/15 border border-blue-400/30 text-blue-400 hover:bg-blue-400/25"
                        : "bg-card border border-border text-muted-foreground hover:border-primary/20"
                    }`}
                  >
                    {getCtaLabel(plan)}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer notes */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">Cancel anytime. No hidden fees.</p>
          <p className="text-[11px] text-muted-foreground">Annual plans billed once per year.</p>
        </div>
      </div>
    </AppLayout>
  );
}
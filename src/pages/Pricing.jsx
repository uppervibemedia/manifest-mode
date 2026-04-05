import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/lib/UserProfileContext";
import { Check, Lock, Crown, Sparkles, ChevronLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const PLANS = [
  {
    id: "free",
    name: "Free",
    subtitle: "Start your shift",
    monthlyPrice: null,
    annualPrice: null,
    included: [
      "Limited Vision Vault images",
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
        "Full Reality Match Assessment",
        "Full score tracking and history",
        "Full Future Self Blueprint access",
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
    monthlyPrice: 7.99,
    annualPrice: 59.99,
    annualSavings: "Save 37%",
    included: [
      "Expanded Vision Vault images",
      "Full Reality Match Assessment",
      "Personalized Daily Shift Plan",
      "Morning and Evening Alignment Check-Ins",
      "Full Reality Match Score breakdown",
      "Score tracking and history",
      "Expanded Future Self access",
      "More guided insights and support",
    ],
    locked: {
      label: "Premium only",
      items: [
        "Future Self Coach (AI)",
        "See Me In This Vision (AI)",
        "Priority AI responses",
        "Full Future Self Blueprint access",
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
    monthlyPrice: 14.99,
    annualPrice: 119.99,
    annualSavings: "Save 33%",
    included: [
      "Unlimited Vision Vault images",
      "Full Reality Match Assessment",
      "Personalized Daily Shift Plan",
      "Morning and Evening Alignment Check-Ins",
      "Full Reality Match Score tracking and history",
      "Full Future Self Blueprint access",
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
  const { profile, loading: profileLoading } = useUserProfile();
  const [billing, setBilling] = useState("annual");

  const currentTier = profile?.subscription_tier || "free";

  const getDisplayPrice = (plan) => {
    if (!plan.monthlyPrice) return { main: "$0", sub: "forever free" };
    if (billing === "annual") return { main: `$${plan.annualPrice}`, sub: "per year", badge: plan.annualSavings };
    return { main: `$${plan.monthlyPrice}`, sub: "per month" };
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
                {!isCurrent && isPlus && (
                  <div className="px-5 py-2.5 bg-blue-400/8 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Popular Choice</span>
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
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-3 mb-5">
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
                    disabled={isCurrent}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      isCurrent
                        ? "bg-border/40 text-muted-foreground cursor-default"
                        : isPremium
                        ? "gold-gradient text-background"
                        : isPlus
                        ? "bg-blue-400/15 border border-blue-400/30 text-blue-400 hover:bg-blue-400/25"
                        : "bg-card border border-border text-muted-foreground hover:border-primary/20"
                    }`}
                  >
                    {isCurrent ? "Current Plan" : plan.cta}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-[11px] text-muted-foreground">Cancel anytime · No hidden fees</p>
          <p className="text-[11px] text-muted-foreground">Annual plans billed once per year</p>
        </div>
      </div>
    </AppLayout>
  );
}
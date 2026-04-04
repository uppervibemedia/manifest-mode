import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Sparkles, ChevronLeft, Zap, Star } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const PLANS = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    annual: 0,
    desc: "Start your alignment journey",
    badge: null,
    features: [
      "5 vision uploads",
      "1 assessment per month",
      "Basic Reality Match Score",
      "3 daily affirmations",
      "5 journal entries",
      "Basic daily check-ins",
    ],
    locked: [
      "AI Insights",
      "Full category breakdown",
      "Future Self Blueprint",
      "Full AI Coach",
    ],
    aiFeature: null,
    cta: "Current Plan",
    highlight: false,
  },
  {
    id: "supporter",
    name: "Plus",
    monthly: 12,
    annual: 96, // $8/mo billed annually — saves $48/yr (~33%)
    annualMonthlyEquiv: 8,
    annualSavings: 33,
    desc: "Daily AI guidance and real momentum",
    badge: "AI Insights",
    badgeColor: "text-blue-400 border-blue-400/30",
    features: [
      "20 vision uploads",
      "Unlimited assessments",
      "Full Reality Match Score",
      "Complete Daily Shift Plan",
      "20 affirmations",
      "Full journal history",
      "Progress tracking & streaks",
    ],
    aiFeature: {
      color: "blue",
      label: "AI Insights — included",
      items: [
        "1 personalized daily insight",
        "1 weekly progress summary",
        "Score-linked recommendations",
      ],
    },
    locked: [
      "Interactive AI Coach sessions",
      "Belief reframe coaching",
      "Reset plans & situational coaching",
    ],
    cta: "Upgrade to Plus",
    highlight: false,
  },
  {
    id: "premium",
    name: "Premium",
    monthly: 29,
    annual: 228, // $19/mo billed annually — saves $120/yr (~34%)
    annualMonthlyEquiv: 19,
    annualSavings: 34,
    desc: "Full identity transformation with AI coaching",
    badge: "Full AI Coach",
    badgeColor: "text-primary border-primary/30",
    features: [
      "Unlimited vision uploads",
      "Advanced AI analysis",
      "Future Self Blueprint",
      "Unlimited check-ins & journals",
      "Full progress analytics",
      "Deep belief analysis",
      "20 AI credits included monthly",
    ],
    aiFeature: {
      color: "gold",
      label: "Full AI Coach — included",
      items: [
        "Unlimited coaching conversations",
        "Situational & belief reframe coaching",
        "Reset plans after setbacks",
        "Blueprint & Score-linked guidance",
        "Goal-specific coaching sessions",
      ],
    },
    locked: [],
    cta: "Go Premium",
    highlight: true,
  },
];

const CREDIT_PACKS = [
  {
    type: "small",
    label: "Small Pack",
    credits: 10,
    price: "$4",
    priceNum: 4,
    desc: "Quick top-up for occasional use",
    eligibility: ["supporter", "premium"],
  },
  {
    type: "medium",
    label: "Medium Pack",
    credits: 30,
    price: "$9",
    priceNum: 9,
    desc: "Best value for regular AI usage",
    highlight: true,
    eligibility: ["supporter", "premium"],
  },
  {
    type: "large",
    label: "Large Pack",
    credits: 75,
    price: "$19",
    priceNum: 19,
    desc: "Power user pack with max value",
    eligibility: ["premium"],
  },
];

const CREDIT_ACTIONS = [
  { action: "Deep Blueprint Refresh", cost: 3 },
  { action: "Advanced Belief Analysis", cost: 2 },
  { action: "Extra Coach Session", cost: 2 },
  { action: "Custom Strategy Session", cost: 5 },
  { action: "Extra Weekly AI Report", cost: 1 },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly"); // "monthly" | "annual"

  const getPrice = (plan) => {
    if (plan.monthly === 0) return { display: "$0", sub: "forever" };
    if (billing === "annual") {
      return {
        display: `$${plan.annualMonthlyEquiv}`,
        sub: "/mo · billed annually",
        total: `$${plan.annual}/yr`,
      };
    }
    return { display: `$${plan.monthly}`, sub: "/mo" };
  };

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-2">Unlock Your Potential</p>
          <h1 className="font-playfair text-2xl font-semibold mb-2">Choose Your Plan</h1>
          <p className="text-sm text-muted-foreground">Invest in the version of you that matches your vision</p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center p-1 bg-muted rounded-xl gap-1">
            <button onClick={() => setBilling("monthly")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                billing === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}>
              Monthly
            </button>
            <button onClick={() => setBilling("annual")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                billing === "annual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}>
              Annual
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/15 border border-emerald-400/25 rounded-full px-1.5 py-0.5">
                Save 33%
              </span>
            </button>
          </div>
        </div>

        {/* AI tier distinction callout */}
        <div className="glass-card border border-border rounded-2xl p-4 mb-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">AI Features by Plan</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted/30 border border-border rounded-xl p-3 text-center">
              <p className="text-xs font-semibold text-muted-foreground">Free</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">No AI access</p>
            </div>
            <div className="flex-1 bg-blue-400/5 border border-blue-400/20 rounded-xl p-3 text-center">
              <Zap className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
              <p className="text-xs font-semibold text-blue-400">Plus</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">AI Insights<br />Daily + Weekly</p>
            </div>
            <div className="flex-1 bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
              <Sparkles className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
              <p className="text-xs font-semibold text-primary">Premium</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Full AI Coach<br />+ 20 credits/mo</p>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-4 mb-8">
          {PLANS.map((plan, i) => {
            const pricing = getPrice(plan);
            return (
              <motion.div key={`${plan.id}-${billing}`}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`rounded-2xl p-5 border ${plan.highlight ? "glass-card glow-gold border-primary/30" : "glass-card border-border"}`}>

                {plan.highlight && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Crown className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Most Powerful</span>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-playfair text-lg font-semibold text-foreground">{plan.name}</h3>
                    {plan.badge && (
                      <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${plan.badgeColor}`}>
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="text-xl font-bold text-foreground">{pricing.display}</span>
                    <p className="text-[10px] text-muted-foreground">{pricing.sub}</p>
                    {pricing.total && <p className="text-[10px] text-primary font-medium">{pricing.total}</p>}
                  </div>
                </div>

                {/* Annual savings badge */}
                {billing === "annual" && plan.annualSavings && (
                  <div className="inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/25">
                    <Star className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="text-[10px] font-semibold text-emerald-400">Save {plan.annualSavings}% vs monthly</span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>

                {/* Core features */}
                <div className="space-y-1.5 mb-3">
                  {plan.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs text-foreground/80">{f}</span>
                    </div>
                  ))}
                </div>

                {/* AI Feature block */}
                {plan.aiFeature && (
                  <div className={`rounded-xl p-3 mb-3 border ${
                    plan.aiFeature.color === "gold"
                      ? "border-primary/20 bg-primary/5"
                      : "border-blue-400/20 bg-blue-400/5"
                  }`}>
                    <p className={`text-[10px] uppercase tracking-widest font-semibold mb-2 ${
                      plan.aiFeature.color === "gold" ? "text-primary" : "text-blue-400"
                    }`}>
                      {plan.aiFeature.label}
                    </p>
                    <div className="space-y-1">
                      {plan.aiFeature.items.map((item, ii) => (
                        <div key={ii} className="flex items-center gap-2">
                          <div className={`w-1 h-1 rounded-full shrink-0 ${plan.aiFeature.color === "gold" ? "bg-primary" : "bg-blue-400"}`} />
                          <span className="text-xs text-foreground/75">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Locked features */}
                {plan.locked.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    {plan.locked.map((f, fi) => (
                      <div key={fi} className="flex items-center gap-2 opacity-35">
                        <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground line-through">{f}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button disabled={plan.id === "free"}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight
                      ? "gold-gradient text-background"
                      : plan.id === "free"
                      ? "bg-card border border-border text-muted-foreground cursor-default"
                      : "bg-secondary border border-border text-foreground hover:border-primary/30"
                  }`}>
                  {plan.id === "free" ? "Current Plan" : (
                    <span className="flex items-center justify-center gap-2">
                      {plan.highlight && <Sparkles className="w-4 h-4" />}
                      {plan.cta}{billing === "annual" && plan.monthly > 0 ? " · Annual" : ""}
                    </span>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* ── AI ADD-ON CREDITS SECTION ── */}
        <div className="mb-6">
          <div className="text-center mb-5">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <h2 className="font-playfair text-lg font-semibold">AI Add-On Credits</h2>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              For heavy AI usage beyond your plan's included allowance. Available to Plus and Premium subscribers.
            </p>
          </div>

          {/* What credits are used for */}
          <div className="glass-card border border-border rounded-2xl p-4 mb-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-3">Credit Usage</p>
            <div className="space-y-2">
              {CREDIT_ACTIONS.map((a, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-foreground/80">{a.action}</span>
                  <span className="text-xs font-semibold text-primary">{a.cost} credit{a.cost > 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-3 leading-relaxed">
              Basic app features, daily check-ins, habit tracking, and standard journaling never use credits.
            </p>
          </div>

          {/* Credit pack cards */}
          <div className="space-y-3">
            {CREDIT_PACKS.map((pack, i) => (
              <motion.div key={pack.type}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`glass-card rounded-2xl p-4 border flex items-center gap-4 ${
                  pack.highlight ? "border-primary/30 glow-gold" : "border-border"
                }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  pack.highlight ? "gold-gradient" : "bg-muted"
                }`}>
                  <Zap className={`w-5 h-5 ${pack.highlight ? "text-background" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground">{pack.label}</p>
                    {pack.highlight && (
                      <span className="text-[9px] font-bold text-primary border border-primary/30 rounded-full px-1.5 py-0.5">Best Value</span>
                    )}
                    {pack.type === "large" && (
                      <span className="text-[9px] font-bold text-muted-foreground border border-border rounded-full px-1.5 py-0.5">Premium only</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{pack.desc}</p>
                  <p className="text-[10px] text-primary font-medium mt-0.5">{pack.credits} credits</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-foreground">{pack.price}</p>
                  <button className="mt-1 text-[10px] font-semibold text-primary border border-primary/30 rounded-full px-2.5 py-1 hover:border-primary/60 transition-colors">
                    Buy
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-[10px] text-muted-foreground/50 mt-3 leading-relaxed">
            Credits available to Plus and Premium subscribers only. Premium credits never expire.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-2">
          All plans include 7-day free trial. Cancel anytime.
        </p>
      </div>
    </AppLayout>
  );
}
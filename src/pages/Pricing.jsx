import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Sparkles, ChevronLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Start your alignment journey",
    features: [
      "5 vision uploads",
      "1 assessment",
      "Basic Reality Match Score",
      "3 daily affirmations",
      "5 journal entries",
    ],
    locked: [
      "Full category breakdown",
      "Future Self Blueprint",
      "Advanced AI insights",
      "Unlimited check-ins",
    ],
    cta: "Current Plan",
    highlight: false,
  },
  {
    id: "supporter",
    name: "Supporter",
    price: "$12",
    period: "per month",
    desc: "Build real momentum",
    features: [
      "20 vision uploads",
      "Unlimited assessments",
      "Full Reality Match Score",
      "Complete Daily Shift Plan",
      "20 affirmations",
      "Full journal history",
      "Progress tracking",
    ],
    locked: [
      "Future Self Blueprint",
      "Advanced AI reports",
      "Unlimited everything",
    ],
    cta: "Upgrade to Supporter",
    highlight: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$29",
    period: "per month",
    desc: "Full identity transformation",
    features: [
      "Unlimited vision uploads",
      "Advanced AI analysis",
      "Future Self Blueprint",
      "Unlimited check-ins",
      "Unlimited journal",
      "Full progress analytics",
      "Weekly AI shift reports",
      "Deep belief analysis",
      "Premium prompts removed",
    ],
    locked: [],
    cta: "Go Premium",
    highlight: true,
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-2">Unlock Your Potential</p>
          <h1 className="font-playfair text-2xl font-semibold mb-2">Choose Your Plan</h1>
          <p className="text-sm text-muted-foreground">Invest in the version of you that matches your vision</p>
        </div>

        <div className="space-y-4">
          {PLANS.map((plan, i) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-5 border transition-all ${
                plan.highlight
                  ? "glass-card glow-gold border-primary/30"
                  : "glass-card border-border"
              }`}>
              {plan.highlight && (
                <div className="flex items-center gap-1.5 mb-3">
                  <Crown className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Most Powerful</span>
                </div>
              )}

              <div className="flex items-start justify-between mb-1">
                <h3 className="font-playfair text-lg font-semibold text-foreground">{plan.name}</h3>
                <div className="text-right">
                  <span className="text-xl font-bold text-foreground">{plan.price}</span>
                  <p className="text-[10px] text-muted-foreground">{plan.period}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>

              {/* Features */}
              <div className="space-y-1.5 mb-4">
                {plan.features.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs text-foreground/80">{f}</span>
                  </div>
                ))}
                {plan.locked.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-2 opacity-40">
                    <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground line-through">{f}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={plan.id === "free"}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  plan.highlight
                    ? "gold-gradient text-background"
                    : plan.id === "free"
                    ? "bg-card border border-border text-muted-foreground cursor-default"
                    : "bg-secondary border border-border text-foreground hover:border-primary/30"
                }`}>
                {plan.id === "free" ? (
                  "Current Plan"
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {plan.highlight && <Sparkles className="w-4 h-4" />}
                    {plan.cta}
                  </span>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          All plans include 7-day free trial. Cancel anytime.
        </p>
      </div>
    </AppLayout>
  );
}
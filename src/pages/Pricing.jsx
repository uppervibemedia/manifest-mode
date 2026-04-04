import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Sparkles, ChevronLeft, Zap } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Start your alignment journey",
    badge: null,
    features: [
      "5 vision uploads",
      "1 assessment",
      "Basic Reality Match Score",
      "3 daily affirmations",
      "5 journal entries",
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
    price: "$12",
    period: "per month",
    desc: "Daily AI guidance and real momentum",
    badge: "AI Insights",
    badgeColor: "text-blue-400 border-blue-400/30 bg-blue-400/8",
    features: [
      "20 vision uploads",
      "Unlimited assessments",
      "Full Reality Match Score",
      "Complete Daily Shift Plan",
      "20 affirmations",
      "Full journal history",
      "Progress tracking",
    ],
    aiFeature: {
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
    price: "$29",
    period: "per month",
    desc: "Full identity transformation with AI coaching",
    badge: "Full AI Coach",
    badgeColor: "text-primary border-primary/30 bg-primary/8",
    features: [
      "Unlimited vision uploads",
      "Advanced AI analysis",
      "Future Self Blueprint",
      "Unlimited check-ins",
      "Unlimited journal",
      "Full progress analytics",
      "Deep belief analysis",
    ],
    aiFeature: {
      label: "Full AI Coach — unlimited",
      items: [
        "Interactive coaching sessions",
        "Situational & belief reframe coaching",
        "Reset plans after setbacks",
        "Blueprint & Score-linked guidance",
        "Goal-specific coaching conversations",
      ],
    },
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

        {/* AI tier distinction callout */}
        <div className="glass-card border border-border rounded-2xl p-4 mb-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">AI Features by Plan</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-blue-400/8 border border-blue-400/20 rounded-xl p-3 text-center">
              <Zap className="w-4 h-4 text-blue-400 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-blue-400">Plus</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">AI Insights<br />Daily + Weekly</p>
            </div>
            <div className="flex items-center">
              <div className="w-px h-10 bg-border" />
            </div>
            <div className="flex-1 bg-primary/8 border border-primary/20 rounded-xl p-3 text-center">
              <Sparkles className="w-4 h-4 text-primary mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-primary">Premium</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Full AI Coach<br />Unlimited Chat</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {PLANS.map((plan, i) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-5 border transition-all ${
                plan.highlight ? "glass-card glow-gold border-primary/30" : "glass-card border-border"
              }`}>
              {plan.highlight && (
                <div className="flex items-center gap-1.5 mb-3">
                  <Crown className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Most Powerful</span>
                </div>
              )}

              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-playfair text-lg font-semibold text-foreground">{plan.name}</h3>
                  {plan.badge && (
                    <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${plan.badgeColor}`}>
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-foreground">{plan.price}</span>
                  <p className="text-[10px] text-muted-foreground">{plan.period}</p>
                </div>
              </div>
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
                <div className={`rounded-xl p-3 mb-3 border ${plan.highlight ? "border-primary/20 bg-primary/5" : "border-blue-400/20 bg-blue-400/5"}`}>
                  <p className={`text-[10px] uppercase tracking-widest font-semibold mb-2 ${plan.highlight ? "text-primary" : "text-blue-400"}`}>
                    {plan.aiFeature.label}
                  </p>
                  <div className="space-y-1">
                    {plan.aiFeature.items.map((item, ii) => (
                      <div key={ii} className="flex items-center gap-2">
                        <div className={`w-1 h-1 rounded-full shrink-0 ${plan.highlight ? "bg-primary" : "bg-blue-400"}`} />
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

              <button
                disabled={plan.id === "free"}
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
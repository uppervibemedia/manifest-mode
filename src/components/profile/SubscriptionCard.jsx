import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Crown, Zap, Sparkles, RefreshCw, Plus } from "lucide-react";

const TIER_CONFIG = {
  free: {
    label: "Free",
    color: "text-muted-foreground",
    borderColor: "border-border",
    bgColor: "bg-muted/30",
    includedCredits: 0,
    includedAI: "No AI access",
  },
  supporter: {
    label: "Plus",
    color: "text-blue-400",
    borderColor: "border-blue-400/30",
    bgColor: "bg-blue-400/5",
    includedCredits: 0,
    includedAI: "1 daily insight · 1 weekly summary",
  },
  premium: {
    label: "Premium",
    color: "text-primary",
    borderColor: "border-primary/30",
    bgColor: "bg-primary/5",
    includedCredits: 20,
    includedAI: "Full AI Coach · 20 credits/mo included",
  },
};

const CREDIT_PACKS = [
  { type: "small", label: "Small Pack", credits: 10, price: "$4", desc: "Quick top-up" },
  { type: "medium", label: "Medium Pack", credits: 30, price: "$9", desc: "Best value" },
  { type: "large", label: "Large Pack", credits: 75, price: "$19", desc: "Power user" },
];

export default function SubscriptionCard({ profile, creditBalance, onBuyCredits }) {
  const navigate = useNavigate();
  const tier = profile?.subscription_tier || "free";
  const cycle = profile?.billing_cycle || "monthly";
  const config = TIER_CONFIG[tier];
  const isLowCredits = tier === "premium" && creditBalance <= 5;
  const canBuyCredits = tier === "supporter" || tier === "premium";

  // Simulated renewal date (30 days from now if not set)
  const renewalDate = profile?.renewal_date || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
  })();

  return (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Subscription & AI Credits</p>

      {/* Plan card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className={`glass-card border rounded-2xl p-4 mb-3 ${config.borderColor}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Crown className={`w-4 h-4 ${config.color}`} />
              <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
              {tier !== "free" && (
                <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground border border-border rounded-full px-1.5 py-0.5 capitalize">
                  {cycle}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{config.includedAI}</p>
          </div>
          <button onClick={() => navigate("/pricing")}
            className="text-[10px] font-semibold text-primary border border-primary/30 rounded-full px-2.5 py-1 hover:border-primary/60 transition-colors">
            {tier === "free" ? "Upgrade" : "Change Plan"}
          </button>
        </div>

        {tier !== "free" && (
          <div className="flex items-center gap-2 pt-3 border-t border-border/50">
            <RefreshCw className="w-3 h-3 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">Renews {renewalDate}</p>
          </div>
        )}
      </motion.div>

      {/* AI Credits card */}
      {tier === "free" ? (
        <div className="glass-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">AI Credits</p>
            <p className="text-xs text-muted-foreground mt-0.5">Available on Plus & Premium plans</p>
          </div>
          <button onClick={() => navigate("/pricing")}
            className="text-[10px] font-semibold text-primary border border-primary/30 rounded-full px-2.5 py-1">
            Upgrade
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className={`glass-card border rounded-2xl p-4 ${isLowCredits ? "border-orange-400/30" : "border-border"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isLowCredits ? "text-orange-400" : "text-primary"}`} />
              <p className="text-sm font-semibold text-foreground">AI Credits</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`font-playfair text-xl font-bold ${isLowCredits ? "text-orange-400" : "text-primary"}`}>
                {creditBalance}
              </span>
              <span className="text-xs text-muted-foreground">remaining</span>
            </div>
          </div>

          {isLowCredits && (
            <div className="bg-orange-400/8 border border-orange-400/20 rounded-xl px-3 py-2 mb-3">
              <p className="text-[11px] text-orange-400 font-medium">Credits running low — top up to keep using advanced AI features</p>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
            Credits are used for advanced AI features: deep blueprint refresh, belief analysis, extra coach sessions, and custom strategy sessions.
          </p>

          {/* Credit packs */}
          {canBuyCredits && (
            <>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">Top Up Credits</p>
              <div className="grid grid-cols-3 gap-2">
                {CREDIT_PACKS.map((pack) => (
                  <button key={pack.type}
                    onClick={() => onBuyCredits && onBuyCredits(pack)}
                    className="glass-card border border-border rounded-xl p-2.5 text-center hover:border-primary/40 transition-colors">
                    <p className="font-playfair text-base font-bold text-primary">{pack.credits}</p>
                    <p className="text-[9px] text-muted-foreground">credits</p>
                    <p className="text-xs font-semibold text-foreground mt-1">{pack.price}</p>
                    <p className="text-[9px] text-primary/70 mt-0.5">{pack.desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/50 text-center mt-2">Credits never expire for Premium users</p>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const BLUEPRINT_SECTIONS = [
  { key: "identity", label: "Identity", icon: "🧬", desc: "Who you are becoming" },
  { key: "mindset", label: "How You Think", icon: "🧠", desc: "Beliefs that drive you" },
  { key: "habits", label: "Daily Habits", icon: "⚡", desc: "How you move through each day" },
  { key: "money", label: "Money Mindset", icon: "💰", desc: "Your financial operating system" },
  { key: "health", label: "Health Standards", icon: "💪", desc: "Your body, your non-negotiables" },
  { key: "standards", label: "What You No Longer Tolerate", icon: "🛡️", desc: "Your boundaries and standards" },
];

function generateBlueprint(analysis) {
  if (!analysis) return null;
  return {
    identity: analysis.future_self_statement,
    mindset: analysis.replacement_beliefs?.join(" • ") || "Operate from certainty, not hope. Think long-term.",
    habits: analysis.habit_upgrades?.join(" • ") || "Morning routine, movement, deep work, reflection.",
    money: "You track every dollar, invest consistently, and build multiple income streams. You think in assets, not expenses.",
    health: "Your body is your vehicle for execution. You sleep 7-8 hours, train 4-5 days a week, and protect your energy ruthlessly.",
    standards: analysis.identity_shifts?.join(" • ") || "You no longer tolerate distraction, self-doubt, or environments that pull you down.",
  };
}

export default function Blueprint() {
  const [analysis, setAnalysis] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const [analyses, profiles] = await Promise.all([
        base44.entities.AIAnalysis.filter({ user_email: user.email }, "-created_date", 1),
        base44.entities.UserProfile.filter({ user_email: user.email }),
      ]);
      setAnalysis(analyses[0] || null);
      setProfile(profiles[0] || null);
      setLoading(false);
    })();
  }, []);

  const tier = profile?.subscription_tier || "free";
  const hasAccess = tier === "premium";
  const blueprint = generateBlueprint(analysis);

  if (loading) return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Identity Upgrade</p>
          <h1 className="font-playfair text-2xl font-semibold">Future Self Blueprint</h1>
          <p className="text-sm text-muted-foreground mt-1">The operating manual of your evolved identity</p>
        </div>

        {!analysis ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-playfair text-xl font-semibold mb-2">Blueprint Not Generated</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs">Complete your assessment to generate your personalized Future Self Blueprint</p>
            <button onClick={() => navigate("/assessment")}
              className="px-6 py-3 gold-gradient text-background font-semibold rounded-xl flex items-center gap-2">
              Take Assessment <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Future self statement */}
            <div className="glass-card glow-gold rounded-2xl p-5 mb-5 border border-primary/20">
              <p className="text-xs uppercase tracking-widest text-primary font-medium mb-2">Your Future Self Is</p>
              <p className="text-base text-foreground leading-relaxed font-medium">
                {blueprint?.identity}
              </p>
            </div>

            {/* Sections */}
            {BLUEPRINT_SECTIONS.filter(s => s.key !== "identity").map((section, i) => {
              const locked = !hasAccess && i > 1;
              return (
                <motion.div key={section.key}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className={`glass-card rounded-2xl p-4 mb-3 border transition-all ${
                    locked ? "border-border opacity-60" : "border-border hover:border-primary/20"
                  }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{section.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{section.label}</p>
                        {locked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                      {locked ? (
                        <p className="text-sm text-muted-foreground/40">Upgrade to Premium to unlock</p>
                      ) : (
                        <p className="text-sm text-foreground/80 leading-relaxed">{blueprint?.[section.key]}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Action plan */}
            {analysis.action_plan && (
              <div className="glass-card rounded-2xl p-4 mb-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Your Activation Steps</p>
                <div className="space-y-2">
                  {analysis.action_plan.slice(0, hasAccess ? 5 : 2).map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs font-bold text-primary shrink-0 mt-0.5">{i + 1}.</span>
                      <p className="text-sm text-foreground/80 leading-relaxed">{step}</p>
                    </div>
                  ))}
                  {!hasAccess && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">+{analysis.action_plan.length - 2} more steps</p>
                      <button onClick={() => navigate("/pricing")}
                        className="text-xs text-primary font-medium">Upgrade to Premium →</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!hasAccess && (
              <button onClick={() => navigate("/pricing")}
                className="w-full py-4 gold-gradient text-background font-semibold rounded-xl flex items-center justify-center gap-2 mt-2">
                <Sparkles className="w-4 h-4" /> Unlock Full Blueprint — Premium
              </button>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
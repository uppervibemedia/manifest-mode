import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Lock, ChevronLeft, Sparkles, MessageCircle, ArrowRight } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const BLUEPRINT_SECTIONS = [
  { key: "identity", label: "Your Future Self Is", icon: "🧬", premium: false },
  { key: "mindset", label: "How You Think", icon: "🧠", premium: false },
  { key: "standards", label: "Your Daily Standards", icon: "⭐", premium: false },
  { key: "money", label: "Money Standards", icon: "💰", premium: true },
  { key: "health", label: "Health Standards", icon: "💪", premium: true },
  { key: "boundaries", label: "What You No Longer Tolerate", icon: "🛡️", premium: true },
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
  const [latestScore, setLatestScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const [analyses, profiles, scores] = await Promise.all([
        base44.entities.AIAnalysis.filter({ user_email: user.email }, "-created_date", 1),
        base44.entities.UserProfile.filter({ user_email: user.email }),
        base44.entities.ScoreHistory.filter({ user_email: user.email }, "-created_date", 1),
      ]);
      setAnalysis(analyses[0] || null);
      setProfile(profiles[0] || null);
      setLatestScore(scores[0] || null);
      setLoading(false);
    })();
  }, []);

  const tier = profile?.subscription_tier || "free";
  const hasAccess = tier === "premium";
  const blueprint = generateBlueprint(analysis);

  if (loading) {
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
      <div className="px-5 pt-12 pb-32">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Identity Upgrade</p>
          <h1 className="font-playfair text-2xl font-semibold">Future Self Blueprint</h1>
          <p className="text-xs text-muted-foreground mt-0.5">The operating manual of your evolved identity</p>
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
            {/* Future Self Blueprint Sections */}
            <div className="space-y-3 mb-8">
              {BLUEPRINT_SECTIONS.map((section, i) => {
                const locked = section.premium && !hasAccess;
                return (
                  <motion.div key={section.key}
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className={`glass-card rounded-2xl p-5 border transition-all ${
                      locked ? "border-border/40 opacity-50" : section.key === "identity" ? "border-primary/30 bg-primary/5 glow-gold" : "border-border hover:border-primary/20"
                    }`}>
                    <div className="flex items-start gap-4">
                      <span className="text-3xl mt-0.5 shrink-0">{section.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{section.label}</p>
                          {locked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        {locked ? (
                          <p className="text-sm text-muted-foreground/50 italic">Premium feature. Upgrade to unlock.</p>
                        ) : (
                          <p className={`text-sm leading-relaxed ${section.key === "identity" ? "text-foreground font-medium" : "text-foreground/80"}`}>
                            {blueprint?.[section.key]}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Activation Steps */}
            {analysis.action_plan && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="glass-card rounded-2xl p-5 mb-8 border border-border">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">Your Activation Steps</p>
                <div className="space-y-3">
                  {analysis.action_plan.slice(0, hasAccess ? 10 : 3).map((step, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
                      className="flex items-start gap-3">
                      <span className="text-xs font-bold text-primary shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center rounded-lg bg-primary/10">
                        {i + 1}
                      </span>
                      <p className="text-sm text-foreground/80 leading-relaxed">{step}</p>
                    </motion.div>
                  ))}
                </div>
                {!hasAccess && analysis.action_plan.length > 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-3">+{analysis.action_plan.length - 3} more activation steps</p>
                    <button onClick={() => navigate("/pricing")}
                      className="w-full py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary font-semibold hover:bg-primary/15 transition-colors">
                      Unlock Full Blueprint — Premium
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* AI Coaching Section */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="glass-card glow-gold rounded-2xl p-5 border border-primary/25">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Guidance</p>
                  <h3 className="font-playfair text-lg font-semibold text-foreground">Ask Your Future Self Coach</h3>
                  <p className="text-xs text-muted-foreground mt-1">Get personalized coaching based on your blueprint and alignment</p>
                </div>
              </div>
              <button onClick={() => navigate("/coach")}
                className="w-full py-3 gold-gradient text-background font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all">
                <Sparkles className="w-4 h-4" /> Start Coaching Session
              </button>
            </motion.div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
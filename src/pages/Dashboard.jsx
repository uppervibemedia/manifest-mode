import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Sparkles, ChevronRight, Check, Plus, RefreshCw, Flame } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const MOTIVATIONS = [
  "Your future responds to who you become daily.",
  "Shift your identity, shift your life.",
  "Align with your future — it's already waiting.",
  "Your habits shape your reality. Choose wisely.",
  "Become the version of you that matches the vision.",
  "Every daily action is a vote for your future self.",
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [latestScore, setLatestScore] = useState(null);
  const [shiftPlan, setShiftPlan] = useState(null);
  const [checkinDone, setCheckinDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const motivation = MOTIVATIONS[new Date().getDay() % MOTIVATIONS.length];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [profiles, scores, plans, checkins] = await Promise.all([
      base44.entities.UserProfile.filter({ user_email: u.email }),
      base44.entities.ScoreHistory.filter({ user_email: u.email }, "-created_date", 1),
      base44.entities.DailyShiftPlan.filter({ user_email: u.email, plan_date: today }),
      base44.entities.DailyCheckIn.filter({ user_email: u.email, checkin_date: today }),
    ]);
    setProfile(profiles[0] || null);
    setLatestScore(scores[0] || null);
    setShiftPlan(plans[0] || null);
    setCheckinDone(checkins.length > 0);
    setLoading(false);
  };

  const scoreColor = (s) => {
    if (!s) return "text-muted-foreground";
    if (s >= 75) return "text-emerald-400";
    if (s >= 50) return "text-yellow-400";
    return "text-orange-400";
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const needsAssessment = !latestScore;
  const habitsDone = shiftPlan?.completed_habits?.length || 0;
  const habitsTotal = shiftPlan?.habits?.length || 3;

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-4 relative">
        {/* Background gradient */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Good {getTimeOfDay()}</p>
            <h1 className="font-playfair text-2xl font-semibold text-foreground">
              {user?.full_name?.split(" ")[0] || "Welcome"} ✦
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Flame className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">{profile?.streak_count || 0} day streak</span>
          </div>
        </div>

        {/* Daily quote */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4 mb-5 border-l-2 border-primary/50">
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground/80 italic leading-relaxed">"{motivation}"</p>
          </div>
        </motion.div>

        {/* Reality Match Score */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5 mb-4 cursor-pointer glow-gold"
          onClick={() => navigate("/score")}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Reality Match Score</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Your alignment with your vision</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-end gap-3">
            <span className={`font-playfair text-5xl font-bold ${scoreColor(latestScore?.overall_score)}`}>
              {latestScore?.overall_score ?? "—"}
            </span>
            {latestScore && <span className="text-muted-foreground text-sm mb-2">/100</span>}
          </div>
          {!latestScore && (
            <button onClick={(e) => { e.stopPropagation(); navigate("/assessment"); }}
              className="mt-3 w-full py-2.5 gold-gradient text-background text-sm font-semibold rounded-xl flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Take Your First Assessment
            </button>
          )}
          {latestScore && (
            <div className="mt-3 h-1.5 bg-border rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${latestScore.overall_score}%` }}
                transition={{ duration: 1, delay: 0.3 }} className="h-full gold-gradient rounded-full" />
            </div>
          )}
        </motion.div>

        {/* Daily Shift Plan */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-5 mb-4 cursor-pointer"
          onClick={() => navigate("/shift-plan")}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Daily Shift Plan</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Today's alignment actions</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          {shiftPlan ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(habitsDone / habitsTotal) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{habitsDone}/{habitsTotal}</span>
              </div>
              <p className="text-xs text-primary/80 italic">"{shiftPlan.affirmation}"</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Complete an assessment to unlock your personalized plan</p>
          )}
        </motion.div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            onClick={() => navigate("/vision-vault")}
            className="glass-card rounded-xl p-4 text-left hover:border-primary/30 transition-colors border border-border">
            <span className="text-2xl block mb-2">🖼️</span>
            <p className="text-sm font-semibold text-foreground">Vision Vault</p>
            <p className="text-xs text-muted-foreground mt-0.5">View your goals</p>
          </motion.button>

          <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            onClick={() => navigate("/checkin")}
            className={`glass-card rounded-xl p-4 text-left transition-colors border ${
              checkinDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-border hover:border-primary/30"
            }`}>
            {checkinDone ? <Check className="w-6 h-6 text-emerald-400 mb-2" /> : <span className="text-2xl block mb-2">📊</span>}
            <p className="text-sm font-semibold text-foreground">Daily Check-in</p>
            <p className="text-xs text-muted-foreground mt-0.5">{checkinDone ? "Done today ✓" : "Log your state"}</p>
          </motion.button>

          <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            onClick={() => navigate("/blueprint")}
            className="glass-card rounded-xl p-4 text-left hover:border-primary/30 transition-colors border border-border">
            <span className="text-2xl block mb-2">🧬</span>
            <p className="text-sm font-semibold text-foreground">Future Self</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your blueprint</p>
          </motion.button>

          <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
            onClick={() => navigate("/journal")}
            className="glass-card rounded-xl p-4 text-left hover:border-primary/30 transition-colors border border-border">
            <span className="text-2xl block mb-2">📝</span>
            <p className="text-sm font-semibold text-foreground">Journal</p>
            <p className="text-xs text-muted-foreground mt-0.5">Reflect & grow</p>
          </motion.button>
        </div>

        {/* Assessment CTA if needed */}
        {needsAssessment && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            onClick={() => navigate("/assessment")}
            className="w-full glass-card border border-primary/30 rounded-2xl p-5 text-left flex items-center gap-4 hover:border-primary/60 transition-colors">
            <div className="w-12 h-12 gold-gradient rounded-xl flex items-center justify-center shrink-0 text-background">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Complete Your Assessment</p>
              <p className="text-xs text-muted-foreground mt-0.5">Get your Reality Match Score</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        )}
      </div>
    </AppLayout>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
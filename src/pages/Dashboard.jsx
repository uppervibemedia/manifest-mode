import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Sparkles, ChevronRight, Check, Plus, RefreshCw, Flame, TrendingUp, BarChart3, Eye, Zap } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import AccountabilityBanner from "@/components/notifications/AccountabilityBanner";
import PinnedVisionsWidget from "@/components/vision/PinnedVisionsWidget";
import DashboardHabitWidget from "@/components/habits/DashboardHabitWidget";
import { getLevelForPoints } from "@/lib/identityEngine";

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
  const [prevScore, setPrevScore] = useState(null);
  const [shiftPlan, setShiftPlan] = useState(null);
  const [checkinDone, setCheckinDone] = useState(false);
  const [visionCount, setVisionCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [recentCheckin, setRecentCheckin] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const motivation = MOTIVATIONS[new Date().getDay() % MOTIVATIONS.length];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [profiles, scores, plans, checkins, visions, journals] = await Promise.all([
      base44.entities.UserProfile.filter({ user_email: u.email }),
      base44.entities.ScoreHistory.filter({ user_email: u.email }, "-created_date", 5),
      base44.entities.DailyShiftPlan.filter({ user_email: u.email, plan_date: today }),
      base44.entities.DailyCheckIn.filter({ user_email: u.email }, "-created_date", 2),
      base44.entities.VisionItem.filter({ user_email: u.email, is_active: true }),
      base44.entities.JournalEntry.filter({ user_email: u.email }, "-created_date", 1),
    ]);
    setProfile(profiles[0] || null);
    setLatestScore(scores[0] || null);
    setPrevScore(scores[1] || null);
    setShiftPlan(plans[0] || null);
    setCheckinDone(checkins.some(c => c.checkin_date === today));
    setRecentCheckin(checkins[0] || null);
    setVisionCount(visions.length);
    setJournalCount(journals.length);
    setLoading(false);
  };

  const scoreColor = (s) => {
    if (!s) return "text-muted-foreground";
    if (s >= 75) return "text-emerald-400";
    if (s >= 50) return "text-yellow-400";
    return "text-orange-400";
  };

  const scoreDelta = latestScore && prevScore ? latestScore.overall_score - prevScore.overall_score : null;

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
  const habitPct = Math.round((habitsDone / habitsTotal) * 100);

  return (
    <AppLayout>
      <AccountabilityBanner />
      <div className="px-5 pt-4 pb-4 relative">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Good {getTimeOfDay()}</p>
            <h1 className="font-playfair text-2xl font-semibold text-foreground">
              {user?.full_name?.split(" ")[0] || "Welcome"}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
              <Flame className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">{profile?.streak_count || 0} day streak</span>
            </div>
            {profile && (() => {
              const lvl = getLevelForPoints(profile.alignment_points || 0);
              return (
                <button onClick={() => navigate("/profile")}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-semibold"
                  style={{ borderColor: lvl.color + "40", color: lvl.color, background: lvl.color + "12" }}>
                  <span>{lvl.symbol}</span> {lvl.title}
                </button>
              );
            })()}
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



        {/* ── PROJECT OVERVIEW CARDS ── */}
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Overview</p>

        {/* Reality Match Score card */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="glass-card rounded-2xl p-5 mb-3 cursor-pointer glow-gold"
          onClick={() => navigate("/progress")}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Reality Match Score</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          {latestScore ? (
            <>
              <div className="flex items-end gap-2 mb-3">
                <span className={`font-playfair text-4xl font-bold ${scoreColor(latestScore.overall_score)}`}>
                  {latestScore.overall_score}
                </span>
                <span className="text-muted-foreground text-sm mb-1">/100</span>
                {scoreDelta !== null && (
                  <span className={`text-xs font-semibold mb-1.5 ml-1 ${scoreDelta >= 0 ? "text-emerald-400" : "text-orange-400"}`}>
                    {scoreDelta >= 0 ? "↑" : "↓"} {Math.abs(scoreDelta)} from last
                  </span>
                )}
              </div>
              {/* Category mini-bars */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Mindset", val: latestScore.mindset_score },
                  { label: "Discipline", val: latestScore.discipline_score },
                  { label: "Health", val: latestScore.health_score },
                  { label: "Finance", val: latestScore.financial_score },
                  { label: "Confidence", val: latestScore.confidence_score },
                  { label: "Environ.", val: latestScore.environment_score },
                ].map(c => (
                  <div key={c.label}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] text-muted-foreground">{c.label}</span>
                      <span className="text-[9px] font-semibold" style={{ color: c.val >= 75 ? "#34d399" : c.val >= 50 ? "#fbbf24" : "#f97316" }}>{c.val}</span>
                    </div>
                    <div className="h-1 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.val}%`, backgroundColor: c.val >= 75 ? "#34d399" : c.val >= 50 ? "#fbbf24" : "#f97316" }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); navigate("/assessment"); }}
              className="mt-2 w-full py-2.5 gold-gradient text-background text-sm font-semibold rounded-xl flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Take Your First Assessment
            </button>
          )}
        </motion.div>

        {/* Vision & Journal summary row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}
            onClick={() => navigate("/vision-vault")}
            className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Vision Board</p>
            </div>
            <p className="font-playfair text-2xl font-bold text-foreground">{visionCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">living visions</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}
            onClick={() => navigate(checkinDone ? "/tracker" : "/checkin")}
            className={`glass-card rounded-xl p-4 cursor-pointer transition-colors border ${
              checkinDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-border hover:border-primary/30"
            }`}>
            <div className="flex items-center gap-2 mb-2">
              {checkinDone
                ? <Check className="w-4 h-4 text-emerald-400" />
                : <TrendingUp className="w-4 h-4 text-blue-400" />}
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Daily Habits</p>
            </div>
            {checkinDone && recentCheckin ? (
              <>
                <p className="font-playfair text-2xl font-bold text-emerald-400">{recentCheckin.energy}<span className="text-sm text-muted-foreground">/10</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">energy today</p>
              </>
            ) : (
              <>
                <p className="font-playfair text-2xl font-bold text-foreground">—</p>
                <p className="text-xs text-primary mt-0.5">Log now →</p>
              </>
            )}
          </motion.div>
        </div>



        {/* Pinned Visions */}
        <PinnedVisionsWidget />

        {/* Future Self Coach CTA */}
        <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }}
          onClick={() => navigate("/coach")}
          className="w-full glass-card glow-gold rounded-2xl p-4 mb-3 border border-primary/25 flex items-center gap-4 hover:border-primary/50 transition-colors text-left">
          <div className="w-11 h-11 gold-gradient rounded-xl flex items-center justify-center shrink-0 text-background">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Future Self Coach</p>
            <p className="text-xs text-muted-foreground mt-0.5">Get personalized AI coaching now</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </motion.button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            onClick={() => navigate("/blueprint")}
            className="glass-card rounded-xl p-4 text-left hover:border-primary/30 transition-colors border border-border">
            <span className="text-2xl block mb-2">🧬</span>
            <p className="text-sm font-semibold text-foreground">Future Self</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your blueprint</p>
          </motion.button>

          <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}
            onClick={() => navigate("/journal")}
            className="glass-card rounded-xl p-4 text-left hover:border-primary/30 transition-colors border border-border">
            <span className="text-2xl block mb-2">📝</span>
            <p className="text-sm font-semibold text-foreground">Journal</p>
            <p className="text-xs text-muted-foreground mt-0.5">Reflect & grow</p>
          </motion.button>
        </div>

        {/* Assessment CTA */}
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
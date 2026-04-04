import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, Crown, RefreshCw, Loader2 } from "lucide-react";

// Supporter/Plus tier: daily AI insight + weekly summary. No interactive chat.
export default function AIInsightsPanel({ profile, score, analysis }) {
  const navigate = useNavigate();
  const [dailyInsight, setDailyInsight] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [insightGenerated, setInsightGenerated] = useState(false);
  const [weeklyGenerated, setWeeklyGenerated] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Check localStorage to enforce one-per-day limit
  const storageKey = `ai_insight_${profile?.user_email}_${today}`;
  const weekKey = `ai_weekly_${profile?.user_email}_${getWeekKey()}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) { setDailyInsight(saved); setInsightGenerated(true); }
    const savedWeekly = localStorage.getItem(weekKey);
    if (savedWeekly) { setWeeklySummary(savedWeekly); setWeeklyGenerated(true); }
  }, []);

  function getWeekKey() {
    const d = new Date();
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${d.getFullYear()}_w${week}`;
  }

  const generateDailyInsight = async () => {
    if (insightGenerated || loadingInsight) return;
    setLoadingInsight(true);
    const scoreText = score ? `Reality Match Score: ${score.overall_score}/100.` : "No score yet.";
    const topBlock = analysis?.misalignment_summary || "general growth";
    const prompt = `You are a premium personal development coach inside the Manifest Mode app. 
The user's ${scoreText} Their key growth area: ${topBlock}. 
Their streak: ${profile?.streak_count || 0} days.

Generate ONE sharp, practical daily insight for them. 2-3 sentences max. 
Be direct and personal. No motivational fluff. Focus on identity, execution, or mindset. 
Do NOT start with "I" or use the word "journey". Write as if speaking directly to them.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    const text = typeof result === "string" ? result : result?.response || result?.text || "";
    setDailyInsight(text);
    setInsightGenerated(true);
    localStorage.setItem(storageKey, text);
    setLoadingInsight(false);
  };

  const generateWeeklySummary = async () => {
    if (weeklyGenerated || loadingWeekly) return;
    setLoadingWeekly(true);
    const scoreText = score ? `Reality Match Score: ${score.overall_score}/100 (Mindset: ${score.mindset_score}, Discipline: ${score.discipline_score}, Health: ${score.health_score}).` : "No score yet.";
    const strengths = analysis?.strengths_summary || "commitment to growth";
    const blocks = analysis?.misalignment_summary || "consistency gaps";
    const prompt = `You are a premium coach inside Manifest Mode. 
User data: ${scoreText} Strengths: ${strengths}. Growth areas: ${blocks}. Streak: ${profile?.streak_count || 0} days.

Write a brief weekly progress summary for this user. 3-4 sentences. 
Cover: what's working, where to focus this week, and one specific action to take. 
Be precise, personal, and results-focused. Avoid clichés.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    const text = typeof result === "string" ? result : result?.response || result?.text || "";
    setWeeklySummary(text);
    setWeeklyGenerated(true);
    localStorage.setItem(weekKey, text);
    setLoadingWeekly(false);
  };

  return (
    <div className="flex flex-col gap-4 px-5 pt-10 pb-6">
      {/* Header */}
      <div className="mb-1">
        <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">AI Insights</p>
        <h1 className="font-playfair text-2xl font-semibold">Your Daily Intelligence</h1>
        <p className="text-xs text-muted-foreground mt-1">Personalized insights powered by your data</p>
      </div>

      {/* Tier notice */}
      <div className="glass-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">Plus Plan · AI Insights</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">1 daily insight · 1 weekly summary per week</p>
        </div>
        <button onClick={() => navigate("/pricing")}
          className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-primary border border-primary/30 rounded-full px-2.5 py-1 hover:border-primary/60 transition-colors">
          <Crown className="w-3 h-3" /> Full Coach
        </button>
      </div>

      {/* Daily Insight card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Today's Insight</p>
          </div>
          {insightGenerated && (
            <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-medium">Used today</span>
          )}
        </div>

        {dailyInsight ? (
          <p className="text-sm text-foreground/85 leading-relaxed">{dailyInsight}</p>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Get a sharp, personalized insight based on your Reality Match Score and current gaps. One per day.
            </p>
            <button onClick={generateDailyInsight} disabled={loadingInsight}
              className="px-5 py-2.5 gold-gradient text-background text-sm font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50">
              {loadingInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loadingInsight ? "Generating..." : "Generate Today's Insight"}
            </button>
          </div>
        )}
      </motion.div>

      {/* Weekly Summary card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Weekly Summary</p>
          </div>
          {weeklyGenerated && (
            <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-medium">This week</span>
          )}
        </div>

        {weeklySummary ? (
          <p className="text-sm text-foreground/85 leading-relaxed">{weeklySummary}</p>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              A focused summary of your progress, strengths, and one key action for the week ahead. One per week.
            </p>
            <button onClick={generateWeeklySummary} disabled={loadingWeekly}
              className="px-5 py-2.5 bg-card border border-border text-foreground text-sm font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50 hover:border-primary/30 transition-colors">
              {loadingWeekly ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {loadingWeekly ? "Generating..." : "Generate Weekly Summary"}
            </button>
          </div>
        )}
      </motion.div>

      {/* Upgrade CTA */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card glow-gold border border-primary/25 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-primary" />
          <p className="text-xs uppercase tracking-widest text-primary/70 font-medium">Premium · Full AI Coach</p>
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">Unlock interactive coaching</p>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Get full access to your Future Self Coach — interactive chat, belief reframes, reset plans, situational coaching, and goal-specific guidance tied to your Blueprint and Score.
        </p>
        <div className="space-y-1.5 mb-4">
          {[
            "Unlimited AI Coach conversations",
            "Situational & belief reframe coaching",
            "Reset plans after setbacks",
            "Goal-specific Blueprint guidance",
            "Score-linked coaching sessions",
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary" />
              <span className="text-xs text-foreground/80">{f}</span>
            </div>
          ))}
        </div>
        <button onClick={() => navigate("/pricing")}
          className="w-full py-3 gold-gradient text-background text-sm font-semibold rounded-xl flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" /> Upgrade to Premium
        </button>
      </motion.div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Sparkles, Lock, ChevronDown, ChevronUp, Brain, Loader2, TrendingUp, TrendingDown } from "lucide-react";

export default function WeeklyPatternPanel({ userEmail, scores, tier }) {
  const [summaryData, setSummaryData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [expandedAI, setExpandedAI] = useState(false);
  const [habitLogs, setHabitLogs] = useState([]);

  const canAccessAI = tier === "supporter" || tier === "premium";

  // Fetch habit logs from last 7 days
  useEffect(() => {
    if (!userEmail) return;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    base44.entities.HabitLog.filter(
      { user_email: userEmail },
      "-log_date",
      100
    ).then(logs => {
      const recentLogs = logs.filter(l => l.log_date >= dateStr);
      setHabitLogs(recentLogs);
    });
  }, [userEmail]);

  // Generate weekly summary from scores
  useEffect(() => {
    if (!scores || scores.length === 0) {
      setSummaryData(null);
      return;
    }

    try {
      // Get last 7 days of scores
      const weekScores = scores.slice(0, 7).reverse();
      
      if (weekScores.length === 0) {
        setSummaryData(null);
        return;
      }

      // Calculate weekly stats
      const avgScore = Math.round(
        weekScores.reduce((sum, s) => sum + (s.overall_score || 0), 0) / weekScores.length
      );

      const scoreMovement = weekScores[weekScores.length - 1].overall_score - weekScores[0].overall_score;
      
      const categories = [
        { name: "Mindset", key: "mindset_score" },
        { name: "Discipline", key: "discipline_score" },
        { name: "Health", key: "health_score" },
        { name: "Financial", key: "financial_score" },
        { name: "Confidence", key: "confidence_score" },
        { name: "Environment", key: "environment_score" },
      ];

      const categoryAvgs = categories.map(cat => ({
        name: cat.name,
        avg: Math.round(
          weekScores.reduce((sum, s) => sum + (s[cat.key] || 0), 0) / weekScores.length
        ),
      })).sort((a, b) => b.avg - a.avg);

      const strongest = categoryAvgs[0];
      const weakest = categoryAvgs[categoryAvgs.length - 1];
      const completions = weekScores.filter(s => s.overall_score >= 50).length;

      setSummaryData({
        avgScore,
        scoreMovement,
        completions,
        daysTracked: weekScores.length,
        strongest,
        weakest,
      });
    } catch (e) {
      console.error("Weekly summary error:", e);
    }
  }, [scores]);

  // Generate AI analysis for Plus+ users
  const generateAIAnalysis = async () => {
    if (!canAccessAI || !summaryData) return;
    setLoadingAI(true);
    setExpandedAI(true);

    try {
      const weekScores = scores.slice(0, 7).reverse();
      const avgsByCategory = [
        { name: "Mindset", key: "mindset_score" },
        { name: "Discipline", key: "discipline_score" },
        { name: "Health", key: "health_score" },
        { name: "Financial", key: "financial_score" },
        { name: "Confidence", key: "confidence_score" },
        { name: "Environment", key: "environment_score" },
      ].map(cat => ({
        name: cat.name,
        avg: Math.round(
          weekScores.reduce((sum, s) => sum + (s[cat.key] || 0), 0) / weekScores.length
        ),
      }));

      // Analyze habit completion patterns
      const habitStats = habitLogs.reduce((acc, log) => {
        const category = log.category || 'uncategorized';
        if (!acc[category]) acc[category] = { total: 0, completed: 0 };
        acc[category].total++;
        if (log.completed) acc[category].completed++;
        return acc;
      }, {});

      const habitsAnalysis = Object.entries(habitStats)
        .map(([cat, stats]) => `${cat}: ${stats.completed}/${stats.total} completed`)
        .join("; ");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite performance coach analyzing a user's weekly alignment data based on their actual behavior.

Weekly Stats:
- Average Reality Match Score: ${displayData.avgScore}/100
- Score Movement: ${displayData.scoreMovement > 0 ? "+" : ""}${displayData.scoreMovement} points
- Days Tracked: ${displayData.daysTracked}/7
- Strongest Area: ${displayData.strongest.name} (${displayData.strongest.avg})
- Weakest Area: ${displayData.weakest.name} (${displayData.weakest.avg})

Weekly Habit Performance:
${habitsAnalysis || "No habits tracked"}

Category Breakdown:
${avgsByCategory.map(c => `- ${c.name}: ${c.avg}`).join("\n")}

Provide a detailed weekly pattern analysis based on their ACTUAL BEHAVIOR:
1. "insight": A specific insight about their week based on their habit completion and score patterns
2. "pattern": Why this pattern is happening - connect their habit behavior to their scores
3. "recommendation": One specific, actionable habit change based on their weakest area and habit data
4. "nextFocus": What to emphasize next week based on what worked and what didn't

Be personal, specific to their data, and motivational.

Return ONLY valid JSON:
{
  "insight": "...",
  "pattern": "...",
  "recommendation": "...",
  "nextFocus": "..."
}`,
        response_json_schema: {
          type: "object",
          properties: {
            insight: { type: "string" },
            pattern: { type: "string" },
            recommendation: { type: "string" },
            nextFocus: { type: "string" },
          },
        },
      });

      if (result) {
        setAiAnalysis(result);
      }
    } catch (e) {
      console.error("AI analysis error:", e);
    } finally {
      setLoadingAI(false);
    }
  };



  // Use calculated summary data or provide default if still calculating
  const displayData = summaryData || {
    avgScore: scores && scores.length > 0 ? Math.round(scores.slice(0, 7).reduce((sum, s) => sum + (s.overall_score || 0), 0) / Math.min(7, scores.length)) : 0,
    scoreMovement: 0,
    completions: 0,
    daysTracked: scores?.length || 0,
    strongest: { name: "Calculating...", avg: 0 },
    weakest: { name: "Calculating...", avg: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Header Box - Clickable when locked */}
      <motion.button
        onClick={() => {
          if (!canAccessAI) {
            window.location.href = "/pricing";
          } else if (!aiAnalysis && !loadingAI) {
            generateAIAnalysis();
          } else {
            setExpandedAI(e => !e);
          }
        }}
        className="w-full text-left glass-card rounded-2xl p-5 border border-border hover:border-primary/20 transition-colors mb-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-playfair text-lg font-semibold text-foreground mb-1">
                Weekly Pattern{" "}
                <span className="inline-flex items-center gap-1">
                  Analysis
                  <span className="text-[9px] uppercase tracking-widest font-bold text-primary bg-primary/15 border border-primary/30 rounded-full px-1.5 py-0.5">AI</span>
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">Last 7 days of alignment</p>
              {!canAccessAI && (
                <div className="flex items-center gap-2 mt-2">
                  <Lock className="w-3 h-3 text-muted-foreground/50" />
                  <span className="text-[9px] text-muted-foreground">Plus feature</span>
                </div>
              )}
            </div>
          </div>
          {!canAccessAI && (
            <span className="text-[11px] font-semibold text-primary border border-primary/30 rounded-full px-2 py-0.5 shrink-0">
              Unlock
            </span>
          )}
          {canAccessAI && (
            expandedAI ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </motion.button>

      {/* AI Analysis Content (Plus+ only) */}
      {canAccessAI && (
        <AnimatePresence>
          {expandedAI && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-3 mb-4"
            >
              {!aiAnalysis && !loadingAI ? (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground mb-3">Analyze your weekly patterns with AI</p>
                  <button
                    onClick={generateAIAnalysis}
                    className="px-4 py-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    Generate Analysis
                  </button>
                </div>
              ) : loadingAI ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 text-primary animate-spin mr-2" />
                  <span className="text-xs text-muted-foreground">Analyzing your week...</span>
                </div>
              ) : aiAnalysis ? (
                <>
                  <div className="glass-card border border-primary/25 rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold mb-1.5">✦ Weekly Insight</p>
                    <p className="text-sm text-foreground/85 leading-relaxed">{aiAnalysis.insight}</p>
                  </div>
                  <div className="glass-card border border-orange-400/20 rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-orange-400 font-semibold mb-1.5">⚡ Why This Pattern</p>
                    <p className="text-sm text-foreground/85 leading-relaxed">{aiAnalysis.pattern}</p>
                  </div>
                  <div className="glass-card border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold mb-1.5">→ Next Action</p>
                    <p className="text-sm text-foreground/85 leading-relaxed">{aiAnalysis.recommendation}</p>
                  </div>
                  <div className="glass-card border border-purple-400/20 rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-purple-400 font-semibold mb-1.5">🎯 Focus Next Week</p>
                    <p className="text-sm text-foreground/85 leading-relaxed">{aiAnalysis.nextFocus}</p>
                  </div>
                  <button
                    onClick={generateAIAnalysis}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-2"
                  >
                    <Sparkles className="w-3 h-3" /> Regenerate analysis
                  </button>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Strongest & Needs Focus (all users) */}
      <div className="space-y-3 mt-4">
        {/* Strongest Area */}
        <div className="glass-card rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold mb-2">Strongest Area</p>
          <p className="text-sm font-semibold text-foreground">{displayData.strongest.name} — You're in alignment here. Keep building.</p>
        </div>

        {/* Needs Focus Area */}
        <div className="glass-card rounded-xl p-4 border border-orange-400/20 bg-orange-400/5">
          <p className="text-[10px] uppercase tracking-widest text-orange-400 font-semibold mb-2">Needs Focus</p>
          <p className="text-sm font-semibold text-foreground">{displayData.weakest.name} — This area has room for growth.</p>
        </div>
      </div>
    </motion.div>
  );
}
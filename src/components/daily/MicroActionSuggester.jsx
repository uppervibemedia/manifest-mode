import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Sparkles, RefreshCw, Check, ChevronDown, ChevronUp } from "lucide-react";
import { getLocalToday } from "@/lib/dateUtils";

export default function MicroActionSuggester({ userEmail }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completed, setCompleted] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const [focusLabel, setFocusLabel] = useState("");

  useEffect(() => {
    if (userEmail) loadSuggestions();
  }, [userEmail]);

  const loadSuggestions = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const today = getLocalToday();
      const dayOfYear = Math.floor(
        (new Date(today) - new Date(new Date(today).getFullYear(), 0, 0)) / 86400000
      );

      const [analyses, scores, checkins, plans, entries] = await Promise.all([
        base44.entities.AIAnalysis.filter({ user_email: userEmail }, "-created_date", 1),
        base44.entities.ScoreHistory.filter({ user_email: userEmail }, "-created_date", 3),
        base44.entities.DailyCheckIn.filter({ user_email: userEmail }, "-created_date", 3),
        base44.entities.DailyShiftPlan.filter({ user_email: userEmail, plan_date: today }, "-created_date", 1),
        base44.entities.JournalEntry.filter({ user_email: userEmail }, "-created_date", 5),
      ]);

      const analysis = analyses[0];
      if (!analysis) {
        setActions([]);
        return;
      }

      const latestScore = scores[0];
      const todayCheckin = checkins.find(c => c.checkin_date === today);
      const todayPlan = plans[0];

      const categoryScores = latestScore ? [
        { name: "mindset", score: latestScore.mindset_score || 50 },
        { name: "discipline", score: latestScore.discipline_score || 50 },
        { name: "health", score: latestScore.health_score || 50 },
        { name: "financial", score: latestScore.financial_score || 50 },
        { name: "confidence", score: latestScore.confidence_score || 50 },
        { name: "environment", score: latestScore.environment_score || 50 },
      ].sort((a, b) => a.score - b.score) : [];

      const focusAreas = categoryScores.slice(0, 3);
      const rotatedFocus = focusAreas[dayOfYear % Math.max(focusAreas.length, 1)] || focusAreas[0];

      const morningGoal = todayCheckin?.progress_made || null;
      const morningGratitude = todayCheckin?.gratitude || null;
      const completedHabits = todayPlan?.completed_habits?.length || 0;
      const totalHabits = todayPlan?.habits?.length || 0;
      const recentJournalThemes = entries
        .map(e => e.response_text)
        .filter(Boolean)
        .slice(0, 3)
        .join(" | ");

      const identityStatement = analysis.future_self_statement || "their highest potential";
      const misalignment = analysis.misalignment_summary || "";
      const strengths = analysis.strengths_summary || "";
      const limitingBeliefs = (analysis.limiting_beliefs || []).slice(0, 2).join(", ");
      const habitUpgrades = (analysis.habit_upgrades || []).slice(0, 3).join(", ");
      const dailySeed = `DAY-${dayOfYear}-FOCUS-${rotatedFocus?.name || "growth"}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite personal growth strategist. Generate 3 highly specific, intelligent daily alignment actions for this user.

=== USER PROFILE ===
Future Self Identity: "${identityStatement}"
Primary Misalignment: "${misalignment}"
Strengths: "${strengths}"
Limiting Beliefs: ${limitingBeliefs || "not specified"}
Habit Upgrades Needed: ${habitUpgrades || "not specified"}

=== TODAY'S CONTEXT ===
Focus Area for Today: ${rotatedFocus?.name || "growth"} (score: ${rotatedFocus?.score || "?"}/100)
Morning Goal Set: "${morningGoal || "none recorded"}"
Morning Gratitude: "${morningGratitude || "none recorded"}"
Daily Shift Progress: ${completedHabits}/${totalHabits} habits completed today
Recent Journal Themes: "${recentJournalThemes || "no recent entries"}"
Daily Seed for Variety: ${dailySeed}

=== REQUIREMENTS ===
- Generate EXACTLY 3 actions, each targeting a DIFFERENT life area
- Each action must take 5–20 minutes max
- Be ultra-specific — name exact techniques, numbers, or durations
- At least 1 action should connect to today's morning goal if one was set
- At least 1 action should target the user's lowest alignment area (${rotatedFocus?.name || "growth"})
- Vary the types: mix mental, physical, financial, relational, or environmental actions
- Each "why" should reference something specific from their profile

Return ONLY valid JSON:
{
  "focus_label": "short 2-3 word theme for today's actions",
  "actions": [
    { "action": "...", "why": "..." },
    { "action": "...", "why": "..." },
    { "action": "...", "why": "..." }
  ]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            focus_label: { type: "string" },
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  why: { type: "string" },
                },
              },
            },
          },
        },
      });

      if (result?.focus_label) setFocusLabel(result.focus_label);
      setActions(result?.actions || []);
      setCompleted({});
    } catch (e) {
      console.error("MicroActionSuggester error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleComplete = (i) =>
    setCompleted((prev) => ({ ...prev, [i]: !prev[i] }));

  if (loading) {
    return (
      <div className="glass-card border border-border rounded-2xl p-4 mb-6 animate-pulse">
        <div className="h-3 w-36 bg-muted rounded mb-3" />
        <div className="h-4 w-full bg-muted rounded mb-2" />
        <div className="h-4 w-3/4 bg-muted rounded mb-2" />
        <div className="h-4 w-5/6 bg-muted rounded" />
      </div>
    );
  }

  if (!actions.length) return null;

  const completedCount = Object.values(completed).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <div>
            <h3 className="font-playfair text-base font-semibold leading-tight">Alignment Actions</h3>
            {focusLabel && (
              <p className="text-[10px] uppercase tracking-widest text-primary/60 font-semibold mt-0.5">{focusLabel}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
              {completedCount}/{actions.length}
            </span>
          )}
          <button
            onClick={() => loadSuggestions(true)}
            disabled={refreshing}
            className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
          >
            {collapsed ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {actions.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`glass-card rounded-xl p-4 border transition-all duration-300 ${
                  completed[i]
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border hover:border-primary/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete(i)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      completed[i]
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-muted-foreground/30 hover:border-primary/50"
                    }`}
                  >
                    {completed[i] && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-snug mb-1 transition-all ${
                      completed[i] ? "line-through text-muted-foreground" : "text-foreground"
                    }`}>
                      {item.action}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.why}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
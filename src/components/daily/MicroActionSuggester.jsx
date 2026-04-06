import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Heart, Check, ChevronDown, ChevronUp } from "lucide-react";
import { getLocalToday } from "@/lib/dateUtils";

const CACHE_KEY_PREFIX = "emotion-alignment-";

export default function MicroActionSuggester({ userEmail }) {
  const [alignment, setAlignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (userEmail) loadAlignment();
  }, [userEmail]);

  const loadAlignment = async () => {
    setLoading(true);
    try {
      const today = getLocalToday();
      const cacheKey = `${CACHE_KEY_PREFIX}${today}`;

      // Return cached result for today — no manual refresh allowed
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setAlignment(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const [analyses, scores, checkins, entries] = await Promise.all([
        base44.entities.AIAnalysis.filter({ user_email: userEmail }, "-created_date", 1),
        base44.entities.ScoreHistory.filter({ user_email: userEmail }, "-created_date", 1),
        base44.entities.DailyCheckIn.filter({ user_email: userEmail }, "-created_date", 3),
        base44.entities.JournalEntry.filter({ user_email: userEmail }, "-created_date", 5),
      ]);

      const analysis = analyses[0];
      if (!analysis) { setAlignment(null); return; }

      const latestScore = scores[0];
      const recentMoods = checkins.map(c => `mood:${c.mood || "?"} energy:${c.energy || "?"} confidence:${c.confidence || "?"}`).join("; ");
      const recentJournal = entries.map(e => e.response_text).filter(Boolean).slice(0, 3).join(" | ");

      const categoryScores = latestScore ? [
        { name: "mindset", score: latestScore.mindset_score || 50 },
        { name: "discipline", score: latestScore.discipline_score || 50 },
        { name: "health", score: latestScore.health_score || 50 },
        { name: "financial", score: latestScore.financial_score || 50 },
        { name: "confidence", score: latestScore.confidence_score || 50 },
        { name: "environment", score: latestScore.environment_score || 50 },
      ].sort((a, b) => a.score - b.score) : [];

      const weakest = categoryScores.slice(0, 2).map(c => `${c.name} (${c.score})`).join(", ");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite emotional alignment coach. Generate today's Emotion Alignment guidance to help this user emotionally step into their future self.

=== USER PROFILE ===
Future Self Identity: "${analysis.future_self_statement || "their highest potential"}"
Strengths: "${analysis.strengths_summary || ""}"
Misalignment: "${analysis.misalignment_summary || ""}"
Limiting Beliefs: ${(analysis.limiting_beliefs || []).slice(0, 2).join(", ") || "not specified"}

=== EMOTIONAL CONTEXT ===
Recent Check-In Scores: ${recentMoods || "none recorded"}
Recent Journal Themes: "${recentJournal || "no recent entries"}"
Weakest Areas: ${weakest || "unknown"}

=== REQUIREMENTS ===
Generate a daily emotion alignment plan with:
1. "emotion_theme": A 2-4 word emotional theme for the day (e.g. "Calm Confidence", "Fearless Clarity")
2. "core_feeling": The ONE emotion to embody today to align with the future self (1 sentence)
3. "morning_intention": A specific emotional intention to set this morning (1-2 sentences)
4. "midday_reset": A quick emotional reset practice for midday — be specific with a technique (1-2 sentences)  
5. "evening_reflection": An evening emotional check-in question (1 sentence)
6. "affirmation": A powerful first-person affirmation tied to today's emotion theme

Make it deeply personal. Reference their actual data. Each item should feel like it was written specifically for them TODAY.

Return ONLY valid JSON:
{
  "emotion_theme": "...",
  "core_feeling": "...",
  "morning_intention": "...",
  "midday_reset": "...",
  "evening_reflection": "...",
  "affirmation": "..."
}`,
        response_json_schema: {
          type: "object",
          properties: {
            emotion_theme: { type: "string" },
            core_feeling: { type: "string" },
            morning_intention: { type: "string" },
            midday_reset: { type: "string" },
            evening_reflection: { type: "string" },
            affirmation: { type: "string" },
          },
        },
      });

      if (result) {
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
        setAlignment(result);
      }
    } catch (e) {
      console.error("EmotionAlignment error:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = (key) =>
    setCompleted((prev) => ({ ...prev, [key]: !prev[key] }));

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

  if (!alignment) return null;

  const steps = [
    { key: "morning_intention", label: "Morning Intention", value: alignment.morning_intention, icon: "🌅" },
    { key: "midday_reset", label: "Midday Reset", value: alignment.midday_reset, icon: "🔄" },
    { key: "evening_reflection", label: "Evening Reflection", value: alignment.evening_reflection, icon: "🌙" },
  ];

  const completedCount = Object.values(completed).filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-400" />
          <div>
            <h3 className="font-playfair text-base font-semibold leading-tight">Emotion Alignment</h3>
            {alignment.emotion_theme && (
              <p className="text-[10px] uppercase tracking-widest text-pink-400/70 font-semibold mt-0.5">{alignment.emotion_theme}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
              {completedCount}/{steps.length}
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
          >
            {collapsed ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
        </div>
      </div>

      {/* Affirmation card — always visible */}
      {alignment.affirmation && (
        <div className="glass-card border border-pink-400/20 rounded-xl p-4 mb-3">
          <p className="text-[10px] uppercase tracking-widest text-pink-400/60 font-semibold mb-1">Today's Affirmation</p>
          <p className="text-sm text-foreground/90 leading-relaxed italic">"{alignment.affirmation}"</p>
        </div>
      )}

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {steps.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`glass-card rounded-xl p-4 border transition-all duration-300 ${
                  completed[item.key]
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border hover:border-pink-400/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete(item.key)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      completed[item.key]
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-muted-foreground/30 hover:border-pink-400/50"
                    }`}
                  >
                    {completed[item.key] && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs">{item.icon}</span>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{item.label}</p>
                    </div>
                    <p className={`text-sm leading-relaxed transition-all ${
                      completed[item.key] ? "line-through text-muted-foreground" : "text-foreground"
                    }`}>
                      {item.value}
                    </p>
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
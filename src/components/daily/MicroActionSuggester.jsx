import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Heart, Check, ChevronDown, ChevronUp } from "lucide-react";
import { getLocalToday } from "@/lib/dateUtils";

// Cache keys are user-scoped to prevent cross-account data leakage
function cacheKey(userEmail, today) { return `emotion-alignment-${userEmail}-${today}`; }
// Completion keys are also user-scoped to prevent cross-account state leakage
function completionKey(userEmail, today) { return `emotion-completed-${userEmail}-${today}`; }

// Time windows in local hours (24h)
// Morning: 3:00 – 11:59
// Midday:  12:00 – 16:59
// Evening: 17:00 – 23:59 AND 0:00 – 2:59 (wraps past midnight)
function getStepWindowForHour(hour) {
  if (hour >= 3 && hour < 12) return "morning_intention";
  if (hour >= 12 && hour < 17) return "midday_reset";
  if (hour >= 17 || hour < 3) return "evening_reflection";
  return null;
}

function isStepAvailable(key, hour) {
  const activeWindow = getStepWindowForHour(hour);
  if (key === "morning_intention") return hour >= 3 && hour < 12;
  if (key === "midday_reset") return hour >= 12 && hour < 17;
  if (key === "evening_reflection") return hour >= 17 || hour < 3;
  return false;
}

function loadCompletions(userEmail, today) {
  try {
    const raw = localStorage.getItem(completionKey(userEmail, today));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCompletions(userEmail, today, completions) {
  try {
    localStorage.setItem(completionKey(userEmail, today), JSON.stringify(completions));
  } catch {}
}

export default function MicroActionSuggester({ userEmail }) {
  const [alignment, setAlignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const [localHour, setLocalHour] = useState(() => new Date().getHours());
  const today = getLocalToday();

  // Refresh local hour every minute
  useEffect(() => {
    const interval = setInterval(() => setLocalHour(new Date().getHours()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Load persisted completions for today (user-scoped)
  useEffect(() => {
    if (userEmail) setCompleted(loadCompletions(userEmail, today));
  }, [userEmail, today]);

  useEffect(() => {
    if (userEmail) loadAlignment();
  }, [userEmail]);

  const loadAlignment = async () => {
    setLoading(true);
    try {
      const key = cacheKey(userEmail, today);
      const cached = sessionStorage.getItem(key);
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
        sessionStorage.setItem(cacheKey(userEmail, today), JSON.stringify(result));
        setAlignment(result);
      }
    } catch (e) {
      console.error("EmotionAlignment error:", e);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = (key) => {
    const updated = { ...completed, [key]: true };
    setCompleted(updated);
    saveCompletions(userEmail, today, updated);
  };

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

  const allSteps = [
    { key: "morning_intention", label: "Morning Intention", value: alignment.morning_intention, icon: "🌅", window: "3:00 AM – 11:59 AM" },
    { key: "midday_reset", label: "Midday Reset", value: alignment.midday_reset, icon: "🔄", window: "12:00 PM – 4:59 PM" },
    { key: "evening_reflection", label: "Evening Reflection", value: alignment.evening_reflection, icon: "🌙", window: "5:00 PM – 2:59 AM" },
  ];

  // Show step if: available in current window OR already completed today
  const visibleSteps = allSteps.filter(s => isStepAvailable(s.key, localHour) || completed[s.key]);

  const completedCount = visibleSteps.filter(s => completed[s.key]).length;

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
              {completedCount}/{visibleSteps.length}
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
            {visibleSteps.length === 0 && (
              <div className="glass-card border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">No sections available right now. Check back during morning, midday, or evening.</p>
              </div>
            )}

            {visibleSteps.map((item, i) => {
              const isDone = !!completed[item.key];
              const isAvailable = isStepAvailable(item.key, localHour);

              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`glass-card rounded-xl p-4 border transition-all duration-300 ${
                    isDone
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border hover:border-pink-400/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Completion circle — only clickable if available and not done */}
                    <button
                      onClick={() => !isDone && isAvailable && markComplete(item.key)}
                      disabled={isDone || !isAvailable}
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isDone
                          ? "bg-emerald-500 border-emerald-500 cursor-default"
                          : "border-muted-foreground/30 hover:border-pink-400/50"
                      }`}
                    >
                      {isDone && <Check className="w-3 h-3 text-white" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{item.icon}</span>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{item.label}</p>
                        </div>
                        {isDone && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-1.5 py-0.5">
                            Completed ✓
                          </span>
                        )}
                      </div>
                      <p className={`text-sm leading-relaxed transition-all ${
                        isDone ? "line-through text-muted-foreground" : "text-foreground"
                      }`}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
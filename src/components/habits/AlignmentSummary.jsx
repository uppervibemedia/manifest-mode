import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, Brain, Heart, ChevronDown, ChevronUp, Sun, Moon } from "lucide-react";
import { base44 } from "@/api/base44Client";

const hour = new Date().getHours();
const isMorning = hour >= 5 && hour < 17;

// Morning intentions / Evening reflection prompts
const MORNING_PROMPTS = {
  action: "What 1–3 actions will you take today that align with your goals?",
  identity: "Who are you choosing to be today? Finish this: \"Today I am someone who...\"",
  emotional: "What emotional state are you choosing to operate from today?",
};

const EVENING_PROMPTS = {
  action: "Did your actions today match your goals and future reality?",
  identity: "Did you show up as your future self today? Where did you succeed?",
  emotional: "Did your emotional state today match the life you want to create?",
};

const PROMPTS = isMorning ? MORNING_PROMPTS : EVENING_PROMPTS;

export default function AlignmentSummary({ streak, completionPct, habits, todayLogs, weeklyRate, userEmail }) {
  const [expanded, setExpanded] = useState(false);
  const [activePrompt, setActivePrompt] = useState(null); // "action" | "identity" | "emotional"
  const [responses, setResponses] = useState({ action: "", identity: "", emotional: "" });
  const [saved, setSaved] = useState({ action: false, identity: false, emotional: false });
  const [saving, setSaving] = useState(false);

  const completedToday = habits.filter(h => todayLogs.some(l => l.habit_id === h.id && l.completed)).length;
  const total = habits.length;

  // Action Align — habit completion + consistency (weighted)
  const actionAlignment = completionPct;

  // Identity Align — blueprint/high-impact habits + discipline/mindset category completions
  const identityHabits = habits.filter(h =>
    h.alignment_impact === "high" || h.source === "blueprint" ||
    ["mindset", "discipline", "spiritual"].includes(h.category)
  );
  const identityDone = identityHabits.filter(h => todayLogs.some(l => l.habit_id === h.id && l.completed)).length;
  const identityAlignment = identityHabits.length > 0
    ? Math.round((identityDone / identityHabits.length) * 100)
    : Math.round(completionPct * 0.8);

  // Emotional Align — visualization, gratitude, affirmations, love/lifestyle/spiritual habits
  const emotionalHabits = habits.filter(h => {
    const t = (h.title || "").toLowerCase();
    return ["love", "lifestyle", "spiritual"].includes(h.category) ||
      ["gratitude", "affirmation", "visuali", "meditat", "breath", "prayer", "emotion"].some(k => t.includes(k));
  });
  const emotionalDone = emotionalHabits.filter(h => todayLogs.some(l => l.habit_id === h.id && l.completed)).length;
  const emotionalAlignment = emotionalHabits.length > 0
    ? Math.round((emotionalDone / emotionalHabits.length) * 100)
    : weeklyRate;

  const allDone = completedToday === total && total > 0;

  const saveResponse = async (type) => {
    if (!responses[type].trim() || !userEmail) return;
    setSaving(true);
    await base44.entities.JournalEntry.create({
      user_email: userEmail,
      title: `${isMorning ? "Morning" : "Evening"} ${type.charAt(0).toUpperCase() + type.slice(1)} Align`,
      prompt_question: PROMPTS[type],
      response_text: responses[type].trim(),
      category: type,
      entry_type: "checkin",
    });
    setSaved(prev => ({ ...prev, [type]: true }));
    setSaving(false);
  };

  const getBar = (pct, color) => (
    <div className="h-1 bg-border rounded-full overflow-hidden flex-1">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );

  const METRICS = [
    {
      key: "action",
      icon: Zap,
      label: "Action Align",
      color: "hsl(45 80% 60%)",
      textColor: "text-primary",
      value: actionAlignment,
      morning: "What actions matter today",
      evening: "Did your actions match your goals",
    },
    {
      key: "identity",
      icon: Brain,
      label: "Identity Align",
      color: "#c084fc",
      textColor: "text-purple-400",
      value: identityAlignment,
      morning: "Who you are choosing to be today",
      evening: "Did you show up as your future self",
    },
    {
      key: "emotional",
      icon: Heart,
      label: "Emotional Align",
      color: "#f9a8d4",
      textColor: "text-pink-400",
      value: emotionalAlignment,
      morning: "What emotional state you're choosing",
      evening: "Did your emotions match your future life",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-2xl mb-4 border overflow-hidden ${allDone ? "border-emerald-500/30 glow-gold" : "border-border"}`}
    >
      {/* Main summary */}
      <div className="p-4">
        {/* Top row: time of day + streak + habits done */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isMorning
              ? <Sun className="w-3.5 h-3.5 text-primary/70" />
              : <Moon className="w-3.5 h-3.5 text-purple-400/70" />
            }
            <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
              {isMorning ? "Morning Intention" : "Evening Review"}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <Flame className={`w-3.5 h-3.5 ${streak > 0 ? "text-orange-400" : "text-muted-foreground"}`} />
              <span className={`text-xs font-bold ${streak > 0 ? "text-orange-400" : "text-muted-foreground"}`}>{streak}d</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              allDone ? "bg-emerald-400/15 text-emerald-400 border border-emerald-400/25"
              : completionPct >= 50 ? "bg-primary/10 text-primary border border-primary/20"
              : "bg-muted text-muted-foreground"
            }`}>
              {completedToday}/{total} habits
            </span>
          </div>
        </div>

        {/* 3 alignment bars */}
        <div className="space-y-2.5">
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setActivePrompt(activePrompt === m.key ? null : m.key)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-2.5">
                <m.icon className="w-3 h-3 shrink-0" style={{ color: m.color }} />
                <span className="text-[10px] text-muted-foreground w-[88px] shrink-0">{m.label}</span>
                {getBar(m.value, m.color)}
                <span className={`text-[10px] font-semibold w-7 text-right shrink-0 ${m.textColor}`}>{m.value}%</span>
              </div>
              <p className="text-[9px] text-muted-foreground/50 mt-0.5 pl-5 text-left">
                {isMorning ? m.morning : m.evening}
              </p>
            </button>
          ))}
        </div>

        {/* Expand/collapse write-in */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {isMorning ? "Set your intention" : "Reflect & score today"}
        </button>
      </div>

      {/* Write-in expandable section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border/40"
          >
            <div className="px-4 pb-4 pt-3 space-y-4">
              {METRICS.map(m => (
                <div key={m.key}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <m.icon className="w-3 h-3 shrink-0" style={{ color: m.color }} />
                    <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: m.color }}>
                      {m.label}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed mb-2">{PROMPTS[m.key]}</p>
                  <div className="relative">
                    <textarea
                      value={responses[m.key]}
                      onChange={e => {
                        setResponses(prev => ({ ...prev, [m.key]: e.target.value }));
                        setSaved(prev => ({ ...prev, [m.key]: false }));
                      }}
                      placeholder={isMorning ? "Write your intention..." : "Today's reflection..."}
                      rows={2}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 resize-none leading-relaxed"
                    />
                    {responses[m.key].trim() && (
                      <button
                        onClick={() => saveResponse(m.key)}
                        disabled={saving || saved[m.key]}
                        className="absolute bottom-2.5 right-2.5 text-[9px] font-semibold px-2 py-0.5 rounded-full transition-all disabled:opacity-50"
                        style={{
                          color: saved[m.key] ? "#34d399" : m.color,
                          backgroundColor: saved[m.key] ? "#34d39918" : m.color + "18",
                          border: `1px solid ${saved[m.key] ? "#34d39930" : m.color + "30"}`,
                        }}
                      >
                        {saved[m.key] ? "✓ Saved" : "Save"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {allDone && (
        <p className="text-[10px] font-semibold text-emerald-400 text-center pb-3 tracking-wide">
          ✦ Full alignment today — you are becoming your future self
        </p>
      )}
    </motion.div>
  );
}
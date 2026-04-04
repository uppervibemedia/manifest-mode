import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORY_META = {
  wealth:     { icon: "💰", color: "#fbbf24", label: "Wealth" },
  body:       { icon: "💪", color: "#34d399", label: "Body" },
  love:       { icon: "❤️", color: "#f87171", label: "Love" },
  business:   { icon: "🚀", color: "#60a5fa", label: "Business" },
  home:       { icon: "🏡", color: "#a78bfa", label: "Home" },
  lifestyle:  { icon: "✨", color: "#f9a8d4", label: "Lifestyle" },
  spiritual:  { icon: "🌙", color: "#818cf8", label: "Spiritual" },
  mindset:    { icon: "🧠", color: "#c084fc", label: "Mindset" },
  discipline: { icon: "⚡", color: "#fbbf24", label: "Discipline" },
};

// Derive an identity-based label from the habit
function getIdentityLabel(habit) {
  const src = habit.source;
  const cat = habit.category;
  const impact = habit.alignment_impact;
  if (src === "blueprint") return { label: "Future Self Habit", color: "#fbbf24" };
  if (src === "ai") return { label: "AI Coach Pick", color: "#818cf8" };
  if (impact === "high" && cat === "wealth") return { label: "Wealth Alignment", color: "#fbbf24" };
  if (impact === "high" && cat === "body") return { label: "Body Activation", color: "#34d399" };
  if (impact === "high" && cat === "mindset") return { label: "Mindset Shift", color: "#c084fc" };
  if (impact === "high" && cat === "discipline") return { label: "Reality Shift Habit", color: "#fbbf24" };
  if (impact === "high" && cat === "business") return { label: "Momentum Builder", color: "#60a5fa" };
  if (cat === "spiritual" || cat === "mindset") return { label: "Identity Activation", color: "#818cf8" };
  if (impact === "high") return { label: "Confidence Builder", color: "#f9a8d4" };
  return { label: "Daily Habit", color: "hsl(220 10% 50%)" };
}

// What score/dimension does this habit support
function getAlignmentImpact(habit) {
  const cat = habit.category;
  const impact = habit.alignment_impact;
  if (cat === "discipline" || (cat === "mindset" && impact === "high")) return "Boosts discipline alignment";
  if (cat === "body") return "Supports body category";
  if (cat === "wealth" || cat === "business") return "Strengthens wealth alignment";
  if (cat === "spiritual" || cat === "mindset") return "Improves confidence score";
  if (cat === "love" || cat === "lifestyle") return "Raises emotional alignment";
  if (cat === "home") return "Strengthens environment score";
  if (impact === "high") return "Shifts Reality Match Score";
  return "Builds momentum";
}

// Short minimum version
function getMinVersion(habit) {
  if (habit.blueprint_area === "finance" || habit.category === "wealth") return "Min: 5 min financial review";
  if (habit.category === "body") return "Min: 10 min movement";
  if (habit.category === "mindset" || habit.category === "spiritual") return "Min: 5 min practice";
  if (habit.category === "discipline") return "Min: Start it — 2 mins";
  if (habit.category === "business") return "Min: 1 focused task";
  return "Min: Show up once";
}

// Completion feedback message
function getCompletionFeedback(habit) {
  const cat = habit.category;
  const impact = habit.alignment_impact;
  if (habit.source === "blueprint") return "Future Self reinforced ✦";
  if (cat === "discipline") return "Discipline Alignment +2";
  if (cat === "body") return "Body Alignment activated";
  if (cat === "wealth" || cat === "business") return "Wealth Alignment +2";
  if (cat === "mindset" || cat === "spiritual") return "Identity Shift locked in";
  if (impact === "high") return "Momentum building ↑";
  return "Alignment +1";
}

export default function HabitCard({ habit, completed, onToggle, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const meta = CATEGORY_META[habit.category] || { icon: "✦", color: "#fbbf24", label: habit.category };
  const identityLabel = getIdentityLabel(habit);
  const alignmentImpact = getAlignmentImpact(habit);
  const minVersion = getMinVersion(habit);
  const feedback = getCompletionFeedback(habit);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!completed) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 1800);
    }
    onToggle(habit);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        completed
          ? "border-emerald-500/25 bg-emerald-500/5"
          : "glass-card border-border"
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Check button */}
        <button
          onClick={handleToggle}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            completed
              ? "border-emerald-500 bg-emerald-500"
              : "border-border hover:border-primary/60"
          }`}
        >
          {completed && <Check className="w-3.5 h-3.5 text-white" />}
        </button>

        {/* Title + label */}
        <div className="flex-1 min-w-0" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold leading-snug truncate ${completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {habit.title}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px]">{meta.icon}</span>
            <span className="text-[9px] font-semibold rounded-full px-1.5 py-0.5"
              style={{ color: identityLabel.color, backgroundColor: identityLabel.color + "18", border: `1px solid ${identityLabel.color}30` }}>
              {identityLabel.label}
            </span>
            {habit.streak_count > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] text-orange-400 font-bold ml-auto shrink-0">
                <Flame className="w-2.5 h-2.5" />{habit.streak_count}
              </span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button onClick={() => setExpanded(e => !e)} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Completion flash */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-2.5"
          >
            <p className="text-[10px] font-semibold text-emerald-400 tracking-wide">✦ {feedback}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3.5 pt-0.5 space-y-2 border-t border-border/40">
              {/* Minimum version */}
              <div className="flex items-start gap-2 pt-2">
                <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground shrink-0 mt-0.5 w-10">Min</span>
                <p className="text-[11px] text-muted-foreground/80">{minVersion}</p>
              </div>

              {/* Alignment impact */}
              <div className="flex items-start gap-2">
                <span className="text-[9px] uppercase tracking-widest font-semibold shrink-0 mt-0.5 w-10" style={{ color: meta.color }}>Why</span>
                <p className="text-[11px] font-medium" style={{ color: meta.color }}>{alignmentImpact}</p>
              </div>

              {/* Source */}
              {habit.description && (
                <div className="flex items-start gap-2">
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground shrink-0 mt-0.5 w-10">From</span>
                  <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{habit.description}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
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

// Emotionally intelligent "why" — specific to habit title keywords or category
function getAlignmentImpact(habit) {
  const title = (habit.title || "").toLowerCase();
  const cat = habit.category;
  const src = habit.source;

  // Title-keyword based (most specific)
  if (title.includes("morning") || title.includes("screen")) return "Protects your focus before outside noise enters your day";
  if (title.includes("movement") || title.includes("workout") || title.includes("exercise")) return "Trains your body to match the energy of your future self";
  if (title.includes("journal") || title.includes("letter") || title.includes("future self")) return "Deepens your connection to who you are becoming";
  if (title.includes("top 3") || title.includes("before noon") || title.includes("non-negotiable")) return "Builds trust in your own follow-through every day";
  if (title.includes("financ") || title.includes("budget") || title.includes("money") || title.includes("invest")) return "Strengthens your financial awareness and control";
  if (title.includes("meditat") || title.includes("breath") || title.includes("prayer")) return "Grounds your identity before the world shapes your mood";
  if (title.includes("read") || title.includes("learn") || title.includes("study")) return "Expands the thinking patterns that create your future";
  if (title.includes("sleep") || title.includes("rest") || title.includes("wind down")) return "Restores the energy needed to execute at your highest level";
  if (title.includes("gratitude")) return "Rewires your brain to notice evidence of your progress";
  if (title.includes("cold") || title.includes("plunge")) return "Builds mental resilience one uncomfortable choice at a time";
  if (title.includes("social") || title.includes("network") || title.includes("connect")) return "Positions you in rooms aligned with your next level";

  // Category fallback
  if (cat === "discipline") return "Builds the self-trust that separates who you are from who you want to be";
  if (cat === "body") return "Signals to your subconscious that you take your physical self seriously";
  if (cat === "wealth" || cat === "business") return "Creates daily alignment between your actions and financial freedom";
  if (cat === "mindset") return "Closes the gap between your current beliefs and your future identity";
  if (cat === "spiritual") return "Anchors you in your values before the noise of the day takes over";
  if (cat === "love" || cat === "lifestyle") return "Nurtures the emotional energy that sustains long-term momentum";
  if (cat === "home") return "Reflects the standards of the person you are becoming";
  if (src === "blueprint") return "Directly addresses a gap identified in your Future Self Blueprint";
  return "Compounds daily into the version of you that matches your vision";
}

// Short minimum version — low-energy day fallback
function getMinVersion(habit) {
  const title = (habit.title || "").toLowerCase();
  const cat = habit.category;
  if (title.includes("morning") || title.includes("routine")) return "5 mins of stillness, no screens";
  if (title.includes("movement") || title.includes("workout") || title.includes("exercise")) return "10 min walk counts — just move";
  if (title.includes("journal") || title.includes("letter")) return "Write one sentence from your future self";
  if (title.includes("financ") || title.includes("budget") || title.includes("money")) return "Open your banking app and review";
  if (title.includes("meditat") || title.includes("breath")) return "3 deep breaths with intention";
  if (title.includes("read")) return "One page is enough";
  if (cat === "body") return "10 min of intentional movement";
  if (cat === "discipline") return "Start the task — even 2 minutes";
  if (cat === "mindset" || cat === "spiritual") return "5 min of quiet practice";
  if (cat === "wealth" || cat === "business") return "One conscious financial action";
  return "Show up — the identity matters more than the duration";
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
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/40">
              {/* Why it matters */}
              <div className="pt-2">
                <p className="text-[9px] uppercase tracking-widest font-semibold mb-1" style={{ color: meta.color }}>Why this matters</p>
                <p className="text-[11px] text-foreground/80 leading-relaxed">{alignmentImpact}</p>
              </div>

              {/* Low-energy minimum */}
              <div className="rounded-xl px-3 py-2" style={{ backgroundColor: meta.color + "10", border: `1px solid ${meta.color}20` }}>
                <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground mb-0.5">Low-energy day minimum</p>
                <p className="text-[11px] text-muted-foreground/80">{minVersion}</p>
              </div>

              {/* Source label */}
              {habit.description && (
                <p className="text-[10px] text-muted-foreground/50 italic">{habit.description}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
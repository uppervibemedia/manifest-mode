import { motion } from "framer-motion";
import { Check, Flame, Star } from "lucide-react";

const CATEGORY_META = {
  wealth:     { icon: "💰", color: "#fbbf24" },
  body:       { icon: "💪", color: "#34d399" },
  love:       { icon: "❤️", color: "#f87171" },
  business:   { icon: "🚀", color: "#60a5fa" },
  home:       { icon: "🏡", color: "#a78bfa" },
  lifestyle:  { icon: "✨", color: "#f9a8d4" },
  spiritual:  { icon: "🌙", color: "#818cf8" },
  mindset:    { icon: "🧠", color: "#c084fc" },
  discipline: { icon: "⚡", color: "#fbbf24" },
};

const IMPACT_COLORS = {
  high:   "text-emerald-400 bg-emerald-400/10",
  medium: "text-yellow-400 bg-yellow-400/10",
  low:    "text-muted-foreground bg-muted",
};

export default function HabitCard({ habit, completed, onToggle, index = 0 }) {
  const meta = CATEGORY_META[habit.category] || { icon: "✦", color: "#fbbf24" };

  return (
    <motion.button
      onClick={() => onToggle(habit)}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`w-full text-left rounded-2xl p-4 border transition-all duration-200 flex items-start gap-3 ${
        completed
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "glass-card border-border hover:border-primary/30"
      }`}
    >
      {/* Check circle */}
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
        completed ? "border-emerald-500 bg-emerald-500" : "border-border"
      }`}>
        {completed && <Check className="w-3.5 h-3.5 text-white" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-snug ${completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {habit.title}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {habit.is_priority && <Star className="w-3.5 h-3.5 text-primary fill-primary" />}
            {habit.streak_count > 0 && (
              <div className="flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-[10px] font-bold text-orange-400">{habit.streak_count}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm">{meta.icon}</span>
          <span className="text-[10px] capitalize text-muted-foreground">{habit.category}</span>
          {habit.alignment_impact && (
            <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${IMPACT_COLORS[habit.alignment_impact]}`}>
              {habit.alignment_impact} impact
            </span>
          )}
          {habit.reminder_time && !completed && (
            <span className="text-[9px] text-muted-foreground/60 ml-auto">{habit.reminder_time}</span>
          )}
        </div>
        {habit.description && (
          <p className="text-[11px] text-muted-foreground/70 mt-1 leading-relaxed line-clamp-1">{habit.description}</p>
        )}
      </div>
    </motion.button>
  );
}
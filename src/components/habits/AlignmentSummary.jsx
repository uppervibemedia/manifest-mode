import { motion } from "framer-motion";
import { Flame, Zap, Brain, Heart } from "lucide-react";

export default function AlignmentSummary({ streak, completionPct, habits, todayLogs, weeklyRate }) {
  const completedToday = habits.filter(h => todayLogs.some(l => l.habit_id === h.id && l.completed)).length;
  const total = habits.length;

  // Action alignment = completion % today
  const actionAlignment = completionPct;

  // Identity alignment = % of "high impact" or "blueprint" habits done
  const identityHabits = habits.filter(h => h.alignment_impact === "high" || h.source === "blueprint");
  const identityDone = identityHabits.filter(h => todayLogs.some(l => l.habit_id === h.id && l.completed)).length;
  const identityAlignment = identityHabits.length > 0 ? Math.round((identityDone / identityHabits.length) * 100) : actionAlignment;

  // Emotional alignment = % of mindset/spiritual/love habits done
  const emotionalHabits = habits.filter(h => ["mindset", "spiritual", "love", "lifestyle"].includes(h.category));
  const emotionalDone = emotionalHabits.filter(h => todayLogs.some(l => l.habit_id === h.id && l.completed)).length;
  const emotionalAlignment = emotionalHabits.length > 0 ? Math.round((emotionalDone / emotionalHabits.length) * 100) : weeklyRate;

  const allDone = completedToday === total && total > 0;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-2xl p-4 mb-4 border ${allDone ? "border-emerald-500/30 glow-gold" : "border-border"}`}
    >
      {/* Top row: streak + completion */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className={`w-4 h-4 ${streak > 0 ? "text-orange-400" : "text-muted-foreground"}`} />
          <span className={`text-sm font-bold ${streak > 0 ? "text-orange-400" : "text-muted-foreground"}`}>
            {streak}d streak
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${allDone ? "text-emerald-400" : "text-foreground"}`}>
            {completedToday}/{total} done
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            allDone ? "bg-emerald-400/15 text-emerald-400 border border-emerald-400/25"
            : completionPct >= 50 ? "bg-primary/10 text-primary border border-primary/20"
            : "bg-muted text-muted-foreground"
          }`}>
            {completionPct}%
          </span>
        </div>
      </div>

      {/* Alignment indicators */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <Zap className="w-3 h-3 text-primary shrink-0" />
          <span className="text-[10px] text-muted-foreground w-24 shrink-0">Action Align.</span>
          {getBar(actionAlignment, "hsl(45 80% 60%)")}
          <span className="text-[10px] font-semibold text-primary w-6 text-right">{actionAlignment}%</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Brain className="w-3 h-3 text-purple-400 shrink-0" />
          <span className="text-[10px] text-muted-foreground w-24 shrink-0">Identity Align.</span>
          {getBar(identityAlignment, "#c084fc")}
          <span className="text-[10px] font-semibold text-purple-400 w-6 text-right">{identityAlignment}%</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Heart className="w-3 h-3 text-pink-400 shrink-0" />
          <span className="text-[10px] text-muted-foreground w-24 shrink-0">Emotional Align.</span>
          {getBar(emotionalAlignment, "#f9a8d4")}
          <span className="text-[10px] font-semibold text-pink-400 w-6 text-right">{emotionalAlignment}%</span>
        </div>
      </div>

      {allDone && (
        <p className="text-[10px] font-semibold text-emerald-400 text-center mt-3 tracking-wide">
          ✦ Full alignment today — you are becoming your future self
        </p>
      )}
    </motion.div>
  );
}
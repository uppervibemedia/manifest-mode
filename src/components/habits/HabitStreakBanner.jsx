import { motion } from "framer-motion";
import { Flame, Trophy, TrendingUp } from "lucide-react";

export default function HabitStreakBanner({ streak, completedToday, totalToday, weeklyRate }) {
  const allDone = completedToday === totalToday && totalToday > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 mb-5 border ${
        allDone
          ? "glass-card border-emerald-500/30 bg-emerald-500/5"
          : streak > 0
          ? "glass-card border-primary/20 glow-gold"
          : "glass-card border-border"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Streak */}
        <div className="flex flex-col items-center shrink-0">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            streak >= 7 ? "bg-primary/20" : "bg-card"
          }`}>
            <Flame className={`w-6 h-6 ${streak > 0 ? "text-orange-400" : "text-muted-foreground"}`} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Streak</p>
        </div>
        <div className="flex-1">
          <div className="flex items-end gap-1.5">
            <span className="font-playfair text-3xl font-bold text-foreground">{streak}</span>
            <span className="text-muted-foreground text-sm mb-1">days</span>
            {streak >= 7 && <Trophy className="w-4 h-4 text-primary mb-1.5" />}
          </div>
          {allDone ? (
            <p className="text-xs text-emerald-400 font-medium">All habits complete today ✦</p>
          ) : (
            <p className="text-xs text-muted-foreground">{completedToday}/{totalToday} done today</p>
          )}
        </div>
        {/* Weekly rate */}
        <div className="flex flex-col items-center shrink-0">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="font-bold text-primary text-sm">{weeklyRate}%</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">this week</p>
        </div>
      </div>

      {/* Daily progress bar */}
      {totalToday > 0 && (
        <div className="mt-3">
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedToday / totalToday) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${allDone ? "bg-emerald-400" : "gold-gradient"}`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
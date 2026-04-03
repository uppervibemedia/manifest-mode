import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Flame, ChevronRight, Check } from "lucide-react";

export default function DashboardHabitWidget() {
  const [habits, setHabits] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [bestStreak, setBestStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const [h, tl] = await Promise.all([
        base44.entities.Habit.filter({ user_email: user.email, is_active: true }, "-is_priority", 5),
        base44.entities.HabitLog.filter({ user_email: user.email, log_date: today }),
      ]);
      setHabits(h);
      setTodayLogs(tl);
      setBestStreak(h.reduce((max, hb) => Math.max(max, hb.streak_count || 0), 0));
      setLoading(false);
    })();
  }, []);

  if (loading || habits.length === 0) return null;

  const isCompleted = (habitId) => todayLogs.some(l => l.habit_id === habitId && l.completed);
  const completedCount = habits.filter(h => isCompleted(h.id)).length;
  const pct = Math.round((completedCount / habits.length) * 100);
  const allDone = completedCount === habits.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate("/habits")}
      className={`glass-card rounded-2xl p-4 mb-3 cursor-pointer border transition-colors ${
        allDone ? "border-emerald-500/30" : "border-border hover:border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className={`w-4 h-4 ${bestStreak > 0 ? "text-orange-400" : "text-muted-foreground"}`} />
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Habits</p>
          {bestStreak > 0 && (
            <span className="text-xs font-bold text-orange-400">{bestStreak}d</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${allDone ? "text-emerald-400" : "text-foreground"}`}>
            {completedCount}/{habits.length}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Mini habit checklist */}
      <div className="space-y-1.5 mb-3">
        {habits.slice(0, 3).map((habit) => {
          const done = isCompleted(habit.id);
          return (
            <div key={habit.id} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                done ? "border-emerald-500 bg-emerald-500" : "border-border"
              }`}>
                {done && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <p className={`text-xs truncate ${done ? "line-through text-muted-foreground" : "text-foreground/80"}`}>
                {habit.title}
              </p>
            </div>
          );
        })}
        {habits.length > 3 && (
          <p className="text-[10px] text-muted-foreground pl-6">+{habits.length - 3} more habits</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${allDone ? "bg-emerald-400" : "gold-gradient"}`}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5">{pct}% complete today</p>
    </motion.div>
  );
}
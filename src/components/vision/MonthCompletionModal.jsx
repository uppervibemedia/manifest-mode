import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Check, ChevronRight, Flame, BookOpen, TrendingUp, Loader2 } from "lucide-react";

export default function MonthCompletionModal({ milestone, monthIndex, accentColor, onConfirm, onCancel }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [choice, setChoice] = useState(null); // "advance" | "stay"

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const today = new Date().toISOString().split("T")[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const [habits, habitLogs, checkins, journals] = await Promise.all([
        base44.entities.Habit.filter({ user_email: user.email, is_active: true }),
        base44.entities.HabitLog.filter({ user_email: user.email }, "-log_date", 200),
        base44.entities.DailyCheckIn.filter({ user_email: user.email }, "-created_date", 30),
        base44.entities.JournalEntry.filter({ user_email: user.email }, "-created_date", 10),
      ]);

      // Habit consistency over last 30 days
      let habitPossible = 0, habitDone = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        habitPossible += habits.length;
        habitDone += habitLogs.filter(l => l.log_date === ds && l.completed).length;
      }
      const habitRate = habitPossible > 0 ? Math.round((habitDone / habitPossible) * 100) : 0;

      // Check-in consistency
      const recentCheckins = checkins.filter(c => c.checkin_date >= thirtyDaysAgo);
      const checkinRate = Math.round((recentCheckins.length / 30) * 100);

      // Journal entries this month
      const recentJournals = journals.filter(j => new Date(j.created_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

      // Readiness score (0-100)
      const readiness = Math.round((habitRate * 0.5) + (checkinRate * 0.3) + (Math.min(recentJournals.length, 4) / 4 * 20));

      setStats({
        habitRate,
        checkinCount: recentCheckins.length,
        journalCount: recentJournals.length,
        readiness,
      });
      setLoading(false);
    })();
  }, []);

  const readinessLabel = !stats ? "" :
    stats.readiness >= 70 ? "Strong" :
    stats.readiness >= 40 ? "Building" : "Early";

  const readinessColor = !stats ? accentColor :
    stats.readiness >= 70 ? "#34d399" :
    stats.readiness >= 40 ? "#fbbf24" : "#f97316";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="w-full max-w-md bg-card rounded-t-3xl p-6 pb-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: accentColor }}>
              {milestone.month} · {milestone.theme}
            </p>
            <h3 className="font-playfair text-lg font-semibold text-foreground">Ready to advance?</h3>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-border flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Readiness score */}
            <div className="rounded-2xl border p-4 mb-4"
              style={{ borderColor: readinessColor + "30", backgroundColor: readinessColor + "08" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Your Readiness</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: readinessColor }} />
                  <span className="text-xs font-bold" style={{ color: readinessColor }}>{readinessLabel}</span>
                </div>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden mb-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.readiness}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: readinessColor }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-right">{stats.readiness}% aligned</p>
            </div>

            {/* Stat breakdown */}
            <div className="space-y-2.5 mb-6">
              <StatRow
                icon={<Flame className="w-3.5 h-3.5 text-orange-400" />}
                label="Habit consistency (30 days)"
                value={`${stats.habitRate}%`}
                valueColor={stats.habitRate >= 60 ? "#34d399" : stats.habitRate >= 30 ? "#fbbf24" : "#f97316"}
              />
              <StatRow
                icon={<TrendingUp className="w-3.5 h-3.5 text-blue-400" />}
                label="Check-ins completed"
                value={`${stats.checkinCount} days`}
                valueColor={stats.checkinCount >= 15 ? "#34d399" : stats.checkinCount >= 7 ? "#fbbf24" : "#f97316"}
              />
              <StatRow
                icon={<BookOpen className="w-3.5 h-3.5 text-purple-400" />}
                label="Journal entries this month"
                value={stats.journalCount}
                valueColor={stats.journalCount >= 3 ? "#34d399" : stats.journalCount >= 1 ? "#fbbf24" : "#f97316"}
              />
            </div>

            {/* Choice prompt */}
            <p className="text-xs text-muted-foreground mb-3 text-center leading-relaxed">
              {stats.readiness >= 60
                ? "You've built real momentum this month. Trust yourself — advance when you feel ready."
                : "You're still in the building phase. Advancing is your choice — consistency compounds over time."}
            </p>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={() => onConfirm("advance")}
                className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`, color: "hsl(220 20% 7%)" }}>
                Advance to Month {monthIndex + 2} <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onConfirm("stay")}
                className="w-full py-3 rounded-xl text-sm font-medium text-muted-foreground border border-border hover:border-primary/30 transition-colors">
                Stay & keep building this month
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatRow({ icon, label, value, valueColor }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-foreground/70">{label}</span>
      </div>
      <span className="text-xs font-bold" style={{ color: valueColor }}>{value}</span>
    </div>
  );
}
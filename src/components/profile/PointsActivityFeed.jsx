import { POINT_VALUES } from "@/lib/identityEngine";

const ACTIVITY_MAP = [
  { key: "habit", label: "Habit completed", points: POINT_VALUES.HABIT_COMPLETE, icon: "⚡" },
  { key: "all_habits", label: "All habits done — bonus", points: POINT_VALUES.ALL_HABITS_COMPLETE, icon: "✦" },
  { key: "checkin", label: "Daily check-in", points: POINT_VALUES.DAILY_CHECKIN, icon: "◈" },
  { key: "journal", label: "Journal entry", points: POINT_VALUES.JOURNAL_ENTRY, icon: "📖" },
  { key: "streak_7", label: "7-day streak milestone", points: POINT_VALUES.STREAK_7, icon: "🔥" },
  { key: "streak_14", label: "14-day streak milestone", points: POINT_VALUES.STREAK_14, icon: "🔥" },
  { key: "streak_30", label: "30-day streak milestone", points: POINT_VALUES.STREAK_30, icon: "🏛️" },
  { key: "score", label: "Score improvement", points: POINT_VALUES.SCORE_IMPROVEMENT, icon: "📈" },
];

export default function PointsActivityFeed() {
  return (
    <div className="glass-card border border-border rounded-2xl p-4 mb-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">How to Earn Alignment Points</p>
      <div className="space-y-2.5">
        {ACTIVITY_MAP.map(a => (
          <div key={a.key} className="flex items-center gap-3">
            <span className="text-base w-5 text-center shrink-0">{a.icon}</span>
            <p className="text-xs text-foreground/80 flex-1">{a.label}</p>
            <span className="text-xs font-semibold text-primary shrink-0">+{a.points} AP</span>
          </div>
        ))}
      </div>
    </div>
  );
}
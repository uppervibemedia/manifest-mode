import { motion } from "framer-motion";

// Shows a 4-week dot-calendar of completions
export default function HabitCalendar({ logs }) {
  // Build last 28 days
  const days = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLogs = logs.filter(l => l.log_date === dateStr);
    const total = dayLogs.length;
    const done = dayLogs.filter(l => l.completed).length;
    const pct = total > 0 ? done / total : null; // null = no habits that day
    days.push({ date: dateStr, pct, done, total, label: d.toLocaleDateString("en", { weekday: "short" }).charAt(0) });
  }

  const weeks = [];
  for (let i = 0; i < 4; i++) weeks.push(days.slice(i * 7, i * 7 + 7));

  const getColor = (pct) => {
    if (pct === null) return "bg-border";
    if (pct === 0) return "bg-destructive/30";
    if (pct < 0.5) return "bg-yellow-500/40";
    if (pct < 1) return "bg-primary/50";
    return "bg-emerald-500";
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Last 28 Days</p>
      <div className="space-y-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1.5">
            {week.map((day, di) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (wi * 7 + di) * 0.012 }}
                title={`${day.date}: ${day.done}/${day.total} habits`}
                className={`flex-1 aspect-square rounded-md ${getColor(day.pct)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2.5">
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span className="text-[9px] text-muted-foreground">All done</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-primary/50" /><span className="text-[9px] text-muted-foreground">Partial</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-destructive/30" /><span className="text-[9px] text-muted-foreground">Missed</span></div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-border" /><span className="text-[9px] text-muted-foreground">No data</span></div>
      </div>
    </div>
  );
}
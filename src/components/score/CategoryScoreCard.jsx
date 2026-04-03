import { motion } from "framer-motion";

export default function CategoryScoreCard({ label, score, icon }) {
  const color = score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f97316";
  const pct = score || 0;

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-xs font-semibold text-foreground">{label}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>{score}</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}
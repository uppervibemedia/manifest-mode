import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// ── Momentum Meter ─────────────────────────────────────────────────────────────

function MomentumMeter({ momentum }) {
  const states = {
    low: { label: "Low Momentum", color: "text-muted-foreground", bar: "bg-muted-foreground/40", fill: "w-1/4", desc: "Start today. One action compounds." },
    building: { label: "Building Momentum", color: "text-yellow-400", bar: "bg-yellow-400/20", fill: "w-2/3", desc: "Consistency is starting to compound." },
    locked_in: { label: "Locked In", color: "text-emerald-400", bar: "bg-emerald-400/20", fill: "w-full", desc: "You're in your rhythm. Protect it." },
  };
  const s = states[momentum] || states.low;

  return (
    <div className="glass-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Momentum</p>
        <span className={`text-xs font-bold ${s.color}`}>{s.label}</span>
      </div>
      <div className={`h-1.5 ${s.bar} rounded-full overflow-hidden mb-2`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: s.fill.replace("w-", "") === "full" ? "100%" : s.fill.replace("w-1/4", "25%").replace("w-2/3", "66%") }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${s.color.replace("text-", "bg-")}`}
        />
      </div>
      <p className="text-xs text-muted-foreground">{s.desc}</p>
    </div>
  );
}

// ── Streak Row ─────────────────────────────────────────────────────────────────

function StreakRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
        <span className="text-xs text-muted-foreground">day{value !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

// ── Daily Progress Ring ────────────────────────────────────────────────────────

function DailyProgressRing({ completed, total }) {
  const pct = total > 0 ? completed / total : 0;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  const color = pct === 1 ? "#4ade80" : pct >= 0.5 ? "#facc15" : "hsl(45 80% 60%)";

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-14 h-14 shrink-0">
        <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" stroke="hsl(220 15% 18%)" strokeWidth="4" />
          <motion.circle
            cx="28" cy="28" r={r}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-foreground">{completed}/{total}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          {pct === 1 ? "Day Complete" : pct === 0 ? "Not Started" : "In Progress"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {Math.round(pct * 100)}% of today's alignment done
        </p>
      </div>
    </div>
  );
}

// ── Shift Wins ─────────────────────────────────────────────────────────────────

function ShiftWins({ wins }) {
  if (!wins || wins.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Today's Wins</p>
      <div className="flex flex-wrap gap-2">
        {wins.map((w, i) => (
          <motion.div
            key={w.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            title={w.desc}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
          >
            <span className="text-[9px] text-primary">✦</span>
            <span className="text-xs font-semibold text-primary">{w.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Weekly Summary ─────────────────────────────────────────────────────────────

function WeeklySummary({ weekly }) {
  const [open, setOpen] = useState(false);
  if (!weekly?.show) return null;

  return (
    <div className="glass-card border border-primary/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary">✦</span>
          <p className="text-sm font-semibold text-foreground">Weekly Summary</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background/40 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold font-playfair text-foreground">{weekly.daysCompleted}/7</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Days completed</p>
                </div>
                <div className="bg-background/40 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold font-playfair text-foreground">{weekly.consistency}%</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Consistency</p>
                </div>
              </div>
              {weekly.strongestArea && (
                <div className="flex items-center justify-between py-2 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">Strongest Area</p>
                  <span className="text-xs font-semibold text-emerald-400">{weekly.strongestArea}</span>
                </div>
              )}
              {weekly.weakestArea && (
                <div className="flex items-center justify-between py-2 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">Needs Attention</p>
                  <span className="text-xs font-semibold text-orange-400">{weekly.weakestArea}</span>
                </div>
              )}
              {weekly.scoreMovement !== null && (
                <div className="flex items-center justify-between py-2 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">Score Movement</p>
                  <span className={`text-xs font-bold ${weekly.scoreMovement >= 0 ? "text-emerald-400" : "text-orange-400"}`}>
                    {weekly.scoreMovement >= 0 ? "+" : ""}{weekly.scoreMovement} pts
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

export default function ShiftGamificationPanel({ stats }) {
  if (!stats) return null;

  const { streaks, todayProgress, wins, momentum, weekly } = stats;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-4">
      {/* Daily Progress + Wins */}
      <div className="glass-card border border-border rounded-xl p-4 space-y-4">
        <DailyProgressRing completed={todayProgress.completed} total={todayProgress.total} />
        {wins.length > 0 && <div className="border-t border-border/40 pt-3"><ShiftWins wins={wins} /></div>}
      </div>

      {/* Streaks */}
      <div className="glass-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Alignment Streaks</p>
        <StreakRow label="Morning Check-In" value={streaks.morning} highlight={streaks.morning >= 3} />
        <StreakRow label="Evening Review" value={streaks.evening} highlight={streaks.evening >= 3} />
        <StreakRow label="Full Day" value={streaks.fullDay} highlight={streaks.fullDay >= 3} />
      </div>

      {/* Momentum */}
      <MomentumMeter momentum={momentum} />

      {/* Weekly Summary */}
      <WeeklySummary weekly={weekly} />
    </motion.div>
  );
}
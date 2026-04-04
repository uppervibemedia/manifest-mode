import { motion } from "framer-motion";
import { getLevelForPoints, getProgressToNextLevel, getPointsToNextLevel, IDENTITY_LEVELS } from "@/lib/identityEngine";

export default function IdentityLevelCard({ points = 0, streak = 0, onShowPointsGuide }) {
  const level = getLevelForPoints(points);
  const progressPct = getProgressToNextLevel(points);
  const toNext = getPointsToNextLevel(points);
  const isMax = level.level === IDENTITY_LEVELS.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 mb-5 relative overflow-hidden border"
      style={{
        background: `linear-gradient(135deg, hsl(220 18% 10%) 0%, hsl(220 18% 12%) 100%)`,
        borderColor: level.color + "30",
        boxShadow: `0 0 40px ${level.glow}`,
      }}
    >
      {/* Background glow orb */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${level.color}15, transparent 70%)` }} />

      {/* Level label */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-medium mb-1" style={{ color: level.color + "aa" }}>
            Identity Level {level.level}
          </p>
          <h2 className="font-playfair text-2xl font-semibold" style={{ color: level.color }}>
            {level.symbol} {level.title}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
            {level.subtitle}
          </p>
          {onShowPointsGuide && (
            <button
              onClick={onShowPointsGuide}
              className="text-[10px] font-semibold text-primary hover:text-primary/80 mt-2 transition-colors"
            >
              How to earn AP →
            </button>
          )}
        </div>
        {/* Points badge */}
        <div className="shrink-0 text-right">
          <div className="glass-card rounded-xl px-3 py-2 border" style={{ borderColor: level.color + "30" }}>
            <p className="font-playfair text-lg font-bold" style={{ color: level.color }}>{points.toLocaleString()}</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">AP</p>
          </div>
        </div>
      </div>

      {/* Progress bar to next level */}
      {!isMax && (
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>Progress to {IDENTITY_LEVELS[level.level + 1]?.title}</span>
            <span style={{ color: level.color }}>{toNext} AP to go</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${level.color}80, ${level.color})` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-1">{progressPct}% complete</p>
        </div>
      )}

      {isMax && (
        <div className="flex items-center gap-2 mt-2">
          <span style={{ color: level.color }} className="text-sm">✦</span>
          <p className="text-xs font-medium" style={{ color: level.color }}>
            Peak identity achieved. You are the vision.
          </p>
        </div>
      )}
    </motion.div>
  );
}
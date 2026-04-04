import { motion } from "framer-motion";
import { X } from "lucide-react";
import { POINT_VALUES } from "@/lib/identityEngine";

export default function HowToEarnPointsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const activities = [
    { label: "Habit Completed", points: POINT_VALUES.HABIT_COMPLETE, icon: "✓" },
    { label: "All Habits Completed (Bonus)", points: POINT_VALUES.ALL_HABITS_COMPLETE, icon: "✦" },
    { label: "Daily Check-in", points: POINT_VALUES.DAILY_CHECKIN, icon: "📝" },
    { label: "Journal Entry", points: POINT_VALUES.JOURNAL_ENTRY, icon: "📖" },
    { label: "Vision Progress Update", points: POINT_VALUES.VISION_UPDATE, icon: "👁" },
    { label: "7-Day Streak", points: POINT_VALUES.STREAK_7DAYS, icon: "🔥" },
    { label: "30-Day Streak", points: POINT_VALUES.STREAK_30DAYS, icon: "🔥🔥" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-playfair text-xl font-semibold">How to Earn AP</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Alignment Points fuel your identity shift</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-border flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Intro */}
        <div className="glass-card border border-primary/20 rounded-xl p-4 mb-6">
          <p className="text-xs text-foreground/80 leading-relaxed">
            Every action toward your future self earns Alignment Points. The more consistent you are, the faster you level up your identity.
          </p>
        </div>

        {/* Activities list */}
        <div className="space-y-2.5 mb-6">
          {activities.map((activity, i) => (
            <motion.div
              key={activity.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card border border-border rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{activity.icon}</span>
                <span className="text-sm text-foreground">{activity.label}</span>
              </div>
              <span className="text-sm font-bold text-primary">+{activity.points}</span>
            </motion.div>
          ))}
        </div>

        {/* Info box */}
        <div className="glass-card border border-border rounded-xl p-4 mb-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Pro tip:</span> Streaks multiply your growth. Stay consistent and watch your level rise. Every level unlocks new capabilities.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 gold-gradient text-background font-semibold rounded-xl"
        >
          Got It
        </button>
      </motion.div>
    </motion.div>
  );
}
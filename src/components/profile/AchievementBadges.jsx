import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BADGES } from "@/lib/identityEngine";
import { Lock } from "lucide-react";

const CATEGORIES = ["all", "consistency", "discipline", "mindset", "progress", "identity"];

export default function AchievementBadges({ earnedIds = [] }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = activeCategory === "all"
    ? BADGES
    : BADGES.filter(b => b.category === activeCategory);

  const earnedCount = BADGES.filter(b => earnedIds.includes(b.id)).length;

  return (
    <div className="glass-card border border-border rounded-2xl p-4 mb-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Achievements</p>
        <span className="text-[10px] text-primary font-semibold">{earnedCount}/{BADGES.length} earned</span>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium capitalize transition-all ${
              activeCategory === cat
                ? "bg-primary text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-4 gap-2">
        {filtered.map((badge, i) => {
          const earned = earnedIds.includes(badge.id);
          return (
            <motion.button
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelected(earned ? badge : null)}
              className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                earned
                  ? "border-border bg-card hover:border-primary/30"
                  : "border-border/40 bg-muted/20 opacity-40"
              }`}
            >
              {earned ? (
                <>
                  <span className="text-xl">{badge.icon}</span>
                  <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: badge.color }} />
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-muted-foreground/40" />
                  <div className="w-1.5 h-1.5 rounded-full mt-0.5 bg-muted-foreground/20" />
                </>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Detail popover */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-3 rounded-xl border p-3 flex items-center gap-3"
            style={{ borderColor: selected.color + "40", background: selected.color + "10" }}
          >
            <span className="text-2xl">{selected.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: selected.color }}>{selected.title}</p>
              <p className="text-[11px] text-muted-foreground">{selected.desc}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xs px-1">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.filter(b => earnedIds.includes(b.id)).length === 0 && activeCategory !== "all" && (
        <p className="text-center text-xs text-muted-foreground/50 mt-2 italic">
          No {activeCategory} achievements yet — keep building.
        </p>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, TrendingUp, Target, Flame, CheckCircle2, Circle, Plus, ArrowRight } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const CATEGORY_META = {
  wealth:    { icon: "💰", color: "#fbbf24" },
  body:      { icon: "💪", color: "#34d399" },
  love:      { icon: "❤️", color: "#f87171" },
  business:  { icon: "🚀", color: "#60a5fa" },
  home:      { icon: "🏡", color: "#a78bfa" },
  lifestyle: { icon: "✨", color: "#f9a8d4" },
  spiritual: { icon: "🌙", color: "#818cf8" },
};

const SCORE_KEYS = {
  mindset:    "mindset_score",
  discipline: "discipline_score",
  health:     "health_score",
  financial:  "financial_score",
  confidence: "confidence_score",
  environment:"environment_score",
};

function RadialProgress({ pct, color, size = 64, stroke = 6 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(220 15% 18%)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${circ} ${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function RealityShiftTracker() {
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [visions, setVisions] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const [s, v, c, p] = await Promise.all([
        base44.entities.ScoreHistory.filter({ user_email: user.email }, "-created_date", 10),
        base44.entities.VisionItem.filter({ user_email: user.email, is_active: true }),
        base44.entities.DailyCheckIn.filter({ user_email: user.email }, "-created_date", 14),
        base44.entities.DailyShiftPlan.filter({ user_email: user.email }, "-created_date", 14),
      ]);
      setScores(s);
      setVisions(v);
      setCheckins(c);
      setPlans(p);
      setLoading(false);
    })();
  }, []);

  const latest = scores[0];
  const prev = scores[1];

  // Category progress from latest score
  const categoryProgress = latest ? [
    { label: "Mindset",     val: latest.mindset_score,     color: "#a78bfa" },
    { label: "Discipline",  val: latest.discipline_score,  color: "#fbbf24" },
    { label: "Health",      val: latest.health_score,      color: "#34d399" },
    { label: "Financial",   val: latest.financial_score,   color: "#60a5fa" },
    { label: "Confidence",  val: latest.confidence_score,  color: "#f9a8d4" },
    { label: "Environment", val: latest.environment_score, color: "#818cf8" },
  ] : [];

  // Vision category distribution
  const visionByCategory = visions.reduce((acc, v) => {
    acc[v.category] = (acc[v.category] || 0) + 1;
    return acc;
  }, {});

  // Weekly habit completion rate (last 7 plans)
  const last7Plans = plans.slice(0, 7);
  const weeklyRate = last7Plans.length
    ? Math.round(last7Plans.reduce((acc, p) => {
        const total = p.habits?.length || 0;
        const done = p.completed_habits?.length || 0;
        return acc + (total ? done / total : 0);
      }, 0) / last7Plans.length * 100)
    : 0;

  // 14-day checkin energy trend
  const energyTrend = checkins.slice(0, 14).reverse().map((c, i) => ({
    day: i,
    energy: c.energy || 0,
    discipline: c.discipline || 0,
  }));

  // Overall growth
  const growth = latest && prev ? latest.overall_score - prev.overall_score : 0;

  if (loading) return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Visual Progress</p>
          <h1 className="font-playfair text-2xl font-semibold">Reality Shift Tracker</h1>
          <p className="text-xs text-muted-foreground mt-1">Your alignment journey, visualized</p>
        </div>

        {!latest ? (
          <div className="flex flex-col items-center py-20 text-center">
            <TrendingUp className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-6">Complete an assessment to unlock your Reality Shift Tracker</p>
            <button onClick={() => navigate("/assessment")}
              className="px-6 py-3 gold-gradient text-background font-semibold rounded-xl flex items-center gap-2">
              Take Assessment <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Overall score + growth banner */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card glow-gold rounded-2xl p-5 mb-5 border border-primary/20 flex items-center gap-5">
              <div className="relative shrink-0">
                <RadialProgress pct={latest.overall_score} color="hsl(45 80% 60%)" size={80} stroke={7} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-playfair text-lg font-bold text-primary">{latest.overall_score}</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Overall Alignment</p>
                <p className="font-playfair text-xl font-semibold text-foreground">
                  {latest.overall_score >= 75 ? "Highly Aligned" : latest.overall_score >= 50 ? "Building Momentum" : "Gap to Close"}
                </p>
                {growth !== 0 && (
                  <div className={`flex items-center gap-1 mt-1 ${growth > 0 ? "text-emerald-400" : "text-orange-400"}`}>
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-semibold">{growth > 0 ? "+" : ""}{growth} pts since last assessment</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Flame className="w-3 h-3 text-primary" />
                  <span className="text-xs text-primary">Weekly habit rate: {weeklyRate}%</span>
                </div>
              </div>
            </motion.div>

            {/* Category radial rings */}
            <div className="mb-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Category Alignment</p>
              <div className="grid grid-cols-3 gap-3">
                {categoryProgress.map((cat, i) => (
                  <motion.div key={cat.label}
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                    className="glass-card rounded-xl p-3 flex flex-col items-center">
                    <div className="relative mb-1.5">
                      <RadialProgress pct={cat.val} color={cat.color} size={56} stroke={5} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold" style={{ color: cat.color }}>{cat.val}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">{cat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Score History Timeline */}
            {scores.length > 1 && (
              <div className="glass-card rounded-2xl p-4 mb-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Score Timeline</p>
                <div className="flex items-end gap-2 h-16">
                  {scores.slice(0, 8).reverse().map((s, i) => {
                    const pct = s.overall_score / 100;
                    const color = s.overall_score >= 75 ? "#34d399" : s.overall_score >= 50 ? "#fbbf24" : "#f97316";
                    return (
                      <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                        <motion.div
                          initial={{ height: 0 }} animate={{ height: `${pct * 48}px` }}
                          transition={{ delay: i * 0.06, duration: 0.6, ease: "easeOut" }}
                          className="w-full rounded-t-sm min-h-[4px]"
                          style={{ backgroundColor: color, opacity: 0.7 + i * 0.04 }}
                        />
                        <span className="text-[9px] text-muted-foreground">{s.overall_score}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground/50 text-center mt-1">Oldest → Latest</p>
              </div>
            )}

            {/* Vision Progress by Category */}
            {visions.length > 0 && (
              <div className="glass-card rounded-2xl p-4 mb-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Vision Vault Progress</p>
                <div className="space-y-3">
                  {Object.entries(visionByCategory).map(([cat, count], i) => {
                    const meta = CATEGORY_META[cat] || { icon: "✦", color: "#fbbf24" };
                    const priorityCount = visions.filter(v => v.category === cat && v.is_priority).length;
                    return (
                      <motion.div key={cat} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span>{meta.icon}</span>
                            <span className="text-xs font-medium text-foreground capitalize">{cat}</span>
                            {priorityCount > 0 && <span className="text-[9px] text-primary">★ {priorityCount} priority</span>}
                          </div>
                          <span className="text-xs text-muted-foreground">{count} vision{count > 1 ? "s" : ""}</span>
                        </div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(count * 20, 100)}%` }}
                            transition={{ delay: i * 0.06 + 0.2, duration: 0.8 }}
                            className="h-full rounded-full" style={{ backgroundColor: meta.color }} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <button onClick={() => navigate("/vision-vault")}
                  className="mt-4 text-xs text-primary flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add more visions
                </button>
              </div>
            )}

            {/* Weekly habit dots */}
            {last7Plans.length > 0 && (
              <div className="glass-card rounded-2xl p-4 mb-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Last 7 Days — Habit Completion</p>
                <div className="flex gap-2">
                  {last7Plans.reverse().map((p, i) => {
                    const total = p.habits?.length || 0;
                    const done = p.completed_habits?.length || 0;
                    const pct = total ? done / total : 0;
                    const color = pct >= 1 ? "#34d399" : pct >= 0.5 ? "#fbbf24" : "#f97316";
                    return (
                      <div key={p.id} className="flex-1 flex flex-col items-center gap-1.5">
                        <motion.div
                          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.05 }}
                          className="w-full rounded-sm"
                          style={{ height: `${Math.max(pct * 32, 4)}px`, backgroundColor: color, opacity: 0.85 }}
                        />
                        {pct >= 1
                          ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          : <Circle className="w-3 h-3 text-muted-foreground/40" />}
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(p.plan_date).toLocaleDateString("en", { weekday: "short" }).charAt(0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 14-day energy trend dots */}
            {energyTrend.length > 0 && (
              <div className="glass-card rounded-2xl p-4 mb-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Energy Trend (14 days)</p>
                <div className="flex items-end gap-1 h-10">
                  {energyTrend.map((d, i) => (
                    <motion.div key={i}
                      initial={{ height: 0 }} animate={{ height: `${(d.energy / 10) * 40}px` }}
                      transition={{ delay: i * 0.04, duration: 0.5 }}
                      className="flex-1 rounded-t-sm min-h-[2px]"
                      style={{ backgroundColor: `hsl(45 80% ${40 + d.energy * 3}%)`, opacity: 0.8 }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-muted-foreground/50">14 days ago</span>
                  <span className="text-[9px] text-muted-foreground/50">Today</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
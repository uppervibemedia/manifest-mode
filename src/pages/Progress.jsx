import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useTestProfile } from "@/lib/testProfileContext";
import { TrendingUp, ArrowRight, RefreshCw, BarChart3, Flame, Crown, AlertCircle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

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

const CATEGORY_SCORES = [
  { key: "mindset_score",     label: "Mindset",     color: "#a78bfa", icon: "🧠" },
  { key: "discipline_score",  label: "Discipline",  color: "#fbbf24", icon: "⚡" },
  { key: "health_score",      label: "Health",      color: "#34d399", icon: "💪" },
  { key: "financial_score",   label: "Financial",   color: "#60a5fa", icon: "💰" },
  { key: "confidence_score",  label: "Confidence",  color: "#f9a8d4", icon: "🔥" },
  { key: "environment_score", label: "Environment", color: "#818cf8", icon: "🌿" },
];

const CATEGORY_META = {
  wealth:    { icon: "💰", color: "#fbbf24" },
  body:      { icon: "💪", color: "#34d399" },
  love:      { icon: "❤️", color: "#f87171" },
  business:  { icon: "🚀", color: "#60a5fa" },
  home:      { icon: "🏡", color: "#a78bfa" },
  lifestyle: { icon: "✨", color: "#f9a8d4" },
  spiritual: { icon: "🌙", color: "#818cf8" },
};

export default function Progress() {
  const navigate = useNavigate();
  const { testEmail } = useTestProfile();
  const [user, setUser] = useState(null);
  const [scores, setScores] = useState([]);
  const [visions, setVisions] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        if (!u) {
          navigate("/");
          return;
        }
        setUser(u);
        const activeEmail = testEmail || u.email;
        const [s, v, c, h, hl, a] = await Promise.all([
        base44.entities.ScoreHistory.filter({ user_email: activeEmail }, "-created_date", 20),
        base44.entities.VisionItem.filter({ user_email: activeEmail, is_active: true }),
        base44.entities.DailyCheckIn.filter({ user_email: activeEmail }, "-created_date", 30),
        base44.entities.Habit.filter({ user_email: activeEmail, is_active: true }, "-created_date", 50),
        base44.entities.HabitLog.filter({ user_email: activeEmail }, "-log_date", 200),
        base44.entities.AIAnalysis.filter({ user_email: activeEmail }, "-created_date", 1),
      ]);
        setScores(s); setVisions(v); setCheckins(c);
        setHabits(h); setHabitLogs(hl); setAnalysis(a[0] || null);
        setLoading(false);
      } catch (error) {
        console.error("Progress page error:", error);
        setLoading(false);
      }
    })();
  }, [testEmail, navigate]);

  const latest = scores[0];
  const prev = scores[1];
  const growth = latest && prev ? latest.overall_score - prev.overall_score : 0;

  const momentum = !latest ? null
    : latest.overall_score >= 75 ? "Highly Aligned"
    : latest.overall_score >= 60 ? "Building Momentum"
    : latest.overall_score >= 40 ? "Closing the Gap"
    : "Foundation Building";

  const chartData = scores.slice().reverse().map((s, i) => ({
    i: i + 1,
    score: s.overall_score,
    date: new Date(s.created_date).toLocaleDateString("en", { month: "short", day: "numeric" }),
  }));

  const catScores = latest ? CATEGORY_SCORES.map(c => ({ ...c, val: latest[c.key] || 0 })) : [];
  const strongest = catScores.length ? catScores.reduce((a, b) => a.val > b.val ? a : b) : null;
  const weakest = catScores.length ? catScores.reduce((a, b) => a.val < b.val ? a : b) : null;

  const weeklyHabitRate = (() => {
    if (habits.length === 0) return 0;
    let possible = 0, done = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      possible += habits.length;
      done += habitLogs.filter(l => l.log_date === ds && l.completed).length;
    }
    return possible > 0 ? Math.round((done / possible) * 100) : 0;
  })();

  const monthlyHabitRate = (() => {
    if (habits.length === 0) return 0;
    let possible = 0, done = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      possible += habits.length;
      done += habitLogs.filter(l => l.log_date === ds && l.completed).length;
    }
    return possible > 0 ? Math.round((done / possible) * 100) : 0;
  })();

  const visionByCategory = visions.reduce((acc, v) => { acc[v.category] = (acc[v.category] || 0) + 1; return acc; }, {});

  const energyTrend = checkins.slice(0, 14).reverse().map((c) => ({
    date: c.checkin_date,
    energy: c.energy || 0,
    discipline: c.discipline || 0,
  }));

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
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Transformation Results</p>
          <h1 className="font-playfair text-2xl font-semibold">Reality Match Score</h1>
          <p className="text-xs text-muted-foreground mt-1">Your alignment journey, visualized</p>
        </div>

        {!latest ? (
          <div className="flex flex-col items-center py-20 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground mb-2">No alignment data yet</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Complete your Reality Assessment to unlock your full progress dashboard.
            </p>
            <button onClick={() => navigate("/assessment")}
              className="px-6 py-3 gold-gradient text-background font-semibold rounded-xl flex items-center gap-2">
              Take Assessment <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* ── OVERALL SCORE HERO ── */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card glow-gold rounded-2xl p-5 mb-5 border border-primary/20">
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <RadialProgress pct={latest.overall_score} color="hsl(45 80% 60%)" size={88} stroke={8} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-playfair text-xl font-bold text-primary">{latest.overall_score}</span>
                    <span className="text-[9px] text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-0.5">Reality Match Score</p>
                  <p className="font-playfair text-lg font-semibold text-foreground">{momentum}</p>
                  {growth !== 0 && (
                    <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${growth > 0 ? "text-emerald-400" : "text-orange-400"}`}>
                      <TrendingUp className="w-3 h-3" />
                      {growth > 0 ? "+" : ""}{growth} pts since last assessment
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-primary font-medium">{weeklyHabitRate}% this week</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{monthlyHabitRate}% this month</span>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => navigate("/assessment")}
                className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                <RefreshCw className="w-3 h-3" /> Retake assessment to update score
              </button>
            </motion.div>

            {/* ── STRONGEST / WEAKEST ── */}
            {strongest && weakest && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className="glass-card border border-emerald-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Crown className="w-3.5 h-3.5 text-emerald-400" />
                    <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-medium">Strongest</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{strongest.label}</p>
                  <p className="font-playfair text-xl font-bold" style={{ color: strongest.color }}>{strongest.val}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                  className="glass-card border border-orange-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                    <p className="text-[10px] uppercase tracking-widest text-orange-400 font-medium">Focus Area</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{weakest.label}</p>
                  <p className="font-playfair text-xl font-bold" style={{ color: weakest.color }}>{weakest.val}</p>
                </motion.div>
              </div>
            )}

            {/* ── CATEGORY BREAKDOWN ── */}
            <div className="mb-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Category Breakdown</p>
              <div className="grid grid-cols-2 gap-3">
                {catScores.map((cat, i) => (
                  <motion.div key={cat.key}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="glass-card rounded-xl p-4 flex items-center gap-3 border border-border">
                    <span className="text-xl">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-foreground">{cat.label}</p>
                        <span className="text-sm font-bold" style={{ color: cat.color }}>{cat.val}</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${cat.val}%` }}
                          transition={{ delay: i * 0.06 + 0.2, duration: 0.7 }}
                          className="h-full rounded-full" style={{ backgroundColor: cat.color }} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── AI ANALYSIS ── */}
            {analysis && (
              <>
                <div className="glass-card rounded-2xl p-4 mb-4 border border-emerald-500/20">
                  <p className="text-xs uppercase tracking-widest text-emerald-400 font-medium mb-2">✦ Strengths</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{analysis.strengths_summary}</p>
                </div>
                <div className="glass-card rounded-2xl p-4 mb-4 border border-orange-500/20">
                  <p className="text-xs uppercase tracking-widest text-orange-400 font-medium mb-2">⚠ Key Misalignments</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{analysis.misalignment_summary}</p>
                </div>
                <div className="glass-card rounded-2xl p-4 mb-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Beliefs to Release</p>
                  <div className="space-y-2">
                    {analysis.limiting_beliefs?.map((b, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-orange-400 text-xs mt-0.5">✕</span>
                        <p className="text-sm text-muted-foreground">{b}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-card rounded-2xl p-4 mb-5">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Beliefs to Adopt</p>
                  <div className="space-y-2">
                    {analysis.replacement_beliefs?.map((b, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-primary text-xs mt-0.5">✦</span>
                        <p className="text-sm text-foreground/80">{b}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── SCORE HISTORY CARDS ── */}
            {scores.length > 1 && (
              <div className="mb-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Score History</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {scores.map((h) => (
                    <div key={h.id} className="shrink-0 glass-card rounded-xl p-3 text-center min-w-[70px]">
                      <p className={`text-lg font-bold font-playfair ${
                        h.overall_score >= 75 ? "text-emerald-400" : h.overall_score >= 50 ? "text-yellow-400" : "text-orange-400"
                      }`}>{h.overall_score}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {new Date(h.created_date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {/* ── SCORE HISTORY CHART ── */}
            {chartData.length > 1 && (
              <div className="glass-card rounded-2xl p-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Score Over Time</p>
                  <span className="text-[10px] text-muted-foreground">{chartData.length} assessments</span>
                </div>
                <ResponsiveContainer width="100%" height={130}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(220 10% 50%)" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(220 10% 50%)" }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip
                      contentStyle={{ background: "hsl(220 18% 10%)", border: "1px solid hsl(220 15% 18%)", borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: "hsl(45 30% 95%)" }}
                      itemStyle={{ color: "hsl(45 80% 60%)" }}
                    />
                    <Line type="monotone" dataKey="score" stroke="hsl(45 80% 60%)" strokeWidth={2.5}
                      dot={{ fill: "hsl(45 80% 60%)", r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">First</p>
                    <p className="text-xs font-bold text-foreground">{scores[scores.length - 1]?.overall_score}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Latest</p>
                    <p className={`text-xs font-bold ${growth >= 0 ? "text-emerald-400" : "text-orange-400"}`}>
                      {latest.overall_score} {growth !== 0 ? `(${growth > 0 ? "+" : ""}${growth})` : ""}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Best</p>
                    <p className="text-xs font-bold text-primary">{Math.max(...scores.map(s => s.overall_score))}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── HABIT CONSISTENCY TRENDS ── */}
            <div className="glass-card rounded-2xl p-4 mb-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Habit Consistency Trends</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: "This Week", value: `${weeklyHabitRate}%`, color: weeklyHabitRate >= 70 ? "text-emerald-400" : "text-yellow-400" },
                  { label: "This Month", value: `${monthlyHabitRate}%`, color: monthlyHabitRate >= 70 ? "text-emerald-400" : "text-yellow-400" },
                  { label: "Total Habits", value: habits.length, color: "text-primary" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className={`font-playfair text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Weekly completion rate</span>
                  <span>{weeklyHabitRate}%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${weeklyHabitRate}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full rounded-full ${weeklyHabitRate >= 70 ? "bg-emerald-400" : "gold-gradient"}`} />
                </div>
              </div>
            </div>

            {/* ── 14-DAY ENERGY TREND ── */}
            {energyTrend.length > 0 && (
              <div className="glass-card rounded-2xl p-4 mb-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Energy & Discipline Trend</p>
                <div className="flex items-end gap-1 h-12 mb-1">
                  {energyTrend.map((d, i) => (
                    <div key={i} className="flex-1 flex gap-px items-end h-full">
                      <motion.div initial={{ height: 0 }} animate={{ height: `${(d.energy / 10) * 100}%` }}
                        transition={{ delay: i * 0.04, duration: 0.5 }}
                        className="flex-1 rounded-t-sm min-h-[2px]"
                        style={{ backgroundColor: `hsl(45 80% ${40 + d.energy * 3}%)`, opacity: 0.85 }} />
                      <motion.div initial={{ height: 0 }} animate={{ height: `${(d.discipline / 10) * 100}%` }}
                        transition={{ delay: i * 0.04 + 0.1, duration: 0.5 }}
                        className="flex-1 rounded-t-sm min-h-[2px] bg-blue-400/60" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground/50">14 days ago</span>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm" style={{ background: "hsl(45 80% 55%)" }} /><span className="text-[9px] text-muted-foreground">Energy</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-blue-400/60" /><span className="text-[9px] text-muted-foreground">Discipline</span></div>
                  </div>
                  <span className="text-[9px] text-muted-foreground/50">Today</span>
                </div>
              </div>
            )}

            {/* ── VISION ALIGNMENT ── */}
            {visions.length > 0 && (
              <div className="glass-card rounded-2xl p-4 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Vision Alignment</p>
                  <button onClick={() => navigate("/vision-vault")} className="text-[10px] text-primary">View vault →</button>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(visionByCategory).map(([cat, count], i) => {
                    const meta = CATEGORY_META[cat] || { icon: "✦", color: "#fbbf24" };
                    return (
                      <motion.div key={cat} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{meta.icon}</span>
                            <span className="text-xs font-medium text-foreground capitalize">{cat}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{count} vision{count > 1 ? "s" : ""}</span>
                        </div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(count * 20, 100)}%` }}
                            transition={{ delay: i * 0.05 + 0.2, duration: 0.8 }}
                            className="h-full rounded-full" style={{ backgroundColor: meta.color }} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── PROGRESS NARRATIVE ── */}
            <div className="glass-card border border-primary/15 rounded-2xl p-4 mb-2">
              <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-2">Growth Narrative</p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {latest.overall_score >= 75
                  ? `You are operating in high alignment. Your score of ${latest.overall_score} reflects a life that is increasingly matching your vision. Keep compounding daily.`
                  : latest.overall_score >= 55
                  ? `At ${latest.overall_score}, you are building real momentum. ${strongest ? `Your ${strongest.label.toLowerCase()} is your strongest asset.` : ""} ${weakest ? `Direct your next growth phase toward ${weakest.label.toLowerCase()}.` : ""}`
                  : `Your score of ${latest.overall_score} shows real self-awareness — you see the gap. ${weakest ? `Your biggest lever right now is ${weakest.label.toLowerCase()}.` : ""} Every habit completed today moves this number.`
                }
              </p>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
import { useState, useEffect } from "react";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/lib/UserProfileContext";
import { TrendingUp, ArrowRight, RefreshCw } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import ShiftGamificationPanel from "@/components/daily/ShiftGamificationPanel";
import { loadShiftStats } from "@/lib/shiftGamification";

export default function Progress() {
  const navigate = useNavigate();
  const { user, loading: profileLoading } = useUserProfile();
  const [scores, setScores] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shiftStats, setShiftStats] = useState(null);

  const loadData = async () => {
    if (!user || profileLoading) return;
    const [data, stats] = await Promise.all([
      base44.entities.ScoreHistory.filter({ user_email: user.email }, "-created_date", 20),
      loadShiftStats(user.email),
    ]);
    setScores(data);
    setLatest(data[0] || null);
    setShiftStats(stats);
    setLoading(false);
  };

  const { containerRef, setIsRefreshing } = usePullToRefresh(async () => {
    await loadData();
    setIsRefreshing(false);
  });

  useEffect(() => {
    if (profileLoading) return;
    if (!user) navigate("/");
  }, [user, profileLoading, navigate]);

  useEffect(() => {
    loadData();
  }, [user?.email, profileLoading]);

  if (loading || profileLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const categories = latest ? [
    { label: "Mindset", score: latest.mindset_score, icon: "🧠" },
    { label: "Discipline", score: latest.discipline_score, icon: "⚡" },
    { label: "Health", score: latest.health_score, icon: "💪" },
    { label: "Financial", score: latest.financial_score, icon: "💰" },
    { label: "Confidence", score: latest.confidence_score, icon: "🔥" },
    { label: "Environment", score: latest.environment_score, icon: "🌿" },
  ] : [];

  const chartData = scores.slice().reverse().map((s, i) => ({
    i: i + 1,
    score: s.overall_score,
    date: new Date(s.created_date).toLocaleDateString("en", { month: "short", day: "numeric" }),
  }));

  const scoreColor = (s) => {
    if (!s) return "text-muted-foreground";
    if (s >= 75) return "text-emerald-400";
    if (s >= 50) return "text-yellow-400";
    return "text-orange-400";
  };

  return (
    <AppLayout>
      <div ref={containerRef} className="px-5 pt-4 pb-6">
        <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Your Alignment</p>
        <h1 className="font-playfair text-2xl font-semibold mb-8">Reality Match Score</h1>

        {!latest ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full glass-card border border-primary/20 flex items-center justify-center mb-4">
              <span className="text-3xl font-playfair font-bold text-muted-foreground">—</span>
            </div>
            <h2 className="font-playfair text-lg font-semibold mb-2">No Score Yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">Complete your Reality Assessment to see your alignment score</p>
            <button onClick={() => navigate("/assessment")}
              className="px-6 py-2.5 gold-gradient text-background font-semibold rounded-xl flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <>
            {/* Main Score */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card glow-gold rounded-2xl p-6 mb-6 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Overall Alignment</p>
                <button onClick={() => navigate("/assessment")}
                  className="text-[10px] font-semibold text-primary border border-primary/30 rounded-full px-2.5 py-1">
                  Retake
                </button>
              </div>
              <div className="flex items-end gap-2 mb-4">
                <span className={`font-playfair text-5xl font-bold ${scoreColor(latest.overall_score)}`}>
                  {latest.overall_score}
                </span>
                <span className="text-muted-foreground text-sm mb-2">/100</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {latest.overall_score >= 75
                  ? "You are operating in high alignment. Keep compounding daily."
                  : latest.overall_score >= 50
                  ? "You are building momentum. Each action moves this number."
                  : "You see the gap. Your next habits will shift this."}
              </p>
            </motion.div>

            {/* Category Breakdown */}
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Categories</p>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat, i) => (
                  <motion.div key={cat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="glass-card rounded-xl p-4 flex items-center gap-3 border border-border">
                    <span className="text-lg">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{cat.label}</p>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden mt-1">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${cat.score}%` }}
                          transition={{ delay: i * 0.06 + 0.2, duration: 0.7 }}
                          className="h-full rounded-full" style={{ background: "linear-gradient(90deg, hsl(45 80% 60%), hsl(38 90% 50%))" }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 font-semibold">{cat.score}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Score Trend */}
            {chartData.length > 1 && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Trend</p>
                <div className="glass-card rounded-2xl p-4 border border-border">
                  <ResponsiveContainer width="100%" height={150}>
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
                </div>
              </div>
            )}

            {/* Score History */}
            {scores.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">History</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {scores.map((h) => (
                    <div key={h.id} className="shrink-0 glass-card rounded-xl p-3 text-center min-w-[70px]">
                      <p className={`text-lg font-bold font-playfair ${scoreColor(h.overall_score)}`}>{h.overall_score}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {new Date(h.created_date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">Daily Momentum</p>
              <ShiftGamificationPanel stats={shiftStats} />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
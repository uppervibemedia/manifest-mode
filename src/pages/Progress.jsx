import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Flame, TrendingUp, BookOpen, CheckSquare } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export default function Progress() {
  const navigate = useNavigate();
  const [data, setData] = useState({ scores: [], checkins: [], plans: [], journals: [], profile: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const [scores, checkins, plans, journals, profiles] = await Promise.all([
        base44.entities.ScoreHistory.filter({ user_email: user.email }, "-created_date", 30),
        base44.entities.DailyCheckIn.filter({ user_email: user.email }, "-created_date", 30),
        base44.entities.DailyShiftPlan.filter({ user_email: user.email }, "-created_date", 30),
        base44.entities.JournalEntry.filter({ user_email: user.email }, "-created_date", 30),
        base44.entities.UserProfile.filter({ user_email: user.email }),
      ]);
      setData({ scores, checkins, plans, journals, profile: profiles[0] || null });
      setLoading(false);
    })();
  }, []);

  const chartData = data.scores.slice().reverse().map((s, i) => ({
    day: i + 1,
    score: s.overall_score,
  }));

  const completedPlans = data.plans.filter(p => p.is_completed).length;
  const completionRate = data.plans.length ? Math.round((completedPlans / data.plans.length) * 100) : 0;

  const avgCheckinEnergy = data.checkins.length
    ? Math.round(data.checkins.reduce((a, c) => a + (c.energy || 5), 0) / data.checkins.length * 10)
    : 0;

  const latestScore = data.scores[0]?.overall_score;
  const firstScore = data.scores[data.scores.length - 1]?.overall_score;
  const improvement = latestScore && firstScore ? latestScore - firstScore : 0;

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
          <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Your Evolution</p>
          <h1 className="font-playfair text-2xl font-semibold">Progress</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: <Flame className="w-4 h-4 text-primary" />, value: data.profile?.streak_count || 0, label: "Day Streak" },
            { icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, value: improvement > 0 ? `+${improvement}` : improvement, label: "Score Growth" },
            { icon: <CheckSquare className="w-4 h-4 text-blue-400" />, value: `${completionRate}%`, label: "Plan Completion" },
            { icon: <BookOpen className="w-4 h-4 text-purple-400" />, value: data.journals.length, label: "Journal Entries" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">{stat.icon}</div>
              <p className="font-playfair text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Score Chart */}
        {chartData.length > 1 && (
          <div className="glass-card rounded-2xl p-4 mb-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">Score Trend</p>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(220 10% 50%)" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ background: "hsl(220 18% 10%)", border: "1px solid hsl(220 15% 18%)", borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: "hsl(45 30% 95%)" }}
                  itemStyle={{ color: "hsl(45 80% 60%)" }}
                />
                <Line type="monotone" dataKey="score" stroke="hsl(45 80% 60%)" strokeWidth={2}
                  dot={{ fill: "hsl(45 80% 60%)", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Check-ins */}
        {data.checkins.length > 0 && (
          <div className="glass-card rounded-2xl p-4 mb-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Last 7 Check-ins</p>
            <div className="space-y-2">
              {data.checkins.slice(0, 7).map((c, i) => (
                <div key={c.id} className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.checkin_date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                  <div className="flex gap-3">
                    <span className="text-xs text-foreground">E: <span className="text-primary font-medium">{c.energy}/10</span></span>
                    <span className="text-xs text-foreground">C: <span className="text-primary font-medium">{c.confidence}/10</span></span>
                    <span className="text-xs text-foreground">D: <span className="text-primary font-medium">{c.discipline}/10</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.scores.length === 0 && data.checkins.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <TrendingUp className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No data yet. Complete an assessment to start tracking your evolution.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
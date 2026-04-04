import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles, BarChart3, Loader2, Trash2, Star, Brain, Calendar } from "lucide-react";
import { getLevelForPoints, POINT_VALUES } from "@/lib/identityEngine";
import AppLayout from "@/components/layout/AppLayout";
import HabitCard from "@/components/habits/HabitCard";
import HabitCalendar from "@/components/habits/HabitCalendar";
import AddHabitModal from "@/components/habits/AddHabitModal";
import AlignmentSummary from "@/components/habits/AlignmentSummary";

const CATEGORY_META = {
  wealth:     { icon: "💰", color: "#fbbf24" },
  body:       { icon: "💪", color: "#34d399" },
  love:       { icon: "❤️", color: "#f87171" },
  business:   { icon: "🚀", color: "#60a5fa" },
  home:       { icon: "🏡", color: "#a78bfa" },
  lifestyle:  { icon: "✨", color: "#f9a8d4" },
  spiritual:  { icon: "🌙", color: "#818cf8" },
  mindset:    { icon: "🧠", color: "#c084fc" },
  discipline: { icon: "⚡", color: "#fbbf24" },
};

const TABS = ["Today", "Stats", "All Habits"];

// Shorten verbose AI-generated habit titles to mobile-friendly names
function shortenTitle(title) {
  const t = title.trim();
  const map = [
    [/morning routine|before any screen/i, "Screen-Free Morning Routine"],
    [/move.*body.*intentional|30 minute.*movement|exercise.*5 day/i, "Intentional Movement"],
    [/letter.*future self|future self.*letter/i, "Future Self Letter"],
    [/top 3.*non-negotiable|non-negotiable.*habit.*before noon|execute.*before noon/i, "Top 3 Before Noon"],
    [/review.*financ.*sunday|track.*financ.*weekly|financ.*review.*weekly/i, "Weekly Finance Review"],
    [/cold.*shower|cold.*plunge/i, "Cold Shower"],
    [/visuali.*future self|future self.*visuali/i, "Future Self Visualization"],
    [/read.*30 min|30 min.*read|daily reading/i, "Daily Reading"],
    [/journal.*reflect|reflect.*journal|daily journal/i, "Daily Journaling"],
    [/meditat|breathwork|breath practice/i, "Mindfulness Practice"],
    [/gratitude.*practice|practice.*gratitude|gratitude.*journal/i, "Gratitude Practice"],
    [/affirmation|positive declar/i, "Daily Affirmations"],
    [/network|connect.*professional|build.*relationship/i, "Strategic Networking"],
    [/sleep.*routine|wind.*down.*routine|bedtime/i, "Evening Wind-Down"],
    [/learn.*skill|skill.*develop|online course/i, "Skill Development"],
  ];
  for (const [pattern, short] of map) {
    if (pattern.test(t)) return short;
  }
  // Generic truncation: take first meaningful chunk before comma/dash/—
  const cut = t.split(/[,\-—]/)[0].trim();
  return cut.length <= 40 ? cut : cut.slice(0, 38).trim() + "…";
}

// Detect habits that are weekly rituals by title keywords
function isWeeklyRitual(habit) {
  const t = (habit.title || "").toLowerCase();
  const d = (habit.description || "").toLowerCase();
  const weeklyKeywords = ["sunday", "weekly", "every week", "once a week", "per week", "monthly", "review", "finance review", "check in with", "weekly ritual"];
  return weeklyKeywords.some(kw => t.includes(kw) || d.includes(kw));
}

// Detect identity activation habits
function isIdentityHabit(habit) {
  const t = (habit.title || "").toLowerCase();
  const identityKeywords = ["future self", "letter", "journal", "meditat", "visuali", "affirmation", "breath", "gratitude", "prayer", "reflect"];
  return habit.source === "ai" || habit.category === "spiritual" || identityKeywords.some(kw => t.includes(kw));
}

// Categorize habits into sections
function getSections(habits) {
  const top3 = habits.filter(h => h.is_priority).slice(0, 3);
  const weekly = habits.filter(h => !top3.includes(h) && isWeeklyRitual(h));
  const identity = habits.filter(h => !top3.includes(h) && !weekly.includes(h) && isIdentityHabit(h));
  const daily = habits.filter(h => !top3.includes(h) && !weekly.includes(h) && !identity.includes(h));
  return { top3, daily, identity, weekly };
}

export default function HabitTracker() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [user, setUser] = useState(null);
  const [habits, setHabits] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("Today");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [h, tl, hl, ai] = await Promise.all([
      base44.entities.Habit.filter({ user_email: u.email, is_active: true }, "-is_priority", 50),
      base44.entities.HabitLog.filter({ user_email: u.email, log_date: today }),
      base44.entities.HabitLog.filter({ user_email: u.email }, "-log_date", 200),
      base44.entities.AIAnalysis.filter({ user_email: u.email }, "-created_date", 1),
    ]);
    setHabits(h);
    setTodayLogs(tl);
    setHistoryLogs(hl);
    setAnalysis(ai[0] || null);
    setLoading(false);
  };

  // Generate blueprint habits from AI analysis
  const generateFromBlueprint = async () => {
    if (!analysis) return;
    setGenerating(true);
    const blueprintHabits = [
      ...(analysis.habit_upgrades || []).map((title, i) => ({
        title: shortenTitle(title),
        category: i === 0 ? "discipline" : i === 1 ? "body" : "mindset",
        description: "From your Future Self Blueprint",
        source: "blueprint",
        alignment_impact: "high",
        is_priority: i === 0,
      })),
      ...(analysis.action_plan || []).slice(0, 2).map((title) => ({
        title: shortenTitle(title.replace(/^[0-9]+\.\s*/, "")),
        category: "mindset",
        description: "Identity activation step",
        source: "ai",
        alignment_impact: "high",
        is_priority: false,
      })),
    ];
    const existingTitles = habits.map(h => h.title.toLowerCase());
    const toCreate = blueprintHabits.filter(bh => !existingTitles.includes(bh.title.toLowerCase()));
    const created = await Promise.all(
      toCreate.map(bh => base44.entities.Habit.create({
        ...bh,
        user_email: user.email,
        is_active: true,
        streak_count: 0,
        total_completions: 0,
      }))
    );
    setHabits(prev => [...created, ...prev]);
    setGenerating(false);
  };

  const isCompleted = (habitId) => todayLogs.some(l => l.habit_id === habitId && l.completed);

  const toggleHabit = async (habit) => {
    const done = isCompleted(habit.id);
    if (done) {
      // Undo completion
      const log = todayLogs.find(l => l.habit_id === habit.id && l.completed);
      if (log) {
        await base44.entities.HabitLog.update(log.id, { completed: false });
        setTodayLogs(prev => prev.map(l => l.id === log.id ? { ...l, completed: false } : l));
        // Decrement streak if last completed was today
        if (habit.last_completed_date === today) {
          await base44.entities.Habit.update(habit.id, {
            total_completions: Math.max(0, (habit.total_completions || 0) - 1),
          });
          setHabits(prev => prev.map(h => h.id === habit.id
            ? { ...h, total_completions: Math.max(0, (h.total_completions || 0) - 1) }
            : h));
        }
      }
    } else {
      // Create or update log
      const existing = todayLogs.find(l => l.habit_id === habit.id);
      let newLog;
      if (existing) {
        newLog = await base44.entities.HabitLog.update(existing.id, { completed: true });
        setTodayLogs(prev => prev.map(l => l.id === existing.id ? { ...l, completed: true } : l));
      } else {
        newLog = await base44.entities.HabitLog.create({
          user_email: user.email,
          habit_id: habit.id,
          habit_title: habit.title,
          category: habit.category,
          log_date: today,
          completed: true,
        });
        setTodayLogs(prev => [...prev, newLog]);
        setHistoryLogs(prev => [newLog, ...prev]);
      }
      // Update streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split("T")[0];
      const newStreak = habit.last_completed_date === yStr
        ? (habit.streak_count || 0) + 1
        : habit.last_completed_date === today
        ? habit.streak_count
        : 1;
      await base44.entities.Habit.update(habit.id, {
        streak_count: newStreak,
        last_completed_date: today,
        total_completions: (habit.total_completions || 0) + 1,
      });
      setHabits(prev => prev.map(h => h.id === habit.id
        ? { ...h, streak_count: newStreak, last_completed_date: today, total_completions: (h.total_completions || 0) + 1 }
        : h));

      // Award alignment points
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles[0]) {
        const updatedHabits = habits.map(h => h.id === habit.id ? { ...h, streak_count: newStreak } : h);
        const newCompletedToday = updatedHabits.filter(h => h.id === habit.id ? true : todayLogs.some(l => l.habit_id === h.id && l.completed)).length;
        const allDone = newCompletedToday >= habits.length;
        let pts = POINT_VALUES.HABIT_COMPLETE + (allDone ? POINT_VALUES.ALL_HABITS_COMPLETE : 0);
        const currentPoints = profiles[0].alignment_points || 0;
        const newPoints = currentPoints + pts;
        await base44.entities.UserProfile.update(profiles[0].id, {
          alignment_points: newPoints,
          identity_level: getLevelForPoints(newPoints).level,
          total_habits_completed: (profiles[0].total_habits_completed || 0) + 1,
        });
      }
    }
  };

  const deleteHabit = async (habitId) => {
    await base44.entities.Habit.update(habitId, { is_active: false });
    setHabits(prev => prev.filter(h => h.id !== habitId));
  };

  // Stats
  const completedToday = habits.filter(h => isCompleted(h.id)).length;
  const totalToday = habits.length;
  const completionPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Weekly rate: last 7 days
  const weeklyRate = (() => {
    if (habits.length === 0) return 0;
    let totalPossible = 0, totalDone = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const dayLogs = historyLogs.filter(l => l.log_date === ds);
      totalPossible += habits.length;
      totalDone += dayLogs.filter(l => l.completed).length;
    }
    return totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
  })();

  // Monthly rate
  const monthlyRate = (() => {
    if (habits.length === 0) return 0;
    let totalPossible = 0, totalDone = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      const dayLogs = historyLogs.filter(l => l.log_date === ds);
      totalPossible += habits.length;
      totalDone += dayLogs.filter(l => l.completed).length;
    }
    return totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
  })();

  // Best streak across all habits
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak_count || 0), 0);

  // Missed yesterday
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];
  const missedYesterday = habits.filter(h => {
    const yLog = historyLogs.find(l => l.habit_id === h.id && l.log_date === yStr && l.completed);
    return !yLog;
  });

  // High-impact habits sorted first
  const sortedHabits = [...habits].sort((a, b) => {
    const imp = { high: 0, medium: 1, low: 2 };
    if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
    return (imp[a.alignment_impact] || 1) - (imp[b.alignment_impact] || 1);
  });

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
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Alignment System</p>
            <h1 className="font-playfair text-2xl font-semibold">Daily Habits</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center text-background shrink-0">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Generate from Blueprint CTA */}
        {habits.length === 0 && analysis && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card glow-gold border border-primary/25 rounded-2xl p-5 mb-5 text-center">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="font-playfair text-base font-semibold mb-1">Load Your Blueprint Habits</p>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Your Future Self Blueprint contains personalized habits matched to your gaps and goals. Load them now.
            </p>
            <button onClick={generateFromBlueprint} disabled={generating}
              className="px-6 py-3 gold-gradient text-background font-semibold rounded-xl flex items-center gap-2 mx-auto disabled:opacity-40">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? "Loading..." : "Load Blueprint Habits"}
            </button>
          </motion.div>
        )}

        {/* Tabs */}
        {habits.length > 0 && (
          <>
            <div className="flex gap-1 p-1 bg-muted rounded-xl mb-5">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* TODAY TAB */}
            {activeTab === "Today" && (
              <AnimatePresence mode="wait">
                <motion.div key="today" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  {/* Daily Alignment Summary */}
                  <AlignmentSummary
                    streak={bestStreak}
                    completionPct={completionPct}
                    habits={habits}
                    todayLogs={todayLogs}
                    weeklyRate={weeklyRate}
                  />

                  {/* 0% guidance nudge */}
                  {completionPct === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card border border-primary/20 rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
                    >
                      <span className="text-base shrink-0">✦</span>
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        {bestStreak > 0
                          ? `Your ${bestStreak}-day streak is on the line — complete one habit to protect it.`
                          : "Start with one habit to activate today's alignment. Momentum starts here."}
                      </p>
                    </motion.div>
                  )}

                  {(() => {
                    const { top3, daily, identity, weekly } = getSections(sortedHabits);

                    const SectionHeader = ({ icon: Icon, title, color }) => (
                      <div className="flex items-center gap-2 mb-2.5">
                        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                        <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color }}>{title}</p>
                        <div className="flex-1 h-px bg-border/60" />
                      </div>
                    );

                    return (
                      <div className="space-y-5">
                        {/* Top 3 */}
                        {top3.length > 0 && (
                          <div>
                            <SectionHeader icon={Star} title="Today's Top 3 Alignment Habits" color="hsl(45 80% 60%)" />
                            <div className="space-y-2">
                              {top3.map((habit, i) => (
                                <HabitCard key={habit.id} habit={habit} completed={isCompleted(habit.id)} onToggle={toggleHabit} index={i} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Daily Habits */}
                        {daily.length > 0 && (
                          <div>
                            <SectionHeader icon={Sparkles} title="Daily Habits" color="#60a5fa" />
                            <div className="space-y-2">
                              {daily.map((habit, i) => (
                                <HabitCard key={habit.id} habit={habit} completed={isCompleted(habit.id)} onToggle={toggleHabit} index={i} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Identity Activation */}
                        {identity.length > 0 && (
                          <div>
                            <SectionHeader icon={Brain} title="Identity Activation" color="#c084fc" />
                            <div className="space-y-2">
                              {identity.map((habit, i) => (
                                <HabitCard key={habit.id} habit={habit} completed={isCompleted(habit.id)} onToggle={toggleHabit} index={i} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Weekly Alignment Rituals */}
                        {weekly.length > 0 && (
                          <div>
                            <SectionHeader icon={Calendar} title="Weekly Alignment Rituals" color="#34d399" />
                            <div className="space-y-2">
                              {weekly.map((habit, i) => (
                                <HabitCard key={habit.id} habit={habit} completed={isCompleted(habit.id)} onToggle={toggleHabit} index={i} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* If no sections have habits, show all */}
                        {top3.length === 0 && daily.length === 0 && identity.length === 0 && weekly.length === 0 && sortedHabits.map((habit, i) => (
                          <HabitCard key={habit.id} habit={habit} completed={isCompleted(habit.id)} onToggle={toggleHabit} index={i} />
                        ))}
                      </div>
                    );
                  })()}

                  {/* Add from blueprint */}
                  {analysis && habits.length > 0 && (
                    <button onClick={generateFromBlueprint} disabled={generating}
                      className="mt-5 w-full glass-card border border-primary/20 rounded-xl py-3 flex items-center justify-center gap-2 text-xs text-primary hover:border-primary/40 transition-colors disabled:opacity-40">
                      {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {generating ? "Generating..." : "Add Blueprint Habits"}
                    </button>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* STATS TAB */}
            {activeTab === "Stats" && (
              <AnimatePresence mode="wait">
                <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {/* Key numbers */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Best Streak", value: `${bestStreak}d`, sub: "days in a row", color: "text-orange-400" },
                      { label: "Today", value: `${completionPct}%`, sub: `${completedToday}/${totalToday} habits`, color: completionPct === 100 ? "text-emerald-400" : "text-foreground" },
                      { label: "This Week", value: `${weeklyRate}%`, sub: "consistency rate", color: weeklyRate >= 70 ? "text-emerald-400" : "text-yellow-400" },
                      { label: "This Month", value: `${monthlyRate}%`, sub: "consistency rate", color: monthlyRate >= 70 ? "text-emerald-400" : "text-yellow-400" },
                    ].map((s, i) => (
                      <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="glass-card border border-border rounded-xl p-4">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">{s.label}</p>
                        <p className={`font-playfair text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Calendar heatmap */}
                  <div className="glass-card border border-border rounded-2xl p-4">
                    <HabitCalendar logs={historyLogs} />
                  </div>

                  {/* Per-category breakdown */}
                  <div className="glass-card border border-border rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">By Category</p>
                    <div className="space-y-3">
                      {Object.entries(
                        habits.reduce((acc, h) => { acc[h.category] = (acc[h.category] || 0) + 1; return acc; }, {})
                      ).map(([cat, count], i) => {
                        const meta = CATEGORY_META[cat] || { icon: "✦", color: "#fbbf24" };
                        const catCompleted = habits.filter(h => h.category === cat && isCompleted(h.id)).length;
                        const pct = Math.round((catCompleted / count) * 100);
                        return (
                          <motion.div key={cat} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span>{meta.icon}</span>
                                <span className="text-xs font-medium text-foreground capitalize">{cat}</span>
                              </div>
                              <span className="text-xs font-semibold" style={{ color: meta.color }}>{catCompleted}/{count}</span>
                            </div>
                            <div className="h-1.5 bg-border rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                transition={{ delay: i * 0.05 + 0.2, duration: 0.7 }}
                                className="h-full rounded-full" style={{ backgroundColor: meta.color }} />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* High-impact habits */}
                  <div className="glass-card border border-border rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Most Alignment-Shifting</p>
                    <div className="space-y-2">
                      {habits.filter(h => h.alignment_impact === "high").slice(0, 4).map((h, i) => (
                        <div key={h.id} className="flex items-center gap-3">
                          <span className="text-sm">{CATEGORY_META[h.category]?.icon || "✦"}</span>
                          <p className="text-xs text-foreground flex-1 line-clamp-1">{h.title}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-emerald-400 font-semibold">{h.total_completions || 0}x</span>
                          </div>
                        </div>
                      ))}
                      {habits.filter(h => h.alignment_impact === "high").length === 0 && (
                        <p className="text-xs text-muted-foreground/60 italic">Mark habits as high impact to track them here</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* ALL HABITS TAB */}
            {activeTab === "All Habits" && (
              <AnimatePresence mode="wait">
                <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                  {sortedHabits.map((habit, i) => (
                    <motion.div key={habit.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="glass-card border border-border rounded-2xl p-4 flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">{habit.title}</p>
                          <span className="text-sm shrink-0">{CATEGORY_META[habit.category]?.icon || "✦"}</span>
                        </div>
                        {habit.description && <p className="text-[11px] text-muted-foreground mb-1.5">{habit.description}</p>}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{habit.source}</span>
                          <span className="text-[9px] text-muted-foreground capitalize">{habit.category}</span>
                          {habit.streak_count > 0 && (
                            <span className="text-[9px] text-orange-400">🔥 {habit.streak_count}d streak</span>
                          )}
                          <span className="text-[9px] text-muted-foreground">{habit.total_completions || 0} total</span>
                        </div>
                      </div>
                      <button onClick={() => deleteHabit(habit.id)}
                        className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 hover:bg-destructive/20 transition-colors mt-0.5">
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}

        {/* Empty state — no habits at all */}
        {habits.length === 0 && !analysis && (
          <div className="flex flex-col items-center py-20 text-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground mb-2">No habits yet</p>
            <p className="text-xs text-muted-foreground mb-6 max-w-xs">Complete your assessment to get AI-generated habits from your Blueprint, or add your own.</p>
            <div className="flex gap-3">
              <button onClick={() => navigate("/assessment")}
                className="px-5 py-2.5 gold-gradient text-background text-sm font-semibold rounded-xl">
                Take Assessment
              </button>
              <button onClick={() => setShowAdd(true)}
                className="px-5 py-2.5 bg-card border border-border text-sm font-medium text-foreground rounded-xl">
                Add Manually
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <AddHabitModal
            userEmail={user?.email}
            onClose={() => setShowAdd(false)}
            onSave={(h) => { setHabits(prev => [h, ...prev]); setShowAdd(false); }}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
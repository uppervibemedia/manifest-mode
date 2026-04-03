import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Check, RefreshCw, Sparkles, Target, Eye, MessageSquare, Zap } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";

export default function ShiftPlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { loadPlan(); }, []);

  const loadPlan = async () => {
    const user = await base44.auth.me();
    const plans = await base44.entities.DailyShiftPlan.filter({ user_email: user.email, plan_date: today });
    setPlan(plans[0] || null);
    setLoading(false);
  };

  const toggleHabit = async (habit) => {
    if (!plan) return;
    setSaving(true);
    const completed = plan.completed_habits || [];
    const updated = completed.includes(habit)
      ? completed.filter(h => h !== habit)
      : [...completed, habit];
    const allDone = updated.length === (plan.habits?.length || 0);
    const saved = await base44.entities.DailyShiftPlan.update(plan.id, {
      completed_habits: updated,
      is_completed: allDone,
    });
    setPlan(prev => ({ ...prev, completed_habits: updated, is_completed: allDone }));
    setSaving(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Today's Plan</p>
          <h1 className="font-playfair text-2xl font-semibold">Daily Shift Plan</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {!plan ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-playfair text-xl font-semibold mb-2">No Plan Yet</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs">Complete your Reality Assessment to generate your personalized daily shift plan</p>
            <button onClick={() => navigate("/assessment")}
              className="px-6 py-3 gold-gradient text-background font-semibold rounded-xl">
              Take Assessment
            </button>
          </motion.div>
        ) : (
          <>
            {/* Completion Banner */}
            {plan.is_completed && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="glass-card border border-emerald-500/30 rounded-2xl p-4 mb-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-400">All done today! ✦</p>
                  <p className="text-xs text-muted-foreground">You're operating like your future self</p>
                </div>
              </motion.div>
            )}

            {/* Daily Habits */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-4 h-4 text-primary" />
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Daily Habits</p>
              </div>
              <div className="space-y-2">
                {plan.habits?.map((habit, i) => {
                  const done = plan.completed_habits?.includes(habit);
                  return (
                    <motion.button key={i} onClick={() => toggleHabit(habit)}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className={`w-full glass-card rounded-xl p-4 flex items-start gap-3 text-left transition-all border ${
                        done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border hover:border-primary/30"
                      }`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        done ? "border-emerald-500 bg-emerald-500" : "border-border"
                      }`}>
                        {done && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <p className={`text-sm leading-relaxed ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {habit}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Mindset Focus */}
            <div className="glass-card rounded-2xl p-4 mb-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-xs uppercase tracking-widest text-primary/70 font-medium">Mindset Focus</p>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{plan.mindset_focus}</p>
            </div>

            {/* Affirmation */}
            <div className="glass-card rounded-2xl p-4 mb-4 border-l-2 border-primary/50">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">Today's Affirmation</p>
              <p className="text-sm text-foreground italic leading-relaxed">"{plan.affirmation}"</p>
            </div>

            {/* Action Challenge */}
            <div className="glass-card rounded-2xl p-4 mb-4 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-amber-400" />
                <p className="text-xs uppercase tracking-widest text-amber-400/70 font-medium">Action Challenge</p>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{plan.action_challenge}</p>
            </div>

            {/* Visualization */}
            <div className="glass-card rounded-2xl p-4 mb-4 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <p className="text-xs uppercase tracking-widest text-purple-400/70 font-medium">Visualization</p>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{plan.visualization_prompt}</p>
            </div>

            {/* Reflection */}
            <div className="glass-card rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Evening Reflection</p>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{plan.reflection_prompt}</p>
              <button onClick={() => navigate("/journal")}
                className="mt-3 text-xs text-primary underline underline-offset-2">
                Write in journal →
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
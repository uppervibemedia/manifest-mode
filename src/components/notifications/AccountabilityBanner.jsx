import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Flame, AlertCircle, TrendingUp, Zap, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

function buildNotifications({ profile, latestScore, shiftPlan, checkinToday, checkins }) {
  const notes = [];
  const today = new Date().toISOString().split("T")[0];
  const hour = new Date().getHours();

  // No assessment yet
  if (!latestScore) {
    notes.push({
      id: "no_assessment",
      type: "action",
      icon: <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />,
      message: "Your Reality Match Score is waiting. Take your first assessment.",
      cta: "Start →",
      route: "/assessment",
      color: "border-amber-400/30 bg-amber-400/5",
    });
  }

  // Streak at risk — no checkin today and it's after noon
  if (!checkinToday && hour >= 12 && (profile?.streak_count || 0) > 0) {
    notes.push({
      id: "streak_risk",
      type: "warning",
      icon: <Flame className="w-4 h-4 text-orange-400 shrink-0" />,
      message: `Your ${profile.streak_count}-day streak is at risk. Check in before midnight.`,
      cta: "Check in →",
      route: "/checkin",
      color: "border-orange-400/30 bg-orange-400/5",
    });
  }

  // Habits incomplete — after 6pm
  if (shiftPlan && hour >= 18) {
    const done = shiftPlan.completed_habits?.length || 0;
    const total = shiftPlan.habits?.length || 0;
    if (done < total) {
      notes.push({
        id: "habits_incomplete",
        type: "warning",
        icon: <Zap className="w-4 h-4 text-yellow-400 shrink-0" />,
        message: `${total - done} habit${total - done > 1 ? "s" : ""} left today. Your future self is watching.`,
        cta: "Complete →",
        route: "/shift-plan",
        color: "border-yellow-400/30 bg-yellow-400/5",
      });
    }
  }

  // All habits done — positive reinforcement
  if (shiftPlan?.is_completed) {
    notes.push({
      id: "habits_done",
      type: "success",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
      message: "All habits complete today. You're operating like your future self. ✦",
      cta: null,
      route: null,
      color: "border-emerald-400/30 bg-emerald-400/5",
    });
  }

  // Low score alert
  if (latestScore && latestScore.overall_score < 50) {
    notes.push({
      id: "low_score",
      type: "action",
      icon: <TrendingUp className="w-4 h-4 text-primary shrink-0" />,
      message: "Your alignment score is below 50. Your blueprint has the keys to shift this.",
      cta: "View Blueprint →",
      route: "/blueprint",
      color: "border-primary/30 bg-primary/5",
    });
  }

  // No checkin in 3+ days
  if (checkins.length === 0 && latestScore) {
    notes.push({
      id: "no_checkin",
      type: "action",
      icon: <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />,
      message: "You haven't logged a check-in yet. Start tracking your daily state.",
      cta: "Check in →",
      route: "/checkin",
      color: "border-blue-400/30 bg-blue-400/5",
    });
  }

  return notes.slice(0, 2); // max 2 at a time
}

export default function AccountabilityBanner() {
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const today = new Date().toISOString().split("T")[0];
      const [profiles, scores, plans, checkins] = await Promise.all([
        base44.entities.UserProfile.filter({ user_email: user.email }),
        base44.entities.ScoreHistory.filter({ user_email: user.email }, "-created_date", 1),
        base44.entities.DailyShiftPlan.filter({ user_email: user.email, plan_date: today }),
        base44.entities.DailyCheckIn.filter({ user_email: user.email }, "-created_date", 3),
      ]);
      const checkinToday = checkins.some(c => c.checkin_date === today);
      const notes = buildNotifications({
        profile: profiles[0],
        latestScore: scores[0],
        shiftPlan: plans[0],
        checkinToday,
        checkins,
      });
      setNotifications(notes);
    })();
  }, []);

  const visible = notifications.filter(n => !dismissed.includes(n.id));

  if (visible.length === 0) return null;

  return (
    <div className="px-5 pt-3 space-y-2">
      <AnimatePresence>
        {visible.map((n) => (
          <motion.div key={n.id}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
            className={`glass-card border rounded-xl px-4 py-3 flex items-center gap-3 ${n.color}`}>
            {n.icon}
            <p className="flex-1 text-xs text-foreground/80 leading-relaxed">{n.message}</p>
            {n.cta && n.route && (
              <button onClick={() => navigate(n.route)}
                className="shrink-0 text-xs font-semibold text-primary whitespace-nowrap">
                {n.cta}
              </button>
            )}
            <button onClick={() => setDismissed(p => [...p, n.id])}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
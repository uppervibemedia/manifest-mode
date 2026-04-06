import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/lib/UserProfileContext";
import { Sun, Moon, Check, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import RefreshSpinner from "@/components/mobile/RefreshSpinner";
import NotificationPermissionModal from "@/components/notifications/NotificationPermissionModal";
import { getLocalToday } from "@/lib/dateUtils";
import { getTodaysShift } from "@/lib/shiftEngine";
import MicroActionSuggester from "@/components/daily/MicroActionSuggester";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { useScrollContainer } from "@/lib/ScrollContext";


// ─── Morning Check-In ──────────────────────────────────────────────────────────

function MorningCheckIn({ userEmail, onSaved, today }) {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ gratitude: "", reflection: null, goal: "" });
  const [localUserEmail, setLocalUserEmail] = useState(userEmail);

  // Reset form when user changes
  useEffect(() => {
    if (userEmail && userEmail !== localUserEmail) {
      setLocalUserEmail(userEmail);
      setSaved(false);
      setForm({ gratitude: "", reflection: null, goal: "" });
    }
  }, [userEmail, localUserEmail]);

  const isComplete = form.gratitude.trim() && form.reflection !== null && form.goal.trim();

  const handleSave = () => {
    if (!isComplete) return;
    // Optimistic: mark saved immediately
    setSaved(true);
    onSaved();
    // Check if we should show notification prompt after morning save
    if ("Notification" in window && Notification.permission === "default") {
      setTimeout(() => {
        // Only show if user hasn't seen it yet (check in parent)
      }, 1000);
    }
    // Persist in background
    Promise.all([
      base44.entities.JournalEntry.create({
        user_email: userEmail,
        title: "Morning Gratitude",
        prompt_question: "Name at least 1 thing you woke up grateful for",
        response_text: form.gratitude.trim(),
        category: "lifestyle",
        entry_type: "checkin",
      }),
      base44.entities.JournalEntry.create({
        user_email: userEmail,
        title: "Morning Intention",
        prompt_question: "What is 1 goal you plan to accomplish today?",
        response_text: form.goal.trim(),
        category: "mindset",
        entry_type: "checkin",
      }),
      base44.entities.DailyCheckIn.create({
        user_email: userEmail,
        checkin_date: today,
        gratitude: form.gratitude.trim(),
        progress_made: form.goal.trim(),
        plan_completed: form.reflection,
        mood: 5,
        energy: 5,
        confidence: 5,
        discipline: 5,
      }),
    ]);
  };

  if (saved) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="glass-card border border-emerald-500/30 rounded-2xl p-5 mb-6 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
        <Check className="w-5 h-5 text-emerald-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Morning intention set ✦</p>
        <p className="text-xs text-muted-foreground mt-0.5">You're starting with intention.</p>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <div className="flex items-center gap-2.5 mb-4">
        <Sun className="w-5 h-5 text-primary" />
        <h2 className="font-playfair text-lg font-semibold">Morning Alignment</h2>
      </div>

      <div className="space-y-4 mb-4">
        <div className="glass-card border border-border rounded-2xl p-4">
          <p className="text-sm font-medium text-foreground mb-3">Name at least 1 thing you woke up grateful for</p>
          <textarea
            value={form.gratitude}
            onChange={e => setForm(p => ({ ...p, gratitude: e.target.value }))}
            placeholder="I'm grateful for..."
            rows={2}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 resize-none"
          />
        </div>

        <div className="glass-card border border-border rounded-2xl p-4">
          <p className="text-sm font-medium text-foreground mb-3">Did you give yourself 15 minutes to reflect before scrolling?</p>
          <div className="flex gap-2">
            {[true, false].map(val => (
              <button
                key={String(val)}
                onClick={() => setForm(p => ({ ...p, reflection: val }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  form.reflection === val
                    ? val
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                      : "bg-destructive/10 border-destructive/30 text-destructive/80"
                    : "bg-background border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {val ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card border border-border rounded-2xl p-4">
          <p className="text-sm font-medium text-foreground mb-3">What is 1 goal you plan to accomplish today?</p>
          <textarea
            value={form.goal}
            onChange={e => setForm(p => ({ ...p, goal: e.target.value }))}
            placeholder="Today I will..."
            rows={2}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!isComplete}
        className="w-full py-3 gold-gradient text-background font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-30"
      >
        <Sun className="w-4 h-4" />
        Set Intention
      </button>
    </motion.div>
  );
}

// ─── Today's Shift Plan ────────────────────────────────────────────────────────

function DailyPlan({ plan, loading }) {
  if (loading) return <div className="h-32 bg-muted rounded-2xl animate-pulse mb-8" />;
  if (!plan) return null;

  const stableSections = [];

  const dynamicSections = [
    { label: "Mindset Focus", value: plan.mindset_focus || "—" },
    { label: "Today's Affirmation", value: plan.affirmation || "—" },
    { label: "Visualization", value: plan.visualization_prompt || "—" },
  ];

  const sections = [...stableSections, ...dynamicSections];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <h2 className="font-playfair text-lg font-semibold mb-4">Today's Shift</h2>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`glass-card rounded-xl p-4 border ${s.stable ? "border-primary/20" : "border-border"}`}>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{s.label}</p>
              {s.stable && <span className="text-[8px] uppercase tracking-widest text-primary/50 font-semibold">focus areas</span>}
            </div>
            {s.multiline ? (
              <div className="space-y-1">
                {s.value.split("\n").map((line, i) => (
                  <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed">{s.value}</p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Evening Review ────────────────────────────────────────────────────────────

function EveningReview({ userEmail, onSaved, reflectionPrompt, today }) {
  const [saved, setSaved] = useState(false);
  const [scores, setScores] = useState({ action: null, identity: null, emotional: null });

  const allScored = Object.values(scores).every(s => s !== null);

  const handleSave = () => {
    if (!allScored) return;
    // Optimistic: mark saved immediately
    setSaved(true);
    onSaved();
    // Persist in background
    const items = [
      { key: "action", label: "Did your actions match your goals?" },
      { key: "identity", label: "Did you show up as your future self?" },
      { key: "emotional", label: "Did your emotions match your future life?" },
    ];
    Promise.all(
      items.map(item =>
        base44.entities.JournalEntry.create({
          user_email: userEmail,
          title: `Evening ${item.label.split(" ")[0]}`,
          prompt_question: item.label,
          response_text: `Score: ${scores[item.key]}/5`,
          category: item.key,
          entry_type: "checkin",
        })
      )
    );
  };

  if (saved) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="glass-card border border-purple-400/30 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-purple-400/15 flex items-center justify-center shrink-0">
        <Check className="w-5 h-5 text-purple-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Evening review complete ✦</p>
        <p className="text-xs text-muted-foreground mt-0.5">Self-awareness is the beginning of alignment.</p>
      </div>
    </motion.div>
  );

  const PROMPTS = [
    { key: "action", label: "Action Align", q: "Did your actions match your goals?" },
    { key: "identity", label: "Identity Align", q: "Did you show up as your future self?" },
    { key: "emotional", label: "Emotional Align", q: "Did your emotions match your future life?" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-2.5 mb-4">
        <Moon className="w-5 h-5 text-purple-400" />
        <h2 className="font-playfair text-lg font-semibold">Evening Review</h2>
      </div>

      {reflectionPrompt && (
        <div className="glass-card border border-purple-400/20 rounded-xl p-4 mb-4">
          <p className="text-[10px] uppercase tracking-widest text-purple-400/70 font-semibold mb-1">Tonight's Reflection</p>
          <p className="text-sm text-foreground/80 leading-relaxed italic">"{reflectionPrompt}"</p>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {PROMPTS.map((p, idx) => (
          <motion.div key={p.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="glass-card border border-border rounded-xl p-4">
            <p className="text-sm font-medium text-foreground mb-3">{p.q}</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(val => (
                <button
                  key={val}
                  onClick={() => setScores(s => ({ ...s, [p.key]: val }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                    scores[p.key] === val
                      ? "bg-primary text-background border-primary"
                      : "bg-background border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={!allScored}
        className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-30 border border-purple-400/30 text-purple-400 bg-purple-400/8"
      >
        <Moon className="w-4 h-4" />
        Complete Review
      </button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DailyShift() {
  const navigate = useNavigate();
  const { user, profile, loading: profileLoading } = useUserProfile();
  const scrollContainer = useScrollContainer();
  const [today] = useState(() => getLocalToday());
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [morningDone, setMorningDone] = useState(false);
  const [eveningDone, setEveningDone] = useState(false);
  const [morningSaved, setMorningSaved] = useState(false);
  const [eveningSaved, setEveningSaved] = useState(false);
  const [reflectionPrompt, setReflectionPrompt] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [localHour, setLocalHour] = useState(() => new Date().getHours());

  const loadData = useCallback(async () => {
    if (!user || profileLoading) return;
    setPlanLoading(true);
    try {
      const [todayPlan, checkins, eveningEntries] = await Promise.all([
        getTodaysShift(user.email, today),
        base44.entities.DailyCheckIn.filter({ user_email: user.email, checkin_date: today }),
        base44.entities.JournalEntry.filter({ user_email: user.email }, "-created_date", 10),
      ]);
      setPlan(todayPlan || null);
      setReflectionPrompt(todayPlan?.reflection_prompt || null);
      setMorningDone(checkins.length > 0);
      const todayEvening = eveningEntries.filter(e => e.entry_type === "checkin" && e.category === "action" && e.created_date?.startsWith(today));
      setEveningDone(todayEvening.length > 0);
    } finally {
      setPlanLoading(false);
    }
  }, [user, profileLoading, today]);

  useEffect(() => {
    if (!scrollContainer?.current) return;
    
    const { cleanupPullToRefresh } = usePullToRefresh(
      scrollContainer.current,
      async () => {
        await loadData();
        setIsRefreshing(false);
      }
    );
    return cleanupPullToRefresh;
  }, [loadData, scrollContainer]);

  useEffect(() => {
    if (profileLoading) return;
    if (!user) navigate("/");
  }, [user, profileLoading, navigate]);

  // Detect user change and reset Morning Intention state
  useEffect(() => {
    if (user?.email && user.email !== currentUserEmail) {
      setCurrentUserEmail(user.email);
      setMorningSaved(false); // Reset Morning Intention for new user
      setMorningDone(false);
      setEveningSaved(false);
      setEveningDone(false);
    }
  }, [user?.email, currentUserEmail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Show notification prompt after morning intention is saved and hasn't been asked yet
  useEffect(() => {
    if (!profile) return;
    
    const shouldShowNotificationPrompt =
      morningSaved &&
      !profile.notifications_permission_asked &&
      "Notification" in window &&
      Notification.permission === "default";

    if (shouldShowNotificationPrompt) {
      setTimeout(() => setShowNotificationPrompt(true), 1500);
    }
  }, [morningSaved, profile]);

  // Update local hour every minute for time-based locking
  useEffect(() => {
    const interval = setInterval(() => setLocalHour(new Date().getHours()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Check if Evening Reflection is available (5:00 PM or later in local time)
  const eveningAvailable = localHour >= 17;

  if (profileLoading || planLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const handleAllowNotifications = async (settings) => {
    await base44.auth.updateMe(settings);
    setShowNotificationPrompt(false);
  };

  const handleDismissNotifications = async () => {
    await base44.auth.updateMe({ notifications_permission_asked: true });
    setShowNotificationPrompt(false);
  };

  return (
    <AppLayout>
      <RefreshSpinner isRefreshing={isRefreshing} />
      <AnimatePresence>
        {showNotificationPrompt && (
          <NotificationPermissionModal
            onAllow={handleAllowNotifications}
            onDismiss={handleDismissNotifications}
          />
        )}
      </AnimatePresence>
      <div className="px-5 pt-6 pb-6">
        <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">
          {new Date().toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}
        </p>
        <h1 className="font-playfair text-2xl font-semibold mb-8">Daily Shift</h1>

        <AnimatePresence mode="wait">
          {morningDone && !morningSaved ? (
            <motion.div key="morning-done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card border border-emerald-500/30 rounded-2xl p-5 mb-8 flex items-center gap-4">
              <Sun className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Morning set ✦</p>
                <p className="text-xs text-muted-foreground mt-0.5">You started with intention.</p>
              </div>
            </motion.div>
          ) : !morningSaved ? (
            <MorningCheckIn key="morning" userEmail={user?.email} today={today} onSaved={() => setMorningSaved(true)} />
          ) : null}
        </AnimatePresence>

        <MicroActionSuggester userEmail={user?.email} />

        {eveningAvailable && !eveningDone && !eveningSaved && (
          <div className="flex items-center gap-3 my-8">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-medium">Evening</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>
        )}

        {!eveningAvailable && !eveningDone && !eveningSaved && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="my-8">
            <div className="glass-card border border-purple-400/20 rounded-2xl p-5 text-center">
              <Moon className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground mb-1">Evening Reflection</p>
              <p className="text-xs text-muted-foreground">Available at 5:00 PM</p>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {eveningDone && !eveningSaved ? (
            <motion.div key="evening-done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card border border-purple-400/30 rounded-2xl p-5 flex items-center gap-4">
              <Moon className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Evening complete ✦</p>
                <p className="text-xs text-muted-foreground mt-0.5">Self-awareness fuels alignment.</p>
              </div>
            </motion.div>
          ) : eveningAvailable && !eveningSaved ? (
            <EveningReview key="evening" userEmail={user?.email} reflectionPrompt={reflectionPrompt} today={today} onSaved={() => setEveningSaved(true)} />
          ) : null}
        </AnimatePresence>

        {(morningSaved || morningDone) && (eveningSaved || eveningDone) && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card glow-gold border border-primary/25 rounded-2xl p-5 text-center mt-8">
            <p className="font-playfair text-base font-semibold text-foreground">Full alignment complete ✦</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">You started with intention and ended with honesty.</p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
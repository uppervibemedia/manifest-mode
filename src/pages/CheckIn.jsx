import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sun, Moon, Check, ChevronLeft, Loader2, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { POINT_VALUES, getLevelForPoints } from "@/lib/identityEngine";

const today = new Date().toISOString().split("T")[0];

// ─── Morning Section ──────────────────────────────────────────────────────────

function MorningCheckIn({ userEmail, onSaved }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    gratitude: "",
    reflectedBeforeScrolling: null, // true | false
    todayGoal: "",
  });

  const isComplete = form.gratitude.trim() && form.reflectedBeforeScrolling !== null && form.todayGoal.trim();

  const handleSave = async () => {
    if (!isComplete) return;
    setSaving(true);
    // Save as journal entries so they're accessible in Journal page
    await Promise.all([
      base44.entities.JournalEntry.create({
        user_email: userEmail,
        title: "Morning Gratitude",
        prompt_question: "Name at least 1 thing you woke up grateful for this morning",
        response_text: form.gratitude.trim(),
        category: "lifestyle",
        entry_type: "checkin",
      }),
      base44.entities.JournalEntry.create({
        user_email: userEmail,
        title: "Morning Intention",
        prompt_question: "What is 1 goal you plan to accomplish today?",
        response_text: form.todayGoal.trim(),
        category: "mindset",
        entry_type: "checkin",
      }),
      // Save reflection habit as a DailyCheckIn note field
      base44.entities.DailyCheckIn.create({
        user_email: userEmail,
        checkin_date: today,
        gratitude: form.gratitude.trim(),
        progress_made: form.todayGoal.trim(),
        plan_completed: form.reflectedBeforeScrolling,
        mood: 3,
        energy: 5,
        confidence: 5,
        discipline: 5,
        journal_entry: `Morning screen-free reflection: ${form.reflectedBeforeScrolling ? "Yes" : "No"}`,
      }),
    ]);
    setSaved(true);
    setSaving(false);
    onSaved();
  };

  if (saved) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="glass-card border border-emerald-500/30 rounded-2xl p-5 mb-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
        <Check className="w-5 h-5 text-emerald-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Morning intention set ✦</p>
        <p className="text-xs text-muted-foreground mt-0.5">You started today with presence and purpose.</p>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Sun className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-primary/70 font-medium">Start Your Day</p>
          <h2 className="font-playfair text-lg font-semibold text-foreground">Morning Alignment</h2>
        </div>
      </div>

      {/* Q1 — Gratitude */}
      <div className="glass-card border border-border rounded-2xl p-5 mb-3">
        <p className="text-[10px] uppercase tracking-widest text-primary/60 font-semibold mb-1">Gratitude</p>
        <p className="text-sm font-medium text-foreground mb-3 leading-relaxed">
          Name at least 1 thing you woke up grateful for this morning
        </p>
        <textarea
          value={form.gratitude}
          onChange={e => setForm(p => ({ ...p, gratitude: e.target.value }))}
          placeholder="I'm grateful for..."
          rows={2}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 resize-none leading-relaxed"
        />
      </div>

      {/* Q2 — Yes/No */}
      <div className="glass-card border border-border rounded-2xl p-5 mb-3">
        <p className="text-[10px] uppercase tracking-widest text-primary/60 font-semibold mb-1">Presence</p>
        <p className="text-sm font-medium text-foreground mb-4 leading-relaxed">
          Did you give yourself at least 15 minutes to reflect before you started scrolling on your phone this morning?
        </p>
        <div className="flex gap-3">
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => setForm(p => ({ ...p, reflectedBeforeScrolling: val }))}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
                form.reflectedBeforeScrolling === val
                  ? val
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                    : "bg-destructive/10 border-destructive/30 text-destructive/80"
                  : "bg-background border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {val ? "Yes ✓" : "No"}
            </button>
          ))}
        </div>
        {form.reflectedBeforeScrolling === false && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-[11px] text-muted-foreground/60 mt-2.5 italic leading-relaxed">
            That's okay — tomorrow is a new opportunity to protect your morning.
          </motion.p>
        )}
      </div>

      {/* Q3 — Goal */}
      <div className="glass-card border border-border rounded-2xl p-5 mb-4">
        <p className="text-[10px] uppercase tracking-widest text-primary/60 font-semibold mb-1">Intention</p>
        <p className="text-sm font-medium text-foreground mb-3 leading-relaxed">
          What is 1 goal you plan to accomplish today?
        </p>
        <textarea
          value={form.todayGoal}
          onChange={e => setForm(p => ({ ...p, todayGoal: e.target.value }))}
          placeholder="Today I will..."
          rows={2}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 resize-none leading-relaxed"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!isComplete || saving}
        className="w-full py-3.5 gold-gradient text-background font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-30 transition-opacity"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sun className="w-4 h-4" />}
        {saving ? "Saving..." : "Set Morning Intention"}
      </button>
    </motion.div>
  );
}

// ─── Evening Section ──────────────────────────────────────────────────────────

const EVENING_ITEMS = [
  {
    key: "action",
    label: "Action Align",
    color: "hsl(45 80% 60%)",
    textColor: "text-primary",
    borderColor: "border-primary/25",
    bgColor: "bg-primary/5",
    question: "Did your actions match your goals today?",
    subtext: "Think about the decisions you made, the work you did, and how you spent your time.",
  },
  {
    key: "identity",
    label: "Identity Align",
    color: "#c084fc",
    textColor: "text-purple-400",
    borderColor: "border-purple-400/25",
    bgColor: "bg-purple-400/5",
    question: "Did you show up as your future self today?",
    subtext: "Think about the choices, habits, and standards you held yourself to.",
  },
  {
    key: "emotional",
    label: "Emotional Align",
    color: "#f9a8d4",
    textColor: "text-pink-400",
    borderColor: "border-pink-400/25",
    bgColor: "bg-pink-400/5",
    question: "Did your emotional state match the life you want to create?",
    subtext: "Think about how you responded to stress, people, and situations today.",
  },
];

function EveningReview({ userEmail, onSaved }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scores, setScores] = useState({ action: null, identity: null, emotional: null });
  const [reflections, setReflections] = useState({ action: "", identity: "", emotional: "" });

  const allScored = EVENING_ITEMS.every(item => scores[item.key] !== null);

  const handleSave = async () => {
    if (!allScored) return;
    setSaving(true);

    // Save each as a journal entry
    await Promise.all(
      EVENING_ITEMS.map(item =>
        base44.entities.JournalEntry.create({
          user_email: userEmail,
          title: `Evening ${item.label}`,
          prompt_question: item.question,
          response_text: reflections[item.key].trim()
            ? `Score: ${scores[item.key]}/5 — ${reflections[item.key].trim()}`
            : `Score: ${scores[item.key]}/5`,
          category: item.key,
          entry_type: "checkin",
        })
      )
    );

    // Award points
    const profiles = await base44.entities.UserProfile.filter({ user_email: userEmail });
    if (profiles[0]) {
      const currentPoints = profiles[0].alignment_points || 0;
      const newPoints = currentPoints + POINT_VALUES.DAILY_CHECKIN;
      await base44.entities.UserProfile.update(profiles[0].id, {
        alignment_points: newPoints,
        identity_level: getLevelForPoints(newPoints).level,
        total_journal_entries: (profiles[0].total_journal_entries || 0) + 3,
      });
    }

    setSaved(true);
    setSaving(false);
    onSaved();
  };

  if (saved) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="glass-card border border-purple-400/30 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-purple-400/15 flex items-center justify-center shrink-0">
        <Check className="w-5 h-5 text-purple-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Evening review complete ✦</p>
        <p className="text-xs text-muted-foreground mt-0.5">Self-awareness is the beginning of all alignment.</p>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center shrink-0">
          <Moon className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-purple-400/70 font-medium">End Your Day</p>
          <h2 className="font-playfair text-lg font-semibold text-foreground">Evening Review</h2>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {EVENING_ITEMS.map((item, idx) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className={`glass-card rounded-2xl p-5 border ${scores[item.key] !== null ? item.borderColor : "border-border"} transition-colors`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: item.color }}>
                {item.label}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground mb-1 leading-relaxed">{item.question}</p>
            <p className="text-[11px] text-muted-foreground/60 mb-4 leading-relaxed">{item.subtext}</p>

            {/* 1–5 score selector */}
            <div className="flex gap-2 mb-3">
              {[1, 2, 3, 4, 5].map(val => (
                <button
                  key={val}
                  onClick={() => setScores(p => ({ ...p, [item.key]: val }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    scores[item.key] === val
                      ? "text-background"
                      : "bg-background border-border text-muted-foreground hover:border-primary/20"
                  }`}
                  style={scores[item.key] === val ? { backgroundColor: item.color, borderColor: item.color } : {}}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground/50 mb-3 px-0.5">
              <span>Not at all</span>
              <span>Fully</span>
            </div>

            {/* Optional reflection */}
            <textarea
              value={reflections[item.key]}
              onChange={e => setReflections(p => ({ ...p, [item.key]: e.target.value }))}
              placeholder="Add a reflection (optional)..."
              rows={1}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 resize-none leading-relaxed"
            />
          </motion.div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={!allScored || saving}
        className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-30 transition-all border text-purple-400 border-purple-400/30 bg-purple-400/8 hover:bg-purple-400/12"
        style={{ background: allScored ? "linear-gradient(135deg, #c084fc22, #818cf822)" : undefined }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Moon className="w-4 h-4" />}
        {saving ? "Saving..." : "Complete Evening Review"}
      </button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckIn() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [morningDone, setMorningDone] = useState(false);
  const [eveningDone, setEveningDone] = useState(false);
  const [morningSaved, setMorningSaved] = useState(false);
  const [eveningSaved, setEveningSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      setUser(u);
      // Check if morning check-in already done today
      const checkins = await base44.entities.DailyCheckIn.filter({ user_email: u.email, checkin_date: today });
      if (checkins.length > 0) setMorningDone(true);
      // Check if evening entries already done today
      const eveningEntries = await base44.entities.JournalEntry.filter({ user_email: u.email }, "-created_date", 10);
      const todayEvening = eveningEntries.filter(e =>
        e.entry_type === "checkin" && e.category === "action" &&
        e.created_date?.startsWith(today)
      );
      if (todayEvening.length > 0) setEveningDone(true);
      setLoading(false);
    })();
  }, []);

  const bothDone = (morningDone || morningSaved) && (eveningDone || eveningSaved);

  if (loading) return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")}
            className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest text-primary/70 font-medium">Daily Practice</p>
            <h1 className="font-playfair text-xl font-semibold">Alignment Check-In</h1>
          </div>
        </div>

        {/* All done state */}
        <AnimatePresence>
          {bothDone && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card glow-gold border border-primary/25 rounded-2xl p-5 mb-6 text-center"
            >
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-playfair text-base font-semibold text-foreground mb-1">Full day alignment complete ✦</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You started the day with intention and ended it with honesty. That's how your future self operates.
              </p>
              <button onClick={() => navigate("/")}
                className="mt-4 px-6 py-2.5 gold-gradient text-background text-sm font-semibold rounded-xl">
                Back to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider label */}
        {!bothDone && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium mb-5 text-center">
            {new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        )}

        {/* Morning section */}
        {morningDone && !morningSaved ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card border border-emerald-500/30 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Morning intention already set ✦</p>
              <p className="text-xs text-muted-foreground mt-0.5">You started today with presence and purpose.</p>
            </div>
          </motion.div>
        ) : !morningSaved ? (
          <MorningCheckIn userEmail={user?.email} onSaved={() => setMorningSaved(true)} />
        ) : null}

        {/* Separator */}
        {!bothDone && (
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-medium">Evening</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>
        )}

        {/* Evening section */}
        {eveningDone && !eveningSaved ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card border border-purple-400/30 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-400/15 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Evening review already complete ✦</p>
              <p className="text-xs text-muted-foreground mt-0.5">Self-awareness is the beginning of all alignment.</p>
            </div>
          </motion.div>
        ) : !eveningSaved ? (
          <EveningReview userEmail={user?.email} onSaved={() => setEveningSaved(true)} />
        ) : null}
      </div>
    </AppLayout>
  );
}
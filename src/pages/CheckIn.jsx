import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const MOODS = [
  { value: 1, emoji: "😔", label: "Low" },
  { value: 2, emoji: "😐", label: "Okay" },
  { value: 3, emoji: "🙂", label: "Good" },
  { value: 4, emoji: "😊", label: "Great" },
  { value: 5, emoji: "🔥", label: "On fire" },
];

const SLIDERS = [
  { key: "energy", label: "Energy" },
  { key: "confidence", label: "Confidence" },
  { key: "discipline", label: "Discipline" },
];

export default function CheckIn() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    mood: 3,
    energy: 5,
    confidence: 5,
    discipline: 5,
    gratitude: "",
    progress_made: "",
    plan_completed: false,
    journal_entry: "",
  });

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const checkins = await base44.entities.DailyCheckIn.filter({ user_email: user.email, checkin_date: today });
      if (checkins.length > 0) setAlreadyDone(true);
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const user = await base44.auth.me();
    await base44.entities.DailyCheckIn.create({
      ...form,
      user_email: user.email,
      checkin_date: today,
    });

    // Update streak
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    if (profiles[0]) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yDate = yesterday.toISOString().split("T")[0];
      const lastDate = profiles[0].last_checkin_date;
      const newStreak = lastDate === yDate ? (profiles[0].streak_count || 0) + 1 : 1;
      await base44.entities.UserProfile.update(profiles[0].id, {
        streak_count: newStreak,
        last_checkin_date: today,
      });
    }
    navigate("/");
  };

  if (loading) return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  if (alreadyDone) return (
    <AppLayout>
      <div className="px-5 pt-12 flex flex-col items-center justify-center min-h-[80vh] text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="font-playfair text-2xl font-semibold mb-2">Already checked in today</h2>
        <p className="text-sm text-muted-foreground mb-8">Come back tomorrow to keep your streak going</p>
        <button onClick={() => navigate("/")}
          className="px-6 py-3 gold-gradient text-background font-semibold rounded-xl">
          Back to Dashboard
        </button>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-widest text-primary/70 font-medium">Daily Log</p>
            <h1 className="font-playfair text-xl font-semibold">Check-In</h1>
          </div>
        </div>

        {/* Mood */}
        <div className="glass-card rounded-2xl p-5 mb-4">
          <p className="text-sm font-semibold text-foreground mb-4">How are you feeling today?</p>
          <div className="flex justify-between">
            {MOODS.map(m => (
              <button key={m.value} onClick={() => setForm(p => ({ ...p, mood: m.value }))}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                  form.mood === m.value ? "bg-primary/10 border border-primary/40" : "hover:bg-card"
                }`}>
                <span className={`text-2xl transition-all ${form.mood === m.value ? "scale-125" : ""}`}>{m.emoji}</span>
                <span className="text-[10px] text-muted-foreground">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="glass-card rounded-2xl p-5 mb-4 space-y-5">
          {SLIDERS.map(s => (
            <div key={s.key}>
              <div className="flex justify-between mb-2">
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <span className="text-sm font-bold text-primary">{form[s.key]}/10</span>
              </div>
              <input type="range" min="1" max="10" value={form[s.key]}
                onChange={e => setForm(p => ({ ...p, [s.key]: parseInt(e.target.value) }))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(45 80% 60%) ${(form[s.key] - 1) / 9 * 100}%, hsl(220 15% 18%) ${(form[s.key] - 1) / 9 * 100}%)`
                }} />
            </div>
          ))}
        </div>

        {/* Plan completed toggle */}
        <div className="glass-card rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Completed Daily Shift Plan?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Did you finish all your habits today?</p>
          </div>
          <button onClick={() => setForm(p => ({ ...p, plan_completed: !p.plan_completed }))}
            className={`w-12 h-6 rounded-full transition-all ${form.plan_completed ? "bg-primary" : "bg-border"} relative`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
              form.plan_completed ? "left-6" : "left-0.5"
            }`} />
          </button>
        </div>

        {/* Gratitude */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Today's Gratitude</p>
          <input value={form.gratitude} onChange={e => setForm(p => ({ ...p, gratitude: e.target.value }))}
            placeholder="I'm grateful for..."
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50" />
        </div>

        {/* Progress */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Progress Made Today</p>
          <input value={form.progress_made} onChange={e => setForm(p => ({ ...p, progress_made: e.target.value }))}
            placeholder="One thing I moved forward on..."
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50" />
        </div>

        {/* Journal */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Quick Journal Entry</p>
          <textarea value={form.journal_entry} onChange={e => setForm(p => ({ ...p, journal_entry: e.target.value }))}
            placeholder="Anything on your mind? What are you working through?"
            rows={3}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none" />
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-4 gold-gradient text-background font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Check-In ✦"}
        </button>
      </div>
    </AppLayout>
  );
}
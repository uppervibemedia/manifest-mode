import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { id: "mindset",    label: "🧠 Mindset" },
  { id: "discipline", label: "⚡ Discipline" },
  { id: "body",       label: "💪 Body" },
  { id: "wealth",     label: "💰 Wealth" },
  { id: "business",   label: "🚀 Business" },
  { id: "spiritual",  label: "🌙 Spiritual" },
  { id: "lifestyle",  label: "✨ Lifestyle" },
  { id: "love",       label: "❤️ Love" },
];

const IMPACTS = [
  { id: "high",   label: "High Impact" },
  { id: "medium", label: "Medium" },
  { id: "low",    label: "Low" },
];

const TIMES = ["06:00", "07:00", "08:00", "09:00", "12:00", "17:00", "20:00", "21:00"];

export default function AddHabitModal({ userEmail, onClose, onSave }) {
  const [form, setForm] = useState({
    title: "",
    category: "mindset",
    description: "",
    is_priority: false,
    reminder_time: "",
    alignment_impact: "medium",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const saved = await base44.entities.Habit.create({
      ...form,
      user_email: userEmail,
      source: "manual",
      is_active: true,
      streak_count: 0,
      total_completions: 0,
    });
    onSave(saved);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-card rounded-t-3xl p-6 max-h-[88vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-playfair text-lg font-semibold">Add Habit</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-border flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Habit *</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. 30-min morning workout"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50" />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Description (optional)</label>
          <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Why does this habit matter?"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50" />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setForm(p => ({ ...p, category: cat.id }))}
                className={`py-2 rounded-xl text-xs font-medium transition-all text-center ${
                  form.category === cat.id
                    ? "bg-primary/20 border border-primary text-primary"
                    : "bg-background border border-border text-muted-foreground"
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alignment Impact */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Alignment Impact</label>
          <div className="flex gap-2">
            {IMPACTS.map(imp => (
              <button key={imp.id} onClick={() => setForm(p => ({ ...p, alignment_impact: imp.id }))}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                  form.alignment_impact === imp.id
                    ? "bg-primary/20 border border-primary text-primary"
                    : "bg-background border border-border text-muted-foreground"
                }`}>
                {imp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reminder */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Reminder Time (optional)</label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setForm(p => ({ ...p, reminder_time: "" }))}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                !form.reminder_time ? "bg-primary text-background" : "bg-background border border-border text-muted-foreground"
              }`}>None</button>
            {TIMES.map(t => (
              <button key={t} onClick={() => setForm(p => ({ ...p, reminder_time: t }))}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  form.reminder_time === t ? "bg-primary text-background" : "bg-background border border-border text-muted-foreground"
                }`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Priority toggle */}
        <div className="flex items-center justify-between glass-card border border-border rounded-xl px-4 py-3 mb-6">
          <div>
            <p className="text-sm font-medium text-foreground">Mark as Priority</p>
            <p className="text-xs text-muted-foreground">Highlighted in your daily tracker</p>
          </div>
          <button onClick={() => setForm(p => ({ ...p, is_priority: !p.is_priority }))}
            className={`w-11 h-6 rounded-full transition-all relative ${form.is_priority ? "bg-primary" : "bg-border"}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_priority ? "left-5" : "left-0.5"}`} />
          </button>
        </div>

        <button onClick={handleSave} disabled={saving || !form.title.trim()}
          className="w-full py-4 gold-gradient text-background font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add Habit ✦"}
        </button>
      </motion.div>
    </motion.div>
  );
}
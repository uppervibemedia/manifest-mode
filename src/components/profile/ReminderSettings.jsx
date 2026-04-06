import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Bell, BellOff, Loader2 } from "lucide-react";

export default function ReminderSettings({ profile, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState({
    morning_intention_enabled: profile?.morning_intention_enabled || false,
    morning_intention_time: profile?.morning_intention_time || "07:00",
    midday_alignment_enabled: profile?.midday_alignment_enabled || false,
    midday_alignment_time: profile?.midday_alignment_time || "12:00",
    evening_reflection_enabled: profile?.evening_reflection_enabled || false,
    evening_reflection_time: profile?.evening_reflection_time || "20:00",
    morning_emotion_enabled: profile?.morning_emotion_enabled || false,
    morning_emotion_time: profile?.morning_emotion_time || "07:30",
    evening_emotion_enabled: profile?.evening_emotion_enabled || false,
    evening_emotion_time: profile?.evening_emotion_time || "20:30",
  });

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(local);
    setSaving(false);
  };

  const changed = JSON.stringify(local) !== JSON.stringify({
    morning_intention_enabled: profile?.morning_intention_enabled || false,
    morning_intention_time: profile?.morning_intention_time || "07:00",
    midday_alignment_enabled: profile?.midday_alignment_enabled || false,
    midday_alignment_time: profile?.midday_alignment_time || "12:00",
    evening_reflection_enabled: profile?.evening_reflection_enabled || false,
    evening_reflection_time: profile?.evening_reflection_time || "20:00",
    morning_emotion_enabled: profile?.morning_emotion_enabled || false,
    morning_emotion_time: profile?.morning_emotion_time || "07:30",
    evening_emotion_enabled: profile?.evening_emotion_enabled || false,
    evening_emotion_time: profile?.evening_emotion_time || "20:30",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="glass-card rounded-2xl p-5 mb-3 border border-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Daily Reminders</p>
      </div>

      {/* Core Reminders */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Recommended</p>
        <div className="space-y-3">
          {/* Morning Intention */}
          <ReminderRow
            icon={<Sun className="w-4 h-4 text-primary" />}
            label="Morning Intention"
            enabled={local.morning_intention_enabled}
            time={local.morning_intention_time}
            onToggle={() => setLocal(l => ({ ...l, morning_intention_enabled: !l.morning_intention_enabled }))}
            onTimeChange={(time) => setLocal(l => ({ ...l, morning_intention_time: time }))}
          />
          {/* Midday Emotion Alignment */}
          <ReminderRow
            icon={<div className="text-sm">🔄</div>}
            label="Midday Emotion Alignment"
            enabled={local.midday_alignment_enabled}
            time={local.midday_alignment_time}
            onToggle={() => setLocal(l => ({ ...l, midday_alignment_enabled: !l.midday_alignment_enabled }))}
            onTimeChange={(time) => setLocal(l => ({ ...l, midday_alignment_time: time }))}
          />
          {/* Evening Reflection */}
          <ReminderRow
            icon={<Moon className="w-4 h-4 text-purple-400" />}
            label="Evening Reflection"
            enabled={local.evening_reflection_enabled}
            time={local.evening_reflection_time}
            onToggle={() => setLocal(l => ({ ...l, evening_reflection_enabled: !l.evening_reflection_enabled }))}
            onTimeChange={(time) => setLocal(l => ({ ...l, evening_reflection_time: time }))}
          />
        </div>
      </div>

      {/* Optional Reminders */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Optional</p>
        <div className="space-y-3">
          {/* Morning Emotion */}
          <ReminderRow
            icon={<Sun className="w-4 h-4 text-muted-foreground" />}
            label="Morning Emotion Alignment"
            enabled={local.morning_emotion_enabled}
            time={local.morning_emotion_time}
            onToggle={() => setLocal(l => ({ ...l, morning_emotion_enabled: !l.morning_emotion_enabled }))}
            onTimeChange={(time) => setLocal(l => ({ ...l, morning_emotion_time: time }))}
          />
          {/* Evening Emotion */}
          <ReminderRow
            icon={<Moon className="w-4 h-4 text-muted-foreground" />}
            label="Evening Emotion Alignment"
            enabled={local.evening_emotion_enabled}
            time={local.evening_emotion_time}
            onToggle={() => setLocal(l => ({ ...l, evening_emotion_enabled: !l.evening_emotion_enabled }))}
            onTimeChange={(time) => setLocal(l => ({ ...l, evening_emotion_time: time }))}
          />
        </div>
      </div>

      {!local.morning_intention_enabled && !local.midday_alignment_enabled && !local.evening_reflection_enabled && !local.morning_emotion_enabled && !local.evening_emotion_enabled && (
        <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
          <BellOff className="w-3.5 h-3.5" /> All reminders off — toggle to enable email nudges
        </p>
      )}

      {changed && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 gold-gradient text-background text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Reminders"}
        </button>
      )}
    </motion.div>
  );
}

function ReminderRow({ icon, label, enabled, time, onToggle, onTimeChange }) {
  return (
    <div className={`glass-card rounded-xl p-3 border transition-all ${enabled ? "border-border" : "border-border/40"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-foreground">{label}</span>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          aria-label={`Toggle ${label}`}
          onClick={onToggle}
          className={`rounded-full relative transition-colors duration-200 flex items-center px-0.5 shrink-0 ${
            enabled ? "bg-primary" : "bg-border"
          }`}
          style={{ width: 40, height: 22 }}
        >
          <span
            className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
              enabled ? "translate-x-[18px]" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {enabled && (
        <input
          type="time"
          value={time}
          onChange={e => onTimeChange(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/40"
        />
      )}
    </div>
  );
}
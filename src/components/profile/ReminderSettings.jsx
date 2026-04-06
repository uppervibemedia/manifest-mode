import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Bell, BellOff, Loader2 } from "lucide-react";

export default function ReminderSettings({ profile, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState({
    morning_reminder_enabled: profile?.morning_reminder_enabled || false,
    morning_reminder_time: profile?.morning_reminder_time || "07:00",
    evening_reminder_enabled: profile?.evening_reminder_enabled || false,
    evening_reminder_time: profile?.evening_reminder_time || "20:00",
  });

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(local);
    setSaving(false);
  };

  const changed =
    local.morning_reminder_enabled !== (profile?.morning_reminder_enabled || false) ||
    local.morning_reminder_time !== (profile?.morning_reminder_time || "07:00") ||
    local.evening_reminder_enabled !== (profile?.evening_reminder_enabled || false) ||
    local.evening_reminder_time !== (profile?.evening_reminder_time || "20:00");

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

      {/* Morning */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">Morning Check-In</span>
          </div>
          <button
            role="switch"
            aria-checked={local.morning_reminder_enabled}
            aria-label="Toggle morning reminder"
            onClick={() => setLocal(l => ({ ...l, morning_reminder_enabled: !l.morning_reminder_enabled }))}
            className={`rounded-full relative transition-colors duration-200 flex items-center px-0.5 ${
              local.morning_reminder_enabled ? "bg-primary" : "bg-border"
            }`}
            style={{ width: 40, height: 22 }}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                local.morning_reminder_enabled ? "translate-x-[18px]" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        {local.morning_reminder_enabled && (
          <input
            type="time"
            value={local.morning_reminder_time}
            onChange={e => setLocal(l => ({ ...l, morning_reminder_time: e.target.value }))}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40"
          />
        )}
      </div>

      {/* Evening */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-foreground">Evening Review</span>
          </div>
          <button
            role="switch"
            aria-checked={local.evening_reminder_enabled}
            aria-label="Toggle evening reminder"
            onClick={() => setLocal(l => ({ ...l, evening_reminder_enabled: !l.evening_reminder_enabled }))}
            className={`relative rounded-full flex items-center px-0.5 transition-colors duration-200 ${
              local.evening_reminder_enabled ? "bg-purple-400" : "bg-border"
            }`}
            style={{ width: 40, height: 22 }}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                local.evening_reminder_enabled ? "translate-x-[18px]" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        {local.evening_reminder_enabled && (
          <input
            type="time"
            value={local.evening_reminder_time}
            onChange={e => setLocal(l => ({ ...l, evening_reminder_time: e.target.value }))}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40"
          />
        )}
      </div>

      {(!local.morning_reminder_enabled && !local.evening_reminder_enabled) && (
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
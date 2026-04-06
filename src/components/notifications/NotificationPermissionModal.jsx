import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, X } from "lucide-react";

const CORE_REMINDERS = [
  { key: "morning_intention_enabled", label: "Morning Intention", icon: "🌅", default: true },
  { key: "midday_alignment_enabled", label: "Midday Emotion Alignment", icon: "🔄", default: true },
  { key: "evening_reflection_enabled", label: "Evening Reflection", icon: "🌙", default: true },
];

const OPTIONAL_REMINDERS = [
  { key: "morning_emotion_enabled", label: "Morning Emotion Alignment", icon: "🌅", default: false },
  { key: "evening_emotion_enabled", label: "Evening Emotion Alignment", icon: "🌙", default: false },
];

export default function NotificationPermissionModal({ onAllow, onDismiss }) {
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    try {
      // Request browser notification permission
      if ("Notification" in window && Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setLoading(false);
          return;
        }
      }
      
      // Enable core reminders by default
      const defaultSettings = {
        notifications_enabled: true,
        morning_intention_enabled: true,
        morning_intention_time: "07:00",
        midday_alignment_enabled: true,
        midday_alignment_time: "12:00",
        evening_reflection_enabled: true,
        evening_reflection_time: "20:00",
        morning_emotion_enabled: false,
        morning_emotion_time: "07:30",
        evening_emotion_enabled: false,
        evening_emotion_time: "20:30",
      };
      
      await onAllow(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-md mx-auto rounded-t-3xl bg-background border-t border-border p-6"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-playfair text-lg font-semibold text-foreground">Stay Aligned</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Turn on reminders for your Daily Shift</p>
          </div>
        </div>

        {/* Core reminders preview */}
        <div className="mb-5 space-y-2">
          {CORE_REMINDERS.map((reminder) => (
            <div
              key={reminder.key}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background border border-primary/20"
            >
              <span className="text-lg">{reminder.icon}</span>
              <span className="flex-1 text-sm text-foreground">{reminder.label}</span>
              <Check className="w-4 h-4 text-primary" />
            </div>
          ))}
        </div>

        {/* Optional note */}
        <p className="text-xs text-muted-foreground mb-5 px-4">
          You can customize reminders anytime in Settings
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-border text-foreground text-sm font-semibold hover:border-primary/20 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 inline mr-1.5" />
            Not Now
          </button>
          <button
            onClick={handleAllow}
            disabled={loading}
            className="flex-1 py-3 gold-gradient text-background rounded-xl text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? "Enabling..." : "Turn On"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
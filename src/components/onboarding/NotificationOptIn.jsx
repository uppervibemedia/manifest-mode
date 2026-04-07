import { motion } from "framer-motion";
import { Bell, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function NotificationOptIn({ onContinue, onSkip }) {
  const handleEnableNotifications = async () => {
    // Request system notification permission
    if ("Notification" in window && Notification.permission !== "granted") {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          // Auto-enable core reminders
          await base44.auth.updateMe({
            notifications_enabled: true,
            notifications_permission_asked: true,
            morning_intention_enabled: true,
            midday_alignment_enabled: true,
            evening_reflection_enabled: true,
          });
        }
      } catch (error) {
        console.error("Notification permission error:", error);
      }
    } else if (Notification.permission === "granted") {
      // Already granted — just enable reminders
      await base44.auth.updateMe({
        notifications_enabled: true,
        notifications_permission_asked: true,
        morning_intention_enabled: true,
        midday_alignment_enabled: true,
        evening_reflection_enabled: true,
      });
    }
    onContinue();
  };

  const handleMaybeLater = async () => {
    // Mark that we've asked, but don't enable
    await base44.auth.updateMe({
      notifications_permission_asked: true,
    });
    onSkip();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-sm"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
          <Bell className="w-8 h-8 text-primary" />
        </div>
        <p className="text-xs uppercase tracking-widest text-primary/70 mb-2 font-medium">Daily Support</p>
        <h2 className="font-playfair text-2xl font-semibold text-foreground mb-3">
          Stay Aligned Throughout the Day
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Turn on reminders for your Daily Shift moments to keep you focused on your goals.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-border mb-8">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">🌅</span>
            <div>
              <p className="text-sm font-semibold text-foreground">Morning Intention</p>
              <p className="text-xs text-muted-foreground">Start your day with clarity</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔄</span>
            <div>
              <p className="text-sm font-semibold text-foreground">Midday Emotion Alignment</p>
              <p className="text-xs text-muted-foreground">Reset your energy at noon</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">🌙</span>
            <div>
              <p className="text-sm font-semibold text-foreground">Evening Reflection</p>
              <p className="text-xs text-muted-foreground">Close your day with honesty</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleEnableNotifications}
        className="w-full py-4 font-semibold gold-gradient text-background rounded-xl flex items-center justify-center gap-2 mb-3"
      >
        Turn On Notifications <ChevronRight className="w-4 h-4" />
      </button>
      <button
        onClick={handleMaybeLater}
        className="w-full py-3 text-sm text-muted-foreground border border-border rounded-xl hover:border-primary/20 transition-colors"
      >
        Maybe Later
      </button>
    </motion.div>
  );
}
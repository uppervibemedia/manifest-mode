import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useUserProfile } from "@/lib/UserProfileContext";
import { LogOut, Crown, ChevronRight, Zap, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ReminderSettings from "@/components/profile/ReminderSettings";
import { clearUserSessionState } from "@/lib/sessionStateManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TIER_LABELS = { free: "Free", supporter: "Plus", premium: "Premium ✦" };
const TIER_COLORS = { free: "text-muted-foreground", supporter: "text-blue-400", premium: "text-primary" };

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, loading: profileLoading, clearProfile, updateProfile } = useUserProfile();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (profileLoading) return;
    if (!user) navigate("/");
  }, [user, profileLoading, navigate]);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const res = await base44.functions.invoke("stripePortal", {
        return_url: `${window.location.origin}/profile`,
      });
      if (res.data?.url) window.location.href = res.data.url;
    } finally {
      setPortalLoading(false);
    }
  };

  const handleLogout = async () => {
    clearUserSessionState();
    clearProfile();
    base44.auth.logout();
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // Delete all user data
      const [visions, habits, scores, analyses, entries, plans, affirmations] = await Promise.all([
        base44.entities.VisionItem.filter({ user_email: user.email }),
        base44.entities.Habit.filter({ user_email: user.email }),
        base44.entities.ScoreHistory.filter({ user_email: user.email }),
        base44.entities.AIAnalysis.filter({ user_email: user.email }),
        base44.entities.JournalEntry.filter({ user_email: user.email }),
        base44.entities.DailyShiftPlan.filter({ user_email: user.email }),
        base44.entities.Affirmation.filter({ user_email: user.email }),
      ]);

      const deletePromises = [
        ...visions.map(v => base44.entities.VisionItem.delete(v.id)),
        ...habits.map(h => base44.entities.Habit.delete(h.id)),
        ...scores.map(s => base44.entities.ScoreHistory.delete(s.id)),
        ...analyses.map(a => base44.entities.AIAnalysis.delete(a.id)),
        ...entries.map(e => base44.entities.JournalEntry.delete(e.id)),
        ...plans.map(p => base44.entities.DailyShiftPlan.delete(p.id)),
        ...affirmations.map(a => base44.entities.Affirmation.delete(a.id)),
      ];

      await Promise.all(deletePromises);

      // Delete user profile
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles[0]) {
        await base44.entities.UserProfile.delete(profiles[0].id);
      }

      clearProfile();
      base44.auth.logout();
    } catch (error) {
      console.error("Delete account error:", error);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const tier = profile?.subscription_tier || "free";

  return (
    <AppLayout>
      <div className="px-5 pt-4 pb-6">
        <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Account</p>
        <h1 className="font-playfair text-2xl font-semibold mb-8">Profile</h1>

        {/* User Card */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card glow-gold rounded-2xl p-5 mb-6 flex items-center gap-4 border border-primary/10">
          <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center text-background text-xl font-bold shrink-0">
            {user?.full_name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{user?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Crown className={`w-3.5 h-3.5 ${TIER_COLORS[tier]}`} />
              <span className={`text-xs font-semibold ${TIER_COLORS[tier]}`}>{TIER_LABELS[tier]}</span>
            </div>
          </div>
        </motion.div>

        {/* Plan Info */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass-card rounded-2xl p-5 mb-3 border border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Current Plan</p>
            <span className={`text-xs font-bold ${TIER_COLORS[tier]}`}>{TIER_LABELS[tier]}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {tier === "free"
              ? "Free forever. Upgrade to Plus for expanded features or Premium for unlimited access and AI coaching."
              : tier === "supporter"
              ? "Plus plan unlocked. Upgrade to Premium for Future Self Coach, See Me In This Vision, and unlimited visions."
              : "Premium unlocked. You have full access to all features including AI coaching and scene generation. ✦"}
          </p>
          <button
            onClick={() => {
              if (tier === "premium" && profile?.billing_platform === "stripe") {
                handleManageBilling();
              } else {
                navigate("/pricing");
              }
            }}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              tier === "premium"
                ? "bg-card border border-border text-muted-foreground hover:border-primary/20"
                : "gold-gradient text-background"
            }`}
          >
            {tier === "premium" ? (
              portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4" /> Manage Subscription</>
            ) : (
              <><Zap className="w-4 h-4" /> {tier === "free" ? "View Plans & Upgrade" : "Upgrade to Premium"}</>
            )}
          </button>
        </motion.div>

        {/* Reminder Settings */}
        <ReminderSettings profile={profile} onUpdate={updateProfile} />

        {/* View All Plans link */}
        {tier !== "premium" && (
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
            onClick={() => navigate("/pricing")}
            className="w-full flex items-center justify-between px-5 py-3.5 mb-4 glass-card rounded-xl border border-border hover:border-primary/20 transition-colors">
            <span className="text-sm text-foreground/80">View All Plans</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        )}

        {/* Logout */}
        <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onClick={handleLogout}
          className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 border border-border hover:border-destructive/30 transition-colors">
          <LogOut className="w-5 h-5 text-destructive/70 shrink-0" />
          <p className="text-sm font-medium text-destructive/80">Log Out</p>
        </motion.button>

        {/* Delete Account */}
        <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          onClick={() => setShowDeleteDialog(true)}
          className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 border border-destructive/40 bg-destructive/5 hover:bg-destructive/10 transition-colors">
          <AlertTriangle className="w-5 h-5 text-destructive/80 shrink-0" />
          <p className="text-sm font-medium text-destructive/90">Delete Account</p>
        </motion.button>

        {/* Delete confirmation dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">Delete Account</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. All your data will be permanently deleted:
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                  <li>Vision board and images</li>
                  <li>Habits and habit logs</li>
                  <li>Reality Match Scores</li>
                  <li>Journal entries</li>
                  <li>Future Self Blueprint</li>
                  <li>All personal data</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel>Keep Account</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete Forever"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTestProfile } from "@/lib/testProfileContext";
import { useUserProfile } from "@/lib/UserProfileContext";
import { Bell, Crown, RotateCcw, LogOut, ChevronRight, Shield, Flame, FlaskConical } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import IdentityLevelCard from "@/components/profile/IdentityLevelCard";
import AchievementBadges from "@/components/profile/AchievementBadges";
import PointsActivityFeed from "@/components/profile/PointsActivityFeed";
import SubscriptionCard from "@/components/profile/SubscriptionCard";
import { computeEarnedBadges } from "@/lib/identityEngine";

const TIER_COLORS = { free: "text-muted-foreground", supporter: "text-blue-400", premium: "text-primary" };
const TIER_LABELS = { free: "Free", supporter: "Plus", premium: "Premium ✦" };

export default function Profile() {
  const { testEmail, setTestEmail } = useTestProfile();
  const { user, profile, loading: profileLoading, updateProfile, clearProfile } = useUserProfile();
  const [scores, setScores] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    if (profileLoading) return;
    if (!user) {
      navigate("/");
    }
  }, [user, profileLoading, navigate]);

  useEffect(() => {
    (async () => {
      if (profileLoading || !user) return;
      try {
        const activeEmail = testEmail || user.email;
        setScores([]);
        setEarnedBadges([]);
        setCreditBalance(0);
        const [s, credits, habitLogs, checkins, journals] = await Promise.all([
          base44.entities.ScoreHistory.filter({ user_email: activeEmail }, "-created_date", 10),
          base44.entities.AICreditPack.filter({ user_email: activeEmail }),
          base44.entities.HabitLog.filter({ user_email: activeEmail, completed: true }, "-log_date", 1000),
          base44.entities.DailyCheckIn.filter({ user_email: activeEmail }, "-created_date", 200),
          base44.entities.JournalEntry.filter({ user_email: activeEmail }, "-created_date", 500),
        ]);
        const prof = profile;

        // Compute real counts from actual data (not stale profile counters)
        const realHabitsCompleted = habitLogs.length;
        const realCheckins = checkins.length;
        const realJournals = journals.length;

        // Build an accurate profile-like object for badge computation
        const accurateProfile = prof ? {
          ...prof,
          total_habits_completed: realHabitsCompleted,
          total_checkins: realCheckins,
          total_journal_entries: realJournals,
        } : null;

        // Sync counts back to DB if they differ
        if (prof && (
          prof.total_habits_completed !== realHabitsCompleted ||
          prof.total_checkins !== realCheckins ||
          prof.total_journal_entries !== realJournals
        )) {
          base44.entities.UserProfile.update(prof.id, {
            total_habits_completed: realHabitsCompleted,
            total_checkins: realCheckins,
            total_journal_entries: realJournals,
          });
        }

        setScores(s);
        if (accurateProfile) setEarnedBadges(computeEarnedBadges(accurateProfile, s));
        const packCredits = credits.reduce((sum, c) => sum + (c.credits_remaining || 0), 0);
        setCreditBalance((prof?.ai_credits || 0) + packCredits);
      } catch (error) {
        console.error("Profile load error:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [testEmail, user?.email, profileLoading]);

  const handleLogout = async () => {
    clearProfile();
    setTestEmail(null);
    base44.auth.logout();
  };

  const handleResetAssessment = async () => {
    if (!confirm("This will reset your assessment data. Are you sure?")) return;
    if (profile) await base44.entities.UserProfile.update(profile.id, { onboarding_completed: false });
    navigate("/assessment");
  };

  const toggleNotifications = async () => {
    if (!profile) return;
    await updateProfile({ notifications_enabled: !profile.notifications_enabled });
  };

  if (loading || profileLoading) return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  const tier = profile?.subscription_tier || "free";
  const points = profile?.alignment_points || 0;

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Your Journey</p>
          <h1 className="font-playfair text-2xl font-semibold">Profile</h1>
        </div>

        {/* User card */}
        <div className="glass-card glow-gold rounded-2xl p-5 mb-4 flex items-center gap-4 border border-primary/10">
          <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center text-background text-xl font-bold shrink-0">
            {user?.full_name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{user?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1.5">
                <Crown className={`w-3.5 h-3.5 ${TIER_COLORS[tier]}`} />
                <span className={`text-xs font-semibold ${TIER_COLORS[tier]}`}>{TIER_LABELS[tier]}</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-medium">{profile?.streak_count || 0}d streak</span>
              </div>
            </div>
          </div>
        </div>

        {/* Identity Level */}
        <IdentityLevelCard points={points} streak={profile?.streak_count || 0} />

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label: "Habits", value: profile?.total_habits_completed || 0 },
            { label: "Check-ins", value: profile?.total_checkins || 0 },
            { label: "Journals", value: profile?.total_journal_entries || 0 },
            { label: "Badges", value: earnedBadges.length },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-3 text-center">
              <p className="font-playfair text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Achievements */}
        <AchievementBadges earnedIds={earnedBadges} />

        {/* How to earn points */}
        <PointsActivityFeed />

        {/* Subscription & AI Credits */}
        <SubscriptionCard
          profile={profile}
          creditBalance={creditBalance}
          onBuyCredits={(pack) => navigate("/pricing")}
        />

        {/* Menu items */}
        <div className="space-y-2 mb-5">

          <div className="glass-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Bell className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground">Daily reminders</p>
            </div>
            <button onClick={toggleNotifications}
              className={`w-11 h-6 rounded-full transition-all ${profile?.notifications_enabled ? "bg-primary" : "bg-border"} relative`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                profile?.notifications_enabled ? "left-5" : "left-0.5"
              }`} />
            </button>
          </div>

          <button onClick={() => navigate("/progress")}
            className="w-full glass-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Progress & Analytics</p>
              <p className="text-xs text-muted-foreground">View your alignment journey</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button onClick={handleResetAssessment}
            className="w-full glass-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-orange-500/30 transition-colors">
            <RotateCcw className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Retake Assessment</p>
              <p className="text-xs text-muted-foreground">Update your current reality data</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {profile?.goal_categories?.length > 0 && (
          <div className="glass-card border border-border rounded-xl p-4 mb-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Your Focus Areas</p>
            <div className="flex flex-wrap gap-2">
              {profile.goal_categories.map(cat => (
                <span key={cat} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-medium capitalize">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {user?.role === "admin" && (
          <button onClick={() => navigate("/admin")}
            className="w-full glass-card border border-amber-400/20 rounded-xl p-4 flex items-center gap-3 hover:border-amber-400/40 transition-colors mb-2">
            <FlaskConical className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Test Profiles</p>
              <p className="text-xs text-muted-foreground">Admin panel for testing</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        <button onClick={handleLogout}
          className="w-full glass-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-destructive/30 transition-colors">
          <LogOut className="w-5 h-5 text-destructive/70 shrink-0" />
          <p className="text-sm font-medium text-destructive/80">Log Out</p>
        </button>
      </div>
    </AppLayout>
  );
}
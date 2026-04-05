import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useUserProfile } from "@/lib/UserProfileContext";
import { LogOut, Crown, ChevronRight, Zap, ExternalLink, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const TIER_LABELS = { free: "Free", supporter: "Plus", premium: "Premium ✦" };
const TIER_COLORS = { free: "text-muted-foreground", supporter: "text-blue-400", premium: "text-primary" };

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, loading: profileLoading, clearProfile } = useUserProfile();
  useEffect(() => {
    if (profileLoading) return;
    if (!user) navigate("/");
  }, [user, profileLoading, navigate]);

  const [portalLoading, setPortalLoading] = useState(false);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    const res = await base44.functions.invoke("stripePortal", {
      return_url: `${window.location.origin}/profile`,
    });
    if (res.data?.url) window.location.href = res.data.url;
    setPortalLoading(false);
  };

  const handleLogout = async () => {
    clearProfile();
    base44.auth.logout();
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
      <div className="px-5 pt-6 pb-6">
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
              ? "You're on the Free plan. Upgrade to unlock AI coaching, more visions, and full blueprint access."
              : tier === "supporter"
              ? "You're on Plus. Upgrade to Premium for unlimited visions and AI scene generation."
              : "You have full access to all Premium features. ✦"}
          </p>
          <button
            onClick={() => tier === "premium" && profile?.billing_platform === "stripe" ? handleManageBilling() : navigate("/pricing")}
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
      </div>
    </AppLayout>
  );
}
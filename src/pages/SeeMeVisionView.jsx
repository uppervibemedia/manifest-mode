import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Lock, Sparkles, ChevronDown } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useUserProfile } from "@/lib/UserProfileContext";
import { getCategoryMeta } from "@/lib/categories";

export default function SeeMeVisionView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, loading: profileLoading } = useUserProfile();
  const [vision, setVision] = useState(null);
  const [loading, setLoading] = useState(true);

  const visionId = searchParams.get("id");
  const isPremium = profile?.subscription_tier === "premium";
  const meta = vision ? getCategoryMeta(vision.category) : null;

  useEffect(() => {
    if (profileLoading || !user) return;
    if (!visionId) {
      navigate("/vision-vault");
      return;
    }

    (async () => {
      try {
        const v = await base44.entities.VisionItem.get(visionId);
        if (v && v.user_email === user.email) {
          setVision(v);
        } else {
          navigate("/vision-vault");
        }
      } catch {
        navigate("/vision-vault");
      } finally {
        setLoading(false);
      }
    })();
  }, [visionId, user?.email, profileLoading, navigate]);

  if (loading || profileLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!vision) return null;

  return (
    <AppLayout>
      <div className="pb-12">
        {/* Hero Image Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative h-96 bg-muted overflow-hidden"
        >
          {vision.image_url ? (
            <motion.img
              src={vision.image_url}
              alt={vision.title}
              className="w-full h-full object-cover"
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6 }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Sparkles className="w-12 h-12 text-muted-foreground" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

          {/* Glow effect */}
          <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 80px ${meta?.color}20` }} />

          {/* Top labels */}
          <div className="absolute top-4 left-5 right-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{meta?.icon}</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-white" style={{ color: meta?.color }}>
                {meta?.label}
              </span>
            </div>
            {vision.is_priority && (
              <span className="text-[9px] font-bold text-primary border border-primary/40 bg-primary/15 rounded-full px-2 py-0.5">
                ✦ Priority Vision
              </span>
            )}
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
            <h1 className="font-playfair text-3xl font-bold text-white leading-tight">See Me In This Vision</h1>
            {vision.emotional_goal && (
              <p className="text-xs text-white/70 mt-2 italic">"{vision.emotional_goal}"</p>
            )}
          </div>
        </motion.div>

        {/* Content Section */}
        <div className="px-5 py-8 space-y-6">
          {/* Proof of Progress */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Proof of Progress</p>
                <span className="text-sm font-bold" style={{ color: meta?.color }}>
                  {vision.progress || 0}%
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(220 15% 18%)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${vision.progress || 0}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: meta?.color }}
                />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground/60">
              <span>Just started</span>
              <span>Achieved ✦</span>
            </div>
          </motion.div>

          {/* AI Insight — Premium Only */}
          {isPremium ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card border rounded-2xl p-5"
              style={{ borderColor: meta?.color + "30" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: meta?.color }} />
                <h2 className="text-sm font-semibold text-foreground">AI Insight</h2>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {vision.ai_insight ||
                  "Your vision is calling you forward. Each step toward this reality is a step into the version of yourself who lives this life already. The gap between who you are and who you're becoming closes with consistent identity shifts."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card border border-primary/20 rounded-2xl p-5 flex items-center gap-3"
            >
              <Lock className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Unlock AI Insights</p>
                <p className="text-[10px] text-muted-foreground">Premium feature to see personalized coaching</p>
              </div>
            </motion.div>
          )}

          {/* Monthly Roadmap — Premium Only */}
          {isPremium && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <span>Monthly Roadmap</span>
                <span className="text-[9px] uppercase tracking-widest font-bold text-primary bg-primary/15 border border-primary/30 rounded-full px-1.5 py-0.5">
                  Premium
                </span>
              </h2>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((month, i) => {
                  const isActive = month === 1;
                  return (
                    <motion.div
                      key={month}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className={`rounded-2xl p-4 border transition-all ${
                        isActive
                          ? "glass-card border-primary/40 bg-primary/8"
                          : "glass-card border-border opacity-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-foreground">Month {month}</span>
                            {!isActive && <Lock className="w-3 h-3 text-muted-foreground/40" />}
                          </div>
                          {isActive && (
                            <p className="text-[10px] text-muted-foreground italic">
                              Identity shift: Becoming the version of me who already has this.
                            </p>
                          )}
                        </div>
                        {isActive && <ChevronDown className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Premium Dark Cards Section — Premium Only */}
          {isPremium && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">This Month's Focus</h2>
              <div className="space-y-3">
                {[
                  { title: "Identity Shift", icon: "🧬", desc: "The belief that must change to make this real." },
                  { title: "Visualization", icon: "🎯", desc: "Daily practice: See yourself already living this vision." },
                  { title: "Action This Month", icon: "⚡", desc: "One concrete step that moves you closer to this reality." },
                ].map((card, i) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    className="glass-card border border-border/40 rounded-2xl p-4 bg-card/60 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{card.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">{card.title}</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{card.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Back to Vision Vault */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="pt-4">
            <button
              onClick={() => navigate("/vision-vault")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              ← Back to Living Vision Board
            </button>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
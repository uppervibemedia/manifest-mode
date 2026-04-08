import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, Lock, Sparkles, Edit3, Trash2, Star, Pin, Image as ImageIcon } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useUserProfile } from "@/lib/UserProfileContext";
import { CATEGORIES, getCategoryMeta } from "@/lib/categories";
import SeeMeModal from "@/components/vision/SeeMeModal";
import VisionUploadModal from "@/components/vision/VisionUploadModal";
import VisionImageViewer from "@/components/vision/VisionImageViewer";
import VisionCard from "@/components/vision/VisionCard";

const FILTER_CATS = [{ id: "all", label: "All", icon: "✦" }, ...CATEGORIES];

export default function Vision() {
  const navigate = useNavigate();
  const { user, profile, loading: profileLoading } = useUserProfile();
  const [visions, setVisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showSeeMe, setShowSeeMe] = useState(false);
  const [seeMeVision, setSeeMeVision] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [editVision, setEditVision] = useState(null);
  const [viewerVision, setViewerVision] = useState(null);

  useEffect(() => {
    if (profileLoading) return;
    if (!user) navigate("/");
  }, [user, profileLoading, navigate]);

  useEffect(() => {
    (async () => {
      if (!user || profileLoading) return;
      const items = await base44.entities.VisionItem.filter({ user_email: user.email, is_active: true }, "-created_date");
      setVisions(items);
      setLoading(false);
    })();
  }, [user?.email, profileLoading]);

  // Optimistic vision card click → open viewer immediately
  const handleVisionClick = (vision) => setViewerVision(vision);

  const handleDeleteVision = async (visionId) => {
    setVisions(prev => prev.filter(v => v.id !== visionId));
    base44.entities.VisionItem.update(visionId, { is_active: false }).catch(() => {
      setVisions(prev => [...prev.filter(v => v.id !== visionId)]);
    });
  };

  const handlePriority = (vision) => {
    const updated = { is_priority: !vision.is_priority };
    setVisions(prev => prev.map(v => v.id === vision.id ? { ...v, ...updated } : v));
    base44.entities.VisionItem.update(vision.id, updated).catch(() => {
      setVisions(prev => prev.map(v => v.id === vision.id ? { ...v, is_priority: vision.is_priority } : v));
    });
  };

  const handlePin = (vision) => {
    const updated = { is_pinned: !vision.is_pinned };
    setVisions(prev => prev.map(v => v.id === vision.id ? { ...v, ...updated } : v));
    base44.entities.VisionItem.update(vision.id, updated).catch(() => {
      setVisions(prev => prev.map(v => v.id === vision.id ? { ...v, is_pinned: vision.is_pinned } : v));
    });
  };

  const tier = profile?.subscription_tier || "free";
  const uploadLimit = tier === "free" ? 3 : tier === "supporter" ? 15 : 999;
  const canUpload = visions.length < uploadLimit;
  const canUseSeeMe = tier === "premium";

  const filtered = activeCategory === "all"
    ? visions
    : visions.filter(v => v.category === activeCategory || v.secondary_category === activeCategory);

  const sorted = [...filtered].sort((a, b) => {
    if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return 0;
  });

  if (loading || profileLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-32">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Your Future, Visualized</p>
            <h1 className="font-playfair text-2xl font-semibold">Living Vision Board</h1>
            <p className="text-xs text-muted-foreground mt-1">{visions.length} vision{visions.length !== 1 ? "s" : ""} · {tier !== "free" ? "Unlimited" : `${visions.length}/${uploadLimit}`} uploads</p>
          </div>
          <button
            onClick={() => canUpload && setShowUpload(true)}
            disabled={!canUpload}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              canUpload ? "gold-gradient text-background" : "bg-border text-muted-foreground"
            }`}>
            {canUpload ? <Plus className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
          </button>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mt-4 mb-5 scrollbar-hide">
          {FILTER_CATS.map(cat => {
            const count = cat.id === "all" ? visions.length : visions.filter(v => v.category === cat.id || v.secondary_category === cat.id).length;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  activeCategory === cat.id
                    ? "bg-primary text-background border-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/30"
                }`}>
                <span>{cat.icon}</span>
                <span>{cat.id === "all" ? "All" : cat.label}</span>
                {count > 0 && <span className={`text-[9px] font-bold ${activeCategory === cat.id ? "opacity-70" : "opacity-50"}`}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Category meaning tooltip for active category */}
        {activeCategory !== "all" && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card border border-border rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2.5">
            <span className="text-base">{getCategoryMeta(activeCategory).icon}</span>
            <div>
              <p className="text-xs font-semibold text-foreground">{getCategoryMeta(activeCategory).label}</p>
              <p className="text-[10px] text-muted-foreground">{getCategoryMeta(activeCategory).meaning}</p>
            </div>
          </motion.div>
        )}

        {/* Upload limit */}
        {!canUpload && (
          <div className="glass-card border border-primary/20 rounded-xl p-4 mb-5 flex items-center gap-3">
            <Lock className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">Vision limit reached ({visions.length}/{uploadLimit})</p>
              <p className="text-xs text-muted-foreground">Upgrade to add more visions to your Living Vision Board</p>
            </div>
          </div>
        )}

        {/* See Me AI Section Headline */}
        {visions.some(v => v.title === "See Me In This Vision") && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold text-primary">See Me In This Vision</p>
              <p className="text-[10px] text-muted-foreground">Premium AI-generated manifestations</p>
            </div>
          </motion.div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl glass-card border border-border flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {activeCategory === "all" ? "Your Living Vision Board is empty" : `No ${getCategoryMeta(activeCategory).label} visions yet`}
            </p>
            <p className="text-xs text-muted-foreground mb-6 max-w-xs leading-relaxed">
              {activeCategory === "all"
                ? "Upload images of the life you intend to live. Make it real."
                : `Add images for ${getCategoryMeta(activeCategory).meaning.toLowerCase()}.`}
            </p>
            <button onClick={() => setShowUpload(true)}
              className="px-6 py-2.5 gold-gradient text-background text-sm font-semibold rounded-xl flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Your First Vision
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {sorted.map((vision, i) => {
                const meta = getCategoryMeta(vision.category);
                return (
                  <motion.div key={vision.id}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                    className="relative rounded-2xl overflow-hidden group cursor-pointer"
                    style={{ aspectRatio: i % 5 === 0 ? "1/1.3" : "3/4" }}>

                    {/* Vision image with slow zoom */}
                    {vision.image_url ? (
                      <motion.img
                        src={vision.image_url} alt={vision.title}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted/40">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

                    {/* Subtle category glow */}
                    <div className="absolute inset-0 rounded-2xl"
                      style={{ boxShadow: `inset 0 0 40px ${meta.color}12` }} />

                    {/* Tap to open detail */}
                    <div className="absolute inset-0" onClick={() => setViewerVision(vision)} />

                    {/* Top-right: pin + priority */}
                    <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
                      <button onClick={(e) => { e.stopPropagation(); handlePin(vision); }}
                        className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <Pin className={`w-4 h-4 ${vision.is_pinned ? "text-blue-400 fill-blue-400" : "text-white/60"}`} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handlePriority(vision); }}
                        className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <Star className={`w-4 h-4 ${vision.is_priority ? "text-primary fill-primary" : "text-white/60"}`} />
                      </button>
                    </div>

                    {/* Top-left: edit/delete on hover */}
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setEditVision(vision); }}
                        className="w-8 h-8 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center">
                        <Edit3 className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteVision(vision.id); }}
                        className="w-8 h-8 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                      {/* Progress bar */}
                      {vision.progress > 0 && (
                        <div className="mb-2 h-1 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${vision.progress}%` }}
                            transition={{ delay: i * 0.04 + 0.3, duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: meta.color }}
                          />
                        </div>
                      )}
                      <div className="flex items-end justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white leading-tight line-clamp-2">{vision.title}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px]">{meta.icon}</span>
                            <span className="text-[9px] text-white/60 font-medium">{meta.label}</span>
                          </div>
                        </div>
                        {vision.is_priority && (
                          <span className="shrink-0 text-[8px] font-bold text-primary bg-primary/20 border border-primary/30 rounded-full px-1.5 py-0.5">
                            ✦
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSeeMe && (
          <SeeMeModal
            vision={seeMeVision}
            userEmail={user?.email}
            onClose={() => { setShowSeeMe(false); setSeeMeVision(null); }}
            onSave={(updated) => {
              if (updated?.id && visions.find(v => v.id === updated.id)) {
                setVisions(prev => prev.map(v => v.id === updated.id ? updated : v));
              } else if (updated?.id) {
                setVisions(prev => [updated, ...prev]);
              }
              setShowSeeMe(false);
              setSeeMeVision(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showUpload || editVision) && (
          <VisionUploadModal
            vision={editVision}
            userEmail={user?.email}
            onClose={() => { setShowUpload(false); setEditVision(null); }}
            onSave={(v) => {
              if (editVision) {
                setVisions(prev => prev.map(x => x.id === v.id ? v : x));
              } else {
                setVisions(prev => [v, ...prev]);
              }
              setShowUpload(false);
              setEditVision(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewerVision && (
          <VisionImageViewer
            vision={viewerVision}
            userEmail={user?.email}
            tier={tier}
            onClose={() => setViewerVision(null)}
            onGenerateSeeMe={() => {
              setViewerVision(null);
              setSeeMeVision(viewerVision);
              setShowSeeMe(true);
            }}
            onUpdate={(updated) => setVisions(prev => prev.map(v => v.id === updated.id ? updated : v))}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Plus, X, Edit3, Star, Trash2, Image, Lock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import VisionUploadModal from "@/components/vision/VisionUploadModal";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "wealth", label: "💰 Wealth" },
  { id: "body", label: "💪 Body" },
  { id: "love", label: "❤️ Love" },
  { id: "business", label: "🚀 Business" },
  { id: "home", label: "🏡 Home" },
  { id: "lifestyle", label: "✨ Lifestyle" },
  { id: "spiritual", label: "🌙 Spiritual" },
];

export default function VisionVault() {
  const [visions, setVisions] = useState([]);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [editVision, setEditVision] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [v, p] = await Promise.all([
      base44.entities.VisionItem.filter({ user_email: u.email, is_active: true }, "-created_date"),
      base44.entities.UserProfile.filter({ user_email: u.email }),
    ]);
    setVisions(v);
    setProfile(p[0] || null);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.VisionItem.update(id, { is_active: false });
    setVisions(prev => prev.filter(v => v.id !== id));
  };

  const handlePriority = async (vision) => {
    await base44.entities.VisionItem.update(vision.id, { is_priority: !vision.is_priority });
    setVisions(prev => prev.map(v => v.id === vision.id ? { ...v, is_priority: !v.is_priority } : v));
  };

  const tier = profile?.subscription_tier || "free";
  const uploadLimit = tier === "free" ? 5 : tier === "supporter" ? 20 : 999;
  const canUpload = visions.length < uploadLimit;

  const filtered = activeCategory === "all" ? visions : visions.filter(v => v.category === activeCategory);

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Your Vision</p>
            <h1 className="font-playfair text-2xl font-semibold">Vision Vault</h1>
          </div>
          <button
            onClick={() => canUpload ? setShowUpload(true) : null}
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              canUpload ? "gold-gradient text-background" : "bg-border text-muted-foreground"
            }`}>
            {canUpload ? <Plus className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-background"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/30"
              }`}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Upload limit warning */}
        {!canUpload && (
          <div className="glass-card border border-primary/20 rounded-xl p-4 mb-5 flex items-center gap-3">
            <Lock className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">Vision limit reached ({visions.length}/{uploadLimit})</p>
              <p className="text-xs text-muted-foreground">Upgrade to add more visions</p>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No visions yet</p>
            <p className="text-xs text-muted-foreground mb-6">Upload images of the life you want to manifest</p>
            <button onClick={() => setShowUpload(true)}
              className="px-6 py-2.5 gold-gradient text-background text-sm font-semibold rounded-xl flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Your First Vision
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {filtered.map((vision, i) => (
                <motion.div key={vision.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative aspect-square rounded-2xl overflow-hidden group">
                  {vision.image_url ? (
                    <img src={vision.image_url} alt={vision.title}
                      className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full glass-card flex items-center justify-center">
                      <Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Priority star */}
                  <button onClick={() => handlePriority(vision)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center">
                    <Star className={`w-3.5 h-3.5 ${vision.is_priority ? "text-primary fill-primary" : "text-white/70"}`} />
                  </button>
                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs font-semibold text-white leading-tight line-clamp-1">{vision.title}</p>
                    <p className="text-[10px] text-white/60 mt-0.5 capitalize">{vision.category}</p>
                  </div>
                  {/* Action buttons on hover */}
                  <div className="absolute top-2.5 left-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditVision(vision)}
                      className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                      <Edit3 className="w-3 h-3 text-white" />
                    </button>
                    <button onClick={() => handleDelete(vision.id)}
                      className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

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
    </AppLayout>
  );
}
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, Lock, Sparkles, Image } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useUserProfile } from "@/lib/UserProfileContext";
import SeeMeModal from "@/components/vision/SeeMeModal";
import VisionUploadModal from "@/components/vision/VisionUploadModal";
import VisionImageViewer from "@/components/vision/VisionImageViewer";

const CATEGORIES = [
  { id: "wealth", label: "Wealth", icon: "💰", meaning: "money, income, abundance, savings, luxury purchases" },
  { id: "home", label: "Home", icon: "🏡", meaning: "house, apartment, dream space, environment" },
  { id: "body", label: "Body", icon: "💪", meaning: "fitness, health, appearance, energy" },
  { id: "love", label: "Love", icon: "❤️", meaning: "relationships, marriage, family, connection" },
  { id: "business", label: "Business", icon: "🚀", meaning: "brand, career, clients, success, productivity" },
  { id: "lifestyle", label: "Lifestyle", icon: "✨", meaning: "car, travel, fashion, freedom, experiences" },
  { id: "spiritual", label: "Spiritual", icon: "🌙", meaning: "peace, purpose, faith, healing, inner alignment" },
];

export default function Vision() {
  const navigate = useNavigate();
  const { user, profile, loading: profileLoading } = useUserProfile();
  const [visions, setVisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSeeMe, setShowSeeMe] = useState(false);
  const [seeMeVision, setSeeMeVision] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [viewerVision, setViewerVision] = useState(null);

  useEffect(() => {
    if (profileLoading) return;
    if (!user) navigate("/");
  }, [user, profileLoading, navigate]);

  useEffect(() => {
    (async () => {
      if (!user || profileLoading) return;
      
      console.log('[Vision] ═══ PAGE LOAD START ═══');
      console.log('[Vision] ENTITY CHECK: base44.entities.VisionItem =', base44.entities.VisionItem);
      console.log('[Vision] ENTITY NAME: VisionItem');
      console.log('[Vision] READ METHOD: base44.entities.VisionItem.filter()');
      console.log('[Vision] PAGE LOAD: Fetching visions for user:', user.email);
      console.log('[Vision] PAGE LOAD: Fetch query filter:', { user_email: user.email, is_active: true });
      
      const items = await base44.entities.VisionItem.filter({ user_email: user.email, is_active: true }, "-created_date");
      
      console.log('[Vision] ═══ PAGE LOAD RESPONSE RECEIVED ═══');
      console.log('[Vision] PAGE LOAD: Backend fetch count:', items?.length || 0);
      
      console.log('[Vision] STATE HYDRATION: Setting visions to state, count:', items?.length || 0);
      setVisions(items || []);
      
      console.log('[Vision] ═══ PAGE LOAD END ═══');
      setLoading(false);
    })();
  }, [user?.email, profileLoading]);

  // Optimistic vision card click → open viewer immediately
  const handleVisionClick = (vision) => {
    console.log('[Vision] Vision card clicked:', { id: vision.id, title: vision.title, image_url: vision.image_url?.substring(0, 50) });
    setViewerVision(vision);
  }

  const tier = profile?.subscription_tier || "free";
  const uploadLimit = tier === "free" ? 3 : tier === "supporter" ? 15 : 999;
  const canUpload = visions.length < uploadLimit;
  const canUseSeeMe = tier === "premium";

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
      <div className="px-5 pt-4 pb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">The Life You Want</p>
            <h1 className="font-playfair text-2xl font-semibold">Living Vision Board</h1>
            <p className="text-xs text-muted-foreground mt-1">{visions.length} vision{visions.length !== 1 ? "s" : ""}</p>
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

        {/* See Me In This Vision — Premium Feature */}
        {canUseSeeMe ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => { setSeeMeVision(null); setShowSeeMe(true); }}
            className="w-full mb-5 glass-card glow-gold border border-primary/25 rounded-2xl p-4 flex items-center gap-4 text-left hover:border-primary/50 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xl">🪞</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-foreground">See Me In This Vision</p>
                <span className="text-[9px] uppercase tracking-widest font-bold text-foreground bg-primary/15 border border-primary/30 rounded-full px-1.5 py-0.5">Premium Only</span>
              </div>
              <p className="text-xs text-muted-foreground">Place yourself inside your dream life with AI</p>
            </div>
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
          </motion.button>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate("/pricing")}
            className="w-full mb-5 glass-card border border-border rounded-2xl p-4 flex items-center gap-4 text-left hover:border-primary/20 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-border flex items-center justify-center shrink-0 text-xl">🪞</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-muted-foreground">See Me In This Vision</p>
                <span className="text-[9px] uppercase tracking-widest font-bold text-background bg-primary rounded-full px-1.5 py-0.5">Unlock</span>
              </div>
              <p className="text-xs text-muted-foreground">AI scene generation. Premium feature only.</p>
            </div>
            <Lock className="w-4 h-4 text-muted-foreground/50 shrink-0" />
          </motion.button>
        )}

        {!canUpload && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card border border-primary/20 rounded-xl p-4 mb-5 flex items-center gap-3">
            <Lock className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">Vision limit reached ({visions.length}/{uploadLimit})</p>
              <p className="text-xs text-muted-foreground">Upgrade to add more visions</p>
            </div>
          </motion.div>
        )}

        {visions.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl glass-card border border-border flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Your Living Vision Board is empty</p>
            <p className="text-xs text-muted-foreground mb-6 max-w-xs leading-relaxed">Upload images of the life you intend to live. Make it real.</p>
            <button onClick={() => setShowUpload(true)}
              className="px-6 py-2.5 gold-gradient text-background text-sm font-semibold rounded-xl flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Your First Vision
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {visions.map((vision, i) => {
                const cat = CATEGORIES.find(c => c.id === vision.category);
                console.log('[Vision] RENDER: Vision card mounting:', { 
                  id: vision.id, 
                  title: vision.title, 
                  has_image: !!vision.image_url,
                  image_url: vision.image_url?.substring(0, 50) + '...'
                });
                console.log('[Vision] RENDER: Full vision object:', vision);
                return (
                  <motion.div key={vision.id}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative rounded-2xl overflow-hidden group cursor-pointer"
                    onClick={() => setViewerVision(vision)}
                    style={{ aspectRatio: i % 5 === 0 ? "1/1.3" : "3/4" }}>

                    {(() => {
                      console.log('[Vision] IMG RENDER: About to render img tag for vision:', { 
                        id: vision.id, 
                        has_image_url: !!vision.image_url,
                        image_url_value: vision.image_url?.substring(0, 50) + '...',
                      });
                      if (vision.image_url) {
                        console.log('[Vision] IMG RENDER: Using permanent URL as src:', vision.image_url);
                      } else {
                        console.log('[Vision] IMG RENDER: NO IMAGE_URL - showing placeholder');
                      }
                      return null;
                    })()}

                    {vision.image_url ? (
                      <motion.img
                        src={vision.image_url} alt={vision.title}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.6 }}
                        onLoad={() => console.log('[Vision] IMG LOADED:', { id: vision.id, src: vision.image_url?.substring(0, 50) })}
                        onError={(err) => console.error('[Vision] IMG FAILED:', { id: vision.id, src: vision.image_url, error: err })}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted/40">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />



                    <div className="absolute inset-0 left-0 right-0 p-4 flex flex-col justify-end">
                      <div className="mb-2 h-1 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${vision.progress || 0}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full" style={{ backgroundColor: cat?.icon ? "hsl(45 80% 60%)" : "#fbbf24" }}
                        />
                      </div>
                      <div className="flex items-end justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white line-clamp-2">{vision.title}</p>
                          <p className="text-[9px] text-white/60 mt-0.5">{cat?.label || "Vision"}</p>
                        </div>
                        <span className="text-lg shrink-0">{cat?.icon}</span>
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
        {showUpload && (
          <VisionUploadModal
            vision={null}
            userEmail={user?.email}
            onClose={() => setShowUpload(false)}
            onSave={(v) => {
              console.log('[Vision] onSave called for new vision:', { 
                id: v.id, 
                title: v.title, 
                image_url: v.image_url?.substring(0, 50) + '...',
                image_url_exists: !!v.image_url
              });
              console.log('[Vision] Adding vision to state, before:', visions.length);
              setVisions(prev => {
                const updated = [v, ...prev];
                console.log('[Vision] Added vision to state, after:', updated.length);
                console.log('[Vision] Updated vision object in state:', {
                  id: updated[0].id,
                  image_url: updated[0].image_url?.substring(0, 50) + '...',
                  image_url_exists: !!updated[0].image_url,
                });
                return updated;
              });
              setShowUpload(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewerVision && (
          <VisionImageViewer
            vision={viewerVision}
            userEmail={user?.email}
            onClose={() => {
              console.log('[Vision] Closing viewer for vision:', viewerVision.id);
              setViewerVision(null);
            }}
            onRegenerate={(v) => {
              console.log('[Vision] onRegenerate called:', v.id);
              setViewerVision(null);
              setSeeMeVision(v);
              setShowSeeMe(true);
            }}
            onUpdate={(updated) => {
              console.log('[Vision] onUpdate called for vision:', { 
                id: updated.id, 
                image_url: updated.image_url?.substring(0, 50) + '...',
                is_priority: updated.is_priority
              });
              setVisions(prev => prev.map(v => v.id === updated.id ? updated : v));
            }}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
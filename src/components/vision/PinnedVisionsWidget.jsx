import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Pin, Image, ChevronRight } from "lucide-react";
import VisionDetailModal from "@/components/vision/VisionDetailModal";

const CATEGORY_META = {
  wealth:    { icon: "💰", color: "#fbbf24" },
  body:      { icon: "💪", color: "#34d399" },
  love:      { icon: "❤️", color: "#f87171" },
  business:  { icon: "🚀", color: "#60a5fa" },
  home:      { icon: "🏡", color: "#a78bfa" },
  lifestyle: { icon: "✨", color: "#f9a8d4" },
  spiritual: { icon: "🌙", color: "#818cf8" },
};

export default function PinnedVisionsWidget() {
  const [pinned, setPinned] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const items = await base44.entities.VisionItem.filter(
        { user_email: user.email, is_pinned: true, is_active: true },
        "-created_date", 6
      );
      setPinned(items);
      setLoading(false);
    })();
  }, []);

  const handleUpdate = (updated) => {
    setPinned(prev => prev.map(v => v.id === updated.id ? updated : v));
    setSelected(updated);
  };

  if (loading || pinned.length === 0) return null;

  return (
    <>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Pin className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Pinned Visions</p>
          </div>
          <button onClick={() => navigate("/vision-vault")}
            className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {pinned.map((vision, i) => {
            const meta = CATEGORY_META[vision.category] || { icon: "✦", color: "#fbbf24" };
            const progress = vision.progress || 0;
            return (
              <motion.button key={vision.id}
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                onClick={() => setSelected(vision)}
                className="shrink-0 w-40 glass-card border border-border rounded-2xl overflow-hidden text-left hover:border-primary/30 transition-colors">
                {/* Image */}
                <div className="relative h-24 w-full">
                  {vision.image_url ? (
                    <img src={vision.image_url} alt={vision.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                      <span className="text-2xl">{meta.icon}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute top-2 left-2 text-sm">{meta.icon}</span>
                  {/* Progress pill */}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ backgroundColor: meta.color + "30", color: meta.color, border: `1px solid ${meta.color}50` }}>
                    {progress}%
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-foreground line-clamp-1 mb-1.5">{vision.title}</p>
                  {/* Progress bar */}
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, delay: i * 0.06 + 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                  </div>
                  {vision.desired_timeline && (
                    <p className="text-[9px] text-muted-foreground mt-1.5">{vision.desired_timeline}</p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <VisionDetailModal
            vision={selected}
            onClose={() => setSelected(null)}
            onUpdate={handleUpdate}
          />
        )}
      </AnimatePresence>
    </>
  );
}
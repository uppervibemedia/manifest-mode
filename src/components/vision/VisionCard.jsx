import { useEffect } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";
import { isValidImageUrl, logImageUrlStatus } from "@/lib/imageUrlValidator";

const CATEGORIES = [
  { id: "wealth", label: "Wealth", icon: "💰" },
  { id: "home", label: "Home", icon: "🏡" },
  { id: "body", label: "Body", icon: "💪" },
  { id: "love", label: "Love", icon: "❤️" },
  { id: "business", label: "Business", icon: "🚀" },
  { id: "lifestyle", label: "Lifestyle", icon: "✨" },
  { id: "spiritual", label: "Spiritual", icon: "🌙" },
];

export default function VisionCard({ vision, index, onClick }) {
  const cat = CATEGORIES.find(c => c.id === vision.category);
  const validImageUrl = isValidImageUrl(vision.image_url);

  // Log image URL status for debugging
  useEffect(() => {
    logImageUrlStatus(vision.id, vision.image_url);
  }, [vision.id, vision.image_url]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ delay: index * 0.04 }}
      className="relative rounded-2xl overflow-hidden group cursor-pointer"
      onClick={onClick}
      style={{ aspectRatio: index % 5 === 0 ? "1/1.3" : "3/4" }}
    >
      {validImageUrl ? (
        <motion.img
          src={vision.image_url}
          alt={vision.title}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6 }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted/40">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

      <div className="absolute inset-0 left-0 right-0 p-4 flex flex-col justify-end">
        <div className="mb-2 h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${vision.progress || 0}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full"
            style={{ backgroundColor: cat?.icon ? "hsl(45 80% 60%)" : "#fbbf24" }}
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
}
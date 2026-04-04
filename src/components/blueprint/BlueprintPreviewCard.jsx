import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronRight } from "lucide-react";

export default function BlueprintPreviewCard() {
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const analyses = await base44.entities.AIAnalysis.filter({ user_email: user.email }, "-created_date", 1);
      if (analyses[0]) {
        setBlueprint({
          identity: analyses[0].future_self_statement,
          actionCount: analyses[0].action_plan?.length || 0,
        });
      }
      setLoading(false);
    })();
  }, []);

  if (loading || !blueprint) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate("/blueprint")}
      className="w-full glass-card glow-gold rounded-2xl p-4 mb-3 cursor-pointer glow-gold border border-primary/25 flex items-center gap-4 hover:border-primary/50 transition-colors text-left"
    >
      <div className="w-11 h-11 gold-gradient rounded-xl flex items-center justify-center shrink-0 text-background">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Future Self Blueprint</p>
        <p className="text-xs text-foreground/60 mt-0.5 line-clamp-1">
          {blueprint.identity || "Your operating manual"}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </motion.button>
  );
}
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
      const analyses = await base44.entities.AIAnalysis.filter(
        { user_email: user.email },
        "-created_date",
        1
      );
      if (analyses[0]) {
        setBlueprint({
          identity: analyses[0].future_self_statement,
          id: analyses[0].id,
        });
      }
      setLoading(false);
    })();
  }, []);

  if (loading || !blueprint) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      onClick={() => navigate("/blueprint")}
      className="w-full glass-card glow-gold rounded-2xl p-5 mb-3 border border-primary/25 text-left hover:border-primary/50 transition-colors flex items-center justify-between"
    >
      <div className="flex items-start gap-4 flex-1">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-lg">
          🧬
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">
            Your Blueprint
          </p>
          <p className="text-sm font-semibold text-foreground line-clamp-1">
            {blueprint.identity || "Future Self Blueprint"}
          </p>
          <p className="text-xs text-primary/80 mt-0.5 font-medium">
            View full blueprint →
          </p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
    </motion.button>
  );
}
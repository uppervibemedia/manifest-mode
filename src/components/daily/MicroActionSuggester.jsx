import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Zap, RefreshCw, Check, ChevronDown, ChevronUp } from "lucide-react";

export default function MicroActionSuggester({ userEmail }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completed, setCompleted] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const [misalignment, setMisalignment] = useState(null);

  useEffect(() => {
    if (userEmail) loadSuggestions();
  }, [userEmail]);

  const loadSuggestions = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const analyses = await base44.entities.AIAnalysis.filter(
        { user_email: userEmail },
        "-created_date",
        1
      );

      const analysis = analyses[0];
      if (!analysis?.misalignment_summary) {
        setActions([]);
        return;
      }

      setMisalignment(analysis.misalignment_summary);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a personal growth coach. Based on this user's key misalignment from their self-assessment, suggest exactly 1 micro-action they can do TODAY to start bridging the gap to their Future Self.

Key Misalignment: "${analysis.misalignment_summary}"
Future Self Identity: "${analysis.future_self_statement || "their highest potential"}"

Rules:
- Must take 5–15 minutes max
- Be ultra-specific and actionable (not vague advice)
- Start with a strong action verb
- Make it feel achievable today, not overwhelming
- Directly address the misalignment

Return ONLY a JSON object with this exact structure:
{
  "actions": [
    { "action": "...", "why": "one short sentence on how this closes the gap" }
  ]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  why: { type: "string" },
                },
              },
            },
          },
        },
      });

      setActions(result?.actions || []);
      setCompleted({});
    } catch (e) {
      console.error("MicroActionSuggester error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleComplete = (i) =>
    setCompleted((prev) => ({ ...prev, [i]: !prev[i] }));

  if (loading) {
    return (
      <div className="glass-card border border-border rounded-2xl p-4 mb-6 animate-pulse">
        <div className="h-3 w-32 bg-muted rounded mb-3" />
        <div className="h-4 w-full bg-muted rounded mb-2" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>
    );
  }

  if (!actions.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="font-playfair text-base font-semibold">Gap-Closing Micro-Actions</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadSuggestions(true)}
            disabled={refreshing}
            className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
          >
            {collapsed ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Misalignment context */}
      {!collapsed && misalignment && (
        <div className="glass-card border border-orange-500/20 rounded-xl px-4 py-2.5 mb-3">
          <p className="text-[10px] uppercase tracking-widest text-orange-400/80 font-semibold mb-0.5">Your Gap</p>
          <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">{misalignment}</p>
        </div>
      )}

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {actions.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`glass-card rounded-xl p-4 border transition-all duration-300 ${
                  completed[i]
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete(i)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      completed[i]
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-muted-foreground/30 hover:border-primary/50"
                    }`}
                  >
                    {completed[i] && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-snug mb-1 transition-all ${
                      completed[i] ? "line-through text-muted-foreground" : "text-foreground"
                    }`}>
                      {item.action}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.why}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
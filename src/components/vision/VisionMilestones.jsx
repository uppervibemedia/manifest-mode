import { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Loader2, CalendarDays, Check, RefreshCw } from "lucide-react";

export default function VisionMilestones({ vision, milestones, onSave, accentColor }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(milestones || []);

  const generate = async () => {
    if (loading) return;
    setLoading(true);

    const prompt = `You are an AI coach inside Manifest Mode, a personal transformation app.

The user has a vision:
- Title: "${vision.title}"
- Category: ${vision.category}
- Timeline: ${vision.desired_timeline || "1 year"}
- Why they want it: "${vision.why_i_want_this || vision.emotional_goal || "not specified"}"
- Current progress: ${vision.progress || 0}%

Break this vision down into actionable monthly milestones for the "${vision.desired_timeline || "1 year"}" timeline.
Each milestone should be a concrete, measurable achievement for that month.
The milestones should build progressively — early months focus on foundation/habits, middle months on momentum, final months on completion.

Return a JSON array of milestone objects. The number of items should match the timeline (e.g. "6 months" = 6 items, "1 year" = 12, "3 months" = 3, "2 years" = 12 condensed bi-monthly, "3+ years" = 12 quarterly).

{ "milestones": [ { "month": "Month 1", "title": "Short milestone title", "description": "One sentence of what to achieve this month.", "completed": false } ] }`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          milestones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                month: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                completed: { type: "boolean" }
              }
            }
          }
        }
      }
    });

    const generated = (result?.milestones || []).map(m => ({ ...m, completed: false }));
    setItems(generated);
    onSave({ milestones: generated });
    setLoading(false);
  };

  const toggleComplete = (idx) => {
    const updated = items.map((m, i) => i === idx ? { ...m, completed: !m.completed } : m);
    setItems(updated);
    onSave({ milestones: updated });
  };

  const completedCount = items.filter(m => m.completed).length;
  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" style={{ color: accentColor }} />
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Monthly Milestones</p>
          {items.length > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: accentColor + "20", color: accentColor }}>
              {completedCount}/{items.length}
            </span>
          )}
        </div>
        <button onClick={generate} disabled={loading}
          className="flex items-center gap-1 text-[10px] font-semibold border rounded-full px-2.5 py-1 transition-colors disabled:opacity-40"
          style={{ color: accentColor, borderColor: accentColor + "50" }}>
          {loading
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <RefreshCw className="w-3 h-3" />
          }
          {items.length > 0 ? "Regenerate" : "Generate AI Timeline"}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4 justify-center">
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Building your roadmap...</p>
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-xs text-muted-foreground/50 italic">
          Let AI map out your {vision.desired_timeline || "timeline"} into monthly wins.
        </p>
      )}

      {!loading && items.length > 0 && (
        <>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Timeline progress</span>
              <span style={{ color: accentColor }}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />

            <div className="space-y-3">
              {items.map((milestone, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 pl-1"
                >
                  {/* Node */}
                  <button
                    onClick={() => toggleComplete(i)}
                    className="w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all z-10 relative"
                    style={{
                      borderColor: milestone.completed ? accentColor : "hsl(220 15% 25%)",
                      backgroundColor: milestone.completed ? accentColor : "hsl(220 18% 10%)",
                    }}>
                    {milestone.completed
                      ? <Check className="w-3 h-3 text-background" />
                      : <span className="text-[9px] font-bold text-muted-foreground">{i + 1}</span>
                    }
                  </button>

                  {/* Content */}
                  <div className={`flex-1 glass-card border rounded-xl px-3 py-2.5 transition-all ${
                    milestone.completed ? "opacity-60" : ""
                  }`} style={{ borderColor: milestone.completed ? accentColor + "40" : "hsl(220 15% 18%)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold mb-0.5" style={{ color: accentColor }}>
                          {milestone.month}
                        </p>
                        <p className={`text-sm font-semibold leading-tight ${milestone.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {milestone.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
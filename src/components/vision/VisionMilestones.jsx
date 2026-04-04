import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Loader2, CalendarDays, Check, RefreshCw, ChevronDown, ChevronUp, Zap, Eye, Brain, Footprints } from "lucide-react";

export default function VisionMilestones({ vision, milestones, onSave, accentColor }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(milestones || []);
  const [expanded, setExpanded] = useState(null);

  const generate = async () => {
    if (loading) return;
    setLoading(true);

    const prompt = `You are the Future Self Coach inside Manifest Mode — a premium personal transformation app that blends identity psychology, emotional alignment, visualization, and grounded real-world action.

The user has a vision they are working toward:
- Title: "${vision.title}"
- Category: ${vision.category}
- Timeline: ${vision.desired_timeline || "1 year"}
- Why they want it: "${vision.why_i_want_this || vision.emotional_goal || "not specified"}"
- Current progress: ${vision.progress || 0}%

Your job: create a month-by-month transformation roadmap for their "${vision.desired_timeline || "1 year"}" journey.

This is NOT a generic goal planner or financial checklist. Each month should feel like a coaching session from their future self — blending identity work, emotional connection, visualization, belief rewiring, and practical movement.

For goals like a car, house, business, or body transformation: help them emotionally inhabit the vision WHILE taking concrete steps that make it real.

Progression arc:
- Early months (1-3): Identity foundation, emotional connection, releasing old beliefs
- Middle months: Building evidence, momentum habits, belief reinforcement through action
- Final months: Embodying the identity, completing the vision, becoming who has this

For each month return:
- month: e.g. "Month 1", "Month 2" (or "Quarter 1" for 3+ year timelines)
- theme: A short evocative name for this month's transformation arc (e.g. "The Becoming", "Building Evidence", "Claiming It")
- identity_shift: Who they must become this month — stated as an identity declaration ("I am someone who...")
- visualization: A specific, sensory visualization practice or emotional connection exercise for this month (2 sentences max, present tense, vivid)
- action: ONE concrete, measurable real-world action step for this month — specific enough to do this week
- affirmation: A short, powerful daily affirmation aligned to this month's theme (1 sentence, present tense, personal)
- completed: false

Number of milestones: match the timeline ("3 months" = 3, "6 months" = 6, "1 year" = 12, "2 years" = 12 bi-monthly, "3+ years" = 12 quarterly).

Tone: direct, warm, visionary but grounded. Never generic. Always personalized to their specific vision.`;

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
                theme: { type: "string" },
                identity_shift: { type: "string" },
                visualization: { type: "string" },
                action: { type: "string" },
                affirmation: { type: "string" },
                completed: { type: "boolean" }
              }
            }
          }
        }
      }
    });

    const generated = (result?.milestones || []).map(m => ({ ...m, completed: false }));
    setItems(generated);
    setExpanded(0);
    onSave({ milestones: generated });
    setLoading(false);
  };

  const toggleComplete = (idx, e) => {
    e.stopPropagation();
    const updated = items.map((m, i) => i === idx ? { ...m, completed: !m.completed } : m);
    setItems(updated);
    onSave({ milestones: updated });
  };

  const completedCount = items.filter(m => m.completed).length;
  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" style={{ color: accentColor }} />
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Transformation Roadmap</p>
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
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {items.length > 0 ? "Regenerate" : "Build My Roadmap"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Mapping your transformation journey...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <p className="text-xs text-muted-foreground/50 italic">
          Generate a month-by-month identity roadmap tailored to your {vision.desired_timeline || "timeline"} — blending who you're becoming with what you're building.
        </p>
      )}

      {/* Timeline */}
      {!loading && items.length > 0 && (
        <>
          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
              <span>Transformation progress</span>
              <span style={{ color: accentColor }}>{pct}% complete</span>
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

          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-px"
              style={{ background: `linear-gradient(to bottom, ${accentColor}60, ${accentColor}10)` }} />

            <div className="space-y-2">
              {items.map((milestone, i) => {
                const isOpen = expanded === i;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 pl-1"
                  >
                    {/* Node */}
                    <button
                      onClick={(e) => toggleComplete(i, e)}
                      className="w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center shrink-0 mt-2.5 transition-all z-10 relative"
                      style={{
                        borderColor: milestone.completed ? accentColor : "hsl(220 15% 28%)",
                        backgroundColor: milestone.completed ? accentColor : "hsl(220 18% 10%)",
                        boxShadow: milestone.completed ? `0 0 10px ${accentColor}40` : "none",
                      }}>
                      {milestone.completed
                        ? <Check className="w-3.5 h-3.5 text-background" />
                        : <span className="text-[9px] font-bold text-muted-foreground">{i + 1}</span>
                      }
                    </button>

                    {/* Card */}
                    <div
                      className={`flex-1 rounded-2xl border overflow-hidden transition-all cursor-pointer ${
                        milestone.completed ? "opacity-55" : ""
                      }`}
                      style={{
                        borderColor: isOpen ? accentColor + "50" : "hsl(220 15% 18%)",
                        background: isOpen ? `linear-gradient(135deg, hsl(220 18% 11%), hsl(220 18% 10%))` : "rgba(255,255,255,0.03)"
                      }}
                      onClick={() => setExpanded(isOpen ? null : i)}
                    >
                      {/* Collapsed header */}
                      <div className="flex items-center justify-between px-3.5 py-3 gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-semibold" style={{ color: accentColor }}>
                              {milestone.month}
                            </span>
                            {milestone.theme && (
                              <span className="text-[10px] text-muted-foreground/70 font-medium italic truncate">
                                · {milestone.theme}
                              </span>
                            )}
                          </div>
                          {milestone.identity_shift && !isOpen && (
                            <p className="text-xs text-foreground/70 truncate leading-snug">
                              {milestone.identity_shift}
                            </p>
                          )}
                        </div>
                        {isOpen
                          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        }
                      </div>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3.5 pb-4 space-y-3 border-t border-border/50">

                              {/* Identity Shift */}
                              {milestone.identity_shift && (
                                <div className="flex items-start gap-2.5 pt-3">
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ backgroundColor: accentColor + "18" }}>
                                    <Brain className="w-3 h-3" style={{ color: accentColor }} />
                                  </div>
                                  <div>
                                    <p className="text-[9px] uppercase tracking-widest font-semibold mb-0.5 text-muted-foreground">Identity Shift</p>
                                    <p className="text-sm text-foreground/85 leading-snug font-medium italic">"{milestone.identity_shift}"</p>
                                  </div>
                                </div>
                              )}

                              {/* Visualization */}
                              {milestone.visualization && (
                                <div className="flex items-start gap-2.5">
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ backgroundColor: accentColor + "18" }}>
                                    <Eye className="w-3 h-3" style={{ color: accentColor }} />
                                  </div>
                                  <div>
                                    <p className="text-[9px] uppercase tracking-widest font-semibold mb-0.5 text-muted-foreground">Visualization</p>
                                    <p className="text-xs text-foreground/75 leading-relaxed">{milestone.visualization}</p>
                                  </div>
                                </div>
                              )}

                              {/* Action Step */}
                              {milestone.action && (
                                <div className="flex items-start gap-2.5">
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                    style={{ backgroundColor: accentColor + "18" }}>
                                    <Footprints className="w-3 h-3" style={{ color: accentColor }} />
                                  </div>
                                  <div>
                                    <p className="text-[9px] uppercase tracking-widest font-semibold mb-0.5 text-muted-foreground">This Month's Action</p>
                                    <p className="text-xs text-foreground/85 leading-relaxed font-medium">{milestone.action}</p>
                                  </div>
                                </div>
                              )}

                              {/* Affirmation */}
                              {milestone.affirmation && (
                                <div className="rounded-xl px-3 py-2.5 border-l-2"
                                  style={{ backgroundColor: accentColor + "08", borderColor: accentColor + "60" }}>
                                  <p className="text-[9px] uppercase tracking-widest font-semibold mb-1 text-muted-foreground">Daily Affirmation</p>
                                  <p className="text-xs font-semibold leading-relaxed" style={{ color: accentColor }}>
                                    ✦ {milestone.affirmation}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
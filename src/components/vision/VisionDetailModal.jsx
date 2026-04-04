import { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2, Loader2, Image, Sparkles, Camera, Zap, Target } from "lucide-react";
import { getCategoryMeta } from "@/lib/categories";

export default function VisionDetailModal({ vision, onClose, onUpdate }) {
  const meta = getCategoryMeta(vision.category);
  const [progress, setProgress] = useState(vision.progress || 0);
  const [steps, setSteps] = useState(vision.action_steps || []);
  const [proofImages, setProofImages] = useState(vision.proof_images || []);
  const [newStep, setNewStep] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insight, setInsight] = useState(vision.ai_insight || null);
  const [dailyAction, setDailyAction] = useState(vision.daily_action || null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const saveChanges = async (updates) => {
    setSaving(true);
    const saved = await base44.entities.VisionItem.update(vision.id, updates);
    onUpdate(saved);
    setSaving(false);
  };

  const handleProgressChange = (val) => {
    setProgress(val);
    saveChanges({ progress: val });
  };

  const addStep = async () => {
    const trimmed = newStep.trim();
    if (!trimmed) return;
    const updated = [...steps, trimmed];
    setSteps(updated);
    setNewStep("");
    saveChanges({ action_steps: updated });
  };

  const removeStep = async (i) => {
    const updated = steps.filter((_, idx) => idx !== i);
    setSteps(updated);
    saveChanges({ action_steps: updated });
  };

  const generateInsight = async () => {
    if (loadingInsight) return;
    setLoadingInsight(true);
    const prompt = `You are an AI coach inside Manifest Mode, a personal transformation app.

The user has a vision on their Living Vision Board:
- Title: "${vision.title}"
- Category: ${meta.label} (${meta.meaning})
- Emotional goal: "${vision.emotional_goal || "not specified"}"
- Why they want it: "${vision.why_i_want_this || vision.notes || "not specified"}"
- Timeline: ${vision.desired_timeline || "not specified"}
- Progress: ${progress}%

Generate two things:
1. A sharp, personalized AI insight about this specific vision — what identity shift is needed, what gap to close, or what mindset to embody. 2-3 sentences. Direct, not generic.
2. ONE concrete daily action this person can take TODAY toward this vision. Short. Specific. Actionable.

Return as JSON: { "insight": "...", "daily_action": "..." }`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          insight: { type: "string" },
          daily_action: { type: "string" },
        },
      },
    });

    const ins = result?.insight || "";
    const act = result?.daily_action || "";
    setInsight(ins);
    setDailyAction(act);
    const today = new Date().toISOString().split("T")[0];
    saveChanges({ ai_insight: ins, daily_action: act, ai_insight_generated_date: today });
    setLoadingInsight(false);
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingProof(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updated = [...proofImages, file_url];
    setProofImages(updated);
    saveChanges({ proof_images: updated });
    setUploadingProof(false);
  };

  const removeProof = async (i) => {
    const updated = proofImages.filter((_, idx) => idx !== i);
    setProofImages(updated);
    saveChanges({ proof_images: updated });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="w-full max-w-md bg-card rounded-t-3xl overflow-hidden max-h-[94vh] flex flex-col">

        {/* Hero image */}
        <div className="relative h-56 shrink-0">
          {vision.image_url ? (
            <motion.img
              src={vision.image_url} alt={vision.title}
              className="w-full h-full object-cover"
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 6, ease: "easeOut" }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Image className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-black/30 to-transparent" />
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-t-3xl" style={{ boxShadow: `inset 0 0 60px ${meta.color}15` }} />

          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Score overlay */}
          {progress > 0 && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border"
              style={{ borderColor: meta.color + "50" }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
              <span className="text-[10px] font-bold text-white">{progress}% there</span>
            </div>
          )}

          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{meta.icon}</span>
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: meta.color }}>
                {meta.label}
              </span>
              {vision.is_priority && (
                <span className="text-[9px] font-bold text-primary border border-primary/40 bg-primary/15 rounded-full px-2 py-0.5 ml-auto">
                  ✦ Priority Vision
                </span>
              )}
              {vision.desired_timeline && (
                <span className={`text-[10px] text-white/60 bg-black/30 px-2 py-0.5 rounded-full ${vision.is_priority ? "" : "ml-auto"}`}>
                  {vision.desired_timeline}
                </span>
              )}
            </div>
            <h2 className="font-playfair text-xl font-semibold text-white leading-tight">{vision.title}</h2>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

          {/* Progress tracker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Proof of Progress</p>
              <span className="text-sm font-bold" style={{ color: meta.color }}>{progress}%</span>
            </div>
            <input type="range" min="0" max="100" step="5" value={progress}
              onChange={e => handleProgressChange(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, ${meta.color} ${progress}%, hsl(220 15% 18%) ${progress}%)` }} />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground/50">Just started</span>
              <span className="text-[10px] text-muted-foreground/50">Achieved ✦</span>
            </div>
          </div>

          {/* AI Insight block */}
          <div className="glass-card border rounded-2xl p-4" style={{ borderColor: meta.color + "30" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: meta.color }} />
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">AI Insight</p>
              </div>
              <button onClick={generateInsight} disabled={loadingInsight}
                className="text-[10px] font-semibold border rounded-full px-2.5 py-1 transition-colors disabled:opacity-40"
                style={{ color: meta.color, borderColor: meta.color + "50" }}>
                {loadingInsight ? <Loader2 className="w-3 h-3 animate-spin" /> : insight ? "Refresh" : "Generate"}
              </button>
            </div>

            {loadingInsight ? (
              <div className="flex items-center gap-2 py-2">
                <div className="flex gap-1">
                  {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                </div>
                <p className="text-xs text-muted-foreground">Analyzing your vision...</p>
              </div>
            ) : insight ? (
              <p className="text-sm text-foreground/85 leading-relaxed">{insight}</p>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic">Get a personalized insight about this vision based on your Blueprint and Score.</p>
            )}
          </div>

          {/* Daily Action */}
          {dailyAction && (
            <div className="glass-card border border-border rounded-xl px-4 py-3 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: meta.color + "20" }}>
                <Target className="w-3.5 h-3.5" style={{ color: meta.color }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-medium mb-1" style={{ color: meta.color }}>Today's Action</p>
                <p className="text-sm text-foreground/85 leading-snug">{dailyAction}</p>
              </div>
            </div>
          )}

          {/* Emotional goal */}
          {vision.emotional_goal && (
            <div className="glass-card rounded-xl p-4 border-l-2" style={{ borderColor: meta.color + "70" }}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">How it feels when I have this</p>
              <p className="text-sm text-foreground/80 italic">"{vision.emotional_goal}"</p>
            </div>
          )}

          {/* Why I want this */}
          {(vision.why_i_want_this || vision.notes) && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">Why This Matters</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{vision.why_i_want_this || vision.notes}</p>
            </div>
          )}

          {/* Action steps */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Action Steps</p>
            <div className="space-y-2 mb-3">
              {steps.length === 0 && (
                <p className="text-xs text-muted-foreground/50 italic">Add the steps that will make this real.</p>
              )}
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 glass-card rounded-xl px-3 py-2.5 border border-border">
                  <span className="text-xs font-bold shrink-0 mt-0.5" style={{ color: meta.color }}>{i + 1}.</span>
                  <p className="text-sm text-foreground/80 flex-1 leading-relaxed">{step}</p>
                  <button onClick={() => removeStep(i)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors mt-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newStep} onChange={e => setNewStep(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addStep()}
                placeholder="Add a step..."
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50" />
              <button onClick={addStep} disabled={!newStep.trim()}
                className="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center disabled:opacity-30 shrink-0">
                {saving ? <Loader2 className="w-4 h-4 text-background animate-spin" /> : <Plus className="w-4 h-4 text-background" />}
              </button>
            </div>
          </div>

          {/* Proof of Progress Images */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Proof of Progress</p>
              <label className="flex items-center gap-1.5 text-[10px] font-semibold cursor-pointer border rounded-full px-2.5 py-1 transition-colors"
                style={{ color: meta.color, borderColor: meta.color + "50" }}>
                {uploadingProof ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                Add photo
                <input type="file" accept="image/*" className="hidden" onChange={handleProofUpload} disabled={uploadingProof} />
              </label>
            </div>
            {proofImages.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 italic">Upload real photos showing your movement toward this vision — your body, bank account, environment. Track your transformation.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {proofImages.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={url} alt={`Proof ${i + 1}`} className="w-full h-full object-cover" />
                    <button onClick={() => removeProof(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                    <div className="absolute bottom-1 left-1 text-[9px] text-white/60 bg-black/40 rounded px-1">
                      #{i + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
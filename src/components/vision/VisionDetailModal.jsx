import { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2, Loader2, Image } from "lucide-react";

const CATEGORY_META = {
  wealth:    { icon: "💰", color: "#fbbf24" },
  body:      { icon: "💪", color: "#34d399" },
  love:      { icon: "❤️", color: "#f87171" },
  business:  { icon: "🚀", color: "#60a5fa" },
  home:      { icon: "🏡", color: "#a78bfa" },
  lifestyle: { icon: "✨", color: "#f9a8d4" },
  spiritual: { icon: "🌙", color: "#818cf8" },
};

export default function VisionDetailModal({ vision, onClose, onUpdate }) {
  const meta = CATEGORY_META[vision.category] || { icon: "✦", color: "#fbbf24" };
  const [progress, setProgress] = useState(vision.progress || 0);
  const [steps, setSteps] = useState(vision.action_steps || []);
  const [newStep, setNewStep] = useState("");
  const [saving, setSaving] = useState(false);

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="w-full max-w-md bg-card rounded-t-3xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Hero image */}
        <div className="relative h-52 shrink-0">
          {vision.image_url ? (
            <img src={vision.image_url} alt={vision.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Image className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-black/30 to-transparent" />
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{meta.icon}</span>
              <span className="text-[10px] uppercase tracking-widest font-medium capitalize"
                style={{ color: meta.color }}>{vision.category}</span>
              {vision.desired_timeline && (
                <span className="ml-auto text-[10px] text-white/60 bg-black/30 px-2 py-0.5 rounded-full">
                  {vision.desired_timeline}
                </span>
              )}
            </div>
            <h2 className="font-playfair text-xl font-semibold text-white">{vision.title}</h2>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

          {/* Progress tracker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">My Progress</p>
              <span className="text-sm font-bold" style={{ color: meta.color }}>{progress}%</span>
            </div>
            <input type="range" min="0" max="100" step="5" value={progress}
              onChange={e => handleProgressChange(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${meta.color} ${progress}%, hsl(220 15% 18%) ${progress}%)`
              }} />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground/50">Just started</span>
              <span className="text-[10px] text-muted-foreground/50">Achieved ✦</span>
            </div>
          </div>

          {/* Emotional goal */}
          {vision.emotional_goal && (
            <div className="glass-card rounded-xl p-4 border-l-2" style={{ borderColor: meta.color + "60" }}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">How it feels when I have this</p>
              <p className="text-sm text-foreground/80 italic">"{vision.emotional_goal}"</p>
            </div>
          )}

          {/* Why I want this */}
          {vision.notes && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">Why This Matters</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{vision.notes}</p>
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
        </div>
      </motion.div>
    </motion.div>
  );
}
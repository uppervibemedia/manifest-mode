import { useState } from "react";
import { motion } from "framer-motion";
import { X, Download, Image as ImageIcon, Check, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCategoryMeta } from "@/lib/categories";
import { isValidImageUrl } from "@/lib/imageUrlValidator";

// Parse which proof images are AI-generated from the vision's notes field
function getAiGeneratedUrls(vision) {
  if (!vision?.notes) return new Set();
  const matches = vision.notes.matchAll(/\[ai_generated:([^\]]+)\]/g);
  return new Set([...matches].map(m => m[1]));
}

export default function VisionImageViewer({ vision, userEmail, tier, onClose, onGenerateSeeMe, onUpdate }) {
  const meta = getCategoryMeta(vision.category);
  const [downloading, setDownloading] = useState(false);
  const [settingFocus, setSettingFocus] = useState(false);
  const [focusSet, setFocusSet] = useState(false);

  // Determine the image to display — use main image_url
  const imageUrl = vision.image_url;
  const validImageUrl = isValidImageUrl(imageUrl);
  const aiGeneratedUrls = getAiGeneratedUrls(vision);
  // Image is AI-generated if its URL appears in the notes markers OR if the vision title is the default AI title OR if it's in proof_images from See Me
  const isAiGenerated = validImageUrl && (aiGeneratedUrls.has(imageUrl) || vision.title === "See Me In This Vision" || vision.proof_images?.includes(imageUrl));

  const handleDownload = async () => {
    if (!validImageUrl) return;
    setDownloading(true);
    const blob = await fetch(imageUrl).then(r => r.blob());
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${vision.title?.replace(/\s+/g, "-") || "vision"}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  const handleSetAsFocus = async () => {
    if (!vision?.id || focusSet || !validImageUrl) return;
    setSettingFocus(true);
    await base44.entities.VisionItem.update(vision.id, { is_priority: true });
    onUpdate?.({ ...vision, is_priority: true });
    setFocusSet(true);
    setSettingFocus(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-end justify-center"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: "92dvh" }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-base">{meta.icon}</span>
              <h2 className="font-playfair text-base font-semibold text-foreground truncate max-w-[220px]">{vision.title}</h2>
              {isAiGenerated && (
                <span className="text-[9px] uppercase tracking-widest font-bold text-background bg-primary rounded-full px-1.5 py-0.5 shrink-0">AI</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{meta.label}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-border flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 overflow-y-auto">
          {validImageUrl ? (
            <div className={`w-full ${isAiGenerated ? "border-b border-primary/20 glow-gold" : ""}`}>
              <img src={imageUrl} alt={vision.title} className="w-full h-auto" />
            </div>
          ) : (
            <div className="w-full aspect-square flex items-center justify-center bg-muted">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}

          {/* AI badge strip */}
          {isAiGenerated && (
            <div className="px-5 py-3 flex items-center gap-2 border-b border-border/50">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">Generated via <span className="text-primary font-semibold">See Me In This Vision</span></p>
            </div>
          )}

          {/* Details */}
          {vision.emotional_goal && (
            <div className="px-5 py-4">
              <p className="text-sm text-foreground/70 italic leading-relaxed">"{vision.emotional_goal}"</p>
            </div>
          )}

          {/* AI Roadmap & Insights Section */}
          {tier === "premium" && (
            <div className="px-5 py-4 space-y-4 border-t border-border/50">
              {isAiGenerated ? (
                <>
                  {/* AI Scene Badge */}
                  <div className="glass-card glow-gold border border-primary/25 rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Your AI Vision</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Manifested with See Me In This Vision</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Generate See Me Button for non-AI images */}
                  <div className="glass-card glow-gold border border-primary/25 rounded-2xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">See Me In This Vision</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">AI places you inside your dream</p>
                      </div>
                    </div>
                    <button
                      onClick={onGenerateSeeMe}
                      className="w-full py-2 rounded-lg gold-gradient text-background text-xs font-semibold flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      Generate Now
                    </button>
                  </div>
                </>
              )}

              {/* Vision Context & Roadmap */}
              <div className="space-y-3">
                {vision.why_i_want_this && (
                  <div className="glass-card rounded-xl p-3 border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Why I Want This</p>
                    <p className="text-xs text-foreground/80 leading-relaxed">{vision.why_i_want_this}</p>
                  </div>
                )}
                {vision.desired_timeline && (
                  <div className="glass-card rounded-xl p-3 border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Timeline</p>
                    <p className="text-xs text-foreground/80">{vision.desired_timeline}</p>
                  </div>
                )}
                {vision.action_steps && vision.action_steps.length > 0 && (
                  <div className="glass-card rounded-xl p-3 border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Action Roadmap</p>
                    <ul className="space-y-1.5">
                      {vision.action_steps.slice(0, 4).map((step, i) => (
                        <li key={i} className="text-xs text-foreground flex gap-2">
                          <span className="text-primary shrink-0 font-bold">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                      {vision.action_steps.length > 4 && (
                        <li className="text-xs text-muted-foreground italic">+ {vision.action_steps.length - 4} more steps</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Premium Feature Teaser for non-premium users */}
          {!isAiGenerated && tier !== "premium" && (
            <div className="px-5 py-4 space-y-3 border-t border-border/50">
              {/* Premium Teaser */}
              <div className="glass-card border border-primary/30 rounded-2xl p-4 bg-primary/5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-primary">See Me In This Vision</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Premium Feature — AI places you inside your dream</p>
                  </div>
                </div>
                <div className="space-y-2 mb-3 p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-primary text-xs">✦</span>
                    <p className="text-[10px] text-foreground/80">Upload your photo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary text-xs">✦</span>
                    <p className="text-[10px] text-foreground/80">AI generates aspirational scene</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary text-xs">✦</span>
                    <p className="text-[10px] text-foreground/80">View your AI roadmap</p>
                  </div>
                </div>
                <button
                  onClick={onGenerateSeeMe}
                  className="w-full py-2.5 rounded-lg border border-primary/40 bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-2 hover:bg-primary/15 transition-colors">
                  <Sparkles className="w-3 h-3" />
                  Upgrade to Unlock
                </button>
              </div>

              {/* AI Roadmap Preview */}
              <div className="glass-card rounded-xl p-3 border border-border/50 opacity-60">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Premium Only: Your AI Roadmap</p>
                <div className="space-y-1 blur-sm">
                  <p className="text-xs text-foreground/50">Why you want this…</p>
                  <p className="text-xs text-foreground/50">Your timeline…</p>
                  <p className="text-xs text-foreground/50">Step-by-step action plan…</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions footer */}
        <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur px-5 pt-4 space-y-2.5"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>

          {/* Download */}
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading || !validImageUrl}
              className="flex-1 py-3 rounded-xl border border-border bg-background text-foreground font-semibold flex items-center justify-center gap-2 hover:border-primary/40 transition-colors text-sm disabled:opacity-40">
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? "Downloading…" : "Download"}
            </button>

            <button
              onClick={handleSetAsFocus}
              disabled={settingFocus || focusSet || vision.is_priority}
              className={`flex-1 py-3 rounded-xl border font-semibold flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-50 ${
                focusSet || vision.is_priority
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:border-primary/40"
              }`}>
              {settingFocus ? <Loader2 className="w-4 h-4 animate-spin" /> : (focusSet || vision.is_priority) ? <Check className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              {(focusSet || vision.is_priority) ? "Priority ✦" : "Set as Focus"}
            </button>
          </div>


        </div>
      </motion.div>
    </motion.div>
  );
}
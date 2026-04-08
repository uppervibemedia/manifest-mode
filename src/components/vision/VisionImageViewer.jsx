import { useState } from "react";
import { motion } from "framer-motion";
import { X, Download, Image as ImageIcon, Check, Loader2, Sparkles, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getCategoryMeta } from "@/lib/categories";

// Parse which proof images are AI-generated from the vision's notes field
function getAiGeneratedUrls(vision) {
  if (!vision?.notes) return new Set();
  const matches = vision.notes.matchAll(/\[ai_generated:([^\]]+)\]/g);
  return new Set([...matches].map(m => m[1]));
}

export default function VisionImageViewer({ vision, userEmail, onClose, onRegenerate, onUpdate, onDelete }) {
  const meta = getCategoryMeta(vision.category);
  const [downloading, setDownloading] = useState(false);
  const [settingFocus, setSettingFocus] = useState(false);
  const [focusSet, setFocusSet] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Determine the image to display — use main image_url
  const imageUrl = vision.image_url;
  const aiGeneratedUrls = getAiGeneratedUrls(vision);
  // Image is AI-generated if its URL appears in the notes markers OR if the vision title is the default AI title
  const isAiGenerated = imageUrl && (aiGeneratedUrls.has(imageUrl) || vision.title === "See Me In This Vision");

  const handleDownload = async () => {
    if (!imageUrl) return;
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

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await base44.entities.VisionItem.delete(vision.id);
    onDelete?.(vision.id);
    onClose();
  };

  const handleSetAsFocus = async () => {
    if (!vision?.id || focusSet || !imageUrl) return;
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
          {imageUrl ? (
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
          {(vision.emotional_goal || vision.desired_timeline) && (
            <div className="px-5 py-4 space-y-2">
              {vision.emotional_goal && (
                <p className="text-sm text-foreground/70 italic leading-relaxed">"{vision.emotional_goal}"</p>
              )}
              {vision.desired_timeline && (
                <p className="text-xs text-muted-foreground">Timeline: {vision.desired_timeline}</p>
              )}
            </div>
          )}
        </div>

        {/* Actions footer */}
        <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur px-5 pt-4 space-y-2.5"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>

          {/* Download + Focus */}
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading || !imageUrl}
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

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`w-full py-3 rounded-xl border font-semibold flex items-center justify-center gap-2 transition-colors text-sm ${
              confirmDelete
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border/60 bg-transparent text-muted-foreground hover:border-destructive/40 hover:text-destructive"
            }`}>
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? "Deleting…" : confirmDelete ? "Tap again to confirm delete" : "Delete Vision"}
          </button>

        </div>
      </motion.div>
    </motion.div>
  );
}
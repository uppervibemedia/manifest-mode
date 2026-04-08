import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Upload, Loader2, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { CATEGORIES, getCategoryMeta } from "@/lib/categories";
import { useModalState } from "@/lib/ModalContext";

const TIMELINES = ["3 months", "6 months", "1 year", "2 years", "3+ years"];

export default function VisionUploadModal({ vision, userEmail, onClose, onSave }) {
  const { setActiveFullscreenModal } = useModalState();

  const [form, setForm] = useState({
    title: vision?.title || "",
    category: vision?.category || "wealth",
    secondary_category: vision?.secondary_category || "none",
    emotional_goal: vision?.emotional_goal || "",
    why_i_want_this: vision?.why_i_want_this || "",
    desired_timeline: vision?.desired_timeline || "1 year",
    notes: vision?.notes || "",
    is_priority: vision?.is_priority || false,
  });

  // uploadedUrl is the ONLY source of truth for the image URL saved to DB
  const uploadedUrlRef = useRef(vision?.image_url || "");
  const [uploadedUrl, setUploadedUrl] = useState(vision?.image_url || "");
  const [previewUrl, setPreviewUrl] = useState(vision?.image_url || "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setActiveFullscreenModal("vision-upload");
    return () => setActiveFullscreenModal(null);
  }, [setActiveFullscreenModal]);

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = null;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploadError(null);

    // Clear old uploaded URL
    uploadedUrlRef.current = "";
    setUploadedUrl("");

    // Upload to server right away — no crop step
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedUrlRef.current = file_url;
      setUploadedUrl(file_url);
      // Replace blob preview with real server URL
      setPreviewUrl(file_url);
      URL.revokeObjectURL(localUrl);
    } catch (err) {
      setUploadError("Upload failed. Tap to retry.");
      setPreviewUrl("");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || saving) return;

    // Safety: never save without an uploaded URL when uploading is in progress
    if (uploading) return;

    setSaving(true);

    const imageUrl = uploadedUrlRef.current;

    const data = {
      ...form,
      image_url: imageUrl,
      secondary_category: form.secondary_category || "none",
    };

    if (vision?.id) {
      const saved = await base44.entities.VisionItem.update(vision.id, data);
      onSave(saved || { ...vision, ...data });
    } else {
      const saved = await base44.entities.VisionItem.create({
        ...data,
        user_email: userEmail,
        is_active: true,
        progress: 0,
        action_steps: [],
        proof_images: [],
      });
      onSave(saved);
    }
  };

  const primaryMeta = getCategoryMeta(form.category);
  const canSave = !!form.title && !saving && !uploading;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="w-full max-w-md bg-card rounded-t-3xl overflow-hidden flex flex-col md:rounded-2xl"
        style={{ height: "100dvh", maxHeight: "100dvh" }}
      >
        {/* Header */}
        <div
          className="px-5 pb-4 border-b border-border flex items-start justify-between gap-4 shrink-0"
          style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top, 0px))" }}
        >
          <div className="flex-1 min-w-0">
            <h2 className="font-playfair text-lg font-semibold text-foreground">
              {vision ? "Edit Vision" : "Add to Living Vision Board"}
            </h2>
            <p className="text-xs text-muted-foreground">Bring your future into focus</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-border flex items-center justify-center shrink-0" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* Image Upload */}
          <div className="mb-5">
            <div
              className={`aspect-video rounded-2xl overflow-hidden border-2 border-dashed transition-all ${
                previewUrl ? "border-transparent" : "border-border hover:border-primary/40 cursor-pointer"
              }`}
              onClick={() => !uploading && !previewUrl && fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="relative w-full h-full group">
                  <img src={previewUrl} alt="Vision" className="w-full h-full object-cover pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                  {uploading && (
                    <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-white font-medium">Uploading image…</p>
                      <p className="text-xs text-white/60">Please wait before saving</p>
                    </div>
                  )}

                  {!uploading && uploadedUrl && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400 font-medium">Ready to save</span>
                    </div>
                  )}

                  {!uploading && !uploadError && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-black/60 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Upload className="w-3.5 h-3.5" /> Change
                    </button>
                  )}
                </div>
              ) : uploadError ? (
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-2 text-destructive bg-destructive/10 min-h-[140px] cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <AlertCircle className="w-6 h-6" />
                  <p className="text-xs font-medium">{uploadError}</p>
                </div>
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/20 min-h-[140px] cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-6 h-6" />
                  <p className="text-xs font-medium">Tap to upload your vision image</p>
                  <p className="text-[10px] text-muted-foreground/50">The clearer the image, the stronger the intention</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
              disabled={uploading}
            />
          </div>

          {/* Priority toggle */}
          <div className="flex items-center justify-between glass-card border border-border rounded-xl px-4 py-3 mb-5">
            <div className="flex items-center gap-2">
              <Star className={`w-4 h-4 ${form.is_priority ? "text-primary fill-primary" : "text-muted-foreground"}`} />
              <div>
                <p className="text-sm font-medium text-foreground">Priority Vision</p>
                <p className="text-[10px] text-muted-foreground">Pin this to your daily focus</p>
              </div>
            </div>
            <button
              onClick={() => setForm(p => ({ ...p, is_priority: !p.is_priority }))}
              className={`w-11 h-6 rounded-full transition-all relative ${form.is_priority ? "bg-primary" : "bg-border"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_priority ? "left-5" : "left-0.5"}`} />
            </button>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Vision Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Dream Penthouse in Manhattan"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Primary Category */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Primary Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setForm(p => ({ ...p, category: cat.id }))}
                  className={`py-2.5 px-3 rounded-xl text-left transition-all border ${
                    form.category === cat.id ? "border-primary bg-primary/10" : "bg-background border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm">{cat.icon}</span>
                    <span className={`text-xs font-semibold ${form.category === cat.id ? "text-primary" : "text-foreground"}`}>{cat.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight pl-6">{cat.meaning}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Category */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Secondary Category <span className="text-muted-foreground/50 normal-case">(optional)</span>
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setForm(p => ({ ...p, secondary_category: "none" }))}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  form.secondary_category === "none" ? "bg-primary/10 border-primary text-primary" : "bg-background border-border text-muted-foreground"
                }`}
              >
                None
              </button>
              {CATEGORIES.filter(c => c.id !== form.category).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setForm(p => ({ ...p, secondary_category: cat.id }))}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.secondary_category === cat.id ? "bg-primary/10 border-primary text-primary" : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Emotional Goal */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">How will you feel when you have this?</label>
            <input
              value={form.emotional_goal}
              onChange={e => setForm(p => ({ ...p, emotional_goal: e.target.value }))}
              placeholder={primaryMeta.prompt}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Why I want this */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Why I Want This</label>
            <textarea
              value={form.why_i_want_this}
              onChange={e => setForm(p => ({ ...p, why_i_want_this: e.target.value }))}
              placeholder="What deeper purpose or meaning is behind this vision? Be honest."
              rows={3}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Desired Timeline</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {TIMELINES.map(t => (
                <button
                  key={t}
                  onClick={() => setForm(p => ({ ...p, desired_timeline: t }))}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.desired_timeline === t ? "bg-primary text-background border-primary" : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-4 gold-gradient text-background font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 mb-6"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</>
            ) : uploading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Uploading image…</>
            ) : (
              vision ? "Save Vision" : "Add to Living Vision Board ✦"
            )}
          </button>

        </div>
      </motion.div>
    </motion.div>
  );
}
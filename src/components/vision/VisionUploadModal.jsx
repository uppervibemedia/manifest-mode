import { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Upload, Loader2 } from "lucide-react";

const CATEGORIES = [
  { id: "wealth", label: "💰 Wealth" },
  { id: "body", label: "💪 Body" },
  { id: "love", label: "❤️ Love" },
  { id: "business", label: "🚀 Business" },
  { id: "home", label: "🏡 Home" },
  { id: "lifestyle", label: "✨ Lifestyle" },
  { id: "spiritual", label: "🌙 Spiritual" },
];

const TIMELINES = ["3 months", "6 months", "1 year", "2 years", "3+ years"];

export default function VisionUploadModal({ vision, userEmail, onClose, onSave }) {
  const [form, setForm] = useState({
    title: vision?.title || "",
    category: vision?.category || "wealth",
    emotional_goal: vision?.emotional_goal || "",
    desired_timeline: vision?.desired_timeline || "1 year",
    notes: vision?.notes || "",
    image_url: vision?.image_url || "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, image_url: file_url }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    let saved;
    if (vision) {
      saved = await base44.entities.VisionItem.update(vision.id, form);
    } else {
      saved = await base44.entities.VisionItem.create({ ...form, user_email: userEmail, is_active: true, is_priority: false });
    }
    onSave(saved);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-card rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-playfair text-lg font-semibold">{vision ? "Edit Vision" : "Add Vision"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-border flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image Upload */}
        <label className="block mb-4 cursor-pointer">
          <div className={`aspect-video rounded-xl overflow-hidden border-2 border-dashed transition-colors ${
            form.image_url ? "border-transparent" : "border-border hover:border-primary/40"
          }`}>
            {form.image_url ? (
              <img src={form.image_url} alt="Vision" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30">
                {uploading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : (
                  <><Upload className="w-6 h-6" /><p className="text-xs">Tap to upload image</p></>
                )}
              </div>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
        </label>

        {/* Title */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Vision Title *</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Dream Penthouse in NYC"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50" />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setForm(p => ({ ...p, category: cat.id }))}
                className={`py-2 rounded-xl text-xs font-medium transition-all ${
                  form.category === cat.id
                    ? "bg-primary/20 border border-primary text-primary"
                    : "bg-background border border-border text-muted-foreground"
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Emotional Goal */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">How will you feel?</label>
          <input value={form.emotional_goal} onChange={e => setForm(p => ({ ...p, emotional_goal: e.target.value }))}
            placeholder="e.g. Free, powerful, proud, at peace"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50" />
        </div>

        {/* Timeline */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Desired Timeline</label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TIMELINES.map(t => (
              <button key={t} onClick={() => setForm(p => ({ ...p, desired_timeline: t }))}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  form.desired_timeline === t
                    ? "bg-primary text-background"
                    : "bg-background border border-border text-muted-foreground"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Why do you want this?</label>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="Describe what this vision means to you..."
            rows={3}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none" />
        </div>

        <button onClick={handleSave} disabled={saving || !form.title}
          className="w-full py-4 gold-gradient text-background font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (vision ? "Save Changes" : "Add to Vision Vault")}
        </button>
      </motion.div>
    </motion.div>
  );
}
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, ChevronRight, Lock, Sparkles } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

export default function FirstVision() {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState("wealth");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = await base44.auth.me();
      if (imageUrl) {
        await base44.entities.VisionItem.create({
          user_email: user.email,
          title: `My ${CATEGORIES.find(c => c.id === category)?.label || "Vision"}`,
          category,
          image_url: imageUrl,
          is_active: true,
          is_priority: true,
          progress: 0,
          action_steps: [],
          proof_images: [],
        });
      }
      // Mark onboarding complete
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles[0]) {
        await base44.entities.UserProfile.update(profiles[0].id, { onboarding_completed: true });
      }
    } catch (e) {
      console.error(e);
    }
    navigate("/daily-shift");
  };

  const handleSkip = async () => {
    try {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles[0]) {
        await base44.entities.UserProfile.update(profiles[0].id, { onboarding_completed: true });
      }
    } catch (e) {
      console.error(e);
    }
    navigate("/daily-shift");
  };

  const topCategories = CATEGORIES.filter(c =>
    ["wealth", "body", "love", "business", "lifestyle"].includes(c.id)
  );

  return (
    <div className="min-h-screen bg-background flex flex-col px-5 py-10 max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className={`flex-1 h-1 rounded-full ${n <= 3 ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>

      <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Step 3 of 4</p>
      <h1 className="font-playfair text-2xl font-semibold mb-2">Add your first vision</h1>
      <p className="text-sm text-muted-foreground mb-6">Upload one image of the life you're stepping into. Make it real.</p>

      {/* Category selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {topCategories.map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              category === cat.id
                ? "bg-primary text-background border-primary"
                : "bg-card border-border text-muted-foreground"
            }`}>
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Upload zone */}
      <label className="block mb-5 cursor-pointer">
        <div className={`rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
          imageUrl ? "border-transparent" : "border-border hover:border-primary/40"
        }`} style={{ aspectRatio: "4/3" }}>
          {imageUrl ? (
            <div className="relative w-full h-full">
              <img src={imageUrl} alt="Vision" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <p className="absolute bottom-3 left-4 text-[10px] text-white/70">Tap to change</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/10 min-h-[200px]">
              {uploading
                ? <Loader2 className="w-7 h-7 animate-spin text-primary" />
                : <>
                  <Upload className="w-7 h-7" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Upload your vision image</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">The clearer the image, the stronger the intention</p>
                  </div>
                </>
              }
            </div>
          )}
        </div>
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>

      {/* Premium teaser */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card border border-primary/20 rounded-xl p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-lg">🪞</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-semibold text-foreground">See Me In This Vision</p>
            <span className="text-[9px] uppercase tracking-widest font-bold text-background bg-primary rounded-full px-1.5 py-0.5">Premium</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug">Place yourself inside your dream life with AI image generation</p>
        </div>
        <Lock className="w-4 h-4 text-muted-foreground/40 shrink-0" />
      </motion.div>

      <div className="space-y-3">
        <button
          onClick={handleSave}
          disabled={!imageUrl || saving}
          className="w-full py-4 gold-gradient text-background font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
          {saving
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <>Add to my Vision Board <ChevronRight className="w-4 h-4" /></>
          }
        </button>
        <button onClick={handleSkip}
          className="w-full py-3 text-sm text-muted-foreground">
          Skip for now
        </button>
      </div>
    </div>
  );
}
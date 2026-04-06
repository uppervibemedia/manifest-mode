import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Sparkles, RefreshCw, Download, Check, Loader2, Star, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useModalState } from "@/lib/ModalContext";

const SCENE_OPTIONS = [
  { id: "standing_front", label: "Standing in front", icon: "🧍" },
  { id: "inside", label: "Inside / sitting in it", icon: "🪑" },
  { id: "beside", label: "Beside it", icon: "👤" },
  { id: "walking_into", label: "Walking into it", icon: "🚶" },
];

const SCENE_PROMPTS = {
  standing_front: "standing confidently in front of",
  inside: "sitting comfortably inside",
  beside: "standing proudly beside",
  walking_into: "walking toward and entering",
};

function buildPrompt(sceneOption, visionTitle, category) {
  const sceneDesc = SCENE_PROMPTS[sceneOption] || "standing in front of";
  const categoryContext = {
    wealth: "a stunning luxury scene with perfect lighting",
    home: "a breathtaking architectural setting with warm golden-hour light",
    body: "an aspirational, health-focused environment",
    love: "a warm, romantic, and beautiful atmosphere",
    business: "a high-end professional environment",
    lifestyle: "an aspirational lifestyle scene radiating success and freedom",
    spiritual: "a serene, peaceful, and transcendent environment",
  }[category] || "a beautiful aspirational scene";

  return `Create a photorealistic, aspirational portrait of a person ${sceneDesc} ${visionTitle || "their dream vision"}. The scene should feel ${categoryContext}. The composition should be cinematic, with rich colors, perfect natural lighting, and an emotionally powerful mood that makes the viewer feel they have already achieved this. The image should look like a genuine photograph, not a composite. Premium, magazine-quality, aspirational lifestyle photography.`;
}

function UploadZone({ label, hint, onFile, preview, icon }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all border-2 border-dashed ${
        dragging ? "border-primary bg-primary/10" : preview ? "border-primary/30" : "border-border hover:border-primary/40"
      }`}
      style={{ aspectRatio: "1/1" }}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />

      {preview ? (
        <>
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="text-center text-white">
              <Upload className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-medium">Change</p>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
          <span className="text-3xl mb-2">{icon}</span>
          <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{hint}</p>
        </div>
      )}
    </div>
  );
}

export default function SeeMeModal({ vision, userEmail, onClose, onSave }) {
  const { setActiveFullscreenModal } = useModalState();
  const [visionFile, setVisionFile] = useState(null);
  const [selfFile, setSelfFile] = useState(null);
  const [visionPreview, setVisionPreview] = useState(vision?.image_url || null);
  const [selfPreview, setSelfPreview] = useState(null);
  const [scene, setScene] = useState("standing_front");
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [setAsFocus, setSetAsFocus] = useState(false);
  const [savedFileUrl, setSavedFileUrl] = useState(null);
  const [step, setStep] = useState(1); // 1=setup, 2=result

  // Hide bottom nav when modal opens
  useEffect(() => {
    setActiveFullscreenModal("see-me-vision");
    return () => setActiveFullscreenModal(null);
  }, [setActiveFullscreenModal]);

  const handleVisionFile = (file) => {
    setVisionFile(file);
    setVisionPreview(URL.createObjectURL(file));
  };

  const handleSelfFile = (file) => {
    setSelfFile(file);
    setSelfPreview(URL.createObjectURL(file));
  };

  const canGenerate = (visionPreview || visionFile) && selfFile;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setResult(null);

    // Upload images for AI reference
    const uploads = [];
    if (visionFile) {
      const res = await base44.integrations.Core.UploadFile({ file: visionFile });
      uploads.push(res.file_url);
    } else if (visionPreview) {
      uploads.push(visionPreview);
    }
    if (selfFile) {
      const res = await base44.integrations.Core.UploadFile({ file: selfFile });
      uploads.push(res.file_url);
    }

    const prompt = buildPrompt(scene, vision?.title, vision?.category);

    const generated = await base44.integrations.Core.GenerateImage({
      prompt,
      existing_image_urls: uploads,
    });

    setResult(generated.url);
    setStep(2);
    setGenerating(false);
  };

  // Upload once and reuse the permanent URL
  const uploadResult = async () => {
    if (savedFileUrl) return savedFileUrl;
    const blob = await fetch(result).then(r => r.blob());
    const file = new File([blob], "see-me-vision.jpg", { type: "image/jpeg" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setSavedFileUrl(file_url);
    return file_url;
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);

    // Optimistically mark as saved right away for snappy feel
    setSaved(true);
    setSaving(false);

    const file_url = await uploadResult();

    if (vision?.id) {
      const currentProof = vision.proof_images || [];
      const aiNotes = vision.notes ? vision.notes : "";
      const aiMarker = `[ai_generated:${file_url}]`;
      const notesUpdated = aiNotes.includes(aiMarker) ? aiNotes : `${aiNotes}\n${aiMarker}`.trim();
      base44.entities.VisionItem.update(vision.id, {
        proof_images: [...currentProof, file_url],
        notes: notesUpdated,
      }).then(() => {
        onSave && onSave({ ...vision, proof_images: [...(vision.proof_images || []), file_url], notes: notesUpdated });
      });
    } else {
      base44.entities.VisionItem.create({
        user_email: userEmail,
        title: "See Me In This Vision",
        category: "lifestyle",
        image_url: file_url,
        notes: `[ai_generated:${file_url}]`,
        is_active: true,
        progress: 0,
      }).then((newVision) => {
        onSave && onSave(newVision);
      });
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    const blob = await fetch(result).then(r => r.blob());
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "manifest-mode-vision.jpg";
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  const handleSetAsFocus = async () => {
    if (!vision?.id || setAsFocus) return;
    const file_url = await uploadResult();
    await base44.entities.VisionItem.update(vision.id, {
      image_url: file_url,
      is_priority: true,
    });
    onSave && onSave({ ...vision, image_url: file_url, is_priority: true });
    setSetAsFocus(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-end justify-center"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-t-3xl overflow-hidden flex flex-col h-screen md:h-auto md:rounded-2xl"
        style={{ maxHeight: "100dvh" }}
      >
        {/* Header */}
        <div className="px-5 pb-4 border-b border-border flex items-center justify-between shrink-0"
          style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top, 0px))" }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-playfair text-lg font-semibold gold-text">See Me In This Vision</h2>
              <span className="text-[9px] uppercase tracking-widest font-bold text-background bg-primary rounded-full px-1.5 py-0.5">Premium</span>
            </div>
            <p className="text-xs text-muted-foreground">Place yourself inside your dream life</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-border flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* STEP 1 — Setup */}
            {step === 1 && (
              <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 py-5">

                {/* Upload row */}
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Step 1 — Upload Images</p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <UploadZone
                      label="Vision Image"
                      hint="Dream car, house, vacation, lifestyle…"
                      icon="🌟"
                      onFile={handleVisionFile}
                      preview={visionPreview}
                    />
                    <p className="text-[10px] text-muted-foreground text-center mt-1.5">The scene you want</p>
                  </div>
                  <div>
                    <UploadZone
                      label="Your Photo"
                      hint="Clear face, solo, good lighting"
                      icon="🪞"
                      onFile={handleSelfFile}
                      preview={selfPreview}
                    />
                    <p className="text-[10px] text-muted-foreground text-center mt-1.5">A clear photo of you</p>
                  </div>
                </div>

                {/* Best results tip */}
                <div className="glass-card border border-primary/15 rounded-xl p-3 mb-5">
                  <p className="text-[10px] text-primary font-semibold uppercase tracking-widest mb-1.5">Best Results</p>
                  <ul className="space-y-1">
                    {["Use a high-quality vision image with clear subject", "Your photo: solo, well-lit, facing forward", "Avoid blurry or dark images"].map((tip, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-primary text-[10px] mt-0.5">✦</span>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{tip}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Scene selection */}
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Step 2 — Choose Your Scene</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {SCENE_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => setScene(opt.id)}
                      className={`rounded-xl p-3 text-left border transition-all ${
                        scene === opt.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-primary/30"
                      }`}>
                      <span className="text-xl block mb-1">{opt.icon}</span>
                      <p className="text-xs font-semibold text-foreground leading-tight">{opt.label}</p>
                    </button>
                  ))}
                </div>


              </motion.div>
            )}

            {/* STEP 2 — Result */}
            {step === 2 && result && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 py-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Your Vision, Made Real</p>

                {/* Result image */}
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 20 }}
                  className="rounded-2xl overflow-hidden mb-4 border border-primary/25 glow-gold">
                  <img src={result} alt="Your vision" className="w-full h-auto" />
                </motion.div>

                {/* Reference row */}
                <div className="flex gap-2 mb-5">
                 {visionPreview && (
                   <div className="flex-1 rounded-xl overflow-hidden border border-border" style={{ aspectRatio: "1/1" }}>
                     <img src={visionPreview} alt="Vision" className="w-full h-full object-cover opacity-60" />
                   </div>
                 )}
                 <div className="flex items-center justify-center text-muted-foreground text-lg">+</div>
                 {selfPreview && (
                   <div className="flex-1 rounded-xl overflow-hidden border border-border" style={{ aspectRatio: "1/1" }}>
                     <img src={selfPreview} alt="You" className="w-full h-full object-cover opacity-60" />
                   </div>
                 )}
                 <div className="flex items-center justify-center text-muted-foreground text-lg">→</div>
                 <div className="flex-1 rounded-xl overflow-hidden border border-primary/30" style={{ aspectRatio: "1/1" }}>
                   <img src={result} alt="Result" className="w-full h-full object-cover" />
                 </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Action buttons footer — fixed above tab bar */}
        {step === 1 && (
          <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur px-5 py-4 space-y-2">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="w-full py-4 gold-gradient text-background font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-30 text-sm"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating your vision…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate — See Me In This Vision
                </>
              )}
            </button>
            {generating && (
              <p className="text-[10px] text-muted-foreground/60 text-center">This takes about 10–15 seconds</p>
            )}
          </div>
        )}

        {step === 2 && result && (
          <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur px-5 py-4 space-y-2.5">

            {/* Primary: Save to Vision Vault */}
            {saved ? (
              <div className="w-full py-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Saved to Vision Vault ✦</span>
              </div>
            ) : (
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3.5 gold-gradient text-background font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                {saving ? "Saving…" : "Save to Vision Vault"}
              </button>
            )}

            {/* Secondary row: Download + Set as Focus */}
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 py-3 rounded-xl border border-border bg-background text-foreground font-semibold flex items-center justify-center gap-2 hover:border-primary/40 transition-colors text-sm disabled:opacity-50">
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading ? "…" : "Download"}
              </button>

              {vision?.id && (
                <button
                  onClick={handleSetAsFocus}
                  disabled={setAsFocus || saving}
                  className={`flex-1 py-3 rounded-xl border font-semibold flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-50 ${
                    setAsFocus
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/40"
                  }`}>
                  {setAsFocus ? <Check className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                  {setAsFocus ? "Set ✦" : "Set as Focus"}
                </button>
              )}
            </div>

            {/* Tertiary: Regenerate */}
            <button
              onClick={() => { setStep(1); setResult(null); setSaved(false); setSetAsFocus(false); setSavedFileUrl(null); }}
              className="w-full py-3 rounded-xl border border-border/60 text-muted-foreground font-medium flex items-center justify-center gap-2 hover:border-primary/20 transition-colors text-sm">
              <RefreshCw className="w-4 h-4" /> Regenerate
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
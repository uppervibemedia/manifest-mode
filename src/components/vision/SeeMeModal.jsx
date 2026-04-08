import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Sparkles, RefreshCw, Download, Check, Loader2, Star, Image as ImageIcon, Crop, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useModalState } from "@/lib/ModalContext";
import ImageCropTool from "@/components/vision/ImageCropTool";

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

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1: FILE ACQUISITION — UploadZone Component
// ═══════════════════════════════════════════════════════════════════════════════

function UploadZone({ boxId, label, hint, boxState, onFileSelected, onImageLoaded, onCropStart, uploading }) {
  const inputRef = useRef();

  const handleChange = (e) => {
    console.log(`[${boxId}] Upload box clicked - file picker opened`);
    const file = e.target.files?.[0];
    
    if (!file) {
      console.log(`[${boxId}] No file selected or cancelled`);
      return;
    }
    
    console.log(`[${boxId}] File picker returned file:`, file.name, file.size, file.type);
    console.log(`[${boxId}] File captured from event immediately`);
    
    // CRITICAL: Call handler with file immediately while event is active
    onFileSelected(boxId, file);
    
    // Reset input AFTER file is passed to handler so same file can be selected again
    console.log(`[${boxId}] Resetting input value to allow re-selection`);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      console.log(`[${boxId}] File dropped:`, file.name);
      onFileSelected(boxId, file);
    }
  };

  const preview = boxState.croppedUrl || boxState.sourceUrl;
  const showLoading = boxState.status === 'loading-preview' && !preview;

  return (
    <label className="block cursor-pointer">
      <div
        className={`aspect-square rounded-2xl overflow-hidden border-2 border-dashed transition-all ${
          preview ? "border-transparent" : "border-border hover:border-primary/40"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative w-full h-full group" onClick={(e) => e.stopPropagation()}>
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-cover pointer-events-none"
              onLoad={() => onImageLoaded(boxId)}
              onError={() => console.error(`[${boxId}] Preview image failed to load`)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(`[${boxId}] Crop button clicked`);
                  onCropStart(boxId);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-background rounded-lg"
              >
                <Crop className="w-3.5 h-3.5" />
                Crop
              </button>
            </div>
            <p className="absolute bottom-2 left-3 text-[10px] text-white/70">Tap to change</p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/20 min-h-[140px]">
            {showLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <p className="text-xs">{label}</p>
                <p className="text-[10px] text-muted-foreground/50">{hint}</p>
              </>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={false}
      />
    </label>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SeeMeModal({ vision, userEmail, onClose, onSave }) {
  const { setActiveFullscreenModal } = useModalState();

  // ───────────────────────────────────────────────────────────────────────────
  // STATE: Separate objects for each box (PHASE 1, 2, 3)
  // ───────────────────────────────────────────────────────────────────────────
  
  const [visionBox, setVisionBox] = useState({
    sourceFile: null,      // Raw selected file
    sourceUrl: null,       // Object URL preview
    croppedFile: null,     // Output from cropper
    croppedUrl: null,      // Data URL from cropper
    isImageLoaded: false,  // Preview img tag fired onLoad
    status: 'idle',        // idle | uploading | preview-ready | crop-open | complete | error
    error: null,
  });

  const [selfBox, setSelfBox] = useState({
    sourceFile: null,
    sourceUrl: null,
    croppedFile: null,
    croppedUrl: null,
    isImageLoaded: false,
    status: 'idle',
    error: null,
  });

  // Global crop session state
  const [activeCropBoxId, setActiveCropBoxId] = useState(null); // 'vision' | 'self' | null
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Generation state
  const [scene, setScene] = useState("standing_front");
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [setAsFocus, setSetAsFocus] = useState(false);
  const [savedFileUrl, setSavedFileUrl] = useState(null);
  const [step, setStep] = useState(1); // 1=setup, 2=result

  useEffect(() => {
    setActiveFullscreenModal("see-me-vision");
    return () => setActiveFullscreenModal(null);
  }, [setActiveFullscreenModal]);

  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 1: FILE ACQUISITION
  // ───────────────────────────────────────────────────────────────────────────

  const handleFileSelected = (boxId, file) => {
    console.log(`[${boxId}] PHASE 1 START: File acquisition - storing immediately`);
    
    // Create object URL for preview immediately
    console.log(`[${boxId}] Creating preview URL from selected file`);
    const previewUrl = URL.createObjectURL(file);
    console.log(`[${boxId}] Preview URL created:`, previewUrl);

    const newBoxState = {
      sourceFile: file,
      sourceUrl: previewUrl,
      croppedFile: null,
      croppedUrl: null,
      isImageLoaded: false,
      status: 'loading-preview',  // Preload in progress
      error: null,
    };

    if (boxId === 'vision') {
      console.log(`[${boxId}] File stored in vision box state`);
      setVisionBox(newBoxState);
    } else if (boxId === 'self') {
      console.log(`[${boxId}] File stored in self box state`);
      setSelfBox(newBoxState);
    }

    console.log(`[${boxId}] File and preview URL ready, waiting for image preload`);
  };

  const handleImageLoaded = (boxId) => {
    console.log(`[${boxId}] Image preload success - image is confirmed and usable`);
    
    if (boxId === 'vision') {
      console.log(`[vision] Marking as preview-ready - now can proceed to crop or save`);
      setVisionBox(prev => ({ ...prev, isImageLoaded: true, status: 'preview-ready' }));
    } else if (boxId === 'self') {
      console.log(`[self] Marking as preview-ready - now can proceed to crop or save`);
      setSelfBox(prev => ({ ...prev, isImageLoaded: true, status: 'preview-ready' }));
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 2: CROP SESSION
  // ───────────────────────────────────────────────────────────────────────────

  const handleCropStart = (boxId) => {
    console.log(`[${boxId}] Crop button clicked - checking file readiness`);
    const boxState = boxId === 'vision' ? visionBox : selfBox;
    
    if (!boxState.sourceFile) {
      console.error(`[${boxId}] CRITICAL: Cannot start crop - sourceFile is null or missing`);
      if (boxId === 'vision') {
        setVisionBox(prev => ({ ...prev, error: 'File missing. Please re-upload.' }));
      } else {
        setSelfBox(prev => ({ ...prev, error: 'File missing. Please re-upload.' }));
      }
      return;
    }
    
    if (!boxState.sourceUrl) {
      console.error(`[${boxId}] CRITICAL: Cannot start crop - sourceUrl is null or missing`);
      if (boxId === 'vision') {
        setVisionBox(prev => ({ ...prev, error: 'Preview URL missing. Please re-upload.' }));
      } else {
        setSelfBox(prev => ({ ...prev, error: 'Preview URL missing. Please re-upload.' }));
      }
      return;
    }
    
    if (!boxState.isImageLoaded) {
      console.error(`[${boxId}] Cannot start crop: image preload not yet complete`);
      if (boxId === 'vision') {
        setVisionBox(prev => ({ ...prev, error: 'Image still loading. Please wait.' }));
      } else {
        setSelfBox(prev => ({ ...prev, error: 'Image still loading. Please wait.' }));
      }
      return;
    }

    console.log(`[${boxId}] PHASE 2 START: All checks passed, opening crop modal`);
    console.log(`[${boxId}] sourceFile exists: yes (${boxState.sourceFile.name})`);
    console.log(`[${boxId}] sourceUrl exists: yes`);
    console.log(`[${boxId}] isImageLoaded: yes`);
    setActiveCropBoxId(boxId);
    setIsCropModalOpen(true);
    console.log(`[${boxId}] Crop modal opened`);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 3: COMMIT (Crop Done → Save Output)
  // ───────────────────────────────────────────────────────────────────────────

  const handleCropSave = async (croppedUrl, metadata) => {
    if (!activeCropBoxId) {
      console.error('CRITICAL: handleCropSave called but activeCropBoxId is null');
      return;
    }

    console.log(`[${activeCropBoxId}] PHASE 3 START: Committing cropped output`);

    try {
      // Fetch cropped blob from data URL
      const blob = await fetch(croppedUrl).then(r => r.blob());
      const croppedFile = new File([blob], `${activeCropBoxId}-cropped.jpg`, { type: "image/jpeg" });

      console.log(`[${activeCropBoxId}] Cropped file created:`, croppedFile.size, 'bytes');
      console.log(`[${activeCropBoxId}] Crop saved - updating box state`);

      // Update the correct box
      if (activeCropBoxId === 'vision') {
        setVisionBox(prev => ({
          ...prev,
          croppedFile,
          croppedUrl,
          status: 'complete',
        }));
        console.log(`[vision] Cropped output committed to vision box`);
      } else if (activeCropBoxId === 'self') {
        setSelfBox(prev => ({
          ...prev,
          croppedFile,
          croppedUrl,
          status: 'complete',
        }));
        console.log(`[self] Cropped output committed to self box`);
      }

      console.log(`[${activeCropBoxId}] PHASE 3 COMPLETE: Crop process finished, closing modal`);
      setIsCropModalOpen(false);
      setActiveCropBoxId(null);
    } catch (error) {
      console.error(`[${activeCropBoxId}] PHASE 3 FAILED - Crop processing error:`, error);
      
      // FALLBACK RULE: Save original if crop fails - first upload must never fail
      console.log(`[${activeCropBoxId}] FALLBACK: Saving original image to preserve first upload`);
      const boxState = activeCropBoxId === 'vision' ? visionBox : selfBox;
      
      if (activeCropBoxId === 'vision') {
        setVisionBox(prev => ({
          ...prev,
          croppedFile: prev.sourceFile,
          croppedUrl: prev.sourceUrl,
          status: 'complete',
          error: `Crop processing error - saved original. You can retry crop later.`,
        }));
      } else if (activeCropBoxId === 'self') {
        setSelfBox(prev => ({
          ...prev,
          croppedFile: prev.sourceFile,
          croppedUrl: prev.sourceUrl,
          status: 'complete',
          error: `Crop processing error - saved original. You can retry crop later.`,
        }));
      }

      console.log(`[${activeCropBoxId}] Original image saved as fallback - upload will still proceed`);
      setIsCropModalOpen(false);
      setActiveCropBoxId(null);
    }
  };

  const handleCropCancel = () => {
    console.log(`[${activeCropBoxId}] Crop cancelled, keeping original`);
    setIsCropModalOpen(false);
    setActiveCropBoxId(null);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // GENERATION & SAVE
  // ───────────────────────────────────────────────────────────────────────────

  const canGenerate = visionBox.status === 'preview-ready' && selfBox.status === 'preview-ready';

  const handleGenerate = async () => {
    if (!canGenerate) {
      console.error('Generate button called but files not ready');
      return;
    }
    
    console.log('[generate] Starting image generation flow');
    setGenerating(true);
    setResult(null);

    const uploads = [];
    
    console.log('[generate] Uploading vision image - using cropped if available');
    // Use cropped if available, else source - both should be available at this point
    if (visionBox.croppedFile) {
      console.log('[generate] Vision: uploading cropped file');
      const res = await base44.integrations.Core.UploadFile({ file: visionBox.croppedFile });
      uploads.push(res.file_url);
    } else if (visionBox.sourceFile) {
      console.log('[generate] Vision: uploading original file');
      const res = await base44.integrations.Core.UploadFile({ file: visionBox.sourceFile });
      uploads.push(res.file_url);
    }

    console.log('[generate] Uploading self image - using cropped if available');
    if (selfBox.croppedFile) {
      console.log('[generate] Self: uploading cropped file');
      const res = await base44.integrations.Core.UploadFile({ file: selfBox.croppedFile });
      uploads.push(res.file_url);
    } else if (selfBox.sourceFile) {
      console.log('[generate] Self: uploading original file');
      const res = await base44.integrations.Core.UploadFile({ file: selfBox.sourceFile });
      uploads.push(res.file_url);
    }

    console.log('[generate] Both files uploaded, calling AI image generation');
    const prompt = buildPrompt(scene, vision?.title, vision?.category);
    const generated = await base44.integrations.Core.GenerateImage({
      prompt,
      existing_image_urls: uploads,
    });

    console.log('[generate] AI generation complete, displaying result');
    setResult(generated.url);
    setStep(2);
    setGenerating(false);
  };

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
    <>
      {isCropModalOpen && activeCropBoxId && createPortal(
        <ImageCropTool
          imageUrl={activeCropBoxId === 'vision' ? visionBox.sourceUrl : selfBox.sourceUrl}
          onSave={handleCropSave}
          onCancel={handleCropCancel}
        />,
        document.body
      )}

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
          className="w-full max-w-md bg-card rounded-t-3xl overflow-hidden flex flex-col md:h-auto md:rounded-2xl"
          style={{ height: "100dvh", maxHeight: "100dvh" }}
        >
          {/* Header */}
          <div
            className="px-5 pb-4 border-b border-border flex items-start justify-between gap-4 shrink-0"
            style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top, 0px))" }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <h2 className="font-playfair text-lg font-semibold gold-text">See Me In This Vision</h2>
                <span className="text-[9px] uppercase tracking-widest font-bold text-foreground bg-primary/15 border border-primary/30 rounded-full px-1.5 py-0.5 shrink-0">
                  Premium Only
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Place yourself inside your dream life</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-border flex items-center justify-center shrink-0 flex-none touch-target"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* STEP 1 — Setup */}
              {step === 1 && (
                <motion.div
                  key="setup"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 py-5"
                >
                  {/* Upload row */}
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                    Step 1 — Upload Images
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div>
                      <UploadZone
                        boxId="vision"
                        label="Vision Image"
                        hint="Dream car, house, vacation, lifestyle…"
                        boxState={visionBox}
                        onFileSelected={handleFileSelected}
                        onImageLoaded={handleImageLoaded}
                        onCropStart={handleCropStart}
                        uploading={false}
                      />
                      <p className="text-[10px] text-muted-foreground text-center mt-1.5">The scene you want</p>
                      {visionBox.error && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-destructive/80">
                          <AlertCircle className="w-3 h-3" />
                          {visionBox.error}
                        </div>
                      )}
                    </div>
                    <div>
                      <UploadZone
                        boxId="self"
                        label="Your Photo"
                        hint="Clear face, solo, good lighting"
                        boxState={selfBox}
                        onFileSelected={handleFileSelected}
                        onImageLoaded={handleImageLoaded}
                        onCropStart={handleCropStart}
                        uploading={false}
                      />
                      <p className="text-[10px] text-muted-foreground text-center mt-1.5">A clear photo of you</p>
                      {selfBox.error && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-destructive/80">
                          <AlertCircle className="w-3 h-3" />
                          {selfBox.error}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Best results tip */}
                  <div className="glass-card border border-primary/15 rounded-xl p-3 mb-5">
                    <p className="text-[10px] text-primary font-semibold uppercase tracking-widest mb-1.5">
                      Best Results
                    </p>
                    <ul className="space-y-1">
                      {[
                        "Use a high-quality vision image with clear subject",
                        "Your photo: solo, well-lit, facing forward",
                        "Avoid blurry or dark images",
                      ].map((tip, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-primary text-[10px] mt-0.5">✦</span>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{tip}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Scene selection */}
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                    Step 2 — Choose Your Scene
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {SCENE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setScene(opt.id)}
                        className={`rounded-xl p-3 text-left border transition-all ${
                          scene === opt.id ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/30"
                        }`}
                      >
                        <span className="text-xl block mb-1">{opt.icon}</span>
                        <p className="text-xs font-semibold text-foreground leading-tight">{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 2 — Result */}
              {step === 2 && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 py-5"
                >
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                    Your Vision, Made Real
                  </p>

                  {/* Result image */}
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="rounded-2xl overflow-hidden mb-4 border border-primary/25 glow-gold"
                  >
                    <img src={result} alt="Your vision" className="w-full h-auto" />
                  </motion.div>

                  {/* Reference row */}
                  <div className="flex gap-2 mb-5">
                    {(visionBox.croppedUrl || visionBox.sourceUrl) && (
                      <div className="flex-1 rounded-xl overflow-hidden border border-border" style={{ aspectRatio: "1/1" }}>
                        <img src={visionBox.croppedUrl || visionBox.sourceUrl} alt="Vision" className="w-full h-full object-cover opacity-60" />
                      </div>
                    )}
                    <div className="flex items-center justify-center text-muted-foreground text-lg">+</div>
                    {(selfBox.croppedUrl || selfBox.sourceUrl) && (
                      <div className="flex-1 rounded-xl overflow-hidden border border-border" style={{ aspectRatio: "1/1" }}>
                        <img src={selfBox.croppedUrl || selfBox.sourceUrl} alt="You" className="w-full h-full object-cover opacity-60" />
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

          {/* Action buttons footer */}
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
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3.5 gold-gradient text-background font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                  {saving ? "Saving…" : "Save to Vision Vault"}
                </button>
              )}

              {/* Secondary row: Download + Set as Focus */}
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex-1 py-3 rounded-xl border border-border bg-background text-foreground font-semibold flex items-center justify-center gap-2 hover:border-primary/40 transition-colors text-sm disabled:opacity-50"
                >
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
                    }`}
                  >
                    {setAsFocus ? <Check className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    {setAsFocus ? "Set ✦" : "Set as Focus"}
                  </button>
                )}
              </div>

              {/* Tertiary: Regenerate */}
              <button
                onClick={() => {
                  setStep(1);
                  setResult(null);
                  setSaved(false);
                  setSetAsFocus(false);
                  setSavedFileUrl(null);
                }}
                className="w-full py-3 rounded-xl border border-border/60 text-muted-foreground font-medium flex items-center justify-center gap-2 hover:border-primary/20 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" /> Regenerate
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
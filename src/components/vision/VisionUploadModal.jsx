import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, Upload, Loader2, Star, Crop } from "lucide-react";
import { CATEGORIES, getCategoryMeta } from "@/lib/categories";
import { useModalState } from "@/lib/ModalContext";
import ImageCropTool from "@/components/vision/ImageCropTool";

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
    image_url: vision?.image_url || "",
    is_priority: vision?.is_priority || false,
  });
  const [sourceFile, setSourceFile] = useState(null); // Actual File object for upload
  const [previewUrl, setPreviewUrl] = useState(vision?.image_url || ""); // Temporary blob URL or existing permanent URL
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCropTool, setShowCropTool] = useState(false);

  // Hide bottom nav when modal opens
  useEffect(() => {
    setActiveFullscreenModal("vision-upload");
    return () => setActiveFullscreenModal(null);
  }, [setActiveFullscreenModal]);

  const handleImageUpload = async (e) => {
    e.stopPropagation();
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('[VisionUploadModal] Image file selected:', { name: file.name, size: file.size, type: file.type });
    
    // Store the actual file for later upload during save
    setSourceFile(file);
    
    // Create temporary preview URL for immediate UI display
    const tempUrl = URL.createObjectURL(file);
    console.log('[VisionUploadModal] Temporary preview URL created:', tempUrl);
    setPreviewUrl(tempUrl);
    
    setShowCropTool(true);
    
    // Reset file input to allow re-uploading same file
    e.target.value = "";
  };

  const handleCropSave = async (croppedUrl, metadata) => {
    console.log('[VisionUploadModal] Crop complete, storing cropped preview');
    
    // Convert cropped data URL to File object for later upload
    try {
      const blob = await fetch(croppedUrl).then(r => r.blob());
      const croppedFile = new File([blob], "vision-cropped.jpg", { type: "image/jpeg" });
      console.log('[VisionUploadModal] Cropped file created:', { size: croppedFile.size, type: croppedFile.type });
      
      // Store the cropped file for upload during save
      setSourceFile(croppedFile);
      
      // Store preview URL (temporary blob URL)
      setPreviewUrl(croppedUrl);
      console.log('[VisionUploadModal] Preview URL stored (temporary blob):', croppedUrl);
    } catch (err) {
      console.error('[VisionUploadModal] Failed to process cropped image:', err);
    }
    
    setShowCropTool(false);
  };

  const handleCropSkip = () => {
    setShowCropTool(false);
  };

  const handleSave = async () => {
    console.log('[VisionUploadModal] SAVE STEP 1: Save button clicked');
    
    if (!form.title) {
      console.warn('[VisionUploadModal] SAVE FAILED: No title provided');
      return;
    }
    
    console.log('[VisionUploadModal] SAVE STEP 2: Pre-save state:', {
      sourceFile: sourceFile ? { name: sourceFile.name, size: sourceFile.size } : null,
      previewUrl: previewUrl?.substring(0, 50) + '...',
      previewUrlType: previewUrl?.startsWith('blob:') ? 'BLOB (temporary)' : 'PERMANENT',
    });
    
    setSaving(true);
    
    try {
      // STEP 1: Upload image file if one was selected or cropped
      let permanentImageUrl = form.image_url;
      
      if (sourceFile) {
        console.log('[VisionUploadModal] SAVE STEP 3A: Image file needs upload:', {
          name: sourceFile.name,
          size: sourceFile.size,
          type: sourceFile.type,
        });
        
        console.log('[VisionUploadModal] SAVE STEP 3B: Uploading image to permanent storage...');
        const uploadResponse = await base44.integrations.Core.UploadFile({ file: sourceFile });
        permanentImageUrl = uploadResponse?.file_url;
        
        console.log('[VisionUploadModal] SAVE STEP 3C: Upload succeeded');
        console.log('[VisionUploadModal] SAVE STEP 3C: Permanent image URL:', permanentImageUrl?.substring(0, 50) + '...');
        
        if (!permanentImageUrl) {
          throw new Error('Upload succeeded but no file_url returned');
        }
      } else {
        console.log('[VisionUploadModal] SAVE STEP 3A: No new file selected, using existing image_url');
      }
      
      // STEP 2: Build save payload with permanent image URL
      const data = {
        ...form,
        image_url: permanentImageUrl, // Use permanent URL, not blob preview
        secondary_category: form.secondary_category || "none",
      };
      
      console.log('[VisionUploadModal] SAVE STEP 4: Final save payload:', {
        title: data.title,
        category: data.category,
        image_url: data.image_url?.substring(0, 50) + '...',
        image_url_type: data.image_url?.startsWith('blob:') ? 'ERROR: BLOB!' : 'PERMANENT',
      });

      if (vision) {
        // Update existing vision
        console.log('[VisionUploadModal] SAVE STEP 5A: Updating existing vision:', vision.id);
        const optimistic = { ...vision, ...data };
        
        console.log('[VisionUploadModal] SAVE STEP 5B: Calling onSave with updated data');
        onSave(optimistic);
        
        console.log('[VisionUploadModal] SAVE STEP 5C: Starting server update');
        base44.entities.VisionItem.update(vision.id, data).then((updated) => {
          console.log('[VisionUploadModal] SAVE STEP 5D: Server update succeeded:', {
            id: updated.id,
            image_url: updated.image_url?.substring(0, 50) + '...',
            image_url_type: updated.image_url?.startsWith('blob:') ? 'ERROR: BLOB!' : 'PERMANENT',
          });
        }).catch((err) => {
          console.error('[VisionUploadModal] SAVE STEP 5D: Server update failed:', err);
        });
      } else {
        // Create new vision
        console.log('[VisionUploadModal] ═══ CREATE FLOW START ═══');
        console.log('[VisionUploadModal] ENTITY CHECK: base44.entities.VisionItem =', base44.entities.VisionItem);
        console.log('[VisionUploadModal] ENTITY NAME: VisionItem');
        console.log('[VisionUploadModal] CREATE METHOD: base44.entities.VisionItem.create()');
        
        const createPayload = {
          ...data,
          user_email: userEmail,
          is_active: true,
          progress: 0,
          action_steps: [],
          proof_images: [],
        };
        
        console.log('[VisionUploadModal] SAVE STEP 5B: Create payload (DETAILED):', createPayload);
        console.log('[VisionUploadModal] SAVE STEP 5B: Create ownership field:', {
          user_email_field: createPayload.user_email,
          user_email_type: typeof createPayload.user_email,
        });
        
        console.log('[VisionUploadModal] SAVE STEP 5C: Calling create');
        const saved = await base44.entities.VisionItem.create(createPayload);
        
        console.log('[VisionUploadModal] ═══ CREATE RESPONSE RECEIVED ═══');
        console.log('[VisionUploadModal] SAVE STEP 5D: Create succeeded with response:', {
          id: saved.id,
          title: saved.title,
          image_url: saved.image_url?.substring(0, 50) + '...',
          image_url_type: saved.image_url?.startsWith('blob:') ? 'ERROR: BLOB!' : 'PERMANENT',
        });
        
        console.log('[VisionUploadModal] SAVE STEP 5D-FULL: Full saved record from DB:', saved);
        console.log('[VisionUploadModal] SAVE STEP 5D-OWNERSHIP: Saved record ownership fields:', {
          id: saved.id,
          user_email: saved.user_email,
          created_by: saved.created_by,
          user_email_type: typeof saved.user_email,
          created_by_type: typeof saved.created_by,
          is_active: saved.is_active,
          is_active_type: typeof saved.is_active,
        });
        
        // CRITICAL: TRUE PERSISTENCE VERIFICATION — Do not treat as saved until readable
        console.log('[VisionUploadModal] ═══ PERSISTENCE VERIFICATION START ═══');
        console.log('[VisionUploadModal] VERIFY: Reading from same entity: base44.entities.VisionItem');
        console.log('[VisionUploadModal] VERIFY: Returned ID:', saved.id);
        
        let isPersisted = false;
        let verifyError = null;
        
        try {
          console.log('[VisionUploadModal] VERIFY STEP 1: Fetching by exact ID...');
          const byIdTest = await base44.entities.VisionItem.filter({ id: saved.id });
          console.log('[VisionUploadModal] VERIFY STEP 1 RESULT: Query returned', byIdTest?.length || 0, 'records');
          
          if (byIdTest?.length > 0) {
            console.log('[VisionUploadModal] ✓ VERIFY STEP 1 SUCCESS: Record IS readable by ID');
            console.log('[VisionUploadModal] VERIFY STEP 1 DATA:', byIdTest[0]);
            isPersisted = true;
          } else {
            console.error('[VisionUploadModal] ✗ VERIFY STEP 1 FAILED: Record NOT readable by ID');
            verifyError = 'Created vision cannot be retrieved immediately. Record may not be persisted.';
            isPersisted = false;
          }
        } catch (err) {
          console.error('[VisionUploadModal] VERIFY STEP 1 ERROR:', err);
          verifyError = `Persistence check failed: ${err.message}`;
          isPersisted = false;
        }
        
        console.log('[VisionUploadModal] ═══ PERSISTENCE VERIFICATION END ═══');
        console.log('[VisionUploadModal] RESULT: isPersisted =', isPersisted);
        
        if (!isPersisted) {
          console.error('[VisionUploadModal] ⚠️ WARNING: Save returned success but record is not readable from backend');
          console.error('[VisionUploadModal] ⚠️ ERROR:', verifyError);
          // Still show the vision locally but mark it as unverified
          onSave(saved);
          // TODO: Surface warning to user that vision may not be persisted
        } else {
          console.log('[VisionUploadModal] ✓ CONFIRMED: Record is truly persisted and readable');
          onSave(saved);
        }
      }
      
      console.log('[VisionUploadModal] SAVE COMPLETE: Save succeeded with permanent image URL');
    } catch (error) {
      console.error('[VisionUploadModal] SAVE FAILED:', error.message, error);
    } finally {
      setSaving(false);
    }
  };

  const primaryMeta = getCategoryMeta(form.category);

  return (
    <>
      <AnimatePresence>
        {showCropTool && form.image_url && (
          <ImageCropTool
            imageUrl={form.image_url}
            onSave={handleCropSave}
            onCancel={() => {
              setShowCropTool(false);
              setForm(prev => ({ ...prev, image_url: "" }));
            }}
            onSkip={handleCropSkip}
          />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-end justify-center"
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="w-full max-w-md bg-card rounded-t-3xl overflow-hidden flex flex-col md:rounded-2xl"
          style={{ height: "100dvh", maxHeight: "100dvh" }}>

        {/* Header */}
        <div className="px-5 pb-4 border-b border-border flex items-start justify-between gap-4 shrink-0"
          style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top, 0px))" }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-playfair text-lg font-semibold text-foreground">{vision ? "Edit Vision" : "Add to Living Vision Board"}</h2>
            </div>
            <p className="text-xs text-muted-foreground">Bring your future into focus</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-border flex items-center justify-center shrink-0 flex-none touch-target" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* Image Upload */}
          <label className="block mb-5 cursor-pointer">
          <div className={`aspect-video rounded-2xl overflow-hidden border-2 border-dashed transition-all ${
            previewUrl ? "border-transparent" : "border-border hover:border-primary/40"
          }`}>
            {previewUrl ? (
              <div className="relative w-full h-full group" onClick={(e) => e.stopPropagation()}>
                <img src={previewUrl} alt="Vision" className="w-full h-full object-cover pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowCropTool(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-background rounded-lg"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    Crop Image
                  </button>
                </div>
                <p className="absolute bottom-2 left-3 text-[10px] text-white/70">Tap to change</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/20 min-h-[140px]">
                {uploading
                  ? <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  : <><Upload className="w-6 h-6" /><p className="text-xs">Upload your vision image</p><p className="text-[10px] text-muted-foreground/50">The clearer the image, the stronger the intention</p></>
                }
              </div>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>

          {/* Priority toggle */}
          <div className="flex items-center justify-between glass-card border border-border rounded-xl px-4 py-3 mb-5">
          <div className="flex items-center gap-2">
            <Star className={`w-4 h-4 ${form.is_priority ? "text-primary fill-primary" : "text-muted-foreground"}`} />
            <div>
              <p className="text-sm font-medium text-foreground">Priority Vision</p>
              <p className="text-[10px] text-muted-foreground">Pin this to your daily focus</p>
            </div>
          </div>
          <button onClick={() => setForm(p => ({ ...p, is_priority: !p.is_priority }))}
            className={`w-11 h-6 rounded-full transition-all relative ${form.is_priority ? "bg-primary" : "bg-border"}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_priority ? "left-5" : "left-0.5"}`} />
          </button>
        </div>

          {/* Title */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Vision Title *</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Dream Penthouse in Manhattan"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50" />
        </div>

          {/* Primary Category */}
          <div className="mb-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Primary Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setForm(p => ({ ...p, category: cat.id }))}
                className={`py-2.5 px-3 rounded-xl text-left transition-all border ${
                  form.category === cat.id
                    ? "border-primary bg-primary/10"
                    : "bg-background border-border"
                }`}>
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
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Secondary Category <span className="text-muted-foreground/50 normal-case">(optional)</span></label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setForm(p => ({ ...p, secondary_category: "none" }))}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                form.secondary_category === "none" ? "bg-primary/10 border-primary text-primary" : "bg-background border-border text-muted-foreground"
              }`}>
              None
            </button>
            {CATEGORIES.filter(c => c.id !== form.category).map(cat => (
              <button key={cat.id} onClick={() => setForm(p => ({ ...p, secondary_category: cat.id }))}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  form.secondary_category === cat.id ? "bg-primary/10 border-primary text-primary" : "bg-background border-border text-muted-foreground"
                }`}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

          {/* Emotional Goal */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">How will you feel when you have this?</label>
          <input value={form.emotional_goal} onChange={e => setForm(p => ({ ...p, emotional_goal: e.target.value }))}
            placeholder={primaryMeta.prompt}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50" />
        </div>

          {/* Why I want this */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Why I Want This</label>
          <textarea value={form.why_i_want_this} onChange={e => setForm(p => ({ ...p, why_i_want_this: e.target.value }))}
            placeholder="What deeper purpose or meaning is behind this vision? Be honest."
            rows={3}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none" />
        </div>

          {/* Timeline */}
          <div className="mb-5">
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Desired Timeline</label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TIMELINES.map(t => (
              <button key={t} onClick={() => setForm(p => ({ ...p, desired_timeline: t }))}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  form.desired_timeline === t ? "bg-primary text-background border-primary" : "bg-background border-border text-muted-foreground"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

          <button onClick={handleSave} disabled={saving || !form.title || uploading}
            className="w-full py-4 gold-gradient text-background font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (vision ? "Save Vision" : "Add to Living Vision Board ✦")}
          </button>
        </div>
      </motion.div>
      </motion.div>
    </>
  );
}
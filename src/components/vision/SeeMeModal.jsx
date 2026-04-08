import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Sparkles, RefreshCw, Download, Check, Loader2, Star, Image as ImageIcon, Crop, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useModalState } from "@/lib/ModalContext";
import { useSeeMeGeneratedAsset } from "@/hooks/useSeeMeGeneratedAsset";
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
    console.log(`[${boxId}] File input onChange fired`);
    const files = e.target.files;
    console.log(`[${boxId}] Files array:`, files ? `length=${files.length}` : 'null');
    
    if (!files || files.length === 0) {
      console.log(`[${boxId}] No file selected or cancelled`);
      return;
    }
    
    const file = files[0];
    console.log(`[${boxId}] File picker returned file:`, { name: file.name, size: file.size, type: file.type });
    
    // CRITICAL: Call handler with file immediately while event is active
    console.log(`[${boxId}] Calling onFileSelected handler`);
    onFileSelected(boxId, file);
    console.log(`[${boxId}] onFileSelected handler returned`);
    
    // Reset input AFTER file is passed to handler so same file can be selected again
    console.log(`[${boxId}] Resetting input value to ''`);
    e.target.value = '';
    console.log(`[${boxId}] Input value reset complete`);
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
              onLoad={() => {
                console.log(`[${boxId}] Image onLoad fired - image is ready`);
                onImageLoaded(boxId);
              }}
              onError={(err) => {
                console.error(`[${boxId}] Preview image failed to load:`, err);
              }}
              key={preview}
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

  // Load previously saved generated image from persistent storage
  const { asset: savedAsset, loading: loadingSavedAsset } = useSeeMeGeneratedAsset(userEmail, vision?.id);

  useEffect(() => {
    setActiveFullscreenModal("see-me-vision");
    return () => setActiveFullscreenModal(null);
  }, [setActiveFullscreenModal]);

  // If a saved asset exists, load it immediately
  useEffect(() => {
    console.log('[SeeMeModal] savedAsset effect triggered:', { 
      exists: !!savedAsset, 
      hasUrl: !!savedAsset?.generated_image_url,
      url: savedAsset?.generated_image_url?.substring(0, 50)
    });
    
    if (savedAsset && savedAsset.generated_image_url) {
      console.log('[SeeMeModal] RENDER STEP 1: Loading saved generated image from asset');
      console.log('[SeeMeModal] RENDER STEP 2: Asset ID:', savedAsset.id);
      console.log('[SeeMeModal] RENDER STEP 3: Setting result to URL:', savedAsset.generated_image_url.substring(0, 50) + '...');
      setResult(savedAsset.generated_image_url);
      setSavedFileUrl(savedAsset.generated_image_url);
      setSaved(true);
      setStep(2);
      console.log('[SeeMeModal] RENDER COMPLETE: Saved image loaded into state');
    } else {
      console.log('[SeeMeModal] No saved asset available, step stays at 1');
    }
  }, [savedAsset]);

  // DEBUG: Log state after every render
  useEffect(() => {
    console.log('[SeeMeModal] Current state:', {
      visionBox: {
        sourceFile: !!visionBox.sourceFile,
        sourceUrl: !!visionBox.sourceUrl,
        croppedFile: !!visionBox.croppedFile,
        isImageLoaded: visionBox.isImageLoaded,
        status: visionBox.status,
      },
      selfBox: {
        sourceFile: !!selfBox.sourceFile,
        sourceUrl: !!selfBox.sourceUrl,
        croppedFile: !!selfBox.croppedFile,
        isImageLoaded: selfBox.isImageLoaded,
        status: selfBox.status,
      },
      canGenerate,
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PHASE 1: FILE ACQUISITION
  // ───────────────────────────────────────────────────────────────────────────

  const handleFileSelected = (boxId, file) => {
    console.log(`[${boxId}] PHASE 1 START: File acquisition - storing immediately`);
    
    // CRITICAL: Verify file exists and is valid
    if (!file) {
      console.error(`[${boxId}] File is NULL!`);
      return;
    }
    
    console.log(`[${boxId}] File received:`, { name: file.name, size: file.size, type: file.type });
    
    if (!file.type.startsWith('image/')) {
      console.error(`[${boxId}] File type is not an image:`, file.type);
      return;
    }
    
    console.log(`[${boxId}] File validation passed. Size: ${file.size}, Type: ${file.type}`);
    
    // Create object URL for preview immediately
    console.log(`[${boxId}] Creating preview URL from selected file`);
    let previewUrl;
    try {
      previewUrl = URL.createObjectURL(file);
      console.log(`[${boxId}] Preview URL created:`, previewUrl);
    } catch (err) {
      console.error(`[${boxId}] Failed to create object URL:`, err);
      return;
    }

    // CRITICAL: Verify file is still accessible after URL creation
    if (file.size === 0) {
      console.error(`[${boxId}] CRITICAL: File size is 0 bytes after URL creation!`);
      return;
    }

    const newBoxState = {
      sourceFile: file,
      sourceUrl: previewUrl,
      croppedFile: null,
      croppedUrl: null,
      isImageLoaded: false,
      status: 'loading-preview',  // Preload in progress
      error: null,
    };

    console.log(`[${boxId}] About to update state with:`, {
      sourceFile: !!newBoxState.sourceFile,
      sourceUrl: !!newBoxState.sourceUrl,
      status: newBoxState.status,
    });

    if (boxId === 'vision') {
      console.log(`[${boxId}] Calling setVisionBox`);
      setVisionBox(newBoxState);
      console.log(`[${boxId}] setVisionBox called`);
    } else if (boxId === 'self') {
      console.log(`[${boxId}] Calling setSelfBox`);
      setSelfBox(newBoxState);
      console.log(`[${boxId}] setSelfBox called`);
    } else {
      console.error(`[${boxId}] CRITICAL: boxId is invalid!`);
      return;
    }

    console.log(`[${boxId}] File and preview URL ready, waiting for image preload`);
  };

  const handleImageLoaded = (boxId) => {
    console.log(`[${boxId}] Image preload success - image is confirmed and usable`);
    
    const boxState = boxId === 'vision' ? visionBox : selfBox;
    
    // CRITICAL: Verify file is still accessible
    if (!boxState.sourceFile) {
      console.error(`[${boxId}] CRITICAL: sourceFile was garbage collected or lost!`);
      return;
    }
    
    if (!boxState.sourceUrl) {
      console.error(`[${boxId}] CRITICAL: sourceUrl is null!`);
      return;
    }
    
    console.log(`[${boxId}] File still accessible: name=${boxState.sourceFile.name}, size=${boxState.sourceFile.size}, type=${boxState.sourceFile.type}`);
    
    if (boxId === 'vision') {
      console.log(`[vision] Marking as preview-ready`);
      setVisionBox(prev => {
        console.log(`[vision] State update: sourceFile exists?`, !!prev.sourceFile, 'sourceUrl exists?', !!prev.sourceUrl);
        return { ...prev, isImageLoaded: true, status: 'preview-ready' };
      });
    } else if (boxId === 'self') {
      console.log(`[self] Marking as preview-ready`);
      setSelfBox(prev => {
        console.log(`[self] State update: sourceFile exists?`, !!prev.sourceFile, 'sourceUrl exists?', !!prev.sourceUrl);
        return { ...prev, isImageLoaded: true, status: 'preview-ready' };
      });
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
    const cropBoxId = activeCropBoxId; // Capture to avoid closure issues

    try {
      // Fetch cropped blob from data URL
      const blob = await fetch(croppedUrl).then(r => r.blob());
      const croppedFile = new File([blob], `${cropBoxId}-cropped.jpg`, { type: "image/jpeg" });

      console.log(`[${cropBoxId}] Cropped file created:`, croppedFile.size, 'bytes');
      
      // Keep the blob URL as backup while uploading
      const blobUrlBackup = croppedUrl;
      
      // Upload cropped file to persistent storage immediately
      console.log(`[${cropBoxId}] Uploading cropped file to persistent storage`);
      const uploadResult = await base44.integrations.Core.UploadFile({ file: croppedFile });
      const persistentUrl = uploadResult?.file_url;
      
      if (!persistentUrl) {
        throw new Error('Upload returned no URL');
      }
      
      console.log(`[${cropBoxId}] Cropped file persisted:`, persistentUrl);

      // Update box with persistent URL
      if (cropBoxId === 'vision') {
        setVisionBox(prev => ({
          ...prev,
          croppedFile,
          croppedUrl: persistentUrl,
          sourceUrl: blobUrlBackup,  // Keep blob URL as fallback
          status: 'preview-ready',
        }));
        console.log(`[vision] Cropped output committed`);
      } else if (cropBoxId === 'self') {
        setSelfBox(prev => ({
          ...prev,
          croppedFile,
          croppedUrl: persistentUrl,
          sourceUrl: blobUrlBackup,  // Keep blob URL as fallback
          status: 'preview-ready',
        }));
        console.log(`[self] Cropped output committed`);
      }

      console.log(`[${cropBoxId}] PHASE 3 COMPLETE: Crop process finished`);
      setIsCropModalOpen(false);
      setActiveCropBoxId(null);
    } catch (error) {
      console.error(`[${cropBoxId}] PHASE 3 FAILED:`, error);
      
      // FALLBACK: Use blob URL if upload fails (better than losing image)
      console.log(`[${cropBoxId}] FALLBACK: Keeping blob URL since upload failed`);
      
      if (cropBoxId === 'vision') {
        setVisionBox(prev => ({
          ...prev,
          croppedFile: prev.croppedFile || prev.sourceFile,
          croppedUrl: croppedUrl, // Keep the blob URL
          status: 'preview-ready',
          error: 'Upload failed, using local preview. Try generating.',
        }));
      } else if (cropBoxId === 'self') {
        setSelfBox(prev => ({
          ...prev,
          croppedFile: prev.croppedFile || prev.sourceFile,
          croppedUrl: croppedUrl, // Keep the blob URL
          status: 'preview-ready',
          error: 'Upload failed, using local preview. Try generating.',
        }));
      }

      setIsCropModalOpen(false);
      setActiveCropBoxId(null);
    }
  };

  const handleCropCancel = async () => {
    console.log(`[${activeCropBoxId}] Crop cancelled, keeping original`);
    const cropBoxId = activeCropBoxId;
    const boxState = cropBoxId === 'vision' ? visionBox : selfBox;
    
    try {
      // Try to upload original to persistent storage
      console.log(`[${cropBoxId}] Uploading original (uncropped) to persistent storage`);
      const uploadResult = await base44.integrations.Core.UploadFile({ file: boxState.sourceFile });
      const persistentUrl = uploadResult?.file_url;
      
      if (!persistentUrl) {
        throw new Error('Upload returned no URL');
      }
      
      console.log(`[${cropBoxId}] Original file persisted:`, persistentUrl);
      
      if (cropBoxId === 'vision') {
        setVisionBox(prev => ({
          ...prev,
          croppedFile: prev.sourceFile,
          croppedUrl: persistentUrl,
          status: 'preview-ready',
        }));
      } else if (cropBoxId === 'self') {
        setSelfBox(prev => ({
          ...prev,
          croppedFile: prev.sourceFile,
          croppedUrl: persistentUrl,
          status: 'preview-ready',
        }));
      }
    } catch (error) {
      console.error(`[${cropBoxId}] Upload failed on cancel, using blob URL fallback:`, error);
      // CRITICAL: Fall back to blob URL — better to have a blob URL than lose the image
      if (cropBoxId === 'vision') {
        setVisionBox(prev => ({
          ...prev,
          croppedFile: prev.sourceFile,
          croppedUrl: prev.sourceUrl, // Use blob URL
          status: 'preview-ready',
          error: 'Using local preview (won\'t survive refresh).',
        }));
      } else if (cropBoxId === 'self') {
        setSelfBox(prev => ({
          ...prev,
          croppedFile: prev.sourceFile,
          croppedUrl: prev.sourceUrl, // Use blob URL
          status: 'preview-ready',
          error: 'Using local preview (won\'t survive refresh).',
        }));
      }
    }
    
    setIsCropModalOpen(false);
    setActiveCropBoxId(null);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // GENERATION & SAVE
  // ───────────────────────────────────────────────────────────────────────────

  const canGenerate = visionBox.status === 'preview-ready' && selfBox.status === 'preview-ready';

  const handleGenerate = async () => {
    if (!canGenerate) {
      console.error('[generate] CRITICAL: canGenerate is false');
      console.error('[generate] visionBox.status:', visionBox.status);
      console.error('[generate] selfBox.status:', selfBox.status);
      return;
    }
    
    console.log('[generate] Starting image generation flow');
    setGenerating(true);
    setResult(null);

    try {
      const uploads = [];
      
      // Vision image — use persistent croppedUrl if available, otherwise upload sourceFile
      console.log('[generate] Processing vision image');
      if (visionBox.croppedUrl && visionBox.croppedUrl.startsWith('http')) {
        console.log('[generate] Vision: using persistent cropped URL:', visionBox.croppedUrl);
        uploads.push(visionBox.croppedUrl);
      } else if (visionBox.croppedFile) {
        console.log('[generate] Vision: uploading cropped file, size:', visionBox.croppedFile.size);
        const res = await base44.integrations.Core.UploadFile({ file: visionBox.croppedFile });
        console.log('[generate] Vision cropped uploaded:', res.file_url);
        uploads.push(res.file_url);
      } else if (visionBox.sourceFile) {
        console.log('[generate] Vision: uploading original file, size:', visionBox.sourceFile.size);
        const res = await base44.integrations.Core.UploadFile({ file: visionBox.sourceFile });
        console.log('[generate] Vision original uploaded:', res.file_url);
        uploads.push(res.file_url);
      } else {
        throw new Error('[generate] CRITICAL: Vision file missing!');
      }

      // Self image — use persistent croppedUrl if available, otherwise upload sourceFile
      console.log('[generate] Processing self image');
      if (selfBox.croppedUrl && selfBox.croppedUrl.startsWith('http')) {
        console.log('[generate] Self: using persistent cropped URL:', selfBox.croppedUrl);
        uploads.push(selfBox.croppedUrl);
      } else if (selfBox.croppedFile) {
        console.log('[generate] Self: uploading cropped file, size:', selfBox.croppedFile.size);
        const res = await base44.integrations.Core.UploadFile({ file: selfBox.croppedFile });
        console.log('[generate] Self cropped uploaded:', res.file_url);
        uploads.push(res.file_url);
      } else if (selfBox.sourceFile) {
        console.log('[generate] Self: uploading original file, size:', selfBox.sourceFile.size);
        const res = await base44.integrations.Core.UploadFile({ file: selfBox.sourceFile });
        console.log('[generate] Self original uploaded:', res.file_url);
        uploads.push(res.file_url);
      } else {
        throw new Error('[generate] CRITICAL: Self file missing!');
      }

      if (uploads.length !== 2) {
        throw new Error(`[generate] Only ${uploads.length}/2 files uploaded!`);
      }

      console.log('[generate] Both files ready, calling AI image generation');
      const prompt = buildPrompt(scene, vision?.title, vision?.category);
      const generated = await base44.integrations.Core.GenerateImage({
        prompt,
        existing_image_urls: uploads,
      });

      if (!generated?.url) {
        throw new Error('[generate] AI generation returned no URL');
      }

      console.log('[generate] AI generation complete, displaying result');
      setResult(generated.url);
      setStep(2);
    } catch (err) {
      console.error('[generate] FAILED:', err);
      setGenerating(false);
    }
    
    setGenerating(false);
  };

  // File is already uploaded via handleSave, just return the URL
  const uploadResult = async () => {
    if (savedFileUrl) return savedFileUrl;
    // This should never be called if handleSave succeeded
    console.warn('[uploadResult] Called but file should already be saved');
    return result;
  };

  const handleSave = async () => {
    if (!result) {
      console.error('[handleSave] CRITICAL: result is null/undefined!');
      return;
    }
    
    console.log('[handleSave] STEP 1: Save triggered, result source:', result.substring(0, 50) + '...');
    setSaving(true);

    try {
      // STEP 2: Convert result to blob
      console.log('[handleSave] STEP 2: Fetching blob from result URL...');
      const blob = await fetch(result).then(r => r.blob());
      console.log('[handleSave] STEP 2: Blob created, size:', blob.size, 'bytes, type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('[handleSave] CRITICAL: Blob size is 0!');
      }

      // STEP 3: Create File object
      const file = new File([blob], "see-me-vision.jpg", { type: "image/jpeg" });
      console.log('[handleSave] STEP 3: File object created:', file.name, file.size, 'bytes');

      // STEP 4: Upload to permanent storage
      console.log('[handleSave] STEP 4: Starting upload to permanent storage...');
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      const generatedImageUrl = uploadResponse?.file_url;
      
      console.log('[handleSave] STEP 4: Upload response:', uploadResponse);
      console.log('[handleSave] STEP 4: Extracted generatedImageUrl:', generatedImageUrl);
      
      if (!generatedImageUrl) {
        throw new Error('[handleSave] CRITICAL: Upload succeeded but no file_url returned!');
      }

      // STEP 5: Save to database
      console.log('[handleSave] STEP 5: Saving to SeeMeGeneratedImage database...');
      console.log('[handleSave] STEP 5: Save data:', {
        user_email: userEmail,
        vision_id: vision?.id,
        generated_image_url: generatedImageUrl,
        is_active: true,
      });

      const generatedAsset = await base44.entities.SeeMeGeneratedImage.create({
        user_email: userEmail,
        vision_id: vision?.id || null,
        generated_image_url: generatedImageUrl,
        source_vision_image_url: visionBox.croppedUrl || visionBox.sourceUrl,
        source_self_image_url: selfBox.croppedUrl || selfBox.sourceUrl,
        scene_option: scene,
        vision_title: vision?.title || null,
        vision_category: vision?.category || null,
        is_active: true,
        ai_generation_metadata: {
          model: "default",
          generation_time_ms: Date.now(),
        },
      });

      console.log('[handleSave] STEP 5: Asset created with ID:', generatedAsset.id);
      console.log('[handleSave] STEP 5: Full asset saved:', generatedAsset);

      // STEP 6: Deactivate previous versions
      if (vision?.id) {
        console.log('[handleSave] STEP 6: Deactivating previous assets for vision:', vision.id);
        const previousAssets = await base44.entities.SeeMeGeneratedImage.filter({
          user_email: userEmail,
          vision_id: vision.id,
          is_active: true,
        });
        console.log('[handleSave] STEP 6: Found', previousAssets.length, 'previous active assets');
        for (const asset of previousAssets) {
          if (asset.id !== generatedAsset.id) {
            console.log('[handleSave] STEP 6: Deactivating asset:', asset.id);
            await base44.entities.SeeMeGeneratedImage.update(asset.id, { is_active: false });
          }
        }
      }

      // STEP 7: Update local state with persistent URL
      console.log('[handleSave] STEP 7: Updating local state to persist URL:', generatedImageUrl);
      setSavedFileUrl(generatedImageUrl);
      setSaved(true);
      
      console.log('[handleSave] COMPLETE: Image saved and persisted successfully');
      onSave && onSave({ ...vision, generated_image_asset_id: generatedAsset.id });
    } catch (error) {
      console.error('[handleSave] FAILED:', error.message, error);
      setSaved(false);
    } finally {
      setSaving(false);
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
            {loadingSavedAsset ? (
              <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground">Loading your saved vision...</p>
                </div>
              </div>
            ) : (
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
                  {(() => {
                    // PRIORITY: savedFileUrl > savedAsset > resultImageUrl
                    const displayUrl = savedFileUrl || savedAsset?.generated_image_url || result;
                    
                    console.log('[SeeMeModal] RENDER VERIFY: Image source decision');
                    console.log('[SeeMeModal] RENDER VERIFY: resultImageUrl:', result?.substring(0, 50));
                    console.log('[SeeMeModal] RENDER VERIFY: savedFileUrl:', savedFileUrl?.substring(0, 50));
                    console.log('[SeeMeModal] RENDER VERIFY: savedAsset.url:', savedAsset?.generated_image_url?.substring(0, 50));
                    console.log('[SeeMeModal] RENDER VERIFY: saved state:', saved);
                    console.log('[SeeMeModal] RENDER VERIFY: FINAL displayUrl used:', displayUrl?.substring(0, 50) + '...');
                    console.log('[SeeMeModal] RENDER VERIFY: displayUrl source:', 
                      savedFileUrl ? 'FROM savedFileUrl' : savedAsset?.generated_image_url ? 'FROM savedAsset' : 'FROM resultImageUrl (temporary)');
                    
                    if (saved && !savedFileUrl) {
                      console.warn('[SeeMeModal] RENDER VERIFY: BUG CHECK - saved=true but savedFileUrl is empty!');
                    }
                    
                    return (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="rounded-2xl overflow-hidden mb-4 border border-primary/25 glow-gold"
                      >
                        <img src={displayUrl} alt="Your vision" className="w-full h-auto" />
                      </motion.div>
                    );
                  })()}

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
                      <img src={savedFileUrl || result} alt="Result" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
              )}
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
                  console.log('[Regenerate] Clearing current result to allow new generation');
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
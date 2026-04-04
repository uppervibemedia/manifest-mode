import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Sparkles, Loader2, Check, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function FutureSelfSceneModal({ vision, onClose, onSave }) {
  const [step, setStep] = useState("upload"); // upload, generating, preview
  const [personalPhoto, setPersonalPhoto] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setGenerating(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPersonalPhoto(file_url);

      // Generate the scene
      const prompt = `You are creating an aspirational, premium future-self visualization. 

The user has provided:
- A clear personal photo of themselves
- A vision they want to manifest: "${vision.title}"
- Vision description: ${vision.emotional_goal || vision.why_i_want_this || ""}
- Timeline: ${vision.desired_timeline || "soon"}

Create a stunning, high-quality image that:
1. Places the user from their photo naturally into a scene related to their vision "${vision.title}"
2. The image should feel aspirational, clean, and emotionally powerful
3. The user should be the focal point, confident and present in this future scenario
4. The setting/background should reflect the vision (e.g., if vision is a dream car, show the user with/in front of the car in a beautiful location)
5. High production quality - professional photography style, perfect lighting, premium feel
6. The mood should be empowering and achievable, not fantastical

Vision category: ${vision.category}
Secondary category: ${vision.secondary_category || "none"}

Generate a photorealistic, aspirational image of the user in their desired future.`;

      const result = await base44.integrations.Core.GenerateImage({
        prompt,
        existing_image_urls: [file_url],
      });

      setGeneratedImage(result.url);
      setStep("preview");
    } catch (err) {
      setError(err.message || "Failed to generate image. Please try again.");
      setGenerating(false);
    }
  };

  const handleSaveToVision = async () => {
    if (!generatedImage || !vision) return;

    setGenerating(true);
    try {
      // Download the generated image
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const file = new File([blob], "future-self-scene.jpg", { type: "image/jpeg" });

      // Upload as proof image
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Add to vision's proof images
      const updatedProofImages = [...(vision.proof_images || []), file_url];
      await base44.entities.VisionItem.update(vision.id, {
        proof_images: updatedProofImages,
      });

      // Callback to parent
      onSave?.({ ...vision, proof_images: updatedProofImages });
      onClose();
    } catch (err) {
      setError("Failed to save image. Please try again.");
      setGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-card rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-playfair text-lg font-semibold">Future Self Scene</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-border flex items-center justify-center hover:bg-border/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* Vision context */}
          <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-xs uppercase tracking-widest text-primary/70 font-semibold mb-1">
              Your Vision
            </p>
            <p className="text-sm font-semibold text-foreground">{vision.title}</p>
            {vision.emotional_goal && (
              <p className="text-xs text-muted-foreground mt-1">{vision.emotional_goal}</p>
            )}
          </div>

          {/* Step: Upload Photo */}
          {step === "upload" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                  Upload Your Photo
                </p>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Upload a clear, well-lit photo of yourself. The AI will place you into your vision scene for maximum impact.
                </p>
              </div>

              {/* Upload area */}
              <label className="block">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={generating}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors disabled:opacity-50">
                  {generating ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm font-medium text-foreground">
                        Generating your future-self scene...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This takes 10-30 seconds
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-primary" />
                      <p className="text-sm font-semibold text-foreground">
                        Click to upload your photo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, or WebP. Clear, well-lit photos work best.
                      </p>
                    </div>
                  )}
                </div>
              </label>

              {/* Quality tips */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground">📸 Tips for Best Results:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Well-lit photo with your face and upper body visible</li>
                  <li>• Clear background (plain is better than busy)</li>
                  <li>• Natural expression or confident pose</li>
                  <li>• Recent photo that looks like you now</li>
                </ul>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl">
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Step: Preview */}
          {step === "preview" && generatedImage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Generated image */}
              <div className="rounded-2xl overflow-hidden bg-muted">
                <img
                  src={generatedImage}
                  alt="Your future self scene"
                  className="w-full h-auto"
                />
              </div>

              {/* Success message */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-400">Scene Generated</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This is your aspirational preview. Save it to your vision board to keep it close.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("upload");
                    setGeneratedImage(null);
                    setPersonalPhoto(null);
                  }}
                  className="flex-1 py-3 bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/80 transition-colors"
                >
                  Generate Again
                </button>
                <a
                  href={generatedImage}
                  download="future-self-scene.jpg"
                  className="flex-1 py-3 border border-primary/30 text-primary font-semibold rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>

              <button
                onClick={handleSaveToVision}
                disabled={generating}
                className="w-full py-3 gold-gradient text-background font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Save to Vision Board
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Check, RotateCcw } from "lucide-react";

export default function ImageCropTool({ imageUrl, onSave, onCancel, onSkip }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImage(img);
      // Center the image initially
      setCrop({ x: 0, y: 0, scale: 1 });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Draw preview canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const containerWidth = canvas.parentElement.offsetWidth;
    const containerHeight = (containerWidth * 4) / 3; // 4:3 aspect ratio

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Calculate scaled image dimensions
    const scaledWidth = image.width * crop.scale;
    const scaledHeight = image.height * crop.scale;

    // Draw image with positioning (source crop coordinates map to canvas)
    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      image.width,
      image.height,
      0,
      0,
      scaledWidth,
      scaledHeight
    );

    // Draw crop frame
    ctx.strokeStyle = "rgba(212, 175, 55, 0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, containerWidth, containerHeight);
  }, [image, crop]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setCrop((prev) => ({
      ...prev,
      x: prev.x - deltaX * 0.5,
      y: prev.y - deltaY * 0.5,
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setCrop((prev) => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale * delta)),
    }));
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0, scale: 1 });
  };

  const handleSave = async () => {
    if (!image || !canvasRef.current) return;

    const containerWidth = canvasRef.current.parentElement.offsetWidth;
    const containerHeight = (containerWidth * 4) / 3;

    // Create a new canvas with the cropped image
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = containerWidth;
    croppedCanvas.height = containerHeight;
    const croppedCtx = croppedCanvas.getContext("2d");

    const scaledWidth = image.width * crop.scale;
    const scaledHeight = image.height * crop.scale;

    croppedCtx.drawImage(
      image,
      crop.x,
      crop.y,
      image.width,
      image.height,
      0,
      0,
      scaledWidth,
      scaledHeight
    );

    // Convert to blob and call onSave
    croppedCanvas.toBlob(
      (blob) => {
        const croppedUrl = URL.createObjectURL(blob);
        onSave(croppedUrl);
      },
      "image/jpeg",
      0.95
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[9999] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Cancel
        </button>
        <p className="text-sm font-semibold text-foreground">Crop Image</p>
        <div className="w-12" />
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div
          className="relative w-full max-w-md cursor-move select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            className="w-full rounded-2xl bg-black/50"
          />

          {/* Instructions */}
          <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
            <p className="text-xs text-muted-foreground/60">Drag to move · Scroll to zoom</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border/30 space-y-3">
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-3 text-sm font-medium border border-border rounded-xl hover:border-primary/30 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 text-sm font-semibold gold-gradient text-background rounded-xl flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save Crop
          </button>
        </div>
        <button
          onClick={onSkip}
          className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip Crop
        </button>
      </div>
    </motion.div>
  );
}
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Check, RotateCcw } from "lucide-react";

export default function ImageCropTool({ imageUrl, onSave, onCancel, onSkip }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
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
      setCrop({ x: 0, y: 0, scale: 1 });
    };
    img.onerror = () => {
      console.error("Failed to load image:", imageUrl);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Draw preview canvas
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get actual rendered width from container, fallback to window width
    const container = containerRef.current;
    const containerWidth = container?.offsetWidth || window.innerWidth - 40;
    const containerHeight = (containerWidth * 4) / 3;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Clear with semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, containerWidth, containerHeight);

    // Calculate scaled image dimensions
    const scaledWidth = image.width * crop.scale;
    const scaledHeight = image.height * crop.scale;

    // Draw image centered with crop offset
    const offsetX = (containerWidth - scaledWidth) / 2;
    const offsetY = (containerHeight - scaledHeight) / 2;

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      image.width,
      image.height,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    );

    // Draw golden crop frame border
    ctx.strokeStyle = "rgba(212, 175, 55, 0.8)";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, containerWidth, containerHeight);
  }, [image, crop]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX || e.touches?.[0]?.clientX, y: e.clientY || e.touches?.[0]?.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;

    setCrop((prev) => ({
      ...prev,
      x: prev.x - deltaX,
      y: prev.y - deltaY,
    }));

    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    setCrop((prev) => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale * delta)),
    }));
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0, scale: 1 });
  };

  const handleSave = () => {
    if (!image || !canvasRef.current) return;

    const container = containerRef.current;
    const containerWidth = container?.offsetWidth || window.innerWidth - 40;
    const containerHeight = (containerWidth * 4) / 3;

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = containerWidth;
    croppedCanvas.height = containerHeight;
    const croppedCtx = croppedCanvas.getContext("2d");

    const scaledWidth = image.width * crop.scale;
    const scaledHeight = image.height * crop.scale;
    const offsetX = (containerWidth - scaledWidth) / 2;
    const offsetY = (containerHeight - scaledHeight) / 2;

    croppedCtx.fillStyle = "rgba(0, 0, 0, 0.3)";
    croppedCtx.fillRect(0, 0, containerWidth, containerHeight);

    croppedCtx.drawImage(
      image,
      crop.x,
      crop.y,
      image.width,
      image.height,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    );

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
          ref={containerRef}
          className="relative w-full max-w-md cursor-move select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
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
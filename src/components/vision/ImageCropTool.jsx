import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Check, RotateCcw } from "lucide-react";

export default function ImageCropTool({ imageUrl, onSave, onCancel, onSkip }) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [image, setImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [cropBox, setCropBox] = useState({ width: 300, height: 400 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingEdge, setIsDraggingEdge] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 400, height: 600 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImage(img);
      
      // Initial scale: fit image to crop area
      const container = containerRef.current;
      if (container) {
        const maxWidth = container.offsetWidth - 40;
        const maxHeight = container.offsetHeight - 120;
        setContainerSize({ width: maxWidth, height: maxHeight });
        
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height) * 1.2;
        setImageScale(scale);
        setCropBox({ width: maxWidth, height: 400 });
        setImagePosition({ x: 0, y: 0 });
      }
    };
    img.onerror = () => console.error("Failed to load image");
    img.src = imageUrl;
  }, [imageUrl]);

  // Handle image dragging
  const handleImageMouseDown = (e) => {
    const touch = e.touches?.[0];
    const clientX = touch?.clientX || e.clientX;
    const clientY = touch?.clientY || e.clientY;
    
    setIsDraggingImage(true);
    setDragStart({ x: clientX - imagePosition.x, y: clientY - imagePosition.y });
  };

  const handleMouseMove = (e) => {
    if (!isDraggingImage && !isDraggingEdge) return;

    const touch = e.touches?.[0];
    const clientX = touch?.clientX || e.clientX;
    const clientY = touch?.clientY || e.clientY;

    if (isDraggingImage) {
      setImagePosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
    }

    if (isDraggingEdge) {
      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;

      switch (isDraggingEdge) {
        case "right":
          setCropBox((prev) => ({ ...prev, width: Math.max(200, prev.width + deltaX) }));
          break;
        case "bottom":
          setCropBox((prev) => ({ ...prev, height: Math.max(200, prev.height + deltaY) }));
          break;
        case "left":
          setCropBox((prev) => ({
            ...prev,
            width: Math.max(200, prev.width - deltaX),
          }));
          setImagePosition((prev) => ({ ...prev, x: prev.x + deltaX }));
          break;
        case "top":
          setCropBox((prev) => ({
            ...prev,
            height: Math.max(200, prev.height - deltaY),
          }));
          setImagePosition((prev) => ({ ...prev, y: prev.y + deltaY }));
          break;
        case "bottom-right":
          setCropBox((prev) => ({
            width: Math.max(200, prev.width + deltaX),
            height: Math.max(200, prev.height + deltaY),
          }));
          break;
        case "bottom-left":
          setCropBox((prev) => ({
            width: Math.max(200, prev.width - deltaX),
            height: Math.max(200, prev.height + deltaY),
          }));
          setImagePosition((prev) => ({ ...prev, x: prev.x + deltaX }));
          break;
        case "top-right":
          setCropBox((prev) => ({
            width: Math.max(200, prev.width + deltaX),
            height: Math.max(200, prev.height - deltaY),
          }));
          setImagePosition((prev) => ({ ...prev, y: prev.y + deltaY }));
          break;
        case "top-left":
          setCropBox((prev) => ({
            width: Math.max(200, prev.width - deltaX),
            height: Math.max(200, prev.height - deltaY),
          }));
          setImagePosition((prev) => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY,
          }));
          break;
      }

      setDragStart({ x: clientX, y: clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingImage(false);
    setIsDraggingEdge(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setImageScale((prev) => Math.max(0.5, Math.min(3, prev * delta)));
  };

  // Pinch zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setDragStart({ ...dragStart, distance });
    } else if (e.touches.length === 1) {
      handleImageMouseDown(e);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      if (dragStart.distance) {
        const delta = distance / dragStart.distance;
        setImageScale((prev) => Math.max(0.5, Math.min(3, prev * delta)));
      }
      setDragStart({ ...dragStart, distance });
    } else {
      handleMouseMove(e);
    }
  };

  const handleSave = () => {
    if (!image || !containerRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = cropBox.width;
    canvas.height = cropBox.height;
    const ctx = canvas.getContext("2d");

    const scaledWidth = image.width * imageScale;
    const scaledHeight = image.height * imageScale;

    ctx.drawImage(
      image,
      -imagePosition.x,
      -imagePosition.y,
      scaledWidth,
      scaledHeight
    );

    canvas.toBlob(
      (blob) => {
        const croppedUrl = URL.createObjectURL(blob);
        onSave(croppedUrl);
      },
      "image/jpeg",
      0.95
    );
  };

  const handleReset = () => {
    if (image) {
      const scale = Math.min(containerSize.width / image.width, containerSize.height / image.height) * 1.2;
      setImageScale(scale);
      setImagePosition({ x: 0, y: 0 });
      setCropBox({ width: containerSize.width, height: 400 });
    }
  };

  const Handle = ({ position, cursor }) => (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        setIsDraggingEdge(position);
        setDragStart({ x: e.clientX, y: e.clientY });
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        setIsDraggingEdge(position);
        const touch = e.touches[0];
        setDragStart({ x: touch.clientX, y: touch.clientY });
      }}
      className={`absolute ${cursor} touch-none group`}
      style={{
        ...(position === "top" && { top: -8, left: 0, right: 0, height: 16 }),
        ...(position === "bottom" && { bottom: -8, left: 0, right: 0, height: 16 }),
        ...(position === "left" && { left: -8, top: 0, bottom: 0, width: 16 }),
        ...(position === "right" && { right: -8, top: 0, bottom: 0, width: 16 }),
        ...(position === "top-left" && { top: -8, left: -8, width: 24, height: 24 }),
        ...(position === "top-right" && { top: -8, right: -8, width: 24, height: 24 }),
        ...(position === "bottom-left" && { bottom: -8, left: -8, width: 24, height: 24 }),
        ...(position === "bottom-right" && { bottom: -8, right: -8, width: 24, height: 24 }),
      }}
    >
      <div className="absolute inset-0 rounded-full bg-primary opacity-0 group-active:opacity-100 transition-opacity" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[9999] flex flex-col"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
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

      {/* Crop Container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden p-5 relative"
      >
        {image && (
          <>
            {/* Darkened overlay outside crop area */}
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />

            {/* Crop Box Container */}
            <div
              className="relative"
              style={{
                width: cropBox.width,
                height: cropBox.height,
                overflow: "hidden",
              }}
              onMouseDown={handleImageMouseDown}
              onTouchStart={handleTouchStart}
            >
              {/* Image */}
              <div
                className="absolute cursor-grab active:cursor-grabbing select-none"
                style={{
                  width: image.width * imageScale,
                  height: image.height * imageScale,
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageScale})`,
                  transformOrigin: "0 0",
                }}
              />

              {/* Crop Frame Border */}
              <div className="absolute inset-0 border-2 border-primary pointer-events-none" />

              {/* Corner & Edge Handles */}
              <Handle position="top" cursor="cursor-ns-resize" />
              <Handle position="bottom" cursor="cursor-ns-resize" />
              <Handle position="left" cursor="cursor-ew-resize" />
              <Handle position="right" cursor="cursor-ew-resize" />
              <Handle position="top-left" cursor="cursor-nwse-resize" />
              <Handle position="top-right" cursor="cursor-nesw-resize" />
              <Handle position="bottom-left" cursor="cursor-nesw-resize" />
              <Handle position="bottom-right" cursor="cursor-nwse-resize" />
            </div>
          </>
        )}
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
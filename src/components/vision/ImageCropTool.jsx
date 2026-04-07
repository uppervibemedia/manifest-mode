import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Check, RotateCcw } from "lucide-react";

export default function ImageCropTool({ imageUrl, onSave, onCancel, onSkip }) {
  const containerRef = useRef(null);
  const cropContainerRef = useRef(null);
  const imageRef = useRef(null);
  const [image, setImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [cropBox, setCropBox] = useState({ width: 0, height: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingEdge, setIsDraggingEdge] = useState(null);
  const [isDraggingImageEdge, setIsDraggingImageEdge] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const lastTouchDistanceRef = useRef(0);

  // Load image and set initial state
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImage(img);

      // Calculate initial crop box size (portrait by default, responsive)
      const container = containerRef.current;
      if (container) {
        const padding = 40;
        const maxWidth = container.offsetWidth - padding;
        const maxHeight = container.offsetHeight - 180; // Account for header/footer

        // Crop box is portrait-oriented
        const cropWidth = Math.min(maxWidth, 300);
        const cropHeight = Math.min(maxHeight, 400);

        setCropBox({ width: cropWidth, height: cropHeight });

        // Calculate initial image scale to fit inside crop box nicely
        const scaleX = cropWidth / img.width;
        const scaleY = cropHeight / img.height;
        const initialScale = Math.min(scaleX, scaleY) * 1.1; // Slightly zoomed for better composition

        setImageScale(initialScale);
        setImagePosition({ x: 0, y: 0 });
      }
    };
    img.onerror = () => console.error("Failed to load image");
    img.src = imageUrl;
  }, [imageUrl]);

  // Lock body scroll while crop tool is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Handle image drag
  const handleImagePointerDown = (e) => {
    // Only allow left mouse button or touch
    if (e.button !== undefined && e.button !== 0) return;
    
    const touch = e.touches?.[0];
    const clientX = touch?.clientX || e.clientX;
    const clientY = touch?.clientY || e.clientY;

    setIsDraggingImage(true);
    setDragStart({ x: clientX - imagePosition.x, y: clientY - imagePosition.y });
  };

  // Handle all pointer movement
  const handlePointerMove = (e) => {
    if (!isDraggingImage && !isDraggingEdge && !isDraggingImageEdge) return;

    e.preventDefault();

    const touch = e.touches?.[0];
    const clientX = touch?.clientX || e.clientX;
    const clientY = touch?.clientY || e.clientY;

    if (isDraggingImage) {
      setImagePosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
      return;
    }

    if (isDraggingImageEdge) {
      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;

      switch (isDraggingImageEdge) {
        case "right":
          setImageScale((prev) => Math.max(0.5, Math.min(4, prev + deltaX * 0.01)));
          break;
        case "left":
          setImageScale((prev) => Math.max(0.5, Math.min(4, prev - deltaX * 0.01)));
          break;
        case "bottom":
          setImageScale((prev) => Math.max(0.5, Math.min(4, prev + deltaY * 0.01)));
          break;
        case "top":
          setImageScale((prev) => Math.max(0.5, Math.min(4, prev - deltaY * 0.01)));
          break;
        case "bottom-right":
          setImageScale((prev) => Math.max(0.5, Math.min(4, prev + (deltaX + deltaY) * 0.005)));
          break;
        case "bottom-left":
          setImageScale((prev) => Math.max(0.5, Math.min(4, prev + (deltaY - deltaX) * 0.005)));
          break;
        case "top-right":
          setImageScale((prev) => Math.max(0.5, Math.min(4, prev + (deltaX - deltaY) * 0.005)));
          break;
        case "top-left":
          setImageScale((prev) => Math.max(0.5, Math.min(4, prev - (deltaX + deltaY) * 0.005)));
          break;
      }

      setDragStart({ x: clientX, y: clientY });
      return;
    }

    if (isDraggingEdge) {
      const deltaX = clientX - dragStart.x;
      const deltaY = clientY - dragStart.y;
      const minSize = 150;

      switch (isDraggingEdge) {
        case "right":
          setCropBox((prev) => ({ ...prev, width: Math.max(minSize, prev.width + deltaX) }));
          break;
        case "bottom":
          setCropBox((prev) => ({ ...prev, height: Math.max(minSize, prev.height + deltaY) }));
          break;
        case "left":
          setCropBox((prev) => ({
            ...prev,
            width: Math.max(minSize, prev.width - deltaX),
          }));
          setImagePosition((prev) => ({ ...prev, x: prev.x + deltaX }));
          break;
        case "top":
          setCropBox((prev) => ({
            ...prev,
            height: Math.max(minSize, prev.height - deltaY),
          }));
          setImagePosition((prev) => ({ ...prev, y: prev.y + deltaY }));
          break;
        case "bottom-right":
          setCropBox((prev) => ({
            width: Math.max(minSize, prev.width + deltaX),
            height: Math.max(minSize, prev.height + deltaY),
          }));
          break;
        case "bottom-left":
          setCropBox((prev) => ({
            width: Math.max(minSize, prev.width - deltaX),
            height: Math.max(minSize, prev.height + deltaY),
          }));
          setImagePosition((prev) => ({ ...prev, x: prev.x + deltaX }));
          break;
        case "top-right":
          setCropBox((prev) => ({
            width: Math.max(minSize, prev.width + deltaX),
            height: Math.max(minSize, prev.height - deltaY),
          }));
          setImagePosition((prev) => ({ ...prev, y: prev.y + deltaY }));
          break;
        case "top-left":
          setCropBox((prev) => ({
            width: Math.max(minSize, prev.width - deltaX),
            height: Math.max(minSize, prev.height - deltaY),
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

  const handlePointerUp = () => {
    setIsDraggingImage(false);
    setIsDraggingEdge(null);
    setIsDraggingImageEdge(null);
    lastTouchDistanceRef.current = 0;
  };

  // Handle touch events with gesture prevention
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      lastTouchDistanceRef.current = distance;
    } else if (e.touches.length === 1) {
      // Single touch drag
      handleImagePointerDown(e);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent page scroll
    
    if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastTouchDistanceRef.current > 0) {
        const scaleFactor = distance / lastTouchDistanceRef.current;
        setImageScale((prev) => Math.max(0.5, Math.min(4, prev * scaleFactor)));
      }

      lastTouchDistanceRef.current = distance;
    } else if (e.touches.length === 1) {
      // Single touch drag
      handlePointerMove(e);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handlePointerUp();
  };

  // Save cropped image
  const handleSave = () => {
    if (!image) return;

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

  // Reset to initial state
  const handleReset = () => {
    if (!image || !cropBox.width) return;

    const scaleX = cropBox.width / image.width;
    const scaleY = cropBox.height / image.height;
    const initialScale = Math.min(scaleX, scaleY) * 1.1;

    setImageScale(initialScale);
    setImagePosition({ x: 0, y: 0 });
  };

  // Crop frame resize handle
  const Handle = ({ position, cursor }) => (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingEdge(position);
        setDragStart({ x: e.clientX, y: e.clientY });
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingEdge(position);
        const touch = e.touches[0];
        setDragStart({ x: touch.clientX, y: touch.clientY });
      }}
      className={`absolute ${cursor} touch-none z-10`}
      style={{
        ...(position === "top" && { top: -10, left: 0, right: 0, height: 20 }),
        ...(position === "bottom" && { bottom: -10, left: 0, right: 0, height: 20 }),
        ...(position === "left" && { left: -10, top: 0, bottom: 0, width: 20 }),
        ...(position === "right" && { right: -10, top: 0, bottom: 0, width: 20 }),
        ...(position === "top-left" && { top: -10, left: -10, width: 30, height: 30 }),
        ...(position === "top-right" && { top: -10, right: -10, width: 30, height: 30 }),
        ...(position === "bottom-left" && { bottom: -10, left: -10, width: 30, height: 30 }),
        ...(position === "bottom-right" && { bottom: -10, right: -10, width: 30, height: 30 }),
      }}
    />
  );

  // Image edge handle for zooming
  const ImageEdgeHandle = ({ position, cursor }) => (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingImageEdge(position);
        setDragStart({ x: e.clientX, y: e.clientY });
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingImageEdge(position);
        const touch = e.touches[0];
        setDragStart({ x: touch.clientX, y: touch.clientY });
      }}
      className={`absolute ${cursor} touch-none z-5`}
      style={{
        ...(position === "top" && { top: 0, left: 0, right: 0, height: 16 }),
        ...(position === "bottom" && { bottom: 0, left: 0, right: 0, height: 16 }),
        ...(position === "left" && { left: 0, top: 0, bottom: 0, width: 16 }),
        ...(position === "right" && { right: 0, top: 0, bottom: 0, width: 16 }),
        ...(position === "top-left" && { top: 0, left: 0, width: 24, height: 24 }),
        ...(position === "top-right" && { top: 0, right: 0, width: 24, height: 24 }),
        ...(position === "bottom-left" && { bottom: 0, left: 0, width: 24, height: 24 }),
        ...(position === "bottom-right" && { bottom: 0, right: 0, width: 24, height: 24 }),
      }}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[9999] flex flex-col select-none"
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Cancel
        </button>
        <p className="text-sm font-semibold text-foreground">Crop</p>
        <div className="w-14" />
      </div>

      {/* Crop Area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden relative"
      >
        {image ? (
          <>
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />

            {/* Crop Container */}
            <div
              ref={cropContainerRef}
              className="relative z-20"
              style={{
                width: cropBox.width,
                height: cropBox.height,
                overflow: "hidden",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
              }}
              onPointerDown={handleImagePointerDown}
              onTouchStart={handleTouchStart}
            >
              {/* Image Container */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                  touchAction: "none",
                }}
              >
                {/* Actual Image */}
                <div
                  style={{
                    width: image.width,
                    height: image.height,
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    transform: `scale(${imageScale})`,
                    transformOrigin: "0 0",
                    willChange: "transform",
                  }}
                />
              </div>

              {/* Crop Frame Border */}
              <div className="absolute inset-0 border-[1.5px] border-primary pointer-events-none" />

              {/* Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div
                  className="absolute"
                  style={{
                    width: "33.33%",
                    height: "100%",
                    left: "33.33%",
                    borderLeft: "1px solid rgba(212, 175, 55, 0.4)",
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    width: "33.33%",
                    height: "100%",
                    left: "66.66%",
                    borderLeft: "1px solid rgba(212, 175, 55, 0.4)",
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    width: "100%",
                    height: "33.33%",
                    top: "33.33%",
                    borderTop: "1px solid rgba(212, 175, 55, 0.4)",
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    width: "100%",
                    height: "33.33%",
                    top: "66.66%",
                    borderTop: "1px solid rgba(212, 175, 55, 0.4)",
                  }}
                />
              </div>

              {/* Crop Frame Resize Handles */}
              <Handle position="top" cursor="cursor-ns-resize" />
              <Handle position="bottom" cursor="cursor-ns-resize" />
              <Handle position="left" cursor="cursor-ew-resize" />
              <Handle position="right" cursor="cursor-ew-resize" />
              <Handle position="top-left" cursor="cursor-nwse-resize" />
              <Handle position="top-right" cursor="cursor-nesw-resize" />
              <Handle position="bottom-left" cursor="cursor-nesw-resize" />
              <Handle position="bottom-right" cursor="cursor-nwse-resize" />

              {/* Image Edge Zoom Handles */}
              <ImageEdgeHandle position="top" cursor="cursor-ns-resize" />
              <ImageEdgeHandle position="bottom" cursor="cursor-ns-resize" />
              <ImageEdgeHandle position="left" cursor="cursor-ew-resize" />
              <ImageEdgeHandle position="right" cursor="cursor-ew-resize" />
              <ImageEdgeHandle position="top-left" cursor="cursor-nwse-resize" />
              <ImageEdgeHandle position="top-right" cursor="cursor-nesw-resize" />
              <ImageEdgeHandle position="bottom-left" cursor="cursor-nesw-resize" />
              <ImageEdgeHandle position="bottom-right" cursor="cursor-nwse-resize" />
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-5 py-4 border-t border-white/10 space-y-3">
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-3 text-sm font-medium border border-border rounded-xl hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 text-sm font-semibold gold-gradient text-background rounded-xl flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save
          </button>
        </div>
        <button
          onClick={onSkip}
          className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          Skip Crop
        </button>
      </div>
    </motion.div>
  );
}
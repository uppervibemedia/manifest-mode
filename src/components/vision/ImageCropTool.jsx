import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

export default function ImageCropTool({ imageUrl, onSave, onCancel }) {
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  
  // Image and zoom state
  const [image, setImage] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  
  // Crop frame state (screen coordinates)
  const [cropBox, setCropBox] = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  
  // Dragging state
  const [activeHandle, setActiveHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);

  // Load image and initialize crop frame
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImage(img);

      const container = containerRef.current;
      if (container) {
        // Initial crop frame fits nicely with padding
        const padding = 60;
        const maxWidth = container.offsetWidth - padding;
        const maxHeight = container.offsetHeight - padding;

        const cropWidth = Math.min(maxWidth, 300);
        const cropHeight = Math.min(maxHeight, 400);
        
        const left = (container.offsetWidth - cropWidth) / 2;
        const top = (container.offsetHeight - cropHeight) / 2;

        setCropBox({
          top,
          left,
          right: left + cropWidth,
          bottom: top + cropHeight,
        });

        // Fit image at 1:1 scale initially
        setZoomScale(1);
        setImageOffset({ x: 0, y: 0 });
      }
    };
    img.onerror = () => console.error("Failed to load image");
    img.src = imageUrl;
  }, [imageUrl]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  // Calculate distance between two touches
  const getTouchDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle touch start (for pinch and image drag)
  const handleTouchStart = (e) => {
    if (e.target.closest('[data-handle]')) return; // Don't interfere with handle drags

    if (e.touches.length === 2) {
      // Pinch start
      setLastTouchDistance(getTouchDistance(e.touches[0], e.touches[1]));
      setIsInteracting(true);
    } else if (e.touches.length === 1) {
      // Image pan start
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - imageOffset.x, y: touch.clientY - imageOffset.y });
      setIsInteracting(true);
    }
  };

  // Handle touch move (for pinch and image drag)
  const handleTouchMove = (e) => {
    e.preventDefault();

    if (e.touches.length === 2) {
      // Pinch zoom
      const newDistance = getTouchDistance(e.touches[0], e.touches[1]);
      if (lastTouchDistance > 0) {
        const scale = newDistance / lastTouchDistance;
        setZoomScale((prev) => Math.max(1, Math.min(3, prev * scale)));
      }
      setLastTouchDistance(newDistance);
    } else if (e.touches.length === 1 && !activeHandle) {
      // Image pan
      const touch = e.touches[0];
      setImageOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setLastTouchDistance(0);
    setIsInteracting(false);
  };

  // Handle crop handle drag
  const handleHandleDown = (position, e) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches?.[0];
    const clientX = touch?.clientX || e.clientX;
    const clientY = touch?.clientY || e.clientY;
    
    setActiveHandle(position);
    setDragStart({ x: clientX, y: clientY });
    setIsInteracting(true);
  };

  const handleHandleMove = (clientX, clientY) => {
    if (!activeHandle) return;

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    const minSize = 80; // Minimum crop width/height
    const padding = 10; // Margin from container edges

    const container = containerRef.current;
    if (!container) return;

    const maxLeft = padding;
    const maxRight = container.offsetWidth - padding;
    const maxTop = padding;
    const maxBottom = container.offsetHeight - padding;

    const newBox = { ...cropBox };

    switch (activeHandle) {
      case "top-left":
        newBox.top = Math.max(maxTop, Math.min(cropBox.bottom - minSize, cropBox.top + deltaY));
        newBox.left = Math.max(maxLeft, Math.min(cropBox.right - minSize, cropBox.left + deltaX));
        break;
      case "top-center":
        newBox.top = Math.max(maxTop, Math.min(cropBox.bottom - minSize, cropBox.top + deltaY));
        break;
      case "top-right":
        newBox.top = Math.max(maxTop, Math.min(cropBox.bottom - minSize, cropBox.top + deltaY));
        newBox.right = Math.min(maxRight, Math.max(cropBox.left + minSize, cropBox.right + deltaX));
        break;
      case "middle-left":
        newBox.left = Math.max(maxLeft, Math.min(cropBox.right - minSize, cropBox.left + deltaX));
        break;
      case "middle-right":
        newBox.right = Math.min(maxRight, Math.max(cropBox.left + minSize, cropBox.right + deltaX));
        break;
      case "bottom-left":
        newBox.bottom = Math.min(maxBottom, Math.max(cropBox.top + minSize, cropBox.bottom + deltaY));
        newBox.left = Math.max(maxLeft, Math.min(cropBox.right - minSize, cropBox.left + deltaX));
        break;
      case "bottom-center":
        newBox.bottom = Math.min(maxBottom, Math.max(cropBox.top + minSize, cropBox.bottom + deltaY));
        break;
      case "bottom-right":
        newBox.bottom = Math.min(maxBottom, Math.max(cropBox.top + minSize, cropBox.bottom + deltaY));
        newBox.right = Math.min(maxRight, Math.max(cropBox.left + minSize, cropBox.right + deltaX));
        break;
    }

    setCropBox(newBox);
    setDragStart({ x: clientX, y: clientY });
  };

  // Global pointer handlers
  const handlePointerMove = (e) => {
    if (!activeHandle && !isInteracting) return;
    const clientX = e.touches?.[0]?.clientX || e.clientX;
    const clientY = e.touches?.[0]?.clientY || e.clientY;
    handleHandleMove(clientX, clientY);
  };

  const handlePointerUp = () => {
    setActiveHandle(null);
  };

  // Save cropped image with export data
  const handleSave = () => {
    if (!image) return;

    const cropWidth = cropBox.right - cropBox.left;
    const cropHeight = cropBox.bottom - cropBox.top;

    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext("2d");

    const scaledWidth = image.width * zoomScale;
    const scaledHeight = image.height * zoomScale;

    // Draw the visible cropped portion
    ctx.drawImage(
      image,
      -imageOffset.x - cropBox.left,
      -imageOffset.y - cropBox.top,
      scaledWidth,
      scaledHeight
    );

    canvas.toBlob(
      (blob) => {
        const croppedUrl = URL.createObjectURL(blob);
        // Export metadata
        onSave(croppedUrl, {
          cropTop: cropBox.top,
          cropLeft: cropBox.left,
          cropRight: cropBox.right,
          cropBottom: cropBox.bottom,
          zoomScale,
          imageOffsetX: imageOffset.x,
          imageOffsetY: imageOffset.y,
        });
      },
      "image/jpeg",
      0.95
    );
  };

  // Crop handle component with 8 positions
  const CropHandle = ({ position, handleSize = 40 }) => {
    const isActive = activeHandle === position;
    
    // Position styles for each handle
    const positionStyles = {
      "top-left": { top: -handleSize / 2, left: -handleSize / 2 },
      "top-center": { top: -handleSize / 2, left: "50%", transform: "translateX(-50%)" },
      "top-right": { top: -handleSize / 2, right: -handleSize / 2 },
      "middle-left": { top: "50%", left: -handleSize / 2, transform: "translateY(-50%)" },
      "middle-right": { top: "50%", right: -handleSize / 2, transform: "translateY(-50%)" },
      "bottom-left": { bottom: -handleSize / 2, left: -handleSize / 2 },
      "bottom-center": { bottom: -handleSize / 2, left: "50%", transform: "translateX(-50%)" },
      "bottom-right": { bottom: -handleSize / 2, right: -handleSize / 2 },
    };

    return (
      <div
        data-handle
        onMouseDown={(e) => handleHandleDown(position, e)}
        onTouchStart={(e) => handleHandleDown(position, e)}
        className="absolute z-30 touch-none"
        style={{
          ...positionStyles[position],
          width: handleSize,
          height: handleSize,
        }}
      >
        {/* Visible indicator dot */}
        <div
          className={`absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full transition-all ${
            isActive ? "bg-primary scale-125" : "bg-white/80"
          }`}
          style={{ transform: "translate(-50%, -50%)" }}
        />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[9999] flex flex-col select-none"
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "none" }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10">
        <button
          onClick={onCancel}
          className="text-white hover:text-primary transition-colors p-2 -ml-2"
        >
          <X className="w-6 h-6" />
        </button>
        <p className="text-sm font-semibold text-white">Crop Image</p>
        <button
          onClick={handleSave}
          className="text-primary hover:text-primary/80 transition-colors font-semibold text-sm px-4 py-2"
        >
          Done
        </button>
      </div>

      {/* Crop Canvas */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative bg-black flex items-center justify-center">
        {image ? (
          <>
            {/* Dimmed background outside crop frame */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `
                linear-gradient(to right,
                  rgba(0, 0, 0, 0.7) 0%,
                  rgba(0, 0, 0, 0.7) ${cropBox.left}px,
                  transparent ${cropBox.left}px,
                  transparent ${cropBox.right}px,
                  rgba(0, 0, 0, 0.7) ${cropBox.right}px,
                  rgba(0, 0, 0, 0.7) 100%
                )
              `
            }} />

            {/* Image layer */}
            <div
              className="absolute cursor-grab active:cursor-grabbing"
              style={{
                width: image.width,
                height: image.height,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "100% 100%",
                backgroundPosition: "0 0",
                backgroundRepeat: "no-repeat",
                transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${zoomScale})`,
                transformOrigin: "0 0",
                willChange: "transform",
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
            />

            {/* Crop frame container */}
            <div
              className="absolute z-20"
              style={{
                left: cropBox.left,
                top: cropBox.top,
                width: cropBox.right - cropBox.left,
                height: cropBox.bottom - cropBox.top,
                border: "2px solid rgba(212, 175, 55, 0.8)",
                pointerEvents: "none",
              }}
            >
              {/* Rule of thirds grid (visible when interacting) */}
              {isInteracting && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute w-full h-px top-1/3 left-0 bg-white/20" />
                  <div className="absolute w-full h-px top-2/3 left-0 bg-white/20" />
                  <div className="absolute h-full w-px left-1/3 top-0 bg-white/20" />
                  <div className="absolute h-full w-px left-2/3 top-0 bg-white/20" />
                </div>
              )}

              {/* 8 Crop handles */}
              <CropHandle position="top-left" />
              <CropHandle position="top-center" />
              <CropHandle position="top-right" />
              <CropHandle position="middle-left" />
              <CropHandle position="middle-right" />
              <CropHandle position="bottom-left" />
              <CropHandle position="bottom-center" />
              <CropHandle position="bottom-right" />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
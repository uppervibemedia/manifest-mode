import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

export default function ImageCropTool({ imageUrl, onSave, onCancel }) {
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  
  // Image and zoom state
  const [image, setImage] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [zoomScale, setZoomScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  
  // Crop frame state (screen coordinates)
  const [cropBox, setCropBox] = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  
  // Dragging state
  const [activeHandle, setActiveHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load image and initialize crop frame
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImage(img);
      setImageDimensions({ width: img.width, height: img.height });

      // Delay to ensure container is measured
      setTimeout(() => {
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

          // Scale image to fit within crop box
          const scaleX = cropWidth / img.width;
          const scaleY = cropHeight / img.height;
          const fitScale = Math.min(scaleX, scaleY);
          
          // Center the scaled image in the crop box
          const scaledWidth = img.width * fitScale;
          const scaledHeight = img.height * fitScale;
          const offsetX = left + (cropWidth - scaledWidth) / 2;
          const offsetY = top + (cropHeight - scaledHeight) / 2;

          setZoomScale(fitScale);
          setImageOffset({ x: offsetX, y: offsetY });
        }
      }, 100);
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

  // Handle touch start (for image drag)
  const handleTouchStart = (e) => {
    if (e.target.closest('[data-handle]')) return; // Don't interfere with handle drags

    if (e.touches.length === 1) {
      // Image pan start
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - imageOffset.x, y: touch.clientY - imageOffset.y });
      setIsInteracting(true);
    }
  };

  // Handle touch move (for image drag)
  const handleTouchMove = (e) => {
    if (activeHandle) return; // Let handle dragging take priority

    if (e.touches.length === 1) {
      e.preventDefault();
      // Image pan
      const touch = e.touches[0];
      setImageOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
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
    
    if (activeHandle) {
      handleHandleMove(clientX, clientY);
    } else if (isInteracting && !activeHandle) {
      // Image pan during interaction
      setImageOffset({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
    }
  };

  const handlePointerUp = () => {
    setActiveHandle(null);
    setIsInteracting(false);
  };

  // Save cropped image with export data
  const handleSave = () => {
    if (!image || !imageRef.current) return;

    const cropWidth = cropBox.right - cropBox.left;
    const cropHeight = cropBox.bottom - cropBox.top;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, cropWidth);
    canvas.height = Math.max(1, cropHeight);
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;

    const scaledWidth = image.width * zoomScale;
    const scaledHeight = image.height * zoomScale;

    // Draw the visible cropped portion by translating the canvas
    // and drawing the scaled image at the correct offset
    ctx.drawImage(
      imageRef.current,
      imageOffset.x - cropBox.left,
      imageOffset.y - cropBox.top,
      scaledWidth,
      scaledHeight
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
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
          pointerEvents: "auto",
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
      className="fixed inset-0 bg-black z-[99999] flex flex-col select-none"
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
          className="text-white hover:text-primary transition-colors p-2 -ml-2"
        >
          <X className="w-6 h-6" />
        </button>
        <p className="text-sm font-semibold text-white">Crop Image</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const container = containerRef.current;
              if (container) {
                const padding = 60;
                const maxWidth = container.offsetWidth - padding;
                const maxHeight = container.offsetHeight - padding;
                const cropWidth = Math.min(maxWidth, 300);
                const cropHeight = Math.min(maxHeight, 400);
                const left = (container.offsetWidth - cropWidth) / 2;
                const top = (container.offsetHeight - cropHeight) / 2;
                setCropBox({ top, left, right: left + cropWidth, bottom: top + cropHeight });
                setImageOffset({ x: left + (cropWidth - imageDimensions.width * zoomScale) / 2, y: top + (cropHeight - imageDimensions.height * zoomScale) / 2 });
              }
            }}
            className="text-muted-foreground hover:text-primary transition-colors font-semibold text-sm px-3 py-2"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className="text-primary hover:text-primary/80 transition-colors font-semibold text-sm px-4 py-2"
          >
            Done
          </button>
        </div>
      </div>

      {/* Crop Canvas */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative bg-black flex items-center justify-center">
        {image ? (
          <>
            {/* Dimmed background outside crop frame */}
            <div className="absolute inset-0 pointer-events-none z-5" style={{
              background: `
                linear-gradient(to right,
                  rgba(0, 0, 0, 0.7) 0%,
                  rgba(0, 0, 0, 0.7) ${cropBox.left}px,
                  transparent ${cropBox.left}px,
                  transparent ${cropBox.right}px,
                  rgba(0, 0, 0, 0.7) ${cropBox.right}px,
                  rgba(0, 0, 0, 0.7) 100%
                )
              `,
              zIndex: 5,
            }} />

            {/* Clipping container - shows live preview of what's being cropped */}
            {imageDimensions.width > 0 && (
            <div
              style={{
                position: "absolute",
                left: cropBox.left,
                top: cropBox.top,
                width: cropBox.right - cropBox.left,
                height: cropBox.bottom - cropBox.top,
                overflow: "hidden",
                border: "2px solid rgba(212, 175, 55, 0.8)",
                zIndex: 15,
                backgroundColor: "rgba(0,0,0,0.1)",
              }}
            >
              <img
                src={imageUrl}
                alt="crop preview"
                style={{
                  position: "absolute",
                  left: imageOffset.x - cropBox.left,
                  top: imageOffset.y - cropBox.top,
                  width: imageDimensions.width * zoomScale,
                  height: imageDimensions.height * zoomScale,
                  pointerEvents: "none",
                  willChange: "none",
                }}
                draggable={false}
              />
            </div>
            )}

            {/* Image layer (for interaction) */}
            <img
              src={imageUrl}
              alt="crop"
              className="absolute cursor-grab active:cursor-grabbing"
              onLoad={(e) => {
                const rect = e.target.getBoundingClientRect();
                const actualWidth = rect.width || e.target.naturalWidth;
                const actualHeight = rect.height || e.target.naturalHeight;
                if (imageDimensions.width === 0) {
                  setImageDimensions({ width: actualWidth, height: actualHeight });
                }
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: imageDimensions.width > 0 ? imageDimensions.width : "auto",
                height: imageDimensions.height > 0 ? imageDimensions.height : "auto",
                maxWidth: imageDimensions.width === 0 ? "calc(100vw - 120px)" : "none",
                maxHeight: imageDimensions.height === 0 ? "calc(100dvh - 200px)" : "none",
                transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${zoomScale})`,
                transformOrigin: "0 0",
                willChange: "transform",
                pointerEvents: "auto",
                opacity: 0.3,
              }}
              onTouchStart={handleTouchStart}
              onMouseDown={(e) => {
                e.preventDefault();
                setDragStart({ x: e.clientX - imageOffset.x, y: e.clientY - imageOffset.y });
                setIsInteracting(true);
              }}
              draggable={false}
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
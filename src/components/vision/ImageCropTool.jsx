import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

export default function ImageCropTool({ imageUrl, onSave, onCancel }) {
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const rootRef = useRef(null);
  
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
  const activeHandleRef = useRef(null);
  const activeTouchIdRef = useRef(null); // Track which finger/pointer is active

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

          console.log(`[Crop INIT] Image loaded: ${img.width}x${img.height}, fitScale=${fitScale.toFixed(3)}`);
          console.log(`[Crop INIT] Initial offset: (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);

          setZoomScale(fitScale);
          setImageOffset({ x: offsetX, y: offsetY });
        }
      }, 100);
    };
    img.onerror = () => console.error("Failed to load image");
    img.src = imageUrl;
  }, [imageUrl]);

  // Monitor for unexpected imageOffset or zoomScale changes during side-handle dragging
  useEffect(() => {
    if (activeHandle === "middle-left" || activeHandle === "middle-right") {
      const expectedScale = zoomScale; // Should not change
      const expectedOffsetX = imageOffset.x; // Should only change on image pan, not on crop
      console.log(`[Crop MONITOR] Active handle=${activeHandle}, zoomScale=${expectedScale.toFixed(3)}, offsetX=${expectedOffsetX.toFixed(1)}`);
    }
  }, [imageOffset, zoomScale, activeHandle]);

  // Lock body scroll and disable pinch-to-zoom for REAL mobile
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.style.touchAction = "none";
    if (rootRef.current) {
      rootRef.current.style.touchAction = "none";
    }
    
    // Prevent all gestures during crop — multi-touch only
    const preventZoom = (e) => {
      // Block all multi-touch (pinch-to-zoom)
      if (e.touches && e.touches.length > 1) {
        console.log("[Crop] Preventing multi-touch zoom");
        e.preventDefault();
      }
    };
    
    const preventGesture = (e) => {
      console.log("[Crop] Preventing gesturestart");
      e.preventDefault();
    };
    
    document.addEventListener("touchmove", preventZoom, { passive: false });
    document.addEventListener("gesturestart", preventGesture, { passive: false });
    
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.documentElement.style.touchAction = "";
      document.removeEventListener("touchmove", preventZoom);
      document.removeEventListener("gesturestart", preventGesture);
    };
  }, []);

  // NOTE: Image pan is DISABLED in crop mode — all touch/drag is for crop handles only
  // This prevents accidental image movement while trying to resize crop frame

  // Handle crop handle drag — supports both pointer and touch events
  const handleHandleDown = (position, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the identifier (pointerId for pointer events, or touch identifier for touch events)
    let identifier = null;
    let clientX = 0;
    let clientY = 0;
    
    if (e.touches) {
      // Touch event (iPhone Safari, Android Chrome, etc.)
      const touch = e.touches[0];
      identifier = touch.identifier;
      clientX = touch.clientX;
      clientY = touch.clientY;
      console.log(`[Crop] TOUCH START: handle=${position}, touchId=${identifier}, pos=(${clientX}, ${clientY})`);
    } else if (e.pointerId !== undefined) {
      // Pointer event (some browsers)
      identifier = e.pointerId;
      clientX = e.clientX;
      clientY = e.clientY;
      console.log(`[Crop] POINTER START: handle=${position}, pointerId=${identifier}, pos=(${clientX}, ${clientY})`);
    } else {
      // Mouse event fallback
      identifier = "mouse";
      clientX = e.clientX;
      clientY = e.clientY;
      console.log(`[Crop] MOUSE START: handle=${position}, pos=(${clientX}, ${clientY})`);
    }
    
    // Lock this handle and finger immediately
    activeHandleRef.current = position;
    activeTouchIdRef.current = identifier;
    setActiveHandle(position);
    
    setDragStart({ x: clientX, y: clientY });
    setIsInteracting(true);
    
    console.log(`[Crop] Handle locked: ${position}, activeId=${activeTouchIdRef.current}`);
  };

  const handleHandleMove = (clientX, clientY) => {
    const currentHandle = activeHandleRef.current;
    if (!currentHandle) return;

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
    let changed = false;

    // Log for side handle dragging (left/right)
    if (currentHandle === "middle-left" || currentHandle === "middle-right") {
      console.log(`[Crop DEBUG] Handle: ${currentHandle}`);
      console.log(`[Crop DEBUG]   Before: left=${cropBox.left}, right=${cropBox.right}, width=${cropBox.right - cropBox.left}`);
      console.log(`[Crop DEBUG]   Image: width=${imageDimensions.width}, zoomScale=${zoomScale}, renderedWidth=${imageDimensions.width * zoomScale}`);
      console.log(`[Crop DEBUG]   ImageOffset: x=${imageOffset.x}, y=${imageOffset.y}`);
    }

    switch (currentHandle) {
      case "top-left":
        const newTopLeft = Math.max(maxTop, Math.min(cropBox.bottom - minSize, cropBox.top + deltaY));
        const newLeftLeft = Math.max(maxLeft, Math.min(cropBox.right - minSize, cropBox.left + deltaX));
        if (newTopLeft !== newBox.top) { newBox.top = newTopLeft; changed = true; }
        if (newLeftLeft !== newBox.left) { newBox.left = newLeftLeft; changed = true; }
        break;
      case "top-center":
        const newTopCenter = Math.max(maxTop, Math.min(cropBox.bottom - minSize, cropBox.top + deltaY));
        if (newTopCenter !== newBox.top) { newBox.top = newTopCenter; changed = true; }
        break;
      case "top-right":
        const newTopRight = Math.max(maxTop, Math.min(cropBox.bottom - minSize, cropBox.top + deltaY));
        const newRightTop = Math.min(maxRight, Math.max(cropBox.left + minSize, cropBox.right + deltaX));
        if (newTopRight !== newBox.top) { newBox.top = newTopRight; changed = true; }
        if (newRightTop !== newBox.right) { newBox.right = newRightTop; changed = true; }
        break;
      case "middle-left":
        const newLeftMid = Math.max(maxLeft, Math.min(cropBox.right - minSize, cropBox.left + deltaX));
        if (newLeftMid !== newBox.left) { newBox.left = newLeftMid; changed = true; }
        break;
      case "middle-right":
        const newRightMid = Math.min(maxRight, Math.max(cropBox.left + minSize, cropBox.right + deltaX));
        if (newRightMid !== newBox.right) { newBox.right = newRightMid; changed = true; }
        break;
      case "bottom-left":
        const newBottomLeft = Math.min(maxBottom, Math.max(cropBox.top + minSize, cropBox.bottom + deltaY));
        const newLeftBot = Math.max(maxLeft, Math.min(cropBox.right - minSize, cropBox.left + deltaX));
        if (newBottomLeft !== newBox.bottom) { newBox.bottom = newBottomLeft; changed = true; }
        if (newLeftBot !== newBox.left) { newBox.left = newLeftBot; changed = true; }
        break;
      case "bottom-center":
        const newBottomCenter = Math.min(maxBottom, Math.max(cropBox.top + minSize, cropBox.bottom + deltaY));
        if (newBottomCenter !== newBox.bottom) { newBox.bottom = newBottomCenter; changed = true; }
        break;
      case "bottom-right":
        const newBottomRight = Math.min(maxBottom, Math.max(cropBox.top + minSize, cropBox.bottom + deltaY));
        const newRightBot = Math.min(maxRight, Math.max(cropBox.left + minSize, cropBox.right + deltaX));
        if (newBottomRight !== newBox.bottom) { newBox.bottom = newBottomRight; changed = true; }
        if (newRightBot !== newBox.right) { newBox.right = newRightBot; changed = true; }
        break;
    }

    if (changed) {
      if (currentHandle === "middle-left" || currentHandle === "middle-right") {
        const oldWidth = cropBox.right - cropBox.left;
        const newWidth = newBox.right - newBox.left;
        console.log(`[Crop DEBUG]   After: left=${newBox.left}, right=${newBox.right}, width=${newWidth}`);
        console.log(`[Crop DEBUG]   CropBox width change: ${oldWidth} → ${newWidth} (${newWidth - oldWidth > 0 ? '+' : ''}${newWidth - oldWidth}px)`);
        console.log(`[Crop DEBUG]   Image should NOT change: width=${imageDimensions.width}, zoomScale=${zoomScale}, rendered=${imageDimensions.width * zoomScale}`);
      }
      setCropBox(newBox);
    }
    setDragStart({ x: clientX, y: clientY });
  };

  // Global move handlers — explicit for both touch and pointer
  const handlePointerMove = (e) => {
    // Only respond to active handle dragging
    if (!activeHandleRef.current || !activeTouchIdRef.current) return;
    
    let currentClientX = null;
    let currentClientY = null;
    let currentIdentifier = null;
    
    if (e.touches) {
      // Touch event: find the touch with matching identifier
      const touch = Array.from(e.touches).find(t => t.identifier === activeTouchIdRef.current);
      if (!touch) {
        console.log(`[Crop] MOVE: Touch with id ${activeTouchIdRef.current} not found, ignoring`);
        return;
      }
      currentClientX = touch.clientX;
      currentClientY = touch.clientY;
      currentIdentifier = touch.identifier;
    } else if (e.pointerId !== undefined) {
      // Pointer event: verify it matches active pointer
      if (e.pointerId !== activeTouchIdRef.current) {
        console.log(`[Crop] MOVE: PointerId ${e.pointerId} != active ${activeTouchIdRef.current}, ignoring`);
        return;
      }
      currentClientX = e.clientX;
      currentClientY = e.clientY;
      currentIdentifier = e.pointerId;
    } else {
      // Mouse
      currentClientX = e.clientX;
      currentClientY = e.clientY;
      currentIdentifier = "mouse";
    }
    
    console.log(`[Crop] MOVE: handle=${activeHandleRef.current}, id=${currentIdentifier}, pos=(${currentClientX}, ${currentClientY})`);
    
    e.preventDefault();
    e.stopPropagation();
    handleHandleMove(currentClientX, currentClientY);
  };

  const handlePointerUp = (e) => {
    if (!activeHandleRef.current) return;
    
    let currentIdentifier = null;
    let shouldRelease = false;
    
    if (e.changedTouches !== undefined) {
      // Touch event: CRITICAL — use changedTouches, not touches
      // changedTouches contains ONLY the touches that ended/changed
      const touch = Array.from(e.changedTouches).find(t => t.identifier === activeTouchIdRef.current);
      if (touch) {
        // Our active touch ended
        shouldRelease = true;
        currentIdentifier = activeTouchIdRef.current;
      }
    } else if (e.pointerId !== undefined) {
      // Pointer event: matches pointerId
      if (e.pointerId === activeTouchIdRef.current) {
        shouldRelease = true;
        currentIdentifier = e.pointerId;
      }
    } else {
      // Mouse event
      shouldRelease = true;
      currentIdentifier = "mouse";
    }
    
    if (!shouldRelease) {
      console.log(`[Crop] UP ignored: different pointer/touch, active=${activeTouchIdRef.current}`);
      return;
    }
    
    console.log(`[Crop] RELEASE: handle=${activeHandleRef.current}, id=${currentIdentifier}`);
    
    setActiveHandle(null);
    activeHandleRef.current = null;
    activeTouchIdRef.current = null;
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

  // Crop handle component with 8 positions — HUGE hit area for real iPhone touch
  const CropHandle = ({ position, handleSize = 40 }) => {
    const isActive = activeHandle === position;
    const touchHitSize = 88; // Massive invisible touch target for real finger use (thumb-friendly)
    
    // Position styles for each handle (center the large invisible area around the actual corner/edge)
    const positionStyles = {
      "top-left": { top: -touchHitSize / 2, left: -touchHitSize / 2 },
      "top-center": { top: -touchHitSize / 2, left: "50%", marginLeft: -touchHitSize / 2 },
      "top-right": { top: -touchHitSize / 2, right: -touchHitSize / 2 },
      "middle-left": { top: "50%", marginTop: -touchHitSize / 2, left: -touchHitSize / 2 },
      "middle-right": { top: "50%", marginTop: -touchHitSize / 2, right: -touchHitSize / 2 },
      "bottom-left": { bottom: -touchHitSize / 2, left: -touchHitSize / 2 },
      "bottom-center": { bottom: -touchHitSize / 2, left: "50%", marginLeft: -touchHitSize / 2 },
      "bottom-right": { bottom: -touchHitSize / 2, right: -touchHitSize / 2 },
    };

    return (
      <div
        data-handle={position}
        onMouseDown={(e) => {
          console.log(`[Crop] Handle mousedown: ${position}`);
          handleHandleDown(position, e);
        }}
        onTouchStart={(e) => {
          console.log(`[Crop] Handle touchstart: ${position}, touches=${e.touches.length}`);
          handleHandleDown(position, e);
        }}
        onPointerDown={(e) => {
          console.log(`[Crop] Handle pointerdown: ${position}, pointerId=${e.pointerId}`);
          handleHandleDown(position, e);
        }}
        className="absolute touch-none"
        style={{
          ...positionStyles[position],
          width: touchHitSize,
          height: touchHitSize,
          pointerEvents: "auto",
          zIndex: 50,
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
          touchAction: "none",
          cursor: position.includes("top") && position.includes("left") ? "nwse-resize" :
                  position.includes("top") && position.includes("right") ? "nesw-resize" :
                  position.includes("bottom") && position.includes("left") ? "nesw-resize" :
                  position.includes("bottom") && position.includes("right") ? "nwse-resize" :
                  position.includes("top") || position.includes("bottom") ? "ns-resize" :
                  "ew-resize",
        }}
      >
        {/* Visible indicator dot (smaller than hit area) */}
        <div
          className={`absolute top-1/2 left-1/2 w-3 h-3 rounded-full transition-all pointer-events-none ${
            isActive ? "bg-primary scale-150 shadow-lg" : "bg-white/90 shadow"
          }`}
          style={{ transform: "translate(-50%, -50%)" }}
        />
      </div>
    );
  };

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[99999] flex flex-col select-none"
      style={{
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
        overscrollBehavior: "none",
      }}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchMove={(e) => {
        // iPhone: explicit touchmove for handle dragging
        if (activeHandleRef.current) {
          console.log(`[Crop] Global touchmove fired, active handle=${activeHandleRef.current}`);
          handlePointerMove(e);
        }
      }}
      onTouchEnd={(e) => {
        // iPhone: explicit touchend for handle release
        // CRITICAL: touchend does NOT have e.touches — use e.changedTouches
        console.log(`[Crop] Global touchend fired, changedTouches=${e.changedTouches.length}`);
        handlePointerUp(e);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
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
      <div ref={containerRef} className="flex-1 overflow-hidden relative bg-black flex items-center justify-center" style={{ touchAction: "none" }}>
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
              className="absolute cursor-grab active:cursor-grabbing select-none"
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
                pointerEvents: activeHandleRef.current ? "none" : "auto",
                opacity: 0.3,
                touchAction: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
              }}
              draggable={false}
            />

            {/* Crop frame container */}
            <div
              className="absolute"
              style={{
                left: cropBox.left,
                top: cropBox.top,
                width: cropBox.right - cropBox.left,
                height: cropBox.bottom - cropBox.top,
                border: "2px solid rgba(212, 175, 55, 0.8)",
                zIndex: 20,
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
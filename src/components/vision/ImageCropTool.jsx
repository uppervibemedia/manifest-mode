import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function ImageCropTool({ imageUrl, onSave, onCancel }) {
  const containerRef = useRef(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  const zoomScaleRef = useRef(1);
  const imageOffsetRef = useRef({ x: 0, y: 0 });
  const cropBoxRef = useRef({ top: 0, left: 0, right: 0, bottom: 0 });

  const [zoomScale, setZoomScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [cropBox, setCropBox] = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);

  const activeHandleRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);

  const syncCropBox = (box) => {
    cropBoxRef.current = box;
    setCropBox({ ...box });
  };

  const syncImageOffset = (offset) => {
    imageOffsetRef.current = offset;
    setImageOffset({ ...offset });
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    console.log("[CropTool] Opened — single image layer mode");
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setNaturalSize({ w: nw, h: nh });

    setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const cw = container.offsetWidth;
      const ch = container.offsetHeight;

      // Crop box fills the full canvas area
      const box = { top: 0, left: 0, right: cw, bottom: ch };

      // Scale image to COVER the full canvas (fill, not fit)
      const coverScale = Math.max(cw / nw, ch / nh);
      const scaledW = nw * coverScale;
      const scaledH = nh * coverScale;
      const offsetX = (cw - scaledW) / 2;
      const offsetY = (ch - scaledH) / 2;

      zoomScaleRef.current = coverScale;
      setZoomScale(coverScale);
      syncCropBox(box);
      syncImageOffset({ x: offsetX, y: offsetY });
      setImageLoaded(true);
    }, 80);
  }, []);

  const onHandleDown = useCallback((position, e) => {
    e.preventDefault();
    e.stopPropagation();
    const pt = e.touches?.[0] ?? e;
    activeHandleRef.current = position;
    setActiveHandle(position);
    dragStartRef.current = { x: pt.clientX, y: pt.clientY };
    setIsInteracting(true);
    const cb = cropBoxRef.current;
    console.log(`[CropTool] Handle down: ${position} | crop: T=${cb.top.toFixed(1)} L=${cb.left.toFixed(1)} R=${cb.right.toFixed(1)} B=${cb.bottom.toFixed(1)}`);
  }, []);

  const onHandleMove = useCallback((clientX, clientY) => {
    const handle = activeHandleRef.current;
    if (!handle) return;

    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    dragStartRef.current = { x: clientX, y: clientY };

    const container = containerRef.current;
    if (!container) return;

    const minSize = 60;
    const pad = 8;
    const maxL = pad;
    const maxR = container.offsetWidth - pad;
    const maxT = pad;
    const maxB = container.offsetHeight - pad;

    const cb = cropBoxRef.current;
    const newBox = { top: cb.top, left: cb.left, right: cb.right, bottom: cb.bottom };

    switch (handle) {
      case "top-left":
        newBox.top = Math.max(maxT, Math.min(cb.bottom - minSize, cb.top + dy));
        newBox.left = Math.max(maxL, Math.min(cb.right - minSize, cb.left + dx));
        break;
      case "top-center":
        newBox.top = Math.max(maxT, Math.min(cb.bottom - minSize, cb.top + dy));
        break;
      case "top-right":
        newBox.top = Math.max(maxT, Math.min(cb.bottom - minSize, cb.top + dy));
        newBox.right = Math.min(maxR, Math.max(cb.left + minSize, cb.right + dx));
        break;
      case "middle-left":
        newBox.left = Math.max(maxL, Math.min(cb.right - minSize, cb.left + dx));
        break;
      case "middle-right":
        newBox.right = Math.min(maxR, Math.max(cb.left + minSize, cb.right + dx));
        break;
      case "bottom-left":
        newBox.bottom = Math.min(maxB, Math.max(cb.top + minSize, cb.bottom + dy));
        newBox.left = Math.max(maxL, Math.min(cb.right - minSize, cb.left + dx));
        break;
      case "bottom-center":
        newBox.bottom = Math.min(maxB, Math.max(cb.top + minSize, cb.bottom + dy));
        break;
      case "bottom-right":
        newBox.bottom = Math.min(maxB, Math.max(cb.top + minSize, cb.bottom + dy));
        newBox.right = Math.min(maxR, Math.max(cb.left + minSize, cb.right + dx));
        break;
    }

    syncCropBox(newBox);
  }, []);

  const onImageDown = useCallback((e) => {
    if (activeHandleRef.current) return;
    e.preventDefault();
    const pt = e.touches?.[0] ?? e;
    const off = imageOffsetRef.current;
    dragStartRef.current = { x: pt.clientX - off.x, y: pt.clientY - off.y };
    isPanningRef.current = true;
    setIsInteracting(true);
  }, []);

  const onGlobalMove = useCallback((e) => {
    const pt = e.touches?.[0] ?? e;
    if (activeHandleRef.current) {
      onHandleMove(pt.clientX, pt.clientY);
    } else if (isPanningRef.current) {
      e.preventDefault();
      syncImageOffset({
        x: pt.clientX - dragStartRef.current.x,
        y: pt.clientY - dragStartRef.current.y,
      });
    }
  }, [onHandleMove]);

  const onGlobalUp = useCallback(() => {
    if (activeHandleRef.current) {
      const cb = cropBoxRef.current;
      const off = imageOffsetRef.current;
      console.log(`[CropTool] Handle up: ${activeHandleRef.current} | crop after: T=${cb.top.toFixed(1)} L=${cb.left.toFixed(1)} R=${cb.right.toFixed(1)} B=${cb.bottom.toFixed(1)} | img X=${off.x.toFixed(1)} Y=${off.y.toFixed(1)}`);
    }
    activeHandleRef.current = null;
    setActiveHandle(null);
    isPanningRef.current = false;
    setIsInteracting(false);
  }, []);

  const handleSave = () => {
    const cb = cropBoxRef.current;
    const off = imageOffsetRef.current;
    const scale = zoomScaleRef.current;
    const { w: nw, h: nh } = naturalSize;

    const cropW = cb.right - cb.left;
    const cropH = cb.bottom - cb.top;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, cropW);
    canvas.height = Math.max(1, cropH);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, off.x - cb.left, off.y - cb.top, nw * scale, nh * scale);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        onSave(url, { cropTop: cb.top, cropLeft: cb.left, cropRight: cb.right, cropBottom: cb.bottom, zoomScale: scale, imageOffsetX: off.x, imageOffsetY: off.y });
      }, "image/jpeg", 0.95);
    };
    img.src = imageUrl;
  };

  const handleReset = () => {
    const container = containerRef.current;
    if (!container || !naturalSize.w) return;
    const cw = container.offsetWidth;
    const ch = container.offsetHeight;
    const box = { top: 0, left: 0, right: cw, bottom: ch };
    const coverScale = Math.max(cw / naturalSize.w, ch / naturalSize.h);
    const scaledW = naturalSize.w * coverScale;
    const scaledH = naturalSize.h * coverScale;
    zoomScaleRef.current = coverScale;
    setZoomScale(coverScale);
    syncCropBox(box);
    syncImageOffset({ x: (cw - scaledW) / 2, y: (ch - scaledH) / 2 });
  };

  const cw = cropBox.right - cropBox.left;
  const ch = cropBox.bottom - cropBox.top;

  const CropHandle = ({ position }) => {
    const SIZE = 44;
    const posStyle = {
      "top-left":      { top: -SIZE/2, left: -SIZE/2 },
      "top-center":    { top: -SIZE/2, left: "50%", transform: "translateX(-50%)" },
      "top-right":     { top: -SIZE/2, right: -SIZE/2 },
      "middle-left":   { top: "50%", left: -SIZE/2, transform: "translateY(-50%)" },
      "middle-right":  { top: "50%", right: -SIZE/2, transform: "translateY(-50%)" },
      "bottom-left":   { bottom: -SIZE/2, left: -SIZE/2 },
      "bottom-center": { bottom: -SIZE/2, left: "50%", transform: "translateX(-50%)" },
      "bottom-right":  { bottom: -SIZE/2, right: -SIZE/2 },
    }[position];

    return (
      <div
        data-handle="true"
        onMouseDown={(e) => onHandleDown(position, e)}
        onTouchStart={(e) => onHandleDown(position, e)}
        style={{ position: "absolute", width: SIZE, height: SIZE, zIndex: 30, touchAction: "none", ...posStyle }}
      >
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: activeHandle === position ? 14 : 10,
          height: activeHandle === position ? 14 : 10,
          borderRadius: "50%",
          background: activeHandle === position ? "hsl(var(--primary))" : "rgba(255,255,255,0.9)",
          transform: "translate(-50%, -50%)",
          transition: "width 0.1s, height 0.1s",
        }} />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "#000", zIndex: 99999, display: "flex", flexDirection: "column", userSelect: "none" }}
      onMouseMove={onGlobalMove}
      onMouseUp={onGlobalUp}
      onMouseLeave={onGlobalUp}
      onTouchMove={onGlobalMove}
      onTouchEnd={onGlobalUp}
    >
      {/* Header */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={onCancel} style={{ color: "#fff", background: "none", border: "none", padding: 8, cursor: "pointer", lineHeight: 1 }}>
          <X className="w-6 h-6" />
        </button>
        <p style={{ color: "#fff", fontWeight: 600, fontSize: 14, margin: 0 }}>Crop Image</p>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={handleReset} style={{ color: "#888", background: "none", border: "none", padding: "8px 12px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            Reset
          </button>
          <button onClick={handleSave} style={{ color: "hsl(var(--primary))", background: "none", border: "none", padding: "8px 16px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            Done
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden", background: "#000" }}>
        {/* Hidden loader img */}
        {!imageLoaded && (
          <img src={imageUrl} alt="" onLoad={handleImageLoad} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} draggable={false} />
        )}

        {imageLoaded && (
          <>
            {/* SINGLE IMAGE LAYER */}
            <img
              src={imageUrl}
              alt="crop"
              draggable={false}
              onMouseDown={onImageDown}
              onTouchStart={onImageDown}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: naturalSize.w,
                height: naturalSize.h,
                transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${zoomScale})`,
                transformOrigin: "0 0",
                cursor: isPanningRef.current ? "grabbing" : "grab",
                pointerEvents: "auto",
                touchAction: "none",
              }}
            />

            {/* DIM OVERLAY — 4 rects, no duplicate image */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: cropBox.top, background: "rgba(0,0,0,0.65)", pointerEvents: "none", zIndex: 10 }} />
            <div style={{ position: "absolute", top: cropBox.bottom, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.65)", pointerEvents: "none", zIndex: 10 }} />
            <div style={{ position: "absolute", top: cropBox.top, left: 0, width: cropBox.left, height: ch, background: "rgba(0,0,0,0.65)", pointerEvents: "none", zIndex: 10 }} />
            <div style={{ position: "absolute", top: cropBox.top, left: cropBox.right, right: 0, height: ch, background: "rgba(0,0,0,0.65)", pointerEvents: "none", zIndex: 10 }} />

            {/* CROP BORDER */}
            <div style={{ position: "absolute", left: cropBox.left, top: cropBox.top, width: cw, height: ch, border: "2px solid rgba(212,175,55,0.85)", zIndex: 20, pointerEvents: "none" }}>
              {isInteracting && (
                <>
                  <div style={{ position: "absolute", left: 0, right: 0, top: "33.33%", height: 1, background: "rgba(255,255,255,0.2)" }} />
                  <div style={{ position: "absolute", left: 0, right: 0, top: "66.66%", height: 1, background: "rgba(255,255,255,0.2)" }} />
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: "33.33%", width: 1, background: "rgba(255,255,255,0.2)" }} />
                  <div style={{ position: "absolute", top: 0, bottom: 0, left: "66.66%", width: 1, background: "rgba(255,255,255,0.2)" }} />
                </>
              )}
            </div>

            {/* HANDLES */}
            <div style={{ position: "absolute", left: cropBox.left, top: cropBox.top, width: cw, height: ch, zIndex: 25 }}>
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
        )}

        {!imageLoaded && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 32, height: 32, border: "2px solid rgba(212,175,55,0.3)", borderTopColor: "hsl(var(--primary))", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
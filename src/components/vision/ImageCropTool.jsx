import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function ImageCropTool({ imageUrl, onSave, onCancel }) {
  const containerRef = useRef(null);

  // All mutable state kept in refs to avoid stale closures in event handlers
  const cropBoxRef = useRef({ top: 0, left: 0, right: 0, bottom: 0 });
  const imageOffsetRef = useRef({ x: 0, y: 0 });
  const zoomScaleRef = useRef(1);
  const imageDimsRef = useRef({ width: 0, height: 0 });
  const activeHandleRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const imageElementRef = useRef(null); // the actual <img> DOM element loaded

  // React state only for triggering re-renders
  const [ready, setReady] = useState(false);
  const [, forceUpdate] = useState(0);
  const redraw = useCallback(() => forceUpdate(n => n + 1), []);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageElementRef.current = img;
      imageDimsRef.current = { width: img.width, height: img.height };

      setTimeout(() => {
        const container = containerRef.current;
        if (!container) return;

        const cw = container.offsetWidth;
        const ch = container.offsetHeight;
        const padding = 48;

        // Crop box: centered, comfortable size
        const cropW = Math.min(cw - padding, 320);
        const cropH = Math.min(ch - padding, 420);
        const cropLeft = (cw - cropW) / 2;
        const cropTop = (ch - cropH) / 2;

        cropBoxRef.current = {
          top: cropTop,
          left: cropLeft,
          right: cropLeft + cropW,
          bottom: cropTop + cropH,
        };

        // Scale image to fill the crop box
        const scaleX = cropW / img.width;
        const scaleY = cropH / img.height;
        const scale = Math.max(scaleX, scaleY); // fill (not fit) so no gaps
        zoomScaleRef.current = scale;

        // Center image within crop box
        const scaledW = img.width * scale;
        const scaledH = img.height * scale;
        imageOffsetRef.current = {
          x: cropLeft + (cropW - scaledW) / 2,
          y: cropTop + (cropH - scaledH) / 2,
        };

        setReady(true);
      }, 80);
    };
    img.onerror = () => console.error("ImageCropTool: failed to load image");
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

  // ─── Handle drag ────────────────────────────────────────────────────────────

  const getClient = (e) => {
    const t = e.touches?.[0] || e.changedTouches?.[0];
    return { x: t?.clientX ?? e.clientX, y: t?.clientY ?? e.clientY };
  };

  const onHandleDown = useCallback((position, e) => {
    e.preventDefault();
    e.stopPropagation();
    activeHandleRef.current = position;
    isPanningRef.current = false;
    const { x, y } = getClient(e);
    dragStartRef.current = { x, y };
  }, []);

  const onImageDown = useCallback((e) => {
    if (activeHandleRef.current) return;
    e.preventDefault();
    isPanningRef.current = true;
    const { x, y } = getClient(e);
    dragStartRef.current = {
      x: x - imageOffsetRef.current.x,
      y: y - imageOffsetRef.current.y,
    };
  }, []);

  const onMove = useCallback((e) => {
    const { x, y } = getClient(e);

    if (activeHandleRef.current) {
      e.preventDefault();
      const dx = x - dragStartRef.current.x;
      const dy = y - dragStartRef.current.y;
      dragStartRef.current = { x, y };

      const box = cropBoxRef.current;
      const container = containerRef.current;
      if (!container) return;

      const minSize = 60;
      const edge = 8;
      const maxR = container.offsetWidth - edge;
      const maxB = container.offsetHeight - edge;
      const newBox = { ...box };
      const handle = activeHandleRef.current;

      if (handle.includes("top")) {
        newBox.top = Math.max(edge, Math.min(box.bottom - minSize, box.top + dy));
      }
      if (handle.includes("bottom")) {
        newBox.bottom = Math.min(maxB, Math.max(box.top + minSize, box.bottom + dy));
      }
      if (handle.includes("left")) {
        newBox.left = Math.max(edge, Math.min(box.right - minSize, box.left + dx));
      }
      if (handle.includes("right")) {
        newBox.right = Math.min(maxR, Math.max(box.left + minSize, box.right + dx));
      }

      cropBoxRef.current = newBox;
      redraw();
      return;
    }

    if (isPanningRef.current) {
      e.preventDefault();
      imageOffsetRef.current = {
        x: x - dragStartRef.current.x,
        y: y - dragStartRef.current.y,
      };
      redraw();
    }
  }, [redraw]);

  const onUp = useCallback(() => {
    activeHandleRef.current = null;
    isPanningRef.current = false;
  }, []);

  // ─── Save ────────────────────────────────────────────────────────────────────

  const handleSave = () => {
    const img = imageElementRef.current;
    if (!img) return;

    const box = cropBoxRef.current;
    const offset = imageOffsetRef.current;
    const scale = zoomScaleRef.current;
    const cropW = box.right - box.left;
    const cropH = box.bottom - box.top;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, cropW);
    canvas.height = Math.max(1, cropH);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      img,
      offset.x - box.left,
      offset.y - box.top,
      img.width * scale,
      img.height * scale
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onSave(URL.createObjectURL(blob), {});
      },
      "image/jpeg",
      0.95
    );
  };

  // ─── Reset ───────────────────────────────────────────────────────────────────

  const handleReset = () => {
    const container = containerRef.current;
    const img = imageElementRef.current;
    if (!container || !img) return;

    const cw = container.offsetWidth;
    const ch = container.offsetHeight;
    const padding = 48;
    const cropW = Math.min(cw - padding, 320);
    const cropH = Math.min(ch - padding, 420);
    const cropLeft = (cw - cropW) / 2;
    const cropTop = (ch - cropH) / 2;

    cropBoxRef.current = { top: cropTop, left: cropLeft, right: cropLeft + cropW, bottom: cropTop + cropH };

    const scaleX = cropW / img.width;
    const scaleY = cropH / img.height;
    const scale = Math.max(scaleX, scaleY);
    zoomScaleRef.current = scale;

    const scaledW = img.width * scale;
    const scaledH = img.height * scale;
    imageOffsetRef.current = {
      x: cropLeft + (cropW - scaledW) / 2,
      y: cropTop + (cropH - scaledH) / 2,
    };

    redraw();
  };

  // ─── Derived values for render ────────────────────────────────────────────────

  const box = cropBoxRef.current;
  const offset = imageOffsetRef.current;
  const scale = zoomScaleRef.current;
  const dims = imageDimsRef.current;

  const handles = [
    "top-left", "top-center", "top-right",
    "middle-left", "middle-right",
    "bottom-left", "bottom-center", "bottom-right",
  ];

  const handleStyle = (pos) => {
    const size = 44;
    const half = size / 2;
    const base = { position: "absolute", width: size, height: size, zIndex: 30, touchAction: "none", cursor: "pointer" };
    if (pos === "top-left")      return { ...base, top: -half, left: -half };
    if (pos === "top-center")    return { ...base, top: -half, left: "50%", transform: "translateX(-50%)" };
    if (pos === "top-right")     return { ...base, top: -half, right: -half };
    if (pos === "middle-left")   return { ...base, top: "50%", left: -half, transform: "translateY(-50%)" };
    if (pos === "middle-right")  return { ...base, top: "50%", right: -half, transform: "translateY(-50%)" };
    if (pos === "bottom-left")   return { ...base, bottom: -half, left: -half };
    if (pos === "bottom-center") return { ...base, bottom: -half, left: "50%", transform: "translateX(-50%)" };
    if (pos === "bottom-right")  return { ...base, bottom: -half, right: -half };
    return base;
  };

  const cropW = box.right - box.left;
  const cropH = box.bottom - box.top;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[99999] flex flex-col select-none"
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchMove={onMove}
      onTouchEnd={onUp}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10">
        <button onClick={onCancel} className="text-white hover:text-primary transition-colors p-2 -ml-2">
          <X className="w-6 h-6" />
        </button>
        <p className="text-sm font-semibold text-white">Crop Image</p>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="text-white/50 hover:text-primary transition-colors font-semibold text-sm px-3 py-2">
            Reset
          </button>
          <button onClick={handleSave} className="text-primary hover:text-primary/80 transition-colors font-semibold text-sm px-4 py-2">
            Done
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-black"
        style={{ touchAction: "none" }}
      >
        {!ready ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Dark overlay: 4 rectangles around the crop box ── */}
            {/* Top */}
            <div className="absolute bg-black/70 pointer-events-none" style={{ top: 0, left: 0, right: 0, height: box.top }} />
            {/* Bottom */}
            <div className="absolute bg-black/70 pointer-events-none" style={{ top: box.bottom, left: 0, right: 0, bottom: 0 }} />
            {/* Left */}
            <div className="absolute bg-black/70 pointer-events-none" style={{ top: box.top, left: 0, width: box.left, height: cropH }} />
            {/* Right */}
            <div className="absolute bg-black/70 pointer-events-none" style={{ top: box.top, left: box.right, right: 0, height: cropH }} />

            {/* ── Crop preview box (clipped image, no duplicate) ── */}
            <div
              style={{
                position: "absolute",
                left: box.left,
                top: box.top,
                width: cropW,
                height: cropH,
                overflow: "hidden",
                border: "2px solid rgba(212,175,55,0.85)",
                boxSizing: "border-box",
                zIndex: 10,
              }}
              onMouseDown={onImageDown}
              onTouchStart={onImageDown}
            >
              <img
                src={imageUrl}
                alt="crop"
                draggable={false}
                style={{
                  position: "absolute",
                  left: offset.x - box.left,
                  top: offset.y - box.top,
                  width: dims.width * scale,
                  height: dims.height * scale,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            </div>

            {/* ── Crop handles ── */}
            <div
              className="absolute"
              style={{ left: box.left, top: box.top, width: cropW, height: cropH, zIndex: 20, pointerEvents: "none" }}
            >
              {handles.map((pos) => (
                <div
                  key={pos}
                  style={handleStyle(pos)}
                  onMouseDown={(e) => onHandleDown(pos, e)}
                  onTouchStart={(e) => onHandleDown(pos, e)}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "white",
                      boxShadow: "0 0 4px rgba(0,0,0,0.5)",
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
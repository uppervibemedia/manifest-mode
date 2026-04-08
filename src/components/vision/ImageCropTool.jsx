import { useState, useRef, useEffect } from "react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function ImageCropTool({ imageUrl, onSave, onCancel }) {
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const [image, setImage] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [zoomScale, setZoomScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

  const [cropBox, setCropBox] = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  const [isInteracting, setIsInteracting] = useState(false);

  const [activeHandle, setActiveHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load image and initialize
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImage(img);
      setImageDimensions({ width: img.width, height: img.height });

      setTimeout(() => {
        const container = containerRef.current;
        if (!container) return;

        const padding = 60;
        const cropWidth = Math.min(container.offsetWidth - padding, 300);
        const cropHeight = Math.min(container.offsetHeight - padding, 400);
        const left = (container.offsetWidth - cropWidth) / 2;
        const top = (container.offsetHeight - cropHeight) / 2;

        setCropBox({ top, left, right: left + cropWidth, bottom: top + cropHeight });

        const fitScale = Math.min(cropWidth / img.width, cropHeight / img.height);
        const scaledWidth = img.width * fitScale;
        const scaledHeight = img.height * fitScale;
        setZoomScale(fitScale);
        setImageOffset({
          x: left + (cropWidth - scaledWidth) / 2,
          y: top + (cropHeight - scaledHeight) / 2,
        });
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

  // Image pan
  const handleTouchStart = (e) => {
    if (e.target.closest("[data-handle]")) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - imageOffset.x, y: touch.clientY - imageOffset.y });
      setIsInteracting(true);
    }
  };

  const handleTouchMove = (e) => {
    if (activeHandle) return;
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      setImageOffset({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
    }
  };

  const handleTouchEnd = () => setIsInteracting(false);

  // Crop handle drag
  const handleHandleDown = (position, e) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches?.[0];
    setActiveHandle(position);
    setDragStart({ x: touch?.clientX ?? e.clientX, y: touch?.clientY ?? e.clientY });
    setIsInteracting(true);
  };

  const handleHandleMove = (clientX, clientY) => {
    if (!activeHandle) return;
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    const min = 80;
    const pad = 10;
    const container = containerRef.current;
    if (!container) return;

    const maxR = container.offsetWidth - pad;
    const maxB = container.offsetHeight - pad;
    const b = { ...cropBox };

    switch (activeHandle) {
      case "top-left":
        b.top = Math.max(pad, Math.min(b.bottom - min, b.top + dy));
        b.left = Math.max(pad, Math.min(b.right - min, b.left + dx));
        break;
      case "top-center":
        b.top = Math.max(pad, Math.min(b.bottom - min, b.top + dy));
        break;
      case "top-right":
        b.top = Math.max(pad, Math.min(b.bottom - min, b.top + dy));
        b.right = Math.min(maxR, Math.max(b.left + min, b.right + dx));
        break;
      case "middle-left":
        b.left = Math.max(pad, Math.min(b.right - min, b.left + dx));
        break;
      case "middle-right":
        b.right = Math.min(maxR, Math.max(b.left + min, b.right + dx));
        break;
      case "bottom-left":
        b.bottom = Math.min(maxB, Math.max(b.top + min, b.bottom + dy));
        b.left = Math.max(pad, Math.min(b.right - min, b.left + dx));
        break;
      case "bottom-center":
        b.bottom = Math.min(maxB, Math.max(b.top + min, b.bottom + dy));
        break;
      case "bottom-right":
        b.bottom = Math.min(maxB, Math.max(b.top + min, b.bottom + dy));
        b.right = Math.min(maxR, Math.max(b.left + min, b.right + dx));
        break;
    }

    setCropBox(b);
    setDragStart({ x: clientX, y: clientY });
  };

  const handlePointerMove = (e) => {
    if (!activeHandle && !isInteracting) return;
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;

    if (activeHandle) {
      handleHandleMove(clientX, clientY);
    } else {
      setImageOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
    }
  };

  const handlePointerUp = () => {
    setActiveHandle(null);
    setIsInteracting(false);
  };

  // Save
  const handleSave = () => {
    if (!imageRef.current) return;
    const cropWidth = cropBox.right - cropBox.left;
    const cropHeight = cropBox.bottom - cropBox.top;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, cropWidth);
    canvas.height = Math.max(1, cropHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      imageRef.current,
      imageOffset.x - cropBox.left,
      imageOffset.y - cropBox.top,
      imageDimensions.width * zoomScale,
      imageDimensions.height * zoomScale
    );
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onSave(URL.createObjectURL(blob), {
          cropTop: cropBox.top, cropLeft: cropBox.left,
          cropRight: cropBox.right, cropBottom: cropBox.bottom,
          zoomScale, imageOffsetX: imageOffset.x, imageOffsetY: imageOffset.y,
        });
      },
      "image/jpeg",
      0.95
    );
  };

  const handleReset = () => {
    const container = containerRef.current;
    if (!container || !image) return;
    const padding = 60;
    const cropWidth = Math.min(container.offsetWidth - padding, 300);
    const cropHeight = Math.min(container.offsetHeight - padding, 400);
    const left = (container.offsetWidth - cropWidth) / 2;
    const top = (container.offsetHeight - cropHeight) / 2;
    setCropBox({ top, left, right: left + cropWidth, bottom: top + cropHeight });
    setImageOffset({
      x: left + (cropWidth - imageDimensions.width * zoomScale) / 2,
      y: top + (cropHeight - imageDimensions.height * zoomScale) / 2,
    });
  };

  // 8-handle crop control
  const CropHandle = ({ position }) => {
    const s = 40;
    const posStyle = {
      "top-left":      { top: -s/2, left: -s/2 },
      "top-center":    { top: -s/2, left: "50%", transform: "translateX(-50%)" },
      "top-right":     { top: -s/2, right: -s/2 },
      "middle-left":   { top: "50%", left: -s/2, transform: "translateY(-50%)" },
      "middle-right":  { top: "50%", right: -s/2, transform: "translateY(-50%)" },
      "bottom-left":   { bottom: -s/2, left: -s/2 },
      "bottom-center": { bottom: -s/2, left: "50%", transform: "translateX(-50%)" },
      "bottom-right":  { bottom: -s/2, right: -s/2 },
    }[position];

    return (
      <div
        data-handle
        onMouseDown={(e) => handleHandleDown(position, e)}
        onTouchStart={(e) => handleHandleDown(position, e)}
        className="absolute z-30 touch-none"
        style={{ ...posStyle, width: s, height: s, pointerEvents: "auto" }}
      >
        <div
          className={`absolute top-1/2 left-1/2 w-3 h-3 rounded-full border-2 border-white transition-all ${
            activeHandle === position ? "bg-primary scale-125" : "bg-white/80"
          }`}
          style={{ transform: "translate(-50%, -50%)" }}
        />
      </div>
    );
  };

  const cw = cropBox.right - cropBox.left;
  const ch = cropBox.bottom - cropBox.top;

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

      {/* Crop Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-black"
        onMouseDown={(e) => {
          if (e.target.closest("[data-handle]")) return;
          setDragStart({ x: e.clientX - imageOffset.x, y: e.clientY - imageOffset.y });
          setIsInteracting(true);
        }}
        onTouchStart={handleTouchStart}
      >
        {image ? (
          <>
            {/* ── SINGLE IMAGE SOURCE ── */}
            <img
              src={imageUrl}
              alt="crop"
              draggable={false}
              className="absolute pointer-events-none"
              style={{
                top: imageOffset.y,
                left: imageOffset.x,
                width: imageDimensions.width * zoomScale,
                height: imageDimensions.height * zoomScale,
              }}
            />

            {/* ── DIM OVERLAY: 4 rects around the crop box ── */}
            {/* Top */}
            <div className="absolute pointer-events-none bg-black/65"
              style={{ top: 0, left: 0, right: 0, height: cropBox.top }} />
            {/* Bottom */}
            <div className="absolute pointer-events-none bg-black/65"
              style={{ top: cropBox.bottom, left: 0, right: 0, bottom: 0 }} />
            {/* Left */}
            <div className="absolute pointer-events-none bg-black/65"
              style={{ top: cropBox.top, left: 0, width: cropBox.left, height: ch }} />
            {/* Right */}
            <div className="absolute pointer-events-none bg-black/65"
              style={{ top: cropBox.top, left: cropBox.right, right: 0, height: ch }} />

            {/* ── CROP FRAME ── */}
            <div
              className="absolute"
              style={{
                left: cropBox.left,
                top: cropBox.top,
                width: cw,
                height: ch,
                border: "2px solid rgba(212, 175, 55, 0.9)",
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              {/* Rule of thirds grid */}
              {isInteracting && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute w-full h-px top-1/3 bg-white/25" />
                  <div className="absolute w-full h-px top-2/3 bg-white/25" />
                  <div className="absolute h-full w-px left-1/3 bg-white/25" />
                  <div className="absolute h-full w-px left-2/3 bg-white/25" />
                </div>
              )}
            </div>

            {/* ── HANDLES (pointer-events on, above frame) ── */}
            <div
              className="absolute"
              style={{ left: cropBox.left, top: cropBox.top, width: cw, height: ch, zIndex: 20 }}
            >
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
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
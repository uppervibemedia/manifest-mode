export default function CropHandle({ position, activeHandle, onHandleDown, touchHitSize = 88 }) {
  const isActive = activeHandle === position;
  
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
        onHandleDown(position, e);
      }}
      onTouchStart={(e) => {
        console.log(`[Crop] Handle touchstart: ${position}, touches=${e.touches.length}`);
        onHandleDown(position, e);
      }}
      onPointerDown={(e) => {
        console.log(`[Crop] Handle pointerdown: ${position}, pointerId=${e.pointerId}`);
        onHandleDown(position, e);
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
}
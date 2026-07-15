'use client';

import { useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

// Full-screen image preview with zoom (buttons / wheel) and drag-to-pan.
export default function Lightbox({
  src,
  caption,
  onClose,
}: {
  src: string;
  caption?: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);

  const clamp = (s: number) => Math.min(5, Math.max(1, s));
  const zoom = (d: number) =>
    setScale((s) => {
      const ns = clamp(Math.round((s + d) * 10) / 10);
      if (ns === 1) setPos({ x: 0, y: 0 });
      return ns;
    });
  const reset = () => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    drag.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current) return;
    setPos({ x: drag.current.px + (e.clientX - drag.current.sx), y: drag.current.py + (e.clientY - drag.current.sy) });
  };
  const onMouseUp = () => (drag.current = null);

  const btn = 'rounded-full bg-white/10 p-2 text-white hover:bg-white/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      <div className="absolute right-5 top-5 z-10 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => zoom(-0.3)} className={btn} aria-label="Zoom out"><ZoomOut className="h-5 w-5" /></button>
        <button onClick={reset} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">{Math.round(scale * 100)}%</button>
        <button onClick={() => zoom(0.3)} className={btn} aria-label="Zoom in"><ZoomIn className="h-5 w-5" /></button>
        <button onClick={onClose} className={btn} aria-label="Close"><X className="h-5 w-5" /></button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        onMouseDown={onMouseDown}
        onWheel={(e) => zoom(e.deltaY < 0 ? 0.2 : -0.2)}
        draggable={false}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`, cursor: scale > 1 ? 'grab' : 'default' }}
        className="max-h-[90vh] max-w-[90vw] select-none rounded-lg object-contain transition-transform duration-75"
      />
      {caption && (
        // absolute so it never interferes with the image's zoom/pan transform
        <p className="pointer-events-none absolute bottom-6 left-1/2 max-w-[80vw] -translate-x-1/2 rounded-lg bg-black/60 px-4 py-2 text-center text-sm text-neutral-100">
          {caption}
        </p>
      )}
    </div>
  );
}
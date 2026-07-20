// components/dashboard/MemorialRail.tsx
// My Memorials: at most 3 cards across, anything past that scrolls sideways
// rather than wrapping onto a second row.
//
// Three ways to move the rail, all driving the same scrollLeft:
//   1. Arrow buttons (desktop) — one card per click, smooth.
//   2. Mouse wheel — vertical wheel translated to horizontal scroll.
//   3. Click-and-drag pan (mouse only) — touch keeps its native swipe.
//
// This owns the heading as well as the rail because the arrow buttons sit in
// the heading but drive the rail's scroll position — splitting them would mean
// lifting the ref into the page and handing it back down.
'use client';

import {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SectionHeading from './SectionHeading';

export const MEMORIAL_RAIL_VISIBLE = 3;
export const MEMORIAL_CARD_WIDTH =
  'shrink-0 basis-[86%] sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]';

const RAIL_GAP_PX = 16;

const DRAG_THRESHOLD_PX = 4;

interface MemorialRailProps {
  itemCount: number;
  headerAction?: ReactNode;
  children: ReactNode;
}

export default function MemorialRail({
  itemCount,
  headerAction,
  children,
}: MemorialRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  const [dragging, setDragging] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => setCanScroll(rail.scrollWidth - rail.clientWidth > 1);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(rail);
    return () => ro.disconnect();
  }, [itemCount]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const overflow = rail.scrollWidth - rail.clientWidth;
      if (overflow <= 0) return;

      const atStart = rail.scrollLeft <= 0;
      const atEnd = rail.scrollLeft >= overflow - 1;
      
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;

      e.preventDefault();
      rail.scrollLeft += e.deltaY;
    };

    rail.addEventListener('wheel', onWheel, { passive: false });
    return () => rail.removeEventListener('wheel', onWheel);
  }, []);

  // --- arrow buttons --------------------------------------------------------
  const scrollRail = useCallback((direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + RAIL_GAP_PX : rail.clientWidth;
    rail.scrollBy({ left: direction * step, behavior: 'smooth' });
  }, []);

  // --- click-and-drag pan (mouse only) --------------------------------------
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Touch/pen keep their native swipe + snap; only take over the mouse.
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const rail = railRef.current;
    if (!rail) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startLeft: rail.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const rail = railRef.current;
    if (!rail) return;

    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) <= DRAG_THRESHOLD_PX) return;

    if (!drag.current.moved) {
      drag.current.moved = true;
      setDragging(true);
      rail.setPointerCapture(e.pointerId);
    }
    rail.scrollLeft = drag.current.startLeft - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    const rail = railRef.current;
    if (rail?.hasPointerCapture(e.pointerId)) {
      rail.releasePointerCapture(e.pointerId);
    }
  };

  // Swallow the synthetic click that follows a drag so releasing the mouse over
  // a card doesn't open it or fire one of its action buttons.
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const railClasses = [
    'flex gap-4 overflow-x-auto -mx-1 px-1 py-1 [scrollbar-width:thin]',
    dragging ? 'select-none' : '',
    canScroll ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      <SectionHeading
        action={
          <div className="flex items-center gap-2">
            {canScroll && (
              <div className="hidden lg:flex items-center gap-1.5">
                <button
                  onClick={() => scrollRail(-1)}
                  aria-label="Scroll memorials left"
                  className="w-8 h-8 rounded-lg border border-neutral-200 bg-white text-neutral-500 flex items-center justify-center hover:border-[#c3195d] hover:text-[#c3195d] transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => scrollRail(1)}
                  aria-label="Scroll memorials right"
                  className="w-8 h-8 rounded-lg border border-neutral-200 bg-white text-neutral-500 flex items-center justify-center hover:border-[#c3195d] hover:text-[#c3195d] transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            {headerAction}
          </div>
        }
      >
        My Memorials
      </SectionHeading>

      <div
        ref={railRef}
        className={railClasses}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        // Stop the browser's native image drag-ghost from hijacking the pan.
        onDragStart={(e) => e.preventDefault()}
      >
        {children}
      </div>
    </div>
  );
}
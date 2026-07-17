// components/dashboard/MemorialRail.tsx
// My Memorials: at most 3 cards across, anything past that scrolls sideways
// rather than wrapping onto a second row.
//
// This owns the heading as well as the rail because the arrow buttons sit in
// the heading but drive the rail's scroll position — splitting them would mean
// lifting the ref into the page and handing it back down.
'use client';

import { ReactNode, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SectionHeading from './SectionHeading';

/** Cards past this count are reachable by scrolling, not by wrapping. */
export const MEMORIAL_RAIL_VISIBLE = 3;

/**
 * gap-4 === 1rem, so 3 cards share (100% - 2rem) and 2 share (100% - 1rem).
 * Width is a fixed fraction regardless of count, so cards stay uniform and a
 * 4th peeks in at the right edge to signal the rail scrolls.
 *
 * Exported so the loading skeleton can size its placeholders identically —
 * otherwise the layout jumps when real data lands.
 */
export const MEMORIAL_CARD_WIDTH =
  'shrink-0 snap-start basis-[86%] sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]';

/** Matches gap-4. Kept next to the class above so the two can't drift apart. */
const RAIL_GAP_PX = 16;

interface MemorialRailProps {
  /**
   * Card count. Explicit rather than React.Children.count(children): children
   * arrive as a single mapped array, and counting leaves through it is a
   * subtlety no one should have to remember when editing this.
   */
  itemCount: number;
  /** Extra heading controls, e.g. an Add Memorial button. */
  headerAction?: ReactNode;
  children: ReactNode;
}

export default function MemorialRail({
  itemCount,
  headerAction,
  children,
}: MemorialRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);

  const scrollRail = useCallback((direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    // Measure the live card instead of assuming a pixel width — the basis
    // changes at every breakpoint, so a hardcoded step would misalign.
    const card = rail.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + RAIL_GAP_PX : rail.clientWidth;
    rail.scrollBy({ left: direction * step, behavior: 'smooth' });
  }, []);

  const scrollable = itemCount > MEMORIAL_RAIL_VISIBLE;

  return (
    <div>
      <SectionHeading
        action={
          <div className="flex items-center gap-2">
            {/* Desktop only — touch devices swipe, and the arrows would just
                eat space next to the Add button. */}
            {scrollable && (
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

      {/* -mx-1 px-1 py-1 gives the cards' hover shadow and active ring room to
          render — overflow-x-auto clips them flush otherwise. */}
      <div
        ref={railRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-1 px-1 py-1 [scrollbar-width:thin]"
      >
        {children}
      </div>
    </div>
  );
}
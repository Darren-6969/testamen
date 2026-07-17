// components/dashboard/MemorialRailCard.tsx
// One memorial inside the My Memorials rail.
//
// Named MemorialRailCard, not MemorialCard: components/public/MemorialCard.tsx
// already exists for the public visitor page and takes an entirely different
// shape (candles, excerpt, relationship). Two files named MemorialCard would
// coexist but read as a trap in the import list.
'use client';

import { ExternalLink, FileText, Edit, User } from 'lucide-react';
import { DashboardMemorial } from '@/app/data/dashboard';
import DashboardCard from './DashboardCard';
import { MEMORIAL_CARD_WIDTH } from './MemorialRail';
import { formatDate } from './formatDate';

const ICON_BUTTON =
  'w-8 h-8 rounded-lg bg-pink-50 text-[#c3195d] flex items-center justify-center disabled:opacity-40';

interface MemorialRailCardProps {
  memorial: DashboardMemorial;
  active: boolean;
  onSelect: () => void;
  /** Null disables the button — the public site isn't built yet. */
  onViewSite: (() => void) | null;
  onOpenObituary: () => void;
  onOpenAdmin: () => void;
}

export default function MemorialRailCard({
  memorial: m,
  active,
  onSelect,
  onViewSite,
  onOpenObituary,
  onOpenAdmin,
}: MemorialRailCardProps) {
  return (
    <DashboardCard
      padding="sm"
      interactive
      selected={active}
      onClick={onSelect}
      className={MEMORIAL_CARD_WIDTH}
    >
      <div className="flex gap-3 items-start">
        <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 overflow-hidden">
          {m.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
          ) : (
            <User size={20} className="text-neutral-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900 text-sm">{m.name}</p>
          <p className="text-xs text-neutral-500 mt-1">
            Date of Departure: {formatDate(m.dateOfDeparture)}
          </p>
          <p className="text-xs text-neutral-500">
            Place of Rest: {m.placeOfRest || '—'}
          </p>

          {/* stopPropagation on every action: the card itself is a select
              target, so a bare click would also re-select the memorial. */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewSite?.();
              }}
              disabled={!onViewSite}
              title="View public site"
              className={ICON_BUTTON}
            >
              <ExternalLink size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenObituary();
              }}
              title="Obituary"
              className={ICON_BUTTON}
            >
              <FileText size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenAdmin();
              }}
              title="Edit in Admin"
              className={ICON_BUTTON}
            >
              <Edit size={15} />
            </button>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
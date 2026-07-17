// components/setting/PlanCard.tsx
// Vertical pricing card. One per tier, laid out side by side.
//
// state mirrors the legacy pricing table's three button states:
//   current     -> "CURRENT PLAN"  (legacy: pink button)
//   unavailable -> "NOT AVAILABLE" (legacy: grey button — ranked at or below the
//                                   highest plan ever purchased; no downgrades)
//   upgradable  -> "BUY <PLAN>"    (legacy: blue button)
'use client';

import { Check, HardDrive } from 'lucide-react';

export type PlanState = 'current' | 'unavailable' | 'upgradable';

interface PlanCardProps {
  name: string;
  /** 0 renders as "Free" instead of a price. */
  priceRm: number;
  /**
   * Base allowance straight from mt_feature.storage_mb — the single source of
   * truth for a tier's storage. Referral bonuses are configured admin-side and
   * are deliberately not surfaced here.
   */
  storageMb: number;
  tagline: string;
  features: string[];
  state: PlanState;
  /** Optional pill in the top-right, e.g. "Popular". */
  badge?: string;
  onUpgrade?: () => void;
  /** Upgrade stays disabled until the payment flow exists. */
  upgradeDisabled?: boolean;
}

/** 1024 -> "1 GB", 500 -> "500 MB". */
function formatStorage(mb: number): string {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${gb.toFixed(Number.isInteger(gb) ? 0 : 1)} GB`;
  }
  return `${mb} MB`;
}

export default function PlanCard({
  name,
  priceRm,
  storageMb,
  tagline,
  features,
  state,
  badge,
  onUpgrade,
  upgradeDisabled = false,
}: PlanCardProps) {
  const isCurrent = state === 'current';

  return (
    <div
      className={`flex flex-col rounded-2xl border p-6 transition-colors ${
        isCurrent
          ? 'border-[#c3195d] ring-1 ring-[#c3195d] bg-pink-50/40'
          : 'border-[var(--border-color)] bg-[var(--card-bg)]'
      }`}
    >
      {/* Name + badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xl font-semibold text-[var(--card-text)]">{name}</h3>
        {badge && (
          <span className="shrink-0 rounded-full bg-[#c3195d] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {badge}
          </span>
        )}
      </div>

      {/* Price */}
      <div className="mt-4 flex items-baseline gap-1">
        {priceRm > 0 ? (
          <>
            <span className="text-sm text-[var(--form-text-caption)]">RM</span>
            <span className="text-4xl font-bold text-[var(--card-text)]">{priceRm}</span>
            <span className="ml-1 text-xs text-[var(--form-text-caption)]">Life-time</span>
          </>
        ) : (
          <span className="text-4xl font-bold text-[var(--card-text)]">Free</span>
        )}
      </div>

      <p className="mt-3 text-sm font-medium text-[var(--card-text)]">{tagline}</p>

      {/* CTA */}
      <div className="mt-5">
        {state === 'current' && (
          <button
            type="button"
            disabled
            className="w-full rounded-full border border-[#c3195d] px-4 py-2.5 text-sm font-medium text-[#c3195d] cursor-default"
          >
            Your current plan
          </button>
        )}

        {state === 'unavailable' && (
          <button
            type="button"
            disabled
            title="You cannot move to a plan you have already passed"
            className="w-full rounded-full border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed"
          >
            Not available
          </button>
        )}

        {state === 'upgradable' && (
          <button
            type="button"
            onClick={onUpgrade}
            disabled={upgradeDisabled}
            title={upgradeDisabled ? 'Payment flow not available yet' : undefined}
            className="w-full rounded-full bg-[#c3195d] px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#c3195d]"
          >
            Upgrade to {name}
          </button>
        )}
      </div>

      {/* Storage is the only thing that actually differs between tiers in the
          legacy pricing table, so it gets its own row above the shared list. */}
      <div className="mt-6 flex items-start gap-2">
        <HardDrive size={16} className="mt-0.5 shrink-0 text-[#c3195d]" />
        <span className="text-sm font-medium text-[var(--card-text)]">
          {formatStorage(storageMb)} storage
        </span>
      </div>

      <ul className="mt-3 space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 shrink-0 text-[#c3195d]" />
            <span className="text-sm text-[var(--form-text-caption)]">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
// components/dashboard/DashboardCard.tsx
// The white card shell every dashboard panel sits in. Extracted because the
// same `bg-white rounded-xl border border-neutral-200 shadow-sm` string was
// repeated 10 times across the page — one drift in any of them and the grid
// stops looking uniform.
import { ReactNode } from 'react';

type Padding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Padding is a prop rather than a className passthrough on purpose: Tailwind
 * resolves conflicting utilities by stylesheet order, not by the order they
 * appear in the class attribute, so `p-5` + a caller's `p-6` is a coin flip.
 */
const PADDING: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-10',
};

interface DashboardCardProps {
  children: ReactNode;
  padding?: Padding;
  radius?: 'xl' | '2xl';
  /** Thin pink bar across the top — used by the welcome hero. */
  accent?: boolean;
  /** `danger` swaps the border red for error panels. */
  tone?: 'default' | 'danger';
  /** Pink border + ring, for the currently active memorial. */
  selected?: boolean;
  /** Adds pointer cursor and hover lift. Pair with onClick. */
  interactive?: boolean;
  onClick?: () => void;
  /** Layout only — width, flex basis, margins. Not padding or borders. */
  className?: string;
}

export default function DashboardCard({
  children,
  padding = 'md',
  radius = 'xl',
  accent = false,
  tone = 'default',
  selected = false,
  interactive = false,
  onClick,
  className = '',
}: DashboardCardProps) {
  const border = selected
    ? 'border-[#c3195d] ring-1 ring-[#c3195d]'
    : tone === 'danger'
      ? 'border-red-200'
      : 'border-neutral-200';

  return (
    <div
      onClick={onClick}
      className={[
        'bg-white border shadow-sm overflow-hidden',
        radius === '2xl' ? 'rounded-2xl' : 'rounded-xl',
        border,
        interactive
          ? 'cursor-pointer transition-all duration-200 hover:shadow-md'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {accent && <div className="h-1 bg-[#c3195d]" />}
      <div className={PADDING[padding]}>{children}</div>
    </div>
  );
}
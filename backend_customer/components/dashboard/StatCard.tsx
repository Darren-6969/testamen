// components/dashboard/StatCard.tsx
// The Account Overview KPI row: one big number over a label.
//
// The storage card is the same shape plus a quota bar, so `progress` folds it
// in here rather than justifying a separate StorageCard.
import { ReactNode } from 'react';
import DashboardCard from './DashboardCard';

interface StatCardProps {
  /** ReactNode so the storage card can inline its "/ 500 MB" suffix span. */
  value: ReactNode;
  label: ReactNode;
  /**
   * default = neutral number, accent = pink (storage),
   * muted = grey, for the "—" unavailable state.
   */
  tone?: 'default' | 'accent' | 'muted';
  /** 0–100. Omit for cards with no quota bar. */
  progress?: number;
}

const TONE: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: '',
  accent: 'text-[#c3195d]',
  muted: 'text-neutral-300',
};

export default function StatCard({
  value,
  label,
  tone = 'default',
  progress,
}: StatCardProps) {
  return (
    <DashboardCard>
      <p className={`text-3xl font-bold ${TONE[tone]}`}>{value}</p>
      <p className="text-sm text-neutral-500 mt-1">{label}</p>

      {progress !== undefined && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-[#c3195d]"
            // Clamped here as well as at the call site: a quota overage
            // shouldn't render a bar wider than its track.
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </DashboardCard>
  );
}
// components/dashboard/StatTile.tsx
// The Account Information row — Tributes / Photos / Videos for the active
// memorial. Three structurally identical tiles that differ only in icon,
// label, count and hint line.
import { ReactNode } from 'react';
import DashboardCard from './DashboardCard';

interface StatTileProps {
  /** A lucide icon element, e.g. <Heart size={16} />. */
  icon: ReactNode;
  label: string;
  value: number;
  /** Small grey line underneath, e.g. "Last added 3 Mar 2026". */
  hint: string;
}

export default function StatTile({ icon, label, value, hint }: StatTileProps) {
  return (
    <DashboardCard>
      <div className="flex items-center gap-2 text-[#c3195d]">
        {icon}
        <span className="text-sm text-neutral-500">{label}</span>
      </div>
      <p className="text-2xl font-semibold mt-2">{value}</p>
      <p className="text-xs text-neutral-400 mt-1">{hint}</p>
    </DashboardCard>
  );
}
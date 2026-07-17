// components/dashboard/SectionHeading.tsx
// The dashboard's pink uppercase section label.
//
// Deliberately NOT components/admin/SectionLabel — that one is text-[11px] /
// tracking-[0.15em] / #b3567e, tuned for dense admin tabs. This is text-sm /
// tracking-wider / #c3195d. Same idea, different scale; sharing one component
// would mean one of the two modules silently changing appearance.
import { ReactNode } from 'react';

interface SectionHeadingProps {
  /** ReactNode, not string — callers append things like "— currently viewing X". */
  children: ReactNode;
  /** Right-aligned slot: buttons, scroll arrows, etc. */
  action?: ReactNode;
}

export default function SectionHeading({ children, action }: SectionHeadingProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[#c3195d]">
        {children}
      </h3>
      {action}
    </div>
  );
}
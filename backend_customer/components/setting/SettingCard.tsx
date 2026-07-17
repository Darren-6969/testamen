// components/setting/SettingCard.tsx
// Card shell shared by every settings page, so Profile / Change Password /
// Plan stay visually identical. Matches the admin portal's profile layout.
import { ReactNode } from 'react';

interface SettingCardProps {
  /** Uppercase section title rendered at the top of the card. */
  title: string;
  /** Optional supporting line under the title. */
  description?: ReactNode;
  children: ReactNode;
  /** Actions pinned to a divided footer (e.g. a save button). Omit for read-only cards. */
  footer?: ReactNode;
  className?: string;
}

export default function SettingCard({
  title,
  description,
  children,
  footer,
  className = '',
}: SettingCardProps) {
  return (
    <div
      className={`
        max-w-3xl mx-auto rounded-2xl p-8 space-y-8 shadow-sm
        border
        bg-[var(--card-bg)]
        text-[var(--card-text)]
        border-[var(--border-color)]
        ${className}
      `}
    >
      <div className="space-y-1">
        <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-[var(--form-text-caption)]">{description}</p>
        )}
      </div>

      {children}

      {footer && (
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
          {footer}
        </div>
      )}
    </div>
  );
}
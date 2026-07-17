// components/setting/SettingSaveButton.tsx
// The single save action used in every SettingCard footer.
interface SettingSaveButtonProps {
  onClick: () => void;
  saving?: boolean;
  /** Label when idle. */
  children: string;
  /** Label while the request is in flight. */
  savingLabel?: string;
  disabled?: boolean;
}

export default function SettingSaveButton({
  onClick,
  saving = false,
  children,
  savingLabel = 'Saving...',
  disabled = false,
}: SettingSaveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving || disabled}
      className="
        inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
        bg-[#c3195d] text-white hover:bg-red-700 transition-colors
        disabled:opacity-60 disabled:cursor-not-allowed
      "
    >
      {saving ? savingLabel : children}
    </button>
  );
}
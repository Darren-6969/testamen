// components/setting/SettingTile.tsx
// Clickable tile on the settings landing page.
import { LucideIcon } from 'lucide-react';

interface SettingTileProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

export default function SettingTile({
  title,
  description,
  icon: Icon,
  onClick,
}: SettingTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex items-start gap-3 hover:shadow-md hover:border-[#c3195d] transition-all"
    >
      <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-[#c3195d]" />
      </div>
      <div className="space-y-1">
        <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
          {title}
        </h2>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </button>
  );
}
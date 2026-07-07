'use client';

import { Search } from 'lucide-react';

interface SearchBoxWithIconProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SearchBoxWithIcon({
  placeholder = 'Search...',
  value,
  onChange,
}: SearchBoxWithIconProps) {
  return (
    <div className="hidden md:block">
      <div className="relative">
        {/* Search Icon */}
        <Search
          className="
            absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5
            text-[var(--form-text-caption)]   /* 👈 theme-aware icon color */
            z-10 pointer-events-none
          "
        />

        {/* Input Box */}
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="
            w-64 pl-12 pr-4 py-2 text-sm rounded-lg
            border border-[var(--border-color)]
            bg-[var(--form-body-bg)]
            text-[var(--form-text-color)]
            placeholder-[var(--form-text-caption)]
            focus:outline-none focus:ring-2
            focus:ring-[var(--link-color)]
            focus:border-transparent
            relative z-0
          "
        />
      </div>
    </div>
  );
}
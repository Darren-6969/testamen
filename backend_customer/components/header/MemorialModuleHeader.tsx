// Shared top bar for customer-dashboard modules 
'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';
import { fetchMemorials, MemorialOption } from '@/app/data/memorials';

const PUBLIC_BASE = process.env.NEXT_PUBLIC_MEMORIAL_SITE_BASE || '';

interface Props {
  className?: string;
}

export default function MemorialModuleHeader({ className = '' }: Props) {
  const { activeMemorial, setActiveMemorial } = useActiveMemorial();
  const [memorials, setMemorials] = useState<MemorialOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await fetchMemorials();
      if (!alive) return;
      setMemorials(list);
      if (!activeMemorial && list.length) {
        setActiveMemorial({ numberList: list[0].numberList, name: list[0].name });
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const selected = memorials.find((m) => m.numberList === activeMemorial?.numberList);
  const publicHref =
    selected?.urlName && PUBLIC_BASE
      ? `${PUBLIC_BASE}?url_name=${encodeURIComponent(selected.urlName)}`
      : undefined;

  const initials = (selected?.name || '?')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`flex w-full flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-3">
        {selected?.photoUrl ? (
          <img
            src={selected.photoUrl}
            alt={selected.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c3195d] text-sm font-medium text-white">
            {initials}
          </div>
        )}

        <div className="relative">
          <select
            value={activeMemorial?.numberList || ''}
            onChange={(e) => {
              const m = memorials.find((x) => x.numberList === e.target.value);
              if (m) setActiveMemorial({ numberList: m.numberList, name: m.name });
            }}
            disabled={loading || memorials.length === 0}
            className="appearance-none rounded-lg border border-pink-200 bg-pink-50 py-2 pl-3 pr-9 text-sm font-medium text-[#8e1444] focus:outline-none focus:ring-2 focus:ring-[#c3195d]/30 disabled:opacity-60"
          >
            {memorials.length === 0 && <option value="">No memorials</option>}
            {memorials.map((m) => (
              <option key={m.numberList} value={m.numberList}>
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e1444]" />
        </div>

        <span className="hidden text-xs text-gray-400 sm:inline">select memorial</span>
      </div>

      {publicHref ? (
        <a
          href={publicHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-[#c3195d] hover:underline"
        >
          View public page <ExternalLink className="h-4 w-4" />
        </a>
      ) : (
        <span
          className="flex items-center gap-1.5 text-sm text-gray-300"
          title="Set NEXT_PUBLIC_MEMORIAL_SITE_BASE to enable this link"
        >
          View public page <ExternalLink className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
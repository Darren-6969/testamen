'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldUser } from 'lucide-react';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';
import PageHeader from '@/components/header/PageHeader';
import MemorialModuleHeader from '@/components/header/MemorialModuleHeader';
import { fetchStorage, StorageInfo } from '@/app/data/admin';

const TABS = [
  { label: 'Main Page', href: '/module/admin' },
  { label: 'Photos & Albums', href: '/module/admin/photos' },
  { label: 'Videos & Audios', href: '/module/admin/videos' },
  { label: 'Approval', href: '/module/admin/approval' },
  { label: 'Tributes', href: '/module/admin/tributes' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { activeMemorial } = useActiveMemorial();
  const pathname = usePathname();
  const [storage, setStorage] = useState<StorageInfo | null>(null);

  useEffect(() => {
    if (!activeMemorial?.numberList) return;
    let alive = true;
    fetchStorage(activeMemorial.numberList).then((s) => alive && setStorage(s));
    return () => {
      alive = false;
    };
  }, [activeMemorial?.numberList]);

  const isActive = (href: string) =>
    href === '/module/admin' ? pathname === href : pathname.startsWith(href);

  const pct =
    storage && storage.totalMb > 0
      ? Math.min(100, Math.round((storage.usedMb / storage.totalMb) * 100))
      : 0;

  return (
    <div className="min-h-screen">
      <PageHeader
        icon={<ShieldUser className="h-6 w-6" />}
        subtitle={
          activeMemorial ? `Manage content for ${activeMemorial.name}` : 'Manage memorial content'
        }
      >
        Admin
      </PageHeader>

      <MemorialModuleHeader className="mb-4 border-b border-gray-100 pb-5" />

      {/* Storage bar */}
      {storage && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-neutral-500">
            <span>Storage &middot; {storage.plan} plan</span>
            <span>
              {storage.usedMb} / {storage.totalMb} MB
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-[#c3195d]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-100">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`whitespace-nowrap px-3 py-2.5 text-sm transition ${
              isActive(t.href)
                ? 'border-b-2 border-[#c3195d] font-medium text-[#c3195d]'
                : 'text-neutral-500 hover:text-[#c3195d]'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
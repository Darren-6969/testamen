'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldUser } from 'lucide-react';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';
import { StorageProvider, useStorage } from '@/app/context/StorageContext';
import PageHeader from '@/components/header/PageHeader';
import MemorialModuleHeader from '@/components/header/MemorialModuleHeader';

const TABS = [
  { label: 'Main Page', href: '/module/admin' },
  { label: 'Photos & Albums', href: '/module/admin/photos' },
  { label: 'Videos & Audios', href: '/module/admin/videos' },
  { label: 'Approval', href: '/module/admin/approval' },
  { label: 'Tributes', href: '/module/admin/tributes' },
];

function StorageBar() {
  const router = useRouter();
  const { storage, remainingMb } = useStorage();

  if (!storage) return null;

  const pct =
    storage.totalMb > 0
      ? Math.min(100, Math.round((storage.usedMb / storage.totalMb) * 100))
      : 0;

  // Turns the bar from a readout into a nudge: warn before the wall, not at it.
  const full = pct >= 100;
  const nearlyFull = pct >= 80 && !full;
  const barColor = full ? 'bg-red-500' : nearlyFull ? 'bg-amber-500' : 'bg-[#c3195d]';

  return (
    <div className="mb-4">
      <div className="mb-1 flex justify-between text-xs text-neutral-500">
        {/* "all memorials" because the quota is account-wide (scoped by code_no),
            not per-memorial — without it the bar reads as this memorial's usage. */}
        <span>
          Storage &middot; {storage.plan} plan &middot; all memorials
        </span>
        <span className={full ? 'font-medium text-red-600' : undefined}>
          {storage.usedMb} / {storage.totalMb} MB
          {remainingMb !== null && !full && (
            <span className="text-neutral-400"> &middot; {remainingMb} MB free</span>
          )}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {(full || nearlyFull) && (
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          <span className={full ? 'text-red-600' : 'text-amber-600'}>
            {full
              ? 'Storage full. Remove some files or upgrade to upload more.'
              : 'Storage is nearly full.'}
          </span>
          <button
            type="button"
            onClick={() => router.push('/module/setting/plan')}
            className="font-medium text-[#c3195d] underline underline-offset-2"
          >
            Upgrade plan
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { activeMemorial } = useActiveMemorial();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/module/admin' ? pathname === href : pathname.startsWith(href);

  return (
    // Provider wraps the whole module so child pages can refresh the bar after
    // an upload, and read isFull to disable their file pickers.
    <StorageProvider>
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

        <StorageBar />

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
    </StorageProvider>
  );
}
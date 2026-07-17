'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Image as ImageIcon, Video, Plus } from 'lucide-react';
import PageHeader from '@/components/header/PageHeader';
import DashboardCard from '@/components/dashboard/DashboardCard';
import SectionHeading from '@/components/dashboard/SectionHeading';
import StatCard from '@/components/dashboard/StatCard';
import StatTile from '@/components/dashboard/StatTile';
import MemorialRail, { MEMORIAL_CARD_WIDTH } from '@/components/dashboard/MemorialRail';
import MemorialRailCard from '@/components/dashboard/MemorialRailCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { formatDate } from '@/components/dashboard/formatDate';
import {
  fetchDashboardOverview,
  DashboardOverview,
  DashboardMemorial,
} from '@/app/data/dashboard';
import { fetchStorage, StorageInfo } from '@/app/data/admin';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';
import { TriangleAlert } from 'lucide-react';

// The public memorial site isn't part of this repo yet — set this env var
// once that domain/app exists. Until then "View site" is disabled.
const MEMORIAL_SITE_URL = process.env.NEXT_PUBLIC_MEMORIAL_SITE_URL || '';

// There is no create-memorial route yet. Flip to true when one exists and point
// ADD_MEMORIAL_ROUTE at it — /module/admin is the *edit* module, not a create flow.
const SHOW_ADD_MEMORIAL = false;
const ADD_MEMORIAL_ROUTE = '/module/admin';

export default function DashboardPage() {
  const router = useRouter();
  const { activeMemorial, setActiveMemorial } = useActiveMemorial();

  const [data, setData] = useState<DashboardOverview | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [result, storageInfo] = await Promise.all([
      fetchDashboardOverview(),
      fetchStorage(),
    ]);

    if (!result.ok) {
      setError(result.error);
      setData(null);
      setLoading(false);
      return;
    }

    setData(result.data);
    setStorage(storageInfo);

    const first = result.data.memorials[0];
    const stillExists =
      activeMemorial &&
      result.data.memorials.some((m) => m.numberList === activeMemorial.numberList);

    // Select the first memorial on load, and re-anchor if the remembered one is gone.
    if (first && !stillExists) {
      setActiveMemorial({ numberList: first.numberList, name: first.name });
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Fall back to the first memorial so Account Information never silently shows zeros.
  const activeStats: DashboardMemorial | undefined =
    data?.memorials.find((m) => m.numberList === activeMemorial?.numberList) ??
    data?.memorials[0];

  // Storage comes from /api/admin/storage: { usedMb, totalMb, plan }.
  // totalMb === 0 means the call failed or the plan has no quota — show a dash
  // rather than a misleading "0 / 0 MB".
  const storageKnown = !!storage && storage.totalMb > 0;
  const storagePct = storageKnown
    ? Math.min(100, Math.round((storage!.usedMb / storage!.totalMb) * 100))
    : 0;

  return (
    <div className="min-h-screen text-neutral-800">
      <PageHeader subtitle={today}>MEMODISE Control Center</PageHeader>

      <div className="space-y-6">
        {/* Welcome Hero */}
        <DashboardCard radius="2xl" padding="lg" accent>
          <h2 className="text-xl font-semibold text-neutral-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed max-w-3xl">
            {data && data.memorials.length > 0
              ? `You have ${data.memorials.length} memorial${data.memorials.length > 1 ? 's' : ''} under your account. Select one below to manage its content.`
              : 'Manage your memorials, tributes, photos and obituaries from one place.'}
          </p>
        </DashboardCard>

        {/* ERROR STATE */}
        {error && (
          <DashboardCard tone="danger" padding="lg">
            <div className="flex items-start gap-3">
              <TriangleAlert size={18} className="text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">
                  Couldn&apos;t load your dashboard
                </p>
                <p className="text-sm text-neutral-500 mt-1">{error}</p>
                <button
                  onClick={load}
                  className="mt-3 text-sm px-3 py-1.5 rounded-lg border border-[#c3195d] text-[#c3195d] hover:bg-pink-50 transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          </DashboardCard>
        )}

        {!error && (
          <>
            {/* KPI SECTION */}
            <div>
              <SectionHeading>Account Overview</SectionHeading>

              {loading ? (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl border border-neutral-200 p-5 h-28 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard value={data?.aggregate.totalMemorials ?? 0} label="Memorials" />
                  <StatCard value={data?.aggregate.totalTributes ?? 0} label="Tributes" />
                  <StatCard value={data?.aggregate.totalPhotos ?? 0} label="Photos" />

                  {storageKnown ? (
                    <StatCard
                      tone="accent"
                      progress={storagePct}
                      value={
                        <>
                          {storage!.usedMb}
                          <span className="text-lg font-medium text-neutral-400">
                            {' '}/ {storage!.totalMb} MB
                          </span>
                        </>
                      }
                      label={<>Storage &middot; {storage!.plan} plan</>}
                    />
                  ) : (
                    <StatCard tone="muted" value="—" label="Storage unavailable" />
                  )}
                </div>
              )}
            </div>

            {/* MY MEMORIALS */}
            {loading ? (
              <MemorialRail itemCount={0}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`bg-white rounded-xl border border-neutral-200 p-5 h-28 animate-pulse ${MEMORIAL_CARD_WIDTH}`}
                  />
                ))}
              </MemorialRail>
            ) : data && data.memorials.length > 0 ? (
              <MemorialRail
                itemCount={data.memorials.length}
                headerAction={
                  SHOW_ADD_MEMORIAL ? (
                    <button
                      onClick={() => router.push(ADD_MEMORIAL_ROUTE)}
                      className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-[#c3195d] text-[#c3195d] hover:bg-pink-50 transition-colors"
                    >
                      <Plus size={14} />
                      Add Memorial
                    </button>
                  ) : null
                }
              >
                {data.memorials.map((m) => (
                  <MemorialRailCard
                    key={m.numberList}
                    memorial={m}
                    active={m.numberList === activeMemorial?.numberList}
                    onSelect={() =>
                      setActiveMemorial({ numberList: m.numberList, name: m.name })
                    }
                    onViewSite={
                      MEMORIAL_SITE_URL
                        ? () => window.open(`${MEMORIAL_SITE_URL}/${m.urlName}`, '_blank')
                        : null
                    }
                    onOpenObituary={() =>
                      router.push(`/module/obituary?memorial=${m.numberList}`)
                    }
                    onOpenAdmin={() => router.push(`/module/admin?memorial=${m.numberList}`)}
                  />
                ))}
              </MemorialRail>
            ) : (
              <div>
                <SectionHeading>My Memorials</SectionHeading>
                <DashboardCard padding="xl">
                  <div className="text-center">
                    <p className="text-sm font-medium text-neutral-700">No memorials yet</p>
                    <p className="text-sm text-neutral-500 mt-1">
                      Add your first memorial to get started.
                    </p>
                  </div>
                </DashboardCard>
              </div>
            )}

            {/* ACCOUNT INFORMATION */}
            <div>
              <SectionHeading>
                Account Information
                {activeStats && (
                  <span className="text-neutral-400 font-normal normal-case tracking-normal">
                    {' '}
                    — currently viewing {activeStats.name}
                  </span>
                )}
              </SectionHeading>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatTile
                  icon={<Heart size={16} />}
                  label="Tributes"
                  value={activeStats?.tributes.count ?? 0}
                  hint={
                    activeStats?.tributes.latest
                      ? `Latest ${formatDate(activeStats.tributes.latest)}`
                      : 'No tributes yet'
                  }
                />
                <StatTile
                  icon={<ImageIcon size={16} />}
                  label="Photos"
                  value={activeStats?.photos.count ?? 0}
                  hint={
                    activeStats?.photos.latest
                      ? `Last added ${formatDate(activeStats.photos.latest)}`
                      : 'No photos yet'
                  }
                />
                <StatTile
                  icon={<Video size={16} />}
                  label="Videos"
                  value={activeStats?.videos.count ?? 0}
                  hint={
                    activeStats?.videos.latest
                      ? `Last added ${formatDate(activeStats.videos.latest)}`
                      : 'No videos yet'
                  }
                />
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <ActivityFeed activity={data?.activity ?? []} loading={loading} />
          </>
        )}

        {/* Footer */}
        <div className="pt-4">
          <p className="text-center text-xs text-neutral-400">
            MEMODISE v1.0 — Secure Memorial Management System
          </p>
        </div>
      </div>
    </div>
  );
}
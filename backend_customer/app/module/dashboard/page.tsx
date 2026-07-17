'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Image as ImageIcon,
  Video,
  Music,
  ExternalLink,
  FileText,
  Edit,
  Plus,
  Bell,
  User,
  TriangleAlert,
} from 'lucide-react';
import PageHeader from '@/components/header/PageHeader';
import {
  fetchDashboardOverview,
  DashboardOverview,
  DashboardMemorial,
  DashboardActivity,
} from '@/app/data/dashboard';
import { fetchStorage, StorageInfo } from '@/app/data/admin';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';

// The public memorial site isn't part of this repo yet — set this env var
// once that domain/app exists. Until then "View site" is disabled.
const MEMORIAL_SITE_URL = process.env.NEXT_PUBLIC_MEMORIAL_SITE_URL || '';

// There is no create-memorial route yet. Flip to true when one exists and point
// ADD_MEMORIAL_ROUTE at it — /module/admin is the *edit* module, not a create flow.
const SHOW_ADD_MEMORIAL = false;
const ADD_MEMORIAL_ROUTE = '/module/admin';

function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function activityIcon(type: DashboardActivity['type']) {
  const props = { size: 16, className: 'text-[#c3195d] mt-1 shrink-0' };
  if (type === 'photo') return <ImageIcon {...props} />;
  if (type === 'video') return <Video {...props} />;
  if (type === 'audio') return <Music {...props} />;
  return <Heart {...props} />;
}

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
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-[#c3195d]" />
          <div className="p-6">
            <h2 className="text-xl font-semibold text-neutral-900">Welcome Back</h2>
            <p className="mt-2 text-sm text-neutral-500 leading-relaxed max-w-3xl">
              {data && data.memorials.length > 0
                ? `You have ${data.memorials.length} memorial${data.memorials.length > 1 ? 's' : ''} under your account. Select one below to manage its content.`
                : 'Manage your memorials, tributes, photos and obituaries from one place.'}
            </p>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
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
          </div>
        )}

        {!error && (
          <>
            {/* KPI SECTION */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#c3195d] mb-3">
                Account Overview
              </h3>

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
                  <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
                    <p className="text-3xl font-bold">{data?.aggregate.totalMemorials ?? 0}</p>
                    <p className="text-sm text-neutral-500 mt-1">Memorials</p>
                  </div>

                  <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
                    <p className="text-3xl font-bold">{data?.aggregate.totalTributes ?? 0}</p>
                    <p className="text-sm text-neutral-500 mt-1">Tributes</p>
                  </div>

                  <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
                    <p className="text-3xl font-bold">{data?.aggregate.totalPhotos ?? 0}</p>
                    <p className="text-sm text-neutral-500 mt-1">Photos</p>
                  </div>

                  <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
                    {storageKnown ? (
                      <>
                        <p className="text-3xl font-bold text-[#c3195d]">
                          {storage!.usedMb}
                          <span className="text-lg font-medium text-neutral-400">
                            {' '}/ {storage!.totalMb} MB
                          </span>
                        </p>
                        <p className="text-sm text-neutral-500 mt-1">
                          Storage &middot; {storage!.plan} plan
                        </p>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-[#c3195d]"
                            style={{ width: `${storagePct}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-neutral-300">—</p>
                        <p className="text-sm text-neutral-500 mt-1">Storage unavailable</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MY MEMORIALS */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#c3195d]">
                  My Memorials
                </h3>
                {SHOW_ADD_MEMORIAL && (
                  <button
                    onClick={() => router.push(ADD_MEMORIAL_ROUTE)}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-[#c3195d] text-[#c3195d] hover:bg-pink-50 transition-colors"
                  >
                    <Plus size={14} />
                    Add Memorial
                  </button>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl border border-neutral-200 p-5 h-28 animate-pulse"
                    />
                  ))}
                </div>
              ) : data && data.memorials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.memorials.map((m) => {
                    const isActive = m.numberList === activeMemorial?.numberList;
                    return (
                      <div
                        key={m.numberList}
                        onClick={() =>
                          setActiveMemorial({ numberList: m.numberList, name: m.name })
                        }
                        className={`bg-white rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          isActive
                            ? 'border-[#c3195d] ring-1 ring-[#c3195d]'
                            : 'border-neutral-200'
                        }`}
                      >
                        <div className="flex gap-3 items-start">
                          <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {m.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.photoUrl}
                                alt={m.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={20} className="text-neutral-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-neutral-900 text-sm">{m.name}</p>
                            <p className="text-xs text-neutral-500 mt-1">
                              Date of Departure: {formatDate(m.dateOfDeparture)}
                            </p>
                            <p className="text-xs text-neutral-500">
                              Place of Rest: {m.placeOfRest || '—'}
                            </p>

                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (MEMORIAL_SITE_URL) {
                                    window.open(
                                      `${MEMORIAL_SITE_URL}/${m.urlName}`,
                                      '_blank'
                                    );
                                  }
                                }}
                                disabled={!MEMORIAL_SITE_URL}
                                title="View public site"
                                className="w-8 h-8 rounded-lg bg-pink-50 text-[#c3195d] flex items-center justify-center disabled:opacity-40"
                              >
                                <ExternalLink size={15} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/module/obituary?memorial=${m.numberList}`);
                                }}
                                title="Obituary"
                                className="w-8 h-8 rounded-lg bg-pink-50 text-[#c3195d] flex items-center justify-center"
                              >
                                <FileText size={15} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/module/admin?memorial=${m.numberList}`);
                                }}
                                title="Edit in Admin"
                                className="w-8 h-8 rounded-lg bg-pink-50 text-[#c3195d] flex items-center justify-center"
                              >
                                <Edit size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-neutral-200 p-10 text-center">
                  <p className="text-sm font-medium text-neutral-700">No memorials yet</p>
                  <p className="text-sm text-neutral-500 mt-1">
                    Add your first memorial to get started.
                  </p>
                </div>
              )}
            </div>

            {/* ACCOUNT INFORMATION */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#c3195d] mb-3">
                Account Information
                {activeStats && (
                  <span className="text-neutral-400 font-normal normal-case tracking-normal">
                    {' '}
                    — currently viewing {activeStats.name}
                  </span>
                )}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-[#c3195d]">
                    <Heart size={16} />
                    <span className="text-sm text-neutral-500">Tributes</span>
                  </div>
                  <p className="text-2xl font-semibold mt-2">
                    {activeStats?.tributes.count ?? 0}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {activeStats?.tributes.latest
                      ? `Latest ${formatDate(activeStats.tributes.latest)}`
                      : 'No tributes yet'}
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-[#c3195d]">
                    <ImageIcon size={16} />
                    <span className="text-sm text-neutral-500">Photos</span>
                  </div>
                  <p className="text-2xl font-semibold mt-2">
                    {activeStats?.photos.count ?? 0}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {activeStats?.photos.latest
                      ? `Last added ${formatDate(activeStats.photos.latest)}`
                      : 'No photos yet'}
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-[#c3195d]">
                    <Video size={16} />
                    <span className="text-sm text-neutral-500">Videos</span>
                  </div>
                  <p className="text-2xl font-semibold mt-2">
                    {activeStats?.videos.count ?? 0}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {activeStats?.videos.latest
                      ? `Last added ${formatDate(activeStats.videos.latest)}`
                      : 'No videos yet'}
                  </p>
                </div>
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Bell size={18} className="text-[#c3195d]" />
                <h3 className="font-semibold">Recent Activity</h3>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-8 rounded bg-neutral-100 animate-pulse" />
                  ))}
                </div>
              ) : data && data.activity.length > 0 ? (
                <div className="space-y-4">
                  {data.activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      {activityIcon(item.type)}
                      <div>
                        <p className="text-sm font-medium">{item.message}</p>
                        <p className="text-xs text-neutral-500">{formatDate(item.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No recent activity yet.</p>
              )}
            </div>
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
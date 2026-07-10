'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Image as ImageIcon,
  Video,
  ExternalLink,
  FileText,
  Edit,
  Plus,
  Bell,
  User,
} from 'lucide-react';
import {
  fetchDashboardOverview,
  DashboardOverview,
  DashboardMemorial,
} from '@/app/data/dashboard';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';

// The public memorial site isn't part of this repo yet — set this env var
// once that domain/app exists. Until then "View site" is disabled.
const MEMORIAL_SITE_URL = process.env.NEXT_PUBLIC_MEMORIAL_SITE_URL || '';

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

export default function DashboardPage() {
  const router = useRouter();
  const { activeMemorial, setActiveMemorial } = useActiveMemorial();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const overview = await fetchDashboardOverview();
      setData(overview);
      if (overview.memorials.length > 0 && !activeMemorial) {
        setActiveMemorial({
          numberList: overview.memorials[0].numberList,
          name: overview.memorials[0].name,
        });
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeStats: DashboardMemorial | undefined = data?.memorials.find(
    (m) => m.numberList === activeMemorial?.numberList
  );

  const latestActivityDate = data?.activity[0]?.date ?? null;

  return (
    <div className="min-h-screen text-neutral-800">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-8 pb-5">
          <h1 className="text-2xl font-bold tracking-wider text-[#c3195d]">
            MEMODISE Control Center
          </h1>
          <p className="text-sm text-neutral-500 mt-1">{today}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
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

        {/* KPI SECTION */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#c3195d] mb-3">
            Account Overview
          </h3>

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
              <p className="text-3xl font-bold text-[#c3195d]">
                {formatDate(latestActivityDate)}
              </p>
              <p className="text-sm text-neutral-500 mt-1">Latest Activity</p>
            </div>
          </div>
        </div>

        {/* MY MEMORIALS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#c3195d]">
              My Memorials
            </h3>
            <button
              onClick={() => router.push('/module/admin')}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-[#c3195d] text-[#c3195d] hover:bg-pink-50 transition-colors"
            >
              <Plus size={14} />
              Add Memorial
            </button>
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
            {activeMemorial && (
              <span className="text-neutral-400 font-normal normal-case tracking-normal">
                {' '}
                — currently viewing {activeMemorial.name}
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
              <p className="text-xs text-neutral-400 mt-1">No videos yet</p>
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Bell size={18} className="text-[#c3195d]" />
            <h3 className="font-semibold">Recent Activity</h3>
          </div>

          {data && data.activity.length > 0 ? (
            <div className="space-y-4">
              {data.activity.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Bell size={16} className="text-[#c3195d] mt-1" />
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
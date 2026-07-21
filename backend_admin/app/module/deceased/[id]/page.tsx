'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  HandHeart,
  Hash,
  Link2,
  Mars,
  Pencil,
  User,
  Venus,
} from 'lucide-react';

import PageHeader from '@/components/header/PageHeader';
import { fetchDeceasedById, Deceased } from '@/app/data/deceased';

const formatDate = (value?: string | null) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export default function ViewDeceasedPage() {
  const params = useParams();
  const router = useRouter();

  const deceasedId = Number(params?.id);

  const [deceased, setDeceased] = useState<Deceased | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeceased = async () => {
      if (!deceasedId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const data = await fetchDeceasedById(deceasedId);
        setDeceased(data);
      } catch (error) {
        console.error('load deceased error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDeceased();
  }, [deceasedId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<HandHeart className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Loading deceased details"
        >
          <span className="text-[#c3195d]">Deceased Details</span>
        </PageHeader>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading deceased information...
        </div>
      </div>
    );
  }

  if (!deceased) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<HandHeart className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Deceased record not found"
        >
          <span className="text-[#c3195d]">Deceased Details</span>
        </PageHeader>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-medium text-red-700">
          Deceased record not found.
        </div>

        <button
          type="button"
          onClick={() => router.push('/module/deceased')}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deceased Listing
        </button>
      </div>
    );
  }

  const isActive = String(deceased.status) === '1';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<HandHeart className="h-5 w-5 text-[#c3195d]" />}
        subtitle="View deceased record details"
      >
        <span className="text-[#c3195d]">Deceased Details</span>
      </PageHeader>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/module/deceased')}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          type="button"
          onClick={() => router.push(`/module/deceased/edit?id=${deceased.id}`)}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#c3195d]/20 bg-gradient-to-r from-[#c3195d] to-[#a5124b] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-900/20 transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <Pencil className="h-4 w-4" />
          Edit Deceased
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 bg-gradient-to-r from-pink-50 via-white to-white px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {deceased.memorial_name || '-'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Deceased ID: #{deceased.id}
              </p>
            </div>

            <span
              className={`rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-wide ${
                isActive
                  ? 'border-green-100 bg-green-50 text-green-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
            >
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 text-[#c3195d]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Registration Date
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {formatDate(deceased.register_date)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div
              className={`mb-2 flex h-10 w-10 items-center justify-center rounded-2xl ${
                String(deceased.gender).toUpperCase() === 'FEMALE'
                  ? 'bg-pink-100 text-pink-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {String(deceased.gender).toUpperCase() === 'FEMALE' ? (
                <Venus className="h-5 w-5" />
              ) : (
                <Mars className="h-5 w-5" />
              )}
            </div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Gender
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {deceased.gender || '-'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Hash className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Code No
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {deceased.code_no || '-'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <User className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase text-slate-400">
              Registered By
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {deceased.registered_account || '-'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 border-t border-slate-200 p-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              URL Name
            </p>

            {deceased.url_name ? (
              <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600">
                <Link2 className="h-4 w-4" />
                {deceased.url_name}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-400">
                No URL name set
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

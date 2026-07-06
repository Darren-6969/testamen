'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Feather,
  CalendarDays,
  MapPin,
  Quote,
  FileText,
} from 'lucide-react';

import PageHeader from '@/components/header/PageHeader';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import { fetchObituaryById, Obituary } from '@/app/data/obituary';

const formatDate = (value?: string | null) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
};

// NOTE: this points at the API's generic `/uploads` static mount
// (see api/src/index.js). Confirm the actual subfolder obituary PDFs
// are saved under and adjust this if it differs.
const getUploadsUrl = (fileName: string) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const apiBase = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
  return `${apiBase}/uploads/obituary/${fileName}`;
};

export default function ObituaryPreviewPage() {
  const params = useParams();
  const router = useRouter();

  const obituaryId = params?.dockey as string;

  const [obituary, setObituary] = useState<Obituary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadObituary = async () => {
      if (!obituaryId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const data = await fetchObituaryById(obituaryId);
        setObituary(data);
      } catch (error) {
        console.error('load obituary error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadObituary();
  }, [obituaryId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<Feather className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Loading obituary details"
        >
          <span className="text-[#c3195d]">Obituary Preview</span>
        </PageHeader>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading obituary information...
        </div>
      </div>
    );
  }

  if (!obituary) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<Feather className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Obituary record not found"
        >
          <span className="text-[#c3195d]">Obituary Preview</span>
        </PageHeader>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-medium text-red-700">
          Obituary not found.
        </div>

        <button
          type="button"
          onClick={() => router.push('/module/obituary')}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Obituary Listing
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Feather className="h-5 w-5 text-[#c3195d]" />}
        subtitle="View obituary details"
      >
        <span className="text-[#c3195d]">Obituary Preview</span>
      </PageHeader>

      <Breadcrumb
        items={[
          { label: 'Obituary', href: '/module/obituary' },
          { label: obituary.mf_fullname ?? 'Preview' },
        ]}
      />

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/module/obituary')}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 bg-gradient-to-r from-pink-50 via-white to-white px-6 py-5">
          <div className="flex flex-wrap items-start gap-4">
            {obituary.mf_img && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={obituary.mf_img}
                alt={obituary.mf_fullname ?? 'Obituary photo'}
                className="h-20 w-20 rounded-2xl border border-slate-200 object-cover"
              />
            )}

            <div>
              <h2 className="text-xl font-black text-slate-900">
                {obituary.mf_fullname || '-'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Obituary ID: #{obituary.id}
                {obituary.code_no ? ` - Ref: ${obituary.code_no}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 text-[#c3195d]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase text-slate-400">Born</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {formatDate(obituary.mf_born)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-200 text-slate-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase text-slate-400">Passed Away</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {formatDate(obituary.mf_pass_date)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase text-slate-400">Cortege / Funeral Date</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {formatDate(obituary.mf_cortehe_on)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 border-t border-slate-200 p-6 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Place of Birth
            </p>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
              <MapPin className="h-4 w-4 text-[#c3195d]" />
              {obituary['mf-born_location'] || '-'}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Place of Passing
            </p>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
              <MapPin className="h-4 w-4 text-[#c3195d]" />
              {obituary.mf_pass_location || '-'}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Funeral Location
            </p>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
              <MapPin className="h-4 w-4 text-[#c3195d]" />
              {obituary.mf_location_funeral || '-'}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Wake Until
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
              {obituary.mf_wake_dtl_til || '-'}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Wake Address
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
              {obituary.mf_wake_dtl_add || '-'}
            </div>
          </div>

          {obituary.mf_quote && (
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Quote
              </p>
              <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm italic leading-6 text-slate-700">
                <Quote className="h-4 w-4 flex-shrink-0 text-[#c3195d]" />
                {obituary.mf_quote}
              </div>
            </div>
          )}

          {obituary.md_content && (
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Obituary Content
              </p>
              <div className="min-h-[80px] whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                {obituary.md_content}
              </div>
            </div>
          )}

          {(obituary.mf_further_dtl || obituary.mf_further_dtl2) && (
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Additional Details
              </p>
              <div className="min-h-[60px] whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                {[obituary.mf_further_dtl, obituary.mf_further_dtl2]
                  .filter(Boolean)
                  .join('\n\n') || '-'}
              </div>
            </div>
          )}

          {obituary.pdf_name && (
            <div className="space-y-2 md:col-span-2">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Attached PDF
              </p>
              {/*
                NOTE: this points at the API's generic `/uploads` static mount
                (see api/src/index.js). Confirm the actual subfolder obituary
                PDFs are saved under and adjust this path if it differs.
              */}
              <a
                href={getUploadsUrl(obituary.pdf_name)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600 hover:underline"
              >
                <FileText className="h-4 w-4" />
                {obituary.pdf_name}
              </a>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-slate-200 bg-slate-50 p-6 text-xs text-slate-500 md:grid-cols-4">
          <div>
            <p className="font-bold uppercase text-slate-400">No.</p>
            <p className="mt-1 text-slate-700">{obituary.number_list ?? '-'}</p>
          </div>
          <div>
            <p className="font-bold uppercase text-slate-400">Created By</p>
            <p className="mt-1 text-slate-700">{obituary.mf_id ?? '-'}</p>
          </div>
          <div>
            <p className="font-bold uppercase text-slate-400">Created Date</p>
            <p className="mt-1 text-slate-700">
              {formatDate(obituary.create_date)} {obituary.create_time || ''}
            </p>
          </div>
          <div>
            <p className="font-bold uppercase text-slate-400">Theme</p>
            <p className="mt-1 text-slate-700">{obituary.mf_theme ?? '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

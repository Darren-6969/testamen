'use client';

import { ObituaryRecord } from '@/app/data/obituary';

// Live preview. MIRRORS the backend PDF template in
// api/src/utils/obituaryTemplates.js  keep the two visually in sync.

interface ThemeMeta {
  accent: string;
  background: string;
  orientation: 'portrait' | 'landscape';
}

const THEME_META: Record<string, ThemeMeta> = {
  d1: { accent: '#3f7cac', background: 'theme1-heaven-gates.jpg', orientation: 'portrait' },
  d2: { accent: '#4b5563', background: 'theme2-floral-bw.jpg', orientation: 'portrait' },
  d3: { accent: '#b08d57', background: 'theme3-gold-frame.jpg', orientation: 'landscape' },
  d4: { accent: '#c2724f', background: 'theme4-peach-floral.jpg', orientation: 'landscape' },
};

// Served by the API static mount, reachable through the Next /api rewrite.
const BG_BASE = '/api/uploads/obituary/backgrounds';
const IMG_BASE = '/api/uploads/obituary/images';

function formatDate(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
}

function calcAge(born: string | null, passed: string | null): string {
  if (!born || !passed) return '';
  const b = new Date(born);
  const p = new Date(passed);
  if (Number.isNaN(b.getTime()) || Number.isNaN(p.getTime())) return '';
  let age = p.getFullYear() - b.getFullYear();
  const m = p.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && p.getDate() < b.getDate())) age--;
  return age >= 0 ? String(age) : '';
}

export default function ObituaryPreview({
  data,
  imagePreviewUrl,
}: {
  data: ObituaryRecord;
  imagePreviewUrl: string | null;
}) {
  const theme = THEME_META[data.mf_theme] || THEME_META.d1;
  const accent = theme.accent;
  const age = calcAge(data.mf_born, data.mf_pass_date);
  const portrait =
    imagePreviewUrl || (data.mf_img ? `${IMG_BASE}/${data.mf_img}` : null);

  // Portrait A4 = 210:297, landscape A4 = 297:210.
  const aspect = theme.orientation === 'landscape' ? '297 / 210' : '210 / 297';

  return (
    <div
      className="rounded-lg overflow-hidden border border-neutral-200 flex items-center justify-center p-4"
      style={{
        aspectRatio: aspect,
        backgroundImage: `url('${BG_BASE}/${theme.background}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div
        className="w-full rounded-md text-center overflow-auto"
        style={{
          maxWidth: theme.orientation === 'landscape' ? '78%' : '86%',
          maxHeight: '100%',
          background: 'rgba(255,255,255,0.88)',
          padding: '5% 6%',
        }}
      >
        {data.md_content && (
          <p className="italic text-[11px] text-neutral-600 leading-relaxed mb-2 px-2">
            {data.md_content}
          </p>
        )}

        {portrait ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portrait}
            alt="portrait"
            className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
            style={{ border: `3px solid ${accent}` }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full mx-auto mb-2 bg-neutral-100"
            style={{ border: `3px solid ${accent}` }}
          />
        )}

        <div className="text-base font-bold" style={{ color: accent }}>
          {data.mf_fullname || '\u2014'}
        </div>

        <div className="text-[10px] text-neutral-500 mt-0.5">
          {formatDate(data.mf_born)}
          {data.mf_born_location ? ` (${data.mf_born_location})` : ''}
          {' \u2013 '}
          {formatDate(data.mf_pass_date)}
          {data.mf_pass_location ? ` (${data.mf_pass_location})` : ''}
          {age ? `  (Age ${age})` : ''}
        </div>

        {data.mf_quote && (
          <p className="italic text-[11px] text-neutral-600 my-2 px-2">{data.mf_quote}</p>
        )}

        <hr className="my-2" style={{ borderColor: accent, opacity: 0.4 }} />

        {(data.mf_wake_dtl_til || data.mf_wake_dtl_add) && (
          <div className="mb-2">
            <div
              className="text-[10px] font-bold uppercase tracking-wide mb-0.5"
              style={{ color: accent }}
            >
              Wake Details
            </div>
            <p className="text-[11px] text-neutral-700">
              {data.mf_wake_dtl_til} is resting peacefully at
            </p>
            <p className="text-[11px] text-neutral-700">{data.mf_wake_dtl_add}</p>
          </div>
        )}

        {(data.mf_cortehe_on || data.mf_location_funeral) && (
          <div className="mb-2">
            <div
              className="text-[10px] font-bold uppercase tracking-wide mb-0.5"
              style={{ color: accent }}
            >
              Funeral Details
            </div>
            <p className="text-[11px] text-neutral-700">
              Cortege will leave on {formatDate(data.mf_cortehe_on)}
            </p>
            <p className="text-[11px] text-neutral-700">{data.mf_location_funeral}</p>
          </div>
        )}

        {(data.mf_further_dtl || data.mf_further_dtl2) && (
          <div className="flex gap-4 text-left mt-2">
            <div className="flex-1 text-[10px] text-neutral-700 whitespace-pre-wrap">
              {data.mf_further_dtl}
            </div>
            <div className="flex-1 text-[10px] text-neutral-700 whitespace-pre-wrap">
              {data.mf_further_dtl2}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

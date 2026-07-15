'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Feather, Upload, Eye, Lock, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';
import PageHeader from '@/components/header/PageHeader';
import {
  ObituaryRecord,
  EMPTY_OBITUARY,
  fetchObituaryByMemorial,
  saveObituary,
  uploadObituaryImage,
  generateObituaryPdf,
} from '@/app/data/obituary';
import ObituaryPreview from '@/components/obituary/ObituaryPreview';

const BG_BASE = '/api/uploads/obituary/backgrounds';

const THEMES = [
  { id: 'd1', label: 'Heaven Gates', premium: false, background: 'theme1-heaven-gates.jpg', orientation: 'portrait' },
  { id: 'd2', label: 'Floral', premium: true, background: 'theme2-floral-bw.jpg', orientation: 'portrait' },
  { id: 'd3', label: 'Gold Frame', premium: true, background: 'theme3-gold-frame.jpg', orientation: 'landscape' },
  { id: 'd4', label: 'Peach Floral', premium: true, background: 'theme4-peach-floral.jpg', orientation: 'landscape' },
];

export default function ObituaryEditorPage() {
  const searchParams = useSearchParams();
  const { activeMemorial } = useActiveMemorial();

  const memorialId = searchParams.get('memorial') || activeMemorial?.numberList || null;

  const [form, setForm] = useState<ObituaryRecord>(EMPTY_OBITUARY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!memorialId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      const existing = await fetchObituaryByMemorial(memorialId);
      setForm(existing ?? EMPTY_OBITUARY);
      setHasSaved(!!existing);
      setIsDirty(false);
      setLoading(false);
    };
    load();
  }, [memorialId]);

  const update = useCallback(
    (field: keyof ObituaryRecord, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
    },
    []
  );

  const onImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setIsDirty(true);
  };

  // SAVE: upload image (if new) -> upsert record -> generate/overwrite PDF.
  const handleSave = async () => {
    if (!memorialId) {
      toast.error('No memorial selected. Open this from the dashboard.');
      return;
    }
    setSaving(true);
    const toastId = toast.loading('Saving obituary and updating PDF\u2026');
    try {
      let record = { ...form };

      if (imageFile) {
        const filename = await uploadObituaryImage(imageFile);
        if (!filename) {
          toast.error('Image upload failed.', { id: toastId });
          return;
        }
        record = { ...record, mf_img: filename };
        setImageFile(null);
        setImagePreviewUrl(null);
      }

      const saved = await saveObituary(memorialId, record);
      if (!saved.success) {
        toast.error('Failed to save obituary.', { id: toastId });
        return;
      }

      let next = saved.data ?? record;

      // Generate / overwrite the single PDF for this memorial.
      const gen = await generateObituaryPdf(memorialId);
      if (gen?.pdfName) {
        next = { ...next, pdf_name: gen.pdfName };
        toast.success('Saved. PDF updated.', { id: toastId });
      } else {
        toast.error('Saved, but the PDF could not be updated.', { id: toastId });
      }

      setForm(next);
      setHasSaved(true);
      setIsDirty(false);
    } finally {
      setSaving(false);
    }
  };

  // PREVIEW: just open the already-saved PDF in a new tab. Never writes a file.
  const handlePreview = () => {
    if (!memorialId) {
      toast.error('No memorial selected.');
      return;
    }
    if (isDirty) {
      toast.error('You have unsaved changes. Save first to preview the latest PDF.');
      return;
    }
    if (!hasSaved || !form.pdf_name) {
      toast.error('Save the obituary first — that creates its PDF.');
      return;
    }
    window.open(`/api/uploads/obituary/pdf/${form.pdf_name}`, '_blank');
  };

  if (!memorialId) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-10 text-center">
        <p className="text-sm font-medium text-neutral-700">No memorial selected</p>
        <p className="text-sm text-neutral-500 mt-1">
          Open the obituary editor from a memorial on your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        icon={<Feather className="h-6 w-6" />}
        subtitle={activeMemorial ? `Editing obituary for ${activeMemorial.name}` : 'Edit and generate the obituary'}
      >
        Obituary
      </PageHeader>

      {loading ? (
        <div className="bg-white rounded-xl border border-neutral-200 h-96 animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 items-start">
          <div className="space-y-4">
            <section className="bg-white rounded-xl border border-neutral-200 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#c3195d] mb-2">Content</h3>
              <label className="block text-xs text-neutral-500 mb-1">Prayer / opening</label>
              <textarea
                rows={3}
                maxLength={255}
                value={form.md_content ?? ''}
                onChange={(e) => update('md_content', e.target.value)}
                placeholder="Prayer: (example) Though I walk in the valley of the shadow of death..."
                className="w-full border border-neutral-200 rounded-lg p-2 text-sm"
              />
              <label className="block text-xs text-neutral-500 mb-1 mt-3">Portrait image</label>
              <label className="flex flex-col items-center justify-center border-[1.5px] border-dashed border-neutral-300 rounded-lg p-4 text-xs text-neutral-500 cursor-pointer hover:bg-neutral-50">
                <Upload size={18} />
                <span className="mt-1">{imageFile ? imageFile.name : 'Click to upload or drag an image'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={onImageSelected} />
              </label>
            </section>

            <section className="bg-white rounded-xl border border-neutral-200 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#c3195d] mb-2">Deceased Details</h3>
              <label className="block text-xs text-neutral-500 mb-1">Full name</label>
              <input
                value={form.mf_fullname ?? ''}
                onChange={(e) => update('mf_fullname', e.target.value)}
                className="w-full border border-neutral-200 rounded-lg h-9 px-3 text-sm"
              />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Born date</label>
                  <input
                    type="date"
                    value={form.mf_born ?? ''}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => update('mf_born', e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg h-9 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Date of departure</label>
                  <input
                    type="date"
                    value={form.mf_pass_date ?? ''}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => update('mf_pass_date', e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg h-9 px-3 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Born location</label>
                  <input
                    value={form.mf_born_location ?? ''}
                    onChange={(e) => update('mf_born_location', e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg h-9 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Place of rest</label>
                  <input
                    value={form.mf_pass_location ?? ''}
                    onChange={(e) => update('mf_pass_location', e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg h-9 px-3 text-sm"
                  />
                </div>
              </div>
              <label className="block text-xs text-neutral-500 mb-1 mt-3">Quote</label>
              <textarea
                rows={2}
                maxLength={255}
                value={form.mf_quote ?? ''}
                onChange={(e) => update('mf_quote', e.target.value)}
                className="w-full border border-neutral-200 rounded-lg p-2 text-sm"
              />
            </section>

            <section className="bg-white rounded-xl border border-neutral-200 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#c3195d] mb-2">Wake Details</h3>
              <div className="flex gap-2 items-center flex-wrap">
                <input
                  value={form.mf_wake_dtl_til ?? ''}
                  onChange={(e) => update('mf_wake_dtl_til', e.target.value)}
                  placeholder="(example) Madam Ally Mary"
                  className="flex-1 min-w-[180px] border border-neutral-200 rounded-lg h-9 px-3 text-sm"
                />
                <span className="text-xs text-neutral-500">is resting peacefully at</span>
              </div>
              <textarea
                rows={2}
                maxLength={100}
                value={form.mf_wake_dtl_add ?? ''}
                onChange={(e) => update('mf_wake_dtl_add', e.target.value)}
                placeholder="Address of church etc."
                className="w-full border border-neutral-200 rounded-lg p-2 text-sm mt-3"
              />
            </section>

            <section className="bg-white rounded-xl border border-neutral-200 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#c3195d] mb-2">Funeral Details</h3>
              <label className="block text-xs text-neutral-500 mb-1">Cortege will leave on</label>
              <input
                type="date"
                value={form.mf_cortehe_on ?? ''}
                onChange={(e) => update('mf_cortehe_on', e.target.value)}
                className="w-full border border-neutral-200 rounded-lg h-9 px-3 text-sm"
              />
              <label className="block text-xs text-neutral-500 mb-1 mt-3">Funeral location</label>
              <textarea
                rows={2}
                maxLength={255}
                value={form.mf_location_funeral ?? ''}
                onChange={(e) => update('mf_location_funeral', e.target.value)}
                className="w-full border border-neutral-200 rounded-lg p-2 text-sm"
              />
            </section>

            <section className="bg-white rounded-xl border border-neutral-200 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#c3195d] mb-2">Further Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <textarea
                  rows={3}
                  maxLength={255}
                  value={form.mf_further_dtl ?? ''}
                  onChange={(e) => update('mf_further_dtl', e.target.value)}
                  placeholder="(example) Husband: XXX"
                  className="w-full border border-neutral-200 rounded-lg p-2 text-sm"
                />
                <textarea
                  rows={3}
                  maxLength={255}
                  value={form.mf_further_dtl2 ?? ''}
                  onChange={(e) => update('mf_further_dtl2', e.target.value)}
                  placeholder="(example) Children: XXX"
                  className="w-full border border-neutral-200 rounded-lg p-2 text-sm"
                />
              </div>
            </section>
          </div>

          <div className="space-y-4 lg:sticky lg:top-4">
            <section className="bg-white rounded-xl border border-neutral-200 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#c3195d] mb-2">Design</h3>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((t) => {
                  const selected = form.mf_theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => update('mf_theme', t.id)}
                      className={`relative border-2 rounded-lg p-2 text-center text-xs transition-colors ${
                        selected ? 'border-[#c3195d] text-[#c3195d]' : 'border-neutral-200 text-neutral-500'
                      }`}
                    >
                      {t.premium && <Lock size={12} className="absolute top-1.5 right-1.5 text-[#c3195d] z-10" />}
                      <div
                        className="h-14 rounded mb-1 bg-neutral-100 bg-cover bg-center"
                        style={{ backgroundImage: `url('${BG_BASE}/${t.background}')` }}
                      />
                      {t.label}
                      <div className="text-neutral-400">{t.premium ? 'Premium' : 'Free'}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#c3195d]">Live Preview</h3>
                {isDirty && <span className="text-[11px] text-amber-600">Unsaved changes</span>}
              </div>
              <ObituaryPreview data={form} imagePreviewUrl={imagePreviewUrl} />

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-10 rounded-lg bg-[#c3195d] text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving\u2026' : 'Save'}
                </button>
                <button
                  onClick={handlePreview}
                  disabled={saving}
                  className="h-10 rounded-lg border border-[#c3195d] text-[#c3195d] text-sm font-medium flex items-center justify-center gap-2 hover:bg-pink-50 disabled:opacity-60"
                >
                  <Eye size={16} />
                  Preview PDF
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
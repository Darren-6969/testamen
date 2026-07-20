'use client';

import { useEffect, useRef, useState } from 'react';
import { Save, Upload, Music, Lock, Globe, User, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';
import MapPicker from '@/components/admin/MapPicker';
import {
  fetchProfile,
  saveProfile,
  uploadProfilePic,
  fetchCemeteryImages,
  uploadCemetery,
  deleteMedia,
  EMPTY_PROFILE,
  MUSIC_OPTIONS,
  MemorialProfile,
  MediaItem,
} from '@/app/data/admin';

const input =
  'w-full h-[40px] rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-[#c3195d] focus:outline-none focus:ring-2 focus:ring-[#c3195d]/30';
const label = 'block text-xs text-gray-500 mb-1.5';
const card = 'rounded-2xl border border-gray-100 bg-white p-6 shadow-sm';
const sectionTitle = 'mb-5 text-sm font-semibold uppercase tracking-wide text-[#c3195d]';

interface StagedFile {
  file: File;
  preview: string;
}

export default function MainPageTab() {
  const { activeMemorial } = useActiveMemorial();
  const memorialId = activeMemorial?.numberList || '';
  const [form, setForm] = useState<MemorialProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // cemetery images already saved in the DB
  const [existingCemetery, setExistingCemetery] = useState<MediaItem[]>([]);

  // --- staged (not yet saved) ---
  const [stagedPic, setStagedPic] = useState<StagedFile | null>(null);
  const [stagedCemetery, setStagedCemetery] = useState<StagedFile[]>([]);
  const [removedCemeteryIds, setRemovedCemeteryIds] = useState<string[]>([]);

  const picInput = useRef<HTMLInputElement>(null);
  const cemInput = useRef<HTMLInputElement>(null);

  // free any object URLs we created for previews
  const clearStaging = () => {
    if (stagedPic) URL.revokeObjectURL(stagedPic.preview);
    stagedCemetery.forEach((s) => URL.revokeObjectURL(s.preview));
    setStagedPic(null);
    setStagedCemetery([]);
    setRemovedCemeteryIds([]);
  };

  const load = async () => {
    if (!memorialId) return;
    setLoading(true);
    clearStaging();
    const [p, c] = await Promise.all([fetchProfile(memorialId), fetchCemeteryImages(memorialId)]);
    setForm(p);
    setExistingCemetery(c);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memorialId]);

  // revoke previews on unmount
  useEffect(() => {
    return () => {
      if (stagedPic) URL.revokeObjectURL(stagedPic.preview);
      stagedCemetery.forEach((s) => URL.revokeObjectURL(s.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k: keyof MemorialProfile, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // --- staging handlers (no upload, no toast) ---
  const onPicSelect = (file?: File | null) => {
    if (!file) return;
    if (stagedPic) URL.revokeObjectURL(stagedPic.preview);
    setStagedPic({ file, preview: URL.createObjectURL(file) });
  };

  const cemeteryCount =
    existingCemetery.filter((c) => !removedCemeteryIds.includes(c.id)).length + stagedCemetery.length;

  const onCemeterySelect = (files: FileList | null) => {
    if (!files || !files.length) return;
    const room = Math.max(0, 3 - cemeteryCount);
    const toAdd = Array.from(files).slice(0, room);
    setStagedCemetery((prev) => [
      ...prev,
      ...toAdd.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  };

  const removeStagedCemetery = (idx: number) => {
    setStagedCemetery((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[idx].preview);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const removeExistingCemetery = (id: string) => {
    setRemovedCemeteryIds((prev) => [...prev, id]);
  };

  // --- commit everything on Save ---
  const handleSave = async () => {
    if (!memorialId) return;
    setSaving(true);
    try {
      // 1) profile fields first (guarantees the mt_profile row exists)
      const res = await saveProfile(memorialId, form);
      if (res.status !== 'success') {
        toast.error(res.message || 'Failed to save');
        return;
      }
      // 2) cemetery deletions
      if (removedCemeteryIds.length) {
        await Promise.all(removedCemeteryIds.map((id) => deleteMedia('cemetery', id)));
      }
      // 3) cemetery uploads
      if (stagedCemetery.length) {
        await uploadCemetery(memorialId, stagedCemetery.map((s) => s.file));
      }
      // 4) profile picture (row now exists, so the UPDATE lands)
      if (stagedPic) {
        await uploadProfilePic(memorialId, stagedPic.file);
      }
      toast.success('Memorial details saved');
      await load(); // refresh from DB, clears staging
    } catch (e) {
      console.error(e);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={card}>
        <div className="py-16 text-center text-sm text-neutral-400">Loading...</div>
      </div>
    );
  }

  const visibleCemetery = existingCemetery.filter((c) => !removedCemeteryIds.includes(c.id));
  const picSrc = stagedPic?.preview || form.profilePic;

  return (
    <div className="space-y-5 pb-24">
      <input ref={picInput} type="file" accept="image/*" hidden onChange={(e) => { onPicSelect(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={cemInput} type="file" accept="image/*" multiple hidden onChange={(e) => { onCemeterySelect(e.target.files); e.target.value = ''; }} />

      {/* Basic information */}
      <div className={card}>
        <h4 className={sectionTitle}>Basic information</h4>
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-neutral-300">
              {picSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={picSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8" />
              )}
            </div>
            <button onClick={() => picInput.current?.click()} className="flex items-center gap-1 text-xs text-[#c3195d] hover:underline">
              <Upload className="h-3.5 w-3.5" /> Change photo
            </button>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={label}>Full name</label>
              <input className={input} value={form.fullname} onChange={(e) => set('fullname', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Memorial name</label>
              <input
                className={input}
                value={form.memorialName}
                placeholder={form.fullname || 'Shown on the dashboard and memorial cards'}
                onChange={(e) => set('memorialName', e.target.value)}
              />
              <p className="mt-1 text-xs text-neutral-400">
                Shown on your dashboard and memorial cards. Leave blank to use the full name, or set a nickname or preferred name.
              </p>
            </div>
            <div>
              <label className={label}>Gender</label>
              <select className={input} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={label}>Career</label>
              <input className={input} value={form.career} onChange={(e) => set('career', e.target.value)} />
            </div>
            <div>
              <label className={label}>Date of birth</label>
              <input type="date" className={input} value={form.bornDate} onChange={(e) => set('bornDate', e.target.value)} />
            </div>
            <div>
              <label className={label}>Place of birth</label>
              <input className={input} value={form.placeBirth} onChange={(e) => set('placeBirth', e.target.value)} />
            </div>
            <div>
              <label className={label}>Date of passing</label>
              <input type="date" className={input} value={form.passedDate} onChange={(e) => set('passedDate', e.target.value)} />
            </div>
            <div>
              <label className={label}>Place of passing</label>
              <input className={input} value={form.placePassing} onChange={(e) => set('placePassing', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className={label}>Cause of death</label>
              <input className={input} value={form.causeDeath} onChange={(e) => set('causeDeath', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Profile + Expression */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className={card}>
          <h4 className={sectionTitle}>Profile page</h4>
          <label className={label}>Favourite quote</label>
          <input className={input} value={form.favQuote} onChange={(e) => set('favQuote', e.target.value)} />
          <label className={`${label} mt-4`}>His / her story</label>
          <textarea className={`${input} h-32 py-2`} value={form.story} onChange={(e) => set('story', e.target.value)} />
        </div>
        <div className={card}>
          <h4 className={sectionTitle}>Expression page</h4>
          <label className={label}>My expression</label>
          <input className={input} value={form.myExpression} onChange={(e) => set('myExpression', e.target.value)} />
          <label className={`${label} mt-4`}>Our story</label>
          <textarea className={`${input} h-32 py-2`} value={form.ourStory} onChange={(e) => set('ourStory', e.target.value)} />
        </div>
      </div>

      {/* Cemetery info */}
      <div className={card}>
        <h4 className={sectionTitle}>Cemetery information</h4>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MapPicker
            value={{ lat: form.lat, lon: form.lon }}
            onChange={(p) =>
              setForm((f) => ({
                ...f,
                lat: p.lat,
                lon: p.lon,
                address: p.address ?? f.address,
                city: p.city || f.city,
                state: p.state || f.state,
                postcode: p.postcode || f.postcode,
              }))
            }
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label}>Full address</label>
              <input className={input} value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div>
              <label className={label}>Postcode</label>
              <input className={input} value={form.postcode} onChange={(e) => set('postcode', e.target.value)} />
            </div>
            <div>
              <label className={label}>City</label>
              <input className={input} value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div>
              <label className={label}>State</label>
              <input className={input} value={form.state} onChange={(e) => set('state', e.target.value)} />
            </div>
            <div>
              <label className={label}>Country</label>
              <input className={input} value={form.country} onChange={(e) => set('country', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Cemetery images */}
      <div className={card}>
        <h4 className={sectionTitle}>Cemetery images (max 3)</h4>
        <div className="flex flex-wrap gap-3">
          {cemeteryCount < 3 && (
            <button onClick={() => cemInput.current?.click()} className="flex h-28 w-28 flex-none flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-pink-200 text-xs text-[#b3567e] hover:bg-pink-50">
              <Upload className="h-5 w-5" /> Upload
            </button>
          )}
          {/* saved images */}
          {visibleCemetery.map((c) => (
            <div key={c.id} className="group relative h-28 w-28 flex-none overflow-hidden rounded-xl bg-neutral-100">
              {c.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.url} alt="" className="h-full w-full object-cover" />
              )}
              <button onClick={() => removeExistingCemetery(c.id)} aria-label="Remove" className="absolute right-1.5 top-1.5 hidden rounded-md bg-white/85 p-1 text-red-500 group-hover:block">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {/* staged (not yet saved) images */}
          {stagedCemetery.map((s, i) => (
            <div key={`staged-${i}`} className="group relative h-28 w-28 flex-none overflow-hidden rounded-xl bg-neutral-100 ring-2 ring-pink-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.preview} alt="" className="h-full w-full object-cover" />
              <button onClick={() => removeStagedCemetery(i)} aria-label="Remove" className="absolute right-1.5 top-1.5 hidden rounded-md bg-white/85 p-1 text-red-500 group-hover:block">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Theme + Music + Privacy */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className={card}>
          <h4 className={sectionTitle}>Theme (frame)</h4>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
            <input type="radio" checked={form.themeId === '1'} onChange={() => set('themeId', '1')} />
            Theme 1
          </label>
          <div className="mt-3 h-24 rounded-lg bg-neutral-100" />
        </div>

        <div className={card}>
          <h4 className={sectionTitle}>Background music</h4>
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-[#c3195d]" />
            <select className={input} value={form.music} onChange={(e) => set('music', e.target.value)}>
              <option value="">Choose music</option>
              {MUSIC_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={card}>
          <h4 className={sectionTitle}>Privacy</h4>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
            <input type="radio" checked={form.privacy === 'Public'} onChange={() => set('privacy', 'Public')} />
            <Globe className="h-4 w-4 text-neutral-400" /> Public
          </label>
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
            <input type="radio" checked={form.privacy === 'Private'} onChange={() => set('privacy', 'Private')} />
            <Lock className="h-4 w-4 text-neutral-400" /> Private (only you)
          </label>
        </div>
      </div>

      {/* Sticky save */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-100 bg-white/90 px-6 py-3 backdrop-blur lg:left-64">
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#c3195d] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#a81450] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
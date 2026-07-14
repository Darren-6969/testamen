'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  FolderPlus,
  ImagePlus,
  Star,
  X,
  Check,
  Plus,
  Pencil,
  FolderMinus,
  Images,
} from 'lucide-react';
import { toast } from 'sonner';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';
import {
  fetchBackgroundImages,
  fetchAlbums,
  fetchPhotos,
  uploadBackgrounds,
  uploadPhotos,
  createAlbum,
  updateAlbum,
  addPhotosToAlbum,
  removePhotosFromAlbum,
  setActiveBackground,
  deleteMedia,
  MediaItem,
  Album,
} from '@/app/data/admin';
import SectionLabel from '@/components/admin/SectionLabel';
import Thumb from '@/components/admin/Thumb';
import Lightbox from '@/components/admin/Lightbox';
import ConfirmDialog, { ConfirmData } from '@/components/admin/ConfirmDialog';

const uploadTile =
  'flex h-28 w-28 flex-none cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-pink-200 text-xs text-[#b3567e] transition hover:bg-pink-50 disabled:opacity-50';

export default function PhotosTab() {
  const { activeMemorial } = useActiveMemorial();
  const memorialId = activeMemorial?.numberList || '';
  const [backgrounds, setBackgrounds] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [lightbox, setLightbox] = useState<string | null>(null);

  // create-album modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [creating, setCreating] = useState(false);

  // album detail + edit
  const [openAlbum, setOpenAlbum] = useState<Album | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<MediaItem[]>([]);
  const [albumBusy, setAlbumBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLocation, setEditLocation] = useState('');

  // picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickable, setPickable] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickerBusy, setPickerBusy] = useState(false);

  // confirmation dialog for destructive / remove actions
  const [confirm, setConfirm] = useState<ConfirmData | null>(null);

  const bgInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const albumUploadInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!memorialId) return;
    setLoading(true);
    const [b, a, p] = await Promise.all([
      fetchBackgroundImages(memorialId),
      fetchAlbums(memorialId),
      fetchPhotos(memorialId),
    ]);
    setBackgrounds(b);
    setAlbums(a);
    setPhotos(p);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memorialId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (lightbox) setLightbox(null);
      else if (pickerOpen) setPickerOpen(false);
      else if (createOpen) setCreateOpen(false);
      else if (openAlbum) setOpenAlbum(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, pickerOpen, createOpen, openAlbum]);

  const onUpload = async (
    files: FileList | null,
    fn: (id: string, f: FileList) => Promise<{ status: string; message?: string }>
  ) => {
    if (!files || !files.length) return;
    setBusy(true);
    const res = await fn(memorialId, files);
    setBusy(false);
    if (res.status === 'success') {
      toast.success('Uploaded');
      load();
    } else toast.error(res.message || 'Upload failed');
  };

  const remove = async (kind: 'background' | 'photo', id: string) => {
    const res = await deleteMedia(kind, id);
    if (res.status === 'success') {
      toast.success('Removed');
      load();
    } else toast.error('Failed to remove');
  };

  const makeActive = async (id: string) => {
    const res = await setActiveBackground(id);
    if (res.status === 'success') {
      toast.success('Set as active backdrop');
      load();
    } else toast.error('Failed');
  };

  // ---- create album ----
  const submitCreate = async () => {
    if (!newTitle.trim()) return toast.error('Album title is required');
    setCreating(true);
    const res = await createAlbum(memorialId, {
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      location: newLocation.trim() || undefined,
    });
    setCreating(false);
    if (res.status === 'success') {
      toast.success('Album created');
      setCreateOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewLocation('');
      load();
    } else toast.error(res.message || 'Failed');
  };

  // ---- album detail ----
  const openAlbumModal = async (album: Album) => {
    setOpenAlbum(album);
    setEditing(false);
    setAlbumPhotos([]);
    setAlbumPhotos(await fetchPhotos(memorialId, album.id));
  };

  const startEdit = () => {
    if (!openAlbum) return;
    setEditTitle(openAlbum.title);
    setEditDesc(openAlbum.description || '');
    setEditLocation(openAlbum.location || '');
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!openAlbum) return;
    if (!editTitle.trim()) return toast.error('Title is required');
    const res = await updateAlbum(openAlbum.id, {
      title: editTitle.trim(),
      description: editDesc.trim() || undefined,
      location: editLocation.trim() || undefined,
    });
    if (res.status === 'success') {
      toast.success('Album updated');
      setOpenAlbum({ ...openAlbum, title: editTitle.trim(), description: editDesc.trim(), location: editLocation.trim() });
      setEditing(false);
      load();
    } else toast.error(res.message || 'Failed');
  };

  const uploadNewToAlbum = async (files: FileList | null) => {
    if (!files || !files.length || !openAlbum) return;
    setAlbumBusy(true);
    const res = await uploadPhotos(memorialId, files, openAlbum.id);
    setAlbumBusy(false);
    if (res.status === 'success') {
      toast.success('Added to album');
      setAlbumPhotos(await fetchPhotos(memorialId, openAlbum.id));
      load();
    } else toast.error(res.message || 'Upload failed');
  };

  const removeFromAlbum = async (id: string) => {
    if (!openAlbum) return;
    const res = await removePhotosFromAlbum(memorialId, openAlbum.id, [id]);
    if (res.status === 'success') {
      setAlbumPhotos(await fetchPhotos(memorialId, openAlbum.id));
      load();
    } else toast.error('Failed to remove');
  };

  // ---- picker ----
  const openPicker = async () => {
    if (!openAlbum) return;
    setSelected(new Set());
    const all = await fetchPhotos(memorialId);
    const inAlbum = new Set(albumPhotos.map((p) => p.id));
    setPickable(all.filter((p) => !inAlbum.has(p.id)));
    setPickerOpen(true);
  };

  const togglePick = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const confirmPick = async () => {
    if (!openAlbum || selected.size === 0) return;
    setPickerBusy(true);
    const res = await addPhotosToAlbum(memorialId, openAlbum.id, [...selected]);
    setPickerBusy(false);
    if (res.status === 'success') {
      toast.success('Added to album');
      setPickerOpen(false);
      setAlbumPhotos(await fetchPhotos(memorialId, openAlbum.id));
      load();
    } else toast.error(res.message || 'Failed');
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="py-16 text-center text-sm text-neutral-400">Loading...</div>
      </div>
    );
  }

  const inputCls = 'h-[40px] w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-[#c3195d] focus:outline-none focus:ring-2 focus:ring-[#c3195d]/30';

  return (
    <div className="space-y-5">
      <input ref={bgInput} type="file" accept="image/*" multiple hidden onChange={(e) => onUpload(e.target.files, uploadBackgrounds).then(() => (e.target.value = ''))} />
      <input ref={photoInput} type="file" accept="image/*" multiple hidden onChange={(e) => onUpload(e.target.files, uploadPhotos).then(() => (e.target.value = ''))} />
      <input ref={albumUploadInput} type="file" accept="image/*" multiple hidden onChange={(e) => uploadNewToAlbum(e.target.files).then(() => (e.target.value = ''))} />

      {/* Background */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <SectionLabel>Background image</SectionLabel>
        <div className="flex flex-wrap gap-3">
          <button disabled={busy} onClick={() => bgInput.current?.click()} className={uploadTile}>
            <Upload className="h-5 w-5" /> Upload
          </button>
          {backgrounds.map((b) => (
            <Thumb key={b.id} item={b} onOpen={() => b.url && setLightbox(b.url)} onDelete={() =>
              setConfirm({
                title: 'Delete background image?',
                message: "This removes it from the memorial's backdrop options. This can't be undone.",
                confirmLabel: 'Delete',
                tone: 'danger',
                onConfirm: () => remove('background', b.id),
              })
            }
              badge={b.isActive ? <span className="absolute left-1.5 top-1.5 rounded bg-[#c3195d] px-1.5 py-0.5 text-[10px] text-white">Active</span> : null}
              extra={!b.isActive ? (
                <button onClick={(e) => { e.stopPropagation(); makeActive(b.id); }} aria-label="Set active" className="rounded-md bg-white/85 p-1 text-[#c3195d]"><Star className="h-4 w-4" /></button>
              ) : null}
            />
          ))}
        </div>
      </div>

      {/* Albums */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <SectionLabel>Albums</SectionLabel>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setCreateOpen(true)} className={uploadTile}>
            <FolderPlus className="h-5 w-5" /> New album
          </button>
          {albums.map((a) => (
            <button key={a.id} onClick={() => openAlbumModal(a)} className="w-40 flex-none cursor-pointer overflow-hidden rounded-xl border border-gray-100 text-left transition hover:border-pink-200 hover:shadow-sm">
              <div className="flex h-24 items-center justify-center bg-neutral-100 text-neutral-300">
                {a.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.cover} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Images className="h-7 w-7" />
                )}
              </div>
              <div className="px-3 py-2">
                <div className="truncate text-sm font-medium text-neutral-700">{a.title}</div>
                <div className="text-xs text-neutral-400">{a.photoCount} photos</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Photos (all) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <SectionLabel>Photos</SectionLabel>
        <div className="flex flex-wrap gap-3">
          <button disabled={busy} onClick={() => photoInput.current?.click()} className={uploadTile}>
            <ImagePlus className="h-5 w-5" /> Upload
          </button>
          {photos.map((p) => (
            <Thumb key={p.id} item={p} onOpen={() => p.url && setLightbox(p.url)} onDelete={() =>
              setConfirm({
                title: 'Delete this photo?',
                message: "It will be removed from the gallery and any albums it's in.",
                confirmLabel: 'Delete',
                tone: 'danger',
                onConfirm: () => remove('photo', p.id),
              })
            } />
          ))}
        </div>
      </div>

      {/* ---------- Create album modal ---------- */}
      {createOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={() => setCreateOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">New album</h3>
              <button onClick={() => setCreateOpen(false)} aria-label="Close" className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Title</label>
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Album title" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Description</label>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional" rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#c3195d] focus:outline-none focus:ring-2 focus:ring-[#c3195d]/30" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Location</label>
                <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Optional" className={inputCls} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setCreateOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50">Cancel</button>
              <button onClick={submitCreate} disabled={creating} className="rounded-lg bg-[#c3195d] px-4 py-2 text-sm font-medium text-white hover:bg-[#a81450] disabled:opacity-60">{creating ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Album detail modal ---------- */}
      {openAlbum && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpenAlbum(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              {editing ? (
                <div className="flex-1 space-y-2 pr-3">
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Album title" className={inputCls} />
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#c3195d] focus:outline-none focus:ring-2 focus:ring-[#c3195d]/30" />
                  <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Location" className={inputCls} />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="rounded-lg bg-[#c3195d] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#a81450]">Save</button>
                    <button onClick={() => setEditing(false)} className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">{openAlbum.title}</h3>
                    {openAlbum.description && <p className="text-xs text-neutral-500">{openAlbum.description}</p>}
                    {openAlbum.location && <p className="text-xs text-neutral-400">{openAlbum.location}</p>}
                  </div>
                  <button onClick={startEdit} aria-label="Edit album" className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-[#c3195d]"><Pencil className="h-4 w-4" /></button>
                </div>
              )}
              <button onClick={() => setOpenAlbum(null)} aria-label="Close" className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100"><X className="h-5 w-5" /></button>
            </div>

            {!editing && (
              <div className="mb-4 flex gap-2">
                <button onClick={openPicker} className="flex items-center gap-1.5 rounded-lg bg-[#c3195d] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#a81450]">
                  <Plus className="h-4 w-4" /> Add from photos
                </button>
                <button disabled={albumBusy} onClick={() => albumUploadInput.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-neutral-600 hover:border-[#c3195d] hover:text-[#c3195d] disabled:opacity-50">
                  <Upload className="h-4 w-4" /> Upload new
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {albumPhotos.map((p) => (
                <Thumb key={p.id} item={p} onOpen={() => p.url && setLightbox(p.url)} onDelete={() =>
                  setConfirm({
                    title: 'Remove from this album?',
                    message: "The photo stays in your gallery; it's only removed from this album.",
                    confirmLabel: 'Remove',
                    tone: 'neutral',
                    onConfirm: () => removeFromAlbum(p.id),
                  })
                } deleteIcon={<FolderMinus className="h-4 w-4" />} deleteLabel="Remove from album" />
              ))}
              {albumPhotos.length === 0 && <div className="flex h-28 items-center text-sm text-neutral-400">No photos in this album yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* ---------- Picker ---------- */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[45] flex items-center justify-center bg-black/50 p-4" onClick={() => setPickerOpen(false)}>
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">Add existing photos</h3>
              <button onClick={() => setPickerOpen(false)} aria-label="Close" className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {pickable.length === 0 ? (
                <div className="py-10 text-center text-sm text-neutral-400">No other photos to add. Upload some in the Photos section first.</div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {pickable.map((p) => {
                    const isSel = selected.has(p.id);
                    return (
                      <button key={p.id} onClick={() => togglePick(p.id)} className={`relative h-24 w-24 flex-none cursor-pointer overflow-hidden rounded-xl ${isSel ? 'ring-2 ring-[#c3195d]' : ''}`}>
                        {p.url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.url} alt="" className="h-full w-full object-cover" />
                        )}
                        {isSel && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#c3195d] text-white"><Check className="h-3 w-3" /></span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button onClick={() => setPickerOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50">Cancel</button>
              <button onClick={confirmPick} disabled={pickerBusy || selected.size === 0} className="rounded-lg bg-[#c3195d] px-4 py-2 text-sm font-medium text-white hover:bg-[#a81450] disabled:opacity-50">
                {pickerBusy ? 'Adding...' : `Add ${selected.size || ''} photo${selected.size === 1 ? '' : 's'}`.trim()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Confirm delete / remove ---------- */}
      <ConfirmDialog data={confirm} onClose={() => setConfirm(null)} />

      {/* ---------- Lightbox ---------- */}
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
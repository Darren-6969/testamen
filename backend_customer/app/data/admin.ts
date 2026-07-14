// app/data/admin.ts
// Data layer for the customer Admin module, wired to /api/admin/*.
// Scoping: memorialId = mt_deceased.number_list.

export interface StorageInfo {
  usedMb: number;
  totalMb: number;
  plan: string;
}

export interface MemorialProfile {
  profilePic: string | null;
  fullname: string;
  gender: string;
  career: string;
  bornDate: string;
  placeBirth: string;
  passedDate: string;
  placePassing: string;
  causeDeath: string;
  favQuote: string;
  story: string;
  myExpression: string;
  ourStory: string;
  address: string;
  postcode: string;
  city: string;
  state: string;
  country: string;
  lat: string;
  lon: string;
  themeId: string;
  music: string;
  privacy: 'Public' | 'Private';
}

export interface MediaItem {
  id: string;
  url: string | null;
  caption?: string;
  createdBy?: string;
  createdAt?: string;
  isActive?: boolean;
  sizeBytes?: number;
}

export interface Album {
  id: string;
  title: string;
  description?: string;
  location?: string;
  cover: string | null;
  photoCount: number;
}

export interface VideoItem {
  id: string;
  url: string | null;
  poster: string | null;
  mediaType: 'video' | 'audio';
  description?: string;
  sizeBytes?: number;
}

export interface ApprovalItem {
  id: string; // composite "photo:<id>" | "video:<id>"
  url: string | null;
  poster?: string | null;
  kind: 'photo' | 'video';
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface Tribute {
  id: string;
  by: string;
  description: string;
  date: string;
}

export const EMPTY_PROFILE: MemorialProfile = {
  profilePic: null,
  fullname: '',
  gender: '',
  career: '',
  bornDate: '',
  placeBirth: '',
  passedDate: '',
  placePassing: '',
  causeDeath: '',
  favQuote: '',
  story: '',
  myExpression: '',
  ourStory: '',
  address: '',
  postcode: '',
  city: '',
  state: '',
  country: 'Malaysia',
  lat: '',
  lon: '',
  themeId: '1',
  music: '',
  privacy: 'Public',
};

export const MUSIC_OPTIONS = ['music1.mp3', 'music2.mp3', 'music3.mp3'];

type Result = { status: string; message?: string; url?: string };

async function getJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: 'no-store', headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as T;
  } catch (e) {
    console.error(url, e);
    return fallback;
  }
}

async function mutate(url: string, method: string, body?: unknown): Promise<Result> {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || String(res.status));
    return { status: 'success', ...json };
  } catch (e) {
    console.error(url, e);
    return { status: 'error', message: (e as Error).message };
  }
}

async function upload(url: string, memorialId: string, files: FileList | File[], extra?: Record<string, string>): Promise<Result> {
  try {
    const fd = new FormData();
    fd.append('memorialId', memorialId);
    if (extra) Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
    Array.from(files).forEach((f) => fd.append('files', f));
    const res = await fetch(url, { method: 'POST', body: fd }); // no Content-Type -> browser sets boundary
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || String(res.status));
    return { status: 'success', ...json };
  } catch (e) {
    console.error(url, e);
    return { status: 'error', message: (e as Error).message };
  }
}

// ------------------------------------------------------------- storage
export async function fetchStorage(_memorialId?: string): Promise<StorageInfo> {
  return getJson<StorageInfo>('/api/admin/storage', { usedMb: 0, totalMb: 0, plan: 'Free' });
}

// ------------------------------------------------------------- main page
export async function fetchProfile(memorialId: string): Promise<MemorialProfile> {
  return getJson<MemorialProfile>(`/api/admin/profile/${encodeURIComponent(memorialId)}`, EMPTY_PROFILE);
}
export async function saveProfile(memorialId: string, data: MemorialProfile): Promise<Result> {
  return mutate('/api/admin/profile/save', 'POST', { ...data, memorialId });
}
export async function uploadProfilePic(memorialId: string, file: File): Promise<Result> {
  return upload('/api/admin/profile/photo', memorialId, [file]);
}
export async function fetchCemeteryImages(memorialId: string): Promise<MediaItem[]> {
  return getJson<MediaItem[]>(`/api/admin/cemetery/${encodeURIComponent(memorialId)}`, []);
}
export async function uploadCemetery(memorialId: string, files: FileList | File[]): Promise<Result> {
  return upload('/api/admin/cemetery/upload', memorialId, files);
}

// ------------------------------------------------------------- photos & albums
export async function fetchBackgroundImages(memorialId: string): Promise<MediaItem[]> {
  return getJson<MediaItem[]>(`/api/admin/background/${encodeURIComponent(memorialId)}`, []);
}
export async function uploadBackgrounds(memorialId: string, files: FileList | File[]): Promise<Result> {
  return upload('/api/admin/background/upload', memorialId, files);
}
export async function setActiveBackground(id: string): Promise<Result> {
  return mutate(`/api/admin/background/${id}/active`, 'PATCH');
}
export async function fetchAlbums(memorialId: string): Promise<Album[]> {
  return getJson<Album[]>(`/api/admin/albums/${encodeURIComponent(memorialId)}`, []);
}
export async function createAlbum(
  memorialId: string,
  data: { title: string; description?: string; location?: string }
): Promise<Result> {
  return mutate('/api/admin/albums/create', 'POST', { ...data, memorialId });
}
export async function fetchPhotos(memorialId: string, albumId?: string): Promise<MediaItem[]> {
  const q = albumId ? `?albumId=${encodeURIComponent(albumId)}` : '';
  return getJson<MediaItem[]>(`/api/admin/photos/${encodeURIComponent(memorialId)}${q}`, []);
}
export async function uploadPhotos(
  memorialId: string,
  files: FileList | File[],
  albumId?: string
): Promise<Result> {
  return upload('/api/admin/photos/upload', memorialId, files, albumId ? { albumId } : undefined);
}
// add existing photos to an album (link -- photos stay in Photos section)
export async function addPhotosToAlbum(
  memorialId: string,
  albumId: string,
  photoIds: string[]
): Promise<Result> {
  return mutate('/api/admin/albums/link', 'POST', { memorialId, albumId, photoIds });
}
// remove photos from an album (unlink only)
export async function removePhotosFromAlbum(
  memorialId: string,
  albumId: string,
  photoIds: string[]
): Promise<Result> {
  return mutate('/api/admin/albums/unlink', 'POST', { memorialId, albumId, photoIds });
}
// edit album title / description / location
export async function updateAlbum(
  albumId: string,
  data: { title: string; description?: string; location?: string }
): Promise<Result> {
  return mutate(`/api/admin/albums/${albumId}`, 'PATCH', data);
}

// ------------------------------------------------------------- videos
export async function fetchVideos(memorialId: string): Promise<VideoItem[]> {
  return getJson<VideoItem[]>(`/api/admin/videos/${encodeURIComponent(memorialId)}`, []);
}
export async function uploadVideos(memorialId: string, files: FileList | File[]): Promise<Result> {
  return upload('/api/admin/videos/upload', memorialId, files);
}

// ------------------------------------------------------------- approval
export async function fetchApprovals(memorialId: string): Promise<ApprovalItem[]> {
  return getJson<ApprovalItem[]>(`/api/admin/approval/${encodeURIComponent(memorialId)}`, []);
}
export async function setApproval(id: string, decision: 'approved' | 'rejected'): Promise<Result> {
  return mutate(`/api/admin/approval/${encodeURIComponent(id)}`, 'PATCH', { decision });
}

// ------------------------------------------------------------- tributes
export async function fetchTributes(memorialId: string): Promise<Tribute[]> {
  return getJson<Tribute[]>(`/api/admin/tributes/${encodeURIComponent(memorialId)}`, []);
}
export async function deleteTribute(id: string): Promise<Result> {
  return mutate(`/api/admin/tributes/${id}`, 'DELETE');
}

// ------------------------------------------------------------- generic media delete
export async function deleteMedia(
  kind: 'background' | 'photo' | 'album' | 'video' | 'cemetery',
  id: string
): Promise<Result> {
  const path =
    kind === 'photo'
      ? `/api/admin/photos/${id}`
      : kind === 'video'
      ? `/api/admin/videos/${id}`
      : kind === 'background'
      ? `/api/admin/background/${id}`
      : kind === 'cemetery'
      ? `/api/admin/cemetery/${id}`
      : `/api/admin/${kind}/${id}`;
  return mutate(path, 'DELETE');
}
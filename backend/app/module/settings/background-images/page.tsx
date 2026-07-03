'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import {
  ArrowLeft,
  ImageIcon,
  Monitor,
  Smartphone,
  UploadCloud,
  X,
  Save,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const MODULE_COLOR = '#c3195d';

type BgImageStatus = 1 | 2;

type BgImage = {
  id: number;
  bg_image: string;
  img_order?: string | number | null;
  status: BgImageStatus;
  image_url?: string;
};

type UploadPreview = {
  file: File;
  previewUrl: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

function getImageUrl(item: BgImage) {
  if (item.image_url && item.image_url !== 'null') {
    return item.image_url;
  }

  if (!item.bg_image) {
    return '';
  }

  const folder = Number(item.status) === 1 ? 'desktop' : 'mobile';

  return `${API_BASE_URL}/uploads/background-images/${folder}/${item.bg_image}`;
}

async function fetchBackgroundImages() {
  const res = await fetch(`${API_BASE_URL}/api/background-images`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch background images');
  }

  const result = await res.json();

  if (Array.isArray(result)) return result as BgImage[];
  if (Array.isArray(result?.data)) return result.data as BgImage[];

  return [];
}

async function uploadBackgroundImages(status: BgImageStatus, files: File[]) {
  const formData = new FormData();

  formData.append('status', String(status));

  files.forEach((file) => {
    formData.append('images', file);
  });

  const res = await fetch(`${API_BASE_URL}/api/background-images/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Failed to upload background images');
  }

  return res.json();
}

async function updateBackgroundImageOrder(id: number, imgOrder: string) {
  const res = await fetch(`${API_BASE_URL}/api/background-images/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      img_order: imgOrder,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to update image order');
  }

  return res.json();
}

async function deleteBackgroundImage(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/background-images/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('Failed to delete background image');
  }

  return res.json();
}

export default function BackgroundImagesPage() {
  const router = useRouter();

  const [images, setImages] = useState<BgImage[]>([]);
  const [loading, setLoading] = useState(true);

  const [uploadModal, setUploadModal] = useState<{
    open: boolean;
    status: BgImageStatus;
    title: string;
  }>({
    open: false,
    status: 1,
    title: '',
  });

  const [selectedImage, setSelectedImage] = useState<BgImage | null>(null);
  const [selectedOrder, setSelectedOrder] = useState('');

  const desktopImages = useMemo(
    () => images.filter((item) => Number(item.status) === 1),
    [images]
  );

  const mobileImages = useMemo(
    () => images.filter((item) => Number(item.status) === 2),
    [images]
  );

  const loadImages = async () => {
    try {
      setLoading(true);
      const data = await fetchBackgroundImages();
      setImages(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load background images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const openUploadModal = (status: BgImageStatus) => {
    setUploadModal({
      open: true,
      status,
      title:
        status === 1
          ? 'Upload Desktop Background Images'
          : 'Upload Mobile Background Images',
    });
  };

  const closeUploadModal = () => {
    setUploadModal({
      open: false,
      status: 1,
      title: '',
    });
  };

  const handleImageClick = (item: BgImage) => {
    setSelectedImage(item);
    setSelectedOrder(item.img_order ? String(item.img_order) : '');
  };

  const handleUpdateOrder = async () => {
    if (!selectedImage) return;

    try {
      await updateBackgroundImageOrder(selectedImage.id, selectedOrder);
      toast.success('Image order updated successfully');
      setSelectedImage(null);
      await loadImages();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update image order');
    }
  };

  const handleDeleteImage = async () => {
    if (!selectedImage) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this background image?'
    );

    if (!confirmed) return;

    try {
      await deleteBackgroundImage(selectedImage.id);
      toast.success('Background image deleted successfully');
      setSelectedImage(null);
      await loadImages();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete background image');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ImageIcon className="h-5 w-5 text-[#c3195d]" />}
        subtitle="Manage desktop and mobile background images"
      >
        <span className="text-[#c3195d]">Background Images</span>
      </PageHeader>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/module/settings')}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-[#c3195d]/40 hover:text-[#c3195d]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </button>

        <button
          type="button"
          onClick={loadImages}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-[#c3195d]/40 hover:text-[#c3195d]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <BackgroundImageSection
        title="Background Image for Desktop"
        description="Used for desktop or wider screen display."
        icon={<Monitor className="h-5 w-5" />}
        images={desktopImages}
        loading={loading}
        onUpload={() => openUploadModal(1)}
        onImageClick={handleImageClick}
      />

      <BackgroundImageSection
        title="Background Image for Mobile"
        description="Used for mobile or smaller screen display."
        icon={<Smartphone className="h-5 w-5" />}
        images={mobileImages}
        loading={loading}
        onUpload={() => openUploadModal(2)}
        onImageClick={handleImageClick}
      />

      {uploadModal.open && (
        <UploadImageModal
          title={uploadModal.title}
          status={uploadModal.status}
          currentCount={
            uploadModal.status === 1 ? desktopImages.length : mobileImages.length
          }
          onClose={closeUploadModal}
          onSuccess={async () => {
            closeUploadModal();
            await loadImages();
          }}
        />
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Background Image Detail
                </h2>
                <p className="text-sm text-slate-500">
                  Update image order or remove this image.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img
                  src={getImageUrl(selectedImage)}
                  alt={selectedImage.bg_image || 'Background image'}
                  className="h-72 w-full object-cover"
                  onError={(event) => {
                    console.error(
                      'Selected image failed to load:',
                      getImageUrl(selectedImage),
                      selectedImage
                    );
                    event.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Image Order
                </label>
                <input
                  value={selectedOrder}
                  onChange={(event) => setSelectedOrder(event.target.value)}
                  placeholder="Enter image order"
                  className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#c3195d] focus:ring-4 focus:ring-[#c3195d]/10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={handleDeleteImage}
                className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUpdateOrder}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#c3195d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a9154f]"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BackgroundImageSection({
  title,
  description,
  icon,
  images,
  loading,
  onUpload,
  onImageClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  images: BgImage[];
  loading: boolean;
  onUpload: () => void;
  onImageClick: (item: BgImage) => void;
}) {
  const canUpload = images.length < 2;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c3195d]/10 text-[#c3195d]">
            {icon}
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
            <p className="mt-1 text-xs font-semibold text-[#c3195d]">
              {images.length}/2 images uploaded
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={!canUpload}
          onClick={onUpload}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
            canUpload
              ? 'bg-[#c3195d] text-white hover:bg-[#a9154f]'
              : 'cursor-not-allowed bg-slate-100 text-slate-400'
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          Upload Images
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <ImageIcon className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            No background images uploaded yet.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Click upload to add background images.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onImageClick(item)}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-[#c3195d]/40 hover:shadow-lg"
            >
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img
                  src={getImageUrl(item)}
                  alt={item.bg_image || 'Background image'}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  onError={(event) => {
                    console.error('Image failed to load:', getImageUrl(item), item);
                    event.currentTarget.style.display = 'none';
                  }}
                />

                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent opacity-0 transition group-hover:opacity-100">
                  <div className="w-full p-4">
                    <p className="text-xs font-semibold text-white">
                      Click to edit
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {item.bg_image}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Image Order:{' '}
                  <span className="font-semibold text-[#c3195d]">
                    {item.img_order || '-'}
                  </span>
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function UploadImageModal({
  title,
  status,
  currentCount,
  onClose,
  onSuccess,
}: {
  title: string;
  status: BgImageStatus;
  currentCount: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previews, setPreviews] = useState<UploadPreview[]>([]);
  const [saving, setSaving] = useState(false);

  const remainingSlot = 2 - currentCount;

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;

    const selectedFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (selectedFiles.length === 0) {
      toast.error('Please select image files only');
      return;
    }

    if (selectedFiles.length > remainingSlot) {
      toast.error(`You can only upload ${remainingSlot} more image(s)`);
      return;
    }

    const nextPreviews = selectedFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPreviews(nextPreviews);
  };

  const removePreview = (index: number) => {
    setPreviews((current) => {
      const target = current[index];

      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleUpload = async () => {
    if (previews.length === 0) {
      toast.error('Please select image first');
      return;
    }

    try {
      setSaving(true);
      await uploadBackgroundImages(
        status,
        previews.map((item) => item.file)
      );

      toast.success('Background image uploaded successfully');
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload background image');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">
              Maximum 2 images allowed. Remaining slot: {remainingSlot}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleFileChange(event.target.files)}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#c3195d]/40 bg-[#c3195d]/5 px-6 py-8 text-center transition hover:bg-[#c3195d]/10"
          >
            <UploadCloud className="h-10 w-10 text-[#c3195d]" />
            <p className="mt-3 text-sm font-bold text-slate-900">
              Upload Photo From File
            </p>
            <p className="mt-1 text-sm text-slate-500">
              PNG, JPG, JPEG, or WEBP image files
            </p>
          </button>

          {previews.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {previews.map((item, index) => (
                <div
                  key={item.previewUrl}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                >
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-44 w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removePreview(index)}
                    className="absolute right-3 top-3 rounded-full bg-white p-2 text-slate-500 shadow transition hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="p-3">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {item.file.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleUpload}
            className="inline-flex items-center gap-2 rounded-xl bg-[#c3195d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a9154f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
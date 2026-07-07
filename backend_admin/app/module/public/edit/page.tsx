'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import Input from '@/components/input/Input';
import Select from '@/components/input/SelectInput';
import FormField from '@/components/input/FormField';
import ValidatedButton from '@/components/button/ValidatedButton';
import { useDynamicFields } from '@/components/generic/useDynamicFields';
import { FieldDef } from '../../../types/index';
import { getContentById, updateContent } from '@/app/data/contents';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

type ContentRecord = {
  id: number;
  name: string;
  type: string;
  start_date: string | null;
  end_date: string | null;
  display_status: string;
  image: string | null;
};

export default function EditContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentId = searchParams.get('id');

  const fieldRefs = useRef<Array<HTMLInputElement | HTMLSelectElement | null>>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const contentFields: FieldDef<any>[] = [
    { key: 'name', label: 'Content Name', value: '', validationRules: { required: true } },
    {
      key: 'type',
      label: 'Type',
      value: '',
      validationRules: { required: true },
      options: [
        { label: 'Package', value: 'Package' },
        { label: 'Promotion', value: 'Promotion' },
      ],
    },
    { key: 'start_date', label: 'Start Date', value: '', validationRules: { required: true } },
    { key: 'end_date', label: 'End Date', value: '', validationRules: { required: true } },
    {
      key: 'display_status',
      label: 'Display Status',
      value: 'SHOW',
      validationRules: { required: true },
      options: [
        { label: 'SHOW', value: 'SHOW' },
        { label: 'HIDE', value: 'HIDE' },
      ],
    },
  ];

  const { fields, handleFieldChange } = useDynamicFields(contentFields);

  const toDateInputValue = (
    raw: string | Date | null | undefined
  ): string => {
    if (!raw) return '';

    if (raw instanceof Date) {
      if (isNaN(raw.getTime())) return '';
      const yyyy = raw.getFullYear();
      const mm = String(raw.getMonth() + 1).padStart(2, '0');
      const dd = String(raw.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) return '';

      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }

      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }

      return trimmed.slice(0, 10);
    }

    return '';
  };
  

  useEffect(() => {
    if (!contentId) {
      toast.error('Missing content ID.');
      router.push('/module/content');
      return;
    }

    const loadContent = async () => {
      try {
        const data: ContentRecord = await getContentById(contentId);
        console.log('🧩 Content data:', data);

        handleFieldChange('name', data.name ?? '');
        handleFieldChange('type', data.type ?? '');
        handleFieldChange('start_date', toDateInputValue(data.start_date));
        handleFieldChange('end_date', toDateInputValue(data.end_date));
        handleFieldChange('display_status', data.display_status ?? 'SHOW');

        // --- Normalize image path ---
        let normalized: string | null = null;
        if (data.image) {
          let img = data.image.trim();

          if (img) {
            if (img.startsWith('http://') || img.startsWith('https://')) {
              normalized = img;
            }
            else if (img.startsWith('/')) {
              normalized = img;
            }
            else {
              normalized = `/uploads/content_images/${img}`;
            }
          }
        }

        console.log('📷 normalized image path:', normalized);
        setCurrentImage(normalized);
      } catch (err) {
        console.error('Failed to load content:', err);
        toast.error('Failed to load content details.');
        router.push('/module/content');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [contentId]);

  const validatedFields = fields.map((f, idx) => ({
    key: f.key,
    name: f.label,
    value: f.value,
    validationRules: f.validationRules,
    ref: { current: fieldRefs.current[idx] } as any,
  }));

  // ---------- Delete image ----------
  const handleDeleteImage = async () => {
    if (!contentId) return;
    if (!currentImage) return;

    if (!confirm('Delete current image?')) return;

    try {
      const res = await fetch(`/api/content/${contentId}/image`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Delete failed');

      toast.success('Image deleted.');
      setCurrentImage(null);
      setImageFile(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete image.');
    }
  };

  const onValidSubmitHandler = async () => {
    if (!contentId) {
      toast.error('Invalid content ID.');
      return;
    }

    const formData = new FormData();

    fields.forEach(f => {
      formData.append(f.key, f.value ?? '');
    });

    // Only append new image if user selected one
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const success = await updateContent(contentId, formData, true);

      if (success) {
        toast.success('Content updated successfully!');
        router.push('/module/content');
      } else {
        toast.error('Failed to update content.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Unexpected error while updating content.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto rounded-2xl p-8 shadow-sm border bg-[var(--card-bg)] text-[var(--card-text)] border-[var(--border-color)]">
        <p>Loading content...</p>
      </div>
    );
  }

  // Build final src/href same way as activation
  const buildImageSrc = (img: string | null) => {
    if (!img) return '';

    return `/api${img}`;
  };

  const currentImageSrc = buildImageSrc(currentImage);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">Edit Content</h1>
    <div className="bg-white shadow-sm rounded-2xl p-8 space-y-8">
      

      {/* Main form grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((f) => (
          <FormField
            key={f.key}
            label={f.label}
            required={f.validationRules?.required}
          >
            {f.options ? (
              <Select
                id={f.key}
                value={f.value}
                options={f.options}
                onChange={e => handleFieldChange(f.key, e.target.value)}
              />
            ) : (
              <Input
                id={f.key}
                type={
                  f.key.includes('date')
                    ? 'date'
                    : f.key.includes('time')
                    ? 'time'
                    : 'text'
                }
                value={f.value}
                placeholder={`Enter ${f.label.toLowerCase()}`}
                onChange={e => handleFieldChange(f.key, e.target.value)}
              />
            )}
          </FormField>
        ))}
      </div>

      {/* Main Image section (below form) */}
      <div className="mt-1 space-y-1">
        <h2 className="text-lg font-semibold text-[var(--text)]">Main Image</h2>
        <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Preview */}
        <div className="w-full md:w-72">
          {currentImageSrc ? (
            <div className="space-y-2">
              <a href={currentImageSrc} target="_blank" rel="noreferrer" className="inline-block">
                <div className="w-full rounded-lg border overflow-hidden bg-white">
                  <img
                    src={currentImageSrc}
                    alt="Content image"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </a>

              <button
                type="button"
                onClick={handleDeleteImage}
                className="text-red-500 text-xs hover:underline"
              >
                Delete
              </button>
            </div>
          ) : (
            <p className="text-xs text-[var(--muted-text)]">No image uploaded.</p>
          )}
        </div>

        {/* File input */}
        <div className="w-full md:w-64">
          <input
            type="file"
            id="image"
            onChange={e => setImageFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          {imageFile && (
            <p className="text-xs mt-1 text-[var(--muted-text)]">
              Selected: <strong>{imageFile.name}</strong>
            </p>
          )}
        </div>
      </div>

      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
        <ValidatedButton
          variant="danger"
          fields={validatedFields}
          onValidSubmit={onValidSubmitHandler}
        >
          Save Changes
        </ValidatedButton>
        <ValidatedButton
          variant="outline"
          fields={[]}
          onValidSubmit={() => router.push('/module/content')}
        >
          Cancel
        </ValidatedButton>
      </div>
    </div>
    </div>
  );
}

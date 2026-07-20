'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  fetchDeceasedById,
  updateDeceased,
  Deceased,
} from '@/app/data/deceased';
import PageHeader from '@/components/header/PageHeader';
import { HandHeart, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

function EditDeceasedForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Number(searchParams.get('id'));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<Partial<Deceased>>({});

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    (async () => {
      const record = await fetchDeceasedById(id);

      if (!record) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setForm(record);
      setLoading(false);
    })();
  }, [id]);

  const handleChange = (field: keyof Deceased, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.memorial_name?.trim()) {
      toast.error('Memorial name is required.');
      return;
    }

    setSaving(true);

    try {
      const result = await updateDeceased(id, {
        memorial_name: form.memorial_name?.trim(),
        gender: form.gender,
        register_date: form.register_date,
        code_no: form.code_no,
        url_name: form.url_name,
        status: form.status,
      });

      if (!result) {
        throw new Error('Failed to update deceased record.');
      }

      toast.success('Deceased record updated successfully.');
      router.push('/module/deceased');
      router.refresh();
    } catch (error) {
      console.error('Edit deceased error:', error);
      toast.error('Failed to update deceased record.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<HandHeart className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Update deceased record information"
        >
          <span className="text-[#c3195d]">Edit Deceased</span>
        </PageHeader>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-sm text-gray-500">
          Loading record...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<HandHeart className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Update deceased record information"
        >
          <span className="text-[#c3195d]">Edit Deceased</span>
        </PageHeader>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <p className="text-sm text-gray-500">Deceased record not found.</p>
          <button
            type="button"
            onClick={() => router.push('/module/deceased')}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<HandHeart className="h-5 w-5 text-[#c3195d]" />}
        subtitle="Update deceased record information"
      >
        <span className="text-[#c3195d]">Edit Deceased</span>
      </PageHeader>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid grid-cols-1 gap-5">

            {/* Memorial name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Memorial Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.memorial_name ?? ''}
                onChange={(e) => handleChange('memorial_name', e.target.value)}
                placeholder="Enter memorial name"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
              />
            </div>

            {/* Registered by */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Registered By
              </label>
              <input
                type="text"
                value={form.registered_account ?? ''}
                readOnly
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 outline-none"
              />
            </div>

            {/* Gender and registration date */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Gender
                </label>
                <select
                  value={form.gender ?? ''}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Registration Date
                </label>
                <input
                  type="date"
                  value={
                    form.register_date
                      ? String(form.register_date).slice(0, 10)
                      : ''
                  }
                  onChange={(e) => handleChange('register_date', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
                />
              </div>
            </div>

            {/* Code no and url name */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Code No
                </label>
                <input
                  type="text"
                  value={form.code_no ?? ''}
                  onChange={(e) => handleChange('code_no', e.target.value)}
                  placeholder="Enter code no"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  URL Name
                </label>
                <input
                  type="text"
                  value={form.url_name ?? ''}
                  onChange={(e) => handleChange('url_name', e.target.value)}
                  placeholder="Enter URL name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Status
              </label>
              <select
                value={form.status ?? ''}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
              >
                <option value="">Select status</option>
                <option value="0">Inactive</option>
                <option value="1">Active</option>
              </select>
            </div>

          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-5">

            <button
              type="button"
              onClick={() => router.push('/module/deceased')}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#c3195d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a8144f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Update Deceased'}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

export default function EditDeceasedPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <PageHeader
            icon={<HandHeart className="h-5 w-5 text-[#c3195d]" />}
            subtitle="Update deceased record information"
          >
            <span className="text-[#c3195d]">Edit Deceased</span>
          </PageHeader>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-sm text-gray-500">
            Loading record...
          </div>
        </div>
      }
    >
      <EditDeceasedForm />
    </Suspense>
  );
}

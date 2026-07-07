'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Database, Save } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/header/PageHeader';
import Input from '@/components/input/Input';
import ValidatedButton from '@/components/button/ValidatedButton';

import { fetchStorageById, updateStorage } from '@/app/data/storage';

export default function EditStoragePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = Number(searchParams.get('id'));

  const [form, setForm] = useState({
    feature_plan: '',
    storage_mb: '',
    price_rm: '',
   status: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const data = await fetchStorageById(id);

        if (!data) {
          setErrorMessage('Storage plan not found.');
          return;
        }

        setForm({
          feature_plan: data.feature_plan || '',
          storage_mb: data.storage_mb ? String(data.storage_mb) : '',
          price_rm: data.price_rm ? String(data.price_rm) : '',
          status: data.status || '',
        });
      } catch (err) {
        console.error('load storage error:', err);
        setErrorMessage('Failed to load storage plan.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!id) return;

    setSaving(true);
    setErrorMessage(null);

    try {
      await updateStorage(id, {
        feature_plan: form.feature_plan,
        storage_mb: Number(form.storage_mb),
        price_rm: Number(form.price_rm),
        status: form.status,
      });

      toast.success('Storage updated successfully');
      router.push('/module/storage');
      router.refresh();
    } catch (err: any) {
      console.error('update storage error:', err);

      const message =
        err?.message || 'Failed to update storage. Please try again.';

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/module/storage');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<Database className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Loading storage plan information"
        >
          <span className="text-[#c3195d]">Edit Storage Plan</span>
        </PageHeader>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading storage plan information...
        </div>
      </div>
    );
  }

  if (!form.feature_plan && errorMessage) {
    return (
      <div className="space-y-6">
        <PageHeader
  icon={<Database className="h-5 w-5 text-[#c3195d]" />}
  subtitle="Update storage plan information"
>
  <span className="text-[#c3195d]">Edit Storage Plan</span>
</PageHeader>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-medium text-red-700">
          {errorMessage}
        </div>

        <button
          type="button"
          onClick={() => router.push('/module/storage')}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Storage Listing
        </button>
      </div>
    );
  }

return (
  <div className="space-y-6">
    <PageHeader
      icon={<Database className="h-5 w-5 text-[#c3195d]" />}
      subtitle="Update storage plan information"
    >
      <span className="text-[#c3195d]">Edit Storage Plan</span>
    </PageHeader>

    <div className="bg-white shadow-sm rounded-2xl p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Feature Plan"
          value={form.feature_plan}
          onChange={(e) =>
            handleChange('feature_plan', e.target.value)
          }
        />

        <Input
          label="Storage (MB)"
          type="number"
          value={form.storage_mb}
          onChange={(e) => handleChange('storage_mb', e.target.value)}
        />

        <Input
          label="Price (RM)"
          type="number"
          value={form.price_rm}
          onChange={(e) => handleChange('price_rm', e.target.value)}
        />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-600">
          Status
        </label>

        <select
        value={form.status}
        onChange={(e) => handleChange('status', e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-[#c3195d] focus:outline-none"
        >
        <option value="" disabled>
          Select status
        </option>

        <option value="active">ACTIVE</option>
        <option value="inactive">INACTIVE</option>
      </select>
    </div>
  </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <ValidatedButton
          fields={[
            {
              name: 'Feature Plan',
              value: form.feature_plan,
              validationRules: { required: true },
            },
            {
              name: 'Storage (MB)',
              value: form.storage_mb,
              validationRules: { required: true },
            },
            {
              name: 'Price (RM)',
              value: form.price_rm,
              validationRules: { required: true },
            },
            {
              name: 'Status',
              value: form.status,
              validationRules: { required: true },
            },
          ]}
          onValidSubmit={handleSubmit}
          disabled={saving}
          variant="primary"
        >
          {saving ? (
            'Saving...'
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </span>
        )}
        </ValidatedButton>

        <ValidatedButton
          variant="outline"
          fields={[]}
          onValidSubmit={handleCancel}
        >
          Cancel
        </ValidatedButton>
      </div>
    </div>
  </div>
);
}
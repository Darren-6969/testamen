'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';

export interface StorageFormData {
  feature_plan: string;
  storage_mb: string;
  price_rm: string;
  status: string;
}

interface StorageFormProps {
  initialData?: Partial<StorageFormData>;
  submitLabel?: string;
  saving?: boolean;
  errorMessage?: string | null;
  onSubmit: (data: StorageFormData) => Promise<void> | void;
  onCancel: () => void;
}

const defaultFormData: StorageFormData = {
  feature_plan: '',
  storage_mb: '',
  price_rm: '',
  status: 'active',
};

export default function StorageForm({
  initialData,
  submitLabel = 'Save Storage Plan',
  saving = false,
  errorMessage = null,
  onSubmit,
  onCancel,
}: StorageFormProps) {
  const [formData, setFormData] = useState<StorageFormData>({
    ...defaultFormData,
    ...initialData,
  });

  const handleChange = (field: keyof StorageFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.feature_plan.trim()) {
      alert('Please enter a plan name.');
      return;
    }

    if (!formData.storage_mb || Number(formData.storage_mb) <= 0) {
      alert('Please enter a valid storage capacity in MB.');
      return;
    }

    if (!formData.price_rm || Number(formData.price_rm) < 0) {
      alert('Please enter a valid price.');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
    >
      <div className="border-b border-slate-200 bg-gradient-to-r from-pink-50 via-white to-white px-6 py-5">
        <h2 className="text-lg font-bold text-slate-900">
          Storage Details
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure the plan name, storage capacity, and pricing.
        </p>
      </div>

      <div className="p-6">
        {errorMessage ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Plan Name <span className="text-[#c3195d]">*</span>
            </label>
            <input
              value={formData.feature_plan}
              onChange={(e) => handleChange('feature_plan', e.target.value)}
              disabled={saving}
              placeholder="e.g., Pro, Enterprise"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              disabled={saving}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10"
            >
              <option value="active">ACTIVE</option>
              <option value="inactive">INACTIVE</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Storage Capacity (MB) <span className="text-[#c3195d]">*</span>
            </label>
            <div className="relative rounded-2xl shadow-sm">
              <input
                type="number"
                min="1"
                value={formData.storage_mb}
                onChange={(e) => handleChange('storage_mb', e.target.value)}
                disabled={saving}
                placeholder="2048"
                className="w-full rounded-2xl border border-slate-200 bg-white pr-12 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-xs font-semibold">MB</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Pricing (RM) <span className="text-[#c3195d]">*</span>
            </label>
            <div className="relative rounded-2xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-xs font-semibold">RM</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price_rm}
                onChange={(e) => handleChange('price_rm', e.target.value)}
                disabled={saving}
                placeholder="0.00"
                className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#c3195d]/20 bg-gradient-to-r from-[#c3195d] to-[#a5124b] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-900/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

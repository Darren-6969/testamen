'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';

export interface StorageFormData {
  title: string;
  description: string;
  victim: string;
  date_of_incident: string;
  time: string;
  location: string;
  status: string;
  casualty_count: string;
  reference_link: string;
}

interface IncidentFormProps {
  initialData?: Partial<StorageFormData>;
  submitLabel?: string;
  saving?: boolean;
  errorMessage?: string | null;
  onSubmit: (data: StorageFormData) => Promise<void> | void;
  onCancel: () => void;
}

const defaultFormData: StorageFormData = {
  title: '',
  description: '',
  victim: '',
  date_of_incident: '',
  time: '',
  location: '',
  status: 'ACTIVE',
  casualty_count: '0',
  reference_link: '',
};

export default function IncidentForm({
  initialData,
  submitLabel = 'Save Incident',
  saving = false,
  errorMessage = null,
  onSubmit,
  onCancel,
}: IncidentFormProps) {
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

    if (!formData.title.trim()) {
      alert('Please enter incident title.');
      return;
    }

    if (!formData.location.trim()) {
      alert('Please enter location.');
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
          Incident Information
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Fill in the incident details, casualty information, status and reference link.
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
              Incident Title <span className="text-[#c3195d]">*</span>
            </label>
            <input
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              disabled={saving}
              placeholder="Example: COVID"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Date of Incident
            </label>
            <input
              type="date"
              value={formData.date_of_incident}
              onChange={(e) => handleChange('date_of_incident', e.target.value)}
              disabled={saving}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Time
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
              disabled={saving}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              No. of Casualty
            </label>
            <input
              type="number"
              min="0"
              value={formData.casualty_count}
              onChange={(e) => handleChange('casualty_count', e.target.value)}
              disabled={saving}
              placeholder="0"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Location <span className="text-[#c3195d]">*</span>
            </label>
            <input
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              disabled={saving}
              placeholder="Example: MALAYSIA"
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
              <option value="ACTIVE">ACTIVE</option>
              <option value="MONITORING">MONITORING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Victim / Affected Person
            </label>
            <input
              value={formData.victim}
              onChange={(e) => handleChange('victim', e.target.value)}
              disabled={saving}
              placeholder="Victim name or affected group"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Reference Link
            </label>
            <input
              value={formData.reference_link}
              onChange={(e) => handleChange('reference_link', e.target.value)}
              disabled={saving}
              placeholder="https://example.com"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-slate-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={saving}
              placeholder="Describe the incident details..."
              rows={5}
              className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c3195d]/50 focus:ring-4 focus:ring-[#c3195d]/10"
            />
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
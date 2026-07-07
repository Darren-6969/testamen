'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';

export interface ReportFormData {
  report_name: string;
  type: string;
  start_date: string;
  end_date: string;
  format: string;
}

interface ReportFormProps {
  initialData?: Partial<ReportFormData>;
  submitLabel?: string;
  saving?: boolean;
  errorMessage?: string | null;
  onSubmit: (data: ReportFormData) => Promise<void> | void;
  onCancel: () => void;
}

const defaultFormData: ReportFormData = {
  report_name: '',
  type: 'Registration Report',
  start_date: '',
  end_date: '',
  format: 'PDF',
};

export default function ReportForm({
  initialData,
  submitLabel = 'Generate Report',
  saving = false,
  errorMessage = null,
  onSubmit,
  onCancel,
}: ReportFormProps) {
  const [formData, setFormData] = useState<ReportFormData>({
    ...defaultFormData,
    ...initialData,
  });

  const handleChange = (field: keyof ReportFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.report_name.trim()) {
      alert('Please enter report name.');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      alert('Please select start and end date.');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
    >
      {/* Header */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-pink-50 via-white to-white px-6 py-5">
        <h2 className="text-lg font-bold text-slate-900">
          Generate Report
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure report details and export settings.
        </p>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Error */}
        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* Report Name */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Report Name <span className="text-pink-600">*</span>
            </label>
            <input
              value={formData.report_name}
              onChange={(e) => handleChange('report_name', e.target.value)}
              disabled={saving}
              placeholder="Example: Monthly Registration Report"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
            />
          </div>

          {/* Report Type */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Report Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              disabled={saving}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="Registration Report">Registration Report</option>
              <option value="Deceased Report">Deceased Report</option>
              <option value="Incident Report">Incident Report</option>
              <option value="Obituary Report">Obituary Report</option>
              <option value="Feedback Report">Feedback Report</option>
              <option value="Billing & Payment Report">Billing & Payment Report</option>
              <option value="Public Prayer Report">Public Prayer Report</option>
              <option value="User Management Report">User Management Report</option>
              <option value="Storage Usage Report">Storage Usage Report</option>
            </select>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Export Format
            </label>
            <select
              value={formData.format}
              onChange={(e) => handleChange('format', e.target.value)}
              disabled={saving}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="PDF">PDF</option>
              <option value="Excel">Excel (.xlsx)</option>
              <option value="CSV">CSV</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Start Date <span className="text-pink-600">*</span>
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              disabled={saving}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              End Date <span className="text-pink-600">*</span>
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              disabled={saving}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#c3195d] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#a5124b]"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Generating...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
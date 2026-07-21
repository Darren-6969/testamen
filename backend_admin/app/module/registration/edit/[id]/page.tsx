'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, TriangleAlert } from 'lucide-react';

import PageHeader from '@/components/header/PageHeader';
import {
  fetchRegistrationById,
  updateRegistration,
  RegistrationDetail,
  RegistrationUpdatePayload,
} from '@/app/data/registration';

const STATUS_OPTIONS: RegistrationDetail['status'][] = [
  'Active',
  'Pending',
  'Inactive',
];

type FormState = RegistrationUpdatePayload;

const splitName = (fullName: string): { firstName: string; lastName: string } => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { firstName: parts[0] || '', lastName: '' };
  }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
};

const toFormState = (data: RegistrationDetail): FormState => {
  const hasNameOnRecord = Boolean(data.first_name || data.last_name);
  const fallback = hasNameOnRecord
    ? { firstName: data.first_name ?? '', lastName: data.last_name ?? '' }
    : splitName(data.username || '');

  return {
    first_name: fallback.firstName,
    last_name: fallback.lastName,
    email: data.email ?? '',
    gender: data.gender ?? '',
    phone_number: data.phone_number ?? data.contact ?? '',
    country_code: data.country_code ?? '',
    status: data.status ?? 'Pending',
  };
};

const inputClass =
  'w-full rounded-2xl border p-3 text-sm focus:border-[#c3195d] focus:outline-none focus:ring-1 focus:ring-[#c3195d]';
const labelClass = 'text-xs font-bold uppercase text-slate-400';

export default function EditRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const registrationId = Number(params?.id);

  const [registration, setRegistration] = useState<RegistrationDetail | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!registrationId) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchRegistrationById(registrationId);
        setRegistration(data);
        if (data) setForm(toFormState(data));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [registrationId]);

  const handleChange = (
    field: keyof FormState
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!registrationId) return;

    setSaving(true);

    try {
      const result = await updateRegistration(registrationId, form);

      if (!result.success) {
        alert(result.message);
        return;
      }

      alert('Registration updated successfully');
      router.push(`/module/registration/view/${registrationId}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to update registration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<Save className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Loading registration information"
        >
          <span className="text-[#c3195d]">Edit Registration</span>
        </PageHeader>

        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          Loading registration details...
        </div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<TriangleAlert className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Registration not found"
        >
          <span className="text-[#c3195d]">Edit Registration</span>
        </PageHeader>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-600">
          Registration record not found.
        </div>

        <button
          onClick={() => router.push('/module/registration')}
          className="inline-flex items-center gap-2 rounded-xl border px-5 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Registration
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Save className="h-5 w-5 text-[#c3195d]" />}
        subtitle="Edit registration information"
      >
        <span className="text-[#c3195d]">Edit Registration</span>
      </PageHeader>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.push(`/module/registration/view/${registrationId}`)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#c3195d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#a81450] disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b bg-gradient-to-r from-pink-50 to-white px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900">{registration.username}</h2>
          <p className="text-sm text-slate-500">Code No. {registration.code_no}</p>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <p className={labelClass}>Full Name</p>
            <input
              type="text"
              className={inputClass}
              value={[form.first_name, form.last_name].filter(Boolean).join(' ')}
              onChange={(e) => {
                const { firstName, lastName } = splitName(e.target.value);
                setForm((prev) => ({ ...prev, first_name: firstName, last_name: lastName }));
              }}
            />
          </div>

          <div className="space-y-2">
            <p className={labelClass}>Email Address</p>
            <input
              type="email"
              className={inputClass}
              value={form.email ?? ''}
              onChange={handleChange('email')}
            />
          </div>

          <div className="space-y-2">
            <p className={labelClass}>Gender</p>
            <input
              type="text"
              className={inputClass}
              value={form.gender ?? ''}
              onChange={handleChange('gender')}
            />
          </div>

          <div className="space-y-2">
            <p className={labelClass}>Contact Number</p>
            <input
              type="text"
              className={inputClass}
              value={form.phone_number ?? ''}
              onChange={handleChange('phone_number')}
            />
          </div>

          <div className="space-y-2">
            <p className={labelClass}>Country Code</p>
            <input
              type="text"
              className={inputClass}
              value={form.country_code ?? ''}
              onChange={handleChange('country_code')}
              placeholder="e.g. +60"
            />
          </div>

          <div className="space-y-2">
            <p className={labelClass}>Status</p>
            <select
              className={inputClass}
              value={form.status ?? 'Pending'}
              onChange={handleChange('status')}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import {
  ArrowLeft,
  Code2,
  Save,
  RefreshCw,
  Info,
  Calculator,
} from 'lucide-react';
import { toast } from 'sonner';

const MODULE_COLOR = '#c3195d';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type ReferralSettings = {
  id?: number;
  mb_per_referral: number;
  max_referrals: number;
};

async function fetchReferralSettings() {
  const res = await fetch(`${API_BASE_URL}/api/referral-settings`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch referral settings');
  }

  const result = await res.json();

  if (result?.data) {
    return result.data as ReferralSettings;
  }

  return {
    mb_per_referral: 10,
    max_referrals: 4,
  };
}

async function updateReferralSettings(payload: ReferralSettings) {
  const res = await fetch(`${API_BASE_URL}/api/referral-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mb_per_referral: payload.mb_per_referral,
      max_referrals: payload.max_referrals,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to update referral settings');
  }

  return res.json();
}

export default function ReferralSettingsPage() {
  const router = useRouter();

  const [form, setForm] = useState<ReferralSettings>({
    mb_per_referral: 10,
    max_referrals: 4,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const totalBonusMb =
    Number(form.mb_per_referral || 0) * Number(form.max_referrals || 0);

  const loadSettings = async () => {
    try {
      setLoading(true);

      const data = await fetchReferralSettings();

      setForm({
        id: data.id,
        mb_per_referral: Number(data.mb_per_referral || 0),
        max_referrals: Number(data.max_referrals || 0),
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load referral settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (
    field: keyof ReferralSettings,
    value: string
  ) => {
    const numberValue = Math.max(0, Number(value || 0));

    setForm((current) => ({
      ...current,
      [field]: numberValue,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await updateReferralSettings({
        mb_per_referral: Math.max(0, Number(form.mb_per_referral || 0)),
        max_referrals: Math.max(0, Number(form.max_referrals || 0)),
      });

      toast.success('Referral settings updated successfully');
      await loadSettings();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update referral settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Code2 className="h-5 w-5 text-[#c3195d]" />}
        subtitle="Configure referral reward and storage bonus settings"
      >
        <span className="text-[#c3195d]">Referral Settings</span>
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
          onClick={loadSettings}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-[#c3195d]/40 hover:text-[#c3195d]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c3195d]/10 text-[#c3195d]">
                  <Code2 className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Referral Reward Configuration
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Set how much extra storage users can receive from successful referrals.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              {loading ? (
                <div className="space-y-4">
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Extra Storage per Successful Referral (MB)
                    </label>

                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={form.mb_per_referral}
                      onChange={(event) =>
                        handleChange('mb_per_referral', event.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#c3195d] focus:ring-4 focus:ring-[#c3195d]/10"
                      placeholder="Example: 10"
                    />

                    <p className="mt-2 flex items-start gap-2 text-sm text-slate-500">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#c3195d]" />
                      Example: 10 means user gets +10MB for each friend using their referral code.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Maximum Referrals that Count
                    </label>

                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={form.max_referrals}
                      onChange={(event) =>
                        handleChange('max_referrals', event.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#c3195d] focus:ring-4 focus:ring-[#c3195d]/10"
                      placeholder="Example: 4"
                    />

                    <p className="mt-2 flex items-start gap-2 text-sm text-slate-500">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#c3195d]" />
                      Example: 4 means up to 4 friends can count for referral bonus.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push('/module/settings')}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving || loading}
                onClick={handleSave}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c3195d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a9154f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c3195d]/10 text-[#c3195d]">
                <Calculator className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Bonus Preview
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Estimated maximum referral storage bonus.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#c3195d]/5 p-5">
              <p className="text-sm font-semibold text-slate-500">
                Maximum Bonus
              </p>

              <p className="mt-2 text-3xl font-bold text-[#c3195d]">
                {totalBonusMb}MB
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {form.max_referrals || 0} referrals ×{' '}
                {form.mb_per_referral || 0}MB
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">
              Current Rule
            </h3>

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span>Per Referral</span>
                <span className="font-bold text-[#c3195d]">
                  {form.mb_per_referral || 0}MB
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span>Referral Limit</span>
                <span className="font-bold text-[#c3195d]">
                  {form.max_referrals || 0}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span>Total Bonus</span>
                <span className="font-bold text-[#c3195d]">
                  {totalBonusMb}MB
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import {
  ArrowLeft,
  PackageCheck,
  Save,
  RefreshCw,
  HardDrive,
  BadgeDollarSign,
  Hash,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

type FeaturePlan = {
  id: number;
  feature_plan: string;
  status: string | number;
  storage_mb: string | number;
  price_rm: string | number;
};

async function fetchPlansStorage() {
  const res = await fetch(`${API_BASE_URL}/api/plans-storage`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch plans and storage settings');
  }

  const result = await res.json();

  if (Array.isArray(result)) return result as FeaturePlan[];
  if (Array.isArray(result?.data)) return result.data as FeaturePlan[];

  return [];
}

async function updatePlansStorage(plans: FeaturePlan[]) {
  const res = await fetch(`${API_BASE_URL}/api/plans-storage`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plans: plans.map((item) => ({
        id: item.id,
        storage_mb: Number(item.storage_mb || 0),
        price_rm: Number(item.price_rm || 0),
      })),
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to update plans and storage settings');
  }

  return res.json();
}

export default function PlansStoragePage() {
  const router = useRouter();

  const [plans, setPlans] = useState<FeaturePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const totalStorageMb = useMemo(() => {
    return plans.reduce((total, item) => total + Number(item.storage_mb || 0), 0);
  }, [plans]);

  const totalPriceRm = useMemo(() => {
    return plans.reduce((total, item) => total + Number(item.price_rm || 0), 0);
  }, [plans]);

  const loadPlans = async () => {
    try {
      setLoading(true);

      const data = await fetchPlansStorage();

      setPlans(
        data.map((item) => ({
          ...item,
          id: Number(item.id),
          status: Number(item.status || 0),
          storage_mb: Number(item.storage_mb || 0),
          price_rm: Number(item.price_rm || 0),
        }))
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to load plans and storage settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleChange = (
    id: number,
    field: 'storage_mb' | 'price_rm',
    value: string
  ) => {
    const numberValue = Math.max(0, Number(value || 0));

    setPlans((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: numberValue,
            }
          : item
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await updatePlansStorage(plans);

      toast.success('Plans updated successfully');
      await loadPlans();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update plans');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<PackageCheck className="h-5 w-5 text-[#c3195d]" />}
        subtitle="Manage feature plans, storage limits, and pricing"
      >
        <span className="text-[#c3195d]">Plans &amp; Storage Settings</span>
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
          onClick={loadPlans}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-[#c3195d]/40 hover:text-[#c3195d]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <SummaryCard
          icon={<Layers className="h-5 w-5" />}
          label="Total Plans"
          value={plans.length.toString()}
        />

        <SummaryCard
          icon={<HardDrive className="h-5 w-5" />}
          label="Total Storage"
          value={`${totalStorageMb} MB`}
        />

        <SummaryCard
          icon={<BadgeDollarSign className="h-5 w-5" />}
          label="Total Price"
          value={`RM ${totalPriceRm.toFixed(2)}`}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c3195d]/10 text-[#c3195d]">
              <PackageCheck className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Plan Configuration
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Update storage amount and one-time price for each feature plan.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="border-b border-slate-200 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    ID
                  </div>
                </th>

                <th className="border-b border-slate-200 px-6 py-4">
                  Plan Code
                </th>

                <th className="border-b border-slate-200 px-6 py-4">
                  Status / Order
                </th>

                <th className="border-b border-slate-200 px-6 py-4">
                  Storage (MB)
                </th>

                <th className="border-b border-slate-200 px-6 py-4">
                  Price (RM, One-Time)
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <>
                  {[1, 2, 3].map((item) => (
                    <tr key={item}>
                      <td colSpan={5} className="px-6 py-3">
                        <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
                      </td>
                    </tr>
                  ))}
                </>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center">
                      <PackageCheck className="h-10 w-10 text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No plans found.
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Please add plan records in mt_feature first.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                plans.map((item) => (
                  <tr
                    key={item.id}
                    className="text-sm text-slate-700 transition hover:bg-[#c3195d]/5"
                  >
                    <td className="border-b border-slate-100 px-6 py-4 font-semibold text-slate-900">
                      {item.id}
                    </td>

                    <td className="border-b border-slate-100 px-6 py-4">
                      <span className="inline-flex rounded-full bg-[#c3195d]/10 px-3 py-1 text-xs font-bold text-[#c3195d]">
                        {item.feature_plan}
                      </span>
                    </td>

                    <td className="border-b border-slate-100 px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {item.status}
                      </span>
                    </td>

                    <td className="border-b border-slate-100 px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={item.storage_mb}
                        onChange={(event) =>
                          handleChange(item.id, 'storage_mb', event.target.value)
                        }
                        className="h-11 w-full min-w-36 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#c3195d] focus:ring-4 focus:ring-[#c3195d]/10"
                      />
                    </td>

                    <td className="border-b border-slate-100 px-6 py-4">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.price_rm}
                        onChange={(event) =>
                          handleChange(item.id, 'price_rm', event.target.value)
                        }
                        className="h-11 w-full min-w-36 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#c3195d] focus:ring-4 focus:ring-[#c3195d]/10"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {plans.length > 0 && (
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/module/settings')}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Discard
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
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c3195d]/10 text-[#c3195d]">
          {icon}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
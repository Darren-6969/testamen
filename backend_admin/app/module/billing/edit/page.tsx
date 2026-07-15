'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import { CreditCard, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { fetchBillingById, updateBilling } from '@/app/data/billing';

const PACKAGES = [
  { code: 'FREE', name: 'Free Plan', amount: 0 },
  { code: 'STANDARD', name: 'Standard', amount: 20 },
  { code: 'PLUS', name: 'Plus', amount: 200 },
  { code: 'PREMIUM', name: 'Premium', amount: 200 },
];

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'Online Transfer', label: 'Online Transfer' },
  { value: 'E-Wallet', label: 'E-Wallet' },
];

export default function EditBillPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading...</p>}>
      <EditBillForm />
    </Suspense>
  );
}

function EditBillForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');

  const [form, setForm] = useState({
    user: '',
    package: '',
    amount: '',
    status: 'Unpaid',
    payment_method: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Load existing record
  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const load = async () => {
      const record = await fetchBillingById(Number(id));

      if (!record) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setForm({
        user: record.fullname ?? '',
        package: record.plan_code ?? '',
        amount: record.amount_rm != null ? String(record.amount_rm) : '',
        status: record.status ?? 'Unpaid',
        payment_method: record.payment_method ?? '',
      });
      setLoading(false);
    };

    load();
  }, [id]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePackageChange = (packageCode: string) => {
    const selected = PACKAGES.find((p) => p.code === packageCode);
    setForm((prev) => ({
      ...prev,
      package: packageCode,
      amount: selected ? String(selected.amount) : prev.amount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.user || !form.package || !form.amount) {
      toast.error('Please fill required fields.');
      return;
    }

    setSaving(true);

    try {
      const result = await updateBilling(Number(id), {
        fullname: form.user,
        plan_code: form.package,
        amount_rm: Number(form.amount),
        payment_method: form.status === 'Paid' ? form.payment_method || undefined : undefined,
        status: form.status,
      });

      if (!result?.success) {
        throw new Error('Failed to update bill');
      }

      toast.success('Bill updated successfully');
      router.push('/module/billing');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update bill');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<CreditCard className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Loading billing record..."
        >
          <span className="text-[#c3195d]">Edit Bill</span>
        </PageHeader>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<CreditCard className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Edit an existing billing record"
        >
          <span className="text-[#c3195d]">Edit Bill</span>
        </PageHeader>
        <p className="text-sm text-red-600">Billing record not found.</p>
        <button
          onClick={() => router.push('/module/billing')}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Billing
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<CreditCard className="h-5 w-5 text-[#c3195d]" />}
        subtitle="Edit an existing billing record"
      >
        <span className="text-[#c3195d]">Edit Bill</span>
      </PageHeader>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-5">
            {/* USER */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                User <span className="text-red-500">*</span>
              </label>
              <input
                value={form.user}
                onChange={(e) => handleChange('user', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
                placeholder="Enter user name"
              />
            </div>

            {/* PACKAGE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Package <span className="text-red-500">*</span>
              </label>
              <select
                value={form.package}
                onChange={(e) => handlePackageChange(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
              >
                <option value="">Select package</option>
                {PACKAGES.map((pkg) => (
                  <option key={pkg.code} value={pkg.code}>
                    {pkg.name}
                  </option>
                ))}
              </select>
            </div>

            {/* AMOUNT */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Amount (RM) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
                placeholder="0.00"
              />
            </div>

            {/* STATUS */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            {/* PAYMENT METHOD */}
            {form.status === 'Paid' && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Payment Method
                </label>
                <select
                  value={form.payment_method}
                  onChange={(e) => handleChange('payment_method', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
                >
                  <option value="">Select payment method</option>
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>
                      {pm.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={() => router.push('/module/billing')}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#c3195d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a8144f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

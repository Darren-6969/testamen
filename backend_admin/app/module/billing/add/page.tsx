'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import { CreditCard, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createBilling } from '@/app/data/billing';

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

export default function AddBillPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    user: '',
    package: '',
    amount: '',
    status: 'Unpaid',
    payment_method: '',
    payment_date: '',
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePackageChange = (packageCode: string) => {
    const selected = PACKAGES.find((p) => p.code === packageCode);
    setForm((prev) => ({
      ...prev,
      package: packageCode,
      amount: selected ? String(selected.amount) : '',
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
      
      const result = await createBilling({
        fullname: form.user,
        plan_code: form.package,
        amount_rm: Number(form.amount),
        payment_method: form.status === 'Paid' ? form.payment_method || null : null,
        status: form.status,
      });

      if (!result?.success) {
        throw new Error('Failed to create bill');
      }

      toast.success('Bill created successfully');
      router.push('/module/billing');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<CreditCard className="h-5 w-5 text-[#c3195d]" />}
        subtitle="Create a new billing record"
      >
        <span className="text-[#c3195d]">Add Bill</span>
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
                readOnly
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none"
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

            {/* PAYMENT DETAILS */}
            {form.status === 'Paid' && (
              <>
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

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={form.payment_date}
                    onChange={(e) => handleChange('payment_date', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
                  />
                </div>
              </>
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
              {saving ? 'Saving...' : 'Save & Generate Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

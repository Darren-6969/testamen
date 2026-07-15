'use client';

import { useEffect, useState } from 'react';
import { HeartHandshake, Landmark, Save, Clock } from 'lucide-react';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';
import MemorialModuleHeader from '@/components/header/MemorialModuleHeader';
import PageHeader from '@/components/header/PageHeader';
import { toast } from 'sonner';
import {
  fetchLoveGiving,
  saveLoveGiving,
  EMPTY_LOVE_GIVING,
  LoveGivingForm,
  MALAYSIAN_BANKS,
  INTERNATIONAL_BANKS,
} from '@/app/data/loveGiving';

// Fields that must be numeric-only.
const NUMERIC_FIELDS: (keyof LoveGivingForm)[] = ['account_number', 'bank_number'];

export default function LoveGivingPage() {
  const { activeMemorial } = useActiveMemorial();
  const memorialId = activeMemorial?.numberList || '';

  const [form, setForm] = useState<LoveGivingForm>(EMPTY_LOVE_GIVING);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof LoveGivingForm, string>>>({});
  const [customBank, setCustomBank] = useState(false);

  // Load details whenever the active memorial changes.
  useEffect(() => {
    if (!memorialId) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const data = await fetchLoveGiving(memorialId);
      if (!alive) return;
      if (data) {
        const next: LoveGivingForm = {
          account_name: data.account_name || '',
          account_number: data.account_number || '',
          bank_name: data.bank_name || '',
          bank_number: data.bank_number || '',
          bank_branch: data.bank_branch || '',
          branch_code: data.branch_code || '',
        };
        setForm(next);
        const known = [...MALAYSIAN_BANKS, ...INTERNATIONAL_BANKS];
        setCustomBank(!!next.bank_name && !known.includes(next.bank_name));
      } else {
        setForm(EMPTY_LOVE_GIVING);
        setCustomBank(false);
      }
      setErrors({});
      setSavedAt(null);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [memorialId]);

  const setField = (key: keyof LoveGivingForm, value: string) => {
    if (NUMERIC_FIELDS.includes(key)) value = value.replace(/[^0-9]/g, '');
    setForm((f: LoveGivingForm) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof LoveGivingForm, string>> = {};
    if (!form.account_name?.trim()) next.account_name = 'Account name is required';
    if (!form.account_number?.trim()) next.account_number = 'Account number is required';
    if (!form.bank_name?.trim()) next.bank_name = 'Select a bank';
    if (!form.bank_number?.trim()) next.bank_number = 'Bank number is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!memorialId || !validate()) return;
    setSaving(true);
    const res = await saveLoveGiving(memorialId, form);
    setSaving(false);
    if (res.status === 'success') {
      setSavedAt(
        new Date().toLocaleString('en-MY', {
          hour: 'numeric',
          minute: '2-digit',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
      toast.success('Love giving details saved');
    } else {
      toast.error(res.message || 'Failed to save love giving details');
    }
  };

  const inputCls =
    'w-full h-[42px] rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#c3195d]/30 focus:border-[#c3195d]';
  const labelCls = 'block text-xs text-gray-500 mb-1.5';
  const errCls = 'mt-1 text-xs text-red-500';

  return (
    <div className="min-h-screen">
      {/* Page header -- matches the Registration/other pages style */}
      <PageHeader
        icon={<HeartHandshake className="h-6 w-6" />}
        subtitle="Add the bank details so family and friends can contribute. These appear on the public memorial page."
      >
        Love Giving
      </PageHeader>

      {/* Memorial selector bar: avatar + selector (left), View public page (right) */}
      <MemorialModuleHeader className="mb-6 border-b border-gray-100 pb-5" />

      {/* Wide details card */}
      <div className="mt-6 w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex items-center gap-2 text-base font-medium text-gray-700">
          <Landmark className="h-5 w-5 text-[#c3195d]" />
          Bank details
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading...</div>
        ) : !memorialId ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Select a memorial to edit its love giving details.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
              <div>
                <label className={labelCls}>Account name</label>
                <input
                  className={inputCls}
                  value={form.account_name || ''}
                  onChange={(e) => setField('account_name', e.target.value)}
                  placeholder="Name as per bank account"
                />
                {errors.account_name && <p className={errCls}>{errors.account_name}</p>}
              </div>

              <div>
                <label className={labelCls}>Account number</label>
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={form.account_number || ''}
                  onChange={(e) => setField('account_number', e.target.value)}
                  placeholder="Digits only"
                />
                {errors.account_number && <p className={errCls}>{errors.account_number}</p>}
              </div>

              <div>
                <label className={labelCls}>Bank name</label>
                {customBank ? (
                  <input
                    className={inputCls}
                    value={form.bank_name || ''}
                    onChange={(e) => setField('bank_name', e.target.value)}
                    placeholder="Enter bank name"
                    onBlur={() => {
                      if (!form.bank_name?.trim()) setCustomBank(false);
                    }}
                  />
                ) : (
                  <select
                    className={inputCls}
                    value={form.bank_name || ''}
                    onChange={(e) => {
                      if (e.target.value === '__other__') {
                        setCustomBank(true);
                        setField('bank_name', '');
                      } else {
                        setField('bank_name', e.target.value);
                      }
                    }}
                  >
                    <option value="">Select a bank</option>
                    <optgroup label="Malaysia">
                      {MALAYSIAN_BANKS.map((b: string) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="International">
                      {INTERNATIONAL_BANKS.map((b: string) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </optgroup>
                    <option value="__other__">Other...</option>
                  </select>
                )}
                {errors.bank_name && <p className={errCls}>{errors.bank_name}</p>}
              </div>

              <div>
                <label className={labelCls}>Bank number</label>
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={form.bank_number || ''}
                  onChange={(e) => setField('bank_number', e.target.value)}
                  placeholder="Digits only"
                />
                {errors.bank_number && <p className={errCls}>{errors.bank_number}</p>}
              </div>

              <div>
                <label className={labelCls}>Bank branch</label>
                <input
                  className={inputCls}
                  value={form.bank_branch || ''}
                  onChange={(e) => setField('bank_branch', e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className={labelCls}>Branch code</label>
                <input
                  className={inputCls}
                  value={form.branch_code || ''}
                  onChange={(e) => setField('branch_code', e.target.value)}
                  placeholder="Optional"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                {savedAt && (
                  <>
                    <Clock className="h-3.5 w-3.5" /> Last saved {savedAt}
                  </>
                )}
              </span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#c3195d] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#a81450] disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
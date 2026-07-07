'use client';

import { useEffect, useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import PageHeader from '@/components/header/PageHeader';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import { toast } from 'sonner';

import {
  NewCustomerRow,
  NewCustomerPeriod,
  fetchNewCustomerList,
  downloadNewCustomerExcel,
} from '@/app/data/customerReport';

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function getDefaultRange(period: NewCustomerPeriod) {
  const now = new Date();
  const end = toISODate(now);

  if (period === 'day') return { start: end, end };
  if (period === 'week') return { start: toISODate(addDays(now, -6)), end };
  if (period === 'month') return { start: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), end };

  // range default: last 30 days
  return { start: toISODate(addDays(now, -29)), end };
}
function fmtLabel(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-MY', { dateStyle: 'medium' });
}

export default function NewCustomerReportPage() {
  const [rows, setRows] = useState<NewCustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ add range option in period type
  const [period, setPeriod] = useState<NewCustomerPeriod>('day');
  const [exporting, setExporting] = useState(false);

  // range inputs
  const [startDate, setStartDate] = useState(() => getDefaultRange('day').start);
  const [endDate, setEndDate] = useState(() => getDefaultRange('day').end);

  // applied range used for fetch/export
  const [appliedRange, setAppliedRange] = useState(() => getDefaultRange('day'));

  // When period changes, auto set default and apply
  useEffect(() => {
    const def = getDefaultRange(period);
    setStartDate(def.start);
    setEndDate(def.end);
    setAppliedRange(def);
  }, [period]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchNewCustomerList(
          period,
          appliedRange.start,
          appliedRange.end
        );
        setRows(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load new customers.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period, appliedRange.start, appliedRange.end]);

  const totalByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => {
      const s = (r.status || 'UNKNOWN').toUpperCase();
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [rows]);

  const handleApplyRange = () => {
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates.');
      return;
    }
    if (startDate > endDate) {
      toast.error('Start date cannot be later than end date.');
      return;
    }
    setPeriod('range'); // ✅ switch to range mode
    setAppliedRange({ start: startDate, end: endDate });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await downloadNewCustomerExcel(period, appliedRange.start, appliedRange.end);
      toast.success('Export started. Check your downloads.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel.');
    } finally {
      setExporting(false);
    }
  };

  const periodLabel =
    period === 'day'
      ? 'Today'
      : period === 'week'
      ? 'Last 7 Days'
      : period === 'month'
      ? 'This Month'
      : `${fmtLabel(appliedRange.start)} – ${fmtLabel(appliedRange.end)}`;

  return (
    <div className="space-y-6" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <PageHeader icon={<UserPlus className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">New Customers</span>
      </PageHeader>
      <Breadcrumb items={[
        { label: 'Reports', href: '/module/report' },
        { label: 'New Customers' },
      ]} />

      <div className="mx-auto space-y-4">
        {/* Summary + filter + export */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5 text- #c3195d" />
            </div>
            <div className="space-y-1">
              <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
                New Customers
              </h2>
              <p className="text-xs text-gray-500">
                Period: <strong>{periodLabel}</strong> &nbsp;|&nbsp; Total:{' '}
                <strong>{rows.length}</strong>
              </p>
              {Object.keys(totalByStatus).length > 0 && (
                <p className="text-[11px] text-gray-500">
                  {Object.entries(totalByStatus).map(([s, count], idx) => (
                    <span key={s}>
                      {idx > 0 && ' · '}
                      <strong>{s}</strong>: {count}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period tabs */}
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 overflow-hidden text-xs h-9">
              {(['day', 'week', 'month', 'range'] as NewCustomerPeriod[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 ${
                    period === p ? 'bg-[#c3195d] text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {p === 'day'
                    ? 'By Day'
                    : p === 'week'
                    ? 'By Week'
                    : p === 'month'
                    ? 'By Month'
                    : 'Date Range'}
                </button>
              ))}
            </div>

            {/* Date range inputs (show only in range mode) */}
            {period === 'range' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs rounded-lg border border-gray-200 px-2 bg-white"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs rounded-lg border border-gray-200 px-2 bg-white"
                />

                <button
                  type="button"
                  onClick={handleApplyRange}
                  className="h-9 px-3 rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-gray-800"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Export button */}
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-[#c3195d] text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed h-9"
            >
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </button>
          </div>
        </div>

        {/* Table card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 overflow-x-auto">
          {loading ? (
            <div className="text-xs text-gray-500">Loading customers...</div>
          ) : rows.length === 0 ? (
            <div className="text-xs text-gray-500">No new customers for this period.</div>
          ) : (
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const status = (row.status || '').toUpperCase();
                  let pillClasses =
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ';
                  if (status === 'ACTIVE') pillClasses += 'bg-green-50 text-green-700 border-green-200';
                  else if (status === 'INACTIVE') pillClasses += 'bg-red-50 text-red-700 border-red-200';
                  else if (status === 'PENDING') pillClasses += 'bg-orange-50 text-orange-700 border-orange-200';
                  else pillClasses += 'bg-gray-50 text-gray-600 border-gray-200';

                  const createdLabel = row.created_at
                    ? new Date(row.created_at).toLocaleString('en-MY', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—';

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-3 py-2 align-top">{idx + 1}</td>
                      <td className="px-3 py-2 align-top text-sm font-medium text-gray-800">
                        {row.name}
                      </td>
                      <td className="px-3 py-2 align-top">{row.email}</td>
                      <td className="px-3 py-2 align-top">{row.phone || '—'}</td>
                      <td className="px-3 py-2 align-top">
                        <span className={pillClasses}>{status || '—'}</span>
                      </td>
                      <td className="px-3 py-2 align-top">{createdLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

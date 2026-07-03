'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import PageHeader from '@/components/header/PageHeader';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import { toast } from 'sonner';

import {
  ActivationPeriod,
  ActivationByPackageRow,
  fetchActivationByPackage,
  downloadActivationByPackageExcel,
} from '@/app/data/activationReport';

export default function ActivationByPackageReportPage() {
  // const [rows, setRows] = useState<ActivationByPackageRow[]>([]);
  type Rows = Awaited<ReturnType<typeof fetchActivationByPackage>>;

  const [rows, setRows] = useState<Rows>([]);

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<ActivationPeriod>('day');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchActivationByPackage(period);
        setRows(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load activation by package.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  const summary = useMemo(() => {
    let totalActivations = 0;
    let totalCompleted = 0;
    let totalPending = 0;

    rows.forEach((r) => {
        const total = Number(r.total_activations ?? 0);
        const completed = Number(r.total_completed ?? 0);
        const pending = Number(r.total_pending ?? 0);

        totalActivations += total;
        totalCompleted += completed;
        totalPending += pending;
    });

    return { totalActivations, totalCompleted, totalPending };
    }, [rows]);


  const handleExport = async () => {
    try {
      setExporting(true);
      await downloadActivationByPackageExcel(period);
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
      : 'This Month';

  return (
    <div
      className="space-y-6"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <PageHeader icon={<BarChart3 className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">
          Total Activations (By Package / Date)
        </span>
      </PageHeader>
      <Breadcrumb items={[
        { label: 'Reports', href: '/module/report' },
        { label: 'Total Activation (By Package)' },
      ]} />

      <div className="mx-auto space-y-4">
        {/* Summary + filter + export (same card style as Settings) */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-[#c3195d]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
                Activations by Package
              </h2>
              <p className="text-xs text-gray-500">
                Period: <strong>{periodLabel}</strong> &nbsp;|&nbsp; Packages:{' '}
                <strong>{rows.length}</strong> &nbsp;|&nbsp; Total Activations:{' '}
                <strong>{summary.totalActivations}</strong>
              </p>
              {(summary.totalCompleted > 0 || summary.totalPending > 0) && (
                <p className="text-[11px] text-gray-500">
                  <span>
                    <strong style={{ color: '#16a34a' }}>COMPLETED</strong>:{' '}
                    {summary.totalCompleted}
                  </span>
                  {' · '}
                  <span>
                    <strong style={{ color: '#ea580c' }}>PENDING</strong>:{' '}
                    {summary.totalPending}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period tabs */}
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 overflow-hidden text-xs h-9">
              {(['day', 'week', 'month'] as ActivationPeriod[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 ${
                    period === p
                      ? 'bg-[#c3195d] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {p === 'day'
                    ? 'By Day'
                    : p === 'week'
                    ? 'By Week'
                    : 'By Month'}
                </button>
              ))}
            </div>

            {/* Export button */}
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || rows.length === 0}
              className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-[#c3195d] text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed h-9"
            >
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 overflow-x-auto">
          {loading ? (
            <div className="text-xs text-gray-500">Loading data...</div>
          ) : rows.length === 0 ? (
            <div className="text-xs text-gray-500">
              No activations found for this period.
            </div>
          ) : (
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Package</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Completed</th>
                  <th className="px-3 py-2 text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.package_id ?? idx}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-3 py-2 align-top">{idx + 1}</td>
                    <td className="px-3 py-2 align-top text-sm font-medium text-gray-800">
                      {row.package_name}
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      {row.total_activations}
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      <span className="inline-flex items-center justify-end px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                        {row.total_completed}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      <span className="inline-flex items-center justify-end px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                        {row.total_pending}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

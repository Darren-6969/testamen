'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import PageHeader from '@/components/header/PageHeader';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import { toast } from 'sonner';

import {
  ActivationByPackageRow,
  ActivationByPackageFilter,
  fetchActivationsByPackage,
  downloadActivationsByPackageExcel,
} from '@/app/data/activationReport';

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  const start = `${yyyy}-${mm}-01`; // first of this month
  const end = `${yyyy}-${mm}-${dd}`; // today
  return { startDate: start, endDate: end };
}

export default function ActivationByPackageReportPage() {
  const initialRange = getDefaultDateRange();

  const [rows, setRows] = useState<ActivationByPackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);

  const [appliedFilter, setAppliedFilter] = useState<ActivationByPackageFilter>({
    startDate: initialRange.startDate,
    endDate: initialRange.endDate,
  });

  // Load when appliedFilter changes
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchActivationsByPackage(appliedFilter);
        setRows(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load activations by package.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appliedFilter]);

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

  const handleApplyFilter = () => {
    if (startDate && endDate && startDate > endDate) {
      toast.error('Start date cannot be after end date.');
      return;
    }
    setAppliedFilter({ startDate, endDate });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await downloadActivationsByPackageExcel(appliedFilter);
      toast.success('Export started. Check your downloads.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel.');
    } finally {
      setExporting(false);
    }
  };

  const periodLabel =
    appliedFilter.startDate && appliedFilter.endDate
      ? `${appliedFilter.startDate} → ${appliedFilter.endDate}`
      : 'This Month';

  return (
    <div
      className="space-y-6"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <PageHeader icon={<BarChart3 className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">
          Total Activation (By Package / Date)
        </span>
      </PageHeader>
      <Breadcrumb items={[
        { label: 'Reports', href: '/module/report' },
        { label: 'Package Subscriptions' },
      ]} />

      <div className="mx-auto space-y-4">
        {/* Summary + date filter + export */}
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
                Date Range: <strong>{periodLabel}</strong> &nbsp;|&nbsp;
                Packages: <strong>{rows.length}</strong> &nbsp;|&nbsp; Total
                Activations: <strong>{summary.totalActivations}</strong>
              </p>
              {rows.length > 0 && (
                <p className="text-[11px] text-gray-500">
                  <strong>COMPLETED:</strong> {summary.totalCompleted} &nbsp;·&nbsp;
                  <strong>PENDING:</strong> {summary.totalPending}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Start */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 h-9"
            />

            {/* End */}
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 h-9"
            />

            {/* Apply */}
            <button
              type="button"
              onClick={handleApplyFilter}
              className="h-9 inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-black h-9"
            >
              Apply
            </button>

            {/* Export */}
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || rows.length === 0}
              className="h-9 inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-[#c3195d] text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed h-9"
            >
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </button>
          </div>

        </div>

        {/* Table card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 overflow-x-auto">
          {loading ? (
            <div className="text-xs text-gray-500">
              Loading activations by package...
            </div>
          ) : rows.length === 0 ? (
            <div className="text-xs text-gray-500">
              No activations found for this date range.
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
                  <th className="px-3 py-2 text-left">First Install</th>
                  <th className="px-3 py-2 text-left">Last Install</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const total = Number(row.total_activations ?? 0);
                  const completed = Number(row.total_completed ?? 0);
                  const pending = Number(row.total_pending ?? 0);

                  const firstDate = row.first_install_date
                    ? new Date(row.first_install_date).toLocaleDateString(
                        'en-MY',
                        { dateStyle: 'medium' }
                      )
                    : '—';

                  const lastDate = row.last_install_date
                    ? new Date(row.last_install_date).toLocaleDateString(
                        'en-MY',
                        { dateStyle: 'medium' }
                      )
                    : '—';

                  return (
                    <tr
                      key={row.package_id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-3 py-2 align-top">{idx + 1}</td>
                      <td className="px-3 py-2 align-top text-sm font-medium text-gray-800">
                        {row.package_name}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        {total}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        {completed}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        {pending}
                      </td>
                      <td className="px-3 py-2 align-top">{firstDate}</td>
                      <td className="px-3 py-2 align-top">{lastDate}</td>
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

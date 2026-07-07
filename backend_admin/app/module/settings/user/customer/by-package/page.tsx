'use client';

import { useEffect, useMemo, useState } from 'react';
import { HandHeart } from 'lucide-react';
import PageHeader from '@/components/header/PageHeader';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import { toast } from 'sonner';

import {
  CustomerByPackageRow,
  fetchCustomerByPackageList,
  downloadCustomerByPackageExcel,
} from '@/app/data/customerReport';

export default function CustomerByPackagePage() {
  const [rows, setRows] = useState<CustomerByPackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchCustomerByPackageList();
        setRows(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load customers by package.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  
    const totals = useMemo(() => {
        return rows.reduce(
            (acc, r) => {
            const total = Number(r.total_customers) || 0;
            const active = Number(r.active_customers) || 0;
            const inactive = Number(r.inactive_customers) || 0;
            const pending = Number(r.pending_customers) || 0;

            acc.total += total;
            acc.active += active;
            acc.inactive += inactive;
            acc.pending += pending;
            return acc;
            },
            { total: 0, active: 0, inactive: 0, pending: 0 }
        );
    }, [rows]);


  const handleExport = async () => {
    try {
      setExporting(true);
      await downloadCustomerByPackageExcel();
      toast.success('Export started. Check your downloads.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="space-y-6"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <PageHeader icon={<HandHeart className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">
          Total Customers (By Package)
        </span>
      </PageHeader>
      <Breadcrumb items={[
        { label: 'Reports', href: '/module/report' },
        { label: 'Total Customers (By Package)' },
      ]} />

      <div className="mx-auto space-y-4">
        {/* Summary + Export card: same style as Setting / other reports */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <HandHeart className="w-5 h-5 text-[#c3195d]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
                Customers by Package
              </h2>
              <p className="text-xs text-gray-500">
                Packages: <strong>{rows.length}</strong> &nbsp;|&nbsp; Total
                Customers: <strong>{totals.total}</strong>
              </p>
              <p className="text-[11px] text-gray-500">
                <strong>ACTIVE</strong>: {totals.active} &nbsp;·&nbsp;
                <span style={{ color: '#dc2626' }}>
                  <strong>INACTIVE</strong>: {totals.inactive}
                </span>
                &nbsp;·&nbsp;
                <span style={{ color: '#ea580c' }}>
                  <strong>PENDING</strong>: {totals.pending}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

        {/* Table card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 overflow-x-auto">
          {loading ? (
            <div className="text-xs text-gray-500">Loading data...</div>
          ) : rows.length === 0 ? (
            <div className="text-xs text-gray-500">
              No customers found by package.
            </div>
          ) : (
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Package</th>
                  <th className="px-3 py-2 text-left">Total</th>
                  <th className="px-3 py-2 text-left">Active</th>
                  <th className="px-3 py-2 text-left">Inactive</th>
                  <th className="px-3 py-2 text-left">Pending</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.package_id ?? `pkg-${idx}`}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-3 py-2 align-top">{idx + 1}</td>
                    <td className="px-3 py-2 align-top text-sm font-medium text-gray-800">
                      {row.package_name || 'No Package Assigned'}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {row.total_customers}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {row.active_customers}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {row.inactive_customers}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {row.pending_customers}
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

// app/module/report/customer/total-status/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import PageHeader from '@/components/header/PageHeader';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import {
  CustomerStatusRow,
  fetchCustomerStatusList,
  downloadCustomerStatusExcel,
} from '@/app/data/customerReport';
import { toast } from 'sonner';

type FilterStatus = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'PENDING';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export default function CustomerTotalStatusPage() {
  const [rows, setRows] = useState<CustomerStatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [exporting, setExporting] = useState(false);

  // NEW: search + pagination
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchCustomerStatusList();
        setRows(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load customer list.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Summary counts (use all rows, not filtered)
  const totalActive = rows.filter((r) => (r.status || '').toUpperCase() === 'ACTIVE').length;
  const totalInactive = rows.filter((r) => (r.status || '').toUpperCase() === 'INACTIVE').length;
  const totalPending = rows.filter((r) => (r.status || '').toUpperCase() === 'PENDING').length;

  // Filter + Search
  const filteredRows = useMemo(() => {
    let list = rows;

    if (filter !== 'ALL') {
      list = list.filter((r) => (r.status || '').toUpperCase() === filter.toUpperCase());
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((r) => {
      const hay = [r.name, r.email, r.phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, filter, search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filter, search, pageSize]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Clamp page if needed
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const handleExport = async () => {
    try {
      setExporting(true);
      // still export by status filter (like your existing)
      await downloadCustomerStatusExcel(filter);
      toast.success('Export started. Check your downloads.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel.');
    } finally {
      setExporting(false);
    }
  };

  // Pagination buttons (window)
  const pageButtons = useMemo(() => {
    const btns: number[] = [];
    const windowSize = 5;
    const start = Math.max(1, page - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);
    for (let p = start; p <= end; p++) btns.push(p);
    return btns;
  }, [page, totalPages]);

  return (
    <div className="space-y-6" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <PageHeader icon={<Users className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text- #c3195d">Total Customers</span>
      </PageHeader>
      <Breadcrumb items={[
        { label: 'Reports', href: '/module/report' },
        { label: 'Total Customers (Active / Inactive)' },
      ]} />

      <div className="mx-auto space-y-4">
        {/* Summary + Controls */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-red-600" />
              </div>
              <div className="space-y-1">
                <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
                  Customer Status
                </h2>
                <p className="text-xs text-gray-500">
                  Active: <strong>{totalActive}</strong> &nbsp;|&nbsp; Inactive:{' '}
                  <strong style={{ color: '#dc2626' }}>{totalInactive}</strong> &nbsp;|&nbsp;
                  Pending: <strong style={{ color: '#ea580c' }}>{totalPending}</strong> &nbsp;|&nbsp;
                  Total: <strong>{rows.length}</strong>
                  &nbsp;|&nbsp; Showing: <strong>{total}</strong>
                  &nbsp;|&nbsp; Page: <strong>{page}</strong> / <strong>{totalPages}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name / email / phone"
                  className="w-64 max-w-[70vw] px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 hover:text-gray-600"
                    title="Clear"
                  >
                    ✕
                  </button>
                ) : null}
              </div>

              {/* Rows per page */}
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 h-9"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    Show {n}
                  </option>
                ))}
              </select>

              {/* Filter buttons */}
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 overflow-hidden text-xs h-9">
                {(['ALL', 'ACTIVE', 'INACTIVE', 'PENDING'] as FilterStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilter(s)}
                    className={`px-3 py-1.5 ${
                      filter === s ? 'bg-[#c3195d] text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {s === 'ALL'
                      ? 'All'
                      : s === 'ACTIVE'
                      ? 'Active'
                      : s === 'INACTIVE'
                      ? 'Inactive'
                      : 'Pending'}
                  </button>
                ))}
              </div>

              {/* Export */}
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
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 overflow-x-auto">
          {loading ? (
            <div className="text-xs text-gray-500">Loading customers...</div>
          ) : pagedRows.length === 0 ? (
            <div className="text-xs text-gray-500">No customers found for this filter.</div>
          ) : (
            <>
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Phone</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row, idx) => {
                    const status = (row.status || '').toUpperCase();
                    let pillClasses =
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ';

                    if (status === 'ACTIVE') pillClasses += 'bg-green-50 text-green-700 border-green-200';
                    else if (status === 'INACTIVE') pillClasses += 'bg-red-50 text-red-700 border-red-200';
                    else if (status === 'PENDING') pillClasses += 'bg-orange-50 text-orange-700 border-orange-200';
                    else pillClasses += 'bg-gray-50 text-gray-600 border-gray-200';

                    return (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2 align-top">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="px-3 py-2 align-top text-sm font-medium text-gray-800">
                          {row.name}
                        </td>
                        <td className="px-3 py-2 align-top">{row.email}</td>
                        <td className="px-3 py-2 align-top">{row.phone || '—'}</td>
                        <td className="px-3 py-2 align-top">
                          <span className={pillClasses}>{status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination footer */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-500">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 disabled:opacity-50"
                  >
                    Prev
                  </button>

                  {pageButtons.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`px-3 py-2 text-xs rounded-lg border ${
                        p === page
                          ? 'border-red-600 bg-[#c3195d] text-white'
                          : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// app/module/report/user/last-login/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock8 } from 'lucide-react';
import PageHeader from '@/components/header/PageHeader';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import { toast } from 'sonner';
import {
  fetchUserLoginList,
  downloadUserLoginExcel,
  UserLoginRow,
  UserTypeFilter,
} from '@/app/data/userLoginReport';

type TabKey = 'STAFF' | 'CUSTOMER';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export default function UserLastLoginReportPage() {
  const [tab, setTab] = useState<TabKey>('STAFF');
  const [rows, setRows] = useState<UserLoginRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState('');

  // pagination
  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState<number>(10);

  const userTypeId: UserTypeFilter = tab === 'STAFF' ? 1 : 2;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setPage(1);
      try {
        const data = await fetchUserLoginList(userTypeId);
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load users last login list.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userTypeId]);

  const title = tab === 'STAFF' ? 'Login History (Staff)' : 'Login History (Customer)';

  function formatLastLogin(iso?: string | null) {
    if (!iso) return '—';

    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;

    const s = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);

    return s.replace(/, (?=\d{2}:\d{2})/, ' ');
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const name = (r.name || '').toLowerCase();
      const username = (r.username || '').toLowerCase();
      const email = (r.email || '').toLowerCase();
      return name.includes(q) || username.includes(q) || email.includes(q);
    });
  }, [rows, search]);

  // reset paging when filter/tab changes
  useEffect(() => {
    setPage(1);
  }, [search, tab, pageSize]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const totalWithLogin = useMemo(() => {
    return rows.filter((r) => !!r.last_login).length;
  }, [rows]);

  const totalNeverLogin = useMemo(() => {
    return rows.filter((r) => !r.last_login).length;
  }, [rows]);

  const handleExport = async () => {
    try {
      setExporting(true);
      await downloadUserLoginExcel(userTypeId);
      toast.success('Export started. Check your downloads.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel.');
    } finally {
      setExporting(false);
    }
  };

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
      <PageHeader icon={<Clock8 className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">{title}</span>
      </PageHeader>
      <Breadcrumb items={[
        { label: 'Reports', href: '/module/report' },
        { label: 'Login History' },
      ]} />

      <div className="mx-auto space-y-4">
        {/* Summary + Tabs + Export */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <Clock8 className="w-5 h-5 text-[#c3195d]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
                Last Login Report
              </h2>
              <p className="text-xs text-gray-500">
                With last login: <strong>{totalWithLogin}</strong> &nbsp;|&nbsp; Never logged in:{' '}
                <strong style={{ color: '#dc2626' }}>{totalNeverLogin}</strong> &nbsp;|&nbsp; Total:{' '}
                <strong>{rows.length}</strong>
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
                placeholder="Search name / username / email"
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
            
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  Show {n}
                </option>
              ))}
            </select>


            {/* Tabs */}
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setTab('STAFF')}
                className={`px-3 py-1.5 ${
                  tab === 'STAFF' ? 'bg-[#c3195d] text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => setTab('CUSTOMER')}
                className={`px-3 py-1.5 ${
                  tab === 'CUSTOMER' ? 'bg-[#c3195d] text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Customer
              </button>
            </div>

            {/* Export */}
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || rows.length === 0}
              className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-[#c3195d] text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 overflow-x-auto">
          {loading ? (
            <div className="text-xs text-gray-500">Loading...</div>
          ) : pagedRows.length === 0 ? (
            <div className="text-xs text-gray-500">No records found.</div>
          ) : (
            <>
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Username</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-3 py-2 align-top">{(page - 1) * pageSize + idx + 1}</td>
                      <td className="px-3 py-2 align-top text-sm font-medium text-gray-800">
                        {row.name}
                      </td>
                      <td className="px-3 py-2 align-top">{row.username}</td>
                      <td className="px-3 py-2 align-top">{row.email}</td>
                      <td className="px-3 py-2 align-top">
                        <span className={row.last_login ? 'text-gray-800' : 'text-gray-400'}>
                          {formatLastLogin(row.last_login)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
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
                          ? 'border-[#c3195d] bg-[#c3195d] text-white'
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

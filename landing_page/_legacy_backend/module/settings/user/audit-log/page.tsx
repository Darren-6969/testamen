'use client';

import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Shield } from 'lucide-react';
import Breadcrumb from '@/components/breadcrumb/Breadcrumb';
import PageHeader from '@/components/header/PageHeader';
import { toast } from 'sonner';
import {
  AuditLogRow,
  fetchAuditLogs,
  downloadAuditLogsExcel,
  AuditAction,
} from '@/app/data/auditLogReport';

const PAGE_SIZE = 10;

export default function AuditLogReportPage() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // filters
  const [search, setSearch] = useState('');
  const [module, setModule] = useState<string>('');
  const [action, setAction] = useState<AuditAction | ''>('');
  const [startDate, setStartDate] = useState<string>(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>('');     // YYYY-MM-DD
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // pagination
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setExpandedId(null);
    setPage(1);

    try {
      const data = await fetchAuditLogs({
        search,
        module: module || undefined,
        action: action || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: 300,
      });

      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load audit logs.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((r) => {
      if (module && (r.module || '') !== module) return false;
      if (action && (r.action || '') !== action) return false;

      if (!q) return true;

      const hay = [
        r.actor_username,
        r.actor_user_id?.toString(),
        r.action,
        r.module,
        r.entity_table,
        r.entity_id,
        r.endpoint,
        r.description,
        r.ip_address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return hay.includes(q);
    });
  }, [rows, search, module, action]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setExpandedId(null);
    setPage(1);
  }, [search, module, action, startDate, endDate]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const byAction = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRows.forEach((r) => {
      const k = r.action || 'UNKNOWN';
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [filteredRows]);

  const topActionText = useMemo(() => {
    const entries = Object.entries(byAction).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return '—';
    const [a, n] = entries[0];
    return `${a} (${n})`;
  }, [byAction]);

  const moduleOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.module) set.add(r.module);
    });
    return Array.from(set).sort();
  }, [rows]);

  function formatTs(iso?: string | null) {
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

  const handleExport = async () => {
    try {
      setExporting(true);
      await downloadAuditLogsExcel({
        search,
        module: module || undefined,
        action: action || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
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
      <PageHeader icon={<Shield className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">Audit Log</span>
      </PageHeader>
      <Breadcrumb items={[
        { label: 'Reports', href: '/module/report' },
        { label: 'Audit Log' },
      ]} />

      <div className="mx-auto space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-[#c3195d]" />
              </div>

              <div className="space-y-1">
                <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
                  Audit Log Report
                </h2>
                <p className="text-xs text-gray-500">
                  Showing: <strong>{total}</strong> &nbsp;|&nbsp; Top action:{' '}
                  <strong style={{ color: '#dc2626' }}>{topActionText}</strong>
                  &nbsp;|&nbsp; Page: <strong>{page}</strong> / <strong>{totalPages}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search actor / module / entity / endpoint / IP"
                  className="w-72 max-w-[80vw] px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
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
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">All Modules</option>
                {moduleOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={action}
                onChange={(e) => setAction(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200"
              />

              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Apply'}
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={exporting || total === 0}
                className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-[#c3195d] text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {exporting ? 'Exporting...' : 'Export to Excel'}
              </button>
            </div>
          </div>
        </div>

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
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-3 py-2 text-left">Actor</th>
                    <th className="px-3 py-2 text-left">Action</th>
                    <th className="px-3 py-2 text-left">Module</th>
                    <th className="px-3 py-2 text-left">Entity</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-left">IP</th>
                  </tr>
                </thead>

                <tbody>
                  {pagedRows.map((row) => {
                    const expanded = expandedId === row.id;

                    return (
                      <Fragment key={row.id}>
                        <tr
                          onClick={() => setExpandedId(expanded ? null : row.id)}
                          className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                          title="Click to expand"
                        >
                          <td className="px-3 py-2 align-top whitespace-nowrap">
                            {formatTs(row.event_time)}
                          </td>

                          <td className="px-3 py-2 align-top">
                            <div className="font-medium text-gray-800">{row.actor_username || '—'}</div>
                            <div className="text-[11px] text-gray-500">ID: {row.actor_user_id ?? '—'}</div>
                          </td>

                          <td className="px-3 py-2 align-top">{row.action || '—'}</td>
                          <td className="px-3 py-2 align-top">{row.module || '—'}</td>
                          <td className="px-3 py-2 align-top">
                            <div className="text-gray-800">{row.entity_table || '—'}</div>
                            <div className="text-[11px] text-gray-500">ID: {row.entity_id || '—'}</div>
                          </td>
                          <td className="px-3 py-2 align-top max-w-[520px]">{row.description || '—'}</td>
                          <td className="px-3 py-2 align-top whitespace-nowrap">{row.ip_address || '—'}</td>
                        </tr>

                        {expanded ? (
                          <tr className="border-b border-gray-100 bg-gray-50/40">
                            <td colSpan={7} className="px-3 py-3">
                              <pre className="text-[11px] text-gray-700 whitespace-pre-wrap break-words">
                                {safeJson(row.changed_fields)}
                              </pre>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
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
                          ? 'border-red-600 bg-red-600 text-white'
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

function safeJson(v: any) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return v;
    }
  }
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

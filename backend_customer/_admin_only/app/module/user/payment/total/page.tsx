// app/module/report/payment/total/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import PageHeader from "@/components/header/PageHeader";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import { toast } from "sonner";

import {
  fetchTotalPayment,
  downloadTotalPaymentExcel,
  TotalPaymentRow,
} from "@/app/data/paymentTotalReport";

function getDefaultRange() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return { start: `${yyyy}-${mm}-01`, end: `${yyyy}-${mm}-${dd}` };
}

function formatTs(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const s = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuala_Lumpur",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  return s.replace(/, (?=\d{2}:\d{2})/, " ");
}

export default function TotalPaymentReportPage() {
  const { start, end } = getDefaultRange();

  // input filters
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [status, setStatus] = useState<string>("");

  // applied filters
  const [applied, setApplied] = useState({
    period: "month" as const,
    start_date: start,
    end_date: end,
    search: "",
    status: "",
  });

  // pagination (server)
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<TotalPaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchTotalPayment({
        ...applied,
        page,
        limit,
        status: applied.status || undefined,
        search: applied.search || undefined,
      });

      setRows(Array.isArray(res.rows) ? res.rows : []);
      setTotal(Number(res.total ?? 0));
      setTotalPages(Math.max(1, Number(res.total_pages ?? 1)));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load total payment.");
      setRows([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, page, limit]);

  useEffect(() => {
    const t = setTimeout(() => {
        setPage(1);
        setApplied((prev) => ({ ...prev, search: searchDraft.trim() }));
    }, 400);
    return () => clearTimeout(t);
    }, [searchDraft]);


  // Summary based on the currently displayed rows (page only)
  const summary = useMemo(() => {
    const totalTxn = rows.length;
    const totalAmt = rows.reduce((sum, r) => sum + Number((r as any).amount ?? 0), 0);

    const pendingTxn = rows.filter((r) =>
      String((r as any).status || "").toUpperCase().includes("PENDING")
    ).length;

    const pendingAmt = rows
      .filter((r) => String((r as any).status || "").toUpperCase().includes("PENDING"))
      .reduce((sum, r) => sum + Number((r as any).amount ?? 0), 0);

    return { totalTxn, totalAmt, pendingTxn, pendingAmt };
  }, [rows]);

  const handleApply = () => {
    if (startDate && endDate && startDate > endDate) {
      toast.error("Start date cannot be after end date.");
      return;
    }
    setPage(1);
    setApplied((prev) => ({
    ...prev,
    start_date: startDate,
    end_date: endDate,
    search: searchDraft.trim(), // or search.trim() if you still use search
    status,
  }));
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await downloadTotalPaymentExcel({
        period: applied.period, // ✅ required by TotalPaymentQuery
        start_date: applied.start_date,
        end_date: applied.end_date,
        search: applied.search || undefined,
        status: applied.status || undefined,
      });
      toast.success("Export started. Check your downloads.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Excel.");
    } finally {
      setExporting(false);
    }
  };

  const pageButtons = useMemo(() => {
    const btns: number[] = [];
    const windowSize = 5;
    const startP = Math.max(1, page - Math.floor(windowSize / 2));
    const endP = Math.min(totalPages, startP + windowSize - 1);
    for (let p = startP; p <= endP; p++) btns.push(p);
    return btns;
  }, [page, totalPages]);

  return (
    <div className="space-y-6" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <PageHeader icon={<CreditCard className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">Total Payment</span>
      </PageHeader>
      <Breadcrumb items={[
        { label: 'Reports', href: '/module/report' },
        { label: 'Total Payment' },
      ]} />

      <div className="mx-auto space-y-4">
        {/* Summary + filters */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-[#c3195d]" />
              </div>

              <div className="space-y-1">
                <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
                  Payment List
                </h2>
                <p className="text-xs text-gray-500">
                  Total Amount: <strong>RM {summary.totalAmt.toFixed(2)}</strong>
                  &nbsp;|&nbsp; Pending:{" "}
                  <strong style={{ color: "#dc2626" }}>RM {summary.pendingAmt.toFixed(2)}</strong>
                </p>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <input
                    value={searchDraft}
                    onChange={(e) => setSearchDraft(e.target.value)}
                    placeholder="Search customer / ref"
                    className="h-9 w-64 max-w-[70vw] px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                />

                {search ? (
                  <button
                    type="button"
                    onClick={() => {
                        setSearch("");
                        setPage(1);
                        setApplied((prev) => ({ ...prev, search: "" }));
                    }}

                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 hover:text-gray-600"
                    title="Clear"
                  >
                    ✕
                  </button>
                ) : null}
              </div>

              {/* Status */}
              <select
                value={status}
                onChange={(e) => {
                    const v = e.target.value;
                    setStatus(v);
                    setPage(1);
                    setApplied((prev) => ({ ...prev, status: v }));
                }}
                className="h-9 px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200"
                >

                <option value="">All Status</option>
                <option value="PENDING POSTING">PENDING POSTING</option>
                <option value="PENDING PAYMENT">PENDING PAYMENT</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>

              {/* Dates + Apply + Export */}
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200"
              />

              <button
                type="button"
                onClick={handleApply}
                disabled={loading}
                className="h-9 inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-black disabled:opacity-60"
              >
                Apply
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={exporting || total === 0}
                className="h-9 inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-[#c3195d] text-white hover:bg-red-700 disabled:opacity-60"
              >
                {exporting ? "Exporting..." : "Export to Excel"}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 overflow-x-auto">
          {loading ? (
            <div className="text-xs text-gray-500">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-xs text-gray-500">No records found.</div>
          ) : (
            <>
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2 text-left">Created Date</th>
                    <th className="px-3 py-2 text-left">Customer Name</th>
                    <th className="px-3 py-2 text-left">Reference No</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Payment Date</th>
                    <th className="px-3 py-2 text-right">Payment Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row: any) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-3 py-2">{formatTs(row.created_at)}</td>
                      <td className="px-3 py-2">{row.customer_name ?? "—"}</td>
                      <td className="px-3 py-2">{row.reference_no ?? "—"}</td>
                      <td className="px-3 py-2">{row.status ?? "—"}</td>
                      <td className="px-3 py-2">
                        {row.payment_date ? formatTs(row.payment_date) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        RM {Number(row.amount ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination + page size */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                <div className="text-xs text-gray-500">
                  Page <strong>{page}</strong> / <strong>{totalPages}</strong> &nbsp;|&nbsp; Total
                  Records: <strong>{total}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Show</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setPage(1);
                      setLimit(Number(e.target.value));
                    }}
                    className="h-9 px-2 rounded-lg border border-gray-200 bg-white text-xs"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs disabled:opacity-50"
                  >
                    Prev
                  </button>

                  {pageButtons.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`h-9 px-3 rounded-lg border text-xs ${
                        p === page
                          ? "border-red-600 bg-red-600 text-white"
                          : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs disabled:opacity-50"
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { WalletCards } from "lucide-react";
import PageHeader from "@/components/header/PageHeader";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";
import { toast } from "sonner";

import {
  fetchPaymentStatusSummary,
  downloadPaymentStatusSummaryExcel,
  PaymentStatusSummaryRow,
} from "@/app/data/paymentStatusSummaryReport";

function getDefaultRange() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return { start: `${yyyy}-${mm}-01`, end: `${yyyy}-${mm}-${dd}` };
}

export default function PaymentStatusSummaryPage() {
  const { start, end } = getDefaultRange();

  // input filters
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);

  // applied filters
  const [applied, setApplied] = useState({
    start_date: start,
    end_date: end,
  });

  const [rows, setRows] = useState<PaymentStatusSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchPaymentStatusSummary({
        start_date: applied.start_date,
        end_date: applied.end_date,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payment status summary.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied]);

  const summary = useMemo(() => {
    const totalRecords = rows.reduce((s, r) => s + Number(r.total_records ?? 0), 0);
    const totalAmount = rows.reduce((s, r) => s + Number(r.total_amount ?? 0), 0);

    const pendingAmount = rows
      .filter((r) => String(r.status || "").toUpperCase().includes("PENDING"))
      .reduce((s, r) => s + Number(r.total_amount ?? 0), 0);

    return { totalRecords, totalAmount, pendingAmount };
  }, [rows]);

  const handleApply = () => {
    if (startDate && endDate && startDate > endDate) {
      toast.error("Start date cannot be after end date.");
      return;
    }
    setApplied({
      start_date: startDate,
      end_date: endDate,
    });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await downloadPaymentStatusSummaryExcel({
        start_date: applied.start_date,
        end_date: applied.end_date,
      });
      toast.success("Export started. Check your downloads.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Excel.");
    } finally {
      setExporting(false);
    }
  };

  const statusPill = (status: string) => {
    const s = (status || "").toUpperCase();
    let cls =
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ";

    if (s.includes("COMPLETED") || s.includes("SUCCESS") || s.includes("PAID")) {
      cls += "bg-green-50 text-green-700 border-green-200";
    } else if (s.includes("FAILED") || s.includes("CANCEL")) {
      cls += "bg-red-50 text-red-700 border-red-200";
    } else if (s.includes("PENDING")) {
      cls += "bg-orange-50 text-orange-700 border-orange-200";
    } else {
      cls += "bg-gray-50 text-gray-600 border-gray-200";
    }

    return <span className={cls}>{status || "—"}</span>;
  };

  return (
    <div className="space-y-6" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <PageHeader icon={<WalletCards className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">Payment Status Summary</span>
      </PageHeader>
      <Breadcrumb items={[
        { label: 'Reports', href: '/module/report' },
        { label: 'Payment Status Summary' },
      ]} />

      <div className="mx-auto space-y-4">
        {/* Summary + filters */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <WalletCards className="w-5 h-5 text-[#c3195d]" />
              </div>

              <div className="space-y-1">
                <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
                  Breakdown by Status
                </h2>
                <p className="text-xs text-gray-500">
                  Total Records: <strong>{summary.totalRecords}</strong>
                  &nbsp;|&nbsp; Total Amount: <strong>RM {summary.totalAmount.toFixed(2)}</strong>
                  &nbsp;|&nbsp; Pending:{" "}
                  <strong style={{ color: "#dc2626" }}>RM {summary.pendingAmount.toFixed(2)}</strong>
                </p>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-2">
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
                disabled={exporting || rows.length === 0}
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
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Total Records</th>
                  <th className="px-3 py-2 text-right">Total Amount (RM)</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, idx) => (
                  <tr key={`${r.status}-${idx}`} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                    <td className="px-3 py-2">{statusPill(r.status)}</td>
                    <td className="px-3 py-2 text-right">{Number(r.total_records ?? 0)}</td>
                    <td className="px-3 py-2 text-right">{Number(r.total_amount ?? 0).toFixed(2)}</td>
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

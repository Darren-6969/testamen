import axios from "axios";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface PaymentStatusSummaryRow {
  status: string;
  total_records: number;
  total_amount: number;
}

export interface PaymentStatusSummaryQuery {
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  search?: string;
}

export async function fetchPaymentStatusSummary(
  q: PaymentStatusSummaryQuery
): Promise<PaymentStatusSummaryRow[]> {
  const res = await axios.get<PaymentStatusSummaryRow[]>(
    `/api/report/payment/status-summary`,
    { withCredentials: true, params: q }
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function downloadPaymentStatusSummaryExcel(
  q: PaymentStatusSummaryQuery
): Promise<void> {
  const res = await axios.get<Blob>(`/api/report/payment/status-summary/excel`, {
    withCredentials: true,
    params: q,
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;

  const disposition = res.headers["content-disposition"] as string | undefined;

  const filename =
    disposition?.match(/filename\*?=(?:UTF-8''|")?([^;"\n"]+)/i)?.[1]?.replace(/"/g, "") ||
    "payment_status_summary.xlsx";

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}


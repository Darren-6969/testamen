// app/data/paymentTotalReport.ts
import axios from "axios";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type PaymentPeriod = "day" | "week" | "month";

export interface TotalPaymentRow {
  period_start: string; // YYYY-MM-DD
  total_txn: number;
  total_amount: number;

  pending_txn: number;
  pending_amount: number;

  non_pending_txn: number;
  non_pending_amount: number;
}

export interface TotalPaymentQuery {
  period: PaymentPeriod;
  start_date?: string;
  end_date?: string;
  search?: string;
  status?: string;

  page?: number;
  limit?: number;
}

export interface TotalPaymentPagedResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  rows: TotalPaymentRow[];
}

export async function fetchTotalPayment(q: TotalPaymentQuery): Promise<TotalPaymentPagedResponse> {
  const res = await axios.get<TotalPaymentPagedResponse>(`/api/report/payment/total`, {
    withCredentials: true,
    params: q,
  });

  return {
    page: res.data?.page ?? 1,
    limit: res.data?.limit ?? (q.limit ?? 50),
    total: res.data?.total ?? 0,
    total_pages: res.data?.total_pages ?? 1,
    rows: Array.isArray(res.data?.rows) ? res.data.rows : [],
  };
}

export async function downloadTotalPaymentExcel(
  q: TotalPaymentQuery
): Promise<void> {
  const res = await axios.get<Blob>(`/api/report/payment/total/excel`, {
    withCredentials: true,
    responseType: "blob",
    params: q,
  });

  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;

  const disposition = res.headers["content-disposition"] as string | undefined;

  const filename =
    disposition?.match(/filename\*?=(?:UTF-8''|")?([^;"\n"]+)/i)?.[1]?.replace(/"/g, "") ||
    "total-payment.xlsx";

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}


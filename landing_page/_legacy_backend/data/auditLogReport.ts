// app/data/auditLogReport.ts
import axios from 'axios';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | string;

export interface AuditLogRow {
  id: number;

  // your DB column is event_time (not created_at)
  event_time?: string | null;

  actor_user_id?: number | null;
  actor_username?: string | null;

  action?: AuditAction | null;
  module?: string | null;
  endpoint?: string | null;

  entity_table?: string | null;
  entity_id?: string | null;

  description?: string | null;

  before_data?: any;
  after_data?: any;
  changed_fields?: any;

  ip_address?: string | null;
  user_agent?: string | null;

  request_id?: string | null;
}

export interface AuditLogQuery {
  // your page.tsx uses "search" so keep it
  search?: string;

  module?: string;
  action?: AuditAction;

  // your UI uses start_date/end_date so keep it
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD

  // optional filters
  entity_table?: string;
  entity_id?: string;
  actor_user_id?: number;
  actor_username?: string;

  // pagination
  page?: number;
  limit?: number;
}

export interface AuditLogPagedResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  rows: AuditLogRow[];
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// ✅ FIX: backend returns { ... , rows: [] }, so return ONLY rows for page.tsx
export async function fetchAuditLogs(q: AuditLogQuery = {}): Promise<AuditLogRow[]> {
  const res = await api.get<AuditLogPagedResponse>('/audit/logs', { params: q });
  return Array.isArray(res.data?.rows) ? res.data.rows : [];
}

// ✅ Optional: if later you want total/page for UI, use this one instead
export async function fetchAuditLogsPaged(q: AuditLogQuery = {}): Promise<AuditLogPagedResponse> {
  const res = await api.get<AuditLogPagedResponse>('/audit/logs', { params: q });
  return {
    page: res.data?.page ?? 1,
    limit: res.data?.limit ?? (q.limit ?? 20),
    total: res.data?.total ?? 0,
    total_pages: res.data?.total_pages ?? 1,
    rows: Array.isArray(res.data?.rows) ? res.data.rows : [],
  };
}

// Excel export (downloads file)
export async function downloadAuditLogsExcel(q: AuditLogQuery = {}): Promise<void> {
  const res = await axios.get<Blob>(`/api/audit/logs/excel`, {
    withCredentials: true,
    responseType: "blob",
    params: q,
  });

  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;

  const disposition = res.headers["content-disposition"] as string | undefined;

  // supports: filename="audit.xlsx"  OR  filename=audit.xlsx
  const filename =
    disposition?.match(/filename\*?=(?:UTF-8''|")?([^;"\n"]+)/i)?.[1]?.replace(/"/g, "") ||
    "audit_logs.xlsx";

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}


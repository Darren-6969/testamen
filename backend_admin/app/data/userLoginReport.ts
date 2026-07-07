// app/data/userLoginReport.ts
export type UserLoginRow = {
  id: number | string;
  name: string;
  username: string;
  email: string;
  last_login: string | null;
};

export type UserTypeFilter = 1 | 2; // 1 staff, 2 customer

// ✅ adjust to your backend base URL style
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchUserLoginList(status_id: UserTypeFilter) {
  const res = await fetch(
    `/api/report/users/last-login?status_id=${status_id}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed fetch user login list: ${res.status} ${text}`);
  }

  const json = await res.json();
  // expecting: { data: UserLoginRow[] } OR UserLoginRow[]
  return (json?.data ?? json) as UserLoginRow[];
}

export async function downloadUserLoginExcel(status_id: UserTypeFilter) {
  const res = await fetch(
    `/api/report/users/last-login/export?status_id=${status_id}`,
    { method: 'GET' }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed export: ${res.status} ${text}`);
  }

  const blob = await res.blob();
  const filename =
    (res.headers.get('content-disposition') || '').match(/filename="?([^"]+)"?/)?.[1] ||
    (status_id === 1 ? 'staff_last_login.xlsx' : 'customer_last_login.xlsx');

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

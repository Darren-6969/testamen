// app/data/customerReport.ts
import axios from 'axios';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface CustomerStatusRow {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null; // 'ACTIVE' / 'INACTIVE' / 'PENDING' etc.
}

/** Get list of all customers (active + inactive + pending). */
export async function fetchCustomerStatusList(): Promise<CustomerStatusRow[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE
  if (prod !== 'TRUE') {
    return [
      {
        id: 1,
        name: 'Alice Tan',
        email: 'alice@example.com',
        phone: '0123456789',
        status: 'ACTIVE',
      },
      {
        id: 2,
        name: 'Bob Lee',
        email: 'bob@example.com',
        phone: '0191111111',
        status: 'INACTIVE',
      },
      {
        id: 3,
        name: 'Charlie Pending',
        email: 'charlie@example.com',
        phone: '0182222222',
        status: 'PENDING',
      },
    ];
  }

  try {
    const res = await axios.get<CustomerStatusRow[]>(
      `/api/report/customer/status`,
      { withCredentials: true }
    );
    return res.data ?? [];
  } catch (err) {
    console.error('Error fetching customer status list:', err);
    return [];
  }
}

/** Download Excel file for customers, filtered by status. */
export async function downloadCustomerStatusExcel(
  statusFilter: string = "ALL"
): Promise<void> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE
  if (prod !== "TRUE") {
    console.log("[downloadCustomerStatusExcel] MOCK, filter =", statusFilter);
    return;
  }

  const params =
    statusFilter && statusFilter !== "ALL"
      ? `?status=${encodeURIComponent(statusFilter)}`
      : "";

  const url = `/api/report/customer/status/excel${params}`;

  const res = await axios.get<Blob>(url, {
    responseType: "blob",
    withCredentials: true,
  });

  const blobUrl = window.URL.createObjectURL(res.data);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = "customer-status-report.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(blobUrl);
}


// ---------- NEW CUSTOMERS REPORT ----------

// ✅ add 'range'
export type NewCustomerPeriod = 'day' | 'week' | 'month' | 'range';

export interface NewCustomerRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string | null;
  created_at: string; // ISO datetime string
}

function buildNewCustomerParams(
  period: NewCustomerPeriod,
  startDate?: string,
  endDate?: string
) {
  const params: any = { period };

  if (period === 'range') {
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
  }

  return params;
}

/** Get list of new customers for a given period (day/week/month/range). */
export async function fetchNewCustomerList(
  period: NewCustomerPeriod = 'day',
  startDate?: string,
  endDate?: string
): Promise<NewCustomerRow[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE
  if (prod !== 'TRUE') {
    const now = new Date().toISOString();
    const mock: NewCustomerRow[] = [
      {
        id: 101,
        name: 'New Alice',
        email: 'new.alice@example.com',
        phone: '0123456789',
        status: 'ACTIVE',
        created_at: now,
      },
      {
        id: 102,
        name: 'New Bob',
        email: 'new.bob@example.com',
        phone: '0191111111',
        status: 'PENDING',
        created_at: now,
      },
    ];

    // Optional: basic mock filtering if range is selected
    if (period === 'range' && startDate && endDate) {
      return mock.filter((r) => {
        const d = r.created_at?.slice(0, 10); // YYYY-MM-DD
        return d >= startDate && d <= endDate;
      });
    }

    return mock;
  }

  try {
    const res = await axios.get<NewCustomerRow[]>(
      `/api/report/customer/new`,
      {
        params: buildNewCustomerParams(period, startDate, endDate),
        withCredentials: true,
      }
    );
    return res.data ?? [];
  } catch (err) {
    console.error('Error fetching new customer list:', err);
    return [];
  }
}

/** Download Excel for new customers for a given period (day/week/month/range). */
export async function downloadNewCustomerExcel(
  period: NewCustomerPeriod = "day",
  startDate?: string,
  endDate?: string
): Promise<void> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod !== "TRUE") {
    console.log("[downloadNewCustomerExcel] MOCK", { period, startDate, endDate });
    return;
  }

  try {
    const res = await axios.get<Blob>(`/api/report/customer/new/excel`, {
      params: buildNewCustomerParams(period, startDate, endDate),
      withCredentials: true,
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = url;

    // ✅ nicer filename
    const suffix =
      period === "range" && startDate && endDate
        ? `${startDate}_to_${endDate}`
        : period;

    link.download = `new-customers-${suffix}.xlsx`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error downloading new customer Excel:", err);
    throw err;
  }
}


// ---------------------------------------------------------------------
// BY PACKAGE
// ---------------------------------------------------------------------
export interface CustomerByPackageRow {
  package_id: number | null;
  package_name: string | null;
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  pending_customers: number;
}

export async function fetchCustomerByPackageList(): Promise<CustomerByPackageRow[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE
  if (prod !== 'TRUE') {
    return [
      {
        package_id: 1,
        package_name: 'Basic Plan',
        total_customers: 5,
        active_customers: 3,
        inactive_customers: 1,
        pending_customers: 1,
      },
      {
        package_id: 2,
        package_name: 'Premium Plan',
        total_customers: 2,
        active_customers: 2,
        inactive_customers: 0,
        pending_customers: 0,
      },
    ];
  }

  try {
    const res = await axios.get<CustomerByPackageRow[]>(
      `/api/report/customer/by-package`,
      { withCredentials: true }
    );
    return res.data ?? [];
  } catch (err) {
    console.error('Error fetching customers by package:', err);
    return [];
  }
}

export async function downloadCustomerByPackageExcel(): Promise<void> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE
  if (prod !== "TRUE") {
    console.log("[downloadCustomerByPackageExcel] MOCK download");
    return;
  }

  try {
    const res = await axios.get<Blob>(`/api/report/customer/by-package/excel`, {
      withCredentials: true,
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(res.data);

    const link = document.createElement("a");
    link.href = url;
    link.download = "customers-by-package.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error downloading customers by package Excel:", err);
  }
}

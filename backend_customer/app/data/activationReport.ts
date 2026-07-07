// app/data/activationReport.ts
import axios from "axios";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
* ✅ Added "range" for custom date range
*/
export type ActivationPeriod = "day" | "week" | "month" | "range";

// ---------------------------------------------------------------------------
// TOTAL ACTIVATIONS (LIST)
// ---------------------------------------------------------------------------
export interface ActivationRow {
  id: number;
  customer_id: number | null;
  customer_name: string | null;
  package_id: number | null;
  package_name: string | null;
  staff_id: number | null;
  technician_name: string | null;
  status: string | null; // 'COMPLETED' / 'PENDING' / etc.
  install_date: string | null; // date string
  install_time: string | null; // 'HH:MM:SS' etc.
}

function buildActivationParams(
  period: ActivationPeriod,
  startDate?: string,
  endDate?: string
) {
  const params: any = { period };

  if (period === "range") {
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
  }

  return params;
}

/** Get total activations list by period OR date range. */
export async function fetchTotalActivationList(
  period: ActivationPeriod,
  startDate?: string,
  endDate?: string
): Promise<ActivationRow[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE
  if (prod !== "TRUE") {
    const mock: ActivationRow[] = [
      {
        id: 1,
        customer_id: 10,
        customer_name: "Demo Customer",
        package_id: 3,
        package_name: "Standard Package",
        staff_id: 5,
        technician_name: "Technician A",
        status: "COMPLETED",
        install_date: "2025-12-12",
        install_time: "10:30:00",
      },
    ];

    // Optional: basic mock filtering for range
    if (period === "range" && startDate && endDate) {
      return mock.filter((r) => {
        if (!r.install_date) return false;
        return r.install_date >= startDate && r.install_date <= endDate;
      });
    }

    return mock;
  }

  try {
    const res = await axios.get<ActivationRow[]>(
      `/api/report/activation/total`,
      {
        withCredentials: true,
        params: buildActivationParams(period, startDate, endDate),
      }
    );
    return res.data ?? [];
  } catch (err) {
    console.error("Error fetching total activation list:", err);
    return [];
  }
}

/** Download Excel for total activations (period OR date range). */
export async function downloadTotalActivationExcel(
  period: ActivationPeriod,
  startDate?: string,
  endDate?: string
): Promise<void> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE
  if (prod !== "TRUE") {
    console.log("[downloadTotalActivationExcel] MOCK", { period, startDate, endDate });
    return;
  }

  try {
    const res = await axios.get<Blob>(`/api/report/activation/total/excel`, {
      withCredentials: true,
      responseType: "blob",
      params: buildActivationParams(period, startDate, endDate),
    });

    const url = window.URL.createObjectURL(res.data);

    const link = document.createElement("a");
    link.href = url;
    link.download = "total-activations-report.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error downloading total activation Excel:", err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// ACTIVATIONS BY PACKAGE (Daily / Weekly / Monthly) – PERIOD BASED (+ RANGE)
// ---------------------------------------------------------------------------

/**
* ✅ Renamed to avoid name collision with legacy export below
*/
export interface ActivationByPackagePeriodRow {
  package_id: number | null;
  package_name: string;
  total_activations: number;
  total_completed: number;
  total_pending: number;
}

/** Fetch total activations grouped by package for a given period OR range. */
export async function fetchActivationByPackage(
  period: ActivationPeriod,
  startDate?: string,
  endDate?: string
): Promise<ActivationByPackagePeriodRow[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod !== "TRUE") {
    // MOCK DATA when API is disabled
    return [
      {
        package_id: 1,
        package_name: "Sample Package A",
        total_activations: 10,
        total_completed: 7,
        total_pending: 3,
      },
      {
        package_id: 2,
        package_name: "Sample Package B",
        total_activations: 5,
        total_completed: 4,
        total_pending: 1,
      },
    ];
  }

  try {
    const res = await axios.get<ActivationByPackagePeriodRow[]>(
      `/api/report/activation/by-package`,
      {
        withCredentials: true,
        params: buildActivationParams(period, startDate, endDate),
      }
    );
    return res.data ?? [];
  } catch (err) {
    console.error("Error fetching activation by package:", err);
    return [];
  }
}

/** Download Excel for activation by package for a given period OR range. */
export async function downloadActivationByPackageExcel(
  period: ActivationPeriod,
  startDate?: string,
  endDate?: string
): Promise<void> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod !== "TRUE") {
    console.log("[downloadActivationByPackageExcel] MOCK", { period, startDate, endDate });
    return;
  }

  try {
    const res = await axios.get<Blob>(
      `/api/report/activation/by-package/excel`,
      {
        withCredentials: true,
        responseType: "blob",
        params: buildActivationParams(period, startDate, endDate),
      }
    );

    const url = window.URL.createObjectURL(res.data);

    const link = document.createElement("a");
    link.href = url;
    link.download = "activation-by-package-report.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error downloading activation by package Excel:", err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// PACKAGE SUBSCRIPTIONS (BY DATE RANGE: start_date / end_date)
// ---------------------------------------------------------------------------

export interface PackageSubscriptionRow {
  package_id: number;
  package_name: string;
  total_activations: number | string;
  total_completed: number | string;
  total_pending: number | string;
  first_install_date: string | null;
  last_install_date: string | null;
}

/** JSON fetch – package subscriptions within a custom date range. */
export async function fetchPackageSubscriptions(
  startDate?: string,
  endDate?: string
): Promise<PackageSubscriptionRow[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE
  if (prod !== "TRUE") {
    return [
      {
        package_id: 1,
        package_name: "Sample Package A",
        total_activations: 3,
        total_completed: 2,
        total_pending: 1,
        first_install_date: "2025-12-10",
        last_install_date: "2025-12-12",
      },
    ];
  }

  try {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const res = await axios.get<PackageSubscriptionRow[]>(
      `/api/report/activation/subscriptions`,
      {
        params,
        withCredentials: true,
      }
    );

    return res.data ?? [];
  } catch (err) {
    console.error("Error fetching package subscriptions:", err);
    return [];
  }
}

/** Excel export – package subscriptions within a custom date range. */
export async function downloadPackageSubscriptionsExcel(
  startDate?: string,
  endDate?: string
): Promise<void> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod !== "TRUE") {
    console.log("[downloadPackageSubscriptionsExcel] MOCK", { startDate, endDate });
    return;
  }

  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const res = await axios.get<Blob>(
    `/api/report/activation/subscriptions/excel`,
    {
      params,
      responseType: "blob",
      withCredentials: true,
    }
  );

  const url = window.URL.createObjectURL(res.data);

  const link = document.createElement("a");
  link.href = url;
  link.download = "package-subscriptions-report.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// LEGACY EXPORTS for /module/report/activation/subscriptions
// So existing page.tsx continues to work without changes
// ---------------------------------------------------------------------------

export interface ActivationByPackageFilter {
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string; // 'YYYY-MM-DD'
}

// ✅ keep legacy name for subscriptions page compatibility
export type ActivationByPackageRow = PackageSubscriptionRow;

/** Wrapper: use date-range subscriptions API under old name */
export async function fetchActivationsByPackage(
  filter: ActivationByPackageFilter
): Promise<ActivationByPackageRow[]> {
  return fetchPackageSubscriptions(filter.startDate, filter.endDate);
}

/** Wrapper: use date-range subscriptions Excel API under old name */
export async function downloadActivationsByPackageExcel(
  filter: ActivationByPackageFilter
): Promise<void> {
  return downloadPackageSubscriptionsExcel(filter.startDate, filter.endDate);
}
 
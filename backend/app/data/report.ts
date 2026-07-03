export interface Report {
  report_id: number;
  name: string;
  type: string;
  generated_by: string;
  date: string;
  total_records: number;
  format: string;
  generated_at: string;
  status: 'Completed' | 'Processing' | 'Failed';
}

/**
 * Fetch all reports
 */
export async function fetchReports(): Promise<Report[]> {
  try {
    const res = await fetch('/api/report/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error('Failed to fetch reports');

    return await res.json();
  } catch (error) {
    console.error('fetchReports error:', error);
    return [];
  }
}

/**
 * Fetch single report
 */
export async function fetchReportById(id: number): Promise<Report | null> {
  try {
    const res = await fetch(`/api/reports/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error('Failed to fetch report');

    return await res.json();
  } catch (error) {
    console.error('fetchReportById error:', error);
    return null;
  }
}

/**
 * Delete report
 */
export async function deleteReport(id: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/reports/${id}`, {
      method: 'DELETE',
    });

    return res.ok;
  } catch (error) {
    console.error('deleteReport error:', error);
    return false;
  }
}

/**
 * Create / Generate Report
 */
export async function createReport(payload: {
  report_name: string;
  type: string;
  date_range: string;
  format: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Failed to generate report');

    return true;
  } catch (error) {
    console.error('createReport error:', error);
    return false;
  }
}
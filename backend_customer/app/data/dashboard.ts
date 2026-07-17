// app/data/dashboard.ts
// Data layer for the customer dashboard, wired to /api/customer-dashboard/*.

export interface MemorialStat {
  count: number;
  latest: string | null;
}

export interface DashboardMemorial {
  numberList: string;
  name: string;
  urlName: string;
  status: string;
  photoUrl: string | null;
  dateOfDeparture: string | null;
  placeOfRest: string | null;
  tributes: MemorialStat;
  photos: MemorialStat;
  videos: MemorialStat;
}

export type ActivityType = 'photo' | 'video' | 'audio' | 'tribute';

export interface DashboardActivity {
  /** Stable key: "<type>:<memorialId>:<yyyy-mm-dd>:<actor>" */
  id: string;
  type: ActivityType;
  /** null => the account owner ("You"). A name string => public-site visitor. */
  actor: string | null;
  memorialName: string;
  /** Number of items in this grouped event (e.g. 3 photos in one upload). */
  count: number;
  date: string;
  message: string;
}

export interface DashboardOverview {
  memorials: DashboardMemorial[];
  aggregate: {
    totalMemorials: number;
    totalTributes: number;
    totalPhotos: number;
    totalVideos: number;
  };
  activity: DashboardActivity[];
}

export type DashboardResult =
  | { ok: true; data: DashboardOverview }
  | { ok: false; error: string };

/**
 * Fetch the logged-in customer's dashboard overview.
 *
 * Returns a discriminated result rather than an empty payload: a 401/500 must not
 * be indistinguishable from "this account has no memorials yet".
 */
export async function fetchDashboardOverview(): Promise<DashboardResult> {
  try {
    const res = await fetch('/api/customer-dashboard/overview', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: 'Your session has expired. Please sign in again.' };
    }

    if (!res.ok) {
      return { ok: false, error: `Could not load your dashboard (error ${res.status}).` };
    }

    const data = (await res.json()) as DashboardOverview;
    return { ok: true, data };
  } catch (error) {
    console.error('fetchDashboardOverview error:', error);
    return { ok: false, error: 'Could not reach the server. Check your connection and try again.' };
  }
}
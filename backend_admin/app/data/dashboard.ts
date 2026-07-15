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

export interface DashboardActivity {
  type: 'tribute' | 'photo';
  memorialName: string;
  date: string;
  message: string;
}

export interface DashboardOverview {
  memorials: DashboardMemorial[];
  aggregate: {
    totalMemorials: number;
    totalTributes: number;
    totalPhotos: number;
  };
  activity: DashboardActivity[];
}

const EMPTY_OVERVIEW: DashboardOverview = {
  memorials: [],
  aggregate: { totalMemorials: 0, totalTributes: 0, totalPhotos: 0 },
  activity: [],
};

/**
 * Fetch the logged-in customer's dashboard overview
 * (Account Overview memorials + Account Information stats + recent activity).
 */
export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  try {
    const res = await fetch('/api/customer-dashboard/overview', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch dashboard overview');
    }

    return await res.json();
  } catch (error) {
    console.error('fetchDashboardOverview error:', error);
    return EMPTY_OVERVIEW;
  }
}
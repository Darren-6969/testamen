// app/data/obituary.ts

export interface Obituary {
  number_list: number;
  create_date: string;
  mf_fullname: string;
  mf_id: string;
  username: string
}

/**
 * Fetch all obituary records
 */
export async function fetchObituaries(): Promise<Obituary[]> {
  try {
    const res = await fetch('/api/obituary/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch obituaries');
    }

    return await res.json();
  } catch (error) {
    console.error('fetchObituaries error:', error);
    return [];
  }
}

/**
 * Fetch single obituary by ID (for preview/detail)
 */
export async function fetchObituaryById(id: number): Promise<Obituary | null> {
  try {
    const res = await fetch(`/api/obituaries/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch obituary');
    }

    return await res.json();
  } catch (error) {
    console.error('fetchObituaryById error:', error);
    return null;
  }
}
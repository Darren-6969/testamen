// app/data/obituary.ts

export interface Obituary {
  id: number;
  number_list: number;
  create_date: string;
  mf_fullname: string;
  mf_id: string;
  username: string;

  // Detail-only fields, present when fetched via fetchObituaryById
  code_no?: string | null;
  md_content?: string | null;
  mf_img?: string | null;
  mf_born?: string | null;
  mf_pass_date?: string | null;
  'mf-born_location'?: string | null;
  mf_pass_location?: string | null;
  mf_quote?: string | null;
  mf_wake_dtl_til?: string | null;
  mf_wake_dtl_add?: string | null;
  mf_cortehe_on?: string | null;
  mf_location_funeral?: string | null;
  mf_further_dtl?: string | null;
  mf_further_dtl2?: string | null;
  mf_theme?: string | null;
  create_by?: string | null;
  create_time?: string | null;
  memorial_id?: string | null;
  pdf_name?: string | null;
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
export async function fetchObituaryById(id: number | string): Promise<Obituary | null> {
  try {
    const res = await fetch(`/api/obituary/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch obituary');
    }

    const data = await res.json();

    // backend responds with { success, data }
    return data?.data ?? data ?? null;
  } catch (error) {
    console.error('fetchObituaryById error:', error);
    return null;
  }
}
// app/data/memorials.ts
//
// Shared helper: the logged-in customer's memorials, used by the reusable
// module header (dropdown + View public page link).

export interface MemorialOption {
  numberList: string; // = memorial_id across the app (mt_deceased.number_list)
  name: string;
  urlName: string | null;
  codeNo: string | null;
  photoUrl: string | null; // obituary portrait, same image the dashboard shows
}

export async function fetchMemorials(): Promise<MemorialOption[]> {
  try {
    const res = await fetch('/api/memorials', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch memorials');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(err);
    return [];
  }
}
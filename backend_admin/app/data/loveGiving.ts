// app/data/loveGiving.ts

export interface LoveGiving {
  id?: number;
  account_name: string | null;
  account_number: string | null; // aliased from DB column `accoount_number`
  bank_name: string | null;
  bank_number: string | null;
  bank_branch: string | null;
  branch_code: string | null;
  memorial_id?: string;
}

export type LoveGivingForm = Omit<LoveGiving, 'id' | 'memorial_id'>;

export const EMPTY_LOVE_GIVING: LoveGivingForm = {
  account_name: '',
  account_number: '',
  bank_name: '',
  bank_number: '',
  bank_branch: '',
  branch_code: '',
};

// Bank dropdown options. Grouped: Malaysian retail banks first, then major
// international banks, then a free-text "Other" escape hatch.
export const MALAYSIAN_BANKS: string[] = [
  'Maybank',
  'CIMB Bank',
  'Public Bank',
  'RHB Bank',
  'Hong Leong Bank',
  'AmBank',
  'Bank Islam',
  'Bank Rakyat',
  'Bank Simpanan Nasional (BSN)',
  'Affin Bank',
  'Alliance Bank',
  'Bank Muamalat',
  'Agrobank',
  'MBSB Bank',
  'HSBC Bank Malaysia',
  'OCBC Bank Malaysia',
  'UOB Malaysia',
  'Standard Chartered Malaysia',
  'Citibank Malaysia',
  'Bank of China Malaysia',
];

export const INTERNATIONAL_BANKS: string[] = [
  'HSBC',
  'Citibank',
  'Standard Chartered',
  'JPMorgan Chase',
  'Bank of America',
  'Wells Fargo',
  'Barclays',
  'DBS Bank',
  'OCBC Bank',
  'United Overseas Bank (UOB)',
  'Deutsche Bank',
  'BNP Paribas',
];

export async function fetchLoveGiving(memorialId: string): Promise<LoveGiving | null> {
  try {
    const res = await fetch(`/api/love-giving/by-memorial/${encodeURIComponent(memorialId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch love giving details');
    return (await res.json()) as LoveGiving | null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function saveLoveGiving(
  memorialId: string,
  data: LoveGivingForm
): Promise<{ status: string; data?: LoveGiving; message?: string }> {
  try {
    const res = await fetch('/api/love-giving/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, memorialId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Failed to save');
    return json;
  } catch (err) {
    console.error(err);
    return { status: 'error', message: (err as Error).message };
  }
}
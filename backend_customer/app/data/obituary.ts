// app/data/obituary.ts
//
// Data layer for the customer obituary EDITOR.
// Same-origin /api/* calls, cookie auth (see data/billing.ts).

export interface ObituaryRecord {
  id?: number;
  memorial_id?: string;
  md_content: string | null;
  mf_img: string | null;
  mf_fullname: string | null;
  mf_born: string | null;
  mf_pass_date: string | null;
  mf_born_location: string | null;
  mf_pass_location: string | null;
  mf_quote: string | null;
  mf_wake_dtl_til: string | null;
  mf_wake_dtl_add: string | null;
  mf_cortehe_on: string | null;
  mf_location_funeral: string | null;
  mf_further_dtl: string | null;
  mf_further_dtl2: string | null;
  mf_theme: string; // 'd1' | 'd2' | 'd3' | 'd4'
  pdf_name?: string | null;
}

export const EMPTY_OBITUARY: ObituaryRecord = {
  md_content: '',
  mf_img: null,
  mf_fullname: '',
  mf_born: null,
  mf_pass_date: null,
  mf_born_location: '',
  mf_pass_location: '',
  mf_quote: '',
  mf_wake_dtl_til: '',
  mf_wake_dtl_add: '',
  mf_cortehe_on: null,
  mf_location_funeral: '',
  mf_further_dtl: '',
  mf_further_dtl2: '',
  mf_theme: 'd1',
  pdf_name: null,
};

function normalize(raw: Record<string, unknown> | null): ObituaryRecord | null {
  if (!raw) return null;
  return {
    ...(raw as unknown as ObituaryRecord),
    mf_born_location:
      (raw['mf-born_location'] as string) ?? (raw['mf_born_location'] as string) ?? '',
  };
}

export async function fetchObituaryByMemorial(
  memorialId: string
): Promise<ObituaryRecord | null> {
  try {
    const res = await fetch(`/api/obituary/by-memorial/${memorialId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch obituary');
    const json = await res.json();
    return normalize(json.data);
  } catch (error) {
    console.error('fetchObituaryByMemorial error:', error);
    return null;
  }
}

export async function saveObituary(
  memorialId: string,
  data: ObituaryRecord
): Promise<{ success: boolean; data?: ObituaryRecord }> {
  try {
    const res = await fetch('/api/obituary/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, memorialId }),
    });
    if (!res.ok) throw new Error('Failed to save obituary');
    const json = await res.json();
    return { success: true, data: normalize(json.data) ?? undefined };
  } catch (error) {
    console.error('saveObituary error:', error);
    return { success: false };
  }
}

export async function uploadObituaryImage(file: File): Promise<string | null> {
  try {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch('/api/obituary/upload-image', {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error('Image upload failed');
    const json = await res.json();
    return json.filename ?? null;
  } catch (error) {
    console.error('uploadObituaryImage error:', error);
    return null;
  }
}

/**
 * Generate/overwrite the PDF for a saved obituary.
 * Returns the public url and the stable pdf filename (or null on failure).
 */
export async function generateObituaryPdf(
  memorialId: string
): Promise<{ url: string; pdfName: string } | null> {
  try {
    const res = await fetch(`/api/obituary/generate-pdf/${memorialId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('PDF generation failed');
    const json = await res.json();
    if (!json.url) return null;
    return { url: json.url, pdfName: json.pdfName };
  } catch (error) {
    console.error('generateObituaryPdf error:', error);
    return null;
  }
}
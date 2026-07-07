import axios from 'axios';

export interface CreditNote {
  DOCKEY: number;
  DOCNO: string;
  DOCDATE: string;
  COMPANYNAME: string;
  DESCRIPTION: string;
  LOCALDOCAMT: number;
  ATTENTION: string;
}
export const mockCreditNotes: CreditNote[] = [];

const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Replace with an async fetcher
export async function fetchCreditNotes(cursor: string | null = null, search: Record<string, string> = {}): Promise<{ data: CreditNote[]; nextCursor: string | null }> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if(prod ==="TRUE"){
    try {
      const params = new URLSearchParams({ limit: '10' });
      if (cursor) params.append('cursor', cursor);
      if (search.DOCNO) params.append('docno', search.DOCNO);
      if (search.COMPANYNAME) params.append('companyname', search.COMPANYNAME);
      if (search.ATTENTION) params.append('attention', search.ATTENTION);
      if (search.DOCDATE) params.append('docdate', search.DOCDATE);
      if (search.DESCRIPTION) params.append('description', search.DESCRIPTION);
      if (search.LOCALDOCAMT) params.append('localdocamt', search.LOCALDOCAMT);
      const res = await axios.get<{ data: CreditNote[]; pagination: { hasMore: boolean; nextCursor: string | null } }>(
        `/api/credit-notes?${params}`,
        { withCredentials: true }
      );
      return { data: res.data.data, nextCursor: res.data.pagination.nextCursor };
    } catch (error) {
      console.error('Error fetching credit notes:', error);
      return { data: [], nextCursor: null };
    }
  }else{
    return { data: mockCreditNotes, nextCursor: null };
  }
}

// ✅ Fetch single credit note by ID (for view page)
export async function fetchCreditNoteById(id: number): Promise<CreditNote | null> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === "TRUE") {
    try {
      const response = await axios.get<CreditNote>(`/api/credit-notes/${id}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching credit note by Dockey:', error);
      return null;
    }
  } else {
    return mockCreditNotes.find((i) => i.DOCKEY === id) || null;
  }
}

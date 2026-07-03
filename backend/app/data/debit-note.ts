import axios from 'axios';

export interface DebitNote {
  DOCKEY: number;
  DOCNO: string;
  DOCDATE: string;
  COMPANYNAME: string;
  DESCRIPTION: string;
  LOCALDOCAMT: number;
  ATTENTION: string;
}
export const mockDebitNotes: DebitNote[] = [];

const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Replace with an async fetcher
export async function fetchDebitNotes(cursor: string | null = null, search: Record<string, string> = {}): Promise<{ data: DebitNote[]; nextCursor: string | null }> {
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
      const res = await axios.get<{ data: DebitNote[]; pagination: { hasMore: boolean; nextCursor: string | null } }>(
        `/api/debit-notes?${params}`,
        { withCredentials: true }
      );
      return { data: res.data.data, nextCursor: res.data.pagination.nextCursor };
    } catch (error) {
      console.error('Error fetching debit notes:', error);
      return { data: [], nextCursor: null };
    }
  }else{
    return { data: mockDebitNotes, nextCursor: null };
  }
}

// ✅ Fetch single debit note by ID (for view page)
export async function fetchDebitNoteById(id: number): Promise<DebitNote | null> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === "TRUE") {
    try {
      const response = await axios.get<DebitNote>(`/api/debit-notes/${id}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching debit note by Dockey:', error);
      return null;
    }
  } else {
    return mockDebitNotes.find((i) => i.DOCKEY === id) || null;
  }
}

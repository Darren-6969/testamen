import axios from 'axios';

// export interface PaymentInvoiceDetail {
//   invoice_no: string;
//   date: string;
//   amount: number;
// }

// export interface Payment {
//   dockey: string;
//   docno: string;
//   docdate: string;
//   customer_name?: string;
//   customer_code?: string;
//   contact_no?: string;
//   amount: number;
//   cancelled: string;
//   transaction_type?: string;
//   reference_no?: string;
//   payment_method?: string;
//   payment_source?: string;
//   invoice_no?: string[];
//   invoices?: PaymentInvoiceDetail[];
//   status?: string;
// }

export interface Payment {
  dockey: string;
  docno: string;
  docdate: string; // always formatted d/m/y
  customer_name: string;
  customer_code: string;
  contact_no: string;
  amount: number;
  payment_method?: string;
  status: 'PENDING APPROVAL' | 'PENDING POSTING' | 'COMPLETED';
  source: 'POSTGRES' | 'JSON';

  // hybrid fields (Postgres only)
  reference_no?: string;
  invoices?: Invoice[];

  bill_reference: string;
}

export interface Invoice {

}

export const mockPayments: Payment[] = [];

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Replace with an async fetcher
export async function fetchAllPayment(cursor: string | null = null, search: Record<string, string> = {}): Promise<{ data: Payment[]; nextCursor: string | null }> {
  if (process.env.NEXT_PUBLIC_API_ENABLED === "TRUE") {
    try {
      const params = new URLSearchParams({ limit: '10' });
      if (cursor) params.append('completed_cursor', cursor);
      if (search.docno) params.append('docno', search.docno);
      if (search.reference_no) params.append('reference_no', search.reference_no);
      if (search.customer_name) params.append('customer_name', search.customer_name);
      if (search.customer_code) params.append('customer_code', search.customer_code);
      if (search.bill_reference) params.append('bill_reference', search.bill_reference);
      if (search.docdate) params.append('docdate', search.docdate);
      if (search.amount) params.append('amount', search.amount);
      if (search.status) params.append('status', search.status);
      const res = await axios.get<{
        pending: { data: Payment[]; pagination: { hasMore: boolean; nextCursor: string | null } };
        completed: { data: Payment[]; pagination: { hasMore: boolean; nextCursor: string | null } };
      }>(
        `/api/payments/all?${params}`,
        { withCredentials: true }
      );
      // First page: all pending + first batch of completed. Subsequent pages: completed only.
      const data = cursor
        ? res.data.completed.data
        : [...res.data.pending.data, ...res.data.completed.data];
      return { data, nextCursor: res.data.completed.pagination.nextCursor };
    } catch (error) {
      console.error('Error fetching all payments:', error);
      return { data: [], nextCursor: null };
    }
  } else {
    return { data: mockPayments, nextCursor: null };
  }
}

export async function fetchCompletedPaymentCursor(cursor: string | null = null, search: Record<string, string> = {}): Promise<{ data: Payment[]; nextCursor: string | null }> {
  if (process.env.NEXT_PUBLIC_API_ENABLED === "TRUE") {
    try {
      const params = new URLSearchParams({ limit: '10' });
      if (cursor) params.append('cursor', cursor);
      if (search.docno) params.append('docno', search.docno);
      if (search.customer_code) params.append('customer_code', search.customer_code);
      if (search.customer_name) params.append('customer_name', search.customer_name);
      if (search.bill_reference) params.append('bill_reference', search.bill_reference);
      if (search.docdate) params.append('docdate', search.docdate);
      if (search.amount) params.append('amount', search.amount);
      const res = await axios.get<{ data: Payment[]; pagination: { hasMore: boolean; nextCursor: string | null } }>(
        `/api/payments/completed?${params}`,
        { withCredentials: true }
      );
      return { data: res.data.data, nextCursor: res.data.pagination.nextCursor };
    } catch (error) {
      console.error('Error fetching completed payments:', error);
      return { data: [], nextCursor: null };
    }
  } else {
    return { data: mockPayments, nextCursor: null };
  }
}

export async function fetchPendingPaymentCursor(cursor: string | null = null, search: Record<string, string> = {}): Promise<{ data: Payment[]; nextCursor: string | null }> {
  if (process.env.NEXT_PUBLIC_API_ENABLED === "TRUE") {
    try {
      const params = new URLSearchParams({ limit: '10' });
      if (cursor) params.append('cursor', cursor);
      if (search.reference_no) params.append('reference_no', search.reference_no);
      if (search.customer_code) params.append('customer_code', search.customer_code);
      if (search.customer_name) params.append('customer_name', search.customer_name);
      if (search.bill_reference) params.append('bill_reference', search.bill_reference);
      if (search.docdate) params.append('docdate', search.docdate);
      if (search.amount) params.append('amount', search.amount);
      if (search.status) params.append('status', search.status);

      const response = await axios.get<{ data: Payment[]; pagination: { hasMore: boolean; nextCursor: string | null } }>(
        `/api/payments/pending?${params}`,
        { withCredentials: true }
      );
      return { data: response.data.data, nextCursor: response.data.pagination.nextCursor };
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      return { data: [], nextCursor: null };
    }
  } else {
    return { data: mockPayments, nextCursor: null };
  }
}

// json (main) + postgres (enrich)
export async function fetchCompletedPayment(): Promise<Payment[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if(prod ==="TRUE"){
    try {
      const res = await axios.get<{ data: Payment[]; pagination: { hasMore: boolean; nextCursor: string | null } }>(
        `/api/payments/completed`,
        { withCredentials: true }
      );
      return res.data.data;
    } catch (error) {
      console.error('Error fetching completed payments:', error);
      return [];
    }
  }else{
    return mockPayments;
  }
}

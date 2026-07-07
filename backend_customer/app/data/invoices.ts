import axios from 'axios';

export interface InvoiceListRow {
  DOCKEY?: string;
  DOCNO: string;
  DOCDATE: string;
  COMPANYNAME: string;
  LOCALDOCAMT: number | string;
  PAYMENTAMT?: number | string;
  ATTENTION?: string;
  CANCELLED?: string;
}

export interface Invoice {
  billNo: string;
  accountNo: string;
  accountName: string;
  phoneOrPin?: string;
  billDate: string;
  contract: string | null;
  deposit: string;
  billingPeriod: string;

  overdueAmount: string;
  currentChargesDueDate: string;
  totalAmountDue: string;

  summary: {
    previousBalance: string;
    totalPaymentReceivedDate: string;
    totalPaymentReceivedAmount: string;
    adjustment: string;
    balanceForward: string;
    currentChargesTitle: string;
    monthlyChargesTitle: string;
    items: { label: string; amount: string; indent?: number }[];
    totalCurrentCharges: string;
  };

  customerAddressLines: string[];
  attn: string;
}

export const mockInvoices: InvoiceListRow[] = [];

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Replace with an async fetcher
export async function fetchInvoices(cursor: string | null = null, search: Record<string, string> = {}): Promise<{ data: InvoiceListRow[]; nextCursor: string | null }> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if(prod ==="TRUE"){

    // FIREBIRD JSON HERE
    // try {
    //   const response = await axios.post<Invoice[]>(
    //     `/api/invoices`,
    //     {
    //       fields: [
    //         'DOCKEY',
    //         'DOCNO',
    //         'DOCDATE',
    //         'COMPANYNAME',
    //         'LOCALDOCAMT',
    //         'ATTENTION',
    //         'CANCELLED',
    //       ]
    //     },
    //     {
    //       withCredentials: true,
    //     }
    //   );
    //   return response.data;
    // } catch (error) {
    //   console.error('Error fetching invoices:', error);
    //   return [];
    // }

    try {
      const params = new URLSearchParams({ limit: '10' });
      if (cursor) params.append('cursor', cursor);
      if (search.DOCNO) params.append('docno', search.DOCNO);
      if (search.COMPANYNAME) params.append('companyname', search.COMPANYNAME);
      if (search.ATTENTION) params.append('attention', search.ATTENTION);
      if (search.CANCELLED) params.append('cancelled', search.CANCELLED);
      if (search.DOCDATE) params.append('docdate', search.DOCDATE);
      if (search.LOCALDOCAMT) params.append('localdocamt', search.LOCALDOCAMT);
      const res = await axios.get<{ data: InvoiceListRow[]; pagination: { hasMore: boolean; nextCursor: string | null } }>(
        `/api/invoices?${params}`,
        { withCredentials: true }
      );
      return { data: res.data.data, nextCursor: res.data.pagination.nextCursor };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return { data: [], nextCursor: null };
    }
  }else{
    return { data: mockInvoices, nextCursor: null };
  }
}

// ✅ Fetch single invoice by DocNo (for view page)
// export async function fetchInvoiceNo(DOCNO: string): Promise<Invoice | null> {
//   const prod = process.env.NEXT_PUBLIC_API_ENABLED;

//   if (prod === "TRUE") {
//     try {
//       const response = await axios.get<Invoice>(`/api/invoices/${DOCNO}`, {
//         withCredentials: true,
//       });
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching invoice by Doc No.: ', error);
//       return null;
//     }
//   } else {
//     return mockInvoices.find((i) => i.billNo === DOCNO) || null;
//   }
// }

// export function getMockInvoice(docno: string) {
//   return {
//     billNo: decodeURIComponent(docno),
//     accountNo: '1190219',
//     accountName: 'A & L DENTAL SDN BHD',
//     phoneOrPin: 'Please Refer To Next Page',
//     billDate: '27 August 2025',
//     contract: '2 Years',
//     deposit: 'RM 736.00',
//     billingPeriod: '26/07/2025 - 25/08/2025',

//     overdueAmount: '0.00',
//     currentChargesDueDate: '27-Sep-2025',
//     totalAmountDue: '156.88',

//     summary: {
//       previousBalance: '156.88',
//       totalPaymentReceivedDate:
//         '30-Jul-2025',
//       totalPaymentReceivedAmount: '-156.88',
//       adjustment: '0.00',
//       balanceForward: '0.00',
//       currentChargesTitle: 'Current Charges',
//       monthlyChargesTitle: 'Monthly Charges',
//       items: [
//         { label: '2025 BIZ HIGH 150 MBPS', amount: '148.00', indent: 2 },
//         { label: 'Local Call Charges', amount: '0.00' },
//         { label: 'Trunk Call Charges', amount: '0.00' },
//         { label: 'Mobile Call Charges', amount: '0.00' },
//         { label: 'International Call Charges', amount: '0.00' },
//         { label: 'Total Before Service Tax', amount: '148.00' },
//         { label: 'Service Tax 6%', amount: '8.88' },
//       ],
//       totalCurrentCharges: '156.88',
//     },

//     customerAddressLines: [
//       'A & L DENTAL SDN BHD',
//       'LOT 13013 (GROUND FLOOR), BLOCK 16',
//       'KCLD, GALACITY COMMERCIAL SHOPS',
//       'JALAN TUN JUGAH',
//       '93350 KUCHING',
//     ],

//     attn: 'AARON CHIENG SHAO NENG',
//   };
// }

export async function getInvoice(docno: string) {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if (prod === "TRUE") {
    try {
      const response = await axios.get(`/api/invoices/pdf/${docno}`, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }
}

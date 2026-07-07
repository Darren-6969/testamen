'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PDFViewer } from '@react-pdf/renderer';
import InvoiceLayout from "@/components/pdf/InvoiceLayout";
import { getMockCompany  } from '@/app/data/company';
import { getInvoice  } from '@/app/data/invoices';
import Button from '@/components/button/Button';

export default function ViewInvoicePage() {
  const { docno } = useParams<{ docno: string }>();
  const router = useRouter();

  const [company, setCompany] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docno) return;

    (async () => {
      const inv = await getInvoice(docno);

      if (!inv) {
        router.push('/module/billings');
        return;
      }

      setInvoice(inv);
      setCompany(getMockCompany());
      setLoading(false);

    })();

  }, [docno, router]);

  if (!company && !invoice) return <p>Loading invoice...</p>;

  return (
    <div className="space-y-6">
      <h3 className='float-left'>{decodeURIComponent(docno)}</h3>
      <Button
        className='float-right'
        variant={'outline'}
        color='black'
        onClick={() => router.push('/module/billings')}
      >
        Back
      </Button>
      
      <div style={{ width: '85vw', height: '85vh' }}>
        <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
          <InvoiceLayout invoice={invoice} company={company} />
        </PDFViewer>
      </div>
    </div>
  );
}
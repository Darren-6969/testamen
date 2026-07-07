'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PDFViewer } from '@react-pdf/renderer';
import InvoiceLayout from '@/components/pdf/InvoiceLayout';
import { getMockCompany } from '@/app/data/company';
import { getInvoice } from '@/app/data/invoices';

export default function ExternalInvoicePage() {
  const { docno } = useParams<{ docno: string }>();
  const router = useRouter();

  const [company, setCompany] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loadingText, setLoadingText] = useState("Preparing invoice...");
  const [slowLoad, setSlowLoad] = useState(false);

  useEffect(() => {
    if (!docno) return;

    const steps = [
      "Fetching invoice data...",
      "Preparing company details...",
      "Generating PDF preview..."
    ];

    let step = 0;

    const messageInterval = setInterval(() => {
      step = (step + 1) % steps.length;
      setLoadingText(steps[step]);
    }, 1500);

    const slowTimer = setTimeout(() => {
      setSlowLoad(true);
    }, 10000);

    (async () => {
      const inv = await getInvoice(docno);

      if (!inv) {
        clearInterval(messageInterval);
        clearTimeout(slowTimer);
        router.push('/module/billings');
        return;
      }

      setInvoice(inv);
      setCompany(getMockCompany());

      clearInterval(messageInterval);
      clearTimeout(slowTimer);
    })();

    return () => {
      clearInterval(messageInterval);
      clearTimeout(slowTimer);
    };
  }, [docno, router]);

  if (!company || !invoice) {
    return (
      <main
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f9fafb",
          fontFamily: "system-ui"
        }}
      >
        {/* Spinner */}
        <div
          style={{
            width: 50,
            height: 50,
            border: "4px solid #e5e7eb",
            borderTop: "4px solid #2563eb",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }}
        />

        {/* Main loading text */}
        <p style={{ marginTop: 20, fontSize: 16, color: "#374151" }}>
          {loadingText}
        </p>

        {/* Progress bar */}
        <div
          style={{
            marginTop: 20,
            width: 240,
            height: 6,
            background: "#e5e7eb",
            borderRadius: 10,
            overflow: "hidden"
          }}
        >
          <div
            style={{
              width: "40%",
              height: "100%",
              background: "#2563eb",
              animation: "loading 2s infinite"
            }}
          />
        </div>

        <p style={{ marginTop: 8, fontSize: 13, color: "#9ca3af" }}>
          Please wait while we prepare your invoice.
        </p>

        {slowLoad && (
          <p style={{ marginTop: 10, fontSize: 13, color: "#ef4444" }}>
            This is taking longer than expected. Please keep this page open.
          </p>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(250%); }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main style={{ width: '100vw', height: '100vh', backgroundColor: '#fff' }}>
      <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
        <InvoiceLayout invoice={invoice} company={company} />
      </PDFViewer>
    </main>
  );
}
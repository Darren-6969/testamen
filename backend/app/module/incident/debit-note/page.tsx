'use client';

import GenericTablePage from '@/components/generic/GenericTablePage';
import { fetchDebitNotes } from '@/app/data/debit-note'; 
import { debitNoteColumns } from '@/app/config/BillingsTableConfig';
import { useRouter } from 'next/navigation';
import { ReceiptText } from 'lucide-react';
import axios from 'axios';
import PageHeader from '@/components/header/PageHeader';
import TabsHeader from '@/components/tab/TabsHeader';

export default function DebitNotePage() {
  const router = useRouter();

  const tabs = [
    { label: "Invoice", path: "/module/billings" },
    { label: "Credit Note", path: "/module/billings/credit-note" },
    { label: "Debit Note", path: "/module/billings/debit-note" },
  ]
  return (
    <div className="space-y-6">
      <PageHeader icon={<ReceiptText className="w-6 h-6 text- #c3195d" />}>
        <span className="text- #c3195d">Billing</span>
      </PageHeader>

      {/* Tab header */}
      <TabsHeader tabs={tabs} />

      {/* Table */}
      <GenericTablePage
        fetchDataCursor={fetchDebitNotes}
        columns={debitNoteColumns(router)}
        config={{
          tableType: 'columnSearch',
          pageSize: 10,
        }}
      />

    </div>
  );
}
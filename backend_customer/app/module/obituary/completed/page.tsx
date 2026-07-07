'use client';

import GenericTablePage from '@/components/generic/GenericTablePage';
import { fetchCompletedPaymentCursor } from '@/app/data/payments';
import { completedColumns } from '@/app/config/PaymentsTableConfig';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import { CreditCard } from 'lucide-react';
import TabsHeader from '@/components/tab/TabsHeader';

export default function PaymentsPage() {
  const router = useRouter();

  const tabs = [
	{ label: "All", path: "/module/payments" },
	{ label: "Pending", path: "/module/payments/pending" },
	{ label: "Completed", path: "/module/payments/completed" },
  ]
  return (
	<div className="space-y-6">
	  <PageHeader icon={<CreditCard className="w-6 h-6 text- #c3195d" />} >
		<span className="text- #c3195d">Payment</span>
	  </PageHeader>

	  {/* Tab header */}
	  <TabsHeader tabs={tabs} />

	  {/* Table */}
	  <GenericTablePage
		fetchDataCursor={fetchCompletedPaymentCursor}
		columns={completedColumns(router)}
		config={{
		  pageSize: 10,
		  tableType: 'columnSearch',
		}}
	  />

	</div>
  );
}
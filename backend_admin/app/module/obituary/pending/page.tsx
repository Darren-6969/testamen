// app/module/payments/pending/page.tsx
'use client';

import GenericTablePage from '@/components/generic/GenericTablePage';
import { fetchPendingPaymentCursor } from '@/app/data/payments';
import { pendingColumns } from '@/app/config/PaymentsTableConfig';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import TabsHeader from '@/components/tab/TabsHeader';
import { CreditCard } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useState, useMemo, useCallback } from 'react';

// import { useState } from 'react';

export default function PaymentsPage() {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const [reloadKey, setReloadKey] = useState(0);

  // const api = axios.create({
  //   baseURL: baseUrl,
  //   withCredentials: true, // send cookies/session if needed
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  // });
  const api = useMemo(() => {
    return axios.create({
      baseURL: baseUrl,
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
  }, [baseUrl]);

  const handleUpdate = useCallback(async (dockey: string) => {
    if (!dockey) return;
    try {
      await api.put(`/payments/status/${dockey}`);
      toast.success('Payment updated successfully');
      setReloadKey(k => k + 1);
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error('Failed to update payment status');
    }
  }, [api]);

  const handleDelete = useCallback(async (dockey: string) => {
    if (!dockey) return;
    try {
      await api.delete(`/payments/${dockey}`);
      toast.success('Payment deleted successfully');
      router.refresh();
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete payment');
    }
  }, [api, router]);

  // const handleUpdate = async (dockey: string) => {
  //   if (!dockey) return;
  //   try {
  //     await api.put(`/payments/status/${dockey}`);
  //     toast.success('Payment updated successfully');
  //     setReloadKey(k => k + 1);
  //   } catch (error: any) {
  //     console.error('Delete failed:', error);
  //     toast.error('Failed to update payment status');
  //   }
  // };

  // const handleDelete = async (dockey: string) => {
  //   if (!dockey) return;
  //   try {
  //     await api.delete(`/payments/${dockey}`);
  //     toast.success('Payment deleted successfully');
  //     router.refresh();
  //   } catch (error: any) {
  //     console.error('Delete failed:', error);
  //     toast.error('Failed to delete payment');
  //   }
  // };
  const columns = useMemo(
    () => pendingColumns(router, handleDelete, handleUpdate),
    [router, handleDelete, handleUpdate]
  );
  const tabs = [
	{ label: "All", path: "/module/payments" },
	{ label: "Pending", path: "/module/payments/pending" },
	{ label: "Completed", path: "/module/payments/completed" },
  ]
  return (
	<div className="space-y-6">
	  <PageHeader icon={<CreditCard className="w-6 h-6 text- #c3195d" />} subtitle="">
		<span className="text- #c3195d">Payment</span>
	  </PageHeader>

	  {/* Tab header */}
	  <TabsHeader tabs={tabs} />

	  {/* Table */}
	  <GenericTablePage
	  	key={reloadKey}
		fetchDataCursor={fetchPendingPaymentCursor}
		columns={columns}
		// addRoute='/module/payments/add'
		config={{
		  pageSize: 10,
		  tableType: 'columnSearch',
		  // addButtonLabel: 'Create Payment',
		}}
	  />

	</div>
  );
}

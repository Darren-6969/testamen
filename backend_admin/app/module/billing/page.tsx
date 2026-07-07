'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GenericTablePage from '@/components/generic/GenericTablePage';
import { fetchBilling } from '@/app/data/billing';
import { billingTableColumns } from '@/app/config/BillingTableConfig';
import PageHeader from '@/components/header/PageHeader';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';


export default function BillingPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this billing record?')) return;

    try {
      const res = await fetch(`/api/billing/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error();

      toast.success('Billing record deactivated successfully.');
      setReloadKey((k) => k + 1);
    } catch (error) {
      console.error(error);
      toast.error('Error deactivating billing record.');
    }
  };

  const fetchBillingForTable = async (...args: any[]) => {
    const result: any = await fetchBilling();

    if (Array.isArray(result)) {
      return {
        data: result,
        nextCursor: null,
      };
    }

    if (result?.data && Array.isArray(result.data)) {
      return {
        data: result.data,
        nextCursor: result.nextCursor || null,
      };
    }

    return {
      data: [],
      nextCursor: null,
    };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<CreditCard className="w-5 h-5 text-[#c3195d]" />}
        subtitle="Manage invoices and payment records"
      >
        <span className="text-[#c3195d]">Billing & Payment</span>
      </PageHeader>

      <GenericTablePage
        key={reloadKey}
        fetchData={fetchBilling}
        columns={billingTableColumns(router, handleDelete)}
        addRoute="/module/billing/add"
        config={{
          addButtonLabel: 'Add Bill',
          pageSize: 10,
          tableType: 'columnSearch',
        }}
      />
    </div>
  );
}
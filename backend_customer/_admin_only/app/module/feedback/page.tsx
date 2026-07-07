'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GenericTablePage from '@/components/generic/GenericTablePage';
import { fetchFeedbacks, deleteFeedback } from '@/app/data/feedback';
import { feedbackColumns } from '@/app/config/FeedbackTableConfig';
import PageHeader from '@/components/header/PageHeader';
import { MessageSquareText } from 'lucide-react';
import { toast } from 'sonner';

export default function FeedbackPage() {
  const router = useRouter();
  const [reloadKey, setReloadKey] = useState(0);

  /**
   * DELETE (SOFT DELETE)
   */
  const handleDelete = async (id: number) => {
    const confirmDelete = confirm(`Are you sure you want to delete feedback #${id}?`);
    if (!confirmDelete) return;

    try {
      const success = await deleteFeedback(id);

      if (success) {
        toast.success('Feedback deleted successfully');

        // refresh table
        setReloadKey((prev) => prev + 1);

        // optional: force router refresh
        router.refresh();
      } else {
        toast.error('Failed to delete feedback');
      }
    } catch (error) {
      console.error('DELETE ERROR:', error);
      toast.error('Failed to delete feedback');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        icon={<MessageSquareText className="w-5 h-5 text-[#c3195d]" />}
        subtitle="Feedback Management"
      >
        <span className="text-[#c3195d]">Feedback</span>
      </PageHeader>

      {/* TABLE */}
      <GenericTablePage
        key={reloadKey}
        fetchData={fetchFeedbacks}
        columns={feedbackColumns(handleDelete)}
        addRoute="/module/feedback/add"
        config={{
          addButtonLabel: 'Add Feedback',
          pageSize: 10,
          tableType: 'columnSearch',
        }}
      />
    </div>
  );
}
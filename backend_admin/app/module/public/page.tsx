'use client';

import GenericTablePage from '@/components/generic/GenericTablePage';
import {
  fetchPublic,
  deletePublicPrayer,
  updatePublicPrayer,
  PublicPrayer,
} from '@/app/data/public';
import { publicTableColumns } from '@/app/config/PublicTableConfig';
import { HeartHandshake, X, Save } from 'lucide-react';
import PageHeader from '@/components/header/PageHeader';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PublicPrayerPage() {
  const [reloadKey, setReloadKey] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<PublicPrayer | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPublicForTable = async (...args: any[]) => {
    const result: any = await fetchPublic(...args);

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

  const handleEdit = (row: PublicPrayer) => {
    setSelectedPrayer(row);
    setEditEmail(row.email || '');
    setEditMessage(row.message || '');
    setEditOpen(true);
  };

  const closeEditModal = () => {
    if (saving) return;

    setEditOpen(false);
    setSelectedPrayer(null);
    setEditEmail('');
    setEditMessage('');
  };

  const handleUpdate = async () => {
    if (!selectedPrayer) return;

    if (!editMessage.trim()) {
      toast.error('Prayer content is required.');
      return;
    }

    setSaving(true);

    try {
      const result = (await updatePublicPrayer(selectedPrayer.id, {
        message: editMessage.trim(),
        email: editEmail.trim() || null,
      })) as { success?: boolean; message?: string } | undefined;

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to update prayer.');
      }

      toast.success('Prayer updated successfully.');
      closeEditModal();
      setReloadKey((k) => k + 1);
    } catch (error) {
      console.error('Update prayer error:', error);
      toast.error('Failed to update prayer.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this prayer?')) return;

    try {
      const success = await deletePublicPrayer(id);

      if (success) {
        toast.success('Prayer deleted successfully.');
        setReloadKey((k) => k + 1);
      } else {
        toast.error('Failed to delete prayer.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete prayer.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<HeartHandshake className="w-5 h-5 text-[#c3195d]" />}
        subtitle="Community prayer management"
      >
        <span className="text-[#c3195d]">Public Prayer</span>
      </PageHeader>

      <GenericTablePage
        key={reloadKey}
        fetchDataCursor={fetchPublicForTable}
        columns={publicTableColumns(handleEdit, handleDelete)}
        addRoute="/module/public/add"
        config={{
          tableType: 'columnSearch',
          pageSize: 10,
          addButtonLabel: 'Add Prayer',
        }}
      />

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Edit Prayer
                </h2>
                <p className="text-sm text-gray-500">
                  Update community prayer details
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Prayer Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  placeholder="Enter prayer content"
                  rows={7}
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdate}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#c3195d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a8144f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
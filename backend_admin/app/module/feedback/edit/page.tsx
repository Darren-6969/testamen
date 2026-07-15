'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import { MessageSquareText, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { fetchFeedbackById, updateFeedback } from '@/app/data/feedback';

function EditFeedbackForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = Number(searchParams.get('id'));

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    (async () => {
      const feedback = await fetchFeedbackById(id);

      if (!feedback) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setName(feedback.name ?? '');
      setEmail(feedback.email ?? '');
      setMessage(feedback.message ?? '');
      setLoading(false);
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }

    if (!message.trim()) {
      toast.error('Message is required.');
      return;
    }

    setSaving(true);

    try {
      const result = await updateFeedback(id, {
        name: name.trim(),
        email: email.trim() || null,
        message: message.trim(),
      });

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to update feedback.');
      }

      toast.success('Feedback updated successfully.');
      router.push('/module/feedback');
      router.refresh();
    } catch (error) {
      console.error('Edit feedback error:', error);
      toast.error('Failed to update feedback.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<MessageSquareText className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Edit user feedback"
        >
          <span className="text-[#c3195d]">Edit Feedback</span>
        </PageHeader>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-sm text-gray-500">
          Loading feedback...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<MessageSquareText className="h-5 w-5 text-[#c3195d]" />}
          subtitle="Edit user feedback"
        >
          <span className="text-[#c3195d]">Edit Feedback</span>
        </PageHeader>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <p className="text-sm text-gray-500">Feedback not found.</p>
          <button
            type="button"
            onClick={() => router.push('/module/feedback')}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<MessageSquareText className="h-5 w-5 text-[#c3195d]" />}
        subtitle="Edit user feedback"
      >
        <span className="text-[#c3195d]">Edit Feedback</span>
      </PageHeader>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid grid-cols-1 gap-5">

            {/* NAME */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
              />
            </div>

            {/* MESSAGE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter feedback message"
                rows={6}
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/20"
              />
            </div>

          </div>

          {/* BUTTONS */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-5">

            <button
              type="button"
              onClick={() => router.push('/module/feedback')}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#c3195d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a8144f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Update Feedback'}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

export default function EditFeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <PageHeader
            icon={<MessageSquareText className="h-5 w-5 text-[#c3195d]" />}
            subtitle="Edit user feedback"
          >
            <span className="text-[#c3195d]">Edit Feedback</span>
          </PageHeader>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-sm text-gray-500">
            Loading feedback...
          </div>
        </div>
      }
    >
      <EditFeedbackForm />
    </Suspense>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Check, X, ListChecks, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';
import { fetchApprovals, setApproval, ApprovalItem } from '@/app/data/admin';

export default function ApprovalTab() {
  const { activeMemorial } = useActiveMemorial();
  const memorialId = activeMemorial?.numberList || '';
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!memorialId) return;
    let alive = true;
    setLoading(true);
    fetchApprovals(memorialId).then((rows) => {
      if (!alive) return;
      setItems(rows);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [memorialId]);

  const decide = async (id: string, decision: 'approved' | 'rejected') => {
    const prev = items;
    setItems((list) => list.filter((x) => x.id !== id)); // optimistic
    const res = await setApproval(id, decision);
    if (res.status === 'success') {
      toast.success(decision === 'approved' ? 'Approved' : 'Rejected');
    } else {
      setItems(prev);
      toast.error('Action failed');
    }
  };

  const photos = items.filter((i) => i.kind === 'photo');
  const videos = items.filter((i) => i.kind === 'video');

  const Section = ({
    title,
    icon,
    list,
  }: {
    title: string;
    icon: React.ReactNode;
    list: ApprovalItem[];
  }) => (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-base font-medium text-gray-700">
        {icon}
        {title}
        <span className="ml-1 rounded-full bg-pink-50 px-2 py-0.5 text-xs text-[#8e1444]">
          {list.length}
        </span>
      </div>
      {list.length === 0 ? (
        <div className="py-10 text-center text-sm text-neutral-400">Nothing to review.</div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {list.map((item) => (
            <div
              key={item.id}
              className="w-44 overflow-hidden rounded-xl border border-gray-100"
            >
              <div className="flex h-32 items-center justify-center bg-neutral-100 text-neutral-300">
                {item.kind === 'photo' ? (
                  <ImageIcon className="h-8 w-8" />
                ) : (
                  <VideoIcon className="h-8 w-8" />
                )}
              </div>
              <div className="px-3 py-2 text-xs text-neutral-500">
                By {item.uploadedBy || 'Unknown'}
              </div>
              <div className="flex gap-2 px-3 pb-3">
                <button
                  onClick={() => decide(item.id, 'approved')}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#c3195d] py-1.5 text-xs font-medium text-white hover:bg-[#a81450]"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  onClick={() => decide(item.id, 'rejected')}
                  className="flex items-center justify-center rounded-lg border border-gray-200 px-2 text-neutral-500 hover:bg-red-50 hover:text-red-500"
                  aria-label="Reject"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="py-16 text-center text-sm text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {items.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 py-10 text-sm text-neutral-400">
            <ListChecks className="h-5 w-5" />
            All caught up &mdash; nothing pending approval.
          </div>
        </div>
      )}
      {items.length > 0 && (
        <>
          <Section
            title="Photos to approve"
            icon={<ImageIcon className="h-5 w-5 text-[#c3195d]" />}
            list={photos}
          />
          <Section
            title="Videos to approve"
            icon={<VideoIcon className="h-5 w-5 text-[#c3195d]" />}
            list={videos}
          />
        </>
      )}
    </div>
  );
}
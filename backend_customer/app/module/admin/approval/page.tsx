'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  X,
  Eye,
  Play,
  ListChecks,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
} from 'lucide-react';
import { toast } from 'sonner';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';
import { fetchApprovals, setApproval, ApprovalItem, VideoItem } from '@/app/data/admin';
import { formatBytes, formatDate } from '@/app/lib/format';
import Lightbox from '@/components/admin/Lightbox';
import MediaPreview from '@/components/admin/MediaPreview';
import ConfirmDialog, { ConfirmData } from '@/components/admin/ConfirmDialog';

function FallbackIcon({ item }: { item: ApprovalItem }) {
  if (item.kind === 'photo') return <ImageIcon className="h-8 w-8" />;
  if (item.mediaType === 'audio') return <Music className="h-8 w-8" />;
  return <VideoIcon className="h-8 w-8" />;
}

function ApprovalCard({
  item,
  onPreview,
  onApprove,
  onReject,
}: {
  item: ApprovalItem;
  onPreview: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  // photos preview from their own url; videos/audios use the poster if one exists
  const thumb = item.kind === 'photo' ? item.url : item.poster;

  return (
    <div className="w-44 overflow-hidden rounded-xl border border-gray-100">
      <button
        onClick={onPreview}
        disabled={!item.url}
        aria-label="Preview"
        className="group relative flex h-32 w-full items-center justify-center overflow-hidden bg-neutral-100 disabled:cursor-default"
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
          />
        ) : (
          <span className="text-neutral-300">
            <FallbackIcon item={item} />
          </span>
        )}

        {item.url && (
          <span className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/30 group-hover:flex">
            {item.kind === 'photo' ? (
              <Eye className="h-5 w-5 text-white" />
            ) : (
              <Play className="h-6 w-6 text-white" />
            )}
          </span>
        )}

        {item.sizeBytes ? (
          <span className="pointer-events-none absolute bottom-1.5 left-1.5 hidden rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white group-hover:block">
            {formatBytes(item.sizeBytes)}
          </span>
        ) : null}
      </button>

      <div className="px-3 py-2">
        <p className="truncate text-xs font-medium text-neutral-600">
          By {item.uploadedBy || 'Unknown'}
        </p>
        {item.uploadedAt && (
          <p className="text-[11px] text-neutral-400">{formatDate(item.uploadedAt)}</p>
        )}
      </div>

      <div className="flex gap-2 px-3 pb-3">
        <button
          onClick={onApprove}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#c3195d] py-1.5 text-xs font-medium text-white hover:bg-[#a81450]"
        >
          <Check className="h-3.5 w-3.5" /> Approve
        </button>
        <button
          onClick={onReject}
          aria-label="Reject"
          className="flex items-center justify-center rounded-lg border border-gray-200 px-2 text-neutral-500 hover:bg-red-50 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  list,
  onPreview,
  onApprove,
  onReject,
}: {
  title: string;
  icon: React.ReactNode;
  list: ApprovalItem[];
  onPreview: (i: ApprovalItem) => void;
  onApprove: (i: ApprovalItem) => void;
  onReject: (i: ApprovalItem) => void;
}) {
  if (list.length === 0) return null; // hide the section entirely when nothing pending

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-base font-medium text-gray-700">
        {icon}
        {title}
        <span className="ml-1 rounded-full bg-pink-50 px-2 py-0.5 text-xs text-[#8e1444]">
          {list.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-4">
        {list.map((item) => (
          <ApprovalCard
            key={item.id}
            item={item}
            onPreview={() => onPreview(item)}
            onApprove={() => onApprove(item)}
            onReject={() => onReject(item)}
          />
        ))}
      </div>
    </div>
  );
}

export default function ApprovalTab() {
  const { activeMemorial } = useActiveMemorial();
  const memorialId = activeMemorial?.numberList || '';
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [preview, setPreview] = useState<VideoItem | null>(null);
  const [confirm, setConfirm] = useState<ConfirmData | null>(null);

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

  // photos open in the image lightbox; videos/audios open in the media player
  const openPreview = (item: ApprovalItem) => {
    if (!item.url) return;
    if (item.kind === 'photo') {
      setLightbox(item.url);
      return;
    }
    setPreview({
      id: item.id,
      url: item.url,
      poster: item.poster ?? null,
      mediaType: item.mediaType === 'audio' ? 'audio' : 'video',
    });
  };

  const askReject = (item: ApprovalItem) =>
    setConfirm({
      title: 'Reject this upload?',
      message:
        "It won't be published to the memorial and will be removed from the pending list.",
      confirmLabel: 'Reject',
      tone: 'danger',
      onConfirm: () => decide(item.id, 'rejected'),
    });

  const photos = items.filter((i) => i.kind === 'photo');
  const videos = items.filter((i) => i.kind === 'video');

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="py-16 text-center text-sm text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-neutral-400">
            <ListChecks className="h-5 w-5" />
            All caught up &mdash; nothing pending approval.
          </div>
        </div>
      ) : (
        <>
          <Section
            title="Photos to approve"
            icon={<ImageIcon className="h-5 w-5 text-[#c3195d]" />}
            list={photos}
            onPreview={openPreview}
            onApprove={(i) => decide(i.id, 'approved')}
            onReject={askReject}
          />
          <Section
            title="Videos & audios to approve"
            icon={<VideoIcon className="h-5 w-5 text-[#c3195d]" />}
            list={videos}
            onPreview={openPreview}
            onApprove={(i) => decide(i.id, 'approved')}
            onReject={askReject}
          />
        </>
      )}

      {/* ---------- Previews ---------- */}
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      <MediaPreview item={preview} onClose={() => setPreview(null)} />

      {/* ---------- Confirm reject ---------- */}
      <ConfirmDialog data={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
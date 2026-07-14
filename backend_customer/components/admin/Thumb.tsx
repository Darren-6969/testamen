'use client';

import { Trash2, Eye, Image as ImageIcon } from 'lucide-react';
import type { MediaItem } from '@/app/data/admin';
import { formatBytes } from '@/app/lib/format';

// Image thumbnail tile with hover: image scales, a dark overlay + Eye icon
// appear, and (optionally) a delete + extra-action row shows top-right.
// `deleteIcon`/`deleteLabel` let callers repurpose the delete slot (e.g. the
// album "remove from album" action uses FolderMinus).
export default function Thumb({
  item,
  onOpen,
  onDelete,
  deleteIcon,
  deleteLabel,
  extra,
  badge,
}: {
  item: MediaItem;
  onOpen: () => void;
  onDelete?: () => void;
  deleteIcon?: React.ReactNode;
  deleteLabel?: string;
  extra?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="group relative h-28 w-28 flex-none overflow-hidden rounded-xl bg-neutral-100">
      <button onClick={onOpen} className="block h-full w-full cursor-pointer" aria-label="Preview">
        {item.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt="" className="h-full w-full object-cover transition duration-200 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-300">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}
      </button>
      <span className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/25 group-hover:flex">
        <Eye className="h-5 w-5 text-white" />
      </span>
      {item.sizeBytes ? (
        <span className="pointer-events-none absolute bottom-1.5 left-1.5 hidden rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white group-hover:block">
          {formatBytes(item.sizeBytes)}
        </span>
      ) : null}
      {badge}
      <div className="absolute right-1.5 top-1.5 hidden gap-1 group-hover:flex">
        {extra}
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} aria-label={deleteLabel || 'Delete'} className="rounded-md bg-white/85 p-1 text-red-500">
            {deleteIcon || <Trash2 className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
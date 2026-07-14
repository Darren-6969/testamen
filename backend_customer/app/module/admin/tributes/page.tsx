'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, MessageSquareQuote } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveMemorial } from '@/app/context/ActiveMemorialContext';
import { fetchTributes, deleteTribute, Tribute } from '@/app/data/admin';

export default function TributesTab() {
  const { activeMemorial } = useActiveMemorial();
  const memorialId = activeMemorial?.numberList || '';
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!memorialId) return;
    let alive = true;
    setLoading(true);
    fetchTributes(memorialId).then((rows) => {
      if (!alive) return;
      setTributes(rows);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [memorialId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tributes;
    return tributes.filter(
      (t) => t.by.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }, [tributes, query]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this tribute?')) return;
    const prev = tributes;
    setTributes((list) => list.filter((t) => t.id !== id)); // optimistic
    const res = await deleteTribute(id);
    if (res.status === 'success') {
      toast.success('Tribute removed');
    } else {
      setTributes(prev);
      toast.error('Failed to remove tribute');
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-base font-medium text-gray-700">
          <MessageSquareQuote className="h-5 w-5 text-[#c3195d]" />
          Tributes
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tributes"
            className="h-9 w-56 rounded-lg border border-gray-200 pl-9 pr-3 text-sm focus:border-[#c3195d] focus:outline-none focus:ring-2 focus:ring-[#c3195d]/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-neutral-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-neutral-400">
          {tributes.length === 0 ? 'No tributes yet.' : 'No tributes match your search.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="w-12 py-2.5 pr-3 font-medium">No</th>
                <th className="py-2.5 pr-3 font-medium">Tribute by</th>
                <th className="py-2.5 pr-3 font-medium">Description</th>
                <th className="w-28 py-2.5 pr-3 font-medium">Date</th>
                <th className="w-20 py-2.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-neutral-50/60">
                  <td className="py-3 pr-3 text-neutral-400">{i + 1}</td>
                  <td className="py-3 pr-3 font-medium text-neutral-700">{t.by}</td>
                  <td className="py-3 pr-3 text-neutral-600">{t.description}</td>
                  <td className="py-3 pr-3 text-neutral-500">{t.date}</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDelete(t.id)}
                      aria-label="Delete tribute"
                      className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
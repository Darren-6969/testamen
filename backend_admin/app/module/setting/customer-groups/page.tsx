"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/header/PageHeader";
import { toast } from "sonner";
import { UsersRound, Eye, Plus, X } from "lucide-react";
import Link from "next/link";

import { fetchCustomerGroups, createCustomerGroup } from "@/app/data/setting";
import type { CustomerGroup } from "@/app/data/setting";

export default function CustomerGroupListPage() {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // add modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerGroups();
      setGroups(data);
    } catch (err: any) {
      console.error("Error loading customer groups:", err);
      toast.error(err?.message || "Failed to load customer groups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const openModal = () => {
    setName("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleCreate = async () => {
    const n = name.trim();
    if (!n) return toast.error("Group name is required.");

    setSaving(true);
    try {
      const ok = await createCustomerGroup({ name: n }); // ✅ no code
      if (!ok) {
        toast.error("Failed to create group.");
        return;
      }
      toast.success("Group created");
      setModalOpen(false);
      await loadGroups();
    } catch (err: any) {
      console.error("Create group error:", err);
      toast.error(err?.message || "Error creating group.");
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="space-y-6" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <PageHeader icon={<UsersRound className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">Customer Grouping</span>
      </PageHeader>

      <div
        className="
          max-w-5xl mx-auto rounded-2xl p-6 space-y-6 shadow-sm
          border bg-[var(--card-bg)] text-[var(--card-text)] border-[var(--border-color)]
        "
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">GROUPS</h2>
            <p className="text-xs text-[var(--muted)] mt-1">
              Click &quot;View&quot; to see customers inside the group.
            </p>
          </div>

          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#c3195d] text-white hover:bg-red-700"
          >
            <Plus className="w-3 h-3" />
            Add Group
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-[var(--muted)]">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="text-sm text-red-500">No groups found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-left">
                  <th className="py-2 px-3">Group Code</th>
                  <th className="py-2 px-3">Group Name</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id} className="border-b border-[var(--border-color)] hover:bg-black/5">
                    <td className="py-2 px-3 text-xs text-[var(--muted)]">{g.code || "-"}</td>
                    <td className="py-2 px-3 font-medium">{g.name}</td>
                    <td className="py-2 px-3 text-right">
                      <Link
                        href={`/module/setting/customer-groups/${g.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#c3195d] text-white hover:bg-red-700"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Group Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            onClick={closeModal}
            className="absolute inset-0 bg-black/40"
            aria-label="Close modal"
          />

          <div className="relative w-[92vw] max-w-xl rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--card-text)] shadow-lg p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold tracking-[0.08em] text-gray-800 uppercase">
                  Create New Group
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">Enter group code and name.</p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="p-2 rounded-lg hover:bg-black/10 disabled:opacity-60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4">
              <label className="text-xs text-[var(--muted)]">Group Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--border-color)] bg-transparent px-3 py-2 text-sm outline-none focus:border-red-400"
                placeholder="e.g. VIP Customers"
              />
            </div>


            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-color)] hover:bg-black/10 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

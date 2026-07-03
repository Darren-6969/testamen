"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/components/header/PageHeader";
import { toast } from "sonner";
import { UsersRound, ArrowLeft, Plus, Trash2, X, Search } from "lucide-react";
import Link from "next/link";

import {
  fetchCustomerGroups,
  fetchCustomersByGroup,
  fetchAvailableCustomers,
  addCustomerToGroup,
  removeCustomerFromGroup,
  updateCustomerGroup,
} from "@/app/data/setting";
import type { CustomerGroup, CustomerLite } from "@/app/data/setting";

export default function CustomerGroupViewPage() {
  const params = useParams();
  const groupIdRaw = params?.groupId;
  const groupId = Number(Array.isArray(groupIdRaw) ? groupIdRaw[0] : groupIdRaw);

  const [group, setGroup] = useState<CustomerGroup | null>(null);
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);


  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CustomerLite[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);

  const saveGroupName = async () => {
    if (!groupId || !group) return;

    const name = groupNameDraft.trim();
    if (!name) {
      toast.error("Group name cannot be empty.");
      return;
    }

    setSavingGroup(true);
    try {
      const ok = await updateCustomerGroup(groupId, { name });
      if (!ok) {
        toast.error("Failed to update group name.");
        return;
      }

      toast.success("Group name updated");
      setEditingName(false);
      await load();
    } catch (err: any) {
      console.error("Update group error:", err);
      toast.error(err?.message || "Error updating group.");
    } finally {
      setSavingGroup(false);
    }
  };


  const load = async () => {
    if (!groupId || Number.isNaN(groupId)) return;

    setLoading(true);
    try {
      const allGroups = await fetchCustomerGroups();
      setGroup(allGroups.find((x) => x.id === groupId) || null);

      const g = allGroups.find((x) => x.id === groupId) || null;
      setGroup(g);
      setGroupNameDraft(g?.name || "");


      const list = await fetchCustomersByGroup(groupId);
      setCustomers(list);
    } catch (err: any) {
      console.error("Error loading group/customers:", err);
      toast.error(err?.message || "Failed to load group customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const title = useMemo(() => {
    if (!group) return "View Group Customers";
    return `Group: ${group.name}`;
  }, [group]);

  const openModal = async () => {
    setModalOpen(true);
    setQ("");
    setResults([]);
  };

  const closeModal = () => {
    if (savingId) return;
    setModalOpen(false);
    setQ("");
    setResults([]);
  };

  const doSearch = async () => {
    setSearching(true);
    try {
      const list = await fetchAvailableCustomers(q.trim());
      setResults(list);
    } catch (err: any) {
      console.error("Search customers error:", err);
      toast.error(err?.message || "Failed to search customers.");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (customerId: number) => {
    if (!groupId) return;
    setSavingId(customerId);
    try {
      const ok = await addCustomerToGroup(groupId, customerId);
      if (!ok) {
        toast.error("Failed to add customer.");
        return;
      }
      toast.success("Customer added to group");
      await load();
      await doSearch(); // refresh search list
    } catch (err: any) {
      console.error("Add customer error:", err);
      toast.error(err?.message || "Error adding customer.");
    } finally {
      setSavingId(null);
    }
  };

  const handleRemove = async (customerId: number) => {
    if (!groupId) return;
    if (!confirm("Remove this customer from the group?")) return;

    setSavingId(customerId);
    try {
      const ok = await removeCustomerFromGroup(groupId, customerId);
      if (!ok) {
        toast.error("Failed to remove customer.");
        return;
      }
      toast.success("Customer removed from group");
      await load();
    } catch (err: any) {
      console.error("Remove customer error:", err);
      toast.error(err?.message || "Error removing customer.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <PageHeader icon={<UsersRound className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">{title}</span>
      </PageHeader>

      <div
        className="
          max-w-5xl mx-auto rounded-2xl p-6 space-y-6 shadow-sm
          border bg-[var(--card-bg)] text-[var(--card-text)] border-[var(--border-color)]
        "
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            {/* <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
              {group?.name || "GROUP"}
            </h2> */}
            <div className="flex items-center gap-2">
              {editingName ? (
                <>
                  <input
                    value={groupNameDraft}
                    onChange={(e) => setGroupNameDraft(e.target.value)}
                    className="rounded-lg border border-[var(--border-color)] bg-transparent px-3 py-1 text-sm outline-none focus:border-red-400"
                    placeholder="Group name"
                    disabled={savingGroup}
                  />

                  <button
                    type="button"
                    onClick={saveGroupName}
                    disabled={savingGroup}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#c3195d] text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {savingGroup ? "Saving..." : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(false);
                      setGroupNameDraft(group?.name || "");
                    }}
                    disabled={savingGroup}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-color)] hover:bg-black/10 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
                    {group?.name || "GROUP"}
                  </h2>

                  <button
                    type="button"
                    onClick={() => setEditingName(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-color)] hover:bg-black/10"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>

            <p className="text-xs text-[var(--muted)] mt-1">
              {group?.code ? `Group Code: ${group.code}` : "Customers assigned to this group."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#c3195d] text-white hover:bg-red-700"
            >
              <Plus className="w-3 h-3" />
              Add Customer
            </button>

            <Link
              href="/module/setting/customer-groups"
              className="
                inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                border border-[var(--border-color)] text-[var(--text)]
                hover:bg-black/10
              "
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-[var(--muted)]">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="text-sm text-red-500">No customers in this group.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-left">
                  <th className="py-2 px-3">Customer Code</th>
                  <th className="py-2 px-3">Customer Name</th>
                  <th className="py-2 px-3">Contact No</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--border-color)] hover:bg-black/5">
                    <td className="py-2 px-3 font-medium">{c.customer_code || "-"}</td>
                    <td className="py-2 px-3">{c.name || "-"}</td>
                    <td className="py-2 px-3 text-xs text-[var(--muted)]">{c.contact_no || "-"}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(c.id)}
                        disabled={savingId === c.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-white hover:bg-zinc-900 disabled:opacity-60"
                      >
                        <Trash2 className="w-3 h-3" />
                        {savingId === c.id ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ Add Customer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            onClick={closeModal}
            className="absolute inset-0 bg-black/40"
            aria-label="Close modal"
          />

          <div className="relative w-[92vw] max-w-3xl rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--card-text)] shadow-lg p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold tracking-[0.08em] text-gray-800 uppercase">
                  Add Customer to Group
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Search by code, name, or contact no.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={!!savingId}
                className="p-2 rounded-lg hover:bg-black/10 disabled:opacity-60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch()}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-transparent pl-9 pr-3 py-2 text-sm outline-none focus:border-red-400"
                  placeholder="Search customer..."
                />
              </div>

              <button
                type="button"
                onClick={doSearch}
                disabled={searching}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#c3195d] text-white hover:bg-red-700 disabled:opacity-60"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </div>

            <div className="mt-4 overflow-x-auto max-h-[50vh]">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-left">
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Contact</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td className="py-3 px-3 text-xs text-[var(--muted)]" colSpan={4}>
                        {searching ? "Searching..." : "No results. Try searching."}
                      </td>
                    </tr>
                  ) : (
                    results.map((r) => {
                      const alreadyInGroup = r.customer_group_id === groupId;
                      return (
                        <tr key={r.id} className="border-b border-[var(--border-color)] hover:bg-black/5">
                          <td className="py-2 px-3 font-medium">{r.customer_code || "-"}</td>
                          <td className="py-2 px-3">{r.name || "-"}</td>
                          <td className="py-2 px-3 text-xs text-[var(--muted)]">{r.contact_no || "-"}</td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleAdd(r.id)}
                              disabled={alreadyInGroup || savingId === r.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                            >
                              <Plus className="w-3 h-3" />
                              {alreadyInGroup ? "Already Added" : savingId === r.id ? "Adding..." : "Add"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={!!savingId}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-color)] hover:bg-black/10 disabled:opacity-60"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

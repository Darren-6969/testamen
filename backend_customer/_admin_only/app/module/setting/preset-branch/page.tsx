// app/module/setting/preset-branch/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/header/PageHeader";
import { toast } from "sonner";
import { GitBranch, Pencil, X } from "lucide-react";

import { fetchBranches, updateBranch, fetchPackages, createBranch, fetchBranchPackages } from "@/app/data/setting";
import type { Branch, Package } from "@/app/data/setting";

type EditState = {
  open: boolean;
  mode: "create" | "edit";
  branch: Branch | null;
  branch_name: string;
  status: string;
  package_ids: number[];
};



export default function PresetBranchPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [edit, setEdit] = useState<EditState>({
    open: false,
    mode: "edit",
    branch: null,
    branch_name: "",
    status: "Active",
    package_ids: [],
  });



  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [pkgQuery, setPkgQuery] = useState("");

  const loadBranches = async () => {
    setLoading(true);
    try {
      const data = await fetchBranches();
      setBranches(data);
    } catch (err: any) {
      console.error("Error loading branches:", err);
      toast.error(err?.message || "Failed to load branches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
    (async () => {
      try {
        const list = await fetchPackages();
        setPackages(list);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load packages.");
      }
    })();
  }, []);

  const openCreate = () => {
    setPkgQuery("");
    setEdit({
      open: true,
      mode: "create",
      branch: null,
      branch_name: "",
      status: "Active",
      package_ids: [],
    });
  };


  const openEdit = async (b: Branch) => {
    setPkgQuery("");
    setEdit({
      open: true,
      mode: "edit",
      branch: b,
      branch_name: b.branch_name ?? "",
      status: b.status ?? "Active",
      package_ids: [],
    });

    try {
      const selected = await fetchBranchPackages(b.id);
      setEdit((prev) => ({ ...prev, package_ids: selected.map((p) => p.id) }));
    } catch (e: any) {
      toast.error(e?.message || "Failed to load selected packages.");
    }
  };


  const closeEdit = () => {
    if (saving) return;
    setEdit({
      open: false,
      mode: "edit",
      branch: null,
      branch_name: "",
      status: "Active",
      package_ids: [],
    });
    setPkgQuery(""); 
  };


  const canSave = useMemo(() => {
    if (!edit.branch_name.trim()) return false;

    // ✅ create mode doesn't need edit.branch
    if (edit.mode === "create") return true;

    // ✅ edit mode must have an existing branch
    return !!edit.branch;
  }, [edit.mode, edit.branch, edit.branch_name]);


  const selectedPackages = useMemo(() => {
    const map = new Map(packages.map((p) => [p.id, p]));
    return edit.package_ids.map((id) => map.get(id)).filter(Boolean) as Package[];
  }, [packages, edit.package_ids]);

  const filteredPackages = useMemo(() => {
    const q = pkgQuery.trim().toLowerCase();
    if (!q) return packages;

    return packages.filter((p) => {
      const name = (p.package_name || "").toLowerCase();
      const code = (p.package_code || "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [packages, pkgQuery]);

  const availableToAdd = useMemo(() => {
    const selectedSet = new Set(edit.package_ids);
    return filteredPackages.filter((p) => !selectedSet.has(p.id));
  }, [filteredPackages, edit.package_ids]);

  const addPackage = (id: number) => {
    setEdit((prev) => {
      if (prev.package_ids.includes(id)) return prev;
      return { ...prev, package_ids: [...prev.package_ids, id] };
    });
  };

  const removePackage = (id: number) => {
    setEdit((prev) => ({
      ...prev,
      package_ids: prev.package_ids.filter((x) => x !== id),
    }));
  };


  const handleSave = async () => {
    if (!edit.branch_name.trim()) {
      toast.error("Branch name is required.");
      return;
    }

    setSaving(true);
    try {
      let ok = false;

      if (edit.mode === "create") {
        ok = await createBranch({
          branch_name: edit.branch_name.trim(),
          status: edit.status,
          package_ids: edit.package_ids,
        });
      } else {
        if (!edit.branch) return;
        ok = await updateBranch(edit.branch.id, {
          branch_name: edit.branch_name.trim(),
          status: edit.status,
          package_ids: edit.package_ids,
        } as any);
      }

      if (ok) {
        toast.success(edit.mode === "create" ? "Location created successfully" : "Location updated successfully");
        closeEdit();
        await loadBranches();
      } else {
        toast.error(edit.mode === "create" ? "Failed to create location." : "Failed to update location.");
      }
    } catch (err: any) {
      console.error("handleSave error:", err);
      toast.error(err?.message || "Error saving location.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="space-y-6"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <PageHeader icon={<GitBranch className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">Location Management</span>
      </PageHeader>

      <div
        className="
          max-w-5xl mx-auto rounded-2xl p-6 space-y-6 shadow-sm
          border
          bg-[var(--card-bg)]
          text-[var(--card-text)]
          border-[var(--border-color)]
        "
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-m font-semibold tracking-[0.08em] text-gray-800 uppercase">
              LOCATIONS
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Click &quot;Edit&quot; to update. Use &quot;Add Location&quot; to create a new location.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="
              inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              bg-[#c3195d] text-white hover:bg-red-700
            "
          >
            + Add Location
          </button>
        </div>


        {loading ? (
          <div className="text-sm text-[var(--muted)]">Loading location...</div>
        ) : branches.length === 0 ? (
          <div className="text-sm text-red-500">No location found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-left">
                  <th className="py-2 px-3">Location Name</th>
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-[var(--border-color)] hover:bg-black/5"
                  >
                    <td className="py-2 px-3 font-medium">{b.branch_name}</td>
                    <td className="py-2 px-3 text-xs text-[var(--muted)]">
                      {b.branch_code || "-"}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`
                          inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                          ${
                            (b.status || "").toLowerCase() === "active"
                              ? "bg-green-600/10 text-green-500"
                              : "bg-zinc-600/10 text-zinc-400"
                          }
                        `}
                      >
                        {b.status || "Unknown"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(b)}
                        className="
                          inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                          bg-[#c3195d] text-white hover:bg-red-700
                        "
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ Modal */}
      {edit.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <button
            type="button"
            onClick={closeEdit}
            className="absolute inset-0 bg-black/40"
            aria-label="Close modal"
          />

          {/* Modal Card */}
          <div
            className="
              relative w-[92vw] max-w-2xl rounded-2xl border border-[var(--border-color)]
              bg-[var(--card-bg)] text-[var(--card-text)] shadow-lg p-5
            "
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold tracking-[0.08em] text-gray-800 uppercase">
                  {edit.mode === "create" ? "Add Location" : "Edit Location"}
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {edit.mode === "create"
                    ? "Create a new location and assign packages."
                    : "Update location details and assigned packages."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="p-2 rounded-lg hover:bg-black/10 disabled:opacity-60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-[var(--muted)]">Location Name</label>
                <input
                  value={edit.branch_name}
                  onChange={(e) =>
                    setEdit((prev) => ({ ...prev, branch_name: e.target.value }))
                  }
                  className="
                    w-full rounded-xl border border-[var(--border-color)]
                    bg-transparent px-3 py-2 text-sm outline-none
                    focus:border-red-400
                  "
                  placeholder="Enter location name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[var(--muted)]">Status</label>
                <select
                  value={edit.status}
                  onChange={(e) =>
                    setEdit((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="
                    w-full rounded-xl border border-[var(--border-color)]
                    bg-transparent px-3 py-2 text-sm outline-none
                    focus:border-red-400
                  "
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)]">Packages</label>

                {/* Selected list */}
                <div
                  className="
                    rounded-xl border border-[var(--border-color)]
                    p-2 bg-black/5
                    min-h-[52px]
                  "
                >
                  {selectedPackages.length === 0 ? (
                    <div className="text-xs text-[var(--muted)] px-1 py-2">
                      No packages selected.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedPackages.map((p) => (
                        <span
                          key={p.id}
                          className="
                            inline-flex items-center gap-2
                            rounded-full border border-[var(--border-color)]
                            bg-white/60 px-3 py-1 text-xs
                          "
                        >
                          <span className="font-medium">{p.package_code}</span>
                          <span className="text-[var(--muted)]">{p.package_name}</span>

                          <button
                            type="button"
                            onClick={() => removePackage(p.id)}
                            className="ml-1 rounded-full p-1 hover:bg-black/10"
                            aria-label="Remove package"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search */}
                <input
                  value={pkgQuery}
                  onChange={(e) => setPkgQuery(e.target.value)}
                  placeholder="Search package by code or name..."
                  className="
                    w-full rounded-xl border border-[var(--border-color)]
                    bg-transparent px-3 py-2 text-sm outline-none
                    focus:border-red-400
                  "
                />

                {/* Search results to add */}
                <div
                  className="
                    rounded-xl border border-[var(--border-color)]
                    overflow-hidden
                  "
                >
                  <div className="max-h-[180px] overflow-auto">
                    {availableToAdd.length === 0 ? (
                      <div className="text-xs text-[var(--muted)] p-3">
                        {pkgQuery.trim() ? "No matching packages to add." : "All packages already selected."}
                      </div>
                    ) : (
                      <ul className="divide-y divide-[var(--border-color)]">
                        {availableToAdd.slice(0, 50).map((p) => (
                          <li key={p.id} className="flex items-center justify-between p-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {p.package_code} — {p.package_name}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => addPackage(p.id)}
                              className="
                                ml-3 shrink-0
                                rounded-lg px-3 py-1.5 text-xs font-medium
                                bg-[#c3195d] text-white hover:bg-red-700
                              "
                            >
                              Add
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-[var(--muted)]">
                  Search a package, click <b>Add</b>. Remove from selected list using the X icon.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                disabled={saving}
                className="
                  px-4 py-2 rounded-lg text-sm font-medium
                  border border-[var(--border-color)]
                  hover:bg-black/10
                  disabled:opacity-60
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave || saving}
                className="
                  px-4 py-2 rounded-lg text-sm font-medium
                  bg-[#c3195d] text-white hover:bg-red-700
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

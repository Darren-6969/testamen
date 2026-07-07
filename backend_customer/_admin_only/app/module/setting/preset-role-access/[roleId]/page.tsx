// app/module/setting/roles/[roleId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/header/PageHeader';
import {
  fetchRoles,
  fetchRoleModuleAccess,
  updateRoleModuleAccess,
  Role,
  RoleModuleAccess,
} from '@/app/data/setting';
import { toast } from 'sonner';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type PermissionKey =
  | 'view_access'
  | 'create_access'
  | 'update_access'
  | 'delete_access';

export default function RoleAccessPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = Number(params?.roleId);

  const [role, setRole] = useState<Role | null>(null);
  const [modules, setModules] = useState<RoleModuleAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!roleId || Number.isNaN(roleId)) return;

    const loadData = async () => {
      try {
        // Fetch all roles first to get the role info
        const allRoles = await fetchRoles();
        const found = allRoles.find((r) => r.id === roleId) || null;
        setRole(found);

        // Fetch module access for this role
        const accessList = await fetchRoleModuleAccess(roleId);
        setModules(accessList);
      } catch (err) {
        console.error('Error loading role/module access:', err);
        toast.error('Failed to load role access.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [roleId]);

  const togglePermission = (moduleId: number, key: PermissionKey) => {
    setModules((prev) =>
      prev.map((m) =>
        m.module_id === moduleId
          ? { ...m, [key]: !m[key] }
          : m
      )
    );
  };

  const handleSave = async () => {
    if (!roleId) return;

    setSaving(true);
    console.log('[RoleAccess] SAVE START', { roleId, modules });

    try {
      const success = await updateRoleModuleAccess(roleId, modules);

      console.log('[RoleAccess] SAVE RESULT', success);

      if (success) {
        toast.success('Role access updated successfully');
        router.push('/module/setting/preset-role-access');
      } else {
        toast.error('Failed to update role access.');
      }
    } catch (err) {
      console.error('[RoleAccess] SAVE ERROR', err);
      toast.error('Error updating role access.');
    } finally {
      console.log('[RoleAccess] SAVE END');
      setSaving(false);
    }
  };

  const title = role ? `Edit Access: ${role.role_name}` : 'Edit Role Access';
  const title2 = role?.role_name ?? '';
  return (
    <div
      className="space-y-6"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <PageHeader icon={<ShieldCheck className="w-6 h-6 text-[#c3195d]" />}>
        <span className="text-[#c3195d]">{title}</span>
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
              {title2}
            </h2>
            {role && (
              <p className="text-xs text-[var(--muted)] mt-1">
                Status: {role.status || 'Unknown'} | ID: {role.id}
              </p>
            )}
          </div>

          <Link
            href="/module/setting/preset-role-access"
            className="
              inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
              border border-[var(--border-color)]
              text-[var(--text)]
              hover:bg-black/10
            "
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </Link>
        </div>

        {loading ? (
          <div className="text-sm text-[var(--muted)]">Loading access...</div>
        ) : modules.length === 0 ? (
          <div className="text-sm text-red-500">
            No modules found for this role.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-[var(--muted)] mb-2">
              Tick the permissions this role should have for each module.
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-left">
                    <th className="py-2 px-3">Module</th>
                    <th className="py-2 px-3 text-center">View</th>
                    <th className="py-2 px-3 text-center">Add</th>
                    <th className="py-2 px-3 text-center">Edit</th>
                    <th className="py-2 px-3 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((mod) => (
                    <tr
                      key={mod.module_id}
                      className="border-b border-[var(--border-color)] hover:bg-black/10"
                    >
                      <td className="py-2 px-3">
                        <span className="font-medium">
                          {mod.module_name}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={mod.view_access}
                          onChange={() =>
                            togglePermission(mod.module_id, 'view_access')
                          }
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={mod.create_access}
                          onChange={() =>
                            togglePermission(mod.module_id, 'create_access')
                          }
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={mod.update_access}
                          onChange={() =>
                            togglePermission(mod.module_id, 'update_access')
                          }
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={mod.delete_access}
                          onChange={() =>
                            togglePermission(mod.module_id, 'delete_access')
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="
              inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
              bg-[#c3195d] text-white hover:bg-red-700
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {saving ? 'Saving...' : 'Save Access'}
          </button>
        </div>
      </div>
    </div>
  );
}

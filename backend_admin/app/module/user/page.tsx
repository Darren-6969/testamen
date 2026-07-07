'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Users,
  KeyRound,
  Plus,
  Save,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/header/PageHeader';
import {
  addRole,
  deleteRole,
  fetchRolePermissions,
  fetchUserManagementData,
  ModuleItem,
  Role,
  RolePermission,
  updateAdminRoles,
  updateRole,
  updateRolePermissions,
  AdminAccount,
} from '@/app/data/userManagement';
import {
  adminTableColumns,
  permissionTableColumns,
  roleTableColumns,
} from '@/app/config/userMgtTableConfig';

type TabKey = 'roles' | 'permissions';

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('roles');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [roles, setRoles] = useState<Role[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);

  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [permissions, setPermissions] = useState<Record<number, RolePermission>>(
    {}
  );

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const loadData = async () => {
    setLoading(true);

    try {
      const data = await fetchUserManagementData();

      setRoles(data.roles);
      setAdmins(data.admins);
      setModules(data.modules);

      if (!selectedRoleId && data.roles.length > 0) {
        setSelectedRoleId(data.roles[0].id);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load user management data.');
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async (roleId: number) => {
    if (!roleId) return;

    const rows = await fetchRolePermissions(roleId);
    const mapped: Record<number, RolePermission> = {};

    rows.forEach((item) => {
      mapped[item.module_id] = {
        module_id: item.module_id,
        can_view: Number(item.can_view),
        can_edit: Number(item.can_edit),
      };
    });

    setPermissions(mapped);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRoleId > 0) {
      loadPermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      toast.error('Role name cannot be empty.');
      return;
    }

    setSaving(true);

    try {
      const result = await addRole({
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || null,
      });

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to add role.');
      }

      toast.success(result.message || 'Role added successfully.');
      setNewRoleName('');
      setNewRoleDesc('');
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add role.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (role: Role) => {
    if (!role.name.trim()) {
      toast.error('Role name cannot be empty.');
      return;
    }

    setSaving(true);

    try {
      const result = await updateRole(role.id, {
        name: role.name.trim(),
        description: role.description || null,
      });

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to update role.');
      }

      toast.success(result.message || 'Role updated successfully.');
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update role.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (roleId === 1) {
      toast.error('You cannot delete the Super Admin role.');
      return;
    }

    if (!confirm('Delete this role?')) return;

    setSaving(true);

    try {
      const result = await deleteRole(roleId);

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to delete role.');
      }

      toast.success(result.message || 'Role deleted successfully.');
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete role.');
    } finally {
      setSaving(false);
    }
  };

  const updateLocalRole = (
    roleId: number,
    field: 'name' | 'description',
    value: string
  ) => {
    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId
          ? {
              ...role,
              [field]: value,
            }
          : role
      )
    );
  };

  const updateLocalAdmin = (
    adminId: number,
    field: 'role_id' | 'status',
    value: number | 'ACTIVE' | 'INACTIVE'
  ) => {
    setAdmins((prev) =>
      prev.map((admin) =>
        admin.id === adminId
          ? {
              ...admin,
              [field]: value,
            }
          : admin
      )
    );
  };

  const handleSaveAdminRoles = async () => {
    setSaving(true);

    try {
      const payload: {
        id: number;
        role_id: number;
        status: 'ACTIVE' | 'INACTIVE';
      }[] = admins
        .filter((admin) => admin.role_id)
        .map((admin) => ({
          id: admin.id,
          role_id: Number(admin.role_id),
          status: admin.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        }));

      const result = await updateAdminRoles(payload);

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to update admin roles.');
      }

      toast.success(result.message || 'Admin roles/status updated.');
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update admin roles.');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (
    moduleId: number,
    field: 'can_view' | 'can_edit',
    checked: boolean
  ) => {
    setPermissions((prev) => {
      const existing = prev[moduleId] || {
        module_id: moduleId,
        can_view: 0,
        can_edit: 0,
      };

      return {
        ...prev,
        [moduleId]: {
          ...existing,
          [field]: checked ? 1 : 0,
        },
      };
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) {
      toast.error('Please select a role.');
      return;
    }

    setSaving(true);

    try {
      const payload = modules.map((moduleItem) => {
        const item = permissions[moduleItem.id];

        return {
          module_id: moduleItem.id,
          can_view: item?.can_view ? 1 : 0,
          can_edit: item?.can_edit ? 1 : 0,
        };
      });

      const result = await updateRolePermissions(selectedRoleId, payload);

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to save permissions.');
      }

      toast.success(result.message || 'Permissions updated.');
      await loadPermissions(selectedRoleId);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save permissions.');
    } finally {
      setSaving(false);
    }
  };

  const roleColumns = roleTableColumns(
    roles,
    saving,
    updateLocalRole,
    handleUpdateRole,
    handleDeleteRole
  );

  const adminColumns = adminTableColumns(roles, updateLocalAdmin);

  const permissionColumns = permissionTableColumns(
    permissions,
    togglePermission
  );

  const renderTable = <T extends { id: number }>(
    columns: any[],
    rows: T[],
    emptyText: string
  ) => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-[#fbe2db] text-left text-xs font-bold uppercase text-gray-700">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-5 py-3"
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-3">
                    {column.render
                      ? column.render(row, index)
                      : (row as any)[column.key] || '-'}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-8 text-center text-gray-500"
              >
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ShieldCheck className="h-5 w-5 text-[#c3195d]" />}
        subtitle="Manage roles, administrators and module access permissions"
      >
        <span className="text-[#c3195d]">User Management</span>
      </PageHeader>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
            activeTab === 'roles'
              ? 'bg-[#c3195d] text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="h-4 w-4" />
          Roles & Admin Management
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
            activeTab === 'permissions'
              ? 'bg-[#c3195d] text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          Roles & Module Access
        </button>

        <button
          type="button"
          onClick={loadData}
          className="ml-auto inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
          Loading user management data...
        </div>
      ) : activeTab === 'roles' ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">
                1. Roles Add / Edit
              </h2>
              <p className="text-sm text-gray-500">
                Create, update and remove system roles.
              </p>
            </div>

            {renderTable(roleColumns, roles, 'No roles found.')}

            <div className="grid grid-cols-1 gap-3 border-t border-gray-100 bg-cyan-50 px-6 py-4 md:grid-cols-[220px_1fr_auto]">
              <input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="New role name"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/10"
              />

              <input
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder="Description"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/10"
              />

              <button
                type="button"
                onClick={handleAddRole}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                Add Role
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">
                2. Assign Roles & Status to Admin Accounts
              </h2>
              <p className="text-sm text-gray-500">
                Control administrator role and active status.
              </p>
            </div>

            {renderTable(adminColumns, admins, 'No admin accounts found.')}

            <div className="flex justify-end border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={handleSaveAdminRoles}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#c3195d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#a8144f] disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                Save Admin Roles & Status
              </button>
            </div>
          </section>
        </div>
      ) : (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Roles & Module Access
              </h2>
              <p className="text-sm text-gray-500">
                Configure view/edit access for each module.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-700">
                Select Role
              </label>

              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                className="min-w-[260px] rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/10"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.id} - {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedRole ? (
            <>
              {renderTable(
                permissionColumns,
                modules,
                'No modules found.'
              )}

              <div className="flex justify-end border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#c3195d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#a8144f] disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  Save Permissions
                </button>
              </div>
            </>
          ) : (
            <div className="px-6 py-8 text-sm text-gray-500">
              No role selected.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
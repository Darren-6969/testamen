import { Save, Trash } from 'lucide-react';
import {
  AdminAccount,
  ModuleItem,
  Role,
  RolePermission,
} from '@/app/data/userManagement';

export const roleTableColumns = (
  roles: Role[],
  saving: boolean,
  updateLocalRole: (
    roleId: number,
    field: 'name' | 'description',
    value: string
  ) => void,
  handleUpdateRole: (role: Role) => void,
  handleDeleteRole: (roleId: number) => void
) => [
  {
    key: 'id',
    label: 'ID',
    width: '80px',
    render: (role: Role, index: number) => index + 1,
  },
  {
    key: 'name',
    label: 'NAME',
    width: '260px',
    render: (role: Role) => (
      <input
        value={role.name || ''}
        onChange={(e) => updateLocalRole(role.id, 'name', e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/10"
      />
    ),
  },
  {
    key: 'description',
    label: 'DESCRIPTION',
    render: (role: Role) => (
      <input
        value={role.description || ''}
        onChange={(e) =>
          updateLocalRole(role.id, 'description', e.target.value)
        }
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/10"
      />
    ),
  },
  {
    key: 'action',
    label: 'ACTION',
    width: '180px',
    render: (role: Role) => (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleUpdateRole(role)}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-lg bg-[#c3195d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#a8144f] disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>

        {role.id !== 1 && (
          <button
            type="button"
            onClick={() => handleDeleteRole(role.id)}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            <Trash className="h-3.5 w-3.5" />
            Delete
          </button>
        )}
      </div>
    ),
  },
];

export const adminTableColumns = (
  roles: Role[],
  updateLocalAdmin: (
    adminId: number,
    field: 'role_id' | 'status',
    value: number | 'ACTIVE' | 'INACTIVE'
  ) => void
) => [
  {
    key: 'id',
    label: 'ID',
    width: '80px',
    render: (admin: AdminAccount) => admin.id,
  },
  {
    key: 'email',
    label: 'EMAIL',
    render: (admin: AdminAccount) => admin.email || '-',
  },
  {
    key: 'role_id',
    label: 'ROLE',
    width: '240px',
    render: (admin: AdminAccount) => (
      <select
        value={admin.role_id || ''}
        onChange={(e) =>
          updateLocalAdmin(admin.id, 'role_id', Number(e.target.value))
        }
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/10"
      >
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
    ),
  },
  {
    key: 'status',
    label: 'STATUS',
    width: '180px',
    render: (admin: AdminAccount) => (
      <select
        value={admin.status}
        onChange={(e) =>
          updateLocalAdmin(
            admin.id,
            'status',
            e.target.value as 'ACTIVE' | 'INACTIVE'
          )
        }
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c3195d] focus:ring-2 focus:ring-[#c3195d]/10"
      >
        <option value="ACTIVE">ACTIVE</option>
        <option value="INACTIVE">INACTIVE</option>
      </select>
    ),
  },
];

export const permissionTableColumns = (
  permissions: Record<number, RolePermission>,
  togglePermission: (
    moduleId: number,
    field: 'can_view' | 'can_edit',
    checked: boolean
  ) => void
) => [
  {
    key: 'id',
    label: 'ID',
    width: '80px',
    render: (moduleItem: ModuleItem) => moduleItem.id,
  },
  {
    key: 'name',
    label: 'MODULE',
    width: '240px',
    render: (moduleItem: ModuleItem) => (
      <span className="font-medium text-gray-800">{moduleItem.name}</span>
    ),
  },
  {
    key: 'slug',
    label: 'SLUG',
    render: (moduleItem: ModuleItem) => (
      <span className="text-gray-500">{moduleItem.slug}</span>
    ),
  },
  {
    key: 'can_view',
    label: 'CAN VIEW',
    width: '120px',
    render: (moduleItem: ModuleItem) => {
      const permission = permissions[moduleItem.id] || {
        module_id: moduleItem.id,
        can_view: 0,
        can_edit: 0,
      };

      return (
        <div className="text-center">
          <input
            type="checkbox"
            checked={Boolean(permission.can_view)}
            onChange={(e) =>
              togglePermission(moduleItem.id, 'can_view', e.target.checked)
            }
            className="h-4 w-4 accent-[#c3195d]"
          />
        </div>
      );
    },
  },
  {
    key: 'can_edit',
    label: 'CAN EDIT',
    width: '120px',
    render: (moduleItem: ModuleItem) => {
      const permission = permissions[moduleItem.id] || {
        module_id: moduleItem.id,
        can_view: 0,
        can_edit: 0,
      };

      return (
        <div className="text-center">
          <input
            type="checkbox"
            checked={Boolean(permission.can_edit)}
            onChange={(e) =>
              togglePermission(moduleItem.id, 'can_edit', e.target.checked)
            }
            className="h-4 w-4 accent-[#c3195d]"
          />
        </div>
      );
    },
  },
];
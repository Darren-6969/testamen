import axios from 'axios';

export interface Role {
  id: number;
  name: string;
  description: string | null;
}

export interface AdminAccount {
  id: number;
  email: string;
  role_id: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  role_name?: string | null;
}

export interface ModuleItem {
  id: number;
  name: string;
  slug: string;
}

export interface RolePermission {
  module_id: number;
  can_view: number;
  can_edit: number;
}

interface RolePermissionsResponse {
  data?: RolePermission[];
}

export interface UserManagementData {
  roles: Role[];
  admins: AdminAccount[];
  modules: ModuleItem[];
}

interface UserManagementResponse {
  data?: UserManagementData;
}

export const fetchUserManagementData = async (): Promise<UserManagementData> => {
  try {
    const res = await axios.get<UserManagementResponse>('/api/user-management', {
      withCredentials: true,
    });

    return {
      roles: res.data?.data?.roles || [],
      admins: res.data?.data?.admins || [],
      modules: res.data?.data?.modules || [],
    };
  } catch (error) {
    console.error('fetchUserManagementData error:', error);

    return {
      roles: [],
      admins: [],
      modules: [],
    };
  }
};

export const addRole = async (data: {
  name: string;
  description?: string | null;
}) => {
  try {
    const res = await axios.post('/api/user-management/roles', data, {
      withCredentials: true,
    });

    return res.data;
  } catch (error: any) {
    console.error('addRole error:', error);
    return error?.response?.data || null;
  }
};

export const updateRole = async (
  id: number,
  data: {
    name: string;
    description?: string | null;
  }
) => {
  try {
    const res = await axios.put(`/api/user-management/roles/${id}`, data, {
      withCredentials: true,
    });

    return res.data;
  } catch (error: any) {
    console.error('updateRole error:', error);
    return error?.response?.data || null;
  }
};

export const deleteRole = async (id: number) => {
  try {
    const res = await axios.delete(`/api/user-management/roles/${id}`, {
      withCredentials: true,
    });

    return res.data;
  } catch (error: any) {
    console.error('deleteRole error:', error);
    return error?.response?.data || null;
  }
};

export const updateAdminRoles = async (
  admins: {
    id: number;
    role_id: number;
    status: 'ACTIVE' | 'INACTIVE';
  }[]
) => {
  try {
    const res = await axios.put(
      '/api/user-management/admin-roles',
      { admins },
      {
        withCredentials: true,
      }
    );

    return res.data;
  } catch (error: any) {
    console.error('updateAdminRoles error:', error);
    return error?.response?.data || null;
  }
};

export const fetchRolePermissions = async (
  roleId: number
): Promise<RolePermission[]> => {
  try {
    const res = await axios.get<RolePermissionsResponse>(
      `/api/user-management/roles/${roleId}/permissions`,
      {
        withCredentials: true,
      }
    );

    return res.data?.data || [];
  } catch (error) {
    console.error('fetchRolePermissions error:', error);
    return [];
  }
};

export const updateRolePermissions = async (
  roleId: number,
  permissions: {
    module_id: number;
    can_view: number;
    can_edit: number;
  }[]
) => {
  try {
    const res = await axios.put(
      `/api/user-management/roles/${roleId}/permissions`,
      { permissions },
      {
        withCredentials: true,
      }
    );

    return res.data;
  } catch (error: any) {
    console.error('updateRolePermissions error:', error);
    return error?.response?.data || null;
  }
};

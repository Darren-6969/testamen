// app/data/setting.ts
import axios from 'axios';
import { Staff, mockStaffs } from '@/app/data/staffs';

type ApiResponse<T = any> = {
  ok?: boolean | 0 | 1 | "true" | "false";
  message?: string;
  data?: T;
};



const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Get the current user's profile (Staff) from backend.
 * Backend uses verifyToken → req.user to know who you are.
 */
export async function fetchMyProfile(): Promise<Staff | null> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE → just return first mock user
  if (prod !== 'TRUE') {
    return mockStaffs[0] ?? null;
  }

  try {
    const res = await axios.get<Staff>(`/api/setting/profile`, {
      withCredentials: true,
    });

    if (res.status !== 200) return null;
    return res.data;
  } catch (err) {
    console.error('Error fetching my profile:', err);
    return null;
  }
}

/**
 * Update the current user's profile (Staff).
 * Backend figures out which user to update via verifyToken.
 */
export async function updateMyProfile(
  userData: Partial<Staff>
): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE → update first mock entry
  if (prod !== 'TRUE') {
    if (mockStaffs[0]) {
      Object.assign(mockStaffs[0], userData);
      return true;
    }
    return false;
  }

  try {
    const res = await axios.put(`/api/setting/profile`, userData, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    return res.status === 200;
  } catch (err) {
    console.error('Error updating my profile:', err);
    return false;
  }
}
// ========= Change Password =========
export interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface PasswordChangeResult {
  success: boolean;
  message?: string;
}

export async function updateMyPassword(
  data: PasswordChangePayload
): Promise<PasswordChangeResult> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE → just pretend it worked
  if (prod !== 'TRUE') {
    console.log('[updateMyPassword] MOCK MODE', data);
    return { success: true, message: 'Mock password updated' };
  }

  try {
    const res = await axios.put(
      `/api/setting/password`,
      data,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    return {
      success: res.status === 200,
      message: (res.data as any)?.message,
    };
  } catch (err: any) {
    console.error('Error updating my password:', err);

    const message =
      err?.response?.data?.message ||
      err?.message ||
      'Failed to update password';

    return { success: false, message };
  }
}

// ========= Roles & Module Access =========
export interface Role {
  id: number;
  role_name: string;
  description?: string | null;
  status?: string | null;
}

export interface RoleModuleAccess {
  module_id: number;
  module_name: string;
  view_access: boolean;
  create_access: boolean;
  update_access: boolean;
  delete_access: boolean;
}


/**
 * Get list of all roles.
 * Expected backend: GET /setting/roles
 */
export async function fetchRoles(): Promise<Role[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE
  if (prod !== 'TRUE') {
    return [
      { id: 1, role_name: 'Admin', description: 'Full access', status: 'Active' },
      { id: 2, role_name: 'Staff', description: 'Limited access', status: 'Active' },
      { id: 3, role_name: 'Viewer', description: 'Read-only', status: 'Inactive' },
    ];
  }

  try {
    const res = await axios.get<Role[]>(`/api/setting/roles`, {
      withCredentials: true,
    });
    return res.data ?? [];
  } catch (err) {
    console.error('Error fetching roles:', err);
    return [];
  }
}

/**
 * Get modules + access flags for a specific role.
 * Expected backend: GET /setting/roles/:roleId/modules
 */
export async function fetchRoleModuleAccess(
  roleId: number
): Promise<RoleModuleAccess[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE
  if (prod !== 'TRUE') {
    return [
      {
        module_id: 1,
        module_name: 'Dashboard',
        view_access: true,
        create_access: false,
        update_access: false,
        delete_access: false,
      },
      {
        module_id: 2,
        module_name: 'Users',
        view_access: true,
        create_access: true,
        update_access: true,
        delete_access: false,
      },
    ];
  }

  try {
    const res = await axios.get<RoleModuleAccess[]>(
      `/api/setting/roles/${roleId}/modules`,
      { withCredentials: true }
    );
    return res.data ?? [];
  } catch (err) {
    console.error('Error fetching role module access:', err);
    return [];
  }
}


/**
 * Update which modules a role can access.
 * Expected backend: PUT /setting/roles/:roleId/modules
 * Body: { modules: RoleModuleAccess[] }
 */
export async function updateRoleModuleAccess(
  roleId: number,
  modules: RoleModuleAccess[]
): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod !== 'TRUE') {
    console.log('[updateRoleModuleAccess] MOCK MODE', { roleId, modules });
    return true;
  }

  try {
    const res = await axios.put(
      `/api/setting/roles/${roleId}/modules`,
      { modules },
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return res.status === 200;
  } catch (err) {
    console.error('Error updating role module access:', err);
    return false;
  }
}

// ========= Branches =========
export interface Branch {
  id: number;
  branch_name: string;
  branch_code?: string | null;
  status?: string | null;
}


export interface Package {
  id: number;
  package_code: string;
  package_name: string;
  remarks?: string | null;
  monthly_fee?: number | string | null;
  type_internet?: string | null;
}


export async function fetchBranches(): Promise<Branch[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod !== "TRUE") {
    return [
      { id: 1, branch_name: "HQ Kuching", branch_code: "HQ", status: "Active" },
      { id: 2, branch_name: "Sibu Branch", branch_code: "SIB", status: "Active" },
      { id: 3, branch_name: "Bintulu Branch", branch_code: "BTU", status: "Inactive" },
    ];
  }

  try {
    const res = await axios.get(`/api/branches/mobile`, {
      withCredentials: true,
    });

    const payload: any = res.data;

    // ✅ backend style: { ok, message, data }
    if (payload && typeof payload === "object" && "ok" in payload) {
      if (!payload.ok) {
        throw new Error(payload.message || "Failed to load branches");
      }
      return (payload.data ?? []) as Branch[];
    }

    // ✅ fallback: backend returns pure array
    return (Array.isArray(payload) ? payload : []) as Branch[];
  } catch (err: any) {
    console.error("Error fetching branches:", err);
    // Let UI decide how to toast; returning [] is ok but hides error.
    throw err;
  }
}

// ✅ NEW: fetch all packages
export async function fetchPackages(): Promise<Package[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod !== "TRUE") {
    return [
      { id: 1, package_code: "PCK0001", package_name: "Connect+ Satellite Package Premium" },
      { id: 2, package_code: "PCK0002", package_name: "FiberLink Enterprise Package" },
    ];
  }

  const res = await axios.get(`/api/packages/mobile`, { withCredentials: true });
  console.log("fetchPackages response:", res);
  const payload: any = res.data;

  if (payload?.ok === false) throw new Error(payload.message || "Failed to load packages");
  return (payload?.data ?? []) as Package[];
}

// ✅ NEW: fetch selected packages by branch
export async function fetchBranchPackages(branchId: number): Promise<Package[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod !== "TRUE") return [];

  const res = await axios.get(`/api/branches/mobile/${branchId}/packages`, {
    withCredentials: true,
  });

  const payload: any = res.data;
  if (payload?.ok === false) throw new Error(payload.message || "Failed to load branch packages");

  return (payload?.data ?? []) as Package[];
}


export interface BranchUpdatePayload {
  branch_name: string;
  status: string; // "Active" | "Inactive"
  package_ids: number[]; // ✅ NEW
}

/**
 * Update a branch (name + status).
 * Backend: PUT /branches/mobile/:branchId
 */
export async function updateBranch(
  branchId: number,
  data: BranchUpdatePayload
): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE → update mock array in memory
  if (prod !== "TRUE") {
    console.log("[updateBranch] MOCK MODE", { branchId, data });
    return true;
  }

  try {
    const res = await axios.put(
      `/api/branches/mobile/${branchId}`,
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );

    const payload: any = res.data;
    if (payload && typeof payload === "object" && "ok" in payload) {
      return !!payload.ok;
    }

    return res.status === 200;
  } catch (err) {
    console.error("Error updating branch:", err);
    return false;
  }
}

// ========= Customer Groups =========
export interface CustomerGroup {
  id: number;
  code: string;
  name: string;
  created_at?: string | null;
}

export interface CustomerLite {
  id: number;
  customer_code?: string | null;
  name?: string | null;
  contact_no?: string | null;
  customer_group_id?: number | null;
}

export async function fetchCustomerGroups(): Promise<CustomerGroup[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod !== "TRUE") {
    return [
      { id: 4, code: "GRP001", name: "GROUP ABC", created_at: new Date().toISOString() },
      { id: 5, code: "GRP002", name: "NOR AMINA", created_at: new Date().toISOString() },
    ];
  }

  const res = await axios.get(`/api/customers/mobile/groups`, {
    withCredentials: true,
  });

  const payload: any = res.data;
  if (payload?.ok === false) throw new Error(payload.message || "Failed to load groups");
  return (payload?.data ?? []) as CustomerGroup[];
}

export async function fetchCustomersByGroup(groupId: number): Promise<CustomerLite[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod !== "TRUE") {
    return [
      { id: 101, customer_code: "C0001", name: "Ali Ahmad", contact_no: "012-3456789", customer_group_id: groupId },
    ];
  }

  const res = await axios.get(`/api/customers/mobile/groups/${groupId}/customers`, {
    withCredentials: true,
  });

  const payload: any = res.data;
  if (payload?.ok === false) throw new Error(payload.message || "Failed to load customers");
  return (payload?.data ?? []) as CustomerLite[];
}

export async function fetchAvailableCustomers(q?: string): Promise<CustomerLite[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod !== "TRUE") {
    return [
      { id: 101, customer_code: "C0001", name: "Ali Ahmad", contact_no: "012-3456789", customer_group_id: null },
      { id: 102, customer_code: "C0002", name: "Siti Aminah", contact_no: "013-2223333", customer_group_id: 4 },
    ];
  }

  try {
    const res = await axios.get(`/api/customers/mobile/available-customers`, {
      withCredentials: true,
      params: q ? { q } : undefined,
    });

    const payload: any = res.data;
    if (payload?.ok === false) throw new Error(payload.message || "Failed to load customers");

    return (payload?.data ?? []) as CustomerLite[];
  } catch (err) {
    console.error("Error fetching available customers:", err);
    throw err;
  }
}



export async function addCustomerToGroup(groupId: number, customerId: number): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if (prod !== "TRUE") return true;

  try {
    const res = await axios.post<ApiResponse>(
      `/api/customers/mobile/groups/${groupId}/customers`,
      { customerId },
      { withCredentials: true, validateStatus: () => true }
    );

    if (res.status >= 200 && res.status < 300) {
      // ok true OR undefined -> treat success
      return res.data?.ok !== false && res.data?.ok !== 0 && res.data?.ok !== "false";
    }

    console.error("[addCustomerToGroup] bad status:", res.status, res.data);
    return false;
  } catch (err: any) {
    console.error("Error adding customer to group:", err?.response?.status, err?.response?.data || err?.message);
    return false;
  }
}

export async function removeCustomerFromGroup(groupId: number, customerId: number): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if (prod !== "TRUE") return true;

  try {
    const res = await axios.delete<ApiResponse>(
      `/api/customers/mobile/groups/${groupId}/customers/${customerId}`,
      { withCredentials: true, validateStatus: () => true }
    );

    if (res.status >= 200 && res.status < 300) {
      return res.data?.ok !== false && res.data?.ok !== 0 && res.data?.ok !== "false";
    }

    console.error("[removeCustomerFromGroup] bad status:", res.status, res.data);
    return false;
  } catch (err: any) {
    console.error("Error removing customer from group:", err?.response?.status, err?.response?.data || err?.message);
    return false;
  }
}

export async function updateCustomerGroup(
  groupId: number,
  data: { name?: string; code?: string }
): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if (prod !== "TRUE") return true;

  try {
    const res = await axios.put<ApiResponse>(
      `/api/customers/mobile/groups/${groupId}`,
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true, // ✅ prevent axios throw, we decide success/fail
      }
    );

    // ✅ treat any 2xx as success unless backend explicitly says ok=false/0/"false"
    if (res.status >= 200 && res.status < 300) {
      const ok = res.data?.ok;
      return ok !== false && ok !== 0 && ok !== "false";
    }

    console.error("[updateCustomerGroup] bad status:", res.status, res.data);
    return false;
  } catch (err: any) {
    console.error("Error updating group:", err?.response?.status, err?.response?.data || err?.message);
    return false;
  }
}

export async function createCustomerGroup(data: { name: string }): Promise<boolean>
{
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if (prod !== "TRUE") return true;

  try {
    const res = await axios.post<ApiResponse>(
      `/api/customers/mobile/groups`,
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true, // ✅ prevent axios throw
      }
    );

    if (res.status >= 200 && res.status < 300) {
      const ok = res.data?.ok;
      return ok !== false && ok !== 0 && ok !== "false";
    }

    console.error("[createCustomerGroup] bad status:", res.status, res.data);
    return false;
  } catch (err: any) {
    console.error("Error creating group:", err?.response?.status, err?.response?.data || err?.message);
    return false;
  }
}

export interface BranchCreatePayload {
  branch_name: string;
  branch_code?: string | null;
  status: string; // "Active" | "Inactive"
  package_ids?: number[];
}

export async function createBranch(data: BranchCreatePayload): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE
  if (prod !== "TRUE") {
    console.log("[createBranch] MOCK MODE", data);
    return true;
  }

  try {
    const res = await axios.post(
      `/api/branches/mobile`,
      data,
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );

    const payload: any = res.data;
    if (payload && typeof payload === "object" && "ok" in payload) {
      return !!payload.ok;
    }

    return res.status === 200 || res.status === 201;
  } catch (err) {
    console.error("Error creating branch:", err);
    return false;
  }
}

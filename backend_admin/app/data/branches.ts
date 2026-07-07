import axios from "axios";

export type BranchItem = {
  id: number;
  branch_name: string;
  branch_code: string;
  status: "Active" | "Inactive" | string;
};

export async function fetchBranches(token?: string): Promise<BranchItem[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await axios.get(`/api/branches/mobile`, {
      headers,
      withCredentials: !token,
    });

    const payload: any = res.data;
    if (payload && typeof payload === "object" && "data" in payload) {
      return (payload.data ?? []) as BranchItem[];
    }
    return (Array.isArray(payload) ? payload : []) as BranchItem[];
  } catch (error) {
    console.error("Failed to fetch branches:", error);
    return [];
  }
}

export async function getBranchesCustomers(_id?: string) {
  const res = await axios.get(`/api/branches/customerCount`, {
    withCredentials: true,
  });
  return res.data;
}

export async function getCustomerCount(token?: string) {
  try {
    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    
    const res = await axios.get(`/api/branches/customerCount`, {
      headers,
      withCredentials: true,
    });
    
    return res.data ?? [];
  } catch (error) {
    console.error('Failed to fetch customer count:', error);
    return [];
  }
}

// export async function fetchBranches(token?: string) {
//   const headers: any = {};
//   if (token) headers.Authorization = `Bearer ${token}`;

//   const res = await axios.get(`/api/branches`, { headers });
//   return res.data;
// }



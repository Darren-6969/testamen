import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export type DbPackage = {
  id: number;
  package_name: string;
  monthly_fee: number | string;
};

type PackageListResponse = {
  ok?: boolean;
  data?: DbPackage[];
};


export async function fetchPackagesByBranch(
  branchId: number | string,
  token?: string
): Promise<DbPackage[]> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await axios.get<PackageListResponse>(
    `/api/branches/mobile/${branchId}/packages`,
    {
      headers,
    }
  );

  // should return: { ok: true, data: [...] }
  const data = res.data.data;

  return Array.isArray(data) ? (data as DbPackage[]) : [];
}

// export async function fetchPackagesByBranch(branchId: string | number, token?: string) {
//   const headers: any = {};
//   if (token) headers.Authorization = `Bearer ${token}`;

//   const res = await axios.get(`/api/branch-packages/${branchId}`, { headers });
//   return res.data;
// }


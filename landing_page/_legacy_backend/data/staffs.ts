import axios from 'axios';

export interface Staff {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  status: 'Active' | 'Inactive';
}
export const mockStaffs: Staff[] = [
];

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Replace with an async fetcher
export async function fetchStaffs(): Promise<Staff[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if(prod ==="TRUE"){

    // !!! FIREBIRD JSON HERE
    try {
      const response = await axios.post<Staff[]>(
        `/api/staffs`,
        {
          fields: [
            'users.id',
            'name',
            'email',
            'user_role.role_name AS role',
            'acc_status AS status'
          ]
        },
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching staffs:', error);
      return [];
    }
  }else{
    return mockStaffs;
  }
}

export async function fetchStaffsCursor(
  cursor: string | null = null,
  search: Record<string, string> = {}
): Promise<{ data: Staff[]; nextCursor: string | null }> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if (prod === "TRUE") {
    try {
      const params = new URLSearchParams({ limit: '10' });
      if (cursor) params.append('cursor', cursor);
      if (search.name) params.append('name', search.name);
      if (search.email) params.append('email', search.email);
      if (search.role) params.append('role', search.role);
      if (search.status) params.append('status', search.status);

      const res = await axios.get<{ data: Staff[]; pagination: { hasMore: boolean; nextCursor: string | null } }>(
        `/api/staffs/list?${params}`,
        { withCredentials: true }
      );
      return { data: res.data.data, nextCursor: res.data.pagination.nextCursor };
    } catch (error) {
      console.error('Error fetching staffs cursor:', error);
      return { data: [], nextCursor: null };
    }
  }

  return { data: mockStaffs, nextCursor: null };
}

export async function fetchStaffById(id: number): Promise<Staff | null> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === "TRUE") {
    try {
      const response = await axios.get<Staff>(
        `/api/staffs/${id}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching staff by ID:', error);
      return null;
    }
  } else {
    // Return from mock data if in mock mode
    return mockStaffs.find((s) => s.id === id) || null;
  }
}


export async function updateStaff(id: number, userData: Partial<Staff>): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === "TRUE") {
    try {
      const res = await axios.put(`/api/staffs/${id}`, userData, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      return res.status === 200;
    } catch (error: any) {
      console.error('❌ Error updating staff:', error.response?.data || error.message);
      return false;
    }
  } else {
    // Mock update in local data (for mock mode)
    const index = mockStaffs.findIndex((s) => s.id === id);
    if (index >= 0) {
      mockStaffs[index] = { ...mockStaffs[index], ...userData };
      return true;
    }
    return false;
  }
}

export async function addStaff(userData: Partial<Staff>): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === "TRUE") {
    try {
      const res = await axios.post(`/api/staffs/add`, userData, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      return res.status === 200 || res.status === 201; // 201 = created
    } catch (error: any) {
      console.error("❌ Error adding staff:", error.response?.data || error.message);
      return false;
    }
  } else {
    // Mock add (for mock mode)
    const newId = mockStaffs.length ? Math.max(...mockStaffs.map((s) => s.id)) + 1 : 1;
    mockStaffs.push({ id: newId, ...userData } as Staff);
    return true;
  }
}

export async function fetchStaffOptions(): Promise<
  { label: string; value: number }[]
> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === "TRUE") {
    try {
      const response = await axios.post<{ id: number; name: string }[]>(
        `/api/staffs/`,
        {
          fields: ["users.id AS id", "name"],
        },
        { withCredentials: true }
      );

      return response.data.map((s) => ({
        label: s.name,
        value: s.id,
      }));
    } catch (error) {
      console.error("Error fetching staff options:", error);
      return [];
    }
  }

  // MOCK MODE
  return mockStaffs.map((s) => ({
    label: s.name,
    value: s.id,
  }));
}

export async function fetchTechnicianList(): Promise<{ id: number; name: string }[]> {
  try {
    const response = await axios.post<{ id: number; name: string }[]>(
      `/api/staffs/technician/list`,
      {
        fields: ["users.id AS id", "name"],
        filters: { role: 'Technician' }
      },
      { withCredentials: true }
    );
    return response.data.map((s) => ({
      id: s.id,
      name: s.name,
    }));
  } catch (error) {
    console.error("Error fetching technician list:", error);
    return [];
  }
}
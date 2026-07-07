// app/data/customers.ts
import axios from "axios";

export interface Customer {
  id: number;
  username: string;
  name: string;
  email: string;
  contact_no?: string;
  application_type?: string;
  company_address?: string;
  company_city?: string;
  company_postcode?: string;
  registration_num?: string;
  company_fax?: string;

  admin_title?: string;
  admin_name?: string;
  admin_address?: string;
  admin_city?: string;
  admin_postcode?: string;
  admin_email?: string;
  admin_contact?: string;
  admin_fax?: string;

  package_id?: string;
  package_name?: string;
  service_length?: string;

  signatory_name?: string;
  signatory_designation?: string;
  signatory_icnum?: string;

  form_d_a?: string | null;
  form_d_b?: string | null;
  form_9_49?: string | null;
  form_13_49?: string | null;
  form_79_80_83?: string | null;
  file_latestbill?: string | null;
  file_other?: string | null;

  status: "Active" | "Inactive" | "Pending" | "Barred";
}

export const mockCustomers: Customer[] = [];

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// =====================
// Customer CRUD
// =====================
export async function fetchCustomers(): Promise<Customer[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === "TRUE") {
    // FIREBIRD JSON HERE
    try {
      const response = await axios.post<Customer[]>(
        `/api/customers`,
        {
          fields: [
            "users.id",
            "name",
            "email",
            "customer.contact_no",
            "customer.admin_name",
            "package.package_name",
            "acc_status AS status",
          ],
        },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }

    // try {
    //   const params = new URLSearchParams({ limit: '10' });
    //   if (cursor) params.append('cursor', cursor);
    //   if (search.name) params.append('name', search.name);
    //   if (search.email) params.append('email', search.email);
    //   if (search.contact_no) params.append('contact_no', search.contact_no);
    //   if (search.admin_name) params.append('admin_name', search.admin_name);
    //   if (search.package_name) params.append('package_name', search.package_name);
    //   if (search.status) params.append('status', search.status);
    //   const res = await axios.get<{ data: Customer[]; pagination: { hasMore: boolean; nextCursor: string | null } }>(
    //     `/api/sql/customers?${params}`,
    //     { withCredentials: true }
    //   );
    //   return { data: res.data.data, nextCursor: res.data.pagination.nextCursor };
    // } catch (error) {
    //   console.error("Error fetching customers:", error);
    //   return { data: [], nextCursor: null };
    // }
  }

  // return { data: mockCustomers, nextCursor: null };
  return mockCustomers;
}

export async function fetchCustomersCursor(
  cursor: string | null = null,
  search: Record<string, string> = {}
): Promise<{ data: Customer[]; nextCursor: string | null }> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === "TRUE") {
    try {
      const params = new URLSearchParams({ limit: '10' });
      if (cursor) params.append('cursor', cursor);
      if (search.name) params.append('name', search.name);
      if (search.email) params.append('email', search.email);
      if (search.contact_no) params.append('contact_no', search.contact_no);
      if (search.admin_name) params.append('admin_name', search.admin_name);
      if (search.package_name) params.append('package_name', search.package_name);
      if (search.status) params.append('status', search.status);

      const res = await axios.get<{ data: Customer[]; pagination: { hasMore: boolean; nextCursor: string | null } }>(
        `/api/customers/list?${params}`,
        { withCredentials: true }
      );
      return { data: res.data.data, nextCursor: res.data.pagination.nextCursor };
    } catch (error) {
      console.error("Error fetching customers cursor:", error);
      return { data: [], nextCursor: null };
    }
  }

  return { data: mockCustomers, nextCursor: null };
}

export async function fetchCustomerById(id: number): Promise<Customer | null> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === "TRUE") {
    try {
      const response = await axios.get<Customer>(`/api/customers/${id}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching customer by ID:", error);
      return null;
    }
  }

  return mockCustomers.find((s) => s.id === id) || null;
}

export async function updateCustomer(
  id: number,
  userData: Partial<Customer>,
  files?: Record<string, File | null>
): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  const formData = new FormData();

  // ✅ Ensure important fields exist
  if (!userData.username) {
    console.warn("⚠️ Missing username, appending fallback");
    formData.append("username", userData.email || "USER123");
  }

  // ✅ Append text fields
  Object.entries(userData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  // ✅ Append files
  if (files) {
    Object.entries(files).forEach(([field, file]) => {
      if (file) formData.append(field, file);
    });
  }

  if (prod === "TRUE") {
    try {
      const res = await axios.put(`/api/customers/${id}`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.status === 200;
    } catch (error: any) {
      console.error(
        "❌ Error updating customer:",
        error.response?.data || error.message
      );
      return false;
    }
  }

  // Mock mode
  const index = mockCustomers.findIndex((s) => s.id === id);
  if (index >= 0) {
    mockCustomers[index] = { ...mockCustomers[index], ...userData };
    return true;
  }
  return false;
}

export async function addCustomer(
  customerData: Record<string, any>
): Promise<{ success: boolean; message?: string }> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === "TRUE") {
    try {
      const formData = new FormData();

      Object.entries(customerData).forEach(([key, value]) => {
        if (value instanceof File) formData.append(key, value);
        else if (value !== undefined && value !== null)
          formData.append(key, value.toString());
      });

      const res = await axios.post(`/api/customers/add`, formData, {
        withCredentials: true,
        // ✅ IMPORTANT: don't set multipart content-type manually (axios will set boundary)
        // headers: { "Content-Type": "multipart/form-data" },
      });

      return { success: res.status === 200 || res.status === 201 };
    } catch (error: any) {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create customer";

      console.error("❌ Error adding customer:", status, message);

      return { success: false, message };
    }
  }

  // Mock mode
  return { success: true };
}


// export async function addCustomer(
//   customerData: Record<string, any>
// ): Promise<boolean> {
//   const prod = process.env.NEXT_PUBLIC_API_ENABLED;

//   if (prod === "TRUE") {
//     try {
//       const formData = new FormData();

//       Object.entries(customerData).forEach(([key, value]) => {
//         if (value instanceof File) formData.append(key, value);
//         else if (value !== undefined && value !== null)
//           formData.append(key, value.toString());
//       });

//       const res = await axios.post(`/api/customers/add`, formData, {
//         withCredentials: true,
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       return res.status === 200 || res.status === 201;
//     } catch (error: any) {
//       console.error("❌ Error adding customer:", error.response?.data || error.message);
//       return false;
//     }
//   }

//   // Mock mode
//   const newId = mockCustomers.length
//     ? Math.max(...mockCustomers.map((c) => c.id)) + 1
//     : 1;
//   mockCustomers.push({ id: newId, ...customerData } as Customer);
//   return true;
// }

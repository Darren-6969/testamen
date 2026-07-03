import axios from 'axios';

export interface Activation {
  id: number;
  code: string;
  customer: string;
  package: string;
  installation: string;
  install_date: string;
  install_time: string;
  staff: string;
  device_id: string;
  device_model: string;
  device_serial: string;
  remark: string;
  status: string;
  image_1: string;
  image_2: string;
  image_3: string;
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchActivations(
  cursor: string | null = null,
  _search: Record<string, string> = {}
): Promise<{ data: Activation[]; nextCursor: string | null }> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if (prod === "TRUE") {
    try {
      const params = new URLSearchParams({ limit: '10' });
      if (cursor) params.append('cursor', cursor);
      const res = await axios.get<{ data: Activation[]; pagination: { hasMore: boolean; nextCursor: string | null } }>(
        `/api/activations/list?${params}`,
        { withCredentials: true }
      );
      return { data: res.data.data, nextCursor: res.data.pagination.nextCursor };
    } catch (error) {
      console.error('❌ Error fetching activations:', error);
      return { data: [], nextCursor: null };
    }
  } else {
    return { data: [], nextCursor: null };
  }
}

export async function fetchActivationById(id: number): Promise<Activation | null> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if (prod === "TRUE") {
    try {
      const response = await axios.get<Activation>(`/api/activations/${id}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching activation by ID:', error);
      return null;
    }
  } else {
    return null;
  }
}

export async function addActivation(
  data: FormData | Record<string, any>,
  isFormData = false
): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === "TRUE") {
    try {
      const config = {
        withCredentials: true,
        headers: isFormData
          ? { "Content-Type": "multipart/form-data" }
          : { "Content-Type": "application/json" },
      };

      const response = await axios.post(
        `/api/activations/add`,
        data,
        config
      );

      return response.status === 201 || response.status === 200;
    } catch (error) {
      console.error("❌ Error adding activation:", error);
      return false;
    }
  } else {
    console.log("🧪 API disabled — addActivation() skipped.");
    return true;
  }
}

export async function updateActivation(id: number, data: FormData | Record<string, any>, isFormData = false): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if (prod === "TRUE") {
    try {
      const config = {
        withCredentials: true,
        headers: isFormData
          ? {}                                    // ✅ LET AXIOS SET THE RIGHT HEADERS
          : { "Content-Type": "application/json" },
      };


      const response = await axios.put(
        `/api/activations/${id}`,
        data,
        config
      );

      return response.status === 200;
    } catch (error) {
      console.error('❌ Error updating activation:', error);
      return false;
    }
  } else {
    console.log('🧪 API disabled — updateActivation() skipped.');
    return true;
  }
}

export async function deleteActivation(id: number): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === 'TRUE') {
    try {
      const response = await axios.delete(`/api/activations/${id}`, {
        withCredentials: true,
      });

      return response.status === 200;
    } catch (error) {
      console.error('❌ Error deleting activation:', error);
      return false;
    }
  } else {
    console.log('🧪 API disabled — deleteActivation() skipped for id:', id);
    return true;
  }
}

import axios, { AxiosResponse } from 'axios';

export interface PublicPrayer {
  id: number;
  message: string;
  email: string | null;
  created_date: string | null;
}

// Helper interface for API envelopes if your backend wraps data in a { data: ... } object
interface ApiResponseEnvelope<T> {
  data?: T;
}

export const fetchPublic = async (
  cursor: string | null = null,
  search: Record<string, string> = {}
): Promise<{
  data: PublicPrayer[];
  nextCursor: string | null;
}> => {
  try {
    // Cast the axios get response so TypeScript knows what structure to expect
    const res = await axios.get<ApiResponseEnvelope<PublicPrayer[]> | PublicPrayer[]>('/api/public', {
      withCredentials: true,
      params: {
        cursor,
        ...search,
      },
    });

    // Explicitly type rows as PublicPrayer[]
    const rows: PublicPrayer[] = Array.isArray(res.data)
      ? res.data
      : (res.data && 'data' in res.data && Array.isArray(res.data.data))
        ? res.data.data
        : [];

    return {
      data: rows,
      nextCursor: null, // Update this logic later if your API returns a next cursor
    };
  } catch (error: any) {
    console.error('fetchPublic error:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    return {
      data: [],
      nextCursor: null,
    };
  }
};

export const fetchPublicById = async (
  id: number
): Promise<PublicPrayer | null> => {
  try {
    const res = await axios.get<ApiResponseEnvelope<PublicPrayer> | PublicPrayer>(`/api/public/${id}`, {
      withCredentials: true,
    });

    // Properly extract the data with type safety
    if (!res.data) return null;
    
    if ('data' in res.data && res.data.data) {
      return res.data.data;
    }
    
    return res.data as PublicPrayer;
  } catch (error) {
    console.error('fetchPublicById error:', error);
    return null;
  }
};

export const createPublicPrayer = async (data: {
  message: string;
  email?: string | null;
}) => {
  try {
    const res = await axios.post('/api/public', data, {
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error('createPublicPrayer error:', error);
    return null;
  }
};

export const updatePublicPrayer = async (
  id: number,
  data: {
    message?: string;
    email?: string | null;
  }
) => {
  try {
    const res = await axios.put(`/api/public/${id}`, data, {
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error('updatePublicPrayer error:', error);
    return null;
  }
};

export const deletePublicPrayer = async (id: number): Promise<boolean> => {
  try {
    const res = await axios.delete(`/api/public/${id}`, {
      withCredentials: true,
    });

    return res.status >= 200 && res.status < 300;
  } catch (error) {
    console.error('deletePublicPrayer error:', error);
    return false;
  }
};
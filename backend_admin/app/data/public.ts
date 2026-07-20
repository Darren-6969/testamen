import axios from 'axios';

export interface PublicPrayer {
  id: number;
  message: string;
  email: string | null;
  created_date: string | null;
  status: boolean;
}

interface ApiResponseEnvelope<T> {
  data?: T;
}

interface PublicPrayerMutationResponse {
  success?: boolean;
  message?: string;
}

export const fetchPublic = async (
  cursor: string | null = null,
  search: Record<string, string> = {}
): Promise<{
  data: PublicPrayer[];
  nextCursor: string | null;
}> => {
  try {
    const res = await axios.get<ApiResponseEnvelope<PublicPrayer[]> | PublicPrayer[]>('/api/public', {
      withCredentials: true,
      params: {
        cursor,
        ...search,
      },
    });

    const rows: PublicPrayer[] = Array.isArray(res.data)
      ? res.data
      : (res.data && 'data' in res.data && Array.isArray(res.data.data))
        ? res.data.data
        : [];

    return {
      data: rows,
      nextCursor: null,
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
    const res = await axios.post<PublicPrayerMutationResponse>('/api/public', data, {
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
    status?: boolean;
  }
) => {
  try {
    const res = await axios.put<PublicPrayerMutationResponse>(
      `/api/public/${id}`,
      data,
      {
        withCredentials: true,
      }
    );

    return res.data;
  } catch (error: any) {
    console.error('updatePublicPrayer error:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    return {
      success: false,
      message:
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        (error?.response?.status
          ? `Request failed with status ${error.response.status}`
          : error?.message) ||
        'Failed to update prayer.',
    };
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
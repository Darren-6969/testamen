import axios from 'axios';

export interface Content {
  id: number;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  status: "ACTIVE" | "INACTIVE";
  display_status: "SHOW" | "HIDE";
}

// ✅ detail type for edit page
export interface ContentDetail extends Omit<Content, "start_date" | "end_date"> {
  start_date: string | null;
  end_date: string | null;
  image: string | null;
}


export const mockContent: Content[] = [
  { id: 1, name: 'Content 1', type: 'Package', start_date: '2025-02-12', end_date: '2025-02-12', status: 'ACTIVE', display_status: 'SHOW' },
  { id: 2, name: 'Content 2', type: 'Promotion', start_date: '2025-09-01', end_date: '2025-09-01', status: 'ACTIVE', display_status: 'SHOW' },
  { id: 3, name: 'Content 3', type: 'Promotion', start_date: '2025-03-11', end_date: '2025-03-11', status: 'INACTIVE', display_status: 'SHOW' },
  { id: 4, name: 'Content 4', type: 'Package', start_date: '2025-10-10', end_date: '2025-10-10', status: 'ACTIVE', display_status: 'SHOW' },
];

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Replace with an async fetcher
export async function fetchContents(): Promise<Content[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if(prod ==="TRUE"){

    try {
      const response = await axios.post<Content[]>(
        `/api/content/`,
        {
          fields: [
            'id',
            'name',
            'type',
            'start_date',
            'end_date',
            'status',
            'display_status'
          ]
        },
        {
          withCredentials: true,
        }
      );
  
      // Now response.data is strongly typed as Staff[]
      return response.data;
    } catch (error) {
      console.error('Error fetching contents:', error);
      return [];
    }
  }else{
    return mockContent;
  }
}

export async function addContent(formData: FormData, isMultipart = false): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === 'TRUE') {
    try {
      const res = await axios.post(`/api/content/add`, formData, {
        withCredentials: true,
        headers: isMultipart ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return res.status === 200 || res.status === 201;
    } catch (error: any) {
      console.error('❌ Error adding content:', error.response?.data || error.message);
      return false;
    }
  } else {
    // mock mode, always succeed
    return true;
  }
}

export async function getContentById(id: string): Promise<ContentDetail> {
  const res = await axios.get<ContentDetail>(`/api/content/${id}`, {
    withCredentials: true,
  });
  return res.data;
}

export async function updateContent(
  id: string,
  formData: FormData,
  withAuth = true
): Promise<boolean> {
  const res = await axios.put(`/api/content/${id}`, formData, {
    withCredentials: withAuth,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.status === 200;
}


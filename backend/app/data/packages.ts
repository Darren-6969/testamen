import axios from 'axios';

export interface Package {
  id: number;
  package_code: string;
  package_name: string;
  remarks: string;
  monthly_fee: number;
}

export const mockPackages: Package[] = [];

const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Replace with an async fetcher
export async function fetchPackages(): Promise<Package[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if(prod ==="TRUE"){

    try {
      const response = await axios.post<Package[]>(
        `/api/packages`,
        {
          fields: [
            'id',
            'package_code',
            'package_name',
            'remarks',
            'monthly_fee'
          ]
        },
        {
      // const response = await axios.get<Package[]>(`/api/packages`, {
          withCredentials: true,
        }
      );
  
      // Now response.data is strongly typed as User[]
      return response.data;
    } catch (error) {
      console.error('Error fetching packages:', error);
      return [];
    }
  }else{
    return mockPackages;
  }
}

// ✅ Fetch single package by ID (for view page)
export async function fetchPackageById(id: number): Promise<Package | null> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === "TRUE") {
    try {
      const response = await axios.get<Package>(`/api/packages/${id}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching package by ID:', error);
      return null;
    }
  } else {
    return mockPackages.find((p) => p.id === id) || null;
  }
}


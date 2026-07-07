// app/data/packages.ts
import axios from 'axios';

export interface Package {
  id: number;
  package_name: string;
  description?: string; // optional
  price?: number;       // optional
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchPackages(): Promise<Package[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if (prod === "TRUE") {
    try {
      const response = await axios.get<Package[]>(`/api/packages`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching packages:', error);
      return [];
    }
  } else {
    console.log('🧪 API disabled — fetchPackages() returning empty array.');
    return [];
  }
}

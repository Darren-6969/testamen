import axios from 'axios';

export interface Device {
  id: number;
  device_code: string;
  device_name: string;
  remarks: string;
  device_price: number;
}
export const mockDevices: Device[] = [];

const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Replace with an async fetcher
export async function fetchDevices(): Promise<Device[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if(prod ==="TRUE"){

    try {
      const response = await axios.post<Device[]>(
        `/api/devices/search`,
        {
          fields: [
            'id',
            'device_code',
            'device_name',
            'remarks',
            'device_price'
          ]
        },
        {
          withCredentials: true,
        }
      );
  
      // Now response.data is strongly typed as User[]
      return response.data;
    } catch (error) {
      console.error('Error fetching devices:', error);
      return [];
    }
  }else{
    return mockDevices;
  }
}

// ✅ Fetch single device by ID (for edit page)
export async function fetchDeviceById(id: number): Promise<Device | null> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  if (prod === "TRUE") {
    try {
      const response = await axios.get<Device>(`/api/devices/${id}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching device by ID:', error);
      return null;
    }
  } else {
    return mockDevices.find((d) => d.id === id) || null;
  }
}
// app/data/storage.ts

export interface PlanStorageItem {
  id: number;
  number_list: number;
  feature_plan: string;
  storage_mb: number;
  price_rm: number;
  status: string;
}

/* BASE API URL */
const BASE_URL = 'http://localhost:3001/api/plans-storage';

/* FETCH ALL STORAGE PLANS */
export async function fetchStorage(): Promise<PlanStorageItem[]> {
  try {
    const res = await fetch(BASE_URL, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch storage plans');
    }

    const result = await res.json();
    return result.data || [];
  } catch (error) {
    console.error('fetchStorage error:', error);
    return [];
  }
}

/* CREATE NEW STORAGE PLAN */
export async function createStorage(data: Omit<PlanStorageItem, 'id' | 'number_list'>): Promise<any> {
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to create storage plan');
    }

    return await res.json();
  } catch (error) {
    console.error('createStorage error:', error);
    throw error;
  }
}

/* FETCH STORAGE BY ID
   (FOR EDIT PAGE)*/
export async function fetchStorageById(
  id: number
): Promise<PlanStorageItem> {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch storage by id');
    }

    const result = await res.json();
    return result.data;
  } catch (error) {
    console.error('fetchStorageById error:', error);
    throw error;
  }
}

/* UPDATE STORAGE */
export async function updateStorage(
  id: number,
  data: Partial<PlanStorageItem>
): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to update storage');
    }

    return await res.json();
  } catch (error) {
    console.error('updateStorage error:', error);
    throw error;
  }
}

/* DELETE STORAGE */
export async function deleteStorage(id: number): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to delete storage item');
    }
  } catch (error) {
    console.error('deleteStorage error:', error);
    throw error;
  }
}
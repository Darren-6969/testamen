// app/data/deceased.ts

export interface Deceased {
  number_list: number;
  registration_date: string;
  memorial_name: string;
  gender: string;
  registered_account: string;
  show: boolean;
}

/**
 * Fetch all deceased records
 */
export async function fetchDeceaseds(): Promise<Deceased[]> {
  try {
    const res = await fetch('/api/deceased/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch deceased records');
    }

    return await res.json();
  } catch (error) {
    console.error('fetchDeceaseds error:', error);
    return [];
  }
}

/**
 * Fetch single deceased record by ID
 */
export async function fetchDeceasedById(
  id: number
): Promise<Deceased | null> {
  try {
    const res = await fetch(`/api/deceased/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch deceased record');
    }

    return await res.json();
  } catch (error) {
    console.error('fetchDeceasedById error:', error);
    return null;
  }
}

/**
 * Create new deceased record
 */
export async function createDeceased(
  data: Omit<Deceased, 'id'>
) {
  try {
    const res = await fetch('/api/deceased', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to create deceased record');
    }

    return await res.json();
  } catch (error) {
    console.error('createDeceased error:', error);
    return null;
  }
}

/**
 * Update deceased record
 */
export async function updateDeceased(
  id: number,
  data: Partial<Deceased>
) {
  try {
    const res = await fetch(`/api/deceased/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to update deceased record');
    }

    return await res.json();
  } catch (error) {
    console.error('updateDeceased error:', error);
    return null;
  }
}

/**
 * Delete deceased record
 */
export async function deleteDeceased(number_list: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/deceased/${number_list}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // if using JWT:
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    return res.ok;
  } catch (error) {
    console.error('deleteDeceased error:', error);
    return false;
  }
}
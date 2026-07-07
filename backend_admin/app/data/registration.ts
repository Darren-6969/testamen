export interface Registration {
  id: number;
  registration_date: string;
  code_no: string;
  username: string;
  registered_accounts: number;
  contact: string;
  email: string;
  status: 'Active' | 'Inactive' | 'Pending';
}

/**
 * Fetch all registrations
 */
export async function fetchRegistrations(): Promise<Registration[]> {
  try {
    const res = await fetch('/api/registration/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch registrations');
    }

    return await res.json();
  } catch (error) {
    console.error('fetchRegistrations error:', error);
    return [];
  }
}

/**
 * Fetch single registration by ID
 */
export async function fetchRegistrationById(
  id: number
): Promise<Registration | null> {
  try {
    const res = await fetch(`/api/registration/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) return null;

      throw new Error('Failed to fetch registration');
    }

    return await res.json();
  } catch (error) {
    console.error('fetchRegistrationById error:', error);
    return null;
  }
}
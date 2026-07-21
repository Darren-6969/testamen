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

export interface RegistrationDetail extends Registration {
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  phone_number?: string | null;
  country_code?: string | null;
}

export type RegistrationUpdatePayload = Partial<
  Pick<
    RegistrationDetail,
    'first_name' | 'last_name' | 'email' | 'gender' | 'phone_number' | 'country_code' | 'status'
  >
>;

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
): Promise<RegistrationDetail | null> {
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

/**
 * Update a registration's editable fields
 */
export async function updateRegistration(
  id: number,
  payload: RegistrationUpdatePayload
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/registration/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || 'Failed to update registration',
      };
    }

    return {
      success: true,
      message: data?.message || 'Registration updated successfully.',
    };
  } catch (error) {
    console.error('updateRegistration error:', error);
    return { success: false, message: 'Failed to update registration' };
  }
}
export interface UserManagement {
  id: number;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

/**
 * Fetch all admin users
 */
export async function fetchUsers(): Promise<UserManagement[]> {
  try {
    const res = await fetch('/api/users', {
      method: 'GET',
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch users');
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Create new user
 */
export async function createUser(
  data: Omit<UserManagement, 'id'>
): Promise<UserManagement | null> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to create user');
    }

    return await res.json();
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

/**
 * Update user
 */
export async function updateUser(
  id: number,
  data: Partial<UserManagement>
): Promise<UserManagement | null> {
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to update user');
    }

    return await res.json();
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

/**
 * Delete user
 */
export async function deleteUser(id: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });

    return res.ok;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}
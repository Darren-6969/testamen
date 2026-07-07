export interface Feedback {
  id: number;
  number_list: number;
  name: string;
  email: string;
  message: string;
  is_show: boolean;
}

/**
 * Fetch all feedback
 */
export async function fetchFeedbacks(): Promise<Feedback[]> {
  try {
    const res = await fetch('/api/feedback/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error('Failed to fetch feedback');

    return await res.json();
  } catch (error) {
    console.error('fetchFeedbacks error:', error);
    return [];
  }
}

/**
 * Create feedback
 */
export async function createFeedback(data: {
  name: string;
  email?: string | null;
  message: string;
}) {
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to create feedback');

    return await res.json();
  } catch (error) {
    console.error('createFeedback error:', error);
    return null;
  }
}

/**
 * Update feedback
 */
export async function updateFeedback(
  id: number,
  data: Partial<Feedback>
) {
  try {
    const res = await fetch(`/api/feedback/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to update feedback');

    return await res.json();
  } catch (error) {
    console.error('updateFeedback error:', error);
    return null;
  }
}

/**
 * Delete feedback
 */
export async function deleteFeedback(
  id: number
): Promise<boolean> {
  try {
    const res = await fetch(`/api/feedback/${id}`, {
      method: 'DELETE',
    });

    const data = await res.json();

    return data.success === true;
  } catch (error) {
    console.error('deleteFeedback error:', error);
    return false;
  }
}
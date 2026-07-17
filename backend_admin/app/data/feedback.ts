export interface Feedback {
  id: number;
  no?: number; // client-computed sequential display number (not a DB column)
  name: string;
  email: string | null;
  memorial_name?: string | null;
  message: string;
  date?: string | null;
  time?: string | null;
  type_inquiry?: string | null;
  status?: string | null;
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

    const data: Feedback[] = await res.json();

    // Number rows in the order they're displayed (ascending, top to
    // bottom) so the "No" column always reads 1, 2, 3... regardless of
    // the underlying database id. Recomputed on every fetch, so a
    // deleted row's gap closes automatically without touching the DB.
    return data.map((row, idx) => ({ ...row, no: idx + 1 }));
  } catch (error) {
    console.error('fetchFeedbacks error:', error);
    return [];
  }
}

/**
 * Fetch a single feedback record (for the edit page)
 */
export async function fetchFeedbackById(id: number): Promise<Feedback | null> {
  try {
    const res = await fetch(`/api/feedback/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const result = await res.json();

    if (!res.ok || !result?.success) {
      throw new Error(result?.message || 'Failed to fetch feedback');
    }

    return result.data as Feedback;
  } catch (error) {
    console.error('fetchFeedbackById error:', error);
    return null;
  }
}

/**
 * Create feedback
 */
export async function createFeedback(data: {
  name: string;
  email?: string | null;
  message: string;
  memorial_name?: string | null;
  type_inquiry?: string | null;
}) {
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok || !result?.success) {
      throw new Error(result?.message || 'Failed to create feedback');
    }

    return result;
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

    const result = await res.json();

    if (!res.ok || !result?.success) {
      throw new Error(result?.message || 'Failed to update feedback');
    }

    return result;
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
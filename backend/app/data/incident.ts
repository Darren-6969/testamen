export interface Incident {
  id: number;
  title: string;
  description?: string | null;
  victim?: string | null;
  date_of_incident: string | null;
  time?: string | null;
  casualty_count: number | string | null;
  location: string | null;
  status?: string | null;
  reference_link: string | null;
  message_count: number;
}

export type IncidentPayload = {
  title: string;
  description?: string | null;
  victim?: string | null;
  date_of_incident: string | null;
  time?: string | null;
  casualty_count: number | string | null;
  location: string | null;
  status?: string | null;
  reference_link?: string | null;
};

/**
 * Fetch all incidents
 */
export async function fetchIncidents(): Promise<Incident[]> {
  try {
    const res = await fetch('/api/incidents', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch incidents');
    }

    const data = await res.json();

    return Array.isArray(data) ? data : data?.data || [];
  } catch (error) {
    console.error('fetchIncidents error:', error);
    return [];
  }
}

/**
 * Fetch single incident by ID for view/edit page
 */
export async function fetchIncidentById(id: number): Promise<Incident | null> {
  try {
    const res = await fetch(`/api/incidents/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch incident');
    }

    const data = await res.json();

    return data?.data || data;
  } catch (error) {
    console.error('fetchIncidentById error:', error);
    return null;
  }
}

/**
 * Create new incident
 */
export async function createIncident(data: IncidentPayload) {
  try {
    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to create incident');
    }

    return await res.json();
  } catch (error) {
    console.error('createIncident error:', error);
    return null;
  }
}

/**
 * Update incident
 */
export async function updateIncident(id: number, data: Partial<IncidentPayload>) {
  try {
    const res = await fetch(`/api/incidents/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to update incident');
    }

    return await res.json();
  } catch (error) {
    console.error('updateIncident error:', error);
    return null;
  }
}

/**
 * Delete incident
 */
export async function deleteIncident(id: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/incidents/${id}`, {
      method: 'DELETE',
    });

    return res.ok;
  } catch (error) {
    console.error('deleteIncident error:', error);
    return false;
  }
}
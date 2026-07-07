import axios from 'axios';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface NotificationItem {
  id: number;
  subject: string;
  message: string;
  read: boolean;
  status: string;
}

// Get unread count (for the badge)
export async function fetchUnreadNotificationCount(): Promise<number> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE
  if (prod !== 'TRUE') {
    // pretend there are 2 unread notifications
    return 2;
  }

  try {
    const res = await axios.get<{ count: number }>(
      `${baseUrl}/notifications/unread-count`,
      { withCredentials: true }
    );
    return res.data?.count ?? 0;
  } catch (err) {
    console.error('Error fetching unread notification count:', err);
    return 0;
  }
}

// Get unread notifications list
export async function fetchUnreadNotifications(): Promise<NotificationItem[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE
  if (prod !== 'TRUE') {
    return [
      {
        id: 1,
        subject: 'Mock Subject 1',
        message: 'Mock message content',
        read: false,
        status: 'ACTIVE',
      },
    ];
  }

  try {
    const res = await axios.get<NotificationItem[]>(
      `${baseUrl}/notifications/unread`,
      { withCredentials: true }
    );
    return res.data ?? [];
  } catch (err) {
    console.error('Error fetching unread notifications:', err);
    return [];
  }
}


export async function markNotificationAsRead(id: number): Promise<boolean> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;

  // MOCK MODE
  if (prod !== 'TRUE') {
    console.log('[markNotificationAsRead] MOCK for id:', id);
    return true;
  }

  try {
    const res = await axios.put(
      `/api/notifications/${id}/read`,
      {},
      { withCredentials: true }
    );
    return res.status === 200;
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return false;
  }
}
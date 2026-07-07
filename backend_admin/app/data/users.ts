import axios from 'axios';

export interface User {
  username: string;
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
}
export const mockUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', username: '' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active', username: '' },
  { id: 3, name: 'Alice Johnson', email: 'alice@example.com', role: 'Manager', status: 'Inactive', username: '' },
  { id: 4, name: 'Bob Williams', email: 'bob@example.com', role: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s...', status: 'Active', username: '' },
  { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Admin', status: 'Inactive', username: '' },
  { id: 6, name: 'David Green', email: 'david@example.com', role: 'User', status: 'Active', username: '' },
  { id: 7, name: 'Emma White', email: 'emma@example.com', role: 'Manager', status: 'Inactive', username: '' },
];

const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Replace with an async fetcher
export async function fetchUsers(): Promise<User[]> {
  const prod = process.env.NEXT_PUBLIC_API_ENABLED;
  if(prod ==="TRUE"){

    try {
      const response = await axios.post<User[]>(
        `/api/users`,
        {
          fields: [
            'users.id',
            'name',
            'email',
            'user_role.role_name AS role',
            'acc_status AS status'
          ]
        },
        {
          withCredentials: true,
        }
      );
  
      // Now response.data is strongly typed as User[]
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }else{
    return mockUsers;
  }
}
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  const cookieStore = await cookies();
  const isAuthenticated =
    cookieStore.has('access_token') || cookieStore.has('refreshToken');

  redirect(isAuthenticated ? '/module/dashboard' : '/login');
}

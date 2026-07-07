// app/(auth)/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// import '../globals.css';
// import '../../components/hooks/themes.css';
import { Toaster } from 'sonner';
import { APP_CONSTANT } from '../config/Constant';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: APP_CONSTANT.name,
  description: 'Login page for Client Operations',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={inter.className}>
      {children}
      <Toaster position="top-right" richColors />
    </div>
  );
}

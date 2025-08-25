
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
        if (user) {
            if (user.role === 'admin') {
                router.replace('/dashboard');
            } else {
                router.replace('/shipments');
            }
        } else {
            router.replace('/login');
        }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
        <p>Mengalihkan...</p>
    </div>
  );
}

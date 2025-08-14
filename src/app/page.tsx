'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is a temporary redirector to the main page /shipments
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/shipments');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
        <p>Mengalihkan ke halaman utama...</p>
    </div>
  );
}

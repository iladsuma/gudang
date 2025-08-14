'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/shipments');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <p>Mengarahkan ke halaman Lacak Pengiriman...</p>
    </div>
  );
}

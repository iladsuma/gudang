'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { getCheckoutHistory } from '@/lib/data';
import type { Checkout } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InvoicesClient } from '@/components/invoices-client';
import { useRouter } from 'next/navigation';

export default function InvoicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [batches, setBatches] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);
  
  useEffect(() => {
    if (user) {
      // Mengambil data dari riwayat checkout/pemrosesan
      getCheckoutHistory().then(data => {
        setBatches(data);
        setLoading(false);
      });
    }
  }, [user]);
  
  if (user?.role !== 'admin') {
      return (
           <div className="flex h-screen w-full items-center justify-center">
                <p>Anda tidak memiliki akses ke halaman ini. Mengalihkan...</p>
           </div>
      );
  }

  if (loading) {
      return (
          <div className="container mx-auto p-4 md:p-8">
              <Card>
                  <CardHeader>
                      <Skeleton className="h-8 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                      <Skeleton className="h-96 w-full" />
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Faktur Batch</CardTitle>
          <CardDescription>
            Buat faktur gabungan berdasarkan batch pemrosesan di riwayat.
          </Description>
        </CardHeader>
        <CardContent>
          <InvoicesClient batches={batches} />
        </CardContent>
      </Card>
    </div>
  );
}

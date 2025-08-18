
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
  const { user, loading: authLoading } = useAuth();
  const [batches, setBatches] = useState<Checkout[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();


  useEffect(() => {
    // Redirect if not admin after loading is complete
    if (!authLoading && user?.role !== 'admin') {
      router.push('/shipments');
    }
    
    if (user?.role === 'admin') {
      getCheckoutHistory().then(data => {
        setBatches(data);
        setDataLoading(false);
      });
    }
  }, [user, authLoading, router]);
  
  if (authLoading || (dataLoading && user?.role === 'admin')) {
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
      );
  }
  
  if (!user || user.role !== 'admin') {
       return (
           <div className="flex h-screen w-full items-center justify-center">
                <p>Anda tidak memiliki akses. Mengalihkan...</p>
           </div>
      );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Faktur</CardTitle>
          <CardDescription>
            Pilih satu atau beberapa item untuk membuat faktur gabungan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoicesClient batches={batches} />
        </CardContent>
      </Card>
    </div>
  );
}

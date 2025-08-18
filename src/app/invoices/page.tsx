
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
  const router = useRouter();
  const [batches, setBatches] = useState<Checkout[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // Redirect if loading is finished and user is not an admin
    if (!authLoading && user?.role !== 'admin') {
      router.push('/');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    // Fetch data only if the user is an admin
    if (user?.role === 'admin') {
      getCheckoutHistory().then(data => {
        setBatches(data);
        setDataLoading(false);
      });
    } else {
        // If user is not admin and not loading, no need to fetch data.
        if (!authLoading) {
            setDataLoading(false);
        }
    }
  }, [user, authLoading]);
  
  // Show a loading skeleton while the auth state or data is being determined
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
  
  // If loading is done and the user is still not an admin, show a message.
  // The useEffect above will handle the redirect.
  if (user?.role !== 'admin') {
      return (
           <div className="flex h-screen w-full items-center justify-center">
                <p>Anda tidak memiliki akses ke halaman ini. Mengalihkan...</p>
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

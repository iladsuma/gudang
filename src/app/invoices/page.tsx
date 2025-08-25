
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { getShipments } from '@/lib/data';
import type { Shipment } from '@/lib/types';
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
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();


  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.push('/shipments');
    }
    
    if (user?.role === 'admin') {
      getShipments().then(data => {
        setShipments(data.filter(s => s.status === 'Terkirim'));
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
          <CardTitle>Arsip Pengiriman Terkirim</CardTitle>
          <CardDescription>
            Daftar semua pengiriman yang telah selesai dan berhasil dikirim.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoicesClient shipments={shipments} />
        </CardContent>
      </Card>
    </div>
  );
}

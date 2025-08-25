
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { getShipments, processShipmentsToDelivered } from '@/lib/data';
import type { Shipment } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { HistoryClient } from '@/components/history-client';


export default function HistoryPage() {
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
        setShipments(data.filter(s => s.status === 'Pengemasan'));
        setDataLoading(false);
      });
    }
  }, [user, authLoading, router]);

  const handleSuccess = (processedIds: string[]) => {
    setShipments(prev => prev.filter(s => !processedIds.includes(s.id)));
    router.refresh();
  };

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
      )
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
          <CardTitle>Antrian Kemas</CardTitle>
          <CardDescription>
            Konfirmasi dan catat pengiriman yang sudah selesai dikemas dan siap untuk dikirim.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HistoryClient initialShipments={shipments} onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}

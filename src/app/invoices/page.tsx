
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { InvoicesClient } from '@/components/invoices-client';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PackagingQueueClient } from '@/components/packaging-queue-client';

export default function InvoicesPage() {
  const { user, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  const fetchShipments = useCallback(async () => {
    if (user?.role === 'admin') {
      setDataLoading(true);
      getShipments().then(data => {
        setShipments(data.filter(s => s.status === 'Terkirim' || s.status === 'Pengemasan'));
        setDataLoading(false);
      });
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.push('/shipments');
    }
    
    if (user?.role === 'admin') {
      fetchShipments();
    }
  }, [user, authLoading, router, fetchShipments]);
  
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

  const packagingShipments = shipments.filter(s => s.status === 'Pengemasan');
  const deliveredShipments = shipments.filter(s => s.status === 'Terkirim');

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Tabs defaultValue="packaging">
        <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pengiriman & Arsip</h1>
              <p className="text-muted-foreground">Kelola pengiriman yang siap dikirim dan lihat arsip yang sudah selesai.</p>
            </div>
            <TabsList>
              <TabsTrigger value="packaging">Siap Kirim ({packagingShipments.length})</TabsTrigger>
              <TabsTrigger value="archive">Arsip Terkirim ({deliveredShipments.length})</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="packaging">
            <Card>
                <CardHeader>
                    <CardTitle>Siap Kirim</CardTitle>
                    <CardDescription>
                        Daftar pengiriman yang sudah dikemas dan siap untuk ditandai sebagai 'Terkirim'.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                  <PackagingQueueClient shipments={packagingShipments} onUpdate={fetchShipments} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="archive">
            <Card>
                <CardHeader>
                    <CardTitle>Arsip Pengiriman Terkirim</CardTitle>
                    <CardDescription>
                       Daftar semua pengiriman yang telah selesai diproses dan statusnya 'Terkirim'.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <InvoicesClient shipments={deliveredShipments} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

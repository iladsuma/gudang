
'use client';
import { getShipments } from '@/lib/data';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Suspense, useEffect, useState, useCallback } from 'react';
import type { Shipment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { MyShipmentsClient } from '@/components/my-shipments-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function MyShipmentsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAndSetData = useCallback(async () => {
    if (!user) return;
      setLoading(true);
      const data = await getShipments();
      
      // Filter orders assigned to this user that are in progress or done
      setShipments(data.filter(s => s.userId === user.id && s.status !== 'Proses'));
      setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
        fetchAndSetData();
    } else if (!authLoading) {
        setLoading(false);
    }
  }, [user, authLoading, fetchAndSetData]);

  if (authLoading || (loading && user)) {
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
  
  if (!user) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Mengalihkan ke halaman login...</p>
        </div>
      );
  }

  const packagingShipments = shipments.filter(s => s.status === 'Pengemasan');
  const deliveredShipments = shipments.filter(s => s.status === 'Terkirim');

  return (
    <div className="container mx-auto p-4 md:p-8">
        <Tabs defaultValue="in-progress">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pekerjaan Saya</h1>
                    <p className="text-muted-foreground">Kelola pesanan yang sedang Anda jahit atau proses.</p>
                </div>
                <TabsList>
                    <TabsTrigger value="in-progress">Sedang Diproses ({packagingShipments.length})</TabsTrigger>
                    <TabsTrigger value="completed">Selesai ({deliveredShipments.length})</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="in-progress">
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Jahitan</CardTitle>
                        <CardDescription>Pesanan yang telah Anda ambil dan sedang dalam pengerjaan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MyShipmentsClient shipments={packagingShipments} onUpdate={fetchAndSetData} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="completed">
                 <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Selesai</CardTitle>
                        <CardDescription>Arsip pesanan yang telah Anda selesaikan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MyShipmentsClient shipments={deliveredShipments} onUpdate={fetchAndSetData} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}

export default function MyShipmentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyShipmentsPageContent />
    </Suspense>
  )
}

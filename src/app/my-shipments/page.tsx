
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
import { Suspense, useEffect, useState } from 'react';
import type { Shipment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { MyShipmentsClient } from '@/components/my-shipments-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function MyShipmentsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAndSetData = async () => {
    if (!user) return;
      setLoading(true);
      const data = await getShipments();
      
      setShipments(data.filter(s => s.userId === user.id));
      setLoading(false);
  }

  useEffect(() => {
    if (user) {
        fetchAndSetData();
    } else if (!authLoading) {
        setLoading(false);
    }
  }, [user, authLoading]);

  // Show skeleton while either auth or data is loading.
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

  const packagingShipments = shipments.filter(s => s.status === 'Proses' || s.status === 'Pengemasan');
  const deliveredShipments = shipments.filter(s => s.status === 'Terkirim');

  return (
    <div className="container mx-auto p-4 md:p-8">
        <Tabs defaultValue="packaging">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Riwayat Kiriman Saya</h1>
                    <p className="text-muted-foreground">Lacak semua pengiriman yang telah Anda buat dan pantau statusnya di sini.</p>
                </div>
                <TabsList>
                    <TabsTrigger value="packaging">Di Kemas ({packagingShipments.length})</TabsTrigger>
                    <TabsTrigger value="delivered">Di Kirim ({deliveredShipments.length})</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="packaging">
                <Card>
                    <CardHeader>
                        <CardTitle>Dalam Proses & Pengemasan</CardTitle>
                        <CardDescription>Daftar pengiriman yang sedang diproses atau sudah dalam tahap pengemasan oleh admin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MyShipmentsClient shipments={packagingShipments} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="delivered">
                 <Card>
                    <CardHeader>
                        <CardTitle>Terkirim</CardTitle>
                        <CardDescription>Arsip pengiriman yang telah selesai dan dikirim oleh admin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MyShipmentsClient shipments={deliveredShipments} />
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

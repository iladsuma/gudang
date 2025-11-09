
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

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kiriman Saya</CardTitle>
          <CardDescription>
            Lacak semua pengiriman yang telah Anda buat dan pantau statusnya di sini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MyShipmentsClient shipments={shipments} />
        </CardContent>
      </Card>
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

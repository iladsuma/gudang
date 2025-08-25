'use client';
import { getShipments } from '@/lib/data';
import { ShipmentsClient } from '@/components/shipments-client';
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

function ShipmentsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState('Rekapitulasi Pengiriman');
  const [pageDescription, setPageDescription] = useState("Kelola semua data pengiriman barang masuk Anda yang sedang dalam tahap 'Proses'.");

  useEffect(() => {
    if (user) {
        getShipments().then(data => {
            // User sees all shipments they created, regardless of status
            setShipments(data.filter(s => s.user === user.name));
            setPageTitle('Riwayat Pengiriman Saya');
            setPageDescription("Lacak semua pengiriman yang telah Anda buat dan statusnya saat ini. Pilih pengiriman berstatus 'Proses' untuk dibungkus.");
            
            setLoading(false);
        });
    } else if (!authLoading) {
        // If auth is done and there's no user, stop data loading.
        setLoading(false);
    }
  }, [user, authLoading]);

  // Show skeleton while either auth or data is loading.
  if (authLoading || loading) {
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
  
  // If not loading and no user, the redirect from AuthProvider will handle it.
  // We can show a message in the meantime.
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
          <CardTitle>{pageTitle}</CardTitle>
          <CardDescription>
            {pageDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShipmentsClient shipments={shipments} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ShipmentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShipmentsPageContent />
    </Suspense>
  )
}


'use client';
import { getShipments, getUsers } from '@/lib/data';
import { ShipmentsClient } from '@/components/shipments-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Suspense, useEffect, useState, useCallback } from 'react';
import type { Shipment, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function ShipmentsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState('Rekapitulasi Pengiriman');
  const [pageDescription, setPageDescription] = useState("Kelola semua data pengiriman barang masuk Anda.");

  const fetchAndSetData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const [shipmentData, allUsersData] = await Promise.all([getShipments(), getUsers()]);
        
        if(user?.role === 'admin') {
            setShipments(shipmentData.filter(s => s.status === 'Proses'));
            setPageTitle('Antrian Kemas');
            setPageDescription("Pilih pengiriman yang akan diproses. Stok akan dikurangi dan status akan diubah menjadi 'Pengemasan'.");
        } else {
            const currentUser = allUsersData.find(u => u.id === user.id);
            if (currentUser) {
                setShipments(shipmentData.filter(s => s.userId === currentUser.id));
            } else {
                setShipments([]);
            }
            setPageTitle('Riwayat Pengiriman Saya');
            setPageDescription("Lacak semua pengiriman yang telah Anda buat dan statusnya saat ini.");
        }
    } catch (error) {
        console.error("Failed to fetch data:", error);
    } finally {
        setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
        fetchAndSetData();
    } else if (!authLoading) {
        setLoading(false);
    }
  }, [user, authLoading, fetchAndSetData]);

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
          <ShipmentsClient shipments={shipments} onUpdate={fetchAndSetData} />
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

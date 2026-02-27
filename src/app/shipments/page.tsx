
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
  const [pageTitle, setPageTitle] = useState('Pemesanan Produk');
  const [pageDescription, setPageDescription] = useState("Daftar pesanan masuk yang menunggu untuk diproses.");

  const fetchAndSetData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const shipmentData = await getShipments();
        
        if(user?.role === 'admin') {
            // Admin sees all new orders (Proses)
            setShipments(shipmentData.filter(s => s.status === 'Proses'));
            setPageTitle('Manajemen Pesanan Baru');
            setPageDescription("Halaman ini digunakan oleh pemilik/admin untuk mencatat pesanan baru dari pelanggan.");
        } else {
            // User sees only orders that are in "Proses" status and NOT yet taken by anyone
            // (If we use userId to track the assigned user, then status 'Proses' means unassigned)
            setShipments(shipmentData.filter(s => s.status === 'Proses'));
            setPageTitle('Ambil Pesanan Tersedia');
            setPageDescription("Pilih pesanan yang ingin Anda kerjakan. Setelah diambil, pesanan akan pindah ke menu 'Pekerjaan Saya'.");
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

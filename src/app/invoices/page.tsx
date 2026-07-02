'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { getShipments, getUsers } from '@/lib/data';
import type { Shipment, User } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShipmentHistoryClient } from '@/components/shipment-history-client';


export default function InvoicesPage() {
  const { user, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  const fetchShipments = useCallback(async () => {
    if (user?.role === 'admin') {
      setDataLoading(true);
      const [shipmentsData, usersData] = await Promise.all([getShipments(), getUsers()]);
      setShipments(shipmentsData);
      setAllUsers(usersData);
      setDataLoading(false);
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

  // LOGIK FILTER BARU:
  // Tab 1: Masih dijahit ATAU sudah selesai tapi belum dibayar (Tunggakan)
  const packagingShipments = shipments.filter(s => 
    s.status === 'Pengemasan' || (s.status === 'Terkirim' && s.paymentStatus === 'Belum Lunas')
  );
  
  // Tab 2: HANYA yang sudah selesai dijahit DAN sudah lunas bayar
  const deliveredShipments = shipments.filter(s => 
    s.status === 'Terkirim' && s.paymentStatus === 'Lunas'
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Tabs defaultValue="packaging">
        <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manajemen Arsip Pemesanan</h1>
              <p className="text-muted-foreground">Kelola pemesanan yang sedang dalam tahap penyelesaian atau menunggu pelunasan.</p>
            </div>
            <TabsList>
              <TabsTrigger value="packaging">Aktif / Belum Lunas ({packagingShipments.length})</TabsTrigger>
              <TabsTrigger value="archive">Arsip Lunas ({deliveredShipments.length})</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="packaging">
            <Card>
                <CardHeader>
                    <CardTitle>Pesanan Aktif & Tunggu Pelunasan</CardTitle>
                    <CardDescription>
                        Daftar pesanan yang sedang dijahit atau sudah selesai namun belum lunas pembayarannya.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                  <ShipmentHistoryClient 
                    shipments={packagingShipments} 
                    allUsers={allUsers}
                    onUpdate={fetchShipments} 
                    tableType="packaging"
                  />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="archive">
            <Card>
                <CardHeader>
                    <CardTitle>Arsip Selesai & Lunas</CardTitle>
                    <CardDescription>
                       Riwayat seluruh pesanan yang telah tuntas pengerjaannya dan sudah lunas pembayarannya.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ShipmentHistoryClient 
                        shipments={deliveredShipments} 
                        allUsers={allUsers}
                        onUpdate={fetchShipments} 
                        tableType="archive"
                    />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

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

  const packagingShipments = shipments.filter(s => s.status === 'Pengemasan');
  const deliveredShipments = shipments.filter(s => s.status === 'Terkirim');

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Tabs defaultValue="packaging">
        <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manajemen Arsip Pemesanan Butik</h1>
              <p className="text-muted-foreground">Kelola pemesanan yang telah selesai atau sedang dalam tahap penyelesaian akhir.</p>
            </div>
            <TabsList>
              <TabsTrigger value="packaging">Sedang Dijahit ({packagingShipments.length})</TabsTrigger>
              <TabsTrigger value="archive">Arsip Selesai ({deliveredShipments.length})</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="packaging">
            <Card>
                <CardHeader>
                    <CardTitle>Pesanan Sedang Diproses</CardTitle>
                    <CardDescription>
                        Daftar pemesanan yang sedang dikerjakan oleh tim penjahit.
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
                    <CardTitle>Arsip Pemesanan Selesai</CardTitle>
                    <CardDescription>
                       Riwayat seluruh pesanan jahitan yang telah selesai diproses dan diambil pelanggan.
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

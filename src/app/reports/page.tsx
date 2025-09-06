
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductReportClient } from '@/components/reports/product-report-client';

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.push('/shipments');
    }
    if (user?.role === 'admin') {
      setDataLoading(false);
    }
  }, [user, authLoading, router]);

  if (authLoading || dataLoading) {
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

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Tabs defaultValue="products">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pusat Laporan</h1>
            <p className="text-muted-foreground">
              Analisis dan ekspor data penting terkait operasional bisnis Anda.
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="products">Laporan Master Barang</TabsTrigger>
            <TabsTrigger value="sales" disabled>Laporan Penjualan</TabsTrigger>
            <TabsTrigger value="purchases" disabled>Laporan Pembelian</TabsTrigger>
            <TabsTrigger value="profit" disabled>Laporan Laba/Rugi</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Master Barang</CardTitle>
              <CardDescription>
                Daftar lengkap semua item produk yang terdaftar di sistem beserta detailnya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductReportClient />
            </CardContent>
          </Card>
        </TabsContent>
        {/* Placeholder for other reports */}
        <TabsContent value="sales"></TabsContent>
        <TabsContent value="purchases"></TabsContent>
        <TabsContent value="profit"></TabsContent>
      </Tabs>
    </div>
  );
}

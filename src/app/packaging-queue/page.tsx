
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
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function PackagingQueuePage() {
  const { user, loading: authLoading } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchPackagingQueue = useCallback(async () => {
    if (user?.role === 'admin') {
      setDataLoading(true);
      const allShipments = await getShipments();
      setShipments(allShipments.filter(s => s.status === 'Pengemasan'));
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user?.role !== 'admin') {
      router.push('/shipments');
    }
    if (user?.role === 'admin') {
      fetchPackagingQueue();
    }
  }, [user, authLoading, router, fetchPackagingQueue]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedShipments(checked ? shipments.map(s => s.id) : []);
  };

  const handleSelectSingle = (shipmentId: string, checked: boolean) => {
    setSelectedShipments(prev =>
      checked ? [...prev, shipmentId] : prev.filter(id => id !== shipmentId)
    );
  };
  
  const handleProcessToDelivered = async () => {
    if (selectedShipments.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Tidak Ada Data Terpilih',
        description: 'Silakan pilih pengiriman yang akan ditandai sebagai terkirim.',
      });
      return;
    }
    setIsProcessing(true);
    try {
      await processShipmentsToDelivered(selectedShipments);
      toast({
        title: 'Sukses!',
        description: `${selectedShipments.length} pengiriman berhasil ditandai terkirim dan dipindahkan ke arsip.`,
      });
      setSelectedShipments([]);
      fetchPackagingQueue(); // Refresh data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
      toast({ variant: 'destructive', title: 'Gagal Memproses', description: message });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getStatusVariant = (status: Shipment['status']) => {
    switch (status) {
        case 'Proses': return 'secondary';
        case 'Pengemasan': return 'default';
        case 'Terkirim': return 'outline';
        default: return 'secondary';
    }
  };
  
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
  };

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

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Antrian Pengemasan</CardTitle>
          <CardDescription>
            Daftar pengiriman yang siap untuk dikemas dan dikirim. Pilih item dan tandai sebagai terkirim.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleProcessToDelivered} disabled={selectedShipments.length === 0 || isProcessing}>
                {isProcessing ? <Loader2 className='mr-2' /> : <Send className='mr-2' />}
                Tandai Terkirim ({selectedShipments.length})
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[50px]'>
                      <Checkbox
                        checked={shipments.length > 0 && selectedShipments.length === shipments.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Pilih semua"
                      />
                    </TableHead>
                    <TableHead>No. Transaksi</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Masuk Antrian</TableHead>
                    <TableHead className="text-right">Total Nilai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.length > 0 ? (
                    shipments.map((shipment) => (
                      <TableRow key={shipment.id} data-state={selectedShipments.includes(shipment.id) ? "selected" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedShipments.includes(shipment.id)}
                            onCheckedChange={(checked) => handleSelectSingle(shipment.id, !!checked)}
                            aria-label={`Pilih pengiriman ${shipment.transactionId}`}
                          />
                        </TableCell>
                        <TableCell className='font-medium'>{shipment.transactionId}</TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1">
                            {shipment.products.map((p, index) => (
                                <Badge variant="secondary" key={index} className='font-normal'>
                                    {p.name} (x{p.quantity})
                                </Badge>
                            ))}
                            </div>
                        </TableCell>
                         <TableCell>
                            <Badge variant={getStatusVariant(shipment.status)}>
                                {shipment.status}
                            </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(shipment.createdAt), 'PPpp', { locale: id })}</TableCell>
                        <TableCell className="text-right font-medium">{formatRupiah(shipment.totalAmount)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Tidak ada pengiriman dalam antrian pengemasan.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                {shipments.length > 0 && <TableCaption>Daftar semua pengiriman yang sudah diproses dari antrian sebelumnya.</TableCaption>}
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

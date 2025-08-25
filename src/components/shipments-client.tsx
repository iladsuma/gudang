

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Shipment, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Loader2, FileText, Package, Pencil } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { ShipmentForm } from './shipment-form';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { deleteShipment, getProducts } from '@/lib/data';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/hooks/use-cart';

export function ShipmentsClient({ shipments: initialShipments }: { shipments: Shipment[] }) {
  const { user } = useAuth();
  const [shipments, setShipments] = useState(initialShipments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingShipment, setEditingShipment] = useState<Shipment | undefined>(undefined);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart } = useCart();


  useEffect(() => {
    if (searchParams.get('action') === 'showForm') {
      setIsFormOpen(true);
    }
  }, [searchParams]);


  useEffect(() => {
     setShipments(initialShipments);
  }, [initialShipments]);

  useEffect(() => {
    setIsClient(true);
    getProducts();
  }, []);
  
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
  };

  const handleFormSuccess = useCallback((newOrUpdatedShipment: Shipment) => {
    if (editingShipment) {
      // Replace the old shipment with the updated one
      setShipments(prev => prev.map(s => s.id === newOrUpdatedShipment.id ? newOrUpdatedShipment : s));
    } else {
      // Add the new shipment to the top of the list
      setShipments(prev => [newOrUpdatedShipment, ...prev]);
    }
    setIsFormOpen(false);
    setEditingShipment(undefined);
    router.replace('/shipments', { scroll: false });
  }, [editingShipment, router]);
  
  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false);
    setEditingShipment(undefined);
    router.replace('/shipments', { scroll: false });
  }, [router]);
  
  const onDelete = async (shipmentId: string) => {
    setIsDeleting(shipmentId);
    try {
        await deleteShipment(shipmentId);
        setShipments((prev) => prev.filter((s) => s.id !== shipmentId));
        toast({
            title: 'Sukses!',
            description: 'Data pengiriman berhasil dihapus.',
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
        toast({
            variant: 'destructive',
            title: 'Kesalahan',
            description: message,
        });
    } finally {
        setIsDeleting(null);
    }
  };

  const openPdf = (dataUrl: string) => {
    const pdfWindow = window.open("");
    pdfWindow?.document.write(`<iframe width='100%' height='100%' src='${dataUrl}' title='pratinjau-pdf'></iframe>`);
  };

  const handleOpenForm = () => {
    if (cart.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Keranjang Kosong',
            description: 'Silakan tambahkan produk dari etalase terlebih dahulu.',
        });
    } else {
        setEditingShipment(undefined);
        setIsFormOpen(true);
    }
  };

  const handleEdit = (shipment: Shipment) => {
    setEditingShipment(shipment);
    setIsFormOpen(true);
  }
  
  const getStatusVariant = (status: Shipment['status']) => {
    switch (status) {
        case 'Proses': return 'secondary';
        case 'Pengemasan': return 'default';
        case 'Terkirim': return 'outline';
        default: return 'secondary';
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <Button onClick={handleOpenForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Pengiriman
            </Button>
          <DialogContent className="sm:max-w-4xl">
            <ShipmentForm
              key={editingShipment ? editingShipment.id : 'new'}
              shipmentToEdit={editingShipment}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              initialProductsFromCart={cart}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>User</TableHead>
              <TableHead>No Transaksi</TableHead>
              <TableHead>Ekspedisi</TableHead>
               <TableHead>Status</TableHead>
              <TableHead>Resi</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead className="text-right">Total Item</TableHead>
              <TableHead className="text-right">Total Pengemasan</TableHead>
              <TableHead className="text-right">Total Produk</TableHead>
              <TableHead className="text-right">Total Keseluruhan</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.length > 0 ? (
              shipments.map((shipment, index) => (
                <TableRow key={shipment.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{shipment.user}</TableCell>
                  <TableCell>{shipment.transactionId}</TableCell>
                  <TableCell>{shipment.expedition}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(shipment.status)}>
                        {shipment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {shipment.receipt ? (
                      <Button variant="link" className="p-0 h-auto" onClick={() => openPdf(shipment.receipt!.dataUrl)}>
                          <FileText className="mr-2 h-4 w-4" />
                          {shipment.receipt.fileName}
                      </Button>
                    ) : (
                      <span className='text-xs text-muted-foreground'>-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {shipment.products.map((p, index) => (
                        <div key={index} className="flex items-center gap-2">
                           <Dialog>
                            <DialogTrigger asChild>
                               <Image
                                src={p.imageUrl || 'https://placehold.co/100x100.png'}
                                alt={p.name}
                                width={32}
                                height={32}
                                className="rounded-md object-cover h-8 w-8 cursor-pointer"
                                data-ai-hint="product image"
                               />
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>{p.name || 'Pratinjau Gambar'}</DialogTitle>
                                </DialogHeader>
                                <Image
                                src={p.imageUrl || 'https://placehold.co/600x400.png'}
                                alt={p.name}
                                width={600}
                                height={400}
                                className="rounded-md object-contain"
                                data-ai-hint="product image preview"
                                />
                            </DialogContent>
                           </Dialog>
                          <Badge variant="secondary">
                            {p.name} (x{p.quantity})
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{shipment.totalItems}</TableCell>
                  <TableCell className="text-right">{formatRupiah(shipment.totalPackingCost)}</TableCell>
                  <TableCell className="text-right">{formatRupiah(shipment.totalProductCost)}</TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(shipment.totalAmount)}</TableCell>
                   <TableCell>
                    {isClient ? (
                        format(new Date(shipment.createdAt), 'PPpp', { locale: id })
                    ) : (
                        <Skeleton className="h-4 w-3/4" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                     {shipment.status === 'Proses' && (
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(shipment)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                     )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={!!isDeleting}>
                            {isDeleting === shipment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data pengiriman secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(shipment.id)}
                            disabled={!!isDeleting}
                          >
                            Lanjutkan
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={14} className="h-24 text-center">
                  Tidak ada data pengiriman.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {shipments.length > 0 && <TableCaption>Daftar semua pengiriman barang masuk yang Anda buat.</TableCaption>}
        </Table>
      </div>
    </div>
  );
}

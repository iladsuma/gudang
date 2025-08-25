

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Shipment, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Loader2, FileText, Package } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Checkbox } from './ui/checkbox';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { deleteShipment, getProducts, processShipmentsToPackaging } from '@/lib/data';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/hooks/use-cart';

export function ShipmentsClient({ shipments: initialShipments }: { shipments: Shipment[] }) {
  const { user } = useAuth();
  const [shipments, setShipments] = useState(initialShipments);
  const [masterProducts, setMasterProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, clearCart } = useCart();


  useEffect(() => {
    if (searchParams.get('action') === 'showForm') {
      setIsFormOpen(true);
    }
  }, [searchParams]);


  useEffect(() => {
    // This logic might need adjustment based on the new flow
    // For now, let's assume it shows 'Proses' for admin, and all for user.
    if(user?.role === 'admin') {
      setShipments(initialShipments.filter(s => s.status === 'Proses'));
    } else {
      setShipments(initialShipments);
    }
  }, [initialShipments, user]);

  useEffect(() => {
    setIsClient(true);
    getProducts().then(setMasterProducts);
  }, []);
  
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
  };

  const handleFormSuccess = useCallback((newShipment: Shipment) => {
    setShipments((prev) => [newShipment, ...prev]);
    setIsFormOpen(false);
    // Remove search param
    router.replace('/shipments', { scroll: false });
  }, [router]);
  
  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false);
    router.replace('/shipments', { scroll: false });
  }, [router]);
  
  const onDelete = async (shipmentId: string) => {
    setIsDeleting(shipmentId);
    try {
        await deleteShipment(shipmentId);
        setShipments((prev) => prev.filter((s) => s.id !== shipmentId));
        setSelectedShipments((prev) => prev.filter((id) => id !== shipmentId));
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShipments(shipments.map((s) => s.id));
    } else {
      setSelectedShipments([]);
    }
  };

  const handleSelectSingle = (shipmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedShipments((prev) => [...prev, shipmentId]);
    } else {
      setSelectedShipments((prev) => prev.filter((id) => id !== shipmentId));
    }
  };

  const handleProcessToPackaging = async () => {
    if (selectedShipments.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Tidak Ada Pengiriman Terpilih',
            description: 'Pilih setidaknya satu pengiriman untuk diproses.'
        });
        return;
    }

    setIsProcessing(true);

    try {
        await processShipmentsToPackaging(selectedShipments);
        
        toast({
            title: 'Sukses!',
            description: 'Data terpilih berhasil diproses, stok diperbarui, dan status diubah menjadi "Pengemasan".'
        });
        
        // Optimistically remove from UI and move to history
        setShipments(prev => prev.filter(s => !selectedShipments.includes(s.id)));
        setSelectedShipments([]);
        
        // update master product list to reflect new stock
        getProducts().then(setMasterProducts);
        router.refresh();

    } catch (error) {
        console.error("Failed to process shipments", error);
        const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses data.';
        toast({
            variant: 'destructive',
            title: 'Gagal Memproses',
            description: message
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const tableTotals = useMemo(() => {
    return shipments.reduce(
        (acc, shipment) => {
            acc.totalItems += shipment.totalItems;
            acc.totalPackingCost += shipment.totalPackingCost;
            acc.totalAmount += shipment.totalAmount;
            return acc;
        },
        { totalItems: 0, totalPackingCost: 0, totalAmount: 0 }
    );
  }, [shipments]);

  const handleOpenForm = () => {
    if (cart.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Keranjang Kosong',
            description: 'Silakan tambahkan produk dari etalase terlebih dahulu.',
        });
    } else {
        setIsFormOpen(true);
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


  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
       {user?.role === 'admin' && (
        <Button onClick={handleProcessToPackaging} disabled={selectedShipments.length === 0 || isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
            Bungkus ({selectedShipments.length})
        </Button>
       )}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Pengiriman
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <ShipmentForm
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
             {user?.role === 'admin' && (
              <TableHead className="w-[50px]">
                <Checkbox
                    checked={shipments.length > 0 && selectedShipments.length === shipments.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Pilih semua"
                />
              </TableHead>
             )}
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
                <TableRow key={shipment.id} data-state={selectedShipments.includes(shipment.id) ? "selected" : undefined}>
                   {user?.role === 'admin' && (
                    <TableCell>
                      <Checkbox
                        checked={selectedShipments.includes(shipment.id)}
                        onCheckedChange={(checked) => handleSelectSingle(shipment.id, !!checked)}
                        aria-label={`Pilih pengiriman ${shipment.transactionId}`}
                      />
                    </TableCell>
                   )}
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
                  Tidak ada data pengiriman dalam status 'Proses'.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {shipments.length > 0 && <TableCaption>Daftar semua pengiriman barang masuk yang siap diproses.</TableCaption>}
        </Table>
      </div>
        {shipments.length > 0 && (
            <div className="flex justify-end pt-4">
                <div className="w-full max-w-sm space-y-2 rounded-md border p-4">
                    <h3 className="text-lg font-medium">Ringkasan Total</h3>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Item</span>
                        <span className="font-medium">{tableTotals.totalItems} pcs</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Pengemasan</span>
                        <span className="font-medium">{formatRupiah(tableTotals.totalPackingCost)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                        <span>Total Keseluruhan</span>
                        <span>{formatRupiah(tableTotals.totalAmount)}</span>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

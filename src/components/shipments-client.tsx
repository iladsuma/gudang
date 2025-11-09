
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Shipment, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Loader2, FileText, Package, Pencil, Send } from 'lucide-react';
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
import { deleteShipment, processShipmentsToPackaging, getUsers } from '@/lib/data';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/hooks/use-cart.tsx';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';

export function ShipmentsClient({ shipments: initialShipments, onUpdate }: { shipments: Shipment[], onUpdate: () => void; }) {
  const { user } = useAuth();
  const [shipments, setShipments] = useState(initialShipments);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingShipment, setEditingShipment] = useState<Shipment | undefined>(undefined);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { cart } = useCart();
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
     setShipments(initialShipments);
     // Deselect shipments that are no longer in the list
     setSelectedShipments(prev => prev.filter(id => initialShipments.some(s => s.id === id)));
  }, [initialShipments]);

  useEffect(() => {
    setIsClient(true);
    getUsers().then(setAllUsers);
  }, []);
  
  const filteredShipments = useMemo(() => {
    if (!searchTerm) return shipments;
    const lowercasedFilter = searchTerm.toLowerCase();
    return shipments.filter(shipment =>
        shipment.transactionId.toLowerCase().includes(lowercasedFilter) ||
        shipment.customerName.toLowerCase().includes(lowercasedFilter) ||
        shipment.products.some(p => p.name.toLowerCase().includes(lowercasedFilter))
    );
  }, [shipments, searchTerm]);
  
  const formatRupiah = (number: number) => {
    if (number === null || typeof number === 'undefined' || isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
  };

  const handleFormSuccess = useCallback((newOrUpdatedShipment: Shipment) => {
    onUpdate(); // Re-fetch data on parent component
    setIsFormOpen(false);
    setEditingShipment(undefined);
  }, [onUpdate]);
  
  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false);
    setEditingShipment(undefined);
  }, []);
  
  const onDelete = async (shipmentId: string) => {
    setIsDeleting(shipmentId);
    try {
        await deleteShipment(shipmentId);
        onUpdate();
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
    if (user?.role !== 'admin' && cart.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Keranjang Kosong',
            description: 'Silakan tambahkan produk dari etalase terlebih dahulu.',
        });
        router.push('/products');
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

  const handleSelectAll = (checked: boolean) => {
      if(checked) {
          setSelectedShipments(filteredShipments.filter(s => s.status === 'Proses').map(s => s.id));
      } else {
          setSelectedShipments([]);
      }
  }

  const handleSelectSingle = (shipmentId: string, checked: boolean) => {
      if(checked) {
          setSelectedShipments(prev => [...prev, shipmentId]);
      } else {
          setSelectedShipments(prev => prev.filter(id => id !== shipmentId));
      }
  }

  const handleProcessToPackaging = async () => {
    if (selectedShipments.length === 0) {
        toast({ variant: 'destructive', title: 'Tidak Ada Terpilih', description: 'Pilih setidaknya satu pengiriman untuk diproses.' });
        return;
    }
    setIsProcessing(true);
    try {
        await processShipmentsToPackaging(selectedShipments, user);
        toast({ title: 'Sukses!', description: `${selectedShipments.length} pengiriman telah dipindahkan ke antrian pengemasan.` });
        onUpdate();
        setSelectedShipments([]);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal memproses.';
        toast({ variant: 'destructive', title: 'Gagal Memproses', description: message });
    } finally {
        setIsProcessing(false);
    }
  };

  const shipmentsInProcess = filteredShipments.filter(s => s.status === 'Proses');
  const isAdminView = user?.role === 'admin';

  const getUserName = (userId: string) => {
    return allUsers.find(u => u.id === userId)?.username || '...';
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className='w-full md:w-auto'>
            {isAdminView && (
                <Input 
                    placeholder="Cari No. Transaksi, Pelanggan, atau Produk..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-80"
                />
            )}
        </div>
        <div className="flex justify-end gap-2 w-full md:w-auto">
         {isAdminView && (
            <Button onClick={handleProcessToPackaging} disabled={selectedShipments.length === 0 || isProcessing} className="w-full md:w-auto">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                Proses ke Pengemasan ({selectedShipments.length})
            </Button>
         )}
         {!isAdminView && (
            <Button onClick={handleOpenForm} className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Pengiriman
            </Button>
         )}
        </div>
      </div>


      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
               <TableHead className="w-[50px]">
                {isAdminView && (
                    <Checkbox 
                        onCheckedChange={handleSelectAll}
                        checked={shipmentsInProcess.length > 0 && selectedShipments.length === shipmentsInProcess.length && shipmentsInProcess.length > 0}
                        aria-label="Pilih semua"
                    />
                )}
              </TableHead>
              <TableHead>No. Transaksi</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Pelanggan</TableHead>
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
            {filteredShipments.length > 0 ? (
              filteredShipments.map((shipment) => (
                <TableRow key={shipment.id} data-state={selectedShipments.includes(shipment.id) ? 'selected' : ''} className={isAdminView && shipment.status === 'Proses' ? "cursor-pointer" : ""} onClick={() => isAdminView && shipment.status === 'Proses' && handleSelectSingle(shipment.id, !selectedShipments.includes(shipment.id))}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {shipment.status === 'Proses' && isAdminView && (
                        <Checkbox
                            checked={selectedShipments.includes(shipment.id)}
                            onCheckedChange={(checked) => handleSelectSingle(shipment.id, !!checked)}
                            aria-label={`Pilih pengiriman ${shipment.transactionId}`}
                        />
                    )}
                  </TableCell>
                  <TableCell>{shipment.transactionId}</TableCell>
                  <TableCell>{getUserName(shipment.userId)}</TableCell>
                  <TableCell>{shipment.customerName}</TableCell>
                  <TableCell>{shipment.expedition}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(shipment.status)}>
                        {shipment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {shipment.receipt ? (
                      <Button variant="link" className="p-0 h-auto" onClick={(e) => { e.stopPropagation(); openPdf(shipment.receipt!.dataUrl);}}>
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
                           <Image
                            src={p.imageUrl || 'https://placehold.co/100x100.png'}
                            alt={p.name}
                            width={32}
                            height={32}
                            className="rounded-md object-cover h-8 w-8"
                           />
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
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                  Tidak ada data pengiriman yang cocok dengan filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {shipments.length > 0 && <TableCaption>Daftar semua pengiriman barang masuk yang Anda buat.</TableCaption>}
        </Table>
      </div>

       <Dialog open={isFormOpen} onOpenChange={(open) => {
          if(!open) handleFormCancel();
          setIsFormOpen(open);
        }}>
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
  );
}

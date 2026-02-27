
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Shipment, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Loader2, Package, Pencil, CheckCircle } from 'lucide-react';
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
import { useAuth } from '@/context/auth-context';
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
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
     setShipments(initialShipments);
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
    if (number === null || typeof number === 'undefined' || isNaN(number)) return '-';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
  };

  const handleFormSuccess = useCallback((newOrUpdatedShipment: Shipment) => {
    onUpdate(); 
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
            description: 'Data pesanan berhasil dihapus.',
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

  const handleOpenForm = () => {
    setEditingShipment(undefined);
    setIsFormOpen(true);
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
        toast({ variant: 'destructive', title: 'Tidak Ada Terpilih', description: 'Pilih setidaknya satu pesanan untuk diproses.' });
        return;
    }
    setIsProcessing(true);
    try {
        await processShipmentsToPackaging(selectedShipments, user);
        toast({ title: 'Sukses!', description: `${selectedShipments.length} pesanan telah Anda ambil untuk diproses.` });
        onUpdate();
        setSelectedShipments([]);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal memproses.';
        toast({ variant: 'destructive', title: 'Gagal Memproses', description: message });
    } finally {
        setIsProcessing(false);
    }
  };

  const isAdminView = user?.role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className='w-full md:w-auto'>
            <Input 
                placeholder="Cari No. Transaksi, Pelanggan, atau Produk..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full md:w-80"
            />
        </div>
        <div className="flex justify-end gap-2 w-full md:w-auto">
            {isAdminView ? (
                <Button onClick={handleOpenForm} variant="default" className="w-full md:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Pesanan
                </Button>
            ) : (
                <Button onClick={handleProcessToPackaging} disabled={selectedShipments.length === 0 || isProcessing} className="w-full md:w-auto">
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Terima Pesanan ({selectedShipments.length})
                </Button>
            )}
        </div>
      </div>


      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
               <TableHead className="w-[50px]">
                <Checkbox 
                    onCheckedChange={handleSelectAll}
                    checked={filteredShipments.length > 0 && selectedShipments.length === filteredShipments.length}
                    aria-label="Pilih semua"
                />
              </TableHead>
              <TableHead>No. Transaksi</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Ukuran Badan</TableHead>
              <TableHead>DP</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShipments.length > 0 ? (
              filteredShipments.map((shipment) => (
                <TableRow key={shipment.id} data-state={selectedShipments.includes(shipment.id) ? 'selected' : ''} className="cursor-pointer" onClick={() => handleSelectSingle(shipment.id, !selectedShipments.includes(shipment.id))}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={selectedShipments.includes(shipment.id)}
                        onCheckedChange={(checked) => handleSelectSingle(shipment.id, !!checked)}
                        aria-label={`Pilih pesanan ${shipment.transactionId}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono">{shipment.transactionId}</TableCell>
                  <TableCell>{shipment.customerName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {shipment.products.map((p, index) => (
                        <Badge key={index} variant="secondary" className="font-normal">
                          {p.name} (x{p.quantity})
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {shipment.bodyMeasurements ? (
                      <Badge variant="outline" className="font-normal whitespace-pre-wrap max-w-xs">{typeof shipment.bodyMeasurements === 'string' ? shipment.bodyMeasurements : JSON.stringify(shipment.bodyMeasurements, null, 2)}</Badge>
                    ) : (
                      <span className='text-xs text-muted-foreground'>-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{formatRupiah(shipment.downPayment || 0)}</TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(shipment.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(shipment.status)}>
                        {shipment.status === 'Proses' ? 'Baru' : shipment.status}
                    </Badge>
                  </TableCell>
                   <TableCell>
                    {isClient ? (
                        format(new Date(shipment.createdAt), 'dd MMM yyyy', { locale: id })
                    ) : (
                        <Skeleton className="h-4 w-3/4" />
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                     {isAdminView && shipment.status === 'Proses' && (
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(shipment)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                     )}
                    {isAdminView && (
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
                                Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data pesanan secara permanen.
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
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  Tidak ada pesanan baru yang tersedia saat ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableCaption>Daftar semua pesanan masuk yang menunggu untuk diproses.</TableCaption>
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
            />
          </DialogContent>
        </Dialog>
    </div>
  );
}

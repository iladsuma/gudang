'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Shipment, BodyMeasurements } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Loader2, Pencil, CheckCircle, Printer, DollarSign } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { deleteShipment, processShipmentsToPackaging } from '@/lib/data';
import { useAuth } from '@/context/auth-context';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function ShipmentsClient({ shipments: initialShipments, onUpdate }: { shipments: Shipment[], onUpdate: () => void; }) {
  const { user } = useAuth();
  const [shipments, setShipments] = useState(initialShipments);
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
        toast({ title: 'Sukses!', description: 'Data pesanan berhasil dihapus.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Kesalahan', description: error instanceof Error ? error.message : 'Terjadi kesalahan.' });
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
  };
  
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
  };

  const handleSelectSingle = (shipmentId: string, checked: boolean) => {
      if(checked) {
          setSelectedShipments(prev => [...prev, shipmentId]);
      } else {
          setSelectedShipments(prev => prev.filter(id => id !== shipmentId));
      }
  };

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
        toast({ variant: 'destructive', title: 'Gagal Memproses', description: error instanceof Error ? error.message : 'Terjadi kesalahan.' });
    } finally {
        setIsProcessing(false);
    }
  };

  const formatMeasurements = (m?: BodyMeasurements) => {
      if (!m) return '-';
      const parts = [];
      if (m.ld) parts.push(`LD:${m.ld}`);
      if (m.lp) parts.push(`LP:${m.lp}`);
      if (m.lPanggul) parts.push(`Pg:${m.lPanggul}`);
      if (m.lBahu) parts.push(`Bh:${m.lBahu}`);
      if (m.pLengan) parts.push(`Ln:${m.pLengan}`);
      if (m.pBaju) parts.push(`Bj:${m.pBaju}`);
      return parts.join(' | ') || '-';
  };

  const handlePrintReceipt = (shipment: Shipment) => {
    try {
        const doc = new jsPDF({
            unit: 'mm',
            format: [80, 200]
        }) as jsPDFWithAutoTable;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('BUTIK ANITA', 40, 10, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Jl. Raya Butik No. 123', 40, 15, { align: 'center' });
        doc.text('------------------------------------------', 40, 18, { align: 'center' });

        doc.text(`Tgl: ${format(new Date(shipment.createdAt), 'dd/MM/yy HH:mm')}`, 5, 23);
        doc.text(`No: ${shipment.transactionId}`, 5, 27);
        doc.text(`Cust: ${shipment.customerName}`, 5, 31);
        doc.text('------------------------------------------', 40, 34, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.text('UKURAN BADAN (cm):', 5, 39);
        doc.setFont('helvetica', 'normal');
        const m = shipment.bodyMeasurements;
        doc.text(`LD: ${m?.ld || '-'} | LP: ${m?.lp || '-'} | Bahu: ${m?.lBahu || '-'}`, 5, 43);
        doc.text(`Panggul: ${m?.lPanggul || '-'} | Lengan: ${m?.pLengan || '-'} | Baju: ${m?.pBaju || '-'}`, 5, 47);
        if (m?.notes) doc.text(`Catatan: ${m.notes}`, 5, 51, { maxWidth: 70 });

        doc.text('------------------------------------------', 40, 55, { align: 'center' });
        
        let yPos = 60;
        shipment.products.forEach(p => {
            doc.text(`${p.name} (x${p.quantity})`, 5, yPos);
            doc.text(formatRupiah(p.price * p.quantity), 75, yPos, { align: 'right' });
            yPos += 4;
        });

        doc.text('------------------------------------------', 40, yPos, { align: 'center' });
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL:', 5, yPos);
        doc.text(formatRupiah(shipment.totalAmount), 75, yPos, { align: 'right' });
        yPos += 4;
        doc.text('DP:', 5, yPos);
        doc.text(`-${formatRupiah(shipment.downPayment || 0)}`, 75, yPos, { align: 'right' });
        yPos += 5;
        doc.setFontSize(10);
        doc.text('SISA BAYAR:', 5, yPos);
        doc.text(formatRupiah(shipment.totalAmount - (shipment.downPayment || 0)), 75, yPos, { align: 'right' });

        yPos += 10;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Simpan struk ini untuk pengambilan.', 40, yPos, { align: 'center' });
        yPos += 4;
        doc.text('Terima Kasih', 40, yPos, { align: 'center' });

        window.open(doc.output('bloburl'), '_blank');
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Gagal mencetak struk' });
    }
  };

  const isAdminView = user?.role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className='w-full md:w-auto'>
            <Input 
                placeholder="Cari No. Pesanan, Pelanggan, atau Jenis Jahitan..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full md:w-80"
            />
        </div>
        <div className="flex justify-end gap-2 w-full md:w-auto">
            {isAdminView ? (
                <Button onClick={handleOpenForm} variant="default" className="w-full md:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Pesanan Baru
                </Button>
            ) : (
                <Button onClick={handleProcessToPackaging} disabled={selectedShipments.length === 0 || isProcessing} className="w-full md:w-auto">
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Terima Pekerjaan ({selectedShipments.length})
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
              <TableHead>No. Pesanan</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Item Pesanan</TableHead>
              <TableHead>Ukuran (cm)</TableHead>
              <TableHead>Pembayaran</TableHead>
              <TableHead className="text-right">Total Tagihan</TableHead>
              <TableHead>Status Jahit</TableHead>
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
                  <TableCell className="font-mono text-xs">{shipment.transactionId}</TableCell>
                  <TableCell className="font-medium">{shipment.customerName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {shipment.products.map((p, index) => (
                        <span key={index} className="text-xs">
                          • {p.name} (x{p.quantity})
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="text-xs max-w-[150px] truncate cursor-help bg-muted px-2 py-1 rounded">
                                    {formatMeasurements(shipment.bodyMeasurements)}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="space-y-1 text-xs">
                                    <p>LD: {shipment.bodyMeasurements?.ld || '-'}</p>
                                    <p>LP: {shipment.bodyMeasurements?.lp || '-'}</p>
                                    <p>Panggul: {shipment.bodyMeasurements?.lPanggul || '-'}</p>
                                    <p>Bahu: {shipment.bodyMeasurements?.lBahu || '-'}</p>
                                    <p>Lengan: {shipment.bodyMeasurements?.pLengan || '-'}</p>
                                    <p>Baju: {shipment.bodyMeasurements?.pBaju || '-'}</p>
                                    {shipment.bodyMeasurements?.notes && <p className="border-t mt-1 pt-1 italic">{shipment.bodyMeasurements.notes}</p>}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={shipment.paymentStatus === 'Lunas' ? 'default' : 'destructive'} className="w-fit text-[10px]">
                            {shipment.paymentStatus === 'Lunas' ? 'LUNAS' : 'BELUM LUNAS'}
                        </Badge>
                        {(shipment.downPayment || 0) > 0 && shipment.paymentStatus !== 'Lunas' && (
                            <span className="text-[10px] text-muted-foreground">DP: {formatRupiah(shipment.downPayment || 0)}</span>
                        )}
                      </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatRupiah(shipment.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(shipment.status)}>
                        {shipment.status === 'Proses' ? 'Baru' : shipment.status === 'Pengemasan' ? 'Sedang Dijahit' : shipment.status}
                    </Badge>
                  </TableCell>
                   <TableCell className="text-xs">
                    {isClient ? (
                        format(new Date(shipment.createdAt), 'dd/MM/yy', { locale: id })
                    ) : (
                        <Skeleton className="h-4 w-12" />
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                     <div className='flex gap-1 justify-end'>
                        <Button variant="ghost" size="icon" onClick={() => handlePrintReceipt(shipment)} title="Cetak Struk">
                            <Printer className="h-4 w-4" />
                        </Button>
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
                                <AlertDialogTitle>Hapus Data Pesanan?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tindakan ini tidak dapat dibatalkan. Seluruh informasi pesanan dan ukuran pelanggan akan terhapus.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => onDelete(shipment.id)}
                                        disabled={!!isDeleting}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Hapus Permanen
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        )}
                     </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  Belum ada pesanan masuk yang tersedia.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableCaption>Daftar pesanan butik yang menunggu untuk dikerjakan oleh tim penjahit.</TableCaption>
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
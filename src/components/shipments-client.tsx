
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Shipment, BodyMeasurements, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Loader2, Pencil, Printer, Send, UserCheck, ChevronDown, ZoomIn, CheckCircle, XCircle } from 'lucide-react';
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
  DialogTrigger,
  DialogTitle,
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
import { deleteShipment, offerShipmentsToTailors, acceptShipments, rejectShipments } from '@/lib/data';
import { useAuth } from '@/context/auth-context';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { cn } from '@/lib/utils';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

interface ShipmentsClientProps {
    shipments: Shipment[];
    allUsers: User[];
    onUpdate: () => void;
}

function ImagePreview({ src, category }: { src: string | null, category: string }) {
    if (!src) return null;
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="relative h-8 w-8 rounded border bg-muted flex items-center justify-center overflow-hidden cursor-zoom-in group shrink-0">
                    <img src={src} alt={category} className="h-8 w-8 object-cover group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ZoomIn className="h-3 w-3 text-white" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl flex items-center justify-center p-1 bg-transparent border-none shadow-none">
                <DialogTitle className="sr-only">Pratinjau Gambar {category}</DialogTitle>
                <img src={src} alt={category} className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain" />
            </DialogContent>
        </Dialog>
    );
}

export function ShipmentsClient({ shipments: initialShipments, allUsers, onUpdate }: ShipmentsClientProps) {
  const { user: currentUser } = useAuth();
  const [shipments, setShipments] = useState(initialShipments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingShipment, setEditingShipment] = useState<Shipment | undefined>(undefined);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

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
          setSelectedShipments(filteredShipments.map(s => s.id));
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

  const handleAdminOffer = async () => {
    if (selectedShipments.length === 0) {
        toast({ variant: 'destructive', title: 'Tidak Ada Terpilih', description: 'Pilih setidaknya satu pesanan.' });
        return;
    }
    if (selectedAssigneeIds.length === 0) {
        toast({ variant: 'destructive', title: 'Penjahit Belum Dipilih', description: 'Silakan pilih minimal satu penjahit.' });
        return;
    }

    setIsProcessing(true);
    try {
        const targetUsers = allUsers.filter(u => selectedAssigneeIds.includes(u.id));
        await offerShipmentsToTailors(selectedShipments, targetUsers);
        toast({ 
            title: 'Tawaran Terkirim!', 
            description: `${selectedShipments.length} pesanan telah dikirimkan ke tim penjahit untuk ditinjau.` 
        });
        onUpdate();
        setSelectedShipments([]);
        setSelectedAssigneeIds([]);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan saat mengirim tawaran.' });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleTailorAccept = async () => {
    if (selectedShipments.length === 0) return;
    setIsProcessing(true);
    try {
        await acceptShipments(selectedShipments);
        toast({ title: 'Tawaran Diterima!', description: 'Pesanan telah masuk ke daftar pengerjaan Anda.' });
        onUpdate();
        setSelectedShipments([]);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal' });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleTailorReject = async () => {
    if (selectedShipments.length === 0) return;
    setIsProcessing(true);
    try {
        await rejectShipments(selectedShipments);
        toast({ title: 'Tawaran Ditolak', description: 'Pesanan telah dikembalikan ke pemilik butik.' });
        onUpdate();
        setSelectedShipments([]);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal' });
    } finally {
        setIsProcessing(false);
    }
  };

  const formatMeasurements = (m?: BodyMeasurements) => {
      if (!m) return '-';
      const parts = [];
      if (m.ld) parts.push(`LD:${m.ld}`);
      if (m.lp) parts.push(`LP:${m.lp}`);
      if (m.lingkarHip) parts.push(`Hip:${m.lingkarHip}`);
      if (m.lBahu) parts.push(`Bh:${m.lBahu}`);
      if (m.pLengan) parts.push(`Ln:${m.pLengan}`);
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
        doc.text('Sistem Manajemen Pesanan', 40, 15, { align: 'center' });
        doc.text('------------------------------------------', 40, 18, { align: 'center' });

        doc.text(`Tgl: ${format(new Date(shipment.createdAt), 'dd/MM/yy HH:mm')}`, 5, 23);
        doc.text(`No: ${shipment.transactionId}`, 5, 27);
        doc.text(`Cust: ${shipment.customerName}`, 5, 31);
        doc.text('------------------------------------------', 40, 34, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.text('UKURAN BADAN (cm):', 5, 39);
        doc.setFont('helvetica', 'normal');
        const m = shipment.bodyMeasurements;
        doc.text(`LD: ${m?.ld || '-'} | LP: ${m?.lp || '-'} | Pjg. Punggung: ${m?.panjangPunggung || '-'}`, 5, 43);
        doc.text(`Lebar Bahu: ${m?.lBahu || '-'} | Pjg. Lengan: ${m?.pLengan || '-'}`, 5, 47);
        doc.text(`Hip: ${m?.lingkarHip || '-'} | T. Hip: ${m?.tinggiHip || '-'} | T. Duduk: ${m?.tinggiDuduk || '-'}`, 5, 51);
        doc.text(`Pjg Bawah: ${m?.pBawah || '-'} | Lbr Bawah: ${m?.lBawah || '-'}`, 5, 55);
        if (m?.notes) doc.text(`Catatan: ${m.notes}`, 5, 59, { maxWidth: 70 });

        doc.text('------------------------------------------', 40, 65, { align: 'center' });
        
        let yPos = 70;
        shipment.products.forEach(p => {
            doc.text(`${p.name} (x${p.quantity})`, 5, yPos);
            doc.text(formatRupiah(p.price * p.quantity), 75, yPos, { align: 'right' });
            yPos += 4;
            if (p.notes) {
                doc.setFontSize(6);
                doc.text(`Ket: ${p.notes}`, 7, yPos, { maxWidth: 65 });
                doc.setFontSize(8);
                yPos += 3;
            }
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

  const isAdminView = currentUser?.role === 'admin';
  const penjahitList = allUsers.filter(u => u.role === 'user');

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
        <div className="flex flex-wrap justify-end gap-2 w-full md:w-auto">
            {isAdminView ? (
                <>
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[200px] justify-between">
                                    <div className="flex items-center gap-2 truncate">
                                        <UserCheck className="h-4 w-4" />
                                        {selectedAssigneeIds.length > 0 
                                            ? `${selectedAssigneeIds.length} Penjahit` 
                                            : "Pilih Penjahit"}
                                    </div>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[250px] p-2" align="start">
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">Daftar Tim Penjahit</p>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {penjahitList.map(u => (
                                            <div 
                                                key={u.id} 
                                                className={cn(
                                                    "flex items-center space-x-2 rounded-md p-2 hover:bg-muted cursor-pointer transition-colors",
                                                    selectedAssigneeIds.includes(u.id) && "bg-primary/5"
                                                )}
                                                onClick={() => {
                                                    if (selectedAssigneeIds.includes(u.id)) {
                                                        setSelectedAssigneeIds(prev => prev.filter(id => id !== u.id));
                                                    } else {
                                                        setSelectedAssigneeIds(prev => [...prev, u.id]);
                                                    }
                                                }}
                                            >
                                                <Checkbox 
                                                    checked={selectedAssigneeIds.includes(u.id)}
                                                    onCheckedChange={() => {}} 
                                                />
                                                <span className="text-sm font-medium">{u.username}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedAssigneeIds.length > 0 && (
                                        <div className="pt-2 border-t mt-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="w-full text-xs" 
                                                onClick={() => setSelectedAssigneeIds([])}
                                            >
                                                Hapus Pilihan
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button 
                            onClick={handleAdminOffer} 
                            disabled={selectedShipments.length === 0 || selectedAssigneeIds.length === 0 || isProcessing}
                            variant="secondary"
                        >
                             {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                             Kirim Tawaran ({selectedShipments.length})
                        </Button>
                    </div>
                    <Button onClick={handleOpenForm} variant="default">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah Pesanan Baru
                    </Button>
                </>
            ) : (
                <div className='flex gap-2'>
                    <Button 
                        onClick={handleTailorReject} 
                        disabled={selectedShipments.length === 0 || isProcessing} 
                        variant="destructive"
                    >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                        Tolak ({selectedShipments.length})
                    </Button>
                    <Button 
                        onClick={handleTailorAccept} 
                        disabled={selectedShipments.length === 0 || isProcessing}
                    >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Terima ({selectedShipments.length})
                    </Button>
                </div>
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
              <TableHead>Item Pesanan & Ket</TableHead>
              <TableHead>Ukuran Ringkas</TableHead>
              {isAdminView && <TableHead>Pembayaran</TableHead>}
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
                    <div className="flex flex-col gap-2">
                      {shipment.products.map((p, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <ImagePreview src={p.imageUrl} category={p.name} />
                          <div className="flex flex-col">
                            <span className="font-medium">{p.name} (x{p.quantity})</span>
                            {p.notes && <span className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">{p.notes}</span>}
                          </div>
                        </div>
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
                            <TooltipContent className="w-80">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                    <p className="font-semibold col-span-2 border-b pb-1 mb-1">DETAIL UKURAN (cm)</p>
                                    <p>LD: <span className="font-medium">{shipment.bodyMeasurements?.ld || '-'}</span></p>
                                    <p>Pjg. Punggung: <span className="font-medium">{shipment.bodyMeasurements?.panjangPunggung || '-'}</span></p>
                                    <p>Lebar Bahu: <span className="font-medium">{shipment.bodyMeasurements?.lBahu || '-'}</span></p>
                                    <p>Pjg. Lengan: <span className="font-medium">{shipment.bodyMeasurements?.pLengan || '-'}</span></p>
                                    <p>Lk. Telapak: <span className="font-medium">{shipment.bodyMeasurements?.lingkarTelapakTangan || '-'}</span></p>
                                    <p>Lingkar Pinggang: <span className="font-medium">{shipment.bodyMeasurements?.lp || '-'}</span></p>
                                    <p>Lingkar Hip: <span className="font-medium">{shipment.bodyMeasurements?.lingkarHip || '-'}</span></p>
                                    <p>Tinggi Hip: <span className="font-medium">{shipment.bodyMeasurements?.tinggiHip || '-'}</span></p>
                                    <p>Tinggi Duduk: <span className="font-medium">{shipment.bodyMeasurements?.tinggiDuduk || '-'}</span></p>
                                    <p>Pjg Rok/Cln: <span className="font-medium">{shipment.bodyMeasurements?.pBawah || '-'}</span></p>
                                    <p>Lbr Rok/Cln: <span className="font-medium">{shipment.bodyMeasurements?.lBawah || '-'}</span></p>
                                    {shipment.bodyMeasurements?.notes && (
                                        <div className="col-span-2 border-t mt-1 pt-1 italic text-muted-foreground">
                                            {shipment.bodyMeasurements.notes}
                                        </div>
                                    )}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {isAdminView && (
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
                  )}
                  <TableCell className="text-right font-bold">{formatRupiah(shipment.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(shipment.status)}>
                        {shipment.status === 'Proses' ? 'Tawaran' : shipment.status === 'Pengemasan' ? 'Sedang Dijahit' : shipment.status}
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
                        {isAdminView && (
                            <>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(shipment)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
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
                            </>
                        )}
                     </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isAdminView ? 10 : 9} className="h-24 text-center text-muted-foreground">
                  {isAdminView ? "Belum ada pesanan baru yang masuk." : "Anda tidak memiliki tawaran pengerjaan saat ini."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableCaption>Sistem konfirmasi penugasan antara Pemilik dan Tim Penjahit.</TableCaption>
        </Table>
      </div>

       <Dialog open={isFormOpen} onOpenChange={(open) => {
          if(!open) handleFormCancel();
          setIsFormOpen(open);
        }}>
          <DialogContent className="sm:max-w-5xl">
            <DialogTitle className="sr-only">Formulir Pesanan</DialogTitle>
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

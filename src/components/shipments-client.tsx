'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Shipment, BodyMeasurements, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Loader2, Pencil, Printer, Send, UserCheck, ChevronDown, ZoomIn, CheckCircle, XCircle, Info } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function ShipmentsClient({ shipments: initialShipments, allUsers, onUpdate }: { shipments: Shipment[], allUsers: User[], onUpdate: () => void }) {
  const { user: currentUser } = useAuth();
  const [shipments, setShipments] = useState(initialShipments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingShipment, setEditingShipment] = useState<Shipment | undefined>(undefined);
  const { toast } = useToast();
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [isAssignPopoverOpen, setIsAssignPopoverOpen] = useState(false);

  useEffect(() => {
     setShipments(initialShipments);
     setSelectedShipments(prev => prev.filter(id => initialShipments.some(s => s.id === id)));
  }, [initialShipments]);

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
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const handleFormSuccess = () => {
    onUpdate(); 
    setIsFormOpen(false);
    setEditingShipment(undefined);
  };
  
  const handleAssignToTailors = async () => {
      if (selectedShipments.length === 0 || selectedAssigneeIds.length === 0) return;
      
      setIsProcessing(true);
      try {
          const tailors = allUsers.filter(u => selectedAssigneeIds.includes(u.id));
          await offerShipmentsToTailors(selectedShipments, tailors);
          toast({ title: 'Berhasil', description: `Tugas telah dikirim ke ${selectedAssigneeIds.length} penjahit.` });
          setIsAssignPopoverOpen(false);
          setSelectedShipments([]);
          setSelectedAssigneeIds([]);
          onUpdate();
      } catch (error) {
          toast({ variant: 'destructive', title: 'Gagal menugaskan', description: String(error) });
      } finally {
          setIsProcessing(false);
      }
  };

  const onDelete = async (shipmentId: string) => {
    setIsDeleting(shipmentId);
    try {
        await deleteShipment(shipmentId);
        onUpdate();
        toast({ title: 'Sukses!', description: 'Pesanan dihapus.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Kesalahan' });
    } finally {
        setIsDeleting(null);
    }
  };

  const formatSummaryMeasurements = (m?: BodyMeasurements) => {
      if (!m) return '-';
      const parts = [];
      if (m.ld) parts.push(`LD:${m.ld}`);
      if (m.lp) parts.push(`LP:${m.lp}`);
      if (m.pLengan) parts.push(`Ln:${m.pLengan}`);
      return parts.join(' | ') || '-';
  };

  const isAdminView = currentUser?.role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Input 
            placeholder="Cari Pesanan / Pelanggan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-xs h-9 text-xs"
        />
        <div className="flex gap-2 w-full sm:w-auto">
            {isAdminView ? (
                <div className="flex gap-2 w-full">
                    <Popover open={isAssignPopoverOpen} onOpenChange={setIsAssignPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" disabled={selectedShipments.length === 0 || isProcessing} className="h-9 text-xs flex-1 sm:flex-none">
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                Tugaskan ({selectedShipments.length})
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3">
                            <div className="space-y-4">
                                <p className="text-sm font-bold border-b pb-2">Pilih Tim Penjahit</p>
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    {allUsers.filter(u => u.role === 'user').map(u => (
                                        <div key={u.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`user-${u.id}`} 
                                                checked={selectedAssigneeIds.includes(u.id)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedAssigneeIds(prev => checked ? [...prev, u.id] : prev.filter(id => id !== u.id));
                                                }}
                                            />
                                            <Label htmlFor={`user-${u.id}`} className="text-xs cursor-pointer">{u.username}</Label>
                                        </div>
                                    ))}
                                    {allUsers.filter(u => u.role === 'user').length === 0 && (
                                        <p className="text-[10px] text-muted-foreground italic text-center py-2">Belum ada akun penjahit.</p>
                                    )}
                                </div>
                                <Button 
                                    className="w-full h-8 text-xs" 
                                    disabled={selectedAssigneeIds.length === 0 || isProcessing}
                                    onClick={handleAssignToTailors}
                                >
                                    Kirim Penugasan
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button onClick={() => { setEditingShipment(undefined); setIsFormOpen(true); }} className="flex-1 sm:flex-none h-9 text-xs">
                        <PlusCircle className="mr-1 h-4 w-4" /> Pesanan Baru
                    </Button>
                </div>
            ) : (
                <div className="flex gap-2 w-full">
                    <Button variant="destructive" onClick={async () => {
                        setIsProcessing(true);
                        try {
                            await rejectShipments(selectedShipments);
                            onUpdate();
                            setSelectedShipments([]);
                        } finally {
                            setIsProcessing(false);
                        }
                    }} disabled={selectedShipments.length === 0 || isProcessing} className="flex-1 h-9 text-xs">Tolak</Button>
                    <Button onClick={async () => {
                        setIsProcessing(true);
                        try {
                            await acceptShipments(selectedShipments);
                            onUpdate();
                            setSelectedShipments([]);
                        } finally {
                            setIsProcessing(false);
                        }
                    }} disabled={selectedShipments.length === 0 || isProcessing} className="flex-1 h-9 text-xs">Terima</Button>
                </div>
            )}
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
               <TableHead className="w-[40px]"><Checkbox onCheckedChange={(c) => setSelectedShipments(c ? filteredShipments.map(s => s.id) : [])} checked={filteredShipments.length > 0 && selectedShipments.length === filteredShipments.length} /></TableHead>
              <TableHead className="whitespace-nowrap">No. Pesanan</TableHead>
              <TableHead className="whitespace-nowrap">Pelanggan</TableHead>
              <TableHead className="whitespace-nowrap">Item Pesanan</TableHead>
              <TableHead className="whitespace-nowrap">Detail Ukuran / Model</TableHead>
              <TableHead className="text-right whitespace-nowrap">Total Tagihan</TableHead>
              <TableHead className="text-right whitespace-nowrap">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShipments.length > 0 ? (
              filteredShipments.map((shipment) => (
                <TableRow key={shipment.id} className="cursor-pointer" onClick={() => setSelectedShipments(prev => prev.includes(shipment.id) ? prev.filter(id => id !== shipment.id) : [...prev, shipment.id])}>
                  <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedShipments.includes(shipment.id)} onCheckedChange={(c) => setSelectedShipments(prev => c ? [...prev, shipment.id] : prev.filter(id => id !== shipment.id))} /></TableCell>
                  <TableCell className="font-mono text-[10px]">{shipment.transactionId}</TableCell>
                  <TableCell className="font-bold text-xs">{shipment.customerName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-[10px]">
                      {shipment.products.map((p, i) => (
                        <div key={i} className="flex items-center gap-1">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-muted-foreground">x{p.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                      <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground border-b border-dotted w-fit">
                                      <Info className="h-3 w-3" />
                                      {formatSummaryMeasurements(shipment.bodyMeasurements)}
                                  </div>
                              </TooltipTrigger>
                              <TooltipContent className="w-64 p-3 text-[10px]">
                                  <div className="space-y-2">
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                          <p className="font-bold border-b col-span-2 uppercase mb-1">Ukuran Badan</p>
                                          <p>LD: {shipment.bodyMeasurements?.ld || '-'}</p>
                                          <p>LP: {shipment.bodyMeasurements?.lp || '-'}</p>
                                          <p>P. Punggung: {shipment.bodyMeasurements?.panjangPunggung || '-'}</p>
                                          <p>L. Bahu: {shipment.bodyMeasurements?.lBahu || '-'}</p>
                                          <p>P. Lengan: {shipment.bodyMeasurements?.pLengan || '-'}</p>
                                          <p>Hip: {shipment.bodyMeasurements?.lingkarHip || '-'}</p>
                                          <p>P. Bawah: {shipment.bodyMeasurements?.pBawah || '-'}</p>
                                      </div>
                                      {shipment.bodyMeasurements?.notes && (
                                          <div className="pt-2 border-t mt-2">
                                              <p className="font-bold uppercase mb-1">Catatan Model</p>
                                              <p className="italic">{shipment.bodyMeasurements.notes}</p>
                                          </div>
                                      )}
                                  </div>
                              </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right font-bold text-xs text-primary">{formatRupiah(shipment.totalAmount)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                     <div className='flex gap-1 justify-end'>
                        {isAdminView && (
                            <>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingShipment(shipment); setIsFormOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled={isDeleting === shipment.id}>
                                            {isDeleting === shipment.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Hapus Pesanan?</AlertDialogTitle>
                                            <AlertDialogDescription>Data pesanan {shipment.transactionId} akan dihapus permanen.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onDelete(shipment.id)} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
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
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-xs">Tidak ada data pesanan baru.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="p-0 sm:max-w-4xl border-none">
            <ShipmentForm
              key={editingShipment ? editingShipment.id : 'new'}
              shipmentToEdit={editingShipment}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
    </div>
  );
}
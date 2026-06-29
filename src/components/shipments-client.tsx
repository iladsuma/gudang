
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
                <Button onClick={() => { setEditingShipment(undefined); setIsFormOpen(true); }} className="flex-1 sm:flex-none h-9 text-xs">
                    <PlusCircle className="mr-1 h-4 w-4" /> Pesanan Baru
                </Button>
            ) : (
                <div className="flex gap-2 w-full">
                    <Button variant="destructive" onClick={async () => {
                        setIsProcessing(true);
                        await rejectShipments(selectedShipments);
                        onUpdate();
                        setSelectedShipments([]);
                        setIsProcessing(false);
                    }} disabled={selectedShipments.length === 0 || isProcessing} className="flex-1 h-9 text-xs">Tolak</Button>
                    <Button onClick={async () => {
                        setIsProcessing(true);
                        await acceptShipments(selectedShipments);
                        onUpdate();
                        setSelectedShipments([]);
                        setIsProcessing(false);
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
              <TableHead className="whitespace-nowrap">Item</TableHead>
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
                  <TableCell className="text-right font-bold text-xs text-primary">{formatRupiah(shipment.totalAmount)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                     <div className='flex gap-1 justify-end'>
                        {isAdminView && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingShipment(shipment); setIsFormOpen(true); }}><Pencil className="h-3 w-3" /></Button>}
                     </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-xs">Tidak ada data.</TableCell></TableRow>
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

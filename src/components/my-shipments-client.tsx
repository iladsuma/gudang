
'use client';

import * as React from 'react';
import type { Shipment, BodyMeasurements } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowRight, FileText, CheckCircle, Loader2, ZoomIn } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { processShipmentsToDelivered } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

function ImagePreview({ src, category }: { src: string | null, category: string }) {
    if (!src) return null;
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="relative h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden cursor-zoom-in group shrink-0">
                    <img src={src} alt={category} className="h-10 w-10 object-cover group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ZoomIn className="h-3 w-3 text-white" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl flex items-center justify-center p-1 bg-transparent border-none shadow-none">
                <img src={src} alt={category} className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain" />
            </DialogContent>
        </Dialog>
    );
}

export function MyShipmentsClient({ shipments: initialShipments, onUpdate }: { shipments: Shipment[], onUpdate?: () => void }) {
  const [shipments, setShipments] = React.useState(initialShipments);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    setShipments(initialShipments);
  }, [initialShipments]);
  
  const filteredShipments = React.useMemo(() => {
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
  
  const getStatusVariant = (status: Shipment['status']) => {
    switch (status) {
        case 'Proses': return 'secondary';
        case 'Pengemasan': return 'default';
        case 'Terkirim': return 'outline';
        default: return 'secondary';
    }
  };

  const handleMarkAsDone = async (shipmentId: string) => {
    setIsProcessing(shipmentId);
    try {
        await processShipmentsToDelivered([shipmentId]);
        toast({ title: 'Sukses', description: 'Pesanan telah ditandai sebagai selesai.' });
        if (onUpdate) onUpdate();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan.' });
    } finally {
        setIsProcessing(null);
    }
  }

  const formatSummaryMeasurements = (m?: BodyMeasurements) => {
      if (!m) return '-';
      const parts = [];
      if (m.ld) parts.push(`LD:${m.ld}`);
      if (m.lp) parts.push(`LP:${m.lp}`);
      if (m.pLengan) parts.push(`Ln:${m.pLengan}`);
      return parts.join('|') || '-';
  };

  return (
    <div className='space-y-4'>
        <div className="flex justify-end">
            <Input 
                placeholder="Cari pesanan..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full md:w-80"
            />
        </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Transaksi</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Produk & Detail</TableHead>
              <TableHead>Ukuran (Hover)</TableHead>
              <TableHead>Status Jahit</TableHead>
              <TableHead className="text-right">Total Tagihan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShipments.length > 0 ? (
              filteredShipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell className='font-medium font-mono text-xs'>{shipment.transactionId}</TableCell>
                  <TableCell>{shipment.customerName}</TableCell>
                  <TableCell>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1" className='border-b-0'>
                            <AccordionTrigger className='py-0 font-normal hover:no-underline'>
                                {shipment.totalItems} item
                            </AccordionTrigger>
                            <AccordionContent className='pt-2'>
                                <div className='flex flex-col gap-3 text-xs'>
                                {shipment.products && shipment.products.map((product, idx) => (
                                    <div key={idx} className='flex items-start gap-2 border-l-2 border-primary/20 pl-2 py-1'>
                                        <ImagePreview src={product.imageUrl} category={product.name} />
                                        <div className="flex flex-col">
                                            <p className="font-bold">{product.name} (x{product.quantity})</p>
                                            {product.notes && <p className="text-muted-foreground italic">Ket: {product.notes}</p>}
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className='text-[10px] cursor-help border-b border-dotted'>
                                    {formatSummaryMeasurements(shipment.bodyMeasurements)}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className="w-64">
                                <div className="grid grid-cols-2 gap-1 text-[10px]">
                                    <p className="font-bold col-span-2 border-b mb-1 uppercase">Detail Ukuran</p>
                                    <p>LD: {shipment.bodyMeasurements?.ld || '-'}</p>
                                    <p>Pjg. Punggung: {shipment.bodyMeasurements?.panjangPunggung || '-'}</p>
                                    <p>Lbr. Bahu: {shipment.bodyMeasurements?.lBahu || '-'}</p>
                                    <p>Pjg. Lengan: {shipment.bodyMeasurements?.pLengan || '-'}</p>
                                    <p>Lk. Pinggang: {shipment.bodyMeasurements?.lp || '-'}</p>
                                    <p>Lk. Hip: {shipment.bodyMeasurements?.lingkarHip || '-'}</p>
                                    <p>T. Hip: {shipment.bodyMeasurements?.tinggiHip || '-'}</p>
                                    <p>T. Duduk: {shipment.bodyMeasurements?.tinggiDuduk || '-'}</p>
                                    <p>Pjg Bawah: {shipment.bodyMeasurements?.pBawah || '-'}</p>
                                    <p>Lbr Bawah: {shipment.bodyMeasurements?.lBawah || '-'}</p>
                                    {shipment.bodyMeasurements?.notes && <p className="col-span-2 italic text-muted-foreground border-t pt-1 mt-1">{shipment.bodyMeasurements.notes}</p>}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                   <TableCell>
                      <Badge variant={getStatusVariant(shipment.status)}>
                          {shipment.status === 'Pengemasan' ? 'Sedang Dijahit' : shipment.status === 'Terkirim' ? 'Selesai' : shipment.status}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(shipment.totalAmount)}</TableCell>
                  <TableCell className="text-right">
                      {shipment.status === 'Pengemasan' && (
                          <Button size="sm" onClick={() => handleMarkAsDone(shipment.id)} disabled={!!isProcessing}>
                              {isProcessing === shipment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                              Selesaikan
                          </Button>
                      )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Tidak ada pesanan yang sedang Anda kerjakan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import type { Shipment } from '@/lib/types';
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
import { ArrowRight, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { processShipmentsToDelivered } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

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
              <TableHead>Produk</TableHead>
              <TableHead>Ukuran</TableHead>
              <TableHead>Pembayaran</TableHead>
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
                                <div className='flex flex-col gap-1 text-xs text-muted-foreground'>
                                {shipment.products && shipment.products.map(product => (
                                    <div key={product.productId} className='flex items-center gap-2'>
                                        <ArrowRight className='h-3 w-3'/>
                                        <Badge variant="outline">{product.name} (x{product.quantity})</Badge>
                                    </div>
                                ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                  </TableCell>
                  <TableCell>
                      <span className='text-[10px] whitespace-pre-wrap'>{typeof shipment.bodyMeasurements === 'string' ? shipment.bodyMeasurements : `LD:${shipment.bodyMeasurements?.ld || '-'} | LP:${shipment.bodyMeasurements?.lp || '-'}`}</span>
                  </TableCell>
                  <TableCell>
                      <Badge variant={shipment.paymentStatus === 'Lunas' ? 'default' : 'destructive'} className="text-[10px]">
                          {shipment.paymentStatus === 'Lunas' ? 'LUNAS' : 'BELUM LUNAS'}
                      </Badge>
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
                <TableCell colSpan={8} className="h-24 text-center">
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
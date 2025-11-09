
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
import { ArrowRight, FileText } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function MyShipmentsClient({ shipments: initialShipments }: { shipments: Shipment[] }) {
  const [shipments, setShipments] = React.useState(initialShipments);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    setShipments(initialShipments);
  }, [initialShipments]);
  
  const filteredShipments = React.useMemo(() => {
    if (!searchTerm) return shipments;
    const lowercasedFilter = searchTerm.toLowerCase();
    return shipments.filter(shipment =>
        shipment.transactionId.toLowerCase().includes(lowercasedFilter) ||
        shipment.customerName.toLowerCase().includes(lowercasedFilter) ||
        shipment.expedition.toLowerCase().includes(lowercasedFilter) ||
        shipment.products.some(p => p.name.toLowerCase().includes(lowercasedFilter))
    );
  }, [shipments, searchTerm]);
  
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {}).format(number);
  };
  
  const getStatusVariant = (status: Shipment['status']) => {
    switch (status) {
        case 'Proses': return 'secondary';
        case 'Pengemasan': return 'default';
        case 'Terkirim': return 'outline';
        default: return 'secondary';
    }
  };

  const openPdf = (dataUrl: string) => {
    const pdfWindow = window.open("");
    pdfWindow?.document.write(`<iframe width='100%' height='100%' src='${dataUrl}' title='pratinjau-pdf'></iframe>`);
  };

  return (
    <div className='space-y-4'>
        <div className="flex justify-end">
            <Input 
                placeholder="Cari transaksi..."
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
              <TableHead>Tanggal Dibuat</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Detail Produk</TableHead>
              <TableHead>Resi</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShipments.length > 0 ? (
              filteredShipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell className='font-medium font-mono'>{shipment.transactionId}</TableCell>
                  <TableCell>{format(new Date(shipment.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}</TableCell>
                  <TableCell>{shipment.customerName}</TableCell>
                   <TableCell>
                      <Badge variant={getStatusVariant(shipment.status)}>
                          {shipment.status}
                      </Badge>
                  </TableCell>
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
                    {shipment.receipt ? (
                      <Button variant="link" className="p-0 h-auto" onClick={() => openPdf(shipment.receipt!.dataUrl)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Lihat
                      </Button>
                    ) : (
                      <span className='text-xs text-muted-foreground'>-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(shipment.totalAmount)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Anda belum membuat pengiriman apapun.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

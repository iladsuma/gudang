

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
  TableCaption,
} from '@/components/ui/table';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';
import { Badge } from './ui/badge';

export function InvoicesClient({ shipments: initialShipments }: { shipments: Shipment[] }) {
  const [shipments, setShipments] = React.useState(initialShipments);

  React.useEffect(() => {
    setShipments(initialShipments);
  }, [initialShipments]);
  
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
  };
  
  return (
    <div className='space-y-4'>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Transaksi</TableHead>
              <TableHead>User Pemroses</TableHead>
              <TableHead>Detail Pengiriman</TableHead>
              <TableHead>Tanggal Diproses</TableHead>
              <TableHead className="text-right">Total Nilai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.length > 0 ? (
              shipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell className='font-medium'>{shipment.transactionId}</TableCell>
                  <TableCell>{shipment.user}</TableCell>
                  <TableCell className="font-medium">
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
                  <TableCell>{format(new Date(shipment.createdAt), 'PPpp', { locale: id })}</TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(shipment.totalAmount)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Belum ada pengiriman yang selesai.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {shipments.length > 0 && <TableCaption>Daftar semua pengiriman yang sudah terkirim.</TableCaption>}
        </Table>
      </div>
    </div>
  );
}

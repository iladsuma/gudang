'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Checkout } from '@/lib/types';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { ArrowRight } from 'lucide-react';

export function HistoryClient({ initialHistory }: { initialHistory: Checkout[] }) {
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const formatRupiah = (number: number) => {
        if (!number || number === 0) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Detail Batch</TableHead>
                        <TableHead>User Pemroses</TableHead>
                        <TableHead className="text-right">Total Nilai Batch</TableHead>
                        <TableHead>Tanggal Diproses</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialHistory.length > 0 ? (
                        initialHistory.map((batch) => (
                            <TableRow key={batch.id}>
                                <TableCell className="font-medium">
                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="item-1" className='border-b-0'>
                                            <AccordionTrigger className='py-0 font-normal'>
                                                {batch.processedShipments.length} pengiriman diproses
                                            </AccordionTrigger>
                                            <AccordionContent className='pt-2'>
                                               <div className='flex flex-col gap-1 text-xs text-muted-foreground'>
                                                {batch.processedShipments.map(shipment => (
                                                    <div key={shipment.transactionId} className='flex items-center gap-2'>
                                                        <ArrowRight className='h-3 w-3'/>
                                                        <span>{shipment.transactionId} ({formatRupiah(shipment.totalAmount)})</span>
                                                    </div>
                                                ))}
                                               </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </TableCell>
                                <TableCell>{batch.processorName}</TableCell>
                                <TableCell className="text-right font-medium">{formatRupiah(batch.totalBatchAmount)}</TableCell>
                                <TableCell>
                                    {isClient ? (
                                        format(new Date(batch.createdAt), 'PPpp', { locale: id })
                                    ) : (
                                        <Skeleton className="h-4 w-3/4" />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Tidak ada riwayat. Proses pengiriman untuk menambah data.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                {initialHistory.length > 0 && (
                    <TableCaption>Daftar semua batch pemrosesan yang sudah dilakukan.</TableCaption>
                )}
            </Table>
        </div>
    );
}
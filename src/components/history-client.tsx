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
                        <TableHead>No. Transaksi</TableHead>
                        <TableHead>User Pemroses</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">Total Nilai</TableHead>
                        <TableHead>Tanggal Diproses</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialHistory.length > 0 ? (
                        initialHistory.map((checkout) => (
                            <TableRow key={checkout.id}>
                                <TableCell className="font-medium">{checkout.transactionId}</TableCell>
                                <TableCell>{checkout.customerName}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                    {checkout.items.map((p, index) => (
                                        <Badge key={index} variant="secondary">
                                        {p.name} (x{p.quantity})
                                        </Badge>
                                    ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">{formatRupiah(checkout.totalAmount)}</TableCell>
                                <TableCell>
                                    {isClient ? (
                                        format(new Date(checkout.createdAt), 'PPpp', { locale: id })
                                    ) : (
                                        <Skeleton className="h-4 w-3/4" />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                Tidak ada riwayat. Proses pengiriman untuk menambah data.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                {initialHistory.length > 0 && (
                    <TableCaption>Daftar semua pengiriman yang sudah diproses.</TableCaption>
                )}
            </Table>
        </div>
    );
}



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
import type { Shipment } from '@/lib/types';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Loader2, Package } from 'lucide-react';
import { processShipmentsToPackaging } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import Image from 'next/image';

interface HistoryClientProps {
    initialShipments: Shipment[];
    onSuccess: (processedIds: string[]) => void;
}

export function HistoryClient({ initialShipments, onSuccess }: HistoryClientProps) {
    const { toast } = useToast();
    const [isClient, setIsClient] = React.useState(false);
    const [shipments, setShipments] = React.useState(initialShipments);
    const [selectedShipments, setSelectedShipments] = React.useState<string[]>([]);
    const [isProcessing, setIsProcessing] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
        setShipments(initialShipments);
    }, [initialShipments]);

    const formatRupiah = (number: number) => {
        if (!number || number === 0) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedShipments(shipments.map((s) => s.id));
        } else {
            setSelectedShipments([]);
        }
    };

    const handleSelectSingle = (shipmentId: string, checked: boolean) => {
        if (checked) {
            setSelectedShipments((prev) => [...prev, shipmentId]);
        } else {
            setSelectedShipments((prev) => prev.filter((id) => id !== shipmentId));
        }
    };

    const handleProcessToPackaging = async () => {
        if (selectedShipments.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Tidak Ada Pengiriman Terpilih',
                description: 'Pilih setidaknya satu pengiriman untuk dibungkus.'
            });
            return;
        }

        setIsProcessing(true);
        try {
            await processShipmentsToPackaging(selectedShipments);
            toast({
                title: 'Sukses!',
                description: 'Data terpilih berhasil diproses dan status diubah menjadi "Pengemasan".'
            });
            onSuccess(selectedShipments);
            setSelectedShipments([]);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
            toast({
                variant: 'destructive',
                title: 'Gagal Memproses',
                description: message
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className='space-y-4'>
            <div className="flex justify-end gap-2">
                <Button onClick={handleProcessToPackaging} disabled={selectedShipments.length === 0 || isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                    Bungkus ({selectedShipments.length})
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={shipments.length > 0 && selectedShipments.length === shipments.length}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Pilih semua"
                                />
                            </TableHead>
                            <TableHead>No. Transaksi</TableHead>
                            <TableHead>Ekspedisi</TableHead>
                            <TableHead>User Pembuat</TableHead>
                            <TableHead>Produk</TableHead>
                            <TableHead className="text-right">Total Nilai</TableHead>
                            <TableHead>Tanggal Dibuat</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shipments.length > 0 ? (
                            shipments.map((shipment) => (
                                <TableRow key={shipment.id} data-state={selectedShipments.includes(shipment.id) ? 'selected' : ''}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedShipments.includes(shipment.id)}
                                            onCheckedChange={(checked) => handleSelectSingle(shipment.id, !!checked)}
                                            aria-label={`Pilih pengiriman ${shipment.transactionId}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{shipment.transactionId}</TableCell>
                                    <TableCell>{shipment.expedition}</TableCell>
                                    <TableCell>{shipment.user}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-2">
                                            {shipment.products.map((p, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Image
                                                                src={p.imageUrl || 'https://placehold.co/100x100.png'}
                                                                alt={p.name}
                                                                width={32}
                                                                height={32}
                                                                className="rounded-md object-cover h-8 w-8 cursor-pointer"
                                                                data-ai-hint="product image"
                                                            />
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-md">
                                                            <DialogHeader>
                                                                <DialogTitle>{p.name || 'Pratinjau Gambar'}</DialogTitle>
                                                            </DialogHeader>
                                                            <Image
                                                                src={p.imageUrl || 'https://placehold.co/600x400.png'}
                                                                alt={p.name}
                                                                width={600}
                                                                height={400}
                                                                className="rounded-md object-contain"
                                                                data-ai-hint="product image preview"
                                                            />
                                                        </DialogContent>
                                                    </Dialog>
                                                    <Badge variant="secondary">
                                                        {p.name} (x{p.quantity})
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{formatRupiah(shipment.totalAmount)}</TableCell>
                                    <TableCell>
                                        {isClient ? (
                                            format(new Date(shipment.createdAt), 'PPpp', { locale: id })
                                        ) : (
                                            <Skeleton className="h-4 w-3/4" />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Tidak ada pengiriman baru yang perlu dikemas.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    {shipments.length > 0 && (
                        <TableCaption>Daftar semua pengiriman yang siap untuk dikemas.</TableCaption>
                    )}
                </Table>
            </div>
        </div>
    );
}

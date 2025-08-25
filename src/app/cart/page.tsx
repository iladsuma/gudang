
'use client';

import * as React from 'react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ShipmentForm } from '@/components/shipment-form';
import type { Shipment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function CartPage() {
    const { cart, removeFromCart, clearCart, totalItems } = useCart();
    const router = useRouter();
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = React.useState(false);


    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number);
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            toast({
                variant: 'destructive',
                title: "Keranjang kosong",
                description: "Silakan tambahkan produk dari etalase."
            });
            return;
        }
        setIsFormOpen(true);
    };
    
    const handleFormSuccess = React.useCallback((newShipment: Shipment) => {
        clearCart();
        setIsFormOpen(false);
        toast({
            title: "Pengiriman Dibuat!",
            description: `Data pengiriman ${newShipment.transactionId} berhasil disimpan.`,
        });
        router.push('/shipments');
    }, [clearCart, router, toast]);

    const handleFormCancel = React.useCallback(() => {
        setIsFormOpen(false);
    }, []);


    const subtotal = React.useMemo(() => {
        // Subtotal calculation ignores quantity, as it's determined in the next step.
        return cart.reduce((acc, item) => acc + item.price, 0);
    }, [cart]);

    return (
        <>
        <div className="container mx-auto p-4 md:p-8">
            <div className="mb-6">
                <Button asChild variant="outline" size="sm">
                    <Link href="/products">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Etalase
                    </Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Keranjang Anda</CardTitle>
                    <CardDescription>
                        Periksa item Anda sebelum melanjutkan ke proses rekapitulasi pengiriman. Kuantitas akan diisi di langkah berikutnya.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {cart.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Produk</TableHead>
                                    <TableHead>Detail</TableHead>
                                    <TableHead className="text-right w-[150px]">Harga Satuan</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cart.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.name}
                                                width={64}
                                                height={64}
                                                className="w-16 h-16 rounded-md object-cover"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{item.code}</p>
                                        </TableCell>
                                        <TableCell className="text-right">{formatRupiah(item.price)}</TableCell>
                                        <TableCell>
                                            <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-16">
                            <h3 className="text-lg font-medium">Keranjang Anda masih kosong.</h3>
                            <p className="text-muted-foreground">Mulai belanja dari halaman etalase.</p>
                        </div>
                    )}
                </CardContent>
                {cart.length > 0 && (
                    <CardFooter className="flex justify-end items-center gap-4 bg-muted/50 p-6">
                        <div className='text-right'>
                           <p className='text-muted-foreground'>Total ({totalItems} jenis item)</p>
                           <p className='text-xl font-bold'>{formatRupiah(subtotal)}</p>
                        </div>
                        <Button size="lg" onClick={handleCheckout}>
                            Lanjut ke Rekap Pengiriman
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-4xl">
                 <ShipmentForm
                    key="new-shipment-from-cart"
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                    initialProductsFromCart={cart}
                />
            </DialogContent>
        </Dialog>
        </>
    );
}

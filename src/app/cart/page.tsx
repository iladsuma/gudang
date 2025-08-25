
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
import type { Shipment, CartItem, ProductSelection } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

export default function CartPage() {
    const { cart, removeFromCart } = useCart();
    const router = useRouter();
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [selection, setSelection] = React.useState<ProductSelection>({});

    const handleSelectionChange = (productId: string, checked: boolean) => {
        setSelection(prev => ({ ...prev, [productId]: checked }));
    };

    const handleSelectAll = (checked: boolean) => {
        const newSelection: ProductSelection = {};
        if (checked) {
            cart.forEach(item => newSelection[item.id] = true);
        }
        setSelection(newSelection);
    };

    const selectedItems = React.useMemo(() => {
        return cart.filter(item => selection[item.id]);
    }, [cart, selection]);

    const selectedCount = selectedItems.length;

    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number);
    };

    const handleCheckout = () => {
        if (selectedItems.length === 0) {
            toast({
                variant: 'destructive',
                title: "Tidak ada item terpilih",
                description: "Silakan pilih produk yang ingin direkap."
            });
            return;
        }
        setIsFormOpen(true);
    };
    
    const handleFormSuccess = React.useCallback((newShipment: Shipment) => {
        // Logika untuk menghapus item terpilih dari keranjang, jika diinginkan, bisa ditambahkan di sini.
        // Saat ini, item tetap di keranjang sesuai permintaan.
        setSelection({});
        setIsFormOpen(false);
        toast({
            title: "Pengiriman Dibuat!",
            description: `Data pengiriman ${newShipment.transactionId} berhasil disimpan.`,
        });
        router.push('/shipments');
    }, [router, toast]);

    const handleFormCancel = React.useCallback(() => {
        setIsFormOpen(false);
    }, []);

    const subtotal = React.useMemo(() => {
        return selectedItems.reduce((acc, item) => acc + item.price, 0);
    }, [selectedItems]);

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
                        Pilih produk yang ingin Anda rekap, lalu lanjutkan ke proses berikutnya.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {cart.length > 0 ? (
                        <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={cart.length > 0 && selectedCount === cart.length}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[100px]">Produk</TableHead>
                                    <TableHead>Detail</TableHead>
                                    <TableHead className="text-right w-[150px]">Harga Satuan</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cart.map(item => (
                                    <TableRow 
                                        key={item.id} 
                                        data-state={selection[item.id] ? 'selected' : ''}
                                        onClick={() => handleSelectionChange(item.id, !selection[item.id])}
                                        className="cursor-pointer"
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selection[item.id] || false}
                                                onCheckedChange={(checked) => handleSelectionChange(item.id, !!checked)}
                                            />
                                        </TableCell>
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
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
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
                           <p className='text-muted-foreground'>Total Dipilih ({selectedCount} jenis item)</p>
                           <p className='text-xl font-bold'>{formatRupiah(subtotal)}</p>
                        </div>
                        <Button size="lg" onClick={handleCheckout} disabled={selectedCount === 0}>
                            Lanjut ke Rekap Pengiriman ({selectedCount})
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
                    initialProductsFromCart={selectedItems}
                />
            </DialogContent>
        </Dialog>
        </>
    );
}

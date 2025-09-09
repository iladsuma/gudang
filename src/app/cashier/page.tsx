
'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getProducts, getCustomers, processDirectSale } from '@/lib/data';
import type { Product, Customer, ShipmentProduct, Shipment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Search, ShoppingCart, Trash2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const formatRupiah = (number: number) => {
    if (isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
};

export default function CashierPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    // Data states
    const [products, setProducts] = React.useState<Product[]>([]);
    const [customers, setCustomers] = React.useState<Customer[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);

    // Transaction states
    const [cart, setCart] = React.useState<ShipmentProduct[]>([]);
    const [selectedCustomer, setSelectedCustomer] = React.useState<string>('');
    const [openProductSelector, setOpenProductSelector] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [lastTransaction, setLastTransaction] = React.useState<Shipment | null>(null);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = React.useState(false);

    // Load initial data
    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }

        if (user?.role === 'admin') {
            const fetchData = async () => {
                setDataLoading(true);
                const [productsData, customersData] = await Promise.all([getProducts(), getCustomers()]);
                setProducts(productsData);
                setCustomers(customersData);
                // Set default customer to "Pelanggan Umum"
                const generalCustomer = customersData.find(c => c.name.toLowerCase() === 'pelanggan umum');
                if (generalCustomer) {
                    setSelectedCustomer(generalCustomer.id);
                }
                setDataLoading(false);
            };
            fetchData();
        }
    }, [user, authLoading, router]);

    const addProductToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === product.id);
            if (existingItem) {
                if (existingItem.quantity < product.stock) {
                    return prevCart.map(item =>
                        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
                    );
                } else {
                    toast({ variant: 'destructive', title: 'Stok Habis', description: `Stok untuk ${product.name} tidak mencukupi.` });
                    return prevCart;
                }
            } else {
                 if (product.stock > 0) {
                    return [...prevCart, {
                        productId: product.id,
                        code: product.code,
                        name: product.name,
                        quantity: 1,
                        price: product.price,
                        costPrice: product.costPrice,
                        imageUrl: product.imageUrl,
                    }];
                 } else {
                    toast({ variant: 'destructive', title: 'Stok Habis', description: `Stok untuk ${product.name} adalah 0.` });
                    return prevCart;
                 }
            }
        });
        setOpenProductSelector(false); // Close popover after selection
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        const product = products.find(p => p.id === productId);
        setCart(prevCart => {
            if (newQuantity <= 0) {
                return prevCart.filter(item => item.productId !== productId);
            }
            if (product && newQuantity > product.stock) {
                 toast({ variant: 'destructive', title: 'Stok Tidak Cukup', description: `Sisa stok ${product.name} hanya ${product.stock}.` });
                 return prevCart.map(item => item.productId === productId ? { ...item, quantity: product.stock } : item);
            }
            return prevCart.map(item => item.productId === productId ? { ...item, quantity: newQuantity } : item);
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prevCart => prevCart.filter(item => item.productId !== productId));
    };

    const totalAmount = React.useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [cart]);

    const handleNewTransaction = () => {
        setCart([]);
        setIsSuccessDialogOpen(false);
        setLastTransaction(null);
         const generalCustomer = customers.find(c => c.name.toLowerCase() === 'pelanggan umum');
        if (generalCustomer) {
            setSelectedCustomer(generalCustomer.id);
        }
    };
    
    const handleSubmit = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Gagal', description: 'User tidak ditemukan.' });
            return;
        }
        if (cart.length === 0) {
            toast({ variant: 'destructive', title: 'Keranjang Kosong', description: 'Tambahkan produk terlebih dahulu.' });
            return;
        }
        if (!selectedCustomer) {
            toast({ variant: 'destructive', title: 'Pelanggan Belum Dipilih', description: 'Silakan pilih pelanggan.' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const result = await processDirectSale(user, selectedCustomer, cart);
            // Success
            setLastTransaction(result);
            setIsSuccessDialogOpen(true);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.';
            toast({ variant: 'destructive', title: 'Gagal', description: message });
        } finally {
            setIsSubmitting(false);
        }
    };


    if (authLoading || (dataLoading && user?.role === 'admin')) {
        return <div className="container mx-auto p-4 md:p-8"><Skeleton className="h-[80vh] w-full" /></div>;
    }
  
    if (!user || user.role !== 'admin') {
       return <div className="flex h-screen w-full items-center justify-center"><p>Anda tidak memiliki akses. Mengalihkan...</p></div>;
    }

    return (
        <>
        <div className="container mx-auto p-4 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side - Product Selection & Cart */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                <CardTitle>Kasir Penjualan Langsung</CardTitle>
                                <CardDescription>Pilih produk untuk memulai transaksi baru.</CardDescription>
                                </div>
                                 <Popover open={openProductSelector} onOpenChange={setOpenProductSelector}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline"><Search className="mr-2 h-4 w-4" /> Cari & Tambah Produk</Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Ketik nama atau kode produk..." />
                                            <CommandList>
                                                <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                                                <CommandGroup>
                                                    {products.map((product) => (
                                                        <CommandItem key={product.id} value={`${product.name} ${product.code}`} onSelect={() => addProductToCart(product)}>
                                                            <div className="flex justify-between w-full">
                                                                <span>{product.name}</span>
                                                                <span className="text-muted-foreground">{formatRupiah(product.price)}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border min-h-[40vh]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">Produk</TableHead>
                                            <TableHead>Detail</TableHead>
                                            <TableHead className="w-[120px]">Jumlah</TableHead>
                                            <TableHead className="w-[150px] text-right">Subtotal</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cart.length > 0 ? (
                                            cart.map(item => (
                                                <TableRow key={item.productId}>
                                                    <TableCell>
                                                        <Image src={item.imageUrl || ''} alt={item.name} width={48} height={48} className="h-12 w-12 rounded-md object-cover" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="font-medium">{item.name}</p>
                                                        <p className="text-sm text-muted-foreground">{formatRupiah(item.price)} / pcs</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input 
                                                            type="number" 
                                                            value={item.quantity} 
                                                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value, 10))}
                                                            className="w-24"
                                                            min="1"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">{formatRupiah(item.price * item.quantity)}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.productId)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-48 text-center">
                                                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                                                    <p className="text-muted-foreground">Keranjang masih kosong</p>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side - Summary & Checkout */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle>Ringkasan Transaksi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label htmlFor="customer-select" className="text-sm font-medium">Pelanggan</label>
                                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                    <SelectTrigger id="customer-select">
                                        <SelectValue placeholder="Pilih pelanggan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between text-lg font-medium">
                                    <span>Total</span>
                                    <span>{formatRupiah(totalAmount)}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className="w-full" 
                                size="lg" 
                                onClick={handleSubmit} 
                                disabled={isSubmitting || cart.length === 0}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                Selesaikan Transaksi
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>

        <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="items-center text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <DialogTitle className="text-2xl">Transaksi Berhasil!</DialogTitle>
                    <DialogDescription>
                        Transaksi {lastTransaction?.transactionId} telah berhasil disimpan.
                    </DialogDescription>
                </DialogHeader>
                 <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                    <div className="flex justify-between"><p>Total Belanja:</p> <p className="font-medium">{formatRupiah(lastTransaction?.totalAmount || 0)}</p></div>
                    <div className="flex justify-between"><p>Pelanggan:</p> <p className="font-medium">{lastTransaction?.customerName}</p></div>
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button onClick={handleNewTransaction} size="lg">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Buat Transaksi Baru
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}

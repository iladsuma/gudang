
'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getProducts, updateProductStock, getStockMovements } from '@/lib/data';
import type { Product, StockMovement } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Search, Save, History } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const stockOpnameSchema = z.object({
  physicalStock: z.coerce.number().int().min(0, 'Stok fisik harus bilangan positif.'),
});

type StockOpnameFormValues = z.infer<typeof stockOpnameSchema>;

export default function StockOpnamePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    // Data states
    const [products, setProducts] = React.useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
    const [dataLoading, setDataLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [openProductSelector, setOpenProductSelector] = React.useState(false);
    
    // History states
    const [movements, setMovements] = React.useState<StockMovement[]>([]);
    const [historyLoading, setHistoryLoading] = React.useState(false);


    const form = useForm<StockOpnameFormValues>({
        resolver: zodResolver(stockOpnameSchema),
        defaultValues: {
            physicalStock: 0,
        },
    });

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }

        if (user?.role === 'admin') {
            getProducts().then(data => {
                setProducts(data);
                setDataLoading(false);
            });
        }
    }, [user, authLoading, router]);

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        form.setValue('physicalStock', product.stock); // Set initial value to current stock
        setOpenProductSelector(false);
        fetchStockHistory(product.id);
    };

    const fetchStockHistory = async (productId: string) => {
        setHistoryLoading(true);
        const data = await getStockMovements(productId);
        // We only want to see opnames and initial stock here for clarity
        const filteredMovements = data.filter(m => m.type === 'Stok Opname' || m.type === 'Stok Awal');
        setMovements(filteredMovements);
        setHistoryLoading(false);
    };

    const onSubmit = async (data: StockOpnameFormValues) => {
        if (!selectedProduct) {
            toast({ variant: 'destructive', title: 'Produk Belum Dipilih' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const updatedProduct = await updateProductStock(selectedProduct.id, data.physicalStock);
            toast({ title: 'Sukses!', description: `Stok untuk ${updatedProduct.name} telah diperbarui.` });
            
            // Update local state to reflect change
            setSelectedProduct(updatedProduct);
            setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
            fetchStockHistory(updatedProduct.id); // Refresh history

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.';
            toast({ variant: 'destructive', title: 'Gagal', description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const stockInBook = selectedProduct?.stock ?? 0;
    const physicalStock = form.watch('physicalStock') ?? 0;
    const difference = physicalStock - stockInBook;


    if (authLoading || (dataLoading && user?.role === 'admin')) {
        return <div className="container mx-auto p-4 md:p-8"><Skeleton className="h-[80vh] w-full" /></div>;
    }
  
    if (!user || user.role !== 'admin') {
       return <div className="flex h-screen w-full items-center justify-center"><p>Anda tidak memiliki akses. Mengalihkan...</p></div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Formulir Stok Opname</CardTitle>
                            <CardDescription>Gunakan form ini untuk menyesuaikan jumlah stok produk di sistem berdasarkan perhitungan fisik.</CardDescription>
                        </CardHeader>
                        <Form {...form}>
                         <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6">
                            <Popover open={openProductSelector} onOpenChange={setOpenProductSelector}>
                                <PopoverTrigger asChild>
                                    <div className='space-y-2'>
                                        <FormLabel>Pilih Produk</FormLabel>
                                         <Button variant="outline" role="combobox" className="w-full justify-between">
                                            {selectedProduct ? `${selectedProduct.code} - ${selectedProduct.name}` : "Cari kode atau nama produk..."}
                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Ketik nama atau kode produk..." />
                                        <CommandList>
                                            <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {products.map((product) => (
                                                    <CommandItem key={product.id} value={`${product.name} ${product.code}`} onSelect={() => handleSelectProduct(product)}>
                                                        {product.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {selectedProduct && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-6">
                                     <div className='space-y-2'>
                                        <FormLabel>Stok Menurut Sistem (Buku)</FormLabel>
                                        <Input value={stockInBook} readOnly disabled />
                                     </div>
                                      <FormField
                                        control={form.control}
                                        name="physicalStock"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Stok Fisik Sebenarnya</FormLabel>
                                            <FormControl>
                                              <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <div className='space-y-2'>
                                        <FormLabel>Selisih</FormLabel>
                                        <Input value={difference} readOnly disabled className={difference !== 0 ? (difference > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold') : ''} />
                                     </div>
                                </div>
                            )}

                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={!selectedProduct || isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Simpan Penyesuaian
                            </Button>
                        </CardFooter>
                        </form>
                        </Form>
                    </Card>
                </div>
                 <div className="lg:col-span-1">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Riwayat Penyesuaian</CardTitle>
                            <CardDescription>Riwayat stok opname untuk produk terpilih.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="rounded-md border min-h-[40vh]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Stok Akhir</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {historyLoading ? (
                                        <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                                    ) : movements.length > 0 ? (
                                        movements.map(m => (
                                            <TableRow key={m.id}>
                                                <TableCell className="text-xs">{format(new Date(m.createdAt), 'dd/MM/yy')}</TableCell>
                                                <TableCell className={m.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                                                </TableCell>
                                                <TableCell className="font-bold">{m.stockAfter}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Pilih produk untuk melihat riwayat.</TableCell></TableRow>
                                    )}
                                    </TableBody>
                                </Table>
                             </div>
                        </CardContent>
                     </Card>
                 </div>
             </div>
        </div>
    );
}

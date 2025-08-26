
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Purchase, Product, Supplier, PurchaseProduct } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { getPurchases, getProducts, getSuppliers, addPurchase } from '@/lib/data';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, PlusCircle, ShoppingBag, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';

// =======================
// Zod Schema for the Form
// =======================
const purchaseProductSchema = z.object({
  productId: z.string().min(1, 'Produk harus dipilih.'),
  code: z.string(),
  name: z.string(),
  quantity: z.coerce.number().int().min(1, 'Jumlah minimal 1'),
  costPrice: z.coerce.number().min(0, 'Harga beli harus diisi'),
  imageUrl: z.string().nullable().default(null),
});

const purchaseFormSchema = z.object({
  purchaseNumber: z.string().min(1, 'Nomor Pembelian harus diisi.'),
  supplierId: z.string().min(1, 'Supplier harus dipilih.'),
  products: z.array(purchaseProductSchema).min(1, 'Minimal harus ada satu produk.'),
});

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

// =======================
// Helper & Sub-components
// =======================
const formatRupiah = (number: number) => {
    if (number === null || typeof number === 'undefined' || isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
};

const Summary = ({ control }: { control: any }) => {
    const productsValue = useWatch({ control, name: 'products' });
    const summary = useMemo(() => {
        const totalAmount = productsValue.reduce((sum: number, product: any) => sum + (product.costPrice * product.quantity || 0), 0);
        const totalItems = productsValue.reduce((sum: number, product: any) => sum + (product.quantity || 0), 0);
        return { totalAmount, totalItems };
    }, [productsValue]);

    return (
        <CardFooter className="flex flex-col items-end bg-slate-50 dark:bg-slate-900 p-4 gap-2 mt-4 rounded-b-lg">
            <div className="w-full max-w-sm space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Item Dibeli</span>
                    <span className="font-medium">{summary.totalItems} pcs</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-base font-bold">Total Pembelian</span>
                    <span className="text-base font-bold">{formatRupiah(summary.totalAmount)}</span>
                </div>
            </div>
        </CardFooter>
    );
};

// =======================
// Main Purchase Form Component
// =======================
function PurchaseForm({ allProducts, allSuppliers, onFormSuccess }: { allProducts: Product[], allSuppliers: Supplier[], onFormSuccess: () => void }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openProductSelector, setOpenProductSelector] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    const form = useForm<PurchaseFormValues>({
        resolver: zodResolver(purchaseFormSchema),
        defaultValues: {
            purchaseNumber: '',
            supplierId: '',
            products: [],
        },
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: 'products',
    });

    const addProductToForm = (product: Product) => {
        const existingProductIndex = fields.findIndex(field => field.productId === product.id);
        if (existingProductIndex !== -1) {
            const currentQuantity = form.getValues(`products.${existingProductIndex}.quantity`);
            form.setValue(`products.${existingProductIndex}.quantity`, currentQuantity + 1);
        } else {
            append({
                productId: product.id,
                code: product.code,
                name: product.name,
                quantity: 1,
                costPrice: product.costPrice,
                imageUrl: product.imageUrl,
            });
        }
        setOpenProductSelector(false); // Close popover after selection
    };

    const onSubmit = async (data: PurchaseFormValues) => {
        setIsSubmitting(true);
        try {
            const supplierName = allSuppliers.find(s => s.id === data.supplierId)?.name || 'Unknown';
            await addPurchase({ ...data, supplierName });
            toast({ title: 'Sukses!', description: 'Transaksi pembelian berhasil disimpan. Stok telah diperbarui.' });
            form.reset();
            setIsFormOpen(false);
            onFormSuccess();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
            toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Pembelian
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Form Transaksi Pembelian</DialogTitle>
                    <DialogDescription>Catat pembelian barang dari supplier untuk menambah stok.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="purchaseNumber" render={({ field }) => (
                                <FormItem><FormLabel>Nomor Pembelian / Faktur</FormLabel><FormControl><Input {...field} placeholder="cth: INV/2024/07/123" /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="supplierId" render={({ field }) => (
                                <FormItem><FormLabel>Supplier</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih supplier" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {allSuppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                <FormMessage /></FormItem>
                            )} />
                        </div>

                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">Daftar Produk Dibeli</CardTitle>
                                    <Popover open={openProductSelector} onOpenChange={setOpenProductSelector}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" size="sm">Tambah Produk</Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Cari produk..." />
                                                <CommandList>
                                                    <CommandEmpty>Tidak ada produk ditemukan.</CommandEmpty>
                                                    <CommandGroup>
                                                        {allProducts.map((product) => (
                                                            <CommandItem
                                                                key={product.id}
                                                                value={product.name}
                                                                onSelect={() => addProductToForm(product)}
                                                            >
                                                                {product.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[80px]">Produk</TableHead>
                                                <TableHead>Detail</TableHead>
                                                <TableHead className="w-[120px]">Jumlah</TableHead>
                                                <TableHead className="w-[150px]">Harga Beli (Rp)</TableHead>
                                                <TableHead className="w-[150px] text-right">Subtotal</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fields.length > 0 ? fields.map((field, index) => {
                                                const productValues = form.watch(`products.${index}`);
                                                const subtotal = productValues.costPrice * productValues.quantity;
                                                return (
                                                    <TableRow key={field.id}>
                                                        <TableCell><Image src={productValues.imageUrl || 'https://placehold.co/100x100.png'} alt={productValues.name} width={48} height={48} className="h-12 w-12 rounded-md object-cover" /></TableCell>
                                                        <TableCell><p className="font-medium">{productValues.name}</p><p className="font-mono text-xs text-muted-foreground">{productValues.code}</p></TableCell>
                                                        <TableCell>
                                                            <FormField control={form.control} name={`products.${index}.quantity`} render={({ field: qtyField }) => (
                                                                <FormItem><FormControl><Input type="number" min="1" {...qtyField} className="w-24" /></FormControl><FormMessage /></FormItem>
                                                            )} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <FormField control={form.control} name={`products.${index}.costPrice`} render={({ field: priceField }) => (
                                                                <FormItem><FormControl><Input type="number" min="0" {...priceField} className="w-32" /></FormControl><FormMessage /></FormItem>
                                                            )} />
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">{formatRupiah(subtotal || 0)}</TableCell>
                                                        <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                                    </TableRow>
                                                )
                                            }) : (
                                                <TableRow><TableCell colSpan={6} className="h-24 text-center">Belum ada produk ditambahkan.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                 <FormMessage>{form.formState.errors.products?.root?.message}</FormMessage>
                            </CardContent>
                            {fields.length > 0 && <Summary control={form.control} />}
                        </Card>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Transaksi
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// =======================
// Main Page Component
// =======================
export default function PurchasesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [dataLoading, setDataLoading] = useState(true);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);

    const fetchData = useCallback(async () => {
        setDataLoading(true);
        const [purchasesData, productsData, suppliersData] = await Promise.all([getPurchases(), getProducts(), getSuppliers()]);
        setPurchases(purchasesData);
        setAllProducts(productsData);
        setAllSuppliers(suppliersData);
        setDataLoading(false);
    }, []);

    useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }
        if (user?.role === 'admin') {
            fetchData();
        }
    }, [user, authLoading, router, fetchData]);

    if (authLoading || (dataLoading && user?.role === 'admin')) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-96 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
  
    if (!user || user.role !== 'admin') {
        return (
           <div className="flex h-screen w-full items-center justify-center">
                <p>Anda tidak memiliki akses. Mengalihkan...</p>
           </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Riwayat Transaksi Pembelian</CardTitle>
                            <CardDescription>Daftar semua pembelian barang dari supplier untuk restok.</CardDescription>
                        </div>
                        <PurchaseForm allProducts={allProducts} allSuppliers={allSuppliers} onFormSuccess={fetchData} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>No. Pembelian</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Detail Produk</TableHead>
                                    <TableHead className="text-right">Total Nilai</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dataLoading ? (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : purchases.length > 0 ? (
                                    purchases.map(purchase => (
                                        <TableRow key={purchase.id}>
                                            <TableCell className="font-mono">{purchase.purchaseNumber}</TableCell>
                                            <TableCell className="font-medium">{purchase.supplierName}</TableCell>
                                            <TableCell>{format(new Date(purchase.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}</TableCell>
                                            <TableCell>
                                                <ul className="list-disc list-inside text-xs">
                                                    {purchase.products.map(p => (
                                                        <li key={p.productId}>{p.name} (x{p.quantity})</li>
                                                    ))}
                                                </ul>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{formatRupiah(purchase.totalAmount)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center">Belum ada riwayat pembelian.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

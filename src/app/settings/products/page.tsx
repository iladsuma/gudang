'use client';

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { getProducts, addProduct, updateProduct, deleteMultipleProducts } from '@/lib/data';
import type { Product, ProductSelection, SortableProductField, SortOrder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, PlusCircle, Trash2, Pencil, ArrowLeft, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const productFormSchema = z.object({
  code: z.string().min(1, 'Kode layanan harus diisi.'),
  name: z.string().min(1, 'Nama layanan jahitan harus diisi.'),
  price: z.coerce.number().min(0, 'Harga jasa harus diisi.'),
  costPrice: z.coerce.number().min(0, 'Biaya modal harus diisi.'),
  stock: z.coerce.number().optional().default(0),
  minStock: z.coerce.number().optional().default(0),
  unit: z.string().min(1, 'Satuan harus dipilih.'),
  category: z.string().min(1, 'Jenis harus dipilih.'),
  imageUrl: z.string().nullable().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

function ProductsClient() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();

    const [selection, setSelection] = useState<ProductSelection>({});
    const [sortBy, setSortBy] = useState<SortableProductField>('code');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const units = ['PCS', 'STEL', 'SET'];
    const categories = ['Kebaya', 'Jas', 'Dress', 'Batik', 'Celana', 'Kemeja', 'Lainnya'];

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: { 
            code: '', 
            name: '', 
            price: 0, 
            costPrice: 0,
            stock: 0, 
            minStock: 0,
            unit: 'PCS',
            category: 'Kebaya',
            imageUrl: '' 
        },
    });

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const data = await getProducts();
        // Simple sorting
        const sorted = [...data].sort((a, b) => {
            const valA = a[sortBy];
            const valB = b[sortBy];
            if (sortOrder === 'asc') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });
        setProducts(sorted);
        setLoading(false);
    }, [sortBy, sortOrder]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleOpenForm = (product: Product | null) => {
        setEditingProduct(product);
        if (product) {
            form.reset({
                code: product.code,
                name: product.name,
                price: product.price,
                costPrice: product.costPrice,
                unit: product.unit,
                category: product.category,
                imageUrl: product.imageUrl || '',
            });
        } else {
            form.reset({ 
                code: `JHT-${Date.now().toString().slice(-4)}`, 
                name: '', 
                price: 0, 
                costPrice: 0,
                unit: 'PCS',
                category: 'Kebaya',
                imageUrl: '' 
            });
        }
        setIsFormOpen(true);
    };

    const onSubmit = async (data: ProductFormValues) => {
        setIsSubmitting(true);
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, data);
                toast({ title: 'Sukses', description: 'Layanan jahitan berhasil diperbarui.' });
            } else {
                await addProduct(data);
                toast({ title: 'Sukses', description: 'Layanan jahitan baru berhasil ditambahkan.' });
            }
            setIsFormOpen(false);
            fetchProducts();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Kesalahan', description: 'Gagal menyimpan data.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSort = (field: SortableProductField) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Daftar Harga Jasa Jahitan</h3>
                <Button onClick={() => handleOpenForm(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Jenis Jahitan
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('code')}>
                                <div className='flex items-center gap-2'>Kode {sortBy === 'code' && <ArrowUpDown className="h-4 w-4" />}</div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                                <div className='flex items-center gap-2'>Nama Layanan {sortBy === 'name' && <ArrowUpDown className="h-4 w-4" />}</div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                                <div className='flex items-center gap-2'>Kategori {sortBy === 'category' && <ArrowUpDown className="h-4 w-4" />}</div>
                            </TableHead>
                            <TableHead>Harga Jasa (Rp)</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                        ) : products.length > 0 ? (
                            products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-mono text-xs">{product.code}</TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell>{formatRupiah(product.price)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(product)}><Pencil className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Belum ada data jasa jahitan.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-xl">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <DialogHeader>
                                <DialogTitle>{editingProduct ? 'Edit Jenis Jahitan' : 'Tambah Jenis Jahitan Baru'}</DialogTitle>
                                <DialogDescription>Data ini digunakan sebagai referensi harga saat Anda mencatat pesanan baru.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-4 py-4">
                                <FormField control={form.control} name="code" render={({ field }) => (
                                    <FormItem><FormLabel>Kode Layanan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Nama Pakaian/Jahitan</FormLabel><FormControl><Input placeholder="Cth: Kebaya Modern Brokat" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="category" render={({ field }) => (
                                        <FormItem><FormLabel>Kategori</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        <FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="unit" render={({ field }) => (
                                        <FormItem><FormLabel>Satuan</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        <FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="price" render={({ field }) => (
                                    <FormItem><FormLabel>Harga Jasa (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="costPrice" render={({ field }) => (
                                    <FormItem><FormLabel>Estimasi Modal/Ongkos Tukang (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function ProductsSettingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user?.role !== 'admin') {
            router.push('/shipments');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="container mx-auto p-4 md:p-8 space-y-6">
                <Skeleton className="h-8 w-48" />
                 <Card><CardHeader><Skeleton className="h-9 w-1/3" /></CardHeader><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>
            </div>
        );
    }
    
    if (!user || user.role !== 'admin') {
        return <div className="flex h-screen w-full items-center justify-center"><p>Anda tidak memiliki akses. Mengalihkan...</p></div>;
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <Button asChild variant="outline">
                <Link href="/settings"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Pengaturan</Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Master Jenis Jahitan & Harga</CardTitle>
                    <CardDescription>
                        Kelola daftar layanan jahitan standar yang ditawarkan oleh butik Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductsClient />
                </CardContent>
            </Card>
        </div>
    );
}

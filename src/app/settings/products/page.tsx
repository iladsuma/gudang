
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
import { Loader2, PlusCircle, Trash2, Pencil, ArrowLeft, ArrowUpDown, Image as ImageIcon, X } from 'lucide-react';
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
import Image from 'next/image';

const productFormSchema = z.object({
  code: z.string().min(1, 'Kode harus diisi.'),
  category: z.string().min(1, 'Kategori harus dipilih.'),
  price: z.coerce.number().min(0, 'Harga jasa harus diisi.'),
  costPrice: z.coerce.number().min(0, 'Biaya modal/HPP harus diisi.'),
  unit: z.string().min(1, 'Satuan harus dipilih.'),
  imageUrl: z.string().nullable().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

function ProductsClient() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const { toast } = useToast();

    const [sortBy, setSortBy] = useState<SortableProductField>('category');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const units = ['PCS', 'STEL', 'SET'];
    const categories = ['Dress', 'Kemeja', 'Blouse', 'Gamis', 'Rok', 'Celana', 'Jas', 'Kebaya', 'Hijab', 'Aksesoris'];

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: { 
            code: '', 
            price: 0, 
            costPrice: 0,
            unit: 'PCS',
            category: 'Dress',
            imageUrl: '' 
        },
    });

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const data = await getProducts();
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
                price: product.price,
                costPrice: product.costPrice,
                unit: product.unit,
                category: product.category,
                imageUrl: product.imageUrl || '',
            });
            setPreviewImage(product.imageUrl || null);
        } else {
            form.reset({ 
                code: `JH-${Date.now().toString().slice(-4)}`, 
                price: 0, 
                costPrice: 0,
                unit: 'PCS',
                category: 'Dress',
                imageUrl: '' 
            });
            setPreviewImage(null);
        }
        setIsFormOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPreviewImage(base64String);
                form.setValue('imageUrl', base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: ProductFormValues) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                name: data.category, // Use category as the name
                stock: 0,
                minStock: 0,
            };

            if (editingProduct) {
                await updateProduct(editingProduct.id, payload);
                toast({ title: 'Sukses', description: 'Data jahitan berhasil diperbarui.' });
            } else {
                await addProduct(payload);
                toast({ title: 'Sukses', description: 'Jenis jahitan baru berhasil ditambahkan.' });
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
            setSortBy(field);
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
                <h3 className="text-lg font-medium">Daftar Jenis & Harga Jahitan</h3>
                <Button onClick={() => handleOpenForm(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Jenis Jahitan
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Gambar</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('code')}>
                                <div className='flex items-center gap-2'>Kode {sortBy === 'code' && <ArrowUpDown className="h-4 w-4" />}</div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                                <div className='flex items-center gap-2'>Kategori {sortBy === 'category' && <ArrowUpDown className="h-4 w-4" />}</div>
                            </TableHead>
                            <TableHead>Harga Jasa (Rp)</TableHead>
                            <TableHead>Modal/HPP (Rp)</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                        ) : products.length > 0 ? (
                            products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="h-12 w-12 rounded border bg-muted flex items-center justify-center overflow-hidden">
                                            {product.imageUrl ? (
                                                <Image src={product.imageUrl} alt={product.category} width={48} height={48} className="object-cover h-full w-full" />
                                            ) : (
                                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{product.code}</TableCell>
                                    <TableCell className="font-bold">{product.category}</TableCell>
                                    <TableCell className="text-primary font-semibold">{formatRupiah(product.price)}</TableCell>
                                    <TableCell className="text-muted-foreground">{formatRupiah(product.costPrice)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(product)}><Pencil className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Belum ada data jenis jahitan.</TableCell></TableRow>
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
                                <DialogDescription>Data ini digunakan sebagai referensi kategori dan harga dasar saat mencatat pesanan.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-4 py-4">
                                <div className="flex flex-col items-center gap-4 mb-4">
                                    <div className="relative h-32 w-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted group">
                                        {previewImage ? (
                                            <>
                                                <Image src={previewImage} alt="Preview" fill className="object-cover" />
                                                <button 
                                                    type="button" 
                                                    onClick={() => {setPreviewImage(null); form.setValue('imageUrl', '');}}
                                                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </>
                                        ) : (
                                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            type="file" 
                                            accept="image/*" 
                                            className="w-full max-w-xs" 
                                            onChange={handleImageChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="code" render={({ field }) => (
                                        <FormItem><FormLabel>Kode Layanan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="category" render={({ field }) => (
                                        <FormItem><FormLabel>Kategori</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih Kategori" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        <FormMessage /></FormItem>
                                    )} />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                     <FormField control={form.control} name="unit" render={({ field }) => (
                                        <FormItem><FormLabel>Satuan</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih Satuan" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        <FormMessage /></FormItem>
                                    )} />
                                    <div />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="price" render={({ field }) => (
                                        <FormItem><FormLabel>Harga Jasa (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="costPrice" render={({ field }) => (
                                        <FormItem><FormLabel>Estimasi Modal/HPP (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
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
                        Kelola daftar kategori pakaian (Dress, Kemeja, Blouse, dll) dan estimasi harga jasa dasar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductsClient />
                </CardContent>
            </Card>
        </div>
    );
}

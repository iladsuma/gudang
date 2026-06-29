
'use client';

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { getProducts, addProduct, updateProduct, deleteMultipleProducts } from '@/lib/data';
import type { Product, SortableProductField, SortOrder } from '@/lib/types';
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
import { Loader2, PlusCircle, Trash2, Pencil, ArrowUpDown, Images, X, ArrowLeft, ZoomIn } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';

const productFormSchema = z.object({
  code: z.string().min(1, 'Kode harus diisi.'),
  category: z.string().min(1, 'Kategori harus dipilih.'),
  price: z.coerce.number().min(0, 'Harga jasa harus diisi.'),
  costPrice: z.coerce.number().min(0, 'Biaya modal/HPP harus diisi.'),
  unit: z.string().min(1, 'Satuan harus dipilih.'),
  imageUrls: z.array(z.string()).default([]),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

function ProductsClient() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
            imageUrls: [] 
        },
    });

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            const sorted = [...data].sort((a, b) => {
                const valA = a[sortBy] || '';
                const valB = b[sortBy] || '';
                if (sortOrder === 'asc') return valA > valB ? 1 : -1;
                return valA < valB ? 1 : -1;
            });
            setProducts(sorted);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
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
                imageUrls: product.imageUrls || [],
            });
        } else {
            form.reset({ 
                code: `JH-${Date.now().toString().slice(-4)}`, 
                price: 0, 
                costPrice: 0,
                unit: 'PCS',
                category: 'Dress',
                imageUrls: [] 
            });
        }
        setIsFormOpen(true);
    };

    const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    const currentImages = form.getValues('imageUrls');
                    form.setValue('imageUrls', [...currentImages, base64String]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        const currentImages = form.getValues('imageUrls');
        form.setValue('imageUrls', currentImages.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: ProductFormValues) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                name: data.category,
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
            const message = error instanceof Error ? error.message : 'Gagal menyimpan data.';
            toast({ variant: 'destructive', title: 'Kesalahan', description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (ids: string[]) => {
        setIsDeleting(true);
        try {
            await deleteMultipleProducts(ids);
            toast({ title: 'Sukses', description: `${ids.length} item berhasil dihapus.` });
            setSelectedIds([]);
            fetchProducts();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Kesalahan', description: 'Gagal menghapus data.' });
        } finally {
            setIsDeleting(false);
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">Daftar Jenis & Harga Jahitan</h3>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {selectedIds.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isDeleting} className="flex-1 sm:flex-none">
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                    Hapus ({selectedIds.length})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus {selectedIds.length} item?</AlertDialogTitle>
                                    <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(selectedIds)} className="bg-destructive text-destructive-foreground">Hapus Permanen</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button onClick={() => handleOpenForm(null)} className="flex-1 sm:flex-none">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah Jenis
                    </Button>
                </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">
                                <Checkbox 
                                    checked={products.length > 0 && selectedIds.length === products.length}
                                    onCheckedChange={(checked) => setSelectedIds(checked ? products.map(p => p.id) : [])}
                                />
                            </TableHead>
                            <TableHead className="w-[100px]">Foto</TableHead>
                            <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('code')}>
                                Kode {sortBy === 'code' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                            </TableHead>
                            <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('category')}>
                                Kategori {sortBy === 'category' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                            </TableHead>
                            <TableHead className="whitespace-nowrap">Harga Jasa</TableHead>
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
                                        <Checkbox 
                                            checked={selectedIds.includes(product.id)}
                                            onCheckedChange={(checked) => setSelectedIds(prev => checked ? [...prev, product.id] : prev.filter(id => id !== product.id))}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {product.imageUrls && product.imageUrls.length > 0 ? (
                                                product.imageUrls.slice(0, 3).map((url, i) => (
                                                    <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-background overflow-hidden bg-muted">
                                                        <img src={url} alt={product.category} className="h-full w-full object-cover" />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center ring-2 ring-background">
                                                    <Images className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            {product.imageUrls && product.imageUrls.length > 3 && (
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold ring-2 ring-background">
                                                    +{product.imageUrls.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{product.code}</TableCell>
                                    <TableCell className="font-bold">{product.category}</TableCell>
                                    <TableCell className="text-primary font-semibold text-xs whitespace-nowrap">{formatRupiah(product.price)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenForm(product)}><Pencil className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Belum ada data.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <DialogHeader>
                                <DialogTitle>{editingProduct ? 'Edit Layanan' : 'Tambah Layanan Baru'}</DialogTitle>
                                <DialogDescription>Data ini digunakan sebagai referensi harga dan katalog contoh model.</DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <FormLabel>Katalog Gambar Contoh (Banyak Gambar)</FormLabel>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
                                        {form.watch('imageUrls').map((url, index) => (
                                            <div key={index} className="relative aspect-square rounded-md overflow-hidden border group bg-muted">
                                                <img src={url} alt="Preview" className="h-full w-full object-cover" />
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-0 right-0 bg-destructive text-white rounded-bl-md p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors text-muted-foreground">
                                            <PlusCircle className="h-6 w-6 mb-1" />
                                            <span className="text-[10px] font-medium">Tambah</span>
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImagesChange} />
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="price" render={({ field }) => (
                                        <FormItem><FormLabel>Harga Jasa (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="costPrice" render={({ field }) => (
                                        <FormItem><FormLabel>Estimasi HPP (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
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
                                </div>
                            </div>
                            
                            <DialogFooter className="gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="flex-1 sm:flex-none">Batal</Button>
                                <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
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
        return <div className="container mx-auto p-4 md:p-8 space-y-6"><Skeleton className="h-8 w-48" /><Card><CardHeader><Skeleton className="h-9 w-1/3" /></CardHeader><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card></div>;
    }
    
    if (!user || user.role !== 'admin') {
        return <div className="flex h-screen w-full items-center justify-center"><p>Mengalihkan...</p></div>;
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <Button asChild variant="outline" size="sm">
                <Link href="/settings"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Link>
            </Button>
            <Card>
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-xl sm:text-2xl">Master Jenis Jahitan</CardTitle>
                    <CardDescription>Kelola kategori pakaian, harga, dan katalog contoh model.</CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-6">
                    <ProductsClient />
                </CardContent>
            </Card>
        </div>
    );
}

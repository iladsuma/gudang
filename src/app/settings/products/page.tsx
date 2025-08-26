

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProducts, addProduct, deleteProduct, updateProduct, updateProductStock, getStockMovements } from '@/lib/data';
import type { Product, StockMovement } from '@/lib/types';
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
import { Loader2, PlusCircle, Trash2, Pencil, Edit, ArrowLeft, History } from 'lucide-react';
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
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const productFormSchema = z.object({
  code: z.string().min(1, 'Kode produk harus diisi.'),
  name: z.string().min(1, 'Nama produk harus diisi.'),
  price: z.coerce.number().min(0, 'Harga jual harus diisi.'),
  costPrice: z.coerce.number().min(0, 'Harga pokok harus diisi.'),
  stock: z.coerce.number().int().min(0, 'Stok harus bilangan bulat non-negatif.'),
  minStock: z.coerce.number().int().min(0, 'Stok minimal harus bilangan bulat non-negatif.'),
  unit: z.string().min(1, 'Satuan harus dipilih.'),
  category: z.string().min(1, 'Jenis harus dipilih.'),
  imageUrl: z.string().nullable().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const stockFormSchema = z.object({
    stock: z.coerce.number().int().min(0, 'Stok harus bilangan bulat non-negatif.'),
});

type StockFormValues = z.infer<typeof stockFormSchema>;


function ProductsClient() {
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
    const [stockEditProduct, setStockEditProduct] = React.useState<Product | null>(null);
    const [viewingHistoryProduct, setViewingHistoryProduct] = React.useState<Product | null>(null);
    const [stockMovements, setStockMovements] = React.useState<StockMovement[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = React.useState(false);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const imageInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Mock data for dropdowns
    const units = ['PCS', 'DUS', 'KODI', 'KOLI', 'PACK'];
    const categories = ['Pakaian', 'Aksesoris', 'Elektronik', 'Makanan', 'Minuman'];


    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: { 
            code: '', 
            name: '', 
            price: 0, 
            costPrice: 0,
            stock: 0, 
            minStock: 0,
            unit: '',
            category: '',
            imageUrl: '' 
        },
    });

    const stockForm = useForm<StockFormValues>({
        resolver: zodResolver(stockFormSchema),
        defaultValues: { stock: 0 },
    });

    const fetchProducts = React.useCallback(async () => {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setLoading(false);
    }, []);

    React.useEffect(() => {
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
                stock: product.stock,
                minStock: product.minStock,
                unit: product.unit,
                category: product.category,
                imageUrl: product.imageUrl || '',
            });
            setPreviewImage(product.imageUrl);
        } else {
            form.reset({ 
                code: '', 
                name: '', 
                price: 0, 
                costPrice: 0,
                stock: 0, 
                minStock: 0,
                unit: '',
                category: '',
                imageUrl: '' 
            });
            setPreviewImage(null);
        }
        setIsFormOpen(true);
    };

    const handleOpenStockForm = (product: Product) => {
        setStockEditProduct(product);
        stockForm.reset({ stock: product.stock });
    };

    const handleViewHistory = async (product: Product) => {
        setViewingHistoryProduct(product);
        setIsHistoryLoading(true);
        const movements = await getStockMovements(product.id);
        setStockMovements(movements);
        setIsHistoryLoading(false);
    }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'File tidak valid', description: 'Silakan pilih file gambar.' });
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            setPreviewImage(result);
            form.setValue('imageUrl', result, { shouldValidate: true });
        };
    };

    const onProductSubmit = async (data: ProductFormValues) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                imageUrl: data.imageUrl || 'https://placehold.co/100x100.png'
            };
            if (editingProduct) {
                await updateProduct(editingProduct.id, payload);
                toast({ title: 'Sukses', description: 'Produk berhasil diperbarui.' });
            } else {
                await addProduct(payload);
                toast({ title: 'Sukses', description: 'Produk berhasil ditambahkan.' });
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

    const onStockSubmit = async (data: StockFormValues) => {
        if (!stockEditProduct) return;
        setIsSubmitting(true);
        try {
            await updateProductStock(stockEditProduct.id, data.stock);
            toast({ title: 'Sukses', description: 'Stok produk berhasil diperbarui.' });
            setStockEditProduct(null); // Close dialog
            fetchProducts();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal memperbarui stok.';
            toast({ variant: 'destructive', title: 'Kesalahan', description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const onDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            await deleteProduct(id);
            toast({ title: 'Sukses', description: 'Produk berhasil dihapus.' });
            fetchProducts();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal menghapus produk.';
            toast({ variant: 'destructive', title: 'Kesalahan', description: message });
        } finally {
            setIsDeleting(null);
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
             <div className="flex items-center justify-end">
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenForm(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Produk
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onProductSubmit)}>
                                <DialogHeader>
                                    <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                    <div className="md:col-span-2 flex flex-col items-center">
                                        <FormField
                                            control={form.control}
                                            name="imageUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Gambar Produk</FormLabel>
                                                    <FormControl>
                                                        <div>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                ref={imageInputRef}
                                                                onChange={handleImageChange}
                                                                className="hidden"
                                                            />
                                                            <Image
                                                                src={previewImage || 'https://placehold.co/200x200.png'}
                                                                alt="Pratinjau"
                                                                width={128}
                                                                height={128}
                                                                className="h-32 w-32 rounded-md object-cover cursor-pointer"
                                                                onClick={() => imageInputRef.current?.click()}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                    <input type="hidden" {...field} value={field.value || ''} />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField control={form.control} name="code" render={({ field }) => (
                                        <FormItem><FormLabel>Kode Item</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Nama Item</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="category" render={({ field }) => (
                                         <FormItem><FormLabel>Jenis (Kategori)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih jenis" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                         <FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="unit" render={({ field }) => (
                                         <FormItem><FormLabel>Satuan</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih satuan" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                         <FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="costPrice" render={({ field }) => (
                                        <FormItem><FormLabel>Harga Pokok (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="price" render={({ field }) => (
                                        <FormItem><FormLabel>Harga Jual (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="stock" render={({ field }) => (
                                        <FormItem><FormLabel>Stok Awal</FormLabel><FormControl><Input type="number" {...field} disabled={!!editingProduct} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="minStock" render={({ field }) => (
                                        <FormItem><FormLabel>Stok Minimal</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
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
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className='w-[50px]'>No</TableHead>
                            <TableHead>Gambar</TableHead>
                            <TableHead>Kode Item</TableHead>
                            <TableHead>Nama Item</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead>Satuan</TableHead>
                            <TableHead>Harga Pokok</TableHead>
                            <TableHead>Harga Jual</TableHead>
                            <TableHead>Stok</TableHead>
                            <TableHead>Stok Min.</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={11} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                        ) : products.length > 0 ? (
                            products.map((product, index) => (
                                <TableRow key={product.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <Image src={product.imageUrl || 'https://placehold.co/100x100.png'} alt={product.name} width={40} height={40} className="h-10 w-10 rounded-md object-cover" />
                                    </TableCell>
                                    <TableCell className="font-mono">{product.code}</TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell>{product.unit}</TableCell>
                                    <TableCell>{formatRupiah(product.costPrice)}</TableCell>
                                    <TableCell>{formatRupiah(product.price)}</TableCell>
                                    <TableCell>{product.stock}</TableCell>
                                    <TableCell>{product.minStock}</TableCell>
                                    <TableCell className="text-right">
                                       <Dialog open={!!stockEditProduct && stockEditProduct.id === product.id} onOpenChange={(open) => !open && setStockEditProduct(null)}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" title="Edit Stok" onClick={() => handleOpenStockForm(product)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <Form {...stockForm}>
                                                    <form onSubmit={stockForm.handleSubmit(onStockSubmit)}>
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Stok: {stockEditProduct?.name}</DialogTitle>
                                                            <DialogDescription>Perbarui jumlah stok untuk produk ini. Ini akan tercatat sebagai stok opname.</DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <FormField control={stockForm.control} name="stock" render={({ field }) => (
                                                                <FormItem><FormLabel>Jumlah Stok Baru</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                            )} />
                                                        </div>
                                                        <DialogFooter>
                                                            <Button type="button" variant="outline" onClick={() => setStockEditProduct(null)}>Batal</Button>
                                                            <Button type="submit" disabled={isSubmitting}>
                                                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Simpan Stok
                                                            </Button>
                                                        </DialogFooter>
                                                    </form>
                                                </Form>
                                            </DialogContent>
                                        </Dialog>

                                        <Dialog open={!!viewingHistoryProduct && viewingHistoryProduct.id === product.id} onOpenChange={(open) => !open && setViewingHistoryProduct(null)}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" title="Kartu Stok" onClick={() => handleViewHistory(product)}>
                                                    <History className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-3xl">
                                                <DialogHeader>
                                                    <DialogTitle>Kartu Stok: {viewingHistoryProduct?.name}</DialogTitle>
                                                    <DialogDescription>Riwayat pergerakan stok untuk produk ini.</DialogDescription>
                                                </DialogHeader>
                                                <div className="mt-4 max-h-[60vh] overflow-y-auto">
                                                    {isHistoryLoading ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" /> :
                                                        stockMovements.length > 0 ? (
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Tanggal</TableHead>
                                                                        <TableHead>Tipe</TableHead>
                                                                        <TableHead>Perubahan</TableHead>
                                                                        <TableHead>Stok Akhir</TableHead>
                                                                        <TableHead>Catatan</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {stockMovements.map(m => (
                                                                        <TableRow key={m.id}>
                                                                            <TableCell className="text-xs">{format(new Date(m.createdAt), 'dd MMM yy, HH:mm', { locale: id })}</TableCell>
                                                                            <TableCell>{m.type}</TableCell>
                                                                            <TableCell className={m.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}>
                                                                                {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                                                                            </TableCell>
                                                                            <TableCell className='font-medium'>{m.stockAfter}</TableCell>
                                                                            <TableCell className='text-xs text-muted-foreground'>{m.notes}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        ) : (
                                                            <p className='text-center text-muted-foreground py-8'>Belum ada riwayat pergerakan stok.</p>
                                                        )}
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setViewingHistoryProduct(null)}>Tutup</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        <Button variant="ghost" size="icon" title="Edit Produk" onClick={() => handleOpenForm(product)}><Pencil className="h-4 w-4" /></Button>
                                        
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" title="Hapus Produk" disabled={!!isDeleting}>
                                                    {isDeleting === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(product.id)}>Hapus</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={11} className="h-24 text-center">Belum ada data produk.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}


export default function ProductsSettingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        // Redirect if not an admin after loading is complete
        if (!loading && user?.role !== 'admin') {
            router.push('/shipments');
        }
    }, [user, loading, router]);


    // Show a loading skeleton while the auth state is being determined
    if (loading) {
        return (
            <div className="container mx-auto p-4 md:p-8 space-y-6">
                <Skeleton className="h-8 w-48" />
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-9 w-1/3" />
                        <Skeleton className="h-5 w-2/3 mt-2" />
                    </CardHeader>
                    <CardContent>
                       <Skeleton className="h-96 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    // If loading is finished and user is not an admin, show a redirecting message.
    // The useEffect above will handle the redirection.
    if (!user || user.role !== 'admin') {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Anda tidak memiliki akses ke halaman ini. Mengalihkan...</p>
            </div>
        );
    }
    
    // Render the page if the user is authenticated as an admin
    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <Button asChild variant="outline">
                <Link href="/settings">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Pengaturan
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Manajemen Produk</CardTitle>
                    <CardDescription>
                        Kelola semua data item yang ada di gudang. Tambah, hapus, atau edit produk.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductsClient />
                </CardContent>
            </Card>
        </div>
    );
}

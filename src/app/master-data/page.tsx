
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProducts, addProduct, deleteProduct, updateProduct, updateProductStock } from '@/lib/data';
import type { Product } from '@/lib/types';
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, PlusCircle, Trash2, Pencil, X, Upload, Edit } from 'lucide-react';
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

const productFormSchema = z.object({
  code: z.string().min(1, 'Kode produk harus diisi.'),
  name: z.string().min(1, 'Nama produk harus diisi.'),
  price: z.coerce.number().min(0, 'Harga harus diisi.'),
  stock: z.coerce.number().int().min(0, 'Stok harus bilangan bulat non-negatif.'),
  imageUrl: z.string().nullable().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const stockFormSchema = z.object({
    stock: z.coerce.number().int().min(0, 'Stok harus bilangan bulat non-negatif.'),
});

type StockFormValues = z.infer<typeof stockFormSchema>;


export default function MasterDataPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
    const [stockEditProduct, setStockEditProduct] = React.useState<Product | null>(null);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isStockFormOpen, setIsStockFormOpen] = React.useState(false);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const imageInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: { code: '', name: '', price: 0, stock: 0, imageUrl: null },
    });

    const stockForm = useForm<StockFormValues>({
        resolver: zodResolver(stockFormSchema),
        defaultValues: { stock: 0 },
    });

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }
        if(user?.role === 'admin') {
            fetchProducts();
        }
    }, [user, authLoading, router]);

    const fetchProducts = React.useCallback(async () => {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setLoading(false);
    }, []);

    const handleOpenForm = (product: Product | null) => {
        setEditingProduct(product);
        if (product) {
            form.reset({
                code: product.code,
                name: product.name,
                price: product.price,
                stock: product.stock,
                imageUrl: product.imageUrl,
            });
            setPreviewImage(product.imageUrl);
        } else {
            form.reset({ code: '', name: '', price: 0, stock: 0, imageUrl: null });
            setPreviewImage(null);
        }
        setIsFormOpen(true);
    };

    const handleOpenStockForm = (product: Product) => {
        setStockEditProduct(product);
        stockForm.setValue('stock', product.stock);
        setIsStockFormOpen(true);
    };


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
            setIsStockFormOpen(false);
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

    if (authLoading || (loading && user?.role === 'admin')) {
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
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Master Data Produk</CardTitle>
                            <CardDescription>
                                Kelola semua data item yang ada di gudang.
                            </CardDescription>
                        </div>
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => handleOpenForm(null)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Tambah Produk
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onProductSubmit)}>
                                        <DialogHeader>
                                            <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <FormField
                                                control={form.control}
                                                name="imageUrl"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col items-center">
                                                        <FormLabel>Gambar Produk</FormLabel>
                                                        <FormControl>
                                                            <>
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
                                                            </>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField control={form.control} name="code" render={({ field }) => (
                                                <FormItem><FormLabel>Kode Item</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name="name" render={({ field }) => (
                                                <FormItem><FormLabel>Nama Item</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name="price" render={({ field }) => (
                                                <FormItem><FormLabel>Harga Jual (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name="stock" render={({ field }) => (
                                                <FormItem><FormLabel>Stok Awal</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
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
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Gambar</TableHead>
                                    <TableHead>Kode Item</TableHead>
                                    <TableHead>Nama Item</TableHead>
                                    <TableHead>Harga Jual</TableHead>
                                    <TableHead>Stok</TableHead>
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
                                                <Image src={product.imageUrl || 'https://placehold.co/100x100.png'} alt={product.name} width={40} height={40} className="h-10 w-10 rounded-md object-cover" />
                                            </TableCell>
                                            <TableCell className="font-mono">{product.code}</TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>{formatRupiah(product.price)}</TableCell>
                                            <TableCell>{product.stock}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenStockForm(product)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenForm(product)}><Pencil className="h-4 w-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" disabled={!!isDeleting}>
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
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Belum ada data produk.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isStockFormOpen} onOpenChange={setIsStockFormOpen}>
                <DialogContent>
                    <Form {...stockForm}>
                        <form onSubmit={stockForm.handleSubmit(onStockSubmit)}>
                            <DialogHeader>
                                <DialogTitle>Edit Stok: {stockEditProduct?.name}</DialogTitle>
                                <DialogDescription>Perbarui jumlah stok untuk produk ini.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <FormField control={stockForm.control} name="stock" render={({ field }) => (
                                    <FormItem><FormLabel>Jumlah Stok Baru</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsStockFormOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Stok
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    
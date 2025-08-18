
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProducts, addProduct, deleteProduct, updateProduct } from '@/lib/data';
import type { Product } from '@/lib/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Loader2, PlusCircle, Trash2, Pencil, X } from 'lucide-react';
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

const productFormSchema = z.object({
  name: z.string().min(1, 'Nama produk harus diisi.'),
  price: z.coerce.number().min(0, 'Harga harus diisi'),
  packingFee: z.coerce.number().min(0, 'Biaya pengemasan harus diisi'),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export function ProductSettings() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { name: '', price: 0, packingFee: 0 },
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

  const onSubmit = async (data: ProductFormValues) => {
    try {
      if (editingId) {
        await updateProduct(editingId, data);
        toast({ title: 'Sukses', description: 'Produk berhasil diperbarui.' });
      } else {
        await addProduct(data);
        toast({ title: 'Sukses', description: 'Produk berhasil ditambahkan.' });
      }
      resetForm();
      fetchProducts();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan data.';
      toast({ variant: 'destructive', title: 'Kesalahan', description: message });
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
  
  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    form.reset({
      name: product.name,
      price: product.price,
      packingFee: product.packingFee,
    });
  };
  
  const resetForm = () => {
    setEditingId(null);
    form.reset({ name: '', price: 0, packingFee: 0 });
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] items-end gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Nama Produk</FormLabel>
                <FormControl>
                  <Input placeholder="cth. Baju Anak" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Harga (Rp)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="cth. 50000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="packingFee"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Biaya Pengemasan (Rp)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="cth. 1000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2">
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : editingId ? (
                'Simpan'
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              {editingId ? 'Perubahan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Produk</TableHead>
              <TableHead>Harga Standar</TableHead>
              <TableHead>Biaya Pengemasan</TableHead>
              <TableHead className="w-[120px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{formatRupiah(product.price)}</TableCell>
                  <TableCell>{formatRupiah(product.packingFee)}</TableCell>
                  <TableCell className="text-right">
                     <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} disabled={!!isDeleting || !!editingId}>
                        <Pencil className="h-4 w-4" />
                     </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={!!isDeleting || !!editingId}>
                          {isDeleting === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(product.id)}>
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Belum ada produk. Tambahkan di atas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

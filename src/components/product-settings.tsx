
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
  packingFee: z.coerce.number().min(0, 'Biaya pengemasan harus diisi.'),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export function ProductSettings() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<any>({
    // resolver: zodResolver(productFormSchema),
    // defaultValues: { name: '', price: 0, packingFee: 0 },
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

  const onSubmit = async (data: any) => {
    // try {
    //   if (editingId) {
    //     await updateProduct(editingId, data);
    //     toast({ title: 'Sukses', description: 'Produk berhasil diperbarui.' });
    //   } else {
    //     await addProduct(data);
    //     toast({ title: 'Sukses', description: 'Produk berhasil ditambahkan.' });
    //   }
    //   resetForm();
    //   fetchProducts();
    // } catch (error) {
    //   const message = error instanceof Error ? error.message : 'Gagal menyimpan data.';
    //   toast({ variant: 'destructive', title: 'Kesalahan', description: message });
    // }
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
      // packingFee: product.packingFee,
    });
  };
  
  const resetForm = () => {
    setEditingId(null);
    // form.reset({ name: '', price: 0, packingFee: 0 });
  };


  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div>
        Halaman ini tidak digunakan lagi. Silakan gunakan halaman Master Data untuk mengelola produk.
    </div>
  );
}

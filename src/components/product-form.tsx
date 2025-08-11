'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { handleAddOrUpdateProduct } from '@/lib/actions';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const productFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nama produk harus diisi'),
  code: z.string().min(1, 'Kode produk harus diisi'),
  stock: z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
  receiptNumber: z.string().min(1, 'Nomor resi harus diisi'),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product: Product | null;
  onSuccess: (products: Product[]) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { toast } = useToast();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product || {
      name: '',
      code: '',
      stock: 0,
      receiptNumber: '',
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    const result = await handleAddOrUpdateProduct(data);
    if (result.success && result.products) {
      toast({
        title: 'Sukses!',
        description: `Produk berhasil ${product ? 'diperbarui' : 'ditambahkan'}.`,
      });
      onSuccess(result.products);
    } else {
      toast({
        variant: 'destructive',
        title: 'Kesalahan',
        description: result.message,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Produk</FormLabel>
              <FormControl>
                <Input placeholder="cth. Mouse Nirkabel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kode Produk</FormLabel>
              <FormControl>
                <Input placeholder="cth. SKU001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stok</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="receiptNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor Resi</FormLabel>
              <FormControl>
                <Input placeholder="cth. RESI001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {product ? 'Simpan Perubahan' : 'Tambah Produk'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

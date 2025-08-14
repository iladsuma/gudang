'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { handleAddOrUpdateProduct } from '@/lib/actions';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const productFormSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, 'Kode produk harus diisi'),
  name: z.string().min(1, 'Nama produk harus diisi'),
  stock: z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product | null;
  onSuccess: (product: Product) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      id: product?.id || undefined,
      code: product?.code || '',
      name: product?.name || '',
      stock: product?.stock || 0,
      price: product?.price || 0,
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    const result = await handleAddOrUpdateProduct(data);
    if (result.success && result.data) {
      toast({
        title: 'Sukses!',
        description: result.message,
      });
      onSuccess(result.data);
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
        <DialogDescription>
          {product ? 'Ubah detail produk di bawah ini.' : 'Isi detail untuk produk baru.'}
        </DialogDescription>
        
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
          name="stock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stok</FormLabel>
              <FormControl>
                <Input type="number" placeholder="cth. 100" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
         <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Harga</FormLabel>
              <FormControl>
                <Input type="number" placeholder="cth. 250000" {...field} />
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
            Simpan Produk
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

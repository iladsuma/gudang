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
  name: z.string().min(1, 'Product name is required'),
  code: z.string().min(1, 'Product code is required'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
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
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    const result = await handleAddOrUpdateProduct(data);
    if (result.success && result.products) {
      toast({
        title: 'Success!',
        description: `Product ${product ? 'updated' : 'added'} successfully.`,
      });
      onSuccess(result.products);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
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
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Wireless Mouse" {...field} />
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
              <FormLabel>Product Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g. SKU001" {...field} />
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
              <FormLabel>Stock</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {product ? 'Save Changes' : 'Add Product'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

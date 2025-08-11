'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { handleCheckout, handleAIIngestion } from '@/lib/actions';
import type { Product, CheckoutItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { PlusCircle, Trash2, Upload, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProductByCode } from '@/lib/data';

const checkoutItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  stock: z.number(),
  quantity: z.coerce.number().min(1, 'Min 1').int(),
});

const checkoutFormSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  items: z.array(checkoutItemSchema).min(1, 'At least one item is required for checkout'),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export function CheckoutForm({ allProducts }: { allProducts: Product[] }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: '',
      items: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    const result = await handleCheckout(data);
    if (result.success) {
      toast({
        title: 'Success!',
        description: result.message,
      });
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
  };

  const addProductToCheckout = (product: Product) => {
    const existingItemIndex = fields.findIndex((item) => item.id === product.id);
    if (existingItemIndex > -1) {
      const existingItem = fields[existingItemIndex];
      if (existingItem.quantity < product.stock) {
        update(existingItemIndex, { ...existingItem, quantity: existingItem.quantity + 1 });
      } else {
        toast({ variant: 'destructive', title: 'Out of stock', description: `Cannot add more ${product.name}.` });
      }
    } else {
        if (product.stock > 0) {
            append({ ...product, quantity: 1 });
        } else {
            toast({ variant: 'destructive', title: 'Out of stock', description: `${product.name} is out of stock.` });
        }
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsIngesting(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const dataUri = reader.result as string;
        const result = await handleAIIngestion(dataUri);
        
        if (result.success && result.data) {
            toast({ title: 'Success', description: 'Data ingested successfully.' });
            const { transactionData } = result.data;
            if (transactionData.customerName && typeof transactionData.customerName === 'string') {
                form.setValue('customerName', transactionData.customerName);
            }
            if (Array.isArray(transactionData.items)) {
                for (const item of transactionData.items) {
                    if(item.code && typeof item.code === 'string') {
                        const product = allProducts.find(p => p.code.toLowerCase() === item.code.toLowerCase());
                        if (product) {
                            addProductToCheckout(product);
                        }
                    }
                }
            }
        } else {
            toast({ variant: 'destructive', title: 'Ingestion Failed', description: result.message });
        }
        setIsIngesting(false);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not read file.' });
        setIsIngesting(false);
    };
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Checkout Details</CardTitle>
                <CardDescription>Enter customer and item details for this transaction.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                    <FormLabel>Items</FormLabel>
                    <div className="mt-2 rounded-md border">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Product</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead className="w-[120px]">Quantity</TableHead>
                            <TableHead className="text-right"></TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {fields.length > 0 ? (
                            fields.map((item, index) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name} <span className="text-muted-foreground">({item.code})</span></TableCell>
                                <TableCell>{item.stock}</TableCell>
                                <TableCell>
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input type="number" {...field} max={item.stock} min={1} className="w-24"/>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                </TableCell>
                                <TableCell className="text-right">
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No items added.
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </div>
                    <FormMessage>{form.formState.errors.items?.message}</FormMessage>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Add Items</CardTitle>
                    <CardDescription>Search and add products to the checkout list.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCombobox}
                            className="w-full justify-between"
                            >
                            Select product...
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                            <CommandInput placeholder="Search product by name or code..." />
                            <CommandList>
                                <CommandEmpty>No product found.</CommandEmpty>
                                <CommandGroup>
                                {allProducts.map((product) => (
                                    <CommandItem
                                    key={product.id}
                                    value={`${product.name} ${product.code}`}
                                    onSelect={() => {
                                        addProductToCheckout(product);
                                        setOpenCombobox(false);
                                    }}
                                    >
                                    <Check
                                        className={cn(
                                        'mr-2 h-4 w-4',
                                        fields.some((item) => item.id === product.id) ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    {product.name}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </CardContent>
             </Card>

            <Card>
              <CardHeader>
                <CardTitle>Auto Data Ingestion</CardTitle>
                <CardDescription>Scan a transaction code or receipt to auto-fill data.</CardDescription>
              </CardHeader>
              <CardContent>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                <Button type="button" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isIngesting}>
                  {isIngesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {isIngesting ? 'Scanning...' : 'Scan Code'}
                </Button>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Complete Transaction</CardTitle>
                </CardHeader>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Complete Checkout
                    </Button>
                </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}

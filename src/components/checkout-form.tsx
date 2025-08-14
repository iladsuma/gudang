'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, PlusCircle, Trash2, Search, Camera } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { getProductByCode, getProducts } from '@/lib/data';
import type { Product, CheckoutItem } from '@/lib/types';
import { handleCheckout, handleScanReceipt } from '@/lib/actions';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { ScrollArea } from './ui/scroll-area';

const checkoutItemSchema = z.object({
  code: z.string().min(1, 'Kode produk harus diisi'),
  name: z.string().min(1, 'Nama produk harus diisi'),
  quantity: z.coerce.number().int().min(1, 'Kuantitas minimal 1'),
  stock: z.number(),
  price: z.number(),
});

const checkoutFormSchema = z.object({
  customerName: z.string().min(1, 'Nama pelanggan harus diisi'),
  items: z.array(checkoutItemSchema).min(1, 'Harus ada minimal 1 item'),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export function CheckoutForm() {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Kesalahan', description: 'File harus berupa gambar.' });
        return;
    }

    setIsScanning(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const dataUrl = reader.result as string;
        const result = await handleScanReceipt(dataUrl);

        if (result.success && result.data) {
            // Clear existing items
            for (let i = fields.length - 1; i >= 0; i--) {
                remove(i);
            }
            
            const scannedItems = result.data.items || [];
            if (result.data.merchantName) {
                form.setValue('customerName', result.data.merchantName);
            }

            for (const item of scannedItems) {
                const product = await getProductByCode(item.name); // Using name as code for now
                if (product) {
                     append({
                        code: product.code,
                        name: product.name,
                        quantity: item.quantity,
                        stock: product.stock,
                        price: product.price,
                    });
                } else {
                    toast({ variant: 'destructive', title: 'Produk tidak ditemukan', description: `Produk dengan nama "${item.name}" tidak ada di database.`});
                }
            }
            toast({ title: 'Sukses', description: 'Struk berhasil dipindai.'});
        } else {
            toast({ variant: 'destructive', title: 'Gagal Memindai', description: result.message });
        }
        setIsScanning(false);
    };
    reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Kesalahan', description: 'Tidak bisa membaca file.' });
        setIsScanning(false);
    };
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsSubmitting(true);
    const result = await handleCheckout(data);
    if (result.success) {
      toast({
        title: 'Sukses!',
        description: 'Checkout berhasil.',
      });
      form.reset();
      // Reset items array
       for (let i = fields.length - 1; i >= 0; i--) {
        remove(i);
       }
    } else {
      toast({
        variant: 'destructive',
        title: 'Kesalahan',
        description: result.message,
      });
    }
    setIsSubmitting(false);
  };
  
  const [productSearch, setProductSearch] = React.useState("");
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    getProducts().then(setAllProducts);
  }, []);
  
  const filteredProducts = React.useMemo(() => {
    if (!productSearch) return allProducts;
    return allProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.code.toLowerCase().includes(productSearch.toLowerCase()));
  }, [productSearch, allProducts]);

  const addProductToCart = (product: Product) => {
    const existingItemIndex = fields.findIndex(item => item.code === product.code);
    if (existingItemIndex > -1) {
        const currentItem = fields[existingItemIndex];
        if(currentItem.quantity < currentItem.stock) {
            update(existingItemIndex, { ...currentItem, quantity: currentItem.quantity + 1 });
        } else {
            toast({ variant: 'destructive', title: 'Stok Habis', description: `Stok untuk ${product.name} tidak mencukupi.`});
        }
    } else {
         if (product.stock > 0) {
            append({
                code: product.code,
                name: product.name,
                quantity: 1,
                stock: product.stock,
                price: product.price,
            });
        } else {
             toast({ variant: 'destructive', title: 'Stok Habis', description: `Produk ${product.name} sudah habis.`});
        }
    }
    setOpen(false);
    setProductSearch("");
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
  };
  
  const totalAmount = form.watch('items').reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
            <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                    <FormItem className='flex-1'>
                    <FormLabel>Nama Pelanggan</FormLabel>
                    <FormControl>
                        <Input placeholder="cth. John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="flex items-end">
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isScanning}>
                    {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                    Pindai Struk
                </Button>
            </div>
        </div>

        <Card>
            <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                    <FormLabel>Keranjang</FormLabel>
                     <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline">
                                <Search className="mr-2 h-4 w-4" />
                                Cari Produk...
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[300px]" align="end">
                            <Command>
                                <CommandInput 
                                    placeholder="Cari nama atau kode produk..." 
                                    value={productSearch}
                                    onValueChange={setProductSearch}
                                />
                                <CommandList>
                                    <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                                    <ScrollArea className="h-48">
                                    <CommandGroup>
                                        {filteredProducts.map(product => (
                                            <CommandItem
                                                key={product.id}
                                                onSelect={() => addProductToCart(product)}
                                            >
                                                <span>{product.name} ({product.code})</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    </ScrollArea>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Nama Produk</TableHead>
                            <TableHead>Harga Satuan</TableHead>
                            <TableHead className="w-[120px]">Jumlah</TableHead>
                            <TableHead>Subtotal</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.length > 0 ? (
                            fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell>{field.name}</TableCell>
                                    <TableCell>{formatRupiah(field.price)}</TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field: quantityField }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input 
                                                            type="number" 
                                                            {...quantityField}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
                                                                if (value > field.stock) {
                                                                    toast({ variant: 'destructive', title: 'Stok tidak mencukupi', description: `Sisa stok ${field.stock}`});
                                                                    quantityField.onChange(field.stock);
                                                                } else if (value < 1) {
                                                                    quantityField.onChange(1);
                                                                } else {
                                                                    quantityField.onChange(value);
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>{formatRupiah(field.price * field.quantity)}</TableCell>
                                    <TableCell>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Keranjang kosong.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </div>
                 {fields.length > 0 && (
                    <div className="flex justify-end mt-4">
                        <div className="text-right">
                            <p className="text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold">{formatRupiah(totalAmount)}</p>
                        </div>
                    </div>
                 )}
                 <FormMessage className='mt-2'>{form.formState.errors.items?.message || form.formState.errors.items?.root?.message}</FormMessage>
            </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || fields.length === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Selesaikan Checkout
          </Button>
        </div>
      </form>
    </Form>
  );
}


'use client';

import * as React from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Shipment, Customer, ShipmentProduct, Account, User, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, PlusCircle, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { addShipment, updateShipment, getCustomers, getProducts, getAccounts } from '@/lib/data';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';


const shipmentProductSchema = z.object({
  productId: z.string().min(1, 'Produk harus dipilih.'),
  code: z.string(), // Will be populated
  name: z.string(), // Will be populated
  quantity: z.coerce.number().int().min(1, 'Jumlah minimal 1'),
  price: z.coerce.number().min(0, 'Harga harus diisi'),
  costPrice: z.coerce.number().min(0, 'Harga pokok harus diisi'),
  imageUrl: z.string().nullable().default(null),
});

const shipmentFormSchema = z.object({
  userId: z.string().min(1, 'User harus diisi'),
  transactionId: z.string().min(1, 'No. Transaksi harus diisi.'),
  customerId: z.string().min(1, 'Pelanggan harus dipilih'),
  customerName: z.string().min(1, 'Nama pelanggan harus ada'),
  accountId: z.string().optional(),
  products: z.array(shipmentProductSchema).min(1, 'Minimal harus ada satu produk'),
  downPayment: z.coerce.number().min(0).optional(),
  bodyMeasurements: z.any().optional(),
  user: z.custom<User>()
}).refine(data => {
    if ((data.downPayment || 0) > 0 && !data.accountId) {
        return false;
    }
    return true;
}, {
    message: 'Akun pembayaran harus dipilih jika ada DP.',
    path: ['accountId'],
});


type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;

interface ShipmentFormProps {
  shipmentToEdit?: Shipment;
  onSuccess: (newOrUpdatedShipment: Shipment) => void;
  onCancel: () => void;
}

const formatRupiah = (number: number) => {
    if (isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
};

const Summary = ({ control }: { control: any }) => {
    const productsValue = useWatch({ control, name: 'products' });
    const downPayment = useWatch({ control, name: 'downPayment' });
    
    const summary = React.useMemo(() => {
        const subtotal = productsValue?.reduce((sum: number, product: any) => sum + ((product?.price || 0) * (product?.quantity || 0)), 0) || 0;
        const dp = Number(downPayment) || 0;
        const remaining = subtotal - dp;
        
        return { subtotal, dp, remaining };
    }, [productsValue, downPayment]);
  
    return (
      <CardFooter className="flex flex-col items-end bg-slate-50 dark:bg-slate-900 p-4 gap-2">
        <div className="w-full max-w-sm space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatRupiah(summary.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uang Muka (DP)</span>
            <span className="font-medium text-red-600">-{formatRupiah(summary.dp)}</span>
          </div>
        </div>
        <div className="w-full max-w-sm space-y-2 text-sm">
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-base font-bold">Sisa Tagihan</span>
            <span className="text-base font-bold">{formatRupiah(summary.remaining)}</span>
          </div>
        </div>
      </CardFooter>
    );
};


export function ShipmentForm({ shipmentToEdit, onSuccess, onCancel }: ShipmentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [openProductSelector, setOpenProductSelector] = React.useState(false);

  const isEditMode = !!shipmentToEdit;

  const generateTransactionId = React.useCallback(() => {
    if (!user) return '';
    const userNamePart = user.username.split(' ')[0].toUpperCase();
    const date = new Date();
    const datePart = `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${userNamePart}-${datePart}-${randomPart}`;
  }, [user]);
  
  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: isEditMode ? {
        userId: shipmentToEdit.userId, 
        transactionId: shipmentToEdit.transactionId,
        customerId: shipmentToEdit.customerId,
        customerName: shipmentToEdit.customerName,
        accountId: shipmentToEdit.accountId,
        products: shipmentToEdit.products.map(p => ({...p})) || [],
        bodyMeasurements: shipmentToEdit.bodyMeasurements ? JSON.stringify(shipmentToEdit.bodyMeasurements, null, 2) : '',
        downPayment: shipmentToEdit.downPayment || 0,
        user: user || undefined
    } : {
      userId: user?.id || '',
      transactionId: '',
      customerId: '',
      customerName: '',
      accountId: '',
      products: [],
      bodyMeasurements: '',
      downPayment: 0,
      user: user || undefined
    },
  });
  
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'products',
  });

  React.useEffect(() => {
    if (user && !isEditMode) {
      form.setValue('userId', user.id);
      form.setValue('transactionId', generateTransactionId());
      form.setValue('user', user);
    }
    getCustomers().then(setCustomers);
    getAccounts().then(setAccounts);
    getProducts().then(setAllProducts);
  }, [user, form, generateTransactionId, isEditMode]);

  const addProductToForm = (product: Product) => {
    const existingProductIndex = fields.findIndex(field => field.productId === product.id);
    if (existingProductIndex !== -1) {
        const currentQuantity = form.getValues(`products.${existingProductIndex}.quantity`);
        form.setValue(`products.${existingProductIndex}.quantity`, currentQuantity + 1);
    } else {
        append({
            productId: product.id,
            code: product.code,
            name: product.name,
            quantity: 1,
            price: product.price,
            costPrice: product.costPrice,
            imageUrl: product.imageUrl,
        });
    }
    setOpenProductSelector(false);
  };


  const onSubmit = async (data: ShipmentFormValues) => {
    setIsSubmitting(true);
    try {
        const productsWithImage = data.products.map(p => ({...p, imageUrl: p.imageUrl || 'https://placehold.co/100x100.png' }));
        
        let parsedBodyMeasurements = null;
        if(data.bodyMeasurements && typeof data.bodyMeasurements === 'string') {
            try {
                parsedBodyMeasurements = JSON.parse(data.bodyMeasurements);
            } catch(e) {
                // If it's not valid JSON, treat as plain text
                parsedBodyMeasurements = { notes: data.bodyMeasurements };
            }
        }
        
        const totalItems = productsWithImage.reduce((sum, p) => sum + p.quantity, 0);
        const totalProductCost = productsWithImage.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        const totalAmount = totalProductCost;
        const totalRevenue = totalAmount; // For boutique, revenue is the total amount

        const payload: Omit<Shipment, 'id' | 'createdAt' | 'status'> = { 
            ...data, 
            userId: data.userId,
            customerName: data.customerName,
            products: productsWithImage,
            totalItems,
            totalProductCost: totalProductCost,
            totalPackingCost: 0, // No packing cost in this model
            totalAmount,
            totalRevenue,
            paymentStatus: (data.downPayment || 0) >= totalAmount ? 'Lunas' : 'Belum Lunas',
            user, // Pass the user object for notification
            bodyMeasurements: parsedBodyMeasurements,
        };

        if (isEditMode) {
            const updated = await updateShipment(shipmentToEdit.id, payload);
            toast({
                title: 'Sukses!',
                description: `Data pesanan ${data.transactionId} berhasil diperbarui.`,
            });
            onSuccess(updated);
        } else {
            const newShipment = await addShipment(payload);
            toast({
                title: 'Sukses!',
                description: `Pesanan baru ${data.transactionId} berhasil ditambahkan.`,
            });
            onSuccess(newShipment);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
        toast({
            variant: 'destructive',
            title: 'Kesalahan',
            description: message,
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        form.setValue('customerId', customer.id, { shouldValidate: true });
        form.setValue('customerName', customer.name, { shouldValidate: true });
    }
  }
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Edit Pesanan' : 'Buat Pesanan Baru'}</DialogTitle>
        <DialogDescription>
          {isEditMode ? `Perbarui detail untuk pesanan ${shipmentToEdit.transactionId}` : 'Isi formulir untuk mencatat pesanan baru dari pelanggan.'}
        </DialogDescription>
      </DialogHeader>
      <div className="pr-4 max-h-[70vh] overflow-y-auto">
        <Form {...form}>
            <form id="shipment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
                  <FormField
                  control={form.control}
                  name="userId"
                  render={() => (
                      <FormItem>
                      <FormLabel>User/Kasir</FormLabel>
                      <FormControl>
                          <Input value={user?.username || ''} readOnly disabled />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                    control={form.control}
                    name="transactionId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>No. Pesanan</FormLabel>
                        <FormControl>
                            <Input placeholder="Akan dibuat otomatis" {...field} readOnly disabled />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Pelanggan</FormLabel>
                          <FormControl>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                handleCustomerChange(value);
                              }} defaultValue={field.value}>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Pilih pelanggan" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {customers.map(c => (
                                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                    <FormField
                      control={form.control}
                      name="downPayment"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Uang Muka (DP)</FormLabel>
                          <FormControl>
                              <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                    <FormField
                        control={form.control}
                        name="accountId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>DP Masuk ke Akun</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih akun tujuan" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="bodyMeasurements"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Catatan Ukuran Badan</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Contoh: &#10;LD: 90cm&#10;LP: 70cm&#10;Panjang Baju: 100cm" {...field} className="min-h-[100px]" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
              </div>
              
              <Card>
                  <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-2">
                        <Label>Produk Dipesan</Label>
                         <Popover open={openProductSelector} onOpenChange={setOpenProductSelector}>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="outline"><Search className="mr-2 h-4 w-4" /> Cari & Tambah Produk</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Ketik nama atau kode produk..." />
                                    <CommandList>
                                        <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                                        <CommandGroup>
                                            {allProducts.map((product) => (
                                                <CommandItem key={product.id} value={`${product.name} ${product.code}`} onSelect={() => addProductToForm(product)}>
                                                    <span>{product.name}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                      </div>
                      <div className="overflow-x-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Produk</TableHead>
                                  <TableHead className="w-[120px]">Jumlah</TableHead>
                                  <TableHead className="w-[150px]">Harga (Rp)</TableHead>
                                  <TableHead className="w-[150px] text-right">Subtotal</TableHead>
                                  <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {fields.map((field, index) => {
                                  const quantity = form.watch(`products.${index}.quantity`) || 0;
                                  const price = form.watch(`products.${index}.price`) || 0;
                                  const subtotal = price * quantity;

                                  return (
                                  <TableRow key={field.id}>
                                       <TableCell>
                                          <p className="font-medium">{form.watch(`products.${index}.name`)}</p>
                                          <p className="font-mono text-xs text-muted-foreground">{form.watch(`products.${index}.code`)}</p>
                                      </TableCell>
                                      <TableCell>
                                          <FormField
                                              control={form.control}
                                              name={`products.${index}.quantity`}
                                              render={({ field: qtyField }) => (
                                                  <FormItem><FormControl><Input type="number" min="1" {...qtyField} /></FormControl><FormMessage /></FormItem>
                                              )}
                                          />
                                      </TableCell>
                                      <TableCell>
                                         <FormField
                                              control={form.control}
                                              name={`products.${index}.price`}
                                              render={({ field: priceField }) => (
                                                  <FormItem><FormControl><Input type="number" min="0" {...priceField} /></FormControl><FormMessage /></FormItem>
                                              )}
                                          />
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                          {formatRupiah(subtotal > 0 ? subtotal : 0)}
                                      </TableCell>
                                      <TableCell>
                                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              )})}
                          </TableBody>
                      </Table>
                      </div>
                      <FormMessage>{form.formState.errors.products?.root?.message}</FormMessage>
                  </CardContent>
                  <Summary control={form.control} />
              </Card>
            </form>
        </Form>
      </div>
      <DialogFooter className="mt-auto pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" form="shipment-form" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Simpan Perubahan' : 'Simpan Pesanan'}
        </Button>
      </DialogFooter>
    </>
  );
}



'use client';

import * as React from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Shipment, Expedition, Packaging, CartItem, Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, PlusCircle, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { addShipment, getExpeditions, getPackagingOptions, updateShipment, getCustomers } from '@/lib/data';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { useCart } from '@/hooks/use-cart';


const shipmentProductSchema = z.object({
  productId: z.string().min(1, 'Produk harus dipilih.'),
  code: z.string(), // Will be populated
  name: z.string(), // Will be populated
  quantity: z.coerce.number().int().min(1, 'Jumlah minimal 1'),
  price: z.coerce.number().min(0, 'Harga harus diisi'),
  imageUrl: z.string().nullable().default(null),
});

const shipmentFormSchema = z.object({
  user: z.string().min(1, 'User harus diisi'),
  transactionId: z.string().min(1, 'No. Transaksi harus diisi.'),
  customerId: z.string().min(1, 'Pelanggan harus dipilih'),
  expedition: z.string().min(1, 'Nama ekspedisi harus dipilih'),
  packagingId: z.string().min(1, "Pilih kemasan"),
  packagingCost: z.coerce.number().min(0),
  receipt: z.object({
      fileName: z.string().min(1, 'Nama file resi harus ada'),
      dataUrl: z.string().min(1, 'Data resi harus ada').refine(val => val.startsWith('data:application/pdf;base64,'), { message: 'File harus berupa PDF.' }),
  }).optional(),
  products: z.array(shipmentProductSchema).min(1, 'Minimal harus ada satu produk'),
});

type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;

interface ShipmentFormProps {
  shipmentToEdit?: Shipment;
  onSuccess: (newOrUpdatedShipment: Shipment) => void;
  onCancel: () => void;
  initialProductsFromCart?: CartItem[];
}

const formatRupiah = (number: number) => {
    if (number === null || typeof number === 'undefined' || isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
};

const Summary = ({ control }: { control: any }) => {
    const productsValue = useWatch({ control, name: 'products' });
    const packagingCost = useWatch({ control, name: 'packagingCost' });
    
    const summary = React.useMemo(() => {
        if (!productsValue) return { totalItems: 0, totalShopping: 0, totalPacking: 0, grandTotal: 0 };
        
        const totalItems = productsValue.reduce((sum: number, product: any) => sum + (product?.quantity || 0), 0);
        
        const totalShopping = productsValue.reduce((sum: number, product: any) => {
            const price = product?.price || 0;
            const quantity = product?.quantity || 0;
            const subtotal = price * quantity;
            return sum + (subtotal > 0 ? subtotal : 0);
        }, 0);
        
        const totalPacking = Number(packagingCost) || 0;
        const grandTotal = totalShopping + totalPacking;
        
        return { totalItems, totalShopping, totalPacking, grandTotal };
    }, [productsValue, packagingCost]);
  
    return (
      <CardFooter className="flex flex-col items-end bg-slate-50 dark:bg-slate-900 p-4 gap-2">
        <div className="w-full max-w-sm space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jumlah Item</span>
            <span className="font-medium">{summary.totalItems} pcs</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Belanja (Produk)</span>
            <span className="font-medium">{formatRupiah(summary.totalShopping)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Biaya Pengemasan</span>
            <span className="font-medium">{formatRupiah(summary.totalPacking)}</span>
          </div>
        </div>
        <div className="w-full max-w-sm space-y-2 text-sm">
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-base font-bold">Total Keseluruhan</span>
            <span className="text-base font-bold">{formatRupiah(summary.grandTotal)}</span>
          </div>
        </div>
      </CardFooter>
    );
};


export function ShipmentForm({ shipmentToEdit, onSuccess, onCancel, initialProductsFromCart = [] }: ShipmentFormProps) {
  const { toast } = useToast();
  const pdfFileInputRef = React.useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { reduceCartQuantities } = useCart();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [expeditions, setExpeditions] = React.useState<Expedition[]>([]);
  const [packagingOptions, setPackagingOptions] = React.useState<Packaging[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);

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
        user: shipmentToEdit.user,
        transactionId: shipmentToEdit.transactionId,
        customerId: shipmentToEdit.customerId,
        expedition: shipmentToEdit.expedition,
        packagingId: shipmentToEdit.packagingId || '',
        packagingCost: shipmentToEdit.totalPackingCost || 0,
        receipt: shipmentToEdit.receipt,
        products: shipmentToEdit.products.map(p => ({...p})) || [],
    } : {
      user: user?.username || '',
      transactionId: '',
      customerId: '',
      expedition: '',
      packagingId: '',
      packagingCost: 0,
      products: initialProductsFromCart.map(item => ({
            productId: item.id,
            code: item.code,
            name: item.name,
            quantity: 1, // Default quantity to 1
            price: item.price,
            imageUrl: item.imageUrl || null,
      })),
    },
  });
  
  const { fields, remove, replace } = useFieldArray({
    control: form.control,
    name: 'products',
  });

  React.useEffect(() => {
    if (!isEditMode && initialProductsFromCart.length > 0) {
        const cartProducts = initialProductsFromCart.map(item => ({
            productId: item.id,
            code: item.code,
            name: item.name,
            quantity: 1, // Always start with 1 in the form
            price: item.price,
            imageUrl: item.imageUrl || null,
        }));
        replace(cartProducts);
    }
  }, [isEditMode, initialProductsFromCart, replace]);
  
  React.useEffect(() => {
    if (user && !isEditMode) {
      form.setValue('user', user.username);
      form.setValue('transactionId', generateTransactionId());
    }
    getExpeditions().then(setExpeditions);
    getPackagingOptions().then(setPackagingOptions);
    getCustomers().then(setCustomers);
  }, [user, form, generateTransactionId, isEditMode]);


  const handlePdfFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      form.setError('receipt', { type: 'manual', message: 'File harus berupa PDF.' });
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        form.setValue('receipt', {
            fileName: file.name,
            dataUrl: reader.result as string,
        }, { shouldValidate: true });
    };
    reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Kesalahan', description: 'Tidak bisa membaca file.' });
    };
  };

  const onSubmit = async (data: ShipmentFormValues) => {
    setIsSubmitting(true);
    try {
        const productsWithImage = data.products.map(p => ({...p, imageUrl: p.imageUrl || 'https://placehold.co/100x100.png' }));
        const payload = { ...data, products: productsWithImage as any };

        if (isEditMode) {
            const updated = await updateShipment(shipmentToEdit.id, payload);
            toast({
                title: 'Sukses!',
                description: `Data pengiriman ${data.transactionId} berhasil diperbarui.`,
            });
            onSuccess(updated);
        } else {
            const newShipment = await addShipment(payload);
            toast({
                title: 'Sukses!',
                description: `Data pengiriman ${data.transactionId} berhasil ditambahkan.`,
            });
            reduceCartQuantities(newShipment.products);
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
  
  const handleProductSelectionChange = (productId: string, index: number) => {
      const product = initialProductsFromCart.find(p => p.id === productId);

      if (product) {
        form.setValue(`products.${index}.productId`, product.id, { shouldValidate: true });
        form.setValue(`products.${index}.code`, product.code);
        form.setValue(`products.${index}.name`, product.name);
        form.setValue(`products.${index}.price`, product.price);
        form.setValue(`products.${index}.imageUrl`, product.imageUrl);
        form.setValue(`products.${index}.quantity`, 1);
      }
  };
  
  const handlePackagingChange = (packagingId: string) => {
    const packaging = packagingOptions.find(p => p.id === packagingId);
    if (packaging) {
        form.setValue('packagingCost', packaging.cost, { shouldValidate: true });
        form.setValue('packagingId', packaging.id, { shouldValidate: true });
    }
  }

  const receiptValue = form.watch('receipt');
  
  return (
    <div className="flex flex-col h-full">
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Edit Data Pengiriman' : 'Tambah Data Pengiriman Baru'}</DialogTitle>
        <DialogDescription>
          {isEditMode ? `Perbarui detail untuk pengiriman ${shipmentToEdit.transactionId}` : 'Isi detail untuk data pengiriman baru berdasarkan item di keranjang.'}
        </DialogDescription>
      </DialogHeader>
    <Form {...form}>
        <form id="shipment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 flex-1 flex flex-col min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
              control={form.control}
              name="user"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>User</FormLabel>
                  <FormControl>
                      <Input placeholder="cth. User A" {...field} readOnly />
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
                    <FormLabel>No. Transaksi</FormLabel>
                    <FormControl>
                        <Input placeholder="Akan dibuat otomatis" {...field} readOnly />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  name="expedition"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Nama Ekspedisi</FormLabel>
                      <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                  <SelectValue placeholder="Pilih ekspedisi" />
                              </SelectTrigger>
                              <SelectContent>
                                  {expeditions.map(exp => (
                                      <SelectItem key={exp.id} value={exp.name}>{exp.name}</SelectItem>
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
                    name="packagingId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipe Kemasan</FormLabel>
                            <FormControl>
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        handlePackagingChange(value);
                                    }}
                                    defaultValue={field.value}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Kemasan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {packagingOptions.map(opt => (
                                            <SelectItem key={opt.id} value={opt.id}>
                                                {opt.name} ({formatRupiah(opt.cost)})
                                            </SelectItem>
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
                    name="receipt"
                    render={() => (
                        <FormItem>
                            <FormLabel>Resi (PDF) (Opsional)</FormLabel>
                            <FormControl>
                                <div>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        ref={pdfFileInputRef}
                                        onChange={handlePdfFileChange}
                                        className="hidden"
                                    />
                                    <Button type="button" variant="outline" onClick={() => pdfFileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {receiptValue?.fileName ? 'Ganti File' : 'Unggah PDF'}
                                    </Button>
                                </div>
                            </FormControl>
                            {receiptValue?.fileName && <p className="text-sm text-muted-foreground">File: {receiptValue.fileName}</p>}
                            <FormMessage />
                        </FormItem>
                    )}
                />
          </div>
          
          <Card className="flex-1 flex flex-col min-h-0">
              <CardContent className="pt-6 flex-1 overflow-y-auto">
                  <div className="mb-2">
                    <Label>Produk</Label>
                  </div>
                  <div className="overflow-x-auto">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-[80px]">Gambar</TableHead>
                              <TableHead>Nama Produk</TableHead>
                              <TableHead>Kode</TableHead>
                              <TableHead className="w-[120px]">Jumlah</TableHead>
                              <TableHead className="w-[150px]">Harga (Rp)</TableHead>
                              <TableHead className="w-[150px] text-right">Subtotal</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {fields.map((field, index) => {
                              const productValues = form.getValues(`products.${index}`);
                              const quantity = form.watch(`products.${index}.quantity`) || 0;
                              const price = form.watch(`products.${index}.price`) || 0;
                              const subtotal = price * quantity;
                              const productInCart = initialProductsFromCart.find(p => p.id === productValues.productId);

                              return (
                              <TableRow key={field.id}>
                                  <TableCell>
                                      <Image 
                                          src={productValues.imageUrl || 'https://placehold.co/100x100.png'}
                                          alt={productValues.name || 'Pratinjau Gambar'}
                                          width={64}
                                          height={64}
                                          className='rounded-md object-cover h-16 w-16'
                                          data-ai-hint="product image preview"
                                      />
                                  </TableCell>
                                   <TableCell>
                                      <p className="font-medium">{form.watch(`products.${index}.name`)}</p>
                                  </TableCell>
                                  <TableCell>
                                      <p className="font-mono text-sm text-muted-foreground">{form.watch(`products.${index}.code`)}</p>
                                  </TableCell>
                                  <TableCell>
                                      <FormField
                                          control={form.control}
                                          name={`products.${index}.quantity`}
                                          render={({ field: qtyField }) => (
                                              <FormItem><FormControl><Input type="number" min="1" max={productInCart?.stock} {...qtyField} /></FormControl><FormMessage /></FormItem>
                                          )}
                                      />
                                  </TableCell>
                                  <TableCell>
                                    <p>{formatRupiah(price)}</p>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                      {formatRupiah(subtotal > 0 ? subtotal : 0)}
                                  </TableCell>
                                  <TableCell>
                                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          )})}
                      </TableBody>
                  </Table>
                  </div>
                  <FormMessage>{form.formState.errors.products?.root?.message}</FormMessage>
                  <FormMessage>{form.formState.errors.products?.[0]?.productId?.message}</FormMessage>
              </CardContent>
              <Summary control={form.control} />
          </Card>
        </form>
    </Form>
      <DialogFooter className="mt-auto">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" form="shipment-form" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Simpan Perubahan' : 'Simpan Pengiriman'}
        </Button>
      </DialogFooter>
    </div>
  );
}

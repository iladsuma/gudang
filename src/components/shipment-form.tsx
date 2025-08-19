
'use client';

import * as React from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Shipment, Expedition, Product, Packaging, CartItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, PlusCircle, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { addShipment, getExpeditions, getProducts, getPackagingOptions } from '@/lib/data';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

const shipmentProductSchema = z.object({
  productId: z.string().min(1, 'Produk harus dipilih.'),
  code: z.string(), // Will be populated
  name: z.string(), // Will be populated
  quantity: z.coerce.number().int().min(1, 'Jumlah minimal 1'),
  price: z.coerce.number().min(0, 'Harga harus diisi'),
  discount: z.coerce.number().min(0, 'Diskon tidak boleh negatif').default(0),
  packagingId: z.string().min(1, "Pilih kemasan"),
  packagingCost: z.coerce.number().min(0),
  imageUrl: z.string().nullable().default(null),
});

const shipmentFormSchema = z.object({
  user: z.string().min(1, 'User harus diisi'),
  transactionId: z.string().min(1, 'No. Transaksi harus diisi'),
  expedition: z.string().min(1, 'Nama ekspedisi harus dipilih'),
  receipt: z.object({
      fileName: z.string().min(1, 'Nama file resi harus ada'),
      dataUrl: z.string().min(1, 'Data resi harus ada').refine(val => val.startsWith('data:application/pdf;base64,'), { message: 'File harus berupa PDF.' }),
  }).optional(),
  products: z.array(shipmentProductSchema).min(1, 'Minimal harus ada satu produk'),
});

type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;

interface ShipmentFormProps {
  onSuccess: (newShipment: Shipment) => void;
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
    
    const summary = React.useMemo(() => {
        if (!productsValue) return { totalItems: 0, totalShopping: 0, totalPacking: 0, grandTotal: 0 };
        
        const totalItems = productsValue.reduce((sum: number, product: any) => sum + (product?.quantity || 0), 0);
        
        const totalShopping = productsValue.reduce((sum: number, product: any) => {
            const price = product?.price || 0;
            const quantity = product?.quantity || 0;
            const discount = product?.discount || 0;
            const subtotal = (price * quantity) - discount;
            return sum + (subtotal > 0 ? subtotal : 0);
        }, 0);

        const totalPacking = productsValue.reduce((sum: number, product: any) => {
            const packingCost = product?.packagingCost || 0;
            const quantity = product?.quantity || 0;
            return sum + (packingCost * quantity);
        }, 0);

        const grandTotal = totalShopping + totalPacking;
        
        return { totalItems, totalShopping, totalPacking, grandTotal };
    }, [productsValue]);
  
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
            <span className="text-muted-foreground">Total Biaya Pengemasan</span>
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


export function ShipmentForm({ onSuccess, onCancel, initialProductsFromCart = [] }: ShipmentFormProps) {
  const { toast } = useToast();
  const pdfFileInputRef = React.useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [expeditions, setExpeditions] = React.useState<Expedition[]>([]);
  const [packagingOptions, setPackagingOptions] = React.useState<Packaging[]>([]);

  const defaultProducts = initialProductsFromCart.map(item => ({
        productId: item.id,
        code: item.code,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        discount: 0,
        packagingId: '',
        packagingCost: 0,
        imageUrl: item.imageUrl || null,
  }));
  
  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      user: user?.name || '',
      transactionId: '',
      expedition: '',
      products: defaultProducts.length > 0 ? defaultProducts : [],
    },
  });
  
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'products',
  });

  React.useEffect(() => {
    if (initialProductsFromCart.length > 0) {
        const cartProducts = initialProductsFromCart.map(item => ({
            productId: item.id,
            code: item.code,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            discount: 0,
            packagingId: '',
            packagingCost: 0,
            imageUrl: item.imageUrl || null,
        }));
        replace(cartProducts);
    }
  }, [initialProductsFromCart, replace]);
  
  React.useEffect(() => {
    if (user) {
      form.setValue('user', user.name);
    }
    getExpeditions().then(setExpeditions);
    getPackagingOptions().then(setPackagingOptions);
  }, [user, form]);


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
        const newShipment = await addShipment({...data, products: productsWithImage as any });
        toast({
            title: 'Sukses!',
            description: 'Data pengiriman berhasil ditambahkan.',
        });
        onSuccess(newShipment);
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
        form.setValue(`products.${index}.quantity`, product.quantity);
      }
  };
  
  const handlePackagingChange = (packagingId: string, index: number) => {
    const packaging = packagingOptions.find(p => p.id === packagingId);
    if (packaging) {
        form.setValue(`products.${index}.packagingCost`, packaging.cost, { shouldValidate: true });
    }
  }

  const receiptValue = form.watch('receipt');
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Tambah Data Pengiriman Baru</DialogTitle>
        <DialogDescription>
          Isi detail untuk data pengiriman baru berdasarkan item di keranjang.
        </DialogDescription>
      </DialogHeader>
    <Form {...form}>
        <form id="shipment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                      <Input placeholder="cth. A-1" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
              />
          </div>
          
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
          
          <Card>
              <CardContent className="pt-6">
                  <div className="mb-2">
                    <Label>Produk</Label>
                  </div>
                  <div className="overflow-x-auto">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-[80px]">Gambar</TableHead>
                              <TableHead className="w-[220px]">Nama Produk (dari Keranjang)</TableHead>
                              <TableHead>Kode</TableHead>
                              <TableHead className="w-[100px]">Jumlah</TableHead>
                              <TableHead className="w-[150px]">Harga (Rp)</TableHead>
                              <TableHead className="w-[170px]">Diskon (Rp)</TableHead>
                              <TableHead className="w-[170px]">Kemasan</TableHead>
                              <TableHead className="w-[150px] text-right">Subtotal</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {fields.map((field, index) => {
                              const productValues = form.getValues(`products.${index}`);
                              const quantity = form.watch(`products.${index}.quantity`) || 0;
                              const price = form.watch(`products.${index}.price`) || 0;
                              const discount = form.watch(`products.${index}.discount`) || 0;
                              const subtotal = (price * quantity) - discount;
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
                                      <FormField
                                          control={form.control}
                                          name={`products.${index}.productId`}
                                          render={({ field: productField }) => (
                                              <FormItem>
                                                  <FormControl>
                                                      <Select
                                                          onValueChange={(value) => {
                                                              productField.onChange(value);
                                                              handleProductSelectionChange(value, index);
                                                          }}
                                                          defaultValue={productField.value}
                                                      >
                                                          <SelectTrigger>
                                                              <SelectValue placeholder="Pilih Produk dari Keranjang" />
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                              {initialProductsFromCart.map(opt => (
                                                                  <SelectItem key={opt.id} value={opt.id}>
                                                                      {opt.name} (Stok: {opt.stock})
                                                                  </SelectItem>
                                                              ))}
                                                          </SelectContent>
                                                      </Select>
                                                  </FormControl>
                                                  <FormMessage />
                                              </FormItem>
                                          )}
                                      />
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
                                      <FormField
                                          control={form.control}
                                          name={`products.${index}.price`}
                                          render={({ field: priceField }) => (
                                              <FormItem><FormControl><Input type="number" placeholder="Rp" {...priceField} readOnly /></FormControl><FormMessage /></FormItem>
                                          )}
                                      />
                                  </TableCell>
                                  <TableCell>
                                      <FormField
                                          control={form.control}
                                          name={`products.${index}.discount`}
                                          render={({ field: discountField }) => (
                                              <FormItem><FormControl><Input type="number" min="0" placeholder="Rp" {...discountField} /></FormControl><FormMessage /></FormItem>
                                          )}
                                      />
                                  </TableCell>
                                  <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`products.${index}.packagingId`}
                                            render={({ field: packagingField }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Select
                                                            onValueChange={(value) => {
                                                                packagingField.onChange(value);
                                                                handlePackagingChange(value, index);
                                                            }}
                                                            defaultValue={packagingField.value}
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
                  <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                          append({ 
                              productId: '',
                              code: '',
                              name: '', 
                              quantity: 1,
                              price: 0,
                              discount: 0,
                              packagingId: '',
                              packagingCost: 0,
                              imageUrl: null
                          });
                      }}
                      >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Tambah Produk dari Keranjang
                  </Button>
                  <FormMessage>{form.formState.errors.products?.root?.message}</FormMessage>
                  <FormMessage>{form.formState.errors.products?.[0]?.productId?.message}</FormMessage>
              </CardContent>
              <Summary control={form.control} />
          </Card>
        </form>
    </Form>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" form="shipment-form" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Pengiriman
        </Button>
      </DialogFooter>
    </>
  );
}

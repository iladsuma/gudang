
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Shipment, Expedition, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, PlusCircle, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { addShipment, getExpeditions, getProducts } from '@/lib/data';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { cn } from '@/lib/utils';

const shipmentProductSchema = z.object({
  productId: z.string().optional(),
  isManual: z.boolean().default(false),
  name: z.string().min(1, 'Nama produk harus diisi'),
  quantity: z.coerce.number().int().min(1, 'Kuantitas min 1'),
  price: z.coerce.number().min(0, 'Harga harus diisi'),
  discount: z.coerce.number().min(0, 'Diskon tidak boleh negatif').default(0),
  packingFee: z.coerce.number().min(0, 'Biaya pengemasan tidak boleh negatif').default(0),
  imageUrl: z.string().optional().or(z.literal('')),
});

const shipmentFormSchema = z.object({
  user: z.string().min(1, 'User harus diisi'),
  transactionId: z.string().min(1, 'No. Transaksi harus diisi'),
  expedition: z.string().min(1, 'Nama ekspedisi harus dipilih'),
  receipt: z.object({
      fileName: z.string().min(1, 'Nama file resi harus ada'),
      dataUrl: z.string().min(1, 'Data resi harus ada').refine(val => val.startsWith('data:application/pdf;base64,'), { message: 'File harus berupa PDF.' }),
  }, { required_error: 'File resi harus diunggah' }),
  products: z.array(shipmentProductSchema).min(1, 'Minimal harus ada satu produk'),
});

type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;

interface ShipmentFormProps {
  onSuccess: (newShipment: Shipment) => void;
  onCancel: () => void;
}

const formatRupiah = (number: number) => {
    if (number === null || typeof number === 'undefined' || isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
};

const Summary = ({ form }: { form: any }) => {
    const productsValue = form.watch('products');
    
    const calculateSummary = React.useCallback((products: any[]) => {
      if (!products) return { totalItems: 0, totalShopping: 0, totalPacking: 0, grandTotal: 0 };
      
      const totalItems = products.reduce((sum, product) => sum + (product?.quantity || 0), 0);
      
      const totalShopping = products.reduce((sum, product) => {
          const price = product?.price || 0;
          const quantity = product?.quantity || 0;
          const discount = product?.discount || 0;
          const subtotal = (price * quantity) - discount;
          return sum + (subtotal > 0 ? subtotal : 0);
      }, 0);

      const totalPacking = products.reduce((sum, product) => {
          const packingFee = product?.packingFee || 0;
          const quantity = product?.quantity || 0;
          return sum + (packingFee * quantity);
      }, 0);

      const grandTotal = totalShopping + totalPacking;
      
      return { totalItems, totalShopping, totalPacking, grandTotal };
    }, []);

    const summary = calculateSummary(productsValue);
  
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


export function ShipmentForm({ onSuccess, onCancel }: ShipmentFormProps) {
  const { toast } = useToast();
  const pdfFileInputRef = React.useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [expeditions, setExpeditions] = React.useState<Expedition[]>([]);
  const [masterProducts, setMasterProducts] = React.useState<Product[]>([]);
  
  const imageInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      user: user?.name || '',
      transactionId: '',
      expedition: '',
      products: [],
    },
  });
  
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'products',
  });
  
  React.useEffect(() => {
    if (user) {
      form.setValue('user', user.name);
    }
    getExpeditions().then(setExpeditions);
    getProducts().then(setMasterProducts);
  }, [user, form]);
  
  React.useEffect(() => {
    if (fields.length === 0 && masterProducts.length > 0) {
      const firstProduct = masterProducts[0];
      append({
        productId: firstProduct.id,
        name: firstProduct.name,
        isManual: false,
        quantity: 1,
        price: firstProduct.price,
        discount: 0,
        packingFee: 0, // default packing fee to 0
        imageUrl: firstProduct.imageUrl
      });
    }
  }, [fields.length, masterProducts, append]);


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

  const handleProductImageChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'File tidak valid', description: 'Silakan pilih file gambar.' });
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        form.setValue(`products.${index}.imageUrl`, reader.result as string, { shouldValidate: true });
    };
    reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({ variant: 'destructive', title: 'Kesalahan', description: 'Gagal membaca file gambar.' });
    };
  };

  const onSubmit = async (data: ShipmentFormValues) => {
    setIsSubmitting(true);
    try {
        const productsWithImage = data.products.map(p => ({...p, imageUrl: p.imageUrl || 'https://placehold.co/100x100.png' }));
        const newShipment = await addShipment({...data, products: productsWithImage });
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
  
  const handleProductSelectionChange = (value: string, index: number) => {
    const isManual = !masterProducts.some(p => p.id === value);
    
    if (isManual) {
        // This case is for manual input, handled by onBlur or Enter.
        // We just update the name for now.
        update(index, {
            ...fields[index],
            name: value,
            productId: undefined,
        });
    } else {
        const selectedProduct = masterProducts.find(p => p.id === value);
        if (selectedProduct) {
            update(index, {
                ...fields[index],
                productId: selectedProduct.id,
                name: selectedProduct.name,
                price: selectedProduct.price,
                imageUrl: selectedProduct.imageUrl,
                isManual: false,
            });
        }
    }
  };

  const handleManualToggle = (isManual: boolean, index: number) => {
    const currentProduct = fields[index];
    if (isManual) {
        update(index, { ...currentProduct, isManual: true, productId: '', name: '', price: 0, packingFee: 0, imageUrl: 'https://placehold.co/100x100.png' });
    } else {
        const firstProduct = masterProducts[0];
        if (firstProduct) {
            update(index, {
                ...currentProduct,
                isManual: false,
                productId: firstProduct.id,
                name: firstProduct.name,
                price: firstProduct.price,
                imageUrl: firstProduct.imageUrl,
                packingFee: 0,
            });
        }
    }
  };
  

  const receiptValue = form.watch('receipt');
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DialogDescription>
          Isi detail untuk data pengiriman baru.
        </DialogDescription>
        
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
                    <FormLabel>Resi (PDF)</FormLabel>
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
                <FormLabel>Produk</FormLabel>
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Gambar</TableHead>
                            <TableHead>Nama Produk</TableHead>
                            <TableHead className="w-[100px]">Jumlah</TableHead>
                            <TableHead className="w-[150px]">Harga (Rp)</TableHead>
                            <TableHead className="w-[150px]">Diskon (Rp)</TableHead>
                            <TableHead className="w-[150px]">Pengemasan/pcs (Rp)</TableHead>
                            <TableHead className="w-[160px] text-right">Subtotal</TableHead>
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
                            const isManual = form.watch(`products.${index}.isManual`);
                            const currentStock = masterProducts.find(p => p.id === productValues.productId)?.stock;

                            return (
                            <TableRow key={field.id}>
                                <TableCell>
                                    <div className='flex flex-col items-center gap-2'>
                                        <Image 
                                            src={productValues.imageUrl || 'https://placehold.co/100x100.png'}
                                            alt={productValues.name || 'Pratinjau Gambar'}
                                            width={64}
                                            height={64}
                                            className='rounded-md object-cover h-16 w-16'
                                            data-ai-hint="product image preview"
                                        />
                                         <input
                                            type="file"
                                            accept="image/*"
                                            ref={(el) => (imageInputRefs.current[index] = el)}
                                            onChange={(e) => handleProductImageChange(e, index)}
                                            className="hidden"
                                            disabled={!isManual}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => imageInputRefs.current[index]?.click()}
                                            disabled={!isManual}
                                        >
                                           <Upload className='mr-2 h-3 w-3'/> Unggah
                                        </Button>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name={`products.${index}.imageUrl`}
                                        render={({ field }) => (
                                            <FormItem><FormControl><Input type="hidden" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className='space-y-2'>
                                        <div className='flex items-center space-x-2'>
                                            <Switch
                                               id={`manual-switch-${index}`}
                                               checked={isManual}
                                               onCheckedChange={(checked) => handleManualToggle(checked, index)}
                                            />
                                            <label htmlFor={`manual-switch-${index}`} className='text-sm'>Input Manual</label>
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name={`products.${index}.name`}
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    {isManual ? (
                                                      <Input placeholder="Nama produk baru" {...field} />
                                                    ) : (
                                                      <Select
                                                        onValueChange={(value) => {
                                                            field.onChange(value); // Important to keep this to update the form's internal state for the field
                                                            handleProductSelectionChange(value, index);
                                                        }}
                                                        value={productValues.productId} // Use productId for value
                                                      >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih produk" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {masterProducts.map(p => (
                                                                <SelectItem key={p.id} value={p.id}>
                                                                    {p.name} (Stok: {p.stock})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                      </Select>
                                                    )}
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                            )}
                                        />
                                        {!isManual && typeof currentStock !== 'undefined' && (
                                            <p className='text-xs text-muted-foreground'>Stok tersedia: {currentStock}</p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`products.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}
                                    />
                                </TableCell>
                                 <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`products.${index}.price`}
                                        render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" placeholder="Rp" {...field} disabled={!isManual} /></FormControl><FormMessage /></FormItem>
                                        )}
                                    />
                                </TableCell>
                                 <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`products.${index}.discount`}
                                        render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" placeholder="Rp" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`products.${index}.packingFee`}
                                        render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" placeholder="Rp" {...field} /></FormControl><FormMessage /></FormItem>
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
                        const firstProduct = masterProducts[0];
                        if (firstProduct) {
                            append({ 
                                productId: firstProduct.id, 
                                name: firstProduct.name, 
                                quantity: 1,
                                price: firstProduct.price,
                                discount: 0,
                                packingFee: 0,
                                isManual: false,
                                imageUrl: firstProduct.imageUrl
                            });
                        } else {
                            // Fallback if no master products exist
                            append({
                                isManual: true,
                                name: '',
                                quantity: 1,
                                price: 0,
                                discount: 0,
                                packingFee: 0,
                                imageUrl: 'https://placehold.co/100x100.png'
                            })
                        }
                    }}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Produk
                </Button>
                <FormMessage>{form.formState.errors.products?.root?.message}</FormMessage>
            </CardContent>
            <Summary form={form} />
        </Card>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Pengiriman
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


'use client';

import * as React from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Shipment, ShipmentProduct, Account, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription, Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, PlusCircle, Trash2, ImageIcon, ZoomIn } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { addShipment, updateShipment, getAccounts, getProducts } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from './ui/textarea';
import Image from 'next/image';

const shipmentProductSchema = z.object({
  productId: z.string(),
  code: z.string(),
  category: z.string(),
  name: z.string().min(1, 'Jenis jahitan harus dipilih'),
  quantity: z.coerce.number().int().min(1, 'Jumlah minimal 1'),
  price: z.coerce.number().min(0, 'Harga harus diisi'),
  costPrice: z.coerce.number().min(0),
  imageUrl: z.string().nullable().default(null),
  notes: z.string().optional(),
});

const bodyMeasurementsSchema = z.object({
    ld: z.string().optional(),
    panjangPunggung: z.string().optional(),
    lBahu: z.string().optional(),
    pLengan: z.string().optional(),
    lingkarTelapakTangan: z.string().optional(),
    lp: z.string().optional(),
    lingkarHip: z.string().optional(),
    tinggiHip: z.string().optional(),
    tinggiDuduk: z.string().optional(),
    pBawah: z.string().optional(),
    lBawah: z.string().optional(),
    notes: z.string().optional(),
});

const shipmentFormSchema = z.object({
  userId: z.string().optional(),
  transactionId: z.string().min(1, 'No. Transaksi harus diisi.'),
  customerName: z.string().min(1, 'Nama pelanggan harus diisi'),
  deliveryMethod: z.enum(['Diambil di Toko', 'Dikirim Kurir Toko']),
  accountId: z.string().optional(),
  products: z.array(shipmentProductSchema).min(1, 'Minimal harus ada satu item pesanan'),
  downPayment: z.coerce.number().min(0).optional(),
  bodyMeasurements: bodyMeasurementsSchema,
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
            <span className="text-muted-foreground">Subtotal Tagihan</span>
            <span className="font-medium">{formatRupiah(summary.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uang Muka (DP)</span>
            <span className="font-medium text-red-600">-{formatRupiah(summary.dp)}</span>
          </div>
        </div>
        <div className="w-full max-w-sm space-y-2 text-sm">
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-base font-bold">Sisa Pelunasan</span>
            <span className="text-base font-bold text-primary">{formatRupiah(summary.remaining)}</span>
          </div>
        </div>
      </CardFooter>
    );
};

function ImagePreview({ src, category }: { src: string | null, category: string }) {
    if (!src) return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="relative h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden cursor-zoom-in group">
                    <img src={src} alt={category} className="h-10 w-10 object-cover group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ZoomIn className="h-4 w-4 text-white" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl flex items-center justify-center p-1 bg-transparent border-none shadow-none">
                <DialogTitle className="sr-only">Pratinjau Gambar {category}</DialogTitle>
                <div className="relative w-full max-h-[80vh] aspect-auto flex items-center justify-center">
                    <img src={src} alt={category} className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain" />
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function ShipmentForm({ shipmentToEdit, onSuccess, onCancel }: ShipmentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [masterProducts, setMasterProducts] = React.useState<Product[]>([]);

  const isEditMode = !!shipmentToEdit;

  const generateTransactionId = React.useCallback(() => {
    const userNamePart = user?.username.split(' ')[0].toUpperCase() || 'ADMIN';
    const date = new Date();
    const datePart = `${String(date.getFullYear()).slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${userNamePart}-${datePart}-${randomPart}`;
  }, [user]);
  
  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: isEditMode ? {
        userId: shipmentToEdit.userId || '', 
        transactionId: shipmentToEdit.transactionId,
        customerName: shipmentToEdit.customerName,
        deliveryMethod: shipmentToEdit.deliveryMethod || 'Diambil di Toko',
        accountId: shipmentToEdit.accountId || '',
        products: shipmentToEdit.products || [],
        bodyMeasurements: shipmentToEdit.bodyMeasurements || { 
            ld: '', panjangPunggung: '', lBahu: '', pLengan: '', 
            lingkarTelapakTangan: '', lp: '', lingkarHip: '', 
            tinggiHip: '', tinggiDuduk: '', pBawah: '', lBawah: '', notes: '' 
        },
        downPayment: shipmentToEdit.downPayment || 0,
    } : {
      userId: '', // Kosongkan agar masuk ke daftar "Pesanan Baru" admin untuk ditawarkan
      transactionId: generateTransactionId(),
      customerName: '',
      deliveryMethod: 'Diambil di Toko',
      accountId: '',
      products: [{ productId: '', code: '', category: '', name: '', quantity: 1, price: 0, costPrice: 0, imageUrl: null, notes: '' }],
      bodyMeasurements: { 
        ld: '', panjangPunggung: '', lBahu: '', pLengan: '', 
        lingkarTelapakTangan: '', lp: '', lingkarHip: '', 
        tinggiHip: '', tinggiDuduk: '', pBawah: '', lBawah: '', notes: '' 
      },
      downPayment: 0,
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'products',
  });

  React.useEffect(() => {
    getAccounts().then(setAccounts);
    getProducts().then(setMasterProducts);
  }, []);

  const handleAddItem = () => {
      append({
          productId: '',
          code: '',
          category: '',
          name: '',
          quantity: 1,
          price: 0,
          costPrice: 0,
          imageUrl: null,
          notes: ''
      });
  };

  const handleCategorySelect = (index: number, productId: string) => {
    const product = masterProducts.find(p => p.id === productId);
    if (product) {
        form.setValue(`products.${index}.productId`, product.id);
        form.setValue(`products.${index}.code`, product.code);
        form.setValue(`products.${index}.category`, product.category);
        form.setValue(`products.${index}.name`, product.category);
        form.setValue(`products.${index}.price`, product.price);
        form.setValue(`products.${index}.costPrice`, product.costPrice);
        form.setValue(`products.${index}.imageUrl`, product.imageUrl);
    }
  };

  const onSubmit = async (data: ShipmentFormValues) => {
    setIsSubmitting(true);
    try {
        const totalItems = data.products.reduce((sum, p) => sum + p.quantity, 0);
        const totalProductCost = data.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        const totalAmount = totalProductCost;

        const payload: Omit<Shipment, 'id' | 'createdAt' | 'status'> = { 
            ...data, 
            userId: data.userId || '', // Memastikan tetap string kosong jika tidak ada userId
            customerId: 'cust_manual',
            totalItems,
            totalProductCost,
            totalPackingCost: 0,
            totalAmount,
            totalRevenue: totalAmount,
            paymentStatus: (data.downPayment || 0) >= totalAmount ? 'Lunas' : 'Belum Lunas',
        };

        if (isEditMode) {
            const updated = await updateShipment(shipmentToEdit.id, payload);
            toast({ title: 'Sukses!', description: `Pesanan ${data.transactionId} diperbarui.` });
            onSuccess(updated);
        } else {
            const newShipment = await addShipment(payload);
            toast({ title: 'Sukses!', description: `Pesanan ${data.transactionId} ditambahkan.` });
            onSuccess(newShipment);
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Kesalahan', description: error instanceof Error ? error.message : 'Terjadi kesalahan.' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
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
            <form id="shipment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
                  <FormField
                    control={form.control}
                    name="transactionId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>No. Pesanan</FormLabel>
                        <FormControl>
                            <Input {...field} readOnly disabled className="bg-muted font-mono" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Nama Pelanggan</FormLabel>
                          <FormControl>
                              <Input placeholder="Nama Lengkap..." {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="deliveryMethod"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Metode Pengiriman</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Pilih Pengiriman" />
                                  </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="Diambil di Toko">Diambil di Toko</SelectItem>
                                  <SelectItem value="Dikirim Kurir Toko">Dikirim Kurir Toko</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
              </div>

              <Card>
                  <CardHeader className="pb-3">
                      <CardTitle className="text-base">Informasi Ukuran Badan (cm)</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      <FormField control={form.control} name="bodyMeasurements.ld" render={({ field }) => (
                          <FormItem><FormLabel>LD</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.panjangPunggung" render={({ field }) => (
                          <FormItem><FormLabel>Pjg Punggung</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.lBahu" render={({ field }) => (
                          <FormItem><FormLabel>Lebar Bahu</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.pLengan" render={({ field }) => (
                          <FormItem><FormLabel>Pjg Lengan</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.lingkarTelapakTangan" render={({ field }) => (
                          <FormItem><FormLabel>Lk. Telapak</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.lp" render={({ field }) => (
                          <FormItem><FormLabel>LP (Pinggang)</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.lingkarHip" render={({ field }) => (
                          <FormItem><FormLabel>Lk. Hip</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.tinggiHip" render={({ field }) => (
                          <FormItem><FormLabel>T. Hip</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.tinggiDuduk" render={({ field }) => (
                          <FormItem><FormLabel>Tinggi Duduk</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.pBawah" render={({ field }) => (
                          <FormItem><FormLabel>Pjg Bawah</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.lBawah" render={({ field }) => (
                          <FormItem><FormLabel>Lbr Bawah</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <div className="col-span-full">
                        <FormField control={form.control} name="bodyMeasurements.notes" render={({ field }) => (
                            <FormItem><FormLabel>Catatan Tambahan Ukuran</FormLabel><FormControl><Textarea placeholder="Detail model kerah, saku, dll." {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                  </CardContent>
              </Card>
              
              <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base">Daftar Jahitan / Pesanan</CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Baju
                      </Button>
                  </CardHeader>
                  <CardContent>
                      <div className="overflow-x-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-[80px]">Gambar</TableHead>
                                  <TableHead className="w-[200px]">Jenis Jahitan</TableHead>
                                  <TableHead>Deskripsi/Model</TableHead>
                                  <TableHead className="w-[80px]">Jumlah</TableHead>
                                  <TableHead className="w-[150px]">Harga Jasa (Rp)</TableHead>
                                  <TableHead className="w-[130px] text-right">Subtotal</TableHead>
                                  <TableHead className="w-[40px]"></TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {fields.map((field, index) => {
                                  const item = form.watch(`products.${index}`);
                                  const subtotal = (item.price || 0) * (item.quantity || 0);

                                  return (
                                  <TableRow key={field.id}>
                                       <TableCell>
                                          <ImagePreview src={item.imageUrl} category={item.category} />
                                      </TableCell>
                                       <TableCell>
                                          <FormField
                                              control={form.control}
                                              name={`products.${index}.productId`}
                                              render={({ field: pidField }) => (
                                                  <FormItem>
                                                      <Select 
                                                        onValueChange={(val) => handleCategorySelect(index, val)} 
                                                        defaultValue={pidField.value}
                                                      >
                                                          <FormControl>
                                                              <SelectTrigger>
                                                                  <SelectValue placeholder="Pilih Jenis" />
                                                              </SelectTrigger>
                                                          </FormControl>
                                                          <SelectContent>
                                                              {masterProducts.map(p => (
                                                                  <SelectItem key={p.id} value={p.id}>{p.category} ({p.code})</SelectItem>
                                                              ))}
                                                          </SelectContent>
                                                      </Select>
                                                      <FormMessage />
                                                  </FormItem>
                                              )}
                                          />
                                      </TableCell>
                                      <TableCell>
                                          <FormField
                                              control={form.control}
                                              name={`products.${index}.notes`}
                                              render={({ field: notesField }) => (
                                                  <FormItem>
                                                      <FormControl>
                                                          <Input placeholder="Cth: Lengan balon, kerah shanghai..." {...notesField} />
                                                      </FormControl>
                                                      <FormMessage />
                                                  </FormItem>
                                              )}
                                          />
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
                                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                                              <Trash2 className="h-4 w-4 text-destructive" />
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

              <Card>
                  <CardHeader className="pb-3">
                      <CardTitle className="text-base">Pembayaran DP</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            <SelectValue placeholder="Pilih akun" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} ({formatRupiah(acc.balance)})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                  </CardContent>
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

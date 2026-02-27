
'use client';

import * as React from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Shipment, Customer, ShipmentProduct, Account, User, BodyMeasurements } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { addShipment, updateShipment, getCustomers, getAccounts } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';


const shipmentProductSchema = z.object({
  productId: z.string(),
  code: z.string(),
  name: z.string().min(1, 'Nama pesanan harus diisi'),
  quantity: z.coerce.number().int().min(1, 'Jumlah minimal 1'),
  price: z.coerce.number().min(0, 'Harga harus diisi'),
  costPrice: z.coerce.number().min(0),
  imageUrl: z.string().nullable().default(null),
});

const bodyMeasurementsSchema = z.object({
    ld: z.string().optional(),
    lp: z.string().optional(),
    lPanggul: z.string().optional(),
    lBahu: z.string().optional(),
    pLengan: z.string().optional(),
    pBaju: z.string().optional(),
    notes: z.string().optional(),
});

const shipmentFormSchema = z.object({
  userId: z.string().min(1, 'User harus diisi'),
  transactionId: z.string().min(1, 'No. Transaksi harus diisi.'),
  customerId: z.string().min(1, 'Pelanggan harus dipilih'),
  customerName: z.string().min(1, 'Nama pelanggan harus ada'),
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
        userId: shipmentToEdit.userId, 
        transactionId: shipmentToEdit.transactionId,
        customerId: shipmentToEdit.customerId,
        customerName: shipmentToEdit.customerName,
        accountId: shipmentToEdit.accountId || '',
        products: shipmentToEdit.products || [],
        bodyMeasurements: shipmentToEdit.bodyMeasurements || { ld: '', lp: '', lPanggul: '', lBahu: '', pLengan: '', pBaju: '', notes: '' },
        downPayment: shipmentToEdit.downPayment || 0,
    } : {
      userId: user?.id || '',
      transactionId: generateTransactionId(),
      customerId: '',
      customerName: '',
      accountId: '',
      products: [{ productId: 'manual', code: 'JHT', name: '', quantity: 1, price: 0, costPrice: 0, imageUrl: null }],
      bodyMeasurements: { ld: '', lp: '', lPanggul: '', lBahu: '', pLengan: '', pBaju: '', notes: '' },
      downPayment: 0,
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'products',
  });

  React.useEffect(() => {
    getCustomers().then(setCustomers);
    getAccounts().then(setAccounts);
  }, []);

  const handleAddItem = () => {
      append({
          productId: 'manual',
          code: 'JHT',
          name: '',
          quantity: 1,
          price: 0,
          costPrice: 0,
          imageUrl: null
      });
  };


  const onSubmit = async (data: ShipmentFormValues) => {
    setIsSubmitting(true);
    try {
        const totalItems = data.products.reduce((sum, p) => sum + p.quantity, 0);
        const totalProductCost = data.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        const totalAmount = totalProductCost;

        const payload: Omit<Shipment, 'id' | 'createdAt' | 'status'> = { 
            ...data, 
            userId: data.userId,
            customerName: data.customerName,
            products: data.products,
            totalItems,
            totalProductCost: totalProductCost,
            totalPackingCost: 0,
            totalAmount,
            totalRevenue: totalAmount,
            paymentStatus: (data.downPayment || 0) >= totalAmount ? 'Lunas' : 'Belum Lunas',
            bodyMeasurements: data.bodyMeasurements,
        };

        if (isEditMode) {
            const updated = await updateShipment(shipmentToEdit.id, payload);
            toast({ title: 'Sukses!', description: `Data pesanan ${data.transactionId} berhasil diperbarui.` });
            onSuccess(updated);
        } else {
            const newShipment = await addShipment(payload);
            toast({ title: 'Sukses!', description: `Pesanan baru ${data.transactionId} berhasil ditambahkan.` });
            onSuccess(newShipment);
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Kesalahan', description: error instanceof Error ? error.message : 'Terjadi kesalahan.' });
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
            <form id="shipment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
                  <FormField
                    control={form.control}
                    name="transactionId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>No. Pesanan</FormLabel>
                        <FormControl>
                            <Input {...field} readOnly disabled className="bg-muted" />
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
              </div>

              <Card>
                  <CardHeader className="pb-3">
                      <CardTitle className="text-base">Informasi Ukuran Badan (cm)</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <FormField control={form.control} name="bodyMeasurements.ld" render={({ field }) => (
                          <FormItem><FormLabel>Lingkar Dada (LD)</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.lp" render={({ field }) => (
                          <FormItem><FormLabel>Lingkar Pinggang (LP)</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.lPanggul" render={({ field }) => (
                          <FormItem><FormLabel>Lingkar Panggul</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.lBahu" render={({ field }) => (
                          <FormItem><FormLabel>Lebar Bahu</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.pLengan" render={({ field }) => (
                          <FormItem><FormLabel>Panjang Lengan</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="bodyMeasurements.pBaju" render={({ field }) => (
                          <FormItem><FormLabel>Panjang Baju</FormLabel><FormControl><Input placeholder="0" {...field} /></FormControl></FormItem>
                      )} />
                      <div className="col-span-full">
                        <FormField control={form.control} name="bodyMeasurements.notes" render={({ field }) => (
                            <FormItem><FormLabel>Catatan Tambahan Ukuran</FormLabel><FormControl><Textarea placeholder="Cth: Ukuran celana, lingkar paha, dll." {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                  </CardContent>
              </Card>
              
              <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base">Daftar Jahitan / Pesanan</CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Item
                      </Button>
                  </CardHeader>
                  <CardContent>
                      <div className="overflow-x-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Deskripsi Jahitan</TableHead>
                                  <TableHead className="w-[100px]">Jumlah</TableHead>
                                  <TableHead className="w-[180px]">Harga (Rp)</TableHead>
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
                                          <FormField
                                              control={form.control}
                                              name={`products.${index}.name`}
                                              render={({ field: nameField }) => (
                                                  <FormItem><FormControl><Input placeholder="Cth: Kebaya Modern Brokat" {...nameField} /></FormControl><FormMessage /></FormItem>
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
                      <CardTitle className="text-base">Pembayaran Awal (DP)</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="downPayment"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Jumlah Uang Muka (DP)</FormLabel>
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
                                            <SelectValue placeholder="Pilih akun kas/bank" />
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

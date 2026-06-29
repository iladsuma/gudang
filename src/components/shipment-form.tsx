
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
import { Loader2, PlusCircle, Trash2, ImageIcon, ZoomIn, Images, ChevronLeft, ChevronRight, Truck } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { addShipment, updateShipment, getAccounts, getProducts } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';

const shipmentProductSchema = z.object({
  productId: z.string(),
  code: z.string(),
  category: z.string(),
  name: z.string().min(1, 'Jenis jahitan harus dipilih'),
  quantity: z.coerce.number().int().min(1, 'Jumlah minimal 1'),
  price: z.coerce.number().min(0, 'Harga harus diisi'),
  costPrice: z.coerce.number().min(0),
  imageUrl: z.string().nullable().default(null),
  imageUrls: z.array(z.string()).optional(),
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
  deliveryMethod: z.enum(['Diambil di Toko', 'Dikirim Kurir Toko']).optional(),
  deliveryDistance: z.coerce.number().min(0).max(30, 'Jarak maksimal 30 km').optional(),
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
    message: 'Pilih akun pembayaran.',
    path: ['accountId'],
});

type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;

interface ShipmentFormProps {
  shipmentToEdit?: Shipment;
  onSuccess: (newOrUpdatedShipment: Shipment) => void;
  onCancel: () => void;
}

const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

function GalleryViewer({ images, category }: { images: string[] | undefined, category: string }) {
    const [index, setIndex] = React.useState(0);
    if (!images || images.length === 0) return null;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2 text-[10px]">
                    <Images className="h-3 w-3 mr-1" /> Katalog
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black/95 border-none shadow-none">
                <DialogTitle className="sr-only">Galeri {category}</DialogTitle>
                <div className="relative w-full h-[70vh] flex items-center justify-center">
                    <img src={images[index]} alt={`${category} ${index + 1}`} className="max-w-full max-h-full object-contain" />
                    
                    {images.length > 1 && (
                        <>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute left-4 text-white hover:bg-white/20"
                                onClick={() => setIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-4 text-white hover:bg-white/20"
                                onClick={() => setIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
                            >
                                <ChevronRight className="h-8 w-8" />
                            </Button>
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {images.map((_, i) => (
                                    <div key={i} className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-white" : "bg-white/30")} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 text-center">
                    <p className="font-bold text-sm">{category}</p>
                    <p className="text-xs text-muted-foreground">Gambar {index + 1} dari {images.length}</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function ShipmentForm({ shipmentToEdit, onSuccess, onCancel }: ShipmentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [masterProducts, setMasterProducts] = React.useState<Product[]>([]);

  const isEditMode = !!shipmentToEdit;

  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: isEditMode ? {
        userId: shipmentToEdit.userId || '', 
        transactionId: shipmentToEdit.transactionId,
        customerName: shipmentToEdit.customerName,
        deliveryMethod: shipmentToEdit.deliveryMethod || 'Diambil di Toko',
        deliveryDistance: shipmentToEdit.deliveryDistance || 0,
        accountId: shipmentToEdit.accountId || '',
        products: shipmentToEdit.products || [],
        bodyMeasurements: shipmentToEdit.bodyMeasurements || { 
            ld: '', panjangPunggung: '', lBahu: '', pLengan: '', 
            lingkarTelapakTangan: '', lp: '', lingkarHip: '', 
            tinggiHip: '', tinggiDuduk: '', pBawah: '', lBawah: '', notes: '' 
        },
        downPayment: shipmentToEdit.downPayment || 0,
    } : {
      userId: '', 
      transactionId: `ANT-${Date.now().toString().slice(-6)}`,
      customerName: '',
      deliveryMethod: 'Diambil di Toko',
      deliveryDistance: 0,
      accountId: '',
      products: [{ productId: '', code: '', category: '', name: '', quantity: 1, price: 0, costPrice: 0, imageUrl: null, imageUrls: [], notes: '' }],
      bodyMeasurements: { ld: '', lp: '', notes: '' },
      downPayment: 0,
    },
  });
  
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'products' });

  React.useEffect(() => {
    getAccounts().then(setAccounts);
    getProducts().then(setMasterProducts);
  }, []);

  const handleCategorySelect = (index: number, productId: string) => {
    const product = masterProducts.find(p => p.id === productId);
    if (product) {
        form.setValue(`products.${index}.productId`, product.id);
        form.setValue(`products.${index}.code`, product.code);
        form.setValue(`products.${index}.category`, product.category);
        form.setValue(`products.${index}.name`, product.category);
        form.setValue(`products.${index}.price`, product.price);
        form.setValue(`products.${index}.costPrice`, product.costPrice);
        form.setValue(`products.${index}.imageUrl`, product.imageUrls?.[0] || null);
        form.setValue(`products.${index}.imageUrls`, product.imageUrls || []);
    }
  };

  const deliveryMethod = form.watch('deliveryMethod');
  const distance = form.watch('deliveryDistance') || 0;

  const deliveryFee = React.useMemo(() => {
    if (deliveryMethod !== 'Dikirim Kurir Toko') return 0;
    if (distance <= 0) return 0;
    if (distance <= 5) return 2000;
    if (distance <= 10) return 4000;
    if (distance <= 20) return 10000;
    if (distance <= 30) return 15000;
    return 15000;
  }, [deliveryMethod, distance]);

  const onSubmit = async (data: ShipmentFormValues) => {
    setIsSubmitting(true);
    try {
        const totalItems = data.products.reduce((sum, p) => sum + p.quantity, 0);
        const totalProductCost = data.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        const totalAmount = totalProductCost + deliveryFee;
        
        const payload = { 
            ...data, 
            userId: (data.userId && data.userId.trim() !== '') ? data.userId : null,
            customerId: null,
            totalItems,
            totalProductCost,
            totalPackingCost: 0,
            deliveryFee: deliveryFee,
            totalAmount: totalAmount,
            totalRevenue: totalAmount,
            paymentStatus: (data.downPayment || 0) >= totalAmount ? 'Lunas' : 'Belum Lunas',
        };

        if (isEditMode) {
            const updated = await updateShipment(shipmentToEdit.id, payload as any);
            toast({ title: 'Berhasil', description: 'Pesanan berhasil diperbarui.' });
            onSuccess(updated);
        } else {
            const newShipment = await addShipment(payload as any);
            toast({ title: 'Berhasil', description: 'Pesanan baru berhasil disimpan.' });
            onSuccess(newShipment);
        }
    } catch (error) {
        console.error("Submit Error:", error);
        toast({ variant: 'destructive', title: 'Kesalahan', description: String(error) });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full max-h-[95vh]">
      <DialogHeader className="p-4 border-b">
        <DialogTitle>{isEditMode ? 'Edit Pesanan' : 'Buat Pesanan Baru'}</DialogTitle>
      </DialogHeader>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <Form {...form}>
            <form id="shipment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField control={form.control} name="transactionId" render={({ field }) => (
                        <FormItem><FormLabel>No. Pesanan</FormLabel><FormControl><Input {...field} readOnly className="bg-muted font-mono" /></FormControl></FormItem>
                  )} />
                   <FormField control={form.control} name="customerName" render={({ field }) => (
                        <FormItem><FormLabel>Nama Pelanggan</FormLabel><FormControl><Input placeholder="Contoh: Ibu Rina" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="deliveryMethod" render={({ field }) => (
                        <FormItem><FormLabel>Pengambilan</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Metode" /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value="Diambil di Toko">Diambil di Toko</SelectItem><SelectItem value="Dikirim Kurir Toko">Dikirim Kurir Toko</SelectItem></SelectContent>
                          </Select>
                        </FormItem>
                  )} />
                  {deliveryMethod === 'Dikirim Kurir Toko' && (
                    <FormField control={form.control} name="deliveryDistance" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-1"><Truck className="h-3 w-3" /> Jarak Kirim (km, Maks 30)</FormLabel>
                            <FormControl><Input type="number" placeholder="Contoh: 7" max="30" {...field} /></FormControl>
                            <FormMessage />
                            <p className="text-[10px] text-muted-foreground mt-1">Ongkir: {formatRupiah(deliveryFee)}</p>
                        </FormItem>
                    )} />
                  )}
              </div>

              <Card>
                  <CardHeader className="p-4 pb-0"><CardTitle className="text-sm font-bold uppercase text-primary">Ukuran Badan (cm)</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                      {['ld', 'lp', 'panjangPunggung', 'lBahu', 'pLengan', 'lingkarHip', 'tinggiHip', 'pBawah'].map((key) => (
                          <FormField key={key} control={form.control} name={`bodyMeasurements.${key}` as any} render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] uppercase font-bold">{key.replace(/([A-Z])/g, ' $1')}</FormLabel><FormControl><Input placeholder="0" className="h-8 text-xs" {...field} /></FormControl></FormItem>
                          )} />
                      ))}
                      <div className="col-span-full">
                        <FormField control={form.control} name="bodyMeasurements.notes" render={({ field }) => (
                            <FormItem><FormLabel className="text-[10px] uppercase font-bold">Model / Detail Lainnya</FormLabel><FormControl><Textarea placeholder="Cth: Pakai furing, model kerah shanghai, dll." className="text-xs" {...field} /></FormControl></FormItem>
                        )} />
                      </div>
                  </CardContent>
              </Card>
              
              <Card>
                  <CardHeader className="p-4 flex flex-row items-center justify-between"><CardTitle className="text-sm font-bold uppercase text-primary">Daftar Jahitan</CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', code: '', category: '', name: '', quantity: 1, price: 0, costPrice: 0, imageUrl: null, imageUrls: [], notes: '' })}>
                          <PlusCircle className="mr-1 h-3 w-3" /> Tambah
                      </Button>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4">
                      <div className="space-y-4">
                          {fields.map((field, index) => {
                              const item = form.watch(`products.${index}`);
                              return (
                                <div key={field.id} className="p-3 border rounded-lg bg-slate-50/50 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <FormField control={form.control} name={`products.${index}.productId`} render={({ field: pidField }) => (
                                                <FormItem>
                                                    <Select onValueChange={(val) => handleCategorySelect(index, val)} defaultValue={pidField.value}>
                                                        <FormControl><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Pilih Jenis Jahitan" /></SelectTrigger></FormControl>
                                                        <SelectContent>{masterProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.category}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )} />
                                        </div>
                                        {item.imageUrls && item.imageUrls.length > 0 && (
                                            <GalleryViewer images={item.imageUrls} category={item.category} />
                                        )}
                                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => remove(index)} disabled={fields.length === 1}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <FormField control={form.control} name={`products.${index}.quantity`} render={({ field: qf }) => (
                                            <FormItem><FormLabel className="text-[10px] uppercase font-bold">Jml</FormLabel><FormControl><Input type="number" className="h-8 text-xs" {...qf} /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name={`products.${index}.price`} render={({ field: pf }) => (
                                            <FormItem><FormLabel className="text-[10px] uppercase font-bold">Harga (Rp)</FormLabel><FormControl><Input type="number" className="h-8 text-xs" {...pf} /></FormControl></FormItem>
                                        )} />
                                    </div>
                                    <p className="text-[10px] text-right font-bold text-primary">Subtotal: {formatRupiah((item.price || 0) * (item.quantity || 0))}</p>
                                </div>
                              )
                          })}
                      </div>
                  </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="downPayment" render={({ field }) => (
                            <FormItem><FormLabel className="font-bold">Uang Muka (DP)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="accountId" render={({ field }) => (
                            <FormItem><FormLabel className="font-bold">Diterima Di Akun</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih Akun" /></SelectTrigger></FormControl>
                                    <SelectContent>{accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <div className="border-t border-primary/20 pt-3 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Total Jasa:</span>
                            <span>{formatRupiah(form.watch('products').reduce((s, p) => s + (p.price * p.quantity), 0))}</span>
                        </div>
                        {deliveryFee > 0 && (
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Ongkir ({distance} km):</span>
                                <span>{formatRupiah(deliveryFee)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-xs font-bold uppercase">Sisa Pelunasan:</span>
                            <span className="text-xl font-bold text-primary">
                                {formatRupiah((form.watch('products').reduce((s, p) => s + (p.price * p.quantity), 0) + deliveryFee) - (form.watch('downPayment') || 0))}
                            </span>
                        </div>
                    </div>
                  </CardContent>
              </Card>
            </form>
        </Form>
      </div>
      
      <div className="p-4 border-t bg-white dark:bg-slate-900 grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full">Batal</Button>
        <Button type="submit" form="shipment-form" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditMode ? 'Update' : 'Simpan Pesanan')}
        </Button>
      </div>
    </div>
  );
}

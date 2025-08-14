'use client';

import * as React from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Shipment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, PlusCircle, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardFooter } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { addShipment } from '@/lib/data';

const shipmentProductSchema = z.object({
  name: z.string().min(1, 'Nama produk harus diisi'),
  quantity: z.coerce.number().int().min(1, 'Kuantitas min 1'),
  price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
  discount: z.coerce.number().min(0, 'Diskon min 0').max(100, 'Diskon maks 100'),
});

const shipmentFormSchema = z.object({
  user: z.string().min(1, 'User harus diisi'),
  transactionId: z.string().min(1, 'No. Transaksi harus diisi'),
  expedition: z.string().min(1, 'Nama ekspedisi harus diisi'),
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

export function ShipmentForm({ onSuccess, onCancel }: ShipmentFormProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      user: user?.name || '',
      transactionId: '',
      expedition: '',
      products: [{ name: '', quantity: 1, price: 0, discount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'products',
  });

  const productsWatch = useWatch({
    control: form.control,
    name: 'products'
  });

  const totalAmount = React.useMemo(() => {
    return productsWatch.reduce((sum, product) => {
        const { quantity, price, discount } = product;
        const subtotal = (price * quantity) * (1 - discount / 100);
        return sum + (subtotal || 0);
    }, 0);
  }, [productsWatch]);


  React.useEffect(() => {
    if (user) {
      form.setValue('user', user.name);
    }
  }, [user, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        const newShipment = await addShipment(data);
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
  
  const receiptValue = form.watch('receipt');
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
  };

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
                    <Input placeholder="cth. JNE Express" {...field} />
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
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
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
                            <TableHead>Nama Produk</TableHead>
                            <TableHead className="w-[100px]">Jumlah</TableHead>
                            <TableHead className="w-[150px]">Harga</TableHead>
                            <TableHead className="w-[120px]">Diskon (%)</TableHead>
                            <TableHead className="w-[160px] text-right">Subtotal</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => {
                            const product = productsWatch[index] || {};
                            const { quantity = 0, price = 0, discount = 0 } = product;
                            const subtotal = (price * quantity) * (1 - discount / 100);
                            return (
                            <TableRow key={field.id}>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`products.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem><FormControl><Input placeholder="cth. Baju" {...field} /></FormControl></FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`products.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                        )}
                                    />
                                </TableCell>
                                 <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`products.${index}.price`}
                                        render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" placeholder="Rp" {...field} /></FormControl></FormItem>
                                        )}
                                    />
                                </TableCell>
                                 <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`products.${index}.discount`}
                                        render={({ field }) => (
                                            <FormItem><FormControl><Input type="number" placeholder="0-100" {...field} /></FormControl></FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatRupiah(subtotal)}
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
                    onClick={() => append({ name: '', quantity: 1, price: 0, discount: 0 })}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Produk
                </Button>
                <FormMessage>{form.formState.errors.products?.message}</FormMessage>
            </CardContent>
             <CardFooter className="flex justify-end bg-slate-50 dark:bg-slate-900 p-4">
                <div className="flex flex-col items-end gap-1">
                    <span className="text-muted-foreground">Total Keseluruhan</span>
                    <span className="text-2xl font-bold">{formatRupiah(totalAmount)}</span>
                </div>
            </CardFooter>
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

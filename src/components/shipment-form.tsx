'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { handleAddShipment } from '@/lib/actions';
import { getShipments } from '@/lib/data';
import type { Shipment, ShipmentProduct } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, PlusCircle, Trash2, Upload } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const shipmentProductSchema = z.object({
  name: z.string().min(1, 'Nama produk harus diisi'),
  quantity: z.coerce.number().int().min(1, 'Kuantitas min 1'),
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
  onSuccess: (shipments: Shipment[]) => void;
  onCancel: () => void;
}

export function ShipmentForm({ onSuccess, onCancel }: ShipmentFormProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      user: user?.name || '',
      transactionId: '',
      expedition: '',
      products: [{ name: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'products',
  });

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
    const result = await handleAddShipment(data);
    if (result.success) {
      toast({
        title: 'Sukses!',
        description: result.message,
      });
      const updatedShipments = await getShipments();
      onSuccess(updatedShipments);
    } else {
      toast({
        variant: 'destructive',
        title: 'Kesalahan',
        description: result.message,
      });
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
                        <>
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
                        </>
                    </FormControl>
                    {receiptValue?.fileName && <p className="text-sm text-muted-foreground">File: {receiptValue.fileName}</p>}
                    <FormMessage />
                </FormItem>
            )}
        />
        
        <Card>
            <CardContent className="pt-6">
                <FormLabel>Produk</FormLabel>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Produk</TableHead>
                            <TableHead className="w-[120px]">Jumlah</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`products.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="cth. Baju" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`products.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ name: '', quantity: 1 })}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Produk
                </Button>
                <FormMessage>{form.formState.errors.products?.message}</FormMessage>
            </CardContent>
        </Card>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Pengiriman
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

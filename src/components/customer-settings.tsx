
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '@/lib/data';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';


const customerFormSchema = z.object({
  name: z.string().min(1, 'Nama pelanggan harus diisi.'),
  address: z.string().min(1, 'Alamat harus diisi.'),
  phone: z.string().min(1, 'Nomor telepon harus diisi.'),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export function CustomerSettings() {
    const [customers, setCustomers] = React.useState<Customer[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const { toast } = useToast();

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerFormSchema),
        defaultValues: { name: '', address: '', phone: '' },
    });

    const fetchCustomers = React.useCallback(async () => {
        setLoading(true);
        const data = await getCustomers();
        setCustomers(data);
        setLoading(false);
    }, []);

    React.useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleOpenForm = (customer: Customer | null) => {
        setEditingCustomer(customer);
        if (customer) {
            form.reset({
                name: customer.name,
                address: customer.address,
                phone: customer.phone,
            });
        } else {
            form.reset({ name: '', address: '', phone: '' });
        }
        setIsFormOpen(true);
    };

    const onFormSubmit = async (data: CustomerFormValues) => {
        setIsSubmitting(true);
        try {
            if (editingCustomer) {
                await updateCustomer(editingCustomer.id, data);
                toast({ title: 'Sukses', description: 'Data pelanggan berhasil diperbarui.' });
            } else {
                await addCustomer(data);
                toast({ title: 'Sukses', description: 'Pelanggan baru berhasil ditambahkan.' });
            }
            setIsFormOpen(false);
            fetchCustomers();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal menyimpan data.';
            toast({ variant: 'destructive', title: 'Kesalahan', description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const onDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            await deleteCustomer(id);
            toast({ title: 'Sukses', description: 'Data pelanggan berhasil dihapus.' });
            fetchCustomers();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal menghapus pelanggan.';
            toast({ variant: 'destructive', title: 'Kesalahan', description: message });
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-end">
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenForm(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Pelanggan
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onFormSubmit)}>
                                <DialogHeader>
                                    <DialogTitle>{editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Nama Pelanggan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="phone" render={({ field }) => (
                                        <FormItem><FormLabel>No. Telepon</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="address" render={({ field }) => (
                                        <FormItem><FormLabel>Alamat</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Simpan
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className='w-[50px]'>No</TableHead>
                            <TableHead>ID Pelanggan</TableHead>
                            <TableHead>Nama Pelanggan</TableHead>
                            <TableHead>Alamat</TableHead>
                            <TableHead>No. Telepon</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                        ) : customers.length > 0 ? (
                            customers.map((customer, index) => (
                                <TableRow key={customer.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-mono text-xs">{customer.id}</TableCell>
                                    <TableCell className="font-medium">{customer.name}</TableCell>
                                    <TableCell>{customer.address}</TableCell>
                                    <TableCell>{customer.phone}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(customer)}><Pencil className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={!!isDeleting}>
                                                    {isDeleting === customer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Pelanggan akan dihapus secara permanen.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(customer.id)}>Hapus</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">Belum ada data pelanggan.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

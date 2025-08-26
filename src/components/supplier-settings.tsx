
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from '@/lib/data';
import type { Supplier } from '@/lib/types';
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


const supplierFormSchema = z.object({
  name: z.string().min(1, 'Nama supplier harus diisi.'),
  address: z.string().min(1, 'Alamat harus diisi.'),
  phone: z.string().min(1, 'Nomor telepon harus diisi.'),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export function SupplierSettings() {
    const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const { toast } = useToast();

    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierFormSchema),
        defaultValues: { name: '', address: '', phone: '' },
    });

    const fetchSuppliers = React.useCallback(async () => {
        setLoading(true);
        const data = await getSuppliers();
        setSuppliers(data);
        setLoading(false);
    }, []);

    React.useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleOpenForm = (supplier: Supplier | null) => {
        setEditingSupplier(supplier);
        if (supplier) {
            form.reset({
                name: supplier.name,
                address: supplier.address,
                phone: supplier.phone,
            });
        } else {
            form.reset({ name: '', address: '', phone: '' });
        }
        setIsFormOpen(true);
    };

    const onFormSubmit = async (data: SupplierFormValues) => {
        setIsSubmitting(true);
        try {
            if (editingSupplier) {
                await updateSupplier(editingSupplier.id, data);
                toast({ title: 'Sukses', description: 'Data supplier berhasil diperbarui.' });
            } else {
                await addSupplier(data);
                toast({ title: 'Sukses', description: 'Supplier baru berhasil ditambahkan.' });
            }
            setIsFormOpen(false);
            fetchSuppliers();
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
            await deleteSupplier(id);
            toast({ title: 'Sukses', description: 'Data supplier berhasil dihapus.' });
            fetchSuppliers();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal menghapus supplier.';
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
                            Tambah Supplier
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onFormSubmit)}>
                                <DialogHeader>
                                    <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Nama Supplier</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                            <TableHead>ID Supplier</TableHead>
                            <TableHead>Nama Supplier</TableHead>
                            <TableHead>Alamat</TableHead>
                            <TableHead>No. Telepon</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                        ) : suppliers.length > 0 ? (
                            suppliers.map((supplier, index) => (
                                <TableRow key={supplier.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-mono text-xs">{supplier.id}</TableCell>
                                    <TableCell className="font-medium">{supplier.name}</TableCell>
                                    <TableCell>{supplier.address}</TableCell>
                                    <TableCell>{supplier.phone}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(supplier)}><Pencil className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={!!isDeleting}>
                                                    {isDeleting === supplier.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Supplier akan dihapus secara permanen.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(supplier.id)}>Hapus</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">Belum ada data supplier.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

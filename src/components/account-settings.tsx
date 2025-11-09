

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAccounts, addAccount, updateAccount, deleteAccount } from '@/lib/data';
import type { Account } from '@/lib/types';
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
import { Loader2, PlusCircle, Trash2, Pencil, Landmark, Wallet, Smartphone } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

const accountFormSchema = z.object({
  name: z.string().min(1, 'Nama akun harus diisi.'),
  type: z.enum(['Cash', 'Bank', 'E-Wallet', 'Other'], { required_error: 'Tipe akun harus dipilih.'}),
  balance: z.coerce.number().optional(), // Balance is for initial setup only
  notes: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountSettings() {
    const [accounts, setAccounts] = React.useState<Account[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const [editingAccount, setEditingAccount] = React.useState<Account | null>(null);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const { toast } = useToast();

    const form = useForm<AccountFormValues>({
        resolver: zodResolver(accountFormSchema),
        defaultValues: { name: '', type: 'Bank', balance: 0, notes: '' },
    });

    const fetchAccounts = React.useCallback(async () => {
        setLoading(true);
        const data = await getAccounts();
        setAccounts(data);
        setLoading(false);
    }, []);

    React.useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const handleOpenForm = (account: Account | null) => {
        setEditingAccount(account);
        if (account) {
            form.reset({
                name: account.name,
                type: account.type,
                balance: account.balance,
                notes: account.notes || '',
            });
        } else {
            form.reset({ name: '', type: 'Bank', balance: 0, notes: '' });
        }
        setIsFormOpen(true);
    };

    const onFormSubmit = async (data: AccountFormValues) => {
        setIsSubmitting(true);
        try {
            if (editingAccount) {
                // Balance can only be set on creation, so we exclude it from the update payload.
                const { balance, ...updateData } = data;
                await updateAccount(editingAccount.id, updateData);
                toast({ title: 'Sukses', description: 'Akun berhasil diperbarui.' });
            } else {
                await addAccount(data);
                toast({ title: 'Sukses', description: 'Akun baru berhasil ditambahkan.' });
            }
            setIsFormOpen(false);
            fetchAccounts();
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
            await deleteAccount(id);
            toast({ title: 'Sukses', description: 'Akun berhasil dihapus.' });
            fetchAccounts();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal menghapus akun. Pastikan tidak ada transaksi terkait.';
            toast({ variant: 'destructive', title: 'Kesalahan', description: message });
        } finally {
            setIsDeleting(null);
        }
    };

    const formatRupiah = (number: number) => {
        if (isNaN(number)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number);
    };
    
    const getAccountIcon = (type: Account['type']) => {
        switch (type) {
            case 'Bank': return <Landmark className="h-4 w-4" />;
            case 'Cash': return <Wallet className="h-4 w-4" />;
            case 'E-Wallet': return <Smartphone className="h-4 w-4" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-end">
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenForm(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Akun
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onFormSubmit)}>
                                <DialogHeader>
                                    <DialogTitle>{editingAccount ? 'Edit Akun' : 'Tambah Akun Baru'}</DialogTitle>
                                    <DialogDescription>
                                        Buat akun untuk melacak keuangan seperti kas tunai atau rekening bank. Saldo awal hanya bisa diatur saat pembuatan.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Nama Akun</FormLabel><FormControl><Input placeholder="cth: Bank BCA, Kas Toko" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="type" render={({ field }) => (
                                        <FormItem><FormLabel>Tipe Akun</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Bank">Bank</SelectItem>
                                                    <SelectItem value="Cash">Kas Tunai</SelectItem>
                                                    <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                                                    <SelectItem value="Other">Lainnya</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        <FormMessage /></FormItem>
                                    )} />
                                     {!editingAccount && <FormField control={form.control} name="balance" render={({ field }) => (
                                        <FormItem><FormLabel>Saldo Awal (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />}
                                     <FormField control={form.control} name="notes" render={({ field }) => (
                                        <FormItem><FormLabel>Catatan (Opsional)</FormLabel><FormControl><Textarea placeholder="cth: No. Rekening 123456789" {...field} /></FormControl><FormMessage /></FormItem>
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
                            <TableHead>Nama Akun</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead>Catatan</TableHead>
                            <TableHead className="text-right">Saldo Saat Ini</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                        ) : accounts.length > 0 ? (
                            accounts.map((account) => (
                                <TableRow key={account.id}>
                                    <TableCell className="font-medium flex items-center gap-2">{getAccountIcon(account.type)} {account.name}</TableCell>
                                    <TableCell><Badge variant="outline">{account.type}</Badge></TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{account.notes}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatRupiah(account.balance)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(account)}><Pencil className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={!!isDeleting}>
                                                    {isDeleting === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle><AlertDialogDescription>Tindakan ini akan menghapus akun secara permanen. Anda tidak bisa menghapus akun jika masih ada transaksi yang terkait dengannya.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(account.id)}>Hapus</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Belum ada data akun.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

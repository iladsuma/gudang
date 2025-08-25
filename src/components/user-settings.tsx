
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getUsers, addUser, updateUser, deleteUser } from '@/lib/data';
import type { User } from '@/lib/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from './ui/badge';
import { useAuth } from '@/context/auth-context';


const userFormSchema = z.object({
  name: z.string().min(1, 'Nama harus diisi.'),
  username: z.string().min(1, 'Username harus diisi.'),
  role: z.enum(['admin', 'user'], { required_error: 'Peran harus dipilih.' }),
  password: z.string().optional(),
}).refine(data => {
    // Make password required when creating a new user, but optional when editing.
    // This is handled in the submission logic, but could be refined here if needed.
    return true;
});

type UserFormValues = z.infer<typeof userFormSchema>;

export function UserSettings() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = React.useState<User[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const { toast } = useToast();

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: { name: '', username: '', role: 'user', password: '' },
    });

    const fetchUsers = React.useCallback(async () => {
        setLoading(true);
        const data = await getUsers();
        setUsers(data);
        setLoading(false);
    }, []);

    React.useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleOpenForm = (user: User | null) => {
        setEditingUser(user);
        if (user) {
            form.reset({
                name: user.name,
                username: user.username,
                role: user.role,
                password: '', // Password is not fetched, so it's blank for editing
            });
        } else {
            form.reset({ name: '', username: '', role: 'user', password: '' });
        }
        setIsFormOpen(true);
    };


    const onFormSubmit = async (data: UserFormValues) => {
        if (editingUser) {
            // Edit mode
            if (!data.password) {
                // If password is not entered, don't include it in the update payload
                delete data.password;
            }
        } else {
            // Create mode
            if (!data.password || data.password.length < 1) {
                form.setError("password", { type: "manual", message: "Password harus diisi untuk pengguna baru." });
                return;
            }
        }

        setIsSubmitting(true);
        try {
            if (editingUser) {
                await updateUser(editingUser.id, data);
                toast({ title: 'Sukses', description: 'Pengguna berhasil diperbarui.' });
            } else {
                await addUser(data as Required<UserFormValues>);
                toast({ title: 'Sukses', description: 'Pengguna berhasil ditambahkan.' });
            }
            setIsFormOpen(false);
            fetchUsers();
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
            await deleteUser(id);
            toast({ title: 'Sukses', description: 'Pengguna berhasil dihapus.' });
            fetchUsers();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal menghapus pengguna.';
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
                            Tambah Pengguna
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onFormSubmit)}>
                                <DialogHeader>
                                    <DialogTitle>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                     <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="username" render={({ field }) => (
                                        <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="password" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl><Input type="password" {...field} placeholder={editingUser ? 'Kosongkan jika tidak ingin diubah' : ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="role" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Peran</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih peran" />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="user">User</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
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
                            <TableHead>Nama Lengkap</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Peran</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                        ) : users.length > 0 ? (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell><Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(user)}><Pencil className="h-4 w-4" /></Button>
                                        
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={!!isDeleting || user.id === currentUser?.id}>
                                                    {isDeleting === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Pengguna akan dihapus secara permanen.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(user.id)}>Hapus</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">Belum ada data pengguna.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

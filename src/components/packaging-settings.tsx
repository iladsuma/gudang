

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getPackagingOptions, addPackagingOption, deletePackagingOption, updatePackagingOption } from '@/lib/data';
import type { Packaging } from '@/lib/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Loader2, PlusCircle, Trash2, Pencil, X } from 'lucide-react';
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

const packagingFormSchema = z.object({
  name: z.string().min(1, 'Nama kemasan harus diisi.'),
  cost: z.coerce.number().min(0, 'Biaya tidak boleh negatif.'),
});

type PackagingFormValues = z.infer<typeof packagingFormSchema>;

export function PackagingSettings() {
  const [packagingOptions, setPackagingOptions] = React.useState<Packaging[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<PackagingFormValues>({
    resolver: zodResolver(packagingFormSchema),
    defaultValues: { name: '', cost: 0 },
  });
  
  const formatRupiah = (number: number) => {
    if (isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
  };

  const fetchOptions = React.useCallback(async () => {
    setLoading(true);
    const data = await getPackagingOptions();
    setPackagingOptions(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const onSubmit = async (data: PackagingFormValues) => {
    try {
      if (editingId) {
        await updatePackagingOption(editingId, data);
        toast({ title: 'Sukses', description: 'Tipe kemasan berhasil diperbarui.' });
      } else {
        await addPackagingOption(data);
        toast({ title: 'Sukses', description: 'Tipe kemasan berhasil ditambahkan.' });
      }
      resetForm();
      fetchOptions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan data.';
      toast({ variant: 'destructive', title: 'Kesalahan', description: message });
    }
  };

  const onDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await deletePackagingOption(id);
      toast({ title: 'Sukses', description: 'Tipe kemasan berhasil dihapus.' });
      fetchOptions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus tipe kemasan.';
      toast({ variant: 'destructive', title: 'Kesalahan', description: message });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEdit = (option: Packaging) => {
    setEditingId(option.id);
    form.reset({ name: option.name, cost: option.cost });
  };

  const resetForm = () => {
    setEditingId(null);
    form.reset({ name: '', cost: 0 });
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>{editingId ? 'Edit Nama Kemasan' : 'Nama Kemasan Baru'}</FormLabel>
                <FormControl>
                  <Input placeholder="cth. Kardus + Bubble Wrap" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem className="w-48">
                <FormLabel>Biaya (Rp)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="cth. 2500" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2">
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : editingId ? (
                'Simpan'
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              {editingId ? 'Perubahan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kemasan</TableHead>
              <TableHead>Biaya</TableHead>
              <TableHead className="w-[120px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : packagingOptions.length > 0 ? (
              packagingOptions.map((option) => (
                <TableRow key={option.id}>
                  <TableCell className="font-medium">{option.name}</TableCell>
                  <TableCell>{formatRupiah(option.cost)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(option)} disabled={!!isDeleting || !!editingId}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={!!isDeleting || !!editingId}>
                          {isDeleting === option.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(option.id)}>
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Belum ada tipe kemasan. Tambahkan di atas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getExpeditions, addExpedition, deleteExpedition, updateExpedition } from '@/lib/data';
import type { Expedition } from '@/lib/types';
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

const expeditionFormSchema = z.object({
  name: z.string().min(1, 'Nama ekspedisi harus diisi.'),
});

type ExpeditionFormValues = z.infer<typeof expeditionFormSchema>;

export function ExpeditionSettings() {
  const [expeditions, setExpeditions] = React.useState<Expedition[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ExpeditionFormValues>({
    resolver: zodResolver(expeditionFormSchema),
    defaultValues: { name: '' },
  });

  const fetchExpeditions = React.useCallback(async () => {
    setLoading(true);
    const data = await getExpeditions();
    setExpeditions(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchExpeditions();
  }, [fetchExpeditions]);

  const onSubmit = async (data: ExpeditionFormValues) => {
    try {
      if (editingId) {
        await updateExpedition(editingId, data.name);
        toast({ title: 'Sukses', description: 'Ekspedisi berhasil diperbarui.' });
      } else {
        await addExpedition(data.name);
        toast({ title: 'Sukses', description: 'Ekspedisi berhasil ditambahkan.' });
      }
      resetForm();
      fetchExpeditions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan data.';
      toast({ variant: 'destructive', title: 'Kesalahan', description: message });
    }
  };

  const onDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteExpedition(id);
      toast({ title: 'Sukses', description: 'Ekspedisi berhasil dihapus.' });
      fetchExpeditions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus ekspedisi.';
      toast({ variant: 'destructive', title: 'Kesalahan', description: message });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEdit = (expedition: Expedition) => {
    setEditingId(expedition.id);
    form.reset({ name: expedition.name });
  };

  const resetForm = () => {
    setEditingId(null);
    form.reset({ name: '' });
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
                <FormLabel>{editingId ? 'Edit Nama Ekspedisi' : 'Nama Ekspedisi Baru'}</FormLabel>
                <FormControl>
                  <Input placeholder="cth. TIKI" {...field} />
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
              <TableHead>Nama Ekspedisi</TableHead>
              <TableHead className="w-[120px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : expeditions.length > 0 ? (
              expeditions.map((expedition) => (
                <TableRow key={expedition.id}>
                  <TableCell className="font-medium">{expedition.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(expedition)} disabled={!!isDeleting || !!editingId}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={!!isDeleting || !!editingId}>
                          {isDeleting === expedition.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                          <AlertDialogAction onClick={() => onDelete(expedition.id)}>
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
                <TableCell colSpan={2} className="h-24 text-center">
                  Belum ada ekspedisi. Tambahkan di atas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getFinancialTransactions, addFinancialTransaction } from '@/lib/data';
import type { FinancialTransaction } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// =======================
// Zod Schema & Helper
// =======================
const transactionFormSchema = z.object({
  type: z.enum(['in', 'out']),
  transactionDate: z.date({ required_error: 'Tanggal harus diisi.' }),
  amount: z.coerce.number().min(1, 'Jumlah harus lebih dari 0.'),
  category: z.string().min(1, 'Kategori harus diisi.'),
  description: z.string().min(1, 'Deskripsi harus diisi.'),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

const formatRupiah = (number: number) => {
    if (isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
};

// =======================
// Add Transaction Form Component
// =======================
function AddTransactionForm({ type, onFormSuccess }: { type: 'in' | 'out', onFormSuccess: () => void }) {
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    // Define categories based on type
    const cashInCategories = ['Penjualan Tunai', 'Penerimaan Piutang', 'Modal Masuk', 'Lainnya'];
    const cashOutCategories = ['Pembelian Stok', 'Biaya Operasional', 'Gaji Karyawan', 'Sewa', 'Listrik & Air', 'Transportasi', 'Lainnya'];
    const categories = type === 'in' ? cashInCategories : cashOutCategories;

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionFormSchema),
        defaultValues: {
            type,
            transactionDate: new Date(),
            amount: 0,
            category: '',
            description: '',
        },
    });

    const onSubmit = async (data: TransactionFormValues) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                // Format date to 'YYYY-MM-DD' string for the database
                transactionDate: format(data.transactionDate, 'yyyy-MM-dd'),
            };
            await addFinancialTransaction(payload as any);
            toast({ title: 'Sukses!', description: 'Transaksi berhasil dicatat.' });
            setIsFormOpen(false);
            onFormSuccess();
            form.reset({ type, transactionDate: new Date(), amount: 0, category: '', description: '' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
            toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {type === 'in' ? 'Tambah Kas Masuk' : 'Tambah Kas Keluar'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{type === 'in' ? 'Catat Kas Masuk' : 'Catat Kas Keluar'}</DialogTitle>
                    <DialogDescription>
                        Isi detail transaksi keuangan yang terjadi.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="transactionDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Tanggal Transaksi</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP", {locale: id})
                                        ) : (
                                            <span>Pilih tanggal</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="amount" render={({ field }) => (
                            <FormItem><FormLabel>Jumlah (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem><FormLabel>Kategori</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            <FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Deskripsi</FormLabel><FormControl><Textarea placeholder="Catatan singkat mengenai transaksi..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
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
    );
}


// =======================
// Transaction Table Component
// =======================
function TransactionTable({ transactions, type }: { transactions: FinancialTransaction[], type: 'in' | 'out' }) {
    const filteredTransactions = transactions.filter(t => t.type === type);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell>{format(new Date(tx.transactionDate), 'dd MMM yyyy', {locale: id})}</TableCell>
                                <TableCell>{tx.category}</TableCell>
                                <TableCell>{tx.description}</TableCell>
                                <TableCell className={cn("text-right font-medium", type === 'in' ? 'text-green-600' : 'text-red-600')}>
                                    {formatRupiah(tx.amount)}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Belum ada data kas {type === 'in' ? 'masuk' : 'keluar'}.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

// =======================
// Main Page Component
// =======================
export default function AccountingPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [transactions, setTransactions] = React.useState<FinancialTransaction[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);
    
    const fetchData = React.useCallback(async () => {
        setDataLoading(true);
        try {
          const data = await getFinancialTransactions();
          setTransactions(data);
        } catch (error) {
          console.error(error);
        } finally {
          setDataLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }
        if (user?.role === 'admin') {
            fetchData();
        }
    }, [user, authLoading, router, fetchData]);

    if (authLoading || (dataLoading && user?.role === 'admin')) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-96 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
  
    if (!user || user.role !== 'admin') {
        return (
           <div className="flex h-screen w-full items-center justify-center">
                <p>Anda tidak memiliki akses. Mengalihkan...</p>
           </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Tabs defaultValue="cash-in">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Akuntansi Keuangan</h1>
                        <p className="text-muted-foreground">
                            Catat dan pantau semua arus kas masuk dan keluar dari bisnis Anda.
                        </p>
                    </div>
                    <TabsList>
                        <TabsTrigger value="cash-in">Kas Masuk</TabsTrigger>
                        <TabsTrigger value="cash-out">Kas Keluar</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="cash-in">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Buku Kas Masuk</CardTitle>
                                    <CardDescription>Daftar semua pemasukan uang ke dalam bisnis.</CardDescription>
                                </div>
                                <AddTransactionForm type="in" onFormSuccess={fetchData} />
                            </div>
                        </CardHeader>
                        <CardContent>
                             {dataLoading ? <Skeleton className="h-64 w-full" /> : <TransactionTable transactions={transactions} type="in" />}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="cash-out">
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Buku Kas Keluar</CardTitle>
                                    <CardDescription>Daftar semua pengeluaran uang dari bisnis.</CardDescription>
                                </div>
                                <AddTransactionForm type="out" onFormSuccess={fetchData} />
                            </div>
                        </CardHeader>
                        <CardContent>
                             {dataLoading ? <Skeleton className="h-64 w-full" /> : <TransactionTable transactions={transactions} type="out" />}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

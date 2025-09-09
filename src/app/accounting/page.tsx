
'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getFinancialTransactions, addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction, getAccounts } from '@/lib/data';
import type { FinancialTransaction, Account } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, PlusCircle, ArrowUpCircle, ArrowDownCircle, Pencil, Trash2, Wallet, FileText, Download, Landmark, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';


interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const transactionFormSchema = z.object({
  transactionDate: z.date({ required_error: 'Tanggal harus diisi.' }),
  amount: z.coerce.number().min(1, 'Jumlah harus lebih dari 0.'),
  category: z.string().min(1, 'Kategori harus diisi.'),
  description: z.string().min(1, 'Deskripsi harus diisi.'),
  type: z.enum(['in', 'out'], { required_error: 'Tipe transaksi harus dipilih.' }),
  accountId: z.string().min(1, "Akun harus dipilih."),
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

function TransactionForm({ 
    initialData, 
    onFormSuccess,
    accounts,
}: { 
    initialData?: FinancialTransaction, 
    onFormSuccess: () => void,
    accounts: Account[],
}) {
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const cashInCategories = ['Penjualan Tunai', 'Penerimaan Piutang', 'Modal Masuk', 'Lainnya'];
    const cashOutCategories = ['Pembelian Stok', 'Biaya Operasional', 'Gaji Karyawan', 'Sewa', 'Listrik & Air', 'Transportasi', 'Lainnya'];
    
    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionFormSchema),
    });

    React.useEffect(() => {
        if (isFormOpen) {
            form.reset({
                transactionDate: initialData?.transactionDate ? new Date(initialData.transactionDate) : new Date(),
                amount: initialData?.amount || 0,
                category: initialData?.category || '',
                description: initialData?.description || '',
                type: initialData?.type || 'out',
                accountId: initialData?.accountId || '',
            });
        }
    }, [isFormOpen, initialData, form]);

    const transactionType = form.watch('type');

    const onSubmit = async (data: TransactionFormValues) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                transactionDate: format(data.transactionDate, 'yyyy-MM-dd'),
            };

            if (initialData?.id) {
                await updateFinancialTransaction(initialData.id, payload);
                toast({ title: 'Sukses!', description: 'Transaksi berhasil diperbarui.' });
            } else {
                await addFinancialTransaction(payload);
                toast({ title: 'Sukses!', description: 'Transaksi berhasil dicatat.' });
            }

            setIsFormOpen(false);
            onFormSuccess();
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
                {initialData?.id ? (
                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                ) : (
                     <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah Transaksi
                    </Button>
                )}
               
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{initialData?.id ? 'Edit Transaksi' : 'Catat Transaksi Keuangan'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                         <FormField control={form.control} name="accountId" render={({ field }) => (
                            <FormItem><FormLabel>Akun</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih akun" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            <FormMessage /></FormItem>
                        )} />
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tipe Transaksi</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="out">Kas Keluar</SelectItem>
                                        <SelectItem value="in">Kas Masuk</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
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
                                        disabled={(date) => date > new Date()}
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
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {(transactionType === 'in' ? cashInCategories : cashOutCategories).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
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

function TransactionTable({
    transactions,
    accounts,
    onSuccess,
    isDeleting,
    dataLoading,
    onDelete,
}: {
    transactions: FinancialTransaction[],
    accounts: Account[],
    onSuccess: () => void,
    onDelete: (tx: FinancialTransaction) => void,
    isDeleting: boolean,
    dataLoading: boolean
}) {
    if (dataLoading) {
        return <Skeleton className="h-64 w-full" />;
    }

    if (transactions.length === 0) {
        return (
            <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
                Tidak ada data transaksi pada periode ini.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Akun</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="w-[100px] text-center">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map(tx => (
                    <TableRow key={tx.id}>
                        <TableCell>{format(new Date(tx.transactionDate), 'dd MMM yyyy', {locale: id})}</TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell><Badge variant="outline">{tx.account.name}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{tx.category}</Badge></TableCell>
                        <TableCell className={cn("text-right font-medium", tx.type === 'in' ? 'text-green-600' : 'text-red-600')}>
                            {tx.type === 'in' ? '+' : '-'} {formatRupiah(tx.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                            <TransactionForm initialData={tx} onFormSuccess={onSuccess} accounts={accounts} />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button variant="ghost" size="icon" disabled={!!tx.referenceId}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                                        <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Anda yakin ingin menghapus transaksi ini?</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(tx)} disabled={isDeleting}>Hapus</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function AccountingPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [transactions, setTransactions] = React.useState<FinancialTransaction[]>([]);
    const [accounts, setAccounts] = React.useState<Account[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    
    const fetchData = React.useCallback(async () => {
        if (!user || user.role !== 'admin') return;
        setDataLoading(true);
        try {
            const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
            const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;
            const [transactionsData, accountsData] = await Promise.all([
                getFinancialTransactions(undefined, startDate, endDate),
                getAccounts()
            ]);
            setTransactions(transactionsData);
            setAccounts(accountsData);
        } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Gagal Memuat Data', description: 'Tidak dapat mengambil data buku kas.' });
        } finally {
          setDataLoading(false);
        }
    }, [toast, dateRange, user]);

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }
        if (user?.role === 'admin') {
            fetchData();
        }
    }, [user, authLoading, router, fetchData]);
    

    const handleDeleteTransaction = async (tx: FinancialTransaction) => {
        setIsDeleting(true);
        try {
            await deleteFinancialTransaction(tx.id);
            toast({ title: 'Sukses', description: 'Transaksi berhasil dihapus.' });
            fetchData();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
            toast({ variant: 'destructive', title: 'Gagal Menghapus', description: message });
        } finally {
            setIsDeleting(false);
        }
    };
    
    const handleExportCSV = () => {
        const dataToExport = transactions.map(t => ({
            Tanggal: format(new Date(t.transactionDate), 'yyyy-MM-dd'),
            Akun: t.account.name,
            Tipe: t.type === 'in' ? 'Masuk' : 'Keluar',
            Kategori: t.category,
            Deskripsi: t.description,
            Jumlah: t.amount,
        }));
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        link.setAttribute('download', `buku_kas_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Sukses', description: 'Data buku kas telah diekspor ke CSV.' });
    };

    const handlePrintPDF = () => {
        try {
            const doc = new jsPDF() as jsPDFWithAutoTable;
            const dateDisplay = dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "d LLL y")} - ${format(dateRange.to, "d LLL y")}` : format(dateRange.from, "d LLL y")) : "Semua waktu";

            doc.setFontSize(16);
            doc.text('Laporan Buku Kas', 14, 22);
            doc.setFontSize(10);
            doc.text(`Periode: ${dateDisplay}`, 14, 28);
            
            const head = [['Tanggal', 'Akun', 'Deskripsi', 'Kategori', 'Masuk (Rp)', 'Keluar (Rp)']];
            const body = transactions.map(tx => [
                format(new Date(tx.transactionDate), 'dd/MM/yy'),
                tx.account.name,
                tx.description,
                tx.category,
                tx.type === 'in' ? tx.amount.toLocaleString('id-ID') : '-',
                tx.type === 'out' ? tx.amount.toLocaleString('id-ID') : '-',
            ]);

            doc.autoTable({
                head,
                body,
                startY: 35,
                theme: 'grid',
                columnStyles: { 
                    4: { halign: 'right' },
                    5: { halign: 'right' }
                }
            });

            const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
            doc.save(`buku_kas_${timestamp}.pdf`);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal Membuat PDF', description: 'Terjadi kesalahan.' });
        }
    };
    
    const getAccountIcon = (type: Account['type']) => {
        switch (type) {
            case 'Bank': return <Landmark className="h-4 w-4 text-muted-foreground" />;
            case 'Cash': return <Wallet className="h-4 w-4 text-muted-foreground" />;
            case 'E-Wallet': return <Smartphone className="h-4 w-4 text-muted-foreground" />;
            default: return null;
        }
    };

    if (authLoading || (dataLoading && user?.role === 'admin')) {
        return <div className="container mx-auto p-4 md:p-8"><Card><CardHeader><Skeleton className="h-8 w-1/4" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card></div>;
    }
  
    if (!user || user.role !== 'admin') {
        return <div className="flex h-screen w-full items-center justify-center"><p>Anda tidak memiliki akses. Mengalihkan...</p></div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Buku Kas</h1>
                    <p className="text-muted-foreground">Lacak semua pergerakan kas masuk dan kas keluar di semua akun Anda.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleExportCSV} variant="outline" disabled={transactions.length === 0}><Download className="mr-2 h-4 w-4" /> Ekspor CSV</Button>
                    <Button onClick={handlePrintPDF} disabled={transactions.length === 0}><FileText className="mr-2 h-4 w-4" /> Cetak PDF</Button>
                    <TransactionForm onFormSuccess={fetchData} accounts={accounts} />
                </div>
            </div>

             <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Ringkasan Saldo Akun</h2>
                 {accounts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {accounts.map(acc => (
                            <Card key={acc.id}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{acc.name}</CardTitle>
                                    {getAccountIcon(acc.type)}
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatRupiah(acc.balance)}</div>
                                    <p className="text-xs text-muted-foreground">{acc.notes}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-6 text-center text-muted-foreground">
                            <p>Anda belum memiliki akun kas atau bank.</p>
                            <Button asChild variant="link" className="mt-2">
                                <Link href="/settings/accounts">Tambah Akun Sekarang</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Riwayat Transaksi</CardTitle>
                            <CardDescription>Daftar semua transaksi dalam periode yang dipilih.</CardDescription>
                        </div>
                        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <TransactionTable 
                            transactions={transactions} 
                            accounts={accounts}
                            onSuccess={fetchData}
                            onDelete={handleDeleteTransaction}
                            isDeleting={isDeleting}
                            dataLoading={dataLoading}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

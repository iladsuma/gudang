
'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getFinancialTransactions, addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction } from '@/lib/data';
import type { FinancialTransaction } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as TableSummaryFooter } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, PlusCircle, Download, FileText, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, subDays, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';


interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}


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
// Add/Edit Transaction Form Component
// =======================
function TransactionForm({ 
    mode, 
    initialData, 
    onFormSuccess 
}: { 
    mode: 'add' | 'edit', 
    initialData?: Partial<FinancialTransaction> & { type: 'in' | 'out' }, 
    onFormSuccess: () => void 
}) {
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const type = mode === 'add' ? initialData!.type : initialData?.type || 'in';

    const cashInCategories = ['Penjualan Tunai', 'Penerimaan Piutang', 'Modal Masuk', 'Lainnya'];
    const cashOutCategories = ['Pembelian Stok', 'Biaya Operasional', 'Gaji Karyawan', 'Sewa', 'Listrik & Air', 'Transportasi', 'Lainnya'];
    const categories = type === 'in' ? cashInCategories : cashOutCategories;

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionFormSchema),
    });

    React.useEffect(() => {
        if (mode === 'edit' && initialData?.id) {
            form.reset({
                type: initialData.type,
                transactionDate: parseISO(initialData.transactionDate!),
                amount: initialData.amount,
                category: initialData.category,
                description: initialData.description,
            });
        } else {
             form.reset({
                type: type,
                transactionDate: new Date(),
                amount: 0,
                category: '',
                description: '',
            });
        }
    }, [isFormOpen, mode, initialData, form, type]);

    const onSubmit = async (data: TransactionFormValues) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                transactionDate: format(data.transactionDate, 'yyyy-MM-dd'),
            };

            if (mode === 'edit' && initialData?.id) {
                await updateFinancialTransaction(initialData.id, payload as any);
                toast({ title: 'Sukses!', description: 'Transaksi berhasil diperbarui.' });
            } else {
                await addFinancialTransaction(payload as any);
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
                {mode === 'add' ? (
                     <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {type === 'in' ? 'Tambah Kas Masuk' : 'Tambah Kas Keluar'}
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                )}
               
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? (type === 'in' ? 'Catat Kas Masuk' : 'Catat Kas Keluar') : 'Edit Transaksi'}</DialogTitle>
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
function TransactionTable({ 
    transactions, 
    type, 
    onEdit, 
    onDelete 
}: { 
    transactions: FinancialTransaction[], 
    type: 'in' | 'out',
    onEdit: (tx: FinancialTransaction) => void,
    onDelete: (tx: FinancialTransaction) => void,
}) {
    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="w-[100px] text-center">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.length > 0 ? (
                        transactions.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell>{format(new Date(tx.transactionDate), 'dd MMM yyyy', {locale: id})}</TableCell>
                                <TableCell>{tx.category}</TableCell>
                                <TableCell>{tx.description}</TableCell>
                                <TableCell className={cn("text-right font-medium", type === 'in' ? 'text-green-600' : 'text-red-600')}>
                                    {formatRupiah(tx.amount)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <TransactionForm mode="edit" initialData={tx} onFormSuccess={onEdit} />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                                                <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Anda yakin ingin menghapus transaksi ini?</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDelete(tx)}>Hapus</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                Belum ada data kas {type === 'in' ? 'masuk' : 'keluar'} pada periode ini.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                 <TableSummaryFooter>
                    <TableRow>
                        <TableCell colSpan={4} className="text-right font-bold">Total</TableCell>
                        <TableCell className={cn("text-right font-bold", type === 'in' ? 'text-green-600' : 'text-red-600')}>{formatRupiah(totalAmount)}</TableCell>
                    </TableRow>
                </TableSummaryFooter>
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
    const { toast } = useToast();
    const [transactions, setTransactions] = React.useState<FinancialTransaction[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);
    const [isPrinting, setIsPrinting] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    
    const fetchData = React.useCallback(async () => {
        setDataLoading(true);
        try {
          const data = await getFinancialTransactions();
          setTransactions(data);
        } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Gagal Memuat Data', description: 'Tidak dapat mengambil data transaksi keuangan.' });
        } finally {
          setDataLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }
        if (user?.role === 'admin') {
            fetchData();
        }
    }, [user, authLoading, router, fetchData]);
    
    const filteredTransactions = React.useMemo(() => {
        if (!dateRange?.from) return transactions;
        return transactions.filter(tx => {
            const txDate = new Date(tx.transactionDate);
            const fromDate = dateRange.from!;
            const toDate = dateRange.to || fromDate;
            
            // Adjust dates to ignore time component
            const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
            
            return txDate >= startOfDay(fromDate) && txDate <= startOfDay(toDate);
        });
    }, [transactions, dateRange]);

    const cashInTransactions = filteredTransactions.filter(t => t.type === 'in');
    const cashOutTransactions = filteredTransactions.filter(t => t.type === 'out');
    
    const summary = React.useMemo(() => {
        const totalIn = cashInTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const totalOut = cashOutTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const netChange = totalIn - totalOut;
        return { totalIn, totalOut, netChange };
    }, [cashInTransactions, cashOutTransactions]);


    const handleDeleteTransaction = async (tx: FinancialTransaction) => {
        setIsDeleting(true);
        try {
            await deleteFinancialTransaction(tx.id);
            toast({ title: 'Sukses', description: 'Transaksi berhasil dihapus.' });
            fetchData(); // Refresh data
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
            toast({ variant: 'destructive', title: 'Gagal Menghapus', description: message });
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePrintPDF = () => {
        setIsPrinting(true);
        try {
            const doc = new jsPDF() as jsPDFWithAutoTable;
            const dateDisplay = dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "d LLL, y")} - ${format(dateRange.to, "d LLL, y")}` : format(dateRange.from, "d LLL, y")) : "Semua waktu";

            doc.setFontSize(16);
            doc.text('Laporan Arus Kas', 14, 22);
            doc.setFontSize(10);
            doc.text(`Periode: ${dateDisplay}`, 14, 28);
            
            // Cash In Table
            doc.setFontSize(12);
            doc.text('Kas Masuk', 14, 45);
            doc.autoTable({
                startY: 50,
                head: [['Tanggal', 'Kategori', 'Deskripsi', 'Jumlah (Rp)']],
                body: cashInTransactions.map(tx => [format(new Date(tx.transactionDate), 'dd/MM/yy'), tx.category, tx.description, tx.amount.toLocaleString('id-ID')]),
                theme: 'grid',
                headStyles: { fillColor: [22, 163, 74] },
                columnStyles: { 3: { halign: 'right' } }
            });
            let finalY = doc.autoTable.previous.finalY;
            doc.autoTable({ startY: finalY, body: [[{ content: 'Total Kas Masuk', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold'} }, { content: summary.totalIn.toLocaleString('id-ID'), styles: { halign: 'right', fontStyle: 'bold' } }]], theme: 'grid' });
            finalY = doc.autoTable.previous.finalY;

            // Cash Out Table
            doc.setFontSize(12);
            doc.text('Kas Keluar', 14, finalY + 15);
            doc.autoTable({
                startY: finalY + 20,
                head: [['Tanggal', 'Kategori', 'Deskripsi', 'Jumlah (Rp)']],
                body: cashOutTransactions.map(tx => [format(new Date(tx.transactionDate), 'dd/MM/yy'), tx.category, tx.description, tx.amount.toLocaleString('id-ID')]),
                theme: 'grid',
                headStyles: { fillColor: [220, 38, 38] },
                columnStyles: { 3: { halign: 'right' } }
            });
            finalY = doc.autoTable.previous.finalY;
            doc.autoTable({ startY: finalY, body: [[{ content: 'Total Kas Keluar', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold'} }, { content: summary.totalOut.toLocaleString('id-ID'), styles: { halign: 'right', fontStyle: 'bold' } }]], theme: 'grid' });
            finalY = doc.autoTable.previous.finalY;

            // Summary
            doc.autoTable({
                startY: finalY + 10,
                theme: 'plain',
                body: [[{ content: 'Selisih (Kas Masuk - Kas Keluar)', styles: {fontStyle: 'bold'}}, { content: formatRupiah(summary.netChange), styles: {halign: 'right', fontStyle: 'bold'}}]]
            })

            const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
            doc.save(`laporan_arus_kas_${timestamp}.pdf`);
            toast({ title: 'Sukses', description: 'Laporan PDF berhasil dibuat.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal Membuat PDF', description: 'Terjadi kesalahan saat membuat laporan.' });
        } finally {
            setIsPrinting(false);
        }
    };

    const handleExportCSV = () => {
        const dataToExport = filteredTransactions.map(tx => ({
            'Tanggal': format(new Date(tx.transactionDate), 'yyyy-MM-dd'),
            'Tipe': tx.type === 'in' ? 'Kas Masuk' : 'Kas Keluar',
            'Kategori': tx.category,
            'Deskripsi': tx.description,
            'Jumlah (Rp)': tx.amount,
        }));
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        link.setAttribute('download', `laporan_arus_kas_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Sukses', description: 'Data laporan telah diekspor ke CSV.' });
    }

    if (authLoading || (dataLoading && user?.role === 'admin')) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <Card><CardHeader><Skeleton className="h-8 w-1/4" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>
            </div>
        );
    }
  
    if (!user || user.role !== 'admin') {
        return (<div className="flex h-screen w-full items-center justify-center"><p>Anda tidak memiliki akses. Mengalihkan...</p></div>);
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Laporan Arus Kas</h1>
                    <p className="text-muted-foreground">Catat dan pantau semua arus kas masuk dan keluar dari bisnis Anda.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleExportCSV} variant="outline" disabled={filteredTransactions.length === 0}><Download className="mr-2 h-4 w-4" /> Ekspor CSV</Button>
                    <Button onClick={handlePrintPDF} disabled={filteredTransactions.length === 0 || isPrinting}>
                        {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />} Cetak PDF
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader><CardTitle>Total Kas Masuk</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold text-green-600">{formatRupiah(summary.totalIn)}</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Total Kas Keluar</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold text-red-600">{formatRupiah(summary.totalOut)}</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Selisih (Pemasukan - Pengeluaran)</CardTitle></CardHeader>
                    <CardContent><p className={cn("text-2xl font-bold", summary.netChange >= 0 ? "text-blue-600" : "text-yellow-600")}>{formatRupiah(summary.netChange)}</p></CardContent>
                </Card>
            </div>

            <Tabs defaultValue="cash-in">
                <div className="flex justify-between items-end mb-4">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    <TabsList>
                        <TabsTrigger value="cash-in">Kas Masuk</TabsTrigger>
                        <TabsTrigger value="cash-out">Kas Keluar</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="cash-in">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div><CardTitle>Buku Kas Masuk</CardTitle><CardDescription>Daftar semua pemasukan uang ke dalam bisnis.</CardDescription></div>
                                <TransactionForm mode="add" initialData={{ type: 'in' }} onFormSuccess={fetchData} />
                            </div>
                        </CardHeader>
                        <CardContent>
                             {dataLoading ? <Skeleton className="h-64 w-full" /> : <TransactionTable transactions={cashInTransactions} type="in" onEdit={fetchData} onDelete={handleDeleteTransaction} />}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="cash-out">
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div><CardTitle>Buku Kas Keluar</CardTitle><CardDescription>Daftar semua pengeluaran uang dari bisnis.</CardDescription></div>
                                <TransactionForm mode="add" initialData={{ type: 'out' }} onFormSuccess={fetchData} />
                            </div>
                        </CardHeader>
                        <CardContent>
                             {dataLoading ? <Skeleton className="h-64 w-full" /> : <TransactionTable transactions={cashOutTransactions} type="out" onEdit={fetchData} onDelete={handleDeleteTransaction} />}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

    

    
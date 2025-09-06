
'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getFinancialTransactions, addFinancialTransaction, updateFinancialTransaction, deleteFinancialTransaction, getSalesProfitReport } from '@/lib/data';
import type { FinancialTransaction } from '@/lib/types';
import type { SalesProfitReportData } from '@/app/api/reports/sales-profit/route';
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
import { CalendarIcon, Loader2, PlusCircle, Download, FileText, Pencil, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
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
    initialData, 
    onFormSuccess 
}: { 
    initialData?: Partial<FinancialTransaction>, 
    onFormSuccess: () => void 
}) {
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const cashOutCategories = ['Pembelian Stok', 'Biaya Operasional', 'Gaji Karyawan', 'Sewa', 'Listrik & Air', 'Transportasi', 'Lainnya'];
    
    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionFormSchema),
    });

    React.useEffect(() => {
        if (initialData?.id) {
            form.reset({
                transactionDate: parseISO(initialData.transactionDate!),
                amount: initialData.amount,
                category: initialData.category,
                description: initialData.description,
            });
        } else {
             form.reset({
                transactionDate: new Date(),
                amount: 0,
                category: '',
                description: '',
            });
        }
    }, [isFormOpen, initialData, form]);

    const onSubmit = async (data: TransactionFormValues) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                transactionDate: format(data.transactionDate, 'yyyy-MM-dd'),
                type: 'out' as 'out'
            };

            if (initialData?.id) {
                await updateFinancialTransaction(initialData.id, payload as any);
                toast({ title: 'Sukses!', description: 'Biaya berhasil diperbarui.' });
            } else {
                await addFinancialTransaction(payload as any);
                toast({ title: 'Sukses!', description: 'Biaya berhasil dicatat.' });
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
                        Tambah Biaya
                    </Button>
                )}
               
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{initialData?.id ? 'Edit Biaya' : 'Catat Biaya Operasional'}</DialogTitle>
                    <DialogDescription>
                        Isi detail biaya operasional yang terjadi.
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
                                        {cashOutCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
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
// Main Page Component
// =======================
export default function AccountingPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    // State
    const [salesReport, setSalesReport] = React.useState<SalesProfitReportData[]>([]);
    const [expenses, setExpenses] = React.useState<FinancialTransaction[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);
    const [isPrinting, setIsPrinting] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    
    const fetchData = React.useCallback(async () => {
        if (!dateRange?.from || !dateRange?.to) {
            toast({ variant: 'destructive', title: 'Rentang Tanggal Diperlukan' });
            return;
        }
        setDataLoading(true);
        try {
          const [salesData, expensesData] = await Promise.all([
             getSalesProfitReport(dateRange.from, dateRange.to),
             getFinancialTransactions('out')
          ]);
          setSalesReport(salesData);
          const filteredExpenses = expensesData.filter(tx => {
                const txDate = new Date(tx.transactionDate);
                const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
                return txDate >= startOfDay(dateRange.from!) && txDate <= startOfDay(dateRange.to!);
          });

          setExpenses(filteredExpenses);

        } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Gagal Memuat Data', description: 'Tidak dapat mengambil data laporan.' });
        } finally {
          setDataLoading(false);
        }
    }, [toast, dateRange]);

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }
        if (user?.role === 'admin') {
            fetchData();
        }
    }, [user, authLoading, router, fetchData]);
    
    const summary = React.useMemo(() => {
        const totalRevenue = salesReport.reduce((sum, item) => sum + item.totalRevenue, 0);
        const totalCOGS = salesReport.reduce((sum, item) => sum + item.totalCOGS, 0);
        const grossProfit = totalRevenue - totalCOGS;
        const totalExpenses = expenses.reduce((sum, tx) => sum + tx.amount, 0);
        const netProfit = grossProfit - totalExpenses;
        return { totalRevenue, totalCOGS, grossProfit, totalExpenses, netProfit };
    }, [salesReport, expenses]);


    const handleDeleteTransaction = async (tx: FinancialTransaction) => {
        setIsDeleting(true);
        try {
            await deleteFinancialTransaction(tx.id);
            toast({ title: 'Sukses', description: 'Biaya berhasil dihapus.' });
            fetchData();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
            toast({ variant: 'destructive', title: 'Gagal Menghapus', description: message });
        } finally {
            setIsDeleting(false);
        }
    };
    
    const handleExportCSV = () => {
        const dataToExport = [
            { Item: 'Total Pendapatan', Jumlah: summary.totalRevenue },
            { Item: 'Total HPP', Jumlah: summary.totalCOGS },
            { Item: 'Laba Kotor', Jumlah: summary.grossProfit },
            ...expenses.map(e => ({ Item: `Biaya: ${e.category} - ${e.description}`, Jumlah: -e.amount })),
            { Item: 'Total Biaya Operasional', Jumlah: -summary.totalExpenses },
            { Item: 'LABA BERSIH', Jumlah: summary.netProfit },
        ];
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        link.setAttribute('download', `laporan_laba_rugi_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Sukses', description: 'Data laporan telah diekspor ke CSV.' });
    };


    const handlePrintPDF = () => {
        setIsPrinting(true);
        try {
            const doc = new jsPDF() as jsPDFWithAutoTable;
            const dateDisplay = dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "d LLL, y")} - ${format(dateRange.to, "d LLL, y")}` : format(dateRange.from, "d LLL, y")) : "Semua waktu";

            doc.setFontSize(16);
            doc.text('Laporan Laba Rugi', 14, 22);
            doc.setFontSize(10);
            doc.text(`Periode: ${dateDisplay}`, 14, 28);
            
            doc.autoTable({
                startY: 40,
                theme: 'plain',
                body: [
                    ['Pendapatan dari Penjualan', formatRupiah(summary.totalRevenue)],
                    ['Harga Pokok Penjualan (HPP)', `(${formatRupiah(summary.totalCOGS)})`],
                ]
            });
            let finalY = doc.autoTable.previous.finalY;
            doc.autoTable({
                startY: finalY,
                theme: 'plain',
                body: [
                    [{content: 'Laba Kotor', styles: { fontStyle: 'bold'}}, {content: formatRupiah(summary.grossProfit), styles: { fontStyle: 'bold'}}],
                ],
                styles: {cellPadding: {top: 2, bottom: 2}}
            });
            finalY = doc.autoTable.previous.finalY;

            doc.setFontSize(12);
            doc.text('Biaya Operasional', 14, finalY + 15);
            doc.autoTable({
                startY: finalY + 20,
                head: [['Tanggal', 'Kategori', 'Deskripsi', 'Jumlah (Rp)']],
                body: expenses.map(tx => [format(new Date(tx.transactionDate), 'dd/MM/yy'), tx.category, tx.description, tx.amount.toLocaleString('id-ID')]),
                theme: 'striped',
                columnStyles: { 3: { halign: 'right' } }
            });
            finalY = doc.autoTable.previous.finalY;
            doc.autoTable({ startY: finalY, body: [[{ content: 'Total Biaya Operasional', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold'} }, { content: `(${formatRupiah(summary.totalExpenses)})`, styles: { halign: 'right', fontStyle: 'bold' } }]], theme: 'grid' });
            finalY = doc.autoTable.previous.finalY;

            // Summary
            doc.autoTable({
                startY: finalY + 10,
                theme: 'grid',
                body: [[{ content: 'Laba Bersih (Setelah Biaya)', styles: {fontStyle: 'bold', fillColor: summary.netProfit > 0 ? '#dff9fb' : '#f9dfdf'}}, { content: formatRupiah(summary.netProfit), styles: {halign: 'right', fontStyle: 'bold', fillColor: summary.netProfit > 0 ? '#dff9fb' : '#f9dfdf'}}]]
            })

            const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
            doc.save(`laporan_laba_rugi_${timestamp}.pdf`);
            toast({ title: 'Sukses', description: 'Laporan PDF berhasil dibuat.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal Membuat PDF', description: 'Terjadi kesalahan saat membuat laporan.' });
        } finally {
            setIsPrinting(false);
        }
    };


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
                    <h1 className="text-3xl font-bold tracking-tight">Laporan Laba Rugi</h1>
                    <p className="text-muted-foreground">Analisis profitabilitas bisnis Anda dalam periode tertentu.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleExportCSV} variant="outline" disabled={salesReport.length === 0 && expenses.length === 0}><Download className="mr-2 h-4 w-4" /> Ekspor CSV</Button>
                    <Button onClick={handlePrintPDF} disabled={(salesReport.length === 0 && expenses.length === 0) || isPrinting}>
                        {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />} Cetak PDF
                    </Button>
                </div>
            </div>
             <div className="mb-6">
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profit Summary Section */}
                <div className="lg:col-span-1 space-y-6">
                     <Card>
                        <CardHeader><CardTitle>Ringkasan Laba Kotor</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <div className='flex justify-between'><span className='text-muted-foreground'>Total Pendapatan</span><span className='font-medium'>{formatRupiah(summary.totalRevenue)}</span></div>
                            <div className='flex justify-between'><span className='text-muted-foreground'>Total HPP</span><span className='font-medium'>({formatRupiah(summary.totalCOGS)})</span></div>
                            <div className='flex justify-between border-t pt-2 mt-2'><span className='font-bold'>Laba Kotor</span><span className='font-bold'>{formatRupiah(summary.grossProfit)}</span></div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Laba Bersih</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <div className='flex justify-between'><span className='text-muted-foreground'>Laba Kotor</span><span className='font-medium'>{formatRupiah(summary.grossProfit)}</span></div>
                            <div className='flex justify-between'><span className='text-muted-foreground'>Total Biaya</span><span className='font-medium'>({formatRupiah(summary.totalExpenses)})</span></div>
                             <div className={cn("flex justify-between border-t pt-2 mt-2 font-bold text-lg", summary.netProfit >= 0 ? "text-primary" : "text-destructive")}>
                                <span>Laba Bersih</span>
                                <span>{formatRupiah(summary.netProfit)}</span>
                             </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Expenses Section */}
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div><CardTitle>Daftar Biaya Operasional</CardTitle><CardDescription>Semua pengeluaran di luar Harga Pokok Penjualan (HPP).</CardDescription></div>
                                <TransactionForm onFormSuccess={fetchData} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {dataLoading ? <Skeleton className="h-64 w-full" /> : 
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
                                        {expenses.length > 0 ? (
                                            expenses.map(tx => (
                                                <TableRow key={tx.id}>
                                                    <TableCell>{format(new Date(tx.transactionDate), 'dd MMM yyyy', {locale: id})}</TableCell>
                                                    <TableCell>{tx.category}</TableCell>
                                                    <TableCell>{tx.description}</TableCell>
                                                    <TableCell className="text-right font-medium text-red-600">
                                                        {formatRupiah(tx.amount)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <TransactionForm initialData={tx} onFormSuccess={fetchData} />
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Hapus Biaya?</AlertDialogTitle>
                                                                    <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Anda yakin ingin menghapus biaya ini?</AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteTransaction(tx)}>Hapus</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">
                                                    Belum ada data biaya pada periode ini.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                     <TableSummaryFooter>
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-right font-bold">Total Biaya Operasional</TableCell>
                                            <TableCell className="text-right font-bold text-red-600">{formatRupiah(summary.totalExpenses)}</TableCell>
                                        </TableRow>
                                    </TableSummaryFooter>
                                </Table>
                            </div>
                            }
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

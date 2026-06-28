
'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getSalesProfitReport, getUsers } from '@/lib/data';
import type { SalesProfitReportData, User } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Loader2, FileText, Download, TrendingUp, TrendingDown, DollarSign, Scale, ChevronDown, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const formatRupiah = (number: number) => {
    if (isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
};

export default function SalesProfitReportPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [reportData, setReportData] = React.useState<SalesProfitReportData | null>(null);
    const [allUsers, setAllUsers] = React.useState<User[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);
    const [isPrinting, setIsPrinting] = React.useState(false);
    
    // Filters
    const [userFilter, setUserFilter] = React.useState('all');
    const [activePreset, setActivePreset] = React.useState<string | null>('30d');
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });

    const fetchData = React.useCallback(async () => {
        if (!dateRange?.from || !dateRange?.to) {
            toast({
                variant: 'destructive',
                title: 'Rentang Tanggal Diperlukan',
            });
            return;
        }
        setDataLoading(true);
        try {
            const [data, usersData] = await Promise.all([
                getSalesProfitReport(dateRange.from, dateRange.to, userFilter),
                getUsers()
            ]);
            setReportData(data);
            setAllUsers(usersData);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal memuat laporan.';
            toast({ variant: 'destructive', title: 'Error', description: message });
        } finally {
            setDataLoading(false);
        }
    }, [dateRange, toast, userFilter]);

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }
        if (user?.role === 'admin' && dateRange?.from && dateRange?.to) {
            fetchData();
        }
    }, [user, authLoading, router, fetchData, dateRange]);
    
    
    const handleExportCSV = () => {
        if (!reportData?.transactionDetails) return;

        const dataToExport = reportData.transactionDetails.map(item => ({
            "No Transaksi": item.transactionId,
            "User": item.userName,
            "Tanggal": format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm', { locale: id }),
            "Pelanggan": item.customerName,
            "Pendapatan (Rp)": item.totalRevenue,
            "HPP (Rp)": item.totalCOGS,
            "Laba Kotor (Rp)": item.profit,
        }));
        
        const summary = [
            {},
            { "No Transaksi": "RINGKASAN LABA/RUGI" },
            { "No Transaksi": "Total Pendapatan", "User": formatRupiah(reportData.totalRevenue) },
            { "No Transaksi": "Total HPP", "User": formatRupiah(reportData.totalCOGS) },
            { "No Transaksi": "Laba Kotor", "User": formatRupiah(reportData.grossProfit) },
            { "No Transaksi": "Biaya Operasional", "User": formatRupiah(reportData.operationalExpenses) },
            { "No Transaksi": reportData.netProfit >= 0 ? "LABA BERSIH" : "RUGI BERSIH", "User": formatRupiah(reportData.netProfit) },
        ];
        
        // @ts-ignore
        const csv = Papa.unparse([...dataToExport, ...summary]);

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
        if (!reportData) return;
        setIsPrinting(true);
        try {
            const doc = new jsPDF() as jsPDFWithAutoTable;

            doc.setFontSize(16);
            doc.text('Laporan Laba Rugi Butik', 14, 22);
            doc.setFontSize(10);
            const dateDisplay = dateRange?.from ? (
                dateRange.to ? `${format(dateRange.from, "d LLL, y")} - ${format(dateRange.to, "d LLL, y")}`
                             : format(dateRange.from, "d LLL, y")
            ) : "Semua waktu";
            doc.text(`Periode: ${dateDisplay}`, 14, 28);

            const summaryBody = [
                ['Total Pendapatan', formatRupiah(reportData.totalRevenue)],
                ['Total HPP (Modal Baju)', `(${formatRupiah(reportData.totalCOGS)})`],
                ['Laba Kotor', formatRupiah(reportData.grossProfit)],
                ['Biaya Operasional', `(${formatRupiah(reportData.operationalExpenses)})`],
                [reportData.netProfit >= 0 ? 'Laba Bersih' : 'Rugi Bersih', formatRupiah(reportData.netProfit)],
            ];

            doc.autoTable({
                startY: 40,
                head: [['Deskripsi Laporan', 'Jumlah']],
                body: summaryBody,
                theme: 'grid',
                 didDrawCell: (data) => {
                    if (data.section === 'body' && (data.row.index === 2 || data.row.index === 4)) {
                        doc.setFont('helvetica', 'bold');
                    }
                    if (data.section === 'body' && data.row.index === 4) {
                         doc.setFillColor(reportData.netProfit >= 0 ? 232 : 255, reportData.netProfit >= 0 ? 245 : 235, reportData.netProfit >= 0 ? 232 : 235);
                    }
                },
                columnStyles: { 1: { halign: 'right' } }
            });

            const finalY = doc.autoTable.previous.finalY;
            doc.setFontSize(12);
            doc.text('Rincian Transaksi Pesanan Selesai', 14, finalY + 20);

            const tableColumn = ["Tgl Selesai", "No. Transaksi", "Pelanggan", "HPP (Rp)", "Pendapatan (Rp)", "Margin (Rp)"];
            const tableRows: any[] = [];

            reportData.transactionDetails.forEach(item => {
                tableRows.push([
                    format(new Date(item.createdAt), 'dd/MM/yy'),
                    item.transactionId,
                    item.customerName,
                    item.totalCOGS.toLocaleString('id-ID'),
                    item.totalRevenue.toLocaleString('id-ID'),
                    item.profit.toLocaleString('id-ID'),
                ]);
            });

             doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: finalY + 25,
                theme: 'striped',
                headStyles: { fillColor: [76, 175, 80], textColor: 255 },
                columnStyles: {
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'right' },
                }
            });
            
            const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
            doc.save(`laporan_laba_rugi_${timestamp}.pdf`);
            toast({ title: 'Sukses!', description: 'Laporan PDF berhasil dibuat.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal membuat PDF.' });
        } finally {
            setIsPrinting(false);
        }
    };
    
    const handleDatePreset = (preset: string) => {
        setActivePreset(preset);
        const today = new Date();
        let fromDate;
        switch (preset) {
            case '1d': fromDate = subDays(today, 0); break;
            case '3d': fromDate = subDays(today, 2); break;
            case '7d': fromDate = subDays(today, 6); break;
            case '30d': fromDate = subDays(today, 29); break;
            default: fromDate = undefined;
        }
        setDateRange({ from: fromDate, to: today });
    };

    const presetLabels: { [key: string]: string } = {
        '1d': 'Hari Ini',
        '3d': '3 Hari Terakhir',
        '7d': 'Minggu Ini',
        '30d': 'Bulan Ini',
    };


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
                <p>Akses ditolak.</p>
           </div>
        );
    }

    const isLoss = (reportData?.netProfit || 0) < 0;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Laporan Laba / Rugi</CardTitle>
                            <CardDescription>Analisis performa keuangan berdasarkan pendapatan jahitan dan HPP.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button onClick={handleExportCSV} variant="outline" disabled={!reportData || reportData.transactionDetails.length === 0}>
                                <Download className="mr-2 h-4 w-4" /> Ekspor CSV
                            </Button>
                            <Button onClick={handlePrintPDF} disabled={!reportData || reportData.transactionDetails.length === 0 || isPrinting}>
                                {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                Cetak PDF
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex flex-col md:flex-row items-center gap-2">
                        <Select onValueChange={setUserFilter} defaultValue={userFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Pilih Penjahit" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tim</SelectItem>
                                {allUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full md:w-[180px] justify-between">
                                    {activePreset ? presetLabels[activePreset] : "Pilih Periode"}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => handleDatePreset('1d')}>Hari Ini</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleDatePreset('3d')}>3 Hari Terakhir</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleDatePreset('7d')}>Minggu Ini</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleDatePreset('30d')}>Bulan Ini</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DateRangePicker 
                          date={dateRange} 
                          onDateChange={(range) => {
                            setDateRange(range);
                            setActivePreset(null);
                          }} 
                        />
                         <Button onClick={fetchData}>Cari Laporan</Button>
                    </div>

                     {dataLoading ? <Skeleton className="h-64 w-full"/> : reportData && (
                     <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Omzet</CardTitle><TrendingUp className="h-4 w-4 text-green-600" /></CardHeader>
                                <CardContent><div className="text-2xl font-bold">{formatRupiah(reportData.totalRevenue)}</div></CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total HPP</CardTitle><TrendingDown className="h-4 w-4 text-red-600" /></CardHeader>
                                <CardContent><div className="text-2xl font-bold">{formatRupiah(reportData.totalCOGS)}</div></CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Biaya Operasional</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                                <CardContent><div className="text-2xl font-bold">{formatRupiah(reportData.operationalExpenses)}</div></CardContent>
                            </Card>
                            <Card className={cn(isLoss ? "border-destructive bg-destructive/5" : "border-primary bg-primary/5")}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{isLoss ? "Rugi Bersih" : "Laba Bersih"}</CardTitle>
                                    {isLoss ? <AlertCircle className="h-4 w-4 text-destructive" /> : <Scale className="h-4 w-4 text-primary" />}
                                </CardHeader>
                                <CardContent>
                                    <div className={cn("text-2xl font-bold", isLoss ? "text-destructive" : "text-primary")}>
                                        {formatRupiah(reportData.netProfit)}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tgl Selesai</TableHead>
                                        <TableHead>No. Transaksi</TableHead>
                                        <TableHead>Pelanggan</TableHead>
                                        <TableHead className="text-right">Omzet</TableHead>
                                        <TableHead className="text-right">HPP (Modal)</TableHead>
                                        <TableHead className="text-right">Laba Kotor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.transactionDetails.length > 0 ? (
                                        reportData.transactionDetails.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{format(new Date(item.createdAt), 'dd/MM/yy', { locale: id })}</TableCell>
                                                <TableCell className="font-mono text-xs">{item.transactionId}</TableCell>
                                                <TableCell className="font-medium">{item.customerName}</TableCell>
                                                <TableCell className="text-right">{formatRupiah(item.totalRevenue)}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">{formatRupiah(item.totalCOGS)}</TableCell>
                                                <TableCell className={cn("text-right font-bold", item.profit >= 0 ? "text-green-600" : "text-destructive")}>
                                                    {formatRupiah(item.profit)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={6} className="h-24 text-center">Belum ada pesanan yang diselesaikan pada periode ini.</TableCell></TableRow>
                                    )}
                                </TableBody>
                                {reportData.transactionDetails.length > 0 && <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={3} className="font-bold">TOTAL KESELURUHAN</TableCell>
                                        <TableCell className="text-right font-bold">{formatRupiah(reportData.totalRevenue)}</TableCell>
                                        <TableCell className="text-right font-bold">{formatRupiah(reportData.totalCOGS)}</TableCell>
                                        <TableCell className={cn("text-right font-bold text-lg", reportData.grossProfit >= 0 ? "text-green-600" : "text-destructive")}>
                                            {formatRupiah(reportData.grossProfit)}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>}
                            </Table>
                        </div>
                    </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

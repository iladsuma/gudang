
'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getSalesProfitReport } from '@/lib/data';
import type { SalesProfitReportData } from '@/app/api/reports/sales-profit/route';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
} from '@/components/ui/table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Loader2, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

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

    const [reportData, setReportData] = React.useState<SalesProfitReportData[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);
    const [isPrinting, setIsPrinting] = React.useState(false);
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
            const data = await getSalesProfitReport(dateRange.from, dateRange.to);
            setReportData(data);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal memuat laporan.';
            toast({ variant: 'destructive', title: 'Error', description: message });
        } finally {
            setDataLoading(false);
        }
    }, [dateRange, toast]);

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }
        if (user?.role === 'admin') {
            fetchData();
        }
    }, [user, authLoading, router, fetchData]);
    
    const summary = React.useMemo(() => {
        return reportData.reduce((acc, item) => {
            acc.totalRevenue += item.totalRevenue;
            acc.totalCOGS += item.totalCOGS;
            acc.totalProfit += item.profit;
            return acc;
        }, { totalRevenue: 0, totalCOGS: 0, totalProfit: 0 });
    }, [reportData]);
    
    const handleExportCSV = () => {
        const dataToExport = reportData.map(item => ({
            "No Transaksi": item.transactionId,
            "Tanggal": format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm', { locale: id }),
            "Pelanggan": item.customerName,
            "Total Pendapatan (Rp)": item.totalRevenue,
            "Total HPP (Rp)": item.totalCOGS,
            "Laba Kotor (Rp)": item.profit,
        }));

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

            doc.setFontSize(16);
            doc.text('Laporan Laba Kotor Penjualan', 14, 22);
            doc.setFontSize(10);
            const dateDisplay = dateRange?.from ? (
                dateRange.to ? `${format(dateRange.from, "d LLL, y")} - ${format(dateRange.to, "d LLL, y")}`
                             : format(dateRange.from, "d LLL, y")
            ) : "Semua waktu";
            doc.text(`Periode: ${dateDisplay}`, 14, 28);

            const tableColumn = ["Tanggal", "No. Transaksi", "Pendapatan (Rp)", "HPP (Rp)", "Laba (Rp)"];
            const tableRows: any[] = [];

            reportData.forEach(item => {
                const row = [
                    format(new Date(item.createdAt), 'dd/MM/yy'),
                    item.transactionId,
                    item.totalRevenue.toLocaleString('id-ID'),
                    item.totalCOGS.toLocaleString('id-ID'),
                    item.profit.toLocaleString('id-ID'),
                ];
                tableRows.push(row);
            });

             doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                columnStyles: {
                    2: { halign: 'right' },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                }
            });
            
            const finalY = doc.autoTable.previous.finalY;
            doc.autoTable({
                startY: finalY + 5,
                body: [
                    [{ content: 'Total Pendapatan', colSpan: 2, styles: { fontStyle: 'bold' } }, { content: formatRupiah(summary.totalRevenue), styles: { halign: 'right', fontStyle: 'bold' } }],
                    [{ content: 'Total HPP', colSpan: 2, styles: { fontStyle: 'bold' } }, { content: formatRupiah(summary.totalCOGS), styles: { halign: 'right', fontStyle: 'bold' } }],
                    [{ content: 'Total Laba Kotor', colSpan: 2, styles: { fontStyle: 'bold', fillColor: '#dff9fb' } }, { content: formatRupiah(summary.totalProfit), styles: { halign: 'right', fontStyle: 'bold', fillColor: '#dff9fb' } }],
                ],
                theme: 'grid',
                columnStyles: { 0: { cellWidth: 105 } }
            });


            const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
            doc.save(`laporan_laba_rugi_${timestamp}.pdf`);

            toast({ title: 'Sukses!', description: 'Laporan PDF berhasil dibuat.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal', description: 'Tidak dapat membuat laporan PDF.' });
        } finally {
            setIsPrinting(false);
        }
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
                <p>Anda tidak memiliki akses. Mengalihkan...</p>
           </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Laporan Laba Kotor Penjualan</CardTitle>
                            <CardDescription>Analisis keuntungan dari setiap penjualan yang telah selesai.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button onClick={handleExportCSV} variant="outline" disabled={reportData.length === 0}>
                                <Download className="mr-2 h-4 w-4" /> Ekspor CSV
                            </Button>
                            <Button onClick={handlePrintPDF} disabled={reportData.length === 0 || isPrinting}>
                                {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                Cetak PDF
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="mb-4">
                        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Transaksi</TableHead>
                                    <TableHead>Pelanggan</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead className="text-right">Pendapatan</TableHead>
                                    <TableHead className="text-right">HPP</TableHead>
                                    <TableHead className="text-right">Laba Kotor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dataLoading ? (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : reportData.length > 0 ? (
                                    reportData.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono">{item.transactionId}</TableCell>
                                            <TableCell className="font-medium">{item.customerName}</TableCell>
                                            <TableCell>{format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}</TableCell>
                                            <TableCell className="text-right">{formatRupiah(item.totalRevenue)}</TableCell>
                                            <TableCell className="text-right">{formatRupiah(item.totalCOGS)}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">{formatRupiah(item.profit)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Tidak ada data penjualan terkirim pada rentang tanggal ini.</TableCell></TableRow>
                                )}
                            </TableBody>
                             <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableCell colSpan={3} className="font-bold text-right">Total</TableCell>
                                <TableCell className="text-right font-bold">{formatRupiah(summary.totalRevenue)}</TableCell>
                                <TableCell className="text-right font-bold">{formatRupiah(summary.totalCOGS)}</TableCell>
                                <TableCell className="text-right font-bold text-green-700">{formatRupiah(summary.totalProfit)}</TableCell>
                            </TableRow>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

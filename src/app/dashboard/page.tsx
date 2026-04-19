'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getProducts, getShipments, getFinancialTransactions } from '@/lib/data';
import type { Shipment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, PiggyBank, Warehouse } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = React.useState({
        shipmentsDeliveredInRange: 0,
        totalAssetValue: 0,
        cashBalance: 0,
    });
    const [recentActivity, setRecentActivity] = React.useState<Shipment[]>([]);
    const [loadingData, setLoadingData] = React.useState(true);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }

        if (user?.role === 'admin') {
            const fetchData = async () => {
                setLoadingData(true);
                const [products, shipments, financialTransactions] = await Promise.all([
                    getProducts(), 
                    getShipments(),
                    getFinancialTransactions()
                ]);
                
                const fromDate = dateRange?.from;
                const toDate = dateRange?.to;
                
                const shipmentsInRange = shipments.filter(s => {
                    const shipmentDate = new Date(s.createdAt);
                    if (fromDate && toDate) {
                        return shipmentDate >= fromDate && shipmentDate <= toDate;
                    }
                    return true;
                });
                
                const deliveredInRange = shipmentsInRange.filter(s => s.status === 'Terkirim');
                
                const totalAssetValue = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);

                const cashBalance = financialTransactions.reduce((balance, tx) => {
                    return tx.type === 'in' ? balance + tx.amount : balance - tx.amount;
                }, 0);

                setStats({
                    shipmentsDeliveredInRange: deliveredInRange.length,
                    totalAssetValue,
                    cashBalance
                });

                const recentDelivered = [...shipments]
                    .filter(s => s.status === 'Terkirim')
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5);
                setRecentActivity(recentDelivered);
                
                setLoadingData(false);
            };

            fetchData();
        }
    }, [user, authLoading, router, dateRange]);

    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number);
    };
    
    const rangeDisplay = dateRange?.from ? (
        dateRange.to ? `${format(dateRange.from, "d LLL, y")} - ${format(dateRange.to, "d LLL, y")}`
                     : format(dateRange.from, "d LLL, y")
    ) : "30 hari terakhir";

    if (authLoading || (loadingData && user?.role === 'admin' && !dateRange)) {
        return (
            <div className="container mx-auto p-4 md:p-8 space-y-6">
                <Skeleton className="h-9 w-1/3" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-80 w-full" />
            </div>
        );
    }
    
    if (!user || user?.role !== 'admin') {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Anda tidak memiliki akses. Mengalihkan...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Butik</h1>
                    <p className="text-muted-foreground">Menampilkan analitik untuk: <span className='font-semibold text-primary'>{rangeDisplay}</span></p>
                </div>
                <div>
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Kas</CardTitle>
                        <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatRupiah(stats.cashBalance)}</div>
                        <p className="text-xs text-muted-foreground">Total dari semua kas masuk & keluar.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Nilai Aset</CardTitle>
                        <Warehouse className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatRupiah(stats.totalAssetValue)}</div>
                        <p className="text-xs text-muted-foreground">Berdasarkan Harga Pokok x Stok.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transaksi Selesai</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.shipmentsDeliveredInRange}</div>
                        <p className="text-xs text-muted-foreground">Total pengiriman selesai dalam rentang tanggal terpilih.</p>
                    </CardContent>
                </Card>
            </div>

             <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Notifikasi Pesanan Selesai Dijahit</CardTitle>
                        <CardDescription>5 pesanan terbaru yang telah selesai diproses dan dikirim.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Transaksi</TableHead>
                                    <TableHead>Pelanggan</TableHead>
                                    <TableHead className="text-right">Tanggal Selesai</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingData ? <TableRow><TableCell colSpan={3}><Skeleton className='h-24'/></TableCell></TableRow> :
                                recentActivity.length > 0 ? recentActivity.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell className='font-mono'>{s.transactionId}</TableCell>
                                        <TableCell className='font-medium'>{s.customerName}</TableCell>
                                        <TableCell className='text-right'>{format(new Date(s.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}</TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={3} className='text-center h-24'>Belum ada pesanan yang selesai.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getProducts, getShipments } from '@/lib/data';
import type { Product, Shipment, ShipmentProduct } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Boxes, Package, DollarSign, Truck, CheckCircle, Expand, Send, AlertTriangle, Settings } from 'lucide-react';
import Link from 'next/link';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Brush } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PopularProduct {
    productId: string;
    name: string;
    count: number;
    value: number;
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = React.useState({
        totalValueInProcess: 0,
        shipmentsInProcess: 0,
        totalProducts: 0,
        shipmentsDeliveredInRange: 0,
        lowStockCount: 0,
    });
    const [popularProducts, setPopularProducts] = React.useState<PopularProduct[]>([]);
    const [recentActivity, setRecentActivity] = React.useState<Shipment[]>([]);
    const [lowStockProducts, setLowStockProducts] = React.useState<Product[]>([]);
    const [loadingData, setLoadingData] = React.useState(true);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    const [chartFilter, setChartFilter] = React.useState<'count' | 'value'>('count');
    const [productLimit, setProductLimit] = React.useState<string>('10');
    const [isChartDialogOpen, setIsChartDialogOpen] = React.useState(false);


    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }

        if (user?.role === 'admin') {
            const fetchData = async () => {
                setLoadingData(true);
                const [products, shipments] = await Promise.all([getProducts(), getShipments()]);
                
                const fromDate = dateRange?.from;
                const toDate = dateRange?.to;
                
                // Filter shipments by date range for analytics
                const shipmentsInRange = shipments.filter(s => {
                    const shipmentDate = new Date(s.createdAt);
                    if (fromDate && toDate) {
                        return shipmentDate >= fromDate && shipmentDate <= toDate;
                    }
                    return true; // if no date range, include all for now
                });
                
                // Stats that are NOT date-range dependent
                const inProcess = shipments.filter(s => s.status === 'Proses');
                const totalValueInProcess = inProcess.reduce((sum, s) => sum + s.totalAmount, 0);

                // Stats that ARE date-range dependent
                const deliveredInRange = shipmentsInRange.filter(s => s.status === 'Terkirim');
                
                // Low stock calculation
                const lowStockItems = products.filter(p => p.stock <= p.minStock);
                setLowStockProducts(lowStockItems);

                setStats({
                    totalValueInProcess,
                    shipmentsInProcess: inProcess.length,
                    totalProducts: products.length,
                    shipmentsDeliveredInRange: deliveredInRange.length,
                    lowStockCount: lowStockItems.length,
                });

                // Calculate popular products from delivered shipments WITHIN DATE RANGE
                const productMetrics: { [productId: string]: { name: string, count: number, value: number } } = {};
                deliveredInRange.forEach(shipment => {
                    shipment.products.forEach(product => {
                        if (!productMetrics[product.productId]) {
                            productMetrics[product.productId] = { name: product.name, count: 0, value: 0 };
                        }
                        productMetrics[product.productId].count += product.quantity;
                        productMetrics[product.productId].value += product.quantity * product.price;
                    });
                });
                
                const limit = productLimit === 'all' ? undefined : parseInt(productLimit, 10);

                const sortedPopularProducts = Object.entries(productMetrics)
                    .map(([productId, data]) => ({ productId, ...data }))
                    .sort((a, b) => chartFilter === 'count' ? b.count - a.count : b.value - a.value)
                    .slice(0, limit);
                
                setPopularProducts(sortedPopularProducts);

                // Recent activity is not strictly date-range dependent, but shows most recent overall
                const recentActivityShipments = [...shipments]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5);
                setRecentActivity(recentActivityShipments);
                
                setLoadingData(false);
            };

            fetchData();
        }
    }, [user, authLoading, router, dateRange, chartFilter, productLimit]);

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
    
    const chartTitle = `${productLimit === 'all' ? 'Semua' : `Top ${productLimit}`} Produk Terlaris`;

    const ChartComponent = ({ height, withBrush }: { height: number, withBrush?: boolean }) => (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={popularProducts} margin={{ top: 5, right: 20, left: -10, bottom: withBrush ? 0 : 75 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                />
                <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => chartFilter === 'count' ? `${value}` : `${Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value as number)}`}
                />
                <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))'}} 
                    contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}} 
                    formatter={(value, name, props) => {
                        const label = chartFilter === 'count' ? 'Jumlah Terkirim' : 'Total Nilai';
                        const formattedValue = chartFilter === 'count' ? `${value} unit` : formatRupiah(value as number);
                        return [formattedValue, label];
                    }}
                />
                <Bar dataKey={chartFilter} name={chartFilter === 'count' ? 'Jumlah Terkirim' : 'Total Nilai'} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                {withBrush && <Brush dataKey="name" height={30} stroke="hsl(var(--primary))" />}
            </BarChart>
        </ResponsiveContainer>
    );
     const getStatusVariant = (status: Shipment['status']) => {
        switch (status) {
            case 'Proses': return 'secondary';
            case 'Pengemasan': return 'default';
            case 'Terkirim': return 'outline';
            default: return 'secondary';
        }
    };

    if (authLoading || (loadingData && user?.role === 'admin' && !dateRange)) {
        return (
            <div className="container mx-auto p-4 md:p-8 space-y-6">
                <Skeleton className="h-9 w-1/3" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Skeleton className="lg:col-span-4 h-80" />
                    <Skeleton className="lg:col-span-3 h-80" />
                </div>
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
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
                    <p className="text-muted-foreground">Menampilkan analitik untuk: <span className='font-semibold text-primary'>{rangeDisplay}</span></p>
                </div>
                <div>
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                </div>
            </div>

             {lowStockProducts.length > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Peringatan Stok Menipis!</AlertTitle>
                    <AlertDescription>
                       Ada {lowStockProducts.length} produk yang stoknya di bawah batas minimal. Segera lakukan restok.
                       <div className='mt-2'>
                           <Dialog>
                               <DialogTrigger asChild>
                                   <Button variant="link" className="p-0 h-auto">Lihat Detail Produk</Button>
                               </DialogTrigger>
                               <DialogContent>
                                   <DialogHeader>
                                       <DialogTitle>Produk Stok Menipis</DialogTitle>
                                       <DialogDescription>Daftar produk yang perlu segera direstok.</DialogDescription>
                                   </DialogHeader>
                                   <div className='max-h-96 overflow-y-auto -mx-6 px-6'>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Produk</TableHead>
                                                <TableHead>Sisa Stok</TableHead>
                                                <TableHead>Stok Min.</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {lowStockProducts.map(p => (
                                                <TableRow key={p.id}>
                                                    <TableCell className='font-medium'>{p.name}</TableCell>
                                                    <TableCell className='text-destructive font-bold'>{p.stock}</TableCell>
                                                    <TableCell>{p.minStock}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                   </div>
                                    <DialogFooter>
                                        <Button asChild>
                                            <Link href="/settings/products">
                                                <Settings className='mr-2'/> Kelola Stok Produk
                                            </Link>
                                        </Button>
                                    </DialogFooter>
                               </DialogContent>
                           </Dialog>
                       </div>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Nilai (Antrian Proses)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatRupiah(stats.totalValueInProcess)}</div>
                        <p className="text-xs text-muted-foreground">Total nilai dari semua pengiriman yang sedang diproses.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Antrian Kemas</CardTitle>
                        <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.shipmentsInProcess}</div>
                        <p className="text-xs text-muted-foreground">Jumlah pengiriman dalam antrian proses.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Terkirim (Rentang Terpilih)</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.shipmentsDeliveredInRange}</div>
                        <p className="text-xs text-muted-foreground">Total pengiriman selesai dalam rentang tanggal terpilih.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Jumlah Produk</CardTitle>
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProducts}</div>
                        <p className="text-xs text-muted-foreground">Total item unik yang terdaftar di database.</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex-1">
                                <CardTitle>{chartTitle}</CardTitle>
                                <CardDescription>Produk yang paling banyak dikirim dalam rentang tanggal yang dipilih.</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <Dialog open={isChartDialogOpen} onOpenChange={setIsChartDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <Expand className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-6xl h-5/6 flex flex-col">
                                        <DialogHeader>
                                            <DialogTitle>{chartTitle}</DialogTitle>
                                            <DialogDescription>
                                                Gunakan penggeser di bawah grafik untuk zoom dan navigasi.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex-1 -mx-6 -mb-6">
                                            <ChartComponent height={500} withBrush={true} />
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <RadioGroup
                                    defaultValue={chartFilter}
                                    onValueChange={(value) => setChartFilter(value as 'count' | 'value')}
                                    className="flex items-center"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="count" id="count" />
                                        <Label htmlFor="count">Jumlah</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="value" id="value" />
                                        <Label htmlFor="value">Nilai</Label>
                                    </div>
                                </RadioGroup>
                                 <Select value={productLimit} onValueChange={setProductLimit}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Jumlah" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">Top 5</SelectItem>
                                        <SelectItem value="10">Top 10</SelectItem>
                                        <SelectItem value="20">Top 20</SelectItem>
                                        <SelectItem value="50">Top 50</SelectItem>
                                        <SelectItem value="all">Semua</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {loadingData ? <Skeleton className="w-full h-[350px]" /> :
                           <ChartComponent height={350} />
                        }
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Akses Cepat & Aktivitas Terbaru</CardTitle>
                         <CardDescription>Navigasi cepat dan pantau aktivitas terkini (tidak terikat rentang tanggal).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <Button asChild>
                                <Link href="/shipments">Antrian Kemas</Link>
                            </Button>
                            <Button asChild variant="secondary">
                                <Link href="/invoices">Arsip & Pengiriman</Link>
                            </Button>
                             <Button asChild variant="secondary">
                                <Link href="/settings/products">Kelola Produk</Link>
                            </Button>
                             <Button asChild variant="secondary">
                                <Link href="/settings">Pengaturan</Link>
                            </Button>
                        </div>
                        <div className='space-y-2 pt-2'>
                            {loadingData ? <Skeleton className="w-full h-48" /> :
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. Transaksi</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentActivity.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell className='font-mono text-xs'>{s.transactionId}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(s.status)}>{s.status}</Badge></TableCell>
                                            <TableCell className='text-xs text-muted-foreground'>{format(new Date(s.createdAt), 'dd/MM/yy')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                           </Table>
                           }
                           {(!loadingData && recentActivity.length === 0) && <p className='text-center text-sm text-muted-foreground py-4'>Belum ada aktivitas.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

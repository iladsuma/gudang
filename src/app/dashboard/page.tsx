
'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getProducts, getShipments } from '@/lib/data';
import type { Product, Shipment, ShipmentProduct } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Boxes, Package, DollarSign, Truck, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';

interface PopularProduct extends ShipmentProduct {
    count: number;
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = React.useState({
        totalValueInPackaging: 0,
        shipmentsInPackaging: 0,
        totalProducts: 0,
        shipmentsDeliveredLast30Days: 0,
    });
    const [popularProducts, setPopularProducts] = React.useState<PopularProduct[]>([]);
    const [recentActivity, setRecentActivity] = React.useState<Shipment[]>([]);
    const [loadingData, setLoadingData] = React.useState(true);

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }

        if (user?.role === 'admin') {
            const fetchData = async () => {
                const [products, shipments] = await Promise.all([getProducts(), getShipments()]);
                
                const thirtyDaysAgo = subDays(new Date(), 30);
                
                const inPackaging = shipments.filter(s => s.status === 'Pengemasan');
                const deliveredLast30Days = shipments.filter(s => s.status === 'Terkirim' && new Date(s.createdAt) >= thirtyDaysAgo);

                const totalValue = inPackaging.reduce((sum, s) => sum + s.totalAmount, 0);

                setStats({
                    totalValueInPackaging: totalValue,
                    shipmentsInPackaging: inPackaging.length,
                    totalProducts: products.length,
                    shipmentsDeliveredLast30Days: deliveredLast30Days.length,
                });

                // Calculate popular products from delivered shipments
                const productCounts: { [productId: string]: { name: string, count: number } } = {};
                deliveredLast30Days.forEach(shipment => {
                    shipment.products.forEach(product => {
                        if (!productCounts[product.productId]) {
                            productCounts[product.productId] = { name: product.name, count: 0 };
                        }
                        productCounts[product.productId].count += product.quantity;
                    });
                });

                const sortedPopularProducts = Object.entries(productCounts)
                    .map(([productId, data]) => ({ productId, ...data }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);
                
                setPopularProducts(sortedPopularProducts as any);


                const recentActivityShipments = [...shipments]
                    .filter(s => s.status === 'Pengemasan' || s.status === 'Terkirim')
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5);
                setRecentActivity(recentActivityShipments);
                
                setLoadingData(false);
            };

            fetchData();
        }
    }, [user, authLoading, router]);

    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number);
    };

    if (authLoading || (loadingData && user?.role === 'admin')) {
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
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Nilai (Antrian Kemas)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatRupiah(stats.totalValueInPackaging)}</div>
                        <p className="text-xs text-muted-foreground">Total nilai dari semua pengiriman yang sedang dikemas.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Menunggu Dikemas</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.shipmentsInPackaging}</div>
                        <p className="text-xs text-muted-foreground">Jumlah pengiriman yang sedang dalam tahap pengemasan.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Terkirim (30 Hari)</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.shipmentsDeliveredLast30Days}</div>
                        <p className="text-xs text-muted-foreground">Total pengiriman yang selesai dalam 30 hari terakhir.</p>
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
                        <CardTitle>5 Produk Terlaris (30 Hari Terakhir)</CardTitle>
                        <CardDescription>Produk yang paling banyak dikirim dalam 30 hari terakhir.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={popularProducts}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}} formatter={(value) => [`${value} unit`, 'Jumlah Terkirim']}/>
                                <Bar dataKey="count" name="Jumlah Terkirim" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Akses Cepat & Aktivitas Terbaru</CardTitle>
                         <CardDescription>Navigasi cepat dan pantau aktivitas terkini.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <Button asChild>
                                <Link href="/shipments">Pengiriman Saya</Link>
                            </Button>
                            <Button asChild variant="secondary">
                                <Link href="/history">Antrian Kemas</Link>
                            </Button>
                             <Button asChild variant="secondary">
                                <Link href="/settings/products">Kelola Produk</Link>
                            </Button>
                             <Button asChild variant="secondary">
                                <Link href="/settings">Pengaturan</Link>
                            </Button>
                        </div>
                        <div className='space-y-2 pt-2'>
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
                                            <TableCell className='font-medium'>{s.transactionId}</TableCell>
                                            <TableCell><Badge variant={s.status === 'Proses' ? 'secondary' : s.status === 'Pengemasan' ? 'default' : 'outline'}>{s.status}</Badge></TableCell>
                                            <TableCell className='text-xs text-muted-foreground'>{format(new Date(s.createdAt), 'dd/MM/yy')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                           </Table>
                           {recentActivity.length === 0 && <p className='text-center text-sm text-muted-foreground py-4'>Belum ada aktivitas.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

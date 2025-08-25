
'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getProducts, getShipments } from '@/lib/data';
import type { Product, Shipment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, Boxes, Package, DollarSign, Truck } from 'lucide-react';
import Link from 'next/link';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = React.useState({
        totalValueInProcess: 0,
        shipmentsInProcess: 0,
        totalProducts: 0,
        shipmentsInPackaging: 0,
    });
    const [topProducts, setTopProducts] = React.useState<Product[]>([]);
    const [recentShipments, setRecentShipments] = React.useState<Shipment[]>([]);
    const [loadingData, setLoadingData] = React.useState(true);

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }

        if (user?.role === 'admin') {
            const fetchData = async () => {
                const [products, shipments] = await Promise.all([getProducts(), getShipments()]);
                
                const inProcess = shipments.filter(s => s.status === 'Proses');
                const inPackaging = shipments.filter(s => s.status === 'Pengemasan');

                const totalValue = inProcess.reduce((sum, s) => sum + s.totalAmount, 0);

                setStats({
                    totalValueInProcess: totalValue,
                    shipmentsInProcess: inProcess.length,
                    totalProducts: products.length,
                    shipmentsInPackaging: inPackaging.length,
                });

                const sortedProducts = [...products].sort((a, b) => b.stock - a.stock);
                setTopProducts(sortedProducts.slice(0, 5));

                const sortedShipments = [...shipments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setRecentShipments(sortedShipments.slice(0, 5));
                
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
                        <CardTitle className="text-sm font-medium">Total Nilai (Proses)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatRupiah(stats.totalValueInProcess)}</div>
                        <p className="text-xs text-muted-foreground">Total nilai dari semua pengiriman yang sedang diproses.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Antrian Pengiriman</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.shipmentsInProcess}</div>
                        <p className="text-xs text-muted-foreground">Jumlah pengiriman yang siap untuk dibungkus.</p>
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
                        <CardTitle>5 Produk dengan Stok Terbanyak</CardTitle>
                        <CardDescription>Membantu memantau ketersediaan inventaris.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={topProducts}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}}/>
                                <Bar dataKey="stock" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Akses Cepat & Pengiriman Terbaru</CardTitle>
                         <CardDescription>Navigasi cepat dan pantau aktivitas terkini.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <Button asChild>
                                <Link href="/shipments">Antrian Kirim</Link>
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
                                    {recentShipments.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell className='font-medium'>{s.transactionId}</TableCell>
                                            <TableCell><Badge variant={s.status === 'Proses' ? 'secondary' : s.status === 'Pengemasan' ? 'default' : 'outline'}>{s.status}</Badge></TableCell>
                                            <TableCell className='text-xs text-muted-foreground'>{format(new Date(s.createdAt), 'dd/MM/yy')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                           </Table>
                           {recentShipments.length === 0 && <p className='text-center text-sm text-muted-foreground py-4'>Belum ada pengiriman.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

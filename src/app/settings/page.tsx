'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight, Users, Scissors, Landmark, Truck, Package, UserCog, ShoppingBag } from 'lucide-react';

export default function SettingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user?.role !== 'admin') {
            router.push('/shipments');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="container mx-auto p-4 md:p-8 space-y-6">
                 <div>
                    <Skeleton className="h-9 w-1/3" />
                    <Skeleton className="h-5 w-2/3 mt-2" />
                </div>
                <div className="grid gap-6">
                    <Skeleton className="h-36 w-full" />
                    <Skeleton className="h-36 w-full" />
                    <Skeleton className="h-36 w-full" />
                </div>
            </div>
        );
    }
    
    if (!user || user.role !== 'admin') {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Anda tidak memiliki akses ke halaman ini. Mengalihkan...</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Pengaturan Butik</h1>
                <p className="text-muted-foreground">Kelola konfigurasi layanan, data pelanggan, dan akses tim butik Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Card className="flex flex-col border-primary/20">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Landmark className="h-5 w-5" />
                            <CardTitle>Akun Kas & Bank</CardTitle>
                        </div>
                        <CardDescription>
                            Kelola rekening bank dan kas tunai untuk mencatat DP serta pelunasan pesanan jahitan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Atur daftar akun keuangan untuk pencatatan transaksi yang rapi.</p>
                    </CardContent>
                    <CardFooter>
                       <Button asChild variant="outline" className="w-full">
                           <Link href="/settings/accounts">
                                Kelola Akun <ChevronRight className="ml-2 h-4 w-4" />
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Scissors className="h-5 w-5" />
                            <CardTitle>Master Jenis Jahitan</CardTitle>
                        </div>
                        <CardDescription>
                            Kelola daftar kategori pakaian (Kebaya, Jas, Dress) dan estimasi harga jasa dasar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Memudahkan standarisasi harga dan kategori saat mencatat pesanan baru.</p>
                    </CardContent>
                    <CardFooter>
                       <Button asChild variant="outline" className="w-full">
                           <Link href="/settings/products">
                                Kelola Master Jahitan <ChevronRight className="ml-2 h-4 w-4" />
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>

                 <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Users className="h-5 w-5" />
                            <CardTitle>Manajemen Pelanggan</CardTitle>
                        </div>
                        <CardDescription>
                            Kelola data pelanggan tetap dan informasi kontak mereka.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Data ini digunakan untuk melacak riwayat ukuran badan di setiap pesanan.</p>
                    </CardContent>
                    <CardFooter>
                       <Button asChild variant="outline" className="w-full">
                           <Link href="/settings/customers">
                                Kelola Pelanggan <ChevronRight className="ml-2 h-4 w-4" />
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>

                 <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <ShoppingBag className="h-5 w-5" />
                            <CardTitle>Manajemen Supplier</CardTitle>
                        </div>
                        <CardDescription>
                            Kelola daftar toko kain atau pemasok bahan baku jahit lainnya.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Catat kontak supplier untuk memudahkan pembelian bahan (restok).</p>
                    </CardContent>
                    <CardFooter>
                       <Button asChild variant="outline" className="w-full">
                           <Link href="/settings/suppliers">
                                Kelola Supplier <ChevronRight className="ml-2 h-4 w-4" />
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Truck className="h-5 w-5" />
                            <CardTitle>Ekspedisi Pengiriman</CardTitle>
                        </div>
                        <CardDescription>
                            Daftar jasa pengiriman yang tersedia untuk mengirim pesanan yang sudah jadi.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Tambah atau edit kurir seperti JNE, J&T, atau kurir lokal.</p>
                    </CardContent>
                    <CardFooter>
                       <Button asChild variant="outline" className="w-full">
                           <Link href="/settings/expeditions">
                                Kelola Ekspedisi <ChevronRight className="ml-2 h-4 w-4" />
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>

                 <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Package className="h-5 w-5" />
                            <CardTitle>Kemasan & Packaging</CardTitle>
                        </div>
                        <CardDescription>
                            Atur tipe kemasan (Paperbag, Box Exclusive) dan biaya tambahannya.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Tentukan biaya kemasan yang akan muncul di rincian tagihan.</p>
                    </CardContent>
                    <CardFooter>
                       <Button asChild variant="outline" className="w-full">
                           <Link href="/settings/packaging">
                                Kelola Kemasan <ChevronRight className="ml-2 h-4 w-4" />
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <UserCog className="h-5 w-5" />
                            <CardTitle>Manajemen Tim Butik</CardTitle>
                        </div>
                        <CardDescription>
                            Atur akun akses untuk Pemilik (Admin) dan Tim Penjahit (User).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Tentukan siapa yang bisa mencatat pesanan dan siapa yang mengambil jahitan.</p>
                    </CardContent>
                    <CardFooter>
                       <Button asChild variant="outline" className="w-full">
                           <Link href="/settings/users">
                                Kelola Tim <ChevronRight className="ml-2 h-4 w-4" />
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

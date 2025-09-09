
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
import { ChevronRight, Database, Landmark } from 'lucide-react';

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
                <h1 className="text-3xl font-bold">Pengaturan Aplikasi</h1>
                <p className="text-muted-foreground">Kelola konfigurasi dan data master aplikasi Anda di sini.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Akun Kas & Bank</CardTitle>
                        <CardDescription>
                            Kelola semua akun keuangan Anda, seperti kas tunai, rekening bank, atau e-wallet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Atur daftar akun untuk pencatatan transaksi di Buku Kas.</p>
                    </CardContent>
                    <CardFooter>
                       <Button asChild>
                           <Link href="/settings/accounts">
                                Kelola Akun <ChevronRight className="ml-2 h-4 w-4" />
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Manajemen Produk</CardTitle>
                        <CardDescription>
                            Kelola semua data item yang ada di gudang. Tambah, hapus, atau edit produk.
                        </Description>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Atur kode, nama, harga jual, dan stok awal untuk setiap item.</p>
                    </CardContent>
                    <CardFooter>
                       <Button asChild>
                           <Link href="/settings/products">
                                Kelola Produk <ChevronRight className="ml-2 h-4 w-4" />
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Manajemen Pelanggan</CardTitle>
                        <CardDescription>
                            Kelola daftar pelanggan yang bertransaksi. Tambah, edit, dan hapus data pelanggan.
                        </Description>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Simpan informasi nama, alamat, dan nomor telepon pelanggan.</p>
                    </CardContent>
                    <CardFooter>
                       <Button asChild>
                           <Link href="/settings/customers">
                                Kelola Pelanggan <ChevronRight className="ml-2 h-4 w-4" />
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Manajemen Supplier</CardTitle>
                        <CardDescription>
                            Kelola daftar pemasok barang. Tambah, edit, dan hapus data supplier.
                        </Description>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Simpan informasi nama, alamat, dan nomor telepon supplier.</p>
                    </CardContent>
                    <CardFooter>
                       <Button asChild>
                           <Link href="/settings/suppliers">
                                Kelola Supplier <ChevronRight className="ml-2 h-4 w-4" />
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Manajemen Ekspedisi</CardTitle>
                        <CardDescription>
                            Kelola daftar ekspedisi yang tersedia untuk dipilih saat menambah data pengiriman.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Tambah, hapus, atau edit daftar ekspedisi.</p>
                    </CardContent>
                    <CardFooter>
                       <Button asChild>
                           <Link href="/settings/expeditions">
                                Kelola Ekspedisi <ChevronRight className="ml-2 h-4 w-4" />
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Manajemen Kemasan</CardTitle>
                        <CardDescription>
                            Kelola tipe kemasan dan biayanya yang dapat dipilih saat membuat pengiriman.
                        </Description>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Tambah, hapus, atau edit tipe kemasan dan biayanya.</p>
                    </CardContent>
                    <CardFooter>
                       <Button asChild>
                           <Link href="/settings/packaging">
                                Kelola Kemasan <ChevronRight className="ml-2 h-4 w-4" />
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Manajemen Pengguna</CardTitle>
                        <CardDescription>
                            Kelola akun yang dapat mengakses aplikasi. Tambah, edit, dan hapus pengguna.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Atur username, password, dan peran (admin/user) untuk setiap akun.</p>
                    </CardContent>
                    <CardFooter>
                       <Button asChild>
                           <Link href="/settings/users">
                                Kelola Pengguna <ChevronRight className="ml-2 h-4 w-4" />
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

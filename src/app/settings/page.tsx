
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
} from '@/components/ui/card';
import { ExpeditionSettings } from '@/components/expedition-settings';
import { ProductSettings } from '@/components/product-settings';

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user?.role !== 'admin') {
            router.push('/');
        }
    }, [user, router]);
    
    if (user?.role !== 'admin') {
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
            
            <Card>
                <CardHeader>
                    <CardTitle>Manajemen Produk</CardTitle>
                    <CardDescription>
                        Tambah, hapus, atau lihat daftar produk yang tersedia untuk dipilih saat menambah data pengiriman.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductSettings />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Manajemen Ekspedisi</CardTitle>
                    <CardDescription>
                        Tambah, hapus, atau lihat daftar ekspedisi yang tersedia untuk dipilih saat menambah data pengiriman.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ExpeditionSettings />
                </CardContent>
            </Card>
        </div>
    );
}

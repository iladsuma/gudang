
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
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Show a loading skeleton while the auth state is being determined
    if (loading || !user) {
        return (
            <div className="container mx-auto p-4 md:p-8 space-y-6">
                 <div>
                    <Skeleton className="h-9 w-1/3" />
                    <Skeleton className="h-5 w-2/3 mt-2" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                       <Skeleton className="h-48 w-full" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                       <Skeleton className="h-48 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    // Render the page if the user is authenticated
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
                        Tambah, hapus, atau edit daftar produk yang tersedia untuk dipilih saat menambah data pengiriman.
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
                        Tambah, hapus, atau edit daftar ekspedisi yang tersedia untuk dipilih saat menambah data pengiriman.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ExpeditionSettings />
                </CardContent>
            </Card>
        </div>
    );
}

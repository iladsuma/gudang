
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
import { PackagingSettings } from '@/components/packaging-settings';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PackagingSettingsPage() {
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
                <Skeleton className="h-8 w-48" />
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
    
    if (!user || user.role !== 'admin') {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Anda tidak memiliki akses ke halaman ini. Mengalihkan...</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
             <Button asChild variant="outline">
                <Link href="/settings">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Pengaturan
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Manajemen Kemasan</CardTitle>
                    <CardDescription>
                        Tambah, hapus, atau edit tipe kemasan dan biayanya yang dapat dipilih saat membuat pengiriman.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PackagingSettings />
                </CardContent>
            </Card>
        </div>
    );
}

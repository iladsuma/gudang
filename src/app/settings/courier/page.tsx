'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getAppSettings, updateAppSettings } from '@/lib/data';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, Truck, Info } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CourierSettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [feePerKm, setFeePerKm] = React.useState('1000');
    const [profitPerKm, setProfitPerKm] = React.useState('750');
    const [loadingData, setLoadingData] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }

        if (user?.role === 'admin') {
            getAppSettings().then(settings => {
                const fee = settings.find(s => s.key === 'courier_fee_per_km')?.value;
                const profit = settings.find(s => s.key === 'courier_profit_per_km')?.value;
                if (fee) setFeePerKm(fee);
                if (profit) setProfitPerKm(profit);
                setLoadingData(false);
            });
        }
    }, [user, authLoading, router]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateAppSettings([
                { key: 'courier_fee_per_km', value: feePerKm },
                { key: 'courier_profit_per_km', value: profitPerKm }
            ]);
            toast({ title: 'Sukses', description: 'Pengaturan kurir berhasil disimpan.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyimpan pengaturan.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || loadingData) {
        return (
            <div className="container mx-auto p-4 md:p-8 space-y-6">
                <Skeleton className="h-8 w-48" />
                <Card><CardHeader><Skeleton className="h-24 w-full" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
            </div>
        );
    }

    const calculatedCost = parseInt(feePerKm) - parseInt(profitPerKm);

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <Button asChild variant="outline" size="sm">
                <Link href="/settings"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Link>
            </Button>

            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Truck className="h-6 w-6" />
                            <CardTitle>Pengaturan Tarif Kurir Toko</CardTitle>
                        </div>
                        <CardDescription>
                            Atur perhitungan biaya pengiriman yang akan ditagihkan ke pelanggan dan bagaimana keuntungan tersebut dihitung dalam laporan keuangan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fee">Tarif Ongkir ke Pelanggan (Rp/Km)</Label>
                                <Input 
                                    id="fee" 
                                    type="number" 
                                    value={feePerKm} 
                                    onChange={(e) => setFeePerKm(e.target.value)} 
                                    placeholder="cth: 1000"
                                />
                                <p className="text-[10px] text-muted-foreground">Harga total yang dibayar pelanggan per kilometer.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="profit">Target Keuntungan Butik (Rp/Km)</Label>
                                <Input 
                                    id="profit" 
                                    type="number" 
                                    value={profitPerKm} 
                                    onChange={(e) => setProfitPerKm(e.target.value)} 
                                    placeholder="cth: 750"
                                />
                                <p className="text-[10px] text-muted-foreground">Jumlah keuntungan bersih yang ingin didapatkan Butik dari jasa kurir.</p>
                            </div>
                        </div>

                        <Alert className="bg-primary/5 border-primary/20">
                            <Info className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-primary font-bold">Simulasi Perhitungan</AlertTitle>
                            <AlertDescription className="text-sm space-y-2 mt-2">
                                <div className="flex justify-between"><span>Ongkir (Ditagih):</span> <b>Rp {parseInt(feePerKm).toLocaleString('id-ID')}/km</b></div>
                                <div className="flex justify-between border-b pb-1"><span>Target Untung:</span> <b>Rp {parseInt(profitPerKm).toLocaleString('id-ID')}/km</b></div>
                                <div className="flex justify-between pt-1">
                                    <span>Beban Operasional (HPP):</span> 
                                    <b className={calculatedCost < 0 ? 'text-destructive' : ''}>
                                        Rp {calculatedCost.toLocaleString('id-ID')}/km
                                    </b>
                                </div>
                                {calculatedCost < 0 && (
                                    <p className="text-[10px] text-destructive mt-1 italic">* Peringatan: Keuntungan melebihi tarif ongkir. Beban operasional akan bernilai negatif.</p>
                                )}
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Simpan Perubahan
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
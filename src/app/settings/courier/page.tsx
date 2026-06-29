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
import { ArrowLeft, Save, Loader2, Truck, Info, Fuel } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CourierSettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [feePerKm, setFeePerKm] = React.useState('1000');
    const [fuelConsumption, setFuelConsumption] = React.useState('40');
    const [fuelPrice, setFuelPrice] = React.useState('10000');
    
    const [loadingData, setLoadingData] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }

        if (user?.role === 'admin') {
            getAppSettings().then(settings => {
                const fee = settings.find(s => s.key === 'courier_fee_per_km')?.value;
                const consumption = settings.find(s => s.key === 'courier_fuel_consumption')?.value;
                const price = settings.find(s => s.key === 'fuel_price')?.value;
                
                if (fee) setFeePerKm(fee);
                if (consumption) setFuelConsumption(consumption);
                if (price) setFuelPrice(price);
                
                setLoadingData(false);
            });
        }
    }, [user, authLoading, router]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateAppSettings([
                { key: 'courier_fee_per_km', value: feePerKm },
                { key: 'courier_fuel_consumption', value: fuelConsumption },
                { key: 'fuel_price', value: fuelPrice }
            ]);
            toast({ title: 'Sukses', description: 'Pengaturan kurir & BBM berhasil disimpan.' });
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

    const calculatedCostPerKm = parseFloat(fuelPrice) / parseFloat(fuelConsumption);
    const calculatedProfitPerKm = parseFloat(feePerKm) - calculatedCostPerKm;

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
                            <CardTitle>Pengaturan Tarif & BBM Kurir</CardTitle>
                        </div>
                        <CardDescription>
                            Atur tarif pengiriman dan perhitungan konsumsi BBM untuk mendapatkan laporan profit kurir yang akurat.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="fee" className="text-sm font-bold">Tarif Ongkir ke Pelanggan (Rp/Km)</Label>
                                <Input 
                                    id="fee" 
                                    type="number" 
                                    value={feePerKm} 
                                    onChange={(e) => setFeePerKm(e.target.value)} 
                                    placeholder="cth: 1000"
                                />
                                <p className="text-[10px] text-muted-foreground italic">Harga yang ditagihkan ke nota pelanggan untuk setiap 1 km.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="consumption" className="text-sm font-bold flex items-center gap-1">
                                        <Fuel className="h-3 w-3" /> Konsumsi BBM (Km/Liter)
                                    </Label>
                                    <Input 
                                        id="consumption" 
                                        type="number" 
                                        value={fuelConsumption} 
                                        onChange={(e) => setFuelConsumption(e.target.value)} 
                                        placeholder="cth: 40"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Rata-rata jarak per 1 liter bensin.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-sm font-bold">Harga BBM (Rp/Liter)</Label>
                                    <Input 
                                        id="price" 
                                        type="number" 
                                        value={fuelPrice} 
                                        onChange={(e) => setFuelPrice(e.target.value)} 
                                        placeholder="cth: 10000"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Harga bensin saat ini.</p>
                                </div>
                            </div>
                        </div>

                        <Alert className="bg-primary/5 border-primary/20">
                            <Info className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-primary font-bold">Analisis Keuntungan per Km</AlertTitle>
                            <AlertDescription className="text-sm space-y-2 mt-2">
                                <div className="flex justify-between"><span>Tarif Ongkir:</span> <b>Rp {parseInt(feePerKm).toLocaleString('id-ID')}/km</b></div>
                                <div className="flex justify-between border-b pb-1 text-red-600">
                                    <span>Beban BBM (HPP):</span> 
                                    <b>- Rp {calculatedCostPerKm.toFixed(0).toLocaleString()}/km</b>
                                </div>
                                <div className="flex justify-between pt-1 font-bold text-green-700 text-base">
                                    <span>Profit Bersih Butik:</span> 
                                    <span>Rp {calculatedProfitPerKm.toFixed(0).toLocaleString()}/km</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2">
                                    * Profit ini akan otomatis masuk ke laporan Laba/Rugi sebagai tambahan pendapatan di luar jasa jahit.
                                </p>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Simpan Konfigurasi Kurir
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

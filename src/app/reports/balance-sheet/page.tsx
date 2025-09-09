

'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getPurchases, getShipments, getFinancialTransactions, getProducts } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, startOfYear } from 'date-fns';
import { Loader2, HandCoins, Landmark, Package, BookUser, PiggyBank, Scale, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const formatRupiah = (number: number) => {
    if (isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
};


interface BalanceSheetData {
    assets: {
        cash: number;
        inventory: number;
        accountsReceivable: number;
        total: number;
    };
    liabilities: {
        accountsPayable: number;
        bankLoans: number;
        total: number;
    };
    equity: {
        ownerCapital: number;
        retainedEarnings: number;
        total: number;
    };
}


export default function BalanceSheetPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [balanceSheetData, setBalanceSheetData] = React.useState<BalanceSheetData | null>(null);
    const [dataLoading, setDataLoading] = React.useState(false);
    
    // Manual inputs
    const [bankLoans, setBankLoans] = React.useState(0);
    const [ownerCapital, setOwnerCapital] = React.useState(0);

    const handleFetchData = React.useCallback(async () => {
        setDataLoading(true);
        try {
            const today = new Date();
            
            const [allPurchases, allShipments, allTransactions, allProducts] = await Promise.all([
                getPurchases(),
                getShipments(),
                getFinancialTransactions(),
                getProducts()
            ]);

            // ===== ASET LANCAR (CURRENT ASSETS) =====
            const cash = allTransactions.reduce((acc, tx) => tx.type === 'in' ? acc + tx.amount : acc - tx.amount, 0);
            
            const accountsReceivable = allShipments
                .filter(s => s.paymentStatus === 'Belum Lunas')
                .reduce((sum, s) => sum + s.totalAmount, 0);
            
            const inventory = allProducts.reduce((acc:number, p:any) => acc + (p.stock * p.costPrice), 0);

            const totalAssets = cash + accountsReceivable + inventory;

            // ===== KEWAJIBAN (LIABILITIES) =====
            const accountsPayable = allPurchases
                .filter(p => p.paymentStatus === 'Belum Lunas')
                .reduce((sum, p) => sum + p.totalAmount, 0);
                
            const totalLiabilities = accountsPayable + bankLoans;

            // ===== EKUITAS (EQUITY) =====
            const deliveredShipments = allShipments.filter(s => s.status === 'Terkirim');
            const totalRevenue = deliveredShipments.reduce((sum, s) => sum + s.totalRevenue, 0);
            const totalCOGS = deliveredShipments.reduce((sum, s) => {
                const cogs = s.products.reduce((c, p) => c + (p.costPrice * p.quantity), 0);
                return sum + cogs;
            }, 0);
            
            const grossProfit = totalRevenue - totalCOGS;

            const operationalExpenses = allTransactions
                .filter(tx => tx.type === 'out' && tx.category !== 'Pembelian Stok' && tx.category !== 'Pelunasan Utang' && !tx.description.includes('Transfer'))
                .reduce((sum, tx) => sum + tx.amount, 0);
            
            const retainedEarnings = grossProfit - operationalExpenses;
            const totalEquity = ownerCapital + retainedEarnings;
            
            setBalanceSheetData({
                assets: { cash, inventory, accountsReceivable, total: totalAssets },
                liabilities: { accountsPayable, bankLoans, total: totalLiabilities },
                equity: { ownerCapital, retainedEarnings, total: totalEquity }
            });
            toast({ title: 'Sukses', description: 'Data neraca berhasil dihitung ulang.' });

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal memuat data neraca.';
            toast({ variant: 'destructive', title: 'Error', description: message });
        } finally {
            setDataLoading(false);
        }
    }, [toast, bankLoans, ownerCapital]);
    
    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }
    }, [user, authLoading, router]);

    if (authLoading) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-96 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
  
    if (!user || user.role !== 'admin') {
        return (
           <div className="flex h-screen w-full items-center justify-center">
                <p>Anda tidak memiliki akses. Mengalihkan...</p>
           </div>
        );
    }
    
    const totalLiabilitiesAndEquity = (balanceSheetData?.liabilities.total || 0) + (balanceSheetData?.equity.total || 0);
    const isBalanced = balanceSheetData && Math.round(balanceSheetData.assets.total) === Math.round(totalLiabilitiesAndEquity);


    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Laporan Neraca</h1>
                <p className="text-muted-foreground">Posisi keuangan perusahaan pada <span className='font-semibold text-primary'>{format(new Date(), 'dd MMMM yyyy')}</span>.</p>
            </div>
            
            {balanceSheetData && (
                <Alert variant={isBalanced ? 'default' : 'destructive'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{isBalanced ? 'Neraca Seimbang' : 'Neraca Belum Seimbang!'}</AlertTitle>
                    <AlertDescription>
                        {isBalanced 
                            ? 'Total Aset sama dengan Total Kewajiban dan Ekuitas. Ini adalah indikator yang baik.' 
                            : `Ada selisih sebesar ${formatRupiah(Math.abs(balanceSheetData.assets.total - totalLiabilitiesAndEquity))}. Periksa kembali angka yang Anda masukkan atau transaksi yang tercatat.`}
                    </AlertDescription>
                </Alert>
            )}


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                     <CardHeader>
                        <CardTitle>Input Data Manual</CardTitle>
                        <CardDescription>Masukkan nilai untuk akun yang tidak terlacak otomatis oleh sistem.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className='space-y-2'>
                           <Label htmlFor="ownerCapital" className="flex items-center gap-2"><HandCoins /> Modal Disetor</Label>
                           <Input type="number" id="ownerCapital" value={ownerCapital} onChange={(e) => setOwnerCapital(Number(e.target.value))} placeholder="Modal awal dari pemilik" />
                        </div>
                         <div className='space-y-2'>
                           <Label htmlFor="bankLoans" className="flex items-center gap-2"><Landmark /> Utang Bank</Label>
                           <Input type="number" id="bankLoans" value={bankLoans} onChange={(e) => setBankLoans(Number(e.target.value))} placeholder="Total pinjaman bank" />
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleFetchData} disabled={dataLoading}>
                            {dataLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Hitung Ulang Neraca
                        </Button>
                    </CardFooter>
                </Card>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Aset */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Aset (Harta)</h2>
                        {!balanceSheetData ? <Skeleton className="h-64 w-full"/> : (
                            <Card>
                                <Table>
                                    <TableHeader>
                                        <TableRow><TableHead>Akun Aset</TableHead><TableHead className="text-right">Nilai</TableHead></TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow><TableCell className='flex items-center gap-2'><PiggyBank size={16}/> Kas & Setara Kas</TableCell><TableCell className="text-right">{formatRupiah(balanceSheetData.assets.cash)}</TableCell></TableRow>
                                        <TableRow><TableCell className='flex items-center gap-2'><BookUser size={16}/> Piutang Usaha</TableCell><TableCell className="text-right">{formatRupiah(balanceSheetData.assets.accountsReceivable)}</TableCell></TableRow>
                                        <TableRow><TableCell className='flex items-center gap-2'><Package size={16}/> Persediaan Barang</TableCell><TableCell className="text-right">{formatRupiah(balanceSheetData.assets.inventory)}</TableCell></TableRow>
                                    </TableBody>
                                </Table>
                                <CardFooter className="flex justify-between font-bold text-lg p-4 mt-2 bg-muted">
                                    <span>Total Aset</span>
                                    <span>{formatRupiah(balanceSheetData.assets.total)}</span>
                                </CardFooter>
                            </Card>
                        )}
                    </div>
                    {/* Kewajiban & Ekuitas */}
                     <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Kewajiban & Ekuitas (Modal)</h2>
                         {!balanceSheetData ? <Skeleton className="h-64 w-full"/> : (
                            <Card>
                                <Table>
                                    <TableHeader>
                                        <TableRow><TableHead>Akun Kewajiban & Ekuitas</TableHead><TableHead className="text-right">Nilai</TableHead></TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow><TableCell className='flex items-center gap-2 text-red-600'><BookUser size={16}/> Utang Usaha</TableCell><TableCell className="text-right text-red-600">{formatRupiah(balanceSheetData.liabilities.accountsPayable)}</TableCell></TableRow>
                                        <TableRow><TableCell className='flex items-center gap-2 text-red-600'><Landmark size={16}/> Utang Bank</TableCell><TableCell className="text-right text-red-600">{formatRupiah(balanceSheetData.liabilities.bankLoans)}</TableCell></TableRow>
                                         <TableRow><TableCell colSpan={2} className='h-2 bg-muted'></TableCell></TableRow>
                                         <TableRow><TableCell className='flex items-center gap-2'><HandCoins size={16}/> Modal Disetor</TableCell><TableCell className="text-right">{formatRupiah(balanceSheetData.equity.ownerCapital)}</TableCell></TableRow>
                                         <TableRow><TableCell className='flex items-center gap-2'><Scale size={16}/> Laba Ditahan</TableCell><TableCell className="text-right">{formatRupiah(balanceSheetData.equity.retainedEarnings)}</TableCell></TableRow>
                                    </TableBody>
                                </Table>
                                <CardFooter className={cn("flex justify-between font-bold text-lg p-4 mt-2", isBalanced ? "bg-muted" : "bg-destructive/20")}>
                                    <span>Total Kewajiban & Ekuitas</span>
                                    <span>{formatRupiah(totalLiabilitiesAndEquity)}</span>
                                </CardFooter>
                            </Card>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
}

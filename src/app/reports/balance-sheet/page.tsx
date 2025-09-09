
'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getProducts, getFinancialTransactions, getSalesProfitReport } from '@/lib/data';
import type { Product, FinancialTransaction } from '@/lib/types';
import type { SalesProfitReportData } from '@/app/api/reports/sales-profit/route';
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
import { format, subDays, startOfYear } from 'date-fns';
import { id } from 'date-fns/locale';
import { Loader2, FileText, Scale, Landmark, PiggyBank, Package, HandCoins, BookUser, CircleHelp, AlertTriangle } from 'lucide-react';
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
        accountsReceivable: number; // Piutang Usaha - Manual for now
        total: number;
    };
    liabilities: {
        accountsPayable: number; // Utang Usaha - Manual
        bankLoans: number; // Utang Bank - Manual
        total: number;
    };
    equity: {
        ownerCapital: number; // Modal Disetor - Manual
        retainedEarnings: number; // Laba Ditahan - Calculated
        total: number;
    };
}


export default function BalanceSheetPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [balanceSheetData, setBalanceSheetData] = React.useState<BalanceSheetData | null>(null);
    const [dataLoading, setDataLoading] = React.useState(true);
    
    // Manual inputs
    const [accountsPayable, setAccountsPayable] = React.useState(0);
    const [bankLoans, setBankLoans] = React.useState(0);
    const [ownerCapital, setOwnerCapital] = React.useState(0);

    const fetchData = React.useCallback(async () => {
        setDataLoading(true);
        try {
            // Fetch all necessary data in parallel
            const today = new Date();
            const yearStart = startOfYear(today);
            
            const [products, financialTransactions, salesReport] = await Promise.all([
                getProducts(),
                getFinancialTransactions(),
                getSalesProfitReport(yearStart, today)
            ]);

            // Calculate Assets
            const cash = financialTransactions.reduce((acc, tx) => tx.type === 'in' ? acc + tx.amount : acc - tx.amount, 0);
            const inventory = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
            const totalAssets = cash + inventory; // Piutang still 0 for now

            // Calculate Equity
            const retainedEarnings = salesReport.netProfit;

            setBalanceSheetData({
                assets: {
                    cash: cash,
                    inventory: inventory,
                    accountsReceivable: 0,
                    total: totalAssets,
                },
                liabilities: {
                    accountsPayable: accountsPayable,
                    bankLoans: bankLoans,
                    total: accountsPayable + bankLoans,
                },
                equity: {
                    ownerCapital: ownerCapital,
                    retainedEarnings: retainedEarnings,
                    total: ownerCapital + retainedEarnings,
                }
            });

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal memuat data neraca.';
            toast({ variant: 'destructive', title: 'Error', description: message });
        } finally {
            setDataLoading(false);
        }
    }, [toast, accountsPayable, bankLoans, ownerCapital]);
    
    // Re-calculate when manual inputs change
     React.useEffect(() => {
        if (user?.role === 'admin') {
            fetchData();
        }
    }, [user, fetchData]);


    if (authLoading || (dataLoading && user?.role === 'admin')) {
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
    const isBalanced = Math.round(balanceSheetData?.assets.total || 0) === Math.round(totalLiabilitiesAndEquity);


    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Laporan Neraca</h1>
                <p className="text-muted-foreground">Posisi keuangan perusahaan pada <span className='font-semibold text-primary'>{format(new Date(), 'dd MMMM yyyy')}</span>.</p>
            </div>
            
            <Alert variant={isBalanced ? 'default' : 'destructive'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{isBalanced ? 'Neraca Seimbang' : 'Neraca Belum Seimbang!'}</AlertTitle>
                <AlertDescription>
                    {isBalanced 
                        ? 'Total Aset sama dengan Total Kewajiban dan Ekuitas. Ini adalah indikator yang baik.' 
                        : 'Ada selisih antara Total Aset dan Total Kewajiban & Ekuitas. Periksa kembali angka yang Anda masukkan atau transaksi yang tercatat.'}
                </AlertDescription>
            </Alert>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                     <CardHeader>
                        <CardTitle>Input Data Manual</CardTitle>
                        <CardDescription>Masukkan nilai untuk akun yang belum terlacak otomatis oleh sistem.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className='space-y-2'>
                           <Label htmlFor="ownerCapital" className="flex items-center gap-2"><HandCoins /> Modal Disetor</Label>
                           <Input type="number" id="ownerCapital" value={ownerCapital} onChange={(e) => setOwnerCapital(Number(e.target.value))} placeholder="Modal awal dari pemilik" />
                        </div>
                         <div className='space-y-2'>
                           <Label htmlFor="accountsPayable" className="flex items-center gap-2"><BookUser /> Utang Usaha</Label>
                           <Input type="number" id="accountsPayable" value={accountsPayable} onChange={(e) => setAccountsPayable(Number(e.target.value))} placeholder="Total tagihan supplier" />
                        </div>
                         <div className='space-y-2'>
                           <Label htmlFor="bankLoans" className="flex items-center gap-2"><Landmark /> Utang Bank</Label>
                           <Input type="number" id="bankLoans" value={bankLoans} onChange={(e) => setBankLoans(Number(e.target.value))} placeholder="Total pinjaman bank" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <p className='text-xs text-muted-foreground flex items-center gap-2'><CircleHelp size={14}/> Perubahan pada input ini akan otomatis memperbarui laporan neraca.</p>
                    </CardFooter>
                </Card>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Aset */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Aset (Harta)</h2>
                        {dataLoading ? <Skeleton className="h-64 w-full"/> : balanceSheetData && (
                            <Card>
                                <Table>
                                    <TableHeader>
                                        <TableRow><TableHead>Akun Aset</TableHead><TableHead className="text-right">Nilai</TableHead></TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow><TableCell className='flex items-center gap-2'><PiggyBank size={16}/> Kas & Setara Kas</TableCell><TableCell className="text-right">{formatRupiah(balanceSheetData.assets.cash)}</TableCell></TableRow>
                                        <TableRow><TableCell className='flex items-center gap-2'><Package size={16}/> Persediaan Barang</TableCell><TableCell className="text-right">{formatRupiah(balanceSheetData.assets.inventory)}</TableCell></TableRow>
                                        <TableRow><TableCell className='flex items-center gap-2 text-muted-foreground'><BookUser size={16}/> Piutang Usaha</TableCell><TableCell className="text-right text-muted-foreground">{formatRupiah(balanceSheetData.assets.accountsReceivable)}</TableCell></TableRow>
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
                         {dataLoading ? <Skeleton className="h-64 w-full"/> : balanceSheetData && (
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

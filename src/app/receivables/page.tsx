
'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getShipments, getAccounts, payReceivable } from '@/lib/data';
import type { Shipment, Account } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Receipt, Loader2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formatRupiah = (number: number) => {
    if (isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
};

const paymentFormSchema = z.object({
    accountId: z.string().min(1, "Akun penerima harus dipilih."),
    paidAt: z.date({ required_error: "Tanggal pembayaran harus diisi." }),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

function PaymentForm({ shipment, accounts, onFormSuccess }: { shipment: Shipment, accounts: Account[], onFormSuccess: () => void }) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentFormSchema),
        defaultValues: {
            accountId: '',
            paidAt: new Date(),
        }
    });

    const onSubmit = async (data: PaymentFormValues) => {
        setIsSubmitting(true);
        try {
            await payReceivable(shipment.id, data.accountId, data.paidAt);
            toast({ title: 'Sukses!', description: `Pembayaran untuk ${shipment.transactionId} berhasil dicatat.` });
            setIsOpen(false);
            onFormSuccess();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
            toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFinished = shipment.status === 'Terkirim';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant={isFinished ? "default" : "outline"}>
                    <Receipt className="mr-2 h-4 w-4" /> Terima Bayaran
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Terima Pembayaran Piutang</DialogTitle>
                </DialogHeader>
                
                {!isFinished && (
                    <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800 font-semibold">Peringatan: Pesanan Belum Selesai</AlertTitle>
                        <AlertDescription className="text-amber-700">
                            Jahitan untuk pesanan ini masih berstatus <strong>{shipment.status === 'Proses' ? 'Baru' : 'Sedang Dijahit'}</strong>. Pastikan pelanggan memang ingin melunasi sekarang sebelum pesanan selesai.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="text-sm space-y-2 py-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">No. Transaksi:</span>
                        <span className="font-mono font-medium">{shipment.transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Pelanggan:</span>
                        <span className="font-medium">{shipment.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Status Jahitan:</span>
                        <Badge variant={isFinished ? "default" : "secondary"}>
                            {shipment.status === 'Proses' ? 'Baru' : shipment.status === 'Pengemasan' ? 'Sedang Dijahit' : 'Selesai'}
                        </Badge>
                    </div>
                    <div className="flex justify-between text-lg pt-2 border-t">
                        <span>Sisa Tagihan:</span>
                        <span className="font-bold text-primary">{formatRupiah(shipment.totalAmount - (shipment.downPayment || 0))}</span>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <FormField control={form.control} name="accountId" render={({ field }) => (
                            <FormItem><FormLabel>Pembayaran Masuk ke Akun</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Pilih akun" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} ({formatRupiah(acc.balance)})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            <FormMessage /></FormItem>
                        )} />
                        <FormField
                            control={form.control}
                            name="paidAt"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Tanggal Pembayaran Diterima</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPP", {locale: id}) : <span>Pilih tanggal</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Konfirmasi Pelunasan
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function ReceivablesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [receivables, setReceivables] = React.useState<Shipment[]>([]);
    const [accounts, setAccounts] = React.useState<Account[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);

    const fetchData = React.useCallback(async () => {
        if (!user || user.role !== 'admin') return;
        setDataLoading(true);
        try {
            const [shipmentsData, accountsData] = await Promise.all([getShipments(), getAccounts()]);
            // Hanya tampilkan yang belum lunas
            setReceivables(shipmentsData.filter(s => s.paymentStatus === 'Belum Lunas'));
            setAccounts(accountsData);
        } catch (error) {
            console.error(error);
        } finally {
            setDataLoading(false);
        }
    }, [user]);

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }
        if (user?.role === 'admin') {
            fetchData();
        }
    }, [user, authLoading, router, fetchData]);

    const totalReceivables = receivables.reduce((sum, item) => sum + (item.totalAmount - (item.downPayment || 0)), 0);

    if (authLoading || (dataLoading && user?.role === 'admin')) {
        return <div className="container mx-auto p-4 md:p-8"><Card><CardHeader><Skeleton className="h-8 w-1/4" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card></div>;
    }
  
    if (!user || user.role !== 'admin') {
        return <div className="flex h-screen w-full items-center justify-center"><p>Anda tidak memiliki akses. Mengalihkan...</p></div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <CardTitle>Piutang Usaha (Pelunasan Pesanan)</CardTitle>
                            <CardDescription>Daftar semua faktur penjualan kepada pelanggan yang masih memiliki sisa tagihan.</CardDescription>
                        </div>
                        <div className="text-right p-4 bg-primary/5 rounded-lg border border-primary/10">
                             <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Piutang Belum Tertagih</p>
                             <p className="text-3xl font-bold text-primary">{formatRupiah(totalReceivables)}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Transaksi</TableHead>
                                    <TableHead>Pelanggan</TableHead>
                                    <TableHead>Status Jahitan</TableHead>
                                    <TableHead className="text-right">Total Nilai</TableHead>
                                    <TableHead className="text-right">Sudah DP</TableHead>
                                    <TableHead className="text-right">Sisa Tagihan</TableHead>
                                    <TableHead className="w-[150px] text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {receivables.length > 0 ? (
                                    receivables.map(item => {
                                        const remaining = item.totalAmount - (item.downPayment || 0);
                                        const isFinished = item.status === 'Terkirim';
                                        
                                        return (
                                            <TableRow key={item.id} className={cn(!isFinished && "bg-slate-50/50")}>
                                                <TableCell className="font-mono text-xs font-medium">{item.transactionId}</TableCell>
                                                <TableCell className="font-medium">{item.customerName}</TableCell>
                                                <TableCell>
                                                    <Badge variant={isFinished ? "default" : "outline"} className={cn("flex w-fit items-center gap-1", isFinished ? "bg-green-600" : "")}>
                                                        {isFinished ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                        {item.status === 'Proses' ? 'Baru' : item.status === 'Pengemasan' ? 'Sedang Dijahit' : 'Selesai'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">{formatRupiah(item.totalAmount)}</TableCell>
                                                <TableCell className="text-right text-red-600">-{formatRupiah(item.downPayment || 0)}</TableCell>
                                                <TableCell className="text-right font-bold text-primary">{formatRupiah(remaining)}</TableCell>
                                                <TableCell className="text-center">
                                                    <PaymentForm shipment={item} accounts={accounts} onFormSuccess={fetchData} />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                                                <p>Semua piutang telah lunas atau belum ada transaksi baru.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

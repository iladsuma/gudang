

'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getPurchases, getAccounts, payPayable } from '@/lib/data';
import type { Purchase, Account } from '@/lib/types';
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
import { CalendarIcon, HandCoins, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const formatRupiah = (number: number) => {
    if (isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
};

const paymentFormSchema = z.object({
    accountId: z.string().min(1, "Akun pembayaran harus dipilih."),
    paidAt: z.date({ required_error: "Tanggal pembayaran harus diisi." }),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

function PaymentForm({ purchase, accounts, onFormSuccess }: { purchase: Purchase, accounts: Account[], onFormSuccess: () => void }) {
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
            await payPayable(purchase.id, data.accountId, data.paidAt);
            toast({ title: 'Sukses!', description: `Pembayaran untuk ${purchase.purchaseNumber} berhasil dicatat.` });
            setIsOpen(false);
            onFormSuccess();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
            toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm"><HandCoins className="mr-2 h-4 w-4" /> Bayar Tagihan</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Lakukan Pembayaran Utang</DialogTitle>
                </DialogHeader>
                <div className="text-sm space-y-2">
                    <p className="flex justify-between"><span>No. Pembelian:</span> <span className="font-medium">{purchase.purchaseNumber}</span></p>
                    <p className="flex justify-between"><span>Supplier:</span> <span className="font-medium">{purchase.supplierName}</span></p>
                    <p className="flex justify-between text-lg"><span>Total Tagihan:</span> <span className="font-bold">{formatRupiah(purchase.totalAmount)}</span></p>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border-t pt-4">
                        <FormField control={form.control} name="accountId" render={({ field }) => (
                            <FormItem><FormLabel>Bayar Dari Akun</FormLabel>
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
                                <FormLabel>Tanggal Pembayaran</FormLabel>
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
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Konfirmasi Pembayaran
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function PayablesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [payables, setPayables] = React.useState<Purchase[]>([]);
    const [accounts, setAccounts] = React.useState<Account[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);

    const fetchData = React.useCallback(async () => {
        if (!user || user.role !== 'admin') return;
        setDataLoading(true);
        try {
            const [purchasesData, accountsData] = await Promise.all([getPurchases(), getAccounts()]);
            setPayables(purchasesData.filter(p => p.paymentStatus === 'Belum Lunas'));
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

    const totalPayables = payables.reduce((sum, item) => sum + item.totalAmount, 0);

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
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Utang Usaha</CardTitle>
                            <CardDescription>Daftar semua tagihan pembelian dari supplier yang belum lunas.</CardDescription>
                        </div>
                        <div className="text-right">
                             <p className="text-sm text-muted-foreground">Total Utang</p>
                             <p className="text-2xl font-bold">{formatRupiah(totalPayables)}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal Pembelian</TableHead>
                                    <TableHead>No. Pembelian</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead className="text-right">Jumlah Tagihan</TableHead>
                                    <TableHead className="w-[150px] text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payables.length > 0 ? (
                                    payables.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell>{format(new Date(item.createdAt), 'dd MMM yyyy', {locale: id})}</TableCell>
                                            <TableCell className="font-mono">{item.purchaseNumber}</TableCell>
                                            <TableCell className="font-medium">{item.supplierName}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatRupiah(item.totalAmount)}</TableCell>
                                            <TableCell className="text-center">
                                                <PaymentForm purchase={item} accounts={accounts} onFormSuccess={fetchData} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Tidak ada utang usaha yang perlu dibayar.
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

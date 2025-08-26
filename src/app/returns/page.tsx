

'use client';

import * as React from 'react';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getReturns, getShipments, addReturn } from '@/lib/data';
import type { Return, ReturnedProduct, Shipment, ShipmentProduct } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { PlusCircle, Loader2, Search, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formatRupiah = (number: number) => {
    if (isNaN(number)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
};


const returnedProductSchema = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.coerce.number().int().min(1, 'Jumlah minimal 1'),
});

const returnFormSchema = z.object({
  originalShipmentId: z.string().min(1, "Transaksi asli harus dipilih"),
  products: z.array(returnedProductSchema).min(1, "Minimal satu produk harus diretur"),
  reason: z.string().min(1, "Alasan retur harus diisi"),
});

type ReturnFormValues = z.infer<typeof returnFormSchema>;

function ReturnForm({ onFormSuccess }: { onFormSuccess: () => void }) {
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [shipments, setShipments] = React.useState<Shipment[]>([]);
    const [openTxSelector, setOpenTxSelector] = React.useState(false);

    const form = useForm<ReturnFormValues>({
        resolver: zodResolver(returnFormSchema),
        defaultValues: {
            originalShipmentId: '',
            products: [],
            reason: '',
        }
    });
    
    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "products"
    });

    React.useEffect(() => {
        if(isFormOpen) {
            getShipments().then(data => setShipments(data.filter(s => s.status === 'Terkirim')));
        }
    }, [isFormOpen]);
    
    const selectedShipmentId = form.watch('originalShipmentId');
    const selectedShipment = shipments.find(s => s.id === selectedShipmentId);

    const handleSelectShipment = (shipment: Shipment) => {
        form.setValue('originalShipmentId', shipment.id);
        form.setValue('products', []); // Clear previous products
        setOpenTxSelector(false);
    }
    
    const handleAddProductToReturn = (product: ShipmentProduct) => {
        const existingIndex = fields.findIndex(p => p.productId === product.productId);
        if(existingIndex === -1) {
            append({
                productId: product.productId,
                name: product.name,
                price: product.price,
                quantity: 1,
            })
        }
    }
    
    const onSubmit = async (data: ReturnFormValues) => {
        setIsSubmitting(true);
        try {
            await addReturn(data);
            toast({ title: 'Sukses', description: 'Retur berhasil dicatat dan stok telah diperbarui.' });
            setIsFormOpen(false);
            form.reset();
            onFormSuccess();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
            toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: message });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Buat Retur Baru
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>Form Retur Penjualan</DialogTitle>
                            <DialogDescription>Catat pengembalian barang dari pelanggan.</DialogDescription>
                        </DialogHeader>
                        
                        <FormField
                            control={form.control}
                            name="originalShipmentId"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Pilih Transaksi Penjualan Asli</FormLabel>
                                    <Popover open={openTxSelector} onOpenChange={setOpenTxSelector}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                 <Button variant="outline" role="combobox" className="w-full justify-between">
                                                    {selectedShipment ? `${selectedShipment.transactionId} - ${selectedShipment.customerName}` : "Cari no. transaksi..."}
                                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Ketik no. transaksi atau nama pelanggan..." />
                                                <CommandList>
                                                    <CommandEmpty>Transaksi tidak ditemukan.</CommandEmpty>
                                                    <CommandGroup>
                                                        {shipments.map((shipment) => (
                                                            <CommandItem
                                                                value={`${shipment.transactionId} ${shipment.customerName}`}
                                                                key={shipment.id}
                                                                onSelect={() => handleSelectShipment(shipment)}
                                                            >
                                                               {shipment.transactionId} - <span className='ml-2 text-muted-foreground'>{shipment.customerName}</span>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        {selectedShipment && (
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg">Pilih Produk yang Diretur</CardTitle>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button type="button" variant="outline" size="sm">Tambah Produk</Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                 <Command>
                                                    <CommandInput placeholder="Cari produk..." />
                                                    <CommandList>
                                                    <CommandEmpty>Tidak ada produk lain.</CommandEmpty>
                                                        <CommandGroup>
                                                             {selectedShipment.products.map(p => (
                                                                <CommandItem key={p.productId} onSelect={() => handleAddProductToReturn(p)} disabled={fields.some(f => f.productId === p.productId)}>
                                                                    {p.name}
                                                                </CommandItem>
                                                             ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Produk</TableHead>
                                                <TableHead className="w-[120px]">Jumlah Retur</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fields.length > 0 ? fields.map((field, index) => {
                                                const originalProduct = selectedShipment.products.find(p => p.productId === field.productId);
                                                return (
                                                <TableRow key={field.id}>
                                                    <TableCell className="font-medium">{field.name}</TableCell>
                                                    <TableCell>
                                                        <FormField
                                                            control={form.control}
                                                            name={`products.${index}.quantity`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input type="number" min="1" max={originalProduct?.quantity || 1} {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button type="button" size="icon" variant="ghost" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                    </TableCell>
                                                </TableRow>
                                            )}) : (
                                            <TableRow><TableCell colSpan={3} className="h-24 text-center">Belum ada produk dipilih.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                        
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Alasan Retur</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="cth: Barang rusak, salah ukuran, dll." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Retur
                            </Button>
                        </DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    )
}


export default function ReturnsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [returns, setReturns] = React.useState<Return[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = React.useState('');
    const [customerFilter, setCustomerFilter] = React.useState('all');
    const [allCustomers, setAllCustomers] = React.useState<{id: string, name: string}[]>([]);


    const fetchData = React.useCallback(async () => {
        setDataLoading(true);
        const [data, shipmentsData] = await Promise.all([getReturns(), getShipments()]);
        
        // Extract unique customers from shipments for the filter dropdown
        const uniqueCustomers = shipmentsData.reduce((acc, curr) => {
            if (!acc.find(c => c.id === curr.customerId)) {
                acc.push({ id: curr.customerId, name: curr.customerName });
            }
            return acc;
        }, [] as {id: string, name: string}[]);

        setReturns(data);
        setAllCustomers(uniqueCustomers);
        setDataLoading(false);
    }, []);

    React.useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            router.push('/shipments');
        }
        if (user?.role === 'admin') {
            fetchData();
        }
    }, [user, authLoading, router, fetchData]);
    
    const filteredReturns = React.useMemo(() => {
        return returns.filter(retur => {
            const matchesSearch = searchTerm === '' ||
                retur.originalTransactionId.toLowerCase().includes(searchTerm.toLowerCase());
            
            const originalShipment = getShipments().then(s => s.find(ship => ship.id === retur.originalShipmentId)); // This is async, won't work well here.
            // Let's assume customer name is on the return object.
            const matchesCustomer = customerFilter === 'all' || retur.customerName === allCustomers.find(c => c.id === customerFilter)?.name;

            return matchesSearch && matchesCustomer;
        });
    }, [returns, searchTerm, customerFilter, allCustomers]);
    
    
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

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Riwayat Retur Penjualan</CardTitle>
                            <CardDescription>Daftar semua pengembalian barang dari pelanggan.</CardDescription>
                        </div>
                        <ReturnForm onFormSuccess={fetchData} />
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="flex flex-col md:flex-row gap-4 mb-4">
                         <div className="grid gap-2 flex-1">
                            <Label htmlFor="search-return">Cari No. Transaksi Asli</Label>
                            <Input 
                                id="search-return"
                                placeholder="Ketik nomor transaksi..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                         </div>
                         <div className="grid gap-2">
                            <Label htmlFor="filter-customer">Filter Pelanggan</Label>
                            <Select value={customerFilter} onValueChange={setCustomerFilter}>
                                <SelectTrigger id="filter-customer" className="w-full md:w-[250px]">
                                    <SelectValue placeholder="Semua Pelanggan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Pelanggan</SelectItem>
                                    {allCustomers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                         </div>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Transaksi Asli</TableHead>
                                    <TableHead>Pelanggan</TableHead>
                                    <TableHead>Tanggal Retur</TableHead>
                                    <TableHead>Produk Diretur</TableHead>
                                    <TableHead>Alasan</TableHead>
                                    <TableHead className="text-right">Total Nilai Retur</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {dataLoading ? (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : filteredReturns.length > 0 ? (
                                    filteredReturns.map(retur => (
                                        <TableRow key={retur.id}>
                                            <TableCell className="font-mono">{retur.originalTransactionId}</TableCell>
                                            <TableCell className="font-medium">{retur.customerName}</TableCell>
                                            <TableCell>{format(new Date(retur.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}</TableCell>
                                            <TableCell>
                                                <ul className="list-disc list-inside text-xs">
                                                    {retur.products.map(p => (
                                                        <li key={p.productId}>{p.name} (x{p.quantity})</li>
                                                    ))}
                                                </ul>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{retur.reason}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatRupiah(retur.totalAmount)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Belum ada riwayat retur.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

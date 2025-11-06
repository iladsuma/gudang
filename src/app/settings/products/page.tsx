

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProducts, addProduct, deleteMultipleProducts, updateProduct, updateProductStock, getStockMovements, bulkUpdateProductStock, getStockOpnameMovements } from '@/lib/data';
import type { Product, StockMovement, ProductSelection, SortableProductField, SortOrder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, PlusCircle, Trash2, Pencil, Edit, ArrowLeft, BookOpen, Upload, Download, X, ArrowUpDown, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}


const productFormSchema = z.object({
  code: z.string().min(1, 'Kode produk harus diisi.'),
  name: z.string().min(1, 'Nama produk harus diisi.'),
  price: z.coerce.number().min(0, 'Harga jual harus diisi.'),
  costPrice: z.coerce.number().min(0, 'Harga pokok harus diisi.'),
  stock: z.coerce.number().int().min(0, 'Stok harus bilangan bulat non-negatif.'),
  minStock: z.coerce.number().int().min(0, 'Stok minimal harus bilangan bulat non-negatif.'),
  unit: z.string().min(1, 'Satuan harus dipilih.'),
  category: z.string().min(1, 'Jenis harus dipilih.'),
  imageUrl: z.string().nullable().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const stockOpnameSchema = z.object({
    physicalStock: z.coerce.number().int().min(0, 'Stok fisik harus bilangan positif.'),
    notes: z.string().min(1, "Keterangan harus diisi (cth: 'Opname Bulanan')"),
});

type StockOpnameFormValues = z.infer<typeof stockOpnameSchema>;


function ProductsClient() {
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
    const [stockEditProduct, setStockEditProduct] = React.useState<Product | null>(null);
    const [viewingHistoryProduct, setViewingHistoryProduct] = React.useState<Product | null>(null);
    const [stockMovements, setStockMovements] = React.useState<StockMovement[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = React.useState(false);
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const imageInputRef = React.useRef<HTMLInputElement>(null);
    const importInputRef = React.useRef<HTMLInputElement>(null);
    const opnameImportInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // State for selection and sorting
    const [selection, setSelection] = React.useState<ProductSelection>({});
    const [sortBy, setSortBy] = React.useState<SortableProductField>('code');
    const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc');

    // Filters
    const [searchTerm, setSearchTerm] = React.useState('');
    const [categoryFilter, setCategoryFilter] = React.useState('all');
    const [unitFilter, setUnitFilter] = React.useState('all');
    
    // Reporting
    const [reportDateRange, setReportDateRange] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    const [isPrintingReport, setIsPrintingReport] = React.useState(false);

    // Mock data for dropdowns
    const units = ['PCS', 'DUS', 'KODI', 'KOLI', 'PACK'];
    const categories = ['Pakaian', 'Aksesoris', 'Elektronik', 'Makanan', 'Minuman', 'CELANA', 'SALEP', 'BAJU', 'BANTENGAN', 'ALAT MUSIK', 'BARONGAN'];


    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: { 
            code: '', 
            name: '', 
            price: 0, 
            costPrice: 0,
            stock: 0, 
            minStock: 0,
            unit: '',
            category: '',
            imageUrl: '' 
        },
    });

    const stockOpnameForm = useForm<StockOpnameFormValues>({
        resolver: zodResolver(stockOpnameSchema),
        defaultValues: { physicalStock: 0, notes: '' },
    });

    const fetchProducts = React.useCallback(async () => {
        setLoading(true);
        const data = await getProducts(sortBy, sortOrder);
        setProducts(data);
        setLoading(false);
    }, [sortBy, sortOrder]);

    React.useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);
    
    const filteredProducts = React.useMemo(() => {
        return products.filter(product => {
            const matchesSearch = searchTerm === '' ||
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.code.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
            const matchesUnit = unitFilter === 'all' || product.unit === unitFilter;

            return matchesSearch && matchesCategory && matchesUnit;
        });
    }, [products, searchTerm, categoryFilter, unitFilter]);


    const handleOpenForm = (product: Product | null) => {
        setEditingProduct(product);
        if (product) {
            form.reset({
                code: product.code,
                name: product.name,
                price: product.price,
                costPrice: product.costPrice,
                stock: product.stock,
                minStock: product.minStock,
                unit: product.unit,
                category: product.category,
                imageUrl: product.imageUrl || '',
            });
            setPreviewImage(product.imageUrl);
        } else {
            form.reset({ 
                code: '', 
                name: '', 
                price: 0, 
                costPrice: 0,
                stock: 0, 
                minStock: 0,
                unit: '',
                category: '',
                imageUrl: '' 
            });
            setPreviewImage(null);
        }
        setIsFormOpen(true);
    };

    const handleOpenStockForm = (product: Product) => {
        setStockEditProduct(product);
        stockOpnameForm.reset({ physicalStock: product.stock, notes: '' });
    };

    const handleViewHistory = async (product: Product) => {
        setViewingHistoryProduct(product);
        setIsHistoryLoading(true);
        const movements = await getStockMovements(product.id);
        setStockMovements(movements);
        setIsHistoryLoading(false);
    }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'File tidak valid', description: 'Silakan pilih file gambar.' });
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            setPreviewImage(result);
            form.setValue('imageUrl', result, { shouldValidate: true });
        };
    };

    const onProductSubmit = async (data: ProductFormValues) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                imageUrl: data.imageUrl || 'https://placehold.co/100x100.png'
            };
            if (editingProduct) {
                await updateProduct(editingProduct.id, payload);
                toast({ title: 'Sukses', description: 'Produk berhasil diperbarui.' });
            } else {
                await addProduct(payload);
                toast({ title: 'Sukses', description: 'Produk berhasil ditambahkan.' });
            }
            setIsFormOpen(false);
            fetchProducts();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal menyimpan data.';
            toast({ variant: 'destructive', title: 'Kesalahan', description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const onStockOpnameSubmit = async (data: StockOpnameFormValues) => {
        if (!stockEditProduct) return;
        setIsSubmitting(true);
        try {
            await updateProductStock(stockEditProduct.id, data.physicalStock, data.notes);
            toast({ title: 'Sukses', description: 'Stok produk berhasil diperbarui.' });
            setStockEditProduct(null); // Close dialog
            fetchProducts();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal memperbarui stok.';
            toast({ variant: 'destructive', title: 'Kesalahan', description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSort = (field: SortableProductField) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };
    
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const newSelection = filteredProducts.reduce((acc, product) => {
                acc[product.id] = true;
                return acc;
            }, {} as ProductSelection);
            setSelection(newSelection);
        } else {
            setSelection({});
        }
    };

    const handleSelectRow = (productId: string, checked: boolean) => {
        setSelection(prev => ({ ...prev, [productId]: checked }));
    };

    const selectedIds = Object.keys(selection).filter(id => selection[id]);
    const selectedCount = selectedIds.length;

    const onDeleteMultiple = async () => {
        setIsSubmitting(true);
        try {
            await deleteMultipleProducts(selectedIds);
            toast({ title: 'Sukses', description: `${selectedCount} produk berhasil dihapus.` });
            setSelection({});
            fetchProducts();
        } catch (error) {
             const message = error instanceof Error ? error.message : 'Gagal menghapus produk.';
            toast({ variant: 'destructive', title: 'Kesalahan', description: message });
        } finally {
            setIsSubmitting(false);
        }
    }


    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number);
    };

    const handleExport = () => {
        const dataToExport = products.map(p => ({
            "Kode Item": p.code,
            "Nama Item": p.name,
            "Jenis": p.category,
            "Stok": p.stock,
            "Satuan": p.unit,
            "Harga Pokok": p.costPrice,
            "Harga Jual": p.price,
            "Stok Minimal": p.minStock
        }));

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'products.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Sukses', description: 'Data produk telah diekspor.' });
    };

     const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse<any>(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const dataRows = results.data;
                const meta = results.meta;
                console.log("LOG: Raw parsed data rows from CSV:", dataRows);

                if (!meta.fields) {
                    toast({ variant: 'destructive', title: 'Header Tidak Ditemukan', description: 'Pastikan file CSV Anda memiliki baris header.' });
                    return;
                }

                const lowercaseHeaders = meta.fields.map(h => h.toLowerCase().trim());
                
                const headerMapping: { [key: string]: keyof Product } = {
                    'kode item': 'code',
                    'nama item': 'name',
                    'jenis': 'category',
                    'stok': 'stock',
                    'satuan': 'unit',
                    'harga pokok': 'costPrice',
                    'harga jual': 'price',
                    'stok minimal': 'minStock'
                };
                
                let successCount = 0;
                let errorCount = 0;

                for (const row of dataRows) {
                    try {
                        const productData: Partial<Product> = {};
                        
                        console.log("--- LOG: Processing row:", row);

                        for (const header of meta.fields) { // Use original headers for lookup
                            const mappedKey = headerMapping[header.toLowerCase().trim()];
                            if(mappedKey) {
                                let value = row[header];

                                if (mappedKey === 'stock' || mappedKey === 'minStock') {
                                    console.log(`LOG: Stock value for '${header}' before parse:`, value, `(type: ${typeof value})`);
                                    value = parseInt(String(value).trim(), 10) || 0;
                                    console.log(`LOG: Stock value for '${header}' after parse:`, value);
                                } else if (mappedKey === 'price' || mappedKey === 'costPrice') {
                                    value = parseFloat(String(value).replace(/[^0-9.-]+/g,"")) || 0;
                                }
                                (productData as any)[mappedKey] = value;
                            }
                        }

                        if (!productData.code) {
                            console.log("LOG: Skipping row due to missing code:", row);
                            continue;
                        }
                        
                        const finalProductData = {
                            code: productData.code!,
                            name: productData.name || '',
                            category: productData.category || 'Lainnya',
                            unit: productData.unit || 'PCS',
                            stock: productData.stock || 0,
                            costPrice: productData.costPrice || 0,
                            price: productData.price || 0,
                            minStock: productData.minStock || 0,
                            imageUrl: 'https://placehold.co/100x100.png',
                        };
                        
                        console.log("LOG: Final data to be saved:", finalProductData);

                        const existingByCode = products.find(p => p.code.toLowerCase() === finalProductData.code.toLowerCase());
                        
                        if (existingByCode) {
                           await updateProduct(existingByCode.id, finalProductData);
                        } else {
                           await addProduct(finalProductData);
                        }
                        successCount++;

                    } catch (e) {
                        console.error("Gagal mengimpor baris:", row, e);
                        errorCount++;
                    }
                }
                toast({
                    title: 'Impor Selesai',
                    description: `${successCount} produk berhasil diimpor/diperbarui. ${errorCount} baris gagal.`,
                });
                fetchProducts();
            },
            error: (error) => {
                toast({ variant: 'destructive', title: 'Gagal Membaca File', description: error.message });
            }
        });
        
        if(importInputRef.current) {
            importInputRef.current.value = '';
        }
    };
    
    const handleStockOpnameImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const stockUpdates: { code: string; physicalStock: number; notes: string }[] = [];
                for (const row of (results.data as any[])) {
                    const code = row['KODE ITEM / BARCODE (1)'];
                    const physicalStock = parseInt(row['JUMLAH FISIK SATUAN DASAR (2)'], 10);
                    const notes = row['KETERANGAN (3)'] || 'Impor Stok Opname Massal';

                    if (code && !isNaN(physicalStock)) {
                        stockUpdates.push({ code, physicalStock, notes });
                    }
                }

                if (stockUpdates.length > 0) {
                    const { success, failure } = await bulkUpdateProductStock(stockUpdates);
                    toast({
                        title: 'Impor Stok Opname Selesai',
                        description: `${success} produk berhasil diperbarui, ${failure} kode item tidak ditemukan.`,
                    });
                    fetchProducts();
                } else {
                     toast({
                        variant: 'destructive',
                        title: 'Tidak Ada Data Valid',
                        description: 'Pastikan file CSV Anda memiliki kolom "KODE ITEM / BARCODE (1)" dan "JUMLAH FISIK SATUAN DASAR (2)".',
                    });
                }
            },
            error: (error) => {
                toast({ variant: 'destructive', title: 'Gagal Membaca File', description: error.message });
            }
        });

        if (opnameImportInputRef.current) {
            opnameImportInputRef.current.value = '';
        }
    };

    const handlePrintOpnameReport = async () => {
        if (!reportDateRange?.from || !reportDateRange?.to) {
            toast({
                variant: 'destructive',
                title: 'Rentang Tanggal Diperlukan',
                description: 'Silakan pilih rentang tanggal untuk mencetak laporan.',
            });
            return;
        }

        setIsPrintingReport(true);
        try {
            const movements = await getStockOpnameMovements(reportDateRange.from, reportDateRange.to);

            if (movements.length === 0) {
                toast({
                    variant: 'destructive',
                    title: 'Tidak Ada Data',
                    description: 'Tidak ada data penyesuaian stok pada rentang tanggal yang dipilih.',
                });
                return;
            }

            const doc = new jsPDF() as jsPDFWithAutoTable;

            doc.setFontSize(16);
            doc.text('Laporan Penyesuaian Stok (Opname)', 14, 22);
            doc.setFontSize(10);
            doc.text(
                `Periode: ${format(reportDateRange.from, 'dd MMM yyyy', { locale: id })} - ${format(reportDateRange.to, 'dd MMM yyyy', { locale: id })}`,
                14,
                28
            );

            const tableColumn = ["Tanggal", "Kode Item", "Nama Item", "Stok Buku", "Stok Fisik", "Selisih", "Keterangan"];
            const tableRows: any[] = [];

            movements.forEach(m => {
                const row = [
                    format(new Date(m.createdAt), 'dd/MM/yy HH:mm'),
                    m.productCode,
                    m.productName,
                    m.stockBefore,
                    m.stockAfter,
                    m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange,
                    m.notes || '-'
                ];
                tableRows.push(row);
            });

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            });

            const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
            doc.save(`laporan_opname_${timestamp}.pdf`);

            toast({ title: 'Sukses!', description: 'Laporan berhasil dibuat.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal', description: 'Tidak dapat membuat laporan PDF.' });
        } finally {
            setIsPrintingReport(false);
        }
    };


    // Watch for changes in the physical stock form field to calculate the difference
    const physicalStock = stockOpnameForm.watch('physicalStock');
    const bookStock = stockEditProduct?.stock ?? 0;
    const difference = physicalStock - bookStock;


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                 <div className="flex flex-col md:flex-row gap-4">
                     <div className="grid gap-2">
                        <Label htmlFor="search-product">Cari Produk</Label>
                        <Input 
                            id="search-product"
                            placeholder="Kode atau Nama..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full md:w-[250px]"
                        />
                     </div>
                     <div className="grid gap-2">
                        <Label htmlFor="filter-category">Jenis (Kategori)</Label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger id="filter-category" className="w-full md:w-[180px]">
                                <SelectValue placeholder="Semua Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Jenis</SelectItem>
                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                      <div className="grid gap-2">
                        <Label htmlFor="filter-unit">Satuan</Label>
                        <Select value={unitFilter} onValueChange={setUnitFilter}>
                            <SelectTrigger id="filter-unit" className="w-full md:w-[150px]">
                                <SelectValue placeholder="Semua Satuan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Satuan</SelectItem>
                                {units.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                 </div>
                 <div className="flex items-center justify-end flex-wrap gap-2">
                     
                    <Button onClick={() => handleOpenForm(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah Produk
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border rounded-lg bg-muted/50">
                 <div className='flex flex-wrap items-center gap-2'>
                    <input type="file" accept=".csv" ref={opnameImportInputRef} onChange={handleStockOpnameImport} className="hidden" />
                    <Button variant="outline" onClick={() => opnameImportInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Impor Stok Opname
                    </Button>
                     <input type="file" accept=".csv" ref={importInputRef} onChange={handleImport} className="hidden" />
                    <Button variant="outline" onClick={() => importInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Impor Produk
                    </Button>
                    <Button variant="outline" onClick={handleExport} disabled={products.length === 0}>
                        <Download className="mr-2 h-4 w-4" /> Ekspor Produk
                    </Button>
                 </div>
                 <div className='flex items-end gap-2'>
                    <DateRangePicker date={reportDateRange} onDateChange={setReportDateRange} />
                    <Button onClick={handlePrintOpnameReport} disabled={isPrintingReport}>
                        {isPrintingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Cetak Laporan Opname
                    </Button>
                 </div>
            </div>

            {selectedCount > 0 && (
                <div className='flex justify-between items-center bg-muted/50 p-3 rounded-lg'>
                    <p className='text-sm text-muted-foreground'>{selectedCount} produk terpilih</p>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isSubmitting}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus Terpilih
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. {selectedCount} produk akan dihapus secara permanen.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={onDeleteMultiple}>Hapus</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
            
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className='w-12'>
                                <Checkbox
                                    checked={filteredProducts.length > 0 && selectedCount === filteredProducts.length}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="w-40 cursor-pointer hover:bg-muted" onClick={() => handleSort('code')}>
                                <div className='flex items-center gap-2'>
                                    Kode Item {sortBy === 'code' && <ArrowUpDown className="h-4 w-4" />}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('name')}>
                                 <div className='flex items-center gap-2'>
                                    Nama Item {sortBy === 'name' && <ArrowUpDown className="h-4 w-4" />}
                                </div>
                            </TableHead>
                            <TableHead className="w-24 cursor-pointer hover:bg-muted" onClick={() => handleSort('stock')}>
                                 <div className='flex items-center gap-2'>
                                    Stok {sortBy === 'stock' && <ArrowUpDown className="h-4 w-4" />}
                                </div>
                            </TableHead>
                            <TableHead>Satuan</TableHead>
                            <TableHead className="w-40 cursor-pointer hover:bg-muted" onClick={() => handleSort('category')}>
                                <div className='flex items-center gap-2'>
                                   Jenis {sortBy === 'category' && <ArrowUpDown className="h-4 w-4" />}
                                </div>
                            </TableHead>
                            <TableHead className="w-32">Harga Pokok</TableHead>
                            <TableHead className="w-32">Harga Jual</TableHead>
                            <TableHead className="w-28">Stok Min.</TableHead>
                            <TableHead className="text-right w-40">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={10} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                        ) : filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <TableRow key={product.id} data-state={selection[product.id] ? "selected" : ""} onClick={() => handleSelectRow(product.id, !selection[product.id])} className="cursor-pointer">
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selection[product.id] || false}
                                            onCheckedChange={(checked) => handleSelectRow(product.id, !!checked)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-mono">{product.code}</TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className={cn(product.stock <= product.minStock && 'text-red-500 font-bold')}>{product.stock}</TableCell>
                                    <TableCell>{product.unit}</TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell>{formatRupiah(product.costPrice)}</TableCell>
                                    <TableCell>{formatRupiah(product.price)}</TableCell>
                                    <TableCell>{product.minStock}</TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                       <Dialog open={!!stockEditProduct && stockEditProduct.id === product.id} onOpenChange={(open) => !open && setStockEditProduct(null)}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" title="Edit Stok / Stok Opname" onClick={() => handleOpenStockForm(product)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <Form {...stockOpnameForm}>
                                                    <form onSubmit={stockOpnameForm.handleSubmit(onStockOpnameSubmit)}>
                                                        <DialogHeader>
                                                            <DialogTitle>Stok Opname: {stockEditProduct?.name}</DialogTitle>
                                                             <DialogDescription>
                                                                Sesuaikan jumlah stok berdasarkan perhitungan fisik di gudang.
                                                            </DialogDescription>
                                                             <div className='font-mono text-xs pt-1 text-muted-foreground'>Kode: {stockEditProduct?.code}</div>
                                                        </DialogHeader>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
                                                              <div className='space-y-2'>
                                                                <Label>Stok Buku</Label>
                                                                <Input value={bookStock} readOnly disabled />
                                                             </div>
                                                              <FormField
                                                                control={stockOpnameForm.control}
                                                                name="physicalStock"
                                                                render={({ field }) => (
                                                                  <FormItem>
                                                                    <FormLabel>Stok Fisik</FormLabel>
                                                                    <FormControl>
                                                                      <Input type="number" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                  </FormItem>
                                                                )}
                                                              />
                                                              <div className='space-y-2'>
                                                                <Label>Selisih</Label>
                                                                <Input value={difference} readOnly disabled className={difference !== 0 ? (difference > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold') : ''} />
                                                             </div>
                                                        </div>
                                                        <FormField
                                                              control={stockOpnameForm.control}
                                                              name="notes"
                                                              render={({ field }) => (
                                                                <FormItem>
                                                                  <FormLabel>Keterangan</FormLabel>
                                                                  <FormControl>
                                                                    <Textarea placeholder="cth: Hasil opname bulanan" {...field} />
                                                                  </FormControl>
                                                                  <FormMessage />
                                                                </FormItem>
                                                              )}
                                                            />
                                                        <DialogFooter>
                                                            <Button type="button" variant="outline" onClick={() => setStockEditProduct(null)}>Batal</Button>
                                                            <Button type="submit" disabled={isSubmitting}>
                                                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Simpan Penyesuaian
                                                            </Button>
                                                        </DialogFooter>
                                                    </form>
                                                </Form>
                                            </DialogContent>
                                        </Dialog>

                                        <Dialog open={!!viewingHistoryProduct && viewingHistoryProduct.id === product.id} onOpenChange={(open) => !open && setViewingHistoryProduct(null)}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" title="Kartu Stok" onClick={() => handleViewHistory(product)}>
                                                    <BookOpen className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-3xl">
                                                <DialogHeader>
                                                    <DialogTitle>Kartu Stok: {viewingHistoryProduct?.name}</DialogTitle>
                                                    <DialogDescription>Riwayat pergerakan stok untuk produk ini.</DialogDescription>
                                                </DialogHeader>
                                                <div className="mt-4 max-h-[60vh] overflow-y-auto">
                                                    {isHistoryLoading ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" /> :
                                                        stockMovements.length > 0 ? (
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Tanggal</TableHead>
                                                                        <TableHead>Tipe</TableHead>
                                                                        <TableHead>Perubahan</TableHead>
                                                                        <TableHead>Stok Akhir</TableHead>
                                                                        <TableHead>Catatan</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {stockMovements.map(m => (
                                                                        <TableRow key={m.id}>
                                                                            <TableCell className="text-xs">{format(new Date(m.createdAt), 'dd MMM yy, HH:mm', { locale: id })}</TableCell>
                                                                            <TableCell>{m.type}</TableCell>
                                                                            <TableCell className={m.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}>
                                                                                {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                                                                            </TableCell>
                                                                            <TableCell className='font-medium'>{m.stockAfter}</TableCell>
                                                                            <TableCell className='text-xs text-muted-foreground'>{m.notes}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        ) : (
                                                            <p className='text-center text-muted-foreground py-8'>Belum ada riwayat pergerakan stok.</p>
                                                        )}
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setViewingHistoryProduct(null)}>Tutup</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        <Button variant="ghost" size="icon" title="Edit Produk" onClick={() => handleOpenForm(product)}><Pencil className="h-4 w-4" /></Button>
                                        
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={10} className="h-24 text-center">Tidak ada produk yang cocok dengan filter.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onProductSubmit)}>
                            <DialogHeader>
                                <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                <div className="md:col-span-2 flex flex-col items-center">
                                    <FormField
                                        control={form.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gambar Produk</FormLabel>
                                                <FormControl>
                                                    <div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            ref={imageInputRef}
                                                            onChange={handleImageChange}
                                                            className="hidden"
                                                        />
                                                        <Image
                                                            src={previewImage || 'https://placehold.co/200x200.png'}
                                                            alt="Pratinjau"
                                                            width={128}
                                                            height={128}
                                                            className="h-32 w-32 rounded-md object-cover cursor-pointer"
                                                            onClick={() => imageInputRef.current?.click()}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                                <input type="hidden" {...field} value={field.value || ''} />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField control={form.control} name="code" render={({ field }) => (
                                    <FormItem><FormLabel>Kode Item</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Nama Item</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="category" render={({ field }) => (
                                     <FormItem><FormLabel>Jenis (Kategori)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih jenis" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                     <FormMessage /></FormItem>
                                )} />
                                 <FormField control={form.control} name="unit" render={({ field }) => (
                                     <FormItem><FormLabel>Satuan</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih satuan" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                     <FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="costPrice" render={({ field }) => (
                                    <FormItem><FormLabel>Harga Pokok (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="price" render={({ field }) => (
                                    <FormItem><FormLabel>Harga Jual (Rp)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="stock" render={({ field }) => (
                                    <FormItem><FormLabel>Stok Awal</FormLabel><FormControl><Input type="number" {...field} disabled={!!editingProduct} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="minStock" render={({ field }) => (
                                    <FormItem><FormLabel>Stok Minimal</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}


export default function ProductsSettingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        // Redirect if not an admin after loading is complete
        if (!loading && user?.role !== 'admin') {
            router.push('/shipments');
        }
    }, [user, loading, router]);


    // Show a loading skeleton while the auth state is being determined
    if (loading) {
        return (
            <div className="container mx-auto p-4 md:p-8 space-y-6">
                <Skeleton className="h-8 w-48" />
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-9 w-1/3" />
                        <Skeleton className="h-5 w-2/3 mt-2" />
                    </CardHeader>
                    <CardContent>
                       <Skeleton className="h-96 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    // If loading is finished and user is not an admin, show a redirecting message.
    // The useEffect above will handle the redirection.
    if (!user || user.role !== 'admin') {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Anda tidak memiliki akses ke halaman ini. Mengalihkan...</p>
            </div>
        );
    }
    
    // Render the page if the user is authenticated as an admin
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
                    <CardTitle>Manajemen Produk</CardTitle>
                    <CardDescription>
                        Kelola semua data item yang ada di gudang. Tambah, hapus, atau edit produk.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductsClient />
                </CardContent>
            </Card>
        </div>
    );
}

    

    
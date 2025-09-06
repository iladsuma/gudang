
'use client';

import * as React from 'react';
import { getProducts } from '@/lib/data';
import type { Product, SortableProductField, SortOrder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, ArrowUpDown, FileDown, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function ProductReportClient() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<SortableProductField>('code');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc');
  const { toast } = useToast();

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts(sortBy, sortOrder);
      setProducts(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal memuat data',
        description: 'Tidak dapat mengambil data produk dari server.',
      });
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, toast]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSort = (field: SortableProductField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  const handleExportCSV = () => {
    const dataToExport = products.map(p => ({
      "Kode Item": p.code,
      "Nama Item": p.name,
      "Kategori": p.category,
      "Stok": p.stock,
      "Satuan": p.unit,
      "Harga Pokok": p.costPrice,
      "Harga Jual": p.price,
      "Stok Minimal": p.minStock
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_master_barang_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Sukses', description: 'Data produk telah diekspor ke CSV.' });
  };
  
  const handlePrintPDF = () => {
    setIsPrinting(true);
    try {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        
        doc.setFontSize(16);
        doc.text('Laporan Master Barang', 14, 22);
        doc.setFontSize(10);
        doc.text(`Tanggal Cetak: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`, 14, 28);
        
        const tableColumn = ["Kode Item", "Nama Item", "Kategori", "Stok", "Harga Pokok", "Harga Jual"];
        const tableRows: any[] = [];

        products.forEach(p => {
            const row = [
                p.code,
                p.name,
                p.category,
                `${p.stock} ${p.unit}`,
                formatRupiah(p.costPrice),
                formatRupiah(p.price)
            ];
            tableRows.push(row);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
             columnStyles: {
                3: { halign: 'center' },
                4: { halign: 'right' },
                5: { halign: 'right' },
            },
        });

        doc.save(`laporan_master_barang_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast({ title: 'Sukses!', description: 'Laporan PDF berhasil dibuat.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal', description: 'Tidak dapat membuat laporan PDF.' });
    } finally {
        setIsPrinting(false);
    }
  };

  return (
    <div className="space-y-4">
       <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleExportCSV} disabled={products.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Ekspor ke CSV
            </Button>
             <Button onClick={handlePrintPDF} disabled={products.length === 0 || isPrinting}>
                {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Cetak PDF
            </Button>
       </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('code')}>
                <div className='flex items-center gap-2'>Kode Item {sortBy === 'code' && <ArrowUpDown className="h-4 w-4" />}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('name')}>
                <div className='flex items-center gap-2'>Nama Item {sortBy === 'name' && <ArrowUpDown className="h-4 w-4" />}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('category')}>
                <div className='flex items-center gap-2'>Kategori {sortBy === 'category' && <ArrowUpDown className="h-4 w-4" />}</div>
              </TableHead>
               <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('stock')}>
                <div className='flex items-center gap-2'>Stok {sortBy === 'stock' && <ArrowUpDown className="h-4 w-4" />}</div>
              </TableHead>
              <TableHead className="text-right">Harga Pokok</TableHead>
              <TableHead className="text-right">Harga Jual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono">{product.code}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                   <TableCell className={cn(product.stock <= product.minStock && 'text-red-500 font-bold')}>
                      {product.stock} {product.unit}
                   </TableCell>
                  <TableCell className="text-right">{formatRupiah(product.costPrice)}</TableCell>
                  <TableCell className="text-right">{formatRupiah(product.price)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Belum ada data produk.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

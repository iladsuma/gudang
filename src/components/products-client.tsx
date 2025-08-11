'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2, FileDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProductForm } from './product-form';
import { handleDeleteProduct } from '@/lib/actions';
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
import { Checkbox } from '@/components/ui/checkbox';

interface JsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function ProductsClient({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFormSuccess = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    setIsFormOpen(false);
    setSelectedProduct(null);
  };

  const onAddNew = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const onEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const onDelete = async (productId: string) => {
    setIsDeleting(true);
    const result = await handleDeleteProduct(productId);
    if (result.success) {
      setProducts(products.filter((p) => p.id !== productId));
      toast({
        title: 'Sukses!',
        description: 'Produk berhasil dihapus.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Kesalahan',
        description: result.message,
      });
    }
    setIsDeleting(false);
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(products.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds((prev) => [...prev, productId]);
    } else {
      setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  const handleExportPdf = () => {
    const doc = new jsPDF() as JsPDFWithAutoTable;
    const selected = products.filter((p) => selectedProductIds.includes(p.id));

    doc.text('Daftar Produk yang Dipilih', 14, 16);
    doc.autoTable({
      startY: 20,
      head: [['Nama Produk', 'Kode Produk', 'Stok', 'No. Resi']],
      body: selected.map(p => [p.name, p.code, p.stock, p.receiptNumber]),
    });
    doc.save('daftar-produk.pdf');
  };

  const allSelected = selectedProductIds.length === products.length && products.length > 0;
  const isAnySelected = selectedProductIds.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {isAnySelected && (
            <Button variant="outline" onClick={handleExportPdf}>
                <FileDown className="mr-2" />
                Ekspor PDF ({selectedProductIds.length})
            </Button>
        )}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={onAddNew}>
              <PlusCircle className="mr-2" />
              Tambah Produk Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
            </DialogHeader>
            <ProductForm
              product={selectedProduct}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Pilih semua"
                />
              </TableHead>
              <TableHead>Nama Produk</TableHead>
              <TableHead>Kode Produk</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>No. Resi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id} data-state={selectedProductIds.includes(product.id) && "selected"}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProductIds.includes(product.id)}
                      onCheckedChange={(checked) => handleSelectOne(product.id, !!checked)}
                      aria-label={`Pilih ${product.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.code}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{product.receiptNumber}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isDeleting}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus produk secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(product.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Lanjutkan
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Tidak ada produk ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {products.length > 0 && (
            <TableCaption>Daftar produk Anda.</TableCaption>
          )}
        </Table>
      </div>
    </div>
  );
}

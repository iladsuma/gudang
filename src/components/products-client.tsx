'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Loader2, Edit } from 'lucide-react';
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

export function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFormSuccess = (updatedProduct: Product) => {
    if (editingProduct) {
        setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    } else {
        setProducts([updatedProduct, ...products]);
    }
    setIsFormOpen(false);
    setEditingProduct(null);
  };
  
  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  }

  const openNewDialog = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  }

  const onDelete = async (productId: string) => {
    setIsDeleting(productId);
    const result = await handleDeleteProduct(productId);
    if (result.success) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
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
    setIsDeleting(null);
  };
  
    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(number);
    };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Dialog open={isFormOpen} onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingProduct(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <PlusCircle className="mr-2" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
            </DialogHeader>
            <ProductForm 
                key={editingProduct?.id || 'new'}
                product={editingProduct} 
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
              <TableHead>Kode Produk</TableHead>
              <TableHead>Nama Produk</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead className="text-right">Harga</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.code}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="text-right">{product.stock}</TableCell>
                  <TableCell className="text-right">{formatRupiah(product.price)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={!!isDeleting}>
                            {isDeleting === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data produk secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(product.id)}
                            disabled={!!isDeleting}
                          >
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
                <TableCell colSpan={5} className="h-24 text-center">
                  Tidak ada data produk.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {products.length > 0 && (
            <TableCaption>Daftar semua produk di inventaris Anda.</TableCaption>
          )}
        </Table>
      </div>
    </div>
  );
}

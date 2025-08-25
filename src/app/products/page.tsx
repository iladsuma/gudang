
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getProducts } from '@/lib/data';
import type { Product, ProductSelection } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selection, setSelection] = useState<ProductSelection>({});
  const { addToCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      getProducts().then(data => {
        setProducts(data);
        setDataLoading(false);
      });
    } else if (!authLoading) {
      setDataLoading(false);
    }
  }, [user, authLoading]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleSelectionChange = (productId: string, checked: boolean) => {
    setSelection(prev => ({ ...prev, [productId]: checked }));
  };

  const handleBulkAddToCart = () => {
    const selectedProductIds = Object.keys(selection).filter(id => selection[id]);

    if (selectedProductIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Tidak ada produk dipilih',
        description: 'Silakan centang produk yang ingin ditambahkan.',
      });
      return;
    }

    const itemsToAdd = products.filter(p => selectedProductIds.includes(p.id));

    let itemsAddedCount = 0;
    itemsToAdd.forEach(product => {
      // Add to cart with default quantity of 1
      addToCart(product, 1);
      itemsAddedCount++;
    });

    if (itemsAddedCount > 0) {
      toast({
        title: 'Sukses!',
        description: `${itemsAddedCount} jenis produk telah ditambahkan ke keranjang. Lanjutkan ke keranjang untuk mengatur kuantitas.`,
      });
    }

    // Reset selection after adding
    setSelection({});
    router.push('/cart');
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };
  
  const selectedCount = Object.values(selection).filter(Boolean).length;

  if (authLoading || (dataLoading && user)) {
    return (
      <div className="container mx-auto p-4 md:p-8">
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

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Mengalihkan ke halaman login...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Etalase Produk</CardTitle>
          <CardDescription>
            Pilih produk yang akan direkap, lalu lanjutkan ke keranjang untuk mengisi kuantitas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau kode produk..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleBulkAddToCart} disabled={selectedCount === 0}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Lanjut ke Rekap ({selectedCount})
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"><Checkbox
                    checked={filteredProducts.length > 0 && selectedCount === filteredProducts.length}
                    onCheckedChange={(checked) => {
                      const newSelection: ProductSelection = {};
                      if(checked) {
                        filteredProducts.forEach(p => newSelection[p.id] = true);
                      }
                      setSelection(newSelection);
                    }}
                  /></TableHead>
                  <TableHead className="w-[80px]">Gambar</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead className="w-[100px]">Stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      Memuat data produk...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <TableRow key={product.id} data-state={selection[product.id] ? 'selected' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selection[product.id] || false}
                          onCheckedChange={(checked) => handleSelectionChange(product.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Image
                          src={product.imageUrl || 'https://placehold.co/100x100.png'}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{product.code}</TableCell>
                      <TableCell>{formatRupiah(product.price)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      Tidak ada produk ditemukan.
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

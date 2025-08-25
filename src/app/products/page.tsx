
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
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

interface ProductWithQuantity extends Product {
  inputQuantity: number;
}

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<ProductWithQuantity[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      getProducts().then(data => {
        setProducts(data.map(p => ({ ...p, inputQuantity: 0 })));
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

  const handleQuantityChange = (productId: string, quantity: number) => {
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, inputQuantity: quantity >= 0 ? quantity : 0 } : p
      )
    );
  };
  
  const handleBulkAddToCart = () => {
    const itemsToAdd = products.filter(p => p.inputQuantity > 0);
    if (itemsToAdd.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Tidak ada produk dipilih',
            description: 'Silakan isi kuantitas pada produk yang ingin ditambahkan.',
        });
        return;
    }

    let itemsAddedCount = 0;
    itemsToAdd.forEach(product => {
        addToCart(product, product.inputQuantity);
        itemsAddedCount++;
    });

    if(itemsAddedCount > 0){
        toast({
            title: 'Sukses!',
            description: `${itemsAddedCount} jenis produk telah ditambahkan ke keranjang.`,
        });
    }

    // Reset input quantities after adding
    setProducts(prevProducts =>
      prevProducts.map(p => ({ ...p, inputQuantity: 0 }))
    );
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

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
            Pilih produk dan masukkan kuantitas untuk ditambahkan ke keranjang secara massal.
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
            <Button onClick={handleBulkAddToCart}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Tambah ke Keranjang
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Gambar</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead className="w-[100px]">Stok</TableHead>
                  <TableHead className="w-[150px]">Kuantitas</TableHead>
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
                    <TableRow key={product.id}>
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
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={product.stock}
                          value={product.inputQuantity}
                          onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value, 10) || 0)}
                          className="w-24"
                          disabled={product.stock === 0}
                        />
                      </TableCell>
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

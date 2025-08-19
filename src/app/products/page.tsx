
'use client';

import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { addToCart } = useCart();
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
  
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number);
  };
  
  const handleAddToCart = (product: Product) => {
    addToCart(product);
    router.push('/cart');
  };


  if (authLoading || (dataLoading && user)) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-6">
            <Skeleton className="h-9 w-1/3" />
            <Skeleton className="h-5 w-2/3 mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="aspect-square w-full" />
              </CardContent>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
              <CardFooter className='flex justify-between items-center'>
                 <Skeleton className="h-5 w-1/3" />
                 <Skeleton className="h-5 w-1/4" />
              </CardFooter>
            </Card>
          ))}
        </div>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Etalase Produk</h1>
        <p className="text-muted-foreground">
          Pilih produk untuk ditambahkan ke rekap pengiriman.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.map(product => (
          <Card key={product.id} className="flex flex-col overflow-hidden group">
            <CardContent className="p-0 relative">
              <Image 
                src={product.imageUrl || 'https://placehold.co/400x400.png'} 
                alt={product.name}
                width={400}
                height={400}
                className="aspect-square w-full object-cover"
                data-ai-hint="product image"
              />
               <Button 
                size="sm" 
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0}
               >
                 <PlusCircle className="mr-2 h-4 w-4"/>
                 Tambah
               </Button>
            </CardContent>
            <CardHeader className="flex-grow">
              <CardTitle className="text-base">{product.name}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono pt-1">{product.code}</p>
            </CardHeader>
            <CardFooter className='flex justify-between items-center bg-muted/50 p-3'>
              <div className='text-sm font-semibold text-primary'>
                {formatRupiah(product.price)}
              </div>
              <Badge variant={product.stock > 0 ? 'secondary' : 'destructive'}>
                Stok: {product.stock}
              </Badge>
            </CardFooter>
          </Card>
        ))}
         {products.length === 0 && !dataLoading && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Belum ada produk yang ditambahkan.</p>
            </div>
        )}
      </div>
    </div>
  );
}

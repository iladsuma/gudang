'use client';

import { getProducts } from '@/lib/data';
import { ProductsClient } from '@/components/products-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
        getProducts().then(data => {
            setProducts(data);
            setLoading(false);
        });
    }
  }, [user]);

  if (loading) {
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
      )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Produk</CardTitle>
          <CardDescription>
            Tambah, lihat, edit, dan hapus produk Anda di sini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductsClient initialProducts={products} />
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { CheckoutForm } from '@/components/checkout-form';
import { getProducts } from '@/lib/data';
import { useAuth } from '@/context/auth-context';
import { Product } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CheckoutPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchProducts = async () => {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
        setLoading(false);
      };
      fetchProducts();
    }
  }, [user]);

  if (!user || loading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-[400px] w-full" />
            </div>
            <div className="space-y-8">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[100px] w-full" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <CheckoutForm allProducts={products} />
    </div>
  );
}

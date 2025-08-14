'use client';

import { getCheckoutHistory } from '@/lib/data';
import { InvoicesClient } from '@/components/invoices-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import type { Transaction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvoicesPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user?.role === 'admin') {
      getCheckoutHistory().then(data => {
        setTransactions(data);
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
          <CardTitle>Faktur Penjualan</CardTitle>
          <CardDescription>
            Kelola dan buat faktur untuk transaksi penjualan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoicesClient transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}

'use client';
import { getShipments } from '@/lib/data';
import { ShipmentsClient } from '@/components/shipments-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import type { Shipment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ShipmentsPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
        getShipments().then(data => {
            setShipments(data);
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
          <CardTitle>Lacak Pengiriman</CardTitle>
          <CardDescription>
            Kelola semua data pengiriman barang masuk Anda di sini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShipmentsClient shipments={shipments} />
        </CardContent>
      </Card>
    </div>
  );
}

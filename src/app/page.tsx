'use client';

import { CheckoutForm } from '@/components/checkout-form';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

export default function CheckoutPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle>Checkout Barang</CardTitle>
          <CardDescription>
            Catat barang yang keluar dari gudang di sini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CheckoutForm />
        </CardContent>
      </Card>
    </div>
  );
}

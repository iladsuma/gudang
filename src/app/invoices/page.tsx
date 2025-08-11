import { getCheckoutHistory } from '@/lib/data';
import { InvoicesClient } from '@/components/invoices-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

export default async function InvoicesPage() {
  const transactions = await getCheckoutHistory();

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

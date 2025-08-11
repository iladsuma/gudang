import { getShipments } from '@/lib/data';
import { ShipmentsClient } from '@/components/shipments-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

export default async function ShipmentsPage() {
  const shipments = await getShipments();

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

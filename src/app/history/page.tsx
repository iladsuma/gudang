import { getCheckoutHistory } from '@/lib/data';
import { HistoryClient } from '@/components/history-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

export default async function HistoryPage() {
  const transactions = await getCheckoutHistory();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Checkout History</CardTitle>
          <CardDescription>
            View a comprehensive history of all checkout transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HistoryClient transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}

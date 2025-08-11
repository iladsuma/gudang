import { getProducts } from '@/lib/data';
import { ProductsClient } from '@/components/products-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Products</CardTitle>
          <CardDescription>
            Here you can add, edit, and delete your products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductsClient products={products} />
        </CardContent>
      </Card>
    </div>
  );
}

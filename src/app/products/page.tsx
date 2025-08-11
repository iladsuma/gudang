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
          <CardTitle>Kelola Produk</CardTitle>
          <CardDescription>
            Di sini Anda dapat menambah, mengedit, dan menghapus produk Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductsClient products={products} />
        </CardContent>
      </Card>
    </div>
  );
}

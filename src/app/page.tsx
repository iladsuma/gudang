import { CheckoutForm } from '@/components/checkout-form';
import { getProducts } from '@/lib/data';

export default async function CheckoutPage() {
  const products = await getProducts();
  return (
    <div className="container mx-auto p-4 md:p-8">
      <CheckoutForm allProducts={products} />
    </div>
  );
}

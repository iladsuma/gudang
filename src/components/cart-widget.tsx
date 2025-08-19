
'use client';

import * as React from 'react';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useCart } from '@/hooks/use-cart';
import Image from 'next/image';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { useRouter } from 'next/navigation';

export function CartWidget() {
  const { cart, updateQuantity, removeFromCart, clearCart, totalItems } = useCart();
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };
  
  const handleCheckout = () => {
    setIsOpen(false);
    router.push('/shipments?action=showForm');
  };

  if (cart.length === 0) return null;

  return (
    <>
        <div className="fixed bottom-6 right-6 z-50">
            <Button
                size="lg"
                className="rounded-full shadow-lg h-16 w-16"
                onClick={() => setIsOpen(!isOpen)}
            >
                <ShoppingCart className="h-7 w-7" />
                <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center rounded-full"
                >
                    {totalItems}
                </Badge>
                <span className="sr-only">Buka Keranjang</span>
            </Button>
        </div>

        {isOpen && (
            <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setIsOpen(false)} />
        )}

        <Card 
            className={`fixed bottom-24 right-6 z-50 w-full max-w-sm transform transition-transform duration-300 ${
                isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+2rem)]'
            }`}
        >
            <CardHeader>
                <CardTitle>Keranjang Pengiriman</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64 pr-4">
                    {cart.map(item => (
                        <div key={item.id} className="flex items-start gap-4 mb-4">
                            <Image 
                                src={item.imageUrl}
                                alt={item.name}
                                width={64}
                                height={64}
                                className="w-16 h-16 rounded-md object-cover"
                            />
                            <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{formatRupiah(item.price)}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span>{item.quantity}</span>
                                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </ScrollArea>
            </CardContent>
            <CardFooter className="flex-col !items-stretch gap-2">
                 <Button onClick={handleCheckout} disabled={cart.length === 0}>
                    Lanjut ke Rekap Pengiriman ({totalItems} item)
                </Button>
                <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>
                    Kosongkan Keranjang
                </Button>
            </CardFooter>
        </Card>
    </>
  );
}

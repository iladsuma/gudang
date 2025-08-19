
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CartItem, Product } from '@/lib/types';
import { useToast } from './use-toast';

const CART_STORAGE_KEY = 'shipping_cart';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
        console.error("Gagal mengambil keranjang dari localStorage", error);
        localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  const saveCartToLocalStorage = useCallback((updatedCart: CartItem[]) => {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
    } catch (error) {
        console.error("Gagal menyimpan keranjang ke localStorage", error);
    }
  }, []);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      let updatedCart;

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
            toast({ variant: 'destructive', title: 'Stok tidak cukup', description: `Sisa stok untuk ${product.name} hanya ${product.stock}.` });
            return prevCart;
        }
        updatedCart = prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      } else {
        if (quantity > product.stock) {
            toast({ variant: 'destructive', title: 'Stok tidak cukup', description: `Sisa stok untuk ${product.name} hanya ${product.stock}.` });
            return prevCart;
        }
        updatedCart = [...prevCart, { ...product, quantity }];
      }
      
      saveCartToLocalStorage(updatedCart);
      toast({ title: 'Ditambahkan', description: `${product.name} masuk ke keranjang.`});
      return updatedCart;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(prevCart => {
      if (quantity === 0) {
        return removeFromCart(productId);
      }
      const updatedCart = prevCart.map(item => {
        if (item.id === productId) {
            if (quantity > item.stock) {
                toast({ variant: 'destructive', title: 'Stok tidak cukup', description: `Sisa stok untuk ${item.name} hanya ${item.stock}.` });
                return item;
            }
            return { ...item, quantity };
        }
        return item;
      });
      saveCartToLocalStorage(updatedCart);
      return updatedCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.id !== productId);
      saveCartToLocalStorage(updatedCart);
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };
  
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  return { cart, addToCart, updateQuantity, removeFromCart, clearCart, totalItems };
};


'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CartItem, Product, ShipmentProduct } from '@/lib/types';
import { useToast } from './use-toast';
import { useAuth } from '@/context/auth-context';

export const useCart = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  
  const CART_STORAGE_KEY = user ? `shipping_cart_${user.id}` : null;

  useEffect(() => {
    if (CART_STORAGE_KEY) {
        try {
          const storedCart = localStorage.getItem(CART_STORAGE_KEY);
          if (storedCart) {
            setCart(JSON.parse(storedCart));
          } else {
            setCart([]); 
          }
        } catch (error) {
            console.error("Gagal mengambil keranjang dari localStorage", error);
            localStorage.removeItem(CART_STORAGE_KEY);
            setCart([]);
        }
    } else {
        setCart([]);
    }
  }, [CART_STORAGE_KEY]);

  const saveCartToLocalStorage = useCallback((updatedCart: CartItem[]) => {
    if (CART_STORAGE_KEY) {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
        } catch (error) {
            console.error("Gagal menyimpan keranjang ke localStorage", error);
        }
    }
  }, [CART_STORAGE_KEY]);

  const addToCart = (products: Product[], quantity: number = 1, silent: boolean = false): CartItem[] | undefined => {
    if (!user) {
        if (!silent) toast({ variant: 'destructive', title: 'Harus Login', description: 'Anda harus login untuk menambah item ke keranjang.' });
        return;
    }
    
    let updatedCart = [...cart];
    let itemsAddedCount = 0;

    products.forEach(product => {
        const existingItem = updatedCart.find(item => item.id === product.id);
        if (!existingItem) {
            updatedCart.push({ ...product, quantity });
            itemsAddedCount++;
        }
    });

    if (itemsAddedCount > 0 && !silent) {
        toast({ title: 'Ditambahkan', description: `${itemsAddedCount} jenis produk masuk ke keranjang.`});
    }

    if (silent) {
      return updatedCart;
    }
    
    setCart(updatedCart);
    saveCartToLocalStorage(updatedCart);
    return;
  };

  const updateQuantity = (productId: string, quantity: number) => {
    let updatedCart: CartItem[] = [];
    setCart(prevCart => {
      const itemToUpdate = prevCart.find(item => item.id === productId);
      if (!itemToUpdate) return prevCart;

      if (quantity <= 0) {
          updatedCart = prevCart.filter(item => item.id !== productId);
      } else if (quantity > itemToUpdate.stock) {
          updatedCart = prevCart.map(item =>
              item.id === productId ? { ...item, quantity: item.stock } : item
          );
           toast({ variant: 'destructive', title: 'Stok tidak cukup', description: `Sisa stok hanya ${itemToUpdate.stock}.` });
      } else {
          updatedCart = prevCart.map(item =>
              item.id === productId ? { ...item, quantity } : item
          );
      }
      
      saveCartToLocalStorage(updatedCart);
      return updatedCart;
    });
  };
  
  const reduceCartQuantities = (shippedProducts: ShipmentProduct[]) => {
    setCart(prevCart => {
        let tempCart = [...prevCart];
        
        shippedProducts.forEach(shippedProduct => {
            const index = tempCart.findIndex(item => item.id === shippedProduct.productId);
            if (index !== -1) {
                // In a selection-based cart, we just remove the item entirely after use.
                tempCart.splice(index, 1);
            }
        });
        
        saveCartToLocalStorage(tempCart);
        return tempCart;
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
    if (CART_STORAGE_KEY) {
        localStorage.removeItem(CART_STORAGE_KEY);
    }
  };
  
  const totalItems = cart.length;

  return { cart, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, reduceCartQuantities, saveCartToLocalStorage };
};

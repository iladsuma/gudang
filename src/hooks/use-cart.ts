
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

  const addToCart = (product: Product, quantity: number = 1) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Harus Login', description: 'Anda harus login untuk menambah item ke keranjang.' });
        return;
    }
    
    let updatedCart;
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
            toast({ variant: 'destructive', title: 'Stok tidak cukup', description: `Sisa stok untuk ${product.name} hanya ${product.stock}.` });
            return;
        }
        updatedCart = cart.map(item =>
            item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
    } else {
        if (quantity > product.stock) {
            toast({ variant: 'destructive', title: 'Stok tidak cukup', description: `Sisa stok untuk ${product.name} hanya ${product.stock}.` });
            return;
        }
        updatedCart = [...cart, { ...product, quantity }];
    }
    
    toast({ title: 'Ditambahkan', description: `${product.name} masuk ke keranjang.`});
    setCart(updatedCart);
    saveCartToLocalStorage(updatedCart);
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
                const newQuantity = tempCart[index].quantity - shippedProduct.quantity;
                if (newQuantity > 0) {
                    tempCart[index] = { ...tempCart[index], quantity: newQuantity };
                } else {
                    tempCart.splice(index, 1); // Remove item if quantity is 0 or less
                }
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
  
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  return { cart, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, reduceCartQuantities };
};

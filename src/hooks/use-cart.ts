
'use client';

import { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import type { CartItem, Product, ShipmentProduct } from '@/lib/types';
import { useToast } from './use-toast';
import { useAuth } from '@/context/auth-context';

interface CartContextType {
    cart: CartItem[];
    addToCart: (products: Product[], quantity?: number, silent?: boolean) => CartItem[] | undefined;
    updateQuantity: (productId: string, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    totalItems: number;
    reduceCartQuantities: (shippedProducts: ShipmentProduct[]) => void;
    saveCartToLocalStorage: (cart: CartItem[]) => void;
}

const CartContext = createContext<CartContextType | null,>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
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

  const addToCart = useCallback((products: Product[], quantity: number = 1, silent: boolean = false): CartItem[] | undefined => {
    if (!user) {
        if (!silent) toast({ variant: 'destructive', title: 'Harus Login', description: 'Anda harus login untuk menambah item ke keranjang.' });
        return;
    }
    
    let updatedCart: CartItem[] = [];
    setCart(prevCart => {
        updatedCart = [...prevCart];
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
    
        if (!silent) {
            saveCartToLocalStorage(updatedCart);
        }
        return updatedCart;
    });

    if (silent) {
      const currentCart = cart; 
      const newCart = [...currentCart];
      products.forEach(product => {
        const existingItem = newCart.find(item => item.id === product.id);
        if(!existingItem) {
          newCart.push({ ...product, quantity });
        }
      });
      return newCart;
    }
    return undefined;
  }, [user, toast, saveCartToLocalStorage, cart]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart(prevCart => {
      const itemToUpdate = prevCart.find(item => item.id === productId);
      if (!itemToUpdate) return prevCart;

      let updatedCart: CartItem[];
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
  }, [toast, saveCartToLocalStorage]);
  
  const reduceCartQuantities = useCallback((shippedProducts: ShipmentProduct[]) => {
    // Do nothing, as per user request to not clear/reduce cart items automatically.
  }, []);


  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.id !== productId);
      saveCartToLocalStorage(updatedCart);
      return updatedCart;
    });
  }, [saveCartToLocalStorage]);

  const clearCart = useCallback(() => {
    setCart([]);
    if (CART_STORAGE_KEY) {
        localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [CART_STORAGE_KEY]);
  
  const totalItems = cart.length;

  const value = useMemo(() => ({
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    reduceCartQuantities,
    saveCartToLocalStorage
  }), [cart, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, reduceCartQuantities, saveCartToLocalStorage]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

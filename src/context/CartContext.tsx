/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  selectedSize?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, size?: string, quantity?: number) => void;
  updateQty: (id: string, selectedSize: string, newQty: number) => void;
  removeFromCart: (id: string, selectedSize: string) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cartItems');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    // Trigger custom event to notify other components instantly
    window.dispatchEvent(new Event('cartUpdated'));
  }, [cartItems]);

  const addToCart = (product: Product, size?: string, quantity = 1) => {
    setCartItems(prev => {
      const selectedSize = size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M');
      const existingIdx = prev.findIndex(
        item => item.id === product.id && item.selectedSize === selectedSize
      );
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].qty += quantity;
        return next;
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.discountPrice || product.price,
        qty: quantity,
        image: product.image,
        selectedSize
      }];
    });
  };

  const updateQty = (id: string, selectedSize: string, newQty: number) => {
    setCartItems(prev => {
      if (newQty <= 0) {
        return prev.filter(item => !(item.id === id && item.selectedSize === selectedSize));
      }
      return prev.map(item => {
        if (item.id === id && item.selectedSize === selectedSize) {
          return { ...item, qty: newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (id: string, selectedSize: string) => {
    setCartItems(prev => prev.filter(item => !(item.id === id && item.selectedSize === selectedSize)));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.qty, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQty, removeFromCart, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    // safe local fallback state so components outside provider won't crash
    const [localCart, setLocalCart] = useState<CartItem[]>(() => {
      const s = localStorage.getItem('cartItems');
      try { return s ? JSON.parse(s) : []; } catch { return []; }
    });
    
    useEffect(() => {
      const handleSync = () => {
        const s = localStorage.getItem('cartItems');
        try { if (s) setLocalCart(JSON.parse(s)); } catch {}
      };
      window.addEventListener('cartUpdated', handleSync);
      return () => window.removeEventListener('cartUpdated', handleSync);
    }, []);

    const addToCart = (product: Product, size?: string, qty = 1) => {
      const selectedSize = size || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M');
      const saved = localStorage.getItem('cartItems');
      let currentItems: CartItem[] = [];
      try { currentItems = saved ? JSON.parse(saved) : []; } catch {}
      
      const existingIdx = currentItems.findIndex(
        item => item.id === product.id && item.selectedSize === selectedSize
      );
      if (existingIdx > -1) {
        currentItems[existingIdx].qty += qty;
      } else {
        currentItems.push({
          id: product.id,
          name: product.name,
          price: product.discountPrice || product.price,
          qty,
          image: product.image,
          selectedSize
        });
      }
      localStorage.setItem('cartItems', JSON.stringify(currentItems));
      window.dispatchEvent(new Event('cartUpdated'));
    };

    const updateQty = (id: string, selectedSize: string, newQty: number) => {
      const saved = localStorage.getItem('cartItems');
      let currentItems: CartItem[] = [];
      try { currentItems = saved ? JSON.parse(saved) : []; } catch {}
      
      let nextItems: CartItem[];
      if (newQty <= 0) {
        nextItems = currentItems.filter(item => !(item.id === id && item.selectedSize === selectedSize));
      } else {
        nextItems = currentItems.map(item => {
          if (item.id === id && item.selectedSize === selectedSize) {
            return { ...item, qty: newQty };
          }
          return item;
        });
      }
      localStorage.setItem('cartItems', JSON.stringify(nextItems));
      window.dispatchEvent(new Event('cartUpdated'));
    };

    const removeFromCart = (id: string, selectedSize: string) => {
      const saved = localStorage.getItem('cartItems');
      let currentItems: CartItem[] = [];
      try { currentItems = saved ? JSON.parse(saved) : []; } catch {}
      const nextItems = currentItems.filter(item => !(item.id === id && item.selectedSize === selectedSize));
      localStorage.setItem('cartItems', JSON.stringify(nextItems));
      window.dispatchEvent(new Event('cartUpdated'));
    };

    const clearCart = () => {
      localStorage.setItem('cartItems', JSON.stringify([]));
      window.dispatchEvent(new Event('cartUpdated'));
    };

    const cartCount = localCart.reduce((total, item) => total + item.qty, 0);
    return {
      cartItems: localCart,
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
      cartCount
    };
  }
  return context;
}

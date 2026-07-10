'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { products } from '@/data/products';

const CART_STORAGE_KEY = 'golden-crumb-cart';

export const MAX_QTY_PER_PRODUCT = 20;

interface CartContextValue {
  quantities: Record<string, number>;
  setQuantity: (productId: string, qty: number) => void;
  addOne: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);

  // Initialise cart from localStorage after hydration.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuantities(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('Failed to read cart from storage:', err);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(quantities));
    } catch (err) {
      console.warn('Failed to persist cart to storage:', err);
    }
  }, [quantities, hydrated]);

  const setQuantity = useCallback((productId: string, qty: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[productId];
      } else {
        next[productId] = Math.min(qty, MAX_QTY_PER_PRODUCT);
      }
      return next;
    });
  }, []);

  const addOne = useCallback((productId: string) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.min((prev[productId] ?? 0) + 1, MAX_QTY_PER_PRODUCT),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setQuantities({});
  }, []);

  const totalItems = useMemo(
    () => Object.values(quantities).reduce((sum, qty) => sum + qty, 0),
    [quantities]
  );

  const totalPrice = useMemo(
    () =>
      products.reduce(
        (sum, product) => sum + product.price * (quantities[product.id] ?? 0),
        0
      ),
    [quantities]
  );

  const value = useMemo<CartContextValue>(
    () => ({ quantities, setQuantity, addOne, clearCart, totalItems, totalPrice }),
    [quantities, setQuantity, addOne, clearCart, totalItems, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

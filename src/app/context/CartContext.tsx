'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface CartContextProps {
  cartCount: number;
  increaseCartCount: () => void;
  decreaseCartCount: () => void;
  setCartCount: (count: number) => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartCount, setCartCount] = useState<number>(0);

  const increaseCartCount = () => setCartCount((prev) => prev + 1);
  const decreaseCartCount = () => setCartCount((prev) => prev - 1);
  
  return (
    <CartContext.Provider value={{ cartCount, increaseCartCount, decreaseCartCount, setCartCount }}>
      {children}
    </CartContext.Provider>
  );
};

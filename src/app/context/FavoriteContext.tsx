'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface FavoriteContextProps {
  favoriteCount: number;
  increaseFavoriteCount: () => void;
  decreaseFavoriteCount: () => void;
  setFavoriteCount: (count: number) => void;
}

const FavoriteContext = createContext<FavoriteContextProps | undefined>(undefined);

export const useFavorite = () => {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error('useFavorite must be used within a FavoriteProvider');
  }
  return context;
};

export const FavoriteProvider = ({ children }: { children: ReactNode }) => {
  const [favoriteCount, setFavoriteCount] = useState<number>(0);

  const increaseFavoriteCount = () => setFavoriteCount((prev) => prev + 1);
  const decreaseFavoriteCount = () => setFavoriteCount((prev) => prev - 1);

  return (
    <FavoriteContext.Provider
      value={{ favoriteCount, increaseFavoriteCount, decreaseFavoriteCount, setFavoriteCount }}
    >
      {children}
    </FavoriteContext.Provider>
  );
};
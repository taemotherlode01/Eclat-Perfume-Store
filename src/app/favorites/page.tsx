'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import AdvertisementPreview from '../components/AdvertisementPreview';
import ProductCard from '../components/ProductCard';
import { Advertisement } from '@prisma/client';
import { useSession } from 'next-auth/react'; // Import useSession for authentication
import { useRouter } from 'next/navigation';
import Loading from '../components/Loading';

const Favorites: React.FC = () => {
  const { data: session, status } = useSession(); // Session hook from NextAuth
  const router = useRouter(); // Router hook for redirection
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);

  // Fetch favorite products
  const fetchFavoriteProducts = async (): Promise<void> => {
    try {
      const response = await fetch('/api/favorites/products'); // API for fetching favorite products
      if (!response.ok) {
        throw new Error('Failed to fetch favorite products');
      }
      const data = await response.json();

      // Ensure the 'images' field is an array by splitting the 'image' field
      const productsWithImages = data.map((product: any) => ({
        ...product,
        images: product.image ? product.image.split(',') : [], // Split the image string into an array
      }));

      setFavoriteProducts(productsWithImages);
    } catch (error) {
      console.error('Failed to fetch favorite products:', error);
      setError('Unable to fetch favorite products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch advertisements (optional)
  const fetchAds = async (): Promise<void> => {
    try {
      const response = await fetch('/api/advertisements');
      const data = await response.json();
      setAds(data);
    } catch (error) {
      console.error('Failed to fetch advertisements:', error);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch data if authenticated
      fetchFavoriteProducts();
      fetchAds();
    } else if (status === 'unauthenticated') {
      // Redirect to login page if unauthenticated
      router.push('/signin');
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return <Loading />; // Show loading state
  }

  if (error) {
    return <div>{error}</div>; // Show error message
  }

  return (
    <div>
      <Navbar />
      <AdvertisementPreview ads={ads} />
      <h1 className="text-2xl font-bold text-center mt-8">รายการโปรด</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 p-16">
        {favoriteProducts.length > 0 ? (
          favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} /> // Display favorite products
          ))
        ) : (
          <p>No favorite products found.</p> // Show message if no favorites
        )}
      </div>
    </div>
  );
};

export default Favorites;

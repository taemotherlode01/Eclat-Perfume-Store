'use client';
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const SearchResults: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/products?searchQuery=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Unable to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="pt-16">
        <div className="text-center mb-4">
          <h1 className="text-xl font-semibold">ผลการค้นหาสินค้า: {searchQuery}</h1>
        </div>
        <div className="p-4 flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
            {loading ? (
              <p className="text-center">Loading products...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="text-center">No products found.</p>
            )}
          </div>
          
        </div>
        <div className="flex justify-center mt-6">
  <Link href="/products" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-700 transform transition-transform duration-300 hover:scale-105">
    ดูสินค้าทั้งหมด
  </Link>
</div>
      </main>
    </div>
  );
};

export default SearchResults;

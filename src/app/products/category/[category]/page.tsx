"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import ProductCard from '../../../components/ProductCard';
import { Inventory } from "@prisma/client";
import Footer from '@/app/components/Footer';

const CategoryProducts: React.FC = () => {
  const { category } = useParams();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const productsPerPage = 8;

  // Price filter state
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number | null>(100000);

  // Fetch products from the API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();

        // Fetch inventories to get prices
        const productsWithPrices = await Promise.all(
          data.map(async (product: any) => {
            const response = await fetch(`/api/inventories?productId=${product.id}`);
            const inventories: Inventory[] = await response.json();
            const prices = inventories.map((inv) => Number(inv.price));
            const lowestPrice = Math.min(...prices);
            return { ...product, lowestPrice };
          })
        );

        setProducts(productsWithPrices);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on category and price
  useEffect(() => {
    if (category && products.length > 0) {
      const filtered = products.filter(product => {
        if (category === 'new') {
          return product.isNew;
        }

        const productGender = Array.isArray(product.gender) ? product.gender[0] : product.gender;
        const matchesCategory = typeof category === 'string' && typeof productGender === 'string'
          ? productGender.toLowerCase() === category.toLowerCase()
          : false;

        // Price filter
        const matchesPrice =
          product.lowestPrice !== null &&
          (minPrice === 0 || product.lowestPrice >= minPrice) &&
          (maxPrice === null || product.lowestPrice <= maxPrice);

        return matchesCategory && matchesPrice;
      });
      setFilteredProducts(filtered);
    }
  }, [category, products, minPrice, maxPrice]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Price Range
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className='mt-6'> {/* แสดงข้อความสำหรับหมวดหมู่ */}
          <h2 className="text-3xl font-extrabold text-gray-800 mb-4 text-center">
            {category === 'male' ? 'สำหรับ ผู้ชาย' : 
             category === 'female' ? 'สำหรับ ผู้หญิง' : 
             category === 'unisex' ? 'สำหรับ Unisex' : 
             category === 'new' ? 'สินค้าใหม่' : 
             'สินค้า'}
          </h2></div>
      <div className="flex flex-1 p-6 flex-col lg:flex-row">
        {/* Price Range Filter */}
        <div className="w-full lg:w-1/4 bg-white">
          <div className='border border-black p-4'>
            <h3 className="font-bold mb-2">ช่วงราคา</h3>
            <div className="mb-4">
              <label className="block mb-2">ราคาต่ำสุด: {minPrice}</label>
              <input
                type="range"
                min="0"
                max={maxPrice || 1000}
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="w-full h-2 rounded-lg cursor-pointer"
                style={{
                  background: `linear-gradient(to right, black 0%, black ${(minPrice / (maxPrice || 1000)) * 100}%, gray ${(minPrice / (maxPrice || 1000)) * 100}%, gray 100%)`,
                  accentColor: "black",
                }}
              />
            </div>

            <div>
              <label className="block mb-2">ราคาสูงสุด: {maxPrice !== null ? maxPrice : ''}</label>
              <input
                type="range"
                min={minPrice}
                max="100000"
                value={maxPrice !== null ? maxPrice : 1000}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-2 rounded-lg cursor-pointer"
                style={{
                  background: `linear-gradient(to right, black 0%, black ${((maxPrice !== null ? maxPrice : 1000) / 100000) * 100}%, gray ${((maxPrice !== null ? maxPrice : 1000) / 100000) * 100}%, gray 100%)`,
                  accentColor: "black",
                }}
              />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex flex-col items-center w-full lg:w-3/4 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
            {loading ? (
              <p className="text-center">Loading products...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : currentProducts.length > 0 ? (
              currentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="text-center">No products found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center mt-4 mb-12">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`mx-1 px-4 py-2 border rounded ${currentPage === number ? "bg-black text-white" : "bg-gray-200"}`}
          >
            {number}
          </button>
        ))}
      </div>
      <Footer />
    </div>
  );
};

export default CategoryProducts;

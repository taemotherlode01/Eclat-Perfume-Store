"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import Navbar from "./components/Navbar";
import HeroImageSlider from "./components/HeroImageSlider";
import { Advertisement, HeroImage } from "@prisma/client";
import AdvertisementPreview from "./components/AdvertisementPreview";
import ProductCard from "./components/ProductCard";
import Link from "next/link";
import DiscountCode from "./components/DiscountCode"; // Import the DiscountCode component
import Footer from "./components/Footer";

export default function Home() {
  const router = useRouter(); 
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]); 
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Fetch hero images
  const fetchHeroImages = async (): Promise<void> => {
    try {
      const response = await fetch("/api/hero-images"); 
      if (!response.ok) {
        throw new Error("Failed to fetch hero images.");
      }
      const data = await response.json();
      setHeroImages(data);
    } catch (error) {
      console.error("Failed to fetch hero images:", error);
      setError("Failed to load hero images.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async (): Promise<void> => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();

      const productsWithImages = data.map((product: any) => ({
        ...product,
        images: product.image ? product.image.split(",") : [],
      }));

      setProducts(productsWithImages);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch advertisements
  const fetchAds = async (): Promise<void> => {
    try {
      const response = await fetch("/api/advertisements");
      const data = await response.json();
      setAds(data);
    } catch (error) {
      console.error("Failed to fetch advertisements:", error);
    }
  };

  // useEffect to trigger fetching of data
  useEffect(() => {
    fetchHeroImages();
    fetchProducts();
    fetchAds();
  }, []);

  return (
    <div>
      <Navbar />
      <AdvertisementPreview ads={ads} />
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className="w-full overflow-hidden">
          <HeroImageSlider heroImages={heroImages} />
        </div>
      )}

      <span className="text-3xl font-bold text-gray-800 mt-10 block text-center">
        สินค้าของเรา
      </span>

      {loading ? (
        <div className="flex justify-center items-center mt-10">
          <p className="text-lg text-gray-600">Loading products...</p>
        </div>
      ) : (
        <div className="container mx-auto px-4 mb-16">
          {products.length > 0 ? (
            <>
              <div className="flex justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mt-6">
                  {products.slice(0, 5).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <Link
                  href="/products"
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-700 transform transition-transform duration-300 hover:scale-105"
                >
                  ดูสินค้าทั้งหมด
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center mt-10">
              <p className="text-lg text-gray-600">No products available at the moment.</p>
            </div>
          )}
        </div>
      )}

      {/* Use the DiscountCode component to display discount codes */}
      <DiscountCode />

      <Footer />
    </div>
  );
}

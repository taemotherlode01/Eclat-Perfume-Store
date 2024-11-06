'use client';
import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useFavorite } from '../context/FavoriteContext';
import { useSearch } from '../context/SearchContext';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import debounce from 'lodash.debounce';

interface Suggestion {
  id: string;
  title: string;
}

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const { favoriteCount, setFavoriteCount } = useFavorite();
  const { cartCount, setCartCount } = useCart(); // เพิ่ม setCartCount
  const { searchTerm, setSearchTerm } = useSearch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();

  // Fetch จำนวนสินค้าที่ถูกใจ
  useEffect(() => {
    const fetchFavoriteCount = async () => {
      if (session && session.user) {
        try {
          const response = await fetch('/api/favorites/count');
          const data = await response.json();
          if (response.ok) {
            setFavoriteCount(data.favoriteCount);
          } else {
            console.error('Failed to fetch favorite count:', data.message);
          }
        } catch (error) {
          console.error('Error fetching favorite count:', error);
        }
      }
    };

    fetchFavoriteCount();
  }, [session, setFavoriteCount]);

  // Fetch จำนวนสินค้าที่อยู่ในตะกร้า
  const fetchCartCount = async () => {
    if (session && session.user) {
      try {
        const response = await fetch('/api/cart/count');
        const data = await response.json();
        if (response.ok) {
          setCartCount(data.count);
        } else {
          console.error('Failed to fetch cart count:', data.message);
        }
      } catch (error) {
        console.error('Error fetching cart count:', error);
      }
    }
  };

  // เรียก fetchCartCount ทุกครั้งที่ session เปลี่ยนแปลง
  useEffect(() => {
    fetchCartCount();
  }, [session]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      router.push(`/search-results?search=${encodeURIComponent(searchTerm.trim())}`);
      setShowSuggestions(false);
    }
  };

  const fetchSuggestions = async (term: string) => {
    if (term.trim()) {
      try {
        const response = await fetch(`/api/products/suggestions?query=${encodeURIComponent(term.toLowerCase())}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const debouncedFetchSuggestions = debounce((term) => {
    fetchSuggestions(term);
  }, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    debouncedFetchSuggestions(e.target.value);
    setShowSuggestions(true);
  };

  return (
    <>
      <nav className="bg-white fixed top-0 left-0 w-full z-50 h-16">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <div className="h-10">
                <Link href="/" passHref>
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="h-full w-auto object-contain cursor-pointer"
                  />
                </Link>
              </div>
              <div className="hidden md:flex space-x-4">
                <Link href="/products/category/male">ผู้ชาย</Link>
                <Link href="/products/category/female">ผู้หญิง</Link>
                <Link href="/products/category/unisex">Unisex</Link>
                <Link href="/products/category/new">ใหม่</Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative hidden md:flex items-center border border-gray-300 px-3 py-2">
                <Icon icon="eva:search-outline" className="w-6 h-6 mr-2" />
                <input
                  type="text"
                  placeholder="ค้นหาสินค้าECLAT"
                  className="outline-none text-xs placeholder:text-xs"
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute left-0 top-full bg-white border border-gray-300 w-full max-h-40 overflow-y-auto shadow-lg z-10">
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSearchTerm(suggestion.title);
                          router.push(`/search-results?search=${encodeURIComponent(suggestion.title)}`);
                          setShowSuggestions(false);
                        }}
                      >
                        {suggestion.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {status === 'loading' ? (
                  <div>Loading...</div>
                ) : session ? (
                  <Link href="/favorites" className="relative">
                    <Icon icon="ph:heart-bold" className="w-6 h-6 cursor-pointer" />
                    {favoriteCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {favoriteCount}
                      </span>
                    )}
                  </Link>
                ) : (
                  <Link href="/signin">
                    <Icon icon="ph:heart-bold" className="w-6 h-6 cursor-pointer" />
                  </Link>
                )}

                <Link href="/cart" className="relative">
                  <Icon icon="akar-icons:shopping-bag" className="w-6 h-6 cursor-pointer" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {status === 'loading' ? (
                  <div>Loading...</div>
                ) : session ? (
                  <Link href="/userInfo">
                    <Icon icon="akar-icons:person" className="w-6 h-6 cursor-pointer" />
                  </Link>
                ) : (
                  <Link href="/signin">
                    <Icon icon="akar-icons:person" className="w-6 h-6 cursor-pointer" />
                  </Link>
                )}

                <div className="md:hidden">
                  <Icon
                    icon="rivet-icons:menu"
                    className="w-6 h-6 cursor-pointer"
                    onClick={() => setIsSidebarOpen(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 bg-gray-800 bg-opacity-50 z-40 ${isSidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <div
        className={`fixed top-0 right-0 w-64 h-full bg-white shadow-lg z-50 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">เมนู</h2>
          <Icon
            icon="ic:round-close"
            className="w-6 h-6 cursor-pointer"
            onClick={() => setIsSidebarOpen(false)}
          />
        </div>

        <div className="p-4">
  <div className="flex flex-col space-y-4">
    <Link href="/products/category/male">ผู้ชาย</Link>
    <Link href="/products/category/female">ผู้หญิง</Link>
    <Link href="/products/category/unisex">Unisex</Link>
    <Link href="/products/category/new">ใหม่</Link>
  </div>
</div>

        <div className="p-4 border-t">
          <div className="relative flex items-center border border-gray-300 px-3 py-2">
            <Icon icon="eva:search-outline" className="w-6 h-6 mr-2" />
            <input
              type="text"
              placeholder="ค้นหาสินค้าECLAT"
              className="outline-none text-xs placeholder:text-xs w-full"
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute left-0 top-full bg-white border border-gray-300 w-full max-h-40 overflow-y-auto shadow-lg z-10">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setSearchTerm(suggestion.title);
                      router.push(`/search-results?search=${encodeURIComponent(suggestion.title)}`);
                      setShowSuggestions(false);
                      setIsSidebarOpen(false);
                    }}
                  >
                    {suggestion.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <main className="pt-16">{/* Other components go here */}</main>
    </>
  );
};

export default Navbar;

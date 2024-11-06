import { useEffect, useState } from 'react';
import { CldImage } from "next-cloudinary";
import { Icon } from "@iconify/react";
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useFavorite } from '../context/FavoriteContext';

interface ProductCardProps {
  product: {
    id: number;
    title: string;
    images: string[];
    isNew: boolean;
  };
}

interface Inventory {
  price: number;
  stock: number; // Track stock availability
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { data: session, status } = useSession();
  const { increaseFavoriteCount, decreaseFavoriteCount } = useFavorite();
  const [lowestPrice, setLowestPrice] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isOutOfStock, setIsOutOfStock] = useState<boolean>(false); // Track out-of-stock status

  useEffect(() => {
    const fetchLowestPrice = async () => {
      try {
        const response = await fetch(`/api/inventories?productId=${product.id}`);
        const inventories: Inventory[] = await response.json();

        if (inventories.every((inv) => inv.stock === 0)) {
          setIsOutOfStock(true);
        } else {
          const prices = inventories.filter((inv) => inv.stock > 0).map((inv) => inv.price);
          const minPrice = Math.min(...prices);
          setLowestPrice(minPrice);
          setIsOutOfStock(false);
        }
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      }
    };

    const checkFavoriteStatus = async () => {
      if (status === 'authenticated') {
        try {
          const userId = (session?.user as { id: string }).id;
          const response = await fetch(`/api/favorites/check?productId=${product.id}&userId=${userId}`);
          const { isFavorite } = await response.json();
          setIsFavorited(isFavorite);
        } catch (error) {
          console.error('Failed to fetch favorite status:', error);
        }
      }
    };

    fetchLowestPrice();
    checkFavoriteStatus();
  }, [product.id, session, status]);

  const handleFavoriteClick = async () => {
    if (status === 'unauthenticated') {
      window.location.href = '/signin';
    } else {
      try {
        const userId = (session?.user as { id: string }).id;

        if (isFavorited) {
          const response = await fetch('/api/favorites', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: product.id,
              userId,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to remove from favorites');
          }

          setIsFavorited(false);
          decreaseFavoriteCount();
        } else {
          const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: product.id,
              userId,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to add to favorites');
          }

          setIsFavorited(true);
          increaseFavoriteCount();
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    }
  };

  return (
    <Link href={`/products/${product.id}`} passHref>
      <div
        className="border rounded-lg p-4 max-w-xs flex flex-col cursor-pointer relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ width: '250px', height: '350px' }}
      >
        {product.isNew && (
          <div className="absolute top-0 left-0 bg-lime-400 text-black text-xs font-bold px-2 py-1 z-10">
            NEW
          </div>
        )}

        <div className="relative h-64 w-full mb-4">
          {product.images && product.images.length > 0 ? (
            <div className="relative h-full w-full">
              <CldImage
                src={product.images[0]}
                alt={product.title}
                width={300}
                height={300}
                className={`object-cover rounded-lg transition-opacity duration-500 ease-in-out ${isHovered ? 'opacity-0' : 'opacity-100'} absolute top-0 left-0 w-full h-full`}
              />
              {product.images.length > 1 && (
                <CldImage
                  src={product.images[1]}
                  alt={product.title}
                  width={300}
                  height={300}
                  className={`object-cover rounded-lg transition-opacity duration-500 ease-in-out ${isHovered ? 'opacity-100' : 'opacity-0'} absolute top-0 left-0 w-full h-full`}
                />
              )}
            </div>
          ) : (
            <div className="bg-gray-200 h-full rounded-lg flex items-center justify-center">
              No Image
            </div>
          )}

          <button
            className="absolute top-2 right-2 text-red-500 z-20"
            onClick={(e) => {
              e.preventDefault();
              handleFavoriteClick();
            }}
          >
            <Icon
              icon={isFavorited ? "mdi:heart" : "mdi:heart-outline"}
              width={30}
              height={30}
            />
          </button>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="mt-auto">
          <h3 className="text-lg font-semibold">{product.title}</h3>
          {!isOutOfStock && lowestPrice !== null ? (
            <p className="text-lg font-bold text-black">฿{lowestPrice}</p>
          ) : (
            !isOutOfStock && <p className="text-gray-500">Loading price...</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

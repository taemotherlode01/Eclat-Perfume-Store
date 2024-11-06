'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Loading from '@/app/components/Loading';
import Navbar from '@/app/components/Navbar';
import { Icon } from "@iconify/react";
import { useSession } from 'next-auth/react';
import { useFavorite } from '../../context/FavoriteContext';
import { useCart } from '../../context/CartContext'; // นำเข้า useCart

interface Inventory {
  id: number;
  size: number;
  price: number;
  stock: number;
}

interface Product {
  id: number;
  title: string;
  description: string;
  howToUse: string;
  image: string[];
  fragranceFamily: {
    id: number;
    name: string;
  };
  formula: {
    id: number;
    name: string;
  };
  ingredient: {
    id: number;
    name: string;
  };
  productType: {
    id: number;
    name: string;
  };
  gender: string;
  isNew: boolean;
}

const ProductDetail = () => {
  const router = useRouter();
  const { id } = useParams();
  const { data: session, status } = useSession();
  const { increaseFavoriteCount, decreaseFavoriteCount } = useFavorite();
  const { increaseCartCount } = useCart(); // ใช้ useCart เพื่อเพิ่มจำนวนสินค้าในตะกร้า

  const [product, setProduct] = useState<Product | null>(null);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch product details from the API
  useEffect(() => {
    const fetchProductAndInventories = async () => {
      try {
        const productRes = await fetch(`/api/products/${id}`);
        if (!productRes.ok) {
          throw new Error('Failed to fetch product data');
        }
        const productData = await productRes.json();

        const imagesArray: string[] = productData.image.split(',');
        setProduct({
          ...productData,
          image: imagesArray,
        });

        setSelectedImage(imagesArray[0]); // Set the initial main image

        const inventoryRes = await fetch(`/api/inventories?productId=${id}`);
        if (!inventoryRes.ok) {
          throw new Error('Failed to fetch inventory data');
        }
        const inventoryData = await inventoryRes.json();
        setInventories(inventoryData);

        if (inventoryData.length > 0) {
          setSelectedInventory(inventoryData[0]);
        }

        // Check favorite status
        if (status === 'authenticated') {
          const userId = (session?.user as { id: string }).id;
          const response = await fetch(`/api/favorites/check?productId=${id}&userId=${userId}`);
          const { isFavorite } = await response.json();
          setIsFavorited(isFavorite);
        }

        setLoading(false);
      } catch (error) {
        setError('Error fetching product or inventory data');
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    if (id) {
      fetchProductAndInventories();
    }
  }, [id, session, status]);

  // Handle changing the selected size
  const handleSizeChange = (inventoryId: number) => {
    const selected = inventories.find((inv) => inv.id === inventoryId);
    setSelectedInventory(selected || null);
  };

  // Handle changing the main image
  const handleImageChange = (image: string) => {
    setSelectedImage(image);
  };

// Handle adding product to cart
const handleAddToCart = async () => {
  if (status === 'unauthenticated') {
    router.push('/signin');
    return;
  }

  try {
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: product?.id,
        inventoryId: selectedInventory?.id, // ส่ง inventoryId เพื่อระบุไซส์และสต็อก
      }),
    });

    const result = await response.json();
    if (response.ok) {
      setMessage('เพิ่มสินค้าในตะกร้าสำเร็จ');

      if (result.newItem) {
        increaseCartCount(); // เพิ่มจำนวนสินค้าในตะกร้าเฉพาะเมื่อเป็นสินค้าใหม่
      }
    } else {
      setMessage(result.message || 'เกิดข้อผิดพลาด');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    setMessage('เกิดข้อผิดพลาดขณะเพิ่มสินค้าในตะกร้า');
  }
};

  // Handle favorite click
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
              productId: product?.id,
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
              productId: product?.id,
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

  // Show loading state while data is being fetched
  if (loading) return <Loading />;

  // Show error message if there's an issue with data fetching
  if (error) return <div>{error}</div>;

  // Return null if product or selectedInventory isn't available (shouldn't happen after loading)
  if (!product || !selectedInventory) return <div>Product not found or no available inventory</div>;

  // Check if the product is out of stock
  const isOutOfStock = selectedInventory.stock === 0;

  // Convert gender to Thai language (except for unisex)
  const genderDisplay = product.gender === 'unisex' ? 'Unisex' : product.gender === 'male' ? 'ชาย' : 'หญิง';

  return (
    <div>
      <Navbar />

      {/* ปุ่มย้อนกลับ */}
      <div className="max-w-6xl mx-auto p-6">
        <button
          className="text-gray-500 hover:text-black mb-4 flex items-center"
          onClick={() => router.back()}
        >
          <Icon icon="cuida:arrow-left-outline" />
          <span className="ml-2">ย้อนกลับ</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image and Thumbnails */}
        <div>
          {/* Main Image */}
          <img src={selectedImage || '/path/to/placeholder.jpg'} alt={product.title} className="w-full h-auto" />
          <div className="flex space-x-2 mt-4">
            {/* Image Thumbnails */}
            {product.image.map((img: string, index: number) => (
              <img
                key={index}
                src={img}
                alt={`Thumbnail ${index}`}
                className={`w-20 h-20 border rounded hover:border-black cursor-pointer ${selectedImage === img ? 'border-black' : ''}`}
                onClick={() => handleImageChange(img)}
              />
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div>
          <div className="flex justify-between items-center">
            <div className="relative">
              {product.isNew && (
                <div className="absolute top-0 -translate-y-7 bg-lime-400 text-black text-xs font-bold px-2 py-1">
                  NEW
                </div>
              )}
              <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
            </div>
            {/* Add Favorite Heart Icon */}
            <button className="text-red-500" onClick={handleFavoriteClick}>
              <Icon
                icon={isFavorited ? "mdi:heart" : "mdi:heart-outline"}
                width={30}
                height={30}
              />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">{product.fragranceFamily?.name || 'No fragrance family provided'}</p>
          <p className="text-3xl font-semibold text-black mb-4">฿{selectedInventory.price}</p>

          {/* Size Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">ไซส์</label>
            <select
              value={selectedInventory.id}
              onChange={(e) => handleSizeChange(parseInt(e.target.value))}
              className="border p-2"
            >
              {inventories.map((inventory) => (
                <option key={inventory.id} value={inventory.id}>
                  {inventory.size}ml
                </option>
              ))}
            </select>
          </div>

          {/* Stock Information */}
          <p className={`text-sm mb-6 ${isOutOfStock ? 'text-red-500' : ''}`}>
            {isOutOfStock ? "สินค้าหมด" : `คงเหลือ: ${selectedInventory.stock}`}
          </p>

          {/* Add to Cart Button */}
          <button
            className={`bg-black text-white py-3 px-6 w-full mb-6 hover:bg-gray-800 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            เพิ่มลงตะกร้า
          </button>

          {/* Product Description */}
          <div className="border-t border-gray-200 py-4">
            <details className="mb-4 group">
              <summary className="font-medium cursor-pointer flex justify-between items-center">
                <span>รายละเอียด</span>
                <Icon
                  icon="mdi:plus"
                  className="ml-2 transition-transform duration-300 group-open:rotate-45"
                  width={20}
                  height={20}
                />
              </summary>
              <p className="mt-2 text-gray-600 transition-opacity duration-300 ease-in-out opacity-0 group-open:opacity-100" dangerouslySetInnerHTML={{ __html: product.description }} />
            </details>

            {/* How To Use */}
            <details className="group">
              <summary className="font-medium cursor-pointer flex justify-between items-center">
                <span>วิธีใช้</span>
                <Icon
                  icon="mdi:plus"
                  className="ml-2 transition-transform duration-300 group-open:rotate-45"
                  width={20}
                  height={20}
                />
              </summary>
              <p className="mt-2 text-gray-600 transition-opacity duration-300 ease-in-out opacity-0 group-open:opacity-100" dangerouslySetInnerHTML={{ __html: product.howToUse }} />
            </details>
          </div>

          {/* Additional Info */}
          <div className="border-t border-gray-200 py-4">
            <p>ประเภทผลิตภัณฑ์: {product.productType?.name}</p>
            <p>สูตร: {product.formula?.name}</p>
            <p>ส่วนผสม: {product.ingredient?.name}</p>
            <p>เพศ: {genderDisplay}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

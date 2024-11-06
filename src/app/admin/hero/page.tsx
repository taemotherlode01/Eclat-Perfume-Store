'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Swal from 'sweetalert2';
import Layout from '@/app/components/admin/Layout';
import Loading from '@/app/components/Loading';
import { CldUploadWidget, CldImage } from 'next-cloudinary';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import { Icon } from "@iconify/react";
import HeroImageSlider from '@/app/components/HeroImageSlider';

interface Product {
  id: number;
  title: string;
}

interface HeroImage {
  id: number;
  imageUrl: string;
  label: string;
  buttonText: string;
  buttonLink: string;
  productId?: number;
}

const HeroImageManagement: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [newHeroImage, setNewHeroImage] = useState<Partial<HeroImage>>({});
  const [editHeroImageId, setEditHeroImageId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false); // State for saving

  const fetchHeroImages = async (): Promise<void> => {
    try {
      const response = await fetch('/api/hero-images');
      const data = await response.json();
      setHeroImages(data);
    } catch (error) {
      console.error('Failed to fetch hero images:', error);
      setError('Failed to load hero images.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (): Promise<void> => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setError('Failed to load products. Please try again later.');
    }
  };

  const handleAddOrUpdateHeroImage = async (): Promise<void> => {
    const method = editHeroImageId ? 'PUT' : 'POST';
    const url = '/api/hero-images';

    const { productId, imageUrl, label, buttonText } = newHeroImage;

    if (!imageUrl || !label || !buttonText || !productId) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Required Fields',
        text: 'Please fill out all required fields, including selecting a product.',
      });
      return;
    }

    const buttonLink = `/products/${productId}`;
    const body = JSON.stringify(
      editHeroImageId
        ? { ...newHeroImage, buttonLink, id: editHeroImageId }
        : { ...newHeroImage, buttonLink }
    );

    setSaving(true); // Start saving
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (response.ok) {
        fetchHeroImages();
        setNewHeroImage({});
        setEditHeroImageId(null);
      } else {
        console.error('Failed to save hero image.');
        Swal.fire('Error', 'Failed to save hero image.', 'error');
      }
    } catch (error) {
      console.error('Error while saving hero image:', error);
      Swal.fire('Error', 'Error while saving hero image.', 'error');
    } finally {
      setSaving(false); // End saving
    }
  };

  const handleDeleteHeroImage = async (id: number): Promise<void> => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this hero image?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch('/api/hero-images', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });

          if (response.ok) {
            fetchHeroImages();
            Swal.fire('Deleted!', 'The hero image has been deleted.', 'success');
          } else {
            console.error('Failed to delete hero image.');
          }
        } catch (error) {
          console.error('Error while deleting hero image:', error);
        }
      }
    });
  };

  const handleUploadSuccess = (result: any) => {
    setNewHeroImage((prevHeroImage) => ({
      ...prevHeroImage,
      imageUrl: result.info.secure_url,
    }));
  };

  useEffect(() => {
    if (status === "authenticated") {
      // Check if session and user role are ready and valid
      if (session && (session?.user as any)?.role) {
        if ((session.user as any).role === "ADMIN") {
          // User is authenticated and is an admin, stop loading
          setLoading(false);
          fetchHeroImages();
          fetchProducts();
        } else {
          // User is authenticated but not admin, redirect
          router.push("/");
        }
      }
    } else if (status === "unauthenticated") {
      // If unauthenticated, redirect to signup
      router.push("/");
    }
  }, [status, session, router]);

  // Handle loading state separately using Loading component
  if (loading) {
    return <Loading />;
  }

  // Function to cancel the editing mode
  const handleCancelEdit = () => {
    setEditHeroImageId(null); // Reset edit mode
    setNewHeroImage({}); // Clear the newHeroImage state
  };

  if (status === "authenticated" && (session?.user as any)?.role === "ADMIN") {
    return (
      <Layout>
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Hero Image Management</h1>
          {error && <p className="text-red-500">{error}</p>}

          <div className="mt-6">
            <form className="space-y-4">
              <CldUploadWidget onSuccess={handleUploadSuccess} uploadPreset="mpexriwx">
                {({ open }) => {
                  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
                    event.stopPropagation();
                    open();
                  };

                  return (
                    <div
                      onClick={handleClick}
                      className="relative border-dashed border-2 border-gray-300 flex items-center justify-center p-6 rounded-md cursor-pointer w-full h-80"
                    >
                      {newHeroImage.imageUrl ? (
                        <CldImage
                          src={newHeroImage.imageUrl}
                          alt="Uploaded Image"
                          fill
                          style={{ objectFit: 'cover' }}
                          className="rounded"
                        />
                      ) : (
                        <div className='flex flex-col items-center justify-center'>
                        <Icon icon="solar:upload-linear" width={40} height={40} />
                        <p className="text-gray-500 mt-4">Upload a Hero Image</p>
                      </div>
                      )}
                    </div>
                  );
                }}
              </CldUploadWidget>

              <div>
                <label className="block mb-1 font-semibold">Label</label>
                <input
                  type="text"
                  placeholder="Enter label"
                  value={newHeroImage.label || ''}
                  onChange={(e) => setNewHeroImage({ ...newHeroImage, label: e.target.value })}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">Sub Label</label>
                <input
                  type="text"
                  placeholder="Enter sub label"
                  value={newHeroImage.buttonText || ''}
                  onChange={(e) => setNewHeroImage({ ...newHeroImage, buttonText: e.target.value })}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Select Product</label>
                <Select
                  options={products.map((product) => ({
                    value: product.id,
                    label: product.title,
                  }))}
                  value={
                    newHeroImage.productId
                      ? {
                        value: newHeroImage.productId,
                        label: products.find((p) => p.id === newHeroImage.productId)?.title,
                      }
                      : null
                  }
                  onChange={(selectedOption) =>
                    setNewHeroImage({ ...newHeroImage, productId: selectedOption?.value })
                  }
                  placeholder="Select Product"
                  isClearable
                  isSearchable
                  className="react-select-container"
                />
              </div>

              <div className="flex space-x-2">
  <button
    type="button"
    onClick={handleAddOrUpdateHeroImage}
    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all duration-300 w-full sm:w-auto"
    disabled={saving} // Disable button while saving
  >
    {editHeroImageId ? 'Update' : 'Add'} Hero Image
  </button>

  {editHeroImageId && ( // Show Cancel button only when in edit mode
    <button
      type="button"
      onClick={handleCancelEdit}
      className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition-all duration-300 w-full sm:w-auto"
    >
      Cancel
    </button>
  )}
</div>
            </form>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {heroImages.map((image) => (
              <div key={image.id} className="border rounded shadow p-4 flex flex-col items-center">
                <CldImage
                  src={image.imageUrl}
                  alt={image.label}
                  width={300}
                  height={200}
                  className="w-full h-32 object-cover rounded"
                />
                <h2 className="text-lg font-semibold mt-2">{image.label}</h2>
                <div className="mt-2 flex justify-center gap-2 w-full">
                  <button
                    onClick={() => {
                      setEditHeroImageId(image.id);
                      setNewHeroImage(image);
                    }}
                    className="p-2 text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <Icon icon="mdi:pencil" width={24} height={24} />
                  </button>
                  <button
                    onClick={() => handleDeleteHeroImage(image.id)}
                    className="p-2 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                  >
                    <Icon icon="mdi:trash-can" width={24} height={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <h2 className='mt-6 text-2xl md:text-3xl lg:text-4xl font-bold'>Preview</h2>

          <HeroImageSlider heroImages={heroImages} />
        </div>
      </Layout>
    );
  }
};

export default HeroImageManagement;

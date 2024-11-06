'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/app/components/admin/Layout';
import { useSession } from 'next-auth/react';
import Loading from '@/app/components/Loading';
import Swal from 'sweetalert2';
import { CldImage, CldUploadWidget } from 'next-cloudinary';
import { Gender } from '@prisma/client';
import { Icon } from '@iconify/react';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});
import "react-quill-new/dist/quill.snow.css";

interface Inventory {
  id: number;
  size: number;
  price: number;
  stock: number;
}

interface Product {
  title: string;
  description: string;
  howToUse: string;
  gender: Gender;
  fragranceFamilyId: number;
  productTypeId: number;
  formulaId: number;
  ingredientId: number;
  images: string[];
  isNew: boolean;
}

const EditProduct = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');

  const [product, setProduct] = useState<Product | null>(null); // Store product details
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [newInventory, setNewInventory] = useState<Inventory>({ id: 0, size: 0, price: 100, stock: 0 }); // Set default price to 100
  const [fragranceFamilies, setFragranceFamilies] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [formulas, setFormulas] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editInventory, setEditInventory] = useState<Inventory | null>(null); // Store the inventory item being edited
  const [showInventoryModal, setShowInventoryModal] = useState(false); // Control modal visibility

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      // Update product state
      setProduct(data);

      // Fetch inventories related to this product
      const inventoriesResponse = await fetch(`/api/inventories?productId=${productId}`);
      const inventoriesData = await inventoriesResponse.json();

      setInventories(inventoriesData); // Set inventories for the product
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    } finally {
      setLoading(false); // Stop loading regardless of success or failure
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [fragranceFamilyResponse, productTypeResponse, formulaResponse, ingredientResponse] = await Promise.all([
        fetch('/api/fragrance-families'),
        fetch('/api/product-types'),
        fetch('/api/formulas'),
        fetch('/api/ingredients'),
      ]);
      setFragranceFamilies(await fragranceFamilyResponse.json());
      setProductTypes(await productTypeResponse.json());
      setFormulas(await formulaResponse.json());
      setIngredients(await ingredientResponse.json());
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  };

  const handleUpdateProduct = async () => {
    if (
      !product?.title ||
      !product?.description ||
      !product?.howToUse ||
      !product?.gender ||
      !product?.fragranceFamilyId ||
      !product?.productTypeId ||
      !product?.formulaId ||
      !product?.ingredientId ||
      product.images.length === 0
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Incomplete Data',
        text: 'Please fill in all required fields and upload at least one image.',
      });
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, inventories }), // Include inventories in the request body
      });

      if (response.ok) {
        await response.json();
        router.push('/admin/products');
        Swal.fire('Success', 'Product updated successfully', 'success');
      } else {
        console.error('Failed to update product:', await response.json());
      }
    } catch (error) {
      console.error('Error while updating product:', error);
    }
  };

  const handleUploadSuccess = (result: any) => {
    setProduct((prevProduct) => {
      if (prevProduct) {
        return {
          ...prevProduct,
          images: [...prevProduct.images, result.info.secure_url],
        };
      }
      return prevProduct; // Return previous state if prevProduct is null
    });
  };

  const handleDeleteImage = (imageUrl: string) => {
    setProduct((prevProduct) => {
      if (prevProduct) {
        return {
          ...prevProduct,
          images: prevProduct.images.filter((img: string) => img !== imageUrl),
        };
      }
      return prevProduct; // Return previous state if prevProduct is null
    });
  };

  const handleAddInventory = () => {
    if (!newInventory.size || newInventory.price <= 0 || !newInventory.stock) {
      Swal.fire({
        icon: 'error',
        title: 'Incomplete Data',
        text: 'Please fill in all fields before adding inventory.',
      });
      return;
    }

    if (inventories.some((inventory) => inventory.size === newInventory.size)) {
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Size',
        text: 'Inventory with the same size already exists.',
      });
      return;
    }

    setInventories([...inventories, { ...newInventory, id: Date.now() }]);
    setNewInventory({ id: 0, size: 0, price: 100, stock: 0 }); // Resetting the form with default price of 100
  };

  const handleDeleteInventory = async (id: number) => {
    try {
      const response = await fetch(`/api/inventories`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setInventories(inventories.filter((inventory) => inventory.id !== id));
      } else {
        // If the API deletion fails, remove it from the state
        setInventories(inventories.filter((inventory) => inventory.id !== id));
      }
    } catch (error) {
      console.error('Error while deleting inventory:', error);
    }
  };

  const handleEditInventory = (inventory: Inventory) => {
    setEditInventory({ ...inventory }); // Clone the inventory to avoid direct state mutation
    setShowInventoryModal(true);
  };

  const handleUpdateInventory = async () => {
    if (!editInventory?.size || editInventory?.price <= 0 || !editInventory?.stock) {
      Swal.fire({
        icon: 'error',
        title: 'Incomplete Data',
        text: 'Please fill in all fields.',
      });
      return;
    }

    try {
      const updatedInventory = {
        ...editInventory,
        price: parseFloat(editInventory.price.toString()), // Ensure price is a number
      };

      const response = await fetch(`/api/inventories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedInventory),
      });

      if (response.ok) {
        const updatedInventories = inventories.map((inventory) =>
          inventory.id === editInventory.id ? updatedInventory : inventory
        );
        setInventories(updatedInventories);
        setShowInventoryModal(false);
        setEditInventory(null);
        Swal.fire('Success', 'Inventory updated successfully', 'success');
      } else {
        console.error('Failed to update inventory:', await response.json());
      }
    } catch (error) {
      console.error('Error while updating inventory:', error);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      // Check if session and user role are ready and valid
      if (session && (session?.user as any)?.role) {
        if ((session.user as any).role === "ADMIN") {
          // User is authenticated and is an admin, stop loading
          setLoading(false);
          fetchProductDetails();
          fetchDropdownData();
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

  if (status === "authenticated" && (session?.user as any)?.role === "ADMIN" && product) {
    return (
      <Layout>
        <div className="flex flex-col p-4 mt-2 mx-auto max-w-7xl transition-all duration-300 sm:p-6 lg:p-8">
          <nav className="text-sm text-gray-500 mb-4">
            <span className="hover:text-gray-700 cursor-pointer" onClick={() => router.push('/admin/products')}>
              Products
            </span>
            <span className="mx-2">/</span>
            <span className="text-gray-800 font-semibold">Edit Product</span>
          </nav>

          <h1 className="text-xl sm:text-2xl font-bold">Edit Product</h1>
          <hr className="my-4 border-gray-300" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="space-y-6">
              <div className="border border-black p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Icon icon="mingcute:information-line" className="mr-2 text-2xl" /> 
                  Basic Information
                </h2>
                <input
                  type="text"
                  placeholder="Title"
                  value={product.title}
                  onChange={(e) => setProduct({ ...product, title: e.target.value })}
                  className="w-full px-4 py-2 mb-4 border border-gray-300"
                />
                <ReactQuill
                  theme="snow"
                  value={product.description}
                  onChange={(value) => setProduct({ ...product, description: value })}
                  className="w-full mb-4 border border-gray-300"
                  placeholder="Description"
                />
                <ReactQuill
                  theme="snow"
                  value={product.howToUse}
                  onChange={(value) => setProduct({ ...product, howToUse: value })}
                  className="w-full mb-4 border border-gray-300"
                  placeholder="How to Use"
                />
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    checked={product.isNew}
                    onChange={(e) => setProduct({ ...product, isNew: e.target.checked })}
                    className="w-6 h-6 border border-gray-300"
                  />
                  <label className="text-sm font-semibold">Is New</label>
                </div>
              </div>

              <div className="border border-black p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Icon icon="carbon:collapse-categories" className="mr-2 text-2xl" /> 
                  Category
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2">Gender</label>
                    <select
                      value={product.gender}
                      onChange={(e) => setProduct({ ...product, gender: e.target.value as Gender })}
                      className="w-full px-4 py-2 border border-gray-300"
                    >
                      {Object.values(Gender).map((gender) => (
                        <option key={gender} value={gender}>
                          {gender}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2">Fragrance Family</label>
                    <select
                      value={product.fragranceFamilyId}
                      onChange={(e) => setProduct({ ...product, fragranceFamilyId: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300"
                    >
                      <option value="">Select Fragrance Family</option>
                      {fragranceFamilies.map((family) => (
                        <option key={family.id} value={family.id}>
                          {family.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2">Product Type</label>
                    <select
                      value={product.productTypeId}
                      onChange={(e) => setProduct({ ...product, productTypeId: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300"
                    >
                      <option value="">Select Product Type</option>
                      {productTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2">Formula</label>
                    <select
                      value={product.formulaId}
                      onChange={(e) => setProduct({ ...product, formulaId: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300"
                    >
                      <option value="">Select Formula</option>
                      {formulas.map((formula) => (
                        <option key={formula.id} value={formula.id}>
                          {formula.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2">Ingredient</label>
                    <select
                      value={product.ingredientId}
                      onChange={(e) => setProduct({ ...product, ingredientId: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300"
                    >
                      <option value="">Select Ingredient</option>
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-black p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Icon icon="lucide:images" className="mr-2 text-2xl" /> 
                  Product Images
                </h2>
                <CldUploadWidget onSuccess={handleUploadSuccess} uploadPreset="mpexriwx">
                  {({ open }) => (
                    <button
                      onClick={(e) => {
                        e.preventDefault(); // Prevent default behavior
                        open();
                      }}
                      className="flex items-center justify-center w-24 h-24 bg-gray-100 hover:bg-gray-400 transition-all duration-300"
                    >
                      <Icon icon="mdi:cloud-upload" className="text-black w-10 h-10" />
                    </button>
                  )}
                </CldUploadWidget>
                <div className="flex flex-wrap mt-4 gap-4">
  {product.images.map((imageUrl) => (
    <div key={imageUrl} className="relative w-24 h-24 sm:w-32 sm:h-32">
      <CldImage
        src={imageUrl}
        alt="Product Image"
        width={128}
        height={128}
        className="rounded-lg shadow-md w-full h-full object-cover"
      />
      <button
        onClick={() => handleDeleteImage(imageUrl)}
        className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
      >
        X
      </button>
    </div>
  ))}
</div>

              </div>

              <div className="border border-black p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
    <Icon icon="material-symbols:warehouse-outline" className="mr-2 text-2xl" />
    Inventory Management
  </h2>
  <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-4">
    {/* Size Input */}
    <div className="relative flex items-center w-full">
      <input
        type="number"
        step="0.01"
        placeholder="Size"
        value={newInventory.size}
        onChange={(e) => setNewInventory({ ...newInventory, size: parseFloat(e.target.value) || 0 })}
        className="pl-4 pr-10 w-full px-4 py-2 border border-gray-300"
      />
      <span className="absolute right-3 text-gray-500">ml</span>
    </div>

    {/* Price Input */}
    <div className="relative flex items-center w-full">
      <Icon icon="tabler:currency-bath" className="absolute left-3 text-gray-500 w-5 h-5" />
      <input
        type="number"
        placeholder="Price"
        value={newInventory.price}
        onChange={(e) => setNewInventory({ ...newInventory, price: parseFloat(e.target.value) })}
        className="pl-10 w-full px-4 py-2 border border-gray-300"
      />
    </div>

    {/* Stock Input */}
    <div className="relative flex items-center w-full">
      <Icon icon="material-symbols:warehouse-outline" className="absolute left-3 text-gray-500 w-5 h-5" />
      <input
        type="number"
        placeholder="Stock"
        value={newInventory.stock}
        onChange={(e) => setNewInventory({ ...newInventory, stock: parseInt(e.target.value) })}
        className="pl-10 w-full px-4 py-2 border border-gray-300"
      />
    </div>

    {/* Add Inventory Button */}
    <button
      onClick={handleAddInventory}
      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all duration-300 w-full sm:w-auto"
    >
      <Icon icon="icons8:plus" width={24} height={24} />
    </button>
  </div>

  {/* Inventory List */}
  <div className="mt-4">
    {inventories.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {inventories.map((inventory) => (
          <div
            key={inventory.id}
            className="p-4 bg-white rounded-lg shadow-md border border-gray-100 transition-all hover:shadow-lg"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-500">Size:</span>
                <span className="text-lg font-medium">{inventory.size} ml</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditInventory(inventory)}
                  className="flex items-center justify-center p-2 text-blue-500 hover:text-blue-700 transition-all duration-300"
                >
                  <Icon icon="mdi:pencil" className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteInventory(inventory.id)}
                  className="flex items-center justify-center p-2 text-red-500 hover:text-red-700 transition-all duration-300"
                >
                  <Icon icon="mdi:trash-can-outline" className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-500">Price:</span>
                <span className="text-xl font-bold text-gray-800">
                  ฿{(typeof inventory.price === 'number' ? inventory.price : parseFloat(inventory.price) || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-500">Stock:</span>
                <span className="text-xl font-bold text-gray-800">{inventory.stock}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-center text-gray-500">No inventories added yet.</p>
    )}
  </div>
</div>

            </div>
          </div>

          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mt-8">
  <button
    onClick={handleUpdateProduct}
    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all duration-300 w-full sm:w-auto flex items-center justify-center"
  >
     <Icon icon="lucide-lab:save" className="mr-2 w-5 h-5" /> {/* Save Icon */}
    Update Product
  </button>
</div>
        </div>

        {showInventoryModal && editInventory && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-1/2">
              <h2 className="text-xl font-semibold mb-4">Edit Inventory</h2>
              <div className="mb-4">
                <label className="block mb-2">Size (ml)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editInventory.size}
                  onChange={(e) => setEditInventory({ ...editInventory, size: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Price (฿)</label>
                <input
                  type="number"
                  value={editInventory.price}
                  onChange={(e) => setEditInventory({ ...editInventory, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Stock</label>
                <input
                  type="number"
                  value={editInventory.stock}
                  onChange={(e) => setEditInventory({ ...editInventory, stock: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateInventory}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all duration-300"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  return null;
};

export default EditProduct;

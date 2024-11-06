'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/app/components/admin/Layout";
import { useSession } from "next-auth/react";
import Loading from "@/app/components/Loading";
import { CldUploadWidget, CldImage } from "next-cloudinary";
import { Gender } from '@prisma/client';
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import dynamic from "next/dynamic";

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});
import "react-quill-new/dist/quill.snow.css";

const AddProduct = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [newProduct, setNewProduct] = useState<any>({
    title: '',
    description: '',
    howToUse: '',
    images: [],
    isNew: false, 
    gender: Gender.UNISEX, 
    fragranceFamilyId: '',
    productTypeId: '',
    formulaId: '',
    ingredientId: '',
  });
  const [inventories, setInventories] = useState<Array<any>>([]);
  const [newInventory, setNewInventory] = useState({ size: 0, price: 0, stock: 0 });
  const [fragranceFamilies, setFragranceFamilies] = useState<Array<any>>([]);
  const [productTypes, setProductTypes] = useState<Array<any>>([]);
  const [formulas, setFormulas] = useState<Array<any>>([]);
  const [ingredients, setIngredients] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);

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
      console.error("Failed to fetch dropdown data:", error);
    }
  };

  const handleAddProduct = async () => {
    // Check if required fields are filled
    if (
      !newProduct.title ||
      !newProduct.description ||
      !newProduct.howToUse ||
      !newProduct.gender ||
      !newProduct.fragranceFamilyId ||
      !newProduct.productTypeId ||
      !newProduct.formulaId ||
      !newProduct.ingredientId ||
      newProduct.images.length === 0
    ) {
      Swal.fire({
        icon: "error",
        title: "Incomplete Data",
        text: "Please fill in all required fields and upload at least one image.",
      });
      return;
    }
  
    try {
      const productResponse = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
  
      if (productResponse.ok) {
        const addedProduct = await productResponse.json();
        
        // Add inventories related to the product
        const inventoryRequests = inventories.map((inventory) => {
          return fetch('/api/inventories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...inventory, productId: addedProduct.id }),
          });
        });
  
        await Promise.all(inventoryRequests);
        router.push('/admin/products');
      } else {
        console.error("Failed to add product:", await productResponse.json());
      }
    } catch (error) {
      console.error("Error while adding product:", error);
    }
  };

  const handleUploadSuccess = (result: any) => {
    setNewProduct((prevProduct: any) => ({
      ...prevProduct,
      images: [...prevProduct.images, result.info.secure_url],
    }));
  };

  const handleDeleteImage = (imageUrl: string) => {
    setNewProduct((prevProduct: any) => ({
      ...prevProduct,
      images: prevProduct.images.filter((img: string) => img !== imageUrl),
    }));
  };

  const handleAddInventory = () => {
    if (!newInventory.size || !newInventory.price || !newInventory.stock) {
      Swal.fire({
        icon: "error",
        title: "Incomplete Data",
        text: "Please fill in all fields before adding inventory.",
      });
      return;
    }

    if (inventories.some((inventory) => inventory.size === newInventory.size)) {
      Swal.fire({
        icon: "error",
        title: "Duplicate Size",
        text: "Inventory with the same size already exists.",
      });
      return;
    }

    setInventories([...inventories, { ...newInventory, id: Date.now() }]);
    setNewInventory({ size: 0, price: 0, stock: 0 });
  };

  const handleDeleteInventory = (id: number) => {
    setInventories(inventories.filter((inventory) => inventory.id !== id));
  };

  useEffect(() => {
    if (status === "authenticated") {
      // Check if session and user role are ready and valid
      if (session && (session?.user as any)?.role) {
        if ((session.user as any).role === "ADMIN") {
          // User is authenticated and is an admin, stop loading
          setLoading(false);
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

  if (status === "authenticated" && (session?.user as any)?.role === "ADMIN") {
    return (
      <Layout>
        <div className="flex flex-col p-4 mt-2 mx-auto max-w-7xl transition-all duration-300 sm:p-6 lg:p-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-4">
            <span className="hover:text-gray-700 cursor-pointer" onClick={() => router.push('/admin/products')}>
              Products
            </span>
            <span className="mx-2">/</span>
            <span className="text-gray-800 font-semibold">Add Product</span>
          </nav>

          <h1 className="text-xl sm:text-2xl font-bold">Add New Product</h1>
          <hr className="my-4 border-gray-300" />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Product Basic Information */}
              <div className="border border-black p-4">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Icon icon="mingcute:information-line" className="mr-2 text-2xl" /> 
                  Basic Information
                </h2>
                <input
                  type="text"
                  placeholder="Title"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  className="w-full px-4 py-2 mb-4 border border-gray-300"
                />
                <ReactQuill
                  theme="snow"
                  value={newProduct.description}
                  onChange={(value) => setNewProduct({ ...newProduct, description: value })}
                  className="w-full mb-4 border border-gray-300"
                  placeholder="Description"
                />
                <ReactQuill
                  theme="snow"
                  value={newProduct.howToUse}
                  onChange={(value) => setNewProduct({ ...newProduct, howToUse: value })}
                  className="w-full mb-4 border border-gray-300"
                  placeholder="How to Use"
                />

                {/* Checkbox for Is New */}
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    checked={newProduct.isNew}
                    onChange={(e) => setNewProduct({ ...newProduct, isNew: e.target.checked })}
                    className="w-6 h-6 border border-gray-300"
                  />
                  <label className="text-sm font-semibold">Is New</label>
                </div>
              </div>

              {/* Category and Dropdown Information */}
              <div className="border border-black p-4">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Icon icon="carbon:collapse-categories" className="mr-2 text-2xl" /> 
                  Category
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2">Gender</label>
                    <select
                      value={newProduct.gender}
                      onChange={(e) => setNewProduct({ ...newProduct, gender: e.target.value })}
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
                      value={newProduct.fragranceFamilyId}
                      onChange={(e) => setNewProduct({ ...newProduct, fragranceFamilyId: parseInt(e.target.value) })}
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
                      value={newProduct.productTypeId}
                      onChange={(e) => setNewProduct({ ...newProduct, productTypeId: parseInt(e.target.value) })}
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
                      value={newProduct.formulaId}
                      onChange={(e) => setNewProduct({ ...newProduct, formulaId: parseInt(e.target.value) })}
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
                      value={newProduct.ingredientId}
                      onChange={(e) => setNewProduct({ ...newProduct, ingredientId: parseInt(e.target.value) })}
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

            {/* Right Column */}
            <div className="space-y-6">
              {/* Product Images */}
              <div className="border border-black p-4">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Icon icon="lucide:images" className="mr-2 text-2xl" /> 
                  Product Images
                </h2>
                <CldUploadWidget onSuccess={handleUploadSuccess} uploadPreset="mpexriwx">
                  {({ open }) => (
                    <button
                      onClick={() => open()}
                      className="flex items-center justify-center w-24 h-24 bg-gray-100 hover:bg-gray-400 transition-all duration-300"
                    >
                      <Icon icon="mdi:cloud-upload" className="text-black w-10 h-10" />
                    </button>
                  )}
                </CldUploadWidget>
                <div className="flex flex-wrap mt-4 gap-4">
  {newProduct.images.map((imageUrl: string) => (
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

             {/* Inventory Management */}
<div className="border border-black p-4">
  <h2 className="text-lg font-semibold mb-4 flex items-center">
    <Icon icon="material-symbols:warehouse-outline" className="mr-2 text-2xl" />
    Inventory Management
  </h2>

  <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0 mb-4">
    {/* Size Input with "ml" Icon */}
    <div className="relative flex items-center w-full">
      <input
        type="number"
        step="0.01"
        placeholder="Size"
        value={newInventory.size}
        onChange={(e) => setNewInventory({ ...newInventory, size: parseFloat(e.target.value) || 0 })}
        className="pl-4 pr-10 w-full px-4 py-2 border border-gray-300"
      />
      {/* "ml" Icon */}
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
      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all duration-300"
    >
      <Icon icon="icons8:plus" width={24} height={24} />
    </button>
  </div>

                {/* Display List of Inventories */}
                <div className="mt-4">
                  {inventories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {inventories.map((inventory) => (
                        <div
                          key={inventory.id}
                          className="p-4 bg-white rounded-lg shadow-md border border-gray-100 transition-all hover:shadow-lg"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-gray-500">Size:</span>
                              {/* Display size with "ml" */}
                              <span className="text-lg font-medium">{inventory.size} ml</span>
                            </div>
                            <button
                              onClick={() => handleDeleteInventory(inventory.id)}
                              className="flex items-center justify-center p-2 text-red-500 hover:text-red-700 transition-all duration-300"
                            >
                              <Icon icon="mdi:trash-can-outline" className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Inventory details */}
                          <div className="flex justify-between items-center mt-4">
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-semibold text-gray-500">Price:</span>
                              <span className="text-xl font-bold text-gray-800">฿{inventory.price.toFixed(2)}</span>
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

        {/* Save Product Button */}
<div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mt-8">
  <button
    onClick={handleAddProduct}
    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all duration-300 w-full sm:w-auto flex items-center justify-center"
  >
    <Icon icon="lucide-lab:save" className="mr-2 w-5 h-5" /> {/* Save Icon */}
    Save Product
  </button>
</div>
        </div>
      </Layout>
    );
  }

  return null;
};

export default AddProduct;

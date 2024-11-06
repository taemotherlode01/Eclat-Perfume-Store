'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import Layout from "@/app/components/admin/Layout";
import { useSession } from "next-auth/react";
import Loading from "@/app/components/Loading"; 
import Swal from 'sweetalert2';

const ProductTypeManagement = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [productTypes, setProductTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [filteredProductTypes, setFilteredProductTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [suggestions, setSuggestions] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [newProductType, setNewProductType] = useState<{ name: string }>({ name: '' });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editProductTypeId, setEditProductTypeId] = useState<number | null>(null);
  const [highlightedProductTypeId, setHighlightedProductTypeId] = useState<number | null>(null);

  const fetchProductTypes = async () => {
    try {
      const response = await fetch('/api/product-types');
      const data = await response.json();
      setProductTypes(data);
      setFilteredProductTypes(data);
      setSuggestions(data);
    } catch (error) {
      console.error("Failed to fetch product types:", error);
    }
  };

  const handleAddProductType = async () => {
    try {
      const response = await fetch('/api/product-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProductType),
      });
      if (response.ok) {
        const addedProductType = await response.json();
        setNewProductType({ name: '' });
        setIsAdding(false);
        setHighlightedProductTypeId(addedProductType.id);
        fetchProductTypes();
        setTimeout(() => setHighlightedProductTypeId(null), 700);
      } else {
        console.error("Failed to add product type:", await response.json());
      }
    } catch (error) {
      console.error("Error while adding product type:", error);
    }
  };

  const handleSaveEditProductType = async () => {
    try {
      const response = await fetch('/api/product-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editProductTypeId, ...newProductType }),
      });
      if (response.ok) {
        setEditProductTypeId(null);
        setNewProductType({ name: '' });
        setHighlightedProductTypeId(editProductTypeId);
        fetchProductTypes();
        setTimeout(() => setHighlightedProductTypeId(null), 700);
      } else {
        console.error("Failed to update product type:", await response.json());
      }
    } catch (error) {
      console.error("Error while updating product type:", error);
    }
  };

  const handleDeleteProductType = async (id: number) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you really want to delete this product type? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch('/api/product-types', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          if (response.ok) {
            fetchProductTypes();
            Swal.fire('Deleted!', 'The product type has been deleted successfully.', 'success');
          } else {
            Swal.fire('Failed!', 'There was a problem deleting the product type.', 'error');
          }
        } catch (error) {
          console.error("Error while deleting product type:", error);
          Swal.fire('Failed!', 'There was a problem deleting the product type.', 'error');
        }
      }
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredProductTypes(productTypes);
      setShowSuggestions(false);
    } else {
      const filteredSuggestions = productTypes.filter((productType) =>
        productType.name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestionName: string) => {
    setSearchQuery(suggestionName);
    setShowSuggestions(false);
    const filtered = productTypes.filter((productType) =>
      productType.name.toLowerCase().includes(suggestionName.toLowerCase())
    );
    setFilteredProductTypes(filtered);
  };

  const handleStartAdding = () => {
    setIsAdding(true);
  };

  const handleCancelAdding = () => {
    setIsAdding(false);
    setNewProductType({ name: '' });
  };

  const handleEditProductType = (id: number) => {
    const productTypeToEdit = productTypes.find((productType) => productType.id === id);
    if (productTypeToEdit) {
      setNewProductType({ name: productTypeToEdit.name });
      setEditProductTypeId(id);
    }
  };

  const handleCancelEditProductType = () => {
    setEditProductTypeId(null);
    setNewProductType({ name: '' });
  };

  useEffect(() => {
    if (status === "authenticated") {
      // Check if session and user role are ready and valid
      if (session && (session?.user as any)?.role) {
        if ((session.user as any).role === "ADMIN") {
          // User is authenticated and is an admin, stop loading
          setLoading(false);
          fetchProductTypes();
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
          <div className="flex flex-col items-center sm:items-start space-y-4 sm:flex-row justify-between sm:space-y-0 w-full">
            <h1 className="text-xl sm:text-2xl font-bold">Product Type Management</h1>
            <button
              onClick={handleStartAdding}
              className="flex items-center px-4 py-2 text-white bg-black hover:bg-gray-800 rounded-md transition-all duration-300"
            >
              <Icon icon="icons8:plus" width={24} height={24} className="mr-2" />
              Add Product Type
            </button>
          </div>

          {/* Search Box */}
          <div className="mt-6 relative w-full sm:w-1/2 lg:w-1/3 mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search Product Types..."
              onFocus={() => setShowSuggestions(true)} 
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
              className="w-full px-10 py-2 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300"
            />
            <Icon
              icon="mdi:magnify"
              width={24}
              height={24}
              className="absolute left-3 top-2.5 text-gray-500"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto transition-all duration-300">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion.name)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 transition-all duration-300"
                  >
                    {suggestion.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Product Type List */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300">
            {isAdding && (
              <div className="bg-white p-4 rounded-none border border-black max-w-md w-full h-40 flex flex-col justify-between transition-all duration-300 transform hover:scale-105">
                <input
                  type="text"
                  placeholder="Product Type Name"
                  value={newProductType.name}
                  onChange={(e) => setNewProductType({ ...newProductType, name: e.target.value })}
                  className="w-full px-4 py-2 mb-4 border border-gray-300 transition-all duration-300"
                />
                <div className="flex space-x-4">
                  <button
                    onClick={handleCancelAdding}
                    className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddProductType}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all duration-300"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}

            {filteredProductTypes.map((productType) => (
              <div
                key={productType.id}
                className={`bg-white p-4 rounded-none border border-black max-w-md w-full flex items-center space-x-6 relative transition-all duration-300 transform hover:scale-105 ${
                  editProductTypeId === productType.id ? 'h-40' : 'h-24'
                } ${highlightedProductTypeId === productType.id ? 'bg-yellow-100' : ''}`} // Highlight styling
              >
                <div className="flex-1">
                  {editProductTypeId === productType.id ? (
                    <>
                      <input
                        type="text"
                        value={newProductType.name}
                        onChange={(e) => setNewProductType({ ...newProductType, name: e.target.value })}
                        className="w-full px-2 py-1 border mb-2 mt-6 transition-all duration-300"
                      />
                      <div className="flex space-x-2">
                        <button onClick={handleSaveEditProductType} className="px-2 py-1 bg-black text-white rounded hover:scale-105 transition-all duration-300">Save</button>
                        <button onClick={handleCancelEditProductType} className="px-2 py-1 bg-gray-300 text-black rounded hover:bg-gray-400 transition-all duration-300">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <h2 className="text-lg font-semibold transition-all duration-300">{productType.name}</h2>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex space-x-2 transition-all duration-300">
                  <button
                    onClick={() => handleEditProductType(productType.id)}
                    className="text-gray-500 hover:text-black transition-all duration-300 transform hover:scale-110"
                  >
                    <Icon icon="mdi:pencil" width={20} height={20} />
                  </button>
                  <button onClick={() => handleDeleteProductType(productType.id)} className="text-red-500 hover:text-red-700 transition-all duration-300 transform hover:scale-110">
                    <Icon icon="mdi:close" width={20} height={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return null;
};

export default ProductTypeManagement;

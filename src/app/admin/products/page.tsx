'use client';
import dynamic from "next/dynamic"; 
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import Layout from "@/app/components/admin/Layout";
import { useSession } from "next-auth/react";
import Loading from "@/app/components/Loading";
import Swal from 'sweetalert2';
import { CldImage } from "next-cloudinary";

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});
import "react-quill-new/dist/quill.snow.css";

// Define types for your data
interface Formula {
  id: number;
  name: string;
}

interface FragranceFamily {
  id: number;
  name: string;
}

interface Ingredient {
  id: number;
  name: string;
}

interface ProductType {
  id: number;
  name: string;
}

interface Product {
  id: number;
  title: string;
  description: string;
  howToUse: string;
  images: string[];
  isNew: boolean;
  fragranceFamily: FragranceFamily;
  productType: ProductType;
  formula: Formula;
  ingredient: Ingredient;
  gender: "UNISEX" | "MALE" | "FEMALE";
  inventories: Inventory[]; // Include inventories here
}

interface Inventory {
  id: number;
  productId: number;
  size: string;
  price: number;
  stock: number;
}

interface FilterOptions {
  formulas: Formula[];
  fragranceFamilies: FragranceFamily[];
  ingredients: Ingredient[];
  productTypes: ProductType[];
}

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; content: string }> = ({ isOpen, onClose, title, content }) => {
  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white rounded-lg shadow-lg p-6 max-w-md w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl transform transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <h2 className="text-xl font-bold mb-4 text-center">{title}</h2>
        <div className="overflow-y-auto max-h-96">
          <div dangerouslySetInnerHTML={{ __html: content }} className="prose prose-sm sm:prose md:prose-lg lg:prose-xl" />
        </div>
        <div className="absolute top-4 right-4">
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 transition duration-200" aria-label="Close">
            <Icon icon="mdi:close" width={24} height={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ImagesModal: React.FC<{ isOpen: boolean; onClose: () => void; images: string[] }> = ({ isOpen, onClose, images }) => {
  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white rounded-lg shadow-lg p-4 max-w-md w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl transform transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <h2 className="text-xl font-bold mb-4 text-center">Product Images</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <CldImage
                src={img}
                alt={`Product image ${index + 1}`}
                width={300}
                height={300}
                className="object-cover rounded-md transition-transform duration-300 transform group-hover:scale-105"
              />
            </div>
          ))}
        </div>
        <div className="absolute top-4 right-4">
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 transition duration-200" aria-label="Close">
            <Icon icon="mdi:close" width={24} height={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

const InventoryModal: React.FC<{ isOpen: boolean; onClose: () => void; inventories: Inventory[] }> = ({ isOpen, onClose, inventories }) => {
  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white rounded-lg shadow-lg p-4 max-w-md w-full transform transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <h2 className="text-xl font-bold mb-4 text-center">Product Inventory</h2>
        <div className="overflow-y-auto max-h-96">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Size</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Stock</th>
              </tr>
            </thead>
            <tbody>
              {inventories.map((inventory) => (
                <tr key={inventory.id}>
                  <td className="px-4 py-2">{inventory.size}ml</td>
                  <td className="px-4 py-2">฿{inventory.price}</td>
                  <td className="px-4 py-2">{inventory.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="absolute top-4 right-4">
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 transition duration-200" aria-label="Close">
            <Icon icon="mdi:close" width={24} height={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductManagement: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    formulaId: '',
    fragranceFamilyId: '',
    ingredientId: '',
    productTypeId: '',
    gender: '',
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    formulas: [],
    fragranceFamilies: [],
    ingredients: [],
    productTypes: [],
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isHowToUseModalOpen, setIsHowToUseModalOpen] = useState(false);
  const [currentDescription, setCurrentDescription] = useState('');
  const [currentHowToUse, setCurrentHowToUse] = useState('');

  // Image modal states
  const [isImagesModalOpen, setIsImagesModalOpen] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);

  // Inventory modal states
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [currentInventories, setCurrentInventories] = useState<Inventory[]>([]);

  // State for managing selected products
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // State for showing only new products
  const [showNewProductsOnly, setShowNewProductsOnly] = useState(false);
  
  // State for showing out-of-stock products
  const [showOutOfStockProducts, setShowOutOfStockProducts] = useState(false);

  const fetchProducts = async () => {
    try {
      const queryParams = new URLSearchParams({
        searchQuery,
        formulaId: selectedFilters.formulaId || '',
        fragranceFamilyId: selectedFilters.fragranceFamilyId || '',
        ingredientId: selectedFilters.ingredientId || '',
        productTypeId: selectedFilters.productTypeId || '',
        gender: selectedFilters.gender || '',
      });

      const response = await fetch(`/api/products?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: Product[] = await response.json();

      // Fetch inventories for each product
      const productsWithInventories = await Promise.all(data.map(async (product) => {
        const inventoriesResponse = await fetch(`/api/inventories?productId=${product.id}`);
        const inventories: Inventory[] = await inventoriesResponse.json();
        return { ...product, inventories };
      }));

      setProducts(productsWithInventories);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [formulasRes, fragranceFamiliesRes, ingredientsRes, productTypesRes] = await Promise.all([
        fetch('/api/formulas'),
        fetch('/api/fragrance-families'),
        fetch('/api/ingredients'),
        fetch('/api/product-types'),
      ]);

      const [formulas, fragranceFamilies, ingredients, productTypes]: [Formula[], FragranceFamily[], Ingredient[], ProductType[]] = await Promise.all([
        formulasRes.json(),
        fragranceFamiliesRes.json(),
        ingredientsRes.json(),
        productTypesRes.json(),
      ]);

      setFilterOptions({
        formulas,
        fragranceFamilies,
        ingredients,
        productTypes,
      });
    } catch (error) {
      console.error("Failed to fetch filter options:", error);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you really want to delete this product? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch('/api/products', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          if (response.ok) {
            fetchProducts();
            Swal.fire('Deleted!', 'The product has been deleted successfully.', 'success');
          } else {
            Swal.fire('Failed!', 'There was a problem deleting the product.', 'error');
          }
        } catch (error) {
          console.error("Error while deleting product:", error);
          Swal.fire('Failed!', 'There was a problem deleting the product.', 'error');
        }
      }
    });
  };

  const handleDeleteSelectedProducts = async () => {
    if (selectedProductIds.length === 0) {
      Swal.fire('No products selected', 'Please select at least one product to delete.', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you really want to delete the selected products? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete them!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await Promise.all(selectedProductIds.map(id => 
          fetch('/api/products', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })
        ));
        setSelectedProductIds([]);
        fetchProducts();
        Swal.fire('Deleted!', 'The selected products have been deleted successfully.', 'success');
      } catch (error) {
        console.error("Failed to delete selected products:", error);
        Swal.fire('Failed!', 'There was a problem deleting the selected products.', 'error');
      }
    }
  };

  // Pagination logic
  const filteredProducts = showNewProductsOnly
    ? products.filter(product => product.isNew) // Filter for isNew
    : products.filter(product => {
        if (showOutOfStockProducts) {
          // Check if at least one inventory is out of stock
          const isOutOfStock = product.inventories.some(inventory => inventory.stock === 0);
          return isOutOfStock; // Keep products that have at least one size out of stock
        }
        return true; // No filter
      });

  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const handleNextPage = () => {
    if (currentPage < Math.ceil(filteredProducts.length / itemsPerPage)) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => (prevPage > 1 ? prevPage - 1 : 1));
  };

  useEffect(() => {
    if (!loading) {
      fetchProducts();
    }
  }, [selectedFilters, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSelectedFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (status === "authenticated") {
      if (session && (session?.user as any)?.role) {
        if ((session.user as any).role === "ADMIN") {
          setLoading(false);
          fetchProducts();
          fetchFilterOptions();
        } else {
          router.push("/");
        }
      }
    } else if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, session, router]);

  if (loading) {
    return <Loading />;
  }

  if (status === "authenticated" && (session?.user as any)?.role === "ADMIN") {
    return (
      <Layout>
        <div className="flex flex-col p-4 mt-2 mx-auto max-w-7xl transition-all duration-300 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <h1 className="text-2xl font-bold">Product Management</h1>
            <button
              onClick={() => router.push("/admin/products/add")}
              className="flex items-center px-4 py-2 text-white bg-black hover:bg-gray-800 rounded-md shadow-md transition-all duration-300"
            >
              <Icon icon="icons8:plus" width={24} height={24} className="mr-2" />
              Add Product
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="border p-2 pl-10 w-full sm:w-auto border-gray-300 focus:outline-none focus:border-black transition-all duration-300"
              />
              <Icon
                icon="mdi:magnify"
                width={24}
                height={24}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              />
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4">
              <select name="formulaId" onChange={handleFilterChange} className="border p-2">
                <option value="">Select Formula</option>
                {filterOptions.formulas.map((formula) => (
                  <option key={formula.id} value={formula.id}>{formula.name}</option>
                ))}
              </select>
              <select name="fragranceFamilyId" onChange={handleFilterChange} className="border p-2">
                <option value="">Select Fragrance Family</option>
                {filterOptions.fragranceFamilies.map((family) => (
                  <option key={family.id} value={family.id}>{family.name}</option>
                ))}
              </select>
              <select name="ingredientId" onChange={handleFilterChange} className="border p-2">
                <option value="">Select Ingredient</option>
                {filterOptions.ingredients.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
                ))}
              </select>
              <select name="productTypeId" onChange={handleFilterChange} className="border p-2">
                <option value="">Select Product Type</option>
                {filterOptions.productTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <select name="gender" onChange={handleFilterChange} className="border p-2">
                <option value="">Select Gender</option>
                <option value="UNISEX">Unisex</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          {/* New Products Only Checkbox */}
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showNewProductsOnly}
                onChange={() => setShowNewProductsOnly(!showNewProductsOnly)}
                className="text-xs mr-2 text-white bg-red-600 hover:bg-red-500 shadow-md transition-all duration-300 w-4 h-4"
              />
              Show New Products Only
            </label>
          </div>

          {/* Out-of-Stock Products Only Checkbox */}
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showOutOfStockProducts}
                onChange={() => setShowOutOfStockProducts(!showOutOfStockProducts)}
                className="text-xs mr-2 text-white bg-red-600 hover:bg-red-500 shadow-md transition-all duration-300 w-4 h-4"
              />
              Show Out-of-Stock Products Only
            </label>
          </div>

          {/* Button to delete selected products */}
          <button
            onClick={handleDeleteSelectedProducts}
            className="mt-4 inline-flex items-center px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-500 rounded-md shadow-md transition-all duration-300"
            style={{ width: '40px', height: '40px' }}
          >
            <Icon icon="mdi:trash-can-outline" className="w-5 h-5" />
          </button>

          {/* Scrollable Product Table */}
          <div className="relative mt-4">
            <div className="overflow-x-auto shadow-md sm:rounded-lg">
              <table className="min-w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="p-4">
                      <div className="flex items-center">
                        <input
                          id="checkbox-all-search"
                          type="checkbox"
                          checked={selectedProductIds.length === currentProducts.length && currentProducts.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds(currentProducts.map(product => product.id));
                            } else {
                              setSelectedProductIds([]);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="checkbox-all-search" className="sr-only">Select All</label>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3">Name</th>
                    <th scope="col" className="px-6 py-3">Fragrance</th>
                    <th scope="col" className="px-6 py-3">Product Type</th>
                    <th scope="col" className="px-6 py-3">Ingredient</th>
                    <th scope="col" className="px-6 py-3">Formula</th>
                    <th scope="col" className="px-6 py-3">Gender</th>
                    <th scope="col" className="px-6 py-3">Description</th>
                    <th scope="col" className="px-6 py-3">How To Use</th>
                    <th scope="col" className="px-6 py-3">Images</th>
                    <th scope="col" className="px-6 py-3">Inventory</th>
                    <th scope="col" className="px-6 py-3">New</th>
                    <th scope="col" className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center p-4">No products found.</td>
                    </tr>
                  ) : (
                    currentProducts.map((product) => (
                      <tr key={product.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="w-4 p-4">
                          <div className="flex items-center">
                            <input
                              id={`checkbox-table-search-${product.id}`}
                              type="checkbox"
                              checked={selectedProductIds.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProductIds([...selectedProductIds, product.id]);
                                } else {
                                  setSelectedProductIds(selectedProductIds.filter(id => id !== product.id));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`checkbox-table-search-${product.id}`} className="sr-only">checkbox</label>
                          </div>
                        </td>
                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                          {product.title}
                        </th>
                        <td className="px-6 py-4">{product.fragranceFamily?.name}</td>
                        <td className="px-6 py-4">{product.productType?.name}</td>
                        <td className="px-6 py-4">{product.ingredient?.name}</td>
                        <td className="px-6 py-4">{product.formula?.name}</td>
                        <td className="px-6 py-4">{product.gender}</td>
                        <td className="px-6 py-4">
                          <Icon
                            icon="mi:document"
                            width={24}
                            height={24}
                            className="cursor-pointer text-gray-500 hover:text-gray-800"
                            onClick={() => {
                              setCurrentDescription(product.description);
                              setIsDescriptionModalOpen(true);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Icon
                            icon="mi:document"
                            width={24}
                            height={24}
                            className="cursor-pointer text-gray-500 hover:text-gray-800"
                            onClick={() => {
                              setCurrentHowToUse(product.howToUse);
                              setIsHowToUseModalOpen(true);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Icon
                            icon="mdi:eye"
                            width={24}
                            height={24}
                            className="cursor-pointer text-gray-500 hover:text-gray-800"
                            onClick={() => {
                              setCurrentImages(product.images);
                              setIsImagesModalOpen(true);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Icon
                            icon="mdi:eye"
                            width={24}
                            height={24}
                            className="cursor-pointer text-gray-500 hover:text-gray-800"
                            onClick={() => {
                              setCurrentInventories(product.inventories);
                              setIsInventoryModalOpen(true);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">{product.isNew ? 'Yes' : 'No'}</td>
                        <td className="flex items-center px-6 py-4">
                          <button
                            onClick={() => router.push(`/admin/products/edit?id=${product.id}`)}
                            className="p-2 text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                          >
                            <Icon icon="mdi:pencil" width={24} height={24} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                          >
                            <Icon icon="mdi:trash-can" width={24} height={24} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span>{`Page ${currentPage} of ${Math.ceil(filteredProducts.length / itemsPerPage)}`}</span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= Math.ceil(filteredProducts.length / itemsPerPage)}
              className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
        
        {/* Modals for Description, How To Use, Images, and Inventory */}
        <Modal
          isOpen={isDescriptionModalOpen}
          onClose={() => setIsDescriptionModalOpen(false)}
          title="Product Description"
          content={currentDescription}
        />

        <Modal
          isOpen={isHowToUseModalOpen}
          onClose={() => setIsHowToUseModalOpen(false)}
          title="How To Use"
          content={currentHowToUse}
        />

        <ImagesModal
          isOpen={isImagesModalOpen}
          onClose={() => setIsImagesModalOpen(false)}
          images={currentImages}
        />

        <InventoryModal
          isOpen={isInventoryModalOpen}
          onClose={() => setIsInventoryModalOpen(false)}
          inventories={currentInventories}
        />
      </Layout>
    );
  }

  return null; // Fallback for rendering
};

export default ProductManagement;

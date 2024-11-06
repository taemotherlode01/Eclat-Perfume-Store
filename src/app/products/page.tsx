"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { Inventory } from "@prisma/client";
import Footer from "../components/Footer";

const AllProducts: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const productsPerPage = 8;

  // Calculate total pages
  const totalPages = Math.ceil(products.length / productsPerPage);

  // Filter state
  const [selectedFormulas, setSelectedFormulas] = useState<string[]>([]);
  const [selectedFragranceFamilies, setSelectedFragranceFamilies] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);

  // Price filter state
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(100000); // Set initial maxPrice to 100000

  // Filter data state
  const [formulas, setFormulas] = useState<any[]>([]);
  const [fragranceFamilies, setFragranceFamilies] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);

  // State for collapsible filters
  const [isFormulaOpen, setIsFormulaOpen] = useState<boolean>(false);
  const [isFragranceFamilyOpen, setIsFragranceFamilyOpen] = useState<boolean>(false);
  const [isIngredientOpen, setIsIngredientOpen] = useState<boolean>(false);
  const [isProductTypeOpen, setIsProductTypeOpen] = useState<boolean>(false);
  const [isGenderOpen, setIsGenderOpen] = useState<boolean>(false);

  // Fetch products from the API
  const fetchProducts = async (): Promise<void> => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();

      const productsWithPrices = await Promise.all(
        data.map(async (product: any) => {
          const response = await fetch(`/api/inventories?productId=${product.id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch inventories");
          }
          const inventories: Inventory[] = await response.json();
          const prices = inventories.map((inv) => Number(inv.price));
          const lowestPrice = Math.min(...prices);
          return { ...product, lowestPrice };
        })
      );

      setAllProducts(productsWithPrices);
      setProducts(productsWithPrices);

      // Keep maxPrice as 100000
      setMaxPrice(100000); 
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Unable to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to the product list
  const applyFilters = () => {
    const filteredProducts = allProducts.filter((product: any) => {
      const matchesFormula = selectedFormulas.length === 0 || selectedFormulas.includes(product.formulaId);
      const matchesFragranceFamily = selectedFragranceFamilies.length === 0 || selectedFragranceFamilies.includes(product.fragranceFamilyId);
      const matchesIngredient = selectedIngredients.length === 0 || selectedIngredients.includes(product.ingredientId);
      const matchesProductType = selectedProductTypes.length === 0 || selectedProductTypes.includes(product.productTypeId);
      const matchesGender = selectedGenders.length === 0 || selectedGenders.includes(product.gender);

      const matchesPrice =
        product.lowestPrice !== null &&
        (minPrice === 0 || product.lowestPrice >= minPrice) &&
        (maxPrice === null || product.lowestPrice <= maxPrice);

      return matchesFormula && matchesFragranceFamily && matchesIngredient && matchesProductType && matchesGender && matchesPrice;
    });

    setProducts(filteredProducts);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters(); // Apply filters whenever dependencies change
    setCurrentPage(1); // Reset to the first page on filter change
  }, [selectedFormulas, selectedFragranceFamilies, selectedIngredients, selectedProductTypes, selectedGenders, minPrice, maxPrice]);

  // Fetch filter data for categories
  const fetchFilterData = async () => {
    try {
      const formulasResponse = await fetch("/api/formulas");
      const formulasData = await formulasResponse.json();
      setFormulas(formulasData);

      const fragranceFamiliesResponse = await fetch("/api/fragrance-families");
      const fragranceFamiliesData = await fragranceFamiliesResponse.json();
      setFragranceFamilies(fragranceFamiliesData);

      const ingredientsResponse = await fetch("/api/ingredients");
      const ingredientsData = await ingredientsResponse.json();
      setIngredients(ingredientsData);

      const productTypesResponse = await fetch("/api/product-types");
      const productTypesData = await productTypesResponse.json();
      setProductTypes(productTypesData);
    } catch (error) {
      console.error("Failed to fetch filter data:", error);
    }
  };

  useEffect(() => {
    fetchFilterData();
  }, []);

  // Reset filters to their initial state
  const resetFilters = () => {
    setSelectedFormulas([]);
    setSelectedFragranceFamilies([]);
    setSelectedIngredients([]);
    setSelectedProductTypes([]);
    setSelectedGenders([]);
    setMinPrice(0);
    setMaxPrice(100000); // Reset maxPrice to 100000
  };

  // Get products for the current page
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Create an array of page numbers to display
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i <= 6) { // Show only the first 6 page numbers
      pageNumbers.push(i);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 p-4 flex-col lg:flex-row">
        {/* Filter Sidebar */}
        <div className="w-full lg:w-1/4 p-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
          {/* Price Range Filter */}
          <div className="border-black border p-4 mb-4 bg-white">
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
                max={100000} // Set maximum price as 100000
                value={maxPrice !== null ? maxPrice : 100000} // Set the value to maxPrice or default to 100000
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-2 rounded-lg cursor-pointer"
                style={{
                  background: `linear-gradient(to right, black 0%, black ${((maxPrice !== null ? maxPrice : 100000) / 100000) * 100}%, gray ${((maxPrice !== null ? maxPrice : 100000) / 100000) * 100}%, gray 100%)`,
                  accentColor: "black",
                }}
              />
            </div>
          </div>

          {/* Formulas Filter */}
          <div className="border-black border mb-4 bg-white">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer" 
              onClick={() => setIsFormulaOpen(!isFormulaOpen)}
            >
              <span className="font-bold">สูตร</span>
              <span>{isFormulaOpen ? '-' : '+'}</span>
            </div>
            {isFormulaOpen && (
              <div className="p-4 h-40 overflow-y-auto">
                {formulas.map((formula) => (
                  <label key={formula.id} className="block mb-1">
                    <input 
                      type="checkbox" 
                      className="custom-checkbox"
                      checked={selectedFormulas.includes(formula.id)}
                      onChange={() => {
                        const newSelection = selectedFormulas.includes(formula.id)
                          ? selectedFormulas.filter(id => id !== formula.id)
                          : [...selectedFormulas, formula.id];
                        setSelectedFormulas(newSelection);
                      }} 
                    />
                    {formula.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Fragrance Families Filter */}
          <div className="border-black border mb-4 bg-white">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer" 
              onClick={() => setIsFragranceFamilyOpen(!isFragranceFamilyOpen)}
            >
              <span className="font-bold">Fragrance Family</span>
              <span>{isFragranceFamilyOpen ? '-' : '+'}</span>
            </div>
            {isFragranceFamilyOpen && (
              <div className="p-4 h-40 overflow-y-auto">
                {fragranceFamilies.map((family) => (
                  <label key={family.id} className="block mb-1">
                    <input 
                      type="checkbox" 
                      className="custom-checkbox"
                      checked={selectedFragranceFamilies.includes(family.id)}
                      onChange={() => {
                        const newSelection = selectedFragranceFamilies.includes(family.id)
                          ? selectedFragranceFamilies.filter(id => id !== family.id)
                          : [...selectedFragranceFamilies, family.id];
                        setSelectedFragranceFamilies(newSelection);
                      }} 
                    />
                    {family.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Ingredients Filter */}
          <div className="border-black border mb-4 bg-white">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer" 
              onClick={() => setIsIngredientOpen(!isIngredientOpen)}
            >
              <span className="font-bold">ส่วนผสมอ้างอิง</span>
              <span>{isIngredientOpen ? '-' : '+'}</span>
            </div>
            {isIngredientOpen && (
              <div className="p-4 h-40 overflow-y-auto">
                {ingredients.map((ingredient) => (
                  <label key={ingredient.id} className="block mb-1">
                    <input 
                      type="checkbox" 
                      className="custom-checkbox"
                      checked={selectedIngredients.includes(ingredient.id)}
                      onChange={() => {
                        const newSelection = selectedIngredients.includes(ingredient.id)
                          ? selectedIngredients.filter(id => id !== ingredient.id)
                          : [...selectedIngredients, ingredient.id];
                        setSelectedIngredients(newSelection);
                      }} 
                    />
                    {ingredient.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Product Types Filter */}
          <div className="border-black border mb-4 bg-white">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer" 
              onClick={() => setIsProductTypeOpen(!isProductTypeOpen)}
            >
              <span className="font-bold">Product Types</span>
              <span>{isProductTypeOpen ? '-' : '+'}</span>
            </div>
            {isProductTypeOpen && (
              <div className="p-4 h-40 overflow-y-auto">
                {productTypes.map((productType) => (
                  <label key={productType.id} className="block mb-1">
                    <input 
                      type="checkbox" 
                      className="custom-checkbox"
                      checked={selectedProductTypes.includes(productType.id)}
                      onChange={() => {
                        const newSelection = selectedProductTypes.includes(productType.id)
                          ? selectedProductTypes.filter(id => id !== productType.id)
                          : [...selectedProductTypes, productType.id];
                        setSelectedProductTypes(newSelection);
                      }} 
                    />
                    {productType.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Gender Filter */}
          <div className="border-black border mb-4 bg-white">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer" 
              onClick={() => setIsGenderOpen(!isGenderOpen)}
            >
              <span className="font-bold">เพศ</span>
              <span>{isGenderOpen ? '-' : '+'}</span>
            </div>
            {isGenderOpen && (
              <div className="p-4 h-40 overflow-y-auto">
                {['UNISEX', 'MALE', 'FEMALE'].map((gender) => (
                  <label key={gender} className="block mb-1">
                    <input 
                      type="checkbox" 
                      className="custom-checkbox"
                      checked={selectedGenders.includes(gender)}
                      onChange={() => {
                        const newSelection = selectedGenders.includes(gender)
                          ? selectedGenders.filter(g => g !== gender)
                          : [...selectedGenders, gender];
                        setSelectedGenders(newSelection);
                      }} 
                    />
                    {gender}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button onClick={resetFilters} className="border rounded p-2 bg-black text-white w-full">
            Reset Filters
          </button>
        </div>

        {/* Products Grid */}
        <div className="w-full lg:w-3/4 p-4 flex justify-center">
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
        {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 6).map((number) => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`mx-1 px-4 py-2 border rounded ${currentPage === number ? "bg-black text-white" : "bg-gray-200"}`}
          >
            {number}
          </button>
        ))}
        {totalPages > 6 && currentPage < totalPages && (
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            className="mx-1 px-4 py-2 border rounded bg-gray-200"
          >
            Next
          </button>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AllProducts;

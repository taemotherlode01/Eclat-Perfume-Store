'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import Layout from "@/app/components/admin/Layout";
import { useSession } from "next-auth/react";
import Loading from "@/app/components/Loading"; 
import Swal from 'sweetalert2';

const FragranceFamilies = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fragranceFamilies, setFragranceFamilies] = useState<Array<{ id: number; name: string }>>([]);
  const [filteredFamilies, setFilteredFamilies] = useState<Array<{ id: number; name: string }>>([]);
  const [suggestions, setSuggestions] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [newFragranceFamily, setNewFragranceFamily] = useState<{ name: string }>({ name: '' });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editFragranceFamilyId, setEditFragranceFamilyId] = useState<number | null>(null);
  const [highlightedFamilyId, setHighlightedFamilyId] = useState<number | null>(null);

  const fetchFragranceFamilies = async () => {
    try {
      const response = await fetch('/api/fragrance-families');
      const data = await response.json();
      setFragranceFamilies(data);
      setFilteredFamilies(data);
      setSuggestions(data);
    } catch (error) {
      console.error("Failed to fetch fragrance families:", error);
    }
  };

  const handleAddFragranceFamily = async () => {
    try {
      const response = await fetch('/api/fragrance-families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFragranceFamily),
      });
      if (response.ok) {
        const addedFamily = await response.json();
        setNewFragranceFamily({ name: '' });
        setIsAdding(false);
        setHighlightedFamilyId(addedFamily.id);
        fetchFragranceFamilies();
        setTimeout(() => setHighlightedFamilyId(null), 700);
      } else {
        console.error("Failed to add fragrance family:", await response.json());
      }
    } catch (error) {
      console.error("Error while adding fragrance family:", error);
    }
  };

  const handleSaveEditFragranceFamily = async () => {
    try {
      const response = await fetch('/api/fragrance-families', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editFragranceFamilyId, ...newFragranceFamily }),
      });
      if (response.ok) {
        setEditFragranceFamilyId(null);
        setNewFragranceFamily({ name: '' });
        setHighlightedFamilyId(editFragranceFamilyId);
        fetchFragranceFamilies();
        setTimeout(() => setHighlightedFamilyId(null), 700);
      } else {
        console.error("Failed to update fragrance family:", await response.json());
      }
    } catch (error) {
      console.error("Error while updating fragrance family:", error);
    }
  };

  const handleDeleteFragranceFamily = async (id: number) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you really want to delete this fragrance family? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch('/api/fragrance-families', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          if (response.ok) {
            fetchFragranceFamilies();
            Swal.fire('Deleted!', 'The fragrance family has been deleted successfully.', 'success');
          } else {
            Swal.fire('Failed!', 'There was a problem deleting the fragrance family.', 'error');
          }
        } catch (error) {
          console.error("Error while deleting fragrance family:", error);
          Swal.fire('Failed!', 'There was a problem deleting the fragrance family.', 'error');
        }
      }
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredFamilies(fragranceFamilies);
      setShowSuggestions(false);
    } else {
      const filteredSuggestions = fragranceFamilies.filter((family) =>
        family.name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestionName: string) => {
    setSearchQuery(suggestionName);
    setShowSuggestions(false);
    const filtered = fragranceFamilies.filter((family) =>
      family.name.toLowerCase().includes(suggestionName.toLowerCase())
    );
    setFilteredFamilies(filtered);
  };

  const handleStartAdding = () => {
    setIsAdding(true);
  };

  const handleCancelAdding = () => {
    setIsAdding(false);
    setNewFragranceFamily({ name: '' });
  };

  const handleEditFragranceFamily = (id: number) => {
    const fragranceFamilyToEdit = fragranceFamilies.find((family) => family.id === id);
    if (fragranceFamilyToEdit) {
      setNewFragranceFamily({ name: fragranceFamilyToEdit.name });
      setEditFragranceFamilyId(id);
    }
  };

  const handleCancelEditFragranceFamily = () => {
    setEditFragranceFamilyId(null);
    setNewFragranceFamily({ name: '' });
  };

  useEffect(() => {
    if (status === "authenticated") {
      // Check if session and user role are ready and valid
      if (session && (session?.user as any)?.role) {
        if ((session.user as any).role === "ADMIN") {
          // User is authenticated and is an admin, stop loading
          setLoading(false);
          fetchFragranceFamilies();
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
            <h1 className="text-xl sm:text-2xl font-bold">Fragrance Family Management</h1>
            <button
              onClick={handleStartAdding}
              className="flex items-center px-4 py-2 text-white bg-black hover:bg-gray-800 rounded-md transition-all duration-300"
            >
              <Icon icon="icons8:plus" width={24} height={24} className="mr-2" />
              Add Fragrance Family
            </button>
          </div>

          {/* Search Box */}
          <div className="mt-6 relative w-full sm:w-1/2 lg:w-1/3 mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search Fragrance Families..."
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

          {/* Fragrance Family List */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300">
            {isAdding && (
              <div className="bg-white p-4 rounded-none border border-black max-w-md w-full h-40 flex flex-col justify-between transition-all duration-300 transform hover:scale-105">
                <input
                  type="text"
                  placeholder="Fragrance Family Name"
                  value={newFragranceFamily.name}
                  onChange={(e) => setNewFragranceFamily({ ...newFragranceFamily, name: e.target.value })}
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
                    onClick={handleAddFragranceFamily}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all duration-300"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}

            {filteredFamilies.map((family) => (
              <div
                key={family.id}
                className={`bg-white p-4 rounded-none border border-black max-w-md w-full flex items-center space-x-6 relative transition-all duration-300 transform hover:scale-105 ${
                  editFragranceFamilyId === family.id ? 'h-40' : 'h-24'
                } ${highlightedFamilyId === family.id ? 'bg-yellow-100' : ''}`} 
              >
                <div className="flex-1">
                  {editFragranceFamilyId === family.id ? (
                    <>
                      <input
                        type="text"
                        value={newFragranceFamily.name}
                        onChange={(e) => setNewFragranceFamily({ ...newFragranceFamily, name: e.target.value })}
                        className="w-full px-2 py-1 border mb-2 mt-6 transition-all duration-300"
                      />
                      <div className="flex space-x-2">
                        <button onClick={handleSaveEditFragranceFamily} className="px-2 py-1 bg-black text-white rounded hover:scale-105 transition-all duration-300">Save</button>
                        <button onClick={handleCancelEditFragranceFamily} className="px-2 py-1 bg-gray-300 text-black rounded hover:bg-gray-400 transition-all duration-300">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <h2 className="text-lg font-semibold transition-all duration-300">{family.name}</h2>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex space-x-2 transition-all duration-300">
                  <button
                    onClick={() => handleEditFragranceFamily(family.id)}
                    className="text-gray-500 hover:text-black transition-all duration-300 transform hover:scale-110"
                  >
                    <Icon icon="mdi:pencil" width={20} height={20} />
                  </button>
                  <button onClick={() => handleDeleteFragranceFamily(family.id)} className="text-red-500 hover:text-red-700 transition-all duration-300 transform hover:scale-110">
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

export default FragranceFamilies;

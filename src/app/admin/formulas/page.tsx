'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import Layout from "@/app/components/admin/Layout";
import { useSession } from "next-auth/react";
import Loading from "@/app/components/Loading"; 
import Swal from 'sweetalert2';

const FormulaManagement = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formulas, setFormulas] = useState<Array<{ id: number; name: string }>>([]);
  const [filteredFormulas, setFilteredFormulas] = useState<Array<{ id: number; name: string }>>([]);
  const [suggestions, setSuggestions] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [newFormula, setNewFormula] = useState<{ name: string }>({ name: '' });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editFormulaId, setEditFormulaId] = useState<number | null>(null);
  const [highlightedFormulaId, setHighlightedFormulaId] = useState<number | null>(null);

  const fetchFormulas = async () => {
    try {
      const response = await fetch('/api/formulas');
      const data = await response.json();
      setFormulas(data);
      setFilteredFormulas(data);
      setSuggestions(data);
    } catch (error) {
      console.error("Failed to fetch formulas:", error);
    }
  };

  const handleAddFormula = async () => {
    try {
      const response = await fetch('/api/formulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFormula),
      });
      if (response.ok) {
        const addedFormula = await response.json();
        setNewFormula({ name: '' });
        setIsAdding(false);
        setHighlightedFormulaId(addedFormula.id); 
        fetchFormulas();
        setTimeout(() => setHighlightedFormulaId(null), 700);
      } else {
        console.error("Failed to add formula:", await response.json());
      }
    } catch (error) {
      console.error("Error while adding formula:", error);
    }
  };

  const handleSaveEditFormula = async () => {
    try {
      const response = await fetch('/api/formulas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editFormulaId, ...newFormula }),
      });
      if (response.ok) {
        setEditFormulaId(null);
        setNewFormula({ name: '' });
        setHighlightedFormulaId(editFormulaId);
        fetchFormulas();
        setTimeout(() => setHighlightedFormulaId(null), 700);
      } else {
        console.error("Failed to update formula:", await response.json());
      }
    } catch (error) {
      console.error("Error while updating formula:", error);
    }
  };

  const handleDeleteFormula = async (id: number) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "Do you really want to delete this formula? This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch('/api/formulas', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          if (response.ok) {
            fetchFormulas();
            Swal.fire('Deleted!', 'The formula has been deleted successfully.', 'success');
          } else {
            Swal.fire('Failed!', 'There was a problem deleting the formula.', 'error');
          }
        } catch (error) {
          console.error("Error while deleting formula:", error);
          Swal.fire('Failed!', 'There was a problem deleting the formula.', 'error');
        }
      }
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredFormulas(formulas);
      setShowSuggestions(false);
    } else {
      const filteredSuggestions = formulas.filter((formula) =>
        formula.name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestionName: string) => {
    setSearchQuery(suggestionName);
    setShowSuggestions(false);
    const filtered = formulas.filter((formula) =>
      formula.name.toLowerCase().includes(suggestionName.toLowerCase())
    );
    setFilteredFormulas(filtered);
  };

  const handleStartAdding = () => {
    setIsAdding(true);
  };

  const handleCancelAdding = () => {
    setIsAdding(false);
    setNewFormula({ name: '' });
  };

  const handleEditFormula = (id: number) => {
    const formulaToEdit = formulas.find((formula) => formula.id === id);
    if (formulaToEdit) {
      setNewFormula({ name: formulaToEdit.name });
      setEditFormulaId(id);
    }
  };

  const handleCancelEditFormula = () => {
    setEditFormulaId(null);
    setNewFormula({ name: '' });
  };

  useEffect(() => {
    if (status === "authenticated") {
      // Check if session and user role are ready and valid
      if (session && (session?.user as any)?.role) {
        if ((session.user as any).role === "ADMIN") {
          // User is authenticated and is an admin, stop loading
          setLoading(false);
          fetchFormulas();
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
            <h1 className="text-xl sm:text-2xl font-bold">Formula Management</h1>
            <button
              onClick={handleStartAdding}
              className="flex items-center px-4 py-2 text-white bg-black hover:bg-gray-800 rounded-md transition-all duration-300"
            >
              <Icon icon="icons8:plus" width={24} height={24} className="mr-2" />
              Add Formula
            </button>
          </div>

          {/* Search Box */}
          <div className="mt-6 relative w-full sm:w-1/2 lg:w-1/3 mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search Formulas..."
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

          {/* Formula List */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300">
            {isAdding && (
              <div className="bg-white p-4 rounded-none border border-black max-w-md w-full h-40 flex flex-col justify-between transition-all duration-300 transform hover:scale-105">
                <input
                  type="text"
                  placeholder="Formula Name"
                  value={newFormula.name}
                  onChange={(e) => setNewFormula({ ...newFormula, name: e.target.value })}
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
                    onClick={handleAddFormula}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all duration-300"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}

            {filteredFormulas.map((formula) => (
              <div
                key={formula.id}
                className={`bg-white p-4 rounded-none border border-black max-w-md w-full flex items-center space-x-6 relative transition-all duration-300 transform hover:scale-105 ${
                  editFormulaId === formula.id ? 'h-40' : 'h-24'
                } ${highlightedFormulaId === formula.id ? 'bg-yellow-100' : ''}`} 
              >
                <div className="flex-1">
                  {editFormulaId === formula.id ? (
                    <>
                      <input
                        type="text"
                        value={newFormula.name}
                        onChange={(e) => setNewFormula({ ...newFormula, name: e.target.value })}
                        className="w-full px-2 py-1 border mb-2 mt-6 transition-all duration-300"
                      />
                      <div className="flex space-x-2">
                        <button onClick={handleSaveEditFormula} className="px-2 py-1 bg-black text-white rounded hover:scale-105 transition-all duration-300">Save</button>
                        <button onClick={handleCancelEditFormula} className="px-2 py-1 bg-gray-300 text-black rounded hover:bg-gray-400 transition-all duration-300">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <h2 className="text-lg font-semibold transition-all duration-300">{formula.name}</h2>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex space-x-2 transition-all duration-300">
                  <button
                    onClick={() => handleEditFormula(formula.id)}
                    className="text-gray-500 hover:text-black transition-all duration-300 transform hover:scale-110"
                  >
                    <Icon icon="mdi:pencil" width={20} height={20} />
                  </button>
                  <button onClick={() => handleDeleteFormula(formula.id)} className="text-red-500 hover:text-red-700 transition-all duration-300 transform hover:scale-110">
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

export default FormulaManagement;

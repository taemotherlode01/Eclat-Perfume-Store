'use client';
import { useRouter } from "next/navigation";

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useSession } from 'next-auth/react';
import Swal from 'sweetalert2';
import Layout from '@/app/components/admin/Layout';
import Loading from '@/app/components/Loading';
import dynamic from 'next/dynamic';
import AdvertisementPreview from '@/app/components/AdvertisementPreview';

// Dynamic import for ReactQuill
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

interface Advertisement {
  id: number;
  description: string; // For rich text description (HTML content)
}

// Define the modules for ReactQuill including color options
const modules = {
  toolbar: [
    [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'color': [] }, { 'background': [] }], // Add color and background color options
    [{ 'align': [] }],
    ['link'],
    ['clean'] // Remove formatting button
  ],
};

const AdvertisementManagement: React.FC = () => {
  const { data: session, status } = useSession();
  const [ads, setAds] = useState<Advertisement[]>([]); // Set default to empty array
  const [newDescription, setNewDescription] = useState<string>(''); // State for ReactQuill
  const [editAdId, setEditAdId] = useState<number | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const fetchAds = async (): Promise<void> => {
    try {
      const response = await fetch('/api/advertisements');
      const data = await response.json();
      if (Array.isArray(data)) {
        setAds(data);
      } else {
        console.error('Fetched data is not an array:', data);
        setAds([]);
      }
    } catch (error) {
      console.error('Failed to fetch advertisements:', error);
      setAds([]); // Ensure ads is an empty array if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const handleAddAd = async (): Promise<void> => {
    try {
      const response = await fetch('/api/advertisements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDescription }), // Add description
      });

      if (response.ok) {
        fetchAds();
        setNewDescription(''); // Clear description
      } else {
        console.error('Failed to add advertisement.');
      }
    } catch (error) {
      console.error('Error while adding advertisement:', error);
    }
  };

  const handleEditAd = async (): Promise<void> => {
    try {
      const response = await fetch('/api/advertisements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editAdId, description: newDescription }), // Update description
      });

      if (response.ok) {
        fetchAds();
        setEditAdId(null);
        setNewDescription(''); // Clear description
      } else {
        console.error('Failed to update advertisement.');
      }
    } catch (error) {
      console.error('Error while updating advertisement:', error);
    }
  };

  const handleDeleteAd = async (id: number): Promise<void> => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this advertisement?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch('/api/advertisements', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });

          if (response.ok) {
            fetchAds();
            Swal.fire('Deleted!', 'The advertisement has been deleted.', 'success');
          } else {
            console.error('Failed to delete advertisement.');
          }
        } catch (error) {
          console.error('Error while deleting advertisement:', error);
        }
      }
    });
  };

  // Function to cancel the editing mode
  const handleCancelEdit = () => {
    setEditAdId(null); // Reset edit mode
    setNewDescription(''); // Clear the description input
  };

//   useEffect(() => {
//     fetchAds();
//   }, []);

//   if (loading) return <Loading />;

useEffect(() => {
    if (status === "authenticated") {
      // Check if session and user role are ready and valid
      if (session && (session?.user as any)?.role) {
        if ((session.user as any).role === "ADMIN") {
          // User is authenticated and is an admin, stop loading
          setLoading(false);
          fetchAds();
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
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Advertisement Management</h1>

        {/* Use AdvertisementPreview Component */}
        <AdvertisementPreview ads={ads} />

        {/* Form for Adding and Editing Advertisements */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <ReactQuill
            value={newDescription}
            onChange={setNewDescription}
            placeholder="Advertisement Description"
            className="mt-4 mb-4"
            modules={modules} // Pass the modules here
          />
          <div className="flex space-x-4">
            <button
              onClick={editAdId ? handleEditAd : handleAddAd}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              {editAdId ? 'Update' : 'Add'}
            </button>
            {editAdId && (
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-all duration-300"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Existing Advertisements List */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Existing Advertisements</h2>
          <ul className="space-y-4">
            {ads.length > 0 ? ads.map((ad) => (
              <li key={ad.id} className="p-4 bg-gray-100 rounded-lg shadow-sm flex justify-between items-center">
                <div className="flex-grow">
                  <div
                    className="block text-gray-700"
                    dangerouslySetInnerHTML={{ __html: ad.description }} // Render HTML content
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditAdId(ad.id);
                      setNewDescription(ad.description); // Set description for editing
                    }}
                    className="text-blue-500"
                  >
                    <Icon icon="mdi:pencil" width="24" height="24" />
                  </button>
                  <button onClick={() => handleDeleteAd(ad.id)} className="text-red-500">
                    <Icon icon="mdi:delete" width="24" height="24" />
                  </button>
                </div>
              </li>
            )) : <p className="text-gray-500">No advertisements available.</p>}
          </ul>
        </div>
      </div>
    </Layout>
  );
};
}
export default AdvertisementManagement;

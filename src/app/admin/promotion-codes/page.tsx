'use client';
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";
import Layout from "@/app/components/admin/Layout";
import "react-quill-new/dist/quill.snow.css";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/app/components/Loading";

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});

// Define types
interface PromotionCode {
  id: number;
  code: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  description: string;
  status: string;
  usageCount?: number; // Add usage count here
}

interface PromotionUsage {
  id: number;
  userId: string;
  promotionCode: { code: string }; // Assuming promotionCode is an object with a 'code' property
  usedAt: string;
}

const PromotionCodeManagement: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [promotionCodes, setPromotionCodes] = useState<PromotionCode[]>([]);
  const [filteredPromotionCodes, setFilteredPromotionCodes] = useState<PromotionCode[]>([]);
  const [promotionUsage, setPromotionUsage] = useState<PromotionUsage[]>([]);
  const [code, setCode] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [promoId, setPromoId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [view, setView] = useState("CODES"); // State for toggling views

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPromotionUsage = async () => {
    const res = await fetch("/api/promotion-codes/usage-user"); // Adjust API endpoint
    const data = await res.json();

    // Create a mapping of usage counts for each promotion code
    const usageCountMap: Record<string, number> = {};

    data.forEach((usage: PromotionUsage) => {
      const code = usage.promotionCode.code; // Assuming promotionCode is an object with a 'code' property
      usageCountMap[code] = (usageCountMap[code] || 0) + 1;
    });

    setPromotionUsage(data);
    return usageCountMap; // Return the mapping for later use
  };

  const fetchPromotionCodes = async () => {
    const res = await fetch("/api/promotion-codes");
    const data = await res.json();

    // Fetch the usage count mapping
    const usageCountMap = await fetchPromotionUsage(); // Await the result

    const updatedData = data.map((promo: PromotionCode) => {
      const currentTime = new Date();
      const startDate = new Date(promo.startDate);
      const endDate = new Date(promo.endDate);

      let status = "ACTIVE";
      if (currentTime < startDate) {
        status = "NOT_YET_VALID";
      } else if (currentTime > endDate) {
        status = "EXPIRED";
      }

      // Get the usage count from the mapping, default to 0 if not found
      const usageCount = usageCountMap[promo.code] || 0;

      return { ...promo, status, usageCount }; // Include usage count
    });

    setPromotionCodes(updatedData);
    setFilteredPromotionCodes(updatedData);
  };

  const filterPromotionCodes = (status: string) => {
    if (status === "ALL") {
      setFilteredPromotionCodes(promotionCodes);
    } else {
      const filtered = promotionCodes.filter((promo) => promo.status === status);
      setFilteredPromotionCodes(filtered);
    }
  };

  const handleAddOrUpdatePromotionCode = async () => {
    const newPromotionCode = {
      id: isEditMode ? promoId : undefined,
      code,
      discountPercentage,
      startDate,
      endDate,
      description,
    };

    const method = isEditMode ? "PUT" : "POST";
    const response = await fetch("/api/promotion-codes", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPromotionCode),
    });

    if (response.ok) {
      handleCancelEdit();
      fetchPromotionCodes();
    } else {
      const errorData = await response.json();
      console.error("Error updating promotion code:", errorData.error);
    }
  };

  const handleDeletePromotionCode = async (id: number) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this promotion code?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await fetch("/api/promotion-codes", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        fetchPromotionCodes();
        Swal.fire("Deleted!", "The promotion code has been deleted.", "success");
      }
    });
  };

  const handleEditPromotionCode = (promo: PromotionCode) => {
    setPromoId(promo.id);
    setCode(promo.code);
    setDiscountPercentage(promo.discountPercentage);
    setStartDate(promo.startDate.split("T")[0]);
    setEndDate(promo.endDate.split("T")[0]);
    setDescription(promo.description);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setCode("");
    setDiscountPercentage(0);
    setStartDate("");
    setEndDate("");
    setDescription("");
    setIsEditMode(false);
    setPromoId(null);
  };

  useEffect(() => {
    if (status === "authenticated") {
      if (session && (session?.user as any)?.role) {
        if ((session.user as any).role === "ADMIN") {
          setLoading(false);
          fetchPromotionCodes();
        } else {
          router.push("/");
        }
      }
    } else if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, session, router]);

  // Fetch promotion usage when view changes
  useEffect(() => {
    if (view === "USAGE") {
      fetchPromotionUsage();
    }
  }, [view]);

  if (loading) {
    return <Loading />;
  }

  const handleFilterChange = (selectedStatus: string) => {
    setStatusFilter(selectedStatus);
    filterPromotionCodes(selectedStatus);
  };

  // Calculate the current items for pagination
  const indexOfLastUsage = currentPage * itemsPerPage;
  const indexOfFirstUsage = indexOfLastUsage - itemsPerPage;
  const currentUsage = promotionUsage.slice(indexOfFirstUsage, indexOfLastUsage);
  const totalPages = Math.ceil(promotionUsage.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (status === "authenticated" && (session?.user as any)?.role === "ADMIN") {
    return (
      <Layout>
        <div className="flex flex-col p-4 mt-2 mx-auto max-w-7xl transition-all duration-300 sm:p-6 lg:p-8">
          <div className="flex flex-col mb-2 items-start justify-between space-y-4 sm:space-y-0">
            <h1 className="text-2xl font-bold mb-4">Promotion Code Management</h1>
            {/* Navigation Buttons */}
            <div className="flex space-x-4 mb-4">
              <button 
                onClick={() => setView("CODES")}
                className={`px-4 py-2 rounded-md ${view === "CODES" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
              >
                Promotion Codes
              </button>
              <button 
                onClick={() => setView("USAGE")}
                className={`px-4 py-2 rounded-md ${view === "USAGE" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
              >
                Promotion Usage
              </button>
            </div>
          </div>

          {/* Conditional Rendering Based on Selected View */}
          {view === "CODES" ? (
            <div>
              {/* Form for Adding/Editing Promotion Code */}
              <div className="mt-4 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                  {isEditMode ? "Edit Promotion Code" : "Add New Promotion Code"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <label className="block mb-1">Code</label>
                    <div className="flex items-center">
                      <Icon icon="hugeicons:discount-tag-02" width={24} className="absolute left-2" />
                      <input
                        type="text"
                        placeholder="Enter Promotion Code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="border p-2 w-full pl-10"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block mb-1">Discount %</label>
                    <div className="flex items-center">
                      <Icon icon="nimbus:discount-circle" width={24} className="absolute left-2" />
                      <input
                        type="number"
                        placeholder="Enter Discount Percentage"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                        className="border p-2 w-full pl-10"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border p-2 w-full"
                    />
                  </div>
                  <div className="relative">
                    <label className="block mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border p-2 w-full"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="font-semibold block mb-1">Description</label>
                  <ReactQuill
                    value={description}
                    onChange={setDescription}
                    placeholder="Enter promotion description here..."
                    className="mt-2"
                  />
                </div>

                <div className="flex justify-start mt-4">
                  <button
                    onClick={handleAddOrUpdatePromotionCode}
                    className="px-4 py-2 mr-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all duration-300 w-full sm:w-auto"
                  >
                    {isEditMode ? "Update Promotion Code" : "Add Promotion Code"}
                  </button>
                  {isEditMode && (
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition-all duration-300 w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Promotion Codes Table */}
              <div className="relative mt-8">
                <div className="flex flex-wrap mb-4 space-x-2">
                  <button
                    onClick={() => handleFilterChange("ALL")}
                    className={`px-3 py-1 text-sm rounded-md ${statusFilter === "ALL" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleFilterChange("ACTIVE")}
                    className={`px-3 py-1 text-sm rounded-md ${statusFilter === "ACTIVE" ? "bg-green-600 text-white" : "bg-gray-200 text-black"}`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => handleFilterChange("NOT_YET_VALID")}
                    className={`px-3 py-1 text-sm rounded-md ${statusFilter === "NOT_YET_VALID" ? "bg-yellow-600 text-white" : "bg-gray-200 text-black"}`}
                  >
                    Not Yet Valid
                  </button>
                  <button
                    onClick={() => handleFilterChange("EXPIRED")}
                    className={`px-3 py-1 text-sm rounded-md ${statusFilter === "EXPIRED" ? "bg-red-600 text-white" : "bg-gray-200 text-black"}`}
                  >
                    Expired
                  </button>
                </div>
                <div className="overflow-x-auto shadow-md sm:rounded-lg">
                  <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3">Discount %</th>
                        <th className="px-6 py-3">Start Date</th>
                        <th className="px-6 py-3">End Date</th>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Usage Count</th> 
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPromotionCodes.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center p-4">
                            No promotion codes found.
                          </td>
                        </tr>
                      ) : (
                        filteredPromotionCodes.map((promo) => (
                          <tr key={promo.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4">{promo.code}</td>
                            <td className="px-6 py-4">{promo.discountPercentage}%</td>
                            <td className="px-6 py-4">{new Date(promo.startDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4">{new Date(promo.endDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <div dangerouslySetInnerHTML={{ __html: promo.description }} className="prose prose-sm" />
                            </td>
                            <td className="px-6 py-4">
                              <div className={`px-4 py-2 text-center ${
                                promo.status === "ACTIVE" ? "bg-green-100" :
                                promo.status === "NOT_YET_VALID" ? "bg-yellow-100" : "bg-red-100"} rounded-md`}>
                                {promo.status}
                              </div>
                            </td>
                            <td className="px-6 py-4">{promo.usageCount || 0}</td> 
                            <td className="flex items-center px-6 py-4">
                              <button
                                onClick={() => handleEditPromotionCode(promo)}
                                className="p-2 text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                              >
                                <Icon icon="mdi:pencil" width={24} height={24} />
                              </button>
                              <button
                                onClick={() => handleDeletePromotionCode(promo.id)}
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
            </div>
          ) : (
            // Promotion Usage View
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Promotion Usage</h2>
              
              {/* Table for Promotion Usage */}
              <div className="overflow-x-auto shadow-md sm:rounded-lg">
                <table className="min-w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">User ID</th>
                      <th className="px-6 py-3">Promotion Code</th>
                      <th className="px-6 py-3">Used At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsage.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center p-4">
                          No promotion usage found.
                        </td>
                      </tr>
                    ) : (
                      currentUsage.map((usage) => (
                        <tr key={usage.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4">{usage.userId}</td>
                          <td className="px-6 py-4">{usage.promotionCode?.code || "N/A"}</td>
                          <td className="px-6 py-4">{new Date(usage.usedAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-between mt-4">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${currentPage === 1 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white"}`}
                >
                  Previous
                </button>
                <span className="flex items-center">Page {currentPage} of {totalPages}</span>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${currentPage === totalPages ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white"}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return null; // Handle case where user is not an admin
};

export default PromotionCodeManagement;

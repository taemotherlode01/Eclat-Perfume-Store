"use client";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";
import Layout from "@/app/components/admin/Layout";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "@/app/components/Loading";

// Define TypeScript interfaces for data
interface Account {
  provider: string;
}

interface Address {
  id: string;
  recipient: string;
  phoneNumber: string;
  address: string;
  district: string;
  province: string;
  zipCode: string;
  country: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  accounts: Account[];
  Address: Address[];
  provider?: string;
}

const UserManagement: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [isEditMode, setIsEditMode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"USERS" | "ADMINS">("USERS");

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const fetchUsers = async () => {
    const res = await fetch("/api/user");
    const data = await res.json();
    console.log("Fetched users data:", data);

    const usersWithProviders = data.map((user: User) => ({
      ...user,
      provider:
        user.accounts.length > 0 ? user.accounts[0].provider : "credentials",
    }));
    setUsers(usersWithProviders);
  };

  const handleAddOrUpdateUser = async () => {
    const name = `${firstName} ${lastName}`;
    const newUser = {
      userId: isEditMode ? userId : undefined,
      name,
      email,
      password: isEditMode ? undefined : password,
      role: isEditMode ? role : undefined,
    };

    const method = isEditMode ? "PATCH" : "POST";
    const endpoint = isEditMode ? "/api/user/admin-update" : "/api/user";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (response.ok) {
      handleCancelEdit();
      fetchUsers();
      closeModal();
    } else {
      const errorData = await response.json();
      console.error("Error updating user:", errorData.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === (session?.user as any)?.id) {
      // แสดงข้อความหากผู้ใช้พยายามลบบัญชีของตนเอง
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "คุณไม่สามารถลบบัญชีของตัวเองได้.",
      });
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this user?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const response = await fetch("/api/user", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id }),
        });

        if (response.ok) {
          fetchUsers();
          Swal.fire("Deleted!", "The user has been deleted.", "success");
        } else {
          const errorData = await response.json();
          console.error("Error deleting user:", errorData.message);
          Swal.fire("Error!", errorData.message, "error");
        }
      }
    });
  };

  const handleEditUser = (user: User) => {
    const [fName, lName] = user.name.split(" ");
    setFirstName(fName || "");
    setLastName(lName || "");
    setUserId(user.id);
    setEmail(user.email);
    setRole(user.role);
    setIsEditMode(true);
    setPassword("");
    openModal();
  };

  const handleCancelEdit = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setRole("USER");
    setIsEditMode(false);
    setUserId(null);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    handleCancelEdit();
  };

  const toggleExpandUser = (id: string) => {
    setExpandedUserId(expandedUserId === id ? null : id);
  };

  useEffect(() => {
    if (status === "authenticated") {
      if (session && (session?.user as any)?.role) {
        if ((session.user as any).role === "ADMIN") {
          setLoading(false);
          fetchUsers();
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

  // Filter users based on search input and view mode
  const filteredUsers = users.filter(
    (user) =>
      (viewMode === "USERS" ? user.role === "USER" : user.role === "ADMIN") &&
      (user.id.includes(searchTerm) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (status === "authenticated" && (session?.user as any)?.role === "ADMIN") {
    return (
      <Layout>
        <div className="flex flex-col p-4 mt-2 mx-auto max-w-7xl">
          <div className="flex justify-between mb-4 flex-wrap">
            <h1 className="text-2xl font-bold mb-4">User Management</h1>

            <button
              onClick={openModal}
              className="flex items-center px-4 py-2 text-white bg-black hover:bg-gray-800 rounded-md shadow-md transition-all duration-300"
            >
              <Icon
                icon="icons8:plus"
                width={24}
                height={24}
                className="mr-2"
              />
              Add User
            </button>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by ID or Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border p-2 pl-10 w-full sm:w-auto border-gray-300 focus:outline-none focus:border-black transition-all duration-300"
              />
              <Icon
                icon="mdi:magnify"
                width={24}
                height={24}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="relative mt-8">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setViewMode("USERS")}
                className={`flex items-center px-4 py-2 rounded-md ${
                  viewMode === "USERS" ? "bg-black text-white" : "bg-gray-200"
                }`}
              >
                <Icon
                  icon="mdi:account"
                  width={24}
                  height={24}
                  className="mr-2"
                />
                Users
              </button>
              <button
                onClick={() => setViewMode("ADMINS")}
                className={`flex items-center px-4 py-2 rounded-md ${
                  viewMode === "ADMINS" ? "bg-black text-white" : "bg-gray-200"
                }`}
              >
                <Icon
                  icon="mdi:shield-account"
                  width={24}
                  height={24}
                  className="mr-2"
                />
                Admins
              </button>
            </div>
            <div className="overflow-x-auto shadow-md sm:rounded-lg">
              <table className="min-w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">User ID</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Provider</th>
                    <th className="px-6 py-3">Created At</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-4">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((user) => (
                      <React.Fragment key={user.id}>
                        <tr
                          className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleExpandUser(user.id)}
                        >
                          <td className="px-6 py-4">{user.id}</td>
                          <td className="px-6 py-4">{user.name}</td>
                          <td className="px-6 py-4">{user.email}</td>
                          <td className="px-6 py-4">{user.role}</td>
                          <td className="px-6 py-4">{user.provider}</td>
                          <td className="px-6 py-4">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="flex items-center justify-center px-6 py-4 space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditUser(user);
                              }}
                              className="p-2 text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                            >
                              <Icon icon="mdi:pencil" width={24} height={24} />
                            </button>
                            {/* แสดงปุ่มลบเฉพาะเมื่อ ID ของผู้ใช้ไม่ตรงกับ ID ของแอดมินที่ล็อกอิน */}
                            {(session?.user as any)?.id !== user.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUser(user.id);
                                }}
                                className="p-2 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                              >
                                <Icon
                                  icon="mdi:trash-can"
                                  width={24}
                                  height={24}
                                />
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedUserId === user.id && (
                          <tr className="bg-gray-100">
                            <td colSpan={7} className="px-6 py-4">
                              <h3 className="font-semibold">Addresses:</h3>
                              <ul className="list-disc pl-5">
                                {user.Address && user.Address.length > 0 ? (
                                  user.Address.map((address) => (
                                    <li key={address.id}>
                                      {`${address.recipient}, ${address.phoneNumber}, ${address.address}, ${address.district}, ${address.province}, ${address.zipCode}, ${address.country}`}
                                    </li>
                                  ))
                                ) : (
                                  <li>No addresses available.</li>
                                )}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between mt-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md ${
                  currentPage === 1
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Previous
              </button>
              <span>{`Page ${currentPage} of ${totalPages}`}</span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-md ${
                  currentPage === totalPages
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Next
              </button>
            </div>
          </div>

          {/* Modal for Adding/Editing User */}
          {isModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div
                className="absolute inset-0 bg-black opacity-50"
                onClick={closeModal}
              ></div>
              <div className="bg-white p-6 rounded-lg shadow-lg z-10 w-11/12 md:w-1/3 lg:w-1/4">
                <h2 className="text-xl font-semibold mb-4">
                  {isEditMode ? "Edit User" : "Add New User"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block mb-1">First Name</label>
                    <input
                      type="text"
                      placeholder="Enter First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="border p-2 w-full"
                    />
                  </div>
                  <div className="relative">
                    <label className="block mb-1">Last Name</label>
                    <input
                      type="text"
                      placeholder="Enter Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="border p-2 w-full"
                    />
                  </div>
                  <div className="relative">
                    <label className="block mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="Enter User Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border p-2 w-full"
                    />
                  </div>
                  {!isEditMode && (
                    <div className="relative">
                      <label className="block mb-1">Password</label>
                      <input
                        type="password"
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border p-2 w-full"
                      />
                    </div>
                  )}
                  <div className="relative">
                    <label className="block mb-1">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="border p-2 w-full"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-start mt-4">
                  <button
                    onClick={handleAddOrUpdateUser}
                    className="px-4 py-2 mr-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all duration-300 w-full sm:w-auto"
                  >
                    {isEditMode ? "Update User" : "Add User"}
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition-all duration-300 w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return null; // Handle case where user is not an admin
};

export default UserManagement;

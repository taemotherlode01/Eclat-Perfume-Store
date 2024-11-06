"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import Layout from "@/app/components/admin/Layout";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
import Loading from "@/app/components/Loading";

interface Order {
    id: number;
    userId: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    paymentStatus?: string;
    stripePaymentId?: string;
    promotionCode?: {
        code: string;
    };
    address?: {
        recipient: string;
        phoneNumber: string;
        address: string;
        district: string;
        province: string;
        zipCode: string;
        country: string;
    };
    orderItems: {
        id: number;
        quantity: number;
        price: number;
        product: {
            title: string;
            image: string;
        };
        inventory: {
            size: number;
        };
    }[];
}

const ITEMS_PER_PAGE = 10;

const OrderManagement: React.FC = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [orderIdQuery, setOrderIdQuery] = useState<number | "">("");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [newStatus, setNewStatus] = useState<string>("");
    const [highlightedStatus, setHighlightedStatus] = useState<string | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
    const [batchUpdateModalVisible, setBatchUpdateModalVisible] = useState(false);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(0);
    const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);

    const statusColorMap: { [key: string]: string } = {
        PENDING: "bg-yellow-500",
        SHIPPED: "bg-purple-500",
        TRANSIT: "bg-orange-500",
        DELIVERED: "bg-green-700",
    };

    const paymentStatusColorMap: { [key: string]: string } = {
        Paid: "bg-green-500",
        Unpaid: "bg-red-500",
    };

    const fetchOrders = async () => {
        try {
            const response = await fetch("/api/orders", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data: Order[] = await response.json();
            const updatedOrders = data.map((order) => ({
                ...order,
                paymentStatus: order.paymentStatus === "succeeded" ? "Paid" : "Unpaid",
            }));

            setOrders(updatedOrders);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        }
    };

    // Apply filters to the orders based on paymentStatusFilter and statusFilter
    const filteredOrders = orders.filter((order) => {
        const matchesPaymentStatus = paymentStatusFilter
            ? order.paymentStatus === paymentStatusFilter
            : true;
        const matchesOrderId = orderIdQuery ? order.id === orderIdQuery : true;
        const matchesOrderStatus = statusFilter ? order.status === statusFilter : true;

        return matchesPaymentStatus && matchesOrderId && matchesOrderStatus;
    });

    // Paginated orders
    const paginatedOrders = filteredOrders.slice(
        currentPage * ITEMS_PER_PAGE,
        (currentPage + 1) * ITEMS_PER_PAGE
    );

    const handleNextPage = () => {
        setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages - 1));
    };

    const handlePrevPage = () => {
        setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
    };

    const toggleOrderDetails = (orderId: number) => {
        setExpandedOrders((prevExpandedOrders) => {
            const newExpandedOrders = new Set(prevExpandedOrders);
            if (newExpandedOrders.has(orderId)) {
                newExpandedOrders.delete(orderId);
            } else {
                newExpandedOrders.add(orderId);
            }
            return newExpandedOrders;
        });
    };

    const handleDeleteOrder = async (id: number) => {
        Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to delete this order?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch("/api/orders", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids: [id] }), // Send the order ID in an array
                    });
                    if (response.ok) {
                        fetchOrders(); // Refresh the orders after deletion
                        Swal.fire("Deleted!", "Order has been deleted.", "success");
                    } else {
                        const errorData = await response.json();
                        Swal.fire("Error", errorData.error || "Could not delete order.", "error");
                    }
                } catch (error) {
                    Swal.fire("Error", "Could not delete order.", "error");
                }
            }
        });
    };

    const handleBatchDeleteOrders = async () => {
        const ids = Array.from(selectedOrders);
        if (ids.length === 0) {
            Swal.fire("Error", "Please select at least one order to delete.", "error");
            return;
        }

        Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to delete the selected orders?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete them!",
            cancelButtonText: "Cancel",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch("/api/orders/batch-delete", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids }),
                    });

                    if (response.ok) {
                        fetchOrders(); // Refresh orders after deletion
                        Swal.fire("Deleted!", "Selected orders have been deleted.", "success");
                    } else {
                        Swal.fire("Error", "Could not delete selected orders.", "error");
                    }
                } catch (error) {
                    Swal.fire("Error", "Could not delete selected orders.", "error");
                }
            }
        });
    };

    const handleFilterChange = (type: "paymentStatus" | "status", value: string) => {
        if (type === "paymentStatus") {
            setPaymentStatusFilter(value);
        } else if (type === "status") {
            setStatusFilter(value);
        }
    };

    const handleStatusChange = async () => {
        const ids = selectedOrderId ? [selectedOrderId] : Array.from(selectedOrders);
        if (ids.length === 0 || !newStatus) {
            Swal.fire("Error", "Please select an order and a new status.", "error");
            return;
        }

        try {
            const response = await fetch(`/api/orders/batch-update`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids, status: newStatus }),
            });

            if (response.ok) {
                Swal.fire("Success!", "Order status updated.", "success");
                fetchOrders(); // Refresh the orders after updating
                setSelectedOrders(new Set()); // Clear selection if batch update
                setModalVisible(false); // Close the modal
                setBatchUpdateModalVisible(false); // Close the modal
            } else {
                const errorData = await response.json();
                console.error("Failed to update status:", errorData);
                throw new Error("Failed to update status");
            }
        } catch (error) {
            console.error("Error in handleStatusChange:", error);
            Swal.fire("Error", "Could not update order status.", "error");
        } finally {
            setSelectedOrderId(null);
            setNewStatus("");
            setHighlightedStatus(null); // Reset highlighted status
        }
    };

    const handleStatusClick = (orderId: number, currentStatus: string) => {
        setSelectedOrderId(orderId);
        setNewStatus(currentStatus);
        setHighlightedStatus(currentStatus); // Highlight the current status
        setModalVisible(true);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allOrderIds = new Set(filteredOrders.map((order) => order.id));
            setSelectedOrders(allOrderIds);
        } else {
            setSelectedOrders(new Set());
        }
    };

    const handleSelectOrder = (orderId: number) => {
        setSelectedOrders((prev) => {
            const newSelectedOrders = new Set(prev);
            if (newSelectedOrders.has(orderId)) {
                newSelectedOrders.delete(orderId);
            } else {
                newSelectedOrders.add(orderId);
            }
            return newSelectedOrders;
        });
    };

    useEffect(() => {
        if (status === "authenticated") {
            if (session && (session?.user as any)?.role) {
                if ((session.user as any).role === "ADMIN") {
                    fetchOrders();
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
                    <h1 className="text-2xl font-bold">Order Management</h1>
                    <div className="flex flex-col gap-4 mt-4 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-1/4">
                            <Icon
                                icon="mdi:magnify"
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="number"
                                placeholder="Search by Order ID"
                                value={orderIdQuery}
                                onChange={(e) => setOrderIdQuery(Number(e.target.value) || "")}
                                className="border p-2 pl-10 pr-4 w-full border-gray-300 focus:outline-none focus:border-black transition-all duration-300"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1">Payment Status</label>
                            <div className="flex gap-1 flex-wrap">
                                <button
                                    onClick={() => handleFilterChange("paymentStatus", "Paid")}
                                    className={`px-2 py-1 rounded text-sm ${
                                        paymentStatusFilter === "Paid"
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    Paid
                                </button>
                                <button
                                    onClick={() => handleFilterChange("paymentStatus", "Unpaid")}
                                    className={`px-2 py-1 rounded text-sm ${
                                        paymentStatusFilter === "Unpaid"
                                            ? "bg-red-500 text-white"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    Unpaid
                                </button>
                                <button
                                    onClick={() => handleFilterChange("paymentStatus", "")}
                                    className={`px-2 py-1 rounded text-sm ${
                                        paymentStatusFilter === ""
                                            ? "bg-black text-white"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    All Payment Statuses
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="mb-1">Order Status</label>
                            <div className="flex gap-1 flex-wrap">
                                <button
                                    onClick={() => handleFilterChange("status", "PENDING")}
                                    className={`px-2 py-1 rounded text-sm ${
                                        statusFilter === "PENDING"
                                            ? "bg-yellow-500 text-white"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    Pending
                                </button>
                                <button
                                    onClick={() => handleFilterChange("status", "SHIPPED")}
                                    className={`px-2 py-1 rounded text-sm ${
                                        statusFilter === "SHIPPED"
                                            ? "bg-purple-500 text-white"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    Shipped
                                </button>
                                <button
                                    onClick={() => handleFilterChange("status", "TRANSIT")}
                                    className={`px-2 py-1 rounded text-sm ${
                                        statusFilter === "TRANSIT"
                                            ? "bg-orange-500 text-white"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    In Transit
                                </button>
                                <button
                                    onClick={() => handleFilterChange("status", "DELIVERED")}
                                    className={`px-2 py-1 rounded text-sm ${
                                        statusFilter === "DELIVERED"
                                            ? "bg-green-700 text-white"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    Delivered
                                </button>
                                <button
                                    onClick={() => handleFilterChange("status", "")}
                                    className={`px-2 py-1 rounded text-sm ${
                                        statusFilter === "" ? "bg-black text-white" : "bg-gray-200"
                                    }`}
                                >
                                    All Statuses
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-start mt-4">
                        <button
                            onClick={handleBatchDeleteOrders}
                            className="p-2 bg-red-500 text-white rounded text-sm"
                        >
                            <Icon icon="mdi:trash-can-outline" className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setBatchUpdateModalVisible(true)}
                            className="ml-2 px-2 py-1 bg-black text-white rounded text-sm"
                        >
                            Update Status Orders
                        </button>
                    </div>

                    {/* Table with orders */}
                    <div className="relative mt-6">
                        <div className="overflow-x-auto shadow-md sm:rounded-lg">
                            <table className="min-w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAll}
                                                checked={selectedOrders.size === filteredOrders.length}
                                            />
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            User ID
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Order ID
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Total Amount
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Payment Status
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Created At
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Updated At
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="text-center p-4">
                                                No orders found.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedOrders.map((order) => (
                                            <React.Fragment key={order.id}>
                                                <tr
                                                    className={`bg-white border-b hover:bg-gray-50 cursor-pointer ${
                                                        expandedOrders.has(order.id) ? "bg-gray-100" : ""
                                                    }`}
                                                    onClick={() => toggleOrderDetails(order.id)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedOrders.has(order.id)}
                                                            onChange={() => handleSelectOrder(order.id)}
                                                            onClick={(e) => e.stopPropagation()} // Prevent event propagation
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                                        {order.userId}
                                                    </td>
                                                    <td className="px-6 py-4">{order.id}</td>
                                                    <td className="px-6 py-4">฿{order.totalAmount}</td>
                                                    <td
                                                        className="px-6 py-4"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent expansion when clicking on status
                                                            handleStatusClick(order.id, order.status);
                                                        }}
                                                    >
                                                        <span
                                                            className={`inline-block text-white px-2 py-1 rounded ${
                                                                statusColorMap[order.status] || "bg-gray-500"
                                                            }`}
                                                        >
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`inline-block text-white px-2 py-1 rounded ${
                                                                paymentStatusColorMap[order.paymentStatus || "Unpaid"] || "bg-gray-500"
                                                            }`}
                                                        >
                                                            {order.paymentStatus || "Unpaid"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {new Date(order.updatedAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteOrder(order.id); // Call the delete function for individual order
                                                            }}
                                                            className="p-2 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors mx-1"
                                                        >
                                                            <Icon icon="mdi:trash-can" width={24} height={24} />
                                                        </button>
                                                    </td>
                                                </tr>

                                                {expandedOrders.has(order.id) && (
                                                    <tr className="bg-gray-100">
                                                        <td colSpan={10} className="p-4">
                                                            <h3 className="text-lg font-semibold mb-2">
                                                                Order Details
                                                            </h3>
                                                            <p>
                                                                <strong>Order ID:</strong> {order.id}
                                                            </p>
                                                            <p>
                                                                <strong>Status:</strong> {order.status}
                                                            </p>
                                                            <p>
                                                                <strong>Total Amount:</strong> ฿
                                                                {order.totalAmount}
                                                            </p>
                                                            <p>
                                                                <strong>Order Items:</strong>
                                                            </p>
                                                            <ul>
                                                                {order.orderItems.map((item) => (
                                                                    <li
                                                                        key={item.id}
                                                                        className="border-b py-2 flex items-center"
                                                                    >
                                                                        <img
                                                                            src={item.product.image.split(",")[0]}
                                                                            alt={item.product.title}
                                                                            className="w-16 h-16 object-cover rounded mr-4"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <p>
                                                                                <strong>Product:</strong>{" "}
                                                                                {item.product.title}
                                                                            </p>
                                                                            <p>Size: {item.inventory.size}ml</p>
                                                                            <p>Quantity: {item.quantity}</p>
                                                                            <p>
                                                                                Price: ฿{Number(item.price).toFixed(2)}
                                                                            </p>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                            {order.stripePaymentId && (
                                                                <p>
                                                                    <strong>Stripe Payment ID:</strong>{" "}
                                                                    {order.stripePaymentId}
                                                                </p>
                                                            )}
                                                            {order.promotionCode && (
                                                                <p>
                                                                    <strong>Promotion Code:</strong>{" "}
                                                                    {order.promotionCode.code}
                                                                </p>
                                                            )}
                                                            {order.address && ( // Check if address exists
                                                                <div className="mt-4">
                                                                    <h4 className="font-semibold">
                                                                        Shipping Address:
                                                                    </h4>
                                                                    <p>
                                                                        <strong>Recipient:</strong>{" "}
                                                                        {order.address.recipient}
                                                                    </p>
                                                                    <p>
                                                                        <strong>Phone Number:</strong>{" "}
                                                                        {order.address.phoneNumber}
                                                                    </p>
                                                                    <p>
                                                                        <strong>Address:</strong>{" "}
                                                                        {order.address.address}
                                                                    </p>
                                                                    <p>
                                                                        <strong>District:</strong>{" "}
                                                                        {order.address.district}
                                                                    </p>
                                                                    <p>
                                                                        <strong>Province:</strong>{" "}
                                                                        {order.address.province}
                                                                    </p>
                                                                    <p>
                                                                        <strong>Zip Code:</strong>{" "}
                                                                        {order.address.zipCode}
                                                                    </p>
                                                                    <p>
                                                                        <strong>Country:</strong>{" "}
                                                                        {order.address.country}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex justify-between mt-4">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 0}
                            className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={(currentPage + 1) * ITEMS_PER_PAGE >= filteredOrders.length}
                            className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>

                    {/* Unified Modal for Updating Order Status */}
                    {modalVisible || batchUpdateModalVisible ? (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                                <button
                                    onClick={() => {
                                        setModalVisible(false);
                                        setBatchUpdateModalVisible(false);
                                    }}
                                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                >
                                    &times;
                                </button>
                                <h2 className="text-lg font-semibold mb-4">
                                    {selectedOrderId
                                        ? "Change Order Status"
                                        : "Update Order Status"}
                                </h2>
                                <div className="flex flex-col gap-4">
                                    {Object.keys(statusColorMap).map((status) => (
                                        <button
                                            key={status}
                                            className={`px-4 py-2 rounded ${
                                                status === highlightedStatus
                                                    ? "border-4 border-black"
                                                    : ""
                                            } ${statusColorMap[status]} text-white`}
                                            onClick={() => {
                                                setNewStatus(status);
                                                setHighlightedStatus(status); // Set highlighted status
                                            }}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                    <div className="flex justify-start mt-4">
                                        <button
                                            onClick={handleStatusChange}
                                            className="px-4 mr-2 py-2 bg-black text-white rounded text-sm"
                                        >
                                            Update Status
                                        </button>
                                        <button
                                            onClick={() => {
                                                setModalVisible(false);
                                                setBatchUpdateModalVisible(false);
                                            }}
                                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </Layout>
        );
    }

    return null; // Render nothing if not authenticated as admin
};

export default OrderManagement;

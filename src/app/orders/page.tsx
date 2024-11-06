"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import StatusBar from "../components/StatusBar";
import SidebarUser from "../components/SidebarUser";
import { NextPage } from "next";

const ITEMS_PER_PAGE = 2;

// Translation function for payment status
const translatePaymentStatus = (status: string | undefined) => {
    switch (status) {
        case "succeeded":
            return "ชำระเงินสำเร็จ";
        default:
            return "ยังไม่ได้ชำระเงิน";
    }
};

const OrderHistory: NextPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [noOrders, setNoOrders] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("in-progress");
    const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
    const [page, setPage] = useState(0);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/signin");
            return;
        }

        const fetchOrderHistory = async () => {
            try {
                const response = await fetch("/api/orders/user");
                if (response.status === 404) {
                    setNoOrders(true);
                    return;
                }
                if (!response.ok) {
                    throw new Error("Failed to fetch order history");
                }
                const ordersData = await response.json();
                setOrders(ordersData);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        };

        if (status === "authenticated") {
            fetchOrderHistory();
        }
    }, [status, router]);

    const toggleDetails = (orderId: number) => {
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

    const handlePayLater = async (orderId: number) => {
        try {
            const response = await fetch("/api/user"); // ดึงข้อมูลผู้ใช้
            if (!response.ok) {
                throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้");
            }
            const userData = await response.json();
            const userId = userData.id;

            if (!userId) {
                setError("ไม่พบรหัสผู้ใช้");
                return;
            }

            const paymentResponse = await fetch("/api/checkout-later", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId,
                    userId,
                }),
            });

            if (!paymentResponse.ok) {
                throw new Error("Failed to initiate payment for the order");
            }

            const { url } = await paymentResponse.json();
            router.push(url);
        } catch (error) {
            console.error("Error initiating payment:", error);
            setError("ไม่สามารถดำเนินการชำระเงินได้ โปรดลองอีกครั้งภายหลัง");
        }
    };

    const inProgressOrders = orders.filter(
        (order) => order.status !== "DELIVERED"
    );
    const completedOrders = orders.filter(
        (order) => order.status === "DELIVERED"
    );
    const currentOrders =
        activeTab === "in-progress" ? inProgressOrders : completedOrders;

    const paginatedOrders = currentOrders.slice(
        page * ITEMS_PER_PAGE,
        (page + 1) * ITEMS_PER_PAGE
    );

    const handleNextPage = () => {
        setPage((prevPage) => prevPage + 1);
    };

    const handlePrevPage = () => {
        setPage((prevPage) => Math.max(prevPage - 1, 0));
    };

    if (status === "loading" || loading) return <Loading />;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div>
            <Navbar />
            <div className="p-4 md:p-8 lg:p-12 grid grid-cols-1 md:grid-cols-4 gap-8">
                <SidebarUser />
                <div className="col-span-3">
                    <h1 className="text-2xl font-bold mb-4">การสั่งซื้อ</h1>
                    <div className="flex space-x-4 mb-6">
                        <button
                            onClick={() => {
                                setActiveTab("in-progress");
                                setPage(0);
                            }}
                            className={`px-4 py-2 ${
                                activeTab === "in-progress"
                                    ? "bg-black text-white"
                                    : "bg-gray-200"
                            }`}
                        >
                            กำลังดำเนินการ
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab("completed");
                                setPage(0);
                            }}
                            className={`px-4 py-2 ${
                                activeTab === "completed"
                                    ? "bg-black text-white"
                                    : "bg-gray-200"
                            }`}
                        >
                            ประวัติการสั่งซื้อ
                        </button>
                    </div>

                    {noOrders ? (
                        <p>ไม่พบการสั่งซื้อ</p>
                    ) : (
                        <div>
                            {paginatedOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="mb-8 p-4 border border-black"
                                >
                                    <h2 className="text-lg font-semibold mb-2">
                                        รหัสคำสั่งซื้อ: {order.id}
                                    </h2>
                                    <StatusBar status={order.status} />
                                    <p>
                                        <strong>ยอดรวม:</strong> ฿{order.totalAmount.toFixed(2)}
                                    </p>
                                    <p>
                                        <strong>สถานะการชำระเงิน:</strong>{" "}
                                        {translatePaymentStatus(order.paymentStatus)}
                                    </p>
                                    {order.paymentStatus !== "succeeded" && (
                                        <button
                                            onClick={() => handlePayLater(order.id)}
                                            className="mt-2 bg-black text-white px-4 py-2 rounded"
                                        >
                                            ชำระเงิน
                                        </button>
                                    )}
                                    <h3 className="mt-4 mb-2">รายการสินค้า:</h3>
                                    <ul>
                                        {order.orderItems.map((item: any) => (
                                            <li
                                                key={item.id}
                                                className="border-b py-2 flex items-center"
                                            >
                                                <img
                                                    src={item.product.image.split(",")[0]}
                                                    alt={item.product.title}
                                                    className="w-16 h-16 md:w-24 md:h-24 object-cover rounded mr-4"
                                                />
                                                <div className="flex-1 text-sm md:text-base">
                                                    <h4 className="font-semibold">
                                                        {item.product.title}
                                                    </h4>
                                                    <p>ขนาด: {item.inventory.size}ml</p>
                                                    <p>จำนวน: {item.quantity}</p>
                                                    <p>ราคา: ฿{Number(item.price).toFixed(2)}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => toggleDetails(order.id)}
                                        className="mt-2 text-black underline"
                                    >
                                        {expandedOrders.has(order.id)
                                            ? "ซ่อนรายละเอียด"
                                            : "แสดงรายละเอียด"}
                                    </button>

                                    {expandedOrders.has(order.id) && (
                                        <div className="mt-4 text-sm md:text-base">
                                            <p>
                                                <strong>รหัสการชำระเงิน:</strong>
                                                <span className="block md:inline md:truncate overflow-hidden md:max-w-xs">
                                                    {order.stripePaymentId}
                                                </span>
                                            </p>
                                            {order.promotionCode && (
                                                <p>
                                                    <strong>โค้ดส่วนลดที่ใช้:</strong>{" "}
                                                    {order.promotionCode.code}
                                                </p>
                                            )}
                                            {order.address && (
                                                <div className="mt-4">
                                                    <strong>ที่อยู่จัดส่ง:</strong>
                                                    <p>{order.address.recipient}</p>
                                                    <p>{order.address.phoneNumber}</p>
                                                    <p>{order.address.address}</p>
                                                    <p>
                                                        {order.address.district}, {order.address.province} {order.address.zipCode}, {order.address.country}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="flex justify-between mt-4">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={page === 0}
                                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                                >
                                    ก่อนหน้า
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={(page + 1) * ITEMS_PER_PAGE >= currentOrders.length}
                                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                                >
                                    ต่อไป
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderHistory;

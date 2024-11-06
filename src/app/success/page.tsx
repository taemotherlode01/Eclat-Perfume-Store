'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';
import { NextPage } from 'next';

const Success: NextPage = () => {
    const searchParams = useSearchParams();
    const session_id = searchParams.get('session_id');
    const { data: session, status } = useSession();
    const router = useRouter();

    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/signin');
            return;
        }

        const fetchOrderDetails = async () => {
            if (!session_id) return;
    
            try {
                const stripeResponse = await fetch(`/api/stripe-session?sessionId=${session_id}`);
                if (!stripeResponse.ok) {
                    throw new Error('Failed to fetch session details');
                }
                const stripeData = await stripeResponse.json();
    
                const { payment_status, metadata } = stripeData;
    
                // Fetch only the specific order using orderId
                const orderResponse = await fetch(`/api/orders/${metadata.userId}?orderId=${metadata.orderId}`);
                if (!orderResponse.ok) {
                    throw new Error('Failed to fetch order details');
                }
                const orderData = await orderResponse.json();
    
                setOrderDetails({
                    ...orderData,
                    paymentStatus: payment_status,
                });
                
                console.log(orderData); // Log to check the response structure
    
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };
    
        if (status === 'authenticated') {
            fetchOrderDetails();
        }
    }, [status, session_id, router]);

    if (status === 'loading' || loading) return <Loading />;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div>
            <Navbar />
            <div className="p-4 md:p-8 lg:p-12">
                <h1 className="text-2xl font-bold mb-4">การสั่งซื้อสำเร็จ</h1>
                <p className="mb-4">ขอบคุณที่สั่งซื้อกับเรา!</p>
                {orderDetails ? (
                    <div>
                        <h2 className="text-lg font-semibold mb-2">รายละเอียดคำสั่งซื้อ</h2>
                        <p><strong>รหัสการชำระเงิน:</strong> {orderDetails.stripePaymentId}</p>
                        <p><strong>สถานะการชำระเงิน:</strong> {orderDetails.paymentStatus || 'Unknown'}</p>
                        <p><strong>ยอดรวม:</strong> ฿{orderDetails.totalAmount.toFixed(2)}</p>

                        {/* Display the promotion code if it exists */}
                        {orderDetails.promotionCode && (
                            <p><strong>โค้ดส่วนลดที่ใช้:</strong> {orderDetails.promotionCode.code}</p>
                        )}

                        <h3 className="mt-4 mb-2">รายการสินค้า:</h3>
                        <ul>
                            {orderDetails.orderItems.map((item: any) => (
                                <li key={item.id} className="border-b py-2 flex items-center">
                                    <img src={item.product.image.split(',')[0]} alt={item.product.title} className="w-16 h-16 object-cover mr-4" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold">{item.product.title}</h4>
                                        <p>ขนาด: {item.inventory.size}ml</p>
                                        <p>จำนวน: {item.quantity}</p>
                                        <p>ราคา: ฿{Number(item.price).toFixed(2)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Buttons for Shop More and View Order History */}
                        <div className="mt-4">
                            <button
                                onClick={() => router.push('/products')} // Change '/shop' to your actual shop route
                                className="bg-black text-white py-2 px-4 rounded mr-4"
                            >
                                ช็อปต่อ
                            </button>
                            <button
                                onClick={() => router.push('/orders')} // Change '/order-history' to your actual order history route
                                className="bg-gray-300 text-black py-2 px-4 rounded"
                            >
                                ดูรายการสั่งซื้อ
                            </button>
                        </div>
                    </div>
                ) : (
                    <p>ไม่พบรายละเอียดคำสั่งซื้อ</p>
                )}
            </div>
        </div>
    );
};

export default Success;

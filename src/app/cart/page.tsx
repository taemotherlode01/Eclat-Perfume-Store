"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useSession } from "next-auth/react";
import Loading from "../components/Loading";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import Link from "next/link";

interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
  productId: number;
  size: number;
  inventoryId: number;
  stock: number;
}

interface Address {
  id: number;
  recipient: string;
  phoneNumber: string;
  address: string;
  district: string;
  province: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

const Cart: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [promotionCode, setPromotionCode] = useState<string>("");
  const [promotionError, setPromotionError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isAddressAlertOpen, setIsAddressAlertOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;
  const [userId, setUserId] = useState<string | undefined>(undefined); // New state for userId

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserId();
      fetchCartItems();
      fetchAddresses();
    } else if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  const fetchUserId = async () => {
    try {
      const response = await fetch("/api/user");
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้ได้");

      const data = await response.json();
      setUserId(data.id);
    } catch (error) {
      console.error("Failed to fetch user ID:", error);
      setError("ไม่พบรหัสผู้ใช้");
    }
  };

  const fetchCartItems = async () => {
    try {
      const response = await fetch("/api/cart");
      if (!response.ok) throw new Error("Failed to fetch cart items");

      const data = await response.json();
      const items = data.cartItems.map((item: any) => ({
        id: item.id,
        title: item.product.title,
        price: parseFloat(item.inventory.price),
        quantity: item.quantity,
        image: item.product.image.split(",")[0],
        productId: item.productId,
        size: item.inventory.size,
        inventoryId: item.inventoryId,
        stock: item.inventory.stock,
      }));

      setCartItems(items);
    } catch (error) {
      console.error("Failed to fetch cart items:", error);
      setError("Unable to fetch cart items");
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/addresses");
      if (!response.ok) throw new Error("Failed to fetch addresses");

      const data = await response.json();
      setAddresses(data);

      const defaultAddress = data.find((address: Address) => address.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setError("Unable to fetch addresses");
    }
  };

  const handleDeleteItem = async (inventoryId: number) => {
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId }),
      });

      if (!response.ok) throw new Error("Failed to remove item from cart");
      fetchCartItems();
    } catch (error) {
      console.error("Error deleting item from cart:", error);
      setError("Unable to remove item from cart");
    }
  };

  const updateQuantity = async (inventoryId: number, newQuantity: number, stock: number) => {
    if (newQuantity <= 0 || newQuantity > stock) return;

    try {
      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId, quantity: newQuantity }),
      });

      if (!response.ok) throw new Error("Failed to update item quantity");
      fetchCartItems();
    } catch (error) {
      console.error("Error updating item quantity:", error);
      setError("Unable to update item quantity");
    }
  };

  const applyPromotionCode = async () => {
    try {
      if (!userId) {
        setPromotionError("ไม่พบรหัสผู้ใช้");
        return;
      }
      const validateResponse = await fetch("/api/promotion-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promotionCode,
          userId,
        }),
      });

      if (!validateResponse.ok) throw new Error("โค้ดผิดหรือหมดอายุแล้ว");

      const validateData = await validateResponse.json();

      const usageResponse = await fetch("/api/promotion-codes/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promotionCode,
          userId,
        }),
      });

      const usageData = await usageResponse.json();

      if (usageData.used) {
        setPromotionError("โค้ดส่วนลดนี้ถูกใช้ไปแล้ว");
        setDiscount(0);
        return;
      }

      const discountAmount =
        cartItems
          .filter((item) => selectedItems.includes(item.id))
          .reduce((total, item) => total + item.price * item.quantity, 0) *
        (validateData.discountPercentage / 100);

      setDiscount(discountAmount);
      setPromotionError(null);
    } catch (error) {
      console.error("Error applying promotion code:", error);
      setPromotionError("โค้ดผิดหรือหมดอายุแล้ว");
      setDiscount(0);
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(cartItems.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  if (status === "loading" || loading) return <Loading />;
  if (error) return <div>{error}</div>;

  const totalAmount = cartItems
    .filter((item) => selectedItems.includes(item.id))
    .reduce((total, item) => total + item.price * item.quantity, 0);
  const uniqueItemsInCart = new Set(
    cartItems.map((item) => `${item.productId}-${item.size}`)
  ).size;
  const totalSelectedItems = selectedItems.length;

  const handleCheckout = () => {
    if (!selectedAddress) {
      setIsAddressAlertOpen(true);
      return;
    }
    if (selectedItems.length === 0) {
      alert("กรุณาเลือกสินค้าก่อนทำการสั่งซื้อ");
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const confirmCheckout = async () => {
    try {
      if (!userId) {
        alert("ไม่พบรหัสผู้ใช้");
        return;
      }
      if (!selectedAddress) {
        alert("กรุณาเลือกที่อยู่ก่อนทำการสั่งซื้อ");
        return;
      }

      const amountToPay = (totalAmount - discount).toFixed(2);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems,
          addressId: selectedAddress.id,
          selectedItems,
          userId,
          amountToPay,
          promotionCode,
        }),
      });

      if (!response.ok) throw new Error("Failed to initiate checkout");

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error during checkout:", error);
      setError("ไม่สามารถดำเนินการสั่งซื้อได้");
    } finally {
      setIsConfirmModalOpen(false);
    }
  };

  const cancelCheckout = () => {
    setIsConfirmModalOpen(false);
  };

  const totalPages = Math.ceil(addresses.length / itemsPerPage);
  const currentAddresses = addresses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="p-4 md:p-8 lg:p-12">
        <div className="py-8 px-4 md:px-8 lg:px-12 border rounded-lg">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4">
            ตะกร้าสินค้า ({uniqueItemsInCart} รายการ)
          </h1>
          <div className="flex items-center mb-4 text-sm md:text-base lg:text-lg">
            <input
              type="checkbox"
              className="mr-2 custom-checkbox"
              onChange={(e) => handleSelectAll(e.target.checked)}
              checked={selectedItems.length === cartItems.length}
            />
            <span>เลือกทั้งหมด</span>
          </div>

          <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 flex items-center flex-wrap md:flex-nowrap"
                  >
                    <input
                      type="checkbox"
                      className="mr-6 custom-checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                    />
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-20 h-20 object-cover mr-4 mb-4 md:mb-0"
                    />
                    <div className="flex-1">
                      <h2 className="font-bold text-base md:text-lg">
                        {item.title}
                      </h2>
                      <p className="text-xs md:text-sm lg:text-base text-gray-500">
                        รหัสสินค้า: {item.productId}
                      </p>
                      <p className="text-xs md:text-sm lg:text-base text-gray-500">
                        ขนาด: {item.size}ml
                      </p>
                    </div>
                    <div className="text-red-500 font-bold text-sm md:text-lg mx-4">
                      ฿{item.price}
                    </div>
                    <div className="flex items-center border rounded">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.inventoryId,
                            item.quantity - 1,
                            item.stock
                          )
                        }
                        className="px-2"
                      >
                        -
                      </button>
                      <span className="px-4 text-sm md:text-base">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.inventoryId,
                            item.quantity + 1,
                            item.stock
                          )
                        }
                        className={`px-2 ${
                          item.quantity >= item.stock
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={item.quantity >= item.stock}
                      >
                        +
                      </button>
                    </div>
                    {item.quantity >= item.stock && (
                      <span className="text-xs md:text-sm text-red-500 ml-2">
                        จำนวนสูงสุดแล้ว
                      </span>
                    )}
                    <button
                      className="bg-gray-300 p-2 rounded ml-4"
                      onClick={() => handleDeleteItem(item.inventoryId)}
                    >
                      <Icon icon="mdi:trash" className="text-2xl" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-bold mb-2">เลือกที่อยู่</h2>
                {selectedAddress ? (
                  <div>
                    <p>{selectedAddress.recipient}</p>
                    <p>{selectedAddress.phoneNumber}</p>
                    <p>
                      {selectedAddress.address}, {selectedAddress.district},{" "}
                      {selectedAddress.province}, {selectedAddress.zipCode},{" "}
                      {selectedAddress.country}
                    </p>
                  </div>
                ) : (
                  <p>ไม่ได้เลือกที่อยู่</p>
                )}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 text-black underline"
                >
                  ดูเพิ่มเติม
                </button>
                <Link
                  href="/manage-addresses"
                  className="mt-2 ml-2 text-black underline"
                >
                  จัดการที่อยู่
                </Link>
              </div>

              {/* Address Modal */}
              {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                  <div className="bg-white p-4 rounded-lg w-11/12 md:w-1/2">
                    <h2 className="text-lg font-bold mb-2">เลือกที่อยู่</h2>
                    {currentAddresses.map((address) => (
                      <div
                        key={address.id}
                        className="flex items-center border-b py-2"
                      >
                        <input
                          type="radio"
                          name="address"
                          className="mr-2"
                          onChange={() => setSelectedAddress(address)}
                        />
                        <div>
                          <p>{address.recipient}</p>
                          <p>{address.phoneNumber}</p>
                          <p>
                            {address.address}, {address.district},{" "}
                            {address.province}, {address.zipCode},{" "}
                            {address.country}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between mt-4">
                      <button
                        onClick={handlePreviousPage}
                        className={`py-2 px-4 rounded ${
                          currentPage === 1
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={currentPage === 1}
                      >
                        ก่อนหน้า
                      </button>
                      <button
                        onClick={handleNextPage}
                        className={`py-2 px-4 rounded ${
                          currentPage === totalPages
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={currentPage === totalPages}
                      >
                        ถัดไป
                      </button>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="mt-4 bg-gray-300 py-2 px-4 rounded"
                    >
                      ปิด
                    </button>
                  </div>
                </div>
              )}

              <div className="border rounded-lg p-6 mt-4">
                <h2 className="font-bold text-lg md:text-xl lg:text-2xl mb-2">
                  สรุปรายการสั่งซื้อ
                </h2>

                {/* Promotion Code Input */}
                <div className="flex mb-4">
                  <input
                    type="text"
                    placeholder="กรอกโค้ดส่วนลด"
                    className="w-3/4 border rounded p-1.5 mr-1"
                    value={promotionCode}
                    onChange={(e) => setPromotionCode(e.target.value)}
                  />
                  <button
                    onClick={applyPromotionCode}
                    className="bg-black text-white py-1.5 px-3 text-sm hover:bg-gray-800 transition duration-300"
                  >
                    ใช้โค้ด
                  </button>
                </div>
                {promotionError && (
                  <p className="text-red-500 text-sm mb-2">{promotionError}</p>
                )}

                <p className="text-sm md:text-base">
                  จำนวนสินค้าทั้งหมด: {totalSelectedItems} รายการ
                </p>
                <div className="flex justify-between my-2 text-sm md:text-base lg:text-lg">
                  <span>ยอดรวมสินค้า</span>
                  <span>฿{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between my-2 text-sm md:text-base lg:text-lg">
                  <span>ส่วนลดคูปอง / โปรโมชันโค้ด</span>
                  <span>
                    {discount > 0
                      ? `-฿${discount.toFixed(2)}`
                      : `฿${discount.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg md:text-xl lg:text-2xl my-2">
                  <span>ยอดที่ต้องชำระ</span>
                  <span>฿{(totalAmount - discount).toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="bg-black text-white py-2 px-4 w-full mt-4 text-sm md:text-base lg:text-lg"
                >
                  สั่งซื้อและชำระเงิน
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Alert Modal */}
      {isAddressAlertOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded-lg w-11/12 md:w-1/2 animate-modal">
            <h2 className="text-lg font-bold mb-2">การแจ้งเตือน</h2>
            <p>กรุณาเลือกที่อยู่ก่อนที่จะทำการสั่งซื้อ</p>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setIsAddressAlertOpen(false)}
                className="py-2 px-4 bg-gray-300 rounded"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 ">
          <div className="bg-white p-4 rounded-lg w-11/12 md:w-1/2 animate-modal">
            <h2 className="text-lg font-bold mb-2">ยืนยันการสั่งซื้อ</h2>
            <p>คุณแน่ใจหรือว่าต้องการสั่งซื้อสินค้านี้?</p>
            <div className="flex justify-between mt-4">
              <button
                onClick={cancelCheckout}
                className="py-2 px-4 bg-gray-300 rounded"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmCheckout}
                className="py-2 px-4 bg-black text-white rounded"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;

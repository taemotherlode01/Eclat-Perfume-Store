'use client';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const tokenParam = searchParams.get("token");
      const emailParam = searchParams.get("email");

      if (!tokenParam || !emailParam) {
        router.push("/signin");
      } else {
        setToken(tokenParam);
        setEmail(emailParam);
      }
    }
  }, [router]);

  const isSequentialPassword = (password: string) => {
    const sequentialNumbers = /(0123456789|123456789|987654321|01234|12345|23456|34567|45678|56789|67890)/;
    const sequentialLetters = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i;
    return sequentialNumbers.test(password) || sequentialLetters.test(password);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setErrorMessage("รหัสผ่านทั้งสองไม่ตรงกัน");
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setErrorMessage("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และต้องมีตัวเลขและตัวอักษรผสมกัน");
      return;
    }

    if (isSequentialPassword(newPassword)) {
      setErrorMessage("รหัสผ่านไม่ควรมีลำดับตัวเลขหรืออักษรที่คาดเดาได้ เช่น 12345 หรือ abcdef");
      return;
    }

    if (!token || !email) {
      setErrorMessage("ข้อมูลไม่สมบูรณ์");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, email, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("รีเซ็ตรหัสผ่านสำเร็จ");
        setErrorMessage("");
        setTimeout(() => router.push("/signin"), 1000);
      } else {
        setErrorMessage(data.error || "ไม่สามารถรีเซ็ตรหัสผ่านได้");
      }
    } catch (error) {
      setErrorMessage("เกิดข้อผิดพลาดขณะรีเซ็ตรหัสผ่าน");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">       
      <div className="max-w-2xl w-full space-y-8 bg-white p-4 md:p-8 border border-black"> {/* เพิ่ม p-4 สำหรับ mobile */}
          <h2 className="text-3xl font-bold text-black mb-6">รีเซ็ตรหัสผ่าน</h2>
          <form className="space-y-6" onSubmit={handleResetPassword}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <label htmlFor="newPassword" className="block text-xl font-bold sm:w-1/3 w-full">
                รหัสผ่านใหม่
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="mt-1 block sm:w-2/3 w-full px-3 py-4 border border-gray-300"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <label htmlFor="confirmPassword" className="block text-xl font-bold sm:w-1/3 w-full">
                ยืนยันรหัสผ่านใหม่
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block sm:w-2/3 w-full px-3 py-4 border border-gray-300"
              />
            </div>

            {errorMessage && (
              <p className="text-red-600 text-sm">{errorMessage}</p>
            )}
            {successMessage && (
              <p className="text-green-600 text-sm mt-4">{successMessage}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`py-3 px-4 w-full text-lg font-bold text-white ${
                isSubmitting ? "bg-gray-500" : "bg-black hover:bg-gray-800"
              }`}
            >
              {isSubmitting ? "กำลังรีเซ็ตรหัสผ่าน..." : "รีเซ็ตรหัสผ่าน"}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResetPassword;

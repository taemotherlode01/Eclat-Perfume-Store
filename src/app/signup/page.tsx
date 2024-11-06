'use client';
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Link from "next/link";
import Footer from "../components/Footer";

const SignUp: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false); // State สำหรับสถานะการโหลด
  const router = useRouter();

  const isSequentialPassword = (password: string) => {
    const sequentialNumbers = /(0123456789|123456789|987654321|01234|12345|23456|34567|45678|56789|67890)/;
    const sequentialLetters = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i;
    return sequentialNumbers.test(password) || sequentialLetters.test(password);
  };

  const isValidEmailFormat = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format validation
    return emailRegex.test(email);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
  
    setErrorMessage("");
    setSuccessMessage("");
  
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setErrorMessage("กรุณากรอกข้อมูลทุกช่อง");
      return;
    }
  
    if (!isValidEmailFormat(email)) {
      setErrorMessage("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }
  
    if (password !== confirmPassword) {
      setErrorMessage("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
  
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMessage("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และต้องมีตัวเลขและตัวอักษรผสมกัน");
      return;
    }
  
    if (isSequentialPassword(password)) {
      setErrorMessage("รหัสผ่านไม่ควรมีลำดับตัวเลขหรืออักษรที่คาดเดาได้ เช่น 12345 หรือ abcdef");
      return;
    }
  
    const name = `${firstName} ${lastName}`;
  
    setLoading(true);
  
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        localStorage.setItem("registeredEmail", email);
        setSuccessMessage("ลงทะเบียนสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อทำการยืนยัน.");
        setTimeout(() => {
          setLoading(false);
          router.push("/waiting-for-verification");
        }, 2000);
      } else {
        setErrorMessage(data.error || "การลงทะเบียนล้มเหลว");
        setLoading(false);
      }
    } catch (error) {
      setErrorMessage("เกิดข้อผิดพลาดในการลงทะเบียน");
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8 bg-white p-4 md:p-8 border border-black"> {/* เพิ่ม p-4 สำหรับ mobile */}
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">สร้างบัญชีผู้ใช้ใหม่</h2>
          <form className="space-y-6" onSubmit={handleSignUp}>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <label htmlFor="firstName" className="block text-lg md:text-xl font-bold w-full md:w-1/3">
                ชื่อจริง
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-1 block w-full md:w-2/3 px-3 py-4 border border-gray-300"
              />
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <label htmlFor="lastName" className="block text-lg md:text-xl font-bold w-full md:w-1/3">
                นามสกุล
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="mt-1 block w-full md:w-2/3 px-3 py-4 border border-gray-300"
              />
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <label htmlFor="email" className="block text-lg md:text-xl font-bold w-full md:w-1/3">
                อีเมล
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full md:w-2/3 px-3 py-4 border border-gray-300"
              />
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <label htmlFor="password" className="block text-lg md:text-xl font-bold w-full md:w-1/3">
                รหัสผ่าน
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full md:w-2/3 px-3 py-4 border border-gray-300"
              />
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <label htmlFor="confirmPassword" className="block text-lg md:text-xl font-bold w-full md:w-1/3">
                ยืนยันรหัสผ่าน
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full md:w-2/3 px-3 py-4 border border-gray-300"
              />
            </div>

            {errorMessage && (
              <p className="text-red-600 text-sm">{errorMessage}</p>
            )}

            {successMessage && (
              <p className="text-green-600 text-sm mt-4">{successMessage}</p>
            )}

            <p className="text-xs text-gray-500 mt-6">
              โดยการดำเนินการต่อ คุณยอมรับ 
              นโยบายความเป็นส่วนตัว 
              และ 
              คุกกี้และเงื่อนไข
              ของเรา
            </p>

            <button
              type="submit"
              className={`py-3 px-4 w-full text-lg font-bold text-white ${loading ? 'bg-gray-500' : 'bg-black hover:bg-gray-800'}`}
              disabled={loading}
            >
              {loading ? "โปรดรอ..." : "สร้างบัญชีผู้ใช้ใหม่"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignUp;

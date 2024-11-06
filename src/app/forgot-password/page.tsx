'use client';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState<number>(0);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage("ลิงค์สำหรับรีเซ็ตรหัสผ่านได้ถูกส่งไปยังอีเมลของคุณแล้ว");
        setErrorMessage("");
        setIsDisabled(true);
        const cooldownTime = Date.now() + 300000;
        localStorage.setItem("cooldownEndTime", cooldownTime.toString());
        setTimer(300);
      } else {
        setErrorMessage(data.error || "ไม่สามารถดำเนินการได้");
      }
    } catch (error) {
      setErrorMessage("เกิดข้อผิดพลาดขณะส่งคำขอ");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const storedCooldownEndTime = localStorage.getItem("cooldownEndTime");

    if (storedCooldownEndTime) {
      const remainingTime = Math.floor(
        (parseInt(storedCooldownEndTime) - Date.now()) / 1000
      );

      if (remainingTime > 0) {
        setIsDisabled(true);
        setTimer(remainingTime);
      } else {
        setIsDisabled(false);
        localStorage.removeItem("cooldownEndTime");
      }
    }
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(countdown);
    } else if (timer === 0 && isDisabled) {
      setIsDisabled(false);
      localStorage.removeItem("cooldownEndTime");
    }
  }, [timer, isDisabled]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">       
         <div className="max-w-2xl w-full space-y-8 bg-white p-4 md:p-8 border border-black"> {/* เพิ่ม p-4 สำหรับ mobile */}
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">ลืมรหัสผ่าน</h2>
          <form className="space-y-6" onSubmit={handleForgotPassword}>
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

            {errorMessage && (
              <p className="text-red-600 text-sm">{errorMessage}</p>
            )}
            {successMessage && (
              <p className="text-green-600 text-sm mt-4">{successMessage}</p>
            )}

            <button
              type="submit"
              className="py-3 px-4 w-full text-lg font-bold text-white bg-black hover:bg-gray-800 disabled:bg-gray-400"
              disabled={isDisabled || isSubmitting}
            >
              {isSubmitting
                ? "กำลังส่งโปรดรอ..."
                : isDisabled
                ? `กรุณารอ ${Math.floor(timer / 60)}:${('0' + (timer % 60)).slice(-2)} นาที`
                : "รีเซ็ตรหัสผ่าน"}
            </button>

            <p className="text-xs text-gray-500 mt-6">
              กรุณาตรวจสอบอีเมลของคุณหลังจากกดปุ่มรีเซ็ตรหัสผ่าน คุณจะได้รับลิงค์สำหรับตั้งรหัสผ่านใหม่
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;

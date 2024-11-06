"use client";
import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Footer from "../components/Footer";

const SignIn: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      const userRole = (session?.user as any)?.role; // Assume role is part of session user object
      if (userRole === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/userInfo"); // Default for regular users
      }
    }
  }, [session, router]);

  const handleShowPasswordChange = () => {
    setShowPassword((prevState) => !prevState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setErrorMessage("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } else {
      router.push("/"); // This will be handled by the useEffect after session updates
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>; // Add a loader while the session is loading
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full bg-white border py-3 border-black grid grid-cols-1 lg:grid-cols-2">
          {/* Sign in Section */}
          <div className="p-6 lg:p-8 py-4">
            <h2 className="text-3xl font-bold mb-6">เข้าสู่ระบบ</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-xl lg:text-2xl font-bold"
                >
                  อีเมล*
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full h-12 lg:h-16 px-3 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm lg:text-lg"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xl lg:text-2xl font-bold"
                >
                  รหัสผ่าน*
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full h-12 lg:h-16 px-3 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm lg:text-lg"
                />
              </div>

              {errorMessage && (
                <p className="text-red-600 text-sm lg:text-base">
                  {errorMessage}
                </p>
              )}

              <div className="flex items-center justify-between">
                <label
                  htmlFor="show-password"
                  className="cursor-pointer relative flex items-center space-x-2"
                >
                  <div className="relative">
                    <input
                      id="show-password"
                      type="checkbox"
                      onChange={handleShowPasswordChange}
                      checked={showPassword}
                      className="h-6 w-6 appearance-none border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <Icon
                      icon="codicon:check"
                      className={`text-black absolute inset-0 flex items-center justify-center text-2xl transition-opacity ${
                        showPassword ? "text-opacity-100" : "text-opacity-0"
                      }`}
                    />
                  </div>
                  <span className="select-none text-sm lg:text-base">
                    แสดงรหัสผ่าน
                  </span>
                </label>

                <div className="text-sm lg:text-base">
                  <Link
                    href="/forgot-password"
                    className="font-medium text-black underline hover:text-black"
                  >
                    ลืมรหัสผ่าน
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative flex justify-center py-2 px-4 lg:py-3 lg:px-5 border border-transparent text-base lg:text-lg font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  เข้าสู่ระบบ
                </button>
              </div>

              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm lg:text-base">
                  <span className="px-2 bg-white text-gray-500">หรือ</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <button
                  type="button"
                  onClick={() => signIn("google")}
                  className="w-full sm:w-1/2 flex items-center justify-center py-2 lg:py-3 px-4 border border-gray-300 shadow-sm text-sm lg:text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Icon icon="devicon:google" className="text-2xl" />
                  <span className="flex-grow text-center">GOOGLE</span>
                </button>
                <button
                  type="button"
                  onClick={() => signIn("facebook")}
                  className="w-full sm:w-1/2 flex items-center justify-center py-2 lg:py-3 px-4 border border-gray-300 shadow-sm text-sm lg:text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Icon icon="logos:facebook" className="text-2xl" />
                  <span className="flex-grow text-center">FACEBOOK</span>
                </button>
              </div>

              {error === "OAuthAccountNotLinked" && (
                <p className="text-red-600 text-sm lg:text-base mt-2">
                  กรุณาเข้าสู่ระบบด้วยบัญชีที่เชื่อมต่อกับผู้ให้บริการนี้แล้ว
                </p>
              )}

              {error && error !== "OAuthAccountNotLinked" && (
                <p className="text-red-600 text-sm lg:text-base mt-2">
                  เกิดข้อผิดพลาดในการเข้าสู่ระบบ
                </p>
              )}

<p className="text-xs text-gray-500 mt-6">
                โดยการดำเนินการต่อ คุณยอมรับ{" "}
                <Link
                  href="/privacy-policy"
                  className="text-black underline"
                >
                  นโยบายความเป็นส่วนตัว
                </Link>{" "}
                และ <span>คุกกี้และเงื่อนไข</span> ของเรา
              </p>
            </form>
          </div>

          {/* Sign up Section */}
          <div className="p-6 lg:p-8 pt-4 lg:border-l border-t lg:border-t-0 border-black">
            <h2 className="text-3xl font-bold mb-6">สร้างบัญชีผู้ใช้ใหม่</h2>
            <p className="text-sm lg:text-base mb-4">
              สร้างบัญชีผู้ใช้เพื่อเพลิดเพลินไปกับสิทธิพิเศษมากมาย
            </p>
            <Link href="/signup">
              <button
                type="button"
                className="py-2 lg:py-3 px-4 border border-transparent text-base lg:text-lg font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                สร้างบัญชีผู้ใช้ใหม่
              </button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SignIn;

// pages/UserInfo.tsx
'use client';
import toast, { Toaster } from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useSession } from 'next-auth/react'; 
import { useRouter } from 'next/navigation'; 
import Loading from '../components/Loading';
import SidebarUser from '../components/SidebarUser';

// กำหนด interface สำหรับ user และ session
interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: 'ADMIN' | 'USER'; // เพิ่ม role เพื่อระบุบทบาท
}

interface Session {
  user: User;
}

const UserInfo: React.FC = () => {
  // ใช้ type assertion เพื่อระบุประเภทของ session
  const { data: session, status } = useSession() as { data: Session | null; status: string };
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({
    id: '', 
    name: '',
    createdAt: '',
    email: '',
    password: '',
    provider: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isOAuthProvider = userInfo.provider && userInfo.provider !== 'credentials';

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/user');
      const data = await response.json();
      const [firstName, lastName] = data.name.split(' ');
      setUserInfo({
        ...data,
        password: '',
      });
      setNewFirstName(firstName);
      setNewLastName(lastName);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserInfo();
    } else if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <Loading />;
  }

  // ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
  const isAdmin = session?.user?.role === 'ADMIN';

  if (isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
      <Navbar />
      <div className="p-6 md:p-10 border border-black text-center shadow-lg w-11/12 md:w-1/2 lg:w-1/3">
        <h2 className="text-4xl font-bold mb-4">Hello, {session.user?.name}</h2>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-700 transform transition-transform duration-300 hover:scale-105"
        >
          เข้าสู่ dashboard admin
        </button>
      </div>
    </div>
    );
  }

  // UI สำหรับผู้ใช้ทั่วไป
  const handleEdit = (field: string) => {
    setEditField(field);
    setIsModalOpen(true);
    setErrorMessage('');
  };

  const isValidPassword = (password: string) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
  };

  const isSequentialPassword = (password: string) => {
    const sequentialNumbers = /(0123456789|123456789|987654321|01234|12345|23456|34567|45678|56789|67890)/;
    const sequentialLetters = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i;
    return sequentialNumbers.test(password) || sequentialLetters.test(password);
  };

  const handleSave = async () => {
    const userIdParam = userInfo.id;

    if (editField === 'name') {
      if (!newFirstName.trim() || !newLastName.trim()) {
        setErrorMessage('กรุณากรอกชื่อและนามสกุลให้ครบถ้วน');
        return;
      }

      const updatedName = `${newFirstName} ${newLastName}`;
      const updatedInfo = { ...userInfo, name: updatedName };

      try {
        const response = await fetch('/api/user', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            name: updatedName,
            userIdParam,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update name');
        }

        setUserInfo(updatedInfo);
        toast.success('เปลี่ยนชื่อสำเร็จ');
      } catch (error) {
        setErrorMessage('เกิดข้อผิดพลาดในการอัปเดตชื่อ');
      }
    }

    if (editField === 'password') {
      if (newPassword !== confirmPassword) {
        setErrorMessage('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
        return;
      }

      if (!isValidPassword(newPassword)) {
        setErrorMessage('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และต้องมีตัวเลขและตัวอักษรผสมกัน');
        return;
      }

      if (isSequentialPassword(newPassword)) {
        setErrorMessage('รหัสผ่านไม่ควรมีลำดับตัวเลขหรืออักษรที่คาดเดาได้ เช่น 12345 หรือ abcdef');
        return;
      }

      try {
        const response = await fetch('/api/user', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: newPassword,
            userIdParam,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update password');
        }

        const updatedInfo = { ...userInfo, password: '' };
        setUserInfo(updatedInfo);
        toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      } catch (error) {
        setErrorMessage('เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน');
        toast.error('เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน');
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen p-6">
      <Navbar />
      <Toaster />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
        <SidebarUser /> {/* Sidebar component for non-admin */}

        <div className="col-span-1 md:col-span-3 p-4 border border-black">
          <h2 className="text-2xl font-bold mb-4">รายละเอียดของฉัน</h2>
          <p className="text-sm text-gray-600 mb-4">
            คุณสามารถแก้ไขรายละเอียดของคุณด้านล่างเพื่อให้ข้อมูลบัญชีของคุณเป็นปัจจุบัน
          </p>

          {/* Personal Details */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">รายละเอียด</h3>
            <div className="mb-4">
              <span className="font-semibold">ชื่อ:</span> {userInfo.name}{" "}
              <button
                onClick={() => handleEdit("name")}
                className="text-black underline ml-2"
              >
                แก้ไข
              </button>
            </div>
            <div className="mb-4">
              <span className="font-semibold">วันที่สมัคร:</span>{" "}
              {new Date(userInfo.createdAt).toLocaleDateString("th-TH", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}{" "}
            </div>
          </div>

          {/* Login Information */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">ข้อมูลเข้าสู่ระบบ</h3>
            <div className="mb-4">
              <span className="font-semibold">อีเมล:</span> {userInfo.email}
            </div>

            {isOAuthProvider ? (
              <div className="mb-4">
                <span className="font-semibold">เข้าสู่ระบบผ่าน:</span> {userInfo.provider}
              </div>
            ) : (
              <div className="mb-4">
                <span className="font-semibold">รหัสผ่าน: *******</span> {userInfo.password}{" "}
                <button
                  onClick={() => handleEdit("password")}
                  className="text-black underline ml-2"
                >
                  แก้ไข
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg mx-4 md:mx-0 transition-transform transform scale-95 opacity-0 animate-modal">
            {editField === "name" ? (
              <>
                <h2 className="text-xl mb-4">แก้ไขชื่อและนามสกุล</h2>
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="border p-2 w-full mb-2"
                  placeholder="ชื่อจริง"
                />
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="border p-2 w-full"
                  placeholder="นามสกุล"
                />
                {errorMessage && <p className="text-red-600">{errorMessage}</p>}
              </>
            ) : (
              <>
                <h2 className="text-xl mb-4">แก้ไขรหัสผ่าน</h2>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border p-2 w-full mb-2"
                  placeholder="รหัสผ่านใหม่"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border p-2 w-full"
                  placeholder="ยืนยันรหัสผ่านใหม่"
                />
                {errorMessage && <p className="text-red-600">{errorMessage}</p>}
              </>
            )}

            <div className="mt-4 flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                className="bg-black text-white px-4 py-2 rounded"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInfo;

// pages/email-verification-success.tsx
import React from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Icon } from '@iconify/react';

const EmailVerificationSuccess: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">       
      <div className="max-w-2xl w-full space-y-8 bg-white p-4 md:p-8 border border-black"> {/* เพิ่ม p-4 สำหรับ mobile */}
          <div className="flex justify-center">
            <Icon icon="ooui:success" className="w-16 h-16 text-green-500" /> {/* เพิ่มไอคอน */}
          </div>
          <h2 className="text-2xl font-bold text-center text-black mb-6">
            ยืนยันอีเมลเรียบร้อยแล้ว!
          </h2>
          <p className="text-center text-lg">
            ตอนนี้คุณสามารถเข้าสู่ระบบได้แล้ว
          </p>
          <Link href="/signin">
            <div className="block text-center text-lg text-white bg-black py-2 mt-6 hover:bg-gray-800">
              ไปที่หน้าล็อกอิน
            </div>
          </Link>
          <Link href="/">
            <div className="block text-center text-lg text-white bg-black py-2 mt-2 hover:bg-gray-800">
              กลับไปหน้าแรก
            </div>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EmailVerificationSuccess;

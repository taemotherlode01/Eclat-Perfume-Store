'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // ใช้ useRouter จาก next/navigation แทน next/router
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const WaitingForVerification: React.FC = () => {
  const router = useRouter(); // ใช้ useRouter ในการจัดการการเปลี่ยนหน้า
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [isCooldown, setIsCooldown] = useState<boolean>(false);
  const [cooldownTime, setCooldownTime] = useState<number>(0);

  const COOLDOWN_PERIOD = 180000; // 3 minutes in milliseconds
  const CHECK_VERIFICATION_INTERVAL = 10000; // Check every 10 seconds

  useEffect(() => {
    const storedEmail = localStorage.getItem('registeredEmail') || '';
    if (!storedEmail) {
      // ถ้าไม่มี registeredEmail ให้ redirect ผู้ใช้ไปหน้า signup
      router.push('/signup');
    } else {
      setEmail(storedEmail);
    }

    const lastResendTimestamp = localStorage.getItem('lastResendTimestamp');
    if (lastResendTimestamp) {
      const timeSinceLastResend = Date.now() - parseInt(lastResendTimestamp);
      if (timeSinceLastResend < COOLDOWN_PERIOD) {
        setIsCooldown(true);
        setCooldownTime(Math.ceil((COOLDOWN_PERIOD - timeSinceLastResend) / 1000));
      }
    }
  }, [router]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isCooldown) {
      interval = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            setIsCooldown(false);
            localStorage.removeItem('lastResendTimestamp');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCooldown]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (email) {
        try {
          const response = await fetch(`/api/auth/check-email-verification?email=${email}`);
          const data = await response.json();

          if (data.emailVerified) {
            // ลบอีเมลจาก localStorage เมื่อยืนยันสำเร็จ
            localStorage.removeItem('registeredEmail');
            // Redirect to the signup success page
            router.push('/signin');
          }
        } catch (error) {
          console.error('Error checking email verification status:', error);
        }
      }
    }, CHECK_VERIFICATION_INTERVAL);

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [email, router]);

  const handleResendEmail = async () => {
    try {
      if (!email) {
        setResendStatus('error');
        return;
      }

      setResendStatus('loading');
      const response = await fetch('/api/auth/resend-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendStatus('success');
        const currentTimestamp = Date.now();
        localStorage.setItem('lastResendTimestamp', currentTimestamp.toString());
        setIsCooldown(true);
        setCooldownTime(COOLDOWN_PERIOD / 1000);
      } else {
        setResendStatus('error');
      }
    } catch (error) {
      setResendStatus('error');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">       
      <div className="max-w-2xl w-full space-y-8 bg-white p-4 md:p-8 border border-black"> {/* เพิ่ม p-4 สำหรับ mobile */}
          <h2 className="text-2xl font-bold text-center text-black mb-6">รอการยืนยันอีเมล</h2>
          <p className="text-center text-lg">ขอบคุณที่ลงทะเบียน! กรุณาตรวจสอบอีเมลของคุณเพื่อทำการยืนยันบัญชี</p>
          <p className="text-center text-sm text-gray-500 mt-4">
            หากคุณไม่ได้รับอีเมลยืนยัน{' '}
            <button
              onClick={handleResendEmail}
              className="underline text-blue-600 hover:text-blue-800"
              disabled={resendStatus === 'loading' || isCooldown}
            >
              {isCooldown ? `กรุณารอ ${cooldownTime} วินาที` : 'คลิกที่นี่'}
            </button>{' '}
            เพื่อส่งอีเมลยืนยันใหม่
          </p>
          {resendStatus === 'success' && (
            <p className="text-center text-green-500 mt-2">อีเมลยืนยันใหม่ถูกส่งแล้ว กรุณาตรวจสอบอีเมลของคุณ</p>
          )}
          {resendStatus === 'error' && (
            <p className="text-center text-red-500 mt-2">เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองอีกครั้ง</p>
          )}
          <Link href="/" className="block text-center text-lg text-white bg-black py-2 mt-6 hover:bg-gray-800">
            กลับไปหน้าแรก
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default WaitingForVerification;

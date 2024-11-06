'use client';
import Navbar from '../components/Navbar';
import { NextPage } from 'next';
import Link from 'next/link';
const PrivacyPolicy: NextPage = () => {
    return (
        <div>
            <Navbar />
            <div className="p-4 md:p-8 lg:p-12 max-w-3xl mx-auto max-w-full overflow-hidden">
            <Link
                  href="/signin"
                  className="text-black underline"
                >
                  ไปที่หน้า Login
                </Link>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 mt-4">นโยบายความเป็นส่วนตัว</h1>
                <p className="mb-4 text-sm md:text-base break-words">
                    ยินดีต้อนรับสู่ eclat! ความเป็นส่วนตัวของคุณมีความสำคัญกับเรา และนโยบายนี้จะอธิบายถึงการรวบรวม ใช้งาน และการคุ้มครองข้อมูลส่วนบุคคลของคุณเมื่อคุณเข้าชมเว็บไซต์ของเรา
                </p>

                <h2 className="text-lg md:text-xl font-semibold mt-4 mb-2">1. ข้อมูลที่เรารวบรวม</h2>
                <p className="text-sm md:text-base break-words">เราอาจรวบรวมข้อมูลส่วนบุคคลจากคุณ รวมถึง:</p>
                <ul className="list-disc ml-6 text-sm md:text-base break-words">
                    <li>ชื่อและอีเมล ซึ่งใช้ในการสร้างบัญชีและการเข้าสู่ระบบผ่าน Facebook หรือ Google</li>
                    <li>ข้อมูลคำสั่งซื้อ เช่น ที่อยู่การจัดส่งและรายละเอียดการชำระเงิน</li>
                </ul>

                <h2 className="text-lg md:text-xl font-semibold mt-4 mb-2">2. การเข้าสู่ระบบผ่าน Facebook และ Google</h2>
                <p className="text-sm md:text-base break-words">
                    เราให้บริการเข้าสู่ระบบผ่าน Facebook และ Google ซึ่งทำให้คุณสามารถเข้าสู่ระบบได้อย่างสะดวก เมื่อใช้ฟีเจอร์นี้ Facebook และ Google อาจแชร์ข้อมูลบางส่วนกับเรา เช่น ชื่อและอีเมล ข้อมูลนี้จะถูกใช้ในการสร้างบัญชีและช่วยให้เราปรับปรุงประสบการณ์การใช้งานของคุณบนเว็บไซต์
                </p>

                <h2 className="text-lg md:text-xl font-semibold mt-4 mb-2">3. วัตถุประสงค์ในการใช้ข้อมูล</h2>
                <p className="text-sm md:text-base break-words">ข้อมูลของคุณจะถูกใช้เพื่อวัตถุประสงค์ต่อไปนี้:</p>
                <ul className="list-disc ml-6 text-sm md:text-base break-words">
                    <li>เพื่อการสั่งซื้อสินค้าและจัดการบัญชีของคุณ</li>
                    <li>เพื่อปรับปรุงประสบการณ์การใช้งานของคุณ เช่น การแนะนำผลิตภัณฑ์</li>
                    <li>เพื่อส่งโปรโมชั่นและข้อเสนอพิเศษ (คุณสามารถยกเลิกการรับข้อความเหล่านี้ได้)</li>
                </ul>

                <h2 className="text-lg md:text-xl font-semibold mt-4 mb-2">4. การแบ่งปันข้อมูล</h2>
                <p className="text-sm md:text-base break-words">
                    ข้อมูลของคุณจะไม่ถูกขายหรือแบ่งปันกับบุคคลที่สาม ยกเว้นในกรณีต่อไปนี้:
                </p>
                <ul className="list-disc ml-6 text-sm md:text-base break-words">
                    <li>กับผู้ให้บริการที่เชื่อถือได้ที่ช่วยให้เราดำเนินการเว็บไซต์และจัดการคำสั่งซื้อ</li>
                    <li>เมื่อกฎหมายบังคับให้เปิดเผยข้อมูลเพื่อปฏิบัติตามกระบวนการทางกฎหมาย</li>
                </ul>

                <h2 className="text-lg md:text-xl font-semibold mt-4 mb-2">8. ติดต่อเรา</h2>
                <p className="text-sm md:text-base break-words">หากคุณมีคำถามหรือข้อกังวลเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ กรุณาติดต่อเราที่:</p>
                <p className="text-sm md:text-base break-words"><strong>อีเมล:</strong> eclat.shop.fashion@gmail.com</p>
                <p className="text-sm md:text-base break-words"><strong>โทรศัพท์:</strong> 0612964178</p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;

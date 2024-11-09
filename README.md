
# Eclat Perfume Store
![image](https://github.com/user-attachments/assets/e1ce8171-cf2c-4e60-8713-177f98dc355e)
![image](https://github.com/user-attachments/assets/481e5658-f668-43f5-8f90-5de7eea18330)
![image](https://github.com/user-attachments/assets/291ebe5f-183b-40fe-a1a0-404e668e97b6)

# ขั้นตอนการติดตั้งโปรเจค Eclat Perfume Store

## ขั้นตอนที่ 1: ตรวจสอบการติดตั้ง Node.js และ npm

- เปิด Terminal แล้วตรวจสอบว่าเครื่องของคุณมี `Node.js` และ `npm` ติดตั้งอยู่หรือไม่ โดยใช้คำสั่ง:
  ```bash
  node -v
  npm -v
หากยังไม่ได้ติดตั้ง สามารถดาวน์โหลดได้จาก Node.js Official Website
ขั้นตอนที่ 2: ดาวน์โหลดโปรเจคจาก GitHub
คลอนโค้ดโปรเจคโดยใช้คำสั่ง:
bash
คัดลอกโค้ด
git clone https://github.com/your-repository/eclat.git
จากนั้นเข้าไปที่โฟลเดอร์โปรเจค:
bash
คัดลอกโค้ด
cd eclat
ขั้นตอนที่ 3: สร้างและตั้งค่าไฟล์ .env
คัดลอกไฟล์ .env.example และเปลี่ยนชื่อเป็น .env:
bash
คัดลอกโค้ด
cp .env.example .env
เปิดไฟล์ .env ที่สร้างขึ้นมา และกรอกข้อมูลต่อไปนี้:
env
คัดลอกโค้ด
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
NEXTAUTH_SECRET=
GMAIL_USER=
GMAIL_PASS=
NEXTAUTH_URL=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
STRIPE_SECRET_KEY=
ขั้นตอนที่ 4: ติดตั้ง Dependencies
ติดตั้ง dependencies ที่จำเป็นสำหรับโปรเจคโดยใช้คำสั่ง:
bash
คัดลอกโค้ด
npm install
ขั้นตอนที่ 5: ตั้งค่า Prisma และฐานข้อมูล
ทำการ migrate ฐานข้อมูลโดยใช้คำสั่ง:
bash
คัดลอกโค้ด
npx prisma migrate dev
สร้าง Prisma Client:
bash
คัดลอกโค้ด
npx prisma generate
ขั้นตอนที่ 6: ตั้งค่า Seed Data (ถ้าต้องการ)
หากต้องการข้อมูลตัวอย่าง สามารถรันคำสั่ง:
bash
คัดลอกโค้ด
npx prisma db seed
ขั้นตอนที่ 7: รันโปรเจคในโหมดพัฒนา
ใช้คำสั่งต่อไปนี้เพื่อเริ่มรันโปรเจค:
bash
คัดลอกโค้ด
npm run dev
เปิดเบราว์เซอร์แล้วไปที่:
http://localhost:3000
ขั้นตอนที่ 8: รันโปรเจคในโหมด Production (ถ้าต้องการ)
สร้าง production build:
bash
คัดลอกโค้ด
npm run build
รันโปรเจค:
bash
คัดลอกโค้ด
npm start
ขั้นตอนที่ 9: ตรวจสอบการทำงานของโปรเจค
ลองเข้าสู่ระบบด้วย Google และ Facebook
ทดสอบการชำระเงินผ่าน Stripe ด้วยบัตรทดสอบ
ตรวจสอบการอัปโหลดรูปภาพผ่าน Cloudinary

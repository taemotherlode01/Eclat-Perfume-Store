
# Eclat Perfume Store

Eclat เป็นเว็บแอปสำหรับขายน้ำหอมที่ใช้ Next.js และ Prisma สำหรับจัดการฐานข้อมูล, Stripe สำหรับการชำระเงิน, และ Cloudinary สำหรับจัดการรูปภาพ นอกจากนี้ยังรองรับการเข้าสู่ระบบผ่าน Google และ Facebook โดยใช้ NextAuth

## การตั้งค่า

### 1. คัดลอก `.env.example` ไปยัง `.env`

สร้างไฟล์ `.env` จากตัวอย่าง `.env.example` และเพิ่มค่า Environment Variables ของคุณเองตามรายละเอียดด้านล่างนี้

```env
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

ตัวอย่างหน้าเว็บ
![image](https://github.com/user-attachments/assets/e1ce8171-cf2c-4e60-8713-177f98dc355e)
![image](https://github.com/user-attachments/assets/481e5658-f668-43f5-8f90-5de7eea18330)
![image](https://github.com/user-attachments/assets/291ebe5f-183b-40fe-a1a0-404e668e97b6)

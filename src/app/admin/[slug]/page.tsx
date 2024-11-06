// app/admin/[slug]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import React from 'react';

const AdminPage = () => {
  const params = useParams(); // ใช้ useParams ดึง slug จาก URL
  const slug = params?.slug;

  if (!slug) return <p>Loading...</p>;

  return (
    <div>
      <h1>Admin Page</h1>
      <p>คุณกำลังดูหน้า: {slug}</p>
    </div>
  );
};

export default AdminPage;

// app/manage-addresses/page.tsx or pages/manage-addresses.tsx
'use client';
import React from 'react';
import Navbar from '../components/Navbar';
import AddressBook from '../components/AddressBook';
import Link from 'next/link';
import { Icon } from '@iconify/react';

const ManageAddresses: React.FC = () => {
    return (
        <div>
            <Navbar />
            <div className="container mx-auto p-6">
            <div className="flex justify-start mb-4">
    <Link href="/cart">
        <button className="flex items-center py-2">
            <Icon icon="cil:arrow-left" className="mr-2" /> {/* Add margin here */}
            กลับไปที่หน้าตระกร้า
        </button>
    </Link>
</div>
                <div className="border p-4">
                    <AddressBook />
                </div>
            </div>
        </div>
    );
};

export default ManageAddresses;

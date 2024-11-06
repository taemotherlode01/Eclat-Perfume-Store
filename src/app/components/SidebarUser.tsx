import Link from 'next/link';
import { signOut } from 'next-auth/react'; 
import { Icon } from '@iconify/react';

const SidebarUser: React.FC = () => {
  return (
    <div className="col-span-1">
      <ul className="space-y-4 border border-black p-6">
        <li>
          <Link href="/userInfo" className="flex justify-between items-center hover:bg-black hover:text-white p-2 transition-all relative group">
            ข้อมูลส่วนบุคคล
            <Icon icon="icon-park-outline:arrow-right" className="text-xl absolute right-4 opacity-0 group-hover:opacity-100 group-hover:text-white transition-all" />
          </Link>
        </li>
        <li>
          <Link href="/address-book" className="flex justify-between items-center hover:bg-black hover:text-white p-2 transition-all relative group">
            สมุดที่อยู่
            <Icon icon="icon-park-outline:arrow-right" className="text-xl absolute right-4 opacity-0 group-hover:opacity-100 group-hover:text-white transition-all" />
          </Link>
        </li>
        <li>
          <Link href="/orders" className="flex justify-between items-center hover:bg-black hover:text-white p-2 transition-all relative group">
            การสั่งซื้อ
            <Icon icon="icon-park-outline:arrow-right" className="text-xl absolute right-4 opacity-0 group-hover:opacity-100 group-hover:text-white transition-all" />
          </Link>
        </li>
        <li>
          <button
            onClick={() => signOut()}
            className="flex justify-between items-center w-full hover:bg-black hover:text-white p-2 transition-all relative group"
          >
            ออกจากระบบ
            <Icon icon="icon-park-outline:arrow-right" className="text-xl absolute right-4 opacity-0 group-hover:opacity-100 group-hover:text-white transition-all" />
          </button>
        </li>
      </ul>
    </div>
  );
};

export default SidebarUser;

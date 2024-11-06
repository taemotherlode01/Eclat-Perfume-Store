// ไฟล์หลักของคุณ
'use client';
import { useSession } from 'next-auth/react'; 
import { useRouter } from 'next/navigation'; 
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';
import SidebarUser from '../components/SidebarUser';
import AddressBook from '../components/AddressBook'; // นำเข้า AddressBook

const AddressBookMain: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <Loading />;
  } else if (status === 'unauthenticated') {
    router.push('/signin');
    return null;
  }

  return (
    <div className="min-h-screen p-6">
      <Navbar />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
        <SidebarUser />
        <div className="col-span-1 md:col-span-3 p-4 border border-black">
          <AddressBook />
        </div>
      </div>
    </div>
  );
};

export default AddressBookMain;

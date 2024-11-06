// components/AddressBook.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast, { Toaster } from 'react-hot-toast';
import Select from 'react-select';

interface Address {
  id: number;
  recipient: string;
  phoneNumber: string;
  address: string;
  district: string;
  province: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

interface Location {
  id: string;
  zip: string;
  province: string;
  district: string;
}

const AddressBook: React.FC = () => {
  const { data: session, status } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);
  const [newAddress, setNewAddress] = useState<Address>({
    id: 0,
    recipient: '',
    phoneNumber: '',
    address: '',
    district: '',
    province: '',
    zipCode: '',
    country: 'ประเทศไทย',
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [districtOptions, setDistrictOptions] = useState<{ value: string; label: string; zip: string }[]>([]);
  const [zipCodeOptions, setZipCodeOptions] = useState<{ value: string; label: string }[]>([]);
  const [phoneError, setPhoneError] = useState<string>('');
  const phoneRegex = /^0[689]\d{8}$/;

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/addresses');
      const data = await response.json();
      setAddresses(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('ไม่สามารถดึงข้อมูลที่อยู่ได้');
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('/locations/locations.json');
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('ไม่สามารถดึงข้อมูลจังหวัดและอำเภอได้');
    }
  };

  const handleDelete = async () => {
    if (addressToDelete) {
      try {
        const response = await fetch('/api/addresses', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ addressId: addressToDelete }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete address');
        }

        toast.success('ลบที่อยู่สำเร็จ');
        setAddresses((prevAddresses) => prevAddresses.filter((addr) => addr.id !== addressToDelete));
        setIsDeleteModalOpen(false);
      } catch (error) {
        toast.error('เกิดข้อผิดพลาดในการลบที่อยู่');
      }
    }
  };

  const confirmDeleteAddress = (id: number) => {
    setAddressToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleAddAddress = () => {
    setIsAddModalOpen(true);
  };

  const handleSaveNewAddress = async () => {
    if (!phoneRegex.test(newAddress.phoneNumber)) {
      setPhoneError('เบอร์โทรไม่ถูกต้อง');
      return;
    }
    setPhoneError('');
    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAddress),
      });

      if (!response.ok) {
        throw new Error('Failed to add address');
      }

      const newAddedAddress = await response.json();
      setAddresses([...addresses, newAddedAddress]);
      toast.success('เพิ่มที่อยู่สำเร็จ');
      setIsAddModalOpen(false);
      setNewAddress({
        id: 0,
        recipient: '',
        phoneNumber: '',
        address: '',
        district: '',
        province: '',
        zipCode: '',
        country: 'ประเทศไทย',
      });
      setDistrictOptions([]);
      setZipCodeOptions([]);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเพิ่มที่อยู่');
    }
  };

  const handleEditAddress = (address: Address) => {
    setSelectedAddress(address);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedAddress = async () => {
    if (selectedAddress) {
        if (!phoneRegex.test(selectedAddress.phoneNumber)) {
            setPhoneError('เบอร์โทรไม่ถูกต้อง');
            return;
        }
        setPhoneError('');

        // ตรวจสอบว่าฟิลด์ทั้งหมดมีค่าเต็ม
        const requiredFields = [
            selectedAddress.recipient,
            selectedAddress.phoneNumber,
            selectedAddress.address,
            selectedAddress.district,
            selectedAddress.province,
            selectedAddress.zipCode,
        ];

        const isAnyFieldEmpty = requiredFields.some(field => !field.trim());
        if (isAnyFieldEmpty) {
            toast.error('กรุณากรอกข้อมูลให้ครบทุกฟิลด์');
            return;
        }

        try {
            const response = await fetch('/api/addresses', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    addressId: selectedAddress.id,
                    recipient: selectedAddress.recipient,
                    phoneNumber: selectedAddress.phoneNumber,
                    address: selectedAddress.address,
                    district: selectedAddress.district,
                    province: selectedAddress.province,
                    zipCode: selectedAddress.zipCode,
                    country: selectedAddress.country,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to edit address');
            }

            const updatedAddress = await response.json();
            setAddresses((prevAddresses) =>
                prevAddresses.map((addr) => (addr.id === updatedAddress.id ? updatedAddress : addr))
            );

            toast.success('แก้ไขที่อยู่สำเร็จ');
            setIsEditModalOpen(false);
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการแก้ไขที่อยู่');
        }
    }
};
  const handleSetDefaultAddress = async (id: number) => {
    try {
      const response = await fetch('/api/addresses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addressId: id,
          isDefault: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set default address');
      }

      const updatedAddress = await response.json();
      setAddresses((prevAddresses) =>
        prevAddresses.map((addr) => ({
          ...addr,
          isDefault: addr.id === updatedAddress.id,
        }))
      );

      toast.success('ตั้งที่อยู่เริ่มต้นสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการตั้งที่อยู่เริ่มต้น');
    }
  };

  const handleProvinceChange = (selectedOption: any) => {
    const province = selectedOption?.value || '';
    if (isEditModalOpen && selectedAddress) {
      setSelectedAddress({ ...selectedAddress, province, zipCode: '', district: '' });
    } else {
      setNewAddress({ ...newAddress, province, zipCode: '', district: '' });
    }
    
    const districts = locations
      .filter(loc => loc.province === province)
      .map(loc => ({ value: loc.district, label: loc.district, zip: loc.zip }));
  
    const uniqueDistricts = Array.from(new Set(districts.map(d => d.value)))
      .map(value => districts.find(d => d.value === value));
  
    setDistrictOptions(uniqueDistricts.filter(d => d !== undefined));
  };
  
  const handleDistrictChange = (selectedOption: any) => {
    const selectedDistrict = selectedOption?.value || '';
    if (isEditModalOpen && selectedAddress) {
      setSelectedAddress({ ...selectedAddress, district: selectedDistrict });
    } else {
      setNewAddress({ ...newAddress, district: selectedDistrict });
    }
  
    const zips = locations
      .filter(loc => loc.district === selectedDistrict)
      .map(loc => ({ value: loc.zip, label: loc.zip }));
  
    setZipCodeOptions(zips);
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAddresses();
      fetchLocations();
    }
  }, [status]);

  if (loading) {
    return null; // หรือกลับไปที่ Loading component ของคุณ
  }

  return (
    <div>
      <Toaster />
      <h2 className="text-2xl font-bold mb-4">สมุดที่อยู่</h2>
      <p className="text-sm text-gray-600 mb-4">จัดการที่อยู่ของคุณด้านล่าง</p>
      <button onClick={handleAddAddress} className="bg-black text-white px-4 py-2 mb-4">
        เพิ่มที่อยู่ใหม่
      </button>
      {addresses.length > 0 ? (
        <ul>
          {addresses.map((address) => (
            <li key={address.id} className="border p-4 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <p>ชื่อผู้รับ: {address.recipient}</p>
                <p>เบอร์โทร: {address.phoneNumber}</p>
                <p>
                  {address.address}, {address.district}, {address.province}, {address.zipCode}, {address.country}
                </p>
                <div className="flex space-x-4 mt-2">
                  <button onClick={() => handleEditAddress(address)} className="text-black underline">
                    แก้ไข
                  </button>
                  <button onClick={() => confirmDeleteAddress(address.id)} className="text-red-500 underline">
                    ลบ
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end md:items-center space-y-2 md:ml-4">
              <button
    onClick={() => handleSetDefaultAddress(address.id)}
    className={`${address.isDefault ? 'bg-gray-300 cursor-not-allowed' : 'bg-black text-white'} px-4 py-2`}
    disabled={address.isDefault} // เพิ่มเงื่อนไข disabled
>
    {address.isDefault ? 'นี่คือที่อยู่เริ่มต้น' : 'ตั้งเป็นที่อยู่เริ่มต้น'}
</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>ไม่มีที่อยู่ในสมุด</p>
      )}

      {/* Modal for Delete Confirmation */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md mx-4 md:mx-0 animate-modal">
            <h2 className="text-xl mb-4">ยืนยันการลบที่อยู่</h2>
            <p>คุณแน่ใจหรือไม่ว่าต้องการลบที่อยู่นี้? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <div className="mt-4 flex justify-end space-x-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">ยกเลิก</button>
              <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded">ลบ</button>
            </div>
          </div>
        </div>
      )}

{isAddModalOpen && (
  <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg mx-4 md:mx-0 animate-modal">
      <h2 className="text-xl mb-4">เพิ่มที่อยู่ใหม่</h2>

      <input
        type="text"
        value={newAddress.recipient}
        onChange={(e) => setNewAddress({ ...newAddress, recipient: e.target.value })}
        className="border p-2 w-full mb-4 focus:outline-none focus:ring-1 focus:ring-black"
        placeholder="ชื่อผู้รับ"
      />
      <input
        type="text"
        value={newAddress.phoneNumber}
        onChange={(e) => setNewAddress({ ...newAddress, phoneNumber: e.target.value })}
        className="border p-2 w-full focus:outline-none focus:ring-1 focus:ring-black"
        placeholder="เบอร์โทร"
      />
      {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}
      <div className="mb-4"></div>
      <textarea
        value={newAddress.address}
        onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
        className="border p-2 w-full mb-4 focus:outline-none focus:ring-1 focus:ring-black"
        placeholder="ที่อยู่"
        rows={4}
      />

<Select
  options={locations
    .map(loc => loc.province)
    .filter((value, index, self) => self.indexOf(value) === index)
    .map(province => ({ value: province, label: province }))}
  onChange={handleProvinceChange}
  placeholder="เลือกจังหวัด"
  isClearable
  className="mb-4"
  styles={{
    control: (provided, { isFocused }) => ({
      ...provided,
      border: isFocused ? '1px solid black' : '1px solid #D1D5DB',
      borderRadius: '0px',
      boxShadow: isFocused ? '0 0 0 1px rgba(0, 0, 0, 0.5)' : undefined,
    }),
    option: (provided, { isFocused, isSelected }) => ({
      ...provided,
      backgroundColor: isSelected
        ? 'black' // สีดำเมื่อเลือก
        : isFocused
        ? '#E5E7EB' // สีเทาเมื่อ hover
        : undefined,
      color: isSelected ? 'white' : 'black', // สีข้อความตามต้องการ
      ':hover': {
        backgroundColor: '#E5E7EB', // สีเทาเมื่อ hover
      },
    }),
  }}
/>

<Select
  options={districtOptions}
  onChange={handleDistrictChange}
  placeholder="เลือกอำเภอ/เขต"
  isClearable
  isDisabled={!districtOptions.length}
  className="mb-4"
  styles={{
    control: (provided, { isFocused }) => ({
      ...provided,
      border: isFocused ? '1px solid black' : '1px solid #D1D5DB',
      borderRadius: '0px',
      boxShadow: isFocused ? '0 0 0 1px rgba(0, 0, 0, 0.5)' : undefined,
    }),
    option: (provided, { isFocused, isSelected }) => ({
      ...provided,
      backgroundColor: isSelected ? 'black' : isFocused ? '#E5E7EB' : undefined,
      color: isSelected ? 'white' : 'black',
      ':hover': {
        backgroundColor: '#E5E7EB',
      },
    }),
  }}
/>

<Select
  options={zipCodeOptions}
  onChange={(selectedOption) => setNewAddress({ ...newAddress, zipCode: selectedOption?.value || '' })}
  placeholder="เลือกรหัสไปรษณีย์"
  isClearable
  isDisabled={!zipCodeOptions.length}
  className="mb-4"
  styles={{
    control: (provided, { isFocused }) => ({
      ...provided,
      border: isFocused ? '1px solid black' : '1px solid #D1D5DB',
      borderRadius: '0px',
      boxShadow: isFocused ? '0 0 0 1px rgba(0, 0, 0, 0.5)' : undefined,
    }),
    option: (provided, { isFocused, isSelected }) => ({
      ...provided,
      backgroundColor: isSelected ? 'black' : isFocused ? '#E5E7EB' : undefined,
      color: isSelected ? 'white' : 'black',
      ':hover': {
        backgroundColor: '#E5E7EB',
      },
    }),
  }}
/>


      <input
        type="text"
        value={newAddress.country}
        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
        className="border p-2 w-full bg-gray-100"
        placeholder="ประเทศ"
        disabled
      />

      <div className="mt-4 flex justify-end space-x-4">
        <button onClick={() => setIsAddModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded">ยกเลิก</button>
        <button onClick={handleSaveNewAddress} className="bg-black text-white px-4 py-2 rounded">บันทึก</button>
      </div>
    </div>
  </div>
)}

      {/* Modal for Editing Address */}
      {isEditModalOpen && selectedAddress && (
        <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg mx-4 md:mx-0 animate-modal">
            <h2 className="text-xl mb-4">แก้ไขที่อยู่</h2>

            {/* Other Address Fields */}
            <input
              type="text"
              value={selectedAddress.recipient}
              onChange={(e) =>
                setSelectedAddress({ ...selectedAddress, recipient: e.target.value })
              }
              className="border p-2 w-full mb-4 focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="ชื่อผู้รับ"
            />
            <input
              type="text"
              value={selectedAddress.phoneNumber}
              onChange={(e) =>
                setSelectedAddress({ ...selectedAddress, phoneNumber: e.target.value })
              }
              className="border p-2 w-full focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="เบอร์โทร"
            />
            {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}
            <div className='mb-4'></div>
            <textarea
              value={selectedAddress.address}
              onChange={(e) =>
                setSelectedAddress({ ...selectedAddress, address: e.target.value })
              }
              className="border p-2 w-full mb-4 focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="ที่อยู่"
              rows={4}
            />

<Select
  options={locations
    .map(loc => loc.province)
    .filter((value, index, self) => self.indexOf(value) === index)
    .map(province => ({ value: province, label: province }))}
  value={selectedAddress?.province ? { value: selectedAddress.province, label: selectedAddress.province } : null}
  onChange={handleProvinceChange}
  placeholder="เลือกจังหวัด"
  isClearable
  className="mb-4"
  styles={{
    control: (provided, { isFocused }) => ({
      ...provided,
      border: isFocused ? '1px solid black' : '1px solid #D1D5DB',
      borderRadius: '0px',
      boxShadow: isFocused ? '0 0 0 1px rgba(0, 0, 0, 0.5)' : undefined,
    }),
    option: (provided, { isFocused, isSelected }) => ({
      ...provided,
      backgroundColor: isSelected
        ? 'black'
        : isFocused
        ? '#E5E7EB'
        : undefined,
      color: isSelected ? 'white' : 'black',
      ':hover': {
        backgroundColor: '#E5E7EB',
      },
    }),
  }}
/>

<Select
  options={districtOptions}
  value={selectedAddress?.district ? { value: selectedAddress.district, label: selectedAddress.district } : null}
  onChange={handleDistrictChange}
  placeholder="เลือกอำเภอ/เขต"
  isClearable
  isDisabled={!districtOptions.length}
  className="mb-4"
  styles={{
    control: (provided, { isFocused }) => ({
      ...provided,
      border: isFocused ? '1px solid black' : '1px solid #D1D5DB',
      borderRadius: '0px',
      boxShadow: isFocused ? '0 0 0 1px rgba(0, 0, 0, 0.5)' : undefined,
    }),
    option: (provided, { isFocused, isSelected }) => ({
      ...provided,
      backgroundColor: isSelected
        ? 'black'
        : isFocused
        ? '#E5E7EB'
        : undefined,
      color: isSelected ? 'white' : 'black',
      ':hover': {
        backgroundColor: '#E5E7EB',
      },
    }),
  }}
/>

<Select
  options={zipCodeOptions}
  value={selectedAddress?.zipCode ? { value: selectedAddress.zipCode, label: selectedAddress.zipCode } : null}
  onChange={(selectedOption) =>
    setSelectedAddress({ ...selectedAddress, zipCode: selectedOption?.value || '' })
  }
  placeholder="เลือกรหัสไปรษณีย์"
  isClearable
  isDisabled={!zipCodeOptions.length}
  className="mb-4"
  styles={{
    control: (provided, { isFocused }) => ({
      ...provided,
      border: isFocused ? '1px solid black' : '1px solid #D1D5DB',
      borderRadius: '0px',
      boxShadow: isFocused ? '0 0 0 1px rgba(0, 0, 0, 0.5)' : undefined,
    }),
    option: (provided, { isFocused, isSelected }) => ({
      ...provided,
      backgroundColor: isSelected
        ? 'black'
        : isFocused
        ? '#E5E7EB'
        : undefined,
      color: isSelected ? 'white' : 'black',
      ':hover': {
        backgroundColor: '#E5E7EB',
      },
    }),
  }}
/>


            <input
              type="text"
              value={selectedAddress.country}
              onChange={(e) =>
                setSelectedAddress({ ...selectedAddress, country: e.target.value })
              }
              className="border p-2 w-full bg-gray-100"
              placeholder="ประเทศ"
              disabled
            />

            <div className="mt-4 flex justify-end space-x-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEditedAddress}
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


export default AddressBook;

import React, { useEffect, useState } from "react";

interface DiscountCode {
  id: number;
  code: string;
  description: string; // Assume this contains HTML tags for formatting
}

const DiscountCode: React.FC = () => {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch discount codes directly in the component
  const fetchDiscountCodes = async (): Promise<void> => {
    try {
      const response = await fetch("/api/promotion-codes/active");
      if (!response.ok) {
        throw new Error("Failed to fetch discount codes.");
      }
      const data = await response.json();
      setCodes(data);
    } catch (error) {
      console.error("Failed to fetch discount codes:", error);
      setError("Failed to load discount codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscountCodes();
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      alert(`โค้ดส่วนลด "${code}" คัดลอกเรียบร้อย!`);
    }).catch(() => {
      alert("เกิดข้อผิดพลาดในการคัดลอกโค้ด");
    });
  };

  return (
    <div className="flex justify-center flex-wrap gap-4 mb-24">
      {loading ? (
        <p className="text-lg text-gray-600">Loading discount codes...</p>
      ) : error ? (
        <p className="text-lg text-red-600">{error}</p>
      ) : codes.length > 0 ? (
        codes.map((discount) => (
          <div
            key={discount.id}
            className="bg-gray-100 text-gray-800 rounded-lg shadow-lg p-6 text-center w-72 h-64 flex flex-col justify-between m-2"
          >
            <h3 className="text-2xl font-semibold text-gray-900">แจกโค้ดส่วนลด</h3>
            <p
              className="text-lg my-4 truncate overflow-hidden whitespace-nowrap text-gray-700"
              dangerouslySetInnerHTML={{ __html: discount.description }}
            />
            <div
              onClick={() => copyToClipboard(discount.code)}
              className="bg-gray-300 text-gray-900 font-bold py-2 px-4 rounded inline-block transform transition-transform duration-300 hover:scale-105 cursor-pointer"
            >
              {discount.code}
            </div>
            <p className="text-sm text-gray-500 mt-2">ใช้โค้ดนี้ที่หน้าชำระเงินเพื่อรับส่วนลด</p>
          </div>
        ))
      ) : (
        <p className="text-lg text-gray-600">No discount codes available.</p>
      )}
    </div>
  );
};

export default DiscountCode;

// components/Footer.tsx
import React from "react";
import { Icon } from "@iconify/react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-300 h-24 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full px-6 sm:px-6 lg:px-8 flex items-center">
        <div className="flex flex-col lg:flex-row justify-between items-center w-full space-y-4 lg:space-y-0">
          {/* Logo Section */}
          <p className="text-sm text-gray-500 order-last lg:order-first">
            ©2024 - ECLAT สงวนลิขสิทธิ์
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

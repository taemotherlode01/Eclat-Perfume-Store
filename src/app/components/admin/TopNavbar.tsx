"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useSession, signOut } from "next-auth/react";

interface TopNavbarProps {
  toggleSidebar: () => void;
}

const TopNavbar = ({ toggleSidebar }: TopNavbarProps) => {
  const { data: session } = useSession();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 1024; // Change to 1024 to include tablets
    }
    return false; 
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 1024; // Change to 1024 to include tablets
      setIsMobile(isMobileView);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && session?.user) {
      document.body.style.paddingBottom = "3rem"; 
    } else {
      document.body.style.paddingBottom = "0";
    }

    return () => {
      document.body.style.paddingBottom = "0";
    };
  }, [isMobile, session]);

  return (
    <>
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white bg-opacity-90 backdrop-blur-lg shadow-lg z-20 flex items-center px-6 transition-all duration-300">
        {/* Hamburger Menu Button */}
        <button
          className="text-xl focus:outline-none mr-4 hover:text-gray-700 transition-transform duration-300 transform hover:scale-110"
          onClick={toggleSidebar}
        >
          <Icon icon="game-icons:hamburger-menu" width={24} height={24} />
        </button>

        {/* Top Navbar Content */}
        <div className="flex-1 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/images/logo.png"
              alt="Logo"
              className="h-10 w-auto transition-all duration-500 transform hover:scale-125 hover:rotate-6"
            />
          </div>

          {/* Right Content */}
          <div className="flex items-center space-x-6">
            {/* Display user's name if logged in */}
            {session?.user && !isMobile ? (
              <span className="text-gray-800 hover:underline transition-all duration-300 transform hover:scale-105">
                Hello, {session.user.name}
              </span>
            ) : (
              <span className="text-gray-500">{!isMobile ? "Not logged in" : ""}</span>
            )}

            {/* Logout Icon Button */}
            {session?.user && (
              <button
                onClick={() => signOut()}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-300 transform hover:scale-110 focus:outline-none"
                aria-label="Logout"
              >
                <Icon
                  icon="el:off"
                  width={20}
                  height={20}
                  className="text-gray-700 hover:text-red-600 transition-colors duration-300"
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar for Mobile (Name Only) */}
      {isMobile && session?.user && (
        <div className="fixed bottom-0 left-0 right-0 h-12 bg-white bg-opacity-95 backdrop-blur-md shadow-md z-20 flex justify-center items-center px-4 transition-all duration-300">
          <span className="text-gray-700">Hello, {session.user.name}</span>
        </div>
      )}
    </>
  );
};

export default TopNavbar;

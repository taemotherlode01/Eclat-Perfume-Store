import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true); // Automatically collapse the sidebar on small screens
        setIsMobile(true);
      } else {
        setIsCollapsed(false); // Expand the sidebar on larger screens
        setIsMobile(false);
      }
    };

    handleResize(); // Call it on initial render
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(!isCollapsed));
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} />

      {/* Main Content Area */}
      <div
        className={`flex-1 p-4 mt-16 transition-all duration-300 ${
          isCollapsed ? "ml-20" : "ml-64"
        } overflow-auto`}  // Added overflow-auto for flexible scrolling
      >
        {/* Top Navbar */}
        <TopNavbar toggleSidebar={toggleSidebar} />

        {/* Main Content */}
        <main>{children}</main>
      </div>
    </div>
  );
};
export default Layout;

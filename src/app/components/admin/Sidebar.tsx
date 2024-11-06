"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { usePathname, useRouter } from "next/navigation";

// Interface definitions
interface ISubItem {
  name: string;
  path: string;
}

interface ISidebarItem {
  name: string;
  path: string;
  icon: string;
  items?: ISubItem[];
}

// Sample data for the sidebar
const items: ISidebarItem[] = [
  {
    name: "Dashboard",
    path: "/admin/dashboard",
    icon: "mdi:view-dashboard",
  },
  {
    name: "Products",
    path: "/admin/products",
    icon: "mdi:bottle-tonic-outline",
  },
  {
    name: "Categories",
    icon: "carbon:collapse-categories",
    path: "",
    items: [
      {
        name: "Fragrance Family",
        path: "/admin/fragrance-families",
      },
      {
        name: "Formula",
        path: "/admin/formulas",
      },
      {
        name: "Product Type",
        path: "/admin/product-types",
      },
      {
        name: "Ingredients",
        path: "/admin/ingredients",
      },
    ],
  },
  {
    name: "UI Component",
    icon: "gg:website",
    path: "",
    items: [
      {
        name: "Advertisement",
        path: "/admin/advertisement",
      },
      {
        name: "Hero",
        path: "/admin/hero",
      },
    ],
  },
  {
    name: "Promotions",
    path: "/admin/promotion-codes",
    icon: "lsicon:badge-promotion-outline",
  },
  {
    name: "Orders",
    path: "/admin/orders",
    icon: "lsicon:order-outline",
  },
  {
    name: "Users",
    path: "/admin/users",
    icon: "fluent:people-team-24-regular",
  },
];

const Sidebar = ({ isCollapsed }: { isCollapsed: boolean }) => {
  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] ${
        isCollapsed ? "w-20" : "w-64"
      } bg-white shadow-lg z-10 p-4 transition-all duration-300 ease-in-out`}
    >
      <div className="flex flex-col items-center w-full">
        {/* Sidebar Items */}
        <div className="flex flex-col space-y-2 w-full">
          {items.map((item, index) => (
            <SidebarItem key={index} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({
  item,
  isCollapsed,
}: {
  item: ISidebarItem;
  isCollapsed: boolean;
}) => {
  const { name, icon, items, path } = item;
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState("0px");
  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Load initial state for expanded from localStorage
  useEffect(() => {
    const storedExpandedState = localStorage.getItem(`sidebar-expanded-${name}`);
    if (storedExpandedState !== null) {
      setExpanded(JSON.parse(storedExpandedState));
    }
  }, [name]);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem(`sidebar-expanded-${name}`, JSON.stringify(expanded));
  }, [expanded, name]);

  // Update expanded state based on current pathname
  useEffect(() => {
    if (items && items.length > 0) {
      const isAnySubItemActive = items.some((subItem) => subItem.path === pathname);
      if (isAnySubItemActive) setExpanded(true);
    }
  }, [items, pathname]);

  // Update content height when expanded state changes
  useEffect(() => {
    if (expanded && contentRef.current) {
      setContentHeight(`${contentRef.current.scrollHeight}px`);
    } else {
      setContentHeight("0px");
    }
  }, [expanded]);

  const onClick = () => {
    if (items && items.length > 0) {
      setExpanded((prev) => !prev);
    } else {
      router.push(path);
    }
  };

  // Determine if the item or its sub-items are active
  const isActive = useMemo(() => {
    if (items && items.length > 0) {
      return items.some((subItem) => subItem.path === pathname);
    }
    return path === pathname;
  }, [items, path, pathname]);

  return (
    <>
      <div
        className={`flex items-center p-3 rounded-lg justify-between cursor-pointer transition-all duration-200 ${
          isActive
            ? "bg-black text-white shadow-lg hover:shadow-xl transform hover:scale-105"
            : "hover:bg-gray-100 hover:shadow-md text-gray-700 hover:text-black transition-all duration-300"
        }`}
        onClick={onClick}
      >
        <div className="flex items-center space-x-2">
          {/* Icon */}
          <Icon icon={icon} width={24} height={24} className="transition-all duration-300 transform hover:scale-110" />
          {/* Text label, hidden when sidebar is collapsed */}
          {!isCollapsed && <p className="text-sm font-semibold">{name}</p>}
        </div>
        {/* Chevron down icon, hidden when sidebar is collapsed */}
        {items && items.length > 0 && !isCollapsed && (
          <Icon
            icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"}
            width={18}
            height={18}
            className="transition-all duration-300 transform hover:rotate-180"
          />
        )}
      </div>
      {/* Animated sub-items */}
      <div
        ref={contentRef}
        style={{
          height: isCollapsed ? "0px" : contentHeight,
          opacity: expanded ? 1 : 0,
        }}
        className={`transition-all duration-500 ease-in-out overflow-hidden`}
      >
        <div className="flex flex-col space-y-1 ml-10">
          {items?.map((subItem) => (
            <SidebarSubItem key={subItem.path} item={subItem} />
          ))}
        </div>
      </div>
    </>
  );
};

const SidebarSubItem = ({ item }: { item: ISubItem }) => {
  const { name, path } = item;
  const router = useRouter();
  const pathname = usePathname();

  const onClick = () => {
    router.push(path);
  };

  const isActive = useMemo(() => path === pathname, [path, pathname]);

  return (
    <div
      className={`text-sm pl-4 py-2 cursor-pointer rounded-lg transition-all duration-300 ${
        isActive
          ? "bg-black text-white font-semibold shadow-md transform hover:translate-x-2"
          : "text-gray-700 hover:bg-gray-100 hover:text-black hover:shadow-sm hover:scale-105"
      }`}
      onClick={onClick}
    >
      {name}
    </div>
  );
};

export default Sidebar;

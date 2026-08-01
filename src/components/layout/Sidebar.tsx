import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ShoppingCart,
  Warehouse,
  Fuel,
  DollarSign,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Package,
  Truck,
  Receipt,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Building2, label: "Stations", path: "/stations" },
    { icon: ShoppingCart, label: "Sales", path: "/sales" },
    { icon: Fuel, label: "Pumps", path: "/pumps" },
    { icon: Warehouse, label: "Inventory", path: "/inventory" },
    { icon: DollarSign, label: "Expenses", path: "/expenses" },
    { icon: Package, label: "Purchases", path: "/purchases" },
    { icon: Truck, label: "Logistics", path: "/logistics" },
    { icon: Users, label: "Employees", path: "/employees" },
    { icon: TrendingUp, label: "Reports", path: "/reports" },
  ];

  // Filter menu items based on role
  const getFilteredMenu = () => {
    if (!user) return menuItems;

    switch (user.role) {
      case "SUPER_ADMIN":
        return menuItems;
      case "REGIONAL_MANAGER":
        return menuItems.filter((item) => !["Settings"].includes(item.label));
      case "SUPERVISOR":
        return menuItems.filter((item) =>
          [
            "Dashboard",
            "Sales",
            "Pumps",
            "Inventory",
            "Expenses",
            "Employees",
            "Reports",
          ].includes(item.label),
        );
      case "ATTENDANT":
        return menuItems.filter((item) => ["Sales"].includes(item.label));
      // case 'DEPOT_MANAGER':
      //   return menuItems.filter(item =>
      //     ['Purchases', 'Inventory', 'Logistics', 'Reports'].includes(item.label)
      //   );
      case "ACCOUNTANT":
        return menuItems.filter((item) =>
          ["Sales", "Expenses", "Reports", "Employees"].includes(item.label),
        );
      default:
        return menuItems;
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full bg-petroleum-dark text-white transition-all duration-300 ${
          open ? "w-64" : "w-20"
        } overflow-y-auto`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            {/* Replace the div with your logo image */}
            <img
              src="/logo-white.png" // Put your logo in the public folder
              alt="Rekaz Logo"
              className="w-32 h-20 object-contain"
            />
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="p-1 rounded hover:bg-gray-800"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4">
          {getFilteredMenu().map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 transition-colors ${
                  isActive
                    ? "bg-petroleum-seagreen text-petroleum-dark"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                } ${!open && "justify-center"}`}
                title={!open ? item.label : ""}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {open && <span className="ml-3 text-sm">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800">
          <button
            onClick={logout}
            className={`flex w-full items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white ${
              !open && "justify-center"
            }`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {open && <span className="ml-3 text-sm">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Layout({ children }) {
  const { logout, user } = useContext(AuthContext);
  const location = useLocation();

  // Map each route to a specific distinct color theme
  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      activeClass:
        "bg-blue-50 text-blue-700 border-l-4 border-blue-600 translate-x-2 shadow-md font-bold",
      hoverClass:
        "hover:bg-blue-50 hover:text-blue-600 hover:translate-x-1 text-gray-600 font-medium",
    },
    {
      name: "Register Purchase",
      path: "/register-purchase",
      activeClass:
        "bg-orange-50 text-orange-700 border-l-4 border-orange-600 translate-x-2 shadow-md font-bold",
      hoverClass:
        "hover:bg-orange-50 hover:text-orange-600 hover:translate-x-1 text-gray-600 font-medium",
    },
    {
      name: "Register Sale (POS)",
      path: "/register-sale",
      activeClass:
        "bg-green-50 text-green-700 border-l-4 border-green-600 translate-x-2 shadow-md font-bold",
      hoverClass:
        "hover:bg-green-50 hover:text-green-600 hover:translate-x-1 text-gray-600 font-medium",
    },
    {
      name: "Stock Inventory",
      path: "/inventory",
      activeClass:
        "bg-purple-50 text-purple-700 border-l-4 border-purple-600 translate-x-2 shadow-md font-bold",
      hoverClass:
        "hover:bg-purple-50 hover:text-purple-600 hover:translate-x-1 text-gray-600 font-medium",
    },
    {
      name: "Store Settings",
      path: "/edit-store",
      activeClass:
        "bg-gray-800 text-white border-l-4 border-black translate-x-2 shadow-md font-bold",
      hoverClass:
        "hover:bg-gray-100 hover:text-gray-900 hover:translate-x-1 text-gray-600 font-medium",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          {user?.logoUrl ? (
            <img
              src={user.logoUrl}
              alt="Logo"
              className="h-10 w-10 rounded-full border shadow-sm"
            />
          ) : (
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              {user?.businessName?.charAt(0)}
            </div>
          )}
          <span className="font-bold text-xl text-gray-800 truncate tracking-tight">
            {user?.businessName}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-3 rounded-r-xl transition-all duration-300 ease-in-out ${
                  isActive ? item.activeClass : item.hoverClass
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-3 text-red-600 font-medium hover:bg-red-50 hover:translate-x-1 transition-all duration-300 ease-in-out rounded-r-xl"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50">{children}</main>
    </div>
  );
}

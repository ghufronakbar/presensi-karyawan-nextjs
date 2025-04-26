import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants/env";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiInfo,
  FiFileText,
  FiUser,
  FiLogOut,
  FiMenu,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Check if mobile view on mount and window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Check on mount
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems = [
    {
      title: "Dashboard",
      icon: <FiHome className="h-5 w-5" />,
      href: "/dashboard",
      active: router.pathname === "/dashboard",
    },
    {
      title: "Informasi",
      icon: <FiInfo className="h-5 w-5" />,
      href: "/information",
      active: router.pathname.startsWith("/information"),
    },
    {
      title: "Karyawan",
      icon: <FiUsers className="h-5 w-5" />,
      href: "/user",
      active: router.pathname.startsWith("/user"),
    },
    {
      title: "Presensi",
      icon: <FiCalendar className="h-5 w-5" />,
      href: "/attendance",
      active: router.pathname.startsWith("/attendance"),
    },
    {
      title: "Ijin Cuti",
      icon: <FiFileText className="h-5 w-5" />,
      href: "/leave",
      active: router.pathname.startsWith("/leave"),
    },
    {
      title: "Edit Profile",
      icon: <FiUser className="h-5 w-5" />,
      href: "/profile",
      active: router.pathname.startsWith("/profile"),
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Mobile Header */}
      <header
        className={`md:hidden bg-white shadow-sm z-20 px-4 py-3 flex justify-between items-center`}
      >
        <div className="flex items-center">
          <span className="text-xl font-semibold">{APP_NAME}</span>
        </div>
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md bg-gray-100"
        >
          {isMobileMenuOpen ? (
            <FiX className="h-6 w-6" />
          ) : (
            <FiMenu className="h-6 w-6" />
          )}
        </button>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-white bg-opacity-25 backdrop-blur-sm z-30"
          onClick={toggleMobileMenu}
        >
          <div
            className="absolute right-0 top-0 h-full w-full bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <span className="text-xl font-semibold">{APP_NAME}</span>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Hai, {user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              <nav className="space-y-2 mt-5">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={toggleMobileMenu}
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      item.active
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.title}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="absolute bottom-0 w-full p-4 border-t">
              <Button
                variant="outline"
                onClick={logout}
                className="flex items-center p-2 rounded-lg w-full"
              >
                <FiLogOut className="h-5 w-5 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div
        className={`hidden md:block ${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-white h-screen shadow-lg transition-all duration-300 ease-in-out fixed z-10`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          {isSidebarOpen ? (
            <span className="text-xl font-semibold">{APP_NAME}</span>
          ) : (
            <span className="text-xl font-semibold mx-auto">
              {APP_NAME.slice(0, 1)}
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            {isSidebarOpen ? (
              <FiChevronLeft className="h-6 w-6" />
            ) : (
              <FiChevronRight className="h-6 w-6" />
            )}
          </button>
        </div>

        <div className="p-4">
          {isSidebarOpen && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Hai, {user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          )}

          <nav className="space-y-2 mt-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 hover:bg-gray-100"
                } ${!isSidebarOpen && "justify-center"}`}
              >
                <span className={isSidebarOpen ? "mr-3" : ""}>{item.icon}</span>
                {isSidebarOpen && <span>{item.title}</span>}
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t">
          <Button
            variant="outline"
            onClick={logout}
            className={`flex items-center p-2 rounded-lg w-full ${
              !isSidebarOpen && "justify-center"
            }`}
          >
            <FiLogOut className={`h-5 w-5 ${isSidebarOpen ? "mr-2" : ""}`} />
            {isSidebarOpen && "Keluar"}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`flex-1 ${
          isMobile ? "" : isSidebarOpen ? "md:ml-64" : "md:ml-20"
        } transition-all duration-300 ease-in-out`}
      >
        {/* Desktop Header */}
        <header className="hidden md:block bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {navItems.find((item) => item.active)?.title || "Dashboard"}
            </h1>
          </div>
        </header>

        {/* Mobile Page Title */}
        <div className="md:hidden px-4 py-2 bg-white shadow-sm">
          <h1 className="text-lg font-medium text-gray-900">
            {navItems.find((item) => item.active)?.title || "Dashboard"}
          </h1>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}

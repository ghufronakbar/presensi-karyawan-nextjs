import { JSX, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@prisma/client";
import { NextComponentType, NextPageContext } from "next";

// HOC for authentication and role-based access control
export default function withAuth(
  Component: NextComponentType<NextPageContext>,
  allowedRoles: Role[] = []
) {
  const AuthenticatedComponent = (props: JSX.IntrinsicAttributes) => {
    const { isAuthenticated, user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // If authentication check is complete
      if (!loading) {
        // If not authenticated, redirect to login
        if (!isAuthenticated) {
          router.replace("/login");
        }
        // If authenticated but role is not allowed
        else if (
          allowedRoles.length > 0 &&
          user &&
          !allowedRoles.includes(user.role)
        ) {
          // Redirect based on role
          if (user.role === "Admin") {
            router.replace("/dashboard");
          } else {
            router.replace("/");
          }
        }
      }
    }, [isAuthenticated, loading, router, user]);

    // Show nothing while authenticating to avoid flashes
    if (loading || !isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
        </div>
      );
    }

    // If user doesn't have required role
    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Akses Ditolak
          </h1>
          <p className="text-gray-600 text-center">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
        </div>
      );
    }

    // If authenticated and authorized, render the component
    return <Component {...props} />;
  };

  return AuthenticatedComponent;
}

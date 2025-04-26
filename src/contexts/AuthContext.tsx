import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/router";
import api from "@/config/api";
import { Role } from "@prisma/client";
import { ApiResponse } from "@/models/api-response";

// Define user type
interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  staffNumber: string;
  position: string;
  image?: string;
}

// Define auth context type
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: UpdateProfileData) => Promise<void>;
  updatePassword: (passwordData: UpdatePasswordData) => Promise<void>;
}

// Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  updateProfile: async () => {},
  updatePassword: async () => {},
});

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Define update profile data type
interface UpdateProfileData {
  name: string;
  email: string;
  position: string;
}

// Define update password data type
interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await api.get<ApiResponse<User>>("/auth/check");
          setUser(response.data.data);
        } catch (error) {
          console.log(error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<ApiResponse<User & { token: string }>>(
        "/auth/login",
        { email, password }
      );
      const { data } = response.data;
      const { token, ...user } = data;

      // Redirect based on user role
      if (user.role === "Admin") {
        router.push("/dashboard");
      } else {
        throw new Error("Anda tidak memiliki akses ke halaman ini");
      }
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  // Update profile function
  const updateProfile = async (profileData: UpdateProfileData) => {
    try {
      const response = await api.put<ApiResponse<User & { token: string }>>(
        "/user/profile",
        profileData
      );
      const { data } = response.data;
      const { token, ...user } = data;

      // Update token and user in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Update user in state
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  // Update password function
  const updatePassword = async (passwordData: UpdatePasswordData) => {
    try {
      await api.patch<ApiResponse<ApiResponse>>("/user/profile", passwordData);
      // No need to update token or user state as password change doesn't affect these
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        login,
        logout,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

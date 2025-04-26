import Head from "next/head";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/constants/env";
import withAuth from "@/HOC/withAuth";
import { Role, User } from "@prisma/client";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import api from "@/config/api";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle } from "lucide-react";
import { ApiResponse } from "@/models/api-response";
// Extended User interface with leave statistics
interface ExtendedUser extends User {
  approvedSickLeaves: number;
  approvedRegularLeaves: number;
}

function UserManagement() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterPosition, setFilterPosition] = useState("");

  // Get unique positions for filter dropdown
  const positions = Array.from(
    new Set(users.map((user) => user.position))
  ).filter(Boolean);

  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get<ApiResponse<ExtendedUser[]>>(
          "/admin/user"
        );
        // Map response data to include separated leave types
        const mappedUsers = response.data.data.map((user) => ({
          ...user,
          approvedSickLeaves: user.approvedSickLeaves || 0,
          approvedRegularLeaves: user.approvedRegularLeaves || 0,
        }));
        setUsers(mappedUsers);
        setFilteredUsers(mappedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = [...users];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.staffNumber.toLowerCase().includes(term) ||
          user.position.toLowerCase().includes(term)
      );
    }

    // Apply role filter
    if (filterRole) {
      result = result.filter((user) => user.role === filterRole);
    }

    // Apply position filter
    if (filterPosition) {
      result = result.filter((user) => user.position === filterPosition);
    }

    setFilteredUsers(result);
  }, [users, searchTerm, filterRole, filterPosition]);

  const exportToExcel = async () => {
    try {
      setExporting(true);

      // Call the export API with a blob response type
      const response = await api.get(`/admin/user/export`, {
        responseType: "blob",
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Data_Karyawan.xlsx");
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting user data:", error);
      alert("Gagal mengekspor data. Silakan coba lagi.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Manajemen Karyawan | {APP_NAME}</title>
      </Head>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <CardTitle>Data Karyawan</CardTitle>
                <CardDescription>
                  Kelola data karyawan perusahaan
                </CardDescription>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => router.push("/user/create")}
                >
                  <PlusCircle size={16} />
                  Tambah Karyawan
                </Button>

                <Button
                  className="flex gap-2 items-center"
                  onClick={exportToExcel}
                  disabled={exporting || loading}
                >
                  <Download size={16} />
                  {exporting ? "Mengekspor..." : "Ekspor Excel"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <input
                  type="text"
                  placeholder="Cari karyawan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="">Semua Role</option>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </select>
              </div>

              <div>
                <select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="">Semua Posisi</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-10">
                <div className="flex justify-center">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-center mt-4 text-gray-500">
                  Memuat data karyawan...
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-500">
                  Menampilkan {filteredUsers.length} dari {users.length}{" "}
                  karyawan
                </div>

                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm divide-y">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left">Karyawan</th>
                          <th className="px-4 py-3 text-left">Email</th>
                          <th className="px-4 py-3 text-left">Posisi</th>
                          <th className="px-4 py-3 text-left">Cuti/Sakit</th>
                          <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium">{user.name}</div>
                                <div className="text-gray-500 text-xs">
                                  {user.staffNumber}
                                </div>
                              </td>
                              <td className="px-4 py-3">{user.email}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <span>{user.position}</span>
                                  {user.role === "Admin" && (
                                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col space-y-1">
                                  <div className="flex items-center">
                                    <span className="w-20 inline-block text-xs">
                                      Cuti:
                                    </span>
                                    <span className="font-medium">
                                      {user.approvedRegularLeaves}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="w-20 inline-block text-xs">
                                      Sakit:
                                    </span>
                                    <span className="font-medium">
                                      {user.approvedSickLeaves}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Link
                                  href={`/user/${user.id}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  Detail
                                </Link>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-10 text-center text-gray-500"
                            >
                              Tidak ada data karyawan yang sesuai dengan filter
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default withAuth(UserManagement, [Role.Admin]);

import Head from "next/head";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/constants/env";
import withAuth from "@/HOC/withAuth";
import { Role, LeaveStatus, LeaveType } from "@prisma/client";
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
import { Download } from "lucide-react";
import { AxiosError } from "axios";
interface Leave {
  id: string;
  reason: string;
  attachment?: string;
  type: LeaveType;
  date: string;
  status: LeaveStatus;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    staffNumber: string;
    position: string;
    role: Role;
    image?: string;
  };
}

function LeaveManagement() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingLeave, setProcessingLeave] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  const router = useRouter();
  const { user: currentUser } = router.query;

  useEffect(() => {
    fetchLeaves();
  }, [currentUser]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params: { userId?: string } = {};

      // If viewing a specific user's leaves
      if (currentUser) {
        params.userId = currentUser as string;
      }

      const response = await api.get("/admin/leave", { params });
      setLeaves(response.data.data);
      setFilteredLeaves(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching leaves:", err);
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch leave data");
      } else {
        setError("Failed to fetch leave data");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateLeaveStatus = async (leaveId: string, status: LeaveStatus) => {
    try {
      setProcessingLeave(leaveId);
      await api.put(`/admin/leave/${leaveId}`, { status });

      // Refresh the leaves data
      fetchLeaves();
    } catch (err) {
      console.error("Error updating leave status:", err);
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || "Failed to update leave status");
      } else {
        alert("Failed to update leave status");
      }
    } finally {
      setProcessingLeave(null);
    }
  };

  // Apply filters whenever filter states change
  useEffect(() => {
    let result = [...leaves];

    // Filter by search term (name, staff number, or reason)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        (leave) =>
          leave.user.name.toLowerCase().includes(lowerSearchTerm) ||
          leave.user.staffNumber.toLowerCase().includes(lowerSearchTerm) ||
          leave.reason.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Filter by status
    if (filterStatus) {
      result = result.filter((leave) => leave.status === filterStatus);
    }

    // Filter by type
    if (filterType) {
      result = result.filter((leave) => leave.type === filterType);
    }

    // Apply date filters
    if (filterMonth || filterYear) {
      result = result.filter((leave) => {
        const leaveDate = new Date(leave.date);

        if (filterMonth && filterYear) {
          // Month is 0-indexed in JS Date
          const selectedMonth = parseInt(filterMonth) - 1;
          const selectedYear = parseInt(filterYear);
          return (
            leaveDate.getMonth() === selectedMonth &&
            leaveDate.getFullYear() === selectedYear
          );
        } else if (filterYear) {
          return leaveDate.getFullYear() === parseInt(filterYear);
        }

        return true;
      });
    }

    setFilteredLeaves(result);
  }, [searchTerm, filterStatus, filterType, filterMonth, filterYear, leaves]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterType("");
    setFilterMonth("");
    setFilterYear("");
  };

  // Format date
  const formatLeaveDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Get status badge color
  const getStatusBadgeClass = (status: LeaveStatus) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Diterima":
        return "bg-green-100 text-green-800";
      case "Ditolak":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get leave type badge color
  const getTypeBadgeClass = (type: LeaveType) => {
    switch (type) {
      case "Cuti":
        return "bg-blue-100 text-blue-800";
      case "Sakit":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const exportToExcel = async () => {
    try {
      setExporting(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (filterMonth) params.append("month", filterMonth);
      if (filterYear) params.append("year", filterYear);
      if (filterStatus) params.append("status", filterStatus);

      // Create filename base
      let filename = "Data_Cuti";
      if (filterMonth && filterYear) {
        filename += `_${filterMonth}_${filterYear}`;
      } else if (filterYear) {
        filename += `_${filterYear}`;
      }
      if (filterStatus) {
        filename += `_${filterStatus}`;
      }
      filename += ".xlsx";

      // Call the export API with a blob response type
      const response = await api.get(
        `/admin/leave/export?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting leave data:", error);
      alert("Gagal mengekspor data. Silakan coba lagi.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Manajemen Cuti | {APP_NAME}</title>
      </Head>

      <div className="mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl font-bold">
                Daftar Pengajuan Cuti & Sakit
              </CardTitle>
              <CardDescription>
                Kelola pengajuan cuti dan sakit karyawan
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                className="flex gap-2 items-center"
                onClick={exportToExcel}
                disabled={exporting || loading}
              >
                <Download size={16} />
                {exporting ? "Mengekspor..." : "Ekspor Excel"}
              </Button>
            </div>
          </CardHeader>

          {/* Filter Section */}
          <CardContent className="border-b pb-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <label
                  htmlFor="search"
                  className="block text-sm font-medium mb-1"
                >
                  Cari
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Cari nama karyawan, nomor staf, atau alasan"
                  className="w-full px-3 py-2 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="md:w-48">
                <label
                  htmlFor="status"
                  className="block text-sm font-medium mb-1"
                >
                  Status
                </label>
                <select
                  id="status"
                  className="w-full px-3 py-2 border rounded-md"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Semua Status</option>
                  <option value={LeaveStatus.Pending}>Pending</option>
                  <option value={LeaveStatus.Diterima}>Diterima</option>
                  <option value={LeaveStatus.Ditolak}>Ditolak</option>
                </select>
              </div>

              <div className="md:w-48">
                <label
                  htmlFor="type"
                  className="block text-sm font-medium mb-1"
                >
                  Tipe
                </label>
                <select
                  id="type"
                  className="w-full px-3 py-2 border rounded-md"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Semua Tipe</option>
                  <option value={LeaveType.Cuti}>Cuti</option>
                  <option value={LeaveType.Sakit}>Sakit</option>
                </select>
              </div>

              <div className="md:w-48">
                <label
                  htmlFor="month"
                  className="block text-sm font-medium mb-1"
                >
                  Bulan
                </label>
                <select
                  id="month"
                  className="w-full px-3 py-2 border rounded-md"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                >
                  <option value="">Semua Bulan</option>
                  <option value="1">Januari</option>
                  <option value="2">Februari</option>
                  <option value="3">Maret</option>
                  <option value="4">April</option>
                  <option value="5">Mei</option>
                  <option value="6">Juni</option>
                  <option value="7">Juli</option>
                  <option value="8">Agustus</option>
                  <option value="9">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
              </div>

              <div className="md:w-48">
                <label
                  htmlFor="year"
                  className="block text-sm font-medium mb-1"
                >
                  Tahun
                </label>
                <select
                  id="year"
                  className="w-full px-3 py-2 border rounded-md"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                >
                  <option value="">Semua Tahun</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>

              <div className="md:self-end">
                <button
                  className="w-full md:w-auto px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={resetFilters}
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </CardContent>

          <CardContent>
            {loading ? (
              <div className="py-10">
                <div className="flex justify-center">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-center mt-4 text-gray-500">
                  Memuat data pengajuan...
                </p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            ) : (
              <>
                <div className="mb-2 text-sm text-gray-500">
                  Menampilkan {filteredLeaves.length} dari {leaves.length}{" "}
                  pengajuan
                </div>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm divide-y">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left">Nama Karyawan</th>
                          <th className="px-4 py-3 text-left">Tanggal</th>
                          <th className="px-4 py-3 text-left">Tipe</th>
                          <th className="px-4 py-3 text-left">Alasan</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredLeaves.length > 0 ? (
                          filteredLeaves.map((leave) => (
                            <tr key={leave.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium">
                                  {leave.user.name}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {leave.user.staffNumber}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {formatLeaveDate(leave.date)}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${getTypeBadgeClass(
                                    leave.type
                                  )}`}
                                >
                                  {leave.type}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="max-w-xs truncate">
                                  {leave.reason}
                                </div>
                                {leave.attachment && (
                                  <Link
                                    href={leave.attachment}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Lihat Lampiran
                                  </Link>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(
                                    leave.status
                                  )}`}
                                >
                                  {leave.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Link
                                  href={`/leave/${leave.id}`}
                                  className="text-blue-600 hover:text-blue-800 mr-3"
                                >
                                  Detail
                                </Link>

                                {leave.status === "Pending" && (
                                  <>
                                    <button
                                      className="text-green-600 hover:text-green-800 mr-2"
                                      onClick={() =>
                                        updateLeaveStatus(
                                          leave.id,
                                          LeaveStatus.Diterima
                                        )
                                      }
                                      disabled={processingLeave === leave.id}
                                    >
                                      {processingLeave === leave.id
                                        ? "Processing..."
                                        : "Terima"}
                                    </button>
                                    <button
                                      className="text-red-600 hover:text-red-800"
                                      onClick={() =>
                                        updateLeaveStatus(
                                          leave.id,
                                          LeaveStatus.Ditolak
                                        )
                                      }
                                      disabled={processingLeave === leave.id}
                                    >
                                      {processingLeave === leave.id
                                        ? "Processing..."
                                        : "Tolak"}
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-10 text-center text-gray-500"
                            >
                              Tidak ada data pengajuan yang sesuai dengan filter
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

export default withAuth(LeaveManagement, [Role.Admin, Role.User]);

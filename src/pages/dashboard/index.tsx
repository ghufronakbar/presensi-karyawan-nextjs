import { useEffect, useState } from "react";
import Head from "next/head";
import withAuth from "@/HOC/withAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/constants/env";
import api from "@/config/api";
import { Role } from "@prisma/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Download } from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  todayAttendance: number;
  pendingLeaves: number;
}

interface AttendanceCount {
  masuk: number;
  keluar: number;
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    todayAttendance: 0,
    pendingLeaves: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState<AttendanceCount>({
    masuk: 0,
    keluar: 0,
  });

  // Date range state
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [exportType, setExportType] = useState<string>("masuk");

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get("/admin/dashboard");
        setStats(response.data.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Fetch attendance count for selected date range
  useEffect(() => {
    const fetchAttendanceCount = async () => {
      if (!startDate || !endDate) return;

      try {
        const response = await api.get(
          `/admin/attendance/count?startDate=${startDate}&endDate=${endDate}`
        );
        setAttendanceCount(response.data.data || { masuk: 0, keluar: 0 });
      } catch (error) {
        console.error("Error fetching attendance count:", error);
      }
    };

    fetchAttendanceCount();
  }, [startDate, endDate]);

  // Handle export
  const handleExportAttendance = async () => {
    if (!startDate || !endDate) {
      alert("Silakan pilih rentang tanggal");
      return;
    }

    try {
      setExportLoading(true);

      // Use the exported filename format: Presensi_[type]_[startDate]_[endDate].xlsx
      const formattedStartDate = startDate.replace(/-/g, "");
      const formattedEndDate = endDate.replace(/-/g, "");
      const filename = `Presensi_${
        exportType === "masuk" ? "Masuk" : "Keluar"
      }_${formattedStartDate}_${formattedEndDate}.xlsx`;

      // Call the export API with a blob response type and custom date range
      const response = await api.get(
        `/admin/attendance/export?startDate=${startDate}&endDate=${endDate}&type=${exportType}`,
        { responseType: "blob" }
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
      console.error("Error exporting attendance data:", error);
      alert("Gagal mengekspor data. Silakan coba lagi.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Dashboard Admin | {APP_NAME}</title>
      </Head>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Karyawan"
          value={stats?.totalUsers}
          description="Jumlah seluruh karyawan"
          loading={loading}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Karyawan Aktif"
          value={stats.activeUsers}
          description="Karyawan yang aktif bekerja"
          loading={loading}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Presensi Hari Ini"
          value={stats.todayAttendance}
          description="Jumlah karyawan hadir hari ini"
          loading={loading}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
        />
        <StatCard
          title="Cuti Tertunda"
          value={stats.pendingLeaves}
          description="Permintaan cuti yang menunggu persetujuan"
          loading={loading}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Attendance Export Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Ekspor Data Presensi</CardTitle>
            <CardDescription>
              Pilih rentang tanggal untuk mengekspor data presensi karyawan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="grid md:grid-cols-4 gap-4 w-full items-end">
                  <div>
                    <label
                      htmlFor="start-date"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tanggal Mulai
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="end-date"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tanggal Akhir
                    </label>
                    <input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="type"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tipe Presensi
                    </label>
                    <select
                      id="type"
                      value={exportType}
                      onChange={(e) => setExportType(e.target.value)}
                      className="px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary w-full"
                    >
                      <option value="masuk">Masuk</option>
                      <option value="keluar">Keluar</option>
                    </select>
                  </div>

                  <div>
                    <Button
                      className="flex gap-2 items-center w-full"
                      onClick={handleExportAttendance}
                      disabled={exportLoading}
                    >
                      <Download size={16} />
                      {exportLoading ? "Mengekspor..." : "Ekspor Excel"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="text-md font-medium text-gray-700 mb-2">
                  Total Presensi dalam Rentang Waktu
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">Presensi Masuk</p>
                    <p className="text-2xl font-bold">
                      {attendanceCount.masuk}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">Presensi Keluar</p>
                    <p className="text-2xl font-bold">
                      {attendanceCount.keluar}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Menu Administrasi</CardTitle>
            <CardDescription>
              Menu pengelolaan untuk administrator sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AdminMenuItem
                title="Kelola Karyawan"
                href="/user"
                description="Tambah, edit, atau hapus data karyawan"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                }
              />
              <AdminMenuItem
                title="Presensi"
                href="/attendance"
                description="Lihat dan unduh laporan presensi karyawan"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                }
              />
              <AdminMenuItem
                title="Informasi"
                href="/information"
                description="Kelola informasi presensi"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

// Statistics card component
function StatCard({
  title,
  value,
  description,
  loading,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  loading: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-3xl font-bold mt-1">{value}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div className="bg-gray-100 rounded-full p-3">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Admin menu item component
function AdminMenuItem({
  title,
  href,
  description,
  icon,
}: {
  title: string;
  href: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <a href={href} className="block">
      <Card className="h-full transition-all hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">{icon}</div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

export default withAuth(Dashboard, [Role.Admin]);

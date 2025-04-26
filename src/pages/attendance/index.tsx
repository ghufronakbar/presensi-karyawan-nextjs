import Head from "next/head";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/constants/env";
import withAuth from "@/HOC/withAuth";
import { Role } from "@prisma/client";
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
import { UserWithAttendance } from "@/pages/api/admin/attendance";
import { ApiResponse } from "@/models/api-response";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function AttendanceManagement() {
  const [attendances, setAttendances] = useState<UserWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [type, setType] = useState<string>("masuk");
  const router = useRouter();

  useEffect(() => {
    const fetchAttendances = async () => {
      try {
        setLoading(true);
        const response = await api.get<ApiResponse<UserWithAttendance[]>>(
          `/admin/attendance?date=${date}&type=${type}`
        );
        setAttendances(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching attendances:", error);
        setLoading(false);
      }
    };

    fetchAttendances();
  }, [date, type]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Hadir":
        return "bg-green-100 text-green-800";
      case "Ijin":
        return "bg-blue-100 text-blue-800";
      case "Sakit":
        return "bg-yellow-100 text-yellow-800";
      case "Telat":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "-";

    const date = new Date(timeString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportToExcel = async () => {
    try {
      setExporting(true);

      // Use the exported filename format: Presensi_[type]_[date].xlsx
      const filename = `Presensi_${
        type === "masuk" ? "Masuk" : "Keluar"
      }_${date}.xlsx`;

      // Call the export API with a blob response type
      const response = await api.get(
        `/admin/attendance/export?date=${date}&type=${type}`,
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
      console.error("Error exporting attendance data:", error);
      alert("Gagal mengekspor data. Silakan coba lagi.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Manajemen Presensi | {APP_NAME}</title>
      </Head>

      <div className="mb-6">
        <Card>
          <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <CardTitle>Data Presensi</CardTitle>
              <CardDescription>Kelola data presensi karyawan</CardDescription>
            </div>

            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 md:items-end w-full md:w-auto">
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tanggal
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tipe
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="masuk">Masuk</option>
                  <option value="keluar">Keluar</option>
                </select>
              </div>

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

          <CardContent>
            {loading ? (
              <div className="py-10">
                <div className="flex justify-center">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-center mt-4 text-gray-500">
                  Memuat data presensi...
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm divide-y">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left">Nama</th>
                        <th className="px-4 py-3 text-left">Waktu</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Keterlambatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {attendances.length > 0 ? (
                        attendances.map((attendance) => (
                          <tr key={attendance.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <button
                                className="text-primary hover:underline font-medium focus:outline-none"
                                onClick={() =>
                                  router.push(`/user/${attendance.id}`)
                                }
                              >
                                {attendance.name}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              {attendance.time
                                ? formatTime(attendance?.time?.toString())
                                : "-"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(
                                  attendance.status
                                )}`}
                              >
                                {attendance.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {attendance.late > 0
                                ? `${attendance.late} menit`
                                : "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-10 text-center text-gray-500"
                          >
                            Tidak ada data presensi
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default withAuth(AttendanceManagement, [Role.Admin]);

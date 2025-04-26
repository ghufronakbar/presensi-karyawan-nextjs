import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { APP_NAME } from "@/constants/env";
import withAuth from "@/HOC/withAuth";
import { Role, LeaveStatus, LeaveType, AttendanceStatus } from "@prisma/client";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import api from "@/config/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AxiosError } from "axios";
import Image from "next/image";

interface Leave {
  id: string;
  reason: string;
  attachment?: string;
  type: LeaveType;
  date: string;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
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

function LeaveDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [leave, setLeave] = useState<Leave | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch leave data
  useEffect(() => {
    if (id) {
      fetchLeaveData();
    }
  }, [id]);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/leave/${id}`);
      setLeave(response.data.data);
      setError(null);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch leave data");
      } else {
        setError("Failed to fetch leave data");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateLeaveStatus = async (status: LeaveStatus) => {
    if (!id) return;

    try {
      setIsProcessing(true);
      await api.put(`/admin/leave/${id}`, { status });

      // Refresh leave data
      fetchLeaveData();
    } catch (err) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || "Failed to update leave status");
      } else {
        alert("Failed to update leave status");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Format full date time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  // Get attendance status that will be created
  const getAttendanceStatus = (leaveType: LeaveType | undefined) => {
    if (!leaveType) return "";

    return leaveType === LeaveType.Cuti
      ? AttendanceStatus.Ijin
      : AttendanceStatus.Sakit;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-4">Memuat data cuti...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-4 bg-red-100 text-red-800 rounded-md">
          <p>{error}</p>
          <Button onClick={() => router.back()} className="mt-4">
            Kembali
          </Button>
        </div>
      </AdminLayout>
    );
  }

  if (!leave) {
    return (
      <AdminLayout>
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
          <p>Data pengajuan tidak ditemukan</p>
          <Button onClick={() => router.push("/leave")} className="mt-4">
            Kembali ke Daftar Cuti
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Detail Pengajuan | {APP_NAME}</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detail Pengajuan</h1>
        <Button variant="outline" onClick={() => router.push("/leave")}>
          Kembali
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Leave Details */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detail Pengajuan</CardTitle>
              <CardDescription>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getTypeBadgeClass(
                    leave.type
                  )}`}
                >
                  {leave.type}
                </span>
                <span className="mx-2">•</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(
                    leave.status
                  )}`}
                >
                  {leave.status}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Tanggal Pengajuan
                  </h3>
                  <p>{formatDate(leave.date)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Alasan</h3>
                  <p className="whitespace-pre-wrap">{leave.reason}</p>
                </div>

                {leave.attachment && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Lampiran
                    </h3>
                    <Link
                      href={leave.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Lihat Lampiran
                    </Link>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Diajukan Pada
                  </h3>
                  <p>{formatDateTime(leave.createdAt)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Terakhir Diperbarui
                  </h3>
                  <p>{formatDateTime(leave.updatedAt)}</p>
                </div>

                {leave.status === LeaveStatus.Diterima && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800">
                      Pengajuan ini telah diterima. Sistem telah membuat catatan
                      kehadiran dengan status{" "}
                      <strong>{getAttendanceStatus(leave.type)}</strong> pada
                      tanggal {formatDate(leave.date)}.
                    </p>
                  </div>
                )}

                {leave.status === LeaveStatus.Ditolak && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">Pengajuan ini telah ditolak.</p>
                  </div>
                )}
              </div>
            </CardContent>

            {leave.status === LeaveStatus.Pending && (
              <CardFooter className="flex justify-end space-x-4 border-t pt-6">
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => updateLeaveStatus(LeaveStatus.Ditolak)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Memproses..." : "Tolak Pengajuan"}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => updateLeaveStatus(LeaveStatus.Diterima)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Memproses..." : "Terima Pengajuan"}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* User Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Karyawan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                {leave.user.image ? (
                  <Image
                    src={leave.user.image}
                    alt={leave.user.name}
                    className="w-full h-full rounded-full object-cover"
                    width={96}
                    height={96}
                  />
                ) : (
                  <span className="text-3xl text-gray-500">
                    {leave.user.name.charAt(0)}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold">{leave.user.name}</h2>
              <p className="text-gray-500">{leave.user.position}</p>
            </div>

            <div className="grid gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p>{leave.user.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Nomor Staf
                </h3>
                <p>{leave.user.staffNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Role</h3>
                <p>{leave.user.role}</p>
              </div>
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/user/${leave.user.id}`)}
                >
                  Lihat Profil Karyawan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default withAuth(LeaveDetail, [Role.Admin, Role.User]);

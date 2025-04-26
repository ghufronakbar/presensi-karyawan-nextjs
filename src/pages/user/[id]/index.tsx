import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/constants/env";
import withAuth from "@/HOC/withAuth";
import {
  Role,
  AttendanceStatus,
  AttendanceType,
  LeaveStatus,
  LeaveType,
} from "@prisma/client";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,  
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/config/api";
import { EditIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AxiosError } from "axios";
// Types
interface User {
  id: string;
  name: string;
  email: string;
  staffNumber: string;
  position: string;
  role: Role;
  image?: string;
  createdAt: string;
  updatedAt: string;
  attendances: Attendance[];
  leaves: Leave[];
}

interface Attendance {
  id: string;
  time: string;
  type: AttendanceType;
  status: AttendanceStatus;
  lateTime: number;
  createdAt: string;
}

interface Leave {
  id: string;
  reason: string;
  attachment?: string;
  type: LeaveType;
  date: string;
  status: LeaveStatus;
  createdAt: string;
}

interface AttendanceStats {
  present: number;
  late: number;
  leave: number;
  sick: number;
  total: number;
  presentPercentage: number;
  latePercentage: number;
  leavePercentage: number;
  sickPercentage: number;
}

interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  pendingPercentage: number;
  approvedPercentage: number;
  rejectedPercentage: number;
}

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

// Helper function to format time
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Helper function to get status badge color
const getStatusBadgeClass = (status: AttendanceStatus | LeaveStatus) => {
  switch (status) {
    case "Hadir":
      return "bg-green-100 text-green-800";
    case "Telat":
      return "bg-yellow-100 text-yellow-800";
    case "Ijin":
      return "bg-blue-100 text-blue-800";
    case "Sakit":
      return "bg-red-100 text-red-800";
    case "Diterima":
      return "bg-green-100 text-green-800";
    case "Ditolak":
      return "bg-red-100 text-red-800";
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

function UserDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  // Stats
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    late: 0,
    leave: 0,
    sick: 0,
    total: 0,
    presentPercentage: 0,
    latePercentage: 0,
    leavePercentage: 0,
    sickPercentage: 0,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [leaveStats, setLeaveStats] = useState<LeaveStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    pendingPercentage: 0,
    approvedPercentage: 0,
    rejectedPercentage: 0,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userActivity, setUserActivity] = useState({
    firstCheckIn: "",
    lastCheckOut: "",
    avgCheckInTime: "",
    avgCheckOutTime: "",
    totalWorkDays: 0,
    consecutivePresent: 0,
  });

  useEffect(() => {
    if (id) {
      fetchUserData();
    }
  }, [id]);

  // Generate calendar days for the current month
  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  // Calculate stats when user data changes
  useEffect(() => {
    if (user) {
      calculateAttendanceStats();
      calculateLeaveStats();
      calculateActivityStats();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/user/${id}`);
      setUser(response.data.data);
      setError(null);
      // ts-ignore
    } catch (err) {
      console.error("Error fetching user data:", err);
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch user data");
      } else {
        setError("Failed to fetch user data");
      }
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    let startDayOfWeek = firstDay.getDay();
    // Adjust startDayOfWeek to make Monday the first day (0 = Monday, 6 = Sunday)
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: Date[] = [];

    // Add days from previous month to fill the first week
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }

    // Add all days of the current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add days from next month to complete the last week
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push(new Date(year, month + 1, i));
      }
    }

    setCalendarDays(days);
  };

  const calculateAttendanceStats = () => {
    if (!user) return;

    // Get only attendance records with type Masuk - this ensures we don't double-count check-in/check-out
    // and only consider the "Masuk" records for attendance statistics
    const checkIns = user.attendances.filter((a) => a.type === "Masuk");

    const present = checkIns.filter((a) => a.status === "Hadir").length;
    const late = checkIns.filter((a) => a.status === "Telat").length;
    const leave = checkIns.filter((a) => a.status === "Ijin").length;
    const sick = checkIns.filter((a) => a.status === "Sakit").length;
    const total = present + late + leave + sick;

    setAttendanceStats({
      present,
      late,
      leave,
      sick,
      total,
      presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
      latePercentage: total > 0 ? Math.round((late / total) * 100) : 0,
      leavePercentage: total > 0 ? Math.round((leave / total) * 100) : 0,
      sickPercentage: total > 0 ? Math.round((sick / total) * 100) : 0,
    });
  };

  const calculateLeaveStats = () => {
    if (!user) return;

    const pending = user.leaves.filter((l) => l.status === "Pending").length;
    const approved = user.leaves.filter((l) => l.status === "Diterima").length;
    const rejected = user.leaves.filter((l) => l.status === "Ditolak").length;
    const total = pending + approved + rejected;

    setLeaveStats({
      pending,
      approved,
      rejected,
      total,
      pendingPercentage: total > 0 ? Math.round((pending / total) * 100) : 0,
      approvedPercentage: total > 0 ? Math.round((approved / total) * 100) : 0,
      rejectedPercentage: total > 0 ? Math.round((rejected / total) * 100) : 0,
    });
  };

  const calculateActivityStats = () => {
    if (!user || !user.attendances.length) return;

    const checkIns = user.attendances.filter((a) => a.type === "Masuk");
    const checkOuts = user.attendances.filter((a) => a.type === "Keluar");

    // Sort by date
    const sortedCheckIns = [...checkIns].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );
    const sortedCheckOuts = [...checkOuts].sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    // Get unique days with attendance
    const uniqueDays = new Set(
      checkIns.map((a) => new Date(a.time).toISOString().split("T")[0])
    );
    const totalWorkDays = uniqueDays.size;

    // Calculate consecutive present days
    let consecutiveCount = 0;
    if (sortedCheckIns.length > 0) {
      // Start from the most recent day
      const today = new Date().toISOString().split("T")[0];
      const hasTodayAttendance = sortedCheckIns.some(
        (a) => new Date(a.time).toISOString().split("T")[0] === today
      );

      if (hasTodayAttendance) {
        consecutiveCount = 1;
        const currentDate = new Date();

        while (consecutiveCount < sortedCheckIns.length) {
          currentDate.setDate(currentDate.getDate() - 1);
          // Skip weekends
          if (currentDate.getDay() === 0 || currentDate.getDay() === 6)
            continue;

          const dateStr = currentDate.toISOString().split("T")[0];
          const hasAttendance = sortedCheckIns.some(
            (a) => new Date(a.time).toISOString().split("T")[0] === dateStr
          );

          if (hasAttendance) {
            consecutiveCount++;
          } else {
            break;
          }
        }
      }
    }

    // Calculate average check-in and check-out times
    let totalCheckInMinutes = 0;
    let totalCheckOutMinutes = 0;

    sortedCheckIns.forEach((checkIn) => {
      const date = new Date(checkIn.time);
      totalCheckInMinutes += date.getHours() * 60 + date.getMinutes();
    });

    sortedCheckOuts.forEach((checkOut) => {
      const date = new Date(checkOut.time);
      totalCheckOutMinutes += date.getHours() * 60 + date.getMinutes();
    });

    const avgCheckInMinutes =
      sortedCheckIns.length > 0
        ? Math.round(totalCheckInMinutes / sortedCheckIns.length)
        : 0;
    const avgCheckOutMinutes =
      sortedCheckOuts.length > 0
        ? Math.round(totalCheckOutMinutes / sortedCheckOuts.length)
        : 0;

    const avgCheckInHours = Math.floor(avgCheckInMinutes / 60);
    const avgCheckInMins = avgCheckInMinutes % 60;
    const avgCheckOutHours = Math.floor(avgCheckOutMinutes / 60);
    const avgCheckOutMins = avgCheckOutMinutes % 60;

    setUserActivity({
      firstCheckIn:
        sortedCheckIns.length > 0 ? formatTime(sortedCheckIns[0].time) : "-",
      lastCheckOut:
        sortedCheckOuts.length > 0
          ? formatTime(sortedCheckOuts[sortedCheckOuts.length - 1].time)
          : "-",
      avgCheckInTime:
        sortedCheckIns.length > 0
          ? `${avgCheckInHours.toString().padStart(2, "0")}:${avgCheckInMins
              .toString()
              .padStart(2, "0")}`
          : "-",
      avgCheckOutTime:
        sortedCheckOuts.length > 0
          ? `${avgCheckOutHours.toString().padStart(2, "0")}:${avgCheckOutMins
              .toString()
              .padStart(2, "0")}`
          : "-",
      totalWorkDays,
      consecutivePresent: consecutiveCount,
    });
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const getAttendanceForDay = (date: Date) => {
    if (!user) return null;

    const dateString = date.toISOString().split("T")[0];
    return user.attendances.find((a) => {
      const attendanceDate = new Date(a.time).toISOString().split("T")[0];
      return attendanceDate === dateString && a.type === "Masuk";
    });
  };

  const getAttendanceStatusClass = (date: Date) => {
    const attendance = getAttendanceForDay(date);
    if (!attendance) return "";

    switch (attendance.status) {
      case "Hadir":
        return "bg-green-200";
      case "Telat":
        return "bg-yellow-200";
      case "Ijin":
        return "bg-blue-200";
      case "Sakit":
        return "bg-red-200";
      default:
        return "";
    }
  };

  const getSelectedDayAttendance = () => {
    if (!user) return null;

    const selectedDateStr = selectedDate.toISOString().split("T")[0];

    // Get all attendance entries for the selected day
    return user.attendances.filter((a) => {
      const attendanceDate = new Date(a.time).toISOString().split("T")[0];
      return attendanceDate === selectedDateStr;
    });
  };

  const getSelectedDayLeave = () => {
    if (!user) return null;

    const selectedDateStr = selectedDate.toISOString().split("T")[0];

    // Get any leave entry for the selected day
    return user.leaves.find((l) => {
      const leaveDate = new Date(l.date).toISOString().split("T")[0];
      return leaveDate === selectedDateStr;
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-4">Memuat data karyawan...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-4 bg-red-100 text-red-800 rounded-md">
          <p>{error}</p>
          <Button
            // className="mt-2 px-4 py-2 bg-primary text-white rounded-md"
            onClick={() => router.back()}
          >
            Kembali
          </Button>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
          <p>Data karyawan tidak ditemukan</p>
          <Button
            // className="mt-2 px-4 py-2 bg-primary text-white rounded-md"
            onClick={() => router.back()}
          >
            Kembali
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const currentMonthName = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);
  const selectedDayAttendances = getSelectedDayAttendance();
  const selectedDayLeave = getSelectedDayLeave();
  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <AdminLayout>
      <Head>
        <title>Detail Karyawan | {APP_NAME}</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detail Karyawan</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-row items-start justify-between">
              Profil Karyawan
              <Link href={`/user/${user.id}/edit`}>
                <Button variant="outline" size="icon">
                  <EditIcon className="w-4 h-4" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                    width={96}
                    height={96}
                  />
                ) : (
                  <span className="text-3xl text-gray-500">
                    {user.name.charAt(0)}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-gray-500">{user.position}</p>
            </div>

            <div className="space-y-2 text-sm overflow-x-auto">
              <div className="grid grid-cols-2">
                <span className="text-gray-500">Nomor Staf:</span>
                <span>{user.staffNumber}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-gray-500">Email:</span>
                <span>{user.email}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-gray-500">Role:</span>
                <span>{user.role}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-gray-500">Terdaftar pada:</span>
                <span>{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-md">
                <p className="text-sm text-gray-500">Hadir</p>
                <p className="text-2xl font-bold">{attendanceStats.present}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-md">
                <p className="text-sm text-gray-500">Telat</p>
                <p className="text-2xl font-bold">{attendanceStats.late}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-gray-500">Ijin</p>
                <p className="text-2xl font-bold">{attendanceStats.leave}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-md">
                <p className="text-sm text-gray-500">Sakit</p>
                <p className="text-2xl font-bold">{attendanceStats.sick}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Ringkasan Cuti</p>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="font-semibold">
                    {user.leaves.filter((l) => l.status === "Pending").length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Diterima</p>
                  <p className="font-semibold">
                    {user.leaves.filter((l) => l.status === "Diterima").length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ditolak</p>
                  <p className="font-semibold">
                    {user.leaves.filter((l) => l.status === "Ditolak").length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.attendances.slice(0, 5).map((attendance) => (
                <div
                  key={attendance.id}
                  className="flex justify-between border-b pb-2"
                >
                  <div>
                    <p className="font-medium">{attendance.type}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(attendance.time)}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(
                        attendance.status
                      )}`}
                    >
                      {attendance.status}
                    </span>
                    <p className="text-sm text-right mt-1">
                      {formatTime(attendance.time)}
                    </p>
                  </div>
                </div>
              ))}

              {user.attendances.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Belum ada aktivitas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Calendar */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Kalender Kehadiran</CardTitle>
            <CardDescription>Lihat riwayat kehadiran karyawan</CardDescription>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={previousMonth}
              className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              &lt;
            </button>
            <div className="px-4 py-2 font-medium">{currentMonthName}</div>
            <button
              onClick={nextMonth}
              className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              &gt;
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="rounded-md border overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-gray-50">
              {dayNames.map((day) => (
                <div key={day} className="p-2 text-center font-medium text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const isCurrentMonth =
                  day.getMonth() === currentMonth.getMonth();
                const isToday =
                  day.toDateString() === new Date().toDateString();
                const isSelected =
                  day.toDateString() === selectedDate.toDateString();
                const statusClass = getAttendanceStatusClass(day);

                return (
                  <div
                    key={index}
                    className={`bg-white h-14 p-1 border border-gray-200 hover:bg-gray-50 relative ${
                      isSelected ? "border-gray-300" : ""
                    }`}
                  >
                    <button
                      key={index}
                      className={`
                      h-full w-full border border-transparent hover:bg-gray-50 relative
                      ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
                      ${isToday ? "font-bold" : ""}
                    `}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="text-right text-sm">{day.getDate()}</div>
                      <div
                        className={` w-fit h-fit absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-xs 
                      ${statusClass}                          
                          `}
                      >
                        {getAttendanceForDay(day)?.status}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Details */}
          <div className="mt-6">
            <h3 className="font-medium mb-2">
              {new Intl.DateTimeFormat("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(selectedDate)}
            </h3>

            {selectedDayLeave && (
              <div
                className={`p-3 mb-4 rounded-md ${getStatusBadgeClass(
                  selectedDayLeave.status
                )}`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">
                    Cuti/Izin: {selectedDayLeave.type}
                  </span>
                  <span>{selectedDayLeave.status}</span>
                </div>
                <p className="text-sm mt-1">
                  Alasan: {selectedDayLeave.reason}
                </p>
              </div>
            )}

            {selectedDayAttendances && selectedDayAttendances.length > 0 ? (
              <div>
                {selectedDayAttendances.map((attendance) => (
                  <div
                    key={attendance.id}
                    className="p-3 border rounded-md mb-2"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{attendance.type}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadgeClass(
                          attendance.status
                        )}`}
                      >
                        {attendance.status}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1 text-sm">
                      <span>Jam: {formatTime(attendance.time)}</span>
                      {attendance.lateTime > 0 && (
                        <span className="text-yellow-600">
                          Telat {attendance.lateTime} menit
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !selectedDayLeave && (
                <div className="text-center py-4 text-gray-500">
                  Tidak ada data kehadiran untuk tanggal ini
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leave History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Cuti/Izin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm divide-y">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left">Tanggal</th>
                    <th className="px-4 py-3 text-left">Tipe</th>
                    <th className="px-4 py-3 text-left">Alasan</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">File</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {user.leaves.length > 0 ? (
                    user.leaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{formatDate(leave.date)}</td>
                        <td className="px-4 py-3">{leave.type}</td>
                        <td className="px-4 py-3">{leave.reason}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(
                              leave.status
                            )}`}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {leave.attachment ? (
                            <Link
                              href={leave.attachment}
                              target="_blank"
                              className="text-blue-600 hover:underline"
                            >
                              Lihat File
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        Belum ada riwayat cuti/izin
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export default withAuth(UserDetail, [Role.Admin]);

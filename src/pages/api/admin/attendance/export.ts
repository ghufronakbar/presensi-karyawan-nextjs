import { NextApiRequest, NextApiResponse } from "next";
import { ApiAuth } from "@/middleware/api-auth";
import { db } from "@/config/db";
import { AttendanceType, Role } from "@prisma/client";
import * as XLSX from 'xlsx';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ 
      status: "error",
      message: "Method not allowed" 
    });
  }

  try {
    const { date, month, year, type = "masuk", startDate, endDate } = req.query;
    
    // Date range filter
    let start: Date;
    let end: Date;
    let titlePrefix: string;
    
    // Check if custom date range is provided
    if (startDate && endDate && typeof startDate === "string" && typeof endDate === "string") {
      // Custom date range filter
      start = new Date(`${startDate}T00:00:00Z`);
      end = new Date(`${endDate}T23:59:59Z`);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          status: "error",
          message: "Invalid date format for startDate or endDate"
        });
      }
      
      // Generate title prefix for custom date range
      const startFormatted = new Date(startDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      const endFormatted = new Date(endDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      titlePrefix = `${startFormatted} - ${endFormatted}`;
    } else if (date && typeof date === "string") {
      // Single day filter
      start = new Date(`${date}T00:00:00Z`);
      end = new Date(`${date}T23:59:59Z`);
      titlePrefix = formatDateForTitle(date);
    } else if (month && year && typeof month === "string" && typeof year === "string") {
      // Month and year filter
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      
      if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ 
          status: "error",
          message: "Invalid month or year parameters"
        });
      }
      
      start = new Date(yearNum, monthNum - 1, 1);
      end = new Date(yearNum, monthNum, 0, 23, 59, 59); // Last day of month
      
      titlePrefix = new Date(yearNum, monthNum - 1, 1).toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric'
      });
    } else {
      return res.status(400).json({ 
        status: "error",
        message: "Either date, month+year, or startDate+endDate parameters are required"
      });
    }

    // Get attendance data for the specified date range
    const attendances = await db.attendance.findMany({
      where: {
        time: {
          gte: start,
          lte: end,
        },
        type: type === "masuk" ? AttendanceType.Masuk : AttendanceType.Keluar,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            staffNumber: true,
            position: true,
            email: true,
          },
        },
      },
      orderBy: {
        time: 'asc',
      },
    });

    // Get all users to include users without attendance
    const users = await db.user.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        staffNumber: true,
        position: true,
        email: true,
      },
    });

    // Organize data by user and date
    const attendanceByUser = new Map();
    
    // Initialize with all users
    users.forEach(user => {
      attendanceByUser.set(user.id, {
        user: user,
        attendances: []
      });
    });
    
    // Add attendance records
    attendances.forEach(attendance => {
      const userAttendance = attendanceByUser.get(attendance.userId);
      if (userAttendance) {
        userAttendance.attendances.push({
          date: formatDateOnly(attendance.time),
          time: formatTime(attendance.time),
          status: attendance.status,
          lateTime: attendance.lateTime
        });
      }
    });

    // Prepare data for Excel - one row per user per attendance day
    interface AttendanceRecord {
      date: string;
      time: string;
      status: string;
      lateTime: number | null | '-';
    }

    interface UserAttendance {
      user: {
        id: string;
        name: string;
        staffNumber: string;
        position: string;
        email: string;
      };
      attendances: AttendanceRecord[];
    }

    interface ExcelRow {
      'Nomor Staff': string;
      'Nama': string;
      'Posisi': string;
      'Email': string;
      'Tanggal': string;
      'Waktu': string;
      'Status': string;
      'Keterlambatan (menit)': number | string;
    }

    const excelData: ExcelRow[] = [];
    
    attendanceByUser.forEach(({ user, attendances }: UserAttendance) => {
      if (attendances.length === 0) {
        // Include users with no attendance
        excelData.push({
          'Nomor Staff': user.staffNumber,
          'Nama': user.name,
          'Posisi': user.position,
          'Email': user.email,
          'Tanggal': '-',
          'Waktu': '-',
          'Status': 'Tidak Hadir',
          'Keterlambatan (menit)': '-',
        });
      } else {
        // Include each attendance record for the user
        attendances.forEach((att: AttendanceRecord) => {
          excelData.push({
            'Nomor Staff': user.staffNumber,
            'Nama': user.name,
            'Posisi': user.position,
            'Email': user.email,
            'Tanggal': att.date,
            'Waktu': att.time,
            'Status': att.status,
            'Keterlambatan (menit)': att.lateTime || '-',
          });
        });
      }
    });

    // Create Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    
    // Set column widths
    const colWidths = [
      { wch: 15 }, // Staff Number
      { wch: 25 }, // Name
      { wch: 20 }, // Position
      { wch: 25 }, // Email
      { wch: 15 }, // Date
      { wch: 15 }, // Time
      { wch: 15 }, // Status
      { wch: 20 }, // Late Time
    ];
    worksheet['!cols'] = colWidths;
    
    // Generate sheet name - ensure it doesn't exceed 31 characters (Excel limit)
    const typeText = type === "masuk" ? "Masuk" : "Keluar";
    let truncatedTitle = titlePrefix;
    
    // If the title is from a date range, use a shorter format
    if (startDate && endDate) {
      const startObj = new Date(start);
      const endObj = new Date(end);
      
      // Format as DD-MM-YY_DD-MM-YY (avoiding / and other special chars)
      truncatedTitle = `${startObj.getDate()}-${startObj.getMonth()+1}-${String(startObj.getFullYear()).slice(2)}_${endObj.getDate()}-${endObj.getMonth()+1}-${String(endObj.getFullYear()).slice(2)}`;
    }
    
    // Replace any remaining invalid characters (: \ / ? * [ ])
    truncatedTitle = truncatedTitle.replace(/[:\\/\?*\[\]]/g, '-');
    
    // Ensure the final sheet name is under 31 chars and valid
    const sheetName = `Presensi ${typeText} ${truncatedTitle}`.slice(0, 31);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(
      workbook, 
      worksheet, 
      sheetName
    );

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="Presensi_${type === "masuk" ? "Masuk" : "Keluar"}_${titlePrefix.replace(/ /g, '_')}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Send the Excel file
    return res.status(200).send(excelBuffer);
  } catch (error) {
    console.error("Error exporting attendance data:", error);
    return res.status(500).json({ 
      status: "error", 
      message: "Error exporting attendance data" 
    });
  }
};

// Format time for display in Excel
function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Format date only for display in Excel
function formatDateOnly(date: Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });
}

// Format date for Excel sheet title
function formatDateForTitle(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export default ApiAuth(handler, [Role.Admin]); 
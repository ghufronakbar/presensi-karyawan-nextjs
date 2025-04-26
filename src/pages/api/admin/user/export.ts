import { NextApiRequest, NextApiResponse } from "next";
import { ApiAuth } from "@/middleware/api-auth";
import { db } from "@/config/db";
import { Role } from "@prisma/client";
import * as XLSX from 'xlsx';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ 
      status: "error",
      message: "Method not allowed" 
    });
  }

  try {
    // Get all users (excluding deleted ones)
    const users = await db.user.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        staffNumber: true,
        email: true,
        position: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Count leaves for each user
    const usersWithLeaveData = await Promise.all(
      users.map(async (user) => {
        // Count approved regular leaves
        const approvedRegularLeaves = await db.leave.count({
          where: {
            userId: user.id,
            type: 'Cuti',
            status: 'Diterima',
          },
        });

        // Count approved sick leaves
        const approvedSickLeaves = await db.leave.count({
          where: {
            userId: user.id,
            type: 'Sakit',
            status: 'Diterima',
          },
        });

        // Count total attendances
        const totalAttendances = await db.attendance.count({
          where: {
            userId: user.id,
            type: 'Masuk',
          },
        });

        // Count late attendances
        const lateAttendances = await db.attendance.count({
          where: {
            userId: user.id,
            type: 'Masuk',
            status: 'Telat',
          },
        });

        // Calculate leave and attendance metrics
        return {
          ...user,
          approvedRegularLeaves,
          approvedSickLeaves,
          totalAttendances,
          lateAttendances,
          latePercentage: totalAttendances > 0 
            ? Math.round((lateAttendances / totalAttendances) * 100) 
            : 0,
        };
      })
    );

    // Prepare data for Excel
    const excelData = usersWithLeaveData.map(user => {
      return {
        'Nomor Staff': user.staffNumber,
        'Nama': user.name,
        'Email': user.email,
        'Posisi': user.position,
        'Role': user.role,
        'Cuti Terpakai': user.approvedRegularLeaves,
        'Sakit Terpakai': user.approvedSickLeaves,
        'Total Presensi': user.totalAttendances,
        'Jumlah Terlambat': user.lateAttendances,
        'Persentase Terlambat (%)': user.latePercentage,
        'Tanggal Bergabung': formatDate(user.createdAt),
      };
    });

    // Create Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    
    // Set column widths
    const colWidths = [
      { wch: 15 }, // Staff Number
      { wch: 25 }, // Name
      { wch: 30 }, // Email
      { wch: 20 }, // Position
      { wch: 10 }, // Role
      { wch: 15 }, // Regular Leaves
      { wch: 15 }, // Sick Leaves
      { wch: 15 }, // Total Attendances
      { wch: 15 }, // Late Attendances
      { wch: 20 }, // Late Percentage
      { wch: 20 }, // Join Date
    ];
    worksheet['!cols'] = colWidths;
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(
      workbook, 
      worksheet, 
      `Data Karyawan`
    );

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="Data_Karyawan.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Send the Excel file
    return res.status(200).send(excelBuffer);
  } catch (error) {
    console.error("Error exporting user data:", error);
    return res.status(500).json({ 
      status: "error", 
      message: "Error exporting user data" 
    });
  }
};

// Format date for display in Excel
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export default ApiAuth(handler, [Role.Admin]); 
import { NextApiRequest, NextApiResponse } from "next";
import { ApiAuth } from "@/middleware/api-auth";
import { db } from "@/config/db";
import { LeaveStatus,  Role } from "@prisma/client";
import * as XLSX from 'xlsx';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ 
      status: "error",
      message: "Method not allowed" 
    });
  }

  try {
    const { month, year, status } = req.query;
    
    // Create date filters for the query
    const dateFilter: { gte?: Date; lte?: Date } = {};
    
    if (month && year) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
      
      dateFilter.gte = startDate;
      dateFilter.lte = endDate;
    } else if (year) {
      const startDate = new Date(parseInt(year as string), 0, 1);
      const endDate = new Date(parseInt(year as string), 11, 31);
      
      dateFilter.gte = startDate;
      dateFilter.lte = endDate;
    }

    // Build the query
    const whereClause: { date?: { gte?: Date; lte?: Date }; status?: LeaveStatus } = {};

    // Add status filter if provided
    if (status && Object.values(LeaveStatus).includes(status as LeaveStatus)) {
      whereClause.status = status as LeaveStatus;
    }

    // Get leave data
    const leaves = await db.leave.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            staffNumber: true,
            position: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Prepare data for Excel
    const excelData = leaves.map(leave => {
      return {
        'Nomor Staff': leave.user.staffNumber,
        'Nama': leave.user.name,
        'Posisi': leave.user.position,
        'Email': leave.user.email,
        'Tanggal': formatDate(leave.date),
        'Tipe': leave.type,
        'Alasan': leave.reason,
        'Status': leave.status,
        'Tanggal Pengajuan': formatDate(leave.createdAt),
        'Lampiran': leave.attachment ? 'Ada' : 'Tidak Ada',
      };
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
      { wch: 10 }, // Type
      { wch: 40 }, // Reason
      { wch: 10 }, // Status
      { wch: 20 }, // Created Date
      { wch: 10 }, // Attachment
    ];
    worksheet['!cols'] = colWidths;

    // Create title for the Excel sheet
    let title = 'Data Cuti';
    if (month && year) {
      title += ` ${getMonthName(parseInt(month as string))} ${year}`;
    } else if (year) {
      title += ` Tahun ${year}`;
    }
    if (status) {
      title += ` - ${status}`;
    }
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, title);

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Create filename
    let filename = 'Data_Cuti';
    if (month && year) {
      filename += `_${month}_${year}`;
    } else if (year) {
      filename += `_${year}`;
    }
    if (status) {
      filename += `_${status}`;
    }
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Send the Excel file
    return res.status(200).send(excelBuffer);
  } catch (error) {
    console.error("Error exporting leave data:", error);
    return res.status(500).json({ 
      status: "error", 
      message: "Error exporting leave data" 
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

// Get month name in Indonesian
function getMonthName(monthNumber: number): string {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return monthNames[monthNumber - 1];
}

export default ApiAuth(handler, [Role.Admin]); 
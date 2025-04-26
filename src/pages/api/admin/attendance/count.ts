import { NextApiRequest, NextApiResponse } from "next";
import { ApiAuth } from "@/middleware/api-auth";
import { db } from "@/config/db";
import { AttendanceType, Role } from "@prisma/client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ 
      status: "error",
      message: "Method not allowed" 
    });
  }

  try {
    const { startDate, endDate } = req.query;
    
    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        status: "error",
        message: "startDate and endDate parameters are required"
      });
    }
    
    // Parse dates
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T23:59:59Z`);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        status: "error",
        message: "Invalid date format"
      });
    }
    
    // Count masuk attendance
    const masukCount = await db.attendance.count({
      where: {
        time: {
          gte: start,
          lte: end,
        },
        type: AttendanceType.Masuk,
      },
    });
    
    // Count keluar attendance
    const keluarCount = await db.attendance.count({
      where: {
        time: {
          gte: start,
          lte: end,
        },
        type: AttendanceType.Keluar,
      },
    });
    
    // Return the counts
    return res.status(200).json({
      status: "success",
      data: {
        masuk: masukCount,
        keluar: keluarCount
      }
    });
  } catch (error) {
    console.error("Error counting attendance:", error);
    return res.status(500).json({
      status: "error",
      message: "Error counting attendance data"
    });
  }
};

export default ApiAuth(handler, [Role.Admin]); 
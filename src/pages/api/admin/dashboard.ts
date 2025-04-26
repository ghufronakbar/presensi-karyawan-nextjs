import { NextApiRequest, NextApiResponse } from "next";
import { ApiAuth } from "@/middleware/api-auth";
import { db } from "@/config/db";
import { Role, LeaveStatus, User } from "@prisma/client";

// Define interface for authenticated request
interface AuthenticatedRequest extends NextApiRequest {
  user?: User;
}

/**
 * Get dashboard statistics for admin
 */
const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => {
  try {
    // Count total users
    const totalUsers = await db.user.count();

    // Count active users (non-deleted)
    const activeUsers = await db.user.count({
      where: {
        isDeleted: false,
      },
    });

    // Count today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await db.attendance.count({
      where: {
        time: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Count pending leave requests
    const pendingLeaves = await db.leave.count({
      where: {
        status: LeaveStatus.Pending,
      },
    });

    return res.status(200).json({
      message: "Berhasil mengambil data dashboard",
      data: {
        totalUsers,
        activeUsers,
        todayAttendance,
        pendingLeaves,
      },
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return res
      .status(500)
      .json({ message: "Failed to get dashboard statistics" });
  }
};

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  return getDashboardStats(req, res);
};

/**
 * API handler for admin dashboard
 */
export default ApiAuth(handler, [Role.Admin]);

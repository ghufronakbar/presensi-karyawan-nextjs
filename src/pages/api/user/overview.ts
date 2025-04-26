import { NextApiRequest, NextApiResponse } from "next";
import { ApiAuth } from "@/middleware/api-auth";
import { db } from "@/config/db";
import {
  AttendanceStatus,
  AttendanceType,
  LeaveStatus,
  LeaveType,
  Role,
} from "@prisma/client";

// Create a typed handler
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: "error",
      message: "Method not allowed",
    });
  }

  try {
    // Get user ID from token
    const userId = req.decoded?.id;
    
    if (!userId) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // Fetch user data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        staffNumber: true,
        position: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Get system information (for leave limits)
    const information = await db.information.findFirst();

    if (!information) {
      return res.status(404).json({
        status: "error",
        message: "System information not found",
      });
    }

    // Count total attendances for the current month
    const currentMonth = new Date();
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const totalAttendances = await db.attendance.count({
      where: {
        userId: userId,
        time: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        type: AttendanceType.Masuk,
      },
    });

    // Count today's attendance
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    const hasTodayAttendance = await db.attendance.findFirst({
      where: {
        userId: userId,
        time: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Count leaves by type
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    // Count work leaves
    const usedWorkLeaves = await db.leave.count({
      where: {
        userId: userId,
        type: LeaveType.Cuti,
        status: LeaveStatus.Diterima,
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    // Count sick leaves
    const usedSickLeaves = await db.leave.count({
      where: {
        userId: userId,
        type: LeaveType.Sakit,
        status: LeaveStatus.Diterima,
        date: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    // Count late attendances
    const lateAttendances = await db.attendance.count({
      where: {
        userId: userId,
        status: AttendanceStatus.Telat,
        time: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    // Count pending leaves
    const pendingLeaves = await db.leave.count({
      where: {
        userId: userId,
        status: LeaveStatus.Pending,
      },
    });

    // Prepare response
    const overview = {
      user: user,
      attendance: {
        monthlyTotal: totalAttendances,
        hasTodayAttendance: !!hasTodayAttendance,
        lateCount: lateAttendances,
      },
      leave: {
        workLeave: {
          limit: information.maxWorkLeave,
          used: usedWorkLeaves,
          remaining: information.maxWorkLeave - usedWorkLeaves,
        },
        sickLeave: {
          limit: information.maxSickLeave,
          used: usedSickLeaves,
          remaining: information.maxSickLeave - usedSickLeaves,
        },
        pending: pendingLeaves,
      },
    };

    return res.status(200).json({
      status: "success",
      data: overview,
    });
  } catch (error) {
    console.error("Error fetching user overview:", error);
    return res.status(500).json({
      status: "error",
      message: "Error fetching user overview",
    });
  }
};

export default ApiAuth(handler, [Role.Admin, Role.User]);

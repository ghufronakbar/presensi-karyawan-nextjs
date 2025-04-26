import { db } from "@/config/db";
import { NextApiRequest, NextApiResponse } from "next";
import { LeaveStatus, LeaveType } from "@prisma/client";
import { ApiAuth } from "@/middleware/api-auth";
import { Role } from "@prisma/client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { method } = req;
    const userId = req.decoded?.id;
    switch (method) {
      case "GET":
        return getLeaves(req, res, userId);
      case "POST":
        return createLeaveRequest(req, res, userId);
    }
  } catch (error) {
    console.error("Error leaves:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada sistem" });
  }
};

/**
 * Get all leaves for a user
 */
const getLeaves = async (
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) => {
  try {
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const leaves = await db.leave.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res
      .status(200)
      .json({ message: "Leaves fetched successfully", data: leaves });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada sistem" });
  }
};

/**
 * Create a new leave request with validations
 */
const createLeaveRequest = async (
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) => {
  try {
    const { reason, type, date, attachment } = req.body;

    // Check required fields
    if (!reason || !type || !date) {
      return res.status(400).json({
        message: "Mohon lengkapi semua data",
      });
    }

    // Validate leave type
    if (type !== "Sakit" && type !== "Cuti") {
      return res.status(400).json({
        message: "Tipe cuti harus 'Sakit' atau 'Cuti'",
      });
    }

    // Validate date format
    // example: 2025-04-26T00:00:00.000Z
    const leaveDate = new Date(date);
    if (isNaN(leaveDate.getTime())) {
      return res.status(400).json({
        message: "Format tanggal tidak valid",
      });
    }

    // Check if there is already an attendance for this date
    const startOfDay = new Date(leaveDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(leaveDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await db.attendance.findFirst({
      where: {
        AND: [
          {
            userId: userId,
          },
          {
            time: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        ],
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "Anda sudah memiliki rekaman kehadiran untuk tanggal ini",
      });
    }

    // Check if there is a pending or approved leave for this date
    const existingLeave = await db.leave.findFirst({
      where: {
        AND: [
          {
            userId: userId,
          },
          {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          {
            status: {
              in: [LeaveStatus.Pending, LeaveStatus.Diterima],
            },
          },
        ],
      },
    });

    if (existingLeave) {
      return res.status(400).json({
        message:
          "Anda sudah memiliki permintaan cuti yang pending atau disetujui untuk tanggal ini",
      });
    }

    // Create the leave request
    const newLeave = await db.leave.create({
      data: {
        userId: userId,
        reason: reason,
        type: type as LeaveType,
        date: leaveDate,
        attachment: attachment || null,
        status: LeaveStatus.Pending,
      },
    });

    return res.status(201).json({
      message: "Permintaan cuti berhasil dibuat",
      data: newLeave,
    });
  } catch (error) {
    console.error("Error creating leave request:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada sistem",
    });
  }
};

export default ApiAuth(handler, [Role.Admin, Role.User]);

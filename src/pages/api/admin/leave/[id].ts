import { db } from "@/config/db";
import { ApiAuth } from "@/middleware/api-auth";
import { NextApiRequest, NextApiResponse } from "next";
import { Role, LeaveStatus, LeaveType, AttendanceStatus, AttendanceType } from "@prisma/client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid leave ID" });
  }

  switch (req.method) {
    case "GET":
      return getLeaveById(req, res, id);
    case "PUT":
      return updateLeave(req, res, id);
    case "DELETE":
      return deleteLeave(req, res, id);
    default:
      return res.status(405).json({ message: "Method Not Allowed" });
  }
};

/**
 * Get leave by ID
 */
const getLeaveById = async (
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) => {
  try {
    const leave = await db.leave.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            staffNumber: true,
            position: true,
            role: true,
            image: true,
          },
        },
      },
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    return res.status(200).json({ data: leave });
  } catch (error) {
    console.error("Error getting leave:", error);
    return res.status(500).json({ message: "Error getting leave" });
  }
};

/**
 * Update leave status
 */
const updateLeave = async (
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) => {
  try {
    const { status } = req.body;

    // Validate status
    if (!status || !Object.values(LeaveStatus).includes(status as LeaveStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Get current leave
    const currentLeave = await db.leave.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!currentLeave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // Update leave status
    const updatedLeave = await db.leave.update({
      where: { id },
      data: {
        status: status as LeaveStatus,
      },
    });

    // If status changed to Diterima, create attendance record
    if (status === LeaveStatus.Diterima) {
      // Determine attendance status based on leave type
      let attendanceStatus: AttendanceStatus;
      if (currentLeave.type === LeaveType.Cuti) {
        attendanceStatus = AttendanceStatus.Ijin;
      } else {
        attendanceStatus = AttendanceStatus.Sakit;
      }

      // Create attendance record for the leave date with Masuk type
      await db.attendance.create({
        data: {
          userId: currentLeave.userId,
          time: new Date(currentLeave.date),
          type: AttendanceType.Masuk,
          status: attendanceStatus,
          lateTime: 0,
        },
      });
    }

    return res.status(200).json({
      message: `Leave status updated to ${status}`,
      data: updatedLeave,
    });
  } catch (error) {
    console.error("Error updating leave:", error);
    return res.status(500).json({ message: "Error updating leave" });
  }
};

/**
 * Delete leave
 */
const deleteLeave = async (
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) => {
  try {
    // Check if leave exists
    const leave = await db.leave.findUnique({
      where: { id },
    });

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // Only allow deletion if status is Pending
    if (leave.status !== LeaveStatus.Pending) {
      return res.status(400).json({
        message: "Cannot delete leave that has already been approved or rejected",
      });
    }

    // Delete the leave
    await db.leave.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Leave deleted successfully" });
  } catch (error) {
    console.error("Error deleting leave:", error);
    return res.status(500).json({ message: "Error deleting leave" });
  }
};

export default ApiAuth(handler, [Role.Admin]); // Only admin can approve/reject leave requests 
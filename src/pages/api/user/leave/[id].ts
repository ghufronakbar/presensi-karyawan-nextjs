import { NextApiRequest, NextApiResponse } from "next";
import { ApiAuth } from "@/middleware/api-auth";
import { db } from "@/config/db";
import { Role } from "@prisma/client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  const id = req.query.id as string;
  const userId = req.decoded?.id;

  if (!userId) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized",
    });
  }

  switch (method) {
    case "GET":
      return getLeaveDetail(req, res, id);
    default:
      return res.status(405).json({
        status: "error",
        message: "Method not allowed",
      });
  }
};

/**
 * Get leave detail by ID
 */
const getLeaveDetail = async (
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) => {
  try {
    // Find leave by ID and ensure it belongs to the current user
    const leave = await db.leave.findFirst({
      where: {
        id: id,
      },
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
    });

    if (!leave) {
      return res.status(404).json({
        status: "error",
        message: "Permintaan cuti tidak ditemukan atau tidak memiliki akses",
      });
    }

    return res.status(200).json({
      status: "success",
      data: leave,
    });
  } catch (error) {
    console.error("Error fetching leave detail:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada sistem",
    });
  }
};

export default ApiAuth(handler, [Role.Admin, Role.User]);

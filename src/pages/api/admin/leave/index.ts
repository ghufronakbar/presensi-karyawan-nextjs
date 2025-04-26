import { db } from "@/config/db";
import { ApiAuth } from "@/middleware/api-auth";
import { NextApiRequest, NextApiResponse } from "next";
import { Role } from "@prisma/client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "GET":
      return getLeaves(req, res);
    default:
      return res.status(405).json({ message: "Method Not Allowed" });
  }
};

/**
 * Get all leaves with user details
 */
const getLeaves = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Fetch leaves with user details
    const leaves = await db.leave.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ data: leaves });
  } catch (error) {
    console.error("Error getting leaves:", error);
    return res.status(500).json({ message: "Error getting leaves" });
  }
};

export default ApiAuth(handler, [Role.Admin, Role.User]); // Both admin and users can access this endpoint

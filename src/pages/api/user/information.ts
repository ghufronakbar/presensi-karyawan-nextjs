import { NextApiRequest, NextApiResponse } from "next";
import { ApiAuth } from "@/middleware/api-auth";
import { db } from "@/config/db";
import { Role } from "@prisma/client";

// Create a typed handler
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: "error",
      message: "Method not allowed",
    });
  }

  try {
    const informations = await db.information.findMany();
    const information = informations[0];

    return res.status(200).json({
      status: "success",
      data: information,
    });
  } catch (error) {
    console.error("Error fetching information:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export default ApiAuth(handler, [Role.Admin, Role.User]);

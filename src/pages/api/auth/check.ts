import { NextApiRequest, NextApiResponse } from "next";
import { ApiAuth } from "@/middleware/api-auth";
import { db } from "@/config/db";
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const user = await db.user.findUnique({
      where: {
        id: req.decoded?.id || "",
      },
    });
    if (!user || user.isDeleted) {
      return res.status(401).json({ message: "Token tidak valid" });
    }
    return res
      .status(200)
      .json({
        message: "Token valid",
        data: { ...user, token: req.headers?.authorization?.split(" ")[1] },
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Terjadi kesalahan sistem" });
  }
};

export default ApiAuth(handler, ["Admin", "User"]);

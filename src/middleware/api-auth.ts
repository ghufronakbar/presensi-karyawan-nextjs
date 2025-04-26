import { JWT_SECRET } from "@/constants/env";
import { Role } from "@prisma/client";
import { db } from "@/config/db";
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export const ApiAuth = (
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  roles: Role[]
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {      
      const token = req?.headers?.authorization;
      if (!token) return res.status(401).json({ message: "Unauthorized" });
      
      const bearerToken = token.split(" ")?.[1]

      if (!bearerToken) return res.status(401).json({ message: "Unauthorized" });

      const decoded = jwt.verify(bearerToken, JWT_SECRET);
      if (!decoded) return res.status(401).json({ message: "Unauthorized" });

      if (typeof decoded === "string") {
        return res.status(401).json({ message: "Invalid token format" });
      }

      const user = await db.user.findUnique({
        where: {
          id: decoded.id,
        },
      });

      if (!user) return res.status(401).json({ message: "Unauthorized" });

      if (!roles.includes(user.role))
        return res.status(401).json({ message: "Unauthorized" });

      // Attach decoded token to request object
      req.decoded = decoded;

      return handler(req, res);
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
};

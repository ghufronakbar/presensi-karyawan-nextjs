import { db } from "@/config/db";
import { NextApiResponse } from "next";

import { NextApiRequest } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.query.db) {
    const testDb = await db.user.count();
    return res.status(200).json({ message: "Hello World", testDb });
  }
  return res.status(200).json({ message: "Hello World" });
};

export default handler;

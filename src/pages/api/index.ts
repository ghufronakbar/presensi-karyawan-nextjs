import { db } from "@/config/db";
import { NextApiResponse } from "next";

import { NextApiRequest } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.query.db) {
      const testDb = await db.user.count();
      return res.status(200).json({ message: "Hello World", testDb });
    }
    return res.status(200).json({ message: "Hello World" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export default handler;

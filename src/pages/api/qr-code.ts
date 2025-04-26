import { db } from "@/config/db";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const informations = await db.information.findMany({
    select: {
      qrCode: true,
    },
  });
  const information = informations[0];

  return res.status(200).json({
    status: "success",
    data: information,
  });
};

export default handler;

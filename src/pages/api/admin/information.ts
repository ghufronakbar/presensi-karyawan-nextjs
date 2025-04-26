import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/config/db";
import { ApiAuth } from "@/middleware/api-auth";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/constants/env";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;

  try {
    switch (method) {
      case "GET":
        return getInformation(req, res);
      case "POST":
        return updateInformation(req, res);
      case "PATCH":
        return generateQrCode(req, res);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan sistem" });
  }
};

const getInformation = async (req: NextApiRequest, res: NextApiResponse) => {
  const informations = await db.information.findMany();
  const information = informations[0];  
  return res.status(200).json({ data: information });
};
// startTime     String // Time for starting work (e.g., "07:00")
// endTime       String // Deadline for check-in before considered late (e.g., "08:00")
// dismissalTime String // Time when employees can check-out (e.g., "15:00")
// maxWorkLeave  Int // Maximum number of vacation days allowed
// maxSickLeave  Int // Maximum number of sick days allowed
const updateInformation = async (req: NextApiRequest, res: NextApiResponse) => {
  const { startTime, endTime, dismissalTime, maxWorkLeave, maxSickLeave } =
    req.body;

  if (
    !startTime ||
    !endTime ||
    !dismissalTime ||
    !maxWorkLeave ||
    !maxSickLeave
  ) {
    return res.status(400).json({ message: "Harap mengisi semua data" });
  }

  if (isNaN(maxWorkLeave) || isNaN(maxSickLeave)) {
    return res.status(400).json({ message: "Jumlah cuti harus berupa angka" });
  }

  //format time HH:MM
  const startTimeFormatted = startTime.split(":");
  const endTimeFormatted = endTime.split(":");
  const dismissalTimeFormatted = dismissalTime.split(":");

  if (
    startTimeFormatted.length !== 2 ||
    endTimeFormatted.length !== 2 ||
    dismissalTimeFormatted.length !== 2
  ) {
    return res.status(400).json({ message: "Format waktu tidak valid" });
  }

  if (
    startTimeFormatted[0].length !== 2 ||
    endTimeFormatted[0].length !== 2 ||
    dismissalTimeFormatted[0].length !== 2
  ) {
    return res.status(400).json({ message: "Format waktu tidak valid" });
  }

  if (
    startTimeFormatted[1].length !== 2 ||
    endTimeFormatted[1].length !== 2 ||
    dismissalTimeFormatted[1].length !== 2
  ) {
    return res.status(400).json({ message: "Format waktu tidak valid" });
  }

  const startTimeInt = parseInt(startTimeFormatted[0]);
  const endTimeInt = parseInt(endTimeFormatted[0]);
  const dismissalTimeInt = parseInt(dismissalTimeFormatted[0]);

  if (startTimeInt < 0 || endTimeInt < 0 || dismissalTimeInt < 0) {
    return res.status(400).json({ message: "Waktu tidak boleh negatif" });
  }

  if (startTimeInt > 23 || endTimeInt > 23 || dismissalTimeInt > 23) {
    return res.status(400).json({ message: "Waktu tidak boleh lebih dari 23" });
  }

  const informations = await db.information.findMany();
  const information = informations[0];

  const updatedInformation = await db.information.update({
    where: { id: information.id },
    data: { startTime, endTime, dismissalTime, maxWorkLeave, maxSickLeave },
  });

  return res
    .status(200)
    .json({ message: "Data berhasil diubah", data: updatedInformation });
};

const generateQrCode = async (req: NextApiRequest, res: NextApiResponse) => {
  const informations = await db.information.findMany();
  const information = informations[0];

  const qrCode = jwt.sign({ id: information.id }, JWT_SECRET);

  const updatedInformation = await db.information.update({
    where: { id: information.id },
    data: { qrCode },
  });

  return res
    .status(200)
    .json({ message: "QR Code berhasil dibuat", data: updatedInformation });
};

export default ApiAuth(handler, ["Admin"]);

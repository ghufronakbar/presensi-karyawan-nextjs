import { NextApiRequest, NextApiResponse } from "next";
import { ApiAuth } from "@/middleware/api-auth";
import { db } from "@/config/db";
import { AttendanceStatus, AttendanceType, Role } from "@prisma/client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const userId = req.decoded?.id;
  if (!userId) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized",
    });
  }
  switch (req.method) {
    case "GET":
      return getAttendance(req, res, userId);
    case "POST":
      return makeAttendance(req, res, userId);
    default:
      return res.status(405).json({
        status: "error",
        message: "Method not allowed",
      });
  }
};

const getAttendance = async (
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) => {
  try {
    // Get user's attendance history (check-in)
    const masukAttendances = await db.attendance.findMany({
      where: {
        AND: [
          {
            userId: userId,
          },
          {
            type: AttendanceType.Masuk,
          },
        ],
      },
      orderBy: {
        time: "desc",
      },
    });

    // Get user's attendance history (check-out)
    const keluarAttendances = await db.attendance.findMany({
      where: {
        AND: [
          {
            userId: userId,
          },
          {
            type: AttendanceType.Keluar,
          },
        ],
      },
      orderBy: {
        time: "desc",
      },
    });

    // Return the data in the required format
    return res.status(200).json({
      status: "success",
      data: {
        masuk: masukAttendances,
        keluar: keluarAttendances,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada sistem",
    });
  }
};

const makeAttendance = async (
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) => {
  try {
    const { qrCode } = req.body;
    if (!qrCode) {
      return res.status(400).json({
        message: "QR Code tidak boleh kosong",
      });
    }
    let type: AttendanceType = AttendanceType.Masuk;
    let status: AttendanceStatus = AttendanceStatus.Hadir;
    const now = new Date();
    const informations = await db.information.findFirst({
      where: {
        qrCode: qrCode,
      },
    });
    if (!informations) {
      return res.status(404).json({
        message: "QR Code tidak valid",
      });
    }

    // Convert string time values to numbers for comparison
    const startTimeHour = parseInt(informations.startTime.split(":")[0], 10);
    const endTimeHour = parseInt(informations.endTime.split(":")[0], 10);
    const dismissalTimeHour = parseInt(
      informations.dismissalTime.split(":")[0],
      10
    );

    if (now.getHours() < startTimeHour) {
      return res.status(400).json({
        message: "Belum waktunya absen masuk",
      });
    }
    if (now.getHours() > startTimeHour && now.getHours() < endTimeHour) {
      status = AttendanceStatus.Hadir;
    }
    if (now.getHours() > endTimeHour && now.getHours() < dismissalTimeHour) {
      status = AttendanceStatus.Telat;
    }

    if (now.getHours() > dismissalTimeHour) {
      type = AttendanceType.Keluar;
      status = AttendanceStatus.Hadir;
    }

    const checkAttendance = await db.attendance.findFirst({
      where: {
        AND: [
          {
            userId: userId,
          },
          {
            type: type,
          },
          {
            time: {
              gte: new Date(new Date().setDate(new Date().getDate() - 1)),
              lte: new Date(new Date().setDate(new Date().getDate() + 1)),
            },
          },
        ],
      },
    });
    if (checkAttendance) {
      return res.status(400).json({
        message: "Anda sudah absen " + type.toLowerCase(),
      });
    }
    
    // Create the attendance record
    const attendance = await db.attendance.create({
      data: {
        userId: userId,
        type: type,
        status: status,
        time: now.toISOString(),
      },
    });

    return res.status(200).json({
      message: "Berhasil presensi " + type.toLowerCase(),
      data: attendance,
    });
  } catch (error) {
    console.error("Error making attendance:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada sistem",
    });
  }
};

export default ApiAuth(handler, [Role.Admin, Role.User]);

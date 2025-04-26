import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/config/db";
import { ApiAuth } from "@/middleware/api-auth";
import { AttendanceStatus, AttendanceType, User } from "@prisma/client";
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  try {
    switch (method) {
      case "GET":
        return getAttendance(req, res);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Terjadi kesalahan sistem" });
  }
};
export type ExtendedAttendanceStatus = AttendanceStatus | "Belum" | "Alpa";

export interface UserWithAttendance extends User {
  status: ExtendedAttendanceStatus;
  time: Date | null;
  late: number;
}

const getAttendance = async (req: NextApiRequest, res: NextApiResponse) => {
  const date = (req.query.date as string) || new Date().toISOString();
  const masuk = req.query.type === "masuk";
  const now = new Date();

  const [users, attendances, information] = await Promise.all([
    db.user.findMany(),
    db.attendance.findMany({
      where: {
        AND: [
          {
            time: {
              gte: new Date(`${date}T00:00:00Z`),
              lte: new Date(`${date}T23:59:59Z`),
            },
          },
          {
            type: masuk ? AttendanceType.Masuk : AttendanceType.Keluar,
          },
        ],
      },
    }),
    db.information.findFirst(),
  ]);

  if (!information) {
    return res.status(404).json({ message: "Data informasi tidak ditemukan" });
  }

  const attendanceWithUser: UserWithAttendance[] = users.map((user) => {
    const attendance = attendances.find(
      (attendance) => attendance.userId === user.id
    );
    const endTime = new Date(information.endTime);
    const startTime = new Date(information.startTime);
    if (attendance) {
      return {
        ...user,
        status: attendance.status as ExtendedAttendanceStatus,
        time: attendance.time,
        late: attendance.lateTime,
      };
    }
    if (masuk && now > startTime && now < endTime) {
      return {
        ...user,
        status: "Belum",
        time: null,
        late: 0,
      };
    }
    return {
      ...user,
      status: "Alpa",
      time: null,
      late: 0,
    };
  });
  return res.status(200).json({ data: attendanceWithUser });
};

export default ApiAuth(handler, ["Admin"]);

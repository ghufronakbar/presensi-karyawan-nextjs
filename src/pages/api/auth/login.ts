import { db } from "@/config/db";
import { JWT_SECRET } from "@/constants/env";
import jwt from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    const { email, password } = await req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email dan password harus diisi" });

    const user = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword)
      return res.status(401).json({ message: "Password salah" });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);

    return res.status(200).json({
      message: "Berhasil login",
      data: { ...user, token },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Terjadi kesalahan sistem" });
  }
};

export default handler;

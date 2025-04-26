import { db } from "@/config/db";
import { ApiAuth } from "@/middleware/api-auth";
import { NextApiRequest, NextApiResponse } from "next";
import { Role } from "@prisma/client";
import { createAndSendPassword, sendWelcomeEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "GET":
      return getUsers(req, res);
    case "POST":
      return createUser(req, res);
    default:
      return res.status(405).json({ message: "Metode tidak diizinkan" });
  }
};

/**
 * Get all users with leave calculations
 */
const getUsers = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const users = await db.user.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        staffNumber: true,
        position: true,
        role: true,
        image: true,
        createdAt: true,
        leaves: {
          select: {
            id: true,
            status: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate leave statistics for each user
    const usersWithLeaveStats = users.map((user) => {
      const pendingLeaves = user.leaves.filter(
        (leave) => leave.status === "Pending"
      ).length;
      const approvedLeaves = user.leaves.filter(
        (leave) => leave.status === "Diterima"
      ).length;

      // Remove leaves array from response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { leaves, ...userData } = user;

      return {
        ...userData,
        pendingLeaves,
        approvedLeaves,
      };
    });

    return res.status(200).json({
      data: usersWithLeaveStats,
    });
  } catch (error) {
    console.error("Error getting users:", error);
    return res.status(500).json({ message: "Gagal mengambil data pengguna" });
  }
};

/**
 * Create a new user
 */
const createUser = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { name, email, staffNumber, position, role } = req.body;

    // Validate required fields
    if (!name || !email || !staffNumber || !position) {
      return res
        .status(400)
        .json({ message: "Data yang diperlukan tidak lengkap" });
    }

    if (role !== "User" && role !== "Admin") {
      return res.status(400).json({ message: "Role tidak valid" });
    }

    // Check for duplicate email
    const existingEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(400).json({ message: "Email sudah digunakan" });
    }

    // Check for duplicate staff number
    const existingStaffNumber = await db.user.findUnique({
      where: { staffNumber },
    });

    if (existingStaffNumber) {
      return res.status(400).json({ message: "Nomor staf sudah digunakan" });
    }

    // Generate password and send email
    const password = await createAndSendPassword(name, email);
    const send = await sendWelcomeEmail(name, email, password);
    if (!send) {
      return res.status(500).json({ message: "Gagal mengirim email" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        staffNumber,
        position,
        role: role || "User",
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        staffNumber: true,
        position: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Pengguna berhasil dibuat",
      data: user,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Gagal membuat pengguna" });
  }
};

export default ApiAuth(handler, [Role.Admin]);

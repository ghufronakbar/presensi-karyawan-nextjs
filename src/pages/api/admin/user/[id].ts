import { db } from "@/config/db";
import { ApiAuth } from "@/middleware/api-auth";
import { NextApiRequest, NextApiResponse } from "next";
import { Role } from "@prisma/client";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "ID pengguna tidak valid" });
  }

  switch (req.method) {
    case "GET":
      return getUser(req, res, id);
    case "PUT":
      return updateUser(req, res, id);
    case "DELETE":
      return deleteUser(req, res, id);
    default:
      return res.status(405).json({ message: "Metode tidak diizinkan" });
  }
};

/**
 * Get a specific user by ID with attendance data
 */
const getUser = async (
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) => {
  try {
    const user = await db.user.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        name: true,
        email: true,
        staffNumber: true,
        position: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        attendances: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            time: true,
            type: true,
            status: true,
            lateTime: true,
            createdAt: true,
          },
        },
        leaves: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            reason: true,
            attachment: true,
            type: true,
            date: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    return res.status(200).json({ data: user });
  } catch (error) {
    console.error("Error getting user:", error);
    return res.status(500).json({ message: "Gagal mendapatkan data pengguna" });
  }
};

/**
 * Update a user (without password)
 */
const updateUser = async (
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) => {
  try {
    const { name, email, staffNumber, position, role } = req.body;

    if (!name && !email && !staffNumber && !position && !role) {
      return res.status(400).json({ message: "Data tidak boleh kosong" });
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    // Check for duplicate email if email is being changed
    if (email && email !== existingUser.email) {
      const existingEmail = await db.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return res.status(400).json({ message: "Email sudah digunakan" });
      }
    }

    // Check for duplicate staff number if staffNumber is being changed
    if (staffNumber && staffNumber !== existingUser.staffNumber) {
      const existingStaffNumber = await db.user.findUnique({
        where: { staffNumber },
      });

      if (existingStaffNumber) {
        return res.status(400).json({ message: "Nomor staf sudah digunakan" });
      }
    }

    const data = {
      name: name,
      email: email,
      staffNumber: staffNumber,
      position: position,
      role: role,
    };

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        staffNumber: true,
        position: true,
        role: true,
        image: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "Pengguna berhasil diperbarui",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Gagal memperbarui pengguna" });
  }
};

/**
 * Soft delete a user
 */
const deleteUser = async (
  req: NextApiRequest,
  res: NextApiResponse,
  id: string
) => {
  try {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser || existingUser.isDeleted) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    // Soft delete the user
    await db.user.update({
      where: { id },
      data: { isDeleted: true },
    });

    return res.status(200).json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Gagal menghapus pengguna" });
  }
};

export default ApiAuth(handler, [Role.Admin]);

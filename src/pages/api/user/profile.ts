import { NextApiRequest, NextApiResponse } from "next";
import { ApiAuth } from "@/middleware/api-auth";
import { db } from "@/config/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/constants/env";

interface DecodedToken {
  id: string;
  role: Role;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "GET":
      return getProfile(req, res);
    case "PUT":
      return updateProfile(req, res);
    case "PATCH":
      return updatePassword(req, res);
    default:
      return res.status(405).json({
        status: "error",
        message: "Method not allowed",
      });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Get current user ID from auth middleware
    const decoded = req?.decoded as DecodedToken;

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // Find user in database
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        staffNumber: true,
        position: true,
        role: true,
        image: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    console.error("Error getting profile:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

/**
 * Update user profile (without password)
 */
const updateProfile = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Get current user ID from auth middleware
    const decoded = req?.decoded as DecodedToken;

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const { name, email, position, image } = req.body;

    // Validate required fields
    if (!name || !email || !position) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields",
      });
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Check for duplicate email if email is being changed
    if (email !== user.email) {
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== decoded.id) {
        return res.status(400).json({
          status: "error",
          message: "Email sudah terdaftar",
        });
      }
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: decoded.id },
      data: {
        name,
        email,
        position,
        image: image || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        staffNumber: true,
        position: true,
        role: true,
        image: true,
      },
    });

    // Generate a new token
    const token = generateToken(updatedUser.id, updatedUser.role);

    return res.status(200).json({
      status: "success",
      message: "Profile berhasil diubah",
      data: {
        ...updatedUser,
        token,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada sistem",
    });
  }
};

/**
 * Update user password
 */
const updatePassword = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Get current user ID from auth middleware
    const decoded = req?.decoded as DecodedToken;

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Password saat ini dan password baru harus diisi",
      });
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User tidak ditemukan",
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        status: "error",
        message: "Password saat ini salah",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await db.user.update({
      where: { id: decoded.id },
      data: {
        password: hashedPassword,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada sistem",
    });
  }
};

/**
 * Generate JWT token for user
 */
const generateToken = (userId: string, userRole: Role) => {
  return jwt.sign({ id: userId, role: userRole }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export default ApiAuth(handler, [Role.Admin, Role.User]);

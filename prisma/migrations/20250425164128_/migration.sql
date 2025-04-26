-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'User');

-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('Masuk', 'Keluar');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('Hadir', 'Ijin', 'Sakit', 'Telat');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('Cuti', 'Sakit');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('Pending', 'Diterima', 'Ditolak');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "staffNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "image" TEXT,
    "position" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'User',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Information" (
    "id" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "dismissalTime" TEXT NOT NULL,
    "maxWorkLeave" INTEGER NOT NULL,
    "maxSickLeave" INTEGER NOT NULL,
    "qrCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "type" "AttendanceType" NOT NULL,
    "lateTime" INTEGER NOT NULL DEFAULT 0,
    "status" "AttendanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leave" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "attachment" TEXT,
    "type" "LeaveType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_staffNumber_key" ON "User"("staffNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

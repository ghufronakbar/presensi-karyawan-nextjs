const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const prisma = new PrismaClient();

const seedAdmin = async () => {
  const admin = await prisma.user.findUnique({
    where: {
      email: "admin@example.com",
    },
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash("12345678", 10);
    await prisma.user.create({
      data: {
        email: "admin@example.com",
        name: "Admin",
        staffNumber: "10000000",
        password: hashedPassword,
        position: "Admin",
        role: "Admin",
      },
    });
    console.log("Admin created");
  } else {
    console.log("Admin already exists");
  }
};

const seedUser = async () => {
  const user = await prisma.user.findUnique({
    where: {
      email: "user@example.com",
    },
  });

  if (!user) {
    const hashedPassword = await bcrypt.hash("12345678", 10);
    await prisma.user.create({
      data: {
        email: "user@example.com",
        name: "User",
        staffNumber: "10000001",
        password: hashedPassword,
        position: "User",
        role: "User",
      },
    });
    console.log("User created");
  } else {
    console.log("User already exists");
  }
};

const seedInformation = async () => {
  const information = await prisma.information.findMany();
  const qrCode = jwt.sign({ id: "QR_CODE" }, JWT_SECRET);
  if (information.length === 0) {
    await prisma.information.create({
      data: {
        dismissalTime: "17:00",
        endTime: "12:00",
        maxSickLeave: 14,
        maxWorkLeave: 14,
        qrCode,
        startTime: "08:00",
      },
    });
    console.log("Information created");
  } else {
    console.log("Information already exists");
  }
};

const seedLeavesAndAttendances = async () => {
  // Get the user
  const user = await prisma.user.findUnique({
    where: {
      email: "user@example.com",
    },
  });

  if (!user) {
    console.log("User not found, cannot create leaves and attendances");
    return;
  }

  // Check if we already have seed data
  const existingLeaves = await prisma.leave.count({
    where: {
      userId: user.id,
    },
  });

  if (existingLeaves > 0) {
    console.log("Leaves and attendances already exist, skipping seed");
    return;
  }

  console.log("Creating leaves and attendances for March to May 2025...");

  // Create some leaves with different statuses
  const leaves = [
    // March 2025
    {
      userId: user.id,
      reason: "Annual vacation",
      type: "Cuti",
      date: new Date(2025, 2, 10), // March 10, 2025
      status: "Diterima",
    },
    {
      userId: user.id,
      reason: "Family gathering",
      type: "Cuti",
      date: new Date(2025, 2, 15), // March 15, 2025
      status: "Ditolak",
    },
    {
      userId: user.id,
      reason: "Fever",
      type: "Sakit",
      date: new Date(2025, 2, 20), // March 20, 2025
      status: "Diterima",
      attachment: "medical_certificate_march20.pdf",
    },
    // April 2025
    {
      userId: user.id,
      reason: "Personal matters",
      type: "Cuti",
      date: new Date(2025, 3, 5), // April 5, 2025
      status: "Pending",
    },
    {
      userId: user.id,
      reason: "Dental appointment",
      type: "Sakit",
      date: new Date(2025, 3, 12), // April 12, 2025
      status: "Diterima",
      attachment: "dental_receipt.pdf",
    },
    {
      userId: user.id,
      reason: "Family event",
      type: "Cuti",
      date: new Date(2025, 3, 25), // April 25, 2025
      status: "Diterima",
    },
    // May 2025
    {
      userId: user.id,
      reason: "COVID-19 symptoms",
      type: "Sakit",
      date: new Date(2025, 4, 3), // May 3, 2025
      status: "Diterima",
      attachment: "covid_test.pdf",
    },
    {
      userId: user.id,
      reason: "Anniversary celebration",
      type: "Cuti",
      date: new Date(2025, 4, 15), // May 15, 2025
      status: "Diterima",
    },
    {
      userId: user.id,
      reason: "Family emergency",
      type: "Cuti",
      date: new Date(2025, 4, 20), // May 20, 2025
      status: "Pending",
    },
  ];

  // Create leaves
  for (const leave of leaves) {
    await prisma.leave.create({
      data: leave,
    });
  }

  console.log(`Created ${leaves.length} leaves`);

  // Create attendance records for accepted leaves
  const attendancesForLeaves = leaves
    .filter(leave => leave.status === "Diterima")
    .map(leave => ({
      userId: user.id,
      time: new Date(
        leave.date.getFullYear(),
        leave.date.getMonth(),
        leave.date.getDate(),
        8, 0, 0 // 8:00 AM
      ),
      type: "Masuk",
      status: leave.type === "Sakit" ? "Sakit" : "Ijin",
    }));

  // Create regular attendance records for other days
  const startDate = new Date(2025, 2, 1); // March 1, 2025
  const endDate = new Date(2025, 4, 31); // May 31, 2025

  // Keep track of dates with leaves
  const leaveDates = leaves
    .filter(leave => leave.status === "Diterima")
    .map(leave => leave.date.toDateString());

  // Generate regular attendance for each day
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    
    // Skip days with leaves
    if (leaveDates.includes(d.toDateString())) continue;

    // Random chance of being late (20%)
    const isLate = Math.random() < 0.2;
    const lateMinutes = isLate ? Math.floor(Math.random() * 30) + 1 : 0;
    
    // Check-in record
    await prisma.attendance.create({
      data: {
        userId: user.id,
        time: new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          8, // 8:00 AM base
          isLate ? lateMinutes : 0, // Add minutes if late
          0
        ),
        type: "Masuk",
        status: isLate ? "Telat" : "Hadir",
        lateTime: lateMinutes,
      },
    });

    // Check-out record
    await prisma.attendance.create({
      data: {
        userId: user.id,
        time: new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          17, // 5:00 PM
          Math.floor(Math.random() * 30), // Random minutes 0-29
          0
        ),
        type: "Keluar",
        status: "Hadir",
      },
    });
  }

  // Create attendance records for leave days
  for (const attendance of attendancesForLeaves) {
    await prisma.attendance.create({
      data: attendance,
    });
  }

  console.log("Created attendance records for March to May 2025");
};

const seed = async () => {
  console.log("Seeding data...");
  await seedAdmin();
  await seedUser();
  await seedInformation();
  await seedLeavesAndAttendances();
  console.log("Seeding data completed");
};

seed();

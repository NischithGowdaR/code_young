import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MENTORS_DATA = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@codeyoung.example',
    timezone: 'Asia/Kolkata',
    maxDailyBookings: 2,
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@codeyoung.example',
    timezone: 'Asia/Kolkata',
    maxDailyBookings: 2,
  },
  {
    name: 'Rohan Gupta',
    email: 'rohan.gupta@codeyoung.example',
    timezone: 'Asia/Kolkata',
    maxDailyBookings: 2,
  },
  {
    name: 'Ananya Verma',
    email: 'ananya.verma@codeyoung.example',
    timezone: 'Asia/Kolkata',
    maxDailyBookings: 2,
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@codeyoung.example',
    timezone: 'Asia/Kolkata',
    maxDailyBookings: 2,
  },
  {
    name: 'Neha Joshi',
    email: 'neha.joshi@codeyoung.example',
    timezone: 'Asia/Kolkata',
    maxDailyBookings: 2,
  },
  {
    name: 'Kavya Nair',
    email: 'kavya.nair@codeyoung.example',
    timezone: 'Asia/Kolkata',
    maxDailyBookings: 2,
  },
  {
    name: 'Aditya Rao',
    email: 'aditya.rao@codeyoung.example',
    timezone: 'Asia/Kolkata',
    maxDailyBookings: 2,
  },
  {
    name: 'Diya Reddi',
    email: 'diya.reddi@codeyoung.example',
    timezone: 'Asia/Kolkata',
    maxDailyBookings: 2,
  },
  {
    name: 'Kabir Mehta',
    email: 'kabir.mehta@codeyoung.example',
    timezone: 'Asia/Kolkata',
    maxDailyBookings: 2,
  },
];

async function main() {
  console.log('🌱 Starting database seed script...');

  // 1. Seed Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@codeyoung.example';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePassword123!';
  const adminName = process.env.ADMIN_NAME || 'CodeYoung Admin';

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      timezone: 'UTC',
    },
  });

  console.log(`✅ Admin user seeded: ${adminUser.email}`);

  // 2. Seed 10 Mentors with Weekly Availability
  for (const data of MENTORS_DATA) {
    const mentor = await prisma.mentor.upsert({
      where: { email: data.email },
      update: {
        name: data.name,
        timezone: data.timezone,
        maxDailyBookings: data.maxDailyBookings,
      },
      create: {
        name: data.name,
        email: data.email,
        timezone: data.timezone,
        maxDailyBookings: data.maxDailyBookings,
        active: true,
      },
    });

    // Create Monday-Sunday availability (dayOfWeek 1-7, 08:00 - 22:00)
    await prisma.mentorAvailability.deleteMany({
      where: { mentorId: mentor.id },
    });

    const availabilities = [];
    for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
      availabilities.push({
        mentorId: mentor.id,
        dayOfWeek,
        startLocalTime: '08:00',
        endLocalTime: '22:00',
        active: true,
      });
    }

    await prisma.mentorAvailability.createMany({
      data: availabilities,
    });

    console.log(`✅ Mentor seeded: ${mentor.name} (${mentor.timezone})`);
  }

  console.log('🎉 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

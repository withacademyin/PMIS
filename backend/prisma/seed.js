import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial ITI Portal data...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hiringportal.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Default admin created: ${adminEmail}`);
  } else {
    console.log('Admin user already exists.');
  }

  // Seed default Officer (Rahul Sharma - Gorakhpur)
  const officerEmail = 'officer@example.com';
  const existingOfficer = await prisma.user.findUnique({ where: { email: officerEmail } });
  if (!existingOfficer) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    const officerUser = await prisma.user.create({
      data: {
        email: officerEmail,
        password: hashedPassword,
        role: 'OFFICER',
        officerProfile: {
          create: {
            name: 'Rahul Sharma',
            district: 'Gorakhpur',
            department: 'Skill Development & Entrepreneurship',
            isVerified: true
          }
        }
      }
    });
    console.log(`✅ Default officer created: ${officerEmail} (Gorakhpur)`);
  }

  // Seed default Worker (Mohan Kumar - Electrician)
  const workerEmail = 'worker@gmail.com';
  const existingWorker = await prisma.user.findUnique({ where: { email: workerEmail } });
  if (!existingWorker) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    await prisma.user.create({
      data: {
        email: workerEmail,
        password: hashedPassword,
        role: 'WORKER',
        workerProfile: {
          create: {
            fullName: 'Mohan Kumar',
            trade: 'Electrician',
            experienceYears: 2,
            availabilityStatus: 'AVAILABLE',
            isVerified: true,
            skills: ['Wiring', 'Motor Rewinding', 'Circuit Testing']
          }
        }
      }
    });
    console.log(`✅ Default worker created: ${workerEmail}`);
  }

  // Initialize SystemSettings if not present
  const settings = await prisma.systemSettings.findFirst();
  if (!settings) {
    await prisma.systemSettings.create({
      data: {
        id: 1,
        allowedITIs: [],
        allowedTrades: ['Electrician', 'Fitter', 'Welder', 'Mechanic', 'Turner', 'Machinist', 'COPA', 'Plumber'],
        allowedEmailDomains: [],
      }
    });
    console.log('✅ Default SystemSettings initialized.');
  }

  console.log('Seeding completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

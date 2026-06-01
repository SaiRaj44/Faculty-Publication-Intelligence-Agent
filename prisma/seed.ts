import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Starting database seeding for IIT Tirupati...');

  // Clean existing data for a fresh seed
  await prisma.validationResult.deleteMany({});
  await prisma.publicationMetadata.deleteMany({});
  await prisma.publication.deleteMany({});
  await prisma.batchJob.deleteMany({});
  
  await prisma.user.deleteMany({});
  await prisma.faculty.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.institution.deleteMany({});

  // 1. Create Institution (IIT Tirupati)
  const inst = await prisma.institution.upsert({
    where: { code: 'IIT-T' },
    update: {},
    create: {
      name: 'IIT Tirupati',
      code: 'IIT-T',
      domain: 'iittp.ac.in',
      address: 'Yerpedu – Venkatagiri Road, Yerpedu Post',
      city: 'Tirupati',
      state: 'Andhra Pradesh',
      country: 'India',
      website: 'https://iittp.ac.in',
    },
  });
  console.log(`Institution created: ${inst.name}`);

  // 2. Create Departments
  const deptCS = await prisma.department.upsert({
    where: { code_institutionId: { code: 'CSE', institutionId: inst.id } },
    update: {},
    create: { name: 'Computer Science and Engineering', code: 'CSE', institutionId: inst.id },
  });
  
  const deptECE = await prisma.department.upsert({
    where: { code_institutionId: { code: 'ECE', institutionId: inst.id } },
    update: {},
    create: { name: 'Electrical Engineering', code: 'EE', institutionId: inst.id },
  });
  console.log(`Departments created`);

  // 3. Create Users and Faculty
  const hashedPassword = await bcrypt.hash('password123', 12);

  // --- LOGIN 1: Institute Admin ---
  await prisma.user.upsert({
    where: { email: 'admin@iittp.ac.in' },
    update: {},
    create: {
      email: 'admin@iittp.ac.in',
      name: 'IIT Tirupati Admin',
      password: hashedPassword,
      role: UserRole.INSTITUTION_ADMIN,
      institutionId: inst.id,
    },
  });

  // --- LOGIN 2: HoD (CSE) ---
  const hodUser = await prisma.user.upsert({
    where: { email: 'hod.cs@iittp.ac.in' },
    update: {},
    create: {
      email: 'hod.cs@iittp.ac.in',
      name: 'Dr. Turing (HoD)',
      password: hashedPassword,
      role: UserRole.HOD,
      institutionId: inst.id,
    },
  });

  const hodFaculty = await prisma.faculty.upsert({
    where: { email: 'hod.cs@iittp.ac.in' },
    update: {},
    create: {
      employeeId: 'EMP-HOD-01',
      name: 'Dr. Turing (HoD)',
      designation: 'Professor & Head',
      specialization: 'Artificial Intelligence',
      email: 'hod.cs@iittp.ac.in',
      departmentId: deptCS.id,
      institutionId: inst.id,
    },
  });

  await prisma.user.update({
    where: { id: hodUser.id },
    data: { facultyId: hodFaculty.id },
  });
  await prisma.department.update({
    where: { id: deptCS.id },
    data: { headFacultyId: hodFaculty.id },
  });

  // --- LOGIN 3: Faculty (Dr. Sairaj) ---
  const sairajUser = await prisma.user.upsert({
    where: { email: 'sairaj.cs@iittp.ac.in' },
    update: {},
    create: {
      email: 'sairaj.cs@iittp.ac.in',
      name: 'Dr. Sairaj',
      password: hashedPassword,
      role: UserRole.FACULTY,
      institutionId: inst.id,
    },
  });

  const sairajFaculty = await prisma.faculty.upsert({
    where: { email: 'sairaj.cs@iittp.ac.in' },
    update: {},
    create: {
      employeeId: 'EMP-FAC-01',
      name: 'Dr. Sairaj',
      designation: 'Associate Professor',
      specialization: 'Computer Science',
      email: 'sairaj.cs@iittp.ac.in',
      departmentId: deptCS.id,
      institutionId: inst.id,
    },
  });

  await prisma.user.update({
    where: { id: sairajUser.id },
    data: { facultyId: sairajFaculty.id },
  });

  console.log('Users and Faculty created successfully.');
  console.log('Seeding completed for IIT Tirupati!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

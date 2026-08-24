const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('--- Step 1: Seeding Authorization Users ---');

  const usersToCreate = [
    {
      email: 'superadmin@gmail.com',
      fullName: 'Super Admin User',
      role: 'SUPER_ADMIN',
      designation: 'Super Administrator',
      department: 'Executive Management',
    },
    {
      email: 'admin@gmail.com',
      fullName: 'Organization Admin User',
      role: 'ADMIN',
      designation: 'Operations Director',
      department: 'Operations',
    },
    {
      email: 'hr@gmail.com',
      fullName: 'HR Manager User',
      role: 'HR',
      designation: 'Head of Human Resources',
      department: 'Human Resources',
    },
    {
      email: 'tl@gmail.com',
      fullName: 'Team Lead User',
      role: 'TEAM_LEAD',
      designation: 'Senior Tech Lead',
      department: 'Engineering',
      baseSalary: 120000.0,
      panNumber: 'ABCDE1234T',
      uanNumber: '100123456789',
      esicNumber: '3100123456',
    },
    {
      email: 'employee@gmail.com',
      fullName: 'Standard Employee User',
      role: 'EMPLOYEE',
      designation: 'Full Stack Engineer',
      department: 'Engineering',
      baseSalary: 85000.0,
      panNumber: 'FGHIJ5678E',
      uanNumber: '100987654321',
      esicNumber: '3100987654',
    },
    {
      email: 'employee2@gmail.com',
      fullName: 'Junior Developer',
      role: 'EMPLOYEE',
      designation: 'Frontend Developer',
      department: 'Engineering',
      baseSalary: 45000.0,
      panNumber: 'KLMNO9012J',
      uanNumber: '100555666777',
      esicNumber: '3100555666',
    },
    {
      email: 'employee3@gmail.com',
      fullName: 'Marketing Specialist',
      role: 'EMPLOYEE',
      designation: 'Content Marketer',
      department: 'Marketing',
      baseSalary: 55000.0,
      panNumber: 'PQRST3456M',
      uanNumber: '100222333444',
      esicNumber: '3100222333',
    },
  ];

  const userMap = {};

  for (const uDef of usersToCreate) {
    const user = await prisma.user.upsert({
      where: { email: uDef.email },
      update: {
        password: hashedPassword,
        fullName: uDef.fullName,
        role: uDef.role,
      },
      create: {
        email: uDef.email,
        password: hashedPassword,
        fullName: uDef.fullName,
        role: uDef.role,
        employeeProfile: {
          create: {
            designation: uDef.designation,
            department: uDef.department,
            baseSalary: uDef.baseSalary || 85000.0,
            panNumber: uDef.panNumber,
            uanNumber: uDef.uanNumber,
            esicNumber: uDef.esicNumber,
            status: 'ACTIVE',
          },
        },
      },
    });

    userMap[uDef.role] = user;
    console.log(`✓ Seeded user: ${user.email} (${user.role})`);
  }

  const employee = userMap['EMPLOYEE'];
  const teamLead = userMap['TEAM_LEAD'];
  const hr = userMap['HR'];

  if (employee && teamLead) {
    await prisma.user.update({
      where: { id: employee.id },
      data: {
        manager: { connect: { id: teamLead.id } },
        employeeProfile: {
          update: {
            teamLeadId: teamLead.id,
            teamLeadName: teamLead.fullName,
            teamLeadEmail: teamLead.email,
          },
        },
      },
    });
    console.log(`✓ Assigned employee (${employee.email}) to team lead (${teamLead.email})`);
  }

  console.log('\n--- Step 2: Seeding Projects & Sprints ---');

  const project1 = await prisma.project.create({
    data: {
      name: 'EvalX Enterprise HCM System',
      description: 'Comprehensive Human Capital Management platform with payroll, performance, and attendance.',
      status: 'ACTIVE',
      sprints: {
        create: [
          {
            name: 'Sprint 1 - Backend & Database Integration',
            goal: 'Connect PostgreSQL database and configure JWT authentication.',
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
    include: { sprints: true },
  });

  const activeSprint = project1.sprints[0];
  console.log(`✓ Seeded Project: ${project1.name} (Sprint: ${activeSprint.name})`);

  console.log('\n--- Step 3: Seeding Tasks ---');

  const tasksToCreate = [
    {
      title: 'Integrate Aiven PostgreSQL DB with Prisma & Express',
      description: 'Configure SSL connection to Aiven Cloud PostgreSQL and establish Prisma ORM queries.',
      status: 'DONE',
      priority: 'HIGH',
      projectId: project1.id,
      sprintId: activeSprint.id,
      assigneeId: teamLead.id,
      creatorId: teamLead.id,
    },
    {
      title: 'Implement 5-Role Access Control Matrix',
      description: 'Define routes, sidebar links, and permission guards for Super Admin, Admin, HR, Team Lead, and Employee.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project1.id,
      sprintId: activeSprint.id,
      assigneeId: employee.id,
      creatorId: teamLead.id,
    },
    {
      title: 'Attendance Check-in and Live Ticking Clock',
      description: 'Connect attendance punch-in/out APIs and build responsive clock status UI.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      projectId: project1.id,
      sprintId: activeSprint.id,
      assigneeId: employee.id,
      creatorId: teamLead.id,
    },
    {
      title: 'Monthly Payslip Generator & Salary Breakdown',
      description: 'Calculate gross earnings, PF, Tax, and net pay per employee profile.',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: project1.id,
      sprintId: activeSprint.id,
      assigneeId: employee.id,
      creatorId: hr.id,
    },
  ];

  for (const taskData of tasksToCreate) {
    const task = await prisma.task.create({ data: taskData });
    console.log(`✓ Seeded Task: "${task.title}" [${task.status}]`);
  }

  console.log('\n--- Step 4: Seeding Attendance Records ---');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  yesterday.setHours(0, 0, 0, 0);

  await prisma.attendance.upsert({
    where: { userId_date: { userId: employee.id, date: today } },
    update: { checkIn: new Date(), status: 'PRESENT' },
    create: { userId: employee.id, date: today, checkIn: new Date(), status: 'PRESENT' },
  });

  await prisma.attendance.upsert({
    where: { userId_date: { userId: employee.id, date: yesterday } },
    update: {},
    create: {
      userId: employee.id,
      date: yesterday,
      checkIn: new Date(yesterday.getTime() + 9 * 60 * 60 * 1000),
      checkOut: new Date(yesterday.getTime() + 18 * 60 * 60 * 1000),
      status: 'PRESENT',
    },
  });

  console.log('✓ Seeded Attendance records for Employee');

  console.log('\n--- Step 5: Seeding Payroll Payslips ---');

  const payslipsToCreate = [
    {
      userId: employee.id,
      month: 8,
      year: 2026,
      basicPay: 40000,
      hra: 15000,
      epf: 2000,
      esi: 500,
      tds: 2500,
      netPay: 50000,
      status: 'PAID',
    },
    {
      userId: teamLead.id,
      month: 8,
      year: 2026,
      basicPay: 60000,
      hra: 20000,
      epf: 3000,
      esi: 500,
      tds: 3500,
      netPay: 73000,
      status: 'PAID',
    },
  ];

  for (const ps of payslipsToCreate) {
    const slip = await prisma.payslip.create({ data: ps });
    console.log(`✓ Seeded Payslip: Month ${ps.month}/${ps.year} for user ${ps.userId} (Net Pay: $${ps.netPay})`);
  }

  console.log('\n--- Step 6: Seeding Performance Appraisals ---');

  const appraisal = await prisma.appraisal.create({
    data: {
      employeeId: employee.id,
      reviewerId: teamLead.id,
      period: 'Q3 2026',
      score: 4.8,
      feedback: 'Exceptional performance in migrating backend routes and database schemas. Proactive communication and high quality code delivery.',
      status: 'APPROVED',
    },
  });
  console.log(`✓ Seeded Appraisal: ${appraisal.period} score ${appraisal.score}/5.0`);

  console.log('\n--- Step 7: Seeding Real-time Chat Rooms & Messages ---');

  const chatRoom = await prisma.chatRoom.create({
    data: {
      name: 'Engineering & HCM Project Chat',
      type: 'group',
      members: {
        create: [
          { userId: teamLead.id },
          { userId: employee.id },
          { userId: hr.id },
        ],
      },
      messages: {
        create: [
          {
            userId: teamLead.id,
            content: 'Welcome team! The EvalX HCM platform is fully configured with PostgreSQL.',
          },
          {
            userId: employee.id,
            content: 'Awesome! Checked in and working on the latest task tickets.',
          },
        ],
      },
    },
  });
  console.log(`✓ Seeded Chat Room: "${chatRoom.name}" with initial messages`);

  console.log('\n======================================================');
  console.log('🎉 ALL SEED DATA SUCCESSFULLY CREATED IN POSTGRESQL DB!');
  console.log('======================================================');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

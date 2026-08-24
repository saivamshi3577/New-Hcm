const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middleware/auth.middleware');

// Helper to parse date to UTC Midnight to prevent timezone offset shifts
function parseDateToUTCMidnight(dateInput) {
  if (!dateInput) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const parts = dateInput.split('T')[0].split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(Date.UTC(year, month, day));
  }
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

// Helper to format attendance object for frontend compatibility
function formatAttendance(record) {
  if (!record) return null;
  let dateStr = null;
  if (record.date) {
    const d = new Date(record.date);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    dateStr = `${yyyy}-${mm}-${dd}`;
  }
  return {
    ...record,
    user_id: record.userId,
    check_in: record.checkIn,
    check_out: record.checkOut,
    date: dateStr,
  };
}

// Helper to format leave request object for frontend compatibility
function formatLeave(record) {
  if (!record) return null;
  return {
    ...record,
    user_id: record.userId,
    leave_type: record.leaveType,
    start_date: record.startDate,
    end_date: record.endDate,
  };
}

// --- Employee & HRMS Routes ---

// Employee Profiles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userRole = String(req.user?.role || '').toUpperCase();
    const userEmail = (req.user?.email || '').toLowerCase().trim();
    const userId = req.user?.id;

    const { 
      manager_id, managerId, role, role_id, role_name, 
      department, department_id, admin_email, created_by_admin,
      id_in, team_id_in
    } = req.query;

    let whereConditions = [];

    // 1. Multi-Admin Tenant Scoping
    if (userRole === 'SUPER_ADMIN') {
      // Super Admin can view all or filter by specific admin
      if (admin_email || created_by_admin) {
        const filterAdmin = (admin_email || created_by_admin).toLowerCase().trim();
        whereConditions.push({
          OR: [
            { employeeProfile: { createdByAdmin: { equals: filterAdmin, mode: 'insensitive' } } },
            { manager: { email: { equals: filterAdmin, mode: 'insensitive' } } }
          ]
        });
      }
    } else if (userRole === 'ADMIN') {
      // Company Admin sees ONLY employees created by them, managed by them, or under their team leads
      // Strictly isolates Admin 1's employees from Admin 2's employees
      whereConditions.push({
        AND: [
          { role: { not: 'SUPER_ADMIN' } },
          {
            OR: [
              { employeeProfile: { createdByAdmin: { equals: userEmail, mode: 'insensitive' } } },
              { employeeProfile: { createdByAdmin: userId } },
              { managerId: userId },
              { manager: { email: { equals: userEmail, mode: 'insensitive' } } },
              { manager: { employeeProfile: { createdByAdmin: { equals: userEmail, mode: 'insensitive' } } } },
              { id: userId }
            ]
          }
        ]
      });
    } else if (userRole === 'HR') {
      // HR sees employees under their admin's organization
      let hrAdminEmail = userEmail;
      try {
        const hrProf = await prisma.employeeProfile.findUnique({ where: { userId } });
        if (hrProf?.createdByAdmin) {
          hrAdminEmail = hrProf.createdByAdmin.toLowerCase().trim();
        }
      } catch (e) {}

      whereConditions.push({
        AND: [
          { role: { not: 'SUPER_ADMIN' } },
          {
            OR: [
              { employeeProfile: { createdByAdmin: { equals: hrAdminEmail, mode: 'insensitive' } } },
              { manager: { email: { equals: hrAdminEmail, mode: 'insensitive' } } },
              { id: userId }
            ]
          }
        ]
      });
    } else if (userRole === 'TEAM_LEAD' || userRole === 'MANAGER') {
      whereConditions.push({
        OR: [
          { id: userId },
          { managerId: userId },
          { employeeProfile: { teamLeadId: userId } },
          { employeeProfile: { teamLeadEmail: { equals: userEmail, mode: 'insensitive' } } }
        ]
      });
    } else {
      // EMPLOYEE: can see team / self
      whereConditions.push({
        OR: [
          { id: userId },
          { managerId: req.user?.managerId || userId },
        ]
      });
    }

    // 2. Query param filters
    const targetMgrId = manager_id || managerId;
    if (targetMgrId) {
      whereConditions.push({ managerId: targetMgrId });
    }

    if (role || role_name) {
      const rUpper = String(role || role_name).toUpperCase().trim();
      whereConditions.push({ role: rUpper });
    }

    if (department || department_id) {
      const d = department || department_id;
      whereConditions.push({
        employeeProfile: {
          department: { equals: d, mode: 'insensitive' }
        }
      });
    }

    if (id_in) {
      const ids = String(id_in).split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        whereConditions.push({ id: { in: ids } });
      }
    }

    const whereClause = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const employees = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        managerId: true,
        manager: {
          select: {
            id: true,
            email: true,
            fullName: true,
          }
        },
        createdAt: true,
        employeeProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedEmployees = employees.map(emp => {
      const p = emp.employeeProfile || {};
      const tlId = p.teamLeadId || emp.managerId || null;
      const tlName = p.teamLeadName || emp.manager?.fullName || null;
      const tlEmail = p.teamLeadEmail || emp.manager?.email || null;

      return {
        ...emp,
        full_name: emp.fullName,
        manager_id: emp.managerId || tlId,
        managerId: emp.managerId || tlId,
        teamLeadId: tlId,
        manager_email: emp.manager?.email || tlEmail,
        manager_name: emp.manager?.fullName || tlName,
        teamLead: tlName || emp.manager?.fullName,
        created_by_admin: p.createdByAdmin,
      };
    });

    res.json({ employees: formattedEmployees, data: formattedEmployees });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
});

router.get('/:id/unread-counts', authenticateToken, async (req, res) => {
  try {
    res.json({
      notifications: 0,
      messages: 0,
      exams: 0,
      data: { notifications: 0, messages: 0, exams: 0 }
    });
  } catch (error) {
    res.json({ notifications: 0, messages: 0, exams: 0 });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      email, password, fullName, full_name, role, designation, department, 
      department_id, manager_id, managerId, baseSalary, teamLeadId, team_lead_id 
    } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const finalFullName = fullName || full_name || email.split('@')[0];
    const deptStr = typeof department === 'string' && department.trim() ? department : (department_id || 'General');
    
    // Normalize role to upper-case Prisma Role enum
    let normalizedRole = 'EMPLOYEE';
    if (role) {
      const rUpper = String(role).toUpperCase();
      if (rUpper === 'ADMIN' || rUpper === 'COMPANY_ADMIN') normalizedRole = 'ADMIN';
      else if (rUpper === 'SUPER_ADMIN') normalizedRole = 'SUPER_ADMIN';
      else if (rUpper === 'HR') normalizedRole = 'HR';
      else if (rUpper === 'MANAGER') normalizedRole = 'MANAGER';
      else if (rUpper === 'TEAM_LEAD') normalizedRole = 'TEAM_LEAD';
    }

    const bcrypt = require('bcrypt');
    const rawPassword = password || 'Password123!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const adminUserId = req.user?.id || null;
    let adminUserEmail = (req.user?.email || '').toLowerCase().trim();

    // If creator is an HR or Lead under an Admin, inherit that Admin's email
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN' && adminUserId) {
      try {
        const creatorProfile = await prisma.employeeProfile.findUnique({
          where: { userId: adminUserId },
          select: { createdByAdmin: true }
        });
        if (creatorProfile?.createdByAdmin) {
          adminUserEmail = creatorProfile.createdByAdmin.toLowerCase().trim();
        }
      } catch (e) {}
    }

    const mgrInput = manager_id !== undefined ? manager_id : (managerId !== undefined ? managerId : (teamLeadId !== undefined ? teamLeadId : (team_lead_id !== undefined ? team_lead_id : req.body.teamLead)));
    let finalManagerId = null;
    let managerEmail = null;
    let managerUser = null;
    let tlId = null;
    let tlName = null;
    let tlEmail = null;

    if (mgrInput && mgrInput !== 'none') {
      try {
        managerUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: String(mgrInput) },
              { email: { equals: String(mgrInput), mode: 'insensitive' } },
              { fullName: { contains: String(mgrInput), mode: 'insensitive' } }
            ]
          }
        });
        if (managerUser) {
          finalManagerId = managerUser.id;
          managerEmail = managerUser.email;
          tlId = managerUser.id;
          tlName = managerUser.fullName;
          tlEmail = managerUser.email;
        } else {
          finalManagerId = (String(mgrInput).includes('@') || String(mgrInput).length > 20) ? String(mgrInput) : adminUserId;
          managerEmail = String(mgrInput).includes('@') ? String(mgrInput) : null;
          tlId = String(mgrInput);
          tlName = req.body.manager_name || req.body.teamLead || req.body.teamLeadName || null;
          tlEmail = managerEmail;
        }
      } catch (e) {
        finalManagerId = adminUserId;
        tlId = adminUserId;
      }
    } else if (mgrInput === 'none') {
      finalManagerId = null;
      tlId = null;
      tlName = null;
      tlEmail = null;
    } else if (normalizedRole !== 'ADMIN') {
      finalManagerId = adminUserId;
      managerEmail = adminUserEmail;
      tlId = adminUserId;
      tlName = req.user?.fullName || null;
      tlEmail = adminUserEmail;
    }

    const profileData = {
      designation: designation || (normalizedRole === 'ADMIN' ? 'Company Administrator' : 'Staff'),
      department: deptStr,
      baseSalary: baseSalary ? parseFloat(baseSalary) : null,
      teamLeadId: tlId,
      teamLeadName: tlName,
      teamLeadEmail: tlEmail,
      createdByAdmin: adminUserEmail
    };

    // Upsert: check if user exists first
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          fullName: finalFullName,
          role: normalizedRole,
          managerId: finalManagerId,
          employeeProfile: {
            upsert: {
              create: profileData,
              update: {
                department: deptStr,
                teamLeadId: tlId,
                teamLeadName: tlName,
                teamLeadEmail: tlEmail,
                createdByAdmin: adminUserEmail,
                ...(designation && { designation }),
                ...(baseSalary && { baseSalary: parseFloat(baseSalary) }),
              },
            },
          },
        },
        include: { employeeProfile: true, manager: { select: { id: true, email: true, fullName: true } } },
      });

      const { password: _, ...employeeWithoutPassword } = updatedUser;
      const payload = {
        ...employeeWithoutPassword,
        manager_id: updatedUser.managerId || tlId,
        managerId: updatedUser.managerId || tlId,
        teamLeadId: tlId,
        manager_email: tlEmail || updatedUser.manager?.email,
        manager_name: tlName || updatedUser.manager?.fullName,
        teamLead: tlName || updatedUser.manager?.fullName,
        created_by_admin: adminUserEmail
      };
      return res.status(200).json({
        message: 'Employee updated successfully',
        employee: payload,
        data: payload,
      });
    }

    const newEmployee = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: finalFullName,
        role: normalizedRole,
        managerId: finalManagerId,
        employeeProfile: {
          create: profileData,
        },
      },
      include: { employeeProfile: true, manager: { select: { id: true, email: true, fullName: true } } },
    });

    const { password: _, ...employeeWithoutPassword } = newEmployee;
    const responsePayload = {
      ...employeeWithoutPassword,
      created_by_admin: adminUserEmail,
      manager_id: newEmployee.managerId || finalManagerId || tlId,
      managerId: newEmployee.managerId || finalManagerId || tlId,
      teamLeadId: tlId,
      manager_email: tlEmail || newEmployee.manager?.email,
      manager_name: tlName || newEmployee.manager?.fullName,
      teamLead: tlName || newEmployee.manager?.fullName
    };
    res.status(201).json({
      message: 'Employee created successfully',
      employee: responsePayload,
      data: responsePayload,
    });
  } catch (error) {
    console.error('Error creating/updating employee:', error);
    res.status(500).json({ message: 'Error creating employee', error: error.message });
  }
});

// Top-level & Parametric Attendance Routes (placed before /:id)

router.get('/attendance', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.query.user_id || req.query.userId;
    const dateParam = req.query.date;
    const userRole = String(req.user?.role || '').toUpperCase();
    const userEmail = (req.user?.email || '').toLowerCase().trim();
    const userId = req.user?.id;

    let where = {};

    if (targetUserId) {
      where.userId = targetUserId;
    } else if (userRole === 'SUPER_ADMIN') {
      // All attendance
    } else if (userRole === 'ADMIN') {
      const scopedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { employeeProfile: { createdByAdmin: { equals: userEmail, mode: 'insensitive' } } },
            { employeeProfile: { createdByAdmin: userId } },
            { managerId: userId },
            { manager: { email: { equals: userEmail, mode: 'insensitive' } } },
            { id: userId }
          ]
        },
        select: { id: true }
      });
      where.userId = { in: scopedUsers.map(u => u.id) };
    } else if (userRole === 'HR') {
      let hrAdminEmail = userEmail;
      try {
        const hrProf = await prisma.employeeProfile.findUnique({ where: { userId } });
        if (hrProf?.createdByAdmin) hrAdminEmail = hrProf.createdByAdmin.toLowerCase().trim();
      } catch (e) {}
      const scopedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { employeeProfile: { createdByAdmin: { equals: hrAdminEmail, mode: 'insensitive' } } },
            { id: userId }
          ]
        },
        select: { id: true }
      });
      where.userId = { in: scopedUsers.map(u => u.id) };
    } else if (userRole === 'TEAM_LEAD' || userRole === 'MANAGER') {
      const scopedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { managerId: userId },
            { employeeProfile: { teamLeadId: userId } },
            { id: userId }
          ]
        },
        select: { id: true }
      });
      where.userId = { in: scopedUsers.map(u => u.id) };
    } else {
      where.userId = userId;
    }

    if (dateParam) {
      where.date = parseDateToUTCMidnight(dateParam);
    }

    const list = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const formatted = list.map(formatAttendance);
    res.json({ attendance: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
});

router.post('/attendance', authenticateToken, async (req, res) => {
  try {
    const body = req.body || {};
    const targetUserId = body.user_id || body.userId || (req.user ? req.user.id : null);
    
    if (!targetUserId) {
      return res.status(400).json({ message: 'User ID is required for check-in' });
    }

    const today = parseDateToUTCMidnight(body.date);

    const checkInTime = body.check_in || body.checkIn ? new Date(body.check_in || body.checkIn) : new Date();
    const checkOutTime = body.check_out || body.checkOut ? new Date(body.check_out || body.checkOut) : null;
    const status = body.status || 'PRESENT';

    const record = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: targetUserId,
          date: today,
        },
      },
      create: {
        userId: targetUserId,
        date: today,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status,
      },
      update: {
        checkIn: checkInTime,
        ...(checkOutTime && { checkOut: checkOutTime }),
        ...(status && { status }),
      },
    });

    const formatted = formatAttendance(record);
    res.status(201).json({ message: 'Check-in recorded', attendance: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error recording attendance', error: error.message });
  }
});

const handleAttendanceUpdate = async (req, res) => {
  try {
    const body = req.body || {};
    const attendanceId = req.params.id;

    let record;
    if (attendanceId) {
      record = await prisma.attendance.update({
        where: { id: attendanceId },
        data: {
          ...(body.check_out || body.checkOut ? { checkOut: new Date(body.check_out || body.checkOut) } : {}),
          ...(body.check_in || body.checkIn ? { checkIn: new Date(body.check_in || body.checkIn) } : {}),
          ...(body.status ? { status: body.status } : {}),
        },
      });
    } else {
      const targetUserId = body.user_id || body.userId || (req.user ? req.user.id : null);
      const today = parseDateToUTCMidnight(body.date);

      record = await prisma.attendance.update({
        where: {
          userId_date: {
            userId: targetUserId,
            date: today,
          },
        },
        data: {
          ...(body.check_out || body.checkOut ? { checkOut: new Date(body.check_out || body.checkOut) } : {}),
          ...(body.check_in || body.checkIn ? { checkIn: new Date(body.check_in || body.checkIn) } : {}),
          ...(body.status ? { status: body.status } : {}),
        },
      });
    }

    const formatted = formatAttendance(record);
    res.json({ message: 'Attendance updated', attendance: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error updating attendance', error: error.message });
  }
};

router.put('/attendance', authenticateToken, handleAttendanceUpdate);
router.put('/attendance/:id', authenticateToken, handleAttendanceUpdate);

// Top-level & Parametric Leaves Routes (placed before /:id)

// All leaves across the organization (for HR/Admin dashboard)
router.get('/leaves/all', authenticateToken, async (req, res) => {
  try {
    const userRole = String(req.user?.role || '').toUpperCase();
    if (!['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'TEAM_LEAD'].includes(userRole)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const { status, leaveType, leave_type } = req.query;
    const targetLeaveType = leaveType || leave_type;

    const whereClause = {
      ...(status && { status }),
      ...(targetLeaveType && { leaveType: targetLeaveType }),
    };

    // For team leads, only show their team members' leaves
    if (userRole === 'TEAM_LEAD' || userRole === 'MANAGER') {
      const teamMembers = await prisma.user.findMany({
        where: {
          OR: [
            { managerId: req.user.id },
            { employeeProfile: { teamLeadId: req.user.id } },
          ]
        },
        select: { id: true }
      });
      whereClause.userId = { in: teamMembers.map(m => m.id) };
    }

    const list = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            employeeProfile: {
              select: {
                department: true,
                designation: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = list.map(record => ({
      ...formatLeave(record),
      user: record.user ? {
        ...record.user,
        full_name: record.user.fullName,
        department: record.user.employeeProfile?.department,
        designation: record.user.employeeProfile?.designation,
      } : null,
    }));

    res.json({ leaves: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all leaves', error: error.message });
  }
});

router.get('/leaves', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.query.user_id || req.query.userId;
    const userRole = String(req.user?.role || '').toUpperCase();
    const userEmail = (req.user?.email || '').toLowerCase().trim();
    const userId = req.user?.id;

    let where = {};

    if (targetUserId) {
      where.userId = targetUserId;
    } else if (userRole === 'SUPER_ADMIN') {
      // All leaves
    } else if (userRole === 'ADMIN') {
      const scopedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { employeeProfile: { createdByAdmin: { equals: userEmail, mode: 'insensitive' } } },
            { employeeProfile: { createdByAdmin: userId } },
            { managerId: userId },
            { manager: { email: { equals: userEmail, mode: 'insensitive' } } },
            { id: userId }
          ]
        },
        select: { id: true }
      });
      where.userId = { in: scopedUsers.map(u => u.id) };
    } else if (userRole === 'HR') {
      let hrAdminEmail = userEmail;
      try {
        const hrProf = await prisma.employeeProfile.findUnique({ where: { userId } });
        if (hrProf?.createdByAdmin) hrAdminEmail = hrProf.createdByAdmin.toLowerCase().trim();
      } catch (e) {}
      const scopedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { employeeProfile: { createdByAdmin: { equals: hrAdminEmail, mode: 'insensitive' } } },
            { id: userId }
          ]
        },
        select: { id: true }
      });
      where.userId = { in: scopedUsers.map(u => u.id) };
    } else if (userRole === 'TEAM_LEAD' || userRole === 'MANAGER') {
      const scopedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { managerId: userId },
            { employeeProfile: { teamLeadId: userId } },
            { id: userId }
          ]
        },
        select: { id: true }
      });
      where.userId = { in: scopedUsers.map(u => u.id) };
    } else {
      where.userId = userId;
    }

    const list = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const formatted = list.map(formatLeave);
    res.json({ leaves: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaves', error: error.message });
  }
});

router.post('/leaves', authenticateToken, async (req, res) => {
  try {
    const body = req.body || {};
    const targetUserId = body.user_id || body.userId || (req.user ? req.user.id : null);
    const leaveType = body.leave_type || body.leaveType || 'CASUAL';
    const startDate = body.start_date || body.startDate;
    const endDate = body.end_date || body.endDate;
    const reason = body.reason || '';

    const record = await prisma.leaveRequest.create({
      data: {
        userId: targetUserId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'PENDING',
      },
    });

    const formatted = formatLeave(record);
    res.status(201).json({ message: 'Leave request submitted', leaveRequest: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting leave request', error: error.message });
  }
});

router.put('/leaves/:leaveId/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const record = await prisma.leaveRequest.update({
      where: { id: req.params.leaveId },
      data: { status },
    });
    const formatted = formatLeave(record);
    res.json({ message: 'Leave status updated', leaveRequest: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error updating leave status', error: error.message });
  }
});

// Single Employee Profile Routes

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userRole = String(req.user?.role || '').toUpperCase();
    const userEmail = (req.user?.email || '').toLowerCase().trim();
    const userId = req.user?.id;

    const employee = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        managerId: true,
        manager: {
          select: {
            id: true,
            email: true,
            fullName: true,
          }
        },
        createdAt: true,
        employeeProfile: true,
        attendance: { take: 10, orderBy: { date: 'desc' } },
        leaveRequests: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const p = employee.employeeProfile || {};

    if (userRole === 'ADMIN') {
      const createdBy = (p.createdByAdmin || '').toLowerCase().trim();
      const mgrEmail = (employee.manager?.email || '').toLowerCase().trim();
      const belongsToAdmin = 
        employee.id === userId ||
        createdBy === userEmail ||
        p.createdByAdmin === userId ||
        employee.managerId === userId ||
        mgrEmail === userEmail;

      if (!belongsToAdmin) {
        return res.status(403).json({ message: 'Access denied. This employee does not belong to your organization.' });
      }
    }

    const tlId = p.teamLeadId || employee.managerId || null;
    const tlName = p.teamLeadName || employee.manager?.fullName || null;
    const tlEmail = p.teamLeadEmail || employee.manager?.email || null;

    // Resolve company for employee
    let userCompany = null;
    try {
      userCompany = await prisma.company.findFirst({
        where: {
          OR: [
            { adminId: employee.id },
            { adminEmail: { equals: employee.email, mode: 'insensitive' } },
            ...(p.createdByAdmin ? [
              { adminEmail: { equals: p.createdByAdmin, mode: 'insensitive' } },
              { adminId: p.createdByAdmin }
            ] : []),
            ...(employee.email && employee.email.includes('@') && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(employee.email.split('@')[1]) ? [
              { domain: { equals: employee.email.split('@')[1], mode: 'insensitive' } }
            ] : [])
          ]
        }
      });
    } catch (e) {}

    const companyLogo = userCompany?.logoUrl || null;

    const formattedEmployee = {
      ...employee,
      full_name: employee.fullName,
      manager_id: employee.managerId || tlId,
      managerId: employee.managerId || tlId,
      teamLeadId: tlId,
      manager_email: employee.manager?.email || tlEmail,
      manager_name: employee.manager?.fullName || tlName,
      teamLead: tlName || employee.manager?.fullName,
      created_by_admin: p.createdByAdmin,
      company_id: userCompany?.id || null,
      company_name: userCompany?.name || null,
      company_logo: companyLogo,
      company_logo_url: companyLogo,
      logo_url: companyLogo,
      company: userCompany,
    };

    res.json({ employee: formattedEmployee, data: formattedEmployee });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee', error: error.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userRole = String(req.user?.role || '').toUpperCase();
    const userEmail = (req.user?.email || '').toLowerCase().trim();
    const userId = req.user?.id;

    if (userRole === 'ADMIN') {
      const existing = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: { employeeProfile: true, manager: true }
      });
      if (!existing) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      const createdBy = (existing.employeeProfile?.createdByAdmin || '').toLowerCase().trim();
      const mgrEmail = (existing.manager?.email || '').toLowerCase().trim();
      const belongsToAdmin = 
        existing.id === userId ||
        createdBy === userEmail ||
        existing.employeeProfile?.createdByAdmin === userId ||
        existing.managerId === userId ||
        mgrEmail === userEmail;

      if (!belongsToAdmin) {
        return res.status(403).json({ message: 'Access denied. You cannot modify employees from another organization.' });
      }
    }

    const { 
      fullName, full_name, role, designation, department, department_id, 
      baseSalary, panNumber, uanNumber, esicNumber, status,
      manager_id, managerId, teamLeadId, team_lead_id
    } = req.body;

    const finalFullName = fullName || full_name;
    const deptStr = typeof department === 'string' && department.trim() ? department : (department_id || undefined);

    const mgrInput = manager_id !== undefined ? manager_id : (managerId !== undefined ? managerId : (teamLeadId !== undefined ? teamLeadId : (team_lead_id !== undefined ? team_lead_id : req.body.teamLead)));
    
    let updateUserData = {
      ...(finalFullName && { fullName: finalFullName }),
      ...(role && { role }),
    };

    let updateProfileData = {
      ...(designation !== undefined && { designation }),
      ...(deptStr !== undefined && { department: deptStr }),
      ...(baseSalary !== undefined && { baseSalary: parseFloat(baseSalary) }),
      ...(panNumber !== undefined && { panNumber }),
      ...(uanNumber !== undefined && { uanNumber }),
      ...(esicNumber !== undefined && { esicNumber }),
      ...(status !== undefined && { status }),
    };

    if (mgrInput !== undefined) {
      if (mgrInput === null || mgrInput === 'none' || mgrInput === '') {
        updateUserData.managerId = null;
        updateProfileData.teamLeadId = null;
        updateProfileData.teamLeadName = null;
        updateProfileData.teamLeadEmail = null;
      } else {
        let managerUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: String(mgrInput) },
              { email: { equals: String(mgrInput), mode: 'insensitive' } },
              { fullName: { contains: String(mgrInput), mode: 'insensitive' } }
            ]
          }
        });
        if (managerUser) {
          updateUserData.managerId = managerUser.id;
          updateProfileData.teamLeadId = managerUser.id;
          updateProfileData.teamLeadName = managerUser.fullName;
          updateProfileData.teamLeadEmail = managerUser.email;
        } else {
          updateUserData.managerId = String(mgrInput);
          updateProfileData.teamLeadId = String(mgrInput);
          if (req.body.manager_name || req.body.teamLead || req.body.teamLeadName) {
            updateProfileData.teamLeadName = req.body.manager_name || req.body.teamLead || req.body.teamLeadName;
          }
          if (req.body.manager_email || req.body.teamLeadEmail) {
            updateProfileData.teamLeadEmail = req.body.manager_email || req.body.teamLeadEmail;
          }
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...updateUserData,
        employeeProfile: {
          upsert: {
            create: {
              designation: designation || 'Staff',
              department: deptStr || 'General',
              baseSalary: baseSalary ? parseFloat(baseSalary) : null,
              panNumber,
              uanNumber,
              esicNumber,
              status: status || 'ACTIVE',
              teamLeadId: updateProfileData.teamLeadId,
              teamLeadName: updateProfileData.teamLeadName,
              teamLeadEmail: updateProfileData.teamLeadEmail,
            },
            update: updateProfileData,
          },
        },
      },
      include: { employeeProfile: true, manager: { select: { id: true, email: true, fullName: true } } },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    const p = updatedUser.employeeProfile || {};
    const payload = {
      ...userWithoutPassword,
      full_name: updatedUser.fullName,
      manager_id: updatedUser.managerId || p.teamLeadId,
      managerId: updatedUser.managerId || p.teamLeadId,
      teamLeadId: p.teamLeadId || updatedUser.managerId,
      manager_email: updatedUser.manager?.email || p.teamLeadEmail,
      manager_name: updatedUser.manager?.fullName || p.teamLeadName,
      teamLead: p.teamLeadName || updatedUser.manager?.fullName,
    };

    res.json({ message: 'Employee updated successfully', employee: payload, data: payload });
  } catch (error) {
    res.status(500).json({ message: 'Error updating employee', error: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userRole = String(req.user?.role || '').toUpperCase();
    const userEmail = (req.user?.email || '').toLowerCase().trim();
    const userId = req.user?.id;

    if (userRole === 'ADMIN') {
      const existing = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: { employeeProfile: true, manager: true }
      });
      if (!existing) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      const createdBy = (existing.employeeProfile?.createdByAdmin || '').toLowerCase().trim();
      const mgrEmail = (existing.manager?.email || '').toLowerCase().trim();
      const belongsToAdmin = 
        existing.id === userId ||
        createdBy === userEmail ||
        existing.employeeProfile?.createdByAdmin === userId ||
        existing.managerId === userId ||
        mgrEmail === userEmail;

      if (!belongsToAdmin) {
        return res.status(403).json({ message: 'Access denied. You cannot delete employees from another organization.' });
      }
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee', error: error.message });
  }
});

// Parametric sub-resource routes for compatibility

router.post('/:id/attendance/check-in', authenticateToken, async (req, res) => {
  try {
    const today = parseDateToUTCMidnight(req.body?.date);

    const record = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: req.params.id,
          date: today,
        },
      },
      create: {
        userId: req.params.id,
        date: today,
        checkIn: new Date(),
        status: 'PRESENT',
      },
      update: {
        checkIn: new Date(),
        status: 'PRESENT',
      },
    });

    const formatted = formatAttendance(record);
    res.json({ message: 'Check-in recorded', attendance: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error checking in', error: error.message });
  }
});

router.post('/:id/attendance/check-out', authenticateToken, async (req, res) => {
  try {
    const today = parseDateToUTCMidnight(req.body?.date);

    const record = await prisma.attendance.update({
      where: {
        userId_date: {
          userId: req.params.id,
          date: today,
        },
      },
      data: {
        checkOut: new Date(),
      },
    });

    const formatted = formatAttendance(record);
    res.json({ message: 'Check-out recorded', attendance: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error checking out', error: error.message });
  }
});

router.get('/:id/attendance', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.attendance.findMany({
      where: { userId: req.params.id },
      orderBy: { date: 'desc' },
    });
    const formatted = list.map(formatAttendance);
    res.json({ attendance: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
});

router.post('/:id/leaves', authenticateToken, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const record = await prisma.leaveRequest.create({
      data: {
        userId: req.params.id,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'PENDING',
      },
    });
    const formatted = formatLeave(record);
    res.status(201).json({ message: 'Leave request submitted', leaveRequest: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting leave request', error: error.message });
  }
});

router.get('/:id/leaves', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.leaveRequest.findMany({
      where: { userId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    const formatted = list.map(formatLeave);
    res.json({ leaves: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave requests', error: error.message });
  }
});

module.exports = router;

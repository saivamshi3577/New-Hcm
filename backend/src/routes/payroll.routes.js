const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middleware/auth.middleware');

function formatPayslip(p) {
  if (!p) return null;
  return {
    ...p,
    user_id: p.userId,
    basic_pay: p.basicPay,
    net_pay: p.netPay,
    created_at: p.createdAt,
    user: p.user ? {
      ...p.user,
      full_name: p.user.fullName,
      employeeProfile: p.user.employeeProfile,
    } : null,
  };
}

// --- Payroll Management (PMS) Routes ---

router.get('/payslips', authenticateToken, async (req, res) => {
  try {
    const { userId, user_id, month, year } = req.query;
    const targetUserId = userId || user_id;
    const userRole = String(req.user?.role || '').toUpperCase();
    const userEmail = (req.user?.email || '').toLowerCase().trim();
    const currentUserId = req.user?.id;

    let userFilter = undefined;
    if (targetUserId) {
      userFilter = targetUserId;
    } else if (userRole === 'ADMIN') {
      const scopedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { employeeProfile: { createdByAdmin: { equals: userEmail, mode: 'insensitive' } } },
            { employeeProfile: { createdByAdmin: currentUserId } },
            { managerId: currentUserId },
            { manager: { email: { equals: userEmail, mode: 'insensitive' } } },
            { id: currentUserId }
          ]
        },
        select: { id: true }
      });
      userFilter = { in: scopedUsers.map(u => u.id) };
    } else if (userRole === 'HR') {
      let hrAdminEmail = userEmail;
      try {
        const hrProf = await prisma.employeeProfile.findUnique({ where: { userId: currentUserId } });
        if (hrProf?.createdByAdmin) hrAdminEmail = hrProf.createdByAdmin.toLowerCase().trim();
      } catch (e) {}
      const scopedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { employeeProfile: { createdByAdmin: { equals: hrAdminEmail, mode: 'insensitive' } } },
            { id: currentUserId }
          ]
        },
        select: { id: true }
      });
      userFilter = { in: scopedUsers.map(u => u.id) };
    } else if (userRole !== 'SUPER_ADMIN') {
      userFilter = currentUserId;
    }

    const list = await prisma.payslip.findMany({
      where: {
        ...(userFilter && { userId: userFilter }),
        ...(month && { month: parseInt(month) }),
        ...(year && { year: parseInt(year) }),
      },
      include: {
        user: { 
          select: { 
            id: true, 
            fullName: true, 
            email: true,
            employeeProfile: true
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = list.map(formatPayslip);
    res.json({ payslips: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payslips', error: error.message });
  }
});

router.post('/payslips/generate', authenticateToken, async (req, res) => {
  try {
    const { month, year, userId, user_id } = req.body;
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const targetUserId = userId || user_id;
    const whereClause = targetUserId ? { id: targetUserId } : {};
    const employees = await prisma.user.findMany({
      where: whereClause,
      include: { employeeProfile: true },
    });

    const generatedPayslips = [];

    for (const emp of employees) {
      const baseSalary = emp.employeeProfile?.baseSalary || 30000;
      const basicPay = baseSalary * 0.5;
      const hra = baseSalary * 0.2;
      const epf = basicPay * 0.12;
      const esi = baseSalary < 21000 ? baseSalary * 0.0075 : 0;
      const tds = baseSalary > 50000 ? baseSalary * 0.1 : 0;
      const netPay = baseSalary - epf - esi - tds;

      const payslip = await prisma.payslip.create({
        data: {
          userId: emp.id,
          month: parseInt(month),
          year: parseInt(year),
          basicPay,
          hra,
          epf,
          esi,
          tds,
          netPay,
          status: 'GENERATED',
        },
        include: {
          user: { 
            select: { 
              id: true, 
              fullName: true, 
              email: true,
              employeeProfile: true
            } 
          },
        },
      });

      generatedPayslips.push(formatPayslip(payslip));
    }

    res.status(201).json({ message: 'Payslips generated successfully', count: generatedPayslips.length, payslips: generatedPayslips, data: generatedPayslips });
  } catch (error) {
    res.status(500).json({ message: 'Error generating payslips', error: error.message });
  }
});

router.get('/payslips/:id/download', authenticateToken, async (req, res) => {
  try {
    const payslip = await prisma.payslip.findUnique({
      where: { id: req.params.id },
      include: { 
        user: { 
          select: { 
            fullName: true, 
            email: true,
            employeeProfile: true
          } 
        } 
      },
    });

    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }

    const formatted = formatPayslip(payslip);
    res.json({ message: 'Payslip metadata retrieved', payslip: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error downloading payslip', error: error.message });
  }
});

router.put('/payslips/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['GENERATED', 'PAID'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const payslip = await prisma.payslip.update({
      where: { id: req.params.id },
      data: { status },
      include: { user: { select: { fullName: true, email: true } } },
    });

    const formatted = formatPayslip(payslip);
    res.json({ message: 'Payslip status updated', payslip: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error updating payslip status', error: error.message });
  }
});

module.exports = router;

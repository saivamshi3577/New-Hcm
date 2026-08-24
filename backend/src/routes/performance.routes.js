const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middleware/auth.middleware');

function formatAppraisal(app) {
  if (!app) return null;
  return {
    ...app,
    user_id: app.employeeId,
    employee_id: app.employeeId,
    reviewer_id: app.reviewerId,
    created_at: app.createdAt,
    employee: app.employee ? {
      ...app.employee,
      full_name: app.employee.fullName,
    } : null,
    reviewer: app.reviewer ? {
      ...app.reviewer,
      full_name: app.reviewer.fullName,
    } : null,
  };
}

// --- Performance Management (PMS) Routes ---

router.get('/appraisals', authenticateToken, async (req, res) => {
  try {
    const { employeeId, employee_id, user_id } = req.query;
    const targetId = employeeId || employee_id || user_id;
    const userRole = String(req.user?.role || '').toUpperCase();
    const userEmail = (req.user?.email || '').toLowerCase().trim();
    const currentUserId = req.user?.id;

    let employeeFilter = undefined;
    if (targetId) {
      employeeFilter = targetId;
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
      employeeFilter = { in: scopedUsers.map(u => u.id) };
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
      employeeFilter = { in: scopedUsers.map(u => u.id) };
    } else if (userRole !== 'SUPER_ADMIN') {
      employeeFilter = currentUserId;
    }

    const list = await prisma.appraisal.findMany({
      where: {
        ...(employeeFilter && { employeeId: employeeFilter }),
      },
      include: {
        employee: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = list.map(formatAppraisal);
    res.json({ appraisals: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appraisals', error: error.message });
  }
});

router.post('/appraisals', authenticateToken, async (req, res) => {
  try {
    const { employeeId, employee_id, period, score, feedback } = req.body;
    const targetId = employeeId || employee_id;

    const appraisal = await prisma.appraisal.create({
      data: {
        employeeId: targetId,
        reviewerId: req.user ? req.user.id : targetId,
        period,
        score: parseFloat(score),
        feedback,
        status: 'SUBMITTED',
      },
      include: {
        employee: { select: { id: true, fullName: true } },
        reviewer: { select: { id: true, fullName: true } },
      },
    });

    const formatted = formatAppraisal(appraisal);
    res.status(201).json({ message: 'Appraisal created successfully', appraisal: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting appraisal', error: error.message });
  }
});

router.get('/appraisals/my-reviews', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.appraisal.findMany({
      where: { reviewerId: req.user.id },
      include: {
        employee: { select: { id: true, fullName: true, email: true } },
      },
    });

    const formatted = list.map(formatAppraisal);
    res.json({ reviews: formatted, appraisals: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

router.put('/appraisals/:id', authenticateToken, async (req, res) => {
  try {
    const { score, feedback, status } = req.body;
    const appraisal = await prisma.appraisal.update({
      where: { id: req.params.id },
      data: {
        ...(score !== undefined && { score: parseFloat(score) }),
        ...(feedback !== undefined && { feedback }),
        ...(status && { status }),
      },
    });

    const formatted = formatAppraisal(appraisal);
    res.json({ message: 'Appraisal updated successfully', appraisal: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error updating appraisal', error: error.message });
  }
});

module.exports = router;

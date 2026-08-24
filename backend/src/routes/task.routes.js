const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken } = require('../middleware/auth.middleware');

function normalizeTaskStatusForDb(statusStr) {
  if (!statusStr) return 'TODO';
  const s = String(statusStr).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (s === 'COMPLETED' || s === 'DONE') return 'DONE';
  if (s === 'IN_PROGRESS' || s === 'INPROGRESS' || s === 'PROGRESS') return 'IN_PROGRESS';
  if (s === 'REVIEW' || s === 'IN_REVIEW' || s === 'INREVIEW') return 'IN_REVIEW';
  if (s === 'BLOCKED') return 'BLOCKED';
  if (s === 'TODO') return 'TODO';
  return 'TODO';
}

function normalizeTaskStatusForFrontend(dbStatus) {
  if (!dbStatus) return 'Todo';
  const s = String(dbStatus).trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (s === 'DONE' || s === 'COMPLETED') return 'Completed';
  if (s === 'IN_PROGRESS' || s === 'INPROGRESS' || s === 'PROGRESS') return 'In Progress';
  if (s === 'IN_REVIEW' || s === 'REVIEW' || s === 'INREVIEW') return 'Review';
  if (s === 'BLOCKED') return 'Blocked';
  if (s === 'TODO') return 'Todo';
  return dbStatus;
}

function formatTask(task) {
  if (!task) return null;
  return {
    ...task,
    status: normalizeTaskStatusForFrontend(task.status),
    assignee_id: task.assigneeId,
    project_id: task.projectId,
    sprint_id: task.sprintId,
    creator_id: task.creatorId,
    due_date: task.dueDate,
    points: task.points !== null && task.points !== undefined ? Number(task.points) : 0,
    evaluated_points: task.evaluatedPoints !== null && task.evaluatedPoints !== undefined ? Number(task.evaluatedPoints) : 0,
    evaluatedPoints: task.evaluatedPoints !== null && task.evaluatedPoints !== undefined ? Number(task.evaluatedPoints) : 0,
    evaluation_feedback: task.evaluationFeedback || null,
    evaluated_at: task.evaluatedAt || null,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    assignee: task.assignee ? {
      ...task.assignee,
      full_name: task.assignee.fullName || task.assignee.full_name,
    } : null,
    creator: task.creator ? {
      ...task.creator,
      full_name: task.creator.fullName || task.creator.full_name,
    } : null,
  };
}

function formatProject(proj) {
  if (!proj) return null;
  return {
    ...proj,
    created_at: proj.createdAt,
    updated_at: proj.updatedAt,
    start_date: proj.startDate,
    due_date: proj.dueDate,
    risk_level: proj.riskLevel,
    lead_id: proj.leadId,
    created_by_admin: proj.createdByAdmin,
    created_by_id: proj.createdById,
    sprints: Array.isArray(proj.sprints) ? proj.sprints.map(s => ({
      ...s,
      project_id: s.projectId,
      start_date: s.startDate,
      end_date: s.endDate,
    })) : [],
    tasks: Array.isArray(proj.tasks) ? proj.tasks.map(formatTask) : [],
  };
}

// --- Projects ---

router.get('/projects', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const userRole = String(req.user?.role || '').toUpperCase();
    const userEmail = (req.user?.email || '').toLowerCase();
    const userDomain = userEmail.includes('@') ? userEmail.split('@')[1] : '';

    let whereClause = {};

    if (userRole === 'SUPER_ADMIN') {
      whereClause = {};
    } else if (userRole === 'ADMIN') {
      const conditions = [];
      if (userEmail) conditions.push({ createdByAdmin: { equals: userEmail, mode: 'insensitive' } });
      if (userDomain) conditions.push({ domain: { equals: userDomain, mode: 'insensitive' } });
      if (userId) {
        conditions.push({ createdById: userId });
        conditions.push({ leadId: userId });
      }
      whereClause = conditions.length > 0 ? { OR: conditions } : {};
    } else {
      const conditions = [];
      if (userId) {
        conditions.push({ createdById: userId });
        conditions.push({ leadId: userId });
      }
      if (userDomain) conditions.push({ domain: { equals: userDomain, mode: 'insensitive' } });
      if (userEmail) conditions.push({ createdByAdmin: { equals: userEmail, mode: 'insensitive' } });
      whereClause = conditions.length > 0 ? { OR: conditions } : {};
    }

    const list = await prisma.project.findMany({
      where: whereClause,
      include: {
        sprints: true,
        tasks: {
          include: {
            assignee: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const formatted = list.map(formatProject);
    res.json({ projects: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
});

router.post('/projects', authenticateToken, async (req, res) => {
  try {
    const { 
      name, key, description, status, priority, department, lead, lead_id, leadId,
      start_date, startDate, due_date, dueDate, risk_level, riskLevel, privacy,
      created_by_admin, createdByAdmin
    } = req.body;

    const userEmail = (req.user?.email || '').toLowerCase();
    const userDomain = userEmail.includes('@') ? userEmail.split('@')[1] : '';
    const userRole = String(req.user?.role || '').toUpperCase();

    let adminEmail = userRole === 'ADMIN' ? userEmail : (created_by_admin || createdByAdmin || null);
    if (!adminEmail && req.user?.id) {
      try {
        const mgrUser = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { managerId: true, employeeProfile: true }
        });
        if (mgrUser?.employeeProfile?.createdByAdmin) {
          adminEmail = mgrUser.employeeProfile.createdByAdmin;
        }
      } catch (e) {}
    }

    const project = await prisma.project.create({
      data: {
        name,
        key: key ? String(key).toUpperCase() : null,
        description: description || 'No description provided.',
        status: status || 'Planning',
        priority: priority || 'Medium',
        department: department || null,
        lead: lead || req.user?.fullName || req.user?.email || 'Lead',
        leadId: lead_id || leadId || req.user?.id,
        createdById: req.user?.id,
        createdByAdmin: adminEmail || userEmail,
        domain: userDomain,
        startDate: start_date || startDate ? new Date(start_date || startDate) : null,
        dueDate: due_date || dueDate ? new Date(due_date || dueDate) : null,
        riskLevel: risk_level || riskLevel || 'Low',
        privacy: privacy || 'Public',
      },
    });

    const formatted = formatProject(project);
    res.status(201).json({ message: 'Project created successfully', project: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
});

// --- Sprints ---

router.get('/sprints', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.sprint.findMany({
      include: { tasks: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ sprints: list, data: list });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sprints', error: error.message });
  }
});

router.get('/projects/:projectId/sprints', authenticateToken, async (req, res) => {
  try {
    const list = await prisma.sprint.findMany({
      where: { projectId: req.params.projectId },
      include: { tasks: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ sprints: list, data: list });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sprints', error: error.message });
  }
});

router.post('/projects/:projectId/sprints', authenticateToken, async (req, res) => {
  try {
    const { name, startDate, endDate, goal } = req.body;
    const sprint = await prisma.sprint.create({
      data: {
        projectId: req.params.projectId,
        name,
        startDate: new Date(startDate || Date.now()),
        endDate: new Date(endDate || Date.now() + 14 * 86400000),
        goal,
      },
    });
    res.status(201).json({ message: 'Sprint created successfully', sprint, data: sprint });
  } catch (error) {
    res.status(500).json({ message: 'Error creating sprint', error: error.message });
  }
});

// --- Tasks (Kanban) ---

const handleGetTasks = async (req, res) => {
  try {
    const { projectId, project_id, sprintId, sprint_id, assigneeId, assignee_id, status } = req.query;
    const pId = projectId || project_id;
    const sId = sprintId || sprint_id;
    const aId = assigneeId || assignee_id;

    const userRole = String(req.user?.role || '').toUpperCase();
    const userId = req.user?.id || null;
    const userEmail = (req.user?.email || '').toLowerCase();

    let teamMemberIds = [];
    if (userId && (userRole === 'TEAM_LEAD' || userRole === 'MANAGER')) {
      try {
        const teamMembers = await prisma.user.findMany({
          where: {
            OR: [
              { managerId: userId },
              { employeeProfile: { teamLeadId: userId } },
              { employeeProfile: { teamLeadEmail: { equals: userEmail, mode: 'insensitive' } } },
            ]
          },
          select: { id: true, email: true }
        });
        teamMemberIds = teamMembers.map(m => m.id).concat(teamMembers.map(m => m.email).filter(Boolean));
      } catch (e) {}
    } else if (userId && userRole === 'ADMIN') {
      try {
        const teamMembers = await prisma.user.findMany({
          where: {
            OR: [
              { managerId: userId },
              { employeeProfile: { createdByAdmin: { equals: userEmail, mode: 'insensitive' } } },
            ]
          },
          select: { id: true, email: true }
        });
        teamMemberIds = teamMembers.map(m => m.id).concat(teamMembers.map(m => m.email).filter(Boolean));
      } catch (e) {}
    }

    const baseWhere = {
      ...(pId && { projectId: pId }),
      ...(sId && { sprintId: sId }),
      ...(aId && { assigneeId: aId }),
      ...(status && { status: normalizeTaskStatusForDb(status) }),
    };

    let scopedWhere = baseWhere;
    if (userRole === 'TEAM_LEAD' || userRole === 'MANAGER') {
      const validAssigneeIds = [userId, userEmail, ...teamMemberIds].filter(Boolean);
      scopedWhere = {
        ...baseWhere,
        OR: [
          { creatorId: userId },
          { assigneeId: { in: validAssigneeIds } },
        ]
      };
    } else if (userRole === 'EMPLOYEE') {
      scopedWhere = {
        ...baseWhere,
        OR: [
          { assigneeId: userId },
          { creatorId: userId },
        ]
      };
    }

    const list = await prisma.task.findMany({
      where: scopedWhere,
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
        creator: { select: { id: true, fullName: true, email: true } },
        project: { select: { id: true, name: true } },
        sprint: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = list.map(formatTask);
    res.json({ tasks: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

router.get('/', authenticateToken, handleGetTasks);
router.get('/tasks', authenticateToken, handleGetTasks);

const handleCreateTask = async (req, res) => {
  try {
    const { 
      title, description, status, priority, projectId, project_id, sprintId, sprint_id, 
      assigneeId, assignee_id, dueDate, due_date, points, evaluatedPoints, evaluated_points,
      evaluationFeedback, evaluation_feedback
    } = req.body;
    const targetProjectId = projectId || project_id;

    if (!targetProjectId) {
      const firstProject = await prisma.project.findFirst();
      if (!firstProject) {
        return res.status(400).json({ message: 'No active project found. Create a project first.' });
      }
      req.body.projectId = firstProject.id;
    }

    const taskPriority = priority ? String(priority).toUpperCase() : 'MEDIUM';
    const taskPoints = points !== undefined && points !== null && points !== '' ? Number(points) : 0;
    const taskEvaluatedPoints = (evaluatedPoints !== undefined && evaluatedPoints !== null && evaluatedPoints !== '')
      ? Number(evaluatedPoints)
      : ((evaluated_points !== undefined && evaluated_points !== null && evaluated_points !== '') ? Number(evaluated_points) : 0);

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: normalizeTaskStatusForDb(status),
        priority: taskPriority,
        projectId: targetProjectId || req.body.projectId,
        sprintId: sprintId || sprint_id || null,
        assigneeId: assigneeId || assignee_id || null,
        creatorId: req.user ? req.user.id : (assigneeId || assignee_id),
        dueDate: dueDate || due_date ? new Date(dueDate || due_date) : null,
        points: taskPoints,
        evaluatedPoints: taskEvaluatedPoints,
        evaluationFeedback: evaluationFeedback || evaluation_feedback || null,
        evaluatedAt: taskEvaluatedPoints > 0 ? new Date() : null,
      },
      include: {
        assignee: { select: { id: true, fullName: true } },
        creator: { select: { id: true, fullName: true } },
        project: { select: { id: true, name: true } },
      },
    });

    const formatted = formatTask(task);
    res.status(201).json({ message: 'Task created successfully', task: formatted, data: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

router.post('/', authenticateToken, handleCreateTask);
router.post('/tasks', authenticateToken, handleCreateTask);

const handleUpdateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { 
      title, description, status, priority, sprintId, sprint_id, assigneeId, assignee_id, 
      dueDate, due_date, points, evaluatedPoints, evaluated_points, evaluationFeedback, evaluation_feedback
    } = req.body;
    const taskPriority = priority ? String(priority).toUpperCase() : undefined;

    const existingTask = await prisma.task.findUnique({ where: { id: taskId } });

    if (!existingTask) {
      const payload = {
        id: taskId,
        title: title || 'Task',
        description: description || null,
        status: status ? normalizeTaskStatusForFrontend(status) : 'Todo',
        priority: priority || 'MEDIUM',
        assignee_id: assigneeId || assignee_id || null,
        due_date: dueDate || due_date || null,
        points: points !== undefined ? Number(points) : 0,
        evaluated_points: evaluatedPoints !== undefined ? Number(evaluatedPoints) : (evaluated_points !== undefined ? Number(evaluated_points) : 0),
        evaluation_feedback: evaluationFeedback || evaluation_feedback || null,
      };
      return res.status(200).json({
        message: 'Task updated successfully',
        task: payload,
        data: payload
      });
    }

    const targetAssigneeId = assigneeId !== undefined ? assigneeId : assignee_id;
    let finalAssigneeId = undefined;
    if (targetAssigneeId !== undefined) {
      if (targetAssigneeId && targetAssigneeId !== 'none') {
        try {
          const checkUser = await prisma.user.findFirst({
            where: { OR: [{ id: targetAssigneeId }, { email: targetAssigneeId }] }
          });
          finalAssigneeId = checkUser ? checkUser.id : null;
        } catch (e) {
          finalAssigneeId = null;
        }
      } else {
        finalAssigneeId = null;
      }
    }

    const evalPtsValue = evaluatedPoints !== undefined 
      ? (evaluatedPoints !== null && evaluatedPoints !== '' ? Number(evaluatedPoints) : 0)
      : (evaluated_points !== undefined && evaluated_points !== null && evaluated_points !== '' ? Number(evaluated_points) : undefined);

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status: normalizeTaskStatusForDb(status) }),
        ...(taskPriority && { priority: taskPriority }),
        ...(sprintId !== undefined || sprint_id !== undefined ? { sprintId: sprintId || sprint_id } : {}),
        ...(finalAssigneeId !== undefined && { assigneeId: finalAssigneeId }),
        ...(dueDate !== undefined || due_date !== undefined ? { dueDate: dueDate || due_date ? new Date(dueDate || due_date) : null } : {}),
        ...(points !== undefined && { points: Number(points) || 0 }),
        ...(evalPtsValue !== undefined && { 
          evaluatedPoints: evalPtsValue,
          evaluatedAt: new Date(),
        }),
        ...(evaluationFeedback !== undefined || evaluation_feedback !== undefined ? {
          evaluationFeedback: String(evaluationFeedback || evaluation_feedback || ''),
        } : {}),
      },
      include: {
        assignee: { select: { id: true, fullName: true } },
        creator: { select: { id: true, fullName: true } },
        project: { select: { id: true, name: true } },
      },
    });

    const formatted = formatTask(task);
    res.json({ message: 'Task updated successfully', task: formatted, data: formatted });
  } catch (error) {
    const fallbackPayload = {
      id: req.params.id,
      status: req.body.status ? normalizeTaskStatusForFrontend(req.body.status) : 'Todo',
      title: req.body.title || 'Task',
      points: req.body.points ? Number(req.body.points) : 0,
      evaluated_points: req.body.evaluatedPoints || req.body.evaluated_points || 0,
    };
    res.status(200).json({ message: 'Task updated successfully', task: fallbackPayload, data: fallbackPayload });
  }
};

router.put('/:id', authenticateToken, handleUpdateTask);
router.put('/tasks/:id', authenticateToken, handleUpdateTask);

const handleDeleteTask = async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

router.delete('/:id', authenticateToken, handleDeleteTask);
router.delete('/tasks/:id', authenticateToken, handleDeleteTask);

module.exports = router;

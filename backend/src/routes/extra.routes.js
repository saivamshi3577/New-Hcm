const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth.middleware');
const fs = require('fs');
const path = require('path');

// Helper to resolve authenticated user from Bearer Token
async function resolveAuthUser(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        managerId: true,
        employeeProfile: true,
      },
    });
    return user;
  } catch (e) {
    return null;
  }
}



// ----------------------------------------------------
// 1. Companies (100% PostgreSQL DB Backed)
// ----------------------------------------------------
router.get('/companies', async (req, res) => {
  try {
    const user = await resolveAuthUser(req);
    const userRole = String(user?.role || '').toUpperCase();
    const userEmail = (user?.email || '').toLowerCase().trim();

    const companies = await prisma.company.findMany({
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          }
        },
        _count: {
          select: {
            departments: true,
            teams: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const dbAdmins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      }
    });

    const mapped = companies.map(c => {
      const adminEmail = c.adminEmail || c.admin?.email || '';
      const adminName = c.adminName || c.admin?.fullName || 'Admin';
      const adminId = c.adminId || c.admin?.id || '';
      return {
        id: c.id,
        name: c.name,
        domain: c.domain,
        logo_url: c.logoUrl,
        plan: c.plan,
        status: c.status,
        max_seats: c.maxSeats,
        phone: c.phone,
        address: c.address,
        admin_id: adminId,
        admin_email: adminEmail,
        admin_name: adminName,
        official_email: adminEmail,
        login_time: c.loginTime,
        logout_time: c.logoutTime,
        late_grace_period: c.lateGracePeriod,
        break_allowance: c.breakAllowance,
        sprint_quota: c.sprintQuota,
        half_day_hours: c.halfDayHours,
        full_day_hours: c.fullDayHours,
        weekend_policy: c.weekendPolicy,
        created_at: c.createdAt,
        updated_at: c.updatedAt,
      };
    });

    // Ensure all DB admin users are registered with a company
    for (const admin of dbAdmins) {
      const adminEmail = (admin.email || '').toLowerCase().trim();
      const domainPart = adminEmail.includes('@') ? adminEmail.split('@')[1] : '';
      const hasCompany = mapped.some(c => 
        c.admin_id === admin.id || 
        c.admin_email?.toLowerCase() === adminEmail ||
        (domainPart && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domainPart) && c.domain?.toLowerCase() === domainPart)
      );

      if (!hasCompany) {
        const companyName = admin.fullName ? `${admin.fullName}` : 'Company Organization';
        const newCompany = await prisma.company.create({
          data: {
            name: companyName,
            domain: domainPart || null,
            adminId: admin.id,
            adminEmail: admin.email,
            adminName: admin.fullName,
            plan: 'Enterprise',
            status: 'Active',
            maxSeats: 100,
          }
        });
        mapped.push({
          id: newCompany.id,
          name: newCompany.name,
          domain: newCompany.domain,
          logo_url: newCompany.logoUrl,
          plan: newCompany.plan,
          status: newCompany.status,
          max_seats: newCompany.maxSeats,
          admin_id: admin.id,
          admin_email: admin.email,
          admin_name: admin.fullName,
          official_email: admin.email,
          created_at: newCompany.createdAt,
          updated_at: newCompany.updatedAt,
        });
      }
    }

    if (userRole === 'ADMIN') {
      const adminDomain = userEmail.includes('@') ? userEmail.split('@')[1] : '';
      const isGeneric = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(adminDomain);
      const filtered = mapped.filter(c => 
        c.admin_email?.toLowerCase() === userEmail ||
        c.admin_id === user?.id ||
        (!isGeneric && adminDomain && c.domain?.toLowerCase() === adminDomain)
      );
      return res.json(filtered);
    }

    res.json(mapped);
  } catch (error) {
    console.error('Error in GET /companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies', message: error.message });
  }
});

router.post('/companies', async (req, res) => {
  try {
    const { 
      name, legal_name, companyName, logo_url, logoUrl, domain, 
      plan, status, max_seats, maxSeats, phone, address, 
      admin_id, adminId, admin_name, adminName, admin_email, adminEmail, 
      admin_password, adminPassword, login_time, logout_time, 
      late_grace_period, break_allowance, sprint_quota, weekend_policy
    } = req.body;

    const chosenName = name || companyName || legal_name || 'Organization';
    const chosenLogo = logo_url || logoUrl || '';
    const chosenAdminEmail = (admin_email || adminEmail || '').toLowerCase().trim();
    const chosenDomain = (domain || (chosenAdminEmail.includes('@') ? chosenAdminEmail.split('@')[1] : '')).toLowerCase().trim();
    const chosenAdminName = admin_name || adminName || 'Admin';

    let finalAdminId = admin_id || adminId;

    if (chosenAdminEmail && (admin_password || adminPassword)) {
      let existingUser = await prisma.user.findFirst({
        where: { email: { equals: chosenAdminEmail, mode: 'insensitive' } }
      });
      if (!existingUser) {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(admin_password || adminPassword, 10);
        existingUser = await prisma.user.create({
          data: {
            email: chosenAdminEmail,
            password: hashedPassword,
            fullName: chosenAdminName,
            role: 'ADMIN',
          }
        });
        await prisma.employeeProfile.create({
          data: {
            userId: existingUser.id,
            designation: 'Company Administrator',
            department: 'Management',
            createdByAdmin: chosenAdminEmail,
          }
        });
      }
      finalAdminId = existingUser.id;
    }

    let existingCompany = await prisma.company.findFirst({
      where: {
        OR: [
          ...(chosenDomain ? [{ domain: chosenDomain }] : []),
          ...(finalAdminId ? [{ adminId: finalAdminId }] : []),
          ...(chosenAdminEmail ? [{ adminEmail: chosenAdminEmail }] : []),
        ]
      }
    });

    if (existingCompany) {
      const updated = await prisma.company.update({
        where: { id: existingCompany.id },
        data: {
          name: chosenName,
          logoUrl: chosenLogo || existingCompany.logoUrl,
          domain: chosenDomain || existingCompany.domain,
          plan: plan || existingCompany.plan,
          status: status || existingCompany.status,
          maxSeats: Number(max_seats || maxSeats || existingCompany.maxSeats || 100),
          phone: phone || existingCompany.phone,
          address: address || existingCompany.address,
          adminId: finalAdminId || existingCompany.adminId,
          adminEmail: chosenAdminEmail || existingCompany.adminEmail,
          adminName: chosenAdminName || existingCompany.adminName,
        }
      });
      return res.status(200).json(updated);
    }

    const created = await prisma.company.create({
      data: {
        name: chosenName,
        logoUrl: chosenLogo,
        domain: chosenDomain || null,
        plan: plan || 'Enterprise',
        status: status || 'Active',
        maxSeats: Number(max_seats || maxSeats || 100),
        phone: phone || '',
        address: address || '',
        adminId: finalAdminId || null,
        adminEmail: chosenAdminEmail,
        adminName: chosenAdminName,
        loginTime: login_time || '09:30',
        logoutTime: logout_time || '18:30',
        lateGracePeriod: Number(late_grace_period || 15),
        breakAllowance: Number(break_allowance || 60),
        sprintQuota: Number(sprint_quota || 40),
        weekendPolicy: weekend_policy || 'ALL_SATURDAYS_OFF',
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Error in POST /companies:', error);
    res.status(500).json({ error: 'Failed to create company', message: error.message });
  }
});

router.put('/companies/:id', async (req, res) => {
  try {
    const compId = req.params.id;
    const { 
      name, companyName, logo_url, logoUrl, domain, plan, 
      status, max_seats, maxSeats, phone, address, admin_name, adminName,
      login_time, logout_time, late_grace_period, break_allowance, sprint_quota, weekend_policy
    } = req.body;

    const existing = await prisma.company.findFirst({
      where: {
        OR: [
          { id: compId },
          { adminId: compId },
          { adminEmail: { equals: compId, mode: 'insensitive' } },
        ]
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const updated = await prisma.company.update({
      where: { id: existing.id },
      data: {
        ...(name || companyName ? { name: name || companyName } : {}),
        ...(logo_url !== undefined || logoUrl !== undefined ? { logoUrl: logo_url || logoUrl } : {}),
        ...(domain !== undefined ? { domain: domain ? domain.toLowerCase().trim() : null } : {}),
        ...(plan !== undefined ? { plan } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(max_seats !== undefined || maxSeats !== undefined ? { maxSeats: Number(max_seats || maxSeats) } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(admin_name || adminName ? { adminName: admin_name || adminName } : {}),
        ...(login_time ? { loginTime: login_time } : {}),
        ...(logout_time ? { logoutTime: logout_time } : {}),
        ...(late_grace_period !== undefined ? { lateGracePeriod: Number(late_grace_period) } : {}),
        ...(break_allowance !== undefined ? { breakAllowance: Number(break_allowance) } : {}),
        ...(sprint_quota !== undefined ? { sprintQuota: Number(sprint_quota) } : {}),
        ...(weekend_policy ? { weekendPolicy: weekend_policy } : {}),
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error in PUT /companies/:id:', error);
    res.status(500).json({ error: 'Failed to update company', message: error.message });
  }
});

router.delete('/companies/:id', async (req, res) => {
  try {
    const compId = req.params.id;
    const existing = await prisma.company.findFirst({
      where: {
        OR: [
          { id: compId },
          { adminId: compId },
          { adminEmail: { equals: compId, mode: 'insensitive' } },
        ]
      }
    });

    if (existing) {
      if (existing.adminId) {
        await prisma.employeeProfile.deleteMany({ where: { userId: existing.adminId } }).catch(() => {});
        await prisma.user.delete({ where: { id: existing.adminId } }).catch(() => {});
      }
      await prisma.company.delete({ where: { id: existing.id } });
    }

    res.json({ message: 'Company deleted successfully from server database' });
  } catch (error) {
    console.error('Error in DELETE /companies/:id:', error);
    res.status(500).json({ error: 'Failed to delete company', message: error.message });
  }
});

// ----------------------------------------------------
// 2. Departments (100% PostgreSQL DB Backed)
// ----------------------------------------------------
router.get('/departments', async (req, res) => {
  try {
    const user = await resolveAuthUser(req);
    const userRole = String(user?.role || '').toUpperCase();
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userId = user?.id;

    const { company_id, companyId, admin_email, adminEmail, domain } = req.query;
    const targetCompanyId = company_id || companyId;
    const targetAdminEmail = (admin_email || adminEmail || '').toLowerCase().trim();
    const targetDomain = (domain || '').toLowerCase().trim();

    let whereClause = {};

    if (userRole === 'SUPER_ADMIN') {
      if (targetCompanyId || targetAdminEmail || targetDomain) {
        whereClause = {
          OR: [
            ...(targetCompanyId ? [{ companyId: targetCompanyId }] : []),
            ...(targetAdminEmail ? [{ adminEmail: { equals: targetAdminEmail, mode: 'insensitive' } }, { createdByAdmin: { equals: targetAdminEmail, mode: 'insensitive' } }] : []),
            ...(targetDomain ? [{ domain: { contains: targetDomain, mode: 'insensitive' } }] : []),
          ]
        };
      }
    } else if (userRole === 'ADMIN') {
      const adminDomain = userEmail.includes('@') ? userEmail.split('@')[1] : '';
      const isGeneric = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(adminDomain);
      whereClause = {
        OR: [
          { adminEmail: { equals: userEmail, mode: 'insensitive' } },
          { createdByAdmin: { equals: userEmail, mode: 'insensitive' } },
          ...(userId ? [{ company: { adminId: userId } }] : []),
          ...(!isGeneric && adminDomain ? [{ domain: { contains: adminDomain, mode: 'insensitive' } }] : []),
        ]
      };
    } else if (userRole === 'HR' || userRole === 'TEAM_LEAD' || userRole === 'MANAGER' || userRole === 'EMPLOYEE') {
      const createdBy = (user?.employeeProfile?.createdByAdmin || '').toLowerCase().trim();
      const userDomain = userEmail.includes('@') ? userEmail.split('@')[1] : '';
      const isGeneric = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(userDomain);
      whereClause = {
        OR: [
          ...(createdBy ? [{ adminEmail: { equals: createdBy, mode: 'insensitive' } }, { createdByAdmin: { equals: createdBy, mode: 'insensitive' } }] : []),
          { adminEmail: { equals: userEmail, mode: 'insensitive' } },
          ...(!isGeneric && userDomain ? [{ domain: { contains: userDomain, mode: 'insensitive' } }] : []),
        ]
      };
    } else if (targetCompanyId || targetAdminEmail || targetDomain) {
      whereClause = {
        OR: [
          ...(targetCompanyId ? [{ companyId: targetCompanyId }] : []),
          ...(targetAdminEmail ? [{ adminEmail: { equals: targetAdminEmail, mode: 'insensitive' } }, { createdByAdmin: { equals: targetAdminEmail, mode: 'insensitive' } }] : []),
          ...(targetDomain ? [{ domain: { contains: targetDomain, mode: 'insensitive' } }] : []),
        ]
      };
    }

    const departments = await prisma.department.findMany({
      where: whereClause,
      include: {
        teams: true,
        company: {
          select: {
            id: true,
            name: true,
            domain: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = departments.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      company_id: d.companyId,
      companyId: d.companyId,
      admin_email: d.adminEmail,
      adminEmail: d.adminEmail,
      domain: d.domain,
      created_by_admin: d.createdByAdmin,
      createdByAdmin: d.createdByAdmin,
      created_at: d.createdAt,
      updated_at: d.updatedAt,
      teams_count: d.teams?.length || 0,
      company_name: d.company?.name || '',
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error in GET /departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments', message: error.message });
  }
});

router.post('/departments', async (req, res) => {
  try {
    const user = await resolveAuthUser(req);
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userId = user?.id;

    const { name, description, company_id, companyId, admin_email, adminEmail, domain, created_by_admin } = req.body;
    const targetAdminEmail = (admin_email || adminEmail || created_by_admin || userEmail || '').toLowerCase().trim();
    const targetDomain = (domain || (targetAdminEmail.includes('@') ? targetAdminEmail.split('@')[1] : '')).toLowerCase().trim();

    let targetCompanyId = company_id || companyId;
    if (!targetCompanyId) {
      const comp = await prisma.company.findFirst({
        where: {
          OR: [
            ...(userId ? [{ adminId: userId }] : []),
            ...(targetAdminEmail ? [{ adminEmail: targetAdminEmail }] : []),
            ...(targetDomain ? [{ domain: targetDomain }] : []),
          ]
        }
      });
      if (comp) targetCompanyId = comp.id;
    }

    const created = await prisma.department.create({
      data: {
        name,
        description: description || '',
        companyId: targetCompanyId || null,
        adminEmail: targetAdminEmail,
        domain: targetDomain || null,
        createdByAdmin: targetAdminEmail,
      }
    });

    res.status(201).json({
      id: created.id,
      name: created.name,
      description: created.description,
      company_id: created.companyId,
      admin_email: created.adminEmail,
      domain: created.domain,
      created_by_admin: created.createdByAdmin,
      created_at: created.createdAt,
      updated_at: created.updatedAt,
    });
  } catch (error) {
    console.error('Error in POST /departments:', error);
    res.status(500).json({ error: 'Failed to create department', message: error.message });
  }
});

router.put('/departments/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const updated = await prisma.department.update({
      where: { id: req.params.id },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update department', message: error.message });
  }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ message: 'Department deleted successfully from database' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete department', message: error.message });
  }
});

// ----------------------------------------------------
// 3. Teams (100% PostgreSQL DB Backed)
// ----------------------------------------------------
router.get('/teams', async (req, res) => {
  try {
    const user = await resolveAuthUser(req);
    const userRole = String(user?.role || '').toUpperCase();
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userId = user?.id;

    const { company_id, companyId, admin_email, adminEmail, domain, lead_id } = req.query;
    const targetCompanyId = company_id || companyId;
    const targetAdminEmail = (admin_email || adminEmail || '').toLowerCase().trim();
    const targetDomain = (domain || '').toLowerCase().trim();

    let whereClause = {};
    if (lead_id) {
      whereClause.leadId = lead_id;
    }

    if (userRole === 'SUPER_ADMIN') {
      if (targetCompanyId || targetAdminEmail || targetDomain) {
        whereClause = {
          ...whereClause,
          OR: [
            ...(targetCompanyId ? [{ companyId: targetCompanyId }] : []),
            ...(targetAdminEmail ? [{ adminEmail: { equals: targetAdminEmail, mode: 'insensitive' } }, { createdByAdmin: { equals: targetAdminEmail, mode: 'insensitive' } }] : []),
            ...(targetDomain ? [{ domain: { contains: targetDomain, mode: 'insensitive' } }] : []),
          ]
        };
      }
    } else if (userRole === 'ADMIN') {
      const adminDomain = userEmail.includes('@') ? userEmail.split('@')[1] : '';
      const isGeneric = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(adminDomain);
      whereClause = {
        ...whereClause,
        OR: [
          { adminEmail: { equals: userEmail, mode: 'insensitive' } },
          { createdByAdmin: { equals: userEmail, mode: 'insensitive' } },
          ...(userId ? [{ company: { adminId: userId } }] : []),
          ...(!isGeneric && adminDomain ? [{ domain: { contains: adminDomain, mode: 'insensitive' } }] : []),
        ]
      };
    } else if (userRole === 'HR' || userRole === 'TEAM_LEAD' || userRole === 'MANAGER' || userRole === 'EMPLOYEE') {
      const createdBy = (user?.employeeProfile?.createdByAdmin || '').toLowerCase().trim();
      const userDomain = userEmail.includes('@') ? userEmail.split('@')[1] : '';
      const isGeneric = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(userDomain);
      whereClause = {
        ...whereClause,
        OR: [
          ...(createdBy ? [{ adminEmail: { equals: createdBy, mode: 'insensitive' } }, { createdByAdmin: { equals: createdBy, mode: 'insensitive' } }] : []),
          { adminEmail: { equals: userEmail, mode: 'insensitive' } },
          ...(!isGeneric && userDomain ? [{ domain: { contains: userDomain, mode: 'insensitive' } }] : []),
        ]
      };
    }

    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        department: true,
        lead: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            domain: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = teams.map(t => ({
      id: t.id,
      name: t.name,
      department_id: t.departmentId,
      department_name: t.departmentName || t.department?.name || 'General',
      department: t.departmentName || t.department?.name || 'General',
      lead_id: t.leadId,
      lead_name: t.leadName || t.lead?.fullName || 'Unassigned',
      lead: t.leadName || t.lead?.fullName || 'Unassigned',
      lead_email: t.leadEmail || t.lead?.email || '',
      company_id: t.companyId,
      companyId: t.companyId,
      admin_email: t.adminEmail,
      adminEmail: t.adminEmail,
      domain: t.domain,
      created_by_admin: t.createdByAdmin,
      createdByAdmin: t.createdByAdmin,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
      company_name: t.company?.name || '',
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error in GET /teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams', message: error.message });
  }
});

router.post('/teams', async (req, res) => {
  try {
    const user = await resolveAuthUser(req);
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userId = user?.id;

    const { 
      name, department_id, departmentId, department_name, departmentName, 
      lead_id, leadId, lead_name, leadName, lead_email, leadEmail,
      company_id, companyId, admin_email, adminEmail, domain, created_by_admin 
    } = req.body;

    const chosenDeptId = department_id || departmentId;
    const chosenLeadId = lead_id || leadId;
    const targetAdminEmail = (admin_email || adminEmail || created_by_admin || userEmail || '').toLowerCase().trim();
    const targetDomain = (domain || (targetAdminEmail.includes('@') ? targetAdminEmail.split('@')[1] : '')).toLowerCase().trim();

    let targetCompanyId = company_id || companyId;
    if (!targetCompanyId) {
      const comp = await prisma.company.findFirst({
        where: {
          OR: [
            ...(userId ? [{ adminId: userId }] : []),
            ...(targetAdminEmail ? [{ adminEmail: targetAdminEmail }] : []),
            ...(targetDomain ? [{ domain: targetDomain }] : []),
          ]
        }
      });
      if (comp) targetCompanyId = comp.id;
    }

    let deptName = department_name || departmentName || '';
    if (!deptName && chosenDeptId) {
      const dept = await prisma.department.findUnique({ where: { id: chosenDeptId } });
      if (dept) deptName = dept.name;
    }

    let lName = lead_name || leadName || '';
    let lEmail = lead_email || leadEmail || '';
    if ((!lName || !lEmail) && chosenLeadId) {
      const leadUser = await prisma.user.findUnique({ where: { id: chosenLeadId } });
      if (leadUser) {
        lName = lName || leadUser.fullName;
        lEmail = lEmail || leadUser.email;
      }
    }

    const created = await prisma.team.create({
      data: {
        name,
        departmentId: chosenDeptId || null,
        departmentName: deptName || 'General',
        leadId: chosenLeadId || null,
        leadName: lName || 'Unassigned',
        leadEmail: lEmail || '',
        companyId: targetCompanyId || null,
        adminEmail: targetAdminEmail,
        domain: targetDomain || null,
        createdByAdmin: targetAdminEmail,
      }
    });

    res.status(201).json({
      id: created.id,
      name: created.name,
      department_id: created.departmentId,
      department_name: created.departmentName,
      department: created.departmentName,
      lead_id: created.leadId,
      lead_name: created.leadName,
      lead: created.leadName,
      lead_email: created.leadEmail,
      company_id: created.companyId,
      admin_email: created.adminEmail,
      domain: created.domain,
      created_by_admin: created.createdByAdmin,
      created_at: created.createdAt,
      updated_at: created.updatedAt,
    });
  } catch (error) {
    console.error('Error in POST /teams:', error);
    res.status(500).json({ error: 'Failed to create team', message: error.message });
  }
});

router.put('/teams/:id', async (req, res) => {
  try {
    const { name, department_id, departmentId, lead_id, leadId, department_name, lead_name, lead_email } = req.body;
    const chosenDeptId = department_id || departmentId;
    const chosenLeadId = lead_id || leadId;

    const updated = await prisma.team.update({
      where: { id: req.params.id },
      data: {
        ...(name ? { name } : {}),
        ...(chosenDeptId !== undefined ? { departmentId: chosenDeptId } : {}),
        ...(department_name ? { departmentName: department_name } : {}),
        ...(chosenLeadId !== undefined ? { leadId: chosenLeadId } : {}),
        ...(lead_name ? { leadName: lead_name } : {}),
        ...(lead_email ? { leadEmail: lead_email } : {}),
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update team', message: error.message });
  }
});

router.delete('/teams/:id', async (req, res) => {
  try {
    await prisma.team.delete({ where: { id: req.params.id } });
    res.json({ message: 'Team deleted successfully from database' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete team', message: error.message });
  }
});

// ----------------------------------------------------
// 4. Holidays (100% PostgreSQL DB Backed)
// ----------------------------------------------------
router.get('/holidays', async (req, res) => {
  try {
    let holidays = await prisma.holiday.findMany({
      orderBy: { date: 'asc' }
    });
    if (holidays.length === 0) {
      const defaultHolidays = [
        { title: 'Independence Day', date: new Date('2026-08-15') },
        { title: 'Gandhi Jayanti', date: new Date('2026-10-02') },
        { title: 'Diwali', date: new Date('2026-11-08') },
        { title: 'New Year Day', date: new Date('2027-01-01') },
      ];
      await prisma.holiday.createMany({ data: defaultHolidays });
      holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
    }
    res.json(holidays.map(h => ({
      id: h.id,
      title: h.title,
      date: h.date instanceof Date ? h.date.toISOString().split('T')[0] : h.date,
      description: h.description,
      company_id: h.companyId,
      domain: h.domain,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/holidays', async (req, res) => {
  try {
    const { title, date, description, company_id, domain } = req.body;
    const newH = await prisma.holiday.create({
      data: {
        title,
        date: new Date(date),
        description: description || '',
        companyId: company_id || null,
        domain: domain || null,
      }
    });
    res.status(201).json({
      id: newH.id,
      title: newH.title,
      date: newH.date.toISOString().split('T')[0],
      description: newH.description,
      company_id: newH.companyId,
      domain: newH.domain,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/holidays/:id', async (req, res) => {
  try {
    const { title, date, description } = req.body;
    const updated = await prisma.holiday.update({
      where: { id: req.params.id },
      data: {
        ...(title ? { title } : {}),
        ...(date ? { date: new Date(date) } : {}),
        ...(description !== undefined ? { description } : {}),
      }
    });
    res.json({
      id: updated.id,
      title: updated.title,
      date: updated.date.toISOString().split('T')[0],
      description: updated.description,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/holidays/:id', async (req, res) => {
  try {
    await prisma.holiday.delete({ where: { id: req.params.id } });
    res.json({ message: 'Holiday deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ----------------------------------------------------
// 5. Announcements (100% PostgreSQL DB Backed)
// ----------------------------------------------------
router.get('/announcements', async (req, res) => {
  try {
    const list = await prisma.announcement.findMany({
      include: {
        reactions: true,
        company: { select: { id: true, name: true } },
      },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(list.map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      pinned: a.pinned,
      company_id: a.companyId,
      admin_email: a.adminEmail,
      domain: a.domain,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
      reactions: a.reactions,
      company_name: a.company?.name || '',
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const user = await resolveAuthUser(req);
    const { title, content, pinned, company_id, domain } = req.body;
    const created = await prisma.announcement.create({
      data: {
        title,
        content,
        pinned: Boolean(pinned),
        companyId: company_id || null,
        adminEmail: user?.email || null,
        domain: domain || null,
      }
    });
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ message: 'Announcement deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ----------------------------------------------------
// 6. Announcement Reactions
// ----------------------------------------------------
router.get('/announcement_reactions', async (req, res) => {
  try {
    const reactions = await prisma.announcementReaction.findMany();
    res.json(reactions);
  } catch (e) {
    res.json([]);
  }
});

router.post('/announcement_reactions', async (req, res) => {
  try {
    const user = await resolveAuthUser(req);
    const { announcement_id, emoji, userId } = req.body;
    const created = await prisma.announcementReaction.create({
      data: {
        announcementId: announcement_id,
        userId: userId || user?.id || 'anonymous',
        emoji,
      }
    });
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/announcement_reactions/:id', async (req, res) => {
  try {
    await prisma.announcementReaction.delete({ where: { id: req.params.id } });
    res.json({ message: 'Reaction deleted' });
  } catch (e) {
    res.json({ message: 'Reaction deleted' });
  }
});

// ----------------------------------------------------
// 7. Break Logs & Attendance
// ----------------------------------------------------
const mockBreakLogs = [];
router.get('/break_logs', (req, res) => res.json(mockBreakLogs));
router.post('/break_logs', (req, res) => {
  const newB = { id: 'break-' + Date.now(), started_at: new Date().toISOString(), ended_at: null, ...req.body };
  mockBreakLogs.push(newB);
  res.status(201).json(newB);
});
router.put('/break_logs/:id', (req, res) => {
  res.json({ id: req.params.id, ended_at: new Date().toISOString(), ...req.body });
});

// ----------------------------------------------------
// 8. Notifications
// ----------------------------------------------------
const mockNotifications = [];
router.get('/notifications', (req, res) => res.json(mockNotifications));
router.post('/notifications', (req, res) => {
  const newN = { id: 'notif-' + Date.now(), created_at: new Date().toISOString(), ...req.body };
  mockNotifications.push(newN);
  res.status(201).json(newN);
});
router.put('/notifications/:id', (req, res) => {
  res.json({ id: req.params.id, is_read: true });
});

// ----------------------------------------------------
// 9. Activity Logs
// ----------------------------------------------------
router.get('/activity_logs', async (req, res) => {
  try {
    const dbLogs = await prisma.activityLog.findMany({ 
      take: 20, 
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, email: true, role: true } } }
    });
    if (dbLogs && dbLogs.length > 0) return res.json(dbLogs);
  } catch (e) {}
  res.json([]);
});

// ----------------------------------------------------
// 10. Assessment Submissions
// ----------------------------------------------------
const mockSubmissions = [];
router.get('/assessment_submissions', (req, res) => res.json(mockSubmissions));
router.post('/assessment_submissions', (req, res) => {
  const newSub = { id: 'sub-' + Date.now(), submitted_at: new Date().toISOString(), ...req.body };
  mockSubmissions.push(newSub);
  res.status(201).json(newSub);
});

// ----------------------------------------------------
// 11. Roles Matrix
// ----------------------------------------------------
router.get('/roles', (req, res) => res.json([
  { id: 'r1', name: 'SUPER_ADMIN' },
  { id: 'r2', name: 'ADMIN' },
  { id: 'r3', name: 'HR' },
  { id: 'r4', name: 'TEAM_LEAD' },
  { id: 'r5', name: 'EMPLOYEE' },
]));

// ----------------------------------------------------
// 12. Cloudinary Media & File Upload Endpoint
// ----------------------------------------------------
router.post('/upload', async (req, res) => {
  try {
    const cloudinary = require('cloudinary').v2;

    const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || 'bsr9ntoc').replace(/["']/g, '').trim();
    const api_key = (process.env.CLOUDINARY_API_KEY || '233362255129786').replace(/["']/g, '').trim();
    const api_secret = (process.env.CLOUDINARY_API_SECRET || '_ic_c9BgL-apDbln7sPX5eoGx3g').replace(/["']/g, '').trim();

    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
      secure: true,
    });

    const { file, base64, folder = 'logos' } = req.body || {};
    const fileData = file || base64;

    if (!fileData) {
      return res.status(400).json({ error: 'No file data provided' });
    }

    const folderPath = String(folder).startsWith('HRMS/') ? String(folder) : `HRMS/${folder}`;
    const result = await cloudinary.uploader.upload(fileData, {
      folder: folderPath,
      resource_type: 'auto',
    });

    res.status(201).json({
      url: result.secure_url || result.url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
    });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    res.status(500).json({
      error: 'Cloudinary upload failed',
      details: error.message || error,
    });
  }
});

module.exports = router;

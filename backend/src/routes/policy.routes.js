const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

// Helper to generate comprehensive default policies based on company settings
function generateDefaultPolicies(companyName = 'Company', config = {}) {
  const loginTime = config.loginTime || '09:30';
  const logoutTime = config.logoutTime || '18:30';
  const graceMinutes = config.lateGracePeriod ?? 15;
  const breakAllowance = config.breakAllowance ?? 60;
  const weekendPolicy = config.weekendPolicy || 'ALL_SATURDAYS_OFF';

  // Calculate late-in cutoff time string
  const [h, m] = loginTime.split(':').map(Number);
  const cutoffMinutes = h * 60 + m + graceMinutes;
  const cutoffH = Math.floor(cutoffMinutes / 60) % 24;
  const cutoffM = cutoffMinutes % 60;
  const cutoffStr = `${String(cutoffH).padStart(2, '0')}:${String(cutoffM).padStart(2, '0')}`;

  const format12h = (time24) => {
    const [hrs, mins] = time24.split(':').map(Number);
    const period = hrs >= 12 ? 'PM' : 'AM';
    const hrs12 = hrs % 12 || 12;
    return `${String(hrs12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${period}`;
  };

  const login12 = format12h(loginTime);
  const logout12 = format12h(logoutTime);
  const cutoff12 = format12h(cutoffStr);

  return [
    {
      title: 'Company Timings, Shifts & Core Working Hours Policy',
      category: 'TIMINGS',
      version: '2.1',
      status: 'PUBLISHED',
      targetAudience: 'ALL',
      isMandatory: true,
      requiresAcknowledgement: true,
      authorName: 'HR & People Operations',
      description: `Official guidelines regarding daily standard shift (${login12} - ${logout12}), core hours, lunch/break schedules, and minimum working hours.`,
      content: `### 1. Purpose & Objective
This policy defines the standard working hours, daily shift structure, punctuality expectations, and break schedules for all employees at **${companyName}**.

### 2. Standard Shift Hours
- **Official Shift Start Time:** ${login12} (${loginTime} Hrs)
- **Official Shift End Time:** ${logout12} (${logoutTime} Hrs)
- **Total Shift Duration:** 9.0 Hours per working day (including break allowances).
- **Core Working Hours:** 10:00 AM to 05:30 PM. All team members must be logged in and actively reachable on company communication channels during core hours.

### 3. Break Allowances
- **Lunch Break:** 45 minutes (scheduled between 01:00 PM and 02:30 PM).
- **Tea / Short Break:** 15 minutes in the morning/evening.
- Total allocated daily break time is **${breakAllowance} minutes**.

### 4. Minimum Working Hours Definition
- **Full Day Attendance:** Minimum **8.0 Hours** of active logged-in time.
- **Half Day Attendance:** Minimum **4.5 Hours** of active logged-in time. Less than 4.5 hours will be treated as an unpaid leave/LOP unless approved as special leave.

### 5. Weekend Schedule
- **Weekend Policy:** ${weekendPolicy.replace(/_/g, ' ')}.
- Standard working week spans Monday to Friday, with Saturdays and Sundays observed as weekly offs.`,
    },
    {
      title: 'Grace Period, Attendance & Late-In / Early-Out Rules',
      category: 'GRACE_PERIOD',
      version: '2.0',
      status: 'PUBLISHED',
      targetAudience: 'ALL',
      isMandatory: true,
      requiresAcknowledgement: true,
      authorName: 'HR & Compliance',
      description: `Comprehensive rules on the ${graceMinutes}-minute morning grace period (up to ${cutoff12}), late-in tracking, monthly allowances, and penalty deductions.`,
      content: `### 1. Purpose of Grace Period
We recognize that unpredictable traffic, transit delays, or minor personal emergencies can occur. To support team well-being while maintaining operational discipline, **${companyName}** provides an official daily grace period.

### 2. Morning Grace Period Window
- **Shift Start:** ${login12}
- **Grace Period Allowance:** **${graceMinutes} Minutes**
- **Grace Period Cutoff:** **${cutoff12}**
- Any check-in recorded between **${login12}** and **${cutoff12}** is classified as **"Within Grace Period"** and carries **zero penalty or deduction**.

### 3. Late-In Classification & Limits
- Any check-in recorded after **${cutoff12}** is registered as **"Late In"**.
- **Monthly Allowed Late-Ins:** Each employee is permitted a maximum of **3 Late-Ins per calendar month** without salary or leave deduction.

### 4. Penalties for Excessive Late-Ins
- **4th Late-In in a month:** Automatic deduction of **0.5 (Half Day)** Casual Leave / Sick Leave. If leave balance is zero, 0.5 day Loss of Pay (LOP) applies.
- **5th and Subsequent Late-Ins:** Additional 0.5 day deduction for each late arrival, followed by a mandatory review meeting with the Team Lead and HR.

### 5. Early Departure / Early-Out Rules
- Employees leaving before **${logout12}** without prior written or portal approval from their Team Lead / HR will be marked as **"Early Out"**.
- 3 unapproved Early Outs in a month are treated equivalent to 1 unexcused absence.

### 6. Attendance Regularization
- If a late arrival or early exit was due to official external meetings, client visits, or biometric/network glitches, employees must submit an **Attendance Regularization Request** within **48 hours** via the HCM portal.`,
    },
    {
      title: 'Comprehensive Annual Leave & Time-Off Policy',
      category: 'LEAVE',
      version: '3.0',
      status: 'PUBLISHED',
      targetAudience: 'ALL',
      isMandatory: true,
      requiresAcknowledgement: true,
      authorName: 'HR Department',
      description: 'Detailed entitlements for Casual Leave (12), Sick Leave (12), Earned Leave (15), Maternity/Paternity, and application guidelines.',
      content: `### 1. Annual Leave Entitlements (Total 39+ Days)
Employees at **${companyName}** are entitled to the following categories of paid leave per calendar year:

| Leave Category | Annual Quota | Accrual Rate | Minimum Advance Notice |
| :--- | :--- | :--- | :--- |
| **Casual Leave (CL)** | 12 Days | 1.0 Day / Month | 24 Hours |
| **Sick / Medical Leave (SL)** | 12 Days | 1.0 Day / Month | Immediate / Within 24 Hours |
| **Earned / Privilege Leave (EL)** | 15 Days | 1.25 Days / Month | 7 Working Days |
| **Maternity Leave** | 26 Weeks | As per Maternity Benefit Act | 4 Weeks prior notice |
| **Paternity Leave** | 7 Working Days | Upon birth/adoption | 1 Week prior notice |
| **Bereavement Leave** | Up to 5 Days | Immediate occurrence | Notification to HR |

### 2. Leave Application Guidelines
- **Casual Leave (CL):** Intended for personal errands, family commitments, and unexpected urgent matters. Maximum 3 consecutive CL days permitted.
- **Sick Leave (SL):** For personal medical illness or injury. Any sick leave extending beyond **2 consecutive days** requires a valid medical certificate from a registered practitioner upon resume.
- **Earned Leave (EL):** For planned vacations and rest. Must be planned in consultation with the Project/Team Lead to avoid sprint disruption.

### 3. Leave Encashment & Carry-Forward Policy
- A maximum of **15 Earned Leaves (EL)** can be carried forward into the subsequent calendar year.
- Unused Casual and Sick leaves expire on December 31st each year and cannot be encashed or carried forward.

### 4. Leave Approval Hierarchy
- Leaves of 1 to 2 days require approval from the **Team Lead**.
- Leaves exceeding 3 days require joint approval from the **Team Lead and HR Manager**.`,
    },
    {
      title: 'Remote & Hybrid Work (Work From Home) Policy',
      category: 'REMOTE_WORK',
      version: '1.5',
      status: 'PUBLISHED',
      targetAudience: 'ALL',
      isMandatory: false,
      requiresAcknowledgement: true,
      authorName: 'Operations & HR',
      description: 'Rules for hybrid working arrangements, WFH allowances, connectivity requirements, and productivity expectations.',
      content: `### 1. Policy Overview
**${companyName}** fosters a flexible and results-driven hybrid work environment where eligible team members may work remotely while ensuring team collaboration and data security.

### 2. Hybrid Work Allocation
- Full-time confirmed employees are eligible for up to **2 Work-From-Home (WFH) days per month** or customized hybrid schedules agreed with department leadership.
- WFH requests must be submitted through the HCM portal at least **24 hours in advance** and approved by the Team Lead.

### 3. Working Expectations During WFH
- **Availability:** Team members must be available and reachable on Slack/Teams and email during standard shift hours (${login12} - ${logout12}).
- **Internet & Hardware:** Stable broadband connection (>20 Mbps) and functional webcam/audio hardware for video calls.
- **Daily Check-in & Standups:** Attendance in daily morning sprint standups is mandatory.
- **Task Tracking:** All project tasks, status changes, and time logs must be updated on the Kanban board in real time.`,
    },
    {
      title: 'Code of Conduct, Workplace Ethics & Anti-Harassment (POSH)',
      category: 'CONDUCT',
      version: '2.0',
      status: 'PUBLISHED',
      targetAudience: 'ALL',
      isMandatory: true,
      requiresAcknowledgement: true,
      authorName: 'Legal & Ethics Committee',
      description: 'Zero-tolerance policy towards harassment, POSH guidelines, equal opportunity, confidentiality, and ethical workplace conduct.',
      content: `### 1. Equal Opportunity & Zero Tolerance
**${companyName}** is committed to fostering a safe, inclusive, and professional work environment free from any form of discrimination, bias, or harassment based on gender, race, religion, sexual orientation, disability, or age.

### 2. Prevention of Sexual Harassment (POSH)
- Any unwelcome physical, verbal, non-verbal, or digital conduct of a sexual nature is strictly prohibited.
- An independent **Internal Complaints Committee (ICC)** handles all POSH grievances in strict confidentiality.
- Complaints can be filed directly to \`posh-cell@\${companyName.toLowerCase().replace(/\\s+/g, '')}.com\` or directly to HR.

### 3. Information Security & Client Confidentiality
- Employees must never share credentials, client data, source code, or proprietary documents with external third parties.
- All company-provided laptops and accounts must employ two-factor authentication (2FA).`,
    },
    {
      title: 'Travel, Local Conveyance & Expense Reimbursement Policy',
      category: 'EXPENSES',
      version: '1.2',
      status: 'PUBLISHED',
      targetAudience: 'ALL',
      isMandatory: false,
      requiresAcknowledgement: false,
      authorName: 'Finance & Accounts',
      description: 'Guidelines on claiming official travel allowances, local conveyance, client dining, and expense submission deadlines.',
      content: `### 1. Eligible Reimbursable Expenses
- **Local Client Travel:** Fuel allowance at ₹9/km for 2-wheelers and ₹14/km for 4-wheelers, or actual Uber/Ola/cab receipts.
- **Domestic Business Travel:** Economy airfare or 2nd AC rail tickets booked with prior manager authorization.
- **Client Meals & Entertainment:** Approved business lunches/dinners with itemized GST invoices.

### 2. Submission & Reimbursement Cycle
- Expense claims must be submitted within **15 days** of the expense date via the Finance Management portal.
- All claims must be accompanied by valid GST tax receipts/invoices.
- Approved claims are reimbursed in the subsequent month's payroll cycle.`,
    },
    {
      title: 'Performance Appraisal, Quarterly KPIs & Evaluation Policy',
      category: 'APPRAISAL',
      version: '1.8',
      status: 'PUBLISHED',
      targetAudience: 'ALL',
      isMandatory: false,
      requiresAcknowledgement: true,
      authorName: 'People Operations',
      description: 'Framework for sprint points evaluation, quarterly KPI reviews, self-assessments, and annual salary increments.',
      content: `### 1. Appraisal Cycle & Cadence
- **Sprint & Task Evaluations:** Evaluated continuously per sprint based on task complexity points and code quality.
- **Quarterly Performance Reviews (QPR):** Formal quarterly discussions between Team Lead, Employee, and HR.
- **Annual Compensation Review:** Conducted in March/April based on cumulative annual performance scores.

### 2. Evaluation Metrics Breakdown
- **Sprint Deliverables & Velocity (40%):** On-time task completion and milestone adherence.
- **Code & Work Quality (30%):** Clean architecture, minimal rework, and peer review standards.
- **Team Collaboration & Initiative (20%):** Mentorship, problem-solving, and cross-functional support.
- **Skill Track & Learning (10%):** Continuous upskilling and certification modules.`,
    }
  ];
}

// -----------------------------------------------------------------------------
// 1. GET /api/policies - Fetch list of policies (with user acknowledgement info)
// -----------------------------------------------------------------------------
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const userRole = String(user.role || '').toUpperCase();
    const { category, search, status } = req.query;

    // Resolve company
    const adminEmail = (user.email || '').toLowerCase().trim();
    const userDomain = adminEmail.includes('@') ? adminEmail.split('@')[1] : '';

    let company = await prisma.company.findFirst({
      where: {
        OR: [
          { adminEmail: { equals: adminEmail, mode: 'insensitive' } },
          { adminId: user.id },
          ...(userDomain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(userDomain)
            ? [{ domain: { equals: userDomain, mode: 'insensitive' } }]
            : []),
        ]
      }
    });

    if (!company) {
      company = await prisma.company.findFirst();
    }

    const companyId = company?.id;

    // Check count of existing policies in database
    const policyCount = await prisma.hrPolicy.count({
      where: companyId ? { companyId } : {}
    });

    // Auto-seed default realistic policies if database has 0 policies for this company
    if (policyCount === 0) {
      const defaultPolicies = generateDefaultPolicies(company?.name || 'Company', {
        loginTime: company?.loginTime || '09:30',
        logoutTime: company?.logoutTime || '18:30',
        lateGracePeriod: company?.lateGracePeriod ?? 15,
        breakAllowance: company?.breakAllowance ?? 60,
        weekendPolicy: company?.weekendPolicy || 'ALL_SATURDAYS_OFF',
      });

      for (const p of defaultPolicies) {
        await prisma.hrPolicy.create({
          data: {
            title: p.title,
            category: p.category,
            version: p.version,
            status: p.status,
            targetAudience: p.targetAudience,
            isMandatory: p.isMandatory,
            requiresAcknowledgement: p.requiresAcknowledgement,
            description: p.description,
            content: p.content,
            authorName: p.authorName,
            createdByAdmin: company?.adminEmail || 'admin@hrms.com',
            companyId: companyId || null,
            domain: company?.domain || userDomain || null,
          }
        });
      }
    }

    // Query policies
    const where = {
      ...(companyId ? { companyId } : {}),
      ...(category && category !== 'ALL' ? { category } : {}),
      // Employees and Team Leads only see PUBLISHED policies
      ...(['EMPLOYEE', 'TEAM_LEAD'].includes(userRole) ? { status: 'PUBLISHED' } : (status ? { status } : {})),
      ...(search ? {
        OR: [
          { title: { contains: String(search), mode: 'insensitive' } },
          { description: { contains: String(search), mode: 'insensitive' } },
          { category: { contains: String(search), mode: 'insensitive' } },
          { content: { contains: String(search), mode: 'insensitive' } },
        ]
      } : {})
    };

    const policies = await prisma.hrPolicy.findMany({
      where,
      include: {
        acknowledgements: {
          select: {
            id: true,
            userId: true,
            userName: true,
            userEmail: true,
            acknowledgedAt: true,
          }
        }
      },
      orderBy: [
        { isMandatory: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    // Attach acknowledgement status for the logged-in user
    const enhancedPolicies = policies.map(p => {
      const userAck = p.acknowledgements.find(a => a.userId === user.id);
      return {
        ...p,
        isAcknowledged: Boolean(userAck),
        acknowledgedAt: userAck ? userAck.acknowledgedAt : null,
        acknowledgementCount: p.acknowledgements.length,
      };
    });

    res.json({
      success: true,
      companySettings: {
        companyName: company?.name || 'Company',
        loginTime: company?.loginTime || '09:30',
        logoutTime: company?.logoutTime || '18:30',
        lateGracePeriod: company?.lateGracePeriod ?? 15,
        breakAllowance: company?.breakAllowance ?? 60,
        sprintQuota: company?.sprintQuota ?? 40,
        weekendPolicy: company?.weekendPolicy || 'ALL_SATURDAYS_OFF',
      },
      policies: enhancedPolicies,
      totalCount: enhancedPolicies.length,
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ error: 'Failed to fetch HR policies', message: error.message });
  }
});

// -----------------------------------------------------------------------------
// 2. GET /api/policies/config - Get company timing and shift policy config
// -----------------------------------------------------------------------------
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const adminEmail = (user.email || '').toLowerCase().trim();
    const userDomain = adminEmail.includes('@') ? adminEmail.split('@')[1] : '';

    let company = await prisma.company.findFirst({
      where: {
        OR: [
          { adminEmail: { equals: adminEmail, mode: 'insensitive' } },
          { adminId: user.id },
          ...(userDomain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(userDomain)
            ? [{ domain: { equals: userDomain, mode: 'insensitive' } }]
            : []),
        ]
      }
    });

    if (!company) {
      company = await prisma.company.findFirst();
    }

    res.json({
      success: true,
      companyId: company?.id,
      companyName: company?.name || 'Organization',
      loginTime: company?.loginTime || '09:30',
      logoutTime: company?.logoutTime || '18:30',
      lateGracePeriod: company?.lateGracePeriod ?? 15,
      breakAllowance: company?.breakAllowance ?? 60,
      sprintQuota: company?.sprintQuota ?? 40,
      weekendPolicy: company?.weekendPolicy || 'ALL_SATURDAYS_OFF',
    });
  } catch (error) {
    console.error('Error fetching policy config:', error);
    res.status(500).json({ error: 'Failed to fetch policy configuration', message: error.message });
  }
});

// -----------------------------------------------------------------------------
// 3. PUT /api/policies/config - Update company timing and shift policy config
// -----------------------------------------------------------------------------
router.put('/config', authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'HR'), async (req, res) => {
  try {
    const { loginTime, logoutTime, lateGracePeriod, breakAllowance, sprintQuota, weekendPolicy, companyName } = req.body;
    const user = req.user;
    const adminEmail = (user.email || '').toLowerCase().trim();
    const userDomain = adminEmail.includes('@') ? adminEmail.split('@')[1] : '';

    let company = await prisma.company.findFirst({
      where: {
        OR: [
          { adminEmail: { equals: adminEmail, mode: 'insensitive' } },
          { adminId: user.id },
          ...(userDomain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(userDomain)
            ? [{ domain: { equals: userDomain, mode: 'insensitive' } }]
            : []),
        ]
      }
    });

    if (!company) {
      company = await prisma.company.findFirst();
    }

    if (!company) {
      return res.status(404).json({ error: 'Company record not found' });
    }

    const updatedCompany = await prisma.company.update({
      where: { id: company.id },
      data: {
        ...(loginTime ? { loginTime } : {}),
        ...(logoutTime ? { logoutTime } : {}),
        ...(lateGracePeriod !== undefined ? { lateGracePeriod: Number(lateGracePeriod) } : {}),
        ...(breakAllowance !== undefined ? { breakAllowance: Number(breakAllowance) } : {}),
        ...(sprintQuota !== undefined ? { sprintQuota: Number(sprintQuota) } : {}),
        ...(weekendPolicy ? { weekendPolicy } : {}),
        ...(companyName ? { name: companyName } : {}),
      }
    });

    // Optionally update the Timings & Grace Period policies in DB to match new values
    if (loginTime || logoutTime || lateGracePeriod !== undefined) {
      const defaultPols = generateDefaultPolicies(updatedCompany.name, {
        loginTime: updatedCompany.loginTime,
        logoutTime: updatedCompany.logoutTime,
        lateGracePeriod: updatedCompany.lateGracePeriod,
        breakAllowance: updatedCompany.breakAllowance,
        weekendPolicy: updatedCompany.weekendPolicy,
      });

      // Update timing policy
      const timingPol = defaultPols.find(p => p.category === 'TIMINGS');
      if (timingPol) {
        await prisma.hrPolicy.updateMany({
          where: { companyId: updatedCompany.id, category: 'TIMINGS' },
          data: {
            description: timingPol.description,
            content: timingPol.content,
          }
        });
      }

      // Update grace period policy
      const gracePol = defaultPols.find(p => p.category === 'GRACE_PERIOD');
      if (gracePol) {
        await prisma.hrPolicy.updateMany({
          where: { companyId: updatedCompany.id, category: 'GRACE_PERIOD' },
          data: {
            description: gracePol.description,
            content: gracePol.content,
          }
        });
      }
    }

    res.json({
      success: true,
      message: 'Company shift & policy configuration updated successfully',
      company: updatedCompany,
    });
  } catch (error) {
    console.error('Error updating policy config:', error);
    res.status(500).json({ error: 'Failed to update policy config', message: error.message });
  }
});

// -----------------------------------------------------------------------------
// 4. POST /api/policies - Create a new HR policy (HR, Admin, Super Admin)
// -----------------------------------------------------------------------------
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'HR'), async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      content,
      effectiveDate,
      version,
      status,
      targetAudience,
      isMandatory,
      requiresAcknowledgement,
      tags,
      authorName
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const user = req.user;
    const adminEmail = (user.email || '').toLowerCase().trim();
    const userDomain = adminEmail.includes('@') ? adminEmail.split('@')[1] : '';

    let company = await prisma.company.findFirst({
      where: {
        OR: [
          { adminEmail: { equals: adminEmail, mode: 'insensitive' } },
          { adminId: user.id },
          ...(userDomain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(userDomain)
            ? [{ domain: { equals: userDomain, mode: 'insensitive' } }]
            : []),
        ]
      }
    });

    if (!company) {
      company = await prisma.company.findFirst();
    }

    const newPolicy = await prisma.hrPolicy.create({
      data: {
        title: title.trim(),
        category: category || 'GENERAL',
        description: description?.trim() || null,
        content: content.trim(),
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        version: version || '1.0',
        status: status || 'PUBLISHED',
        targetAudience: targetAudience || 'ALL',
        isMandatory: Boolean(isMandatory),
        requiresAcknowledgement: Boolean(requiresAcknowledgement),
        tags: Array.isArray(tags) ? tags.join(',') : (tags || null),
        authorName: authorName || user.fullName || 'HR Operations',
        createdById: user.id,
        createdByAdmin: user.email,
        companyId: company?.id || null,
        domain: company?.domain || userDomain || null,
      },
      include: {
        acknowledgements: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'HR Policy created successfully',
      policy: newPolicy
    });
  } catch (error) {
    console.error('Error creating HR policy:', error);
    res.status(500).json({ error: 'Failed to create HR policy', message: error.message });
  }
});

// -----------------------------------------------------------------------------
// 5. PUT /api/policies/:id - Update an existing HR policy
// -----------------------------------------------------------------------------
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'HR'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      description,
      content,
      effectiveDate,
      version,
      status,
      targetAudience,
      isMandatory,
      requiresAcknowledgement,
      tags,
      authorName
    } = req.body;

    const existing = await prisma.hrPolicy.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const updated = await prisma.hrPolicy.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(category ? { category } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(content ? { content: content.trim() } : {}),
        ...(effectiveDate ? { effectiveDate: new Date(effectiveDate) } : {}),
        ...(version ? { version } : {}),
        ...(status ? { status } : {}),
        ...(targetAudience ? { targetAudience } : {}),
        ...(isMandatory !== undefined ? { isMandatory: Boolean(isMandatory) } : {}),
        ...(requiresAcknowledgement !== undefined ? { requiresAcknowledgement: Boolean(requiresAcknowledgement) } : {}),
        ...(tags !== undefined ? { tags: Array.isArray(tags) ? tags.join(',') : tags } : {}),
        ...(authorName ? { authorName } : {}),
      },
      include: {
        acknowledgements: true
      }
    });

    res.json({
      success: true,
      message: 'HR Policy updated successfully',
      policy: updated
    });
  } catch (error) {
    console.error('Error updating HR policy:', error);
    res.status(500).json({ error: 'Failed to update HR policy', message: error.message });
  }
});

// -----------------------------------------------------------------------------
// 6. DELETE /api/policies/:id - Delete an HR policy
// -----------------------------------------------------------------------------
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'HR'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.hrPolicy.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    await prisma.hrPolicy.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'HR Policy deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Error deleting HR policy:', error);
    res.status(500).json({ error: 'Failed to delete HR policy', message: error.message });
  }
});

// -----------------------------------------------------------------------------
// 7. POST /api/policies/:id/acknowledge - Record user acknowledgement
// -----------------------------------------------------------------------------
router.post('/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const policy = await prisma.hrPolicy.findUnique({
      where: { id }
    });

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    const ack = await prisma.hrPolicyAcknowledgement.upsert({
      where: {
        policyId_userId: {
          policyId: id,
          userId: user.id
        }
      },
      update: {
        acknowledgedAt: new Date()
      },
      create: {
        policyId: id,
        userId: user.id,
        userName: user.fullName || user.email,
        userEmail: user.email,
        acknowledgedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Policy acknowledged successfully',
      acknowledgement: ack
    });
  } catch (error) {
    console.error('Error acknowledging policy:', error);
    res.status(500).json({ error: 'Failed to record acknowledgement', message: error.message });
  }
});

// -----------------------------------------------------------------------------
// 8. POST /api/policies/seed - Re-seed standard company policies
// -----------------------------------------------------------------------------
router.post('/seed', authenticateToken, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'HR'), async (req, res) => {
  try {
    const user = req.user;
    const adminEmail = (user.email || '').toLowerCase().trim();
    const userDomain = adminEmail.includes('@') ? adminEmail.split('@')[1] : '';

    let company = await prisma.company.findFirst({
      where: {
        OR: [
          { adminEmail: { equals: adminEmail, mode: 'insensitive' } },
          { adminId: user.id },
          ...(userDomain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(userDomain)
            ? [{ domain: { equals: userDomain, mode: 'insensitive' } }]
            : []),
        ]
      }
    });

    if (!company) {
      company = await prisma.company.findFirst();
    }

    const defaultPolicies = generateDefaultPolicies(company?.name || 'Company', {
      loginTime: company?.loginTime || '09:30',
      logoutTime: company?.logoutTime || '18:30',
      lateGracePeriod: company?.lateGracePeriod ?? 15,
      breakAllowance: company?.breakAllowance ?? 60,
      weekendPolicy: company?.weekendPolicy || 'ALL_SATURDAYS_OFF',
    });

    let createdCount = 0;
    for (const p of defaultPolicies) {
      // Upsert by title & companyId
      const existing = await prisma.hrPolicy.findFirst({
        where: {
          title: p.title,
          ...(company?.id ? { companyId: company.id } : {})
        }
      });

      if (!existing) {
        await prisma.hrPolicy.create({
          data: {
            title: p.title,
            category: p.category,
            version: p.version,
            status: p.status,
            targetAudience: p.targetAudience,
            isMandatory: p.isMandatory,
            requiresAcknowledgement: p.requiresAcknowledgement,
            description: p.description,
            content: p.content,
            authorName: p.authorName,
            createdByAdmin: company?.adminEmail || user.email,
            companyId: company?.id || null,
            domain: company?.domain || userDomain || null,
          }
        });
        createdCount++;
      }
    }

    res.json({
      success: true,
      message: `Seeded ${createdCount} new standard HR policies`,
      seededCount: createdCount
    });
  } catch (error) {
    console.error('Error seeding HR policies:', error);
    res.status(500).json({ error: 'Failed to seed HR policies', message: error.message });
  }
});

module.exports = router;
